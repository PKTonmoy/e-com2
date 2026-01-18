import express from 'express';
import { body, validationResult } from 'express-validator';
import { protect, requireRole, optionalProtect } from '../middleware/auth.js';
import Order from '../models/Order.js';
import ActivityLog from '../models/ActivityLog.js';
import CourierTariff from '../models/CourierTariff.js';
import Settings from '../models/Settings.js';
import { sendOrderConfirmationSMS } from '../utils/sendSMS.js';
import {
  createSteadfastOrder,
  getSteadfastStatusByTrackingCode,
  mapSteadfastStatus,
  getSteadfastDestinations,
  getSteadfastBalance,
  createSteadfastReturnRequest,
  getSteadfastReturnRequests,
  getSteadfastPayments,
  getSteadfastPaymentDetails,
} from '../services/steadfastClient.js';

const router = express.Router();

// Accept Bangladeshi numbers like 01XXXXXXXXX, +8801XXXXXXXXX, 8801XXXXXXXXX
const BD_PHONE_REGEX = /^(?:\+?88)?01[3-9]\d{8}$/;

const normalizeBdPhone = (phone) => {
  if (!phone) return phone;
  let digits = String(phone).replace(/\D/g, '');
  // Strip country code 88 / 088 / +88 forms, keep local 11-digit
  if (digits.startsWith('88') && digits.length === 13) {
    digits = digits.slice(2);
  }
  if (digits.startsWith('088') && digits.length === 14) {
    digits = digits.slice(3);
  }
  if (digits.length === 11 && digits.startsWith('01')) {
    return digits;
  }
  return phone;
};

// Validation helpers
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }
  next();
};

// 1) Dynamic Delivery Charge
router.post(
  '/charge',
  optionalProtect,
  [
    body('shipping.name').isString().trim().isLength({ min: 2, max: 100 }),
    body('shipping.phone')
      .isString()
      .custom((value) => BD_PHONE_REGEX.test(String(value).trim()))
      .withMessage('Invalid Bangladeshi mobile number'),
    body('shipping.address').isString().trim().isLength({ min: 5, max: 250 }),
    body('shipping.city').isString().trim().notEmpty(),
    body('shipping.country').isString().trim().notEmpty(),
    body('cartTotal').isNumeric().custom((v) => v >= 0),
  ],
  validate,
  async (req, res, next) => {
    try {
      const shipping = req.body.shipping;
      shipping.phone = normalizeBdPhone(shipping.phone);
      const cartTotal = Number(req.body.cartTotal || 0);

      // Basic availability check: only Bangladesh supported for now
      if (shipping.country.toLowerCase() !== 'bangladesh') {
        return res.status(400).json({
          message: 'Delivery is available only within Bangladesh.',
          available: false,
        });
      }

      // Look up tariff from database (editable in admin panel)
      // Origin is fixed as Rajshahi district for now.
      const originDistrict = 'Rajshahi';
      const destinationDistrict = shipping.city; // we store dropdown label here

      let charge = null;
      const tariff = await CourierTariff.findOne({
        courier: 'steadfast',
        originDistrict,
        destinationDistrict,
        active: true,
      });
      if (tariff) {
        charge = tariff.price;
      } else {
        // Fallback basic rule if no tariff configured - use database settings
        const shippingSettings = await Settings.get('shipping') || {};
        const defaultLocalCharge = shippingSettings.defaultLocalCharge ?? 50;
        const defaultOutsideCharge = shippingSettings.defaultOutsideCharge ?? 130;

        const cityLower = destinationDistrict.toLowerCase();
        charge = cityLower.includes('rajshahi') ? defaultLocalCharge : defaultOutsideCharge;
      }

      // Optional free shipping for high-value orders - check database settings
      const shippingConfig = await Settings.get('shipping') || {};
      const freeShippingEnabled = shippingConfig.freeShippingEnabled ?? true;
      const freeShippingThreshold = shippingConfig.freeShippingThreshold ?? 5000;

      if (freeShippingEnabled && cartTotal >= freeShippingThreshold) {
        charge = 0;
      }

      return res.json({
        available: true,
        courier: 'steadfast',
        deliveryCharge: charge,
      });
    } catch (err) {
      return next(err);
    }
  }
);

