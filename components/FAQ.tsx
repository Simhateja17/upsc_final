'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const FEATURED_FAQS = [
  {
    question: 'What is RiseWithJeet and who is it for?',
    answer:
      'RiseWithJeet is an AI-powered UPSC preparation platform built for aspirants at every stage. It was started by Abhijeet Soni, an IIT Kharagpur alumnus and AI professional, to make high-quality UPSC prep accessible to every aspirant in India.',
  },
  {
    question: 'Is there a free plan?',
    answer:
      'Yes. The Starter plan is completely free and includes daily MCQ practice, current affairs access, and the live study room. Paid plans unlock AI evaluation, mock tests, mentorship, and the complete revision suite.',
  },
  {
    question: 'How does the AI answer evaluation work?',
    answer:
      'You submit a typed or handwritten answer (via photo upload). The AI evaluates it across 8 parameters — content accuracy, structure, introduction, conclusion, depth of analysis, examples, language clarity, and question relevance — and returns a score out of 10 with actionable feedback in under 60 seconds.',
  },
  {
    question: 'How does the AI Study Planner work?',
    answer:
      'The Study Planner generates a personalised daily schedule based on your target exam date, available study hours, Syllabus Tracker progress, and weak areas from MCQ and test performance. It adapts every week as your data changes.',
  },
  {
    question: 'What is Jeet GPT?',
    answer:
      'Jeet GPT is your personal UPSC AI assistant, available 24/7. Ask it to explain any GS concept, help structure a Mains answer, summarise current affairs, or review your strategy. It is trained on UPSC-specific content, not generic AI.',
  },
  {
    question: 'How many PYQs are available on the platform?',
    answer:
      'The PYQ bank covers over 3,200 questions from UPSC Prelims across the last 30 years, plus Mains questions tagged by paper and year — each with detailed explanations and syllabus tags.',
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
