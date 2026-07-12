'use client';

import { mainsEvaluatorService } from '@/lib/services';
import MainsEvaluatingScreen from '@/components/mains-results/MainsEvaluatingScreen';

/**
 * Standalone Mains Answer Evaluator "evaluating" screen. Runs on its own route
 * (no longer piggybacks on /daily-answer/challenge) and polls the dedicated
 * /mains-evaluator endpoints via mainsEvaluatorService.
 */
export default function MainsEvaluatorEvaluatingPage() {
  return (
    <MainsEvaluatingScreen
      attemptIdKey="mainsEvaluatorAttemptId"
      evalStartKey="mainsEvaluatorEvalStart"
      service={mainsEvaluatorService}
      resultsRoute="/dashboard/mains-answer-evaluator/results"
      backRoute="/dashboard/mains-answer-evaluator"
    />
  );
}
