import express from 'express';
import ReturnRequest from '../models/ReturnRequest.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import Notification from '../models/notificationModel.js';
import { protect, requireRole } from '../middleware/auth.js';
import { createSteadfastReturnRequest } from '../services/steadfastClient.js';
import crypto from 'crypto';

const router = express.Router();

// Constants
const RETURN_WINDOW_DAYS = 7;

// Helper to check if order is within return window
const isWithinReturnWindow = (order) => {
    if (order.orderStatus !== 'delivered') return false;

    // Use updatedAt as delivery date approximation, or specific deliveredAt if exists
    const deliveryDate = order.deliveredAt || order.updatedAt;
    const daysSinceDelivery = (Date.now() - new Date(deliveryDate).getTime()) / (1000 * 60 * 60 * 24);

    return daysSinceDelivery <= RETURN_WINDOW_DAYS;
};

// Helper to generate unique coupon code
const generateCouponCode = () => {
    const randomStr = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `RETURN-${randomStr}`;
};

// ==================== USER ROUTES ====================

// Create return request
router.post('/', protect, async (req, res, next) => {
    try {
        const { orderId, reason, reasonDetails, items } = req.body;

        // Find the order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user owns this order
        if (order.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only return your own orders' });
        }

        // Check if order is delivered
        if (order.orderStatus !== 'delivered') {
            return res.status(400).json({ message: 'Only delivered orders can be returned' });
        }

        // Check return window
        if (!isWithinReturnWindow(order)) {
            return res.status(400).json({
                message: `Return window has expired. Returns must be requested within ${RETURN_WINDOW_DAYS} days of delivery.`
            });
        }

        // Check if return request already exists for this order
        const existingReturn = await ReturnRequest.findOne({
            orderId,
            status: { $nin: ['rejected', 'completed'] }
        });
        if (existingReturn) {
            return res.status(400).json({ message: 'A return request already exists for this order' });
        }

        // Calculate refund amount from items
        const returnItems = items || order.items.map(item => ({
            productId: item.productId,
            title: item.title,
            qty: item.qty,
            price: item.price,
            selectedSize: item.selectedSize,
            image: item.image,
            reason: reason,
        }));

        const refundAmount = returnItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

        // Create return request
        const returnRequest = await ReturnRequest.create({
            orderId,
            orderNumber: order.orderNumber,
            userId: req.user._id,
            items: returnItems,
            reason,
            reasonDetails,
            refundAmount,
            status: 'pending',
        });

        // Update order status
        order.orderStatus = 'returned';
        order.notes.push({ message: 'Return request submitted by customer' });
        await order.save();

        // Emit socket event
        if (req.io) {
            req.io.emit('return:new', returnRequest);
        }

        res.status(201).json(returnRequest);
    } catch (err) {
        console.error('Return request creation error:', err);
        next(err);
    }
});

// Get user's return requests
router.get('/mine', protect, async (req, res) => {
    const returns = await ReturnRequest.find({
        userId: req.user._id,
        hiddenFromUser: { $ne: true } // Exclude soft-deleted items
    })
        .sort('-createdAt')
        .populate('orderId', 'orderNumber total');
    res.json(returns);
});

// Get single return request details
router.get('/:id', protect, async (req, res) => {
    const returnRequest = await ReturnRequest.findById(req.params.id)
        .populate('orderId')
        .populate('userId', 'name email');

    if (!returnRequest) {
        return res.status(404).json({ message: 'Return request not found' });
    }

    // Check if user owns this return or is admin
    if (returnRequest.userId._id.toString() !== req.user._id.toString() && req.user.role === 'customer') {
        return res.status(403).json({ message: 'Forbidden' });
    }

    res.json(returnRequest);
});

// Delete return request from history (soft delete)
router.delete('/:id', protect, async (req, res) => {
    const returnRequest = await ReturnRequest.findById(req.params.id);
    if (!returnRequest) return res.status(404).json({ message: 'Return request not found' });

    // Check if user owns this return
    if (returnRequest.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only delete your own return requests' });
    }

    // Only allow deletion of completed or rejected requests, essentially purely for history cleanup
    // Or allow any if it's just hiding from view. Let's allow any since it's just 'hiding'.
    // Consistent with orders.

    returnRequest.hiddenFromUser = true;
    await returnRequest.save();

    res.json({ message: 'Return request removed from your history' });
});

// ==================== ADMIN ROUTES ====================

// Get all return requests (admin)
router.get('/', protect, requireRole('staff', 'manager', 'admin'), async (req, res) => {
    const { status } = req.query;
    const filter = { hiddenFromAdmin: { $ne: true } }; // Exclude admin-soft-deleted
    if (status) filter.status = status;

    const returns = await ReturnRequest.find(filter)
        .sort('-createdAt')
        .limit(200)
        .populate('userId', 'name email phone')
        .populate('orderId', 'orderNumber shipping total');
    res.json(returns);
});

