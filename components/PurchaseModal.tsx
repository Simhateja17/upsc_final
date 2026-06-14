'use client';

import React, { useMemo, useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { billingService, pricingService } from '@/lib/services';
import { useAuth } from '@/contexts/AuthContext';

interface PurchaseModalProps {
  open: boolean;
  onClose: () => void;
  itemType: 'plan' | 'test_series';
  itemId: string;
  itemName: string;
  amount: number;
  onSuccess?: () => void;
}

type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet';
type PlanKey = 'monthly' | 'quarterly' | 'yearly';
type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, callback: (response: any) => void) => void;
    };
  }
}

const PLAN_OPTIONS: Array<{ key: PlanKey; label: string; price: number; subtitle?: string }> = [
  { key: 'monthly', label: 'Monthly', price: 499 },
  { key: 'quarterly', label: 'Quarterly', price: 399, subtitle: 'Save 20%' },
  { key: 'yearly', label: 'Yearly', price: 299, subtitle: 'Save 40%' },
];

const PAYMENT_TABS: Array<{ id: PaymentMethod; label: string; icon: string }> = [
  { id: 'upi', label: 'UPI', icon: 'U' },
  { id: 'card', label: 'Card', icon: 'C' },
  { id: 'netbanking', label: 'Net Banking', icon: 'N' },
  { id: 'wallet', label: 'Wallet', icon: 'W' },
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: '42px',
  border: '1px solid #D7DCE5',
  borderRadius: '9px',
  padding: '0 12px',
  fontSize: '14px',
  color: '#1D2330',
  outline: 'none',
  background: '#FFFFFF',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: '13px',
  lineHeight: '18px',
  color: '#394154',
  fontWeight: 500,
  marginBottom: '6px',
  display: 'block',
};

const listItems = [
  '25 Mains Evaluations / day',
  '25 Mock Test attempts / day',
  'Full Performance Analytics Dashboard',
  'Full Revision Suite - Flashcards, Mindmaps and Spaced Repetition',
  'Jeet AI Mentor - 100 conversations / day',
  'Live Study Room 24x7',
  'Syllabus Tracker',
];

export default function PurchaseModal(props: PurchaseModalProps) {
  const router = useRouter();
  if (props.itemType === 'test_series') {
    return <TestSeriesCheckoutModal {...props} />;
  }

  if (!props.open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.62)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 420, borderRadius: 16, background: '#fff', padding: 24, boxShadow: '0 24px 70px rgba(15,23,42,0.28)' }}>
        <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#101828' }}>Choose an AutoPay plan</h3>
        <p style={{ margin: '10px 0 20px', fontSize: 14, lineHeight: 1.6, color: '#667085' }}>
          Paid plans now use Razorpay Subscriptions with UPI AutoPay. Continue to the billing page to select a tier and billing cycle.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={props.onClose} style={{ borderRadius: 9, border: '1px solid #D0D5DD', background: '#fff', padding: '10px 14px', fontSize: 13, fontWeight: 700, color: '#344054', cursor: 'pointer' }}>Close</button>
          <button type="button" onClick={() => { props.onClose(); router.push('/dashboard/billing/plans'); }} style={{ borderRadius: 9, border: 'none', background: '#0B1525', padding: '10px 14px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>View plans</button>
        </div>
      </div>
    </div>
  );
}

