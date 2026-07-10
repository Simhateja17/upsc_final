'use client';

import React, { useEffect, useState } from 'react';
import { mindmapService } from '@/lib/services';
import DashboardPageHero from '@/components/DashboardPageHero';
import MindmapIntroSections from '@/components/MindmapIntroSections';
import { UpgradePrompt } from '@/components/entitlements';
import { useEntitlements } from '@/contexts/EntitlementsContext';
import { getSubjectCardStyle, getSubjectMetaStyle } from '@/lib/subjectPalette';
import SubjectChoiceCard, { SubjectChoiceCardStyles } from '@/components/SubjectChoiceCard';

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
      <div className="w-full max-w-[1120px] mx-auto px-4 sm:px-8 pb-12">
        {!hasFullAccess && (
          <div className="mb-6">
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
        <SubjectChoiceCardStyles />

        {loading ? (
          <div className="subject-card-grid">
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
          <div className="subject-card-grid">
            {visibleSubjects.map((subject) => {
              const subjectName = SUBJECT_NAMES[subject.slug] ?? subject.name;
              const cardStyle = getSubjectCardStyle(subjectName);
              const subjectMeta = getSubjectMetaStyle(subjectName);
              const toGo = Math.max(0, subject.total - subject.explored);
              const progressWidth = subject.total > 0 ? Math.max(subject.progress, 10) : 0;
              return (
                <SubjectChoiceCard
                  key={subject.slug}
                  href={`/dashboard/mindmap/${subject.slug}`}
                  icon={subjectMeta.icon}
                  iconBg={subjectMeta.bg}
                  accentColor={cardStyle.bar}
                  title={subjectName}
                  meta={`${subject.total} cards · ${subject.total} topics`}
                  topRight={toGo > 0 && (
                    <span
                      className="inline-flex flex-shrink-0 items-center rounded-full px-2 py-0.5"
                      style={{ background: '#EF4444', fontFamily: 'Inter', fontWeight: 700, fontSize: 9, lineHeight: '14px', color: '#FFFFFF', whiteSpace: 'nowrap' }}
                    >
                      {toGo} due
                    </span>
                  )}
                  progressPercent={progressWidth}
                  footerLeft={`✓ ${subject.explored} mastered`}
                  footerRight={toGo === 0 ? '✓ All done' : `${toGo} to go`}
                  footerRightColor={toGo === 0 ? '#16A34A' : '#EF4444'}
                />
              );
            })}
          </div>
        )}
      </div>

      <MindmapIntroSections />
      </div>
    </div>
  );
}
