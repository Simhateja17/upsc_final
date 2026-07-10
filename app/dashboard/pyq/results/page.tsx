'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { pyqService } from '@/lib/services';
import MainsResultsView, { MainsQuestionResultData } from '@/components/mains-results/MainsResultsView';

const SESSION_KEY = 'pyqMainsResultsSession';

/**
 * PYQ Mains results — same experience as the Daily Mains Challenge results
 * page, rendered by the shared MainsResultsView. The PYQ practice page stores
 * { questionId, attemptId } in sessionStorage when an evaluation completes and
 * redirects here; ?questionId=&attemptId= query params work as a fallback so
 * the page survives a refresh.
 */
function PyqResultsInner() {
  const searchParams = useSearchParams();

  const [data, setData] = useState<MainsQuestionResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        let questionId = searchParams.get('questionId');
        let attemptId = searchParams.get('attemptId');
        if ((!questionId || !attemptId) && typeof window !== 'undefined') {
          const raw = sessionStorage.getItem(SESSION_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as { questionId?: string; attemptId?: string };
            questionId = questionId || parsed.questionId || null;
            attemptId = attemptId || parsed.attemptId || null;
          }
        }
        if (!questionId || !attemptId) {
          throw new Error('No PYQ evaluation session found. Please attempt a question again.');
        }

        const res = await pyqService.getMainsResults(questionId, attemptId);
        if (cancelled) return;
        if (!res.data) throw new Error('No results data returned.');
        setData(res.data);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Could not load results');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [searchParams]);

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
          <Link href="/dashboard/pyq" className="text-blue-600 hover:underline">Back to PYQ Practice</Link>
        </div>
      </div>
    );
  }

  return (
    <MainsResultsView
      results={[data]}
      shareHeading="PYQ MAINS PRACTICE"
      rewriteRoute="/dashboard/pyq"
      backRoute="/dashboard/pyq"
      breadcrumbLabel="PYQ Result"
    />
  );
}

export default function PyqResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F6F8' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    }>
      <PyqResultsInner />
    </Suspense>
  );
}