// Approve return request and schedule Steadfast pickup
router.put('/:id/approve', protect, requireRole('staff', 'manager', 'admin'), async (req, res, next) => {
    try {
        const returnRequest = await ReturnRequest.findById(req.params.id)
            .populate('orderId')
            .populate('userId', 'name email phone');

        if (!returnRequest) {
            return res.status(404).json({ message: 'Return request not found' });
        }

        if (returnRequest.status !== 'pending') {
            return res.status(400).json({ message: 'Only pending requests can be approved' });
        }

        const order = returnRequest.orderId;
        const { adminNotes } = req.body;

        // Update return request
        returnRequest.status = 'approved';
        returnRequest.adminNotes = adminNotes;
        returnRequest.processedBy = req.user._id;
        returnRequest.approvedAt = new Date();

        // Try to schedule Steadfast pickup
        if (order.courier?.name === 'steadfast') {
            try {
                const steadfastPayload = {
                    invoice: String(order._id), // Use original invoice ID
                    reason: returnRequest.reason,
                };

                const steadfastResponse = await createSteadfastReturnRequest(steadfastPayload);

                if (steadfastResponse?.consignment?.consignment_id || steadfastResponse?.status === 200) {
                    returnRequest.status = 'pickup_scheduled';
                    returnRequest.pickupScheduledAt = new Date();
                    returnRequest.steadfastData = {
                        consignmentId: steadfastResponse.consignment?.consignment_id || steadfastResponse.id, // Handle different response formats
                        trackingCode: steadfastResponse.consignment?.tracking_code,
                        status: steadfastResponse.consignment?.status || 'initiated',
                        pickupDate: new Date(),
                    };
                }
            } catch (courierError) {
                console.error('Steadfast pickup scheduling failed:', courierError);
                // Still approve, but note the courier error
                returnRequest.steadfastData = {
                    error: courierError.message || 'Failed to schedule pickup',
                };
            }
        }

        await returnRequest.save();

        // Create in-app notification for user
        const notification = await Notification.create({
            userId: returnRequest.userId._id || returnRequest.userId,
            type: 'order',
            title: '✅ Return Approved',
            message: `Your return request for order #${returnRequest.orderNumber || order.orderNumber} has been approved. A pickup courier will contact you soon.`,
            url: '/returns',
            priority: 'normal',
            meta: {
                returnRequestId: returnRequest._id,
                status: 'approved'
            }
        });

        // Emit socket events
        if (req.io) {
            req.io.emit('return:update', returnRequest);

            const userId = (returnRequest.userId._id || returnRequest.userId).toString();
            req.io.emit(`notification:${userId}`, notification);
            req.io.emit('notification:new', { userId, notification });
        }

        res.json(returnRequest);
    } catch (err) {
        console.error('Return approval error:', err);
        next(err);
    }
});

// Reject return request
router.put('/:id/reject', protect, requireRole('staff', 'manager', 'admin'), async (req, res) => {
    const returnRequest = await ReturnRequest.findById(req.params.id)
        .populate('userId', 'name email');

    if (!returnRequest) {
        return res.status(404).json({ message: 'Return request not found' });
    }

    if (returnRequest.status !== 'pending') {
        return res.status(400).json({ message: 'Only pending requests can be rejected' });
    }

    const { adminNotes } = req.body;

    returnRequest.status = 'rejected';
    returnRequest.adminNotes = adminNotes;
    returnRequest.processedBy = req.user._id;
    returnRequest.rejectedAt = new Date();
    returnRequest.refundType = 'none';
    await returnRequest.save();

    // Revert order status back to delivered
    await Order.findByIdAndUpdate(returnRequest.orderId, {
        orderStatus: 'delivered',
        $push: { notes: { message: `Return request rejected: ${adminNotes || 'No reason provided'}` } }
    });

    // Create in-app notification for user
    const notification = await Notification.create({
        userId: returnRequest.userId._id || returnRequest.userId,
        type: 'order', // Using 'order' as it relates to an order, could use 'system'
        title: '❌ Return Rejected',
        message: `Your return request for order #${returnRequest.orderNumber} has been rejected. Reason: ${adminNotes || 'Does not meet return criteria.'}`,
        url: '/returns',
        priority: 'high',
        meta: {
            returnRequestId: returnRequest._id,
            status: 'rejected',
            reason: adminNotes
        }
    });

    if (req.io) {
        req.io.emit('return:update', returnRequest);

        const userId = (returnRequest.userId._id || returnRequest.userId).toString();
        req.io.emit(`notification:${userId}`, notification);
        req.io.emit('notification:new', { userId, notification });
    }

    res.json(returnRequest);
});

