import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

const CourierServiceContext = createContext(null);

export const useCourierService = () => {
    const context = useContext(CourierServiceContext);
    if (!context) {
        throw new Error('useCourierService must be used within CourierServiceProvider');
    }
    return context;
};

export const CourierServiceProvider = ({ children }) => {
    const queryClient = useQueryClient();
    const [hasShownPopup, setHasShownPopup] = useState(false);
    const [showDisabledPopup, setShowDisabledPopup] = useState(false);

    // Fetch courier settings
    const { data: courierSettings, isLoading, refetch } = useQuery({
        queryKey: ['courier-settings'],
        queryFn: async () => {
            const res = await api.get('/settings/courier');
            return res.data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
    });

    const courierEnabled = courierSettings?.enabled ?? true;

    // Toggle mutation
    const toggleMutation = useMutation({
        mutationFn: async (enabled) => {
            const res = await api.put('/settings/courier', { enabled });
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['courier-settings']);

            // When courier is turned ON, sync all courier-related data from API
            if (data?.settings?.enabled) {
                // Invalidate and refetch all courier-related queries
                queryClient.invalidateQueries(['courier-balance']);
                queryClient.invalidateQueries(['courier-returns']);
                queryClient.invalidateQueries(['courier-payments']);
                queryClient.invalidateQueries(['admin-orders']); // Refresh orders too for courier status
                console.log('[Courier Service] Enabled - syncing all courier data from API');
            }
        },
    });

    const toggleCourier = useCallback((enabled) => {
        toggleMutation.mutate(enabled);
    }, [toggleMutation]);

    // Show popup when courier is disabled (only once per session)
    useEffect(() => {
        if (!isLoading && !courierEnabled && !hasShownPopup) {
            setShowDisabledPopup(true);
            setHasShownPopup(true);
        }
    }, [isLoading, courierEnabled, hasShownPopup]);

    const dismissPopup = () => setShowDisabledPopup(false);

    const value = {
        courierEnabled,
        courierSettings,
        isLoading,
        toggleCourier,
        isToggling: toggleMutation.isPending,
        showDisabledPopup,
        dismissPopup,
        refetch,
    };

    return (
        <CourierServiceContext.Provider value={value}>
            {children}
        </CourierServiceContext.Provider>
    );
};

export default CourierServiceContext;
