'use client';

import React from 'react';
import Link from 'next/link';

export type HeroStat = {
  value: string;
  label: string;
  color: string;
};

interface DashboardPageHeroProps {
  badgeIcon?: React.ReactNode;
  badgeText: string;
  title: React.ReactNode;
  subtitle: string;
  stats: HeroStat[];
  rightElement?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  heroBorderRadius?: number | string;
  heroHeight?: number | string;
  heroMinHeight?: number | string;
  heroMarginInline?: number | string;
}

const DefaultYouTubeButton = (
  <a
    href="https://www.youtube.com/@RiseWithJeet"
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-2 font-arimo font-semibold text-white"
    style={{
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '26843500px',
      padding: 'clamp(8px, 0.75vw, 10px) clamp(16px, 1.5vw, 20px)',
      fontSize: 'clamp(12px, 1.05vw, 14px)',
      textDecoration: 'none',
    }}
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43z" fill="#FF0000"/>
      <path d="M9.75 15.02l5.75-3.27-5.75-3.27v6.54z" fill="white"/>
    </svg>
    @RiseWithJeet
  </a>
);

export default function DashboardPageHero({
  badgeIcon,
  badgeText,
  title,
  subtitle,
  stats,
  rightElement,
  backHref = '/dashboard',
  backLabel = 'Back to Dashboard',
  heroBorderRadius = 0,
  heroHeight = '352px',
  heroMinHeight,
  heroMarginInline = 0,
}: DashboardPageHeroProps) {
  const right = rightElement !== undefined ? rightElement : DefaultYouTubeButton;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: '#0F131F',
        padding: '24px 26px 22px',
        marginBottom: 16,
        height: heroHeight,
        minHeight: heroMinHeight,
        marginInline: heroMarginInline,
        borderRadius: heroBorderRadius,
      }}
    >
      {/* Dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,.035) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Top bar */}
      <div
        className="relative z-10"
        style={{ marginBottom: '12px', paddingInline: 'clamp(8px, 1vw, 14px)' }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            gap: 'clamp(8px, 1vw, 14px)',
            width: '100%',
          }}
        >
          <div style={{ justifySelf: 'start', minWidth: 0 }}>
            <Link
              href={backHref}
              className="flex items-center gap-2 font-arimo font-medium text-white/60 hover:text-white transition-colors"
              style={{ fontSize: 'clamp(12px, 1vw, 14px)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {backLabel}
            </Link>
          </div>

          <div
            className="flex items-center gap-2 font-arimo font-semibold text-[#e8a820]"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '26843500px',
              padding: 'clamp(6px, 0.6vw, 8px) clamp(14px, 1.5vw, 20px)',
              fontSize: 'clamp(11px, 0.9vw, 13px)',
              letterSpacing: '0.5px',
              whiteSpace: 'nowrap',
            }}
          >
            {badgeIcon}
            {badgeText}
          </div>

          <div style={{ justifySelf: 'end', minWidth: 0 }}>
            {right}
          </div>
        </div>
      </div>

      {/* Centered content */}
      <div
        className="relative z-10 flex flex-col items-center"
        style={{ maxWidth: '860px', margin: '0 auto' }}
      >
        <h1
          className="text-center font-semibold"
          style={{
            color: '#FFFFFF',
            textAlign: 'center',
            fontFamily: '"Cormorant Garamond", var(--font-cormorant), serif',
            fontSize: '48px',
            fontStyle: 'normal',
            fontWeight: 600,
            lineHeight: '52.8px',
            marginBottom: 'clamp(10px, 1vw, 16px)',
          }}
        >
          {title}
        </h1>

        <p
          className="font-arimo text-center"
          style={{
            fontSize: 'clamp(13px, 1.2vw, 16px)',
            lineHeight: 'clamp(20px, 1.8vw, 24px)',
            color: 'rgba(255,255,255,0.5)',
            maxWidth: '640px',
            marginBottom: '18px',
          }}
        >
          {subtitle}
        </p>

        {/* Stats strip */}
        <div
          className="flex gap-0 rounded-[12px] overflow-hidden"
          style={{ border: '0.8px solid rgba(255,255,255,0.1)' }}
        >
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="flex-1 text-center"
              style={{
                background: 'rgba(255,255,255,0.05)',
                borderRight: i < stats.length - 1 ? '0.8px solid rgba(255,255,255,0.08)' : undefined,
                padding: '10px 16px',
              }}
            >
              <div
                className="font-arimo font-bold leading-none"
                style={{ fontSize: 'clamp(20px, 2vw, 28px)', color: stat.color }}
              >
                {stat.value}
              </div>
              <div
                className="font-arimo font-bold tracking-[0.8px] uppercase mt-[3px]"
                style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)' }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
