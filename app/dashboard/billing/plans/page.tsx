'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { billingService, dashboardService } from '@/lib/services';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { PlanTier, useEntitlements } from '@/contexts/EntitlementsContext';
import MyPlanBillingTab from '@/components/billing/MyPlanBillingTab';
import CancelSubscriptionModal from '@/components/billing/CancelSubscriptionModal';
import EditBillingAddressModal from '@/components/billing/EditBillingAddressModal';

// ── Hero.  ──────────────────────────────────────────────────────────────────────
function BillingHero() {
  return (
    <div
      className="relative overflow-hidden flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(180deg, #090E1C 0%, #090E1C 85%, #10192F 100%)',
        minHeight: 260,
        padding: '40px 24px 44px',
      }}
    >

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
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature: string;
};

const RAZORPAY_BRAND = {
  name: 'RiseWithJeet',
  primaryColor: '#0B1525',
  backdropColor: 'rgba(8, 15, 35, 0.74)',
  logoPath: '/icon-192x192.png',
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

// ── Checkout modal (shared by paid plans) ────────────────────────────────────
type PlanKey = 'aspire' | 'rise' | 'ascent';

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
  aspire: {
    name: 'Aspire',
    badge: 'Aspire Plan',
    description: 'Build strong UPSC fundamentals with daily practice, proper guidance, and consistent preparation.',
    features: [
      'Daily MCQ Challenge',
      'Daily Answer Writing Challenge',
      'Daily News Analysis – The Hindu & IE',
      '10,000+ Previous Year Questions',
      '5 Mains Answer Evaluation / day',
      'Simplified Video Lectures',
      'Jeet AI Mentor – 10 Queries / day',
      'Study Planner & Time Tracker',
      'Smart Syllabus Tracker',
      'Daily Leaderboard',
      'Live Study Room',
      'Discussion Forum',
      'Mental Health Buddy',
      'Mock Tests – Limited access',
      'Revision Suite – Limited access',
      'Test Analytics – Limited view',
      'Performance Analytics – Limited view',
    ],
    cycles: {
      monthly:   { label: 'Monthly',   total: '199.00',  perMonth: '199', save: '',         duration: '1 month',   gstStrike: '45.61'  },
      quarterly: { label: 'Quarterly', total: '479.00',  perMonth: '159', save: 'Save 20%', duration: '3 months',  gstStrike: '73.07'  },
      yearly:    { label: 'Yearly',    total: '1439.00', perMonth: '119', save: 'Save 40%', duration: '12 months', gstStrike: '219.51' },
    },
  },
  rise: {
    name: 'Rise',
    badge: 'Rise Plan',
    description: 'The complete ecosystem for focused, daily UPSC preparation.',
    features: [
      '25 Mains Answer Evaluation / day',
      '50 Prelims Mock Test attempts / day',
      'Jeet AI Mentor – 100 Queries / day',
      'Full Performance Analytics Dashboard',
      'Comprehensive Test Analytics',
      'Flashcards',
      'Mindmaps',
      'Spaced Repetition',
      'Smart Notes',
    ],
    cycles: {
      monthly:   { label: 'Monthly',   total: '499.00',  perMonth: '499', save: '',         duration: '1 month',   gstStrike: '89.82'  },
      quarterly: { label: 'Quarterly', total: '1197.00', perMonth: '399', save: 'Save 20%', duration: '3 months',  gstStrike: '239.46' },
      yearly:    { label: 'Yearly',    total: '3599.00', perMonth: '299', save: 'Save 40%', duration: '12 months', gstStrike: '718.56' },
    },
  },
  ascent: {
    name: 'Ascent',
    badge: 'Ascent Plan',
    description: 'Unlimited tools, personalised mentorship. For aspirants who leave nothing to chance.',
    features: [
      'Unlimited Mains Answer Evaluations',
      'Unlimited Prelims Mock Test practice',
      'Jeet AI – Unlimited Queries',
      'Bi-Weekly 1-on-1 Mentorship Sessions',
      'Interview (Personality Test) prep module',
      'Personalised Study Roadmap',
      'Dedicated Support with Quick Responses',
      'Monthly Performance Review Call',
      'Early Access to New Features',
    ],
    cycles: {
      monthly:   { label: 'Monthly',   total: '1999.00', perMonth: '1999', save: '',         duration: '1 month',   gstStrike: '304.93'  },
      quarterly: { label: 'Quarterly', total: '4799.00', perMonth: '1599', save: 'Save 20%', duration: '3 months',  gstStrike: '732.59'  },
      yearly:    { label: 'Yearly',    total: '14399.00', perMonth: '1199', save: 'Save 40%', duration: '12 months', gstStrike: '2194.78' },
    },
  },
};
type CheckoutStep = 'checkout' | 'pending' | 'success' | 'failed';

