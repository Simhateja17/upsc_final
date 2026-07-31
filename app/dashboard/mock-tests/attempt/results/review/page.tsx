'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { mockTestService } from '@/lib/services';
import QuestionReviewView, { ReviewQuestion } from '@/components/mcq-review/QuestionReviewView';
import SmartNextStepsModal from '@/components/SmartNextStepsModal';

/* ─────────────────────────────────────────────────────────────
   Prelims Mock Test → Question-wise Review (separate screen).
   Mirrors the Daily MCQ Challenge review flow exactly: it is its
   OWN page (reached via router navigation from the score screen,
   never expanded inline), and it reuses the shared
   QuestionReviewView + SmartNextStepsModal - only the data source
   differs (the Prelims mock test's own questions).
   ───────────────────────────────────────────────────────────── */

function mapMockQuestions(rawQuestions: any[]): ReviewQuestion[] {
  return (rawQuestions || []).map((q: any, i: number) => ({
    id: String(q.id ?? i + 1),
    questionNum: q.questionNum ?? i + 1,
    questionText: q.questionText || q.text || '',
    category: q.subject || 'General',
    difficulty: q.difficulty || '',
    options: (q.options || []).map((o: any) => ({ id: o.id || o.label, text: o.text })),
    correctOption: q.correctOption || q.correct || '',
    explanation: q.explanation ?? null,
    selectedOption: q.selectedOption ?? q.selected ?? null,
    isCorrect: q.isCorrect ?? false,
  }));
}

function mapSampleQuestions(sample: any): ReviewQuestion[] {
  const questions: any[] = sample?.questions || [];
  const selectedOptions: Record<number, string> = sample?.selectedOptions || {};
  return questions.map((q: any, i: number) => {
    const selected = selectedOptions[i] ?? null;
    return {
      id: String(q.id ?? i + 1),
      questionNum: i + 1,
      questionText: q.text || '',
      category: q.subject || 'General',
      difficulty: q.difficulty || '',
      options: (q.options || []).map((o: any) => ({ id: o.label || o.id, text: o.text })),
      correctOption: q.correct || '',
      explanation: q.explanation ?? null,
      selectedOption: selected,
      isCorrect: selected != null && selected === q.correct,
    };
  });
}

function MockReviewInner() {
  const searchParams = useSearchParams();
  const testId = searchParams.get('testId');
  const mode = searchParams.get('mode');
  const title = searchParams.get('title') || 'Prelims Mock Test';

  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNextSteps, setShowNextSteps] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Sample mode (no testId): the attempt screen stashed the local results.
    if (mode === 'sample') {
      try {
        const raw = typeof window !== 'undefined' ? sessionStorage.getItem('mockTestSampleResults') : null;
        if (raw) setQuestions(mapSampleQuestions(JSON.parse(raw)));
      } catch { /* fall through to empty */ }
      setLoading(false);
      return;
    }

    if (!testId) {
      setLoading(false);
      return;
    }

    mockTestService.getResults(testId)
      .then(res => {
        if (cancelled) return;
        setQuestions(mapMockQuestions(res.data?.questions || []));
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [testId, mode]);

  const backHref = mode === 'sample'
    ? `/dashboard/mock-tests/attempt/results?mode=sample&title=${encodeURIComponent(title)}`
    : `/dashboard/mock-tests/attempt/results?testId=${testId ?? ''}`;

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
    <>
      <QuestionReviewView
        questions={questions}
        backHref={backHref}
        backLabel="Back to Results"
        onViewNextSteps={() => setShowNextSteps(true)}
        bookmarkSource="Mock Test Review"
        spacedRepSource="Mock Test Review"
        spacedRepSourceType="mcq"
      />
      <SmartNextStepsModal open={showNextSteps} onClose={() => setShowNextSteps(false)} />
    </>
  );
}

export default function MockTestReviewPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col overflow-hidden" style={{ height: '100vh', background: '#FAFBFE' }}>
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </main>
      </div>
    }>
      <MockReviewInner />
    </Suspense>
  );
}
