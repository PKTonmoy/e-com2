import { createContext, useContext, useState, useCallback } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

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

    // options: { type, image, actionLabel, actionLink }
    const addToast = useCallback((message, options = {}) => {
        const id = Date.now();
        // Allow passing string as second arg for backward compatibility (type)
        const opts = typeof options === 'string' ? { type: options } : options;

        setToasts((prev) => [...prev, { id, message, ...opts }]);

        // Auto-dismiss after 4 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, 4000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4 flex flex-col gap-2 items-center pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className="pointer-events-auto flex w-full overflow-hidden rounded-md bg-[#DFDFDF] dark:bg-[#2A2A2A] shadow-2xl animate-in slide-in-from-top-5 fade-in duration-300"
                    >
                        {/* Image Section (if present) */}
                        {toast.image && (
                            <div className="w-20 bg-neutral-200 dark:bg-neutral-800 flex-shrink-0">
                                <img
                                    src={toast.image}
                                    alt="Product"
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        )}

                        {/* Content Section */}
                        <div className="flex-1 p-4 flex flex-col justify-center min-h-[5rem]">
                            <div className="flex justify-between items-start gap-3">
                                <p className="font-display text-sm text-matte dark:text-gray-100 leading-snug">
                                    {toast.message}
                                </p>
                                <button
                                    onClick={() => removeToast(toast.id)}
                                    className="text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white transition -mt-1 -mr-1"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>

                            {toast.actionLink && (
                                <Link
                                    to={toast.actionLink}
                                    onClick={() => removeToast(toast.id)}
                                    className="text-xs font-body uppercase tracking-wider text-neutral-600 dark:text-neutral-300 underline decoration-neutral-400 underline-offset-4 mt-2 hover:text-black dark:hover:text-white transition-colors"
                                >
                                    {toast.actionLabel || 'View Bag'}
                                </Link>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
