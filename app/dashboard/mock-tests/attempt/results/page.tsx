'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { mockTestService, leaderboardService } from '@/lib/services';
import MainsResultsView from '@/components/mains-results/MainsResultsView';
import SmartNextStepsModal from '@/components/SmartNextStepsModal';
import ShareScoreModal from '@/components/mcq-review/ShareScoreModal';
import { useAuth } from '@/contexts/AuthContext';

interface Question {
  id: number;
  subject: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  text: string;
  options: { label: string; text: string }[];
  correct: string;
  explanation: string;
}

const SAMPLE_QUESTIONS: Question[] = [
  {
    id: 1,
    subject: 'Polity',
    difficulty: 'Medium',
    text: 'Which of the following statements about the Preamble to the Indian Constitution is/are correct?\n\n1. The Preamble is a part of the Constitution\n2. It can be amended under Article 368\n3. It has been amended only once',
    options: [
      { label: 'A', text: '1 only' },
      { label: 'B', text: '1 and 2 only' },
      { label: 'C', text: '1, 2 and 3' },
      { label: 'D', text: '2 and 3 only' },
    ],
    correct: 'B',
    explanation: 'The Preamble is part of the Constitution (Kesavananda Bharati) and can be amended under Article 368 (subject to basic structure). It has been amended once (42nd Amendment).',
  },
  {
    id: 2,
    subject: 'History',
    difficulty: 'Easy',
    text: 'The term "Swaraj" was first used prominently by:',
    options: [
      { label: 'A', text: 'Bal Gangadhar Tilak' },
      { label: 'B', text: 'Mahatma Gandhi' },
      { label: 'C', text: 'Dadabhai Naoroji' },
      { label: 'D', text: 'Subhas Chandra Bose' },
    ],
    correct: 'C',
    explanation: 'Dadabhai Naoroji used "Swaraj" prominently; later Tilak popularized it widely.',
  },
  {
    id: 3,
    subject: 'Geography',
    difficulty: 'Medium',
    text: 'Which one of the following factors most directly influences the formation of monsoon winds over the Indian subcontinent?',
    options: [
      { label: 'A', text: 'Earth\'s rotation alone' },
      { label: 'B', text: 'Seasonal differential heating of land and sea' },
      { label: 'C', text: 'Ocean currents only' },
      { label: 'D', text: 'Mountain building processes' },
    ],
    correct: 'B',
    explanation: 'Monsoon is driven by seasonal differential heating between land and sea creating pressure gradients.',
  },
  {
    id: 4,
    subject: 'Economy',
    difficulty: 'Hard',
    text: 'In the context of inflation targeting, which institution sets the policy repo rate in India?',
    options: [
      { label: 'A', text: 'Ministry of Finance' },
      { label: 'B', text: 'NITI Aayog' },
      { label: 'C', text: 'Monetary Policy Committee (RBI)' },
      { label: 'D', text: 'SEBI' },
    ],
    correct: 'C',
    explanation: 'The RBI\'s Monetary Policy Committee sets the policy repo rate under the inflation targeting framework.',
  },
  {
    id: 5,
    subject: 'Environment',
    difficulty: 'Medium',
    text: '"Biodiversity hotspot" refers to a region that:',
    options: [
      { label: 'A', text: 'Has only high species richness' },
      { label: 'B', text: 'Has high endemism and is under significant threat' },
      { label: 'C', text: 'Has low endemism but high productivity' },
      { label: 'D', text: 'Is protected as a national park' },
    ],
    correct: 'B',
    explanation: 'Hotspots have high endemism and have lost a large portion of their original habitat (high threat).',
  },
];

function CircleScore({ pct }: { pct: number }) {
  const r = 68;
  const circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" style={{ display: 'block' }}>
      <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
      <circle
        cx="80" cy="80" r={r} fill="none"
        stroke="#FDC700" strokeWidth="8"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
      />
      <text x="80" y="70" textAnchor="middle" fill="#FFFFFF" fontSize="36" fontWeight="700" fontFamily="Inter">{pct}%</text>
      <text x="80" y="90" textAnchor="middle" fill="#99A1AF" fontSize="11" fontFamily="Inter" letterSpacing="2">SCORE</text>
    </svg>
  );
}

interface SubjectStat {
  subject: string;
  correct: number;
  total: number;
}

interface AnalysisItem {
  emoji: string;
  text: string;
}

interface ResultsData {
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  netScore: string | number;
  scorePct: number;
  perfLabel: string;
  timeTaken?: number;
  durationSeconds?: number;
  subjectStats: SubjectStat[];
  analysis: AnalysisItem[];
  testLabel?: string;
}

interface ParameterScore {
  parameter: string;
  score: number;
  maxScore: number;
  comment?: string;
}

