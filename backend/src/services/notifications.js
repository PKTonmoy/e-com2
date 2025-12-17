import { Resend } from 'resend';
import twilio from 'twilio';
import Settings from '../models/Settings.js';
import User from '../models/User.js'; // Import User model

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
        userId: order.user?.customId || 'N/A', // Add customId
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

    // Populate user info if not already populated
    if (!order.user && order.userId) {
        order.user = await User.findById(order.userId);
    }

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
🆔 <b>User ID: ${details.userId}</b>
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
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f5f5f5; padding: 20px; line-height: 1.5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #b8860b, #daa520); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 300; letter-spacing: 1px; }
    .subtitle { opacity: 0.9; font-size: 14px; margin-top: 5px; }
    .content { padding: 30px; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 12px; text-transform: uppercase; color: #888; letter-spacing: 1px; margin-bottom: 10px; font-weight: 600; }
    .row { display: flex; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .label { color: #666; width: 140px; font-size: 14px; }
    .value { color: #333; flex: 1; font-weight: 500; font-size: 14px; }
    .items { background: #fafafa; border-radius: 8px; overflow: hidden; margin-top: 10px; }
    .item { padding: 15px; border-bottom: 1px solid #eee; display: flex; gap: 15px; }
    .item:last-child { border: none; }
    .item-img { width: 50px; height: 50px; background: #eee; border-radius: 4px; object-fit: cover; }
    .item-details { flex: 1; }
    .item-title { font-weight: 600; color: #333; margin-bottom: 4px; }
    .item-meta { font-size: 12px; color: #888; }
    .item-price { font-weight: 600; color: #b8860b; }
    .total-section { margin-top: 20px; text-align: right; padding-top: 15px; border-top: 2px solid #eee; }
    .total-row { display: flex; justify-content: flex-end; gap: 20px; margin-bottom: 5px; color: #666; }
    .final-total { font-size: 20px; color: #b8860b; font-weight: bold; margin-top: 10px; }
    .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${emoji} ${title}</h1>
      <div class="subtitle">Order #${details.orderId}</div>
    </div>
    <div class="content">
      <div class="section">
        <div class="section-title">Customer Information</div>
        <div class="row"><span class="label">User ID</span><span class="value"><b>${details.userId}</b></span></div>
        <div class="row"><span class="label">Name</span><span class="value">${details.customerName}</span></div>
        <div class="row"><span class="label">Phone</span><span class="value">${details.customerPhone}</span></div>
        <div class="row"><span class="label">Email</span><span class="value">${details.customerEmail}</span></div>
        <div class="row"><span class="label">Address</span><span class="value" style="white-space: pre-line;">${details.fullAddress}</span></div>
      </div>

      <div class="section">
        <div class="section-title">Order Info</div>
        <div class="row"><span class="label">Order ID</span><span class="value">#${details.fullOrderId}</span></div>
        <div class="row"><span class="label">Date</span><span class="value">${new Date().toLocaleString()}</span></div>
        <div class="row"><span class="label">Status</span><span class="value" style="text-transform: capitalize;">${details.status}</span></div>
        <div class="row"><span class="label">Payment</span><span class="value" style="text-transform: capitalize;">${details.paymentStatus}</span></div>
      </div>
      
      <div class="section">
        <div class="section-title">Order Items (${details.itemCount})</div>
        <div class="items">
          ${order.items.map(item => `
            <div class="item">
               <div class="item-details">
                 <div class="item-title">${item.title}</div>
                 <div class="item-meta">
                   ${item.selectedSize ? `Size: ${item.selectedSize} • ` : ''} Qty: ${item.qty}
                 </div>
               </div>
               <div class="item-price">৳${(item.price * item.qty).toFixed(0)}</div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="total-section">
        <div class="total-row"><span>Subtotal:</span> <span>৳${details.total}</span></div>
        ${parseFloat(details.discount) > 0 ? `<div class="total-row"><span>Discount:</span> <span>-৳${details.discount}</span></div>` : ''}
        <div class="final-total">Total: ৳${details.total}</div>
      </div>
    </div>
    <div class="footer">
      PRELUX Admin Notification System<br>
      Automated message from your e-commerce platform
    </div>
  </div>
</body>
</html>
  `.trim();

    // WhatsApp message
    const whatsappMessage = `${emoji} *${title}*

━━━━━━━━━━━━━━
👤 *CUSTOMER INFO*
User ID: *${details.userId}*
Name: ${details.customerName}
Phone: ${details.customerPhone}
Email: ${details.customerEmail}

📍 *ADDRESS*
${details.fullAddress}

━━━━━━━━━━━━━━
📋 *ORDER DETAILS*
Order ID: #${details.orderId}
Status: ${details.status}
Payment: ${details.paymentStatus}

📦 *ITEMS (${details.itemCount})*
${details.itemsList}

💰 *TOTAL: ৳${details.total}*
━━━━━━━━━━━━━━`.trim();

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
