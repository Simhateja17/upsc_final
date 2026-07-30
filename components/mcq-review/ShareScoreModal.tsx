'use client';

import React, { useState } from 'react';

/* ─────────────────────────────────────────────────────────────
   ShareScoreModal - the shared "Share Score" popup used by both
   the Daily MCQ Challenge and Prelims Mock Test score screens.
   Social share buttons + copy link + "include rank & streak"
   toggle, with an internal copy toast. Purely presentational:
   callers pass in the score numbers and a share slug URL.
   ───────────────────────────────────────────────────────────── */

interface ShareScoreModalProps {
  open: boolean;
  onClose: () => void;
  /** Small eyebrow label in the hero, e.g. "RISEWITHJEET · DAILY MCQ". */
  brandLabel: string;
  /** Challenge name used in the headline + share text, e.g. "Daily MCQ Challenge". */
  challengeName: string;
  /** true → "in today's <challenge>"; false → "in the <challenge>". */
  todayPrefix?: boolean;
  correctCount: number;
  totalCount: number;
  accuracyPct: number;
  rankLabel: string;
  streak: number | null;
  /** Share link without protocol, e.g. "risewithjeet.com/share/daily-mcq/AS-20jun26". */
  shareUrl: string;
}

export default function ShareScoreModal({
  open,
  onClose,
  brandLabel,
  challengeName,
  todayPrefix = true,
  correctCount,
  totalCount,
  accuracyPct,
  rankLabel,
  streak,
  shareUrl,
}: ShareScoreModalProps) {
  const [includeRankStreak, setIncludeRankStreak] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2000);
  };

  if (!open) return null;

  const lead = todayPrefix ? "today's" : 'the';
  const shareUrlFull = `https://${shareUrl}`;
  const shareText = [
    `I scored ${correctCount}/${totalCount} in ${lead} ${challengeName}!`,
    includeRankStreak
      ? `${accuracyPct}% accuracy · ${rankLabel}${streak ? ` · ${streak}-day streak 🔥` : ''}`
      : `${accuracyPct}% accuracy`,
  ].join(' ');

  const copyShareLink = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrlFull);
        showToast('Link copied');
        return;
      } catch {
        // fall through to toast below
      }
    }
    showToast('Copy not supported');
  };

  const openShareWindow = (network: 'whatsapp' | 'x' | 'linkedin' | 'instagram' | 'telegram') => {
    const text = encodeURIComponent(shareText);
    const url = encodeURIComponent(shareUrlFull);
    const links: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      x: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
    };
    // Instagram has no web share intent - copy the link so the user can paste it into the app.
    if (network === 'instagram') {
      copyShareLink();
      showToast('Link copied - paste it into Instagram');
      return;
    }
    if (typeof window !== 'undefined') {
      window.open(links[network], '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(11,20,38,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="font-arimo"
          style={{ width: '100%', maxWidth: 520, background: '#FFFFFF', borderRadius: 20, boxShadow: '0 30px 70px -25px rgba(11,20,38,0.55)', overflow: 'hidden' }}
        >
          {/* Preview hero */}
          <div style={{ position: 'relative', padding: '28px 28px 24px', color: '#fff', background: 'radial-gradient(120% 80% at 0% 0%, #1A2848 0%, #0B1426 60%)' }}>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{ position: 'absolute', right: 16, top: 16, width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.10)', color: '#fff', cursor: 'pointer' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.20)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.10)'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, letterSpacing: '0.18em', fontWeight: 700, color: '#F5C518' }}>
              <svg width="12" height="12" viewBox="0 0 32 32" fill="none"><path d="M6 6l10 18L26 6l-5 4-5-3-5 3L6 6z" fill="#F5C518" /></svg>
              {brandLabel}
            </div>
            <h3 className="font-jakarta font-extrabold tracking-tight" style={{ fontSize: 22, marginTop: 12, lineHeight: 1.2 }}>
              I scored {correctCount}/{totalCount} in {lead}<br />{challengeName}!
            </h3>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 20, fontSize: 12.5, color: 'rgba(255,255,255,0.8)' }}>
              <div><span style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>{accuracyPct}%</span> Accuracy</div>
              {includeRankStreak && (
                <>
                  <span style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.2)' }} />
                  <div><span style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>{rankLabel}</span> Rank</div>
                  {streak !== null && streak > 0 && (
                    <>
                      <span style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.2)' }} />
                      <div><span style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>{streak}-day</span> Streak 🔥</div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          <div style={{ padding: 24 }}>
            <div style={{ fontSize: 12, letterSpacing: '0.14em', fontWeight: 700, color: '#8892A4', marginBottom: 12 }}>SHARE TO</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 20 }}>
              {[
                { id: 'whatsapp' as const, label: 'WhatsApp', bg: '#25D366', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15l-1.4 5 5.2-1.4A10 10 0 1 0 12 2zm5.2 14.3c-.2.6-1.2 1.2-1.7 1.3-.4 0-1 .1-1.6-.1-2.8-.9-4.7-3.8-4.8-4-.2-.2-1.2-1.6-1.2-3 0-1.5.8-2.2 1-2.5.3-.3.6-.4.8-.4h.6c.2 0 .5-.1.7.5l1 2.4c.1.2.1.4 0 .6L11.6 12c-.1.2-.2.4 0 .6.1.3.7 1.1 1.5 1.8 1 .9 1.8 1.2 2 1.3.2.1.4.1.5-.1l.7-.9c.2-.2.3-.2.5-.1l2 .9c.2.1.4.2.4.4.1.2.1 1.2-.1 1.4z" /></svg> },
                { id: 'x' as const, label: 'X', bg: '#000000', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 3h3l-7.5 8.6L22 21h-6l-5-6.3L5 21H2l8-9.2L2 3h6l4.5 5.8z" /></svg> },
                { id: 'linkedin' as const, label: 'LinkedIn', bg: '#0A66C2', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h4v4H4zM4 10h4v10H4zM10 10h4v1.5c.7-1.2 2.2-1.8 3.5-1.8 3 0 4.5 1.8 4.5 5V20h-4v-4.5c0-1.5-.5-2.5-2-2.5s-2 1-2 2.5V20h-4z" /></svg> },
                { id: 'instagram' as const, label: 'Instagram', bg: 'linear-gradient(to top right, #FF7A00, #E1306C, #7d2ae8)', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg> },
                { id: 'telegram' as const, label: 'Telegram', bg: '#0088CC', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M21 5L3 12l5 2 2 6 3-4 5 4 3-15z" /></svg> },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => openShareWindow(s.id)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 12, borderRadius: 12, border: 'none', background: 'transparent', cursor: 'pointer', transition: 'background .15s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F4F6FA'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  <span style={{ width: 40, height: 40, borderRadius: '50%', background: s.bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</span>
                  <span style={{ fontSize: 10.5, color: '#1F2937' }}>{s.label}</span>
                </button>
              ))}
            </div>

            <div style={{ fontSize: 12, letterSpacing: '0.14em', fontWeight: 700, color: '#8892A4', marginBottom: 8 }}>OR COPY LINK</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12, border: '1px solid #E6EAF1', background: '#F8FAFD', padding: '4px 4px 4px 12px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8892A4" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>
              <input value={shareUrl} readOnly style={{ flex: 1, minWidth: 0, background: 'transparent', fontSize: 12.5, color: '#475067', outline: 'none', border: 'none', textOverflow: 'ellipsis' }} />
              <button
                type="button"
                onClick={copyShareLink}
                className="font-arimo"
                style={{ display: 'inline-flex', alignItems: 'center', fontWeight: 600, borderRadius: 10, padding: '8px 14px', fontSize: 12.5, background: '#0B1426', color: '#fff', border: 'none', cursor: 'pointer', flexShrink: 0 }}
              >
                Copy
              </button>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, fontSize: 12.5, color: '#6B7689', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={includeRankStreak}
                onChange={(e) => setIncludeRankStreak(e.target.checked)}
                style={{ borderRadius: 4 }}
              />
              Include rank &amp; streak in shared card
            </label>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div
          style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#0B1426', color: '#fff', padding: '12px 18px', borderRadius: 12, fontSize: 13.5, fontWeight: 500, zIndex: 1100, boxShadow: '0 12px 28px -12px rgba(11,20,38,0.5)' }}
          role="status"
        >
          {toastMsg}
        </div>
      )}
    </>
  );
}
