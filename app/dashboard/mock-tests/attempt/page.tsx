'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { mockTestService } from '@/lib/services';
import { useIsMobile } from '@/hooks/useIsMobile';

interface Question {
  id: number;
  subject: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  text: string;
  options: { label: string; text: string }[];
  correct: string;
  explanation: string;
}

interface MainsAnswer {
  text: string;
  file: File | null;
}

type QuestionStatus = 'unattempted' | 'answered' | 'marked' | 'current';

function normalizeQuestionText(text: string): string {
  return text
    .replace(/[–—]/g, '-')
    .replace(/\s+(\d+\.)\s+/g, '\n$1 ')
    .replace(/\s+-\s+/g, ' ');
}

function normalizeDurationToSeconds(rawDuration: unknown, questionCount: number, isMains: boolean): number {
  const fallbackMinutes = isMains
    ? Math.max(8, questionCount * 8)
    : Math.max(1, questionCount);
  const fallbackSeconds = fallbackMinutes * 60;

  const parsed =
    typeof rawDuration === 'number'
      ? rawDuration
      : typeof rawDuration === 'string'
        ? Number(rawDuration)
        : NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackSeconds;
  }

  // DB records may store duration in minutes; normalize to seconds for countdown.
  if (parsed <= 240) {
    return Math.round(parsed * 60);
  }

  return Math.round(parsed);
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
    text: 'The term “Swaraj” was first used prominently by:',
    options: [
      { label: 'A', text: 'Bal Gangadhar Tilak' },
      { label: 'B', text: 'Mahatma Gandhi' },
      { label: 'C', text: 'Dadabhai Naoroji' },
      { label: 'D', text: 'Subhas Chandra Bose' },
    ],
    correct: 'C',
    explanation: 'Dadabhai Naoroji used “Swaraj” prominently; later Tilak popularized it widely.',
  },
  {
    id: 3,
    subject: 'Geography',
    difficulty: 'Medium',
    text: 'Which one of the following factors most directly influences the formation of monsoon winds over the Indian subcontinent?',
    options: [
      { label: 'A', text: 'Earth’s rotation alone' },
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
    explanation: 'The RBI’s Monetary Policy Committee sets the policy repo rate under the inflation targeting framework.',
  },
  {
    id: 5,
    subject: 'Environment',
    difficulty: 'Medium',
    text: '“Biodiversity hotspot” refers to a region that:',
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

function MockTestAttemptInner() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [navOpen, setNavOpen] = useState(false);
  const searchParams = useSearchParams();
  const testId = searchParams.get('testId');
  const examMode = searchParams.get('examMode') || 'prelims';
  const isMains = examMode === 'mains';
  const title = searchParams.get('title') || (isMains ? 'Mains Practice' : 'Prelims Practice');

  /* ─── API / Loading State ─── */
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitFlowStep, setSubmitFlowStep] = useState(0);
  const [submitFlowProgress, setSubmitFlowProgress] = useState(40);
  const [totalMarks, setTotalMarks] = useState(0);

  /* ─── Quiz State ─── */
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, string>>({});
  const [questionStatuses, setQuestionStatuses] = useState<Record<number, QuestionStatus>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime] = useState(Date.now());

  /* ─── Mains State ─── */
  const [mainsSubmitting, setMainsSubmitting] = useState(false);
  const [mainsAnswers, setMainsAnswers] = useState<Record<number, MainsAnswer>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  /* ─── Mains writing timer ─── */
  const [isMainsTimerRunning, setIsMainsTimerRunning] = useState(false);
  const [mainsWritingSeconds, setMainsWritingSeconds] = useState(20 * 60);
  const [showMainsTypeAnswer, setShowMainsTypeAnswer] = useState(false);
  const mainsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ─── Load questions from API ─── */
  useEffect(() => {
    if (!testId) {
      // No testId: fall back to a built-in 5-question set so the UI always opens from "Resume".
      setQuestions(SAMPLE_QUESTIONS);
      const statuses: Record<number, QuestionStatus> = {};
      SAMPLE_QUESTIONS.forEach((_, i) => {
        statuses[i] = i === 0 ? 'current' : 'unattempted';
      });
      setQuestionStatuses(statuses);
      setTimeLeft(15 * 60);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    async function loadQuestions() {
      setLoading(true);
      setError(null);
      try {
        const res = await mockTestService.getQuestions(testId!);
        if (cancelled) return;

        const rawQs = res.data?.questions || res.data || [];
        const qs: Question[] = rawQs.map((q: any) => ({
          ...q,
          text: q.text || q.questionText || '',
          options: q.options || [],
        }));
        if (!qs.length) {
          throw new Error('No questions returned for this test.');
        }
        setTotalMarks(res.data?.totalMarks || 0);
        setQuestions(qs);
        // Initialize statuses
        const statuses: Record<number, QuestionStatus> = {};
        qs.forEach((_, i) => {
          statuses[i] = i === 0 ? 'current' : 'unattempted';
        });
        setQuestionStatuses(statuses);
        // Set timer based on API duration (minutes or seconds) with a safe fallback.
        const durationSeconds = normalizeDurationToSeconds(res.data?.duration, qs.length, isMains);
        setTimeLeft(durationSeconds);
      } catch (err: any) {
        if (!cancelled) {
          console.error('Failed to load questions:', err);
          setError(err.message || 'Failed to load test questions.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadQuestions();
    return () => { cancelled = true; };
  }, [testId]);

  // Timer countdown (prelims auto-runs; mains uses writing timer instead)
  useEffect(() => {
    if (loading || questions.length === 0) return;
    if (isMains) return; // mains uses manual writing timer
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, questions.length, isMains]);

  // Mains writing timer (manual start/pause)
  useEffect(() => {
    if (!isMains) return;
    if (isMainsTimerRunning) {
      mainsTimerRef.current = setInterval(() => {
        setMainsWritingSeconds(s => {
          if (s <= 1) {
            setIsMainsTimerRunning(false);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (mainsTimerRef.current) clearInterval(mainsTimerRef.current);
    }
    return () => { if (mainsTimerRef.current) clearInterval(mainsTimerRef.current); };
  }, [isMainsTimerRunning, isMains]);


  // Reset writing timer when navigating to a new question
  useEffect(() => {
    if (!isMains || questions.length === 0) return;
    setIsMainsTimerRunning(false);
    setShowMainsTypeAnswer(false);
    const marksPerQ = totalMarks && questions.length ? Math.round(totalMarks / questions.length) : 15;
    const minPerQ = Math.max(8, Math.round(marksPerQ * 0.8));
    setMainsWritingSeconds(minPerQ * 60);
  }, [currentIdx, isMains, questions.length, totalMarks]);

  const totalQuestions = questions.length;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const goToQuestion = useCallback((idx: number) => {
    setQuestionStatuses(prev => {
      const updated = { ...prev };
      // Only change current question status if it's still 'current' (not answered/marked)
      if (updated[currentIdx] === 'current') updated[currentIdx] = 'unattempted';
      if (updated[idx] !== 'answered' && updated[idx] !== 'marked') updated[idx] = 'current';
      return updated;
    });
    setCurrentIdx(idx);
  }, [currentIdx]);

  const handleSelectOption = (label: string) => {
    setSelectedOptions(prev => ({ ...prev, [currentIdx]: label }));
    setQuestionStatuses(prev => ({ ...prev, [currentIdx]: 'answered' }));
  };

  const handleMark = () => {
    setQuestionStatuses(prev => ({ ...prev, [currentIdx]: 'marked' }));
    handleNext();
  };

  const handleClear = () => {
    setSelectedOptions(prev => { const n = { ...prev }; delete n[currentIdx]; return n; });
    setQuestionStatuses(prev => ({
      ...prev,
      [currentIdx]: prev[currentIdx] === 'marked' ? 'unattempted' : prev[currentIdx] === 'answered' ? 'unattempted' : prev[currentIdx],
    }));
  };

  const handleNext = () => {
    if (currentIdx < totalQuestions - 1) goToQuestion(currentIdx + 1);
  };

  const handlePrev = () => {
    if (currentIdx > 0) goToQuestion(currentIdx - 1);
  };

  /* ─── Mains handlers ─── */
  const currentAnswer: MainsAnswer = mainsAnswers[currentIdx] || { text: '', file: null };

  const handleMainsTextChange = (value: string) => {
    setMainsAnswers(prev => ({
      ...prev,
      [currentIdx]: { ...(prev[currentIdx] || { text: '', file: null }), text: value },
    }));
  };

  const handleMainsFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setMainsAnswers(prev => ({
      ...prev,
      [currentIdx]: { ...(prev[currentIdx] || { text: '', file: null }), file },
    }));
    // Reset input so re-selecting the same file still fires change
    e.target.value = '';
  };

  const handleMainsRemoveFile = () => {
    setMainsAnswers(prev => ({
      ...prev,
      [currentIdx]: { ...(prev[currentIdx] || { text: '', file: null }), file: null },
    }));
  };

  const handleMainsNext = () => {
    if (currentIdx < totalQuestions - 1) setCurrentIdx(i => i + 1);
  };

  const handleMainsPrev = () => {
    if (currentIdx > 0) setCurrentIdx(i => i - 1);
  };

  const handleMainsSubmitAll = async () => {
    if (!testId) {
      setError('Cannot submit without a test session. Please regenerate the test.');
      return;
    }

    const missing = questions.findIndex((_, i) => {
      const a = mainsAnswers[i];
      return !a || (!a.text.trim() && !a.file);
    });
    if (missing !== -1) {
      setCurrentIdx(missing);
      setError(`Please provide an answer for Question ${missing + 1} before submitting.`);
      return;
    }

    setError(null);
    setMainsSubmitting(true);

    try {
      const attemptIds: string[] = [];
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const a = mainsAnswers[i];
        const resp = await mockTestService.submitMainsAnswer(testId, String(q.id), {
          answerText: a?.text?.trim() || undefined,
          file: a?.file || undefined,
        });
        const id = resp.data?.attemptId;
        if (id) attemptIds.push(id);
      }

      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          `mockTestMainsAttempts:${testId}`,
          JSON.stringify({ attemptIds, title })
        );
      }
      router.push(
        `/dashboard/mock-tests/attempt/evaluating?testId=${testId}&title=${encodeURIComponent(title)}`
      );
    } catch (err: any) {
      console.error('Mains submit failed:', err);
      setError(err.message || 'Failed to submit answers. Please try again.');
      setMainsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Sample mode (no testId): store local results and open results screen
    if (!testId) {
      const total = questions.length;
      const correctCount = correct;
      const wrongCount = wrong;
      const skippedCount = Math.max(0, total - Object.keys(selectedOptions).length);
      const accuracyPct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
      const review = questions.map((q, idx) => {
        const selected = selectedOptions[idx];
        const status: 'correct' | 'wrong' | 'skipped' =
          selected ? (selected === q.correct ? 'correct' : 'wrong') : 'skipped';
        const delta = status === 'correct' ? 2 : status === 'wrong' ? -0.67 : 0;
        // simple, deterministic per-question time estimate for UI
        const timeSec = 60 + (idx % 4) * 15;
        return {
          idx: idx + 1,
          text: q.text.split('\n').slice(0, 2).join(' ').trim(),
          timeSec,
          status,
          delta,
        };
      });

      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          'mockTestSampleResults',
          JSON.stringify({
            title,
            total,
            correct: correctCount,
            wrong: wrongCount,
            skipped: skippedCount,
            accuracyPct,
            scoreText: `${correctCount}/${total}`,
            review,
            selectedOptions,
            questions,
          })
        );
      }

      setSubmitting(true);
      setSubmitFlowStep(0);
      setSubmitFlowProgress(40);
      await wait(650);
      setSubmitFlowStep(1);
      setSubmitFlowProgress(58);
      await wait(650);
      setSubmitFlowStep(2);
      setSubmitFlowProgress(76);
      await wait(650);
      setSubmitFlowStep(3);
      setSubmitFlowProgress(90);
      await wait(550);
      setSubmitFlowStep(4);
      setSubmitFlowProgress(100);
      await wait(450);
      router.push(`/dashboard/mock-tests/attempt/results?mode=sample&title=${encodeURIComponent(title)}`);
      return;
    }
    setSubmitting(true);
    setSubmitFlowStep(0);
    setSubmitFlowProgress(40);
    setError(null);
    try {
      const flow = (async () => {
        await wait(650);
        setSubmitFlowStep(1);
        setSubmitFlowProgress(58);
        await wait(650);
        setSubmitFlowStep(2);
        setSubmitFlowProgress(76);
        await wait(650);
        setSubmitFlowStep(3);
        setSubmitFlowProgress(90);
        await wait(550);
        setSubmitFlowStep(4);
        setSubmitFlowProgress(100);
        await wait(450);
      })();

      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      // Build answers map: questionId -> selected option label
      const answersMap: Record<string, string> = {};
      Object.entries(selectedOptions).forEach(([idx, opt]) => {
        const q = questions[Number(idx)];
        if (q) {
          answersMap[String(q.id)] = opt;
        }
      });
      await Promise.all([mockTestService.submit(testId, answersMap, timeTaken), flow]);
      router.push(`/dashboard/mock-tests/attempt/results?testId=${testId}`);
    } catch (err: any) {
      console.error('Failed to submit test:', err);
      setError(err.message || 'Failed to submit test. Please try again.');
      setSubmitting(false);
      setSubmitFlowStep(0);
      setSubmitFlowProgress(40);
    }
  };

  // Stats
  const answered = Object.values(questionStatuses).filter(s => s === 'answered').length;
  const marked = Object.values(questionStatuses).filter(s => s === 'marked').length;
  const correct = Object.entries(selectedOptions).filter(([idx, opt]) => questions[Number(idx)]?.correct === opt).length;
  const wrong = Object.keys(selectedOptions).length - correct;
  const netScore = correct * 2 - wrong * 0.67;

  const currentQ = questions[currentIdx];

  const renderSubmitEvaluationCard = (progressPct = 40, activeStep = 0) => {
    const evalSteps = [
      'Reading your handwritten answers',
      'Identifying key points & arguments',
      'Comparing with model answers',
      'Preparing detailed markup & feedback',
      "Generating Jeet Sir's analysis",
    ];

    return (
      <div
        style={{
          width: 'min(960px, calc(100vw - 40px))',
          minHeight: 472,
          borderRadius: 32,
          background: 'linear-gradient(154deg, #1D293D 0%, #0F172B 50%, #162456 100%)',
          boxShadow: '0 20px 12.5px rgba(0,0,0,0.10), 0 8px 5px rgba(0,0,0,0.10), 0 22px 44px rgba(15,23,42,0.18)',
          padding: '40px clamp(28px, 5vw, 48px) 44px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div style={{ fontSize: 56, lineHeight: '60px', marginBottom: 24 }}>🧠</div>
        <h2 style={{ margin: 0, color: '#FFFFFF', fontSize: 'clamp(24px, 3vw, 30px)', lineHeight: '36px', fontWeight: 800, textAlign: 'center' }}>
          AI is evaluating your answers...
        </h2>
        <p style={{ margin: '12px 0 38px', color: '#BEDBFF', fontSize: 16, lineHeight: '24px', textAlign: 'center' }}>
          This usually takes about 30 seconds
        </p>

        <div style={{ width: 'min(448px, 100%)', height: 8, borderRadius: 999, background: '#314158', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ width: `${Math.min(100, Math.max(8, progressPct))}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #FDC700 0%, #FF6900 100%)', transition: 'width 0.35s ease' }} />
        </div>

        <div style={{ width: 'min(448px, 100%)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {evalSteps.map((label, index) => {
            const isDone = index < activeStep || activeStep >= evalSteps.length - 1;
            const isActive = index === activeStep && activeStep < evalSteps.length - 1;
            const isHighlighted = isDone || isActive;

            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, height: 20 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: isHighlighted ? '#FDC700' : '#314158', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {isHighlighted && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M3 6.1L5.05 8.15L9 4.2" stroke="#162033" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span style={{ color: isHighlighted ? '#FDC700' : '#6A7282', fontSize: 14, lineHeight: '20px', fontWeight: isHighlighted ? 600 : 400 }}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const statusColor: Record<QuestionStatus, string> = {
    answered: '#00C950',
    current: '#2B7FFF',
    marked: '#FDC700',
    unattempted: '#314158',
  };

  /* ─── Loading State ─── */
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#FFFFFF',
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
        <span style={{ fontSize: '16px', color: '#6B7280' }}>Loading test questions...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ─── Error State ─── */
  if (error && questions.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        fontFamily: 'Inter, sans-serif',
      }}>
        <span style={{ fontSize: '48px' }}>⚠️</span>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#101828', margin: 0 }}>Something went wrong</h2>
        <p style={{ fontSize: '14px', color: '#6B7280', maxWidth: '400px', textAlign: 'center' }}>{error}</p>
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

  if (!currentQ) return null;

  /* ──────────────────────────── MAINS UI ──────────────────────────── */
  if (isMains) {
    const marksPerQ = totalMarks && totalQuestions ? Math.round(totalMarks / totalQuestions) : 15;
    const minPerQ = Math.max(1, Math.round(marksPerQ * 0.5));
    const isLast = currentIdx === totalQuestions - 1;
    const answeredCount = questions.reduce((acc, _, i) => {
      const a = mainsAnswers[i];
      return acc + (a && (a.text.trim() || a.file) ? 1 : 0);
    }, 0);

    /* ── Questions screen (mains) — compact one-screen layout ── */
    return (
      <div style={{ height: isMobile ? 'auto' : '100vh', minHeight: isMobile ? '100%' : undefined, overflow: isMobile ? 'visible' : 'hidden', background: '#F2F4F8', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>

        {/* ── Header ── */}
        <div style={{ background: 'linear-gradient(90.38deg, #10182D 0.28%, #17223E 99.72%)', padding: '9px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>✍️</span>
              <div>
                <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 13 }}>{title}</span>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 1 }}>Mains Mock Test · {totalQuestions} Questions</div>
              </div>
            </div>
            <span style={{ color: '#FDC700', fontWeight: 700, fontSize: 12 }}>
              {answeredCount} of {totalQuestions} answered
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ flexShrink: 0, height: 3, background: '#E5E7EB' }}>
          <div style={{ height: '100%', width: `${Math.round((answeredCount / Math.max(1, totalQuestions)) * 100)}%`, background: '#F59E0B', transition: 'width 0.3s ease' }} />
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#FEF2F2', borderBottom: '1px solid #FECACA', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 13 }}>⚠️</span>
            <span style={{ fontSize: 13, color: '#991B1B' }}>{error}</span>
          </div>
        )}

        {/* ── Body ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 12, padding: isMobile ? '10px' : '10px 16px 10px', overflow: isMobile ? 'visible' : 'hidden', boxSizing: 'border-box', minHeight: 0 }}>

          {/* ── Left column ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0, overflow: isMobile ? 'visible' : 'hidden' }}>

            {/* Question card */}
            <div style={{ background: '#FFFFFF', borderRadius: 14, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', flexShrink: 0 }}>
              {/* Chips row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, flexWrap: 'wrap' }}>
                <div style={{ background: '#EFF6FF', borderRadius: 999, padding: '3px 10px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#155DFC' }}>{(currentQ as any).paper || 'GS Paper I'}</span>
                </div>
                {currentQ.subject && (
                  <div style={{ background: '#F3E8FF', borderRadius: 999, padding: '3px 10px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#6B21A8' }}>{currentQ.subject}</span>
                  </div>
                )}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#EF4444' }}>LIVE NOW</span>
                </div>
              </div>

              {/* Question badge + marks */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ background: '#0F172B', color: '#FFFFFF', fontWeight: 700, fontSize: 11, padding: '3px 10px', borderRadius: 6 }}>
                  QUESTION {currentIdx + 1} OF {totalQuestions}
                </div>
                <span style={{ fontSize: 12, color: '#6B7280' }}>{marksPerQ} marks · {minPerQ} min</span>
              </div>

              {/* Question text — scrolls internally if too long */}
              <div style={{ fontSize: 14, fontWeight: 500, color: '#17223E', lineHeight: '22px', maxHeight: 110, overflowY: 'auto', paddingRight: 4 }}>
                {currentQ.text}
              </div>

              {/* Meta */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>
                <span>⏱ {minPerQ} min</span>
                <span>📝 ~250 words</span>
                <span>⭐ {marksPerQ} marks</span>
              </div>
            </div>

            {/* Answer card — flex:1, holds upload + submit */}
            <div style={{ background: '#FFFFFF', borderRadius: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '12px 16px' }}>

              {/* Upload zone (primary) or file confirmation */}
              {!currentAnswer.file ? (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                  style={{ border: '1.5px dashed #CBD5E1', borderRadius: 12, background: '#F9FAFB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, cursor: 'pointer', gap: 5, minHeight: 120 }}
                >
                  <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf,.docx" style={{ display: 'none' }} onChange={handleMainsFileSelect} />
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#17223E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M8 12l4-4m0 0l4 4m-4-4v8" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#101828' }}>Drop your answer script here</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>Upload handwritten answers for AI evaluation</div>
                  <div style={{ display: 'flex', gap: 5, marginTop: 2 }}>
                    {['JPG', 'PNG', 'PDF', 'DOCX'].map(fmt => (
                      <span key={fmt} style={{ background: '#E5E7EB', borderRadius: 4, padding: '2px 7px', fontSize: 11, color: '#374151' }}>{fmt}</span>
                    ))}
                    <span style={{ background: '#E5E7EB', borderRadius: 4, padding: '2px 7px', fontSize: 11, color: '#374151' }}>Max 10MB</span>
                  </div>
                  <button type="button" style={{ marginTop: 6, background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: 8, padding: '6px 16px', fontWeight: 700, fontSize: 12, cursor: 'pointer', color: '#111827' }}>
                    Browse Files
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 12, padding: '10px 14px', flex: 1, maxHeight: 72 }}>
                  <div>
                    <div style={{ fontSize: 14, color: '#15803D', fontWeight: 700 }}>📎 {currentAnswer.file.name}</div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{(currentAnswer.file.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                  <button type="button" onClick={handleMainsRemoveFile} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#15803D', fontSize: 18, fontWeight: 700 }}>✕</button>
                </div>
              )}

              {/* OR Type your answer */}
              <div style={{ textAlign: 'center', marginTop: 7 }}>
                <button
                  type="button"
                  onClick={() => setShowMainsTypeAnswer(s => !s)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#6B7280', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  OR Type your answer {showMainsTypeAnswer ? '▲' : '▼'}
                </button>
              </div>

              {/* Textarea (collapsible) */}
              {showMainsTypeAnswer && (
                <div style={{ marginTop: 6 }}>
                  <textarea
                    value={currentAnswer.text}
                    onChange={(e) => handleMainsTextChange(e.target.value)}
                    placeholder="Write your answer here..."
                    rows={3}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 13, lineHeight: '19px', color: '#0F172B', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box', background: '#FAFAFA' }}
                  />
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                    {currentAnswer.text.trim() ? `${currentAnswer.text.trim().split(/\s+/).filter(Boolean).length} words` : '0 words'}
                  </div>
                </div>
              )}

              {/* ── Bottom actions ── */}
              <div style={{ marginTop: 8, flexShrink: 0 }}>
                {/* Prev link */}
                {currentIdx > 0 && (
                  <button
                    type="button"
                    onClick={handleMainsPrev}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#9CA3AF', fontWeight: 600, marginBottom: 6, display: 'inline-flex', alignItems: 'center', gap: 3 }}
                  >
                    ← Previous Question
                  </button>
                )}
                {/* Primary CTA */}
                {isLast ? (
                  <button
                    type="button"
                    disabled={mainsSubmitting}
                    onClick={handleMainsSubmitAll}
                    style={{ width: '100%', height: 44, background: '#17223E', color: '#FFFFFF', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: mainsSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: mainsSubmitting ? 0.75 : 1 }}
                  >
                    {mainsSubmitting ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="animate-spin" style={{ flexShrink: 0 }}>
                          <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" />
                          <path d="M12 2a10 10 0 0 1 10 10" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                          <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Submit Answer for Evaluation
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleMainsNext}
                    style={{ width: '100%', height: 44, background: '#17223E', color: '#FFFFFF', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    Save &amp; Next Question →
                  </button>
                )}
                <div style={{ textAlign: 'center', fontSize: 11, color: '#9CA3AF', marginTop: 5 }}>✦ Get detailed feedback in 60 seconds</div>
              </div>
            </div>
          </div>

          {/* ── Right: Writing Timer ── */}
          <div style={{ width: isMobile ? '100%' : 200, flexShrink: 0, display: 'flex', flexDirection: 'column', order: isMobile ? -1 : 0 }}>
            <div style={{ background: '#FFFFFF', borderRadius: 14, padding: '18px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontWeight: 600, fontSize: 10, letterSpacing: '0.07em', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 14, textAlign: 'center' }}>
                WRITING TIMER
              </div>
              {/* Circular timer */}
              <div style={{
                width: 108, height: 108, borderRadius: '50%',
                border: `4px solid ${isMainsTimerRunning ? '#17223E' : '#E5E7EB'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 10, transition: 'border-color 0.3s',
                background: isMainsTimerRunning ? 'rgba(15,26,48,0.04)' : 'transparent',
              }}>
                <span style={{ fontWeight: 700, fontSize: 22, color: '#101828', fontFamily: 'Inter, sans-serif' }}>
                  {formatTime(mainsWritingSeconds)}
                </span>
              </div>
              {/* Status label */}
              <div style={{ fontWeight: 600, fontSize: 10, letterSpacing: '0.07em', color: isMainsTimerRunning ? '#17223E' : '#9CA3AF', textTransform: 'uppercase', marginBottom: 14, textAlign: 'center' }}>
                {isMainsTimerRunning ? 'IN PROGRESS' : mainsWritingSeconds === 0 ? 'COMPLETE' : 'PAUSED'}
              </div>
              {/* Start/Pause */}
              <button
                type="button"
                onClick={() => setIsMainsTimerRunning(r => !r)}
                style={{ width: '100%', height: 40, background: isMainsTimerRunning ? '#DC2626' : '#00BC7D', border: 'none', borderRadius: 10, color: '#FFFFFF', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
              >
                {isMainsTimerRunning ? '⏸ Pause' : '▶ Start'}
              </button>
              {/* Reset */}
              <button
                type="button"
                onClick={() => { setIsMainsTimerRunning(false); setMainsWritingSeconds(minPerQ * 60); }}
                style={{ width: '100%', height: 40, background: '#FFFFFF', border: '1.5px solid #E5E7EB', borderRadius: 10, color: '#374151', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
              >
                ↺ Reset
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }
  /* ─────────────────────────── END MAINS UI ─────────────────────────── */

  // Reusable navigator card (inline aside on desktop, bottom-sheet drawer on mobile)
  const navigatorCard = (
    <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 14, boxShadow: '0px 1px 2px -1px rgba(0,0,0,0.10), 0px 1px 3px rgba(0,0,0,0.10)', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.6px', color: '#6B7280', textTransform: 'uppercase', marginBottom: 10 }}>
        Question Navigator
      </div>

      {/* Color-coded question buttons */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10, overflow: 'auto', flex: 1, alignContent: 'flex-start' }}>
        {questions.map((_, idx) => {
          const status = questionStatuses[idx] || 'unattempted';
          const isCurrent = idx === currentIdx;
          const isAnswered = status === 'answered';
          const isMarked = status === 'marked';

          let bg = '#F3F4F6';
          let color = '#6B7280';
          if (isAnswered) { bg = '#DCFCE7'; color = '#166534'; }
          if (isMarked) { bg = '#FEF3C7'; color = '#92400E'; }
          if (isCurrent) { bg = '#0F172B'; color = '#FFFFFF'; }

          return (
            <button
              key={idx}
              onClick={() => { goToQuestion(idx); setNavOpen(false); }}
              style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #E5E7EB', background: bg, color, fontWeight: 700, fontSize: 12, cursor: 'pointer', flexShrink: 0 }}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 8, marginBottom: 8 }}>
        {[
          { label: 'Answered', color: '#00C950', value: answered },
          { label: 'Unanswered', color: '#D1D5DB', value: Math.max(0, totalQuestions - answered - marked) },
          { label: 'Marked for review', color: '#F59E0B', value: marked },
        ].map((row) => (
          <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, background: row.label === 'Answered' ? '#DCFCE7' : row.label === 'Marked for review' ? '#FEF3C7' : '#F3F4F6', border: `1px solid ${row.color}` }} />
              <span style={{ fontSize: 11, color: '#374151' }}>{row.label}</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>{row.value}</span>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 10 }}>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{ width: '100%', height: 38, background: '#0F172B', border: 'none', borderRadius: 10, color: '#FFFFFF', fontWeight: 700, fontSize: 13, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
        >
          ✓ Submit Test
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ height: isMobile ? 'auto' : '100%', minHeight: isMobile ? '100%' : 0, background: '#E8EDF5', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif', overflow: isMobile ? 'visible' : 'hidden' }}>

      {/* ── Prelims submitting overlay ── */}
      {submitting && !isMains && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(248,250,252,0.92)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, fontFamily: 'Inter, sans-serif', padding: 24 }}>
          {renderSubmitEvaluationCard(submitFlowProgress, submitFlowStep)}
        </div>
      )}

      {/* ── Sub-header: title left + timer right ── */}
      <div
        style={{
          background: 'linear-gradient(90.38deg, #10182D 0.28%, #17223E 99.72%)',
          padding: '8px 24px 9px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          {/* Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span aria-hidden="true" style={{ fontSize: 14, lineHeight: '16px', flexShrink: 0 }}>🏛️</span>
            <div style={{ minWidth: 0 }}>
              <span style={{ fontWeight: 700, fontSize: 13, lineHeight: '18px', color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                {title}
              </span>
              <div style={{ fontWeight: 500, fontSize: 10, lineHeight: '14px', color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>
                Today Prelims Mock Test · {totalQuestions} Questions · +0.67 per wrong
              </div>
            </div>
          </div>
          {/* Timer — white text on dark bg */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/timer-icon.png" alt="Timer" style={{ width: 32, height: 32, objectFit: 'contain' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 20, lineHeight: '24px', color: timeLeft < 60 ? '#FB2C36' : '#FFFFFF' }}>
                {formatTime(timeLeft)}
              </span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>
                TIME LEFT
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Progress row ── */}
      <div
        style={{
          background: '#FFFFFF',
          borderBottom: '0.8px solid #D1D9E6',
          display: 'flex',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 1400,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingLeft: 24,
            paddingRight: 24,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ flex: 1, marginRight: 16, height: 4, borderRadius: 999, background: '#D1D9E6', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.round((answered / Math.max(1, totalQuestions)) * 100)}%`,
                height: '100%',
                background: '#00C950',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <div style={{ fontWeight: 600, fontSize: 12, lineHeight: '16px', color: '#364153', whiteSpace: 'nowrap' }}>
            Q {currentIdx + 1} / {totalQuestions} · {answered} Answered
          </div>
          {isMobile && (
            <button
              onClick={() => setNavOpen(true)}
              style={{ marginLeft: 12, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, background: '#0F172B', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 3.5h12M2 8h12M2 12.5h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
              Questions
            </button>
          )}
        </div>
      </div>

      {/* ── Submit Error Banner ── */}
      {error && (
        <div style={{
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          padding: '12px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '14px' }}>⚠️</span>
          <span style={{ fontSize: '14px', color: '#991B1B' }}>{error}</span>
        </div>
      )}

      {/* ── Body (centered fixed frame) ── */}
      <div
        style={{
          flex: 1,
          padding: isMobile ? '8px' : '6px 6px 8px',
          boxSizing: 'border-box',
          display: 'flex',
          justifyContent: 'center',
          overflow: isMobile ? 'visible' : 'hidden',
          minHeight: 0,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: isMobile ? '100%' : 'calc(100vw - 96px)',
            display: 'flex',
            gap: 12,
            boxSizing: 'border-box',
            alignItems: 'flex-start',
            height: isMobile ? 'auto' : '100%',
          }}
        >
        {/* ─ Question Panel ── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, height: isMobile ? 'auto' : '100%', overflow: isMobile ? 'visible' : 'hidden', width: '100%' }}>

          {/* Question Card */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 10,
              border: 'none',
              padding: isMobile ? '14px 16px' : '16px 24px',
              boxShadow: '0px 1px 2px -1px rgba(0,0,0,0.10), 0px 1px 3px rgba(0,0,0,0.10)',
              overflow: isMobile ? 'visible' : 'hidden',
              display: 'flex',
              flexDirection: 'column',
              flex: isMobile ? 'none' : 1,
            }}
          >
            {/* Subject pill + difficulty pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexShrink: 0 }}>
              {/* Subject pill */}
              <div className="flex items-center gap-2 bg-[#EFF6FF] px-4 rounded-full h-[34px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/tag-one.png" alt="Tag" className="w-4 h-4" />
                <span className="font-arimo font-bold text-[#155DFC] text-[14px] leading-[16px]">{currentQ.subject || 'General'}</span>
              </div>
              {/* Difficulty pill */}
              <div className="flex items-center gap-2 bg-[#FFF7ED] px-4 rounded-full h-[34px]">
                <span className="font-arimo font-bold text-[#C2410C] text-[14px] leading-[16px]">{currentQ.difficulty || 'Medium'}</span>
              </div>
            </div>

            {/* Question text */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 14, flexShrink: 0 }}>
              <div className="font-arimo font-bold text-[#101828]" style={{ whiteSpace: 'pre-line', flex: 1, fontSize: 13, lineHeight: '20px' }}>
                <span style={{ fontWeight: 700 }}>Question {currentIdx + 1} of {totalQuestions}:</span>{' '}
                <span>{normalizeQuestionText(currentQ.text)}</span>
              </div>
              {/* Bookmark button */}
              <button
                onClick={() => {
                  const newStatuses = { ...questionStatuses };
                  newStatuses[currentIdx] = newStatuses[currentIdx] === 'marked' ? (selectedOptions[currentIdx] ? 'answered' : 'unattempted') : 'marked';
                  setQuestionStatuses(newStatuses);
                }}
                title={questionStatuses[currentIdx] === 'marked' ? 'Remove bookmark' : 'Bookmark this question'}
                style={{ display: 'none' }}
              >
                {questionStatuses[currentIdx] === 'marked' ? '★' : '☆'}
              </button>
            </div>

            {/* Options */}
            <div className="space-y-2" style={{ overflow: isMobile ? 'visible' : 'hidden', flex: isMobile ? 'none' : 1, minHeight: 0 }}>
              {currentQ.options.map(opt => {
                const isSelected = selectedOptions[currentIdx] === opt.label;

                let bg = '#FFFFFF';
                let border = '2px solid #E2E8F0';
                let circleColor = '#CBD5E1';
                let circleBg = 'transparent';
                let circleText = '#64748B';
                let circleIcon: string = opt.label;
                let textColor = '#1E293B';
                let fontWeight = 400;

                if (isSelected) {
                  bg = '#EFF6FF';
                  border = '2px solid #2B7FFF';
                  circleColor = '#2B7FFF';
                  circleBg = '#DBEAFE';
                  circleText = '#2B7FFF';
                  fontWeight = 600;
                }

                return (
                  <button
                    key={opt.label}
                    onClick={() => handleSelectOption(opt.label)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '10px 18px',
                      borderRadius: '12px',
                      minHeight: 58,
                      border,
                      background: bg,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      width: '100%',
                    }}
                  >
                    <span style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      border: `2px solid ${circleColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '14px',
                      color: circleText,
                      flexShrink: 0,
                      background: circleBg,
                    }}>
                      {circleIcon}
                    </span>
                    <span style={{ fontSize: '14px', color: textColor, fontWeight }}>
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Explanations are hidden during the quiz and revealed only on the
                results screen, so students focus on finishing first. */}
          </div>

          {/* Controls Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FFFFFF',
            borderRadius: 10,
            padding: '8px 12px',
            border: '1px solid #E5E7EB',
            flexShrink: 0,
            position: isMobile ? 'sticky' : 'static',
            bottom: isMobile ? 8 : undefined,
            zIndex: isMobile ? 5 : undefined,
            boxShadow: isMobile ? '0 -2px 8px rgba(0,0,0,0.06)' : undefined,
          }}>
            {/* Left actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={handleMark}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: '#FB2C36',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '13px',
                  lineHeight: '20px',
                }}
              >
                 Mark
              </button>
              <button
                onClick={handleClear}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  width: '52px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6A7282',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '13px',
                  lineHeight: '20px',
                  letterSpacing: '0px',
                  padding: 0,
                }}
              >
                 Clear
              </button>
              <button
                onClick={handleNext}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: '#155DFC',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '13px',
                  lineHeight: '20px',
                }}
              >
                Skip
              </button>
            </div>

            {/* Right nav */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={handlePrev}
                disabled={currentIdx === 0}
                style={{
                  background: 'none',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: '8px',
                  padding: '5px 13px',
                  color: currentIdx === 0 ? '#CBD5E1' : '#334155',
                  cursor: currentIdx === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                ← Prev
              </button>
              <button
                onClick={handleNext}
                disabled={currentIdx === totalQuestions - 1}
                style={{
                  background: currentIdx === totalQuestions - 1 ? '#1E293B' : '#2B7FFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '5px 18px',
                  color: '#FFFFFF',
                  cursor: currentIdx === totalQuestions - 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                Next →
              </button>
            </div>
          </div>
        </main>

        {/* ── Right panel (Navigator card) — desktop only ── */}
        {!isMobile && (
          <aside style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
            {navigatorCard}
          </aside>
        )}
        </div>
      </div>

      {/* ── Mobile navigator bottom-sheet drawer ── */}
      {isMobile && navOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setNavOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxHeight: '80vh', background: '#FFFFFF', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 14, boxShadow: '0 -8px 24px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <div style={{ width: 40, height: 4, borderRadius: 999, background: '#D1D5DB' }} />
            </div>
            {navigatorCard}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MockTestAttemptPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        background: '#FFFFFF',
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
      <MockTestAttemptInner />
    </Suspense>
  );
}
