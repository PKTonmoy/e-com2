/**
 * Google OAuth Callback Page
 * Handles the redirect after Google authentication
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

const GoogleCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [error, setError] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');
        const errorParam = searchParams.get('error');

        if (errorParam) {
            // Handle specific error types
            const errorMessages = {
                consent_denied: 'You declined the Google sign-in request.',
                invalid_state: 'Invalid session. Please try again.',
                state_expired: 'Session expired. Please try again.',
                verification_failed: 'Could not verify your Google account. Please try again.',
                no_code: 'Authentication failed. Please try again.',
            };
            setError(errorMessages[errorParam] || 'An error occurred during sign-in.');

            // Redirect to login after showing error
            setTimeout(() => navigate('/login'), 3000);
            return;
        }

        if (token) {
            // Store the token
            localStorage.setItem('token', token);

            // Invalidate user query to fetch fresh data
            queryClient.invalidateQueries(['me']);

            // Redirect to home
            navigate('/', { replace: true });
        } else {
            setError('No authentication token received.');
            setTimeout(() => navigate('/login'), 3000);
        }
    }, [searchParams, navigate, queryClient]);

    if (error) {
        return (
            <div className="lux-container py-16 flex justify-center">
                <div className="lux-card p-6 text-center max-w-md">
                    <div className="text-red-500 text-5xl mb-4">✕</div>
                    <h1 className="lux-heading text-xl mb-2">Sign-in Failed</h1>
                    <p className="text-neutral-600 dark:text-neutral-400">{error}</p>
                    <p className="text-sm text-neutral-500 mt-4">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="lux-container py-16 flex justify-center">
            <div className="lux-card p-6 text-center max-w-md">
                <div className="animate-spin w-8 h-8 border-4 border-gold border-t-transparent rounded-full mx-auto mb-4"></div>
                <h1 className="lux-heading text-xl">Completing sign-in...</h1>
            </div>
        </div>
    );
};

export default GoogleCallback;
