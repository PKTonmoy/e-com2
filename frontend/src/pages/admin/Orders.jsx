import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import api from '../../lib/api.js';
import { useToast } from '../../components/ToastProvider.jsx';

const AdminOrders = () => {
  const qc = useQueryClient();
  const { addToast } = useToast();
  const [expandedOrder, setExpandedOrder] = useState(null);

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
    <div className="lux-container py-10 space-y-4">
      <h1 className="lux-heading">Admin Orders</h1>
      <div className="space-y-3">
        {orders.map((order) => {
          const isExpanded = expandedOrder === order._id;
          return (
            <div key={order._id} className="lux-card p-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-semibold">{order.userId?.name || 'Guest'}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300">
                    Order #{order._id.slice(-8)} • {order.items.length} items • ${order.total.toFixed(2)}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <select
                    value={order.orderStatus}
                    onChange={(e) => {
                      updateStatusMutation.mutate({
                        id: order._id,
                        status: e.target.value,
                      });
                    }}
                    className="border border-gold/30 rounded-lg px-3 py-1.5 text-sm bg-ivory/80 dark:bg-matte font-body"
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
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 border-t border-gold/20 pt-4 space-y-3">
                  <div>
                    <p className="font-semibold text-sm mb-2">Shipping Address</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">
                      {order.shipping?.name}
                      <br />
                      {order.shipping?.address}
                      <br />
                      {order.shipping?.city}, {order.shipping?.postalCode}
                      <br />
                      {order.shipping?.country}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-2">Order Items</p>
                    <div className="space-y-1">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between text-sm text-neutral-600 dark:text-neutral-300"
                        >
                          <span className="flex items-center gap-2">
                            {item.title}
                            {item.selectedSize && (
                              <span className="px-2 py-0.5 text-xs bg-gold/20 text-gold rounded-full font-medium">
                                Size: {item.selectedSize}
                              </span>
                            )}
                            <span className="text-neutral-500">× {item.qty}</span>
                          </span>
                          <span>${(item.price * item.qty).toFixed(2)}</span>
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
