'use client';

import { useEffect, useState } from 'react';
import { adminService, entitlementService } from '@/lib/services';
import type { PlanTier, EntitlementSummary } from '@/contexts/EntitlementsContext';

interface Analytics {
  totalUsers?: number;
  totalQuestions?: number;
  totalEditorials?: number;
  totalMockTests?: number;
  dailyActiveUsers?: number;
  questionsAnsweredToday?: number;
  [key: string]: any;
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics>({});
  const [entitlements, setEntitlements] = useState<EntitlementSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [planLoading, setPlanLoading] = useState(true);
  const [planSaving, setPlanSaving] = useState<PlanTier | 'reset' | null>(null);
  const [error, setError] = useState('');
  const [planMessage, setPlanMessage] = useState('');

  useEffect(() => {
    adminService
      .getAnalytics()
      .then((res) => {
        if (res.data) setAnalytics(res.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const loadEntitlements = async () => {
    setPlanLoading(true);
    try {
      const res = await entitlementService.getMyEntitlements();
      setEntitlements((res.data || null) as EntitlementSummary | null);
    } catch (err: any) {
      setPlanMessage(`Error: ${err.message}`);
    } finally {
      setPlanLoading(false);
    }
  };

  useEffect(() => { loadEntitlements(); }, []);

  const handlePlanSimulation = async (tier: PlanTier) => {
    setPlanSaving(tier);
    setPlanMessage('');
    try {
      await adminService.setMyPlanSimulation(tier);
      await loadEntitlements();
      setPlanMessage(`Effective plan switched to ${tier}.`);
    } catch (err: any) {
      setPlanMessage(`Error: ${err.message}`);
    } finally {
      setPlanSaving(null);
    }
  };

  const handlePlanReset = async () => {
    setPlanSaving('reset');
    setPlanMessage('');
    try {
      await adminService.clearMyPlanSimulation();
      await loadEntitlements();
      setPlanMessage('Plan simulation cleared. Effective plan now follows real billing.');
    } catch (err: any) {
      setPlanMessage(`Error: ${err.message}`);
    } finally {
      setPlanSaving(null);
    }
  };

  const planTiers: PlanTier[] = ['free', 'aspire', 'rise', 'ascent'];
  const isSimulated = Boolean(entitlements?.override?.isAdminPlanSimulation);

  const statCards = [
    { label: 'Total Users', value: analytics.totalUsers ?? '-', color: '#6366F1' },
    { label: 'Total Questions', value: analytics.totalQuestions ?? '-', color: '#10B981' },
    { label: 'Editorials', value: analytics.totalEditorials ?? '-', color: '#F59E0B' },
    { label: 'Mock Tests', value: analytics.totalMockTests ?? '-', color: '#EF4444' },
    { label: 'Active Today', value: analytics.dailyActiveUsers ?? '-', color: '#8B5CF6' },
    { label: 'Answered Today', value: analytics.questionsAnsweredToday ?? '-', color: '#06B6D4' },
  ];

  return (
    <div>
      <h1
        className="font-inter font-bold text-[#111827] mb-[clamp(1.5rem,2vw,2rem)]"
        style={{ fontSize: 'clamp(22px, 1.6vw, 30px)' }}
      >
        Admin Dashboard
      </h1>

      {error && (
        <div
          className="mb-6 px-4 py-3 rounded-lg"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', fontSize: '14px' }}
        >
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-[clamp(1rem,1.5vw,1.5rem)] mb-[clamp(2rem,3vw,3rem)]">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl p-[clamp(1.25rem,1.5vw,1.75rem)]"
            style={{ border: '1px solid #E5E7EB' }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
              style={{ background: `${card.color}15` }}
            >
              <div className="w-3 h-3 rounded-full" style={{ background: card.color }} />
            </div>
            <p
              className="font-inter text-[#6B7280] mb-1"
              style={{ fontSize: 'clamp(12px, 0.8vw, 14px)' }}
            >
              {card.label}
            </p>
            <p
              className="font-inter font-bold text-[#111827]"
              style={{ fontSize: 'clamp(24px, 1.8vw, 36px)' }}
            >
              {loading ? '...' : card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-[clamp(1.25rem,1.5vw,1.75rem)] mb-[clamp(2rem,3vw,3rem)]" style={{ border: '1px solid #E5E7EB' }}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2
              className="font-inter font-semibold text-[#111827] mb-1"
              style={{ fontSize: 'clamp(16px, 1.1vw, 20px)' }}
            >
              Admin Plan Tester
            </h2>
            <p className="font-inter text-[#6B7280]" style={{ fontSize: 'clamp(12px, 0.8vw, 14px)' }}>
              Effective plan: <span className="font-semibold text-[#111827]">{planLoading ? 'Loading...' : entitlements?.tier || 'free'}</span>
              {isSimulated ? <span className="ml-2 text-[#B45309]">(simulated)</span> : <span className="ml-2">(real billing)</span>}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {planTiers.map((tier) => {
              const active = entitlements?.tier === tier && isSimulated;
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => handlePlanSimulation(tier)}
                  disabled={Boolean(planSaving)}
                  className="px-4 py-2 rounded-lg font-inter font-semibold text-sm disabled:opacity-60"
                  style={{
                    background: active ? '#111827' : '#F3F4F6',
                    color: active ? '#FFFFFF' : '#374151',
                    border: '1px solid #E5E7EB',
                  }}
                >
                  {planSaving === tier ? 'Saving...' : tier[0].toUpperCase() + tier.slice(1)}
                </button>
              );
            })}
            <button
              type="button"
              onClick={handlePlanReset}
              disabled={Boolean(planSaving)}
              className="px-4 py-2 rounded-lg font-inter font-semibold text-sm disabled:opacity-60"
              style={{ background: '#FFFFFF', color: '#EF4444', border: '1px solid #FECACA' }}
            >
              {planSaving === 'reset' ? 'Resetting...' : 'Use Real Plan'}
            </button>
            <a
              href="/dashboard"
              className="px-4 py-2 rounded-lg font-inter font-semibold text-sm"
              style={{ background: '#6366F1', color: '#FFFFFF' }}
            >
              Test Dashboard
            </a>
          </div>
        </div>
        {planMessage && (
          <div
            className="mt-4 px-4 py-3 rounded-lg text-sm font-inter"
            style={{
              background: planMessage.startsWith('Error') ? '#FEF2F2' : '#ECFDF5',
              color: planMessage.startsWith('Error') ? '#991B1B' : '#065F46',
              border: `1px solid ${planMessage.startsWith('Error') ? '#FECACA' : '#A7F3D0'}`,
            }}
          >
            {planMessage}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <h2
        className="font-inter font-semibold text-[#111827] mb-[clamp(1rem,1.2vw,1.5rem)]"
        style={{ fontSize: 'clamp(16px, 1.1vw, 20px)' }}
      >
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[clamp(1rem,1.5vw,1.5rem)]">
        {[
          { label: 'Upload PYQ PDF', desc: 'Parse questions from PDF', href: '/admin/pyq', color: '#6366F1' },
          { label: 'Create Daily MCQ', desc: 'Set today\'s MCQ challenge', href: '/admin/daily-content', color: '#10B981' },
          { label: 'Manage Editorials', desc: 'Scrape or add editorials', href: '/admin/editorials', color: '#F59E0B' },
          { label: 'View Users', desc: 'Manage user accounts', href: '/admin/users', color: '#EF4444' },
        ].map((action) => (
          <a
            key={action.label}
            href={action.href}
            className="bg-white rounded-2xl p-[clamp(1.25rem,1.5vw,1.75rem)] hover:shadow-md transition-shadow block"
            style={{ border: '1px solid #E5E7EB' }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
              style={{ background: `${action.color}15` }}
            >
              <div className="w-3 h-3 rounded-full" style={{ background: action.color }} />
            </div>
            <p
              className="font-inter font-semibold text-[#111827] mb-1"
              style={{ fontSize: 'clamp(14px, 0.95vw, 17px)' }}
            >
              {action.label}
            </p>
            <p
              className="font-inter text-[#6B7280]"
              style={{ fontSize: 'clamp(12px, 0.75vw, 14px)' }}
            >
              {action.desc}
            </p>
          </a>
        ))}
      </div>

      {/* Raw Analytics Data */}
      {!loading && Object.keys(analytics).length > 0 && (
        <div className="mt-[clamp(2rem,3vw,3rem)]">
          <h2
            className="font-inter font-semibold text-[#111827] mb-[clamp(0.75rem,1vw,1rem)]"
            style={{ fontSize: 'clamp(16px, 1.1vw, 20px)' }}
          >
            Full Analytics Data
          </h2>
          <div className="bg-white rounded-2xl p-[clamp(1.25rem,1.5vw,1.75rem)]" style={{ border: '1px solid #E5E7EB' }}>
            <pre
              className="overflow-x-auto text-[#374151] font-mono"
              style={{ fontSize: 'clamp(11px, 0.7vw, 13px)' }}
            >
              {JSON.stringify(analytics, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
