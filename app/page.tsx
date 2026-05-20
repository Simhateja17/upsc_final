'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { studyGroupService } from '@/lib/services';
import '@/styles/landing.css';
import LandingNav from '@/components/LandingNav';
import Footer from '@/components/Footer';


const AI_SLIDES = [
  { title: 'Mains Evaluator', iconSrc: '/sidebar-daily-answer-new.png', iconBg: 'rgba(232,184,75,0.14)', desc: 'Upload your handwritten or typed answers and receive structured feedback, marks, and personalized improvement tips. Our UPSC-examiner style analysis is delivered in under 60 seconds.' },
  { title: 'Jeet AI Assistant', iconSrc: '/sidebar-jeet-gpt.png', iconBg: 'rgba(6,182,212,0.14)', desc: 'Get instant, precise answers for all your UPSC queries, covering everything from syllabus details and current affairs context to answer structuring and general doubt resolution.' },
  { title: 'Adaptapic Mock Test Platform', iconSrc: '/sidebar-mock-tests-new.png', iconBg: 'rgba(139,92,246,0.14)', desc: 'Personalised mock tests targeting your weakest areas, ensuring every session moves the needle towards your goal.' },
  { title: 'Current Affairs Digest', iconSrc: '/sidebar-current-affairs.png', iconBg: 'rgba(16,185,129,0.14)', desc: 'Our platform instantly connects daily news articles with the relevant UPSC syllabus. For each article, we provide a detailed summary, related practice MCQs and Mains examination questions.' },
];

