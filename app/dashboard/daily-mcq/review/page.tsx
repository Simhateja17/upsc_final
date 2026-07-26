'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { dailyMcqService } from '@/lib/services';
import QuestionReviewView, { ReviewQuestion, ReviewFilter, isReviewFilter } from '@/components/mcq-review/QuestionReviewView';

function QuestionReviewInner() {
  const searchParams = useSearchParams();
  // Allow deep-linking straight to the weak (wrong) questions, e.g. from the
  // "Review Weak Areas" button on the results page: /review?filter=wrong
  const requestedFilter = searchParams.get('filter');
  const attemptId = searchParams.get('attemptId') || undefined;
  const initialFilter: ReviewFilter = isReviewFilter(requestedFilter) ? requestedFilter : 'all';

  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dailyMcqService.getReview(attemptId)
      .then(res => setQuestions(res.data?.questions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex flex-col overflow-hidden" style={{ height: '100vh', background: '#FAFBFE' }}>
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </main>
      </div>
    );
  }

  return (
    <QuestionReviewView
      questions={questions}
      backHref={`/dashboard/daily-mcq/results${attemptId ? `?attemptId=${encodeURIComponent(attemptId)}` : ''}`}
      nextStepsHref="/dashboard/daily-mcq/next-steps"
      bookmarkSource="Daily MCQ Review"
      spacedRepSource="Daily MCQ Review"
      spacedRepSourceType="daily-mcq"
      initialFilter={initialFilter}
    />
  );
}

export default function QuestionReviewPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col overflow-hidden" style={{ height: '100vh', background: '#FAFBFE' }}>
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </main>
      </div>
    }>
      <QuestionReviewInner />
    </Suspense>
  );
}
