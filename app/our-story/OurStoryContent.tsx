'use client';

import { useEffect, useRef, useCallback } from 'react';
import './our-story.css';

export default function OurStoryContent() {
  const heroStatsRef = useRef<HTMLDivElement>(null);

  const countUp = useCallback((id: string, target: number, suffix: string, dur: number) => {
    const el = document.getElementById(id);
    if (!el) return;
    let v = 0;
    const step = target / (dur / 16);
    const t = setInterval(() => {
      v += step;
      if (v >= target) {
        el.textContent = target + suffix;
        clearInterval(t);
      } else {
        el.textContent = Math.floor(v) + suffix;
      }
    }, 16);
  }, []);

  useEffect(() => {
    // Scroll reveal
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((x) => {
          if (x.isIntersecting) {
            x.target.classList.add('v');
            io.unobserve(x.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.r').forEach((el) => io.observe(el));

    // Hero stat count-up
    const statsEl = heroStatsRef.current;
    let statsObs: IntersectionObserver | null = null;
    if (statsEl) {
      statsObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((x) => {
            if (x.isIntersecting) {
              setTimeout(() => countUp('s1', 15, 'K+', 1200), 0);
              setTimeout(() => countUp('s2', 95, '%', 1200), 150);
              setTimeout(() => {
                const s3 = document.getElementById('s3');
                if (s3) s3.textContent = '1M+';
              }, 800);
              setTimeout(() => {
                const s4 = document.getElementById('s4');
                if (s4) s4.textContent = '4.9★';
              }, 1000);
              statsObs?.unobserve(x.target);
            }
          });
        },
        { threshold: 0.5 }
      );
      statsObs.observe(statsEl);
    }

    return () => {
      io.disconnect();
      statsObs?.disconnect();
    };
  }, [countUp]);

  const scrollToOrigin = () => {
    document.querySelector('.origin')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-badge r"><span>✦</span> India&apos;s #1 AI-Powered UPSC Platform</div>
          <div className="h-eyebrow r d1">
            <div className="h-ey-line"></div>
            <span className="h-ey-txt">Our Story</span>
            <div className="h-ey-line"></div>
          </div>
          <h1 className="hero-h1 r d2">Built by an Aspirant,<br /><em>for Every Aspirant</em></h1>
          <p className="hero-sub r d3">RiseWithJeet was born from a deep love for governance, a fascination with public service, and one IIT engineer who believed every aspirant deserves a fair shot, regardless of geography or income.</p>
          <div className="hero-stats r d4" ref={heroStatsRef}>
            <div className="hs"><div className="hs-num" id="s1">15K+</div><div className="hs-lbl">Active Aspirants</div></div>
            <div className="hs"><div className="hs-num" id="s2">95%</div><div className="hs-lbl">Prelims Accuracy</div></div>
            <div className="hs"><div className="hs-num" id="s3">1M+</div><div className="hs-lbl">YouTube Views</div></div>
            <div className="hs"><div className="hs-num" id="s4">4.9★</div><div className="hs-lbl">App Rating</div></div>
          </div>
        </div>
        <div className="scroll-hint r d4" onClick={scrollToOrigin}>
          <div className="sh-arrow"></div><span>Scroll</span>
        </div>
      </section>

      {/* ORIGIN STORY */}
      <section className="sec origin">
        <div className="inner">
          <div className="og-grid">
            <div>
              <div className="eyebrow r"><div className="ey-line"></div><span className="ey-txt">February 2025 - The Beginning</span></div>
              <h2 className="sec-title r">How a YouTube channel<br /><em>became a movement</em></h2>
            </div>
            <div className="ob r d1">
              <p>In February 2025, <strong>Abhijeet Soni</strong>, an IIT Kharagpur alumnus and AI Data Scientist, started something deceptively simple: a free YouTube channel about UPSC. No institute backing. No coaching brand. Just comprehensive content, honest teaching, and a genuine belief that every aspirant deserved better than scattered PDFs and inaccessible classroom coaching.</p>
              <p>The channel spread fast. His style was different. Complex topics simplified without dumbing them down, methods that actually work, and an energy that felt less like a lecture and more like a conversation with someone who genuinely cared. His <a href="https://youtu.be/Cke_biOMIEk?si=sghMcDg_WF47sgGD" target="_blank" rel="noopener noreferrer">video on remembering all 108 National Parks in just 20 minutes</a> became a UPSC community favourite, the kind of content that travels through Telegram groups at midnight with a simple message: <em>&quot;bhai ye dekh le national park ho jayega.&quot;</em></p>
              <p>A Telegram community formed naturally. Aspirants started sharing notes, clearing doubts, reviewing each other&apos;s answers. Within weeks, thousands of students had joined, not because they were marketed to, but because the content was genuinely useful and the community felt real.</p>
              <blockquote className="ob-pull">&quot;The exam doesn&apos;t just test what you know. It tests how clearly you think, how fairly you analyse, and whether you&apos;re ready to serve. You can&apos;t prepare for that with a PDF alone.&quot;</blockquote>
              <p>But as the community grew, Abhijeet saw a structural problem no YouTube channel alone could fix: the quality of UPSC preparation in India is still largely determined by where you live and what you can afford. A student in a small town in Bihar or Andhra Pradesh was starting from a fundamentally different position than one in South Delhi. Same ambition, wildly unequal access.</p>
              <p>He knew AI could change that equation. But he also knew that AI alone, without deep UPSC domain knowledge and genuine mentorship, would miss everything the exam really demands. So he decided to build both. <strong>AI for speed. Humanized experience for depth. Community for the accountability that turns good intentions into daily habits.</strong></p>
              <p>One more thing has guided every decision from the very beginning: radical transparency on pricing. Running this platform, data storage, AI model training on UPSC-specific content, evaluation engines, infrastructure, it all costs real money. RiseWithJeet will only ever charge what it genuinely takes to run and improve this platform. Not a rupee more. That promise is non-negotiable.</p>
            </div>
          </div>
          <div className="callout r">
            <div className="callout-txt">&quot;Every year, over 10 lakh aspirants appear for UPSC. Only a fraction clear it. Most of those who don&apos;t aren&apos;t failing because they lack intelligence or dedication. They&apos;re failing because they don&apos;t have access to the right feedback, the right structure, and the right community at the right time. That&apos;s not a talent problem. That&apos;s an access problem, and access problems are exactly what technology exists to solve.&quot;</div>
            <div className="callout-attr">Abhijeet Soni, Founder &amp; Mentor Rise With Jeet | UPSC Simplified</div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="sec problem">
        <div className="inner">
          <div className="pr-grid">
            <div>
              <div className="eyebrow r"><div className="ey-line"></div><span className="ey-txt" style={{ color: 'var(--gold)' }}>Why We Exist</span></div>
              <div className="pr-title r">The UPSC preparation system was <em style={{ color: 'var(--gold)' }}>broken</em> for most aspirants</div>
              <p className="pr-lead r d1">Traditional coaching worked well if you lived near a major city and had ₹2–3 lakh to spare. For everyone else, preparation was an uphill battle fought with unequal tools.</p>
              <p className="pr-lead r d2" style={{ marginTop: '12px' }}>We set out to fix the three deepest structural failures, not with incremental tweaks, but by rethinking the entire approach from first principles.</p>
            </div>
            <div className="pc-list">
              <div className="pc r d1">
                <div className="pc-icon" style={{ background: 'rgba(220,60,60,.12)' }}>⏳</div>
                <div><div className="pc-title">Answer feedback came days later, or never</div><div className="pc-body">Most aspirants write answers and get no structured feedback. At best, they wait 7–10 days. Jeet AI Mentor evaluates in 60 seconds with UPSC examiner-level detail across 8 parameters, content, structure, analysis, examples, and more.</div></div>
              </div>

              <div className="pc r d3">
                <div className="pc-icon" style={{ background: 'rgba(30,100,200,.12)' }}>🗺️</div>
                <div><div className="pc-title">Geography decided your access to mentorship</div><div className="pc-body">If you weren&apos;t in a tier 1 city, personalised mentorship was simply out of reach. We built Mentorship programs to connect learners across India directly with mentors, weekly 1-on-1 sessions, personalised roadmaps, target based planner and much more.</div></div>
              </div>

              <div className="pc r d4">
                <div className="pc-icon" style={{ background: 'rgba(120,60,200,.12)' }}>📊</div>
                <div><div className="pc-title">No one told you where you actually stood</div><div className="pc-body">Most aspirants prepare for years without ever knowing their real weak areas. No data, no tracking, no honest signal. Our performance analytics and adaptive engine tell you exactly where you are and what to fix next, every single day.</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="sec mission">
        <div className="inner">
          <div className="m-banner r">
            <div className="m-lbl">Our Mission</div>
            <div className="m-stmt">To <em>democratise</em> UPSC preparation for every aspirant in India, regardless of geography, language, or financial background.</div>
            <p className="m-sub">We believe the quality of your civil services preparation should never be determined by your postcode or your parents&apos; income. With AI and the right mentorship, we level the playing field.</p>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="sec values">
        <div className="inner">
          <div className="r"><div className="eyebrow"><div className="ey-line"></div><span className="ey-txt">What Drives Us</span></div><h2 className="sec-title">The principles we build<br /><em>every feature around</em></h2></div>
          <div className="vals">
            <div className="val r d1"><div className="val-num">01</div><div className="val-icon">🎯</div><div className="val-title">Outcome-obsessed</div><div className="val-body">Every feature is evaluated on one question: does it improve how aspirants prepare and perform? We don&apos;t build for vanity metrics. We build for results. If a feature doesn&apos;t move the needle for an aspirant, it doesn&apos;t ship.</div></div>
            <div className="val r d2"><div className="val-num">02</div><div className="val-icon"><img src="/sidebar-jeet-gpt.png" alt="Jeet AI Mentor" style={{ width: 32, height: 32, objectFit: 'contain' }} /></div><div className="val-title">AI-first, human-always</div><div className="val-body">AI brings speed, 60-second mains evaluation, adaptive test generation, instant feedback. But UPSC demands judgment, not just knowledge. That&apos;s why every AI feature is grounded in deep, authentic UPSC domain understanding.</div></div>
            <div className="val r d3"><div className="val-num">03</div><div className="val-icon">🇮🇳</div><div className="val-title">India-first by design</div><div className="val-body">We build for the aspirant in Ranchi, Muzaffarpur, and Jalgaon, not just Rajendra Nagar. That means low-bandwidth compatibility, Hindi support, content grounded in India&apos;s Constitution and current affairs, and pricing that respects what  means to a family.</div></div>
            <div className="val r d1"><div className="val-num">04</div><div className="val-icon">🔬</div><div className="val-title">Evidence, not instinct</div><div className="val-body">Our adaptive test engine doesn&apos;t guess your weak areas, it calculates them from your actual response data. Our readiness score updates daily from real performance. Every recommendation is earned, not assumed.</div></div>
            <div className="val r d2"><div className="val-num">05</div><div className="val-icon">👥</div><div className="val-title">Community over competition</div><div className="val-body">UPSC is typically a solo journey. We disagree. Our live study rooms, peer review system, and leaderboards are built on the belief that aspirants who hold each other accountable clear the exam together. Alone we can do so little; together we rise so much higher.</div></div>
            <div className="val r d3"><div className="val-num">06</div><div className="val-icon">💸</div><div className="val-title">Radically transparent pricing</div><div className="val-body">Data storage, AI model training on UPSC-specific content, infrastructure, it all has real costs. We will only ever charge what it takes to keep this platform running and make it better. Not a rupee more. This is written into our DNA.</div></div>
          </div>
        </div>
      </section>

      {/* FOUNDER */}
      <section className="sec founder">
        <div className="inner">
          <div className="fo-grid">
            <div className="fo-card r">
              <div className="fo-av">A</div>
              <div className="fo-name">Abhijeet Soni</div>
              <div className="fo-title">Founder &amp; Mentor · RiseWithJeet</div>
              <div className="fo-tags">
                <div className="fo-tag"><span>🎓</span> IIT Kharagpur Alumnus</div>
                <div className="fo-tag"><span>🤖</span> AI/ML &amp; Data Science Leader</div>
                <div className="fo-tag"><span>▶️</span> 1M+ YouTube Views</div>
                <div className="fo-tag"><span>✈️</span> 5,000+ Telegram Community</div>
                <a
                  href="https://www.linkedin.com/in/risewithjeet/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fo-tag"
                  style={{ textDecoration: 'none', color: 'rgba(255,255,255,.54)' }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', background: '#0A66C2', borderRadius: '3px', flexShrink: 0 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </span>
                  LinkedIn Profile
                </a>
              </div>
            </div>
            <div className="fo-story">
              <div className="eyebrow r"><div className="ey-line" style={{ background: 'var(--gold)' }}></div><span className="ey-txt">The Founder</span></div>
              <h2 className="r">A Dream That Never Left:<br /><em>Democratizing UPSC preparation</em></h2>
              <p className="r d1">Abhijeet Soni graduated from <strong>IIT Kharagpur</strong>, built a career at the intersection of Artificial Intelligence and Data Science. On paper, his path was clearly set. But something else had always been running in parallel.</p>
              <p className="r d1">During his college years, Abhijeet developed a deep fascination with governance, policy, and the real-world impact of public service in India. He didn&apos;t study Polity and History merely as exam topics, <strong>he studied them as windows into the soul of the nation.</strong> The Constitution wasn&apos;t just syllabus; it was architecture. Current affairs wasn&apos;t just revision; it was citizenship.</p>
              <p className="r d2">While his professional path led deeper into AI, building systems that learn, adapt, and scale, his passion for UPSC, for lifelong learning, and for empowering others never dimmed. He saw up close how transformative the right preparation could be, and how inaccessible it still was for millions of aspirants outside a handful of cities.</p>
              <div className="fo-quote r d2">
                <div className="fo-q-txt">&quot;My career led me into AI and data science, but my passion for UPSC, for lifelong learning, and for empowering people on this challenging path has remained a constant. I started RiseWithJeet to help aspirants prepare smarter, navigate the complexities of UPSC with clarity and confidence, and ultimately contribute to nation-building. Alone we can do so little; together we can rise so much higher.&quot;</div>
                <div className="fo-q-attr">Abhijeet, Founder &amp; Mentor Rise With Jeet | UPSC Simplified</div>
              </div>
              <p className="r d3">In February 2025, he stopped waiting and started building. A simple but powerful question guided the journey: what if the same AI-driven approaches used to personalize learning and solve complex problems could make high-quality UPSC preparation accessible to aspirants in every town, without the high costs traditionally attached to it? The YouTube channel became the first step. The platform that followed was built to take that vision further.</p>
              <p className="r d3">Today, Abhijeet personally reviews the AI evaluation models, curates the content roadmap, and continues to show up in the community the same way he did on Day 1, answering doubts, recording lectures, simplifying learners&apos; journeys. <strong>The channel may have grown. The intention hasn&apos;t changed by a single word.</strong></p>
            </div>
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="sec timeline">
        <div className="inner">
          <div className="r">
            <div className="eyebrow"><div className="ey-line"></div><span className="ey-txt">Our Journey</span></div>
            <h2 className="sec-title">One year.<br /><em>One mission. Built with love.</em></h2>
            <p className="sec-lead" style={{ marginTop: '12px' }}>Everything you see today, the platform, the community, the AI tools, was built in under a year, from zero, by people who genuinely believe every aspirant deserves a fair shot.</p>
          </div>
          <div className="tl">

            <div className="tl-item r d1">
              <div className="tl-dot">▶️</div>
              <div>
                <div className="tl-year">February 2025</div>
                <div className="tl-title">The YouTube channel goes live</div>
                <div className="tl-body">Abhijeet publishes the first RiseWithJeet video. The premise is simple: high-quality UPSC content, completely free, for anyone with an internet connection. No paid courses locked behind a wall. No institute affiliation. Just clear, honest teaching for aspirants who deserve better. The early videos gain traction quickly, students bookmark them, come back to them, share them in groups. Something about the teaching style clicks.</div>
                <span className="tl-badge" style={{ background: 'rgba(29,164,92,.1)', color: '#0f7a3e', border: '1px solid rgba(29,164,92,.28)' }}>▶️ The spark</span>
              </div>
            </div>

            <div className="tl-item r d2">
              <div className="tl-dot">🔥</div>
              <div>
                <div className="tl-year">March – April 2025</div>
                <div className="tl-title">&quot;108 National Parks in 20 minutes&quot;, the video that spread everywhere</div>
                <div className="tl-body">One video changes the trajectory of the channel. Abhijeet demonstrates how to memorise all 108 National Parks of India in under 20 minutes using structured mnemonics, a topic most aspirants dread. The video travels across Telegram groups, study circles, and classroom chats. It crosses hundreds of thousands of views. Students who had never heard of RiseWithJeet start subscribing. For the first time, the community feels a real energy shift, this isn&apos;t just another YouTube channel.</div>
                <span className="tl-badge" style={{ background: 'rgba(232,184,75,.12)', color: '#9a7000', border: '1px solid rgba(232,184,75,.35)' }}>🔥 Viral moment</span>
              </div>
            </div>

            <div className="tl-item r d1">
              <div className="tl-dot">✈️</div>
              <div>
                <div className="tl-year">Mid 2025</div>
                <div className="tl-title">A Telegram community forms, and becomes something real</div>
                <div className="tl-body">A Telegram group starts as a simple extension of the channel, a place to ask questions and share notes. Within weeks, it crosses 5,000 members. Abhijeet shows up daily: answering doubts, reviewing answer scripts with personal feedback, holding late-night doubt sessions. What begins as a study group starts to feel like a movement. Students from small towns across India, many without access to quality coaching, find a space where someone actually responds when they ask for help.</div>
                <span className="tl-badge" style={{ background: 'rgba(8,145,178,.1)', color: '#0774a0', border: '1px solid rgba(8,145,178,.28)' }}>✈️ Community grows</span>
              </div>
            </div>

            <div className="tl-item r d2">
              <div className="tl-dot">💡</div>
              <div>
                <div className="tl-year">Late 2025</div>
                <div className="tl-title">The insight that changes everything: a channel isn&apos;t enough</div>
                <div className="tl-body">As the community grows, one pattern becomes impossible to ignore. Aspirants aren&apos;t failing from lack of dedication, they&apos;re failing from lack of the right feedback, the right structure, and consistent accountability. A YouTube video can inspire. But it can&apos;t tell you why your answer didn&apos;t make the cut, or where exactly your thinking broke down. It can&apos;t adapt to your blind spots. It can&apos;t keep you on track on the days motivation runs out. Abhijeet realises that to truly change outcomes, the platform needs to go much deeper. He begins building.</div>
                <span className="tl-badge" style={{ background: 'rgba(30,53,96,.09)', color: '#26427a', border: '1px solid rgba(30,53,96,.2)' }}>💡 The decision</span>
              </div>
            </div>

            <div className="tl-item r d1">
              <div className="tl-dot">🚀</div>
              <div>
                <div className="tl-year">May, 2026</div>
                <div className="tl-title">RiseWithJeet becomes a complete UPSC preparation ecosystem</div>
                <div className="tl-body">The platform launches with everything the Telegram community had been asking for: Daily MCQ practice, Mains answer evaluation, a UPSC-tagged current affairs digest updated every morning at 8 AM, a full syllabus tracker across GS I–IV, adaptive mock tests, and live study rooms for community accountability. Priced at a fair monthly price and built with complete pricing transparency.</div>
                <span className="tl-badge" style={{ background: 'rgba(232,184,75,.12)', color: '#9a7000', border: '1px solid rgba(232,184,75,.35)' }}>🚀 Platform launch</span>
              </div>
            </div>

            <div className="tl-item r d2">
              <div className="tl-dot" style={{ borderColor: 'var(--gold)', background: 'var(--gold-dim)' }}>⭐</div>
              <div>
                <div className="tl-year">2026, Today</div>
                <div className="tl-title">15,000 aspirants. The mission continues, unchanged.</div>
                <div className="tl-body">Today, 15,000+ aspirants use RiseWithJeet daily. The platform has Daily MCQs, AI Mains Evaluation, Current Affairs, Syllabus Tracking, Mock Tests, Flashcards, Study Rooms, and Personal Mentorship, all under one roof, at one honest price. And still: Abhijeet shows up in the community the same way he did on the very first day.</div>
                <span className="tl-badge" style={{ background: 'rgba(232,184,75,.12)', color: '#9a7000', border: '1px solid rgba(232,184,75,.35)' }}>⭐ Where we stand today</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta" style={{ background: 'transparent', padding: '60px 20px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', background: 'linear-gradient(145deg,#0d1528,#141e35)', borderRadius: '24px', padding: '56px 48px', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,.4)' }}>
          <h2 className="r" style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', marginBottom: '16px' }}>Your UPSC Journey<br />Starts <em style={{ color: '#E8B84B' }}>Today</em></h2>
          <p className="r d1" style={{ color: 'rgba(255,255,255,.65)', fontSize: '1rem', maxWidth: '500px', margin: '0 auto 32px' }}>Smart preparation, structured planning, and AI-powered insights, everything serious aspirants need, in one place.</p>
          <div className="cta-btns r d2" style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-g" onClick={() => { window.location.href = '/?auth=signup'; }}>Start Free Trial →</button>
            <button className="btn-o" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.2)', color: '#fff' }} onClick={() => { window.location.href = '/contact'; }}>Connect Us</button>
          </div>
        </div>
      </section>
    </>
  );
}
