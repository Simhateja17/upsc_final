'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import LandingNav from '@/components/LandingNav';
import Footer from '@/components/Footer';

const TOC_ITEMS = [
  { id: 's1', num: '01', label: 'Overview' },
  { id: 's2', num: '02', label: 'What We Collect' },
  { id: 's3', num: '03', label: 'How We Use It' },
  { id: 's4', num: '04', label: 'Sharing Your Data' },
  { id: 's5', num: '05', label: 'Security' },
  { id: 's6', num: '06', label: 'Your Rights' },
  { id: 's7', num: '07', label: 'Cookies' },
  { id: 's8', num: '08', label: 'Children' },
  { id: 's9', num: '09', label: 'Changes' },
  { id: 's10', num: '10', label: 'Contact Us' },
];

function jumpTo(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function PrivacyContent() {
  const [activeId, setActiveId] = useState('s1');
  const sectionsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { threshold: 0.3, rootMargin: '-80px 0px -40% 0px' }
    );

    sectionsRef.current.forEach((sec) => {
      if (sec) observer.observe(sec);
    });

    return () => observer.disconnect();
  }, []);

  const setSectionRef = (idx: number) => (el: HTMLDivElement | null) => {
    sectionsRef.current[idx] = el;
  };

  return (
    <>
      <LandingNav />

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-hero-bg" aria-hidden="true" />
        <div className="lp-hero-inner">
          <div className="lp-badge">
            <span>🔏</span> Privacy Policy
          </div>
          <div className="lp-eyebrow">
            <span className="lp-ey-line" />
            <span className="lp-ey-txt">Private, Secure &amp; Transparent</span>
            <span className="lp-ey-line" />
          </div>
          <h1 className="lp-h1">
            Privacy <em>Policy</em>
          </h1>
          <p className="lp-meta">
            <strong>Effective date:</strong> February 1, 2025 &nbsp;&middot;&nbsp;{' '}
            <strong>Last updated:</strong> May 1, 2026
          </p>
        </div>
      </section>

      {/* Body */}
      <section className="lp-body">
        <div className="lp-inner">
          {/* TOC Sidebar */}
          <aside className="lp-toc">
            <div className="lp-toc-label">Contents</div>
            {TOC_ITEMS.map((item) => (
              <div
                key={item.id}
                className={`lp-toc-item${activeId === item.id ? ' active' : ''}`}
                onClick={() => jumpTo(item.id)}
              >
                <span className="lp-toc-num">{item.num}</span>
                {item.label}
              </div>
            ))}
            <div className="lp-toc-sep" />
            <div className="lp-toc-contact">
              <div className="lp-toc-contact-lbl">Privacy queries</div>
              <a href="mailto:together@risewithjeet.com" className="lp-toc-contact-val">
                together@risewithjeet.com
              </a>
            </div>
          </aside>

          {/* Content */}
          <div>
            {/* 01 - Overview */}
            <div className="lc-sec" id="s1" ref={setSectionRef(0)}>
              <div className="lc-num">01</div>
              <div className="lc-h2">Overview</div>
              <div className="lc-info">
                <div className="lc-info-ico">💡</div>
                <div className="lc-info-txt">
                  <strong>Short version:</strong> We collect only what we need to make
                  RiseWithJeet work well for you. We never sell your data.
                </div>
              </div>
              <p className="lc-p">
                Jeetpath Academy Pvt. Ltd. (&ldquo;RiseWithJeet&rdquo;,
                &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates
                the RiseWithJeet platform available at risewithjeet.in and through our
                mobile applications. This Privacy Policy explains what personal data
                we collect, why we collect it, how we use it, and the rights you have
                over it.
              </p>
              <p className="lc-p">
                We take your privacy seriously and have written this policy in plain
                language. If anything is unclear, write to us at{' '}
                <a href="mailto:together@risewithjeet.com">together@risewithjeet.com</a>{' '}
                and we will explain it.
              </p>
              <p className="lc-p">
                By using the platform, you agree to the practices described here.
              </p>
            </div>

            {/* 02 - What We Collect */}
            <div className="lc-sec" id="s2" ref={setSectionRef(1)}>
              <div className="lc-num">02</div>
              <div className="lc-h2">What We Collect</div>
              <p className="lc-p">
                We collect information you give us directly, and information that is
                generated when you use the platform.
              </p>

              <div className="lc-table-wrap">
                <table className="lc-table">
                  <thead>
                    <tr>
                      <th className="lc-table-h-gold">Category</th>
                      <th className="lc-table-h-dim">What it includes</th>
                      <th className="lc-table-h-dim">Why we collect it</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="lc-table-strong">Account information</td>
                      <td>Name, email address, phone number</td>
                      <td>To create and manage your account</td>
                    </tr>
                    <tr className="lc-table-alt">
                      <td className="lc-table-strong">Study data</td>
                      <td>MCQ responses, test scores, answers submitted, time spent, streak activity</td>
                      <td>To power analytics, AI evaluation, and personalised recommendations</td>
                    </tr>
                    <tr>
                      <td className="lc-table-strong">Payment data</td>
                      <td>Transaction ID, plan purchased, billing date. Card details are processed by Razorpay and are never stored by us.</td>
                      <td>Subscription management and invoicing</td>
                    </tr>
                    <tr className="lc-table-alt">
                      <td className="lc-table-strong">Device and usage data</td>
                      <td>IP address, browser type, device model, OS, pages visited, session duration</td>
                      <td>Platform security, performance, and debugging</td>
                    </tr>
                    <tr>
                      <td className="lc-table-strong">Communications</td>
                      <td>Support tickets, feedback messages, emails sent to us</td>
                      <td>To respond to your queries and improve the platform</td>
                    </tr>
                    <tr className="lc-table-alt">
                      <td className="lc-table-strong">Uploaded content</td>
                      <td>Handwritten or typed answer images uploaded for AI evaluation</td>
                      <td>To run the Jeet AI Mentor Mains Evaluator and return your score</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="lc-note">
                <div className="lc-note-ico">🔒</div>
                <div className="lc-note-txt">
                  <strong>We do not collect</strong> your Aadhaar number, PAN card,
                  caste, religion, or any other sensitive personal identifiers. We
                  collect only what is necessary to run the platform.
                </div>
              </div>
            </div>

            {/* 03 - How We Use It */}
            <div className="lc-sec" id="s3" ref={setSectionRef(2)}>
              <div className="lc-num">03</div>
              <div className="lc-h2">How We Use Your Information</div>
              <p className="lc-p">
                Everything we collect is used to make RiseWithJeet work better for
                you. Here is exactly how:
              </p>
              <ul className="lc-list">
                <li>
                  <strong>Running the platform:</strong>
                  <span>Processing your answers, generating performance reports, powering the AI Mains Evaluator, and serving your daily MCQs and current affairs.</span>
                </li>
                <li>
                  <strong>Personalisation:</strong>
                  <span>Identifying your weak areas, building adaptive test sets, and generating your AI study planner based on your actual progress data.</span>
                </li>
                <li>
                  <strong>Account and security:</strong>
                  <span>Authenticating your login, sending password reset emails, detecting suspicious activity, and protecting your account.</span>
                </li>
                <li>
                  <strong>Communication:</strong>
                  <span>Sending study reminders, streak alerts, evaluation results, and important platform updates. You can opt out of non-essential communications from Account Settings at any time.</span>
                </li>
                <li>
                  <strong>Platform improvement:</strong>
                  <span>Aggregated and anonymised usage data helps us understand which features are most useful and what to build next.</span>
                </li>
                <li>
                  <strong>Legal and compliance:</strong>
                  <span>Maintaining records required under applicable Indian law, responding to lawful authority requests, and enforcing our Terms of Service.</span>
                </li>
              </ul>
              <div className="lc-note">
                <div className="lc-note-ico">📋</div>
                <div className="lc-note-txt">
                  <strong>We do not use your data for advertising.</strong> RiseWithJeet
                  does not run ads, and we do not share your personal data with ad
                  networks.
                </div>
              </div>
            </div>

            {/* 04 - Sharing Your Data */}
            <div className="lc-sec" id="s4" ref={setSectionRef(3)}>
              <div className="lc-num">04</div>
              <div className="lc-h2">Sharing Your Data</div>
              <p className="lc-p">
                <strong>We never sell your personal data.</strong> We share it only in
                the following limited circumstances:
              </p>
              <ul className="lc-list">
                <li>
                  <strong>Service providers:</strong>
                  <span>We work with trusted third parties to operate the platform. All service providers are bound by data processing agreements and may only use your data to provide services to us.</span>
                </li>
                <li>
                  <strong>Legal requirements:</strong>
                  <span>We may disclose your information if required by law, court order, or government authority, or if we believe in good faith that disclosure is necessary to protect the rights or safety of RiseWithJeet or its users.</span>
                </li>
              </ul>
            </div>

            {/* 05 - Security */}
            <div className="lc-sec" id="s5" ref={setSectionRef(4)}>
              <div className="lc-num">05</div>
              <div className="lc-h2">Data Security</div>
              <p className="lc-p">
                We apply the following safeguards to protect your data:
              </p>
              <ul className="lc-list">
                <li>
                  <strong>Payment security:</strong>
                  <span>We do not store your card details. All payment processing is handled by Razorpay, which is PCI-DSS compliant.</span>
                </li>
                <li>
                  <strong>Ongoing security:</strong>
                  <span>We conduct periodic internal security reviews and take prompt action in the event of any suspected data security incident.</span>
                </li>
              </ul>
              <div className="lc-note">
                <div className="lc-note-ico">🛡️</div>
                <div className="lc-note-txt">
                  If you discover a security vulnerability, please report it responsibly
                  to <strong>together@risewithjeet.com</strong> before disclosing it
                  publicly. We take all responsible disclosures seriously.
                </div>
              </div>
            </div>

            {/* 06 - Your Rights */}
            <div className="lc-sec" id="s6" ref={setSectionRef(5)}>
              <div className="lc-num">06</div>
              <div className="lc-h2">Your Rights</div>
              <p className="lc-p">
                You have meaningful control over your personal data. Here are the
                rights you can exercise at any time:
              </p>
              <div className="lc-rights-grid">
                {[
                  { icon: '👁️', title: 'Access', body: 'Access your personal data and information.' },
                  { icon: '✏️', title: 'Correction', body: 'Ask us to correct inaccurate or incomplete data in your account at any time.' },
                  { icon: '🗑️', title: 'Deletion', body: 'Request deletion of your account and all associated personal data. We will process this promptly.' },
                  { icon: '📦', title: 'Portability', body: 'Export your study data, scores, and evaluation history in a portable format.' },
                  { icon: '🚫', title: 'Restriction', body: 'Ask us to stop processing your data for specific purposes, such as analytics or promotional communications.' },
                  { icon: '🔕', title: 'Opt-out', body: 'Unsubscribe from non-essential emails and notifications at any time from Account Settings.' },
                ].map((right) => (
                  <div key={right.title} className="lc-rights-card">
                    <span className="lc-rights-icon">{right.icon}</span>
                    <h3 className="lc-rights-title">{right.title}</h3>
                    <p className="lc-rights-body">{right.body}</p>
                  </div>
                ))}
              </div>
              <p className="lc-p">
                To exercise any of these rights, email us at{' '}
                <a href="mailto:together@risewithjeet.com">together@risewithjeet.com</a>{' '}
                from your registered email address. There is no charge for exercising
                your rights.
              </p>
            </div>

            {/* 07 - Cookies */}
            <div className="lc-sec" id="s7" ref={setSectionRef(6)}>
              <div className="lc-num">07</div>
              <div className="lc-h2">Cookies</div>
              <p className="lc-p">
                We use cookies to keep you logged in, remember your preferences, and
                understand how the platform is being used.
              </p>

              <div className="lc-table-wrap">
                <table className="lc-table">
                  <thead>
                    <tr>
                      <th className="lc-table-h-gold">Cookie type</th>
                      <th className="lc-table-h-dim">Purpose</th>
                      <th className="lc-table-h-dim">Can you opt out</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="lc-table-strong">Essential</td>
                      <td>Login session, CSRF protection, security tokens</td>
                      <td>No, these are required for the platform to function</td>
                    </tr>
                    <tr className="lc-table-alt">
                      <td className="lc-table-strong">Preference</td>
                      <td>Language settings, timezone, theme preference</td>
                      <td>Yes, via Account Settings</td>
                    </tr>
                    <tr>
                      <td className="lc-table-strong">Analytics</td>
                      <td>Page views, feature usage, session duration (anonymised)</td>
                      <td>Yes, via Account Settings or browser settings</td>
                    </tr>
                    <tr className="lc-table-alt">
                      <td className="lc-table-strong">Marketing</td>
                      <td>We do not currently use marketing or advertising cookies</td>
                      <td>Not applicable</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="lc-p">
                You can also control cookies through your browser settings. Note that
                disabling essential cookies will log you out of the platform.
              </p>
            </div>

            {/* 08 - Children */}
            <div className="lc-sec" id="s8" ref={setSectionRef(7)}>
              <div className="lc-num">08</div>
              <div className="lc-h2">Children&rsquo;s Privacy</div>
              <p className="lc-p">
                RiseWithJeet is intended for users who are 13 years of age or older. We
                do not knowingly collect personal data from anyone under the age of 13.
              </p>
              <p className="lc-p">
                If you are a parent or guardian and believe your child has provided
                personal data to us without your consent, please contact us at{' '}
                <a href="mailto:together@risewithjeet.com">together@risewithjeet.com</a>{' '}
                and we will promptly delete that information from our systems.
              </p>
            </div>

            {/* 09 - Changes */}
            <div className="lc-sec" id="s9" ref={setSectionRef(8)}>
              <div className="lc-num">09</div>
              <div className="lc-h2">Changes to This Policy</div>
              <p className="lc-p">
                We may update this Privacy Policy from time to time as our platform
                evolves. When we make changes, we will:
              </p>
              <ul className="lc-list">
                <li>Update the &ldquo;Last updated&rdquo; date at the top of this page</li>
                <li>Send a notification to your registered email address if the changes are material</li>
                <li>Display a notice on the platform so you are aware of what has changed</li>
              </ul>
              <p className="lc-p">
                Continued use of RiseWithJeet after changes are posted means you accept
                the updated policy. If you disagree with a change, you may delete your
                account and stop using the platform.
              </p>
            </div>

            {/* 10 - Contact Us */}
            <div className="lc-sec" id="s10" ref={setSectionRef(9)}>
              <div className="lc-num">10</div>
              <div className="lc-h2">Contact Us</div>
              <p className="lc-p">
                If you have any questions, concerns, or requests related to your
                privacy, please reach out to us. We take every message seriously.
              </p>
              <div className="lc-info">
                <div className="lc-info-ico">📬</div>
                <div className="lc-info-txt">
                  Privacy and Security Issues:{' '}
                  <a href="mailto:together@risewithjeet.com">together@risewithjeet.com</a>
                </div>
              </div>
              <p className="lc-p">
                If you feel your concern has not been adequately addressed, you have
                the right to lodge a complaint with the relevant data protection
                authority in India.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta-wrapper">
        <div className="lp-cta-box">
          <h2>
            Questions about your
            <em>Data or Privacy?</em>
          </h2>
          <p>We keep it simple and honest. Reach out if anything is unclear.</p>
          <div className="lp-cta-row">
            <a href="mailto:together@risewithjeet.com" className="lp-btn-gold">
              Email: together@risewithjeet.com
            </a>
            <Link
              href="/contact"
              className="lp-btn-outline"
              style={{
                background: '#243878',
                border: '1.5px solid rgba(255,255,255,0.35)',
                color: '#fff',
                minWidth: '189px',
                height: '52px',
                borderRadius: '12px',
                fontSize: '15.5px',
                fontWeight: 600,
                fontFamily: "'Outfit', sans-serif",
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 24px',
                textDecoration: 'none',
              }}
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      <style jsx>{`
        :root {
          --navy: #090e1c;
          --navy-2: #0c1424;
          --navy-3: #101d36;
          --navy-4: #172444;
          --navy-5: #1e3060;
          --gold: #e8b84b;
          --gold-2: #f5ce72;
          --gold-3: #c99730;
          --gold-dim: rgba(232, 184, 75, 0.12);
          --gold-ln: rgba(232, 184, 75, 0.3);
          --cream: #faf8f4;
          --white: #ffffff;
          --t1: #0c1424;
          --t2: #374560;
          --t3: #6b7a99;
          --t4: #9aa3b8;
          --b1: rgba(11, 22, 40, 0.09);
          --b2: rgba(11, 22, 40, 0.17);
          --serif: 'Cormorant Garamond', Georgia, serif;
          --sans: 'DM Sans', system-ui, sans-serif;
        }

        /* ── HERO ── */
        .lp-hero {
          min-height: 38vh;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          padding-top: 64px;
          background: linear-gradient(135deg, var(--navy) 0%, var(--navy-4) 50%, var(--navy-5) 100%);
        }
        .lp-hero-bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 60% 80% at 50% 40%, rgba(232, 184, 75, 0.06) 0%, transparent 65%);
        }
        .lp-hero-inner {
          position: relative;
          z-index: 2;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 36px 48px 28px;
          text-align: center;
        }
        /* Badge now matches the Terms hero badge: gold on a gold tint at
           12px / weight 500 (was 600 in white). */
        .lp-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(232, 184, 75, 0.1);
          border: 1px solid rgba(232, 184, 75, 0.3);
          border-radius: 20px;
          padding: 6px 16px;
          font-size: 12px;
          font-weight: 500;
          color: var(--gold);
          margin-bottom: 14px;
        }
        .lp-eyebrow {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          justify-content: center;
        }
        .lp-ey-line {
          width: 32px;
          height: 1px;
          background: var(--gold);
          opacity: 0.3;
        }
        /* Eyebrow matched to the Terms hero: 12px / weight 400 / 0.2em tracking
           (was 11px / weight 700 / 0.18em). */
        .lp-ey-txt {
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.2em;
          color: rgba(251, 191, 36, 0.7);
          text-transform: uppercase;
        }
        /* H1 now uses the exact Terms hero metrics (60.8px / 69.92px). The old
           clamp() capped at 4.5vw, so on a 1280-1366px laptop it rendered
           ~57px — visibly smaller than the Terms H1. Scaled down responsively
           below 860px (see media query). */
        .lp-h1 {
          font-family: var(--serif);
          font-size: 60.8px;
          font-weight: 600;
          line-height: 69.92px;
          color: #fff;
          margin-bottom: 10px;
        }
        .lp-h1 em {
          font-style: italic;
          color: var(--gold);
          font-weight: 400;
        }
        /* Meta line was inheriting the ambient body font and had no line-height.
           Terms sets both explicitly — matched here. */
        .lp-meta {
          font-family: var(--sans);
          font-size: 13px;
          line-height: 20.8px;
          color: rgba(255, 255, 255, 0.38);
          font-weight: 400;
        }
        .lp-meta strong {
          color: rgba(255, 255, 255, 0.6);
          font-weight: 500;
        }

        /* ── BODY ── */
        .lp-body {
          background: var(--white);
          padding: 64px 0;
        }
        .lp-inner {
          max-width: 1060px;
          margin: 0 auto;
          padding: 0 48px;
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 56px;
          align-items: start;
        }

        /* ── TOC ── */
        .lp-toc {
          position: sticky;
          top: 96px;
          align-self: start;
          max-height: calc(100vh - 112px);
          overflow: hidden;
        }
        .lp-toc-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          color: var(--t3);
          margin-bottom: 12px;
        }
        .lp-toc-item {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 7px 10px;
          border-radius: 7px;
          font-size: 13px;
          color: var(--t3);
          cursor: pointer;
          transition: all 0.15s;
          margin-bottom: 2px;
          border-left: 2px solid transparent;
        }
        .lp-toc-item:hover {
          color: var(--t1);
          background: var(--cream);
          border-left-color: var(--gold);
        }
        .lp-toc-item.active {
          color: var(--navy-5);
          background: var(--cream);
          border-left-color: var(--gold);
          font-weight: 600;
        }
        .lp-toc-num {
          font-family: var(--serif);
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--gold);
          flex-shrink: 0;
          width: 16px;
        }
        .lp-toc-sep {
          height: 1px;
          background: var(--b1);
          margin: 12px 0;
        }
        .lp-toc-contact {
          background: var(--cream);
          border: 1.5px solid var(--b1);
          border-radius: 10px;
          padding: 14px;
          margin-top: 12px;
        }
        .lp-toc-contact-lbl {
          font-size: 10px;
          font-weight: 700;
          color: var(--t3);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 6px;
        }
        .lp-toc-contact-val {
          display: block;
          font-size: 13px;
          color: var(--navy-5);
          font-weight: 500;
          word-break: break-all;
          text-decoration: none;
        }
        .lp-toc-contact-val:hover {
          text-decoration: underline;
        }

        /* ── CONTENT SECTIONS ── */
        .lc-sec {
          padding-bottom: 44px;
          margin-bottom: 44px;
          border-bottom: 1.5px solid var(--b1);
          scroll-margin-top: 84px;
        }
        .lc-sec:last-child {
          border-bottom: none;
          padding-bottom: 0;
          margin-bottom: 0;
        }
        .lc-num {
          font-family: var(--serif);
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--gold);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 7px;
        }
        .lc-h2 {
          font-family: var(--serif);
          font-size: 1.6rem;
          font-weight: 600;
          color: var(--t1);
          margin-bottom: 14px;
          line-height: 1.25;
        }
        .lc-p {
          font-size: 15px;
          color: var(--t2);
          line-height: 1.85;
          margin-bottom: 13px;
        }
        .lc-p:last-child {
          margin-bottom: 0;
        }
        .lc-p strong {
          color: var(--t1);
          font-weight: 600;
        }
        .lc-p a {
          color: var(--navy-5);
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .lc-info {
          background: var(--gold-dim);
          border: 1.5px solid var(--gold-ln);
          border-radius: 12px;
          padding: 14px 18px;
          margin-bottom: 18px;
          display: flex;
          gap: 11px;
          align-items: flex-start;
        }
        .lc-info-ico {
          font-size: 15px;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .lc-info-txt {
          font-size: 14px;
          color: var(--t1);
          line-height: 1.7;
        }
        .lc-info-txt strong {
          color: var(--navy-4);
        }
        .lc-info-txt a {
          color: var(--navy-5);
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .lc-note {
          background: rgba(26, 48, 96, 0.05);
          border: 1.5px solid rgba(26, 48, 96, 0.13);
          border-radius: 12px;
          padding: 14px 18px;
          margin-top: 18px;
          display: flex;
          gap: 11px;
          align-items: flex-start;
        }
        .lc-note-ico {
          font-size: 15px;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .lc-note-txt {
          font-size: 14px;
          color: var(--t2);
          line-height: 1.7;
        }
        .lc-note-txt strong {
          color: var(--t1);
        }
        .lc-list {
          list-style: none;
          padding: 0;
          margin: 14px 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .lc-list li {
          position: relative;
          font-size: 14px;
          color: var(--t2);
          line-height: 1.7;
          padding: 6px 15px 6px 32px;
          background: var(--cream);
          border: 1.5px solid var(--b1);
          border-radius: 9px;
        }
        .lc-list li::before {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--gold);
          position: absolute;
          left: 15px;
          top: 14px;
        }
        .lc-list li:has(strong) {
          display: grid;
          grid-template-columns: 110px 1fr;
          column-gap: 14px;
          align-items: start;
        }
        .lc-list li strong {
          color: var(--t1);
          font-weight: 600;
          line-height: 1.55;
          word-break: break-word;
        }
        .lc-list li span {
          min-width: 0;
          padding-top: 0;
        }

        /* ── TABLES ── */
        .lc-table-wrap {
          overflow-x: auto;
          margin: 18px 0;
          border-radius: 12px;
          border: 1.5px solid var(--b1);
        }
        .lc-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        .lc-table thead tr {
          background: var(--navy);
          text-align: left;
        }
        .lc-table th {
          padding: 12px 18px;
          font-weight: 600;
        }
        .lc-table-h-gold {
          color: var(--gold);
        }
        .lc-table-h-dim {
          color: rgba(255, 255, 255, 0.5);
        }
        .lc-table td {
          padding: 12px 18px;
          color: var(--t2);
          border-top: 1px solid rgba(11, 22, 40, 0.06);
          vertical-align: top;
        }
        .lc-table-strong {
          font-weight: 600;
          color: var(--t1);
          white-space: nowrap;
        }
        .lc-table-alt {
          background: #f5f3ef;
        }

        /* ── RIGHTS GRID ── */
        .lc-rights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin: 18px 0;
        }
        .lc-rights-card {
          border: 1.5px solid var(--b1);
          background: var(--white);
          border-radius: 12px;
          padding: 18px;
        }
        .lc-rights-icon {
          font-size: 20px;
        }
        .lc-rights-title {
          font-family: var(--serif);
          font-size: 15px;
          font-weight: 700;
          color: var(--t1);
          margin: 8px 0 4px;
        }
        /* Brought onto the shared body scale (14px / 1.7), matching
           .lc-note-txt and .lc-list li instead of an off-system 13px / 1.6. */
        .lc-rights-body {
          font-size: 14px;
          line-height: 1.7;
          color: var(--t3);
        }

        /* ── CTA ── */
        .lp-cta-wrapper {
          background: var(--white);
          padding: 64px 48px 104px;
          display: flex;
          justify-content: center;
        }
        .lp-cta-box {
          background: linear-gradient(135deg, #0b1530 0%, #0f2050 100%);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 24px;
          box-shadow: 0 40px 80px rgba(11, 29, 58, 0.24);
          min-height: 384px;
          padding: 69px 76px 79px;
          text-align: center;
          max-width: 700px;
          width: 100%;
          position: relative;
          overflow: hidden;
        }
        .lp-cta-box::before {
          content: '';
          position: absolute;
          top: -80px;
          left: -80px;
          width: 320px;
          height: 320px;
          border-radius: 160px;
          background: rgba(232, 184, 75, 0.06);
        }
        .lp-cta-box::after {
          content: '';
          position: absolute;
          right: -82px;
          bottom: -50px;
          width: 250px;
          height: 250px;
          border-radius: 125px;
          background: rgba(46, 93, 179, 0.08);
        }
        .lp-cta-box h2 {
          font-family: var(--serif);
          font-size: 44.8px;
          font-weight: 600;
          color: #fff;
          line-height: 53.76px;
          letter-spacing: -1.2px;
          margin: 0 0 18px;
          position: relative;
          z-index: 1;
        }
        .lp-cta-box h2 em {
          display: block;
          font-style: italic;
          color: var(--gold);
          font-weight: 600;
        }
        .lp-cta-box p {
          font-family: 'Outfit', var(--sans);
          font-size: 16px;
          color: rgba(255, 255, 255, 0.58);
          max-width: 489px;
          margin: 0 auto 23px;
          line-height: 26.4px;
          position: relative;
          z-index: 1;
        }
        .lp-cta-row {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
          position: relative;
          z-index: 1;
        }
        .lp-btn-gold {
          min-width: 286px;
          height: 53px;
          background: linear-gradient(144deg, #e8b84b 0%, #b8780a 100%);
          color: #0b1530;
          padding: 0 24px;
          border-radius: 12px;
          font-size: 15.5px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          font-family: 'Outfit', var(--sans);
          transition: all 0.2s;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 14px rgba(232, 184, 75, 0.38);
        }
        .lp-btn-gold:hover {
          filter: brightness(1.06);
          transform: translateY(-2px);
        }
        .lp-btn-outline {
          min-width: 189px;
          height: 52px;
          background: #1e3060;
          color: #fff;
          padding: 0 24px;
          border-radius: 12px;
          font-size: 15.5px;
          font-weight: 600;
          cursor: pointer;
          border: 1.5px solid rgba(255, 255, 255, 0.18);
          font-family: 'Outfit', var(--sans);
          transition: all 0.2s;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .lp-btn-outline:hover {
          background: #253d78;
          border-color: rgba(255, 255, 255, 0.35);
          color: #fff;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 860px) {
          .lp-inner {
            grid-template-columns: 1fr;
            padding: 0 22px;
          }
          .lp-toc {
            position: static;
            display: none;
          }
          .lp-hero-inner {
            padding: 32px 22px 24px;
          }
          /* Tablet/mobile: scale the now-fixed desktop H1 back down fluidly. */
          .lp-h1 {
            font-size: clamp(2.2rem, 7vw, 3.2rem);
            line-height: 1.15;
          }
          .lp-cta-wrapper {
            padding: 48px 22px;
          }
          .lp-cta-box {
            min-height: auto;
            padding: 52px 24px;
          }
          .lp-cta-box h2 {
            font-size: 36px;
            line-height: 42px;
            letter-spacing: -0.6px;
          }
          .lp-cta-box p {
            font-size: 15px;
            line-height: 24px;
          }
          .lp-btn-gold,
          .lp-btn-outline {
            width: 100%;
            min-width: 0;
          }
          .lc-list li:has(strong) {
            grid-template-columns: 1fr;
            row-gap: 4px;
          }
        }
      `}</style>
    </>
  );
}