function CheckoutModal({ planKey, onClose }: { planKey: PlanKey; onClose: () => void }) {
  const router = useRouter();
  const { user } = useAuth();
  const entitlements = useEntitlements();
  const plan = PLAN_CONFIGS[planKey];
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [coupon, setCoupon] = useState('');
  const [couponStatus, setCouponStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    if (!code) {
      setCouponStatus('invalid');
      setCouponMessage('Please enter a coupon code.');
      return;
    }
    if (entitlements.tier !== 'aspire') {
      setCouponStatus('invalid');
      setCouponDiscount(0);
      setCouponMessage('Coupons are available only for first paid purchases.');
      return;
    }
    setCouponStatus('valid');
    setCouponDiscount(0);
    setCouponMessage('Coupon will be validated by Razorpay at checkout.');
  };
  const [step, setStep] = useState<CheckoutStep>('checkout');
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [failureData, setFailureData] = useState<FailureData | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  const active = plan.cycles[cycle];

  const pollForActivation = async (localSubscriptionId: string) => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < 60000) {
      await new Promise((resolve) => setTimeout(resolve, 4000));
      await entitlements.refreshEntitlements();
      const billing = await billingService.getBillingSubscription().catch(() => null);
      const status = billing?.data?.status;
      if (billing?.data?.id === localSubscriptionId && status === 'active') return true;
    }
    return false;
  };

  const startCheckout = async () => {
    setIsPaying(true);
    setPaymentError('');

    try {
      if (!window.Razorpay) {
        throw new Error('Payment checkout is still loading. Please try again in a moment.');
      }

      const subscriptionResponse = await billingService.createRazorpaySubscription({
        planKey,
        cycle,
        couponCode: couponStatus === 'valid' ? coupon.trim().toUpperCase() : undefined,
      });
      const order = subscriptionResponse.data;

      if (!order?.razorpaySubscriptionId || !order?.subscriptionId || !order?.key) {
        throw new Error('Unable to start subscription checkout. Please try again.');
      }

      const checkout = new window.Razorpay({
        key: order.key,
        subscription_id: order.razorpaySubscriptionId,
        name: RAZORPAY_BRAND.name,
        image: `${window.location.origin}${RAZORPAY_BRAND.logoPath}`,
        description: `${plan.name} Plan - ${active.label}`,
        prefill: {
          name: user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : '',
          email: user?.email ?? '',
        },
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            if (!response.razorpay_subscription_id) {
              throw new Error('Razorpay did not return a subscription id.');
            }
            const verification = await billingService.verifyRazorpaySubscription({
              subscriptionId: order.subscriptionId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
            });
            const subtotal = subtotalFromTotal(active.total);
            const nextSuccessData = {
              razorpayPaymentId: response.razorpay_payment_id,
              planName: plan.name,
              planLabel: active.label,
              amountTotal: active.total,
              nextBilling: nextBillingDate(cycle),
              billedToEmail: user?.email ?? '',
              paymentMethod: 'Razorpay AutoPay',
              cycle,
              subtotal,
              gst: gstFromTotal(active.total),
            };
            if (verification.data?.activationStatus === 'active') {
              await entitlements.refreshEntitlements();
              setSuccessData(nextSuccessData);
              setStep('success');
            } else {
              setPendingMessage('Your AutoPay mandate is authorised. We are waiting for Razorpay confirmation.');
              setStep('pending');
              const activated = await pollForActivation(order.subscriptionId);
              if (activated) {
                setSuccessData(nextSuccessData);
                setStep('success');
              } else {
                setPendingMessage('We will activate access automatically once Razorpay confirms the subscription.');
              }
            }
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
        theme: {
          color: RAZORPAY_BRAND.primaryColor,
          backdrop_color: RAZORPAY_BRAND.backdropColor,
        },
      });

      checkout.on('payment.failed', async (response: any) => {
        const reason = response?.error?.description || 'Payment failed. Please try another payment method.';
        setFailureData({
          razorpayPaymentId: order.subscriptionId,
          planName: plan.name, planLabel: active.label,
          amountTotal: active.total,
          errorReason: reason,
          billedToEmail: user?.email ?? '',
          paymentMethod: 'Razorpay',
        });
        setStep('failed');
        setIsPaying(false);
      });

      checkout.open();
    } catch (err: any) {
      setPaymentError(err?.message || 'Unable to start payment. Please try again.');
      setIsPaying(false);
    }
  };

  if (step === 'pending') {
    return (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(8,15,35,0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16, overflowY: 'auto',
        }}
      >
        <div style={{ width: '100%', maxWidth: 440, borderRadius: 16, background: '#fff', padding: 28, textAlign: 'center', boxShadow: '0 24px 80px rgba(8,15,35,0.28)' }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', border: '3px solid #E8B84B', borderTopColor: 'transparent', margin: '0 auto 18px', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <h3 style={{ margin: 0, fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 28, color: '#101828' }}>Setting up your subscription</h3>
          <p style={{ margin: '12px 0 0', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, lineHeight: 1.6, color: '#667085' }}>
            {pendingMessage || 'Waiting for Razorpay confirmation.'}
          </p>
          <button type="button" onClick={onClose} style={{ marginTop: 22, borderRadius: 10, border: '1px solid #D0D5DD', background: '#fff', padding: '11px 18px', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 13, fontWeight: 700, color: '#344054', cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </div>
    );
  }

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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const entitlements = useEntitlements();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<PlanKey | null>(null);
  const [manageBusy, setManageBusy] = useState<string | null>(null);
  const [manageMessage, setManageMessage] = useState('');
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showEditAddressModal, setShowEditAddressModal] = useState(false);
  const [syllabusCoverage, setSyllabusCoverage] = useState<number | null>(null);

  const handleUpgrade = () => router.push('/dashboard');
  const currentTier = entitlements.tier;
  const currentRank = { free: 0, aspire: 1, rise: 2, ascent: 3 }[currentTier];
  const hasRealSubscription = currentTier !== 'free' && !!entitlements.subscription;

  // Admins can preview any tier via the plan switcher in /admin. A pure simulation never
  // attaches a real Subscription row, so treat a rise/ascent simulation as "paid" too —
  // otherwise the My Plan & Billing preview they're testing for would never be reachable.
  const isAdminSimulating = Boolean(entitlements.summary?.override?.isAdminPlanSimulation);
  const isPreviewTier = isAdminSimulating && (currentTier === 'rise' || currentTier === 'ascent');
  const isPreview = isPreviewTier && !hasRealSubscription;

  // Aspire is a real, always-on tier now (never "no plan") — every authenticated user has
  // *something* to show on My Plan & Billing, not just paying subscribers. currentTier only
  // stays 'free' while logged out or before entitlements have finished their first load.
  const canViewMyPlan = isAuthenticated && currentTier !== 'free';
  const canShowPlan = (plan: PlanKey) => ({ aspire: 1, rise: 2, ascent: 3 }[plan] > currentRank);

  // Explore Plans always shows all 3 cards (matching Figma's static comparison layout) —
  // canShowPlan above still gates whether checkout can actually open for a plan; this just
  // decides what each card's CTA button says/does for the viewer's own tier and below.
  const planCtaState = (plan: PlanKey): { label: string; disabled: boolean } => {
    const rank = { aspire: 1, rise: 2, ascent: 3 }[plan];
    if (rank === currentRank) return { label: 'Current Plan', disabled: true };
    if (rank < currentRank) return { label: 'Included in your plan', disabled: true };
    return { label: '', disabled: false };
  };

  const wantsExploreTab = searchParams.get('tab') === 'explore';

  // activeTab is derived fresh every render from live entitlements state (canViewMyPlan),
  // rather than "decided once" in a useState initializer or a one-time sync effect — that
  // earlier approach could go stale across Next.js client-side route-cache navigations or
  // dev-mode Fast Refresh, since the async entitlements load doesn't reliably re-trigger a
  // one-shot effect. manualTab only overrides this once the user (or an explicit deep link)
  // actively picks a tab; until then, it just tracks reality on every render.
  const [manualTab, setManualTabState] = useState<'my-plan' | 'explore' | null>(null);
  const setActiveTab = (tab: 'my-plan' | 'explore') => setManualTabState(tab);
  const defaultTab: 'my-plan' | 'explore' = wantsExploreTab || !canViewMyPlan ? 'explore' : 'my-plan';
  const activeTab = manualTab ?? defaultTab;

  // If a manually-pinned "My Plan & Billing" selection stops being valid (logged out mid-
  // session), release the pin so the live default takes over.
  useEffect(() => {
    if (!canViewMyPlan && manualTab === 'my-plan') setManualTabState(null);
  }, [canViewMyPlan, manualTab]);

  // Contextual "you hit a limit" upgrade prompts elsewhere in the app (e.g. Flashcards)
  // link here with #upgrade-plans to jump straight to pricing regardless of current tier.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#upgrade-plans') {
      setManualTabState('explore');
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    dashboardService.getPerformance()
      .then((res: any) => setSyllabusCoverage(typeof res?.data?.syllabusCoverage === 'number' ? res.data.syllabusCoverage : null))
      .catch(() => setSyllabusCoverage(null));
  }, [isAuthenticated]);
  const handleOpenCheckout = (plan: PlanKey) => {
    if (!isAuthenticated) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('rwj_post_auth_redirect', `${pathname}?checkout=${plan}`);
      }
      openAuthModal('signup');
      return;
    }
    if (!canShowPlan(plan)) return;
    setCheckoutPlan(plan);
  };
  const handleAspireCta = () => {
    if (!isAuthenticated) {
      openAuthModal('signup');
      return;
    }
    router.push('/dashboard');
  };
  const handleOpenRiseCheckout = () => handleOpenCheckout('rise');
  const handleOpenAscentCheckout = () => handleOpenCheckout('ascent');
  const currentSubscription = entitlements.subscription;
  const handleResume = async () => {
    if (!currentSubscription?.id) return;
    setManageBusy('resume');
    setManageMessage('');
    try {
      await billingService.resumeRazorpaySubscription(currentSubscription.id);
      await entitlements.refreshEntitlements();
      setManageMessage('AutoPay resumed.');
    } catch (err: any) {
      setManageMessage(err?.message || 'Unable to resume subscription. Please try again.');
    } finally {
      setManageBusy(null);
    }
  };

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

  useEffect(() => {
    const requestedPlan = searchParams.get('checkout');
    if (authLoading || !isAuthenticated || !requestedPlan || !['aspire', 'rise', 'ascent'].includes(requestedPlan)) return;

    setCheckoutPlan(requestedPlan as PlanKey);
    router.replace(pathname, { scroll: false });
  }, [authLoading, isAuthenticated, pathname, router, searchParams]);

  return (
    <div className="min-h-screen" style={{ background: '#FAFBFE', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onError={() => console.error('Failed to load Razorpay checkout script (network issue or blocked by an ad-blocker).')}
      />
      <BillingHero />

      {/* Tab switcher — only shown when there are two tabs to choose between. 32px gap
          below the hero's bottom edge, matching Figma exactly (no overlap into the hero). */}
      {canViewMyPlan && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32, position: 'relative', zIndex: 2, padding: '0 16px' }}>
          <div style={{ display: 'inline-flex', gap: 4, background: '#fff', border: '1px solid rgba(11,22,40,0.09)', borderRadius: 12, padding: 5, boxShadow: '0 2px 7px rgba(11,22,40,0.07)' }}>
            <button type="button" onClick={() => setActiveTab('my-plan')} style={{
              borderRadius: 9, padding: '10px 28px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: activeTab === 'my-plan' ? '#090e1c' : 'transparent',
              color: activeTab === 'my-plan' ? '#e8b84b' : '#6b7a99',
              fontFamily: 'var(--font-dm-sans), Inter, system-ui, sans-serif', whiteSpace: 'nowrap',
            }}>
              My Plan &amp; Billing
            </button>
            <button type="button" onClick={() => setActiveTab('explore')} style={{
              borderRadius: 9, padding: '10px 28px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: activeTab === 'explore' ? '#090e1c' : 'transparent',
              color: activeTab === 'explore' ? '#e8b84b' : '#6b7a99',
              fontFamily: 'var(--font-dm-sans), Inter, system-ui, sans-serif', whiteSpace: 'nowrap',
            }}>
              Explore Plans
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto mt-3 flex w-full max-w-[1120px] flex-col gap-8 px-4 pb-20 sm:px-6 lg:px-8">
        {activeTab === 'my-plan' && canViewMyPlan && (
          <MyPlanBillingTab
            tier={currentTier}
            plan={entitlements.plan}
            subscription={entitlements.subscription}
            features={entitlements.features}
            syllabusCoverage={syllabusCoverage}
            busy={!!manageBusy}
            isPreview={isPreview}
            onCancelClick={() => setShowCancelModal(true)}
            onUpgradeClick={() => setActiveTab('explore')}
            onEditAddressClick={() => setShowEditAddressModal(true)}
            onResumeClick={currentSubscription?.status === 'paused' ? handleResume : undefined}
          />
        )}

        {manageMessage && <p style={{ margin: 0, fontSize: 13, color: '#166534', fontFamily: 'Inter, system-ui, sans-serif' }}>{manageMessage}</p>}

        {activeTab === 'explore' && (
        <>
        {/* Billing cycle toggle */}
        <div id="upgrade-plans" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 16, scrollMarginTop: 128 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', background: '#fff', border: '1px solid #E8E4DA', borderRadius: 999, padding: 5, gap: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            {(['monthly', 'quarterly', 'yearly'] as const).map((c) => (
              <button key={c} type="button" onClick={() => setCycle(c)} style={{
                borderRadius: 999, padding: '8px 20px', fontSize: 13.1, fontWeight: 600,
                cursor: 'pointer', border: 'none', transition: 'background 0.18s, color 0.18s',
                background: cycle === c ? '#0D1B2E' : 'transparent',
                color: cycle === c ? '#fff' : '#8A8AAA',
                fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif',
                whiteSpace: 'nowrap',
              }}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
            <span style={{ borderRadius: 999, padding: '5px 13px', fontSize: 11.2, fontWeight: 700, background: '#DCFCE7', border: '1px solid rgba(21,128,61,0.15)', color: '#15803D', fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif', whiteSpace: 'nowrap', marginLeft: 4 }}>
              Save up to 40%
            </span>
          </div>
        </div>

        {/* 3 plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: 16, alignItems: 'stretch' }}>

          {/* Aspire — forever free */}
          <article
            onMouseEnter={() => setHoveredPlan('aspire')}
            onMouseLeave={() => setHoveredPlan(null)}
            style={{ borderRadius: 20, border: '1px solid #E8E4DA', background: '#FFFFFF', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s ease, box-shadow 0.2s ease', transform: hoveredPlan === 'aspire' ? 'translateY(-6px)' : 'translateY(0)', boxShadow: hoveredPlan === 'aspire' ? '0 16px 40px rgba(11,22,40,0.12)' : '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '35px 29px 39px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <p style={{ margin: '0 0 8px', fontSize: 10.2, fontWeight: 700, letterSpacing: '1.4px', textTransform: 'uppercase', color: '#D4900A', fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif' }}>Forever Free</p>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-cormorant-garamond), "Cormorant Garamond", Georgia, serif', fontSize: 28, fontWeight: 700, lineHeight: 'normal', color: '#1A1A2E' }}>Aspire</h3>
              <p style={{ margin: '8px 0 0', fontSize: 12.6, lineHeight: '19.6px', color: '#8A8AAA', fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif' }}>
                Build daily study habits. Begin your UPSC prep without spending a rupee.
              </p>
              <div style={{ paddingTop: 21 }}>
                <span style={{ fontFamily: 'var(--font-cormorant-garamond), "Cormorant Garamond", Georgia, serif', fontSize: 41.6, fontWeight: 700, lineHeight: '41.6px', color: '#D4900A' }}>Free</span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#8A8AAA', fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif' }}>Always free, forever</p>
              <div style={{ height: 1, background: '#F0ECE4', margin: '20px 0' }} />
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[
                  { text: 'Daily MCQ Challenge', limited: false },
                  { text: 'Daily Mains Challenge', limited: false },
                  { text: 'Daily News Analysis - Hindu & IE', limited: false },
                  { text: '10,000+ Previous Year Questions', limited: false },
                  { text: '2 Mains Evaluations / day', limited: false },
                  { text: 'Jeet AI - 10 conversations / day', limited: false },
                  { text: 'Study Planner & Time Tracker', limited: false },
                  { text: 'Daily Leaderboard & Discussion Forum', limited: false },
                  { text: 'Mental Health Buddy', limited: false },
                  { text: 'Mock Tests - Limited access', limited: true },
                  { text: 'Revision Suite - Limited access', limited: true },
                  { text: 'Performance Analytics - Limited view', limited: true },
                ].map((item) => (
                  <li key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.1, color: '#4A4A68', fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif' }}>
                    <span style={{ flexShrink: 0, width: 17, height: 17, borderRadius: 8.5, display: 'flex', alignItems: 'center', justifyContent: 'center', background: item.limited ? '#FEF3DC' : '#DCFCE7', color: item.limited ? '#D4900A' : '#16A34A', fontWeight: 800, fontSize: item.limited ? 9 : 11 }}>{item.limited ? '~' : '✓'}</span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={planCtaState('aspire').disabled ? undefined : handleAspireCta}
                disabled={planCtaState('aspire').disabled}
                style={{ marginTop: 24, width: '100%', borderRadius: 11, padding: '13px 16px', fontSize: 13.9, fontWeight: 700, cursor: planCtaState('aspire').disabled ? 'default' : 'pointer', border: 'none', background: planCtaState('aspire').disabled ? '#F3F1EC' : '#FFFFFF', boxShadow: planCtaState('aspire').disabled ? 'none' : '0px 1px 1.5px rgba(0,0,0,0.1)', color: planCtaState('aspire').disabled ? '#8A8AAA' : '#0F2040', fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif' }}
              >
                {planCtaState('aspire').label || 'Get Started Free →'}
              </button>
              <p style={{ margin: '8px 0 0', fontSize: 11.2, color: '#8A8AAA', textAlign: 'center', fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif' }}>
                No card needed • Upgrade anytime
              </p>
            </div>
          </article>

          {/* Rise (Most Popular) */}
          <article
            onMouseEnter={() => setHoveredPlan('rise')}
            onMouseLeave={() => setHoveredPlan(null)}
            style={{ borderRadius: 20, border: '2px solid #E8B84B', background: '#0B1525', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s ease, box-shadow 0.2s ease', transform: hoveredPlan === 'rise' ? 'translateY(-6px)' : 'translateY(0)', boxShadow: hoveredPlan === 'rise' ? '0 16px 40px rgba(232,184,75,0.25)' : '0 1px 4px rgba(11,22,40,0.05)' }}>
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', background: '#E8B84B', color: '#090E1C', padding: '5px 16px', borderRadius: '0 0 10px 10px', fontSize: 10, fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif', whiteSpace: 'nowrap' }}>
              ⭐ Most Popular
            </div>
            <div style={{ padding: '44px 24px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <p style={{ margin: '0 0 8px', fontSize: 10.5, fontWeight: 700, letterSpacing: '1.47px', textTransform: 'uppercase', color: '#E8B84B', fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif' }}>Dedicated Study</p>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-cormorant-garamond), "Cormorant Garamond", Georgia, serif', fontSize: 28.7, fontWeight: 700, lineHeight: 'normal', color: '#fff' }}>Rise</h3>
              <p style={{ margin: '8px 0 0', fontSize: 12.9, lineHeight: '20px', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif' }}>
                For serious aspirants who study daily and want measurable progress.
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, paddingTop: 22 }}>
                <span style={{ fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif', fontSize: 19.7, fontWeight: 600, color: '#E8B84B', paddingBottom: 6 }}>₹</span>
                <span style={{ fontFamily: 'var(--font-cormorant-garamond), "Cormorant Garamond", Georgia, serif', fontSize: 49.2, fontWeight: 700, lineHeight: '49.2px', color: '#E8B84B' }}>
                  {cycle === 'monthly' ? '499' : cycle === 'quarterly' ? '399' : '299'}
                </span>
                <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.38)', fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif', paddingBottom: 6 }}>/month</span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 11.8, color: 'rgba(255,255,255,0.33)', fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif' }}>
                {cycle === 'monthly' ? 'Billed monthly' : cycle === 'quarterly' ? '₹1,197 every 3 months - Save 20%' : '₹3,588 yearly - Save 40%'}
              </p>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '20px 0' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
                <span style={{ color: '#E8B84B', fontSize: 12 }}>✓</span>
                <span style={{ fontSize: 13.1, color: '#fff', fontWeight: 700, fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif' }}>Everything in Aspire, plus:</span>
              </div>
              {[
                { title: 'Evaluation', items: ['25 Mains Evaluations / day', '25 Mock Test attempts / day'] },
                { title: 'Analytics', items: ['Full Performance Analytics Dashboard', 'Test Analytics - In-depth insights'] },
                { title: 'Revision Tools', items: ['Full Revision Suite - Flashcards, Mindmaps, Spaced Rep.', 'Jeet AI - 100 conversations / day', 'Live Study Room 24×7', 'Smart Syllabus Tracker'] },
              ].map((section) => (
                <div key={section.title} style={{ marginBottom: 12 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 800, letterSpacing: '1.95px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif' }}>{section.title}</p>
                  {section.items.map((item) => (
                    <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 7, fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif' }}>
                      <span style={{ color: '#E8B84B', flexShrink: 0, marginTop: 1, fontSize: 12 }}>✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              ))}
              <button
                type="button"
                onClick={planCtaState('rise').disabled ? undefined : handleOpenRiseCheckout}
                disabled={planCtaState('rise').disabled}
                style={{ marginTop: 'auto', width: '100%', borderRadius: 10, padding: '13px 16px', fontSize: 14, fontWeight: 700, cursor: planCtaState('rise').disabled ? 'default' : 'pointer', border: 'none', background: planCtaState('rise').disabled ? 'rgba(255,255,255,0.1)' : '#E8B84B', color: planCtaState('rise').disabled ? 'rgba(255,255,255,0.5)' : '#090E1C', fontFamily: 'var(--font-dm-sans), "DM Sans", Inter, sans-serif' }}
              >
                {planCtaState('rise').label || 'Unlock Rise Now →'}
              </button>
              {!planCtaState('rise').disabled && (
                <p style={{ margin: '9px 0 0', fontSize: 11.5, color: '#15803D', textAlign: 'center', fontWeight: 600, fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  ↩️ 7-day money-back guarantee, no questions asked
                </p>
              )}
            </div>
          </article>

          {/* Ascent */}
          <article
            onMouseEnter={() => setHoveredPlan('ascent')}
            onMouseLeave={() => setHoveredPlan(null)}
            style={{ borderRadius: 20, border: '1px solid #E5E7EB', background: '#FFFFFF', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s ease, box-shadow 0.2s ease', transform: hoveredPlan === 'ascent' ? 'translateY(-6px)' : 'translateY(0)', boxShadow: hoveredPlan === 'ascent' ? '0 16px 40px rgba(11,22,40,0.12)' : '0 1px 4px rgba(11,22,40,0.05)' }}>
            <div style={{ padding: '28px 24px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <p style={{ margin: '0 0 8px', fontSize: 10.2, fontWeight: 700, letterSpacing: '1.43px', textTransform: 'uppercase', color: '#D4900A', fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif' }}>Maximum Edge</p>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-cormorant-garamond), "Cormorant Garamond", Georgia, serif', fontSize: 28, fontWeight: 700, lineHeight: 'normal', color: '#1A1A2E' }}>Ascent</h3>
              <p style={{ margin: '8px 0 0', fontSize: 12.6, lineHeight: '19.6px', color: '#8A8AAA', fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif' }}>
                Unlimited tools, zero limits. For aspirants who leave nothing to chance.
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, paddingTop: 21 }}>
                <span style={{ fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif', fontSize: 19.2, fontWeight: 600, color: '#D4900A', paddingBottom: 6 }}>₹</span>
                <span style={{ fontFamily: 'var(--font-cormorant-garamond), "Cormorant Garamond", Georgia, serif', fontSize: 48, fontWeight: 700, lineHeight: '48px', color: '#D4900A' }}>
                  {cycle === 'monthly' ? '999' : cycle === 'quarterly' ? '799' : '599'}
                </span>
                <span style={{ fontSize: 12.2, color: '#8A8AAA', fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif', paddingBottom: 6 }}>/month</span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#8A8AAA', fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif' }}>
                {cycle === 'monthly' ? 'Billed monthly' : cycle === 'quarterly' ? '₹2,397 every 3 months - Save 20%' : '₹7,188 yearly - Save 40%'}
              </p>
              <div style={{ height: 1, background: '#F0ECE4', margin: '20px 0' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
                <span style={{ color: '#22C55E', fontSize: 12 }}>✓</span>
                <span style={{ fontSize: 13.1, color: '#1A1A2E', fontWeight: 700, fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif' }}>Everything in Rise, plus:</span>
              </div>
              {[
                { title: 'Evaluation', items: ['Unlimited Mains Evaluations', 'Unlimited Mock Test practice', 'Jeet AI - Unlimited conversations'] },
                { title: 'Mentor-Led Growth', items: ['Weekly 1-on-1 mentorship (30 min)', 'Personalised Study Roadmap', 'Dedicated Q&A - Priority Responses', 'Monthly Performance Review Call', 'Exclusive Ascent Community', 'Early Access to New Features'] },
              ].map((section) => (
                <div key={section.title} style={{ marginBottom: 12 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 800, letterSpacing: '1.29px', color: '#8A8AAA', textTransform: 'uppercase', fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif' }}>{section.title}</p>
                  {section.items.map((item) => (
                    <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 7, fontSize: 13.1, color: '#4A4A68', fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif' }}>
                      <span style={{ color: '#22C55E', flexShrink: 0, marginTop: 1, fontSize: 12 }}>✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              ))}
              <button
                type="button"
                onClick={planCtaState('ascent').disabled ? undefined : handleOpenAscentCheckout}
                disabled={planCtaState('ascent').disabled}
                style={{ marginTop: 'auto', width: '100%', borderRadius: 11, padding: '13px 16px', fontSize: 13.9, fontWeight: 700, cursor: planCtaState('ascent').disabled ? 'default' : 'pointer', border: 'none', background: planCtaState('ascent').disabled ? '#F3F1EC' : '#0C1424', color: planCtaState('ascent').disabled ? '#8A8AAA' : '#fff', fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif' }}
              >
                {planCtaState('ascent').label || 'Get Ascent Plan→'}
              </button>
              {!planCtaState('ascent').disabled && (
                <p style={{ margin: '9px 0 0', fontSize: 11.2, color: '#15803D', textAlign: 'center', fontWeight: 600, fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  ↩️ 7-day money-back guarantee included
                </p>
              )}
            </div>
          </article>

        </div>

        {/* Trust badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'center' }}>
          {['🔒 Secure Payments', '↩️ 7-Day Money-Back Guarantee', '❌ Cancel Anytime', '👥15,000+ UPSC aspirants'].map((label) => (
            <div key={label} style={{ background: '#fff', border: '1px solid #E8E4DA', borderRadius: 50, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '8px 17px' }}>
              <span style={{ fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif', fontSize: 12.2, color: '#4a4a68', whiteSpace: 'nowrap' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* ── Feature Breakdown ── */}
        <section style={{ paddingBottom: 16 }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ display: 'block', width: 36, height: 1, background: 'linear-gradient(to right, transparent, #C8972A)' }} />
              <span style={{ fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif', fontWeight: 700, fontSize: 10.9, letterSpacing: '1.74px', color: '#D4900A', textTransform: 'uppercase' }}>
                Feature Breakdown
              </span>
              <span style={{ display: 'block', width: 36, height: 1, background: 'linear-gradient(to left, transparent, #C8972A)' }} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-cormorant-garamond), "Cormorant Garamond", Georgia, serif', fontSize: 44, fontStyle: 'normal', fontWeight: 700, lineHeight: '51.92px', color: '#1A1A2E', textAlign: 'center', margin: 0 }}>
              Everything, Side by Side
            </h2>
          </div>

          {/* Comparison table */}
          <style>{`
            .cmp-table-wrap { border-radius: 20px; overflow-x: auto; overflow-y: hidden; -webkit-overflow-scrolling: touch; border: 1px solid #E8E4DA; box-shadow: 0 24px 72px rgba(0,0,0,0.14); }
            .cmp-table { width: 100%; min-width: 560px; border-collapse: collapse; font-family: var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif; }
            @media (max-width: 640px) {
              .cmp-table { min-width: 480px; }
              .cmp-th { padding: 14px 10px !important; }
              .cmp-td-feature { padding: 11px 12px !important; }
              .cmp-td { padding: 11px 8px !important; }
            }
          `}</style>
          <div className="cmp-table-wrap">
            <table className="cmp-table">
              {/* Header row */}
              <thead>
                <tr style={{ background: '#0c1424' }}>
                  <th className="cmp-th" style={{ padding: '22px 20px', textAlign: 'left', width: '40%', color: '#fff', fontFamily: 'var(--font-cormorant-garamond), "Cormorant Garamond", Georgia, serif', fontSize: 20, fontWeight: 600 }}>
                    Features
                  </th>
                  <th className="cmp-th" style={{ padding: '22px 16px', textAlign: 'center', color: '#fff', fontFamily: 'var(--font-cormorant-garamond), "Cormorant Garamond", Georgia, serif', fontSize: 20, fontWeight: 700 }}>
                    Aspire
                  </th>
                  <th className="cmp-th" style={{ padding: '22px 16px', textAlign: 'center', background: 'rgba(212,144,10,0.13)' }}>
                    <span style={{ color: '#f2ab2e', fontFamily: 'var(--font-cormorant-garamond), "Cormorant Garamond", Georgia, serif', fontSize: 20, fontWeight: 700 }}>Rise ⭐</span>
                  </th>
                  <th className="cmp-th" style={{ padding: '22px 16px', textAlign: 'center', color: '#fff', fontFamily: 'var(--font-cormorant-garamond), "Cormorant Garamond", Georgia, serif', fontSize: 20, fontWeight: 700 }}>
                    Ascent
                  </th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const cellStyle = (val: string, isRise = false): React.CSSProperties => ({
                    padding: '13px 16px',
                    whiteSpace: 'nowrap' as const,
                    textAlign: 'center' as const,
                    fontSize: val === '✓' ? 16 : 13,
                    fontWeight: val === '✓' ? 400 : 700,
                    color: val === '✓' ? '#15803d'
                      : val === '—' ? '#CBD5E1'
                      : ['Limited', 'Unlimited', 'Full Access', 'Weekly'].includes(val) || val.includes('/') ? '#d4900a'
                      : '#1a1a2e',
                    background: isRise ? 'rgba(212,144,10,0.02)' : 'transparent',
                    borderBottom: '1px solid #f0ece4',
                  });

                  const rows: { feature: string; sub?: string; aspire: string; rise: string; ascent: string }[] = [
                    { feature: 'Daily MCQ Challenge', sub: 'Subject & topic-wise with explanations', aspire: '10 / day', rise: 'Unlimited', ascent: 'Unlimited' },
                    { feature: 'Daily Mains Challenge', aspire: '✓', rise: '✓', ascent: '✓' },
                    { feature: 'Daily News Analysis', sub: 'The Hindu & Indian Express', aspire: '✓', rise: '✓', ascent: '✓' },
                    { feature: 'Daily Leaderboard', aspire: '✓', rise: '✓', ascent: '✓' },
                    { feature: 'Mains Evaluations', sub: 'Instant UPSC marking scheme feedback', aspire: '2 / day', rise: '25 / day', ascent: 'Unlimited' },
                    { feature: '10,000+ Previous Year Questions', aspire: '✓', rise: '✓', ascent: '✓' },
                    { feature: 'Mock Test Attempts', sub: 'Full-length Prelims & Mains simulations', aspire: 'Limited', rise: '25 / day', ascent: 'Unlimited' },
                    { feature: 'Syllabus Tracker', sub: 'Personalized UPSC Syllabus Mapping', aspire: 'Limited', rise: 'Unlimited', ascent: 'Unlimited' },
                    { feature: 'Jeet AI Conversations', sub: 'UPSC-preparation partner', aspire: '10 / day', rise: '100 / day', ascent: 'Unlimited' },
                    { feature: 'Performance Analytics Dashboard', aspire: 'Limited', rise: '✓', ascent: '✓' },
                    { feature: 'Test Analytics', sub: 'Deep score breakdowns', aspire: '—', rise: '✓', ascent: '✓' },
                    { feature: 'Revision Suite', sub: 'Flashcards, Mindmaps, Spaced Repetition', aspire: 'Limited', rise: 'Full Access', ascent: 'Full Access' },
                    { feature: 'Discussion Forum', aspire: '✓', rise: '✓', ascent: '✓' },
                    { feature: 'Live Study Room 24×7', aspire: 'Limited', rise: '✓', ascent: '✓' },
                    { feature: 'Mental Health Buddy', aspire: '✓', rise: '✓', ascent: '✓' },
                    { feature: 'Weekly 1-on-1 Mentorship', sub: '30 minutes per session', aspire: '—', rise: '—', ascent: 'Weekly' },
                    { feature: 'Personalised Study Roadmap', aspire: '—', rise: '—', ascent: '✓' },
                    { feature: 'Dedicated Q&A Priority Responses', aspire: '—', rise: '—', ascent: '✓' },
                    { feature: 'Monthly Performance Review Call', aspire: '—', rise: '—', ascent: '✓' },
                  ];

                  return rows.map((row) => (
                    <tr key={row.feature} style={{ background: '#fff' }}>
                      <td className="cmp-td-feature" style={{ padding: '13px 20px', borderBottom: '1px solid #f0ece4' }}>
                        <span style={{ fontSize: 13.4, fontWeight: 500, color: '#4a4a68', display: 'block' }}>{row.feature}</span>
                        {row.sub && <span style={{ fontSize: 11.2, color: '#8a8aaa', display: 'block', marginTop: 2 }}>{row.sub}</span>}
                      </td>
                      <td className="cmp-td" style={cellStyle(row.aspire)}>{row.aspire}</td>
                      <td className="cmp-td" style={cellStyle(row.rise, true)}>{row.rise}</td>
                      <td className="cmp-td" style={cellStyle(row.ascent)}>{row.ascent}</td>
                    </tr>
                  ));
                })()}

                {/* CTA row */}
                <tr style={{ background: '#fff' }}>
                  <td style={{ padding: '20px' }} />
                  <td style={{ padding: '20px 16px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={planCtaState('aspire').disabled ? undefined : handleAspireCta}
                      disabled={planCtaState('aspire').disabled}
                      style={{ borderRadius: 8, border: '1.5px solid #D1D5DB', background: 'transparent', padding: '10px 20px', fontSize: 13, fontWeight: 600, color: planCtaState('aspire').disabled ? '#B8B8C4' : '#1A1A2E', cursor: planCtaState('aspire').disabled ? 'default' : 'pointer', fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif', whiteSpace: 'nowrap' }}
                    >
                      {planCtaState('aspire').disabled ? planCtaState('aspire').label : 'Start Free'}
                    </button>
                  </td>
                  <td style={{ padding: '20px 16px', textAlign: 'center', background: 'rgba(212,144,10,0.02)' }}>
                    <button
                      type="button"
                      onClick={planCtaState('rise').disabled ? undefined : handleOpenRiseCheckout}
                      disabled={planCtaState('rise').disabled}
                      style={{ borderRadius: 8, border: 'none', background: planCtaState('rise').disabled ? '#EDE6D3' : '#E8B84B', padding: '10px 20px', fontSize: 13, fontWeight: 600, color: planCtaState('rise').disabled ? '#A08C4E' : '#090E1C', cursor: planCtaState('rise').disabled ? 'default' : 'pointer', fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif', whiteSpace: 'nowrap' }}
                    >
                      {planCtaState('rise').disabled ? planCtaState('rise').label : 'Unlock Rise'}
                    </button>
                  </td>
                  <td style={{ padding: '20px 16px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={planCtaState('ascent').disabled ? undefined : handleOpenAscentCheckout}
                      disabled={planCtaState('ascent').disabled}
                      style={{ borderRadius: 8, border: 'none', background: planCtaState('ascent').disabled ? '#EDEBE6' : '#090E1C', padding: '10px 20px', fontSize: 13, fontWeight: 600, color: planCtaState('ascent').disabled ? '#8A8AAA' : '#fff', cursor: planCtaState('ascent').disabled ? 'default' : 'pointer', fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif', whiteSpace: 'nowrap' }}
                    >
                      {planCtaState('ascent').disabled ? planCtaState('ascent').label : 'Get Ascent'}
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
              <span style={{ fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif', fontWeight: 700, fontSize: 10.9, letterSpacing: '1.74px', color: '#D4900A', textTransform: 'uppercase' }}>The Ecosystem</span>
              <span style={{ display: 'block', width: 36, height: 1, background: 'linear-gradient(to left, transparent, #C8972A)' }} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-cormorant-garamond), "Cormorant Garamond", Georgia, serif', fontSize: 44, fontWeight: 700, lineHeight: '51.92px', color: '#1A1A2E', margin: '0 0 12px' }}>
              Why Rise With Jeet?
            </h2>
            <p style={{ fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif', fontSize: 15.2, color: '#8A8AAA', margin: 0, maxWidth: 480, marginInline: 'auto', lineHeight: '26.14px', textAlign: 'center' }}>
              Not just another coaching the complete UPSC operating system for India&apos;s brightest minds.
            </p>
          </div>

          {/* 4×2 feature grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 16 }}>
            {[
              { icon: '🎯', title: 'Daily MCQ Practice', desc: 'Subject-wise & topic-wise MCQs with detailed explanations. New questions every day, curated by experts.' },
              { icon: '📊', title: 'Deep Analytics', desc: 'Topic-level breakdowns, readiness scores, and weak-area detection.' },
              { icon: '📅', title: 'Smart Planning', desc: 'Syllabus tracker, planner and spaced repetition so nothing slips through.' },
              { icon: '👥', title: 'Live Community', desc: 'Study alongside 15,000 aspirants in live rooms and accountability groups.' },
              { icon: '📰', title: 'Daily Current Affairs', desc: 'Hindu & IE analysis connecting today\'s news directly to the UPSC syllabus.' },
              { icon: '✍️', title: 'Daily Answer Writing', desc: 'Daily mains practice with AI-powered instant evaluation and UPSC-style marking schemes.' },
              { icon: '🧠', title: 'Smart Revision', desc: 'Flashcards, mindmaps, spaced repetition — study once, remember forever.' },
              { icon: '📃', title: 'Previous Year Questions', desc: '30 years of PYQs with trend analysis, topic clustering, and examiner insights.' },
            ].map((card) => (
              <div key={card.title} className="ecosystem-card" style={{ background: '#fff', borderRadius: 15, border: '1px solid #E8E4DA', padding: '23px 19px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <span className="ecosystem-card-accent" style={{ background: '#E8B84B' }} />
                <div style={{ width: 42, height: 42, borderRadius: 11, background: '#FEF3DC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19.2, marginBottom: 14 }}>
                  {card.icon}
                </div>
                <p style={{ margin: '0 0 6px', fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif', fontSize: 13.9, fontWeight: 700, color: '#1A1A2E' }}>{card.title}</p>
                <p style={{ margin: 0, fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif', fontSize: 12.2, color: '#8A8AAA', lineHeight: '19.46px' }}>{card.desc}</p>
              </div>
            ))}
          </div>
          <style jsx>{`
            .ecosystem-card {
              position: relative;
              overflow: hidden;
              transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .ecosystem-card:hover {
              transform: translateY(-3px);
              box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04);
              border-color: transparent;
            }
            .ecosystem-card-accent {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 3px;
              opacity: 0;
              transition: opacity 0.3s;
            }
            .ecosystem-card:hover .ecosystem-card-accent {
              opacity: 1;
            }
          `}</style>
        </section>

        {/* ── What Our Learners Are Saying ── */}
        <section style={{ paddingBottom: 16 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ display: 'block', width: 36, height: 1, background: 'linear-gradient(to right, transparent, #C8972A)' }} />
              <span style={{ fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif', fontWeight: 700, fontSize: 10.9, letterSpacing: '1.74px', color: '#D4900A', textTransform: 'uppercase' }}>Aspirant Stories</span>
              <span style={{ display: 'block', width: 36, height: 1, background: 'linear-gradient(to left, transparent, #C8972A)' }} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-cormorant-garamond), "Cormorant Garamond", Georgia, serif', fontSize: 30.4, fontWeight: 700, lineHeight: '35.87px', color: '#1A1A2E', margin: 0 }}>
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
                role: 'UPSC CSE 2025 Prelims Aspirant',
                initial: 'P',
                gradient: 'linear-gradient(135deg, rgb(233, 160, 18) 0%, rgb(184, 120, 10) 100%)',
              },
              {
                stars: 5,
                quote: '"Daily MCQs and the leaderboard kept me disciplined across 6 months. Analytics showed me exactly which paper needed attention saved me months of scattered prep."',
                name: 'Rahul',
                role: 'UPSC CSE 2025 Mains Qualified',
                initial: 'R',
                gradient: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(29, 78, 216) 100%)',
              },
              {
                stars: 5,
                quote: '"Current affairs finally clicked with RiseWithJeet. The way they connect The Hindu to the syllabus is unmatched. Cleared Prelims on my very first attempt."',
                name: 'Anjali',
                role: 'UPSC CSE 2025 Prelims Qualified',
                initial: 'A',
                gradient: 'linear-gradient(135deg, rgb(34, 197, 94) 0%, rgb(22, 163, 74) 100%)',
              },
            ].map((t) => (
              <div key={t.name} style={{ background: '#fff', borderRadius: 15, border: '1px solid #E8E4DA', padding: '25px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ color: '#F2AB2E', fontSize: 12.8, letterSpacing: 2 }}>{'★'.repeat(t.stars)}</div>
                <p style={{ margin: 0, fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif', fontSize: 13.3, fontStyle: 'italic', color: '#4A4A68', lineHeight: '22.58px', flex: 1 }}>{t.quote}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', backgroundImage: t.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13.6, flexShrink: 0, fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif' }}>
                    {t.initial}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif', fontSize: 13.4, fontWeight: 700, color: '#1A1A2E' }}>{t.name}</p>
                    <p style={{ margin: 0, fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif', fontSize: 11.4, color: '#8A8AAA' }}>{t.role}</p>
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
              <span style={{ fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif', fontWeight: 700, fontSize: 10.9, letterSpacing: '1.74px', color: '#D4900A', textTransform: 'uppercase' }}>FAQ</span>
              <span style={{ display: 'block', width: 36, height: 1, background: 'linear-gradient(to left, transparent, #C8972A)' }} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-cormorant-garamond), "Cormorant Garamond", Georgia, serif', fontSize: 44, fontWeight: 700, lineHeight: '51.92px', color: '#1A1A2E', margin: '0 0 10px' }}>
              Frequently Asked Questions
            </h2>
            <p style={{ fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif', fontSize: 15.2, color: '#8A8AAA', margin: 0 }}>
              Everything you need to know before you begin your journey.
            </p>
          </div>

          {/* 2-column FAQ grid */}
          {(() => {
            const faqs = [
              { q: 'Is Aspire really free forever?', a: 'Yes, absolutely. Aspire is free for life, no card required. You get 2 mains evaluations/day, 10 MCQ Challenge questions/day, 10 Jeet AI conversations/day, 10,000+ PYQs, study planner, leaderboard and more, forever.' },
              { q: "What's the difference between Rise and Ascent?", a: 'Rise gives you 25 mains evaluations/day, 25 mock test attempts/day, 100 Jeet AI conversations/day, full performance & test analytics, and the complete revision suite. Ascent removes every limit entirely unlimited evaluations, mock tests and Jeet AI plus weekly 1-on-1 mentorship, a personalised roadmap, priority Q&A and a monthly performance review call.' },
              { q: 'Is there a money-back guarantee?', a: "Yes. Every paid plan comes with a 7-day money-back guarantee Rise's is no-questions-asked, and Ascent's is included as standard. Just reach out to support within 7 days of your purchase." },
              { q: 'How much do I save on quarterly & yearly plans?', a: "Quarterly billing saves you 20% compared to monthly, and yearly billing saves you 40% almost 5 months free. For example, Rise monthly is ₹499, but yearly brings it down to ₹299/month. Discounts are automatically applied at checkout." },
              { q: 'Can I upgrade or cancel anytime?', a: 'Absolutely. You can upgrade from Aspire to Rise or Ascent instantly (pro-rated). Cancellation is self-serve from your dashboard - you keep full access until the end of your billing cycle. No cancellation fees, no hassle.' },
              { q: 'How does AI Mains Evaluation work?', a: 'You can upload a photo of your handwritten answer. Jeet AI evaluates it against UPSC marking schemes - structure, content, keyword density, presentation, relevance etc. You get detailed feedback in under 60 seconds, including a score and actionable suggestions to improve.' },
              { q: 'What is the refund policy?', a: 'We offer a 7-day, no-questions-asked refund on all paid subscriptions. Just reach out to support within 7 days of your purchase and we will process the refund within 24 hours. After 7 days, refunds are not applicable but you can cancel future billing.' },
              { q: 'Is this suitable for first-attempt aspirants?', a: "Absolutely. Our study planner, syllabus tracker, daily MCQs and mains answer evaluation are designed to guide you from day one - whether it's your first attempt or your third. Start free with Aspire to build momentum, then upgrade as you get more serious." },
            ];
            const left = faqs.filter((_, i) => i % 2 === 0);
            const right = faqs.filter((_, i) => i % 2 === 1);

            const FaqItem = ({ item, idx }: { item: typeof faqs[0]; idx: number }) => {
              const isOpen = openFaq === idx;
              return (
                <div style={{ background: '#fff', borderRadius: 13, border: '1px solid #E8E4DA', overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '17px 20px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 12 }}
                  >
                    <span style={{ fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif', fontSize: 13.9, fontWeight: 600, color: '#1A1A2E' }}>{item.q}</span>
                    <span style={{ width: 25, height: 25, borderRadius: '50%', background: '#F0ECE4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#D4900A', fontSize: 16, fontWeight: 700 }}>
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0 20px 17px', fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif', fontSize: 13, color: '#8A8AAA', lineHeight: 1.7 }}>
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
        </>
        )}

      </div>

      {/* ── CTA Banner – full width outside the constrained container ── */}
      {activeTab === 'explore' && (
      <section style={{ margin: 0, borderRadius: 0, background: 'linear-gradient(160deg, #0A1120 0%, #0F1C35 100%)', padding: '52px 48px 44px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.025) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{ display: 'block', width: 36, height: 1, background: 'linear-gradient(to right, transparent, #C8972A)' }} />
            <span style={{ fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif', fontWeight: 700, fontSize: 10.9, letterSpacing: '1.74px', color: '#E8B84B', textTransform: 'uppercase' }}>Still Have Doubts?</span>
            <span style={{ display: 'block', width: 36, height: 1, background: 'linear-gradient(to left, transparent, #C8972A)' }} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-cormorant-garamond), "Cormorant Garamond", Georgia, serif', fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 700, color: '#fff', lineHeight: 1.2, margin: '0 0 16px' }}>
            Start Your{' '}
            <em style={{ color: '#E8B84B', fontStyle: 'italic' }}>UPSC Journey</em>
            <br />the Right Way
          </h2>
          <p style={{ fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif', fontSize: 14.9, color: 'rgba(255,255,255,0.52)', maxWidth: 480, margin: '0 auto 32px', lineHeight: '25.59px' }}>
            Join 15,000+ aspirants. Start free with Aspire — no card, no commitment, no expiry. Upgrade only when you feel it.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
            <button type="button" onClick={handleAspireCta} style={{ borderRadius: 10, border: 'none', padding: '13px 34px', fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif', fontSize: 14.6, fontWeight: 800, color: '#0C1424', background: '#E8B84B', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Start Free with Aspire →
            </button>
            <button type="button" onClick={() => router.push('/contact')} style={{ borderRadius: 10, border: '1px solid rgba(255,255,255,0.14)', padding: '14px 27px', fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif', fontSize: 14.6, fontWeight: 600, color: 'rgba(255,255,255,0.78)', background: 'rgba(255,255,255,0.07)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Contact Us
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, borderRadius: 999, background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)', padding: '7px 16px' }}>
              <span style={{ fontSize: 14 }}>💬</span>
              <span style={{ fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif', fontSize: 12, fontWeight: 700, color: '#4ADE80' }}>Text on WhatsApp</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 14 }}>✉️</span>
              <span style={{ fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif', fontSize: 13.1, color: '#E8B84B' }}>together@risewithjeet.com</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 14 }}>📞</span>
              <span style={{ fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif', fontSize: 13.1, color: '#E8B84B' }}>+91 83570 56891</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, borderRadius: 999, background: 'rgba(41,182,246,0.1)', border: '1px solid rgba(41,182,246,0.2)', padding: '7px 16px' }}>
              <span style={{ fontSize: 14 }}>✈️</span>
              <span style={{ fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", Inter, sans-serif', fontSize: 12, fontWeight: 700, color: '#7DD3FC' }}>Text on Telegram</span>
            </div>
          </div>
        </div>
      </section>
      )}

      {checkoutPlan && <CheckoutModal planKey={checkoutPlan} onClose={() => setCheckoutPlan(null)} />}
      {showCancelModal && currentSubscription?.id && (
        <CancelSubscriptionModal
          subscriptionId={currentSubscription.id}
          accessUntil={currentSubscription.endDate}
          onClose={() => setShowCancelModal(false)}
          onCancelled={async () => {
            setShowCancelModal(false);
            await entitlements.refreshEntitlements();
          }}
        />
      )}
      {showEditAddressModal && (
        <EditBillingAddressModal
          onClose={() => setShowEditAddressModal(false)}
          onSaved={() => setShowEditAddressModal(false)}
        />
      )}
    </div>
  );
}
