import express from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import { sendNotification, getAllNotificationsAdmin } from '../controllers/adminNotificationController.js';

const router = express.Router();

router.use(protect);
router.use(requireRole('admin'));

router.post('/', sendNotification);
router.get('/', getAllNotificationsAdmin);

export default router;
