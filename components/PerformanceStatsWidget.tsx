'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { dashboardService, testSeriesService, leaderboardService } from '@/lib/services';
import { BADGE_DISPLAY } from '@/lib/badgeDisplay';

interface PerformanceData {
  studyTimeToday?: string;
  testsTaken?: number;
  rank?: number;
  rankPercentile?: number;
  jeetCoins?: number;
  syllabusCoverage?: number;
  mcq?: { totalAttempts?: number };
  mains?: { totalAttempts?: number };
}

interface StreakData {
  currentStreak?: number;
  weekDays?: boolean[];
  longestStreak?: number;
  streakLabel?: string;
}

type BadgeState = 'earned' | 'in-progress' | 'locked';

interface AchievementBadge {
  key: string;
  title: string;
  status: BadgeState;
  emoji: string;
}

// Shape returned by GET /user/achievements (real 54-badge engine).
interface BadgeData {
  key: string;
  status: 'earned' | 'locked';
  supported: boolean;
}

// Activities shown in the "How streak works?" drawer — completing any one keeps the streak alive.
const STREAK_ACTIVITIES: { emoji: string; title: string; desc: string; tint: string; tone: string }[] = [
  { emoji: '🎯', title: 'Daily 10 MCQs', desc: 'Attempt the daily objective quiz.', tint: '#FFF1DC', tone: '#E48A00' },
  { emoji: '✍️', title: 'Daily Answer Writing', desc: 'Submit one structured answer.', tint: '#EAF2FF', tone: '#3459E6' },
  { emoji: '📰', title: 'Daily News Analysis', desc: 'Read and complete the current affairs analysis.', tint: '#FFF0F0', tone: '#C83333' },
  { emoji: '🗓️', title: 'Finish today’s study tasks', desc: 'Complete the tasks planned for today.', tint: '#EAFFF3', tone: '#0DA95E' },
  { emoji: '⏱️', title: 'Study Minimum 3 hours a day', desc: 'Log at least three focused study hours.', tint: '#F3EFFF', tone: '#7447DB' },
  { emoji: '📝', title: 'Attempt any one Mock Test', desc: 'Take a full-length or sectional mock.', tint: '#EAFFF3', tone: '#0DA95E' },
];