// 2) Create courier order for COD
router.post(
  '/create',
  optionalProtect,
  [
    body('orderId').isMongoId(),
    body('paymentMethod').isIn(['cod', 'online']),
    body('expectedDeliveryCharge').isNumeric(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const orderId = req.body.orderId;
      const paymentMethod = req.body.paymentMethod;
      const expectedDeliveryCharge = Number(req.body.expectedDeliveryCharge);

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Ownership check - handle both authenticated and guest orders
      if (req.user) {
        // Logged-in user: check ownership
        if (order.userId && order.userId.toString() !== req.user._id.toString() && req.user.role === 'customer') {
          return res.status(403).json({ message: 'Forbidden' });
        }
      } else {
        // Guest: allow only if order is a guest order
        if (!order.isGuest) {
          return res.status(403).json({ message: 'Forbidden' });
        }
      }

      // Prevent duplicate courier order
      if (order.courier?.trackingId) {
        return res.status(400).json({ message: 'Courier order already exists for this order' });
      }

      // COD only
      if (paymentMethod !== 'cod') {
        return res.status(400).json({ message: 'Courier order allowed only for COD payments' });
      }

      // Fail-safe: delivery charge mismatch
      if (typeof order.shippingCharge === 'number' && order.shippingCharge !== expectedDeliveryCharge) {
        return res
          .status(400)
          .json({ message: 'Delivery charge mismatch. Please refresh checkout and try again.' });
      }

      // Compute COD amount in BDT including charges
      const currency = order.currency || 'USD';
      if (currency !== 'BDT' && currency !== 'Tk' && currency !== '৳') {
        // For production-multi-currency you should convert here
        await ActivityLog.create({
          actorId: order.userId,
          action: 'courier_currency_mismatch',
          entity: 'order',
          meta: { orderId: order._id, currency },
        });
      }

      const codAmount = Math.max(0, Number(order.total || 0) + Number(order.shippingCharge || 0));

      // Build Steadfast payload from docs:
      // Path: /create_order, Method: POST
      const payload = {
        invoice: String(order._id),
        recipient_name: order.shipping?.name || 'Guest',
        recipient_phone: normalizeBdPhone(order.shipping?.phone),
        recipient_address: order.shipping?.address,
        cod_amount: codAmount,
        note: order.notes?.[order.notes.length - 1]?.message || null,
        item_description: `${order.items.length} item(s)`,
        delivery_type: 0, // home delivery
      };

      const result = await createSteadfastOrder(payload);

      if (!result || !result.consignment) {
        const msg = result?.message || 'Failed to create courier order';
        await ActivityLog.create({
          actorId: order.userId,
          action: 'courier_create_failed',
          entity: 'order',
          meta: { orderId: order._id, courier: 'steadfast', response: result },
        });
        return res.status(502).json({ message: msg });
      }

      const consignment = result.consignment;

      const rawStatus = consignment.status || 'pending';
      const friendlyStatus = mapSteadfastStatus(rawStatus);

      order.paymentMethod = 'cod';
      order.courier = {
        name: 'steadfast',
        trackingId: consignment.tracking_code,
        statusRaw: rawStatus,
        statusFriendly: friendlyStatus,
        statusFriendly: friendlyStatus,
        deliveryCharge: expectedDeliveryCharge,
        actualCost: null, // Reset on new creation
        lastSyncedAt: new Date(),
        error: null,
      };
      order.shippingCharge = expectedDeliveryCharge;

      await order.save();

      await ActivityLog.create({
        actorId: order.userId,
        action: 'courier_create_success',
        entity: 'order',
        meta: {
          orderId: order._id,
          courier: 'steadfast',
          trackingId: consignment.tracking_code,
          consignmentId: consignment.consignment_id,
        },
      });

      return res.status(201).json({
        message: 'Courier order created successfully',
        courier: order.courier,
      });
    } catch (err) {
      // Mark order as cancelled on courier failure if it was just placed
      if (req.body.orderId) {
        try {
          const order = await Order.findById(req.body.orderId);
          if (order && order.orderStatus === 'pending') {
            order.orderStatus = 'cancelled';
            order.notes.push({ message: 'Order auto-cancelled due to courier error' });
            await order.save();
          }
        } catch {
          // best effort only
        }
      }
      return next(err);
    }
  }
);

