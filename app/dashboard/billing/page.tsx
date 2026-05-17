'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
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

function CancelSubscriptionModal({
  open,
  onClose,
  onConfirmCancel,
  pending,
}: {
  open: boolean;
  onClose: () => void;
  onConfirmCancel: () => void;
  pending: boolean;
}) {
  const [reason, setReason] = useState('');
  const [choice, setChoice] = useState<'support' | 'cancel' | null>(null);
  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(10,17,32,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 760, borderRadius: 24, background: '#F5F7FC', border: '1px solid #E5E7EB', padding: 28 }}>
        <h3 style={{ margin: '0 0 8px', color: '#EF4444', fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 42, fontWeight: 600 }}>Cancel Subscription?</h3>
        <p style={{ margin: '0 0 14px', color: '#7C88A6', fontSize: 14 }}>We{'\''}re sorry to see you go. Here{'\''}s what you{'\''}ll lose:</p>
        <div style={{ border: '1px solid #FCD5D8', background: '#FFF6F7', borderLeft: '4px solid #EF4444', borderRadius: 10, padding: 16, marginBottom: 12 }}>
          <p style={{ margin: '0 0 10px', color: '#EF4444', fontSize: 14 }}>Your plan remains active until April 15, 2027. After that, you{'\''}ll be downgraded to the free Starter plan. You will permanently lose :</p>
          {['Unlimited Jeet AI Chats', 'Unlimited AI Mains Evaluations', 'Priority Answer Review', 'Mental Health Buddy', 'Unlimited Mock Tests'].map((item) => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#334155', marginBottom: 6 }}>
              <span style={{ color: '#EF4444', fontWeight: 700 }}>✕</span>
              <span style={{ fontSize: 14 }}>{item}</span>
            </div>
          ))}
        </div>
        <label style={{ display: 'block', marginBottom: 6, color: '#475569', fontSize: 14 }}>What{'\''}s making you leave? (required)</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Share what is not working for you, every word helps us to improve..."
          style={{ width: '100%', height: 86, borderRadius: 10, border: '1px solid #BFD2F3', background: '#fff', padding: 12, fontSize: 14, resize: 'none', marginBottom: 12 }}
        />
        <p style={{ margin: '0 0 8px', color: '#475569', fontSize: 14 }}>Is there anything we could do to change your mind?</p>
        <button type="button" onClick={() => setChoice('support')} style={{ width: '100%', marginBottom: 8, textAlign: 'left', borderRadius: 10, border: '1px solid #BFD2F3', background: '#fff', padding: '10px 12px', color: '#475569', fontSize: 14 }}>
          ○ Connect me with Support
        </button>
        <button type="button" onClick={() => setChoice('cancel')} style={{ width: '100%', marginBottom: 16, textAlign: 'left', borderRadius: 10, border: '1px solid #BFD2F3', background: '#fff', padding: '10px 12px', color: '#475569', fontSize: 14 }}>
          ○ No, I have made my decision
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button type="button" onClick={onClose} style={{ borderRadius: 10, border: 'none', background: '#091A37', color: '#fff', fontWeight: 700, padding: '12px 14px' }}>
            Keep My Plan
          </button>
          <button
            type="button"
            disabled={pending || !reason.trim() || choice !== 'cancel'}
            onClick={onConfirmCancel}
            style={{ borderRadius: 10, border: '1px solid #F9C9CF', background: '#fff', color: '#EF4444', fontWeight: 700, padding: '12px 14px', opacity: pending || !reason.trim() || choice !== 'cancel' ? 0.6 : 1 }}
          >
            {pending ? 'Cancelling...' : 'Yes, Cancel Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}

function BillingAddressModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ fullName: 'Tanshi', email: 'tanshi494@gmail.com', phone: '+91 XXXXXXXXXX', city: 'Delhi', state: 'Delhi' });
  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(10,17,32,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 760, borderRadius: 24, background: '#F5F7FC', border: '1px solid #E5E7EB', padding: 28 }}>
        <h3 style={{ margin: '0 0 4px', color: '#1F2937', fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 42, fontWeight: 600 }}>Update Billing Address</h3>
        <p style={{ margin: '0 0 14px', color: '#7C88A6', fontSize: 14 }}>Used for GST invoice generation.</p>
        <div style={{ display: 'grid', gap: 10 }}>
          <label style={{ color: '#7C88A6', fontSize: 11, fontWeight: 700, letterSpacing: '1px' }}>FULL NAME</label>
          <input value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} style={{ borderRadius: 10, border: '1px solid #D9D5CD', background: '#F7F5F1', padding: '12px 14px' }} />
          <label style={{ color: '#7C88A6', fontSize: 11, fontWeight: 700, letterSpacing: '1px' }}>EMAIL</label>
          <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} style={{ borderRadius: 10, border: '1px solid #D9D5CD', background: '#F7F5F1', padding: '12px 14px' }} />
          <label style={{ color: '#7C88A6', fontSize: 11, fontWeight: 700, letterSpacing: '1px' }}>PHONE</label>
          <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} style={{ borderRadius: 10, border: '1px solid #D9D5CD', background: '#F7F5F1', padding: '12px 14px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ color: '#7C88A6', fontSize: 11, fontWeight: 700, letterSpacing: '1px' }}>CITY</label>
              <input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} style={{ marginTop: 8, width: '100%', borderRadius: 10, border: '1px solid #D9D5CD', background: '#F7F5F1', padding: '12px 14px' }} />
            </div>
            <div>
              <label style={{ color: '#7C88A6', fontSize: 11, fontWeight: 700, letterSpacing: '1px' }}>STATE</label>
              <input value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} style={{ marginTop: 8, width: '100%', borderRadius: 10, border: '1px solid #D9D5CD', background: '#F7F5F1', padding: '12px 14px' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ borderRadius: 10, border: '1px solid #D1D5DB', background: '#F0F2F7', color: '#475569', fontWeight: 700, padding: '12px 14px' }}>Cancel</button>
            <button type="button" onClick={onClose} style={{ borderRadius: 10, border: 'none', background: '#E0B43F', color: '#111827', fontWeight: 700, padding: '12px 14px' }}>Save Address</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function BillingHero() {
  return (
    <div
      className="relative overflow-hidden flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(180deg, #0B1428 0%, #0F1C35 100%)',
        minHeight: 280,
        padding: '40px 24px 48px',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,.03) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="relative z-10 flex items-center gap-3 mb-5">
        <span style={{ display: 'block', width: 44, height: 1, background: 'linear-gradient(to right, transparent, #C8972A)' }} />
        <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '2.5px', color: '#C8972A', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          Billing &amp; Plans
        </span>
        <span style={{ display: 'block', width: 44, height: 1, background: 'linear-gradient(to left, transparent, #C8972A)' }} />
      </div>
      <h1
        className="relative z-10 text-center"
        style={{
          fontFamily: 'var(--font-cormorant-garamond), "Cormorant Garamond", Georgia, serif',
          fontWeight: 600,
          fontSize: 'clamp(28px, 3.6vw, 58px)',
          lineHeight: 1.15,
          color: '#FFFFFF',
          marginBottom: 16,
        }}
      >
        <span style={{ display: 'block', whiteSpace: 'nowrap' }}>Your IAS Journey Deserves</span>
        <span style={{ display: 'block', whiteSpace: 'nowrap' }}>
          a{' '}
          <em style={{ color: '#E8A820', fontStyle: 'italic', fontWeight: 600 }}>Smarter</em>
          {' '}Foundation
        </span>
      </h1>
      <p className="relative z-10 text-center" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
        No hidden fees. No surprise charges. Cancel anytime.
      </p>
    </div>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
function TabBar() {
  const router = useRouter();
  return (
    <div className="flex justify-center" style={{ padding: '12px 0 0' }}>
      <div style={{ display: 'inline-flex', background: '#fff', border: '1px solid rgba(11,22,40,0.09)', borderRadius: 14, padding: 5, boxShadow: '0 2px 8px rgba(11,22,40,0.07)' }}>
        <button
          type="button"
          style={{ borderRadius: 10, padding: '10px 28px', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, system-ui, sans-serif', cursor: 'pointer', border: 'none', background: '#090E1C', color: '#E8B84B' }}
        >
          My Plan &amp; Billing
        </button>
        <button
          type="button"
          onClick={() => router.push('/dashboard/billing/plans')}
          style={{ borderRadius: 10, padding: '10px 28px', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, system-ui, sans-serif', cursor: 'pointer', border: 'none', background: 'transparent', color: '#6B7A99' }}
        >
          Explore Plans
        </button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trialJustStarted = searchParams.get('trial') === 'started';
  const billingRef = useRef<HTMLElement | null>(null);

  const [sub, setSub] = useState<Subscription | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [cancelPending, setCancelPending] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [subRes, ordersRes] = await Promise.all([
          userService.getSubscription(),
          userService.getOrders(),
        ]);
        const fetched = subRes.data || { plan: 'free', status: 'expired' };
        setSub(fetched);
        setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
        // New users without an active paid plan land on the pricing page.
        const hasActivePlan = (fetched.plan === 'pro' || fetched.plan === 'pro-annual' || fetched.plan === 'trial')
          && (fetched.status === 'active' || fetched.status === 'trial');
        if (!hasActivePlan) {
          router.replace('/dashboard/billing/plans');
          return;
        }
      } catch {
        const localPlan = typeof window !== 'undefined' ? (localStorage.getItem('userPlan') as SubscriptionPlan | null) : null;
        const trialEnd = typeof window !== 'undefined' ? localStorage.getItem('proTrialEnd') : null;
        if (localPlan === 'trial' && trialEnd) {
          setSub({ plan: 'trial', status: 'trial', trialEndsOn: trialEnd, amount: '7-day free trial' });
        } else {
          setSub({ plan: 'free', status: 'expired' });
          router.replace('/dashboard/billing/plans');
          return;
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [router]);

  const isPaidUser = sub?.plan === 'pro' || sub?.plan === 'pro-annual' || sub?.plan === 'trial';

  const handleUpgrade = () => router.push('/dashboard/billing/plans');
  const handleCancel = async () => {
    setCancelPending(true);
    try {
      await userService.cancelSubscription();
      setSub({ plan: 'free', status: 'expired' });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userPlan');
        localStorage.removeItem('proTrialEnd');
      }
      setActionMsg('Subscription cancelled. Your access remains active until the current period ends.');
      setShowCancelModal(false);
    } catch (err: unknown) {
      setActionMsg((err as { message?: string })?.message || 'Unable to cancel right now. Please try again.');
    } finally {
      setCancelPending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFE] flex items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-b-2 border-[#17223E]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#E9EAEE', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <BillingHero />
      <TabBar />

      <div className="mx-auto mt-3 flex w-full max-w-[1120px] flex-col gap-8 px-4 pb-20 sm:px-6 lg:px-8" style={{ overflow: 'visible' }}>

        {trialJustStarted && (
          <div style={{ borderRadius: 12, border: '1px solid #BBF7D0', background: '#F0FDF4', padding: '12px 16px', fontSize: 14, color: '#166534' }}>
            Your 7-day free trial is active. Enjoy full access until {formatDate(sub?.trialEndsOn)}.
          </div>
        )}

        {actionMsg && (
          <div style={{ borderRadius: 12, border: '1px solid #FCD9B6', background: '#FFF7ED', padding: '12px 16px', fontSize: 14, color: '#9A3412' }}>
            {actionMsg}
          </div>
        )}

        {/* ── My Plan & Billing ── */}
        <section ref={billingRef} style={{ scrollMarginTop: 80, display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8, overflow: 'visible' }}>

          {/* Plan header card */}
          <div style={{
            borderRadius: 16,
            background: 'linear-gradient(160deg, #0A1120 0%, #0F1C35 100%)',
            display: 'flex',
            padding: '29px 37px 37px 37px',
            justifyContent: 'space-between',
            alignItems: 'center',
            alignSelf: 'stretch',
            position: 'relative',
            overflow: 'visible',
          }}>
            {/* Left — icon + plan info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 68, height: 68, borderRadius: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111827', border: '1.5px solid rgba(232,184,75,0.45)' }}>
                <Image src="/ksp.png" alt="Plan" width={26} height={26} style={{ objectFit: 'contain' }} />
              </div>
              <div>
                {/* Plan name + Active badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: '"Cormorant Garamond", var(--font-cormorant-garamond), Georgia, serif', fontSize: 22.4, fontWeight: 600, fontStyle: 'normal', lineHeight: 'normal', color: '#FFF' }}>
                    {isPaidUser ? 'Rise Aspirant Plan' : 'Starter Plan'}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 600, background: isPaidUser ? 'rgba(34,197,94,0.18)' : 'rgba(148,163,184,0.12)', border: `1px solid ${isPaidUser ? 'rgba(34,197,94,0.4)' : 'rgba(148,163,184,0.3)'}`, color: isPaidUser ? '#4ADE80' : '#94A3B8', fontFamily: 'Inter, system-ui, sans-serif' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: isPaidUser ? '#4ADE80' : '#94A3B8', display: 'inline-block', flexShrink: 0 }} />
                    {isPaidUser ? 'Active' : 'Free'}
                  </span>
                </div>
                {/* Subtitle */}
                <p style={{ margin: '5px 0 0', fontSize: 12.5, color: 'rgba(255,255,255,0.38)', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.4 }}>
                  {sub?.plan === 'pro-annual' ? 'Annual' : sub?.plan === 'trial' ? 'Trial' : 'Monthly'}
                  {' · '}
                  {sub?.status === 'trial' ? `Trial ends ${formatDate(sub?.trialEndsOn)}` : sub?.renewsOn ? `Renews ${formatDate(sub.renewsOn)}` : 'No renewal date'}
                  {sub?.amount && sub.amount !== 'Free' && (
                    <> · <span style={{ color: '#E8B84B', fontWeight: 600 }}>₹{sub.amount} / year</span></>
                  )}
                </p>
              </div>
            </div>

            {/* Right — buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {isPaidUser && (
                <button type="button" onClick={() => setShowCancelModal(true)} style={{ borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.22)', padding: '13px 26px', fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: 13, fontStyle: 'normal', fontWeight: 600, lineHeight: 'normal', textAlign: 'center', color: 'rgba(255,255,255,0.70)', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Cancel Plan
                </button>
              )}
              <button type="button" onClick={handleUpgrade} style={{ borderRadius: 12, border: 'none', padding: '13px 26px', fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: 13, fontStyle: 'normal', fontWeight: 600, lineHeight: 'normal', textAlign: 'center', color: '#090E1C', background: '#E8B84B', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {isPaidUser ? 'Upgrade / Change Plan' : 'Start Free Trial →'}
              </button>
            </div>
          </div>

          {/* Usage + Features two-column */}
          <div style={{ background: '#fff', border: '1px solid #ECEAE4', borderRadius: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden' }}>
            {/* Left — YOUR USAGE THIS MONTH */}
            <div style={{ padding: '28px 28px', borderRight: '1px solid #ECEAE4' }}>
              <p style={{ margin: '0 0 18px', fontSize: 10, fontWeight: 700, letterSpacing: '1.6px', color: '#9B9590', textTransform: 'uppercase', fontFamily: 'Inter, system-ui, sans-serif' }}>
                Your usage this month
              </p>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {([
                  { label: 'Jeet AI Chats',         value: 'Unlimited ∞', bar: 100, color: '#E8B84B' },
                  { label: 'AI Mains Evaluations',  value: 'Unlimited ∞', bar: 100, color: '#E8B84B' },
                  { label: 'Mock Tests Attempted',  value: '8 / ∞',       bar: 40,  color: '#22C55E' },
                  { label: 'Answer Reviews',        value: '12 used',      bar: 60,  color: '#E8B84B' },
                  { label: 'Syllabus Coverage',     value: '34%',          bar: 34,  color: '#22C55E' },
                ] as { label: string; value: string; bar: number; color: string }[]).map((row, i, arr) => (
                  <div key={row.label} style={{ paddingTop: i === 0 ? 0 : 14, paddingBottom: 14, borderBottom: i < arr.length - 1 ? '1px solid #F0EDE8' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#1A2540', fontFamily: 'Inter, system-ui, sans-serif' }}>{row.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', fontFamily: 'Inter, system-ui, sans-serif' }}>{row.value}</span>
                    </div>
                    <div style={{ height: 5, background: '#F0EDE8', borderRadius: 999 }}>
                      <div style={{ height: '100%', width: `${row.bar}%`, background: row.color, borderRadius: 999 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — INCLUDED IN RISE */}
            <div style={{ padding: '28px 28px' }}>
              <p style={{ margin: '0 0 18px', fontSize: 10, fontWeight: 700, letterSpacing: '1.6px', color: '#9B9590', textTransform: 'uppercase', fontFamily: 'Inter, system-ui, sans-serif' }}>
                Included in Rise
              </p>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {([
                  '25 Mains Evaluations / day',
                  '25 Mock Test attempts / day',
                  'Daily News Analysis – Hindu & IE',
                  '10,000+ Previous Year Questions',
                  'Jeet AI – 100 conversations / day',
                  'Daily MCQ Challenge – 10 questions',
                  'Study Planner & Time Tracker',
                  'Full Revision Suite – Flashcards, Mindmaps, Spaced Rep.',
                  'Full Performance Analytics Dashboard',
                  'Test Analytics – Deep insights',
                  'Syllabus Tracker – Full access',
                  'Daily Leaderboard & Discussion Forum',
                  'Live Study Room 24×7',
                  'Mental Health Buddy',
                ] as string[]).map((feat, i, arr) => (
                  <div key={feat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: i === 0 ? 0 : 11, paddingBottom: 11, borderBottom: i < arr.length - 1 ? '1px solid #F0EDE8' : 'none' }}>
                    <span style={{ fontSize: 13, fontWeight: 400, color: '#1A2540', fontFamily: 'Inter, system-ui, sans-serif' }}>{feat}</span>
                    <span style={{ color: '#22C55E', fontSize: 15, fontWeight: 700, flexShrink: 0, marginLeft: 16 }}>✓</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Billing footer bar */}
          <div style={{ borderRadius: 16, background: '#0A1120', padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>📅</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                Next billing date:{' '}
                <strong style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>
                  {sub?.renewsOn ? formatDate(sub.renewsOn) : '—'}
                </strong>
                {' · '}
                {isPaidUser ? 'Annual Rise Plan renewal' : 'No active subscription'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button type="button" onClick={() => setShowAddressModal(true)} style={{ borderRadius: 10, border: '1px solid rgba(255,255,255,0.26)', background: 'transparent', color: 'rgba(255,255,255,0.78)', padding: '10px 14px', fontSize: 12, fontWeight: 700 }}>
                Update Billing Address
              </button>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#E8B84B', fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '0.3px' }}>
                {orders.length > 0 ? `INR ${(orders[0].amount / 100).toLocaleString('en-IN')}` : 'INR 0'}
              </span>
            </div>
          </div>

        </section>

      </div>
      <CancelSubscriptionModal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirmCancel={handleCancel}
        pending={cancelPending}
      />
      <BillingAddressModal open={showAddressModal} onClose={() => setShowAddressModal(false)} />
    </div>
  );
}
