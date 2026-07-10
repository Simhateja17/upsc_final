'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { mindmapService } from '@/lib/services';
import { getTopicIcon } from '@/lib/topic-icons';

const CheckmarkIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type MindmapStatus = 'Done' | 'Reviewed' | 'New';

type MindmapItem = {
  id: string;
  title: string;
  slug: string;
  branchCount: number;
  mastery: number;
  viewed: boolean;
};

function getStatus(mastery: number, viewed: boolean): MindmapStatus {
  if (mastery >= 80) return 'Done';
  if (viewed) return 'Reviewed';
  return 'New';
}

export default function SubjectDetailPage() {
  const params = useParams<{ subjectId: string }>();
  const { subjectId } = params;
  const [subjectMeta, setSubjectMeta] = useState<{ name: string; icon: string } | null>(null);
  const [maps, setMaps] = useState<MindmapItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!subjectId) return;
    mindmapService.getMindmaps(subjectId)
      .then((res) => {
        if (res.status === 'success') {
          setSubjectMeta(res.data.subject);
          setMaps(res.data.maps);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [subjectId]);

  const subjectTitle = subjectMeta?.name ?? subjectId.replace(/-/g, ' ').replace(/\band\b/g, '&');

  // Matches how the subject-list endpoint derives `progress`: viewed maps over total maps.
  const exploredPct = maps.length > 0
    ? Math.round((maps.filter((m) => m.viewed).length / maps.length) * 100)
    : 0;

  const totalBranches = maps.reduce((sum, m) => sum + m.branchCount, 0);
  const masteredCount = maps.filter((m) => m.mastery === 100).length;

  const statusColors: Record<MindmapStatus, { bg: string; text: string }> = {
    Done: { bg: '#ECFDF5', text: '#10B981' },
    Reviewed: { bg: '#FFFBEB', text: '#F59E0B' },
    New: { bg: '#F0FDFA', text: '#2DD4BF' },
  };

  return (
    <div className="min-h-screen bg-[#FAFBFE] font-inter p-4 sm:p-8">
      <Link href="/dashboard/mindmap" className="inline-flex items-center text-[#6B7280] text-[13px] hover:text-[#111827] mb-6">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
          <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to Subjects
      </Link>

      <div className="max-w-[1200px] mx-auto">
        {/* Subject overview */}
        <div
          className="bg-white rounded-[20px] px-7 py-6 mb-6"
          style={{ border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}
        >
          <div className="flex flex-wrap items-center justify-between gap-6 mb-4">
            <div className="flex items-center gap-4 min-w-0">
              <span
                aria-hidden
                className="w-14 h-14 rounded-[16px] flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #FEF5E6, #FDE68A)',
                  boxShadow: '0 4px 16px rgba(212,175,55,0.15)',
                  fontSize: 28,
                  lineHeight: 1,
                }}
              >
                {subjectMeta?.icon ?? '🗺️'}
              </span>
              <div className="min-w-0">
                <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 26, lineHeight: 1.2, color: '#1E293B' }}>
                  {subjectTitle}
                </h1>
                <p className="text-[14px] text-[#6B7280] mt-1">
                  <span className="font-semibold text-[#374151]">{maps.length}</span> mindmaps ·{' '}
                  <span className="font-semibold text-[#374151]">{totalBranches}</span> total branches
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 flex-shrink-0">
              <div className="text-center">
                <div style={{ fontWeight: 700, fontSize: 24, lineHeight: 1, color: '#10B981' }}>{masteredCount}</div>
                <div className="text-[11px] font-medium uppercase tracking-[0.8px] text-[#6B7280] mt-1">Mastered</div>
              </div>
              <div className="text-center">
                <div style={{ fontWeight: 700, fontSize: 24, lineHeight: 1, color: '#D4AF37' }}>{exploredPct}%</div>
                <div className="text-[11px] font-medium uppercase tracking-[0.8px] text-[#6B7280] mt-1">Explored</div>
              </div>
            </div>
          </div>

          <div>
            <div className="h-[8px] w-full rounded-[4px] bg-[#F0F0F0] overflow-hidden">
              <div
                className="h-full rounded-[4px]"
                style={{
                  width: `${exploredPct}%`,
                  background: 'linear-gradient(90deg, #D4AF37, #F5C563)',
                  transition: 'width .8s ease',
                }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[12px] text-[#6B7280]">
              <span>0%</span>
              <span className="font-semibold" style={{ color: '#D4AF37' }}>{exploredPct}% complete</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-y-2 mb-1">
          <div className="flex items-center gap-2 bg-[#F0FDF4] px-3 py-1.5 rounded-full border border-[#DCFCE7] mr-4">
            <div className="w-5 h-5 rounded-full bg-[#10B981] flex items-center justify-center">
              <CheckmarkIcon />
            </div>
            <span className="text-[#15803D] text-[14px] font-medium">Subject selected</span>
          </div>
          <div className="h-[1px] w-8 bg-gray-300 mr-4" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#10182D] text-white flex items-center justify-center font-bold text-[14px]">2</div>
            <span className="text-[#111827] font-bold text-[18px]">Choose a Mindmap</span>
          </div>
        </div>
        <p className="text-[#6B7280] text-[14px] mb-8 ml-0 sm:ml-[235px]">Each map covers one key topic with all its branches</p>

        {/* Mindmap list */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-[12px] h-[80px] animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : maps.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No mindmaps found for this subject yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {maps.map((map) => {
              const status = getStatus(map.mastery, map.viewed);
              const statusStyle = statusColors[status];
              return (
                <Link key={map.slug} href={`/dashboard/mindmap/${subjectId}/${map.slug}`} className="block">
                  <div className="bg-white rounded-[12px] p-4 sm:p-6 border border-[#E5E7EB] flex flex-wrap items-center gap-x-4 gap-y-3 shadow-[0_1px_1px_rgba(16,24,40,0.04)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200 hover:bg-indigo-50/30 mb-4">
                    <div className="flex items-center gap-4 grow basis-[180px] min-w-0">
                      <span
                        aria-hidden
                        className="w-12 h-12 rounded-[12px] bg-[#EFF6FF] flex items-center justify-center flex-shrink-0"
                        style={{ fontSize: 22, lineHeight: 1 }}
                      >
                        {getTopicIcon(map.title)}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-[#111827] font-bold text-[16px] mb-1 break-words">{map.title}</h3>
                        <p className="text-[#6B7280] text-[12px]">
                          {map.branchCount} branches
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-6 ml-auto flex-shrink-0">
                      <div className="w-[60px] sm:w-[100px] h-2 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                        <div className="h-full rounded-full" style={{ width: `${map.mastery}%`, backgroundColor: map.mastery === 0 ? 'transparent' : '#10B981' }} />
                      </div>
                      <span className="text-[14px] font-bold text-[#10B981]">{map.mastery}%</span>
                      <span
                        className="px-3 py-1 rounded-[6px] text-[11px] font-semibold min-w-[70px] text-center"
                        style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                      >
                        {status === 'Done' && <span className="mr-1">✓</span>}
                        {status}
                      </span>
                      <span className="w-8 h-8 hidden sm:flex items-center justify-center text-gray-400 hover:text-gray-600">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
