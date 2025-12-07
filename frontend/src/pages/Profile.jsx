import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRightOnRectangleIcon, UserCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import api from '../lib/api.js';
import { useToast } from '../components/ToastProvider.jsx';

const DEFAULT_CONTENT = {
  title: 'Profile',
  welcomeTitle: 'Welcome to PRELUX',
  welcomeSubtitle: 'Sign in to view your profile, track orders, and manage your wishlist.',
};

const Profile = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  // Fetch CMS content
  const { data: cmsContent } = useQuery({
    queryKey: ['content', 'profile.header'],
    queryFn: async () => {
      try {
        const res = await api.get('/content/profile.header');
        return res.data?.content || DEFAULT_CONTENT;
      } catch {
        return DEFAULT_CONTENT;
      }
    },
  });

  const content = cmsContent || DEFAULT_CONTENT;

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const res = await api.get('/auth/me');
        return res.data;
      } catch (err) {
        return null;
      }
    },
    retry: false,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const res = await api.get('/orders/mine');
      return res.data;
    },
    enabled: !!user,
  });

  const cancelOrderMutation = useMutation({
    mutationFn: (orderId) => api.put(`/orders/${orderId}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-orders']);
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    queryClient.invalidateQueries(['me']);
    navigate('/');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="lux-container py-12 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
      </div>
    );
  }

  // Not logged in - show login/signup options
  if (!user) {
    return (
      <div className="lux-container py-16 max-w-md mx-auto">
        <div className="lux-card p-8 text-center space-y-6">
          <UserCircleIcon className="h-20 w-20 mx-auto text-gold/60" />
          <div>
            <h1 className="font-display text-2xl mb-2">{content.welcomeTitle}</h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              {content.welcomeSubtitle}
            </p>
          </div>
          <div className="space-y-3">
            <Link
              to="/login"
              className="lux-btn-primary w-full block text-center"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="lux-btn border border-gold/40 w-full block text-center hover:bg-gold/10 transition"
            >
              Create Account
            </Link>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    );
  }

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
    <div className="lux-container py-12 space-y-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="lux-heading">Profile</h1>
          <button
            onClick={handleLogout}
            className="lux-btn border border-gold/40 flex items-center gap-2 hover:bg-gold/10 transition"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            Logout
          </button>
        </div>
        <div className="lux-card p-4 space-y-2 mt-4">
          <p className="font-semibold">{user.name}</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">{user.email}</p>
        </div>

        <div className="lux-card p-4 space-y-3 mt-4">
          <p className="font-semibold">Saved Payment Methods</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            For your security, payment details are not stored. You'll enter payment information at checkout.
          </p>
        </div>
      </div>

      <div>
        <h2 className="font-display text-2xl mb-4">Order History</h2>
        {orders.length === 0 ? (
          <div className="lux-card p-8 text-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-300">No orders yet.</p>
            <Link to="/shop" className="lux-btn-primary mt-4 inline-block">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isCancelling = cancellingOrderId === order._id;
              return (
                <div key={order._id} className="lux-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">Order #{order._id.slice(-8)}</p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-300">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${order.total.toFixed(2)}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-gold/20 pt-3">
                    <p className="text-sm font-semibold mb-2">{order.items.length} item(s)</p>
                    <ul className="text-sm space-y-1">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="text-neutral-600 dark:text-neutral-300">
                          {item.title} × {item.qty}
                        </li>
                      ))}
                    </ul>
                    {canCancel(order.orderStatus) && (
                      <div className="mt-4 pt-3 border-t border-dashed border-gold/20 flex justify-end">
                        <button
                          onClick={() => handleCancelOrder(order._id)}
                          disabled={isCancelling}
                          className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 disabled:opacity-50 border border-red-200 dark:border-red-900 rounded px-3 py-1.5 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <XCircleIcon className="h-4 w-4" />
                          {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
