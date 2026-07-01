'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { mindmapService } from '@/lib/services';
import DashboardPageHero from '@/components/DashboardPageHero';
import { UpgradePrompt } from '@/components/entitlements';
import { useEntitlements } from '@/contexts/EntitlementsContext';

const SUBJECT_CARD_STYLES: Record<string, { bg: string; border: string; bar: string }> = {
  'indian-polity': { bg: '#FDF0DE', border: '#C0D9F5', bar: '#E9A12D' },
  'modern-history': { bg: '#FFF8EE', border: '#FFD5A8', bar: '#E8B164' },
  geography: { bg: 'rgba(201, 168, 76, 0.19)', border: '#B2EDD0', bar: '#D5A53C' },
  'indian-economy': { bg: 'linear-gradient(139deg, #F3EFFD 0%, #EDE7FB 100%)', border: '#E8E1FD', bar: '#F16CB0' },
  environment: { bg: 'linear-gradient(139deg, #EDF9F3 0%, #E0F5EA 100%)', border: '#B2EDD0', bar: '#D6A437' },
  'science-and-tech': { bg: 'linear-gradient(139deg, #E0EBF9 0%, #D4E4F7 100%)', border: '#C0D9F5', bar: '#E0A446' },
  'current-affairs': { bg: 'linear-gradient(139deg, #FFF1E8 0%, #FFE6D5 100%)', border: '#FFD1AA', bar: '#F39A3C' },
  'gs-iv-ethics': { bg: 'linear-gradient(139deg, #EEF0FF 0%, #E0E3FF 100%)', border: '#C4C9F8', bar: '#4F46E5' },
};

const SUBJECT_NAMES: Record<string, string> = {
  'indian-polity': 'Polity',
  'modern-history': 'History',
  geography: 'Geography',
  'indian-economy': 'Economy',
  environment: 'Environment',
  'science-and-tech': 'Science & Tech',
  'current-affairs': 'Current Affairs',
  'gs-iv-ethics': 'Ethics',
};

type SubjectData = {
  id: string;
  name: string;
  icon: string;
  slug: string;
  total: number;
  explored: number;
  progress: number;
};

