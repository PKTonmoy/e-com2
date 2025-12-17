import React, { useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

const NotificationToast = () => {
    const { notifications } = useNotifications();
    const [visible, setVisible] = React.useState(null);

    useEffect(() => {
        // Determine if the latest notification is "new" (e.g. within last 5 seconds)
        // Actually, context updates notifications array. We can track "latest" changes.
        // A simpler way is closely coupling with the socket event in context, 
        // but here we can just watch the [0] index if it changed and is recent.

        if (notifications.length > 0) {
            const latest = notifications[0];
            const now = new Date();
            const created = new Date(latest.createdAt);
            if ((now - created) < 5000) { // Only show if recently created
                setVisible(latest);
                const timer = setTimeout(() => setVisible(null), 5000);
                return () => clearTimeout(timer);
            }
        }
    }, [notifications]);

    if (!visible) return null;

    return (
        <div className="fixed top-4 right-4 z-[100] w-80 bg-white dark:bg-zinc-900 shadow-xl rounded-xl border border-gray-100 dark:border-zinc-800 animate-slide-in p-4 flex gap-3">
            <div className={`mt-1 h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center 
          ${visible.type === 'order' ? 'bg-green-100 text-green-600' :
                    visible.type === 'promo' ? 'bg-purple-100 text-purple-600' :
                        'bg-blue-100 text-blue-600'}`}
            >
                {visible.type === 'order' ? '📦' : visible.type === 'promo' ? '🎉' : '📢'}
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{visible.title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{visible.message}</p>
            </div>
            <button onClick={() => setVisible(null)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
            </button>
        </div>
    );
};

export default NotificationToast;
