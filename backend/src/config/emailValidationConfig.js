/**
 * Email Validation Configuration
 * Adjust these settings to control email validation strictness
 */

export default {
    // Skip Mailboxlayer API call entirely (useful for development or if API is unavailable)
    // When true, any properly formatted email will be accepted
    skipExternalValidation: false, // Set to false to enable Mailboxlayer API

    // Minimum acceptable score from Mailboxlayer (0-1)
    // Higher = stricter, recommended: 0.7
    minScore: 0.7,

    // Score range that requires email confirmation (user can sign up but must verify)
    confirmationScoreRange: {
        min: 0.5,
        max: 0.7,
    },

    // Allow role-based emails (admin@, info@, support@, etc.)
    allowRoleEmails: false,

    // Allow free email providers (Gmail, Yahoo, Outlook, etc.)
    allowFreeEmails: true,

    // Allow disposable email addresses
    allowDisposableEmails: false,

    // Cache settings
    cache: {
        enabled: true,
        ttl: 3600000, // 1 hour in milliseconds
        maxSize: 1000, // Maximum cached entries
    },

    // Rate limiting for validation endpoint
    rateLimit: {
        windowMs: 60000, // 1 minute
        maxRequests: 5, // 5 requests per minute per IP
    },

    // Mailboxlayer API settings
    api: {
        // Uses HTTP for free tier, change to https for paid plans
        baseUrl: 'http://apilayer.net/api/check',
        timeout: 10000, // 10 seconds
        retries: 2,
        retryDelay: 1000, // 1 second initial delay (exponential backoff)
    },

    // Error messages for frontend display
    errorMessages: {
        invalid_format: 'Please enter a valid email address format.',
        disposable_email: 'Disposable email addresses are not allowed. Please use a permanent email.',
        role_email: 'Role-based email addresses (admin@, info@) are not allowed. Please use a personal email.',
        needs_confirmation: 'We could not fully verify this email. Please proceed and confirm via email verification.',
        low_score: 'This email address could not be verified. Please use a different email.',
        validation_service_unavailable: 'Email validation service is temporarily unavailable. Please try again.',
    },
};
