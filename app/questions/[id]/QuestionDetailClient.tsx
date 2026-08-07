'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Footer from '@/components/Footer';
import LandingNav from '@/components/LandingNav';
import StructuredQuestionRenderer from '@/components/StructuredQuestionRenderer';
import QuestionTextRenderer from '@/components/QuestionTextRenderer';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { bookmarkService, flashcardService, pyqService, spacedRepService } from '@/lib/services';
import { isEssayQuestion } from '@/lib/essayModelAnswer';
import EssayModelAnswerClient from '@/app/dashboard/pyq/essay/[questionId]/EssayModelAnswerClient';
import CuratedModelAnswer from '@/components/mains-results/CuratedModelAnswer';
import MainsEvaluatingScreen from '@/components/mains-results/MainsEvaluatingScreen';
import { handleEntitlementError } from '@/components/entitlements';
import { EntitlementsProvider, useEntitlements } from '@/contexts/EntitlementsContext';
import { MainsEvaluationLimitModal } from '@/components/upgrade/UpgradeModals';
import { getSubjectMetaStyle } from '@/lib/subjectPalette';

type PublicQuestion = {
  id: string;
  mode?: 'prelims' | 'mains';
  year?: number | null;
  paper?: string | null;
  questionNum?: number | null;
  questionText: string;
  subject?: string | null;
  subSubject?: string | null;
  topic?: string | null;
  difficulty?: string | null;
  marks?: number | null;
  maxMarks?: number | null;
  options?: Array<{ label: string; text: string }> | null;
  correctOption?: string | null;
  explanation?: string | null;
  modelAnswer?: string | null;
  structuredJson?: any;
  questionStructure?: any;
};

type Props = {
  question: PublicQuestion;
  mode: 'prelims' | 'mains';
  relatedQuestions: PublicQuestion[];
  pyqNavigation: PyqNavigation;
};

type PyqModeKey = 'prelims' | 'mains' | 'csat';

type PyqNavigation = {
  modes: Array<{
    key: PyqModeKey;
    label: string;
    years: Array<{ year: number; count: number }>;
  }>;
  years: Array<{ year: number; count: number }>;
};

type DashboardLinkGuard = (event: MouseEvent<HTMLAnchorElement>) => void;

const chipStyles = {
  year: 'bg-[#DBEAFE] text-[#1447E6]',
  subject: 'bg-[#E0E7FF] text-[#432DD7]',
  subSubject: 'bg-[#E0F2FE] text-[#0369A1]',
  topic: 'bg-[#F3E8FF] text-[#7E22CE]',
  difficultyEasy: 'bg-[#DCFCE7] text-[#008236]',
  difficultyMedium: 'bg-[#FFEDD4] text-[#CA3500]',
  difficultyHard: 'bg-[#FFE2E2] text-[#C10007]',
  mains: 'bg-[#F3E8FF] text-[#7E22CE]',
};
const QUESTION_FONT = 'var(--font-sora), Inter, sans-serif';
const PLATFORM_ITEMS = [
  { title: 'Daily MCQ Challenge', subtitle: '10 questions daily, all subjects', href: '/dashboard/daily-mcq', icon: 'mcq', bg: 'from-violet-500 to-purple-600' },
  { title: 'Study Planner', subtitle: 'Personalized day-by-day plan', href: '/dashboard/study-planner', icon: 'calendar', bg: 'from-blue-500 to-cyan-600' },
  { title: 'Mock Tests', subtitle: 'Full-length simulated exams', href: '/dashboard/mock-tests', icon: 'star', bg: 'from-amber-500 to-orange-600' },
  { title: 'Jeet AI Mentor', subtitle: 'Ask anything, get instant help', href: '/dashboard/jeet-gpt', icon: 'chat', bg: 'from-rose-500 to-pink-600' },
  { title: 'Performance Analytics', subtitle: 'Deep insights on your prep', href: '/dashboard/performance', icon: 'pulse', bg: 'from-emerald-500 to-teal-600' },
  { title: 'Flashcards & Revision', subtitle: 'Smart spaced repetition', href: '/dashboard/flashcards', icon: 'monitor', bg: 'from-indigo-500 to-blue-700' },
  { title: 'Syllabus Tracker', subtitle: 'Track every topic you cover', href: '/dashboard/syllabus-tracker', icon: 'book', bg: 'from-cyan-500 to-teal-600' },
  // Study Groups (Live Study Room) is hidden for now; re-enable when it is ready.
  // { title: 'Study Groups', subtitle: 'Learn together, grow together', href: '/dashboard/study-groups', icon: 'users', bg: 'from-pink-500 to-rose-600' },
];

function cleanText(value?: string | null) {
  return String(value || '').trim();
}

function truncateForUi(value: string, max = 100) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trim()}...` : clean;
}

function getExplanationText(question: PublicQuestion) {
  return (
    question.explanation ||
    question.structuredJson?.explanation?.displayText ||
    question.structuredJson?.explanation?.rawText ||
    ''
  );
}

function getModelAnswerText(question: PublicQuestion) {
  return (
    cleanText(question.modelAnswer) ||
    cleanText(question.explanation) ||
    cleanText(question.structuredJson?.explanation?.displayText) ||
    ''
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'general';
}

function optionList(question: PublicQuestion) {
  if (!Array.isArray(question.options)) return [];
  return question.options
    .map((option) => ({
      label: cleanText(option?.label),
      text: cleanText(option?.text),
    }))
    .filter((option) => option.label && option.text);
}

function difficultyClass(difficulty?: string | null) {
  const normalized = cleanText(difficulty).toLowerCase();
  if (normalized === 'hard') return chipStyles.difficultyHard;
  if (normalized === 'easy') return chipStyles.difficultyEasy;
  return chipStyles.difficultyMedium;
}

function QuestionChip({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.02em] ${className}`}>
      {children}
    </span>
  );
}

function PlatformIcon({ icon, color = 'white' }: { icon: string; color?: string }) {
  const common = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (icon) {
    case 'sparkle':
      return <svg {...common}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>;
    case 'calendar':
      return <svg {...common}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
    case 'doc':
      return <svg {...common}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>;
    case 'pen':
      return <svg {...common}><path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="M2 2l7.586 7.586" /><circle cx="11" cy="11" r="2" /></svg>;
    case 'star':
      return <svg {...common}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>;
    case 'chat':
      return <svg {...common}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>;
    case 'pulse':
      return <svg {...common}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>;
    case 'monitor':
      return <svg {...common}><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>;
    case 'book':
      return <svg {...common}><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" /></svg>;
    case 'users':
      return <svg {...common}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
  }
}

function modeHref(key: PyqModeKey, year?: number) {
  const query = new URLSearchParams();
  if (key !== 'prelims') query.set('mode', key);
  if (year) query.set('year', String(year));
  const qs = query.toString();
  return `/dashboard/pyq${qs ? `?${qs}` : ''}`;
}

