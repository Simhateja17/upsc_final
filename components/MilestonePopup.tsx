'use client';

import { useEffect, useState } from 'react';
import ConfettiBurst from './ConfettiBurst';

export type MilestoneType = 'streak' | 'tests-completed' | 'rank' | 'study-hours';

interface MilestonePopupProps {
  isOpen: boolean;
  onClose: () => void;
  type?: MilestoneType;
  value?: string | number;
  title?: string;
  description?: string;
  subtitle?: string;
  icon?: string;
}

const defaultConfig: Record<MilestoneType, { icon: string; subtitle: string; color: string }> = {
  streak: {
    icon: '🔥',
    subtitle: 'Day streak — keep it up!',
    color: '#F59E0B',
  },
  'tests-completed': {
    icon: '📝',
    subtitle: 'Tests completed — amazing work!',
    color: '#3B82F6',
  },
  rank: {
    icon: '🏆',
    subtitle: 'Rank achieved — keep pushing!',
    color: '#F59E0B',
  },
  'study-hours': {
    icon: '⏰',
    subtitle: 'Hours studied — incredible focus!',
    color: '#8B5CF6',
  },
};

export default function MilestonePopup({
  isOpen,
  onClose,
  type = 'streak',
  value = 30,
  title,
  description,
  subtitle,
  icon,
}: MilestonePopupProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const config = defaultConfig[type];

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const displayTitle = title ?? 'Streak milestone!';
  const displayDescription =
    description ??
    `You've studied for ${value} days in a row. You're in the top 5% of aspirants on the platform.`;
  const displaySubtitle = subtitle ?? config.subtitle;
  const displayIcon = icon ?? config.icon;

  return (
    <>
      <ConfettiBurst active={showConfetti} />
      <div
        className="fixed inset-0 z-[700] flex items-center justify-center p-4"
        style={{
          background: 'rgba(10, 14, 26, 0.75)',
          backdropFilter: 'blur(8px)',
        }}
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-[420px] rounded-[20px] overflow-hidden"
          style={{
            background: '#131827',
            boxShadow: '0 24px 60px rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.25)',
            animation: 'milestoneFadeUp 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 pb-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                  style={{ background: 'rgba(245, 158, 11, 0.15)' }}
                >
                  🎉
                </div>
                <h2
                  className="text-white font-bold text-lg"
                  style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                >
                  {displayTitle}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/10 transition-all duration-200 text-sm cursor-pointer border-none"
                style={{ background: 'transparent' }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p
              className="mt-3 text-sm leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              {displayDescription}
            </p>
          </div>

          {/* Milestone Stat Card */}
          <div className="px-6 py-5">
            <div
              className="rounded-[16px] p-6 flex flex-col items-center justify-center gap-1"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <div className="flex items-center gap-2">
                <span className="text-3xl">{displayIcon}</span>
                <span
                  className="text-5xl font-bold"
                  style={{
                    color: config.color,
                    fontFamily: 'Inter, system-ui, sans-serif',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {value}
                </span>
              </div>
              <p
                className="text-sm mt-1"
                style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                {displaySubtitle}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 pt-0 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-[12px] text-sm font-semibold cursor-pointer transition-all duration-200 hover:opacity-90"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              Close
            </button>
            <button
              onClick={() => {
                // Placeholder for share functionality
                alert('Share feature coming soon!');
              }}
              className="flex-1 py-2.5 rounded-[12px] text-sm font-semibold cursor-pointer transition-all duration-200 hover:opacity-90"
              style={{
                background: '#F5B041',
                color: '#131827',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              Share on 𝕏
            </button>
          </div>
        </div>

        <style jsx>{`
          @keyframes milestoneFadeUp {
            from {
              opacity: 0;
              transform: translateY(20px) scale(0.96);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}</style>
      </div>
    </>
  );
}
