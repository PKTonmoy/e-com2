import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, 3000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-50 space-y-3">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className="bg-ivory/95 dark:bg-matte/95 backdrop-blur-md border border-gold/30 rounded-lg p-4 shadow-xl animate-slide-in-right flex items-center gap-3 min-w-[300px]"
                    >
                        <CheckCircleIcon className="h-6 w-6 text-gold flex-shrink-0" />
                        <p className="text-sm font-body text-matte dark:text-ivory flex-1">
                            {toast.message}
                        </p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-neutral-500 hover:text-gold transition"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
