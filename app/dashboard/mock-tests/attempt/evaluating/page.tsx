'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { mockTestService } from '@/lib/services';

const STEPS = [
  { id: 1, emoji: '🔍', bg: '#E0F2FE', title: 'Uploading Answer Script', subtitle: 'Scanning and processing your handwritten answer', key: 'upload' },
  { id: 2, emoji: '📝', bg: '#FEF3C7', title: 'Structural Analysis', subtitle: 'Checking introduction-body-conclusion flow', key: 'structural' },
  { id: 3, emoji: '📚', bg: '#DBEAFE', title: 'Content Depth Assessment', subtitle: 'Evaluating conceptual clarity and dimensions', key: 'content' },
  { id: 4, emoji: '⚖️', bg: '#FCE7F3', title: 'Balance & Perspective Check', subtitle: 'Ensuring multi-dimensional viewpoint', key: 'balance' },
  { id: 5, emoji: '📊', bg: '#DCFCE7', title: 'Fact & Example Validation', subtitle: 'Cross-referencing with latest data', key: 'fact' },
  { id: 6, emoji: '🎯', bg: '#EDE9FE', title: '6-Pillar Rubric Scoring', subtitle: 'Direct   Demand   Structure   Substantiation', key: 'scoring' },
  { id: 7, emoji: '💡', bg: '#FEF9C3', title: 'Preparing Personalised Feedback', subtitle: 'Crafting actionable insights tailored to your answer', key: 'feedback' },
];

const CheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="11" stroke="#22C55E" strokeWidth="2" fill="none" />
    <path d="M7 12.5L10.5 16L17 9" stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SpinnerIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-spin">
    <circle cx="12" cy="12" r="10" stroke="#D1D5DB" strokeWidth="2.5" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="#17223E" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const MIN_DISPLAY_SECONDS = 60;
const ESTIMATED_SECONDS = 60;

function EvaluatingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const testId = searchParams.get('testId');
  const title = searchParams.get('title') || 'Mains Practice';

  const [elapsed, setElapsed] = useState(() => {
    if (typeof window === 'undefined' || !testId) return 0;
    const stored = sessionStorage.getItem(`evalStart:${testId}`);
    if (stored) {
      const diff = Math.floor((Date.now() - Number(stored)) / 1000);
      return Math.max(0, diff);
    }
    sessionStorage.setItem(`evalStart:${testId}`, String(Date.now()));
    return 0;
  });
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [attemptIds, setAttemptIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const navigatedRef = useRef(false);
  const resultsReadyRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxRetriesRef = useRef(0);
  const elapsedRef = useRef(0);

  const resultsUrl = useCallback(
    () => `/dashboard/mock-tests/attempt/results?testId=${testId}&examMode=mains&title=${encodeURIComponent(title)}`,
    [testId, title]
  );

  const navigateToResults = useCallback(() => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    if (pollRef.current) clearInterval(pollRef.current);
    if (testId) sessionStorage.removeItem(`evalStart:${testId}`);
    router.push(resultsUrl());
  }, [router, resultsUrl, testId]);

  // Keep elapsedRef in sync so the timer effect can read the latest value
  useEffect(() => { elapsedRef.current = elapsed; }, [elapsed]);

  /* ── Persist eval start time & hydrate elapsed on testId change ── */
  useEffect(() => {
    if (!testId) return;
    const key = `evalStart:${testId}`;
    const stored = sessionStorage.getItem(key);
    if (stored) {
      const diff = Math.floor((Date.now() - Number(stored)) / 1000);
      if (diff > 0) setElapsed(Math.max(0, diff));
    } else {
      sessionStorage.setItem(key, String(Date.now()));
    }
  }, [testId]);

  /* ── Read attemptIds from sessionStorage ── */
  useEffect(() => {
    if (!testId || typeof window === 'undefined') return;
    try {
      const stored = sessionStorage.getItem(`mockTestMainsAttempts:${testId}`);
      if (stored) {
        const data = JSON.parse(stored);
        setAttemptIds(data.attemptIds || []);
      }
    } catch {}
  }, [testId]);

  /* ── Poll all attempts; mark results ready when every question is evaluated ── */
  const poll = useCallback(async () => {
    if (!testId || !attemptIds.length || navigatedRef.current) return;
    maxRetriesRef.current += 1;
    try {
      let doneCount = 0;
      for (const id of attemptIds) {
        const res = await mockTestService.getMainsEvaluationStatus(testId, id);
        if (res.data?.isComplete) doneCount += 1;
      }

      if (doneCount === attemptIds.length) {
        resultsReadyRef.current = true;
        // Honour the minimum display time so the animation never feels rushed.
        if (elapsedRef.current >= MIN_DISPLAY_SECONDS) navigateToResults();
      }

      // Safety: after ~4 minutes, give up and open results anyway.
      if (maxRetriesRef.current > 80 && !navigatedRef.current) {
        setError('Evaluation is taking longer than expected. Redirecting to results...');
        if (pollRef.current) clearInterval(pollRef.current);
        setTimeout(navigateToResults, 2000);
      }
    } catch {
      /* transient error — keep polling */
    }
  }, [testId, attemptIds, navigateToResults]);

  useEffect(() => {
    if (!attemptIds.length) return;
    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [attemptIds, poll]);

  /* ── Elapsed timer: navigate once min wait is reached and results are in ── */
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= MIN_DISPLAY_SECONDS && resultsReadyRef.current && !navigatedRef.current) {
          navigatedRef.current = true;
          if (pollRef.current) clearInterval(pollRef.current);
          router.push(resultsUrl());
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [router, resultsUrl]);

  /* ── Safety fallback: if no attemptIds loaded after 5s, go straight to results ── */
  useEffect(() => {
    if (elapsed > 5 && !attemptIds.length && !navigatedRef.current && testId) {
      navigateToResults();
    }
  }, [elapsed, attemptIds.length, testId, navigateToResults]);

  /* ── Time-driven step ticks: each step gets an equal slice of MIN_DISPLAY_SECONDS ── */
  const STEP_INTERVAL = MIN_DISPLAY_SECONDS / STEPS.length;
  useEffect(() => {
    const stepsToComplete = Math.min(STEPS.length, Math.floor(elapsed / STEP_INTERVAL));
    setCompletedSteps(STEPS.slice(0, stepsToComplete).map((s) => s.key));
  }, [elapsed, STEP_INTERVAL]);

  const secondsRemaining = Math.max(0, ESTIMATED_SECONDS - elapsed);
  const progressPercent = Math.min(100, (elapsed / ESTIMATED_SECONDS) * 100);

  const isStepDone = (step: typeof STEPS[0]) => completedSteps.includes(step.key);
  const isStepActive = (step: typeof STEPS[0], idx: number) => {
    if (isStepDone(step)) return false;
    if (idx === 0) return !isStepDone(step);
    return isStepDone(STEPS[idx - 1]) && !isStepDone(step);
  };

  return (
    <div className="h-full overflow-hidden flex items-center justify-center font-arimo" style={{ background: '#FAFBFE' }}>
      <div
        className="relative flex flex-col px-6 py-4 sm:px-8"
        style={{
          width: '100%',
          maxWidth: '620px',
          maxHeight: 'calc(100vh - 80px)',
          borderRadius: '16px',
          background: '#FFFFFF',
          boxShadow: '0px 8px 10px -6px #0000001A, 0px 20px 25px -5px #0000001A',
        }}
      >
        {/* Header */}
        <div className="flex flex-col items-center" style={{ marginBottom: 8 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/eval-header.png" alt="Evaluating" style={{ width: '36px', height: '36px', objectFit: 'contain', marginBottom: '4px' }} />
          <h1 style={{ fontFamily: 'Arimo', fontWeight: 700, fontSize: '20px', lineHeight: '26px', color: '#1E2939', textAlign: 'center', marginBottom: '2px' }}>
            Evaluating Your Answers
          </h1>
          <p style={{ fontFamily: 'Arimo', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: '#4A5565', textAlign: 'center', margin: 0 }}>
            Analyzing with UPSC examiner&apos;s lens · Usually takes 30-60 seconds
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-2 px-4 py-2 bg-red-50 border border-red-200 rounded-[10px] text-red-700 text-center" style={{ fontSize: '13px' }}>
            {error}
            <div className="mt-2">
              <button onClick={() => router.push(resultsUrl())} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                View Results
              </button>
            </div>
          </div>
        )}

        {/* Steps */}
        <div className="flex flex-col gap-0" style={{ marginBottom: 8 }}>
          {STEPS.map((step, idx) => {
            const done = isStepDone(step);
            const active = isStepActive(step, idx);
            return (
              <div key={step.id}>
                <div className="flex items-center justify-between" style={{ padding: '6px 0' }}>
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      style={{
                        width: '28px', height: '28px', borderRadius: '8px', background: step.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
                        opacity: done || active ? 1 : 0.4, transition: 'opacity 0.4s', flexShrink: 0,
                      }}
                    >
                      <span className={step.key === 'feedback' && active ? 'bulb-grow' : undefined}>{step.emoji}</span>
                    </span>
                    <div>
                      <p style={{ fontFamily: 'Arimo', fontWeight: 700, fontSize: '13px', lineHeight: '17px', color: '#17223E', margin: 0 }}>{step.title}</p>
                      <p style={{ fontFamily: 'Arimo', fontWeight: 400, fontSize: '11px', lineHeight: '14px', color: '#6A7282', margin: 0 }}>{step.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {done ? <CheckIcon /> : active ? <SpinnerIcon /> : (
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #D1D5DB' }} />
                    )}
                  </div>
                </div>
                {idx < STEPS.length - 1 && <div style={{ width: '100%', height: '1px', background: '#E5E7EB' }} />}
              </div>
            );
          })}
        </div>

        {/* Bottom yellow card */}
        <div style={{ borderRadius: '10px', borderLeft: '4px solid #FDC700', background: '#FEFCE8', padding: '10px 16px' }}>
          <div className="flex items-center justify-center gap-2" style={{ marginBottom: 4 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/eval-timer.png" alt="Timer" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />
            <span style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '12px', lineHeight: '16px', color: '#101828' }}>
              {secondsRemaining > 0 ? `${secondsRemaining} Seconds Remaining` : 'Almost done...'}
            </span>
          </div>

          <div className="mx-auto" style={{ width: '100%', maxWidth: '362px', height: '4px', borderRadius: '10px', background: '#D9D9D9', overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ height: '100%', width: `${progressPercent}%`, borderRadius: '10px', background: '#101828', transition: 'width 1s linear' }} />
          </div>

          <p className="text-center" style={{ fontFamily: 'Arimo', fontSize: '11px', lineHeight: '16px', color: '#364153', margin: '0 0 2px' }}>
            <strong>While you wait:</strong> In the actual exam, this is the time you&apos;d spend reviewing your answers.
          </p>

          <p className="text-center" style={{ fontFamily: 'Arimo', fontWeight: 400, fontStyle: 'italic', fontSize: '10px', lineHeight: '14px', color: '#6A7282', margin: 0 }}>
            &quot;Consistency matters more than perfection. You&apos;re building a skill that compounds.&quot;
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MockTestEvaluatingPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center" style={{ background: '#FAFBFE' }}>
        <div style={{ width: 40, height: 40, border: '4px solid rgba(23,34,62,0.15)', borderTopColor: '#17223E', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <EvaluatingInner />
    </Suspense>
  );
}
