'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import '@/styles/landing.css';

const AI_SLIDES = [
  { title: 'Mains Evaluator — AI Mode', iconSrc: '/emoji-2.png', iconBg: 'rgba(232,184,75,0.14)', desc: 'Upload your handwritten or typed answers and receive structured feedback, marks, and personalized improvement tips. Our UPSC-examiner style analysis is delivered in under 60 seconds.' },
  { title: 'Jeet AI Assistant', iconSrc: '/emoji-3.png', iconBg: 'rgba(6,182,212,0.14)', desc: 'Get instant, precise answers for all your UPSC queries, covering everything from syllabus details and current affairs context to answer structuring and general doubt resolution.' },
  { title: 'Adaptive Mock Test Platform', iconSrc: '/emoji-4.png', iconBg: 'rgba(139,92,246,0.14)', desc: 'Personalised mock tests targeting your weakest areas, ensuring every session moves the needle towards your goal.' },
  { title: 'Current Affairs Digest', iconSrc: '/emoji-5.png', iconBg: 'rgba(16,185,129,0.14)', desc: 'Our platform instantly connects daily news articles with the relevant UPSC syllabus. For each article, we provide a detailed summary, related practice MCQs and Mains examination questions.' },
];

export default function LandingPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  // Auth redirect
  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      router.replace(user?.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Scroll reveal
  useEffect(() => {
    const revealEls = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.08 });
    revealEls.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Hero canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    function resize() { canvas!.width = canvas!.offsetWidth; canvas!.height = canvas!.offsetHeight; }
    function drawHero() {
      const W = canvas!.width, H = canvas!.height;
      ctx!.clearRect(0, 0, W, H);
      ctx!.fillStyle = '#060C1C';
      ctx!.fillRect(0, 0, W, H);
      const tl = ctx!.createRadialGradient(0, 0, 0, 0, 0, Math.max(W, H) * 0.50);
      tl.addColorStop(0, 'rgba(55,53,51,0.62)');
      tl.addColorStop(0.26, 'rgba(55,53,51,0.30)');
      tl.addColorStop(1, 'rgba(6,12,28,0)');
      ctx!.fillStyle = tl;
      ctx!.fillRect(0, 0, W, H);
    }
    resize(); drawHero();
    const onResize = () => { resize(); drawHero(); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // AI auto-switcher
  useEffect(() => {
    const timer = setInterval(() => setActiveSlide(p => (p + 1) % 4), 4000);
    return () => clearInterval(timer);
  }, []);

  // Nav scroll tint
  useEffect(() => {
    const nav = document.getElementById('lp-main-nav');
    if (!nav) return;
    const onScroll = () => { nav.style.background = window.scrollY > 60 ? 'rgba(7,14,30,0.98)' : 'rgba(13,25,49,0.92)'; };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMobileNav = useCallback(() => {
    setMobileNavOpen(false);
    document.body.style.overflow = '';
  }, []);

  const go = useCallback((path: string) => { router.push(path); closeMobileNav(); }, [router, closeMobileNav]);

  if (isLoading || isAuthenticated) {
    return (
      <div style={{ minHeight: '100dvh', background: '#FAFBFE', color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: '#F4F6FA', color: '#0B1D3A', overflowX: 'hidden', minHeight: '100%' }}>

      {/* ── NAV ── */}
      <nav className="landing-nav" id="lp-main-nav">
        <Link href="/" className="logo">
          <Image src="/logo...png" alt="RiseWithJeet" width={120} height={62} style={{ height: '62px', width: 'auto', objectFit: 'contain' }} />
        </Link>
        <ul className="nav-links">
          <li><a href="#modules">Modules</a></li>
          <li><a href="#ai">Jeet AI</a></li>
          <li><a href="#analytics">Analytics</a></li>
          <li><a href="#community">Community</a></li>
        </ul>
        <div className="nav-btns">
          <button className="btn-nav-ghost" onClick={() => go('/login?tab=login')}>Login</button>
          <button className="btn-nav-gold" onClick={() => go('/login?tab=signup')}>Start Free →</button>
        </div>
        <button
          className={`nav-hamburger${mobileNavOpen ? ' open' : ''}`}
          aria-label="Open menu"
          onClick={() => {
            const next = !mobileNavOpen;
            setMobileNavOpen(next);
            document.body.style.overflow = next ? 'hidden' : '';
          }}
        >
          <span /><span /><span />
        </button>
      </nav>

      {/* ── MOBILE NAV ── */}
      <div className={`mobile-nav${mobileNavOpen ? ' open' : ''}`}>
        <a href="#modules" onClick={closeMobileNav}>Modules</a>
        <a href="#ai" onClick={closeMobileNav}>Jeet AI</a>
        <a href="#analytics" onClick={closeMobileNav}>Analytics</a>
        <a href="#community" onClick={closeMobileNav}>Community</a>
        <div className="mobile-nav-btns">
          <button className="btn-nav-ghost" onClick={() => go('/login?tab=login')}>Login</button>
          <button className="btn-nav-gold" onClick={() => go('/login?tab=signup')}>Start Free →</button>
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="hero">
        <canvas id="heroCanvas" ref={canvasRef} />
        <div className="hero-grid-marks">
          {[
            { top: '18%', left: '8%' }, { top: '22%', left: '14%' }, { top: '36%', left: '5%' },
            { top: '52%', left: '11%' }, { top: '68%', left: '7%' }, { top: '76%', left: '16%' },
            { top: '18%', right: '8%' }, { top: '28%', right: '14%' }, { top: '44%', right: '6%' },
            { top: '60%', right: '11%' }, { top: '72%', right: '7%' }, { top: '14%', left: '28%' },
            { top: '80%', right: '22%' }, { top: '85%', left: '32%' },
          ].map((pos, i) => <div key={i} className="hgm" style={pos} />)}
        </div>

        <div className="hero-badge" style={{ position: 'relative', zIndex: 2, display: 'inline-flex' }}>
          <span className="badge-star">✦</span> India&apos;s #1 AI-Powered UPSC Platform
        </div>

        <h1>
          <span className="line1">Everything you need to crack UPSC,</span>
          <span className="line2"><span className="gold-word">Simplified</span></span>
        </h1>

        <p className="hero-sub">
          Trusted by 15,000+ aspirants. AI-powered learning, daily MCQs, instant mains evaluation, expert mentorship &amp; smart revision — all under one roof.
        </p>

        <div className="hero-ctas">
          <button className="cta-primary" onClick={() => go('/login?tab=signup')}>Start Your Free Trial →</button>
          <button className="cta-secondary" onClick={() => go('/dashboard')}>▶&nbsp;&nbsp;Watch Platform Demo</button>
        </div>

        <div className="hero-stats">
          {[
            { val: '50K+', label: 'Active Aspirants' },
            { val: '10K+', label: 'MCQ Library' },
            { val: '95%', label: 'Prelims Accuracy' },
            { val: '500+', label: 'Video Hours' },
          ].map(s => (
            <div key={s.label} className="hstat">
              <span className="hstat-val">{s.val}</span>
              <div className="hstat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MODULES ── */}
      <section className="modules-section" id="modules">
        <div className="modules-header reveal">
          <div className="section-eyebrow eyebrow-dark">Core Modules</div>
          <h2 className="section-h2-dark">Your Complete UPSC<br />Preparation Ecosystem</h2>
          <p className="section-p-dark" style={{ maxWidth: 500, margin: '16px auto 0' }}>Every tool you need in your preparation, thoughtfully built, to take you from aspirant to officer.</p>
        </div>
        <div className="modules-grid-full">
          {[
            { card: 'mc-gold', wrap: 'mw-gold', img: '/emoji-1.png', alt: 'MCQ', title: 'Daily MCQ Practice', desc: 'Subject-wise & topic-wise MCQs with detailed explanations. New questions every day, curated by experts.', tag: 'tag-gold', tagLabel: 'Daily Practice', delay: 1 },
            { card: 'mc-emerald', wrap: 'mw-emerald', img: '/emoji-2.png', alt: 'Answer Writing', title: 'Daily Answer Writing', desc: 'Daily mains practice with AI-powered instant evaluation and UPSC-style marking schemes.', tag: 'tag-emerald', tagLabel: 'Instant Evaluation', delay: 2 },
            { card: 'mc-cyan', wrap: 'mw-cyan', img: '/emoji-3.png', alt: 'Mock Tests', title: 'Mock Tests', desc: 'Full-length Prelims & Mains simulations in UPSC pattern. Timed, scored, ranked.', tag: 'tag-cyan', tagLabel: 'Test Series', delay: 3 },
            { card: 'mc-violet', wrap: 'mw-violet', img: '/emoji-4.png', alt: 'PYQ', title: 'Previous Year Questions', desc: '30 years of PYQs with trend analysis, topic clustering, and examiner insights.', tag: 'tag-violet', tagLabel: 'PYQ Bank', delay: 4 },
            { card: 'mc-rose', wrap: 'mw-rose', img: '/emoji-5.png', alt: 'Current Affairs', title: 'Current Affairs', desc: 'Curated daily news, monthly magazines, and UPSC-relevant analysis. Never miss what matters.', tag: 'tag-rose', tagLabel: 'Daily Updates', delay: 1 },
            { card: 'mc-teal', wrap: 'mw-teal', img: '/emoji-7.png', alt: 'Syllabus Tracker', title: 'Syllabus Tracker', desc: 'Visual progress across GS I–IV & Optional. Know your coverage, never leave a topic behind.', tag: 'tag-teal', tagLabel: 'Smart Tracking', delay: 2 },
            { card: 'mc-amber', wrap: 'mw-amber', img: '/emoji-8.png', alt: 'Analytics', title: 'Performance Analytics', desc: 'Test-level breakdowns, weak-area detection, and daily UPSC readiness scores. Know where you stand.', tag: 'tag-amber', tagLabel: 'Smart Insights', delay: 3 },
          ].map(m => (
            <div key={m.title} className={`mod-card ${m.card} reveal reveal-delay-${m.delay}`}>
              <div>
                <div className={`mod-icon-wrap ${m.wrap}`}>
                  <Image src={m.img} alt={m.alt} width={36} height={36} />
                </div>
                <div className="mod-title">{m.title}</div>
                <div className="mod-desc">{m.desc}</div>
              </div>
              <div className={`mod-tag ${m.tag}`}>{m.tagLabel}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI SECTION ── */}
      <section className="ai-section" id="ai">
        <div className="ai-inner">
          <div className="ai-left reveal">
            <div className="section-eyebrow eyebrow-light">Jeet AI</div>
            <h2 className="section-h2-light">
              Experience the Power<br />of <span style={{ color: '#E8B84B' }}>AI-First Learning</span>
            </h2>
            <p className="section-p-light" style={{ marginTop: 12 }}>
              Our AI doesn&apos;t just grade. It understands your gaps, adapts your plan, and coaches you like a personal mentor — 24/7.
            </p>
            <div className="ai-features-switcher">
              {AI_SLIDES.map((slide, i) => (
                <div
                  key={i}
                  className={`ai-feat${activeSlide === i ? ' active' : ''}`}
                  onClick={() => setActiveSlide(i)}
                >
                  <div className="ai-feat-header">
                    <div className="ai-feat-icon" style={{ background: slide.iconBg }}>
                      <Image src={slide.iconSrc} alt={slide.title} width={28} height={28} />
                    </div>
                    <div className="ai-feat-title">{slide.title}</div>
                  </div>
                  <div className="ai-feat-desc">{slide.desc}</div>
                  <div className="ai-feat-progress">
                    <div className="ai-feat-progress-fill" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ai-right reveal reveal-delay-2">
            <div className="demo-device">
              <div className="device-bar">
                <div className="d-dot" style={{ background: '#FF5F57' }} />
                <div className="d-dot" style={{ background: '#FFBD2E' }} />
                <div className="d-dot" style={{ background: '#28CA41' }} />
                <span className="device-title">{AI_SLIDES[activeSlide].title}</span>
              </div>
              <div className="demo-content">
                {/* Slide 0: Mains Evaluator */}
                <div className={`demo-slide${activeSlide === 0 ? ' active' : ''}`}>
                  <div className="eval-q">Q: Discuss the role of Interstate Councils in maintaining cooperative federalism in India. (150 words)</div>
                  <div className="eval-ans">Interstate Councils serve as a crucial forum for Centre-State deliberation… leading to concerns about &quot;Decline of Parliament&quot;. Interstate councils will lead to reduction in trust deficit between the Centre &amp; States…</div>
                  <div className="eval-bar"><div className="eval-bar-fill" /></div>
                  <div style={{ fontSize: 11, color: '#8A96B0', marginBottom: 10, fontFamily: "'JetBrains Mono', monospace" }}>AI analysing answer… 85% complete</div>
                  <div className="eval-scores">
                    <div className="es-item"><div className="es-val" style={{ color: '#C8960A' }}>7.5</div><div className="es-label">Content</div></div>
                    <div className="es-item"><div className="es-val" style={{ color: '#06B6D4' }}>8.0</div><div className="es-label">Structure</div></div>
                    <div className="es-item"><div className="es-val" style={{ color: '#10B981' }}>7.0</div><div className="es-label">Analysis</div></div>
                  </div>
                  <div className="eval-fb">✓ Good constitutional grounding. Add 2024 examples. Conclusion needs forward-looking dimension.</div>
                </div>

                {/* Slide 1: AI Assistant */}
                <div className={`demo-slide${activeSlide === 1 ? ' active' : ''}`}>
                  <div className="chat-wrap">
                    <div className="chat-bubble cb-user">How should I structure an answer on &quot;Judicial Overreach&quot;?</div>
                    <div className="chat-bubble cb-ai">
                      <strong>Ideal UPSC structure:</strong><br /><br />
                      📌 <strong>Intro:</strong> Define judicial overreach vs activism<br />
                      📌 <strong>Body 1:</strong> Constitutional provisions (Art 13, 32, 226)<br />
                      📌 <strong>Body 2:</strong> Key SC judgements as examples<br />
                      📌 <strong>Conclusion:</strong> Balance separation of powers
                    </div>
                    <div className="chat-bubble cb-user">Give me 3 recent examples for the body?</div>
                    <div className="chat-bubble cb-ai">
                      <div className="cb-typing">
                        <div className="cb-dot" /><div className="cb-dot" /><div className="cb-dot" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slide 2: Mock Tests */}
                <div className={`demo-slide${activeSlide === 2 ? ' active' : ''}`}>
                  <div className="tgen-header">
                    <div className="tgen-title">Adaptive Test — Weak Areas</div>
                    <div className="tgen-badge">Modern History · 10Q</div>
                  </div>
                  <div className="tg-q">
                    <div className="tg-q-text">Which of the following about the INC&apos;s Lahore Session (1929) is CORRECT?</div>
                    <div className="tg-option"><div className="tg-opt-mark">A</div>It adopted the Poorna Swaraj resolution only</div>
                    <div className="tg-option correct"><div className="tg-opt-mark">✓</div>Jawaharlal Nehru was elected President</div>
                    <div className="tg-option wrong"><div className="tg-opt-mark">✗</div>Gandhi ji presided over the session</div>
                    <div className="tg-option"><div className="tg-opt-mark">D</div>It was held in December 1930</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#065F46', padding: '10px 13px', background: '#D1FAE5', border: '1px solid #A7F3D0', borderRadius: 8 }}>
                    ✓ Correct! Nehru presided &amp; passed the Poorna Swaraj resolution on 31 Dec 1929.
                  </div>
                </div>

                {/* Slide 3: Current Affairs */}
                <div className={`demo-slide${activeSlide === 3 ? ' active' : ''}`}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0B1530', marginBottom: 14, fontFamily: "'Outfit', sans-serif" }}>Today&apos;s UPSC-Relevant News</div>
                  <div className="ca-wrap">
                    <div className="ca-item">
                      <div><div className="ca-dot-item" style={{ background: '#C8960A' }} /></div>
                      <div><div className="ca-text">RBI&apos;s MPC holds repo rate at 6.5% amid inflation concerns — GS3 Economy</div><div className="ca-tag" style={{ color: '#C8960A' }}>Economy · Prelims + Mains</div></div>
                    </div>
                    <div className="ca-item">
                      <div><div className="ca-dot-item" style={{ background: '#06B6D4' }} /></div>
                      <div><div className="ca-text">SC upholds Right to Privacy in digital data — link to PDPA 2023</div><div className="ca-tag" style={{ color: '#06B6D4' }}>Polity · Ethics</div></div>
                    </div>
                    <div className="ca-item">
                      <div><div className="ca-dot-item" style={{ background: '#10B981' }} /></div>
                      <div><div className="ca-text">India&apos;s forest cover increases by 1540 sq km — State of Forest Report 2025</div><div className="ca-tag" style={{ color: '#10B981' }}>Environment · Geography</div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── REVISION TOOLS ── */}
      <section className="tools-section" id="revision">
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 60 }} className="reveal">
            <div style={{ maxWidth: 480 }}>
              <div className="section-eyebrow eyebrow-dark">Revision Suite</div>
              <h2 className="section-h2-dark">Master. Retain. Recall.</h2>
              <p className="section-p-dark" style={{ marginTop: 10 }}>Science-backed tools to make every revision session count.</p>
            </div>
          </div>
          <div className="tools-grid-2">
            {[
              { card: 'tc-gold', ib: 'tib-gold', img: '/emoji-9.png', title: 'Flashcards', desc: '1,000+ pre-built smart cards across all GS topics. Scheduled by difficulty, never boring.', delay: 1 },
              { card: 'tc-cyan', ib: 'tib-cyan', img: '/emoji-10.png', title: 'Mind Maps', desc: 'Visual concept maps linking ideas across GS. Build connections, not isolated notes.', delay: 2 },
              { card: 'tc-emerald', ib: 'tib-emerald', img: '/emoji-11.png', title: 'Spaced Repetition', desc: 'Ebbinghaus-powered review scheduling. Study smarter — revisit topics exactly when needed.', delay: 3 },
              { card: 'tc-violet', ib: 'tib-violet', img: '/emoji-12.png', title: 'Study Planner', desc: 'AI-generated daily plans adapting to your pace, goals, and exam date. Zero manual planning.', delay: 4 },
            ].map(t => (
              <div key={t.title} className={`tool-card ${t.card} reveal reveal-delay-${t.delay}`}>
                <div className={`tool-icon-box ${t.ib}`}>
                  <Image src={t.img} alt={t.title} width={38} height={38} />
                </div>
                <h4>{t.title}</h4>
                <p>{t.desc}</p>
                <div className="tool-arrow">Explore →</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ANALYTICS ── */}
      <section className="analytics-section" id="analytics">
        <div className="analytics-inner">
          <div className="dash-card reveal">
            <div className="dc-header">
              <h5>Performance Dashboard</h5>
              <span className="dc-date">Mar 14, 2026</span>
            </div>
            <div className="dc-metrics">
              <div className="dc-metric"><div className="mv" style={{ color: '#C8960A' }}>84%</div><div className="ml">Prelims Accuracy</div></div>
              <div className="dc-metric"><div className="mv" style={{ color: '#06B6D4' }}>47</div><div className="ml">Day Streak 🔥</div></div>
              <div className="dc-metric"><div className="mv" style={{ color: '#10B981' }}>238</div><div className="ml">Answers Written</div></div>
            </div>
            <div className="dc-line-chart">
              <svg viewBox="0 0 320 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C8960A" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#C8960A" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,65 L32,58 L64,52 L96,44 L128,48 L160,36 L192,28 L224,22 L256,18 L288,12 L320,8 L320,80 L0,80 Z" fill="url(#lineGrad)" />
                <polyline points="0,65 32,58 64,52 96,44 128,48 160,36 192,28 224,22 256,18 288,12 320,8" fill="none" stroke="#C8960A" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                <circle cx="96" cy="44" r="3" fill="#C8960A" />
                <circle cx="192" cy="28" r="3" fill="#C8960A" />
                <circle cx="320" cy="8" r="4" fill="#C8960A" stroke="#FEF3C7" strokeWidth="2" />
                <line x1="0" y1="20" x2="320" y2="20" stroke="#E4EAF5" strokeWidth="1" />
                <line x1="0" y1="40" x2="320" y2="40" stroke="#E4EAF5" strokeWidth="1" />
                <line x1="0" y1="60" x2="320" y2="60" stroke="#E4EAF5" strokeWidth="1" />
                <text x="5" y="75" fontSize="7" fill="#8A96B0" fontFamily="JetBrains Mono">Jan</text>
                <text x="90" y="75" fontSize="7" fill="#8A96B0" fontFamily="JetBrains Mono">Feb</text>
                <text x="183" y="75" fontSize="7" fill="#8A96B0" fontFamily="JetBrains Mono">Mar</text>
              </svg>
              <div style={{ position: 'absolute', top: 8, left: 14, fontSize: 10, color: '#8A96B0', fontFamily: "'JetBrains Mono', monospace" }}>Score Trend</div>
              <div style={{ position: 'absolute', top: 8, right: 14, fontSize: 10, fontWeight: 700, color: '#C8960A', fontFamily: "'JetBrains Mono', monospace" }}>↑ +18 pts</div>
            </div>
            <div className="dc-chart">
              {[42, 58, 48, 72, 64, 52, 80, 88, 82, 95].map((h, i) => (
                <div key={i} className={`dcbar ${i % 2 === 0 && i < 5 ? 'dcbar-empty' : i === 2 || i === 5 ? 'dcbar-empty' : 'dcbar-filled'}`}
                  style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="dc-subjects">
              {[
                { name: 'History', pct: 88, color: '#C8960A' },
                { name: 'Polity', pct: 76, color: '#06B6D4' },
                { name: 'Geography', pct: 62, color: '#8B5CF6' },
                { name: 'Economy', pct: 55, color: '#F43F5E' },
                { name: 'Environment', pct: 80, color: '#10B981' },
              ].map(s => (
                <div key={s.name} className="dc-sub-row">
                  <span className="dc-sub-name">{s.name}</span>
                  <div className="dc-sub-track"><div className="dc-sub-fill" style={{ width: `${s.pct}%`, background: s.color }} /></div>
                  <span className="dc-sub-pct">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="analytics-right reveal reveal-delay-2">
            <div className="section-eyebrow eyebrow-dark">Smart Analytics</div>
            <h2 className="section-h2-dark">Know Exactly<br />Where You Stand</h2>
            <p className="section-p-dark" style={{ margin: '14px 0 32px' }}>
              Our Performance Analytics Dashboard meticulously monitors every question, test, and mains answers. This thorough tracking proactively pinpoints weak areas, preventing potential loss of marks.
            </p>
            <div className="analytics-points">
              {[
                { bg: '#FEF3C7', img: '/emoji-6.png', title: 'Test Analytics', desc: 'Question-level breakdown, time-per-question, and rank prediction after every mock.' },
                { bg: '#E0F7FA', img: '/emoji-7.png', title: 'Weak Area Identification', desc: 'AI pinpoints your weakest sub-topics and auto-schedules targeted revision sessions.' },
                { bg: '#D1FAE5', img: '/emoji-8.png', title: 'UPSC Readiness Score', desc: 'A composite score updated daily — telling you how ready you are for the actual exam.' },
              ].map(p => (
                <div key={p.title} className="apoint">
                  <div className="apoint-icon" style={{ background: p.bg }}>
                    <Image src={p.img} alt={p.title} width={30} height={30} />
                  </div>
                  <div className="apoint-body">
                    <h4>{p.title}</h4>
                    <p>{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── MENTORSHIP ── */}
      <section className="mentor-section">
        <div className="mentor-inner">
          <div className="mentor-top">
            <div className="reveal">
              <div className="section-eyebrow eyebrow-light"><span className="digit-token">1-on-1</span> Personalised Mentorship</div>
              <h2 className="section-h2-light"><span className="digit-token">1-on-1</span> Personalised<br />Mentorship</h2>
              <p className="section-p-light" style={{ marginTop: 12, maxWidth: 380 }}>
                Personalized 1-on-1 UPSC Mentorship tailored to your preparation journey and built to help you succeed in Prelims, Mains and interview
              </p>
              <div className="mentor-cta-row">
                <button className="btn-schedule" onClick={() => go('/dashboard/free-trial')}>📅 Schedule Mentor Session</button>
              </div>
            </div>

            <div className="mentor-quote-card reveal reveal-delay-2">
              <div className="mqc-mark">&quot;</div>
              <div className="mqc-text">
                &quot;The difference between aspirants and officers is often not knowledge — it is strategy. We help you build the right one.&quot;
              </div>
              <div className="mqc-author">
                <div className="mqc-av">J</div>
                <div>
                  <div className="mqc-name">Abhijeet Soni</div>
                  <div className="mqc-role">Founder &amp; Mentor Rise With Jeet IAS | UPSC Simplified</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mentor-features-grid">
            {[
              { img: '/emoji-9.png', title: 'Weekly 1-on-1 Sessions', desc: 'Personal strategy calls with your assigned mentor. Adjust, refine, and stay on course.', delay: 1 },
              { img: '/emoji-10.png', title: 'Jeet Path Roadmap', desc: 'Your personalised preparation roadmap built around your strengths, gaps, and timeline.', delay: 2 },
              { img: '/emoji-11.png', title: 'Dynamic Plan Updates', desc: 'Your study plan evolves weekly based on performance data and live mentor feedback.', delay: 3 },
            ].map(f => (
              <div key={f.title} className={`mf-item reveal reveal-delay-${f.delay}`}>
                <div className="mf-icon"><Image src={f.img} alt={f.title} width={32} height={32} /></div>
                <div className="mf-title">{f.title}</div>
                <div className="mf-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMUNITY ── */}
      <section className="live-section" id="community">
        <div className="live-inner">
          <div className="live-section-header reveal">
            <div className="section-eyebrow eyebrow-dark" style={{ justifyContent: 'center' }}>Community</div>
            <h2 className="section-h2-dark">Study With 10,000+<br />UPSC Aspirants</h2>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
              <div className="live-pulse"><div className="pulse-dot" />532 students studying right now</div>
            </div>
            <p className="section-p-dark" style={{ marginTop: 14 }}>Accountability, peer learning, and community, because the UPSC journey is better together.</p>
          </div>

          <div className="live-card reveal reveal-delay-1">
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div className="live-avatars">
                {['A', 'R', 'P', 'S'].map(l => <div key={l} className="lavatar">{l}</div>)}
                <div className="lavatar lavatar-more">+120</div>
              </div>
              <div className="live-info">
                <h4>Live Study Room — Silent Mode</h4>
                <p>Currently studying: Modern History · Focus Guard ON</p>
              </div>
            </div>
            <div className="live-stats">
              <div className="lstat"><span className="lstat-val">124</span><div className="lstat-label">Online Now</div></div>
              <div className="lstat"><span className="lstat-val">2h 14m</span><div className="lstat-label">Session</div></div>
            </div>
            <button className="btn-join-live" onClick={() => go('/login?tab=signup')}>Join Study Room →</button>
          </div>

          <div className="live-tools-grid reveal reveal-delay-2">
            {[
              { img: '/emoji-13.png', title: 'Pomodoro Timer', desc: 'Stay deep in focus with proven time blocks' },
              { img: '/fire-emoji.png', title: 'Leaderboards', desc: 'Track rankings and compete with peers' },
              { img: '/emoji-1.png', title: 'Task Cards', desc: 'Share daily goals, stay accountable' },
              { img: '/emoji-2.png', title: 'Peer Review', desc: 'Get answer feedback from fellow aspirants' },
            ].map(t => (
              <div key={t.title} className="lt-item">
                <div className="lt-icon"><Image src={t.img} alt={t.title} width={32} height={32} /></div>
                <h5>{t.title}</h5>
                <p>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MOBILE APP ── */}
      <section className="app-section">
        <div className="app-inner">
          <div className="app-left reveal">
            <div className="section-eyebrow eyebrow-dark">Mobile App</div>
            <h2 className="section-h2-dark">Your UPSC Prep,<br />Always in Your Pocket</h2>
            <p className="section-p-dark" style={{ marginTop: 12, marginBottom: 32 }}>
              Practice on the go. The full platform, beautifully optimised for mobile — so you never miss a day.
            </p>
            <div className="app-features">
              {[
                { bg: '#FEF3C7', img: '/emoji-1.png', title: 'Daily MCQ Notifications', desc: 'Never miss your daily practice with smart reminders' },
                { bg: '#E0F7FA', img: '/emoji-2.png', title: 'Click & Evaluate Answers', desc: 'Photograph handwritten answers for instant AI evaluation' },
                { bg: '#D1FAE5', img: '/emoji-3.png', title: 'Offline Flashcards', desc: 'Study even without internet — all flashcards work offline' },
                { bg: '#EDE9FE', img: '/emoji-4.png', title: 'Streak & Goal Reminders', desc: 'Stay accountable with intelligent habit-building nudges' },
              ].map(f => (
                <div key={f.title} className="app-feat">
                  <div className="app-feat-icon" style={{ background: f.bg }}>
                    <Image src={f.img} alt={f.title} width={28} height={28} />
                  </div>
                  <div className="app-feat-text">
                    <h5>{f.title}</h5>
                    <p>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="app-store-btns">
              <a href="#" className="app-store-btn">
                <span className="asb-icon">🍎</span>
                <div className="asb-text"><span className="asb-sub">Download on the</span><span className="asb-name">App Store</span></div>
              </a>
              <a href="#" className="app-store-btn">
                <span className="asb-icon">▶</span>
                <div className="asb-text"><span className="asb-sub">Get it on</span><span className="asb-name">Google Play</span></div>
              </a>
            </div>
          </div>

          {/* iPhone Mockup */}
          <div className="app-phone-wrap reveal reveal-delay-2">
            <div className="phone-shadow" />
            <div className="phone-frame">
              <div className="phone-screen-wrap">
                <div className="phone-screen">
                  <div className="dynamic-island">
                    <div className="di-content">
                      <span className="di-flame">🔥</span>
                      <span className="di-text">47-day streak!</span>
                      <div className="di-speaker" />
                      <div className="di-camera" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 18px 0', background: 'linear-gradient(180deg,#0D1B2E,#0F2040)' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>9:41</span>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>●●●●</span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>WiFi</span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>🔋</span>
                    </div>
                  </div>
                  <div className="ps-top-bar">
                    <div className="ps-topbar-row">
                      <div className="ps-logo-s">Rise<span>WithJeet</span></div>
                      <div className="ps-notif-btn">🔔</div>
                    </div>
                    <div className="ps-welcome">Good morning, <span style={{ color: '#F5A623' }}>Rahul!</span> 👋</div>
                    <div className="ps-name-big">Ready to rise today?</div>
                    <div className="ps-streak-pill">🔥 47-Day Streak · Keep it up!</div>
                  </div>
                  <div className="ps-body">
                    <div className="ps-progress-row">
                      <div className="ps-mini-card">
                        <div className="ps-mini-card-top">
                          <span className="ps-mini-icon"><Image src="/emoji-1.png" alt="MCQ" width={18} height={18} /></span>
                          <span className="ps-mini-badge badge-up">↑ +6%</span>
                        </div>
                        <div className="ps-mini-val">84%</div>
                        <div className="ps-mini-label">MCQ Accuracy</div>
                        <div className="ps-mini-bar"><div className="ps-mini-fill" style={{ width: '84%', background: 'linear-gradient(90deg,#C8960A,#F5CC6A)' }} /></div>
                      </div>
                      <div className="ps-mini-card">
                        <div className="ps-mini-card-top">
                          <span className="ps-mini-icon"><Image src="/emoji-2.png" alt="Mains" width={18} height={18} /></span>
                          <span className="ps-mini-badge badge-warn">238 total</span>
                        </div>
                        <div className="ps-mini-val">8.2</div>
                        <div className="ps-mini-label">Avg Mains Score</div>
                        <div className="ps-mini-bar"><div className="ps-mini-fill" style={{ width: '82%', background: 'linear-gradient(90deg,#8B5CF6,#A78BFA)' }} /></div>
                      </div>
                    </div>
                    <div className="ps-tasks-card">
                      <div className="ps-tasks-header">
                        <span className="ps-tasks-title">Today&apos;s Plan</span>
                        <span className="ps-tasks-count">3 / 5 done</span>
                      </div>
                      {[
                        { done: true, text: 'Daily MCQ Practice (20 Q)', chip: 'chip-mcq' },
                        { done: true, text: 'Current Affairs Reading', chip: 'chip-ca' },
                        { done: true, text: 'Flashcard Review (50)', chip: 'chip-rev' },
                        { done: false, text: 'Mains Answer Writing', chip: 'chip-mains' },
                        { done: false, text: 'Mock Test — GS2 Paper', chip: 'chip-mcq' },
                      ].map((t, i) => (
                        <div key={i} className="ps-task-row">
                          <div className={`ps-task-check ${t.done ? 'tc-done' : 'tc-pending'}`}>{t.done ? '✓' : ''}</div>
                          <span className={`ps-task-text${t.done ? ' done' : ''}`}>{t.text}</span>
                          <span className={`ps-task-chip ${t.chip}`}>{t.chip === 'chip-mcq' ? 'MCQ' : t.chip === 'chip-ca' ? 'CA' : t.chip === 'chip-rev' ? 'Rev' : 'Mains'}</span>
                        </div>
                      ))}
                    </div>
                    <div className="ps-eval-card">
                      <div className="ps-eval-icon"><Image src="/emoji-3.png" alt="AI Evaluate" width={22} height={22} /></div>
                      <div className="ps-eval-text">
                        <div className="ps-eval-title">Submit Mains Answer</div>
                        <div className="ps-eval-sub">Instant Mains Evaluation in &lt;60 seconds</div>
                      </div>
                      <div className="ps-eval-arrow">→</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cta-box reveal">
          <h2>Your UPSC Journey<br />Starts <span style={{ color: '#E8B84B' }}>Today</span></h2>
          <p>Join 15,000+ aspirants already preparing smarter. No credit card needed.</p>
          <div className="cta-btns">
            <button className="cta-primary" onClick={() => go('/login?tab=signup')}>Start Free Trial →</button>
            <button className="cta-secondary" style={{ borderColor: 'rgba(255,255,255,0.2)' }} onClick={() => go('/contact')}>Connect Us</button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#060C1C', borderTop: '1px solid rgba(244,191,76,0.7)' }}>
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
          <div className="grid grid-cols-1 gap-8 border-b border-white/10 py-10 md:grid-cols-2 xl:grid-cols-[1.6fr_1fr_1fr_1fr_1.1fr] xl:gap-0">
            {/* Brand Column */}
            <div className="pr-0 xl:pr-8">
              <div className="flex items-center gap-3">
                <Image src="/footer-logo.png" alt="RiseWithJeet" width={48} height={48} className="h-12 w-12" />
                <div>
                  <div className="text-[18px] font-bold text-white">RiseWithJeet</div>
                  <div className="text-[10px] uppercase tracking-[0.12em] text-white/50">Your IAS Dream, Powered by<br/>Jeet Intelligence</div>
                </div>
              </div>
              <p className="mt-4 max-w-[320px] text-[13px] leading-[1.6] text-white/60">
                Rise With Jeet is redefining UPSC preparation with a simplified, smarter approach. As India&apos;s leading AI-powered platform, we combine cutting-edge technology, high-quality content, expert guidance, and innovative tools to deliver an effective learning experience.
              </p>

              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Download the app</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <a href="#" className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-[13px] font-semibold text-white hover:bg-white/10 transition">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5ZM16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12ZM20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.53 12.9 20.18 13.18L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81ZM6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" fill="white"/></svg>
                  Google Play
                </a>
                <a href="#" className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-[13px] font-semibold text-white hover:bg-white/10 transition">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.96 6.61C11.82 5.46 12.36 4.26 13 3.5Z" fill="white"/></svg>
                  App Store
                </a>
              </div>

              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Follow us</p>
              <div className="mt-3 flex items-center gap-2">
                <a href="#" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/85 hover:bg-white/10 transition">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" fill="white"/></svg>
                </a>
                <a href="#" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/85 hover:bg-white/10 transition">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="white"/></svg>
                </a>
                <a href="#" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/85 hover:bg-white/10 transition">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="white"/></svg>
                </a>
                <a href="#" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/85 hover:bg-white/10 transition">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="white"/></svg>
                </a>
                <a href="#" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/85 hover:bg-white/10 transition">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="white"/></svg>
                </a>
                <a href="#" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/85 hover:bg-white/10 transition">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="white"/></svg>
                </a>
              </div>
            </div>

            {/* Platform Column */}
            <div className="xl:border-l xl:border-white/10 xl:pl-8">
              <h3 className="pb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-white">Platform</h3>
              <div className="h-[2px] w-7 rounded bg-[#F4BF4C]" />
              <ul className="mt-3 space-y-1">
                <li><Link href="/dashboard/daily-mcq" className="inline-flex items-center py-1 text-[13px] text-white/60 transition hover:text-white">Daily MCQ</Link></li>
                <li><Link href="/dashboard/daily-answer" className="inline-flex items-center py-1 text-[13px] text-white/60 transition hover:text-white">Daily Mains Challenge</Link></li>
                <li><Link href="/dashboard/mock-tests" className="inline-flex items-center py-1 text-[13px] text-white/60 transition hover:text-white">Mock Tests</Link></li>
                <li><Link href="/dashboard/current-affairs" className="inline-flex items-center py-1 text-[13px] text-white/60 transition hover:text-white">Current Affairs</Link></li>
              </ul>
            </div>

            {/* Revision Tools Column */}
            <div className="xl:border-l xl:border-white/10 xl:pl-8">
              <h3 className="pb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-white">Revision Tools</h3>
              <div className="h-[2px] w-7 rounded bg-[#F4BF4C]" />
              <ul className="mt-3 space-y-1">
                <li><Link href="/dashboard/flashcards" className="inline-flex items-center py-1 text-[13px] text-white/60 transition hover:text-white">Flashcards</Link></li>
                <li><Link href="/dashboard/mindmap" className="inline-flex items-center py-1 text-[13px] text-white/60 transition hover:text-white">Mind Maps</Link></li>
                <li><Link href="/dashboard/spaced-repetition" className="inline-flex items-center py-1 text-[13px] text-white/60 transition hover:text-white">Spaced Repetition</Link></li>
                <li><Link href="/dashboard/study-planner" className="inline-flex items-center py-1 text-[13px] text-white/60 transition hover:text-white">Study Planner</Link></li>
                <li><Link href="/dashboard/syllabus-tracker" className="inline-flex items-center py-1 text-[13px] text-white/60 transition hover:text-white">Syllabus Tracker</Link></li>
              </ul>
            </div>

            {/* Company Column */}
            <div className="xl:border-l xl:border-white/10 xl:pl-8">
              <h3 className="pb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-white">Company</h3>
              <div className="h-[2px] w-7 rounded bg-[#F4BF4C]" />
              <ul className="mt-3 space-y-1">
                <li><Link href="/our-story" className="inline-flex items-center py-1 text-[13px] text-white/60 transition hover:text-white">About Us</Link></li>
                <li><Link href="/faq" className="inline-flex items-center py-1 text-[13px] text-white/60 transition hover:text-white">FAQs</Link></li>
                <li><Link href="/terms" className="inline-flex items-center py-1 text-[13px] text-white/60 transition hover:text-white">Terms of Use</Link></li>
                <li><Link href="/refund" className="inline-flex items-center py-1 text-[13px] text-white/60 transition hover:text-white">Refund Policy</Link></li>
                <li><Link href="/cookies" className="inline-flex items-center py-1 text-[13px] text-white/60 transition hover:text-white">Cookies</Link></li>
                <li><Link href="/privacy" className="inline-flex items-center py-1 text-[13px] text-white/60 transition hover:text-white">Privacy Policy</Link></li>
              </ul>
            </div>

            {/* Contact Us Column */}
            <div className="xl:border-l xl:border-white/10 xl:pl-8">
              <h3 className="pb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-white">Contact Us</h3>
              <div className="h-[2px] w-7 rounded bg-[#F4BF4C]" />

              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">Email</p>
                  <a href="mailto:together@risewithjeet.com" className="mt-1 flex items-center gap-2 text-[13px] text-white/85 hover:text-white transition">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="white" fillOpacity="0.6"/></svg>
                    together@risewithjeet.com
                  </a>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">Contact Page</p>
                  <Link href="/contact" className="mt-1 flex items-center gap-2 text-[13px] text-white/85 hover:text-white transition">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="white" fillOpacity="0.6"/></svg>
                    Contact Us
                  </Link>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">WhatsApp</p>
                  <a href="https://wa.me/918357056891" target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-2 text-[13px] text-white/85 hover:text-white transition">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="white" fillOpacity="0.6"/></svg>
                    +91 83570 56891
                  </a>
                  <a href="https://wa.me/918357056891" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#25D366]/35 bg-[#25D366]/12 px-3 py-1 text-[11px] font-semibold text-[#4ADE80] hover:bg-[#25D366]/20 transition">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="#4ADE80"/></svg>
                    Text on WhatsApp
                  </a>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">Telegram Support</p>
                  <a href="https://t.me/togetherrisewithjeet" target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-2 text-[13px] text-white/85 hover:text-white transition">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" fill="white" fillOpacity="0.6"/></svg>
                    @togetherrisewithjeet
                  </a>
                  <a href="https://t.me/togetherrisewithjeet" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#38BDF8]/35 bg-[#38BDF8]/12 px-3 py-1 text-[11px] font-semibold text-[#7DD3FC] hover:bg-[#38BDF8]/20 transition">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" fill="#7DD3FC"/></svg>
                    Join Telegram Community
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 py-4 text-[12px] text-white/35 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Jeetpath Academy Private Limited. All rights reserved.</p>
            <p className="text-left sm:text-right">
              Made with <span className="text-[#F4BF4C]">♥</span> for every UPSC aspirant
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
