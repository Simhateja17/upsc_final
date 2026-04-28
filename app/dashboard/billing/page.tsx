'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { pricingService, userService } from '@/lib/services';

type SubscriptionPlan = 'free' | 'trial' | 'pro' | 'pro-annual';
type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial';

interface Subscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  renewsOn?: string;
  trialEndsOn?: string;
  amount?: string;
}

interface OrderItem {
  id: string;
  itemName: string;
  amount: number;
  status: string;
  created_at: string;
}

interface ApiPlan {
  id?: string;
  name?: string;
  description?: string;
  price?: number;
  duration?: string;
  features?: string[];
  isPopular?: boolean;
}

interface ShowcasePlan {
  id: 'starter' | 'scholar' | 'pro';
  eyebrow: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyMonthlyPrice: number;
  yearlyLabel: string;
  features: string[];
  sectionLabels?: string[];
  featured?: boolean;
  dark?: boolean;
}

const fallbackShowcasePlans: ShowcasePlan[] = [
  {
    id: 'starter',
    eyebrow: 'Forever Free',
    name: 'Starter',
    description: 'Build daily study habits. Begin your UPSC prep without spending a rupee.',
    monthlyPrice: 0,
    yearlyMonthlyPrice: 0,
    yearlyLabel: 'Always free, no card needed',
    features: [
      '10 MCQs / day',
      'Daily Mains Challenge (1 Q)',
      'Daily News Analysis - The Hindu & IE',
      '10,000+ Previous Year Questions',
      'YouTube Video Lectures',
      'Study Planner & Time Tracker',
      'Daily Leaderboard',
      'Jeet AI - 10 chats/day',
      'Limited Revision Suite',
    ],
  },
  {
    id: 'scholar',
    eyebrow: 'Dedicated Study',
    name: 'Scholar',
    description: 'For serious aspirants who study daily and want measurable progress.',
    monthlyPrice: 499,
    yearlyMonthlyPrice: 415,
    yearlyLabel: 'Rs 4,988/yr - billed annually',
    features: [
      'Everything in Starter',
      'Evaluation',
      '5 AI Mains Evaluations / day',
      '10 Mock Test attempts / month',
      'Syllabus Tracker',
      'Analytics',
      'Test Analytics',
      'Performance Analytics Dashboard',
      'Revision & AI',
      'Full Revision Suite - Flashcards, Mindmap, Spaced Rep.',
      'Jeet AI - 50 chats/day',
      'Study Groups & Discussion Forum',
    ],
    sectionLabels: ['Evaluation', 'Analytics', 'Revision & AI'],
    featured: true,
    dark: true,
  },
  {
    id: 'pro',
    eyebrow: 'Maximum Learning',
    name: 'Pro Aspirant',
    description: 'Unlimited tools, zero limits. For aspirants who leave nothing to chance.',
    monthlyPrice: 999,
    yearlyMonthlyPrice: 832,
    yearlyLabel: 'Rs 9,988/yr - billed annually',
    features: [
      'Everything in Scholar',
      'Unlimited Access',
      'Unlimited AI Mains Evaluations',
      'Unlimited Mock Test Practice',
      'Jeet AI - Unlimited chats',
      'Priority Features',
      'Priority Answer Review',
      'Q&A Forum - Priority Responses',
      'Mental Health Buddy',
      'Early Access to New Features',
    ],
    sectionLabels: ['Unlimited Access', 'Priority Features'],
    dark: true,
  },
];

const addonCards = [
  {
    icon: 'P',
    title: 'Prelims Test Series',
    description: '10 full-length Prelims mocks with detailed analysis & rank prediction',
    price: 'Rs 499',
    unit: '/ pack',
    cta: 'Add to Cart ->',
  },
  {
    icon: 'M',
    title: 'Mains Test Series',
    description: 'GS Paper I-IV full mocks with expert evaluation & model answers',
    price: 'Rs 799',
    unit: '/ pack',
    cta: 'Add to Cart ->',
  },
  {
    icon: '1:1',
    title: '1-on-1 Mentorship',
    description: 'Book a session with a UPSC-cleared mentor for personalised strategy',
    price: 'Rs 999',
    unit: '/ session',
    cta: 'Book a Session ->',
  },
];

