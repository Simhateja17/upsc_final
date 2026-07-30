'use client';

import React, { useState, useEffect, useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DashboardPageHero from '@/components/DashboardPageHero';
import UploadedAnswerFiles from '@/components/UploadedAnswerFiles';
import CuratedModelAnswer from '@/components/mains-results/CuratedModelAnswer';
import { bookmarkService, flashcardService, pyqService, spacedRepService } from '@/lib/services';
import QuestionTextRenderer from '@/components/QuestionTextRenderer';
import StructuredQuestionRenderer from '@/components/StructuredQuestionRenderer';
import { handleEntitlementError, formatPeriod } from '@/components/entitlements';
import { useEntitlements } from '@/contexts/EntitlementsContext';
import { MainsEvaluationLimitModal } from '@/components/upgrade/UpgradeModals';
import { getSubjectMetaStyle } from '@/lib/subjectPalette';
import { isEssayQuestion } from '@/lib/essayModelAnswer';

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
  taxonomyLabels?: {
    level1: string;
    level2: string;
    level3: string;
  };
};

type FilterId = 'paper' | 'subject' | 'subSubject' | 'topic' | 'year';

const EMPTY_COUNTS: PYQCountData = {
  total: 0,
  bySubject: [],
  bySubSubject: [],
  byTopic: [],
};

const SUBJECT_ICONS: Record<string, string> = {
  'Ancient History': '🏺',
  'Art & Culture': '🎭',
  History: '🏛️',
  'Medieval India': '🏰',
  'Modern History': '🇮🇳',
  'Indian Society': '👥',
  Geography: '🌍',
  Polity: '⚖️',
  Governance: '🏛️',
  'Social Justice': '🤝',
  Economy: '💰',
  'Environment & Ecology': '🌿',
  'Science & Technology': '🔬',
  'Internal Security': '🛡️',
  'Disaster Management': '🚨',
  Ethics: '🧭',
  Essay: '✍️',
  'Optional Paper 1': '📓',
  'Optional Paper 2': '📔',
  'International Relation': '🌐',
  'International Relations': '🌐',
  'Current Affairs': '📰',
};

const iconForSubject = (subject: string) => {
  if (SUBJECT_ICONS[subject]) return SUBJECT_ICONS[subject];
  const normalized = subject.toLowerCase();
  if (normalized.includes('history')) return '🏛️';
  if (normalized.includes('culture')) return '🎭';
  if (normalized.includes('geography')) return '🌍';
  if (normalized.includes('polity')) return '⚖️';
  if (normalized.includes('econom')) return '💰';
  if (normalized.includes('environment')) return '🌿';
  if (normalized.includes('science')) return '🔬';
  if (normalized.includes('international')) return '🌐';
  return '📘';
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
          if (typeof item.demand === 'string') {
            const status = typeof item.status === 'string' ? humanizeKey(item.status) : '';
            return status ? `${item.demand} -> ${status}` : item.demand;
          }
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

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'general';

const getExplanationText = (question: any) =>
  question?.explanation ||
  question?.structuredJson?.explanation?.displayText ||
  question?.structuredJson?.explanation?.rawText ||
  '';

const getExplanationConclusion = (question: any, structured: any) => {
  const suppliedConclusion = String(structured?.conclusion || '').trim();
  if (suppliedConclusion) return suppliedConclusion;

  const correctOption = String(question?.correctOption || '').trim();
  const correctOptionText = Array.isArray(question?.options)
    ? String(question.options.find((option: any) => option?.label === correctOption)?.text || '').trim()
    : '';

  if (correctOption && correctOptionText) {
    return `Hence, option ${correctOption} (${correctOptionText}) is the correct answer.`;
  }
  if (correctOption) return `Hence, option ${correctOption} is the correct answer.`;
  return 'Hence, refer to the highlighted correct option as the answer.';
};

function ExplanationRenderer({ question }: { question: any }) {
  const explanation = getExplanationText(question);
  const structured = question?.structuredJson?.explanation?.structured;
  const conclusion = getExplanationConclusion(question, structured);
  const paragraphFallback = String(explanation || '')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const sections = [
    ['statement_analysis', 'Statement Analysis'],
    ['pair_analysis', 'Pair Analysis'],
    ['option_analysis', 'Option Analysis'],
  ] as const;

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
        <section className="rounded-[12px] bg-white/70 p-3" style={{ border: '1px solid #BBF7D0' }}>
          <h4 className="mb-2 text-[13px] font-bold uppercase tracking-[0.06em]" style={{ color: '#016630' }}>
            Conclusion
          </h4>
          <p style={{ fontSize: '15px', color: '#364153', lineHeight: '26px', whiteSpace: 'pre-wrap' }}>
            {conclusion}
          </p>
        </section>
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
      <section className="rounded-[12px] bg-white/70 p-3" style={{ border: '1px solid #BBF7D0' }}>
        <h4 className="mb-2 text-[13px] font-bold uppercase tracking-[0.06em]" style={{ color: '#016630' }}>
          Conclusion
        </h4>
        <p style={{ fontSize: '15px', color: '#364153', lineHeight: '26px', whiteSpace: 'pre-wrap' }}>
          {conclusion}
        </p>
      </section>
    </div>
  );
}