// 3) Live Order Tracking - by trackingId
router.get('/status/:trackingId', protect, async (req, res, next) => {
  try {
    const trackingId = req.params.trackingId;
    const data = await getSteadfastStatusByTrackingCode(trackingId);

    const rawStatus = data?.delivery_status || 'pending';
    const friendly = mapSteadfastStatus(rawStatus);

    return res.json({
      trackingId,
      courier: 'steadfast',
      statusRaw: rawStatus,
      statusFriendly: friendly,
    });
  } catch (err) {
    return next(err);
  }
});

// Expose Steadfast destinations (police stations) for frontend dropdown
// This endpoint serves cached data when courier service is disabled or API fails
// Rajshahi is considered the origin in our pricing rules; this endpoint only returns destinations.
router.get('/destinations', optionalProtect, async (req, res, next) => {
  try {
    // Check if courier service is enabled
    const courierSettings = await Settings.get('courier') || { enabled: true };
    const courierEnabled = courierSettings.enabled !== false;

    let destinations = [];
    let fromCache = false;

    // Try to get fresh data if courier is enabled
    if (courierEnabled) {
      try {
        const data = await getSteadfastDestinations();

        // Steadfast typically returns an array of police stations; normalize a bit for the frontend
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [];

        destinations = list.map((item) => ({
          id: item.id || item._id || item.code || String(item.station_id || ''),
          name: item.name || item.thana || item.police_station || '',
          district: item.district || item.district_name || '',
          raw: item,
        }));

        // Cache the destinations for when courier is disabled
        if (destinations.length > 0) {
          await Settings.set('cached_destinations', {
            destinations,
            cachedAt: new Date().toISOString(),
          });
        }
      } catch (apiError) {
        console.warn('[Destinations] API call failed, falling back to cache:', apiError.message);
        // Fall through to use cached data
      }
    }

    // If no fresh data, try to get cached data
    if (destinations.length === 0) {
      const cached = await Settings.get('cached_destinations');
      if (cached && Array.isArray(cached.destinations)) {
        destinations = cached.destinations;
        fromCache = true;
      }
    }

    return res.json({
      destinations,
      fromCache,
      courierEnabled,
    });
  } catch (err) {
    return next(err);
  }
});

