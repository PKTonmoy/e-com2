import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { MagnifyingGlassIcon, TruckIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';
import api from '../lib/api.js';
import MobileHeader from '../components/MobileHeader';
import { getImageUrl } from '../utils/imageUrl.js';

const statusConfig = {
    pending: { label: 'Pending', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: ClockIcon },
    confirmed: { label: 'Confirmed', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: CheckCircleIcon },
    shipped: { label: 'Shipped', color: 'text-purple-500', bg: 'bg-purple-500/10', icon: TruckIcon },
    delivered: { label: 'Delivered', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircleIcon },
    cancelled: { label: 'Cancelled', color: 'text-red-500', bg: 'bg-red-500/10', icon: XCircleIcon },
};

const TrackOrder = () => {
    const location = useLocation();
    const initialData = location.state || {};

    const [orderNumber, setOrderNumber] = useState(initialData.orderNumber || '');
    const [identifier, setIdentifier] = useState(initialData.email || initialData.phone || '');
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Auto-track if coming from thank you page with data
    useEffect(() => {
        if (initialData.orderNumber && (initialData.email || initialData.phone)) {
            handleTrack();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleTrack = async () => {
        if (!orderNumber.trim()) {
            setError('Please enter your order number');
            return;
        }
        if (!identifier.trim()) {
            setError('Please enter your email or phone number');
            return;
        }

        setLoading(true);
        setError('');
        setOrder(null);

        try {
            const isEmail = identifier.includes('@');
            const res = await api.post('/orders/guest/track', {
                orderNumber: orderNumber.trim(),
                ...(isEmail ? { email: identifier.trim() } : { phone: identifier.trim() }),
            });
            setOrder(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Order not found. Please check your details.');
        } finally {
            setLoading(false);
        }
    };

    const status = order?.orderStatus ? statusConfig[order.orderStatus] : null;
    const StatusIcon = status?.icon || ClockIcon;

    return (
        <div className="min-h-screen bg-ivory dark:bg-matte">
            <MobileHeader title="Track Order" />

            <div className="lux-container py-8 sm:py-12">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="font-display text-2xl sm:text-3xl text-matte dark:text-ivory mb-2">
                            Track Your Order
                        </h1>
                        <p className="text-neutral-500 text-sm">
                            Enter your order number and email or phone to check status
                        </p>
                    </div>

                    {/* Search Form */}
                    <div className="lux-card p-6 mb-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                                    Order Number
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., ORD-20231227-ABC123"
                                    value={orderNumber}
                                    onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                                    className="w-full border border-neutral-200 dark:border-neutral-700 px-4 py-3 rounded-xl bg-white dark:bg-neutral-800 text-matte dark:text-ivory focus:outline-none focus:ring-2 focus:ring-gold/40"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                                    Email or Phone
                                </label>
                                <input
                                    type="text"
                                    placeholder="Email or phone used during checkout"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="w-full border border-neutral-200 dark:border-neutral-700 px-4 py-3 rounded-xl bg-white dark:bg-neutral-800 text-matte dark:text-ivory focus:outline-none focus:ring-2 focus:ring-gold/40"
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-red-500 text-center">{error}</p>
                            )}

                            <button
                                onClick={handleTrack}
                                disabled={loading}
                                className="w-full lux-btn-primary flex items-center justify-center gap-2"
                            >
                                <MagnifyingGlassIcon className="h-5 w-5" />
                                {loading ? 'Searching...' : 'Track Order'}
                            </button>
                        </div>
                    </div>

                    {/* Order Details */}
                    {order && (
                        <div className="lux-card overflow-hidden animate-fade-in-up">
                            {/* Status Header */}
                            <div className={`p-6 ${status?.bg || 'bg-neutral-100'} border-b border-gold/20`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-full ${status?.bg || 'bg-neutral-200'} flex items-center justify-center`}>
                                        <StatusIcon className={`h-7 w-7 ${status?.color || 'text-neutral-500'}`} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-neutral-500">Order Status</p>
                                        <p className={`text-xl font-display font-semibold ${status?.color || 'text-neutral-700'}`}>
                                            {status?.label || order.orderStatus}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Order Info */}
                            <div className="p-6 space-y-6">
                                {/* Order Number & Date */}
                                <div className="flex flex-wrap justify-between gap-4 pb-4 border-b border-gold/20">
                                    <div>
                                        <p className="text-xs text-neutral-500 uppercase tracking-wider">Order Number</p>
                                        <p className="font-semibold text-matte dark:text-ivory">{order.orderNumber}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-neutral-500 uppercase tracking-wider">Order Date</p>
                                        <p className="font-semibold text-matte dark:text-ivory">
                                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                </div>

                                {/* Items */}
                                <div>
                                    <p className="text-sm font-semibold text-matte dark:text-ivory mb-3">Items</p>
                                    <div className="space-y-3">
                                        {order.items?.map((item, idx) => (
                                            <div key={idx} className="flex gap-3">
                                                <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden flex-shrink-0">
                                                    {item.image && (
                                                        <img src={getImageUrl(item.image)} alt="" className="w-full h-full object-cover" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm text-matte dark:text-ivory line-clamp-1">{item.title}</p>
                                                    <p className="text-xs text-neutral-500">
                                                        Qty: {item.qty} {item.selectedSize && `• Size: ${item.selectedSize}`}
                                                    </p>
                                                    <p className="text-sm font-semibold text-gold mt-1">৳{(item.price * item.qty).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Shipping Address */}
                                <div className="pt-4 border-t border-gold/20">
                                    <p className="text-sm font-semibold text-matte dark:text-ivory mb-2">Shipping Address</p>
                                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                                        <p>{order.shipping?.name}</p>
                                        <p>{order.shipping?.address}</p>
                                        <p>{order.shipping?.city}</p>
                                        <p>{order.shipping?.phone}</p>
                                    </div>
                                </div>

                                {/* Courier Tracking */}
                                {order.courier?.trackingId && (
                                    <div className="pt-4 border-t border-gold/20">
                                        <p className="text-sm font-semibold text-matte dark:text-ivory mb-2">Courier Tracking</p>
                                        <div className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
                                            <p>Courier: {order.courier.name || 'Steadfast'}</p>
                                            <p>Tracking ID: <span className="font-mono">{order.courier.trackingId}</span></p>
                                            {order.courier.statusFriendly && (
                                                <p>Status: {order.courier.statusFriendly}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Total */}
                                <div className="pt-4 border-t border-gold/20 flex justify-between items-center">
                                    <span className="text-lg font-semibold text-matte dark:text-ivory">Total</span>
                                    <span className="text-2xl font-bold text-gold">
                                        ৳{((order.total || 0) + (order.shippingCharge || 0)).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Back to Shop */}
                    <div className="text-center mt-8">
                        <Link to="/shop" className="text-sm text-gold hover:underline">
                            ← Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrackOrder;
