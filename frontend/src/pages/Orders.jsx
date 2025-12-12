import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, XCircleIcon } from '@heroicons/react/24/outline';
import api from '../lib/api.js';
import { useToast } from '../components/ToastProvider.jsx';

const Orders = () => {
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
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

  const canCancel = (status) => ['pending', 'confirmed'].includes(status);

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
      <div className="sm:hidden bg-ivory dark:bg-matte border-b border-gold/20 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <div>
            <p className="text-gold text-[10px] font-medium uppercase tracking-widest">History</p>
            <div className="flex items-baseline gap-2">
              <h1 className="font-display text-lg text-matte dark:text-ivory leading-tight">My Orders</h1>
              {orders.length > 0 && <span className="text-xs text-neutral-400">({orders.length})</span>}
            </div>
          </div>
        </div>
      </div>

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

                      <div className="flex justify-between items-center pt-2 border-t border-gold/10">
                        <span className="font-semibold">Total</span>
                        <span className="font-bold text-lg text-gold">৳{order.total?.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
