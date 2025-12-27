import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircleIcon, UserPlusIcon, KeyIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
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
  const location = useLocation();
  const {
    orderNumber,
    isGuest,
    email,
    phone,
    accountCreated,
    existingAccount,
    tempPassword,
    userInfo,
  } = location.state || {};

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

        {/* Order Number Display */}
        {orderNumber && (
          <div className="lux-card p-6 bg-gold/5 border-gold/30">
            <p className="text-sm text-neutral-500 mb-1">Your Order Number</p>
            <p className="text-2xl font-display font-bold text-gold tracking-wider">{orderNumber}</p>
          </div>
        )}

        {/* Account Created Notification */}
        {accountCreated && (
          <div className="lux-card p-6 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-left animate-fade-in-up">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                <UserPlusIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-display font-semibold text-emerald-800 dark:text-emerald-300">
                    🎉 Account Created!
                  </h3>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400">
                    We've created an account for you so you can track orders, make returns, and enjoy member benefits.
                  </p>
                </div>

                <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 space-y-2 border border-emerald-100 dark:border-emerald-900">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-neutral-500">Email:</span>
                    <span className="font-medium text-matte dark:text-ivory">{email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <KeyIcon className="h-4 w-4 text-gold" />
                    <span className="text-neutral-500">Temporary Password:</span>
                    <code className="font-mono font-bold text-gold bg-gold/10 px-2 py-0.5 rounded">{tempPassword}</code>
                  </div>
                  {userInfo?.customId && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-neutral-500">Your Customer ID:</span>
                      <span className="font-mono font-medium text-matte dark:text-ivory">{userInfo.customId}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                  <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>Please save this password and change it after logging in for security.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Existing Account Linked Notification */}
        {existingAccount && (
          <div className="lux-card p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-left animate-fade-in-up">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold text-blue-800 dark:text-blue-300">
                  Order Linked to Your Account
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                  We found an existing account with <span className="font-medium">{email}</span>.
                  This order has been added to your account. Please login to view it.
                </p>
              </div>
            </div>
          </div>
        )}

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
          {accountCreated ? (
            // New account - go directly to profile (already logged in)
            <Link to="/profile" className="lux-btn-primary">
              Go to My Profile
            </Link>
          ) : existingAccount ? (
            // Existing account - must login to verify identity
            <Link to="/login" className="lux-btn-primary">
              Login to View Orders
            </Link>
          ) : isGuest ? (
            // Pure guest (shouldn't happen anymore, but just in case)
            <Link
              to="/order/track"
              state={{ orderNumber, email, phone }}
              className="lux-btn-primary"
            >
              Track Order
            </Link>
          ) : (
            // Logged in user
            <Link to="/profile" className="lux-btn-primary">{c.ordersButtonText}</Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderThankYou;

