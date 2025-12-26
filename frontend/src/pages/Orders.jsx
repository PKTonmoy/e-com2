import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDownIcon, ChevronUpIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import api from '../lib/api.js';
import { useToast } from '../components/ToastProvider.jsx';
import MobileHeader from '../components/MobileHeader';

const Orders = () => {
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [deletingOrderId, setDeletingOrderId] = useState(null);
  const [returnModal, setReturnModal] = useState(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnDetails, setReturnDetails] = useState('');
  const qc = useQueryClient();
  const { addToast } = useToast();

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await api.get('/orders/mine');
      return res.data;
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: (orderId) => api.put(`/orders/${orderId}/cancel`),
    onSuccess: () => {
      qc.invalidateQueries(['orders']);
      addToast('Order cancelled successfully. Stock has been restored.', 'success');
      setCancellingOrderId(null);
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to cancel order', 'error');
      setCancellingOrderId(null);
    },
  });

  const handleCancelOrder = (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      setCancellingOrderId(orderId);
      cancelOrderMutation.mutate(orderId);
    }
  };

  const deleteOrderMutation = useMutation({
    mutationFn: (orderId) => api.delete(`/orders/${orderId}`),
    onSuccess: () => {
      qc.invalidateQueries(['orders']);
      addToast('Order deleted from history.', 'success');
      setDeletingOrderId(null);
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to delete order', 'error');
      setDeletingOrderId(null);
    },
  });

  const handleDeleteOrder = (orderId) => {
    if (window.confirm('Are you sure you want to delete this order from your history? This action cannot be undone.')) {
      setDeletingOrderId(orderId);
      deleteOrderMutation.mutate(orderId);
    }
  };

  const canCancel = (status) => ['pending', 'confirmed'].includes(status);
  const canDelete = (status) => ['delivered', 'cancelled'].includes(status);

  // Check if order is within 7-day return window
  const canRequestReturn = (order) => {
    if (order.orderStatus !== 'delivered') return false;
    const deliveryDate = new Date(order.updatedAt);
    const daysSinceDelivery = (Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceDelivery <= 7;
  };

  // Return request mutation
  const returnMutation = useMutation({
    mutationFn: ({ orderId, reason, reasonDetails }) =>
      api.post('/returns', { orderId, reason, reasonDetails }),
    onSuccess: () => {
      qc.invalidateQueries(['orders']);
      addToast('Return request submitted successfully!', 'success');
      setReturnModal(null);
      setReturnReason('');
      setReturnDetails('');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to submit return request', 'error');
    },
  });

  const handleRequestReturn = () => {
    if (!returnReason) {
      addToast('Please select a return reason', 'error');
      return;
    }
    returnMutation.mutate({
      orderId: returnModal._id,
      reason: returnReason,
      reasonDetails: returnDetails,
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      returned: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-ivory dark:bg-matte">
      {/* Compact Mobile Header */}
      <MobileHeader title="My Orders" subtitle="History" />

      {/* Content */}
      <div className="lux-container py-4 sm:py-12 space-y-6">
        <h1 className="lux-heading hidden sm:block">My Orders</h1>
        {orders.length === 0 ? (
          <div className="lux-card p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gold/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-neutral-600 dark:text-neutral-300">You haven't placed any orders yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isExpanded = expandedOrder === order._id;
              const isCancelling = cancellingOrderId === order._id;
              const isDeleting = deletingOrderId === order._id;
              return (
                <div key={order._id} className="lux-card p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold">Order #{order._id.slice(-8)}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.orderStatus)}`}>
                          {order.orderStatus}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-300">
                        {order.items.length} item{order.items.length > 1 ? 's' : ''} • Total: ৳{order.total?.toFixed(2)}
                      </p>
                      {order.courier?.trackingId && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          Courier: {order.courier.name || 'Steadfast'} • Status: {order.courier.statusFriendly || 'Pending'} • Tracking: {order.courier.trackingId}
                        </p>
                      )}
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                        className="text-xs text-gold hover:underline flex items-center gap-1"
                      >
                        {isExpanded ? (
                          <>
                            Hide Details <ChevronUpIcon className="h-4 w-4" />
                          </>
                        ) : (
                          <>
                            View Details <ChevronDownIcon className="h-4 w-4" />
                          </>
                        )}
                      </button>
                      {canCancel(order.orderStatus) && (
                        <button
                          onClick={() => handleCancelOrder(order._id)}
                          disabled={isCancelling}
                          className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 disabled:opacity-50"
                        >
                          <XCircleIcon className="h-4 w-4" />
                          {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                      )}
                      {canDelete(order.orderStatus) && (
                        <button
                          onClick={() => handleDeleteOrder(order._id)}
                          disabled={isDeleting}
                          className="text-xs text-neutral-500 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400 flex items-center gap-1 disabled:opacity-50"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                      {canRequestReturn(order) && (
                        <button
                          onClick={() => setReturnModal(order)}
                          className="text-xs text-gold hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1"
                        >
                          <ArrowPathIcon className="h-4 w-4" />
                          Request Return
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 border-t border-gold/20 pt-4 space-y-4">
                      <div>
                        <p className="font-semibold text-sm mb-3">Order Items</p>
                        <div className="space-y-2">
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center p-3 bg-ivory/50 dark:bg-charcoal/50 rounded-lg"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-sm">{item.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  {item.selectedSize && (
                                    <span className="px-2 py-0.5 text-xs bg-gold/20 text-gold rounded-full font-medium">
                                      Size: {item.selectedSize}
                                    </span>
                                  )}
                                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Qty: {item.qty}
                                  </span>
                                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                    @ ৳{item.price?.toFixed(2)} each
                                  </span>
                                </div>
                              </div>
                              <p className="font-semibold text-sm">৳{(item.price * item.qty).toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {order.shipping && (
                        <div>
                          <p className="font-semibold text-sm mb-2">Shipping Address</p>
                          <p className="text-sm text-neutral-600 dark:text-neutral-300">
                            {order.shipping.name}<br />
                            {order.shipping.address}<br />
                            {order.shipping.city}, {order.shipping.postalCode}<br />
                            {order.shipping.country}
                          </p>
                        </div>
                      )}

                      <div className="space-y-1 pt-2 border-t border-gold/10">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-neutral-600 dark:text-neutral-300">Items Total</span>
                          <span className="font-semibold text-sm">৳{order.total?.toFixed(2)}</span>
                        </div>
                        {typeof order.shippingCharge === 'number' && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-neutral-600 dark:text-neutral-300">Shipping</span>
                            <span>৳{order.shippingCharge.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-1">
                          <span className="font-semibold">Grand Total</span>
                          <span className="font-bold text-lg text-gold">
                            ৳{((order.total || 0) + (order.shippingCharge || 0)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Return Request Modal */}
      {returnModal && (
        <div data-modal-overlay className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-display mb-4 text-matte dark:text-ivory">Request Return</h2>

            <div className="mb-4 p-3 bg-gold/10 rounded-xl text-sm">
              <p className="font-medium">Order #{returnModal._id.slice(-8)}</p>
              <p className="text-neutral-600 dark:text-neutral-400">
                {returnModal.items.length} item(s) • ৳{returnModal.total?.toFixed(2)}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Reason for Return *</label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
              >
                <option value="">Select a reason</option>
                <option value="defective">Defective Product</option>
                <option value="wrong_item">Wrong Item Received</option>
                <option value="not_as_described">Not as Described</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Additional Details (optional)</label>
              <textarea
                value={returnDetails}
                onChange={(e) => setReturnDetails(e.target.value)}
                placeholder="Describe the issue..."
                rows={3}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl resize-none"
              />
            </div>

            <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl mb-4 text-sm">
              <p className="font-medium mb-1">Return Policy</p>
              <p className="text-neutral-600 dark:text-neutral-400 text-xs">
                Returns must be requested within 7 days of delivery. Once approved,
                a pickup will be scheduled. After inspection, you'll receive a refund or store credit.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setReturnModal(null); setReturnReason(''); setReturnDetails(''); }}
                className="flex-1 py-3 bg-neutral-200 dark:bg-neutral-700 rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestReturn}
                disabled={returnMutation.isPending || !returnReason}
                className="flex-1 py-3 bg-gold text-matte rounded-xl font-medium disabled:opacity-50"
              >
                {returnMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>

            <Link
              to="/returns"
              className="block text-center text-sm text-gold hover:underline mt-4"
            >
              View all return requests
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
