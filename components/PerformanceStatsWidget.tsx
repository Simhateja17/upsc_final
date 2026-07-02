'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { dashboardService, testSeriesService } from '@/lib/services';

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
  note: string;
  accent: string;
  tint: string;
  status: BadgeState;
  icon?: string;
  iconNode?: React.ReactNode;
  emoji?: string;
}

const PerformanceStatsWidget = () => {
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  // Upcoming Test card is shown only to users who have purchased a test series.
  const [hasPurchasedTestSeries, setHasPurchasedTestSeries] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      try {
        const [perfRes, streakRes, enrolledRes] = await Promise.allSettled([
          dashboardService.getPerformance(),
          dashboardService.getStreak(),
          testSeriesService.getEnrolled(),
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
  const rankPercentile = performance?.rankPercentile ?? null;
  const jeetCoins = performance?.jeetCoins ?? (loading ? null : 0);
  const mcqsAttempted = performance?.mcq?.totalAttempts ?? (loading ? null : 0);
  const mainsWritten = performance?.mains?.totalAttempts ?? (loading ? null : 0);

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const hasAnyProgress = Boolean((currentStreak ?? 0) > 0 || (testsTaken ?? 0) > 0 || (syllabusCoverage ?? 0) > 0);
  const isFirstTimeUser = !hasAnyProgress && (jeetCoins ?? 0) === 0 && rank === null;
  const showOnFire = (currentStreak ?? 0) > 7;
  const badgeStatus = {
    streak: {
      earned: (currentStreak ?? 0) >= 30,
      progress: (currentStreak ?? 0) > 0,
    },
    learner: {
      earned: (testsTaken ?? 0) >= 10,
      progress: (testsTaken ?? 0) > 0,
    },
    accuracy: {
      earned: (testsTaken ?? 0) > 0 && (rankPercentile ?? 100) <= 5,
      progress: (testsTaken ?? 0) > 0,
    },
    polity: {
      earned: (syllabusCoverage ?? 0) >= 60,
      progress: (syllabusCoverage ?? 0) > 0,
    },
    allRounder: {
      earned: (currentStreak ?? 0) >= 7 && (testsTaken ?? 0) >= 5 && (syllabusCoverage ?? 0) >= 40,
      progress: (currentStreak ?? 0) > 0 || (testsTaken ?? 0) > 0 || (syllabusCoverage ?? 0) > 0,
    },
    centurion: {
      earned: (jeetCoins ?? 0) >= 100,
      progress: (jeetCoins ?? 0) > 0,
    },
  };
  const achievementBadges: AchievementBadge[] = [
    {
      key: 'streak',
      title: '30-Day Streak',
      note: `${currentStreak ?? 0} day streak`,
      emoji: '🔥',
      icon: '/icons/dashboard/badge-streak.png',
      accent: '#F59E0B',
      tint: '#FFF7E8',
      status: isFirstTimeUser ? 'locked' : badgeStatus.streak.earned ? 'earned' : badgeStatus.streak.progress ? 'in-progress' : 'locked',
    },
    {
      key: 'learner',
      title: 'Quick Learner',
      note: `${testsTaken ?? 0} tests done`,
      emoji: '🧠',
      icon: '/icons/dashboard/badge-learner.png',
      accent: '#F59E0B',
      tint: '#FFF9EB',
      status: isFirstTimeUser ? 'locked' : badgeStatus.learner.earned ? 'earned' : badgeStatus.learner.progress ? 'in-progress' : 'locked',
    },
    {
      key: 'accuracy',
      title: '95% Accuracy',
      note: rankPercentile !== null ? `Top ${rankPercentile}%` : 'Build accuracy',
      emoji: '🎖️',
      icon: '/icons/dashboard/badge-accuracy.png',
      accent: '#4F7CFF',
      tint: '#EEF4FF',
      status: isFirstTimeUser ? 'locked' : badgeStatus.accuracy.earned ? 'earned' : badgeStatus.accuracy.progress ? 'in-progress' : 'locked',
    },
    {
      key: 'polity',
      title: 'Polity Pro',
      note: `${syllabusCoverage ?? 0}% coverage`,
      accent: '#7C3AED',
      tint: '#F5F3FF',
      status: isFirstTimeUser ? 'locked' : badgeStatus.polity.earned ? 'earned' : badgeStatus.polity.progress ? 'in-progress' : 'locked',
      iconNode: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
          <path d="M3 9L12 4L21 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 10V18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M9 10V18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M15 10V18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M19 10V18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M4 20H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      key: 'all-rounder',
      title: 'All-Rounder',
      note: 'Consistency badge',
      accent: '#2563EB',
      tint: '#EFF6FF',
      status: isFirstTimeUser ? 'locked' : badgeStatus.allRounder.earned ? 'earned' : badgeStatus.allRounder.progress ? 'in-progress' : 'locked',
      iconNode: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
          <path d="M12 3L13.9 9.1L20 12L13.9 14.9L12 21L10.1 14.9L4 12L10.1 9.1L12 3Z" fill="currentColor" />
        </svg>
      ),
    },
    {
      key: 'centurion',
      title: 'Centurion',
      note: `${jeetCoins ?? 0}/100 coins`,
      accent: '#0EA5A4',
      tint: '#ECFEFF',
      status: isFirstTimeUser ? 'locked' : badgeStatus.centurion.earned ? 'earned' : badgeStatus.centurion.progress ? 'in-progress' : 'locked',
      iconNode: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
          <path d="M6 4.5H16C17.1 4.5 18 5.4 18 6.5V19.5L12 16.5L6 19.5V4.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M9 8H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M9 11H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
  ];
  // Show unlocked badges first (earned, then in-progress), locked ones last.
  // Array.prototype.sort is stable, so original order is preserved within each group.
  const badgeOrderRank = (status: AchievementBadge['status']) =>
    status === 'earned' ? 0 : status === 'in-progress' ? 1 : 2;
  const orderedBadges = [...achievementBadges].sort(
    (a, b) => badgeOrderRank(a.status) - badgeOrderRank(b.status)
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
                <p className="font-arimo text-[#6B7280] mt-[clamp(4px,0.31vw,6px)]" style={{ fontSize: 'clamp(12px,0.73vw,14px)', lineHeight: '1.2' }}>
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
                <span className="font-arimo text-[#4A5565]" style={{ fontSize: 'clamp(11px,0.68vw,13px)' }}>
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

              {/* Mains Written */}
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
                  Mains Written
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Weekly Leaderboard */}
      <Link
        href="/dashboard/leaderboard"
        className="cursor-pointer hover:shadow-md transition-shadow flex items-center justify-center"
        style={{
          background: '#74A0FF30',
          height: '50px',
          borderRadius: '16px',
        }}
      >
        <div className="flex items-center" style={{ gap: '8px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/add-icon.png" alt="" aria-hidden="true" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
          <span className="font-outfit font-semibold whitespace-nowrap" style={{ fontSize: '18px', lineHeight: '1', color: '#1E2875' }}>
            Weekly Leaderboard
          </span>
          <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none">
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
            <p className="font-arimo text-[#3F6275] text-center" style={{ fontSize: 'clamp(10px,0.63vw,12px)', lineHeight: '1.25' }}>Downloads</p>
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
            <p className="font-arimo text-[#3F6275] text-center" style={{ fontSize: 'clamp(10px,0.63vw,12px)', lineHeight: '1.25' }}>Profile</p>
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
            <p className="font-arimo text-[#3F6275] text-center" style={{ fontSize: 'clamp(10px,0.63vw,12px)', lineHeight: '1.25' }}>All Settings</p>
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
    </div>
  );
};

export default PerformanceStatsWidget;
