'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { mockTestService } from '@/lib/services';

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

function buildMainsQuestionPattern(questionCount: number) {
  if (questionCount <= 0) return [];
  if (questionCount === 1) return [{ marks: 10, minutes: 7, words: 150 }];
  if (questionCount === 2) {
    return [
      { marks: 10, minutes: 7, words: 150 },
      { marks: 15, minutes: 11, words: 250 },
    ];
  }

  return Array.from({ length: questionCount }, (_, idx) => {
    const marks = (idx + 1) % 3 === 0 ? 15 : 10;
    return {
      marks,
      minutes: marks === 15 ? 11 : 7,
      words: marks === 15 ? 250 : 150,
    };
  });
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
    text: 'The term â€œSwarajâ€ was first used prominently by:',
    options: [
      { label: 'A', text: 'Bal Gangadhar Tilak' },
      { label: 'B', text: 'Mahatma Gandhi' },
      { label: 'C', text: 'Dadabhai Naoroji' },
      { label: 'D', text: 'Subhas Chandra Bose' },
    ],
    correct: 'C',
    explanation: 'Dadabhai Naoroji used â€œSwarajâ€ prominently; later Tilak popularized it widely.',
  },
  {
    id: 3,
    subject: 'Geography',
    difficulty: 'Medium',
    text: 'Which one of the following factors most directly influences the formation of monsoon winds over the Indian subcontinent?',
    options: [
      { label: 'A', text: 'Earthâ€™s rotation alone' },
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
    explanation: 'The RBIâ€™s Monetary Policy Committee sets the policy repo rate under the inflation targeting framework.',
  },
  {
    id: 5,
    subject: 'Environment',
    difficulty: 'Medium',
    text: 'â€œBiodiversity hotspotâ€ refers to a region that:',
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
  const searchParams = useSearchParams();
  const testId = searchParams.get('testId');
  const examMode = searchParams.get('examMode') || 'prelims';
  const isMains = examMode === 'mains';
  const title = searchParams.get('title') || (isMains ? 'Mains Practice' : 'Prelims Practice');

  /* â”€â”€â”€ API / Loading State â”€â”€â”€ */
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [totalMarks, setTotalMarks] = useState(0);

  /* â”€â”€â”€ Quiz State â”€â”€â”€ */
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, string>>({});
  const [questionStatuses, setQuestionStatuses] = useState<Record<number, QuestionStatus>>({});
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime] = useState(Date.now());

  /* â”€â”€â”€ Mains State â”€â”€â”€ */
  const [mainsPhase, setMainsPhase] = useState<'questions' | 'evaluating'>('questions');
  const [mainsAnswers, setMainsAnswers] = useState<Record<number, MainsAnswer>>({});
  const [evaluationProgress, setEvaluationProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });
  const [mainsTimerActive, setMainsTimerActive] = useState(false);
  const [mainsTimerDuration, setMainsTimerDuration] = useState(0);
  const [mainsEvaluatingElapsed, setMainsEvaluatingElapsed] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* â”€â”€â”€ Load questions from API â”€â”€â”€ */
  useEffect(() => {
    if (!testId) {
      // No testId: fall back to a built-in 5-question set so the UI always opens from "Resume".
      setQuestions(SAMPLE_QUESTIONS);
      const statuses: Record<number, QuestionStatus> = {};
      SAMPLE_QUESTIONS.forEach((_, i) => {
        statuses[i] = i === 0 ? 'current' : 'unattempted';
      });
      setQuestionStatuses(statuses);
      const fallbackDuration = normalizeDurationToSeconds(undefined, SAMPLE_QUESTIONS.length, isMains);
      setTimeLeft(fallbackDuration);
      setMainsTimerDuration(fallbackDuration);
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
        setMainsTimerDuration(durationSeconds);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  // Timer countdown
  useEffect(() => {
    if (loading || questions.length === 0) return;
    if (isMains && !mainsTimerActive) return;
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(interval);
          if (isMains) setMainsTimerActive(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isMains, loading, mainsTimerActive, questions.length]);

  useEffect(() => {
    if (!isMains || mainsPhase !== 'evaluating') return;
    setMainsEvaluatingElapsed(0);
    const interval = setInterval(() => {
      setMainsEvaluatingElapsed((value) => value + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isMains, mainsPhase]);

  const totalQuestions = questions.length;
  const bookmarkStorageKey = `mock-test-bookmarks:${testId ?? 'sample'}:${examMode}`;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem(bookmarkStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setBookmarkedQuestions(parsed.filter((value) => Number.isInteger(value)));
      }
    } catch {
      /* ignore bad session data */
    }
  }, [bookmarkStorageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(bookmarkStorageKey, JSON.stringify(bookmarkedQuestions));
  }, [bookmarkStorageKey, bookmarkedQuestions]);

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

  const handleToggleBookmark = () => {
    setBookmarkedQuestions((prev) => {
      const exists = prev.includes(currentIdx);
      const next = exists ? prev.filter((idx) => idx !== currentIdx) : [...prev, currentIdx];
      if (typeof window !== 'undefined') {
        try {
          const storageKey = 'mock-test-bookmarked-mcqs';
          const existing = JSON.parse(window.localStorage.getItem(storageKey) || '[]');
          const current = questions[currentIdx];
          const bookmarkId = `mock-${testId ?? 'sample'}-${examMode}-${current?.id ?? currentIdx}`;
          const withoutCurrent = Array.isArray(existing)
            ? existing.filter((item: any) => item?.id !== bookmarkId)
            : [];
          if (!exists && current) {
            withoutCurrent.unshift({
              id: bookmarkId,
              subject: current.subject || 'General Studies',
              difficulty: current.difficulty || 'Medium',
              source: title,
              date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
              question: current.text,
              options: current.options,
              correct: current.correct,
              explanation: current.explanation,
            });
          }
          window.localStorage.setItem(storageKey, JSON.stringify(withoutCurrent.slice(0, 50)));
        } catch {
          /* local bookmark persistence is best-effort */
        }
      }
      return next;
    });
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

  /* â”€â”€â”€ Mains handlers â”€â”€â”€ */
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

  const waitForEvaluation = async (attemptId: string, maxMs = 120_000) => {
    const started = Date.now();
    while (Date.now() - started < maxMs) {
      try {
        const res = await mockTestService.getMainsEvaluationStatus(testId!, attemptId);
        if (res.data?.isComplete) return true;
      } catch {
        /* transient â€” keep polling */
      }
      await new Promise(r => setTimeout(r, 2500));
    }
    return false;
  };

  const handleMainsSubmitAll = async () => {
    if (!testId) {
      setError('Cannot submit without a test session. Please regenerate the test.');
      return;
    }

    // Require at least one form of answer per question
    const missing = questions.findIndex((_, i) => {
      const a = mainsAnswers[i];
      return !a || (!a.text.trim() && !a.file);
    });
    if (missing !== -1) {
      setCurrentIdx(missing);
      setError(`Please provide an answer for Question ${missing + 1} (text or file).`);
      return;
    }

    setError(null);
    setSubmitting(true);
    setMainsTimerActive(false);
    setMainsPhase('evaluating');
    setEvaluationProgress({ done: 0, total: totalQuestions });

    const attemptIds: string[] = [];
    try {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const a = mainsAnswers[i];
        const resp = await mockTestService.submitMainsAnswer(testId, String(q.id), {
          answerText: a?.text?.trim() || undefined,
          file: a?.file || undefined,
        });
        const attemptId = (resp as any).attemptId || resp.data?.attemptId || (resp as any).data?.data?.attemptId;
        if (attemptId) attemptIds.push(attemptId);
        setEvaluationProgress(p => ({ ...p, done: Math.min(p.total, i + 1) }));
      }

      if (!attemptIds.length) {
        throw new Error('No evaluation attempt was created. Please try submitting again.');
      }

      // Poll for each attempt to complete evaluation
      for (const id of attemptIds) {
        await waitForEvaluation(id);
      }

      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          `mockTestMainsAttempts:${testId}`,
          JSON.stringify({ attemptIds, title })
        );
      }
      router.push(
        `/dashboard/mock-tests/attempt/results?testId=${testId}&examMode=mains&title=${encodeURIComponent(title)}`
      );
    } catch (err: any) {
      console.error('Mains submit failed:', err);
      setError(err.message || 'Failed to submit answers. Please try again.');
      setMainsPhase('questions');
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    const storeLocalResults = () => {
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
    };

    // Sample mode (no testId): store local results and open results screen
    if (!testId) {
      storeLocalResults();
      router.push(`/dashboard/mock-tests/attempt/results?mode=sample&title=${encodeURIComponent(title)}`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      // Build answers map: questionId -> selected option label
      const answersMap: Record<string, string> = {};
      Object.entries(selectedOptions).forEach(([idx, opt]) => {
        const q = questions[Number(idx)];
        if (q) {
          answersMap[String(q.id)] = opt;
        }
      });
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          `mockTestReview:${testId}`,
          JSON.stringify({ questions, selectedOptions, title, examMode })
        );
      }
      const submitWithTimeout = Promise.race([
        mockTestService.submit(testId, answersMap, timeTaken),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Submit request timed out')), 8000)),
      ]);
      await submitWithTimeout;
      router.push(`/dashboard/mock-tests/attempt/results?testId=${testId}`);
    } catch (err: any) {
      console.error('Failed to submit test:', err);
      storeLocalResults();
      router.push(`/dashboard/mock-tests/attempt/results?mode=sample&testId=${encodeURIComponent(testId)}&title=${encodeURIComponent(title)}`);
    }
  };

  // Stats
  const answered = Object.values(questionStatuses).filter(s => s === 'answered').length;
  const marked = Object.values(questionStatuses).filter(s => s === 'marked').length;
  const bookmarked = bookmarkedQuestions.length;
  const correct = Object.entries(selectedOptions).filter(([idx, opt]) => questions[Number(idx)]?.correct === opt).length;
  const wrong = Object.keys(selectedOptions).length - correct;
  const netScore = correct * 2 - wrong * 0.67;

  const currentQ = questions[currentIdx];
  const [questionTitle, questionBodyRaw] = (currentQ?.text ?? '').split('\n\n', 2);
  const questionBody = questionBodyRaw ?? '';

  const statusColor: Record<QuestionStatus, string> = {
    answered: '#00C950',
    current: '#2B7FFF',
    marked: '#FDC700',
    unattempted: '#314158',
  };

  /* â”€â”€â”€ Loading State â”€â”€â”€ */
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#FAFBFE',
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

  /* â”€â”€â”€ Error State â”€â”€â”€ */
  if (error && questions.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#FAFBFE',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        fontFamily: 'Inter, sans-serif',
      }}>
        <span style={{ fontSize: '48px' }}>âš ï¸</span>
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

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ MAINS UI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  if (isMains) {
    const mainsPattern = buildMainsQuestionPattern(totalQuestions);
    const currentPattern = mainsPattern[currentIdx] || { marks: 15, minutes: 11, words: 250 };
    const marksPerQ = currentPattern.marks;
    const minPerQ = currentPattern.minutes;
    const targetWords = currentPattern.words;
    const isLast = currentIdx === totalQuestions - 1;
    const answeredCount = questions.reduce((acc, _, i) => {
      const a = mainsAnswers[i];
      return acc + (a && (a.text.trim() || a.file) ? 1 : 0);
    }, 0);

    /* â”€â”€ Evaluating screen â”€â”€ */
    if (mainsPhase === 'evaluating') {
      const { done, total } = evaluationProgress;
      const evaluationSteps = [
        { key: 'read', title: 'Reading your submitted answers', subtitle: `Identifying key points in ${total || totalQuestions} answer${(total || totalQuestions) === 1 ? '' : 's'}` },
        { key: 'rubric', title: 'Applying UPSC marking rubric', subtitle: 'Checking demand, structure, examples and balance' },
        { key: 'score', title: 'Scoring each mains response', subtitle: 'Assigning marks question by question' },
        { key: 'feedback', title: 'Preparing detailed feedback', subtitle: 'Writing strengths, gaps and improvement notes' },
        { key: 'analysis', title: 'Generating Jeet Sir analysis', subtitle: 'Finalizing your result summary' },
      ];
      const activeStepIndex = Math.min(evaluationSteps.length - 1, Math.max(done, Math.floor(mainsEvaluatingElapsed / 8)));
      const pct = Math.min(96, Math.max(12, Math.round(((activeStepIndex + 0.45) / evaluationSteps.length) * 100)));
      const secondsRemaining = Math.max(0, 60 - mainsEvaluatingElapsed);
      return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #E6EAF0 0%, #DDE2EA 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arimo, Inter, sans-serif', padding: 24 }}>
          <div style={{ width: 768, maxWidth: '100%', borderRadius: 16, background: '#FFFFFF', boxShadow: '0px 8px 10px -6px #0000001A, 0px 20px 25px -5px #0000001A', padding: '32px 40px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 18 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/eval-header.png" alt="Evaluating" style={{ width: 64, height: 64, objectFit: 'contain', marginBottom: 12 }} />
              <h1 style={{ fontFamily: 'Arimo', fontWeight: 700, fontSize: 26, lineHeight: '32px', color: '#1E2939', textAlign: 'center', margin: '0 0 6px' }}>
                Evaluating Your Answers
              </h1>
              <p style={{ fontFamily: 'Arimo', fontWeight: 400, fontSize: 15, lineHeight: '22px', color: '#4A5565', textAlign: 'center', margin: '0 0 2px' }}>
                Analyzing with UPSC examiner&apos;s lens
              </p>
              <p style={{ fontFamily: 'Arimo', fontWeight: 400, fontSize: 13, lineHeight: '18px', color: '#6A7282', textAlign: 'center', margin: 0 }}>
                This usually takes 30-60 seconds
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 18 }}>
              {evaluationSteps.map((step, idx) => {
                const doneStep = idx < activeStepIndex || done > idx;
                const active = idx === activeStepIndex && !doneStep;
                return (
                  <div key={step.key}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ width: 36, height: 36, borderRadius: 10, background: ['#FEF3C7', '#DBEAFE', '#FCE7F3', '#DCFCE7', '#EDE9FE'][idx], display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: doneStep || active ? 1 : 0.42 }}>
                          <span style={{ width: 14, height: 14, borderRadius: '50%', background: doneStep ? '#22C55E' : active ? '#17223E' : '#D1D5DB' }} />
                        </span>
                        <div>
                          <p style={{ fontFamily: 'Arimo', fontWeight: 700, fontSize: 15, lineHeight: '20px', color: '#17223E', margin: 0 }}>
                            {step.title}
                          </p>
                          <p style={{ fontFamily: 'Arimo', fontWeight: 400, fontSize: 13, lineHeight: '18px', color: '#4A5565', margin: 0 }}>
                            {step.subtitle}
                          </p>
                        </div>
                      </div>
                      {doneStep ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <circle cx="12" cy="12" r="11" stroke="#22C55E" strokeWidth="2" />
                          <path d="M7 12.5L10.5 16L17 9" stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : active ? (
                        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '3px solid #D1D5DB', borderTopColor: '#17223E', animation: 'spin 0.8s linear infinite' }} />
                      ) : (
                        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #D1D5DB' }} />
                      )}
                    </div>
                    {idx < evaluationSteps.length - 1 && <div style={{ width: '100%', height: 1, background: '#B1B1B1' }} />}
                  </div>
                );
              })}
            </div>

            <div style={{ borderRadius: 10, borderLeft: '4px solid #FDC700', background: '#FEFCE8', padding: '18px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/eval-timer.png" alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />
                <span style={{ fontFamily: 'DM Sans, Arimo, sans-serif', fontWeight: 700, fontSize: 14, lineHeight: '20px', color: '#101828' }}>
                  {secondsRemaining > 0 ? `${secondsRemaining} Seconds Remaining` : 'Almost done...'}
                </span>
              </div>
              <div style={{ width: 362, maxWidth: '100%', height: 5, borderRadius: 10, background: '#D9D9D9', overflow: 'hidden', margin: '0 auto 12px' }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 10, background: '#101828', transition: 'width 1s linear' }} />
              </div>
              <p style={{ textAlign: 'center', fontFamily: 'Arimo', fontSize: 13, lineHeight: '18px', color: '#364153', margin: '0 0 8px' }}>
                <strong>Submitted:</strong> {done} of {total || totalQuestions} answer{(total || totalQuestions) === 1 ? '' : 's'}. Please keep this screen open while feedback is prepared.
              </p>
              <p style={{ textAlign: 'center', fontFamily: 'Arimo', fontStyle: 'italic', fontSize: 11, lineHeight: '15px', color: '#6A7282', margin: 0 }}>
                &quot;Consistency matters more than perfection. You&apos;re building a skill that compounds.&quot;
              </p>
            </div>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      );
    }

    const wordCount = currentAnswer.text.trim().split(/\s+/).filter(Boolean).length;
    const resetMainsTimer = () => {
      setMainsTimerActive(false);
      setTimeLeft(mainsTimerDuration || minPerQ * 60);
    };

    /* Mains question screen */
    return (
      <div style={{ height: '100vh', background: '#F8F9FC', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(90.38deg, #10182D 0.28%, #17223E 99.72%)', padding: '10px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', flex: '0 0 auto' }}>
          <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 14, lineHeight: '20px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
              <div style={{ color: 'rgba(255,255,255,0.58)', fontSize: 11, lineHeight: '16px', fontWeight: 600 }}>
                Mains answer writing - {marksPerQ} marks - {targetWords} words
              </div>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700, fontSize: 14 }}>
              Question {currentIdx + 1} of {totalQuestions}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 18, fontVariantNumeric: 'tabular-nums' }}>{formatTime(timeLeft)}</span>
              <button
                type="button"
                onClick={() => setMainsTimerActive(v => !v)}
                style={{ height: 30, border: 'none', borderRadius: 8, background: mainsTimerActive ? '#DC2626' : '#00BC7D', color: '#FFFFFF', fontSize: 12, fontWeight: 800, padding: '0 12px', cursor: 'pointer' }}
              >
                {mainsTimerActive ? 'Pause' : 'Start'}
              </button>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'center', flex: '0 0 auto' }}>
          <div style={{ width: '100%', maxWidth: 1160, height: 38, padding: '0 24px', display: 'flex', alignItems: 'center', gap: 14, boxSizing: 'border-box' }}>
            <div style={{ flex: 1, height: 4, background: '#E5E7EB', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.round(((currentIdx + 1) / Math.max(1, totalQuestions)) * 100)}%`, background: '#F59E0B', transition: 'width 0.25s ease' }} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#364153', whiteSpace: 'nowrap' }}>
              {answeredCount} / {totalQuestions} answered
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>âš ï¸</span>
            <span style={{ fontSize: 14, color: '#991B1B' }}>{error}</span>
          </div>
        )}

        {/* Main screen */}
        <div style={{ flex: '1 1 auto', minHeight: 0, padding: '16px 24px 18px', boxSizing: 'border-box', display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
          <div style={{ width: '100%', maxWidth: 1160, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 230px', gap: 18, minHeight: 0 }}>
            <main style={{ background: '#FFFFFF', borderRadius: 16, boxShadow: '0px 1px 3px rgba(0,0,0,0.10), 0px 1px 2px -1px rgba(0,0,0,0.10)', padding: 22, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div style={{ background: '#101828', color: '#FFFFFF', fontWeight: 800, fontSize: 12, padding: '7px 12px', borderRadius: 8, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    Question {currentIdx + 1} of {totalQuestions}
                  </div>
                  <div style={{ color: '#4A5565', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {marksPerQ} marks - {minPerQ} min - {targetWords} words
                  </div>
                </div>
                <div style={{ color: '#6A7282', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {answeredCount} / {totalQuestions} answered
                </div>
              </div>

              <section style={{ background: '#FAFBFE', border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px 18px', marginBottom: 14, flex: '0 1 auto', maxHeight: 150, overflow: 'auto' }}>
                <p style={{ fontSize: 16, fontWeight: 600, color: '#17223E', lineHeight: '25px', margin: 0, whiteSpace: 'pre-line' }}>
                  {currentQ.text}
                </p>
              </section>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 310px', gap: 14, minHeight: 0 }}>
                <section style={{ minWidth: 0 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#101828', marginBottom: 8 }}>
                    Type your answer
                  </label>
                  <textarea
                    value={currentAnswer.text}
                    onChange={(e) => handleMainsTextChange(e.target.value)}
                    placeholder="Write your answer here..."
                    rows={7}
                    style={{
                      width: '100%',
                      height: 178,
                      padding: '13px 14px',
                      border: '1px solid #D1D5DB',
                      borderRadius: 10,
                      fontSize: 14,
                      lineHeight: '22px',
                      color: '#101828',
                      fontFamily: 'inherit',
                      resize: 'none',
                      boxSizing: 'border-box',
                      outline: 'none',
                      background: '#F9FAFB',
                    }}
                  />
                  <div style={{ marginTop: 6, fontSize: 12, color: '#6A7282', textAlign: 'right' }}>
                    {wordCount} words / target {targetWords}
                  </div>
                </section>

                <section style={{ minWidth: 0 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#101828', marginBottom: 8 }}>
                    Upload handwritten answer
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    style={{ display: 'none' }}
                    onChange={handleMainsFileSelect}
                  />
                  {!currentAnswer.file ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        width: '100%',
                        height: 178,
                        border: '1.5px dashed #17223E',
                        borderRadius: 14,
                        background: '#F9FAFB',
                        cursor: 'pointer',
                        padding: '18px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        textAlign: 'center',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/upload-icon.png" alt="" style={{ width: 46, height: 46, objectFit: 'contain' }} />
                      <span style={{ color: '#101828', fontWeight: 800, fontSize: 14 }}>Drop your answer script here</span>
                      <span style={{ color: '#4A5565', fontWeight: 500, fontSize: 12 }}>JPG, PNG or PDF - Max 10MB</span>
                      <span style={{ height: 32, minWidth: 118, borderRadius: 8, border: '1px solid #D1D5DB', background: '#FFFFFF', color: '#111827', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>
                        Browse Files
                      </span>
                    </button>
                  ) : (
                    <div style={{ height: 178, border: '1px solid #86EFAC', borderRadius: 14, background: '#F0FDF4', padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12, boxSizing: 'border-box' }}>
                      <div style={{ color: '#15803D', fontSize: 13, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {currentAnswer.file.name}
                      </div>
                      <div style={{ color: '#166534', fontSize: 12, fontWeight: 600 }}>
                        {(currentAnswer.file.size / 1024 / 1024).toFixed(2)} MB selected
                      </div>
                      <button type="button" onClick={handleMainsRemoveFile} style={{ alignSelf: 'flex-start', background: '#FFFFFF', border: '1px solid #86EFAC', borderRadius: 8, color: '#15803D', cursor: 'pointer', fontSize: 13, fontWeight: 800, padding: '8px 12px' }}>
                        Remove file
                      </button>
                    </div>
                  )}
                </section>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, gap: 12, flex: '0 0 auto' }}>
                <button
                  type="button"
                  onClick={handleMainsPrev}
                  disabled={currentIdx === 0}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #D1D5DB',
                    borderRadius: 10,
                    width: 108,
                    height: 44,
                    color: currentIdx === 0 ? '#CBD5E1' : '#374151',
                    cursor: currentIdx === 0 ? 'not-allowed' : 'pointer',
                    fontWeight: 800,
                    fontSize: 14,
                  }}
                >
                  Previous
                </button>

                {isLast ? (
                  <button
                    type="button"
                    onClick={handleMainsSubmitAll}
                    disabled={submitting}
                    style={{
                      background: '#17223E',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 12,
                      minWidth: 230,
                      height: 48,
                      fontWeight: 800,
                      fontSize: 15,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      boxShadow: '0px 10px 15px -3px rgba(0,0,0,0.10), 0px 4px 6px -4px rgba(0,0,0,0.10)',
                      opacity: submitting ? 0.65 : 1,
                    }}
                  >
                    Submit Answer for Evaluation
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleMainsNext}
                    style={{
                      background: '#17223E',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 12,
                      minWidth: 172,
                      height: 48,
                      fontWeight: 800,
                      fontSize: 15,
                      cursor: 'pointer',
                    }}
                  >
                    Next Question
                  </button>
                )}
              </div>
            </main>

            <aside style={{ background: '#FFFFFF', borderRadius: 16, boxShadow: '0px 1px 3px rgba(0,0,0,0.10), 0px 1px 2px -1px rgba(0,0,0,0.10)', padding: '22px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#6A7282', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 18 }}>
                Writing Timer
              </div>
              <div style={{ width: 122, height: 122, borderRadius: '50%', border: '4px solid #101828', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <span style={{ color: '#101828', fontSize: 24, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{formatTime(timeLeft)}</span>
              </div>
              <div style={{ color: '#6A7282', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 18, textAlign: 'center' }}>
                {mainsTimerActive ? 'Writing in progress' : 'Ready to start'}
              </div>
              <button
                type="button"
                onClick={() => setMainsTimerActive(v => !v)}
                style={{ width: '100%', height: 46, border: 'none', borderRadius: 10, background: mainsTimerActive ? '#DC2626' : '#00BC7D', color: '#FFFFFF', fontWeight: 800, fontSize: 15, cursor: 'pointer', marginBottom: 10 }}
              >
                {mainsTimerActive ? 'Pause' : 'Start Timer'}
              </button>
              <button
                type="button"
                onClick={resetMainsTimer}
                style={{ width: '100%', height: 44, border: '1px solid #D1D5DB', borderRadius: 10, background: '#FFFFFF', color: '#374151', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}
              >
                Reset
              </button>
              <div style={{ width: '100%', height: 1, background: '#E5E7EB', margin: '22px 0 16px' }} />
              <div style={{ width: '100%', display: 'grid', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4A5565', fontSize: 13, fontWeight: 700 }}>
                  <span>Marks</span><span>{marksPerQ}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4A5565', fontSize: 13, fontWeight: 700 }}>
                  <span>Target</span><span>{targetWords} words</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4A5565', fontSize: 13, fontWeight: 700 }}>
                  <span>Question</span><span>{currentIdx + 1}/{totalQuestions}</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }
  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ END MAINS UI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

  return (
    <div style={{ minHeight: '100vh', background: '#FAFBFE', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>

      {/* â”€â”€ Sub-header (matches screenshot strip) â”€â”€ */}
      <div
        style={{
          background: 'linear-gradient(90.38deg, #10182D 0.28%, #17223E 99.72%)',
          padding: '10px 24px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span aria-hidden="true" style={{ fontSize: 14, lineHeight: '16px' }}>ðŸ›ï¸</span>
              <span style={{ fontWeight: 700, fontSize: 14, lineHeight: '20px', color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {title}
              </span>
            </div>
            <div style={{ fontWeight: 500, fontSize: 11, lineHeight: '16px', color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
              Today Prelims Mock Test Â· {totalQuestions} Questions Â· +0.67 per wrong
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span aria-hidden="true" style={{ fontSize: 16, lineHeight: '16px' }}>â³</span>
                <span style={{ fontWeight: 800, fontSize: 18, lineHeight: '22px', color: '#FFFFFF' }}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 10, lineHeight: '12px', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.6)' }}>
                TIME LEFT
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* â”€â”€ Progress row (1116Ã—44) â”€â”€ */}
      <div
        style={{
          background: '#FFFFFF',
          borderBottom: '0.8px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 1116,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingLeft: 32,
            paddingRight: 32,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ flex: 1, marginRight: 16, height: 4, borderRadius: 999, background: '#E5E7EB', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.round(((currentIdx + 1) / Math.max(1, totalQuestions)) * 100)}%`,
                height: '100%',
                background: '#00C950',
              }}
            />
          </div>
          <div style={{ fontWeight: 600, fontSize: 12, lineHeight: '16px', color: '#364153', whiteSpace: 'nowrap' }}>
            Q {currentIdx + 1} / {totalQuestions} - {answered} Answered
          </div>
        </div>
      </div>

      {/* â”€â”€ Submit Error Banner â”€â”€ */}
      {error && (
        <div style={{
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          padding: '12px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '14px' }}>âš ï¸</span>
          <span style={{ fontSize: '14px', color: '#991B1B' }}>{error}</span>
        </div>
      )}

      {/* â”€â”€ Body (centered fixed frame) â”€â”€ */}
      <div
        style={{
          flex: 1,
          background: '#F9FAFB',
          padding: '24px',
          boxSizing: 'border-box',
          display: 'flex',
          justifyContent: 'center',
          overflow: 'visible',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 1116,
            display: 'flex',
            gap: 24,
            boxSizing: 'border-box',
            alignItems: 'flex-start',
          }}
        >
        {/* â”€â”€ Question Panel â”€â”€ */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>

          {/* Question Card */}
          <div
            style={{
        background: '#FAFBFE',
              borderRadius: 16,
              border: '1px solid #E5E7EB',
              padding: 24,
              boxShadow: '0px 1px 2px -1px rgba(0,0,0,0.10), 0px 1px 3px rgba(0,0,0,0.10)',
              overflow: 'visible',
            }}
          >
            {/* Question header row (pill + bookmark) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 8,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 103.20000457763672,
                  height: 32,
                  borderRadius: 10,
                  background: '#101828',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    width: 73,
                    height: 20,
                    fontFamily: 'Inter',
                    fontWeight: 700,
                    fontSize: 14,
                    lineHeight: '20px',
                    color: '#FFFFFF',
                  }}
                >
                  Question {currentIdx + 1}
                </span>
              </div>

              <button
                type="button"
                onClick={handleToggleBookmark}
                aria-label={bookmarkedQuestions.includes(currentIdx) ? 'Remove bookmark' : 'Add bookmark'}
                style={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                {/* Inline icon so no asset needed */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill={bookmarkedQuestions.includes(currentIdx) ? '#F59E0B' : 'none'} aria-hidden="true">
                  <path
                    d="M7 3.5h10A1.5 1.5 0 0 1 18.5 5v16l-6.5-3-6.5 3V5A1.5 1.5 0 0 1 7 3.5Z"
                    stroke={bookmarkedQuestions.includes(currentIdx) ? '#F59E0B' : '#111827'}
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Question Text (fixed frame per layout) */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                boxSizing: 'border-box',
                marginBottom: 28,
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 400,
                  color: '#17223E',
                  lineHeight: '28px',
                  letterSpacing: 0,
                  whiteSpace: 'pre-line',
                }}
              >
                {questionTitle || currentQ.text}
              </div>
              {questionBody ? (
                <div style={{ fontSize: 15, fontWeight: 400, color: '#0F172A', lineHeight: '24px', whiteSpace: 'pre-line' }}>
                  {questionBody}
                </div>
              ) : null}
            </div>

            {/* Options â€” this is a quiz: we show selection only, and reveal
                correctness + explanation only on the results screen. */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                      padding: '16px 20px',
                      borderRadius: '12px',
                      border,
                      background: bg,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      width: '100%',
                    }}
                  >
                    <span style={{
                      width: '32px',
                      height: '32px',
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
                    <span style={{ fontSize: '15px', color: textColor, fontWeight }}>
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
            borderRadius: 12,
            padding: '14px 18px',
            border: '1px solid #E5E7EB',
          }}>
            {/* Left actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
                  fontSize: '14px',
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
                  fontSize: '14px',
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
                  fontSize: '14px',
                  lineHeight: '20px',
                }}
              >
                Skip
              </button>
            </div>

            {/* Right nav */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={handlePrev}
                disabled={currentIdx === 0}
                style={{
                  background: 'none',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  color: currentIdx === 0 ? '#CBD5E1' : '#334155',
                  cursor: currentIdx === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                Prev
              </button>
              <button
                onClick={handleNext}
                disabled={currentIdx === totalQuestions - 1}
                style={{
                  background: currentIdx === totalQuestions - 1 ? '#1E293B' : '#2B7FFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 22px',
                  color: '#FFFFFF',
                  cursor: currentIdx === totalQuestions - 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                Next
              </button>
            </div>
          </div>
        </main>

        {/* â”€â”€ Right panel (Navigator card) â”€â”€ */}
        <aside style={{ width: 360, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0px 1px 2px -1px rgba(0,0,0,0.10), 0px 1px 3px rgba(0,0,0,0.10)' }}>
            <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: '0.6px', color: '#6B7280', textTransform: 'uppercase', marginBottom: 12 }}>
              Question Navigator
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              {questions.map((_, idx) => {
                const isCurrent = idx === currentIdx;
                const isBookmarked = bookmarkedQuestions.includes(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => goToQuestion(idx)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      border: isBookmarked ? '1px solid #F59E0B' : '1px solid #E5E7EB',
                      background: isCurrent ? '#0F172B' : '#F3F4F6',
                      color: isCurrent ? '#FFFFFF' : (isBookmarked ? '#B45309' : '#111827'),
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
              {[
                { label: 'Answered', color: '#00C950', value: answered },
                { label: 'Unanswered', color: '#94A3B8', value: Math.max(0, totalQuestions - answered) },
                { label: 'Bookmarked', color: '#F59E0B', value: bookmarked },
                { label: 'Marked for review', color: '#FB2C36', value: marked },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: row.color }} />
                    <span style={{ fontSize: 12, color: '#374151' }}>{row.label}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{row.value}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 12, marginTop: 6 }}>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>Ready to submit</div>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: '20px', marginBottom: 14 }}>
                {answered} answered - {Math.max(0, totalQuestions - answered)} unanswered - {bookmarked} bookmarked
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  width: '100%',
                  height: 44,
                  background: '#0F172B',
                  border: 'none',
                  borderRadius: 12,
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                Submit Test
              </button>
            </div>
          </div>
        </aside>
        </div>
      </div>
    </div>
  );
}

export default function MockTestAttemptPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        background: '#FAFBFE',
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

