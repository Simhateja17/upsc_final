'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import DemoStage, { centerWithin, prefersReducedMotion } from './DemoStage';

const CYCLE_MS = 20_000;
const START_SECONDS = 600;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

/**
 * Mock Test demo — client asset `mock-test-animation-website.html`.
 *
 * A 20s loop: a hand cursor picks the wrong option on two MCQs, hits
 * Submit, and the explanation screen slides in. Option/badge states are
 * CSS keyframes; the cursor is driven here on a single rAF loop.
 *
 * The whole loop is gated on `active` and torn down on unmount, so the
 * landing page isn't running a rAF loop and a 1s interval for a slide
 * nobody is looking at.
 */
export default function MockTestDemo({ active }: { active: boolean }) {
  const screenRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);
  const [clock, setClock] = useState('10:00');

  useEffect(() => {
    if (!active) {
      setClock('10:00');
      return;
    }
    if (prefersReducedMotion()) return;

    const screen = screenRef.current;
    const cursor = cursorRef.current;
    const ripple = rippleRef.current;
    if (!screen || !cursor || !ripple) return;

    const targets = {
      q1: screen.querySelector<HTMLElement>('.q1-opt-a'),
      q2: screen.querySelector<HTMLElement>('.q2-opt-a'),
      submit: screen.querySelector<HTMLElement>('.q-btn-submit'),
    };
    if (!targets.q1 || !targets.q2 || !targets.submit) return;

    let raf = 0;
    let start: number | null = null;
    let fired = { q1: false, q2: false, submit: false };
    let lastClock = '';

    // The asset ran the ripple on its own rAF chain, which leaked a new
    // chain per click. Here it's a timestamp the main loop reads.
    let rippleAt = -Infinity;

    const showRipple = (x: number, y: number, now: number) => {
      ripple.style.left = `${x - 20}px`;
      ripple.style.top = `${y - 20}px`;
      rippleAt = now;
    };

    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsed = (now - start) % CYCLE_MS;
      const p = elapsed / CYCLE_MS;

      if (p < 0.01) fired = { q1: false, q2: false, submit: false };

      const p1 = centerWithin(targets.q1!, screen);
      const p2 = centerWithin(targets.q2!, screen);
      const p3 = centerWithin(targets.submit!, screen);

      let x: number;
      let y: number;
      let opacity = 0;
      let scale = 1;

      const clickScale = (t: number) => (t < 0.5 ? 1 - 0.2 * (t / 0.5) : 0.8 + 0.2 * ((t - 0.5) / 0.5));

      if (p < 0.01) {
        x = p1.x + 100; y = p1.y - 100; opacity = 0;
      } else if (p < 0.03) {
        const t = easeInOut((p - 0.01) / 0.02);
        x = lerp(p1.x + 100, p1.x, t); y = lerp(p1.y - 100, p1.y, t); opacity = 1;
      } else if (p < 0.05) {
        x = p1.x; y = p1.y; opacity = 1;
        const t = (p - 0.03) / 0.02;
        scale = clickScale(t);
        if (t >= 0.45 && !fired.q1) { fired.q1 = true; showRipple(p1.x, p1.y, now); }
      } else if (p < 0.07) {
        x = p1.x; y = p1.y; opacity = 1;
      } else if (p < 0.09) {
        const t = easeInOut((p - 0.07) / 0.02);
        x = lerp(p1.x, p2.x, t); y = lerp(p1.y, p2.y, t); opacity = 1;
      } else if (p < 0.11) {
        x = p2.x; y = p2.y; opacity = 1;
        const t = (p - 0.09) / 0.02;
        scale = clickScale(t);
        if (t >= 0.45 && !fired.q2) { fired.q2 = true; showRipple(p2.x, p2.y, now); }
      } else if (p < 0.13) {
        x = p2.x; y = p2.y; opacity = 1;
      } else if (p < 0.15) {
        const t = easeInOut((p - 0.13) / 0.02);
        x = lerp(p2.x, p3.x, t); y = lerp(p2.y, p3.y, t); opacity = 1;
      } else if (p < 0.17) {
        x = p3.x; y = p3.y; opacity = 1;
        const t = (p - 0.15) / 0.02;
        scale = clickScale(t);
        if (t >= 0.45 && !fired.submit) { fired.submit = true; showRipple(p3.x, p3.y, now); }
      } else if (p < 0.2) {
        x = p3.x; y = p3.y; opacity = 1 - (p - 0.17) / 0.03;
      } else {
        x = p3.x; y = p3.y; opacity = 0;
      }

      cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, 10%) scale(${scale})`;
      cursor.style.opacity = `${opacity}`;

      // Ripple: 400ms expand-and-fade, read from the shared clock.
      const rp = (now - rippleAt) / 400;
      if (rp >= 0 && rp <= 1) {
        const grow = rp < 0.3 ? (rp / 0.3) * 0.4 : 0.4 + ((rp - 0.3) / 0.7) * 2.1;
        ripple.style.opacity = `${rp < 0.3 ? (rp / 0.3) * 0.8 : 0.8 * (1 - (rp - 0.3) / 0.7)}`;
        ripple.style.transform = `scale(${grow})`;
      } else {
        ripple.style.opacity = '0';
      }

      // Countdown derived from the cycle clock rather than a separate
      // setInterval, so it can never drift out of step with the loop.
      const remaining = Math.max(0, START_SECONDS - Math.floor(elapsed / 1000));
      const next = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
      if (next !== lastClock) { lastClock = next; setClock(next); }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return (
    <DemoStage variant="jd-mock">
      <div className="content">
        {/* Screen 1: questions */}
        <div className="screen" ref={screenRef}>
          <div className="hand-cursor" ref={cursorRef}>&#x1F446;</div>
          <div className="click-ripple" ref={rippleRef} />
          <div className="main-card">
            <div className="header-section">
              <div className="card-header">
                <div className="q-number">
                  <Image src="/landing-demo-mcq-target.png" alt="" width={34} height={34} />
                </div>
                <div className="q-meta">
                  <div className="q-title">Daily MCQ Challenge</div>
                  <div className="q-date">18th July 2026, 10 Questions</div>
                </div>
                <div className="q-live"><span className="q-live-dot" /> LIVE</div>
              </div>
              <div className="q-tags">
                <span className="tag tag-polity">Polity</span>
                <span className="tag tag-easy">Easy</span>
                <div className="tag-timer"><span>{clock}</span><small>TIME LEFT</small></div>
              </div>
            </div>

            <div className="scroll-container jd-scroll">
              {/* Q1 */}
              <div className="q-body">
                <div className="q-label">Question 1:</div>
                <div className="q-text">Consider the following statements regarding the Directive Principles of State Policy:</div>
                <div className="q-statement"><span className="q-statement-num">1</span><span>The Principles spell out the socio-economic democracy in the country.</span></div>
                <div className="q-statement"><span className="q-statement-num">2</span><span>The provisions contained in these Principles are not enforceable by any court.</span></div>
                <div className="q-instruction">Which of the statements given above is/are correct?</div>
              </div>
              <div className="q-options">
                <div className="q-option q1-opt-a"><span className="q-option-letter q1-opt-a-letter">A</span><span>1 only</span><span className="result-badge badge-wrong badge-slot q1-badge">Wrong</span></div>
                <div className="q-option"><span className="q-option-letter">B</span><span>2 only</span></div>
                <div className="q-option q1-opt-c"><span className="q-option-letter q1-opt-c-letter">C</span><span>Both 1 and 2</span><span className="result-badge badge-correct badge-slot q1-badge">Correct</span></div>
                <div className="q-option"><span className="q-option-letter">D</span><span>Neither 1 nor 2</span></div>
              </div>

              <div className="question-separator" />

              {/* Q2 */}
              <div className="q-tags" style={{ marginBottom: 6 }}>
                <span className="tag tag-economy">Economy</span>
                <span className="tag tag-medium">Medium</span>
              </div>
              <div className="q-body">
                <div className="q-label">Question 2:</div>
                <div className="q-text">Which of the following constitutes the largest share of revenue for most state governments in India?</div>
                <div className="q-instruction" style={{ marginTop: 4 }}>Select the correct answer:</div>
              </div>
              <div className="q-options" style={{ paddingBottom: 12 }}>
                <div className="q-option q2-opt-a"><span className="q-option-letter q2-opt-a-letter">A</span><span>State GST</span><span className="result-badge badge-wrong badge-slot q2-badge">Wrong</span></div>
                <div className="q-option q2-opt-b"><span className="q-option-letter q2-opt-b-letter">B</span><span>Central tax devolution</span><span className="result-badge badge-correct badge-slot q2-badge">Correct</span></div>
                <div className="q-option"><span className="q-option-letter">C</span><span>Stamp duty &amp; registration</span></div>
                <div className="q-option"><span className="q-option-letter">D</span><span>State excise duties</span></div>
              </div>
            </div>

            <div className="q-divider" />
            <div className="q-footer">
              <span className="q-btn q-btn-prev">&larr; Previous</span>
              <span className="q-btn q-btn-submit">Submit</span>
            </div>
          </div>
        </div>

        {/* Screen 2: explanation */}
        <div className="explain-screen">
          <div className="explain-card-wrapper">
            <div className="explain-header">
              <div className="explain-header-row">
                <div className="explain-icon explain-icon-red">&#10005;</div>
                <div>
                  <div className="explain-title">Q1 - Incorrect</div>
                  <div className="explain-sub">Polity, Directive Principles</div>
                </div>
                <div className="explain-compare">Your answer: <span className="your-ans">A</span><br />Correct: <span className="correct-ans">C</span></div>
              </div>
              <div className="explain-header-row">
                <div className="explain-icon explain-icon-red">&#10005;</div>
                <div>
                  <div className="explain-title">Q2 - Incorrect</div>
                  <div className="explain-sub">Economy, State Revenue</div>
                </div>
                <div className="explain-compare">Your answer: <span className="your-ans">A</span><br />Correct: <span className="correct-ans">B</span></div>
              </div>
            </div>

            <div className="explain-body jd-scroll">
              <div className="explain-section-label"><span className="icon">&#128161;</span> Q1 Explanation</div>
              <div className="explain-card">
                <div className="explain-card-body">
                  <strong>Statement 1 is correct:</strong> DPSPs (Part IV, Art. 36 to 51) spell out the socio-economic goals for the state.<br /><br />
                  <strong>Statement 2 is correct:</strong> Article 37 states DPSPs are non-justiciable, not enforceable by any court.
                </div>
              </div>
              <div className="explain-card">
                <div className="explain-card-body">
                  <strong style={{ color: '#16A34A' }}>Answer: Option C - Both 1 and 2.</strong> DPSPs are guiding principles, not legally enforceable rights unlike Fundamental Rights (Part III).
                </div>
              </div>

              <div className="explain-sep" />

              <div className="explain-section-label"><span className="icon">&#128161;</span> Q2 Explanation</div>
              <div className="explain-card">
                <div className="explain-card-body">
                  <strong>Central tax devolution</strong> (via Finance Commission recommendations) constitutes the single largest source of revenue for most state governments, typically around 45-50% of their total revenue.<br /><br />
                  State GST, stamp duty, and excise duties are significant but smaller contributors.
                </div>
              </div>
              <div className="explain-card">
                <div className="explain-card-body">
                  <strong style={{ color: '#16A34A' }}>Answer: Option B - Central tax devolution.</strong> Articles 270 &amp; 275 govern the devolution of taxes to states.
                </div>
              </div>
            </div>

            <div className="q-divider" />
            <div className="explain-actions">
              <div className="explain-action-btn"><span>&#9889;</span> Flashcard</div>
              <div className="explain-action-btn"><span>&#8635;</span> Review</div>
              <div className="explain-action-btn"><span>&#9873;</span> Bookmark</div>
            </div>
          </div>
        </div>
      </div>
    </DemoStage>
  );
}
