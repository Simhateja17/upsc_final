'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { dailyAnswerService, mainsEvaluatorService } from '@/lib/services';
import MainsResultsView, { MainsQuestionResultData } from '@/components/mains-results/MainsResultsView';

/**
 * Daily Mains Challenge results — thin wrapper around the shared
 * MainsResultsView (also used by PYQ Mains and Mock Test Mains). Handles the
 * Daily-specific data loading: attemptId from sessionStorage, optional
 * ?date= history lookups, and the standalone Mains Evaluator (?source=custom).
 */
function ResultsPageInner() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');
  const isCustom = searchParams.get('source') === 'custom';

  const [data, setData] = useState<MainsQuestionResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  useEffect(() => {
    if (dateParam) return;
    if (typeof window !== 'undefined') {
      const storedAttemptId = isCustom
        ? sessionStorage.getItem('mainsEvaluatorAttemptId')
        : sessionStorage.getItem('dailyAnswerAttemptId');
      if (storedAttemptId) setAttemptId(storedAttemptId);
    }
  }, [dateParam, isCustom]);

  useEffect(() => {
    let cancelled = false;
    if (isCustom && !attemptId) return () => { cancelled = true; };
    setLoading(true);
    setError(null);

    const request = isCustom
      ? attemptId
        ? mainsEvaluatorService.getResults(attemptId)
        : Promise.reject(new Error('No standalone Mains evaluation session found. Please submit again.'))
      : dailyAnswerService.getResults(dateParam ? undefined : attemptId || undefined, dateParam || undefined);

    request
      .then((res) => {
        if (cancelled) return;
        setData(res.data);
        if (!dateParam && typeof window !== 'undefined') {
          sessionStorage.removeItem(isCustom ? 'mainsEvaluatorAttemptId' : 'dailyAnswerAttemptId');
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
  }, [attemptId, dateParam, isCustom]);

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
          <Link href="/dashboard/daily-answer" className="text-blue-600 hover:underline">Back to Daily Answer</Link>
        </div>
      </div>
    );
  }

  const rewriteRoute = isCustom ? '/dashboard/mains-answer-evaluator' : '/dashboard/daily-answer/challenge';

  return (
    <MainsResultsView
      results={[data]}
      shareHeading={isCustom ? 'MAINS ANSWER EVALUATION' : 'DAILY MAINS CHALLENGE'}
      rewriteRoute={rewriteRoute}
      backRoute="/dashboard/daily-answer"
    />
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F6F8' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    }>
      <ResultsPageInner />
    </Suspense>
  );
}
