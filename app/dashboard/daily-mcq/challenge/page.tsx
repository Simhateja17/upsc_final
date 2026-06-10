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

export default function DailyMcqChallengePage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [navOpen, setNavOpen] = useState(false);
  const [mcqInfo, setMcqInfo] = useState<TodayMCQInfo | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [timeLimit, setTimeLimit] = useState(FIXED_TIME_LIMIT_MINUTES);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [marked, setMarked] = useState<Record<string, boolean>>({});
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
    // Selecting an answer clears any "marked for review" flag, mirroring the prelims flow.
    setMarked((prev) => {
      if (!prev[questionId]) return prev;
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
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
  const markedCount = questions.filter((qu) => marked[qu.id]).length;
  const unansweredCount = Math.max(0, totalQuestions - answeredCount - markedCount);
  const isLast = currentQuestion === totalQuestions - 1;
  const title = mcqInfo?.title || 'Daily MCQ Challenge';

  const handleMark = () => {
    setMarked((prev) => ({ ...prev, [q.id]: true }));
    if (!isLast) setCurrentQuestion((prev) => prev + 1);
  };

  const handleClear = () => {
    setAnswers((prev) => { const n = { ...prev }; delete n[q.id]; return n; });
    setMarked((prev) => { const n = { ...prev }; delete n[q.id]; return n; });
  };

  // Reusable navigator card (shown inline on desktop, in a bottom-sheet drawer on mobile)
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
          const isMarked = !!marked[qu.id];

          let bg = '#F3F4F6';
          let color = '#6B7280';
          if (isAnswered) { bg = '#DCFCE7'; color = '#166534'; }
          if (isMarked) { bg = '#FEF3C7'; color = '#92400E'; }
          if (isCurrent) { bg = '#0F172B'; color = '#FFFFFF'; }

          return (
            <button
              key={qu.id}
              onClick={() => { setCurrentQuestion(idx); setNavOpen(false); }}
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
          { label: 'Answered', color: '#00C950', value: answeredCount },
          { label: 'Unanswered', color: '#D1D5DB', value: unansweredCount },
          { label: 'Marked for review', color: '#F59E0B', value: markedCount },
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
          {submitting ? 'Submitting...' : '✓ Submit Test'}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ height: isMobile ? 'auto' : '100%', minHeight: isMobile ? '100%' : 0, background: '#E8EDF5', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif', overflow: isMobile ? 'visible' : 'hidden' }}>

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
                Daily MCQ Challenge · {totalQuestions} Questions · {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
          {/* Timer — white text on dark bg */}
          {!submitted && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/timer-icon.png" alt="Timer" style={{ width: 32, height: 32, objectFit: 'contain' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 20, lineHeight: '24px', color: timeLeft < 60 ? '#FB2C36' : '#FFFFFF' }}>
                  {timeStr}
                </span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>
                  TIME LEFT
                </span>
              </div>
            </div>
          )}
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
                width: `${Math.round((answeredCount / Math.max(1, totalQuestions)) * 100)}%`,
                height: '100%',
                background: '#00C950',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <div style={{ fontWeight: 600, fontSize: 12, lineHeight: '16px', color: '#364153', whiteSpace: 'nowrap' }}>
            Q {currentQuestion + 1} / {totalQuestions} · {answeredCount} Answered
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
      {submitError && (
        <div style={{
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          padding: '12px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '14px' }}>⚠️</span>
          <span style={{ fontSize: '14px', color: '#991B1B' }}>{submitError}</span>
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
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, height: isMobile ? 'auto' : '100%', overflow: isMobile ? 'visible' : 'hidden' }}>

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
              {/* Category pill + difficulty pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexShrink: 0 }}>
                <div className="flex items-center gap-2 bg-[#EFF6FF] px-4 rounded-full h-[34px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/tag-one.png" alt="Tag" className="w-4 h-4" />
                  <span className="font-arimo font-bold text-[#155DFC] text-[14px] leading-[16px]">{q.category}</span>
                </div>
                <div className="flex items-center gap-2 bg-[#FFF7ED] px-4 rounded-full h-[34px]">
                  <span className="font-arimo font-bold text-[#C2410C] text-[14px] leading-[16px]">{q.difficulty}</span>
                </div>
              </div>

              {/* Question text */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 14, flexShrink: 0 }}>
                <div className="font-arimo font-bold text-[#101828]" style={{ whiteSpace: 'pre-line', flex: 1, fontSize: 13, lineHeight: '20px' }}>
                  <span style={{ fontWeight: 700 }}>Question {currentQuestion + 1} of {totalQuestions}:</span>{' '}
                  <span>{normalizeQuestionText(q.questionText)}</span>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2" style={{ overflow: isMobile ? 'visible' : 'auto', flex: isMobile ? 'none' : 1, minHeight: 0 }}>
                {q.options.map((option) => {
                  const optKey = option.id || option.label || '';
                  const isSelected = answers[q.id] === optKey;

                  let bg = '#FFFFFF';
                  let border = '2px solid #E2E8F0';
                  let circleColor = '#CBD5E1';
                  let circleBg = 'transparent';
                  let circleText = '#64748B';
                  const circleIcon: string = optKey;
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
                      key={optKey}
                      onClick={() => handleSelectAnswer(q.id, optKey)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '10px 18px',
                        borderRadius: '12px',
                        minHeight: 58,
                        border,
                        background: bg,
                        cursor: submitted ? 'default' : 'pointer',
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
                        {option.text}
                      </span>
                    </button>
                  );
                })}
              </div>
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
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#FB2C36', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', lineHeight: '20px' }}
                >
                  Mark
                </button>
                <button
                  onClick={handleClear}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6A7282', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', lineHeight: '20px', padding: 0 }}
                >
                  Clear
                </button>
                <button
                  onClick={() => !isLast && setCurrentQuestion((prev) => prev + 1)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#155DFC', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', lineHeight: '20px' }}
                >
                  Skip
                </button>
              </div>

              {/* Right nav */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => setCurrentQuestion((prev) => prev - 1)}
                  disabled={currentQuestion === 0}
                  style={{ background: 'none', border: '1.5px solid #CBD5E1', borderRadius: '8px', padding: '5px 13px', color: currentQuestion === 0 ? '#CBD5E1' : '#334155', cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '13px' }}
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setCurrentQuestion((prev) => prev + 1)}
                  disabled={isLast}
                  style={{ background: isLast ? '#1E293B' : '#2B7FFF', border: 'none', borderRadius: '8px', padding: '5px 18px', color: '#FFFFFF', cursor: isLast ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '13px' }}
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
            style={{ width: '100%', maxHeight: '80vh', background: '#FFFFFF', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 14, boxShadow: '0 -8px 24px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', animation: 'mcqSheetUp 0.25s ease' }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <div style={{ width: 40, height: 4, borderRadius: 999, background: '#D1D5DB' }} />
            </div>
            {navigatorCard}
          </div>
          <style jsx>{`
            @keyframes mcqSheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
          `}</style>
        </div>
      )}
    </div>
  );
}
