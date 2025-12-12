import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import api from '../../lib/api.js';
import { useToast } from '../../components/ToastProvider.jsx';

const AdminOrders = () => {
  const qc = useQueryClient();
  const { addToast } = useToast();
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [deletingOrderId, setDeletingOrderId] = useState(null);

  const { data: orders = [] } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => (await api.get('/admin/orders')).data,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/orders/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries(['admin-orders']);
      addToast('Order status updated!');
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (orderId) => api.delete(`/admin/orders/${orderId}`),
    onSuccess: () => {
      qc.invalidateQueries(['admin-orders']);
      addToast('Order deleted successfully.', 'success');
      setDeletingOrderId(null);
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to delete order', 'error');
      setDeletingOrderId(null);
    },
  });

  const handleDeleteOrder = (orderId) => {
    if (window.confirm('Are you sure you want to permanently delete this order? This action cannot be undone.')) {
      setDeletingOrderId(orderId);
      deleteOrderMutation.mutate(orderId);
    }
  };

  const canDelete = (status) => ['delivered', 'cancelled'].includes(status);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-4 max-w-7xl mx-auto">
      <h1 className="font-display text-xl sm:text-2xl text-matte dark:text-ivory">Admin Orders</h1>
      <div className="space-y-3">
        {orders.map((order) => {
          const isExpanded = expandedOrder === order._id;
          const isDeleting = deletingOrderId === order._id;
          return (
            <div key={order._id} className="lux-card p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <p className="font-semibold text-sm sm:text-base">{order.userId?.name || 'Guest'}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300">
                    #{order._id.slice(-8)} • {order.items.length} items • ৳{order.total.toFixed(2)}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                  <select
                    value={order.orderStatus}
                    onChange={(e) => {
                      updateStatusMutation.mutate({
                        id: order._id,
                        status: e.target.value,
                      });
                    }}
                    className="border border-gold/30 rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-ivory/80 dark:bg-matte font-body"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
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
                  {canDelete(order.orderStatus) && (
                    <button
                      onClick={() => handleDeleteOrder(order._id)}
                      disabled={isDeleting}
                      className="text-xs text-neutral-500 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400 flex items-center gap-1 disabled:opacity-50"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {isDeleting ? 'Deleting...' : 'Delete Order'}
                    </button>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 border-t border-gold/20 pt-4 space-y-4">
                  {/* Shipping Address */}
                  <div>
                    <p className="font-semibold text-sm mb-2">Shipping Address</p>
                    <div className="text-sm text-neutral-600 dark:text-neutral-300 space-y-1">
                      <p className="font-medium">{order.shipping?.name}</p>
                      {order.shipping?.phone && (
                        <p className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className="font-medium text-gold">{order.shipping?.phone}</span>
                        </p>
                      )}
                      <p>{order.shipping?.address}</p>
                      <p>{order.shipping?.city}, {order.shipping?.postalCode}</p>
                      <p>{order.shipping?.country}</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-2">Order Items</p>
                    <div className="space-y-3">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex gap-3 p-3 bg-ivory/50 dark:bg-charcoal/50 rounded-lg"
                        >
                          {/* Product Image */}
                          {item.image && (
                            <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                              <img
                                src={item.image.startsWith('http') ? item.image : `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}/uploads/${item.image}`}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-matte dark:text-ivory truncate">{item.title}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {item.category && (
                                <span className="px-2 py-0.5 text-[10px] bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-full uppercase tracking-wide">
                                  {item.category}
                                </span>
                              )}
                              {item.selectedSize && (
                                <span className="px-2 py-0.5 text-[10px] bg-gold/20 text-gold rounded-full font-medium">
                                  Size: {item.selectedSize}
                                </span>
                              )}
                              <span className="text-xs text-neutral-500">Qty: {item.qty}</span>
                            </div>
                            <p className="text-[11px] text-neutral-400 mt-1">SKU: {item.sku || 'N/A'}</p>
                          </div>
                          {/* Price */}
                          <div className="text-right flex-shrink-0">
                            <p className="font-semibold text-sm text-gold">৳{(item.price * item.qty).toFixed(0)}</p>
                            <p className="text-[10px] text-neutral-400">৳{item.price?.toFixed(0)} each</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminOrders;
