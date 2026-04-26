'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { pricingService, userService } from '@/lib/services';

const cardStyle = {
  boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px 0px rgba(0,0,0,0.1)',
};

interface OrderItem {
  id: string;
  itemName: string;
  amount: number;
  status: string;
  created_at: string;
}

interface Subscription {
  plan: 'free' | 'trial' | 'pro' | 'pro-annual';
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  renewsOn?: string;
  trialEndsOn?: string;
  amount?: string;
}

interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: string;
  features: string[];
  isPopular?: boolean;
  badge?: string;
}

const fallbackPlans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 0,
    duration: 'Free',
    description: 'Basic access for daily consistency.',
    features: ['Daily MCQ practice', 'Daily editorial summaries', 'Limited mock access'],
  },
  {
    id: 'pro',
    name: 'Pro Aspirant',
    price: 499,
    duration: 'month',
    description: 'Full self-study toolkit for serious preparation.',
    features: ['Unlimited mock tests', 'AI mains evaluation', 'Flashcards, mindmaps and spaced repetition'],
    isPopular: true,
    badge: 'Best value',
  },
  {
    id: 'mentor',
    name: 'Mentorship Pro',
    price: 1499,
    duration: 'month',
    description: 'Everything in Pro plus structured mentorship.',
    features: ['1-on-1 mentorship', 'Priority answer review', 'Personal roadmap support'],
  },
];

