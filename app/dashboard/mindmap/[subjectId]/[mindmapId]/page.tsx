'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { mindmapService, userService, pricingService } from '@/lib/services';
import { MindmapRenderer, MindmapListView } from '@/lib/mindmap';
import type { MindmapTree, TreeNode } from '@/lib/mindmap';

const CheckmarkIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type Branch = { name: string; count: number; color: string };
type QuizQuestion = { question: string; options: string[]; correctAnswer: string };

// New recursive tree format
type NewFormatData = {
  id: string;
  title: string;
  subject: string;
  color?: string;
  root: TreeNode;
  quizData: QuizQuestion[] | null;
  mastery: number;
  viewed: boolean;
};

// Legacy flat format
type LegacyNodeDef = { x: string; y: string; label: string; color: string };
type LegacyNodeData = { center: string; branches: LegacyNodeDef[] };
type LegacyFormatData = {
  id: string;
  title: string;
  subject: string;
  branches: Branch[];
  nodes: LegacyNodeData;
  quizData: QuizQuestion[] | null;
  mastery: number;
  viewed: boolean;
};

/**
 * Convert legacy flat format to new tree format for backwards compatibility.
 */
function legacyToTree(data: LegacyFormatData): NewFormatData {
  const branches = Array.isArray(data.branches) ? data.branches : [];
  return {
    id: data.id,
    title: data.title,
    subject: data.subject,
    root: {
      label: data.nodes?.center || data.title,
      children: branches.map((b) => ({
        label: b.name,
      })),
    },
    quizData: data.quizData,
    mastery: data.mastery,
    viewed: data.viewed,
  };
}

function isNewFormat(data: any): data is NewFormatData {
  // Direct new format: data.root exists at top level
  if (data && typeof data.root === 'object' && data.root !== null && 'label' in data.root) return true;
  // Migrated format: root lives inside the nodes JSON column
  if (data?.nodes?.root && typeof data.nodes.root === 'object' && 'label' in data.nodes.root) return true;
  return false;
}

function parseData(raw: any): NewFormatData {
  // Direct new format
  if (raw.root && typeof raw.root === 'object' && 'label' in raw.root) {
    return raw as NewFormatData;
  }
  // Migrated format: root is inside nodes column
  if (raw.nodes?.root && typeof raw.nodes.root === 'object' && 'label' in raw.nodes.root) {
    return {
      id: raw.id,
      title: raw.title,
      subject: raw.subject,
      root: raw.nodes.root,
      quizData: raw.quizData,
      mastery: raw.mastery,
      viewed: raw.viewed,
    };
  }
  // Legacy flat format
  return legacyToTree(raw);
}

