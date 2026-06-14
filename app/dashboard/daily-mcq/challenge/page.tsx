'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { dailyMcqService } from '@/lib/services';
import { useIsMobile } from '@/hooks/useIsMobile';

interface Question {
  id: string;
  questionNum: number;
  questionText: string;
  category: string;
  difficulty: string;
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
  const [marked] = useState<Record<string, boolean>>({});
  const [bookmarks] = useState<Record<string, boolean>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Load MCQ info first to check if already attempted
  useEffect(() => {
    dailyMcqService.getToday()
      .then((res) => {
        setMcqInfo(res.data);
        if (res.data?.attempted) {
          return;
        }
        // Not attempted yet — load questions
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
      await dailyMcqService.submit(answerArray, timeTaken);
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
  }, [answers, questions, submitted, submitting, timeLimit, router]);

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

  // Already attempted screen
  if (!loading && mcqInfo?.attempted) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center" style={{ background: '#FAFBFE' }}>
        <div style={{ maxWidth: '600px', width: '100%', padding: '40px', background: '#FFFFFF', borderRadius: '16px', boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h1 className="font-arimo font-bold text-[#101828] mb-3" style={{ fontSize: '24px' }}>
            You have already attempted today&apos;s MCQ
          </h1>
          <p className="font-arimo text-[#4A5565] mb-8" style={{ fontSize: '15px' }}>
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
      <div className="flex flex-col min-h-screen items-center justify-center" style={{ background: '#FAFBFE' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const q = questions[currentQuestion];
  if (!q) return (
    <div className="flex flex-col min-h-screen items-center justify-center" style={{ background: '#FAFBFE' }}>
      <div className="text-center">
        <h2 className="font-arimo font-bold text-[#101828] mb-2" style={{ fontSize: '20px' }}>No questions available</h2>
        <p className="font-arimo text-[#4A5565] mb-4">Please check back later or contact support.</p>
        <button onClick={() => router.push('/dashboard/daily-mcq')} className="text-blue-600 hover:underline font-arimo">Back to Daily MCQ</button>
      </div>
    </div>
  );

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalQuestions = questions.length;
  const answeredCount = questions.filter((qu) => answers[qu.id] && !marked[qu.id]).length;
  const skippedCount = questions.filter((qu) => skipped[qu.id] && !answers[qu.id] && !marked[qu.id]).length;
  const markedCount = questions.filter((qu) => marked[qu.id]).length;
  const bookmarkedCount = questions.filter((qu) => bookmarks[qu.id]).length;
  const unansweredCount = Math.max(0, totalQuestions - answeredCount - skippedCount - markedCount);
  const isLast = currentQuestion === totalQuestions - 1;

  // Reusable navigator card (right-hand box)
  const navigatorCard = (
    <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 14, boxShadow: '0px 1px 2px -1px rgba(0,0,0,0.10), 0px 1px 3px rgba(0,0,0,0.10)', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.6px', color: '#6B7280', textTransform: 'uppercase', marginBottom: 10 }}>
        Question Navigator
      </div>

      {/* Color-coded question buttons */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10, overflow: 'auto', flex: 1, alignContent: 'flex-start' }}>
        {questions.map((qu, idx) => {
          const isCurrent = idx === currentQuestion;
          const isAnswered = !!answers[qu.id] && !marked[qu.id];
          const isSkipped = !!skipped[qu.id] && !answers[qu.id] && !marked[qu.id];
          const isMarked = !!marked[qu.id];
          const isBookmarked = !!bookmarks[qu.id];

          let bg = '#F3F4F6';
          let color = '#6B7280';
          if (isSkipped) { bg = '#DBEAFE'; color = '#2563EB'; }
          if (isBookmarked) { bg = '#FFFBEB'; color = '#D97706'; }
          if (isAnswered) { bg = '#DCFCE7'; color = '#166534'; }
          if (isMarked) { bg = '#FEF3C7'; color = '#92400E'; }
          if (isCurrent) { bg = '#0F172B'; color = '#FFFFFF'; }

          return (
            <button
              key={qu.id}
              onClick={() => navigateToQuestion(idx)}
              style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #E5E7EB', background: bg, color, fontWeight: 700, fontSize: 12, cursor: 'pointer', flexShrink: 0 }}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 8, marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.6px', color: '#6B7280', textTransform: 'uppercase', marginBottom: 9 }}>
          Session Stats
        </div>
        {[
          { label: 'Answered', color: '#22C55E', background: '#DCFCE7', value: answeredCount },
          { label: 'Unanswered', color: '#D1D5DB', background: '#F3F4F6', value: unansweredCount },
          { label: 'Skipped', color: '#2563EB', background: '#DBEAFE', value: skippedCount },
          { label: 'Bookmarked', color: '#F59E0B', background: '#FFFBEB', value: bookmarkedCount },
          { label: 'Marked for review', color: '#F59E0B', background: '#FEF3C7', value: markedCount },
        ].map((row) => (
          <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, background: row.background, border: `1px solid ${row.color}` }} />
              <span style={{ fontSize: 11, color: '#374151' }}>{row.label}</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>{row.value}</span>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 2 }}>Ready to submit</div>
        <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 10 }}>
          {answeredCount} answered · {unansweredCount} unanswered · {skippedCount} skipped
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{ width: '100%', height: 38, background: '#0F172B', border: 'none', borderRadius: 10, color: '#FFFFFF', fontWeight: 700, fontSize: 13, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? 'Submitting...' : '✓ Submit Test'}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ height: isMobile ? 'auto' : '100%', minHeight: isMobile ? '100%' : undefined, background: '#F4F5F8', fontFamily: 'Inter, sans-serif', padding: isMobile ? '10px' : '12px 20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', overflow: isMobile ? 'auto' : 'hidden' }}>
      <div style={{ maxWidth: 1320, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', flex: isMobile ? 'none' : 1, minHeight: isMobile ? 'auto' : 0 }}>

        {submitError && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 14 }}>⚠️</span>
            <span style={{ fontSize: 14, color: '#991B1B' }}>{submitError}</span>
          </div>
        )}

        <div style={{ flex: isMobile ? 'none' : 1, minHeight: isMobile ? 'auto' : 0, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16, alignItems: 'stretch' }}>

          {/* LEFT: question card */}
          <div style={{ flex: 1, minWidth: 0, width: '100%', display: isMobile ? 'block' : 'flex', minHeight: isMobile ? 'auto' : 0 }}>
            <div style={{ flex: isMobile ? 'none' : 1, minHeight: isMobile ? 'auto' : 0, background: '#FFFFFF', borderRadius: 16, border: '1px solid #ECECF1', boxShadow: '0 4px 24px rgba(0,0,0,0.05)', overflow: isMobile ? 'visible' : 'hidden', display: 'flex', flexDirection: 'column' }}>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 22px 11px', flexWrap: 'wrap', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/daily-mcq-icon.png" alt="" style={{ width: 24, height: 24, objectFit: 'contain', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'Arimo, sans-serif', fontSize: 26, fontWeight: 700, lineHeight: '28px', color: '#101828' }}>Daily MCQ Challenge</span>
                  <span style={{ fontFamily: 'Arimo, sans-serif', fontSize: 13, color: '#9CA3AF' }}>· ({formatOrdinalDate(new Date())})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 999, padding: '4px 12px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#DC2626' }}>Today&apos;s Challenge is LIVE</span>
                </div>
              </div>
              <div style={{ height: 1, background: '#F1F3F5' }} />

              {/* Tag + timer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 22px 0', flexShrink: 0 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 999, padding: '5px 12px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1D4ED8' }}>{q.category} • {q.difficulty}</span>
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
              <div style={{ flex: isMobile ? 'none' : 1, minHeight: isMobile ? 'auto' : 0, display: 'flex', flexDirection: 'column', padding: '12px 22px 14px', overflow: isMobile ? 'visible' : 'hidden' }}>
                <div style={{ flex: isMobile ? 'none' : '1 1 auto', minHeight: isMobile ? 'auto' : 0, overflowY: isMobile ? 'visible' : 'auto', whiteSpace: 'pre-line', fontSize: 14, lineHeight: '23px', color: '#1A1D23', paddingRight: 6 }}>
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
                          border: isSelected ? '1.5px solid #2B7FFF' : '1px solid #E5E7EB',
                          background: isSelected ? '#EFF6FF' : '#FFFFFF',
                          cursor: submitted ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.15s ease', width: '100%',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                        }}
                      >
                        <span style={{
                          width: 28, height: 28, borderRadius: '50%',
                          border: isSelected ? '1.5px solid #2B7FFF' : '1.5px solid #D1D5DB',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 13, color: isSelected ? '#2B7FFF' : '#6B7280',
                          background: isSelected ? '#DBEAFE' : 'transparent', flexShrink: 0,
                        }}>{optKey}</span>
                        <span style={{ fontSize: 13.5, color: '#1E293B', fontWeight: isSelected ? 600 : 400 }}>{option.text}</span>
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
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 999, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: currentQuestion === 0 ? '#C7CDD6' : '#374151', cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer' }}
                >
                  ← Previous
                </button>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {questions.map((qu, idx) => {
                    const isCurrent = idx === currentQuestion;
                    const isAnswered = !!answers[qu.id];
                    const isSkipped = !!skipped[qu.id] && !isAnswered;
                    let dotBg = '#F3F4F6';
                    let dotColor = '#6B7280';
                    if (isSkipped) { dotBg = '#DBEAFE'; dotColor = '#2563EB'; }
                    if (isAnswered) { dotBg = '#DCFCE7'; dotColor = '#166534'; }
                    if (isCurrent) { dotBg = '#16A34A'; dotColor = '#FFFFFF'; }
                    return (
                      <button key={qu.id} onClick={() => navigateToQuestion(idx)} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: dotBg, color: dotColor, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>{idx + 1}</button>
                    );
                  })}
                </div>

                <button
                  onClick={() => !isLast && navigateToQuestion(currentQuestion + 1)}
                  disabled={isLast}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: isLast ? '#9CA3AF' : '#1A1D23', border: 'none', borderRadius: 999, padding: '9px 20px', fontSize: 13, fontWeight: 700, color: '#FFFFFF', cursor: isLast ? 'not-allowed' : 'pointer' }}
                >
                  Next →
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: navigator box */}
          <aside style={{ width: isMobile ? '100%' : 300, flexShrink: 0, display: isMobile ? 'block' : 'flex', minHeight: isMobile ? 'auto' : 0 }}>
            {navigatorCard}
          </aside>
        </div>
      </div>
    </div>
  );
}
