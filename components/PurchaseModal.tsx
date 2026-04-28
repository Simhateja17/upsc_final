'use client';

import React, { useState } from 'react';
import { pricingService } from '@/lib/services';

interface PurchaseModalProps {
  open: boolean;
  onClose: () => void;
  itemType: 'plan' | 'test_series';
  itemId: string;
  itemName: string;
  amount: number;
  onSuccess?: () => void;
}

const PAYMENT_METHODS = [
  { id: 'upi', label: 'Cards & UPI', icon: '💳' },
  { id: 'netbanking', label: 'Net Banking', icon: '🏦' },
  { id: 'wallet', label: 'Wallets', icon: '📱' },
];

export default function PurchaseModal({ open, onClose, itemType, itemId, itemName, amount, onSuccess }: PurchaseModalProps) {
  const [step, setStep] = useState<'details' | 'processing' | 'success'>('details');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [state, setState] = useState('');
  const [remarks, setRemarks] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [notRobot, setNotRobot] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  // Calculate pricing
  const discountPct = 40;
  const originalAmount = Math.round(amount * (100 / (100 - discountPct)));
  const savings = originalAmount - amount;

  const handleApplyPromo = () => {
    if (promoCode.trim()) setPromoApplied(true);
  };

  const handleSubmit = async () => {
    if (!fullName.trim() || !mobile.trim() || !email.trim() || !confirmEmail.trim() || !state.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (email !== confirmEmail) {
      setError('Emails do not match.');
      return;
    }
    if (!notRobot) {
      setError('Please confirm you are not a robot.');
      return;
    }
    setError('');
    setStep('processing');
    try {
      await pricingService.createOrder({ itemType, itemId, itemName, amount: amount * 100 });
      setTimeout(() => { setStep('success'); onSuccess?.(); }, 1500);
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
      setStep('details');
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{ width: '100%', maxWidth: '560px', maxHeight: '92vh', overflowY: 'auto', borderRadius: '20px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}
      >
        {/* ── DARK HEADER ── */}
        <div style={{ background: '#070F24', borderRadius: '20px 20px 0 0', padding: '28px 28px 24px', position: 'relative', flexShrink: 0 }}>
          {/* Close */}
          <button
            onClick={onClose}
            style={{ position: 'absolute', top: '16px', right: '16px', width: '36px', height: '36px', borderRadius: '50%', background: '#1C2A42', border: 'none', color: '#FFFFFF', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
          >×</button>

          {/* Icon + label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, #FDC700 0%, #F5A623 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0 }}>
              🎓
            </div>
            <div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '4px' }}>SECURE ENROLLMENT</p>
              <h2 style={{ fontFamily: 'Inter, sans-serif', fontSize: '22px', fontWeight: 800, color: '#FFFFFF', margin: 0, lineHeight: 1.2 }}>
                Complete Your <span style={{ color: '#FDC700' }}>Purchase</span>
              </h2>
            </div>
          </div>

          {/* Item row */}
          <div style={{ background: '#12203A', border: '1px solid #1E3A5F', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', marginTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>📋</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#FFFFFF' }}>{itemName}</span>
            </div>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#FDC700', background: '#1C2A42', padding: '3px 10px', borderRadius: '6px', letterSpacing: '0.5px' }}>UPSC 2026</span>
          </div>

          {/* Trust badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
            {['🔒 SSL Secured', '💰 7-Day Refund', '⚡ Instant Access', '📞 +91 84680 22022'].map(badge => (
              <span key={badge} style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>{badge}</span>
            ))}
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#64748B', margin: '0 0 20px' }}>
            Need help? Call <span style={{ color: '#FDC700', fontWeight: 700 }}>+91 8468022022</span> or WhatsApp us
          </p>

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {/* Step 1 — done */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#22C55E', letterSpacing: '0.5px' }}>COURSE</span>
            </div>
            <div style={{ flex: 1, height: '2px', background: '#FDC700', margin: '0 10px', minWidth: '32px' }} />
            {/* Step 2 — active */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#FDC700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 800, color: '#070F24' }}>2</span>
              </div>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#FDC700', letterSpacing: '0.5px' }}>DETAILS</span>
            </div>
            <div style={{ flex: 1, height: '2px', background: '#1E3A5F', margin: '0 10px', minWidth: '32px' }} />
            {/* Step 3 — pending */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'transparent', border: '2px solid #1E3A5F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 800, color: '#475569' }}>3</span>
              </div>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#475569', letterSpacing: '0.5px' }}>PAYMENT</span>
            </div>
          </div>
        </div>

        {/* ── WHITE CONTENT ── */}
        <div style={{ background: '#FFFFFF', borderRadius: '0 0 20px 20px', padding: '24px 28px', flexShrink: 0 }}>

          {step === 'processing' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid #FDC700', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', marginBottom: '16px' }} />
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#101828' }}>Processing payment...</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6A7282', marginTop: '4px' }}>Please do not close this window</p>
            </div>
          )}

          {step === 'success' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: '16px' }}>🎉</div>
              <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '22px', color: '#101828', marginBottom: '8px' }}>Payment Successful!</h3>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6A7282', marginBottom: '24px', maxWidth: '320px' }}>Your enrollment is confirmed. You'll receive a confirmation email shortly.</p>
              <button onClick={onClose} style={{ padding: '12px 36px', borderRadius: '12px', background: '#22C55E', border: 'none', color: '#FFFFFF', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}>
                Done ✓
              </button>
            </div>
          )}

          {step === 'details' && (
            <>
              {/* Price summary */}
              <div style={{ background: '#FFFBF0', border: '1.5px solid #FDC700', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '22px' }}>💳</span>
                  <div>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6A7282', margin: '0 0 2px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>TOTAL PAYABLE</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '28px', fontWeight: 900, color: '#101828', margin: 0 }}>₹{amount.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9CA3AF', textDecoration: 'line-through', margin: 0 }}>₹{originalAmount.toLocaleString('en-IN')}</p>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: '#101828', background: '#FDC700', padding: '3px 10px', borderRadius: '20px' }}>
                    💰 Save ₹{savings.toLocaleString('en-IN')} ({discountPct}% OFF)
                  </span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: '#16A34A', background: '#DCFCE7', padding: '3px 10px', borderRadius: '20px' }}>
                    ✓ Early Bird Applied
                  </span>
                </div>
              </div>

              {error && (
                <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', color: '#DC2626', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>
                  {error}
                </div>
              )}

              {/* Name + Mobile */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#374151', display: 'block', marginBottom: '6px' }}>FULL NAME <span style={{ color: '#EF4444' }}>*</span></label>
                  <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#374151', display: 'block', marginBottom: '6px' }}>MOBILE <span style={{ color: '#EF4444' }}>*</span></label>
                  <input value={mobile} onChange={e => setMobile(e.target.value)} placeholder="10-digit mobile" type="tel" style={inputStyle} />
                </div>
              </div>

              {/* Email + Confirm */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#374151', display: 'block', marginBottom: '6px' }}>EMAIL ADDRESS <span style={{ color: '#EF4444' }}>*</span></label>
                  <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" type="email" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#374151', display: 'block', marginBottom: '6px' }}>CONFIRM EMAIL <span style={{ color: '#EF4444' }}>*</span></label>
                  <input value={confirmEmail} onChange={e => setConfirmEmail(e.target.value)} placeholder="Repeat email" type="email" style={inputStyle} />
                </div>
              </div>

              {/* Payment method */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#374151', display: 'block', marginBottom: '8px' }}>PAYMENT METHOD <span style={{ color: '#EF4444' }}>*</span></label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {PAYMENT_METHODS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      style={{
                        padding: '14px 8px',
                        borderRadius: '12px',
                        border: paymentMethod === m.id ? '2px solid #FDC700' : '1.5px solid #E5E7EB',
                        background: paymentMethod === m.id ? '#FFFBF0' : '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: '22px' }}>{m.icon}</span>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', color: '#101828' }}>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* State */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#374151', display: 'block', marginBottom: '6px' }}>STATE (PLACE OF SERVICE) <span style={{ color: '#EF4444' }}>*</span></label>
                <input value={state} onChange={e => setState(e.target.value)} placeholder="e.g. Maharashtra" style={inputStyle} />
              </div>

              {/* Remarks */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#374151', display: 'block', marginBottom: '6px' }}>
                  REMARKS <span style={{ fontWeight: 400, color: '#9CA3AF', textTransform: 'none' }}>(OPTIONAL)</span>
                </label>
                <textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Any notes..." rows={2} style={{ ...inputStyle, resize: 'none', height: 'auto' }} />
              </div>

              {/* Promo code */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#374151', display: 'block', marginBottom: '6px' }}>PROMO CODE</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input value={promoCode} onChange={e => setPromoCode(e.target.value)} placeholder="" style={{ ...inputStyle, flex: 1 }} />
                  <button
                    onClick={handleApplyPromo}
                    style={{ padding: '0 20px', borderRadius: '12px', border: '2px solid #22C55E', background: '#FFFFFF', color: '#16A34A', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    Apply →
                  </button>
                </div>
                {promoApplied && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#16A34A', marginTop: '4px' }}>✓ Promo code applied!</p>}
              </div>

              {/* Not a robot */}
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #E5E7EB', marginBottom: '20px', cursor: 'pointer' }}
                onClick={() => setNotRobot(p => !p)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '4px', background: notRobot ? '#22C55E' : '#FFFFFF', border: notRobot ? 'none' : '2px solid #D1D5DB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {notRobot && <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', color: '#374151' }}>I&apos;m not a robot</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#9CA3AF', margin: 0 }}>reCAPTCHA</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#9CA3AF', margin: 0 }}>Privacy · Terms</p>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                onClick={handleSubmit}
                style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #FF8C00 0%, #FF6900 100%)', color: '#FFFFFF', fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '16px', cursor: 'pointer', letterSpacing: '0.2px' }}
              >
                🔒 Proceed to Secure Payment — ₹{amount.toLocaleString('en-IN')}
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: '10px',
  border: '1.5px solid #E5E7EB',
  fontFamily: 'Inter, sans-serif',
  fontSize: '14px',
  color: '#101828',
  outline: 'none',
  boxSizing: 'border-box',
  background: '#FFFFFF',
};
