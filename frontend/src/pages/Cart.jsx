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
  const { items, removeItem, updateQty, updateStock } = useCart();
  const { addToast } = useToast();
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [stockData, setStockData] = useState({});

  // Fetch CMS content
  const { data: cmsContent } = useQuery({
    queryKey: ['content', 'cart.header'],
    queryFn: async () => {
      try {
        const res = await api.get('/content/cart.header');
        return res.data?.content || DEFAULT_CONTENT;
      } catch {
        return DEFAULT_CONTENT;
      }
    },
  });

  const content = cmsContent || DEFAULT_CONTENT;

  // Fetch current stock for all items
  useEffect(() => {
    const fetchStock = async () => {
      const stocks = {};
      for (const item of items) {
        try {
          const res = await api.get(`/products/id/${item.productId}`);
          stocks[item.productId] = res.data.stock;
          // Update stock in cart store
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

  // Filter out items with 0 stock for order summary
  const availableItems = items.filter((item) => {
    const stock = stockData[item.productId] ?? item.stock ?? 999;
    return stock > 0;
  });

  const outOfStockItems = items.filter((item) => {
    const stock = stockData[item.productId] ?? item.stock ?? 999;
    return stock <= 0;
  });

  const subtotal = availableItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const total = subtotal - discount;

  const applyCoupon = async () => {
    try {
      setCouponError('');
      const res = await api.post('/coupons/validate', { code: couponCode, cartTotal: subtotal });
      const coupon = res.data;

      // Use the discount calculated by backend
      setDiscount(coupon.discount || 0);
      setAppliedCoupon(coupon);
      addToast(coupon.message || 'Coupon applied!');
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid coupon code');
      setDiscount(0);
      setAppliedCoupon(null);
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
    <div className="lux-container py-12 space-y-6">
      <h1 className="lux-heading">{content.title}</h1>

      {items.length === 0 ? (
        <p className="text-sm">
          {content.emptyMessage} <Link to="/shop" className="underline">{content.emptyLink}</Link>
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {/* Out of stock items warning */}
            {outOfStockItems.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  <p className="font-semibold text-sm">Some items are out of stock</p>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  The following items are currently unavailable and will not be included in your order:
                </p>
                <ul className="text-sm space-y-1">
                  {outOfStockItems.map((item) => (
                    <li key={`${item.productId}-${item.variantId}`} className="flex justify-between items-center">
                      <span className="text-amber-800 dark:text-amber-200">{item.title}</span>
                      <button
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Available items */}
            {items.map((item) => {
              const stock = stockData[item.productId] ?? item.stock ?? 999;
              const isOutOfStock = stock <= 0;

              return (
                <div
                  key={`${item.productId}-${item.variantId}-${item.selectedSize}`}
                  className={`lux-card p-4 ${isOutOfStock ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Product Image */}
                    {item.image && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-lg truncate">{item.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-neutral-600 dark:text-neutral-300">SKU {item.sku}</p>
                        {item.selectedSize && (
                          <span className="text-xs font-semibold bg-gold/20 text-gold px-2 py-0.5 rounded">
                            Size: {item.selectedSize}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold mt-2">${item.price}</p>
                      {isOutOfStock ? (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">Out of Stock</p>
                      ) : (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                          {stock} in stock
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      {!isOutOfStock && (
                        <>
                          <div className="flex items-center gap-2 border border-gold/30 rounded-lg p-1">
                            <button
                              onClick={() => handleQtyChange(item, item.qty - 1)}
                              className="p-1 hover:bg-gold/10 rounded transition"
                              disabled={item.qty <= 1}
                            >
                              <MinusIcon className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center font-semibold text-sm">{item.qty}</span>
                            <button
                              onClick={() => handleQtyChange(item, item.qty + 1)}
                              className="p-1 hover:bg-gold/10 rounded transition disabled:opacity-40"
                              disabled={item.qty >= stock}
                            >
                              <PlusIcon className="h-4 w-4" />
                            </button>
                          </div>
                          <Link
                            to="/checkout"
                            className="text-xs text-gold hover:underline flex items-center gap-1"
                          >
                            Buy Now
                          </Link>
                        </>
                      )}
                      <button
                        className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                        onClick={() => removeItem(item.productId, item.variantId)}
                      >
                        <TrashIcon className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lux-card p-4 space-y-3">
            <p className="font-semibold">Order Summary</p>
            {availableItems.length === 0 ? (
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                No items available for checkout.
              </p>
            ) : (
              <>
                <div className="text-sm space-y-1">
                  {availableItems.map((item) => (
                    <div key={`${item.productId}-${item.variantId}`} className="flex justify-between">
                      <span>{item.title} × {item.qty}</span>
                      <span>${(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm border-t border-gold/20 pt-2">Subtotal: ${subtotal.toFixed(2)}</p>

                <div className="border-t border-gold/20 pt-3 space-y-2">
                  <p className="text-sm font-semibold">Have a coupon?</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 border border-gold/30 rounded-lg px-3 py-2 text-sm"
                    />
                    <button
                      onClick={applyCoupon}
                      className="lux-btn border border-gold/40 text-sm px-4"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-xs text-red-600 dark:text-red-400">{couponError}</p>
                  )}
                  {appliedCoupon && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      ✓ {appliedCoupon.code} applied!
                    </p>
                  )}
                </div>

                {discount > 0 && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Discount: -${discount.toFixed(2)}
                  </p>
                )}

                <p className="text-lg font-semibold border-t border-gold/20 pt-3">
                  Total: ${total.toFixed(2)}
                </p>

                <Link to="/checkout" className="lux-btn-primary w-full text-center block">
                  Proceed to checkout
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
