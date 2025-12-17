import Notification from '../models/notificationModel.js';
import User from '../models/User.js';

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
export const getUserNotifications = async (req, res) => {
    try {
        const pageSize = Number(req.query.limit) || 20;
        const page = Number(req.query.page) || 1;
        const filter = req.query.filter; // 'unread', 'order', 'promo'

        const query = {
            $and: [
                {
                    $or: [
                        { userId: req.user._id },
                        { userId: null }
                    ]
                },
                {
                    $or: [
                        { expiresAt: null },
                        { expiresAt: { $gt: new Date() } }
                    ]
                }
            ]
        };

        if (filter === 'unread') {
            query.isRead = false;
        } else if (filter && filter !== 'all') {
            query.type = filter;
        }

        const count = await Notification.countDocuments(query);
        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 }) // Newest first
            .limit(pageSize)
            .skip(pageSize * (page - 1));

        // Also get unread count explicitly for badge
        const unreadCount = await Notification.countDocuments({
            $and: [
                { $or: [{ userId: req.user._id }, { userId: null }] },
                { isRead: false },
                { $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] }
            ]
        });

        res.json({
            notifications,
            page,
            pages: Math.ceil(count / pageSize),
            total: count,
            unreadCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching notifications', error: error.message });
    }
};

// @desc    Mark notifications as read
// @route   PUT /api/notifications/reading
// @access  Private
export const markNotificationsRead = async (req, res) => {
    try {
        const { ids, all } = req.body;

        let result;
        if (all) {
            result = await Notification.updateMany(
                {
                    $or: [{ userId: req.user._id }, { userId: null }],
                    isRead: false
                },
                { isRead: true, readAt: new Date() }
            );
        } else if (ids && Array.isArray(ids) && ids.length > 0) {
            // Match notifications that belong to this user OR are broadcast (userId: null)
            result = await Notification.updateMany(
                { 
                    _id: { $in: ids }, 
                    $or: [{ userId: req.user._id }, { userId: null }]
                },
                { isRead: true, readAt: new Date() }
            );
        } else {
            return res.status(400).json({ message: 'No notification IDs provided' });
        }

        res.json({ message: 'Notifications marked as read', modifiedCount: result.modifiedCount });
    } catch (error) {
        res.status(500).json({ message: 'Error updating notifications', error: error.message });
    }
};

// @desc    Get unread count only (lightweight)
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            $and: [
                { $or: [{ userId: req.user._id }, { userId: null }] },
                { isRead: false },
                { $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] }
            ]
        });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching count', error: error.message });
    }
};
