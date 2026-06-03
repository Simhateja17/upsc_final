'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { dailyMcqService } from '@/lib/services';

interface Recommendation {
  type: string;
  title: string;
  description: string;
  action: string;
  link: string;
}

const cardStyles: Record<string, { accent: string; iconSrc: string; badgeBg: string; badgeText: string; badgeDot: string }> = {
  study: {
    accent: '#FB2C36',
    iconSrc: '/books-stack.png',
    badgeBg: '#FEF2F2',
    badgeText: '#DC2626',
    badgeDot: '#DC2626',
  },
  practice: {
    accent: '#635BFF',
    iconSrc: '/target-icon.png',
    badgeBg: '#EFF6FF',
    badgeText: '#2563EB',
    badgeDot: '#2563EB',
  },
  editorial: {
    accent: '#F59E0B',
    iconSrc: '/newspaper-icon.png',
    badgeBg: '#EFF6FF',
    badgeText: '#2563EB',
    badgeDot: '#2563EB',
  },
  answer: {
    accent: '#22C55E',
    iconSrc: '/answer-writing-hand.png',
    badgeBg: '#F0FDF4',
    badgeText: '#16A34A',
    badgeDot: '#16A34A',
  },
};

const fallbackRecommendations: Recommendation[] = [
  {
    type: 'study',
    title: 'Review Weak Areas',
    description: 'Focus on concepts that need revision from today\'s test.',
    action: 'Do this first',
    link: '/dashboard/daily-mcq/review',
  },
  {
    type: 'practice',
    title: 'Practice More MCQs',
    description: 'Attempt targeted MCQs curated from your wrong answers.',
    action: 'Recommended',
    link: '/dashboard/mock-tests',
  },
  {
    type: 'editorial',
    title: 'Read Today\'s Editorial',
    description: 'Revise current affairs linked to today\'s questions.',
    action: 'Recommended',
    link: '/dashboard/daily-editorial',
  },
  {
    type: 'answer',
    title: 'Practice Answer Writing',
    description: 'Attempt a Mains question connected to today\'s concepts.',
    action: 'Optional',
    link: '/dashboard/daily-answer/challenge',
  },
];

export default function NextStepsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dailyMcqService.getRecommendations()
      .then(res => setRecommendations(res.data.recommendations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - clamp(90px, 5.78vw, 111px))', background: '#FAFBFE' }}>
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </main>
      </div>
    );
  }

  const items = recommendations.length > 0 ? recommendations : fallbackRecommendations;

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - clamp(90px, 5.78vw, 111px))', background: '#FAFBFE' }}>
      <main className="flex-1 flex items-center justify-center py-[clamp(1rem,1.6vw,1.75rem)] px-[clamp(1rem,2.5vw,4rem)]">
        <div
          className="rounded-xl"
          style={{
            width: 'min(100%, 1040px)',
            padding: 'clamp(1.25rem,1.8vw,2rem)',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
            boxShadow: '0 24px 58px -34px rgba(15,23,42,0.32), 0 10px 28px -22px rgba(15,23,42,0.22)',
          }}
        >
          <div className="text-center mb-[clamp(1.1rem,1.4vw,1.6rem)]">
            <h1
              className="font-arimo font-bold text-[#101828] mb-2"
              style={{ fontSize: 'clamp(22px,1.45vw,28px)', lineHeight: 'clamp(28px,1.85vw,36px)' }}
            >
              What would you like to do next?
            </h1>
            <p
              className="font-arimo font-semibold text-[#98A2B3]"
              style={{ fontSize: 'clamp(13px,0.78vw,15px)', lineHeight: '20px' }}
            >
              Smart recommendations based on your performance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 mb-[clamp(1.1rem,1.4vw,1.6rem)]" style={{ gap: 'clamp(0.85rem,1vw,1.1rem)' }}>
            {items.map((item, index) => {
              const style = cardStyles[item.type] || cardStyles.practice;

              return (
                <Link key={index} href={item.link} className="min-w-0">
                  <div
                    className="bg-white border border-[#E5E7EB] rounded-xl hover:-translate-y-0.5 transition-all cursor-pointer relative overflow-hidden"
                    style={{
                      minHeight: '154px',
                      padding: '22px 26px 20px',
                      boxShadow: '0 12px 28px -22px rgba(15,23,42,0.42)',
                    }}
                  >
                    <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '4px', background: style.accent }} />
                    <div className="mb-5 flex items-center" style={{ height: '30px' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={style.iconSrc} alt="" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                    </div>
                    <h3 className="font-arimo font-bold text-[#1F2937] mb-2" style={{ fontSize: '18px', lineHeight: '24px' }}>
                      {item.title}
                    </h3>
                    <p className="font-arimo font-semibold text-[#9CA3AF] mb-4" style={{ fontSize: '13px', lineHeight: '20px' }}>
                      {item.description}
                    </p>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full font-arimo font-bold"
                      style={{
                        height: '24px',
                        padding: '0 10px',
                        background: style.badgeBg,
                        color: style.badgeText,
                        fontSize: '12px',
                        lineHeight: '16px',
                      }}
                    >
                      <span style={{ width: '12px', height: '12px', borderRadius: 999, background: `radial-gradient(circle at 35% 35%, #60A5FA 0%, ${style.badgeDot} 62%, #1E3A8A 100%)`, flexShrink: 0 }} />
                      {item.action}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="flex justify-center">
            <Link href="/dashboard">
              <button
                className="flex items-center justify-center gap-2 bg-white hover:bg-[#F8FAFC] transition-colors font-arimo"
                style={{
                  height: '46px',
                  borderRadius: '10px',
                  border: '1px solid #D8DEE9',
                  boxShadow: '0 8px 22px -18px rgba(15,23,42,0.6)',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#374151',
                  padding: '0 28px',
                  whiteSpace: 'nowrap',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="#374151" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Back to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