function YearWisePyqSection({
  activeYear,
  mode,
  navigation,
  onDashboardLinkClick,
}: {
  activeYear?: number;
  mode: 'prelims' | 'mains';
  navigation: PyqNavigation;
  onDashboardLinkClick?: DashboardLinkGuard;
}) {
  const fallbackMode = {
    key: mode,
    label: mode === 'prelims' ? 'Prelims' : 'Mains',
    years: activeYear ? [{ year: activeYear, count: 1 }] : [],
  };
  const modes = navigation.modes.length > 0 ? navigation.modes : [fallbackMode];
  const activeMode = modes.find((item) => item.key === mode) || modes[0];
  const years = activeMode.years.length > 0
    ? activeMode.years
    : navigation.years.length > 0
      ? navigation.years
      : fallbackMode.years;

  if (modes.length === 0 || years.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="mb-5 text-[26px] font-bold text-[#1F2937]" style={{ fontFamily: 'var(--font-cormorant-garamond), Georgia, serif' }}>
        Year-wise UPSC PYQs
      </h2>
      <div className="mb-5 flex items-center gap-2">
        {modes.map((item) => (
          <Link
            key={item.key}
            href={modeHref(item.key)}
            onClick={onDashboardLinkClick}
            className={`rounded-full px-5 py-2 text-[14px] font-bold transition ${mode === item.key ? 'bg-[#0B1229] text-white' : 'bg-[#F1F3F7] text-[#6B7280] hover:bg-[#E5E7EB]'}`}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {years.map((item) => (
          <Link
            key={item.year}
            href={modeHref(activeMode.key, item.year)}
            onClick={onDashboardLinkClick}
            title={`${item.count} question${item.count === 1 ? '' : 's'}`}
            className={`rounded-[10px] border px-4 py-3 text-center text-[16px] font-semibold transition ${activeYear === item.year ? 'border-[#D4AF37] bg-[#FFFDF5] text-[#B8941E]' : 'border-[#E2E6EE] bg-white text-[#364153] hover:border-[#D4AF37] hover:bg-[#FFFDF5] hover:text-[#B8941E]'}`}
          >
            {item.year}
          </Link>
        ))}
      </div>
    </section>
  );
}

function TodaysTrioCard() {
  return (
    <div className="rounded-[16px] border border-[#D4AF37]/15 bg-[#0B1229] p-5 shadow-[0_10px_34px_rgba(15,23,42,0.18)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-gradient-to-r from-[#F5D06E] to-[#D4AF37]">
            <PlatformIcon icon="sparkle" />
          </span>
          <p className="text-[14px] font-bold text-white">Today&apos;s Trio</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.04em] text-[#4ADE80]">
          <span className="h-2 w-2 rounded-full bg-[#10B981]" />
          1,248 practising now
        </div>
      </div>
      <div className="space-y-3">
        {[
          ['mcq', 'Daily MCQ Challenge', '10 Questions • All Subjects', 'bg-emerald-500/20', '#10B981'],
          ['pen', 'Daily Answer Writing', 'Answer Writing • Evaluated', 'bg-blue-500/20', '#3B82F6'],
          ['doc', 'Daily Editorial Analysis', 'The Hindu • Key Insights', 'bg-orange-500/20', '#F97316'],
        ].map(([icon, title, subtitle, bg, color]) => (
          <Link key={title} href="/dashboard" className="flex items-start gap-3 rounded-[10px] px-2 py-1.5 transition hover:bg-white/5">
            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] ${bg}`} style={{ color }}>
              <PlatformIcon icon={String(icon)} color={String(color)} />
            </span>
            <span>
              <span className="block text-[13px] font-semibold leading-tight text-white/90">{title}</span>
              <span className="mt-1 block text-[11px] text-white/45">{subtitle}</span>
            </span>
          </Link>
        ))}
      </div>
      <Link href="/?auth=signup" className="mt-4 flex w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-[#F5D06E] to-[#D4AF37] py-3 text-[13px] font-bold text-[#0B1229]">
        Join Now <span>→</span>
      </Link>
    </div>
  );
}

function Explanation({ question }: { question: PublicQuestion }) {
  const explanation = getExplanationText(question);
  if (!explanation) return null;

  const paragraphs = String(explanation)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <div className="mt-5 rounded-[14px] border border-[#BBF7D0] bg-[#F0FDF4] p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#10B981] text-sm font-bold text-white">✓</span>
        <span className="text-[13px] font-bold uppercase tracking-[0.1em] text-[#016630]">Explanation</span>
      </div>
      <div className="space-y-3">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="whitespace-pre-wrap text-[15px] leading-[26px] text-[#364153]">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}

function ModelAnswerMarkdown({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h3 className="mb-2 mt-4 text-[24px] font-bold leading-[24px] text-[#1F2937] first:mt-0">{children}</h3>,
        h2: ({ children }) => <h3 className="mb-2 mt-4 text-[21px] font-bold leading-[23px] text-[#1F2937] first:mt-0">{children}</h3>,
        h3: ({ children }) => <h4 className="mb-2 mt-3 text-[18px] font-bold leading-[22px] text-[#1F2937] first:mt-0">{children}</h4>,
        h4: ({ children }) => <h4 className="mb-1.5 mt-3 text-[16px] font-bold leading-[20px] text-[#374151] first:mt-0">{children}</h4>,
        p: ({ children }) => <p className="mb-2.5 text-[15.5px] leading-relaxed text-[#374151] last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="mb-2.5 ml-4 list-disc space-y-1.5 text-[15.5px] leading-relaxed text-[#374151]">{children}</ul>,
        ol: ({ children }) => <ol className="mb-2.5 ml-4 list-decimal space-y-1.5 text-[15.5px] leading-relaxed text-[#374151]">{children}</ol>,
        li: ({ children }) => <li className="pl-1">{children}</li>,
        strong: ({ children }) => <strong className="font-bold text-[#1f2937]">{children}</strong>,
        em: ({ children }) => <em className="italic text-[#a17c1a]">{children}</em>,
        blockquote: ({ children }) => (
          <blockquote className="my-3 border-l-2 border-[#D4AF37] bg-[#FFFDF5] px-3 py-2 text-[#374151]">{children}</blockquote>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

function ModelAnswerBox({ question }: { question: PublicQuestion }) {
  const answer = getModelAnswerText(question);
  if (!answer) return null;

  return (
    <div className="model-answer-parchment">
      <div className="mb-3 inline-flex items-center gap-2">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B8941E" strokeWidth={2} strokeLinejoin="round">
          <path d="M12 2l2.4 6.4L21 9l-5 4.5L17.5 21 12 17.5 6.5 21 8 13.5 3 9l6.6-.6L12 2z" />
        </svg>
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9a8347]">Model Answer</span>
      </div>
      {/* GS-I/II/III/IV papers use the structured exam layout; essays keep their
          own dedicated format. */}
      {isEssayQuestion(question)
        ? <ModelAnswerMarkdown text={answer} />
        : <CuratedModelAnswer markdown={answer} />}
    </div>
  );
}

function MainsAnswerWorkspace({
  question,
  isLoggedIn,
  onRequireAuth,
}: {
  question: PublicQuestion;
  isLoggedIn: boolean;
  onRequireAuth: () => void;
}) {
  return (
    <EntitlementsProvider>
      <MainsAnswerWorkspaceContent question={question} isLoggedIn={isLoggedIn} onRequireAuth={onRequireAuth} />
    </EntitlementsProvider>
  );
}

function MainsAnswerWorkspaceContent({
  question,
  isLoggedIn,
  onRequireAuth,
}: {
  question: PublicQuestion;
  isLoggedIn: boolean;
  onRequireAuth: () => void;
}) {
  const router = useRouter();
  const entitlements = useEntitlements();
  const mainsQuota = entitlements.featureStatus('mains_evaluation');
  const [open, setOpen] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  // Exact used/limit from the freshest source available (a refresh or the
  // blocking error itself) - the cached EntitlementsContext value can be stale.
  const [mainsQuotaOverride, setMainsQuotaOverride] = useState<{ used: number | null; limit: number | null } | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => getQuestionMainsTimeLimit(question));
  const [readTimeLeft, setReadTimeLeft] = useState<number | null>(15);
  const [timerPaused, setTimerPaused] = useState(true);
  const [textAnswerExpanded, setTextAnswerExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSubmitRef = useRef(false);
  const wordCount = answerText.trim() ? answerText.trim().split(/\s+/).length : 0;

  const resetWriter = () => {
    setAnswerText('');
    setFiles([]);
    setSubmitError(null);
    setTimeLeft(getQuestionMainsTimeLimit(question));
    setReadTimeLeft(15);
    setTimerPaused(true);
    setTextAnswerExpanded(false);
    autoSubmitRef.current = false;
  };

  const openPyqWriteEvaluate = () => {
    if (!isLoggedIn) {
      onRequireAuth();
      return;
    }
    resetWriter();
    setOpen(true);
  };

  useEffect(() => {
    if (!open || timerPaused || readTimeLeft !== null) return;
    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          if (!autoSubmitRef.current) {
            autoSubmitRef.current = true;
            document.getElementById(`question-page-pyq-submit-${question.id}`)?.click();
          }
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [open, timerPaused, readTimeLeft, question.id]);

  useEffect(() => {
    if (!open || readTimeLeft === null) return;
    if (readTimeLeft <= 0) {
      setReadTimeLeft(null);
      setTimerPaused(false);
      return;
    }
    const timer = window.setTimeout(() => setReadTimeLeft((current) => current === null ? null : current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [open, readTimeLeft]);

  const submitForEvaluation = async () => {
    if (!answerText.trim() && files.length === 0) return;
    if (!entitlements.loading && mainsQuota?.allowed === false) {
      // Refresh first: the cached context value may not reflect evaluations
      // submitted earlier in this session on a different page.
      const fresh = await entitlements.refreshEntitlements();
      const freshQuota = fresh?.features?.['mains_evaluation'] ?? mainsQuota;
      if (freshQuota?.allowed === false) {
        setMainsQuotaOverride({ used: freshQuota.used, limit: freshQuota.limit });
        setShowQuotaModal(true);
        return;
      }
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await pyqService.submitMainsAnswer(question.id, {
        answerText: answerText.trim() || undefined,
        files: files.length ? files : undefined,
      });
      const attemptId = res.data?.attemptId;
      if (!attemptId) throw new Error(res.message || 'Could not start your evaluation.');
      sessionStorage.setItem('pyqMainsQuestionPageAttemptId', attemptId);
      sessionStorage.setItem('pyqMainsQuestionPageEvalStartedAt', String(Date.now()));
      sessionStorage.setItem('pyqMainsResultsSession', JSON.stringify({ questionId: question.id, attemptId }));
      setOpen(false);
      setIsEvaluating(true);
      void entitlements.refreshEntitlements();
    } catch (error) {
      const entitlementError = handleEntitlementError(error);
      if (entitlementError.title === 'Limit reached' || entitlementError.title === 'Upgrade required') {
        setMainsQuotaOverride({ used: entitlementError.used, limit: entitlementError.limit });
        setShowQuotaModal(true);
      } else {
        const resetAt = formatQuestionPageResetAt(entitlementError.resetAt);
        setSubmitError(resetAt ? `${entitlementError.message} Try again after ${resetAt}.` : entitlementError.message || 'Failed to submit. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (isEvaluating) {
    return (
      <MainsEvaluatingScreen
        attemptIdKey="pyqMainsQuestionPageAttemptId"
        evalStartKey="pyqMainsQuestionPageEvalStartedAt"
        service={{
          getEvaluationStatus: (attemptId) => pyqService.getMainsEvaluationStatus(question.id, attemptId),
          getResults: (attemptId) => pyqService.getMainsResults(question.id, attemptId),
        }}
        resultsRoute={`/dashboard/pyq/results?questionId=${encodeURIComponent(question.id)}&attemptId=${encodeURIComponent(sessionStorage.getItem('pyqMainsQuestionPageAttemptId') || '')}`}
        backRoute={`/questions/${question.id}?mode=mains`}
      />
    );
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={openPyqWriteEvaluate}
        className="shine-btn group inline-flex items-center gap-2.5 rounded-[12px] border-2 border-[#0B1229] bg-[#0B1229] px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-[#141F42]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ transform: 'scaleX(-1)' }}>
          <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
        Write &amp; Evaluate Your Answer
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="transition-transform group-hover:translate-x-1">
          <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
        </svg>
      </button>
      <MainsEvaluationLimitModal
        open={showQuotaModal}
        onClose={() => setShowQuotaModal(false)}
        tier={entitlements.tier}
        used={mainsQuotaOverride?.used ?? mainsQuota?.used}
        limit={mainsQuotaOverride?.limit ?? mainsQuota?.limit}
        backLabel="Back to question"
      />
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden p-4" style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(8px)' }} onClick={() => setOpen(false)}>
          <div className="flex h-[min(760px,calc(100vh-32px))] w-full max-w-[1180px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0px_28px_70px_rgba(15,23,42,0.35)]" onClick={(event) => event.stopPropagation()}>
            <div className="flex flex-shrink-0 items-center justify-between bg-[#0F1424] px-8 py-5 text-white">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#D9B84A] text-[24px] text-[#0F1424]">✎</div>
                <div>
                  <h2 className="m-0 font-bold" style={{ fontFamily: 'Merriweather, serif', fontSize: 22 }}>Craft Your Answer</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {[question.paper, question.subject].filter(Boolean).filter((label, index, labels) => index === 0 || String(label).toLowerCase() !== String(labels[0]).toLowerCase()).map((label) => {
                      const style = getSubjectMetaStyle(String(label));
                      return <span key={label} className="inline-flex items-center gap-1 rounded-[7px] px-3 py-1 text-[12px] font-bold" style={{ border: `1px solid ${style.border}`, background: style.bg, color: style.color }}><span aria-hidden>{style.icon}</span>{label}</span>;
                    })}
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-white/15 bg-white/10 text-[24px] text-white/70" aria-label="Close">×</button>
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_300px]">
              <div className="flex min-h-0 flex-col overflow-hidden px-8 py-5">
                <div className="flex-shrink-0 rounded-[12px] bg-[#F9FAFB] p-4" style={{ borderLeft: '4px solid #D4AF37' }}>
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#9AA3B2]">Question</div>
                  <QuestionTextRenderer text={question.questionText} textClassName="italic text-[15px] leading-[26px] text-[#1E2939]" />
                </div>
                <div className="mt-3 flex flex-shrink-0 flex-wrap items-center gap-x-6 gap-y-2 text-[13px] font-semibold text-[#6A7282]">
                  <span>◷ {Math.floor(getQuestionMainsTimeLimit(question) / 60)} min</span><span>✍️ {getQuestionMainsWordLimit(question)} words</span><span>☆ {getQuestionMainsMarks(question)} marks</span>
                </div>
                <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={(event) => {
                  const selected = Array.from(event.target.files || []);
                  if (selected.some((file) => file.type === 'application/pdf') && selected.length > 1) { setSubmitError('Upload either one PDF or multiple image pages, not both.'); event.target.value = ''; return; }
                  setFiles(selected); setSubmitError(null);
                }} />
                {!textAnswerExpanded ? <>
                  <div className="mt-4 flex flex-shrink-0 items-center gap-2 text-[16px] font-bold text-[#0F172B]"><span className="text-[#D4AF37]">⇧</span>Upload your answer</div>
                  <div className="mt-3 flex min-h-0 flex-1 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[14px] px-6 py-4 text-center" style={{ border: files.length ? '1.5px dashed #17223E' : '1px dashed #CBD5E1', background: files.length ? '#EFF6FF' : '#F9FAFB' }} onClick={() => fileInputRef.current?.click()}>
                    <div className="mb-3 grid h-12 w-12 place-items-center rounded-[12px] bg-[#0F1424] text-[#D4AF37]">⇧</div><p className="mb-2 text-[16px] font-bold text-[#0F172B]">{files.length > 1 ? `${files.length} pages selected` : files[0]?.name || 'Drop your answer script here'}</p><p className="mb-3 text-[14px] text-[#9AA3B2]">Upload handwritten answers for AI evaluation</p>
                    <div className="mb-3 flex flex-wrap justify-center gap-2">{['JPG', 'PNG', 'PDF', 'Max 10MB'].map((format) => <span key={format} className="rounded bg-[#E5E7EB] px-2.5 py-1 text-[12px] text-[#374151]">{format}</span>)}</div>
                    <button type="button" onClick={(event) => { event.stopPropagation(); fileInputRef.current?.click(); }} className="rounded-[8px] border border-[#D1D5DB] bg-white px-6 py-2 text-[14px] font-bold text-[#111827]">Browse Files</button>
                  </div>
                  <button type="button" onClick={() => setTextAnswerExpanded(true)} className="mt-4 flex w-full flex-shrink-0 items-center gap-3"><span className="h-px flex-1 bg-[#E5E7EB]" /><span className="rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-[13px] font-semibold text-[#6A7282]">⌄ &nbsp; OR Type your answer</span><span className="h-px flex-1 bg-[#E5E7EB]" /></button>
                </> : <>
                  <button type="button" onClick={() => setTextAnswerExpanded(false)} className="mt-4 flex w-full flex-shrink-0 items-center gap-3"><span className="h-px flex-1 bg-[#E5E7EB]" /><span className="rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-[13px] font-semibold text-[#6A7282]">⌃ &nbsp; Hide</span><span className="h-px flex-1 bg-[#E5E7EB]" /></button>
                  <div className="mt-4 flex min-h-0 flex-1 flex-col"><textarea value={answerText} onChange={(event) => setAnswerText(event.target.value)} placeholder="Write your answer here..." autoFocus className="min-h-0 w-full flex-1 resize-none rounded-[10px] border border-[#D1D5DB] bg-[#F9FAFB] p-4 text-[#101828] outline-none" style={{ fontSize: 15, lineHeight: '24px' }} /><p className="mt-1 text-right text-[12px] text-[#6A7282]">{wordCount} words</p></div>
                </>}
                {submitError && <div className="mt-4 rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#B91C1C]">{submitError}</div>}
                <button id={`question-page-pyq-submit-${question.id}`} type="button" disabled={submitting || (!answerText.trim() && files.length === 0)} onClick={submitForEvaluation} className="mt-4 flex h-[48px] w-full flex-shrink-0 items-center justify-center gap-2 rounded-[12px] bg-[#0F1424] text-[15px] font-bold text-white disabled:opacity-45">{submitting ? <><span className="h-5 w-5 animate-spin rounded-full border-b-2 border-white" />Submitting...</> : <>✈️ Submit Answer for Evaluation</>}</button>
              </div>
              <aside className="flex min-h-0 flex-col gap-4 overflow-hidden bg-[#F8F9FB] p-5">
                <div className="rounded-[18px] bg-white p-4 text-center shadow-sm"><div className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#9AA3B2]">Writing Timer</div><div className="mx-auto mb-3 flex h-[180px] w-[180px] items-center justify-center rounded-full border-[5px] border-[#D4AF37]"><div><div className="font-mono text-[32px] font-bold text-[#0B1020]">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</div><div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#9AA3B2]">{readTimeLeft !== null ? `Auto-start ${readTimeLeft}s` : 'Minutes left'}</div></div></div><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => { if (readTimeLeft !== null) { setReadTimeLeft(null); setTimerPaused(false); } else setTimerPaused((paused) => !paused); }} className="rounded-[10px] bg-[#0F1424] px-3 py-2.5 text-[13px] font-bold text-white">▷ {readTimeLeft !== null ? 'Start now' : timerPaused ? 'Resume' : 'Pause'}</button><button type="button" onClick={resetWriter} className="rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2.5 text-[13px] font-bold text-[#4A5565]">↻ Reset</button></div></div>
                <div className="rounded-[18px] bg-white p-4 shadow-sm"><div className="mb-3 text-[14px] font-bold uppercase text-[#0F172B]">💡 Quick Tips</div>{[['✏️', 'Use blue/black ink'], ['📷', 'Clear photo in good lighting'], ['📝', 'Write legibly on white paper']].map(([icon, text]) => <div key={text} className="mb-3 flex items-center gap-3 rounded-[10px] bg-[#F4F5F7] p-2.5 last:mb-0"><span>{icon}</span><span className="text-[13px] font-bold text-[#364153]">{text}</span></div>)}</div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getQuestionMainsMarks(question: PublicQuestion) {
  if (isEssayQuestion(question)) return 125;
  return Number(question.marks || question.maxMarks || question.structuredJson?.marks || question.structuredJson?.maxMarks || 15);
}

function formatQuestionPageResetAt(resetAt?: string | null) {
  if (!resetAt) return null;
  const date = new Date(resetAt);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function getQuestionMainsTimeLimit(question: PublicQuestion) {
  if (isEssayQuestion(question)) return 90 * 60;
  const marks = getQuestionMainsMarks(question);
  return ({ 10: 7 * 60, 15: 11 * 60, 20: 14 * 60 } as Record<number, number>)[marks] || 20 * 60;
}

function getQuestionMainsWordLimit(question: PublicQuestion) {
  if (isEssayQuestion(question)) return '1000–1200';
  const marks = getQuestionMainsMarks(question);
  return ({ 10: 150, 15: 200, 20: 250 } as Record<number, number>)[marks] || 250;
}

function QuestionActionButtons({
  question,
  subject,
  isLoggedIn,
  onRequireAuth,
}: {
  question: PublicQuestion;
  subject: string;
  isLoggedIn: boolean;
  onRequireAuth: () => void;
}) {
  const [reviewStatus, setReviewStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');
  const [flashcardStatus, setFlashcardStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const addFlashcard = async () => {
    if (!isLoggedIn) return onRequireAuth();
    if (flashcardStatus === 'saving' || flashcardStatus === 'saved') return;
    setFlashcardStatus('saving');
    try {
      const subjectId = slugify(subject);
      const topic = cleanText(question.topic) || cleanText(question.paper) || 'Custom';
      const topicId = slugify(topic);
      await flashcardService.createCard({
        subjectId,
        subject,
        topicId,
        topic,
        question: question.questionText,
        answer: getModelAnswerText(question) || 'Refer to the model answer on RiseWithJeet.',
        difficulty: cleanText(question.difficulty) || undefined,
      });
      setFlashcardStatus('saved');
    } catch {
      setFlashcardStatus('error');
    }
  };

  const addReviewLater = async () => {
    if (!isLoggedIn) return onRequireAuth();
    if (reviewStatus === 'saving' || reviewStatus === 'saved') return;
    setReviewStatus('saving');
    try {
      await spacedRepService.addItem({
        questionText: question.questionText,
        answer: getModelAnswerText(question) || undefined,
        subject,
        source: 'PYQ Mains',
        sourceType: 'pyq',
      });
      setReviewStatus('saved');
    } catch {
      setReviewStatus('error');
    }
  };

  const share = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: 'UPSC Mains PYQ', text: truncateForUi(question.questionText, 100), url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    } catch {
      // user cancelled share or clipboard unavailable - no-op
    }
  };

  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={addFlashcard}
        className="flex items-center gap-2 rounded-[10px] border border-[#E2E6EE] bg-white px-4 py-2.5 text-[13px] font-medium text-[#4A5568] transition hover:border-[#D4AF37] hover:text-[#B8941E] disabled:opacity-60"
        disabled={flashcardStatus === 'saving' || flashcardStatus === 'saved'}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
        {flashcardStatus === 'saving' ? 'Adding...' : flashcardStatus === 'saved' ? 'Added to Flashcards ✓' : flashcardStatus === 'error' ? 'Try again' : 'Add to Flashcard'}
      </button>
      <button
        type="button"
        onClick={addReviewLater}
        className="flex items-center gap-2 rounded-[10px] border border-[#E2E6EE] bg-white px-4 py-2.5 text-[13px] font-medium text-[#4A5568] transition hover:border-[#D4AF37] hover:text-[#B8941E]"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
        {reviewStatus === 'saving' ? 'Saving...' : reviewStatus === 'saved' ? 'Added to Review' : reviewStatus === 'error' ? 'Try again' : 'Review Later'}
      </button>
      <button
        type="button"
        onClick={share}
        className="flex items-center gap-2 rounded-[10px] border border-[#E2E6EE] bg-white px-4 py-2.5 text-[13px] font-medium text-[#4A5568] transition hover:border-[#D4AF37] hover:text-[#B8941E]"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
        {shareStatus === 'copied' ? 'Link Copied!' : 'Share'}
      </button>
    </div>
  );
}

function AnswerLengthNote() {
  return (
    <div className="mt-4 flex items-start gap-3 rounded-[10px] border border-[#E2E6EE] bg-[#F8F9FB] px-4 py-3">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B95A8" strokeWidth={2} className="mt-0.5 shrink-0">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      <p className="text-[12px] leading-relaxed text-[#6B7280]">
        <strong className="text-[#4A5568]">Note:</strong> Model answers may exceed the prescribed word limit for better clarity and depth. Use them as a reference - always frame your final answer within the exam&apos;s word limit.
      </p>
    </div>
  );
}

function EvaluateAnswerCard() {
  return (
    <div className="eval-card rounded-[14px] border border-[#E2E6EE] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[14px] font-bold text-[#1F2937]">Evaluate Your Answer</p>
          <p className="eval-subline mt-0.5 text-[10px] text-[#6B7280]">Jeet AI-powered assessment</p>
        </div>
        <div className="eval-writing-scene" aria-hidden="true">
          <div className="answer-copy" />
          <svg className="answer-pen" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
          </svg>
          <span className="answer-spark" />
        </div>
      </div>

      <div className="mb-4 space-y-3">
        {[
          { icon: 'M22 11.08V12a10 10 0 11-5.93-9.14', check: true, bg: 'bg-[#ECFDF5]', color: '#10B981', title: 'Instant Feedback', sub: 'Get marks & suggestions within 60 seconds' },
          { icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z', bg: 'bg-[#EFF6FF]', color: '#3B82F6', title: 'Detailed Analysis', sub: 'Strengths, weaknesses & improvements' },
          { icon: 'M22 12h-4l-3 9L9 3l-3 9H2', bg: 'bg-[#F5F3FF]', color: '#8B5CF6', title: 'Track Progress', sub: 'Monitor improvement over time' },
        ].map((item) => (
          <div key={item.title} className="flex items-start gap-2.5">
            <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] ${item.bg}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth={2.5}><path d={item.icon} /></svg>
            </div>
            <div>
              <p className="text-[12px] font-semibold leading-tight text-[#1F2937]">{item.title}</p>
              <p className="mt-0.5 text-[10px] text-[#6B7280]">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <Link href="/?auth=signup" className="group flex w-full items-center justify-center gap-1.5 rounded-[8px] bg-gradient-to-r from-[#F5D06E] to-[#D4AF37] py-2.5 text-[12px] font-bold text-[#0B1229] transition hover:-translate-y-px hover:shadow-[0_3px_10px_rgba(212,175,55,0.3)]">
        Write Now
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="transition-transform group-hover:translate-x-0.5"><path d="M5 12h14" /></svg>
      </Link>
    </div>
  );
}

function PublicHeader() {
  return (
    <div className="question-public-nav">
      <LandingNav />
    </div>
  );
}

function AuthQuestionHeader({ userName, initials }: { userName?: string; initials?: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[rgba(7,14,30,0.98)] backdrop-blur-[24px]">
      <div className="mx-auto flex h-[66px] max-w-[1280px] items-center justify-between px-5 sm:px-8">
        <Link href="/dashboard" className="flex items-center">
          <Image
            src="/logo.png"
            alt="RiseWithJeet"
            width={500}
            height={500}
            className="h-auto w-[90px] object-contain md:w-[110px]"
          />
        </Link>
        <nav className="hidden items-center gap-7 text-[14px] font-medium md:flex" style={{ fontFamily: "'Outfit', sans-serif" }}>
          <Link href="/dashboard" className="text-white/60 transition hover:text-[#E8B84B]">Dashboard</Link>
          <Link href="/dashboard/pyq" className="text-white/60 transition hover:text-[#E8B84B]">PYQ Bank</Link>
          <Link href="/dashboard/saved-notes?tab=pyq" className="text-white/60 transition hover:text-[#E8B84B]">Saved PYQs</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/pyq" className="rounded-[8px] bg-gradient-to-br from-[#E8B84B] to-[#C8960A] px-4 py-2 text-[13.5px] font-bold text-[#061125] shadow-[0_4px_16px_rgba(232,184,75,0.3)] transition hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(232,184,75,0.45)]">
            Back to PYQ
          </Link>
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A2540] text-white transition hover:bg-[#243050]"
            style={{ border: '1px solid rgba(255,255,255,0.16)' }}
            aria-label="Notifications"
            title="Notifications"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9Z" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#EF4444]" />
          </button>
          <Link
            href="/dashboard/profile"
            className="flex h-12 w-12 items-center justify-center rounded-full text-[18px] font-bold text-[#0E182D] transition hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #FFD170 0%, #D4A843 100%)', fontFamily: 'Georgia, serif' }}
            title={userName || 'Profile'}
            aria-label="Profile"
          >
            {initials || 'U'}
          </Link>
        </div>
      </div>
    </header>
  );
}

function PublicSidebar({
  onDashboardLinkClick,
  onSignupClick,
  showTrustBadge = true,
}: {
  onDashboardLinkClick: DashboardLinkGuard;
  onSignupClick: () => void;
  showTrustBadge?: boolean;
}) {
  return (
    <>
      {showTrustBadge ? (
        <div className="rounded-[18px] border border-[#D1FAE5] bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_28px_rgba(15,23,42,0.06)]">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#10B981] px-3 py-1.5 text-[12px] font-bold text-white">
            <span>★</span> Trusted by 15,000+ aspirants
          </div>
          <h3 className="mb-3 text-[24px] font-bold leading-[1.15] text-[#111827]" style={{ fontFamily: 'var(--font-cormorant-garamond), Georgia, serif' }}>
            Master UPSC with India&apos;s Smartest PYQ Platform
          </h3>
          <ul className="mb-5 space-y-2.5 text-[14px] leading-[1.5] text-[#4A5565]">
            <li>✓ 6,500+ questions with detailed explanations</li>
            <li>✓ AI-powered performance analytics</li>
            <li>✓ Track weak areas and repeated themes</li>
          </ul>
          <button type="button" onClick={onSignupClick} className="block w-full rounded-[12px] bg-gradient-to-r from-[#F5D06E] to-[#D4AF37] px-5 py-3 text-center text-[15px] font-bold text-[#0B1229] shadow-[0_6px_18px_rgba(212,175,55,0.28)]">
            Start Practicing Free →
          </button>
        </div>
      ) : null}

      <div className="rounded-[18px] border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <h4 className="mb-4 text-[12px] font-bold uppercase tracking-[0.18em] text-[#8B95A8]">Explore Our Platform</h4>
        <div className="space-y-2.5">
          {PLATFORM_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} onClick={onDashboardLinkClick} className="group flex items-center gap-3 rounded-[12px] p-3 transition hover:bg-[#F8F9FB]">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br ${item.bg}`}>
                <PlatformIcon icon={item.icon} />
              </span>
              <span>
                <span className="block text-[14px] font-bold text-[#1F2937] transition group-hover:text-[#B8941E]">{item.title}</span>
                <span className="block text-[12px] text-[#8B95A8]">{item.subtitle}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      <TodaysTrioCard />
    </>
  );
}

function PracticeSidebar({
  isPrelims,
  revealed,
  selectedOption,
  correctOption,
  submitStatus,
  submitError,
  nextHref,
  onBookmark,
  bookmarkStatus,
  bookmarked,
  revisionMarked,
  onRevision,
  question,
}: {
  isPrelims: boolean;
  revealed: boolean;
  selectedOption: string | null;
  correctOption: string;
  submitStatus: 'idle' | 'saving' | 'saved' | 'error';
  submitError: string | null;
  nextHref?: string;
  onBookmark: () => void;
  bookmarkStatus: 'idle' | 'saving' | 'saved' | 'error';
  bookmarked: boolean;
  revisionMarked: boolean;
  onRevision: () => void;
  question: PublicQuestion;
}) {
  const isCorrect = revealed && selectedOption && correctOption && selectedOption === correctOption;
  return (
    <>
      {isPrelims ? (
        <div className="rounded-[18px] border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.16em] text-[#8B95A8]">Practice Status</p>
          <h3 className="text-[22px] font-bold leading-[1.15] text-[#111827]" style={{ fontFamily: 'var(--font-cormorant-garamond), Georgia, serif' }}>
            {revealed ? (isCorrect ? 'Correct answer' : 'Review this one') : 'Attempt this question'}
          </h3>
          <div className="mt-4 rounded-[12px] border border-[#E5E7EB] bg-[#F8F9FB] p-4">
            <div className="flex items-center justify-between text-[13px]">
              <span className="font-semibold text-[#6B7280]">Your answer</span>
              <span className="font-bold text-[#111827]">{selectedOption || 'Not attempted'}</span>
            </div>
            {revealed ? (
              <div className="mt-2 flex items-center justify-between text-[13px]">
                <span className="font-semibold text-[#6B7280]">Correct answer</span>
                <span className="font-bold text-[#047857]">{correctOption || 'See explanation'}</span>
              </div>
            ) : null}
          </div>
          <p className="mt-3 text-[12px] leading-5 text-[#6B7280]">
            {submitStatus === 'saving'
              ? 'Saving your attempt...'
              : submitStatus === 'saved'
                ? 'Attempt saved to your account.'
                : submitStatus === 'error'
                  ? `Attempt shown locally. ${submitError || 'Could not save right now.'}`
                  : 'Choose an option to reveal the explanation.'}
          </p>
        </div>
      ) : null}

      <div className="rounded-[18px] border border-[#E5E7EB] bg-white p-5 text-[13px] shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.16em] text-[#8B95A8]">Question Details</p>
        {[
          ['Year', question.year || 'UPSC'],
          ['Subject', cleanText(question.subject) || 'UPSC'],
          ['Topic', cleanText(question.topic) || cleanText(question.paper) || 'General'],
          ['Difficulty', cleanText(question.difficulty) || 'Medium'],
        ].map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-3 border-t border-[#F1F3F7] py-2 first:border-t-0">
            <span className="font-semibold text-[#8B95A8]">{label}</span>
            <span className="max-w-[190px] text-right font-bold text-[#364153]">{value}</span>
          </div>
        ))}
      </div>

      <div className="rounded-[18px] border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <div className="grid gap-3">
          <Link href="/dashboard/pyq" className="rounded-[12px] border border-[#E5E7EB] px-4 py-3 text-center text-[14px] font-bold text-[#111827] hover:bg-[#F8F9FB]">
            Back to PYQ List
          </Link>
          {nextHref ? (
            <Link href={nextHref} className="rounded-[12px] bg-[#0B1229] px-4 py-3 text-center text-[14px] font-bold text-white">
              Next PYQ →
            </Link>
          ) : null}
          <button type="button" onClick={onBookmark} disabled={bookmarkStatus === 'saving'} className="rounded-[12px] border border-[#E5E7EB] px-4 py-3 text-[14px] font-bold text-[#111827] hover:bg-[#F8F9FB] disabled:opacity-60">
            {bookmarkStatus === 'saving' ? 'Saving...' : bookmarked ? 'Bookmarked' : 'Bookmark'}
          </button>
          <button type="button" onClick={onRevision} className="rounded-[12px] border border-[#E5E7EB] px-4 py-3 text-[14px] font-bold text-[#111827] hover:bg-[#F8F9FB]">
            {revisionMarked ? 'Marked for Revision' : 'Mark for Revision'}
          </button>
          <Link href="/contact" className="rounded-[12px] border border-[#E5E7EB] px-4 py-3 text-center text-[14px] font-bold text-[#6B7280] hover:bg-[#F8F9FB]">
            Report Issue
          </Link>
        </div>
      </div>
    </>
  );
}

export default function QuestionDetailClient({ question, mode, relatedQuestions, pyqNavigation }: Props) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkStatus, setBookmarkStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [revisionMarked, setRevisionMarked] = useState(false);
  const options = useMemo(() => optionList(question), [question]);
  const correctOption = cleanText(question.correctOption);
  const isPrelims = mode === 'prelims';
  const questionNumber = question.questionNum || 1;
  const year = question.year || undefined;
  const subject = cleanText(question.subject) || 'UPSC';
  const subSubject = cleanText(question.subSubject);
  const topic = cleanText(question.topic);
  const difficulty = cleanText(question.difficulty) || 'Medium';
  const paper = cleanText(question.paper) || (isPrelims ? 'Prelims' : 'Mains');
  const isLoggedIn = isAuthenticated && !isLoading;
  const displayName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email?.split('@')[0] || '';
  const userInitials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || 'U';
  const nextHref = relatedQuestions[0]
    ? `/questions/${relatedQuestions[0].id}${mode === 'mains' ? '?mode=mains' : ''}`
    : undefined;

  const guardPublicDashboardLink = (event: MouseEvent<HTMLAnchorElement>) => {
    if (isLoggedIn) return;
    event.preventDefault();
    openAuthModal('signup');
  };

  useEffect(() => {
    setSelectedOption(null);
    setRevealed(false);
    setSubmitStatus('idle');
    setSubmitError(null);
    setBookmarkStatus('idle');
    setRevisionMarked(false);
  }, [question.id]);

  useEffect(() => {
    if (!isLoggedIn) return;
    bookmarkService.check('pyq', question.id)
      .then((res) => setBookmarked(Boolean(res.data?.bookmarked || res.data?.isBookmarked)))
      .catch(() => undefined);
  }, [isLoggedIn, question.id]);

  const chooseOption = async (label: string) => {
    if (revealed) return;
    setSelectedOption(label);
    setRevealed(true);
    setSubmitError(null);
    if (isLoggedIn && isPrelims) {
      setSubmitStatus('saving');
      try {
        await pyqService.submitPrelimsAnswer(question.id, label);
        setSubmitStatus('saved');
      } catch (error) {
        setSubmitStatus('error');
        setSubmitError(error instanceof Error ? error.message : 'Could not save right now.');
      }
    }
  };

  const handleBookmark = async () => {
    if (!isLoggedIn) {
      openAuthModal('signup');
      return;
    }
    setBookmarkStatus('saving');
    try {
      await bookmarkService.toggle({
        entityType: 'pyq',
        entityId: question.id,
        title: truncateForUi(question.questionText, 90),
        source: 'PYQ',
        sourceUrl: `/questions/${question.id}${mode === 'mains' ? '?mode=mains' : ''}`,
        tag: `${year || 'UPSC'} · ${subject}`,
        content: {
          mode,
          year,
          subject,
          topic,
          difficulty,
        },
      });
      setBookmarked((prev) => !prev);
      setBookmarkStatus('saved');
    } catch {
      setBookmarkStatus('error');
    }
  };

  const handleRevision = () => {
    setRevisionMarked((prev) => !prev);
  };

  // Keep legacy public Essay URLs on the same dedicated UI as the dashboard route.
  if (mode === 'mains' && isEssayQuestion(question)) {
    return (
      <EntitlementsProvider>
        <EssayModelAnswerClient questionId={question.id} />
      </EntitlementsProvider>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#1E293B]" style={{ fontFamily: 'var(--font-dm-sans), Inter, sans-serif' }}>
      <style jsx global>{`
        .question-public-nav .landing-nav {
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .question-card-hover {
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .question-card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
          border-color: rgba(212, 175, 55, 0.45);
        }
        .shine-btn {
          position: relative;
          overflow: hidden;
          isolation: isolate;
        }
        .shine-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -80%;
          width: 65%;
          height: 100%;
          background: linear-gradient(
            120deg,
            transparent 0%,
            rgba(245, 208, 110, 0.00) 25%,
            rgba(245, 208, 110, 0.22) 44%,
            rgba(255, 255, 255, 0.42) 50%,
            rgba(245, 208, 110, 0.22) 56%,
            rgba(245, 208, 110, 0.00) 75%,
            transparent 100%
          );
          transform: skewX(-22deg);
          pointer-events: none;
          opacity: 0;
          z-index: 1;
        }
        .shine-btn:hover::before {
          animation: shineSweep 1.1s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
        }
        .shine-btn > * {
          position: relative;
          z-index: 2;
        }
        @keyframes shineSweep {
          0%   { left: -75%; opacity: 0; }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { left: 120%; opacity: 0; }
        }
        .model-answer-parchment {
          position: relative;
          isolation: isolate;
          border-radius: 14px;
          padding: 24px 26px 22px;
          margin-top: 6px;
          background:
            radial-gradient(ellipse 90% 70% at 90% 100%, rgba(212, 175, 55, 0.045) 0%, transparent 60%),
            radial-gradient(ellipse 80% 60% at 5% 0%, rgba(245, 208, 110, 0.035) 0%, transparent 55%),
            linear-gradient(180deg, #ffffff 0%, #fdfcf8 100%);
          border: 1px solid rgba(212, 175, 55, 0.14);
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          will-change: transform;
        }
        .model-answer-parchment:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(184, 148, 30, 0.10);
          border-color: rgba(212, 175, 55, 0.34);
        }
        @media (prefers-reduced-motion: reduce) {
          .model-answer-parchment { transition: none; }
          .model-answer-parchment:hover { transform: none; }
        }
        .eval-card {
          background: linear-gradient(135deg, #faf8f5 0%, #ffffff 100%);
          box-shadow: 0 10px 32px rgba(15, 27, 61, 0.06);
          transition: box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .eval-card:hover {
          border-color: rgba(212, 175, 55, 0.34);
          box-shadow: 0 16px 42px rgba(15, 27, 61, 0.1), 0 0 0 1px rgba(212, 175, 55, 0.08);
        }
        .eval-writing-scene {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background:
            radial-gradient(circle at 30% 20%, rgba(245, 208, 110, 0.3), transparent 40%),
            radial-gradient(circle at 70% 80%, rgba(212, 175, 55, 0.12), transparent 40%),
            linear-gradient(145deg, #fffdf5 0%, #fdf6e3 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 4px 16px rgba(212, 175, 55, 0.12);
        }
        .answer-copy {
          width: 26px;
          height: 32px;
          border-radius: 4px;
          background: linear-gradient(180deg, #ffffff 0%, #fffef9 100%);
          border: 1px solid rgba(212, 175, 55, 0.2);
          box-shadow: 0 3px 10px rgba(212, 175, 55, 0.08);
          position: relative;
          transform: rotate(-1.5deg);
        }
        .answer-copy::before {
          content: '';
          position: absolute;
          top: 5px;
          left: 4px;
          right: 4px;
          height: 2px;
          border-radius: 999px;
          background: rgba(212, 175, 55, 0.2);
        }
        .answer-copy::after {
          content: '';
          position: absolute;
          left: 4px;
          top: 11px;
          width: 0;
          height: 1.5px;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(212, 175, 55, 0.5), rgba(212, 175, 55, 0.8));
          box-shadow: 0 5px 0 rgba(212, 175, 55, 0.18), 0 10px 0 rgba(212, 175, 55, 0.12);
          animation: evalInkWrite 3.5s ease-in-out infinite;
        }
        .answer-pen {
          position: absolute;
          width: 16px;
          height: 16px;
          right: 10px;
          top: 14px;
          z-index: 3;
          filter: drop-shadow(0 2px 4px rgba(212, 175, 55, 0.25));
          transform-origin: 75% 75%;
          animation: evalPenWriting 3.5s cubic-bezier(0.37, 0, 0.22, 1) infinite;
        }
        .answer-spark {
          position: absolute;
          right: 6px;
          top: 6px;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          display: block;
          background: rgba(245, 208, 110, 0.8);
          box-shadow: 0 0 6px rgba(212, 175, 55, 0.4);
          animation: evalSpark 3.5s ease-in-out infinite;
        }
        .eval-subline {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .eval-subline::before {
          content: '';
          width: 5px;
          height: 5px;
          border-radius: 999px;
          background: #10b981;
          animation: evalAiPulse 2.2s ease-out infinite;
        }
        @keyframes evalPenWriting {
          0%, 100% { transform: translate(-4px, -2px) rotate(-15deg); }
          25% { transform: translate(-2px, 1px) rotate(-12deg); }
          50% { transform: translate(0px, 3px) rotate(-10deg); }
          75% { transform: translate(-3px, 5px) rotate(-13deg); }
        }
        @keyframes evalInkWrite {
          0%, 10% { width: 0; opacity: 0.2; }
          40% { width: 10px; opacity: 0.7; }
          65% { width: 16px; opacity: 0.7; }
          85%, 100% { width: 16px; opacity: 0.3; }
        }
        @keyframes evalSpark {
          0%, 25%, 100% { opacity: 0; transform: scale(0.4); }
          50%, 70% { opacity: 0.8; transform: scale(1); }
        }
        @keyframes evalAiPulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.35); }
          70% { box-shadow: 0 0 0 5px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .pyq-cta-section { background: #F4F6FA; padding: 80px 20px; }
        .pyq-cta-box { max-width: 700px; margin: 0 auto; background: linear-gradient(135deg,#0B1530 0%,#0F2050 100%); border-radius: 24px; padding: 60px 40px; text-align: center; position: relative; overflow: hidden; box-shadow: 0 40px 80px rgba(11,29,58,0.24); border: 1px solid rgba(255,255,255,0.07); }
        .pyq-cta-box::before { content: ''; position: absolute; top: -80px; left: -80px; width: 320px; height: 320px; border-radius: 50%; background: rgba(232,184,75,0.06); pointer-events: none; }
        .pyq-cta-box::after { content: ''; position: absolute; bottom: -60px; right: -60px; width: 250px; height: 250px; border-radius: 50%; background: rgba(46,93,179,0.08); pointer-events: none; }
        .pyq-cta-box h2 { font-family: var(--font-cormorant-garamond), Georgia, serif; font-size: clamp(30px,4vw,50px); font-weight: 700; letter-spacing: -1.2px; color: #FFFFFF; margin-bottom: 14px; position: relative; z-index: 1; line-height: 1.08; }
        .pyq-cta-box p { font-size: 16px; color: rgba(255,255,255,0.58); max-width: 420px; margin: 0 auto 36px; line-height: 1.65; position: relative; z-index: 1; }
        .pyq-cta-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; position: relative; z-index: 1; }
        .pyq-cta-primary { padding: 15px 38px; background: linear-gradient(135deg,#E8B84B,#B8780A); color: #0B1530; border: none; border-radius: 12px; font-size: 15.5px; font-weight: 700; cursor: pointer; transition: all 0.25s; box-shadow: 0 8px 28px rgba(232,184,75,0.38); }
        .pyq-cta-primary:hover { transform: translateY(-2px); box-shadow: 0 16px 44px rgba(232,184,75,0.5); }
        .pyq-cta-secondary { display: inline-block; padding: 15px 36px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.16); color: #FFFFFF; border-radius: 12px; font-size: 15.5px; font-weight: 600; cursor: pointer; backdrop-filter: blur(8px); transition: all 0.25s; }
        .pyq-cta-secondary:hover { background: rgba(255,255,255,0.11); transform: translateY(-2px); border-color: rgba(255,255,255,0.28); }
        @media (max-width: 640px) {
          .pyq-cta-box { padding: 40px 20px; }
          .pyq-cta-btns { flex-direction: column; align-items: center; }
          .pyq-cta-primary, .pyq-cta-secondary { width: 100%; max-width: 300px; text-align: center; }
        }
      `}</style>

      {isLoggedIn ? <AuthQuestionHeader userName={displayName} initials={userInitials} /> : <PublicHeader />}

      <nav className="mx-auto max-w-[1280px] px-5 pb-4 pt-6 text-[14px] font-medium text-[#8B95A8] sm:px-8">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-[#D4AF37]">Home</Link></li>
          <li>›</li>
          <li><Link href="/dashboard/pyq" onClick={guardPublicDashboardLink} className="hover:text-[#D4AF37]">Previous Year Questions</Link></li>
          <li>›</li>
          <li className="capitalize">{mode}</li>
          {year ? <><li>›</li><li>{year}</li></> : null}
          <li>›</li>
          <li className="max-w-[360px] truncate text-[#364153]">{question.questionText}</li>
        </ol>
      </nav>

      <main className="mx-auto grid max-w-[1280px] grid-cols-1 gap-8 px-5 pb-14 sm:px-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <article className="overflow-hidden rounded-[18px] border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_30px_rgba(15,23,42,0.06)]">
            <div className="h-1 bg-gradient-to-r from-[#F5D06E] via-[#D4AF37] to-[#B8941E]" />
            <div className="p-6 sm:p-9">
              <div className="mb-6 flex flex-wrap gap-2">
                {year ? <QuestionChip className={chipStyles.year}>UPSC {year}</QuestionChip> : null}
                <QuestionChip className={chipStyles.subject}>{subject}</QuestionChip>
                {subSubject ? <QuestionChip className={chipStyles.subSubject}>{subSubject}</QuestionChip> : null}
                {topic ? <QuestionChip className={chipStyles.topic}>{topic}</QuestionChip> : null}
                <QuestionChip className={difficultyClass(difficulty)}>{difficulty}</QuestionChip>
                <QuestionChip className={isPrelims ? 'bg-[#ECFDF5] text-[#047857]' : chipStyles.mains}>{mode}</QuestionChip>
              </div>

              <div className="mb-5 flex items-center justify-between">
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#9CA3AF]">
                  {mode} · Question #{questionNumber} · {paper}
                </p>
                <button
                  type="button"
                  onClick={handleBookmark}
                  disabled={bookmarkStatus === 'saving'}
                  title={bookmarked ? 'Bookmarked' : 'Bookmark'}
                  aria-label={bookmarked ? 'Bookmarked' : 'Bookmark'}
                  className={`shrink-0 transition hover:text-[#D4AF37] disabled:opacity-60 ${bookmarked ? 'text-[#D4AF37]' : 'text-[#C9CFDB]'}`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                  </svg>
                </button>
              </div>

              {isPrelims ? (
                <StructuredQuestionRenderer
                  questionStructure={question.questionStructure}
                  questionText={question.questionText}
                  className="mb-7 text-[20px] font-medium leading-[1.65] text-[#111827]"
                  textClassName="text-[20px] font-medium leading-[1.65] text-[#111827]"
                  textStyle={{ fontFamily: QUESTION_FONT }}
                />
              ) : (
                <QuestionTextRenderer
                  text={question.questionText}
                  className="mb-7 text-[20px] font-medium leading-[1.65] text-[#111827]"
                  textClassName="text-[20px] font-medium leading-[1.65] text-[#111827]"
                  textStyle={{ fontFamily: QUESTION_FONT }}
                />
              )}

              {options.length > 0 ? (
                <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {options.map((option) => {
                    const isCorrect = option.label === correctOption;
                    const isSelected = option.label === selectedOption;
                    const showCorrect = revealed && isCorrect;
                    const showIncorrect = revealed && isSelected && !isCorrect;
                    const stateClass = showCorrect
                      ? 'border-[#10B981] bg-[#F0FDF9] text-[#065F46]'
                      : showIncorrect
                        ? 'border-[#EF4444] bg-[#FEF2F2] text-[#991B1B]'
                        : 'border-[#E2E6EE] bg-white text-[#1E293B] hover:translate-x-1 hover:border-[#D4AF37] hover:bg-[#FFFDF5]';
                    const letterClass = showCorrect
                      ? 'bg-[#10B981] text-white'
                      : showIncorrect
                        ? 'bg-[#EF4444] text-white'
                        : 'bg-[#F1F4F9] text-[#475067]';

                    return (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => chooseOption(option.label)}
                        className={`flex min-h-[58px] w-full items-center gap-4 rounded-[14px] border px-5 py-4 text-left transition ${stateClass}`}
                      >
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[14px] font-bold ${letterClass}`}>
                          {option.label}
                        </span>
                        <span className="whitespace-pre-wrap text-[18px] leading-[29px]" style={{ fontFamily: QUESTION_FONT }}>{option.text}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {!revealed && options.length > 0 ? (
                <div className="rounded-[14px] border border-dashed border-[#C9CFDB] px-5 py-3.5 text-center text-[15px] font-bold text-[#475569]">
                  Select an option to reveal the answer and explanation.
                </div>
              ) : null}

              {isPrelims ? (
                <>
                  {(revealed || !options.length) ? <Explanation question={question} /> : null}

                  {revealed ? (
                    <QuestionActionButtons
                      question={question}
                      subject={subject}
                      isLoggedIn={isLoggedIn}
                      onRequireAuth={() => openAuthModal('signup')}
                    />
                  ) : null}

                  {!isLoggedIn && revealed ? (
                    <div className="mt-5 rounded-[16px] border border-[#F5D06E]/60 bg-[#FFFDF5] p-5">
                      <p className="text-[15px] font-bold text-[#0B1229]">Want to save this attempt?</p>
                      <p className="mt-1 text-[13px] leading-5 text-[#6B7280]">Your answer was checked locally. Create an account to save progress, bookmarks, and revision history.</p>
                      <button type="button" onClick={() => openAuthModal('signup')} className="mt-4 rounded-[12px] bg-[#0B1229] px-5 py-3 text-[14px] font-bold text-white">
                        Save Progress for Free
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="border-t border-[#E5E7EB] pt-5">
                  <ModelAnswerBox question={question} />
                  <MainsAnswerWorkspace
                    question={question}
                    isLoggedIn={isLoggedIn}
                    onRequireAuth={() => openAuthModal('signup')}
                  />
                  <QuestionActionButtons
                    question={question}
                    subject={subject}
                    isLoggedIn={isLoggedIn}
                    onRequireAuth={() => openAuthModal('signup')}
                  />
                </div>
              )}
            </div>
          </article>

          {!isPrelims ? <AnswerLengthNote /> : null}

          {relatedQuestions.length > 0 ? (
            <section className="mt-10">
              <h2 className="mb-5 text-[26px] font-bold text-[#1F2937]" style={{ fontFamily: 'var(--font-cormorant-garamond), Georgia, serif' }}>
                More Questions from {year ? `UPSC ${year}` : subject}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {relatedQuestions.map((related) => (
                  <Link
                    key={related.id}
                    href={`/questions/${related.id}${mode === 'mains' ? '?mode=mains' : ''}`}
                    className="question-card-hover rounded-[14px] border border-[#E2E6EE] bg-white p-4"
                  >
                    <div className="mb-2 flex flex-wrap gap-2">
                      <QuestionChip className={chipStyles.subject}>{cleanText(related.subject) || subject}</QuestionChip>
                      <QuestionChip className={difficultyClass(related.difficulty)}>{cleanText(related.difficulty) || 'Medium'}</QuestionChip>
                    </div>
                    <p className="line-clamp-2 text-[14px] font-semibold leading-[1.5] text-[#364153]">
                      {related.questionText}
                    </p>
                    <p className="mt-2 text-[12px] text-[#8B95A8]">
                      Question #{related.questionNum || 1} · {cleanText(related.topic) || cleanText(related.paper) || mode}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <YearWisePyqSection activeYear={year} mode={mode} navigation={pyqNavigation} onDashboardLinkClick={isLoggedIn ? undefined : guardPublicDashboardLink} />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-[96px] lg:self-start">
          {!isPrelims ? <EvaluateAnswerCard /> : null}
          {isLoggedIn ? (
            <PracticeSidebar
              isPrelims={isPrelims}
              revealed={revealed}
              selectedOption={selectedOption}
              correctOption={correctOption}
              submitStatus={submitStatus}
              submitError={submitError}
              nextHref={nextHref}
              onBookmark={handleBookmark}
              bookmarkStatus={bookmarkStatus}
              bookmarked={bookmarked}
              revisionMarked={revisionMarked}
              onRevision={handleRevision}
              question={question}
            />
          ) : (
            <PublicSidebar onDashboardLinkClick={guardPublicDashboardLink} onSignupClick={() => openAuthModal('signup')} showTrustBadge={isPrelims} />
          )}
        </aside>
      </main>

      {!isLoggedIn ? (
        <section className="pyq-cta-section">
          <style>{`
            .pyq-cta-section { background: #F4F6FA; padding: 80px 20px; }
            .pyq-cta-box { max-width: 700px; margin: 0 auto; background: linear-gradient(135deg,#0B1530 0%,#0F2050 100%); border-radius: 24px; padding: 60px 40px; text-align: center; position: relative; overflow: hidden; box-shadow: 0 40px 80px rgba(11,29,58,0.24); border: 1px solid rgba(255,255,255,0.07); }
            .pyq-cta-box::before { content: ''; position: absolute; top: -80px; left: -80px; width: 320px; height: 320px; border-radius: 50%; background: rgba(232,184,75,0.06); pointer-events: none; }
            .pyq-cta-box::after { content: ''; position: absolute; bottom: -60px; right: -60px; width: 250px; height: 250px; border-radius: 50%; background: rgba(46,93,179,0.08); pointer-events: none; }
            .pyq-cta-box h2 { font-family: var(--font-cormorant-garamond), Georgia, serif; font-size: clamp(30px,4vw,50px); font-weight: 700; letter-spacing: -1.2px; color: #FFFFFF; margin-bottom: 14px; position: relative; z-index: 1; line-height: 1.08; }
            .pyq-cta-box p { font-size: 16px; color: rgba(255,255,255,0.58); max-width: 420px; margin: 0 auto 36px; line-height: 1.65; position: relative; z-index: 1; }
            .pyq-cta-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; position: relative; z-index: 1; }
            .pyq-cta-primary { padding: 15px 38px; background: linear-gradient(135deg,#E8B84B,#B8780A); color: #0B1530; border: none; border-radius: 12px; font-size: 15.5px; font-weight: 700; cursor: pointer; transition: all 0.25s; box-shadow: 0 8px 28px rgba(232,184,75,0.38); }
            .pyq-cta-primary:hover { transform: translateY(-2px); box-shadow: 0 16px 44px rgba(232,184,75,0.5); }
            .pyq-cta-secondary { display: inline-block; padding: 15px 36px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.16); color: #FFFFFF; border-radius: 12px; font-size: 15.5px; font-weight: 600; cursor: pointer; backdrop-filter: blur(8px); transition: all 0.25s; }
            .pyq-cta-secondary:hover { background: rgba(255,255,255,0.11); transform: translateY(-2px); border-color: rgba(255,255,255,0.28); }
            @media (max-width: 640px) {
              .pyq-cta-box { padding: 40px 20px; }
              .pyq-cta-btns { flex-direction: column; align-items: center; }
              .pyq-cta-primary, .pyq-cta-secondary { width: 100%; max-width: 300px; text-align: center; }
            }
          `}</style>
          <div className="pyq-cta-box">
            <h2>Your UPSC Journey<br />Starts <span style={{ color: '#E8B84B' }}>Today</span></h2>
            <p>Smart preparation, structured planning, and AI-powered insights, everything serious aspirants need, in one place.</p>
            <div className="pyq-cta-btns">
              <button type="button" className="pyq-cta-primary" onClick={() => openAuthModal('signup')}>Start Free Trial →</button>
              <Link href="/contact" className="pyq-cta-secondary">Connect Us</Link>
            </div>
          </div>
        </section>
      ) : null}

      <Footer />
    </div>
  );
}
