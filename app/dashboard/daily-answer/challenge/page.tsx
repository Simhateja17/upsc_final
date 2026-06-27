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
      <div className="flex bg-[#F5F6F8] font-jakarta" style={{ height: '100%', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex bg-[#F5F6F8] font-jakarta" style={{ height: '100%', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
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
      <div className="flex flex-col bg-[#F5F6F8] font-jakarta" style={{ minHeight: '100%', overflowY: 'auto' }}>
        {quotaModal}
        <div className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 w-full max-w-[1200px] mx-auto">

          <style>{`
            @keyframes dms-livePulse {
              0%   { box-shadow: 0 0 0 0 rgba(220,38,38,0.55); }
              70%  { box-shadow: 0 0 0 8px rgba(220,38,38,0); }
              100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
            }
            .dms-livedot { width:8px; height:8px; border-radius:50%; background:#DC2626; display:inline-block; animation:dms-livePulse 1.6s ease infinite; }
            .dms-av { width:26px; height:26px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; color:#fff; border:2px solid #fff; }
            .dms-chip { display:inline-flex; align-items:center; gap:5px; padding:5px 14px; border-radius:100px; font-size:12px; font-weight:600; letter-spacing:0.02em; }
            .dms-btn-primary { background:#0B1020; color:#fff; border:none; border-radius:16px; font-weight:600; font-size:14px; cursor:pointer; transition:.2s; display:inline-flex; align-items:center; justify-content:center; gap:8px; }
            .dms-btn-primary:hover { background:#11172A; transform:translateY(-1px); box-shadow:0 2px 6px rgba(15,23,42,.06), 0 18px 50px rgba(15,23,42,.10); }
            .dms-btn-secondary { background:#F5F6F8; color:#0B1020; border:1px solid #E6E8EE; border-radius:16px; font-weight:600; font-size:14px; cursor:pointer; transition:.2s; display:inline-flex; align-items:center; justify-content:center; gap:8px; }
            .dms-btn-secondary:hover { background:#E6E8EE; }
            .dms-bookmark { width:36px; height:36px; border-radius:8px; border:none; background:transparent; cursor:pointer; font-size:18px; transition:.2s; }
            .dms-bookmark:hover { background:#F5F6F8; }
            /* Achievement badge lift */
            .dms-tilt { transition: transform .25s, box-shadow .25s; }
            .dms-tilt:hover { transform: translateY(-2px); box-shadow: 0 2px 6px rgba(15,23,42,.06), 0 18px 50px rgba(15,23,42,.10); }
            /* Past-challenge accent card */
            .dms-pc-card { position:relative; border:1px solid #E6E8EE; border-radius:16px; background:var(--pc-bg); box-shadow: inset 4px 0 0 0 var(--pc-accent); transition: transform .28s cubic-bezier(.4,0,.2,1), box-shadow .28s, border-color .28s; }
            .dms-pc-card:hover { transform: translateY(-3px) translateX(2px); box-shadow: inset 5px 0 0 0 var(--pc-accent), 0 12px 32px rgba(15,23,42,0.09), 0 3px 12px rgba(15,23,42,0.05); }
            .dms-pc-arrow { opacity:0; transform:translateX(-6px); transition: opacity .25s, transform .25s; }
            .dms-pc-card:hover .dms-pc-arrow { opacity:1; transform:translateX(0); }
          `}</style>

          {/* Hero pill */}
          <div
            className="inline-flex items-center gap-2 mb-5"
            style={{ padding: '8px 20px', borderRadius: '100px', background: '#FFFFFF', border: '1px solid #E6E8EE', boxShadow: '0 1px 2px rgba(15,23,42,.04), 0 8px 24px rgba(15,23,42,.06)', width: 'fit-content' }}
          >
            <span style={{ fontSize: '14px' }}>⭐</span>
            <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.03em', color: '#0B1020' }}>Practice. Evaluate. Improve.</span>
          </div>

          {/* Title */}
          <h1
            className="text-center mb-3"
            style={{ fontFamily: 'var(--font-dm-serif), serif', fontSize: 'clamp(32px, 5vw, 48px)', lineHeight: '1.15', letterSpacing: '-0.02em', color: '#0B1020' }}
          >
            <span className="block">Daily Answer Writing with</span>
            <span
              className="block"
              style={{ background: 'linear-gradient(135deg,#0B1020,#E5A300)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
            >
              Detailed Feedback &amp; Evaluation
            </span>
          </h1>

          {/* Description */}
          <p className="text-center text-[#6B7280] mb-6 px-4" style={{ fontSize: '15px', lineHeight: '1.7', maxWidth: '600px' }}>
            Practice one UPSC-level question every day. Get structured feedback, personalised insights, model answers, and actionable improvement points to steadily boost your mains scores.
          </p>

          {/* Live Challenge Card */}
          <div
            className="relative w-full"
            style={{ maxWidth: '1100px', borderRadius: '24px', background: '#FFFFFF', boxShadow: '0 1px 2px rgba(15,23,42,.04), 0 8px 24px rgba(15,23,42,.06), inset 0 0 0 1px #E6E8EE', padding: '28px' }}
          >
            {/* Tags row */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="dms-chip" style={{ background: '#EEF0FF', color: '#4338CA' }}>{data.paper}</span>
                <span className="dms-chip" style={{ background: '#E8F0FF', color: '#1d4ed8' }}>{data.subject}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="dms-chip" style={{ background: '#FFE9E9', color: '#DC2626' }}><span className="dms-livedot" /> LIVE NOW</span>
                <button type="button" className="dms-bookmark" title="Bookmark" aria-label="Bookmark">🔖</button>
              </div>
            </div>

            {/* Question */}
            <blockquote
              className="italic"
              style={{ borderLeft: '4px solid #F5B800', padding: '16px 20px', background: '#F5F6F8', borderRadius: '0 16px 16px 0', fontSize: '15px', lineHeight: '1.7', color: '#0B1020', marginTop: '20px', fontFamily: 'var(--font-merriweather), Inter, sans-serif', fontWeight: 400 }}
            >
              &quot;{data.questionText}&quot;
            </blockquote>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3" style={{ marginTop: '20px', fontSize: '14px', color: '#0B1020' }}>
              <span className="flex items-center gap-2">🕒 <strong>Time:</strong> {data.timeLimit} minutes</span>
              <span className="flex items-center gap-2">✍️ <strong>Word limit:</strong> {data.wordLimit} words</span>
              <span className="flex items-center gap-2">⭐ <strong>Marks:</strong> {data.marks}</span>
            </div>

            {/* Actions + aspirants */}
            <div className="flex flex-wrap items-center justify-between gap-4" style={{ marginTop: '24px' }}>
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={handleBeginChallenge} className="dms-btn-primary" style={{ padding: '14px 28px' }}>🚀 Begin Challenge</button>
                <button type="button" className="dms-btn-secondary" style={{ padding: '14px 28px' }}>📱 Attempt on App</button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex">
                  <span className="dms-av" style={{ background: '#3B82F6', zIndex: 4 }}>A</span>
                  <span className="dms-av" style={{ background: '#10B981', marginLeft: '-8px', zIndex: 3 }}>M</span>
                  <span className="dms-av" style={{ background: '#8B5CF6', marginLeft: '-8px', zIndex: 2 }}>K</span>
                  <span className="dms-av" style={{ background: '#F59E0B', marginLeft: '-8px', zIndex: 1 }}>+</span>
                </div>
                <div style={{ fontSize: '14px', color: '#6B7280' }}><strong style={{ color: '#0B1020' }}>{data.attemptCount.toLocaleString('en-US')}</strong> aspirants already attempted</div>
              </div>
            </div>
          </div>

          {/* ── Past Challenges ── */}
          <div className="w-full mt-10" style={{ maxWidth: '1100px' }}>
            <div
              className="rounded-[24px] bg-white"
              style={{ boxShadow: '0 1px 2px rgba(15,23,42,.04), 0 8px 24px rgba(15,23,42,.06), inset 0 0 0 1px #E6E8EE', padding: '22px 26px' }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '18px' }}>🗂</span>
                  <h2 className="font-bold text-[#0B1020]" style={{ fontSize: '18px' }}>Past Challenges</h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center" style={{ gap: '4px', padding: '4px', borderRadius: '12px', background: '#F5F6F8', border: '1px solid #E6E8EE' }}>
                    {['All', 'GS I', 'GS II', 'GS III', 'GS IV'].map((t, i) => (
                      <span
                        key={t}
                        style={{
                          padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap',
                          color: i === 0 ? '#0B1020' : '#6B7280',
                          background: i === 0 ? '#FFFFFF' : 'transparent',
                          boxShadow: i === 0 ? '0 1px 2px rgba(15,23,42,.06)' : 'none',
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <Link href="/dashboard/daily-answer/history" className="hover:underline" style={{ fontSize: '13px', fontWeight: 600, color: '#3B82F6', whiteSpace: 'nowrap' }}>
                    View All →
                  </Link>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {recentItems.length === 0 && (
                  <p className="text-[#6A7282]" style={{ fontSize: '13px' }}>No past challenges yet.</p>
                )}
                {recentItems.map((c, idx) => {
                  const ACCENTS = [
                    { accent: '#6366F1', bg: 'rgba(99,102,241,0.04)', pillBg: '#EEF0FF', pillColor: '#4338CA' },
                    { accent: '#10B981', bg: 'rgba(16,185,129,0.04)', pillBg: '#E8F0FF', pillColor: '#1d4ed8' },
                    { accent: '#F59E0B', bg: 'rgba(245,158,11,0.04)', pillBg: '#FFF1E0', pillColor: '#B45309' },
                  ];
                  const a = ACCENTS[idx % ACCENTS.length];
                  return (
                    <Link
                      key={c.date}
                      href={`/dashboard/daily-answer/challenge?date=${c.date}`}
                      className="dms-pc-card block"
                      style={{ ['--pc-accent' as string]: a.accent, ['--pc-bg' as string]: a.bg, padding: '16px 20px 16px 22px' } as React.CSSProperties}
                    >
                      <div className="flex items-center gap-4">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="flex items-center gap-2 flex-wrap mb-2.5">
                            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, background: a.pillBg, color: a.pillColor }}>{c.paper}</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, background: a.pillBg, color: a.pillColor }}>{c.subject}</span>
                            <span style={{ fontSize: '11px', color: '#6B7280' }}>· {formatDateLabel(c.date, todayStr)}</span>
                          </div>
                          <div style={{ fontWeight: 500, fontSize: '14px', lineHeight: '1.6', color: '#374151', fontFamily: 'var(--font-merriweather), Inter, sans-serif' }}>{c.title}</div>
                        </div>
                        <div className="flex-shrink-0 flex flex-col items-end" style={{ gap: '4px' }}>
                          <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>Your score</div>
                          {c.score != null ? (
                            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0B1020', lineHeight: 1 }}>{c.score}<span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>/{c.maxScore}</span></div>
                          ) : (
                            <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>{c.attempted ? c.evaluationStatus : '—'}</div>
                          )}
                        </div>
                        <span className="dms-pc-arrow" style={{ color: a.accent, fontSize: '18px', flexShrink: 0 }}>→</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Two-column: Calendar(+Progress) | Mains League — equal width & height ── */}
          <div className="mt-5 grid w-full grid-cols-1 items-stretch gap-5 lg:grid-cols-2" style={{ maxWidth: '1100px' }}>

            {/* LEFT COLUMN: Calendar + Your Progress in one card */}
            <div className="bg-white rounded-[24px] flex flex-col" style={{ padding: '24px', boxShadow: '0 1px 2px rgba(15,23,42,.04), 0 8px 24px rgba(15,23,42,.06), inset 0 0 0 1px #E6E8EE' }}>
              {/* Calendar header */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '18px' }}>📅</span>
                  <h3 className="font-bold text-[#0B1020]" style={{ fontSize: '16px' }}>
                    {new Date(`${calendarMonth}T00:00:00.000Z`).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date(`${calendarMonth}T00:00:00.000Z`);
                      setCalendarMonth(toDateStr(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1))));
                    }}
                    className="flex items-center justify-center rounded-lg hover:bg-[#F5F6F8] transition-colors"
                    style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', color: '#111827', fontSize: '16px' }}
                    aria-label="Previous month"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarMonth(toDateStr(new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1))))}
                    className="hover:bg-[#FAFAFA] transition-colors"
                    style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #E6E8EE', background: '#FFFFFF', fontSize: '12px', fontWeight: 600, color: '#0B1020' }}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date(`${calendarMonth}T00:00:00.000Z`);
                      const next = toDateStr(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)));
                      if (next <= todayStr) setCalendarMonth(next);
                    }}
                    disabled={calendarMonth >= getMonthRange(todayStr).start}
                    className="flex items-center justify-center rounded-lg hover:bg-[#F5F6F8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', color: '#111827', fontSize: '16px' }}
                    aria-label="Next month"
                  >
                    ›
                  </button>
                </div>
              </div>

              {/* Weekday row */}
              <div className="grid grid-cols-7" style={{ gap: '6px', textAlign: 'center', fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (<span key={`dow-${i}`}>{d}</span>))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7" style={{ gap: '6px' }}>
                {getCalendarGridCells(calendarMonth).map((cell, i) => {
                  if (!cell.inMonth) return <div key={`d-${i}`} />;
                  const dayLabel = String(new Date(`${cell.date}T00:00:00.000Z`).getUTCDate());
                  const item = monthItems.find((m) => m.date === cell.date);
                  const isToday2 = cell.date === todayStr;
                  const isFuture = cell.date > todayStr;

                  let bg = 'transparent';
                  let color = '#9CA3AF';
                  let bold = false;
                  if (isToday2) { bg = '#0F1626'; color = '#F4B740'; bold = true; }
                  else if (isFuture) { bg = 'transparent'; color = '#9CA3AF'; }
                  else if (item && item.attempted) { bg = '#DCF5E3'; color = '#2E8B57'; }
                  else { bg = '#F1F3F5'; color = '#9AA3AF'; }

                  const cellNode = (
                    <div
                      className="flex items-center justify-center"
                      style={{ aspectRatio: '1 / 1', borderRadius: '9px', fontSize: '13px', fontWeight: bold ? 700 : 600, background: bg, color }}
                    >
                      {dayLabel}
                    </div>
                  );

                  if (!isToday2 && item && cell.date <= todayStr) {
                    return (
                      <Link key={`d-${i}`} href={`/dashboard/daily-answer/challenge?date=${cell.date}`}>
                        {cellNode}
                      </Link>
                    );
                  }
                  return <div key={`d-${i}`}>{cellNode}</div>;
                })}
              </div>

              {/* Your Progress (inside calendar card, pinned to the bottom) */}
              <div className="flex items-center gap-2" style={{ marginTop: 'auto', paddingTop: '20px', marginBottom: '12px' }}>
                <span style={{ fontSize: '18px' }}>📊</span>
                <div className="font-bold text-[#0B1020]" style={{ fontSize: '16px' }}>Your Progress</div>
                <div className="ml-auto inline-flex items-center gap-1.5" style={{ padding: '4px 12px', borderRadius: '100px', background: 'linear-gradient(135deg,#FFF3D6,#FFE6B0)', border: '1px solid rgba(245,184,0,0.3)' }}>
                  <span style={{ fontSize: '11px' }}>🔥</span>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#92400E' }}>47 Day Streak</span>
                </div>
              </div>
              <div className="grid grid-cols-2" style={{ gap: '12px' }}>
                <div className="text-center rounded-[12px]" style={{ background: '#F5F6F8', padding: '16px' }}>
                  <div className="font-extrabold text-[#0B1020]" style={{ fontSize: '24px', lineHeight: 1 }}>89</div>
                  <div className="text-[#6B7280] mt-1" style={{ fontSize: '11px' }}>Questions Attempted</div>
                </div>
                <div className="text-center rounded-[12px]" style={{ background: '#F5F6F8', padding: '16px' }}>
                  <div className="font-extrabold text-[#0B1020]" style={{ fontSize: '24px', lineHeight: 1 }}>7.2</div>
                  <div className="text-[#6B7280] mt-1" style={{ fontSize: '11px' }}>Avg. Score / 10</div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Mains League */}
            <div className="bg-white rounded-[24px]" style={{ padding: '24px', boxShadow: '0 1px 2px rgba(15,23,42,.04), 0 8px 24px rgba(15,23,42,.06), inset 0 0 0 1px #E6E8EE' }}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '20px' }}>🥇</span>
                  <h3 className="font-bold" style={{ fontSize: '16px', background: 'linear-gradient(135deg,#F5B800,#E5A300)', padding: '2px 10px', borderRadius: '8px', color: '#0B1020' }}>Mains League</h3>
                </div>
                <Link href="/dashboard/leaderboard?tab=mains" className="hover:underline" style={{ fontSize: '14px', fontWeight: 600, color: '#0B1020' }}>View All →</Link>
              </div>
              <div className="flex flex-col">
                {mainsLeague.map((row, i) => {
                  const RANK_BG = [
                    'linear-gradient(135deg,#F5B800,#E5A300)',
                    'linear-gradient(135deg,#A8A9AD,#7F8284)',
                    'linear-gradient(135deg,#CD7F32,#B06C2A)',
                  ];
                  const isMedal = i < 3;
                  return (
                    <div
                      key={row.userId}
                      className="flex min-w-0 items-center gap-3"
                      style={{ padding: '10px 0', borderBottom: '1px solid #E6E8EE' }}
                    >
                      <div
                        className="flex items-center justify-center font-bold flex-shrink-0"
                        style={{
                          width: '30px', height: '30px', borderRadius: '50%', fontSize: '12px',
                          background: isMedal ? RANK_BG[i] : '#F1F3F5',
                          color: isMedal ? '#fff' : '#6B7280',
                          boxShadow: i === 0 ? '0 2px 8px rgba(245,184,0,0.3)' : i < 3 ? '0 2px 6px rgba(127,130,132,0.22)' : 'none',
                        }}
                      >
                        {row.rank}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="font-semibold text-[#0B1020] truncate" style={{ fontSize: '13px' }}>{row.name}</div>
                        <div style={{ fontSize: '10.5px', color: '#6B7280' }}>Rank #{row.rank}</div>
                      </div>
                      <div className="font-bold text-[#0B1020]" style={{ fontSize: '13px' }}>{Math.round(row.mainsAvg * 10) / 10}</div>
                    </div>
                  );
                })}
                {/* You row */}
                <div
                  className="flex min-w-0 items-center gap-3 rounded-[12px] mt-4"
                  style={{ background: '#F5F6F8', padding: '12px' }}
                >
                  <div className="flex items-center justify-center font-bold flex-shrink-0" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0B1020', color: '#F5B800', fontSize: '13px' }}>
                    {myMainsRank?.mainsRank ?? '—'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="font-semibold text-[#0B1020] truncate" style={{ fontSize: '14px' }}>You · {myMainsRank?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'You'}</div>
                    <div style={{ fontSize: '11px', color: '#6B7280' }}>Rank #{myMainsRank?.mainsRank ?? '—'}</div>
                  </div>
                  <Link href="/dashboard/leaderboard?tab=mains" className="font-semibold text-[#0B1020] hover:underline" style={{ fontSize: '12px' }}>Climb →</Link>
                </div>
              </div>
            </div>
          </div>

          {/* ── Achievements (full width) ── */}
          <div className="w-full mt-5" style={{ maxWidth: '1100px' }}>
            <div className="bg-white rounded-[24px]" style={{ padding: '24px', boxShadow: '0 1px 2px rgba(15,23,42,.04), 0 8px 24px rgba(15,23,42,.06), inset 0 0 0 1px #E6E8EE' }}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '18px' }}>🏆</span>
                  <h3 className="font-bold text-[#0B1020]" style={{ fontSize: '16px' }}>Achievements</h3>
                </div>
                <Link href="/dashboard/achievement-badges" className="hover:underline" style={{ fontSize: '14px', fontWeight: 600, color: '#0B1020' }}>All Badges →</Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" style={{ gap: '12px' }}>
                {[
                  { emoji: '🔥', name: 'Streak Master', stat: '47 days', dim: false },
                  { emoji: '✍️', name: 'Sharp Pen', stat: '89 attempted', dim: false },
                  { emoji: '🥇', name: 'Top 50', stat: 'Rank #14', dim: false },
                  { emoji: '🧠', name: 'Polymath', stat: '4 / 4 GS', dim: false },
                  { emoji: '💯', name: 'Centurion', stat: '89 / 100', dim: true },
                ].map((b) => (
                  <Link
                    key={b.name}
                    href="/dashboard/achievement-badges"
                    className="dms-tilt block text-center rounded-[12px]"
                    style={{ background: '#F5F6F8', padding: '16px', opacity: b.dim ? 0.5 : 1 }}
                  >
                    <div style={{ fontSize: '32px' }}>{b.emoji}</div>
                    <div className="font-semibold text-[#0B1020]" style={{ fontSize: '14px', marginTop: '8px' }}>{b.name}</div>
                    <div className="text-[#6B7280]" style={{ fontSize: '11px', marginTop: '2px' }}>{b.stat}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ── CHALLENGE STARTED: question + timer side-by-side, answer below ─────────
  return (
    <div className="bg-[#F5F6F8] font-jakarta" style={{ height: '100%', overflowY: 'auto' }}>
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
            className="bg-white rounded-[24px]"
            style={{ padding: '20px 24px', boxShadow: '0 1px 2px rgba(15,23,42,.04), 0 8px 24px rgba(15,23,42,.06), inset 0 0 0 1px #E6E8EE' }}
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
            className="bg-white rounded-[24px] p-5 sm:p-7 lg:px-9"
            style={{ boxShadow: '0 1px 2px rgba(15,23,42,.04), 0 8px 24px rgba(15,23,42,.06), inset 0 0 0 1px #E6E8EE' }}
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
            className="bg-white rounded-[24px] flex flex-col items-center justify-center"
            style={{ padding: '20px', boxShadow: '0 1px 2px rgba(15,23,42,.04), 0 8px 24px rgba(15,23,42,.06), inset 0 0 0 1px #E6E8EE' }}
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
            className="bg-white rounded-[24px] overflow-hidden"
            style={{ boxShadow: '0 1px 2px rgba(15,23,42,.04), 0 8px 24px rgba(15,23,42,.06), inset 0 0 0 1px #E6E8EE' }}
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
      <div className="flex bg-[#F5F6F8] font-jakarta" style={{ height: '100%', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    }>
      <DailyMainsChallengeInner />
    </Suspense>
  );
}
