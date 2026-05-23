'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import LandingNav from '@/components/LandingNav';
import Footer from '@/components/Footer';

const TOC_ITEMS = [
  { id: 's1', num: '01', label: 'Acceptance' },
  { id: 's2', num: '02', label: 'Who Can Use' },
  { id: 's3', num: '03', label: 'Your Account' },
  { id: 's4', num: '04', label: 'Subscriptions' },
  { id: 's5', num: '05', label: 'Permitted Use' },
  { id: 's6', num: '06', label: 'Prohibited Use' },
  { id: 's7', num: '07', label: 'Intellectual Property' },
  { id: 's8', num: '08', label: 'AI Tools' },
  { id: 's9', num: '09', label: 'Liability' },
  { id: 's10', num: '10', label: 'Termination' },
  { id: 's11', num: '11', label: 'Governing Law' },
  { id: 's12', num: '12', label: 'Contact' },
];

function jumpTo(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function TermsContent() {
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
      <section className="relative overflow-hidden bg-[#090e1c] pt-32 pb-20 text-center text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 -top-32 h-[500px] w-[500px]"
          style={{ background: 'radial-gradient(circle, rgba(232,184,75,0.08) 0%, transparent 65%)' }}
        />
        <div className="relative z-10 mx-auto max-w-3xl px-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#e8b84b]/30 bg-[#e8b84b]/10 px-4 py-1.5 text-xs font-medium text-[#e8b84b]">
            Terms &amp; Policies
          </div>
          <div className="mb-3 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] text-amber-400/70">
            <span className="h-px w-8 bg-amber-400/30" />
            Simple, Transparent &amp; Secure
            <span className="h-px w-8 bg-amber-400/30" />
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '60.80px', fontWeight: 600, lineHeight: '69.92px', color: '#fff' }}>
            Terms &amp; <em style={{ color: '#E8B84B', fontStyle: 'italic', fontWeight: 400 }}>Policies</em>
          </h1>
          <p className="mt-4" style={{ fontSize: '13px', fontFamily: "'DM Sans', system-ui, sans-serif", lineHeight: '20.80px' }}>
            <span style={{ color: 'rgba(255,255,255,0.60)', fontWeight: 500 }}>Effective date:</span>
            <span style={{ color: 'rgba(255,255,255,0.38)', fontWeight: 400 }}> February 1, 2025 &nbsp;&middot;&nbsp; </span>
            <span style={{ color: 'rgba(255,255,255,0.60)', fontWeight: 500 }}>Last updated:</span>
            <span style={{ color: 'rgba(255,255,255,0.38)', fontWeight: 400 }}> 1 May, 2026</span>
          </p>
        </div>
      </section>

      {/* Body */}
      <section className="terms-body">
        <div className="terms-inner">
          {/* TOC Sidebar */}
          <aside className="terms-toc">
            <div className="terms-toc-label">Contents</div>
            {TOC_ITEMS.map((item) => (
              <div
                key={item.id}
                className={`terms-toc-item${activeId === item.id ? ' active' : ''}`}
                onClick={() => jumpTo(item.id)}
              >
                <span className="terms-toc-num">{item.num}</span>
                {item.label}
              </div>
            ))}
            <div className="terms-toc-sep" />
            <div className="terms-toc-contact">
              <div className="terms-toc-contact-lbl">Questions?</div>
              <div className="terms-toc-contact-val">together@risewithjeet.com</div>
            </div>
          </aside>

          {/* Content */}
          <div>
            {/* 01 - Acceptance */}
            <div className="lc-sec" id="s1" ref={setSectionRef(0)}>
              <div className="lc-num">01</div>
              <div className="lc-h2">Acceptance of Terms</div>
              <div className="lc-info">
                <div className="lc-info-ico">&#128161;</div>
                <div className="lc-info-txt">
                  <strong>Short version:</strong> By accessing or using RiseWithJeet, you acknowledge and agree to these Terms. If you do not agree with any part of them, you may not use the platform or its services.
                </div>
              </div>
              <p className="lc-p">
                Welcome to RiseWithJeet. These Terms of Service (&ldquo;Terms&rdquo;) form a legally binding agreement between you and Jeetpath Academy Pvt. Ltd. (&ldquo;RiseWithJeet&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;). They govern your access to and use of the RiseWithJeet platform, available at risewithjeet.com and through our mobile applications.
              </p>
              <p className="lc-p">
                By creating an account, accessing the platform, or using any of our features, you confirm that you have read, understood, and agree to be bound by these Terms along with our{' '}
                <Link href="/privacy">Privacy Policy</Link>.
              </p>
            </div>

            {/* 02 - Who Can Use */}
            <div className="lc-sec" id="s2" ref={setSectionRef(1)}>
              <div className="lc-num">02</div>
              <div className="lc-h2">Who Can Use RiseWithJeet</div>
              <p className="lc-p">
                To use RiseWithJeet, you must be at least 13 years of age. If you are under 13, you may only access or use the platform with the express consent of a parent or legal guardian. By accessing or using RiseWithJeet, you confirm that you meet this eligibility requirement.
              </p>
              <p className="lc-p">
                If you are accessing the platform on behalf of an institution or organisation, you represent and warrant that you have the authority to bind such entities to these Terms.
              </p>
            </div>

            {/* 03 - Your Account */}
            <div className="lc-sec" id="s3" ref={setSectionRef(2)}>
              <div className="lc-num">03</div>
              <div className="lc-h2">Your Account</div>
              <p className="lc-p">
                You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Please keep your password secure and do not share it with anyone.
              </p>
              <ul className="lc-list">
                <li>
                  <strong>Accurate information:</strong>
                  <span>You agree to provide accurate, current, and complete information when creating your account and to keep it updated.</span>
                </li>
                <li>
                  <strong>One account per person:</strong>
                  <span>You may not create multiple accounts or share a single account with other individuals.</span>
                </li>
                <li>
                  <strong>Account Security &amp; Unauthorised Access:</strong>
                  <span>If you suspect any unauthorised access, security breach, or misuse of your account, please notify us immediately at{' '}
                  <a href="mailto:together@risewithjeet.com">together@risewithjeet.com</a></span>
                </li>
              </ul>
            </div>

            {/* 04 - Subscriptions and Payments */}
            <div className="lc-sec" id="s4" ref={setSectionRef(3)}>
              <div className="lc-num">04</div>
              <div className="lc-h2">Subscriptions and Payments</div>
              <p className="lc-p">
                Certain features and learning resources on RiseWithJeet may be available through a paid subscription. By subscribing, you agree to pay the applicable fee displayed at the time of purchase (&ldquo;Subscription Fee&rdquo;) for the selected plan duration (&ldquo;Subscription Period&rdquo;).
              </p>
              <ul className="lc-list">
                <li>
                  <strong>Billing:</strong>
                  <span>Subscriptions may be offered on a monthly, quarterly, or annual basis, depending on the plan selected at checkout. Payments are charged in advance for the chosen billing period. Applicable taxes, including GST (where required), will be displayed at checkout and charged in accordance with applicable laws.</span>
                </li>
                <li>
                  <strong>Renewal of Subscription:</strong>
                  <span>Where auto-renewal is enabled, your subscription may automatically renew at the end of the Subscription Period at the prevailing rate unless cancelled before the renewal date. If pricing changes affect your subscription, we will provide prior notice wherever reasonably possible.</span>
                </li>
                <li>
                  <strong>Cancellation:</strong>
                  <span>You may manage or cancel your subscription at any time through your Account Settings or by contacting our support team. Cancellation will take effect at the end of your current Subscription Period, and you will continue to have access to paid features until then.</span>
                </li>
                <li>
                  <strong>Refunds:</strong>
                  <span>We want learners to have a fair and transparent experience. Refund eligibility, timelines, and conditions are governed by our <Link href="/refund">Refund Policy</Link>. As RiseWithJeet provides access to digital educational content and platform features, refunds for partially used subscription periods may not be available unless required by applicable law or explicitly stated in our policies.</span>
                </li>
                <li>
                  <strong>Failed or Unsuccessful Payments:</strong>
                  <span>If a payment is declined, unsuccessful, or overdue, we may temporarily suspend or limit access to paid features until payment is successfully completed.</span>
                </li>
                <li>
                  <strong>Promotional Pricing &amp; Discounts:</strong>
                  <span>From time to time, RiseWithJeet may offer promotional pricing, scholarships, discounts, or special offers. Such offers are valid only for the stated period and may not automatically apply to future renewals unless explicitly mentioned.</span>
                </li>
                <li>
                  <strong>Changes to Plans or Pricing:</strong>
                  <span>We may update our subscription plans or pricing from time to time to improve the platform and learning experience. If a change affects an active subscription, we will provide reasonable notice in advance. Continued use of the Service after such changes take effect constitutes acceptance of the updated pricing or plan.</span>
                </li>
              </ul>
            </div>

            {/* 05 - Permitted Use */}
            <div className="lc-sec" id="s5" ref={setSectionRef(4)}>
              <div className="lc-num">05</div>
              <div className="lc-h2">Permitted Use</div>
              <p className="lc-p">
                Subject to compliance with these Terms, RiseWithJeet grants you a limited, personal, non-exclusive, non-transferable, and revocable licence to access and use the platform for your individual educational and exam preparation purposes. You may use RiseWithJeet to:
              </p>
              <ul className="lc-list">
                <li>
                  Access platform features, courses, analytics, and study resources available under your selected subscription plan
                </li>
                <li>
                  Attempt quizzes, submit answers, MCQ responses, tests, and other study-related content for your personal learning and progress tracking
                </li>
                <li>
                  Download materials specifically marked as downloadable for personal, non-commercial, offline use only
                </li>
                <li>
                  Create, upload, and share your own study notes, insights, discussions, or contributions within community features, where available, in accordance with platform guidelines
                </li>
              </ul>
              <p className="lc-p">
                Your access to RiseWithJeet is intended solely for personal educational use and may not be used for commercial, institutional, or unauthorised purposes without prior written permission from RiseWithJeet.
              </p>
            </div>

            {/* 06 - Prohibited Use */}
            <div className="lc-sec" id="s6" ref={setSectionRef(5)}>
              <div className="lc-num">06</div>
              <div className="lc-h2">Prohibited Use</div>
              <p className="lc-p">
                To maintain a fair, secure, and high-quality learning environment, you agree not to use RiseWithJeet in any manner that may harm the platform, interfere with other users, or compromise the integrity of the learning experience. The following activities are strictly prohibited:
              </p>
              <ul className="lc-list">
                <li>
                  <strong>Content Copying, Scraping &amp; Redistribution:</strong>
                  <span>Copying, reproducing, scraping, downloading in bulk, recording, redistributing, or otherwise using any platform content &mdash; including questions, explanations, videos, notes, analytics, model answers, or study material, without prior written permission from RiseWithJeet.</span>
                </li>
                <li>
                  <strong>Account Sharing &amp; Unauthorised Access:</strong>
                  <span>Sharing login credentials, allowing another person to access your account, or using another user&rsquo;s account without permission.</span>
                </li>
                <li>
                  <strong>Misuse of AI or Evaluation Systems:</strong>
                  <span>Submitting fully AI-generated responses as your own work in assessments, answer evaluators, or learning tools for the purpose of manipulating scores, rankings, analytics, or performance tracking. Our tools are intended to support learning and improvement, not misuse or unfair advantage.</span>
                </li>
                <li>
                  <strong>Impersonation &amp; Misrepresentation:</strong>
                  <span>Impersonating RiseWithJeet team members, mentors, moderators, or other users, or falsely representing an affiliation with the platform.</span>
                </li>
                <li>
                  <strong>Harmful, Fraudulent, or Disruptive Activity:</strong>
                  <span>Uploading malicious software, attempting unauthorized access, disrupting platform functionality, exploiting vulnerabilities, engaging in fraudulent activity, or otherwise interfering with the security, stability, or experience of other users.</span>
                </li>
                <li>
                  <strong>Commercial or Unauthorised Use:</strong>
                  <span>Using RiseWithJeet, its content, or services for resale, coaching, redistribution, institutional teaching, business purposes, or any unauthorised commercial activity without prior written consent.</span>
                </li>
                <li>
                  <strong>Academic Integrity &amp; Fair Usage:</strong>
                  <span>Engaging in behaviour intended to unfairly manipulate rankings, streaks, evaluations, analytics, or platform performance metrics.</span>
                </li>
              </ul>
              <div className="lc-note">
                <div className="lc-note-ico">&#9888;&#65039;</div>
                <div className="lc-note-txt">
                  Violations of these Terms may result in temporary suspension, permanent termination of access, restriction of features, or other appropriate action, with or without prior notice, depending on the severity of the violation. In cases involving misuse, fraud, account sharing, or content theft, refunds may not be provided.
                </div>
              </div>
            </div>

            {/* 07 - Intellectual Property */}
            <div className="lc-sec" id="s7" ref={setSectionRef(6)}>
              <div className="lc-num">07</div>
              <div className="lc-h2">Intellectual Property</div>
              <p className="lc-p">
                All content, materials, features, and functionality available on RiseWithJeet &mdash; including but not limited to video lectures, MCQ questions, test series, model answers, study notes, current affairs content, analytics, designs, branding, logos, software, AI-generated feedback, and platform features &mdash; are owned by or licensed to Jeetpath Academy Pvt. Ltd. and are protected under applicable copyright, trademark, intellectual property, and other laws.
              </p>
              <p className="lc-p">
                Your use of RiseWithJeet does not grant you ownership of any intellectual property rights in the platform or its content. Subject to these Terms, we grant you a limited, personal, non-exclusive, non-transferable, and revocable right to access and use platform content solely for your personal educational and UPSC preparation purposes.
              </p>
              <p className="lc-p">
                Any unauthorised use of platform content or intellectual property may result in suspension or termination of access and may lead to legal action where appropriate.
              </p>
            </div>

            {/* 08 - AI Tools */}
            <div className="lc-sec" id="s8" ref={setSectionRef(7)}>
              <div className="lc-num">08</div>
              <div className="lc-h2">AI Tools and Educational Disclaimer</div>
              <p className="lc-p">
                RiseWithJeet uses artificial intelligence (&ldquo;AI&rdquo;) to support features such as the Mains Evaluator, performance tracking, personalised insights, and the Jeet AI assistant. These tools are designed to help learners improve their preparation experience and provide additional academic support.
              </p>
              <p className="lc-p">When using AI-powered features, please keep the following in mind:</p>
              <ul className="lc-list">
                <li>
                  AI-generated feedback, evaluations, recommendations, and scores are intended for educational guidance only and should be used as supportive learning inputs alongside your own preparation and judgment.
                </li>
                <li>
                  While we continuously work to improve our AI systems, responses or suggestions may occasionally be incomplete, outdated, or inaccurate. We encourage learners to verify important information independently, especially for exam-related preparation.
                </li>
                <li>
                  RiseWithJeet is an educational preparation platform created to support UPSC aspirants through structured learning, analytics, and guidance. However, individual outcomes depend on multiple factors, including preparation, consistency, exam performance, and personal effort.
                </li>
              </ul>
            </div>

            {/* 09 - Limitation of Liability */}
            <div className="lc-sec" id="s9" ref={setSectionRef(8)}>
              <div className="lc-num">09</div>
              <div className="lc-h2">Limitation of Liability</div>
              <p className="lc-p">
                RiseWithJeet strives to provide a reliable and high-quality learning experience. However, the platform and its services are provided on an &ldquo;as available&rdquo; and &ldquo;as is&rdquo; basis, and we cannot guarantee uninterrupted, error-free, or always-accurate access.
              </p>
              <p className="lc-p">
                To the fullest extent permitted by applicable law, Jeetpath Academy Pvt. Ltd., including its directors, employees, affiliates, mentors, partners, and service providers, shall not be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages arising out of or related to:
              </p>
              <ul className="lc-list">
                <li>Your use of, or inability to use, the platform or any of its features</li>
                <li>Errors, interruptions, delays, temporary outages, or technical failures</li>
                <li>Loss of data, study progress, goodwill, opportunities, or expected outcomes</li>
                <li>Reliance on AI-generated feedback, analytics, recommendations, or educational content</li>
                <li>Unauthorised access to your account resulting from your failure to maintain account security</li>
              </ul>
              <p className="lc-p">
                While we make reasonable efforts to maintain platform availability and performance, we are not responsible for interruptions, downtime, maintenance periods, or events beyond our reasonable control, including internet failures, technical disruptions, third-party service outages, cyber incidents, or force majeure events.
              </p>
              <p className="lc-p">
                To the maximum extent permitted by law, our total liability for any claim arising out of or related to these Terms or your use of RiseWithJeet shall not exceed the total amount paid by you to RiseWithJeet during the three (3) months immediately preceding the event giving rise to the claim.
              </p>
              <p className="lc-p">
                Nothing in these Terms limits liability that cannot be excluded or limited under applicable law.
              </p>
            </div>

            {/* 10 - Termination */}
            <div className="lc-sec" id="s10" ref={setSectionRef(9)}>
              <div className="lc-num">10</div>
              <div className="lc-h2">Termination</div>
              <p className="lc-p">Either party may terminate the relationship at any time:</p>
              <ul className="lc-list">
                <li>
                  <strong>By you:</strong>
                  <span>You may delete your account at any time from Account Settings. This ends your access to paid features at the close of your current billing period.</span>
                </li>
                <li>
                  <strong>By us:</strong>
                  <span>We may suspend or terminate your account if you violate these Terms, engage in prohibited activity, or if we have reason to believe your account has been compromised. We will notify you where reasonably possible.</span>
                </li>
              </ul>
              <p className="lc-p">
                On termination, your right to use the platform ceases. Sections of these Terms that by their nature should survive termination, including intellectual property rights and limitation of liability, will remain in effect.
              </p>
            </div>

            {/* 11 - Governing Law */}
            <div className="lc-sec" id="s11" ref={setSectionRef(10)}>
              <div className="lc-num">11</div>
              <div className="lc-h2">Governing Law</div>
              <p className="lc-p">
                These Terms are governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts located in New Delhi, India.
              </p>
              <p className="lc-p">
                We encourage you to reach out to us directly before pursuing any formal legal action. Most concerns can be resolved quickly through a conversation.
              </p>
            </div>

            {/* 12 - Contact Us */}
            <div className="lc-sec" id="s12" ref={setSectionRef(11)}>
              <div className="lc-num">12</div>
              <div className="lc-h2">Contact Us</div>
              <p className="lc-p">
                If you have questions about these Terms or need clarification on anything, please get in touch.
              </p>
              <div className="lc-info">
                <div className="lc-info-ico">&#128236;</div>
                <div className="lc-info-txt">
                  Email:{' '}
                  <a href="mailto:together@risewithjeet.com" style={{ color: 'var(--navy-5)' }}>
                    together@risewithjeet.com
                  </a>
                </div>
              </div>
              <p className="lc-p">
                We may update these Terms from time to time. When we do, we will update the &ldquo;Last updated&rdquo; date above and notify you if the changes are material. Continued use of the platform after changes are posted means you accept the updated Terms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA - Smaller dark box with white background behind */}
      <section className="terms-cta-wrapper">
        <div className="terms-cta-box">
          <h2>
            Questions about our
            <em>Terms of Service?</em>
          </h2>
          <p>We are happy to clarify anything. Reach out to us and our team will respond.</p>
          <div className="terms-cta-row">
            <a href="mailto:together@risewithjeet.com" className="terms-btn-gold">
              Email: together@risewithjeet.com
            </a>
            <Link href="/contact" className="terms-btn-outline">
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
        .terms-hero {
          min-height: 38vh;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          padding-top: 64px;
          background: linear-gradient(135deg, var(--navy) 0%, var(--navy-4) 50%, var(--navy-5) 100%);
        }
        .terms-hero-bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 60% 80% at 50% 40%, rgba(232, 184, 75, 0.06) 0%, transparent 65%);
        }
        .terms-hero-inner {
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
        .terms-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 20px;
          padding: 6px 16px;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 14px;
        }
        .terms-eyebrow {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          justify-content: center;
        }
        .terms-ey-line {
          width: 44px;
          height: 1px;
          background: var(--gold);
          opacity: 0.6;
        }
        .terms-ey-txt {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          color: var(--gold);
          text-transform: uppercase;
        }
        .terms-h1 {
          font-family: var(--serif);
          font-size: clamp(2.2rem, 4.5vw, 3.8rem);
          font-weight: 600;
          line-height: 1.15;
          color: #fff;
          margin-bottom: 10px;
        }
        .terms-h1 em {
          font-style: italic;
          color: var(--gold);
          font-weight: 400;
        }
        .terms-meta {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.38);
        }
        .terms-meta strong {
          color: rgba(255, 255, 255, 0.6);
          font-weight: 500;
        }

        /* ── BODY ── */
        .terms-body {
          background: var(--white);
          padding: 64px 0;
        }
        .terms-inner {
          max-width: 1060px;
          margin: 0 auto;
          padding: 0 48px;
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 56px;
          align-items: start;
        }

        /* ── TOC ── */
        .terms-toc {
          position: sticky;
          top: 96px;
          align-self: start;
          max-height: calc(100vh - 112px);
          overflow: hidden;
        }
        .terms-toc-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          color: var(--t3);
          margin-bottom: 12px;
        }
        .terms-toc-item {
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
        .terms-toc-item:hover {
          color: var(--t1);
          background: var(--cream);
          border-left-color: var(--gold);
        }
        .terms-toc-item.active {
          color: var(--navy-5);
          background: var(--cream);
          border-left-color: var(--gold);
          font-weight: 600;
        }
        .terms-toc-num {
          font-family: var(--serif);
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--gold);
          flex-shrink: 0;
          width: 16px;
        }
        .terms-toc-sep {
          height: 1px;
          background: var(--b1);
          margin: 12px 0;
        }
        .terms-toc-contact {
          background: var(--cream);
          border: 1.5px solid var(--b1);
          border-radius: 10px;
          padding: 14px;
          margin-top: 12px;
        }
        .terms-toc-contact-lbl {
          font-size: 10px;
          font-weight: 700;
          color: var(--t3);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 6px;
        }
        .terms-toc-contact-val {
          font-size: 13px;
          color: var(--navy-5);
          font-weight: 500;
          word-break: break-all;
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
          gap: 9px;
        }
        .lc-list li {
          position: relative;
          font-size: 14px;
          color: var(--t2);
          line-height: 1.7;
          padding: 11px 15px 11px 32px;
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
          top: 19px;
        }
        .lc-list li:has(strong) {
          display: grid;
          grid-template-columns: 178px 1fr;
          column-gap: 18px;
          align-items: start;
        }
        .lc-list li strong {
          color: var(--t1);
          font-weight: 600;
          line-height: 1.55;
        }
        .lc-list li span {
          min-width: 0;
        }

        /* ── CTA ── */
        .terms-cta-wrapper {
          background: var(--white);
          padding: 64px 48px 104px;
          display: flex;
          justify-content: center;
        }
        .terms-cta-box {
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
        .terms-cta-box::before {
          content: '';
          position: absolute;
          top: -80px;
          left: -80px;
          width: 320px;
          height: 320px;
          border-radius: 160px;
          background: rgba(232, 184, 75, 0.06);
        }
        .terms-cta-box::after {
          content: '';
          position: absolute;
          right: -82px;
          bottom: -50px;
          width: 250px;
          height: 250px;
          border-radius: 125px;
          background: rgba(46, 93, 179, 0.08);
        }
        .terms-cta-box h2 {
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
        .terms-cta-box h2 em {
          display: block;
          font-style: italic;
          color: var(--gold);
          font-weight: 600;
        }
        .terms-cta-box p {
          font-family: 'Outfit', var(--sans);
          font-size: 16px;
          color: rgba(255, 255, 255, 0.58);
          max-width: 489px;
          margin: 0 auto 23px;
          line-height: 26.4px;
          position: relative;
          z-index: 1;
        }
        .terms-cta-row {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
          position: relative;
          z-index: 1;
        }
        .terms-btn-gold {
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
        .terms-btn-gold:hover {
          filter: brightness(1.06);
          transform: translateY(-2px);
        }
        .terms-btn-outline {
          min-width: 189px;
          height: 52px;
          background: rgba(255, 255, 255, 0.06);
          color: #fff;
          padding: 0 24px;
          border-radius: 12px;
          font-size: 15.5px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.20);
          font-family: 'Outfit', var(--sans);
          transition: all 0.2s;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(4px);
        }
        .terms-btn-outline:hover {
          border-color: rgba(255, 255, 255, 0.32);
          background: rgba(255, 255, 255, 0.09);
          color: #fff;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 860px) {
          .terms-inner {
            grid-template-columns: 1fr;
            padding: 0 22px;
          }
          .terms-toc {
            position: static;
            display: none;
          }
          .terms-hero-inner {
            padding: 32px 22px 24px;
          }
          .terms-cta-wrapper {
            padding: 48px 22px;
          }
          .terms-cta-box {
            min-height: auto;
            padding: 52px 24px;
          }
          .terms-cta-box h2 {
            font-size: 36px;
            line-height: 42px;
            letter-spacing: -0.6px;
          }
          .terms-cta-box p {
            font-size: 15px;
            line-height: 24px;
          }
          .terms-btn-gold,
          .terms-btn-outline {
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
