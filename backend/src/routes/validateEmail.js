import express from 'express';
import rateLimit from 'express-rate-limit';
import https from 'https';
import http from 'http';
import config from '../config/emailValidationConfig.js';

const router = express.Router();

// ============================================
// IN-MEMORY CACHE
// ============================================
const cache = new Map();

function getCached(email) {
    if (!config.cache.enabled) return null;

    const key = email.toLowerCase();
    const cached = cache.get(key);

    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > config.cache.ttl) {
        cache.delete(key);
        return null;
    }

    return cached.result;
}

function setCache(email, result) {
    if (!config.cache.enabled) return;

    const key = email.toLowerCase();

    // Evict oldest entries if cache is full
    if (cache.size >= config.cache.maxSize) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
    }

    cache.set(key, {
        result,
        timestamp: Date.now(),
    });
}

// ============================================
// RATE LIMITER FOR EMAIL VALIDATION
// ============================================
const emailValidationLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        valid: false,
        reason: 'rate_limited',
        message: 'Too many validation requests. Please try again later.',
    },
    keyGenerator: (req) => {
        // Rate limit by IP
        return req.ip || req.connection.remoteAddress || 'unknown';
    },
});

// ============================================
// ABSTRACT API CALL WITH RETRY (using native https)
// ============================================
function httpGet(url, timeout) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const req = protocol.get(url, { timeout }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    reject(new Error('Invalid JSON response'));
                }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

