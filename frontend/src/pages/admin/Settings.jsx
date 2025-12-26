import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { BellIcon, EnvelopeIcon, ChatBubbleLeftRightIcon, TruckIcon } from '@heroicons/react/24/outline';
import api from '../../lib/api.js';
import { useToast } from '../../components/ToastProvider.jsx';

const Settings = () => {
    const qc = useQueryClient();
    const { addToast } = useToast();

    // Local state for notification toggles
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [telegramEnabled, setTelegramEnabled] = useState(true);
    const [whatsappEnabled, setWhatsappEnabled] = useState(false);

    // Local state for shipping settings
    const [freeShippingEnabled, setFreeShippingEnabled] = useState(true);
    const [freeShippingThreshold, setFreeShippingThreshold] = useState(5000);
    const [defaultLocalCharge, setDefaultLocalCharge] = useState(50);
    const [defaultOutsideCharge, setDefaultOutsideCharge] = useState(130);

    const [hasChanges, setHasChanges] = useState(false);

    // Fetch notification settings
    const { data: notificationSettings, isLoading: isLoadingNotifications } = useQuery({
        queryKey: ['notification-settings'],
        queryFn: async () => {
            const res = await api.get('/settings/notifications');
            return res.data;
        },
    });

    // Fetch shipping settings
    const { data: shippingSettings, isLoading: isLoadingShipping } = useQuery({
        queryKey: ['shipping-settings'],
        queryFn: async () => {
            const res = await api.get('/settings/shipping');
            return res.data;
        },
    });

    // Update local state when settings load
    useEffect(() => {
        if (notificationSettings) {
            setEmailEnabled(notificationSettings.emailEnabled ?? true);
            setTelegramEnabled(notificationSettings.telegramEnabled ?? true);
            setWhatsappEnabled(notificationSettings.whatsappEnabled ?? false);
        }
    }, [notificationSettings]);

    useEffect(() => {
        if (shippingSettings) {
            setFreeShippingEnabled(shippingSettings.freeShippingEnabled ?? true);
            setFreeShippingThreshold(shippingSettings.freeShippingThreshold ?? 5000);
            setDefaultLocalCharge(shippingSettings.defaultLocalCharge ?? 50);
            setDefaultOutsideCharge(shippingSettings.defaultOutsideCharge ?? 130);
        }
    }, [shippingSettings]);

    // Save notification settings
    const saveNotificationsMutation = useMutation({
        mutationFn: (data) => api.put('/settings/notifications', data),
        onSuccess: () => {
            qc.invalidateQueries(['notification-settings']);
            addToast('Notification settings saved!', 'success');
        },
        onError: (err) => {
            addToast(err.response?.data?.message || 'Failed to save notification settings', 'error');
        },
    });

    // Save shipping settings
    const saveShippingMutation = useMutation({
        mutationFn: (data) => api.put('/settings/shipping', data),
        onSuccess: () => {
            qc.invalidateQueries(['shipping-settings']);
            addToast('Shipping settings saved!', 'success');
        },
        onError: (err) => {
            addToast(err.response?.data?.message || 'Failed to save shipping settings', 'error');
        },
    });

    const handleToggle = (setter, currentValue) => {
        setter(!currentValue);
        setHasChanges(true);
    };

    const handleChange = (setter, value) => {
        setter(value);
        setHasChanges(true);
    };

    const handleSave = async () => {
        try {
            await Promise.all([
                saveNotificationsMutation.mutateAsync({
                    emailEnabled,
                    telegramEnabled,
                    whatsappEnabled,
                }),
                saveShippingMutation.mutateAsync({
                    freeShippingEnabled,
                    freeShippingThreshold: Number(freeShippingThreshold),
                    defaultLocalCharge: Number(defaultLocalCharge),
                    defaultOutsideCharge: Number(defaultOutsideCharge),
                })
            ]);
            setHasChanges(false);
        } catch (error) {
            // Error handling done in mutation callbacks
        }
    };

    const handleReset = () => {
        if (notificationSettings) {
            setEmailEnabled(notificationSettings.emailEnabled ?? true);
            setTelegramEnabled(notificationSettings.telegramEnabled ?? true);
            setWhatsappEnabled(notificationSettings.whatsappEnabled ?? false);
        }
        if (shippingSettings) {
            setFreeShippingEnabled(shippingSettings.freeShippingEnabled ?? true);
            setFreeShippingThreshold(shippingSettings.freeShippingThreshold ?? 5000);
            setDefaultLocalCharge(shippingSettings.defaultLocalCharge ?? 50);
            setDefaultOutsideCharge(shippingSettings.defaultOutsideCharge ?? 130);
        }
        setHasChanges(false);
    };

    const isLoading = isLoadingNotifications || isLoadingShipping;
    const isSaving = saveNotificationsMutation.isPending || saveShippingMutation.isPending;

    if (isLoading) {
        return (
            <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-10 max-w-4xl mx-auto">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-48"></div>
                    <div className="h-32 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
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
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Manage application preferences</p>
                </div>
            </div>

            {hasChanges && (
                <div className="sticky top-20 z-10 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-gold/30 rounded-xl p-4 flex items-center justify-between shadow-lg">
                    <span className="text-sm font-medium text-gold">You have unsaved changes</span>
                    <div className="flex gap-3">
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                            Reset
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-4 py-2 text-xs font-medium bg-gold text-white rounded-lg hover:bg-gold/90 shadow-md transition-all"
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            )}

            {/* Notification Channels */}
            <div className="lux-card p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gold/20">
                    <h2 className="font-display text-lg text-matte dark:text-ivory">Notification Channels</h2>
                    {/* Removed duplicate unsaved changes indicator since we have the sticky header now */}
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

            {/* Shipping Settings */}
            <div className="lux-card p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gold/20">
                    <div className="flex items-center gap-3">
                        <TruckIcon className="h-6 w-6 text-gold" />
                        <h2 className="font-display text-lg text-matte dark:text-ivory">Shipping Configuration</h2>
                    </div>
                </div>

                {/* Free Shipping Toggle */}
                <div className="flex items-center justify-between py-4 border-b border-neutral-200 dark:border-neutral-700">
                    <div>
                        <h3 className="font-semibold text-matte dark:text-ivory">Free Shipping</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Enable automatic free shipping for high-value orders
                        </p>
                    </div>
                    <button
                        onClick={() => handleToggle(setFreeShippingEnabled, freeShippingEnabled)}
                        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 ${freeShippingEnabled ? 'bg-gold' : 'bg-neutral-300 dark:bg-neutral-600'
                            }`}
                    >
                        <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${freeShippingEnabled ? 'translate-x-8' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>

                {/* Threshold & Charges Inputs */}
                <div className="grid gap-6 sm:grid-cols-2 pt-4">
                    {/* Free Shipping Threshold */}
                    <div className={`space-y-2 transition-opacity duration-200 ${!freeShippingEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                        <label className="block text-sm font-medium text-matte dark:text-ivory">
                            Free Shipping Threshold (BDT)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">৳</span>
                            <input
                                type="number"
                                value={freeShippingThreshold}
                                onChange={(e) => handleChange(setFreeShippingThreshold, e.target.value)}
                                className="w-full pl-8 pr-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-gold/50"
                                placeholder="5000"
                            />
                        </div>
                        <p className="text-xs text-neutral-500">Cart total to qualify for free shipping</p>
                    </div>

                    {/* Spacer for grid placement if needed, or just allow flow */}
                    <div className="hidden sm:block"></div>

                    {/* Default Local Charge */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-matte dark:text-ivory">
                            Default Local Delivery Charge
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">৳</span>
                            <input
                                type="number"
                                value={defaultLocalCharge}
                                onChange={(e) => handleChange(setDefaultLocalCharge, e.target.value)}
                                className="w-full pl-8 pr-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-gold/50"
                                placeholder="50"
                            />
                        </div>
                        <p className="text-xs text-neutral-500">Fallback charge for Rajshahi area</p>
                    </div>

                    {/* Default Outside Charge */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-matte dark:text-ivory">
                            Default Outside Delivery Charge
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">৳</span>
                            <input
                                type="number"
                                value={defaultOutsideCharge}
                                onChange={(e) => handleChange(setDefaultOutsideCharge, e.target.value)}
                                className="w-full pl-8 pr-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-gold/50"
                                placeholder="130"
                            />
                        </div>
                        <p className="text-xs text-neutral-500">Fallback charge for other areas</p>
                    </div>
                </div>
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
