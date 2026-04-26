'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import DashboardHeader from '@/components/DashboardHeader';
import Sidebar from '@/components/Sidebar';
import MilestonePopup from '@/components/MilestonePopup';

const HIDE_SIDEBAR_ROUTES = ['/dashboard/profile', '/dashboard/settings', '/dashboard/billing', '/dashboard/feedback'];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const didTryRefreshRef = useRef(false);
  const hideSidebar = HIDE_SIDEBAR_ROUTES.includes(pathname);
  const hideHeader = pathname === '/dashboard/pyq';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);

  // Show milestone popup placeholder on dashboard mount
  useEffect(() => {
    if (isAuthenticated) {
      // Placeholder: always show on login for demo purposes
      // TODO: wire to actual milestone checks (streak, tests completed, etc.)
      const timer = setTimeout(() => setShowMilestone(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isLoading || isAuthenticated) return;

    // Avoid false redirects when the Supabase session exists but `user` hasn't hydrated yet.
    // Try once to refresh user from session before sending to /login.
    if (!didTryRefreshRef.current) {
      didTryRefreshRef.current = true;
      refreshUser().catch(() => {
        // ignore and fall through to redirect on next render
      });
      return;
    }

    // Double-check Supabase session before redirecting — prevents
    // race conditions where user state hasn't caught up yet.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
      } else {
        // Session exists but user state hasn't caught up — refresh again
        refreshUser();
      }
    }).catch(() => {
      // Network error — don't redirect, let the user stay on dashboard
      // with cached session data
    });
  }, [isLoading, isAuthenticated, refreshUser, router]);

  if (isLoading || !isAuthenticated) {
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
      {!hideHeader && <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />}
      <div className="flex flex-1 overflow-hidden">
        {!hideSidebar && (
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
          {children}
        </main>
      </div>

      {/* Milestone Popup — WIP placeholder */}
      <MilestonePopup
        isOpen={showMilestone}
        onClose={() => setShowMilestone(false)}
        type="streak"
        value={30}
        title="Streak milestone!"
        description="You've studied for 30 days in a row. You're in the top 5% of aspirants on the platform."
      />
    </div>
  );
}
