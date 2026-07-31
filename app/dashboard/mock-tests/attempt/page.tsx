'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { mockTestService, bookmarkService, flagService } from '@/lib/services';
import { handleEntitlementError } from '@/components/entitlements';
import { useEntitlements } from '@/contexts/EntitlementsContext';
import { MainsEvaluationLimitModal } from '@/components/upgrade/UpgradeModals';
import { useIsMobile } from '@/hooks/useIsMobile';
import ExamInstructions from '@/components/ExamInstructions';
import StructuredQuestionRenderer from '@/components/StructuredQuestionRenderer';
import FilePreviewThumb from '@/components/FilePreviewThumb';
import FilePreviewModal from '@/components/FilePreviewModal';
import WritingTimer from '@/components/WritingTimer';
import { mainsWordLimit, mainsTimeLimit, mainsWordRange, stripMarksSuffix } from '@/lib/mainsPattern';

interface Question {
  id: number;
  subject: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  text: string;
  options: { label: string; text: string }[];
  correct: string;
  explanation: string;
  marks?: number | null;
}

interface MainsAnswer {
  text: string;
  file: File | null;
  files: File[];
}

type QuestionStatus = 'unattempted' | 'answered' | 'marked' | 'current';

function normalizeQuestionText(text: string): string {
  return text
    .replace(/[–-]/g, '-')
    .replace(/\s+(\d+\.)\s+/g, '\n$1 ')
    .replace(/\s+-\s+/g, ' ');
}

