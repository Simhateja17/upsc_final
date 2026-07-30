'use client';

import { useIsTabletOrBelow } from '@/hooks/useIsMobile';
import type { FeatureStatus, PlanTier } from '@/contexts/EntitlementsContext';
import { PLAN_INCLUDED_FEATURES } from './billingPlanFeatures';

const FONT = 'var(--font-dm-sans), "DM Sans", Inter, sans-serif';
const CORMORANT = 'var(--font-cormorant-garamond), "Cormorant Garamond", Georgia, serif';

type PlanInfo = { id: string; name: string; tier: PlanTier; billingCycle: string; price?: number } | null;
type SubscriptionInfo = {
  id: string;
  status: string;
  endDate?: string | Date | null;
  currentEnd?: string | Date | null;
  chargeAt?: string | Date | null;
  autoRenew?: boolean;
} | null;

function formatDate(value?: string | Date | null): string {
  if (!value) return 'Not available';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Not available';
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatRupees(amount?: number | null): string {
  if (amount === undefined || amount === null) return '—';
  return `₹${amount.toLocaleString('en-IN')}`;
}

const CYCLE_LABEL: Record<string, string> = { monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Annual' };

type UsageRow = {
  key: string;
  label: string;
  valueText: string;
  percent: number;
  gradient: [string, string];
};

const GOLD_LIGHT: [string, string] = ['#c99730', '#f5ce72'];
const GOLD_RICH: [string, string] = ['#c99730', '#e8b84b'];
const GREEN: [string, string] = ['#16a34a', '#22c55e'];

function pctFor(used: number, limit: number | null): number {
  if (limit === null || limit <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((used / limit) * 100)));
}

function buildUsageRows(features: Record<string, FeatureStatus>, syllabusCoverage: number | null): UsageRow[] {
  const jeetAi = features['jeet_ai_message'];
  const mainsEval = features['mains_evaluation'];
  const mockAttempt = features['prelims_mock_attempt'];

  return [
    {
      key: 'jeet_ai_chats',
      label: 'Jeet AI Chats',
      valueText: jeetAi ? (jeetAi.limit === null ? 'Unlimited ∞' : `${jeetAi.used} / ${jeetAi.limit}`) : '—',
      percent: jeetAi ? pctFor(jeetAi.used, jeetAi.limit) : 0,
      gradient: GOLD_LIGHT,
    },
    {
      key: 'ai_mains_evaluations',
      label: 'AI Mains Evaluations',
      valueText: mainsEval ? (mainsEval.limit === null ? 'Unlimited ∞' : `${mainsEval.used} / ${mainsEval.limit}`) : '—',
      percent: mainsEval ? pctFor(mainsEval.used, mainsEval.limit) : 0,
      gradient: GOLD_LIGHT,
    },
    {
      key: 'mock_tests_attempted',
      label: 'Mock Tests Attempted',
      valueText: mockAttempt ? `${mockAttempt.used} / ${mockAttempt.limit ?? '∞'}` : '—',
      percent: mockAttempt ? pctFor(mockAttempt.used, mockAttempt.limit) : 0,
      gradient: GREEN,
    },
    {
      key: 'answer_reviews',
      label: 'Answer Reviews',
      valueText: mainsEval ? `${mainsEval.used} used` : '—',
      percent: mainsEval ? pctFor(mainsEval.used, mainsEval.limit) : 0,
      gradient: GOLD_RICH,
    },
    {
      key: 'syllabus_coverage',
      label: 'Syllabus Coverage',
      valueText: syllabusCoverage === null ? '—' : `${syllabusCoverage}%`,
      percent: syllabusCoverage ?? 0,
      gradient: GREEN,
    },
  ];
}

function UsageBar({ percent, gradient }: { percent: number; gradient: [string, string] }) {
  return (
    <div style={{ height: 6, borderRadius: 6, background: 'rgba(11,22,40,0.09)', overflow: 'hidden', width: '100%' }}>
      <div style={{ height: '100%', width: `${percent}%`, borderRadius: 6, background: `linear-gradient(to right, ${gradient[0]}, ${gradient[1]})` }} />
    </div>
  );
}

export default function MyPlanBillingTab({
  tier,
  plan,
  subscription,
  features,
  syllabusCoverage,
  busy,
  isPreview,
  onCancelClick,
  onUpgradeClick,
  onEditAddressClick,
  onResumeClick,
}: {
  tier: PlanTier;
  plan: PlanInfo;
  subscription: SubscriptionInfo;
  features: Record<string, FeatureStatus>;
  syllabusCoverage: number | null;
  busy?: boolean;
  /** Admin previewing this tier via the plan switcher — no real Subscription backs it, so
   * dates/price/cancel/upgrade are all fictional and must be presented as a clear preview. */
  isPreview?: boolean;
  onCancelClick: () => void;
  onUpgradeClick: () => void;
  onEditAddressClick: () => void;
  onResumeClick?: () => void;
}) {
  const isTabletOrBelow = useIsTabletOrBelow();
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
  // The free tier genuinely has no Subscription row to show billing/renewal for.
  // (Distinct from isPreview: an admin simulating any paid tier also has no subscription, but
  // that's fake data being previewed, not a real free plan.)
  const isFreeTierNoBilling = !subscription && !isPreview;
  const planName = plan?.name || (isPreview || isFreeTierNoBilling ? `${tierLabel} Plan` : 'Your Plan');
  const cycleLabel = CYCLE_LABEL[plan?.billingCycle || 'yearly'] || 'Annual';
  const renewDate = subscription?.currentEnd || subscription?.endDate;
  const isActive = subscription?.status === 'active';
  const usageRows = buildUsageRows(features, syllabusCoverage);
  const includedFeatures = PLAN_INCLUDED_FEATURES[tier] || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Dark plan card */}
      <div
        style={{
          background: '#070e1e',
          border: '1px solid rgba(232,184,75,0.2)',
          borderRadius: 16,
          padding: isTabletOrBelow ? '20px' : '29px 37px 37px',
          display: 'flex',
          flexDirection: isTabletOrBelow ? 'column' : 'row',
          alignItems: isTabletOrBelow ? 'stretch' : 'center',
          justifyContent: 'space-between',
          gap: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 54,
              height: 54,
              flexShrink: 0,
              borderRadius: 12,
              background: 'rgba(232,184,75,0.12)',
              border: '1px solid rgba(232,184,75,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
            }}
          >
            🏆
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontFamily: CORMORANT, fontWeight: 600, fontSize: 22.4, color: '#fff' }}>
                {planName}
              </h3>
              {isPreview ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 13px',
                    borderRadius: 20,
                    background: 'rgba(148,163,184,0.15)',
                    border: '1px solid rgba(148,163,184,0.35)',
                    fontFamily: FONT,
                    fontWeight: 700,
                    fontSize: 11,
                    letterSpacing: '0.44px',
                    color: '#cbd5e1',
                  }}
                >
                  🔍 Preview
                </span>
              ) : isFreeTierNoBilling ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 13px',
                    borderRadius: 20,
                    background: 'rgba(232,184,75,0.15)',
                    border: '1px solid rgba(232,184,75,0.3)',
                    fontFamily: FONT,
                    fontWeight: 700,
                    fontSize: 11,
                    letterSpacing: '0.44px',
                    color: '#e8b84b',
                  }}
                >
                  Always Free
                </span>
              ) : isActive && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 13px',
                    borderRadius: 20,
                    background: 'rgba(34,197,94,0.15)',
                    border: '1px solid rgba(34,197,94,0.3)',
                    fontFamily: FONT,
                    fontWeight: 700,
                    fontSize: 11,
                    letterSpacing: '0.44px',
                    color: '#4ade80',
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: '#4ade80' }} />
                  Active
                </span>
              )}
            </div>
            <p style={{ margin: '10px 0 0', fontFamily: FONT, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
              {isPreview ? (
                <>Previewing as {tierLabel} · admin plan switcher — no real billing</>
              ) : isFreeTierNoBilling ? (
                <>Free, forever · no card, no billing</>
              ) : (
                <>
                  {cycleLabel} · Renews {formatDate(renewDate)} ·{' '}
                  <span style={{ color: '#e8b84b' }}>
                    {formatRupees(plan?.price)} / {plan?.billingCycle === 'monthly' ? 'month' : plan?.billingCycle === 'quarterly' ? 'quarter' : 'year'}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {onResumeClick ? (
            <button
              type="button"
              onClick={onResumeClick}
              disabled={busy}
              style={{
                border: 'none',
                background: '#e8b84b',
                borderRadius: 9,
                padding: '10px 22px',
                fontFamily: FONT,
                fontWeight: 600,
                fontSize: 13,
                color: '#090e1c',
                cursor: busy ? 'not-allowed' : 'pointer',
              }}
            >
              {busy ? 'Resuming...' : 'Resume AutoPay'}
            </button>
          ) : (
            <>
              {!isFreeTierNoBilling && (
                <button
                  type="button"
                  onClick={onCancelClick}
                  disabled={busy || isPreview}
                  title={isPreview ? 'Not available while previewing a simulated plan' : undefined}
                  style={{
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'transparent',
                    borderRadius: 9,
                    padding: '11px 23px',
                    fontFamily: FONT,
                    fontWeight: 600,
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.7)',
                    cursor: busy || isPreview ? 'not-allowed' : 'pointer',
                    opacity: isPreview ? 0.45 : 1,
                  }}
                >
                  Cancel Plan
                </button>
              )}
              <button
                type="button"
                onClick={onUpgradeClick}
                disabled={busy || isPreview}
                title={isPreview ? 'Not available while previewing a simulated plan' : undefined}
                style={{
                  border: 'none',
                  background: '#e8b84b',
                  borderRadius: 9,
                  padding: '10px 22px',
                  fontFamily: FONT,
                  fontWeight: 600,
                  fontSize: 13,
                  color: '#090e1c',
                  cursor: busy || isPreview ? 'not-allowed' : 'pointer',
                  opacity: isPreview ? 0.45 : 1,
                }}
              >
                {isFreeTierNoBilling ? 'Upgrade Plan' : 'Upgrade / Change Plan'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Usage + Included grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isTabletOrBelow ? '1fr' : 'minmax(0,1fr) minmax(0,1.7fr)',
          gap: 24,
        }}
      >
        {/* Usage card */}
        <div
          style={{
            background: '#fff',
            border: '1px solid rgba(11,22,40,0.09)',
            borderRadius: 16,
            padding: 29,
            boxShadow: '0 2px 7px rgba(11,22,40,0.07)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <p style={{ margin: 0, fontFamily: FONT, fontWeight: 700, fontSize: 11, letterSpacing: '1.32px', textTransform: 'uppercase', color: '#6b7a99' }}>
            Your Usage This Month
          </p>
          {usageRows.map((row) => (
            <div key={row.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 13, color: '#374560' }}>{row.label}</span>
                <span style={{ fontFamily: FONT, fontSize: 12, color: '#6b7a99' }}>{row.valueText}</span>
              </div>
              <UsageBar percent={row.percent} gradient={row.gradient} />
            </div>
          ))}
        </div>

        {/* Included features card */}
        <div
          style={{
            background: '#fff',
            border: '1px solid rgba(11,22,40,0.09)',
            borderRadius: 16,
            padding: 29,
            boxShadow: '0 2px 7px rgba(11,22,40,0.07)',
          }}
        >
          <p style={{ margin: '0 0 16px', fontFamily: FONT, fontWeight: 700, fontSize: 11, letterSpacing: '1.32px', textTransform: 'uppercase', color: '#6b7a99' }}>
            Included in {tierLabel}
          </p>
          {includedFeatures.map((feature, i) => (
            <div
              key={feature}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: i === includedFeatures.length - 1 ? 'none' : '1px solid rgba(11,22,40,0.09)',
              }}
            >
              <span style={{ fontFamily: FONT, fontSize: 13, color: '#374560' }}>{feature}</span>
              <span style={{ color: '#22c55e', fontSize: 15 }}>✓</span>
            </div>
          ))}
        </div>
      </div>

      {/* Next billing footer */}
      <div
        style={{
          background: '#090e1c',
          border: '1px solid rgba(232,184,75,0.15)',
          borderRadius: 12,
          padding: '17px 21px',
          display: 'flex',
          flexDirection: isTabletOrBelow ? 'column' : 'row',
          alignItems: isTabletOrBelow ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18 }}>{isPreview ? '🔍' : isFreeTierNoBilling ? '✨' : '📅'}</span>
          {isPreview ? (
            <span style={{ fontFamily: FONT, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
              Preview mode — no real billing
            </span>
          ) : isFreeTierNoBilling ? (
            <span style={{ fontFamily: FONT, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
              No billing on the free plan — upgrade anytime for higher limits
            </span>
          ) : (
            <span style={{ fontFamily: FONT, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
              Next billing date:{' '}
              <strong style={{ fontFamily: FONT, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
                {formatDate(subscription?.chargeAt || renewDate)}
              </strong>{' '}
              · {cycleLabel} {planName} renewal
            </span>
          )}
          {!isFreeTierNoBilling && (
            <button
              type="button"
              onClick={onEditAddressClick}
              style={{ background: 'none', border: 'none', padding: 0, marginLeft: 4, fontFamily: FONT, fontSize: 12, color: '#e8b84b', textDecoration: 'underline', cursor: 'pointer' }}
            >
              Edit billing address
            </button>
          )}
        </div>
        <div style={{ fontFamily: CORMORANT, fontWeight: 700, fontSize: 19.2, color: '#e8b84b' }}>
          {isPreview || isFreeTierNoBilling ? '—' : formatRupees(plan?.price)}
        </div>
      </div>
    </div>
  );
}

