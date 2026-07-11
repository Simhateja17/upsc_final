'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { dashboardService, leaderboardService } from '@/lib/services';
import { useAuth } from '@/contexts/AuthContext';
import DashboardPageHero from '@/components/DashboardPageHero';
import { useEntitlements } from '@/contexts/EntitlementsContext';

type DayActivity = { questionsAttempted: number; hours: number };
type SubjectRow = { name: string; accuracy: number; questions: number; tag?: string; color?: string };
type DistributionItem = { label: string; value: number; color: string; hours: number };
type StreakDay = {
  day: number;
  intensity: number;
  studyTime: string;
  mcqAttempts: number;
  mainsAttempts: number;
  mockAttempts: number;
  editorialsRead: number;
  editorialsTotal: number;
};

const orderedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const subjectColors = ['#4A7DFF', '#58BE87', '#F4C33F', '#9B51E0', '#F2742F'];

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function formatHours(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '0h';

  const totalSeconds = Math.round(value * 3600);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours === 0 && minutes === 0) return `${seconds}s`;
  if (hours === 0) return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  if (minutes === 0) return seconds > 0 ? `${hours}h ${seconds}s` : `${hours}h`;
  return seconds > 0 ? `${hours}h ${minutes}m ${seconds}s` : `${hours}h ${minutes}m`;
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[#F0F1F4]">
      <div className="h-full rounded-full" style={{ width: `${clamp(value)}%`, background: color }} />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 text-center text-[12px] font-semibold uppercase tracking-[1.4px] text-[#6A7282]">
      {children}
    </div>
  );
}

function AnalyticsCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[14px] border border-[#E5E7EB] bg-white shadow-sm ${className}`}
      style={{ boxShadow: '0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px rgba(0,0,0,0.1)' }}
    >
      {children}
    </div>
  );
}

