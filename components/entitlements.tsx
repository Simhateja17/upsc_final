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
  if (code === 'FEATURE_THROTTLED') {
    return {
      title: 'Slow down for a bit',
      message: payload.message || 'You are sending requests too quickly. Please try again after some time.',
      resetAt: payload.throttle?.resetAt || payload.resetAt,
      action: 'Try again later',
    };
  }
  if (code === 'FEATURE_LIMIT_REACHED') {
    return {
      title: 'Limit reached',
      message: payload.upgrade?.message || payload.message || 'You have used your current plan limit.',
      resetAt: payload.resetAt,
      action: 'Upgrade plan',
    };
  }
  if (code === 'FEATURE_ACCESS_REQUIRED') {
    return {
      title: 'Upgrade required',
      message: payload.upgrade?.message || payload.message || 'Upgrade your plan to unlock this feature.',
      resetAt: null,
      action: 'Upgrade plan',
    };
  }
  return {
    title: 'Something went wrong',
    message: error instanceof Error ? error.message : 'Please try again.',
    resetAt: null,
    action: 'Try again',
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
  return (
    <div className="rounded-[14px] border border-[#E8D7A6] bg-[#FFFBEB] p-5 shadow-sm">
      <div className="mb-2 inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#9A7020]">
        {TIER_LABEL[currentTier || 'free']} plan
      </div>
      <h3 className="text-[20px] font-bold text-[#101828]">{title}</h3>
      <p className="mt-2 text-[13px] leading-6 text-[#475569]">
        {message || `This feature needs ${TIER_LABEL[requiredTier]} access.`}
      </p>
      {status && <UsageMeter status={status} label="Current usage" className="mt-4" />}
      <Link
        href={`/dashboard/billing/plans?plan=${requiredTier}`}
        className="mt-4 inline-flex rounded-[10px] bg-[#101828] px-4 py-2.5 text-[13px] font-bold text-white"
      >
        View upgrade options
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
        <div className="w-full max-w-[520px]">
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
