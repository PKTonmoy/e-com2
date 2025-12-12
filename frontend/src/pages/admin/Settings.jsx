import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { BellIcon, EnvelopeIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import api from '../../lib/api.js';
import { useToast } from '../../components/ToastProvider.jsx';

const Settings = () => {
    const qc = useQueryClient();
    const { addToast } = useToast();

    // Local state for toggles
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [telegramEnabled, setTelegramEnabled] = useState(true);
    const [whatsappEnabled, setWhatsappEnabled] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Fetch current settings
    const { data: settings, isLoading } = useQuery({
        queryKey: ['notification-settings'],
        queryFn: async () => {
            const res = await api.get('/settings/notifications');
            return res.data;
        },
    });

    // Update local state when settings load
    useEffect(() => {
        if (settings) {
            setEmailEnabled(settings.emailEnabled ?? true);
            setTelegramEnabled(settings.telegramEnabled ?? true);
            setWhatsappEnabled(settings.whatsappEnabled ?? false);
            setHasChanges(false);
        }
    }, [settings]);

    // Save mutation
    const saveMutation = useMutation({
        mutationFn: (data) => api.put('/settings/notifications', data),
        onSuccess: () => {
            qc.invalidateQueries(['notification-settings']);
            addToast('Notification settings saved!', 'success');
            setHasChanges(false);
        },
        onError: (err) => {
            addToast(err.response?.data?.message || 'Failed to save settings', 'error');
        },
    });

    const handleToggle = (setter, currentValue) => {
        setter(!currentValue);
        setHasChanges(true);
    };

    const handleSave = () => {
        saveMutation.mutate({
            emailEnabled,
            telegramEnabled,
            whatsappEnabled,
        });
    };

    const handleReset = () => {
        if (settings) {
            setEmailEnabled(settings.emailEnabled ?? true);
            setTelegramEnabled(settings.telegramEnabled ?? true);
            setWhatsappEnabled(settings.whatsappEnabled ?? false);
            setHasChanges(false);
        }
    };

    if (isLoading) {
        return (
            <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-10 max-w-4xl mx-auto">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-48"></div>
                    <div className="h-32 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-10 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-gold/20 rounded-lg">
                    <BellIcon className="h-6 w-6 text-gold" />
                </div>
                <div>
                    <h1 className="font-display text-xl sm:text-2xl text-matte dark:text-ivory">Settings</h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Manage notification preferences</p>
                </div>
            </div>

            {/* Notification Channels */}
            <div className="lux-card p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gold/20">
                    <h2 className="font-display text-lg text-matte dark:text-ivory">Notification Channels</h2>
                    {hasChanges && (
                        <span className="text-xs text-gold animate-pulse">Unsaved changes</span>
                    )}
                </div>

                {/* Email Toggle */}
                <div className="flex items-center justify-between py-4 border-b border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                            <EnvelopeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-matte dark:text-ivory">Email Notifications</h3>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                Receive order updates via email (Resend)
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleToggle(setEmailEnabled, emailEnabled)}
                        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 ${emailEnabled ? 'bg-gold' : 'bg-neutral-300 dark:bg-neutral-600'
                            }`}
                    >
                        <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${emailEnabled ? 'translate-x-8' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>

                {/* Telegram Toggle */}
                <div className="flex items-center justify-between py-4 border-b border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-sky-100 dark:bg-sky-900/30 rounded-xl">
                            <svg className="h-6 w-6 text-sky-500" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-matte dark:text-ivory">Telegram Notifications</h3>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                Get instant alerts via Telegram bot
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleToggle(setTelegramEnabled, telegramEnabled)}
                        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 ${telegramEnabled ? 'bg-gold' : 'bg-neutral-300 dark:bg-neutral-600'
                            }`}
                    >
                        <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${telegramEnabled ? 'translate-x-8' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>

                {/* WhatsApp Toggle */}
                <div className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-xl">
                            <ChatBubbleLeftRightIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-matte dark:text-ivory">WhatsApp Notifications</h3>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                Receive updates via WhatsApp (Twilio)
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleToggle(setWhatsappEnabled, whatsappEnabled)}
                        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 ${whatsappEnabled ? 'bg-gold' : 'bg-neutral-300 dark:bg-neutral-600'
                            }`}
                    >
                        <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${whatsappEnabled ? 'translate-x-8' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
            </div>

            {/* Active Channels Summary */}
            <div className="lux-card p-4">
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                    <span className="font-semibold">Active channels:</span>{' '}
                    {[emailEnabled && 'Email', telegramEnabled && 'Telegram', whatsappEnabled && 'WhatsApp']
                        .filter(Boolean)
                        .join(', ') || 'None'}
                </p>
            </div>

            {/* Save Button */}
            <div className="flex gap-3 justify-end">
                {hasChanges && (
                    <button
                        onClick={handleReset}
                        className="px-6 py-2.5 text-sm font-medium text-neutral-600 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                        Reset
                    </button>
                )}
                <button
                    onClick={handleSave}
                    disabled={!hasChanges || saveMutation.isPending}
                    className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${hasChanges
                            ? 'bg-gold text-white hover:bg-gold/90 shadow-lg shadow-gold/25'
                            : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'
                        }`}
                >
                    {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
                </button>
            </div>

            {/* Info Note */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Note:</strong> Make sure you have configured the required environment variables for each channel
                    (API keys, tokens, etc.) in your backend <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">.env</code> file.
                </p>
            </div>
        </div>
    );
};

export default Settings;
