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

const ICON_BG = '#F3F4F6';

const icons: Record<string, string> = {
  study: '/📚.png',
  practice: '/🎯.png',
  editorial: '/📰.png',
  answer: '/answer-writing-hand.png',
};

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

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - clamp(90px, 5.78vw, 111px))', background: '#FAFBFE' }}>
      <main className="flex-1 flex items-center justify-center py-[clamp(1.25rem,2vw,2rem)] px-[clamp(1rem,2vw,3rem)]">
        <div className="card-elevated rounded-[clamp(8px,0.52vw,10px)]"
          style={{ width: 'clamp(700px,46.67vw,896px)', padding: 'clamp(1.4rem,1.6vw,2rem)', boxShadow: '0 24px 58px -30px rgba(15,23,42,0.24), 0 10px 26px -18px rgba(15,23,42,0.18), inset 0 1px 0 rgba(255,255,255,0.9)' }}>

          <div className="text-center mb-[clamp(1.1rem,1.4vw,1.6rem)]">
            <h1 className="font-arimo font-bold text-[#101828] mb-[clamp(0.5rem,0.625vw,0.75rem)]"
              style={{ fontSize: 'clamp(20px,1.25vw,24px)', lineHeight: 'clamp(28px,1.67vw,32px)' }}>
              What would you like to do next?
            </h1>
            <p className="font-arimo text-[#4A5565]"
              style={{ fontSize: 'clamp(13px,0.73vw,14px)', lineHeight: 'clamp(18px,1.04vw,20px)' }}>
              Smart recommendations based on your performance
            </p>
          </div>

          <div className="grid grid-cols-2 mb-[clamp(1.1rem,1.4vw,1.6rem)]"
            style={{ gap: 'clamp(0.9rem,1vw,1.1rem)' }}>
            {recommendations.map((item, index) => (
              <Link key={index} href={item.link}>
                <div className="bg-white border border-[#E5E7EB] rounded-[clamp(8px,0.52vw,10px)] hover:shadow-md transition-all cursor-pointer relative"
                  style={{ padding: 'clamp(1.1rem,1.2vw,1.4rem) clamp(1rem,1.1vw,1.3rem)' }}>
                  <div className="rounded-[clamp(12px,0.83vw,16px)] flex items-center justify-center mb-[clamp(1rem,1.25vw,1.5rem)] mx-auto"
                    style={{ width: 'clamp(52px,3.33vw,64px)', height: 'clamp(52px,3.33vw,64px)', background: ICON_BG }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={icons[item.type] || '/🎯.png'} alt={item.title}
                      style={{ width: 'clamp(24px,1.56vw,30px)', height: 'clamp(29px,1.88vw,36px)', objectFit: 'contain' }} />
                  </div>
                  <h3 className="font-arimo font-bold text-[#101828] text-center mb-[clamp(0.5rem,0.625vw,0.75rem)]"
                    style={{ fontSize: 'clamp(14px,0.83vw,16px)', lineHeight: 'clamp(20px,1.25vw,24px)' }}>
                    {item.title}
                  </h3>
                  <p className="font-arimo text-[#4A5565] text-center"
                    style={{ fontSize: 'clamp(12px,0.73vw,14px)', lineHeight: 'clamp(17px,1.04vw,20px)' }}>
                    {item.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="flex justify-center">
            <Link href="/dashboard">
              <button className="flex items-center justify-center gap-2 bg-white hover:opacity-70 transition-opacity font-arimo"
                style={{ height: '51.2px', borderRadius: '10px', border: '1.6px solid #2B7FFF', fontSize: '16px', fontWeight: 400, color: '#155DFC', padding: '0 20px', whiteSpace: 'nowrap' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="#155DFC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Back to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