function LockedAnalyticsCard({
  heading,
  children,
  locked,
  className = '',
}: {
  heading: React.ReactNode;
  children: React.ReactNode;
  locked: boolean;
  className?: string;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.1),0px_1px_3px_rgba(0,0,0,0.1)] transition-all duration-300 ${locked ? 'cursor-pointer hover:-translate-y-1 hover:border-[#D8D8DE] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)]' : ''} ${className}`}
    >
      <div className="pointer-events-none relative z-[6]">{heading}</div>
      <div className={locked ? 'pointer-events-none select-none blur-[4px] transition-[filter] duration-300 group-hover:blur-[5px]' : ''}>
        {children}
      </div>
      {locked && (
        <Link
          href="/dashboard/billing/plans?plan=rise"
          aria-label="Upgrade to unlock analytics"
          className="absolute inset-0 z-[5] flex flex-col items-center justify-center bg-white/60 opacity-0 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 group-hover:bg-white/35 group-hover:backdrop-blur-[4px]"
        >
          <span className="mb-2 flex h-[42px] w-[42px] scale-75 items-center justify-center rounded-full bg-[#1E2028] opacity-0 shadow-[0_4px_14px_rgba(30,32,40,0.25)] transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F5C542" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <span className="text-[11.5px] font-bold tracking-[0.2px] text-[#1E293B] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            UPGRADE TO UNLOCK
          </span>
        </Link>
      )}
    </div>
  );
}

function SubjectList({ rows, weak = false }: { rows: SubjectRow[]; weak?: boolean }) {
  if (!rows.length) {
    return (
      <div className="rounded-[10px] bg-[#F8FAFC] px-4 py-8 text-center text-[13px] text-[#6A7282]">
        Subject data will appear after attempted tests include topic analytics.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {rows.map((row, index) => {
        const color = row.color ?? subjectColors[index % subjectColors.length];

        return (
          <div key={row.name}>
            <div className="mb-3 flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-2 w-2 flex-none rounded-full" style={{ background: color }} />
                <span className="truncate text-[16px] font-medium text-[#101828]">{row.name}</span>
                {row.tag ? (
                  <span className="rounded-[4px] bg-[#FDECEC] px-2 py-1 text-[10px] font-semibold text-[#E02424]">
                    {row.tag}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-none items-center gap-3">
                <span className="text-[16px] font-bold" style={{ color: weak ? '#E02424' : color }}>
                  {Math.round(row.accuracy)}%
                </span>
                <span className="text-[13px] text-[#6A7282]">{row.questions} Qs</span>
              </div>
            </div>
            <ProgressBar value={row.accuracy} color={color} />
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ items, centerLabel }: { items: DistributionItem[]; centerLabel: string }) {
  let cursor = 0;
  const stops = items.map((item) => {
    const start = cursor;
    cursor += item.value;
    return `${item.color} ${start}% ${cursor}%`;
  });
  const hasData = items.some((item) => item.value > 0);

  return (
    <div
      className="relative h-[180px] w-[180px] rounded-full"
      style={{ background: hasData ? `conic-gradient(${stops.join(', ')})` : '#EEF0F3' }}
    >
      <div className="absolute inset-[42px] flex flex-col items-center justify-center rounded-full bg-white">
        <span className="text-[26px] font-bold leading-none text-[#101828]">{centerLabel}</span>
        <span className="mt-1 text-[12px] uppercase text-[#6A7282]">Total</span>
      </div>
    </div>
  );
}

export default function PerformancePage() {
  const [data, setData] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [badgesData, setBadgesData] = useState<any>(null);
  const [streakCalendar, setStreakCalendar] = useState<any>(null);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<any[] | null>(null);
  const [failedSections, setFailedSections] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const entitlements = useEntitlements();

  useEffect(() => {
    let mounted = true;

    Promise.allSettled([
      dashboardService.getPerformance(),
      dashboardService.getTestAnalytics(),
      dashboardService.getBadges(),
      dashboardService.getStreakCalendar(),
      leaderboardService.getLeaderboard('overall', 'week'),
    ])
      .then(([performanceResult, analyticsResult, badgesResult, streakCalendarResult, leaderboardResult]) => {
        if (!mounted) return;

        const results = [performanceResult, analyticsResult, badgesResult, streakCalendarResult, leaderboardResult];
        const sectionNames = ['summary', 'analytics', 'badges', 'streak calendar', 'leaderboard'];
        setFailedSections(sectionNames.filter((_, index) => results[index].status === 'rejected'));

        if (performanceResult.status === 'fulfilled') {
          setData(performanceResult.value.data);
        }

        if (analyticsResult.status === 'fulfilled') {
          setAnalyticsData(analyticsResult.value.data);
        }

        if (badgesResult.status === 'fulfilled') {
          setBadgesData(badgesResult.value.data);
        }

        if (streakCalendarResult.status === 'fulfilled') {
          setStreakCalendar(streakCalendarResult.value.data);
        }

        if (leaderboardResult.status === 'fulfilled') {
          setWeeklyLeaderboard(leaderboardResult.value.data ?? []);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const mcq = data?.mcq ?? {};
  const mockTests = data?.mockTests ?? {};
  const streak = data?.streak ?? {};
  const dailyActivity = analyticsData?.dailyActivity ?? [];

  const totalMcqCorrect = mcq.totalCorrect ?? analyticsData?.summary?.mcqCorrect ?? 0;
  const totalMcqWrong = mcq.totalWrong ?? analyticsData?.summary?.mcqWrong ?? 0;
  const totalMcqSkipped = mcq.totalSkipped ?? analyticsData?.summary?.mcqSkipped ?? 0;
  const totalQuestions =
    analyticsData?.summary?.totalQuestions ??
    data?.questionsAttempted ??
    (totalMcqCorrect + totalMcqWrong + totalMcqSkipped);
  const overallAccuracy = clamp(Math.round(analyticsData?.summary?.avgAccuracy ?? mcq.avgAccuracy ?? 0));
  const currentStreak = streak.currentStreak ?? analyticsData?.summary?.currentStreak ?? 0;

  const activityMap = new Map<string, DayActivity>(
    dailyActivity.map((entry: any) => [
      String(entry.day),
      {
        questionsAttempted: Number(entry.questionsAttempted ?? 0),
        hours: Number(entry.hours ?? 0),
      },
    ]),
  );

  const dailyBars = orderedDays.map((day) => ({
    day,
    questions: activityMap.get(day)?.questionsAttempted ?? 0,
    hours: activityMap.get(day)?.hours ?? 0,
  }));

  const weeklyQuestions = dailyBars.reduce((sum, day) => sum + day.questions, 0);
  const totalStudyHours = dailyBars.reduce((sum, day) => sum + day.hours, 0);
  const todayHours = dailyBars[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]?.hours ?? 0;
  const bestDayHours = Math.max(...dailyBars.map((day) => day.hours), 0);
  const activeStudyDays = dailyBars.filter((day) => day.hours > 0 || day.questions > 0).length;
  const dailyAvgHours = activeStudyDays > 0 ? totalStudyHours / activeStudyDays : 0;
  const maxStudyHours = Math.max(...dailyBars.map((day) => day.hours), 1);

  const selectedDayDetail: StreakDay | undefined = streakCalendar?.days.find(
    (d: StreakDay) => d.day === (selectedDay ?? streakCalendar.today),
  );

  const subjectAccuracy = analyticsData?.subjectAccuracy ?? [];
  const apiStrongTopics = (data?.strongTopics ?? []).map((topic: any, index: number) => ({
    name: topic.name,
    accuracy: Number(topic.accuracy ?? 0),
    questions: Number(topic.questions ?? topic.total ?? 0),
    color: subjectColors[index % subjectColors.length],
  }));
  const apiWeakTopics = (data?.weakTopics ?? []).map((topic: any, index: number) => ({
    name: topic.name,
    accuracy: Number(topic.accuracy ?? 0),
    questions: Number(topic.questions ?? topic.total ?? 0),
    tag: index === 0 ? 'Needs Revision' : undefined,
    color: ['#E02424', '#F2742F', '#111827', '#E8B84B'][index % 4],
  }));

  const strongAreas: SubjectRow[] = subjectAccuracy.length > 0
    ? subjectAccuracy.slice(0, 5).map((subject: any, index: number) => ({
      name: subject.subject,
      accuracy: Number(subject.accuracy ?? 0),
      questions: Number((subject.correct ?? 0) + (subject.wrong ?? 0)),
      color: subjectColors[index % subjectColors.length],
    }))
    : apiStrongTopics;

  const weakAreas: SubjectRow[] = subjectAccuracy.length > 0
    ? [...subjectAccuracy]
      .sort((a: any, b: any) => Number(a.accuracy ?? 0) - Number(b.accuracy ?? 0))
      .slice(0, 4)
      .map((subject: any, index: number) => ({
        name: subject.subject,
        accuracy: Number(subject.accuracy ?? 0),
        questions: Number((subject.correct ?? 0) + (subject.wrong ?? 0)),
        tag: index === 0 ? 'Needs Revision' : undefined,
        color: ['#E02424', '#F2742F', '#111827', '#E8B84B'][index % 4],
      }))
    : apiWeakTopics;

  const distribution: DistributionItem[] = (analyticsData?.studyTypeDistribution?.length
    ? analyticsData.studyTypeDistribution
    : [
      { label: 'Reading', hours: 0, percentage: 0, color: '#55B9AA' },
      { label: 'Video Lectures', hours: 0, percentage: 0, color: '#E65B64' },
      { label: 'Practice', hours: 0, percentage: 0, color: '#E8C363' },
    ]).map((item: any) => ({
    label: String(item.label ?? ''),
    value: Number(item.percentage ?? 0),
    color: String(item.color ?? '#D1D5DB'),
    hours: Number(item.hours ?? 0),
  }));

  const badgeIcons: Record<string, string> = {
    streak: '🔥',
    learner: '⚡',
    accuracy: '🎯',
    polity: '📚',
    'all-rounder': '🎓',
    centurion: '👑',
  };
  const earnedBadges = (badgesData?.badges ?? []).map((badge: any) => ({
    icon: badgeIcons[badge.key] ?? '🏅',
    title: badge.title,
    earned: badge.status === 'earned',
    note: badge.note,
  }));
  const earnedBadgeCount = earnedBadges.filter((badge: any) => badge.earned).length;

  const summaryCards = [
    {
      title: 'Day Streak',
      icon: '🔥',
      value: String(currentStreak),
      valueColor: '#F2742F',
      subtitle: `${activeStudyDays} days this week`,
    },
    {
      title: 'Qs Attempted',
      icon: '📝',
      value: totalQuestions.toLocaleString('en-IN'),
      valueColor: '#4A7DFF',
      subtitle: `${weeklyQuestions.toLocaleString('en-IN')} this week`,
    },
    {
      title: 'Avg Accuracy',
      icon: '🎯',
      value: `${overallAccuracy}%`,
      valueColor: '#55C96D',
      subtitle: `${Math.round(analyticsData?.summary?.avgAccuracy ?? overallAccuracy)}% current avg`,
    },
    {
      title: 'Study Time',
      icon: '⏱️',
      value: formatHours(totalStudyHours),
      valueColor: '#9B51E0',
      subtitle: `${formatHours(totalStudyHours)} this week`,
    },
    {
      title: 'Mock Tests',
      icon: '📊',
      value: String(mockTests.totalAttempts ?? analyticsData?.summary?.totalTests ?? 0),
      valueColor: '#5B5CF6',
      subtitle: 'Full length + sectional',
    },
    {
      title: 'Badges Earned',
      icon: '🏆',
      value: String(earnedBadgeCount),
      valueColor: '#C9821F',
      subtitle: `${earnedBadges.length - earnedBadgeCount} still locked`,
    },
  ];

  const userFirstName = user?.firstName || 'Arjun';
  const hasFullAnalytics = entitlements.canAccess('analytics', ['full']);
  const showAdvancedAnalyticsPreview = !hasFullAnalytics;

  return (
    <div
      className="flex overflow-hidden font-arimo"
      style={{ background: '#F9FAFB', minHeight: 'calc(100vh - clamp(90px, 5.78vw, 111px))' }}
    >
      <div className="flex-1 overflow-y-auto">
        <DashboardPageHero
          badgeIcon={
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/sidebar-performance-new.png" alt="performance" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
          }
          badgeText="Analytics - Performance Dashboard"
          title={<>{userFirstName}&apos;s <span style={{ fontStyle: 'italic', color: '#E8B84B' }}>Progress.</span></>}
          subtitle="Your complete UPSC preparation analytics streaks, subject mastery, weak areas, spaced repetition & smart notes."
          stats={summaryCards.slice(0, 4).map(c => ({ value: c.value, label: c.title.toUpperCase(), color: c.valueColor }))}
        />
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          {loading && (
            <div className="mb-6 rounded-[10px] border border-[#DDE8FF] bg-[#F7F9FF] px-4 py-3 text-[13px] text-[#245CEB]">
              Loading your latest performance data…
            </div>
          )}
          {!loading && failedSections.length > 0 && (
            <div role="alert" className="mb-6 rounded-[10px] border border-[#F5C2C0] bg-[#FFF5F5] px-4 py-3 text-[13px] text-[#B42318]">
              Some live data could not be loaded: {failedSections.join(', ')}. Refresh the page to try again.
            </div>
          )}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {summaryCards.map((card) => (
              <AnalyticsCard key={card.title} className="min-h-[142px] px-5 py-6">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.9px] text-[#99A1AF]">
                    {card.title}
                  </span>
                  <span className="text-[20px]" aria-hidden>{card.icon}</span>
                </div>
                <div className="text-[36px] font-bold leading-[40px]" style={{ color: card.valueColor }}>
                  {card.value}
                </div>
                <div className="mt-3 flex items-center gap-2 text-[13px] text-[#4B5563]">
                  <span className="text-[#22C55E]">↗</span>
                  <span>{card.subtitle}</span>
                </div>
              </AnalyticsCard>
            ))}
          </div>

          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <LockedAnalyticsCard
              locked={showAdvancedAnalyticsPreview}
              className="px-6 py-7"
              heading={<h2 className="mb-8 flex items-center gap-2 text-[20px] font-bold text-[#101828]">
                <span className="h-2 w-2 rounded-full bg-[#8B35F6]" />
                Study Time – This Week
              </h2>}
            >

              <div className="mb-16 grid grid-cols-2 gap-5 sm:grid-cols-4">
                {[
                  ['Today', formatHours(todayHours), '#101828'],
                  ['Best Day', formatHours(bestDayHours), '#C9821F'],
                  ['Daily Avg', formatHours(dailyAvgHours), '#245CEB'],
                  ['Total Study Hours', formatHours(totalStudyHours), '#245CEB'],
                ].map(([label, value, color]) => (
                  <div key={label}>
                    <div className="text-[26px] font-bold leading-8" style={{ color }}>{value}</div>
                    <div className="mt-2 text-[11px] uppercase tracking-[0.8px] text-[#99A1AF]">{label}</div>
                  </div>
                ))}
              </div>

              <div className="flex h-[132px] items-end gap-3">
                {dailyBars.map((item) => {
                  const isToday = item.day === orderedDays[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
                  const height = item.hours > 0 ? Math.max((item.hours / maxStudyHours) * 86, 18) : 56;
                  const color = item.hours <= 0 ? '#CDD2DA' : isToday ? '#F5C84B' : '#0E1830';

                  return (
                    <div key={item.day} className="flex flex-1 flex-col items-center">
                      <div className="w-full rounded-[6px]" style={{ height, background: color }} />
                      <span className="mt-3 text-[13px] text-[#99A1AF]">{item.day}</span>
                      <span className="mt-2 text-[12px] text-[#99A1AF]">{formatHours(item.hours)}</span>
                    </div>
                  );
                })}
              </div>
            </LockedAnalyticsCard>

            <LockedAnalyticsCard
              locked={showAdvancedAnalyticsPreview}
              className="px-6 py-7"
              heading={<h2 className="mb-9 flex items-center gap-2 text-[20px] font-bold text-[#101828]">
                <span className="h-2 w-2 rounded-full bg-[#F28C32]" />
                Time Distribution – This Week
              </h2>}
            >

              <div className="grid items-center gap-8 sm:grid-cols-[220px_1fr]">
                <div className="flex justify-center">
                  <DonutChart items={distribution} centerLabel={formatHours(totalStudyHours)} />
                </div>
                <div className="space-y-4">
                  {distribution.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-6">
                      <div className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full" style={{ background: item.color }} />
                        <span className="text-[16px] text-[#4B5563]">{item.label}</span>
                      </div>
                      <span className="text-[16px] font-bold text-[#101828]">{formatHours(item.hours)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </LockedAnalyticsCard>
          </div>

          <SectionLabel>Strong &amp; Weak Areas</SectionLabel>
          <div className="mb-9 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <LockedAnalyticsCard
              locked={showAdvancedAnalyticsPreview}
              className="px-6 py-7"
              heading={<div className="mb-8 flex items-center justify-between gap-4">
                <h2 className="flex items-center gap-3 text-[20px] font-bold text-[#101828]">
                  <span className="text-[24px]" aria-hidden>💪</span>
                  Strong Areas
                </h2>
                <div className="hidden items-center gap-3 text-[13px] text-[#6A7282] sm:flex">
                  <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#4A7DFF]" />Accuracy</span>
                  <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#D1D5DB]" />Qs attempted</span>
                </div>
              </div>}
            >
              <SubjectList rows={strongAreas} />
            </LockedAnalyticsCard>

            <LockedAnalyticsCard
              locked={showAdvancedAnalyticsPreview}
              className="px-6 py-7"
              heading={<div className="mb-8 flex items-center justify-between gap-4">
                <h2 className="flex items-center gap-3 text-[20px] font-bold text-[#101828]">
                  <span className="text-[24px]" aria-hidden>⚠</span>
                  Weak Areas
                </h2>
                <Link href="/dashboard/spaced-repetition" className="text-[16px] font-medium text-[#155DFC]">
                  View Tracker +
                </Link>
              </div>}
            >
              <SubjectList rows={weakAreas} weak />
            </LockedAnalyticsCard>
          </div>

          <SectionLabel>Study Streak &amp; Daily Trio Progress</SectionLabel>
          <div className="mb-9 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <LockedAnalyticsCard
              locked={showAdvancedAnalyticsPreview}
              className="px-6 py-7"
              heading={<div className="mb-7 flex items-center justify-between gap-4">
                <h2 className="flex items-center gap-3 text-[20px] font-bold text-[#101828]">
                  <span aria-hidden>📅</span>
                  Study Streak – {streakCalendar?.monthLabel ?? new Date().toLocaleString('en-US', { month: 'long' })} {streakCalendar?.year ?? new Date().getFullYear()}
                </h2>
                <span className="font-bold text-[#F2742F]">🔥 {currentStreak} Days!</span>
              </div>}
            >

              <div className="mb-5 flex flex-wrap items-center gap-2 text-[10px] uppercase text-[#6A7282]">
                <span>Intensity</span>
                {['None', 'Light', 'Medium', 'Intense'].map((label, index) => (
                  <span key={label} className="flex items-center gap-1">
                    <span
                      className="h-3 w-3 rounded-[3px]"
                      style={{ background: ['#EEF0F3', '#D7F8E4', '#A8EBC7', '#58BE87'][index] }}
                    />
                    {label}
                  </span>
                ))}
              </div>

              <div className="mb-4 grid grid-cols-7 gap-2 text-center text-[12px] text-[#6A7282]">
                {orderedDays.map((day) => <span key={day}>{day}</span>)}
                {streakCalendar && (() => {
                  const firstWeekday = (new Date(streakCalendar.year, streakCalendar.month - 1, 1).getDay() + 6) % 7;
                  return Array.from({ length: firstWeekday }, (_, index) => <div key={`blank-${index}`} />);
                })()}
                {(streakCalendar?.days ?? []).map((entry: StreakDay) => {
                  const isToday = entry.day === streakCalendar.today;
                  const isSelected = entry.day === (selectedDay ?? streakCalendar.today);
                  const intensityColor = ['#EEF0F3', '#D7F8E4', '#A8EBC7', '#58BE87'][entry.intensity];

                  return (
                    <button
                      key={entry.day}
                      type="button"
                      onClick={() => setSelectedDay(entry.day)}
                      className="flex aspect-square items-center justify-center rounded-[8px] text-[14px] font-semibold transition-shadow"
                      style={{
                        background: isSelected ? '#0F1626' : isToday ? '#0A1172' : intensityColor,
                        border: isSelected
                          ? '2px solid #0F1626'
                          : isToday
                            ? '2px solid #0A1172'
                            : '1px solid transparent',
                        color: isSelected ? '#F4B740' : isToday ? '#FFFFFF' : entry.intensity >= 2 ? '#FFFFFF' : '#101828',
                      }}
                    >
                      {entry.day}
                    </button>
                  );
                })}
              </div>

              {selectedDayDetail && (() => {
                const hasActivity =
                  selectedDayDetail.studyTime !== '0h 0m' ||
                  selectedDayDetail.mcqAttempts > 0 ||
                  selectedDayDetail.mainsAttempts > 0 ||
                  selectedDayDetail.mockAttempts > 0 ||
                  selectedDayDetail.editorialsRead > 0;

                return (
                  <div className="mb-6 rounded-[12px] border border-[#EEF0F3] bg-[#F8FAFC] px-4 py-3">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[13px] font-bold text-[#101828]">
                        {streakCalendar?.monthLabel} {selectedDayDetail.day}, {streakCalendar?.year}
                      </span>
                      <span className="text-[12px] font-semibold" style={{ color: hasActivity ? '#22A06B' : '#99A1AF' }}>
                        {hasActivity ? 'Active' : 'No activity'}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-center">
                      {[
                        { label: 'Study', value: selectedDayDetail.studyTime },
                        { label: 'MCQ', value: String(selectedDayDetail.mcqAttempts) },
                        { label: 'Mains', value: String(selectedDayDetail.mainsAttempts) },
                        { label: 'Mock', value: String(selectedDayDetail.mockAttempts) },
                        {
                          label: 'Editorial',
                          value: selectedDayDetail.editorialsTotal > 0
                            ? `${selectedDayDetail.editorialsRead}/${selectedDayDetail.editorialsTotal}`
                            : '—',
                        },
                      ].map((stat) => (
                        <div key={stat.label}>
                          <div className="text-[15px] font-bold leading-tight text-[#101828]">{stat.value}</div>
                          <div className="mt-1 text-[10px] uppercase tracking-[0.4px] text-[#6A7282]">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-3 border-t border-[#EEF0F3] pt-4 text-center">
                <div>
                  <div className="text-[22px] font-bold text-[#101828]">{formatHours(dailyAvgHours)}</div>
                  <div className="mt-1 text-[10px] uppercase text-[#6A7282]">Avg Daily Study</div>
                </div>
                <div>
                  <div className="text-[22px] font-bold text-[#E8B84B]">{activeStudyDays}/7</div>
                  <div className="mt-1 text-[10px] uppercase text-[#6A7282]">Active Days Week</div>
                </div>
                <div>
                  <div className="text-[22px] font-bold text-[#55B9AA]">{formatHours(totalStudyHours)}</div>
                  <div className="mt-1 text-[10px] uppercase text-[#6A7282]">Total Week Hours</div>
                </div>
              </div>
            </LockedAnalyticsCard>

            <LockedAnalyticsCard
              locked={showAdvancedAnalyticsPreview}
              className="px-6 py-7"
              heading={<h2 className="mb-7 flex items-center gap-3 text-[20px] font-bold text-[#101828]">
                <span aria-hidden>⚡</span>
                Daily Trio – This Week
              </h2>}
            >

              {[
                { icon: '📚', title: 'Daily MCQ Challenge', subtitle: 'Polity, Economy, Geography', value: Math.min(analyticsData?.dailyTrio?.mcqDays ?? 0, 7), color: '#58BE87', href: '/dashboard/daily-mcq' },
                { icon: '✍️', title: 'Daily Mains Challenge', subtitle: 'Answer Writing, AI Evaluated', value: Math.min(analyticsData?.dailyTrio?.mainsDays ?? 0, 7), color: '#0E1830', href: '/dashboard/daily-answer' },
                { icon: '📰', title: 'Daily News Analysis', subtitle: 'The Hindu, Indian Express', value: Math.min(analyticsData?.dailyTrio?.editorialDays ?? 0, 7), color: '#E8B84B', href: '/dashboard/daily-editorial' },
              ].map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="mb-8 block rounded-[10px] border border-[#E5E7EB] bg-white px-5 py-4 shadow-sm transition-colors hover:border-[#CBD5E1] last:mb-0"
                  style={{ boxShadow: '0px 2px 4px rgba(0,0,0,0.12)' }}
                >
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-[20px]" aria-hidden>{item.icon}</span>
                      <div>
                        <div className="text-[16px] font-bold text-[#101828]">{item.title}</div>
                        <div className="mt-1 text-[12px] text-[#6A7282]">{item.subtitle}</div>
                      </div>
                    </div>
                    <span className="text-[18px] text-[#99A1AF]" aria-hidden>→</span>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] items-center gap-6">
                    <ProgressBar value={(item.value / 7) * 100} color={item.color} />
                    <span className="text-[14px] font-bold text-[#101828]">{item.value}/7 days</span>
                  </div>
                </Link>
              ))}
            </LockedAnalyticsCard>
          </div>

          <SectionLabel>Recent Tests &amp; Achievements</SectionLabel>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AnalyticsCard className="px-6 py-7">
              <div className="mb-7 flex items-center justify-between gap-4">
                <h2 className="flex items-center gap-3 text-[20px] font-bold text-[#101828]">
                  <span aria-hidden>🏆</span>
                  Achievement Badges
                </h2>
                <div className="flex items-center gap-3">
                  <span className="rounded-[4px] bg-[#E8B84B] px-2 py-1 text-[12px] font-semibold text-white">
                    {earnedBadgeCount} Earned
                  </span>
                  <Link href="/dashboard/achievement-badges" className="text-[14px] text-[#4B5563] hover:underline">All →</Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {earnedBadges.map((badge: any) => (
                  <div
                    key={badge.title}
                    className="rounded-[10px] border px-3 py-5 text-center"
                    style={{
                      borderColor: badge.earned ? '#F4D85A' : '#DDE8FF',
                      background: badge.earned ? 'linear-gradient(180deg,#FFFCEA,#FFFFFF)' : '#F7F9FF',
                      opacity: badge.earned ? 1 : 0.72,
                    }}
                  >
                    <div className="mb-4 text-[26px]" aria-hidden>{badge.icon}</div>
                    <div className="text-[12px] font-bold text-[#101828]">{badge.title}</div>
                    <div className="mt-3 text-[10px]" style={{ color: badge.earned ? '#C9821F' : '#6A7282' }}>
                      {badge.earned ? '✓ Earned' : 'Locked'}
                    </div>
                    <div className="mt-2 text-[10px] text-[#99A1AF]">{badge.note}</div>
                  </div>
                ))}
              </div>
            </AnalyticsCard>

            <AnalyticsCard className="px-6 py-7">
              <div className="mb-7 flex items-center justify-between gap-4">
                <h2 className="flex items-center gap-3 text-[20px] font-bold text-[#101828]">
                  <span aria-hidden>🏅</span>
                  Weekly Leaderboard
                </h2>
                <Link href="/dashboard/leaderboard?range=week" className="text-[13px] font-semibold text-[#258F7D] hover:underline">View All →</Link>
              </div>

              {weeklyLeaderboard?.length ? (
                <div className="space-y-3">
                  {weeklyLeaderboard.slice(0, 8).map((entry: any, index: number) => (
                    <div key={entry.userId ?? entry.name ?? index} className="flex items-center justify-between rounded-[8px] bg-[#F8FAFC] px-4 py-3">
                      <div className="flex items-center gap-4">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4A7DFF] font-bold text-white">
                          {entry.rank ?? index + 1}
                        </span>
                        <span className="font-semibold text-[#101828]">{entry.name}</span>
                      </div>
                      <span className="font-bold text-[#258F7D]">{entry.totalScore}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[10px] bg-[#F8FAFC] px-5 py-10 text-center">
                  <div className="text-[15px] font-semibold text-[#101828]">No leaderboard data yet</div>
                  <p className="mx-auto mt-2 max-w-[360px] text-[13px] leading-5 text-[#6A7282]">
                    Attempt a few tests this week to appear on the weekly leaderboard.
                  </p>
                </div>
              )}
            </AnalyticsCard>
          </div>
        </div>
      </div>
    </div>
  );
}
