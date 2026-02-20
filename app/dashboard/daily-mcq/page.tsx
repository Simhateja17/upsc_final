'use client';

import React from 'react';
import Link from 'next/link';

export default function DailyMcqIntroPage() {
  return (
    <div className="flex flex-col min-h-screen panel-recessed">
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        {/* Intro Card */}
        <div className="w-full max-w-[448px] card-elevated rounded-[16px] p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <img 
              src="/image-removebg-preview (22) 1.png" 
              alt="Target Icon" 
              className="w-[51px] h-[44px] object-contain"
            />
          </div>

          {/* Title */}
          <h1 className="font-arimo font-bold text-[#101828] text-[24px] leading-[32px] mb-2">
            Today's Daily MCQs
          </h1>

          {/* Subtitle */}
          <p className="font-arimo text-[#667085] text-[14px] leading-[20px] mb-6">
            Sharpen your knowledge with focused practice questions
          </p>

          {/* Topic Tags */}
          <div className="flex flex-nowrap items-center justify-center gap-2 mb-8 overflow-x-auto">
            {['Indian Polity', 'Fundamental Rights', 'Prelims Focus'].map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-[#EFF6FF] text-[#101828] rounded-full font-arimo text-[14px] leading-[20px] whitespace-nowrap"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 w-[300px] mx-auto mb-8">
            <div className="flex flex-col items-center">
              <div className="font-arimo font-bold text-[#101828] text-[32px] leading-tight max-md:text-[24px]">
                10
              </div>
              <div className="font-arimo text-[#667085] text-[12px] mt-1">
                Questions
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="font-arimo font-bold text-[#101828] text-[32px] leading-tight max-md:text-[24px]">
                15
              </div>
              <div className="font-arimo text-[#667085] text-[12px] mt-1">
                Minutes
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="font-arimo font-bold text-[#101828] text-[32px] leading-tight max-md:text-[24px]">
                20
              </div>
              <div className="font-arimo text-[#667085] text-[12px] mt-1">
                Marks
              </div>
            </div>
          </div>

          {/* Start Button */}
          <Link href="/dashboard/daily-mcq/challenge">
            <button 
              className="w-[232px] h-[52px] bg-[#101828] text-white rounded-[10px] hover:bg-[#1A1A1A] transition-all flex items-center justify-center gap-2 mx-auto font-arimo font-bold text-[20px] leading-[24px]"
            >
              <img src="/icon-1.png" alt="" className="w-5 h-5 object-contain" />
              Start Now
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white ml-1">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </Link>

          {/* Skip Intro */}
          <p className="font-arimo text-[#9CA3AF] text-[12px] mt-4 cursor-pointer hover:text-gray-600">
            Skip intro (auto-start in 5s)
          </p>
        </div>
      </main>
    </div>
  );
}