// 5) Admin manual approve & send to courier
router.post(
  '/admin/approve/:orderId',
  protect,
  requireRole('staff', 'manager', 'admin'),
  async (req, res, next) => {
    try {
      const orderId = req.params.orderId;
      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ message: 'Order not found' });

      // Prevent duplicate courier order
      if (order.courier?.trackingId) {
        return res.status(400).json({ message: 'Courier order already exists for this order' });
      }

      // Compute COD amount
      const codAmount = Math.max(0, Number(order.total || 0) + Number(order.shippingCharge || 0));

      // Build Steadfast payload
      const payload = {
        invoice: String(order._id),
        recipient_name: order.shipping?.name || 'Guest',
        recipient_phone: normalizeBdPhone(order.shipping?.phone),
        recipient_address: order.shipping?.address,
        recipient_email: (order.shipping?.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.shipping.email)) ? order.shipping.email : null,
        cod_amount: codAmount,
        note: order.notes?.[order.notes.length - 1]?.message || null,
        item_description: `${order.items.length} item(s)`,
        delivery_type: 0,
      };

      const result = await createSteadfastOrder(payload);

      if (!result || !result.consignment) {
        const msg = result?.message || 'Failed to create courier order';
        await ActivityLog.create({
          actorId: req.user._id,
          action: 'courier_approve_failed',
          entity: 'order',
          meta: { orderId: order._id, courier: 'steadfast', response: result },
        });
        return res.status(502).json({ message: msg });
      }

      const consignment = result.consignment;
      const rawStatus = consignment.status || 'pending';
      const friendlyStatus = mapSteadfastStatus(rawStatus);

      order.orderStatus = 'confirmed'; // Auto-confirm on courier approval
      order.courier = {
        name: 'steadfast',
        trackingId: consignment.tracking_code,
        statusRaw: rawStatus,
        statusFriendly: friendlyStatus,
        deliveryCharge: order.shippingCharge || 0,
        lastSyncedAt: new Date(),
        error: null,
      };

      await order.save();

      // Send SMS notification to customer (non-blocking)
      try {
        const smsResult = await sendOrderConfirmationSMS(order);
        if (smsResult.success) {
          console.log('[SMS] Order confirmation sent for order:', orderId);
        } else {
          console.log('[SMS] Failed to send confirmation:', smsResult.error);
        }
      } catch (smsError) {
        console.error('[SMS] Error sending confirmation:', smsError.message);
        // SMS failure should not block the approval response
      }

      await ActivityLog.create({
        actorId: req.user._id,
        action: 'courier_approve_success',
        entity: 'order',
        meta: {
          orderId: order._id,
          courier: 'steadfast',
          trackingId: consignment.tracking_code,
        },
      });

      return res.json({
        message: 'Order approved and sent to courier',
        courier: order.courier,
      });
    } catch (err) {
      return next(err);
    }
  }
);

// 4) Admin manual refresh per order
router.post(
  '/admin/refresh/:orderId',
  protect,
  requireRole('staff', 'manager', 'admin'),
  async (req, res, next) => {
    try {
      const orderId = req.params.orderId;
      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ message: 'Order not found' });

      if (!order.courier?.trackingId) {
        return res.status(400).json({ message: 'No courier tracking ID on this order' });
      }

      const data = await getSteadfastStatusByTrackingCode(order.courier.trackingId);
      const rawStatus = data?.delivery_status || order.courier.statusRaw || 'pending';
      const friendly = mapSteadfastStatus(rawStatus);

      order.courier.statusRaw = rawStatus;
      order.courier.statusFriendly = friendly;
      order.courier.lastSyncedAt = new Date();
      order.courier.error = null;

      // Optionally sync main orderStatus for user visibility
      if (friendly === 'Delivered') {
        order.orderStatus = 'delivered';
        order.paymentStatus = 'paid';
      } else if (friendly === 'Cancelled') {
        order.orderStatus = 'cancelled';
      }

      await order.save();

      await ActivityLog.create({
        actorId: req.user._id,
        action: 'courier_status_manual_refresh',
        entity: 'order',
        meta: { orderId: order._id, courier: 'steadfast', statusRaw: rawStatus },
      });

      return res.json({
        message: 'Courier status refreshed',
        courier: order.courier,
      });
    } catch (err) {
      return next(err);
    }
  }
);

// 6) Courier Management Routes
router.get(
  '/admin/balance',
  protect,
  requireRole('manager', 'admin'),
  async (req, res, next) => {
    try {
      const data = await getSteadfastBalance();
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/admin/returns',
  protect,
  requireRole('staff', 'manager', 'admin'),
  async (req, res, next) => {
    try {
      const data = await getSteadfastReturnRequests();
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/admin/payments',
  protect,
  requireRole('manager', 'admin'),
  async (req, res, next) => {
    try {
      const data = await getSteadfastPayments();
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/admin/payments/:id',
  protect,
  requireRole('manager', 'admin'),
  async (req, res, next) => {
    try {
      const data = await getSteadfastPaymentDetails(req.params.id);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/admin/returns',
  protect,
  requireRole('staff', 'manager', 'admin'),
  async (req, res, next) => {
    try {
      const { consignmentId, reason } = req.body;
      const data = await createSteadfastReturnRequest({
        consignment_id: consignmentId,
        reason
      });
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

export default router;


