import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    getUserNotifications,
    markNotificationsRead,
    getUnreadCount
} from '../controllers/notificationController.js';

const router = express.Router();

router.use(protect); // All routes are protected

router.get('/', getUserNotifications);
router.put('/reading', markNotificationsRead);
router.get('/unread-count', getUnreadCount);

export default router;
