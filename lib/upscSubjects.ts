import { getSubjectMetaStyle } from './subjectPalette';

// Canonical UPSC subject list with stable emoji icons used across the app.
// Restricted to the 6 subjects from the official Prelims syllabus CSV.

export const UPSC_SUBJECTS = [
  { id: 'history', label: 'History' },
  { id: 'geography', label: 'Geography' },
  { id: 'polity', label: 'Polity' },
  { id: 'economy', label: 'Economy' },
  { id: 'environment', label: 'Environment & Ecology' },
  { id: 'science-tech', label: 'Science & Technology' },
].map((subject) => {
  const style = getSubjectMetaStyle(subject.label);
  return {
    ...subject,
    emoji: style.icon,
    bg: style.bg,
    border: style.border,
    color: style.color,
  };
});

export const UPSC_SUBJECT_IDS = UPSC_SUBJECTS.map((s) => s.id);

export function getSubjectMeta(labelOrId: string) {
  const s = UPSC_SUBJECTS.find(
    (x) => x.id === labelOrId.toLowerCase() || x.label.toLowerCase() === labelOrId.toLowerCase()
  );
  return s;
}
