'use client';

import { ReactNode } from 'react';

interface WritingTimerProps {
  /** Seconds remaining on the countdown. */
  timeLeft: number;
  /** Full duration in seconds, used to draw the ring progress. */
  totalSeconds: number;
  /** Small status caption under the time (e.g. "in progress", "minutes left"). */
  statusLabel: string;
  /** Control buttons rendered in the footer row (Pause/Resume, Reset, …). */
  children?: ReactNode;
}

export const formatWritingTime = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

/**
 * Shared writing-timer watch used by both the Daily Mains Challenge and the
 * Mains Mock Test so the countdown UI stays uniform across modules. This is the
 * canonical timer design — do not fork a new one.
 */
export default function WritingTimer({ timeLeft, totalSeconds, statusLabel, children }: WritingTimerProps) {
  const timerPct = totalSeconds > 0 ? (timeLeft / totalSeconds) * 100 : 0;
  const R = 82;
  const C = 2 * Math.PI * R;

  return (
    <div
      className="bg-white rounded-[24px] flex flex-col items-center"
      style={{ padding: '24px', boxShadow: '0 1px 2px rgba(15,23,42,.04), 0 8px 24px rgba(15,23,42,.06), inset 0 0 0 1px #E6E8EE' }}
    >
      <div className="uppercase text-[#6B7280] mb-3" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em' }}>
        Writing Timer
      </div>

      <div className="relative flex items-center justify-center mb-4" style={{ width: '180px', height: '180px' }}>
        <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="90" cy="90" r={R} fill="none" stroke="#E6E8EE" strokeWidth="5" />
          <circle
            cx="90" cy="90" r={R} fill="none"
            stroke={timeLeft === 0 ? '#EF4444' : '#F5B800'}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - timerPct / 100)}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="font-bold" style={{ fontSize: '32px', color: '#0B1020', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontVariantNumeric: 'tabular-nums' }}>
            {formatWritingTime(timeLeft)}
          </span>
          <span className="uppercase text-[#6B7280]" style={{ fontSize: '9px', marginTop: '2px', letterSpacing: '0.1em' }}>
            {statusLabel}
          </span>
        </div>
      </div>

      {children && <div className="flex gap-2 w-full">{children}</div>}
    </div>
  );
}
