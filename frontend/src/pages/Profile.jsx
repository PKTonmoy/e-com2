import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRightOnRectangleIcon, UserCircleIcon, XCircleIcon, TrashIcon, ArrowPathIcon, MapPinIcon, PhoneIcon, BookOpenIcon, ChevronDownIcon, ChevronUpIcon, CheckCircleIcon, ClockIcon, TruckIcon, GiftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../lib/api.js';
import { useToast } from '../components/ToastProvider.jsx';
import OrderStatusTracker from '../components/OrderStatusTracker.jsx';

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
  const [returnModal, setReturnModal] = useState(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnDetails, setReturnDetails] = useState('');
  const [showFullGuide, setShowFullGuide] = useState(false);
  const [returnStep, setReturnStep] = useState('guide'); // 'guide' or 'form'

  // Fetch Return Guide Content
  const { data: guideContent } = useQuery({
    queryKey: ['content', 'returns.guide'],
    queryFn: async () => {
      try {
        const res = await api.get('/content/returns.guide');
        return res.data?.content || {
          title: 'Return Policy & Guide',
          description: 'Returns must be requested within 7 days of delivery. Once approved, a pickup will be scheduled. After inspection, you will receive a refund or store credit.'
        };
      } catch {
        return {
          title: 'Return Policy & Guide',
          description: 'Returns must be requested within 7 days of delivery. Once approved, a pickup will be scheduled. After inspection, you will receive a refund or store credit.'
        };
      }
    },
  });

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

  const { data: myReturns = [] } = useQuery({
    queryKey: ['my-returns'],
    queryFn: async () => {
      const res = await api.get('/returns/mine');
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

  const [deletingOrderId, setDeletingOrderId] = useState(null);

  const deleteOrderMutation = useMutation({
    mutationFn: (orderId) => api.delete(`/orders/${orderId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-orders']);
      addToast('Order deleted from history.', 'success');
      setDeletingOrderId(null);
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to delete order', 'error');
      setDeletingOrderId(null);
    },
  });

  const handleCancelOrder = (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      setCancellingOrderId(orderId);
      cancelOrderMutation.mutate(orderId);
    }
  };

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
      queryClient.invalidateQueries(['my-orders']);
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    queryClient.invalidateQueries(['me']);
    navigate('/');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
      </div>
    );
  }

  // Not logged in - show login/signup options
  if (!user) {
    return (
      <div className="min-h-screen pt-20 px-4 flex items-center justify-center">
        <div className="lux-card p-8 text-center space-y-6 max-w-md w-full border border-gold/20">
          <UserCircleIcon className="h-20 w-20 mx-auto text-gold/60" />
          <div>
            <h1 className="font-display text-2xl mb-2 text-matte dark:text-ivory">{content.welcomeTitle}</h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {content.welcomeSubtitle}
            </p>
          </div>
          <div className="space-y-3">
            <Link
              to="/login"
              className="lux-btn-primary w-full block text-center py-3"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="lux-btn border border-gold/40 w-full block text-center hover:bg-gold/10 transition py-3"
            >
              Create Account
            </Link>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-500">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
      confirmed: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
      shipped: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
      delivered: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
      cancelled: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    };
    return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 md:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">

      {/* Header & User Info */}
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center space-y-4 relative">
          <h1 className="font-display text-4xl text-matte dark:text-ivory">Profile</h1>

          <div className="relative">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-24 h-24 rounded-full object-cover border-2 border-gold shadow-lg" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center border-2 border-gold/50 shadow-lg">
                <span className="text-gold font-display text-4xl">{user.name?.charAt(0)?.toUpperCase()}</span>
              </div>
            )}
            {user.provider === 'google' && (
              <div className="absolute -bottom-2 -right-2 bg-white dark:bg-neutral-900 rounded-full p-1.5 shadow-md border border-neutral-100 dark:border-neutral-800" title="Google Account">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-medium text-matte dark:text-ivory">{user.name}</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{user.email}</p>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/orders"
            className="flex items-center justify-center gap-2 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 hover:border-gold/50 transition-colors group"
          >
            <svg className="h-5 w-5 text-neutral-500 group-hover:text-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="text-sm font-medium">My Orders</span>
          </Link>

          {myReturns.length > 0 && (
            <Link
              to="/returns"
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 hover:border-gold/50 transition-colors group"
            >
              <ArrowPathIcon className="h-5 w-5 text-neutral-500 group-hover:text-gold transition-colors" />
              <span className="text-sm font-medium">My Returns</span>
            </Link>
          )}

          <button
            onClick={handleLogout}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-900/10 dark:hover:border-red-900/30 transition-colors group ${myReturns.length > 0 ? '' : 'col-span-1'}`}
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 text-neutral-500 group-hover:text-red-500 transition-colors" />
            <span className="text-sm font-medium group-hover:text-red-600 dark:group-hover:text-red-400">Logout</span>
          </button>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Contact Info */}
          <div className="p-5 rounded-2xl bg-white/50 dark:bg-neutral-900/20 border border-neutral-200/60 dark:border-neutral-800 backdrop-blur-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">Item Delivery Details</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <PhoneIcon className="w-5 h-5 text-gold mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-matte dark:text-ivory">{user.phone || 'No phone number added'}</p>
                  <p className="text-xs text-neutral-500">Primary Contact</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPinIcon className="w-5 h-5 text-gold mt-0.5" />
                <div>
                  <p className="text-sm text-matte dark:text-ivory leading-relaxed">
                    {user.address || 'No address added'}
                  </p>
                  {(user.city || user.country) && (
                    <p className="text-xs text-neutral-500">{[user.city, user.postalCode, user.country].filter(Boolean).join(', ')}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="p-5 rounded-2xl bg-white/50 dark:bg-neutral-900/20 border border-neutral-200/60 dark:border-neutral-800 backdrop-blur-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">Saved Payment Methods</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              For your security, payment details are not stored on our servers. You'll enter payment information securely at checkout.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-200 dark:border-neutral-800"></div>

      {/* Order History */}
      <div>
        <h2 className="font-display text-2xl mb-6 text-matte dark:text-ivory">Order History</h2>
        {orders.length === 0 ? (
          <div className="lux-card p-10 text-center border-dashed border-2 border-neutral-200 dark:border-neutral-800 bg-transparent">
            <p className="text-neutral-500 dark:text-neutral-400 mb-4">You haven't placed any orders yet.</p>
            <Link to="/shop" className="lux-btn-primary inline-flex items-center gap-2">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => {
              const isCancelling = cancellingOrderId === order._id;
              const isDeleting = deletingOrderId === order._id;
              return (
                <div key={order._id} className="group bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden hover:border-gold/30 transition-all shadow-sm">
                  {/* Card Header */}
                  <div className="p-4 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="flex flex-col">
                      <span className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Order #{order._id.slice(-8)}</span>
                      <span className="text-xs text-neutral-400">{new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-4">
                    <ul className="space-y-3">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="flex justify-between items-center text-sm">
                          <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                            <span className="text-neutral-400 mr-2">×{item.qty}</span>
                            {item.title}
                          </span>
                          {/* Ideally show item price here too if available per item easily */}
                        </li>
                      ))}
                    </ul>

                    <div className="flex justify-between items-center pt-2 border-t border-dashed border-neutral-200 dark:border-neutral-800">
                      <span className="text-sm text-neutral-500">Total Amount</span>
                      <span className="font-display text-lg text-matte dark:text-ivory">৳{order.total.toFixed(2)}</span>
                    </div>

                    {order.orderStatus !== 'cancelled' && (
                      <div className="mt-2">
                        <OrderStatusTracker status={order.orderStatus} />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="grid grid-flow-col auto-cols-auto gap-2 pt-2">
                      {canCancel(order.orderStatus) && (
                        <button
                          onClick={() => handleCancelOrder(order._id)}
                          disabled={isCancelling}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-colors dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/30 dark:hover:bg-red-900/20"
                        >
                          <XCircleIcon className="h-4 w-4" />
                          {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                      )}

                      {canDelete(order.orderStatus) && (
                        <button
                          onClick={() => handleDeleteOrder(order._id)}
                          disabled={isDeleting}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-600 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700 dark:hover:bg-neutral-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                      )}

                      {canRequestReturn(order) && (
                        <button
                          onClick={() => setReturnModal(order)}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gold bg-gold/5 hover:bg-gold/10 border border-gold/20 rounded-lg transition-colors"
                        >
                          <ArrowPathIcon className="h-4 w-4" />
                          Request Return
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Return Request Modal - Two Step Flow */}
      {returnModal && createPortal(
        <div data-modal-overlay className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in duration-200">

            {/* STEP 1: Return Guide */}
            {returnStep === 'guide' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-display text-matte dark:text-ivory flex items-center gap-2">
                    <BookOpenIcon className="w-6 h-6 text-gold" />
                    {guideContent?.title || 'Return Policy & Guide'}
                  </h2>
                  <button onClick={() => { setReturnModal(null); setReturnStep('guide'); }} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Visual Workflow Steps */}
                <div className="space-y-4 mb-6">
                  {(guideContent?.steps || [
                    { title: 'Submit Return Request', description: 'Fill out the form with your reason for return' },
                    { title: 'Admin Review', description: 'Our team will review and approve your request within 24-48 hours' },
                    { title: 'Courier Pickup', description: 'Once approved, a pickup will be scheduled at your address' },
                    { title: 'Refund or Store Credit', description: 'After inspection, you\'ll receive a refund or store credit coupon' },
                  ]).map((step, index) => {
                    const stepColors = [
                      { bg: 'from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10', border: 'border-blue-200/50 dark:border-blue-800/30', dot: 'bg-blue-500', title: 'text-blue-800 dark:text-blue-300', desc: 'text-blue-600/70 dark:text-blue-400/70' },
                      { bg: 'from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-900/10', border: 'border-amber-200/50 dark:border-amber-800/30', dot: 'bg-amber-500', title: 'text-amber-800 dark:text-amber-300', desc: 'text-amber-600/70 dark:text-amber-400/70' },
                      { bg: 'from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-900/10', border: 'border-purple-200/50 dark:border-purple-800/30', dot: 'bg-purple-500', title: 'text-purple-800 dark:text-purple-300', desc: 'text-purple-600/70 dark:text-purple-400/70' },
                      { bg: 'from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-900/10', border: 'border-green-200/50 dark:border-green-800/30', dot: 'bg-green-500', title: 'text-green-800 dark:text-green-300', desc: 'text-green-600/70 dark:text-green-400/70' },
                    ];
                    const color = stepColors[index] || stepColors[0];
                    return (
                      <div key={index} className={`flex items-start gap-4 p-4 bg-gradient-to-r ${color.bg} rounded-xl border ${color.border}`}>
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${color.dot} text-white flex items-center justify-center font-bold text-sm`}>{index + 1}</div>
                        <div>
                          <p className={`font-semibold ${color.title}`}>{step.title}</p>
                          <p className={`text-sm ${color.desc}`}>{step.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Additional Policy Notes */}
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 mb-6">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed whitespace-pre-wrap">
                    {guideContent?.description || 'Returns must be requested within 7 days of delivery. Products must be in original condition with all tags attached. Once approved, a pickup will be scheduled. After inspection, you will receive a refund or store credit.'}
                  </p>
                </div>

                {/* Important Notice */}
                <div className="p-3 bg-gold/10 border border-gold/20 rounded-lg mb-6">
                  <p className="text-xs text-gold font-medium flex items-center gap-2">
                    <ClockIcon className="w-4 h-4" />
                    Returns must be requested within 7 days of delivery
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => { setReturnModal(null); setReturnStep('guide'); }}
                    className="flex-1 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setReturnStep('form')}
                    className="flex-1 py-3 bg-gold text-matte rounded-xl font-medium hover:bg-amber-400 transition shadow-lg shadow-gold/20 flex items-center justify-center gap-2"
                  >
                    I Understand, Continue
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Return Form */}
            {returnStep === 'form' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-display text-matte dark:text-ivory">Request Return</h2>
                  <button onClick={() => { setReturnModal(null); setReturnStep('guide'); setReturnReason(''); setReturnDetails(''); }} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-800">
                  <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Order Details</p>
                  <div className="flex justify-between items-baseline">
                    <p className="font-medium text-matte dark:text-ivory text-lg">Order #{returnModal._id.slice(-8)}</p>
                    <p className="font-medium text-gold">৳{returnModal.total?.toFixed(2)}</p>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    {returnModal.items.length} item(s) included
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-neutral-700 dark:text-neutral-300">Reason for Return *</label>
                    <div className="relative">
                      <select
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}
                        className="w-full pl-4 pr-10 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none appearance-none transition-all"
                      >
                        <option value="">Select a reason</option>
                        <option value="defective">Defective Product</option>
                        <option value="wrong_item">Wrong Item Received</option>
                        <option value="not_as_described">Not as Described</option>
                        <option value="other">Other</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-neutral-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-neutral-700 dark:text-neutral-300">Additional Details <span className="text-neutral-400 font-normal">(Optional)</span></label>
                    <textarea
                      value={returnDetails}
                      onChange={(e) => setReturnDetails(e.target.value)}
                      placeholder="Please describe the issue in detail..."
                      rows={3}
                      className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none resize-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => setReturnStep('guide')}
                    className="flex-1 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleRequestReturn}
                    disabled={returnMutation.isPending || !returnReason}
                    className="flex-1 py-3 bg-gold text-matte rounded-xl font-medium hover:bg-amber-400 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gold/20"
                  >
                    {returnMutation.isPending ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Profile;
