'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { dailyMcqService } from '@/lib/services';

interface PracticeQuestion {
  id: string;
  questionNum: number;
  questionText: string;
  category: string;
  difficulty: string;
  options: { id?: string; label?: string; text: string }[];
  correctOption: string;
  explanation: string | null;
}

export default function PracticePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicsParam = searchParams.get('topics');
  const topics = topicsParam ? topicsParam.split(',').map(t => t.trim()).filter(Boolean) : [];

  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    dailyMcqService.getPractice(topics, 10)
      .then(res => {
        const qs = (res.data?.questions || []).map((q: any, idx: number) => ({ ...q, questionNum: idx + 1 }));
        setQuestions(qs);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [topicsParam]);

  const handleSelect = (qid: string, opt: string) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qid]: opt }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const correctCount = questions.filter(q => answers[q.id] === q.correctOption).length;
  const wrongCount = questions.filter(q => answers[q.id] && answers[q.id] !== q.correctOption).length;
  const skipped = questions.length - Object.keys(answers).length;

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Practice Questions</h2>
          <p className="text-gray-500 mb-4">{error || 'No questions found for the selected topics.'}</p>
          <Link href="/dashboard/daily-mcq" className="text-blue-600 hover:underline">Back to Daily MCQ</Link>
        </div>
      </div>
    );
  }

  const q = questions[currentQuestion];

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#FFFFFF' }}>
      <main className="flex-1 px-[clamp(3rem,6.25vw,8rem)] py-8">
        <div className="max-w-[900px] mx-auto">
          <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 mb-6 hover:opacity-70 transition-opacity"
            style={{ width: '237px', height: '51px', borderRadius: '20px', background: '#1C50D40D', fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '22px', color: '#17223E' }}>
            ← Back to dashboard
          </Link>

          <div style={{ maxWidth: '1050px', borderRadius: '10px', background: '#EAECEF40', boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A', padding: '24px' }}>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <img src="/daily-challenge-icon.png" alt="MCQ" className="w-10 h-10" />
                  <h1 className="font-arimo font-bold text-black text-[26px] leading-[28px] whitespace-nowrap">
                    Weak Area Practice
                    <span className="font-arimo font-normal text-[#94A3B8] text-[18px] leading-[28px]"> · {topics.join(', ')}</span>
                  </h1>
                </div>
                {submitted && (
                  <span className="text-xs font-bold text-[#00A63E] flex items-center gap-2 px-4 py-2 bg-[#F0FDF4] border border-[#BBF7D0] rounded-full whitespace-nowrap">
                    <span className="w-1.5 h-1.5 bg-[#00A63E] rounded-full"></span>
                    {correctCount}/{questions.length} Correct
                  </span>
                )}
              </div>

              <div className="w-full border-t border-[#99A1AFE5] mb-4"></div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 bg-[#EFF6FF] px-4 rounded-full w-[170px] h-[38px]">
                  <img src="/tag-one.png" alt="Tag" className="w-4 h-4" />
                  <span className="font-arimo font-bold text-[#155DFC] text-[14px] leading-[16px]">{q.category} • {q.difficulty}</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <p className="font-arimo font-bold text-[#101828] text-sm mb-6">
                <span className="font-bold">Question {q.questionNum}:</span> {q.questionText}
              </p>

              <div className="space-y-3">
                {q.options.map((option: any) => {
                  const optKey = option.id || option.label;
                  const isSelected = answers[q.id] === optKey;
                  const isCorrectOpt = optKey === q.correctOption;
                  const isWrongSelected = isSelected && !isCorrectOpt;

                  let bg = '#FFFFFF';
                  let border = '2px solid #E2E8F0';
                  let circleColor = '#CBD5E1';
                  let circleBg = 'transparent';
                  let circleText = '#64748B';
                  let circleIcon: string = optKey;
                  let textColor = '#1E293B';
                  let fontWeight = 400;

                  if (submitted) {
                    if (isCorrectOpt) {
                      bg = '#F0FDF4';
                      border = '2px solid #00C950';
                      circleColor = '#00C950';
                      circleBg = '#DCFCE7';
                      circleText = '#00C950';
                      circleIcon = '✓';
                      textColor = '#14532D';
                      fontWeight = 600;
                    } else if (isWrongSelected) {
                      bg = '#FEF2F2';
                      border = '2px solid #FB2C36';
                      circleColor = '#FB2C36';
                      circleBg = '#FEE2E2';
                      circleText = '#FB2C36';
                      circleIcon = '✕';
                      textColor = '#7F1D1D';
                      fontWeight = 600;
                    }
                  } else if (isSelected) {
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
                      onClick={() => handleSelect(q.id, optKey)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '16px 20px',
                        borderRadius: '12px',
                        border,
                        background: bg,
                        cursor: submitted ? 'default' : 'pointer',
                        textAlign: 'left' as const,
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
                        {option.text}
                      </span>
                    </button>
                  );
                })}
              </div>

              {submitted && q.explanation && (
                <div style={{
                  marginTop: '20px',
                  background: '#EFF6FF',
                  borderLeft: '4px solid #2B7FFF',
                  borderRadius: '10px',
                  padding: '16px 16px 16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: '#155DFC', lineHeight: '20px' }}>
                    EXPLANATION
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 400, color: '#1C398E', lineHeight: '20px' }}>
                    {q.explanation}
                  </span>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
              <button
                className="flex items-center gap-2 text-[#101828] hover:opacity-70 transition-opacity disabled:opacity-30"
                disabled={currentQuestion === 0}
                onClick={() => setCurrentQuestion(prev => prev - 1)}
              >
                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span className="font-arimo font-bold text-sm">Previous</span>
              </button>

              <div className="flex items-center gap-2">
                {questions.map((qu, i) => {
                  const answered = !!answers[qu.id];
                  const isCorrect = submitted && answered && answers[qu.id] === qu.correctOption;
                  const isWrong = submitted && answered && answers[qu.id] !== qu.correctOption;

                  let bgColor = '';
                  let txtColor = '#6B7280';

                  if (currentQuestion === i) {
                    bgColor = '#00A63E';
                    txtColor = '#FFFFFF';
                  } else if (isCorrect) {
                    bgColor = '#DCFCE7';
                    txtColor = '#14532D';
                  } else if (isWrong) {
                    bgColor = '#FEE2E2';
                    txtColor = '#7F1D1D';
                  }

                  return (
                    <button key={i} onClick={() => setCurrentQuestion(i)}
                      className="w-8 h-8 rounded-full font-arimo font-bold text-sm transition-all"
                      style={{
                        background: bgColor || undefined,
                        color: txtColor,
                      }}
                      onMouseEnter={(e) => { if (!bgColor) e.currentTarget.style.background = '#F3F4F6'; }}
                      onMouseLeave={(e) => { if (!bgColor) e.currentTarget.style.background = ''; }}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              {submitted ? (
                <button
                  className="flex items-center gap-2 bg-[#17223E] text-white px-5 py-2 rounded-lg hover:bg-[#1E2875] transition-colors"
                  onClick={() => router.push('/dashboard/daily-mcq/results')}
                >
                  <span className="font-arimo font-bold text-sm">View Results</span>
                  <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none"><path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              ) : currentQuestion === questions.length - 1 ? (
                <button
                  className="flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  onClick={handleSubmit}
                >
                  <span className="font-arimo font-bold text-sm">Submit</span>
                </button>
              ) : (
                <button
                  className="flex items-center gap-2 bg-[#17223E] text-white px-5 py-2 rounded-lg hover:bg-[#1E2875] transition-colors"
                  onClick={() => setCurrentQuestion(prev => prev + 1)}
                >
                  <span className="font-arimo font-bold text-sm">Next</span>
                  <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none"><path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
