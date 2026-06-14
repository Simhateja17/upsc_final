'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { entitlementService } from '@/lib/services';
import { useAuth } from '@/contexts/AuthContext';

export type PlanTier = 'free' | 'aspire' | 'rise' | 'ascent';
export type AccessLevel = 'none' | 'limited' | 'full' | string;
export type FeatureStatus = {
  allowed: boolean;
  featureKey: string;
  used: number;
  limit: number | null;
  remaining: number | null;
  period: 'day' | 'hour' | 'lifetime' | 'total' | 'unlimited' | string;
  resetAt: string | null;
  tier?: PlanTier;
  code?: string;
  message?: string;
  throttle?: FeatureStatus;
  upgrade?: { recommendedTier: PlanTier; message: string };
};

export type EntitlementSummary = {
  tier: PlanTier;
  plan: any | null;
  subscription: any | null;
  features: Record<string, FeatureStatus>;
  access: Record<string, AccessLevel>;
  preview: Record<string, number | null>;
};

type EntitlementsContextValue = {
  summary: EntitlementSummary | null;
  tier: PlanTier;
  plan: any | null;
  subscription: any | null;
  features: Record<string, FeatureStatus>;
  access: Record<string, AccessLevel>;
  preview: Record<string, number | null>;
  loading: boolean;
  error: string | null;
  refreshEntitlements: () => Promise<void>;
  canAccess: (accessKey: string, allowed?: AccessLevel[]) => boolean;
  featureStatus: (featureKey: string) => FeatureStatus | null;
  isLimited: (accessKey: string) => boolean;
};

const DEFAULT_SUMMARY: EntitlementSummary = {
  tier: 'free',
  plan: null,
  subscription: null,
  features: {},
  access: {},
  preview: {},
};

const EntitlementsContext = createContext<EntitlementsContextValue | null>(null);

export function EntitlementsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [summary, setSummary] = useState<EntitlementSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshEntitlements = useCallback(async () => {
    if (!isAuthenticated) {
      setSummary(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await entitlementService.getMyEntitlements();
      setSummary((res.data || DEFAULT_SUMMARY) as EntitlementSummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load entitlements');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isLoading) return;
    refreshEntitlements();
  }, [isLoading, refreshEntitlements]);

  const value = useMemo<EntitlementsContextValue>(() => {
    const current = summary || DEFAULT_SUMMARY;
    return {
      summary,
      tier: current.tier,
      plan: current.plan,
      subscription: current.subscription,
      features: current.features || {},
      access: current.access || {},
      preview: current.preview || {},
      loading,
      error,
      refreshEntitlements,
      canAccess: (accessKey, allowed = ['full', 'limited']) => allowed.includes(current.access?.[accessKey] || 'none'),
      featureStatus: (featureKey) => current.features?.[featureKey] || null,
      isLimited: (accessKey) => current.access?.[accessKey] === 'limited',
    };
  }, [error, loading, refreshEntitlements, summary]);

  return <EntitlementsContext.Provider value={value}>{children}</EntitlementsContext.Provider>;
}

export function useEntitlements() {
  const ctx = useContext(EntitlementsContext);
  if (!ctx) throw new Error('useEntitlements must be used inside EntitlementsProvider');
  return ctx;
}
