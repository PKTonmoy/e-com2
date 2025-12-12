import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MinusIcon, PlusIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useCart } from '../store/useCart.js';
import { useToast } from '../components/ToastProvider.jsx';
import api from '../lib/api.js';

const DEFAULT_CONTENT = {
  title: 'Your Cart',
  emptyMessage: 'Your cart is empty.',
  emptyLink: 'Discover the collection.',
};

const Cart = () => {
  const { items, removeItem, updateQty, updateStock, coupon, applyCoupon: applyCouponToStore, removeCoupon: removeCouponFromStore } = useCart();
  const { addToast } = useToast();
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [stockData, setStockData] = useState({});

  const { data: cmsContent } = useQuery({
    queryKey: ['content', 'cart.header'],
    queryFn: async () => {
      try {
        const res = await api.get('/content/cart.header');
        return res.data?.content || {};
      } catch {
        return {};
      }
    },
  });

  const content = { ...DEFAULT_CONTENT, ...cmsContent };

  useEffect(() => {
    const fetchStock = async () => {
      const stocks = {};
      for (const item of items) {
        try {
          const res = await api.get(`/products/id/${item.productId}`);
          stocks[item.productId] = res.data.stock;
          if (res.data.stock !== item.stock) {
            updateStock(item.productId, item.variantId, res.data.stock);
          }
        } catch (err) {
          stocks[item.productId] = item.stock || 0;
        }
      }
      setStockData(stocks);
    };
    if (items.length > 0) {
      fetchStock();
    }
  }, [items.length]);

  const availableItems = items.filter((item) => {
    const stock = stockData[item.productId] ?? item.stock ?? 999;
    return stock > 0;
  });

  const outOfStockItems = items.filter((item) => {
    const stock = stockData[item.productId] ?? item.stock ?? 999;
    return stock <= 0;
  });

  const subtotal = availableItems.reduce((sum, i) => sum + i.price * i.qty, 0);

  // Calculate discount based on global coupon state
  let discount = 0;
  if (coupon) {
    if (coupon.type === 'percentage') {
      discount = subtotal ? (subtotal * coupon.value) / 100 : coupon.value;
    } else {
      discount = coupon.value;
    }
  }

  const total = subtotal - discount;

  const applyCoupon = async () => {
    try {
      setCouponError('');
      const res = await api.post('/coupons/validate', { code: couponCode, cartTotal: subtotal });
      const validCoupon = res.data;

      // Calculate discount for display immediately
      let calculatedDiscount = 0;
      if (validCoupon.type === 'percentage') {
        calculatedDiscount = subtotal ? (subtotal * validCoupon.value) / 100 : validCoupon.value;
      } else {
        calculatedDiscount = validCoupon.value;
      }

      applyCouponToStore(validCoupon);
      addToast(validCoupon.message || 'Coupon applied!');
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid coupon code');
      removeCouponFromStore();
    }
  };

  const handleQtyChange = (item, newQty) => {
    const stock = stockData[item.productId] ?? item.stock ?? 999;
    if (newQty > stock) {
      addToast(`Maximum ${stock} available`);
      return;
    }
    const result = updateQty(item.productId, item.variantId, newQty);
    if (!result.success && result.message) {
      addToast(result.message);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-6 sm:py-12">
      {/* Mobile Header */}
      <div className="sm:hidden text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gold/10 mb-3">
          <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h1 className="font-display text-2xl text-matte dark:text-ivory">{content.title}</h1>
        {items.length > 0 && (
          <p className="text-sm text-neutral-500 mt-1">{items.length} item(s)</p>
        )}
      </div>

      {/* Desktop Header */}
      <div className="hidden sm:block mb-8">
        <h1 className="font-display text-4xl text-matte dark:text-ivory">{content.title}</h1>
        <div className="h-0.5 w-16 bg-gradient-to-r from-gold to-transparent mt-3" />
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-24 h-24 rounded-full bg-gold/10 flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="font-display text-xl text-matte dark:text-ivory mb-2">Your Cart is Empty</h2>
          <p className="text-neutral-500 text-sm mb-6 max-w-xs">Discover our curated collection of luxury pieces.</p>
          <Link to="/shop" className="px-6 py-3 bg-gold text-matte font-semibold text-sm uppercase tracking-wider rounded-full hover:bg-gold/90 transition">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {outOfStockItems.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  <p className="font-semibold text-sm">Some items are out of stock</p>
                </div>
              </div>
            )}

            {items.map((item) => {
              const stock = stockData[item.productId] ?? item.stock ?? 999;
              const isOutOfStock = stock <= 0;

              return (
                <div key={`${item.productId}-${item.variantId}-${item.selectedSize}`} className={`bg-white dark:bg-neutral-900 rounded-xl p-3 sm:p-4 border border-neutral-100 dark:border-neutral-800 ${isOutOfStock ? 'opacity-50' : ''}`}>
                  {/* Mobile Layout */}
                  <div className="sm:hidden">
                    <div className="flex gap-3">
                      {item.image && (
                        <Link to={`/product/${item.slug}`} className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100">
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        </Link>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2">
                          <Link to={`/product/${item.slug}`} className="font-medium text-sm text-matte dark:text-ivory line-clamp-1">
                            {item.title}
                          </Link>
                          <button onClick={() => removeItem(item.productId, item.variantId)} className="text-neutral-400 hover:text-red-500 flex-shrink-0">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-xs text-neutral-400">{item.sku}</p>
                        <p className="text-sm font-bold mt-1"><span className="text-base">৳</span> {item.price}</p>
                      </div>
                    </div>
                    {!isOutOfStock && (
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                        <div className="flex items-center border border-neutral-200 dark:border-neutral-700 rounded">
                          <button onClick={() => handleQtyChange(item, item.qty - 1)} className="w-8 h-8 flex items-center justify-center" disabled={item.qty <= 1}>
                            <MinusIcon className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                          <button onClick={() => handleQtyChange(item, item.qty + 1)} className="w-8 h-8 flex items-center justify-center" disabled={item.qty >= stock}>
                            <PlusIcon className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="font-bold text-gold"><span className="text-base">৳</span> {(item.price * item.qty).toFixed(0)}</span>
                      </div>
                    )}
                    {isOutOfStock && <p className="text-xs text-red-500 mt-2">Out of stock</p>}
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:flex items-center gap-4">
                    {item.image && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-lg truncate">{item.title}</p>
                      <p className="text-xs text-neutral-500">SKU {item.sku}</p>
                      <p className="text-sm font-semibold mt-1"><span className="text-base">৳</span> {item.price}</p>
                    </div>
                    {!isOutOfStock && (
                      <div className="flex items-center gap-2 border border-gold/30 rounded-lg p-1">
                        <button onClick={() => handleQtyChange(item, item.qty - 1)} className="p-1 hover:bg-gold/10 rounded" disabled={item.qty <= 1}>
                          <MinusIcon className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-semibold text-sm">{item.qty}</span>
                        <button onClick={() => handleQtyChange(item, item.qty + 1)} className="p-1 hover:bg-gold/10 rounded" disabled={item.qty >= stock}>
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    <button onClick={() => removeItem(item.productId, item.variantId)} className="text-xs text-red-600 hover:underline flex items-center gap-1">
                      <TrashIcon className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Shop More Button */}
            <Link to="/shop" className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-gold hover:text-matte dark:hover:text-ivory transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Continue Shopping
            </Link>
          </div>

          {/* Order Summary */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-100 dark:border-neutral-800 lg:sticky lg:top-24 h-fit">
            <h2 className="font-display text-lg font-semibold mb-4">Order Summary</h2>

            {availableItems.length === 0 ? (
              <p className="text-sm text-neutral-500">No items available</p>
            ) : (
              <>
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-neutral-500">{availableItems.length} item(s)</span>
                  <span className="font-semibold"><span className="text-base">৳</span> {subtotal.toFixed(0)}</span>
                </div>

                <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3 mb-3">
                  <p className="text-sm font-medium mb-2">Coupon Code</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 min-w-0 border border-neutral-200 dark:border-neutral-700 rounded px-3 py-2 text-sm bg-transparent"
                    />
                    <button onClick={applyCoupon} className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-sm font-medium rounded">
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
                  {coupon && <p className="text-xs text-green-600 mt-1">✓ {coupon.code} applied!</p>}
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 mb-3">
                    <span>Discount</span>
                    <span>-<span className="text-base">৳</span> {discount.toFixed(0)}</span>
                  </div>
                )}

                <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold text-gold"><span className="text-2xl">৳</span> {total.toFixed(0)}</span>
                  </div>
                </div>

                <Link to="/checkout" className="block w-full text-center py-3 bg-gold text-matte font-semibold text-sm uppercase tracking-wider rounded-lg hover:bg-gold/90 transition">
                  Checkout
                </Link>

                <div className="flex justify-center gap-4 mt-3 text-xs text-neutral-400">
                  <span>✓ Secure</span>
                  <span>✓ Easy Returns</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
