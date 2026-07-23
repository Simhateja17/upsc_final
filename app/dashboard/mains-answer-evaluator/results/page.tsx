'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { mainsEvaluatorService } from '@/lib/services';
import MainsResultsView, { MainsQuestionResultData } from '@/components/mains-results/MainsResultsView';

/**
 * Standalone Mains Answer Evaluator results — thin wrapper around the shared
 * MainsResultsView. Loads the attempt from sessionStorage and hits the
 * dedicated /mains-evaluator/results endpoint. Runs on its own route instead
 * of the old /daily-answer/challenge/attempt/results?source=custom.
 */
function MainsEvaluatorResultsInner() {
  const [data, setData] = useState<MainsQuestionResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('mainsEvaluatorAttemptId');
      if (stored) setAttemptId(stored);
      else setError('No standalone Mains evaluation session found. Please submit again.');
    }
  }, []);

  useEffect(() => {
    if (!attemptId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    mainsEvaluatorService
      .getResults(attemptId)
      .then((res) => {
        if (cancelled) return;
        setData(res.data);
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('mainsEvaluatorAttemptId');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Could not load results');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F6F8' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F6F8' }}>
        <div className="text-center px-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Could not load results</h2>
          <p className="text-gray-500 mb-4">{error || 'Please try again in a moment.'}</p>
          <Link href="/dashboard/mains-answer-evaluator" className="text-blue-600 hover:underline">Back to Mains Answer Evaluator</Link>
        </div>
      </div>
    );
  }

  return (
    <MainsResultsView
      results={[data]}
      shareHeading="MAINS ANSWER EVALUATION"
      rewriteRoute="/dashboard/mains-answer-evaluator"
      backRoute="/dashboard/mains-answer-evaluator"
    />
  );
}

export default function MainsEvaluatorResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F6F8' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    }>
      <MainsEvaluatorResultsInner />
    </Suspense>
  );
}
