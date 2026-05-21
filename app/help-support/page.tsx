'use client';

import React, { useState } from 'react';
import Footer from '@/components/Footer';
import DashboardHeader from '@/components/DashboardHeader';
import { contactService } from '@/lib/services';

const reachCards = [
  {
    icon: '✉',
    title: 'Email support',
    href: 'mailto:support@risewithjeet.in',
    display: 'support@risewithjeet.in',
  },
  {
    icon: '✈',
    title: 'Telegram community',
    href: 'https://t.me/risewithjeet',
    display: 't.me/risewithjeet',
  },
  {
    icon: '▶',
    title: 'YouTube channel',
    href: 'https://youtube.com/@RisewithJeet',
    display: 'youtube.com/@RisewithJeet',
  },
];

const topicOptions = [
  { value: 'general', label: 'General query' },
  { value: 'technical', label: 'Technical issue' },
  { value: 'billing', label: 'Billing & subscription' },
  { value: 'other', label: 'Something else' },
];

export default function HelpSupportPage() {
  const [formData, setFormData] = useState({ name: '', email: '', topic: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    setSubmitted(false);

    const [firstName = '', ...lastNameParts] = formData.name.trim().split(/\s+/);
    const selectedTopic = topicOptions.find((topic) => topic.value === formData.topic);

    try {
      await contactService.submit({
        firstName: firstName || 'Dashboard',
        lastName: lastNameParts.join(' '),
        email: formData.email.trim(),
        subject: selectedTopic?.label || 'Help support',
        message: formData.message.trim(),
      });
      setSubmitted(true);
      setFormData({ name: '', email: '', topic: '', message: '' });
      setTimeout(() => setSubmitted(false), 4000);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not send your message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col" style={{ fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <DashboardHeader />

      {/* Hero */}
      <section
        className="relative overflow-hidden text-center pt-16 pb-20 px-6"
        style={{ background: '#0a0f1e' }}
      >
        <div className="flex items-center justify-center gap-3 mb-5">
          <span className="w-10 h-px bg-white/20" />
          <span className="text-[11px] font-semibold tracking-[2px] uppercase text-[#9ca3af]">Get in Touch</span>
          <span className="w-10 h-px bg-white/20" />
        </div>
        <h1
          className="text-[clamp(32px,5vw,56px)] font-medium text-white leading-[1.15] mb-4"
          style={{ fontFamily: 'var(--font-cormorant-garamond), Georgia, serif' }}
        >
          We&apos;d love to<br />
          <em className="text-[#E8B84B] italic">hear from you</em>
        </h1>
        <p className="text-[clamp(13px,1.2vw,15px)] text-white/50 max-w-[420px] mx-auto leading-[1.7]">
          Have a question, a doubt about your preparation, a bug to report, or just something you want to say? We read every message. Every single one.
        </p>
      </section>

      {/* Contact Section */}
      <section className="max-w-[1200px] mx-auto w-full px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        {/* Left */}
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-6 h-0.5 bg-[#c9a84c]" />
            <span className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#c9a84c]">Reach us directly</span>
          </div>

          <h2
            className="text-[clamp(28px,3vw,38px)] font-medium leading-[1.25] text-[#1a1a2e] mb-4"
            style={{ fontFamily: 'var(--font-cormorant-garamond), Georgia, serif' }}
          >
            We&apos;re here,<br />
            <em className="text-[#2d3561] italic">not behind a ticket queue</em>
          </h2>

          <p className="text-[14px] text-[#6B7A99] leading-[1.8] mb-6">
            No chatbot loops. No automated replies with zero help. When you write to us, a real person reads it and responds.
          </p>

          <div className="flex flex-col gap-4">
            {reachCards.map((card) => (
              <div
                key={card.title}
                className="flex items-start gap-3.5 p-4 rounded-[14px] border border-[#f0eeea]"
                style={{ background: '#faf9f7' }}
              >
                <span className="text-xl mt-0.5">{card.icon}</span>
                <div>
                  <p className="text-[13px] font-bold text-[#0C1424] mb-0.5">{card.title}</p>
                  <a
                    href={card.href}
                    target={card.href.startsWith('http') ? '_blank' : undefined}
                    rel={card.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="text-[14px] font-medium text-[#c9a84c] no-underline hover:underline"
                  >
                    {card.display}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right – Form */}
        <div className="bg-white border border-[#f0eeea] rounded-[20px] p-9 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <h3
            className="text-[22px] font-semibold text-[#0C1424] mb-6"
            style={{ fontFamily: 'var(--font-cormorant-garamond), Georgia, serif' }}
          >
            Send us a message
          </h3>

          {submitted && (
            <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
              Message sent! We&apos;ll get back to you soon.
            </div>
          )}

          {submitError && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">Full name</label>
                <input
                  type="text"
                  placeholder="Rahul Sharma"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className="w-full h-[42px] px-3.5 text-[14px] border-[1.5px] border-[#e5e7eb] rounded-[10px] bg-[#fafafa] outline-none focus:border-[#E8B84B] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">Email address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  className="w-full h-[42px] px-3.5 text-[14px] border-[1.5px] border-[#e5e7eb] rounded-[10px] bg-[#fafafa] outline-none focus:border-[#E8B84B] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">What&apos;s this about?</label>
              <select
                required
                value={formData.topic}
                onChange={(e) => setFormData((p) => ({ ...p, topic: e.target.value }))}
                className="w-full h-[42px] px-3.5 text-[14px] border-[1.5px] border-[#e5e7eb] rounded-[10px] bg-[#fafafa] outline-none focus:border-[#E8B84B] transition-colors appearance-none"
              >
                <option value="" disabled>Select a topic</option>
                {topicOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">Your message</label>
              <textarea
                placeholder="Tell us what's on your mind."
                required
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
                className="w-full min-h-[120px] px-3.5 py-3 text-[14px] border-[1.5px] border-[#e5e7eb] rounded-[10px] bg-[#fafafa] outline-none focus:border-[#E8B84B] transition-colors resize-y"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-[48px] mt-1 text-[14px] font-bold text-[#1a1a2e] rounded-[12px] transition-all hover:opacity-90 active:scale-[0.99]"
              style={{ background: '#E8B84B', opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
            >
              {submitting ? 'Sending...' : 'Send message'}
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </main>
  );
}
