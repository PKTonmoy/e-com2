import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/solid';

const Toast = ({
    type = 'info',
    message,
    duration = 3000,
    onUndo,
    onClose,
    isVisible = true
}) => {
    const [show, setShow] = useState(isVisible);

    useEffect(() => {
        setShow(isVisible);
        if (isVisible && duration > 0) {
            const timer = setTimeout(() => {
                setShow(false);
                if (onClose) onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    if (!show) return null;

    const styles = {
        success: {
            icon: CheckCircleIcon,
            bg: 'bg-white dark:bg-matte',
            border: 'border-green-500/20',
            text: 'text-neutral-900 dark:text-ivory',
            iconColor: 'text-green-500'
        },
        error: {
            icon: ExclamationCircleIcon,
            bg: 'bg-white dark:bg-matte',
            border: 'border-red-500/20',
            text: 'text-neutral-900 dark:text-ivory',
            iconColor: 'text-red-500'
        },
        info: {
            icon: InformationCircleIcon,
            bg: 'bg-white dark:bg-matte',
            border: 'border-blue-500/20',
            text: 'text-neutral-900 dark:text-ivory',
            iconColor: 'text-blue-500'
        }
    };

    const currentStyle = styles[type] || styles.info;
    const Icon = currentStyle.icon;

    return (
        <div
            role="alert"
            className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 p-4 rounded-xl shadow-lg border ${currentStyle.bg} ${currentStyle.border} animate-in slide-in-from-bottom-5 duration-300 max-w-sm w-full`}
        >
            <Icon className={`w-6 h-6 flex-shrink-0 ${currentStyle.iconColor}`} />
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${currentStyle.text}`}>{message}</p>
            </div>
            <div className="flex items-center gap-2">
                {onUndo && (
                    <button
                        onClick={onUndo}
                        className="text-xs font-bold text-gold hover:underline"
                    >
                        UNDO
                    </button>
                )}
                <button
                    onClick={() => { setShow(false); if (onClose) onClose(); }}
                    className="text-neutral-400 hover:text-neutral-500 rounded-lg p-1"
                >
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default Toast;
