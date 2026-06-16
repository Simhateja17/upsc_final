// Shared constants, types and helpers for the Spaced Repetition pages
// (step 1: subject grid — page.tsx, step 2: questions list — [subjectId]/page.tsx).

export type SpacedRepItem = {
  id: string;
  questionText: string;
  answer?: string;
  source: string;
  sourceType: string;
  subject: string;
  scheduleDay: number;
  scheduleDays?: number[] | null;
  remindEnabled: boolean;
  addedToFlashcard: boolean;
  nextReviewAt: string;
};

export const SUBJECT_LABEL_TO_ID: Record<string, string> = {
  'Polity': 'polity',
  'History': 'history',
  'Geography': 'geography',
  'Economy': 'economy',
  'Environment & Ecology': 'environment-ecology',
  'Science & Technology': 'science-technology',
  'Current Affairs': 'current-affairs',
  'Society': 'society',
  'Governance': 'governance',
  'International Relations': 'international-relations',
  'Social Justice': 'social-justice',
  'Agriculture': 'agriculture',
  'Internal Security': 'internal-security',
  'Disaster Management': 'disaster-management',
  'Ethics': 'ethics',
  'GS1': 'gs1',
  'GS2': 'gs2',
  'GS3': 'gs3',
  'GS4': 'gs4',
  'Essay': 'essay',
  'Optional Paper 1': 'optional-paper-1',
  'Optional Paper 2': 'optional-paper-2',
};

