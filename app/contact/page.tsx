'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import DashboardPageHero from '@/components/DashboardPageHero';
import { contactService } from '@/lib/services';

function ContactHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: 'Modules', href: '/#modules' },
    { label: 'Jeet AI', href: '/dashboard/jeet-gpt' },
    { label: 'Analytics', href: '/dashboard/performance' },
    { label: 'Community', href: '/community' },
    { label: 'Pricing', href: '/pricing' },
  ];

  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-6 md:px-10">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo...png"
            alt="RiseWithJeet"
            className="h-[38px] w-auto object-contain"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[14px] font-medium text-white/70 transition-colors hover:text-white"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login?tab=login"
            className="rounded-[8px] border border-white/20 px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-white/10"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            Login
          </Link>
          <Link
            href="/login?tab=signup"
            className="flex items-center gap-1.5 rounded-[8px] bg-[#E8B84B] px-5 py-2 text-[13px] font-bold text-[#0C1424] transition-colors hover:bg-[#F5C75D]"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            Start Free
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-white hover:bg-white/10 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M2 2L18 18M18 2L2 18" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M3 6H19M3 11H19M3 16H19" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#0C1424]/95 backdrop-blur-md border-t border-white/10 shadow-xl">
          <div className="flex flex-col px-6 py-4 gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="py-3 text-[15px] font-medium text-white/80 hover:text-[#E8B84B] transition-colors border-b border-white/5"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex items-center gap-3 pt-4">
              <Link
                href="/login?tab=login"
                onClick={() => setMobileOpen(false)}
                className="flex-1 rounded-[8px] border border-white/20 py-2.5 text-center text-[13px] font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/login?tab=signup"
                onClick={() => setMobileOpen(false)}
                className="flex-1 rounded-[8px] bg-[#E8B84B] py-2.5 text-center text-[13px] font-bold text-[#0C1424] hover:bg-[#F5C75D] transition-colors"
              >
                Start Free
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

const subjectOptions = [
  'General Inquiry',
  'Technical Issue',
  'Billing & Subscription',
  'Mentorship Programs',
  'Platform Feedback',
  'Partnership',
  'Other',
];

const reachCards = [
  {
    iconBg: 'rgba(232,184,75,0.12)',
    title: 'Email support',
    link: 'support@risewithjeet.in',
    description: 'For account, billing, and general queries',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M4 5H20V19H4V5Z" stroke="#0C1424" strokeWidth="1.6" />
        <path d="M4 7L12 13L20 7" stroke="#0C1424" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    iconBg: 'rgba(29,164,92,0.12)',
    title: 'Telegram community',
    link: 't.me/risewithjeet',
    description: 'Live doubt clearing, notes, daily discussion',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M21 3L3 10L10 12L12 19L21 3Z" stroke="#0C1424" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    iconBg: 'rgba(255,0,0,0.09)',
    title: 'YouTube channel',
    link: 'youtube.com/@RisewithJeet',
    description: 'Free lectures, mnemonics, current affairs',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="6" width="18" height="12" rx="3" stroke="#0C1424" strokeWidth="1.6" />
        <path d="M11 10L15 12L11 14V10Z" fill="#0C1424" />
      </svg>
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

  return (
    <main className="min-h-screen flex flex-col">
      <ContactHeader />

      {/* Dark wrapper reserves space for the floating ContactHeader (72px tall) */}
      <div style={{ background: '#0F131F', paddingTop: '72px' }}>
        <DashboardPageHero
          badgeIcon={<img src="/cap.png" alt="cap" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />}
          badgeText="HELP & SUPPORT"
          backHref="/"
          backLabel="Back to Home"
          rightElement={null}
          title={<>We&apos;d love to <em style={{ color: '#e8a820', fontStyle: 'italic' }}>hear from you</em></>}
          subtitle="Have a question, a doubt about your preparation, or just something you want to say? We read every message, every single one."
          stats={[
            { value: '4h',   label: 'Response Time',  color: '#FDC700' },
            { value: '100%', label: 'Human Reply',     color: '#4ADE80' },
            { value: '3',    label: 'Channels',        color: '#F87171' },
            { value: '∞',    label: 'Always Free',     color: '#FFFFFF' },
          ]}
        />
      </div>

      <section id="contact-content" className="w-full bg-[#F9FAFC] py-20 px-6">
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
              When you write to us, a real person reads it and responds.
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
                <select
                  required
                  value={formData.subject}
                  onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))}
                  className="h-[42px] w-full appearance-none rounded-[9px] border border-[rgba(11,22,40,0.17)] bg-[#FAF8F4] px-[14px] text-[14px] text-[#0C1424] outline-none"
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

              <p className="pt-1 text-center text-[11px] text-[#9AA3B8]" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                We never share your details with anyone. Ever.
              </p>
            </form>
          </div>
        </div>
      </section>

      <section
        className="relative w-full overflow-hidden px-6 py-[46px]"
        style={{ background: 'linear-gradient(93.39deg, #090E1C 18%, #09122A 100%)' }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-80px] top-[-80px] h-[360px] w-[360px]"
          style={{ background: 'radial-gradient(circle, rgba(232,184,75,0.07) 0%, rgba(232,184,75,0) 65%)' }}
        />

        <div className="relative max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_567px] gap-10 items-center">
          <div className="max-w-[430px]">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="h-[2px] w-6 rounded-[2px] bg-[#E8B84B]" />
              <p
                className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#E8B84B]"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                Stay connected
              </p>
            </div>

            <h2
              className="text-[clamp(2rem,2.3vw,2.56rem)] leading-[1.3] text-white"
              style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 600 }}
            >
              Join the community
              <br />
              that <span className="italic text-[#E8B84B]">never stops learning</span>
            </h2>

            <p
              className="mt-4 text-[14px] leading-[1.8] text-[rgba(255,255,255,0.44)]"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              50,000 aspirants. Daily discussions, live doubt sessions, notes, and the kind of peer
              support that keeps you going on the tough days.
            </p>
          </div>

          <div className="rounded-[22px] bg-white px-8 py-10 text-center shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)]">
            <h3
              className="text-[clamp(2rem,2.2vw,2.25rem)] leading-[1.3] text-[#0F172B]"
              style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 500 }}
            >
              Looking for quick answers?
            </h3>
            <p
              className="mx-auto mt-4 max-w-[487px] text-[16px] leading-[1.5] text-[#45556C]"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              Most common questions about the platform, pricing, AI tools, and mentorship are answered
              in our FAQ section.
            </p>

            <a
              href="/faq"
              className="mx-auto mt-7 inline-flex h-12 items-center justify-center gap-1 rounded-[10px] bg-[#F0B100] px-6 text-[16px] font-semibold text-[#0F172B]"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              Browse FAQ
              <span aria-hidden="true">-&gt;</span>
            </a>
          </div>
        </div>
      </section>

    </main>
  );
}
