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
    color: '#C49A6C',
    bg: 'rgba(196,154,108,.12)',
  },
  geography: {
    icon: '🌍',
    color: '#5B9BD5',
    bg: 'rgba(91,155,213,.12)',
  },
  polity: {
    icon: '⚖️',
    color: '#4A68B0',
    bg: 'rgba(74,104,176,.12)',
  },
  economy: {
    icon: '💰',
    color: '#E6A817',
    bg: 'rgba(230,168,23,.12)',
  },
  'environment-ecology': {
    icon: '🌿',
    color: '#6DBF8A',
    bg: 'rgba(109,191,138,.12)',
  },
  'science-technology': {
    icon: '🔬',
    color: '#8B6FC4',
    bg: 'rgba(139,111,196,.12)',
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
