'use client';

import React from 'react';
import Link from 'next/link';

export type SubjectChoiceCardProps = {
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  iconBg: string;
  accentColor: string;
  title: string;
  meta: string;
  topRight?: React.ReactNode;
  statusLine?: React.ReactNode;
  statusLineColor?: string;
  progressPercent: number;
  progressColor?: string;
  footerLeft?: React.ReactNode;
  footerLeftColor?: string;
  footerRight: React.ReactNode;
  footerRightColor?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

/**
 * Shared "choose a subject" card used by the flashcards, mindmap and
 * spaced-repetition dashboards so all three look identical: white card,
 * pastel icon square, hover accent bar, and a fixed 190px height. The title
 * truncates to a single line (with the full name in a tooltip) so long
 * subject names never wrap and push the footer out of the fixed-height card.
 */
export default function SubjectChoiceCard({
  href,
  onClick,
  disabled,
  icon,
  iconBg,
  accentColor,
  title,
  meta,
  topRight,
  statusLine,
  statusLineColor = '#8A94A6',
  progressPercent,
  progressColor = '#16A34A',
  footerLeft,
  footerLeftColor = '#16A34A',
  footerRight,
  footerRightColor = '#EF4444',
  onMouseEnter,
  onMouseLeave,
}: SubjectChoiceCardProps) {
  const content = (
    <>
      <div className="subject-choice-accent" style={{ background: accentColor }} />
      <div className="flex items-start justify-between gap-3">
        <span
          aria-hidden
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: 48, height: 48, borderRadius: 14, background: iconBg, fontSize: 24, lineHeight: 1 }}
        >
          {icon}
        </span>
        {topRight && <div className="flex items-center gap-1.5 flex-shrink-0">{topRight}</div>}
      </div>

      <h3
        className="mt-3 truncate"
        title={title}
        style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 16, lineHeight: '20px', color: '#22304D' }}
      >
        {title}
      </h3>

      <p className="mt-1 truncate" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 11, lineHeight: '15px', color: '#8A94A6' }}>
        {meta}
      </p>

      <div className="mt-auto">
        {statusLine && (
          <div className="mb-1.5 truncate" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 12, lineHeight: '16px', color: statusLineColor }}>
            {statusLine}
          </div>
        )}
        <div className="h-[4px] w-full rounded-full" style={{ background: 'rgba(0,0,0,0.08)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${progressPercent}%`, background: progressColor }} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          {footerLeft && (
            <span className="truncate" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 12, lineHeight: '16px', color: footerLeftColor, whiteSpace: 'nowrap' }}>
              {footerLeft}
            </span>
          )}
          <span className="flex-shrink-0" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 12, lineHeight: '16px', color: footerRightColor, whiteSpace: 'nowrap', marginLeft: footerLeft ? 0 : 'auto' }}>
            {footerRight}
          </span>
        </div>
      </div>
    </>
  );

  const className = 'subject-choice-card block rounded-[16px] p-5 text-left flex flex-col';
  const style = { ['--subject-choice-border']: '#E4EAF5', background: '#FFFFFF', height: 190 } as React.CSSProperties;

  if (href) {
    return (
      <Link href={href} className={className} style={style} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {content}
    </button>
  );
}

export function SubjectChoiceCardStyles() {
  return (
    <style>{`
      .subject-choice-card{position:relative;overflow:hidden;border:1px solid var(--subject-choice-border);transition:transform .3s cubic-bezier(.4,0,.2,1),box-shadow .3s cubic-bezier(.4,0,.2,1),border-color .3s cubic-bezier(.4,0,.2,1);}
      .subject-choice-card:hover{transform:translateY(-3px);box-shadow:0 4px 24px rgba(0,0,0,.08),0 1px 4px rgba(0,0,0,.04);border-color:transparent;}
      .subject-choice-accent{position:absolute;top:0;left:0;right:0;height:3px;opacity:0;transition:opacity .3s;z-index:2;}
      .subject-choice-card:hover .subject-choice-accent{opacity:1;}
    `}</style>
  );
}
