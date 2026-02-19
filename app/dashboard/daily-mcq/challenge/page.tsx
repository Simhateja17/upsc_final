'use client';

import React, { useState } from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DailyMcqChallengePage() {
  const router = useRouter();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(1);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#FFFFFF' }}>
      {/* Header */}
      <DashboardHeader />

      {/* Main Content */}
      <main className="flex-1 px-[clamp(3rem,6.25vw,8rem)] py-8">
        <div className="max-w-[900px] mx-auto">
          {/* Back to Dashboard */}
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 mb-6 hover:opacity-70 transition-opacity"
            style={{
              width: '237px',
              height: '51px',
              borderRadius: '20px',
              background: '#1C50D40D',
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 600,
              fontSize: '22px',
              lineHeight: '100%',
              color: '#17223E',
            }}
          >
            ← Back to dashboard
          </Link>

          {/* MCQ Container */}
          <div
            style={{
              maxWidth: '1050px',
              borderRadius: '10px',
              borderLeft: '4px solid #155DFC',
              background: '#EAECEF40',
              boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A',
              padding: '24px',
            }}
          >
            {/* Header Card */}
            <div className="mb-6">
              {/* Title with Blue Bottom Border */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <img
                    src="/daily-challenge-icon.png"
                    alt="MCQ"
                    className="w-10 h-10"
                  />
                  <h1 className="font-arimo font-bold text-black text-[26px] leading-[28px] whitespace-nowrap">
                    Daily MCQ Challenge
                    <span className="font-arimo font-normal text-[#94A3B8] text-[18px] leading-[28px]"> · (7th February 2026)</span>
                  </h1>
                </div>

                {/* Right: Live Badge */}
                <div className="flex items-center">
                  <span className="text-xs font-bold text-[#E7000B] flex items-center gap-2 px-4 py-2 bg-[#FEF2F2] border border-[#FFC9C9] rounded-full whitespace-nowrap">
                    <span className="w-1.5 h-1.5 bg-[#E7000B] rounded-full"></span>
                    Todays Challenge is LIVE
                  </span>
                </div>
              </div>

              {/* Horizontal Divider */}
              <div className="w-full border-t border-[#99A1AFE5] mb-4"></div>

              {/* Tags Row and Timer */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 bg-[#EFF6FF] px-4 rounded-full w-[170px] h-[38px]">
                  <img
                    src="/tag-one.png"
                    alt="Tag"
                    className="w-4 h-4"
                  />
                  <span className="font-arimo font-bold text-[#155DFC] text-[14px] leading-[16px]">Polity • Moderate</span>
                </div>

                {/* Timer */}
                <div className="flex items-center gap-2">
                  <img
                    src="/timer-icon.png"
                    alt="Timer"
                    className="w-10 h-10"
                  />
                  <div className="flex flex-col items-end">
                    <span className="font-arimo font-bold text-[#101828] text-xl leading-none">14:31</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wide">TIME LEFT</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Question Section */}
            <div className="mb-6">
              <p className="font-arimo font-bold text-[#101828] text-sm mb-3">
                <span className="font-bold">Question 1:</span> Consider the following statements regarding Fundamental Rights in the Indian Constitution:
              </p>

              <div className="space-y-1 mb-3 text-[#4A5565] text-sm leading-relaxed">
                <p>Right to Property is still a Fundamental Right</p>
                <p>They can be suspended during National Emergency</p>
                <p>Right to Education is a Fundamental Right</p>
              </div>

              <p className="font-arimo text-[#101828] text-sm mb-6">
                Which of the statements given above are correct?
              </p>

              {/* Answer Options */}
              <div className="space-y-3">
                {[
                  { id: 'A', text: '1 and 3 only' },
                  { id: 'B', text: '3 and 4 only' },
                  { id: 'C', text: '1, 3 and 4 only' },
                  { id: 'D', text: '1, 2, 3 and 4' }
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedAnswer(option.id)}
                    className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors bg-white text-left"
                  >
                    <span className="font-arimo font-bold text-[#101828] text-base">{option.id}</span>
                    <span className="font-arimo text-[#101828] text-sm">{option.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation Footer */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
              {/* Previous Button */}
              <button
                className="flex items-center gap-2 text-[#101828] hover:opacity-70 transition-opacity disabled:opacity-30"
                disabled={currentQuestion === 1}
                onClick={() => {
                  if (currentQuestion > 1) {
                    setCurrentQuestion(currentQuestion - 1);
                  }
                }}
              >
                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="font-arimo font-bold text-sm">Previous</span>
              </button>

              {/* Question Numbers */}
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    onClick={() => setCurrentQuestion(num)}
                    className={`w-8 h-8 rounded-full font-arimo font-bold text-sm transition-all ${
                      currentQuestion === num
                        ? 'bg-[#00A63E] text-white'
                        : 'text-[#6B7280] hover:bg-gray-100'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              {/* Next Button */}
              <button
                className="flex items-center gap-2 bg-[#17223E] text-white px-5 py-2 rounded-lg hover:bg-[#1E2875] transition-colors"
                onClick={() => {
                  if (currentQuestion === 10) {
                    router.push('/dashboard/daily-mcq/results');
                  } else {
                    setCurrentQuestion(currentQuestion + 1);
                  }
                }}
              >
                <span className="font-arimo font-bold text-sm">Next</span>
                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
