'use client';

import Link from 'next/link';
import React from 'react';
import { ApiRequestError } from '@/lib/api';
import { AccessLevel, FeatureStatus, PlanTier, useEntitlements } from '@/contexts/EntitlementsContext';

const TIER_LABEL: Record<PlanTier, string> = {
  free: 'Free',
  aspire: 'Aspire',
  rise: 'Rise',
  ascent: 'Ascent',
};

export function formatPeriod(period?: string) {
  if (!period || period === 'unlimited') return 'unlimited';
  if (period === 'total') return 'total';
  return `per ${period}`;
}

export function handleEntitlementError(error: unknown) {
  const payload = error instanceof ApiRequestError ? error.payload : null;
  const code = payload?.code;
  // used/limit/remaining reflect the exact usage snapshot the backend used to
  // decide to block this request - always fresher than the client's cached
  // EntitlementsContext, which only updates when something explicitly refreshes it.
  const usage = {
    used: typeof payload?.used === 'number' ? payload.used : null,
    limit: typeof payload?.limit === 'number' ? payload.limit : null,
    remaining: typeof payload?.remaining === 'number' ? payload.remaining : null,
    period: payload?.period ?? null,
  };
  if (code === 'FEATURE_THROTTLED') {
    return {
      title: 'Slow down for a bit',
      message: payload.message || 'You are sending requests too quickly. Please try again after some time.',
      resetAt: payload.throttle?.resetAt || payload.resetAt,
      action: 'Try again later',
      ...usage,
    };
  }
  if (code === 'FEATURE_LIMIT_REACHED') {
    return {
      title: 'Limit reached',
      message: payload.upgrade?.message || payload.message || 'You have used your current plan limit.',
      resetAt: payload.resetAt,
      action: 'Upgrade plan',
      ...usage,
    };
  }
  if (code === 'FEATURE_ACCESS_REQUIRED') {
    return {
      title: 'Upgrade required',
      message: payload.upgrade?.message || payload.message || 'Upgrade your plan to unlock this feature.',
      resetAt: null,
      action: 'Upgrade plan',
      ...usage,
    };
  }
  return {
    title: 'Something went wrong',
    message: error instanceof Error ? error.message : 'Please try again.',
    resetAt: null,
    action: 'Try again',
    used: null,
    limit: null,
    remaining: null,
    period: null,
  };
}

export function UsageMeter({ status, label, className = '' }: { status?: FeatureStatus | null; label: string; className?: string }) {
  if (!status) return null;
  const unlimited = status.limit === null || status.period === 'unlimited';
  const pct = unlimited || !status.limit ? 0 : Math.min(100, Math.round((status.used / status.limit) * 100));
  return (
    <div className={`rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 ${className}`}>
      <div className="mb-1 flex items-center justify-between gap-3 text-[12px] font-semibold text-[#334155]">
        <span>{label}</span>
        <span>{unlimited ? 'Unlimited' : `${status.remaining ?? 0} left`}</span>
      </div>
      {!unlimited && (
        <div className="h-1.5 overflow-hidden rounded-full bg-[#EEF2F7]">
          <div className="h-full rounded-full bg-[#E8B84B]" style={{ width: `${pct}%` }} />
        </div>
      )}
      <p className="mt-1 text-[11px] text-[#64748B]">
        {unlimited ? 'No daily cap on this plan.' : `${status.used} / ${status.limit} used ${formatPeriod(status.period)}.`}
      </p>
    </div>
  );
}

/** Sparkle used on the premium upgrade CTA - matches the SparkleIcon in UpgradeModals. */
function PromptSparkle() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flex: '0 0 auto', filter: 'drop-shadow(0 0 4px rgba(245,197,66,0.6))' }}
    >
      <path d="M12 2.5c.35 2.9 1.05 5.05 2.1 6.4 1.05 1.35 3.2 2.05 6.4 2.1-3.2.05-5.35.75-6.4 2.1-1.05 1.35-1.75 3.5-2.1 6.4-.35-2.9-1.05-5.05-2.1-6.4C8.85 11.75 6.7 11.05 3.5 11c3.2-.05 5.35-.75 6.4-2.1C10.95 7.55 11.65 5.4 12 2.5z" fill="#F5C542" />
      <path d="M19.5 15.5c.2 1.5.55 2.6 1.05 3.3.5.7 1.6 1.05 3.3 1.05-1.7 0-2.8.35-3.3 1.05-.5.7-.85 1.8-1.05 3.3-.2-1.5-.55-2.6-1.05-3.3-.5-.7-1.6-1.05-3.3-1.05 1.7 0 2.8-.35 3.3-1.05.5-.7.85-1.8 1.05-3.3z" fill="#F5C542" opacity="0.85" />
    </svg>
  );
}

