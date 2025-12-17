import React, { useEffect, useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import {
    CheckCircleIcon,
    TrashIcon,
    EnvelopeOpenIcon,
    ShoppingBagIcon,
    TagIcon,
    InformationCircleIcon,
    ClockIcon,
    BellSlashIcon,
    FunnelIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationsPage = () => {
    const { notifications, fetchNotifications, markAsRead, loading } = useNotifications();
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const filtered = notifications.filter(n => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !n.isRead;
        return n.type === filter;
    });

    const timeAgo = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = (now - date) / 1000;

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    const getIcon = (type) => {
        switch (type) {
            case 'order': return <ShoppingBagIcon className="w-5 h-5" />;
            case 'promo': return <TagIcon className="w-5 h-5" />;
            default: return <InformationCircleIcon className="w-5 h-5" />;
        }
    };

    const getIconColors = (type) => {
        switch (type) {
            case 'order': return 'bg-gold/10 text-gold border-gold/20';
            case 'promo': return 'bg-purple-900/10 text-purple-600 border-purple-200 dark:border-purple-800';
            default: return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700';
        }
    };

    const filters = [
        { id: 'all', label: 'All Notifications', icon: FunnelIcon },
        { id: 'unread', label: 'Unread', icon: EnvelopeOpenIcon },
        { id: 'order', label: 'Orders', icon: ShoppingBagIcon },
        { id: 'promo', label: 'Promotions', icon: TagIcon },
    ];

    return (
        <div className="lux-container py-12 min-h-[70vh]">
            <div className="flex flex-col lg:flex-row gap-12">
                {/* Filters Sidebar */}
                <div className="w-full lg:w-72 flex-shrink-0">
                    <div className="sticky top-24 space-y-8">
                        <div>
                            <h1 className="text-4xl font-display text-matte dark:text-ivory mb-2">Notifications</h1>
                            <p className="text-neutral-500 text-sm">Stay updated with your latest activities.</p>
                        </div>

                        <div className="space-y-2">
                            {filters.map(f => {
                                const Icon = f.icon;
                                const isActive = filter === f.id;
                                return (
                                    <button
                                        key={f.id}
                                        onClick={() => setFilter(f.id)}
                                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group
                                            ${isActive
                                                ? 'bg-gold text-matte shadow-lg shadow-gold/20 font-medium'
                                                : 'text-neutral-600 dark:text-neutral-400 hover:bg-gold/10 hover:text-gold'
                                            }`}
                                    >
                                        <Icon className={`w-5 h-5 ${isActive ? 'text-matte' : 'group-hover:scale-110 transition-transform'}`} />
                                        <span className="tracking-wide">{f.label}</span>
                                        {f.id === 'unread' && notifications.filter(n => !n.isRead).length > 0 && (
                                            <span className="ml-auto bg-white/20 text-xs py-0.5 px-2 rounded-full">
                                                {notifications.filter(n => !n.isRead).length}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-sm text-neutral-500 uppercase tracking-widest">
                            {filter === 'all' ? 'All Activity' : `${filter} List`}
                        </span>
                        {notifications.some(n => !n.isRead) && (
                            <button
                                onClick={() => markAsRead([])}
                                className="text-xs font-semibold text-gold hover:text-gold/80 transition-colors uppercase tracking-widest flex items-center gap-2"
                            >
                                <CheckCircleIcon className="w-4 h-4" />
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 px-8 text-center rounded-3xl border border-dashed border-gold/20 bg-gold/[0.02]">
                            <BellSlashIcon className="w-16 h-16 mb-4 text-gold/30" />
                            <h3 className="text-xl font-display text-matte dark:text-ivory mb-2">No notifications found</h3>
                            <p className="text-neutral-500 max-w-sm">
                                It seems you're all caught up! Check back later for updates on your orders and exclusive offers.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <AnimatePresence mode='popLayout'>
                                {filtered.map((notif, index) => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                        key={notif._id}
                                        className={`group relative p-6 rounded-2xl border transition-all duration-300
                                            ${!notif.isRead
                                                ? 'bg-white dark:bg-zinc-900 border-gold shadow-[0_4px_20px_rgba(212,175,55,0.15)] ring-1 ring-gold/20'
                                                : 'bg-white/50 dark:bg-white/5 border-gold/10 hover:border-gold/30 hover:bg-white dark:hover:bg-zinc-900 shadow-sm'
                                            }`}
                                    >
                                        <div className="flex gap-5 md:gap-6 items-start">
                                            {/* Icon */}
                                            <div className={`mt-1 h-12 w-12 flex-shrink-0 rounded-full flex items-center justify-center border shadow-sm transition-transform duration-500 group-hover:rotate-12 ${getIconColors(notif.type)}`}>
                                                {getIcon(notif.type)}
                                            </div>

                                            <div className="flex-1 min-w-0 pt-1">
                                                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-2">
                                                    <h3 className={`font-display text-lg tracking-wide ${!notif.isRead ? 'text-matte dark:text-ivory font-semibold' : 'text-neutral-700 dark:text-neutral-300'}`}>
                                                        {notif.title}
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-xs text-neutral-400 whitespace-nowrap">
                                                        <ClockIcon className="w-3.5 h-3.5" />
                                                        {timeAgo(notif.createdAt)}
                                                    </div>
                                                </div>

                                                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-2xl text-sm md:text-base">
                                                    {notif.message}
                                                </p>

                                                {notif.url && (
                                                    <a href={notif.url} className="inline-flex items-center gap-2 mt-4 text-xs font-bold text-gold hover:text-gold/80 uppercase tracking-widest group/link">
                                                        View Details
                                                        <span className="group-hover/link:translate-x-1 transition-transform">&rarr;</span>
                                                    </a>
                                                )}
                                            </div>

                                            {!notif.isRead && (
                                                <div className="absolute top-6 right-6 flex flex-col items-center gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); markAsRead([notif._id]); }}
                                                        className="h-8 w-8 flex items-center justify-center rounded-full text-gold hover:bg-gold/10 transition-colors"
                                                        title="Mark as read"
                                                    >
                                                        <span className="h-2.5 w-2.5 rounded-full bg-gold animate-pulse"></span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;
