'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { dailyAnswerService } from '@/lib/services';

const STEPS = [
  {
    id: 1,
    icon: '/eval-upload.png',
    emoji: '🔍',
    bg: '#E0F2FE',
    title: 'Uploading Answer Script',
    subtitle: 'Scanning and processing your handwritten answer',
    key: 'upload',
  },
  {
    id: 2,
    icon: '/eval-structural.png',
    emoji: '📝',
    bg: '#FEF3C7',
    title: 'Structural Analysis',
    subtitle: 'Checking introduction-body-conclusion flow',
    key: 'structural',
  },
  {
    id: 3,
    icon: '/eval-content.png',
    emoji: '📚',
    bg: '#DBEAFE',
    title: 'Content Depth Assessment',
    subtitle: 'Evaluating conceptual clarity and dimensions',
    key: 'content',
  },
  {
    id: 4,
    icon: '/eval-balance.png',
    emoji: '⚖️',
    bg: '#FCE7F3',
    title: 'Balance & Perspective Check',
    subtitle: 'Ensuring multi-dimensional viewpoint',
    key: 'balance',
  },
  {
    id: 5,
    icon: '/eval-fact.png',
    emoji: '📊',
    bg: '#DCFCE7',
    title: 'Fact & Example Validation',
    subtitle: 'Cross-referencing with latest data',
    key: 'fact',
  },
  {
    id: 6,
    icon: '/eval-pillar.png',
    emoji: '🎯',
    bg: '#EDE9FE',
    title: '6-Pillar Rubric Scoring',
    subtitle: 'Direct   Demand   Structure   Substantiation',
    key: 'scoring',
  },
  {
    id: 7,
    icon: '/eval-feedback.png',
    emoji: '💡',
    bg: '#FEF9C3',
    title: 'Preparing Personalised Feedback',
    subtitle: 'Crafting actionable insights tailored to your answer',
    key: 'feedback',
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

const MIN_DISPLAY_SECONDS = 60;

export default function EvaluatingPage() {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState<string>('evaluating');
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const navigatedRef = useRef(false);
  const resultsReadyRef = useRef(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const maxRetriesRef = useRef(0);
  const elapsedRef = useRef(0);

  // Keep elapsedRef in sync so the navigate effect can read the latest value
  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  const navigateToResults = useCallback(() => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    if (pollRef.current) clearInterval(pollRef.current);
    router.push('/dashboard/daily-answer/challenge/attempt/results');
  }, [router]);

  const checkResultsReady = useCallback(async () => {
    if (!attemptId || navigatedRef.current) return false;
    try {
      const resultsRes = await dailyAnswerService.getResults(attemptId);
      const resultsData = resultsRes?.data;
      const hasUsableResults =
        resultsData &&
        (
          typeof resultsData.score === 'number' ||
          typeof resultsData.maxScore === 'number' ||
          Array.isArray(resultsData.strengths) ||
          Array.isArray(resultsData.improvements) ||
          Array.isArray(resultsData.suggestions)
        );

      if (hasUsableResults) {
        resultsReadyRef.current = true;
        // Navigate immediately only if we've already waited long enough
        if (elapsedRef.current >= MIN_DISPLAY_SECONDS) {
          navigateToResults();
        }
        return true;
      }
    } catch (err) {
      console.log('Results not ready yet, staying on evaluating screen');
    }
    return false;
  }, [attemptId, navigateToResults]);

  // Get attemptId from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAttemptId = sessionStorage.getItem('dailyAnswerAttemptId');
      console.log('Retrieved attemptId from sessionStorage:', storedAttemptId);
      if (storedAttemptId) {
        setAttemptId(storedAttemptId);
      }
    }
  }, []);

  // Poll evaluation status every 3 seconds
  const pollStatus = useCallback(async () => {
    if (!attemptId) {
      console.log('No attemptId, skipping poll');
      return;
    }
    
    console.log('Polling with attemptId:', attemptId);
    
    try {
      const res = await dailyAnswerService.getEvaluationStatus(attemptId);
      console.log('Poll response:', res);
      const data = res.data;

      // Backend returns evaluationStatus, not status
      const evalStatus = data?.evaluationStatus || data?.status;
      if (evalStatus) {
        setStatus(evalStatus);
        console.log('Status:', evalStatus);
      }
      // Step ticks are driven by elapsed time only — ignore backend completedSteps

      // Check results when backend signals completion, but honour MIN_DISPLAY_SECONDS
      const isComplete = data?.isComplete || evalStatus === 'completed' || evalStatus === 'done';
      if (isComplete && !navigatedRef.current) {
        console.log('Evaluation marked complete, verifying results payload...');
        await checkResultsReady();
      }

      if (evalStatus === 'failed') {
        setError('Evaluation failed. Please open the results page or submit the answer again.');
        if (pollRef.current) clearInterval(pollRef.current);
      }

      // Safety check: if we've been polling for too long (5 minutes), stop and show error
      maxRetriesRef.current += 1;
      if (maxRetriesRef.current > 100) { // ~5 minutes at 3 second intervals
        setError('Evaluation is taking longer than expected. Please check your results page.');
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch (err: any) {
      console.error('Poll error:', err);
      // Don't set error immediately, let it retry
    }
  }, [attemptId, checkResultsReady]);

  // Start polling when attemptId is available
  useEffect(() => {
    if (!attemptId) return;

    // Initial call
    pollStatus();

    // Poll every 3 seconds
    pollRef.current = setInterval(pollStatus, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [attemptId, pollStatus]);

  // Elapsed timer for display
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        // Once minimum wait is reached, navigate if results are already in
        if (next >= MIN_DISPLAY_SECONDS && resultsReadyRef.current && !navigatedRef.current) {
          navigatedRef.current = true;
          if (pollRef.current) clearInterval(pollRef.current);
          router.push('/dashboard/daily-answer/challenge/attempt/results');
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [router]);

  // Step ticks are purely time-driven: each step gets an equal slice of MIN_DISPLAY_SECONDS.
  // A step's tick appears only after its full interval has elapsed.
  const STEP_INTERVAL = MIN_DISPLAY_SECONDS / STEPS.length;
  useEffect(() => {
    const stepsToComplete = Math.min(STEPS.length, Math.floor(elapsed / STEP_INTERVAL));
    setCompletedSteps(STEPS.slice(0, stepsToComplete).map((s) => s.key));
  }, [elapsed, STEP_INTERVAL]);

  // Preload step icons so they appear instantly instead of popping in
  useEffect(() => {
    STEPS.forEach((s) => {
      const img = new Image();
      img.src = s.icon;
    });
    ['/eval-header.png', '/eval-timer.png'].forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  const ESTIMATED_SECONDS = 60;
  const secondsRemaining = Math.max(0, ESTIMATED_SECONDS - elapsed);
  const progressPercent = Math.min(100, (elapsed / ESTIMATED_SECONDS) * 100);

  const isStepDone = (step: typeof STEPS[0]) =>
    completedSteps.includes(step.key);

  const isStepActive = (step: typeof STEPS[0], idx: number) => {
    if (isStepDone(step)) return false;
    if (idx === 0) return !isStepDone(step);
    return isStepDone(STEPS[idx - 1]) && !isStepDone(step);
  };

  // If no attemptId after a short delay, show error
  if (!attemptId && elapsed > 3) {
    return (
      <div
        className="min-h-screen flex items-center justify-center font-arimo"
        style={{ background: '#FAFBFE' }}
      >
        <div className="text-center px-6">
          <span style={{ fontSize: '48px' }}>⚠️</span>
          <h2 className="text-xl font-bold text-gray-800 mb-2 mt-4">Submission Not Found</h2>
          <p className="text-gray-500 mb-4">We could not find your answer submission. Please try submitting again.</p>
          <button
            onClick={() => router.push('/dashboard/daily-answer/challenge/attempt')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Challenge
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen overflow-hidden flex items-center justify-center font-arimo p-3"
      style={{ background: '#FAFBFE' }}
    >
      <div
        className="relative flex flex-col px-6 py-5 sm:px-8"
        style={{
          width: '100%',
          maxWidth: '700px',
          borderRadius: '16px',
          background: '#FFFFFF',
          boxShadow: '0px 8px 10px -6px #0000001A, 0px 20px 25px -5px #0000001A',
        }}
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/eval-header.png"
            alt="Evaluating"
            style={{ width: '44px', height: '44px', objectFit: 'contain', marginBottom: '6px' }}
          />
          <h1
            style={{
              fontFamily: 'Arimo',
              fontWeight: 700,
              fontSize: '22px',
              lineHeight: '28px',
              letterSpacing: '0px',
              color: '#1E2939',
              textAlign: 'center',
              marginBottom: '2px',
            }}
          >
            Evaluating Your Answer
          </h1>
          <p
            style={{
              fontFamily: 'Arimo',
              fontWeight: 400,
              fontSize: '13px',
              lineHeight: '18px',
              color: '#4A5565',
              textAlign: 'center',
              marginBottom: '1px',
            }}
          >
            Analyzing with UPSC examiner&apos;s lens
          </p>
          <p
            style={{
              fontFamily: 'Arimo',
              fontWeight: 400,
              fontSize: '12px',
              lineHeight: '16px',
              color: '#6A7282',
              textAlign: 'center',
            }}
          >
            This usually takes 30-60 seconds
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-3 px-4 py-2 bg-red-50 border border-red-200 rounded-[10px] text-red-700 text-center" style={{ fontSize: '13px' }}>
            {error}
            <div className="mt-2">
              <button
                onClick={() => router.push('/dashboard/daily-answer/challenge/attempt/results')}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                View Results
              </button>
            </div>
          </div>
        )}

        {/* Steps */}
        <div className="flex flex-col gap-0 mb-3">
          {STEPS.map((step, idx) => {
            const done = isStepDone(step);
            const active = isStepActive(step, idx);
            return (
              <div key={step.id}>
                <div className="flex items-center justify-between py-2">
                  {/* Left: icon + text */}
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '8px',
                        background: step.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        opacity: done || active ? 1 : 0.4,
                        transition: 'opacity 0.4s',
                        flexShrink: 0,
                      }}
                    >
                      <span className={step.key === 'feedback' && active ? 'bulb-grow' : undefined}>
                        {step.emoji}
                      </span>
                    </span>
                    <div>
                      <p
                        style={{
                          fontFamily: 'Arimo',
                          fontWeight: 700,
                          fontSize: '13px',
                          lineHeight: '18px',
                          color: '#17223E',
                        }}
                      >
                        {step.title}
                      </p>
                      <p
                        style={{
                          fontFamily: 'Arimo',
                          fontWeight: 400,
                          fontSize: '11px',
                          lineHeight: '15px',
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
                          width: '22px',
                          height: '22px',
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
            padding: '12px 20px',
          }}
        >
          {/* Timer row */}
          <div className="flex items-center justify-center gap-2 mb-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/eval-timer.png" alt="Timer" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
            <span
              style={{
                fontFamily: 'DM Sans',
                fontWeight: 700,
                fontSize: '13px',
                lineHeight: '18px',
                color: '#101828',
              }}
            >
              {secondsRemaining > 0 ? `${secondsRemaining} Seconds Remaining` : 'Almost done...'}
            </span>
          </div>

          {/* Progress bar */}
          <div
            className="mx-auto mb-2"
            style={{
              width: '100%',
              maxWidth: '362px',
              height: '4px',
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
            className="text-center mb-1"
            style={{
              fontFamily: 'Arimo',
              fontSize: '12px',
              lineHeight: '17px',
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
              fontSize: '11px',
              lineHeight: '14px',
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
