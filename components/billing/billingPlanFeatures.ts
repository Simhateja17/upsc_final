import type { PlanTier } from '@/contexts/EntitlementsContext';

/**
 * "Included in {Plan}" checklist copy for the My Plan & Billing tab.
 * Rise list matches the Figma design verbatim. Aspire/Ascent are best-effort,
 * tier-scaled equivalents (not covered by the provided Figma frames) and may
 * need designer review.
 */
export const PLAN_INCLUDED_FEATURES: Partial<Record<PlanTier, string[]>> = {
  aspire: [
    '5 Mains Evaluations / day',
    'Mock Tests - Limited access',
    'Daily News Analysis - Hindu & IE',
    '10,000+ Previous Year Questions',
    'Jeet AI - 10 conversations / day',
    'Daily MCQ Challenge - 10 questions',
    'Study Planner & Time Tracker',
    'Revision Suite - Limited access',
    'Performance Analytics - Limited view',
    'Test Analytics - Limited view',
    'Syllabus Tracker - Basic access',
    'Daily Leaderboard & Discussion Forum',
    'Live Study Room',
    'Mental Health Buddy',
  ],
  rise: [
    '25 Mains Evaluations / day',
    '25 Mock Test attempts / day',
    'Daily News Analysis - Hindu & IE',
    '10,000+ Previous Year Questions',
    'Jeet AI - 100 conversations / day',
    'Daily MCQ Challenge - 10 questions',
    'Study Planner & Time Tracker',
    'Full Revision Suite - Flashcards, Mindmaps, Spaced Rep.',
    'Full Performance Analytics Dashboard',
    'Test Analytics - Deep insights',
    'Syllabus Tracker - Full access',
    'Daily Leaderboard & Discussion Forum',
    'Live Study Room 24×7',
    'Mental Health Buddy',
  ],
  ascent: [
    'Unlimited Mains Evaluations',
    'Unlimited Mock Test attempts',
    'Daily News Analysis - Hindu & IE',
    '10,000+ Previous Year Questions',
    'Jeet AI - Unlimited conversations',
    'Daily MCQ Challenge - 10 questions',
    'Study Planner & Time Tracker',
    'Full Revision Suite - Flashcards, Mindmaps, Spaced Rep.',
    'Full Performance Analytics Dashboard',
    'Test Analytics - Deep insights',
    'Syllabus Tracker - Full access',
    'Daily Leaderboard & Discussion Forum',
    'Live Study Room 24×7',
    'Mental Health Buddy',
    'Bi-Weekly 1-on-1 Mentorship Sessions',
    'Personalised Study Roadmap',
  ],
};

/** Static copy for the Cancel Subscription modal's "you will lose" list — matches Figma, not tier-dynamic. */
export const CANCELLATION_LOSSES = [
  'Unlimited Jeet AI Chats',
  'Unlimited AI Mains Evaluations',
  'Priority Answer Review',
  'Mental Health Buddy',
  'Unlimited Mock Tests',
];