export function subjectLabelToId(label: string): string {
  return SUBJECT_LABEL_TO_ID[label] ?? label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export const filterOptions = ['All', 'mcq', 'mains', 'pyq', 'custom'];
export const scheduleOptions = [3, 7, 15, 30];
export const difficultyOptions = ['Easy', 'Medium', 'Hard', 'Tricky'];

export const subjectOptions = [
  { id: 'polity', label: 'Polity', icon: '🏛️' },
  { id: 'history', label: 'History', icon: '🏺' },
  { id: 'geography', label: 'Geography', icon: '🌍' },
  { id: 'economy', label: 'Economy', icon: '💰' },
  { id: 'environment-ecology', label: 'Environment & Ecology', icon: '🌿' },
  { id: 'science-technology', label: 'Science & Technology', icon: '🔬' },
  { id: 'current-affairs', label: 'Current Affairs', icon: '📰' },
  { id: 'society', label: 'Society', icon: '👥' },
  { id: 'governance', label: 'Governance', icon: '🏢' },
  { id: 'international-relations', label: 'International Relations', icon: '🌐' },
  { id: 'social-justice', label: 'Social Justice', icon: '⚖️' },
  { id: 'agriculture', label: 'Agriculture', icon: '🌾' },
  { id: 'internal-security', label: 'Internal Security', icon: '🛡️' },
  { id: 'disaster-management', label: 'Disaster Management', icon: '🚨' },
  { id: 'ethics', label: 'Ethics', icon: '📘' },
  { id: 'gs1', label: 'GS1', icon: '1️⃣' },
  { id: 'gs2', label: 'GS2', icon: '2️⃣' },
  { id: 'gs3', label: 'GS3', icon: '3️⃣' },
  { id: 'gs4', label: 'GS4', icon: '4️⃣' },
  { id: 'essay', label: 'Essay', icon: '✍️' },
  { id: 'optional-paper-1', label: 'Optional Paper 1', icon: '📗' },
  { id: 'optional-paper-2', label: 'Optional Paper 2', icon: '📕' },
];

export function sourceColor(sourceType: string): string {
  if (sourceType === 'mcq') return '#F54900';
  if (sourceType === 'pyq') return '#9810FA';
  return '#155DFC';
}

export function subjectBg(subject: string): string {
  const map: Record<string, string> = {
    Polity: '#FDF0DE',
    History: '#FFF8EE',
    Geography: 'rgba(201, 168, 76, 0.19)',
    Economy: 'linear-gradient(139deg, #F3EFFD 0%, #EDE7FB 100%)',
    'Environment & Ecology': 'linear-gradient(139deg, #EDF9F3 0%, #E0F5EA 100%)',
    'Science & Technology': 'linear-gradient(139deg, #E0EBF9 0%, #D4E4F7 100%)',
    'Current Affairs': 'linear-gradient(139deg, #FFF1E8 0%, #FFE6D5 100%)',
    Ethics: 'linear-gradient(139deg, #EEF0FF 0%, #E0E3FF 100%)',
    Society: '#FCE7F3',
    Governance: '#E0E7FF',
    'International Relations': '#F3E8FF',
    'Social Justice': '#FDF2F8',
    Agriculture: '#D8F0CC',
    'Internal Security': '#FFE4E6',
    'Disaster Management': '#FEF9C3',
    GS1: '#FDF0DE',
    GS2: '#FFF8EE',
    GS3: 'linear-gradient(139deg, #F3EFFD 0%, #EDE7FB 100%)',
    GS4: 'linear-gradient(139deg, #EDF9F3 0%, #E0F5EA 100%)',
    Essay: '#FCE7F3',
    'Optional Paper 1': '#E0E7FF',
    'Optional Paper 2': '#F3E8FF',
  };
  return map[subject] ?? '#F3F4F6';
}

export type SubjectHealth = { id: string; label: string; shortLabel?: string; icon: string; border: string; bar: string };

// Subjects shown in the "Choose a Subject" health grid (matches the dashboard subject set).
export const SUBJECT_HEALTH: SubjectHealth[] = [
  { id: 'polity', label: 'Polity', icon: '🏛️', border: '#C0D9F5', bar: '#E9A12D' },
  { id: 'geography', label: 'Geography', icon: '🌍', border: '#B2EDD0', bar: '#D5A53C' },
  { id: 'history', label: 'History', icon: '📜', border: '#FFD5A8', bar: '#E8B164' },
  { id: 'economy', label: 'Economy', icon: '📈', border: '#E8E1FD', bar: '#F16CB0' },
  { id: 'environment-ecology', label: 'Environment & Ecology', shortLabel: 'Environment', icon: '🌿', border: '#B2EDD0', bar: '#D6A437' },
  { id: 'science-technology', label: 'Science & Technology', shortLabel: 'Science', icon: '🔬', border: '#C0D9F5', bar: '#E0A446' },
  { id: 'current-affairs', label: 'Current Affairs', icon: '📰', border: '#FFD1AA', bar: '#F39A3C' },
  { id: 'ethics', label: 'Ethics', icon: '📘', border: '#C4C9F8', bar: '#4F46E5' },
];

export function subjectHealthById(id: string): SubjectHealth | undefined {
  return SUBJECT_HEALTH.find((s) => s.id === id);
}

// Keywords used to match a subject card against analytics subject-accuracy rows.
const ACCURACY_KEYS: Record<string, string[]> = {
  polity: ['polity'],
  geography: ['geography', 'geo'],
  history: ['history'],
  economy: ['economy', 'economic'],
  'environment-ecology': ['environment', 'ecology'],
  'science-technology': ['science', 'technology'],
  'current-affairs': ['current'],
  ethics: ['ethics'],
};

export function resolveAccuracy(map: Record<string, number>, card: { id: string; label: string }): number {
  const tokens = ACCURACY_KEYS[card.id] ?? [card.label.toLowerCase()];
  const direct = map[card.label.toLowerCase()];
  if (Number.isFinite(direct)) return Math.round(direct);
  for (const key of Object.keys(map)) {
    if (tokens.some((token) => key.includes(token))) return Math.round(map[key]);
  }
  return 0;
}

export function strengthMeta(pct: number): { word: string; status: string; color: string } {
  if (pct <= 0) return { word: 'no data', status: '◷ Start revising', color: '#6A7282' };
  if (pct >= 75) return { word: 'strong', status: '✓ Excellent', color: '#0E8A56' };
  if (pct >= 65) return { word: 'good', status: '→ Maintain', color: '#0E8A56' };
  if (pct >= 50) return { word: 'mid', status: '⚡ Moderate', color: '#D97706' };
  return { word: 'weak', status: '⚠ Needs work', color: '#E02424' };
}

export function isSameLocalDate(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function normalizeScheduleDays(item: Pick<SpacedRepItem, 'scheduleDay' | 'scheduleDays'>) {
  const days = Array.isArray(item.scheduleDays) && item.scheduleDays.length > 0
    ? item.scheduleDays
    : [item.scheduleDay];

  return Array.from(new Set(days.filter((day): day is number => Number.isFinite(day) && day > 0))).sort((a, b) => a - b);
}

export type ReviewTone = 'overdue' | 'today' | 'upcoming';

export type ReviewInfo = {
  tone: ReviewTone;
  nextLabel: string;
  nextColor: string;
  chipText: string;
  chipBg: string;
  chipColor: string;
  accent: string;
  icon: string;
};

// Derives the "Next Review" column + status chip + row accent from an item's nextReviewAt.
export function reviewInfo(nextReviewAt: string): ReviewInfo {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const reviewStart = new Date(nextReviewAt);
  reviewStart.setHours(0, 0, 0, 0);
  const diffDays = Math.round((reviewStart.getTime() - start.getTime()) / 86400000);

  if (Number.isNaN(diffDays) || diffDays < 0) {
    const d = Number.isNaN(diffDays) ? 0 : Math.abs(diffDays);
    return {
      tone: 'overdue',
      nextLabel: 'OVERDUE',
      nextColor: '#E7000B',
      chipText: d <= 0 ? 'Overdue' : `${d} day${d === 1 ? '' : 's'} overdue`,
      chipBg: '#FEF2F2',
      chipColor: '#E7000B',
      accent: '#EF4444',
      icon: '⏰',
    };
  }
  if (diffDays === 0) {
    return {
      tone: 'today',
      nextLabel: 'Today',
      nextColor: '#D08700',
      chipText: 'Due today',
      chipBg: '#FEFCE8',
      chipColor: '#A16207',
      accent: '#F0AE00',
      icon: '⚡',
    };
  }
  return {
    tone: 'upcoming',
    nextLabel: diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`,
    nextColor: '#00A63E',
    chipText: diffDays === 1 ? 'In 1 day' : `In ${diffDays} days`,
    chipBg: '#F0FDF4',
    chipColor: '#00A63E',
    accent: '#00C950',
    icon: '📅',
  };
}

export const FREE_QUESTION_LIMIT = 10;

export const MODAL_SUBJECTS = [
  { id: 'polity', icon: '🏛️', label: 'Polity' },
  { id: 'geography', icon: '🌍', label: 'Geography' },
  { id: 'history', icon: '📜', label: 'History' },
  { id: 'economy', icon: '📈', label: 'Economy' },
  { id: 'environment-ecology', icon: '🌿', label: 'Environment' },
  { id: 'science-technology', icon: '🔬', label: 'Science' },
  { id: 'current-affairs', icon: '📰', label: 'Current Affairs' },
  { id: 'ethics', icon: '⚖️', label: 'Ethics' },
  { id: 'gs1', icon: '1️⃣', label: 'GS1' },
  { id: 'gs2', icon: '2️⃣', label: 'GS2' },
  { id: 'gs3', icon: '3️⃣', label: 'GS3' },
  { id: 'gs4', icon: '4️⃣', label: 'GS4' },
  { id: 'essay', icon: '✍️', label: 'Essay' },
  { id: 'optional-paper-1', icon: '📗', label: 'Optional Paper 1' },
  { id: 'optional-paper-2', icon: '📕', label: 'Optional Paper 2' },
];

export const MODAL_TYPE_OPTIONS = [
  { id: 'custom', label: 'Custom', icon: '✏️' },
  { id: 'mcq', label: 'MCQ', icon: '📚' },
  { id: 'mains', label: 'Mains', icon: '✍️' },
  { id: 'pyq', label: 'PYQ', icon: '📖' },
];

export const MODAL_SCHEDULE_OPTIONS = [
  { id: 'tomorrow', label: 'Tomorrow', icon: '⚡', days: 1 },
  { id: '3days', label: 'In 3 days', icon: '📅', days: 3 },
  { id: '7days', label: 'In 7 days', icon: '📅', days: 7 },
  { id: 'custom', label: 'Custom date', icon: '🗓️', days: null as number | null },
];

export type ModalScheduleId = 'tomorrow' | '3days' | '7days' | 'custom';

export function scheduleToDays(schedule: ModalScheduleId, customDays: string): number[] {
  if (schedule === 'tomorrow') return [1];
  if (schedule === '3days') return [3];
  if (schedule === '7days') return [7];
  const n = parseInt(customDays, 10);
  return [Number.isFinite(n) && n > 0 ? n : 3];
}

export function sourceTypeToLabel(sourceType: string): string {
  const map: Record<string, string> = { custom: 'Custom', mcq: 'MCQ', mains: 'Mains', pyq: 'PYQ' };
  return map[sourceType] ?? 'Custom';
}