const PerformanceStatsWidget = () => {
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  // Upcoming Test card is shown only to users who have purchased a test series.
  const [hasPurchasedTestSeries, setHasPurchasedTestSeries] = useState(false);
  const [weeklyRank, setWeeklyRank] = useState<number | null>(null);
  const [badges, setBadges] = useState<BadgeData[] | null>(null);
  // "How streak works?" slide-out drawer (opened via the chevron beside the heading).
  const [streakDrawerOpen, setStreakDrawerOpen] = useState(false);

  // Close the drawer on Escape and lock background scroll while it's open.
  useEffect(() => {
    if (!streakDrawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setStreakDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [streakDrawerOpen]);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      try {
        const [perfRes, streakRes, enrolledRes, weeklyRankRes, badgesRes] = await Promise.allSettled([
          dashboardService.getPerformance(),
          dashboardService.getStreak(),
          testSeriesService.getEnrolled(),
          leaderboardService.getMyRank('week'),
          dashboardService.getAchievements(),
        ]);
        if (mounted) {
          if (perfRes.status === 'fulfilled' && perfRes.value?.data) {
            setPerformance(perfRes.value.data);
          }
          if (streakRes.status === 'fulfilled' && streakRes.value?.data) {
            setStreak(streakRes.value.data);
          }
          if (enrolledRes.status === 'fulfilled') {
            const enrolled = enrolledRes.value?.data;
            setHasPurchasedTestSeries(Array.isArray(enrolled) && enrolled.length > 0);
          }
          if (weeklyRankRes.status === 'fulfilled' && weeklyRankRes.value?.data) {
            setWeeklyRank(weeklyRankRes.value.data.rank ?? null);
          }
          if (badgesRes.status === 'fulfilled' && badgesRes.value?.data?.badges) {
            setBadges(badgesRes.value.data.badges);
          }
        }
      } catch {
        // Graceful degradation
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchData();
    return () => { mounted = false; };
  }, []);

  // Display values – null/undefined when API hasn't returned data
  const currentStreak = streak?.currentStreak ?? (loading ? null : 0);
  const weekDays = streak?.weekDays ?? [false, false, false, false, false, false, false];
  const streakLabel = streak?.streakLabel ?? '';
  const syllabusCoverage = performance?.syllabusCoverage ?? (loading ? null : 0);
  const studyTimeToday = performance?.studyTimeToday ?? (loading ? null : '0h 0m');
  const testsTaken = performance?.testsTaken ?? (loading ? null : 0);
  const rank = performance?.rank ?? null;
  const mcqsAttempted = performance?.mcq?.totalAttempts ?? (loading ? null : 0);
  const mainsWritten = performance?.mains?.totalAttempts ?? (loading ? null : 0);

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const showOnFire = (currentStreak ?? 0) > 7;
  // Map the real badge engine's response onto display metadata; drop any key we
  // don't have display metadata for (keeps the widget resilient to catalog drift).
  const achievementBadges: AchievementBadge[] = (badges ?? [])
    .filter((b) => BADGE_DISPLAY[b.key])
    .map((b) => ({
      key: b.key,
      title: BADGE_DISPLAY[b.key].title,
      emoji: BADGE_DISPLAY[b.key].emoji,
      status: b.status,
    }));
  // Showcase: earned badges first (in catalog order), then still-earnable
  // (supported) locked badges as aspirational targets. Array.prototype.sort is
  // stable, so catalog order is preserved within each group.
  const supportedByKey = new Map((badges ?? []).map((b) => [b.key, b.supported]));
  const badgeOrderRank = (badge: AchievementBadge) => {
    if (badge.status === 'earned') return 0;
    return supportedByKey.get(badge.key) ? 1 : 2;
  };
  const orderedBadges = [...achievementBadges].sort(
    (a, b) => badgeOrderRank(a) - badgeOrderRank(b)
  );
  const sectionTitleStyle: React.CSSProperties = {
    fontWeight: 700,
    fontSize: 'clamp(16px,1.04vw,20px)',
    lineHeight: '1.2',
    letterSpacing: '0px',
  };

  return (
    <div className="w-full space-y-[clamp(12px,0.83vw,16px)]">
      {/* Performance Stats Card */}
      <div
        className="rounded-[clamp(16px,1.04vw,20px)]"
        style={{
          background: '#ffffff',
          border: '0.8px solid #E5E7EB',
          boxShadow: '0px 4px 12px 0px #00000026',
          padding: 'clamp(20px,1.29vw,24.8px) clamp(20px,1.25vw,24px)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-[clamp(6px,0.42vw,8px)] mb-[clamp(16px,1.04vw,20px)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/dashboard/perf-header.png"
            alt="Performance Stats"
            className="w-[clamp(18px,1.25vw,24px)] h-[clamp(18px,1.25vw,24px)]"
          />
          <h2
            className="font-arimo text-[#101828]"
            style={{ ...sectionTitleStyle, whiteSpace: 'nowrap' }}
          >
            Your Performance Stats
          </h2>
          <button
            type="button"
            onClick={() => setStreakDrawerOpen(true)}
            aria-label="How streak works"
            aria-expanded={streakDrawerOpen}
            title="How streak works"
            className="ml-auto flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-[#171B2A] hover:text-black hover:translate-x-0.5 transition-transform"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A1172]"></div>
          </div>
        ) : (
          <>
            {/* Day Study Streak */}
            <div className="flex items-start justify-between mb-[clamp(12px,0.83vw,16px)]">
              <div>
                <div className="font-outfit font-bold text-[#0A1172] leading-none" style={{ fontSize: 'clamp(36px,2.19vw,42px)' }}>
                  {currentStreak ?? 0}
                </div>
                <p className="font-arimo font-bold text-[#0A1172] mt-[clamp(4px,0.31vw,6px)]" style={{ fontSize: 'clamp(13px,0.83vw,16px)', lineHeight: '1.2' }}>
                  Day Study Streak
                </p>
              </div>
              {showOnFire ? (
                <div
                  className="rounded-full flex items-center gap-[clamp(4px,0.31vw,6px)]"
                  style={{
                    background: '#D1FAE5',
                    padding: 'clamp(6px,0.42vw,8px) clamp(12px,0.83vw,16px)',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/fire-icon-green.svg"
                    alt="On Fire"
                    className="w-[clamp(16px,1.04vw,20px)] h-[clamp(16px,1.04vw,20px)]"
                    style={{ objectFit: 'contain' }}
                  />
                  <span className="font-inter font-semibold text-green-700" style={{ fontSize: 'clamp(12px,0.83vw,16px)' }}>
                    {streakLabel || 'On Fire!'}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Week Days — completed day shows a golden box with a dark tick; others are grey with their letter */}
            <div className="flex gap-[clamp(4px,0.31vw,6px)] mb-[clamp(16px,1.04vw,20px)]">
              {dayLabels.map((day, index) => (
                <div
                  key={index}
                  className="flex-1 aspect-square rounded-lg flex items-center justify-center font-inter font-semibold border"
                  style={
                    weekDays[index]
                      ? { background: 'linear-gradient(180deg,#ffd24a,#f5b400)', borderColor: '#E5E7EB' }
                      : { background: '#EEF0F5', borderColor: '#E5E7EB' }
                  }
                >
                  {weekDays[index] ? (
                    <svg className="w-[55%] h-[55%]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M5 13l4 4L19 7" stroke="#1A1407" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <span className="text-[#6B7280]" style={{ fontSize: 'clamp(11px,0.68vw,13px)' }}>
                      {day}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Syllabus Coverage */}
            <div className="mb-[clamp(12px,0.83vw,16px)]">
              <div className="flex items-center justify-between mb-[clamp(6px,0.42vw,8px)]">
                <span className="font-arimo font-bold text-[#0A1172]" style={{ fontSize: 'clamp(12px,0.73vw,14px)' }}>
                  Syllabus Coverage
                </span>
                <span className="font-arimo font-bold text-[#0A1172]" style={{ fontSize: 'clamp(13px,0.83vw,16px)' }}>
                  {syllabusCoverage !== null ? `${syllabusCoverage}%` : '--'}
                </span>
              </div>
              <div className="w-full rounded-full overflow-hidden" style={{ height: 'clamp(6px,0.42vw,8px)', background: '#E5E7EB' }}>
                <div
                  className="h-full bg-[#0A1172] rounded-full transition-all duration-300"
                  style={{ width: `${syllabusCoverage ?? 0}%` }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-[clamp(10px,0.73vw,14px)]">
              {/* Today's Study Time */}
              <div
                className="rounded-[14px] flex flex-col justify-center"
                style={{
                  background: '#EEF2FF',
                  padding: '16px 12px',
                }}
              >
                <span style={{ fontSize: '22px', lineHeight: '1', marginBottom: '8px' }}>⏱️</span>
                <div className="font-outfit font-bold text-[#17223E] leading-none" style={{ fontSize: '20px', marginBottom: '6px' }}>
                  {studyTimeToday ?? '--'}
                </div>
                <p className="font-arimo text-[#6B7280]" style={{ fontSize: '11px', lineHeight: '1.3' }}>
                  Today's Study Time
                </p>
              </div>

              {/* Rank */}
              <div
                className="rounded-[14px] flex flex-col justify-center"
                style={{
                  background: '#EEF2FF',
                  padding: '16px 12px',
                }}
              >
                <span style={{ fontSize: '22px', lineHeight: '1', marginBottom: '8px' }}>🏆</span>
                <div className="font-outfit font-bold text-[#17223E] leading-none" style={{ fontSize: '20px', marginBottom: '6px' }}>
                  {rank !== null ? `#${rank}` : '--'}
                </div>
                <p className="font-arimo text-[#6B7280]" style={{ fontSize: '11px', lineHeight: '1.3' }}>
                  Rank
                </p>
              </div>

              {/* MCQs Attempted */}
              <div
                className="rounded-[14px] flex flex-col justify-center"
                style={{
                  background: '#EEF2FF',
                  padding: '16px 12px',
                }}
              >
                <span style={{ fontSize: '22px', lineHeight: '1', marginBottom: '8px' }}>🎯</span>
                <div className="font-outfit font-bold text-[#17223E] leading-none" style={{ fontSize: '20px', marginBottom: '6px' }}>
                  {mcqsAttempted ?? '--'}
                </div>
                <p className="font-arimo text-[#6B7280]" style={{ fontSize: '11px', lineHeight: '1.3' }}>
                  MCQs Attempted
                </p>
              </div>

              {/* Answers Written */}
              <div
                className="rounded-[14px] flex flex-col justify-center"
                style={{
                  background: '#EEF2FF',
                  padding: '16px 12px',
                }}
              >
                <span style={{ fontSize: '22px', lineHeight: '1', marginBottom: '8px' }}>✍️</span>
                <div className="font-outfit font-bold text-[#17223E] leading-none" style={{ fontSize: '20px', marginBottom: '6px' }}>
                  {mainsWritten ?? '--'}
                </div>
                <p className="font-arimo text-[#6B7280]" style={{ fontSize: '11px', lineHeight: '1.3' }}>
                  Answers Written
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Weekly Leaderboard */}
      <Link
        href="/dashboard/leaderboard"
        className="cursor-pointer hover:shadow-md transition-shadow flex items-center justify-center text-left"
        style={{
          background: '#74A0FF30',
          minHeight: '50px',
          borderRadius: '16px',
          padding: '8px 12px',
        }}
      >
        <div className="flex items-center justify-center" style={{ gap: '8px', minWidth: 0, width: '100%' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/add-icon.png" alt="" aria-hidden="true" style={{ width: '18px', height: '18px', objectFit: 'contain', flexShrink: 0 }} />
          <span
            className="font-outfit font-semibold text-left"
            style={{
              fontSize: 'clamp(13px,1.1vw,18px)',
              lineHeight: '1.3',
              color: '#1E2875',
              minWidth: 0,
              flex: '0 1 auto',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
            }}
          >
            Weekly Leaderboard
          </span>
          <svg style={{ width: '18px', height: '18px', flexShrink: 0 }} viewBox="0 0 24 24" fill="none">
            <path d="M4 12h16M14 6l6 6-6 6" stroke="#1E2875" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </Link>

      {/* Achievement Badges */}
      <div
        className="rounded-[clamp(16px,1.04vw,20px)]"
        style={{
          border: '0.8px solid #E5E7EB',
          boxShadow: '0px 4px 12px 0px #00000026',
          padding: 'clamp(20px,1.29vw,24.8px) clamp(20px,1.25vw,24px)',
        }}
      >
        <div className="flex items-center justify-between gap-3 mb-[clamp(16px,1.25vw,24px)]">
          <div className="flex items-center gap-[clamp(6px,0.42vw,8px)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ach.png"
              alt="Achievement Badges"
              className="w-[clamp(18px,1.25vw,24px)] h-[clamp(18px,1.25vw,24px)]"
            />
            <h3 className="font-arimo text-[#101828] whitespace-nowrap" style={sectionTitleStyle}>
              Achievement Badges
            </h3>
          </div>
          <Link href="/dashboard/achievement-badges" className="font-inter font-semibold text-[12px] text-[#1E2875] hover:underline whitespace-nowrap flex-shrink-0">
            All →
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-[clamp(8px,0.52vw,12px)]">
          {orderedBadges.slice(0, 3).map((badge) => {
            const isEarned = badge.status === 'earned';
            return (
              <div
                key={badge.key}
                className="rounded-[0.85rem] border text-center transition-all"
                style={{
                  borderColor: isEarned ? '#F0E4B8' : '#EBEDF2',
                  background: isEarned ? '#FFFDF5' : '#F5F6F8',
                  padding: 'clamp(10px,0.85vw,14px) clamp(4px,0.5vw,8px)',
                }}
              >
                <div
                  className="leading-none"
                  style={{
                    fontSize: 'clamp(20px,1.5vw,28px)',
                    filter: isEarned ? 'none' : 'grayscale(1)',
                    opacity: isEarned ? 1 : 0.3,
                  }}
                >
                  {badge.emoji}
                </div>
                <p
                  className="font-semibold mt-1"
                  style={{
                    fontSize: 'clamp(10px,0.63vw,12px)',
                    lineHeight: '1.25',
                    color: isEarned ? '#1A1A1A' : '#B0B5C0',
                  }}
                >
                  {badge.title}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Smart Revision Tools */}
      <div
        className="rounded-[clamp(16px,1.04vw,20px)]"
        style={{
          border: '0.8px solid #E5E7EB',
          boxShadow: '0px 4px 12px 0px #00000026',
          padding: 'clamp(20px,1.29vw,24.8px) clamp(20px,1.25vw,24px)',
        }}
      >
        <div className="flex items-center gap-[clamp(6px,0.42vw,8px)] mb-[clamp(16px,1.04vw,20px)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/dashboard/target-sm.png"
            alt="Smart Revision Tools"
            className="w-[clamp(18px,1.25vw,24px)] h-[clamp(18px,1.25vw,24px)]"
          />
          <h3 className="font-arimo text-[#101828]" style={sectionTitleStyle}>
            Smart Revision Tools
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-[clamp(12px,0.83vw,16px)]">
          <Link
            href="/dashboard/flashcards"
            className="border border-[#E5E7EB] bg-white rounded-[clamp(12px,0.73vw,14px)] hover:border-[#17223E] hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col items-center gap-[clamp(8px,0.63vw,12px)]"
            style={{
              padding: 'clamp(12px,0.83vw,16px)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/flashcards.svg"
              alt="Flashcards"
              style={{ width: 'clamp(32px,2.08vw,40px)', height: 'auto' }}
            />
            <p className="font-arimo font-bold text-[#101828]" style={{ fontSize: 'clamp(12px,0.73vw,14px)', lineHeight: '1.43' }}>Flashcards</p>
          </Link>
          <Link
            href="/dashboard/spaced-repetition"
            className="border border-[#E5E7EB] bg-white rounded-[clamp(12px,0.73vw,14px)] hover:border-[#17223E] hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col items-center gap-[clamp(8px,0.63vw,12px)]"
            style={{
              padding: 'clamp(12px,0.83vw,16px)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/list-fail.png"
              alt="Wrong Attempts"
              style={{ width: 'clamp(32px,2.08vw,40px)', height: 'auto' }}
            />
            <p className="font-arimo font-bold text-[#101828] whitespace-nowrap" style={{ fontSize: 'clamp(12px,0.73vw,14px)', lineHeight: '1.43' }}>Wrong Attempts</p>
          </Link>
          <Link
            href="/dashboard/mindmap"
            className="border border-[#E5E7EB] bg-white rounded-[clamp(12px,0.73vw,14px)] hover:border-[#17223E] hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col items-center gap-[clamp(8px,0.63vw,12px)]"
            style={{
              padding: 'clamp(12px,0.83vw,16px)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/dashboard/brain.png"
              alt="Mindmaps"
              style={{ width: 'clamp(32px,2.08vw,40px)', height: 'auto' }}
            />
            <p className="font-arimo font-bold text-[#101828]" style={{ fontSize: 'clamp(12px,0.73vw,14px)', lineHeight: '1.43' }}>Mindmaps</p>
          </Link>
          <Link
            href="/dashboard/saved-notes"
            className="border border-[#E5E7EB] bg-white rounded-[clamp(12px,0.73vw,14px)] hover:border-[#17223E] hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col items-center gap-[clamp(8px,0.63vw,12px)]"
            style={{
              padding: 'clamp(12px,0.83vw,16px)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/newspaper-folding.svg"
              alt="Smart Notes"
              style={{ width: 'clamp(32px,2.08vw,40px)', height: 'auto' }}
            />
            <p className="font-arimo font-bold text-[#101828]" style={{ fontSize: 'clamp(12px,0.73vw,14px)', lineHeight: '1.43' }}>Smart Notes</p>
          </Link>
        </div>
      </div>

      {/* Quick Tools */}
      <div
        className="rounded-[clamp(16px,1.04vw,20px)]"
        style={{
          border: '0.8px solid #E5E7EB',
          boxShadow: '0px 4px 12px 0px #00000026',
          padding: 'clamp(20px,1.29vw,24.8px) clamp(20px,1.25vw,24px)',
        }}
      >
        <div className="flex items-center gap-[clamp(6px,0.42vw,8px)] mb-[clamp(16px,1.04vw,20px)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/dashboard/settings.png"
            alt="Quick Tools"
            className="w-[clamp(18px,1.25vw,24px)] h-[clamp(18px,1.25vw,24px)]"
          />
          <h3 className="font-arimo text-[#101828]" style={sectionTitleStyle}>
            Quick Tools
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-[clamp(12px,0.83vw,16px)]">
          <Link href="/dashboard/library" className="flex flex-col items-center gap-[clamp(6px,0.42vw,8px)] group p-2 rounded-lg border border-transparent transition-colors hover:bg-[#F3F5FB] hover:border-[#E5E7EB]">
            <div
              className="rounded-full flex items-center justify-center transition-colors"
              style={{
                width: 'clamp(48px,2.92vw,56px)',
                height: 'clamp(48px,2.92vw,56px)',
                background: '#F1F5F9',
              }}
            >
              <svg className="w-[clamp(18px,1.15vw,22px)] h-[clamp(18px,1.15vw,22px)] text-[#64748B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v12"/>
                <path d="M8 11l4 4 4-4"/>
                <path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2"/>
              </svg>
            </div>
            <p className="font-arimo font-bold text-[#0A1172] text-center" style={{ fontSize: 'clamp(11px,0.68vw,13px)', lineHeight: '1.25' }}>Downloads</p>
          </Link>
          <Link href="/dashboard/profile" className="flex flex-col items-center gap-[clamp(6px,0.42vw,8px)] group p-2 rounded-lg border border-transparent transition-colors hover:bg-[#F3F5FB] hover:border-[#E5E7EB]">
            <div
              className="rounded-full flex items-center justify-center transition-colors"
              style={{
                width: 'clamp(48px,2.92vw,56px)',
                height: 'clamp(48px,2.92vw,56px)',
                background: '#F1F5F9',
              }}
            >
              <svg className="w-[clamp(18px,1.15vw,22px)] h-[clamp(18px,1.15vw,22px)] text-[#64748B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-3.31 3.58-6 8-6s8 2.69 8 6"/>
              </svg>
            </div>
            <p className="font-arimo font-bold text-[#0A1172] text-center" style={{ fontSize: 'clamp(11px,0.68vw,13px)', lineHeight: '1.25' }}>Profile</p>
          </Link>
          <Link href="/dashboard/settings" className="flex flex-col items-center gap-[clamp(6px,0.42vw,8px)] group p-2 rounded-lg border border-transparent transition-colors hover:bg-[#F3F5FB] hover:border-[#E5E7EB]">
            <div
              className="rounded-full flex items-center justify-center transition-colors"
              style={{
                width: 'clamp(48px,2.92vw,56px)',
                height: 'clamp(48px,2.92vw,56px)',
                background: '#F1F5F9',
              }}
            >
              <svg className="w-[clamp(18px,1.15vw,22px)] h-[clamp(18px,1.15vw,22px)] text-[#64748B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </div>
            <p className="font-arimo font-bold text-[#0A1172] text-center" style={{ fontSize: 'clamp(11px,0.68vw,13px)', lineHeight: '1.25' }}>All Settings</p>
          </Link>
        </div>
      </div>

      {/* Upcoming Test — only shown to users who purchased a test series */}
      {hasPurchasedTestSeries && (
      <div
        className="rounded-[clamp(16px,1.04vw,20px)] overflow-hidden"
        style={{
          background: 'linear-gradient(179.87deg, #0E182D 0.11%, #17223E 97.85%)',
          padding: 'clamp(20px,1.46vw,28px) clamp(20px,1.25vw,24px)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 3px 10px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)',
        }}
      >
        <div className="flex items-center gap-[clamp(8px,0.52vw,10px)] mb-[clamp(12px,0.83vw,16px)]">
          <svg
            className="w-[clamp(28px,1.82vw,35px)] h-[clamp(28px,1.82vw,35px)]"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Calendar"
          >
            <rect x="3.5" y="4.5" width="17" height="16" rx="2.5" stroke="white" strokeWidth="2" />
            <path d="M8 2.5V6.5M16 2.5V6.5M3.5 9.5H20.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <path d="M7.5 13H10.5M13.5 13H16.5M7.5 16.5H10.5M13.5 16.5H16.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <h3 className="font-inter font-bold text-white" style={{ fontSize: 'clamp(18px,1.35vw,26px)', lineHeight: '1.2' }}>
            Upcoming Test
          </h3>
        </div>
                <div className="flex items-center justify-between mb-[clamp(12px,0.83vw,16px)]">
          <p className="font-inter text-white" style={{ fontSize: 'clamp(12px,0.73vw,14px)', lineHeight: '1.2' }}>
            Daily practice is ready
          </p>
          <p className="font-inter text-white" style={{ fontSize: 'clamp(12px,0.73vw,14px)', lineHeight: '1.2' }}>
            Today
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/dashboard/daily-mcq"
            className="rounded-[clamp(8px,0.52vw,10px)] bg-white hover:bg-gray-100 transition-colors cursor-pointer flex items-center justify-center"
            style={{ height: 'clamp(30px,1.9vw,36px)' }}
          >
            <span className="font-inter font-semibold text-[#0E182D]" style={{ fontSize: 'clamp(12px,0.73vw,14px)', lineHeight: '1.2' }}>
              Daily MCQ
            </span>
          </Link>
          <Link
            href="/dashboard/daily-answer"
            className="rounded-[clamp(8px,0.52vw,10px)] bg-[#FFD170] hover:bg-[#F5C75D] transition-colors cursor-pointer flex items-center justify-center"
            style={{ height: 'clamp(30px,1.9vw,36px)' }}
          >
            <span className="font-inter font-semibold text-[#0E182D]" style={{ fontSize: 'clamp(12px,0.73vw,14px)', lineHeight: '1.2' }}>
              Daily Mains
            </span>
          </Link>
        </div>
        <p className="mt-2 text-center text-[11px] text-white/70"></p>
      </div>
      )}

      {/* "How streak works?" slide-out drawer */}
      {/* Backdrop */}
      <div
        onClick={() => setStreakDrawerOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-[60] transition-opacity duration-300 ${
          streakDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ background: 'rgba(8, 13, 28, 0.24)' }}
      />
      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="How streak works"
        aria-hidden={!streakDrawerOpen}
        className="fixed top-0 right-0 z-[70] h-screen flex flex-col p-6 overflow-y-auto border-l border-[#E5EAF4]"
        style={{
          width: 'min(420px, calc(100vw - 22px))',
          background:
            'radial-gradient(circle at 80% 4%, rgba(255, 191, 46, 0.2), transparent 34%), linear-gradient(180deg, #ffffff 0%, #f8faff 100%)',
          boxShadow: '-28px 0 70px rgba(10, 17, 35, 0.18)',
          transform: streakDrawerOpen ? 'translateX(0)' : 'translateX(104%)',
          transition: 'transform 0.42s cubic-bezier(0.22, 0.9, 0.25, 1)',
        }}
      >
        <div className="w-[42px] h-[5px] rounded-full mb-5" style={{ background: '#FFBF2E' }} />

        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="m-0 font-outfit font-extrabold text-[#171B2A]" style={{ fontSize: '28px', letterSpacing: '-0.055em' }}>
              How streak works?
            </h2>
            <p className="mt-2 mb-0 text-[#626C80]" style={{ lineHeight: 1.5 }}>
              Complete <b style={{ color: '#D39A12' }}>any one</b> daily activity to keep your preparation streak alive.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStreakDrawerOpen(false)}
            aria-label="Close streak panel"
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-[#20263A] text-2xl leading-none hover:bg-[#E6EBF5] transition-colors"
            style={{ background: '#F0F3FA' }}
          >
            ×
          </button>
        </div>

        <section
          className="rounded-[20px] p-[18px]"
          style={{ background: '#ffffff', border: '1px solid #E8EDF6', boxShadow: '0 14px 35px rgba(15, 23, 42, 0.07)' }}
        >
          <p className="mt-0 mb-[14px] font-black uppercase text-[#7B8497]" style={{ fontSize: '12px', letterSpacing: '0.12em' }}>
            Streak qualifying activities
          </p>
          <div className="grid gap-[10px]">
            {STREAK_ACTIVITIES.map((a) => (
              <div
                key={a.title}
                className="grid items-center gap-3 rounded-[16px] p-3 border border-transparent transition-all hover:-translate-x-1 hover:bg-[#FFFAF0] hover:border-[rgba(255,191,46,0.55)]"
                style={{ gridTemplateColumns: '38px 1fr', minHeight: '58px', background: '#F7F9FD' }}
              >
                <div
                  className="w-[38px] h-[38px] rounded-[13px] flex items-center justify-center text-lg"
                  style={{ background: a.tint, color: a.tone }}
                >
                  {a.emoji}
                </div>
                <div>
                  <b className="block text-[15px] text-[#171B2A]" style={{ letterSpacing: '-0.02em' }}>
                    {a.title}
                  </b>
                  <span className="text-[#737D92] text-[12px]" style={{ lineHeight: 1.35 }}>
                    {a.desc}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div
            className="mt-[14px] p-[14px] rounded-[16px] text-[13px]"
            style={{ color: '#65501A', background: '#FFF5D8', border: '1px solid #FFE0A1', lineHeight: 1.45 }}
          >
            <b>Simple rule:</b> Complete any one activity daily to keep your streak alive.
          </div>
        </section>
      </aside>
    </div>
  );
};

export default PerformanceStatsWidget;
