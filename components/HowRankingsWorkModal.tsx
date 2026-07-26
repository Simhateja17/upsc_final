'use client';

export default function HowRankingsWorkModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  const cormorant = 'var(--font-cormorant-garamond), "Cormorant Garamond", Georgia, serif';
  const dmSans = 'var(--font-dm-sans), "DM Sans", sans-serif';

  return (
    <div
      className="fixed inset-0 z-[700] flex items-center justify-center p-6"
      style={{
        background: 'rgba(10, 10, 15, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        animation: 'howRankingsFadeIn 0.3s ease',
      }}
      onClick={onClose}
    >
      <div
        className="how-rankings-modal relative w-full overflow-hidden"
        style={{
          background: '#FFFFFF',
          borderRadius: 20,
          maxWidth: 420,
          padding: '36px 32px 32px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.15), 0 8px 20px rgba(0, 0, 0, 0.08)',
          animation: 'howRankingsSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top gold gradient line */}
        <div
          className="absolute left-0 right-0 top-0"
          style={{ height: 3, background: 'linear-gradient(90deg, transparent, #F5C542, transparent)' }}
        />

        {/* Icon */}
        <div
          className="mx-auto mb-6 flex items-center justify-center rounded-full"
          style={{
            width: 72,
            height: 72,
            background: '#101827',
            boxShadow: '0 10px 26px rgba(15, 23, 38, 0.22), 0 4px 12px rgba(0, 0, 0, 0.10)',
          }}
        >
          <svg width="38" height="38" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M12 8h16v2c0 5.5-3.2 10-8 11.5C15.2 20 12 15.5 12 10V8z" fill="#F5C542" />
            <path d="M12 10H9c-1.5 0-2.5 1-2.5 2.5S7.5 15 9 15h3" stroke="#E8D48B" strokeWidth="1.5" fill="none" />
            <path d="M28 10h3c1.5 0 2.5 1 2.5 2.5S32.5 15 31 15h-3" stroke="#E8D48B" strokeWidth="1.5" fill="none" />
            <rect x="18.5" y="21.5" width="3" height="5" rx="1" fill="#E8D48B" />
            <rect x="14" y="26.5" width="12" height="2.5" rx="1.2" fill="#F5C542" />
            <path
              d="M20 11.5l1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.8 2.6-.4z"
              fill="#1E2028"
              opacity="0.35"
            />
            <text
              x="20"
              y="28.5"
              textAnchor="middle"
              fontFamily="DM Sans, sans-serif"
              fontSize="5"
              fontWeight="700"
              fill="#1E2028"
              opacity="0.5"
            >
              #1
            </text>
          </svg>
        </div>

        {/* Title */}
        <h2
          className="text-center"
          style={{
            fontFamily: cormorant,
            fontSize: 26,
            fontWeight: 700,
            color: '#1E2028',
            lineHeight: 1.2,
            marginBottom: 10,
            letterSpacing: '-0.3px',
          }}
        >
          How is Overall Rank Calculated?
        </h2>

        {/* Description */}
        <p
          className="text-center"
          style={{
            fontFamily: dmSans,
            fontSize: 13.5,
            color: '#4A4E5A',
            lineHeight: 1.65,
            marginTop: 6,
            marginBottom: 20,
            padding: '0 4px',
          }}
        >
          Your Overall Rank reflects your average academic performance across completed MCQ-type and Mains-type
          challenges.
        </p>

        {/* Scoring Breakdown */}
        <div style={{ background: '#F5F5F7', borderRadius: 14, padding: '20px 22px', marginBottom: 18 }}>
          <div
            style={{
              fontFamily: dmSans,
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: '#F5C542',
              marginBottom: 14,
            }}
          >
            Your Overall Score
          </div>
          <div className="flex items-start" style={{ gap: 12, marginBottom: 12 }}>
            <span style={{ color: '#22C55E', fontWeight: 900, fontSize: 15, lineHeight: 1, marginTop: 2 }}>
              &#10003;
            </span>
            <span style={{ fontFamily: dmSans, fontSize: 13.5, color: '#1E2028', lineHeight: 1.45, fontWeight: 400 }}>
              <strong style={{ fontWeight: 600 }}>50%</strong> Average MCQ Score
            </span>
          </div>
          <div className="flex items-start" style={{ gap: 12 }}>
            <span style={{ color: '#22C55E', fontWeight: 900, fontSize: 15, lineHeight: 1, marginTop: 2 }}>
              &#10003;
            </span>
            <span style={{ fontFamily: dmSans, fontSize: 13.5, color: '#1E2028', lineHeight: 1.45, fontWeight: 400 }}>
              <strong style={{ fontWeight: 600 }}>50%</strong> Average Mains Score
            </span>
          </div>
        </div>

        {/* Info Points */}
        <div style={{ marginBottom: 18, padding: '0 2px' }}>
          <div className="flex items-start" style={{ gap: 10, marginBottom: 10 }}>
            <span
              style={{ flex: '0 0 auto', width: 6, height: 6, borderRadius: '50%', background: '#C9A227', marginTop: 6 }}
            />
            <span style={{ fontFamily: dmSans, fontSize: 13, color: '#4A4E5A', lineHeight: 1.6 }}>
              Each challenge is first normalized to a common <strong style={{ fontWeight: 600 }}>10-point scale</strong>,
              ensuring fair comparison between objective and descriptive performance.
            </span>
          </div>
          <div className="flex items-start" style={{ gap: 10 }}>
            <span
              style={{ flex: '0 0 auto', width: 6, height: 6, borderRadius: '50%', background: '#C9A227', marginTop: 6 }}
            />
            <span style={{ fontFamily: dmSans, fontSize: 13, color: '#4A4E5A', lineHeight: 1.6 }}>
              Rankings are based on your <strong style={{ fontWeight: 600 }}>average performance</strong>, not the
              number of attempts.
            </span>
          </div>
        </div>

        {/* Footer Note */}
        <div
          className="text-center"
          style={{
            fontFamily: dmSans,
            fontSize: 12,
            color: '#6B7080',
            lineHeight: 1.6,
            marginBottom: 24,
            padding: '10px 14px',
            background: 'rgba(245, 197, 66, 0.08)',
            borderRadius: 10,
            border: '1px solid rgba(245, 197, 66, 0.15)',
          }}
        >
          Complete at least one MCQ-type and one Mains-type challenge to unlock your Overall Rank.
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center" style={{ gap: 12 }}>
          <button
            onClick={onClose}
            className="how-rankings-btn-primary"
            style={{
              width: '100%',
              padding: '15px 28px',
              background: '#1E2028',
              color: '#F5C542',
              border: '1.5px solid transparent',
              borderRadius: 12,
              fontFamily: dmSans,
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.2px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <span>Understood</span>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              style={{ filter: 'drop-shadow(0 0 4px rgba(245, 197, 66, 0.6))' }}
            >
              <path
                d="M12 2.5c.35 2.9 1.05 5.05 2.1 6.4 1.05 1.35 3.2 2.05 6.4 2.1-3.2.05-5.35.75-6.4 2.1-1.05 1.35-1.75 3.5-2.1 6.4-.35-2.9-1.05-5.05-2.1-6.4C8.85 11.75 6.7 11.05 3.5 11c3.2-.05 5.35-.75 6.4-2.1C10.95 7.55 11.65 5.4 12 2.5z"
                fill="#F5C542"
              />
              <path
                d="M19.5 15.5c.2 1.5.55 2.6 1.05 3.3.5.7 1.6 1.05 3.3 1.05-1.7 0-2.8.35-3.3 1.05-.5.7-.85 1.8-1.05 3.3-.2-1.5-.55-2.6-1.05-3.3-.5-.7-1.6-1.05-3.3-1.05 1.7 0 2.8-.35 3.3-1.05.5-.7.85-1.8 1.05-3.3z"
                fill="#F5C542"
                opacity="0.85"
              />
            </svg>
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes howRankingsFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes howRankingsSlideUp {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .how-rankings-btn-primary {
          transition: all 0.25s ease;
        }

        .how-rankings-btn-primary:hover {
          transform: translateY(-1px);
          border-color: #f5c542 !important;
          box-shadow:
            0 0 0 2px rgba(245, 197, 66, 0.35),
            0 0 18px rgba(245, 197, 66, 0.35),
            0 6px 20px rgba(30, 32, 40, 0.25);
        }

        .how-rankings-btn-primary:active {
          transform: translateY(0);
        }

        @media (max-width: 480px) {
          .how-rankings-modal {
            padding: 32px 24px 28px !important;
            border-radius: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