export default function MindmapViewPage() {
  const params = useParams<{ subjectId: string; mindmapId: string }>();
  const { subjectId, mindmapId } = params;
  const router = useRouter();

  const [data, setData] = useState<NewFormatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProModal, setShowProModal] = useState(false);
  const [viewMode, setViewMode] = useState<'mindmap' | 'list'>('mindmap');

  // Pricing
  const [proPricing, setProPricing] = useState({
    monthly: 299,
    annualMonthly: 199,
    annualTotal: 2388,
    features: [
      'All 42+ Mindmaps across 8 subjects',
      'Custom Mindmap Builder – unlimited saves',
      'Topic Quizzes + Branch-by-Branch Revision',
      'Send maps to Flashcards + Spaced Repetition',
      'Schedule Revision + Planner sync',
    ],
  });

  useEffect(() => {
    pricingService.getPlans()
      .then((res: any) => {
        const plans = res?.data || [];
        const monthly = plans.find((p: any) => /month/i.test(p.duration || ''));
        const annual = plans.find((p: any) => /year|annual/i.test(p.duration || ''));
        if (monthly || annual) {
          setProPricing((prev) => ({
            monthly: monthly?.price ?? prev.monthly,
            annualTotal: annual?.price ?? prev.annualTotal,
            annualMonthly: annual?.price ? Math.round(annual.price / 12) : prev.annualMonthly,
            features: (annual?.features || monthly?.features || prev.features).filter(Boolean),
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleStartTrial = async () => {
    try {
      await userService.startTrial();
      const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      if (typeof window !== 'undefined') {
        localStorage.setItem('proTrialEnd', trialEnd);
        localStorage.setItem('userPlan', 'trial');
      }
      setShowProModal(false);
      router.push('/dashboard/billing/plans?trial=started');
    } catch (err: any) {
      alert(err?.message || 'Could not start trial. Please try again.');
    }
  };

  useEffect(() => {
    if (!subjectId || !mindmapId) return;
    mindmapService.getMindmap(subjectId, mindmapId)
      .then((res) => {
        if (res.status === 'success') {
          const raw = res.data;
          const parsed = parseData(raw);
          setData(parsed);
          if (!raw.viewed) {
            mindmapService.updateProgress(raw.id, raw.mastery, true).catch(() => {});
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [subjectId, mindmapId]);

  // Count total nodes for progress
  function countNodes(node: TreeNode): number {
    let count = 1;
    if (node.children) {
      for (const child of node.children) count += countNodes(child);
    }
    return count;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFE] text-[#101828] flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Loading mindmap...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] text-[#101828] flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Mindmap not found.</p>
        <Link href={`/dashboard/mindmap/${subjectId}`} className="text-blue-400 underline text-sm">
          &larr; Back to subject
        </Link>
      </div>
    );
  }

  const tree: MindmapTree = {
    title: data.title,
    subject: data.subject,
    color: data.color,
    root: data.root,
  };

  const totalNodes = countNodes(data.root);
  const topBranches = data.root.children?.length ?? 0;

  return (
    <div className="min-h-screen bg-[#F5F6FA] text-[#101828] font-inter">
      {/* PRO Modal */}
      {showProModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 font-inter">
          <div className="absolute inset-0 bg-[#0A0F1C]/80 backdrop-blur-sm" />
          <div className="relative bg-white rounded-[24px] overflow-hidden w-full max-w-[500px] shadow-2xl">
            <div className="bg-[#10182D] p-6 pb-8 text-center relative">
              <button
                onClick={() => setShowProModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                ✕
              </button>
              <div className="flex justify-center mb-3"><span className="text-[32px]">👑</span></div>
              <h2 className="text-[24px] font-bold text-white mb-2">Unlock Pro Access</h2>
              <p className="text-[#9CA3AF] text-[14px] leading-relaxed max-w-[340px] mx-auto">
                Upgrade for unlimited access to all maps, the builder, quizzes and more.
              </p>
            </div>
            <div className="p-6 -mt-4 bg-white rounded-t-[24px] relative z-10">
              <div className="space-y-4 mb-8">
                {proPricing.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-[18px]">✨</span>
                    <span className="text-[#374151] text-[14px] font-medium">{feat}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-[12px] border border-gray-200 text-center">
                  <div className="text-[12px] font-semibold text-gray-500 mb-1">Monthly</div>
                  <div className="text-[24px] font-bold text-[#10182D]">₹{proPricing.monthly}</div>
                  <div className="text-[11px] text-gray-400">per month</div>
                </div>
                <div className="p-4 rounded-[12px] border-2 border-[#10182D] bg-[#F9FAFB] text-center relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#10182D] text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">Best Value</div>
                  <div className="text-[12px] font-semibold text-gray-500 mb-1">Annual</div>
                  <div className="text-[28px] font-bold text-[#10182D]">₹{proPricing.annualMonthly}</div>
                  <div className="text-[11px] text-gray-400">per month, billed ₹{proPricing.annualTotal.toLocaleString('en-IN')}/yr</div>
                </div>
              </div>
              <button
                onClick={handleStartTrial}
                className="w-full bg-[#10182D] text-white py-4 rounded-[12px] font-bold text-[16px] flex items-center justify-center gap-2 hover:bg-[#1F2937] transition-all mb-4"
              >
                <span>⭐</span> Start Free 7-day Trial
              </button>
              <div className="text-center">
                <button onClick={() => setShowProModal(false)} className="text-[#6B7280] text-[13px] hover:text-[#111827] transition-colors">
                  Maybe later – keep free plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto py-6 px-4 sm:px-8">
        {/* Back link */}
        <Link href={`/dashboard/mindmap/${subjectId}`} className="inline-flex items-center text-[#6B7280] text-[13px] hover:text-[#111827] mb-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
            <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to {data.subject}
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-[24px] font-bold text-[#101828] mb-1">{data.title}</h1>
            <p className="text-[#6B7280] text-[13px]">
              {data.subject} · {topBranches} branches · {totalNodes} nodes
            </p>
          </div>
          <div className="flex items-center flex-wrap gap-2 sm:gap-3">
            {/* View toggle */}
            <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('mindmap')}
                className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors ${
                  viewMode === 'mindmap'
                    ? 'bg-[#10182D] text-white'
                    : 'text-[#6B7280] hover:text-[#101828]'
                }`}
              >
                Mindmap
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-[#10182D] text-white'
                    : 'text-[#6B7280] hover:text-[#101828]'
                }`}
              >
                List
              </button>
            </div>

            {/* Mastery badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#DCFCE7] shadow-sm">
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                <CheckmarkIcon />
              </div>
              <span className="text-[12px] text-[#047857] font-medium">{data.mastery}% mastered</span>
            </div>

            {/* Quiz PRO button */}
            {data.quizData && data.quizData.length > 0 && (
              <button
                type="button"
                onClick={() => router.push('/dashboard/billing/plans?source=mindmap-quiz')}
                className="rounded-full px-4 py-2 text-[12px] font-bold text-white flex items-center gap-1.5"
                style={{ background: 'linear-gradient(90deg, #F0AE00 0%, #FE6D00 100%)' }}
              >
                <span>Quiz</span>
                <span className="text-[10px] font-extrabold bg-white/20 rounded-full px-1.5 py-0.5 leading-none tracking-wide">PRO</span>
              </button>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col gap-6 items-stretch">
          {/* Mindmap / List view */}
          <div className="flex-1 min-w-0">
            {viewMode === 'mindmap' ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ height: 520 }}>
                <MindmapRenderer tree={tree} />
              </div>
            ) : (
              <MindmapListView root={data.root} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
