'use client';

import { useEffect, useRef, useState } from 'react';
import DemoStage, { centerWithin, prefersReducedMotion } from './DemoStage';

type Article = {
  source: string;
  tags: string[];
  title: string;
  brief: string;
  summary: string;
  args: string[];
  analysis: string;
  upsc: string[];
  terms: [string, string][];
};

/** Verbatim from the client asset's `data.hindu`. */
const ARTICLES: Article[] = [
  {
    source: 'The Hindu',
    tags: ['Polity', 'Economy', 'Security'],
    title: 'West Asia crisis, uncertain monsoon major risks for growth: RBI Governor',
    brief: 'RBI flags external conflict, food prices and weather shocks as key variables for India’s growth-inflation balance.',
    summary: 'The editorial explains that India’s growth outlook remains resilient but exposed to West Asia tensions, monsoon uncertainty and sticky food inflation. It frames the RBI’s policy challenge as maintaining price stability without weakening growth momentum.',
    args: [
      'Geopolitical instability can affect crude oil prices, trade routes and investor confidence.',
      'A weak or uneven monsoon may hurt rural demand, food supply and inflation expectations.',
      'Monetary policy credibility remains important because headline inflation can return quickly through supply shocks.',
    ],
    analysis: 'The piece is useful because it links external shocks with domestic macroeconomic management. A limitation is that monetary policy alone cannot solve supply-side inflation; fiscal coordination, buffer stocks, logistics and targeted relief also matter.',
    upsc: [
      'GS Paper 3: Indian economy, inflation, monetary policy, growth and resource mobilisation.',
      'Essay and interview: balancing growth, welfare and macroeconomic stability under uncertainty.',
    ],
    terms: [
      ['Flexible inflation targeting', 'A monetary policy framework where the RBI targets inflation while considering growth conditions.'],
      ['Imported inflation', 'Rise in domestic prices caused by costlier imports such as crude oil.'],
      ['Monsoon dependence', 'India’s continued vulnerability to rainfall variation through agriculture and rural demand.'],
    ],
  },
  {
    source: 'The Hindu',
    tags: ['Polity', 'Environment', 'Supreme Court'],
    title: 'Action against illegal fish ponds in Kolleru Sanctuary brooks no delay, Supreme Court panel tells A.P.',
    brief: 'The panel seeks urgent restoration of ecological health and compliance with conservation directions in a sensitive wetland zone.',
    summary: 'The report highlights the conflict between livelihood, aquaculture and wetland conservation in Kolleru Wildlife Sanctuary.',
    args: [
      'Wetlands provide flood moderation, biodiversity support and water purification services.',
      'Illegal aquaculture can alter hydrology, reduce habitat quality and increase pollution load.',
      'Court-monitored governance becomes necessary when local enforcement is weak or delayed.',
    ],
    analysis: 'The issue shows the difficulty of environmental federalism.',
    upsc: ['GS Paper 3: conservation, environmental pollution, EIA, wetlands and protected areas.'],
    terms: [['Ramsar wetland', 'A wetland of international importance under the Ramsar Convention.']],
  },
  {
    source: 'The Hindu',
    tags: ['Governance', 'Technology', 'Ethics'],
    title: 'India’s AI governance push must protect innovation and rights together',
    brief: 'A policy debate emerges on how to regulate AI use in public services while retaining India’s digital innovation advantage.',
    summary: 'The article argues that AI regulation should be risk-based, transparent and rights-oriented.',
    args: [
      'AI can improve public service delivery but may reproduce bias if datasets are weak.',
      'Regulation should focus on high-risk uses rather than blanket restrictions.',
    ],
    analysis: 'The debate is relevant because India is both a major AI market and a digital public infrastructure leader.',
    upsc: ['GS Paper 2: governance, transparency, accountability and citizen-centric administration.'],
    terms: [['Algorithmic bias', 'Systematic unfairness in automated decisions due to flawed data or design.']],
  },
];

const easeOutPower2 = (t: number) => 1 - (1 - t) ** 2;
const easeInOutPower1 = (t: number) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) ** 2);

/**
 * Current Affairs demo — client asset `daily-current-affairs-app-websit.html`.
 *
 * A cinematic one-shot: cards stagger in, a hand cursor glides to
 * "Jeet AI Summary", clicks, the summary modal opens and auto-scrolls
 * through its sections. Restarts each time the slide becomes active.
 *
 * Reimplemented without GSAP (the asset pulled 3.12 off cdnjs) — the
 * timeline is a handful of eased tweens, so it runs on one rAF loop
 * plus CSS transitions for the class-driven states. Everything is
 * scoped to the card: the asset positioned its cursor `fixed` against
 * window.innerHeight, which would have thrown it across the page.
 *
 * The asset's opening "phone flies in" beat is dropped — the card *is*
 * the device frame's content here, so sliding it would expose the
 * frame's background. The ambient particles are dropped for the same
 * reason (tuned for that file's dark standalone backdrop).
 */
