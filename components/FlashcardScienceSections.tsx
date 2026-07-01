'use client';

import React, { useEffect, useRef } from 'react';

/**
 * "How Smart Flashcards Work" + CTA banner.
 *
 * Converted 1:1 from FLASHCARDS_FINAL_SURI.html (the sections that follow the
 * "Choose a Subject" block). Styling is kept identical to the source via
 * scoped styled-jsx; CSS variables were inlined with their literal values and
 * the scroll / forgetting-curve animations replicate the original
 * IntersectionObserver script.
 */
export default function FlashcardScienceSections() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const observers: IntersectionObserver[] = [];

    // Staggered fade-up for [data-animate] elements.
    const animateEls = Array.from(root.querySelectorAll<HTMLElement>('[data-animate]'));
    const fadeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          const idx = animateEls.indexOf(el);
          window.setTimeout(() => el.classList.add('visible'), Math.max(idx, 0) * 80);
          fadeObserver.unobserve(el);
        });
      },
      { threshold: 0.15 }
    );
    animateEls.forEach((el) => fadeObserver.observe(el));
    observers.push(fadeObserver);

    // Animate the forgetting-curve paths + review markers.
    const curveViz = root.querySelector<HTMLElement>('.curve-viz');
    if (curveViz) {
      const curveObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.querySelectorAll('.curve-path').forEach((c) => c.classList.add('animated'));
            entry.target.querySelectorAll('.review-marker').forEach((m) => m.classList.add('animated'));
            curveObserver.unobserve(entry.target);
          });
        },
        { threshold: 0.3 }
      );
      curveObserver.observe(curveViz);
      observers.push(curveObserver);
    }

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <div ref={rootRef} className="fc-science">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=DM+Sans:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* === HOW IT WORKS SECTION === */}
      <section className="how-section">
        <div className="how-header">
          <h2>
            How <span className="gold">Smart Flashcards</span> Work
          </h2>
          <p>A scientifically proven system that transforms how you retain and recall information for UPSC.</p>
        </div>

        {/* 4-Step Flow */}
        <div className="steps-flow">
          <div className="step-card" data-animate>
            <div
              className="step-icon"
              style={{ background: 'linear-gradient(135deg,rgba(245,158,11,.12),rgba(251,146,60,.08))' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.8">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M8 10h8M8 14h4" />
              </svg>
            </div>
            <h3>Active Recall</h3>
            <p>Each card challenges you to retrieve information from memory, strengthening neural pathways far more than passive reading.</p>
          </div>
          <div className="step-card" data-animate>
            <div
              className="step-icon"
              style={{ background: 'linear-gradient(135deg,rgba(16,185,129,.12),rgba(52,211,153,.08))' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.8">
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
            </div>
            <h3>Spaced Repetition</h3>
            <p>Cards reappear at optimal intervals, right before you&apos;d forget. This is the science of long-term memory encoding.</p>
          </div>
          <div className="step-card" data-animate>
            <div
              className="step-icon"
              style={{ background: 'linear-gradient(135deg,rgba(139,92,246,.12),rgba(167,139,250,.08))' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.8">
                <path d="M18 20V10M12 20V4M6 20v-6" />
              </svg>
            </div>
            <h3>Adaptive Difficulty</h3>
            <p>The system tracks your confidence. Hard cards repeat sooner; easy ones are spaced further. Your effort focuses where it matters.</p>
          </div>
          <div className="step-card" data-animate>
            <div
              className="step-icon"
              style={{ background: 'linear-gradient(135deg,rgba(212,175,55,.15),rgba(255,215,0,.08))' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.8">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3>Mastery Tracking</h3>
            <p>Watch your knowledge grow. Cards graduate from &quot;new&quot; to &quot;mastered&quot; as you prove consistent recall over time.</p>
          </div>
        </div>

        <div style={{ maxWidth: 800, margin: '0 auto 48px', textAlign: 'center' }}>
          <p style={{ fontSize: 15, color: '#1E293B', lineHeight: 1.7, marginBottom: 12, fontWeight: 500 }}>
            This isn&apos;t theory. It&apos;s how your brain actually works.
          </p>
          <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7 }}>
            Hermann Ebbinghaus first documented the forgetting curve in 1885. Without intervention, we lose about 70% of new information within 24 hours. But he also discovered something powerful: each time we actively recall information, we reset that curve and strengthen the memory. The graph below shows what happens when you combine active recall with spaced repetition.
          </p>
        </div>

        {/* Forgetting Curve Visualization */}
        <div className="curve-viz" data-animate>
          <h3>The Forgetting Curve vs. Spaced Repetition</h3>
          <p className="curve-sub">See how timely reviews transform memory retention over time</p>
          <svg className="curve-svg" viewBox="0 0 800 200" preserveAspectRatio="xMidYMid meet">
            {/* Grid lines */}
            <line x1="60" y1="20" x2="60" y2="170" stroke="#E2E8F0" strokeWidth="1" />
            <line x1="60" y1="170" x2="760" y2="170" stroke="#E2E8F0" strokeWidth="1" />
            <line x1="60" y1="95" x2="760" y2="95" stroke="#E2E8F0" strokeWidth="0.5" strokeDasharray="4" />
            <line x1="60" y1="20" x2="760" y2="20" stroke="#E2E8F0" strokeWidth="0.5" strokeDasharray="4" />
            {/* Y axis labels */}
            <text x="50" y="24" textAnchor="end" fill="#94A3B8" fontSize="10" fontFamily="DM Sans">100%</text>
            <text x="50" y="99" textAnchor="end" fill="#94A3B8" fontSize="10" fontFamily="DM Sans">50%</text>
            <text x="50" y="174" textAnchor="end" fill="#94A3B8" fontSize="10" fontFamily="DM Sans">0%</text>
            {/* X axis labels */}
            <text x="60" y="190" textAnchor="middle" fill="#94A3B8" fontSize="10" fontFamily="DM Sans">Day 1</text>
            <text x="235" y="190" textAnchor="middle" fill="#94A3B8" fontSize="10" fontFamily="DM Sans">Day 3</text>
            <text x="410" y="190" textAnchor="middle" fill="#94A3B8" fontSize="10" fontFamily="DM Sans">Day 7</text>
            <text x="585" y="190" textAnchor="middle" fill="#94A3B8" fontSize="10" fontFamily="DM Sans">Day 14</text>
            <text x="760" y="190" textAnchor="middle" fill="#94A3B8" fontSize="10" fontFamily="DM Sans">Day 30</text>
            {/* Forgetting curve (red) */}
            <path
              d="M60,20 C120,50 180,100 260,130 C340,150 450,160 580,165 C650,167 720,168 760,168"
              fill="none"
              stroke="#EF4444"
              strokeWidth="2.5"
              strokeDasharray="6,4"
              opacity="0.7"
              className="curve-path red-curve"
            />
            {/* Spaced repetition curve (gold) */}
            <path
              d="M60,20 C100,22 130,35 160,30 C180,26 200,40 235,35 C260,30 290,45 330,38 C360,32 390,48 430,40 C460,34 490,50 530,42 C560,36 590,52 630,44 C660,38 700,54 740,46 L760,44"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="2.5"
              className="curve-path gold-curve"
            />
            {/* Review markers on gold curve */}
            <circle cx="160" cy="30" r="4" fill="#D4AF37" opacity="0.8" className="review-marker m1" />
            <circle cx="330" cy="38" r="4" fill="#D4AF37" opacity="0.8" className="review-marker m2" />
            <circle cx="530" cy="42" r="4" fill="#D4AF37" opacity="0.8" className="review-marker m3" />
            <text x="160" y="16" textAnchor="middle" fill="#D4AF37" fontSize="9" fontFamily="DM Sans" fontWeight="600" className="review-marker m1">Review 1</text>
            <text x="330" y="24" textAnchor="middle" fill="#D4AF37" fontSize="9" fontFamily="DM Sans" fontWeight="600" className="review-marker m2">Review 2</text>
            <text x="530" y="28" textAnchor="middle" fill="#D4AF37" fontSize="9" fontFamily="DM Sans" fontWeight="600" className="review-marker m3">Review 3</text>
            {/* Area fill under gold curve */}
            <path
              d="M60,20 C100,22 130,35 160,30 C180,26 200,40 235,35 C260,30 290,45 330,38 C360,32 390,48 430,40 C460,34 490,50 530,42 C560,36 590,52 630,44 C660,38 700,54 740,46 L760,44 L760,170 L60,170 Z"
              fill="url(#goldGrad)"
              opacity="0.12"
            />
            <defs>
              <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
          <div className="curve-legend">
            <div className="legend-item">
              <div className="legend-dot" style={{ background: '#EF4444', opacity: 0.7 }} />
              Without revision (forgetting curve)
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ background: '#D4AF37' }} />
              With spaced repetition flashcards
            </div>
          </div>
        </div>

        {/* Curve Explanation */}
        <div style={{ maxWidth: 800, margin: '32px auto 0', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7, marginBottom: 12 }}>
            The chart above shows the <span style={{ color: '#EF4444', fontWeight: 600 }}>forgetting curve</span> (red) dropping sharply without revision, versus <span style={{ color: '#D4AF37', fontWeight: 600 }}>spaced repetition</span> (gold) maintaining high retention through strategic reviews.
          </p>
          <p style={{ fontSize: 13.5, color: '#94A3B8', lineHeight: 1.6 }}>
            Each review session resets your memory strength, pushing the next forgetting point further out. After just 3-4 reviews, knowledge moves from short-term to long-term memory.
          </p>
        </div>

        {/* Science Cards */}
        <div className="science-grid">
          <div className="science-card" data-animate>
            <h3>Why Flashcards Beat Re-reading</h3>
            <p>Research shows active recall is <span className="highlight">67% more effective</span> than re-reading notes. When you force your brain to retrieve an answer, you build stronger memory traces. Re-reading creates an illusion of competence. Flashcards reveal what you actually know.</p>
          </div>
          <div className="science-card" data-animate>
            <h3>The Forgetting Curve, Defeated</h3>
            <p>Without revision, you lose <span className="highlight">70% of new information within 24 hours</span>. Our spaced repetition algorithm interrupts this decay at the perfect moment, turning fragile short-term memories into permanent knowledge.</p>
          </div>
        </div>

        {/* Bridge to CTA */}
        <div style={{ maxWidth: 700, margin: '48px auto 0', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: '#1E293B', lineHeight: 1.7, marginBottom: 10, fontWeight: 500 }}>
            The evidence is clear: efficient, focused study habits consistently produce better results.
          </p>
          <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.65 }}>
            But efficiency is hard to sustain without the right setup. Flashcards, spaced repetition, personalized insights, and content you can trust. This is exactly where most aspirants fall short.
          </p>
        </div>
      </section>

      {/* === CTA BANNER === */}
      <section className="cta-banner">
        <div className="cta-left">
          <div className="cta-tag">Upgrade Your Prep</div>
          <h2>
            Revise Like a <span className="gold">Topper.</span>
          </h2>
          <p className="cta-desc">Get unlimited card creation, advanced spaced repetition analytics, priority AI mentor access, and exclusive subject decks crafted by toppers. Your competition is already ahead.</p>
          <div className="cta-actions">
            <button className="cta-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Upgrade Now
            </button>
            <div className="cta-social">
              <div className="cta-avatars">
                <div className="cta-av" style={{ background: '#FF6B6B' }}>RA</div>
                <div className="cta-av" style={{ background: '#4ECDC4' }}>PE</div>
                <div className="cta-av" style={{ background: '#8B5CF6' }}>NE</div>
                <div className="cta-av" style={{ background: '#F59E0B' }}>AG</div>
              </div>
              <span className="cta-social-text">
                <strong>12,000+</strong> aspirants learning smarter
              </span>
            </div>
          </div>
        </div>
        <div className="cta-right">
          <div className="cta-icon-circle">
            <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
              <rect x="2" y="6" width="16" height="12" rx="2" fill="rgba(255,255,255,.2)" stroke="#1A1A1A" />
              <rect x="6" y="4" width="16" height="12" rx="2" fill="rgba(255,255,255,.3)" stroke="#1A1A1A" />
              <line x1="10" y1="8" x2="18" y2="8" stroke="#1A1A1A" opacity="0.6" />
              <line x1="10" y1="11" x2="16" y2="11" stroke="#1A1A1A" opacity="0.6" />
            </svg>
          </div>
        </div>
      </section>

      <style jsx>{`
        .fc-science {
          font-family: 'DM Sans', sans-serif;
          color: #1e293b;
        }

        /* === HOW IT WORKS SECTION === */
        .how-section {
          padding: 64px 40px 40px;
          background: #f8fafc;
          position: relative;
        }
        .how-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 80%;
          height: 1px;
          background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
        }
        .how-header {
          text-align: center;
          margin-bottom: 48px;
        }
        .how-header h2 {
          font-family: 'Playfair Display', serif;
          font-size: 34px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 10px;
        }
        .how-header h2 .gold {
          color: #d4af37;
          font-style: italic;
        }
        .how-header p {
          font-size: 14.5px;
          color: #64748b;
          max-width: 500px;
          margin: 0 auto;
          line-height: 1.6;
        }

        /* Steps flow */
        .steps-flow {
          display: flex;
          justify-content: center;
          gap: 24px;
          max-width: 1100px;
          margin: 0 auto 56px;
          position: relative;
        }
        .step-card {
          flex: 1;
          max-width: 260px;
          background: #ffffff;
          border-radius: 16px;
          padding: 32px 24px 28px;
          text-align: center;
          border: 1px solid #e2e8f0;
          position: relative;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 0;
          transform: translateY(30px);
        }
        .step-card.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .step-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.06);
          border-color: rgba(212, 175, 55, 0.3);
        }
        .step-card:not(:last-child)::after {
          content: '';
          position: absolute;
          top: 50%;
          right: -24px;
          width: 24px;
          height: 2px;
          background: linear-gradient(90deg, #d4af37, rgba(212, 175, 55, 0.2));
          transform: translateY(-50%);
        }
        .step-icon {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 18px;
          position: relative;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
        }
        .step-icon :global(svg) {
          width: 32px;
          height: 32px;
          position: relative;
          z-index: 1;
        }
        .step-card h3 {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 10px;
        }
        .step-card p {
          font-size: 13px;
          color: #64748b;
          line-height: 1.65;
        }

        /* Science section */
        .science-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          max-width: 1000px;
          margin: 48px auto 48px;
        }
        .science-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 32px;
          border: 1px solid #e2e8f0;
          position: relative;
          overflow: hidden;
          opacity: 0;
          transform: translateY(24px);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .science-card.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .science-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #d4af37, #f59e0b);
        }
        .science-card h3 {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 12px;
        }
        .science-card p {
          font-size: 13.5px;
          color: #64748b;
          line-height: 1.7;
        }
        .science-card :global(.highlight) {
          color: #d4af37;
          font-weight: 600;
        }

        /* Forgetting curve viz */
        .curve-viz {
          max-width: 1000px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 16px;
          padding: 32px;
          border: 1px solid #e2e8f0;
          opacity: 0;
          transform: translateY(24px);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .curve-viz.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .curve-viz h3 {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 700;
          text-align: center;
          margin-bottom: 6px;
        }
        .curve-viz .curve-sub {
          text-align: center;
          font-size: 13px;
          color: #64748b;
          margin-bottom: 24px;
        }
        .curve-svg {
          width: 100%;
          height: 220px;
        }
        .curve-legend {
          display: flex;
          justify-content: center;
          gap: 28px;
          margin-top: 16px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #64748b;
        }
        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        /* Curve draw-in animation */
        .curve-path {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          transition: stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .curve-path.animated {
          stroke-dashoffset: 0;
        }
        .red-curve.animated {
          transition-delay: 0.3s;
        }
        .gold-curve.animated {
          transition-delay: 0.6s;
        }
        .review-marker {
          opacity: 0;
          transform: scale(0);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .review-marker.animated {
          opacity: 1;
          transform: scale(1);
        }
        .review-marker.m1.animated {
          transition-delay: 1s;
        }
        .review-marker.m2.animated {
          transition-delay: 1.4s;
        }
        .review-marker.m3.animated {
          transition-delay: 1.8s;
        }

        /* === CTA BANNER === */
        .cta-banner {
          margin: 24px 40px 48px;
          border-radius: 20px;
          background: linear-gradient(135deg, #0f1018 0%, #1a1c29 100%);
          position: relative;
          overflow: hidden;
          padding: 48px 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 40px;
        }
        .cta-banner::before {
          content: '';
          position: absolute;
          top: -100px;
          right: -100px;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(212, 175, 55, 0.08), transparent 70%);
        }
        .cta-left {
          flex: 1;
          position: relative;
          z-index: 1;
        }
        .cta-tag {
          font-size: 11px;
          font-weight: 700;
          color: #d4af37;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 14px;
        }
        .cta-banner h2 {
          font-family: 'Playfair Display', serif;
          font-size: 36px;
          color: #fff;
          line-height: 1.2;
          margin-bottom: 14px;
        }
        .cta-banner h2 .gold {
          color: #d4af37;
          font-style: italic;
        }
        .cta-banner .cta-desc {
          font-size: 14.5px;
          color: #b0b0b0;
          line-height: 1.65;
          max-width: 480px;
          margin-bottom: 24px;
        }
        .cta-actions {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        .cta-btn {
          background: linear-gradient(135deg, #d4af37, #f4c430);
          color: #0f1018;
          border: none;
          padding: 13px 28px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 20px rgba(212, 175, 55, 0.25);
        }
        .cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(212, 175, 55, 0.4);
        }
        .cta-btn :global(svg) {
          width: 18px;
          height: 18px;
        }
        .cta-social {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .cta-avatars {
          display: flex;
        }
        .cta-avatars .cta-av {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid #1a1c29;
          margin-left: -8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 700;
          color: #fff;
        }
        .cta-avatars .cta-av:first-child {
          margin-left: 0;
        }
        .cta-social-text {
          font-size: 12.5px;
          color: #999;
        }
        .cta-social-text strong {
          color: #ccc;
          font-weight: 600;
        }
        .cta-right {
          position: relative;
          z-index: 1;
          flex-shrink: 0;
        }
        .cta-icon-circle {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          border: 2px solid rgba(212, 175, 55, 0.3);
          background: radial-gradient(circle at 30% 30%, #f4c430, #d4af37);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 32px rgba(212, 175, 55, 0.2);
        }
        .cta-icon-circle :global(svg) {
          width: 52px;
          height: 52px;
          stroke: #1a1a1a;
          fill: none;
          stroke-width: 1.8;
          animation: cardFlip 3s ease-in-out infinite;
        }
        @keyframes cardFlip {
          0%,
          100% {
            transform: rotateY(0deg);
          }
          50% {
            transform: rotateY(180deg);
          }
        }

        /* Responsive */
        @media (max-width: 900px) {
          .steps-flow {
            flex-direction: column;
            align-items: center;
          }
          .science-grid {
            grid-template-columns: 1fr;
          }
          .cta-banner {
            flex-direction: column;
            text-align: center;
            padding: 36px 28px;
          }
          .cta-right {
            display: none;
          }
          .cta-actions {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
