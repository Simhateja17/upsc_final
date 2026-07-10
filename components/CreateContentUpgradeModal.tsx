'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  requiredTier?: string;
  icon?: React.ReactNode;
};

const PERKS = [
  'Create Unlimited Subjects, Topics & Flashcards',
  'Build Your Personal Revision Library',
  'Smart Spaced Repetition',
  'Progress & Mastery Tracking',
];

const BookIcon = (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F5C542" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

export default function CreateContentUpgradeModal({
  open,
  onClose,
  title = 'Create Your Own Subjects',
  subtitle = 'Organize your preparation by creating custom subjects for your personal revision.',
  requiredTier = 'rise',
  icon = BookIcon,
}: Props) {
  const router = useRouter();
  if (!open) return null;

  return (
    <div
      className="ccum-backdrop fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(10,10,15,0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="ccum-modal relative w-full bg-white"
        style={{ maxWidth: 440, borderRadius: 20, padding: '40px 34px 34px', boxShadow: '0 25px 60px rgba(0,0,0,0.15), 0 8px 20px rgba(0,0,0,0.08)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gold top accent */}
        <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderRadius: '20px 20px 0 0', background: 'linear-gradient(90deg, transparent, #F5C542, transparent)' }} />

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute flex items-center justify-center rounded-full transition-colors hover:bg-gray-200"
          style={{ top: 16, right: 16, width: 32, height: 32, background: '#F5F5F7', color: '#6B7080' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Icon */}
        <div className="flex justify-center">
          <span
            className="ccum-icon flex items-center justify-center flex-shrink-0"
            style={{ width: 72, height: 72, borderRadius: '50%', background: '#1E2028', boxShadow: '0 10px 26px rgba(15,23,38,0.22), 0 4px 12px rgba(0,0,0,0.10)', perspective: 500 }}
          >
            {icon}
          </span>
        </div>

        {/* Title + subtitle */}
        <h2
          className="text-center"
          style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 26, lineHeight: '32px', color: '#1E2028', marginTop: 22, letterSpacing: '-0.3px' }}
        >
          {title}
        </h2>
        <p
          className="text-center mx-auto"
          style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 13.5, lineHeight: '22px', color: '#4A4E5A', marginTop: 10, maxWidth: 360 }}
        >
          {subtitle}
        </p>

        {/* Divider */}
        <div className="flex items-center gap-3" style={{ margin: '20px 0 16px' }}>
          <div className="flex-1" style={{ height: 1, background: '#E8E8EC' }} />
          <span style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 11, letterSpacing: '0.8px', color: '#C9A227', textTransform: 'uppercase' }}>
            Upgrade to unlock
          </span>
          <div className="flex-1" style={{ height: 1, background: '#E8E8EC' }} />
        </div>

        {/* Perks box */}
        <div style={{ background: '#F5F5F7', borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 11, letterSpacing: '0.8px', color: '#C9A227', textTransform: 'uppercase', marginBottom: 14 }}>
            What you&apos;ll get
          </div>
          <ul className="flex flex-col gap-3">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-start gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0" style={{ marginTop: 1 }}>
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 13.5, lineHeight: '20px', color: '#1E2028' }}>{perk}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Upgrade button */}
        <button
          type="button"
          onClick={() => { onClose(); router.push(`/dashboard/billing/plans?plan=${requiredTier}#upgrade-plans`); }}
          className="ccum-primary w-full flex items-center justify-center gap-2"
          style={{ marginTop: 28, background: '#1E2028', border: '1.5px solid transparent', borderRadius: 12, padding: '15px', fontFamily: 'Inter', fontWeight: 700, fontSize: 15, letterSpacing: '0.2px', color: '#F5C542' }}
        >
          <span>Upgrade</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden style={{ filter: 'drop-shadow(0 0 4px rgba(245,197,66,0.6))' }}>
            <path d="M12 2.5c.35 2.9 1.05 5.05 2.1 6.4 1.05 1.35 3.2 2.05 6.4 2.1-3.2.05-5.35.75-6.4 2.1-1.05 1.35-1.75 3.5-2.1 6.4-.35-2.9-1.05-5.05-2.1-6.4C8.85 11.75 6.7 11.05 3.5 11c3.2-.05 5.35-.75 6.4-2.1C10.95 7.55 11.65 5.4 12 2.5z" fill="#F5C542" />
            <path d="M19.5 15.5c.2 1.5.55 2.6 1.05 3.3.5.7 1.6 1.05 3.3 1.05-1.7 0-2.8.35-3.3 1.05-.5.7-.85 1.8-1.05 3.3-.2-1.5-.55-2.6-1.05-3.3-.5-.7-1.6-1.05-3.3-1.05 1.7 0 2.8-.35 3.3-1.05.5-.7.85-1.8 1.05-3.3z" fill="#F5C542" opacity="0.85" />
          </svg>
        </button>

        {/* Back link */}
        <button
          type="button"
          onClick={onClose}
          className="w-full text-center transition-colors hover:text-gray-700"
          style={{ marginTop: 12, fontFamily: 'Inter', fontWeight: 500, fontSize: 13.5, color: '#6B7080', background: 'transparent', padding: '8px 16px' }}
        >
          Back to Flashcards
        </button>
      </div>

      <style jsx>{`
        .ccum-modal {
          transform: translateY(16px) scale(0.97);
          opacity: 0;
          animation: ccumIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes ccumIn {
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        .ccum-icon :global(svg) {
          animation: ccumFlip 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both;
        }
        @keyframes ccumFlip {
          0% { transform: rotateY(0deg) scale(0.8); opacity: 0; }
          50% { transform: rotateY(180deg) scale(1.1); }
          100% { transform: rotateY(360deg) scale(1); opacity: 1; }
        }
        .ccum-primary {
          transition: all 0.25s ease;
        }
        .ccum-primary:hover {
          transform: translateY(-1px);
          border-color: #F5C542;
          box-shadow: 0 0 0 2px rgba(245,197,66,0.35), 0 0 18px rgba(245,197,66,0.35), 0 6px 20px rgba(30,32,40,0.25);
        }
      `}</style>
    </div>
  );
}
