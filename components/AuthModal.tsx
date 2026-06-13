'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/lib/auth';

type Step = 'form' | 'otpVerify';

const FEATURES = [
  { label: 'Daily MCQ + Answer Writing', desc: 'practice & evaluate' },
  { label: 'Revision toolkit', desc: 'Flashcards, Mindmaps, Spaced Repetition' },
  { label: 'Syllabus + performance analytics', desc: 'track your progress' },
  { label: 'Mock tests & PYQs', desc: 'real exam simulation' },
  { label: 'Live study rooms & discussion forums', desc: 'community driven' },
];

const AVATAR_COLORS = ['#4F7BCC', '#CC6B4F', '#4FCC8A', '#CC4F90'];
const AVATAR_LABELS = ['AK', 'PS', 'RV', 'MR'];

export default function AuthModal() {
  const { isOpen, defaultTab, closeAuthModal } = useAuthModal();
  const { login, loginWithGoogle, isAuthenticated } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<'signup' | 'login'>(defaultTab);
  const [step, setStep] = useState<Step>('form');

  // Signup fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);

  // Login fields
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPhoneError, setLoginPhoneError] = useState(false);
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [loginOtp, setLoginOtp] = useState('');

  // OTP verify (signup)
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [otpPurpose, setOtpPurpose] = useState<'login' | 'signup'>('signup');
  const [otpPhone, setOtpPhone] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const cdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Loading / error
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync tab with defaultTab when modal opens
  useEffect(() => {
    if (isOpen) {
      setTab(defaultTab);
      setStep('form');
      setError(null);
      resetSignupFields();
      resetLoginFields();
    }
  }, [isOpen, defaultTab]);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAuthModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, closeAuthModal]);

  // Lock scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && isOpen) closeAuthModal();
  }, [isAuthenticated, isOpen, closeAuthModal]);

  function resetSignupFields() {
    setFirstName(''); setLastName(''); setEmail(''); setPhone('');
    setEmailError(false); setPhoneError(false);
  }
  function resetLoginFields() {
    setLoginPhone(''); setLoginOtpSent(false); setLoginOtp('');
    setLoginPhoneError(false);
  }

  function startCountdown() {
    if (cdRef.current) clearInterval(cdRef.current);
    setCountdown(30); setCanResend(false);
    let secs = 30;
    cdRef.current = setInterval(() => {
      secs--;
      setCountdown(secs);
      if (secs <= 0) { clearInterval(cdRef.current!); setCanResend(true); }
    }, 1000);
  }

  function switchTab(t: 'signup' | 'login') {
    setTab(t); setStep('form'); setError(null);
    resetSignupFields(); resetLoginFields();
    setOtpCode(['', '', '', '', '', '']);
  }

  function validateEmail(val: string, force = false): boolean {
    if (!val && !force) { setEmailError(false); return true; }
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    setEmailError(!ok);
    return ok;
  }

  function validatePhone(val: string, which: 'signup' | 'login', force = false): boolean {
    if (!val && !force) {
      which === 'signup' ? setPhoneError(false) : setLoginPhoneError(false);
      return true;
    }
    const ok = /^[6-9][0-9]{9}$/.test(val);
    which === 'signup' ? setPhoneError(!ok) : setLoginPhoneError(!ok);
    return ok;
  }

  function sanitizePhone(val: string) {
    return val.replace(/\D/g, '').slice(0, 10);
  }

  // ── Signup send OTP ──
  async function handleSignupSendOtp() {
    setError(null);
    if (!firstName.trim()) { setError('Please enter your first name.'); return; }
    if (email && !validateEmail(email, true)) return;
    if (!validatePhone(phone, 'signup', true)) return;

    setIsLoading(true);
    try {
      const result = await authService.sendPhoneSignupOtp(phone);
      setOtpPhone(result.phone);
      setOtpPurpose('signup');
      setOtpCode(['', '', '', '', '', '']);
      setStep('otpVerify');
      startCountdown();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // ── Login: send OTP or verify ──
  async function handleLoginAction() {
    setError(null);
    if (!loginOtpSent) {
      if (!validatePhone(loginPhone, 'login', true)) return;
      setIsLoading(true);
      try {
        await authService.sendPhoneLoginOtp(loginPhone);
        setOtpPhone(loginPhone);
        setOtpPurpose('login');
        setOtpCode(['', '', '', '', '', '']);
        setStep('otpVerify');
        startCountdown();
        setLoginOtpSent(true);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Could not send OTP.';
        setError(msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('no account')
          ? 'No account found with this number. Please create one first.'
          : msg);
      } finally {
        setIsLoading(false);
      }
    }
  }

  // ── Verify OTP (both signup & login) ──
  async function handleVerifyOtp() {
    setError(null);
    const token = otpCode.join('');
    if (token.length !== 6) { setError('Please enter the full 6-digit code.'); return; }
    setIsLoading(true);
    try {
      await authService.verifyPhoneOtp(
        otpPurpose,
        otpPhone,
        token,
        otpPurpose === 'signup' ? { firstName, lastName } : undefined
      );
      localStorage.setItem('rwj_has_logged_in', '1');
      sessionStorage.setItem('rwj_login_success', '1');
      closeAuthModal();
      router.replace('/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid or expired code.';
      setError(msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid')
        ? 'That code is invalid or has expired. Please request a new one.'
        : msg);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    if (!canResend) return;
    setError(null);
    setIsLoading(true);
    try {
      if (otpPurpose === 'signup') {
        await authService.sendPhoneSignupOtp(otpPhone);
      } else {
        await authService.sendPhoneLoginOtp(otpPhone);
      }
      startCountdown();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend OTP.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start Google login.');
    }
  }

  // OTP box input handler
  const otpBoxChange = useCallback((val: string, idx: number) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    setOtpCode(prev => {
      const next = [...prev];
      next[idx] = digit;
      return next;
    });
    if (digit && idx < 5) {
      const nextEl = document.getElementById(`auth-otp-${idx + 1}`);
      if (nextEl) (nextEl as HTMLInputElement).focus();
    }
  }, []);

  const otpBoxKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace' && !otpCode[idx] && idx > 0) {
      const prev = document.getElementById(`auth-otp-${idx - 1}`);
      if (prev) (prev as HTMLInputElement).focus();
    }
  }, [otpCode]);

  const otpBoxPaste = useCallback((e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      e.preventDefault();
      setOtpCode(pasted.split(''));
      const last = document.getElementById('auth-otp-5');
      if (last) (last as HTMLInputElement).focus();
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(5,11,17,0.72)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        animation: 'rwj-fadeIn 0.22s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) closeAuthModal(); }}
    >
      <style>{`
        @keyframes rwj-fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes rwj-slideUp {
          from { opacity:0; transform:translateY(20px) scale(0.98); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        .rwj-input {
          width:100%; padding:10px 12px 10px 36px;
          border:1.5px solid #E5E3DE; border-radius:8px;
          background:#FAFAF8; font-family:'Outfit',sans-serif;
          font-size:13.5px; color:#1A1A1A; outline:none;
          transition:border-color 0.18s,box-shadow 0.18s;
          box-sizing:border-box;
        }
        .rwj-input:focus {
          border-color:#C9933A;
          box-shadow:0 0 0 3px rgba(201,147,58,0.14);
          background:#fff;
        }
        .rwj-input.invalid { border-color:#D14343; }
        .rwj-input.invalid:focus { box-shadow:0 0 0 3px rgba(209,67,67,0.12); }
        .rwj-input::placeholder { color:#b0aba4; }
        .rwj-otp-input {
          width:46px; height:52px; text-align:center; font-size:20px;
          font-weight:600; border:1.5px solid #E5E3DE; border-radius:8px;
          background:#FAFAF8; outline:none; font-family:'Outfit',sans-serif;
          box-sizing:border-box;
        }
        .rwj-otp-input:focus { border-color:#C9933A; box-shadow:0 0 0 3px rgba(201,147,58,0.14); }
        .rwj-tab-btn {
          padding:8px 28px; border:none; background:transparent;
          border-radius:60px; font-family:'Outfit',sans-serif;
          font-size:14px; font-weight:600; color:#6B7280; cursor:pointer;
          transition:all 0.18s; white-space:nowrap;
        }
        .rwj-tab-btn.active {
          background:#fff; color:#1A1A1A;
          box-shadow:0 2px 8px rgba(0,0,0,0.05);
        }
        .rwj-cta {
          width:100%; padding:13px; background:#0B1720; color:#fff;
          border:none; border-radius:8px; font-family:'Outfit',sans-serif;
          font-size:14.5px; font-weight:600; cursor:pointer; letter-spacing:0.01em;
          transition:all 0.18s;
        }
        .rwj-cta:hover:not(:disabled) { background:#132130; transform:translateY(-1px); box-shadow:0 4px 12px rgba(11,23,32,0.3); }
        .rwj-cta:disabled { opacity:0.55; cursor:not-allowed; }
        .rwj-google-btn {
          display:flex; align-items:center; justify-content:center; gap:10px;
          width:100%; padding:11px 16px; border:1.5px solid #E5E3DE;
          border-radius:8px; background:#fff; font-family:'Outfit',sans-serif;
          font-size:14px; font-weight:500; color:#1A1A1A; cursor:pointer;
          transition:all 0.18s; margin-bottom:20px;
        }
        .rwj-google-btn:hover { background:#F8F6F1; border-color:#ccc; }
        @media (max-width:640px) {
          .rwj-brand-panel { display:none !important; }
          .rwj-form-panel { padding:26px 20px 22px !important; }
          .rwj-name-row { grid-template-columns:1fr !important; }
          .rwj-modal { max-width:420px !important; }
          .rwj-tab-btn { padding:6px 18px; font-size:13px; }
        }
      `}</style>

      {/* Modal */}
      <div
        className="rwj-modal"
        style={{
          position: 'relative', display: 'flex', width: '100%', maxWidth: 860,
          height: 620, maxHeight: '95vh', borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0,0,0,0.28), 0 8px 20px rgba(0,0,0,0.14)',
          animation: 'rwj-slideUp 0.28s cubic-bezier(0.22,1,0.36,1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gold top bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 10,
          background: 'linear-gradient(90deg,transparent 0%,#C9933A 30%,#DDB978 60%,transparent 100%)' }} />

        {/* ── LEFT BRAND PANEL ── */}
        <div
          className="rwj-brand-panel"
          style={{ flex: '0 0 260px', background: '#0B1720', padding: '32px 26px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            overflow: 'hidden', height: '100%' }}
        >
          <div>
            {/* Logo */}
            <div style={{ marginBottom: 26, marginLeft: -26 }}>
              <Image src="/logo.png" alt="RiseWithJeet" width={216} height={72} style={{ height: 72, width: 'auto', objectFit: 'contain' }} priority />
            </div>

            <div style={{ width: 40, height: 2, background: '#C9933A', marginBottom: 18 }} />
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', color: '#C9933A',
              textTransform: 'uppercase', marginBottom: 12, fontFamily: "'Outfit',sans-serif" }}>
              Trusted by 15,000+ aspirants
            </p>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 23, fontWeight: 600,
              color: '#fff', lineHeight: 1.3, marginBottom: 16 }}>
              Your UPSC journey<br />starts{' '}
              <em style={{ fontStyle: 'italic', color: '#C9933A', fontWeight: 500 }}>right here.</em>
            </h2>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 6 }}>
              {FEATURES.map((f) => (
                <li key={f.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10,
                  fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 1.45, fontFamily: "'Outfit',sans-serif" }}>
                  <span style={{ flexShrink: 0, width: 6, height: 6, borderRadius: '50%',
                    background: '#C9933A', opacity: 0.7, marginTop: 5 }} />
                  <span><strong style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 600, letterSpacing: '0.2px' }}>{f.label}</strong> – {f.desc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Aspirants row */}
          <div style={{ paddingTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex' }}>
                {AVATAR_COLORS.map((bg, i) => (
                  <div key={i} style={{ width: 26, height: 26, borderRadius: '50%', border: '2px solid #0B1720',
                    fontSize: 9, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginLeft: i === 0 ? 0 : -8, color: '#fff', background: bg, flexShrink: 0 }}>
                    {AVATAR_LABELS[i]}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: "'Outfit',sans-serif" }}>
                <strong style={{ color: '#C9933A', fontSize: 12 }}>15,000+</strong> actively preparing
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT FORM PANEL ── */}
        <div
          className="rwj-form-panel"
          style={{ flex: 1, background: '#fff', padding: '32px 36px 28px',
            overflowY: 'auto', position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}
        >
          {/* Close button */}
          <button
            onClick={closeAuthModal}
            aria-label="Close"
            style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32,
              borderRadius: 40, border: '1px solid #E5E3DE', background: 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#6B7280', fontSize: 16, transition: 'all 0.15s', zIndex: 5 }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F8F6F1'; (e.currentTarget as HTMLButtonElement).style.color = '#1A1A1A'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#6B7280'; }}
          >
            ✕
          </button>

          {/* Header */}
          {step === 'form' && (
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 700,
                color: '#1A1A1A', marginBottom: 8, letterSpacing: '-0.3px' }}>
                Welcome to{' '}
                <em style={{ fontStyle: 'normal', color: '#C9933A', fontWeight: 800, fontFamily: "'Cormorant Garamond',serif" }}>
                  RiseWithJeet!
                </em>
              </h1>
              <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.5, maxWidth: '85%',
                margin: '0 auto', fontFamily: "'Outfit',sans-serif" }}>
                Your personalized UPSC prep plan, daily practice, and AI-powered insights are just a step away.
              </p>
            </div>
          )}

          {step === 'otpVerify' && (
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>
                Enter your code
              </h1>
              <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.5, fontFamily: "'Outfit',sans-serif" }}>
                We sent a 6-digit code to <strong>+91 {otpPhone}</strong>
              </p>
            </div>
          )}

          {/* Tab bar */}
          {step === 'form' && (
            <div style={{ display: 'inline-flex', gap: 0, border: '1px solid #E5E3DE',
              borderRadius: 60, padding: 4, margin: '0 auto 28px auto',
              background: '#F8F6F1', width: 'auto' }}>
              <button className={`rwj-tab-btn${tab === 'signup' ? ' active' : ''}`} onClick={() => switchTab('signup')}>
                Create account
              </button>
              <button className={`rwj-tab-btn${tab === 'login' ? ' active' : ''}`} onClick={() => switchTab('login')}>
                Log in
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: 8,
              padding: '10px 14px', marginBottom: 14, color: '#DC2626', fontSize: 13,
              fontFamily: "'Outfit',sans-serif" }}>
              {error}
            </div>
          )}

          {/* ── OTP VERIFY STEP ── */}
          {step === 'otpVerify' && (
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 18, lineHeight: 1.5, fontFamily: "'Outfit',sans-serif" }}>
                We sent a 6-digit code to your mobile. Enter it below to verify.
              </p>

              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, letterSpacing: '0.06em',
                textTransform: 'uppercase', color: '#1A1A1A', marginBottom: 6, fontFamily: "'Outfit',sans-serif" }}>
                Verification code
              </label>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }} onPaste={otpBoxPaste}>
                {otpCode.map((digit, i) => (
                  <input
                    key={i}
                    id={`auth-otp-${i}`}
                    className="rwj-otp-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => otpBoxChange(e.target.value, i)}
                    onKeyDown={(e) => otpBoxKeyDown(e, i)}
                  />
                ))}
              </div>

              <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 20, fontFamily: "'Outfit',sans-serif" }}>
                Didn&apos;t receive?{' '}
                <button
                  onClick={handleResend}
                  disabled={!canResend}
                  style={{ color: canResend ? '#C9933A' : '#b0aba4', background: 'none', border: 'none',
                    cursor: canResend ? 'pointer' : 'default', fontWeight: 600, fontSize: 12, fontFamily: "'Outfit',sans-serif", padding: 0 }}
                >
                  {canResend ? 'Resend' : `Resend in ${countdown}s`}
                </button>
              </p>

              <button className="rwj-cta" onClick={handleVerifyOtp} disabled={isLoading} style={{ marginBottom: 14 }}>
                {isLoading ? 'Verifying...' : 'Verify & continue →'}
              </button>
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <button
                  onClick={() => { setStep('form'); setError(null); setLoginOtpSent(false); }}
                  style={{ color: '#C9933A', fontWeight: 600, background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: 13, fontFamily: "'Outfit',sans-serif" }}
                >
                  ← Change mobile number
                </button>
              </div>
            </div>
          )}

          {/* ── SIGNUP FORM ── */}
          {step === 'form' && tab === 'signup' && (
            <div style={{ flex: 1 }}>
              {/* Google */}
              <button className="rwj-google-btn" onClick={handleGoogle}>
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.909-2.258c-.805.54-1.836.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96l3.007 2.333C4.672 5.163 6.656 3.58 9 3.58z"/>
                </svg>
                Continue with Google
              </button>

              {/* Name row */}
              <div className="rwj-name-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, letterSpacing: '0.06em',
                    textTransform: 'uppercase', color: '#1A1A1A', marginBottom: 6, fontFamily: "'Outfit',sans-serif" }}>
                    First name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6B7280', fontSize: 15, pointerEvents: 'none' }}>👤</span>
                    <input className="rwj-input" type="text" placeholder="Rahul" value={firstName}
                      onChange={e => setFirstName(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, letterSpacing: '0.06em',
                    textTransform: 'uppercase', color: '#1A1A1A', marginBottom: 6, fontFamily: "'Outfit',sans-serif" }}>
                    Last name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6B7280', fontSize: 15, pointerEvents: 'none' }}>👤</span>
                    <input className="rwj-input" type="text" placeholder="Sharma" value={lastName}
                      onChange={e => setLastName(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: '#1A1A1A', marginBottom: 6, fontFamily: "'Outfit',sans-serif" }}>
                  Email address{' '}
                  <span style={{ fontWeight: 400, color: '#6B7280', textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>(optional)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6B7280', fontSize: 15, pointerEvents: 'none' }}>✉</span>
                  <input className={`rwj-input${emailError ? ' invalid' : ''}`} type="email"
                    placeholder="yourname@gmail.com" value={email}
                    onChange={e => { setEmail(e.target.value); validateEmail(e.target.value); }}
                    onBlur={() => validateEmail(email)} />
                </div>
                {emailError && <p style={{ fontSize: 11.5, color: '#D14343', marginTop: 6, fontFamily: "'Outfit',sans-serif" }}>Please enter a valid email address</p>}
              </div>

              {/* Phone */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: '#1A1A1A', marginBottom: 6, fontFamily: "'Outfit',sans-serif" }}>
                  Mobile number
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px',
                    border: '1.5px solid #E5E3DE', borderRadius: 8, background: '#FAFAF8',
                    fontSize: 13.5, color: '#6B7280', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: "'Outfit',sans-serif" }}>
                    📱 +91
                  </div>
                  <input
                    className={`rwj-input${phoneError ? ' invalid' : ''}`}
                    style={{ paddingLeft: 12 }}
                    type="tel" placeholder="98765 43210" maxLength={10} inputMode="numeric"
                    value={phone}
                    onChange={e => { const v = sanitizePhone(e.target.value); setPhone(v); validatePhone(v, 'signup'); }}
                    onBlur={() => validatePhone(phone, 'signup')}
                  />
                </div>
                {phoneError && <p style={{ fontSize: 11.5, color: '#D14343', marginTop: 6, fontFamily: "'Outfit',sans-serif" }}>Please enter a valid 10-digit phone number</p>}
              </div>

              <button className="rwj-cta" onClick={handleSignupSendOtp} disabled={isLoading} style={{ marginBottom: 14 }}>
                {isLoading ? 'Sending OTP...' : 'Send OTP to Verify →'}
              </button>

              <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.55, textAlign: 'center', marginTop: 8, fontFamily: "'Outfit',sans-serif" }}>
                By continuing, you agree to our{' '}
                <Link href="/terms" onClick={closeAuthModal} style={{ color: '#C9933A', textDecoration: 'none' }}>Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" onClick={closeAuthModal} style={{ color: '#C9933A', textDecoration: 'none' }}>Privacy Policy</Link>.
              </p>
            </div>
          )}

          {/* ── LOGIN FORM ── */}
          {step === 'form' && tab === 'login' && (
            <div style={{ flex: 1 }}>
              {/* Google */}
              <button className="rwj-google-btn" onClick={handleGoogle}>
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.909-2.258c-.805.54-1.836.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96l3.007 2.333C4.672 5.163 6.656 3.58 9 3.58z"/>
                </svg>
                Continue with Google
              </button>

              {/* Phone OTP login */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: '#1A1A1A', marginBottom: 6, fontFamily: "'Outfit',sans-serif" }}>
                  Mobile number
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px',
                    border: '1.5px solid #E5E3DE', borderRadius: 8, background: '#FAFAF8',
                    fontSize: 13.5, color: '#6B7280', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: "'Outfit',sans-serif" }}>
                    📱 +91
                  </div>
                  <input
                    className={`rwj-input${loginPhoneError ? ' invalid' : ''}`}
                    style={{ paddingLeft: 12 }}
                    type="tel" placeholder="98765 43210" maxLength={10} inputMode="numeric"
                    value={loginPhone}
                    onChange={e => { const v = sanitizePhone(e.target.value); setLoginPhone(v); validatePhone(v, 'login'); }}
                    onBlur={() => validatePhone(loginPhone, 'login')}
                  />
                </div>
                {loginPhoneError && <p style={{ fontSize: 11.5, color: '#D14343', marginTop: 6, fontFamily: "'Outfit',sans-serif" }}>Please enter a valid 10-digit phone number</p>}
              </div>

              <button className="rwj-cta" onClick={handleLoginAction} disabled={isLoading} style={{ marginBottom: 14 }}>
                {isLoading ? 'Sending OTP...' : 'Send OTP →'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 4 }}>
                <button
                  onClick={() => { closeAuthModal(); router.push('/login?tab=login'); }}
                  style={{ color: '#C9933A', fontWeight: 600, background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: 12.5, fontFamily: "'Outfit',sans-serif" }}
                >
                  Login with email / password
                </button>
                <span style={{ color: '#E5E3DE' }}>|</span>
                <button
                  onClick={() => { closeAuthModal(); router.push('/login'); }}
                  style={{ color: '#C9933A', fontWeight: 600, background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: 12.5, fontFamily: "'Outfit',sans-serif" }}
                >
                  Trouble logging in?
                </button>
              </div>

              <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.55, textAlign: 'center', marginTop: 16, fontFamily: "'Outfit',sans-serif" }}>
                By continuing, you agree to our{' '}
                <Link href="/terms" onClick={closeAuthModal} style={{ color: '#C9933A', textDecoration: 'none' }}>Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" onClick={closeAuthModal} style={{ color: '#C9933A', textDecoration: 'none' }}>Privacy Policy</Link>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
