'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

type PricingMode = 'explore' | 'billing';
type BillingCycle = 'monthly' | 'yearly';

type PlanItem = {
  title?: string;
  text: string;
};

type PlanCard = {
  id: 'starter' | 'scholar' | 'pro';
  label: string;
  name: string;
  description: string;
  textTone: 'light' | 'dark';
  featured?: boolean;
  currentPlan?: boolean;
  monthlyPrice?: number;
  yearlyPrice?: number;
  billedMonthlyText?: string;
  billedYearlyText?: string;
  subtitle: string;
  cta: string;
  sections: PlanItem[];
};

const PLAN_CARDS: PlanCard[] = [
  {
    id: 'starter',
    label: 'Forever Free',
    name: 'Starter',
    description: 'Build daily study habits. Begin your UPSC prep without spending a rupee.',
    textTone: 'dark',
    subtitle: 'Always free, no card needed',
    cta: 'Get Started Free →',
    sections: [
      { text: '10 MCQs / day' },
      { text: 'Daily Mains Challenge (1 Q)' },
      { text: 'Daily News Analysis — The Hindu & IE' },
      { text: '10,000+ Previous Year Questions' },
      { text: 'YouTube Video Lectures' },
      { text: 'Study Planner & Time Tracker' },
      { text: 'Daily Leaderboard' },
      { text: 'Jeet AI — 10 chats/day' },
      { text: 'Limited Revision Suite' },
    ],
  },
  {
    id: 'scholar',
    label: 'Dedicated Study',
    name: 'Scholar',
    description: 'For serious aspirants who study daily and want measurable progress.',
    textTone: 'light',
    featured: true,
    monthlyPrice: 499,
    yearlyPrice: 415,
    billedMonthlyText: '₹5,988/yr · billed annually',
    billedYearlyText: '₹4,988/yr · billed annually',
    subtitle: '',
    cta: 'Start 7-Day Free Trial →',
    sections: [
      { text: 'Everything in Starter' },
      { title: 'Evaluation', text: '5 AI Mains Evaluations / day' },
      { text: '10 Mock Test attempts / month' },
      { text: 'Syllabus Tracker' },
      { title: 'Analytics', text: 'Test Analytics' },
      { text: 'Performance Analytics Dashboard' },
      { title: 'Revision & AI', text: 'Full Revision Suite — Flashcards, Mindmap, Spaced Rep.' },
      { text: 'Jeet AI — 50 chats/day' },
      { text: 'Study Groups & Discussion Forum' },
    ],
  },
  {
    id: 'pro',
    label: 'Maximum Learning',
    name: 'Pro Aspirant',
    description: 'Unlimited tools, zero limits. For aspirants who leave nothing to chance.',
    textTone: 'light',
    currentPlan: true,
    monthlyPrice: 999,
    yearlyPrice: 832,
    billedMonthlyText: '₹11,988/yr · billed annually',
    billedYearlyText: '₹9,988/yr · billed annually',
    subtitle: '',
    cta: "You're on this plan ✓",
    sections: [
      { text: 'Everything in Scholar' },
      { title: 'Unlimited Access', text: 'Unlimited AI Mains Evaluations' },
      { text: 'Unlimited Mock Test Practice' },
      { text: 'Jeet AI — Unlimited chats' },
      { title: 'Priority Features', text: 'Priority Answer Review' },
      { text: 'Q&A Forum — Priority Responses' },
      { text: 'Mental Health Buddy' },
      { text: 'Early Access to New Features' },
    ],
  },
];

function formatPrice(num: number) {
  return num.toLocaleString('en-IN');
}

