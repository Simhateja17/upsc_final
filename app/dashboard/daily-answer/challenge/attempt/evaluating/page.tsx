'use client';

import { dailyAnswerService } from '@/lib/services';
import MainsEvaluatingScreen from '@/components/mains-results/MainsEvaluatingScreen';

/**
 * Daily Mains Challenge "evaluating" screen — thin wrapper around the shared
 * MainsEvaluatingScreen. The standalone Mains Answer Evaluator now has its own
 * route (/dashboard/mains-answer-evaluator/evaluating) instead of borrowing
 * this one via ?source=custom.
 */
export default function EvaluatingPage() {
  return (
    <MainsEvaluatingScreen
      attemptIdKey="dailyAnswerAttemptId"
      evalStartKey="dailyAnswerEvalStart"
      service={dailyAnswerService}
      resultsRoute="/dashboard/daily-answer/challenge/attempt/results"
      backRoute="/dashboard/daily-answer/challenge/attempt"
    />
  );
}
