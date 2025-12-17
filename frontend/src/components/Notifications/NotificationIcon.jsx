import React from 'react';
import { useNotifications } from '../../context/NotificationContext';

const NotificationIcon = ({ className = "w-6 h-6", onClick }) => {
    const { unreadCount } = useNotifications();

    return (
        <button
            className={`relative w-10 h-10 flex items-center justify-center rounded-full border border-gold/30 hover:bg-gold/10 hover:border-gold transition-all duration-300 focus:outline-none group ${className}`}
            onClick={onClick}
            aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        >
            {/* Bell Icon */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className={`w-5 h-5 text-matte dark:text-ivory transition-transform duration-300 group-hover:scale-110 ${unreadCount > 0 ? 'animate-bell-swing' : ''}`}
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>

            {/* Unread Badge - Premium Gold Dot */}
            {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gold border border-ivory dark:border-matte"></span>
                </span>
            )}
        </button>
    );
};

export default NotificationIcon;
