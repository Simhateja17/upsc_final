// Canonical UPSC subject list with stable emoji icons used across the app.
// Restricted to the 6 subjects from the official Prelims syllabus CSV.

export const UPSC_SUBJECTS = [
  { id: 'history', label: 'History', emoji: '📜', bg: '#FEF3C7', border: '#FDE68A', color: '#B45309' },
  { id: 'geography', label: 'Geography', emoji: '🌍', bg: '#DBEAFE', border: '#BFDBFE', color: '#1D4ED8' },
  { id: 'polity', label: 'Polity', emoji: '⚖️', bg: '#EDE9FE', border: '#DDD6FE', color: '#7C3AED' },
  { id: 'economy', label: 'Economy', emoji: '💰', bg: '#FFF7ED', border: '#FED7AA', color: '#EA580C' },
  { id: 'environment', label: 'Environment & Ecology', emoji: '🌿', bg: '#F0FDF4', border: '#BBF7D0', color: '#16A34A' },
  { id: 'science-tech', label: 'Science & Technology', emoji: '🔬', bg: '#DBEAFE', border: '#BFDBFE', color: '#0369A1' },
] as const;

export const UPSC_SUBJECT_IDS = UPSC_SUBJECTS.map((s) => s.id);

export function getSubjectMeta(labelOrId: string) {
  const s = UPSC_SUBJECTS.find(
    (x) => x.id === labelOrId.toLowerCase() || x.label.toLowerCase() === labelOrId.toLowerCase()
  );
  return s;
}
