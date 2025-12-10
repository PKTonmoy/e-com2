/**
 * Google OAuth Callback Page
 * Handles the redirect after Google authentication
 * Shows profile completion form if user needs to add phone/address
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import api from '../lib/api.js';

const GoogleCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [error, setError] = useState('');
    const [showProfileForm, setShowProfileForm] = useState(false);
    const [profileForm, setProfileForm] = useState({
        phone: '',
        address: '',
    });
    const [saving, setSaving] = useState(false);

    // Check if user needs to complete profile
    const { data: user, refetch: refetchUser } = useQuery({
        queryKey: ['me'],
        queryFn: async () => {
            try {
                const res = await api.get('/auth/me');
                return res.data;
            } catch {
                return null;
            }
        },
        enabled: false, // Don't auto-fetch
    });

    useEffect(() => {
        const token = searchParams.get('token');
        const errorParam = searchParams.get('error');

        if (errorParam) {
            const errorMessages = {
                consent_denied: 'You declined the Google sign-in request.',
                invalid_state: 'Invalid session. Please try again.',
                state_expired: 'Session expired. Please try again.',
                verification_failed: 'Could not verify your Google account. Please try again.',
                no_code: 'Authentication failed. Please try again.',
            };
            setError(errorMessages[errorParam] || 'An error occurred during sign-in.');
            setTimeout(() => navigate('/login'), 3000);
            return;
        }

        if (token) {
            localStorage.setItem('token', token);

            // Fetch user to check if profile is complete
            api.get('/auth/me').then(res => {
                const userData = res.data;
                if (!userData.profileComplete && !userData.phone) {
                    // Show profile completion form
                    setShowProfileForm(true);
                } else {
                    // Profile is complete, redirect to home
                    queryClient.invalidateQueries(['me']);
                    navigate('/', { replace: true });
                }
            }).catch(() => {
                setError('Failed to fetch user data.');
                setTimeout(() => navigate('/login'), 3000);
            });
        } else {
            setError('No authentication token received.');
            setTimeout(() => navigate('/login'), 3000);
        }
    }, [searchParams, navigate, queryClient]);

    const handleProfileSubmit = async (e) => {
        e.preventDefault();

        if (!profileForm.phone || !profileForm.address) {
            setError('Please fill in all fields.');
            return;
        }

        setSaving(true);
        try {
            await api.put('/auth/me', profileForm);
            queryClient.invalidateQueries(['me']);
            navigate('/', { replace: true });
        } catch (err) {
            setError('Failed to save profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (error && !showProfileForm) {
        return (
            <div className="px-4 py-16 flex justify-center">
                <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 text-center max-w-md border border-neutral-100 dark:border-neutral-800">
                    <div className="text-red-500 text-5xl mb-4">✕</div>
                    <h1 className="font-display text-xl text-matte dark:text-ivory mb-2">Sign-in Failed</h1>
                    <p className="text-neutral-600 dark:text-neutral-400">{error}</p>
                    <p className="text-sm text-neutral-500 mt-4">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    if (showProfileForm) {
        return (
            <div className="px-4 py-16 flex justify-center">
                <form onSubmit={handleProfileSubmit} className="bg-white dark:bg-neutral-900 rounded-xl p-6 sm:p-8 max-w-md w-full border border-neutral-100 dark:border-neutral-800 space-y-5">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="font-display text-2xl text-matte dark:text-ivory">Welcome to PRELUX!</h1>
                        <p className="text-sm text-neutral-500 mt-2">Complete your profile to continue</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1.5">Mobile Number *</label>
                        <input
                            type="tel"
                            className="w-full border border-neutral-200 dark:border-neutral-700 p-3 rounded-lg bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
                            placeholder="+1 234 567 8900"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1.5">Address *</label>
                        <input
                            type="text"
                            className="w-full border border-neutral-200 dark:border-neutral-700 p-3 rounded-lg bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
                            placeholder="123 Main Street, City, Country"
                            value={profileForm.address}
                            onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-3 bg-gold text-matte font-semibold text-sm uppercase tracking-wider rounded-lg hover:bg-gold/90 transition disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Complete Profile'}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="px-4 py-16 flex justify-center">
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 text-center max-w-md border border-neutral-100 dark:border-neutral-800">
                <div className="animate-spin w-8 h-8 border-4 border-gold border-t-transparent rounded-full mx-auto mb-4"></div>
                <h1 className="font-display text-xl text-matte dark:text-ivory">Completing sign-in...</h1>
            </div>
        </div>
    );
};

export default GoogleCallback;