function normalizeDurationToSeconds(rawDuration: unknown, questionCount: number, isMains: boolean): number {
  const fallbackMinutes = isMains
    ? Math.max(8, questionCount * 8)
    : Math.max(1, Math.round(questionCount * 1.2));
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
      { label: 'A', text: "Earth's rotation alone" },
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
    explanation: "The RBI's Monetary Policy Committee sets the policy repo rate under the inflation targeting framework.",
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

function MockTestAttemptInner() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const entitlements = useEntitlements();
  const searchParams = useSearchParams();
  const testId = searchParams.get('testId');
  const examMode = searchParams.get('examMode') || 'prelims';
  const isMains = examMode === 'mains';
  const title = searchParams.get('title') || (isMains ? 'Mains Practice' : 'Prelims Practice');
  const paperParam = searchParams.get('paper') || '';
  const subjectParam = searchParams.get('subject') || '';
  const difficultyParam = searchParams.get('difficulty') || 'Medium';

  /* ─── Pre-test instructions gate ─── */
  const startedKey = testId ? `mockTestStarted:${testId}` : null;
  const [started, setStarted] = useState(false);

  /* ─── API / Loading State ─── */
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [totalMarks, setTotalMarks] = useState(0);

  /* ─── Quiz State ─── */
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, string>>({});
  const [questionStatuses, setQuestionStatuses] = useState<Record<number, QuestionStatus>>({});
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Record<string, boolean>>({});
  const [skipped, setSkipped] = useState<Record<number, boolean>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [examTotalSeconds, setExamTotalSeconds] = useState(0); // full exam duration (for the single timer ring)
  const [examRunning, setExamRunning] = useState(true);        // single exam-wide timer running/paused
  const [startTime] = useState(Date.now());

  /* ─── Mains State ─── */
  const [mainsSubmitting, setMainsSubmitting] = useState(false);
  const [mainsConfirmOpen, setMainsConfirmOpen] = useState(false);
  const [showMainsQuotaModal, setShowMainsQuotaModal] = useState(false);
  const [mainsAnswers, setMainsAnswers] = useState<Record<number, MainsAnswer>>({});
  // Questions the user has explicitly marked as "didn't attempt" - these are
  // allowed through submission without an answer upload and are not evaluated.
  const [unattemptedQuestions, setUnattemptedQuestions] = useState<Record<number, boolean>>({});
  // Index of the question whose missing-answer popup is open (null = closed).
  const [missingAnswerIdx, setMissingAnswerIdx] = useState<number | null>(null);
  const [openEditors, setOpenEditors] = useState<Record<number, boolean>>({}); // which answer editors are expanded
  const [previewFile, setPreviewFile] = useState<File | null>(null); // in-page uploaded-answer preview (no new tab / no navigation)
  const answerModeKey = testId ? `mockTestAnswerMode:${testId}` : null;
  const [answerMode, setAnswerMode] = useState<'type' | 'handwrite' | null>(null);
  const [doneWriting, setDoneWriting] = useState(false); // handwrite mode: user finished writing → show upload step
  const [tickedQuestions, setTickedQuestions] = useState<Record<number, boolean>>({});
  const [openTip, setOpenTip] = useState<string | null>(null); // mains: which "quick tips" accordion is open

  /* ─── Hydrate started/answerMode from sessionStorage once testId is available ─── */
  useEffect(() => {
    if (!testId) return;
    if (sessionStorage.getItem(`mockTestStarted:${testId}`) === 'true') {
      setStarted(true);
    }
    const storedMode = sessionStorage.getItem(`mockTestAnswerMode:${testId}`);
    if (storedMode === 'type' || storedMode === 'handwrite') {
      setAnswerMode(storedMode);
    }
  }, [testId]);

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
      setExamTotalSeconds(15 * 60);
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
        bookmarkService.list('mcq').then((bmRes: any) => {
          if (cancelled) return;
          const ids = new Set((bmRes.data?.bookmarks || []).map((b: any) => b.entityId));
          const map: Record<string, boolean> = {};
          qs.forEach(q => { if (ids.has(String(q.id))) map[String(q.id)] = true; });
          setBookmarkedQuestions(prev => ({ ...map, ...prev }));
        }).catch(() => {});
        flagService.check('mcq', qs.map(q => String(q.id))).then((fRes: any) => {
          if (cancelled) return;
          setFlagged(fRes.data?.flagged || {});
        }).catch(() => {});
        // Initialize statuses
        const statuses: Record<number, QuestionStatus> = {};
        qs.forEach((_, i) => {
          statuses[i] = i === 0 ? 'current' : 'unattempted';
        });
        setQuestionStatuses(statuses);
        // Both modes derive total time deterministically from the question count
        // so the timer always matches the setup summary and instructions - never a
        // stale/random API duration.
        //   Mains:   7 min per 10-mark question (numberOfQuestions × 7).
        //   Prelims: 100 questions = 120 minutes, scaled proportionally (× 1.2).
        const durationSeconds = isMains
          ? qs.length * 7 * 60
          : Math.round(qs.length * 1.2) * 60;
        setTimeLeft(durationSeconds);
        setExamTotalSeconds(durationSeconds);
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
    if (!started) return;    // hold the clock until the user begins from instructions
    if (isMains && !answerMode) return; // hold the clock until the user picks type vs handwrite
    if (!examRunning) return; // single exam-wide timer can be paused
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, questions.length, started, examRunning, isMains, answerMode]);

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
    // Selecting an answer clears any prior "skipped" flag on this question.
    setSkipped(prev => {
      if (!prev[currentIdx]) return prev;
      const next = { ...prev };
      delete next[currentIdx];
      return next;
    });
  };

  // Flag = "Mark for Review" (mirrors Daily MCQ Challenge).
  const handleToggleFlag = async (q: Question) => {
    const id = String(q.id);
    const wasFlagged = !!flagged[id];
    setFlagged(prev => ({ ...prev, [id]: !wasFlagged }));
    try {
      await flagService.toggle({ questionType: 'mcq', questionId: id, questionText: q.text });
    } catch {
      setFlagged(prev => ({ ...prev, [id]: wasFlagged }));
    }
  };

  // Skip = advance, marking the current question skipped if still unanswered.
  const handleSkip = () => {
    if (!selectedOptions[currentIdx]) {
      setSkipped(prev => ({ ...prev, [currentIdx]: true }));
    }
    if (currentIdx < totalQuestions - 1) goToQuestion(currentIdx + 1);
  };

  const handleToggleBookmark = async (q: Question) => {
    const id = String(q.id);
    const wasBookmarked = !!bookmarkedQuestions[id];
    setBookmarkedQuestions(prev => ({ ...prev, [id]: !wasBookmarked }));
    try {
      await bookmarkService.toggle({
        entityType: 'mcq',
        entityId: id,
        title: q.text.slice(0, 140),
        source: 'Mock Test',
        tag: q.subject,
        content: {
          questionText: q.text,
          options: q.options,
          correctOption: q.correct,
          explanation: q.explanation,
          difficulty: q.difficulty,
          category: q.subject,
          status: 'new',
        },
      });
    } catch {
      setBookmarkedQuestions(prev => ({ ...prev, [id]: wasBookmarked }));
    }
  };

  const handleNext = () => {
    if (currentIdx < totalQuestions - 1) goToQuestion(currentIdx + 1);
  };

  const handlePrev = () => {
    if (currentIdx > 0) goToQuestion(currentIdx - 1);
  };

  /* ─── Mains handlers ─── */
  // Clicking "Submit … for Evaluation" validates answers, then opens the
  // confirmation popup. The real submission only runs after "Yes, submit".
  // First question that has no answer and hasn't been explicitly marked as
  // "didn't attempt". `override` lets callers factor in a just-made decision
  // before React state has flushed. Returns -1 when nothing is missing.
  const firstMissingAnswer = (override?: Record<number, boolean>) => {
    const skip = override || unattemptedQuestions;
    return questions.findIndex((_, i) => {
      if (skip[i]) return false;
      const a = mainsAnswers[i];
      if (answerMode === 'handwrite') return !a || !a.files.length;
      return !a || !a.text.trim();
    });
  };

  const requestMainsSubmit = () => {
    if (!testId) {
      setError('Cannot submit without a test session. Please regenerate the test.');
      return;
    }
    const missing = firstMissingAnswer();
    if (missing !== -1) {
      // Prompt the user: upload the answer, or mark the question unattempted.
      setError(null);
      setMissingAnswerIdx(missing);
      return;
    }
    setError(null);
    setMainsConfirmOpen(true);
  };

  // Popup action: jump to the flagged question's answer section so the user can upload.
  const handleUploadMissingAnswer = () => {
    const idx = missingAnswerIdx;
    setMissingAnswerIdx(null);
    if (idx === null) return;
    setCurrentIdx(idx);
    if (typeof window !== 'undefined') {
      // Wait a frame so the popup is gone and the target is laid out.
      requestAnimationFrame(() => {
        document.getElementById(`mains-q-${idx}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  };

  // Popup action: mark the question unattempted, then move on to the next
  // missing question (if any) or straight to the submit confirmation.
  const handleMarkUnattempted = () => {
    const idx = missingAnswerIdx;
    if (idx === null) return;
    const nextUnattempted = { ...unattemptedQuestions, [idx]: true };
    setUnattemptedQuestions(nextUnattempted);
    const nextMissing = firstMissingAnswer(nextUnattempted);
    if (nextMissing !== -1) {
      setMissingAnswerIdx(nextMissing);
    } else {
      setMissingAnswerIdx(null);
      setError(null);
      setMainsConfirmOpen(true);
    }
  };

  const handleMainsSubmitAll = async () => {
    if (!testId) {
      setError('Cannot submit without a test session. Please regenerate the test.');
      return;
    }

    const missing = firstMissingAnswer();
    if (missing !== -1) {
      // A question is still missing an answer and hasn't been marked
      // unattempted - re-open the prompt instead of blocking silently.
      setMainsConfirmOpen(false);
      setMissingAnswerIdx(missing);
      return;
    }

    setError(null);
    setMainsConfirmOpen(false);
    setMainsSubmitting(true);

    try {
      const storageKey = `mockTestMainsAttempts:${testId}`;
      let byQuestion: Record<string, string> = {};
      if (typeof window !== 'undefined') {
        try {
          const existing = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
          byQuestion = existing?.byQuestion && typeof existing.byQuestion === 'object'
            ? { ...existing.byQuestion }
            : {};
        } catch {
          byQuestion = {};
        }
      }

      const pendingQuestions = questions
        .map((q, i) => ({ q, i }))
        .filter(({ q, i }) => !byQuestion[String(q.id)] && !unattemptedQuestions[i]);

      if (pendingQuestions.length === 0) {
        router.push(
          `/dashboard/mock-tests/attempt/evaluating?testId=${testId}&title=${encodeURIComponent(title)}`
        );
        return;
      }

      const quota = entitlements.featureStatus('mains_evaluation');
      if (quota?.allowed === false) {
        setShowMainsQuotaModal(true);
        setMainsSubmitting(false);
        return;
      }
      if (quota && quota.remaining !== null && quota.remaining < pendingQuestions.length) {
        setError(
          `This mock test needs ${pendingQuestions.length} Mains evaluation credit${pendingQuestions.length === 1 ? '' : 's'}, but you have ${quota.remaining} remaining.`
        );
        setMainsSubmitting(false);
        return;
      }

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (byQuestion[String(q.id)]) continue;
        // Intentionally unattempted questions are not sent for evaluation.
        if (unattemptedQuestions[i]) continue;
        const a = mainsAnswers[i];
        const resp = await mockTestService.submitMainsAnswer(testId, String(q.id), {
          answerText: a?.text?.trim() || undefined,
          file: a?.files?.[0] || a?.file || undefined,
          files: a?.files?.length ? a.files : undefined,
        });
        const id = resp.data?.attemptId;
        if (id) {
          byQuestion[String(q.id)] = id;
          if (typeof window !== 'undefined') {
            const attemptIds = questions.map((question) => byQuestion[String(question.id)]).filter(Boolean);
            sessionStorage.setItem(
              storageKey,
              JSON.stringify({ attemptIds, byQuestion, title })
            );
          }
        }
      }

      if (typeof window !== 'undefined') {
        const attemptIds = questions.map((q) => byQuestion[String(q.id)]).filter(Boolean);
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({ attemptIds, byQuestion, title })
        );
      }
      await entitlements.refreshEntitlements();
      router.push(
        `/dashboard/mock-tests/attempt/evaluating?testId=${testId}&title=${encodeURIComponent(title)}`
      );
    } catch (err: any) {
      console.error('Mains submit failed:', err);
      entitlements.refreshEntitlements().catch(() => {});
      const parsed = handleEntitlementError(err);
      if (parsed.title === 'Limit reached' || parsed.title === 'Upgrade required') {
        setShowMainsQuotaModal(true);
      } else {
        setError(parsed.message || err.message || 'Failed to submit answers. Please try again.');
      }
      setMainsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    // Sample mode (no testId): store local results and open results screen
    if (!testId) {
      const total = questions.length;
      const correctCount = correct;
      const wrongCount = wrong;
      const skippedTotal = Math.max(0, total - Object.keys(selectedOptions).length);
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
            skipped: skippedTotal,
            accuracyPct,
            scoreText: `${correctCount}/${total}`,
            review,
            selectedOptions,
            questions,
          })
        );
      }

      setSubmitting(true);
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
      await mockTestService.submit(testId, answersMap, timeTaken);
      entitlements.refreshEntitlements().catch(() => {});
      router.push(`/dashboard/mock-tests/attempt/results?testId=${testId}`);
    } catch (err: any) {
      console.error('Failed to submit test:', err);
      const parsed = handleEntitlementError(err);
      setError(parsed.message || 'Failed to submit test. Please try again.');
      setSubmitting(false);
    }
  };

  // Stats - Daily MCQ Challenge semantics: a flagged question counts as
  // "Mark for Review"; answered/skipped/not-visited are mutually exclusive.
  const answeredCount = questions.filter((q, i) => selectedOptions[i] && !flagged[String(q.id)]).length;
  const skippedCount = questions.filter((q, i) => skipped[i] && !selectedOptions[i] && !flagged[String(q.id)]).length;
  const markedCount = questions.filter((q) => flagged[String(q.id)]).length;
  const bookmarkedCount = questions.filter((q) => bookmarkedQuestions[String(q.id)]).length;
  const notVisitedCount = Math.max(0, questions.length - answeredCount - skippedCount - markedCount);
  // Correct / wrong drive the sample-mode results payload (net score w/ negative marking).
  const correct = Object.entries(selectedOptions).filter(([idx, opt]) => questions[Number(idx)]?.correct === opt).length;
  const wrong = Object.keys(selectedOptions).length - correct;

  const currentQ = questions[currentIdx];

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

  /* ─── Pre-test instructions gate (shown once, before the test UI) ─── */
  if (!started) {
    const paperLabel = [paperParam, subjectParam].filter(Boolean).join(' · ')
      || (currentQ as any).paper
      || (isMains ? 'GS Paper I' : 'GS Paper I');
    // Show the same exam-wide timer everywhere: setup summary, instructions and
    // the countdown ring all read one value (mains = numberOfQuestions × 7 min).
    const totalTimeMinutes = examTotalSeconds > 0
      ? Math.round(examTotalSeconds / 60)
      : (isMains ? Math.max(7, totalQuestions * 7) : Math.max(1, Math.round(timeLeft / 60)));
    return (
      <ExamInstructions
        isMains={isMains}
        questionCount={totalQuestions}
        totalTimeMinutes={totalTimeMinutes}
        paperLabel={paperLabel}
        difficultyLabel={difficultyParam}
        onBack={() => router.push('/dashboard/mock-tests')}
        onStart={() => {
          setStarted(true);
          if (startedKey) sessionStorage.setItem(startedKey, 'true');
        }}
      />
    );
  }

  /* ─────────────── MAINS: choose how to answer (type vs handwrite) ─────────────── */
  if (isMains && !answerMode) {
    const chooseMode = (mode: 'type' | 'handwrite') => {
      setAnswerMode(mode);
      if (answerModeKey) sessionStorage.setItem(answerModeKey, mode);
    };

    return (
      <div className="ams-page" aria-label="Choose answer mode">
        <section className="ams-shell">
          <div className="ams-cards">
            {/* ── Type Your Answers (blue) ── */}
            <article className="ams-card ams-type" aria-labelledby="ams-type-title">
              <div className="ams-top">
                <div className="ams-icon" aria-hidden="true">
                  <svg className="ams-keyboard-svg" viewBox="0 0 48 48" fill="none">
                    <rect x="8" y="12" width="32" height="24" rx="4" stroke="#2367ff" strokeWidth="3" />
                    <path d="M14 20h3M21 20h3M28 20h3M35 20h1M14 27h3M21 27h3M28 27h3M35 27h1M17 32h14" stroke="#2367ff" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="ams-pill"><svg viewBox="0 0 24 24" fill="none"><path d="M13.4 2 5 13h6l-1 9 9-12h-6l.4-8Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" /></svg>Fastest</div>
              </div>

              <div className="ams-hero">
                <h2 className="ams-title" id="ams-type-title">Type Your Answers</h2>
                <p className="ams-intro">Ideal for brainstorming, quick practice and learning on the go.</p>

                <div className="ams-art ams-type-art" aria-hidden="true">
                  <svg className="ams-spark" viewBox="0 0 340 240">
                    <g className="ams-burst" stroke="#8fb0ff" strokeWidth="4" strokeLinecap="round">
                      <path d="M36 98h-18"/><path d="M51 76 39 62"/><path d="M50 120 36 132"/>
                    </g>
                    <g className="ams-burst" stroke="#8fb0ff" strokeWidth="4" strokeLinecap="round">
                      <path d="M266 16 269 2"/><path d="M286 32 300 22"/>
                    </g>
                  </svg>
                  <div className="ams-laptop">
                    <div className="ams-screen">
                      <div className="ams-toolbar"><span>B</span><em>I</em><u>U</u><span>•</span><span className="ams-bars"><i></i><i></i><i></i></span><span className="ams-bars"><i></i><i></i><i></i></span></div>
                      <div className="ams-typing"><span className="ams-cursor"></span><span className="ams-linestack"><i></i><i></i><i></i></span></div>
                    </div>
                    <div className="ams-base"></div>
                    <div className="ams-wordcount">Words: <b>156</b><span className="ams-dot"></span></div>
                  </div>
                </div>
              </div>

              <div className="ams-divider"></div>

              <ul className="ams-features">
                <li className="ams-feature">
                  <span className="ams-feat-icon"><svg viewBox="0 0 36 36" fill="none"><rect x="7" y="7" width="22" height="22" rx="3" stroke="currentColor" strokeWidth="2.8"/><path d="M12 14h12M12 19h7M13 25l3-4 4 4" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                  <span><strong>One clean text box per question</strong><span>Distraction-free writing space</span></span>
                </li>
                <li className="ams-feature">
                  <span className="ams-feat-icon"><svg viewBox="0 0 36 36" fill="none"><path d="M29 7 6 18l9 4 4 8L29 7Z" stroke="currentColor" strokeWidth="2.8" strokeLinejoin="round"/><path d="m15 22 5-5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"/></svg></span>
                  <span><strong>Submit the moment you finish</strong><span>Instant submission, no extra steps</span></span>
                </li>
                <li className="ams-feature">
                  <span className="ams-feat-icon"><svg viewBox="0 0 36 36" fill="none" aria-hidden="true"><rect x="8" y="5" width="20" height="26" rx="4" stroke="currentColor" strokeWidth="2.6"/><path d="M13 12h10M13 17h7M13 22h6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/><circle cx="26" cy="26" r="6" fill="#fff" stroke="currentColor" strokeWidth="2.2"/><path d="M23.8 26h4.4M26 23.8v4.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></span>
                  <span><strong>Live word count as you write</strong><span>Track your progress in real-time</span></span>
                </li>
              </ul>

              <button type="button" className="ams-choose" onClick={() => chooseMode('type')}>Choose this <span className="ams-arrow">→</span></button>
            </article>

            {/* ── Write on Paper (gold) ── */}
            <article className="ams-card ams-hand" aria-labelledby="ams-hand-title">
              <div className="ams-top">
                <div className="ams-icon" aria-hidden="true">
                  <svg viewBox="0 0 48 48" fill="none">
                    <path d="m14 31-2 6 6-2 18-18-4-4-18 18Z" stroke="#cc5b05" strokeWidth="3" strokeLinejoin="round" />
                    <path d="m28 17 4 4M12 38h22" stroke="#cc5b05" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="ams-pill"><svg viewBox="0 0 24 24" fill="none"><path d="m12 3 2.7 5.47 6.03.88-4.36 4.25 1.03 6-5.4-2.84L6.6 19.6l1.03-6-4.36-4.25 6.03-.88L12 3Z" stroke="currentColor" strokeWidth="2.1" strokeLinejoin="round" /></svg>Real exam feel</div>
              </div>

              <div className="ams-hero">
                <h2 className="ams-title" id="ams-hand-title">Write on Paper</h2>
                <p className="ams-intro">Write on paper now, then scan and upload after the test ends.</p>

                <div className="ams-art ams-hand-art" aria-hidden="true">
                  <svg className="ams-spark" viewBox="0 0 360 260">
                    <g className="ams-burst" stroke="#ffd15b" strokeWidth="4" strokeLinecap="round">
                      <path d="M86 19 76 0"/><path d="M111 24 118 7"/><path d="M63 38 47 29"/>
                    </g>
                    <g className="ams-burst" stroke="#ffd15b" strokeWidth="4" strokeLinecap="round">
                      <path d="M315 28 329 12"/><path d="M335 58 352 52"/>
                    </g>
                  </svg>
                  <div className="ams-notebook">
                    <div className="ams-notelines">
                      <span className="ams-noteline"><b>1.</b><i></i></span>
                      <span className="ams-noteline"><b>2.</b><i></i></span>
                      <span className="ams-noteline"><b>3.</b><i></i></span>
                    </div>
                    <svg className="ams-writing" viewBox="0 0 90 24" aria-hidden="true">
                      <path d="M4 17c8-8 12 6 20-2s12 5 21-3 11 4 20-3 13 2 20-5" />
                    </svg>
                    <div className="ams-pen"></div>
                  </div>
                </div>
              </div>

              <div className="ams-divider"></div>

              <ul className="ams-features">
                <li className="ams-feature">
                  <span className="ams-feat-icon"><svg viewBox="0 0 36 36" fill="none"><path d="M7 12h21v15H7V12Z" stroke="currentColor" strokeWidth="2.6"/><path d="M12 18h2M18 18h2M24 18h2M12 23h8" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"/><path d="M6 7 30 30" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"/></svg></span>
                  <span><strong>No typing, just your booklet &amp; pen</strong><span>Answer just like the real exam</span></span>
                </li>
                <li className="ams-feature">
                  <span className="ams-feat-icon"><svg viewBox="0 0 36 36" fill="none"><path d="M23.8 25.5h2.4a5.3 5.3 0 0 0 .8-10.5A9 9 0 0 0 9.5 17.8 4.4 4.4 0 0 0 10 26h2.2" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round"/><path d="M18 28V16m0 0-4.5 4.5M18 16l4.5 4.5" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                  <span><strong>Upload your scans when time&apos;s up</strong><span>Scan and upload after the test</span></span>
                </li>
                <li className="ams-feature">
                  <span className="ams-feat-icon"><svg viewBox="0 0 36 36" fill="none"><circle cx="18" cy="16" r="9" stroke="currentColor" strokeWidth="2.7"/><path d="m14 24-2 7 6-3 6 3-2-7" stroke="currentColor" strokeWidth="2.7" strokeLinejoin="round"/><path d="m18 10 1.6 3.2 3.5.5-2.5 2.5.6 3.5-3.2-1.7-3.2 1.7.6-3.5-2.5-2.5 3.5-.5L18 10Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg></span>
                  <span><strong>Closest to the real UPSC Mains</strong><span>Practice the real exam experience</span></span>
                </li>
              </ul>

              <button type="button" className="ams-choose" onClick={() => chooseMode('handwrite')}>Choose this <span className="ams-arrow">→</span></button>
            </article>
          </div>

          <button type="button" className="ams-back" onClick={() => router.push('/dashboard/mock-tests')} aria-label="Back to tests">← Back to tests</button>
        </section>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

          .ams-page {
            --ams-ink:#0a1328; --ams-muted:#4f5d7b; --ams-navy:#071127; --ams-yellow:#ffe037;
            --ams-blue:#2367ff; --ams-orange:#cc5b05; --ams-card:rgba(255,255,255,0.92);
            --ams-shadow:0 28px 70px rgba(31,43,77,0.12), 0 4px 16px rgba(31,43,77,0.07);
            position:relative; min-height:100vh; display:grid; place-items:center;
            padding: clamp(18px,3.2vw,36px) clamp(16px,2.5vw,30px) 24px;
            font-family:'Plus Jakarta Sans', var(--font-inter), Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;
            color:var(--ams-ink); overflow-x:hidden;
            background:
              radial-gradient(circle at 14% 14%, rgba(35,103,255,0.08), transparent 28%),
              radial-gradient(circle at 86% 18%, rgba(255,210,69,0.14), transparent 31%),
              linear-gradient(180deg,#fbfcff 0%,#f4f7fb 100%);
            animation: ams-fadeIn 260ms ease both;
          }
          .ams-page * { box-sizing:border-box; }
          .ams-page::before {
            content:''; position:absolute; inset:0; pointer-events:none; opacity:0.35;
            background-image:
              linear-gradient(rgba(10,19,40,0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(10,19,40,0.025) 1px, transparent 1px);
            background-size:44px 44px;
            -webkit-mask-image: radial-gradient(circle at center, black, transparent 78%);
            mask-image: radial-gradient(circle at center, black, transparent 78%);
          }
          .ams-shell { position:relative; z-index:1; width:min(1120px,100%); animation: ams-riseIn 700ms cubic-bezier(.2,.75,.2,1) both; }
          .ams-cards { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:clamp(18px,2.4vw,26px); align-items:stretch; }

          .ams-card {
            position:relative; overflow:hidden; isolation:isolate; display:flex; flex-direction:column;
            min-height:560px; border:1px solid rgba(216,225,240,0.86); border-radius:22px;
            background:var(--ams-card); box-shadow:var(--ams-shadow); backdrop-filter:blur(16px);
            padding:clamp(22px,2.1vw,26px);
            transition: transform 240ms cubic-bezier(.2,.75,.2,1), box-shadow 240ms ease, border-color 240ms ease;
          }
          .ams-card::before { content:''; position:absolute; inset:-1px; z-index:-2; background:linear-gradient(140deg, rgba(255,255,255,0.95), rgba(255,255,255,0.72)); }
          .ams-card::after {
            content:''; position:absolute; width:410px; height:410px; right:-120px; top:48px; z-index:-1;
            border-radius:50%; background:radial-gradient(circle, rgba(45,112,255,0.13), rgba(45,112,255,0.02) 62%, transparent 72%);
            filter:blur(2px); transition:transform 240ms ease;
          }
          .ams-card.ams-hand::after { width:450px; height:450px; right:-125px; top:54px; background:radial-gradient(circle, rgba(255,215,105,0.36), rgba(255,226,145,0.12) 58%, transparent 74%); }
          .ams-card.ams-hand { order:1; }
          .ams-card.ams-type { order:2; }

          /* Card hover - proper hover on BOTH cards */
          .ams-card:hover { transform:translateY(-8px); }
          .ams-card.ams-type:hover { border-color:rgba(35,103,255,0.55); box-shadow:0 44px 90px rgba(35,103,255,0.16), 0 10px 26px rgba(31,43,77,0.10); }
          .ams-card.ams-hand:hover { border-color:rgba(255,176,32,0.62); box-shadow:0 44px 90px rgba(204,91,5,0.15), 0 10px 26px rgba(31,43,77,0.10); }
          .ams-card:hover::after { transform:scale(1.06); }

          .ams-top { display:flex; align-items:center; justify-content:space-between; min-height:60px; margin-bottom:18px; }
          .ams-icon { width:62px; height:62px; border-radius:16px; display:grid; place-items:center; overflow:hidden; box-shadow: inset 0 1px 0 rgba(255,255,255,0.75); }
          .ams-type .ams-icon { background:linear-gradient(145deg,#e4ebff,#dce6ff); }
          .ams-hand .ams-icon { background:linear-gradient(145deg,#fff2c7,#ffe8a3); }
          .ams-icon svg { display:block; width:38px; height:38px; max-width:64%; max-height:64%; }

          .ams-pill { display:inline-flex; align-items:center; gap:10px; min-height:32px; padding:0 15px; border-radius:999px; font-size:13px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; white-space:nowrap; }
          .ams-pill svg { width:18px; height:18px; }
          .ams-type .ams-pill { color:var(--ams-blue); background:#edf3ff; }
          .ams-hand .ams-pill { color:var(--ams-orange); background:#fff3d8; }

          .ams-hero { position:relative; min-height:154px; margin-bottom:18px; }
          .ams-type .ams-hero { margin-bottom:44px; }
          .ams-title { max-width:290px; margin:0 0 12px; font-size:clamp(26px,2.3vw,32px); line-height:1.08; letter-spacing:-0.045em; font-weight:800; color:var(--ams-ink); }
          .ams-intro { max-width:290px; margin:0; color:var(--ams-muted); font-size:clamp(15px,1.25vw,18px); line-height:1.58; font-weight:500; }
          .ams-hand .ams-title, .ams-hand .ams-intro { max-width:245px; }

          .ams-art { position:absolute; right:0; bottom:-8px; width:min(40%,260px); height:184px; transform:scale(0.92); transform-origin:right bottom; overflow:hidden; }
          .ams-type-art { overflow:visible; }

          .ams-divider { height:1px; background:linear-gradient(90deg, rgba(220,227,239,0.2), rgba(220,227,239,1), rgba(220,227,239,0.2)); margin:0 0 18px; }

          .ams-features { display:grid; gap:14px; margin:0; padding:0; list-style:none; }
          .ams-feature { display:grid; grid-template-columns:44px 1fr; gap:12px; align-items:center; }
          .ams-feat-icon { width:44px; height:44px; display:grid; place-items:center; border-radius:50%; flex:0 0 auto; overflow:hidden; }
          .ams-type .ams-feat-icon { color:var(--ams-blue); background:linear-gradient(145deg,#e6eeff,#dbe7ff); }
          .ams-hand .ams-feat-icon { color:var(--ams-orange); background:linear-gradient(145deg,#fff0c0,#ffe3a5); }
          .ams-feat-icon svg { display:block; width:26px; height:26px; max-width:58%; max-height:58%; }
          .ams-feature strong { display:block; margin-bottom:4px; color:#111a31; font-size:15px; line-height:1.2; font-weight:800; letter-spacing:-0.02em; }
          .ams-feature > span:not(.ams-feat-icon) { display:block; min-width:0; }
          .ams-feature > span:not(.ams-feat-icon) > span { display:block; color:#4d5d7b; font-size:13.8px; line-height:1.35; font-weight:500; }

          .ams-choose {
            width:100%; height:52px; margin-top:auto; border:0; border-radius:14px; color:var(--ams-yellow);
            background: linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0)), var(--ams-navy);
            box-shadow:0 16px 30px rgba(7,17,39,0.18), inset 0 1px 0 rgba(255,255,255,0.08);
            font: inherit; font-size:16px; font-weight:800; cursor:pointer;
            transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
            display:inline-flex; align-items:center; justify-content:center; gap:8px; line-height:1; text-align:center;
          }
          .ams-choose:hover { transform:translateY(-2px); box-shadow:0 22px 38px rgba(7,17,39,0.22), inset 0 1px 0 rgba(255,255,255,0.1); background:#091734; }
          .ams-choose:active { transform:translateY(0); }
          .ams-arrow { margin-left:0; font-size:25px; line-height:1; }

          .ams-back { display:flex; align-items:center; justify-content:center; gap:6px; margin:26px auto 0; background:none; border:0; color:#8390a9; font:inherit; font-size:17px; font-weight:700; cursor:pointer; }
          .ams-back:hover { color:#61708c; }

          .ams-type-art .ams-burst, .ams-hand-art .ams-burst { opacity:0; animation: ams-blinkBurst 2.2s ease-in-out infinite; }
          .ams-type-art .ams-burst:nth-child(2) { animation-delay:220ms; }
          .ams-hand-art .ams-burst:nth-child(2) { animation-delay:320ms; }

          .ams-laptop { position:absolute; inset:18px 40px 0 -26px; transform:rotate(-4deg) scale(0.88); transform-origin:right bottom; }
          .ams-screen { position:absolute; left:48px; top:8px; width:214px; height:146px; border:10px solid #172c68; border-bottom-width:14px; border-radius:10px 10px 8px 8px; background:#fdfefe; box-shadow: inset 0 0 0 1px #e8edfb; }
          .ams-toolbar { height:38px; display:flex; align-items:center; gap:15px; padding:0 18px; color:#5270b9; font-weight:800; font-size:15px; border-bottom:1px solid #edf1fb; }
          .ams-toolbar .ams-bars { display:grid; gap:4px; }
          .ams-toolbar .ams-bars i { display:block; width:16px; height:2px; background:#5f77bd; border-radius:4px; }
          .ams-typing { padding:18px 24px 0; display:flex; align-items:flex-start; gap:10px; }
          .ams-cursor { width:3px; height:14px; flex:0 0 auto; margin-top:2px; border-radius:99px; background:#6a89d8; animation: ams-cursorBlink 1.1s step-end infinite; }
          .ams-linestack { display:grid; gap:10px; width:138px; }
          .ams-linestack i { display:block; height:6px; width:0; border-radius:99px; background:linear-gradient(90deg,#6a89d8,#aac0ee); animation: ams-typeLine 4s ease-in-out infinite; }
          .ams-linestack i:nth-child(1) { --ams-target:100%; animation-delay:0.1s; }
          .ams-linestack i:nth-child(2) { --ams-target:86%; animation-delay:1.2s; }
          .ams-linestack i:nth-child(3) { --ams-target:60%; animation-delay:2.3s; }
          .ams-base { display:none; }
          .ams-wordcount { position:absolute; right:-6px; bottom:-30px; display:flex; align-items:center; gap:10px; min-width:126px; height:42px; padding:0 14px; border:4px solid #e3eaff; border-radius:10px; background:white; box-shadow:0 13px 24px rgba(31,49,105,0.14); color:#3e5a9c; font-size:14px; font-weight:800; white-space:nowrap; z-index:5; }
          .ams-wordcount b { color:#314f9e; }
          .ams-dot { width:9px; height:9px; border-radius:50%; background:#43d86b; box-shadow:0 0 0 5px rgba(67,216,107,0.13); }

          .ams-hand-art { width:min(42%,295px); height:228px; right:2px; bottom:-12px; }
          .ams-notebook { position:absolute; left:6px; top:18px; width:194px; height:188px; border:2px solid #b7834e; border-radius:8px; background:#fffdfa; transform:rotate(-8deg); box-shadow:16px 18px 0 rgba(198,132,43,0.13); overflow:visible; }
          .ams-notebook::before { content:''; position:absolute; left:18px; top:-5px; bottom:-5px; width:11px; border-radius:12px; background:repeating-linear-gradient(180deg,#2f3340 0 8px, transparent 8px 18px); box-shadow:-13px 0 0 rgba(41,48,62,0.18); }
          .ams-notelines { position:absolute; left:54px; right:20px; top:34px; display:grid; gap:19px; color:#263043; font-size:16px; font-weight:800; }
          .ams-noteline { display:grid; grid-template-columns:20px 1fr; gap:9px; align-items:center; }
          .ams-noteline i { display:block; height:3px; border-radius:99px; background:#d9d4ca; transform-origin:left center; animation: ams-lineWrite 3.1s ease-in-out infinite; }
          .ams-noteline:nth-child(2) i { width:90%; animation-delay:340ms; }
          .ams-noteline:nth-child(3) i { width:74%; animation-delay:680ms; }
          .ams-writing { position:absolute; left:74px; top:116px; width:88px; height:18px; fill:none; stroke:#2f3340; stroke-width:3; stroke-linecap:round; stroke-linejoin:round; stroke-dasharray:140; stroke-dashoffset:140; filter:drop-shadow(0 1px 0 rgba(255,255,255,0.6)); animation: ams-handwriting 3.1s ease-in-out infinite; }
          .ams-pen { position:absolute; left:132px; top:-2px; z-index:4; width:20px; height:112px; border-radius:14px; background:linear-gradient(90deg,#141820 0 36%,#2b2f38 36% 64%,#070a10 64% 100%); transform:translate(-58px,6px) rotate(24deg); transform-origin:50% 118%; box-shadow:10px 10px 13px rgba(77,50,16,0.15); animation: ams-penWrite 3.1s ease-in-out infinite; }
          .ams-pen::before { content:''; position:absolute; top:28px; left:-2px; right:-2px; height:13px; border-radius:10px; background:linear-gradient(90deg,#ffb621,#ffdf78,#ce7809); }
          .ams-pen::after { content:''; position:absolute; bottom:-20px; left:2px; width:16px; height:24px; clip-path:polygon(50% 100%, 0 0, 100% 0); background:linear-gradient(90deg,#e59b17,#ffd46d,#b46605); }
          .ams-spark { position:absolute; inset:0; width:100%; height:100%; overflow:visible; pointer-events:none; }

          @keyframes ams-fadeIn { from { opacity:0; } to { opacity:1; } }
          @keyframes ams-riseIn { from { opacity:0; transform:translateY(18px) scale(0.985); } to { opacity:1; transform:translateY(0) scale(1); } }
          @keyframes ams-cursorBlink { 50% { opacity:0; } }
          @keyframes ams-blinkBurst { 0%,35%,100% { opacity:0; transform:scale(.92); } 50%,70% { opacity:1; transform:scale(1); } }
          @keyframes ams-typeLine {
            0%,5% { width:0; opacity:0.9; }
            30%,85% { width:var(--ams-target); opacity:1; }
            100% { width:var(--ams-target); opacity:0.6; }
          }
          @keyframes ams-penWrite {
            0%,12% { transform:translate(-58px,6px) rotate(24deg); }
            30% { transform:translate(-39px,-2px) rotate(31deg); }
            48% { transform:translate(-20px,8px) rotate(25deg); }
            66% { transform:translate(2px,-3px) rotate(32deg); }
            82% { transform:translate(10px,4px) rotate(27deg); }
            100% { transform:translate(-58px,6px) rotate(24deg); }
          }
          @keyframes ams-handwriting {
            0%,12% { stroke-dashoffset:140; opacity:0; }
            32%,74% { stroke-dashoffset:0; opacity:1; }
            100% { stroke-dashoffset:0; opacity:0; }
          }
          @keyframes ams-lineWrite {
            0%,10% { transform:scaleX(0.18); opacity:0.38; }
            45%,100% { transform:scaleX(1); opacity:1; }
          }

          @media (max-width:1180px) {
            .ams-card { min-height:550px; }
            .ams-art { opacity:0.92; transform:scale(0.82); transform-origin:right bottom; }
            .ams-title, .ams-intro { max-width:270px; }
            .ams-hand .ams-title, .ams-hand .ams-intro { max-width:225px; }
          }
          @media (max-width:760px) {
            .ams-cards { grid-template-columns:1fr; max-width:720px; margin-inline:auto; }
            .ams-card { min-height:560px; }
            .ams-art { width:315px; opacity:1; }
            .ams-hand .ams-title, .ams-hand .ams-intro { max-width:340px; }
            .ams-hand-art { width:300px; }
          }
          @media (max-width:580px) {
            .ams-page { padding:16px 12px 24px; }
            .ams-card { min-height:auto; padding:24px 20px; border-radius:20px; }
            .ams-top { min-height:64px; margin-bottom:20px; }
            .ams-icon { width:58px; height:58px; }
            .ams-icon svg { width:30px; height:30px; }
            .ams-pill { min-height:32px; padding:0 14px; font-size:11px; gap:6px; }
            .ams-hero { min-height:310px; margin-bottom:12px; }
            .ams-title { font-size:30px; max-width:none; }
            .ams-intro { font-size:16px; max-width:none; }
            .ams-hand .ams-title, .ams-hand .ams-intro { max-width:none; }
            .ams-art { width:100%; max-width:315px; right:50%; transform:translateX(50%) scale(0.86); bottom:0; }
            .ams-features { gap:20px; }
            .ams-feature { grid-template-columns:48px 1fr; }
            .ams-feat-icon { width:48px; height:48px; }
            .ams-feat-icon svg { width:25px; height:25px; }
            .ams-choose { height:62px; font-size:18px; }
            .ams-back { font-size:16px; }
          }
          @media (prefers-reduced-motion: reduce) {
            .ams-page, .ams-shell, .ams-card, .ams-card:hover, .ams-cursor, .ams-linestack i,
            .ams-burst, .ams-pen, .ams-writing, .ams-noteline i { animation:none !important; }
          }
        `}</style>
      </div>
    );
  }

  /* ──────────────────────────── MAINS UI ──────────────────────────── */
  if (isMains) {
    const marksPerQ = totalMarks && totalQuestions ? Math.round(totalMarks / totalQuestions) : 15;
    const isHandwrite = answerMode === 'handwrite';
    // Completion is driven by the "Done" capsule on each question card, so the
    // answered progress reflects the real, user-confirmed completion state.
    const answeredCount = questions.reduce((acc, _, i) => acc + (tickedQuestions[i] ? 1 : 0), 0);
    const timeUp = timeLeft <= 0;
    // Handwrite mode reveals the upload step once the user finishes writing or time runs out.
    const showUpload = isHandwrite && (doneWriting || timeUp);

    const emptyAnswer = { text: '', file: null, files: [] };

    // Per-question text setter (all questions are on screen at once)
    const setAnswerText = (i: number, value: string) => {
      setMainsAnswers(prev => ({
        ...prev,
        [i]: { ...(prev[i] || emptyAnswer), text: value },
      }));
    };

    // Per-question: add files (appends to existing list)
    const addAnswerFiles = (i: number, newFiles: File[]) => {
      setMainsAnswers(prev => {
        const existing = prev[i] || emptyAnswer;
        const combined = [...existing.files, ...newFiles];
        return { ...prev, [i]: { ...existing, files: combined, file: combined[0] || null } };
      });
      // Uploading an answer un-marks any earlier "didn't attempt" decision.
      setUnattemptedQuestions(prev => (prev[i] ? { ...prev, [i]: false } : prev));
    };

    // Per-question: remove a single file by index
    const removeAnswerFile = (i: number, fileIdx: number) => {
      setMainsAnswers(prev => {
        const existing = prev[i] || emptyAnswer;
        const updated = existing.files.filter((_, fi) => fi !== fileIdx);
        return { ...prev, [i]: { ...existing, files: updated, file: updated[0] || null } };
      });
    };

    // Per-question: replace a single file by index
    const replaceAnswerFile = (i: number, fileIdx: number, newFile: File) => {
      setMainsAnswers(prev => {
        const existing = prev[i] || emptyAnswer;
        const updated = [...existing.files];
        updated[fileIdx] = newFile;
        return { ...prev, [i]: { ...existing, files: updated, file: updated[0] || null } };
      });
    };

    return (
      <div
        className="font-arimo"
        style={{
          minHeight: '100vh',
          background: '#FAFBFE',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ── Header ── */}
        <div style={{ padding: isMobile ? '10px 12px' : '14px 24px', flexShrink: 0 }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 16,
            padding: '14px 20px',
            boxShadow: '0px 1px 3px rgba(0,0,0,0.08), 0px 2px 8px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>✍️</span>
              <div>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#101828' }}>
                  Mains Mock Test – {paperParam || 'Paper'}, {subjectParam || 'Subject'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  {questions.map((_, idx) => (
                    <div
                      key={idx}
                      // Chip is dynamically tied to real completion: green once the
                      // question is marked "Done", back to the incomplete state otherwise.
                      style={{
                        width: 24,
                        height: 5,
                        borderRadius: 999,
                        background: tickedQuestions[idx] ? '#22C55E' : '#FDC700',
                        transition: 'background 0.15s ease',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div style={{ width: 80 }} />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#FEF2F2', borderBottom: '1px solid #FECACA', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span>⚠️</span>
            <span style={{ fontSize: 13, color: '#991B1B' }}>{error}</span>
          </div>
        )}

        {/* ── Body ── */}
        <div
          className={isMobile ? 'flex flex-col gap-4 p-3' : 'flex flex-row gap-5 p-5'}
          style={{ flex: 1, boxSizing: 'border-box' }}
        >
          {/* ── Left column: ALL questions stacked ── */}
          <div className="flex flex-col gap-4" style={{ flex: 1, minWidth: 0 }}>

            {/* Handwrite-mode banner */}
            {isHandwrite && !showUpload && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 16, padding: isMobile ? '16px' : '18px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 28 }}>✍️</span>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#17223E' }}>Handwriting Mode: Write on Paper</p>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#D97706', border: '1px solid #FDE68A', borderRadius: 999, padding: '2px 10px', background: '#FFFBEB' }}>Active</span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6A7282', lineHeight: '20px' }}>
                      Write each answer in your booklet while the timer runs.<br />
                      {"When you finish, tap \"I'm done writing\" to upload your scans."}
                    </p>
                  </div>
                </div>
                {!isMobile && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, flexShrink: 0 }}>
                    {[
                      { icon: '✏️', label: 'Write', sub: 'in your booklet' },
                      { icon: '📋', label: 'Scan', sub: 'clearly' },
                      { icon: '📤', label: 'Upload', sub: 'and submit' },
                    ].map((step, idx, arr) => (
                      <div key={step.label} style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 90 }}>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FFFFFF', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                            {step.icon}
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#17223E' }}>{step.label}</span>
                          <span style={{ fontSize: 10, color: '#9CA3AF', marginTop: -2 }}>{step.sub}</span>
                        </div>
                        {idx < arr.length - 1 && (
                          <div style={{ width: 24, borderTop: '2px dotted #D1D5DB', marginBottom: 20 }} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {isHandwrite && showUpload && (
              <div id="mains-upload-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: '#F0F5FF', border: '1px solid #BFDBFE', borderRadius: 16, padding: isMobile ? '16px' : '18px 24px', scrollMarginTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ position: 'relative', width: 60, height: 60, flexShrink: 0 }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 30 }}>📋</span>
                    </div>
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: '50%', background: '#00C950', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.5L4.5 8.5L9.5 3.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#17223E' }}>Upload your answer pages</p>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6A7282', lineHeight: '20px' }}>
                      Attach the scan/photo of each answer below,<br />then submit for evaluation.
                    </p>
                  </div>
                </div>
                {!isMobile && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, flexShrink: 0 }}>
                    {[
                      { icon: '📄', borderColor: '#BFDBFE', label: 'Upload Pages', sub: 'Add clear scans or photos' },
                      { icon: '📋', borderColor: '#DDD6FE', label: 'Review & Confirm', sub: 'Check all pages are correct' },
                      { icon: '📤', borderColor: '#A7F3D0', label: 'Submit for Evaluation', sub: 'Get AI evaluation & feedback' },
                    ].map((step, idx, arr) => (
                      <div key={step.label} style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, width: 120 }}>
                          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#FFFFFF', border: `1.5px solid ${step.borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                            {step.icon}
                          </div>
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#17223E', textAlign: 'center' }}>{step.label}</span>
                          <span style={{ fontSize: 10, color: '#9CA3AF', textAlign: 'center', marginTop: -3, lineHeight: '14px' }}>{step.sub}</span>
                        </div>
                        {idx < arr.length - 1 && (
                          <div style={{ width: 32, borderTop: '2px dotted #CBD5E1', marginBottom: 28 }} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {questions.map((q, i) => {
              const answer = mainsAnswers[i] || { text: '', file: null, files: [] };
              const wordCount = answer.text.trim() ? answer.text.trim().split(/\s+/).filter(Boolean).length : 0;
              const isDone = !!tickedQuestions[i];
              // Real upload state for this question - driven by the actual files
              // attached, never hardcoded. Powers the green "Uploaded" capsule.
              const isUploaded = answer.files.length > 0;
              const isUnattempted = !!unattemptedQuestions[i];
              // The card's green "success" styling reflects the Done tick while writing,
              // but during the upload phase it must reflect a REAL upload - so the box
              // stays neutral/default until the answer is actually uploaded, then turns green.
              const isBoxComplete = showUpload ? isUploaded : isDone;
              return (
                <div
                  key={q.id ?? i}
                  id={`mains-q-${i}`}
                  style={{
                    scrollMarginTop: 24,
                    background: isBoxComplete ? '#F6FEF9' : '#FFFFFF',
                    borderRadius: '16px',
                    padding: '20px 24px',
                    border: `1.5px solid ${isBoxComplete ? '#22C55E' : 'transparent'}`,
                    boxShadow: isBoxComplete
                      ? '0 0 0 1px #22C55E22, 0px 1px 3px 0px #16A34A22'
                      : '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A',
                    transition: 'border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease',
                  }}
                  className="flex flex-col gap-3"
                >
                  {/* Chips row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-wrap gap-2">
                      <span style={{ background: isBoxComplete ? '#DCFCE7' : '#EFF6FF', borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: isBoxComplete ? '#15803D' : '#155DFC', transition: 'all 0.15s ease' }}>
                        {(q as any).paper || paperParam || 'GS Paper I'}
                      </span>
                      {q.subject && (
                        <span style={{ background: '#F3E8FF', borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: '#6B21A8' }}>
                          {q.subject}
                        </span>
                      )}
                    </div>
                    {!showUpload && (
                      <button
                        type="button"
                        onClick={() => setTickedQuestions(prev => ({ ...prev, [i]: !prev[i] }))}
                        aria-pressed={isDone}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          height: 30,
                          padding: '0 14px',
                          borderRadius: 999,
                          border: `1.5px solid ${isDone ? '#22C55E' : '#D1D5DB'}`,
                          background: isDone ? '#DCFCE7' : '#FFFFFF',
                          color: isDone ? '#15803D' : '#6B7280',
                          fontSize: 12.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          flexShrink: 0,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {isDone ? (
                          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                            <path d="M3 7.5L5.5 10L11 4" stroke="#15803D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <span style={{ width: 13, height: 13, borderRadius: '50%', border: '1.5px solid #CBD5E1', flexShrink: 0 }} />
                        )}
                        Done
                      </button>
                    )}
                    {/* Upload screen: the completion capsule reflects the real
                        upload state - green "Uploaded" once files are attached,
                        neutral "Not uploaded" until then. Never hardcoded. */}
                    {showUpload && (
                      <span
                        aria-label={isUploaded ? 'Answer uploaded' : isUnattempted ? 'Marked not attempted' : 'Answer not uploaded yet'}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          height: 30,
                          padding: '0 14px',
                          borderRadius: 999,
                          border: `1.5px solid ${isUploaded ? '#22C55E' : isUnattempted ? '#FCD34D' : '#E5E7EB'}`,
                          background: isUploaded ? '#DCFCE7' : isUnattempted ? '#FEF3C7' : '#F3F4F6',
                          color: isUploaded ? '#15803D' : isUnattempted ? '#B45309' : '#9CA3AF',
                          fontSize: 12.5,
                          fontWeight: 700,
                          flexShrink: 0,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {isUploaded ? (
                          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                            <path d="M3 7.5L5.5 10L11 4" stroke="#15803D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <span style={{ width: 13, height: 13, borderRadius: '50%', border: `1.5px solid ${isUnattempted ? '#D97706' : '#CBD5E1'}`, flexShrink: 0 }} />
                        )}
                        {isUploaded ? 'Uploaded' : isUnattempted ? 'Not attempted' : 'Not uploaded'}
                      </span>
                    )}
                  </div>

                  {/* Badge + metadata row */}
                  <div className="flex items-center justify-between">
                    <span style={{ background: '#101828', color: '#FFFFFF', fontWeight: 700, fontSize: 11, padding: '4px 12px', borderRadius: 8 }}>
                      QUESTION {i + 1} OF {totalQuestions}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      {(() => {
                        const qMarks = q.marks ?? marksPerQ;
                        const qMin = mainsTimeLimit(qMarks);
                        const qWordsLabel = qMarks >= 100
                          ? (() => { const r = mainsWordRange(qMarks); return `${r.min}–${r.max}`; })()
                          : String(mainsWordLimit(qMarks));
                        return (
                          <>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#6A7282', fontWeight: 500 }}>⏱️ {qMin} min</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#6A7282', fontWeight: 500 }}>📝 {qWordsLabel} words</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#6A7282', fontWeight: 500 }}>⭐ {qMarks} marks</span>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Question text - gold-bordered serif blockquote (matches Daily Answer Writing) */}
                  <div style={{ borderRadius: 10, background: '#F9FAFB', padding: 16, boxShadow: '0px 1px 2px -1px #0000001A', borderLeft: '4px solid #C9A84C' }}>
                    <p className="italic" style={{ fontSize: 16, lineHeight: '26px', color: '#101828', fontFamily: 'var(--font-merriweather), Georgia, serif', margin: 0 }}>
                      &quot;{stripMarksSuffix(q.text)}&quot;
                    </p>
                  </div>

                  {/* Answer area - depends on the chosen mode */}
                  {isHandwrite && showUpload && (
                    /* Handwrite mode, writing done: per-question multi-file upload */
                    <div className="flex flex-col gap-2">
                      {/* Uploaded files list */}
                      {answer.files.map((f, fi) => (
                        <div
                          key={`${f.name}-${fi}`}
                          className="flex items-center gap-4"
                          style={{ padding: '12px 14px', borderRadius: 14, border: '1.5px solid #BBF7D0', background: '#F0FDF4' }}
                        >
                          <FilePreviewThumb file={f} size={64} />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                              <span style={{ fontSize: 13.5, fontWeight: 700, color: '#17223E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {f.name}
                              </span>
                              <svg width="16" height="16" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
                                <circle cx="9" cy="9" r="9" fill="#16A34A" />
                                <path d="M5 9.5L7.5 12L13 6.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            <span style={{ fontSize: 12, color: '#6A7282' }}>
                              {(f.size / 1024 / 1024).toFixed(1)} MB
                              {answer.files.length > 1 && <> · Page {fi + 1} of {answer.files.length}</>}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => setPreviewFile(f)}
                              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 12px', background: 'none', border: '1px solid #E5E7EB', borderRadius: 10, cursor: 'pointer' }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="#6B7280" strokeWidth="2"/></svg>
                              <span style={{ fontSize: 10, fontWeight: 600, color: '#6B7280' }}>Preview</span>
                            </button>
                            <label
                              htmlFor={`mains-file-replace-${i}-${fi}`}
                              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 12px', background: 'none', border: '1px solid #E5E7EB', borderRadius: 10, cursor: 'pointer' }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17 1l4 4-4 4" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 11V9a4 4 0 014-4h14" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 23l-4-4 4-4" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 13v2a4 4 0 01-4 4H3" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              <span style={{ fontSize: 10, fontWeight: 600, color: '#16A34A' }}>Replace</span>
                            </label>
                            <input
                              id={`mains-file-replace-${i}-${fi}`}
                              type="file"
                              accept=".jpg,.jpeg,.png,.pdf"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const newFile = e.target.files?.[0];
                                if (newFile) replaceAnswerFile(i, fi, newFile);
                                e.target.value = '';
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => removeAnswerFile(i, fi)}
                              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 12px', background: 'none', border: '1px solid #E5E7EB', borderRadius: 10, cursor: 'pointer' }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              <span style={{ fontSize: 10, fontWeight: 600, color: '#EF4444' }}>Remove</span>
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add more files button */}
                      <label
                        htmlFor={`mains-file-${i}`}
                        className="w-full flex items-center justify-between"
                        style={{ padding: '14px 16px', borderRadius: 12, border: '1.5px dashed #CBD5E1', background: '#F9FAFB', cursor: 'pointer' }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 600, color: '#17223E' }}>
                          📤 {answer.files.length > 0 ? 'Add more pages' : `Upload your answer pages for Q${i + 1}`}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#155DFC' }}>Browse</span>
                      </label>
                      <input
                        id={`mains-file-${i}`}
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        multiple
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files && files.length > 0) addAnswerFiles(i, Array.from(files));
                          e.target.value = '';
                        }}
                      />
                    </div>
                  )}

                  {!isHandwrite && (() => {
                    // Type-answer editors are expanded by default so the writing
                    // area is visible the moment the user enters Type Answer mode.
                    // Only an explicit `false` (user collapsed it) hides it.
                    const isOpen = openEditors[i] !== false;
                    return (
                      <div>
                        <button
                          type="button"
                          onClick={() => setOpenEditors(prev => ({ ...prev, [i]: prev[i] === false }))}
                          className="w-full flex items-center justify-between"
                          style={{
                            padding: '12px 16px',
                            borderRadius: isOpen ? '12px 12px 0 0' : '12px',
                            border: '1.5px solid #E5E7EB',
                            borderBottom: isOpen ? 'none' : '1.5px solid #E5E7EB',
                            background: '#F9FAFB',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: 14,
                            color: '#17223E',
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            ✍️ Write Your Answer
                            {wordCount > 0 && (
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#15803D', background: '#DCFCE7', borderRadius: 999, padding: '2px 8px' }}>
                                {wordCount} words
                              </span>
                            )}
                          </span>
                          <span style={{ fontSize: 12, color: '#6A7282', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
                        </button>
                        {isOpen && (
                          <div>
                            <textarea
                              value={answer.text}
                              onChange={(e) => setAnswerText(i, e.target.value)}
                              placeholder="Write your answer here..."
                              rows={8}
                              autoFocus={i === 0}
                              disabled={timeUp}
                              style={{ width: '100%', padding: '14px 16px', border: '1.5px solid #E5E7EB', borderTop: 'none', borderRadius: '0 0 12px 12px', fontSize: 14, lineHeight: '24px', color: '#0F172B', fontFamily: 'Arimo, sans-serif', resize: 'vertical', boxSizing: 'border-box', background: timeUp ? '#F3F4F6' : '#FAFAFA', outline: 'none' }}
                            />
                            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '6px 0 0' }}>
                              {wordCount} words
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                </div>
              );
            })}

            {/* Submit all - handwrite mode gates this behind "I'm done writing" */}
            <div className="flex flex-col gap-2">
              {isHandwrite && !showUpload ? (
                <button
                  type="button"
                  onClick={() => setDoneWriting(true)}
                  className="w-full flex items-center justify-center gap-2 text-white font-bold transition-transform hover:scale-[1.01]"
                  style={{ height: '52px', background: '#17223E', borderRadius: '14px', fontSize: '16px', border: 'none', cursor: 'pointer', boxShadow: '0px 10px 15px -3px rgba(0,0,0,0.1)' }}
                >
                  📤 I'm done writing, Upload my answers
                </button>
              ) : (
                <button
                  type="button"
                  disabled={mainsSubmitting}
                  onClick={requestMainsSubmit}
                  className="w-full flex items-center justify-center gap-2 text-white font-bold transition-transform hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{ height: '52px', background: '#17223E', borderRadius: '14px', fontSize: '16px', border: 'none', cursor: mainsSubmitting ? 'not-allowed' : 'pointer', boxShadow: '0px 10px 15px -3px rgba(0,0,0,0.1)' }}
                >
                  {mainsSubmitting ? (
                    <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />Submitting...</>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Submit {totalQuestions} Answers for Evaluation
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* ── Right column: Timer (writing mode) or Upload Guidelines + Progress (upload mode) ── */}
          <div style={{ width: isMobile ? '100%' : '280px', flexShrink: 0, order: isMobile ? -1 : 0, position: isMobile ? 'static' : 'sticky', top: 20, alignSelf: 'flex-start' }}>
            {!showUpload ? (
              <>
                <WritingTimer
                  timeLeft={timeLeft}
                  totalSeconds={examTotalSeconds}
                  statusLabel={timeUp ? 'time up' : examRunning ? 'in progress' : 'paused'}
                >
                  {/* Timer controls stack vertically so the descriptive "Upload My Answer"
                      option sits directly below the Pause/Resume button (see reference). */}
                  <div className="flex flex-col gap-2 w-full">
                    <button
                      type="button"
                      disabled={timeUp}
                      onClick={() => setExamRunning(r => !r)}
                      className="w-full flex items-center justify-center gap-2 font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ height: 44, background: examRunning ? '#EF4444' : '#00BC7D', border: 'none', borderRadius: '12px', fontSize: 14, cursor: timeUp ? 'not-allowed' : 'pointer' }}
                    >
                      {examRunning ? '⏸ Pause' : '▶ Resume'}
                    </button>

                    {/* Upload My Answer - descriptive (Write on Paper) only; reveals the
                        upload step and scrolls to it. Never shown for objective/prelims. */}
                    {isHandwrite && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setDoneWriting(true);
                            setTimeout(() => {
                              document.getElementById('mains-upload-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }, 120);
                          }}
                          className="w-full flex items-center justify-center gap-2 font-bold text-white transition-transform hover:scale-[1.01]"
                          style={{ height: 44, background: '#17223E', border: 'none', borderRadius: '12px', fontSize: 14, cursor: 'pointer' }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                            <path d="M12 16V4m0 0L8 8m4-4l4 4M4 14v4a2 2 0 002 2h12a2 2 0 002-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Upload My Answer
                        </button>
                        <p style={{ textAlign: 'center', fontSize: 12, color: '#6B7280', margin: 0 }}>
                          Upload your scans to submit
                        </p>
                      </>
                    )}
                  </div>
                </WritingTimer>

                {/* Progress - reflects the questions marked "Done" */}
                <div
                  className="bg-white flex flex-col items-center"
                  style={{ borderRadius: 20, marginTop: 16, padding: 20, boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A' }}
                >
                  <p style={{ fontWeight: 600, fontSize: 11, letterSpacing: '0.08em', color: '#6A7282', textTransform: 'uppercase', margin: '0 0 12px' }}>Progress</p>
                  <div style={{ position: 'relative', width: 92, height: 92, marginBottom: 8 }}>
                    <svg width="92" height="92" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="46" cy="46" r="38" fill="none" stroke="#F3F4F6" strokeWidth="7" />
                      <circle
                        cx="46" cy="46" r="38" fill="none"
                        stroke="#16A34A"
                        strokeWidth="7"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 38}
                        strokeDashoffset={2 * Math.PI * 38 - (answeredCount / Math.max(1, totalQuestions)) * 2 * Math.PI * 38}
                        style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                      />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: 20, color: '#101828', lineHeight: 1 }}>{answeredCount}</span>
                      <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>of {totalQuestions}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: '#6B7280', fontWeight: 500, margin: 0 }}>answered</p>
                </div>

                {/* Quick nav: jump straight to the answer upload section on this same page */}
                {isHandwrite && (
                  <button
                    type="button"
                    onClick={() => {
                      setDoneWriting(true); // reveal the upload step if still writing
                      // Wait for the upload section to render, then smoothly bring it into view.
                      setTimeout(() => {
                        document.getElementById('mains-upload-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 120);
                    }}
                    className="w-full flex items-center justify-center gap-2 hover:underline"
                    style={{ marginTop: 12, background: 'transparent', border: 'none', color: '#155DFC', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                      <path d="M12 16V4m0 0L8 8m4-4l4 4M4 14v4a2 2 0 002 2h12a2 2 0 002-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Upload My Answers
                  </button>
                )}

                {/* Quick Tips (writing mode only) */}
                {isHandwrite && (
                  <div
                    className="bg-white overflow-hidden"
                    style={{ borderRadius: 20, marginTop: 16, boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A' }}
                  >
                    <div className="flex items-center gap-2" style={{ padding: '14px 20px', background: '#FEFCE8', borderBottom: '1px solid #FEF08A' }}>
                      <span style={{ fontSize: 18 }}>💡</span>
                      <span className="font-bold text-[#101828]" style={{ fontSize: 13, letterSpacing: '0.04em' }}>QUICK TIPS FOR BEST EVALUATION</span>
                    </div>
                    {[
                      { key: 'ink', icon: '✏️', label: 'Ink & Paper', points: ['Use dark blue or black ink only', 'Unruled sheets work best for evaluation', 'Avoid pencil - AI may miss faint marks'] },
                      { key: 'photo', icon: '📷', label: 'Photography', points: ['Take photos in bright, shadow-free lighting', 'Keep camera parallel to paper (no angle)', 'Avoid reflections - turn off flash if needed'] },
                      { key: 'format', icon: '📝', label: 'Writing Format', points: ['Leave proper margins on both sides', 'Write question numbers clearly at the top', 'Upload pages in correct order (P1, P2...)'] },
                      { key: 'accuracy', icon: '🎯', label: 'For Accuracy', points: ['Number each page if multi-page answer', 'Keep handwriting legible - not too rushed', 'Upload the right page for each question'] },
                    ].map((tip) => (
                      <div key={tip.key} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <button
                          type="button"
                          onClick={() => setOpenTip(openTip === tip.key ? null : tip.key)}
                          className="w-full flex items-center justify-between hover:bg-[#F9FAFB] transition-colors text-left"
                          style={{ padding: '14px 20px' }}
                        >
                          <span className="flex items-center gap-2 font-semibold text-[#101828]" style={{ fontSize: 14 }}>
                            <span>{tip.icon}</span>
                            {tip.label}
                          </span>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, color: '#9CA3AF', transition: 'transform 0.2s', transform: openTip === tip.key ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        {openTip === tip.key && (
                          <div style={{ padding: '0 20px 14px' }}>
                            {tip.points.map((pt, idx) => (
                              <div key={idx} className="flex items-start gap-3" style={{ marginBottom: 8 }}>
                                <span className="font-bold flex-shrink-0" style={{ color: '#0F766E', fontSize: 14, marginTop: 1 }}>✓</span>
                                <span className="text-[#4A5565]" style={{ fontSize: 13, lineHeight: '20px' }}>{pt}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Upload Guidelines */}
                <div
                  className="bg-white overflow-hidden"
                  style={{ borderRadius: 20, boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A' }}
                >
                  <div className="flex items-center gap-2" style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6' }}>
                    <span style={{ fontSize: 18 }}>💡</span>
                    <span className="font-bold text-[#101828]" style={{ fontSize: 14 }}>Upload Guidelines</span>
                  </div>
                  <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { bold: 'Upload clear', rest: ' and well-lit scans' },
                      { bold: 'All page edges', rest: ' must be visible' },
                      { bold: 'Write question number clearly', rest: '\non each answer sheet' },
                      { bold: 'Accepted formats:', rest: ' JPG, PNG, PDF' },
                      { bold: 'Max size:', rest: ' 10MB per file' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                          <circle cx="10" cy="10" r="10" fill="#F0FDF4" />
                          <path d="M6 10.5L8.5 13L14 7.5" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span style={{ fontSize: 13, color: '#374151', lineHeight: '20px' }}>
                          <strong style={{ fontWeight: 700 }}>{item.bold}</strong>{item.rest}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Your Progress */}
                <div
                  className="bg-white flex flex-col items-center"
                  style={{ borderRadius: 20, marginTop: 16, padding: 20, boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A' }}
                >
                  <p style={{ fontWeight: 600, fontSize: 13, color: '#374151', alignSelf: 'flex-start', margin: '0 0 16px' }}>Your Progress</p>
                  <div style={{ position: 'relative', width: 100, height: 100, marginBottom: 8 }}>
                    <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#F3F4F6" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="40" fill="none"
                        stroke="#16A34A"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 40}
                        strokeDashoffset={2 * Math.PI * 40 - (answeredCount / Math.max(1, totalQuestions)) * 2 * Math.PI * 40}
                        style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                      />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: 22, color: '#101828', lineHeight: 1 }}>{answeredCount}</span>
                      <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>of {totalQuestions}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: '#6B7280', fontWeight: 500, margin: 0 }}>answered</p>
                </div>

                {/* After you submit */}
                <div
                  className="bg-white"
                  style={{ borderRadius: 20, marginTop: 16, padding: '16px 20px', boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A' }}
                >
                  <div className="flex items-start gap-3">
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                      <circle cx="11" cy="11" r="10" stroke="#93C5FD" strokeWidth="1.5" fill="#EFF6FF" />
                      <circle cx="11" cy="8" r="1" fill="#3B82F6" />
                      <path d="M11 11v4" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    <div>
                      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: '#101828' }}>After you submit</p>
                      <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#6B7280', lineHeight: '19px' }}>
                        You will receive AI evaluation, detailed feedback, and performance insights.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      {/* ── Missing-answer popup: a question has no upload at submit time ── */}
      {missingAnswerIdx !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mains-missing-title"
          onClick={() => setMissingAnswerIdx(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 70,
            display: 'grid', placeItems: 'center', padding: 20,
            background: 'rgba(8,15,31,0.34)', backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            animation: 'mains-confirm-fade 160ms ease both',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(440px, 100%)',
              background: '#FFFFFF',
              border: '1px solid rgba(226,232,240,0.9)',
              borderRadius: 24,
              padding: 30,
              boxShadow: '0 35px 90px rgba(5,12,29,0.28)',
              animation: 'mains-confirm-pop 220ms cubic-bezier(.2,.75,.2,1) both',
            }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: '#FEF3C7', display: 'grid', placeItems: 'center', marginBottom: 18,
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 3.2 1.8 20.5h20.4L12 3.2Z" stroke="#B45309" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M12 9.5v4.6" stroke="#B45309" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="12" cy="17.4" r="0.9" fill="#B45309" />
              </svg>
            </div>
            <h2 id="mains-missing-title" style={{
              margin: '0 0 10px', fontSize: 22, lineHeight: 1.2, letterSpacing: '-0.01em',
              fontWeight: 700, color: '#0F172B',
              fontFamily: "var(--font-playfair), Georgia, 'Times New Roman', serif",
            }}>
              ⚠️ Please upload your answer page for Question {missingAnswerIdx + 1} before submitting.
            </h2>
            <p style={{ margin: '0 0 24px', color: '#4F5D7B', fontSize: 15, lineHeight: 1.55, fontWeight: 500 }}>
              If you didn&apos;t attempt this question, you can mark it as unattempted and continue - it won&apos;t be sent for evaluation.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                type="button"
                onClick={handleUploadMissingAnswer}
                style={{
                  border: 'none', borderRadius: 12, padding: '14px 20px',
                  fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  background: '#17223E', color: '#FFFFFF',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 16V4M12 4l-5 5M12 4l5 5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Upload
              </button>
              <button
                type="button"
                onClick={handleMarkUnattempted}
                style={{
                  border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 20px',
                  fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  background: '#FFFFFF', color: '#475875',
                }}
              >
                I didn&apos;t attempt this question
              </button>
            </div>
          </div>
          <style>{`
            @keyframes mains-confirm-fade { from { opacity: 0; } to { opacity: 1; } }
            @keyframes mains-confirm-pop { from { opacity: 0; transform: translateY(12px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
          `}</style>
        </div>
      )}

      {/* ── Submit-all confirmation popup (blocks direct submit) ── */}
      {mainsConfirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mains-confirm-title"
          onClick={() => { if (!mainsSubmitting) setMainsConfirmOpen(false); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 60,
            display: 'grid', placeItems: 'center', padding: 20,
            background: 'rgba(8,15,31,0.34)', backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            animation: 'mains-confirm-fade 160ms ease both',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(460px, 100%)',
              background: '#FFFFFF',
              border: '1px solid rgba(226,232,240,0.9)',
              borderRadius: 24,
              padding: 30,
              boxShadow: '0 35px 90px rgba(5,12,29,0.28)',
              animation: 'mains-confirm-pop 220ms cubic-bezier(.2,.75,.2,1) both',
            }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: '#FEF3C7', display: 'grid', placeItems: 'center', marginBottom: 18,
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 3.2 1.8 20.5h20.4L12 3.2Z" stroke="#B45309" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M12 9.5v4.6" stroke="#B45309" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="12" cy="17.4" r="0.9" fill="#B45309" />
              </svg>
            </div>
            <h2 id="mains-confirm-title" style={{
              margin: '0 0 10px', fontSize: 26, lineHeight: 1.15, letterSpacing: '-0.02em',
              fontWeight: 700, color: '#0F172B',
              fontFamily: "var(--font-playfair), Georgia, 'Times New Roman', serif",
            }}>
              Submit all answers for evaluation?
            </h2>
            <p style={{ margin: '0 0 24px', color: '#4F5D7B', fontSize: 15, lineHeight: 1.55, fontWeight: 500 }}>
              Once submitted, our AI evaluator will score each answer on content, structure, and presentation. This usually takes under a minute.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setMainsConfirmOpen(false)}
                disabled={mainsSubmitting}
                style={{
                  border: 'none', borderRadius: 12, padding: '13px 20px',
                  fontSize: 15, fontWeight: 700,
                  cursor: mainsSubmitting ? 'not-allowed' : 'pointer',
                  background: '#EEF3FB', color: '#475875',
                }}
              >
                Review again
              </button>
              <button
                type="button"
                disabled={mainsSubmitting}
                onClick={handleMainsSubmitAll}
                style={{
                  border: 'none', borderRadius: 12, padding: '13px 20px',
                  fontSize: 15, fontWeight: 700,
                  cursor: mainsSubmitting ? 'not-allowed' : 'pointer',
                  background: '#17223E', color: '#FFFFFF', opacity: mainsSubmitting ? 0.6 : 1,
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                }}
              >
                {mainsSubmitting ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Submitting…</>
                ) : 'Yes, submit'}
              </button>
            </div>
          </div>
          <style>{`
            @keyframes mains-confirm-fade { from { opacity: 0; } to { opacity: 1; } }
            @keyframes mains-confirm-pop { from { opacity: 0; transform: translateY(12px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
          `}</style>
        </div>
      )}

      {/* In-page uploaded-answer preview - stays inside the upload flow (no new tab / no navigation) */}
      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      </div>
    );
  }
  /* ─────────────────────────── END MAINS UI ─────────────────────────── */

  // Reusable navigator + session-stats column (mirrors Daily MCQ Challenge)
  const cardStyle: React.CSSProperties = { background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: 16, boxShadow: '0px 1px 2px -1px rgba(0,0,0,0.10), 0px 1px 3px rgba(0,0,0,0.10)', flexShrink: 0 };
  const sectionHeading: React.CSSProperties = { fontWeight: 700, fontSize: 11, letterSpacing: '0.14em', color: '#8892A4', textTransform: 'uppercase' };
  const navigatorCard = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Question Navigator card */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={sectionHeading}>Question Navigator</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF' }}>{totalQuestions} total</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {questions.map((qu, idx) => {
            const isCurrent = idx === currentIdx;
            const isAnswered = !!selectedOptions[idx] && !flagged[String(qu.id)];
            const isSkipped = !!skipped[idx] && !selectedOptions[idx] && !flagged[String(qu.id)];
            const isMarked = !!flagged[String(qu.id)];
            const isBookmarked = !!bookmarkedQuestions[String(qu.id)];

            let bg = '#F4F6FA';
            let color = '#475067';
            if (isSkipped) { bg = '#FEE2E2'; color = '#9F1239'; }
            if (isBookmarked) { bg = '#FFFBEB'; color = '#D97706'; }
            if (isAnswered) { bg = '#DCFCE7'; color = '#166534'; }
            if (isMarked) { bg = '#FEF3C7'; color = '#92400E'; }
            if (isCurrent) { bg = '#060C1C'; color = '#FFFFFF'; }

            return (
              <button
                key={qu.id ?? idx}
                onClick={() => goToQuestion(idx)}
                style={{ height: 38, borderRadius: 10, border: isCurrent ? '1px solid #060C1C' : '1px solid transparent', background: bg, color, fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: isCurrent ? '0 0 0 3px rgba(6,12,28,0.18)' : 'none' }}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Session Stats card */}
      <div style={cardStyle}>
        <div style={{ ...sectionHeading, marginBottom: 12 }}>Session Stats</div>
        {[
          { label: 'Answered', color: '#22C55E', background: '#DCFCE7', value: answeredCount },
          { label: 'Not Visited', color: '#D1D5DB', background: '#F3F4F6', value: notVisitedCount },
          { label: 'Skipped', color: '#EF4444', background: '#FEE2E2', value: skippedCount },
          { label: 'Mark for Review', color: '#F59E0B', background: '#FEF3C7', value: markedCount },
        ].map((row) => (
          <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: row.background, border: `1px solid ${row.color}` }} />
              <span style={{ fontSize: 12, color: '#374151' }}>{row.label}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{row.value}</span>
          </div>
        ))}

        <div style={{ borderTop: '1px solid #F1F3F5', paddingTop: 12, marginTop: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 3 }}>Ready to submit?</div>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 12 }}>
            {answeredCount} answered · {notVisitedCount} not visited · {skippedCount} skipped · {markedCount} marked
          </div>
          <button
            onClick={() => setShowSubmitConfirm(true)}
            disabled={submitting}
            style={{ width: '100%', height: 44, background: 'linear-gradient(180deg, #F5C518, #E6A817)', border: 'none', borderRadius: 12, color: '#0B1426', fontWeight: 800, fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, boxShadow: '0 6px 16px -6px rgba(245,197,24,0.6)' }}
          >
            {submitting ? 'Submitting...' : '✓ Submit Test'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ height: isMobile ? 'auto' : '100%', minHeight: isMobile ? '100%' : undefined, background: '#FAFBFE', fontFamily: 'Inter, sans-serif', padding: isMobile ? '10px' : '12px 20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', overflow: isMobile ? 'auto' : 'hidden' }}>
      <MainsEvaluationLimitModal
        open={showMainsQuotaModal}
        onClose={() => setShowMainsQuotaModal(false)}
        tier={entitlements.tier}
        used={entitlements.featureStatus('mains_evaluation')?.used}
        limit={entitlements.featureStatus('mains_evaluation')?.limit}
        backLabel="Back to Mock Tests"
      />
      <div style={{ maxWidth: 1320, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', flex: isMobile ? 'none' : 1, minHeight: isMobile ? 'auto' : 0 }}>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 14 }}>⚠️</span>
            <span style={{ fontSize: 14, color: '#991B1B' }}>{error}</span>
          </div>
        )}

        <div style={{ flex: isMobile ? 'none' : 1, minHeight: isMobile ? 'auto' : 0, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16, alignItems: isMobile ? 'stretch' : 'flex-start' }}>

          {/* LEFT: question card */}
          <div style={{ flex: 1, minWidth: 0, width: '100%', display: isMobile ? 'block' : 'flex', minHeight: isMobile ? 'auto' : 0, maxHeight: isMobile ? 'none' : '100%' }}>
            <div style={{ flex: isMobile ? 'none' : '0 1 auto', minHeight: isMobile ? 'auto' : 0, maxHeight: isMobile ? 'none' : '100%', width: '100%', background: '#FFFFFF', borderRadius: 16, border: '1px solid #ECECF1', boxShadow: '0 4px 24px rgba(0,0,0,0.05)', overflow: isMobile ? 'visible' : 'hidden', display: 'flex', flexDirection: 'column' }}>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 22px 11px', flexWrap: 'wrap', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/target-icon.png" alt="" style={{ width: 30, height: 30, objectFit: 'contain', flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontFamily: 'Arimo, sans-serif', fontSize: 20, fontWeight: 700, lineHeight: '26px', color: '#101828' }}>{title}</span>
                    <span style={{ fontFamily: 'Arimo, sans-serif', fontSize: 12.5, color: '#9CA3AF' }}>Prelims Mock Test · {totalQuestions} Questions · +2 correct / −0.67 wrong</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 999, padding: '4px 12px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#DC2626' }}>Mock Test in Progress</span>
                </div>
              </div>
              <div style={{ height: 1, background: '#F1F3F5' }} />

              {/* Chips + timer */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 22px 0', flexShrink: 0, flexWrap: 'nowrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: '1 1 auto', minWidth: 0 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EFF6FF', border: '1px solid #155DFC33', borderRadius: 999, padding: '5px 12px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#155DFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#155DFC' }}>{currentQ.subject || 'General'}</span>
                  </div>
                  {/* Flag = Mark for Review */}
                  <button
                    type="button"
                    onClick={() => handleToggleFlag(currentQ)}
                    title={flagged[String(currentQ.id)] ? 'Unmark for review' : 'Mark for review'}
                    aria-label={flagged[String(currentQ.id)] ? 'Unmark for review' : 'Mark for review'}
                    style={{ width: 32, height: 32, borderRadius: 9, border: `1px solid ${flagged[String(currentQ.id)] ? '#F5C518' : '#E5E7EB'}`, background: flagged[String(currentQ.id)] ? '#FEF3C7' : '#FFFFFF', color: flagged[String(currentQ.id)] ? '#D97706' : '#6B7280', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill={flagged[String(currentQ.id)] ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                      <line x1="4" y1="22" x2="4" y2="15" />
                    </svg>
                  </button>
                  {/* Bookmark */}
                  <button
                    type="button"
                    onClick={() => handleToggleBookmark(currentQ)}
                    title={bookmarkedQuestions[String(currentQ.id)] ? 'Remove bookmark' : 'Bookmark question'}
                    aria-label={bookmarkedQuestions[String(currentQ.id)] ? 'Remove bookmark' : 'Bookmark question'}
                    style={{ width: 32, height: 32, borderRadius: 9, border: `1px solid ${bookmarkedQuestions[String(currentQ.id)] ? '#BFDBFE' : '#E5E7EB'}`, background: bookmarkedQuestions[String(currentQ.id)] ? '#EFF6FF' : '#FFFFFF', color: bookmarkedQuestions[String(currentQ.id)] ? '#1E3A8A' : '#6B7280', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill={bookmarkedQuestions[String(currentQ.id)] ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/timer-icon.png" alt="Timer" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontWeight: 800, fontSize: 19, lineHeight: '22px', color: timeLeft < 60 ? '#EF4444' : '#1A1D23' }}>{formatTime(timeLeft)}</span>
                    <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF' }}>Time Left</span>
                  </div>
                </div>
              </div>

              {/* Content: question (fills) + options (2-col grid) */}
              <div style={{ flex: isMobile ? 'none' : '0 1 auto', minHeight: isMobile ? 'auto' : 0, display: 'flex', flexDirection: 'column', padding: '12px 22px 14px', overflow: isMobile ? 'visible' : 'hidden' }}>
                <div style={{ flex: isMobile ? 'none' : '0 1 auto', minHeight: isMobile ? 'auto' : 0, overflowY: isMobile ? 'visible' : 'auto', fontSize: 14, lineHeight: '23px', color: '#1A1D23', paddingRight: 6 }}>
                  <span style={{ fontWeight: 700 }}>Question {currentIdx + 1}: </span>
                  <StructuredQuestionRenderer
                    questionText={currentQ.text}
                    textStyle={{ fontSize: 14, lineHeight: '23px', color: '#1A1D23' }}
                  />
                </div>
                <div style={{ flexShrink: 0, marginTop: 12, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                  {currentQ.options.map((option) => {
                    const optKey = option.label;
                    const isSelected = selectedOptions[currentIdx] === optKey;
                    return (
                      <button
                        key={optKey}
                        onClick={() => handleSelectOption(optKey)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderRadius: 12, minHeight: 50,
                          border: isSelected ? '1.5px solid #0B1426' : '1px solid #E5E7EB',
                          background: isSelected ? '#0B1426' : '#FFFFFF',
                          cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease', width: '100%',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                        }}
                      >
                        <span style={{
                          width: 30, height: 30, borderRadius: 8,
                          border: 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 13, color: isSelected ? '#0B1426' : '#475067',
                          background: isSelected ? '#F5C518' : '#F1F4F9', flexShrink: 0,
                        }}>{optKey}</span>
                        <span style={{ fontSize: 13.5, color: isSelected ? '#FFFFFF' : '#1E293B', fontWeight: isSelected ? 600 : 400 }}>{option.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom nav */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 22px', borderTop: '1px solid #F1F3F5', flexWrap: 'wrap', flexShrink: 0 }}>
                <button
                  onClick={handlePrev}
                  disabled={currentIdx === 0}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 600, color: currentIdx === 0 ? '#C7CDD6' : '#374151', cursor: currentIdx === 0 ? 'not-allowed' : 'pointer' }}
                >
                  ← Previous
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    onClick={handleSkip}
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}
                  >
                    Skip
                  </button>
                  <button
                    onClick={() => {
                      if (currentIdx === totalQuestions - 1) {
                        setShowSubmitConfirm(true);
                      } else {
                        handleNext();
                      }
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0B1426', border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer' }}
                  >
                    {currentIdx === totalQuestions - 1 ? 'Finish' : 'Save & Next →'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: navigator + session stats */}
          <aside style={{ width: isMobile ? '100%' : 312, flexShrink: 0, minHeight: isMobile ? 'auto' : 0, overflowY: isMobile ? 'visible' : 'auto', paddingRight: 2 }}>
            {navigatorCard}
          </aside>
        </div>
      </div>

      {/* Submit confirmation modal */}
      {showSubmitConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 24, padding: '32px 36px', maxWidth: 460, width: '100%', textAlign: 'center', boxShadow: '0px 20px 40px -10px rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <h2 style={{ fontFamily: 'Arimo, sans-serif', fontWeight: 800, letterSpacing: '-0.01em', color: '#17223E', fontSize: 22, marginBottom: 8 }}>Submit Test?</h2>
            <p style={{ fontFamily: 'Arimo, sans-serif', fontWeight: 500, color: '#475467', fontSize: 14, marginBottom: 20 }}>
              Are you sure you want to submit your answers?
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
              <div style={{ background: '#F3F4F6', borderRadius: 12, padding: '14px 8px' }}>
                <div style={{ fontFamily: 'Arimo, sans-serif', fontWeight: 700, fontSize: 24, color: '#22C55E' }}>{answeredCount}</div>
                <div style={{ fontFamily: 'Arimo, sans-serif', fontSize: 12, color: '#6B7280', marginTop: 2 }}>Answered</div>
              </div>
              <div style={{ background: '#F3F4F6', borderRadius: 12, padding: '14px 8px' }}>
                <div style={{ fontFamily: 'Arimo, sans-serif', fontWeight: 700, fontSize: 24, color: '#F59E0B' }}>{skippedCount}</div>
                <div style={{ fontFamily: 'Arimo, sans-serif', fontSize: 12, color: '#6B7280', marginTop: 2 }}>Skipped</div>
              </div>
              <div style={{ background: '#F3F4F6', borderRadius: 12, padding: '14px 8px' }}>
                <div style={{ fontFamily: 'Arimo, sans-serif', fontWeight: 700, fontSize: 24, color: '#F59E0B' }}>{bookmarkedCount}</div>
                <div style={{ fontFamily: 'Arimo, sans-serif', fontSize: 12, color: '#6B7280', marginTop: 2 }}>Bookmarked</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowSubmitConfirm(false)}
                style={{ flex: 1, height: 48, background: '#F3F4F6', border: 'none', borderRadius: 12, color: '#101828', fontFamily: 'Arimo, sans-serif', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
              >
                Review More
              </button>
              <button
                onClick={() => { setShowSubmitConfirm(false); handleSubmit(); }}
                disabled={submitting}
                style={{ flex: 1, height: 48, background: '#101828', border: 'none', borderRadius: 12, color: '#FFFFFF', fontFamily: 'Arimo, sans-serif', fontWeight: 700, fontSize: 15, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
              >
                Submit Now
              </button>
            </div>
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
