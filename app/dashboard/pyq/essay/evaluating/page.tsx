'use client';

import { useState } from 'react';
import { pyqService } from '@/lib/services';
import MainsEvaluatingScreen, { MainsEvalService } from '@/components/mains-results/MainsEvaluatingScreen';

const RESULTS_SESSION_KEY = 'pyqMainsResultsSession';

/**
 * PYQ Model Answer "evaluating" screen - thin wrapper around the shared
 * MainsEvaluatingScreen, same pattern as the Mains Answer Evaluator and Daily
 * Answer Writing flows. Replaces the old in-page progress modal that used to
 * sit inline in EssayModelAnswerClient. The PYQ status/results endpoints are
 * scoped by questionId, so we recover it from the {questionId, attemptId}
 * session payload the submission step writes before navigating here.
 */
export default function PyqEssayEvaluatingPage() {
  const [questionId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem(RESULTS_SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { questionId?: string };
      return parsed.questionId || null;
    } catch {
      return null;
    }
  });

  const service: MainsEvalService = {
    getEvaluationStatus: (attemptId) =>
      questionId
        ? pyqService.getMainsEvaluationStatus(questionId, attemptId)
        : Promise.resolve({ data: null }),
    getResults: (attemptId) =>
      questionId
        ? pyqService.getMainsResults(questionId, attemptId)
        : Promise.resolve({ data: null }),
  };

  return (
    <MainsEvaluatingScreen
      attemptIdKey="pyqEssayAttemptId"
      evalStartKey="pyqEssayEvalStart"
      service={service}
      resultsRoute="/dashboard/pyq/results"
      backRoute={questionId ? `/dashboard/pyq/essay/${questionId}` : '/dashboard/pyq'}
    />
  );
}