function ModelAnswerRenderer({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="mb-4 mt-6 text-[24px] font-bold leading-[32px] text-[#101828] first:mt-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-3 mt-6 text-[21px] font-bold leading-[30px] text-[#101828] first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-3 mt-5 text-[18px] font-bold leading-[28px] text-[#111827] first:mt-0">{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="mb-2 mt-5 text-[16px] font-bold leading-[26px] text-[#1E2939] first:mt-0">{children}</h4>
        ),
        p: ({ children }) => (
          <p className="mb-4 text-[15.5px] leading-[27px] text-[#364153] last:mb-0">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="mb-5 ml-5 list-disc space-y-2 text-[15.5px] leading-[27px] text-[#364153]">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-5 ml-5 list-decimal space-y-2 text-[15.5px] leading-[27px] text-[#364153]">{children}</ol>
        ),
        li: ({ children }) => <li className="pl-1">{children}</li>,
        strong: ({ children }) => <strong className="font-bold text-[#111827]">{children}</strong>,
        blockquote: ({ children }) => (
          <blockquote className="my-4 border-l-4 border-[#E8B84B] bg-[#FFFBEB] px-4 py-3 text-[#364153]">
            {children}
          </blockquote>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

type EssayPartKey = 'topicDecoding' | 'modelEssay' | 'valueAdditionRepository';

const ESSAY_PART_LABELS: Record<EssayPartKey, string> = {
  topicDecoding: 'Topic Decoding',
  modelEssay: 'Model Essay',
  valueAdditionRepository: 'Value Addition Repository',
};

const getEssayModelAnswerParts = (question: any): Array<{ key: EssayPartKey; label: string; text: string }> => {
  const parts = question?.structuredJson?.essay?.parts;
  if (!parts || typeof parts !== 'object') return [];

  return (['topicDecoding', 'modelEssay', 'valueAdditionRepository'] as EssayPartKey[])
    .map((key) => ({
      key,
      label: ESSAY_PART_LABELS[key],
      text: typeof parts[key] === 'string' ? parts[key].trim() : '',
    }))
    .filter((part) => part.text.length > 0);
};

const DEFAULT_MAINS_TIME_LIMIT = 20 * 60;
const ESSAY_MAINS_TIME_LIMIT = 90 * 60;

const MAINS_MARKS_PRESETS: Record<number, { minutes: number; words: number }> = {
  10: { minutes: 7, words: 150 },
  15: { minutes: 11, words: 200 },
  20: { minutes: 14, words: 250 },
};

function getMainsMarks(question: any | null): number {
  if (isEssayQuestion(question)) return 125;
  return question?.marks || question?.maxMarks || 15;
}

function getMainsTimeLimit(question: any | null): number {
  if (isEssayQuestion(question)) return ESSAY_MAINS_TIME_LIMIT;
  const preset = MAINS_MARKS_PRESETS[getMainsMarks(question)];
  return preset ? preset.minutes * 60 : DEFAULT_MAINS_TIME_LIMIT;
}

function getMainsWordLimit(question: any | null): number | string {
  if (isEssayQuestion(question)) return '1000–1200';
  const preset = MAINS_MARKS_PRESETS[getMainsMarks(question)];
  return preset ? preset.words : 250;
}

function EssayModelAnswerRenderer({
  question,
  essayPartOrder,
  onToggleOrder,
}: {
  question: any;
  essayPartOrder: 'decode-first' | 'essay-first';
  onToggleOrder: () => void;
}) {
  const parts = getEssayModelAnswerParts(question);
  if (parts.length === 0) {
    return (
      <ModelAnswerRenderer
        text={question?.modelAnswer || question?.answer || question?.explanation || 'Model answer is being prepared for this question.'}
      />
    );
  }

  const firstTwoKeys: EssayPartKey[] = essayPartOrder === 'essay-first'
    ? ['modelEssay', 'topicDecoding']
    : ['topicDecoding', 'modelEssay'];
  const orderedParts = [...firstTwoKeys, 'valueAdditionRepository']
    .map((key) => parts.find((part) => part.key === key))
    .filter(Boolean) as Array<{ key: EssayPartKey; label: string; text: string }>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#6A7282]">
          Essay Answer Parts
        </div>
        {parts.length > 1 && (
          <button
            type="button"
            onClick={onToggleOrder}
            className="rounded-[10px] border border-[#D8DEE8] bg-white px-3 py-2 text-[13px] font-bold text-[#101828] shadow-sm hover:bg-[#F8FAFC]"
          >
            {essayPartOrder === 'decode-first' ? 'Show Essay First' : 'Show Decoding First'}
          </button>
        )}
      </div>
      <div className="space-y-6">
        {orderedParts.map((part, index) => (
          <section key={part.key} className={index > 0 ? 'border-t border-[#E6E8EE] pt-5' : undefined}>
            <div className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-[#D4AF37]">
              {part.label}
            </div>
            <ModelAnswerRenderer text={part.text} />
          </section>
        ))}
      </div>
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
  const [showMainsQuotaModal, setShowMainsQuotaModal] = useState(false);
  const [expandedModelAnswerIds, setExpandedModelAnswerIds] = useState<Set<string>>(new Set());
  const [essayPartOrder, setEssayPartOrder] = useState<'decode-first' | 'essay-first'>('decode-first');
  const router = useRouter();
  const [mainsBookmarkedIds, setMainsBookmarkedIds] = useState<Set<string>>(new Set());
  const [mainsFlashcardIds, setMainsFlashcardIds] = useState<Set<string>>(new Set());
  const [mainsReviewIds, setMainsReviewIds] = useState<Set<string>>(new Set());
  const [mainsBookmarkBusyIds, setMainsBookmarkBusyIds] = useState<Set<string>>(new Set());
  const [mainsFlashcardBusyIds, setMainsFlashcardBusyIds] = useState<Set<string>>(new Set());
  const [mainsReviewBusyIds, setMainsReviewBusyIds] = useState<Set<string>>(new Set());
  const [prelimsBookmarkedIds, setPrelimsBookmarkedIds] = useState<Set<string>>(new Set());
  const [prelimsFlashcardIds, setPrelimsFlashcardIds] = useState<Set<string>>(new Set());
  const [prelimsReviewIds, setPrelimsReviewIds] = useState<Set<string>>(new Set());
  const [prelimsReviewItemIds, setPrelimsReviewItemIds] = useState<Record<string, string>>({});
  const [prelimsBookmarkBusyIds, setPrelimsBookmarkBusyIds] = useState<Set<string>>(new Set());
  const [prelimsFlashcardBusyIds, setPrelimsFlashcardBusyIds] = useState<Set<string>>(new Set());
  const [prelimsReviewBusyIds, setPrelimsReviewBusyIds] = useState<Set<string>>(new Set());
  const [showAiEvalModal, setShowAiEvalModal] = useState(false);
  const [aiEvalProgress, setAiEvalProgress] = useState(0);
  const [aiEvalStepIndex, setAiEvalStepIndex] = useState(0);
  const [mode, setMode] = useState<'prelims' | 'mains'>('prelims');

  // Mains AI evaluation state
  const [mainsAnswerText, setMainsAnswerText] = useState('');
  const [mainsFile, setMainsFile] = useState<File | null>(null);
  const [mainsFiles, setMainsFiles] = useState<File[]>([]);
  const removeMainsFile = (index: number) => {
    setMainsFiles(prev => {
      const next = prev.filter((_, i) => i !== index);
      setMainsFile(next[0] || null);
      return next;
    });
  };
  const [mainsAttemptId, setMainsAttemptId] = useState<string | null>(null);
  const [mainsSubmitting, setMainsSubmitting] = useState(false);
  const [mainsSubmitError, setMainsSubmitError] = useState<string | null>(null);
  const pageRootRef = useRef<HTMLDivElement>(null);
  const mainsFileInputRef = useRef<HTMLInputElement>(null);
  const [mainsTimeLeft, setMainsTimeLeft] = useState(DEFAULT_MAINS_TIME_LIMIT);
  const [mainsTimerPaused, setMainsTimerPaused] = useState(false);
  const [mainsReadTimeLeft, setMainsReadTimeLeft] = useState<number | null>(null);
  const [textAnswerExpanded, setTextAnswerExpanded] = useState(false);
  const mainsAutoSubmitRef = useRef(false);
  const questionsRequestSeqRef = useRef(0);
  const filterScrollPositionsRef = useRef<Partial<Record<FilterId, number>>>({});

  // Data state
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [navigatingQuestionHref, setNavigatingQuestionHref] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [yearMode, setYearMode] = useState<'all' | 'custom'>('all');
  const [yearSearch, setYearSearch] = useState('');
  const [selectedPapers, setSelectedPapers] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedSubSubjects, setSelectedSubSubjects] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [expandedSubtopic, setExpandedSubtopic] = useState<string | null>(null);
  const [questionCounts, setQuestionCounts] = useState<PYQCountData>(EMPTY_COUNTS);
  const [openFilter, setOpenFilter] = useState<FilterId | null>(null);
  const [filterDocked, setFilterDocked] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const scrollToAnswerSection = useCallback((id: string) => {
    if (typeof window === 'undefined') return;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    });
  }, []);

  const openMainsWriteModal = useCallback((question: any) => {
    setSelectedQuestion(question);
    setMainsAnswerText('');
    setMainsFile(null);
    setMainsFiles([]);
    setMainsSubmitError(null);
    setMainsTimeLeft(getMainsTimeLimit(question));
    setMainsTimerPaused(true);
    setMainsReadTimeLeft(PYQ_READING_WINDOW_SECONDS);
    setTextAnswerExpanded(false);
    mainsAutoSubmitRef.current = false;
    setShowMainsWriteModal(true);
  }, []);

  useEffect(() => {
    if (!openFilter) return;

    const handleOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && !target.closest('[data-pyq-filter-surface]')) {
        setOpenFilter(null);
      }
    };

    document.addEventListener('pointerdown', handleOutsidePointerDown);
    return () => document.removeEventListener('pointerdown', handleOutsidePointerDown);
  }, [openFilter]);

  const handleQuestionNavigation = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }
    setNavigatingQuestionHref(href);
  };

  const toggleMainsBookmark = async (q: any) => {
    if (mainsBookmarkBusyIds.has(q.id)) return;
    setMainsBookmarkBusyIds((prev) => new Set(prev).add(q.id));
    try {
      await bookmarkService.toggle({
        entityType: 'pyq',
        entityId: q.id,
        title: String(q.questionText || '').slice(0, 90),
        source: 'PYQ Mains',
        sourceUrl: `/questions/${q.id}?mode=mains`,
        tag: `${q.year || 'UPSC'} · ${q.subject || 'General'}`,
        content: { mode: 'mains', year: q.year, subject: q.subject, topic: q.topic, difficulty: q.difficulty },
      });
      setMainsBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (next.has(q.id)) next.delete(q.id);
        else next.add(q.id);
        return next;
      });
    } catch {
      // keep prior state - bookmark toggle failed
    } finally {
      setMainsBookmarkBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(q.id);
        return next;
      });
    }
  };

  const addMainsFlashcard = async (q: any) => {
    if (mainsFlashcardBusyIds.has(q.id)) return;
    setMainsFlashcardBusyIds((prev) => new Set(prev).add(q.id));
    try {
      const subject = String(q.subject || 'General Studies');
      const subjectId = slugify(subject);
      const topic = String(q.topic || q.paper || 'Custom');
      const topicId = slugify(topic);
      const answer = q.modelAnswer || q.answer || getExplanationText(q) || 'Refer to the model answer on RiseWithJeet.';
      const res = await flashcardService.createCard({
        subjectId,
        subject,
        topicId,
        topic,
        question: q.questionText,
        answer,
        difficulty: q.difficulty || undefined,
      });
      setMainsFlashcardIds((prev) => new Set(prev).add(q.id));
      const cardId = res?.data?.id;
      router.push(`/dashboard/flashcards/${subjectId}/${topicId}${cardId ? `?cardId=${cardId}` : ''}`);
    } catch {
      // keep prior state - flashcard creation failed
    } finally {
      setMainsFlashcardBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(q.id);
        return next;
      });
    }
  };

  const toggleMainsReview = async (q: any) => {
    if (mainsReviewBusyIds.has(q.id)) return;
    if (mainsReviewIds.has(q.id)) {
      setMainsReviewIds((prev) => {
        const next = new Set(prev);
        next.delete(q.id);
        return next;
      });
      return;
    }
    setMainsReviewBusyIds((prev) => new Set(prev).add(q.id));
    try {
      await spacedRepService.addItem({
        questionText: q.questionText,
        answer: q.modelAnswer || q.answer || getExplanationText(q) || undefined,
        subject: String(q.subject || 'General Studies'),
        source: 'PYQ Mains',
        sourceType: 'pyq',
      });
      setMainsReviewIds((prev) => new Set(prev).add(q.id));
    } catch {
      // keep prior state - review save failed
    } finally {
      setMainsReviewBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(q.id);
        return next;
      });
    }
  };

  const togglePrelimsBookmark = async (q: any) => {
    if (prelimsBookmarkBusyIds.has(q.id)) return;
    setPrelimsBookmarkBusyIds((prev) => new Set(prev).add(q.id));
    try {
      await bookmarkService.toggle({
        entityType: 'pyq',
        entityId: q.id,
        title: String(q.questionText || '').slice(0, 90),
        source: 'PYQ Prelims',
        sourceUrl: `/questions/${q.id}`,
        tag: `${q.year || 'UPSC'} · ${q.subject || 'General'}`,
        content: {
          mode: 'prelims',
          year: q.year,
          subject: q.subject,
          topic: q.topic,
          difficulty: q.difficulty,
          options: q.options,
          correctOption: q.correctOption,
          explanation: getExplanationText(q),
        },
      });
      setPrelimsBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (next.has(q.id)) next.delete(q.id);
        else next.add(q.id);
        return next;
      });
    } catch {
      // keep prior state - bookmark toggle failed
    } finally {
      setPrelimsBookmarkBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(q.id);
        return next;
      });
    }
  };

  const addPrelimsFlashcard = async (q: any) => {
    if (prelimsFlashcardBusyIds.has(q.id)) return;
    setPrelimsFlashcardBusyIds((prev) => new Set(prev).add(q.id));
    try {
      const subject = String(q.subject || 'General Studies');
      const subjectId = slugify(subject);
      const topic = String(q.topic || q.subSubject || 'Custom');
      const topicId = slugify(topic);
      const correctOption = Array.isArray(q.options)
        ? q.options.find((option: any) => option.label === q.correctOption)
        : null;
      const answer = getExplanationText(q) || correctOption?.text || q.correctOption || 'Refer to the explanation on RiseWithJeet.';
      const res = await flashcardService.createCard({
        subjectId,
        subject,
        topicId,
        topic,
        question: q.questionText,
        answer,
        difficulty: q.difficulty || undefined,
      });
      setPrelimsFlashcardIds((prev) => new Set(prev).add(q.id));
      const cardId = res?.data?.id;
      router.push(`/dashboard/flashcards/${subjectId}/${topicId}${cardId ? `?cardId=${cardId}` : ''}`);
    } catch {
      // keep prior state - flashcard creation failed
    } finally {
      setPrelimsFlashcardBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(q.id);
        return next;
      });
    }
  };

  const togglePrelimsReview = async (q: any) => {
    if (prelimsReviewBusyIds.has(q.id)) return;
    setPrelimsReviewBusyIds((prev) => new Set(prev).add(q.id));
    if (prelimsReviewIds.has(q.id)) {
      try {
        const itemId = prelimsReviewItemIds[q.id];
        if (itemId) await spacedRepService.deleteItem(itemId);
        setPrelimsReviewIds((prev) => {
          const next = new Set(prev);
          next.delete(q.id);
          return next;
        });
        setPrelimsReviewItemIds((prev) => {
          const next = { ...prev };
          delete next[q.id];
          return next;
        });
      } catch {
        // keep prior state - review removal failed
      } finally {
        setPrelimsReviewBusyIds((prev) => {
          const next = new Set(prev);
          next.delete(q.id);
          return next;
        });
      }
      return;
    }
    try {
      const correctOption = Array.isArray(q.options)
        ? q.options.find((option: any) => option.label === q.correctOption)
        : null;
      const res = await spacedRepService.addItem({
        questionText: q.questionText,
        answer: getExplanationText(q) || correctOption?.text || q.correctOption || undefined,
        subject: String(q.subject || 'General Studies'),
        source: 'PYQ Prelims',
        sourceType: 'pyq',
      });
      setPrelimsReviewIds((prev) => new Set(prev).add(q.id));
      const itemId = res?.data?.id;
      if (itemId) setPrelimsReviewItemIds((prev) => ({ ...prev, [q.id]: itemId }));
    } catch {
      // keep prior state - review save failed
    } finally {
      setPrelimsReviewBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(q.id);
        return next;
      });
    }
  };

  const fetchQuestions = useCallback(async () => {
    const requestSeq = ++questionsRequestSeqRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await pyqService.getQuestions({
        mode,
        years: yearMode === 'custom' && selectedYears.length > 0 ? selectedYears : undefined,
        paper: selectedPapers.length ? selectedPapers : undefined,
        subject: selectedSubjects.length ? selectedSubjects : undefined,
        subSubject: selectedSubSubjects.length ? selectedSubSubjects : undefined,
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
  }, [mode, yearMode, selectedYears, selectedPapers, selectedSubjects, selectedSubSubjects, selectedTopics, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [mode, yearMode, selectedYears, selectedPapers, selectedSubjects, selectedSubSubjects, selectedTopics]);

  useEffect(() => {
    questionsRequestSeqRef.current += 1;
    setQuestions([]);
    setTotal(0);
    setTotalPages(0);
    setSelectedQuestion(null);
    setShowMainsWriteModal(false);
    setExpandedModelAnswerIds(new Set());
    setShowAttemptModal(false);
    setSelectedPapers([]);
    setSelectedSubjects([]);
    setSelectedSubSubjects([]);
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
    if (mode !== 'prelims' || questions.length === 0) {
      setPrelimsReviewIds(new Set());
      setPrelimsReviewItemIds({});
      return;
    }

    let cancelled = false;
    spacedRepService.getItems()
      .then((res) => {
        if (cancelled) return;
        const items: Array<{ id: string; questionText: string; source?: string; sourceType?: string }> = res.data?.items || res.data || [];
        const pyqPrelimsItems = new Map(
          items
            .filter((item) => item.sourceType === 'pyq' && item.source === 'PYQ Prelims')
            .map((item) => [item.questionText, item.id])
        );
        const nextReviewIds = new Set<string>();
        const nextReviewItemIds: Record<string, string> = {};
        questions.forEach((question) => {
          const itemId = pyqPrelimsItems.get(question.questionText);
          if (itemId) {
            nextReviewIds.add(question.id);
            nextReviewItemIds[question.id] = itemId;
          }
        });
        setPrelimsReviewIds(nextReviewIds);
        setPrelimsReviewItemIds(nextReviewItemIds);
      })
      .catch(() => {
        // Review-state hydration is non-blocking; action buttons stay usable.
      });

    return () => { cancelled = true; };
  }, [mode, questions]);

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

  const subjectTree = useMemo(() => {
    const dynamicSubjects = questionCounts.bySubject
      .filter((row) => row.subject)
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
          icon: iconForSubject(label),
          children: children.length ? children : undefined,
        };
      });

    return dynamicSubjects;
  }, [questionCounts.bySubject, questionCounts.bySubSubject, questionCounts.byTopic]);

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
          setAiEvalProgress(100);
          setAiEvalStepIndex(AI_EVAL_STEPS.length);
          setShowAiEvalModal(false);
          // Hand off to the dedicated results page (shared Daily-style UI).
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(
              'pyqMainsResultsSession',
              JSON.stringify({ questionId: selectedQuestion.id, attemptId: mainsAttemptId })
            );
          }
          router.push(`/dashboard/pyq/results?questionId=${encodeURIComponent(selectedQuestion.id)}&attemptId=${encodeURIComponent(mainsAttemptId)}`);
        }
      } catch (err) {
        console.error('Polling eval status failed:', err);
      }
    }, 3000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(pollInterval);
    };
  }, [showAiEvalModal, mainsAttemptId, selectedQuestion, router]);

  const hasActiveFilters =
    yearMode === 'custom' ||
    selectedPapers.length > 0 ||
    selectedSubjects.length > 0 ||
    selectedSubSubjects.length > 0 ||
    selectedTopics.length > 0;

  const selectedSubjectKeys = useMemo(
    () => new Set(selectedSubjects.map((s) => countKey(s))),
    [selectedSubjects]
  );
  const selectedSubSubjectKeys = useMemo(
    () => new Set(selectedSubSubjects.map((s) => countKey(s))),
    [selectedSubSubjects]
  );

  // Subject-tree nodes for every currently selected subject.
  const currentSubjectNodes = useMemo(
    () => subjectTree.filter((node) => selectedSubjectKeys.has(countKey(node.label))),
    [subjectTree, selectedSubjectKeys]
  );

  // Union of sub-subjects across the selected subjects, de-duplicated by label.
  const availableSubSubjects = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{ label: string; subject: string }> = [];
    currentSubjectNodes.forEach((node) => {
      (node.children || []).forEach((child) => {
        const key = countKey(child.label);
        if (seen.has(key)) return;
        seen.add(key);
        list.push({ label: child.label, subject: node.label });
      });
    });
    return list;
  }, [currentSubjectNodes]);

  // Union of micro-topics across the selected sub-subjects, de-duplicated.
  const currentTopicOptions = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    currentSubjectNodes.forEach((node) => {
      (node.children || []).forEach((child) => {
        if (!selectedSubSubjectKeys.has(countKey(child.label))) return;
        (child.microTopics || []).forEach((topic) => {
          const key = topic.trim().toLowerCase();
          if (seen.has(key)) return;
          seen.add(key);
          list.push(topic);
        });
      });
    });
    return list;
  }, [currentSubjectNodes, selectedSubSubjectKeys]);

  const currentSubSubjectHasUntaggedQuestions = Boolean(
    selectedSubSubjects.length > 0 &&
      currentTopicOptions.length === 0 &&
      questionCounts.byTopic.some(
        (row) =>
          selectedSubSubjectKeys.has(countKey(row.subSubject)) &&
          !String(row.topic || '').trim()
      )
  );

  // Keep the hierarchy coherent: drop selected sub-subjects that are no longer
  // reachable from the selected subjects, and topics no longer reachable from
  // the selected sub-subjects. Runs only when the available options change, so
  // it never fights an active selection.
  useEffect(() => {
    const allowed = new Set(availableSubSubjects.map((s) => countKey(s.label)));
    setSelectedSubSubjects((prev) => {
      const next = prev.filter((s) => allowed.has(countKey(s)));
      return next.length === prev.length ? prev : next;
    });
  }, [availableSubSubjects]);

  useEffect(() => {
    const allowed = new Set(currentTopicOptions.map((t) => t.trim().toLowerCase()));
    setSelectedTopics((prev) => {
      const next = prev.filter((t) => allowed.has(t.trim().toLowerCase()));
      return next.length === prev.length ? prev : next;
    });
  }, [currentTopicOptions]);

  const toggleSubject = useCallback((label: string) => {
    setSelectedSubjects((prev) =>
      prev.some((s) => countKey(s) === countKey(label))
        ? prev.filter((s) => countKey(s) !== countKey(label))
        : [...prev, label]
    );
  }, []);

  const toggleSubSubject = useCallback((label: string) => {
    setSelectedSubSubjects((prev) =>
      prev.some((s) => countKey(s) === countKey(label))
        ? prev.filter((s) => countKey(s) !== countKey(label))
        : [...prev, label]
    );
  }, []);

  const togglePaper = useCallback((value: string) => {
    setSelectedPapers((prev) =>
      prev.some((p) => countKey(p) === countKey(value))
        ? prev.filter((p) => countKey(p) !== countKey(value))
        : [...prev, value]
    );
  }, []);

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

  const taxonomyLabels = mode === 'mains'
    ? { level1: 'Subject', level2: 'Theme', level3: 'Topic' }
    : questionCounts.taxonomyLabels || { level1: 'Subject', level2: 'Theme', level3: 'Topic' };

  const paperOptions = mode === 'prelims'
    ? [
        { label: 'GS Paper 1', value: 'GS Paper 1', icon: '🔑', aliases: ['GS-I', 'GS Paper I'], comingSoon: false },
        { label: 'CSAT', value: 'CSAT', icon: '🧩', aliases: ['Paper II', 'CSAT Paper II'], comingSoon: false },
      ]
    : [
        { label: 'GS Paper 1', value: 'GS Paper 1', icon: '📘', aliases: ['GS-I', 'GS Paper I'], comingSoon: false },
        { label: 'GS Paper 2', value: 'GS Paper 2', icon: '📗', aliases: ['GS-II', 'GS Paper II'], comingSoon: false },
        { label: 'GS Paper 3', value: 'GS Paper 3', icon: '📙', aliases: ['GS-III', 'GS Paper III'], comingSoon: false },
        { label: 'GS Paper 4', value: 'GS Paper 4', icon: '📕', aliases: ['GS-IV', 'GS Paper IV'], comingSoon: false },
        { label: 'Essay', value: 'Essay', icon: '✍️', aliases: ['Essay Paper'], comingSoon: false },
        { label: 'Optional Paper 1', value: 'Optional Paper 1', icon: '📝', aliases: ['Optional-I', 'Optional Paper I'], comingSoon: true },
        { label: 'Optional Paper 2', value: 'Optional Paper 2', icon: '📝', aliases: ['Optional-II', 'Optional Paper II'], comingSoon: true },
      ];

  const visiblePaperOptions = paperOptions.filter((paper) => {
    if (paper.comingSoon) return true;
    const count = getPaperCount(paper.value, paper.aliases);
    return count > 0 || selectedPapers.some((p) => countKey(p) === countKey(paper.value));
  });

  const filterButtonBase =
    'inline-flex h-9 flex-shrink-0 items-center gap-2 rounded-[10px] px-2.5 text-[13px] font-bold text-[#101828] transition-colors hover:bg-[#F4F5F7]';

  const tinyIconStyle: React.CSSProperties = {
    width: 18,
    height: 18,
    color: 'currentColor',
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
    icon,
    active = false,
    count,
  }: {
    id: typeof openFilter;
    label: string;
    icon: React.ReactNode;
    // Whether this filter currently holds a selection (drives the dark highlight + badge).
    active?: boolean;
    // Number shown in the gold badge; defaults to 1 when active.
    count?: number;
  }) => {
    const isOpen = openFilter === id;
    // Highlight (dark pill) whenever a value is selected; light tint while only the popover is open.
    const style: React.CSSProperties = active
      ? {
          background: '#0F172B',
          color: '#FFFFFF',
          boxShadow: '0 2px 10px rgba(15,17,26,0.18),0 1px 3px rgba(15,17,26,0.12)',
        }
      : { background: isOpen ? '#F4F5F7' : 'transparent', color: '#101828' };
    const badgeCount = count ?? 1;
    return (
      <button
        type="button"
        onClick={() => setOpenFilter(isOpen ? null : id)}
        className={filterButtonBase}
        style={style}
        aria-expanded={isOpen}
        aria-pressed={active}
        data-pyq-filter-surface={id}
      >
        <span style={{ color: active ? '#FFFFFF' : '#8B919B', display: 'inline-flex' }}>{icon}</span>
        <span className="whitespace-nowrap">{label}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          style={{
            width: 11,
            height: 11,
            opacity: active ? 0.8 : 0.4,
            transition: 'transform .25s',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            flexShrink: 0,
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        {active ? (
          <span
            className="inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold leading-[16px]"
            style={{ background: '#D4AF37', color: '#0F172B', boxShadow: '0 1px 4px rgba(212,175,55,0.35)' }}
          >
            {badgeCount}
          </span>
        ) : null}
      </button>
    );
  };

  const FilterPopover = ({
    id,
    children,
    width = 420,
    align = 'start',
  }: {
    id: typeof openFilter;
    children: React.ReactNode;
    width?: number;
    align?: 'start' | 'end';
  }) => (
    openFilter === id ? (
      <div
        className={`absolute top-[calc(100%+10px)] z-[70] max-h-[460px] max-w-[calc(100vw-32px)] overflow-hidden rounded-[18px] border border-[#E5E7EB] bg-[#F4F5F7] shadow-[0_18px_52px_rgba(15,17,26,0.14)] ${align === 'end' ? 'right-0' : 'left-0'}`}
        style={{ width: `min(${width}px, calc(100vw - 32px))` }}
        data-pyq-filter-surface={id}
      >
        {children}
      </div>
    ) : null
  );

  const scrollableFilterProps = (id: FilterId) => ({
    ref: (node: HTMLDivElement | null) => {
      if (node) node.scrollTop = filterScrollPositionsRef.current[id] || 0;
    },
    onScroll: (event: React.UIEvent<HTMLDivElement>) => {
      filterScrollPositionsRef.current[id] = event.currentTarget.scrollTop;
    },
  });

  const SubjectTreePopover = () => (
    <FilterPopover id="subject" width={520}>
      <div {...scrollableFilterProps('subject')} className="max-h-[440px] overflow-x-hidden overflow-y-auto p-5">
        <div className="mb-4 flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div className="text-[15px] font-bold text-[#101828]">Subject Filter</div>
          <button type="button" onClick={() => setOpenFilter(null)} className="h-8 w-8 rounded-[10px] bg-white text-[#6A7282]">×</button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setSelectedSubjects([]);
              setSelectedSubSubjects([]);
              setSelectedTopics([]);
              setExpandedSubject(null);
              setExpandedSubtopic(null);
            }}
            className="flex min-h-[50px] items-center justify-between rounded-[12px] px-3 text-left sm:col-span-2"
            style={{ background: selectedSubjects.length === 0 ? '#0F1A30' : '#FFFFFF', color: selectedSubjects.length === 0 ? '#FFFFFF' : '#101828' }}
          >
            <span className="font-semibold">📘 All Papers</span>
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-bold">{questionCounts.total || total}</span>
          </button>
          {subjectTree.map(({ label, icon, children }) => {
            const selected = selectedSubjectKeys.has(countKey(label));
            const expanded = expandedSubject === label;
            const subjectCount = subjectQuestionCounts.get(countKey(label)) || 0;
            return (
              <div key={label} className="overflow-hidden rounded-[12px] bg-white">
                <div
                  className="flex min-h-[50px] w-full items-center justify-between px-3 text-left"
                  style={{ background: selected ? '#0F1A30' : '#FFFFFF', color: selected ? '#FFFFFF' : '#101828' }}
                >
                  <button
                    type="button"
                    onClick={() => toggleSubject(label)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <span
                      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-[6px] border text-[11px]"
                      style={{
                        borderColor: selected ? '#D4AF37' : '#CBD2DC',
                        background: selected ? '#D4AF37' : 'transparent',
                        color: selected ? '#0F172B' : 'transparent',
                      }}
                    >
                      ✓
                    </span>
                    <span aria-hidden>{icon}</span>
                    <span className="truncate text-[14px] font-semibold">{label}</span>
                  </button>
                  <span className="flex items-center gap-2">
                    <span className="rounded-full bg-[#F0F1F3] px-2 py-0.5 text-[10px] font-bold text-[#6A7282]">{subjectCount}</span>
                    {children?.length ? (
                      <button
                        type="button"
                        onClick={() => setExpandedSubject(expanded ? null : label)}
                        aria-label={expanded ? 'Collapse' : 'Expand'}
                        className="flex h-6 w-6 items-center justify-center"
                        style={{ color: selected ? '#FFFFFF' : '#101828', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      >
                        ⌄
                      </button>
                    ) : null}
                  </span>
                </div>
                {expanded && children?.length ? (
                  <div className="border-t border-[#E5E7EB]">
                    {children.map((child) => {
                      const childSelected = selectedSubSubjectKeys.has(countKey(child.label));
                      return (
                        <button
                          key={child.label}
                          type="button"
                          onClick={() => {
                            if (!selected) toggleSubject(label);
                            toggleSubSubject(child.label);
                          }}
                          className="flex w-full items-center justify-between border-b border-[#EEF0F4] px-4 py-2.5 text-left last:border-b-0 hover:bg-[#F9FAFB]"
                          style={{ background: childSelected ? '#FFF3CC' : undefined }}
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <span
                              className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-[5px] border text-[9px]"
                              style={{
                                borderColor: childSelected ? '#B45309' : '#CBD2DC',
                                background: childSelected ? '#B45309' : 'transparent',
                                color: childSelected ? '#FFFFFF' : 'transparent',
                              }}
                            >
                              ✓
                            </span>
                            <span className="truncate text-[12px] font-semibold text-[#5A6478]">{child.label}</span>
                          </span>
                          <span className="rounded-full bg-[#EDF0F5] px-1.5 py-0.5 text-[10px] font-bold text-[#9AA3B2]">
                            {subSubjectQuestionCounts.get(countKey(label, child.label)) || 0}
                          </span>
                        </button>
                      );
                    })}
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
    <div className="sticky top-3 z-10 mb-8 max-w-full lg:z-40">
      <div className="relative">
        <div
          className="flex max-w-full flex-wrap items-center gap-1.5 overflow-visible rounded-[14px] border bg-white px-8 py-2 transition-[border-color,box-shadow] duration-300"
          style={{
            borderColor: hasActiveFilters ? 'rgba(212,175,55,0.35)' : '#F3E9C8',
            boxShadow: hasActiveFilters
              ? '0 2px 8px rgba(15,17,26,0.05),0 12px 36px rgba(15,17,26,0.07),0 0 0 1px rgba(212,175,55,0.12)'
              : '0 2px 8px rgba(15,17,26,0.05),0 12px 36px rgba(15,17,26,0.07)',
            scrollbarWidth: 'none',
          }}
        >
          <div className="relative">
            <FilterTrigger
              id="paper"
              label="Paper"
              active={selectedPapers.length > 0}
              count={selectedPapers.length}
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
                  {visiblePaperOptions.map((paper) => {
                    const selected = selectedPapers.some((p) => countKey(p) === countKey(paper.value));
                    const count = getPaperCount(paper.value, paper.aliases);
                    const paperStyle = getSubjectMetaStyle(paper.value);
                    return (
                      <button
                        key={paper.value}
                        type="button"
                        disabled={paper.comingSoon}
                        onClick={() => !paper.comingSoon && togglePaper(paper.value)}
                        className="flex min-h-[72px] items-center gap-3 rounded-[13px] border bg-white px-3 text-left transition-colors hover:border-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-[#E5E7EB]"
                        style={{
                          borderColor: selected ? paperStyle.accent : paperStyle.border,
                          background: selected ? paperStyle.bg : '#FFFFFF',
                          boxShadow: selected ? `0 0 0 1px ${paperStyle.accent}` : '0 1px 2px rgba(15,17,26,0.04)',
                        }}
                      >
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px] text-[19px]" style={{ background: '#FFFFFFAA', border: `1px solid ${paperStyle.border}` }}>
                          {paper.icon}
                        </span>
                        <span className="min-w-0 flex-1">
                          {paper.comingSoon && (
                            <span className="mb-1 inline-block flex-shrink-0 rounded-full bg-[#F0F1F3] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#6A7282]">
                              Coming soon
                            </span>
                          )}
                          <span className="block whitespace-nowrap text-[15px] font-bold leading-5 text-[#101828]">{paper.label}</span>
                          <span className="block text-[12px] font-medium leading-4 text-[#9AA3B2]">
                            {paper.comingSoon ? 'PYQs not added yet' : `${count} questions`}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                {selectedPapers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedPapers([])}
                    className="mt-4 rounded-full bg-white px-4 py-2 text-[13px] font-bold text-[#6A7282]"
                  >
                    Clear papers
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
              active={selectedSubjects.length > 0}
              count={selectedSubjects.length}
              icon={<svg style={tinyIconStyle} viewBox="0 0 24 24" fill="none"><path d="M6 4h11a2 2 0 0 1 2 2v14H8a3 3 0 0 1-3-3V5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="2"/><path d="M8 17h11" stroke="currentColor" strokeWidth="2"/></svg>}
            />
            <SubjectTreePopover />
          </div>

          <div className="relative">
            <FilterTrigger
              id="subSubject"
              label={taxonomyLabels.level2}
              active={selectedSubSubjects.length > 0}
              count={selectedSubSubjects.length}
              icon={<svg style={tinyIconStyle} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21M12 3c-2.5 2.6-3.8 5.6-3.8 9s1.3 6.4 3.8 9" stroke="currentColor" strokeWidth="1.6"/></svg>}
            />
            <FilterPopover id="subSubject" width={360}>
              <div {...scrollableFilterProps('subSubject')} className="max-h-[360px] overflow-x-hidden overflow-y-auto p-4">
                <div className="mb-3 flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                  <div className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#9AA3B2]">{taxonomyLabels.level2}</div>
                  <button type="button" onClick={() => setOpenFilter(null)} aria-label={`Close ${taxonomyLabels.level2} filter`} className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white text-[20px] text-[#9AA3B2] shadow-sm">×</button>
                </div>
                {!availableSubSubjects.length ? (
                  <div className="rounded-[12px] bg-white p-4 text-[13px] font-semibold text-[#6A7282]">Choose a subject first.</div>
                ) : (
                  <div className="grid gap-2">
                    {availableSubSubjects.map((child) => {
                      const childSelected = selectedSubSubjectKeys.has(countKey(child.label));
                      return (
                        <button
                          key={child.label}
                          type="button"
                          onClick={() => toggleSubSubject(child.label)}
                          className="flex min-w-0 items-center gap-2 rounded-[12px] px-4 py-3 text-left text-[13px] font-bold"
                          style={{ background: childSelected ? '#0F172B' : '#FFFFFF', color: childSelected ? '#FFFFFF' : '#101828' }}
                        >
                          <span
                            className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-[5px] border text-[9px]"
                            style={{
                              borderColor: childSelected ? '#D4AF37' : '#CBD2DC',
                              background: childSelected ? '#D4AF37' : 'transparent',
                              color: childSelected ? '#0F172B' : 'transparent',
                            }}
                          >
                            ✓
                          </span>
                          <span className="min-w-0 break-words whitespace-normal">{child.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </FilterPopover>
          </div>

          <div className="relative">
            <FilterTrigger
              id="topic"
              label={taxonomyLabels.level3}
              active={selectedTopics.length > 0}
              count={selectedTopics.length}
              icon={<svg style={tinyIconStyle} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2"/><path d="m15 9-4.5 1.5L9 15l4.5-1.5L15 9Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>}
            />
            <FilterPopover id="topic" width={420}>
              <div {...scrollableFilterProps('topic')} className="max-h-[360px] overflow-x-hidden overflow-y-auto p-4">
                <div className="mb-3 flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                  <div className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#9AA3B2]">{taxonomyLabels.level3}</div>
                  <button type="button" onClick={() => setOpenFilter(null)} aria-label={`Close ${taxonomyLabels.level3} filter`} className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white text-[20px] text-[#9AA3B2] shadow-sm">×</button>
                </div>
                {selectedSubSubjects.length === 0 ? (
                  <div className="rounded-[12px] bg-white p-4 text-[13px] font-semibold text-[#6A7282]">Choose a {taxonomyLabels.level2.toLowerCase()} first.</div>
                ) : !currentTopicOptions.length ? (
                  <div className="rounded-[12px] bg-white p-4 text-[13px] font-semibold text-[#6A7282]">
                    {currentSubSubjectHasUntaggedQuestions
                      ? `${selectedSubSubjects.join(', ')} ${selectedSubSubjects.length === 1 ? 'is' : 'are'} tagged at this level. These PYQs do not have a separate ${taxonomyLabels.level3.toLowerCase()} tag yet.`
                      : `No ${taxonomyLabels.level3.toLowerCase()} values are assigned to the selected ${taxonomyLabels.level2.toLowerCase()} value(s).`}
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {currentTopicOptions.map((topic) => {
                      const active = selectedTopics.includes(topic);
                      const needle = topic.trim().toLowerCase();
                      const topicCount = questionCounts.byTopic.reduce(
                        (sum, row) =>
                          selectedSubSubjectKeys.has(countKey(row.subSubject)) &&
                          (row.topic || '').toLowerCase().includes(needle)
                            ? sum + row.count
                            : sum,
                        0
                      );
                      return (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => {
                            setSelectedTopics((prev) => active ? prev.filter((t) => t !== topic) : [...prev, topic]);
                          }}
                          className="flex min-h-[50px] items-center justify-between rounded-[12px] bg-white px-4 py-3 text-left text-[13px] font-bold"
                          style={{ background: active ? '#0F1A30' : '#FFFFFF', color: active ? '#FFFFFF' : '#101828' }}
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <span
                              className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-[5px] border text-[9px]"
                              style={{
                                borderColor: active ? '#D4AF37' : '#CBD2DC',
                                background: active ? '#D4AF37' : 'transparent',
                                color: active ? '#0F172B' : 'transparent',
                              }}
                            >
                              ✓
                            </span>
                            <span className="min-w-0 break-words whitespace-normal">{topic}</span>
                          </span>
                          <span className="ml-3 flex-shrink-0 rounded-full bg-[#EDF0F5] px-1.5 py-0.5 text-[10px] text-[#9AA3B2]">
                            {topicCount}
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
              label={yearMode === 'custom' && selectedYears.length ? `${selectedYears.length}Y` : 'Year'}
              active={yearMode === 'custom' && selectedYears.length > 0}
              count={selectedYears.length}
              icon={<svg style={tinyIconStyle} viewBox="0 0 24 24" fill="none"><path d="M7 3v4M17 3v4M4 9h16M5 5h14v15H5V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
            />
            <FilterPopover id="year" width={420} align="end">
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

          {filterDocked && (
            <div className="hidden flex-shrink-0 px-1 lg:block">
              <ExamModeToggle compact />
            </div>
          )}

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
      <style>{`
        .pyq-act-btn{position:relative;overflow:hidden;transition:transform .2s cubic-bezier(0.4,0,0.2,1),box-shadow .2s cubic-bezier(0.4,0,0.2,1),border-color .2s cubic-bezier(0.4,0,0.2,1);}
        .pyq-act-btn:active{transform:translateY(0) scale(0.97);}
        .pyq-act-btn--primary{box-shadow:0 1px 0 rgba(255,255,255,0.08) inset,0 2px 6px rgba(15,23,42,0.28),0 10px 22px -8px rgba(15,23,42,0.4);}
        .pyq-act-btn--primary::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent);transition:left .5s cubic-bezier(0.4,0,0.2,1);pointer-events:none;}
        .pyq-act-btn--primary:hover{transform:translateY(-2px);box-shadow:0 1px 0 rgba(255,255,255,0.1) inset,0 4px 10px rgba(15,23,42,0.32),0 16px 30px -8px rgba(212,175,55,0.35);}
        .pyq-act-btn--primary:hover::before{left:100%;}
        .pyq-act-btn--secondary{box-shadow:0 1px 2px rgba(16,24,40,0.05),0 1px 0 rgba(255,255,255,0.7) inset;}
        .pyq-act-btn--secondary:hover{transform:translateY(-2px);border-color:#D4AF37 !important;box-shadow:0 8px 18px -6px rgba(212,175,55,0.22),0 2px 6px rgba(16,24,40,0.06);}
        .pyq-act-pill{box-shadow:0 1px 2px rgba(16,24,40,0.05);}
        .pyq-act-pill:hover{transform:translateY(-2px);}
        .pyq-act-pill--bookmark:hover{border-color:#D4AF37 !important;box-shadow:0 8px 18px -6px rgba(212,175,55,0.3);}
        .pyq-act-pill--flashcard:hover{border-color:#0891B2 !important;box-shadow:0 8px 18px -6px rgba(8,145,178,0.3);}
        .pyq-act-pill--review:hover{border-color:#E65100 !important;box-shadow:0 8px 18px -6px rgba(230,81,0,0.3);}
        .pyq-sparkle{display:inline-block;animation:pyqSparkle 2s ease-in-out infinite;}
        @keyframes pyqSparkle{0%,100%{transform:scale(1) rotate(0deg);opacity:1}50%{transform:scale(1.15) rotate(12deg);opacity:.85}}
      `}</style>
      <MainsEvaluationLimitModal
        open={showMainsQuotaModal}
        onClose={() => setShowMainsQuotaModal(false)}
        tier={entitlements.tier}
        used={mainsQuota?.used}
        limit={mainsQuota?.limit}
        backLabel="Back to Dashboard"
      />
      {navigatingQuestionHref ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#F8F9FB]/85 backdrop-blur-sm">
          <div className="rounded-[18px] border border-[#E5E7EB] bg-white px-8 py-7 text-center shadow-[0_16px_50px_rgba(15,23,42,0.16)]">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#E5E7EB] border-t-[#D4AF37]" />
            <p className="text-[16px] font-bold text-[#111827]">Opening question...</p>
            <p className="mt-1 text-[13px] text-[#6B7280]">Preparing the full PYQ page</p>
          </div>
        </div>
      ) : null}

      <DashboardPageHero
        // eslint-disable-next-line @next/next/no-img-element
        badgeIcon={<img src="/badge-pyq.png" alt="pyq" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />}
        badgeText="PREVIOUS YEAR QUESTIONS"
        title={
          <>
            The Complete <em className="not-italic" style={{ color: '#E8B84B', fontStyle: 'italic' }}>PYQ Bank</em> to Decode UPSC
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

        {/* Active filter pills */}
        {(() => {
          const pills: Array<{ key: string; label: string; onRemove: () => void }> = [];
          selectedPapers.forEach((paper) => {
            pills.push({
              key: `paper:${paper}`,
              label: `Paper: ${paper}`,
              onRemove: () => setSelectedPapers((prev) => prev.filter((p) => p !== paper)),
            });
          });
          selectedSubjects.forEach((subject) => {
            pills.push({
              key: `subject:${subject}`,
              label: subject,
              onRemove: () => setSelectedSubjects((prev) => prev.filter((s) => s !== subject)),
            });
          });
          selectedSubSubjects.forEach((subSubject) => {
            pills.push({
              key: `subSubject:${subSubject}`,
              label: subSubject,
              onRemove: () => setSelectedSubSubjects((prev) => prev.filter((s) => s !== subSubject)),
            });
          });
          selectedTopics.forEach((topic) => {
            pills.push({
              key: `topic:${topic}`,
              label: topic,
              onRemove: () => setSelectedTopics((prev) => prev.filter((t) => t !== topic)),
            });
          });
          if (yearMode === 'custom' && selectedYears.length > 0) {
            selectedYears.forEach((yr) => {
              pills.push({
                key: `year:${yr}`,
                label: `Year: ${yr}`,
                onRemove: () => setSelectedYears((prev) => prev.filter((y) => y !== yr)),
              });
            });
          }
          if (!pills.length) return null;
          return (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[13px] font-medium text-[#9AA3B2]">Active filters:</span>
              {pills.map((pill) => (
                <span
                  key={pill.key}
                  className="inline-flex items-center gap-2 rounded-full border border-[#EEF0F3] bg-white py-1.5 pl-4 pr-1.5 text-[13px] font-medium text-[#101828] shadow-[0_1px_2px_rgba(15,17,26,0.04)]"
                >
                  {pill.label}
                  <button
                    type="button"
                    aria-label={`Remove ${pill.label}`}
                    onClick={pill.onRemove}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F0F1F3] text-[11px] text-[#9AA3B2] transition-colors hover:bg-[#C10007] hover:text-white"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          );
        })()}

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
                  onClick={() => { setSelectedSubjects([]); setSelectedSubSubjects([]); setSelectedTopics([]); setExpandedSubject(null); setExpandedSubtopic(null); }}
                  className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold transition-all hover:opacity-80 active:scale-95"
                  style={{ background: selectedSubjects.length === 0 ? '#0F1A30' : '#EEF2FF', color: selectedSubjects.length === 0 ? '#FFFFFF' : '#4338CA' }}
                >
                  📘 All Papers
                </button>
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
                  scrollToAnswerSection(`pyq-explanation-${q.id}`);
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
                      onClick={(event) => handleQuestionNavigation(event, publicQuestionHref)}
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

                    {/* Options - inline interactive (matches Daily MCQ Challenge design) */}
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
                    {qState.submitted && (getExplanationText(q) || q.correctOption) && (
                      <div id={`pyq-explanation-${q.id}`} className="mt-4 scroll-mt-24 rounded-[14px] p-4" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                        <div className="flex items-center gap-2 mb-1" style={{ color: '#016630', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase' }}>
                          <span>✅</span><span>Explanation</span>
                        </div>
                        <ExplanationRenderer question={q} />
                        <p className="mt-2" style={{ fontSize: '13px', color: '#6A7282' }}>📖 UPSC CSE Prelims {q.year}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#BBF7D0] pt-4">
                          <button
                            type="button"
                            onClick={() => togglePrelimsBookmark(q)}
                            disabled={prelimsBookmarkBusyIds.has(q.id)}
                            className="pyq-act-btn pyq-act-pill pyq-act-pill--bookmark flex items-center gap-2"
                            style={{
                              padding: '9px 18px',
                              borderRadius: '10px',
                              fontFamily: 'Inter, sans-serif',
                              fontWeight: 600,
                              fontSize: '14px',
                              border: prelimsBookmarkedIds.has(q.id) ? '1.5px solid #D4AF37' : '1.5px solid #E5E7EB',
                              background: prelimsBookmarkedIds.has(q.id) ? 'rgba(212,175,55,0.1)' : '#FFFFFF',
                              color: prelimsBookmarkedIds.has(q.id) ? '#9A7B0E' : '#101828',
                              opacity: prelimsBookmarkBusyIds.has(q.id) ? 0.6 : 1,
                            }}
                          >
                            <span aria-hidden>🔖</span>
                            <span>{prelimsBookmarkBusyIds.has(q.id) ? 'Saving...' : prelimsBookmarkedIds.has(q.id) ? 'Bookmarked' : 'Bookmark'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => addPrelimsFlashcard(q)}
                            disabled={prelimsFlashcardBusyIds.has(q.id)}
                            className="pyq-act-btn pyq-act-pill pyq-act-pill--flashcard flex items-center gap-2"
                            style={{
                              padding: '9px 18px',
                              borderRadius: '10px',
                              fontFamily: 'Inter, sans-serif',
                              fontWeight: 600,
                              fontSize: '14px',
                              border: prelimsFlashcardIds.has(q.id) ? '1.5px solid #0891B2' : '1.5px solid #E5E7EB',
                              background: prelimsFlashcardIds.has(q.id) ? 'rgba(8,145,178,0.08)' : '#FFFFFF',
                              color: prelimsFlashcardIds.has(q.id) ? '#0891B2' : '#101828',
                              opacity: prelimsFlashcardBusyIds.has(q.id) ? 0.6 : 1,
                            }}
                          >
                            <span aria-hidden>⚡</span>
                            <span>{prelimsFlashcardBusyIds.has(q.id) ? 'Adding...' : prelimsFlashcardIds.has(q.id) ? 'In Flashcards' : 'Add to Flashcard'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => togglePrelimsReview(q)}
                            disabled={prelimsReviewBusyIds.has(q.id)}
                            className="pyq-act-btn pyq-act-pill pyq-act-pill--review flex items-center gap-2"
                            style={{
                              padding: '9px 18px',
                              borderRadius: '10px',
                              fontFamily: 'Inter, sans-serif',
                              fontWeight: 600,
                              fontSize: '14px',
                              border: prelimsReviewIds.has(q.id) ? '1.5px solid #E65100' : '1.5px solid #E5E7EB',
                              background: prelimsReviewIds.has(q.id) ? 'rgba(230,81,0,0.08)' : '#FFFFFF',
                              color: prelimsReviewIds.has(q.id) ? '#E65100' : '#101828',
                              opacity: prelimsReviewBusyIds.has(q.id) ? 0.6 : 1,
                            }}
                          >
                            <span aria-hidden>🕐</span>
                            <span>{prelimsReviewBusyIds.has(q.id) ? 'Saving...' : prelimsReviewIds.has(q.id) ? 'Added to Review' : 'Need to Review'}</span>
                          </button>
                        </div>
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
                    onClick={() => { setSelectedSubjects([]); setSelectedSubSubjects([]); setSelectedTopics([]); setExpandedSubject(null); setExpandedSubtopic(null); }}
                    className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold transition-all hover:opacity-80 active:scale-95"
                    style={{ background: selectedSubjects.length === 0 ? '#0F1A30' : '#EEF2FF', color: selectedSubjects.length === 0 ? '#FFFFFF' : '#4338CA' }}
                  >
                    📘 All Papers
                  </button>
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
                        {getMainsMarks(q)} marks
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
                      onClick={(event) => handleQuestionNavigation(event, publicQuestionHref)}
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
                        onClick={() => openMainsWriteModal(q)}
                        className="pyq-act-btn pyq-act-btn--primary flex items-center justify-center"
                        style={{ height: '59px', borderRadius: '14px', background: 'linear-gradient(135deg, #101828 0%, #1E2133 100%)', color: '#FFFFFF', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', padding: '0 20px' }}
                      >
                        <span aria-hidden className="pyq-sparkle" style={{ marginRight: '8px' }}>✨</span>
                        <span>Write &amp; Evaluate</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          // Essay questions open the dedicated model-answer experience;
                          // all other papers keep the inline expand/collapse.
                          if (isEssayQuestion(q)) {
                            router.push(`/dashboard/pyq/essay/${encodeURIComponent(q.id)}`);
                            return;
                          }
                          const isExpanded = expandedModelAnswerIds.has(q.id);
                          setExpandedModelAnswerIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(q.id)) next.delete(q.id);
                            else next.add(q.id);
                            return next;
                          });
                          if (!isExpanded) scrollToAnswerSection(`pyq-model-answer-${q.id}`);
                        }}
                        className="pyq-act-btn pyq-act-btn--secondary flex items-center justify-center gap-2"
                        style={{ height: '59px', borderRadius: '14px', background: '#FFFFFF', color: '#101828', border: '1.5px solid #E5E7EB', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', padding: '0 20px' }}
                      >
                        <span aria-hidden>📄</span>
                        <span>Model Answer</span>
                      </button>
                    </div>

                    {!isEssayQuestion(q) && expandedModelAnswerIds.has(q.id) && (
                      <div
                        id={`pyq-model-answer-${q.id}`}
                        className="mt-1 scroll-mt-24"
                        style={{
                          padding: '24px 26px 22px',
                          borderRadius: '14px',
                          border: '1px solid rgba(212, 175, 55, 0.14)',
                          background: `
                            radial-gradient(ellipse 90% 70% at 90% 100%, rgba(212, 175, 55, 0.045) 0%, transparent 60%),
                            radial-gradient(ellipse 80% 60% at 5% 0%, rgba(245, 208, 110, 0.035) 0%, transparent 55%),
                            linear-gradient(180deg, #ffffff 0%, #fdfcf8 100%)
                          `,
                        }}
                      >
                        <div className="flex items-center gap-2 mb-4" style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', color: '#101828', textTransform: 'uppercase' }}>
                          <span aria-hidden style={{ color: '#D4AF37' }}>★</span>
                          <span>Model Answer</span>
                        </div>

                        <CuratedModelAnswer
                          markdown={q.modelAnswer || q.answer || q.explanation || 'Model answer is being prepared for this question.'}
                        />

                        <div className="flex flex-wrap items-center gap-3 pt-4 mt-2" style={{ borderTop: '1px solid rgba(212,175,55,0.15)' }}>
                          <button
                            type="button"
                            onClick={() => toggleMainsBookmark(q)}
                            disabled={mainsBookmarkBusyIds.has(q.id)}
                            className="pyq-act-btn pyq-act-pill pyq-act-pill--bookmark flex items-center gap-2"
                            style={{
                              padding: '9px 18px',
                              borderRadius: '10px',
                              fontFamily: 'Inter, sans-serif',
                              fontWeight: 600,
                              fontSize: '14px',
                              border: mainsBookmarkedIds.has(q.id) ? '1.5px solid #D4AF37' : '1.5px solid #E5E7EB',
                              background: mainsBookmarkedIds.has(q.id) ? 'rgba(212,175,55,0.1)' : '#FFFFFF',
                              color: mainsBookmarkedIds.has(q.id) ? '#9A7B0E' : '#101828',
                              opacity: mainsBookmarkBusyIds.has(q.id) ? 0.6 : 1,
                            }}
                          >
                            <span aria-hidden>🔖</span>
                            <span>{mainsBookmarkBusyIds.has(q.id) ? 'Saving...' : mainsBookmarkedIds.has(q.id) ? 'Bookmarked' : 'Bookmark'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => addMainsFlashcard(q)}
                            disabled={mainsFlashcardBusyIds.has(q.id)}
                            className="pyq-act-btn pyq-act-pill pyq-act-pill--flashcard flex items-center gap-2"
                            style={{
                              padding: '9px 18px',
                              borderRadius: '10px',
                              fontFamily: 'Inter, sans-serif',
                              fontWeight: 600,
                              fontSize: '14px',
                              border: mainsFlashcardIds.has(q.id) ? '1.5px solid #0891B2' : '1.5px solid #E5E7EB',
                              background: mainsFlashcardIds.has(q.id) ? 'rgba(8,145,178,0.08)' : '#FFFFFF',
                              color: mainsFlashcardIds.has(q.id) ? '#0891B2' : '#101828',
                              opacity: mainsFlashcardBusyIds.has(q.id) ? 0.6 : 1,
                            }}
                          >
                            <span aria-hidden>⚡</span>
                            <span>{mainsFlashcardBusyIds.has(q.id) ? 'Adding...' : mainsFlashcardIds.has(q.id) ? 'In Flashcards' : 'Add to Flashcard'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleMainsReview(q)}
                            disabled={mainsReviewBusyIds.has(q.id)}
                            className="pyq-act-btn pyq-act-pill pyq-act-pill--review flex items-center gap-2"
                            style={{
                              padding: '9px 18px',
                              borderRadius: '10px',
                              fontFamily: 'Inter, sans-serif',
                              fontWeight: 600,
                              fontSize: '14px',
                              border: mainsReviewIds.has(q.id) ? '1.5px solid #E65100' : '1.5px solid #E5E7EB',
                              background: mainsReviewIds.has(q.id) ? 'rgba(230,81,0,0.08)' : '#FFFFFF',
                              color: mainsReviewIds.has(q.id) ? '#E65100' : '#101828',
                              opacity: mainsReviewBusyIds.has(q.id) ? 0.6 : 1,
                            }}
                          >
                            <span aria-hidden>🕐</span>
                            <span>{mainsReviewBusyIds.has(q.id) ? 'Saving...' : mainsReviewIds.has(q.id) ? 'Added to Review' : 'Need to Review'}</span>
                          </button>
                        </div>

                        <div
                          className="flex items-start gap-2 mt-4"
                          style={{
                            padding: '12px 14px',
                            background: 'rgba(212,175,55,0.06)',
                            borderLeft: '3px solid #D4AF37',
                            borderRadius: '6px',
                            fontSize: '13px',
                            lineHeight: 1.6,
                            color: '#4A5565',
                          }}
                        >
                          <span aria-hidden>ⓘ</span>
                          <span>
                            Model answers may exceed the prescribed word limit for better clarity and depth. Use them as a
                            reference, always frame your final answer within the exam&apos;s word limit.
                          </span>
                        </div>
                      </div>
                    )}

                  </div>
                  );
                })}

                {!loading && visibleQuestions.length === 0 && (
                  <div className="rounded-[16px] bg-white p-10 text-center text-[#6A7282]" style={{ border: '0.8px solid #E5E7EB' }}>
                    No mains questions found for the selected filters.
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
                    {selectedQuestion?.paper && (() => {
                      const style = getSubjectMetaStyle(selectedQuestion.paper);
                      return <span className="inline-flex items-center gap-1 rounded-[7px] px-3 py-1 text-[12px] font-bold" style={{ border: `1px solid ${style.border}`, background: style.bg, color: style.color }}><span aria-hidden>{style.icon}</span>{selectedQuestion.paper}</span>;
                    })()}
                    {selectedQuestion?.subject && String(selectedQuestion.subject).toLowerCase() !== String(selectedQuestion.paper || '').toLowerCase() && (() => {
                      const style = getSubjectMetaStyle(selectedQuestion.subject);
                      return <span className="inline-flex items-center gap-1 rounded-[7px] px-3 py-1 text-[12px] font-bold" style={{ border: `1px solid ${style.border}`, background: style.bg, color: style.color }}><span aria-hidden>{style.icon}</span>{selectedQuestion.subject}</span>;
                    })()}
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

            <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_300px]">
              <div className="flex min-h-0 flex-col overflow-hidden px-8 py-5">
                <div className="flex-shrink-0 rounded-[12px] bg-[#F9FAFB] p-4" style={{ borderLeft: '4px solid #D4AF37' }}>
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#9AA3B2]">Question</div>
                  <QuestionTextRenderer
                    text={selectedQuestion?.questionText || 'Loading question...'}
                    textClassName="italic text-[15px] leading-[26px] text-[#1E2939]"
                    textStyle={{ fontFamily: PYQ_QUESTION_FONT }}
                  />
                </div>

                <div className="mt-3 flex flex-shrink-0 flex-wrap items-center gap-x-6 gap-y-2 text-[13px] font-semibold text-[#6A7282]">
                  <span>◷ {Math.floor(getMainsTimeLimit(selectedQuestion) / 60)} min</span>
                  <span>✍️ {getMainsWordLimit(selectedQuestion)} words</span>
                  <span>☆ {getMainsMarks(selectedQuestion)} marks</span>
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

                {!textAnswerExpanded && (
                  <>
                    <div className="mt-4 flex flex-shrink-0 items-center gap-2 text-[16px] font-bold text-[#0F172B]">
                      <span className="text-[#D4AF37]">⇧</span>
                      Upload your answer
                    </div>

                    <div
                      className="mt-3 flex min-h-0 flex-1 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[14px] px-6 py-4 text-center"
                      style={{
                        border: mainsFiles.length > 0 ? '1.5px dashed #17223E' : '1px dashed #CBD5E1',
                        background: mainsFiles.length > 0 ? '#EFF6FF' : '#F9FAFB',
                      }}
                      onClick={() => mainsFileInputRef.current?.click()}
                    >
                      <div className="mb-3 grid h-12 w-12 flex-shrink-0 place-items-center rounded-[12px] bg-[#0F1424] text-[#D4AF37]">⇧</div>
                      <p className="mb-2 text-[16px] font-bold text-[#0F172B]">
                        {mainsFiles.length > 1 ? `${mainsFiles.length} pages selected` : mainsFile ? mainsFile.name : 'Drop your answer script here'}
                      </p>
                      <p className="mb-3 text-[14px] text-[#9AA3B2]">Upload handwritten answers for AI evaluation</p>
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
                        className="flex-shrink-0 rounded-[8px] border border-[#D1D5DB] bg-white px-6 py-2 text-[14px] font-bold text-[#111827]"
                      >
                        Browse Files
                      </button>
                    </div>

                    {/* ── Uploaded file preview cards (image/PDF thumbnails) ── */}
                    {mainsFiles.length > 0 && (
                      <div className="mt-3">
                        <UploadedAnswerFiles files={mainsFiles} onRemove={removeMainsFile} />
                      </div>
                    )}

                    <button type="button" onClick={() => setTextAnswerExpanded(true)} className="mt-4 flex w-full flex-shrink-0 items-center gap-3">
                      <div className="h-px flex-1 bg-[#E5E7EB]" />
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-[13px] font-semibold text-[#6A7282]">
                        <span
                          aria-hidden="true"
                          className="h-2 w-2 border-b-2 border-r-2 border-[#8B919B]"
                          style={{ transform: 'rotate(45deg)' }}
                        />
                        OR Type your answer
                      </span>
                      <div className="h-px flex-1 bg-[#E5E7EB]" />
                    </button>
                  </>
                )}

                {textAnswerExpanded && (
                  <>
                    <button type="button" onClick={() => setTextAnswerExpanded(false)} className="mt-4 flex w-full flex-shrink-0 items-center gap-3">
                      <div className="h-px flex-1 bg-[#E5E7EB]" />
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-[13px] font-semibold text-[#6A7282]">
                        <span
                          aria-hidden="true"
                          className="h-2 w-2 border-b-2 border-r-2 border-[#8B919B]"
                          style={{ transform: 'rotate(225deg)' }}
                        />
                        Hide
                      </span>
                      <div className="h-px flex-1 bg-[#E5E7EB]" />
                    </button>

                    <div className="mt-4 flex min-h-0 flex-1 flex-col">
                      <textarea
                        value={mainsAnswerText}
                        onChange={(e) => setMainsAnswerText(e.target.value)}
                        placeholder="Write your answer here..."
                        autoFocus
                        className="w-full min-h-0 flex-1 resize-none rounded-[10px] border border-[#D1D5DB] bg-[#F9FAFB] p-4 text-[#101828] outline-none"
                        style={{ fontSize: 15, lineHeight: '24px', overflowY: 'auto' }}
                      />
                      <p className="mt-1 flex-shrink-0 text-right text-[12px] text-[#6A7282]">{mainsAnswerText.trim().split(/\s+/).filter(Boolean).length} words</p>
                    </div>
                  </>
                )}

                {mainsSubmitError && (
                  <div className="mt-4 flex-shrink-0 rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#B91C1C]">
                    {mainsSubmitError}
                  </div>
                )}

                <button
                  id="pyq-mains-submit-btn"
                  type="button"
                  disabled={mainsSubmitting || (!mainsAnswerText.trim() && mainsFiles.length === 0)}
                  onClick={async () => {
                    if (!selectedQuestion) return;
                    if (!entitlements.loading && mainsQuota?.allowed === false) {
                      setShowMainsQuotaModal(true);
                      return;
                    }
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
                      if (entitlementError.title === 'Limit reached' || entitlementError.title === 'Upgrade required') {
                        setShowMainsQuotaModal(true);
                      } else {
                        const resetAt = formatResetAt(entitlementError.resetAt);
                        const message = resetAt
                          ? `${entitlementError.message} Try again after ${resetAt}.`
                          : entitlementError.message;
                        setMainsSubmitError(message || err.message || 'Failed to submit. Please try again.');
                      }
                    } finally {
                      setMainsSubmitting(false);
                    }
                  }}
                  className="mt-4 flex h-[48px] w-full flex-shrink-0 items-center justify-center gap-2 rounded-[12px] bg-[#0F1424] text-[15px] font-bold text-white disabled:opacity-45"
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

              <aside className="flex min-h-0 flex-col gap-4 overflow-hidden bg-[#F8F9FB] p-5">
                <div className="rounded-[18px] bg-white p-4 text-center shadow-sm">
                  <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#9AA3B2]">Writing Timer</div>
                  {(() => {
                    const radius = 82;
                    const circumference = 2 * Math.PI * radius;
                    const pct = Math.max(0, Math.min(1, mainsTimeLeft / getMainsTimeLimit(selectedQuestion)));
                    return (
                      <div className="relative mx-auto mb-3 flex h-[180px] w-[180px] items-center justify-center">
                        <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx="90" cy="90" r={radius} fill="none" stroke="#E6E8EE" strokeWidth="5" />
                          <circle
                            cx="90"
                            cy="90"
                            r={radius}
                            fill="none"
                            stroke={mainsTimeLeft <= 60 ? '#EF4444' : '#D4AF37'}
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference * (1 - pct)}
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <div className="font-mono text-[32px] font-bold text-[#0B1020]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {Math.floor(mainsTimeLeft / 60)}:{String(mainsTimeLeft % 60).padStart(2, '0')}
                          </div>
                          <div className="mt-1 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.1em] text-[#9AA3B2]">
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
                        setMainsTimeLeft(getMainsTimeLimit(selectedQuestion));
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
                  className="rounded-[14px] flex items-center justify-center flex-shrink-0 px-3"
                  style={{ minWidth: 64, height: 48, background: '#1E293B', color: '#FFFFFF', fontFamily: 'Inter', fontWeight: 700, fontSize: '15px', lineHeight: '22px' }}
                >
                  {selectedQuestion?.paper || 'Mains'}
                </div>
                <span className="px-3 py-1.5 rounded-full text-[14px] font-semibold flex-shrink-0" style={{ background: '#1E293B', color: '#FFFFFF' }}>{selectedQuestion?.year}</span>
                {selectedQuestion?.subject && (() => {
                  const style = getSubjectMetaStyle(selectedQuestion.subject);
                  return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[14px] font-semibold flex-shrink-0" style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>
                      <span aria-hidden>{style.icon}</span>{selectedQuestion.subject}
                    </span>
                  );
                })()}
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
                // Default (unselected) state - matches Daily MCQ Challenge design
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
            {hasSubmitted && (getExplanationText(selectedQuestion) || selectedQuestion?.correctOption) && (
              <div id="pyq-attempt-explanation" className="scroll-mt-24" style={{ width: '774.4px', maxWidth: '100%' }}>
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
                    scrollToAnswerSection('pyq-attempt-explanation');
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