export default function MindmapPage() {
  const entitlements = useEntitlements();
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mindmapService.getSubjects()
      .then((res) => {
        if (res.status === 'success') setSubjects(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalMaps = subjects.reduce((s, sub) => s + sub.total, 0);
  const totalExplored = subjects.reduce((s, sub) => s + sub.explored, 0);

  const mastered = totalExplored;
  const coverage = totalMaps > 0 ? Math.round((totalExplored / totalMaps) * 100) : 0;
  const needReview = Math.max(0, totalMaps - totalExplored);
  const hasFullAccess = entitlements.canAccess('mindmaps', ['full']);
  const previewCount = entitlements.preview.mindmaps ?? subjects.length;
  const visibleSubjects = hasFullAccess ? subjects : subjects.slice(0, previewCount || 0);

  return (
    <div className="min-h-screen font-arimo" style={{ background: '#F9FAFB' }}>

      <DashboardPageHero
        // eslint-disable-next-line @next/next/no-img-element
        badgeIcon={
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/mindmap-badge-icon.png" alt="Mindmaps" style={{ width: 16, height: 16, objectFit: 'contain' }} />
        }
        badgeText="VISUAL LEARNING"
        title={
          <>
            Map Your <em className="not-italic" style={{ color: '#E8B84B', fontStyle: 'italic' }}>Knowledge</em>
            <br />
            with Mindmaps
          </>
        }
        subtitle="See the big picture. Every topic structured as a visual tree, revise faster, remember longer."
        stats={[
          { value: String(totalMaps),      label: 'Total Maps',   color: '#FDC700' },
          { value: String(mastered),        label: 'Mastered',     color: '#4ADE80' },
          { value: coverage + '%',          label: 'Coverage',     color: '#F87171' },
          { value: String(needReview),      label: 'Need Review',  color: '#FFFFFF' },
        ]}
      />

      {/* ── Content section: light background ── */}
      <div
        style={{
          background: '#F5F6FA',
          borderRadius: '28px 28px 0 0',
          marginTop: '-4px',
          paddingTop: 'clamp(24px, 3vw, 40px)',
        }}
      >
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 pb-12">
        {!hasFullAccess && (
          <div className="mb-6 ml-0 sm:ml-11">
            <UpgradePrompt
              title="Mindmaps preview"
              currentTier={entitlements.tier}
              requiredTier="rise"
              message={`Your plan includes ${previewCount || 0} preview mindmap. Upgrade to Rise to unlock the full visual learning library.`}
            />
          </div>
        )}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-[#10182D] text-white flex items-center justify-center font-semibold text-[14px]">1</div>
          <h2 className="text-[36px] font-bold text-[#10182D] font-serif">
            Choose a <span className="italic text-[#E8B84B]">Subject</span>
          </h2>
        </div>
        <p className="text-[#6A7282] text-[14px] mb-6 ml-11">Select the subject whose mindmaps you want to study today</p>
        <style>{`
          .subjhx-card{position:relative;overflow:hidden;border:1px solid var(--subjhx-border);transition:transform .3s cubic-bezier(.4,0,.2,1),box-shadow .3s cubic-bezier(.4,0,.2,1),border-color .3s cubic-bezier(.4,0,.2,1);}
          .subjhx-card:hover{transform:translateY(-3px);box-shadow:0 4px 24px rgba(0,0,0,.08),0 1px 4px rgba(0,0,0,.04);border-color:transparent;}
          .subjhx-accent{position:absolute;top:0;left:0;right:0;height:3px;opacity:0;transition:opacity .3s;z-index:2;}
          .subjhx-card:hover .subjhx-accent{opacity:1;}
        `}</style>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 ml-0 sm:ml-11">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-[190px] animate-pulse rounded-[16px] border border-[#E5E7EB] bg-white" />
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-16 text-gray-400 ml-11">
            <p className="text-lg font-semibold mb-2">No mindmap subjects yet</p>
            <p className="text-sm">Ask an admin to seed some mindmaps to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 ml-0 sm:ml-11">
            {visibleSubjects.map((subject) => {
              const cardStyle = SUBJECT_CARD_STYLES[subject.slug] ?? { bg: '#FFFFFF', border: '#E5E7EB', bar: '#16A34A' };
              const subjectName = SUBJECT_NAMES[subject.slug] ?? subject.name;
              const toGo = Math.max(0, subject.total - subject.explored);
              const progressWidth = subject.total > 0 ? Math.max(subject.progress, 10) : 0;
              return (
                <Link
                  key={subject.slug}
                  href={`/dashboard/mindmap/${subject.slug}`}
                  className="subjhx-card block h-[190px] rounded-[16px] p-5 text-left"
                  style={{ ['--subjhx-border']: cardStyle.border, background: cardStyle.bg } as React.CSSProperties}
                >
                  <div className="subjhx-accent" style={{ background: cardStyle.bar }} />
                  <div className="flex items-start justify-between gap-3">
                    <span aria-hidden style={{ fontSize: 24, lineHeight: '24px' }}>{subject.icon}</span>
                    {toGo > 0 && (
                      <span
                        className="inline-flex flex-shrink-0 items-center rounded-full px-2 py-0.5"
                        style={{ background: '#EF4444', fontFamily: 'Inter', fontWeight: 700, fontSize: 9, lineHeight: '14px', color: '#FFFFFF', whiteSpace: 'nowrap' }}
                      >
                        {toGo} due
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3" style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 17, lineHeight: '22px', color: '#22304D' }}>
                    {subjectName}
                  </h3>

                  <p className="mt-1" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 11, lineHeight: '15px', color: '#8A94A6' }}>
                    {subject.total} cards · {subject.total} topics
                  </p>

                  <div className="mt-4 h-[4px] w-full rounded-full" style={{ background: 'rgba(0,0,0,0.08)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${progressWidth}%`, background: '#16A34A' }}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 12, lineHeight: '16px', color: '#16A34A' }}>
                      ✓ {subject.explored} mastered
                    </span>
                    <span style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 14, lineHeight: '18px', color: toGo === 0 ? '#16A34A' : '#EF4444' }}>
                      {toGo === 0 ? '✓ All done' : `${toGo} to go`}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
