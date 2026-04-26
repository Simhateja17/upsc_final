'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { billingService, pricingService } from '@/lib/services';

const cardStyle = {
  boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px 0px rgba(0,0,0,0.1)',
};

interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  duration: string;
  durationDays: number;
  features: string[];
  notIncluded: string[];
  badge?: string;
  isPopular: boolean;
}

interface Subscription {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  plan: Plan;
}

interface PaymentHistory {
  id: string;
  date: string;
  plan: string;
  amount: string;
  status: string;
  receiptUrl?: string;
  providerPaymentId?: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function BillingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [history, setHistory] = useState<PaymentHistory[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [view, setView] = useState<'billing' | 'plans' | 'success'>('billing');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [subRes, historyRes, plansRes] = await Promise.all([
        billingService.getSubscription().catch(() => ({ data: null })),
        billingService.getHistory().catch(() => ({ data: { history: [] } })),
        pricingService.getPlans().catch(() => ({ data: [] })),
      ]);
      const sub = subRes.data || null;
      setSubscription(sub);
      setHistory(historyRes.data?.history || []);
      setPlans(plansRes.data || []);
      // Auto-show plans if no active subscription
      if (!sub) setView('plans');
    } catch (err: any) {
      setError(err.message || 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePurchase = async (plan: Plan) => {
    try {
      setError('');
      setPaymentProcessing(true);
      setSelectedPlan(plan);

      const razorpayLoaded = await loadRazorpay();
      if (!razorpayLoaded) {
        setError('Payment gateway failed to load. Please try again.');
        setPaymentProcessing(false);
        return;
      }

      const orderRes = await billingService.createOrder(plan.id);
      const orderId = orderRes.data?.id;
      const razorpayOrderId = orderRes.data?.razorpayOrderId;

      const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (!rzpKey || rzpKey === 'rzp_test_placeholder') {
        // Demo mode — simulate success
        await billingService.verifyPayment({ paymentId: 'demo_' + Date.now(), orderId, status: 'success' });
        setMsg('Payment successful! Your subscription is now active.');
        setView('success');
        await loadData();
        setPaymentProcessing(false);
        return;
      }

      const options = {
        key: rzpKey,
        amount: plan.price * 100,
        currency: 'INR',
        name: 'RiseWithJeet',
        description: `${plan.name} - ${plan.duration}`,
        order_id: razorpayOrderId,
        prefill: {
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
          email: user?.email || '',
        },
        theme: { color: '#f0b100' },
        handler: async (response: any) => {
          try {
            await billingService.verifyPayment({
              paymentId: response.razorpay_payment_id,
              orderId,
              razorpayOrderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              status: 'success',
            });
            setMsg('Payment successful! Your subscription is now active.');
            setView('success');
            await loadData();
          } catch (err: any) {
            setError(err.message || 'Payment verification failed');
          }
          setPaymentProcessing(false);
        },
        modal: {
          ondismiss: () => {
            setPaymentProcessing(false);
            setSelectedPlan(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      setPaymentProcessing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to initiate payment');
      setPaymentProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;
    if (!confirm('Are you sure you want to cancel your subscription? You will still have access until the end date.')) return;
    try {
      await billingService.cancelSubscription(subscription.id);
      setMsg('Subscription cancelled successfully.');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel subscription');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const daysLeft = subscription
    ? Math.max(0, Math.ceil((new Date(subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#17223E] mx-auto mb-4" />
          <p className="text-[#62748e] text-sm">Loading billing information...</p>
        </div>
      </div>
    );
  }

  // Success view
  if (view === 'success') {
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center px-4" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="bg-white rounded-[20px] p-10 max-w-[480px] w-full text-center" style={cardStyle}>
          <div className="w-20 h-20 bg-[#dcfce7] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17L4 12" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-[#0f172b] text-2xl font-bold mb-2">You're all set!</h2>
          <p className="text-[#62748e] text-sm mb-6">{msg}</p>
          <button
            onClick={() => { setView('billing'); setMsg(''); setSelectedPlan(null); }}
            className="h-[44px] px-8 rounded-[10px] bg-[#f0b100] text-[#0f172b] font-semibold text-sm hover:bg-[#d4a000] transition-colors"
          >
            Go to Billing Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Plans view (shown when no subscription OR user navigates to plans)
  if (view === 'plans') {
    return (
      <div className="min-h-screen bg-[#f1f5f9] px-4 sm:px-6 py-6 md:py-8" style={{ fontFamily: "'Inter', sans-serif" }}>
        <nav className="flex items-center gap-2 mb-4">
          {subscription && (
            <>
              <button onClick={() => setView('billing')} className="font-normal text-[14px] leading-[20px] text-[#155dfc] hover:text-[#1248c9]">
                Billing
              </button>
              <span className="text-[14px] leading-[20px] text-[#90a1b9]">›</span>
            </>
          )}
          <Link href="/dashboard" className="font-normal text-[14px] leading-[20px] text-[#62748e] hover:text-[#314158]">Home</Link>
          <span className="text-[14px] leading-[20px] text-[#90a1b9]">›</span>
          <span className="font-normal text-[14px] leading-[20px] text-[#0f172b]">Choose Plan</span>
        </nav>

        <div className="text-center mb-8">
          <h1 className="text-[#0f172b] text-2xl md:text-[32px] font-bold mb-2">
            {subscription ? 'Upgrade Your Plan' : 'Choose Your Plan'}
          </h1>
          <p className="text-[#62748e] text-sm md:text-base">
            {subscription
              ? 'Unlock more features with a higher plan.'
              : 'Start your UPSC preparation journey with the right plan.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 max-w-[900px] mx-auto px-4 py-3 rounded-[10px] bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] text-sm">{error}</div>
        )}

        {plans.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-[#f1f5f9] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💳</span>
            </div>
            <p className="text-[#62748e] text-sm">No plans available at the moment. Please check back later.</p>
          </div>
        ) : (
          <div className="max-w-[1100px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-white rounded-[18px] flex flex-col relative transition-transform hover:-translate-y-1 ${
                    plan.isPopular
                      ? 'ring-2 ring-[#f0b100] border-[#f0b100]'
                      : 'border-[0.8px] border-[#e2e8f0]'
                  }`}
                  style={cardStyle}
                >
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#f0b100] text-[#0f172b] text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap shadow-sm">
                      {plan.badge}
                    </div>
                  )}

                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-[#0f172b] text-lg font-bold mb-1">{plan.name}</h3>

                    <div className="mb-3 flex items-end gap-2">
                      <span className="text-[#0f172b] text-[36px] leading-none font-bold">₹{plan.price.toLocaleString()}</span>
                      {plan.originalPrice && plan.originalPrice > plan.price && (
                        <span className="text-[#90a1b9] text-base line-through mb-1">₹{plan.originalPrice.toLocaleString()}</span>
                      )}
                    </div>
                    <p className="text-[#62748e] text-sm mb-1">for {plan.duration}</p>

                    {plan.description && (
                      <p className="text-[#62748e] text-xs leading-[18px] mb-4 border-t border-[#f1f5f9] pt-3 mt-1">{plan.description}</p>
                    )}

                    <ul className="flex flex-col gap-2.5 mb-6 flex-grow mt-2">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-start gap-2.5 text-[#314158] text-sm">
                          <svg className="flex-shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="8" fill="#dcfce7" />
                            <path d="M5 8l2 2 4-4" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {f}
                        </li>
                      ))}
                      {plan.notIncluded?.map((f, j) => (
                        <li key={`not-${j}`} className="flex items-start gap-2.5 text-[#90a1b9] text-sm">
                          <svg className="flex-shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="8" fill="#f1f5f9" />
                            <path d="M5.5 10.5l5-5M10.5 10.5l-5-5" stroke="#90a1b9" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handlePurchase(plan)}
                      disabled={paymentProcessing}
                      className={`w-full h-[46px] rounded-[10px] font-semibold text-sm transition-all ${
                        plan.isPopular
                          ? 'bg-[#f0b100] text-[#0f172b] hover:bg-[#d4a000] shadow-md'
                          : 'bg-[#1d293d] text-white hover:bg-[#2a3a52]'
                      } disabled:opacity-50`}
                    >
                      {paymentProcessing && selectedPlan?.id === plan.id
                        ? 'Processing...'
                        : plan.isPopular ? '✨ Get Started' : 'Purchase Plan'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className="text-[#90a1b9] text-xs">
                🔒 Secure payment powered by Razorpay · All major UPI, Cards & Net Banking accepted
              </p>
            </div>
          </div>
        )}

        {subscription && (
          <div className="mt-6 text-center">
            <button onClick={() => setView('billing')} className="text-[#62748e] text-sm hover:text-[#314158]">
              ← Back to Billing
            </button>
          </div>
        )}
      </div>
    );
  }

  // Main billing dashboard (only shown when user has an active subscription)
  return (
    <div className="min-h-screen bg-[#f1f5f9] px-4 sm:px-6 py-6 md:py-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      <nav className="flex items-center gap-2 mb-4">
        <Link href="/dashboard" className="font-normal text-[14px] leading-[20px] text-[#62748e] hover:text-[#314158]">
          Home
        </Link>
        <span className="text-[14px] leading-[20px] text-[#90a1b9]">›</span>
        <span className="font-normal text-[14px] leading-[20px] text-[#0f172b]">Billing & Subscription</span>
      </nav>

      <h1 className="text-xl md:text-2xl lg:text-[30px] leading-[36px] font-bold text-[#0f172b] mb-6">
        Billing & Subscription
      </h1>

      {msg && (
        <div className="mb-4 px-4 py-3 rounded-[10px] bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46] text-sm">{msg}</div>
      )}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-[10px] bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] text-sm">{error}</div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column */}
        <div className="w-full lg:w-[340px] flex flex-col gap-5 flex-shrink-0">

          {/* Current Plan Card */}
          <div className="bg-white rounded-[14px] border-[0.8px] border-[#e2e8f0] p-6 flex flex-col gap-4" style={cardStyle}>
            <h3 className="font-semibold text-[18px] leading-[28px] text-[#0f172b]">Current Plan</h3>

            {subscription && (
              <>
                <div className="rounded-[10px] bg-gradient-to-br from-[#17223E] to-[#2a3a52] p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-lg">{subscription.plan.name}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      subscription.status === 'active'
                        ? 'bg-[#22c55e]/20 text-[#86efac]'
                        : 'bg-white/20 text-white/70'
                    }`}>
                      {subscription.status === 'active' ? '● Active' : subscription.status}
                    </span>
                  </div>
                  <p className="text-white/70 text-sm">₹{subscription.plan.price.toLocaleString()} · {subscription.plan.duration}</p>
                  <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-sm">
                    <span className="text-white/60">Expires</span>
                    <span className="text-white font-medium">{formatDate(subscription.endDate)}</span>
                  </div>
                  {daysLeft <= 15 && daysLeft > 0 && (
                    <p className="text-[#fbbf24] text-xs mt-2">⚠ {daysLeft} days remaining — Renew soon</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setView('plans')}
                    className="flex-1 h-[40px] rounded-[10px] bg-[#f0b100] text-[#0f172b] font-semibold text-sm hover:bg-[#d4a000] transition-colors"
                  >
                    Upgrade
                  </button>
                  {subscription.status === 'active' && (
                    <button
                      onClick={handleCancelSubscription}
                      className="h-[40px] px-4 rounded-[10px] border border-[#fecaca] font-medium text-sm text-[#e7000b] hover:bg-[#fef2f2] transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Included Features */}
          {subscription && (
            <div className="bg-white rounded-[14px] border-[0.8px] border-[#e2e8f0] p-6 flex flex-col gap-3" style={cardStyle}>
              <h3 className="font-semibold text-[16px] text-[#0f172b]">Included in your plan</h3>
              <ul className="flex flex-col gap-2">
                {subscription.plan.features.slice(0, 6).map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-[#314158] text-sm">
                    <svg className="flex-shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="8" fill="#dcfce7" />
                      <path d="M5 8l2 2 4-4" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {f}
                  </li>
                ))}
                {subscription.plan.features.length > 6 && (
                  <li className="text-[#90a1b9] text-xs pl-6">+{subscription.plan.features.length - 6} more features</li>
                )}
              </ul>
            </div>
          )}

          {/* Payment Method */}
          <div className="bg-white rounded-[14px] border-[0.8px] border-[#e2e8f0] p-6 flex flex-col gap-3" style={cardStyle}>
            <h3 className="font-semibold text-[18px] leading-[28px] text-[#0f172b]">Payment Method</h3>
            {subscription ? (
              <div className="flex items-center gap-3 rounded-[10px] border-[0.8px] border-[#e2e8f0] bg-[#f8fafc] px-4 py-4">
                <span className="text-2xl">💳</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-[#0f172b]">Razorpay Secure</p>
                  <p className="text-xs text-[#62748e]">UPI · Cards · Net Banking</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold text-[#008236] bg-[#dcfce7]">Default</span>
              </div>
            ) : (
              <p className="text-[#62748e] text-sm">No payment method on file.</p>
            )}
          </div>
        </div>

        {/* Right Column — Billing History */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-[14px] border-[0.8px] border-[#e2e8f0] p-6 flex flex-col gap-4" style={cardStyle}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[18px] leading-[28px] text-[#0f172b]">Billing History</h3>
              {history.length > 0 && (
                <span className="text-xs text-[#62748e]">{history.length} transaction{history.length !== 1 ? 's' : ''}</span>
              )}
            </div>

            {history.length > 0 ? (
              <div className="flex flex-col divide-y divide-[#f1f5f9]">
                {history.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-[14px] text-[#0f172b]">{item.plan}</span>
                      <span className="text-[12px] text-[#90a1b9]">{formatDate(item.date)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold text-[14px] text-[#0f172b]">{item.amount}</p>
                        <span className={`text-[11px] font-medium capitalize ${
                          item.status === 'success' || item.status === 'paid'
                            ? 'text-[#008236]'
                            : item.status === 'failed'
                            ? 'text-[#e7000b]'
                            : 'text-[#62748e]'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          if (item.receiptUrl) window.open(item.receiptUrl, '_blank');
                          else alert(`Receipt ID: ${item.providerPaymentId || item.id}`);
                        }}
                        className="h-[32px] px-3 rounded-[8px] border-[0.8px] border-[#cad5e2] font-medium text-[12px] text-[#314158] hover:bg-[#f8fafc] transition-colors"
                      >
                        Receipt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center flex flex-col items-center gap-3">
                <div className="w-14 h-14 bg-[#f1f5f9] rounded-full flex items-center justify-center">
                  <span className="text-2xl">🧾</span>
                </div>
                <p className="text-[#62748e] text-sm font-medium">No billing history yet</p>
                <p className="text-[#90a1b9] text-xs">Your invoices and receipts will appear here after purchase.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