async function callAbstractAPI(email, attempt = 1) {
    const apiKey = process.env.ABSTRACT_API_KEY;

    if (!apiKey) {
        console.error('[EmailValidation] ABSTRACT_API_KEY not configured');
        throw new Error('Email validation service not configured');
    }

    const url = `${config.api.baseUrl}?api_key=${apiKey}&email=${encodeURIComponent(email)}`;
    console.log(`[EmailValidation] Calling Abstract API for domain: @${email.split('@')[1]}`);

    try {
        const response = await httpGet(url, config.api.timeout);

        if (response.status !== 200) {
            throw new Error(`Abstract API returned ${response.status}`);
        }

        const data = response.data;

        // Check for API errors
        if (data.error) {
            console.error('[EmailValidation] Abstract API error:', data.error);

            // Alert on critical errors
            if (data.error.code === 'invalid_api_key') {
                console.error('[EmailValidation] ALERT: Invalid API key');
            } else if (data.error.code === 'quota_exceeded') {
                console.error('[EmailValidation] ALERT: Rate limit reached');
            }

            throw new Error(data.error.message || 'API error');
        }

        // Transform Abstract Email Reputation API response to match expected format
        // Response structure: email_deliverability, email_quality, email_risk, etc.
        const deliverability = data.email_deliverability || {};
        const quality = data.email_quality || {};

        return {
            email: data.email_address,
            format_valid: deliverability.is_format_valid ?? true,
            disposable: quality.is_disposable ?? false,
            role: quality.is_role ?? false,
            free: quality.is_free_email ?? false,
            mx_found: deliverability.is_mx_valid ?? null,
            smtp_check: deliverability.is_smtp_valid ?? null,
            catch_all: quality.is_catchall ?? null,
            score: quality.score ?? 0,
            did_you_mean: null, // Email Reputation API doesn't have autocorrect
            deliverability: deliverability.status,
            // Additional fields from Email Reputation API
            risk: data.email_risk,
        };
    } catch (error) {
        console.error(`[EmailValidation] API call failed:`, error.message);

        // Retry with exponential backoff
        if (attempt < config.api.retries) {
            const delay = config.api.retryDelay * Math.pow(2, attempt - 1);
            console.log(`[EmailValidation] Retrying in ${delay}ms (attempt ${attempt + 1}/${config.api.retries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return callAbstractAPI(email, attempt + 1);
        }

        throw error;
    }
}

// ============================================
// VALIDATION LOGIC
// ============================================
function evaluateValidation(data) {
    const result = {
        valid: false,
        reason: '',
        suggestion: data.did_you_mean || undefined,
        raw: data,
    };

    // 1. Check format validity
    if (data.format_valid === false) {
        result.reason = 'invalid_format';
        return result;
    }

    // 2. Check disposable email
    if (data.disposable === true && !config.allowDisposableEmails) {
        result.reason = 'disposable_email';
        return result;
    }

    // 3. Check role-based email
    if (data.role === true && !config.allowRoleEmails) {
        result.reason = 'role_email';
        return result;
    }

    // 4. Check free email (if configured to reject)
    if (data.free === true && !config.allowFreeEmails) {
        result.reason = 'free_email';
        return result;
    }

    // 5. Log catch_all if null (plan doesn't support it)
    if (data.catch_all === null) {
        console.log('[EmailValidation] catch_all is null (unsupported by plan) for:', data.email);
    }

    // 6. Check deliverability status (Abstract API primary check)
    // Status can be: "deliverable", "undeliverable", "unknown"
    // ONLY accept "deliverable" as valid - this means API confirmed the mailbox exists
    if (data.deliverability === 'deliverable') {
        result.valid = true;
        result.reason = 'valid';
        return result;
    }

    // 7. If explicitly undeliverable, reject immediately
    if (data.deliverability === 'undeliverable') {
        result.reason = 'low_score';
        return result;
    }

    // 8. Check SMTP and MX validity with score (for paid tiers with score data)
    const score = data.score ?? null;
    const hasMx = data.mx_found === true;
    const hasSmtp = data.smtp_check === true;

    // If we have a valid score (paid tier), use score-based validation
    if (score !== null && score > 0) {
        if ((hasSmtp || hasMx) && score >= config.minScore) {
            result.valid = true;
            result.reason = 'valid';
            return result;
        }

        // Needs confirmation case - medium score
        if (hasMx && score >= config.confirmationScoreRange.min && score < config.confirmationScoreRange.max) {
            result.valid = false;
            result.reason = 'needs_confirmation';
            return result;
        }
    }

    // 9. For "unknown" deliverability (free tier limitation):
    // We can only verify the domain exists, NOT the specific mailbox
    // Mark as "needs_confirmation" so user must verify via email
    if (data.deliverability === 'unknown' && data.format_valid !== false && hasMx) {
        result.valid = false;
        result.reason = 'needs_confirmation';
        return result;
    }

    // 10. Default: low score or unverifiable
    result.reason = 'low_score';
    return result;
}

// ============================================
// MAIN ENDPOINT
// ============================================
router.post('/', emailValidationLimiter, async (req, res) => {
    const { email } = req.body;
    const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

    // Input validation
    if (!email || typeof email !== 'string') {
        return res.status(400).json({
            valid: false,
            reason: 'invalid_format',
            message: 'Email is required',
        });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Log request (without sensitive data)
    console.log(`[EmailValidation] Request ${requestId}: validating email domain @${normalizedEmail.split('@')[1] || 'invalid'}`);

    // Skip external validation if configured (for development or when API is unavailable)
    if (config.skipExternalValidation) {
        console.log(`[EmailValidation] Request ${requestId}: skipping external validation (skipExternalValidation=true)`);
        return res.json({
            valid: true,
            reason: 'valid',
            message: '',
            skipped: true,
        });
    }

    try {
        // Check cache first
        const cached = getCached(normalizedEmail);
        if (cached) {
            console.log(`[EmailValidation] Request ${requestId}: cache hit`);
            return res.json({
                ...cached,
                cached: true,
            });
        }

        // Call Abstract API
        const apiResponse = await callAbstractAPI(normalizedEmail);

        // Evaluate the response
        const result = evaluateValidation(apiResponse);

        // Log result for audit (without exposing raw response in production)
        console.log(`[EmailValidation] Request ${requestId}: result=${result.valid}, reason=${result.reason}, score=${apiResponse.score}`);

        // Cache the result
        setCache(normalizedEmail, result);

        // Add user-friendly message
        result.message = config.errorMessages[result.reason] || '';

        return res.json(result);

    } catch (error) {
        console.error(`[EmailValidation] Request ${requestId}: error -`, error.message);

        // Fallback response on error
        return res.json({
            valid: false,
            reason: 'validation_service_unavailable',
            message: config.errorMessages.validation_service_unavailable,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
});

export default router;
