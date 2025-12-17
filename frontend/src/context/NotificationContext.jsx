import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import api from '../lib/api.js';

var NotificationContext = createContext();

export var useNotifications = () => useContext(NotificationContext);

export var NotificationProvider = ({ children }) => {
    var [notifications, setNotifications] = useState([]);
    var [unreadCount, setUnreadCount] = useState(0);
    var [socket, setSocket] = useState(null);
    var [loading, setLoading] = useState(false);
    var [userId, setUserId] = useState(null);

    // Get token directly from localStorage (same as api.js)
    var token = localStorage.getItem('token');

    // Fetch current user to get userId for socket room
    var fetchCurrentUser = useCallback(async () => {
        if (!token) return null;
        try {
            var res = await api.get('/auth/me');
            return res.data;
        } catch (err) {
            console.error('Failed to fetch current user for notifications', err);
            return null;
        }
    }, [token]);

    // 1. Initialize Socket and get user ID
    useEffect(() => {
        if (!token) {
            // Clear state if logged out
            setNotifications([]);
            setUnreadCount(0);
            setUserId(null);
            if (socket) {
                socket.close();
                setSocket(null);
            }
            return;
        }

        var initSocket = async () => {
            // Get user info for room joining
            var user = await fetchCurrentUser();
            if (!user || !user._id) {
                console.warn('No user found for notification socket');
                return;
            }
            setUserId(user._id);

            // Don't recreate socket if already connected
            if (socket) return;

            // Adjust URL based on environment - strip /api from API URL
            var apiUrl = import.meta.env.VITE_API_URL || '';
            var ENDPOINT = apiUrl.replace('/api', '') || 'http://localhost:5001';

            var newSocket = io(ENDPOINT, {
                transports: ['websocket', 'polling'],
            });

            newSocket.on('connect', () => {
                console.log('[Notifications] Socket connected');
                // Join user-specific notification room
                newSocket.emit('join', `notifications:${user._id}`);
            });

            newSocket.on('notification:new', (newNotification) => {
                console.log('[Notifications] New notification received', newNotification);
                // Add to list and increment unread count
                setNotifications((prev) => [newNotification, ...prev]);
                setUnreadCount((prev) => prev + 1);
            });

            newSocket.on('disconnect', () => {
                console.log('[Notifications] Socket disconnected');
            });

            newSocket.on('connect_error', (err) => {
                console.error('[Notifications] Socket connection error', err.message);
            });

            setSocket(newSocket);
        };

        initSocket();

        return () => {
            if (socket) {
                socket.close();
                setSocket(null);
            }
        };
    }, [token, fetchCurrentUser]);

    // 2. Fetch Notifications from API
    var fetchNotifications = useCallback(async (page = 1) => {
        if (!token) return;
        try {
            setLoading(true);
            var res = await api.get(`/notifications?page=${page}`);

            if (page === 1) {
                setNotifications(res.data.notifications || []);
            } else {
                setNotifications(prev => [...prev, ...(res.data.notifications || [])]);
            }
            setUnreadCount(res.data.unreadCount || 0);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    // 3. Mark Read
    var markAsRead = useCallback(async (ids = []) => {
        if (!token) return;
        try {
            if (ids.length === 0) {
                // Mark all as read - optimistic update
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
                await api.put('/notifications/reading', { all: true });
            } else {
                // Mark specific IDs as read - optimistic update
                setNotifications(prev => prev.map(n => ids.includes(n._id) ? ({ ...n, isRead: true }) : n));
                setUnreadCount(prev => Math.max(0, prev - ids.length));
                await api.put('/notifications/reading', { ids });
            }
        } catch (error) {
            console.error('Failed to mark notifications as read', error);
            // Revert optimistic update on error
            fetchNotifications();
        }
    }, [token, fetchNotifications]);

    // Initial fetch when token available
    useEffect(() => {
        if (token) {
            fetchNotifications();
        }
    }, [token, fetchNotifications]);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            userId,
            markAsRead,
            fetchNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
