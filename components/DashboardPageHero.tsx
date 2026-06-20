'use client';

import React from 'react';
import Link from 'next/link';
import PageHeroBackground from '@/components/PageHeroBackground';

export type HeroStat = {
  value: React.ReactNode;
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
  contentShiftY?: number | string;
  titleMarginBottom?: number | string;
  heroBackground?: string;
  heroBackgroundImage?: string;
  heroBackgroundSize?: string;
  heroBackgroundPosition?: string;
  showDotGrid?: boolean;
  statsBorderRadius?: number | string;
  enforceUniformLayout?: boolean;
  buttons?: React.ReactNode;
}

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
  contentShiftY = 0,
  titleMarginBottom = '6px',
  heroBackground = '#0F131F',
  heroBackgroundImage,
  heroBackgroundSize = 'cover',
  heroBackgroundPosition = 'center',
  showDotGrid = true,
  statsBorderRadius = 12,
  enforceUniformLayout = true,
  buttons,
}: DashboardPageHeroProps) {
  const right = rightElement;
  const canonicalHeroHeight = '352px';
  const effectiveHeroHeight = enforceUniformLayout ? canonicalHeroHeight : heroHeight;
  const effectiveContentShiftY = enforceUniformLayout ? 0 : contentShiftY;
  const effectiveTitleMarginBottom = enforceUniformLayout ? '6px' : titleMarginBottom;
  const effectiveStatsBorderRadius = enforceUniformLayout ? 12 : statsBorderRadius;

  return (
    <PageHeroBackground
      className="flex flex-col"
      showGrid={showDotGrid}
      style={{
        padding: '20px 26px 18px',
        marginBottom: 16,
        height: effectiveHeroHeight,
        minHeight: enforceUniformLayout ? canonicalHeroHeight : heroMinHeight ?? heroHeight,
        marginInline: heroMarginInline,
        borderRadius: heroBorderRadius,
        // Allow callers to override background for special cases
        ...(heroBackgroundImage
          ? {
              backgroundImage: heroBackgroundImage,
              backgroundSize: heroBackgroundSize,
              backgroundPosition: heroBackgroundPosition,
            }
          : heroBackground !== '#0F131F'
          ? { backgroundColor: heroBackground }
          : {}),
      }}
    >

      {/* Top bar */}
      <div
        className="relative z-10"
        style={{ marginBottom: '8px', paddingInline: 'clamp(8px, 1vw, 14px)' }}
      >
        <div
          className="flex flex-col items-start gap-2 w-full sm:grid sm:items-center sm:gap-[clamp(8px,1vw,14px)] sm:[grid-template-columns:1fr_auto_1fr]"
        >
          <div className="justify-self-start min-w-0">
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
            className="flex items-center gap-2 font-arimo font-semibold text-[#E8B84B] self-center sm:self-auto"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '26843500px',
              padding: 'clamp(6px, 0.6vw, 8px) clamp(14px, 1.5vw, 20px)',
              fontSize: 'clamp(11px, 0.9vw, 13px)',
              letterSpacing: '0.5px',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
            }}
          >
            {badgeIcon}
            {badgeText}
          </div>

          <div className={`justify-self-end min-w-0 ${right ? 'block' : 'hidden sm:block'}`}>
            {right}
          </div>
        </div>
      </div>

      {/* Content area – fills remaining space and keeps stats pinned to a fixed baseline */}
      <div
        className="relative z-10 flex flex-col items-center flex-1"
        style={{ maxWidth: '860px', margin: '0 auto', width: '100%' }}
      >
        {/* Title + subtitle – centered in upper area; bottom space reserved for stats strip */}
        <div
          className="flex flex-col items-center justify-center"
          style={{
            flex: 1,
            width: '100%',
            paddingBottom: '88px',
            transform: `translateY(${typeof effectiveContentShiftY === 'number' ? `${effectiveContentShiftY}px` : effectiveContentShiftY})`,
          }}
        >
          <h1
            className="hero-title text-center font-semibold"
            style={{
              color: '#FFF',
              textAlign: 'center',
              fontFamily: 'var(--font-cormorant-garamond), "Cormorant Garamond", Georgia, serif',
              fontSize: 'clamp(30px, 6.2vw, 64px)',
              fontStyle: 'normal',
              fontWeight: 600,
              lineHeight: 1.1,
              marginBottom: typeof effectiveTitleMarginBottom === 'number' ? `${effectiveTitleMarginBottom}px` : effectiveTitleMarginBottom,
            }}
          >
            {title}
          </h1>

          <p
            className="font-arimo text-center"
            style={{
              fontSize: 'clamp(12px, 1vw, 16px)',
              lineHeight: '1.4',
              color: 'rgba(255,255,255,0.5)',
              maxWidth: '780px',
              marginBottom: buttons ? '30px' : 0,
            }}
          >
            {subtitle}
          </p>

          {buttons && (
            <div
              className="relative z-20 flex flex-wrap items-center justify-center gap-3"
              style={{ marginTop: 0, transform: 'translateY(18px)', pointerEvents: 'auto' }}
            >
              {buttons}
            </div>
          )}
        </div>

        {/* Stats strip – anchored for consistent cross-page vertical placement */}
        <div
          className="w-full flex gap-0 overflow-hidden"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            border: '0.8px solid rgba(255,255,255,0.1)',
            borderRadius: typeof effectiveStatsBorderRadius === 'number' ? `${effectiveStatsBorderRadius}px` : effectiveStatsBorderRadius,
            flexShrink: 0,
          }}
        >
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="flex-1 text-center"
              style={{
                background: '#0D1121',
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
      <style>{`.hero-title * { font-style: normal !important; }`}</style>
    </PageHeroBackground>
  );
}
