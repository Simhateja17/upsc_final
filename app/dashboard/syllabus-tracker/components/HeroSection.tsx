'use client';

import { Mode, TrackerState, SyllabusData } from '../page';
import DashboardPageHero from '@/components/DashboardPageHero';

interface HeroSectionProps {
  states: TrackerState;
  syllabusData: SyllabusData;
  userName?: string;
  cms?: Record<string, any>;
}

export default function HeroSection({ states, syllabusData, userName, cms }: HeroSectionProps) {
  const badgeText = cms?.hero_badge || 'PERSONALIZED SYLLABUS TRACKER';
  const titlePrefix = cms?.hero_title_prefix || 'Know Exactly Where You Stand,';
  const titleSuffix = cms?.hero_title_suffix || '.';
  const subtitle = cms?.hero_subtitle || "Your UPSC syllabus, fully mapped. Track every topic across Prelims, Mains and Optional — see what's done, what's pending, and what to conquer next.";
  const statLabels = (() => { try { return JSON.parse(cms?.stat_labels || '{}'); } catch { return {}; } })();
  const calculateModeStats = (modeKey: Mode) => {
    const subjects = syllabusData[modeKey];
    let total = 0;
    let done = 0;
    let revision = 0;

    subjects.forEach((subject) => {
      subject.topics.forEach((topic, ti) => {
        topic.subs.forEach((_, si) => {
          total++;
          const key = `${subject.id}__${ti}__${si}`;
          const status = states[key]?.status || 'none';
          if (status === 'done') done++;
          if (status === 'needs-revision') revision++;
        });
      });
    });

    return { total, done, revision };
  };

  const prelimsStats = calculateModeStats('prelims');
  const mainsStats = calculateModeStats('mains');
  const optionalStats = calculateModeStats('optional');

  const allTotal = prelimsStats.total + mainsStats.total + optionalStats.total;
  const allDone = prelimsStats.done + mainsStats.done + optionalStats.done;
  const allRevision = prelimsStats.revision + mainsStats.revision + optionalStats.revision;
  const overallPct = allTotal > 0 ? Math.round((allDone / allTotal) * 100) : 0;

  return (
    <DashboardPageHero
      badgeIcon={<img src="/cap.png" alt="cap" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />}
      badgeText={badgeText}
      heroBorderRadius={16}
      heroHeight="auto"
      heroMarginInline={0}
      title={
        <>
          {titlePrefix}{' '}
          <em style={{ color: '#e8a820', fontStyle: 'italic' }}>{userName || 'Aspirant'}</em>
          {titleSuffix}
        </>
      }
      subtitle={subtitle}
      stats={[
        { value: `${overallPct}%`, label: statLabels.overall || 'Overall',   color: '#F5A623' },
        { value: String(allDone),  label: statLabels.done || 'Done',      color: '#FF7070' },
        { value: String(allRevision), label: statLabels.revising || 'Revising', color: '#FFFFFF' },
        { value: String(Math.max(allTotal - allDone, 0)), label: statLabels.remaining || 'Remaining', color: '#0E8A56' },
      ]}
    />
  );
}
