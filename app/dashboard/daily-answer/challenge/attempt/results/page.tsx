'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { dailyAnswerService } from '@/lib/services';

interface ParameterScore {
  parameter: string;
  score: number;
  maxScore: number;
  comment?: string;
}

interface ResultsData {
  score: number;
  maxScore: number;
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  detailedFeedback?: string;
  checkedCopyUrl?: string | null;
  checkedCopyPages?: Array<{ pageNumber: number; checkedCopyUrl?: string | null; status?: string; reason?: string }>;
  checkedCopyStatus?: string | null;
  annotationPlan?: unknown;
  wordCount?: number | null;
  submittedAt?: string | null;
  keyTerms?: Array<{ term: string; found: boolean }>;
  nextAttemptFocus?: string | null;
  evaluatorConclusion?: string | null;
  modelAnswerUrl?: string | null;
  modelAnswerKeyPoints?: string[];
  modelAnswerContent?: string;
  parameterScores?: ParameterScore[];
  question?: {
    title: string;
    subject: string;
    paper: string;
    date: string;
    marks: number;
    wordLimit: number;
    timeLimit: number;
  };
}

type SlideKey = 'feedback' | 'markup' | 'rubric' | 'next';

const BETA_DISCLAIMER =
  'Jeet AI Mentor is currently in beta and evolving every day alongside you. Our evaluation engine is built to deliver meaningful, structured, and exam-relevant feedback, but it can still make mistakes. Use it as a smart companion alongside your mentors, notes, and judgment.';

function ResultsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');
  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [slide, setSlide] = useState<SlideKey>('feedback');
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [modelAnswerOpen, setModelAnswerOpen] = useState(false);

  useEffect(() => {
    if (dateParam) return;
    if (typeof window !== 'undefined') {
      const storedAttemptId = sessionStorage.getItem('dailyAnswerAttemptId');
      if (storedAttemptId) setAttemptId(storedAttemptId);
    }
  }, [dateParam]);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    dailyAnswerService.getResults(dateParam ? undefined : attemptId || undefined, dateParam || undefined)
      .then((res) => {
        if (cancelled) return;
        setData(res.data);
        if (!dateParam && typeof window !== 'undefined') {
          sessionStorage.removeItem('dailyAnswerAttemptId');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Could not load results');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [attemptId, dateParam]);

  const slides: Array<{ key: SlideKey; label: string }> = [
    { key: 'feedback', label: 'Feedback' },
    { key: 'markup', label: "Examiner's Markup" },
    { key: 'rubric', label: 'Score Breakdown' },
    { key: 'next', label: "What's Next" },
  ];

  const score = data?.score ?? 0;
  const maxScore = data?.maxScore ?? 0;
  const scorePercent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const strengths = data?.strengths ?? [];
  const improvements = data?.improvements ?? [];
  const suggestions = data?.suggestions ?? [];
  const detailedFeedback = data?.detailedFeedback?.trim() ?? '';
  const detailedFeedbackParagraphs = useMemo(
    () => detailedFeedback.split(/\n+/).map((item) => item.trim()).filter(Boolean),
    [detailedFeedback]
  );
  const checkedCopyPages = (data?.checkedCopyPages || []).filter((page) => page.checkedCopyUrl);
  const checkedCopyReady = checkedCopyPages.length > 0 || Boolean(data?.checkedCopyUrl);
  const displayCheckedCopyPages = checkedCopyPages.length > 0
    ? checkedCopyPages
    : data?.checkedCopyUrl
      ? [{ pageNumber: 1, checkedCopyUrl: data.checkedCopyUrl }]
      : [];
  const markupLabel = checkedCopyReady ? 'Teacher-style checked copy is ready.' : 'Visual markup is generated for handwritten image uploads.';

  const summaryCards = [
    {
      id: 'score',
      label: 'Overall Score',
      value: maxScore > 0 ? `${score}/${maxScore}` : `${score}`,
      hint: `${scorePercent}% examiner alignment`,
      bg: '#FEF3C7',
      borderColor: '#FCD34D',
      valueColor: '#92400E',
    },
    {
      id: 'strengths',
      label: 'Strong Points',
      value: `${strengths.length}`,
      hint: 'Well-handled answer elements',
      bg: '#DCFCE7',
      borderColor: '#86EFAC',
      valueColor: '#166534',
    },
    {
      id: 'improvements',
      label: 'Needs Work',
      value: `${improvements.length}`,
      hint: 'Priority fix areas',
      bg: '#FEF3C7',
      borderColor: '#FDE68A',
      valueColor: '#A16207',
    },
    {
      id: 'words',
      label: 'Word Count',
      value: `${data?.wordCount ?? 0}`,
      hint: 'Captured from your submission',
      bg: '#DBEAFE',
      borderColor: '#93C5FD',
      valueColor: '#1D4ED8',
    },
  ];

  const rubricCards = [
    {
      label: 'Score Conversion',
      value: `${scorePercent}%`,
      text: 'Converted from the examiner score returned by the evaluation engine.',
    },
    {
      label: 'Strength Signals',
      value: `${strengths.length}`,
      text: 'Distinct strengths identified in the answer review.',
    },
    {
      label: 'Improvement Signals',
      value: `${improvements.length}`,
      text: 'Areas flagged for sharper structure, content, or substantiation.',
    },
    {
      label: 'Value-Add Ideas',
      value: `${suggestions.length}`,
      text: 'Specific improvement suggestions you can apply in the next rewrite.',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen font-arimo flex items-center justify-center" style={{ background: '#FAFBFE' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="min-h-screen font-arimo flex items-center justify-center"
        style={{ background: '#FAFBFE' }}
      >
        <div className="text-center px-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Could not load results</h2>
          <p className="text-gray-500 mb-4">{error || 'Please try again in a moment.'}</p>
          <Link href="/dashboard/daily-answer" className="text-blue-600 hover:underline">
            Back to Daily Answer
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen font-arimo" style={{ background: '#FAFBFE' }}>
      <div className="flex flex-col items-center py-10 px-6 gap-6">
        {data.question && (
          <p className="text-[#4A5565]" style={{ width: '100%', maxWidth: '988px', fontSize: '13px', fontWeight: 500 }}>
            Result · {new Date(`${data.question.date}T00:00:00.000Z`).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })} · {data.question.paper} · {data.question.subject}
          </p>
        )}
        <div
          className="flex flex-col items-center justify-center px-6"
          style={{
            width: '100%', maxWidth: '988px',
            minHeight: '168px',
            borderRadius: '14px',
            background: 'linear-gradient(90deg, #101828 0%, #17223E 100%)',
          }}
        >
          <p
            style={{
              fontWeight: 700,
              fontSize: '14px',
              lineHeight: '20px',
              letterSpacing: '0.35px',
              textTransform: 'uppercase',
              color: '#D1D5DC',
              marginBottom: '4px',
            }}
          >
            Score
          </p>
          <div className="flex items-baseline gap-1">
            <span style={{ fontWeight: 700, fontSize: '82px', lineHeight: '72px', color: '#FDC700' }}>{score}</span>
            <span style={{ fontWeight: 700, fontSize: '35px', lineHeight: '48px', color: '#FDC70087' }}>
              /{maxScore}
            </span>
          </div>
          <p className="mt-3 text-[#D1D5DC]" style={{ fontSize: '14px' }}>
            Examiner score based on structure, depth, relevance, and substantiation.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap" style={{ width: '100%', maxWidth: '988px' }}>
          {slides.map((item) => (
            <button
              key={item.key}
              onClick={() => setSlide(item.key)}
              className={`px-4 py-2 rounded-[8px] text-sm font-semibold transition-colors ${
                slide === item.key
                  ? 'bg-[#17223E] text-white'
                  : 'bg-white text-[#4A5565] border border-[#E5E7EB] hover:bg-gray-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {slide === 'feedback' && (
          <div style={{ width: '100%', maxWidth: '988px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Summary metric cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {summaryCards.map((metric) => (
                <div
                  key={metric.id}
                  className="flex flex-col items-center justify-center rounded-[10px] p-4"
                  style={{ background: metric.bg, border: `1px solid ${metric.borderColor}` }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#6A7282', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    {metric.label}
                  </span>
                  <span style={{ fontSize: '22px', fontWeight: 700, color: metric.valueColor }}>{metric.value}</span>
                  <span className="text-center mt-2" style={{ fontSize: '12px', color: '#4A5565', lineHeight: '18px' }}>
                    {metric.hint}
                  </span>
                </div>
              ))}
            </div>

            {/* Personalised Feedback card — new design */}
            <div style={{ background: '#FFFFFF', borderRadius: '14px', boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A', padding: '28px 28px 24px' }}>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ fontSize: '20px' }}>🎯</span>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#101828' }}>Personalised Feedback</h2>
              </div>
              <p style={{ fontSize: '13px', color: '#6A7282', marginBottom: '24px' }}>Actionable insights to help you improve, not just a score</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {/* What You Did Well */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>✅</span>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#101828' }}>What You Did Well</h3>
                  </div>
                  <div className="flex flex-col gap-2">
                    {strengths.length > 0 ? strengths.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-[8px] px-3 py-2.5" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                        <span style={{ color: '#16A34A', fontSize: '13px', flexShrink: 0, marginTop: '1px' }}>→</span>
                        <span style={{ fontSize: '13px', color: '#166534', lineHeight: '20px' }}>{item}</span>
                      </div>
                    )) : (
                      <div className="rounded-[8px] px-3 py-2.5" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                        <span style={{ fontSize: '13px', color: '#166534' }}>The evaluator did not return structured strengths yet.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Areas to Improve */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>⚠️</span>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#92400E' }}>Areas to Improve</h3>
                  </div>
                  <div className="flex flex-col gap-2">
                    {improvements.length > 0 ? improvements.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-[8px] px-3 py-2.5" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                        <span style={{ color: '#D97706', fontSize: '13px', flexShrink: 0, marginTop: '1px' }}>▲</span>
                        <span style={{ fontSize: '13px', color: '#92400E', lineHeight: '20px' }}>{item}</span>
                      </div>
                    )) : (
                      <div className="rounded-[8px] px-3 py-2.5" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                        <span style={{ fontSize: '13px', color: '#92400E' }}>No improvement bullets returned by the evaluator.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Value-Add Ideas */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>💡</span>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1D4ED8' }}>Value-Add Ideas</h3>
                  </div>
                  <div className="flex flex-col gap-2">
                    {suggestions.length > 0 ? suggestions.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-[8px] px-3 py-2.5" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                        <span style={{ color: '#2563EB', fontSize: '13px', flexShrink: 0, marginTop: '1px' }}>◆</span>
                        <span style={{ fontSize: '13px', color: '#1E40AF', lineHeight: '20px' }}>{item}</span>
                      </div>
                    )) : (
                      <div className="rounded-[8px] px-3 py-2.5" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                        <span style={{ fontSize: '13px', color: '#1E40AF' }}>No extra suggestions returned for this answer yet.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Key Terms Analysis */}
            {(data.keyTerms && data.keyTerms.length > 0) && (
              <div style={{ background: '#FFFFFF', borderRadius: '14px', boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A', padding: '24px 28px' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ fontSize: '18px' }}>🔑</span>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#101828' }}>Key Terms Analysis</h2>
                </div>
                <p style={{ fontSize: '13px', color: '#6A7282', marginBottom: '16px' }}>
                  Terms an examiner would expect to see in a {data.question?.marks ?? 15}-mark answer
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {data.keyTerms.map((kt, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        background: kt.found ? '#F0FDF4' : '#FEF2F2',
                        border: `1px solid ${kt.found ? '#BBF7D0' : '#FECACA'}`,
                        color: kt.found ? '#166534' : '#B91C1C',
                      }}
                    >
                      <span>{kt.found ? '✓' : '✗'}</span>
                      {kt.term}
                    </span>
                  ))}
                </div>
                <p style={{ fontSize: '13px', color: '#B91C1C' }}>
                  <strong>✗ Missed</strong> <span style={{ color: '#6A7282' }}>terms should appear in your next attempt.</span>
                </p>
              </div>
            )}

            {/* Next Attempt Focus */}
            {data.nextAttemptFocus && (
              <div style={{ background: '#EEF2FF', borderRadius: '14px', padding: '20px 24px', border: '1px solid #C7D2FE' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4338CA', marginBottom: '10px' }}>
                  🎯 Next Attempt Focus
                </p>
                <p style={{ fontSize: '14px', color: '#3730A3', lineHeight: '22px' }}>{data.nextAttemptFocus}</p>
              </div>
            )}

            {/* Evaluator's Conclusion */}
            {data.evaluatorConclusion && (
              <div style={{ background: '#F0FDF4', borderRadius: '14px', padding: '20px 24px', border: '1px solid #BBF7D0' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#166534', marginBottom: '10px' }}>
                  ✅ Evaluator&apos;s Conclusion
                </p>
                <p style={{ fontSize: '14px', color: '#14532D', lineHeight: '22px' }}>{data.evaluatorConclusion}</p>
              </div>
            )}

            {/* Model Answer CTA */}
            <div style={{ background: 'linear-gradient(90deg, #101828 0%, #17223E 100%)', borderRadius: '14px', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#FDC700', marginBottom: '6px' }}>
                  📋 Model Answer Available
                </p>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>See how an ideal answer looks</p>
                <p style={{ fontSize: '13px', color: '#9CA3AF' }}>Compare your answer with an expert-crafted model answer written by our UPSC faculty.</p>
              </div>
              <button
                onClick={() => setModelAnswerOpen(true)}
                style={{ flexShrink: 0, background: '#FDC700', color: '#101828', fontWeight: 700, fontSize: '14px', padding: '10px 20px', borderRadius: '10px', whiteSpace: 'nowrap', border: 'none', cursor: 'pointer' }}
              >
                View Now →
              </button>
            </div>

            {/* Bottom action bar */}
            <div style={{ background: '#FFFFFF', borderRadius: '14px', boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <button
                onClick={() => router.push('/dashboard/daily-answer')}
                className="flex items-center gap-2 text-[#4A5565] hover:text-[#101828] transition-colors"
                style={{ fontSize: '14px', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ← 🏠 Back to Dashboard
              </button>
              <div className="flex items-center gap-2 flex-wrap">
                <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FFFFFF', fontSize: '13px', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                  🔗 Share
                </button>
                <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FFFFFF', fontSize: '13px', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                  📥 Download PDF
                </button>
                {data.checkedCopyUrl && (
                  <a
                    href={data.checkedCopyUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FFFFFF', fontSize: '13px', fontWeight: 600, color: '#374151', textDecoration: 'none' }}
                  >
                    📋 Download Copy
                  </a>
                )}
                <button
                  onClick={() => router.push('/dashboard/daily-answer/challenge')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', background: '#17223E', fontSize: '13px', fontWeight: 700, color: '#FFFFFF', border: 'none', cursor: 'pointer' }}
                >
                  ✏️ Rewrite Answer
                </button>
              </div>
            </div>
          </div>
        )}

        {slide === 'markup' && (
          <div
            style={{
              width: '100%', maxWidth: '988px',
              borderRadius: '14px',
              background: '#FFFFFF',
              boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A',
              padding: '32px',
            }}
          >
            <h2 className="font-bold text-[#101828] mb-2" style={{ fontSize: '22px' }}>
              {checkedCopyReady ? 'Checked Copy' : "Examiner's Markup"}
            </h2>
            <p className="text-[#4A5565] mb-6" style={{ fontSize: '14px' }}>
              {markupLabel}
            </p>

            {checkedCopyReady ? (
              <div className="space-y-4">
                {displayCheckedCopyPages.map((page) => (
                  <div key={page.pageNumber} className="rounded-[12px] border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-[#FEE2E2] px-3 py-1 text-[12px] font-bold text-[#B91C1C]">BETA</span>
                        <span className="text-[13px] font-bold text-[#364153]">Page {page.pageNumber}</span>
                      </div>
                      <a href={page.checkedCopyUrl || '#'} target="_blank" rel="noreferrer" className="text-[13px] font-bold text-[#2563EB]">
                        Open full size
                      </a>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={page.checkedCopyUrl || ''}
                      alt={`Checked copy page ${page.pageNumber} with examiner markup`}
                      className="w-full rounded-[10px]"
                      style={{ border: '1px solid #E5E7EB', background: '#FFFFFF' }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-[12px] border border-[#BBF7D0] bg-[#F0FDF4] p-5">
                  <h3 className="font-bold text-[#166534] mb-3" style={{ fontSize: '15px' }}>Positive examiner notes</h3>
                  {strengths.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {strengths.map((item, index) => (
                        <span
                          key={`${item}-${index}`}
                          className="rounded-full px-3 py-2"
                          style={{ background: '#DCFCE7', color: '#166534', fontSize: '13px', lineHeight: '18px' }}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[#166534]" style={{ fontSize: '13px', lineHeight: '20px' }}>
                      Positive markup will appear here when the evaluator returns line-level comments.
                    </p>
                  )}
                </div>

                <div className="rounded-[12px] border border-[#FDE68A] bg-[#FEFCE8] p-5">
                  <h3 className="font-bold text-[#A16207] mb-3" style={{ fontSize: '15px' }}>Attention areas</h3>
                  {improvements.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {improvements.map((item, index) => (
                        <span
                          key={`${item}-${index}`}
                          className="rounded-full px-3 py-2"
                          style={{ background: '#FEF3C7', color: '#A16207', fontSize: '13px', lineHeight: '18px' }}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[#A16207]" style={{ fontSize: '13px', lineHeight: '20px' }}>
                      Improvement markup will appear here when the evaluator returns line-level comments.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 rounded-[12px] border border-[#E5E7EB] bg-[#F9FAFB] p-6">
              <h3 className="font-bold text-[#101828] mb-3" style={{ fontSize: '16px' }}>Detailed examiner commentary</h3>
              {detailedFeedbackParagraphs.length > 0 ? (
                <div className="space-y-3">
                  {detailedFeedbackParagraphs.map((paragraph, index) => (
                    <p key={index} className="text-[#374151]" style={{ fontSize: '14px', lineHeight: '24px' }}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-[#4A5565]" style={{ fontSize: '14px', lineHeight: '24px' }}>
                  Detailed commentary was not returned by the evaluation engine for this submission.
                </p>
              )}
            </div>
          </div>
        )}

        {slide === 'rubric' && (
          <div
            style={{
              width: '100%', maxWidth: '988px',
              borderRadius: '14px',
              background: '#FFFFFF',
              boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A',
              padding: '32px',
            }}
          >
            <div className="flex items-center gap-2 mb-6">
              <span style={{ fontSize: '22px' }}>⭐</span>
              <h2 className="font-bold text-[#101828]" style={{ fontSize: '22px' }}>
                7-Parameter Score Breakdown
              </h2>
            </div>

            {data.parameterScores && data.parameterScores.length > 0 ? (
              <div className="flex flex-col gap-5">
                {data.parameterScores.map((param, idx) => {
                  const pct = param.maxScore > 0 ? Math.round((param.score / param.maxScore) * 100) : 0;
                  const PARAM_COLORS = [
                    { dot: '#2563EB', bar: '#2563EB', score: '#EA580C', pctBg: '#DBEAFE', pctText: '#1D4ED8' },
                    { dot: '#7C3AED', bar: '#7C3AED', score: '#EA580C', pctBg: '#EDE9FE', pctText: '#5B21B6' },
                    { dot: '#4338CA', bar: '#4338CA', score: '#EA580C', pctBg: '#E0E7FF', pctText: '#3730A3' },
                    { dot: '#16A34A', bar: '#16A34A', score: '#EA580C', pctBg: '#DCFCE7', pctText: '#15803D' },
                    { dot: '#D97706', bar: '#D97706', score: '#EA580C', pctBg: '#FEF3C7', pctText: '#B45309' },
                    { dot: '#DC2626', bar: '#DC2626', score: '#EA580C', pctBg: '#FEE2E2', pctText: '#B91C1C' },
                    { dot: '#0D9488', bar: '#0D9488', score: '#EA580C', pctBg: '#CCFBF1', pctText: '#0F766E' },
                  ];
                  const c = PARAM_COLORS[idx % PARAM_COLORS.length];
                  return (
                    <div key={param.parameter}>
                      {/* Header row */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: c.dot, flexShrink: 0, display: 'inline-block' }} />
                          <span style={{ fontSize: '15px', fontWeight: 700, color: '#101828' }}>{param.parameter}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: '15px', fontWeight: 700, color: c.score }}>{param.score}/{param.maxScore}</span>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: c.pctText, background: c.pctBg, borderRadius: '6px', padding: '2px 8px' }}>{pct}%</span>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div style={{ width: '100%', height: '8px', borderRadius: '99px', background: '#E5E7EB', overflow: 'hidden', marginBottom: '8px' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: c.bar, borderRadius: '99px', transition: 'width 0.6s ease' }} />
                      </div>
                      {/* Comment */}
                      {param.comment && (
                        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px 14px' }}>
                          <p style={{ fontSize: '13px', color: '#374151', lineHeight: '20px' }}>{param.comment}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {[
                  { label: 'Demand Fulfilment', dot: '#2563EB' },
                  { label: 'Conceptual Clarity', dot: '#7C3AED' },
                  { label: 'Analysis & Depth', dot: '#4338CA' },
                  { label: 'Knowledge Enrichment', dot: '#16A34A' },
                  { label: 'Structure & Flow', dot: '#D97706' },
                  { label: 'Value Addition', dot: '#DC2626' },
                  { label: 'Presentation', dot: '#0D9488' },
                ].map((p) => (
                  <div key={p.label}>
                    {/* Label row */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: p.dot, flexShrink: 0, display: 'inline-block' }} />
                        <span style={{ fontSize: '15px', fontWeight: 700, color: '#101828' }}>{p.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span style={{ width: '44px', height: '16px', borderRadius: '4px', background: '#D1D5DB', display: 'inline-block' }} />
                        <span style={{ width: '34px', height: '22px', borderRadius: '6px', background: '#D1D5DB', display: 'inline-block' }} />
                      </div>
                    </div>
                    {/* Progress bar placeholder */}
                    <div style={{ width: '100%', height: '8px', borderRadius: '99px', background: '#E5E7EB', marginBottom: '10px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '68%', borderRadius: '99px', background: '#D1D5DB' }} />
                    </div>
                    {/* Comment placeholder */}
                    <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px 14px' }}>
                      <div style={{ height: '12px', borderRadius: '4px', background: '#D1D5DB', width: '68%' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {slide === 'next' && (
          <div style={{ width: '100%', maxWidth: '988px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header */}
            <div className="text-center">
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6A7282', marginBottom: '6px' }}>
                🎯 SMART NEXT STEPS
              </p>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#101828' }}>
                Personalised recommendations based on your evaluation
              </h2>
            </div>

            {/* 2x2 action cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Rewrite with Feedback */}
              <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="flex items-start justify-between">
                  <span style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>✏️</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', background: '#4338CA', borderRadius: '99px', padding: '3px 10px' }}>Recommended</span>
                </div>
                <div>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: '#101828', marginBottom: '4px' }}>Rewrite with Feedback</p>
                  <p style={{ fontSize: '13px', color: '#4A5565', lineHeight: '20px' }}>Attempt this question again incorporating today&apos;s feedback to see your improvement.</p>
                </div>
                <button
                  onClick={() => router.push('/dashboard/daily-answer/challenge')}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', background: '#17223E', color: '#FFFFFF', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  Start Rewrite →
                </button>
              </div>

              {/* View Model Answer */}
              <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="flex items-start justify-between">
                  <span style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>📖</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#166534', background: '#DCFCE7', borderRadius: '99px', padding: '3px 10px' }}>Popular</span>
                </div>
                <div>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: '#101828', marginBottom: '4px' }}>View Model Answer</p>
                  <p style={{ fontSize: '13px', color: '#4A5565', lineHeight: '20px' }}>Study the expert-crafted model answer to understand the ideal structure and content.</p>
                </div>
                <button
                  onClick={() => setModelAnswerOpen(true)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', background: '#16A34A', color: '#FFFFFF', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  View Model Answer →
                </button>
              </div>

              {/* Save to Notes */}
              <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="flex items-start justify-between">
                  <span style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>📝</span>
                </div>
                <div>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: '#101828', marginBottom: '4px' }}>Save to Notes</p>
                  <p style={{ fontSize: '13px', color: '#4A5565', lineHeight: '20px' }}>Save this feedback summary to your personal notes for quick revision before exam.</p>
                </div>
                <button
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', background: '#FFFBEB', color: '#B45309', fontSize: '14px', fontWeight: 700, border: '1px solid #FDE68A', cursor: 'pointer' }}
                >
                  Save to Notes →
                </button>
              </div>

              {/* Practice Another Question */}
              <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="flex items-start justify-between">
                  <span style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>🎯</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#5B21B6', background: '#EDE9FE', borderRadius: '99px', padding: '3px 10px' }}>5 available</span>
                </div>
                <div>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: '#101828', marginBottom: '4px' }}>Practice Another Question</p>
                  <p style={{ fontSize: '13px', color: '#4A5565', lineHeight: '20px' }}>Jump to the next question from the practice bank to keep your momentum going.</p>
                </div>
                <button
                  onClick={() => router.push('/dashboard/daily-answer')}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', background: '#7C3AED', color: '#FFFFFF', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  Browse Questions →
                </button>
              </div>
            </div>

            {/* Other Actions */}
            <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E5E7EB', padding: '20px 24px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6A7282', marginBottom: '12px' }}>
                OTHER ACTIONS
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => router.push('/dashboard/daily-answer')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '99px', border: '1px solid #E5E7EB', background: '#FFFFFF', fontSize: '13px', fontWeight: 600, color: '#374151', cursor: 'pointer' }}
                >
                  🏠 Back to Dashboard
                </button>
                {(data.checkedCopyUrl || checkedCopyPages.length > 0) && (
                  <a
                    href={checkedCopyPages[0]?.checkedCopyUrl || data.checkedCopyUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '99px', border: '1px solid #BBF7D0', background: '#F0FDF4', fontSize: '13px', fontWeight: 600, color: '#166534', textDecoration: 'none' }}
                  >
                    📥 Download Evaluated Copy
                  </a>
                )}
                <button
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '99px', border: '1px solid #FDE68A', background: '#FFFBEB', fontSize: '13px', fontWeight: 600, color: '#B45309', cursor: 'pointer' }}
                >
                  🔗 Share Result
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Disclaimer collapsible */}
        <div style={{ width: '100%', maxWidth: '988px' }}>
          <button
            onClick={() => setDisclaimerOpen((o) => !o)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 16px',
              borderRadius: disclaimerOpen ? '10px 10px 0 0' : '10px',
              background: '#F3F4F6',
              border: 'none',
              cursor: 'pointer',
              color: '#4A5565',
              fontSize: '13px',
              fontFamily: 'Arimo',
              fontWeight: 500,
            }}
          >
            {/* info circle icon */}
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="9" stroke="#6A7282" strokeWidth="1.8" />
              <path d="M10 9v5" stroke="#6A7282" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="10" cy="6.5" r="0.9" fill="#6A7282" />
            </svg>
            AI Disclaimer
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ transform: disclaimerOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
            >
              <path d="M2 4l4 4 4-4" stroke="#6A7282" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {disclaimerOpen && (
            <div
              style={{
                borderRadius: '0 0 10px 10px',
                background: '#FEFCE8',
                borderLeft: '4px solid #FDC700',
                padding: '14px 20px',
              }}
            >
              <p style={{ fontSize: '12px', lineHeight: '18px', color: '#713F12' }}>
                <strong>Note:</strong> {BETA_DISCLAIMER}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
    {/* Model Answer Modal */}
    {modelAnswerOpen && (
      <div
        onClick={() => setModelAnswerOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '640px',
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Modal header */}
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
            <div className="flex items-center gap-3">
              <span style={{ fontSize: '28px' }}>🌟</span>
              <div>
                <p style={{ fontSize: '17px', fontWeight: 700, color: '#101828' }}>AI Model Answer</p>
                <p style={{ fontSize: '13px', color: '#6A7282' }}>Expert-crafted response for reference</p>
              </div>
            </div>
            <button
              onClick={() => setModelAnswerOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#6A7282', lineHeight: 1, padding: '2px' }}
            >
              ×
            </button>
          </div>

          {/* Disclaimer banner */}
          <div style={{ padding: '12px 24px', background: '#FFFBEB', borderBottom: '1px solid #FDE68A', flexShrink: 0 }}>
            <p style={{ fontSize: '13px', color: '#B45309', lineHeight: '20px' }}>
              <strong>⚡ Reference Only</strong> — Read after you&apos;ve written your own answer. Use this to understand gaps, not to memorise.
            </p>
          </div>

          {/* Scrollable body */}
          <div style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Key Points Checklist */}
            {data.modelAnswerKeyPoints && data.modelAnswerKeyPoints.length > 0 && (
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#B45309', marginBottom: '14px' }}>
                  📌 KEY POINTS CHECKLIST
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {data.modelAnswerKeyPoints.map((point, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '12px 16px' }}>
                      <span style={{
                        flexShrink: 0,
                        width: '26px', height: '26px',
                        borderRadius: '50%',
                        background: '#17223E',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {i + 1}
                      </span>
                      <p style={{ fontSize: '14px', color: '#374151', lineHeight: '22px' }}>{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Model Answer */}
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6A7282', marginBottom: '16px' }}>
                📄 FULL MODEL ANSWER
              </p>
              {data.modelAnswerContent ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {data.modelAnswerContent
                    .split(/\n+/)
                    .map((p) => p.trim())
                    .filter(Boolean)
                    .map((paragraph, i) => {
                      // Bold text before first colon if it looks like a heading
                      const colonIdx = paragraph.indexOf(':');
                      const looksLikeHeading = colonIdx > 0 && colonIdx < 60 && !paragraph.startsWith('"');
                      return (
                        <p key={i} style={{ fontSize: '15px', color: '#1F2937', lineHeight: '26px' }}>
                          {looksLikeHeading ? (
                            <>
                              <strong>{paragraph.slice(0, colonIdx + 1)}</strong>
                              {paragraph.slice(colonIdx + 1)}
                            </>
                          ) : paragraph}
                        </p>
                      );
                    })}
                </div>
              ) : (
                <p style={{ fontSize: '14px', color: '#6A7282', fontStyle: 'italic' }}>
                  Full model answer will appear here once it is available for this question.
                </p>
              )}
            </div>
          </div>

          {/* Sticky footer */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: '12px', flexShrink: 0 }}>
            <button
              style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #E5E7EB', background: '#FFFFFF', fontSize: '14px', fontWeight: 600, color: '#374151', cursor: 'pointer' }}
            >
              📝 Save to Notes
            </button>
            <button
              onClick={() => { setModelAnswerOpen(false); router.push('/dashboard/daily-answer/challenge'); }}
              style={{ flex: 2, padding: '12px', borderRadius: '10px', background: '#17223E', color: '#FFFFFF', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer' }}
            >
              ✍️ Rewrite with This Knowledge
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen font-arimo flex items-center justify-center" style={{ background: '#FAFBFE' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    }>
      <ResultsPageInner />
    </Suspense>
  );
}
