'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { dailyAnswerService } from '@/lib/services';

interface ResultsData {
  score: number;
  maxScore: number;
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  detailedFeedback?: string;
  wordCount?: number | null;
  submittedAt?: string | null;
}

type SlideKey = 'feedback' | 'markup' | 'rubric' | 'next';

const BETA_DISCLAIMER =
  'Jeet AI is currently in beta and evolving every day alongside you. Our evaluation engine is built to deliver meaningful, structured, and exam-relevant feedback, but it can still make mistakes. Use it as a smart companion alongside your mentors, notes, and judgment.';

export default function ResultsPage() {
  const router = useRouter();
  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [slide, setSlide] = useState<SlideKey>('feedback');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAttemptId = sessionStorage.getItem('dailyAnswerAttemptId');
      if (storedAttemptId) setAttemptId(storedAttemptId);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    dailyAnswerService.getResults(attemptId || undefined)
      .then((res) => {
        if (cancelled) return;
        setData(res.data);
        if (typeof window !== 'undefined') {
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
  }, [attemptId]);

  const slides: Array<{ key: SlideKey; label: string }> = [
    { key: 'feedback', label: 'Feedback' },
    { key: 'markup', label: "Examiner's Markup" },
    { key: 'rubric', label: 'Score' },
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
        style={{ background: 'linear-gradient(180deg, #E6EAF0 0%, #DDE2EA 100%)' }}
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
    <div className="min-h-screen font-arimo" style={{ background: 'linear-gradient(180deg, #E6EAF0 0%, #DDE2EA 100%)' }}>
      <div className="flex flex-col items-center py-10 px-6 gap-6">
        <div
          className="flex flex-col items-center justify-center px-6"
          style={{
            width: '988px',
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

        <div className="flex items-center gap-2 flex-wrap" style={{ width: '988px' }}>
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
          <div
            style={{
              width: '988px',
              borderRadius: '14px',
              background: '#FFFFFF',
              boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/feedback-header.png" alt="Personalized Feedback" style={{ width: '924px', objectFit: 'fill' }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/feedback-subtitle.png"
              alt="Actionable insights to help you improve, not just a score"
              style={{ width: '924px', objectFit: 'fill' }}
            />

            <div className="grid grid-cols-4 gap-4">
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

            <div className="grid grid-cols-3 gap-6">
              <div className="rounded-[10px] border border-[#B9F8CF] bg-[#F0FDF4] p-5">
                <h3 className="font-bold text-[#0D542B] mb-3" style={{ fontSize: '15px' }}>What You Did Well</h3>
                {strengths.length > 0 ? (
                  <ul className="space-y-2">
                    {strengths.map((item, index) => (
                      <li key={`${item}-${index}`} className="flex items-start gap-2 text-[#0D542B]" style={{ fontSize: '13px', lineHeight: '20px' }}>
                        <span className="mt-0.5 flex-shrink-0">&#10003;</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[#166534]" style={{ fontSize: '13px', lineHeight: '20px' }}>
                    The evaluator did not return structured strengths for this answer yet.
                  </p>
                )}
              </div>

              <div className="rounded-[10px] border border-[#FFF085] bg-[#FEFCE8] p-5">
                <h3 className="font-bold text-[#713F12] mb-3" style={{ fontSize: '15px' }}>Areas to Improve</h3>
                {improvements.length > 0 ? (
                  <ul className="space-y-2">
                    {improvements.map((item, index) => (
                      <li key={`${item}-${index}`} className="flex items-start gap-2 text-[#713F12]" style={{ fontSize: '13px', lineHeight: '20px' }}>
                        <span className="mt-0.5 flex-shrink-0">&#9888;</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[#713F12]" style={{ fontSize: '13px', lineHeight: '20px' }}>
                    No explicit improvement bullets were returned by the evaluator.
                  </p>
                )}
              </div>

              <div className="rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] p-5">
                <h3 className="font-bold text-[#101828] mb-3" style={{ fontSize: '15px' }}>Value-Add Ideas</h3>
                {suggestions.length > 0 ? (
                  <ul className="space-y-2">
                    {suggestions.map((item, index) => (
                      <li key={`${item}-${index}`} className="flex items-start gap-2 text-[#374151]" style={{ fontSize: '13px', lineHeight: '20px' }}>
                        <span className="mt-0.5 flex-shrink-0">&#128161;</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[#374151]" style={{ fontSize: '13px', lineHeight: '20px' }}>
                    No extra suggestions were returned for this answer yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {slide === 'markup' && (
          <div
            style={{
              width: '988px',
              borderRadius: '14px',
              background: '#FFFFFF',
              boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A',
              padding: '32px',
            }}
          >
            <h2 className="font-bold text-[#101828] mb-2" style={{ fontSize: '22px' }}>
              Examiner&apos;s Markup
            </h2>
            <p className="text-[#4A5565] mb-6" style={{ fontSize: '14px' }}>
              This slide now stays available even when the backend returns narrative feedback instead of token-level markup.
            </p>

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
              width: '988px',
              borderRadius: '14px',
              background: '#FFFFFF',
              boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A',
              padding: '32px',
            }}
          >
            <h2 className="font-bold text-[#101828] mb-3" style={{ fontSize: '22px' }}>
              Score Snapshot
            </h2>
            <p className="text-[#4A5565] mb-6" style={{ fontSize: '14px' }}>
              The current backend returns an overall examiner score, plus structured strengths and improvement points.
            </p>

            <div className="mb-8">
              <div className="flex justify-between text-sm text-[#101828] mb-2">
                <span className="font-semibold">Overall evaluation score</span>
                <span>{score}/{maxScore}</span>
              </div>
              <div className="w-full h-3 bg-[#E5E7EB] rounded-full overflow-hidden">
                <div className="h-full bg-[#17223E]" style={{ width: `${scorePercent}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {rubricCards.map((card) => (
                <div key={card.label} className="rounded-[12px] border border-[#E5E7EB] bg-[#F9FAFB] p-5">
                  <div className="text-[#6A7282] uppercase mb-2" style={{ fontSize: '11px', letterSpacing: '0.4px', fontWeight: 700 }}>
                    {card.label}
                  </div>
                  <div className="font-bold text-[#101828] mb-2" style={{ fontSize: '28px', lineHeight: '34px' }}>
                    {card.value}
                  </div>
                  <p className="text-[#4A5565]" style={{ fontSize: '13px', lineHeight: '20px' }}>{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {slide === 'next' && (
          <div
            style={{
              width: '988px',
              borderRadius: '14px',
              background: '#FFFFFF',
              boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A',
              padding: '32px',
            }}
          >
            <h2 className="font-bold text-[#101828] mb-6" style={{ fontSize: '22px' }}>
              What would you like to do next?
            </h2>

            <div className="grid grid-cols-3 gap-5">
              <button onClick={() => setSlide('feedback')} className="rounded-[14px] border border-[#E5E7EB] p-6 text-center hover:shadow-md hover:-translate-y-1 transition-all">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#EDE9FE] text-[#5B21B6] text-xl">F</div>
                <div className="font-bold text-[#101828] mb-1">Review Feedback</div>
                <div className="text-sm text-[#4A5565]">Revisit strengths, gaps, and suggestions</div>
              </button>

              <button onClick={() => setSlide('markup')} className="rounded-[14px] border border-[#E5E7EB] p-6 text-center hover:shadow-md hover:-translate-y-1 transition-all">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#FEF3C7] text-[#B45309] text-xl">M</div>
                <div className="font-bold text-[#101828] mb-1">Read Examiner Notes</div>
                <div className="text-sm text-[#4A5565]">Study the narrative commentary carefully</div>
              </button>

              <button onClick={() => router.push('/dashboard/daily-answer')} className="rounded-[14px] border border-[#E5E7EB] p-6 text-center hover:shadow-md hover:-translate-y-1 transition-all">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#DCFCE7] text-[#166534] text-xl">N</div>
                <div className="font-bold text-[#101828] mb-1">Practice Another One</div>
                <div className="text-sm text-[#4A5565]">Return to daily answer writing and continue</div>
              </button>
            </div>
          </div>
        )}

        <div
          style={{
            width: '988px',
            borderRadius: '10px',
            background: '#FEFCE8',
            borderLeft: '4px solid #FDC700',
            padding: '14px 20px',
          }}
        >
          <p style={{ fontSize: '12px', lineHeight: '18px', color: '#713F12' }}>
            <strong>Note:</strong> {BETA_DISCLAIMER}
          </p>
        </div>
      </div>
    </div>
  );
}
