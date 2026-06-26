'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { dailyMcqService, bookmarkService, flagService } from '@/lib/services';
import { useIsMobile } from '@/hooks/useIsMobile';
import { getDistinctChipStyles } from '@/lib/subjectPalette';

interface Question {
  id: string;
  questionNum: number;
  questionText: string;
  category: string;
  difficulty: string;
  pyqYear?: number | null;
  options: { id?: string; label?: string; text: string }[];
  correctOption: string;
  explanation: string | null;
}

interface TodayMCQInfo {
  id: string;
  title: string;
  topic: string;
  tags: string[];
  questionCount: number;
  timeLimit: number;
  totalMarks: number;
  attempted: boolean;
}

const FIXED_TIME_LIMIT_MINUTES = 10;

function normalizeQuestionText(text: string): string {
  return text
    .replace(/[–—]/g, '-')
    .replace(/\s+(\d+\.)\s+/g, '\n$1 ')
    .replace(/\s+-\s+/g, ' ');
}

function formatOrdinalDate(d: Date): string {
  const day = d.getDate();
  const j = day % 10;
  const k = day % 100;
  const suffix = j === 1 && k !== 11 ? 'st' : j === 2 && k !== 12 ? 'nd' : j === 3 && k !== 13 ? 'rd' : 'th';
  return `${day}${suffix} ${d.toLocaleDateString('en-US', { month: 'long' })} ${d.getFullYear()}`;
}

