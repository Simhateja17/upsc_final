// Shared constants, types and helpers for the Spaced Repetition pages
// (step 1: subject grid — page.tsx, step 2: questions list — [subjectId]/page.tsx).

export type SpacedRepItem = {
  id: string;
  questionText: string;
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
    Polity: '#EDE9FE',
    History: '#FEF3C7',
    Geography: '#DBEAFE',
    Economy: '#FFF7ED',
    'Environment & Ecology': '#F0FDF4',
    'Science & Technology': '#DBEAFE',
    'Current Affairs': '#FEE2E2',
    Society: '#FCE7F3',
    Governance: '#E0E7FF',
    'International Relations': '#F3E8FF',
    'Social Justice': '#FDF2F8',
    Agriculture: '#ECFCCB',
    'Internal Security': '#FFE4E6',
    'Disaster Management': '#FEF9C3',
    Ethics: '#F5F3FF',
    GS1: '#DBEAFE',
    GS2: '#EDE9FE',
    GS3: '#FFF7ED',
    GS4: '#F0FDF4',
    Essay: '#FCE7F3',
    'Optional Paper 1': '#E0E7FF',
    'Optional Paper 2': '#F3E8FF',
  };
  return map[subject] ?? '#F3F4F6';
}

export type SubjectHealth = { id: string; label: string; shortLabel?: string; icon: string; border: string; bar: string };

// Subjects shown in the "Choose a Subject" health grid (matches the dashboard subject set).
export const SUBJECT_HEALTH: SubjectHealth[] = [
  { id: 'polity', label: 'Polity', icon: '🏛️', border: '#DDD6FE', bar: '#7C3AED' },
  { id: 'geography', label: 'Geography', icon: '🌍', border: '#BFDBFE', bar: '#2563EB' },
  { id: 'history', label: 'History', icon: '📜', border: '#FDE9B5', bar: '#E8B84B' },
  { id: 'economy', label: 'Economy', icon: '📈', border: '#FED7AA', bar: '#F97316' },
  { id: 'environment-ecology', label: 'Environment & Ecology', shortLabel: 'Environment', icon: '🌿', border: '#BBF7D0', bar: '#16A34A' },
  { id: 'science-technology', label: 'Science & Technology', shortLabel: 'Science', icon: '🔬', border: '#BFDBFE', bar: '#0EA5E9' },
  { id: 'current-affairs', label: 'Current Affairs', icon: '📰', border: '#FECACA', bar: '#EF4444' },
  { id: 'ethics', label: 'Ethics', icon: '📘', border: '#DDD6FE', bar: '#6366F1' },
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
