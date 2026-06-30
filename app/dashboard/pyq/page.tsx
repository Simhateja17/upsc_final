'use client';

import React, { useState, useEffect, useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import DashboardPageHero from '@/components/DashboardPageHero';
import { pyqService } from '@/lib/services';
import QuestionTextRenderer from '@/components/QuestionTextRenderer';
import StructuredQuestionRenderer from '@/components/StructuredQuestionRenderer';
import prelimsSyllabus from '@/data/syllabus/prelimsSyllabus.json';
import { handleEntitlementError, formatPeriod } from '@/components/entitlements';
import { useEntitlements } from '@/contexts/EntitlementsContext';

const AI_EVAL_STEPS = [
  {
    id: 1,
    emoji: '🔍',
    bg: '#E3F2FD',
    title: 'Uploading Answer Script',
  },
  {
    id: 2,
    emoji: '📝',
    bg: '#FFF9C4',
    title: 'Structural Analysis',
  },
  {
    id: 3,
    emoji: '📚',
    bg: '#C8E6C9',
    title: 'Content Depth Assessment',
  },
  {
    id: 4,
    emoji: '⚖️',
    bg: '#F8BBD0',
    title: 'Balance & Perspective Check',
  },
  {
    id: 5,
    emoji: '📊',
    bg: '#B2DFDB',
    title: 'Fact & Example Validation',
  },
  {
    id: 6,
    emoji: '🎯',
    bg: '#E1BEE7',
    title: '6-Pillar Rubric Scoring',
  },
  {
    id: 7,
    emoji: '💡',
    bg: '#FFECB3',
    title: 'Preparing Personalised Feedback',
  },
];

const PYQ_READING_WINDOW_SECONDS = 15;
const PYQ_QUESTION_FONT = 'var(--font-sora), Inter, sans-serif';

const LATEST_EXAM_YEAR = 2025;
const EARLIEST_EXAM_YEAR = 2011;
const YEAR_OPTIONS = Array.from(
  { length: LATEST_EXAM_YEAR - EARLIEST_EXAM_YEAR + 1 },
  (_, index) => LATEST_EXAM_YEAR - index
);

function formatResetAt(resetAt?: string | null) {
  if (!resetAt) return null;
  const date = new Date(resetAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

type SubjectTreeNode = {
  label: string;
  icon: string;
  children?: Array<{ label: string; microTopics?: string[] }>;
};

type PYQCountData = {
  total: number;
  byPaper?: Array<{ paper: string | null; count: number }>;
  bySubject: Array<{ subject: string | null; count: number }>;
  bySubSubject: Array<{ subject: string | null; subSubject: string | null; count: number }>;
  byTopic: Array<{ subject: string | null; subSubject: string | null; topic: string | null; count: number }>;
};

const EMPTY_COUNTS: PYQCountData = {
  total: 0,
  bySubject: [],
  bySubSubject: [],
  byTopic: [],
};

const SUBJECT_ICONS: Record<string, string> = {
  History: '🏛️',
  Geography: '🌍',
  Polity: '⚖️',
  Economy: '💰',
  'Environment & Ecology': '🌿',
  'Science & Technology': '🔬',
  'Current Affairs': '📰',
};


const countKey = (...parts: Array<string | null | undefined>) =>
  parts.map((part) => (part || '').trim().toLowerCase()).join('||');

const asTextList = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          return item.text || item.feedback || item.comment || item.point || JSON.stringify(item);
        }
        return String(item);
      })
      .filter((item) => item.trim().length > 0);
  }
  if (typeof value === 'string') return value.trim() ? [value] : [];
  if (typeof value === 'object') {
    return Object.entries(value)
      .flatMap(([key, item]) => asTextList(item).map((text) => `${key}: ${text}`))
      .filter(Boolean);
  }
  return [String(value)];
};

const humanizeKey = (key: string) =>
  key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const chipKey = (value: unknown) => String(value || '').trim().toLowerCase();

const questionChips = (q: any, styles: Record<string, React.CSSProperties>) => {
  const seen = new Set<string>();
  const add = (key: string, value: unknown, label: string, styleKey: string) => {
    const text = String(value || '').trim();
    const normalized = chipKey(text);
    if (!text || seen.has(normalized)) return null;
    seen.add(normalized);
    return { key, label, style: styles[styleKey] };
  };

  return [
    q.year > 0 ? { key: 'year', label: `UPSC ${q.year}`, style: styles.year } : null,
    add('subject', q.subject, String(q.subject || '').toUpperCase(), 'subject'),
    add('subSubject', q.subSubject, String(q.subSubject || '').toUpperCase(), 'subSubject'),
    add('topic', q.topic, String(q.topic || '').toUpperCase(), 'topic'),
  ].filter(Boolean) as Array<{ key: string; label: string; style: React.CSSProperties }>;
};

const getExplanationText = (question: any) =>
  question?.explanation ||
  question?.structuredJson?.explanation?.displayText ||
  question?.structuredJson?.explanation?.rawText ||
  '';