export default function DailyMcqChallengePage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [mcqInfo, setMcqInfo] = useState<TodayMCQInfo | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [timeLimit, setTimeLimit] = useState(FIXED_TIME_LIMIT_MINUTES);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [skipped, setSkipped] = useState<Record<string, boolean>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  // Retake: when launched with ?retake=1, ignore the "already attempted" gate and start fresh.
  const [isRetake, setIsRetake] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Load MCQ info first to check if already attempted
  useEffect(() => {
    const retake = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('retake') === '1';
    setIsRetake(retake);
    dailyMcqService.getToday()
      .then((res) => {
        setMcqInfo(res.data);
        if (res.data?.attempted && !retake) {
          return;
        }
        // Not attempted (or retaking) — load questions
        return dailyMcqService.getQuestions();
      })
      .then((res) => {
        if (!res) return;
        const questionsData = res.data.questions || [];
        // Ensure we have at least some questions before proceeding
        if (questionsData.length === 0) {
          console.error('No questions available for today');
          return;
        }
        setQuestions(questionsData);
        setTimeLimit(FIXED_TIME_LIMIT_MINUTES);
        setTimeLeft(FIXED_TIME_LIMIT_MINUTES * 60);
        startTimeRef.current = Date.now();
      })
      .catch((err) => {
        console.error('Failed to load MCQ:', err);
        router.push('/dashboard/daily-mcq');
      })
      .finally(() => setLoading(false));
  }, [router]);

  // Hydrate flag/bookmark state once questions are loaded
  useEffect(() => {
    if (questions.length === 0) return;
    const ids = questions.map((qu) => qu.id);

    flagService.check('mcq', ids)
      .then((res) => setFlagged(res.data?.flagged || {}))
      .catch(() => {});

    bookmarkService.list('mcq')
      .then((res) => {
        const items: { entityId: string }[] = res.data?.bookmarks || [];
        const map: Record<string, boolean> = {};
        for (const item of items) {
          if (ids.includes(item.entityId)) map[item.entityId] = true;
        }
        setBookmarked(map);
      })
      .catch(() => {});
  }, [questions]);

  const handleToggleFlag = async (question: Question) => {
    const wasFlagged = !!flagged[question.id];
    setFlagged((prev) => ({ ...prev, [question.id]: !wasFlagged }));
    try {
      await flagService.toggle({ questionType: 'mcq', questionId: question.id, questionText: question.questionText });
    } catch {
      setFlagged((prev) => ({ ...prev, [question.id]: wasFlagged }));
    }
  };

  const handleToggleBookmark = async (question: Question) => {
    const wasBookmarked = !!bookmarked[question.id];
    setBookmarked((prev) => ({ ...prev, [question.id]: !wasBookmarked }));
    try {
      const [, difficultyStyle] = getDistinctChipStyles(question.category, [
        `category:${question.category}`,
        `difficulty:${question.difficulty}`,
        `pyq:${question.pyqYear ?? ''}`,
      ]);
      await bookmarkService.toggle({
        entityType: 'mcq',
        entityId: question.id,
        title: question.questionText.slice(0, 140),
        source: 'Daily MCQ Challenge',
        tag: question.category,
        tagColor: difficultyStyle.color,
        content: {
          questionText: question.questionText,
          options: question.options,
          correctOption: question.correctOption,
          difficulty: question.difficulty,
          category: question.category,
          selectedOption: answers[question.id] ?? null,
          status: submitted ? (answers[question.id] === question.correctOption ? 'attempted' : 'gotWrong') : 'new',
        },
      });
    } catch {
      setBookmarked((prev) => ({ ...prev, [question.id]: wasBookmarked }));
    }
  };

  const handleSubmit = useCallback(async () => {
    if (submitting || submitted) return;
    setSubmitting(true);
    setSubmitError(null);
    if (timerRef.current) clearInterval(timerRef.current);

    const rawTimeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
    const timeTaken = Math.min(rawTimeTaken, timeLimit * 60);
    const answerArray = questions.map((q) => ({
      questionId: q.id,
      selectedOption: answers[q.id] || null,
    }));

    try {
      await dailyMcqService.submit(answerArray, timeTaken, isRetake);
      setSubmitted(true);
      router.push('/dashboard/daily-mcq/results');
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('already submitted') || msg.includes('already attempted')) {
        setSubmitError('You have already attempted today\'s MCQ.');
        // Redirect to results after a brief delay
        setTimeout(() => router.push('/dashboard/daily-mcq/results'), 1500);
      } else {
        setSubmitError(msg);
        setSubmitting(false);
      }
    }
  }, [answers, questions, submitted, submitting, timeLimit, router, isRetake]);

  useEffect(() => {
    if (loading || submitted || timeLeft <= 0 || mcqInfo?.attempted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [handleSubmit, loading, submitted, timeLeft, mcqInfo]);

  const handleSelectAnswer = (questionId: string, optionId: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    setSkipped((prev) => {
      if (!prev[questionId]) return prev;
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const navigateToQuestion = (nextIndex: number) => {
    const currentId = questions[currentQuestion]?.id;
    if (currentId && !answers[currentId]) {
      setSkipped((prev) => ({ ...prev, [currentId]: true }));
    }
    setCurrentQuestion(nextIndex);
  };

  // Already attempted screen (skipped when retaking)
  if (!loading && mcqInfo?.attempted && !isRetake) {
    return (
      <div className="flex flex-col min-h-full items-center justify-center" style={{ background: '#FAFBFE' }}>
        <div style={{ maxWidth: '600px', width: '100%', padding: '40px', background: '#FFFFFF', borderRadius: '16px', boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h1 className="font-arimo font-extrabold tracking-tight text-[#17223E] mb-3" style={{ fontSize: '26px' }}>
            You have already attempted today&apos;s MCQ
          </h1>
          <p className="font-arimo font-medium text-[#475467] mb-8" style={{ fontSize: '15px' }}>
            Come back tomorrow for a new challenge, or review your performance below.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => router.push('/dashboard/daily-mcq/review')}
              className="bg-[#00A63E] text-white rounded-lg hover:bg-[#008C35] transition-colors font-arimo font-bold"
              style={{ padding: '12px 28px', fontSize: '15px' }}>
              View Analysis
            </button>
            <button
              onClick={() => router.push('/dashboard/daily-mcq/next-steps')}
              className="bg-[#17223E] text-white rounded-lg hover:bg-[#1E2875] transition-colors font-arimo font-bold"
              style={{ padding: '12px 28px', fontSize: '15px' }}>
              View Smart Next Steps
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-full items-center justify-center" style={{ background: '#FAFBFE' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const q = questions[currentQuestion];
  if (!q) return (
    <div className="flex flex-col min-h-screen items-center justify-center" style={{ background: '#FAFBFE' }}>
      <div className="text-center">
        <h2 className="font-arimo font-extrabold tracking-tight text-[#17223E] mb-2" style={{ fontSize: '20px' }}>No questions available</h2>
        <p className="font-arimo font-medium text-[#475467] mb-4">Please check back later or contact support.</p>
        <button onClick={() => router.push('/dashboard/daily-mcq')} className="text-blue-600 hover:underline font-arimo">Back to Daily MCQ</button>
      </div>
    </div>
  );

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalQuestions = questions.length;
  const answeredCount = questions.filter((qu) => answers[qu.id] && !flagged[qu.id]).length;
  const skippedCount = questions.filter((qu) => skipped[qu.id] && !answers[qu.id] && !flagged[qu.id]).length;
  const markedCount = questions.filter((qu) => flagged[qu.id]).length;
  const bookmarkedCount = questions.filter((qu) => bookmarked[qu.id]).length;
  const unansweredCount = Math.max(0, totalQuestions - answeredCount - skippedCount - markedCount);
  const isLast = currentQuestion === totalQuestions - 1;

  // Reusable navigator + session-stats column (right-hand side)
  const cardStyle: React.CSSProperties = { background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: 16, boxShadow: '0px 1px 2px -1px rgba(0,0,0,0.10), 0px 1px 3px rgba(0,0,0,0.10)', flexShrink: 0 };
  const sectionHeading: React.CSSProperties = { fontWeight: 700, fontSize: 11, letterSpacing: '0.14em', color: '#8892A4', textTransform: 'uppercase' };
  const navigatorCard = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Question Navigator card */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={sectionHeading}>Question Navigator</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF' }}>{questions.length} total</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {questions.map((qu, idx) => {
            const isCurrent = idx === currentQuestion;
            const isAnswered = !!answers[qu.id] && !flagged[qu.id];
            const isSkipped = !!skipped[qu.id] && !answers[qu.id] && !flagged[qu.id];
            const isMarked = !!flagged[qu.id];
            const isBookmarked = !!bookmarked[qu.id];

            let bg = '#F4F6FA';
            let color = '#475067';
            if (isSkipped) { bg = '#FEE2E2'; color = '#9F1239'; }
            if (isBookmarked) { bg = '#FFFBEB'; color = '#D97706'; }
            if (isAnswered) { bg = '#DCFCE7'; color = '#166534'; }
            if (isMarked) { bg = '#FEF3C7'; color = '#92400E'; }
            if (isCurrent) { bg = '#060C1C'; color = '#FFFFFF'; }

            return (
              <button
                key={qu.id}
                onClick={() => navigateToQuestion(idx)}
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
          { label: 'Not Visited', color: '#D1D5DB', background: '#F3F4F6', value: unansweredCount },
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
            {answeredCount} answered · {unansweredCount} not visited · {skippedCount} skipped · {markedCount} marked
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
      <div style={{ maxWidth: 1320, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', flex: isMobile ? 'none' : 1, minHeight: isMobile ? 'auto' : 0 }}>

        {submitError && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 14 }}>⚠️</span>
            <span style={{ fontSize: 14, color: '#991B1B' }}>{submitError}</span>
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
                    <span style={{ fontFamily: 'Arimo, sans-serif', fontSize: 20, fontWeight: 700, lineHeight: '26px', color: '#101828' }}>Daily MCQ Challenge</span>
                    <span style={{ fontFamily: 'Arimo, sans-serif', fontSize: 12.5, color: '#9CA3AF' }}>{formatOrdinalDate(new Date())} · {questions.length} Questions</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 999, padding: '4px 12px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#DC2626' }}>Today&apos;s Challenge is LIVE</span>
                </div>
              </div>
              <div style={{ height: 1, background: '#F1F3F5' }} />

              {/* Tag + timer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 22px 0', flexShrink: 0 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {(() => {
                    const keys = [`category:${q.category}`, `difficulty:${q.difficulty}`, `pyq:${q.pyqYear ?? ''}`];
                    const [categoryStyle, difficultyStyle, pyqStyle] = getDistinctChipStyles(q.category, keys);
                    return (
                      <>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: categoryStyle.bg, border: `1px solid ${categoryStyle.color}33`, borderRadius: 999, padding: '5px 12px' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={categoryStyle.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
                          <span style={{ fontSize: 12, fontWeight: 600, color: categoryStyle.color }}>{q.category}</span>
                        </div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', background: difficultyStyle.bg, border: `1px solid ${difficultyStyle.color}33`, borderRadius: 999, padding: '5px 12px' }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: difficultyStyle.color }}>{q.difficulty}</span>
                        </div>
                        {/* Mark for Review — toggles the marked state (reference .mfr-chip) */}
                        <button
                          type="button"
                          onClick={() => handleToggleFlag(q)}
                          disabled={submitted}
                          title={flagged[q.id] ? 'Marked for review' : 'Mark for review'}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: flagged[q.id] ? '#FEF3C7' : '#FFFFFF',
                            border: `1px solid ${flagged[q.id] ? '#F5C518' : '#E5E7EB'}`,
                            borderRadius: 999, padding: '5px 12px',
                            cursor: submitted ? 'default' : 'pointer',
                            color: flagged[q.id] ? '#7A5400' : '#475067',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => { if (!flagged[q.id] && !submitted) { e.currentTarget.style.background = '#FFF9E8'; e.currentTarget.style.borderColor = '#FCE3A5'; e.currentTarget.style.color = '#8A6306'; } }}
                          onMouseLeave={(e) => { if (!flagged[q.id]) { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#475067'; } }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill={flagged[q.id] ? '#F5C518' : 'none'} stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21V4h13l-2 4 2 4H4" /></svg>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>Mark for Review</span>
                        </button>
                        {q.pyqYear && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', background: pyqStyle.bg, border: `1px solid ${pyqStyle.color}33`, borderRadius: 999, padding: '5px 12px' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: pyqStyle.color }}>PYQ {q.pyqYear}</span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
                {!submitted && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/timer-icon.png" alt="Timer" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontWeight: 800, fontSize: 19, lineHeight: '22px', color: timeLeft < 60 ? '#EF4444' : '#1A1D23' }}>{timeStr}</span>
                      <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF' }}>Time Left</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Content: question (fills) + options (2-col grid) */}
              <div style={{ flex: isMobile ? 'none' : '0 1 auto', minHeight: isMobile ? 'auto' : 0, display: 'flex', flexDirection: 'column', padding: '12px 22px 14px', overflow: isMobile ? 'visible' : 'hidden' }}>
                <div style={{ flex: isMobile ? 'none' : '0 1 auto', minHeight: isMobile ? 'auto' : 0, overflowY: isMobile ? 'visible' : 'auto', whiteSpace: 'pre-line', fontSize: 14, lineHeight: '23px', color: '#1A1D23', paddingRight: 6 }}>
                  <span style={{ fontWeight: 700 }}>Question {currentQuestion + 1}: </span>
                  {normalizeQuestionText(q.questionText)}
                </div>
                <div style={{ flexShrink: 0, marginTop: 12, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                  {q.options.map((option) => {
                    const optKey = option.id || option.label || '';
                    const isSelected = answers[q.id] === optKey;
                    return (
                      <button
                        key={optKey}
                        onClick={() => handleSelectAnswer(q.id, optKey)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderRadius: 12, minHeight: 50,
                          border: isSelected ? '1.5px solid #0B1426' : '1px solid #E5E7EB',
                          background: isSelected ? '#0B1426' : '#FFFFFF',
                          cursor: submitted ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.15s ease', width: '100%',
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
                  onClick={() => navigateToQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 600, color: currentQuestion === 0 ? '#C7CDD6' : '#374151', cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer' }}
                >
                  ← Previous
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    onClick={() => {
                      if (isLast) {
                        // Last question: mark skipped if unanswered, stay in place
                        const currentId = questions[currentQuestion]?.id;
                        if (currentId && !answers[currentId]) {
                          setSkipped((prev) => ({ ...prev, [currentId]: true }));
                        }
                      } else {
                        navigateToQuestion(currentQuestion + 1);
                      }
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}
                  >
                    Skip
                  </button>
                  <button
                    onClick={() => {
                      if (isLast) {
                        setShowSubmitConfirm(true);
                      } else {
                        navigateToQuestion(currentQuestion + 1);
                      }
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0B1426', border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer' }}
                  >
                    {isLast ? 'Finish' : 'Save & Next →'}
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
            <h2 className="font-arimo font-extrabold tracking-tight text-[#17223E]" style={{ fontSize: 22, marginBottom: 8 }}>Submit Quiz?</h2>
            <p className="font-arimo font-medium text-[#475467]" style={{ fontSize: 14, marginBottom: 20 }}>
              Are you sure you want to submit your answers?
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
              <div style={{ background: '#F3F4F6', borderRadius: 12, padding: '14px 8px' }}>
                <div className="font-arimo font-bold" style={{ fontSize: 24, color: '#22C55E' }}>{answeredCount}</div>
                <div className="font-arimo" style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Answered</div>
              </div>
              <div style={{ background: '#F3F4F6', borderRadius: 12, padding: '14px 8px' }}>
                <div className="font-arimo font-bold" style={{ fontSize: 24, color: '#F59E0B' }}>{skippedCount}</div>
                <div className="font-arimo" style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Skipped</div>
              </div>
              <div style={{ background: '#F3F4F6', borderRadius: 12, padding: '14px 8px' }}>
                <div className="font-arimo font-bold" style={{ fontSize: 24, color: '#F59E0B' }}>{bookmarkedCount}</div>
                <div className="font-arimo" style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Bookmarked</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="font-arimo font-bold"
                style={{ flex: 1, height: 48, background: '#F3F4F6', border: 'none', borderRadius: 12, color: '#101828', fontSize: 15, cursor: 'pointer' }}
              >
                Review More
              </button>
              <button
                onClick={() => { setShowSubmitConfirm(false); handleSubmit(); }}
                disabled={submitting}
                className="font-arimo font-bold"
                style={{ flex: 1, height: 48, background: '#101828', border: 'none', borderRadius: 12, color: '#FFFFFF', fontSize: 15, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
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
