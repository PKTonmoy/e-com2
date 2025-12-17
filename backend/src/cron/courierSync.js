import Order from '../models/Order.js';
import ActivityLog from '../models/ActivityLog.js';
import { getSteadfastStatusByTrackingCode, mapSteadfastStatus } from '../services/steadfastClient.js';

// Periodic courier status synchronisation
// Intended to be triggered every few hours via an external scheduler or setInterval in server.js

export const syncCourierStatuses = async () => {
  const now = new Date();

  const filter = {
    'courier.name': 'steadfast',
    'courier.trackingId': { $ne: null },
    orderStatus: { $nin: ['delivered', 'cancelled'] },
  };

  const orders = await Order.find(filter).limit(200);

  for (const order of orders) {
    try {
      const trackingId = order.courier.trackingId;
      const data = await getSteadfastStatusByTrackingCode(trackingId);
      const rawStatus = data?.delivery_status || order.courier.statusRaw || 'pending';
      const friendly = mapSteadfastStatus(rawStatus);

      order.courier.statusRaw = rawStatus;
      order.courier.statusFriendly = friendly;
      order.courier.lastSyncedAt = now;
      order.courier.error = null;

      if (friendly === 'Delivered') {
        order.orderStatus = 'delivered';
        order.paymentStatus = 'paid';
      } else if (friendly === 'Cancelled') {
        order.orderStatus = 'cancelled';
      }

      await order.save();

      await ActivityLog.create({
        actorId: null,
        action: 'courier_status_sync_success',
        entity: 'order',
        meta: { orderId: order._id, courier: 'steadfast', statusRaw: rawStatus },
      });
    } catch (err) {
      order.courier.error = err.message || 'Courier sync failed';
      order.courier.lastSyncedAt = now;
      await order.save().catch(() => {});

      await ActivityLog.create({
        actorId: null,
        action: 'courier_status_sync_error',
        entity: 'order',
        meta: { orderId: order._id, courier: 'steadfast', error: err.message },
      }).catch(() => {});
    }
  }
};

export default syncCourierStatuses;