interface MainsPerQuestion {
  idx: number;
  questionText: string;
  subject: string;
  paper?: string;
  score: number;
  maxScore: number;
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  detailedFeedback?: string;
  answerText?: string | null;
  wordCount?: number;
  checkedCopyUrl?: string | null;
  checkedCopyPages?: Array<{ pageNumber: number; checkedCopyUrl?: string | null; status?: string; reason?: string }>;
  checkedCopyStatus?: string | null;
  parameterScores?: ParameterScore[];
  keyTerms?: Array<{ term: string; found: boolean }>;
  nextAttemptFocus?: string | null;
  evaluatorConclusion?: string | null;
  modelAnswerKeyPoints?: string[];
  modelAnswerContent?: string;
  modelAnswerStructure?: { introduction: string; sections: Array<{ heading: string; points: string[] }>; conclusion: string } | null;
  curatedModelAnswer?: string | null;
  curatedModelAnswerKeyPoints?: string[];
}


/* ─── Next-steps types ─── */
interface CardItem {
  icon: string;
  iconBg: string;
  iconColor?: string;
  imgSrc?: string;
  title: string;
  desc: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
  dark: boolean;
  href: string;
}

interface StreakData {
  days: number;
  percentile: number;
  message?: string;
}

interface RecommendationsData {
  cards: CardItem[];
  streak?: StreakData;
  heroTitle?: string;
  heroSubtitle?: string;
}

const fallbackCards: CardItem[] = [
  {
    icon: '🔄',
    iconBg: '#2B7FFF',
    imgSrc: '/emoji-12.png',
    title: 'Retake this test',
    desc: 'Same config, fresh attempt. Ideal for reinforcing weak areas.',
    badge: 'Recommended',
    badgeBg: 'rgba(49,65,88,0.6)',
    badgeColor: '#DBEAFE',
    dark: true,
    href: '/dashboard/mock-tests/attempt',
  },
  {
    icon: '+',
    iconBg: '#F3E8FF',
    iconColor: '#0F172B',
    title: 'Build a new test',
    desc: 'Change subject, difficulty or source. Keep the variety going.',
    badge: 'Most popular',
    badgeBg: '#F3E8FF',
    badgeColor: '#8200DB',
    dark: false,
    href: '/dashboard/mock-tests',
  },
  {
    icon: '✍️',
    iconBg: '#FEF9C3',
    title: 'Try Mains Writing',
    desc: 'Practice answer writing with AI markup feedback. Build answer skills.',
    badge: 'Mains prep',
    badgeBg: '#DBEAFE',
    badgeColor: '#1447E6',
    dark: false,
    href: '/dashboard/daily-answer',
  },
  {
    icon: '🚀',
    iconBg: '#FCE7F3',
    imgSrc: '/emoji-13.png',
    title: 'Unlock Pro Practice',
    desc: 'Remove limits – full 100-Q papers, unlimited subjects, PYQ archives.',
    badge: 'Upgrade',
    badgeBg: '#F3E8FF',
    badgeColor: '#8200DB',
    dark: false,
    href: '/dashboard/billing/plans',
  },
];

