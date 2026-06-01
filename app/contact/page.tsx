'use client';

import React, { useState } from 'react';
import DashboardPageHero from '@/components/DashboardPageHero';
import DashboardHeader from '@/components/DashboardHeader';
import Footer from '@/components/Footer';
import { contactService } from '@/lib/services';

const subjectOptions = [
  'General inquiry',
  'Technical support',
  'Billing and payments',
  'Mentorship queries',
  'Content and syllabus',
  'AI evaluator feedback',
  'Partnership or collaboration',
  'Press and media',
  'Report a bug',
];

const reachCards = [
  {
    iconBg: 'rgba(232,184,75,0.12)',
    title: 'Email support',
    link: 'together@risewithjeet.com',
    description: 'For account, billing, and general queries',
    icon: (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/icon-gmail.png" alt="Gmail" width={20} height={20} style={{ objectFit: 'contain' }} />
    ),
  },
  {
    iconBg: 'rgba(29,164,92,0.12)',
    title: 'Telegram community',
    link: 't.me/risewithjeet',
    description: 'Live doubt clearing, notes, daily discussion',
    icon: (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/icon-telegram.png" alt="Telegram" width={20} height={20} style={{ objectFit: 'contain' }} />
    ),
  },
  {
    iconBg: 'rgba(255,0,0,0.09)',
    title: 'YouTube channel',
    link: 'youtube.com/@RisewithJeet',
    description: 'Free lectures, mnemonics, current affairs',
    icon: (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/icon-youtube.png" alt="YouTube" width={20} height={20} style={{ objectFit: 'contain' }} />
    ),
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const fullName = formData.fullName.trim();
    const nameParts = fullName.split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || firstName;

    try {
      await contactService.submit({
        firstName,
        lastName,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
      setFormData({ fullName: '', email: '', subject: '', message: '' });
    } catch {
      // silently handle
    }

    setSubmitting(false);
  };

  // eslint-disable-next-line @next/next/no-img-element
  const capIcon = <img src="/help-support-icon.png" alt="help and support" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />;
  return (
    <main className="min-h-screen flex flex-col">
      <DashboardHeader />

      <div style={{ background: '#0F131F' }}>
        <DashboardPageHero
          badgeIcon={capIcon}
          badgeText="HELP & SUPPORT"
          backHref="/dashboard"
          backLabel="Back to Dashboard"
          rightElement={null}
          title={<>We&apos;d love to <em style={{ color: '#e8a820', fontStyle: 'italic' }}>hear from you</em></>}
          subtitle="Have a question, a doubt about your preparation, or just something you want to say? We read every message, every single one."
          stats={[
            { value: '4h',   label: 'Response Time',  color: '#FDC700' },
            { value: '100%', label: 'Response Rate',   color: '#4ADE80' },
            { value: '10K+', label: 'Queries Addressed', color: '#F87171' },
            { value: '3',    label: 'Channels',        color: '#FFFFFF' },
          ]}
        />
      </div>

      <section id="contact-content" className="w-full bg-[#F9FAFB] py-20 px-6 font-arimo">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[430px_minmax(0,1fr)] gap-12 lg:gap-16 items-start">
          <div>
            <div className="mb-4 flex items-center gap-2.5">
              <span className="h-[2px] w-[30px] rounded-[2px] bg-[#E8B84B]" />
              <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#E8B84B]" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                Reach us directly
              </p>
            </div>

            <h2 className="text-[clamp(2.3rem,3.3vw,2.6rem)] leading-[1.2] text-[#0C1424]" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 600 }}>
              We&apos;re here,
            </h2>
            <h2 className="mb-4 text-[clamp(2.3rem,3.3vw,2.6rem)] italic leading-[1.2] text-[#1E3060]" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 600 }}>
              not behind a ticket
              <br />
              queue
            </h2>

            <p className="mb-8 text-[14px] leading-[1.8] text-[#6B7A99]" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              No chatbot loops. No automated replies with zero help.
              <br />
              Every message is personally read and responded to by someone from our team.
            </p>

            <div className="flex flex-col gap-4">
              {reachCards.map((card, i) => (
                <div key={i} className="rounded-[14px] border border-[rgba(11,22,40,0.09)] bg-[#FAF8F4] p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[10px]" style={{ background: card.iconBg }}>
                      {card.icon}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold tracking-[0.26px] text-[#0C1424]" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                        {card.title}
                      </p>
                      <p className="text-[14px] font-medium text-[#C99730]" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                        {card.link}
                      </p>
                      <p className="text-[12px] text-[#9AA3B8]" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                        {card.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[18px] border border-[rgba(11,22,40,0.09)] bg-white p-9 shadow-[0_8px_36px_rgba(11,22,40,0.12)]">
            <div className="absolute left-0 top-0 h-[3px] w-full bg-gradient-to-r from-[#C99730] via-[#E8B84B] to-[#F5CE72]" />

            <h3 className="mb-1 text-[22.4px] leading-[1.6] text-[#0C1424]" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 600 }}>
              Send us a message
            </h3>
            <p className="mb-8 text-[13px] text-[#6B7A99]" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              We respond to every message personally. No templates, no auto-replies.
            </p>

            {submitted && (
              <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
                Message sent! We&apos;ll get back to you within 4 hours.
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold tracking-[0.24px] text-[#374560]" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    Full name
                  </label>
                  <input
                    type="text"
                    placeholder="Rahul Sharma"
                    required
                    value={formData.fullName}
                    onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))}
                    className="h-[42px] w-full rounded-[9px] border border-[rgba(11,22,40,0.17)] bg-[#FAF8F4] px-[14px] text-[14px] text-[#0C1424] placeholder-[#9AA3B8] outline-none"
                    style={{ fontFamily: 'var(--font-dm-sans)' }}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold tracking-[0.24px] text-[#374560]" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={formData.email}
                    onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                    className="h-[42px] w-full rounded-[9px] border border-[rgba(11,22,40,0.17)] bg-[#FAF8F4] px-[14px] text-[14px] text-[#0C1424] placeholder-[#9AA3B8] outline-none"
                    style={{ fontFamily: 'var(--font-dm-sans)' }}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-semibold tracking-[0.24px] text-[#374560]" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  What&apos;s this about?
                </label>
                <div className="relative">
                  <select
                    required
                    value={formData.subject}
                    onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))}
                    className="h-[42px] w-full appearance-none rounded-[9px] border border-[rgba(11,22,40,0.17)] bg-[#FAF8F4] px-[14px] pr-10 text-[14px] text-[#0C1424] outline-none"
                    style={{ fontFamily: 'var(--font-dm-sans)' }}
                  >
                    <option value="" disabled>
                      Select a topic
                    </option>
                    {subjectOptions.map(opt => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7A99]" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-semibold tracking-[0.24px] text-[#374560]" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  Your message
                </label>
                <textarea
                  rows={4}
                  placeholder="Tell us what's on your mind. The more detail, the better we can help."
                  required
                  value={formData.message}
                  onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                  className="min-h-[140px] w-full resize-none rounded-[9px] border border-[rgba(11,22,40,0.17)] bg-[#FAF8F4] px-[14px] py-3 text-[14px] leading-[1.65] text-[#0C1424] placeholder-[#9AA3B8] outline-none"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-1 flex h-[47px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#E8B84B] text-[15px] font-bold text-[#090E1C] shadow-[0_4px_9px_rgba(232,184,75,0.28)] disabled:opacity-70"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                {submitting ? 'Sending...' : 'Send message'}
                <span aria-hidden="true">-&gt;</span>
              </button>

            </form>

            <p className="mt-4 text-center text-[12px] text-[#9AA3B8]" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              Your message goes directly to the RiseWithJeet team. We don&apos;t use bots for responses.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#faf8f4] py-16">
        <div className="mx-auto max-w-[700px] px-6">
          <div
            className="relative overflow-hidden rounded-[24px] px-8 py-16 text-center flex flex-col items-center justify-center"
            style={{
              background: 'linear-gradient(134.93deg, #0B1530 0%, #0F2050 100%)',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0px 40px 80px 0px rgba(11,29,58,0.24)',
            }}
          >
            {/* Decorative overlays */}
            <div className="pointer-events-none absolute rounded-full" style={{ width: 320, height: 320, top: -80, left: -80, background: 'rgba(232,184,75,0.06)' }} />
            <div className="pointer-events-none absolute rounded-full" style={{ width: 250, height: 250, bottom: -60, right: -60, background: 'rgba(46,93,179,0.08)' }} />

            <h3
              className="relative text-white text-center tracking-[-0.024em]"
              style={{ fontFamily: 'var(--font-cormorant-garamond), Georgia, serif', fontSize: 50, fontWeight: 700, lineHeight: '54px', WebkitFontSmoothing: 'antialiased' }}
            >
              Looking for{' '}
              <em style={{ fontStyle: 'italic', color: '#E8B84B' }}>quick answers?</em>
            </h3>
            <p
              className="relative mt-5 max-w-[489px] text-center"
              style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 16, lineHeight: '26.4px', color: 'rgba(255,255,255,0.58)' }}
            >
              Most common questions about the platform, pricing, AI tools, and mentorship are answered in our FAQ section.
            </p>
            <a
              href="/faq"
              className="relative mt-8 inline-flex items-center gap-2 rounded-[10px] font-semibold text-[#0f172b]"
              style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 16, lineHeight: '24px', background: '#f0b100', height: 48, paddingLeft: 24, paddingRight: 24 }}
            >
              Browse FAQ →
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

