'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// â”€â”€ Hero â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function BillingHero() {
  return (
    <div
      className="relative overflow-hidden flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(180deg, #0B1428 0%, #0F1C35 100%)',
        minHeight: 260,
        padding: '40px 24px 44px',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,.03) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="relative z-10 flex items-center gap-3 mb-5">
        <span style={{ display: 'block', width: 44, height: 1, background: 'linear-gradient(to right, transparent, #C8972A)' }} />
        <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '2.5px', color: '#C8972A', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          Billing &amp; Plans
        </span>
        <span style={{ display: 'block', width: 44, height: 1, background: 'linear-gradient(to left, transparent, #C8972A)' }} />
      </div>
      <h1
        className="relative z-10 text-center"
        style={{
          fontFamily: 'var(--font-cormorant-garamond), "Cormorant Garamond", Georgia, serif',
          fontWeight: 600,
          fontSize: 'clamp(28px, 3.6vw, 58px)',
          lineHeight: 1.15,
          color: '#FFFFFF',
          marginBottom: 14,
        }}
      >
        <span style={{ display: 'block', whiteSpace: 'nowrap' }}>Your IAS Journey Deserves</span>
        <span style={{ display: 'block', whiteSpace: 'nowrap' }}>
          a{' '}
          <em style={{ color: '#E8A820', fontStyle: 'italic', fontWeight: 600 }}>Smarter</em>
          {' '}Foundation
        </span>
      </h1>
      <p className="relative z-10 text-center" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
        No hidden fees. No surprise charges. Cancel anytime.
      </p>
    </div>
  );
}

type BillingCycle = 'monthly' | 'quarterly' | 'yearly';
type PaymentMethod = 'UPI' | 'Card' | 'Net Banking' | 'Wallet';

