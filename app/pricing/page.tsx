'use client';

import { Suspense } from 'react';
import ExplorePlansPage from '@/app/dashboard/billing/plans/page';
import { EntitlementsProvider } from '@/contexts/EntitlementsContext';

// The public pricing page deliberately renders the same pricing experience as
// the dashboard, so plan content, cycles, and checkout actions stay in sync.
export default function PricingPage() {
  return (
    <EntitlementsProvider>
      <Suspense fallback={<div className="min-h-screen bg-[#FAFBFE]" />}>
        <ExplorePlansPage />
      </Suspense>
    </EntitlementsProvider>
  );
}
