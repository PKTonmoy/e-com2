import { Resend } from 'resend';
import twilio from 'twilio';
import Settings from '../models/Settings.js';

// Lazy-initialized services (will be initialized on first use)
let resend = null;
let twilioClient = null;
let initialized = false;

/**
 * Initialize notification services (called lazily on first notification)
 */
function initServices() {
    if (initialized) return;
    initialized = true;

    console.log('[Notifications] Initializing services...');
    console.log('[Notifications] ADMIN_EMAIL:', process.env.ADMIN_EMAIL ? '✓ Set' : '✗ Not set');
    console.log('[Notifications] RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✓ Set' : '✗ Not set');
    console.log('[Notifications] TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? '✓ Set' : '✗ Not set');
    console.log('[Notifications] TELEGRAM_CHAT_ID:', process.env.TELEGRAM_CHAT_ID ? '✓ Set' : '✗ Not set');

    // Initialize Resend
    if (process.env.RESEND_API_KEY) {
        resend = new Resend(process.env.RESEND_API_KEY);
        console.log('[Notifications] Email (Resend) initialized ✓');
    }

    // Initialize Twilio
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        console.log('[Notifications] WhatsApp (Twilio) initialized ✓');
    }
}

/**
 * Send notification via Telegram (text only)
 */
async function sendTelegram(message) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
        console.log('[Telegram] Not configured, skipping');
        return false;
    }

    try {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });

        if (response.ok) {
            console.log('[Telegram] Notification sent');
            return true;
        } else {
            console.error('[Telegram] Failed:', await response.text());
            return false;
        }
    } catch (error) {
        console.error('[Telegram] Error:', error.message);
        return false;
    }
}

/**
 * Send photo via Telegram with caption
 */
async function sendTelegramPhoto(photoUrl, caption) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId || !photoUrl) {
        return false;
    }

    try {
        const url = `https://api.telegram.org/bot${token}/sendPhoto`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                photo: photoUrl,
                caption: caption || '',
                parse_mode: 'HTML'
            })
        });

        if (response.ok) {
            console.log('[Telegram] Photo sent');
            return true;
        } else {
            console.error('[Telegram] Photo failed:', await response.text());
            return false;
        }
    } catch (error) {
        console.error('[Telegram] Photo error:', error.message);
        return false;
    }
}

/**
 * Send notification via Email (Resend)
 */
async function sendEmail(subject, htmlContent) {
    if (!resend) {
        console.log('[Email] Not configured, skipping');
        return false;
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
        console.log('[Email] ADMIN_EMAIL not set, skipping');
        return false;
    }

    try {
        const { error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'PRELUX <onboarding@resend.dev>',
            to: adminEmail,
            subject: subject,
            html: htmlContent
        });

        if (error) {
            console.error('[Email] Failed:', error);
            return false;
        }

        console.log('[Email] Notification sent to', adminEmail);
        return true;
    } catch (error) {
        console.error('[Email] Error:', error.message);
        return false;
    }
}

/**
 * Send notification via WhatsApp (Twilio)
 */
async function sendWhatsApp(message) {
    if (!twilioClient) {
        console.log('[WhatsApp] Not configured, skipping');
        return false;
    }

    const from = process.env.TWILIO_WHATSAPP_FROM;
    const to = process.env.ADMIN_WHATSAPP;

    if (!from || !to) {
        console.log('[WhatsApp] TWILIO_WHATSAPP_FROM or ADMIN_WHATSAPP not set, skipping');
        return false;
    }

    try {
        await twilioClient.messages.create({
            from: from,
            to: to,
            body: message
        });

        console.log('[WhatsApp] Notification sent');
        return true;
    } catch (error) {
        console.error('[WhatsApp] Error:', error.message);
        return false;
    }
}

/**
 * Format order for notifications
 */
