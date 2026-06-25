'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { dailyMcqService, dashboardService } from '@/lib/services';

interface MCQData {
  id: string;
  title: string;
  topic: string;
  tags: string[];
  questionCount: number;
  timeLimit: number;
  totalMarks: number;
  attempted: boolean;
}

// "20th June 2026" style date for the landing header.
function formatChallengeDate(date: Date) {
  const day = date.getDate();
  const suffix = day % 10 === 1 && day !== 11 ? 'st'
    : day % 10 === 2 && day !== 12 ? 'nd'
    : day % 10 === 3 && day !== 13 ? 'rd'
    : 'th';
  const month = date.toLocaleString('en-US', { month: 'long' });
  return `${day}${suffix} ${month} ${date.getFullYear()}`;
}

const DAILY_MCQ_SUBJECTS = [
  { label: 'History', icon: '🏛️' },
  { label: 'Polity', icon: '⚖️' },
  { label: 'Economy', icon: '📈' },
  { label: 'Environment & Ecology', icon: '🌿' },
  { label: 'Science & Technology', icon: '🔬' },
  { label: 'Geography', icon: '🌍' },
  { label: 'Current Affairs', icon: '📰' },
];

export default function DailyMcqIntroPage() {
  const router = useRouter();
  const [mcq, setMcq] = useState<MCQData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streak, setStreak] = useState<number | null>(null);

  const FIXED_QUESTION_COUNT = 10;
  const FIXED_TIME_LIMIT = 10;
  const FIXED_TOTAL_MARKS = 20;

  useEffect(() => {
    dailyMcqService.getToday()
      .then(res => setMcq(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Current streak for the landing screen (best-effort; landing still works without it).
  useEffect(() => {
    dashboardService.getStreak()
      .then(res => setStreak(Number(res.data?.currentStreak ?? 0)))
      .catch(() => setStreak(null));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: '#FAFBFE' }}>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </main>
      </div>
    );
  }

  if (error || !mcq) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: '#FAFBFE' }}>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">No MCQ Challenge Today</h2>
            <p className="text-gray-500">{error || 'Check back later for today\'s challenge.'}</p>
            <Link href="/dashboard" className="mt-4 inline-block text-blue-600 hover:underline">Back to Dashboard</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - clamp(90px, 5.78vw, 111px))', background: '#FAFBFE' }}>
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
       <div className="w-full max-w-[605px] flex flex-col">
        {/* Header row – live status + date + streak */}
        <div className="flex items-center justify-between gap-3 mb-3 px-1">
          <div className="flex items-center gap-2 font-arimo min-w-0">
            <span aria-hidden="true" className="relative flex h-2.5 w-2.5 flex-shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22C55E] opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#16A34A]" />
            </span>
            <span className="text-[14px] leading-[20px] text-[#344054] truncate">Today&apos;s Challenge is live</span>
            <span className="text-[14px] leading-[20px] text-[#98A2B3] whitespace-nowrap">· {formatChallengeDate(new Date())}</span>
          </div>
          {streak !== null && streak > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FCD34D] bg-[#FFFBEB] px-3 py-1.5 font-arimo font-bold text-[13px] leading-[16px] text-[#B45309] whitespace-nowrap flex-shrink-0">
              <span aria-hidden="true">🔥</span>
              {streak}-day streak
            </span>
          )}
        </div>

        {/* Intro Card */}
        <div className="card-elevated rounded-[18px] p-5 sm:p-6 text-center" style={{ width: '100%', maxWidth: '605px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 26px 60px -28px rgba(15, 23, 42, 0.28), 0 10px 24px -18px rgba(15, 23, 42, 0.18), inset 0 1px 0 rgba(255,255,255,0.85)' }}>
          {/* Icon */}
          <div className="flex justify-center mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/target-icon.png" alt="Target Icon" className="w-[40px] h-[40px] object-contain" />
          </div>

          <h1 className="font-arimo font-bold text-[#101828] text-[24px] leading-[30px] mb-1.5">
            Daily MCQ Challenge
          </h1>

          <p className="font-arimo text-[#667085] text-[14px] leading-[20px] mb-4">
            Sharpen your knowledge with focused practice questions
          </p>

          <div className="flex max-w-[520px] flex-wrap items-center justify-center gap-2 mb-5">
            {DAILY_MCQ_SUBJECTS.map((subject) => (
              <span
                key={subject.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-1 font-arimo text-[13px] leading-[18px] text-[#344054] whitespace-nowrap transition-colors hover:bg-[#F2F4F7] hover:border-[#D0D5DD]"
              >
                <span aria-hidden="true" className="text-[15px] leading-none">{subject.icon}</span>
                {subject.label}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 w-full max-w-[360px] mx-auto mb-4">
            <div className="flex flex-col items-center rounded-[12px] bg-[#F9FAFB] border border-[#E5E7EB] py-2.5">
              <div className="font-arimo font-bold text-[#101828] text-[26px] leading-tight max-md:text-[22px]">{FIXED_QUESTION_COUNT}</div>
              <div className="font-arimo text-[#667085] text-[12px] mt-0.5">Questions</div>
            </div>
            <div className="flex flex-col items-center rounded-[12px] bg-[#F9FAFB] border border-[#E5E7EB] py-2.5">
              <div className="font-arimo font-bold text-[#101828] text-[26px] leading-tight max-md:text-[22px]">{FIXED_TIME_LIMIT}</div>
              <div className="font-arimo text-[#667085] text-[12px] mt-0.5">Minutes</div>
            </div>
            <div className="flex flex-col items-center rounded-[12px] bg-[#F9FAFB] border border-[#E5E7EB] py-2.5">
              <div className="font-arimo font-bold text-[#101828] text-[26px] leading-tight max-md:text-[22px]">{FIXED_TOTAL_MARKS}</div>
              <div className="font-arimo text-[#667085] text-[12px] mt-0.5">Max Marks</div>
            </div>
          </div>

          <div className="w-full max-w-[380px] rounded-[12px] border border-[#BBF7D0] bg-[#F0FDF4] p-3 mb-5 text-left">
            <div className="font-arimo font-bold text-[#15803D] text-[12px] uppercase tracking-[0.5px] mb-2">
              Marking Pattern
            </div>
            <div className="flex items-center justify-between font-arimo text-[13px] mb-1.5">
              <span className="text-[#166534]">Correct answer</span>
              <span className="font-bold text-[#166534]">+2 marks</span>
            </div>
            <div className="flex items-center justify-between font-arimo text-[13px]">
              <span className="text-[#B91C1C]">Wrong answer</span>
              <span className="font-bold text-[#B91C1C]">-0.66 marks</span>
            </div>
          </div>

          {mcq.attempted ? (
            <Link href="/dashboard/daily-mcq/results">
              <button className="w-[232px] h-[48px] bg-green-600 text-white rounded-[10px] hover:bg-green-700 transition-all flex items-center justify-center gap-2 mx-auto font-arimo font-bold text-[20px] leading-[24px]">
                View Results
              </button>
            </Link>
          ) : (
            <div className="w-full max-w-[380px]">
              <button
                type="button"
                onClick={() => router.push('/dashboard/daily-mcq/challenge')}
                className="w-[280px] h-[48px] bg-[#101828] hover:bg-[#1A1A1A] text-white rounded-[10px] transition-all flex items-center justify-center gap-2 mx-auto font-arimo font-bold text-[18px] leading-[24px]"
                aria-label="Start today's daily MCQ challenge"
              >
                Start Today&apos;s Challenge
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
       </div>
      </main>
    </div>
  );
}