export function UpgradePrompt({
  title = 'Upgrade to unlock this',
  currentTier,
  requiredTier = 'rise',
  message,
  status,
}: {
  title?: string;
  currentTier?: PlanTier;
  requiredTier?: PlanTier;
  message?: string;
  status?: FeatureStatus | null;
}) {
  const unlimited = !status || status.limit === null || status.period === 'unlimited';
  const pct = unlimited || !status?.limit ? 0 : Math.min(100, Math.round((status.used / status.limit) * 100));
  return (
    <div
      className="relative overflow-hidden rounded-[20px] bg-white px-8 pb-8 pt-9 text-center"
      style={{
        fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
        boxShadow: '0 25px 60px rgba(0,0,0,0.15), 0 8px 20px rgba(0,0,0,0.08)',
      }}
    >
      {/* Top gold accent line */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[3px] rounded-t-[20px]"
        style={{ background: 'linear-gradient(90deg, transparent, #F5C542, transparent)' }}
      />

      {/* Dark icon medallion with gold lock */}
      <div
        className="mx-auto mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#101827]"
        style={{ boxShadow: '0 10px 26px rgba(15,23,38,0.22), 0 4px 12px rgba(0,0,0,0.10)' }}
      >
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#F5C542" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>

      <div className="mb-3 inline-flex rounded-full bg-[#F5F5F7] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#9A7020]">
        {TIER_LABEL[currentTier || 'free']} plan
      </div>

      <h3
        className="text-[26px] font-bold leading-[1.2] text-[#1E2028]"
        style={{ fontFamily: "var(--font-cormorant-garamond), 'Cormorant Garamond', serif", letterSpacing: '-0.3px' }}
      >
        {title}
      </h3>

      <p className="mx-auto mt-2.5 max-w-[340px] text-[13.5px] leading-[1.65] text-[#4A4E5A]">
        {message || `This feature needs ${TIER_LABEL[requiredTier]} access.`}
      </p>

      {status && !unlimited && (
        <div className="mt-5 text-left">
          <div className="mb-[7px] flex items-baseline justify-between">
            <span className="text-[12px] font-medium text-[#6B7080]">Current usage</span>
            <span className="text-[12px] font-bold text-[#C05A2A]">
              <b>{status.used}</b> / {status.limit} Used
            </span>
          </div>
          <div className="h-[7px] w-full overflow-hidden rounded-full bg-[#EFEFF2]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct}%`,
                background: 'linear-gradient(90deg, #E14B2A 0%, #E86A2B 35%, #E89A2B 65%, #D9B65C 100%)',
                boxShadow: '0 1px 2px rgba(225,75,42,0.25)',
              }}
            />
          </div>
        </div>
      )}

      <Link
        href={`/dashboard/billing/plans?plan=${requiredTier}`}
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-transparent bg-[#1E2028] px-7 py-[15px] text-[15px] font-bold tracking-[0.2px] text-[#F5C542] transition-all duration-200 hover:-translate-y-px hover:border-[#F5C542] hover:shadow-[0_0_0_2px_rgba(245,197,66,0.35),0_0_18px_rgba(245,197,66,0.35),0_6px_20px_rgba(30,32,40,0.25)]"
      >
        <span>Upgrade to {TIER_LABEL[requiredTier]}</span>
        <PromptSparkle />
      </Link>
    </div>
  );
}

export function EntitlementGate({
  accessKey,
  allowed = ['full'],
  requiredTier = 'rise',
  title,
  message,
  children,
  preview,
}: {
  accessKey: string;
  allowed?: AccessLevel[];
  requiredTier?: PlanTier;
  title?: string;
  message?: string;
  children: React.ReactNode;
  preview?: React.ReactNode;
}) {
  const entitlements = useEntitlements();
  const permitted = entitlements.canAccess(accessKey, allowed);

  if (entitlements.loading && !entitlements.summary) {
    return (
      <div className="flex h-full items-center justify-center bg-[#F9FAFB]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8B84B] border-t-transparent" />
      </div>
    );
  }

  if (permitted) return <>{children}</>;

  return (
    <div className="relative min-h-full bg-[#F9FAFB] p-4 sm:p-6 lg:p-8">
      <div className="pointer-events-none select-none blur-[3px] opacity-55">
        {preview || children}
      </div>
      <div className="absolute inset-0 flex items-start justify-center bg-white/45 p-4 pt-16 backdrop-blur-[1px]">
        <div className="w-full max-w-[440px]">
          <UpgradePrompt
            title={title || 'This workspace is locked'}
            currentTier={entitlements.tier}
            requiredTier={requiredTier}
            message={message || 'Upgrade your plan to unlock the full experience.'}
          />
        </div>
      </div>
    </div>
  );
}
