import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api.js';
import { useCart } from '../store/useCart.js';
import { useState, useEffect } from 'react';

const Checkout = () => {
  const { items, setItems } = useCart();
  const [shipping, setShipping] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    postalCode: ''
  });
  const navigate = useNavigate();

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

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  const placeOrder = async () => {
    if (!shipping.name || !shipping.phone || !shipping.address || !shipping.city || !shipping.country || !shipping.postalCode) {
      alert('Please fill in all shipping details');
      return;
    }
    await api.post('/orders', { items, shipping, paymentStatus: 'paid' });
    setItems([]);
    localStorage.removeItem('cart');
    navigate('/order/thank-you');
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8 sm:py-12">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl text-matte dark:text-ivory">Checkout</h1>
        <div className="h-0.5 w-16 bg-gradient-to-r from-gold to-transparent mt-3" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Shipping Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-5 border border-neutral-100 dark:border-neutral-800">
            <h2 className="font-display text-lg font-semibold mb-4">Contact Information</h2>
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
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-5 border border-neutral-100 dark:border-neutral-800">
            <h2 className="font-display text-lg font-semibold mb-4">Shipping Address</h2>
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
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-5 border border-neutral-100 dark:border-neutral-800 h-fit lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-semibold mb-4">Order Summary</h2>

          {/* Items */}
          <div className="space-y-2 pb-4 border-b border-neutral-100 dark:border-neutral-800 mb-4">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400 truncate flex-1 mr-2">
                  {item.title} × {item.qty}
                </span>
                <span className="font-medium">${(item.price * item.qty).toFixed(0)}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between text-sm mb-2">
            <span className="text-neutral-600 dark:text-neutral-400">Items</span>
            <span>{items.length}</span>
          </div>
          <div className="flex justify-between text-sm mb-4">
            <span className="text-neutral-600 dark:text-neutral-400">Shipping</span>
            <span className="text-green-600">Free</span>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-neutral-100 dark:border-neutral-800 mb-6">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold text-gold">${total.toFixed(0)}</span>
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
  );
};

export default Checkout;
