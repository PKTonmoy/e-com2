import { useNavigate } from 'react-router-dom';
import api from '../lib/api.js';
import { useCart } from '../store/useCart.js';
import { useState } from 'react';

const Checkout = () => {
  const { items, setItems } = useCart();
  const [shipping, setShipping] = useState({ name: '', address: '', city: '', country: '', postalCode: '' });
  const navigate = useNavigate();

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  const placeOrder = async () => {
    await api.post('/orders', { items, shipping, paymentStatus: 'paid' });
    setItems([]);
    localStorage.removeItem('cart');
    navigate('/order/thank-you');
  };

  return (
    <div className="lux-container py-12 grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <h1 className="lux-heading">Checkout</h1>
        <div className="lux-card p-4 space-y-3">
          <p className="font-semibold">Shipping</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="border p-3 rounded-lg" placeholder="Name" value={shipping.name} onChange={(e) => setShipping({ ...shipping, name: e.target.value })} />
            <input className="border p-3 rounded-lg" placeholder="Address" value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} />
            <input className="border p-3 rounded-lg" placeholder="City" value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} />
            <input className="border p-3 rounded-lg" placeholder="Country" value={shipping.country} onChange={(e) => setShipping({ ...shipping, country: e.target.value })} />
            <input className="border p-3 rounded-lg" placeholder="Postal Code" value={shipping.postalCode} onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })} />
          </div>
        </div>
      </div>
      <div className="lux-card p-4 space-y-3">
        <p className="font-semibold">Summary</p>
        <p className="text-sm">Items: {items.length}</p>
        <p className="text-sm">Total: ${total.toFixed(2)}</p>
        <button className="lux-btn-primary w-full" onClick={placeOrder} disabled={!items.length}>
          Confirm order
        </button>
        <p className="text-xs text-neutral-600">Payment simulated (test mode).</p>
      </div>
    </div>
  );
};

export default Checkout;

