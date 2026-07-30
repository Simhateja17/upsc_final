/**
 * UPSC Mains marking & timing pattern - mirrors upsc_backend/src/utils/mainsPattern.ts.
 * Keep the two in sync: the limit the student is shown must be the limit the
 * examiner grades against.
 *
 *   10 marker → ~150 words → ~7 min
 *   15 marker → ~250 words → ~11 min
 *   20 marker → ~250 words → ~14 min
 *   Essay (125 marker) → 1000–1200 words → 90 min
 */

export interface MainsPatternRow {
  marks: number;
  words: number;
  minutes: number;
}

export const MAINS_PATTERN: MainsPatternRow[] = [
  { marks: 10, words: 150, minutes: 7 },
  { marks: 15, words: 250, minutes: 11 },
  { marks: 20, words: 250, minutes: 14 },
  { marks: 125, words: 1100, minutes: 90 },
];

/** Marks threshold at and above which a question is treated as an Essay, not a GS answer. */
const ESSAY_MARKS_THRESHOLD = 100;

/** Expected answer length, in words, for a question worth `marks`. */
export function mainsWordLimit(marks: number): number {
  if (marks >= ESSAY_MARKS_THRESHOLD) return 1100;
  if (marks >= 15) return 250;
  if (marks >= 10) return 150;
  return Math.max(80, Math.round(marks * 15));
}

/** Suggested time budget, in minutes, for a question worth `marks`. */
export function mainsTimeLimit(marks: number): number {
  if (marks >= ESSAY_MARKS_THRESHOLD) return 90;
  if (marks >= 20) return 14;
  if (marks >= 15) return 11;
  if (marks >= 10) return 7;
  return Math.max(4, Math.round(marks * 0.7));
}

export const WORD_LIMIT_OVER_TOLERANCE = 1.1;
export const WORD_LIMIT_UNDER_TOLERANCE = 0.7;

export type WordCountStatus = 'within' | 'over' | 'under';

export function wordCountStatus(wordCount: number, marks: number): WordCountStatus {
  const limit = mainsWordLimit(marks);
  if (wordCount > limit * WORD_LIMIT_OVER_TOLERANCE) return 'over';
  if (wordCount < limit * WORD_LIMIT_UNDER_TOLERANCE) return 'under';
  return 'within';
}

export function mainsWordRange(marks: number): { limit: number; min: number; max: number } {
  const limit = mainsWordLimit(marks);
  if (marks >= ESSAY_MARKS_THRESHOLD) {
    return { limit, min: 1000, max: 1200 };
  }
  return {
    limit,
    min: Math.round(limit * WORD_LIMIT_UNDER_TOLERANCE),
    max: Math.round(limit * WORD_LIMIT_OVER_TOLERANCE),
  };
}

/**
 * Strip a trailing "(N marks)" annotation from question text. The marks are
 * already shown separately as a badge next to the question, so leaving this
 * in the text duplicates it - inconsistently, since only some source
 * questions carry the annotation.
 */
export function stripMarksSuffix(text: string): string {
  return text.replace(/\s*\(\s*\d+\s*marks?\s*\)\s*$/i, '').trim();
}

/** Presentation helper for the results-page word-count chip. */
export function wordCountChip(wordCount: number, marks: number): {
  status: WordCountStatus;
  limit: number;
  label: string;
  icon: string;
  bg: string;
  color: string;
} {
  const status = wordCountStatus(wordCount, marks);
  const limit = mainsWordLimit(marks);
  if (status === 'over') {
    const over = Math.round((wordCount / limit - 1) * 100);
    return {
      status, limit,
      label: `Words: ${wordCount} / ${limit} · ${over}% over limit`,
      icon: '⚠', bg: '#FFF1E0', color: '#B45309',
    };
  }
  if (status === 'under') {
    return {
      status, limit,
      label: `Words: ${wordCount} / ${limit} · under length`,
      icon: '⚠', bg: '#FFE9E9', color: '#B91C1C',
    };
  }
  return {
    status, limit,
    label: `Words: ${wordCount} / ${limit}`,
    icon: '✓', bg: '#E8F7F3', color: '#0D9488',
  };
}
