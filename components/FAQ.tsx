'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const FEATURED_FAQS = [
  {
    question: 'Is free plan really free forever?',
    answer:
      'Yes, absolutely. Our Free plan gives you lifetime free access to daily MCQ, daily news analysis, 10,000+ PYQs, study planner, leaderboard, plus 3 mains evaluations (lifetime), 1 Prelims test (lifetime) and 1 Jeet AI chat session. No card, no expiry, no hidden upgrades.',
  },
  {
    question: 'Are the current prices a promotional offer?',
    answer:
      'Yes! We are running a limited-time promotional offer. All prices you see are discounted. The offers may change in the future, so lock in these rates while you can. Once you subscribe, your price remains locked for as long as you stay subscribed, even if prices increase for new users later.',
  },
  {
    question: 'Can I upgrade or cancel my subscription anytime?',
    answer:
      'Absolutely. You can upgrade from Aspire to Rise or Ascent instantly (pro-rated). Cancellation is self-serve from your dashboard - you keep full access until the end of your billing cycle. No cancellation fees, no hassle.',
  },
  {
    question: 'What is the refund policy?',
    answer:
      "We offer a 3-day, no-questions-asked refund on all paid subscriptions. Just reach out to support within 3 days of your purchase and we'll process the refund within 24 hours. After 3 days, refunds are not applicable but you can cancel future billing.",
  },
  {
    question: "What's the difference between Aspire, Rise and Ascent?",
    answer:
      'Aspire: 5 mains evaluations/day, 5 Prelims tests/day, 5 Jeet AI messages/day, limited analytics & revision suite. Rise: 25 mains evals/day, 50 Prelims tests/day, 100 AI messages, full analytics dashboard, full revision suite, smart syllabus tracker, live study room. Ascent: Everything in Rise, plus unlimited evaluations & tests, unlimited AI messages, bi-weekly 1-on-1 mentorship, interview prep module, personalised roadmap, priority support, monthly review call and early access.',
  },
  {
    question: 'How much do I save on quarterly & yearly plans?',
    answer:
      "As we are running promotional offers currently, Quarterly plans save you 20% compared to monthly billing. Yearly plans save you 40% - that's almost 5 months free. For example, Rise monthly is ₹499, but yearly brings it down to ₹299/month. Discounts are automatically applied at checkout.",
  },
  {
    question: 'How does AI Mains Evaluation work?',
    answer:
      'You can upload a photo of your handwritten answer. Jeet AI evaluates it against UPSC marking schemes - structure, content, keyword density, presentation, relevance etc. You get detailed feedback in under 60 seconds, including a score and actionable suggestions to improve.',
  },
  {
    question: 'Is this suitable for first-attempt aspirants?',
    answer:
      "Absolutely. Our study planner, syllabus tracker, daily MCQs, mains answer evaluation and simplified video lectures are designed to guide you from day one - whether it's your first attempt or your third. Start with the Aspire to build momentum, then upgrade as you get more serious as you master consistency.",
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <section className="relative w-full overflow-hidden flex justify-center py-20 panel-recessed">
      <div className="relative z-10 w-full max-w-[900px] px-6">

        {/* Title */}
        <div className="text-center mb-10">
          <h2
            className="font-lora font-semibold text-[#1C2E45]"
            style={{ fontSize: 'clamp(32px, 4vw, 56px)', lineHeight: '130%', letterSpacing: '0.01em' }}
          >
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-[#374560] text-sm">
            Quick answers to the most common questions.{' '}
            <Link href="/faq" className="text-[#C99730] hover:underline font-medium">
              View all 50 FAQs →
            </Link>
          </p>
        </div>

        {/* FAQ Items */}
        <div className="flex flex-col gap-0">
          {FEATURED_FAQS.map((faq, index) => (
            <div
              key={index}
              className={`cursor-pointer transition-all duration-200 bg-white border rounded-[10px] mb-[10px] ${
                openIndex === index
                  ? 'border-[rgba(232,184,75,0.4)] shadow-[0_2px_14px_rgba(232,184,75,0.08)]'
                  : 'border-[#E8E8E8] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-[rgba(28,46,69,0.2)]'
              }`}
              style={{ padding: openIndex === index ? '28px 36px' : '24px 36px' }}
              onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
            >
              <div className="flex items-start justify-between gap-4">
                <h3
                  className={`font-manrope font-extrabold ${openIndex === index ? 'text-[#1C2E45]' : 'text-black'}`}
                  style={{ fontSize: '18px', lineHeight: '26px' }}
                >
                  {faq.question}
                </h3>
                <span
                  className={`flex-shrink-0 w-6 h-6 rounded-md border flex items-center justify-center text-xs transition-all duration-200 mt-0.5 ${
                    openIndex === index
                      ? 'bg-[rgba(232,184,75,0.15)] border-[rgba(232,184,75,0.4)] text-[#C99730] rotate-180'
                      : 'bg-[#faf8f4] border-[rgba(28,46,69,0.12)] text-[#6b7a99]'
                  }`}
                >
                  ▾
                </span>
              </div>

              {openIndex === index && (
                <p
                  className="font-manrope font-medium mt-4 text-[#374560]"
                  style={{ fontSize: '15px', lineHeight: '28px', letterSpacing: '-0.01em' }}
                >
                  {faq.answer}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* View all link */}
        <div className="text-center mt-8">
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1C2E45] text-white text-sm font-semibold hover:bg-[#172444] transition-colors"
          >
            View all FAQs
            <span className="text-[#E8B84B]">→</span>
          </Link>
        </div>

      </div>
    </section>
  );
};

export default FAQ;
