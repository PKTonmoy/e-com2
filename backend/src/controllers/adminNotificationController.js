import Notification from '../models/notificationModel.js';
import User from '../models/User.js';

// @desc    Send a notification (Create + Emit)
// @route   POST /api/admin/notifications
// @access  Private/Admin
export const sendNotification = async (req, res) => {
    try {
        const {
            targetType, // 'all', 'user', 'segment'
            targetId,   // userId if targetType === 'user'
            segment,    // e.g. 'premium', if targetType === 'segment' (optional implementation)
            type,       // 'system', 'promo', 'order'
            title,
            message,
            url,
            image,
            priority,
            saveTemplate // boolean, if true, we might save a separate template record (simplified here to just create notif)
        } = req.body;

        const io = req.io; // Accessed from middleware

        // 1. Construct the notification payload
        const notifData = {
            type: type || 'system',
            title,
            message,
            url,
            image,
            priority: priority || 'normal',
            isRead: false,
            createdAt: new Date()
        };

        let recipientsCount = 0;

        // 2. Determine recipients and create DB records
        if (targetType === 'user' && targetId) {
            // Single user
            const notif = await Notification.create({ ...notifData, userId: targetId });

            // Emit socket event
            if (io) {
                io.to(`notifications:${targetId}`).emit('notification:new', notif);
            }
            recipientsCount = 1;

        } else if (targetType === 'all') {
            // Broadcast to ALL users
            // WARNING: unique/performance challenge for massive scale, but okay for MVP/Mid-size
            // Better approach for scale: Create one "system" notification with userId: null
            // And have clients fetch "global" notifications + "personal" ones.
            // However, requirements ask to "Persist notifications in DB with... userId (nullable for broadcast)"

            // Let's go with creating individual records if the user base is small (<1000), 
            // OR create a single global record if we update the GET logic.
            // Given the prompt mention "userId (nullable for broadcast)", let's Support Global Record.

            const notif = await Notification.create({ ...notifData, userId: null }); // Broadcast

            // Emit global socket event
            if (io) {
                io.emit('notification:new', notif);
            }
            recipientsCount = 'ALL';
        } else {
            return res.status(400).json({ message: 'Invalid target type' });
        }

        res.status(201).json({
            message: `Notification sent successfully to ${recipientsCount} recipients`,
            data: notifData
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to send notification', error: error.message });
    }
};

// @desc    Get all notifications (Admin View) - useful for seeing history/templates
// @route   GET /api/admin/notifications
// @access  Private/Admin
export const getAllNotificationsAdmin = async (req, res) => {
    try {
        const pageSize = 50;
        const page = Number(req.query.page) || 1;

        const count = await Notification.countDocuments({});
        const notifications = await Notification.find({})
            .sort({ createdAt: -1 })
            .limit(pageSize)
            .skip(pageSize * (page - 1))
            .populate('userId', 'name email customId');

        res.json({
            notifications,
            page,
            pages: Math.ceil(count / pageSize),
            total: count
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notifications', error: error.message });
    }
};
