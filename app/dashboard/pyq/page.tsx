'use client';

import React, { useState, useEffect, useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import DashboardPageHero from '@/components/DashboardPageHero';
import { pyqService } from '@/lib/services';
import QuestionTextRenderer from '@/components/QuestionTextRenderer';
import prelimsSyllabus from '@/data/syllabus/prelimsSyllabus.json';

const AI_EVAL_STEPS = [
  'Reading your answer',
  'Identifying key points & arguments',
  'Comparing with model answers',
  'Preparing detailed markup & feedback',
  'Generating detailed feedback',
];

const PYQ_READING_WINDOW_SECONDS = 15;

const LATEST_EXAM_YEAR = 2025;
const EARLIEST_EXAM_YEAR = 2011;
const YEAR_OPTIONS = Array.from(
  { length: LATEST_EXAM_YEAR - EARLIEST_EXAM_YEAR + 1 },
  (_, index) => LATEST_EXAM_YEAR - index
);

type SubjectTreeNode = {
  label: string;
  icon: string;
  children?: Array<{ label: string; microTopics?: string[] }>;
};

type PYQCountData = {
  total: number;
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
  const MAINS_TIME_LIMIT = 9 * 60; // 9 minutes in seconds
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
  const [selectedSubject, setSelectedSubject] = useState('All Papers');
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [expandedSubtopic, setExpandedSubtopic] = useState<string | null>(null);
  const [questionCounts, setQuestionCounts] = useState<PYQCountData>(EMPTY_COUNTS);

  const fetchQuestions = useCallback(async () => {
    const requestSeq = ++questionsRequestSeqRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await pyqService.getQuestions({
        mode,
        years: yearMode === 'custom' && selectedYears.length > 0 ? selectedYears : undefined,
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
  }, [mode, yearMode, selectedYears, selectedSubject, selectedSubtopic, selectedTopics, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [mode, yearMode, selectedYears, selectedSubject, selectedSubtopic, selectedTopics]);

  useEffect(() => {
    questionsRequestSeqRef.current += 1;
    setQuestions([]);
    setTotal(0);
    setTotalPages(0);
    setSelectedQuestion(null);
    setShowMainsWriteModal(false);
    setShowModelAnswerModal(false);
    setShowAttemptModal(false);
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

  // When AI eval modal opens: poll backend for real evaluation status
  useEffect(() => {
    if (!showAiEvalModal || !mainsAttemptId || !selectedQuestion) {
      setAiEvalProgress(0);
      setAiEvalStepIndex(0);
      return;
    }
    setShowAiEvalCompleteModal(false);
    setAiEvalStepIndex(1);
    const start = Date.now();

    // Visual progress animation (cosmetic – doesn't block)
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(95, (elapsed / 60000) * 100); // 60s ceiling, cap at 95%
      setAiEvalProgress(pct);
      const step = 1 + Math.min(AI_EVAL_STEPS.length - 1, Math.floor((elapsed / 60000) * (AI_EVAL_STEPS.length - 1)));
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

  return (
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
            The Complete <em className="not-italic" style={{ color: '#E8B84B', fontStyle: 'italic' }}>PYQ Bank</em>
            <br />
            for UPSC Success
          </>
        }
        subtitle="Every UPSC question ever asked Prelims, Mains with instant evaluation, subject filters, and detailed explanations."
        stats={[
          { value: '6500+', label: 'PYQs', color: '#E8B84B' },
          { value: '30+', label: 'Years', color: '#F87171' },
          { value: '15+', label: 'Subjects', color: '#4ADE80' },
          { value: '∞', label: 'Always Free', color: '#FFFFFF' },
        ]}
      />

      <div className="w-full max-w-[1400px] mx-auto px-6 pt-3 pb-4">
        <div className="mb-4 flex w-full justify-center">
          <div
            className="inline-flex items-center bg-white rounded-full overflow-hidden shadow-[0_4px_6px_-4px_rgba(0,0,0,0.1),0_10px_15px_-3px_rgba(0,0,0,0.1)]"
            style={{
              width: '347.3px',
              height: '79.9875px',
              padding: 0,
              borderRadius: '26843500px',
              gap: 0,
            }}
          >
            <button
              className="flex flex-1 items-center justify-center"
              style={{
                alignSelf: 'stretch',
                paddingLeft: '32px',
                paddingRight: '32px',
                background: mode === 'prelims' ? '#0F172B' : 'transparent',
                gap: '12px',
                borderRadius: mode === 'prelims' ? '9999px' : '0',
              }}
              onClick={() => setMode('prelims')}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/9k.png"
                alt="Prelims"
                style={{ width: '24px', height: '24px', objectFit: 'contain', flexShrink: 0 }}
              />
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 700,
                  fontSize: '18px',
                  lineHeight: '28px',
                  letterSpacing: 0,
                  textAlign: 'center',
                  color: mode === 'prelims' ? '#FFFFFF' : '#4A5565',
                }}
              >
                Prelims
              </span>
            </button>
            <button
              className="flex flex-1 items-center justify-center"
              style={{
                alignSelf: 'stretch',
                paddingLeft: '32px',
                paddingRight: '32px',
                background: mode === 'mains' ? '#0F172B' : 'transparent',
                gap: '12px',
                borderRadius: mode === 'mains' ? '9999px' : '0',
              }}
              onClick={() => setMode('mains')}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/8k.png"
                alt="Mains"
                style={{ width: '24px', height: '24px', objectFit: 'contain', flexShrink: 0 }}
              />
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 700,
                  fontSize: '18px',
                  lineHeight: '28px',
                  letterSpacing: 0,
                  textAlign: 'center',
                  color: mode === 'mains' ? '#FFFFFF' : '#4A5565',
                }}
              >
                Mains
              </span>
            </button>
          </div>
        </div>

        {/* Content area: filters (left on desktop) + questions */}
        <div className="flex flex-col lg:flex-row-reverse gap-8">
          {/* Questions list */}
          <section className="flex-1 min-w-0">
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
                return (
                  <div
                    key={q.id}
                    className="rounded-[16px] bg-white shadow-[0_1px_2px_-1px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.1)] mb-6 p-6"
                  >
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {q.year > 0 && (
                        <span className="px-3 py-1 rounded-full text-[12px] font-bold" style={{ background: '#DBEAFE', color: '#1447E6' }}>
                          UPSC {q.year}
                        </span>
                      )}
                      {q.subject && (
                        <span className="px-3 py-1 rounded-full text-[12px] font-bold" style={{ background: '#E0E7FF', color: '#432DD7' }}>
                          {q.subject.toUpperCase()}
                        </span>
                      )}
                      {q.subSubject && (
                        <span className="px-3 py-1 rounded-full text-[12px] font-bold" style={{ background: '#E0F2FE', color: '#0369A1' }}>
                          {q.subSubject.toUpperCase()}
                        </span>
                      )}
                      {q.topic && (
                        <span className="px-3 py-1 rounded-full text-[12px] font-bold" style={{ background: '#F3E8FF', color: '#7E22CE' }}>
                          {q.topic.toUpperCase()}
                        </span>
                      )}
                      <span className="px-3 py-1 rounded-full text-[12px] font-bold" style={diffColor}>
                        {q.difficulty?.toUpperCase()}
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="uppercase mb-2 text-[12px] tracking-[0.02em] text-[#9CA3AF]">
                      PRELIMS · QUESTION #{idx + 1}
                    </div>

                    {/* Question text */}
                    <QuestionTextRenderer
                      text={q.questionText}
                      className="mb-5 text-[18px] font-[500] leading-[1.5] text-[#111827]"
                      textClassName="text-[18px] font-[500] leading-[1.5] text-[#111827]"
                    />

                    {/* Options — inline interactive */}
                    {opts.length > 0 && (
                      <div className="space-y-3 mb-4">
                        {opts.map((opt) => {
                          const isSelected = qState.selected === opt.label;
                          const isCorrect = opt.label === q.correctOption;
                          let bg = '#F9FAFB', border = '1.6px solid #E5E7EB', labelBg = '#D1D5DC', labelColor = '#364153';
                          if (!qState.submitted && isSelected) {
                            bg = '#EFF6FF'; border = '1.6px solid #3B82F6'; labelBg = '#3B82F6'; labelColor = '#fff';
                          }
                          if (qState.submitted && isCorrect) {
                            bg = '#F0FDF4'; border = '1.6px solid #00C950'; labelBg = '#00A63E'; labelColor = '#fff';
                          }
                          if (qState.submitted && isSelected && !isCorrect) {
                            bg = '#FEF2F2'; border = '1.6px solid #FB2C36'; labelBg = '#E7000B'; labelColor = '#fff';
                          }
                          return (
                            <button
                              key={opt.label}
                              type="button"
                              disabled={qState.submitted}
                              onClick={() => setSelected(opt.label)}
                              className="w-full flex items-center gap-4 rounded-[14px] px-5 py-3.5 text-left transition-colors"
                              style={{ background: bg, border }}
                            >
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-[16px] font-bold flex-shrink-0"
                                style={{ background: labelBg, color: labelColor }}
                              >
                                {opt.label}
                              </div>
                              <span className="text-[16px]" style={{ color: '#1A202C', fontWeight: qState.submitted && (isCorrect || isSelected) ? 500 : 400 }}>
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
                    {qState.submitted && q.explanation && (
                      <div className="mt-4 rounded-[14px] p-4" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                        <div className="flex items-center gap-2 mb-1" style={{ color: '#016630', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase' }}>
                          <span>✅</span><span>Explanation</span>
                        </div>
                        <p style={{ fontSize: '15px', color: '#364153', lineHeight: '26px' }}>{q.explanation}</p>
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
                {!loading && visibleQuestions.map((q, idx) => (
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
                      {q.year > 0 && (
                        <span className="px-3 py-1 rounded-full text-[12px] font-bold" style={{ background: '#1E40AF', color: '#FFFFFF' }}>
                          {q.year}
                        </span>
                      )}
                      {q.subject && (
                        <span className="px-3 py-1 rounded-full text-[12px] font-bold" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                          {q.subject.toUpperCase()}
                        </span>
                      )}
                      {q.subSubject && (
                        <span className="px-3 py-1 rounded-full text-[12px] font-bold" style={{ background: '#E0F2FE', color: '#0369A1' }}>
                          {q.subSubject.toUpperCase()}
                        </span>
                      )}
                      {q.topic && (
                        <span className="px-3 py-1 rounded-full text-[12px] font-bold" style={{ background: '#EDE9FE', color: '#7E22CE' }}>
                          {q.topic.toUpperCase()}
                        </span>
                      )}
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
                    <QuestionTextRenderer
                      text={q.questionText}
                      className="mb-4 text-[16px] font-[500] leading-[26px] text-[#101828]"
                      textClassName="text-[16px] font-[500] leading-[26px] text-[#101828]"
                    />

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
                        onClick={() => { setSelectedQuestion(q); setMainsAnswerText(''); setMainsFile(null); setMainsFiles([]); setMainsEvalResults(null); setMainsSubmitError(null); setMainsTimeLeft(9 * 60); setMainsTimerPaused(true); setMainsReadTimeLeft(PYQ_READING_WINDOW_SECONDS); setTextAnswerExpanded(false); mainsAutoSubmitRef.current = false; setShowMainsWriteModal(true); }}
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
                        onClick={() => { setSelectedQuestion(q); setMainsAnswerText(''); setMainsFile(null); setMainsFiles([]); setMainsEvalResults(null); setMainsSubmitError(null); setMainsTimeLeft(9 * 60); setMainsTimerPaused(true); setMainsReadTimeLeft(PYQ_READING_WINDOW_SECONDS); setTextAnswerExpanded(false); mainsAutoSubmitRef.current = false; setShowMainsWriteModal(true); }}
                      >
                        ✏️
                      </button>
                    </div>

                  </div>
                ))}

                {!loading && visibleQuestions.length === 0 && (
                  <div className="rounded-[16px] bg-white p-10 text-center text-[#6A7282]" style={{ border: '0.8px solid #E5E7EB' }}>
                    No mains questions found for the selected filters.
                  </div>
                )}
              </>
            )}
          </section>

          {/* Right: filters */}
          <aside
            className="w-full lg:w-[340px] xl:w-[380px] flex-shrink-0 space-y-4 lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#D1D5DB transparent' }}
          >
            {/* Exam year card */}
            <div
              className="rounded-[16px] bg-white flex flex-col"
              style={{
                width: '100%',
                boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between pt-5 pl-5 pr-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#0F172B] flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0">
                    1
                  </div>
                  <div className="text-[12px] font-bold tracking-[0.06em] uppercase text-[#4A5565]">
                    EXAM YEAR
                  </div>
                </div>
                <span className="text-[12px] font-medium text-[#6A7282]">
                  {yearMode === 'custom' ? `${selectedYears.length} selected` : '0 selected'}
                </span>
              </div>

              {/* All / Custom toggle */}
              <div className="px-5 pb-4">
                <div className="flex rounded-[10px] p-1" style={{ background: '#F3F4F6' }}>
                  {(['all', 'custom'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setYearMode(m);
                        if (m === 'all') { setSelectedYears([]); setYearSearch(''); }
                      }}
                      className="flex-1 rounded-[8px] py-2 text-[13px] font-semibold transition-all"
                      style={{
                        background: yearMode === m ? '#0F172B' : 'transparent',
                        color: yearMode === m ? '#fff' : '#4A5565',
                      }}
                    >
                      {m === 'all' ? 'All' : 'Custom'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom panel */}
              {yearMode === 'custom' && (
                <div className="px-5 pb-5 flex flex-col gap-3">
                  {/* Search */}
                  <div
                    className="flex items-center gap-2 rounded-[10px] px-3"
                    style={{ height: '40px', background: '#F3F4F6', border: '1.5px solid #E5E7EB' }}
                  >
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <circle cx="6.5" cy="6.5" r="5" stroke="#6A7282" strokeWidth="1.4"/>
                      <path d="M10.5 10.5L13 13" stroke="#6A7282" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                    <input
                      type="text"
                      placeholder="Search year..."
                      value={yearSearch}
                      onChange={(e) => setYearSearch(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-[13px] text-[#101828] placeholder:text-[#9CA3AF]"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    />
                  </div>

                  {/* All / Clear row */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedYears(YEAR_OPTIONS)}
                        className="rounded-full px-3 py-1 text-[12px] font-semibold"
                        style={{ background: '#EEF2FF', color: '#4338CA' }}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedYears([])}
                        className="rounded-full px-3 py-1 text-[12px] font-semibold"
                        style={{ background: '#F3F4F6', color: '#4A5565' }}
                      >
                        Clear
                      </button>
                    </div>
                    <span className="text-[12px] font-medium text-[#9CA3AF]">
                      {selectedYears.length} selected
                    </span>
                  </div>

                  {/* Year grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {YEAR_OPTIONS
                      .filter((y) => !yearSearch || String(y).includes(yearSearch))
                      .map((y) => {
                        const active = selectedYears.includes(y);
                        return (
                          <button
                            key={y}
                            type="button"
                            onClick={() =>
                              setSelectedYears((prev) =>
                                active ? prev.filter((v) => v !== y) : [...prev, y]
                              )
                            }
                            className="rounded-[8px] py-2 text-[13px] font-semibold transition-all"
                            style={{
                              background: active ? '#0F172B' : '#F3F4F6',
                              color: active ? '#fff' : '#374151',
                              border: active ? '1.5px solid #0F172B' : '1.5px solid #E5E7EB',
                            }}
                          >
                            {y}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Subject Filter panel */}
            <div
              className="rounded-[16px] bg-white flex flex-col"
              style={{
                width: '100%',
                borderTop: '0.8px solid #E5E7EB',
                boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A',
              }}
            >
              <div className="flex items-center gap-3 pt-6 pb-4 px-5">
                <div
                  className="rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ width: 24, height: 24, background: '#1E293B', color: '#FFFFFF', fontSize: 12, fontWeight: 700 }}
                >
                  2
                </div>
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: '12px',
                    lineHeight: '16px',
                    letterSpacing: '0.6px',
                    textTransform: 'uppercase',
                    color: '#364153',
                  }}
                >
                  Subject Filter
                </span>
              </div>

              {/* Subject list — independent scroll, always accessible regardless of page scroll */}
              <div className="flex flex-col gap-2 px-5 pb-5">
                <button
                  onClick={() => {
                    setSelectedSubject('All Papers');
                    setSelectedSubtopic(null);
                    setSelectedTopics([]);
                    setExpandedSubject(null);
                    setExpandedSubtopic(null);
                  }}
                  className="w-full flex items-center justify-between rounded-[14px] px-4 py-3 text-left transition-colors"
                  style={{ minHeight: '59.99px', background: selectedSubject === 'All Papers' ? '#0F1A30' : '#F9FAFB' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[18px] leading-none flex-shrink-0" aria-hidden>📘</span>
                    <span style={{ fontFamily: selectedSubject === 'All Papers' ? 'Arimo, sans-serif' : 'Inter, sans-serif', fontWeight: selectedSubject === 'All Papers' ? 700 : 500, fontSize: '14px', lineHeight: '20px', color: selectedSubject === 'All Papers' ? '#FFFFFF' : '#101828' }}>
                      All Papers
                    </span>
                  </div>
                </button>
                {mode === 'mains' && (
                  <div style={{ paddingBottom: 4 }}>
                    <div style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 600,
                      fontSize: 11,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase' as const,
                      color: '#9AA3B2',
                      marginBottom: 6,
                      paddingLeft: 4,
                    }}>
                      Optional Subject
                    </div>
                    <div style={{ position: 'relative' }}>
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
                        style={{
                          width: '100%',
                          padding: '10px 32px 10px 12px',
                          border: MAINS_OPTIONAL_ALL.includes(selectedSubject) ? '1.5px solid #0F1A30' : '1.5px solid #E5E7EB',
                          borderRadius: 12,
                          background: MAINS_OPTIONAL_ALL.includes(selectedSubject) ? '#0F1A30' : '#F9FAFB',
                          color: MAINS_OPTIONAL_ALL.includes(selectedSubject) ? '#FFFFFF' : '#374151',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: 'pointer',
                          outline: 'none',
                          appearance: 'none' as any,
                          WebkitAppearance: 'none' as any,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <option value="">— Select Optional Subject —</option>
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
                      <span style={{
                        position: 'absolute',
                        right: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: MAINS_OPTIONAL_ALL.includes(selectedSubject) ? '#FFFFFF' : '#9AA3B2',
                        fontSize: 12,
                        pointerEvents: 'none' as const,
                      }}>▾</span>
                    </div>
                  </div>
                )}
                {PYQ_SUBJECT_TREE[mode].map(({ label, icon, children }) => {
                  const selected = selectedSubject === label;
                  const expanded = expandedSubject === label;
                  const subjectCount = subjectQuestionCounts.get(countKey(label)) || 0;
                  return (
                    <div
                      key={`tree-${label}`}
                      className="overflow-hidden rounded-[14px] border transition-colors"
                      style={{
                        borderColor: expanded ? '#E5E7EB' : 'transparent',
                        background: expanded ? '#F9FAFB' : 'transparent',
                      }}
                    >
                      <button
                        onClick={() => {
                          setSelectedSubject(label);
                          setSelectedSubtopic(null);
                          setSelectedTopics([]);
                          setExpandedSubtopic(null);
                          setExpandedSubject(expanded ? null : label);
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
                        style={{
                          minHeight: '59.99px',
                          background: selected ? '#0F1A30' : expanded ? '#EEF1F6' : '#F9FAFB',
                          borderRadius: expanded ? '14px 14px 0 0' : '14px',
                        }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-[18px] leading-none flex-shrink-0" aria-hidden>{icon}</span>
                          <span style={{ fontFamily: selected ? 'Arimo, sans-serif' : 'Inter, sans-serif', fontWeight: selected ? 700 : 500, fontSize: '14px', lineHeight: '20px', color: selected ? '#FFFFFF' : '#101828' }}>
                            {label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full border border-[#E5E7EB] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#9AA3B2]">
                            {subjectCount}
                          </span>
                          {children?.length ? (
                            <span
                              className="inline-block transition-transform"
                              style={{
                                color: selected ? '#FFFFFF' : '#9AA3B2',
                                fontSize: '12px',
                                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                              }}
                            >
                              ▾
                            </span>
                          ) : null}
                        </div>
                      </button>
                      {expanded && children?.length ? (
                        <div className="border-t border-[#E5E7EB] bg-transparent">
                          {children.map((child) => {
                            const childSelected = selectedSubtopic === child.label;
                            const childExpanded = expandedSubtopic === child.label;
                            const topicCount = child.microTopics?.length || 0;
                            const childQuestionCount = subSubjectQuestionCounts.get(countKey(label, child.label)) || 0;
                            const isActiveLeaf = childSelected && !topicCount;
                            return (
                              <div key={child.label} className="border-b border-[#E8ECF2] last:border-b-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextExpanded = childExpanded ? null : child.label;
                                    setExpandedSubtopic(nextExpanded);
                                    setSelectedSubtopic(childSelected && !topicCount ? null : child.label);
                                    setSelectedTopics([]);
                                  }}
                                  className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors"
                                  style={{ background: isActiveLeaf ? '#0F1A30' : '#FAFBFE' }}
                                >
                                  <div className="flex min-w-0 items-center gap-2">
                                    <span
                                      className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                                      style={{ background: isActiveLeaf ? '#FFFFFF' : '#9AA3B2' }}
                                    />
                                    <span
                                      className="truncate"
                                      style={{
                                        color: isActiveLeaf ? '#FFFFFF' : (childSelected || childExpanded ? '#2563EB' : '#5A6478'),
                                        fontFamily: 'Inter, sans-serif',
                                        fontSize: '12px',
                                        fontWeight: childSelected || childExpanded ? 700 : 500,
                                      }}
                                    >
                                      {child.label}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="rounded-full border border-[#E5E7EB] bg-[#EDF0F5] px-1.5 py-0.5 text-[10px] font-semibold text-[#9AA3B2]">
                                      {childQuestionCount}
                                    </span>
                                    {topicCount ? (
                                      <span
                                        className="inline-block text-[10px] text-[#9AA3B2] transition-transform"
                                        style={{ transform: childExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                      >
                                        ▾
                                      </span>
                                    ) : null}
                                  </div>
                                </button>
                                {childExpanded && child.microTopics?.length ? (
                                  <div className="border-t border-[#E8ECF2] bg-white">
                                    {child.microTopics.map((topic) => (
                                      <button
                                        key={topic}
                                        type="button"
                                        onClick={() => {
                                          setSelectedSubtopic(child.label);
                                          setSelectedTopics((prev) =>
                                            prev.includes(topic)
                                              ? prev.filter((t) => t !== topic)
                                              : [...prev, topic]
                                          );
                                        }}
                                        className="flex w-full items-center justify-between border-b border-[#E8ECF2] px-4 py-2 pl-[52px] text-left transition-colors last:border-b-0 hover:bg-[#FFF8E6]"
                                        style={{
                                          background: selectedTopics.includes(topic) ? '#FFF3CC' : 'transparent',
                                        }}
                                      >
                                        <span className="flex min-w-0 items-center gap-2">
                                          <span
                                            className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-[3px] border text-[9px]"
                                            style={{
                                              background: selectedTopics.includes(topic) ? '#FDBA26' : 'transparent',
                                              borderColor: selectedTopics.includes(topic) ? '#FDBA26' : '#E5E7EB',
                                              color: '#101828',
                                            }}
                                          >
                                            {selectedTopics.includes(topic) ? '✓' : ''}
                                          </span>
                                          <span
                                            className="break-words"
                                            style={{
                                              color: selectedTopics.includes(topic) ? '#B45309' : '#5A6478',
                                              fontSize: '12px',
                                              fontWeight: selectedTopics.includes(topic) ? 700 : 500,
                                            }}
                                          >
                                            {topic}
                                          </span>
                                        </span>
                                        <span className="ml-3 rounded-full border border-[#E5E7EB] bg-[#EDF0F5] px-1.5 py-0.5 text-[10px] font-semibold text-[#9AA3B2]">
                                          {getTopicQuestionCount(label, child.label, topic)}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ background: 'rgba(15,23,42,0.5)' }}
          onClick={() => setShowMainsWriteModal(false)}
        >
          <div
            className="rounded-[24px] bg-white flex flex-col my-8 overflow-hidden"
            style={{
              width: '896px',
              maxWidth: '100%',
              minHeight: '875px',
              opacity: 1,
              boxShadow: '0px 4px 6px -4px #0000001A, 0px 10px 15px -3px #0000001A',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '32px 32px 32px 32px', display: 'flex', flexDirection: 'column', gap: 0, flex: 1 }}>
              {/* Header row: 2024, GS Paper I, Modern India, 15M, bookmark */}
              <div
                className="flex items-center justify-between flex-wrap gap-2"
                style={{ width: 832, maxWidth: '100%', height: 40 }}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedQuestion?.year && (
                  <div
                    className="flex items-center justify-center gap-1.5 rounded-[10px] flex-shrink-0 px-3"
                    style={{ height: 32, background: '#1E2939' }}
                  >
                    <span aria-hidden style={{ fontSize: 14 }}>📅</span>
                    <span style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 14, lineHeight: '20px', color: '#FFFFFF' }}>{selectedQuestion.year}</span>
                  </div>
                  )}
                  {selectedQuestion?.paper && (
                  <div
                    className="rounded-[10px] flex items-center justify-center flex-shrink-0 px-3"
                    style={{ height: 33.6, border: '0.8px solid #D1D5DC', background: '#FFFFFF' }}
                  >
                    <span style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 14, lineHeight: '20px', color: '#364153' }}>{selectedQuestion.paper}</span>
                  </div>
                  )}
                  {selectedQuestion?.subject && (
                  <div
                    className="rounded-[10px] flex items-center justify-center flex-shrink-0 px-3"
                    style={{ height: 33.6, border: '0.8px solid #D1D5DC', background: '#FFFFFF' }}
                  >
                    <span style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 14, lineHeight: '20px', color: '#364153' }}>{selectedQuestion.subject}</span>
                  </div>
                  )}

                </div>
                <div className="flex items-center gap-2">
                  <button type="button" className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#F3F4F6' }} aria-label="Bookmark">🔖</button>
                  <button type="button" onClick={() => { setShowMainsWriteModal(false); }} className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-[18px] font-bold" style={{ background: '#1E2939', color: '#FFF' }} aria-label="Close">×</button>
                </div>
              </div>

              {/* Question text */}
              <QuestionTextRenderer
                text={selectedQuestion?.questionText || 'Loading question...'}
                className="mt-6"
                style={{ width: 832, maxWidth: '100%' }}
                textClassName="font-[Inter] font-normal text-[16px] leading-[26px] text-[#1E2939]"
              />

              {/* Steps: 1 Write, 2 Upload, 3 AI Eval */}
              <div className="flex items-center gap-3" style={{ width: 832, maxWidth: '100%', marginTop: 24, height: 32 }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#3B52D4' }}>
                    <span style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 14, lineHeight: '20px', color: '#FFFFFF' }}>1</span>
                  </div>
                  <span style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 14, lineHeight: '20px', color: '#3B52D4' }}>Write</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#E5E7EB' }}>
                    <span style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 14, lineHeight: '20px', color: '#6A7282' }}>2</span>
                  </div>
                  <span style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 14, lineHeight: '20px', color: '#99A1AF' }}>Upload</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#E5E7EB' }}>
                    <span style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 14, lineHeight: '20px', color: '#6A7282' }}>3</span>
                  </div>
                  <span style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 14, lineHeight: '20px', color: '#99A1AF' }}>AI Eval</span>
                </div>
              </div>

              {/* Specs bar */}
              <div
                className="flex items-center justify-between rounded-[14px]"
                style={{ width: 832, maxWidth: '100%', marginTop: 24, height: 69.6, padding: '0 16px', border: '0.8px solid #E5E7EB', background: '#F9FAFB' }}
              >
                <div className="flex items-center" style={{ gap: 24 }}>
                  <span className="flex items-center gap-2" style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 14, color: '#4A5565' }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#4A5565" strokeWidth="1"/><path d="M8 5V8.5L10 10" stroke="#4A5565" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    7–9 min
                  </span>
                  <span className="flex items-center gap-2" style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 14, color: '#4A5565' }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10.5 2.5L13.5 5.5L5.5 13.5L2 14L2.5 10.5L10.5 2.5Z" stroke="#16A34A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    ~100 words
                  </span>
                  <span className="flex items-center gap-2" style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 14, color: '#4A5565' }}>
                    <span style={{ color: '#FF6900' }}>🏆</span>
                    {selectedQuestion?.marks || selectedQuestion?.maxMarks || 15} marks
                  </span>
                </div>
                <div className="flex items-center" style={{ gap: 16 }}>
                  <span style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 24, color: mainsTimeLeft <= 60 ? '#DC2626' : '#1E2939' }}>
                    {Math.floor(mainsTimeLeft / 60)}:{String(mainsTimeLeft % 60).padStart(2, '0')}
                  </span>
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
                    className="flex items-center justify-center gap-2"
                    style={{ height: 36, padding: '0 16px', borderRadius: 10, background: '#F3F4F6', border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontWeight: 600, fontSize: 14, color: '#364153', whiteSpace: 'nowrap' }}
                  >
                    {mainsReadTimeLeft !== null
                      ? <><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 2L10 6L3 10V2Z" fill="#364153"/></svg> Start now</>
                      : mainsTimerPaused
                      ? <><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 2L10 6L3 10V2Z" fill="#364153"/></svg> Resume</>
                      : <><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="2" y="2" width="3" height="8" rx="1" fill="#364153"/><rect x="7" y="2" width="3" height="8" rx="1" fill="#364153"/></svg> Pause</>
                    }
                  </button>
                  {mainsReadTimeLeft !== null && (
                    <span style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 13, color: '#155DFC' }}>Auto-start in {mainsReadTimeLeft}s</span>
                  )}
                  {mainsTimeLeft <= 60 && mainsTimeLeft > 0 && (
                    <span style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 13, color: '#DC2626' }}>Hurry up!</span>
                  )}
                </div>
              </div>

              {/* Buttons: View Key Points, Ready to Upload */}
              <div className="flex items-center gap-3 flex-wrap" style={{ width: 832, maxWidth: '100%', marginTop: 24, gap: 12 }}>
                <button type="button" className="flex items-center justify-center gap-2 rounded-[14px] px-5 py-3" style={{ border: '1.6px solid #D1D5DC', background: '#FFFFFF', fontFamily: 'Inter', fontWeight: 600, fontSize: 16, lineHeight: '24px', color: '#364153' }}><span aria-hidden>📄</span>View Key Points</button>
                <button type="button" onClick={() => mainsFileInputRef.current?.click()} className="flex items-center justify-center gap-2 rounded-[14px] px-5 py-3" style={{ background: '#101828', fontFamily: 'Inter', fontWeight: 600, fontSize: 16, lineHeight: '24px', color: '#FFFFFF' }}><span aria-hidden>📷</span>Upload Handwritten Answer</button>
              </div>

              {/* Answer textarea */}
              <div style={{ width: 832, maxWidth: '100%', marginTop: 16, order: 2 }}>
                <button type="button" onClick={() => setTextAnswerExpanded((v) => !v)} className="w-full flex items-center gap-3">
                  <div className="flex-1 h-px bg-[#E5E7EB]" />
                  <span style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 14, color: '#364153' }}>
                    Type your answer {textAnswerExpanded ? '−' : '+'}
                  </span>
                  <div className="flex-1 h-px bg-[#E5E7EB]" />
                </button>
                {textAnswerExpanded && (
                  <div style={{ marginTop: 12 }}>
                    <textarea
                      value={mainsAnswerText}
                      onChange={(e) => setMainsAnswerText(e.target.value)}
                      placeholder="Write your answer here..."
                      className="w-full rounded-[14px] p-4 resize-y"
                      style={{ minHeight: 200, border: '1.6px solid #D1D5DC', fontFamily: 'Inter', fontSize: 15, lineHeight: '24px', color: '#1E2939', outline: 'none' }}
                    />
                    <div className="flex justify-end mt-1" style={{ fontFamily: 'Inter', fontSize: 13, color: '#6A7282' }}>
                      {mainsAnswerText.trim().split(/\s+/).filter(Boolean).length} words
                    </div>
                  </div>
                )}
              </div>

              {/* Upload area */}
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
                className="rounded-[16px] flex flex-col items-center justify-center text-center cursor-pointer"
                style={{ width: 832, maxWidth: '100%', marginTop: 16, padding: '50px 50px', border: mainsFiles.length > 0 ? '1.6px solid #3B52D4' : '1.6px solid #D1D5DC', background: mainsFiles.length > 0 ? '#EFF6FF' : '#FFF', order: 1 }}
                onClick={() => mainsFileInputRef.current?.click()}
              >
                {/* Camera icon in gray square */}
                <div style={{ width: 64, height: 64, borderRadius: 16, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  {mainsFiles.length > 0
                    ? <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M5 27L27 5" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"/><circle cx="16" cy="16" r="10" stroke="#22C55E" strokeWidth="2"/></svg>
                    : <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M12 8H20L22 11H27C27.55 11 28 11.45 28 12V24C28 24.55 27.55 25 27 25H5C4.45 25 4 24.55 4 24V12C4 11.45 4.45 11 5 11H10L12 8Z" stroke="#9CA3AF" strokeWidth="1.5" strokeLinejoin="round"/><circle cx="16" cy="18" r="4" stroke="#9CA3AF" strokeWidth="1.5"/></svg>
                  }
                </div>
                <p style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 18, lineHeight: '28px', color: '#1E2939', marginBottom: 8 }}>
                  {mainsFiles.length > 1
                    ? `${mainsFiles.length} pages selected`
                    : mainsFile ? mainsFile.name : 'Photograph your handwritten answer & upload'}
                </p>
                {mainsFiles.length > 1 && (
                  <div style={{ fontFamily: 'Inter', fontSize: 13, color: '#4B5563', marginBottom: 12 }}>
                    {mainsFiles.map((file, index) => (
                      <div key={`${file.name}-${index}`}>Page {index + 1}: {file.name}</div>
                    ))}
                  </div>
                )}
                {!mainsFile && (
                  <p style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 14, lineHeight: '20px', color: '#6A7282', marginBottom: 16 }}>
                    Take clear photos of all pages, then select them in order. Good lighting = better AI evaluation.
                  </p>
                )}
                {mainsFile
                  ? <span style={{ fontFamily: 'Inter', fontSize: 13, color: '#6A7282' }}>Click to change files</span>
                  : (
                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                      {['JPG', 'PNG', 'PDF'].map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => mainsFileInputRef.current?.click()}
                          style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 14, color: '#155DFC', background: '#EFF6FF', border: '0.8px solid #BEDBFF', borderRadius: 10, height: 37.6, padding: '0 18px', cursor: 'pointer' }}
                        >{fmt}</button>
                      ))}
                    </div>
                  )
                }
              </div>

              {/* Submit for AI Evaluation */}
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
                    }
                  } catch (err: any) {
                    setMainsSubmitError(err.message || 'Failed to submit. Please try again.');
                  } finally {
                    setMainsSubmitting(false);
                  }
                }}
                className="w-full flex items-center justify-center gap-2 rounded-[16px] py-4 mt-4 disabled:opacity-50"
                style={{ width: 832, maxWidth: '100%', height: 60, background: '#0F172B', fontFamily: 'Inter', fontWeight: 700, fontSize: 18, lineHeight: '28px', color: '#F9FAFB' }}
              >
                <span aria-hidden>📤</span>{mainsSubmitting ? 'Submitting...' : 'Submit for AI Evaluation'}
              </button>

              {mainsSubmitError && (
                <div className="mt-3 text-sm text-red-600" style={{ fontFamily: 'Inter', width: 832, maxWidth: '100%' }}>
                  {mainsSubmitError}
                </div>
              )}

              {/* Footer: views/evals stats | Save + Get AI Eval */}
              <div className="flex items-center justify-between flex-wrap gap-3" style={{ width: 832, maxWidth: '100%', marginTop: 16, paddingTop: 16, borderTop: '0.8px solid #E5E7EB' }}>
                <div className="flex items-center" style={{ gap: 24 }}>
                  <span className="flex items-center gap-2" style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 14, color: '#6A7282' }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><ellipse cx="8" cy="8" rx="7" ry="4.5" stroke="#6A7282" strokeWidth="1"/><circle cx="8" cy="8" r="2" stroke="#6A7282" strokeWidth="1"/></svg>
                    {(selectedQuestion as any)?.views || 120} views
                  </span>
                  <span className="flex items-center gap-2" style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 14, color: '#6A7282' }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#16A34A" strokeWidth="1"/><path d="M5 8L7 10.5L11 5.5" stroke="#16A34A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    {(selectedQuestion as any)?.aiEvalsDone || 34} AI evals done
                  </span>
                  <span className="flex items-center gap-2" style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 14, color: '#6A7282' }}>
                    <span>⭐</span>
                    {(selectedQuestion as any)?.avgRating || '3.9'}/5 avg
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" className="flex items-center justify-center gap-2 rounded-[14px]" style={{ height: 45.6, padding: '0 20px', border: '0.8px solid #D1D5DC', background: '#FFFFFF', fontFamily: 'Inter', fontWeight: 600, fontSize: 16, color: '#364153' }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 14V11L11 2L14 5L5 14H2Z" stroke="#364153" strokeWidth="1.2" strokeLinejoin="round"/><path d="M9 4L12 7" stroke="#364153" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => document.getElementById('pyq-mains-submit-btn')?.click()}
                    className="flex items-center justify-center rounded-[14px]"
                    style={{ height: 45.6, padding: '0 20px', background: 'linear-gradient(90deg, #FF8904 0%, #FF6900 100%)', boxShadow: '0px 4px 6px 0px rgba(0,0,0,0.1), 0px 2px 4px 0px rgba(0,0,0,0.1)', fontFamily: 'Inter', fontWeight: 700, fontSize: 16, color: '#FFFFFF' }}
                  >
                    Submit Answer for Evaluation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI is evaluating your answers... modal - opens after Submit for AI Evaluation */}
      {showAiEvalModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
        >
          <div
            className="rounded-[24px] flex flex-col items-center text-center px-10 py-10 max-w-md w-full"
            style={{
              background: 'linear-gradient(180deg, #1E3A5F 0%, #0F172B 100%)',
              boxShadow: '0px 25px 50px -12px rgba(0,0,0,0.5)',
            }}
          >
            <div className="mb-4" style={{ fontSize: 48 }} aria-hidden>🧠</div>
            <h2
              className="font-bold mb-2"
              style={{ fontFamily: 'Inter', fontSize: 22, lineHeight: 1.3, color: '#FFFFFF' }}
            >
              AI is evaluating your answers...
            </h2>
            <p
              className="mb-6"
              style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 14, lineHeight: 1.4, color: '#94A3B8' }}
            >
              This usually takes about 30 seconds
            </p>
            {/* Progress bar - fills over 30 seconds */}
            <div
              className="w-full h-2 rounded-full mb-8 overflow-hidden"
              style={{ background: '#334155', maxWidth: 320 }}
            >
              <div
                className="h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${aiEvalProgress}%`, background: 'linear-gradient(90deg, #FBBF24 0%, #F59E0B 100%)' }}
              />
            </div>
            {/* Evaluation steps - advance over 30 seconds */}
            <div className="flex flex-col gap-3 w-full text-left" style={{ maxWidth: 320 }}>
              {AI_EVAL_STEPS.map((text, i) => {
                const done = i < aiEvalStepIndex;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[12px]"
                      style={{
                        background: done ? '#FBBF24' : '#334155',
                        color: done ? '#0F172B' : '#64748B',
                      }}
                    >
                      {done ? '✓' : ''}
                    </span>
                    <span
                      style={{
                        fontFamily: 'Inter',
                        fontWeight: done ? 600 : 400,
                        fontSize: 14,
                        lineHeight: '20px',
                        color: done ? '#FBBF24' : '#94A3B8',
                      }}
                    >
                      {text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
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
              textClassName="font-[Inter] font-normal text-[18px] leading-[29.25px] text-[#1E2939]"
            />

            {/* Options */}
            <div style={{ width: '824px', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(selectedQuestion?.options ?? []).map((opt: any) => {
                const isSelected = selectedAnswer === opt.label;
                const isCorrect  = opt.label === selectedQuestion?.correctOption;

                let bg = '#F9FAFB', border = '0.8px solid #E5E7EB', labelBg = '#D1D5DC', labelColor = '#364153';
                if (!hasSubmitted && isSelected) {
                  bg = '#EFF6FF'; border = '1.6px solid #3B82F6'; labelBg = '#3B82F6'; labelColor = '#fff';
                }
                if (hasSubmitted && isCorrect) {
                  bg = '#F0FDF4'; border = '1.6px solid #00C950'; labelBg = '#00A63E'; labelColor = '#fff';
                }
                if (hasSubmitted && isSelected && !isCorrect) {
                  bg = '#FEF2F2'; border = '1.6px solid #FB2C36'; labelBg = '#E7000B'; labelColor = '#fff';
                }

                return (
                  <button
                    key={opt.label}
                    disabled={hasSubmitted}
                    onClick={() => setSelectedAnswer(opt.label)}
                    className="w-full flex items-center gap-3 rounded-[14px] pl-4 py-3 text-left transition-colors"
                    style={{ minHeight: 65, background: bg, border }}
                  >
                    <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 text-[16px] font-bold"
                         style={{ background: labelBg, color: labelColor }}>
                      {opt.label}
                    </div>
                    <span style={{ fontWeight: (hasSubmitted && (isCorrect || isSelected)) ? 500 : 400, fontSize: '16px', color: '#1E2939' }}>
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Explanation – shown only after submit */}
            {hasSubmitted && selectedQuestion?.explanation && (
              <div style={{ width: '774.4px', maxWidth: '100%' }}>
                <div className="flex items-center gap-2 mb-2" style={{ color: '#016630', fontWeight: 700, fontSize: '14px', textTransform: 'uppercase' }}>
                  <span>✅</span><span>Explanation</span>
                </div>
                <p style={{ fontSize: '16px', color: '#364153', lineHeight: '26px', marginBottom: 12 }}>
                  {selectedQuestion.explanation}
                </p>
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
  );
}
