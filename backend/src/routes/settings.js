import express from 'express';
import Settings from '../models/Settings.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get notification settings
router.get('/notifications', protect, requireRole('admin'), async (req, res) => {
    try {
        const settings = await Settings.getNotificationSettings();
        res.json(settings);
    } catch (error) {
        console.error('Error getting notification settings:', error);
        res.status(500).json({ message: 'Failed to get settings' });
    }
});

// Update notification settings
router.put('/notifications', protect, requireRole('admin'), async (req, res) => {
    try {
        const { emailEnabled, telegramEnabled, whatsappEnabled } = req.body;

        const settings = {
            emailEnabled: Boolean(emailEnabled),
            telegramEnabled: Boolean(telegramEnabled),
            whatsappEnabled: Boolean(whatsappEnabled),
        };

        await Settings.setNotificationSettings(settings);
        res.json({ message: 'Settings updated', settings });
    } catch (error) {
        console.error('Error updating notification settings:', error);
        res.status(500).json({ message: 'Failed to update settings' });
    }
});

// Get shipping settings
router.get('/shipping', protect, requireRole('admin'), async (req, res) => {
    try {
        const defaults = {
            freeShippingEnabled: true,
            freeShippingThreshold: 5000,
            defaultLocalCharge: 50,
            defaultOutsideCharge: 130,
        };
        const saved = await Settings.get('shipping');
        res.json(saved ? { ...defaults, ...saved } : defaults);
    } catch (error) {
        console.error('Error getting shipping settings:', error);
        res.status(500).json({ message: 'Failed to get shipping settings' });
    }
});

// Update shipping settings
router.put('/shipping', protect, requireRole('admin'), async (req, res) => {
    try {
        const { freeShippingEnabled, freeShippingThreshold, defaultLocalCharge, defaultOutsideCharge } = req.body;

        const settings = {
            freeShippingEnabled: Boolean(freeShippingEnabled),
            freeShippingThreshold: Number(freeShippingThreshold) || 5000,
            defaultLocalCharge: Number(defaultLocalCharge) || 50,
            defaultOutsideCharge: Number(defaultOutsideCharge) || 130,
        };

        await Settings.set('shipping', settings);
        res.json({ message: 'Shipping settings updated', settings });
    } catch (error) {
        console.error('Error updating shipping settings:', error);
        res.status(500).json({ message: 'Failed to update shipping settings' });
    }
});

// Get all settings (generic)
router.get('/:key', protect, requireRole('admin'), async (req, res) => {
    try {
        const value = await Settings.get(req.params.key);
        res.json({ key: req.params.key, value });
    } catch (error) {
        res.status(500).json({ message: 'Failed to get setting' });
    }
});

// Set a setting (generic)
router.put('/:key', protect, requireRole('admin'), async (req, res) => {
    try {
        const result = await Settings.set(req.params.key, req.body.value);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update setting' });
    }
});

export default router;
