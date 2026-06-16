'use client';

import { useEffect, useRef, useState } from 'react';

/* ─────────────────────────────────────────────────────────────
   GeneratingTestModal
   - Pops out over a blurred + dimmed (not white) backdrop
   - Center navy circle "dribbles" through the 4 step emojis
   - Amber progress bar climbs toward 100% complete
   - 4 checklist steps light up one-by-one with green ✅ ticks
   - Speed is kept brisk; holds near the end until `isReady`,
     then snaps to 100% and fires `onComplete`.
   ───────────────────────────────────────────────────────────── */

type Props = {
  /** becomes true once the test id is back from the server */
  isReady: boolean;
  /** called once the animation has reached 100% complete */
  onComplete: () => void;
};

const STEPS = [
  { label: 'Analyzing your preferences...', emoji: '⚖️' },
  { label: 'Selecting relevant questions...', emoji: '📝' },
  { label: 'Preparing AI evaluation rubrics...', emoji: '✨' },
  { label: 'Your test is ready!', emoji: '✅' },
] as const;

export default function GeneratingTestModal({ isReady, onComplete }: Props) {
  const [progress, setProgress] = useState(0);
  const [dribble, setDribble] = useState(0); // index of center emoji while dribbling
  const completedRef = useRef(false);

  /* ── Progress driver ── */
  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => {
        // Hold just shy of the finish until the server is ready,
        // then race to 100%.
        const ceiling = isReady ? 100 : 88;
        if (p >= ceiling) return p;
        const step = isReady ? 4 : Math.max(1.4, (ceiling - p) * 0.08);
        return Math.min(ceiling, p + step);
      });
    }, 55);
    return () => clearInterval(id);
  }, [isReady]);

  /* ── Center emoji "dribble" — cycles only the non-final emojis
        (the green ✅ is reserved for completion) ── */
  useEffect(() => {
    const cycleCount = STEPS.length - 1; // exclude the final ✅
    const id = setInterval(() => setDribble((d) => (d + 1) % cycleCount), 340);
    return () => clearInterval(id);
  }, []);

  /* ── Fire completion once we hit 100% ── */
  useEffect(() => {
    if (progress >= 100 && !completedRef.current) {
      completedRef.current = true;
      const t = setTimeout(onComplete, 550);
      return () => clearTimeout(t);
    }
  }, [progress, onComplete]);

  const pct = Math.round(progress);
  const sliceEnd = (i: number) => (i + 1) * 25;
  const activeIndex = Math.min(STEPS.length - 1, Math.floor(progress / 25));
  // Center dribbles through the working emojis; the green ✅ only appears
  // once the whole process is finished (progress hits 100%).
  const centerEmoji = progress >= 100 ? STEPS[STEPS.length - 1].emoji : STEPS[dribble].emoji;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Generating your test"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        animation: 'gtm-fade 0.25s ease',
      }}
    >
      <div
        style={{
          width: 'min(440px, 92vw)',
          background: '#FFFFFF',
          borderRadius: '28px',
          padding: 'clamp(28px, 4vw, 40px) clamp(24px, 4vw, 40px)',
          boxShadow: '0 30px 80px -20px rgba(15, 23, 42, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          animation: 'gtm-pop 0.42s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
        }}
      >
        {/* ── Dribbling center emoji ── */}
        <div
          style={{
            position: 'relative',
            width: 88,
            height: 88,
            marginBottom: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* soft halo */}
          <span
            style={{
              position: 'absolute',
              inset: -8,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(250,204,21,0.28), transparent 70%)',
              animation: 'gtm-pulse 1.8s ease-in-out infinite',
            }}
          />
          <div
            style={{
              position: 'relative',
              width: 88,
              height: 88,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 50% 35%, #1E293B, #0F172B)',
              border: '3px solid #FCD34D',
              boxShadow: '0 12px 28px -8px rgba(15,23,42,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              key={centerEmoji + dribble}
              style={{ fontSize: 38, lineHeight: 1, animation: 'gtm-dribble 0.34s ease' }}
            >
              {centerEmoji}
            </span>
          </div>
        </div>

        {/* ── Title (no subtitle — steps live below) ── */}
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-inter), Inter, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(20px, 2.4vw, 26px)',
            color: '#0F172B',
            letterSpacing: '-0.01em',
          }}
        >
          Generating Your Test
        </h2>

        {/* ── Progress bar ── */}
        <div
          style={{
            width: '100%',
            height: 10,
            borderRadius: 999,
            background: '#EEF2F6',
            overflow: 'hidden',
            marginTop: 22,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              borderRadius: 999,
              background: 'linear-gradient(90deg, #FDC700, #FF8904, #FF6900)',
              transition: 'width 0.25s ease',
            }}
          />
        </div>
        <div
          style={{
            marginTop: 10,
            fontFamily: 'var(--font-inter), Inter, sans-serif',
            fontWeight: 600,
            fontSize: 13,
            color: '#64748B',
          }}
        >
          {pct}% complete
        </div>

        {/* ── Checklist steps ── */}
        <div
          style={{
            width: '100%',
            marginTop: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {STEPS.map((step, i) => {
            const done = i === STEPS.length - 1 ? progress >= 100 : progress >= sliceEnd(i);
            const active = !done && i === activeIndex;
            const pending = !done && !active;
            return (
              <div
                key={step.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  opacity: pending ? 0.45 : 1,
                  transition: 'opacity 0.3s ease',
                }}
              >
                {/* status bullet */}
                <span
                  style={{
                    flexShrink: 0,
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 15,
                    lineHeight: 1,
                    background: done ? '#DCFCE7' : active ? '#FEF3C7' : '#F1F5F9',
                    transition: 'background 0.3s ease',
                  }}
                >
                  {done ? (
                    '✅'
                  ) : active ? (
                    <span style={{ display: 'flex', animation: 'gtm-spin 1.1s linear infinite' }}>✨</span>
                  ) : (
                    <span style={{ opacity: 0.6 }}>{step.emoji}</span>
                  )}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-inter), Inter, sans-serif',
                    fontWeight: done || active ? 700 : 500,
                    fontSize: 14,
                    color: done ? '#0F172B' : active ? '#B45309' : '#94A3B8',
                    textAlign: 'left',
                  }}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes gtm-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes gtm-pop {
          0%   { opacity: 0; transform: scale(0.82) translateY(12px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes gtm-dribble {
          0%   { opacity: 0; transform: scale(0.6) rotate(-12deg); }
          60%  { opacity: 1; transform: scale(1.12) rotate(4deg); }
          100% { opacity: 1; transform: scale(1) rotate(0); }
        }
        @keyframes gtm-pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50%      { transform: scale(1.12); opacity: 1; }
        }
        @keyframes gtm-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
