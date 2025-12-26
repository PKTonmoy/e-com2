import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import api from '../lib/api.js';

const DEFAULT_CONTENT = {
  badge: 'Order Confirmed',
  title: 'Merci. Your PRELUX order is confirmed.',
  subtitle: 'A concierge will share shipping details shortly. For bespoke requests, contact maison@prelux.lux.',
  nextStepsTitle: 'What happens next?',
  steps: [
    'Order confirmation email sent',
    'Your items are being prepared',
    'Shipping notification will arrive within 24-48 hours',
    'White-glove delivery with signature',
  ],
  continueButtonText: 'Continue shopping',
  ordersButtonText: 'View my orders',
};

const OrderThankYou = () => {
  const { data: content } = useQuery({
    queryKey: ['content', 'thankyou.content'],
    queryFn: async () => {
      try {
        const res = await api.get('/content/thankyou.content');
        return { ...DEFAULT_CONTENT, ...res.data?.content };
      } catch {
        return DEFAULT_CONTENT;
      }
    },
  });

  const c = content || DEFAULT_CONTENT;

  return (
    <div className="lux-container py-20">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="flex justify-center">
          <CheckCircleIcon className="h-20 w-20 text-gold" />
        </div>

        <div className="space-y-3">
          <p className="lux-badge mx-auto w-fit">{c.badge}</p>
          <h1 className="lux-heading">{c.title}</h1>
          <p className="text-neutral-600 dark:text-neutral-300 max-w-md mx-auto">
            {c.subtitle}
          </p>
        </div>

        <div className="lux-card p-6 space-y-3">
          <p className="font-semibold">{c.nextStepsTitle}</p>
          <div className="text-sm text-left space-y-2 text-neutral-600 dark:text-neutral-300">
            {(c.steps || []).map((step, index) => (
              <p key={index}>✓ {step}</p>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-3 flex-wrap">
          <Link to="/shop" className="lux-btn border border-gold/40">{c.continueButtonText}</Link>
          <Link to="/profile" className="lux-btn-primary">{c.ordersButtonText}</Link>
        </div>
      </div>
    </div>
  );
};

export default OrderThankYou;
