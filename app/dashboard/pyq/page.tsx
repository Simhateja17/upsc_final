'use client';

import React from 'react';

export default function PyqPage() {
  return (
    <div
      className="flex flex-col items-center overflow-y-auto"
      style={{ background: '#F9FAFB', height: 'calc(100vh - clamp(90px, 5.78vw, 111px))' }}
    >
      <div className="w-full max-w-[1080px] px-6 pt-16 pb-16">
        {/* Hero copy */}
        <div className="text-center mb-8">
          <h1 className="font-[var(--font-geist)] font-bold text-[36px] md:text-[48px] leading-[48px] text-[#101828]">
            The Complete{' '}
            <span className="italic font-bold text-[#1452CC]">
              PYQ
            </span>{' '}
            <span className="text-[#D9A84F]">
              Bank
            </span>
          </h1>
          <h2 className="font-[var(--font-geist)] font-bold text-[36px] md:text-[48px] leading-[48px] text-[#101828] mt-2">
            for UPSC Success
          </h2>
          <p className="mt-4 text-[14px] md:text-[18px] leading-[29px] text-[#6A7282] max-w-[768px] mx-auto">
            Every UPSC question ever asked — Prelims &amp; Mains — with smart AI-powered Mains evaluation,
            subject filters, and instant explanations.
          </p>
        </div>

        {/* Stats strip */}
        <div className="w-full max-w-[672px] mx-auto mb-10 rounded-[24px] bg-white shadow-[0_4px_6px_-4px_rgba(0,0,0,0.1),0_10px_15px_-3px_rgba(0,0,0,0.1)] px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Questions */}
            <div className="flex flex-col items-center md:items-start md:pr-8">
              <div className="text-[28px] md:text-[32px] font-bold text-[#101828] leading-[36px]">
                12,400
              </div>
              <div className="mt-1 text-[11px] tracking-[0.07em] uppercase text-[#99A1AF]">
                Questions
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px self-stretch bg-[#E5E7EB]" />

            {/* Coverage */}
            <div className="flex flex-col items-center md:items-start md:px-8">
              <div className="text-[20px] md:text-[24px] font-semibold leading-[32px] text-[#D9A84F]">
                14yrs
              </div>
              <div className="mt-1 text-[11px] tracking-[0.07em] uppercase text-[#99A1AF]">
                Coverage
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px self-stretch bg-[#E5E7EB]" />

            {/* Mapped */}
            <div className="flex flex-col items-center md:items-start md:px-8">
              <div className="text-[20px] md:text-[24px] font-semibold leading-[32px] text-[#D9A84F]">
                100%
              </div>
              <div className="mt-1 text-[11px] tracking-[0.07em] uppercase text-[#99A1AF]">
                Mapped
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px self-stretch bg-[#E5E7EB]" />

            {/* AI Mains Eval */}
            <div className="flex flex-col items-center md:items-start md:pl-8">
              <div className="inline-flex items-center gap-2">
                <img
                  src="/ai-mains-eval.png"
                  alt="AI Mains Eval"
                  className="w-5 h-5 object-contain"
                />
                <span className="text-[14px] font-semibold leading-[20px] tracking-[0.06em] uppercase text-[#364153]">
                  AI MAINS EVAL
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="w-full flex justify-center mb-10">
          <div
            className="inline-flex items-center bg-white rounded-full shadow-[0_4px_6px_-4px_rgba(0,0,0,0.1),0_10px_15px_-3px_rgba(0,0,0,0.1)]"
            style={{
              width: '347.3px',
              height: '79.9875px',
              paddingTop: '8px',
              paddingBottom: '8px',
              paddingLeft: '8px',
              paddingRight: '8px',
              borderRadius: '26843500px',
              gap: 0,
            }}
          >
            <button
              className="flex items-center"
              style={{
                width: '171.5px',
                height: '63.9875px',
                paddingLeft: '32px',
                paddingRight: '32px',
                borderRadius: '26843500px',
                background: '#0F172B',
                gap: '12px',
              }}
            >
              <img
                src="/9k.png"
                alt="Prelims"
                style={{ width: '24px', height: '24px', objectFit: 'contain', flexShrink: 0 }}
              />
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 700,
                  fontSize: '18px',
                  lineHeight: '28px',
                  letterSpacing: 0,
                  textAlign: 'center',
                  color: '#FFFFFF',
                }}
              >
                Prelims
              </span>
            </button>
            <button
              className="flex items-center"
              style={{
                paddingLeft: '32px',
                paddingRight: '32px',
                height: '63.9875px',
                borderRadius: '26843500px',
                background: 'transparent',
                gap: '12px',
              }}
            >
              <img
                src="/8k.png"
                alt="Mains"
                style={{ width: '24px', height: '24px', objectFit: 'contain', flexShrink: 0 }}
              />
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 700,
                  fontSize: '18px',
                  lineHeight: '28px',
                  letterSpacing: 0,
                  textAlign: 'center',
                  color: '#4A5565',
                }}
              >
                Mains
              </span>
            </button>
          </div>
        </div>

        {/* Content area: filters (left on desktop) + questions */}
        <div className="flex flex-col lg:flex-row-reverse gap-6">
          {/* Questions list */}
          <section className="flex-1 min-w-0">
            <div className="rounded-[16px] bg-white shadow-[0_1px_2px_-1px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.1)] p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                <h3 className="font-bold text-[20px] md:text-[24px] text-[#101828]">
                  Prelims Questions · 2024
                </h3>
                <p className="text-[13px] text-[#6A7282]">
                  Showing 1 of 2,400 questions
                </p>
              </div>

              {/* Tag row */}
              <div className="flex flex-wrap gap-2 mb-5">
                <span className="px-3 py-1 rounded-full bg-[#DBEAFE] text-[12px] font-bold text-[#1447E6]">
                  UPSC 2024
                </span>
                <span className="px-3 py-1 rounded-full bg-[#E0E7FF] text-[12px] font-bold text-[#432DD7]">
                  POLITY
                </span>
                <span className="px-3 py-1 rounded-full bg-[#FFEDD4] text-[12px] font-bold text-[#CA3500]">
                  MODERATE
                </span>
              </div>

              {/* Question meta - smaller, lighter grey */}
              <div
                className="uppercase mb-2"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  fontWeight: 400,
                  letterSpacing: '0.02em',
                  color: '#9CA3AF',
                  lineHeight: 1.4,
                }}
              >
                PRELIMS · QUESTION #1
              </div>

              {/* Question text - layout: 482×58.5, dark text */}
              <p
                className="mb-5"
                style={{
                  width: '482px',
                  height: '58.5px',
                  opacity: 1,
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '18px',
                  fontWeight: 500,
                  lineHeight: 1.5,
                  color: '#111827',
                  textAlign: 'left',
                }}
              >
                Which of the following statements regarding the Preamble of the Indian Constitution is/are correct?
              </p>

              {/* Stem */}
              <div className="rounded-[14px] bg-[#F9FAFB] px-4 py-4 mb-5 space-y-2 text-[14px] text-[#364153]">
                <p>1. It is not enforceable in courts of law.</p>
                <p>2. It was amended once in 1976 by the 42nd Amendment.</p>
                <p>3. It is considered a part of the Constitution.</p>
              </div>

              {/* Options - white cards, subtle shadow, circle badge, regular text */}
              <div className="space-y-3 mb-6">
                {[
                  '1 and 2 only',
                  '2 and 3 only',
                  '1 and 3 only',
                  '1, 2 and 3',
                ].map((text, index) => {
                  const label = String.fromCharCode(65 + index); // A,B,C,D
                  return (
                    <button
                      key={label}
                      className="w-full flex items-center gap-4 rounded-xl bg-white px-5 py-3.5 text-left transition-colors hover:bg-[#FAFAFA]"
                      style={{
                        boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.08), 0px 1px 2px -1px rgba(0,0,0,0.06)',
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-[16px] font-bold flex-shrink-0"
                        style={{ background: '#EBECEF', color: '#4A5565' }}
                      >
                        {label}
                      </div>
                      <span
                        className="text-[16px]"
                        style={{ color: '#1A202C', fontWeight: 400 }}
                      >
                        {text}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* CTA */}
              <div className="mt-4">
                <button className="w-full h-[52px] rounded-[14px] bg-[#0F172B] text-white font-bold text-[18px] leading-[28px] flex items-center justify-center hover:bg-[#111827] transition-colors">
                  Attempt Question
                </button>
              </div>
            </div>

            {/* Question card 2 - UPSC 2022, Economy, Hard */}
            <div
              className="rounded-[16px] bg-white shadow-[0_1px_2px_-1px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.1)] p-6 mb-6 w-full max-w-[546px] mx-auto"
              style={{
                opacity: 1,
              }}
            >
              {/* Tag row */}
              <div
                className="flex flex-wrap gap-2 mb-5"
                style={{ width: '482px', maxWidth: '100%' }}
              >
                <span
                  className="px-3 py-1 rounded-full text-[12px] font-bold"
                  style={{ background: '#DCFCE7', color: '#008236' }}
                >
                  UPSC 2022
                </span>
                <span
                  className="px-3 py-1 rounded-full text-[12px] font-bold"
                  style={{ background: '#DBEAFE', color: '#1447E6' }}
                >
                  ECONOMY
                </span>
                <span
                  className="px-3 py-1 rounded-full text-[12px] font-bold"
                  style={{ background: '#FFE2E2', color: '#C10007' }}
                >
                  HARD
                </span>
              </div>

              {/* Question meta */}
              <div
                className="uppercase mb-2"
                style={{
                  width: '482px',
                  maxWidth: '100%',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  lineHeight: '16px',
                  color: '#6A7282',
                }}
              >
                Prelims · Question #2
              </div>

              {/* Question text */}
              <p
                className="mb-5"
                style={{
                  width: '482px',
                  maxWidth: '100%',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '18px',
                  fontWeight: 400,
                  lineHeight: '29.25px',
                  color: '#101828',
                }}
              >
                With reference to the Monetary Policy Committee (MPC) of the Reserve
                Bank of India, which of the following statements is/are correct?
              </p>

              {/* Stem */}
              <div
                className="rounded-[14px] px-4 py-4 mb-5 space-y-2 text-[14px]"
                style={{
                  width: '482px',
                  maxWidth: '100%',
                  background: '#F9FAFB',
                  color: '#364153',
                }}
              >
                <p>1. It has six members in total.</p>
                <p>2. The RBI Governor chairs MPC meetings.</p>
                <p>3. In case of a tie, the RBI Governor has a casting vote.</p>
              </div>

              {/* Options */}
              <div
                className="space-y-3 mb-6"
                style={{ width: '482px', maxWidth: '100%' }}
              >
                {[
                  '1 and 2 only',
                  '2 and 3 only',
                  '1, 2 and 3',
                  '3 only',
                ].map((text, index) => {
                  const label = String.fromCharCode(65 + index); // A,B,C,D
                  return (
                    <button
                      key={label}
                      className="w-full flex items-center gap-4 rounded-[14px] bg-white px-6 py-4 text-left"
                      style={{
                        minHeight: '75.2px',
                        borderRadius: '14px',
                        border: '1.6px solid #E5E7EB',
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-[16px] font-bold flex-shrink-0"
                        style={{ background: '#F3F4F6', color: '#364153' }}
                      >
                        {label}
                      </div>
                      <span
                        className="text-[16px]"
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 500,
                          lineHeight: '24px',
                          color: '#101828',
                        }}
                      >
                        {text}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* CTA */}
              <div className="mt-4">
                <button className="w-full h-[52px] rounded-[14px] bg-[#0F172B] text-white font-bold text-[18px] leading-[28px] flex items-center justify-center hover:bg-[#111827] transition-colors">
                  Attempt Question
                </button>
              </div>
            </div>

            {/* Question card 3 - UPSC 2022, Environment, Moderate (biodiversity hotspots) */}
            <div
              className="rounded-[16px] bg-white shadow-[0_1px_2px_-1px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.1)] p-6 mb-6 w-full max-w-[546px] mx-auto"
              style={{ opacity: 1 }}
            >
              {/* Tag row */}
              <div
                className="flex flex-wrap gap-2 mb-5"
                style={{ width: '482px', maxWidth: '100%' }}
              >
                <span
                  className="px-3 py-1 rounded-full text-[12px] font-bold"
                  style={{ background: '#DCFCE7', color: '#008236' }}
                >
                  UPSC 2022
                </span>
                <span
                  className="px-3 py-1 rounded-full text-[12px] font-bold"
                  style={{ background: '#D0FAE5', color: '#007A55' }}
                >
                  ENVIRONMENT
                </span>
                <span
                  className="px-3 py-1 rounded-full text-[12px] font-bold"
                  style={{ background: '#FFEDD4', color: '#CA3500' }}
                >
                  MODERATE
                </span>
              </div>

              {/* Question meta */}
              <div
                className="uppercase mb-2"
                style={{
                  width: '482px',
                  maxWidth: '100%',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  lineHeight: '16px',
                  color: '#6A7282',
                }}
              >
                Prelims · Question #4
              </div>

              {/* Question text */}
              <p
                className="mb-5"
                style={{
                  width: '482px',
                  maxWidth: '100%',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '18px',
                  fontWeight: 400,
                  lineHeight: '29.25px',
                  color: '#101828',
                }}
              >
                Which of the following are recognised as biodiversity hotspots that include Indian territory?
              </p>

              {/* Stem */}
              <div
                className="rounded-[14px] px-4 py-4 mb-5 space-y-2 text-[14px]"
                style={{
                  width: '482px',
                  maxWidth: '100%',
                  background: '#F9FAFB',
                  color: '#364153',
                }}
              >
                <p>1. Western Ghats</p>
                <p>2. Eastern Himalayas</p>
                <p>3. Sundaland</p>
              </div>

              {/* Options */}
              <div
                className="space-y-3 mb-6"
                style={{ width: '482px', maxWidth: '100%' }}
              >
                {[
                  '1 only',
                  '1 and 2 only',
                  '1, 2 and 3',
                  '2 and 3 only',
                ].map((text, index) => {
                  const label = String.fromCharCode(65 + index);
                  return (
                    <button
                      key={label}
                      className="w-full flex items-center gap-4 rounded-[14px] bg-white px-6 py-4 text-left"
                      style={{
                        minHeight: '75.2px',
                        borderRadius: '14px',
                        border: '1.6px solid #E5E7EB',
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-[16px] font-bold flex-shrink-0"
                        style={{ background: '#F3F4F6', color: '#364153' }}
                      >
                        {label}
                      </div>
                      <span
                        className="text-[16px]"
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 500,
                          lineHeight: '24px',
                          color: '#101828',
                        }}
                      >
                        {text}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* CTA */}
              <div className="mt-4">
                <button className="w-full h-[52px] rounded-[14px] bg-[#0F172B] text-white font-bold text-[18px] leading-[28px] flex items-center justify-center hover:bg-[#111827] transition-colors">
                  Attempt Question
                </button>
              </div>
            </div>

            {/* Login CTA card - Load more questions (546×127.2, full border, button centered) */}
            <div
              className="rounded-[16px] bg-white w-full max-w-[546px] mx-auto mb-6 flex items-center justify-center"
              style={{
                minHeight: '127.2px',
                padding: '33.6px clamp(24px, 12%, 65.04px) 1.6px',
                border: '1.6px solid #BEDBFF',
                borderRadius: '16px',
                boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A',
              }}
            >
              <button
                className="flex items-center justify-center rounded-[14px] text-white font-bold transition-opacity hover:opacity-95"
                style={{
                  width: 'min(415.925px, 100%)',
                  height: '60px',
                  borderRadius: '14px',
                  gap: '8px',
                  opacity: 1,
                  background: 'linear-gradient(90deg, #FF6900 0%, #F0B100 100%)',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '18px',
                  lineHeight: '28px',
                  letterSpacing: 0,
                  textAlign: 'center',
                }}
              >
                <span className="text-[20px] leading-none" aria-hidden>🔥</span>
                <span>Login to Load 2,380+ More Questions</span>
              </button>
            </div>
          </section>

          {/* Right: filters */}
          <aside className="w-full lg:w-[320px] xl:w-[358px] flex-shrink-0 space-y-4">
            {/* Exam year card - 307×198, exact shadow & year buttons */}
            <div
              className="rounded-[16px] bg-white flex flex-col"
              style={{
                width: '307px',
                height: '198px',
                opacity: 1,
                boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A',
              }}
            >
              <div className="flex items-center gap-3 pt-5 pl-5 pr-5 pb-3">
                <div className="w-7 h-7 rounded-full bg-[#0F172B] flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0">
                  1
                </div>
                <div className="text-[12px] font-bold tracking-[0.06em] uppercase text-[#4A5565]">
                  EXAM YEAR
                </div>
              </div>
              <div
                className="grid grid-cols-4 gap-2 px-5"
                style={{ gap: '8px 8px' }}
              >
                {[
                  { year: '2024', selected: true },
                  { year: '2023', selected: false },
                  { year: '2022', selected: false },
                  { year: '2021', selected: false },
                  { year: '2020', selected: false },
                  { year: '2019', selected: false },
                  { year: '2018', selected: false },
                  { year: '2017', selected: false },
                ].map(({ year, selected }) => (
                  <button
                    key={year}
                    className="rounded-[10px] flex items-center justify-center flex-shrink-0"
                    style={{
                      width: '49.25px',
                      height: '36px',
                      background: selected ? '#FDBA26' : '#F3F4F6',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 600,
                      fontSize: '14px',
                      lineHeight: '20px',
                      letterSpacing: 0,
                      textAlign: 'center',
                      color: selected ? '#FFFFFF' : '#364153',
                    }}
                  >
                    {year}
                  </button>
                ))}
              </div>
              <div
                className="flex-1 flex items-end justify-center pb-4"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#364153',
                }}
              >
                All Years
              </div>
            </div>

            {/* Subject Filter panel - 310×826 */}
            <div
              className="rounded-[16px] bg-white flex flex-col overflow-hidden"
              style={{
                width: '310px',
                minHeight: '826px',
                opacity: 1,
                borderTop: '0.8px solid #E5E7EB',
                boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A',
              }}
            >
              <div className="flex items-center gap-3 pt-6 pb-4 px-5">
                <div
                  className="rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ width: 24, height: 24, background: '#1E293B', color: '#FFFFFF', fontSize: 12, fontWeight: 700 }}
                >
                  2
                </div>
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: '12px',
                    lineHeight: '16px',
                    letterSpacing: '0.6px',
                    textTransform: 'uppercase',
                    color: '#364153',
                  }}
                >
                  Subject Filter
                </span>
              </div>

              <div className="flex flex-col gap-2 px-5 pb-5">
                {[
                  { label: 'All Papers', count: '2600', selected: true, icon: '📘' },
                  { label: 'History', count: '340', selected: false, icon: '🏛️' },
                  { label: 'Geography', count: '289', selected: false, icon: '🌍' },
                  { label: 'Polity', count: '220', selected: false, icon: '⚖️' },
                  { label: 'Economy', count: '258', selected: false, icon: '📈' },
                  { label: 'Science & Tech', count: '55', selected: false, icon: '🔬' },
                  { label: 'Environment', count: '198', selected: false, icon: '🌿' },
                  { label: 'Int. Relations', count: '138', selected: false, icon: '🌐' },
                  { label: 'Security & Defence', count: '95', selected: false, icon: '🛡️' },
                  { label: 'CSAT', count: '120', selected: false, icon: '📊' },
                  { label: 'Art & Culture', count: '55', selected: false, icon: '🎨' },
                ].map(({ label, count, selected, icon }) => (
                  <button
                    key={label}
                    className="w-full flex items-center justify-between rounded-[14px] px-4 py-3 text-left transition-colors"
                    style={{
                      minHeight: '59.99px',
                      background: selected ? '#0F1A30' : '#F9FAFB',
                      paddingLeft: 16,
                      paddingRight: 16,
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[18px] leading-none flex-shrink-0" aria-hidden>
                        {icon}
                      </span>
                      <span
                        style={{
                          fontFamily: selected ? 'Arimo, sans-serif' : 'Inter, sans-serif',
                          fontWeight: selected ? 700 : 500,
                          fontSize: '14px',
                          lineHeight: '20px',
                          letterSpacing: 0,
                          color: selected ? '#FFFFFF' : '#101828',
                        }}
                      >
                        {label}
                      </span>
                    </div>
                    <span
                      className="flex-shrink-0"
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 600,
                        fontSize: '14px',
                        lineHeight: '20px',
                        letterSpacing: 0,
                        color: selected ? '#FFFFFF' : '#99A1AF',
                      }}
                    >
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