export default function LandingPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [onlineCount, setOnlineCount] = useState(532);

  // Auth redirect
  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      router.replace(user?.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Ensure landing page never inherits stale body scroll locks.
  useEffect(() => {
    document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Scroll reveal
  useEffect(() => {
    const revealEls = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    if (revealEls.length === 0) return;

    revealEls.forEach((el) => el.classList.add('reveal-init'));

    const makeVisible = (el: HTMLElement) => el.classList.add('visible');

    if (!('IntersectionObserver' in window)) {
      revealEls.forEach(makeVisible);
      return;
    }

    const obs = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          makeVisible(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -20px 0px' });

    revealEls.forEach((el) => obs.observe(el));

    // Ensure any element already in viewport on load becomes visible immediately
    revealEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) makeVisible(el);
    });

    // Safety net: make all remaining elements visible after 2s
    const timer = setTimeout(() => revealEls.forEach(makeVisible), 2000);

    return () => { obs.disconnect(); clearTimeout(timer); };
  }, []);

  // Fetch online count from study groups
  useEffect(() => {
    studyGroupService.getGroups()
      .then((res) => {
        if (res.data && Array.isArray(res.data)) {
          const total = res.data.reduce((sum: number, g: any) => sum + (g.memberCount || 0), 0);
          if (total > 0) setOnlineCount(total);
        }
      })
      .catch(() => {
        // Keep default 532 if fetch fails
      });
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
      ctx!.fillStyle = '#070e1e';
      ctx!.fillRect(0, 0, W, H);
      const glow = ctx!.createRadialGradient(W * 0.05, H * 0.5, 0, W * 0.15, H * 0.5, W * 0.55);
      glow.addColorStop(0, 'rgba(232,184,75,0.18)');
      glow.addColorStop(0.35, 'rgba(232,184,75,0.07)');
      glow.addColorStop(1, 'rgba(7,14,30,0)');
      ctx!.fillStyle = glow;
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

  const go = useCallback((path: string) => { router.push(path); }, [router]);

  if (isAuthenticated) {
    return (
      <div style={{ minHeight: '100dvh', background: '#FAFBFE', color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: '#F4F6FA', color: '#0B1D3A', overflowX: 'hidden', minHeight: '100vh' }}>

      {/* ── NAV ── */}
      <LandingNav />

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
            { val: '15K+', label: 'Active Aspirants' },
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
            { card: 'mc-gold', wrap: 'mw-gold', title: 'Daily MCQ Practice', desc: 'Subject-wise & topic-wise MCQs with detailed explanations. New questions every day, curated by experts.', tag: 'tag-gold', tagLabel: 'Daily Practice', delay: 1, icon: '/assets/daily-mcq-practice.png' },
            { card: 'mc-cyan', wrap: 'mw-cyan', title: 'Mock Tests', desc: 'Full-length Prelims & Mains simulations in UPSC pattern. Timed, scored, ranked.', tag: 'tag-cyan', tagLabel: 'Test Series', delay: 2, icon: '/sidebar-mock-tests-new.png' },
            { card: 'mc-violet', wrap: 'mw-violet', title: 'Previous Year Questions', desc: '30 years of PYQs with trend analysis, topic clustering, and examiner insights.', tag: 'tag-violet', tagLabel: 'PYQ Bank', delay: 3, icon: '/sidebar-pyq-new.png' },
            { card: 'mc-emerald', wrap: 'mw-emerald', title: 'Answer Writing', desc: 'Daily mains practice with AI-powered instant evaluation and UPSC-style marking schemes.', tag: 'tag-emerald', tagLabel: 'AI Evaluated', delay: 4, icon: '/sidebar-daily-answer-new.png' },
            { card: 'mc-rose', wrap: 'mw-rose', title: 'Current Affairs', desc: 'Curated daily news, monthly magazines, and UPSC-relevant analysis. Never miss what matters.', tag: 'tag-rose', tagLabel: 'Daily Updates', delay: 1, icon: '/sidebar-current-affairs.png' },
            { card: 'mc-navy', wrap: 'mw-navy', title: 'Video Lectures', desc: "India's best educators. Interactive quizzes, notes & timestamped bookmarks. 500+ hours.", tag: 'tag-navy', tagLabel: '500+ Hours', delay: 2, icon: '/sidebar-video.png' },
            { card: 'mc-teal', wrap: 'mw-teal', title: 'Syllabus Tracker', desc: 'Visual progress across GS I–IV & Optional. Know your coverage, never leave a topic behind.', tag: 'tag-teal', tagLabel: 'Smart Tracking', delay: 3, icon: '/sidebar-syllabus-new.png' },
            { card: 'mc-amber', wrap: 'mw-amber', title: 'Performance Analytics', desc: 'Test-level breakdowns, weak-area detection, and daily UPSC readiness scores. Know where you stand.', tag: 'tag-amber', tagLabel: 'Smart Insights', delay: 4, icon: '/sidebar-analytics-new.png' },
          ].map(m => (
            <div key={m.title} className={`mod-card ${m.card} reveal reveal-delay-${m.delay}`}>
              <div>
                <div className={`mod-icon-wrap ${m.wrap}`}>
                  <Image src={m.icon} alt={m.title} width={36} height={36} style={{ objectFit: 'contain' }} />
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
              { card: 'tc-gold', ib: 'tib-gold', img: '/sidebar-flashcards-new.png', title: 'Flashcards', desc: '1,000+ pre-built smart cards across all GS topics. Scheduled by difficulty, never boring.', delay: 1 },
              { card: 'tc-cyan', ib: 'tib-cyan', img: '/sidebar-mindmap-new.png', title: 'Mind Maps', desc: 'Visual concept maps linking ideas across GS. Build connections, not isolated notes.', delay: 2 },
              { card: 'tc-emerald', ib: 'tib-emerald', img: '/sidebar-spaced-repetition.png', title: 'Spaced Repetition', desc: 'Ebbinghaus-powered review scheduling. Study smarter — revisit topics exactly when needed.', delay: 3 },
              { card: 'tc-violet', ib: 'tib-violet', img: '/sidebar-study-planner.png', title: 'Study Planner', desc: 'AI-generated daily plans adapting to your pace, goals, and exam date. Zero manual planning.', delay: 4 },
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
                { bg: '#FEF3C7', img: '/sidebar-analytics-new.png', title: 'Test Analytics', desc: 'Question-level breakdown, time-per-question, and rank prediction after every mock.' },
                { bg: '#E0F7FA', img: '/sidebar-performance-new.png', title: 'Weak Area Identification', desc: 'AI pinpoints your weakest sub-topics and auto-schedules targeted revision sessions.' },
                { bg: '#D1FAE5', img: '/sidebar-overview-new.png', title: 'UPSC Readiness Score', desc: 'A composite score updated daily — telling you how ready you are for the actual exam.' },
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
              <div className="section-eyebrow eyebrow-light">Mentorship</div>
              <h2 className="section-h2-light">UPSC Mentorship<br />Tailored To Your Journey</h2>
              <p className="section-p-light" style={{ marginTop: 12, maxWidth: 380 }}>
                UPSC mentorship tailored to your preparation journey and built to help you succeed in Prelims, Mains and interview
              </p>
              <div className="mentor-cta-row">
                <button className="btn-schedule" onClick={() => go('/dashboard/free-trial')}>📅 Schedule Mentor Session</button>
              </div>
            </div>

            <div className="mentor-quote-card reveal reveal-delay-2">
              <div className="mqc-mark">&quot;</div>
              <div className="mqc-text">
                &quot;The difference between aspirants and officers is often not knowledge, it is strategy. We help you build the right one.&quot;
              </div>
              <div className="mqc-author">
                <div className="mqc-av">A</div>
                <div>
                  <div className="mqc-name">Abhijeet Soni</div>
                  <div className="mqc-role">Founder &amp; Mentor Rise With Jeet IAS | UPSC Simplified</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mentor-features-grid">
            {[
              { img: '/pppp.png', title: 'Weekly 1-on-1 Sessions', desc: 'Personal strategy calls with your assigned mentor. Adjust, refine, and stay on course.', delay: 1 },
              { img: '/mmmm.png', title: 'Jeet Path Roadmap', desc: 'Your personalised preparation roadmap built around your strengths, gaps, and timeline.', delay: 2 },
              { img: '/ree.png', title: 'Dynamic Plan Updates', desc: 'Your study plan evolves weekly based on performance data and live mentor feedback.', delay: 3 },
            ].map(f => (
              <div key={f.title} className={`mf-item reveal reveal-delay-${f.delay}`}>
                <div className="mf-icon"><Image src={f.img} alt={f.title} width={32} height={32} style={{ objectFit: 'contain' }} /></div>
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
              <div className="live-pulse"><div className="pulse-dot" />{onlineCount} students studying right now</div>
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
              <div className="lstat"><span className="lstat-val">{onlineCount}</span><div className="lstat-label">Online Now</div></div>
              <div className="lstat"><span className="lstat-val">2h 14m</span><div className="lstat-label">Session</div></div>
            </div>
            <button className="btn-join-live" onClick={() => go('/login?tab=signup')}>Join Study Room →</button>
          </div>

          <div className="live-tools-grid reveal reveal-delay-2">
            {[
              { img: '/tttttt.png', title: 'Pomodoro Timer', desc: 'Stay deep in focus with proven time blocks' },
              { img: '/cuppppp.png', title: 'Leaderboards', desc: 'Track rankings and compete with peers' },
              { img: '/nn.png', title: 'Task Cards', desc: 'Share daily goals, stay accountable' },
              { img: '/mggg.png', title: 'Peer Review', desc: 'Get answer feedback from fellow aspirants' },
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
                { bg: '#FEF3C7', img: '/jjjjjj.png', title: 'Daily MCQ Notifications', desc: 'Never miss your daily practice with smart reminders' },
                { bg: '#E0F7FA', img: '/hjj.png', title: 'Click & Evaluate Answers', desc: 'Photograph handwritten answers for instant AI evaluation' },
                { bg: '#D1FAE5', img: '/ree.png', title: 'Offline Flashcards', desc: 'Study even without internet — all flashcards work offline' },
                { bg: '#EDE9FE', img: '/belllllll.png', title: 'Streak & Goal Reminders', desc: 'Stay accountable with intelligent habit-building nudges' },
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
                      <div className="ps-logo-s">RiseWith<span>Jeet</span></div>
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
                          <span className="ps-mini-icon"><Image src="/sidebar-daily-mcq-new.png" alt="MCQ" width={18} height={18} /></span>
                          <span className="ps-mini-badge badge-up">↑ +6%</span>
                        </div>
                        <div className="ps-mini-val">84%</div>
                        <div className="ps-mini-label">MCQ Accuracy</div>
                        <div className="ps-mini-bar"><div className="ps-mini-fill" style={{ width: '84%', background: 'linear-gradient(90deg,#C8960A,#F5CC6A)' }} /></div>
                      </div>
                      <div className="ps-mini-card">
                        <div className="ps-mini-card-top">
                          <span className="ps-mini-icon"><Image src="/sidebar-daily-answer-new.png" alt="Mains" width={18} height={18} /></span>
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
                      <div className="ps-eval-icon"><Image src="/sidebar-daily-answer-new.png" alt="AI Evaluate" width={22} height={22} /></div>
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
          <p>Smart preparation, structured planning, and AI-powered insights, everything serious aspirants need, in one place.</p>
          <div className="cta-btns">
            <button className="cta-primary" onClick={() => go('/login?tab=signup')}>Start Free Trial →</button>
            <button className="cta-secondary" style={{ borderColor: 'rgba(255,255,255,0.2)' }} onClick={() => go('/contact')}>Connect Us</button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <Footer />

    </div>
  );
}