export default function BillingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const trialJustStarted = searchParams.get('trial') === 'started';

  const [sub, setSub] = useState<Subscription | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [plans, setPlans] = useState<Plan[]>(fallbackPlans);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subRes, ordersRes] = await Promise.all([
          userService.getSubscription(),
          userService.getOrders(),
        ]);
        setSub(subRes.data || { plan: 'free', status: 'expired' });
        setOrders(ordersRes.data || []);
      } catch {
        // Fallback to localStorage if backend fails
        const localPlan = typeof window !== 'undefined'
          ? (localStorage.getItem('userPlan') as Subscription['plan'] | null)
          : null;
        const trialEnd = typeof window !== 'undefined' ? localStorage.getItem('proTrialEnd') : null;
        if (localPlan === 'trial' && trialEnd) {
          setSub({ plan: 'trial', status: 'trial', trialEndsOn: trialEnd, amount: 'Free 7-day trial' });
        } else {
          setSub({ plan: 'free', status: 'expired' });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    pricingService.getPlans()
      .then((res) => {
        const data = Array.isArray(res?.data) ? res.data : [];
        if (data.length > 0) setPlans(data);
      })
      .catch(() => {});
  }, []);

  const handleUpgrade = () => {
    setActionMsg(null);
    router.push('/pricing');
  };

  const handleCancel = async () => {
    if (!confirm('Cancel your subscription? You will keep Pro access until the end of the current period.')) return;
    try {
      await userService.cancelSubscription();
      setSub({ plan: 'free', status: 'expired' });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userPlan');
        localStorage.removeItem('proTrialEnd');
      }
      setActionMsg('Subscription cancelled. You will revert to the free plan at the end of the current period.');
    } catch (err: any) {
      setActionMsg(err?.message || 'Could not cancel subscription. Please try again.');
    }
  };

  const handleAddPaymentMethod = () => {
    setActionMsg('Payment method capture is coming soon. We will email you when it is live.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] px-6 py-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  const isPaid = sub && (sub.plan === 'pro' || sub.plan === 'pro-annual' || sub.plan === 'trial');

  return (
    <div className="min-h-screen bg-[#f1f5f9] px-6 py-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-4">
        <Link href="/dashboard" className="font-normal text-[14px] leading-[20px] text-[#155dfc] hover:text-[#1248c9]">
          Home
        </Link>
        <span className="text-[14px] leading-[20px] text-[#90a1b9]">›</span>
        <span className="font-normal text-[14px] leading-[20px] text-[#62748e]">Billing</span>
      </nav>

      <h1 className="text-[30px] leading-[36px] font-bold text-[#0f172b] mb-6">
        Billing & Subscription
      </h1>

      <section className="mb-8 overflow-hidden rounded-[18px] bg-[#0B1220] text-white">
        <div className="px-6 py-8 md:px-8 md:py-10" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[1.5px] text-[#F0B100]">Billing & Plans</p>
          <h2 className="mb-3 max-w-[760px] text-[34px] font-bold leading-tight md:text-[44px]" style={{ fontFamily: 'Georgia, serif' }}>
            Your IAS journey deserves a smarter foundation.
          </h2>
          <p className="max-w-[640px] text-[15px] leading-6 text-[#A9B4C6]">
            Manage your plan, purchases and invoices from one place. Pricing and feature lists are pulled from the admin pricing setup when available.
          </p>
        </div>
      </section>

      {trialJustStarted && (
        <div className="mb-6 rounded-[10px] border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-[#15803D] text-[14px]">
          🎉 Your 7-day free trial is active. Enjoy full Pro access until {new Date(sub?.trialEndsOn || Date.now()).toLocaleDateString()}.
        </div>
      )}

      {actionMsg && (
        <div className="mb-6 rounded-[10px] border border-[#FED7AA] bg-[#FFF7ED] px-4 py-3 text-[#9A3412] text-[14px]">
          {actionMsg}
        </div>
      )}

      {/* Free user — show upsell, NOT a fake purchased state */}
      {!isPaid && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="relative rounded-[18px] border bg-white p-6 shadow-sm"
                style={{ borderColor: plan.isPopular ? '#F0B100' : '#E2E8F0' }}
              >
                {(plan.badge || plan.isPopular) && (
                  <div className="absolute -top-3 left-6 rounded-full bg-[#F0B100] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.5px] text-[#101828]">
                    {plan.badge || 'Popular'}
                  </div>
                )}
                <h3 className="mb-2 text-[20px] font-bold text-[#0F172B]">{plan.name}</h3>
                <p className="mb-5 min-h-[40px] text-[14px] leading-5 text-[#62748E]">{plan.description}</p>
                <div className="mb-5">
                  {plan.price === 0 ? (
                    <span className="text-[34px] font-bold text-[#0F172B]">Free</span>
                  ) : (
                    <>
                      <span className="text-[34px] font-bold text-[#0F172B]">₹{plan.price.toLocaleString('en-IN')}</span>
                      <span className="text-[14px] text-[#62748E]">/{plan.duration}</span>
                    </>
                  )}
                </div>
                <ul className="mb-6 space-y-3">
                  {(plan.features || []).slice(0, 5).map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-[14px] text-[#314158]">
                      <span className="mt-0.5 text-[#16A34A]">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={plan.price === 0 ? () => router.push('/dashboard') : handleUpgrade}
                  className="w-full rounded-[10px] px-4 py-3 text-[14px] font-bold"
                  style={{
                    background: plan.isPopular || plan.price > 0 ? 'linear-gradient(90deg, #F0AE00 0%, #FE6D00 100%)' : '#F8FAFC',
                    color: plan.price === 0 && !plan.isPopular ? '#0F172B' : '#FFFFFF',
                    border: plan.price === 0 && !plan.isPopular ? '1px solid #E2E8F0' : 'none',
                  }}
                >
                  {plan.price === 0 ? 'Current free access' : 'Purchase Plan'}
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-[340px] flex flex-col gap-6 flex-shrink-0">
            <div
              className="bg-white rounded-[14px] border-[0.8px] border-[#e2e8f0] pt-[24.8px] px-[24.8px] pb-[24.8px] flex flex-col gap-4"
              style={cardStyle}
            >
              <h3 className="font-semibold text-[18px] leading-[28px] text-[#0f172b]">Current Plan</h3>
              <div className="rounded-[10px] border-[0.8px] border-[#e2e8f0] bg-[#f8fafc] px-[16.8px] pt-[16.8px] pb-[16.8px] flex flex-col gap-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[16px] leading-[24px] text-[#0f172b]">Free</span>
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-full font-semibold text-[12px] leading-[16px]"
                    style={{ color: '#9A3412', background: '#FED7AA' }}
                  >
                    Not subscribed
                  </span>
                </div>
                <p className="font-normal text-[14px] leading-[20px] text-[#62748e] mt-1">
                  You are currently on the free plan.
                </p>
              </div>
              <button
                onClick={handleUpgrade}
                className="h-[40px] px-5 rounded-[10px] bg-[#1d293d] font-medium text-[14px] text-white hover:bg-[#2a3a52] transition-colors"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div
              className="bg-white rounded-[14px] border-[0.8px] border-[#e2e8f0] pt-[24.8px] px-[24.8px] pb-[24.8px] flex flex-col gap-4"
              style={cardStyle}
            >
              <h3 className="font-semibold text-[18px] leading-[28px] text-[#0f172b]">Plan Benefits</h3>
              <p className="text-[14px] text-[#62748e]">
                Upgrade to Pro to unlock unlimited mock tests, full PYQ archive, AI-powered mains evaluation, mindmap builder, and spaced-repetition reminders.
              </p>
              <p className="text-[12px] text-[#90a1b9]">
                No payment history while on the free plan.
              </p>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Paid / trial user — real subscription state */}
      {isPaid && sub && (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-[340px] flex flex-col gap-6 flex-shrink-0">
            <div
              className="bg-white rounded-[14px] border-[0.8px] border-[#e2e8f0] pt-[24.8px] px-[24.8px] pb-[24.8px] flex flex-col gap-4"
              style={cardStyle}
            >
              <h3 className="font-semibold text-[18px] leading-[28px] text-[#0f172b]">Current Plan</h3>

              <div className="rounded-[10px] border-[0.8px] border-[#e2e8f0] bg-[#f8fafc] px-[16.8px] pt-[16.8px] pb-[16.8px] flex flex-col gap-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[16px] leading-[24px] text-[#0f172b]">
                    {sub.plan === 'trial' ? 'Pro · 7-day Trial' : sub.plan === 'pro-annual' ? 'Pro Annual' : 'Pro'}
                  </span>
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-full font-semibold text-[12px] leading-[16px]"
                    style={{
                      color: sub.status === 'active' || sub.status === 'trial' ? '#008236' : '#9A3412',
                      background: sub.status === 'active' || sub.status === 'trial' ? '#dcfce7' : '#FED7AA',
                    }}
                  >
                    {sub.status === 'trial' ? 'Trial' : sub.status === 'active' ? 'Active' : 'Cancelled'}
                  </span>
                </div>
                <p className="font-normal text-[14px] leading-[20px] text-[#62748e] mt-1">
                  {sub.amount || '₹999/month'}
                  {sub.renewsOn && ` · Renews ${new Date(sub.renewsOn).toLocaleDateString()}`}
                  {sub.trialEndsOn && ` · Trial ends ${new Date(sub.trialEndsOn).toLocaleDateString()}`}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleUpgrade}
                  className="h-[40px] px-5 rounded-[10px] bg-[#1d293d] font-medium text-[14px] text-white hover:bg-[#2a3a52] transition-colors"
                >
                  Upgrade
                </button>
                <button
                  onClick={handleCancel}
                  className="h-[40px] rounded-[10px] font-medium text-[14px] text-[#e7000b] hover:text-[#c00] transition-colors"
                >
                  Cancel Plan
                </button>
              </div>
            </div>

            <div
              className="bg-white rounded-[14px] border-[0.8px] border-[#e2e8f0] pt-[24.8px] px-[24.8px] pb-[24.8px] flex flex-col gap-4"
              style={cardStyle}
            >
              <h3 className="font-semibold text-[18px] leading-[28px] text-[#0f172b]">Payment Method</h3>
              <p className="text-[14px] text-[#62748e]">No payment method on file.</p>
              <button
                onClick={handleAddPaymentMethod}
                className="font-medium text-[14px] leading-[20px] text-[#155dfc] hover:text-[#1248c9] transition-colors text-left"
              >
                + Add payment method
              </button>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div
              className="bg-white rounded-[14px] border-[0.8px] border-[#e2e8f0] pt-[24.8px] px-[24.8px] pb-[24.8px] flex flex-col gap-4"
              style={cardStyle}
            >
              <h3 className="font-semibold text-[18px] leading-[28px] text-[#0f172b]">Billing History</h3>

              {orders.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {orders.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between py-4 ${idx !== orders.length - 1 ? 'border-b-[0.8px] border-[#f1f5f9]' : ''}`}
                    >
                      <span className="font-medium text-[14px] leading-[20px] text-[#0f172b]">
                        {new Date(item.created_at).toLocaleDateString()} — {item.itemName}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-[14px] leading-[20px] text-[#0f172b]">₹{(item.amount / 100).toLocaleString()}</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium capitalize" style={{
                          color: item.status === 'paid' ? '#008236' : '#9A3412',
                          background: item.status === 'paid' ? '#dcfce7' : '#FED7AA',
                        }}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[14px] text-[#62748e]">No invoices yet — your first receipt will appear here after the trial converts.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
