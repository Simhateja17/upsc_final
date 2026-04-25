'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { dashboardService } from '@/lib/services';
import { useAuth } from '@/contexts/AuthContext';

type DayActivity = { questionsAttempted: number; hours: number };
type SubjectRow = { name: string; accuracy: number; questions: number; tag?: string; color?: string };
type DistributionItem = { label: string; value: number; color: string };

const orderedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const subjectColors = ['#4A7DFF', '#58BE87', '#F4C33F', '#9B51E0', '#F2742F'];

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function formatHours(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '0h';

  const hours = Math.floor(value);
  const minutes = Math.round((value - hours) * 60);

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h${minutes}m`;
}

function getDaysToPrelims() {
  const prelimsDate = new Date('2026-05-24T00:00:00+05:30');
  const today = new Date();
  const diff = prelimsDate.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diff / 86400000));
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
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;

    Promise.allSettled([
      dashboardService.getPerformance(),
      dashboardService.getTestAnalytics(),
    ])
      .then(([performanceResult, analyticsResult]) => {
        if (!mounted) return;

        if (performanceResult.status === 'fulfilled') {
          setData(performanceResult.value.data);
        }

        if (analyticsResult.status === 'fulfilled') {
          setAnalyticsData(analyticsResult.value.data);
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
  const mains = data?.mains ?? {};
  const streak = data?.streak ?? {};
  const dailyActivity = analyticsData?.dailyActivity ?? [];

  const totalMcqCorrect = mcq.totalCorrect ?? analyticsData?.summary?.mcqCorrect ?? 0;
  const totalMcqWrong = mcq.totalWrong ?? analyticsData?.summary?.mcqWrong ?? 0;
  const totalMcqSkipped = mcq.totalSkipped ?? analyticsData?.summary?.mcqSkipped ?? 0;
  const totalMcqAnswered = totalMcqCorrect + totalMcqWrong;
  const totalQuestions =
    analyticsData?.summary?.totalQuestions ??
    data?.questionsAttempted ??
    (totalMcqCorrect + totalMcqWrong + totalMcqSkipped);
  const overallAccuracy = totalMcqAnswered > 0
    ? Math.round(((totalMcqCorrect - totalMcqWrong * 0.33) / totalMcqAnswered) * 100)
    : Math.round(analyticsData?.summary?.avgAccuracy ?? mcq.avgAccuracy ?? 0);
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

  const strongAreas: SubjectRow[] = apiStrongTopics.length > 0
    ? apiStrongTopics
    : subjectAccuracy.slice(0, 5).map((subject: any, index: number) => ({
      name: subject.subject,
      accuracy: Number(subject.accuracy ?? 0),
      questions: Number((subject.correct ?? 0) + (subject.wrong ?? 0)),
      color: subjectColors[index % subjectColors.length],
    }));

  const weakAreas: SubjectRow[] = apiWeakTopics.length > 0
    ? apiWeakTopics
    : [...subjectAccuracy]
      .sort((a: any, b: any) => Number(a.accuracy ?? 0) - Number(b.accuracy ?? 0))
      .slice(0, 4)
      .map((subject: any, index: number) => ({
        name: subject.subject,
        accuracy: Number(subject.accuracy ?? 0),
        questions: Number((subject.correct ?? 0) + (subject.wrong ?? 0)),
        tag: index === 0 ? 'Needs Revision' : undefined,
        color: ['#E02424', '#F2742F', '#111827', '#E8B84B'][index % 4],
      }));

  const subjectQuestionTotal = subjectAccuracy.reduce(
    (sum: number, subject: any) => sum + Number((subject.correct ?? 0) + (subject.wrong ?? 0)),
    0,
  );
  const distribution: DistributionItem[] = subjectAccuracy.length > 0
    ? subjectAccuracy.slice(0, 6).map((subject: any, index: number) => {
      const questions = Number((subject.correct ?? 0) + (subject.wrong ?? 0));
      return {
        label: subject.subject,
        value: subjectQuestionTotal > 0 ? Math.round((questions / subjectQuestionTotal) * 100) : 0,
        color: ['#F4C33F', '#F28C32', '#4A7DFF', '#E24C91', '#9B51E0', '#55B9AA'][index % 6],
      };
    })
    : [
      { label: 'GS I', value: 0, color: '#F4C33F' },
      { label: 'GS II', value: 0, color: '#F28C32' },
      { label: 'GS III', value: 0, color: '#4A7DFF' },
      { label: 'GS IV', value: 0, color: '#E24C91' },
      { label: 'Essay', value: 0, color: '#9B51E0' },
      { label: 'Curr. Affairs', value: 0, color: '#55B9AA' },
    ];

  const earnedBadges = [
    { icon: '🔥', title: '30-Day Streak', earned: currentStreak >= 30, note: `${currentStreak} day streak` },
    { icon: '⚡', title: 'Quick Learner', earned: totalQuestions >= 100, note: `${totalQuestions.toLocaleString('en-IN')} Qs done` },
    { icon: '🧠', title: '1000 Qs Club', earned: totalQuestions >= 1000, note: `${totalQuestions.toLocaleString('en-IN')} Qs done` },
    { icon: '📚', title: 'Polity Master', earned: strongAreas.some((area) => /polity/i.test(area.name)), note: 'Subject mastery' },
    { icon: '🎯', title: '95% Accuracy', earned: overallAccuracy >= 95, note: `${overallAccuracy}% now` },
    { icon: '👑', title: 'Top 100 Rank', earned: Boolean(data?.rank && data.rank <= 100), note: data?.rank ? `#${data.rank} now` : 'Rank pending' },
    { icon: '🎓', title: 'Syllabus Master', earned: (data?.syllabusCoverage ?? 0) >= 90, note: `${data?.syllabusCoverage ?? 0}% covered` },
    { icon: '🧑‍💻', title: 'Mock Test King', earned: (mockTests.totalAttempts ?? 0) >= 50, note: `${mockTests.totalAttempts ?? 0}/50 done` },
  ];
  const earnedBadgeCount = earnedBadges.filter((badge) => badge.earned).length;

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
  const daysToPrelims = useMemo(getDaysToPrelims, []);

  return (
    <div
      className="flex overflow-hidden"
      style={{ background: '#F4F6FA', minHeight: 'calc(100vh - clamp(90px, 5.78vw, 111px))' }}
    >
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6">
          <div className="relative mb-10 w-full overflow-hidden rounded-[16px] px-8 py-8 sm:px-10 lg:px-12">
            <div className="absolute inset-0">
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-90"
                style={{ backgroundImage: 'url(/hero-bg.jpg)' }}
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_78%,rgba(93,84,69,0.55)_0%,rgba(15,23,43,0.08)_30%,rgba(7,12,28,0.82)_76%)]" />
              <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.035)_0,rgba(255,255,255,0.035)_1px,transparent_1px,transparent_34px),repeating-linear-gradient(90deg,rgba(255,255,255,0.035)_0,rgba(255,255,255,0.035)_1px,transparent_1px,transparent_34px)] opacity-60" />
            </div>

            <div className="relative z-10 max-w-[740px]">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[12px] font-bold uppercase leading-4 tracking-[1.2px] text-[#E8B84B]">
                Analytics - Performance Dashboard
              </span>

              <h1 className="mt-6 text-[40px] font-bold leading-[48px] text-white sm:text-[48px]">
                {userFirstName}&apos;s{' '}
                <span className="font-serif italic text-[#E8B84B]">
                  Progress.
                </span>
              </h1>

              <p className="mt-5 max-w-[650px] text-[16px] leading-[26px] text-[#6A7282]">
                Your complete UPSC preparation analytics streaks, subject mastery, weak areas,
                spaced repetition &amp; smart notes.
              </p>

              <div className="mt-8 inline-flex items-center rounded-full border border-[#E8B84B]/35 bg-white/[0.07] px-5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <span className="mr-3 text-[18px]" aria-hidden>
                  🔥
                </span>
                <span className="text-[16px] font-bold leading-[22px] text-[#FFD43B]">
                  {daysToPrelims} days to UPSC Prelims 2026 - Keep going, you&apos;re on track!
                </span>
              </div>
            </div>
          </div>

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
            <AnalyticsCard className="px-6 py-7">
              <h2 className="mb-8 flex items-center gap-2 text-[20px] font-bold text-[#101828]">
                <span className="h-2 w-2 rounded-full bg-[#8B35F6]" />
                Study Time — This Week
              </h2>

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
            </AnalyticsCard>

            <AnalyticsCard className="px-6 py-7">
              <h2 className="mb-9 flex items-center gap-2 text-[20px] font-bold text-[#101828]">
                <span className="h-2 w-2 rounded-full bg-[#F28C32]" />
                Time Distribution — This Week
              </h2>

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
                      <span className="text-[16px] font-bold text-[#101828]">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </AnalyticsCard>
          </div>

          <SectionLabel>Strong &amp; Weak Areas</SectionLabel>
          <div className="mb-9 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AnalyticsCard className="px-6 py-7">
              <div className="mb-8 flex items-center justify-between gap-4">
                <h2 className="flex items-center gap-3 text-[20px] font-bold text-[#101828]">
                  <span className="text-[24px]" aria-hidden>💪</span>
                  Strong Areas
                </h2>
                <div className="hidden items-center gap-3 text-[13px] text-[#6A7282] sm:flex">
                  <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#4A7DFF]" />Accuracy</span>
                  <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#D1D5DB]" />Qs attempted</span>
                </div>
              </div>
              <SubjectList rows={strongAreas} />
            </AnalyticsCard>

            <AnalyticsCard className="px-6 py-7">
              <div className="mb-8 flex items-center justify-between gap-4">
                <h2 className="flex items-center gap-3 text-[20px] font-bold text-[#101828]">
                  <span className="text-[24px]" aria-hidden>⚠</span>
                  Weak Areas
                </h2>
                <a href="/dashboard/syllabus" className="text-[16px] font-medium text-[#155DFC]">
                  View Tracker +
                </a>
              </div>
              <SubjectList rows={weakAreas} weak />
            </AnalyticsCard>
          </div>

          <SectionLabel>Study Streak &amp; Daily Trio Progress</SectionLabel>
          <div className="mb-9 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AnalyticsCard className="px-6 py-7">
              <div className="mb-7 flex items-center justify-between gap-4">
                <h2 className="flex items-center gap-3 text-[20px] font-bold text-[#101828]">
                  <span aria-hidden>📅</span>
                  Study Streak — April 2026
                </h2>
                <span className="font-bold text-[#F2742F]">🔥 {currentStreak} Days!</span>
              </div>

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

              <div className="mb-6 grid grid-cols-7 gap-2 text-center text-[12px] text-[#6A7282]">
                {orderedDays.map((day) => <span key={day}>{day}</span>)}
                {Array.from({ length: 30 }, (_, index) => {
                  const day = index + 1;
                  const active = day <= Math.min(currentStreak, 30);
                  const highlighted = day === 23;

                  return (
                    <div
                      key={day}
                      className="flex aspect-square items-center justify-center rounded-[8px] text-[14px] font-semibold"
                      style={{
                        background: highlighted ? '#FFF7CC' : active ? '#58BE87' : '#EEF0F3',
                        border: highlighted ? '1px solid #E8B84B' : '1px solid transparent',
                        color: active ? '#FFFFFF' : '#101828',
                      }}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>

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
            </AnalyticsCard>

            <AnalyticsCard className="px-6 py-7">
              <h2 className="mb-7 flex items-center gap-3 text-[20px] font-bold text-[#101828]">
                <span aria-hidden>⚡</span>
                Daily Trio — This Week
              </h2>

              {[
                { icon: '📚', title: 'Daily MCQ Challenge', subtitle: 'Polity, Economy, Geography', value: Math.min(activeStudyDays, 7), color: '#58BE87' },
                { icon: '✍️', title: 'Daily Mains Challenge', subtitle: 'Answer Writing, AI Evaluated', value: Math.min(mains.totalAttempts ?? 0, 7), color: '#0E1830' },
                { icon: '📰', title: 'Daily News Analysis', subtitle: 'The Hindu, Indian Express', value: 0, color: '#E8B84B' },
              ].map((item) => (
                <div
                  key={item.title}
                  className="mb-8 rounded-[10px] border border-[#E5E7EB] bg-white px-5 py-4 shadow-sm last:mb-0"
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
                    <span className="text-[18px] text-[#99A1AF]">→</span>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] items-center gap-6">
                    <ProgressBar value={(item.value / 7) * 100} color={item.color} />
                    <span className="text-[14px] font-bold text-[#101828]">{item.value}/7 days</span>
                  </div>
                </div>
              ))}
            </AnalyticsCard>
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
                  <span className="text-[14px] text-[#4B5563]">All →</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {earnedBadges.map((badge) => (
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
                <span className="text-[13px] font-semibold text-[#258F7D]">View All →</span>
              </div>

              {analyticsData?.leaderboard?.length ? (
                <div className="space-y-3">
                  {analyticsData.leaderboard.slice(0, 8).map((entry: any, index: number) => (
                    <div key={entry.id ?? entry.name ?? index} className="flex items-center justify-between rounded-[8px] bg-[#F8FAFC] px-4 py-3">
                      <div className="flex items-center gap-4">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4A7DFF] font-bold text-white">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-[#101828]">{entry.name}</span>
                      </div>
                      <span className="font-bold text-[#258F7D]">{entry.score}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[10px] bg-[#F8FAFC] px-5 py-10 text-center">
                  <div className="text-[15px] font-semibold text-[#101828]">No leaderboard API data yet</div>
                  <p className="mx-auto mt-2 max-w-[360px] text-[13px] leading-5 text-[#6A7282]">
                    This section is wired to `analyticsData.leaderboard` and will populate once the backend exposes weekly ranks.
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
