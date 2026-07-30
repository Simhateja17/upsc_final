'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { mindmapService } from '@/lib/services';
import { getTopicIcon } from '@/lib/topic-icons';

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
    <div className="min-h-screen bg-[#FAFBFE] font-inter">
      <div className="w-full max-w-[960px] mx-auto px-6 py-6">
        <Link href="/dashboard/mindmap" className="inline-flex items-center text-[#6B7280] text-[13px] hover:text-[#111827] mb-6">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
            <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Subjects
        </Link>

        {/* Subject summary card */}
        {loading ? (
          <div className="w-full rounded-[12px] h-[120px] animate-pulse mb-6" style={{ background: '#F0F2F5', border: '0.8px solid #E5E7EB' }} />
        ) : (
          <div
            className="w-full rounded-[12px] px-6 py-4 mb-6"
            style={{ border: '0.8px solid #E2E5ED', background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
          >
            <div className="flex items-center gap-5">
              <span
                className="flex items-center justify-center flex-shrink-0"
                aria-hidden
                style={{ width: 56, height: 56, borderRadius: 16, background: '#EFF6FF', fontSize: 30, lineHeight: 1 }}
              >
                {subjectMeta?.icon ?? '🗺️'}
              </span>
              <div className="flex-1 min-w-0">
                <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 22, lineHeight: '28px', color: '#101828' }}>
                  {subjectTitle}
                </h1>
                <p style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 13, color: '#6A7282', marginTop: 2 }}>
                  {maps.length} mindmaps · {totalBranches} total branches
                </p>
              </div>
              {/* Stats */}
              <div className="hidden sm:flex items-center gap-6 flex-shrink-0">
                <div className="text-center">
                  <div style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 20, color: '#16A34A' }}>{masteredCount}</div>
                  <div style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.5px', textTransform: 'uppercase', marginTop: 2 }}>Mastered</div>
                </div>
                <div className="text-center">
                  <div style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 20, color: '#2563EB' }}>{exploredPct}%</div>
                  <div style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.5px', textTransform: 'uppercase', marginTop: 2 }}>Explored</div>
                </div>
              </div>
            </div>

            {/* Completion progress bar - inside the card */}
            <div style={{ marginTop: 16 }}>
              <div style={{ height: 8, borderRadius: 999, background: '#ECEEF2', overflow: 'hidden' }}>
                <div style={{ width: `${exploredPct}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #F0B429, #E8B84B)', transition: 'width .6s ease' }} />
              </div>
              <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
                <span style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, color: '#9CA3AF' }}>0%</span>
                <span style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 12, color: '#CA8A04' }}>{exploredPct}% complete</span>
                <span style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, color: '#9CA3AF' }}>100%</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: '#101828', fontFamily: 'Inter', fontWeight: 600, fontSize: 14, lineHeight: '20px', color: '#FFFFFF' }}
          >
            2
          </div>
          <h2 style={{ fontFamily: 'Georgia', fontWeight: 700, fontSize: 36, lineHeight: '40px', color: '#101828' }}>
            Choose a <span style={{ fontStyle: 'italic', color: '#E8B84B' }}>Mindmap</span>
          </h2>
        </div>
        <p className="text-[#6B7280] text-[14px] mb-8 ml-11">Each map covers one key topic with all its branches</p>

        {/* Mindmap list */}
        {loading ? (
          <div className="space-y-2 mb-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-[8px] h-[68px] animate-pulse" style={{ background: '#F0F2F5', border: '0.8px solid #E5E7EB' }} />
            ))}
          </div>
        ) : maps.length === 0 ? (
          <div className="text-center py-12 text-gray-400 mb-6">
            <p>No mindmaps found for this subject yet.</p>
          </div>
        ) : (
          <div className="space-y-2 mb-6">
            {maps.map((map) => {
              const status = getStatus(map.mastery, map.viewed);
              const statusStyle = statusColors[status];
              return (
                <Link key={map.slug} href={`/dashboard/mindmap/${subjectId}/${map.slug}`} className="block">
                  <div
                    className="flex items-center rounded-[8px] overflow-hidden border border-gray-200 transition-all duration-200 ease-out cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200 hover:bg-indigo-50/30"
                    style={{ background: '#FFFFFF', minHeight: 68 }}
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0 flex items-center justify-center mx-4" style={{ width: 40, height: 40, borderRadius: 12, background: '#EFF6FF', fontSize: 20 }}>
                      {getTopicIcon(map.title)}
                    </div>

                    {/* Name + meta */}
                    <div className="flex-1 min-w-0 py-4 pr-4">
                      <h3 className="truncate" title={map.title} style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 14, lineHeight: '20px', color: '#101828' }}>
                        {map.title}
                      </h3>
                      <p style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                        {map.branchCount} branches
                      </p>
                    </div>

                    {/* Progress + % + status + arrow */}
                    <div className="flex items-center gap-3 flex-shrink-0 pr-5">
                      <div className="rounded-full overflow-hidden hidden sm:block" style={{ width: 110, height: 5, background: '#F1F3F5' }}>
                        <div className="h-full rounded-full" style={{ width: `${map.mastery}%`, background: '#10B981', maxWidth: '100%' }} />
                      </div>
                      <span style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 14, color: '#10B981', minWidth: 38, textAlign: 'right' }}>
                        {map.mastery}%
                      </span>
                      <span
                        className="px-3 py-1 rounded-[6px] text-[11px] font-semibold min-w-[70px] text-center hidden sm:block"
                        style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                      >
                        {status === 'Done' && <span className="mr-1">✓</span>}
                        {status}
                      </span>
                      <span style={{ color: '#000000', fontSize: 17, fontWeight: 800 }} aria-hidden>›</span>
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
