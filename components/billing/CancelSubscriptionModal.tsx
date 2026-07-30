'use client';

import { useState } from 'react';
import { billingService } from '@/lib/services';
import { CANCELLATION_LOSSES } from './billingPlanFeatures';

const FONT = 'var(--font-dm-sans), "DM Sans", Inter, sans-serif';
const CORMORANT = 'var(--font-cormorant-garamond), "Cormorant Garamond", Georgia, serif';
const SUPPORT_EMAIL = 'together@risewithjeet.com';

function formatDate(value?: string | Date | null): string {
  if (!value) return 'the end of your current period';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'the end of your current period';
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function CancelSubscriptionModal({
  subscriptionId,
  accessUntil,
  onClose,
  onCancelled,
}: {
  subscriptionId: string;
  accessUntil?: string | Date | null;
  onClose: () => void;
  onCancelled: () => void;
}) {
  const [reason, setReason] = useState('');
  const [wantsSupport, setWantsSupport] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleConfirmCancel = async () => {
    if (!reason.trim()) return;
    setBusy(true);
    setError('');
    try {
      await billingService.submitCancellationFeedback(subscriptionId, { reason: reason.trim(), wantsSupport });
      await billingService.cancelRazorpaySubscription(subscriptionId);
      if (wantsSupport) {
        const subject = encodeURIComponent('Support request before cancelling');
        const body = encodeURIComponent(`Hi team,\n\nI'm cancelling my subscription and would like to talk to support first.\n\nReason: ${reason.trim()}`);
        window.open(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`, '_blank');
      }
      onCancelled();
    } catch (err: any) {
      setError(err?.message || 'Unable to cancel your subscription. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(8,15,35,0.65)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, overflowY: 'auto',
      }}
    >
      <div
        style={{
          background: '#f4f6fa', borderRadius: 20,
          boxShadow: '0 24px 80px rgba(9,14,28,0.5), 0 24px 40px rgba(9,14,28,0.25)',
          width: '100%', maxWidth: 652,
          fontFamily: FONT,
          padding: '36px',
        }}
      >
        <h2 style={{ margin: 0, fontFamily: CORMORANT, fontWeight: 600, fontSize: 24, color: '#ef4444' }}>Cancel Subscription?</h2>
        <p style={{ margin: '10px 0 0', fontFamily: FONT, fontSize: 13, color: '#6b7a99' }}>
          We&apos;re sorry to see you go. Here&apos;s what you&apos;ll lose:
        </p>

        <div style={{ background: 'rgba(239,68,68,0.06)', borderLeft: '5px solid #ef4444', borderRadius: 10, padding: '18px 24px', marginTop: 20 }}>
          <p style={{ margin: '0 0 12px', fontFamily: FONT, fontSize: 13, color: 'rgba(239,68,68,0.85)', lineHeight: '21.45px' }}>
            Your plan remains active until <strong style={{ fontWeight: 700 }}>{formatDate(accessUntil)}</strong>. After that, you&apos;ll be downgraded to the free Starter plan. You will permanently lose:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {CANCELLATION_LOSSES.map((item, i) => (
              <div
                key={item}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0',
                  borderTop: i === 0 ? 'none' : '1px solid rgba(55,69,96,0.1)',
                }}
              >
                <span style={{ fontFamily: FONT, fontSize: 15, color: '#374560' }}>❌</span>
                <span style={{ fontFamily: FONT, fontSize: 13, color: '#374560' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <label style={{ display: 'block', marginTop: 24, fontFamily: FONT, fontSize: 13, fontWeight: 400, color: '#374560' }}>
          What&apos;s making you leave? <span style={{ color: 'rgba(55,69,96,0.28)' }}>(required)</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Share what is not working for you, every word helps us to improve...."
          rows={3}
          style={{
            width: '100%', marginTop: 8, borderRadius: 10, border: '1px solid rgba(177,209,255,0.96)', background: '#fff',
            padding: '12px 14px', fontSize: 13, fontFamily: FONT, color: '#374560', resize: 'vertical', boxSizing: 'border-box',
          }}
        />

        <p style={{ margin: '20px 0 10px', fontFamily: FONT, fontSize: 13, fontWeight: 400, color: '#374560' }}>
          Is there anything we could do to change your mind?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(177,209,255,0.96)', background: '#fff', cursor: 'pointer', fontFamily: FONT, fontSize: 13, color: '#374560' }}>
            <input type="radio" name="cancel-reason-support" checked={wantsSupport} onChange={() => setWantsSupport(true)} />
            Connect me with Support
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(177,209,255,0.96)', background: '#fff', cursor: 'pointer', fontFamily: FONT, fontSize: 13, color: '#374560' }}>
            <input type="radio" name="cancel-reason-support" checked={!wantsSupport} onChange={() => setWantsSupport(false)} />
            No, I have made my decision
          </label>
        </div>

        {error && <p style={{ margin: '14px 0 0', fontFamily: FONT, fontSize: 13, color: '#ef4444' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 12, marginTop: 26 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            style={{
              flex: 1, borderRadius: 9, border: '1px solid rgba(11,22,40,0.17)', background: '#0d1b2e', padding: '11px 23px',
              fontFamily: FONT, fontSize: 13, fontWeight: 600, color: '#fff', cursor: busy ? 'not-allowed' : 'pointer',
            }}
          >
            Keep My Plan
          </button>
          <button
            type="button"
            onClick={handleConfirmCancel}
            disabled={busy || !reason.trim()}
            style={{
              flex: 1, borderRadius: 9, border: '1px solid rgba(239,68,68,0.25)', background: 'transparent', padding: '11px 23px',
              fontFamily: FONT, fontSize: 13, fontWeight: 600, color: 'rgba(239,68,68,0.7)',
              cursor: busy || !reason.trim() ? 'not-allowed' : 'pointer',
              opacity: !reason.trim() ? 0.6 : 1,
            }}
          >
            {busy ? 'Cancelling...' : 'Yes, Cancel Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}

