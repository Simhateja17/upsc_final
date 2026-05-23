import prelimsSyllabus from './prelimsSyllabus.json';
import type { Subject } from './syllabusData';

type CsvSubSubject = {
  label: string;
  topics: string[];
};

type CsvSubject = {
  subject: string;
  subSubjects: CsvSubSubject[];
};

const SUBJECT_META: Record<string, Omit<Subject, 'id' | 'name' | 'short' | 'topics'>> = {
  history: {
    icon: '🏛️',
    color: '#e07b39',
    bg: 'rgba(224,123,57,.11)',
  },
  geography: {
    icon: '🌍',
    color: '#2e7dd4',
    bg: 'rgba(46,125,212,.10)',
  },
  polity: {
    icon: '⚖️',
    color: '#7c3aed',
    bg: 'rgba(124,58,237,.09)',
  },
  economy: {
    icon: '💰',
    color: '#059669',
    bg: 'rgba(5,150,105,.09)',
  },
  'environment-ecology': {
    icon: '🌿',
    color: '#16a34a',
    bg: 'rgba(22,163,74,.10)',
  },
  'science-technology': {
    icon: '🔬',
    color: '#0891b2',
    bg: 'rgba(8,145,178,.10)',
  },
};

const SHORT_LABELS: Record<string, string> = {
  history: 'History',
  geography: 'Geog.',
  polity: 'Polity',
  economy: 'Economy',
  'environment-ecology': 'Env.',
  'science-technology': 'S&T',
};

function subjectId(subject: string) {
  return subject
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const PRELIMS_CSV_SUBJECTS: Subject[] = (prelimsSyllabus as CsvSubject[]).map((item) => {
  const id = subjectId(item.subject);
  const meta = SUBJECT_META[id] ?? {
    icon: '📚',
    color: '#0f1f3d',
    bg: 'rgba(15,31,61,.08)',
  };

  return {
    id,
    name: item.subject,
    short: SHORT_LABELS[id] ?? item.subject,
    ...meta,
    topics: item.subSubjects.map((subSubject) => ({
      name: subSubject.label,
      subs: subSubject.topics,
    })),
  };
});