function formatOrderDetails(order, eventType) {
    // Enhanced items list with more details
    const itemsList = order.items.map((item, index) => {
        let itemLine = `${index + 1}. <b>${item.title}</b> × ${item.qty}`;
        const details = [];
        if (item.selectedSize) details.push(`Size: ${item.selectedSize}`);
        if (item.category) details.push(`Cat: ${item.category}`);
        if (item.sku) details.push(`SKU: ${item.sku}`);
        if (details.length > 0) {
            itemLine += `\n   ${details.join(' | ')}`;
        }
        itemLine += `\n   💰 ৳${item.price?.toFixed(0)} × ${item.qty} = ৳${(item.price * item.qty).toFixed(0)}`;
        return itemLine;
    }).join('\n\n');

    // Get first product image for thumbnail
    const firstImage = order.items[0]?.image || null;

    return {
        orderId: order._id.toString().slice(-8),
        fullOrderId: order._id.toString(),
        customerName: order.shipping?.name || 'Unknown',
        customerPhone: order.shipping?.phone || 'Not provided',
        customerEmail: order.shipping?.email || 'Not provided',
        total: order.total.toFixed(2),
        discount: order.discount?.toFixed(2) || '0',
        subtotal: (order.total + (order.discount || 0)).toFixed(2),
        itemCount: order.items.length,
        itemsList,
        status: order.orderStatus,
        paymentStatus: order.paymentStatus || 'pending',
        couponCode: order.couponCode || null,
        address: `${order.shipping?.address || ''}, ${order.shipping?.city || ''}`,
        fullAddress: `${order.shipping?.address || ''}\n${order.shipping?.city || ''}, ${order.shipping?.postalCode || ''}\n${order.shipping?.country || ''}`,
        eventType,
        firstImage,
        items: order.items
    };
}

/**
 * Send all notifications for an order event
 */
