'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const CheckmarkIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TrophyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 21H16" stroke="#CA8A04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 17V21" stroke="#CA8A04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M17 4H7C5.89543 4 5 4.89543 5 6V10C5 13.866 8.13401 17 12 17C15.866 17 19 13.866 19 10V6C19 4.89543 18.1046 4 17 4Z"
      stroke="#F59E0B"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19 4H20C21.1046 4 22 4.89543 22 6V9C22 10.1046 21.1046 11 20 11H19"
      stroke="#CA8A04"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5 4H4C2.89543 4 2 4.89543 2 6V9C2 10.1046 2.89543 11 4 11H5"
      stroke="#CA8A04"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type Branch = {
  name: string;
  count: number;
  color: string;
};

type QuizQuestion = {
  question: string;
  options: string[];
  current: number;
  total: number;
  correctAnswer: string;
};

type PageParams = {
  params: {
    subjectId: string;
    mindmapId: string;
  };
};

export default function MindmapViewPage({ params }: PageParams) {
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const branches: Branch[] = [
    { name: 'Lok Sabha', count: 5, color: '#3B82F6' },
    { name: 'Rajya Sabha', count: 5, color: '#A855F7' },
    { name: 'Sessions', count: 5, color: '#F59E0B' },
    { name: 'Legislation', count: 4, color: '#10B981' },
    { name: 'Key Officers', count: 5, color: '#EC4899' },
  ];

  const quizQuestions: QuizQuestion[] = [
    {
      question: 'Which Part of the Indian Constitution deals with Fundamental Rights?',
      options: ['Part II', 'Part III', 'Part IV', 'Part V'],
      current: 1,
      total: 3,
      correctAnswer: 'Part III',
    },
    {
      question: 'Who is the presiding officer of the Lok Sabha?',
      options: ['President', 'Vice President', 'Speaker', 'Prime Minister'],
      current: 2,
      total: 3,
      correctAnswer: 'Speaker',
    },
    {
      question: 'What is the maximum strength of Rajya Sabha?',
      options: ['250', '245', '545', '552'],
      current: 3,
      total: 3,
      correctAnswer: '250',
    },
  ];

  const handleAnswer = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setQuizCompleted(true);
      setShowProModal(true);
    }
  };

  const subjectTitle = params.subjectId.replace(/-/g, ' ').replace(/\band\b/g, '&');
  const mindmapTitle = params.mindmapId.replace(/-/g, ' ').replace(/\band\b/g, '&');

  return (
    <div className="min-h-screen bg-[#0B1020] text-white font-inter">
      {showProModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 font-inter">
          <div className="absolute inset-0 bg-[#0A0F1C]/80 backdrop-blur-sm" />

          <div className="relative bg-white rounded-[24px] overflow-hidden w-full max-w-[500px] shadow-2xl">
            <div className="bg-[#10182D] p-6 pb-8 text-center relative">
              <button
                onClick={() => {
                  setShowProModal(false);
                  setQuizCompleted(false);
                }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                ✕
              </button>

              <div className="flex justify-center mb-3">
                <span className="text-[32px]">👑</span>
              </div>

              <h2 className="text-[24px] font-bold text-white mb-2">Unlock Pro Access</h2>
              <p className="text-[#9CA3AF] text-[14px] leading-relaxed max-w-[340px] mx-auto">
                You&apos;ve used your 2 free mindmaps. Upgrade for unlimited access to all maps, the builder, quizzes and more.
              </p>
            </div>

            <div className="p-6 -mt-4 bg-white rounded-t-[24px] relative z-10">
              <div className="bg-[#FEF2F2] border border-[#FEE2E2] rounded-[12px] p-4 flex items-center gap-3 mb-6">
                <div className="text-[20px]">🔒</div>
                <div>
                  <div className="text-[#EF4444] font-bold text-[14px]">Free limit reached (2 / 2 maps used)</div>
                  <div className="text-[#EF4444]/80 text-[12px]">Upgrade to continue — takes 30 seconds</div>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <span className="text-[18px]">🧠</span>
                  <span className="text-[#374151] text-[14px] font-medium">All 42+ Mindmaps across 8 subjects</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[18px]">✏️</span>
                  <span className="text-[#374151] text-[14px] font-medium">Custom Mindmap Builder — unlimited saves</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[18px]">🧩</span>
                  <span className="text-[#374151] text-[14px] font-medium">Topic Quizzes + Branch-by-Branch Revision</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[18px]">🔄</span>
                  <span className="text-[#374151] text-[14px] font-medium">Send maps to Flashcards + Spaced Repetition</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[18px]">📅</span>
                  <span className="text-[#374151] text-[14px] font-medium">Schedule Revision + Planner sync</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 relative">
                <div className="group cursor-pointer relative">
                  <input type="radio" name="plan" id="monthly" className="peer sr-only" />
                  <label
                    htmlFor="monthly"
                    className="block p-4 rounded-[12px] border border-gray-200 peer-checked:border-[#10182D] peer-checked:bg-gray-50 h-full cursor-pointer hover:border-gray-300 transition-all text-center"
                  >
                    <div className="text-[12px] font-semibold text-gray-500 mb-1">Monthly</div>
                    <div className="flex items-center justify-center gap-0.5 mb-1">
                      <span className="text-[24px] font-bold text-[#10182D]">₹299</span>
                    </div>
                    <div className="text-[11px] text-gray-400">per month</div>
                  </label>
                </div>

                <div className="group cursor-pointer relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#10182D] text-white text-[10px] font-bold px-3 py-1 rounded-full z-10 whitespace-nowrap">
                    Best Value
                  </div>

                  <input type="radio" name="plan" id="annual" className="peer sr-only" defaultChecked />
                  <label
                    htmlFor="annual"
                    className="block p-4 rounded-[12px] border-2 border-[#10182D] bg-[#F9FAFB] h-full cursor-pointer transition-all text-center relative overflow-hidden"
                  >
                    <div className="text-[12px] font-semibold text-gray-500 mb-1">Annual</div>
                    <div className="flex items-center justify-center gap-0.5 mb-1">
                      <span className="text-[28px] font-bold text-[#10182D]">₹199</span>
                    </div>
                    <div className="text-[11px] text-gray-400">per month, billed ₹2388/yr</div>
                  </label>
                </div>
              </div>

              <button className="w-full bg-[#10182D] text-white py-4 rounded-[12px] font-bold text-[16px] flex items-center justify-center gap-2 hover:bg-[#1F2937] transition-all transform hover:scale-[1.02] shadow-lg mb-4">
                <span>⭐</span> Start Free 7-day Trial
              </button>

              <div className="text-center">
                <button
                  onClick={() => {
                    setShowProModal(false);
                    setQuizCompleted(false);
                  }}
                  className="text-[#6B7280] text-[13px] hover:text-[#111827] transition-colors"
                >
                  Maybe later — keep free plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1200px] mx-auto py-6 px-8">
        <Link
          href={`/dashboard/mindmap/${params.subjectId}`}
          className="inline-flex items-center text-[#9CA3AF] text-[13px] hover:text-white mb-4"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
            <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to {subjectTitle}
        </Link>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-[24px] font-bold text-white mb-1">{mindmapTitle}</h1>
            <p className="text-[#9CA3AF] text-[13px]">
              Indian Polity · 5 branches · 25 key points
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0F172A] border border-[#1F2937]">
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                <CheckmarkIcon />
              </div>
              <span className="text-[12px] text-[#D1FAE5] font-medium">95% mastered</span>
            </div>

            <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F97316]/10 text-[#FDBA74] border border-[#FB923C]/40 text-[12px] font-medium">
              <TrophyIcon />
              <span>Jeet Score 92</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)] gap-6 items-start">
          <div className="bg-[#0F172A] rounded-[20px] p-6 shadow-xl border border-[#111827] relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[16px]">🧠</span>
                <h2 className="text-[14px] font-semibold text-white">Mindmap View</h2>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#9CA3AF]">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Interactive branches</span>
              </div>
            </div>

            <div className="relative bg-[#020617] rounded-[16px] border border-[#1F2937] overflow-hidden h-[360px] flex items-center justify-center">
              <div className="absolute inset-0 opacity-[0.18] pointer-events-none">
                <svg width="100%" height="100%">
                  <defs>
                    <radialGradient id="mindmap-glow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#22C55E" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#020617" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#mindmap-glow)" />
                </svg>
              </div>

              <div className="relative w-full h-full flex items-center justify-center">
                <div
                  className="z-20 bg-[#10182D] text-white flex items-center justify-center font-bold shadow-lg pointer-events-auto border-[#1E2939] text-[14px]"
                  style={{
                    width: '159px',
                    height: '47px',
                    borderRadius: '16px',
                    borderWidth: '1.6px',
                  }}
                >
                  Structure of Par...
                </div>

                <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none">
                  <line x1="50%" y1="50%" x2="35%" y2="30%" stroke="#3B82F6" strokeWidth="2" />
                  <line x1="50%" y1="50%" x2="65%" y2="30%" stroke="#A855F7" strokeWidth="2" />
                  <line x1="50%" y1="50%" x2="25%" y2="55%" stroke="#EC4899" strokeWidth="2" />
                  <line x1="50%" y1="50%" x2="60%" y2="70%" stroke="#F59E0B" strokeWidth="2" />
                  <line x1="50%" y1="50%" x2="40%" y2="75%" stroke="#10B981" strokeWidth="2" />
                </svg>

                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-[30%] left-[35%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
                    <div className="bg-[#EFF6FF] text-[#3B82F6] border border-[#3B82F6] px-5 py-2.5 rounded-[12px] text-[14px] font-semibold shadow-sm cursor-pointer hover:shadow-md transition-all hover:scale-105 min-w-[120px] text-center">
                      Lok Sabha
                    </div>
                  </div>

                  <div className="absolute top-[30%] left-[65%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
                    <div className="bg-[#FAF5FF] text-[#A855F7] border border-[#A855F7] px-5 py-2.5 rounded-[12px] text-[14px] font-semibold shadow-sm cursor-pointer hover:shadow-md transition-all hover:scale-105 min-w-[120px] text-center">
                      Rajya Sabha
                    </div>
                  </div>

                  <div className="absolute top-[55%] left-[25%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
                    <div className="bg-[#FDF2F8] text-[#EC4899] border border-[#EC4899] px-5 py-2.5 rounded-[12px] text-[14px] font-semibold shadow-sm cursor-pointer hover:shadow-md transition-all hover:scale-105 min-w-[120px] text-center">
                      Key Officers
                    </div>
                  </div>

                  <div className="absolute top-[70%] left-[60%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
                    <div className="bg-[#FFFBEB] text-[#F59E0B] border border-[#F59E0B] px-5 py-2.5 rounded-[12px] text-[14px] font-semibold shadow-sm cursor-pointer hover:shadow-md transition-all hover:scale-105 min-w-[120px] text-center">
                      Sessions
                    </div>
                  </div>

                  <div className="absolute top-[75%] left-[40%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
                    <div className="bg-[#ECFDF5] text-[#10B981] border border-[#10B981] px-5 py-2.5 rounded-[12px] text-[14px] font-semibold shadow-sm cursor-pointer hover:shadow-md transition-all hover:scale-105 min-w-[120px] text-center">
                      Legislation
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-6 right-6 flex flex-col gap-3 pointer-events-auto">
                <button className="w-8 h-8 bg-white rounded-[6px] shadow-sm border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="11" y1="8" x2="11" y2="14" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </button>
                <button className="w-8 h-8 bg-white rounded-[6px] shadow-sm border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </button>
                <button className="w-8 h-8 bg-white rounded-[6px] shadow-sm border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between text-[12px] font-medium text-[#9CA3AF]">
                <span>Branches explored</span>
                <span className="text-[#22C55E]">5 / 5</span>
              </div>
              <div className="mt-2 w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-[#22C55E] w-full rounded-full" />
              </div>
            </div>

            <div className="bg-white rounded-[16px] p-6 shadow-sm border border-gray-100 mt-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[16px]">🧩</span>
                <h3 className="text-[14px] font-bold text-[#101828]">Quick Quiz</h3>
              </div>

              <div className="space-y-4">
                <p className="text-[16px] font-bold text-[#101828] leading-snug">
                  {quizQuestions[currentQuestionIndex].question}
                </p>

                <div className="space-y-3">
                  {quizQuestions[currentQuestionIndex].options.map((option, idx) => (
                    <button
                      key={option}
                      onClick={handleAnswer}
                      className="w-full text-left p-4 rounded-[8px] border border-gray-200 text-[#374151] hover:bg-gray-50 hover:border-gray-300 transition-all text-[14px]"
                    >
                      <span className="font-semibold mr-2">{String.fromCharCode(65 + idx)}.</span> {option}
                    </button>
                  ))}
                </div>

                <p className="text-[12px] text-[#9CA3AF] mt-4">
                  Question {quizQuestions[currentQuestionIndex].current} of {quizQuestions[currentQuestionIndex].total}
                </p>
              </div>
            </div>
          </div>

          <div className="w-full max-w-[300px] bg-white rounded-[16px] p-6 shadow-sm border border-gray-100 h-fit">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[16px]">📂</span>
              <h3 className="text-[14px] font-bold text-[#101828]">Branches</h3>
            </div>

            <ul className="space-y-4">
              {branches.map((branch) => (
                <li key={branch.name} className="flex justify-between items-center text-[13px]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: branch.color }} />
                    <span className="text-[#374151]">{branch.name}</span>
                  </div>
                  <span className="text-[#9CA3AF] text-[11px]">{branch.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

