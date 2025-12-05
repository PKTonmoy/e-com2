import { useQuery } from '@tanstack/react-query';
import api from '../lib/api.js';

const Orders = () => {
  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await api.get('/orders/mine');
      return res.data;
    },
  });

  return (
    <div className="lux-container py-12 space-y-6">
      <h1 className="lux-heading">My Orders</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order._id} className="lux-card p-4 space-y-2">
            <p className="font-semibold">Status: {order.orderStatus}</p>
            <p className="text-sm">Total ${order.total}</p>
            <p className="text-xs text-neutral-600">Items: {order.items.length}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;

