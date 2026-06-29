'use client';

import React from 'react';
import Link from 'next/link';
import { NEXT_STEP_CARDS } from '@/components/SmartNextStepsModal';

const ArrowRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export default function NextStepsPage() {
  return (
    <div className="flex flex-col overflow-y-auto" style={{ minHeight: 'calc(100vh - clamp(90px, 5.78vw, 111px))', background: '#FAFBFE' }}>
      <style>{`
        .ns-card{padding:18px;border-radius:16px;border:1px solid #E6EAF2;background:#fff;transition:all .2s ease;cursor:pointer;position:relative;overflow:hidden;display:flex;flex-direction:column;height:100%;}
        .ns-card:hover{transform:translateY(-2px);box-shadow:0 12px 28px -16px rgba(11,20,38,.18);}
        .ns-card .ns-glow{position:absolute;right:-30px;top:-30px;width:120px;height:120px;border-radius:50%;opacity:.12;pointer-events:none;}
        .ns-chip{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;font-size:11.5px;font-weight:700;border:1px solid transparent;}
        .ns-pulse{width:7px;height:7px;border-radius:50%;background:currentColor;animation:nsPulse 1.6s infinite;}
        @keyframes nsPulse{0%{box-shadow:0 0 0 0 rgba(245,197,24,.55)}70%{box-shadow:0 0 0 6px rgba(245,197,24,0)}100%{box-shadow:0 0 0 0 rgba(245,197,24,0)}}
        .ns-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:46px;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;transition:all .18s ease;width:100%;}
        .ns-btn-ghost{background:#fff;color:#0B1426;border:1px solid #E2E6EF;}
        .ns-btn-ghost:hover{background:#F7F9FC;}
        .ns-btn-ink{background:#0B1426;color:#fff;border:1px solid #0B1426;}
        .ns-btn-ink:hover{background:#13203A;}
      `}</style>

      <main className="flex-1 flex items-center justify-center py-[clamp(1.25rem,2vw,2.5rem)] px-[clamp(1rem,2.5vw,4rem)]">
        <div
          className="w-full rounded-[20px] bg-white"
          style={{ maxWidth: 720, boxShadow: '0 1px 0 rgba(11,20,38,.04), 0 2px 6px rgba(11,20,38,.04), 0 30px 60px -28px rgba(11,20,38,.22)', border: '1px solid #EEF1F6' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between" style={{ padding: '24px 28px 20px', borderBottom: '1px solid #F0F2F6' }}>
            <div>
              <div className="font-arimo font-bold" style={{ fontSize: 11.5, letterSpacing: '0.16em', color: '#B7860B' }}>
                ✨ SMART NEXT STEPS
              </div>
              <h1 className="font-arimo font-bold tracking-tight" style={{ fontSize: 'clamp(19px,1.3vw,22px)', color: '#0B1426', marginTop: 6 }}>
                Personalized for your weak areas
              </h1>
              <p className="font-arimo" style={{ fontSize: 13, color: '#6B7689', marginTop: 4 }}>
                Curated for you based on today&apos;s performance.
              </p>
            </div>
            <Link href="/dashboard/daily-mcq/results" aria-label="Close" className="flex-shrink-0">
              <span className="inline-flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 11, background: '#fff', border: '1px solid rgba(15,26,53,.10)', color: '#0B1226' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </span>
            </Link>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12, padding: 24 }}>
            {NEXT_STEP_CARDS.map((card) => (
              <Link key={card.title} href={card.href} className="min-w-0">
                <div className="ns-card font-arimo">
                  <div className="ns-glow" style={{ background: card.accent }} />
                  <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12, background: card.iconBg, color: card.iconColor, fontSize: 18 }}>
                    {card.icon}
                  </div>
                  <div className="font-bold" style={{ fontSize: 15.5, lineHeight: 1.25, color: '#0B1426', marginTop: 12 }}>
                    {card.title}
                  </div>
                  <div style={{ fontSize: 12.5, lineHeight: '20px', color: '#6B7689', marginTop: 4, flex: 1 }}>
                    {card.desc}
                  </div>
                  <div className="flex items-center justify-between" style={{ marginTop: 12 }}>
                    <span className="ns-chip" style={{ background: card.chipBg, color: card.chipColor, borderColor: card.chipBorder }}>
                      {card.pulse && <span className="ns-pulse" />}
                      {card.chip}
                    </span>
                    <span className="font-bold inline-flex items-center gap-1" style={{ fontSize: 12.5, color: card.iconColor }}>
                      {card.cta} <ArrowRight />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Footer */}
          <div className="grid grid-cols-2" style={{ gap: 12, padding: '0 24px 24px' }}>
            <Link href="/dashboard/daily-mcq/results" className="min-w-0">
              <button type="button" className="ns-btn ns-btn-ghost font-arimo">Maybe Later</button>
            </Link>
            <Link href="/dashboard" className="min-w-0">
              <button type="button" className="ns-btn ns-btn-ink font-arimo">
                <span aria-hidden="true" style={{ fontSize: 16, lineHeight: 1 }}>🏠</span>
                Back to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