export async function notifyOrderEvent(order, eventType) {
    // Initialize services on first call (after dotenv has loaded)
    initServices();

    const details = formatOrderDetails(order, eventType);

    let title, emoji;
    switch (eventType) {
        case 'new':
            title = 'New Order Placed!';
            emoji = '🛒';
            break;
        case 'cancelled':
            title = 'Order Cancelled';
            emoji = '❌';
            break;
        case 'status_update':
            title = `Order Status: ${order.orderStatus.toUpperCase()}`;
            emoji = '📦';
            break;
        default:
            title = 'Order Update';
            emoji = '📋';
    }

    // Enhanced Telegram message with more details
    let telegramMessage = `
${emoji} <b>${title}</b>

━━━━━━━━━━━━━━━━━━━━
📋 <b>ORDER DETAILS</b>
━━━━━━━━━━━━━━━━━━━━
🔖 Order ID: <code>#${details.orderId}</code>
📊 Status: <b>${details.status.toUpperCase()}</b>
💳 Payment: ${details.paymentStatus}
${details.couponCode ? `🎟️ Coupon: ${details.couponCode}` : ''}

━━━━━━━━━━━━━━━━━━━━
👤 <b>CUSTOMER INFO</b>
━━━━━━━━━━━━━━━━━━━━
👤 Name: ${details.customerName}
📞 Phone: ${details.customerPhone}
✉️ Email: ${details.customerEmail}

━━━━━━━━━━━━━━━━━━━━
📦 <b>ITEMS (${details.itemCount})</b>
━━━━━━━━━━━━━━━━━━━━
${details.itemsList}

━━━━━━━━━━━━━━━━━━━━
💵 <b>PAYMENT</b>
━━━━━━━━━━━━━━━━━━━━
Subtotal: ৳${details.subtotal}
${parseFloat(details.discount) > 0 ? `Discount: -৳${details.discount}` : ''}
<b>Total: ৳${details.total}</b>

━━━━━━━━━━━━━━━━━━━━
📍 <b>SHIPPING ADDRESS</b>
━━━━━━━━━━━━━━━━━━━━
${details.fullAddress}
`.trim();

    // Email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #b8860b, #daa520); color: white; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 24px; }
    .row { display: flex; padding: 12px 0; border-bottom: 1px solid #eee; }
    .label { color: #666; width: 120px; font-weight: 600; }
    .value { color: #333; flex: 1; }
    .items { background: #f9f9f9; padding: 16px; border-radius: 8px; margin: 16px 0; }
    .item { padding: 8px 0; border-bottom: 1px solid #eee; }
    .item:last-child { border: none; }
    .total { font-size: 24px; color: #b8860b; font-weight: bold; text-align: center; padding: 20px; }
    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${emoji} ${title}</h1>
    </div>
    <div class="content">
      <div class="row"><span class="label">Order ID</span><span class="value">#${details.orderId}</span></div>
      <div class="row"><span class="label">Customer</span><span class="value">${details.customerName}</span></div>
      <div class="row"><span class="label">Phone</span><span class="value">${details.customerPhone}</span></div>
      <div class="row"><span class="label">Status</span><span class="value">${details.status}</span></div>
      <div class="row"><span class="label">Address</span><span class="value">${details.address}</span></div>
      
      <div class="items">
        <strong>Items (${details.itemCount}):</strong>
        ${order.items.map(item => `
          <div class="item">${item.title} × ${item.qty} — ৳${(item.price * item.qty).toFixed(0)}</div>
        `).join('')}
      </div>
      
      <div class="total">Total: ৳${details.total}</div>
    </div>
    <div class="footer">
      PRELUX Admin Notification System
    </div>
  </div>
</body>
</html>
  `.trim();

    // WhatsApp message
    const whatsappMessage = `${emoji} *${title}*

Order: #${details.orderId}
Customer: ${details.customerName}
Phone: ${details.customerPhone}
Total: ৳${details.total}

Items: ${details.itemCount}
${details.itemsList}

Address: ${details.address}`;

    // Get notification settings from database
    let settings = { emailEnabled: true, telegramEnabled: true, whatsappEnabled: false };
    try {
        settings = await Settings.getNotificationSettings();
    } catch (err) {
        console.log('[Notifications] Could not load settings, using defaults');
    }

    // Build notification promises based on enabled channels
    const notificationPromises = [];
    const channelNames = [];

    if (settings.telegramEnabled) {
        notificationPromises.push(sendTelegram(telegramMessage));
        channelNames.push('Telegram');
    }
    if (settings.emailEnabled) {
        notificationPromises.push(sendEmail(`[PRELUX] ${title} #${details.orderId}`, emailHtml));
        channelNames.push('Email');
    }
    if (settings.whatsappEnabled) {
        notificationPromises.push(sendWhatsApp(whatsappMessage));
        channelNames.push('WhatsApp');
    }

    if (notificationPromises.length === 0) {
        console.log('[Notifications] All channels disabled, skipping');
        return [];
    }

    // Send enabled notifications in parallel
    const results = await Promise.allSettled(notificationPromises);

    console.log('[Notifications] Sent:', results.map((r, i) =>
        `${channelNames[i]}: ${r.status === 'fulfilled' && r.value ? '✓' : '✗'}`
    ).join(', '));

    // Send product images to Telegram (after main message for new orders)
    if (settings.telegramEnabled && eventType === 'new' && details.items?.length > 0) {
        const baseUrl = process.env.CLIENT_URL?.replace(/:\d+$/, ':5001') || 'http://localhost:5001';

        for (const item of details.items.slice(0, 3)) { // Max 3 images
            if (item.image) {
                let imageUrl = item.image;
                // If image is a relative path, make it absolute
                if (!imageUrl.startsWith('http')) {
                    imageUrl = `${baseUrl}/uploads/${imageUrl}`;
                }
                const caption = `📸 ${item.title}${item.selectedSize ? ` (Size: ${item.selectedSize})` : ''} × ${item.qty}`;
                await sendTelegramPhoto(imageUrl, caption);
            }
        }
    }

    return results;
}
