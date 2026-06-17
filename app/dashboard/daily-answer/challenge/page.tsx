'use client';

import React, { Suspense, useEffect, useState, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { dailyAnswerService, leaderboardService } from '@/lib/services';
import Link from 'next/link';
import { handleEntitlementError } from '@/components/entitlements';
import { useEntitlements } from '@/contexts/EntitlementsContext';
import { useAuth } from '@/contexts/AuthContext';

interface QuestionData {
  id: string;
  questionText: string;
  paper: string;
  subject: string;
  marks: number;
  wordLimit: number;
  timeLimit: number;
  attemptCount: number;
  attempted?: boolean;
  attemptId?: string | null;
  evaluationStatus?: string | null;
  score?: number | null;
  maxScore?: number | null;
}

interface CalendarItem {
  date: string;
  title: string;
  paper: string;
  subject: string;
  marks: number;
  attempted: boolean;
  score: number | null;
  maxScore: number | null;
  evaluationStatus: string | null;
}

interface MainsLeagueUser {
  rank: number;
  userId: string;
  name: string;
  mainsAvg: number;
  streak: number;
}

type DailyAnswerSubmitResponse = {
  attemptId?: string;
  status?: string;
  message?: string;
  data?: {
    attemptId?: string;
    status?: string;
    data?: {
      attemptId?: string;
    };
  };
};

const READING_WINDOW_SECONDS = 15;

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return toDateStr(d);
}

function getMonthRange(dateStr: string): { start: string; end: string } {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
  return { start: toDateStr(start), end: toDateStr(end) };
}

function getCalendarGridCells(monthStart: string): Array<{ date: string; inMonth: boolean }> {
  const start = new Date(`${monthStart}T00:00:00.000Z`);
  const year = start.getUTCFullYear();
  const month = start.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const firstDow = (start.getUTCDay() + 6) % 7; // Monday=0..Sunday=6
  const cells: Array<{ date: string; inMonth: boolean }> = [];
  for (let i = firstDow; i > 0; i--) {
    const d = new Date(Date.UTC(year, month, 1 - i));
    cells.push({ date: toDateStr(d), inMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ date: toDateStr(new Date(Date.UTC(year, month, day))), inMonth: true });
  }
  return cells;
}

function getInitials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDateLabel(dateStr: string, todayStr: string): string {
  if (dateStr === addDaysStr(todayStr, -1)) return 'Yesterday';
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  const day = d.getUTCDate();
  const month = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const year = d.getUTCFullYear();
  return `${day} ${month}, ${year}`;
}

const SUBJECT_STYLES: Record<string, { bg: string; color: string }> = {
  'Science & Technology': { bg: '#CCFBF1', color: '#0F766E' },
  'Environment & Ecology': { bg: '#DCFCE7', color: '#15803D' },
  Polity: { bg: '#EFF6FF', color: '#1447E6' },
  Economy: { bg: '#FEF3C7', color: '#92400E' },
  History: { bg: '#FAF5FF', color: '#8200DB' },
  Geography: { bg: '#FCE7F3', color: '#BE185D' },
  Society: { bg: '#E0F2FE', color: '#0369A1' },
  Ethics: { bg: '#FFE4E6', color: '#BE123C' },
  Governance: { bg: '#ECFCCB', color: '#3F6212' },
  'International Relations': { bg: '#E0E7FF', color: '#4338CA' },
};
const DEFAULT_SUBJECT_STYLE = { bg: '#F3F4F6', color: '#374151' };
function subjectStyle(subject: string) {
  return SUBJECT_STYLES[subject] || DEFAULT_SUBJECT_STYLE;
}

interface UserBadgeStats {
  totalAttempts: number;
  streak: number;
  fastAttempts: number;
  perfectStructureCount: number;
  dataPoints: number;
  highScoreCount: number;
  isWeek2ProgressChampion: boolean;
}

interface BadgeDef {
  key: string;
  icon: string;
  name: string;
  desc: string;
  check: (stats: UserBadgeStats) => boolean;
}

const BADGES: BadgeDef[] = [
  { key: 'consistency', icon: '/badge-consistency.png', name: 'Consistency', desc: '14-day streak', check: s => s.streak >= 14 },
  { key: 'speed-writer', icon: '/badge-speed-writer.png', name: 'Speed Writer', desc: '5 under 10 min', check: s => s.fastAttempts >= 5 },
  { key: 'structure', icon: '/badge-structure.png', name: 'Structure', desc: 'Perfect 3/3', check: s => s.perfectStructureCount >= 3 },
  { key: 'data-master', icon: '/badge-data-master.png', name: 'Data Master', desc: '10+ data points', check: s => s.dataPoints >= 10 },
  { key: 'content-king', icon: '/badge-content-king.png', name: 'Content King', desc: 'Score 8+ in 5 answers', check: s => s.highScoreCount >= 5 },
  { key: 'most-improved', icon: '/badge-most-improved.png', name: 'Most Improved', desc: 'Week 2 Progress champion', check: s => s.isWeek2ProgressChampion },
];

function computeBadges(stats: UserBadgeStats) {
  const isFirstTimer = stats.totalAttempts === 0;
  return BADGES.map(b => ({
    ...b,
    locked: isFirstTimer || !b.check(stats),
  }));
}

function DailyMainsChallengeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entitlements = useEntitlements();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const todayStr = useMemo(() => toDateStr(new Date()), []);
  const dateParam = searchParams.get('date');
  const selectedDate = dateParam || todayStr;
  const isToday = selectedDate === todayStr;

  const [recentItems, setRecentItems] = useState<CalendarItem[]>([]);
  const [monthItems, setMonthItems] = useState<CalendarItem[]>([]);
  const [redirecting, setRedirecting] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<string>(() => {
    const d = new Date();
    return toDateStr(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)));
  });

  // TODO: replace with real user badge stats from API / context
  // First-time attempter: all badges stay locked/blurred until they earn them gradually.
  const badgeStats: UserBadgeStats = useMemo(() => ({
    totalAttempts: 0,
    streak: 0,
    fastAttempts: 0,
    perfectStructureCount: 0,
    dataPoints: 0,
    highScoreCount: 0,
    isWeek2ProgressChampion: false,
  }), []);
  const achievements = useMemo(() => computeBadges(badgeStats), [badgeStats]);

  const [data, setData] = useState<QuestionData | null>(null);
  const [mainsLeague, setMainsLeague] = useState<MainsLeagueUser[]>([]);
  const [myMainsRank, setMyMainsRank] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [challengeStarted, setChallengeStarted] = useState(false);
  const [textExpanded, setTextExpanded] = useState(false);
  const [openTip, setOpenTip] = useState<string | null>(null);
  const [readTimeLeft, setReadTimeLeft] = useState<number | null>(null);

  // Timer
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [isActive, setIsActive] = useState(false);

  // Answer
  const [answerText, setAnswerText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showQuotaModal, setShowQuotaModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    dailyAnswerService.getFullQuestion(selectedDate)
      .then(res => {
        if (res.data?.attempted && !isToday) {
          setRedirecting(true);
          router.replace(`/dashboard/daily-answer/challenge/attempt/results?date=${selectedDate}`);
          return;
        }
        setData(res.data);
        if (res.data?.timeLimit) setTimeLeft(res.data.timeLimit * 60);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedDate, isToday, router]);

  useEffect(() => {
    dailyAnswerService.getCalendar({ to: addDaysStr(todayStr, -1), limit: 3 })
      .then(res => setRecentItems(res.data?.items || []))
      .catch(() => setRecentItems([]));
  }, [todayStr]);

  useEffect(() => {
    const { end } = getMonthRange(calendarMonth);
    const to = end < todayStr ? end : todayStr;
    dailyAnswerService.getCalendar({ from: calendarMonth, to, limit: 31 })
      .then(res => setMonthItems(res.data?.items || []))
      .catch(() => setMonthItems([]));
  }, [calendarMonth, todayStr]);

  useEffect(() => {
    let cancelled = false;

    leaderboardService.getLeaderboard('mains', 'all')
      .then(res => {
        if (!cancelled && Array.isArray(res.data)) {
          setMainsLeague((res.data as MainsLeagueUser[]).slice(0, 10));
        }
      })
      .catch(() => {
        if (!cancelled) setMainsLeague([]);
      });

    leaderboardService.getMyRank('all')
      .then(res => {
        if (!cancelled) setMyMainsRank(res.data);
      })
      .catch(() => {
        if (!cancelled) setMyMainsRank(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (entitlements.loading) return;
    const quota = entitlements.featureStatus('mains_evaluation');
    if (quota?.allowed === false) setShowQuotaModal(true);
  }, [entitlements]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      if (interval) clearInterval(interval);
      setIsActive(false);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, timeLeft]);

  useEffect(() => {
    if (!challengeStarted || readTimeLeft === null) return;

    if (readTimeLeft <= 0) {
      setReadTimeLeft(null);
      setIsActive(true);
      return;
    }

    const timer = setTimeout(() => {
      setReadTimeLeft((prev) => (prev === null ? null : prev - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [challengeStarted, readTimeLeft]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const timerPct = data?.timeLimit ? (timeLeft / (data.timeLimit * 60)) * 100 : (timeLeft / 900) * 100;
  const circumference = 2 * Math.PI * 44;

  const mainsQuota = entitlements.featureStatus('mains_evaluation');

  const quotaModal = showQuotaModal && (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(16,24,40,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={() => setShowQuotaModal(false)}
    >
      <div
        className="relative w-full max-w-[420px] bg-white"
        style={{ borderRadius: '20px', padding: '32px 28px', boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setShowQuotaModal(false)}
          aria-label="Close popup"
          className="absolute flex items-center justify-center"
          style={{ top: '14px', right: '14px', width: '28px', height: '28px', borderRadius: '50%', background: '#F3F4F6', color: '#6A7282' }}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 2l10 10M12 2L2 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>

        <div className="mx-auto flex items-center justify-center" style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(232, 184, 75, 0.16)', marginBottom: '16px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Icon%20(13).png" alt="" style={{ width: '28px', height: '28px' }} />
        </div>

        <h2 className="text-center text-[#101828]" style={{ fontSize: '20px', fontWeight: 700, lineHeight: '28px', margin: '0 0 8px' }}>
          You&apos;ve used all your Mains evaluations
        </h2>
        <p className="text-center text-[#4A5565]" style={{ fontSize: '13px', lineHeight: '20px', margin: '0 0 20px' }}>
          {mainsQuota?.message || 'You have used your Mains evaluation quota for this period. Upgrade your plan to get more evaluations.'}
        </p>

        <Link href="/dashboard/billing/plans" className="block">
          <button
            type="button"
            className="w-full flex items-center justify-center"
            style={{ height: '48px', background: '#17223E', borderRadius: '12px', fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '10px' }}
          >
            View upgrade options
          </button>
        </Link>
        <button
          type="button"
          onClick={() => setShowQuotaModal(false)}
          className="w-full"
          style={{ height: '46px', background: 'transparent', border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '13px', fontWeight: 500, color: '#6A7282' }}
        >
          Maybe later
        </button>
      </div>
    </div>
  );

  const handleBeginChallenge = () => {
    setChallengeStarted(true);
    setIsActive(false);
    setReadTimeLeft(READING_WINDOW_SECONDS);
  };

  const VALID_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  const addFiles = (incoming: File[]) => {
    const errors: string[] = [];
    const valid: File[] = [];
    for (const file of incoming) {
      if (file.size > 10 * 1024 * 1024) { errors.push(`${file.name}: exceeds 10MB`); continue; }
      if (!VALID_TYPES.includes(file.type)) { errors.push(`${file.name}: unsupported type`); continue; }
      valid.push(file);
    }
    if (errors.length) setSubmitError(errors.join(', '));
    else setSubmitError(null);
    if (valid.length) setSelectedFiles(prev => [...prev, ...valid]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    addFiles(files);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) addFiles(files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileDragStart = (index: number) => setDraggingIndex(index);
  const handleFileDragEnter = (index: number) => setDragOverIndex(index);
  const handleFileDragEnd = () => {
    if (draggingIndex !== null && dragOverIndex !== null && draggingIndex !== dragOverIndex) {
      setSelectedFiles(prev => {
        const next = [...prev];
        const [moved] = next.splice(draggingIndex, 1);
        next.splice(dragOverIndex, 0, moved);
        return next;
      });
    }
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const handleSubmit = async () => {
    const quota = entitlements.featureStatus('mains_evaluation');
    if (quota?.allowed === false) {
      setShowQuotaModal(true);
      return;
    }
    if (!answerText.trim() && selectedFiles.length === 0) {
      setSubmitError('Please write your answer or upload a file before submitting.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = (selectedFiles.length > 0
        ? await dailyAnswerService.uploadFiles(selectedFiles, selectedDate)
        : await dailyAnswerService.submitText(answerText, selectedDate)) as DailyAnswerSubmitResponse;
      const attemptId = res.attemptId || res.data?.attemptId || res.data?.data?.attemptId;
      if (attemptId && typeof window !== 'undefined') {
        sessionStorage.setItem('dailyAnswerAttemptId', attemptId);
      }
      entitlements.refreshEntitlements();
      router.push('/dashboard/daily-answer/challenge/attempt/evaluating');
    } catch (err: any) {
      const parsed = handleEntitlementError(err);
      if (parsed.title === 'Limit reached' || parsed.title === 'Upgrade required') {
        setShowQuotaModal(true);
      } else {
        setSubmitError(parsed.message || 'Failed to submit answer. Please try again.');
      }
      setSubmitting(false);
    }
  };

  if (loading || redirecting) {
    return (
      <div className="flex bg-[#F3F4F6] font-arimo" style={{ height: '100%', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex bg-[#F3F4F6] font-arimo" style={{ height: '100%', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Could not load question</h2>
          <p className="text-gray-500">{error || 'Please try again later.'}</p>
          <Link href="/dashboard/daily-answer" className="mt-4 inline-block text-blue-600 hover:underline">Back</Link>
        </div>
      </div>
    );
  }

  // ── PRE-CHALLENGE: single screen, no scroll ────────────────────────────────
  if (!challengeStarted) {
    return (
      <div className="flex flex-col bg-[#F3F4F6] font-arimo" style={{ minHeight: '100%', overflowY: 'auto' }}>
        {quotaModal}
        <div className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 w-full max-w-[1200px] mx-auto">

          {/* Badge */}
          <div
            className="flex items-center justify-center gap-2 px-4 py-1.5 mb-4"
            style={{ borderRadius: '26px', border: '0.8px solid #E9D4FF', background: '#FAF5FF', width: 'fit-content' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Icon%20(5).png" alt="" style={{ width: '16px', height: '16px' }} />
            <span style={{ color: '#8200DB', fontSize: '14px', fontWeight: 500 }}>Practice. Evaluate. Improve</span>
          </div>

          {/* Title */}
          <h1
            className="text-center text-[#17223E] mb-3"
            style={{ fontSize: 'clamp(28px, 3vw, 42px)', lineHeight: '1.2', fontWeight: 400 }}
          >
            <span className="block">Daily Answer Writing with</span>
            <span className="block">Detailed Feedback &amp; Evaluation</span>
          </h1>

          {/* Description */}
          <p className="text-center text-[#4A5565] mb-6 px-4" style={{ fontSize: '15px', lineHeight: '22px', maxWidth: '720px' }}>
            Practice one UPSC level question every day. Get structured feedback,
            personalized insights, model answers, and actionable improvement points to steadily boost your mains scores.
          </p>

          {/* Question Card */}
          <div
            className="relative rounded-[24px] w-full p-4 sm:p-6 lg:px-8"
            style={{ maxWidth: '1091px', boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A', background: '#FFFFFF' }}
          >
            {/* Tags row */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center px-3 py-1.5 rounded-[10px]" style={{ background: '#FAF5FF', boxShadow: '0px 1px 2px -1px #0000001A' }}>
                  <span style={{ fontSize: '14px', color: '#8200DB' }}>{data.paper}</span>
                </div>
                <div className="flex items-center px-3 py-1.5 bg-[#EFF6FF] rounded-[10px]" style={{ boxShadow: '0px 1px 2px -1px #0000001A' }}>
                  <span style={{ fontSize: '14px', color: '#1447E6' }}>{data.subject}</span>
                </div>
              </div>
              <div className="flex items-center px-4 py-1 gap-2" style={{ background: '#FEF2F2', border: '0.8px solid #FFC9C9', borderRadius: '20px' }}>
                <div className="w-2 h-2 bg-[#DC2626] live-siren-dot" />
                <span style={{ color: '#DC2626', fontSize: '12px', fontWeight: 700 }}>LIVE NOW</span>
              </div>
            </div>

            {/* Question */}
            <div className="mb-5 p-5 rounded-[10px] bg-[#F9FAFB]" style={{ boxShadow: '0px 1px 2px -1px #0000001A', borderLeft: '4px solid #C9A84C' }}>
              <p className="text-[#101828] italic" style={{ fontSize: '16px', lineHeight: '26px', fontFamily: 'var(--font-merriweather)' }}>
                &quot;{data.questionText}&quot;
              </p>
            </div>

            {/* Meta + Actions */}
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-[#4A5565]" style={{ fontSize: '14px' }}>
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/Icon%20(8).png" alt="" style={{ width: '20px', height: '20px' }} />
                  <span>Time: {data.timeLimit} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/Icon%20(7).png" alt="" style={{ width: '20px', height: '20px' }} />
                  <span>Word limit: {data.wordLimit} words</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/Icon%20(6).png" alt="" style={{ width: '20px', height: '20px' }} />
                  <span>Marks: {data.marks}</span>
                </div>
              </div>

              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:w-auto">
                  <button
                    onClick={handleBeginChallenge}
                    className="bg-[#17223E] text-white flex w-full items-center justify-center gap-2 transition-transform hover:scale-105"
                    style={{ minHeight: '52px', borderRadius: '14px', fontSize: '17px', fontWeight: 700, boxShadow: '0px 10px 15px -3px rgba(0,0,0,0.1)', padding: '10px 18px' }}
                  >
                    🚀 Begin Challenge
                  </button>
                  <button
                    className="bg-[#17223E] text-white flex w-full items-center justify-center gap-2 transition-transform hover:scale-105"
                    style={{ minHeight: '52px', borderRadius: '14px', fontSize: '16px', fontWeight: 700, boxShadow: '0px 10px 15px -3px rgba(0,0,0,0.1)', padding: '10px 18px' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/Icon%20(9).png" alt="" style={{ width: '24px', height: '24px' }} />
                    Attempt Challenge on App
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-blue-400 border-2 border-white" />
                    <div className="w-8 h-8 rounded-full bg-green-400 border-2 border-white" />
                    <div className="w-8 h-8 rounded-full bg-purple-400 border-2 border-white" />
                  </div>
                  <span className="text-[#4A5565]" style={{ fontSize: '14px' }}>{data.attemptCount}+ Students already attempted</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Past Challenges ── */}
          <div className="w-full mt-10" style={{ maxWidth: '1091px' }}>
            <div
              className="rounded-[16px] bg-white"
              style={{ boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A', padding: '22px 26px' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icon-folder.png" alt="" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                  <h2 className="font-bold text-[#101828]" style={{ fontSize: '18px' }}>Past Challenges</h2>
                </div>
                <Link href="/dashboard/daily-answer/history" className="text-[#0F766E] hover:underline" style={{ fontSize: '13px', fontWeight: 500 }}>
                  View All →
                </Link>
              </div>
              <div className="flex flex-col gap-3">
                {recentItems.length === 0 && (
                  <p className="text-[#6A7282]" style={{ fontSize: '13px' }}>No past challenges yet.</p>
                )}
                {recentItems.map((c) => {
                  const style = subjectStyle(c.subject);
                  return (
                    <Link
                      key={c.date}
                      href={`/dashboard/daily-answer/challenge?date=${c.date}`}
                      className="block rounded-[10px] bg-[#F9FAFB] transition hover:opacity-90"
                      style={{ borderLeft: '3px solid #17223E', padding: '14px 18px' }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold" style={{ background: '#2B7FFF', fontSize: '12px', padding: '4px 12px', borderRadius: '999px' }}>{c.paper}</span>
                          <span className="font-medium" style={{ background: style.bg, color: style.color, fontSize: '12px', padding: '4px 12px', borderRadius: '999px' }}>{c.subject}</span>
                        </div>
                        <span className="text-[#6A7282]" style={{ fontSize: '12px' }}>{formatDateLabel(c.date, todayStr)}</span>
                      </div>
                      <p className="text-[#101828] font-bold mb-2" style={{ fontSize: '14px', lineHeight: '20px' }}>{c.title}</p>
                      <p className="text-[#4A5565]" style={{ fontSize: '12px' }}>
                        {c.score != null
                          ? <>Score: <span className="font-bold text-[#101828]">{c.score}/{c.maxScore}</span></>
                          : c.attempted
                            ? `Evaluation ${c.evaluationStatus}`
                            : 'Not attempted yet'}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Two-column: (Calendar + Progress + Achievements) | Mains League ── */}
          <div className="mt-5 grid w-full grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]" style={{ maxWidth: '1091px' }}>

            {/* LEFT COLUMN */}
            <div className="flex flex-col gap-5">

              {/* Calendar */}
              <div className="bg-white rounded-[16px]" style={{ padding: '20px 22px', boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A' }}>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icon-calendar.png" alt="" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                    <span className="font-bold text-[#101828]" style={{ fontSize: '15px' }}>
                      {new Date(`${calendarMonth}T00:00:00.000Z`).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date(`${calendarMonth}T00:00:00.000Z`);
                        setCalendarMonth(toDateStr(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1))));
                      }}
                      className="flex items-center justify-center rounded-md border border-[#E5E7EB] hover:bg-[#F3F4F6] transition-colors"
                      style={{ width: '28px', height: '28px' }}
                      aria-label="Previous month"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date(`${calendarMonth}T00:00:00.000Z`);
                        const next = toDateStr(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)));
                        if (next <= todayStr) setCalendarMonth(next);
                      }}
                      disabled={calendarMonth >= getMonthRange(todayStr).start}
                      className="flex items-center justify-center rounded-md border border-[#E5E7EB] hover:bg-[#F3F4F6] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ width: '28px', height: '28px' }}
                      aria-label="Next month"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7" style={{ gap: '6px' }}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                    <div key={`dow-${i}`} className="text-center text-[#6A7282]" style={{ fontSize: '12px', fontWeight: 600, padding: '4px 0' }}>{d}</div>
                  ))}
                  {getCalendarGridCells(calendarMonth).map((cell, i) => {
                    const dayLabel = String(new Date(`${cell.date}T00:00:00.000Z`).getUTCDate());
                    const item = monthItems.find((m) => m.date === cell.date);
                    const isToday2 = cell.date === todayStr;
                    let bg = 'transparent';
                    let color = '#D1D5DB';
                    let bold = false;

                    if (cell.inMonth) {
                      if (item) {
                        color = '#101828';
                        if (item.attempted) { bg = '#A7F3D0'; color = '#065F46'; }
                      }
                      if (isToday2) { bg = '#0F766E'; color = '#FFFFFF'; bold = true; }
                    }

                    const cellNode = (
                      <div
                        className="flex items-center justify-center rounded-md"
                        style={{ height: '34px', fontSize: '12px', fontWeight: bold ? 700 : 600, background: bg, color }}
                      >
                        {dayLabel}
                      </div>
                    );

                    if (cell.inMonth && !isToday2 && item && cell.date <= todayStr) {
                      return (
                        <Link key={`d-${i}`} href={`/dashboard/daily-answer/challenge?date=${cell.date}`}>
                          {cellNode}
                        </Link>
                      );
                    }
                    return <div key={`d-${i}`}>{cellNode}</div>;
                  })}
                </div>
              </div>

              {/* Your Progress */}
              <div className="bg-white rounded-[16px]" style={{ padding: '20px 22px', boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A' }}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icon-progress-chart.png" alt="" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                    <span className="font-bold text-[#101828]" style={{ fontSize: '15px' }}>Your Progress</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-lg" style={{ background: '#DCFCE7' }}>
                    <span className="font-bold" style={{ color: '#15803D', fontSize: '16px' }}>47</span>
                    <div className="flex flex-col leading-tight">
                      <span className="font-bold" style={{ color: '#15803D', fontSize: '11px' }}>Day Streak</span>
                      <span style={{ color: '#15803D', fontSize: '10px' }}>Keep going!</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 items-end gap-4">
                  <div className="text-center rounded-[12px] bg-[#F8F9FA]" style={{ padding: '14px 8px' }}>
                    <div className="font-bold text-[#101828]" style={{ fontSize: '28px', lineHeight: '32px' }}>89</div>
                    <div className="text-[#4A5565] mt-1" style={{ fontSize: '12px' }}>Questions Attempted</div>
                  </div>
                  <div className="text-center rounded-[12px] bg-[#F8F9FA]" style={{ padding: '14px 8px' }}>
                    <div className="font-bold text-[#101828]" style={{ fontSize: '28px', lineHeight: '32px' }}>7.2</div>
                    <div className="text-[#4A5565] mt-1" style={{ fontSize: '12px' }}>Avg. Score / 10</div>
                  </div>
                </div>
              </div>

              {/* Achievements */}
              <div className="bg-white rounded-[16px]" style={{ padding: '20px 22px', boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A' }}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icon-trophy.png" alt="" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                    <span className="font-bold text-[#101828]" style={{ fontSize: '15px' }}>Achievements</span>
                  </div>
                  <Link href="/dashboard/achievement-badges" className="text-[#0F766E] hover:underline" style={{ fontSize: '12px', fontWeight: 500 }}>All Badges →</Link>
                </div>
                <div className="grid grid-cols-2" style={{ gap: '10px' }}>
                  {achievements.map((a) => (
                    <Link
                      key={a.key}
                      href="/dashboard/achievement-badges"
                      className="block rounded-[10px] text-center transition hover:opacity-90"
                      style={{
                        padding: '14px 10px',
                        background: a.locked ? '#F3F4F6' : 'rgba(232, 184, 75, 0.14)',
                        border: a.locked ? '1px solid #E5E7EB' : '1px solid rgba(232, 184, 75, 0.35)',
                        filter: a.locked ? 'blur(2px)' : 'none',
                        opacity: a.locked ? 0.75 : 1,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.icon} alt={a.name} style={{ width: '32px', height: '32px', objectFit: 'contain', margin: '0 auto 4px' }} />
                      <div className="font-bold text-[#101828]" style={{ fontSize: '13px' }}>{a.name}</div>
                      <div className="text-[#6A7282] mt-0.5" style={{ fontSize: '11px' }}>{a.desc}</div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Mains League */}
            <div className="bg-white rounded-[16px]" style={{ padding: '20px 22px', boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A' }}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icon-medal.png" alt="" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                  <span className="font-bold text-[#101828]" style={{ fontSize: '15px', background: '#E8B84B', padding: '0 6px', borderRadius: '2px' }}>Mains League</span>
                </div>
                <Link href="/dashboard/leaderboard?tab=mains" className="text-[#0F766E] hover:underline" style={{ fontSize: '12px', fontWeight: 500 }}>View All →</Link>
              </div>
              <div className="flex flex-col gap-2">
                {mainsLeague.map((row, i) => (
                  <div
                    key={row.userId}
                    className="flex min-w-0 items-center justify-between gap-3 rounded-lg"
                    style={{ background: '#F9FAFB', padding: '8px 14px' }}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="text-center font-bold text-[#9AA3B8]" style={{ width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>
                        {i < 3 ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={i === 0 ? '/medal-gold.png' : i === 1 ? '/medal-silver.png' : '/medal-bronze.png'} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                        ) : (
                          row.rank
                        )}
                      </span>
                      <div className="rounded-full bg-[#101828] text-white flex items-center justify-center font-bold flex-shrink-0" style={{ width: '28px', height: '28px', fontSize: '11px' }}>{getInitials(row.name)}</div>
                      <span className="min-w-0 break-words font-bold text-[#101828]" style={{ fontSize: '13px' }}>{row.name}</span>
                    </div>
                    <span className="font-bold text-[#0F766E]" style={{ fontSize: '13px' }}>{Math.round(row.mainsAvg * 10) / 10}</span>
                  </div>
                ))}
                <div
                  className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-lg mt-2"
                  style={{ border: '2px solid #2B7FFF', background: '#EFF6FF', padding: '8px 14px' }}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="text-center font-bold text-[#9AA3B8]" style={{ width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>
                      {myMainsRank?.mainsRank ?? '-'}
                    </span>
                    <div className="rounded-full bg-[#F59E0B] text-white flex items-center justify-center font-bold flex-shrink-0" style={{ width: '28px', height: '28px', fontSize: '11px' }}>
                      {getInitials(myMainsRank?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' '))}
                    </div>
                    <span className="text-[#101828]" style={{ fontSize: '13px' }}>You · {Math.round((myMainsRank?.mainsAvg ?? 0) * 10) / 10} avg · {myMainsRank?.streak ?? 0} streak</span>
                  </div>
                  <span className="font-bold text-[#15803D]" style={{ fontSize: '13px' }}>Live</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ── CHALLENGE STARTED: question + timer side-by-side, answer below ─────────
  return (
    <div className="bg-[#F3F4F6] font-arimo" style={{ height: '100%', overflowY: 'auto' }}>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .slide-up { animation: slideUp 0.35s ease forwards; }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {quotaModal}

      <div className="flex flex-col lg:flex-row px-4 sm:px-6 py-5 w-full max-w-[1200px] mx-auto slide-up gap-5 items-start">

        {/* ── LEFT COLUMN: Question + Answer Submission ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">

          {/* Compact Question Card */}
          <div
            className="bg-white rounded-[20px]"
            style={{ padding: '20px 24px', boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A' }}
          >
            {/* Tags */}
            <div className="flex items-center flex-wrap gap-2 sm:gap-3 mb-4">
              <div className="flex items-center px-3 py-1 rounded-[8px]" style={{ background: '#FAF5FF' }}>
                <span style={{ fontSize: '13px', color: '#8200DB' }}>{data.paper}</span>
              </div>
              <div className="flex items-center px-3 py-1 bg-[#EFF6FF] rounded-[8px]">
                <span style={{ fontSize: '13px', color: '#1447E6' }}>{data.subject}</span>
              </div>
              <div className="ml-auto flex items-center px-3 py-1 gap-2" style={{ background: '#FEF2F2', border: '0.8px solid #FFC9C9', borderRadius: '20px' }}>
                <div className="w-1.5 h-1.5 bg-[#DC2626] live-siren-dot" />
                <span style={{ color: '#DC2626', fontSize: '11px', fontWeight: 700 }}>LIVE NOW</span>
              </div>
            </div>

            {/* Question text */}
            <div className="rounded-[10px] bg-[#F9FAFB] p-4 mb-4" style={{ boxShadow: '0px 1px 2px -1px #0000001A', borderLeft: '4px solid #C9A84C' }}>
              <p className="text-[#101828] italic" style={{ fontSize: '16px', lineHeight: '26px', fontFamily: 'var(--font-merriweather)' }}>
                &quot;{data.questionText}&quot;
              </p>
            </div>

            {/* Meta */}
            <div className="flex items-center flex-wrap gap-x-6 gap-y-2 text-[#4A5565]" style={{ fontSize: '13px' }}>
              <div className="flex items-center gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Icon%20(8).png" alt="" style={{ width: '16px', height: '16px' }} />
                <span>{data.timeLimit} min</span>
              </div>
              <div className="flex items-center gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Icon%20(7).png" alt="" style={{ width: '16px', height: '16px' }} />
                <span>{data.wordLimit} words</span>
              </div>
              <div className="flex items-center gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Icon%20(6).png" alt="" style={{ width: '16px', height: '16px' }} />
                <span>{data.marks} marks</span>
              </div>
            </div>
          </div>

          {/* ── Answer Submission ── */}
          <div
            className="bg-white rounded-[20px] p-5 sm:p-7 lg:px-9"
            style={{ boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A' }}
          >
          {/* ── Upload zone: hidden when text mode is active ── */}
          {!textExpanded && (
            <>
              <div
                className="rounded-[14px] flex flex-col items-center mb-4 cursor-pointer"
                style={{
                  width: '100%',
                  border: isDragging ? '2px dashed #3B82F6' : '1px dashed #CBD5E1',
                  backgroundColor: isDragging ? '#EFF6FF' : '#F9FAFB',
                  padding: '28px 20px 20px',
                  transition: 'border-color 0.15s, background-color 0.15s',
                }}
                onMouseEnter={(e) => { if (!isDragging) { e.currentTarget.style.borderColor = '#17223E'; e.currentTarget.style.backgroundColor = 'rgba(23, 34, 62, 0.06)'; } }}
                onMouseLeave={(e) => { if (!isDragging) { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.backgroundColor = '#F9FAFB'; } }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={selectedFiles.length === 0 ? () => fileInputRef.current?.click() : undefined}
              >
                <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" multiple onChange={handleFileSelect} className="hidden" />

                {selectedFiles.length > 0 ? (
                  <div className="w-full" onClick={e => e.stopPropagation()}>
                    {/* File list with drag-to-reorder */}
                    <div className="flex flex-col gap-2 mb-3">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          draggable
                          onDragStart={() => handleFileDragStart(index)}
                          onDragEnter={() => handleFileDragEnter(index)}
                          onDragEnd={handleFileDragEnd}
                          onDragOver={e => e.preventDefault()}
                          className="flex items-center gap-3 bg-white rounded-[8px] px-3 py-2.5 select-none"
                          style={{
                            border: dragOverIndex === index && draggingIndex !== index ? '1.5px solid #17223E' : '1px solid #E5E7EB',
                            opacity: draggingIndex === index ? 0.4 : 1,
                            cursor: 'grab',
                            transition: 'opacity 0.15s, border-color 0.1s',
                          }}
                        >
                          {/* Drag handle */}
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: '#9CA3AF' }}>
                            <circle cx="5" cy="4" r="1.2" fill="currentColor"/>
                            <circle cx="11" cy="4" r="1.2" fill="currentColor"/>
                            <circle cx="5" cy="8" r="1.2" fill="currentColor"/>
                            <circle cx="11" cy="8" r="1.2" fill="currentColor"/>
                            <circle cx="5" cy="12" r="1.2" fill="currentColor"/>
                            <circle cx="11" cy="12" r="1.2" fill="currentColor"/>
                          </svg>
                          {/* Page number badge */}
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#17223E] text-white flex items-center justify-center" style={{ fontSize: '10px', fontWeight: 700 }}>
                            {index + 1}
                          </span>
                          {/* File icon */}
                          <span style={{ fontSize: '16px', flexShrink: 0 }}>
                            {file.type.startsWith('image/') ? '🖼️' : '📄'}
                          </span>
                          {/* Name + size */}
                          <span className="flex-1 text-[#101828] font-medium truncate" style={{ fontSize: '13px' }}>{file.name}</span>
                          <span className="text-[#9CA3AF] flex-shrink-0" style={{ fontSize: '11px' }}>{(file.size / 1024 / 1024).toFixed(1)}MB</span>
                          {/* Remove */}
                          <button
                            onClick={() => removeFile(index)}
                            className="flex-shrink-0 text-[#9CA3AF] hover:text-red-500 transition-colors"
                            style={{ lineHeight: 1 }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-center text-[#9CA3AF] mb-2" style={{ fontSize: '11px' }}>Drag rows to reorder pages</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full bg-white border border-[#D1D5DB] text-[#111827] font-bold rounded-[8px] hover:bg-gray-50 transition-colors"
                      style={{ height: '36px', fontSize: '13px' }}
                    >
                      + Add More Files
                    </button>
                  </div>
                ) : (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/upload-icon.png" alt="" style={{ width: '48px', height: '48px', objectFit: 'contain', marginBottom: '12px' }} />
                    <p className="font-bold text-[#101828] mb-1" style={{ fontSize: '15px' }}>Drop your answer script here</p>
                    <p className="text-[#4A5565] mb-3" style={{ fontSize: '13px' }}>Upload handwritten answers for AI evaluation</p>
                    <div className="flex gap-2 mb-4 flex-wrap justify-center">
                      {['JPG', 'PNG', 'PDF', 'Max 10MB'].map(f => (
                        <span key={f} className="px-2.5 py-1 bg-[#E5E7EB] rounded text-[#374151]" style={{ fontSize: '12px' }}>{f}</span>
                      ))}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      className="bg-white border border-[#D1D5DB] text-[#111827] font-bold rounded-[8px] hover:bg-gray-50 transition-colors"
                      style={{ width: '130px', height: '38px', fontSize: '14px' }}
                    >
                      Browse Files
                    </button>
                  </>
                )}
              </div>

              {/* ── "▼ OR Type your answer" toggle (collapsed state) ── */}
              <button
                onClick={() => setTextExpanded(true)}
                className="w-full flex items-center gap-3 mb-1 group"
              >
                <div className="flex-1 h-px bg-[#E5E7EB]" />
                <span
                  className="flex items-center gap-1.5 text-[#4A5565] group-hover:text-[#17223E] transition-colors select-none"
                  style={{ fontSize: '13px', whiteSpace: 'nowrap' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  OR Type your answer
                </span>
                <div className="flex-1 h-px bg-[#E5E7EB]" />
              </button>
            </>
          )}

          {/* ── Text mode: upload zone hidden, show "▲ Hide" + textarea ── */}
          {textExpanded && (
            <>
              {/* "▲ Hide" toggle */}
              <button
                onClick={() => setTextExpanded(false)}
                className="w-full flex items-center gap-3 mb-4 group"
              >
                <div className="flex-1 h-px bg-[#E5E7EB]" />
                <span
                  className="flex items-center gap-1.5 text-[#4A5565] group-hover:text-[#17223E] transition-colors select-none"
                  style={{ fontSize: '13px', whiteSpace: 'nowrap' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Hide
                </span>
                <div className="flex-1 h-px bg-[#E5E7EB]" />
              </button>

              <div className="mb-4" style={{ animation: 'slideDown 0.2s ease' }}>
                <textarea
                  id="answer-text"
                  value={answerText}
                  onChange={e => { setAnswerText(e.target.value); if (submitError) setSubmitError(null); }}
                  placeholder="Write your answer here..."
                  autoFocus
                  className="w-full rounded-[10px] border border-[#D1D5DB] bg-[#F9FAFB] p-4 text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#17223E] focus:border-transparent resize-vertical"
                  style={{ minHeight: '160px', fontSize: '15px', lineHeight: '24px' }}
                />
                <p className="mt-1 text-right text-[#6A7282]" style={{ fontSize: '12px' }}>
                  {answerText.trim().split(/\s+/).filter(Boolean).length} words
                </p>
              </div>
            </>
          )}

          {/* Evaluation quota status banner */}
          {!entitlements.loading && mainsQuota && (
            mainsQuota.allowed === false ? (
              <div
                className="mt-4 flex items-center justify-between gap-3 px-4 py-3 rounded-[12px]"
                style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
              >
                <div className="flex items-center gap-3">
                  <span style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '16px' }}>⚠️</span>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#B91C1C' }}>🔒 Evaluation limit reached</p>
                    <p style={{ fontSize: '12px', color: '#6A7282', marginTop: '1px' }}>
                      {mainsQuota.message || 'You have used your 1 free lifetime evaluation. Upgrade to continue.'}
                    </p>
                  </div>
                </div>
                <Link href="/dashboard/billing/plans">
                  <button style={{ flexShrink: 0, padding: '8px 18px', borderRadius: '10px', background: '#17223E', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Upgrade
                  </button>
                </Link>
              </div>
            ) : mainsQuota.remaining !== null ? (
              <div
                className="mt-4 flex items-center gap-3 px-4 py-3 rounded-[12px]"
                style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}
              >
                <span style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '16px' }}>✅</span>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#166534' }}>✅ Free evaluation available</p>
                  <p style={{ fontSize: '12px', color: '#4A5565', marginTop: '1px' }}>
                    {mainsQuota.remaining} of {mainsQuota.limit ?? mainsQuota.remaining} free evaluation{(mainsQuota.limit ?? mainsQuota.remaining) !== 1 ? 's' : ''} remaining
                  </p>
                </div>
              </div>
            ) : null
          )}

          {submitError && (
            <div className="mt-4 mb-3 px-4 py-3 bg-red-50 border border-red-200 rounded-[10px] text-red-700" style={{ fontSize: '13px' }}>
              {submitError}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || (selectedFiles.length === 0 && !answerText.trim())}
            className="w-full flex items-center justify-center gap-2 text-white font-bold transition-transform hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 mt-4 mb-3"
            style={{ height: '52px', background: '#17223E', borderRadius: '14px', fontSize: '16px', boxShadow: '0px 10px 15px -3px rgba(0,0,0,0.1)' }}
          >
            {submitting ? (
              <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />Submitting...</>
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Icon%20(13).png" alt="" style={{ width: '22px', height: '22px' }} />Submit Answer for Evaluation
              </>
            )}
          </button>

          </div>
        </div>

        {/* ── RIGHT COLUMN: Timer + Quick Tips ── */}
        <div className="w-full lg:w-[280px] flex-shrink-0 flex flex-col gap-5">

          {/* Timer Card */}
          <div
            className="bg-white rounded-[20px] flex flex-col items-center justify-center"
            style={{ padding: '20px', boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A' }}
          >
            <div className="uppercase tracking-widest text-[#6A7282] mb-3" style={{ fontSize: '11px', fontWeight: 600 }}>
              Writing Timer
            </div>

            <div className="relative flex items-center justify-center mb-3" style={{ width: '100px', height: '100px' }}>
              <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="44" fill="none" stroke="#F3F4F6" strokeWidth="6" />
                <circle
                  cx="50" cy="50" r="44" fill="none"
                  stroke={isActive ? '#00BC7D' : timeLeft === 0 ? '#EF4444' : '#101828'}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - timerPct / 100)}
                  style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
                />
              </svg>
              <span className="absolute font-bold" style={{ fontSize: '22px', color: '#101828', fontFamily: 'Arimo' }}>
                {formatTime(timeLeft)}
              </span>
            </div>

            <div className="uppercase tracking-widest text-[#6A7282] mb-4" style={{ fontSize: '10px', fontWeight: 600 }}>
              {readTimeLeft !== null
                ? `Auto-start in ${readTimeLeft}s`
                : isActive
                  ? 'In Progress'
                  : timeLeft === 0
                    ? 'Time Up'
                    : 'Paused'}
            </div>

            {readTimeLeft !== null && (
              <p className="text-center text-[#4A5565] mb-4" style={{ fontSize: '12px', lineHeight: '18px' }}>
                Reading time is live. The writing timer will begin automatically so students can first read the full question.
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (readTimeLeft !== null) {
                    setReadTimeLeft(null);
                    setIsActive(true);
                    return;
                  }
                  setIsActive((active) => !active);
                }}
                className="flex items-center justify-center gap-1.5 text-white font-bold transition-transform hover:scale-105"
                style={{
                  width: '110px', height: '40px',
                  background: readTimeLeft !== null ? '#17223E' : isActive ? '#DC2626' : '#00BC7D',
                  borderRadius: '10px', fontSize: '14px'
                }}
              >
                {readTimeLeft !== null ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M8 5.5v13l10-6.5-10-6.5Z" fill="currentColor" />
                  </svg>
                ) : isActive ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M8 5v14M16 5v14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M8 5.5v13l10-6.5-10-6.5Z" fill="currentColor" />
                  </svg>
                )}
                {readTimeLeft !== null ? 'Start now' : isActive ? 'Pause' : 'Resume'}
              </button>
              <button
                onClick={() => {
                  setIsActive(false);
                  setReadTimeLeft(READING_WINDOW_SECONDS);
                  setTimeLeft(data.timeLimit * 60);
                }}
                className="flex items-center justify-center gap-1.5 bg-white border border-[#D1D5DB] text-[#374151] font-bold transition-transform hover:scale-105"
                style={{ width: '80px', height: '40px', borderRadius: '10px', fontSize: '14px' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Icon%20(10).png" alt="" style={{ width: '16px', height: '16px' }} />
                Reset
              </button>
            </div>
          </div>

          {/* Quick Tips for Best Evaluation */}
          <div
            className="bg-white rounded-[20px] overflow-hidden"
            style={{ boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A' }}
          >
            <div className="flex items-center gap-2 px-5 py-4" style={{ background: '#FEFCE8', borderBottom: '1px solid #FEF08A' }}>
              <span style={{ fontSize: '18px' }}>💡</span>
              <span className="font-bold text-[#101828] tracking-wide" style={{ fontSize: '13px', letterSpacing: '0.04em' }}>QUICK TIPS FOR BEST EVALUATION</span>
            </div>
            {[
              {
                key: 'ink',
                icon: '✏️',
                label: 'Ink & Paper',
                points: [
                  'Use dark blue or black ink only',
                  'Unruled sheets work best for evaluation',
                  'Avoid pencil — AI may miss faint marks',
                ],
              },
              {
                key: 'photo',
                icon: '📷',
                label: 'Photography',
                points: [
                  'Take photos in bright, shadow-free lighting',
                  'Keep camera parallel to paper (no angle)',
                  'Avoid reflections — turn off flash if needed',
                ],
              },
              {
                key: 'format',
                icon: '📝',
                label: 'Writing Format',
                points: [
                  'Leave proper margins on both sides',
                  'Write question numbers clearly at the top',
                  'Upload all pages in correct order (P1, P2...)',
                ],
              },
              {
                key: 'accuracy',
                icon: '🎯',
                label: 'For Accuracy',
                points: [
                  'Adding the question text can improve accuracy',
                  'Number each page if multi-page answer',
                  'Keep handwriting legible — not too rushed',
                ],
              },
            ].map((tip) => (
              <div key={tip.key} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <button
                  type="button"
                  onClick={() => setOpenTip(openTip === tip.key ? null : tip.key)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#F9FAFB] transition-colors text-left"
                >
                  <span className="flex items-center gap-2 font-semibold text-[#101828]" style={{ fontSize: '14px' }}>
                    <span>{tip.icon}</span>
                    {tip.label}
                  </span>
                  <svg
                    width="10" height="10" viewBox="0 0 24 24" fill="none"
                    style={{ flexShrink: 0, color: '#9CA3AF', transition: 'transform 0.2s', transform: openTip === tip.key ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {openTip === tip.key && (
                  <div className="px-5 pb-4" style={{ animation: 'slideDown 0.15s ease' }}>
                    {tip.points.map((pt, i) => (
                      <div key={i} className="flex items-start gap-3 mb-2">
                        <span className="font-bold mt-0.5 flex-shrink-0" style={{ color: '#0F766E', fontSize: '14px' }}>✓</span>
                        <span className="text-[#4A5565]" style={{ fontSize: '13px', lineHeight: '20px' }}>{pt}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}

export default function DailyMainsChallengeContextPage() {
  return (
    <Suspense fallback={
      <div className="flex bg-[#F3F4F6] font-arimo" style={{ height: '100%', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    }>
      <DailyMainsChallengeInner />
    </Suspense>
  );
}
