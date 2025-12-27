import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api.js';
import MobileHeader from '../components/MobileHeader';
import HoldToCheckoutButton from '../components/HoldToCheckoutButton';
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
    email: '',
    address: '',
    city: '',
    country: 'Bangladesh',
  });
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [deliveryError, setDeliveryError] = useState('');
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [destinations, setDestinations] = useState([]);
  const [destinationsLoading, setDestinationsLoading] = useState(false);

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
        email: user.email || prev.email,
        address: user.address || prev.address,
        city: user.city || prev.city,
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

  const total = totalBeforeDiscount - discount + deliveryCharge;

  const fetchDeliveryCharge = async () => {
    if (!shipping.address || !shipping.city || !shipping.phone || !shipping.name) {
      return;
    }
    setDeliveryLoading(true);
    setDeliveryError('');
    try {
      const res = await api.post('/delivery/charge', {
        shipping,
        cartTotal: totalBeforeDiscount,
      });
      if (!res.data.available) {
        setDeliveryAvailable(false);
        setDeliveryCharge(0);
        setDeliveryError(res.data.message || 'Delivery not available for this address');
      } else {
        setDeliveryAvailable(true);
        setDeliveryCharge(res.data.deliveryCharge || 0);
      }
    } catch (err) {
      setDeliveryAvailable(false);
      setDeliveryCharge(0);
      setDeliveryError(err.response?.data?.message || 'Failed to calculate delivery charge');
    } finally {
      setDeliveryLoading(false);
    }
  };

  // Load destination list
  useEffect(() => {
    const loadDestinations = async () => {
      setDestinationsLoading(true);
      try {
        const res = await api.get('/delivery/destinations');
        setDestinations(res.data?.destinations || []);
      } catch (err) {
        addToast(err.response?.data?.message || 'Failed to load delivery destinations', 'error');
      } finally {
        setDestinationsLoading(false);
      }
    };
    loadDestinations();
  }, [addToast]);

  useEffect(() => {
    fetchDeliveryCharge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipping.address, shipping.city, shipping.phone, shipping.name]);

  const placeOrder = async () => {
    if (!shipping.name || !shipping.phone || !shipping.address || !shipping.city) {
      alert('Please fill in all shipping details');
      return;
    }

    // Email is required for guest checkout (account creation)
    if (!user && !shipping.email) {
      addToast('Email is required for order confirmation and account creation', 'error');
      return;
    }

    if (!paymentMethod) {
      addToast('Please select a payment method', 'error');
      return;
    }

    if (!deliveryAvailable || deliveryError) {
      addToast(deliveryError || 'Delivery is currently unavailable for this address', 'error');
      return;
    }

    try {
      const endpoint = user ? '/orders' : '/orders/guest';
      const orderRes = await api.post(endpoint, {
        items,
        shipping,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
        paymentMethod,
        shippingCharge: deliveryCharge,
        couponCode: coupon?.code,
      });

      // If new account was created, store the token for auto-login
      if (orderRes.data.accountCreated && orderRes.data.token) {
        localStorage.setItem('token', orderRes.data.token);
      }

      clearCart();
      // Navigate with order data and account creation info
      navigate('/order/thank-you', {
        state: {
          orderNumber: orderRes.data.orderNumber,
          isGuest: !user && !orderRes.data.accountCreated,
          email: shipping.email,
          phone: shipping.phone,
          // Account creation info
          accountCreated: orderRes.data.accountCreated,
          existingAccount: orderRes.data.existingAccount,
          tempPassword: orderRes.data.tempPassword,
          userInfo: orderRes.data.user,
        }
      });
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to place order', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-ivory dark:bg-matte overflow-x-hidden">
      {/* Mobile Header */}
      <MobileHeader title="Checkout" subtitle="Secure" />

      {/* Main Container */}
      <div className="w-full px-3 sm:px-6 lg:px-8 max-w-6xl mx-auto py-4 sm:py-10 pb-44 sm:pb-52 lg:pb-16 box-border">

        {/* Desktop Header */}
        <div className="hidden sm:block mb-8">
          <h1 className="font-display text-3xl lg:text-4xl text-matte dark:text-ivory">Checkout</h1>
          <div className="h-0.5 w-16 bg-gradient-to-r from-gold to-transparent mt-3" />
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-5 w-full min-w-0">

          {/* Left Column - Forms (3 cols on lg) */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-5 w-full min-w-0">

            {/* Contact Information */}
            <section className="w-full bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-6 border border-neutral-100 dark:border-neutral-800 shadow-sm box-border">
              <h2 className="font-display text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-matte dark:text-ivory flex items-center gap-2">
                <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gold/10 text-gold text-xs sm:text-sm flex items-center justify-center font-medium">1</span>
                Contact Information
              </h2>

              <div className="space-y-4">
                {/* Name & Phone Row */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 sm:mb-2">Full Name *</label>
                    <input
                      type="text"
                      className="w-full min-w-0 border border-neutral-200 dark:border-neutral-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white dark:bg-neutral-800 text-matte dark:text-ivory focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-transparent placeholder:text-neutral-400 text-sm sm:text-base box-border"
                      placeholder="Your full name"
                      value={shipping.name}
                      onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 sm:mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      className="w-full min-w-0 border border-neutral-200 dark:border-neutral-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white dark:bg-neutral-800 text-matte dark:text-ivory focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-transparent placeholder:text-neutral-400 text-sm sm:text-base box-border"
                      placeholder="01XXXXXXXXX"
                      value={shipping.phone}
                      onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 sm:mb-2">
                    Email {!user && <span className="text-neutral-400 font-normal">(for order updates)</span>}
                  </label>
                  <input
                    type="email"
                    className="w-full min-w-0 border border-neutral-200 dark:border-neutral-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white dark:bg-neutral-800 text-matte dark:text-ivory focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-transparent placeholder:text-neutral-400 text-sm sm:text-base box-border"
                    placeholder="email@example.com"
                    value={shipping.email || ''}
                    onChange={(e) => setShipping({ ...shipping, email: e.target.value })}
                  />
                </div>
              </div>
            </section>

            {/* Shipping Address */}
            <section className="w-full bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-6 border border-neutral-100 dark:border-neutral-800 shadow-sm box-border">
              <h2 className="font-display text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-matte dark:text-ivory flex items-center gap-2">
                <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gold/10 text-gold text-xs sm:text-sm flex items-center justify-center font-medium">2</span>
                Shipping Address
              </h2>

              <div className="space-y-4">
                {/* Full Address */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 sm:mb-2">Street Address *</label>
                  <input
                    type="text"
                    className="w-full min-w-0 border border-neutral-200 dark:border-neutral-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white dark:bg-neutral-800 text-matte dark:text-ivory focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-transparent placeholder:text-neutral-400 text-sm sm:text-base box-border"
                    placeholder="House no, Road, Area"
                    value={shipping.address}
                    onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                  />
                </div>

                {/* City/Thana */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 sm:mb-2">City / Thana *</label>
                  <select
                    className="w-full min-w-0 border border-neutral-200 dark:border-neutral-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white dark:bg-neutral-800 text-matte dark:text-ivory focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-transparent text-sm sm:text-base box-border"
                    value={shipping.city}
                    onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                    disabled={destinationsLoading || !destinations.length}
                  >
                    <option value="">
                      {destinationsLoading ? 'Loading...' : 'Select your area'}
                    </option>
                    {destinations.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}{d.district ? `, ${d.district}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Payment Method - Only on mobile (shown in summary on desktop) */}
            <section className="w-full lg:hidden bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-6 border border-neutral-100 dark:border-neutral-800 shadow-sm box-border">
              <h2 className="font-display text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-matte dark:text-ivory flex items-center gap-2">
                <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gold/10 text-gold text-xs sm:text-sm flex items-center justify-center font-medium">3</span>
                Payment Method
              </h2>

              <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-gold bg-gold/5 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethodMobile"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="w-5 h-5 accent-gold"
                />
                <div>
                  <span className="font-medium text-matte dark:text-ivory">Cash on Delivery</span>
                  <p className="text-xs text-neutral-500 mt-0.5">Pay when you receive</p>
                </div>
              </label>
            </section>
          </div>

          {/* Right Column - Order Summary (2 cols on lg) */}
          <div className="lg:col-span-2 w-full min-w-0">
            <div className="w-full bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-6 border border-neutral-100 dark:border-neutral-800 shadow-sm lg:sticky lg:top-24 box-border">
              <h2 className="font-display text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-matte dark:text-ivory">Order Summary</h2>

              {/* Cart Items */}
              <div className="space-y-3 sm:space-y-4 pb-3 sm:pb-4 border-b border-neutral-100 dark:border-neutral-800">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-3 sm:gap-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex-shrink-0 overflow-hidden">
                      {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-matte dark:text-ivory text-sm leading-tight line-clamp-2">{item.title}</p>
                      <p className="text-xs text-neutral-500 mt-1">Qty: {item.qty}</p>
                    </div>
                    <span className="text-sm font-semibold text-matte dark:text-ivory whitespace-nowrap">
                      ৳{(item.price * item.qty).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Coupon Code */}
              <div className="py-4 border-b border-neutral-100 dark:border-neutral-800">
                <p className="text-sm font-medium text-matte dark:text-ivory mb-3">Coupon Code</p>
                {coupon ? (
                  <div className="flex items-center justify-between px-4 py-3 bg-gold/10 border border-gold/30 rounded-xl">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-gold" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-gold">{coupon.code}</span>
                    </div>
                    <button onClick={handleRemoveCoupon} className="text-neutral-400 hover:text-red-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                        className="flex-1 min-w-0 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-gold/40"
                        disabled={applyingCoupon}
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={applyingCoupon}
                        className="px-5 py-2.5 bg-neutral-100 dark:bg-neutral-800 text-sm font-medium rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                      >
                        {applyingCoupon ? '...' : 'Apply'}
                      </button>
                    </div>
                    {couponError && <p className="text-xs text-red-500 mt-2">{couponError}</p>}
                  </>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="py-4 space-y-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Subtotal</span>
                  <span className="font-medium text-matte dark:text-ivory">৳{totalBeforeDiscount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Shipping</span>
                  <span className="font-medium text-matte dark:text-ivory">
                    {deliveryLoading ? 'Calculating...' : `৳${deliveryCharge.toLocaleString()}`}
                  </span>
                </div>
                {deliveryError && <p className="text-xs text-red-500 text-right">{deliveryError}</p>}
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Discount</span>
                    <span className="font-medium">-৳{discount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center py-4 mb-4">
                <span className="text-lg font-semibold text-matte dark:text-ivory">Total</span>
                <span className="text-2xl font-bold text-gold">৳{total.toLocaleString()}</span>
              </div>

              {/* Payment Method - Desktop only */}
              <div className="hidden lg:block mb-5 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                <p className="text-sm font-medium text-neutral-500 mb-3">Payment Method</p>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="w-5 h-5 accent-gold"
                  />
                  <span className="font-medium text-matte dark:text-ivory">Cash on Delivery</span>
                </label>
              </div>

              {/* Desktop Checkout Button */}
              <div className="hidden lg:block">
                <HoldToCheckoutButton
                  onComplete={placeOrder}
                  disabled={!items.length || !paymentMethod || !deliveryAvailable || !!deliveryError || deliveryLoading}
                  holdDuration={1800}
                />
                <p className="text-xs text-center text-neutral-400 mt-3">Hold button to confirm</p>
              </div>

              {/* Trust Badges */}
              <div className="flex justify-center gap-6 mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <span className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Secure
                </span>
                <span className="flex items-center gap-1.5 text-xs text-neutral-400">
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

      {/* Fixed Mobile Bottom Bar - Premium Glass Design */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden z-40 px-3 pb-3" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}>
        <div className="
          relative overflow-hidden
          bg-gradient-to-b from-white/98 to-ivory/98 dark:from-zinc-900/95 dark:to-black/98
          backdrop-blur-2xl
          rounded-3xl
          border border-gold/30 dark:border-gold/20
          shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1),0_0_15px_-5px_rgba(212,175,55,0.2)] dark:shadow-[0_-8px_30px_-5px_rgba(0,0,0,0.4),0_0_20px_-5px_rgba(212,175,55,0.15)]
          px-5 py-4
        ">
          {/* Subtle gold shimmer at top */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

          {/* Order Summary Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.15em] text-neutral-500 dark:text-neutral-400 font-medium">Order Total</span>
              <span className="w-1 h-1 rounded-full bg-gold/60" />
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-gold to-amber-600 dark:from-gold dark:via-amber-300 dark:to-gold">
                ৳{total.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Hold Button */}
          <HoldToCheckoutButton
            onComplete={placeOrder}
            disabled={!items.length || !paymentMethod || !deliveryAvailable || !!deliveryError || deliveryLoading}
            holdDuration={1800}
          />

          {/* Hint text */}
          <p className="text-[10px] text-center text-neutral-400 dark:text-neutral-500 mt-2.5 tracking-wide">
            Press & hold to confirm your order
          </p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
