'use client';

import React from 'react';
import { getSubjectEmoji } from '@/lib/subjectEmojis';

/**
 * Shared subject dropdown used by the Dashboard "Add Task" quick-add and the
 * Study Planner "Quick Add to Plan" form, so both modules stay identical.
 *
 * This is the single source of truth for the subject list, order, icons,
 * option labels and the select styling. Underlying option *values* stay
 * canonical (e.g. "GS1", "Environment & Ecology") so task creation / planning
 * logic and the backend contract are unchanged - only the display changes.
 */

// Complete study-planner subject list - mirrors VALID_STUDY_PLANNER_SUBJECTS on
// the backend so custom tasks offer every subject (not just the 6 core ones).
export const STUDY_TASK_SUBJECTS = [
  'Polity',
  'History',
  'Geography',
  'Economy',
  'Environment & Ecology',
  'Science & Technology',
  'Current Affairs',
  'Society',
  'Governance',
  'International Relations',
  'Social Justice',
  'Internal Security',
  'Disaster Management',
  'Ethics',
  'GS1',
  'GS2',
  'GS3',
  'GS4',
  'Essay',
  'Optional Paper 1',
  'Optional Paper 2',
];

// Display-only labels for the GS Paper subjects. The stored values (GS1..GS4)
// are kept unchanged - only how they read in the dropdown changes.
const GS_PAPER_LABELS: Record<string, string> = {
  GS1: 'GS Paper I',
  GS2: 'GS Paper II',
  GS3: 'GS Paper III',
  GS4: 'GS Paper IV',
};

// Short display label for a subject value. Subject values sent to/from the
// backend stay canonical (e.g. "Environment & Ecology"); this only shortens
// what's shown in the UI.
export function displaySubjectLabel(subject: string): string {
  return subject === 'Environment & Ecology' ? 'Environment' : subject;
}

// Icon + label shown for one subject option. Every subject is prefixed with its
// icon; GS papers additionally get their renamed Roman-numeral label.
export function subjectOptionLabel(subject: string): string {
  return `${getSubjectEmoji(subject)} ${GS_PAPER_LABELS[subject] ?? displaySubjectLabel(subject)}`;
}

export const SUBJECT_SELECT_CLASS =
  'w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#f5b400] focus:outline-none transition-colors text-sm bg-white';

export interface SubjectSelectProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  name?: string;
  className?: string;
  'aria-label'?: string;
}

export default function SubjectSelect({
  value,
  onChange,
  id,
  name,
  className = SUBJECT_SELECT_CLASS,
  'aria-label': ariaLabel,
}: SubjectSelectProps) {
  return (
    <select
      id={id}
      name={name}
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      <option value="">Select Subject</option>
      {STUDY_TASK_SUBJECTS.map((s) => (
        <option key={s} value={s}>
          {subjectOptionLabel(s)}
        </option>
      ))}
    </select>
  );
}
