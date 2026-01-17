import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, ExclamationTriangleIcon, TruckIcon } from '@heroicons/react/24/outline';
import api from '../../lib/api.js';
import { useToast } from '../../components/ToastProvider.jsx';
import { useCourierService } from '../../contexts/CourierServiceContext.jsx';
import { Link } from 'react-router-dom';

// Warning banner shown when courier service is disabled
const CourierDisabledBanner = () => {
  const { courierEnabled } = useCourierService();

  if (courierEnabled) return null;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <TruckIcon className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-4 w-4" />
            Courier Service Disabled
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
            The courier service is currently off. You can still process orders manually, but automatic courier dispatch is disabled.
          </p>
          <Link
            to="/admin/courier-management"
            className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline"
          >
            Enable Courier Service →
          </Link>
        </div>
      </div>
    </div>
  );
};

const AdminOrders = () => {
  const qc = useQueryClient();
  const { addToast } = useToast();
  const { courierEnabled } = useCourierService();
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

  const refreshCourierMutation = useMutation({
    mutationFn: (orderId) => api.post(`/delivery/admin/refresh/${orderId}`),
    onSuccess: () => {
      qc.invalidateQueries(['admin-orders']);
      addToast('Courier status refreshed.', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to refresh courier status', 'error');
    },
  });

  const approveOrderMutation = useMutation({
    mutationFn: (orderId) => api.post(`/delivery/admin/approve/${orderId}`),
    onSuccess: () => {
      qc.invalidateQueries(['admin-orders']);
      addToast('Order approved and sent to courier!', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to approve order', 'error');
    },
  });

  const createReturnMutation = useMutation({
    mutationFn: ({ consignmentId, reason }) => api.post('/delivery/admin/returns', { consignmentId, reason }),
    onSuccess: () => {
      addToast('Return request created successfully!', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to create return request', 'error');
    },
  });

  const resendSmsMutation = useMutation({
    mutationFn: (orderId) => api.post(`/orders/${orderId}/send-confirmation-sms`),
    onSuccess: () => {
      qc.invalidateQueries(['admin-orders']);
      addToast('SMS sent successfully!', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to send SMS', 'error');
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

      {/* Courier Disabled Warning Banner */}
      <CourierDisabledBanner />
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
                  {order.courier?.trackingId && (
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                      Courier: {order.courier.name || 'Steadfast'} • Status: {order.courier.statusFriendly || 'Pending'} • Tracking: {order.courier.trackingId}
                    </p>
                  )}
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
                    className="border border-primary-500/30 rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-ivory/80 dark:bg-matte font-body"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button
                    onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                    className="text-xs text-primary-600 hover:underline flex items-center gap-1"
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
                <div className="mt-4 border-t border-primary-500/20 pt-4 space-y-4">
                  {/* Contact & Order Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Contact Information */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <p className="font-semibold text-sm mb-3 flex items-center gap-2 text-blue-700 dark:text-blue-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Contact Information
                      </p>
                      <div className="text-sm space-y-2">
                        <p className="flex items-center gap-2">
                          <span className="text-neutral-500 dark:text-neutral-400">Name:</span>
                          <span className="font-medium text-matte dark:text-ivory">{order.shipping?.name || 'N/A'}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="text-neutral-500 dark:text-neutral-400">Phone:</span>
                          <a href={`tel:${order.shipping?.phone}`} className="font-medium text-primary-600 hover:underline">{order.shipping?.phone || 'N/A'}</a>
                        </p>
                        {order.shipping?.email && (
                          <p className="flex items-center gap-2">
                            <span className="text-neutral-500 dark:text-neutral-400">Email:</span>
                            <a href={`mailto:${order.shipping?.email}`} className="font-medium text-primary-600 hover:underline text-xs">{order.shipping.email}</a>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                      <p className="font-semibold text-sm mb-3 flex items-center gap-2 text-amber-700 dark:text-amber-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Shipping Address
                      </p>
                      <div className="text-sm text-neutral-600 dark:text-neutral-300 space-y-1">
                        <p>{order.shipping?.address || 'N/A'}</p>
                        <p>{order.shipping?.city}{order.shipping?.postalCode ? `, ${order.shipping.postalCode}` : ''}</p>
                        <p className="font-medium">{order.shipping?.country || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Order Info */}
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <p className="font-semibold text-sm mb-3 flex items-center gap-2 text-green-700 dark:text-green-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Order Details
                      </p>
                      <div className="text-sm space-y-2">
                        <p className="flex justify-between">
                          <span className="text-neutral-500 dark:text-neutral-400">Order ID:</span>
                          <span className="font-mono text-xs">#{order._id.slice(-8)}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-neutral-500 dark:text-neutral-400">Payment:</span>
                          <span className={`font-medium ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>{order.paymentStatus || 'pending'}</span>
                        </p>
                        {order.couponCode && (
                          <p className="flex justify-between">
                            <span className="text-neutral-500 dark:text-neutral-400">Coupon:</span>
                            <span className="font-medium text-purple-600">{order.couponCode}</span>
                          </p>
                        )}
                        {order.discount > 0 && (
                          <p className="flex justify-between">
                            <span className="text-neutral-500 dark:text-neutral-400">Discount:</span>
                            <span className="font-medium text-red-500">-৳{order.discount.toFixed(0)}</span>
                          </p>
                        )}
                        <p className="flex justify-between">
                          <span className="text-neutral-500 dark:text-neutral-400">Items Total:</span>
                          <span className="font-medium">৳{order.total.toFixed(0)}</span>
                        </p>
                        {typeof order.shippingCharge === 'number' && (
                          <p className="flex justify-between">
                            <span className="text-neutral-500 dark:text-neutral-400">Shipping:</span>
                            <span className="font-medium">৳{order.shippingCharge.toFixed(0)}</span>
                          </p>
                        )}
                        <p className="flex justify-between border-t border-green-200 dark:border-green-800 pt-2 mt-2">
                          <span className="font-semibold">Grand Total:</span>
                          <span className="font-bold text-primary-600">
                            ৳{(order.total + (order.shippingCharge || 0)).toFixed(0)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {order.courier && (
                    <div className="mt-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                      <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                        <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                          Courier Details
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => refreshCourierMutation.mutate(order._id)}
                            className="text-xs px-3 py-1 rounded-full bg-slate-800 text-ivory hover:bg-slate-700 disabled:opacity-50"
                            disabled={refreshCourierMutation.isLoading}
                          >
                            {refreshCourierMutation.isLoading ? 'Refreshing...' : 'Refresh Status'}
                          </button>
                          {order.courier.statusFriendly === 'Delivered' && (
                            <button
                              onClick={() => {
                                const reason = window.prompt('Reason for return (optional):');
                                if (reason !== null) {
                                  createReturnMutation.mutate({
                                    consignmentId: order.courier.trackingId,
                                    reason
                                  });
                                }
                              }}
                              className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 disabled:opacity-50"
                              disabled={createReturnMutation.isLoading}
                            >
                              {createReturnMutation.isLoading ? 'Requesting...' : 'Request Return'}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                        <p>
                          <span className="font-medium">Courier:</span> {order.courier.name || 'Steadfast'}
                        </p>
                        <p>
                          <span className="font-medium">Status:</span> {order.courier.statusFriendly || 'Pending'} ({order.courier.statusRaw || 'n/a'})
                        </p>
                        <p>
                          <span className="font-medium">Tracking ID:</span> {order.courier.trackingId || 'N/A'}
                        </p>
                        <p>
                          <span className="font-medium">Delivery Charge:</span>{' '}
                          {typeof order.courier.deliveryCharge === 'number'
                            ? `৳${order.courier.deliveryCharge.toFixed(0)}`
                            : 'N/A'}
                        </p>
                        <p>
                          <span className="font-medium">Last Synced:</span>{' '}
                          {order.courier.lastSyncedAt
                            ? new Date(order.courier.lastSyncedAt).toLocaleString()
                            : 'Never'}
                        </p>
                        {order.courier.error && (
                          <p className="text-red-500 col-span-full">
                            <span className="font-medium">Last Error:</span> {order.courier.error}
                          </p>
                        )}
                      </div>

                      {/* SMS Status Section */}
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-medium text-slate-700 dark:text-slate-200">SMS Status:</span>
                          {order.sms?.sent ? (
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Sent {order.sms?.sentAt ? new Date(order.sms.sentAt).toLocaleString() : ''}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              {order.sms?.error || 'Not sent'}
                            </span>
                          )}
                          {order.sms?.attempts > 0 && (
                            <span className="text-neutral-400">({order.sms.attempts} attempt{order.sms.attempts > 1 ? 's' : ''})</span>
                          )}
                        </div>
                        <button
                          onClick={() => resendSmsMutation.mutate(order._id)}
                          disabled={resendSmsMutation.isLoading}
                          className="text-xs px-3 py-1 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          {resendSmsMutation.isLoading ? 'Sending...' : (order.sms?.sent ? 'Resend SMS' : 'Send SMS')}
                        </button>
                      </div>
                    </div>
                  )}

                  {!order.courier?.trackingId && order.orderStatus !== 'cancelled' && (
                    <div className={`mt-4 p-4 ${courierEnabled ? 'bg-primary-500/5 border-primary-500/20' : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'} border rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4`}>
                      <div className="text-sm">
                        <p className={`font-semibold ${courierEnabled ? 'text-primary-600' : 'text-neutral-500'}`}>
                          {courierEnabled ? 'Awaiting Courier Approval' : 'Courier Service Disabled'}
                        </p>
                        <p className="text-neutral-500 text-xs">
                          {courierEnabled
                            ? 'Review shipping details before sending to Steadfast'
                            : 'Enable courier service to send orders automatically'}
                        </p>
                      </div>
                      {courierEnabled ? (
                        <button
                          onClick={() => approveOrderMutation.mutate(order._id)}
                          disabled={approveOrderMutation.isLoading}
                          className="w-full sm:w-auto px-6 py-2 bg-primary-500 text-matte font-bold text-xs uppercase tracking-widest rounded-full shadow-lg shadow-primary-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                          {approveOrderMutation.isLoading ? 'Processing...' : 'Approve & Send to Courier'}
                        </button>
                      ) : (
                        <Link
                          to="/admin/courier-management"
                          className="w-full sm:w-auto px-6 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-bold text-xs uppercase tracking-widest rounded-full text-center"
                        >
                          Enable Courier
                        </Link>
                      )}
                    </div>
                  )}

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
                              <span className="px-2 py-0.5 text-[10px] bg-primary-500/20 text-primary-600 rounded-full font-medium">
                                Size: {item.selectedSize}
                              </span>
                            )}
                            <span className="text-xs text-neutral-500">Qty: {item.qty}</span>
                          </div>
                          <p className="text-[11px] text-neutral-400 mt-1">SKU: {item.sku || 'N/A'}</p>
                        </div>
                        {/* Price */}
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold text-sm text-primary-600">৳{(item.price * item.qty).toFixed(0)}</p>
                          <p className="text-[10px] text-neutral-400">৳{item.price?.toFixed(0)} each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
              }
            </div>
          );
        })}
      </div>
    </div >
  );
};

export default AdminOrders;
