'use client';

import React, { useEffect, useRef } from 'react';

/**
 * "How Our Mindmaps Work" + "Why Mindmaps Matter" + "Every Branch Engineered
 * for Clarity" + "Map Your Way to Mastery".
 *
 * Converted 1:1 from mindmaps_final_suri.html (the sections that follow the
 * "Choose a Subject" block). Styling is kept identical to the source via
 * scoped styled-jsx; CSS variables were inlined with their literal values and
 * the scroll-reveal / cinematic preview-mindmap animations replicate the
 * original IntersectionObserver scripts.
 */
export default function MindmapIntroSections({ onUpgradeClick }: { onUpgradeClick?: () => void } = {}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Scroll reveal.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('visible');
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    root.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Cinematic preview-mindmap demo.
  useEffect(() => {
    const root = rootRef.current;
    const svg = svgRef.current;
    if (!root || !svg) return;

    const centerNode = svg.querySelector<SVGRectElement>('.pm-center');
    if (!centerNode) return;

    const hint = svg.querySelector<SVGTextElement>('#pm-hint');
    const conns = Array.from(svg.querySelectorAll<SVGPathElement>('.pm-conn'));
    const branches = Array.from(svg.querySelectorAll<SVGGElement>('.pm-branch'));
    const subConns = Array.from(svg.querySelectorAll<SVGPathElement>('.pm-subconn'));
    const subNodes = Array.from(svg.querySelectorAll<SVGGElement>('.pm-subnodes'));

    const subConnsFor = (key: string) =>
      Array.from(svg.querySelectorAll<SVGPathElement>(`.pm-subconn.${key}-sc`));
    const subNodesFor = (key: string) => svg.querySelector<SVGGElement>(`.pm-subnodes.${key}-sn`);

    const eqBranch = svg.querySelector<SVGGElement>('.pm-branch[data-branch="eq"]');

    let state: 'idle' | 'running' | 'done' = 'idle';
    let timers: number[] = [];
    let viewBoxRaf: number | null = null;

    const clearTimers = () => {
      timers.forEach((t) => window.clearTimeout(t));
      timers = [];
      if (viewBoxRaf) {
        cancelAnimationFrame(viewBoxRaf);
        viewBoxRaf = null;
      }
    };

    const animateViewBox = (targetStr: string, duration: number) => {
      if (viewBoxRaf) cancelAnimationFrame(viewBoxRaf);
      const current = (svg.getAttribute('viewBox') || '').split(' ').map(Number);
      const target = targetStr.split(' ').map(Number);
      let startTime: number | null = null;

      const easeInOutCubic = (t: number) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const eased = easeInOutCubic(progress);
        const interpolated = current.map((c, i) => c + (target[i] - c) * eased);
        svg.setAttribute('viewBox', interpolated.map((v) => v.toFixed(2)).join(' '));
        viewBoxRaf = progress < 1 ? requestAnimationFrame(step) : null;
      };
      viewBoxRaf = requestAnimationFrame(step);
    };

    const resetAll = () => {
      clearTimers();
      conns.forEach((c) => c.classList.remove('pm-visible'));
      branches.forEach((b) => b.classList.remove('pm-visible', 'pm-highlight'));
      subConns.forEach((s) => s.classList.remove('pm-visible'));
      subNodes.forEach((s) => s.classList.remove('pm-visible'));
      svg.setAttribute('viewBox', '40 195 180 222');
      hint?.classList.remove('pm-hidden');
      centerNode.classList.add('pm-pulse');
      state = 'idle';
    };

    const after = (delay: number, fn: () => void) => {
      timers.push(window.setTimeout(fn, delay));
    };

    // Each branch reveals its sub-connectors then its sub-nodes, 300ms apart.
    const BRANCH_REVEALS: Array<[key: string, at: number]> = [
      ['eq', 3500],
      ['fr', 4000],
      ['ex', 4500],
      ['re', 5000],
      ['cu', 5500],
      ['rm', 6000],
    ];

    const runSequence = () => {
      resetAll();
      state = 'running';

      // PHASE 1: zoom out from the center close-up to show the branches.
      after(0, () => animateViewBox('5 25 430 530', 1200));
      conns.forEach((c, i) => after(300 + i * 90, () => c.classList.add('pm-visible')));
      branches.forEach((b, i) => after(500 + i * 110, () => b.classList.add('pm-visible')));
      after(400, () => hint?.classList.add('pm-hidden'));

      // PHASE 2: highlight "Right to Equality" once the zoom settles.
      after(1500, () => eqBranch?.classList.add('pm-highlight'));

      // PHASE 3: zoom out to the full area so sub-nodes have room.
      after(2200, () => animateViewBox('0 0 570 560', 1200));

      // PHASE 4: sub-nodes appear after that zoom completes.
      BRANCH_REVEALS.forEach(([key, at]) => {
        after(at, () => {
          subConnsFor(key).forEach((s, i) => after(i * 100, () => s.classList.add('pm-visible')));
        });
        after(at + 300, () => subNodesFor(key)?.classList.add('pm-visible'));
      });

      // PHASE 5: done.
      after(6700, () => {
        state = 'done';
        centerNode.classList.remove('pm-pulse');
      });
    };

    const skipToEnd = () => {
      clearTimers();
      conns.forEach((c) => c.classList.add('pm-visible'));
      branches.forEach((b) => b.classList.add('pm-visible'));
      eqBranch?.classList.add('pm-highlight');
      animateViewBox('0 0 570 560', 800);
      subConns.forEach((s) => s.classList.add('pm-visible'));
      subNodes.forEach((s) => s.classList.add('pm-visible'));
      hint?.classList.add('pm-hidden');
      centerNode.classList.remove('pm-pulse');
      state = 'done';
    };

    const onCenterClick = () => {
      if (state === 'idle' || state === 'done') runSequence();
      else skipToEnd();
    };
    centerNode.addEventListener('click', onCenterClick);

    // Click individual branches to toggle their sub-nodes.
    const branchHandlers = branches.map((branch) => {
      const handler = (e: Event) => {
        e.stopPropagation();
        if (state === 'idle') return;

        const key = branch.dataset.branch;
        if (!key) return;
        const sConns = subConnsFor(key);
        const sNodes = subNodesFor(key);

        if (branch.classList.contains('pm-highlight')) {
          branch.classList.remove('pm-highlight');
          sNodes?.classList.remove('pm-visible');
          sConns.forEach((s) => s.classList.remove('pm-visible'));
        } else {
          branch.classList.add('pm-highlight');
          animateViewBox('0 0 570 560', 800);
          sConns.forEach((s, i) => after(i * 100, () => s.classList.add('pm-visible')));
          after(200, () => sNodes?.classList.add('pm-visible'));
        }
      };
      branch.addEventListener('click', handler);
      return handler;
    });

    // Auto-play when the section scrolls into view (replays on every scroll back).
    const previewSection = root.querySelector('.preview-section');
    let sectionObserver: IntersectionObserver | null = null;
    if (previewSection) {
      sectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              resetAll();
              after(200, runSequence);
            } else if (state === 'done' || state === 'running') {
              resetAll();
            }
          });
        },
        { threshold: 0.3 }
      );
      sectionObserver.observe(previewSection);
    }

    return () => {
      clearTimers();
      sectionObserver?.disconnect();
      centerNode.removeEventListener('click', onCenterClick);
      branches.forEach((b, i) => b.removeEventListener('click', branchHandlers[i]));
    };
  }, []);

  return (
    <div ref={rootRef} className="mm-intro">
      {/* === HOW IT WORKS === */}
      <section className="how-section">
        <div className="section-title reveal" style={{ marginBottom: 32 }}>
          <h2>
            How Our <span className="italic-gold">Mindmaps</span> Work
          </h2>
          <p>A structured visual learning system designed for deep retention and exam-ready revision.</p>
        </div>
        <div className="steps-grid">
          <div className="step-card reveal reveal-delay-1">
            <div className="step-num">1</div>
            <div className="step-icon-box">
              <svg viewBox="0 0 260 120" fill="none" width="100%">
                <rect x="10" y="20" width="72" height="80" rx="10" fill="#fef5e6" stroke="#d4af37" strokeWidth="1" />
                <text x="46" y="50" textAnchor="middle" fill="#d4af37" fontSize="24">🏛</text>
                <text x="46" y="72" textAnchor="middle" fill="#374151" fontFamily="'DM Sans',sans-serif" fontSize="10" fontWeight="600">Polity</text>
                <text x="46" y="86" textAnchor="middle" fill="#9ca3af" fontFamily="'DM Sans',sans-serif" fontSize="8">6 maps</text>
                <rect x="94" y="20" width="72" height="80" rx="10" fill="#fff0e6" stroke="#f97316" strokeWidth="1" opacity="0.7" />
                <text x="130" y="50" textAnchor="middle" fill="#f97316" fontSize="24">📖</text>
                <text x="130" y="72" textAnchor="middle" fill="#374151" fontFamily="'DM Sans',sans-serif" fontSize="10" fontWeight="600">History</text>
                <text x="130" y="86" textAnchor="middle" fill="#9ca3af" fontFamily="'DM Sans',sans-serif" fontSize="8">4 maps</text>
                <rect x="178" y="20" width="72" height="80" rx="10" fill="#e8f0e6" stroke="#10b981" strokeWidth="1" opacity="0.7" />
                <text x="214" y="50" textAnchor="middle" fill="#10b981" fontSize="24">🌎</text>
                <text x="214" y="72" textAnchor="middle" fill="#374151" fontFamily="'DM Sans',sans-serif" fontSize="10" fontWeight="600">Geo</text>
                <text x="214" y="86" textAnchor="middle" fill="#9ca3af" fontFamily="'DM Sans',sans-serif" fontSize="8">3 maps</text>
              </svg>
            </div>
            <h3>Choose a Subject</h3>
            <p>Pick from Polity, History, Geography, Economy, Environment and more. Each subject has curated topic maps.</p>
          </div>

          <div className="step-card reveal reveal-delay-2">
            <div className="step-num">2</div>
            <div className="step-icon-box">
              <svg viewBox="0 0 260 120" fill="none" width="100%">
                {/* Elegant curved connectors stopping at circle edges */}
                <path d="M130,60 C105,60 72,44 48,34" stroke="rgba(124,58,237,0.35)" strokeWidth="1.5" fill="none" />
                <path d="M130,60 C105,60 72,76 48,86" stroke="rgba(124,58,237,0.35)" strokeWidth="1.5" fill="none" />
                <path d="M130,60 C155,60 188,44 212,34" stroke="rgba(212,175,55,0.35)" strokeWidth="1.5" fill="none" />
                <path d="M130,60 C155,60 188,76 212,86" stroke="rgba(20,184,166,0.35)" strokeWidth="1.5" fill="none" />
                {/* Central node on top */}
                <rect x="80" y="35" width="100" height="50" rx="14" fill="#1a1a2e" stroke="#7c3aed" strokeWidth="1.5" />
                <text x="130" y="56" textAnchor="middle" fill="#c4b5fd" fontFamily="'DM Sans',sans-serif" fontSize="10" fontWeight="600">Fundamental Rights</text>
                <text x="130" y="72" textAnchor="middle" fill="#9ca3af" fontFamily="'DM Sans',sans-serif" fontSize="8">Part III · Art.12-35</text>
                {/* Child nodes */}
                <circle cx="30" cy="25" r="22" fill="rgba(124,58,237,0.1)" stroke="rgba(124,58,237,0.2)" strokeWidth="1" />
                <text x="30" y="28" textAnchor="middle" fill="#a855f7" fontSize="6.5" fontWeight="500" fontFamily="'DM Sans',sans-serif">Equality</text>
                <circle cx="30" cy="95" r="22" fill="rgba(124,58,237,0.1)" stroke="rgba(124,58,237,0.2)" strokeWidth="1" />
                <text x="30" y="98" textAnchor="middle" fill="#a855f7" fontSize="6.5" fontWeight="500" fontFamily="'DM Sans',sans-serif">Freedom</text>
                <circle cx="230" cy="25" r="22" fill="rgba(212,175,55,0.1)" stroke="rgba(212,175,55,0.2)" strokeWidth="1" />
                <text x="230" y="28" textAnchor="middle" fill="#d4af37" fontSize="6.5" fontWeight="500" fontFamily="'DM Sans',sans-serif">Religion</text>
                <circle cx="230" cy="95" r="22" fill="rgba(20,184,166,0.1)" stroke="rgba(20,184,166,0.2)" strokeWidth="1" />
                <text x="230" y="98" textAnchor="middle" fill="#14b8a6" fontSize="6.5" fontWeight="500" fontFamily="'DM Sans',sans-serif">Remedies</text>
              </svg>
            </div>
            <h3>Explore the Map</h3>
            <p>Interact with the visual tree. Expand branches, read descriptions, and add personal notes.</p>
          </div>

          <div className="step-card reveal reveal-delay-3">
            <div className="step-num">3</div>
            <div className="step-icon-box">
              <svg viewBox="0 0 260 120" fill="none" width="100%">
                <rect x="30" y="20" width="200" height="16" rx="8" fill="#f0f0f0" />
                <rect x="30" y="20" width="160" height="16" rx="8" fill="url(#prog-grad)" />
                <text x="130" y="32" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="600" fontFamily="'DM Sans',sans-serif">78% Mastered</text>
                <text x="130" y="58" textAnchor="middle" fill="#10b981" fontSize="12" fontFamily="'DM Sans',sans-serif" fontWeight="600">✓ 5 of 6 branches covered</text>
                <text x="130" y="80" textAnchor="middle" fill="#d4af37" fontSize="12" fontFamily="'DM Sans',sans-serif" fontWeight="600">★ Key concepts highlighted</text>
                <defs>
                  <linearGradient id="prog-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h3>Master &amp; Track</h3>
            <p>Track your progress, mark branches as mastered, and revisit what needs work with visual progress indicators.</p>
          </div>
        </div>
      </section>

      {/* === WHY MINDMAPS === */}
      <section className="why-section">
        <div className="why-banner reveal">
          <div className="section-title">
            <h2>
              Why <span className="italic-gold">Mindmaps</span> Matter
            </h2>
            <p>Research-backed visual learning that transforms how you study, retain, and recall complex topics.</p>
          </div>
          <div className="why-grid">
            <div className="why-card reveal reveal-delay-1">
              <div className="why-icon" style={{ background: 'rgba(212,175,55,0.1)' }}>🧠</div>
              <h3>See the Big Picture</h3>
              <p>Mindmaps reveal how concepts connect hierarchically. Instead of linear notes, see entire topics at a glance with all their branches and relationships.</p>
              <div className="why-stat" style={{ background: 'rgba(212,175,55,0.08)', color: '#f5c563' }}>▲ 40% better concept linking</div>
            </div>
            <div className="why-card reveal reveal-delay-2">
              <div className="why-icon" style={{ background: 'rgba(124,58,237,0.1)' }}>🔴</div>
              <h3>Revise 3x Faster</h3>
              <p>Visual recall outperforms text-based revision. Our structured maps let you scan an entire subject in minutes, not hours, perfect for last-mile revision.</p>
              <div className="why-stat" style={{ background: 'rgba(124,58,237,0.08)', color: '#c4b5fd' }}>▲ 3x faster revision cycles</div>
            </div>
            <div className="why-card reveal reveal-delay-3">
              <div className="why-icon" style={{ background: 'rgba(16,185,129,0.1)' }}>🎯</div>
              <h3>Structured for Retention</h3>
              <p>Hierarchical organization mirrors how your brain naturally stores information. Better structure means stronger memory connections and faster recall during exams.</p>
              <div className="why-stat" style={{ background: 'rgba(16,185,129,0.08)', color: '#6ee7b7' }}>▲ Optimized for long-term memory</div>
            </div>
          </div>
        </div>
      </section>

      {/* === FEATURES === */}
      <section className="preview-section">
        <div className="preview-container">
          <div className="preview-text reveal">
            <h2>
              Every Branch <span className="italic-gold">Engineered</span> for Clarity
            </h2>
            <p>Our mindmaps are not just diagrams. They are fully interactive learning modules with structured content and visual clarity baked into every node.</p>
            <ul className="feature-list">
              <li>
                <div className="check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                </div>
                <span><strong>Expandable nodes</strong>: drill into any branch to see sub-topics, articles, case laws, and amendment details without leaving the map.</span>
              </li>
              <li>
                <div className="check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                </div>
                <span><strong>Color-coded branches</strong>: visually distinct categories make it easy to navigate complex topics and identify relationships at a glance.</span>
              </li>
              <li>
                <div className="check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                </div>
                <span><strong>Hierarchical structure</strong>: parent-child relationships make it easy to understand how concepts connect and build upon each other.</span>
              </li>
              <li>
                <div className="check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                </div>
                <span><strong>Interactive exploration</strong>: expand and collapse branches to focus on what matters, zoom in on details or zoom out for the big picture.</span>
              </li>
              <li>
                <div className="check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                </div>
                <span><strong>Mastery tracking</strong>: mark branches as mastered, track coverage per subject, and revisit what needs work.</span>
              </li>
            </ul>
          </div>

          <div className="preview-visual reveal reveal-delay-2" id="preview-container">
            <svg ref={svgRef} viewBox="5 80 430 460" fill="none" width="100%" id="preview-mindmap">
              <rect x="0" y="0" width="620" height="680" fill="#f9fafb" />

              {/* === MAIN CONNECTORS: center → branches === */}
              <path className="pm-conn" d="M140,268 C165,268 170,55 190,55" stroke="rgba(124,58,237,0.4)" strokeWidth="2" fill="none" />
              <path className="pm-conn" d="M140,268 C165,268 170,140 190,140" stroke="rgba(124,58,237,0.4)" strokeWidth="2" fill="none" />
              <path className="pm-conn" d="M140,268 C165,268 170,225 190,225" stroke="rgba(236,72,153,0.4)" strokeWidth="2" fill="none" />
              <path className="pm-conn" d="M140,268 C165,268 170,310 190,310" stroke="rgba(251,146,60,0.4)" strokeWidth="2" fill="none" />
              <path className="pm-conn" d="M140,268 C165,268 170,395 190,395" stroke="rgba(20,184,166,0.4)" strokeWidth="2" fill="none" />
              <path className="pm-conn" d="M140,268 C165,268 170,480 190,480" stroke="rgba(239,68,68,0.4)" strokeWidth="2" fill="none" />

              {/* === SUB-CONNECTORS: branches → sub-nodes === */}
              <path className="pm-subconn eq-sc" d="M310,55 C345,55 355,17 390,17" stroke="rgba(124,58,237,0.3)" strokeWidth="1.5" fill="none" />
              <path className="pm-subconn eq-sc" d="M310,55 C345,55 355,47 390,47" stroke="rgba(124,58,237,0.3)" strokeWidth="1.5" fill="none" />
              <path className="pm-subconn eq-sc" d="M310,55 C345,55 355,77 390,77" stroke="rgba(124,58,237,0.3)" strokeWidth="1.5" fill="none" />
              <path className="pm-subconn fr-sc" d="M310,140 C345,140 355,127 390,127" stroke="rgba(124,58,237,0.3)" strokeWidth="1.5" fill="none" />
              <path className="pm-subconn fr-sc" d="M310,140 C345,140 355,157 390,157" stroke="rgba(124,58,237,0.3)" strokeWidth="1.5" fill="none" />
              <path className="pm-subconn ex-sc" d="M310,225 C345,225 355,207 390,207" stroke="rgba(236,72,153,0.3)" strokeWidth="1.5" fill="none" />
              <path className="pm-subconn ex-sc" d="M310,225 C345,225 355,237 390,237" stroke="rgba(236,72,153,0.3)" strokeWidth="1.5" fill="none" />
              <path className="pm-subconn re-sc" d="M310,310 C345,310 355,292 390,292" stroke="rgba(251,146,60,0.3)" strokeWidth="1.5" fill="none" />
              <path className="pm-subconn re-sc" d="M310,310 C345,310 355,322 390,322" stroke="rgba(251,146,60,0.3)" strokeWidth="1.5" fill="none" />
              <path className="pm-subconn re-sc" d="M310,310 C345,310 355,352 390,352" stroke="rgba(251,146,60,0.3)" strokeWidth="1.5" fill="none" />
              <path className="pm-subconn cu-sc" d="M310,395 C345,395 355,377 390,377" stroke="rgba(20,184,166,0.3)" strokeWidth="1.5" fill="none" />
              <path className="pm-subconn cu-sc" d="M310,395 C345,395 355,407 390,407" stroke="rgba(20,184,166,0.3)" strokeWidth="1.5" fill="none" />
              <path className="pm-subconn rm-sc" d="M310,480 C345,480 355,462 390,462" stroke="rgba(239,68,68,0.3)" strokeWidth="1.5" fill="none" />
              <path className="pm-subconn rm-sc" d="M310,480 C345,480 355,492 390,492" stroke="rgba(239,68,68,0.3)" strokeWidth="1.5" fill="none" />
              <path className="pm-subconn rm-sc" d="M310,480 C345,480 355,522 390,522" stroke="rgba(239,68,68,0.3)" strokeWidth="1.5" fill="none" />

              {/* === CENTRAL NODE (always visible) === */}
              <rect
                className="pm-center"
                id="pm-center-node"
                x="10"
                y="240"
                width="130"
                height="56"
                rx="14"
                fill="#0f172a"
                style={{ cursor: 'pointer', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}
              />
              <text x="75" y="264" textAnchor="middle" fill="#ffffff" fontFamily="'Cormorant Garamond',serif" fontSize="14" fontWeight="700" pointerEvents="none">Fundamental Rights</text>
              <text x="75" y="282" textAnchor="middle" fill="#94a3b8" fontFamily="'DM Sans',sans-serif" fontSize="8.5" pointerEvents="none">Part III · Art. 12-35</text>

              {/* === BRANCH CARDS === */}
              <g className="pm-branch" data-branch="eq" style={{ cursor: 'pointer' }}>
                <rect x="190" y="30" width="120" height="50" rx="10" fill="#ffffff" stroke="#e5e7eb" strokeWidth="1" />
                <rect x="190" y="30" width="4" height="50" rx="2" fill="#7c3aed" />
                <text x="204" y="51" fill="#1f2937" fontFamily="'DM Sans',sans-serif" fontSize="10" fontWeight="600" pointerEvents="none">Right to Equality</text>
                <text x="204" y="67" fill="#6b7280" fontFamily="'DM Sans',sans-serif" fontSize="7.5" pointerEvents="none">Art. 14-18 · 5 nodes</text>
                <circle cx="298" cy="55" r="11" fill="#7c3aed" />
                <path d="M295,52 L301,55 L295,58 Z" fill="#ffffff" pointerEvents="none" />
              </g>

              <g className="pm-branch" data-branch="fr" style={{ cursor: 'pointer' }}>
                <rect x="190" y="115" width="120" height="50" rx="10" fill="#ffffff" stroke="#e5e7eb" strokeWidth="1" />
                <rect x="190" y="115" width="4" height="50" rx="2" fill="#7c3aed" />
                <text x="204" y="136" fill="#1f2937" fontFamily="'DM Sans',sans-serif" fontSize="10" fontWeight="600" pointerEvents="none">Right to Freedom</text>
                <text x="204" y="152" fill="#6b7280" fontFamily="'DM Sans',sans-serif" fontSize="7.5" pointerEvents="none">Art. 19-22 · 4 nodes</text>
                <circle cx="298" cy="140" r="11" fill="#7c3aed" />
                <path d="M295,137 L301,140 L295,143 Z" fill="#ffffff" pointerEvents="none" />
              </g>

              <g className="pm-branch" data-branch="ex" style={{ cursor: 'pointer' }}>
                <rect x="190" y="200" width="120" height="50" rx="10" fill="#ffffff" stroke="#e5e7eb" strokeWidth="1" />
                <rect x="190" y="200" width="4" height="50" rx="2" fill="#ec4899" />
                <text x="204" y="221" fill="#1f2937" fontFamily="'DM Sans',sans-serif" fontSize="10" fontWeight="600" pointerEvents="none">Against Exploitation</text>
                <text x="204" y="237" fill="#6b7280" fontFamily="'DM Sans',sans-serif" fontSize="7.5" pointerEvents="none">Art. 23-24 · 2 nodes</text>
                <circle cx="298" cy="225" r="11" fill="#ec4899" />
                <path d="M295,222 L301,225 L295,228 Z" fill="#ffffff" pointerEvents="none" />
              </g>

              <g className="pm-branch" data-branch="re" style={{ cursor: 'pointer' }}>
                <rect x="190" y="285" width="120" height="50" rx="10" fill="#ffffff" stroke="#e5e7eb" strokeWidth="1" />
                <rect x="190" y="285" width="4" height="50" rx="2" fill="#f59e0b" />
                <text x="204" y="306" fill="#1f2937" fontFamily="'DM Sans',sans-serif" fontSize="10" fontWeight="600" pointerEvents="none">Right to Religion</text>
                <text x="204" y="322" fill="#6b7280" fontFamily="'DM Sans',sans-serif" fontSize="7.5" pointerEvents="none">Art. 25-28 · 4 nodes</text>
                <circle cx="298" cy="310" r="11" fill="#f59e0b" />
                <path d="M295,307 L301,310 L295,313 Z" fill="#ffffff" pointerEvents="none" />
              </g>

              <g className="pm-branch" data-branch="cu" style={{ cursor: 'pointer' }}>
                <rect x="190" y="370" width="120" height="50" rx="10" fill="#ffffff" stroke="#e5e7eb" strokeWidth="1" />
                <rect x="190" y="370" width="4" height="50" rx="2" fill="#14b8a6" />
                <text x="204" y="391" fill="#1f2937" fontFamily="'DM Sans',sans-serif" fontSize="10" fontWeight="600" pointerEvents="none">Cultural &amp; Edu.</text>
                <text x="204" y="407" fill="#6b7280" fontFamily="'DM Sans',sans-serif" fontSize="7.5" pointerEvents="none">Art. 29-30 · 2 nodes</text>
                <circle cx="298" cy="395" r="11" fill="#14b8a6" />
                <path d="M295,392 L301,395 L295,398 Z" fill="#ffffff" pointerEvents="none" />
              </g>

              <g className="pm-branch" data-branch="rm" style={{ cursor: 'pointer' }}>
                <rect x="190" y="455" width="120" height="50" rx="10" fill="#ffffff" stroke="#e5e7eb" strokeWidth="1" />
                <rect x="190" y="455" width="4" height="50" rx="2" fill="#ef4444" />
                <text x="204" y="476" fill="#1f2937" fontFamily="'DM Sans',sans-serif" fontSize="10" fontWeight="600" pointerEvents="none">Const. Remedies</text>
                <text x="204" y="492" fill="#6b7280" fontFamily="'DM Sans',sans-serif" fontSize="7.5" pointerEvents="none">Art. 32-35 · 4 nodes</text>
                <circle cx="298" cy="480" r="11" fill="#ef4444" />
                <path d="M295,477 L301,480 L295,483 Z" fill="#ffffff" pointerEvents="none" />
              </g>

              {/* === SUB-NODES (far right) === */}
              <g className="pm-subnodes eq-sn">
                <rect x="390" y="4" width="150" height="26" rx="7" fill="#faf5ff" stroke="rgba(124,58,237,0.2)" strokeWidth="1" />
                <text x="465" y="21" textAnchor="middle" fill="#7c3aed" fontFamily="'DM Sans',sans-serif" fontSize="8.5" fontWeight="500" pointerEvents="none">Art. 14 · Equality before Law</text>
                <rect x="390" y="34" width="150" height="26" rx="7" fill="#faf5ff" stroke="rgba(124,58,237,0.2)" strokeWidth="1" />
                <text x="465" y="51" textAnchor="middle" fill="#7c3aed" fontFamily="'DM Sans',sans-serif" fontSize="8.5" fontWeight="500" pointerEvents="none">Art. 15 · No Discrimination</text>
                <rect x="390" y="64" width="150" height="26" rx="7" fill="#faf5ff" stroke="rgba(124,58,237,0.2)" strokeWidth="1" />
                <text x="465" y="81" textAnchor="middle" fill="#7c3aed" fontFamily="'DM Sans',sans-serif" fontSize="8.5" fontWeight="500" pointerEvents="none">Art. 16 · Equal Opportunity</text>
              </g>

              <g className="pm-subnodes fr-sn">
                <rect x="390" y="114" width="150" height="26" rx="7" fill="#faf5ff" stroke="rgba(124,58,237,0.2)" strokeWidth="1" />
                <text x="465" y="131" textAnchor="middle" fill="#7c3aed" fontFamily="'DM Sans',sans-serif" fontSize="8.5" fontWeight="500" pointerEvents="none">Art. 19 · Six Freedoms</text>
                <rect x="390" y="144" width="150" height="26" rx="7" fill="#faf5ff" stroke="rgba(124,58,237,0.2)" strokeWidth="1" />
                <text x="465" y="161" textAnchor="middle" fill="#7c3aed" fontFamily="'DM Sans',sans-serif" fontSize="8.5" fontWeight="500" pointerEvents="none">Art. 21 · Life &amp; Liberty</text>
              </g>

              <g className="pm-subnodes ex-sn">
                <rect x="390" y="194" width="150" height="26" rx="7" fill="#fdf2f8" stroke="rgba(236,72,153,0.2)" strokeWidth="1" />
                <text x="465" y="211" textAnchor="middle" fill="#ec4899" fontFamily="'DM Sans',sans-serif" fontSize="8.5" fontWeight="500" pointerEvents="none">Art. 23 · No Trafficking</text>
                <rect x="390" y="224" width="150" height="26" rx="7" fill="#fdf2f8" stroke="rgba(236,72,153,0.2)" strokeWidth="1" />
                <text x="465" y="241" textAnchor="middle" fill="#ec4899" fontFamily="'DM Sans',sans-serif" fontSize="8.5" fontWeight="500" pointerEvents="none">Art. 24 · No Child Labour</text>
              </g>

              <g className="pm-subnodes re-sn">
                <rect x="390" y="279" width="150" height="26" rx="7" fill="#fff7ed" stroke="rgba(251,146,60,0.2)" strokeWidth="1" />
                <text x="465" y="296" textAnchor="middle" fill="#f59e0b" fontFamily="'DM Sans',sans-serif" fontSize="8.5" fontWeight="500" pointerEvents="none">Art. 25 · Freedom of Faith</text>
                <rect x="390" y="309" width="150" height="26" rx="7" fill="#fff7ed" stroke="rgba(251,146,60,0.2)" strokeWidth="1" />
                <text x="465" y="326" textAnchor="middle" fill="#f59e0b" fontFamily="'DM Sans',sans-serif" fontSize="8.5" fontWeight="500" pointerEvents="none">Art. 26 · Religious Affairs</text>
                <rect x="390" y="339" width="150" height="26" rx="7" fill="#fff7ed" stroke="rgba(251,146,60,0.2)" strokeWidth="1" />
                <text x="465" y="356" textAnchor="middle" fill="#f59e0b" fontFamily="'DM Sans',sans-serif" fontSize="8.5" fontWeight="500" pointerEvents="none">Art. 28 · No Religious Instr.</text>
              </g>

              <g className="pm-subnodes cu-sn">
                <rect x="390" y="364" width="150" height="26" rx="7" fill="#f0fdfa" stroke="rgba(20,184,166,0.2)" strokeWidth="1" />
                <text x="465" y="381" textAnchor="middle" fill="#14b8a6" fontFamily="'DM Sans',sans-serif" fontSize="8.5" fontWeight="500" pointerEvents="none">Art. 29 · Minority Rights</text>
                <rect x="390" y="394" width="150" height="26" rx="7" fill="#f0fdfa" stroke="rgba(20,184,166,0.2)" strokeWidth="1" />
                <text x="465" y="411" textAnchor="middle" fill="#14b8a6" fontFamily="'DM Sans',sans-serif" fontSize="8.5" fontWeight="500" pointerEvents="none">Art. 30 · Edu. Institutions</text>
              </g>

              <g className="pm-subnodes rm-sn">
                <rect x="390" y="449" width="150" height="26" rx="7" fill="#fef2f2" stroke="rgba(239,68,68,0.2)" strokeWidth="1" />
                <text x="465" y="466" textAnchor="middle" fill="#ef4444" fontFamily="'DM Sans',sans-serif" fontSize="8.5" fontWeight="500" pointerEvents="none">Art. 32 · Constitutional Remedy</text>
                <rect x="390" y="479" width="150" height="26" rx="7" fill="#fef2f2" stroke="rgba(239,68,68,0.2)" strokeWidth="1" />
                <text x="465" y="496" textAnchor="middle" fill="#ef4444" fontFamily="'DM Sans',sans-serif" fontSize="8.5" fontWeight="500" pointerEvents="none">Art. 33 · Parliament Power</text>
                <rect x="390" y="509" width="150" height="26" rx="7" fill="#fef2f2" stroke="rgba(239,68,68,0.2)" strokeWidth="1" />
                <text x="465" y="526" textAnchor="middle" fill="#ef4444" fontFamily="'DM Sans',sans-serif" fontSize="8.5" fontWeight="500" pointerEvents="none">Art. 35 · Legislation</text>
              </g>

              <text id="pm-hint" x="310" y="660" textAnchor="middle" fill="#9ca3af" fontFamily="'DM Sans',sans-serif" fontSize="10" opacity="0.6" pointerEvents="none">
                <tspan>💡 Click the center node to explore</tspan>
              </text>
            </svg>
          </div>
        </div>
      </section>

      {/* === CTA BANNER === */}
      <section className="cta-section">
        <div className="cta-banner reveal">
          <div className="cta-left">
            <div className="cta-pre">Upgrade Your Prep</div>
            <h2>
              Map Your Way to <span className="gold-italic">Mastery.</span>
            </h2>
            <p className="cta-body">Unlock unlimited mindmap creation, smart auto-layouts, and beautifully structured visual learning. Transform complex topics into clear, memorable maps that stick.</p>
            <div className="cta-action-row">
              <button type="button" className="cta-btn" onClick={onUpgradeClick}><span>⭐</span> Upgrade</button>
              <div className="cta-social" aria-label="15,000 plus aspirants learning smarter">
                <div className="avatar-stack">
                  <div className="badge" style={{ background: '#f59e0b' }}>UP</div>
                  <div className="badge" style={{ background: '#ef4444' }}>CS</div>
                  <div className="badge" style={{ background: '#14b8a6' }}>NE</div>
                  <div className="badge" style={{ background: '#3b82f6' }}>AG</div>
                </div>
                <span>15,000+ aspirants learning smarter</span>
              </div>
            </div>
          </div>
          <div className="cta-right">
            <div className="cta-circle">
              <div className="cta-circle-inner">
                <svg className="cta-mindmap-icon" width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
                  <circle className="signal-ring" cx="40" cy="40" r="14" fill="none" />
                  <circle className="signal-ring outer" cx="40" cy="40" r="19" fill="none" />
                  <line className="link-main" style={{ '--d': '.05s' } as React.CSSProperties} x1="40" y1="40" x2="12" y2="18" stroke="#f5c563" strokeWidth="2" strokeLinecap="round" />
                  <line className="link-main" style={{ '--d': '.35s' } as React.CSSProperties} x1="40" y1="40" x2="12" y2="62" stroke="#f5c563" strokeWidth="2" strokeLinecap="round" />
                  <line className="link-main" style={{ '--d': '.65s' } as React.CSSProperties} x1="40" y1="40" x2="68" y2="18" stroke="#f5c563" strokeWidth="2" strokeLinecap="round" />
                  <line className="link-main" style={{ '--d': '.95s' } as React.CSSProperties} x1="40" y1="40" x2="68" y2="62" stroke="#f5c563" strokeWidth="2" strokeLinecap="round" />
                  <circle className="center-node" cx="40" cy="40" r="10" fill="#d4af37" />
                  <circle className="branch-node" style={{ '--d': '.05s' } as React.CSSProperties} cx="12" cy="18" r="6" fill="rgba(212,175,55,0.3)" stroke="#d4af37" strokeWidth="1.5" />
                  <circle className="branch-node" style={{ '--d': '.35s' } as React.CSSProperties} cx="12" cy="62" r="6" fill="rgba(212,175,55,0.3)" stroke="#d4af37" strokeWidth="1.5" />
                  <circle className="branch-node" style={{ '--d': '.65s' } as React.CSSProperties} cx="68" cy="18" r="6" fill="rgba(212,175,55,0.3)" stroke="#d4af37" strokeWidth="1.5" />
                  <circle className="branch-node" style={{ '--d': '.95s' } as React.CSSProperties} cx="68" cy="62" r="6" fill="rgba(212,175,55,0.3)" stroke="#d4af37" strokeWidth="1.5" />
                  <line className="link-leaf" style={{ '--d': '1.15s' } as React.CSSProperties} x1="12" y1="18" x2="2" y2="6" stroke="rgba(212,175,55,0.48)" strokeWidth="1" strokeLinecap="round" />
                  <line className="link-leaf" style={{ '--d': '1.35s' } as React.CSSProperties} x1="12" y1="18" x2="2" y2="30" stroke="rgba(212,175,55,0.48)" strokeWidth="1" strokeLinecap="round" />
                  <line className="link-leaf" style={{ '--d': '1.55s' } as React.CSSProperties} x1="68" y1="18" x2="78" y2="6" stroke="rgba(212,175,55,0.48)" strokeWidth="1" strokeLinecap="round" />
                  <line className="link-leaf" style={{ '--d': '1.75s' } as React.CSSProperties} x1="68" y1="62" x2="78" y2="74" stroke="rgba(212,175,55,0.48)" strokeWidth="1" strokeLinecap="round" />
                  <circle className="leaf-node" style={{ '--d': '1.15s' } as React.CSSProperties} cx="2" cy="6" r="3" fill="rgba(245,197,99,0.55)" />
                  <circle className="leaf-node" style={{ '--d': '1.35s' } as React.CSSProperties} cx="2" cy="30" r="3" fill="rgba(245,197,99,0.55)" />
                  <circle className="leaf-node" style={{ '--d': '1.55s' } as React.CSSProperties} cx="78" cy="6" r="3" fill="rgba(245,197,99,0.55)" />
                  <circle className="leaf-node" style={{ '--d': '1.75s' } as React.CSSProperties} cx="78" cy="74" r="3" fill="rgba(245,197,99,0.55)" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .mm-intro {
          font-family: var(--font-dm-sans), 'DM Sans', system-ui, sans-serif;
          color: #1e293b;
          overflow-x: hidden;
        }

        /* === SECTION SHARED === */
        .section-title {
          text-align: center;
          margin-bottom: 56px;
        }
        .section-title h2 {
          font-family: var(--font-cormorant-garamond), 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(28px, 3.5vw, 44px);
          font-weight: 700;
          color: #1e293b;
          line-height: 1.2;
        }
        .section-title h2 .italic-gold {
          font-style: italic;
          color: #d4af37;
        }
        .section-title p {
          font-size: 15px;
          color: #6b7280;
          margin-top: 10px;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }

        /* === HOW IT WORKS === */
        .how-section {
          padding: 80px 40px;
          background: #f5f5fa;
        }
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          max-width: 1000px;
          margin: 0 auto;
          position: relative;
        }
        .step-card {
          text-align: center;
          position: relative;
          z-index: 1;
        }
        .step-num {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-cormorant-garamond), 'Cormorant Garamond', Georgia, serif;
          font-size: 24px;
          font-weight: 700;
          color: #0a0e17;
          margin-bottom: 20px;
          position: relative;
        }
        .step-num::after {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px dashed;
          opacity: 0.3;
          animation: mmStepNumSpin 12s linear infinite;
        }
        /* Named uniquely: styled-jsx emits @keyframes globally, so a bare
           "spin"/"pulse" would clobber Tailwind's animate-spin/animate-pulse. */
        @keyframes mmStepNumSpin {
          to {
            transform: rotate(360deg);
          }
        }
        .step-card:nth-child(1) .step-num {
          background: linear-gradient(135deg, #d4af37, #f5c563);
        }
        .step-card:nth-child(1) .step-num::after {
          border-color: #d4af37;
        }
        .step-card:nth-child(2) .step-num {
          background: linear-gradient(135deg, #e8a87c, #f5c6a8);
        }
        .step-card:nth-child(2) .step-num::after {
          border-color: #e8a87c;
        }
        .step-card:nth-child(3) .step-num {
          background: linear-gradient(135deg, #14b8a6, #34d399);
        }
        .step-card:nth-child(3) .step-num::after {
          border-color: #14b8a6;
        }
        .step-card h3 {
          font-family: var(--font-cormorant-garamond), 'Cormorant Garamond', Georgia, serif;
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 10px;
          color: #1e293b;
        }
        .step-card p {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.7;
          max-width: 260px;
          margin: 0 auto;
        }
        .step-icon-box {
          width: 100%;
          max-width: 260px;
          margin: 0 auto 20px;
          background: #ffffff;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(0, 0, 0, 0.04);
        }

        /* === WHY MINDMAPS === */
        .why-section {
          padding: 80px 40px;
          background: #f5f5fa;
        }
        /* Card treatment matches .cta-banner ("Map Your Way to Mastery") 1:1 —
           same max-width, border-radius and padding — so it sits centered with
           consistent side margins instead of bleeding to the container edges. */
        .why-banner {
          max-width: 1000px;
          margin: 0 auto;
          background: linear-gradient(180deg, #0a0e17 0%, #111827 100%);
          border-radius: 24px;
          padding: 60px 64px;
          position: relative;
          overflow: hidden;
        }
        .why-banner::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          background-size: 28px 28px;
        }
        .why-section .section-title h2 {
          color: #ffffff;
        }
        .why-section .section-title p {
          color: #cccccc;
        }
        .why-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          max-width: 960px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }
        .why-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 28px 24px;
          transition: all 0.4s;
          backdrop-filter: blur(4px);
        }
        .why-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(212, 175, 55, 0.2);
          transform: translateY(-4px);
        }
        .why-card .why-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
          font-size: 20px;
        }
        .why-card h3 {
          font-family: var(--font-cormorant-garamond), 'Cormorant Garamond', Georgia, serif;
          font-size: 19px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 8px;
        }
        .why-card p {
          font-size: 13px;
          color: #cccccc;
          line-height: 1.65;
        }
        .why-card .why-stat {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 12px;
          padding: 5px 12px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        /* === FEATURE PREVIEW === */
        .preview-section {
          padding: 80px 40px;
          background: #f5f5fa;
        }
        .preview-container {
          max-width: 1000px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: center;
        }
        .preview-visual {
          background: #ffffff;
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 8px 40px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(0, 0, 0, 0.04);
          position: relative;
          overflow: hidden;
        }
        .preview-visual::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(212, 175, 55, 0.05) 0%, transparent 70%);
        }
        .preview-text h2 {
          font-family: var(--font-cormorant-garamond), 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(28px, 3vw, 40px);
          font-weight: 700;
          line-height: 1.2;
          margin-bottom: 16px;
        }
        .preview-text h2 .italic-gold {
          font-style: italic;
          color: #d4af37;
        }
        .preview-text p {
          font-size: 15px;
          color: #6b7280;
          line-height: 1.8;
          margin-bottom: 24px;
        }
        .feature-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .feature-list li {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.04);
          font-size: 14px;
          color: #374151;
          line-height: 1.6;
        }
        .feature-list li:last-child {
          border-bottom: none;
        }
        .feature-list .check {
          width: 22px;
          height: 22px;
          background: #d1fae5;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .feature-list .check svg {
          width: 12px;
          height: 12px;
          color: #10b981;
        }

        /* Connector draw animation */
        #preview-mindmap .pm-conn {
          stroke-dasharray: 300;
          stroke-dashoffset: 300;
          transition: stroke-dashoffset 0.9s cubic-bezier(0.4, 0, 0.2, 1);
        }
        #preview-mindmap .pm-conn.pm-visible {
          stroke-dashoffset: 0;
        }

        /* Branch cards fade in */
        #preview-mindmap .pm-branch {
          opacity: 0;
          transform: translateX(-6px);
          transition: opacity 0.55s cubic-bezier(0.4, 0, 0.2, 1), transform 0.55s cubic-bezier(0.4, 0, 0.2, 1);
        }
        #preview-mindmap .pm-branch.pm-visible {
          opacity: 1;
          transform: translateX(0);
        }
        #preview-mindmap .pm-branch.pm-highlight rect:first-child {
          stroke-width: 2 !important;
          stroke: #7c3aed !important;
          filter: drop-shadow(0 4px 12px rgba(124, 58, 237, 0.2));
        }
        #preview-mindmap .pm-branch.pm-highlight circle {
          filter: drop-shadow(0 0 10px rgba(124, 58, 237, 0.5));
          animation: pmBtnPulse 0.8s ease-in-out 2;
        }
        @keyframes pmBtnPulse {
          0%,
          100% {
            r: 11;
          }
          50% {
            r: 14;
          }
        }

        /* Central node */
        #preview-mindmap .pm-center {
          transition: filter 0.3s ease;
        }
        #preview-mindmap .pm-center:hover {
          filter: drop-shadow(0 6px 20px rgba(15, 23, 42, 0.3));
        }
        #preview-mindmap .pm-center.pm-pulse {
          animation: pmCenterPulse 2s ease-in-out infinite;
        }
        @keyframes pmCenterPulse {
          0%,
          100% {
            filter: drop-shadow(0 4px 12px rgba(15, 23, 42, 0.15));
          }
          50% {
            filter: drop-shadow(0 8px 24px rgba(15, 23, 42, 0.35));
          }
        }

        /* Sub-branch connectors */
        #preview-mindmap .pm-subconn {
          stroke-dasharray: 80;
          stroke-dashoffset: 80;
          transition: stroke-dashoffset 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }
        #preview-mindmap .pm-subconn.pm-visible {
          stroke-dashoffset: 0;
        }

        /* Sub-nodes fade in */
        #preview-mindmap .pm-subnodes {
          opacity: 0;
          transform: translateX(-8px);
          transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
        }
        #preview-mindmap .pm-subnodes.pm-visible {
          opacity: 1;
          transform: translateX(0);
        }

        /* Hint fade */
        #pm-hint {
          transition: opacity 0.4s ease;
        }
        #pm-hint.pm-hidden {
          opacity: 0 !important;
        }

        /* === CTA BANNER === */
        .cta-section {
          padding: 80px 40px;
          background: #f5f5fa;
        }
        .cta-banner {
          max-width: 1000px;
          margin: 0 auto;
          background: linear-gradient(135deg, #1a1a1e 0%, #0f1118 50%, #1a1a1e 100%);
          border-radius: 24px;
          padding: 60px 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.04);
        }
        .cta-banner::before {
          content: '';
          position: absolute;
          top: -100px;
          right: -100px;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .cta-banner::after {
          content: '';
          position: absolute;
          bottom: -80px;
          left: -80px;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(124, 58, 237, 0.06) 0%, transparent 70%);
          pointer-events: none;
        }
        .cta-left {
          flex: 1;
          position: relative;
          z-index: 1;
        }
        .cta-pre {
          font-size: 12px;
          font-weight: 600;
          color: #d4af37;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 14px;
        }
        .cta-left h2 {
          font-family: var(--font-cormorant-garamond), 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(28px, 3.5vw, 44px);
          font-weight: 700;
          color: #ffffff;
          line-height: 1.15;
          margin-bottom: 16px;
        }
        .cta-left h2 .gold-italic {
          color: #f5c563;
          font-style: italic;
        }
        .cta-left .cta-body {
          font-size: 14px;
          color: #cccccc;
          line-height: 1.8;
          max-width: 500px;
          margin-bottom: 28px;
        }
        .cta-action-row {
          display: flex;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
          margin-top: 4px;
        }
        .cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #d4af37, #f5c563);
          color: #0a0e17;
          padding: 14px 32px;
          border-radius: 12px;
          font-family: var(--font-dm-sans), 'DM Sans', system-ui, sans-serif;
          font-size: 15px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 20px rgba(212, 175, 55, 0.3);
        }
        .cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(212, 175, 55, 0.4);
        }
        .cta-social {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          min-height: 40px;
        }
        .cta-social .avatar-stack {
          display: flex;
          align-items: center;
        }
        .cta-social .badge {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          font-weight: 800;
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          border: 1.5px solid #111827;
          letter-spacing: -0.2px;
        }
        .cta-social .badge + .badge {
          margin-left: -5px;
        }
        .cta-social span {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.86);
          font-weight: 600;
          white-space: nowrap;
        }
        .cta-right {
          position: relative;
          z-index: 1;
          flex-shrink: 0;
        }
        .cta-circle {
          width: 180px;
          height: 180px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(212, 175, 55, 0.05));
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .cta-circle::before {
          content: '';
          position: absolute;
          inset: -12px;
          border-radius: 50%;
          border: 1px solid rgba(212, 175, 55, 0.1);
          animation: mmCtaRingPulse 3s ease-in-out infinite;
        }
        .cta-circle::after {
          content: '';
          position: absolute;
          inset: -24px;
          border-radius: 50%;
          border: 1px solid rgba(212, 175, 55, 0.05);
          animation: mmCtaRingPulse 3s ease-in-out infinite 0.5s;
        }
        @keyframes mmCtaRingPulse {
          0%,
          100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }
        .cta-circle-inner {
          font-size: 64px;
          filter: drop-shadow(0 0 30px rgba(212, 175, 55, 0.4));
          animation: mindmapFloat 5.5s ease-in-out infinite;
        }
        .cta-mindmap-icon {
          overflow: visible;
        }
        .cta-mindmap-icon .signal-ring {
          transform-box: fill-box;
          transform-origin: center;
          stroke: #f5c563;
          stroke-width: 1.2;
          opacity: 0;
          animation: signalRing 3.4s ease-out infinite;
        }
        .cta-mindmap-icon .signal-ring.outer {
          animation-delay: 1.1s;
        }
        .cta-mindmap-icon .link-main,
        .cta-mindmap-icon .link-leaf {
          stroke-dasharray: 70;
          stroke-dashoffset: 70;
          animation: mapLineDraw 4s cubic-bezier(0.16, 1, 0.3, 1) infinite;
          animation-delay: var(--d, 0s);
        }
        .cta-mindmap-icon .link-leaf {
          stroke-dasharray: 28;
          stroke-dashoffset: 28;
        }
        .cta-mindmap-icon .center-node {
          transform-box: fill-box;
          transform-origin: center;
          animation: centerPulse 2.4s ease-in-out infinite;
          filter: drop-shadow(0 0 10px rgba(245, 197, 99, 0.45));
        }
        .cta-mindmap-icon .branch-node {
          transform-box: fill-box;
          transform-origin: center;
          animation: nodeBloom 4s ease-in-out infinite;
          animation-delay: calc(var(--d, 0s) + 0.35s);
        }
        .cta-mindmap-icon .leaf-node {
          transform-box: fill-box;
          transform-origin: center;
          animation: leafTwinkle 3.6s ease-in-out infinite;
          animation-delay: var(--d, 0s);
        }
        @keyframes mindmapFloat {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-6px) rotate(1.5deg);
          }
        }
        @keyframes signalRing {
          0% {
            transform: scale(0.55);
            opacity: 0;
          }
          18% {
            opacity: 0.45;
          }
          70%,
          100% {
            transform: scale(1.45);
            opacity: 0;
          }
        }
        @keyframes mapLineDraw {
          0% {
            stroke-dashoffset: 70;
            opacity: 0.18;
          }
          28%,
          72% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          100% {
            stroke-dashoffset: -70;
            opacity: 0.25;
          }
        }
        @keyframes centerPulse {
          0%,
          100% {
            transform: scale(1);
            fill: #d4af37;
          }
          50% {
            transform: scale(1.12);
            fill: #f5c563;
          }
        }
        @keyframes nodeBloom {
          0%,
          18% {
            transform: scale(0.84);
            opacity: 0.6;
          }
          34%,
          78% {
            transform: scale(1);
            opacity: 1;
            filter: drop-shadow(0 0 8px rgba(245, 197, 99, 0.35));
          }
          100% {
            transform: scale(0.9);
            opacity: 0.75;
          }
        }
        @keyframes leafTwinkle {
          0%,
          100% {
            transform: scale(0.9);
            opacity: 0.35;
          }
          45%,
          70% {
            transform: scale(1.18);
            opacity: 1;
          }
        }

        /* === SCROLL ANIMATIONS === */
        .reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .reveal-delay-1 {
          transition-delay: 0.1s;
        }
        .reveal-delay-2 {
          transition-delay: 0.2s;
        }
        .reveal-delay-3 {
          transition-delay: 0.3s;
        }

        /* === RESPONSIVE === */
        @media (max-width: 768px) {
          .steps-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .why-grid {
            grid-template-columns: 1fr;
          }
          .why-banner {
            padding: 48px 32px;
          }
          .preview-container {
            grid-template-columns: 1fr;
          }
          .cta-banner {
            flex-direction: column;
            text-align: center;
            padding: 48px 32px;
          }
          .cta-right {
            margin-top: 32px;
          }
          .cta-action-row {
            justify-content: center;
          }
          .cta-social {
            justify-content: center;
          }
          .cta-left .cta-body {
            margin-left: auto;
            margin-right: auto;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .cta-circle-inner,
          .cta-mindmap-icon * {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