function ExplanationRenderer({ question }: { question: any }) {
  const explanation = getExplanationText(question);
  const structured = question?.structuredJson?.explanation?.structured;
  const paragraphFallback = String(explanation || '')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const sections = [
    ['statement_analysis', 'Statement Analysis'],
    ['pair_analysis', 'Pair Analysis'],
    ['option_analysis', 'Option Analysis'],
  ] as const;

  if (!explanation) return null;

  const hasAnalysisSections =
    sections.some(([key]) => Array.isArray(structured?.[key]) && structured[key].length > 0);

  if (!hasAnalysisSections) {
    const paragraphs = Array.isArray(structured?.paragraphs) && structured.paragraphs.length > 0
      ? structured.paragraphs
      : paragraphFallback;
    return (
      <div className="space-y-3">
        {paragraphs.map((paragraph: string, index: number) => (
          <p key={index} style={{ fontSize: '15px', color: '#364153', lineHeight: '26px', whiteSpace: 'pre-wrap' }}>
            {paragraph}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map(([key, title]) => {
        const items = structured?.[key];
        if (!Array.isArray(items) || items.length === 0) return null;
        return (
          <section key={key} className="space-y-2">
            <h4 className="text-[13px] font-bold uppercase tracking-[0.06em]" style={{ color: '#016630' }}>
              {title}
            </h4>
            <div className="space-y-3">
              {items.map((item: string, index: number) => (
                <p key={index} style={{ fontSize: '15px', color: '#364153', lineHeight: '26px', whiteSpace: 'pre-wrap' }}>
                  {item}
                </p>
              ))}
            </div>
          </section>
        );
      })}
      {structured?.conclusion && (
        <section className="rounded-[12px] bg-white/70 p-3" style={{ border: '1px solid #BBF7D0' }}>
          <h4 className="mb-2 text-[13px] font-bold uppercase tracking-[0.06em]" style={{ color: '#016630' }}>
            Conclusion
          </h4>
          <p style={{ fontSize: '15px', color: '#364153', lineHeight: '26px', whiteSpace: 'pre-wrap' }}>
            {structured.conclusion}
          </p>
        </section>
      )}
    </div>
  );
}

const EvalCheckIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" stroke="#22C55E" strokeWidth="2" />
    <path d="M7 12.5L10.4 15.9L17 9.2" stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EvalSpinnerIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    className="animate-spin"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" stroke="#E6E8EE" strokeWidth="2.5" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="#17223E" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

function PyqEvaluationProgressModal({
  progress,
  completedStepCount,
}: {
  progress: number;
  completedStepCount: number;
}) {
  const normalizedProgress = Math.max(0, Math.min(100, progress));
  const secondsRemaining = Math.max(0, Math.ceil(60 - (normalizedProgress / 100) * 60));
  const completedCount = Math.max(0, Math.min(AI_EVAL_STEPS.length, completedStepCount));

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto p-4"
      style={{ background: 'rgba(245,246,248,0.86)', backdropFilter: 'blur(4px)' }}
    >
      <style>{`
        @keyframes pyqBrainBreathe {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(244,143,177,0.30); }
          50% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(244,143,177,0); }
        }
        .pyq-thinking-brain {
          width: 64px;
          height: 64px;
          margin: 0 auto;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(244,143,177,0.15) 0%, transparent 70%);
          animation: pyqBrainBreathe 3s ease-in-out infinite;
        }
      `}</style>
      <div
        className="relative flex w-full max-w-[680px] flex-col px-6 py-5 sm:px-7"
        style={{
          borderRadius: '24px',
          background: '#FFFFFF',
          boxShadow: '0 1px 2px rgba(15,23,42,.04), 0 24px 60px rgba(15,23,42,.16), inset 0 0 0 1px #E6E8EE',
        }}
      >
        <div className="flex flex-col items-center" style={{ marginBottom: 8 }}>
          <div className="pyq-thinking-brain">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9.5 2C7.567 2 6 3.567 6 5.5c0 .536.12 1.044.334 1.5H6c-1.657 0-3 1.343-3 3 0 1.135.63 2.122 1.556 2.625C4.207 13.285 4 14.118 4 15c0 2.21 1.79 4 4 4h1v1a2 2 0 002 2h2a2 2 0 002-2v-1h1c2.21 0 4-1.79 4-4 0-.882-.207-1.715-.556-2.375C20.37 13.122 21 12.135 21 11c0-1.657-1.343-3-3-3h-.334A3.5 3.5 0 0018 5.5C18 3.567 16.433 2 14.5 2c-1.12 0-2.117.527-2.75 1.35C11.117 2.527 10.12 2 9.5 2z" fill="#F48FB1" opacity="0.9" />
              <path d="M12 4v16M9 8h6M10 12h4M9 16h6" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
            </svg>
          </div>
          <h2 style={{ fontFamily: 'var(--font-dm-serif), Merriweather, serif', fontSize: '24px', letterSpacing: '-0.01em', lineHeight: '30px', color: '#0B1020', textAlign: 'center', marginTop: '8px', marginBottom: '3px' }}>
            Evaluating Your Answer
          </h2>
          <p style={{ fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#6B7280', textAlign: 'center', margin: 0 }}>
            Analyzing with UPSC examiner&apos;s lens · Usually takes 30-60 seconds
          </p>
        </div>

        <div className="flex flex-col gap-0" style={{ marginTop: 12, marginBottom: 12 }}>
          {AI_EVAL_STEPS.map((step, idx) => {
            const done = idx < completedCount;
            const active = idx === completedCount;
            return (
              <div key={step.id}>
                <div className="flex items-center justify-between" style={{ padding: '9px 0', opacity: done || active ? 1 : 0.58, transition: 'opacity 0.4s' }}>
                  <div className="flex items-center gap-3">
                    <span
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: step.bg,
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: '16px',
                        flexShrink: 0,
                      }}
                    >
                      {step.emoji}
                    </span>
                    <p style={{ fontWeight: 700, fontSize: '15px', lineHeight: '20px', color: '#0B1020', margin: 0 }}>{step.title}</p>
                  </div>
                  <div className="flex items-center">
                    {done ? <EvalCheckIcon /> : active ? <EvalSpinnerIcon /> : (
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid #E6E8EE' }} />
                    )}
                  </div>
                </div>
                {idx < AI_EVAL_STEPS.length - 1 && <div style={{ width: '100%', height: '1px', background: '#E6E8EE' }} />}
              </div>
            );
          })}
        </div>

        <div style={{ borderRadius: '12px', borderLeft: '4px solid #F5B800', background: '#FEFCE8', padding: '14px 18px', textAlign: 'center' }}>
          <div className="flex items-center justify-center gap-2.5" style={{ marginBottom: 10 }}>
            <span style={{ fontSize: '16px' }} aria-hidden="true">⏳</span>
            <span style={{ fontWeight: 800, fontSize: '16px', lineHeight: '20px', color: '#0B1020' }}>
              {secondsRemaining > 0 ? `${secondsRemaining} seconds remaining` : 'Almost done...'}
            </span>
          </div>

          <div style={{ height: '5px', borderRadius: '99px', background: '#E5E7EB', overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ height: '100%', width: `${normalizedProgress}%`, borderRadius: '99px', background: 'linear-gradient(90deg,#0B1020,#F5B800)', transition: 'width 0.5s ease' }} />
          </div>

          <p style={{ fontSize: '13px', lineHeight: '1.5', color: '#0B1020', margin: 0 }}>
            <strong>While you wait:</strong> In the actual exam, this is the time you&apos;d spend reviewing your answer.
          </p>
        </div>
      </div>
    </div>
  );
}

const PRELIMS_SUBJECT_TREE: SubjectTreeNode[] = [
  ...(prelimsSyllabus as Array<{ subject: string; subSubjects: Array<{ label: string; topics: string[] }> }>).map((node) => ({
    label: node.subject,
    icon: SUBJECT_ICONS[node.subject] || '📘',
    children: node.subSubjects.map((sub) => ({
      label: sub.label,
      microTopics: sub.topics,
    })),
  })),
  {
    label: 'Current Affairs',
    icon: '📰',
    children: [
      {
        label: 'Current Affairs and Miscellaneous',
        microTopics: ['Current Affairs and Miscellaneous'],
      },
    ],
  },
];

const MAINS_OPTIONAL_SUBJECTS = {
  science: [
    'Agriculture',
    'Animal Husbandry & Veterinary Science',
    'Botany',
    'Chemistry',
    'Civil Engineering',
    'Electrical Engineering',
    'Geology',
    'Mathematics',
    'Mechanical Engineering',
    'Medical Science',
    'Physics',
    'Statistics',
    'Zoology',
  ],
  social: [
    'Anthropology',
    'Commerce & Accountancy',
    'Economics',
    'Geography (Optional)',
    'History (Optional)',
    'Law',
    'Management',
    'Philosophy',
    'Political Science & International Relations',
    'Psychology',
    'Public Administration',
    'Sociology',
  ],
  literature: [
    'Literature: Assamese',
    'Literature: Bengali',
    'Literature: Bodo',
    'Literature: Dogri',
    'Literature: English',
    'Literature: Gujarati',
    'Literature: Hindi',
    'Literature: Kannada',
    'Literature: Kashmiri',
    'Literature: Konkani',
    'Literature: Maithili',
    'Literature: Malayalam',
    'Literature: Manipuri',
    'Literature: Marathi',
    'Literature: Nepali',
    'Literature: Odia',
    'Literature: Punjabi',
    'Literature: Sanskrit',
    'Literature: Santhali',
    'Literature: Sindhi',
    'Literature: Tamil',
    'Literature: Telugu',
    'Literature: Urdu',
  ],
};
const MAINS_OPTIONAL_ALL = [
  ...MAINS_OPTIONAL_SUBJECTS.science,
  ...MAINS_OPTIONAL_SUBJECTS.social,
  ...MAINS_OPTIONAL_SUBJECTS.literature,
];

const PYQ_SUBJECT_TREE: Record<'prelims' | 'mains', SubjectTreeNode[]> = {
  prelims: PRELIMS_SUBJECT_TREE,
  mains: [
    { label: 'History', icon: '🏛️', children: [{ label: 'Ancient India' }, { label: 'Medieval India' }, { label: 'Modern India' }, { label: 'Post-Independence' }, { label: 'Art & Culture' }] },
    { label: 'Geography', icon: '🌍', children: [{ label: 'Physical Geography' }, { label: 'Indian Geography' }, { label: 'World Geography' }] },
    { label: 'Polity', icon: '⚖️', children: [{ label: 'Constitution' }, { label: 'Parliament & Executive' }, { label: 'Judiciary' }] },
    { label: 'Economy', icon: '💰', children: [{ label: 'Growth & Development' }, { label: 'Inclusive Development' }, { label: 'Budgeting' }] },
    { label: 'Environment & Ecology', icon: '🌿', children: [{ label: 'Conservation' }, { label: 'Climate Change' }, { label: 'Biodiversity' }] },
    { label: 'Science & Technology', icon: '🔬', children: [{ label: 'Emerging Tech' }, { label: 'Space' }, { label: 'Biotech' }] },
    { label: 'Society', icon: '👥', children: [{ label: 'Social Issues' }, { label: 'Women' }, { label: 'Globalization' }] },
    { label: 'Governance', icon: '🏛', children: [{ label: 'Transparency' }, { label: 'Citizen Centricity' }, { label: 'E-Governance' }] },
    { label: 'International Relations', icon: '🌐', children: [{ label: 'Neighbourhood' }, { label: 'Global Groupings' }, { label: 'Bilateral Relations' }] },
    { label: 'Social Justice', icon: '🤝', children: [{ label: 'Welfare Schemes' }, { label: 'Education' }, { label: 'Health' }] },
    { label: 'Agriculture', icon: '🌾', children: [{ label: 'Cropping' }, { label: 'Irrigation' }, { label: 'Food Processing' }] },
    { label: 'Internal Security', icon: '🛡️', children: [{ label: 'Terrorism' }, { label: 'Cyber Security' }, { label: 'Border Management' }] },
    { label: 'Disaster Management', icon: '🚨', children: [{ label: 'Preparedness' }, { label: 'Response' }, { label: 'Risk Reduction' }] },
    { label: 'Ethics', icon: '🧭', children: [{ label: 'Ethics Theory' }, { label: 'Aptitude' }, { label: 'Case Studies' }] },
    { label: 'Current Affairs', icon: '📰', children: [{ label: 'Government Initiatives' }, { label: 'International Developments' }, { label: 'Reports & Data' }] },
  ],
};

export default function PyqPage() {
  const entitlements = useEntitlements();
  const mainsQuota = entitlements.featureStatus('mains_evaluation');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null);
  const [questionStates, setQuestionStates] = useState<Record<string, { selected: string | null; submitted: boolean }>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showAttemptModal, setShowAttemptModal] = useState(false);
  const [prelimsSubmitError, setPrelimsSubmitError] = useState<string | null>(null);
  const [showMainsWriteModal, setShowMainsWriteModal] = useState(false);
  const [showModelAnswerModal, setShowModelAnswerModal] = useState(false);
  const [showAiEvalModal, setShowAiEvalModal] = useState(false);
  const [showAiEvalCompleteModal, setShowAiEvalCompleteModal] = useState(false);
  const [aiEvalProgress, setAiEvalProgress] = useState(0);
  const [aiEvalStepIndex, setAiEvalStepIndex] = useState(0);
  const [mode, setMode] = useState<'prelims' | 'mains'>('prelims');

  // Mains AI evaluation state
  const [mainsAnswerText, setMainsAnswerText] = useState('');
  const [mainsFile, setMainsFile] = useState<File | null>(null);
  const [mainsFiles, setMainsFiles] = useState<File[]>([]);
  const [mainsAttemptId, setMainsAttemptId] = useState<string | null>(null);
  const [mainsEvalResults, setMainsEvalResults] = useState<any>(null);
  const [mainsSubmitting, setMainsSubmitting] = useState(false);
  const [mainsSubmitError, setMainsSubmitError] = useState<string | null>(null);
  const pageRootRef = useRef<HTMLDivElement>(null);
  const mainsFileInputRef = useRef<HTMLInputElement>(null);
  const MAINS_TIME_LIMIT = 20 * 60; // 20 minutes in seconds
  const [mainsTimeLeft, setMainsTimeLeft] = useState(MAINS_TIME_LIMIT);
  const [mainsTimerPaused, setMainsTimerPaused] = useState(false);
  const [mainsReadTimeLeft, setMainsReadTimeLeft] = useState<number | null>(null);
  const [textAnswerExpanded, setTextAnswerExpanded] = useState(false);
  const mainsAutoSubmitRef = useRef(false);
  const questionsRequestSeqRef = useRef(0);

  // Data state
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [yearMode, setYearMode] = useState<'all' | 'custom'>('all');
  const [yearSearch, setYearSearch] = useState('');
  const [selectedPaper, setSelectedPaper] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState('All Papers');
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [expandedSubtopic, setExpandedSubtopic] = useState<string | null>(null);
  const [questionCounts, setQuestionCounts] = useState<PYQCountData>(EMPTY_COUNTS);
  const [openFilter, setOpenFilter] = useState<'paper' | 'subject' | 'subSubject' | 'topic' | 'year' | 'difficulty' | null>(null);
  const [filterDocked, setFilterDocked] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const fetchQuestions = useCallback(async () => {
    const requestSeq = ++questionsRequestSeqRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await pyqService.getQuestions({
        mode,
        years: yearMode === 'custom' && selectedYears.length > 0 ? selectedYears : undefined,
        paper: selectedPaper || undefined,
        subject: selectedSubject !== 'All Papers' ? selectedSubject : undefined,
        ...(mode === 'mains'
          ? { topic: selectedSubtopic || undefined }
          : { subSubject: selectedSubtopic || undefined }),
        topic: selectedTopics.length ? selectedTopics : undefined,
        page,
        limit: 20,
      });
      if (requestSeq !== questionsRequestSeqRef.current) return;
      if (res.status === 'success') {
        setQuestions(res.data.questions);
        setTotal(res.data.pagination.total);
        setTotalPages(res.data.pagination.totalPages);
      } else {
        setError(res.message || 'Failed to load questions');
        setQuestions([]);
      }
    } catch (e: any) {
      if (requestSeq !== questionsRequestSeqRef.current) return;
      console.error('Failed to fetch PYQ questions:', e);
      setError('Unable to load questions. Please check your connection and try again.');
      setQuestions([]);
    } finally {
      if (requestSeq === questionsRequestSeqRef.current) {
        setLoading(false);
      }
    }
  }, [mode, yearMode, selectedYears, selectedPaper, selectedSubject, selectedSubtopic, selectedTopics, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [mode, yearMode, selectedYears, selectedPaper, selectedSubject, selectedSubtopic, selectedTopics]);

  useEffect(() => {
    questionsRequestSeqRef.current += 1;
    setQuestions([]);
    setTotal(0);
    setTotalPages(0);
    setSelectedQuestion(null);
    setShowMainsWriteModal(false);
    setShowModelAnswerModal(false);
    setShowAttemptModal(false);
    setSelectedPaper(null);
    setSelectedSubject('All Papers');
    setSelectedSubtopic(null);
    setSelectedTopics([]);
    setExpandedSubject(null);
    setExpandedSubtopic(null);
  }, [mode]);

  // Mains writing timer (9-min countdown, auto-submit on expiry)
  useEffect(() => {
    if (!showMainsWriteModal || mainsTimerPaused || mainsReadTimeLeft !== null) return;
    const id = setInterval(() => {
      setMainsTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          if (!mainsAutoSubmitRef.current) {
            mainsAutoSubmitRef.current = true;
            document.getElementById('pyq-mains-submit-btn')?.click();
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [showMainsWriteModal, mainsTimerPaused, mainsReadTimeLeft]);

  useEffect(() => {
    if (!showMainsWriteModal || mainsReadTimeLeft === null) return;

    if (mainsReadTimeLeft <= 0) {
      setMainsReadTimeLeft(null);
      setMainsTimerPaused(false);
      return;
    }

    const timer = setTimeout(() => {
      setMainsReadTimeLeft((prev) => (prev === null ? null : prev - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [showMainsWriteModal, mainsReadTimeLeft]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    let active = true;
    const fetchCounts = async () => {
      try {
        const res = await pyqService.getCounts({
          mode,
          years: yearMode === 'custom' && selectedYears.length > 0 ? selectedYears : undefined,
        });
        if (active && res.status === 'success') {
          setQuestionCounts(res.data || EMPTY_COUNTS);
        }
      } catch (err) {
        console.error('Failed to fetch PYQ counts:', err);
        if (active) setQuestionCounts(EMPTY_COUNTS);
      }
    };

    fetchCounts();
    return () => {
      active = false;
    };
  }, [mode, yearMode, selectedYears]);

  const subjectQuestionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    questionCounts.bySubject.forEach((row) => {
      counts.set(countKey(row.subject), row.count);
    });
    return counts;
  }, [questionCounts.bySubject]);

  const subSubjectQuestionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    questionCounts.bySubSubject.forEach((row) => {
      counts.set(countKey(row.subject, row.subSubject), row.count);
    });
    return counts;
  }, [questionCounts.bySubSubject]);

  const getTopicQuestionCount = useCallback(
    (subject: string, subSubject: string | null, topic: string) => {
      const needle = topic.trim().toLowerCase();
      return questionCounts.byTopic.reduce((sum, row) => {
        const sameSubject = countKey(row.subject) === countKey(subject);
        const sameSubSubject = !subSubject || countKey(row.subSubject) === countKey(subSubject);
        const topicText = (row.topic || '').toLowerCase();
        return sameSubject && sameSubSubject && topicText.includes(needle) ? sum + row.count : sum;
      }, 0);
    },
    [questionCounts.byTopic]
  );

  const subjectTree = useMemo(() => {
    const baseTree = PYQ_SUBJECT_TREE[mode];
    const existingSubjects = new Set(baseTree.map((node) => countKey(node.label)));
    const dynamicSubjects = questionCounts.bySubject
      .filter((row) => row.subject && !existingSubjects.has(countKey(row.subject)))
      .map((row) => {
        const label = row.subject as string;
        const children = questionCounts.bySubSubject
          .filter((sub) => countKey(sub.subject) === countKey(label) && sub.subSubject)
          .map((sub) => {
            const childLabel = sub.subSubject as string;
            const microTopics = questionCounts.byTopic
              .filter((topic) => countKey(topic.subject, topic.subSubject) === countKey(label, childLabel) && topic.topic)
              .map((topic) => topic.topic as string)
              .filter((topic, index, topics) => topics.indexOf(topic) === index);

            return {
              label: childLabel,
              microTopics: microTopics.length ? microTopics : undefined,
            };
          });

        return {
          label,
          icon: SUBJECT_ICONS[label] || '📘',
          children: children.length ? children : undefined,
        };
      });

    return [...baseTree, ...dynamicSubjects];
  }, [mode, questionCounts.bySubject, questionCounts.bySubSubject, questionCounts.byTopic]);

  const visibleQuestions = useMemo(() => {
    if (!selectedTopics.length) return questions;
    const needles = selectedTopics.map((t) => t.trim().toLowerCase());
    return questions.filter((q) => {
      const qt = (q?.topic || '').toLowerCase();
      return needles.some((needle) => qt.includes(needle));
    });
  }, [questions, selectedTopics]);

  useLayoutEffect(() => {
    const scroller = document.querySelector('main');
    if (scroller) {
      scroller.scrollTop = 0;
      scroller.scrollLeft = 0;
    }
    if (pageRootRef.current) {
      pageRootRef.current.scrollTop = 0;
      pageRootRef.current.scrollLeft = 0;
    }
  }, []);

  useEffect(() => {
    const scroller = document.querySelector('main');
    const getScrollTop = () => scroller?.scrollTop ?? window.scrollY ?? 0;
    const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;
    const updateDocked = () => {
      setFilterDocked(isDesktop() && getScrollTop() > 220);
    };

    updateDocked();
    scroller?.addEventListener('scroll', updateDocked, { passive: true });
    window.addEventListener('scroll', updateDocked, { passive: true });
    window.addEventListener('resize', updateDocked);
    return () => {
      scroller?.removeEventListener('scroll', updateDocked);
      window.removeEventListener('scroll', updateDocked);
      window.removeEventListener('resize', updateDocked);
    };
  }, []);

  // When AI eval modal opens: poll backend for real evaluation status
  useEffect(() => {
    if (!showAiEvalModal || !mainsAttemptId || !selectedQuestion) {
      setAiEvalProgress(0);
      setAiEvalStepIndex(0);
      return;
    }
    setShowAiEvalCompleteModal(false);
    setAiEvalStepIndex(0);
    const start = Date.now();

    // Visual progress animation (cosmetic – doesn't block)
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(95, (elapsed / 60000) * 100); // 60s ceiling, cap at 95%
      setAiEvalProgress(pct);
      const step = Math.min(AI_EVAL_STEPS.length - 1, Math.floor((elapsed / 60000) * AI_EVAL_STEPS.length));
      setAiEvalStepIndex(step);
    }, 500);

    // Poll backend every 3s
    const pollInterval = setInterval(async () => {
      try {
        const res = await pyqService.getMainsEvaluationStatus(selectedQuestion.id, mainsAttemptId);
        if (res.data?.evaluationStatus === 'completed' || res.data?.isComplete) {
          clearInterval(pollInterval);
          clearInterval(progressInterval);
          // Fetch full results
          const resultsRes = await pyqService.getMainsResults(selectedQuestion.id, mainsAttemptId);
          if (resultsRes.data) {
            setMainsEvalResults(resultsRes.data);
          }
          setAiEvalProgress(100);
          setAiEvalStepIndex(AI_EVAL_STEPS.length);
          setShowAiEvalModal(false);
          setShowAiEvalCompleteModal(true);
        }
      } catch (err) {
        console.error('Polling eval status failed:', err);
      }
    }, 3000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(pollInterval);
    };
  }, [showAiEvalModal, mainsAttemptId, selectedQuestion]);

  const resetAllFilters = () => {
    setYearMode('all');
    setSelectedYears([]);
    setYearSearch('');
    setSelectedPaper(null);
    setSelectedSubject('All Papers');
    setSelectedSubtopic(null);
    setSelectedTopics([]);
    setExpandedSubject(null);
    setExpandedSubtopic(null);
    setOpenFilter(null);
  };

  const hasActiveFilters =
    yearMode === 'custom' ||
    Boolean(selectedPaper) ||
    selectedSubject !== 'All Papers' ||
    Boolean(selectedSubtopic) ||
    selectedTopics.length > 0;

  const currentSubjectNode = subjectTree.find((node) => node.label === selectedSubject);
  const currentSubTopicNode = currentSubjectNode?.children?.find((child) => child.label === selectedSubtopic);
  const paperCounts = useMemo(() => {
    const counts = new Map<string, number>();
    (questionCounts.byPaper || []).forEach((row) => {
      counts.set(countKey(row.paper), row.count);
    });
    return counts;
  }, [questionCounts.byPaper]);

  const getPaperCount = useCallback(
    (paper: string, aliases: string[] = []) => {
      const keys = [paper, ...aliases].map((value) => countKey(value));
      return keys.reduce((sum, key) => sum + (paperCounts.get(key) || 0), 0);
    },
    [paperCounts]
  );

  const paperOptions = mode === 'prelims'
    ? [
        { label: 'GS Paper 1', value: 'GS Paper 1', icon: '📋', aliases: ['GS-I', 'GS Paper I'] },
        { label: 'CSAT', value: 'CSAT', icon: '🧮', aliases: ['Paper II', 'CSAT Paper II'] },
      ]
    : [
        { label: 'GS Paper 1', value: 'GS Paper 1', icon: '📜', aliases: ['GS-I', 'GS Paper I'] },
        { label: 'GS Paper 2', value: 'GS Paper 2', icon: '⚖️', aliases: ['GS-II', 'GS Paper II'] },
        { label: 'GS Paper 3', value: 'GS Paper 3', icon: '📊', aliases: ['GS-III', 'GS Paper III'] },
        { label: 'GS Paper 4', value: 'GS Paper 4', icon: '🧠', aliases: ['GS-IV', 'GS Paper IV'] },
      ];

  const filterButtonBase =
    'inline-flex h-9 flex-shrink-0 items-center gap-2 rounded-[10px] px-2.5 text-[13px] font-bold text-[#101828] transition-colors hover:bg-[#F4F5F7]';

  const tinyIconStyle: React.CSSProperties = {
    width: 18,
    height: 18,
    color: '#8B919B',
    flexShrink: 0,
  };

  const ExamModeToggle = ({ compact = false }: { compact?: boolean }) => (
    <motion.div
      layoutId="pyq-exam-mode-toggle"
      transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 430, damping: 38 }}
      className="inline-flex items-center bg-white rounded-full overflow-hidden shadow-[0_4px_6px_-4px_rgba(0,0,0,0.1),0_10px_15px_-3px_rgba(0,0,0,0.1)]"
      style={{
        width: 300,
        maxWidth: '100%',
        height: 54,
        borderRadius: 26843500,
        padding: compact ? 4 : 0,
        gap: 0,
      }}
    >
      {(['prelims', 'mains'] as const).map((nextMode) => {
        const active = mode === nextMode;
        const label = nextMode === 'prelims' ? 'Prelims' : 'Mains';
        const icon = nextMode === 'prelims' ? '/9k.png' : '/8k.png';
        return (
          <button
            key={nextMode}
            type="button"
            className="flex flex-1 items-center justify-center"
            style={{
              alignSelf: 'stretch',
              paddingLeft: 20,
              paddingRight: 20,
              background: active ? '#0F172B' : 'transparent',
              gap: 10,
              borderRadius: active ? 9999 : 0,
            }}
            onClick={() => setMode(nextMode)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={icon}
              alt=""
              aria-hidden
              style={{ width: 18, height: 18, objectFit: 'contain', flexShrink: 0 }}
            />
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: 14,
                lineHeight: '20px',
                letterSpacing: 0,
                textAlign: 'center',
                color: active ? '#FFFFFF' : '#4A5565',
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </motion.div>
  );

  const FilterTrigger = ({
    id,
    label,
    value,
    icon,
  }: {
    id: typeof openFilter;
    label: string;
    value?: string;
    icon: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={() => setOpenFilter(openFilter === id ? null : id)}
      className={filterButtonBase}
      style={{ background: openFilter === id ? '#F4F5F7' : 'transparent' }}
      aria-expanded={openFilter === id}
    >
      {icon}
      <span className="whitespace-nowrap">{value || label}</span>
      <span className="text-[#9AA3B2]">⌄</span>
    </button>
  );

  const FilterPopover = ({ id, children, width = 420 }: { id: typeof openFilter; children: React.ReactNode; width?: number }) => (
    openFilter === id ? (
      <div
        className="absolute left-0 top-[calc(100%+10px)] z-50 max-h-[460px] overflow-hidden rounded-[18px] border border-[#E5E7EB] bg-[#F4F5F7] shadow-[0_18px_52px_rgba(15,17,26,0.14)]"
        style={{ width: `min(${width}px, calc(100vw - 48px))` }}
      >
        {children}
      </div>
    ) : null
  );

  const SubjectTreePopover = () => (
    <FilterPopover id="subject" width={520}>
      <div className="max-h-[440px] overflow-y-auto p-5">
        <div className="mb-4 flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div className="text-[15px] font-bold text-[#101828]">Subject Filter</div>
          <button type="button" onClick={() => setOpenFilter(null)} className="h-8 w-8 rounded-[10px] bg-white text-[#6A7282]">×</button>
        </div>
        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedSubject('All Papers');
              setSelectedSubtopic(null);
              setSelectedTopics([]);
              setExpandedSubject(null);
              setExpandedSubtopic(null);
            }}
            className="flex min-h-[50px] items-center justify-between rounded-[12px] px-3 text-left"
            style={{ background: selectedSubject === 'All Papers' ? '#0F1A30' : '#FFFFFF', color: selectedSubject === 'All Papers' ? '#FFFFFF' : '#101828' }}
          >
            <span className="font-semibold">📘 All Papers</span>
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-bold">{questionCounts.total || total}</span>
          </button>
          {mode === 'mains' && (
            <select
              value={MAINS_OPTIONAL_ALL.includes(selectedSubject) ? selectedSubject : ''}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedSubject(val || 'All Papers');
                setSelectedSubtopic(null);
                setSelectedTopics([]);
                setExpandedSubject(null);
                setExpandedSubtopic(null);
              }}
              className="h-11 rounded-[12px] border border-[#E5E7EB] bg-white px-3 text-[13px] font-semibold text-[#374151] outline-none"
            >
              <option value="">Select Optional Subject</option>
              <optgroup label="Science & Engineering">
                {MAINS_OPTIONAL_SUBJECTS.science.map((s) => <option key={s} value={s}>{s}</option>)}
              </optgroup>
              <optgroup label="Social Sciences & Humanities">
                {MAINS_OPTIONAL_SUBJECTS.social.map((s) => <option key={s} value={s}>{s}</option>)}
              </optgroup>
              <optgroup label="Literature">
                {MAINS_OPTIONAL_SUBJECTS.literature.map((s) => <option key={s} value={s}>{s}</option>)}
              </optgroup>
            </select>
          )}
          {subjectTree.map(({ label, icon, children }) => {
            const selected = selectedSubject === label;
            const expanded = expandedSubject === label;
            const subjectCount = subjectQuestionCounts.get(countKey(label)) || 0;
            return (
              <div key={label} className="overflow-hidden rounded-[12px] bg-white">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubject(label);
                    setSelectedSubtopic(null);
                    setSelectedTopics([]);
                    setExpandedSubtopic(null);
                    setExpandedSubject(expanded ? null : label);
                  }}
                  className="flex min-h-[50px] w-full items-center justify-between px-3 text-left"
                  style={{ background: selected ? '#0F1A30' : '#FFFFFF', color: selected ? '#FFFFFF' : '#101828' }}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span aria-hidden>{icon}</span>
                    <span className="truncate text-[14px] font-semibold">{label}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="rounded-full bg-[#F0F1F3] px-2 py-0.5 text-[10px] font-bold text-[#6A7282]">{subjectCount}</span>
                    {children?.length ? <span style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>⌄</span> : null}
                  </span>
                </button>
                {expanded && children?.length ? (
                  <div className="border-t border-[#E5E7EB]">
                    {children.map((child) => (
                      <button
                        key={child.label}
                        type="button"
                        onClick={() => {
                          setSelectedSubtopic(child.label);
                          setSelectedTopics([]);
                          setExpandedSubtopic(expandedSubtopic === child.label ? null : child.label);
                        }}
                        className="flex w-full items-center justify-between border-b border-[#EEF0F4] px-4 py-2.5 text-left last:border-b-0 hover:bg-[#F9FAFB]"
                      >
                        <span className="truncate text-[12px] font-semibold text-[#5A6478]">{child.label}</span>
                        <span className="rounded-full bg-[#EDF0F5] px-1.5 py-0.5 text-[10px] font-bold text-[#9AA3B2]">
                          {subSubjectQuestionCounts.get(countKey(label, child.label)) || 0}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </FilterPopover>
  );

  const FilterToolbar = () => (
    <div className="sticky top-3 z-40 mb-8">
      <div className="relative">
        <div
          className="flex max-w-full items-center gap-1.5 overflow-visible rounded-[14px] border bg-white px-8 py-2 shadow-[0_2px_8px_rgba(15,17,26,0.05),0_12px_36px_rgba(15,17,26,0.07)]"
          style={{ borderColor: '#F3E9C8', scrollbarWidth: 'none' }}
        >
          <div className="relative">
            <FilterTrigger
              id="paper"
              label="Paper"
              value={selectedPaper || 'Paper'}
              icon={<svg style={tinyIconStyle} viewBox="0 0 24 24" fill="none"><path d="M7 3h8l4 4v14H7V3Z" stroke="currentColor" strokeWidth="2"/><path d="M15 3v5h5" stroke="currentColor" strokeWidth="2"/></svg>}
            />
            <FilterPopover id="paper" width={440}>
              <div className="p-5">
                <div className="mb-4 flex items-center justify-between border-b border-[#E5E7EB] pb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-[#0F172B] text-[18px] text-[#D4AF37]">
                      📄
                    </span>
                    <div className="text-[17px] font-bold text-[#101828]">
                      {mode === 'prelims' ? 'Prelims Papers' : 'Mains Papers'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenFilter(null)}
                    className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-white text-[22px] text-[#9AA3B2] shadow-sm"
                  >
                    ×
                  </button>
                </div>
                <div className="mb-3 text-[12px] font-bold uppercase tracking-[0.12em] text-[#9AA3B2]">All Papers</div>
                <div className="grid grid-cols-2 gap-3">
                  {paperOptions.map((paper) => {
                    const selected = selectedPaper === paper.value;
                    const count = getPaperCount(paper.value, paper.aliases);
                    return (
                      <button
                        key={paper.value}
                        type="button"
                        onClick={() => {
                          setSelectedPaper(selected ? null : paper.value);
                          setOpenFilter(null);
                        }}
                        className="flex min-h-[72px] items-center gap-3 rounded-[13px] border bg-white px-3 text-left transition-colors hover:border-[#D4AF37]"
                        style={{
                          borderColor: selected ? '#0F172B' : '#E5E7EB',
                          boxShadow: selected ? '0 0 0 1px #0F172B' : '0 1px 2px rgba(15,17,26,0.04)',
                        }}
                      >
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px] bg-[#FAF7EF] text-[19px]">
                          {paper.icon}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[15px] font-bold leading-5 text-[#101828]">{paper.label}</span>
                          <span className="block text-[12px] font-medium leading-4 text-[#9AA3B2]">
                            {count || 'All'} questions
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                {selectedPaper && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPaper(null);
                      setOpenFilter(null);
                    }}
                    className="mt-4 rounded-full bg-white px-4 py-2 text-[13px] font-bold text-[#6A7282]"
                  >
                    Clear paper
                  </button>
                )}
                {false && (
                  <div className="grid gap-2">
                    {(['prelims', 'mains'] as const).map((nextMode) => (
                    <button
                      key={nextMode}
                      type="button"
                      onClick={() => {
                        setMode(nextMode);
                        setOpenFilter(null);
                      }}
                      className="rounded-[12px] px-4 py-3 text-left text-[14px] font-bold"
                      style={{ background: mode === nextMode ? '#0F172B' : '#FFFFFF', color: mode === nextMode ? '#FFFFFF' : '#101828' }}
                    >
                      {nextMode === 'prelims' ? '◎ Prelims' : '✎ Mains'}
                    </button>
                    ))}
                  </div>
                )}
              </div>
            </FilterPopover>
          </div>

          <div className="relative">
            <FilterTrigger
              id="subject"
              label="Subject"
              value={selectedSubject !== 'All Papers' ? selectedSubject : 'Subject'}
              icon={<svg style={tinyIconStyle} viewBox="0 0 24 24" fill="none"><path d="M6 4h11a2 2 0 0 1 2 2v14H8a3 3 0 0 1-3-3V5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="2"/><path d="M8 17h11" stroke="currentColor" strokeWidth="2"/></svg>}
            />
            <SubjectTreePopover />
          </div>

          <div className="relative">
            <FilterTrigger
              id="subSubject"
              label="Sub-Subject"
              value={selectedSubtopic || 'Sub-Subject'}
              icon={<svg style={tinyIconStyle} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21M12 3c-2.5 2.6-3.8 5.6-3.8 9s1.3 6.4 3.8 9" stroke="currentColor" strokeWidth="1.6"/></svg>}
            />
            <FilterPopover id="subSubject" width={360}>
              <div className="max-h-[360px] overflow-y-auto p-4">
                <div className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-[#9AA3B2]">Sub-Subject</div>
                {!currentSubjectNode?.children?.length ? (
                  <div className="rounded-[12px] bg-white p-4 text-[13px] font-semibold text-[#6A7282]">Choose a subject first.</div>
                ) : (
                  <div className="grid gap-2">
                    {currentSubjectNode.children.map((child) => (
                      <button
                        key={child.label}
                        type="button"
                        onClick={() => {
                          setSelectedSubtopic(child.label);
                          setSelectedTopics([]);
                          setOpenFilter(null);
                        }}
                        className="rounded-[12px] px-4 py-3 text-left text-[13px] font-bold"
                        style={{ background: selectedSubtopic === child.label ? '#0F172B' : '#FFFFFF', color: selectedSubtopic === child.label ? '#FFFFFF' : '#101828' }}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </FilterPopover>
          </div>

          <div className="relative">
            <FilterTrigger
              id="topic"
              label="Topic"
              value={selectedTopics.length ? `${selectedTopics.length} topics` : 'Topic'}
              icon={<svg style={tinyIconStyle} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2"/><path d="m15 9-4.5 1.5L9 15l4.5-1.5L15 9Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>}
            />
            <FilterPopover id="topic" width={420}>
              <div className="max-h-[360px] overflow-y-auto p-4">
                <div className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-[#9AA3B2]">Topic</div>
                {!currentSubTopicNode?.microTopics?.length ? (
                  <div className="rounded-[12px] bg-white p-4 text-[13px] font-semibold text-[#6A7282]">Choose a sub-subject with topics first.</div>
                ) : (
                  <div className="grid gap-1">
                    {currentSubTopicNode.microTopics.map((topic) => {
                      const active = selectedTopics.includes(topic);
                      return (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => {
                            setSelectedTopics((prev) => active ? prev.filter((t) => t !== topic) : [...prev, topic]);
                          }}
                          className="flex items-center justify-between rounded-[10px] px-3 py-2.5 text-left text-[12px] font-bold hover:bg-white"
                          style={{ background: active ? '#FFF3CC' : 'transparent', color: active ? '#B45309' : '#5A6478' }}
                        >
                          <span>{topic}</span>
                          <span className="ml-3 rounded-full bg-[#EDF0F5] px-1.5 py-0.5 text-[10px] text-[#9AA3B2]">
                            {getTopicQuestionCount(selectedSubject, selectedSubtopic, topic)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </FilterPopover>
          </div>

          <div className="h-6 w-px flex-shrink-0 bg-[#E5E7EB]" />

          <div className="relative">
            <FilterTrigger
              id="year"
              label="Year"
              value={yearMode === 'custom' && selectedYears.length ? `${selectedYears.length} years` : 'Year'}
              icon={<svg style={tinyIconStyle} viewBox="0 0 24 24" fill="none"><path d="M7 3v4M17 3v4M4 9h16M5 5h14v15H5V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
            />
            <FilterPopover id="year" width={420}>
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#9AA3B2]">Exam Year</div>
                  <span className="text-[12px] font-semibold text-[#6A7282]">{yearMode === 'custom' ? `${selectedYears.length} selected` : 'All years'}</span>
                </div>
                <div className="mb-3 flex rounded-[10px] bg-[#EDEFF3] p-1">
                  {(['all', 'custom'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setYearMode(m);
                        if (m === 'all') { setSelectedYears([]); setYearSearch(''); }
                      }}
                      className="flex-1 rounded-[8px] py-2 text-[13px] font-bold"
                      style={{ background: yearMode === m ? '#0F172B' : 'transparent', color: yearMode === m ? '#FFFFFF' : '#4A5565' }}
                    >
                      {m === 'all' ? 'All' : 'Custom'}
                    </button>
                  ))}
                </div>
                {yearMode === 'custom' && (
                  <div className="grid gap-3">
                    <input
                      type="text"
                      placeholder="Search year..."
                      value={yearSearch}
                      onChange={(e) => setYearSearch(e.target.value)}
                      className="h-10 rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-[13px] font-semibold outline-none"
                    />
                    <div className="grid grid-cols-5 gap-2">
                      {YEAR_OPTIONS.filter((y) => !yearSearch || String(y).includes(yearSearch)).map((y) => {
                        const active = selectedYears.includes(y);
                        return (
                          <button
                            key={y}
                            type="button"
                            onClick={() => setSelectedYears((prev) => active ? prev.filter((v) => v !== y) : [...prev, y])}
                            className="rounded-[8px] py-2 text-[12px] font-bold"
                            style={{ background: active ? '#0F172B' : '#FFFFFF', color: active ? '#FFFFFF' : '#374151', border: active ? '1px solid #0F172B' : '1px solid #E5E7EB' }}
                          >
                            {y}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </FilterPopover>
          </div>

          <div className="relative">
            <FilterTrigger
              id="difficulty"
              label="Difficulty"
              icon={<svg style={tinyIconStyle} viewBox="0 0 24 24" fill="none"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2 7.5 14 3 9.6l6.2-.9L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>}
            />
            <FilterPopover id="difficulty" width={280}>
              <div className="p-4">
                <div className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-[#9AA3B2]">Difficulty</div>
                <div className="rounded-[12px] bg-white p-4 text-[13px] font-semibold text-[#6A7282]">
                  Difficulty is shown on each question. The live PYQ API does not expose a difficulty filter yet.
                </div>
              </div>
            </FilterPopover>
          </div>

          {filterDocked && (
            <div className="hidden flex-shrink-0 px-1 lg:block">
              <ExamModeToggle compact />
            </div>
          )}

          <div className="ml-auto flex flex-shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={resetAllFilters}
              disabled={!hasActiveFilters}
              className="rounded-[12px] border border-[#E5E7EB] bg-white px-3 py-2 text-[14px] font-semibold text-[#9AA3B2] transition-colors hover:text-[#C10007] disabled:cursor-not-allowed disabled:opacity-60"
            >
              × Clear all
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <LayoutGroup>
    <div
      ref={pageRootRef}
      className="flex min-h-full flex-col items-stretch font-arimo"
      style={{ background: '#F9FAFB' }}
    >
      <DashboardPageHero
        // eslint-disable-next-line @next/next/no-img-element
        badgeIcon={<img src="/badge-pyq.png" alt="pyq" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />}
        badgeText="PREVIOUS YEAR QUESTIONS"
        title={
          <>
            Decode <em className="not-italic" style={{ color: '#E8B84B', fontStyle: 'italic' }}>UPSC</em>
          </>
        }
        subtitle="Explore 6,500+ UPSC Previous Year Questions, organized by subject, topic, and year, with in-depth solutions and detailed explanations."
        stats={[
          { value: '6500+', label: 'PYQs', color: '#E8B84B' },
          { value: '30+', label: 'Years', color: '#F87171' },
          { value: '15+', label: 'Subjects', color: '#4ADE80' },
          { value: '∞', label: 'Unlimited Access', color: '#FFFFFF' },
        ]}
      />

      <div className="w-full max-w-[1400px] mx-auto px-8 lg:px-12 pt-3 pb-4">
        <div className="mb-4 flex w-full justify-center">
          {!filterDocked && <ExamModeToggle />}
        </div>

        <FilterToolbar />

        {/* Content area */}
        <div className="flex flex-col gap-8">
          {/* Questions list */}
          <section className="flex-1 min-w-0 px-2 lg:px-4">
            {mode === 'prelims' ? (
              <>
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                <h3 className="font-bold text-[20px] md:text-[24px] text-[#101828]">
                  Prelims Questions
                  {yearMode === 'custom' && selectedYears.length > 0 ? ` · ${selectedYears.length === 1 ? selectedYears[0] : `${selectedYears.length} years`}` : ''}
                </h3>
                <p className="text-[13px] text-[#6A7282]">
                  {loading ? 'Loading...' : `Showing ${visibleQuestions.length} of ${total} questions`}
                </p>
              </div>

              {/* Breadcrumb trail */}
              <nav aria-label="Filter path" className="flex flex-wrap items-center gap-1.5 mb-4">
                <button
                  type="button"
                  onClick={() => { setSelectedSubject('All Papers'); setSelectedSubtopic(null); setSelectedTopics([]); setExpandedSubject(null); setExpandedSubtopic(null); }}
                  className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold transition-all hover:opacity-80 active:scale-95"
                  style={{ background: selectedSubject === 'All Papers' ? '#0F1A30' : '#EEF2FF', color: selectedSubject === 'All Papers' ? '#FFFFFF' : '#4338CA' }}
                >
                  📘 All Papers
                </button>
                {selectedSubject !== 'All Papers' && (
                  <>
                    <span className="text-[#CBD5E1] text-[14px] font-bold select-none">›</span>
                    <button
                      type="button"
                      onClick={() => { setSelectedSubtopic(null); setSelectedTopics([]); setExpandedSubtopic(null); }}
                      className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold transition-all hover:opacity-80 active:scale-95"
                      style={{ background: !selectedSubtopic ? '#0F1A30' : '#DBEAFE', color: !selectedSubtopic ? '#FFFFFF' : '#1D4ED8' }}
                    >
                      {SUBJECT_ICONS[selectedSubject] ?? '📘'} {selectedSubject}
                    </button>
                  </>
                )}
                {selectedSubtopic && (
                  <>
                    <span className="text-[#CBD5E1] text-[14px] font-bold select-none">›</span>
                    <button
                      type="button"
                      onClick={() => setSelectedTopics([])}
                      className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold transition-all hover:opacity-80 active:scale-95"
                      style={{ background: !selectedTopics[0] ? '#0F1A30' : '#FEF3C7', color: !selectedTopics[0] ? '#FFFFFF' : '#92400E' }}
                    >
                      {selectedSubtopic}
                    </button>
                  </>
                )}
                {selectedTopics[0] && (
                  <>
                    <span className="text-[#CBD5E1] text-[14px] font-bold select-none">›</span>
                    <span
                      className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold"
                      style={{ background: '#0F1A30', color: '#FFFFFF' }}
                    >
                      {selectedTopics[0]}
                    </span>
                  </>
                )}
              </nav>

              {/* Loading skeleton */}
              {loading && (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-[16px] bg-white p-6 mb-4 animate-pulse">
                      <div className="flex gap-2 mb-4"><div className="h-6 w-20 bg-gray-200 rounded-full"/><div className="h-6 w-16 bg-gray-200 rounded-full"/></div>
                      <div className="h-5 w-3/4 bg-gray-200 rounded mb-3"/>
                      <div className="h-4 w-full bg-gray-200 rounded mb-2"/>
                      <div className="h-4 w-5/6 bg-gray-200 rounded"/>
                    </div>
                  ))}
                </div>
              )}

              {/* Dynamic question cards */}
              {!loading && visibleQuestions.map((q, idx) => {
                const opts: { label: string; text: string }[] = Array.isArray(q.options) ? q.options : [];
                const diffColor = q.difficulty === 'Hard'
                  ? { background: '#FFE2E2', color: '#C10007' }
                  : q.difficulty === 'Easy'
                  ? { background: '#DCFCE7', color: '#008236' }
                  : { background: '#FFEDD4', color: '#CA3500' };
                const chips = questionChips(q, {
                  year: { background: '#DBEAFE', color: '#1447E6' },
                  subject: { background: '#E0E7FF', color: '#432DD7' },
                  subSubject: { background: '#E0F2FE', color: '#0369A1' },
                  topic: { background: '#F3E8FF', color: '#7E22CE' },
                });
                const qState = questionStates[q.id] ?? { selected: null, submitted: false };
                const setSelected = (label: string) => {
                  if (qState.submitted) return;
                  setQuestionStates(s => ({ ...s, [q.id]: { ...qState, selected: label } }));
                };
                const submitAnswer = () => {
                  if (!qState.selected) return;
                  setQuestionStates(s => ({ ...s, [q.id]: { ...qState, submitted: true } }));
                };
                const resetAnswer = () => {
                  setQuestionStates(s => ({ ...s, [q.id]: { selected: null, submitted: false } }));
                };
                const publicQuestionHref = `/questions/${encodeURIComponent(q.id)}`;
                return (
                  <div
                    key={q.id}
                    className="rounded-[16px] bg-white shadow-[0_1px_2px_-1px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.1)] mb-6 p-6"
                  >
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {chips.map((chip) => (
                        <span key={chip.key} className="px-3 py-1 rounded-full text-[12px] font-bold" style={chip.style}>
                          {chip.label}
                        </span>
                      ))}
                      <span className="px-3 py-1 rounded-full text-[12px] font-bold" style={diffColor}>
                        {q.difficulty?.toUpperCase()}
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="uppercase mb-2 text-[12px] tracking-[0.02em] text-[#9CA3AF]">
                      PRELIMS · QUESTION #{idx + 1}
                    </div>

                    {/* Question text */}
                    <Link
                      href={publicQuestionHref}
                      className="group block rounded-[12px] outline-none transition hover:bg-[#F8FAFC] focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60"
                      title="Open public question page"
                    >
                      <StructuredQuestionRenderer
                        questionStructure={(q as any).questionStructure}
                        questionText={q.questionText}
                        className="mb-5 text-[18px] font-[500] leading-[1.5] text-[#111827] transition-colors group-hover:text-[#0F4C81]"
                        textClassName="text-[18px] font-[500] leading-[1.5] text-[#111827] transition-colors group-hover:text-[#0F4C81]"
                        textStyle={{ fontFamily: PYQ_QUESTION_FONT }}
                      />
                    </Link>

                    {/* Options — inline interactive (matches Daily MCQ Challenge design) */}
                    {opts.length > 0 && (
                      <div className="mb-4" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                        {opts.map((opt) => {
                          const isSelected = qState.selected === opt.label;
                          const isCorrect = opt.label === q.correctOption;
                          const showCorrect = qState.submitted && isCorrect;
                          const showWrong = qState.submitted && isSelected && !isCorrect;
                          // Default (unselected) state
                          let bg = '#FFFFFF', border = '1px solid #E5E7EB', pipBg = '#F1F4F9', pipColor = '#475067', textColor = '#1E293B', textWeight = 400;
                          if (!qState.submitted && isSelected) {
                            bg = '#0B1426'; border = '1.5px solid #0B1426'; pipBg = '#F5C518'; pipColor = '#0B1426'; textColor = '#FFFFFF'; textWeight = 600;
                          }
                          if (showCorrect) {
                            bg = '#ECFDF5'; border = '1.5px solid #10B981'; pipBg = '#10B981'; pipColor = '#FFFFFF'; textColor = '#065F46'; textWeight = 600;
                          }
                          if (showWrong) {
                            bg = '#FEF2F2'; border = '1.5px solid #F43F5E'; pipBg = '#F43F5E'; pipColor = '#FFFFFF'; textColor = '#9F1239'; textWeight = 600;
                          }
                          return (
                            <button
                              key={opt.label}
                              type="button"
                              disabled={qState.submitted}
                              onClick={() => setSelected(opt.label)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderRadius: 12, minHeight: 50,
                                border, background: bg,
                                cursor: qState.submitted ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.15s ease', width: '100%',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                              }}
                            >
                              <span
                                style={{
                                  width: 30, height: 30, borderRadius: 8, border: 'none',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontWeight: 700, fontSize: 13, color: pipColor, background: pipBg, flexShrink: 0,
                                }}
                              >
                                {opt.label}
                              </span>
                              <span style={{ fontFamily: PYQ_QUESTION_FONT, fontSize: 18, color: textColor, fontWeight: textWeight, whiteSpace: 'pre-wrap', lineHeight: '29.25px' }}>
                                {opt.text}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Submit / Reset */}
                    {!qState.submitted ? (
                      <button
                        type="button"
                        onClick={submitAnswer}
                        disabled={!qState.selected}
                        className="rounded-[12px] px-5 py-2.5 text-[15px] font-semibold transition-colors"
                        style={{
                          background: qState.selected ? '#0F172B' : '#E5E7EB',
                          color: qState.selected ? '#fff' : '#9CA3AF',
                          cursor: qState.selected ? 'pointer' : 'not-allowed',
                        }}
                      >
                        {qState.selected ? 'Submit Answer' : 'Select an option'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={resetAnswer}
                        className="rounded-[12px] px-5 py-2.5 text-[15px] font-semibold"
                        style={{ background: '#F3F4F6', color: '#364153' }}
                      >
                        Try Again
                      </button>
                    )}

                    {/* Explanation inline */}
                    {qState.submitted && getExplanationText(q) && (
                      <div className="mt-4 rounded-[14px] p-4" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                        <div className="flex items-center gap-2 mb-1" style={{ color: '#016630', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase' }}>
                          <span>✅</span><span>Explanation</span>
                        </div>
                        <ExplanationRenderer question={q} />
                        <p className="mt-2" style={{ fontSize: '13px', color: '#6A7282' }}>📖 UPSC CSE Prelims {q.year}</p>
                      </div>
                    )}
                  </div>
                );
              })}

              {!loading && error && (
                <div className="rounded-[16px] bg-red-50 border border-red-200 p-10 text-center">
                  <p className="text-red-600 mb-4">{error}</p>
                  <button
                    onClick={fetchQuestions}
                    className="px-5 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!loading && !error && visibleQuestions.length === 0 && (
                <div className="rounded-[16px] bg-white p-10 text-center text-[#6A7282]">
                  No questions found for the selected filters.
                </div>
              )}

              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-5 py-2.5 rounded-[12px] bg-white shadow text-[15px] font-semibold text-[#0F172B] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-[15px] text-[#6A7282]">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-5 py-2.5 rounded-[12px] bg-white shadow text-[15px] font-semibold text-[#0F172B] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}

              {/* PLACEHOLDER card 3 – kept for UI reference until removed */}
              {false && <div
              className="rounded-[16px] bg-white shadow-[0_1px_2px_-1px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.1)] p-6 mb-6 w-full max-w-[546px] mx-auto"
              style={{ opacity: 1 }}
            >
              {/* Tag row */}
              <div
                className="flex flex-wrap gap-2 mb-5"
                style={{ width: '482px', maxWidth: '100%' }}
              >
                <span
                  className="px-3 py-1 rounded-full text-[12px] font-bold"
                  style={{ background: '#DCFCE7', color: '#008236' }}
                >
                  UPSC 2022
                </span>
                <span
                  className="px-3 py-1 rounded-full text-[12px] font-bold"
                  style={{ background: '#D0FAE5', color: '#007A55' }}
                >
                  ENVIRONMENT
                </span>
                <span
                  className="px-3 py-1 rounded-full text-[12px] font-bold"
                  style={{ background: '#FFEDD4', color: '#CA3500' }}
                >
                  MODERATE
                </span>
              </div>

              {/* Question meta */}
              <div
                className="uppercase mb-2"
                style={{
                  width: '482px',
                  maxWidth: '100%',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  lineHeight: '16px',
                  color: '#6A7282',
                }}
              >
                Prelims · Question #4
              </div>

              {/* Question text */}
              <p
                className="mb-5"
                style={{
                  width: '482px',
                  maxWidth: '100%',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '18px',
                  fontWeight: 400,
                  lineHeight: '29.25px',
                  color: '#101828',
                }}
              >
                Which of the following are recognised as biodiversity hotspots that include Indian territory?
              </p>

              {/* Stem */}
              <div
                className="rounded-[14px] px-4 py-4 mb-5 space-y-2 text-[14px]"
                style={{
                  width: '482px',
                  maxWidth: '100%',
                  background: '#F9FAFB',
                  color: '#364153',
                }}
              >
                <p>1. Western Ghats</p>
                <p>2. Eastern Himalayas</p>
                <p>3. Sundaland</p>
              </div>

              {/* Options */}
              <div
                className="space-y-3 mb-6"
                style={{ width: '482px', maxWidth: '100%' }}
              >
                {[
                  '1 only',
                  '1 and 2 only',
                  '1, 2 and 3',
                  '2 and 3 only',
                ].map((text, index) => {
                  const label = String.fromCharCode(65 + index);
                  return (
                    <button
                      key={label}
                      className="w-full flex items-center gap-4 rounded-[14px] bg-white px-6 py-4 text-left"
                      style={{
                        minHeight: '75.2px',
                        borderRadius: '14px',
                        border: '1.6px solid #E5E7EB',
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-[16px] font-bold flex-shrink-0"
                        style={{ background: '#F3F4F6', color: '#364153' }}
                      >
                        {label}
                      </div>
                      <span
                        className="text-[16px]"
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 500,
                          lineHeight: '24px',
                          color: '#101828',
                        }}
                      >
                        {text}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* CTA */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowAttemptModal(true)}
                  className="w-full h-[52px] rounded-[14px] bg-[#0F172B] text-white font-bold text-[18px] leading-[28px] flex items-center justify-center hover:bg-[#111827] transition-colors"
                >
                  Attempt Question
                </button>
              </div>
            </div>}
              </>
            ) : (
              <>
                {/* Mains header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                  <h3 className="font-bold text-[24px] text-[#101828]">
                    Mains Questions
                    {yearMode === 'custom' && selectedYears.length > 0 ? ` · ${selectedYears.length === 1 ? selectedYears[0] : `${selectedYears.length} years`}` : ''}
                  </h3>
                  <p className="text-[14px] text-[#6A7282]">
                    {loading ? 'Loading...' : `Showing ${visibleQuestions.length} of ${total} questions`}
                  </p>
                </div>

                {/* Breadcrumb trail */}
                <nav aria-label="Filter path" className="flex flex-wrap items-center gap-1.5 mb-5">
                  <button
                    type="button"
                    onClick={() => { setSelectedSubject('All Papers'); setSelectedSubtopic(null); setSelectedTopics([]); setExpandedSubject(null); setExpandedSubtopic(null); }}
                    className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold transition-all hover:opacity-80 active:scale-95"
                    style={{ background: selectedSubject === 'All Papers' ? '#0F1A30' : '#EEF2FF', color: selectedSubject === 'All Papers' ? '#FFFFFF' : '#4338CA' }}
                  >
                    📘 All Papers
                  </button>
                  {selectedSubject !== 'All Papers' && (
                    <>
                      <span className="text-[#CBD5E1] text-[14px] font-bold select-none">›</span>
                      <button
                        type="button"
                        onClick={() => { setSelectedSubtopic(null); setSelectedTopics([]); setExpandedSubtopic(null); }}
                        className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold transition-all hover:opacity-80 active:scale-95"
                        style={{ background: !selectedSubtopic ? '#0F1A30' : '#DBEAFE', color: !selectedSubtopic ? '#FFFFFF' : '#1D4ED8' }}
                      >
                        {SUBJECT_ICONS[selectedSubject] ?? '📘'} {selectedSubject}
                      </button>
                    </>
                  )}
                  {selectedSubtopic && (
                    <>
                      <span className="text-[#CBD5E1] text-[14px] font-bold select-none">›</span>
                      <button
                        type="button"
                        onClick={() => setSelectedTopics([])}
                        className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold transition-all hover:opacity-80 active:scale-95"
                        style={{ background: !selectedTopics[0] ? '#0F1A30' : '#FEF3C7', color: !selectedTopics[0] ? '#FFFFFF' : '#92400E' }}
                      >
                        {selectedSubtopic}
                      </button>
                    </>
                  )}
                  {selectedTopics[0] && (
                    <>
                      <span className="text-[#CBD5E1] text-[14px] font-bold select-none">›</span>
                      <span
                        className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold"
                        style={{ background: '#0F1A30', color: '#FFFFFF' }}
                      >
                        {selectedTopics[0]}
                      </span>
                    </>
                  )}
                </nav>

                {/* Loading skeleton */}
                {loading && (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="rounded-[16px] bg-white p-8 mb-4 animate-pulse" style={{ border: '0.8px solid #E5E7EB' }}>
                        <div className="flex gap-2 mb-4"><div className="h-6 w-32 bg-gray-200 rounded"/><div className="h-6 w-20 bg-gray-200 rounded"/></div>
                        <div className="h-5 w-full bg-gray-200 rounded mb-2"/>
                        <div className="h-5 w-4/5 bg-gray-200 rounded"/>
                      </div>
                    ))}
                  </div>
                )}

                {/* Dynamic mains cards */}
                {!loading && visibleQuestions.map((q, idx) => {
                  const chips = questionChips(q, {
                    year: { background: '#1E40AF', color: '#FFFFFF' },
                    subject: { background: '#FEE2E2', color: '#DC2626' },
                    subSubject: { background: '#E0F2FE', color: '#0369A1' },
                    topic: { background: '#EDE9FE', color: '#7E22CE' },
                  }).map((chip) => ({
                    ...chip,
                    label: chip.key === 'year' ? String(q.year) : chip.label,
                  }));
                  const publicQuestionHref = `/questions/${encodeURIComponent(q.id)}?mode=mains`;
                  return (
                  <div
                    key={q.id}
                    className="mb-6"
                    style={{
                      width: '100%',
                      maxWidth: '100%',
                      borderRadius: '16px',
                      border: '0.8px solid #E5E7EB',
                      background: '#FFFFFF',
                      boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A',
                      padding: '32px',
                    }}
                  >
                    {/* Tag row */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {chips.map((chip) => (
                        <span key={chip.key} className="px-3 py-1 rounded-full text-[12px] font-bold" style={chip.style}>
                          {chip.label}
                        </span>
                      ))}
                      <span className="px-3 py-1 rounded-full text-[12px] font-bold" style={{ background: '#F3E8FF', color: '#7E22CE' }}>
                        {q.marks || 15} marks
                      </span>
                    </div>

                    {false && <div className="inline-flex items-center mb-4" style={{ borderRadius: '8px', background: '#17223E', padding: '4px 16px' }}>
                      <span style={{ fontSize: '14px', marginRight: '8px' }} aria-hidden>✨</span>
                      <span style={{ fontFamily: 'Arimo, sans-serif', fontWeight: 700, fontSize: '14px', lineHeight: '20px', color: '#FFD272' }}>
                        Write &amp; Evaluate
                      </span>
                    </div>}


                    {/* Question text */}
                    <Link
                      href={publicQuestionHref}
                      className="group block rounded-[12px] outline-none transition hover:bg-[#F8FAFC] focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60"
                      title="Open public question page"
                    >
                      <QuestionTextRenderer
                        text={q.questionText}
                        className="mb-4 text-[16px] font-[500] leading-[26px] text-[#101828] transition-colors group-hover:text-[#0F4C81]"
                        textClassName="text-[16px] font-[500] leading-[26px] text-[#101828] transition-colors group-hover:text-[#0F4C81]"
                        textStyle={{ fontFamily: PYQ_QUESTION_FONT }}
                      />
                    </Link>

                    {/* Stats row */}
                    <div className="flex flex-wrap items-center gap-6 mb-6">
                      {q.year > 0 && (
                        <div className="flex items-center gap-2">
                          <span aria-hidden>📅</span>
                          <span className="text-[14px] text-[#6A7282]">{q.year}</span>
                        </div>
                      )}
                      {q.topic && (
                        <div className="flex items-center gap-2">
                          <span aria-hidden>📝</span>
                          <span className="text-[14px] text-[#6A7282]">{q.topic}</span>
                        </div>
                      )}
                    </div>

                    {/* Buttons row */}
                    <div className="flex items-center gap-3 mb-4">
                      <button
                        type="button"
                        onClick={() => { setSelectedQuestion(q); setMainsAnswerText(''); setMainsFile(null); setMainsFiles([]); setMainsEvalResults(null); setMainsSubmitError(null); setMainsTimeLeft(MAINS_TIME_LIMIT); setMainsTimerPaused(true); setMainsReadTimeLeft(PYQ_READING_WINDOW_SECONDS); setTextAnswerExpanded(false); mainsAutoSubmitRef.current = false; setShowMainsWriteModal(true); }}
                        className="flex items-center justify-center"
                        style={{ height: '59px', borderRadius: '14px', background: '#101828', color: '#FFFFFF', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', padding: '0 20px' }}
                      >
                        <span aria-hidden style={{ marginRight: '8px' }}>✨</span>
                        <span>Write &amp; Evaluate</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedQuestion(q);
                          setShowModelAnswerModal(true);
                        }}
                        className="flex items-center justify-center"
                        style={{ height: '59px', borderRadius: '14px', background: '#0F172A', color: '#FFFFFF', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', padding: '0 20px' }}
                      >
                        <span>Model Answer</span>
                      </button>
                      <button
                        type="button"
                        className="flex items-center justify-center"
                        style={{ width: '59px', height: '59px', borderRadius: '14px', background: '#FFFFFF', border: '1.6px solid #FFC9C9', fontSize: '20px', cursor: 'pointer', flexShrink: 0 }}
                        aria-label="Write answer"
                        onClick={() => { setSelectedQuestion(q); setMainsAnswerText(''); setMainsFile(null); setMainsFiles([]); setMainsEvalResults(null); setMainsSubmitError(null); setMainsTimeLeft(MAINS_TIME_LIMIT); setMainsTimerPaused(true); setMainsReadTimeLeft(PYQ_READING_WINDOW_SECONDS); setTextAnswerExpanded(false); mainsAutoSubmitRef.current = false; setShowMainsWriteModal(true); }}
                      >
                        ✏️
                      </button>
                    </div>

                  </div>
                  );
                })}

                {!loading && visibleQuestions.length === 0 && (
                  <div className="rounded-[16px] bg-white p-10 text-center text-[#6A7282]" style={{ border: '0.8px solid #E5E7EB' }}>
                    No mains questions found for the selected filters.
                  </div>
                )}
              </>
            )}
          </section>

        </div>
      </div>

      {/* Login modal - Unlock Full PYQ Access */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(15,23,42,0.45)' }}>
          <div
            className="relative flex flex-col items-center text-center"
            style={{
              width: '448px',
              maxWidth: '100%',
              minHeight: '549.2px',
              borderRadius: '24px',
              background: '#FFFFFF',
              boxShadow: '0px 25px 50px -12px #00000040',
              padding: '40px 32px 32px',
            }}
          >
            {/* Target icon placeholder */}
            <div
              className="mb-6 flex items-center justify-center"
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '9999px',
                background: '#0F172B',
              }}
            >
              <span style={{ fontSize: '36px' }} aria-hidden>
                🎯
              </span>
            </div>

            {/* Heading */}
            <h2
              style={{
                width: '347px',
                maxWidth: '100%',
                height: '36px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: '30px',
                lineHeight: '36px',
                color: '#101828',
                marginBottom: '16px',
              }}
            >
              Unlock Full PYQ Access
            </h2>

            {/* Description */}
            <p
              style={{
                width: '367px',
                maxWidth: '100%',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: '16px',
                lineHeight: '26px',
                color: '#4A5565',
                marginBottom: '32px',
              }}
            >
              Login or create a free account to attempt questions, save progress, read full explanations, and use
              AI-powered Mains Answer Evaluation.
            </p>

            {/* Create Free Account button */}
            <button
              className="flex items-center justify-center mb-3"
              style={{
                width: '368px',
                maxWidth: '100%',
                height: '60px',
                borderRadius: '16px',
                gap: '8px',
                background: '#0F172B',
                color: '#FFFFFF',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: '18px',
                lineHeight: '28px',
              }}
            >
              <span aria-hidden>🚀</span>
              <span>Create Free Account</span>
            </button>

            {/* Login with Google button */}
            <button
              className="flex items-center justify-center mb-5"
              style={{
                width: '368px',
                maxWidth: '100%',
                height: '63.2px',
                borderRadius: '16px',
                gap: '8px',
                background: '#FFFBEB',
                border: '1.6px solid #FEE685',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: '18px',
                lineHeight: '28px',
                color: '#101828',
              }}
            >
              <span aria-hidden>🔑</span>
              <span>Login with Google</span>
            </button>

            {/* Maybe later */}
            <button
              type="button"
              onClick={() => setShowLoginModal(false)}
              style={{
                width: '368px',
                maxWidth: '100%',
                height: '48px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: '16px',
                lineHeight: '24px',
                color: '#6A7282',
              }}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      {showModelAnswerModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.55)' }}
          onClick={() => setShowModelAnswerModal(false)}
        >
          <div
            className="rounded-[24px] bg-white p-8"
            style={{ width: 720, maxWidth: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="m-0 text-[24px] font-bold text-[#101828]">Model Answer</h2>
              <button
                type="button"
                onClick={() => setShowModelAnswerModal(false)}
                className="h-10 w-10 rounded-full bg-[#101828] text-white"
                aria-label="Close model answer"
              >
                x
              </button>
            </div>
            <QuestionTextRenderer
              text={
                selectedQuestion?.modelAnswer ||
                selectedQuestion?.answer ||
                selectedQuestion?.explanation ||
                'Model answer is being prepared for this question.'
              }
              className="rounded-[16px] border border-[#E5E7EB] bg-[#F9FAFB] p-5"
              textClassName="text-[16px] leading-[28px] text-[#1E2939]"
            />
          </div>
        </div>
      )}

      {/* Mains Write & AI Evaluate modal - opens from Write & Evaluate on Mains tab */}
      {showMainsWriteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-4"
          style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowMainsWriteModal(false)}
        >
          <div
            className="flex flex-col overflow-hidden rounded-[24px] bg-white"
            style={{
              width: '1180px',
              maxWidth: '100%',
              height: 'min(760px, calc(100vh - 32px))',
              boxShadow: '0px 28px 70px rgba(15,23,42,0.35)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-shrink-0 items-center justify-between bg-[#0F1424] px-8 py-5 text-white">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#D9B84A] text-[24px] text-[#0F1424]">✎</div>
                <div>
                  <h2 className="m-0 font-bold" style={{ fontFamily: 'Merriweather, serif', fontSize: 22 }}>Craft Your Answer</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {selectedQuestion?.paper && <span className="rounded-[7px] border border-[#D9B84A]/35 bg-[#D9B84A]/15 px-3 py-1 text-[12px] font-bold text-[#D9B84A]">{selectedQuestion.paper}</span>}
                    {selectedQuestion?.subject && <span className="rounded-[7px] border border-[#4ADE80]/25 bg-[#4ADE80]/15 px-3 py-1 text-[12px] font-bold text-[#86EFAC]">{selectedQuestion.subject}</span>}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMainsWriteModal(false)}
                className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-white/15 bg-white/10 text-[24px] text-white/70"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_300px]">
              <div className="min-h-0 px-8 py-5">
                <div className="rounded-[12px] bg-[#F9FAFB] p-4" style={{ borderLeft: '4px solid #D4AF37' }}>
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#9AA3B2]">Question</div>
                  <QuestionTextRenderer
                    text={selectedQuestion?.questionText || 'Loading question...'}
                    textClassName="italic text-[15px] leading-[26px] text-[#1E2939]"
                    textStyle={{ fontFamily: PYQ_QUESTION_FONT }}
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] font-semibold text-[#6A7282]">
                  <span>◷ 20 min</span>
                  <span>✍️ 250 words</span>
                  <span>☆ {selectedQuestion?.marks || selectedQuestion?.maxMarks || 15} marks</span>
                </div>

                <div className="mt-4 flex items-center gap-2 text-[16px] font-bold text-[#0F172B]">
                  <span className="text-[#D4AF37]">⇧</span>
                  Upload your answer
                </div>

              <input
                ref={mainsFileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const selected = Array.from(e.target.files || []);
                  const hasPdf = selected.some((file) => file.type === 'application/pdf');
                  if (hasPdf && selected.length > 1) {
                    setMainsSubmitError('Upload either one PDF or multiple image pages, not both.');
                    e.target.value = '';
                    return;
                  }
                  setMainsSubmitError(null);
                  setMainsFiles(selected);
                  setMainsFile(selected[0] || null);
                }}
              />
                <div
                  className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-[14px] text-center"
                  style={{
                    minHeight: 190,
                    border: mainsFiles.length > 0 ? '1.5px dashed #17223E' : '1px dashed #CBD5E1',
                    background: mainsFiles.length > 0 ? '#EFF6FF' : '#F9FAFB',
                  }}
                  onClick={() => mainsFileInputRef.current?.click()}
                >
                  <div className="mb-3 grid h-11 w-11 place-items-center rounded-[12px] bg-[#0F1424] text-[#D4AF37]">⇧</div>
                  <p className="mb-1 text-[15px] font-bold text-[#0F172B]">
                    {mainsFiles.length > 1 ? `${mainsFiles.length} pages selected` : mainsFile ? mainsFile.name : 'Drop your answer script here'}
                  </p>
                  <p className="mb-3 text-[13px] text-[#9AA3B2]">Upload handwritten answers for AI evaluation</p>
                  {mainsFiles.length > 1 && (
                    <div className="mb-3 max-w-full px-6 text-left text-[12px] text-[#4B5563]">
                      {mainsFiles.map((file, index) => (
                        <div key={`${file.name}-${index}`} className="truncate">Page {index + 1}: {file.name}</div>
                      ))}
                    </div>
                  )}
                  <div className="mb-3 flex flex-wrap justify-center gap-2">
                    {['JPG', 'PNG', 'PDF', 'Max 10MB'].map((fmt) => (
                      <span key={fmt} className="rounded bg-[#E5E7EB] px-2.5 py-1 text-[12px] text-[#374151]">{fmt}</span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      mainsFileInputRef.current?.click();
                    }}
                    className="rounded-[8px] border border-[#D1D5DB] bg-white px-6 py-2 text-[14px] font-bold text-[#111827]"
                  >
                    Browse Files
                  </button>
                </div>

                <button type="button" onClick={() => setTextAnswerExpanded((v) => !v)} className="mt-4 flex w-full items-center gap-3">
                  <div className="h-px flex-1 bg-[#E5E7EB]" />
                  <span className="rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-[13px] font-semibold text-[#6A7282]">
                    {textAnswerExpanded ? '⌃ Hide typed answer' : '⌄ OR Type your answer'}
                  </span>
                  <div className="h-px flex-1 bg-[#E5E7EB]" />
                </button>

                {textAnswerExpanded && (
                  <div className="mt-4">
                    <textarea
                      value={mainsAnswerText}
                      onChange={(e) => setMainsAnswerText(e.target.value)}
                      placeholder="Write your answer here..."
                      className="w-full resize-y rounded-[10px] border border-[#D1D5DB] bg-[#F9FAFB] p-4 text-[#101828] outline-none"
                      style={{ minHeight: 120, fontSize: 15, lineHeight: '24px' }}
                    />
                    <p className="mt-1 text-right text-[12px] text-[#6A7282]">{mainsAnswerText.trim().split(/\s+/).filter(Boolean).length} words</p>
                  </div>
                )}

                {mainsQuota && (
                  <div className="mt-4 flex items-center gap-3 rounded-[12px] border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DCFCE7]">✅</span>
                    <div>
                      <p className="text-[13px] font-bold text-[#166534]">Free evaluation available</p>
                      <p className="text-[12px] text-[#4A5565]">
                        {mainsQuota.limit === null || mainsQuota.period === 'unlimited'
                          ? 'Unlimited evaluations remaining'
                          : `${mainsQuota.remaining ?? 0} of ${mainsQuota.limit ?? 0} free evaluations remaining`}
                      </p>
                    </div>
                  </div>
                )}

                {mainsSubmitError && (
                  <div className="mt-4 rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#B91C1C]">
                    {mainsSubmitError}
                  </div>
                )}

                <button
                  id="pyq-mains-submit-btn"
                  type="button"
                  disabled={mainsSubmitting || (!mainsAnswerText.trim() && mainsFiles.length === 0)}
                  onClick={async () => {
                    if (!selectedQuestion) return;
                    setMainsSubmitting(true);
                    try {
                      const res = await pyqService.submitMainsAnswer(selectedQuestion.id, {
                        answerText: mainsAnswerText.trim() || undefined,
                        files: mainsFiles.length > 0 ? mainsFiles : undefined,
                      });
                      if (res.data?.attemptId) {
                        setMainsAttemptId(res.data.attemptId);
                        setShowMainsWriteModal(false);
                        setShowAiEvalModal(true);
                        void entitlements.refreshEntitlements();
                      }
                    } catch (err: any) {
                      const entitlementError = handleEntitlementError(err);
                      const resetAt = formatResetAt(entitlementError.resetAt);
                      const message = resetAt
                        ? `${entitlementError.message} Try again after ${resetAt}.`
                        : entitlementError.message;
                      setMainsSubmitError(message || err.message || 'Failed to submit. Please try again.');
                    } finally {
                      setMainsSubmitting(false);
                    }
                  }}
                  className="mt-4 flex h-[48px] w-full items-center justify-center gap-2 rounded-[12px] bg-[#0F1424] text-[15px] font-bold text-white disabled:opacity-45"
                >
                  {mainsSubmitting ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/Icon%20(13).png" alt="" style={{ width: '22px', height: '22px' }} />
                      Submit Answer for Evaluation
                    </>
                  )}
                </button>
              </div>

              <aside className="flex min-h-0 flex-col gap-4 bg-[#F8F9FB] p-5">
                <div className="rounded-[18px] bg-white p-4 text-center shadow-sm">
                  <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#9AA3B2]">Writing Timer</div>
                  {(() => {
                    const radius = 62;
                    const circumference = 2 * Math.PI * radius;
                    const pct = Math.max(0, Math.min(1, mainsTimeLeft / MAINS_TIME_LIMIT));
                    return (
                      <div className="relative mx-auto mb-3 flex h-[132px] w-[132px] items-center justify-center">
                        <svg width="132" height="132" viewBox="0 0 150 150" style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx="75" cy="75" r={radius} fill="none" stroke="#E6E8EE" strokeWidth="5" />
                          <circle
                            cx="75"
                            cy="75"
                            r={radius}
                            fill="none"
                            stroke={mainsTimeLeft <= 60 ? '#EF4444' : '#D4AF37'}
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference * (1 - pct)}
                          />
                        </svg>
                        <div className="absolute">
                          <div className="font-mono text-[26px] font-bold text-[#0B1020]">
                            {Math.floor(mainsTimeLeft / 60)}:{String(mainsTimeLeft % 60).padStart(2, '0')}
                          </div>
                          <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9AA3B2]">
                            {mainsReadTimeLeft !== null ? `Auto-start ${mainsReadTimeLeft}s` : 'Minutes left'}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (mainsReadTimeLeft !== null) {
                          setMainsReadTimeLeft(null);
                          setMainsTimerPaused(false);
                          return;
                        }
                        setMainsTimerPaused((p) => !p);
                      }}
                      className="rounded-[10px] bg-[#0F1424] px-3 py-2.5 text-[13px] font-bold text-white"
                    >
                      ▷ {mainsReadTimeLeft !== null ? 'Start now' : mainsTimerPaused ? 'Resume' : 'Pause'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMainsTimeLeft(MAINS_TIME_LIMIT);
                        setMainsTimerPaused(true);
                        setMainsReadTimeLeft(PYQ_READING_WINDOW_SECONDS);
                      }}
                      className="rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2.5 text-[13px] font-bold text-[#4A5565]"
                    >
                      ↻ Reset
                    </button>
                  </div>
                </div>

                <div className="rounded-[18px] bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2 text-[14px] font-bold uppercase text-[#0F172B]">
                    <span>💡</span> Quick Tips
                  </div>
                  <div className="flex flex-col gap-3">
                    {[
                      ['✏️', 'Use blue/black ink'],
                      ['📷', 'Clear photo in good lighting'],
                      ['📝', 'Write legibly on white paper'],
                    ].map(([icon, text]) => (
                      <div key={text} className="flex items-center gap-3 rounded-[10px] bg-[#F4F5F7] p-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-white">{icon}</span>
                        <span className="text-[13px] font-bold text-[#364153]">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}

      {/* AI evaluation progress modal - opens after Submit for AI Evaluation */}
      {showAiEvalModal && (
        <PyqEvaluationProgressModal progress={aiEvalProgress} completedStepCount={aiEvalStepIndex} />
      )}

      {/* Rich AI evaluation result - opens after real evaluation */}
      {showAiEvalCompleteModal && mainsEvalResults && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto"
          style={{ background: 'rgba(15,23,42,0.64)' }}
          onClick={() => setShowAiEvalCompleteModal(false)}
        >
          <div
            className="rounded-[28px] flex flex-col my-8 overflow-hidden w-full max-w-[840px]"
            style={{
              background: '#F8FAFC',
              boxShadow: '0px 25px 50px -12px rgba(0,0,0,0.5)',
              maxHeight: 'calc(100vh - 64px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-8 pt-7 pb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4" style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
              <div>
                <div className="flex items-center gap-2 mb-2" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 12, lineHeight: '16px', letterSpacing: '0.05em', color: '#2563EB', textTransform: 'uppercase' }}>
                  Evaluation
                </div>
                <h2 className="font-bold mb-1" style={{ fontFamily: 'Inter', fontSize: 28, lineHeight: 1.2, color: '#111827' }}>
                  Marks scored: {mainsEvalResults.score}/{mainsEvalResults.maxScore}
                </h2>
                <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 14, lineHeight: 1.4, color: '#6B7280' }}>
                  {mainsEvalResults.question?.paper || 'Mains'} · {mainsEvalResults.question?.subject || ''} · {mainsEvalResults.wordCount || 0} words
                </p>
              </div>
              {(() => {
                const pct = mainsEvalResults.maxScore > 0 ? Math.round((mainsEvalResults.score / mainsEvalResults.maxScore) * 100) : 0;
                return (
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 relative w-20 h-20 flex items-center justify-center">
                      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="36" fill="none" stroke="#E5E7EB" strokeWidth="6" />
                        <circle cx="40" cy="40" r="36" fill="none" stroke={pct >= 60 ? '#22C55E' : pct >= 35 ? '#F59E0B' : '#EF4444'} strokeWidth="6" strokeDasharray={`${2 * Math.PI * 36}`} strokeDashoffset={2 * Math.PI * 36 * (1 - pct / 100)} strokeLinecap="round" />
                      </svg>
                      <div className="relative flex flex-col items-center justify-center">
                        <span className="font-bold block leading-none" style={{ fontFamily: 'Inter', fontSize: 18, color: '#111827' }}>{pct}%</span>
                        <span className="block mt-0.5" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 10, lineHeight: 1.2, color: '#6B7280' }}>MARKS</span>
                      </div>
                    </div>
                    <button type="button" onClick={() => setShowAiEvalCompleteModal(false)} className="h-11 w-11 rounded-full bg-[#111827] text-white text-[24px] leading-none" aria-label="Close evaluation modal">
                      ×
                    </button>
                  </div>
                );
              })()}
            </div>

            <div className="flex-1 px-8 py-6 space-y-6 overflow-y-auto">
              <div className="rounded-[18px] p-5" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                <QuestionTextRenderer
                  text={mainsEvalResults.question?.questionText}
                  textClassName="font-[Inter] font-semibold text-[15px] leading-[1.55] text-[#111827]"
                />
              </div>

              {(() => {
                const checkedCopyPages = Array.isArray(mainsEvalResults.checkedCopyPages)
                  ? mainsEvalResults.checkedCopyPages.filter((page: any) => page?.checkedCopyUrl)
                  : [];
                const displayCheckedCopyPages = checkedCopyPages.length > 0
                  ? checkedCopyPages
                  : mainsEvalResults.checkedCopyUrl
                    ? [{ pageNumber: 1, checkedCopyUrl: mainsEvalResults.checkedCopyUrl }]
                    : [];
                return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-[18px] p-5" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                  <div className="flex items-baseline justify-between gap-3 mb-4">
                    <p style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 20, color: '#111827' }}>Word count: {mainsEvalResults.wordCount || 0}</p>
                    <span className="rounded-full px-3 py-1" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 12, color: (mainsEvalResults.wordCount || 0) > 280 ? '#BE123C' : '#047857', border: `1px solid ${(mainsEvalResults.wordCount || 0) > 280 ? '#FDA4AF' : '#86EFAC'}` }}>
                      {(mainsEvalResults.wordCount || 0) > 280 ? 'OVER LIMIT' : 'RECORDED'}
                    </span>
                  </div>
                  <p style={{ fontFamily: 'Inter', fontSize: 14, lineHeight: 1.6, color: '#4B5563' }}>
                    Word limit is considered while calculating your marks.
                  </p>
                </div>

                <div className="rounded-[18px] p-5" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                  <p className="mb-3" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 20, color: '#111827' }}>Checked copy</p>
                  <p style={{ fontFamily: 'Inter', fontSize: 14, lineHeight: 1.6, color: '#4B5563' }}>
                    {displayCheckedCopyPages.length > 0
                      ? `Teacher-style markup is ready for ${displayCheckedCopyPages.length} page${displayCheckedCopyPages.length === 1 ? '' : 's'}.`
                      : mainsFile
                        ? 'Markup is not available yet for this attempt.'
                        : 'Upload a handwritten image to generate visual markup.'}
                  </p>
                  {displayCheckedCopyPages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => document.getElementById('pyq-examiner-markup')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      className="inline-flex mt-4 rounded-[12px] px-4 py-2"
                      style={{ background: '#2563EB', color: '#FFFFFF', fontFamily: 'Inter', fontWeight: 700, fontSize: 14 }}
                    >
                      View checked pages
                    </button>
                  )}
                </div>
              </div>
                );
              })()}

              {(() => {
                const checkedCopyPages = Array.isArray(mainsEvalResults.checkedCopyPages)
                  ? mainsEvalResults.checkedCopyPages.filter((page: any) => page?.checkedCopyUrl)
                  : [];
                const displayCheckedCopyPages = checkedCopyPages.length > 0
                  ? checkedCopyPages
                  : mainsEvalResults.checkedCopyUrl
                    ? [{ pageNumber: 1, checkedCopyUrl: mainsEvalResults.checkedCopyUrl }]
                    : [];
                if (displayCheckedCopyPages.length === 0) return null;
                return (
                  <div id="pyq-examiner-markup" className="rounded-[22px] p-5 scroll-mt-6" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <p style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 20, color: '#111827' }}>Examiner markup</p>
                      <span className="rounded-full px-3 py-1" style={{ background: '#FEE2E2', color: '#B91C1C', fontFamily: 'Inter', fontWeight: 800, fontSize: 12 }}>BETA</span>
                    </div>
                    <div className="space-y-4">
                      {displayCheckedCopyPages.map((page: any) => (
                        <div key={page.pageNumber || page.checkedCopyUrl}>
                          <div className="mb-2 flex items-center justify-between">
                            <span style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 14, color: '#364153' }}>Page {page.pageNumber || 1}</span>
                            <a href={page.checkedCopyUrl} target="_blank" rel="noreferrer" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 13, color: '#2563EB' }}>Open full size</a>
                          </div>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={page.checkedCopyUrl}
                            alt={`Checked copy page ${page.pageNumber || 1} with evaluator markup`}
                            className="w-full rounded-[14px]"
                            style={{ border: '1px solid #E5E7EB', background: '#F3F4F6' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {asTextList(mainsEvalResults.demandCoverage).length > 0 && (
                <div className="rounded-[18px] p-5" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                  <p className="mb-4" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 22, color: '#111827' }}>Demand of the question</p>
                  <ul className="space-y-3 pl-5 list-disc" style={{ fontFamily: 'Inter', fontSize: 16, lineHeight: 1.55, color: '#111827' }}>
                    {asTextList(mainsEvalResults.demandCoverage).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {mainsEvalResults.answerText && (
                <div className="rounded-[18px] p-5" style={{ background: '#E0F2FE', border: '1px solid #BAE6FD' }}>
                  <p className="mb-3" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 20, color: '#0F172A' }}>What you wrote</p>
                  <p style={{ fontFamily: 'Inter', fontSize: 15, lineHeight: 1.75, color: '#0F172A', whiteSpace: 'pre-line' }}>
                    {mainsEvalResults.answerText}
                  </p>
                </div>
              )}

              {mainsEvalResults.sectionFeedback && typeof mainsEvalResults.sectionFeedback === 'object' && !Array.isArray(mainsEvalResults.sectionFeedback) && (
                <div className="space-y-4">
                  {Object.entries(mainsEvalResults.sectionFeedback).map(([section, feedback]) => (
                    <div key={section} className="rounded-[18px] p-5" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                      <p className="mb-3 uppercase" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 14, letterSpacing: '0.06em', color: '#6B7280' }}>
                        {humanizeKey(section)}
                      </p>
                      <ul className="space-y-2 pl-5 list-disc" style={{ fontFamily: 'Inter', fontSize: 15, lineHeight: 1.6, color: '#1F2937' }}>
                        {asTextList(feedback).map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mainsEvalResults.strengths?.length > 0 && (
                  <div className="rounded-[18px] p-5" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                    <p className="mb-3" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 20, color: '#166534' }}>Strengths</p>
                    <ul className="space-y-2 pl-5 list-disc" style={{ fontFamily: 'Inter', fontSize: 15, lineHeight: 1.6, color: '#14532D' }}>
                      {mainsEvalResults.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}

                {mainsEvalResults.improvements?.length > 0 && (
                  <div className="rounded-[18px] p-5" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
                    <p className="mb-3" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 20, color: '#C2410C' }}>Areas to improve</p>
                    <ul className="space-y-2 pl-5 list-disc" style={{ fontFamily: 'Inter', fontSize: 15, lineHeight: 1.6, color: '#7C2D12' }}>
                      {mainsEvalResults.improvements.map((s: string, i: number) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {mainsEvalResults.suggestions?.length > 0 && (
                <div className="rounded-[18px] p-5" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                  <p className="mb-3" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 20, color: '#1D4ED8' }}>Suggestions to improve</p>
                  <ul className="space-y-3 pl-5 list-disc" style={{ fontFamily: 'Inter', fontSize: 15, lineHeight: 1.65, color: '#1E3A8A' }}>
                    {mainsEvalResults.suggestions.map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}

              {mainsEvalResults.modelAnswer && (
                <div className="rounded-[18px] p-5" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                  <p className="mb-3" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 20, color: '#111827' }}>Model answer</p>
                  <p style={{ fontFamily: 'Inter', fontSize: 15, lineHeight: 1.7, color: '#1F2937', whiteSpace: 'pre-line' }}>
                    {mainsEvalResults.modelAnswer}
                  </p>
                </div>
              )}

              {mainsEvalResults.detailedFeedback && (
                <div className="rounded-[18px] p-5" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                  <p className="mb-3 uppercase" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 14, letterSpacing: '0.06em', color: '#6B7280' }}>Overall feedback</p>
                  <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 16, lineHeight: 1.7, color: '#111827', whiteSpace: 'pre-line' }}>
                    {mainsEvalResults.detailedFeedback}
                  </p>
                </div>
              )}
            </div>

            {/* Close button */}
            <div className="px-8 pb-8 pt-2">
              <button
                type="button"
                onClick={() => setShowAiEvalCompleteModal(false)}
                className="w-full flex items-center justify-center gap-2 rounded-[16px] py-4"
                style={{ background: '#2563EB', fontFamily: 'Inter', fontWeight: 700, fontSize: 16, lineHeight: '24px', color: '#FFFFFF' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attempt / Question review modal - Prelims only */}
      {showAttemptModal && mode === 'prelims' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ background: 'rgba(15,23,42,0.5)' }}
          onClick={() => setShowAttemptModal(false)}
        >
          <div
            className="rounded-[24px] bg-white flex flex-col my-8"
            style={{
              width: '896px',
              maxWidth: '100%',
              minHeight: '882px',
              gap: '24px',
              padding: '32px 32px 32px 40px',
              borderLeft: '8px solid #00A63E',
              boxShadow: '0px 4px 6px -4px #0000001A, 0px 10px 15px -3px #0000001A',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: question #, tags, actions */}
            <div
              className="flex items-center justify-between flex-wrap gap-2 flex-shrink-0"
              style={{ width: '824px', maxWidth: '100%', minHeight: '48px' }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <div
                  className="rounded-[14px] flex items-center justify-center flex-shrink-0"
                  style={{ width: 48, height: 48, background: '#1E293B', color: '#FFFFFF', fontFamily: 'Inter', fontWeight: 700, fontSize: '18px', lineHeight: '28px' }}
                >
                  {selectedQuestion?.questionNum ?? '?'}
                </div>
                <span className="px-3 py-1.5 rounded-full text-[14px] font-semibold flex-shrink-0" style={{ background: '#1E293B', color: '#FFFFFF' }}>{selectedQuestion?.year}</span>
                <span className="px-3 py-1.5 rounded-full text-[14px] font-semibold flex-shrink-0" style={{ background: '#FEF3C6', color: '#BB4D00' }}>{selectedQuestion?.subject}</span>
                <span className="px-3 py-1.5 rounded-full text-[14px] font-semibold flex items-center gap-1 flex-shrink-0" style={{ background: '#FFEDD4', color: '#F54900' }}>🔥 {selectedQuestion?.difficulty}</span>
                {hasSubmitted
                  ? <span className="px-3 py-1 rounded-full text-[14px] font-semibold flex items-center gap-1 flex-shrink-0" style={{ background: '#DCFCE7', color: '#008236' }}>✅ Attempted</span>
                  : <span className="px-3 py-1 rounded-full text-[14px] font-semibold flex items-center gap-1 flex-shrink-0" style={{ background: '#F3F4F6', color: '#6A7282' }}>📝 Not Attempted</span>
                }
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button type="button" onClick={() => setShowAttemptModal(false)} className="w-10 h-10 rounded-[14px] flex items-center justify-center text-[18px] font-bold" style={{ background: '#00A63E', color: '#FFFFFF' }} aria-label="Close">×</button>
                <button type="button" className="w-10 h-10 rounded-[14px] flex items-center justify-center" style={{ background: '#F3F4F6', color: '#364153' }} aria-label="Edit">✏️</button>
                <button type="button" className="w-10 h-10 rounded-[14px] flex items-center justify-center" style={{ background: '#F3F4F6', color: '#364153' }} aria-label="Full screen">⛶</button>
              </div>
            </div>

            {/* Question text */}
            <QuestionTextRenderer
              text={selectedQuestion?.questionText}
              style={{ width: '824px', maxWidth: '100%' }}
              textClassName="font-normal text-[18px] leading-[29.25px] text-[#1E2939]"
              textStyle={{ fontFamily: PYQ_QUESTION_FONT }}
            />

            {/* Options */}
            <div style={{ width: '824px', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(selectedQuestion?.options ?? []).map((opt: any) => {
                const isSelected = selectedAnswer === opt.label;
                const isCorrect  = opt.label === selectedQuestion?.correctOption;
                const showCorrect = hasSubmitted && isCorrect;
                const showWrong = hasSubmitted && isSelected && !isCorrect;
                // Default (unselected) state — matches Daily MCQ Challenge design
                let bg = '#FFFFFF', border = '1px solid #E5E7EB', pipBg = '#F1F4F9', pipColor = '#475067', textColor = '#1E293B', textWeight = 400;
                if (!hasSubmitted && isSelected) {
                  bg = '#0B1426'; border = '1.5px solid #0B1426'; pipBg = '#F5C518'; pipColor = '#0B1426'; textColor = '#FFFFFF'; textWeight = 600;
                }
                if (showCorrect) {
                  bg = '#ECFDF5'; border = '1.5px solid #10B981'; pipBg = '#10B981'; pipColor = '#FFFFFF'; textColor = '#065F46'; textWeight = 600;
                }
                if (showWrong) {
                  bg = '#FEF2F2'; border = '1.5px solid #F43F5E'; pipBg = '#F43F5E'; pipColor = '#FFFFFF'; textColor = '#9F1239'; textWeight = 600;
                }

                return (
                  <button
                    key={opt.label}
                    disabled={hasSubmitted}
                    onClick={() => setSelectedAnswer(opt.label)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderRadius: 12, minHeight: 50,
                      border, background: bg,
                      cursor: hasSubmitted ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.15s ease', width: '100%',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                    }}
                  >
                    <span
                      style={{
                        width: 30, height: 30, borderRadius: 8, border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 13, color: pipColor, background: pipBg, flexShrink: 0,
                      }}
                    >
                      {opt.label}
                    </span>
                    <span style={{ fontWeight: textWeight, fontSize: 18, color: textColor, whiteSpace: 'pre-wrap', lineHeight: '29.25px' }}>
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Explanation – shown only after submit */}
            {hasSubmitted && getExplanationText(selectedQuestion) && (
              <div style={{ width: '774.4px', maxWidth: '100%' }}>
                <div className="flex items-center gap-2 mb-2" style={{ color: '#016630', fontWeight: 700, fontSize: '14px', textTransform: 'uppercase' }}>
                  <span>✅</span><span>Explanation</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <ExplanationRenderer question={selectedQuestion} />
                </div>
                <div className="flex items-center gap-2" style={{ fontSize: '14px', color: '#6A7282' }}>
                  <span>📖</span>
                  <span>UPSC CSE Prelims {selectedQuestion.year}, {selectedQuestion.paper}</span>
                </div>
              </div>
            )}

            {/* Bottom bar */}
            <div className="flex items-center justify-between flex-wrap gap-4" style={{ width: '824px', maxWidth: '100%', marginTop: 'auto', paddingTop: 8 }}>
              {!hasSubmitted ? (
                <button
                  type="button"
                  onClick={async () => {
                    if (!selectedAnswer || !selectedQuestion?.id) return;
                    setHasSubmitted(true);
                    setPrelimsSubmitError(null);
                    try {
                      await pyqService.submitPrelimsAnswer(selectedQuestion.id, selectedAnswer);
                    } catch (err) {
                      setPrelimsSubmitError(err instanceof Error ? err.message : 'Could not save attempt');
                    }
                  }}
                  disabled={!selectedAnswer}
                  className="flex items-center justify-center gap-2 rounded-[14px] px-5 py-2.5"
                  style={{ background: selectedAnswer ? '#0F172B' : '#E5E7EB', color: selectedAnswer ? '#fff' : '#9CA3AF', fontWeight: 600, fontSize: '16px', cursor: selectedAnswer ? 'pointer' : 'not-allowed' }}
                >
                  {selectedAnswer ? 'Submit Answer' : 'Select an answer first'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setHasSubmitted(false); setSelectedAnswer(null); setPrelimsSubmitError(null); }}
                  className="flex items-center justify-center gap-2 rounded-[14px] px-5 py-2.5"
                  style={{ background: '#DCFCE7', color: '#008236', fontWeight: 600, fontSize: '16px' }}
                >
                  <span>✅</span><span>Attempted · Reset</span>
                </button>
            )}

            {hasSubmitted && prelimsSubmitError && (
              <div className="rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#B91C1C]">
                Attempt shown locally, but could not be saved for leaderboard: {prelimsSubmitError}
              </div>
            )}
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-2" style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#6A7282' }}>
                  <span aria-hidden>👁</span>
                  <span>1,240 views</span>
                </span>
                <span className="flex items-center gap-2" style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#6A7282' }}>
                  <span aria-hidden>🎯</span>
                  <span>58% avg accuracy</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </LayoutGroup>
  );
}