function RiseCheckoutModal({ cycle, onClose }: { cycle: BillingCycle; onClose: () => void }) {
  const cycleConfig: Record<BillingCycle, { label: string; perMonth: string; total: string; save: string; strike: string }> = {
    monthly: { label: 'Monthly', perMonth: '499', total: '499.00', save: '', strike: '89.82' },
    quarterly: { label: 'Quarterly', perMonth: '399', total: '1197.00', save: 'Save 20%', strike: '239.46' },
    yearly: { label: 'Yearly', perMonth: '299', total: '3588.00', save: 'Save 40%', strike: '718.56' },
  };
  const active = cycleConfig[cycle];
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');

  const fieldStyle = { width: '100%', borderRadius: 10, border: '1px solid #DFDBD6', background: '#FFFFFF', padding: '10px 12px', fontSize: 14, color: '#8F93AF', marginBottom: 10 } as const;
  const methodValue = paymentMethod === 'UPI' ? 'UPI rahul@upi' : paymentMethod;

  const handlePayClick = () => {
    setStep('processing');
    window.setTimeout(() => setStep('success'), 1800);
  };

  if (step === 'success') {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(8, 15, 35, 0.35)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ width: '100%', maxWidth: 760, borderRadius: 28, background: '#F8F8F8', border: '1px solid #E5E7EB', position: 'relative', overflow: 'hidden' }}>
          <button type="button" aria-label="Close" onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, width: 34, height: 34, borderRadius: '50%', border: 'none', background: '#ECEBE7', color: '#8B8FA8', fontSize: 24, lineHeight: '24px', cursor: 'pointer', zIndex: 2 }}>×</button>

          <div style={{ background: '#030C23', padding: '30px 24px 34px', textAlign: 'center' }}>
            <div style={{ width: 74, height: 74, borderRadius: '50%', background: 'rgba(76, 215, 183, 0.18)', border: '2px solid rgba(76, 215, 183, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', color: '#79F5CF', fontSize: 40, fontWeight: 700 }}>✓</div>
            <h3 style={{ margin: '0 0 8px', color: '#FFFFFF', fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 52, fontWeight: 600, lineHeight: 1.05 }}>Payment Successful! 🎉</h3>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.60)', fontSize: 17 }}>Welcome to the Rise Plan your journey to the civil services starts now.</p>
          </div>

          <div style={{ padding: '20px 24px 24px' }}>
            <div style={{ borderRadius: 12, background: '#F2EFEB', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 12, letterSpacing: '1px', color: '#8F93AF', fontWeight: 700, textTransform: 'uppercase' }}>Transaction ID</div>
                <div style={{ fontSize: 28, color: '#22263E', fontWeight: 700, fontFamily: '"Cormorant Garamond", Georgia, serif' }}>RWJ-2026-05-84729</div>
              </div>
              <button type="button" style={{ border: 'none', background: 'transparent', color: '#E8A820', fontWeight: 700, cursor: 'pointer' }}>Copy</button>
            </div>

            <div style={{ borderTop: '1px solid #E6E3DE', borderBottom: '1px solid #E6E3DE', marginBottom: 14 }}>
              {[
                ['Plan', `Rise — ${active.label}`],
                ['Amount Paid', `₹${active.total}(incl. GST)`],
                ['Next Billing Date', 'June 6, 2026'],
                ['Billed To', 'rahul@email.com'],
                ['Payment Method', methodValue],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: label === 'Payment Method' ? 'none' : '1px solid #E6E3DE' }}>
                  <span style={{ color: '#8D91AD', fontSize: 31, fontFamily: '"Cormorant Garamond", Georgia, serif' }}>{label}</span>
                  <span style={{ color: label === 'Amount Paid' ? '#E8A820' : '#252A42', fontSize: 33, fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 700 }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ borderRadius: 12, background: '#CEF2DA', padding: '14px 16px', marginBottom: 16, color: '#0D7A4B' }}>
              <div style={{ fontWeight: 700, fontSize: 32, fontFamily: '"Cormorant Garamond", Georgia, serif' }}>🚀 Your Rise access is now live</div>
              <div style={{ fontSize: 26, marginTop: 2, fontFamily: '"Cormorant Garamond", Georgia, serif' }}>All features unlocked click below to set up your profile</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 10, marginBottom: 14 }}>
              <button type="button" style={{ borderRadius: 12, border: 'none', background: '#F4A91F', color: '#FFFFFF', fontSize: 33, fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 700, padding: '14px 16px', cursor: 'pointer' }}>Set Up My Dashboard {'->'}</button>
              <button type="button" style={{ borderRadius: 12, border: '1.5px solid #D9D5CD', background: '#FFFFFF', color: '#3E4465', fontSize: 32, fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 700, padding: '14px 16px', cursor: 'pointer' }}>Download Receipt</button>
            </div>

            <p style={{ margin: 0, textAlign: 'center', color: '#8D91AD', fontSize: 25, lineHeight: 1.35, fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
              A confirmation email & receipt has been sent to <strong>rahul@email.com</strong>.<br />
              Keep your transaction ID safe for any queries.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(8, 15, 35, 0.35)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 860, maxHeight: '92vh', overflowY: 'auto', borderRadius: 20, background: '#F8F8F8', border: '1px solid #E5E7EB', position: 'relative' }}>
        <button type="button" aria-label="Close" onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, width: 34, height: 34, borderRadius: '50%', border: 'none', background: '#ECEBE7', color: '#8B8FA8', fontSize: 24, lineHeight: '24px', cursor: 'pointer', zIndex: 2 }}>×</button>
        <div className="rise-modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', minHeight: 560 }}>
          <div className="rise-modal-left" style={{ padding: '20px 18px 16px', borderBottom: '1px solid #E4E2DF' }}>
            <p style={{ margin: '0 0 12px', display: 'inline-block', borderRadius: 999, padding: '5px 10px', background: '#F8EBCF', color: '#E8A820', fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Rise Plan</p>
            <h3 style={{ margin: '0 0 6px', fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 40, lineHeight: 1, color: '#21243D' }}>Rise</h3>
            <p style={{ margin: '0 0 12px', color: '#8F93AF', fontSize: 11, lineHeight: 1.35 }}>The complete ecosystem for focused, daily UPSC preparation.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 14 }}>
              {([
                { id: 'monthly', amount: '499', save: '' },
                { id: 'quarterly', amount: '399', save: 'Save 20%' },
                { id: 'yearly', amount: '299', save: 'Save 40%' },
              ] as const).map((item) => {
                const selected = cycle === item.id;
                return (
                  <div key={item.id} style={{ borderRadius: 12, border: `1.5px solid ${selected ? '#E8A820' : '#E5E0D8'}`, background: selected ? '#F9EED3' : '#FFFFFF', padding: '10px 12px' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: selected ? '#E8A820' : '#8F93AF', marginBottom: 2 }}>{item.id.charAt(0).toUpperCase() + item.id.slice(1)}</div>
                    <div style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 28, lineHeight: 1.05, fontWeight: 700, color: '#21243D' }}>₹{item.amount}/mo</div>
                    {item.save ? <div style={{ color: '#1C9A4D', fontSize: 11, fontWeight: 700 }}>{item.save}</div> : <div style={{ height: 16 }} />}
                  </div>
                );
              })}
            </div>
            <div style={{ background: '#F0ECE8', borderRadius: 14, padding: '14px 14px 12px', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#5D6280', marginBottom: 6 }}><span>Rise Plan — {active.label}</span><span>₹{active.perMonth}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#5D6280', marginBottom: 6 }}><span>GST (18% Included)</span><span style={{ textDecoration: 'line-through' }}>₹{active.strike}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#18924A', marginBottom: 8 }}><span>7-Day Money-Back Guarantee</span><span>✓ Included</span></div>
              <div style={{ height: 1, background: '#D9D3CC', marginBottom: 8 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontWeight: 700, color: '#1B213B' }}>
                <span style={{ fontSize: 16 }}>Total Payable</span>
                <span style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 34 }}>₹{active.total}</span>
              </div>
            </div>
          </div>

          <div className="rise-modal-right" style={{ padding: '20px 18px 16px' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 18, lineHeight: 1.1, color: '#1F243A', fontWeight: 700 }}>Complete Your Purchase</h4>
            {step === 'form' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, marginBottom: 12 }}>
                  {[
                    { name: 'UPI', icon: '📱' },
                    { name: 'Card', icon: '💳' },
                    { name: 'Net Banking', icon: '🏦' },
                    { name: 'Wallet', icon: '👛' },
                  ].map((method) => (
                    <button key={method.name} type="button" onClick={() => setPaymentMethod(method.name as PaymentMethod)} style={{ borderRadius: 12, border: `1.5px solid ${paymentMethod === method.name ? '#6F7FA5' : '#E0DDD8'}`, background: paymentMethod === method.name ? '#ECF2FF' : '#FFFFFF', padding: '10px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: paymentMethod === method.name ? '#21243D' : '#8F93AF', fontSize: 12, fontWeight: 600 }}>
                      <span>{method.icon}</span><span>{method.name}</span>
                    </button>
                  ))}
                </div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C526E', marginBottom: 6 }}>
                  {paymentMethod === 'Card' ? 'Card Number' : paymentMethod === 'UPI' ? 'UPI ID' : 'Account / Wallet'}
                </label>
                <input value={paymentMethod === 'Card' ? '1234 5678 9012 3456' : paymentMethod === 'UPI' ? 'yourname@upi' : paymentMethod} readOnly style={fieldStyle} />
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C526E', marginBottom: 6 }}>Full Name</label>
                <input value="Rahul Sharma" readOnly style={fieldStyle} />
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C526E', marginBottom: 6 }}>Email Address</label>
                <input value="rahul@email.com" readOnly style={fieldStyle} />
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C526E', marginBottom: 6 }}>Phone Number</label>
                <input value="+91 98765 43210" readOnly style={{ ...fieldStyle, marginBottom: 14 }} />
                <button type="button" onClick={handlePayClick} style={{ width: '100%', borderRadius: 10, border: 'none', background: '#F4A91F', color: '#FFFFFF', fontSize: 14, fontWeight: 700, padding: '11px 14px', cursor: 'pointer' }}>{`Pay ₹${active.total} Securely ->`}</button>
              </>
            )}
            {step === 'processing' && (
              <div style={{ minHeight: 360, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid #E7E2D9', borderTopColor: '#F4A91F', animation: 'spin 1s linear infinite', margin: '0 auto 14px' }} />
                <p style={{ textAlign: 'center', margin: '0 0 6px', fontSize: 34, lineHeight: 1.1, color: '#1F243A', fontFamily: '"Cormorant Garamond", Georgia, serif' }}>Processing your payment...</p>
                <p style={{ textAlign: 'center', margin: '0 0 22px', fontSize: 12, color: '#8F93AF' }}>Please wait, do not close this window.</p>
                <button type="button" style={{ width: '100%', borderRadius: 10, border: 'none', background: '#F4A91F', color: '#FFFFFF', fontSize: 14, fontWeight: 700, padding: '11px 14px', cursor: 'default' }}>Processing...</button>
              </div>
            )}
            <p style={{ margin: '8px 0 0', textAlign: 'center', fontSize: 10, color: '#8F93AF' }}>256-bit SSL encrypted · Secured Payments</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 980px) {
          .rise-modal-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .rise-modal-left {
            border-bottom: none !important;
            border-right: 1px solid #e4e2df;
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function AscentCheckoutModal({ cycle, onClose }: { cycle: BillingCycle; onClose: () => void }) {
  const cycleConfig: Record<BillingCycle, { label: string; perMonth: string; total: string; save: string; strike: string }> = {
    monthly: { label: 'Monthly', perMonth: '999', total: '999.00', save: '', strike: '179.82' },
    quarterly: { label: 'Quarterly', perMonth: '799', total: '2397.00', save: 'Save 20%', strike: '479.46' },
    yearly: { label: 'Yearly', perMonth: '599', total: '7188.00', save: 'Save 40%', strike: '1437.60' },
  };
  const active = cycleConfig[cycle];
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const fieldStyle = { width: '100%', borderRadius: 10, border: '1px solid #DFDBD6', background: '#FFFFFF', padding: '10px 12px', fontSize: 14, color: '#8F93AF', marginBottom: 10 } as const;
  const methodValue = paymentMethod === 'UPI' ? 'UPI rahul@upi' : paymentMethod;

  const handlePayClick = () => {
    setStep('processing');
    window.setTimeout(() => setStep('success'), 1800);
  };

  if (step === 'success') {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(8, 15, 35, 0.35)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ width: '100%', maxWidth: 520, borderRadius: 28, background: '#F8F8F8', border: '1px solid #E5E7EB', position: 'relative', overflow: 'hidden' }}>
          <button type="button" aria-label="Close" onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, width: 34, height: 34, borderRadius: '50%', border: 'none', background: '#ECEBE7', color: '#8B8FA8', fontSize: 24, lineHeight: '24px', cursor: 'pointer', zIndex: 2 }}>×</button>
          <div style={{ background: '#030C23', padding: '28px 24px 30px', textAlign: 'center' }}>
            <div style={{ width: 74, height: 74, borderRadius: '50%', background: 'rgba(76, 215, 183, 0.18)', border: '2px solid rgba(76, 215, 183, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', color: '#79F5CF', fontSize: 40, fontWeight: 700 }}>✓</div>
            <h3 style={{ margin: '0 0 8px', color: '#FFFFFF', fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 44, fontWeight: 600, lineHeight: 1.05 }}>Payment Successful! 🎉</h3>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.60)', fontSize: 16 }}>Welcome to the Ascent Plan your journey to the civil services starts now.</p>
          </div>
          <div style={{ padding: '20px 24px 24px' }}>
            <div style={{ borderRadius: 12, background: '#F2EFEB', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 12, letterSpacing: '1px', color: '#8F93AF', fontWeight: 700, textTransform: 'uppercase' }}>Transaction ID</div>
                <div style={{ fontSize: 32, color: '#22263E', fontWeight: 700, fontFamily: '"Cormorant Garamond", Georgia, serif' }}>RWJ-2026-05-84729</div>
              </div>
              <button type="button" style={{ border: 'none', background: 'transparent', color: '#E8A820', fontWeight: 700, cursor: 'pointer' }}>Copy</button>
            </div>
            <div style={{ borderTop: '1px solid #E6E3DE', borderBottom: '1px solid #E6E3DE', marginBottom: 14 }}>
              {[
                ['Plan', `Ascent — ${active.label}`],
                ['Amount Paid', `₹${active.total}(incl. GST)`],
                ['Next Billing Date', 'June 6, 2026'],
                ['Billed To', 'rahul@email.com'],
                ['Payment Method', methodValue],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: label === 'Payment Method' ? 'none' : '1px solid #E6E3DE' }}>
                  <span style={{ color: '#8D91AD', fontSize: 24, fontFamily: '"Cormorant Garamond", Georgia, serif' }}>{label}</span>
                  <span style={{ color: label === 'Amount Paid' ? '#E8A820' : '#252A42', fontSize: 26, fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 700 }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ borderRadius: 12, background: '#CEF2DA', padding: '14px 16px', marginBottom: 16, color: '#0D7A4B' }}>
              <div style={{ fontWeight: 700, fontSize: 27, fontFamily: '"Cormorant Garamond", Georgia, serif' }}>🚀 Your Rise access is now live</div>
              <div style={{ fontSize: 20, marginTop: 2, fontFamily: '"Cormorant Garamond", Georgia, serif' }}>All features unlocked click below to set up your profile</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 10, marginBottom: 14 }}>
              <button type="button" style={{ borderRadius: 12, border: 'none', background: '#F4A91F', color: '#FFFFFF', fontSize: 26, fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 700, padding: '12px 16px', cursor: 'pointer' }}>Set Up My Dashboard {'->'}</button>
              <button type="button" style={{ borderRadius: 12, border: '1.5px solid #D9D5CD', background: '#FFFFFF', color: '#3E4465', fontSize: 24, fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 700, padding: '12px 16px', cursor: 'pointer' }}>Download Receipt</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(8, 15, 35, 0.35)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 860, maxHeight: '92vh', overflowY: 'auto', borderRadius: 20, background: '#F8F8F8', border: '1px solid #E5E7EB', position: 'relative' }}>
        <button type="button" aria-label="Close" onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, width: 34, height: 34, borderRadius: '50%', border: 'none', background: '#ECEBE7', color: '#8B8FA8', fontSize: 24, lineHeight: '24px', cursor: 'pointer', zIndex: 2 }}>×</button>
        <div className="rise-modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', minHeight: 560 }}>
          <div className="rise-modal-left" style={{ padding: '20px 18px 16px', borderBottom: '1px solid #E4E2DF' }}>
            <p style={{ margin: '0 0 12px', display: 'inline-block', borderRadius: 999, padding: '5px 10px', background: '#F8EBCF', color: '#E8A820', fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Ascent Plan</p>
            <h3 style={{ margin: '0 0 6px', fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 40, lineHeight: 1, color: '#21243D' }}>Ascent</h3>
            <p style={{ margin: '0 0 12px', color: '#8F93AF', fontSize: 11, lineHeight: 1.35 }}>Unlimited tools, zero limits. For aspirants who leave nothing to chance.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 14 }}>
              {([
                { id: 'monthly', amount: '999', save: '' },
                { id: 'quarterly', amount: '799', save: 'Save 20%' },
                { id: 'yearly', amount: '599', save: 'Save 40%' },
              ] as const).map((item) => {
                const selected = cycle === item.id;
                return (
                  <div key={item.id} style={{ borderRadius: 12, border: `1.5px solid ${selected ? '#E8A820' : '#E5E0D8'}`, background: selected ? '#F9EED3' : '#FFFFFF', padding: '10px 12px' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: selected ? '#E8A820' : '#8F93AF', marginBottom: 2 }}>{item.id.charAt(0).toUpperCase() + item.id.slice(1)}</div>
                    <div style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 28, lineHeight: 1.05, fontWeight: 700, color: '#21243D' }}>₹{item.amount}/mo</div>
                    {item.save ? <div style={{ color: '#1C9A4D', fontSize: 11, fontWeight: 700 }}>{item.save}</div> : <div style={{ height: 16 }} />}
                  </div>
                );
              })}
            </div>
            <div style={{ background: '#F0ECE8', borderRadius: 14, padding: '14px 14px 12px', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#5D6280', marginBottom: 6 }}><span>Ascent Plan — {active.label}</span><span>₹{active.perMonth}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#5D6280', marginBottom: 6 }}><span>GST (18% Included)</span><span style={{ textDecoration: 'line-through' }}>₹{active.strike}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#18924A', marginBottom: 8 }}><span>7-Day Money-Back Guarantee</span><span>✓ Included</span></div>
              <div style={{ height: 1, background: '#D9D3CC', marginBottom: 8 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontWeight: 700, color: '#1B213B' }}>
                <span style={{ fontSize: 16 }}>Total Payable</span>
                <span style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 34 }}>₹{active.total}</span>
              </div>
            </div>
          </div>

          <div className="rise-modal-right" style={{ padding: '20px 18px 16px' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 18, lineHeight: 1.1, color: '#1F243A', fontWeight: 700 }}>Complete Your Purchase</h4>
            {step === 'form' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, marginBottom: 12 }}>
                  {[
                    { name: 'UPI', icon: '📱' },
                    { name: 'Card', icon: '💳' },
                    { name: 'Net Banking', icon: '🏦' },
                    { name: 'Wallet', icon: '👛' },
                  ].map((method) => (
                    <button key={method.name} type="button" onClick={() => setPaymentMethod(method.name as PaymentMethod)} style={{ borderRadius: 12, border: `1.5px solid ${paymentMethod === method.name ? '#6F7FA5' : '#E0DDD8'}`, background: paymentMethod === method.name ? '#ECF2FF' : '#FFFFFF', padding: '10px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: paymentMethod === method.name ? '#21243D' : '#8F93AF', fontSize: 12, fontWeight: 600 }}>
                      <span>{method.icon}</span><span>{method.name}</span>
                    </button>
                  ))}
                </div>

                {paymentMethod === 'Card' ? (
                  <>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C526E', marginBottom: 6 }}>Cardholder Name</label>
                    <input value="As on card" readOnly style={fieldStyle} />
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C526E', marginBottom: 6 }}>Card Number</label>
                    <input value="1234 5678 9012 3456" readOnly style={fieldStyle} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C526E', marginBottom: 6 }}>Expiry</label>
                        <input value="MM / YY" readOnly style={fieldStyle} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C526E', marginBottom: 6 }}>CVV</label>
                        <input value="•••" readOnly style={fieldStyle} />
                      </div>
                    </div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C526E', marginBottom: 6 }}>Full Name</label>
                    <input value="Rahul Sharma" readOnly style={fieldStyle} />
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C526E', marginBottom: 6 }}>Email Address</label>
                    <input value="rahul@email.com" readOnly style={{ ...fieldStyle, marginBottom: 14 }} />
                  </>
                ) : paymentMethod === 'Net Banking' ? (
                  <>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C526E', marginBottom: 6 }}>Select Your Bank</label>
                    <input value="SBI" readOnly style={fieldStyle} />
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C526E', marginBottom: 6 }}>Full Name</label>
                    <input value="Rahul Sharma" readOnly style={fieldStyle} />
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C526E', marginBottom: 6 }}>Email Address</label>
                    <input value="rahul@email.com" readOnly style={fieldStyle} />
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C526E', marginBottom: 6 }}>Phone Number</label>
                    <input value="+91 98765 43210" readOnly style={{ ...fieldStyle, marginBottom: 14 }} />
                  </>
                ) : paymentMethod === 'Wallet' ? (
                  <>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C526E', marginBottom: 6 }}>Select Your Wallet</label>
                    <input value="Paytm Wallet" readOnly style={fieldStyle} />
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C526E', marginBottom: 6 }}>Full Name</label>
                    <input value="Rahul Sharma" readOnly style={fieldStyle} />
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C526E', marginBottom: 6 }}>Email Address</label>
                    <input value="rahul@email.com" readOnly style={fieldStyle} />
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C526E', marginBottom: 6 }}>Phone Number</label>
                    <input value="+91 98765 43210" readOnly style={{ ...fieldStyle, marginBottom: 14 }} />
                  </>
                ) : (
                  <>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C526E', marginBottom: 6 }}>UPI ID</label>
                    <input value="yourname@upi" readOnly style={fieldStyle} />
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                      {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map((item) => (
                        <button key={item} type="button" style={{ borderRadius: 999, border: '1px solid #DFDBD6', background: '#fff', color: '#4C526E', fontSize: 12, fontWeight: 600, padding: '6px 12px', cursor: 'default' }}>{item}</button>
                      ))}
                    </div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C526E', marginBottom: 6 }}>Full Name</label>
                    <input value="Rahul Sharma" readOnly style={fieldStyle} />
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C526E', marginBottom: 6 }}>Email Address</label>
                    <input value="rahul@email.com" readOnly style={fieldStyle} />
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C526E', marginBottom: 6 }}>Phone Number</label>
                    <input value="+91 98765 43210" readOnly style={{ ...fieldStyle, marginBottom: 14 }} />
                  </>
                )}
                <button type="button" onClick={handlePayClick} style={{ width: '100%', borderRadius: 10, border: 'none', background: '#F4A91F', color: '#FFFFFF', fontSize: 14, fontWeight: 700, padding: '11px 14px', cursor: 'pointer' }}>{`Pay ₹${active.total} Securely ->`}</button>
              </>
            )}
            {step === 'processing' && (
              <div style={{ minHeight: 360, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', border: '4px solid #E7E2D9', borderTopColor: '#F4A91F', animation: 'spin 1s linear infinite', margin: '0 auto 14px' }} />
                <p style={{ textAlign: 'center', margin: '0 0 6px', fontSize: 34, lineHeight: 1.1, color: '#1F243A', fontFamily: '"Cormorant Garamond", Georgia, serif' }}>Processing your payment...</p>
                <p style={{ textAlign: 'center', margin: '0 0 22px', fontSize: 12, color: '#8F93AF' }}>Please wait, do not close this window.</p>
                <button type="button" style={{ width: '100%', borderRadius: 10, border: 'none', background: '#F4A91F', color: '#FFFFFF', fontSize: 14, fontWeight: 700, padding: '11px 14px', cursor: 'default' }}>Processing...</button>
              </div>
            )}
            <p style={{ margin: '8px 0 0', textAlign: 'center', fontSize: 10, color: '#8F93AF' }}>256-bit SSL encrypted · Secured Payments</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// â”€â”€ Plans page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function ExplorePlansPage() {
  const router = useRouter();
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showRiseCheckout, setShowRiseCheckout] = useState(false);
  const [showAscentCheckout, setShowAscentCheckout] = useState(false);

  const handleUpgrade = () => router.push('/pricing');
  const handleOpenRiseCheckout = () => setShowRiseCheckout(true);
  const handleOpenAscentCheckout = () => setShowAscentCheckout(true);

  useEffect(() => {
    if (!showRiseCheckout && !showAscentCheckout) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowRiseCheckout(false);
        setShowAscentCheckout(false);
      }
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onEsc);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onEsc);
    };
  }, [showRiseCheckout, showAscentCheckout]);

  return (
    <div className="min-h-screen" style={{ background: '#E9EAEE', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <BillingHero />

      <div className="mx-auto mt-3 flex w-full max-w-[1120px] flex-col gap-8 px-4 pb-20 sm:px-6 lg:px-8">

        {/* Billing cycle toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 16 }}>
          <div style={{ display: 'inline-flex', background: '#fff', border: '1px solid rgba(11,22,40,0.09)', borderRadius: 999, padding: 4, boxShadow: '0 2px 8px rgba(11,22,40,0.07)' }}>
            {(['monthly', 'quarterly', 'yearly'] as const).map((c) => (
              <button key={c} type="button" onClick={() => setCycle(c)} style={{
                borderRadius: 999, padding: '9px 22px', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', border: 'none', transition: 'background 0.18s, color 0.18s',
                background: cycle === c ? '#090E1C' : 'transparent',
                color: cycle === c ? '#fff' : '#374560',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
          <span style={{ borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 600, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#16A34A', fontFamily: 'Inter, system-ui, sans-serif', whiteSpace: 'nowrap' }}>
            Save up to 40%
          </span>
        </div>

        {/* 3 plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'start' }}>

          {/* Aspire */}
          <article style={{ borderRadius: 20, border: '1px solid #E5E7EB', background: '#FFFFFF', overflow: 'hidden' }}>
            <div style={{ padding: '28px 24px 24px' }}>
              <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, letterSpacing: '1.6px', textTransform: 'uppercase', color: '#E8B84B', fontFamily: 'Inter, system-ui, sans-serif' }}>Forever Free</p>
              <h3 style={{ margin: 0, fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 28, fontStyle: 'normal', fontWeight: 700, lineHeight: 'normal', color: '#1A1A2E' }}>Aspire</h3>
              <p style={{ margin: '8px 0 20px', fontSize: 13, lineHeight: 1.6, color: '#6B7A99', fontFamily: 'Inter, system-ui, sans-serif' }}>
                Build daily study habits. Begin your UPSC prep without spending a rupee.
              </p>
              <span style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 28, fontStyle: 'normal', fontWeight: 700, lineHeight: 'normal', color: '#E8B84B' }}>Free</span>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9AA3B8', fontFamily: 'Inter, system-ui, sans-serif' }}>Always free, forever</p>
              <div style={{ height: 1, background: '#F0EDE8', margin: '20px 0' }} />
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[
                  { text: 'Daily MCQ Challenge', limited: false },
                  { text: 'Daily Mains Challenge', limited: false },
                  { text: 'Daily News Analysis â€“ Hindu & IE', limited: false },
                  { text: '10,000+ Previous Year Questions', limited: false },
                  { text: '2 Mains Evaluations / day', limited: false },
                  { text: 'Jeet AI â€“ 10 conversations / day', limited: false },
                  { text: 'Study Planner & Time Tracker', limited: false },
                  { text: 'Daily Leaderboard & Discussion Forum', limited: false },
                  { text: 'Mental Health Buddy', limited: false },
                  { text: 'Mock Tests â€“ Limited access', limited: true },
                  { text: 'Revision Suite â€“ Limited access', limited: true },
                  { text: 'Performance Analytics â€“ Limited view', limited: true },
                ].map((item) => (
                  <li key={item.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#374151', fontFamily: 'Inter, system-ui, sans-serif' }}>
                    <span style={{ flexShrink: 0, marginTop: 1, color: item.limited ? '#E8B84B' : '#22C55E', fontWeight: 700 }}>{item.limited ? 'â†’' : 'âœ“'}</span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={handleUpgrade} style={{ marginTop: 24, width: '100%', borderRadius: 10, padding: '13px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', border: '1.5px solid #D1D5DB', background: 'transparent', color: '#0C1424', fontFamily: '"DM Sans", Inter, system-ui, sans-serif' }}>
                Get Started Free â†’
              </button>
              <p style={{ margin: '10px 0 0', fontSize: 11, color: '#9AA3B8', textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>No card needed â€¢ Upgrade anytime</p>
            </div>
          </article>

          {/* Rise (Most Popular) */}
          <article style={{ borderRadius: 20, border: '2px solid #E8B84B', background: '#0B1525', overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', background: '#E8B84B', color: '#090E1C', padding: '5px 20px', borderRadius: '0 0 12px 12px', fontSize: 10, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'Inter, system-ui, sans-serif', whiteSpace: 'nowrap' }}>
              Most Popular
            </div>
            <div style={{ padding: '44px 24px 24px' }}>
              <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, letterSpacing: '1.6px', textTransform: 'uppercase', color: '#E8B84B', fontFamily: 'Inter, system-ui, sans-serif' }}>Dedicated Study</p>
              <h3 style={{ margin: 0, fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 28, fontStyle: 'normal', fontWeight: 700, lineHeight: 'normal', color: '#fff' }}>Rise</h3>
              <p style={{ margin: '8px 0 20px', fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                For serious aspirants who study daily and want measurable progress.
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                <span style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 28, fontStyle: 'normal', fontWeight: 700, lineHeight: 'normal', color: '#E8B84B' }}>
                  â‚¹{cycle === 'monthly' ? '499' : cycle === 'quarterly' ? '399' : '299'}
                </span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', paddingBottom: 6, fontFamily: 'Inter, system-ui, sans-serif' }}>/month</span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                {cycle === 'monthly' ? 'Billed monthly' : cycle === 'quarterly' ? 'â‚¹1,197 every 3 months - Save 20%' : 'â‚¹3,588 yearly - Save 40%'}
              </p>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '20px 0' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ color: '#E8B84B', fontWeight: 700 }}>âœ“</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontFamily: 'Inter, system-ui, sans-serif' }}>Everything in Aspire, plus:</span>
              </div>
              {[
                { title: 'EVALUATION', items: ['25 Mains Evaluations / day', '25 Mock Test attempts / day'] },
                { title: 'ANALYTICS', items: ['Full Performance Analytics Dashboard', 'Test Analytics â€“ In-depth insights'] },
                { title: 'REVISION TOOLS', items: ['Full Revision Suite â€“ Flashcards, Mindmaps, Spaced Rep.', 'Jeet AI â€“ 100 conversations / day', 'Live Study Room 24Ã—7', 'Smart Syllabus Tracker'] },
              ].map((section) => (
                <div key={section.title} style={{ marginBottom: 12 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 800, letterSpacing: '1.6px', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', fontFamily: 'Inter, system-ui, sans-serif' }}>{section.title}</p>
                  {section.items.map((item) => (
                    <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 7, fontSize: 13, color: 'rgba(255,255,255,0.75)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                      <span style={{ color: '#E8B84B', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>âœ“</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              ))}
              <button type="button" onClick={handleOpenRiseCheckout} style={{ marginTop: 8, width: '100%', borderRadius: 10, padding: '13px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', background: '#E8B84B', color: '#090E1C', fontFamily: '"DM Sans", Inter, system-ui, sans-serif' }}>
                Unlock Rise Now â†’
              </button>
              <p style={{ margin: '10px 0 0', fontSize: 11, color: '#22C55E', textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
                â† 7-day money-back guarantee, no questions asked
              </p>
            </div>
          </article>

          {/* Ascent */}
          <article style={{ borderRadius: 20, border: '1px solid #E5E7EB', background: '#FFFFFF', overflow: 'hidden' }}>
            <div style={{ padding: '28px 24px 24px' }}>
              <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, letterSpacing: '1.6px', textTransform: 'uppercase', color: '#E8B84B', fontFamily: 'Inter, system-ui, sans-serif' }}>Maximum Edge</p>
              <h3 style={{ margin: 0, fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 28, fontStyle: 'normal', fontWeight: 700, lineHeight: 'normal', color: '#1A1A2E' }}>Ascent</h3>
              <p style={{ margin: '8px 0 20px', fontSize: 13, lineHeight: 1.6, color: '#6B7A99', fontFamily: 'Inter, system-ui, sans-serif' }}>
                Unlimited tools, zero limits. For aspirants who leave nothing to chance.
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                <span style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 28, fontStyle: 'normal', fontWeight: 700, lineHeight: 'normal', color: '#E8B84B' }}>
                  â‚¹{cycle === 'monthly' ? '999' : cycle === 'quarterly' ? '799' : '599'}
                </span>
                <span style={{ fontSize: 13, color: '#9AA3B8', paddingBottom: 6, fontFamily: 'Inter, system-ui, sans-serif' }}>/month</span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9AA3B8', fontFamily: 'Inter, system-ui, sans-serif' }}>
                {cycle === 'monthly' ? 'Billed monthly' : cycle === 'quarterly' ? 'â‚¹2,397 every 3 months - Save 20%' : 'â‚¹7,188 yearly - Save 40%'}
              </p>
              <div style={{ height: 1, background: '#F0EDE8', margin: '20px 0' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ color: '#22C55E', fontWeight: 700 }}>âœ“</span>
                <span style={{ fontSize: 13, color: '#0C1424', fontWeight: 600, fontFamily: 'Inter, system-ui, sans-serif' }}>Everything in Rise, plus:</span>
              </div>
              {[
                { title: 'EVALUATION', items: ['Unlimited Mains Evaluations', 'Unlimited Mock Test practice', 'Jeet AI â€“ Unlimited conversations'] },
                { title: 'MENTOR-LED GROWTH', items: ['Weekly 1-on-1 mentorship (30 min)', 'Personalised Study Roadmap', 'Dedicated Q&A â€“ Priority Responses', 'Monthly Performance Review Call', 'Exclusive Ascent Community', 'Early Access to New Features'] },
              ].map((section) => (
                <div key={section.title} style={{ marginBottom: 12 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 800, letterSpacing: '1.6px', color: '#9AA3B8', textTransform: 'uppercase', fontFamily: 'Inter, system-ui, sans-serif' }}>{section.title}</p>
                  {section.items.map((item) => (
                    <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 7, fontSize: 13, color: '#374151', fontFamily: 'Inter, system-ui, sans-serif' }}>
                      <span style={{ color: '#22C55E', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>âœ“</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              ))}
              <button type="button" onClick={handleOpenAscentCheckout} style={{ marginTop: 8, width: '100%', borderRadius: 10, padding: '13px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', background: '#090E1C', color: '#fff', fontFamily: '"DM Sans", Inter, system-ui, sans-serif' }}>
                Get Ascent Planâ†’
              </button>
              <p style={{ margin: '10px 0 0', fontSize: 11, color: '#22C55E', textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
                â† 7-day money-back guarantee included
              </p>
            </div>
          </article>

        </div>

        {/* Trust bar */}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 12, paddingBottom: 8 }}>
          {[
            { icon: 'ðŸ”’', text: 'Secure Payments' },
            { icon: 'â†©', text: '7-Day Money-Back Guarantee' },
            { icon: 'âœ•', text: 'Cancel Anytime' },
            { icon: 'ðŸ‘¥', text: '15,000+ UPSC aspirants' },
          ].map((item) => (
            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 7, borderRadius: 999, border: '1px solid #E5E7EB', background: '#fff', padding: '8px 16px', fontSize: 12, fontWeight: 500, color: '#374151', fontFamily: 'Inter, system-ui, sans-serif', boxShadow: '0 1px 4px rgba(11,22,40,0.06)' }}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>

        {/* â”€â”€ Feature Breakdown â”€â”€ */}
        <section style={{ paddingBottom: 16 }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ display: 'block', width: 36, height: 1, background: 'linear-gradient(to right, transparent, #C8972A)' }} />
              <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 700, fontSize: 10, letterSpacing: '2px', color: '#C8972A', textTransform: 'uppercase' }}>
                Feature Breakdown
              </span>
              <span style={{ display: 'block', width: 36, height: 1, background: 'linear-gradient(to left, transparent, #C8972A)' }} />
            </div>
            <h2 style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 44, fontStyle: 'normal', fontWeight: 400, lineHeight: '51.92px', color: '#1A1A2E', textAlign: 'center', margin: 0 }}>
              Everything, Side by Side
            </h2>
          </div>

          {/* Comparison table */}
          <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter, system-ui, sans-serif' }}>
              {/* Header row */}
              <thead>
                <tr style={{ background: '#0B1525' }}>
                  <th style={{ padding: '18px 20px', textAlign: 'center', width: '40%', fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 44, fontStyle: 'normal', fontWeight: 400, lineHeight: '51.92px', color: '#fff' }}>
                    Features
                  </th>
                  <th style={{ padding: '18px 16px', textAlign: 'center', fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 44, fontStyle: 'normal', fontWeight: 400, lineHeight: '51.92px', color: '#fff' }}>
                    Aspire
                  </th>
                  <th style={{ padding: '18px 16px', textAlign: 'center', background: 'rgba(232,184,75,0.12)' }}>
                    <span style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 44, fontStyle: 'normal', fontWeight: 400, lineHeight: '51.92px', color: '#E8B84B' }}>Rise</span>
                    <span style={{ marginLeft: 6, fontSize: 20 }}>â­</span>
                  </th>
                  <th style={{ padding: '18px 16px', textAlign: 'center', fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 44, fontStyle: 'normal', fontWeight: 400, lineHeight: '51.92px', color: '#fff' }}>
                    Ascent
                  </th>
                </tr>
              </thead>
              <tbody>
                {([
                  { feature: 'Daily MCQ Challenge', sub: 'Subject & topic-wise with explanations', aspire: '10 / day', rise: 'Unlimited', ascent: 'Unlimited' },
                  { feature: 'Daily Mains Challenge', sub: '', aspire: 'âœ“', rise: 'âœ“', ascent: 'âœ“' },
                  { feature: 'Daily News Analysis', sub: 'The Hindu & Indian Express', aspire: 'âœ“', rise: 'âœ“', ascent: 'âœ“' },
                  { feature: 'Daily Leaderboard', sub: '', aspire: 'âœ“', rise: 'âœ“', ascent: 'âœ“' },
                  { feature: 'Mains Evaluations', sub: 'Instant UPSC marking scheme feedback', aspire: '2 / day', rise: '25 / day', ascent: 'Unlimited' },
                  { feature: '10,000+ Previous Year Questions', sub: '', aspire: 'âœ“', rise: 'âœ“', ascent: 'âœ“' },
                  { feature: 'Mock Test Attempts', sub: 'Full-length Prelims & Mains simulations', aspire: 'Limited', rise: '25 / day', ascent: 'Unlimited' },
                  { feature: 'Syllabus Tracker', sub: 'Personalized UPSC Syllabus Mapping', aspire: 'Limited', rise: 'Unlimited', ascent: 'Unlimited' },
                  { feature: 'Jeet AI Conversations', sub: 'UPSC-preparation partner', aspire: '10 / day', rise: '100 / day', ascent: 'Unlimited' },
                  { feature: 'Performance Analytics Dashboard', sub: '', aspire: 'Limited', rise: 'âœ“', ascent: 'âœ“' },
                  { feature: 'Test Analytics', sub: 'Deep score breakdowns', aspire: 'â€”', rise: 'âœ“', ascent: 'âœ“' },
                  { feature: 'Revision Suite', sub: 'Flashcards, Mindmaps, Spaced Repetition', aspire: 'Limited', rise: 'Full Access', ascent: 'Full Access' },
                  { feature: 'Discussion Forum', sub: '', aspire: 'âœ“', rise: 'âœ“', ascent: 'âœ“' },
                  { feature: 'Live Study Room 24Ã—7', sub: '', aspire: 'Limited', rise: 'âœ“', ascent: 'âœ“' },
                  { feature: 'Mental Health Buddy', sub: '', aspire: 'âœ“', rise: 'âœ“', ascent: 'âœ“' },
                  { feature: 'Weekly 1-on-1 Mentorship', sub: '30 minutes per session', aspire: 'â€”', rise: 'â€”', ascent: 'Weekly' },
                  { feature: 'Personalised Study Roadmap', sub: '', aspire: 'â€”', rise: 'â€”', ascent: 'âœ“' },
                  { feature: 'Dedicated Q&A Priority Responses', sub: '', aspire: 'â€”', rise: 'â€”', ascent: 'âœ“' },
                  { feature: 'Monthly Performance Review Call', sub: '', aspire: 'â€”', rise: 'â€”', ascent: 'âœ“' },
                ] as { feature: string; sub: string; aspire: string; rise: string; ascent: string }[]).map((row, i) => {
                  const cellStyle = (val: string, isRise = false): React.CSSProperties => ({
                    padding: '13px 16px',
                    textAlign: 'center' as const,
                    fontSize: 13,
                    fontWeight: val === 'âœ“' || val === 'â€”' ? 600 : 500,
                    color: val === 'âœ“' ? '#22C55E'
                      : val === 'â€”' ? '#CBD5E1'
                      : val === 'Limited' || val === 'Unlimited' || val === 'Full Access' || val === 'Weekly' ? '#E8B84B'
                      : '#1A2540',
                    background: isRise ? 'rgba(232,184,75,0.04)' : 'transparent',
                    borderBottom: '1px solid #F3F4F6',
                  });

                  return (
                    <tr key={row.feature} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                      <td style={{ padding: '13px 20px', borderBottom: '1px solid #F3F4F6' }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#1A2540', display: 'block' }}>{row.feature}</span>
                        {row.sub && <span style={{ fontSize: 11, color: '#9AA3B8', display: 'block', marginTop: 2 }}>{row.sub}</span>}
                      </td>
                      <td style={cellStyle(row.aspire)}>{row.aspire}</td>
                      <td style={cellStyle(row.rise, true)}>{row.rise}</td>
                      <td style={cellStyle(row.ascent)}>{row.ascent}</td>
                    </tr>
                  );
                })}

                {/* CTA row */}
                <tr style={{ background: '#fff' }}>
                  <td style={{ padding: '20px' }} />
                  <td style={{ padding: '20px 16px', textAlign: 'center' }}>
                    <button type="button" onClick={handleUpgrade} style={{ borderRadius: 8, border: '1.5px solid #D1D5DB', background: 'transparent', padding: '10px 20px', fontSize: 13, fontWeight: 600, color: '#1A2540', cursor: 'pointer', fontFamily: '"DM Sans", Inter, system-ui, sans-serif', whiteSpace: 'nowrap' }}>
                      Start Free
                    </button>
                  </td>
                  <td style={{ padding: '20px 16px', textAlign: 'center', background: 'rgba(232,184,75,0.04)' }}>
                    <button type="button" onClick={handleOpenRiseCheckout} style={{ borderRadius: 8, border: 'none', background: '#E8B84B', padding: '10px 20px', fontSize: 13, fontWeight: 600, color: '#090E1C', cursor: 'pointer', fontFamily: '"DM Sans", Inter, system-ui, sans-serif', whiteSpace: 'nowrap' }}>
                      Unlock Rise
                    </button>
                  </td>
                  <td style={{ padding: '20px 16px', textAlign: 'center' }}>
                    <button type="button" onClick={handleOpenAscentCheckout} style={{ borderRadius: 8, border: 'none', background: '#090E1C', padding: '10px 20px', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: '"DM Sans", Inter, system-ui, sans-serif', whiteSpace: 'nowrap' }}>
                      Get Ascent
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* â”€â”€ Why Rise With Jeet? â”€â”€ */}
        <section>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ display: 'block', width: 36, height: 1, background: 'linear-gradient(to right, transparent, #C8972A)' }} />
              <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 700, fontSize: 10, letterSpacing: '2px', color: '#C8972A', textTransform: 'uppercase' }}>The Ecosystem</span>
              <span style={{ display: 'block', width: 36, height: 1, background: 'linear-gradient(to left, transparent, #C8972A)' }} />
            </div>
            <h2 style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 44, fontWeight: 400, lineHeight: '51.92px', color: '#1A1A2E', margin: '0 0 12px' }}>
              Why Rise With Jeet?
            </h2>
            <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, color: '#6B7A99', margin: 0, maxWidth: 440, marginInline: 'auto', lineHeight: 1.6, textAlign: 'center' }}>
              Not just another coaching â€” the complete UPSC operating system for India&apos;s brightest minds.
            </p>
          </div>

          {/* 4Ã—2 feature grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { icon: 'ðŸŽ¯', iconBg: '#FEF3C7', title: 'Daily MCQ Practice', desc: 'Subject-wise & topic-wise MCQs with detailed explanations. New questions every day, curated by experts.' },
              { icon: 'ðŸ“Š', iconBg: '#EFF6FF', title: 'Deep Analytics', desc: 'Topic-level breakdowns, readiness scores, and weak-area detection.' },
              { icon: 'ðŸ“…', iconBg: '#FFFBEB', title: 'Smart Planning', desc: 'Syllabus tracker, planner and spaced repetition so nothing slips through.' },
              { icon: 'ðŸ‘¥', iconBg: '#F0FDF4', title: 'Live Community', desc: 'Study alongside 15,000 aspirants in live rooms and accountability groups.' },
              { icon: 'ðŸ“°', iconBg: '#F8FAFC', title: 'Daily Current Affairs', desc: 'Hindu & IE analysis connecting today\'s news directly to the UPSC syllabus.' },
              { icon: 'âœï¸', iconBg: '#FFFBEB', title: 'Daily Answer Writing', desc: 'Daily mains practice with AI-powered instant evaluation and UPSC-style marking schemes.' },
              { icon: 'ðŸ§ ', iconBg: '#FFF0F3', title: 'Smart Revision', desc: 'Flashcards, mindmaps, spaced repetition â€” study once, remember forever.' },
              { icon: 'ðŸ“š', iconBg: '#F8FAFC', title: 'Previous Year Questions', desc: '30 years of PYQs with trend analysis, topic clustering, and examiner insights.' },
            ].map((card) => (
              <div key={card.title} style={{ background: '#fff', borderRadius: 14, border: '1px solid #F0EDE8', padding: '20px 18px', boxShadow: '0 1px 4px rgba(11,22,40,0.05)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: card.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 14 }}>
                  {card.icon}
                </div>
                <p style={{ margin: '0 0 6px', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, fontWeight: 700, color: '#1A2540' }}>{card.title}</p>
                <p style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12, color: '#6B7A99', lineHeight: 1.6 }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* â”€â”€ What Our Learners Are Saying â”€â”€ */}
        <section style={{ paddingBottom: 16 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ display: 'block', width: 36, height: 1, background: 'linear-gradient(to right, transparent, #C8972A)' }} />
              <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 700, fontSize: 10, letterSpacing: '2px', color: '#C8972A', textTransform: 'uppercase' }}>Aspirant Stories</span>
              <span style={{ display: 'block', width: 36, height: 1, background: 'linear-gradient(to left, transparent, #C8972A)' }} />
            </div>
            <h2 style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 44, fontWeight: 400, lineHeight: '51.92px', color: '#1A1A2E', margin: 0 }}>
              What Our Learners Are Saying
            </h2>
          </div>

          {/* 3 testimonial cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              {
                stars: 5,
                quote: '"The AI evaluation changed everything. Waiting weeks for mains feedback was killing my momentum now I get detailed marking in seconds. My answer quality improved significantly."',
                name: 'Priya Sharma',
                role: 'UPSC CSE 2025 Mains Aspirant',
                initial: 'P',
                color: '#7C3AED',
              },
              {
                stars: 5,
                quote: '"Daily MCQs and the leaderboard kept me disciplined across 6 months. Analytics showed me exactly which paper needed attention â€” saved me months of scattered prep."',
                name: 'Rahul',
                role: 'UPSC CSE 2025 Mains Qualified',
                initial: 'R',
                color: '#2563EB',
              },
              {
                stars: 5,
                quote: '"Current affairs finally clicked with RiseWithJeet. The way they connect The Hindu to the syllabus is unmatched. Cleared Prelims on my very first attempt."',
                name: 'Anjali',
                role: 'UPSC CSE 2025 Prelims Qualified',
                initial: 'A',
                color: '#16A34A',
              },
            ].map((t) => (
              <div key={t.name} style={{ background: '#fff', borderRadius: 16, border: '1px solid #F0EDE8', padding: '24px 22px', boxShadow: '0 1px 4px rgba(11,22,40,0.05)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ color: '#E8B84B', fontSize: 14, letterSpacing: 2 }}>{'â˜…'.repeat(t.stars)}</div>
                <p style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', fontSize: 13, color: '#374151', lineHeight: 1.75, flex: 1 }}>{t.quote}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>
                    {t.initial}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', fontSize: 13, fontWeight: 700, color: '#1A2540' }}>{t.name}</p>
                    <p style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', fontSize: 11, color: '#9AA3B8' }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* â”€â”€ FAQ â”€â”€ */}
        <section>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ display: 'block', width: 36, height: 1, background: 'linear-gradient(to right, transparent, #C8972A)' }} />
              <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 700, fontSize: 10, letterSpacing: '2px', color: '#C8972A', textTransform: 'uppercase' }}>FAQ</span>
              <span style={{ display: 'block', width: 36, height: 1, background: 'linear-gradient(to left, transparent, #C8972A)' }} />
            </div>
            <h2 style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 44, fontWeight: 400, lineHeight: '51.92px', color: '#1A1A2E', margin: '0 0 10px' }}>
              Frequently Asked Questions
            </h2>
            <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, color: '#6B7A99', margin: 0 }}>
              Everything you need to know before you begin your journey.
            </p>
          </div>

          {/* 2-column FAQ grid */}
          {(() => {
            const faqs = [
              { q: 'Is Aspire really free forever?', a: 'Yes! Aspire is completely free with no expiry date, no credit card required, and no hidden charges. You get access to daily MCQs, mains challenge, current affairs, and more.' },
              { q: "What's the difference between Rise and Ascent?", a: 'Rise gives you unlimited AI evaluations, full analytics, and the complete revision suite. Ascent adds weekly 1-on-1 mentorship, a personalised roadmap, priority Q&A support, and monthly performance review calls.' },
              { q: 'Is there a money-back guarantee?', a: 'Yes. All paid plans come with a 7-day money-back guarantee, no questions asked. Just reach out to our support team within 7 days of purchase.' },
              { q: 'How much do I save on quarterly & yearly plans?', a: 'Quarterly plans save you ~10% compared to monthly billing. Yearly plans give you up to 40% off â€” the best value for committed aspirants.' },
              { q: 'Can I upgrade or cancel anytime?', a: 'Absolutely. You can upgrade, downgrade, or cancel your subscription at any time from your billing page. No lock-ins, no penalties.' },
              { q: 'How does AI Mains Evaluation work?', a: 'Our AI evaluates your mains answers using UPSC-style marking schemes â€” checking structure, content, presentation, and relevance â€” and gives you detailed feedback within seconds.' },
              { q: 'What is the refund policy?', a: 'We offer a 7-day full refund on all paid plans. After 7 days, refunds are handled case-by-case. Contact our billing team for assistance.' },
              { q: 'Is this suitable for first-attempt aspirants?', a: 'Absolutely. Aspire is designed for beginners building their foundation. As you progress, Rise and Ascent provide deeper tools for serious, exam-ready preparation.' },
            ];
            const left = faqs.filter((_, i) => i % 2 === 0);
            const right = faqs.filter((_, i) => i % 2 === 1);

            const FaqItem = ({ item, idx }: { item: typeof faqs[0]; idx: number }) => {
              const isOpen = openFaq === idx;
              return (
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #F0EDE8', overflow: 'hidden', boxShadow: '0 1px 4px rgba(11,22,40,0.05)' }}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 12 }}
                  >
                    <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, fontWeight: 500, color: '#1A2540' }}>{item.q}</span>
                    <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#FEF3C7', border: '1px solid rgba(232,184,75,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#D97706', fontSize: 16, fontWeight: 400 }}>
                      {isOpen ? 'âˆ’' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0 18px 16px', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 13, color: '#6B7A99', lineHeight: 1.7 }}>
                      {item.a}
                    </div>
                  )}
                </div>
              );
            };

            return (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {left.map((item, i) => <FaqItem key={item.q} item={item} idx={i * 2} />)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {right.map((item, i) => <FaqItem key={item.q} item={item} idx={i * 2 + 1} />)}
                </div>
              </div>
            );
          })()}
        </section>

      </div>

      {/* â”€â”€ CTA Banner â€” full width outside the constrained container â”€â”€ */}
      <section style={{ margin: 0, borderRadius: 0, background: 'linear-gradient(160deg, #0A1120 0%, #0F1C35 100%)', padding: '52px 48px 44px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.025) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{ display: 'block', width: 36, height: 1, background: 'linear-gradient(to right, transparent, #C8972A)' }} />
            <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 700, fontSize: 10, letterSpacing: '2px', color: '#C8972A', textTransform: 'uppercase' }}>Still Have Doubts?</span>
            <span style={{ display: 'block', width: 36, height: 1, background: 'linear-gradient(to left, transparent, #C8972A)' }} />
          </div>
          <h2 style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 400, color: '#fff', lineHeight: 1.2, margin: '0 0 16px' }}>
            Start Your{' '}
            <em style={{ color: '#E8A820', fontStyle: 'italic' }}>UPSC Journey</em>
            <br />the Right Way
          </h2>
          <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.5)', maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.65 }}>
            Join 15,000+ aspirants. Start free with Aspire â€” no card, no commitment, no expiry. Upgrade only when you feel it.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
            <button type="button" onClick={handleUpgrade} style={{ borderRadius: 10, border: 'none', padding: '14px 28px', fontFamily: '"DM Sans", Inter, system-ui, sans-serif', fontSize: 15, fontWeight: 700, color: '#090E1C', background: '#E8B84B', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Start Free with Aspire â†’
            </button>
            <button type="button" style={{ borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.2)', padding: '14px 28px', fontFamily: '"DM Sans", Inter, system-ui, sans-serif', fontSize: 15, fontWeight: 600, color: '#fff', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Contact Us
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, borderRadius: 999, background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)', padding: '7px 16px' }}>
              <span style={{ fontSize: 14 }}>ðŸ’¬</span>
              <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12, fontWeight: 600, color: '#25D366' }}>Text on WhatsApp</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 14 }}>ðŸ“§</span>
              <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>together@risewithjeet.com</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 14 }}>ðŸ“ž</span>
              <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>+91 83570 56891</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, borderRadius: 999, background: 'rgba(0,136,204,0.15)', border: '1px solid rgba(0,136,204,0.3)', padding: '7px 16px' }}>
              <span style={{ fontSize: 14 }}>âœˆï¸</span>
              <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12, fontWeight: 600, color: '#29B6F6' }}>Text on Telegram</span>
            </div>
          </div>
        </div>
      </section>
      {showRiseCheckout && <RiseCheckoutModal cycle={cycle} onClose={() => setShowRiseCheckout(false)} />}
      {showAscentCheckout && <AscentCheckoutModal cycle={cycle} onClose={() => setShowAscentCheckout(false)} />}
    </div>
  );
}



