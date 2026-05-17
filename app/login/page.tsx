'use client';
import { useState, useEffect, Suspense, type CSSProperties } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/lib/auth';

const featureCards = [
  { label: 'Daily Mains Challenge', icon: '/sidebar-daily-answer-new.png' },
  { label: '1-on-1 Mentorship',     icon: '/sidebar-mentorship-new.png' },
  { label: 'Study Planner',         icon: '/icon-study-planner.png' },
  { label: 'Mock Tests',            icon: '/sidebar-mock-tests-new.png' },
  { label: 'Performance Analytics', icon: '/icon-analytics.png' },
  { label: 'Study Group Forum',     icon: '/icon-study-group-forum.png' },
];

const avatarColors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, signup, loginWithGoogle, isAuthenticated, isLoading: authLoading, user } = useAuth();

  // Get initial tab from URL query param
  const tabParam = searchParams.get('tab');
  const initialTab = tabParam === 'signup' ? 'signup' : 'login';

  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'success' | 'forgot' | 'resetSent' | 'otpRequest' | 'otpVerify'>(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSentEmail, setResetSentEmail] = useState('');

  // OTP login state
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);

  // Signup form state
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const [dashboardCountdown, setDashboardCountdown] = useState(10);

  const getEmailSuggestions = (val: string): string[] => {
    if (!val) return [];
    const atIdx = val.indexOf('@');
    if (atIdx === -1) return ['@gmail.com', '@yahoo.com'].map(d => val + d);
    const local = val.slice(0, atIdx);
    const typed = val.slice(atIdx + 1);
    const providers = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    return providers.filter(p => p.startsWith(typed)).map(p => `${local}@${p}`);
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push(user?.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [isAuthenticated, authLoading, user, router]);

  // Update tab when URL changes
  useEffect(() => {
    if (tabParam === 'signup') {
      setActiveTab('signup');
    } else if (tabParam === 'login') {
      setActiveTab('login');
    }
  }, [tabParam]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setShowWelcomeBack(localStorage.getItem('rwj_has_logged_in') === '1');
  }, []);

  // Auto-redirect countdown on success screen
  useEffect(() => {
    if (activeTab !== 'success') { setDashboardCountdown(10); return; }
    const interval = setInterval(() => {
      setDashboardCountdown(c => {
        if (c <= 1) { clearInterval(interval); goToDashboard(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login({ email: loginEmail, password: loginPassword });
      const isReturningLogin = localStorage.getItem('rwj_has_logged_in') === '1';
      sessionStorage.setItem('rwj_login_returning', isReturningLogin ? '1' : '0');
      localStorage.setItem('rwj_has_logged_in', '1');
      sessionStorage.setItem('rwj_login_success', '1');
      // Client-side nav preserves the AuthContext so the dashboard sees
      // isAuthenticated:true immediately — no full-page reload race condition.
      router.replace('/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please try again.';
      if (msg.toLowerCase().includes('invalid login') || msg.toLowerCase().includes('invalid credentials') || msg.toLowerCase().includes('wrong password')) {
        setError('Incorrect email or password. Please try again.');
      } else if (msg.toLowerCase().includes('email not confirmed') || msg.toLowerCase().includes('not confirmed')) {
        setError('Please verify your email first. Check your inbox for a confirmation link.');
      } else if (msg.toLowerCase().includes('rate limit')) {
        setError('Too many login attempts. Please wait a few minutes and try again.');
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await signup({
        email: signupEmail,
        password: signupPassword,
        firstName: signupFirstName,
        lastName: signupLastName,
        phone: signupPhone || undefined,
      });
      // Mark a fresh login so the onboarding modal triggers on dashboard
      sessionStorage.setItem('rwj_login_success', '1');
      setActiveTab('success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Signup failed. Please try again.';
      if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('email rate')) {
        setError('Too many signup attempts. Please wait a few minutes and try again, or use Google sign-up.');
      } else if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        setError('This email is already registered. Please log in instead.');
        setActiveTab('login');
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setError(null);
      await loginWithGoogle();
      // Browser redirects to Google — execution stops here
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize Google login');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetLoading(true);

    try {
      await authService.resetPassword(forgotEmail);
      setResetSentEmail(forgotEmail);
      setActiveTab('resetSent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset link. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOtpLoading(true);
    try {
      await authService.sendOtp(otpEmail);
      setOtpCode(['', '', '', '', '', '']);
      setActiveTab('otpVerify');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not send OTP. Please try again.';
      if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('signups not allowed')) {
        setError('No account found with this email. Please sign up first.');
      } else if (msg.toLowerCase().includes('rate limit')) {
        setError('Too many OTP requests. Please wait a minute and try again.');
      } else {
        setError(msg);
      }
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const token = otpCode.join('');
    if (token.length !== 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    setOtpLoading(true);
    try {
      await authService.verifyOtp(otpEmail, token);
      localStorage.setItem('rwj_has_logged_in', '1');
      sessionStorage.setItem('rwj_login_success', '1');
      router.replace('/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid or expired code.';
      setError(msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid')
        ? 'That code is invalid or has expired. Please request a new one.'
        : msg);
    } finally {
      setOtpLoading(false);
    }
  };

  const goToDashboard = () => {
    if (typeof window !== 'undefined') {
      window.location.replace(user?.role === 'admin' ? '/admin' : '/dashboard');
      return;
    }
    router.replace(user?.role === 'admin' ? '/admin' : '/dashboard');
  };

  return (
    <div className="flex w-full min-h-screen" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Inter:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        .success-burst {
          position: absolute;
          left: 50%;
          top: 44px;
          width: 170px;
          height: 110px;
          transform: translateX(-50%);
          pointer-events: none;
        }
        .success-burst span {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 8px;
          height: 18px;
          border-radius: 999px;
          background: var(--burst-color);
          transform: translate(-50%, -50%) rotate(var(--burst-rotate)) translateY(0);
          animation: burst-pop 900ms ease-out both;
          animation-delay: var(--burst-delay);
        }
        @keyframes burst-pop {
          0% { opacity: 0; transform: translate(-50%, -50%) rotate(var(--burst-rotate)) translateY(0) scale(0.2); }
          18% { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, -50%) rotate(var(--burst-rotate)) translateY(-58px) scale(1); }
        }
      ` }} />
      {/* ── LEFT PANEL ── */}
      <div
        className="relative flex-shrink-0"
        style={{
          width: 478,
          height: '100vh',
          overflow: 'hidden',
          background: '#0F1C2E',
        }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.1,
            backgroundImage:
              'linear-gradient(180deg, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Logo / Branding — absolutely positioned */}
        <div
          className="relative z-10"
          style={{ position: 'absolute', top: 24, left: 26 }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Image src="/footer-logo-new.png" alt="RiseWithJeet" width={320} height={64} style={{ height: 44, width: 'auto', objectFit: 'contain' }} priority />
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10" style={{ width: 382, marginTop: 96, marginLeft: 48, paddingBottom: 20 }}>

          {/* Trusted by badge */}
          <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
            <div style={{ width: 48, height: 3, background: '#E8B84B', borderRadius: 2, flexShrink: 0 }} />
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
                fontSize: 11,
                lineHeight: '16px',
                letterSpacing: '2.5px',
                textTransform: 'uppercase',
                color: '#E8B84B',
              }}
            >
              Trusted by 15,000+ Aspirants
            </span>
          </div>

          {/* Title */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 38, lineHeight: '44px', letterSpacing: '-1px', color: '#FFFFFF' }}>
              Your UPSC journey starts{' '}
              <span style={{ fontStyle: 'italic', color: '#E8B84B' }}>right here.</span>
            </div>
          </div>

          {/* Subtitle */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 400, fontSize: 13, lineHeight: '20px', color: '#99A1AF' }}>
              AI-powered learning, daily MCQs, mains evaluation, mentorship &amp; smart revision — all under one roof.
            </div>
          </div>

          {/* Feature cards grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              marginBottom: 20,
            }}
          >
            {featureCards.map((card) => (
              <div
                key={card.label}
                style={{
                  background: '#1A2738',
                  borderRadius: 10,
                  borderTop: '0.8px solid #364153',
                  padding: '12px',
                  minHeight: 76,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: '#2A3847',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Image src={card.icon} alt={card.label} width={24} height={24} style={{ objectFit: 'contain' }} />
                </div>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: 12, lineHeight: '18px', color: '#FFFFFF' }}>
                  {card.label}
                </span>
              </div>
            ))}
          </div>

          {/* Avatars + count */}
          <div className="flex items-center gap-3">
            <div className="flex">
              {avatarColors.map((color, i) => (
                <div
                  key={i}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: color,
                    border: '2px solid #0F1C2E',
                    marginLeft: i === 0 ? 0 : -8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 600,
                    color: '#fff',
                  }}
                >
                  {i < 4 ? ['AK', 'PS', 'RV', 'MF'][i] : '+14k'}
                </div>
              ))}
            </div>
            <div>
              <span
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  color: '#E8B84B',
                }}
              >
                15,000+{' '}
              </span>
              <span
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 400,
                  fontSize: 12,
                  color: '#99A1AF',
                }}
              >
                Aspirants
              </span>
              <div
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 400,
                  fontSize: 11,
                  color: '#99A1AF',
                }}
              >
                actively preparing on this platform
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div
        className="flex-1 flex flex-col items-center"
        style={{ background: '#F9FAFB', paddingTop: 72, paddingBottom: 72 }}
      >
        {/* Single centered container for tab + form */}
        <div style={{ width: 448 }}>

        {/* Tab row */}
        <div
          style={{ display: 'none' }}
        >
          {/* Tab container */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              height: 54,
              borderRadius: 10,
              border: '1px solid #D1D5DC',
              background: '#EFF6FF',
              padding: '4px',
              boxSizing: 'border-box',
            }}
          >
            {/* Log In — active tab */}
            <button
              onClick={() => { setActiveTab('login'); setError(null); }}
              style={{
                flex: 1,
                height: 45.6,
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 600,
                fontSize: 14,
                lineHeight: '20px',
                textAlign: 'center',
                background: activeTab === 'login' ? '#101828' : 'transparent',
                color: activeTab === 'login' ? '#FFFFFF' : '#4A5565',
                border: activeTab === 'login' ? '0.8px solid #101828' : 'none',
                cursor: 'pointer',
                borderRadius: 10,
                boxShadow: activeTab === 'login'
                  ? '0px 1px 3px 0px rgba(0,0,0,0.10), 0px 1px 2px -1px rgba(0,0,0,0.10)'
                  : 'none',
                transition: 'all 0.2s',
              }}
            >
              Log In
            </button>

            {/* Sign Up Free — inactive tab */}
            <button
              onClick={() => { setActiveTab('signup'); setError(null); }}
              style={{
                flex: 1,
                height: 45.6,
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 600,
                fontSize: 14,
                lineHeight: '20px',
                textAlign: 'center',
                background: activeTab === 'signup' ? '#101828' : 'transparent',
                color: activeTab === 'signup' ? '#FFFFFF' : '#4A5565',
                border: activeTab === 'signup' ? '0.8px solid #101828' : 'none',
                cursor: 'pointer',
                borderRadius: 10,
                boxShadow: activeTab === 'signup'
                  ? '0px 1px 3px 0px rgba(0,0,0,0.10), 0px 1px 2px -1px rgba(0,0,0,0.10)'
                  : 'none',
                transition: 'all 0.2s',
              }}
            >
              Sign Up Free
            </button>
          </div>
        </div>

        {/* Form area */}
        <div
          className="flex flex-col"
        >

        {/* Error message */}
        {error && (
          <div
            style={{
              background: '#FEE2E2',
              border: '1px solid #EF4444',
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 16,
              color: '#DC2626',
              fontSize: 14,
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            {error}
          </div>
        )}

        {/* ── SUCCESS SCREEN ── */}
        {activeTab === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <div className="success-burst" aria-hidden="true">
              {[
                ['#F59E0B', '-70deg', '0ms'],
                ['#10B981', '-38deg', '70ms'],
                ['#155DFC', '-10deg', '120ms'],
                ['#EF4444', '18deg', '40ms'],
                ['#D9A84F', '44deg', '100ms'],
                ['#8B5CF6', '72deg', '150ms'],
              ].map(([color, rotate, delay]) => (
                <span key={`${color}-${rotate}`} style={{ '--burst-color': color, '--burst-rotate': rotate, '--burst-delay': delay } as CSSProperties} />
              ))}
            </div>
            {/* Celebration image */}
            <Image src="/success-celebration.png" alt="You're in!" width={100} height={100} style={{ objectFit: 'contain', marginBottom: 16 }} />

            {/* You're in! heading */}
            <h1
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontStyle: 'italic',
                fontSize: 36,
                lineHeight: '40px',
                color: '#0A0A0A',
                textAlign: 'center',
                margin: 0,
                marginBottom: 12,
              }}
            >
              You&apos;re in!
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 400,
                fontSize: 14,
                lineHeight: '22.75px',
                color: '#6A7282',
                textAlign: 'center',
                margin: 0,
                marginBottom: 28,
                maxWidth: 362,
              }}
            >
              Your account is ready. Time to start your UPSC preparation with India&apos;s best AI-powered tools.
            </p>

            {/* What's unlocked card */}
            <div
              style={{
                width: '100%',
                borderRadius: 16,
                background: '#0F1C2E',
                padding: '24px',
                marginBottom: 20,
                boxSizing: 'border-box',
              }}
            >
              {/* Header row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                <Image src="/icon-unlocked.png" alt="" width={16} height={16} style={{ objectFit: 'contain' }} />
                <span
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 600,
                    fontSize: 12,
                    lineHeight: '16px',
                    letterSpacing: '0.6px',
                    textTransform: 'uppercase',
                    color: '#D9A84F',
                  }}
                >
                  What&apos;s unlocked for you
                </span>
              </div>

              {/* Feature list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: '/icon-mentorship.png', text: 'Daily Mains Challenge and Instant Evaluation' },
                  { icon: '/icon-pyq.png', text: '10,000+ PYQ questions' },
                  { icon: '/icon-dashboard.png', text: 'Personal Performance dashboard' },
                  { icon: '/icon-streak.png', text: 'Daily streak, Syllabus and Study Planner tracking' },
                ].map((item) => (
                  <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Image src={item.icon} alt="" width={28} height={28} style={{ objectFit: 'contain', flexShrink: 0 }} />
                    <span
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: 400,
                        fontSize: 14,
                        lineHeight: '20px',
                        color: '#FFFFFF',
                      }}
                    >
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Go to Dashboard button */}
            <button
              onClick={goToDashboard}
              style={{
                width: '100%',
                height: 52,
                borderRadius: 16,
                background: '#10B981',
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 600,
                fontSize: 14,
                lineHeight: '20px',
                color: '#FFFFFF',
                textAlign: 'center',
                boxShadow: '0px 10px 15px -3px rgba(0,0,0,0.10), 0px 4px 6px -4px rgba(0,0,0,0.10)',
              }}
            >
              Go to My Dashboard → {dashboardCountdown > 0 ? `(${dashboardCountdown}s)` : ''}
            </button>
          </div>
        )}

        {/* ── SIGNUP FORM ── */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignup}>
            {/* Heading */}
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 700,
                fontStyle: 'italic',
                fontSize: 36,
                lineHeight: '42px',
                color: '#0A0A0A',
                margin: 0,
                marginBottom: 8,
                letterSpacing: '-1px',
              }}
            >
              Welcome to <span style={{ color: '#D9A84F' }}>RiseWithJeet!</span>
            </h1>
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 400,
                fontSize: 14,
                lineHeight: '20px',
                color: '#9CA3AF',
                margin: 0,
                marginBottom: 20,
              }}
            >
              Create your free account and start your preparation with structured planning, and AI-powered insights, everything serious aspirants need, in one place.
            </p>

            {/* Sign up with Google */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              style={{
                width: '100%',
                height: 45.6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderRadius: 14,
                border: '0.8px solid #D1D5DC',
                background: '#FFFFFF',
                boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.10), 0px 1px 2px -1px rgba(0,0,0,0.10)',
                cursor: 'pointer',
                marginBottom: 16,
              }}
            >
              <Image src="/icon-google.png" alt="" width={20} height={20} style={{ objectFit: 'contain' }} />
              <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: 14, lineHeight: '20px', color: '#0A0A0A' }}>
                Sign up with Google
              </span>
            </button>

            {/* or create with email divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: '#D1D5DC' }} />
              <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 400, fontSize: 12, lineHeight: '16px', color: '#99A1AF', whiteSpace: 'nowrap' }}>
                or create with email
              </span>
              <div style={{ flex: 1, height: 1, background: '#D1D5DC' }} />
            </div>

            {/* First Name + Last Name row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              {/* First Name */}
              <div>
                <label style={{ display: 'block', fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: 12, lineHeight: '16px', letterSpacing: '0.3px', textTransform: 'uppercase', color: '#1E2939', marginBottom: 6 }}>
                  First Name
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="5" r="3" stroke="#99A1AF" strokeWidth="1.2" fill="none"/><path d="M1 13c0-3 2.5-5 6-5s6 2 6 5" stroke="#99A1AF" strokeWidth="1.2" strokeLinecap="round" fill="none"/></svg>
                  </span>
                  <input 
                    type="text" 
                    placeholder="Rahul" 
                    value={signupFirstName}
                    onChange={(e) => setSignupFirstName(e.target.value)}
                    required
                    style={{ width: '100%', height: 45.6, paddingLeft: 36, paddingRight: 16, borderRadius: 14, border: '0.8px solid #D1D5DC', background: '#FFFFFF', fontFamily: "'Outfit', sans-serif", fontWeight: 400, fontSize: 14, color: '#0A0A0A', outline: 'none', boxSizing: 'border-box' }} 
                  />
                </div>
              </div>
              {/* Last Name */}
              <div>
                <label style={{ display: 'block', fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: 12, lineHeight: '16px', letterSpacing: '0.3px', textTransform: 'uppercase', color: '#1E2939', marginBottom: 6 }}>
                  Last Name
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="5" r="3" stroke="#99A1AF" strokeWidth="1.2" fill="none"/><path d="M1 13c0-3 2.5-5 6-5s6 2 6 5" stroke="#99A1AF" strokeWidth="1.2" strokeLinecap="round" fill="none"/></svg>
                  </span>
                  <input 
                    type="text" 
                    placeholder="Sharma" 
                    value={signupLastName}
                    onChange={(e) => setSignupLastName(e.target.value)}
                    style={{ width: '100%', height: 45.6, paddingLeft: 36, paddingRight: 16, borderRadius: 14, border: '0.8px solid #D1D5DC', background: '#FFFFFF', fontFamily: "'Outfit', sans-serif", fontWeight: 400, fontSize: 14, color: '#0A0A0A', outline: 'none', boxSizing: 'border-box' }} 
                  />
                </div>
              </div>
            </div>

            {/* Email Address */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: 12, lineHeight: '16px', letterSpacing: '0.3px', textTransform: 'uppercase', color: '#1E2939', marginBottom: 6 }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', zIndex: 1 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4l6 5 6-5M2 4h12v8a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" stroke="#99A1AF" strokeWidth="1.2" strokeLinejoin="round" fill="none"/></svg>
                </span>
                <input
                  type="text"
                  autoComplete="email"
                  placeholder="yourname@gmail.com"
                  value={signupEmail}
                  onChange={(e) => { setSignupEmail(e.target.value); setEmailSuggestions(getEmailSuggestions(e.target.value)); }}
                  onBlur={() => setTimeout(() => setEmailSuggestions([]), 150)}
                  required
                  style={{ width: '100%', height: 45.6, paddingLeft: 40, paddingRight: 16, borderRadius: 14, border: '0.8px solid #D1D5DC', background: '#FFFFFF', fontFamily: "'Outfit', sans-serif", fontWeight: 400, fontSize: 14, color: '#0A0A0A', outline: 'none', boxSizing: 'border-box' }}
                />
                {emailSuggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#FFFFFF', border: '1px solid #D1D5DC', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.10)', zIndex: 50, overflow: 'hidden', marginTop: 4 }}>
                    {emailSuggestions.map(s => (
                      <div key={s} onMouseDown={() => { setSignupEmail(s); setEmailSuggestions([]); }}
                        style={{ padding: '10px 16px', fontSize: 14, fontFamily: "'Outfit', sans-serif", color: '#0A0A0A', cursor: 'pointer', borderBottom: '1px solid #F3F4F6' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}
                      >{s}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Number */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: 12, lineHeight: '16px', letterSpacing: '0.3px', textTransform: 'uppercase', color: '#1E2939', marginBottom: 6 }}>
                Mobile Number
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="4" y="1" width="8" height="14" rx="2" stroke="#99A1AF" strokeWidth="1.2" fill="none"/><circle cx="8" cy="12" r="0.8" fill="#99A1AF"/></svg>
                </span>
                <input 
                  type="tel" 
                  placeholder="+91 9876543210" 
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  style={{ width: '100%', height: 45.6, paddingLeft: 40, paddingRight: 16, borderRadius: 14, border: '0.8px solid #D1D5DC', background: '#FFFFFF', fontFamily: "'Outfit', sans-serif", fontWeight: 400, fontSize: 14, color: '#0A0A0A', outline: 'none', boxSizing: 'border-box' }} 
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: 12, lineHeight: '16px', letterSpacing: '0.3px', textTransform: 'uppercase', color: '#1E2939', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
                  <Image src="/icon-lock.png" alt="" width={16} height={16} style={{ objectFit: 'contain' }} />
                </span>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Create a strong password" 
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{ width: '100%', height: 45.6, paddingLeft: 40, paddingRight: 40, borderRadius: 14, border: '0.8px solid #D1D5DC', background: '#FFFFFF', fontFamily: "'Outfit', sans-serif", fontWeight: 400, fontSize: 14, color: '#0A0A0A', outline: 'none', boxSizing: 'border-box' }} 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="#99A1AF" strokeWidth="1.2" fill="none"/><circle cx="8" cy="8" r="2" stroke="#99A1AF" strokeWidth="1.2" fill="none"/></svg>
                </button>
              </div>
            </div>

            {/* Terms checkbox */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14 }}>
              <input 
                type="checkbox" 
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                style={{ marginTop: 3, accentColor: '#155DFC', flexShrink: 0, width: 14, height: 14 }} 
              />
              <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 500, fontSize: 12, lineHeight: '19.5px', color: '#4A5565' }}>
                I agree to the{' '}
                <Link href="/terms" style={{ fontWeight: 600, color: '#155DFC', textDecoration: 'none' }}>Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" style={{ fontWeight: 600, color: '#155DFC', textDecoration: 'none' }}>Privacy Policy.</Link>
                <br />
                I consent to receive UPSC preparation updates from Rise with Jeet.
              </span>
            </div>

            {/* Create Free Account button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                height: 44,
                borderRadius: 9999,
                background: isLoading ? '#6B7280' : '#0F1C2E',
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 600,
                fontSize: 14,
                lineHeight: '20px',
                color: '#FFFFFF',
                textAlign: 'center',
                marginBottom: 12,
              }}
            >
              {isLoading ? 'Creating Account...' : 'Create Free Account →'}
            </button>

            {/* Already have account */}
            <div style={{ textAlign: 'center', fontFamily: "'Outfit', sans-serif", fontWeight: 400, fontSize: 14, lineHeight: '20px', color: '#0A0A0A' }}>
              Already have an account?{' '}
              <button 
                type="button"
                onClick={() => { setActiveTab('login'); setError(null); }} 
                style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: 14, color: '#155DFC', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Login →
              </button>
            </div>
          </form>
        )}

        {/* ── FORGOT PASSWORD FORM ── */}
        {activeTab === 'forgot' && (
          <form onSubmit={handleForgotPassword} style={{ paddingTop: 54 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: '50%',
                  background: '#364153',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 18,
                }}
              >
                <svg width="22" height="22" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M2 4l6 5 6-5M2 4h12v8a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" stroke="#FFFFFF" strokeWidth="1.4" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 30, lineHeight: '36px', letterSpacing: '-0.8px', color: '#101828', margin: 0, marginBottom: 8 }}>
                Forgot your password?
              </h1>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, lineHeight: '18px', color: '#6A7282', margin: '0 auto', maxWidth: 300 }}>
                No worries, enter your email and we&apos;ll send you a secure reset link.
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: 12, lineHeight: '16px', letterSpacing: '0.3px', textTransform: 'uppercase', color: '#364153', marginBottom: 8 }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  autoComplete="email"
                  value={forgotEmail}
                  onChange={(e) => { setForgotEmail(e.target.value); setEmailSuggestions(getEmailSuggestions(e.target.value)); }}
                  onBlur={() => setTimeout(() => setEmailSuggestions([]), 150)}
                  placeholder="yourname@gmail.com"
                  required
                  style={{
                    width: '100%',
                    height: 45.6,
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: '0.8px solid #D1D5DC',
                    background: '#FFFFFF',
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 14,
                    color: '#0A0A0A',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {emailSuggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#FFFFFF', border: '1px solid #D1D5DC', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.10)', zIndex: 50, overflow: 'hidden', marginTop: 4 }}>
                    {emailSuggestions.map(s => (
                      <div key={s} onMouseDown={() => { setForgotEmail(s); setEmailSuggestions([]); }}
                        style={{ padding: '10px 16px', fontSize: 14, fontFamily: "'Outfit', sans-serif", color: '#0A0A0A', cursor: 'pointer', borderBottom: '1px solid #F3F4F6' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}
                      >{s}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={resetLoading}
              style={{
                width: '100%',
                height: 44,
                borderRadius: 10,
                background: resetLoading ? '#9CA3AF' : 'linear-gradient(90deg, #F0B100 0%, #FF6900 100%)',
                border: 'none',
                cursor: resetLoading ? 'not-allowed' : 'pointer',
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: 14,
                lineHeight: '20px',
                color: '#101828',
                marginBottom: 14,
              }}
            >
              {resetLoading ? 'Sending...' : 'Send reset link'}
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('login'); setError(null); }}
              style={{
                width: '100%',
                height: 42,
                borderRadius: 10,
                border: '0.8px solid #D1D5DC',
                background: '#FFFFFF',
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 600,
                fontSize: 13,
                color: '#364153',
                cursor: 'pointer',
                marginBottom: 16,
              }}
            >
              ← Back to login
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M11.667 3.5L5.25 9.917L2.333 7" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, lineHeight: '18px', color: '#6A7282' }}>
                Check your spam folder if you don&apos;t see the email within 2 minutes.
              </span>
            </div>
          </form>
        )}

        {/* ── RESET SENT SCREEN ── */}
        {activeTab === 'resetSent' && (
          <div style={{ paddingTop: 54, textAlign: 'center' }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: '50%',
                background: '#364153',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2 4l6 5 6-5M2 4h12v8a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" stroke="#FFFFFF" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 30, lineHeight: '36px', letterSpacing: '-0.8px', color: '#101828', margin: 0, marginBottom: 8 }}>
              Check your inbox
            </h1>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, lineHeight: '18px', color: '#6A7282', margin: '0 auto 18px', maxWidth: 320 }}>
              We sent a secure reset link to <strong>{resetSentEmail}</strong>.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 18 }}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  defaultValue=""
                  style={{ width: 44, height: 52, borderRadius: 10, border: '1.5px solid #D1D5DC', background: '#FFFFFF', textAlign: 'center', fontSize: 20, fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: '#0A0A0A', outline: 'none', boxSizing: 'border-box' }}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(-1);
                    e.target.value = val;
                    if (val) {
                      const next = document.getElementById(`otp-${i + 1}`);
                      if (next) (next as HTMLInputElement).focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !e.currentTarget.value && i > 0) {
                      const prev = document.getElementById(`otp-${i - 1}`);
                      if (prev) (prev as HTMLInputElement).focus();
                    }
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setError(null); }}
              style={{
                width: '100%',
                height: 44,
                borderRadius: 10,
                background: 'linear-gradient(90deg, #F0B100 0%, #FF6900 100%)',
                border: 'none',
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: 14,
                lineHeight: '20px',
                color: '#101828',
                cursor: 'pointer',
                marginBottom: 14,
              }}
            >
              Back to login
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('forgot'); setForgotEmail(resetSentEmail); }}
              style={{ background: 'none', border: 'none', color: '#155DFC', fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              Didn&apos;t get it? Resend code
            </button>
          </div>
        )}

        {/* ── OTP REQUEST FORM ── */}
        {activeTab === 'otpRequest' && (
          <form onSubmit={handleSendOtp} style={{ paddingTop: 54 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: '50%',
                  background: '#364153',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 18,
                }}
              >
                <svg width="22" height="22" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M2 4l6 5 6-5M2 4h12v8a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" stroke="#FFFFFF" strokeWidth="1.4" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 30, lineHeight: '36px', letterSpacing: '-0.8px', color: '#101828', margin: 0, marginBottom: 8 }}>
                Login with OTP
              </h1>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, lineHeight: '18px', color: '#6A7282', margin: '0 auto', maxWidth: 320 }}>
                Enter your registered email and we&apos;ll send you a 6-digit code to sign in.
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: 12, lineHeight: '16px', letterSpacing: '0.3px', textTransform: 'uppercase', color: '#364153', marginBottom: 8 }}>
                Email Address
              </label>
              <input
                type="email"
                autoComplete="email"
                value={otpEmail}
                onChange={(e) => setOtpEmail(e.target.value)}
                placeholder="yourname@gmail.com"
                required
                style={{
                  width: '100%',
                  height: 45.6,
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: '0.8px solid #D1D5DC',
                  background: '#FFFFFF',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 14,
                  color: '#0A0A0A',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={otpLoading}
              style={{
                width: '100%',
                height: 44,
                borderRadius: 10,
                background: otpLoading ? '#9CA3AF' : 'linear-gradient(90deg, #F0B100 0%, #FF6900 100%)',
                border: 'none',
                cursor: otpLoading ? 'not-allowed' : 'pointer',
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: 14,
                lineHeight: '20px',
                color: '#101828',
                marginBottom: 14,
              }}
            >
              {otpLoading ? 'Sending...' : 'Send OTP'}
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('login'); setError(null); }}
              style={{
                width: '100%',
                height: 42,
                borderRadius: 10,
                border: '0.8px solid #D1D5DC',
                background: '#FFFFFF',
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 600,
                fontSize: 13,
                color: '#364153',
                cursor: 'pointer',
              }}
            >
              ← Back to login
            </button>
          </form>
        )}

        {/* ── OTP VERIFY FORM ── */}
        {activeTab === 'otpVerify' && (
          <form onSubmit={handleVerifyOtp} style={{ paddingTop: 54 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: '50%',
                  background: '#364153',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 18,
                }}
              >
                <svg width="22" height="22" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M2 4l6 5 6-5M2 4h12v8a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" stroke="#FFFFFF" strokeWidth="1.4" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 30, lineHeight: '36px', letterSpacing: '-0.8px', color: '#101828', margin: 0, marginBottom: 8 }}>
                Enter your code
              </h1>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, lineHeight: '18px', color: '#6A7282', margin: '0 auto', maxWidth: 320 }}>
                We sent a 6-digit code to <strong>{otpEmail}</strong>.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
              {otpCode.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-login-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  style={{ width: 44, height: 52, borderRadius: 10, border: '1.5px solid #D1D5DC', background: '#FFFFFF', textAlign: 'center', fontSize: 20, fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: '#0A0A0A', outline: 'none', boxSizing: 'border-box' }}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(-1);
                    const next = [...otpCode];
                    next[i] = val;
                    setOtpCode(next);
                    if (val) {
                      const nextEl = document.getElementById(`otp-login-${i + 1}`);
                      if (nextEl) (nextEl as HTMLInputElement).focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !otpCode[i] && i > 0) {
                      const prev = document.getElementById(`otp-login-${i - 1}`);
                      if (prev) (prev as HTMLInputElement).focus();
                    }
                  }}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                    if (pasted.length === 6) {
                      e.preventDefault();
                      setOtpCode(pasted.split(''));
                      const last = document.getElementById(`otp-login-5`);
                      if (last) (last as HTMLInputElement).focus();
                    }
                  }}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={otpLoading}
              style={{
                width: '100%',
                height: 44,
                borderRadius: 10,
                background: otpLoading ? '#9CA3AF' : 'linear-gradient(90deg, #F0B100 0%, #FF6900 100%)',
                border: 'none',
                cursor: otpLoading ? 'not-allowed' : 'pointer',
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: 14,
                lineHeight: '20px',
                color: '#101828',
                marginBottom: 14,
              }}
            >
              {otpLoading ? 'Verifying...' : 'Verify & Sign In'}
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('otpRequest'); setError(null); }}
              style={{ display: 'block', margin: '0 auto 10px', background: 'none', border: 'none', color: '#155DFC', fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              Didn&apos;t get it? Resend code
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('login'); setError(null); }}
              style={{
                width: '100%',
                height: 42,
                borderRadius: 10,
                border: '0.8px solid #D1D5DC',
                background: '#FFFFFF',
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 600,
                fontSize: 13,
                color: '#364153',
                cursor: 'pointer',
              }}
            >
              ← Back to login
            </button>
          </form>
        )}

        {/* ── LOGIN FORM ── */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin}>
            {/* Heading */}
            <div style={{ marginBottom: 8 }}>
              <h1
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 700,
                  fontStyle: 'italic',
                  fontSize: 42,
                  lineHeight: '46px',
                  color: '#0A0A0A',
                  margin: 0,
                  letterSpacing: '-1.2px',
                }}
              >
                {showWelcomeBack ? (
                  <>
                    Welcome{' '}
                    <span style={{ color: '#D97706', fontStyle: 'italic', fontWeight: 700 }}>back</span>{' '}
                  </>
                ) : (
                  <>
                    Sign in to{' '}
                    <span style={{ color: '#D9A84F', fontStyle: 'italic', fontWeight: 700 }}>RiseWithJeet</span>{' '}
                  </>
                )}
              </h1>
            </div>
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 400,
                fontSize: 14,
                lineHeight: '20px',
                color: '#6A7282',
                marginBottom: 24,
                marginTop: 0,
              }}
            >
              Sign in to <strong>simplify</strong> your UPSC preparation
            </p>

            {/* Continue with Google */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              style={{
                width: '100%',
                height: 45.6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderRadius: 14,
                border: '0.8px solid #D1D5DC',
                background: '#FFFFFF',
                boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.10), 0px 1px 2px -1px rgba(0,0,0,0.10)',
                cursor: 'pointer',
                marginBottom: 20,
              }}
            >
              {/* Google icon */}
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.78h5.4a4.6 4.6 0 01-2 3.02v2.5h3.24C18.36 15.9 19.6 13.3 19.6 10.23z" fill="#4285F4" />
                <path d="M10 20c2.7 0 4.97-.9 6.62-2.44l-3.24-2.5c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H1.07v2.58A9.99 9.99 0 0010 20z" fill="#34A853" />
                <path d="M4.41 11.9A6.01 6.01 0 014.1 10c0-.66.12-1.3.31-1.9V5.52H1.07A9.99 9.99 0 000 10c0 1.61.38 3.14 1.07 4.48l3.34-2.58z" fill="#FBBC05" />
                <path d="M10 3.98c1.47 0 2.78.5 3.82 1.5l2.87-2.87C14.96.9 12.7 0 10 0A9.99 9.99 0 001.07 5.52l3.34 2.58C5.2 5.74 7.4 3.98 10 3.98z" fill="#EA4335" />
              </svg>
              <span
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 600,
                  fontSize: 14,
                  lineHeight: '20px',
                  color: '#0A0A0A',
                }}
              >
                Continue with Google
              </span>
            </button>

            {/* OR WITH EMAIL divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                marginBottom: 20,
              }}
            >
              <div style={{ flex: 1, height: 1, background: '#D1D5DC' }} />
              <span
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 400,
                  fontSize: 12,
                  lineHeight: '16px',
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  color: '#99A1AF',
                  whiteSpace: 'nowrap',
                }}
              >
                Or with email
              </span>
              <div style={{ flex: 1, height: 1, background: '#D1D5DC' }} />
            </div>

            {/* Email field */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 600,
                  fontSize: 12,
                  lineHeight: '16px',
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                  color: '#364153',
                  marginBottom: 6,
                }}
              >
                Email Address
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: 14, color: '#99A1AF', display: 'flex', alignItems: 'center', zIndex: 1 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 4l6 5 6-5M2 4h12v8a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" stroke="#99A1AF" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
                  </svg>
                </span>
                <input
                  type="text"
                  autoComplete="email"
                  placeholder="yourname@gmail.com"
                  value={loginEmail}
                  onChange={(e) => { setLoginEmail(e.target.value); setEmailSuggestions(getEmailSuggestions(e.target.value)); }}
                  onBlur={() => setTimeout(() => setEmailSuggestions([]), 150)}
                  required
                  style={{ width: '100%', height: 45.6, paddingTop: 12, paddingBottom: 12, paddingLeft: 40, paddingRight: 16, borderRadius: 10, border: '0.8px solid #D1D5DC', background: '#FFFFFF', fontFamily: "'Outfit', sans-serif", fontWeight: 400, fontSize: 14, color: '#0A0A0A', outline: 'none', boxSizing: 'border-box' }}
                />
                {emailSuggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#FFFFFF', border: '1px solid #D1D5DC', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.10)', zIndex: 50, overflow: 'hidden', marginTop: 4 }}>
                    {emailSuggestions.map(s => (
                      <div key={s} onMouseDown={() => { setLoginEmail(s); setEmailSuggestions([]); }}
                        style={{ padding: '10px 16px', fontSize: 14, fontFamily: "'Outfit', sans-serif", color: '#0A0A0A', cursor: 'pointer', borderBottom: '1px solid #F3F4F6' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}
                      >{s}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Password field */}
            <div style={{ marginBottom: 8 }}>
              <label
                style={{
                  display: 'block',
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 600,
                  fontSize: 12,
                  lineHeight: '16px',
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                  color: '#364153',
                  marginBottom: 6,
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 14,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Image src="/icon-lock.png" alt="" width={16} height={16} style={{ objectFit: 'contain' }} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    height: 45.6,
                    paddingTop: 12,
                    paddingBottom: 12,
                    paddingLeft: 40,
                    paddingRight: 40,
                    borderRadius: 10,
                    border: '0.8px solid #D1D5DC',
                    background: '#FFFFFF',
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 400,
                    fontSize: 14,
                    color: '#0A0A0A',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 14,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#99A1AF',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                  }}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="#99A1AF" strokeWidth="1.2" fill="none" />
                      <circle cx="8" cy="8" r="2" stroke="#99A1AF" strokeWidth="1.2" fill="none" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 2l12 12M6.5 6.6a2 2 0 002.8 2.8M4.2 4.3C2.8 5.3 2 7 2 8s2.5 5 6 5c1.3 0 2.5-.4 3.5-1M6 3.2C6.6 3 7.3 3 8 3c3.5 0 6 3 6 5 0 .9-.4 1.8-1 2.6" stroke="#99A1AF" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div style={{ textAlign: 'right', marginBottom: 20 }}>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(loginEmail);
                  setError(null);
                  setActiveTab('forgot');
                }}
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 600,
                  fontSize: 12,
                  lineHeight: '16px',
                  color: '#155DFC',
                  textDecoration: 'none',
                  border: 'none',
                  background: 'none',
                  padding: 0,
                  cursor: 'pointer',
                }}
              >
                Forgot password?
              </button>
            </div>

            {/* Log In button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                height: 44,
                borderRadius: 10,
                background: isLoading ? '#6B7280' : '#0F1C2E',
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 600,
                fontSize: 14,
                lineHeight: '20px',
                color: '#FFFFFF',
                marginBottom: 14,
              }}
            >
              {isLoading ? 'Logging in...' : 'Log In to My Account'}
              {!isLoading && <Image src="/icon-login-arrow.png" alt="" width={18} height={18} style={{ objectFit: 'contain' }} />}
            </button>

            {/* New Here — theme CTA button */}
            <button
              type="button"
              onClick={() => { setActiveTab('signup'); setError(null); }}
              style={{
                width: '100%',
                height: 44,
                borderRadius: 14,
                background: '#F3A312',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 14,
                boxShadow: '0 10px 24px -18px rgba(243,163,18,0.9)',
              }}
            >
              <Image src="/icon-sparkle.png" alt="" width={20} height={20} style={{ objectFit: 'contain' }} />
              <span
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  lineHeight: '28px',
                  letterSpacing: 0,
                  textAlign: 'center',
                  color: '#101828',
                }}
              >
                New here, create a free account
              </span>
            </button>

            {/* Login with OTP button — no background */}
            <button
              type="button"
              onClick={() => {
                setOtpEmail(loginEmail);
                setError(null);
                setActiveTab('otpRequest');
              }}
              style={{
                width: '100%',
                height: 44,
                borderRadius: 14,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 600,
                fontSize: 14,
                lineHeight: '20px',
                color: '#4C6FFF',
              }}
            >
              <Image src="/icon-otp.png" alt="" width={18} height={18} style={{ objectFit: 'contain' }} />
              Login with OTP Instead
              <Image src="/icon-login-arrow.png" alt="" width={18} height={18} style={{ objectFit: 'contain', filter: 'brightness(0) saturate(100%) invert(27%) sepia(97%) saturate(2500%) hue-rotate(217deg) brightness(102%)' }} />
            </button>
          </form>
        )}
        </div>
        </div>
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function LoginPageFallback() {
  return (
    <div className="flex w-full min-h-screen items-center justify-center" style={{ background: '#F9FAFB' }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

// Export with Suspense wrapper
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
