'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { dailyAnswerService } from '@/lib/services';

interface AnswerData {
  id: string;
  title: string;
  paper: string;
  subject: string;
  marks: number;
  wordLimit: number;
  timeLimit: number;
  attempted: boolean;
  attemptCount: number;
}

export default function DailyMainsChallengePage() {
  const router = useRouter();
  const [data, setData] = useState<AnswerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    dailyAnswerService.getToday()
      .then(res => setData(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Auto-start countdown
  useEffect(() => {
    if (loading || error || !data) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (data.attempted) {
            router.push('/dashboard/daily-answer/challenge/attempt/results');
          } else {
            router.push('/dashboard/daily-answer/challenge');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, error, data, router]);

  if (loading) {
    return (
      <div className="flex flex-col bg-[#FAFBFE] font-arimo" style={{ height: '100%', overflow: 'hidden' }}>
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col bg-gray-50 font-arimo" style={{ height: '100%', overflow: 'hidden' }}>
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">No Mains Challenge Today</h2>
            <p className="text-gray-500">{error || "Check back later for today's challenge."}</p>
            <Link href="/dashboard" className="mt-4 inline-block text-blue-600 hover:underline">Back to Dashboard</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-gray-50 font-arimo" style={{ height: '100%', overflow: 'hidden' }}>
      <main className="flex-1 flex items-center justify-center p-4 md:p-6">
        <div
          className="relative bg-white rounded-[16px] flex flex-col items-center w-full max-w-[605px] mx-auto px-4 md:px-8"
          style={{
            boxShadow: '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -4px rgba(0, 0, 0, 0.1)',
            paddingTop: '32px',
            paddingBottom: '32px',
          }}
        >
          {/* Top Icon */}
          <img
            src="/pen-circle.png"
            alt="Pen"
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '26843500px',
              objectFit: 'contain',
              marginBottom: '24px',
            }}
          />

          {/* Title */}
          <h1
            className="font-bold text-[#101828] text-center mb-2"
            style={{ fontSize: '32px', lineHeight: '40px' }}
          >
            Daily Mains Challenge
          </h1>

          {/* Subtitle */}
          <div
            className="text-[#4A5565] text-center mb-6 px-12"
            style={{ fontSize: '14px', lineHeight: '20px' }}
          >
            <p>Sharpen your answer writing skills with today&apos;s carefully crafted question.</p>
            <p>Develop structure, clarity, and depth in your answers.</p>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-3 mb-8">
            {[data.paper, data.subject, `${data.marks} Marks`].map((tag) => (
              <span
                key={tag}
                className="flex items-center justify-center bg-[#EFF6FF] text-[#101828] rounded-full font-medium"
                style={{ padding: '6px 16px', fontSize: '14px' }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Stats Grid */}
          <div className="flex items-center justify-center mb-10 w-full max-w-sm" style={{ gap: '48px' }}>
            <div className="flex flex-col items-center" style={{ gap: '2px' }}>
              <span className="font-bold text-[#101828]" style={{ fontSize: '30px', lineHeight: '36px' }}>{data.timeLimit}</span>
              <span className="text-[#4A5565] font-normal" style={{ fontSize: '12px', lineHeight: '16px' }}>Minutes</span>
            </div>
            <div className="flex flex-col items-center" style={{ gap: '2px' }}>
              <span className="font-bold text-[#101828]" style={{ fontSize: '30px', lineHeight: '36px' }}>{data.marks}</span>
              <span className="text-[#4A5565] font-normal" style={{ fontSize: '12px', lineHeight: '16px' }}>Marks</span>
            </div>
            <div className="flex flex-col items-center" style={{ gap: '2px' }}>
              <span className="font-bold text-[#101828]" style={{ fontSize: '30px', lineHeight: '36px' }}>{data.wordLimit}</span>
              <span className="text-[#4A5565] font-normal" style={{ fontSize: '12px', lineHeight: '16px' }}>Word Limit</span>
            </div>
          </div>

          {/* Action Button */}
          {data.attempted ? (
            <Link href="/dashboard/daily-answer/challenge/attempt/results">
              <button
                className="w-[232px] h-[52px] bg-green-600 text-white rounded-[10px] hover:bg-green-700 transition-all flex items-center justify-center gap-2 mx-auto font-arimo font-bold text-[20px] leading-[24px]"
                style={{ marginTop: '10px' }}
              >
                View Results
              </button>
            </Link>
          ) : (
            <Link href="/dashboard/daily-answer/challenge">
              <button
                className="w-[232px] h-[52px] bg-[#101828] text-white rounded-[10px] hover:bg-[#1A1A1A] transition-all flex items-center justify-center gap-2 mx-auto font-arimo font-bold text-[20px] leading-[24px]"
                style={{ marginTop: '10px' }}
              >
                <img src="/icon-1.png" alt="" className="w-5 h-5 object-contain" />
                Start Now
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white ml-1">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </Link>
          )}

          <button
            type="button"
            onClick={() => {
              if (data.attempted) {
                router.push('/dashboard/daily-answer/challenge/attempt/results');
              } else {
                router.push('/dashboard/daily-answer/challenge');
              }
            }}
            className="text-[#6A7282] mt-4 font-normal hover:text-[#101828] transition-colors"
            style={{ fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Skip intro (auto-start in {countdown}s)
          </button>
        </div>
      </main>
    </div>
  );
}
