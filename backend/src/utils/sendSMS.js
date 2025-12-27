import SmsLog from '../models/SmsLog.js';
import Settings from '../models/Settings.js';

// Lazy-initialized flag
let initialized = false;
let smsEnabled = false;

/**
 * Initialize SMS service (called lazily on first use)
 */
function initService() {
    if (initialized) return;
    initialized = true;

    const apiKey = process.env.BULKSMSBD_API_KEY;
    const senderId = process.env.BULKSMSBD_SENDER_ID;

    if (apiKey && senderId) {
        smsEnabled = true;
        console.log('[SMS] BulkSMSBD configured ✓');
    } else {
        console.log('[SMS] BulkSMSBD not configured (disabled)');
        console.log('[SMS] BULKSMSBD_API_KEY:', apiKey ? '✓ Set' : '✗ Not set');
        console.log('[SMS] BULKSMSBD_SENDER_ID:', senderId ? '✓ Set' : '✗ Not set');
    }
}

/**
 * Validate Bangladeshi phone number
 * Accepts: 01XXXXXXXXX, +8801XXXXXXXXX, 8801XXXXXXXXX
 */
export function isValidBdPhone(phone) {
    if (!phone) return false;
    const BD_PHONE_REGEX = /^(?:\+?88)?01[3-9]\d{8}$/;
    return BD_PHONE_REGEX.test(String(phone).trim());
}

/**
 * Format phone number for BulkSMSBD API
 * Converts to format: 8801XXXXXXXXX (no + prefix, with country code)
 */
export function formatBdPhoneNumber(phone) {
    if (!phone) return null;
    let digits = String(phone).replace(/\D/g, '');

    // If starts with 88 and is 13 digits, it's already correct
    if (digits.startsWith('88') && digits.length === 13) {
        return digits;
    }

    // If starts with 01 and is 11 digits, add country code
    if (digits.startsWith('01') && digits.length === 11) {
        return '88' + digits;
    }

    // If starts with 0088, remove extra 0
    if (digits.startsWith('0088') && digits.length === 14) {
        return digits.slice(2);
    }

    return null; // Invalid format
}

/**
 * Generate SMS message from order data
 */
export function generateOrderConfirmationMessage(order, websiteUrl = '', template = null) {
    const orderNumber = order.orderNumber || order._id.toString().slice(-8);
    const trackingId = order.courier?.trackingId || 'N/A';
    const trackUrl = websiteUrl ? `${websiteUrl}/track-order/${trackingId}` : '';
    const customerName = order.shipping?.name || 'Customer';
    const totalAmount = order.total?.toFixed(0) || '0';

    // Default template if none provided
    const defaultTemplate = `🎉 Order Confirmed!

Dear [Customer Name],
Your order (#[Order Number]) has been approved!

📦 Tracking ID: [Tracking ID]
[Tracking Link]

Thank you for shopping with us!`;

    let message = template || defaultTemplate;

    // Replace placeholders
    message = message.replace(/\[Customer Name\]/g, customerName)
        .replace(/\[Order Number\]/g, orderNumber)
        .replace(/\[Tracking ID\]/g, trackingId)
        .replace(/\[Tracking Link\]/g, trackUrl ? `📍 Track: ${trackUrl}` : '')
        .replace(/\[Total Amount\]/g, totalAmount);

    // Clean up empty lines if optional fields (like tracking link) are empty
    return message.replace(/\n\s*\n/g, '\n\n').trim();
}

/**
 * Send SMS via BulkSMSBD API
 * @param {string} phone - Phone number to send to
 * @param {string} message - Message content
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<{success: boolean, response?: object, error?: string}>}
 */
