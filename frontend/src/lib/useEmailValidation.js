import { useState, useCallback } from 'react';
import api from './api.js';

// Email regex pattern for client-side validation
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * useEmailValidation Hook
 * 
 * Provides client-side regex validation + server-side Mailboxlayer validation
 * 
 * Returns:
 * - isValid: boolean | null (null = not validated yet)
 * - isValidating: boolean (API call in progress)
 * - error: string | null (error message for display)
 * - reason: string | null (validation reason code)
 * - needsConfirmation: boolean (email requires verification)
 * - suggestion: string | null (did you mean suggestion)
 * - validate: (email: string) => Promise<ValidationResult>
 * - validateRegex: (email: string) => boolean (instant check)
 */
export default function useEmailValidation() {
    const [state, setState] = useState({
        isValid: null,
        isValidating: false,
        error: null,
        reason: null,
        needsConfirmation: false,
        suggestion: null,
    });

    /**
     * Fast client-side regex check
     */
    const validateRegex = useCallback((email) => {
        if (!email || typeof email !== 'string') return false;
        return EMAIL_REGEX.test(email.trim());
    }, []);

    /**
     * Full validation with API call
     */
    const validate = useCallback(async (email) => {
        // Reset state
        setState({
            isValid: null,
            isValidating: true,
            error: null,
            reason: null,
            needsConfirmation: false,
            suggestion: null,
        });

        // Quick regex check first
        if (!validateRegex(email)) {
            const result = {
                isValid: false,
                isValidating: false,
                error: 'Please enter a valid email format.',
                reason: 'invalid_format',
                needsConfirmation: false,
                suggestion: null,
            };
            setState(result);
            return result;
        }

        try {
            // Call the backend validation API
            const response = await api.post('/validate-email', { email: email.trim() });
            const data = response.data;

            const result = {
                isValid: data.valid === true,
                isValidating: false,
                error: data.valid ? null : (data.message || 'Email validation failed'),
                reason: data.reason,
                needsConfirmation: data.reason === 'needs_confirmation',
                suggestion: data.suggestion || null,
            };

            setState(result);
            return result;

        } catch (err) {
            // Network or server error - allow signup with unverified flag
            console.error('[useEmailValidation] API error:', err);

            const result = {
                isValid: false,
                isValidating: false,
                error: 'Email validation service is temporarily unavailable.',
                reason: 'validation_service_unavailable',
                needsConfirmation: true, // Allow signup but require verification
                suggestion: null,
            };

            setState(result);
            return result;
        }
    }, [validateRegex]);

    /**
     * Reset validation state
     */
    const reset = useCallback(() => {
        setState({
            isValid: null,
            isValidating: false,
            error: null,
            reason: null,
            needsConfirmation: false,
            suggestion: null,
        });
    }, []);

    return {
        ...state,
        validate,
        validateRegex,
        reset,
    };
}

/**
 * Error messages for each reason code
 */
export const VALIDATION_MESSAGES = {
    invalid_format: 'Please enter a valid email format.',
    disposable_email: 'Disposable email addresses are not allowed. Please use a permanent email.',
    role_email: 'Role-based email addresses (admin@, info@) are not allowed. Please use a personal email.',
    needs_confirmation: 'We will send a verification email to confirm this address.',
    low_score: 'This email address could not be verified. Please use a different email.',
    validation_service_unavailable: 'Email validation is temporarily unavailable. You can proceed but will need to verify your email.',
    valid: '',
};