export default function PricingPage() {
  const [mode, setMode] = useState<PricingMode>('explore');
  const [cycle, setCycle] = useState<BillingCycle>('yearly');

  const cards = useMemo(() => PLAN_CARDS, []);

  return (
    <div className="min-h-screen bg-[#F0F1F5]">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_7%_11%,rgba(55,53,51,0.62)_0%,rgba(55,53,51,0.2)_22%,rgba(55,53,51,0)_58%),linear-gradient(160deg,#060C1C_0%,#07132B_52%,#081B3D_100%)]" />
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:28px_28px]" />

        <div className="relative mx-auto flex w-full max-w-[1200px] flex-col items-center px-4 pb-16 pt-14 sm:px-6 sm:pt-16">
          <div className="mb-4 inline-flex items-center gap-3">
            <span className="h-px w-12 bg-[rgba(232,184,75,0.4)]" />
            <span className="rounded-[4px] bg-[#E8B84B] px-2 py-1 text-[10px] font-extrabold tracking-[1.2px] text-[#090E1C]">
              BILLING & PLANS
            </span>
            <span className="h-px w-12 bg-[rgba(232,184,75,0.4)]" />
          </div>

          <h1
            className="max-w-[760px] text-center text-white"
            style={{ fontFamily: 'var(--font-playfair)', fontWeight: 600, fontSize: 'clamp(36px,5vw,52px)', lineHeight: 1.1 }}
          >
            Your IAS Journey Deserves
            <br />
            a <span style={{ color: '#E8B84B', fontStyle: 'italic' }}>Smarter</span> Foundation
          </h1>

          <p
            className="mt-4 text-center text-[15px] text-white/50"
            style={{ fontFamily: 'var(--font-jakarta)', lineHeight: '26px' }}
          >
            No hidden fees · Cancel anytime · Start free today
          </p>
        </div>
      </section>

      <section className="px-4 pb-14 pt-8 sm:px-6">
        <div className="mx-auto w-full max-w-[1200px]">
          <div className="flex justify-center">
            <div className="inline-flex gap-1 rounded-[12px] border border-[rgba(11,22,40,0.09)] bg-white p-[5px] shadow-[0_2px_7px_rgba(11,22,40,0.07)]">
              <button
                type="button"
                onClick={() => setMode('billing')}
                className={`rounded-[9px] px-7 py-[10px] text-[13px] font-semibold transition-colors ${
                  mode === 'billing' ? 'bg-[#090E1C] text-[#E8B84B]' : 'text-[#6B7A99]'
                }`}
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                My Plan & Billing
              </button>
              <button
                type="button"
                onClick={() => setMode('explore')}
                className={`rounded-[9px] px-7 py-[10px] text-[13px] font-semibold transition-colors ${
                  mode === 'explore' ? 'bg-[#090E1C] text-[#E8B84B] shadow-[0_2px_4px_rgba(9,14,28,0.18)]' : 'text-[#6B7A99]'
                }`}
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                Explore Plans
              </button>
            </div>
          </div>

          {mode === 'billing' && (
            <div className="mt-7 rounded-[16px] border border-[rgba(232,184,75,0.2)] bg-[#070D1C] px-4 py-5 sm:px-9 sm:py-7">
              <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <div className="flex size-[54px] items-center justify-center rounded-[12px] border border-[rgba(232,184,75,0.3)] bg-[rgba(232,184,75,0.12)] text-[22px]">
                    🏆
                  </div>
                  <div>
                    <h3 className="text-[32px] leading-none text-white" style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>
                      You&apos;re on Pro Aspirant
                    </h3>
                    <p className="mt-2 text-[13px] text-white/45" style={{ fontFamily: 'var(--font-jakarta)' }}>
                      Annual plan · Renews April 15, 2027
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMode('explore')}
                  className="rounded-[9px] border border-white/15 px-6 py-3 text-[13px] font-semibold text-white/70"
                  style={{ fontFamily: 'var(--font-jakarta)' }}
                >
                  ← Back to My Billing
                </button>
              </div>
            </div>
          )}

          {mode === 'explore' && (
            <div className="pt-7">
              <div className="mx-auto mb-8 inline-flex h-[46px] items-center rounded-[30px] border border-black/10 bg-white p-1 shadow-[0_1px_1.5px_rgba(0,0,0,0.1)]">
                <button
                  type="button"
                  onClick={() => setCycle('monthly')}
                  className={`rounded-[26px] px-7 py-[9px] text-[13px] font-semibold transition-colors ${
                    cycle === 'monthly' ? 'bg-[#0D1B2E] text-white' : 'text-[#121212]'
                  }`}
                  style={{ fontFamily: 'var(--font-jakarta)' }}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setCycle('yearly')}
                  className={`ml-1 flex items-center gap-2 rounded-[26px] px-7 py-[9px] text-[13px] font-semibold transition-colors ${
                    cycle === 'yearly' ? 'bg-[#0D1B2E] text-white' : 'text-[#121212]'
                  }`}
                  style={{ fontFamily: 'var(--font-jakarta)' }}
                >
                  Yearly
                  <span className="rounded-[10px] bg-[#E8B84B] px-2 py-[2px] text-[10px] font-bold text-[#0D1B2E]">Save 17%</span>
                </button>
              </div>
            </div>
          )}

          <div className="mt-1 grid grid-cols-1 gap-5 lg:grid-cols-3">
            {cards.map((card) => {
              const isDark = card.textTone === 'light';
              const effectivePrice =
                card.id === 'starter'
                  ? 0
                  : cycle === 'yearly'
                  ? card.yearlyPrice ?? 0
                  : card.monthlyPrice ?? 0;

              const billedText =
                card.id === 'starter'
                  ? card.subtitle
                  : cycle === 'yearly'
                  ? card.billedYearlyText
                  : card.billedMonthlyText;

              return (
                <div
                  key={card.id}
                  className={`relative overflow-hidden rounded-[18px] ${
                    card.featured
                      ? 'border-[5px] border-[#E8B84B] bg-[#0C1424] shadow-[0_8px_32px_rgba(9,14,28,0.2),0_0_0_1px_rgba(232,184,75,0.15)]'
                      : isDark
                      ? 'border border-white/10 bg-[linear-gradient(160deg,#101D36_0%,#172444_100%)]'
                      : 'border border-[rgba(11,22,40,0.09)] bg-white'
                  }`}
                >
                  {card.featured && (
                    <>
                      <div className="absolute -right-20 -top-20 size-[200px] rounded-full bg-[radial-gradient(circle,rgba(232,184,75,0.12)_0%,rgba(232,184,75,0)_65%)]" />
                      <div className="absolute left-1/2 top-0 -translate-x-1/2 rounded-b-[10px] bg-[#E8B84B] px-4 py-[5px] text-[10px] font-extrabold tracking-[0.8px] text-[#090E1C] uppercase">
                        ⭐ Most Popular
                      </div>
                    </>
                  )}

                  <div className={`relative ${card.featured ? 'px-6 pb-7 pt-12' : 'px-7 pb-7 pt-8'}`}>
                    <p
                      className={`text-[10px] font-bold uppercase tracking-[1.5px] ${
                        isDark ? 'text-white/40' : 'text-[#6B7A99]'
                      } ${card.featured ? '!text-[rgba(232,184,75,0.7)]' : ''}`}
                      style={{ fontFamily: 'var(--font-jakarta)' }}
                    >
                      {card.label}
                    </p>

                    <h3
                      className={`mt-2 text-[48px] leading-none ${isDark ? 'text-white' : 'text-[#0C1424]'}`}
                      style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}
                    >
                      {card.name}
                    </h3>

                    <p
                      className={`mt-4 text-[13px] leading-[21.45px] ${isDark ? 'text-white/45' : 'text-[#6B7A99]'}`}
                      style={{ fontFamily: 'var(--font-jakarta)' }}
                    >
                      {card.description}
                    </p>

                    <div className="mt-7 flex items-end gap-1">
                      <span className={`pb-[6px] text-[16px] font-semibold ${isDark ? 'text-[#F5CE72]' : 'text-[#0C1424]'}`}>₹</span>
                      <span
                        className={`text-[56px] leading-[48px] ${isDark ? 'text-[#F5CE72]' : 'text-[#0C1424]'}`}
                        style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}
                      >
                        {formatPrice(effectivePrice)}
                      </span>
                      {card.id !== 'starter' && <span className="pb-2 text-[12px] text-white/35">/mo</span>}
                    </div>

                    <p
                      className={`mt-3 text-[11px] ${isDark ? 'text-white/25' : 'text-[#9AA3B8]'}`}
                      style={{ fontFamily: 'var(--font-jakarta)' }}
                    >
                      {billedText}
                    </p>

                    <div className={`mt-6 h-px ${isDark ? 'bg-white/10' : 'bg-[rgba(11,22,40,0.09)]'}`} />

                    <div className="mt-3 space-y-[2px]">
                      {card.sections.map((item, idx) => (
                        <div key={`${card.id}-${idx}`} className="pt-[10px]">
                          {item.title && (
                            <div
                              className={`mb-[8px] text-[13px] font-extrabold uppercase tracking-[1.95px] ${isDark ? 'text-white/70' : 'text-[#374560]'}`}
                              style={{ fontFamily: 'var(--font-jakarta)' }}
                            >
                              {item.title}
                            </div>
                          )}
                          <div className="flex items-start gap-[9px]">
                            <span className={`pt-[1px] text-[12px] ${isDark ? 'text-[#F5CE72]' : 'text-[#374560]'}`}>✓</span>
                            <span
                              className={`text-[13px] leading-[1.45] ${isDark ? 'text-white/70' : 'text-[#374560]'}`}
                              style={{ fontFamily: 'var(--font-jakarta)' }}
                            >
                              {item.text}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {card.currentPlan ? (
                      <button
                        type="button"
                        className="mt-10 flex h-[46px] w-full items-center justify-center rounded-[10px] border border-white/15 bg-white/10 text-[14px] font-bold text-white"
                        style={{ fontFamily: 'var(--font-jakarta)' }}
                      >
                        {card.cta}
                      </button>
                    ) : (
                      <Link
                        href={card.id === 'starter' ? '/login?tab=signup' : '/dashboard/billing'}
                        className={`mt-10 flex h-[48px] w-full items-center justify-center rounded-[10px] border text-[14px] font-bold ${
                          card.featured
                            ? 'border-[#E8B84B] bg-[#E8B84B] text-[#090E1C]'
                            : 'border-[rgba(11,22,40,0.17)] bg-[#FAF8F4] text-[#0C1424]'
                        }`}
                        style={{ fontFamily: 'var(--font-jakarta)' }}
                      >
                        {card.cta}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
