'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { dailyAnswerService, mainsEvaluatorService } from '@/lib/services';

const STEPS = [
  {
    id: 1,
    icon: '/eval-upload.png',
    emoji: '🔍',
    bg: '#E3F2FD',
    title: 'Uploading Answer Script',
    subtitle: 'Scanning and processing your handwritten answer',
    key: 'upload',
  },
  {
    id: 2,
    icon: '/eval-structural.png',
    emoji: '📝',
    bg: '#FFF9C4',
    title: 'Structural Analysis',
    subtitle: 'Checking introduction-body-conclusion flow',
    key: 'structural',
  },
  {
    id: 3,
    icon: '/eval-content.png',
    emoji: '📚',
    bg: '#C8E6C9',
    title: 'Content Depth Assessment',
    subtitle: 'Evaluating conceptual clarity and dimensions',
    key: 'content',
  },
  {
    id: 4,
    icon: '/eval-balance.png',
    emoji: '⚖️',
    bg: '#F8BBD0',
    title: 'Balance & Perspective Check',
    subtitle: 'Ensuring multi-dimensional viewpoint',
    key: 'balance',
  },
  {
    id: 5,
    icon: '/eval-fact.png',
    emoji: '📊',
    bg: '#B2DFDB',
    title: 'Fact & Example Validation',
    subtitle: 'Cross-referencing with latest data',
    key: 'fact',
  },
  {
    id: 6,
    icon: '/eval-pillar.png',
    emoji: '🎯',
    bg: '#E1BEE7',
    title: '6-Pillar Rubric Scoring',
    subtitle: 'Direct   Demand   Structure   Substantiation',
    key: 'scoring',
  },
  {
    id: 7,
    icon: '/eval-feedback.png',
    emoji: '💡',
    bg: '#FFECB3',
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
  const evalStartKey = 'dailyAnswerEvalStart';
  const [elapsed, setElapsed] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const stored = sessionStorage.getItem(evalStartKey);
    if (stored) {
      return Math.max(0, Math.floor((Date.now() - Number(stored)) / 1000));
    }
    sessionStorage.setItem(evalStartKey, String(Date.now()));
    return 0;
  });
  const [status, setStatus] = useState<string>('evaluating');
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [source, setSource] = useState<'daily' | 'custom'>('daily');
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
    sessionStorage.removeItem(evalStartKey);
    const suffix = source === 'custom' ? '?source=custom' : '';
    router.push(`/dashboard/daily-answer/challenge/attempt/results${suffix}`);
  }, [router, source]);

  const checkResultsReady = useCallback(async () => {
    if (!attemptId || navigatedRef.current) return false;
    try {
      const resultsRes = source === 'custom'
        ? await mainsEvaluatorService.getResults(attemptId)
        : await dailyAnswerService.getResults(attemptId);
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
  }, [attemptId, navigateToResults, source]);

  // Get attemptId from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCustomAttemptId = sessionStorage.getItem('mainsEvaluatorAttemptId');
      if (storedCustomAttemptId) {
        console.log('Retrieved custom mains evaluator attemptId from sessionStorage:', storedCustomAttemptId);
        setSource('custom');
        setAttemptId(storedCustomAttemptId);
        return;
      }

      const storedAttemptId = sessionStorage.getItem('dailyAnswerAttemptId');
      console.log('Retrieved attemptId from sessionStorage:', storedAttemptId);
      if (storedAttemptId) {
        setSource('daily');
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
      const res = source === 'custom'
        ? await mainsEvaluatorService.getEvaluationStatus(attemptId)
        : await dailyAnswerService.getEvaluationStatus(attemptId);
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
  }, [attemptId, checkResultsReady, source]);

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
      className="h-full overflow-hidden flex items-center justify-center font-jakarta"
      style={{ background: '#F5F6F8' }}
    >
      <style>{`
        @keyframes da-brainBreathe {
          0%, 100% { transform: scale(1);    box-shadow: 0 0 0 0 rgba(244,143,177,0.30); }
          50%      { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(244,143,177,0); }
        }
        .da-thinking-brain { width:64px; height:64px; margin:0 auto; display:grid; place-items:center; border-radius:50%;
          background:radial-gradient(circle, rgba(244,143,177,0.15) 0%, transparent 70%); animation:da-brainBreathe 3s ease-in-out infinite; }
      `}</style>
      <div
        className="relative flex flex-col px-6 py-5 sm:px-7"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: 'calc(100vh - 80px)',
          borderRadius: '24px',
          background: '#FFFFFF',
          boxShadow: '0 1px 2px rgba(15,23,42,.04), 0 8px 24px rgba(15,23,42,.06), inset 0 0 0 1px #E6E8EE',
        }}
      >
        {/* Header */}
        <div className="flex flex-col items-center" style={{ marginBottom: 8 }}>
          <div className="da-thinking-brain" aria-hidden="true">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M9.5 2C7.567 2 6 3.567 6 5.5c0 .536.12 1.044.334 1.5H6c-1.657 0-3 1.343-3 3 0 1.135.63 2.122 1.556 2.625C4.207 13.285 4 14.118 4 15c0 2.21 1.79 4 4 4h1v1a2 2 0 002 2h2a2 2 0 002-2v-1h1c2.21 0 4-1.79 4-4 0-.882-.207-1.715-.556-2.375C20.37 13.122 21 12.135 21 11c0-1.657-1.343-3-3-3h-.334A3.5 3.5 0 0018 5.5C18 3.567 16.433 2 14.5 2c-1.12 0-2.117.527-2.75 1.35C11.117 2.527 10.12 2 9.5 2z" fill="#F48FB1" opacity="0.9" />
              <path d="M12 4v16M9 8h6M10 12h4M9 16h6" stroke="#fff" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
            </svg>
          </div>
          <h1 style={{ fontFamily: 'var(--font-dm-serif), serif', fontSize: '22px', letterSpacing: '-0.01em', lineHeight: '28px', color: '#0B1020', textAlign: 'center', marginTop: '8px', marginBottom: '3px' }}>
            Evaluating Your Answer
          </h1>
          <p style={{ fontWeight: 400, fontSize: '12.5px', lineHeight: '16px', color: '#6B7280', textAlign: 'center', margin: 0 }}>
            Analyzing with UPSC examiner&apos;s lens · Usually takes 30-60 seconds
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mt-2 mb-1 px-4 py-2 bg-red-50 border border-red-200 rounded-[10px] text-red-700 text-center" style={{ fontSize: '13px' }}>
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
        <div className="flex flex-col gap-0" style={{ marginTop: 8, marginBottom: 8 }}>
          {STEPS.map((step, idx) => {
            const done = isStepDone(step);
            const active = isStepActive(step, idx);
            return (
              <div key={step.id}>
                <div className="flex items-center justify-between" style={{ padding: '7px 0', opacity: done || active ? 1 : 0.6, transition: 'opacity 0.4s' }}>
                  <div className="flex items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      style={{
                        width: '32px', height: '32px', borderRadius: '10px', background: step.bg,
                        display: 'grid', placeItems: 'center', fontSize: '15px', flexShrink: 0,
                      }}
                    >
                      <span className={step.key === 'feedback' && active ? 'bulb-grow' : undefined}>{step.emoji}</span>
                    </span>
                    <p style={{ fontWeight: 600, fontSize: '13px', lineHeight: '17px', color: '#0B1020', margin: 0 }}>{step.title}</p>
                  </div>
                  <div className="flex items-center">
                    {done ? <CheckIcon /> : active ? <SpinnerIcon /> : (
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #E6E8EE' }} />
                    )}
                  </div>
                </div>
                {idx < STEPS.length - 1 && <div style={{ width: '100%', height: '1px', background: '#E6E8EE' }} />}
              </div>
            );
          })}
        </div>

        {/* Bottom yellow card */}
        <div style={{ borderRadius: '12px', borderLeft: '4px solid #F5B800', background: '#FEFCE8', padding: '12px 16px', textAlign: 'center' }}>
          <div className="flex items-center justify-center gap-2.5" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: '15px' }} aria-hidden="true">⏳</span>
            <span style={{ fontWeight: 700, fontSize: '14px', lineHeight: '16px', color: '#0B1020' }}>
              {secondsRemaining > 0 ? `${secondsRemaining} seconds remaining` : 'Almost done...'}
            </span>
          </div>

          <div style={{ height: '5px', borderRadius: '99px', background: '#E5E7EB', overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ height: '100%', width: `${progressPercent}%`, borderRadius: '99px', background: 'linear-gradient(90deg,#0B1020,#F5B800)', transition: 'width 0.5s ease' }} />
          </div>

          <p style={{ fontSize: '12px', lineHeight: '1.5', color: '#0B1020', margin: 0 }}>
            <strong>While you wait:</strong> In the actual exam, this is the time you&apos;d spend reviewing your answer.
          </p>
        </div>
      </div>
    </div>
  );
}