function MockTestResultsInner() {
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const testId = searchParams.get('testId');
  const mode = searchParams.get('mode');
  const examMode = searchParams.get('examMode') || 'prelims';
  const isMains = examMode === 'mains';
  const title = searchParams.get('title') || 'Test Series';

  const [results, setResults] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mainsData, setMainsData] = useState<MainsPerQuestion[] | null>(null);
  // Real leaderboard rank (prelims/MCQ bucket) — powers the Rank stat tile.
  const [myRank, setMyRank] = useState<{ mcqRank: number | null; isRankUnlocked: boolean; attemptsToUnlockRank: number; realRankedCount: number } | null>(null);

  // Score-screen popups — mirror the Daily MCQ Challenge flow: Smart Next Steps
  // and Share Score open as modals (never inline sections below the score card).
  const [showNextSteps, setShowNextSteps] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [cards, setCards] = useState<CardItem[]>(fallbackCards);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [heroTitle, setHeroTitle] = useState('Great session!');
  const [heroSubtitle, setHeroSubtitle] = useState("You've completed today's practice. Here's what the best aspirants do next to keep climbing.");
  const [showConfetti, setShowConfetti] = useState(false);

  /* ─── Celebration confetti — fires once, only right after this specific
     attempt is completed. Guarded by sessionStorage so revisiting the same
     score screen (back button, refresh, re-opening the link) never replays
     it; a newly generated testId gets its own key and celebrates again. ─── */
  useEffect(() => {
    if (isMains || !results || typeof window === 'undefined') return;
    if (results.scorePct <= 50) return;
    const key = `mockTestConfettiPlayed:${testId ?? `sample:${title}`}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    setShowConfetti(true);
    const hide = setTimeout(() => setShowConfetti(false), 4200);
    return () => clearTimeout(hide);
  }, [isMains, results, testId, title]);

  /* ─── Mains results loader ─── */
  useEffect(() => {
    if (!isMains || !testId) return;
    let cancelled = false;

    async function loadMains() {
      setLoading(true);
      setError(null);
      try {
        const raw = typeof window !== 'undefined'
          ? sessionStorage.getItem(`mockTestMainsAttempts:${testId}`)
          : null;
        if (!raw) throw new Error('No mains evaluation session found. Please re-attempt the test.');
        const { attemptIds } = JSON.parse(raw) as { attemptIds: string[] };
        if (!attemptIds?.length) throw new Error('No mains attempts recorded.');

        const out: MainsPerQuestion[] = [];
        for (let i = 0; i < attemptIds.length; i++) {
          const id = attemptIds[i];
          const res = await mockTestService.getMainsResults(testId!, id);
          if (cancelled) return;
          const d = res.data || {};
          out.push({
            idx: i + 1,
            questionText: d.question?.questionText || '',
            subject: d.question?.subject || '',
            paper: d.question?.paper || '',
            score: Number(d.score ?? 0),
            maxScore: Number(d.maxScore ?? 15),
            strengths: Array.isArray(d.strengths) ? d.strengths : [],
            improvements: Array.isArray(d.improvements) ? d.improvements : [],
            suggestions: Array.isArray(d.suggestions) ? d.suggestions : [],
            detailedFeedback: d.detailedFeedback,
            answerText: d.answerText,
            wordCount: d.wordCount,
            checkedCopyUrl: d.checkedCopyUrl,
            checkedCopyPages: Array.isArray(d.checkedCopyPages) ? d.checkedCopyPages : [],
            checkedCopyStatus: d.checkedCopyStatus,
            parameterScores: Array.isArray(d.parameterScores) ? d.parameterScores : [],
            keyTerms: Array.isArray(d.keyTerms) ? d.keyTerms : [],
            nextAttemptFocus: d.nextAttemptFocus,
            evaluatorConclusion: d.evaluatorConclusion,
            modelAnswerKeyPoints: Array.isArray(d.modelAnswerKeyPoints) ? d.modelAnswerKeyPoints : [],
            modelAnswerContent: d.modelAnswerContent,
            modelAnswerStructure: d.modelAnswerStructure || null,
            curatedModelAnswer: d.curatedModelAnswer || null,
            curatedModelAnswerKeyPoints: Array.isArray(d.curatedModelAnswerKeyPoints) ? d.curatedModelAnswerKeyPoints : [],
          });
        }
        if (!cancelled) {
          setMainsData(out);
          setLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || 'Failed to load mains results.');
          setLoading(false);
        }
      }
    }

    loadMains();
    return () => { cancelled = true; };
  }, [isMains, testId]);

  // Real leaderboard rank for this aspirant (all-time, MCQ/prelims bucket).
  useEffect(() => {
    if (isMains) return;
    leaderboardService.getMyRank('all')
      .then(res => setMyRank(res.data || null))
      .catch(() => setMyRank(null));
  }, [isMains]);

  useEffect(() => {
    if (isMains) return;
    if (mode === 'sample') {
      try {
        const raw = typeof window !== 'undefined' ? sessionStorage.getItem('mockTestSampleResults') : null;
        if (!raw) throw new Error('No local results found.');
        const data = JSON.parse(raw) as any;
        setResults({
          total: data.total ?? 5,
          correct: data.correct ?? 0,
          wrong: data.wrong ?? 0,
          skipped: data.skipped ?? 0,
          netScore: (Number(data.correct ?? 0) * 2 - Number(data.wrong ?? 0) * 0.67).toFixed(2),
          scorePct: data.accuracyPct ?? 0,
          perfLabel: 'Keep Going — Every Attempt Makes You Better!',
          timeTaken: 0,
          durationSeconds: 0,
          subjectStats: [],
          analysis: [],
          testLabel: title,
          _sample: data,
        } as any);
        setLoading(false);
        setError(null);
      } catch (e: any) {
        setError(e.message || 'No local results.');
        setLoading(false);
      }
      return;
    }

    if (!testId) {
      setError('No test ID provided.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function loadResults() {
      setLoading(true);
      setError(null);
      try {
        const res = await mockTestService.getResults(testId!);
        if (cancelled) return;

        const data = res.data;
        if (!data) {
          throw new Error('No results data returned.');
        }

        const correct = data.correct ?? data.correctCount ?? data.correct_count ?? 0;
        const wrong = data.wrong ?? data.wrongCount ?? data.wrong_count ?? 0;
        const skipped = data.skipped ?? data.skippedCount ?? data.skipped_count ?? 0;
        const total = data.total ?? data.totalQuestions ?? data.question_count
          ?? (correct + wrong + skipped > 0 ? correct + wrong + skipped : (data.questions?.length ?? 0));
        const netScore = data.netScore ?? data.score ?? (correct * 2 - wrong * 0.67).toFixed(2);
        const scorePct = data.scorePct ?? data.scorePercentage ?? data.accuracy ?? (total > 0 ? Math.round((correct / total) * 100) : 0);
        const timeTaken = Number(data.timeTaken ?? data.time_taken ?? data.timeTakenSeconds ?? data.time_taken_seconds ?? 0) || 0;
        const rawDuration = Number(data.duration ?? data.durationSeconds ?? data.duration_seconds ?? 0) || 0;
        // DB may store duration in minutes; normalize to seconds.
        const durationSeconds = rawDuration > 0 && rawDuration <= 240 ? Math.round(rawDuration * 60) : Math.round(rawDuration);

        const perfLabel = data.perfLabel ?? data.performanceLabel ?? (
          scorePct >= 80 ? 'Excellent Work!' :
          scorePct >= 60 ? 'Good Job!' :
          scorePct >= 40 ? 'Keep Practising' :
          'Don\'t Give Up!'
        );

        const subjectStats: SubjectStat[] = data.subjectStats ?? data.subjectWise ?? data.subject_wise
          ? Object.entries(data.subject_wise || {}).map(([subject, v]: [string, any]) => ({
              subject,
              correct: v.correct ?? 0,
              total: v.total ?? 0,
            }))
          : [];

        let analysis: AnalysisItem[] = data.analysis ?? data.insights ?? [];
        if (analysis.length === 0 && subjectStats.length > 0) {
          const strongest = subjectStats.reduce((a: SubjectStat, b: SubjectStat) => (a.correct / (a.total || 1)) >= (b.correct / (b.total || 1)) ? a : b);
          const weakest = subjectStats.reduce((a: SubjectStat, b: SubjectStat) => (a.correct / (a.total || 1)) <= (b.correct / (b.total || 1)) ? a : b);
          analysis = [
            { emoji: '💪', text: `Your strongest area is ${strongest.subject} — maintain momentum here.` },
            { emoji: '🔥', text: `Focus on ${weakest.subject} — 20 min daily for two weeks will show major gains.` },
            { emoji: '🎯', text: 'Accuracy is improving. Attempt similar difficulty tests to consolidate.' },
            { emoji: '🏆', text: 'Top rankers average 82%+. You\'re building momentum!' },
          ];
        }

        setResults({
          total,
          correct,
          wrong,
          skipped,
          netScore: typeof netScore === 'number' ? netScore.toFixed(2) : netScore,
          scorePct,
          perfLabel,
          timeTaken,
          durationSeconds,
          subjectStats,
          analysis,
          testLabel: data.testLabel ?? 'Prelims · Daily MCQ',
        });
      } catch (err: any) {
        if (!cancelled) {
          console.error('Failed to load results:', err);
          setError(err.message || 'Failed to load test results.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadResults();
    return () => { cancelled = true; };
  }, [testId]);

  /* ─── Load next-steps recommendations ─── */
  useEffect(() => {
    let cancelled = false;
    async function loadRecommendations() {
      try {
        const res = await mockTestService.getRecommendations(testId || '');
        if (cancelled) return;
        const data: RecommendationsData = res.data;
        if (data?.cards?.length) {
          setCards(data.cards.map((card: CardItem) =>
            card.href?.includes('/attempt') && !card.href.includes('testId')
              ? { ...card, href: `${card.href}?testId=${testId}` }
              : card
          ));
        }
        if (data?.streak) setStreak(data.streak);
        if (data?.heroTitle) setHeroTitle(data.heroTitle);
        if (data?.heroSubtitle) setHeroSubtitle(data.heroSubtitle);
      } catch { /* keep fallbacks */ }
    }
    loadRecommendations();
    return () => { cancelled = true; };
  }, [testId]);

  /* ─── Loading State ─── */
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#F9FAFB',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #E5E7EB',
          borderTopColor: '#0F172B',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ fontSize: '16px', color: '#6B7280' }}>Loading results...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ─── Error State ─── */
  if (error || (!isMains && !results) || (isMains && !mainsData)) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#F9FAFB',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        fontFamily: 'Inter, sans-serif',
      }}>
        <span style={{ fontSize: '48px' }}>⚠️</span>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#101828', margin: 0 }}>Something went wrong</h2>
        <p style={{ fontSize: '14px', color: '#6B7280', maxWidth: '400px', textAlign: 'center' }}>{error || 'Could not load results.'}</p>
        <button
          onClick={() => router.push('/dashboard/mock-tests')}
          style={{
            background: '#0F172B',
            color: '#FFF',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 24px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Back to Mock Tests
        </button>
      </div>
    );
  }

  /* ─── Shared: patch fallback retake card with testId ─── */
  const displayCards = cards.map(card =>
    card.href?.includes('/attempt') && testId && !card.href.includes('testId')
      ? { ...card, href: `${card.href}?testId=${testId}` }
      : card
  );

  /* ─── Mains Results View ─── */
  // Rendered by the shared MainsResultsView — identical to the Daily Mains
  // Challenge results page (Feedback / Examiner's Markup / Score Breakdown /
  // What's Next, plus the Model Answer modal), with question selector chips
  // since a mock test has multiple mains questions. The Examiner's Markup tab
  // is hidden per question when the answer was typed (no checked-copy pages).
  if (isMains && mainsData) {
    return (
      <MainsResultsView
        results={mainsData.map((q) => ({
          score: q.score,
          maxScore: q.maxScore,
          strengths: q.strengths,
          improvements: q.improvements,
          suggestions: q.suggestions,
          detailedFeedback: q.detailedFeedback,
          checkedCopyUrl: q.checkedCopyUrl,
          checkedCopyPages: q.checkedCopyPages,
          checkedCopyStatus: q.checkedCopyStatus,
          wordCount: q.wordCount,
          answerText: q.answerText,
          keyTerms: q.keyTerms,
          nextAttemptFocus: q.nextAttemptFocus,
          evaluatorConclusion: q.evaluatorConclusion,
          modelAnswerKeyPoints: q.modelAnswerKeyPoints,
          modelAnswerContent: q.modelAnswerContent,
          modelAnswerStructure: q.modelAnswerStructure,
          curatedModelAnswer: q.curatedModelAnswer,
          curatedModelAnswerKeyPoints: q.curatedModelAnswerKeyPoints,
          parameterScores: q.parameterScores,
          question: {
            questionText: q.questionText,
            subject: q.subject,
            paper: q.paper,
            marks: q.maxScore,
          },
        }))}
        shareHeading="MOCK TEST MAINS"
        rewriteRoute="/dashboard/mock-tests"
        backRoute="/dashboard/mock-tests"
        breadcrumbLabel={title}
      />
    );
  }

  /* ─── Prelims Results View ─── */
  const { total, correct, wrong, scorePct } = results!;

  /* ─── Daily-MCQ-style completion card derivations ─── */
  const timeTaken = Math.max(0, Math.round(results!.timeTaken ?? 0));
  const durationSeconds = Math.max(0, Math.round(results!.durationSeconds ?? 0));
  const timeMinutes = Math.floor(timeTaken / 60);
  const timeSeconds = timeTaken % 60;
  const durationLabel = durationSeconds > 0 ? `of ${Math.round(durationSeconds / 60)} min` : 'this attempt';
  const attemptedCount = correct + wrong;
  const speedPerQ = attemptedCount > 0 ? (timeTaken / 60 / attemptedCount).toFixed(2) : '0';
  // Real leaderboard rank (prelims/MCQ bucket). Falls back to an unlock hint.
  const rankUnlocked = !!myRank?.isRankUnlocked && !!myRank?.mcqRank;
  const rankedTotal = myRank?.realRankedCount ?? 0;
  const rankLabel = rankUnlocked
    ? `#${(myRank!.mcqRank as number).toLocaleString('en-IN')}`
    : myRank && myRank.attemptsToUnlockRank > 0
      ? `${myRank.attemptsToUnlockRank} more to unlock`
      : 'Rankings updating...';
  const rankSubLabel = rankUnlocked && rankedTotal > 0
    ? `of ${rankedTotal.toLocaleString('en-IN')} ranked`
    : 'among aspirants today';
  const rankBarPct = rankUnlocked && rankedTotal > 0
    ? Math.max(4, Math.min(100, Math.round((1 - ((myRank!.mcqRank as number) - 1) / rankedTotal) * 100)))
    : 0;
  // Share Score: reuse the Daily MCQ Challenge share modal — build the same
  // shareable slug URL (initials + date) so the popup behaves identically.
  const reportName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Aspirant';
  const reportInitials = (reportName.split(' ').map((w) => w[0]).join('').slice(0, 2) || 'AS').toUpperCase();
  const shareDate = new Date();
  const shareSlug = `${reportInitials}-${shareDate.getDate()}${shareDate.toLocaleString('en-US', { month: 'short' }).toLowerCase()}${String(shareDate.getFullYear()).slice(-2)}`;
  const shareScoreUrl = `risewithjeet.com/share/mock-test/${shareSlug}`;
  const retakeHref = mode === 'sample'
    ? `/dashboard/mock-tests/attempt?mode=sample&title=${encodeURIComponent(title)}`
    : `/dashboard/mock-tests/attempt?testId=${testId}`;
  // Question-wise Review opens as its OWN screen (exactly like Daily MCQ) —
  // never expanded inline below the score card.
  const reviewHref = mode === 'sample'
    ? `/dashboard/mock-tests/attempt/results/review?mode=sample&title=${encodeURIComponent(title)}`
    : `/dashboard/mock-tests/attempt/results/review?testId=${testId}`;

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'Inter, sans-serif' }}>
      {showConfetti && (
        <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 10 }}>
          {Array.from({ length: 36 }, (_, i) => (
            <span
              key={i}
              style={{
                position: 'absolute',
                top: -20,
                left: `${(i * 37) % 100}%`,
                width: 8,
                height: 14,
                borderRadius: 3,
                background: ['#FDC700', '#22C55E', '#2B7FFF', '#FB2C36', '#F97316'][i % 5],
                transform: `rotate(${i * 17}deg)`,
                animation: `mockConfetti ${2.4 + (i % 6) * 0.24}s ease-out ${i * 0.035}s forwards`,
              }}
            />
          ))}
          <style>{`
            @keyframes mockConfetti {
              0% { transform: translate3d(0,-24px,0) rotate(0deg); opacity: 1; }
              100% { transform: translate3d(${scorePct % 2 === 0 ? 28 : -28}px,110vh,0) rotate(720deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}
      <div
        style={{
          width: 'min(100%, 868px)',
          marginTop: 'clamp(12px, 3vh, 40px)',
          marginLeft: 'auto',
          marginRight: 'auto',
          boxSizing: 'border-box',
          paddingLeft: 24,
          paddingRight: 24,
        }}
      >
        {/* Completion card — mirrors Daily MCQ Challenge results (same narrow, centered width) */}
        <div
          style={{
            width: 'clamp(640px, 42vw, 820px)',
            maxWidth: '100%',
            marginLeft: 'auto',
            marginRight: 'auto',
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #ECECF1',
            padding: 'clamp(1.25rem,1.6vw,2rem) clamp(1.4rem,1.8vw,2.2rem)',
            marginBottom: 18,
            boxShadow: '0 26px 60px -30px rgba(15,23,42,0.24), 0 12px 28px -20px rgba(15,23,42,0.18), inset 0 1px 0 rgba(255,255,255,0.9)',
          }}
        >
          <style>{`
            .dmscore-card{position:relative;border-radius:16px;padding:clamp(12px,1vw,18px);overflow:hidden;transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease;border:1px solid #E5E7EB;box-shadow:0 1px 2px rgba(16,24,40,.04),0 6px 18px -10px rgba(16,24,40,.08);}
            .dmscore-card:hover{transform:translateY(-2px);border-color:#D1D5DB;box-shadow:0 1px 2px rgba(16,24,40,.05),0 14px 28px -14px rgba(16,24,40,.15);}
            .dmscore-card::after{content:"";position:absolute;top:-40px;right:-40px;width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.55),rgba(255,255,255,0));pointer-events:none;}
            .dmscore-accuracy{border-color:#DCE8E1;background:linear-gradient(160deg,#FBFDFC 0%,#F1F7F4 100%);}
            .dmscore-time{border-color:#DCE2EC;background:linear-gradient(160deg,#FBFCFE 0%,#F1F4F9 100%);}
            .dmscore-speed{border-color:#E8DFCE;background:linear-gradient(160deg,#FDFCFA 0%,#F8F4EE 100%);}
            .dmscore-rank{border-color:#E2DAEC;background:linear-gradient(160deg,#FCFBFD 0%,#F4F1F8 100%);}
            .dmscore-icon{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;position:relative;z-index:1;}
            .dmscore-icon-accuracy{background:#ECF5F0;color:#3F8C6E;}
            .dmscore-icon-time{background:#EEF2F8;color:#4A6B96;}
            .dmscore-icon-speed{background:#F6F0E6;color:#9C7A3F;}
            .dmscore-icon-rank{background:#F1EDF6;color:#7A6699;}
            .dmscore-bar{height:5px;border-radius:999px;background:rgba(255,255,255,.6);overflow:hidden;position:relative;z-index:1;}
            .dmscore-bar>span{display:block;height:100%;border-radius:999px;transition:width .4s ease;}
            .qw-review-btn{color:#0B1426;background:radial-gradient(120% 140% at 100% 0%, rgba(245,197,24,.18) 0%, rgba(245,197,24,0) 55%),linear-gradient(135deg,#FBF6E7 0%,#F4ECD8 55%,#EFE3BE 100%);box-shadow:0 10px 22px -14px rgba(107,83,32,.45), inset 0 1px 0 rgba(255,255,255,.6);border:1px solid #E4D8B5;letter-spacing:.01em;}
            .qw-review-btn::after{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(180deg,#F5C518,#B7860B);border-radius:12px 0 0 12px;}
            .qw-review-btn:hover{filter:brightness(1.02);transform:translateY(-1px);box-shadow:0 16px 30px -16px rgba(107,83,32,.55);}
            .qw-badge{position:relative;z-index:1;background:#0B1426;color:#F5C518;font-size:10.5px;font-weight:800;letter-spacing:.14em;padding:3px 8px;border-radius:999px;border:1px solid #0B1426;}
            .mcq-act{display:flex;align-items:center;gap:clamp(8px,0.8vw,12px);padding:clamp(10px,0.85vw,14px) clamp(12px,1vw,16px);border-radius:14px;font-weight:700;font-size:clamp(12px,0.78vw,14px);border:1px solid transparent;cursor:pointer;transition:all .18s;background:#fff;width:100%;text-align:left;}
            .mcq-act:hover{transform:translateY(-1px);box-shadow:0 10px 24px -16px rgba(11,20,38,.18);}
            .mcq-act .ic{width:clamp(28px,2.2vw,34px);height:clamp(28px,2.2vw,34px);border-radius:10px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;}
            .mcq-act-share{background:#EDF2EE;color:#34503F;border-color:#D6DFD9;}
            .mcq-act-share .ic{background:#fff;color:#34503F;}
            .mcq-act-download{background:#E8EDF5;color:#2E3C5C;border-color:#D2DAE8;}
            .mcq-act-download .ic{background:#fff;color:#2E3C5C;}
            .mcq-act-retake{background:#F4E2DD;color:#8A4A39;border-color:#E8CFC7;}
            .mcq-act-retake .ic{background:#fff;color:#8A4A39;}
            .mcq-act-next{background:linear-gradient(135deg,#0B1426,#1A2848);color:#fff;border-color:#0B1426;}
            .mcq-act-next .ic{background:#F5C518;color:#0B1426;}
            .mcq-act-dash{background:#FBFAF7;color:#3A4357;border-color:#ECE7DD;}
            .mcq-act-dash .ic{background:#fff;color:#3A4357;}
          `}</style>

          {/* Completed badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'clamp(0.5rem,0.8vw,0.85rem)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, fontWeight: 700, background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '4px 12px', fontSize: 12, color: '#047857' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              Test Completed
            </span>
          </div>

          {/* Heading */}
          <div style={{ textAlign: 'center', marginBottom: 'clamp(0.9rem,1.2vw,1.25rem)' }}>
            <h1 style={{ fontWeight: 800, letterSpacing: '-0.02em', color: '#17223E', fontSize: 28, lineHeight: '34px', margin: '0 0 6px' }}>
              Prelims Mock Test Evaluation Completed!
            </h1>
            <p style={{ fontWeight: 500, color: '#475467', fontSize: 14, lineHeight: '20px', margin: 0 }}>
              Great effort! Here{'\''}s your performance analysis
            </p>
          </div>

          {/* Score ring */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'clamp(1rem,1.5vw,1.4rem)' }}>
            {(() => {
              const size = 140;
              const stroke = 11;
              const radius = (size - stroke) / 2;
              const circ = 2 * Math.PI * radius;
              const dash = (Math.max(0, Math.min(100, scorePct)) / 100) * circ;
              return (
                <div style={{ position: 'relative', width: size, height: size }}>
                  <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
                    <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#10B981" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1, fontSize: 38, color: '#17223E' }}>
                      {correct}<span style={{ color: '#9CA3AF', fontSize: '0.58em' }}>/{total}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', color: '#10B981', marginTop: 6, textTransform: 'uppercase' }}>
                      Score · {scorePct}%
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: 'clamp(0.65rem,0.9vw,1rem)', marginBottom: 'clamp(0.85rem,1.2vw,1.15rem)' }}>
            {[
              { label: 'Accuracy', value: `${scorePct}%`, sub: 'this attempt', valueSize: 26, cls: 'dmscore-accuracy', iconCls: 'dmscore-icon-accuracy', barColor: '#7FB29A', barPct: Math.max(0, Math.min(100, Math.round(scorePct))), icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>) },
              { label: 'Time Taken', value: `${timeMinutes}m ${timeSeconds}s`, sub: durationLabel, valueSize: 26, cls: 'dmscore-time', iconCls: 'dmscore-icon-time', barColor: '#8AA3C4', barPct: durationSeconds > 0 ? Math.max(0, Math.min(100, Math.round((timeTaken / durationSeconds) * 100))) : 0, icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2"/><path d="M9 2h6"/></svg>) },
              { label: 'Speed', value: `${speedPerQ} min/Q`, sub: 'Avg per question', valueSize: 22, cls: 'dmscore-speed', iconCls: 'dmscore-icon-speed', barColor: '#C9A876', barPct: Math.max(0, Math.min(100, Math.round(parseFloat(speedPerQ) * 100))), icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" fill="currentColor" stroke="none"/></svg>) },
              { label: 'Your Rank', value: rankLabel, sub: rankSubLabel, valueSize: 22, cls: 'dmscore-rank', iconCls: 'dmscore-icon-rank', barColor: '#A99BC4', barPct: rankBarPct, icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4h10v4a5 5 0 0 1-10 0V4z"/><path d="M5 4H3v2a3 3 0 0 0 3 3"/><path d="M19 4h2v2a3 3 0 0 1-3 3"/><path d="M12 13v4"/><path d="M8 21h8"/><path d="M9 17h6l1 4H8z" fill="currentColor" stroke="none"/></svg>) },
            ].map((s) => (
              <div key={s.label} className={`dmscore-card ${s.cls}`}>
                <div className={`dmscore-icon ${s.iconCls}`}>{s.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', color: '#64748B', textTransform: 'uppercase', marginTop: 10, position: 'relative', zIndex: 1 }}>{s.label}</div>
                <div style={{ fontWeight: 800, letterSpacing: '-0.02em', color: '#0F172A', fontSize: s.valueSize, lineHeight: 1.1, marginTop: 4, position: 'relative', zIndex: 1 }}>{s.value}</div>
                <div className="dmscore-bar" style={{ marginTop: 8 }}><span style={{ width: `${s.barPct}%`, background: s.barColor }} /></div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 8, position: 'relative', zIndex: 1 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Question-wise review + actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.65rem,0.85vw,0.9rem)' }}>
            <button
              type="button"
              onClick={() => router.push(reviewHref)}
              className="qw-review-btn"
              style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(8px,0.9vw,12px)', borderRadius: 14, padding: 'clamp(12px,1vw,16px)', fontSize: 'clamp(13px,0.8vw,15px)', fontWeight: 700, cursor: 'pointer' }}
            >
              <span className="qw-badge">{total} Q</span>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" style={{ position: 'relative', zIndex: 1 }}>
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
              <span style={{ position: 'relative', zIndex: 1 }}>View Question-wise Review</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ position: 'relative', zIndex: 1 }}>
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>

            <div className="grid grid-cols-3" style={{ gap: 'clamp(0.5rem,0.65vw,0.75rem)' }}>
              <button type="button" onClick={() => setShowShareModal(true)} className="mcq-act mcq-act-share" style={{ justifyContent: 'center', textAlign: 'center' }}>
                <span className="ic">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M6.5 5.5L10 3.5M6.5 10.5L10 12.5M6.5 8A2 2 0 1 1 2.5 8A2 2 0 0 1 6.5 8ZM13.5 3A2 2 0 1 1 9.5 3A2 2 0 0 1 13.5 3ZM13.5 13A2 2 0 1 1 9.5 13A2 2 0 0 1 13.5 13Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                Share Score
              </button>
              <button type="button" onClick={() => { if (typeof window !== 'undefined') window.print(); }} className="mcq-act mcq-act-download" style={{ justifyContent: 'center', textAlign: 'center' }}>
                <span className="ic">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M8 2V9M8 9L5 6M8 9L11 6M3 12V13.5H13V12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                Download Report
              </button>
              <button type="button" onClick={() => router.push(retakeHref)} className="mcq-act mcq-act-retake" style={{ justifyContent: 'center', textAlign: 'center' }}>
                <span className="ic">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M13 7A5 5 0 1 0 11.5 10.55M13 7V3.5M13 7H9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                Retake
              </button>
            </div>

            <div className="grid grid-cols-2" style={{ gap: 'clamp(0.5rem,0.8vw,1rem)' }}>
              <button type="button" onClick={() => setShowNextSteps(true)} className="mcq-act mcq-act-next" style={{ justifyContent: 'center', textAlign: 'center' }}>
                <span className="ic">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M8 2.5L9.15 6.85L13.5 8L9.15 9.15L8 13.5L6.85 9.15L2.5 8L6.85 6.85L8 2.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                  </svg>
                </span>
                View Smart Next Steps
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
              <button type="button" onClick={() => router.push('/dashboard')} className="mcq-act mcq-act-dash" style={{ justifyContent: 'center', textAlign: 'center' }}>
                <span className="ic">🏠</span>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Smart Next Steps + Share Score open as modals — the exact Daily MCQ
            Challenge flow (never inline sections below the score card). */}
        <SmartNextStepsModal open={showNextSteps} onClose={() => setShowNextSteps(false)} />
        <ShareScoreModal
          open={showShareModal}
          onClose={() => setShowShareModal(false)}
          brandLabel="RISEWITHJEET · PRELIMS MOCK TEST"
          challengeName="Prelims Mock Test"
          todayPrefix={false}
          correctCount={correct}
          totalCount={total}
          accuracyPct={scorePct}
          rankLabel={rankLabel}
          streak={streak?.days ?? null}
          shareUrl={shareScoreUrl}
        />

      </div>
    </div>
  );
}

export default function MockTestResultsPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        background: '#F9FAFB',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #E5E7EB',
          borderTopColor: '#0F172B',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ fontSize: '16px', color: '#6B7280' }}>Loading...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <MockTestResultsInner />
    </Suspense>
  );
}