export default function CurrentAffairsDemo({ active }: { active: boolean }) {
  const screenRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);
  const modalBodyRef = useRef<HTMLDivElement>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!active) {
      setModalOpen(false);
      return;
    }

    const screen = screenRef.current;
    const cursor = cursorRef.current;
    const glow = glowRef.current;
    const ripple = rippleRef.current;
    if (!screen || !cursor || !glow || !ripple) return;

    const cards = Array.from(screen.querySelectorAll<HTMLElement>('.news-card'));
    const orbit = screen.querySelector<HTMLElement>('.bottom-orbit');
    const btn = screen.querySelector<HTMLElement>('.summary-btn');

    const timers: ReturnType<typeof setTimeout>[] = [];
    const cancels: (() => void)[] = [];
    const after = (ms: number, fn: () => void) => { timers.push(setTimeout(fn, ms)); };

    // Reduced motion: show the end state, run nothing.
    if (prefersReducedMotion()) {
      cards.forEach((c) => c.classList.add('is-in'));
      orbit?.classList.add('is-in');
      setModalOpen(true);
      return () => { setModalOpen(false); };
    }

    /** Generic rAF tween; registers a canceller for cleanup. */
    const tween = (durationMs: number, ease: (t: number) => number, onUpdate: (t: number) => void) => {
      let id = 0;
      let start: number | null = null;
      const step = (now: number) => {
        if (start === null) start = now;
        const t = Math.min(1, (now - start) / durationMs);
        onUpdate(ease(t));
        if (t < 1) id = requestAnimationFrame(step);
      };
      id = requestAnimationFrame(step);
      cancels.push(() => cancelAnimationFrame(id));
    };

    // Reset to the timeline's initial state.
    cards.forEach((c) => c.classList.remove('is-in'));
    orbit?.classList.remove('is-in');
    setModalOpen(false);
    cursor.style.opacity = '0';
    glow.style.opacity = '0';
    ripple.style.opacity = '0';

    // Phase 1 — cards stagger in (CSS transitions do the easing).
    cards.forEach((card, i) => after(200 + i * 180, () => card.classList.add('is-in')));

    // Phase 2 — bottom action bar rises.
    after(900, () => orbit?.classList.add('is-in'));

    // Phase 3 — cursor glides to the summary button over 2s.
    after(1600, () => {
      if (!btn) return;
      const target = centerWithin(btn, screen);
      const from = { x: target.x + 150, y: target.y + 220 };

      cursor.style.opacity = '1';
      glow.style.opacity = '0.6';
      tween(2000, easeInOutPower1, (t) => {
        const x = from.x + (target.x - from.x) * t;
        const y = from.y + (target.y - from.y) * t;
        cursor.style.transform = `translate3d(${x - 14}px, ${y - 14}px, 0)`;
        glow.style.transform = `translate3d(${x - 30}px, ${y - 30}px, 0)`;
      });

      // Phase 4 — click: ripple out of the button, glow fades.
      after(2200, () => {
        cursor.classList.add('clicking');
        ripple.style.left = `${target.x - 20}px`;
        ripple.style.top = `${target.y - 20}px`;
        tween(800, easeOutPower2, (t) => {
          ripple.style.transform = `scale(${t * 3})`;
          ripple.style.opacity = `${1 - t}`;
        });
        tween(400, (t) => t, (t) => { glow.style.opacity = `${0.6 * (1 - t)}`; });

        // Phase 5 — modal opens, cursor drifts off.
        after(550, () => {
          setModalOpen(true);
          cursor.classList.remove('clicking');
          const x0 = target.x - 14;
          const y0 = target.y - 14;
          tween(800, (t) => t * t, (t) => {
            cursor.style.transform = `translate3d(${x0 + 80 * t}px, ${y0 - 60 * t}px, 0)`;
            cursor.style.opacity = `${1 - t}`;
          });

          // Phase 6 — walk the modal down section by section, then home.
          after(900, () => {
            const body = modalBodyRef.current;
            if (!body) return;
            const max = body.scrollHeight - body.clientHeight;
            if (max <= 0) return;

            let delay = 0;
            body.querySelectorAll<HTMLElement>('.section').forEach((sec) => {
              const to = Math.min(sec.offsetTop - 20, max);
              const dur = 500 + (sec.offsetHeight / 300) * 1000;
              const at = delay;
              after(at, () => {
                const from = body.scrollTop;
                tween(dur, easeInOutPower1, (t) => { body.scrollTop = from + (to - from) * t; });
              });
              delay += dur + 400;
            });

            after(delay, () => {
              const from = body.scrollTop;
              tween(700, easeInOutPower1, (t) => { body.scrollTop = from + (max - from) * t; });
            });
            after(delay + 2200, () => {
              const from = body.scrollTop;
              tween(900, easeInOutPower1, (t) => { body.scrollTop = from * (1 - t); });
            });
          });
        });
      });
    });

    return () => {
      timers.forEach(clearTimeout);
      cancels.forEach((cancel) => cancel());
      cursor.classList.remove('clicking');
    };
  }, [active]);

  const article = ARTICLES[0];

  return (
    <DemoStage variant="jd-ca">
      <div className="screen" ref={screenRef}>
        <header className="top-ribbon">
          <div className="brand-row">
            <div className="source-switch">
              <span className="source-tab active"><span className="masthead-mark">TH</span>The Hindu</span>
              <span className="source-tab"><span className="masthead-mark">IE</span>Indian Express</span>
            </div>
            <div className="date-pill">18 Jul</div>
          </div>
          <div className="edition-line">
            <div>
              <h1>Daily Current Affairs</h1>
              <p>The Hindu edition · 24 articles</p>
            </div>
            <div className="edition-meta">PAGE<br />1 / 3</div>
          </div>
        </header>

        <div className="feed jd-scroll">
          {ARTICLES.map((a) => (
            <article className="news-card" key={a.title}>
              <div className="card-top">
                <div className="tags">
                  {a.tags.map((t) => <span className="tag" key={t}>{t}</span>)}
                </div>
                <span className="source-note">{a.source}</span>
              </div>
              <h2 className="news-title">{a.title}</h2>
              <p className="news-brief">{a.brief}</p>
              <div className="divider" />
              <div className="card-actions">
                <div className="soft-actions">
                  <span className="soft-btn">Save</span>
                  <span className="soft-btn">Mark read</span>
                </div>
                <span className="summary-btn">Jeet AI Summary</span>
              </div>
            </article>
          ))}
        </div>

        <nav className="bottom-orbit">
          <div className="orbit-item"><div className="orbit-icon">SN</div>Save Note</div>
          <div className="orbit-item"><div className="orbit-icon">MCQ</div>Practice MCQ</div>
          <div className="orbit-item"><div className="orbit-icon">ANS</div>Exam Qs</div>
          <div className="orbit-item"><div className="orbit-icon">SRC</div>Source</div>
        </nav>

        <div className={`modal-layer${modalOpen ? ' open' : ''}`}>
          <article className="summary-modal">
            <header className="modal-head">
              <div className="modal-topline">
                <div className="tags">
                  <span className="tag">{article.source}</span>
                  {article.tags.slice(0, 2).map((t) => <span className="tag" key={t}>{t}</span>)}
                </div>
                <span className="close-btn">×</span>
              </div>
              <div className="modal-kicker">Jeet AI Summary</div>
              <h2 className="modal-title">{article.title}</h2>
            </header>

            <div className="modal-body jd-scroll" ref={modalBodyRef}>
              <section className="section">
                <h3 className="section-title">Summary</h3>
                <p className="summary-copy">{article.summary}</p>
              </section>
              <section className="section">
                <h3 className="section-title">1. Key Arguments</h3>
                <ol className="argument-list">
                  {article.args.map((a) => <li key={a}>{a}</li>)}
                </ol>
              </section>
              <section className="section">
                <h3 className="section-title">2. Critical Analysis</h3>
                <p className="analysis-copy">{article.analysis}</p>
              </section>
              <section className="section">
                <h3 className="section-title">3. UPSC Relevance</h3>
                {article.upsc.map((u) => <div className="callout" key={u}>{u}</div>)}
              </section>
              <section className="section">
                <h3 className="section-title">4. Key Terms &amp; Concepts</h3>
                <div className="terms">
                  {article.terms.map(([term, meaning]) => (
                    <div className="term" key={term}><strong>{term}:</strong> {meaning}</div>
                  ))}
                </div>
              </section>
            </div>

            <div className="modal-actions">
              <span className="modal-action"><b>SN</b>Save Note</span>
              <span className="modal-action"><b>MCQ</b>Practice MCQ</span>
              <span className="modal-action"><b>QA</b>Exam Qs</span>
              <span className="modal-action"><b>URL</b>Source</span>
            </div>
            <div className="locked-footer">SSL encrypted · Powered by Jeet AI · UPSC verified content</div>
          </article>
        </div>

        <div className="hand-cursor" ref={cursorRef}><span className="hand-glyph">👆</span></div>
        <div className="cursor-glow" ref={glowRef} />
        <div className="click-ripple" ref={rippleRef} />
      </div>
    </DemoStage>
  );
}
