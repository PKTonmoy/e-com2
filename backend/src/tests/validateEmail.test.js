/**
 * Email Validation Unit Tests
 * Tests the validation logic with mock Mailboxlayer responses
 */

// Mock the fetch function
const originalFetch = global.fetch;

// Mock config
const mockConfig = {
    minScore: 0.7,
    confirmationScoreRange: { min: 0.5, max: 0.7 },
    allowRoleEmails: false,
    allowFreeEmails: true,
    allowDisposableEmails: false,
    cache: { enabled: false, ttl: 3600000, maxSize: 1000 },
    rateLimit: { windowMs: 60000, maxRequests: 100 },
    api: { baseUrl: 'http://apilayer.net/api/check', timeout: 10000, retries: 1, retryDelay: 100 },
    errorMessages: {
        invalid_format: 'Please enter a valid email address format.',
        disposable_email: 'Disposable email addresses are not allowed.',
        role_email: 'Role-based email addresses are not allowed.',
        needs_confirmation: 'Email requires verification.',
        low_score: 'Email could not be verified.',
        validation_service_unavailable: 'Validation service unavailable.',
    },
};

// Sample Mailboxlayer responses
const mockResponses = {
    valid: {
        email: 'test@example.com',
        did_you_mean: '',
        user: 'test',
        domain: 'example.com',
        format_valid: true,
        mx_found: true,
        smtp_check: true,
        catch_all: false,
        role: false,
        disposable: false,
        free: false,
        score: 0.85,
    },

    invalidFormat: {
        email: 'notanemail',
        format_valid: false,
        mx_found: false,
        smtp_check: false,
        catch_all: null,
        role: false,
        disposable: false,
        free: false,
        score: 0,
    },

    disposable: {
        email: 'test@tempmail.com',
        format_valid: true,
        mx_found: true,
        smtp_check: true,
        catch_all: false,
        role: false,
        disposable: true,
        free: false,
        score: 0.8,
    },

    roleEmail: {
        email: 'admin@company.com',
        format_valid: true,
        mx_found: true,
        smtp_check: true,
        catch_all: false,
        role: true,
        disposable: false,
        free: false,
        score: 0.9,
    },

    lowScore: {
        email: 'maybe@sketchy.com',
        format_valid: true,
        mx_found: true,
        smtp_check: false,
        catch_all: null,
        role: false,
        disposable: false,
        free: false,
        score: 0.55,
    },

    veryLowScore: {
        email: 'bad@unverifiable.com',
        format_valid: true,
        mx_found: false,
        smtp_check: false,
        catch_all: null,
        role: false,
        disposable: false,
        free: false,
        score: 0.2,
    },

    freeEmail: {
        email: 'user@gmail.com',
        format_valid: true,
        mx_found: true,
        smtp_check: true,
        catch_all: false,
        role: false,
        disposable: false,
        free: true,
        score: 0.9,
    },
};

// Validation logic (extracted for testing)
function evaluateValidation(data, config) {
    const result = {
        valid: false,
        reason: '',
        suggestion: data.did_you_mean || undefined,
    };

    if (data.format_valid === false) {
        result.reason = 'invalid_format';
        return result;
    }

    if (data.disposable === true && !config.allowDisposableEmails) {
        result.reason = 'disposable_email';
        return result;
    }

    if (data.role === true && !config.allowRoleEmails) {
        result.reason = 'role_email';
        return result;
    }

    if (data.free === true && !config.allowFreeEmails) {
        result.reason = 'free_email';
        return result;
    }

    const score = data.score ?? 0;
    const hasMx = data.mx_found === true;
    const hasSmtp = data.smtp_check === true;

    if ((hasSmtp || hasMx) && score >= config.minScore) {
        result.valid = true;
        result.reason = 'valid';
        return result;
    }

    if (hasMx && score >= config.confirmationScoreRange.min && score < config.confirmationScoreRange.max) {
        result.valid = false;
        result.reason = 'needs_confirmation';
        return result;
    }

    result.reason = 'low_score';
    return result;
}

// Tests
describe('Email Validation Logic', () => {

    test('Valid email with high score should pass', () => {
        const result = evaluateValidation(mockResponses.valid, mockConfig);
        expect(result.valid).toBe(true);
        expect(result.reason).toBe('valid');
    });

    test('Invalid format should be rejected', () => {
        const result = evaluateValidation(mockResponses.invalidFormat, mockConfig);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('invalid_format');
    });

    test('Disposable email should be rejected', () => {
        const result = evaluateValidation(mockResponses.disposable, mockConfig);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('disposable_email');
    });

    test('Role email should be rejected when not allowed', () => {
        const result = evaluateValidation(mockResponses.roleEmail, mockConfig);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('role_email');
    });

    test('Role email should pass when allowed', () => {
        const configAllowRole = { ...mockConfig, allowRoleEmails: true };
        const result = evaluateValidation(mockResponses.roleEmail, configAllowRole);
        expect(result.valid).toBe(true);
        expect(result.reason).toBe('valid');
    });

    test('Low score with MX should require confirmation', () => {
        const result = evaluateValidation(mockResponses.lowScore, mockConfig);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('needs_confirmation');
    });

    test('Very low score should be rejected', () => {
        const result = evaluateValidation(mockResponses.veryLowScore, mockConfig);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('low_score');
    });

    test('Free email should pass when allowed', () => {
        const result = evaluateValidation(mockResponses.freeEmail, mockConfig);
        expect(result.valid).toBe(true);
        expect(result.reason).toBe('valid');
    });

    test('Free email should be rejected when not allowed', () => {
        const configNoFree = { ...mockConfig, allowFreeEmails: false };
        const result = evaluateValidation(mockResponses.freeEmail, configNoFree);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('free_email');
    });

    test('Custom score threshold should be respected', () => {
        const strictConfig = { ...mockConfig, minScore: 0.9 };
        const result = evaluateValidation(mockResponses.valid, strictConfig);
        expect(result.valid).toBe(false); // 0.85 < 0.9
    });

});

describe('Email Regex Validation', () => {
    const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    test('Valid emails should pass regex', () => {
        expect(EMAIL_REGEX.test('test@example.com')).toBe(true);
        expect(EMAIL_REGEX.test('user.name+tag@domain.co.uk')).toBe(true);
        expect(EMAIL_REGEX.test('admin@company.org')).toBe(true);
    });

    test('Invalid emails should fail regex', () => {
        expect(EMAIL_REGEX.test('notanemail')).toBe(false);
        expect(EMAIL_REGEX.test('@nodomain.com')).toBe(false);
        expect(EMAIL_REGEX.test('spaces in@email.com')).toBe(false);
    });
});
