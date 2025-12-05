import { Link } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const OrderThankYou = () => {
  return (
    <div className="lux-container py-20">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="flex justify-center">
          <CheckCircleIcon className="h-20 w-20 text-gold" />
        </div>

        <div className="space-y-3">
          <p className="lux-badge mx-auto w-fit">Order Confirmed</p>
          <h1 className="lux-heading">Merci. Your PRELUX order is confirmed.</h1>
          <p className="text-neutral-600 dark:text-neutral-300 max-w-md mx-auto">
            A concierge will share shipping details shortly. For bespoke requests, contact maison@prelux.lux.
          </p>
        </div>

        <div className="lux-card p-6 space-y-3">
          <p className="font-semibold">What happens next?</p>
          <div className="text-sm text-left space-y-2 text-neutral-600 dark:text-neutral-300">
            <p>✓ Order confirmation email sent</p>
            <p>✓ Your items are being prepared</p>
            <p>✓ Shipping notification will arrive within 24-48 hours</p>
            <p>✓ White-glove delivery with signature</p>
          </div>
        </div>

        <div className="flex justify-center gap-3 flex-wrap">
          <Link to="/shop" className="lux-btn border border-gold/40">Continue shopping</Link>
          <Link to="/profile" className="lux-btn-primary">View my orders</Link>
        </div>
      </div>
    </div>
  );
};

export default OrderThankYou;

