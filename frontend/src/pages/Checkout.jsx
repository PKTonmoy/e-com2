import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api.js';
import MobileHeader from '../components/MobileHeader';
import { useCart } from '../store/useCart.js';
import { useState, useEffect } from 'react';
import { useToast } from '../components/ToastProvider.jsx';

const Checkout = () => {
  const { items, setItems, coupon, applyCoupon, removeCoupon, clearCart } = useCart();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [shipping, setShipping] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    postalCode: ''
  });

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setApplyingCoupon(true);
    setCouponError('');

    try {
      const res = await api.post('/coupons/validate', {
        code: couponCode,
        cartTotal: totalBeforeDiscount
      });
      applyCoupon(res.data);
      addToast(res.data.message || 'Coupon applied!');
      setCouponCode('');
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid coupon code');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponError('');
  };

  // Fetch current user data
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const res = await api.get('/auth/me');
        return res.data;
      } catch {
        return null;
      }
    },
  });

  // Prefill form with user data when available
  useEffect(() => {
    if (user) {
      setShipping(prev => ({
        ...prev,
        name: user.name || prev.name,
        phone: user.phone || prev.phone,
        address: user.address || prev.address,
        city: user.city || prev.city,
        country: user.country || prev.country,
        postalCode: user.postalCode || prev.postalCode,
      }));
    }
  }, [user]);

  const totalBeforeDiscount = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  let discount = 0;
  if (coupon) {
    if (coupon.type === 'percentage') {
      discount = totalBeforeDiscount ? (totalBeforeDiscount * coupon.value) / 100 : coupon.value;
    } else {
      discount = coupon.value;
    }
  }

  const total = totalBeforeDiscount - discount;

  const placeOrder = async () => {
    if (!shipping.name || !shipping.phone || !shipping.address || !shipping.city || !shipping.country || !shipping.postalCode) {
      alert('Please fill in all shipping details');
      return;
    }
    await api.post('/orders', { items, shipping, paymentStatus: 'paid', couponCode: coupon?.code });
    clearCart(); // Use clearCart instead of setItems([])
    navigate('/order/thank-you');
  };

  return (
    <div className="min-h-screen bg-ivory dark:bg-matte overflow-x-hidden">
      {/* Compact Mobile Header */}
      <MobileHeader title="Checkout" subtitle="Secure" />

      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-4 sm:py-12">
        {/* Desktop Header */}
        <div className="hidden sm:block mb-6 sm:mb-8">
          <h1 className="font-display text-2xl sm:text-4xl text-matte dark:text-ivory">Checkout</h1>
          <div className="h-0.5 w-16 bg-gradient-to-r from-gold to-transparent mt-2 sm:mt-3" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Shipping Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 sm:p-5 border border-neutral-100 dark:border-neutral-800">
              <h2 className="font-display text-base sm:text-lg font-semibold mb-3 sm:mb-4">Contact Information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    className="w-full border border-neutral-200 dark:border-neutral-700 p-3 rounded-lg bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
                    placeholder="John Doe"
                    value={shipping.name}
                    onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1.5">Mobile Number *</label>
                  <input
                    type="tel"
                    className="w-full border border-neutral-200 dark:border-neutral-700 p-3 rounded-lg bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
                    placeholder="+1 234 567 8900"
                    value={shipping.phone}
                    onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 sm:p-5 border border-neutral-100 dark:border-neutral-800">
              <h2 className="font-display text-base sm:text-lg font-semibold mb-3 sm:mb-4">Shipping Address</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1.5">Address *</label>
                  <input
                    type="text"
                    className="w-full border border-neutral-200 dark:border-neutral-700 p-3 rounded-lg bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
                    placeholder="123 Main Street, Apt 4B"
                    value={shipping.address}
                    onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1.5">City *</label>
                  <input
                    type="text"
                    className="w-full border border-neutral-200 dark:border-neutral-700 p-3 rounded-lg bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
                    placeholder="New York"
                    value={shipping.city}
                    onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1.5">Country *</label>
                  <input
                    type="text"
                    className="w-full border border-neutral-200 dark:border-neutral-700 p-3 rounded-lg bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
                    placeholder="United States"
                    value={shipping.country}
                    onChange={(e) => setShipping({ ...shipping, country: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1.5">Postal Code *</label>
                  <input
                    type="text"
                    className="w-full border border-neutral-200 dark:border-neutral-700 p-3 rounded-lg bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
                    placeholder="10001"
                    value={shipping.postalCode}
                    onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 sm:p-5 border border-neutral-100 dark:border-neutral-800 h-fit lg:sticky lg:top-24">
            <h2 className="font-display text-base sm:text-lg font-semibold mb-3 sm:mb-4">Order Summary</h2>

            {/* Items */}
            <div className="space-y-2 pb-3 sm:pb-4 border-b border-neutral-100 dark:border-neutral-800 mb-3 sm:mb-4">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start gap-2 text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400 break-words flex-1 min-w-0 text-xs sm:text-sm">
                    {item.title} × {item.qty}
                  </span>
                  <span className="font-medium text-sm whitespace-nowrap"><span className="text-base">৳</span> {(item.price * item.qty).toFixed(0)}</span>
                </div>
              ))}
            </div>

            {/* Coupon Code Section */}
            <div className="py-3 border-b border-neutral-100 dark:border-neutral-800 mb-3">
              <p className="text-sm font-medium mb-2">Coupon Code</p>
              {coupon ? (
                <div className="flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-gold">{coupon.code} applied!</span>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="p-1.5 rounded-full hover:bg-gold/10 transition-colors group"
                    title="Remove coupon"
                  >
                    <svg className="w-4 h-4 text-neutral-400 group-hover:text-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 min-w-0 border border-neutral-200 dark:border-neutral-700 rounded px-3 py-2 text-sm bg-transparent"
                      disabled={applyingCoupon}
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={applyingCoupon}
                      className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-sm font-medium rounded disabled:opacity-50"
                    >
                      {applyingCoupon ? '...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
                </>
              )}
            </div>

            <div className="flex justify-between text-sm mb-2">
              <span className="text-neutral-600 dark:text-neutral-400">Items</span>
              <span>{items.length}</span>
            </div>
            <div className="flex justify-between text-sm mb-3 sm:mb-4">
              <span className="text-neutral-600 dark:text-neutral-400">Shipping</span>
              <span className="text-green-600">Free</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-sm mb-3 sm:mb-4 text-gold">
                <span>Discount ({coupon.code})</span>
                <span className="font-medium">-<span className="text-base">৳</span> {discount.toFixed(0)}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 sm:pt-4 border-t border-neutral-100 dark:border-neutral-800 mb-4 sm:mb-6">
              <span className="font-semibold">Total</span>
              <span className="text-lg sm:text-xl font-bold text-gold"><span className="text-xl sm:text-2xl">৳</span> {total.toFixed(0)}</span>
            </div>

            <button
              className="w-full py-3 bg-gold text-matte font-semibold text-sm uppercase tracking-wider rounded-lg hover:bg-gold/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={placeOrder}
              disabled={!items.length}
            >
              Confirm Order
            </button>

            <p className="text-xs text-center text-neutral-500 mt-3">Payment simulated (test mode)</p>

            {/* Trust Badges */}
            <div className="flex justify-center gap-4 mt-4 text-xs text-neutral-400">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Secure
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Easy Returns
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
