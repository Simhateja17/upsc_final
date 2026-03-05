'use client';

import React, { useState } from 'react';

export default function PyqPage() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAttemptModal, setShowAttemptModal] = useState(false);
  const [mode, setMode] = useState<'prelims' | 'mains'>('prelims');

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
                background: mode === 'prelims' ? '#0F172B' : 'transparent',
                gap: '12px',
              }}
              onClick={() => setMode('prelims')}
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
                  color: mode === 'prelims' ? '#FFFFFF' : '#4A5565',
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
                background: mode === 'mains' ? '#0F172B' : 'transparent',
                gap: '12px',
              }}
              onClick={() => setMode('mains')}
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
                  color: mode === 'mains' ? '#FFFFFF' : '#4A5565',
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
            {mode === 'prelims' ? (
              <>
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
                onClick={() => setShowLoginModal(true)}
              >
                <span className="text-[20px] leading-none" aria-hidden>🔥</span>
                <span>Login to Load 2,380+ More Questions</span>
              </button>
            </div>
              </>
            ) : (
              <>
                {/* Mains header */}
                <div
                  className="mb-6"
                  style={{
                    width: '540px',
                    maxWidth: '100%',
                    height: '87.975px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <h3
                    style={{
                      width: '356px',
                      maxWidth: '100%',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 700,
                      fontSize: '24px',
                      lineHeight: '32px',
                      color: '#101828',
                    }}
                  >
                    Mains Questions - All Papers
                  </h3>
                  <p
                    style={{
                      marginTop: '8px',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 400,
                      fontSize: '14px',
                      lineHeight: '20px',
                      color: '#6A7282',
                    }}
                  >
                    Showing 3 of 800 questions
                  </p>
                </div>

                {/* Mains question cards (3) */}
                {[1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className="mb-6"
                    style={{
                      width: '540px',
                      maxWidth: '100%',
                      borderRadius: '16px',
                      border: '0.8px solid #E5E7EB',
                      background: '#FFFFFF',
                      boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A',
                      padding: '32px',
                    }}
                  >
                    {/* Tag row */}
                    <div
                      className="flex flex-wrap gap-2 mb-4"
                      style={{ width: '474.4px', maxWidth: '100%' }}
                    >
                      <span
                        className="px-3 py-1 rounded-[8px] text-[12px] font-bold"
                        style={{ background: '#1E40AF', color: '#FFFFFF' }}
                      >
                        UPSC MAINS 2024
                      </span>
                      <span
                        className="px-3 py-1 rounded-[8px] text-[12px] font-bold"
                        style={{ background: '#DBEAFE', color: '#1447E6' }}
                      >
                        GS PAPER II
                      </span>
                      <span
                        className="px-3 py-1 rounded-[8px] text-[12px] font-bold"
                        style={{ background: '#FFEDD4', color: '#CA3500' }}
                      >
                        GOVERNANCE
                      </span>
                      <span
                        className="px-3 py-1 rounded-[8px] text-[12px] font-bold"
                        style={{ background: '#F3E8FF', color: '#8200DB' }}
                      >
                        15 MARKS
                      </span>
                    </div>

                    {/* AI Evaluation pill */}
                    <div
                      className="inline-flex items-center mb-4"
                      style={{
                        borderRadius: '8px',
                        background: '#17223E',
                        padding: '4px 16px',
                      }}
                    >
                      <span style={{ fontSize: '14px', marginRight: '8px' }} aria-hidden>
                        ✨
                      </span>
                      <span
                        style={{
                          fontFamily: 'Arimo, sans-serif',
                          fontWeight: 700,
                          fontSize: '14px',
                          lineHeight: '20px',
                          color: '#FFD272',
                        }}
                      >
                        AI Evaluation
                      </span>
                    </div>

                    {/* Meta */}
                    <div
                      className="mb-2"
                      style={{
                        width: '474.4px',
                        maxWidth: '100%',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 400,
                        fontSize: '12px',
                        lineHeight: '16px',
                        letterSpacing: '0.3px',
                        textTransform: 'uppercase',
                        color: '#6A7282',
                      }}
                    >
                      MAINS · GS-II · QUESTION #1
                    </div>

                    {/* Question text */}
                    <p
                      className="mb-4"
                      style={{
                        width: '474.4px',
                        maxWidth: '100%',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500,
                        fontSize: '16px',
                        lineHeight: '26px',
                        color: '#101828',
                      }}
                    >
                      &quot;The role of civil society organisations in policy-making has increased significantly in India,
                      yet their accountability remains a critical concern.&quot;{' '}
                      <span style={{ fontWeight: 700 }}>
                        Examine with relevant examples.
                      </span>
                    </p>

                    {/* Stats row */}
                    <div
                      className="flex flex-wrap items-center gap-6 mb-6"
                      style={{ width: '474.4px', maxWidth: '100%' }}
                    >
                      <div className="flex items-center gap-2">
                        <span aria-hidden>📝</span>
                        <span
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '14px',
                            lineHeight: '20px',
                            color: '#6A7282',
                          }}
                        >
                          150 words
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span aria-hidden>📊</span>
                        <span
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '14px',
                            lineHeight: '20px',
                            color: '#6A7282',
                          }}
                        >
                          Characters
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span aria-hidden>📅</span>
                        <span
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '14px',
                            lineHeight: '20px',
                            color: '#6A7282',
                          }}
                        >
                          2024
                        </span>
                      </div>
                    </div>

                    {/* Buttons row */}
                    <div
                      className="flex items-center gap-3 mb-4"
                      style={{ width: '474.4px', maxWidth: '100%' }}
                    >
                      <button
                        className="flex items-center justify-center"
                        style={{
                          width: '205px',
                          height: '59px',
                          borderRadius: '14px',
                          background: '#101828',
                          color: '#FFFFFF',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 700,
                          fontSize: '16px',
                          lineHeight: '24px',
                        }}
                        onClick={() => setShowAttemptModal(true)}
                      >
                        <span aria-hidden style={{ marginRight: '8px' }}>
                          🔥
                        </span>
                        <span>Write &amp; AI Evaluate</span>
                      </button>
                      <button
                        className="flex items-center justify-center"
                        style={{
                          width: '182px',
                          height: '59px',
                          borderRadius: '14px',
                          background: '#0F172A',
                          color: '#FFFFFF',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 700,
                          fontSize: '16px',
                          lineHeight: '24px',
                        }}
                      >
                        <span>Model Answer</span>
                      </button>
                      <button
                        className="flex items-center justify-center"
                        style={{
                          width: '65px',
                          height: '59px',
                          borderRadius: '14px',
                          border: '1.6px solid #FFC9C9',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 500,
                          fontSize: '20px',
                          lineHeight: '28px',
                          color: '#0A0A0A',
                        }}
                      >
                        ✏️
                      </button>
                    </div>

                    {/* Footnote */}
                    <div
                      className="flex items-center gap-2 justify-end"
                      style={{
                        width: '474.4px',
                        maxWidth: '100%',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 400,
                        fontSize: '14px',
                        lineHeight: '20px',
                        color: '#6A7282',
                      }}
                    >
                      <img
                        src="/icon-21-lock.png"
                        alt="Locked"
                        style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                      />
                      <span>Full model answer on login</span>
                    </div>
                  </div>
                ))}
              </>
            )}
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

      {/* Login modal - Unlock Full PYQ Access */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(15,23,42,0.45)' }}>
          <div
            className="relative flex flex-col items-center text-center"
            style={{
              width: '448px',
              maxWidth: '100%',
              minHeight: '549.2px',
              borderRadius: '24px',
              background: '#FFFFFF',
              boxShadow: '0px 25px 50px -12px #00000040',
              padding: '40px 32px 32px',
            }}
          >
            {/* Target icon placeholder */}
            <div
              className="mb-6 flex items-center justify-center"
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '9999px',
                background: '#0F172B',
              }}
            >
              <span style={{ fontSize: '36px' }} aria-hidden>
                🎯
              </span>
            </div>

            {/* Heading */}
            <h2
              style={{
                width: '347px',
                maxWidth: '100%',
                height: '36px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: '30px',
                lineHeight: '36px',
                color: '#101828',
                marginBottom: '16px',
              }}
            >
              Unlock Full PYQ Access
            </h2>

            {/* Description */}
            <p
              style={{
                width: '367px',
                maxWidth: '100%',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: '16px',
                lineHeight: '26px',
                color: '#4A5565',
                marginBottom: '32px',
              }}
            >
              Login or create a free account to attempt questions, save progress, read full explanations, and use
              AI-powered Mains Answer Evaluation.
            </p>

            {/* Create Free Account button */}
            <button
              className="flex items-center justify-center mb-3"
              style={{
                width: '368px',
                maxWidth: '100%',
                height: '60px',
                borderRadius: '16px',
                gap: '8px',
                background: '#0F172B',
                color: '#FFFFFF',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: '18px',
                lineHeight: '28px',
              }}
            >
              <span aria-hidden>🚀</span>
              <span>Create Free Account</span>
            </button>

            {/* Login with Google button */}
            <button
              className="flex items-center justify-center mb-5"
              style={{
                width: '368px',
                maxWidth: '100%',
                height: '63.2px',
                borderRadius: '16px',
                gap: '8px',
                background: '#FFFBEB',
                border: '1.6px solid #FEE685',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: '18px',
                lineHeight: '28px',
                color: '#101828',
              }}
            >
              <span aria-hidden>🔑</span>
              <span>Login with Google</span>
            </button>

            {/* Maybe later */}
            <button
              type="button"
              onClick={() => setShowLoginModal(false)}
              style={{
                width: '368px',
                maxWidth: '100%',
                height: '48px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: '16px',
                lineHeight: '24px',
                color: '#6A7282',
              }}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* Attempt / Question review modal - opens from Write & AI Evaluate */}
      {showAttemptModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ background: 'rgba(15,23,42,0.5)' }}
          onClick={() => setShowAttemptModal(false)}
        >
          <div
            className="rounded-[24px] bg-white flex flex-col my-8"
            style={{
              width: '896px',
              maxWidth: '100%',
              minHeight: '882px',
              gap: '24px',
              padding: '32px 32px 32px 40px',
              borderLeft: '8px solid #00A63E',
              boxShadow: '0px 4px 6px -4px #0000001A, 0px 10px 15px -3px #0000001A',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: question #, tags, actions */}
            <div
              className="flex items-center justify-between flex-wrap gap-2"
              style={{ width: '824px', maxWidth: '100%', height: '48px' }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <div
                  className="rounded-[14px] flex items-center justify-center flex-shrink-0"
                  style={{ width: 48, height: 48, background: '#1E293B', color: '#FFFFFF', fontFamily: 'Inter', fontWeight: 700, fontSize: '18px', lineHeight: '28px' }}
                >
                  1
                </div>
                <span className="px-3 py-1.5 rounded-full text-[14px] font-semibold" style={{ background: '#1E293B', color: '#FFFFFF' }}>2024</span>
                <span className="px-3 py-1.5 rounded-full text-[14px] font-semibold" style={{ background: '#FEF3C6', color: '#BB4D00' }}>History</span>
                <span className="px-3 py-1.5 rounded-full text-[14px] font-semibold flex items-center gap-1" style={{ background: '#FFEDD4', color: '#F54900' }}>🔥 Medium</span>
                <span className="px-3 py-1 rounded-full text-[14px] font-semibold flex items-center gap-1" style={{ background: '#DCFCE7', color: '#008236' }}>✅ Attempted</span>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setShowAttemptModal(false)} className="w-10 h-10 rounded-[14px] flex items-center justify-center text-[18px]" style={{ background: '#1E293B', color: '#FFF' }} aria-label="Close">×</button>
                <button type="button" className="w-10 h-10 rounded-[14px] flex items-center justify-center" style={{ background: '#F3F4F6', color: '#364153' }} aria-label="Edit">✏️</button>
                <button type="button" className="w-10 h-10 rounded-[14px] flex items-center justify-center" style={{ background: '#F3F4F6', color: '#364153' }} aria-label="Full screen">⛶</button>
              </div>
            </div>

            {/* Question text */}
            <p style={{ width: '824px', maxWidth: '100%', fontFamily: 'Inter', fontWeight: 400, fontSize: '18px', lineHeight: '29.25px', color: '#1E2939' }}>
              With reference to the history of ancient India, which of the following statements is/are correct?
            </p>

            {/* Statements */}
            <div style={{ width: '824px', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '16px', lineHeight: '24px', color: '#364153' }}>1. Arthashastra was written by Vishnugupta</p>
              <p style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '16px', lineHeight: '24px', color: '#364153' }}>2. Indica was written by Deimachos</p>
              <p style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '16px', lineHeight: '24px', color: '#364153' }}>3. Mudrarakshasa was written by Visakhadatta</p>
            </div>

            {/* Options */}
            <div style={{ width: '824px', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'A', text: '1 and 2 only', correct: false, wrong: false },
                { label: 'B', text: '1 and 3 only', correct: true, wrong: false },
                { label: 'C', text: '2 and 3 only', correct: false, wrong: false },
                { label: 'D', text: '1, 2 and 3', correct: false, wrong: true },
              ].map(({ label, text, correct, wrong }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-[14px] pl-4 py-3"
                  style={{
                    minHeight: 65,
                    background: correct ? '#F0FDF4' : wrong ? '#FEF2F2' : '#F9FAFB',
                    border: correct ? '1.6px solid #00C950' : wrong ? '1.6px solid #FB2C36' : '0.8px solid #E5E7EB',
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 text-[16px] font-bold"
                    style={{ background: correct ? '#00A63E' : wrong ? '#E7000B' : '#D1D5DC', color: correct || wrong ? '#FFFFFF' : '#364153' }}
                  >
                    {label}
                  </div>
                  <span style={{ fontFamily: 'Inter', fontWeight: correct || wrong ? 500 : 400, fontSize: '16px', lineHeight: '24px', color: '#1E2939' }}>{text}</span>
                </div>
              ))}
            </div>

            {/* Explanation */}
            <div style={{ width: '774.4px', maxWidth: '100%' }}>
              <div className="flex items-center gap-2 mb-2" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: '14px', lineHeight: '20px', letterSpacing: '0.35px', textTransform: 'uppercase', color: '#016630' }}>
                <span aria-hidden>✅</span>
                <span>Explanation</span>
              </div>
              <p style={{ width: '100%', fontFamily: 'Inter', fontWeight: 400, fontSize: '16px', lineHeight: '26px', color: '#364153', marginBottom: 12 }}>
                Arthashastra is attributed to Kautilya/Vishnugupta/Chanakya (correct). Indica was written by Megasthenes, not Deimachos. Mudrarakshasa was indeed written by Visakhadatta — a Sanskrit play on Chandragupta&apos;s ascent.
              </p>
              <div className="flex items-center gap-2" style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#6A7282' }}>
                <span aria-hidden>📖</span>
                <span>UPSC CSE Prelims 2024, GS Paper I</span>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="flex items-center justify-between flex-wrap gap-4" style={{ width: '824px', maxWidth: '100%', marginTop: 'auto', paddingTop: 8 }}>
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-[14px] px-5 py-2.5"
                style={{ background: '#DCFCE7', color: '#008236', fontFamily: 'Inter', fontWeight: 600, fontSize: '16px', lineHeight: '24px' }}
              >
                <span aria-hidden>✅</span>
                <span>Attempted · Reset</span>
              </button>
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-2" style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#6A7282' }}>
                  <span aria-hidden>👁</span>
                  <span>1,240 views</span>
                </span>
                <span className="flex items-center gap-2" style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#6A7282' }}>
                  <span aria-hidden>🎯</span>
                  <span>58% avg accuracy</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

