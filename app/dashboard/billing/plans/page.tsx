'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { billingService } from '@/lib/services';
import { useAuth } from '@/contexts/AuthContext';

// ── Hero ──────────────────────────────────────────────────────────────────────
function BillingHero() {
  return (
    <div
      className="relative overflow-hidden flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(180deg, #090E1C 0%, #10192F 100%)',
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
          <em style={{ color: '#E8B84B', fontStyle: 'italic', fontWeight: 600 }}>Smarter</em>
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
}

function nextBillingDate(cycle: BillingCycle): string {
  const months = cycle === 'monthly' ? 1 : cycle === 'quarterly' ? 3 : 12;
  return formatDate(addMonths(new Date(), months));
}

function invoiceNumber(razorpayPaymentId: string): string {
  const suffix = razorpayPaymentId.replace(/\D/g, '').slice(-6) || Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  return `RWJ-INV-${new Date().getFullYear()}-${suffix}`;
}

function subtotalFromTotal(total: string): number {
  return parseFloat(total) / 1.18;
}

function gstFromTotal(total: string): number {
  return parseFloat(total) - subtotalFromTotal(total);
}

// ── Invoice Modal ─────────────────────────────────────────────────────────────
interface InvoiceData {
  invoiceNo: string;
  date: string;
  planName: string;
  planLabel: string;
  total: string;
  subtotal: number;
  gst: number;
  billedToName: string;
  billedToEmail: string;
  periodStart: string;
  periodEnd: string;
  razorpayPaymentId: string;
  paymentMethod: string;
}

function InvoiceModal({ data, onClose }: { data: InvoiceData; onClose: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Invoice ${data.invoiceNo}</title>
      <style>
        body { margin: 0; padding: 32px; font-family: Inter, sans-serif; background: #f4f6fa; }
        @media print { body { padding: 0; } }
      </style></head>
      <body>${content.innerHTML}</body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(8,15,35,0.65)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 680,
          background: '#f4f6fa', borderRadius: 24,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          padding: 'clamp(20px, 5vw, 40px) clamp(20px, 5vw, 40px) 32px',
          fontFamily: 'Inter, system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            width: 32, height: 32, borderRadius: '50%',
            border: '1px solid #D1D5DB', background: '#fff',
            color: '#6B7280', fontSize: 18, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >×</button>

        <div ref={printRef}>
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            {/* Logo + company */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#0D1B2E', letterSpacing: '-0.3px', fontFamily: 'Sora, Inter, sans-serif' }}>
                  Rise<span style={{ color: '#0D1B2E' }}>With</span><span style={{ color: '#F5A623' }}>Jeet</span>
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 13.5, color: '#364153' }}>JeetPath Academy Pvt. Ltd.</p>
              <p style={{ margin: '2px 0 0', fontSize: 13.5, color: '#364153' }}>GSTIN: 29AABCR1234A1Z5</p>
            </div>
            {/* Invoice meta */}
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 500, color: '#0A0A0A', letterSpacing: '1px' }}>INVOICE</p>
              <p style={{ margin: '0 0 3px', fontSize: 13.5, color: '#6A7282' }}>
                Invoice #: <span style={{ color: '#364153', fontWeight: 600 }}>{data.invoiceNo}</span>
              </p>
              <p style={{ margin: '0 0 3px', fontSize: 13.5, color: '#6A7282' }}>
                Date: <span style={{ color: '#364153' }}>{data.date}</span>
              </p>
              <p style={{ margin: 0, fontSize: 13.5, color: '#6A7282' }}>
                Due: <span style={{ color: '#364153' }}>{data.date}</span>
              </p>
            </div>
          </div>

          <div style={{ height: 1, background: '#E5E7EB', marginBottom: 20 }} />

          {/* Bill To */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, letterSpacing: '1px', color: '#6A7282', textTransform: 'uppercase' }}>Bill To</p>
            <p style={{ margin: '0 0 2px', fontSize: 18, fontWeight: 500, color: '#0A0A0A' }}>{data.billedToName || 'Aspirant'}</p>
            <p style={{ margin: 0, fontSize: 13.5, color: '#4A5565' }}>{data.billedToEmail}</p>
          </div>

          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1.5fr 60px 100px',
            padding: '8px 0 10px', borderBottom: '0.8px solid #E5E7EB',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', color: '#6A7282', textTransform: 'uppercase',
          }}>
            <span>Description</span>
            <span>Period</span>
            <span style={{ textAlign: 'center' }}>Qty</span>
            <span style={{ textAlign: 'right' }}>Amount</span>
          </div>

          {/* Plan row */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1.5fr 60px 100px',
            padding: '16px 0', borderBottom: '0.8px solid #E5E7EB', alignItems: 'start',
          }}>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 13.5, color: '#0A0A0A' }}>{data.planName} Plan – {data.planLabel}</p>
              <p style={{ margin: 0, fontSize: 11.5, color: '#6A7282' }}>Unlimited MCQs, AI Evaluator, UPSC GPT, Revision Suite</p>
            </div>
            <span style={{ fontSize: 13.5, color: '#0A0A0A', paddingTop: 2 }}>{data.periodStart} – {data.periodEnd}</span>
            <span style={{ fontSize: 13.5, color: '#0A0A0A', textAlign: 'center', paddingTop: 2 }}>1</span>
            <span style={{ fontSize: 13.5, color: '#0A0A0A', textAlign: 'right', paddingTop: 2 }}>₹{data.subtotal.toFixed(2)}</span>
          </div>

          {/* GST row */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1.5fr 60px 100px',
            padding: '14px 0', borderBottom: '0.8px solid #E5E7EB', alignItems: 'center',
          }}>
            <span style={{ fontSize: 13.5, color: '#0A0A0A' }}>GST (18%)</span>
            <span style={{ fontSize: 13.5, color: '#0A0A0A' }}>–</span>
            <span style={{ fontSize: 13.5, color: '#0A0A0A', textAlign: 'center' }}>1</span>
            <span style={{ fontSize: 13.5, color: '#0A0A0A', textAlign: 'right' }}>₹{data.gst.toFixed(2)}</span>
          </div>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '20px 0 0' }}>
            <div style={{ width: 256, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: '#4A5565' }}>
                <span>Subtotal</span><span>₹{data.subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: '#4A5565' }}>
                <span>GST (18%)</span><span>₹{data.gst.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: '#4A5565' }}>
                <span>Discount</span><span>₹0.00</span>
              </div>
              <div style={{ height: '0.8px', background: '#E5E7EB', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, color: '#0A0A0A', fontWeight: 500 }}>
                <span>Total</span><span>₹{parseFloat(data.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Paid badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 28 }}>
            <div style={{
              background: 'linear-gradient(90deg, #D4F4DD 0%, #C8F3D9 100%)',
              borderRadius: 20, padding: '8px 24px',
              fontSize: 13.5, color: '#0F5132', fontWeight: 500,
            }}>
              ✓ PAID – {data.date} · {data.paymentMethod}
            </div>
          </div>
        </div>

        {/* Print button */}
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={handlePrint}
            style={{
              border: '1px solid rgba(11,22,40,0.17)', background: '#fff',
              borderRadius: 6, padding: '8px 20px',
              fontSize: 15, fontWeight: 600, color: '#6B7A99', cursor: 'pointer',
            }}
          >
            🖨 Print / Download PDF
          </button>
          <p style={{ margin: 0, fontSize: 11, color: '#9AA3B8' }}>together@risewithjeet.com</p>
        </div>
      </div>
    </div>
  );
}