const faqs = [
  {
    q: 'Can I cancel anytime?',
    a: "Yes, absolutely. You can cancel your subscription at any time from this page. Your access continues until the end of your current billing period. We don't charge any cancellation fees.",
  },
  {
    q: 'What happens after my 7-day free trial?',
    a: 'You can continue on a paid plan or stay on Starter. Your study data, progress and notes remain available on your account.',
  },
  {
    q: 'Is my payment information secure?',
    a: 'Yes. Payments are processed through secure gateways with encryption and standard payment-compliance controls.',
  },
  {
    q: 'Can I switch between plans?',
    a: 'Yes. You can switch or upgrade any time. Plan changes apply from the next billing cycle unless stated otherwise.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'If you need help with a charge, contact support from this page and our billing team will guide you based on the active policy.',
  },
];

function formatDate(value?: string) {
  if (!value) return 'Not available';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Not available';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function mapApiPlansToShowcase(apiPlans: ApiPlan[]): ShowcasePlan[] {
  if (!Array.isArray(apiPlans) || apiPlans.length === 0) {
    return fallbackShowcasePlans;
  }

  const freeApi = apiPlans.find((p) => Number(p.price || 0) === 0);
  const paidApi = apiPlans.filter((p) => Number(p.price || 0) > 0).sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  const scholarApi = paidApi[0];
  const proApi = paidApi[1] || paidApi[0];

  const scholarMonthly = Number(scholarApi?.price || fallbackShowcasePlans[1].monthlyPrice);
  const proMonthly = Number(proApi?.price || fallbackShowcasePlans[2].monthlyPrice);

  return [
    {
      ...fallbackShowcasePlans[0],
      description: freeApi?.description || fallbackShowcasePlans[0].description,
      features: Array.isArray(freeApi?.features) && freeApi!.features!.length > 0 ? freeApi!.features! : fallbackShowcasePlans[0].features,
    },
    {
      ...fallbackShowcasePlans[1],
      monthlyPrice: scholarMonthly,
      yearlyMonthlyPrice: Math.max(1, Math.round(scholarMonthly * 0.83)),
      yearlyLabel: `Rs ${Math.max(1, Math.round(scholarMonthly * 0.83 * 12)).toLocaleString('en-IN')}/yr - billed annually`,
      features: Array.isArray(scholarApi?.features) && scholarApi!.features!.length > 0
        ? ['Everything in Starter', ...scholarApi!.features!]
        : fallbackShowcasePlans[1].features,
    },
    {
      ...fallbackShowcasePlans[2],
      monthlyPrice: proMonthly,
      yearlyMonthlyPrice: Math.max(1, Math.round(proMonthly * 0.83)),
      yearlyLabel: `Rs ${Math.max(1, Math.round(proMonthly * 0.83 * 12)).toLocaleString('en-IN')}/yr - billed annually`,
      features: Array.isArray(proApi?.features) && proApi!.features!.length > 0
        ? ['Everything in Scholar', ...proApi!.features!]
        : fallbackShowcasePlans[2].features,
    },
  ];
}

