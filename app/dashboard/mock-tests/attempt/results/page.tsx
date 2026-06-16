'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { mockTestService, flashcardService, spacedRepService } from '@/lib/services';

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
}

type MainsSlideKey = 'feedback' | 'markup' | 'rubric';

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
  const searchParams = useSearchParams();
  const testId = searchParams.get('testId');
  const mode = searchParams.get('mode');
  const examMode = searchParams.get('examMode') || 'prelims';
  const isMains = examMode === 'mains';
  const title = searchParams.get('title') || 'Test Series';

  const [results, setResults] = useState<ResultsData | null>(null);
  const [reviewQuestions, setReviewQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(1);
  const [mainsData, setMainsData] = useState<MainsPerQuestion[] | null>(null);
  const [selectedQ, setSelectedQ] = useState(0);        // mains: which question's score card is shown
  const [qSlide, setQSlide] = useState<MainsSlideKey>('feedback'); // mains: inner slide for the selected question
  const [modelOpen, setModelOpen] = useState(false);    // mains: model answer modal
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  /* ─── Next-steps tab state ─── */
  // Mains opens directly on the score card; prelims keeps the next-steps landing.
  const [activeTab, setActiveTab] = useState<'next-steps' | 'review'>(isMains ? 'review' : 'next-steps');
  const [cards, setCards] = useState<CardItem[]>(fallbackCards);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [heroTitle, setHeroTitle] = useState('Great session!');
  const [heroSubtitle, setHeroSubtitle] = useState("You've completed today's practice. Here's what the best aspirants do next to keep climbing.");

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleAddToFlashcards = async (q: any) => {
    setActionLoading(`flashcard-${q.idx}`);
    try {
      const correctOpt = q.options?.find((o: any) => o.label === q.correct);
      await flashcardService.createCard({
        subjectId: '',
        subject: q.subject || 'General',
        topic: q.subject || 'General',
        question: q.text || q.questionText || '',
        answer: correctOpt?.text || q.correct || '',
        difficulty: q.difficulty || 'Medium',
      });
      showToast('Added to flashcards!');
    } catch {
      showToast('Failed to add to flashcards', 'error');
    }
    setActionLoading(null);
  };

  const handleNeedToRevise = async (q: any) => {
    setActionLoading(`revise-${q.idx}`);
    try {
      await spacedRepService.addItem({
        questionText: q.text || q.questionText || '',
        subject: q.subject || 'General',
        source: 'mock-test',
        sourceType: 'mcq',
        scheduleDay: 1,
        scheduleDays: [1, 3, 7, 14, 30],
        remindEnabled: true,
      });
      showToast('Added to spaced repetition!');
    } catch {
      showToast('Failed to add to revision', 'error');
    }
    setActionLoading(null);
  };

  const handleStudyNotes = (q: any) => {
    if (typeof window !== 'undefined') {
      const notes = JSON.parse(sessionStorage.getItem('studyNotes') || '[]');
      notes.push({
        questionId: q.idx,
        question: q.text || q.questionText || '',
        subject: q.subject || 'General',
        addedAt: new Date().toISOString(),
      });
      sessionStorage.setItem('studyNotes', JSON.stringify(notes));
    }
    showToast('Saved to study notes!');
  };

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

        if (data.questions && Array.isArray(data.questions)) {
          setReviewQuestions(data.questions.map((q: any, i: number) => ({
            idx: i + 1,
            text: q.questionText || q.text || '',
            subject: q.subject || '',
            options: (q.options || []).map((o: any) => ({ label: o.id || o.label, text: o.text })),
            correct: q.correctOption || q.correct || '',
            selected: q.selectedOption || q.selected || null,
            isCorrect: q.isCorrect ?? false,
            explanation: q.explanation || '',
            status: !q.selectedOption && !q.selected ? 'skipped' : (q.isCorrect ? 'correct' : 'wrong'),
            delta: !q.selectedOption && !q.selected ? 0 : (q.isCorrect ? 2 : -0.67),
            timeSec: '-',
          })));
        }

        setResults({
          total,
          correct,
          wrong,
          skipped,
          netScore: typeof netScore === 'number' ? netScore.toFixed(2) : netScore,
          scorePct,
          perfLabel,
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

  /* ─── Shared: tab bar ─── */
  const tabBar = (
    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
      {(['next-steps', 'review'] as const).map(tab => (
        <button
          key={tab}
          type="button"
          onClick={() => setActiveTab(tab)}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 14,
            fontFamily: 'Inter, sans-serif',
            background: activeTab === tab ? '#17223E' : '#E5E7EB',
            color: activeTab === tab ? '#FFFFFF' : '#374151',
            transition: 'background 0.15s ease, color 0.15s ease',
          }}
        >
          {tab === 'next-steps' ? 'What would you like to do next? →' : 'Review Answers'}
        </button>
      ))}
    </div>
  );

  /* ─── Shared: next steps content ─── */
  const nextStepsContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Hero card */}
      <div style={{
        borderRadius: 32,
        background: '#1D293D',
        boxShadow: '0 8px 10px -6px rgba(0,0,0,0.1), 0 20px 25px -5px rgba(0,0,0,0.1)',
        padding: '48px 32px',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: 16,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/emoji-6.png" alt="celebration" style={{ width: 72, height: 72, objectFit: 'contain' }} />
        <h2 style={{ fontSize: 40, fontWeight: 700, color: '#FFFFFF', margin: 0, textAlign: 'center', lineHeight: '48px' }}>
          {heroTitle}
        </h2>
        <p style={{ fontSize: 16, color: '#BEDBFF', margin: 0, textAlign: 'center', lineHeight: '26px' }}>
          {heroSubtitle}
        </p>
      </div>

      {/* 2×2 action cards */}
      <div>
        <p style={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: '1.2px',
          textTransform: 'uppercase' as const,
          color: '#6B7280',
          margin: '0 0 16px 4px',
        }}>
          Next Steps
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: 20 }}>
          {displayCards.map((card) => (
            <div
              key={card.title}
              onClick={() => router.push(card.href)}
              style={{
                borderRadius: 32,
                background: card.dark ? '#1D293D' : '#FFFFFF',
                boxShadow: '0 4px 6px -4px rgba(0,0,0,0.1), 0 10px 15px -3px rgba(0,0,0,0.1)',
                padding: 32,
                display: 'flex',
                flexDirection: 'column' as const,
                gap: 12,
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 16px -4px rgba(0,0,0,0.15), 0 16px 24px -3px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 6px -4px rgba(0,0,0,0.1), 0 10px 15px -3px rgba(0,0,0,0.1)';
              }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: card.iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: card.icon === '+' ? 36 : 26, fontWeight: 700,
                color: card.iconColor || '#fff', overflow: 'hidden',
              }}>
                {card.imgSrc
                  ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={card.imgSrc} alt={card.title} style={{ width: 30, height: 36, objectFit: 'contain' }} />
                  )
                  : <span style={{ lineHeight: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{card.icon}</span>
                }
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 700, margin: 0, lineHeight: '30px', color: card.dark ? '#FFFFFF' : '#0F172B' }}>
                {card.title}
              </h3>
              <p style={{ fontSize: 14, margin: 0, lineHeight: '22px', color: card.dark ? '#BEDBFF' : '#4A5565', flex: 1 }}>
                {card.desc}
              </p>
              <div style={{
                display: 'inline-flex', alignItems: 'center',
                background: card.badgeBg, borderRadius: 999,
                padding: '6px 16px', alignSelf: 'flex-start',
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: card.badgeColor, lineHeight: '16px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {card.title === 'Unlock Pro Practice' && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z"/>
                    </svg>
                  )}
                  {card.badge}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Streak card */}
      <div style={{
        borderRadius: 32,
        background: '#FFFFFF',
        boxShadow: '0 4px 6px -4px rgba(0,0,0,0.1), 0 10px 15px -3px rgba(0,0,0,0.1)',
        padding: 32,
        display: 'flex', alignItems: 'center', gap: 24,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/fire-emoji.png" alt="streak" style={{ width: 52, height: 52, objectFit: 'contain', flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0F172B', margin: 0, lineHeight: '28px' }}>
            {streak
              ? `${streak.days}-day streak – you're in the top ${streak.percentile}%!`
              : "12-day streak – you're in the top 18%!"}
          </h3>
          <p style={{ fontSize: 16, color: '#364153', margin: 0, lineHeight: '26px' }}>
            {streak?.message || (
              <>
                Come back tomorrow to extend your streak.{' '}
                <strong style={{ fontWeight: 600 }}>Consistent practice</strong>{' '}
                is the biggest predictor of clearing Prelims. See you tomorrow!
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );

  /* ─── Mains Results View ─── */
  if (isMains && mainsData) {
    const totalScore = mainsData.reduce((a, b) => a + (b.score || 0), 0);
    const totalMax = mainsData.reduce((a, b) => a + (b.maxScore || 0), 0) || 1;
    const pct = Math.round((totalScore / totalMax) * 100);
    const headline =
      pct >= 70 ? 'Strong attempt across all questions'
      : pct >= 50 ? 'Good attempt — solid foundation'
      : 'Keep practising — real progress ahead';

    const selected = mainsData[Math.min(selectedQ, mainsData.length - 1)];

    return (
      <>
      <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'Inter, sans-serif', padding: '40px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <button
            type="button"
            onClick={() => router.push('/dashboard/mock-tests')}
            style={{ background: 'transparent', border: 'none', color: '#374151', fontWeight: 600, cursor: 'pointer', marginBottom: 16 }}
          >
            ← Back to Mock Tests
          </button>

          {/* Header card — always visible */}
          <div style={{ borderRadius: 24, background: '#0F172B', overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ padding: '28px 32px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: '#1E3A5F', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: '#FBBF24', textTransform: 'uppercase', marginBottom: 8 }}>
                  🖥 AI EVALUATION COMPLETE
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF', margin: '0 0 4px' }}>{headline}</h2>
                <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>
                  {title} · Mains · {mainsData.length} Questions evaluated
                </p>
              </div>
              <div style={{ position: 'relative', width: 96, height: 96 }}>
                <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="48" cy="48" r="42" fill="none" stroke="#64748B" strokeWidth="6" />
                  <circle
                    cx="48" cy="48" r="42" fill="none" stroke="#FBBF24" strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={2 * Math.PI * 42 * (1 - Math.min(1, Math.max(0, pct / 100)))}
                    strokeLinecap="round"
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>{pct}%</span>
                  <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, letterSpacing: '0.1em', marginTop: 4 }}>MARKS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab bar */}
          {tabBar}

          {/* Next steps tab */}
          {activeTab === 'next-steps' && nextStepsContent}

          {/* Review tab — per-question score card (ported from Daily Answer Writing) */}
          {activeTab === 'review' && (() => {
            const q = mainsData[Math.min(selectedQ, mainsData.length - 1)];
            const qPct = q.maxScore > 0 ? Math.round((q.score / q.maxScore) * 100) : 0;
            const detailedParas = (q.detailedFeedback || '').split(/\n+/).map((s) => s.trim()).filter(Boolean);
            const checkedPages = (q.checkedCopyPages || []).filter((p) => p.checkedCopyUrl);
            const displayPages = checkedPages.length > 0
              ? checkedPages
              : q.checkedCopyUrl ? [{ pageNumber: 1, checkedCopyUrl: q.checkedCopyUrl }] : [];
            const markupReady = displayPages.length > 0;

            const summaryCards = [
              { id: 'score', label: 'Question Score', value: `${q.score}/${q.maxScore}`, hint: `${qPct}% examiner alignment`, bg: '#FEF3C7', border: '#FCD34D', color: '#92400E' },
              { id: 'str', label: 'Strong Points', value: `${q.strengths.length}`, hint: 'Well-handled elements', bg: '#DCFCE7', border: '#86EFAC', color: '#166534' },
              { id: 'imp', label: 'Needs Work', value: `${q.improvements.length}`, hint: 'Priority fix areas', bg: '#FEF3C7', border: '#FDE68A', color: '#A16207' },
              { id: 'words', label: 'Word Count', value: `${q.wordCount ?? 0}`, hint: 'From your submission', bg: '#DBEAFE', border: '#93C5FD', color: '#1D4ED8' },
            ];

            const innerSlides: Array<{ key: MainsSlideKey; label: string }> = [
              { key: 'feedback', label: 'Feedback' },
              { key: 'markup', label: "Examiner's Markup" },
              { key: 'rubric', label: 'Score Breakdown' },
            ];

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Question selector */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {mainsData.map((mq, i) => {
                    const active = i === selectedQ;
                    const mPct = mq.maxScore > 0 ? Math.round((mq.score / mq.maxScore) * 100) : 0;
                    const tone = mPct >= 60 ? '#16A34A' : mPct >= 40 ? '#D97706' : '#DC2626';
                    return (
                      <button
                        key={mq.idx}
                        onClick={() => { setSelectedQ(i); setQSlide('feedback'); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '9px 14px', borderRadius: 10, cursor: 'pointer',
                          border: active ? '1.5px solid #17223E' : '1px solid #E5E7EB',
                          background: active ? '#17223E' : '#FFFFFF',
                          color: active ? '#FFFFFF' : '#374151',
                          fontSize: 13, fontWeight: 700, fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        Q{mq.idx}
                        <span style={{ fontSize: 11, fontWeight: 700, color: active ? '#FDC700' : tone }}>
                          {mq.score}/{mq.maxScore}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Question text + score hero */}
                <div style={{ borderRadius: 14, background: 'linear-gradient(90deg, #101828 0%, #17223E 100%)', padding: '24px 28px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: '#D1D5DC', textTransform: 'uppercase', marginBottom: 10 }}>
                    Question {q.idx}{q.subject ? ` · ${q.subject}` : ''}{q.paper ? ` · ${q.paper}` : ''}
                  </div>
                  <p className="italic" style={{ fontSize: 16, lineHeight: '26px', color: '#E5E7EB', fontFamily: 'var(--font-merriweather), Georgia, serif', margin: '0 0 18px', whiteSpace: 'pre-line' }}>
                    &quot;{q.questionText}&quot;
                  </p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 64, lineHeight: '60px', color: '#FDC700' }}>{q.score}</span>
                    <span style={{ fontWeight: 700, fontSize: 28, color: '#FDC70087' }}>/{q.maxScore}</span>
                  </div>
                  <p style={{ marginTop: 10, color: '#D1D5DC', fontSize: 13 }}>
                    Examiner score based on structure, depth, relevance, and substantiation.
                  </p>
                </div>

                {/* Inner slide tabs */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {innerSlides.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setQSlide(s.key)}
                      style={{
                        padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        border: qSlide === s.key ? 'none' : '1px solid #E5E7EB',
                        background: qSlide === s.key ? '#17223E' : '#FFFFFF',
                        color: qSlide === s.key ? '#FFFFFF' : '#4A5565',
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* FEEDBACK slide */}
                {qSlide === 'feedback' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Summary metric cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {summaryCards.map((m) => (
                        <div key={m.id} className="flex flex-col items-center justify-center rounded-[10px] p-4" style={{ background: m.bg, border: `1px solid ${m.border}` }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#6A7282', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{m.label}</span>
                          <span style={{ fontSize: 22, fontWeight: 700, color: m.color }}>{m.value}</span>
                          <span className="text-center mt-2" style={{ fontSize: 12, color: '#4A5565', lineHeight: '18px' }}>{m.hint}</span>
                        </div>
                      ))}
                    </div>

                    {/* Personalised Feedback */}
                    <div style={{ background: '#FFFFFF', borderRadius: 14, boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A', padding: '28px 28px 24px' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ fontSize: 20 }}>🎯</span>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#101828' }}>Personalised Feedback</h2>
                      </div>
                      <p style={{ fontSize: 13, color: '#6A7282', marginBottom: 24 }}>Actionable insights to help you improve, not just a score</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        {/* Strengths */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span style={{ width: 28, height: 28, borderRadius: 7, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>✅</span>
                            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#101828' }}>What You Did Well</h3>
                          </div>
                          <div className="flex flex-col gap-2">
                            {q.strengths.length > 0 ? q.strengths.map((item, i) => (
                              <div key={i} className="flex items-start gap-2 rounded-[8px] px-3 py-2.5" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                                <span style={{ color: '#16A34A', fontSize: 13, flexShrink: 0, marginTop: 1 }}>→</span>
                                <span style={{ fontSize: 13, color: '#166534', lineHeight: '20px' }}>{item}</span>
                              </div>
                            )) : (
                              <div className="rounded-[8px] px-3 py-2.5" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                                <span style={{ fontSize: 13, color: '#166534' }}>No structured strengths returned yet.</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Improvements */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span style={{ width: 28, height: 28, borderRadius: 7, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>⚠️</span>
                            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#92400E' }}>Areas to Improve</h3>
                          </div>
                          <div className="flex flex-col gap-2">
                            {q.improvements.length > 0 ? q.improvements.map((item, i) => (
                              <div key={i} className="flex items-start gap-2 rounded-[8px] px-3 py-2.5" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                                <span style={{ color: '#D97706', fontSize: 13, flexShrink: 0, marginTop: 1 }}>▲</span>
                                <span style={{ fontSize: 13, color: '#92400E', lineHeight: '20px' }}>{item}</span>
                              </div>
                            )) : (
                              <div className="rounded-[8px] px-3 py-2.5" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                                <span style={{ fontSize: 13, color: '#92400E' }}>No improvement bullets returned.</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Suggestions */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span style={{ width: 28, height: 28, borderRadius: 7, background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>💡</span>
                            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1D4ED8' }}>Value-Add Ideas</h3>
                          </div>
                          <div className="flex flex-col gap-2">
                            {q.suggestions.length > 0 ? q.suggestions.map((item, i) => (
                              <div key={i} className="flex items-start gap-2 rounded-[8px] px-3 py-2.5" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                                <span style={{ color: '#2563EB', fontSize: 13, flexShrink: 0, marginTop: 1 }}>◆</span>
                                <span style={{ fontSize: 13, color: '#1E40AF', lineHeight: '20px' }}>{item}</span>
                              </div>
                            )) : (
                              <div className="rounded-[8px] px-3 py-2.5" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                                <span style={{ fontSize: 13, color: '#1E40AF' }}>No extra suggestions returned yet.</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Key Terms */}
                    {q.keyTerms && q.keyTerms.length > 0 && (
                      <div style={{ background: '#FFFFFF', borderRadius: 14, boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A', padding: '24px 28px' }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ fontSize: 18 }}>🔑</span>
                          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#101828' }}>Key Terms Analysis</h2>
                        </div>
                        <p style={{ fontSize: 13, color: '#6A7282', marginBottom: 16 }}>Terms an examiner would expect in a {q.maxScore}-mark answer</p>
                        <div className="flex flex-wrap gap-2">
                          {q.keyTerms.map((kt, i) => (
                            <span key={i} className="flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ fontSize: 13, fontWeight: 500, background: kt.found ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${kt.found ? '#BBF7D0' : '#FECACA'}`, color: kt.found ? '#166534' : '#B91C1C' }}>
                              <span>{kt.found ? '✓' : '✗'}</span>{kt.term}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Next Attempt Focus */}
                    {q.nextAttemptFocus && (
                      <div style={{ background: '#EEF2FF', borderRadius: 14, padding: '20px 24px', border: '1px solid #C7D2FE' }}>
                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4338CA', marginBottom: 10 }}>🎯 Next Attempt Focus</p>
                        <p style={{ fontSize: 14, color: '#3730A3', lineHeight: '22px' }}>{q.nextAttemptFocus}</p>
                      </div>
                    )}

                    {/* Evaluator's Conclusion */}
                    {q.evaluatorConclusion && (
                      <div style={{ background: '#F0FDF4', borderRadius: 14, padding: '20px 24px', border: '1px solid #BBF7D0' }}>
                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#166534', marginBottom: 10 }}>✅ Evaluator&apos;s Conclusion</p>
                        <p style={{ fontSize: 14, color: '#14532D', lineHeight: '22px' }}>{q.evaluatorConclusion}</p>
                      </div>
                    )}

                    {/* Model Answer CTA */}
                    {(q.modelAnswerContent || (q.modelAnswerKeyPoints && q.modelAnswerKeyPoints.length > 0)) && (
                      <div style={{ background: 'linear-gradient(90deg, #101828 0%, #17223E 100%)', borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#FDC700', marginBottom: 6 }}>📋 Model Answer Available</p>
                          <p style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 4 }}>See how an ideal answer looks</p>
                          <p style={{ fontSize: 13, color: '#9CA3AF' }}>Compare your answer with an expert-crafted model answer.</p>
                        </div>
                        <button onClick={() => setModelOpen(true)} style={{ flexShrink: 0, background: '#FDC700', color: '#101828', fontWeight: 700, fontSize: 14, padding: '10px 20px', borderRadius: 10, whiteSpace: 'nowrap', border: 'none', cursor: 'pointer' }}>
                          View Now →
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* MARKUP slide */}
                {qSlide === 'markup' && (
                  <div style={{ borderRadius: 14, background: '#FFFFFF', boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A', padding: 32 }}>
                    <h2 className="font-bold text-[#101828] mb-2" style={{ fontSize: 22 }}>{markupReady ? 'Checked Copy' : "Examiner's Markup"}</h2>
                    <p className="text-[#4A5565] mb-6" style={{ fontSize: 14 }}>
                      {markupReady ? 'Teacher-style checked copy is ready.' : 'Visual markup is generated for handwritten image uploads.'}
                    </p>
                    {markupReady ? (
                      <div className="space-y-4">
                        {displayPages.map((page) => (
                          <div key={page.pageNumber} className="rounded-[12px] border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="rounded-full bg-[#FEE2E2] px-3 py-1 text-[12px] font-bold text-[#B91C1C]">BETA</span>
                                <span className="text-[13px] font-bold text-[#364153]">Page {page.pageNumber}</span>
                              </div>
                              <a href={page.checkedCopyUrl || '#'} target="_blank" rel="noreferrer" className="text-[13px] font-bold text-[#2563EB]">Open full size</a>
                            </div>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={page.checkedCopyUrl || ''} alt={`Checked copy page ${page.pageNumber}`} className="w-full rounded-[10px]" style={{ border: '1px solid #E5E7EB', background: '#FFFFFF' }} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="rounded-[12px] border border-[#BBF7D0] bg-[#F0FDF4] p-5">
                          <h3 className="font-bold text-[#166534] mb-3" style={{ fontSize: 15 }}>Positive examiner notes</h3>
                          {q.strengths.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {q.strengths.map((item, i) => (
                                <span key={i} className="rounded-full px-3 py-2" style={{ background: '#DCFCE7', color: '#166534', fontSize: 13, lineHeight: '18px' }}>{item}</span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[#166534]" style={{ fontSize: 13, lineHeight: '20px' }}>Positive markup will appear here when line-level comments are returned.</p>
                          )}
                        </div>
                        <div className="rounded-[12px] border border-[#FDE68A] bg-[#FEFCE8] p-5">
                          <h3 className="font-bold text-[#A16207] mb-3" style={{ fontSize: 15 }}>Attention areas</h3>
                          {q.improvements.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {q.improvements.map((item, i) => (
                                <span key={i} className="rounded-full px-3 py-2" style={{ background: '#FEF3C7', color: '#A16207', fontSize: 13, lineHeight: '18px' }}>{item}</span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[#A16207]" style={{ fontSize: 13, lineHeight: '20px' }}>Improvement markup will appear here when line-level comments are returned.</p>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="mt-6 rounded-[12px] border border-[#E5E7EB] bg-[#F9FAFB] p-6">
                      <h3 className="font-bold text-[#101828] mb-3" style={{ fontSize: 16 }}>Detailed examiner commentary</h3>
                      {detailedParas.length > 0 ? (
                        <div className="space-y-3">
                          {detailedParas.map((p, i) => (
                            <p key={i} className="text-[#374151]" style={{ fontSize: 14, lineHeight: '24px' }}>{p}</p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[#4A5565]" style={{ fontSize: 14, lineHeight: '24px' }}>Detailed commentary was not returned for this submission.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* RUBRIC slide */}
                {qSlide === 'rubric' && (
                  <div style={{ borderRadius: 14, background: '#FFFFFF', boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A', padding: 32 }}>
                    <div className="flex items-center gap-2 mb-6">
                      <span style={{ fontSize: 22 }}>⭐</span>
                      <h2 className="font-bold text-[#101828]" style={{ fontSize: 22 }}>Score Breakdown</h2>
                    </div>
                    {q.parameterScores && q.parameterScores.length > 0 ? (
                      <div className="flex flex-col gap-5">
                        {q.parameterScores.map((param, idx) => {
                          const ppct = param.maxScore > 0 ? Math.round((param.score / param.maxScore) * 100) : 0;
                          const COLORS = [
                            { dot: '#2563EB', pctBg: '#DBEAFE', pctText: '#1D4ED8' },
                            { dot: '#7C3AED', pctBg: '#EDE9FE', pctText: '#5B21B6' },
                            { dot: '#4338CA', pctBg: '#E0E7FF', pctText: '#3730A3' },
                            { dot: '#16A34A', pctBg: '#DCFCE7', pctText: '#15803D' },
                            { dot: '#D97706', pctBg: '#FEF3C7', pctText: '#B45309' },
                            { dot: '#DC2626', pctBg: '#FEE2E2', pctText: '#B91C1C' },
                            { dot: '#0D9488', pctBg: '#CCFBF1', pctText: '#0F766E' },
                          ];
                          const c = COLORS[idx % COLORS.length];
                          return (
                            <div key={param.parameter}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: c.dot, flexShrink: 0, display: 'inline-block' }} />
                                  <span style={{ fontSize: 15, fontWeight: 700, color: '#101828' }}>{param.parameter}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span style={{ fontSize: 15, fontWeight: 700, color: '#EA580C' }}>{param.score}/{param.maxScore}</span>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: c.pctText, background: c.pctBg, borderRadius: 6, padding: '2px 8px' }}>{ppct}%</span>
                                </div>
                              </div>
                              <div style={{ width: '100%', height: 8, borderRadius: 99, background: '#E5E7EB', overflow: 'hidden', marginBottom: 8 }}>
                                <div style={{ height: '100%', width: `${ppct}%`, background: c.dot, borderRadius: 99, transition: 'width 0.6s ease' }} />
                              </div>
                              {param.comment && (
                                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 14px' }}>
                                  <p style={{ fontSize: 13, color: '#374151', lineHeight: '20px' }}>{param.comment}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[#4A5565]" style={{ fontSize: 14, lineHeight: '24px' }}>
                        A parameter-wise breakdown was not returned for this question.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Model Answer Modal (selected question) */}
      {modelOpen && (
        <div
          onClick={() => setModelOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 28 }}>🌟</span>
                <div>
                  <p style={{ fontSize: 17, fontWeight: 700, color: '#101828' }}>AI Model Answer</p>
                  <p style={{ fontSize: 13, color: '#6A7282' }}>Question {selected.idx} · Expert-crafted response for reference</p>
                </div>
              </div>
              <button onClick={() => setModelOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#6A7282', lineHeight: 1, padding: 2 }}>×</button>
            </div>
            <div style={{ padding: '12px 24px', background: '#FFFBEB', borderBottom: '1px solid #FDE68A', flexShrink: 0 }}>
              <p style={{ fontSize: 13, color: '#B45309', lineHeight: '20px' }}>
                <strong>⚡ Reference Only</strong> — Read after you&apos;ve written your own answer. Use this to understand gaps, not to memorise.
              </p>
            </div>
            <div style={{ overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
              {selected.modelAnswerKeyPoints && selected.modelAnswerKeyPoints.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#B45309', marginBottom: 14 }}>📌 KEY POINTS CHECKLIST</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {selected.modelAnswerKeyPoints.map((point, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '12px 16px' }}>
                        <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: '50%', background: '#17223E', color: '#FFFFFF', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                        <p style={{ fontSize: 14, color: '#374151', lineHeight: '22px' }}>{point}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6A7282', marginBottom: 16 }}>📄 FULL MODEL ANSWER</p>
                {selected.modelAnswerContent ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {selected.modelAnswerContent.split(/\n+/).map((p) => p.trim()).filter(Boolean).map((paragraph, i) => {
                      const colonIdx = paragraph.indexOf(':');
                      const looksLikeHeading = colonIdx > 0 && colonIdx < 60 && !paragraph.startsWith('"');
                      return (
                        <p key={i} style={{ fontSize: 15, color: '#1F2937', lineHeight: '26px' }}>
                          {looksLikeHeading ? (<><strong>{paragraph.slice(0, colonIdx + 1)}</strong>{paragraph.slice(colonIdx + 1)}</>) : paragraph}
                        </p>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ fontSize: 14, color: '#6A7282', fontStyle: 'italic' }}>Full model answer will appear here once available for this question.</p>
                )}
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: 12, flexShrink: 0 }}>
              <button onClick={() => setModelOpen(false)} style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #E5E7EB', background: '#FFFFFF', fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
      </>
    );
  }

  /* ─── Prelims Results View ─── */
  const { total, correct, wrong, skipped, scorePct } = results!;
  const sample = (results as any)._sample as any | undefined;
  const showConfetti = scorePct > 50;

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'Inter, sans-serif' }}>
      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 9999,
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          background: toast.type === 'success' ? '#F0FDF4' : '#FEF2F2',
          border: toast.type === 'success' ? '1px solid #86EFAC' : '1px solid #FCA5A5',
          color: toast.type === 'success' ? '#166534' : '#991B1B',
          fontSize: '14px',
          fontWeight: 600,
          fontFamily: 'Inter, sans-serif',
          animation: 'slideDown 0.2s ease',
        }}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.message}
        </div>
      )}
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
          width: 'min(100%, 1280px)',
          minHeight: 955.9750366210938,
          marginTop: 52,
          marginLeft: 'auto',
          marginRight: 'auto',
          boxSizing: 'border-box',
          paddingLeft: 24,
          paddingRight: 24,
        }}
      >
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          style={{ background: 'transparent', border: 'none', color: '#374151', fontWeight: 600, cursor: 'pointer', marginBottom: 12 }}
        >
          ← Back to Dashboard
        </button>

        {/* Score header card — always visible */}
        <div
          style={{
            borderRadius: 16,
            background: 'linear-gradient(90.38deg, #10182D 0.28%, #17223E 99.72%)',
            padding: '28px 32px',
            textAlign: 'center',
            color: '#FFFFFF',
            marginBottom: 18,
          }}
        >
          <div style={{ width: 96, height: 96, borderRadius: 999, background: '#FFFFFF', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: '#0F172B', fontWeight: 800, fontSize: 26, lineHeight: '28px' }}>
              {correct}/{total}
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280' }}>Score</div>
            </div>
          </div>

          <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Keep Going, Every Attempt Makes You Better!</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 14 }}>
            {title} · Mock Test · {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginBottom: 18 }}>
            <StatMini label="CORRECT" value={correct} color="#00C950" />
            <StatMini label="WRONG" value={wrong} color="#FB2C36" />
            <StatMini label="SKIPPED" value={skipped} color="#60A5FA" />
            <StatMini label="ACCURACY" value={`${scorePct}%`} color="#FFFFFF" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={() => router.push(`/dashboard/mock-tests/attempt?mode=sample&title=${encodeURIComponent(title)}`)}
              style={{ height: 36, borderRadius: 10, padding: '0 16px', border: 'none', background: 'linear-gradient(89.92deg, #F1A901 0.07%, #FD7302 99.93%)', color: '#0B1120', fontWeight: 800, cursor: 'pointer' }}
            >
              ↻ Reattempt
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('review');
                setTimeout(() => {
                  const el = document.getElementById('mt-full-analysis');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  else router.push('/dashboard/test-analytics');
                }, 50);
              }}
              style={{ height: 36, borderRadius: 10, padding: '0 16px', border: 'none', background: '#314158', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
            >
              📊 Full Analysis
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') window.print();
              }}
              style={{ height: 36, borderRadius: 10, padding: '0 16px', border: 'none', background: '#314158', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
            >
              📄 PDF Report
            </button>
          </div>
        </div>

        {/* Tab bar */}
        {tabBar}

        {/* Next steps tab */}
        {activeTab === 'next-steps' && nextStepsContent}

        {/* Review tab */}
        {activeTab === 'review' && (
          <div id="mt-full-analysis" style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, color: '#101828', marginBottom: 12 }}>
              <span style={{ width: 18, height: 18, borderRadius: 4, border: '2px solid #00C950', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#00C950' }}>✓</span>
              Answer Review
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(sample?.review ?? reviewQuestions).map((row: any) => {
                const questions: Question[] = (sample?.questions as Question[] | undefined) ?? SAMPLE_QUESTIONS;
                const selectedOptions: Record<number, string> = (sample?.selectedOptions as Record<number, string> | undefined) ?? {};
                const isSample = !!sample;
                const q = isSample ? questions[(row.idx ?? 1) - 1] : {
                  text: row.text,
                  subject: row.subject,
                  options: row.options || [],
                  correct: row.correct,
                  explanation: row.explanation,
                  difficulty: 'Medium' as const,
                  id: row.idx,
                };
                const selected = isSample ? selectedOptions[(row.idx ?? 1) - 1] : row.selected;
                const isExpanded = expandedIdx === row.idx;
                const borderColor = row.status === 'wrong' ? '#FB2C36' : row.status === 'correct' ? '#00C950' : '#E5E7EB';
                const bg = row.status === 'wrong' ? '#FEF2F24D' : row.status === 'correct' ? '#F0FDF44D' : '#FFFFFF';
                const height = row.status === 'wrong' ? 73.5999984741211 : 65.5999984741211;
                const rightText = row.status === 'skipped' ? 'Skipped' : (row.delta < 0 ? row.delta.toFixed(2) : `+${row.delta}`);
                const rightColor = row.status === 'wrong' ? '#FB2C36' : row.status === 'correct' ? '#00C950' : '#6B7280';
                return (
                  <div key={row.idx} style={{ width: '100%' }}>
                    <button
                      type="button"
                      onClick={() => setExpandedIdx(prev => (prev === row.idx ? null : row.idx))}
                      style={{
                        width: '100%',
                        height,
                        borderRadius: 10,
                        background: bg,
                        borderStyle: 'solid',
                        borderTopWidth: 0.8,
                        borderRightWidth: 0.8,
                        borderBottomWidth: 0.8,
                        borderLeftWidth: 4,
                        borderColor,
                        boxSizing: 'border-box',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 16px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 999, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#6B7280', flexShrink: 0 }}>
                          {row.idx}
                        </div>
                        <div style={{ fontSize: 13, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 720 }}>
                          {row.text}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexShrink: 0 }}>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>🕒 {row.timeSec}s</div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: rightColor, minWidth: 52, textAlign: 'right' }}>{rightText}</div>
                        <div style={{ color: '#6B7280', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}>⌄</div>
                      </div>
                    </button>

                    {isExpanded && q ? (
                      <div
                        style={{
                          width: '100%',
                          marginTop: 10,
                          borderRadius: 12,
                          border: '1px solid #E5E7EB',
                          background: '#FFFFFF',
                          padding: 18,
                          boxSizing: 'border-box',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 999, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#6B7280', flexShrink: 0 }}>
                              {row.idx}
                            </div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', lineHeight: '20px', minWidth: 0 }}>
                              {q.text.split('\n').slice(0, 1).join(' ')}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                            <div style={{ fontSize: 12, color: '#6B7280' }}>🕒 {row.timeSec}s</div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: rightColor, minWidth: 52, textAlign: 'right' }}>{rightText}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', background: '#F3F4F6', borderRadius: 8, padding: '4px 8px' }}>
                            {q.subject}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#854D0E', background: '#FEF08A', borderRadius: 8, padding: '4px 8px' }}>
                            PYQ 2019
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {q.options.map((opt: any) => {
                            const isCorrect = opt.label === q.correct;
                            const isSelected = selected === opt.label;
                            const isWrongSelected = isSelected && !isCorrect;
                            const rowBg = isCorrect ? '#F0FDF4' : isWrongSelected ? '#FEF2F2' : '#FFFFFF';
                            const rowBorder = isCorrect ? '1px solid #86EFAC' : isWrongSelected ? '1px solid #FCA5A5' : '1px solid #E5E7EB';
                            const right = isCorrect ? '✓ Correct' : isWrongSelected ? '✕ Your Answer' : '';
                            const rightCol = isCorrect ? '#16A34A' : isWrongSelected ? '#DC2626' : '#6B7280';
                            return (
                              <div
                                key={opt.label}
                                style={{
                                  borderRadius: 10,
                                  border: rowBorder,
                                  background: rowBg,
                                  padding: '12px 14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: 12,
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                  <div style={{ width: 26, height: 26, borderRadius: 8, border: '1px solid #E5E7EB', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#111827', flexShrink: 0 }}>
                                    {opt.label}
                                  </div>
                                  <div style={{ fontSize: 13, color: '#111827', minWidth: 0 }}>
                                    {opt.text}
                                  </div>
                                </div>
                                {right ? <div style={{ fontSize: 12, fontWeight: 700, color: rightCol, flexShrink: 0 }}>{right}</div> : <div />}
                              </div>
                            );
                          })}
                        </div>

                        {selected ? (
                          <div style={{ marginTop: 12, fontSize: 12, color: '#6B7280' }}>
                            You picked:{' '}
                            <span style={{ fontWeight: 800, color: row.status === 'wrong' ? '#DC2626' : '#16A34A' }}>
                              {selected} — {(q.options.find((o: any) => o.label === selected)?.text ?? '')}
                            </span>
                          </div>
                        ) : (
                          <div style={{ marginTop: 12, fontSize: 12, color: '#6B7280' }}>You picked: <span style={{ fontWeight: 800, color: '#6B7280' }}>Skipped</span></div>
                        )}

                        <div
                          style={{
                            marginTop: 12,
                            background: '#EFF6FF',
                            borderRadius: 10,
                            padding: '14px 14px',
                            border: '1px solid #BFDBFE',
                          }}
                        >
                          <div style={{ fontSize: 12, fontWeight: 800, color: '#155DFC', marginBottom: 6 }}>
                            Explanation:
                          </div>
                          <div style={{ fontSize: 13, color: '#1D4ED8', lineHeight: '18px' }}>
                            {q.explanation}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14, fontSize: 12 }}>
                          <button
                            type="button"
                            onClick={() => handleAddToFlashcards(row)}
                            disabled={actionLoading === `flashcard-${row.idx}`}
                            style={{ background: 'transparent', border: 'none', color: '#7C3AED', fontWeight: 700, cursor: actionLoading === `flashcard-${row.idx}` ? 'not-allowed' : 'pointer', padding: 0, opacity: actionLoading === `flashcard-${row.idx}` ? 0.5 : 1 }}>
                            {actionLoading === `flashcard-${row.idx}` ? 'Adding...' : 'Add to Flashcards'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleNeedToRevise(row)}
                            disabled={actionLoading === `revise-${row.idx}`}
                            style={{ background: 'transparent', border: 'none', color: '#DC2626', fontWeight: 700, cursor: actionLoading === `revise-${row.idx}` ? 'not-allowed' : 'pointer', padding: 0, opacity: actionLoading === `revise-${row.idx}` ? 0.5 : 1 }}>
                            {actionLoading === `revise-${row.idx}` ? 'Adding...' : 'Need to Revise'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStudyNotes(row)}
                            style={{ background: 'transparent', border: 'none', color: '#2563EB', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                            Study Notes
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatMini({ label, value, color }: { label: string; value: any; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <div style={{ fontSize: 22, fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.12em' }}>{label}</div>
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
