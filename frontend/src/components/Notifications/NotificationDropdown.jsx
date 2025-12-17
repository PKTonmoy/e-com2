import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { ShoppingBagIcon, TagIcon, InformationCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

const NotificationDropdown = ({ onClose }) => {
    const { notifications, markAsRead } = useNotifications();
    const navigate = useNavigate();

    // Show only first 6
    const recent = notifications.slice(0, 6);

    const handleItemClick = (notif) => {
        markAsRead([notif._id]);
        if (notif.url) {
            navigate(notif.url);
        }
        if (onClose) onClose();
    };

    const handleViewAll = () => {
        navigate('/notifications');
        if (onClose) onClose();
    };

    // Helper for relative time
    const timeAgo = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = (now - date) / 1000; // seconds

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    const getIcon = (type) => {
        switch (type) {
            case 'order':
                return <ShoppingBagIcon className="w-5 h-5" />;
            case 'promo':
                return <TagIcon className="w-5 h-5" />;
            default:
                return <InformationCircleIcon className="w-5 h-5" />;
        }
    };

    const getIconColors = (type) => {
        switch (type) {
            case 'order':
                return 'bg-gold/10 text-gold border border-gold/20';
            case 'promo':
                return 'bg-purple-900/10 text-purple-600 border border-purple-200 dark:border-purple-800';
            default:
                return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700';
        }
    };

    return (
        <div className="absolute right-0 mt-4 w-96 rounded-2xl bg-ivory dark:bg-matte shadow-2xl border border-gold/20 ring-1 ring-black/5 z-50 overflow-hidden flex flex-col animate-enter">
            <div className="px-6 py-4 border-b border-gold/10 flex justify-between items-center bg-ivory dark:bg-matte">
                <h3 className="font-display text-lg tracking-wide text-matte dark:text-ivory">Notifications</h3>
                <button
                    onClick={() => markAsRead([])}
                    className="text-xs font-medium text-gold hover:text-gold/80 transition-colors uppercase tracking-widest"
                >
                    Mark all read
                </button>
            </div>

            <div className="overflow-y-auto max-h-[420px] custom-scrollbar">
                {recent.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-8 text-center text-neutral-500 dark:text-neutral-400">
                        <InformationCircleIcon className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-sm">No new notifications</p>
                    </div>
                ) : (
                    recent.map((notif) => (
                        <div
                            key={notif._id}
                            onClick={() => handleItemClick(notif)}
                            className={`px-6 py-5 border-b border-gold/5 cursor-pointer group hover:bg-gold/5 transition-all duration-300 ${!notif.isRead ? 'bg-gold/[0.03]' : ''}`}
                        >
                            <div className="flex gap-4 items-start">
                                {/* Type Icon */}
                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${getIconColors(notif.type)}`}>
                                    {getIcon(notif.type)}
                                </div>

                                <div className="flex-1 min-w-0 pt-0.5">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className={`text-sm font-display text-matte dark:text-ivory leading-snug ${!notif.isRead ? 'font-semibold' : ''}`}>
                                            {notif.title}
                                        </p>
                                        {!notif.isRead && (
                                            <span className="h-2 w-2 rounded-full bg-gold flex-shrink-0 mt-1.5 ml-2 animate-pulse"></span>
                                        )}
                                    </div>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-2">
                                        {notif.message}
                                    </p>
                                    <div className="flex items-center gap-1 mt-2 text-xs text-neutral-400 dark:text-neutral-500">
                                        <ClockIcon className="w-3 h-3" />
                                        <span>{timeAgo(notif.createdAt)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 bg-ivory dark:bg-matte border-t border-gold/10 text-center">
                <button
                    onClick={handleViewAll}
                    className="text-xs font-semibold text-matte dark:text-ivory hover:text-gold transition-colors uppercase tracking-[0.15em] py-2 px-4 rounded-full border border-gold/20 hover:border-gold hover:bg-gold/5"
                >
                    View All Notifications
                </button>
            </div>
        </div>
    );
};

export default NotificationDropdown;