function isSectionLabel(feature: string, labels?: string[]) {
  return Boolean(labels?.includes(feature));
}

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trialJustStarted = searchParams.get('trial') === 'started';

  const billingRef = useRef<HTMLElement | null>(null);
  const plansRef = useRef<HTMLElement | null>(null);

  const [activeTab, setActiveTab] = useState<'billing' | 'plans'>('plans');
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('yearly');

  const [sub, setSub] = useState<Subscription | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [apiPlans, setApiPlans] = useState<ApiPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const [subRes, ordersRes] = await Promise.all([
          userService.getSubscription(),
          userService.getOrders(),
        ]);
        setSub(subRes.data || { plan: 'free', status: 'expired' });
        setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      } catch {
        const localPlan = typeof window !== 'undefined'
          ? (localStorage.getItem('userPlan') as SubscriptionPlan | null)
          : null;
        const trialEnd = typeof window !== 'undefined' ? localStorage.getItem('proTrialEnd') : null;

        if (localPlan === 'trial' && trialEnd) {
          setSub({ plan: 'trial', status: 'trial', trialEndsOn: trialEnd, amount: '7-day free trial' });
        } else {
          setSub({ plan: 'free', status: 'expired' });
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    pricingService.getPlans()
      .then((res) => {
        const rows = Array.isArray(res?.data) ? res.data : [];
        setApiPlans(rows);
      })
      .catch(() => setApiPlans([]));
  }, []);

  const showcasePlans = useMemo(() => mapApiPlansToShowcase(apiPlans), [apiPlans]);
  const isPaidUser = sub?.plan === 'pro' || sub?.plan === 'pro-annual' || sub?.plan === 'trial';

  const planTitle = sub?.plan === 'trial'
    ? 'Trial Plan'
    : sub?.plan === 'pro-annual'
      ? 'Pro Aspirant Annual'
      : sub?.plan === 'pro'
        ? 'Pro Aspirant'
        : 'Starter';

  const planMeta = sub?.status === 'trial'
    ? `Trial ends ${formatDate(sub?.trialEndsOn)}`
    : sub?.renewsOn
      ? `Renews ${formatDate(sub.renewsOn)}`
      : 'No active renewal date';

  const scrollToSection = (section: 'billing' | 'plans') => {
    setActiveTab(section);
    const target = section === 'billing' ? billingRef.current : plansRef.current;
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleUpgrade = () => {
    setActionMsg(null);
    router.push('/pricing');
  };

  const handleCancel = async () => {
    if (!confirm('Cancel your subscription? You will keep access until the end of the current period.')) return;

    try {
      await userService.cancelSubscription();
      setSub({ plan: 'free', status: 'expired' });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userPlan');
        localStorage.removeItem('proTrialEnd');
      }
      setActionMsg('Subscription cancelled. Your access remains active until the current period ends.');
    } catch (err: any) {
      setActionMsg(err?.message || 'Unable to cancel right now. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-b-2 border-[#17223E]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6FA] pb-16" style={{ fontFamily: 'var(--font-inter)' }}>
      <section
        className="relative overflow-hidden px-4 py-16 sm:px-8 md:py-24"
        style={{
          background: 'radial-gradient(circle at left top, rgba(232,184,75,0.16) 0%, rgba(232,184,75,0) 26%), linear-gradient(135deg, #050C1B 0%, #06153A 55%, #0D2859 100%)',
        }}
      >
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="relative mx-auto max-w-[920px] text-center">
          <div className="mx-auto mb-4 flex w-fit items-center gap-3">
            <span className="h-[2px] w-10 rounded bg-[#E8B84B]" />
            <span className="rounded bg-[#E8B84B] px-3 py-1 text-[10px] font-bold uppercase tracking-[1.4px] text-[#090E1C]">Billing & Plans</span>
            <span className="h-[2px] w-10 rounded bg-[#E8B84B]" />
          </div>
          <h1 className="text-balance text-[40px] leading-[1.15] text-white md:text-[58px]" style={{ fontFamily: 'var(--font-cormorant)' }}>
            Your IAS Journey Deserves
            <br />
            a <span className="italic text-[#E8B84B]">Smarter</span> Foundation
          </h1>
          <p className="mx-auto mt-5 max-w-[560px] text-[15px] text-[rgba(255,255,255,0.45)]">
            No hidden fees · Cancel anytime · Start free today
          </p>
        </div>
      </section>

      <div className="mx-auto -mt-7 w-fit rounded-xl border border-[rgba(11,22,40,0.09)] bg-white p-1.5 shadow-[0_2px_7px_rgba(11,22,40,0.07)]">
        <button
          type="button"
          onClick={() => scrollToSection('billing')}
          className={`rounded-[9px] px-7 py-2.5 text-[13px] font-semibold transition ${
            activeTab === 'billing' ? 'bg-[#090E1C] text-[#E8B84B]' : 'text-[#6B7A99]'
          }`}
        >
          My Plan & Billing
        </button>
        <button
          type="button"
          onClick={() => scrollToSection('plans')}
          className={`rounded-[9px] px-7 py-2.5 text-[13px] font-semibold transition ${
            activeTab === 'plans' ? 'bg-[#090E1C] text-[#E8B84B]' : 'text-[#6B7A99]'
          }`}
        >
          Explore Plans
        </button>
      </div>

      <div className="mx-auto mt-8 flex w-full max-w-[1200px] flex-col gap-8 px-4 sm:px-6 lg:px-8">
        {trialJustStarted && (
          <div className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-[14px] text-[#166534]">
            Your 7-day free trial is active. Enjoy full access until {formatDate(sub?.trialEndsOn)}.
          </div>
        )}

        {actionMsg && (
          <div className="rounded-xl border border-[#FCD9B6] bg-[#FFF7ED] px-4 py-3 text-[14px] text-[#9A3412]">
            {actionMsg}
          </div>
        )}

        <section
          ref={billingRef}
          className="rounded-2xl border border-[rgba(232,184,75,0.2)] bg-[#070D1C] px-6 py-6 md:px-9 md:py-7"
        >
          <div className="flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-center">
            <div className="flex items-start gap-4">
              <div className="flex h-[54px] w-[54px] items-center justify-center rounded-xl border border-[rgba(232,184,75,0.3)] bg-[rgba(232,184,75,0.12)] text-[15px] font-bold text-[#E8B84B]">PRO</div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-[34px] leading-none text-white" style={{ fontFamily: 'var(--font-cormorant)' }}>
                    {isPaidUser ? "You're on Pro Aspirant" : 'You are on Starter'}
                  </h2>
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.3px] ${
                    isPaidUser
                      ? 'border border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.15)] text-[#4ADE80]'
                      : 'border border-[rgba(148,163,184,0.35)] bg-[rgba(148,163,184,0.12)] text-[#CBD5E1]'
                  }`}>
                    {isPaidUser ? 'Current Plan' : 'Free Plan'}
                  </span>
                </div>
                <p className="mt-2 text-[13px] text-[rgba(255,255,255,0.45)]">
                  {planTitle} · {planMeta}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => scrollToSection('plans')}
                className="rounded-[9px] border border-[rgba(255,255,255,0.15)] px-6 py-2.5 text-[13px] font-semibold text-[rgba(255,255,255,0.72)]"
              >
                {'<- Explore Plans'}
              </button>
              {isPaidUser ? (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-[9px] border border-[rgba(248,113,113,0.4)] px-6 py-2.5 text-[13px] font-semibold text-[#FCA5A5]"
                >
                  Cancel Plan
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleUpgrade}
                  className="rounded-[9px] border border-[rgba(232,184,75,0.35)] bg-[#E8B84B] px-6 py-2.5 text-[13px] font-bold text-[#090E1C]"
                >
                  Start Free Trial
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)]">
            <div className="max-h-[200px] overflow-y-auto">
              {orders.length > 0 ? (
                orders.slice(0, 4).map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] px-4 py-3 last:border-b-0">
                    <div>
                      <p className="text-[13px] font-semibold text-white">{item.itemName}</p>
                      <p className="text-[12px] text-[rgba(255,255,255,0.45)]">{formatDate(item.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-semibold text-[#E8B84B]">Rs {(item.amount / 100).toLocaleString('en-IN')}</p>
                      <p className="text-[12px] capitalize text-[rgba(255,255,255,0.5)]">{item.status}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-[13px] text-[rgba(255,255,255,0.45)]">
                  Billing history will appear here after your first successful payment.
                </div>
              )}
            </div>
          </div>
        </section>

        <section ref={plansRef} className="space-y-5">
          <div className="mx-auto w-fit rounded-full border border-[rgba(11,22,40,0.09)] bg-white p-1.5 shadow-[0_2px_7px_rgba(11,22,40,0.07)]">
            <button
              type="button"
              onClick={() => setCycle('monthly')}
              className={`rounded-full px-8 py-2.5 text-[13px] font-bold ${
                cycle === 'monthly' ? 'bg-[#090E1C] text-[#E8B84B]' : 'text-[#374560]'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setCycle('yearly')}
              className={`rounded-full px-8 py-2.5 text-[13px] font-bold ${
                cycle === 'yearly' ? 'bg-[#090E1C] text-[#E8B84B]' : 'text-[#374560]'
              }`}
            >
              Yearly <span className="ml-1 rounded bg-[#E8B84B] px-2 py-0.5 text-[10px] text-[#090E1C]">Save 17%</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {showcasePlans.map((plan) => {
              const isCurrentPro = isPaidUser && plan.id === 'pro';
              const price = cycle === 'yearly' ? plan.yearlyMonthlyPrice : plan.monthlyPrice;

              return (
                <article
                  key={plan.id}
                  className={`relative overflow-hidden rounded-[18px] border ${
                    plan.dark
                      ? 'border-[rgba(255,255,255,0.1)] text-white'
                      : 'border-[rgba(11,22,40,0.09)] bg-white text-[#0C1424]'
                  } ${plan.featured ? 'ring-2 ring-[#E8B84B]' : ''}`}
                  style={{
                    background: plan.dark
                      ? plan.featured
                        ? 'radial-gradient(circle at 100% 0%, rgba(232,184,75,0.12) 0%, rgba(232,184,75,0) 35%), #08122B'
                        : 'linear-gradient(160deg, #101D36 0%, #172444 100%)'
                      : '#FFFFFF',
                  }}
                >
                  {plan.featured && (
                    <div className="absolute left-1/2 top-0 -translate-x-1/2 rounded-b-[10px] bg-[#E8B84B] px-4 py-1 text-[10px] font-extrabold uppercase tracking-[0.8px] text-[#090E1C]">
                      Most Popular
                    </div>
                  )}

                  <div className="p-7 pt-9">
                    <p className={`text-[10px] font-bold uppercase tracking-[1.5px] ${plan.dark ? 'text-[rgba(232,184,75,0.7)]' : 'text-[#6B7A99]'}`}>
                      {plan.eyebrow}
                    </p>
                    <h3 className="mt-1 text-[44px] leading-none" style={{ fontFamily: 'var(--font-cormorant)' }}>{plan.name}</h3>
                    <p className={`mt-3 min-h-[44px] text-[13px] leading-[1.65] ${plan.dark ? 'text-[rgba(255,255,255,0.45)]' : 'text-[#6B7A99]'}`}>
                      {plan.description}
                    </p>

                    <div className="mt-5 flex items-end gap-1.5">
                      <span className={`pb-2 text-[18px] font-semibold ${plan.dark ? 'text-[#E8B84B]' : 'text-[#0C1424]'}`}>Rs</span>
                      <span className={`text-[52px] leading-none ${plan.dark ? 'text-[#E8B84B]' : 'text-[#0C1424]'}`} style={{ fontFamily: 'var(--font-cormorant)' }}>
                        {price.toLocaleString('en-IN')}
                      </span>
                      {plan.id !== 'starter' && <span className="pb-2 text-[12px] text-[rgba(255,255,255,0.35)]">/mo</span>}
                    </div>

                    <p className={`mt-2 text-[11px] ${plan.dark ? 'text-[rgba(255,255,255,0.28)]' : 'text-[#9AA3B8]'}`}>
                      {plan.id === 'starter' ? plan.yearlyLabel : plan.yearlyLabel}
                    </p>

                    <div className={`mt-5 h-px ${plan.dark ? 'bg-[rgba(255,255,255,0.1)]' : 'bg-[rgba(11,22,40,0.09)]'}`} />

                    <ul className="mt-4 space-y-2.5">
                      {plan.features.map((feature) => (
                        <li
                          key={`${plan.id}-${feature}`}
                          className={`flex items-start gap-2.5 text-[13px] ${
                            isSectionLabel(feature, plan.sectionLabels)
                              ? plan.dark
                                ? 'pt-4 text-[13px] font-extrabold uppercase tracking-[1.9px] text-[rgba(255,255,255,0.7)]'
                                : 'pt-4 text-[13px] font-extrabold uppercase tracking-[1.9px] text-[#374560]'
                              : plan.dark
                                ? 'text-[rgba(255,255,255,0.72)]'
                                : 'text-[#374560]'
                          }`}
                        >
                          {!isSectionLabel(feature, plan.sectionLabels) && (
                            <span className={`${plan.dark ? 'text-[#E8B84B]' : 'text-[#374560]'}`}>•</span>
                          )}
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      onClick={isCurrentPro ? undefined : handleUpgrade}
                      className={`mt-6 w-full rounded-[10px] px-4 py-3 text-[14px] font-bold ${
                        isCurrentPro
                          ? 'border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.1)] text-white'
                          : plan.featured
                            ? 'bg-[#E8B84B] text-[#090E1C]'
                            : plan.dark
                              ? 'bg-[#E8B84B] text-[#090E1C]'
                              : 'border border-[rgba(11,22,40,0.17)] bg-[#FAF8F4] text-[#0C1424]'
                      }`}
                    >
                      {isCurrentPro ? "You're on this plan" : plan.id === 'starter' ? 'Get Started Free ->' : 'Start 7-Day Free Trial ->'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-[14px] bg-[#090E1C] px-6 py-5">
          <div className="grid gap-4 text-[12px] text-[rgba(255,255,255,0.45)] md:grid-cols-4">
            <div className="flex items-center gap-2">LOCK Secure payments</div>
            <div className="flex items-center gap-2">TRIAL 7-day free trial</div>
            <div className="flex items-center gap-2">CANCEL anytime</div>
            <div className="flex items-center gap-2">COMMUNITY 15,000+ UPSC aspirants</div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2">
            <span className="h-[2px] w-7 rounded bg-[#E8B84B]" />
            <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#E8B84B]">Supercharge with Add-ons</span>
          </div>
          <h3 className="mt-2 text-[48px] leading-none text-[#0C1424]" style={{ fontFamily: 'var(--font-cormorant)' }}>
            Compatible with any plan
          </h3>
          <p className="mt-2 text-[14px] text-[#6B7A99]">Buy what you need · No lock-ins · One-time purchases</p>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {addonCards.map((addon) => (
              <article key={addon.title} className="rounded-[14px] border border-[rgba(11,22,40,0.09)] bg-white p-5">
                <div className="text-[26px]">{addon.icon}</div>
                <h4 className="mt-4 text-[22px] leading-none text-[#0C1424]" style={{ fontFamily: 'var(--font-cormorant)' }}>
                  {addon.title}
                </h4>
                <p className="mt-3 min-h-[40px] text-[12px] leading-[1.55] text-[#6B7A99]">{addon.description}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-[28px] leading-none text-[#C99730]" style={{ fontFamily: 'var(--font-cormorant)' }}>{addon.price}</span>
                  <span className="text-[11px] font-semibold text-[#9AA3B8]">{addon.unit}</span>
                </div>
                <button
                  type="button"
                  onClick={handleUpgrade}
                  className="mt-4 w-full rounded-[8px] border border-[rgba(11,22,40,0.17)] px-3 py-2.5 text-[12px] font-semibold text-[#374560]"
                >
                  {addon.cta}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2">
            <span className="h-[2px] w-7 rounded bg-[#E8B84B]" />
            <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#E8B84B]">Common Questions</span>
          </div>
          <h3 className="mt-2 text-[46px] leading-none text-[#0C1424]" style={{ fontFamily: 'var(--font-cormorant)' }}>
            Frequently Asked
          </h3>

          <div className="mt-4 overflow-hidden rounded-xl border border-[rgba(11,22,40,0.09)] bg-white">
            {faqs.map((item, index) => {
              const open = openFaq === index;
              return (
                <div key={item.q} className="border-b border-[rgba(11,22,40,0.09)] last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? -1 : index)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left"
                  >
                    <span className={`text-[14px] font-semibold ${open ? 'text-[#C99730]' : 'text-[#0C1424]'}`}>
                      {item.q}
                    </span>
                    <span className="text-[12px] text-[#6B7A99]">{open ? '^' : 'v'}</span>
                  </button>
                  {open && (
                    <div className="px-5 pb-4 text-[13px] leading-[1.75] text-[#6B7A99]">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