async function sendSMSRequest(phone, message, retryCount = 0) {
    const maxRetries = 2;
    const apiKey = process.env.BULKSMSBD_API_KEY;
    const senderId = process.env.BULKSMSBD_SENDER_ID;
    const apiUrl = process.env.BULKSMSBD_API_URL || 'http://bulksmsbd.net/api/smsapi';

    const formattedPhone = formatBdPhoneNumber(phone);
    if (!formattedPhone) {
        return { success: false, error: 'Invalid phone number format' };
    }

    try {
        const params = new URLSearchParams({
            api_key: apiKey,
            senderid: senderId,
            number: formattedPhone,
            message: message,
        });

        const response = await fetch(`${apiUrl}?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        const data = await response.json();

        // BulkSMSBD returns response_code 202 for success
        if (data.response_code === 202 || data.response_code === '202') {
            console.log('[SMS] Message sent successfully to', formattedPhone);
            return { success: true, response: data };
        }

        // Handle specific error codes
        const errorMsg = data.error_message || data.message || `API returned code ${data.response_code}`;
        console.error('[SMS] API error:', errorMsg);

        // Retry on certain errors
        if (retryCount < maxRetries && (data.response_code === 500 || !response.ok)) {
            console.log(`[SMS] Retrying... (attempt ${retryCount + 2}/${maxRetries + 1})`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return sendSMSRequest(phone, message, retryCount + 1);
        }

        return { success: false, error: errorMsg, response: data };
    } catch (error) {
        console.error('[SMS] Network error:', error.message);

        // Retry on network errors
        if (retryCount < maxRetries) {
            console.log(`[SMS] Retrying after network error... (attempt ${retryCount + 2}/${maxRetries + 1})`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return sendSMSRequest(phone, message, retryCount + 1);
        }

        return { success: false, error: error.message };
    }
}

/**
 * Send order confirmation SMS to customer
 * @param {Object} order - Order document with shipping info and courier details
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendOrderConfirmationSMS(order) {
    initService();

    // Check if SMS is enabled in settings
    let settings = { smsEnabled: true };
    try {
        settings = await Settings.get('notifications') || settings;
    } catch (err) {
        console.log('[SMS] Could not load settings, using defaults');
    }

    if (!smsEnabled || !settings.smsEnabled) {
        console.log('[SMS] Service disabled, skipping');
        return { success: false, error: 'SMS service disabled' };
    }

    const phone = order.shipping?.phone;
    if (!phone) {
        console.log('[SMS] No phone number in order shipping info');
        return { success: false, error: 'No phone number provided' };
    }

    if (!isValidBdPhone(phone)) {
        console.log('[SMS] Invalid phone number format:', phone);
        return { success: false, error: 'Invalid phone number format' };
    }

    // Check if SMS already sent recently (prevent duplicates)
    if (order.sms?.sent && order.sms?.sentAt) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (order.sms.sentAt > fiveMinutesAgo) {
            console.log('[SMS] Already sent within 5 minutes, skipping');
            return { success: false, error: 'SMS already sent recently' };
        }
    }

    // Generate message
    const websiteUrl = process.env.CLIENT_URL || '';
    const message = generateOrderConfirmationMessage(order, websiteUrl, settings.smsTemplate);

    // Send SMS
    const result = await sendSMSRequest(phone, message);

    // Log the attempt
    try {
        await SmsLog.create({
            orderId: order._id,
            phone: formatBdPhoneNumber(phone),
            message,
            status: result.success ? 'success' : 'failed',
            apiResponse: result.response || null,
            error: result.error || null,
        });
    } catch (logError) {
        console.error('[SMS] Failed to create log entry:', logError.message);
    }

    // Update order SMS status
    try {
        order.sms = {
            sent: result.success,
            sentAt: result.success ? new Date() : order.sms?.sentAt,
            error: result.error || null,
            attempts: (order.sms?.attempts || 0) + 1,
        };
        await order.save();
    } catch (saveError) {
        console.error('[SMS] Failed to update order SMS status:', saveError.message);
    }

    return result;
}

export default {
    sendOrderConfirmationSMS,
    isValidBdPhone,
    formatBdPhoneNumber,
    generateOrderConfirmationMessage,
};
