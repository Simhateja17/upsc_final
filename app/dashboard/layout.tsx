'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardService } from '@/lib/services';
import { supabase } from '@/lib/supabase';
import DashboardHeader from '@/components/DashboardHeader';
import Sidebar from '@/components/Sidebar';
import MilestonePopup from '@/components/MilestonePopup';
import OnboardingFlow from '@/components/OnboardingFlow';

const HIDE_SIDEBAR_ROUTES = ['/dashboard/profile', '/dashboard/settings', '/dashboard/billing', '/dashboard/feedback'];
const STREAK_MILESTONES = [3, 7, 10, 14, 21, 30] as const;

function getNextEligibleStreakMilestone(currentStreak: number, lastShownMilestone: number | null) {
  return [...STREAK_MILESTONES]
    .reverse()
    .find((milestone) => currentStreak >= milestone && milestone > (lastShownMilestone ?? 0)) ?? null;
}

function getStreakMilestoneCopy(streak: number) {
  return {
    title: `${streak}-day streak!`,
    description: `You've studied for ${streak} days in a row. Keep the streak alive and aim for the next checkpoint.`,
  };
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const didTryRefreshRef = useRef(false);
  const hideSidebar = HIDE_SIDEBAR_ROUTES.includes(pathname);
  const userId = user?.id;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);
  const [milestoneValue, setMilestoneValue] = useState<number | null>(null);
  const [milestoneTitle, setMilestoneTitle] = useState<string | undefined>(undefined);
  const [milestoneDescription, setMilestoneDescription] = useState<string | undefined>(undefined);
  const [authTimedOut, setAuthTimedOut] = useState(false);

  // Show a streak milestone when the current streak crosses one of the supported thresholds.
  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setShowMilestone(false);
      return;
    }

    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function loadMilestone() {
      try {
        const { data } = await dashboardService.getStreak();
        const currentStreak = Number(data?.currentStreak ?? 0);
        const storageKey = `rwj_streak_milestone_shown:${userId}`;
        const lastShownRaw = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
        const lastShownMilestone = lastShownRaw ? Number(lastShownRaw) : null;
        const nextMilestone = getNextEligibleStreakMilestone(currentStreak, Number.isFinite(lastShownMilestone ?? NaN) ? lastShownMilestone : null);

        if (!active || nextMilestone === null) return;

        const copy = getStreakMilestoneCopy(nextMilestone);
        timer = setTimeout(() => {
          if (!active) return;
          setMilestoneValue(nextMilestone);
          setMilestoneTitle(copy.title);
          setMilestoneDescription(copy.description);
          setShowMilestone(true);
          window.localStorage.setItem(storageKey, String(nextMilestone));
        }, 800);
      } catch {
        // Ignore streak fetch failures; the dashboard should still load normally.
      }
    }

    loadMilestone();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [isAuthenticated, userId]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isLoading || isAuthenticated) return;

    // Always check the Supabase session before redirecting.
    // A valid session means auth state just hasn't hydrated yet – never
    // redirect a user who has a live session to the login page.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // Truly unauthenticated – send to login.
        router.push('/login');
      } else if (!didTryRefreshRef.current) {
        // Session exists but user state not resolved – try once to hydrate it.
        didTryRefreshRef.current = true;
        refreshUser().catch(() => {});
      }
      // If didTryRefreshRef is already true and session still exists, do nothing –
      // refreshUser is likely still in flight; wait for the next render cycle.
    }).catch(() => {
      // Network error – don't redirect, let the user stay on the dashboard.
    });
  }, [isLoading, isAuthenticated, refreshUser, router]);

  // Fail-safe: if auth hydration hangs for too long, stop blocking UI forever.
  useEffect(() => {
    if (!isLoading) {
      setAuthTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setAuthTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  useEffect(() => {
    if (!authTimedOut || isAuthenticated) return;
    router.replace('/login');
  }, [authTimedOut, isAuthenticated, router]);

  if ((isLoading && !authTimedOut) || !isAuthenticated) {
    // Show a loading state instead of blank screen
    return (
      <div className="flex items-center justify-center" style={{ height: '100dvh', background: '#FAFBFE' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#17223E] mx-auto mb-4"></div>
          <p className="font-inter text-[#6B7280] text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: '100dvh' }}>
      <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        {!hideSidebar && (
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0" style={{ background: '#FAFBFE' }}>
          {children}
        </main>
      </div>

      {/* Onboarding flow – shown once for new users */}
      <OnboardingFlow />

      {/* Milestone Popup – WIP placeholder */}
      <MilestonePopup
        isOpen={showMilestone}
        onClose={() => setShowMilestone(false)}
        type="streak"
        value={milestoneValue ?? 30}
        title={milestoneTitle}
        description={milestoneDescription}
      />
    </div>
  );
}
