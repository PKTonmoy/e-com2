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
    email: '',
    address: '',
    city: '',
    country: 'Bangladesh',
    postalCode: ''
  });
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [deliveryError, setDeliveryError] = useState('');
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState(''); // user must choose (currently only COD)
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

  const total = totalBeforeDiscount - discount + deliveryCharge;

  const fetchDeliveryCharge = async () => {
    if (!shipping.address || !shipping.city || !shipping.country || !shipping.phone || !shipping.name) {
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

  // Load destination list (Steadfast police stations) once
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
  }, [shipping.address, shipping.city, shipping.country, shipping.phone, shipping.name]);

  const placeOrder = async () => {
    if (!shipping.name || !shipping.phone || !shipping.address || !shipping.city || !shipping.country || !shipping.postalCode) {
      alert('Please fill in all shipping details');
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
      // Use guest endpoint if user is not logged in
      const endpoint = user ? '/orders' : '/orders/guest';
      const orderRes = await api.post(endpoint, {
        items,
        shipping,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
        paymentMethod,
        shippingCharge: deliveryCharge,
        couponCode: coupon?.code,
      });

      const createdOrder = orderRes.data;

      // 2) For COD, create courier order
      if (paymentMethod === 'cod') {
        try {
          await api.post('/delivery/create', {
            orderId: createdOrder._id,
            paymentMethod: 'cod',
            expectedDeliveryCharge: deliveryCharge,
          });
        } catch (err) {
          // Backend will rollback/cancel on failure; surface message
          const msg = err.response?.data?.message || 'Failed to create courier order. Your order was not placed.';
          addToast(msg, 'error');
          return;
        }
      }

      clearCart();
      navigate('/order/thank-you');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to place order', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-ivory dark:bg-matte overflow-x-hidden">
      {/* Compact Mobile Header */}
      <MobileHeader title="Checkout" subtitle="Secure" />

      {/* Main Container - added padding bottom for fixed footer */}
      <div className="px-3 sm:px-6 lg:px-8 max-w-md sm:max-w-3xl lg:max-w-7xl mx-auto py-4 sm:py-12 pb-40 sm:pb-16">
        {/* Desktop Header */}
        <div className="hidden sm:block mb-6 sm:mb-8">
          <h1 className="font-display text-2xl sm:text-4xl text-matte dark:text-ivory">Checkout</h1>
          <div className="h-0.5 w-16 bg-gradient-to-r from-gold to-transparent mt-2 sm:mt-3" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Shipping Form */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Contact Information */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 sm:p-5 border border-neutral-100 dark:border-neutral-800 shadow-sm">
              <h2 className="font-display text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gold/10 text-gold text-xs">1</span>
                Contact Information
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    className="w-full border border-neutral-200 dark:border-neutral-700 p-3 rounded-lg bg-transparent text-base focus:outline-none focus:ring-2 focus:ring-gold/30 placeholder:text-neutral-400"
                    placeholder="John Doe"
                    value={shipping.name}
                    onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">Mobile Number *</label>
                  <input
                    type="tel"
                    className="w-full border border-neutral-200 dark:border-neutral-700 p-3 rounded-lg bg-transparent text-base focus:outline-none focus:ring-2 focus:ring-gold/30 placeholder:text-neutral-400"
                    placeholder="+1 234 567 8900"
                    value={shipping.phone}
                    onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Email {!user && <span className="text-neutral-400">(for order updates)</span>}
                  </label>
                  <input
                    type="email"
                    className="w-full border border-neutral-200 dark:border-neutral-700 p-3 rounded-lg bg-transparent text-base focus:outline-none focus:ring-2 focus:ring-gold/30 placeholder:text-neutral-400"
                    placeholder="your@email.com"
                    value={shipping.email || ''}
                    onChange={(e) => setShipping({ ...shipping, email: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 sm:p-5 border border-neutral-100 dark:border-neutral-800 shadow-sm">
              <h2 className="font-display text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gold/10 text-gold text-xs">2</span>
                Shipping Address
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">Address *</label>
                  <input
                    type="text"
                    className="w-full border border-neutral-200 dark:border-neutral-700 p-3 rounded-lg bg-transparent text-base focus:outline-none focus:ring-2 focus:ring-gold/30 placeholder:text-neutral-400"
                    placeholder="123 Main Street, Apt 4B"
                    value={shipping.address}
                    onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">Destination City / Thana *</label>
                  <select
                    className="w-full border border-neutral-200 dark:border-neutral-700 p-3 rounded-lg bg-transparent text-base focus:outline-none focus:ring-2 focus:ring-gold/30"
                    value={shipping.city}
                    onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                    disabled={destinationsLoading || !destinations.length}
                  >
                    <option value="">
                      {destinationsLoading
                        ? 'Loading destinations...'
                        : 'Select destination'}
                    </option>
                    {destinations.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}{d.district ? `, ${d.district}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">Country *</label>
                  <input
                    type="text"
                    className="w-full border border-neutral-200 dark:border-neutral-700 p-3 rounded-lg bg-transparent text-base focus:outline-none focus:ring-2 focus:ring-gold/30 placeholder:text-neutral-400"
                    placeholder="Bangladesh"
                    value={shipping.country}
                    onChange={(e) => setShipping({ ...shipping, country: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">Postal Code *</label>
                  <input
                    type="text"
                    className="w-full border border-neutral-200 dark:border-neutral-700 p-3 rounded-lg bg-transparent text-base focus:outline-none focus:ring-2 focus:ring-gold/30 placeholder:text-neutral-400"
                    placeholder="10001"
                    value={shipping.postalCode}
                    onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 sm:p-5 border border-neutral-100 dark:border-neutral-800 h-fit lg:sticky lg:top-24 shadow-sm">
            <h2 className="font-display text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Order Summary</h2>

            {/* Items */}
            <div className="space-y-3 pb-4 border-b border-neutral-100 dark:border-neutral-800 mb-4">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-3 text-sm">
                  {/* Thumbnail if available, or placeholder */}
                  <div className="w-12 h-12 bg-neutral-100 rounded-md flex-shrink-0 overflow-hidden">
                    {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-800 dark:text-neutral-200 truncate">{item.title}</p>
                    <p className="text-xs text-neutral-500">Qty: {item.qty}</p>
                  </div>
                  <span className="font-medium whitespace-nowrap">৳ {(item.price * item.qty).toFixed(0)}</span>
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
                      className="flex-1 min-w-0 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-gold"
                      disabled={applyingCoupon}
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={applyingCoupon}
                      className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-sm font-medium rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition disabled:opacity-50"
                    >
                      {applyingCoupon ? '...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
                </>
              )}
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">Subtotal</span>
                <span>৳ {totalBeforeDiscount.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">Shipping</span>
                <span className="font-medium">
                  {deliveryLoading ? (
                    'Calculating...'
                  ) : (
                    <>৳ {deliveryCharge.toFixed(0)}</>
                  )}
                </span>
              </div>
              {deliveryError && (
                <p className="text-xs text-red-500 text-right">{deliveryError}</p>
              )}

              {discount > 0 && (
                <div className="flex justify-between text-sm text-gold">
                  <span>Discount ({coupon.code})</span>
                  <span className="font-medium">-৳ {discount.toFixed(0)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-neutral-100 dark:border-neutral-800 mb-6 sm:mb-3">
              <span className="font-semibold text-lg">Total</span>
              <span className="text-2xl font-bold text-gold">৳ {total.toFixed(0)}</span>
            </div>

            {/* Payment Method (COD only for now) */}
            <div className="mb-4 sm:mb-6 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-100 dark:border-neutral-800">
              <p className="text-sm font-medium mb-2 text-neutral-500">Payment Method</p>
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="cod"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="w-4 h-4 accent-gold"
                />
                <label htmlFor="cod" className="cursor-pointer text-sm font-medium">
                  Cash on Delivery
                </label>
              </div>
            </div>

            {/* Desktop Button - Hidden on Mobile */}
            <button
              className="hidden lg:block w-full py-4 bg-gold text-matte font-bold text-sm uppercase tracking-wider rounded-xl hover:bg-gold/90 transition shadow-lg shadow-gold/20 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
              onClick={placeOrder}
              disabled={!items.length || !paymentMethod || !deliveryAvailable || !!deliveryError || deliveryLoading}
            >
              {paymentMethod === 'cod' ? 'Confirm Order (COD)' : 'Confirm Order'}
            </button>

            <p className="text-xs text-center text-neutral-500 mt-4 lg:block hidden">Payment simulated (test mode)</p>

            {/* Trust Badges */}
            <div className="flex justify-center gap-4 mt-6 text-xs text-neutral-400">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Secure Checkout
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

      {/* Fixed Mobile Bottom Bar */}
      {/* Fixed Mobile Bottom Bar - Elevated to clear BottomNav */}
      <div className="fixed bottom-5 left-4 right-4 lg:hidden bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-3 rounded-xl shadow-xl z-40">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-neutral-500">Total Amount</p>
            <p className="text-xl font-bold text-gold">৳ {total.toFixed(0)}</p>
          </div>
          <button
            onClick={placeOrder}
            disabled={!items.length || !paymentMethod || !deliveryAvailable || !!deliveryError || deliveryLoading}
            className="flex-1 py-3.5 bg-gold text-matte font-bold text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-gold/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
          >
            Confirm Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