function TestSeriesCheckoutModal({ open, onClose, itemId, itemName, amount, onSuccess }: PurchaseModalProps) {
  const { user } = useAuth();
  const [isPaying, setIsPaying] = useState(false);
  const [status, setStatus] = useState<'checkout' | 'success' | 'failed'>('checkout');
  const [error, setError] = useState('');

  if (!open) return null;

  const displayName = itemName?.trim() || 'Test Series';
  const payableAmount = Math.max(0, amount);
  const gst = payableAmount > 0 ? payableAmount - payableAmount / 1.18 : 0;
  const baseAmount = payableAmount - gst;

  const closeModal = () => {
    if (!isPaying) onClose();
  };

  const handlePayment = async () => {
    setError('');
    setIsPaying(true);

    try {
      const orderResponse = await billingService.createRazorpayOrder({
        itemType: 'test_series',
        itemId,
      });
      const order = orderResponse?.data ?? orderResponse;

      if (order?.alreadyPurchased) {
        setStatus('success');
        onSuccess?.();
        return;
      }

      if (!window.Razorpay) {
        throw new Error('Razorpay checkout is still loading. Please try again.');
      }

      const checkout = new window.Razorpay({
        key: order.key,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'RiseWithJeet',
        description: displayName,
        order_id: order.order_id || order.providerOrderId,
        prefill: {
          name: [user?.firstName, user?.lastName].filter(Boolean).join(' '),
          email: user?.email || '',
        },
        notes: {
          itemType: 'test_series',
          itemId,
        },
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            await billingService.verifyRazorpayPayment({
              paymentId: order.paymentId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            setStatus('success');
            onSuccess?.();
          } catch (err: any) {
            setStatus('failed');
            setError(err?.message || 'Payment succeeded, but unlocking the test series failed.');
          } finally {
            setIsPaying(false);
          }
        },
        modal: {
          ondismiss: () => setIsPaying(false),
        },
        theme: { color: '#E8B84B' },
      });

      checkout.on('payment.failed', async (response: any) => {
        const reason = response?.error?.description || 'Payment failed';
        try {
          if (order.paymentId) {
            await billingService.markRazorpayPaymentFailed({
              paymentId: order.paymentId,
              status: 'failed',
              failureReason: reason,
            });
          }
        } catch {
          // Razorpay has already surfaced the failure to the buyer.
        }
        setError(reason);
        setStatus('failed');
        setIsPaying(false);
      });

      checkout.open();
    } catch (err: any) {
      setError(err?.message || 'Unable to start payment. Please try again.');
      setStatus('failed');
      setIsPaying(false);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <div
        onClick={e => {
          if (e.target === e.currentTarget) closeModal();
        }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.62)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '18px',
        }}
      >
        <div style={{ width: '100%', maxWidth: '980px', background: '#FFFFFF', borderRadius: '20px', boxShadow: '0 26px 70px rgba(15, 23, 42, 0.32)', overflow: 'hidden', border: '1px solid #E6E8ED' }}>
          {status === 'success' ? (
            <div style={{ padding: '56px 28px', textAlign: 'center' }}>
              <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#ECFDF3', color: '#16A34A', display: 'grid', placeItems: 'center', margin: '0 auto 18px', fontSize: 34, fontWeight: 800 }}>✓</div>
              <h2 style={{ margin: '0 0 8px', color: '#111827', fontSize: 30, fontWeight: 800 }}>Test Series Unlocked</h2>
              <p style={{ margin: '0 auto 22px', maxWidth: 520, color: '#667085', fontSize: 16, lineHeight: 1.5 }}>{displayName} is now available in your enrolled series.</p>
              <button onClick={onClose} style={{ height: 48, border: 'none', borderRadius: 10, background: '#E8B84B', color: '#111827', fontWeight: 800, padding: '0 24px', cursor: 'pointer' }}>
                Continue
              </button>
            </div>
          ) : (
            <div className="purchase-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ padding: '34px 30px', borderRight: '1px solid #E3E7EE', background: '#FBFBFC' }}>
                <span style={{ display: 'inline-block', border: '1px solid #E5B642', color: '#B7791F', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 800, letterSpacing: '2px' }}>TEST SERIES</span>
                <h2 style={{ margin: '18px 0 8px', color: '#101828', fontSize: 38, lineHeight: 1.08, fontWeight: 800 }}>{displayName}</h2>
                <p style={{ margin: 0, color: '#667085', fontSize: 17, lineHeight: 1.45 }}>One-time access to this battle plan, including all published tests, explanations, analytics, and future updates in the series.</p>

                <div style={{ marginTop: 28, borderTop: '1px solid #E5E7EB', paddingTop: 22 }}>
                  <h3 style={{ margin: '0 0 14px', color: '#98A2B3', fontSize: 13, letterSpacing: '3px', fontWeight: 800 }}>WHAT'S INCLUDED</h3>
                  {['Permanent access to this series', 'All tests inside the series', 'Attempt history and performance analytics', 'Future additions to the same series'].map(item => (
                    <div key={item} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 13, color: '#475467', fontSize: 16 }}>
                      <span style={{ color: '#16A34A', fontWeight: 900 }}>✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 24, borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 14, color: '#667085', fontSize: 14 }}>
                  Secured by Razorpay. Your payment details are handled by Razorpay and are not stored on our servers.
                </div>
              </div>

              <div style={{ padding: '34px 30px 28px', position: 'relative' }}>
                <button onClick={closeModal} disabled={isPaying} style={{ position: 'absolute', top: 18, right: 18, width: 38, height: 38, borderRadius: '50%', border: '1px solid #DFE3EB', background: '#FFFFFF', color: '#667085', fontSize: 22, lineHeight: '30px', cursor: isPaying ? 'not-allowed' : 'pointer' }} aria-label="Close">×</button>
                <h3 style={{ margin: '0 0 26px', fontSize: 26, color: '#111827', fontWeight: 800 }}>Order Summary</h3>

                <div style={{ borderRadius: 14, background: '#F8FAFC', padding: 18, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#667085', fontSize: 15, marginBottom: 10 }}>
                    <span>Product</span>
                    <strong style={{ color: '#111827' }}>Test Series</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#667085', fontSize: 15 }}>
                    <span>Access</span>
                    <strong style={{ color: '#111827' }}>Permanent</strong>
                  </div>
                </div>

                <div style={{ borderRadius: 14, background: '#FFF8E5', border: '1px solid #F2E2B8', padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475467', fontSize: 16, marginBottom: 12 }}>
                    <span>{displayName}</span>
                    <strong style={{ color: '#111827' }}>₹{baseAmount.toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#667085', fontSize: 15, marginBottom: 12 }}>
                    <span>GST (18% included)</span>
                    <span>₹{gst.toFixed(2)}</span>
                  </div>
                  <div style={{ borderTop: '1px solid #E8D8AD', paddingTop: 14, display: 'flex', justifyContent: 'space-between', color: '#111827', fontSize: 20, fontWeight: 900 }}>
                    <span>Total Payable</span>
                    <span>₹{payableAmount.toFixed(2)}</span>
                  </div>
                </div>

                {error ? <p style={{ margin: '14px 0 0', color: '#B42318', fontSize: 14 }}>{error}</p> : null}

                <button onClick={handlePayment} disabled={isPaying} style={{ width: '100%', marginTop: 22, height: 52, borderRadius: 10, border: 'none', background: isPaying ? '#CBD5E1' : '#E8B84B', color: '#111827', fontWeight: 900, fontSize: 17, cursor: isPaying ? 'not-allowed' : 'pointer' }}>
                  {isPaying ? 'Opening Razorpay...' : `Continue to Payment →`}
                </button>
                <p style={{ margin: '14px 0 0', textAlign: 'center', color: '#98A2B3', fontSize: 13 }}>256-bit SSL Secure · Powered by Razorpay · PCI DSS Compliant</p>
              </div>
            </div>
          )}
        </div>
        <style>{`
          @media (max-width: 900px) {
            .purchase-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </>
  );
}

function LegacyPurchaseModal({ open, onClose, itemType, itemId, itemName, amount, onSuccess }: PurchaseModalProps) {
  const [step, setStep] = useState<'details' | 'processing' | 'success'>('details');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('monthly');
  const [error, setError] = useState('');

  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const [fullName, setFullName] = useState('Rahul Sharma');
  const [email, setEmail] = useState('rahul@email.com');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [bank] = useState('SBI');
  const [walletName] = useState('Paytm Wallet');

  const payableAmount = useMemo(() => {
    if (amount > 0) return amount;
    return PLAN_OPTIONS.find(p => p.key === selectedPlan)?.price ?? 499;
  }, [amount, selectedPlan]);

  if (!open) return null;

  const displayName = itemName?.trim() || 'Rise Plan';

  const validate = (): string => {
    if (paymentMethod === 'card') {
      if (!cardholderName.trim() || !cardNumber.trim() || !expiry.trim() || !cvv.trim() || !fullName.trim() || !email.trim()) {
        return 'Please fill all required card details.';
      }
      return '';
    }

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      return 'Please fill all required details.';
    }

    return '';
  };

  const handleSubmit = async () => {
    const formError = validate();
    if (formError) {
      setError(formError);
      return;
    }

    setError('');
    setStep('processing');

    try {
      await pricingService.createOrder({
        itemType,
        itemId,
        itemName: displayName,
        amount: payableAmount * 100,
      });

      setTimeout(() => {
        setStep('success');
        onSuccess?.();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Payment failed. Please try again.');
      setStep('details');
    }
  };

  const renderMethodForm = () => {
    if (paymentMethod === 'card') {
      return (
        <>
          <div>
            <label style={labelStyle}>Cardholder Name</label>
            <input style={inputStyle} placeholder="As on card" value={cardholderName} onChange={e => setCardholderName(e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Card Number</label>
            <input style={inputStyle} placeholder="1234 5678 9012 3456" value={cardNumber} onChange={e => setCardNumber(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '8px' }}>
            <div>
              <label style={labelStyle}>Expiry</label>
              <input style={inputStyle} placeholder="MM/YY" value={expiry} onChange={e => setExpiry(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>CVV</label>
              <input style={inputStyle} placeholder="***" value={cvv} onChange={e => setCvv(e.target.value)} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Full Name</label>
            <input style={inputStyle} value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Email Address</label>
            <input style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} />
          </div>
        </>
      );
    }

    if (paymentMethod === 'netbanking') {
      return (
        <>
          <div>
            <label style={labelStyle}>Select Your Bank</label>
            <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#5D6577' }}>{bank}</span>
              <span style={{ color: '#8D96A8' }}>v</span>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Full Name</label>
            <input style={inputStyle} value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Email Address</label>
            <input style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Phone Number</label>
            <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
        </>
      );
    }

    if (paymentMethod === 'wallet') {
      return (
        <>
          <div>
            <label style={labelStyle}>Select Your Wallet</label>
            <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#5D6577' }}>{walletName}</span>
              <span style={{ color: '#8D96A8' }}>v</span>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Full Name</label>
            <input style={inputStyle} value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Email Address</label>
            <input style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Phone Number</label>
            <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
        </>
      );
    }

    return (
      <div>
        <label style={labelStyle}>UPI ID</label>
        <input style={inputStyle} placeholder="name@bank" />
      </div>
    );
  };

  return (
    <div
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(16, 24, 40, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '18px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '980px', background: '#FFFFFF', borderRadius: '20px', boxShadow: '0 26px 70px rgba(15, 23, 42, 0.28)', overflow: 'hidden', border: '1px solid #E6E8ED' }}>
        {step === 'processing' && (
          <div style={{ padding: '80px 24px', textAlign: 'center' }}>
            <div style={{ width: '44px', height: '44px', margin: '0 auto 12px', borderRadius: '50%', border: '4px solid #F59E0B', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ margin: 0, fontSize: '18px', color: '#1F2937', fontWeight: 700 }}>Processing payment...</p>
          </div>
        )}

        {step === 'success' && (
          <div style={{ padding: '80px 24px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '22px', color: '#111827', fontWeight: 700 }}>Payment Successful</p>
          </div>
        )}

        {step === 'details' && (
          <div className="purchase-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            <div style={{ padding: '26px 24px 24px', borderRight: '1px solid #E3E7EE', background: '#FBFBFC' }}>
              <div style={{ marginBottom: '14px' }}>
                <span style={{ display: 'inline-block', background: '#FDE8BE', color: '#D78507', borderRadius: '999px', padding: '4px 10px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.3px' }}>RISE PLAN</span>
              </div>

              <h2 style={{ margin: '0 0 6px', color: '#101828', fontSize: '36px', lineHeight: 1, fontWeight: 700 }}>Rise</h2>
              <p style={{ margin: 0, color: '#98A2B3', fontSize: '20px', lineHeight: 1.35, maxWidth: '440px' }}>The complete ecosystem for focused, daily UPSC preparation.</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: '10px', marginTop: '18px' }}>
                {PLAN_OPTIONS.map(plan => {
                  const active = selectedPlan === plan.key;
                  return (
                    <button key={plan.key} onClick={() => setSelectedPlan(plan.key)} style={{ textAlign: 'left', borderRadius: '12px', border: active ? '1.5px solid #E2A431' : '1px solid #DFE3EA', background: active ? '#F9EBCF' : '#FFFFFF', padding: '12px 10px', cursor: 'pointer' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: active ? '#D08A04' : '#8189A2' }}>{plan.label}</div>
                      <div style={{ fontSize: '30px', fontWeight: 700, color: '#222B3B', marginTop: '3px' }}>Rs.{plan.price}/mo</div>
                      <div style={{ fontSize: '18px', color: '#159947', fontWeight: 600, minHeight: '24px' }}>{plan.subtitle ?? ''}</div>
                    </button>
                  );
                })}
              </div>

              <div style={{ marginTop: '14px', borderRadius: '12px', background: '#F0EEEA', border: '1px solid #E2DFD9', padding: '14px 14px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '24px', color: '#525B6B', marginBottom: '6px' }}>
                  <span>{displayName} - Monthly</span>
                  <span>Rs.{payableAmount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '23px', color: '#676F7D', marginBottom: '5px' }}>
                  <span>GST (18% Included)</span>
                  <span style={{ textDecoration: 'line-through' }}>Rs.89.82</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '24px', color: '#1E9D4F', marginBottom: '8px' }}>
                  <span>7-Day Money-Back Guarantee</span>
                  <span>Included</span>
                </div>
                <div style={{ borderTop: '1px solid #D4D4D8', paddingTop: '9px', display: 'flex', justifyContent: 'space-between', fontSize: '30px', fontWeight: 700, color: '#111827' }}>
                  <span>Total Payable</span>
                  <span>Rs.{payableAmount.toFixed(2)}</span>
                </div>
              </div>

              <ul style={{ margin: '14px 0 0', padding: 0, listStyle: 'none', color: '#626C7F', fontSize: '22px', lineHeight: 1.35 }}>
                {listItems.map(item => (
                  <li key={item} style={{ display: 'flex', gap: '8px', marginBottom: '5px' }}>
                    <span style={{ color: '#0F9D58', fontWeight: 700 }}>+</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ padding: '26px 24px 20px', position: 'relative' }}>
              <button onClick={onClose} style={{ position: 'absolute', top: '12px', right: '12px', width: '34px', height: '34px', borderRadius: '50%', border: '1px solid #DFE3EB', background: '#F4F4F6', color: '#8B92A2', fontSize: '18px', lineHeight: '28px', cursor: 'pointer' }} aria-label="Close">x</button>

              <h3 style={{ margin: '0 0 14px', fontSize: '32px', color: '#111827', fontWeight: 700 }}>Complete Your Purchase</h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '8px', marginBottom: '14px' }}>
                {PAYMENT_TABS.map(tab => {
                  const active = paymentMethod === tab.id;
                  return (
                    <button key={tab.id} onClick={() => setPaymentMethod(tab.id)} style={{ borderRadius: '9px', border: active ? '1.5px solid #2F4063' : '1px solid #DFE3EA', background: active ? '#F5F8FF' : '#FFFFFF', padding: '8px 6px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <span style={{ fontSize: '16px', fontWeight: 700 }}>{tab.icon}</span>
                      <span style={{ fontSize: '11px', color: '#4F566B' }}>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'grid', gap: '9px' }}>{renderMethodForm()}</div>

              {error ? <p style={{ margin: '10px 0 0', color: '#B42318', fontSize: '13px' }}>{error}</p> : null}

              <button onClick={handleSubmit} style={{ width: '100%', marginTop: '14px', height: '48px', borderRadius: '10px', border: 'none', background: '#F2A316', color: '#FFFFFF', fontWeight: 700, fontSize: '18px', cursor: 'pointer' }}>
                Pay Rs.{payableAmount.toFixed(2)} Securely
              </button>

              <p style={{ margin: '10px 0 0', textAlign: 'center', color: '#A0A9B8', fontSize: '13px' }}>256-bit SSL encrypted - Secured Payments</p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1024px) {
          .purchase-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
