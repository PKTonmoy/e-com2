import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api.js';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { data: tiles } = useQuery({
    queryKey: ['tiles'],
    queryFn: async () => (await api.get('/stats/admin-tiles')).data,
  });
  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => (await api.get('/stats/sales')).data,
  });

  return (
    <div className="lux-container py-10 space-y-6">
      <h1 className="lux-heading">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Revenue 30d', value: `$${tiles?.totalRevenue || 0}`, to: '/admin/analytics' },
          { label: 'Orders Received', value: tiles?.ordersReceived || 0, to: '/admin/orders' },
          { label: 'Orders Completed', value: tiles?.ordersCompleted || 0, to: '/admin/orders' },
          { label: 'Active Carts', value: tiles?.activeCarts || 0, to: '/admin/analytics' },
        ].map((tile) => (
          <Link key={tile.label} to={tile.to} className="lux-card p-4">
            <p className="text-xs uppercase tracking-[0.2em]">{tile.label}</p>
            <p className="text-2xl font-semibold">{tile.value}</p>
          </Link>
        ))}
      </div>
      <div className="lux-card p-4 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sales}>
            <XAxis dataKey="_id" hide />
            <YAxis />
            <Tooltip />
            <Line dataKey="revenue" stroke="#C9A94F" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;