// Mark product as received at warehouse
router.put('/:id/received', protect, requireRole('staff', 'manager', 'admin'), async (req, res, next) => {
    try {
        const returnRequest = await ReturnRequest.findById(req.params.id);

        if (!returnRequest) {
            return res.status(404).json({ message: 'Return request not found' });
        }

        if (!['approved', 'pickup_scheduled', 'in_transit'].includes(returnRequest.status)) {
            return res.status(400).json({ message: 'Return must be approved or in transit to mark as received' });
        }

        // Restore stock for returned items
        await Promise.all(
            returnRequest.items.map(async ({ productId, qty }) => {
                const product = await Product.findById(productId);
                if (product) {
                    product.stock = product.stock + qty;
                    await product.save();
                }
            })
        );

        returnRequest.status = 'received';
        returnRequest.receivedAt = new Date();
        returnRequest.processedBy = req.user._id;
        await returnRequest.save();

        // Update order notes
        await Order.findByIdAndUpdate(returnRequest.orderId, {
            $push: { notes: { message: 'Returned items received at warehouse. Stock restored.' } }
        });

        if (req.io) {
            req.io.emit('return:update', returnRequest);
        }

        res.json(returnRequest);
    } catch (err) {
        console.error('Return received error:', err);
        next(err);
    }
});

// Complete return with refund or coupon
router.put('/:id/complete', protect, requireRole('manager', 'admin'), async (req, res, next) => {
    try {
        const returnRequest = await ReturnRequest.findById(req.params.id)
            .populate('userId', 'name email');

        if (!returnRequest) {
            return res.status(404).json({ message: 'Return request not found' });
        }

        if (returnRequest.status !== 'received') {
            return res.status(400).json({ message: 'Products must be received before completing the return' });
        }

        const { refundType, adminNotes } = req.body;

        if (!['refund', 'coupon'].includes(refundType)) {
            return res.status(400).json({ message: 'Invalid refund type. Must be "refund" or "coupon"' });
        }

        returnRequest.refundType = refundType;
        if (adminNotes) returnRequest.adminNotes = adminNotes;
        returnRequest.processedBy = req.user._id;

        let notificationTitle, notificationMessage;

        // If coupon, generate one
        if (refundType === 'coupon') {
            const couponCode = generateCouponCode();

            const coupon = await Coupon.create({
                code: couponCode,
                type: 'fixed',
                value: returnRequest.refundAmount,
                active: true,
                expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days validity
                minPurchase: 0,
                usedBy: [],
            });

            returnRequest.couponCode = couponCode;
            returnRequest.couponId = coupon._id;

            // Update order notes
            await Order.findByIdAndUpdate(returnRequest.orderId, {
                $push: { notes: { message: `Return completed. Coupon issued: ${couponCode} (৳${returnRequest.refundAmount})` } }
            });

            // Notification content for coupon
            notificationTitle = '🎁 Store Credit Issued!';
            notificationMessage = `Your return has been processed. You've received a store credit coupon worth ৳${returnRequest.refundAmount.toFixed(2)}. Use code: ${couponCode} (Valid for 90 days)`;
        } else {
            // Refund - mark for manual processing
            await Order.findByIdAndUpdate(returnRequest.orderId, {
                paymentStatus: 'refunded',
                $push: { notes: { message: `Return completed. Refund of ৳${returnRequest.refundAmount} to be processed manually.` } }
            });

            // Notification content for refund
            notificationTitle = '💰 Refund Processing!';
            notificationMessage = `Your return has been approved. A refund of ৳${returnRequest.refundAmount.toFixed(2)} will be processed to your original payment method. Please allow 5-7 business days.`;
        }

        returnRequest.status = 'completed';
        returnRequest.completedAt = new Date();
        await returnRequest.save();

        // Create in-app notification for user
        const notification = await Notification.create({
            userId: returnRequest.userId._id || returnRequest.userId,
            type: 'order',
            title: notificationTitle,
            message: notificationMessage,
            url: '/returns',
            priority: 'high',
            meta: {
                returnRequestId: returnRequest._id,
                refundType,
                refundAmount: returnRequest.refundAmount,
                couponCode: returnRequest.couponCode || null,
            }
        });

        // Emit socket events
        if (req.io) {
            // Broadcast return update
            req.io.emit('return:update', returnRequest);

            // Send notification to specific user
            const userId = (returnRequest.userId._id || returnRequest.userId).toString();
            req.io.emit(`notification:${userId}`, notification);
            req.io.emit('notification:new', { userId, notification });
        }

        res.json(returnRequest);
    } catch (err) {
        console.error('Return completion error:', err);
        next(err);
    }
});

// Update return status (for in_transit, etc.)
router.put('/:id/status', protect, requireRole('staff', 'manager', 'admin'), async (req, res) => {
    const returnRequest = await ReturnRequest.findById(req.params.id);

    if (!returnRequest) {
        return res.status(404).json({ message: 'Return request not found' });
    }

    const { status, adminNotes } = req.body;
    const validStatuses = ['pending', 'approved', 'pickup_scheduled', 'in_transit', 'received'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    returnRequest.status = status;
    if (adminNotes) returnRequest.adminNotes = adminNotes;
    returnRequest.processedBy = req.user._id;
    await returnRequest.save();

    if (req.io) {
        req.io.emit('return:update', returnRequest);
    }

    res.json(returnRequest);
});

export default router;
