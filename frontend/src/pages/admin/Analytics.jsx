import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api.js';

const AdminAnalytics = () => {
  const { data: top = [] } = useQuery({
    queryKey: ['top-products'],
    queryFn: async () => (await api.get('/stats/top-products')).data,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: async () => (await api.get('/admin/logs')).data,
  });

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 max-w-7xl mx-auto">
      <h1 className="font-display text-xl sm:text-2xl text-matte dark:text-ivory">Analytics</h1>

      <div className="lux-card p-4 space-y-3">
        <p className="font-semibold">Top Selling</p>
        <ul className="space-y-2 text-sm">
          {top.map((item) => (
            <li key={item._id?._id || item._id}>
              {item._id?.title || 'Product'} — {item.sold} sold (${item.revenue})
            </li>
          ))}
        </ul>
      </div>

      <div className="lux-card p-4 space-y-3">
        <p className="font-semibold">Activity Log</p>
        {logs.length === 0 ? (
          <p className="text-sm text-neutral-600 dark:text-neutral-300">No activity yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gold/20">
                <tr>
                  <th className="text-left py-2">Time</th>
                  <th className="text-left py-2">Action</th>
                  <th className="text-left py-2">Entity</th>
                  <th className="text-left py-2">Actor ID</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 50).map((log) => (
                  <tr key={log._id} className="border-b border-gold/10">
                    <td className="py-2 text-neutral-600 dark:text-neutral-300">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2">{log.action}</td>
                    <td className="py-2">{log.entity}</td>
                    <td className="py-2 text-neutral-600 dark:text-neutral-300 text-xs">
                      {log.actorId?.toString().slice(-8) || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;

