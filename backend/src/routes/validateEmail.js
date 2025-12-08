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
// MAILBOXLAYER API CALL WITH RETRY (using native http)
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

async function callMailboxlayer(email, attempt = 1) {
    const apiKey = process.env.MAILBOXLAYER_KEY;

    if (!apiKey) {
        console.error('[EmailValidation] MAILBOXLAYER_KEY not configured');
        throw new Error('Email validation service not configured');
    }

    const url = `${config.api.baseUrl}?access_key=${apiKey}&email=${encodeURIComponent(email)}&catch_all=1`;
    console.log(`[EmailValidation] Calling API for domain: @${email.split('@')[1]}`);

    try {
        const response = await httpGet(url, config.api.timeout);

        if (response.status !== 200) {
            throw new Error(`Mailboxlayer API returned ${response.status}`);
        }

        const data = response.data;

        // Check for API errors
        if (data.error) {
            console.error('[EmailValidation] Mailboxlayer API error:', data.error);

            // Alert on critical errors
            if (data.error.code === 101) {
                console.error('[EmailValidation] ALERT: Invalid API key');
            } else if (data.error.code === 104) {
                console.error('[EmailValidation] ALERT: Rate limit reached');
            }

            throw new Error(data.error.info || 'API error');
        }

        return data;
    } catch (error) {
        console.error(`[EmailValidation] API call failed:`, error.message);

        // Retry with exponential backoff
        if (attempt < config.api.retries) {
            const delay = config.api.retryDelay * Math.pow(2, attempt - 1);
            console.log(`[EmailValidation] Retrying in ${delay}ms (attempt ${attempt + 1}/${config.api.retries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return callMailboxlayer(email, attempt + 1);
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

    // 6. Check SMTP and MX validity with score
    const score = data.score ?? 0;
    const hasMx = data.mx_found === true;
    const hasSmtp = data.smtp_check === true;

    if ((hasSmtp || hasMx) && score >= config.minScore) {
        result.valid = true;
        result.reason = 'valid';
        return result;
    }

    // 7. Needs confirmation case
    if (hasMx && score >= config.confirmationScoreRange.min && score < config.confirmationScoreRange.max) {
        result.valid = false;
        result.reason = 'needs_confirmation';
        return result;
    }

    // 8. Default: low score or unverifiable
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

        // Call Mailboxlayer API
        const apiResponse = await callMailboxlayer(normalizedEmail);

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
