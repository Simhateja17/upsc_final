'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const TOTAL_SECONDS = 60;

const STEPS = [
  {
    id: 1,
    icon: '/eval-structural.png',
    title: 'Structural Analysis',
    subtitle: 'Checking introduction-body-conclusion flow',
    completesAt: 10,
  },
  {
    id: 2,
    icon: '/eval-content.png',
    title: 'Content Depth Assessment',
    subtitle: 'Evaluating conceptual clarity and dimensions',
    completesAt: 22,
  },
  {
    id: 3,
    icon: '/eval-balance.png',
    title: 'Balance & Perspective Check',
    subtitle: 'Ensuring multi-dimensional viewpoint',
    completesAt: 34,
  },
  {
    id: 4,
    icon: '/eval-fact.png',
    title: 'Fact & Example Validation',
    subtitle: 'Cross-referencing with latest data',
    completesAt: 46,
  },
  {
    id: 5,
    icon: '/eval-pillar.png',
    title: '6-Pillar Rubric Scoring',
    subtitle: 'Direct   Demand   Structure   Substantiation',
    completesAt: 58,
  },
];

const CheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="11" stroke="#22C55E" strokeWidth="2" fill="none" />
    <path d="M7 12.5L10.5 16L17 9" stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SpinnerIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="animate-spin"
  >
    <circle cx="12" cy="12" r="10" stroke="#D1D5DB" strokeWidth="2.5" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="#17223E" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export default function EvaluatingPage() {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);

  const navigatedRef = useRef(false);

  useEffect(() => {
    if (elapsed >= TOTAL_SECONDS) {
      if (!navigatedRef.current) {
        navigatedRef.current = true;
        router.push('/dashboard/daily-answer/challenge/attempt/results');
      }
      return;
    }
    const timer = setInterval(() => {
      setElapsed((prev) => {
        if (prev + 1 >= TOTAL_SECONDS) {
          clearInterval(timer);
          return TOTAL_SECONDS;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [elapsed, router]);

  const secondsRemaining = TOTAL_SECONDS - elapsed;
  const progressPercent = (elapsed / TOTAL_SECONDS) * 100;

  const isStepDone = (step: typeof STEPS[0]) =>
    elapsed >= step.completesAt;

  const isStepActive = (step: typeof STEPS[0], idx: number) => {
    const prevDone = idx === 0 ? true : elapsed >= STEPS[idx - 1].completesAt;
    return prevDone && !isStepDone(step);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center font-arimo"
      style={{ background: 'linear-gradient(180deg, #E6EAF0 0%, #DDE2EA 100%)' }}
    >
      <div
        className="relative flex flex-col"
        style={{
          width: '768px',
          borderRadius: '16px',
          background: '#FFFFFF',
          boxShadow: '0px 8px 10px -6px #0000001A, 0px 20px 25px -5px #0000001A',
          padding: '48px 48px 48px 48px',
        }}
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <img
            src="/eval-header.png"
            alt="Evaluating"
            style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '16px' }}
          />
          <h1
            style={{
              fontFamily: 'Arimo',
              fontWeight: 700,
              fontSize: '30px',
              lineHeight: '36px',
              letterSpacing: '0px',
              color: '#1E2939',
              textAlign: 'center',
              marginBottom: '8px',
            }}
          >
            Evaluating Your Answer
          </h1>
          <p
            style={{
              fontFamily: 'Arimo',
              fontWeight: 400,
              fontSize: '16px',
              lineHeight: '24px',
              color: '#4A5565',
              textAlign: 'center',
              marginBottom: '4px',
            }}
          >
            Analyzing with UPSC examiner&apos;s lens
          </p>
          <p
            style={{
              fontFamily: 'Arimo',
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: '20px',
              color: '#6A7282',
              textAlign: 'center',
            }}
          >
            This usually takes 30-60 seconds
          </p>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-0 mb-6">
          {STEPS.map((step, idx) => {
            const done = isStepDone(step);
            const active = isStepActive(step, idx);
            return (
              <div key={step.id}>
                <div className="flex items-center justify-between py-4">
                  {/* Left: icon + text */}
                  <div className="flex items-center gap-4">
                    <img
                      src={step.icon}
                      alt={step.title}
                      style={{
                        width: '40px',
                        height: '40px',
                        objectFit: 'contain',
                        opacity: done || active ? 1 : 0.4,
                        transition: 'opacity 0.4s',
                      }}
                    />
                    <div>
                      <p
                        style={{
                          fontFamily: 'Arimo',
                          fontWeight: 700,
                          fontSize: '16px',
                          lineHeight: '24px',
                          color: '#17223E',
                        }}
                      >
                        {step.title}
                      </p>
                      <p
                        style={{
                          fontFamily: 'Arimo',
                          fontWeight: 400,
                          fontSize: '14px',
                          lineHeight: '20px',
                          color: '#17223E',
                        }}
                      >
                        {step.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Right: status icon */}
                  <div className="flex items-center gap-3">
                    {done ? (
                      <CheckIcon />
                    ) : active ? (
                      <SpinnerIcon />
                    ) : (
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: '2px solid #D1D5DB',
                        }}
                      />
                    )}
                  </div>
                </div>
                {/* Divider (skip after last) */}
                {idx < STEPS.length - 1 && (
                  <div
                    style={{
                      width: '100%',
                      height: '1px',
                      background: '#B1B1B1',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom yellow card */}
        <div
          style={{
            borderRadius: '10px',
            borderLeft: '4px solid #FDC700',
            background: '#FEFCE8',
            padding: '24px 34px',
          }}
        >
          {/* Timer row */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <img src="/eval-timer.png" alt="Timer" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
            <span
              style={{
                fontFamily: 'DM Sans',
                fontWeight: 700,
                fontSize: '15px',
                lineHeight: '22.75px',
                color: '#101828',
              }}
            >
              {secondsRemaining} Seconds Remaining
            </span>
          </div>

          {/* Progress bar */}
          <div
            className="mx-auto mb-4"
            style={{
              width: '362px',
              height: '5px',
              borderRadius: '10px',
              background: '#D9D9D9',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                borderRadius: '10px',
                background: '#101828',
                transition: 'width 1s linear',
              }}
            />
          </div>

          {/* While you wait text */}
          <p
            className="text-center mb-3"
            style={{
              fontFamily: 'Arimo',
              fontSize: '14px',
              lineHeight: '22.75px',
              color: '#364153',
            }}
          >
            <strong>While you wait:</strong> This 60-second pause is deliberate. In the actual exam, this is the time you&apos;d
            spend reviewing your answer. Use this moment to mentally note one improvement you could make.
          </p>

          {/* Quote */}
          <p
            className="text-center"
            style={{
              fontFamily: 'Arimo',
              fontWeight: 400,
              fontStyle: 'italic',
              fontSize: '12px',
              lineHeight: '16px',
              color: '#6A7282',
            }}
          >
            &quot;Consistency matters more than perfection. You&apos;re building a skill that compounds.&quot;
          </p>
        </div>
      </div>
    </div>
  );
}
