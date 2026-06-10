'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { mockTestService } from '@/lib/services';

const EVAL_STEPS = [
  'Reading your handwritten answers',
  'Identifying key points & arguments',
  'Comparing with model answers',
  'Preparing detailed markup & feedback',
  "Generating Jeet Sir's analysis",
];

function EvaluatingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const testId = searchParams.get('testId');
  const title = searchParams.get('title') || 'Mains Practice';

  const [elapsed, setElapsed] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [progressPct, setProgressPct] = useState(8);
  const [attemptIds, setAttemptIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigatedRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxRetriesRef = useRef(0);

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

  /* ── Elapsed counter ── */
  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  /* ── Simulate visual progress (steps + bar) while waiting ── */
  useEffect(() => {
    if (navigatedRef.current) return;
    const step = Math.min(EVAL_STEPS.length - 1, Math.floor(elapsed / 10));
    setActiveStep(step);
    setProgressPct(prev => Math.max(prev, Math.min(92, 8 + elapsed * 1.4)));
  }, [elapsed]);

  /* ── Poll API ── */
  const poll = useCallback(async () => {
    if (!testId || !attemptIds.length || navigatedRef.current) return;
    maxRetriesRef.current += 1;

    try {
      let doneCount = 0;
      for (const id of attemptIds) {
        const res = await mockTestService.getMainsEvaluationStatus(testId, id);
        if (res.data?.isComplete) doneCount += 1;
      }

      if (doneCount > 0) {
        const realPct = Math.round((doneCount / attemptIds.length) * 100);
        setProgressPct(prev => Math.max(prev, realPct));
        setActiveStep(Math.min(EVAL_STEPS.length - 1, Math.round((doneCount / attemptIds.length) * (EVAL_STEPS.length - 1))));
      }

      if (doneCount === attemptIds.length && !navigatedRef.current) {
        navigatedRef.current = true;
        if (pollRef.current) clearInterval(pollRef.current);
        setProgressPct(100);
        setActiveStep(EVAL_STEPS.length - 1);
        setTimeout(() => {
          router.push(
            `/dashboard/mock-tests/attempt/results?testId=${testId}&examMode=mains&title=${encodeURIComponent(title)}`
          );
        }, 700);
      }

      if (maxRetriesRef.current > 80) {
        setError('Evaluation is taking longer than expected. Redirecting to results...');
        if (pollRef.current) clearInterval(pollRef.current);
        setTimeout(() => {
          router.push(
            `/dashboard/mock-tests/attempt/results?testId=${testId}&examMode=mains&title=${encodeURIComponent(title)}`
          );
        }, 2000);
      }
    } catch {
      /* transient error — keep polling */
    }
  }, [testId, attemptIds, title, router]);

  useEffect(() => {
    if (!attemptIds.length) return;
    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [attemptIds, poll]);

  /* ── Safety fallback: if no attemptIds loaded after 5s, navigate to results ── */
  useEffect(() => {
    if (elapsed > 5 && !attemptIds.length && !navigatedRef.current && testId) {
      navigatedRef.current = true;
      router.push(
        `/dashboard/mock-tests/attempt/results?testId=${testId}&examMode=mains&title=${encodeURIComponent(title)}`
      );
    }
  }, [elapsed, attemptIds.length, testId, title, router]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(154deg, #1D293D 0%, #0F172B 50%, #162456 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
        padding: 24,
        boxSizing: 'border-box' as const,
      }}
    >
      <div
        style={{
          width: 'min(600px, calc(100vw - 40px))',
          display: 'flex',
          flexDirection: 'column' as const,
          alignItems: 'center',
        }}
      >
        {/* Brain icon */}
        <div style={{ fontSize: 56, lineHeight: '60px', marginBottom: 22 }}>🧠</div>

        {/* Heading */}
        <h2 style={{ margin: 0, color: '#FFFFFF', fontSize: 'clamp(22px, 3vw, 28px)', lineHeight: '36px', fontWeight: 800, textAlign: 'center' }}>
          AI is evaluating your answers...
        </h2>
        <p style={{ margin: '10px 0 36px', color: '#BEDBFF', fontSize: 15, lineHeight: '22px', textAlign: 'center' }}>
          This usually takes about 30 seconds
        </p>

        {/* Progress bar */}
        <div style={{ width: 'min(420px, 100%)', height: 8, borderRadius: 999, background: '#314158', overflow: 'hidden', marginBottom: 32 }}>
          <div
            style={{
              width: `${Math.min(100, Math.max(8, progressPct))}%`,
              height: '100%',
              borderRadius: 999,
              background: 'linear-gradient(90deg, #FDC700 0%, #FF6900 100%)',
              transition: 'width 0.5s ease',
            }}
          />
        </div>

        {/* Steps */}
        <div style={{ width: 'min(420px, 100%)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {EVAL_STEPS.map((label, idx) => {
            const isDone = idx < activeStep;
            const isActive = idx === activeStep;
            const isHighlighted = isDone || isActive;
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: isHighlighted ? '#FDC700' : '#314158',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'background 0.3s ease',
                  }}
                >
                  {isHighlighted && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M3 6.1L5.05 8.15L9 4.2" stroke="#162033" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span
                  style={{
                    color: isHighlighted ? '#FDC700' : '#6A7282',
                    fontSize: 14,
                    lineHeight: '20px',
                    fontWeight: isHighlighted ? 600 : 400,
                    transition: 'color 0.3s ease',
                  }}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Error banner */}
        {error && (
          <div
            style={{
              marginTop: 28,
              padding: '12px 16px',
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10,
              color: '#FCA5A5',
              fontSize: 13,
              textAlign: 'center',
              width: '100%',
              boxSizing: 'border-box' as const,
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MockTestEvaluatingPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'linear-gradient(154deg, #1D293D 0%, #0F172B 50%, #162456 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '4px solid rgba(255,255,255,0.15)', borderTopColor: '#FDC700', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <EvaluatingInner />
    </Suspense>
  );
}