// ── Payment Success Dialog ────────────────────────────────────────────────────
interface SuccessData {
  razorpayPaymentId: string;
  planName: string;
  planLabel: string;
  amountTotal: string;
  nextBilling: string;
  billedToEmail: string;
  paymentMethod: string;
  cycle: BillingCycle;
  subtotal: number;
  gst: number;
}

function PaymentSuccessDialog({
  data,
  onDashboard,
  onReceipt,
  onClose,
}: {
  data: SuccessData;
  onDashboard: () => void;
  onReceipt: () => void;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const txId = `RWJ-${new Date().getFullYear()}-${data.razorpayPaymentId.slice(-5).toUpperCase()}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(txId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        background: '#fff', borderRadius: 22,
        boxShadow: '0 32px 96px rgba(0,0,0,0.25)',
        overflow: 'hidden', width: '100%', maxWidth: 440,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Dark header */}
      <div style={{
        background: '#050b19', padding: '32px 36px 28px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 32,
          background: '#166534',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div style={{ paddingTop: 10, textAlign: 'center' }}>
          <p style={{
            margin: 0, fontSize: 27, fontWeight: 700, color: '#fff',
            fontFamily: '"Cormorant Garamond", Georgia, serif', letterSpacing: '-0.3px',
          }}>Payment Successful! 🎉</p>
        </div>
        <p style={{ margin: 0, fontSize: 12.5, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
          Welcome to the {data.planName} Plan – your journey to the civil services starts now.
        </p>
      </div>

      {/* White body */}
      <div style={{ padding: '28px 36px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Transaction ID */}
        <div style={{
          background: '#faf6ef', borderRadius: 10, padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ margin: '0 0 3px', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.8px', color: '#8a8aaa', textTransform: 'uppercase' }}>Transaction ID</p>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e', fontFamily: '"Inter", monospace' }}>{txId}</p>
          </div>
          <button type="button" onClick={handleCopy} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: copied ? '#16a34a' : '#d4900a', padding: 0 }}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Detail rows */}
        <div style={{ display: 'flex', flexDirection: 'column', paddingTop: 6 }}>
          {[
            { label: 'Plan',            value: `${data.planName} – ${data.planLabel}`,  color: '#1a1a2e' },
            { label: 'Amount Paid',     value: `₹${parseFloat(data.amountTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })} (incl. GST)`, color: '#d4900a' },
            { label: 'Next Billing Date', value: data.nextBilling,                      color: '#1a1a2e' },
            { label: 'Billed To',       value: data.billedToEmail,                      color: '#1a1a2e' },
            { label: 'Payment Method',  value: data.paymentMethod,                      color: '#1a1a2e' },
          ].map((row, i, arr) => (
            <div key={row.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '11px 0',
              borderBottom: i < arr.length - 1 ? '1px solid #f0ece4' : 'none',
            }}>
              <span style={{ fontSize: 13, color: '#8a8aaa' }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: row.color }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Access banner */}
        <div style={{
          background: '#dcfce7', borderRadius: 11, padding: '14px 16px 14px 16px',
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <span style={{ fontSize: 22 }}>🚀</span>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 13.5, fontWeight: 700, color: '#15803d' }}>Your {data.planName} access is now live</p>
            <p style={{ margin: 0, fontSize: 11.5, color: '#15803d', opacity: 0.85 }}>All features unlocked – click below to go to your dashboard</p>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 10, paddingTop: 6 }}>
          <button
            type="button"
            onClick={onDashboard}
            style={{
              flex: 1, padding: '13px 12px', borderRadius: 10, border: 'none',
              background: '#f5a623', color: '#fff', fontSize: 13.5, fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Go To My Dashboard →
          </button>
          <button
            type="button"
            onClick={onReceipt}
            style={{
              padding: '13px 16px', borderRadius: 10,
              border: '1px solid #e8e4da', background: '#fff',
              fontSize: 13.5, fontWeight: 600, color: '#4a4a68', cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Download Receipt
          </button>
        </div>

        {/* Footer */}
        <p style={{ margin: 0, fontSize: 11, color: '#8a8aaa', textAlign: 'center', lineHeight: 1.6 }}>
          A confirmation email &amp; receipt has been sent to{' '}
          <strong style={{ fontWeight: 700 }}>{data.billedToEmail}</strong>.<br />
          Keep your transaction ID safe for any queries.
        </p>
      </div>
    </div>
  );
}

// ── Payment Failure Dialog ────────────────────────────────────────────────────
interface FailureData {
  razorpayPaymentId: string;
  planName: string;
  planLabel: string;
  amountTotal: string;
  errorReason: string;
  billedToEmail: string;
  paymentMethod: string;
}

function PaymentFailureDialog({
  data,
  onRetry,
  onClose,
}: {
  data: FailureData;
  onRetry: () => void;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const txId = `RWJ-${new Date().getFullYear()}-${data.razorpayPaymentId.slice(-5).toUpperCase()}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(txId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        background: '#fff', borderRadius: 22,
        boxShadow: '0 32px 96px rgba(0,0,0,0.25)',
        overflow: 'hidden', width: '100%', maxWidth: 440,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Dark header */}
      <div style={{
        background: '#050b19', padding: '32px 36px 28px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 32,
          background: '#dc2626',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
        <div style={{ paddingTop: 10, textAlign: 'center' }}>
          <p style={{
            margin: 0, fontSize: 27, fontWeight: 700, color: '#fff',
            fontFamily: '"Cormorant Garamond", Georgia, serif', letterSpacing: '-0.3px',
          }}>Payment Failed 😞</p>
        </div>
        <p style={{ margin: 0, fontSize: 12.5, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
          We couldn&apos;t process your payment. No amount has been deducted.
        </p>
      </div>

      {/* White body */}
      <div style={{ padding: '28px 36px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Transaction ID */}
        <div style={{
          borderBottom: '1px solid #f0ece4', paddingBottom: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ margin: '0 0 3px', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.8px', color: '#8a8aaa', textTransform: 'uppercase' }}>Transaction ID</p>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>{txId}</p>
          </div>
          <button type="button" onClick={handleCopy} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: copied ? '#16a34a' : '#dc2626', padding: 0 }}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Detail rows */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {[
            { label: 'Plan',            value: `${data.planName} – ${data.planLabel}`, color: '#1a1a2e' },
            { label: 'Amount',          value: `₹${parseFloat(data.amountTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })} (incl. GST)`, color: '#dc2626' },
            { label: 'Failure Reason',  value: data.errorReason || 'Payment failed', color: '#1a1a2e' },
            { label: 'Billed To',       value: data.billedToEmail, color: '#1a1a2e' },
            { label: 'Payment Method',  value: data.paymentMethod, color: '#1a1a2e' },
          ].map((row, i, arr) => (
            <div key={row.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '11px 0',
              borderBottom: i < arr.length - 1 ? '1px solid #f0ece4' : 'none',
            }}>
              <span style={{ fontSize: 13, color: '#8a8aaa' }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: row.color }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Warning banner */}
        <div style={{
          background: '#fef2f2', borderRadius: 11, padding: '14px 16px',
          display: 'flex', alignItems: 'flex-start', gap: 10,
          border: '1px solid rgba(220,38,38,0.15)',
        }}>
          <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>⊙</span>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 13.5, fontWeight: 700, color: '#b91c1c' }}>Your access has not been activated</p>
            <p style={{ margin: 0, fontSize: 11.5, color: '#b91c1c', opacity: 0.85 }}>Retry with a different payment method to unlock {data.planName} features</p>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
          <button
            type="button"
            onClick={onRetry}
            style={{
              width: '100%', padding: '14px 12px', borderRadius: 50, border: 'none',
              background: '#f5a623', color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Retry Payment →
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%', padding: '14px 12px', borderRadius: 50,
              border: '1.5px solid #d1d5db', background: '#fff',
              fontSize: 14, fontWeight: 600, color: '#1a1a2e', cursor: 'pointer',
            }}
          >
            Try a Different Method
          </button>
        </div>

        <p style={{ margin: 0, fontSize: 11, color: '#8a8aaa', textAlign: 'center', lineHeight: 1.6 }}>
          Need help? Contact us at{' '}
          <strong style={{ fontWeight: 600 }}>together@risewithjeet.com</strong><br />
          Keep your transaction ID safe for any queries.
        </p>
      </div>
    </div>
  );
}

// ── Checkout modal (shared by Rise & Ascent) ─────────────────────────────────
type PlanKey = 'rise' | 'ascent';

type PlanConfig = {
  name: string;
  badge: string;
  description: string;
  features: string[];
  cycles: Record<BillingCycle, {
    label: string;
    total: string;
    perMonth: string;
    save: string;
    duration: string;
    gstStrike: string;
  }>;
};

const PLAN_CONFIGS: Record<PlanKey, PlanConfig> = {
  rise: {
    name: 'Rise',
    badge: 'Rise Plan',
    description: 'The complete ecosystem for focused, daily UPSC preparation.',
    features: [
      '25 Mains AI Evaluations / day',
      '25 Mock Test attempts / day',
      'Full Performance Analytics Dashboard',
      'Full Revision Suite – Flashcards, Mindmaps, Spaced Rep.',
      'Jeet AI – 50 conversations / day',
      'Smart Syllabus Tracker',
      'Live Study Room 24×7',
    ],
    cycles: {
      monthly:   { label: 'Monthly',   total: '499.00',  perMonth: '499', save: '',         duration: '1 month',   gstStrike: '89.82'  },
      quarterly: { label: 'Quarterly', total: '1197.00', perMonth: '399', save: 'Save 20%', duration: '3 months',  gstStrike: '239.46' },
      yearly:    { label: 'Yearly',    total: '3588.00', perMonth: '299', save: 'Save 40%', duration: '12 months', gstStrike: '718.56' },
    },
  },
  ascent: {
    name: 'Ascent',
    badge: 'Ascent Plan',
    description: 'Unlimited tools, personalised mentorship. For aspirants who leave nothing to chance.',
    features: [
      'Unlimited Mains Evaluations & Mock Tests',
      'Jeet AI – Unlimited conversations',
      'Weekly 1-on-1 Mentorship Sessions',
      'Personalised Study Roadmap',
      'Dedicated Q&A – Quick Responses',
      'Monthly Performance Review Call',
      'Early Access to New Features',
    ],
    cycles: {
      monthly:   { label: 'Monthly',   total: '1999.00', perMonth: '1999', save: '',         duration: '1 month',   gstStrike: '304.93'  },
      quarterly: { label: 'Quarterly', total: '4797.00', perMonth: '1599', save: 'Save 20%', duration: '3 months',  gstStrike: '732.59'  },
      yearly:    { label: 'Yearly',    total: '14388.00', perMonth: '1199', save: 'Save 40%', duration: '12 months', gstStrike: '2194.78' },
    },
  },
};

type CheckoutStep = 'checkout' | 'success' | 'failed';

function CheckoutModal({ planKey, onClose }: { planKey: PlanKey; onClose: () => void }) {
  const router = useRouter();
  const { user } = useAuth();
  const plan = PLAN_CONFIGS[planKey];
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [coupon, setCoupon] = useState('');
  const [couponStatus, setCouponStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const VALID_COUPONS: Record<string, { discount: number; label: string }> = {
    'RISE10': { discount: 10, label: '10% off applied!' },
    'JEET20': { discount: 20, label: '20% off applied!' },
    'UPSC15': { discount: 15, label: '15% off applied!' },
    'WELCOME25': { discount: 25, label: '25% off applied!' },
  };

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    if (!code) {
      setCouponStatus('invalid');
      setCouponMessage('Please enter a coupon code.');
      return;
    }
    const found = VALID_COUPONS[code];
    if (found) {
      setCouponStatus('valid');
      setCouponDiscount(found.discount);
      setCouponMessage(found.label);
    } else {
      setCouponStatus('invalid');
      setCouponDiscount(0);
      setCouponMessage('Invalid or expired coupon code.');
    }
  };
  const [step, setStep] = useState<CheckoutStep>('checkout');
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [failureData, setFailureData] = useState<FailureData | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const active = plan.cycles[cycle];

  const startCheckout = async () => {
    setIsPaying(true);
    setPaymentError('');

    try {
      if (!window.Razorpay) {
        throw new Error('Payment checkout is still loading. Please try again in a moment.');
      }

      const orderResponse = await billingService.createRazorpayOrder({ planKey, cycle });
      const order = orderResponse.data;

      if (!order?.order_id || !order?.paymentId || !order?.key) {
        throw new Error('Unable to start payment. Please try again.');
      }

      const checkout = new window.Razorpay({
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: 'RiseWithJeet',
        description: `${plan.name} Plan - ${active.label}`,
        order_id: order.order_id,
        prefill: {
          name: user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : '',
          email: user?.email ?? '',
        },
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            await billingService.verifyRazorpayPayment({
              paymentId: order.paymentId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            const subtotal = subtotalFromTotal(active.total);
            setSuccessData({
              razorpayPaymentId: response.razorpay_payment_id,
              planName: plan.name,
              planLabel: active.label,
              amountTotal: active.total,
              nextBilling: nextBillingDate(cycle),
              billedToEmail: user?.email ?? '',
              paymentMethod: 'Razorpay',
              cycle,
              subtotal,
              gst: gstFromTotal(active.total),
            });
            setStep('success');
          } catch (err: any) {
            setFailureData({
              razorpayPaymentId: response.razorpay_payment_id,
              planName: plan.name, planLabel: active.label,
              amountTotal: active.total,
              errorReason: err?.message || 'Payment verification failed. Please contact support.',
              billedToEmail: user?.email ?? '',
              paymentMethod: 'Razorpay',
            });
            setStep('failed');
          } finally {
            setIsPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsPaying(false);
          },
        },
        theme: { color: '#E8B84B' },
      });

      checkout.on('payment.failed', async (response: any) => {
        const reason = response?.error?.description || 'Payment failed. Please try another payment method.';
        setFailureData({
          razorpayPaymentId: order.paymentId,
          planName: plan.name, planLabel: active.label,
          amountTotal: active.total,
          errorReason: reason,
          billedToEmail: user?.email ?? '',
          paymentMethod: 'Razorpay',
        });
        setStep('failed');
        setIsPaying(false);
        try {
          await billingService.markRazorpayPaymentFailed({
            paymentId: order.paymentId,
            status: 'failed',
            failureReason: reason,
          });
        } catch {
          // UI shows gateway failure even if backend logging is unavailable.
        }
      });

      checkout.open();
    } catch (err: any) {
      setPaymentError(err?.message || 'Unable to start payment. Please try again.');
      setIsPaying(false);
    }
  };

  // ── Success step ──
  if (step === 'success' && successData) {
    return (
      <>
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(8,15,35,0.65)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16, overflowY: 'auto',
          }}
        >
          <PaymentSuccessDialog
            data={successData}
            onDashboard={() => { onClose(); router.push('/dashboard'); }}
            onReceipt={() => setShowInvoice(true)}
            onClose={onClose}
          />
        </div>
        {showInvoice && (
          <InvoiceModal
            data={{
              invoiceNo: invoiceNumber(successData.razorpayPaymentId),
              date: formatDate(new Date()),
              planName: successData.planName,
              planLabel: successData.planLabel,
              total: successData.amountTotal,
              subtotal: successData.subtotal,
              gst: successData.gst,
              billedToName: user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : '',
              billedToEmail: successData.billedToEmail,
              periodStart: formatDate(new Date()),
              periodEnd: successData.nextBilling,
              razorpayPaymentId: successData.razorpayPaymentId,
              paymentMethod: successData.paymentMethod,
            }}
            onClose={() => setShowInvoice(false)}
          />
        )}
      </>
    );
  }

  // ── Failure step ──
  if (step === 'failed' && failureData) {
    return (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(8,15,35,0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16, overflowY: 'auto',
        }}
      >
        <PaymentFailureDialog
          data={failureData}
          onRetry={() => { setStep('checkout'); setFailureData(null); }}
          onClose={onClose}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(8, 15, 35, 0.55)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 780, background: '#FFFFFF',
          borderRadius: 18, overflow: 'hidden', position: 'relative',
          boxShadow: '0 24px 60px rgba(8,15,35,0.35)',
          display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
        className="rise-checkout-grid"
      >
        {/* ── LEFT: plan + cycle + features ── */}
        <div style={{ padding: '22px 24px 22px' }}>
          <span style={{
            display: 'inline-block', padding: '4px 10px', borderRadius: 6,
            border: '1px solid #E8B84B', background: '#FEF5DC',
            fontSize: 10, fontWeight: 700, letterSpacing: '1.2px',
            color: '#B07F00', textTransform: 'uppercase',
          }}>
            {plan.badge}
          </span>
          <h2 style={{
            margin: '12px 0 6px',
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: 32, fontWeight: 700, lineHeight: 1, color: '#0F172B',
          }}>
            {plan.name}
          </h2>
          <p style={{ margin: '0 0 16px', fontSize: 12.5, lineHeight: 1.45, color: '#6B7A99' }}>
            {plan.description}
          </p>

          {/* Cycle tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {(['monthly','quarterly','yearly'] as BillingCycle[]).map((c) => {
              const cfg = plan.cycles[c];
              const selected = cycle === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCycle(c)}
                  style={{
                    textAlign: 'left',
                    border: selected ? '2px solid #E8B84B' : '1px solid #E2E8F0',
                    background: selected ? '#FEF5DC' : '#FFFFFF',
                    borderRadius: 10, padding: '8px 10px',
                    cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 600, color: selected ? '#B07F00' : '#475569', marginBottom: 3 }}>
                    {cfg.label}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                    <span style={{
                      fontFamily: '"Cormorant Garamond", Georgia, serif',
                      fontSize: 18, fontWeight: 700,
                      color: selected ? '#E8B84B' : '#0F172B',
                    }}>
                      ₹{cfg.perMonth}
                    </span>
                    {c !== 'monthly' && (
                      <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500 }}>/mo</span>
                    )}
                  </div>
                  {cfg.save && (
                    <div style={{ marginTop: 2, fontSize: 10, fontWeight: 600, color: '#16A34A' }}>
                      {cfg.save}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ height: 1, background: '#E5E7EB', margin: '16px 0 12px' }} />

          {/* What's Included */}
          <p style={{
            margin: '0 0 8px', fontSize: 10, fontWeight: 700,
            letterSpacing: '1.3px', textTransform: 'uppercase', color: '#94A3B8',
          }}>
            What&apos;s Included
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {plan.features.map((f) => (
              <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: '#334155' }}>
                <span style={{ color: '#16A34A', fontWeight: 700, flexShrink: 0 }}>✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>

          {/* Razorpay note */}
          <div style={{
            marginTop: 14, padding: '8px 10px', borderRadius: 8,
            background: '#F4F7FB', border: '1px solid #E4E9F2',
            display: 'flex', alignItems: 'flex-start', gap: 6,
            fontSize: 10.5, lineHeight: 1.4, color: '#64748B',
          }}>
            <span style={{ flexShrink: 0 }}>🔒</span>
            <span>Secured by Razorpay. Your payment info is encrypted end-to-end and never stored on our servers.</span>
          </div>
        </div>

        {/* ── RIGHT: order summary + coupon + CTA ── */}
        <div style={{ padding: '22px 24px 22px', background: '#FFFFFF', position: 'relative' }}>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{
              position: 'absolute', top: 14, right: 14,
              width: 28, height: 28, borderRadius: '50%',
              border: '1px solid #E2E8F0', background: '#FFFFFF',
              color: '#64748B', fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            ×
          </button>

          <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 700, color: '#0F172B' }}>
            Order Summary
          </h3>

          {/* Plan / duration */}
          <div style={{
            background: '#F4F7FB', borderRadius: 10, padding: '10px 12px', marginBottom: 10,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <span style={{ fontSize: 12, color: '#64748B' }}>Plan</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172B' }}>{plan.name} – {active.label}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#64748B' }}>Duration</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172B' }}>{active.duration}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#16A34A', fontSize: 11, fontWeight: 600 }}>
              <span aria-hidden="true">🛡️</span>
              <span>3-Day Money-Back Guarantee</span>
            </div>
          </div>

          {/* Pricing breakdown */}
          <div style={{
            background: '#FEF5DC', borderRadius: 10, padding: '10px 12px', marginBottom: 14,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#475569' }}>{plan.name} Plan – {active.label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#0F172B' }}>₹{active.perMonth}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#475569' }}>GST (18% Included)</span>
              <span style={{ fontSize: 12, color: '#94A3B8', textDecoration: 'line-through' }}>₹{active.gstStrike}</span>
            </div>
            <div style={{ height: 1, background: 'rgba(176,127,0,0.18)', marginBottom: 8 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172B' }}>Total Payable</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172B' }}>
                {couponDiscount > 0
                  ? `₹${Math.round(Number(active.total) * (1 - couponDiscount / 100))}`
                  : `₹${active.total}`}
              </span>
            </div>
            {couponDiscount > 0 && (
              <div style={{ marginTop: 4, fontSize: 11, color: '#16A34A', fontWeight: 600 }}>
                You save ₹{Math.round(Number(active.total) * couponDiscount / 100)} with coupon
              </div>
            )}
          </div>

          {/* Coupon */}
          <label style={{ display: 'block', marginBottom: 5, fontSize: 12, fontWeight: 600, color: '#0F172B' }}>
            Coupon Code / Referral Code
          </label>
          <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
            <input
              type="text"
              value={coupon}
              onChange={(e) => { setCoupon(e.target.value.toUpperCase()); setCouponStatus('idle'); setCouponMessage(''); setCouponDiscount(0); }}
              onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
              placeholder="ENTER CODE"
              style={{
                flex: 1, height: 36, borderRadius: 8,
                border: `1px solid ${couponStatus === 'valid' ? '#16A34A' : couponStatus === 'invalid' ? '#DC2626' : '#E2E8F0'}`,
                padding: '0 10px', fontSize: 12, color: '#0F172B',
                outline: 'none', letterSpacing: '0.4px',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            />
            <button
              type="button"
              onClick={applyCoupon}
              style={{
                minWidth: 72, height: 36, borderRadius: 8, border: '1px solid #E2E8F0',
                background: '#FFFFFF', color: '#0F172B',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Apply
            </button>
          </div>
          {couponMessage && (
            <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, color: couponStatus === 'valid' ? '#16A34A' : '#DC2626' }}>
              {couponStatus === 'valid' ? '✓' : '✕'} {couponMessage}
            </p>
          )}
          {!couponMessage && <div style={{ marginBottom: 12 }} />}

          {/* CTA */}
          <button
            type="button"
            onClick={startCheckout}
            disabled={isPaying}
            style={{
              width: '100%', height: 42, borderRadius: 10, border: 'none',
              background: isPaying ? '#D7DCE5' : '#E8B84B', color: '#FFFFFF',
              fontSize: 13, fontWeight: 700, cursor: isPaying ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/crd.png" alt="" width={22} height={22} style={{ width: 22, height: 'auto', objectFit: 'contain' }} />
            <span>{isPaying ? 'Opening Razorpay...' : 'Continue to Payment →'}</span>
          </button>

          {paymentError && (
            <p style={{ margin: '10px 0 0', fontSize: 11.5, lineHeight: 1.5, color: '#DC2626' }}>{paymentError}</p>
          )}

          {/* Footer */}
          <div style={{
            marginTop: 10, display: 'flex', flexWrap: 'wrap',
            alignItems: 'center', justifyContent: 'center',
            gap: 4, fontSize: 10.5, color: '#64748B',
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <span aria-hidden="true" style={{ color: '#94A3B8' }}>⬢</span>
              256-bit SSL Secure
            </span>
            <span>·</span>
            <span>Powered by Razorpay</span>
            <span>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <span aria-hidden="true" style={{ color: '#94A3B8' }}>⬢</span>
              PCI DSS Compliant
            </span>
          </div>
        </div>

        <style jsx>{`
          @media (max-width: 720px) {
            .rise-checkout-grid {
              grid-template-columns: 1fr !important;
              max-height: 92vh;
              overflow-y: auto;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

// ── Plans page ────────────────────────────────────────────────────────────────
export default function ExplorePlansPage() {
  const router = useRouter();
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<PlanKey | null>(null);

  const handleUpgrade = () => router.push('/dashboard');
  const handleOpenRiseCheckout = () => setCheckoutPlan('rise');
  const handleOpenAscentCheckout = () => setCheckoutPlan('ascent');

  useEffect(() => {
    if (!checkoutPlan) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCheckoutPlan(null);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onEsc);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onEsc);
    };
  }, [checkoutPlan]);

  return (
    <div className="min-h-screen" style={{ background: '#E9EAEE', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: 16, alignItems: 'stretch' }}>

          {/* Aspire */}
          <article style={{ borderRadius: 20, border: '1px solid #E5E7EB', background: '#FFFFFF', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '28px 24px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, letterSpacing: '1.6px', textTransform: 'uppercase', color: '#E8B84B', fontFamily: 'Inter, system-ui, sans-serif' }}>Forever Free</p>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-cormorant-garamond), "Cormorant Garamond", Georgia, serif', fontSize: 28, fontStyle: 'normal', fontWeight: 700, lineHeight: 'normal', color: '#1A1A2E' }}>Aspire</h3>
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
                  { text: 'Daily News Analysis – The Hindu & IE', limited: false },
                  { text: '10,000+ Previous Year Questions', limited: false },
                  { text: 'Jeet AI – 5 conversations / day', limited: false },
                  { text: 'Study Planner & Time Tracker', limited: false },
                  { text: 'Daily Leaderboard', limited: false },
                  { text: 'Discussion Forum', limited: false },
                  { text: 'Mental Health Buddy', limited: false },
                  { text: 'Mock Tests – Limited access', limited: true },
                  { text: 'Revision Suite – Limited access', limited: true },
                  { text: 'Performance Analytics – Limited view', limited: true },
                ].map((item) => (
                  <li key={item.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#374151', fontFamily: 'Inter, system-ui, sans-serif' }}>
                    <span style={{ flexShrink: 0, marginTop: 1, color: item.limited ? '#E8B84B' : '#22C55E', fontWeight: 700 }}>{item.limited ? '→' : '✓'}</span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={handleUpgrade} style={{ marginTop: 'auto', width: '100%', borderRadius: 10, padding: '13px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', border: '1.5px solid #D1D5DB', background: 'transparent', color: '#0C1424', fontFamily: '"DM Sans", Inter, system-ui, sans-serif' }}>
                Get Started Free →
              </button>
              <p style={{ margin: '10px 0 0', fontSize: 11, color: '#9AA3B8', textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>No card needed • Upgrade anytime</p>
            </div>
          </article>

          {/* Rise (Most Popular) */}
          <article style={{ borderRadius: 20, border: '2px solid #E8B84B', background: '#0B1525', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', background: '#E8B84B', color: '#090E1C', padding: '5px 20px', borderRadius: '0 0 12px 12px', fontSize: 10, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'Inter, system-ui, sans-serif', whiteSpace: 'nowrap' }}>
              Most Popular
            </div>
            <div style={{ padding: '44px 24px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, letterSpacing: '1.6px', textTransform: 'uppercase', color: '#E8B84B', fontFamily: 'Inter, system-ui, sans-serif' }}>Dedicated Study</p>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-cormorant-garamond), "Cormorant Garamond", Georgia, serif', fontSize: 28, fontStyle: 'normal', fontWeight: 700, lineHeight: 'normal', color: '#fff' }}>Rise</h3>
              <p style={{ margin: '8px 0 20px', fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                For serious aspirants who study daily and want measurable progress.
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                <span style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 28, fontStyle: 'normal', fontWeight: 700, lineHeight: 'normal', color: '#E8B84B' }}>
                  ₹{cycle === 'monthly' ? '499' : cycle === 'quarterly' ? '399' : '299'}
                </span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', paddingBottom: 6, fontFamily: 'Inter, system-ui, sans-serif' }}>/month</span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                {cycle === 'monthly' ? 'Billed monthly' : cycle === 'quarterly' ? '₹1,197 every 3 months - Save 20%' : '₹3,588 yearly - Save 40%'}
              </p>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '20px 0' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ color: '#E8B84B', fontWeight: 700 }}>✓</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontFamily: 'Inter, system-ui, sans-serif' }}>Everything in Aspire, plus:</span>
              </div>
              {[
                { title: 'EVALUATION', items: ['25 Mains Evaluations / day', '25 Mock Test attempts / day', 'Jeet AI – 50 conversations / day'] },
                { title: 'ANALYTICS', items: ['Full Performance Analytics Dashboard', 'Comprehensive Test Analytics'] },
                { title: 'REVISION & AI TOOLS', items: ['Full Revision Suite – Flashcards, Mindmap, Spaced Repetition, Smart Notes', 'Smart Syllabus Tracker', 'Live Study Room'] },
              ].map((section) => (
                <div key={section.title} style={{ marginBottom: 12 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 800, letterSpacing: '1.6px', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', fontFamily: 'Inter, system-ui, sans-serif' }}>{section.title}</p>
                  {section.items.map((item) => (
                    <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 7, fontSize: 13, color: 'rgba(255,255,255,0.75)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                      <span style={{ color: '#E8B84B', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              ))}
              <button type="button" onClick={handleOpenRiseCheckout} style={{ marginTop: 'auto', width: '100%', borderRadius: 10, padding: '13px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', background: '#E8B84B', color: '#090E1C', fontFamily: '"DM Sans", Inter, system-ui, sans-serif' }}>
                Unlock Rise Now →
              </button>
              <p style={{ margin: '10px 0 0', fontSize: 11, color: '#22C55E', textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
                3-day money-back guarantee, no questions asked
              </p>
            </div>
          </article>

          {/* Ascent */}
          <article style={{ borderRadius: 20, border: '1px solid #E5E7EB', background: '#FFFFFF', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '28px 24px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, letterSpacing: '1.6px', textTransform: 'uppercase', color: '#E8B84B', fontFamily: 'Inter, system-ui, sans-serif' }}>Maximum Edge</p>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-cormorant-garamond), "Cormorant Garamond", Georgia, serif', fontSize: 28, fontStyle: 'normal', fontWeight: 700, lineHeight: 'normal', color: '#1A1A2E' }}>Ascent</h3>
              <p style={{ margin: '8px 0 20px', fontSize: 13, lineHeight: 1.6, color: '#6B7A99', fontFamily: 'Inter, system-ui, sans-serif' }}>
                Unlimited tools, zero limits. For aspirants who leave nothing to chance.
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                <span style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 28, fontStyle: 'normal', fontWeight: 700, lineHeight: 'normal', color: '#E8B84B' }}>
                  ₹{cycle === 'monthly' ? '1,999' : cycle === 'quarterly' ? '1,599' : '1,199'}
                </span>
                <span style={{ fontSize: 13, color: '#9AA3B8', paddingBottom: 6, fontFamily: 'Inter, system-ui, sans-serif' }}>/month</span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9AA3B8', fontFamily: 'Inter, system-ui, sans-serif' }}>
                {cycle === 'monthly' ? 'Billed monthly' : cycle === 'quarterly' ? '₹4,797 every 3 months – Save 20%' : '₹14,388 yearly – Save 40%'}
              </p>
              <div style={{ height: 1, background: '#F0EDE8', margin: '20px 0' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ color: '#22C55E', fontWeight: 700 }}>✓</span>
                <span style={{ fontSize: 13, color: '#0C1424', fontWeight: 600, fontFamily: 'Inter, system-ui, sans-serif' }}>Everything in Rise, plus:</span>
              </div>
              {[
                { title: 'EVALUATION', items: ['Unlimited Mains Evaluations', 'Unlimited Mock Test practice', 'Jeet AI – Unlimited conversations'] },
                { title: 'MENTOR-LED GROWTH', items: ['Weekly 1-on-1 mentorship sessions', 'Personalised Study Roadmap', 'Dedicated Q&A with Quick Responses', 'Monthly Performance Review Call', 'Early Access to New Features'] },
              ].map((section) => (
                <div key={section.title} style={{ marginBottom: 12 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 800, letterSpacing: '1.6px', color: '#9AA3B8', textTransform: 'uppercase', fontFamily: 'Inter, system-ui, sans-serif' }}>{section.title}</p>
                  {section.items.map((item) => (
                    <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 7, fontSize: 13, color: '#374151', fontFamily: 'Inter, system-ui, sans-serif' }}>
                      <span style={{ color: '#22C55E', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              ))}
              <button type="button" onClick={handleOpenAscentCheckout} style={{ marginTop: 'auto', width: '100%', borderRadius: 10, padding: '13px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', background: '#090E1C', color: '#fff', fontFamily: '"DM Sans", Inter, system-ui, sans-serif' }}>
                Get Ascent Plan→
              </button>
              <p style={{ margin: '10px 0 0', fontSize: 11, color: '#22C55E', textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
                3-day money-back guarantee included
              </p>
            </div>
          </article>

        </div>

        {/* Trust bar */}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 12, paddingBottom: 8 }}>
          {[
            { icon: '🔒', text: 'Secure Payments' },
            { icon: '↩', text: '3-Day Money-Back Guarantee' },
            { icon: '✕', text: 'Cancel Anytime' },
            { icon: '👥', text: '15,000+ UPSC aspirants' },
          ].map((item) => (
            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 7, borderRadius: 999, border: '1px solid #E5E7EB', background: '#fff', padding: '8px 16px', fontSize: 12, fontWeight: 500, color: '#374151', fontFamily: 'Inter, system-ui, sans-serif', boxShadow: '0 1px 4px rgba(11,22,40,0.06)' }}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>

        {/* ── Feature Breakdown ── */}
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
          <style>{`
            .cmp-table-wrap { border-radius: 16px; overflow-x: auto; overflow-y: hidden; -webkit-overflow-scrolling: touch; border: 1px solid #E5E7EB; }
            .cmp-table { width: 100%; min-width: 560px; border-collapse: collapse; font-family: Inter, system-ui, sans-serif; }
            .cmp-h { font-family: var(--font-cormorant-garamond), "Cormorant Garamond", Georgia, serif; font-size: 44px; font-weight: 400; line-height: 51.92px; }
            @media (max-width: 640px) {
              .cmp-table { min-width: 480px; }
              .cmp-h { font-size: 26px; line-height: 1.2; }
              .cmp-th { padding: 14px 10px !important; }
              .cmp-td-feature { padding: 11px 12px !important; }
              .cmp-td { padding: 11px 8px !important; }
            }
          `}</style>
          <div className="cmp-table-wrap">
            <table className="cmp-table">
              {/* Header row */}
              <thead>
                <tr style={{ background: '#0B1525' }}>
                  <th className="cmp-th cmp-h" style={{ padding: '18px 20px', textAlign: 'left', width: '40%', color: '#fff' }}>
                    Features
                  </th>
                  <th className="cmp-th cmp-h" style={{ padding: '18px 16px', textAlign: 'center', color: '#fff' }}>
                    Aspire
                  </th>
                  <th className="cmp-th" style={{ padding: '18px 16px', textAlign: 'center', background: 'rgba(232,184,75,0.12)' }}>
                    <span className="cmp-h" style={{ color: '#E8B84B' }}>Rise</span>
                    <span style={{ marginLeft: 6, fontSize: 20 }}>⭐</span>
                  </th>
                  <th className="cmp-th cmp-h" style={{ padding: '18px 16px', textAlign: 'center', color: '#fff' }}>
                    Ascent
                  </th>
                </tr>
              </thead>
              <tbody>
                {([
                  { feature: 'Daily MCQ Challenge', sub: 'Subject & topic-wise with explanations', aspire: '10 / day', rise: 'Unlimited', ascent: 'Unlimited' },
                  { feature: 'Daily Mains Challenge', sub: '', aspire: '✓', rise: '✓', ascent: '✓' },
                  { feature: 'Daily News Analysis', sub: 'The Hindu & Indian Express', aspire: '✓', rise: '✓', ascent: '✓' },
                  { feature: 'Daily Leaderboard', sub: '', aspire: '✓', rise: '✓', ascent: '✓' },
                  { feature: 'Discussion Forum', sub: '', aspire: '✓', rise: '✓', ascent: '✓' },
                  { feature: 'Mental Health Buddy', sub: '', aspire: '✓', rise: '✓', ascent: '✓' },
                  { feature: '10,000+ Previous Year Questions', sub: '', aspire: '✓', rise: '✓', ascent: '✓' },
                  { feature: 'Study Planner & Time Tracker', sub: '', aspire: '✓', rise: '✓', ascent: '✓' },
                  { feature: 'Mains Evaluations', sub: 'Instant UPSC marking scheme feedback', aspire: '–', rise: '25 / day', ascent: 'Unlimited' },
                  { feature: 'Mock Test Attempts', sub: 'Full-length Prelims & Mains simulations', aspire: 'Limited', rise: '25 / day', ascent: 'Unlimited' },
                  { feature: 'Jeet AI Conversations', sub: 'UPSC-preparation partner', aspire: '5 / day', rise: '50 / day', ascent: 'Unlimited' },
                  { feature: 'Performance Analytics Dashboard', sub: '', aspire: 'Limited', rise: '✓', ascent: '✓' },
                  { feature: 'Test Analytics', sub: 'Deep score breakdowns', aspire: '–', rise: '✓', ascent: '✓' },
                  { feature: 'Revision Suite', sub: 'Flashcards, Mindmaps, Spaced Repetition', aspire: 'Limited', rise: 'Full Access', ascent: 'Full Access' },
                  { feature: 'Smart Syllabus Tracker', sub: 'Personalized UPSC Syllabus Mapping', aspire: '–', rise: '✓', ascent: '✓' },
                  { feature: 'Live Study Room', sub: '', aspire: '–', rise: '✓', ascent: '✓' },
                  { feature: 'Weekly 1-on-1 Mentorship', sub: 'Personalised sessions with Jeet', aspire: '–', rise: '–', ascent: 'Weekly' },
                  { feature: 'Personalised Study Roadmap', sub: '', aspire: '–', rise: '–', ascent: '✓' },
                  { feature: 'Dedicated Q&A – Quick Responses', sub: '', aspire: '–', rise: '–', ascent: '✓' },
                  { feature: 'Monthly Performance Review Call', sub: '', aspire: '–', rise: '–', ascent: '✓' },
                  { feature: 'Early Access to New Features', sub: '', aspire: '–', rise: '–', ascent: '✓' },
                ] as { feature: string; sub: string; aspire: string; rise: string; ascent: string }[]).map((row, i) => {
                  const cellStyle = (val: string, isRise = false): React.CSSProperties => ({
                    padding: '13px 16px',
                    whiteSpace: 'nowrap' as const,
                    textAlign: 'center' as const,
                    fontSize: 13,
                    fontWeight: val === '✓' || val === '–' ? 600 : 500,
                    color: val === '✓' ? '#22C55E'
                      : val === '–' ? '#CBD5E1'
                      : val === 'Limited' || val === 'Unlimited' || val === 'Full Access' || val === 'Weekly' ? '#E8B84B'
                      : '#1A2540',
                    background: isRise ? 'rgba(232,184,75,0.04)' : 'transparent',
                    borderBottom: '1px solid #F3F4F6',
                  });

                  return (
                    <tr key={row.feature} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                      <td className="cmp-td-feature" style={{ padding: '13px 20px', borderBottom: '1px solid #F3F4F6' }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#1A2540', display: 'block' }}>{row.feature}</span>
                        {row.sub && <span style={{ fontSize: 11, color: '#9AA3B8', display: 'block', marginTop: 2 }}>{row.sub}</span>}
                      </td>
                      <td className="cmp-td" style={cellStyle(row.aspire)}>{row.aspire}</td>
                      <td className="cmp-td" style={cellStyle(row.rise, true)}>{row.rise}</td>
                      <td className="cmp-td" style={cellStyle(row.ascent)}>{row.ascent}</td>
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

        {/* ── Why Rise With Jeet? ── */}
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
              Not just another coaching – the complete UPSC operating system for India&apos;s brightest minds.
            </p>
          </div>

          {/* 4×2 feature grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 16 }}>
            {[
              { icon: '🎯', iconBg: '#FEF3C7', title: 'Daily MCQ Practice', desc: 'Subject-wise & topic-wise MCQs with detailed explanations. New questions every day, curated by experts.' },
              { icon: '📊', iconBg: '#EFF6FF', title: 'Deep Analytics', desc: 'Topic-level breakdowns, readiness scores, and weak-area detection.' },
              { icon: '📅', iconBg: '#FFFBEB', title: 'Smart Planning', desc: 'Syllabus tracker, planner and spaced repetition so nothing slips through.' },
              { icon: '👥', iconBg: '#F0FDF4', title: 'Live Community', desc: 'Study alongside 15,000 aspirants in live rooms and accountability groups.' },
              { icon: '📰', iconBg: '#F8FAFC', title: 'Daily Current Affairs', desc: 'Hindu & IE analysis connecting today\'s news directly to the UPSC syllabus.' },
              { icon: '✍️', iconBg: '#FFFBEB', title: 'Daily Answer Writing', desc: 'Daily mains practice with AI-powered instant evaluation and UPSC-style marking schemes.' },
              { icon: '🧠', iconBg: '#FFF0F3', title: 'Smart Revision', desc: 'Flashcards, mindmaps, spaced repetition – study once, remember forever.' },
              { icon: '📚', iconBg: '#F8FAFC', title: 'Previous Year Questions', desc: '30 years of PYQs with trend analysis, topic clustering, and examiner insights.' },
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

        {/* ── What Our Learners Are Saying ── */}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: 16 }}>
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
                quote: '"Daily MCQs and the leaderboard kept me disciplined across 6 months. Analytics showed me exactly which paper needed attention – saved me months of scattered prep."',
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
                <div style={{ color: '#E8B84B', fontSize: 14, letterSpacing: 2 }}>{'★'.repeat(t.stars)}</div>
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

        {/* ── FAQ ── */}
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
              { q: 'Is there a money-back guarantee?', a: 'Yes. All paid plans come with a 3-day money-back guarantee, no questions asked. Just reach out to our support team within 3 days of purchase.' },
              { q: 'How much do I save on quarterly & yearly plans?', a: 'Quarterly plans save you ~10% compared to monthly billing. Yearly plans give you up to 40% off – the best value for committed aspirants.' },
              { q: 'Can I upgrade or cancel anytime?', a: 'Absolutely. You can upgrade, downgrade, or cancel your subscription at any time from your billing page. No lock-ins, no penalties.' },
              { q: 'How does AI Mains Evaluation work?', a: 'Our AI evaluates your mains answers using UPSC-style marking schemes – checking structure, content, presentation, and relevance – and gives you detailed feedback within seconds.' },
              { q: 'What is the refund policy?', a: 'We offer a 3-day full refund on all paid plans. After 3 days, refunds are handled case-by-case. Contact our billing team for assistance.' },
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
                      {isOpen ? '−' : '+'}
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

      {/* ── CTA Banner – full width outside the constrained container ── */}
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
            <em style={{ color: '#E8B84B', fontStyle: 'italic' }}>UPSC Journey</em>
            <br />the Right Way
          </h2>
          <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.5)', maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.65 }}>
            Join 15,000+ aspirants. Start free with Aspire – no card, no commitment, no expiry. Upgrade only when you feel it.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
            <button type="button" onClick={handleUpgrade} style={{ borderRadius: 10, border: 'none', padding: '14px 28px', fontFamily: '"DM Sans", Inter, system-ui, sans-serif', fontSize: 15, fontWeight: 700, color: '#090E1C', background: '#E8B84B', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Start Free with Aspire →
            </button>
            <button type="button" onClick={() => router.push('/help-support')} style={{ borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.2)', padding: '14px 28px', fontFamily: '"DM Sans", Inter, system-ui, sans-serif', fontSize: 15, fontWeight: 600, color: '#fff', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Contact Us
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, borderRadius: 999, background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)', padding: '7px 16px' }}>
              <span style={{ fontSize: 14 }}>💬</span>
              <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12, fontWeight: 600, color: '#25D366' }}>Text on WhatsApp</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 14 }}>📧</span>
              <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>together@risewithjeet.com</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 14 }}>📞</span>
              <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>+91 83570 56891</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, borderRadius: 999, background: 'rgba(0,136,204,0.15)', border: '1px solid rgba(0,136,204,0.3)', padding: '7px 16px' }}>
              <span style={{ fontSize: 14 }}>✈️</span>
              <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12, fontWeight: 600, color: '#29B6F6' }}>Text on Telegram</span>
            </div>
          </div>
        </div>
      </section>

      {checkoutPlan && <CheckoutModal planKey={checkoutPlan} onClose={() => setCheckoutPlan(null)} />}
    </div>
  );
}

