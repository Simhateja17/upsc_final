'use client';

import { useEffect, useRef } from 'react';
import DemoStage, { prefersReducedMotion } from './DemoStage';

const QUESTION = 'Explain Federalism in the Indian Constitution with relevant articles.';
const DOUBT_QUESTION = "But if the Centre holds the master key, doesn't that make India more unitary than federal?";
const TYPE_MS = 22;

/** The Jeet cloud + purple "AI" mark, reused at three sizes. */
function JeetMark({ idPrefix }: { idPrefix: string }) {
  const blue = `${idPrefix}-blue`;
  const yellow = `${idPrefix}-yellow`;
  const blue2 = `${idPrefix}-blue2`;
  const yellow2 = `${idPrefix}-yellow2`;
  const top = `${idPrefix}-top`;
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 6C16 6 12.5 7.5 10 10C7.5 12.5 6 16 6 20C6 24 7.5 27.5 10 30C12.5 32.5 16 34 20 34V6Z" fill={`url(#${blue})`} />
      <path d="M20 6C24 6 27.5 7.5 30 10C32.5 12.5 34 16 34 20C34 24 32.5 27.5 30 30C27.5 32.5 24 34 20 34V6Z" fill={`url(#${yellow})`} />
      <circle cx="14" cy="9" r="5" fill={`url(#${blue2})`} />
      <circle cx="26" cy="9" r="5" fill={`url(#${yellow2})`} />
      <circle cx="20" cy="7" r="4.5" fill={`url(#${top})`} />
      <rect x="12" y="14" width="16" height="14" rx="4" fill="#7A4FFF" />
      <text x="20" y="24" textAnchor="middle" fill="white" fontFamily="Outfit, sans-serif" fontWeight="800" fontSize="9" letterSpacing="0.5">AI</text>
      <defs>
        <linearGradient id={blue} x1="6" y1="6" x2="20" y2="34">
          <stop offset="0%" stopColor="#6EC6FF" /><stop offset="100%" stopColor="#2E8BFF" />
        </linearGradient>
        <linearGradient id={yellow} x1="20" y1="6" x2="34" y2="34">
          <stop offset="0%" stopColor="#FFD700" /><stop offset="100%" stopColor="#FF6B35" />
        </linearGradient>
        <linearGradient id={blue2} x1="9" y1="4" x2="19" y2="14">
          <stop offset="0%" stopColor="#6EC6FF" /><stop offset="100%" stopColor="#4DA8FF" />
        </linearGradient>
        <linearGradient id={yellow2} x1="21" y1="4" x2="31" y2="14">
          <stop offset="0%" stopColor="#FFD700" /><stop offset="100%" stopColor="#FFAA33" />
        </linearGradient>
        <linearGradient id={top} x1="15.5" y1="2.5" x2="24.5" y2="11.5">
          <stop offset="0%" stopColor="#6EC6FF" /><stop offset="50%" stopColor="#B8A4FF" /><stop offset="100%" stopColor="#FFD700" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * Jeet AI Mentor chat demo — client asset
 * `jeet-ai-animation-app_website.html`.
 *
 * ~11.6s sequence: the student's question types out, the mentor thinks,
 * its structured answer (concept → key articles → landmark case) reveals
 * block by block, then a follow-up doubt types in. The asset's own
 * window chrome is dropped — `.demo-device` supplies it — and the run is
 * gated on `active` so the timers only exist while the slide is showing.
 * Slide 1's `dwellMs` in page.tsx is sized to this sequence.
 */
export default function AiMentorChatDemo({ active }: { active: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const q = (sel: string) => root.querySelector<HTMLElement>(sel);
    const userText = q('.user-text');
    const userCursor = q('.user-cursor');
    const doubtText = q('.doubt-text');
    const doubtCursor = q('.doubt-cursor');
    if (!userText || !userCursor || !doubtText || !doubtCursor) return;

    const show = (sel: string) => q(sel)?.classList.add('visible');

    // Back to frame zero: nothing revealed, both bubbles empty.
    root.querySelectorAll('.visible').forEach((el) => el.classList.remove('visible'));
    userText.textContent = '';
    doubtText.textContent = '';
    userCursor.style.display = 'none';
    doubtCursor.style.display = 'none';

    if (!active) return;

    // Reduced motion: jump straight to the finished conversation.
    if (prefersReducedMotion()) {
      userText.textContent = QUESTION;
      doubtText.textContent = DOUBT_QUESTION;
      root.querySelectorAll('.jd-reveal').forEach((el) => el.classList.add('visible'));
      return;
    }

    let cancelled = false;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        const t = setTimeout(() => { timers.delete(t); resolve(); }, ms);
        timers.add(t);
      });

    const type = async (el: HTMLElement, text: string) => {
      for (const ch of text) {
        el.textContent += ch;
        await sleep(TYPE_MS);
        if (cancelled) return;
      }
    };

    const run = async () => {
      await sleep(400); if (cancelled) return;

      // 1. Student's question types itself out.
      show('.msg-user');
      userCursor.style.display = 'inline-block';
      await sleep(200); if (cancelled) return;
      await type(userText, QUESTION); if (cancelled) return;
      await sleep(250); if (cancelled) return;
      userCursor.style.display = 'none';
      show('.msg-user-time');
      await sleep(350); if (cancelled) return;

      // 2. Mentor thinks.
      const typingInd = q('.typing-indicator');
      typingInd?.classList.add('visible');
      await sleep(900); if (cancelled) return;
      typingInd?.classList.remove('visible');
      await sleep(200); if (cancelled) return;

      // 3. Answer reveals block by block.
      show('.msg-ai');
      await sleep(200); if (cancelled) return;
      show('.ai-line-1');
      await sleep(400); if (cancelled) return;
      show('.ai-line-2');
      await sleep(400); if (cancelled) return;
      show('.ai-divider');
      await sleep(200); if (cancelled) return;
      show('.ai-articles-label');
      await sleep(250); if (cancelled) return;
      show('.ai-art-1');
      await sleep(180); if (cancelled) return;
      show('.ai-art-2');
      await sleep(180); if (cancelled) return;
      show('.ai-art-3');
      await sleep(300); if (cancelled) return;
      show('.ai-case-box');
      await sleep(350); if (cancelled) return;

      // 4. Follow-up doubt.
      show('.msg-doubt');
      await sleep(150); if (cancelled) return;
      doubtCursor.style.display = 'inline-block';
      await type(doubtText, DOUBT_QUESTION); if (cancelled) return;
      await sleep(250); if (cancelled) return;
      doubtCursor.style.display = 'none';
      show('.msg-doubt-time');
    };

    run();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, [active]);

  return (
    <DemoStage variant="jd-chat">
      <div className="content" ref={rootRef}>

        {/* ── Chat header ── */}
        <div className="chat-header">
          <div className="header-logo"><JeetMark idPrefix="jdchat-hdr" /></div>
          <div className="header-info">
            <div className="header-name">
              <span className="jeet">Jeet</span> <span className="ai">AI Mentor</span>
            </div>
            <div className="header-sub">Your UPSC Preparation Partner</div>
          </div>
          <div className="header-badges">
            <div className="badge">🎯 UPSC</div>
            <div className="badge">📚 NCERT</div>
          </div>
        </div>

        {/* ── Chat area ── */}
        <div className="chat-area">
          <div className="particles">
            <div className="particle p1" /><div className="particle p2" />
            <div className="particle p3" /><div className="particle p4" />
          </div>

          {/* Student question */}
          <div className="msg-user jd-reveal">
            <div className="msg-user-bubble">
              <span className="user-text" /><span className="typing-cursor user-cursor" />
            </div>
            <div className="msg-user-time jd-reveal">3:26 PM</div>
          </div>

          {/* Mentor thinking */}
          <div className="typing-indicator">
            <div className="typing-mini-logo"><JeetMark idPrefix="jdchat-typ" /></div>
            <div className="typing-dots">
              <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
            </div>
          </div>

          {/* Mentor answer */}
          <div className="msg-ai jd-reveal">
            <div className="msg-ai-logo"><JeetMark idPrefix="jdchat-msg" /></div>
            <div className="msg-ai-content">
              <div className="msg-ai-header">
                <span className="msg-ai-name">Jeet AI Mentor</span>
                <span className="msg-ai-time">3:26 PM</span>
              </div>
              <div className="msg-ai-bubble">
                <div className="ai-line ai-line-1 jd-reveal">
                  <span className="ai-concept">Think of India&apos;s federalism as a joint family.</span> The states manage their own rooms, but the <span className="ai-highlight">Centre holds the master key</span> when things get critical.
                </div>
                <div className="ai-line ai-line-2 jd-reveal">
                  The Constitution calls it a <span className="ai-blue">&quot;Union of States&quot;</span>, deliberately not &quot;federation&quot;, to signal that the union is indestructible even if state boundaries aren&apos;t.
                </div>
                <div className="ai-divider jd-reveal" />
                <div className="ai-line ai-articles-label jd-reveal">Key Articles to Remember</div>
                <div className="ai-article-list">
                  <div className="ai-article-item ai-art-1 jd-reveal">
                    <div className="article-icon">1</div>
                    <div className="article-text"><strong>Art. 1</strong> : Bharat = Union of States</div>
                  </div>
                  <div className="ai-article-item ai-art-2 jd-reveal">
                    <div className="article-icon">2</div>
                    <div className="article-text"><strong>Art. 245-255</strong> : Centre-State legislative powers</div>
                  </div>
                  <div className="ai-article-item ai-art-3 jd-reveal">
                    <div className="article-icon">3</div>
                    <div className="article-text"><strong>7th Schedule</strong> : Union, State &amp; Concurrent Lists</div>
                  </div>
                </div>
                <div className="ai-case-box jd-reveal">
                  <div className="case-label">Landmark Case</div>
                  <div className="case-text">
                    <strong>S.R. Bommai (1994)</strong> : Supreme Court ruled federalism is part of the <strong>Basic Structure</strong>. The Centre can&apos;t dismiss state governments arbitrarily.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Follow-up doubt */}
          <div className="msg-doubt jd-reveal">
            <div className="msg-doubt-bubble">
              <div className="msg-doubt-label">Doubt</div>
              <span className="doubt-text" /><span className="typing-cursor doubt-cursor" />
            </div>
            <div className="msg-doubt-time jd-reveal">3:27 PM</div>
          </div>
        </div>

        {/* ── Input bar ── */}
        <div className="input-bar">
          <div className="input-field">Ask me anything about your preparation…</div>
          <div className="send-btn">
            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
          </div>
        </div>

      </div>
    </DemoStage>
  );
}
