'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Footer from '@/components/Footer';
import { pyqService } from '@/lib/services';
import { useAuth } from '@/contexts/AuthContext';
import { useEntitlements } from '@/contexts/EntitlementsContext';
import { handleEntitlementError } from '@/components/entitlements';
import { MainsEvaluationLimitModal } from '@/components/upgrade/UpgradeModals';
import {
  essayQuestionNumber,
  essaySection,
  parseEssayAnswer,
  type ParsedEssayAnswer,
  type RepositorySection,
} from '@/lib/essayModelAnswer';

const AI_EVAL_STEPS = [
  { emoji: '🔍', title: 'Uploading Answer Script' },
  { emoji: '📝', title: 'Structural Analysis' },
  { emoji: '📚', title: 'Content Depth Assessment' },
  { emoji: '⚖️', title: 'Balance & Perspective Check' },
  { emoji: '✍️', title: 'Presentation Review' },
  { emoji: '🎯', title: 'Finalising Feedback' },
];

const MAINS_TIME_LIMIT = 20 * 60;

type EssayQuestion = {
  id: string;
  year?: number | null;
  paper?: string | null;
  marks?: number | null;
  questionText: string;
  subject?: string | null;
  topic?: string | null;
  difficulty?: string | null;
  structuredJson?: any;
};

const REPO_META: Record<string, { badge: string; iconBg: string; iconColor: string; icon: React.ReactNode }> = {
  A: {
    badge: 'Weave these into your essay',
    iconBg: 'linear-gradient(135deg, #FFF6DC, #F5D06E)',
    iconColor: '#B8941E',
    icon: <path d="M10 11H6a1 1 0 01-1-1V6a1 1 0 011-1h4a1 1 0 011 1v9a4 4 0 01-4 4H5v-2h2a2 2 0 002-2v-1H6a1 1 0 01-1-1v-2zm10 0h-4a1 1 0 01-1-1V6a1 1 0 011-1h4a1 1 0 011 1v9a4 4 0 01-4 4h-2v-2h2a2 2 0 002-2v-1h-3a1 1 0 01-1-1v-2z" />,
  },
  B: {
    badge: 'Frameworks that add depth',
    iconBg: 'linear-gradient(135deg, #EEF3FF, #C9DBFF)',
    iconColor: '#3B5FE3',
    icon: <><path d="M12 2a10 10 0 100 20 10 10 0 000-20z" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  },
  C: {
    badge: 'Concrete evidence for arguments',
    iconBg: 'linear-gradient(135deg, #ECFDF5, #A7F3D0)',
    iconColor: '#10B981',
    icon: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>,
  },
  D: {
    badge: 'Anchor arguments in the Constitution',
    iconBg: 'linear-gradient(135deg, #FEF3F2, #FECDD3)',
    iconColor: '#E11D48',
    icon: <path d="M12 2L2 7v6c0 5 4 9 10 9s10-4 10-9V7l-10-5z" />,
  },
};
const REPO_FALLBACK = REPO_META.A;

function DecodeIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="dc-ico">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B8941E" strokeWidth={2}>
        {children}
      </svg>
    </span>
  );
}

function RepoMarkdown({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2.5 text-[13.5px] leading-[1.6] text-[#374151] last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="mb-2.5 ml-4 list-disc space-y-1.5 text-[13px] text-[#374151]">{children}</ul>,
        ol: ({ children }) => <ol className="mb-2.5 ml-4 list-decimal space-y-1.5 text-[13px] text-[#374151]">{children}</ol>,
        li: ({ children }) => <li className="pl-1">{children}</li>,
        strong: ({ children }) => <strong className="font-bold text-[#0B1229]">{children}</strong>,
        em: ({ children }) => <em className="font-semibold not-italic text-[#B8941E]">{children}</em>,
        table: ({ children }) => <div className="mb-3 overflow-x-auto"><table className="w-full text-left text-[12.5px]">{children}</table></div>,
        th: ({ children }) => <th className="border-b border-[#E7EAF0] px-2 py-1.5 font-bold text-[#0B1229]">{children}</th>,
        td: ({ children }) => <td className="border-b border-[#F1F3F7] px-2 py-1.5 align-top text-[#374151]">{children}</td>,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

function ValueRepositorySection({ section, index }: { section: RepositorySection; index: number }) {
  const meta = REPO_META[section.key] || REPO_FALLBACK;
  return (
    <div className="repo-block">
      <div className="rb-head">
        <div className="rb-icon" style={{ background: meta.iconBg }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={section.key === 'A' ? meta.iconColor : 'none'} stroke={section.key === 'A' ? 'none' : meta.iconColor} strokeWidth={2}>
            {meta.icon}
          </svg>
        </div>
        <div>
          <h4>{section.title}</h4>
          <p className="rb-sub">{section.key} · {meta.badge}</p>
        </div>
      </div>

      {section.items.length > 0 ? (
        section.key === 'A' ? (
          section.items.map((item, i) => (
            <div className="quote-item" key={i}>
              <p className="qt">{item.primary || item.body}</p>
              {item.attribution ? <span className="qa">— {item.attribution}</span> : null}
              {item.tailText ? (
                <span className="qr"><strong>{item.tailLabel || 'Relevance'}:</strong> {item.tailText}</span>
              ) : null}
            </div>
          ))
        ) : (
          section.items.map((item, i) => (
            <div className="repo-list-item" key={i}>
              <span className="bullet">{i + 1}</span>
              <p className="txt">
                {item.primary ? <strong>{item.primary}:</strong> : null} {item.body}
                {item.tailText ? (
                  <><br /><em>{item.tailLabel || 'Relevance'}:</em> {item.tailText}</>
                ) : null}
              </p>
            </div>
          ))
        )
      ) : (
        <RepoMarkdown text={section.raw} />
      )}
    </div>
  );
}

function EssayPageHeader() {
  const { user } = useAuth();
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || 'U';
  const name = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email?.split('@')[0] || 'Profile';
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[rgba(7,14,30,0.98)] backdrop-blur-[24px]">
      <div className="mx-auto flex h-[66px] max-w-[1200px] items-center justify-between px-5 sm:px-8">
        <Link href="/dashboard" className="flex items-center">
          <Image src="/logo.png" alt="RiseWithJeet" width={500} height={500} className="h-auto w-[90px] object-contain md:w-[110px]" priority />
        </Link>
        <nav className="hidden items-center gap-7 text-[14px] font-medium md:flex" style={{ fontFamily: "'Outfit', sans-serif" }}>
          <Link href="/dashboard" className="text-white/60 transition hover:text-[#E8B84B]">Dashboard</Link>
          <Link href="/dashboard/pyq" className="text-white/60 transition hover:text-[#E8B84B]">PYQ Bank</Link>
          <Link href="/dashboard/saved-notes?tab=pyq" className="text-white/60 transition hover:text-[#E8B84B]">Saved PYQs</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/pyq?mode=mains&paper=Essay" className="rounded-[8px] bg-gradient-to-br from-[#E8B84B] to-[#C8960A] px-4 py-2 text-[13.5px] font-bold text-[#061125] shadow-[0_4px_16px_rgba(232,184,75,0.3)] transition hover:-translate-y-px">
            Back to PYQ
          </Link>
          <Link href="/dashboard/profile" className="flex h-11 w-11 items-center justify-center rounded-full text-[16px] font-bold text-[#0E182D] transition hover:opacity-90" style={{ background: 'linear-gradient(135deg, #FFD170 0%, #D4A843 100%)', fontFamily: 'Georgia, serif' }} title={name} aria-label="Profile">
            {initials}
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function EssayModelAnswerClient() {
  const params = useParams<{ questionId: string }>();
  const questionId = Array.isArray(params.questionId) ? params.questionId[0] : params.questionId;
  const router = useRouter();
  const entitlements = useEntitlements();

  const [question, setQuestion] = useState<EssayQuestion | null>(null);
  const [related, setRelated] = useState<EssayQuestion[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Write & Evaluate modal
  const [writeOpen, setWriteOpen] = useState(false);
  const [mode, setMode] = useState<'upload' | 'type'>('upload');
  const [answerText, setAnswerText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Timer (cosmetic, matches source design)
  const [timeLeft, setTimeLeft] = useState(MAINS_TIME_LIMIT);
  const [timerRunning, setTimerRunning] = useState(false);

  // AI evaluation progress
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [evalOpen, setEvalOpen] = useState(false);
  const [evalProgress, setEvalProgress] = useState(0);
  const [evalStep, setEvalStep] = useState(0);

  useEffect(() => {
    if (!questionId) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    (async () => {
      try {
        const res = await pyqService.getQuestion(questionId, { mode: 'mains' });
        const q = res?.data?.question as EssayQuestion | undefined;
        if (!q) {
          if (!cancelled) setLoadError('This essay question could not be found.');
          return;
        }
        if (cancelled) return;
        setQuestion(q);

        const [relatedRes, metaRes] = await Promise.allSettled([
          pyqService.getQuestions({ mode: 'mains', paper: 'Essay', limit: 8, ...(q.year ? { year: q.year } : {}) }),
          pyqService.getCounts({ mode: 'mains' }),
        ]);
        if (!cancelled && relatedRes.status === 'fulfilled') {
          const list = (relatedRes.value?.data?.questions || []) as EssayQuestion[];
          setRelated(list.filter((item) => item.id !== q.id).slice(0, 4));
        }
        if (!cancelled && metaRes.status === 'fulfilled') {
          const yearRows = metaRes.value?.data?.years || metaRes.value?.data?.yearCounts || [];
          const parsed = Array.isArray(yearRows)
            ? yearRows.map((row: any) => Number(row.year ?? row)).filter((year: number) => Number.isFinite(year))
            : [];
          setYears(parsed.length > 0 ? parsed : []);
        }
      } catch (err: any) {
        if (!cancelled) setLoadError(err?.message || 'Failed to load this essay question.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [questionId]);

  const parsed: ParsedEssayAnswer | null = useMemo(
    () => (question ? parseEssayAnswer(question) : null),
    [question],
  );

  const openWrite = useCallback(() => {
    setSubmitError(null);
    setAnswerText('');
    setFiles([]);
    setMode('upload');
    setTimeLeft(MAINS_TIME_LIMIT);
    setTimerRunning(false);
    setWriteOpen(true);
  }, []);

  const closeWrite = useCallback(() => {
    setWriteOpen(false);
    setTimerRunning(false);
  }, []);

  // Escape closes the modal
  useEffect(() => {
    if (!writeOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeWrite();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [writeOpen, closeWrite]);

  // Countdown timer
  useEffect(() => {
    if (!writeOpen || !timerRunning) return;
    if (timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(id);
  }, [writeOpen, timerRunning, timeLeft]);

  const wordCount = answerText.trim() ? answerText.trim().split(/\s+/).length : 0;
  const canSubmit = !submitting && (mode === 'type' ? answerText.trim().length > 0 : files.length > 0);

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles(Array.from(list).slice(0, 5));
  };

  const submit = async () => {
    if (!question || !canSubmit) return;
    const quota = entitlements.featureStatus?.('mains_evaluation');
    if (quota?.allowed === false) {
      setShowQuotaModal(true);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await pyqService.submitMainsAnswer(question.id, {
        answerText: mode === 'type' && answerText.trim() ? answerText.trim() : undefined,
        files: mode === 'upload' && files.length > 0 ? files : undefined,
      });
      if (res.data?.attemptId) {
        setAttemptId(res.data.attemptId);
        setWriteOpen(false);
        setTimerRunning(false);
        setEvalOpen(true);
        setEvalProgress(0);
        setEvalStep(0);
        void entitlements.refreshEntitlements?.();
      } else {
        setSubmitError('Submission did not return an attempt. Please try again.');
      }
    } catch (err: any) {
      const entitlementError = handleEntitlementError(err);
      if (entitlementError.title === 'Limit reached' || entitlementError.title === 'Upgrade required') {
        setShowQuotaModal(true);
      } else {
        setSubmitError(entitlementError.message || err?.message || 'Failed to submit. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Poll evaluation status, then hand off to the shared results page.
  useEffect(() => {
    if (!evalOpen || !attemptId || !question) return;
    const start = Date.now();
    const progressId = setInterval(() => {
      const elapsed = Date.now() - start;
      setEvalProgress(Math.min(95, (elapsed / 60000) * 100));
      setEvalStep(Math.min(AI_EVAL_STEPS.length - 1, Math.floor((elapsed / 60000) * AI_EVAL_STEPS.length)));
    }, 500);

    const pollId = setInterval(async () => {
      try {
        const res = await pyqService.getMainsEvaluationStatus(question.id, attemptId);
        if (res.data?.evaluationStatus === 'completed' || res.data?.isComplete) {
          clearInterval(pollId);
          clearInterval(progressId);
          setEvalProgress(100);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(
              'pyqMainsResultsSession',
              JSON.stringify({ questionId: question.id, attemptId }),
            );
          }
          router.push(`/dashboard/pyq/results?questionId=${encodeURIComponent(question.id)}&attemptId=${encodeURIComponent(attemptId)}`);
        }
      } catch {
        // transient polling error — keep trying
      }
    }, 3000);

    return () => {
      clearInterval(progressId);
      clearInterval(pollId);
    };
  }, [evalOpen, attemptId, question, router]);

  const styles = <EssayStyles />;

  if (loading) {
    return (
      <div className="essay-pyq-page min-h-[100dvh]">
        {styles}
        <EssayPageHeader />
        <div className="mx-auto max-w-[1200px] px-6 py-20 text-center text-[#6B7690]">
          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-[#E2E6EE] border-t-[#D4AF37]" />
          Loading model answer…
        </div>
      </div>
    );
  }

  if (loadError || !question) {
    return (
      <div className="essay-pyq-page min-h-[100dvh]">
        {styles}
        <EssayPageHeader />
        <div className="mx-auto max-w-[720px] px-6 py-20 text-center">
          <p className="mb-4 text-[18px] font-semibold text-[#0B1229]">{loadError || 'Question not found.'}</p>
          <Link href="/dashboard/pyq" className="inline-flex rounded-[10px] bg-[#0B1229] px-5 py-3 text-[14px] font-bold text-white">
            Back to PYQ
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const year = question.year || undefined;
  const section = essaySection(question);
  const marks = question.marks || 125;
  const qNumber = essayQuestionNumber(question);
  const cleanTitle = question.questionText.replace(/^["'“‘]|["'”’]+$/g, '');
  const yearList = years.length > 0 ? years : year ? [year] : [];

  return (
    <div className="essay-pyq-page min-h-[100dvh]">
      {styles}
      <MainsEvaluationLimitModal
        open={showQuotaModal}
        onClose={() => setShowQuotaModal(false)}
        tier={entitlements.tier}
        used={entitlements.featureStatus?.('mains_evaluation')?.used}
        limit={entitlements.featureStatus?.('mains_evaluation')?.limit}
        backLabel="Back to Dashboard"
      />
      <EssayPageHeader />

      {/* Breadcrumbs */}
      <nav className="mx-auto max-w-[1200px] px-6 py-4">
        <ol className="flex flex-wrap items-center text-[14px] font-medium text-[#8B95A8]">
          <li><Link href="/dashboard" className="transition hover:text-[#D4AF37]">Home</Link></li>
          <li className="breadcrumb-sep">›</li>
          <li><Link href="/dashboard/pyq" className="transition hover:text-[#D4AF37]">Previous Year Questions</Link></li>
          <li className="breadcrumb-sep">›</li>
          <li><Link href="/dashboard/pyq?mode=mains" className="transition hover:text-[#D4AF37]">Mains</Link></li>
          {year ? (<><li className="breadcrumb-sep">›</li><li><Link href={`/dashboard/pyq?mode=mains&year=${year}`} className="transition hover:text-[#D4AF37]">{year}</Link></li></>) : null}
          <li className="breadcrumb-sep">›</li>
          <li><Link href="/dashboard/pyq?mode=mains&paper=Essay" className="transition hover:text-[#D4AF37]">Essay</Link></li>
          <li className="breadcrumb-sep">›</li>
          <li className="max-w-[360px] truncate font-semibold text-[#374151]">{cleanTitle}</li>
        </ol>
      </nav>

      <main className="mx-auto max-w-[1200px] px-6 pb-16">
        <div className="main-grid grid gap-8" style={{ gridTemplateColumns: '1fr 340px' }}>
          {/* LEFT */}
          <div className="min-w-0">
            {/* Question card */}
            <article className="card-shadow overflow-hidden rounded-[16px] bg-white">
              <div className="gold-gradient h-1" />
              <div className="p-7 md:p-9">
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  {year ? <span className="tag-pill bg-blue-50 text-blue-700">UPSC {year}</span> : null}
                  <span className="tag-pill bg-amber-50 text-amber-700">Essay</span>
                  {section ? <span className="tag-pill bg-pink-50 text-pink-600">{section}</span> : null}
                  <span className="tag-pill bg-orange-50 text-orange-600">1000–1200 Words</span>
                  <span className="tag-pill bg-emerald-50 text-emerald-700">Mains</span>
                </div>

                <div className="mb-8">
                  <p className="text-[32px] font-semibold italic leading-tight text-[#1F2937]" style={{ fontFamily: 'var(--font-cormorant-garamond), Georgia, serif' }}>
                    “{cleanTitle}”
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    {year ? <span className="meta-chip"><MetaIcon d="cal" />{year}</span> : null}
                    <span className="meta-chip"><MetaIcon d="pen" />1000–1200 words</span>
                    <span className="meta-chip"><MetaIcon d="star" />{marks} marks</span>
                    {section ? <span className="meta-chip"><MetaIcon d="book" />{section}</span> : null}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button type="button" onClick={openWrite} className="shine-btn group inline-flex items-center gap-2.5 rounded-[12px] border-2 border-[#0B1229] bg-[#0B1229] px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-[#141F42]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ transform: 'scaleX(-1)' }}><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                    Write &amp; Evaluate Your Essay
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="transition-transform group-hover:translate-x-1"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            </article>

            {/* MODEL ANSWER FLOW */}
            <section className="relative mt-8">
              {/* PART 1: DECODE */}
              <div id="part1" className="scroll-mt-24">
                <div className="mb-8 text-center">
                  <div className="step-ribbon"><span className="num">1</span> STEP ONE · DECODE</div>
                  <h2 className="part-title mt-4">How to <span className="accent">Approach</span></h2>
                  <p className="part-subtitle">Before you write, understand. Break the topic into its philosophical, sociological, and constitutional threads.</p>
                </div>

                {parsed?.decode ? (
                  <div className="decode-grid">
                    <div className="decode-card">
                      <div className="dc-head"><DecodeIcon><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></DecodeIcon><h4>Central Theme</h4></div>
                      <p>{parsed.decode.centralTheme}</p>
                    </div>
                    <div className="decode-card">
                      <div className="dc-head"><DecodeIcon><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></DecodeIcon><h4>Meaning of the Topic</h4></div>
                      <p>{parsed.decode.meaningOfTopic}</p>
                    </div>
                    {parsed.decode.keywords.length > 0 ? (
                      <div className="decode-card wide">
                        <div className="dc-head"><DecodeIcon><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></DecodeIcon><h4>Important Keywords</h4></div>
                        <div>
                          {parsed.decode.keywords.map((kw) => <span className="keyword-chip" key={kw}>{kw}</span>)}
                        </div>
                      </div>
                    ) : null}
                    {parsed.decode.hiddenDimensions ? (
                      <div className="decode-card">
                        <div className="dc-head"><DecodeIcon><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></DecodeIcon><h4>Hidden Dimensions</h4></div>
                        <p>{parsed.decode.hiddenDimensions}</p>
                      </div>
                    ) : null}
                    {parsed.decode.multipleInterpretations ? (
                      <div className="decode-card">
                        <div className="dc-head"><DecodeIcon><path d="M12 2L2 22h20L12 2z" /><line x1="12" y1="9" x2="12" y2="14" /><line x1="12" y1="18" x2="12.01" y2="18" /></DecodeIcon><h4>Multiple Interpretations</h4></div>
                        <p>{parsed.decode.multipleInterpretations}</p>
                      </div>
                    ) : null}
                    {parsed.decode.thesis ? (
                      <div className="thesis-card">
                        <h4>One-line Central Thesis</h4>
                        <p>{parsed.decode.thesis}</p>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="parchment"><RepoMarkdown text={parsed?.raw.topicDecoding || 'Topic decoding is being prepared for this question.'} /></div>
                )}
              </div>

              {/* PART 2: ESSAY */}
              <div id="part2" className="mt-10 scroll-mt-24">
                <div className="mb-8 text-center">
                  <div className="step-ribbon"><span className="num">2</span> STEP TWO · COMPOSE</div>
                  <h2 className="part-title mt-4">The Model <span className="accent">UPSC Essay</span></h2>
                  <p className="part-subtitle">A model composition — polished, philosophical, and exam-ready.</p>
                </div>

                <div className="parchment">
                  {parsed?.body ? (
                    <div className="essay-body">
                      <h1 className="essay-title">{parsed.body.title}</h1>
                      <div className="essay-flourish">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}><path d="M12 2l2.4 6.4L21 9l-5 4.5L17.5 21 12 17.5 6.5 21 8 13.5 3 9l6.6-.6L12 2z" /></svg>
                      </div>
                      {parsed.body.lead.map((paragraph, i) => (
                        <p className="essay-para" key={`lead-${i}`}>{paragraph}</p>
                      ))}
                      {parsed.body.sections.map((sec, i) => (
                        <div key={`sec-${i}`}>
                          <h3 className="essay-section-title">{sec.title}</h3>
                          {sec.paragraphs.map((paragraph, j) => (
                            <p className="essay-para" key={`sec-${i}-${j}`}>{paragraph}</p>
                          ))}
                        </div>
                      ))}
                      <div className="essay-flourish" style={{ margin: '30px 0 8px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4" /></svg>
                      </div>
                    </div>
                  ) : (
                    <RepoMarkdown text={parsed?.raw.modelEssay || 'The model essay is being prepared for this question.'} />
                  )}
                </div>

                <div className="mt-4 flex items-start gap-3 rounded-[10px] border border-[#E2E6EE] bg-[#F8F9FB] px-4 py-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B95A8" strokeWidth={2} className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                  <p className="text-[12px] leading-relaxed text-[#6B7690]"><strong className="text-[#4A5468]">Note:</strong> Model essays may exceed the prescribed word count for pedagogical clarity. Use them as a reference and always shape your own draft within the exam’s word limit.</p>
                </div>
              </div>

              {/* PART 3: VALUE REPO */}
              <div id="part3" className="mt-10 scroll-mt-24">
                <div className="mb-8 text-center">
                  <div className="step-ribbon"><span className="num">3</span> STEP THREE · ENRICH</div>
                  <h2 className="part-title mt-4">Value Addition <span className="accent">Repository</span></h2>
                  <p className="part-subtitle">Quotations, thinkers, examples, and constitutional hooks that elevate a good essay to a distinguished one.</p>
                </div>

                {parsed && parsed.repository.length > 0 ? (
                  parsed.repository.map((sec, i) => <ValueRepositorySection key={sec.key} section={sec} index={i} />)
                ) : (
                  <div className="parchment"><RepoMarkdown text={parsed?.raw.valueAdditionRepository || 'The value-addition repository is being prepared for this question.'} /></div>
                )}
              </div>

              {/* Completion CTA */}
              <div id="completionCta" className="card-shadow-lg mt-10 overflow-hidden rounded-[16px]" style={{ background: 'linear-gradient(135deg, #0B1229 0%, #162044 100%)' }}>
                <div className="relative overflow-hidden p-8 text-center md:p-10">
                  <div className="absolute right-0 top-0 h-64 w-64 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.4), transparent 60%)' }} />
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Your Essay Blueprint Is Complete</span>
                  </div>
                  <h3 className="mb-3 text-3xl font-bold text-white md:text-4xl" style={{ fontFamily: 'var(--font-cormorant-garamond), Georgia, serif' }}>Now it’s your turn to write.</h3>
                  <p className="mx-auto mb-6 max-w-lg text-[14px] text-white/60">Put your understanding into words and receive a comprehensive evaluation from Jeet AI across structure, multidimensional analysis, arguments and presentation — delivering actionable feedback in about 60 seconds.</p>
                  <button type="button" onClick={openWrite} className="shine-btn gold-gradient inline-flex items-center gap-2 rounded-[12px] px-7 py-3 text-[14px] font-bold text-[#0B1229] shadow-[0_4px_16px_rgba(212,175,55,0.35)] transition hover:-translate-y-px">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ transform: 'scaleX(-1)' }}><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                    Write &amp; Get Evaluated
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            </section>

            {/* Related essay topics */}
            {related.length > 0 ? (
              <section className="mt-14">
                <h2 className="mb-5 text-2xl font-bold text-[#1F2937]" style={{ fontFamily: 'var(--font-cormorant-garamond), Georgia, serif' }}>
                  More Essay Topics{year ? ` from UPSC Mains ${year}` : ''}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {related.map((item) => (
                    <Link key={item.id} href={`/dashboard/pyq/essay/${encodeURIComponent(item.id)}`} className="more-question-card group rounded-[12px] p-4 transition-all">
                      <div className="mb-2 flex items-center gap-2">
                        {essaySection(item) ? <span className="tag-pill bg-pink-50 text-pink-600 !text-[10px]">{essaySection(item)}</span> : null}
                        {item.topic ? <span className="tag-pill bg-amber-50 text-amber-700 !text-[10px]">{item.topic}</span> : null}
                      </div>
                      <p className="text-lg italic text-[#1F2937]" style={{ fontFamily: 'var(--font-cormorant-garamond), Georgia, serif' }}>“{item.questionText.replace(/^["'“‘]|["'”’]+$/g, '')}”</p>
                      <p className="mt-2 text-xs text-[#6B7690]">{essayQuestionNumber(item) ? `Question #${essayQuestionNumber(item)} · ` : ''}1000–1200 words</p>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {/* Year-wise selector */}
            {yearList.length > 0 ? (
              <section className="mt-10">
                <h2 className="mb-5 text-2xl font-bold text-[#1F2937]" style={{ fontFamily: 'var(--font-cormorant-garamond), Georgia, serif' }}>Year-wise UPSC Essays</h2>
                <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-7">
                  {yearList.map((yr) => (
                    <Link key={yr} href={`/dashboard/pyq?mode=mains&paper=Essay&year=${yr}`} className={`year-btn text-center ${yr === year ? 'active' : ''}`}>
                      {yr}
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="sidebar-cta space-y-6">
            <div className="card-shadow rounded-[12px] bg-white p-5">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#8B95A8]">On This Page</h4>
              <div className="space-y-2.5">
                {[['part1', '1', 'How to Approach'], ['part2', '2', 'Model UPSC Essay'], ['part3', '3', 'Value Repository']].map(([id, n, label]) => (
                  <a key={id} href={`#${id}`} className="group flex items-center gap-2.5 rounded-lg p-2 transition hover:bg-[#F1F3F7]">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200 text-[11px] font-bold text-amber-800">{n}</span>
                    <span className="text-xs font-semibold text-[#374151] transition group-hover:text-[#B8941E]">{label}</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="eval-card rounded-[12px] p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 shadow-sm">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth={2.5}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1F2937]">Evaluate Your Essay</p>
                  <p className="text-[10px] text-[#6B7690]">Jeet AI-powered assessment</p>
                </div>
              </div>
              <div className="mb-4 space-y-3">
                {[
                  { bg: 'bg-emerald-50', color: '#10B981', title: 'Instant Feedback', sub: 'Get marks & suggestions within 60 seconds' },
                  { bg: 'bg-blue-50', color: '#3B82F6', title: 'Detailed Analysis', sub: 'Strengths, weaknesses & improvements' },
                  { bg: 'bg-purple-50', color: '#8B5CF6', title: 'Track Progress', sub: 'Monitor improvement over time' },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-2.5">
                    <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${item.bg}`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth={2.5}><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold leading-tight text-[#1F2937]">{item.title}</p>
                      <p className="mt-0.5 text-[9px] text-[#6B7690]">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={openWrite} className="group flex w-full items-center justify-center gap-1.5 rounded-md bg-gradient-to-r from-[#F5D06E] to-[#D4AF37] py-2 text-[10px] font-semibold text-[#0B1229] transition hover:-translate-y-px">
                Write Now
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="transition-transform group-hover:translate-x-0.5"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
              </button>
            </div>

            <div className="card-shadow rounded-[12px] bg-white p-5">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#8B95A8]">Explore Our Platform</h4>
              <div className="space-y-2">
                {[
                  { href: '/dashboard/daily-mcq', title: 'Daily MCQ Challenge', sub: '10 questions daily', bg: 'from-violet-500 to-purple-600' },
                  { href: '/dashboard/study-planner', title: 'Study Planner', sub: 'Personalized day-by-day plan', bg: 'from-blue-500 to-cyan-600' },
                  { href: '/dashboard/mock-tests', title: 'Mock Tests', sub: 'Full-length simulated exams', bg: 'from-amber-500 to-orange-600' },
                  { href: '/dashboard/jeet-gpt', title: 'Jeet AI Mentor', sub: 'Ask anything, get instant help', bg: 'from-rose-500 to-pink-600' },
                  { href: '/dashboard/performance', title: 'Performance Analytics', sub: 'Deep insights on your prep', bg: 'from-emerald-500 to-teal-600' },
                ].map((item) => (
                  <Link key={item.href} href={item.href} className="group flex items-center gap-3 rounded-lg p-2.5 transition hover:bg-[#F1F3F7]">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${item.bg}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#1F2937] transition group-hover:text-[#B8941E]">{item.title}</p>
                      <p className="text-[10px] text-[#8B95A8]">{item.sub}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* WRITE & EVALUATE MODAL */}
      {writeOpen ? (
        <div className="write-modal-root fixed inset-0 z-[120] flex items-center justify-center" role="dialog" aria-modal="true">
          <div className="write-modal-backdrop" onClick={closeWrite} />
          <div className="write-modal-shell">
            <div className="write-modal-head">
              <div className="write-modal-brand">
                <div className="write-modal-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
                </div>
                <div>
                  <h3 className="write-modal-title">Craft Your Answer</h3>
                  <div className="write-modal-tags">
                    <span className="write-modal-tag">✍ Essay</span>
                    {section ? <span className="write-modal-tag">{section}</span> : null}
                  </div>
                </div>
              </div>
              <button type="button" className="write-modal-close" onClick={closeWrite} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6}><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="write-modal-body">
              <div className="write-modal-main">
                <div className="write-question-card">
                  <div className="write-eyebrow">Question</div>
                  <div className="write-question-text">{cleanTitle}</div>
                </div>

                <div className="write-meta">
                  <span>⏱ 20 min</span>
                  <span>✍ 1000–1200 words</span>
                  <span>☆ {marks} marks</span>
                </div>

                {mode === 'upload' ? (
                  <>
                    <div className="write-upload-title">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 12l9-9 9 9" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></svg>
                      Upload your answer
                    </div>
                    <div
                      className="write-dropzone"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                    >
                      <div className="write-upload-badge">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 16V4" /><path d="M7 9l5-5 5 5" /><path d="M20 16v4H4v-4" /></svg>
                      </div>
                      {files.length > 0 ? (
                        <>
                          <div className="write-drop-title">{files.length} file{files.length === 1 ? '' : 's'} selected</div>
                          <div className="write-drop-sub">{files.map((f) => f.name).join(', ')}</div>
                        </>
                      ) : (
                        <>
                          <div className="write-drop-title">Drop your answer script here</div>
                          <div className="write-drop-sub">Upload handwritten answers for AI evaluation</div>
                        </>
                      )}
                      <div className="write-file-types"><span>JPG</span><span>PNG</span><span>PDF</span><span>Max 10MB</span></div>
                      <button type="button" className="write-browse" onClick={() => fileInputRef.current?.click()}>Browse Files</button>
                      <input ref={fileInputRef} className="hidden" type="file" multiple accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => handleFiles(e.target.files)} />
                    </div>

                    <div className="write-or-row">
                      <button type="button" className="write-or-pill" onClick={() => setMode('type')}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path d="M6 9l6 6 6-6" /></svg>
                        OR Type your answer
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="write-upload-title">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
                      Type your answer
                    </div>
                    <textarea
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="Start writing your essay here…"
                      className="h-[240px] w-full resize-none rounded-[12px] border border-[#D9DFEA] bg-[#F8F9FB] p-4 text-[15px] leading-[24px] text-[#31394A] focus:border-[#D4AF37] focus:outline-none"
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <button type="button" className="write-or-pill" onClick={() => setMode('upload')}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path d="M12 16V4" /><path d="M7 9l5-5 5 5" /><path d="M20 16v4H4v-4" /></svg>
                        Upload instead
                      </button>
                      <span className="text-[12px] font-semibold text-[#6B7280]">{wordCount} words</span>
                    </div>
                  </>
                )}

                {submitError ? (
                  <div className="mt-4 rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#B91C1C]">{submitError}</div>
                ) : null}

                <button type="button" className="write-submit" disabled={!canSubmit} onClick={submit} style={canSubmit ? { background: '#0D1223', cursor: 'pointer' } : undefined}>
                  {submitting ? (
                    <><span className="h-5 w-5 animate-spin rounded-full border-b-2 border-white" /> Submitting…</>
                  ) : (
                    <>
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                      Submit Answer for Evaluation
                    </>
                  )}
                </button>
              </div>

              <aside className="write-modal-side">
                <div className="timer-card">
                  <div className="timer-label">Writing Timer</div>
                  <div className="timer-circle">
                    <div className="timer-time">{String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}</div>
                    <div className="timer-auto">{timerRunning ? 'Running' : 'Paused'}</div>
                  </div>
                  <div className="timer-actions">
                    <button type="button" className="timer-start" onClick={() => setTimerRunning((prev) => !prev)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3}><path d="M5 3l14 9-14 9V3z" /></svg>
                      {timerRunning ? 'Pause' : 'Start now'}
                    </button>
                    <button type="button" className="timer-reset" onClick={() => { setTimeLeft(MAINS_TIME_LIMIT); setTimerRunning(false); }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3}><path d="M3 12a9 9 0 109-9" /><path d="M3 3v6h6" /></svg>
                      Reset
                    </button>
                  </div>
                </div>

                <div className="tips-card">
                  <div className="tips-title">💡 QUICK TIPS</div>
                  <div className="tip-item"><span className="tip-icon">✏️</span><span className="tip-copy">Use blue/black ink</span></div>
                  <div className="tip-item"><span className="tip-icon">📷</span><span className="tip-copy">Clear photo in good lighting</span></div>
                  <div className="tip-item"><span className="tip-icon">📝</span><span className="tip-copy">Write legibly on white paper</span></div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      ) : null}

      {/* AI EVALUATION PROGRESS */}
      {evalOpen ? (
        <div className="write-modal-root fixed inset-0 z-[130] flex items-center justify-center">
          <div className="write-modal-backdrop" />
          <div className="relative w-[min(440px,calc(100vw-32px))] rounded-[22px] bg-white p-8 text-center shadow-[0_34px_90px_rgba(3,7,18,0.46)]">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F5D06E] to-[#D4AF37] text-[28px]">
              {AI_EVAL_STEPS[evalStep]?.emoji || '🎯'}
            </div>
            <h3 className="text-[20px] font-bold text-[#0B1229]" style={{ fontFamily: 'var(--font-cormorant-garamond), Georgia, serif' }}>Evaluating your essay…</h3>
            <p className="mt-1 text-[13px] text-[#6B7690]">{AI_EVAL_STEPS[evalStep]?.title || 'Finalising Feedback'}</p>
            <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-[#F1F3F7]">
              <div className="h-full rounded-full bg-gradient-to-r from-[#F5D06E] to-[#D4AF37] transition-all duration-500" style={{ width: `${evalProgress}%` }} />
            </div>
            <p className="mt-3 text-[12px] font-semibold text-[#8B95A8]">Usually takes about 60 seconds</p>
          </div>
        </div>
      ) : null}

      <Footer />
    </div>
  );
}

function MetaIcon({ d }: { d: 'cal' | 'pen' | 'star' | 'book' }) {
  const common = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 } as const;
  if (d === 'cal') return <svg {...common}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
  if (d === 'pen') return <svg {...common}><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>;
  if (d === 'star') return <svg {...common}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
  return <svg {...common}><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
}

function EssayStyles() {
  return (
    <style jsx global>{`
      .essay-pyq-page { font-family: var(--font-dm-sans), Inter, sans-serif; color: #1E293B; }
      .essay-pyq-page .gold-gradient { background: linear-gradient(135deg, #F5D06E 0%, #D4AF37 50%, #B8941E 100%); }
      .essay-pyq-page .card-shadow { box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06); }
      .essay-pyq-page .card-shadow-lg { box-shadow: 0 4px 12px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.1); }
      .essay-pyq-page .breadcrumb-sep { color: #C9CFDB; margin: 0 8px; }
      .essay-pyq-page .tag-pill { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }
      .essay-pyq-page .sidebar-cta { position: sticky; top: 96px; align-self: start; }
      .essay-pyq-page .meta-chip { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: #6B7690; font-weight: 500; }

      .essay-pyq-page .shine-btn { position: relative; overflow: hidden; isolation: isolate; }
      .essay-pyq-page .shine-btn::before { content: ''; position: absolute; top: 0; left: -80%; width: 65%; height: 100%; background: linear-gradient(120deg, transparent 0%, rgba(245,208,110,0) 25%, rgba(245,208,110,0.22) 44%, rgba(255,255,255,0.42) 50%, rgba(245,208,110,0.22) 56%, rgba(245,208,110,0) 75%, transparent 100%); transform: skewX(-22deg); pointer-events: none; opacity: 0; z-index: 1; }
      .essay-pyq-page .shine-btn:hover::before { animation: essayShineSweep 1.1s cubic-bezier(0.22, 0.61, 0.36, 1) forwards; }
      .essay-pyq-page .shine-btn > * { position: relative; z-index: 2; }
      @keyframes essayShineSweep { 0% { left: -75%; opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { left: 120%; opacity: 0; } }

      .essay-pyq-page .step-ribbon { display: inline-flex; align-items: center; gap: 10px; padding: 7px 16px; border-radius: 999px; background: linear-gradient(135deg, rgba(212,175,55,0.10), rgba(245,208,110,0.05)); border: 1px solid rgba(212,175,55,0.25); font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #9a8347; }
      .essay-pyq-page .step-ribbon .num { width: 22px; height: 22px; border-radius: 50%; background: linear-gradient(135deg, #F5D06E, #D4AF37); color: #fff; font-weight: 700; font-size: 12px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(212,175,55,0.35); }
      .essay-pyq-page .part-title { font-family: var(--font-cormorant-garamond), Georgia, serif; font-weight: 700; font-size: 34px; line-height: 1.15; color: #0B1229; margin-top: 10px; letter-spacing: -0.5px; }
      .essay-pyq-page .part-title .accent { color: transparent; background: linear-gradient(135deg, #F5D06E, #D4AF37); -webkit-background-clip: text; background-clip: text; }
      .essay-pyq-page .part-subtitle { color: #6B7690; font-size: 14px; margin-top: 6px; max-width: 640px; margin-left: auto; margin-right: auto; }

      .essay-pyq-page .decode-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 14px; }
      @media (max-width: 720px) { .essay-pyq-page .decode-grid { grid-template-columns: 1fr; } }
      .essay-pyq-page .decode-card { position: relative; border-radius: 14px; padding: 18px 20px; background: #fff; border: 1px solid #ECE4D0; box-shadow: 0 1px 2px rgba(15,27,61,0.04), 0 6px 20px rgba(15,27,61,0.04); transition: all .3s ease; }
      .essay-pyq-page .decode-card:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(15,27,61,0.08); border-color: #D4AF37; }
      .essay-pyq-page .decode-card .dc-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
      .essay-pyq-page .decode-card .dc-ico { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #FFF6DC, #F5D06E); display: inline-flex; align-items: center; justify-content: center; box-shadow: inset 0 0 0 1px rgba(212,175,55,0.3); flex-shrink: 0; }
      .essay-pyq-page .decode-card h4 { font-family: var(--font-dm-sans), sans-serif; font-weight: 700; font-size: 13px; color: #0B1229; letter-spacing: .3px; text-transform: uppercase; }
      .essay-pyq-page .decode-card p { color: #374151; font-size: 13.5px; line-height: 1.65; }
      .essay-pyq-page .decode-card.wide { grid-column: 1 / -1; }
      .essay-pyq-page .keyword-chip { display: inline-flex; align-items: center; padding: 4px 11px; border-radius: 999px; background: rgba(212,175,55,0.08); border: 1px solid rgba(212,175,55,0.25); color: #8a7020; font-size: 12px; font-weight: 600; margin: 3px 4px 3px 0; }
      .essay-pyq-page .thesis-card { background: linear-gradient(135deg, #FDFBF5 0%, #FAF4E4 100%); border: 1px solid rgba(212, 175, 55, 0.28); border-radius: 14px; padding: 20px 24px; grid-column: 1 / -1; position: relative; }
      .essay-pyq-page .thesis-card::before { content: '"'; position: absolute; top: -8px; left: 18px; font-family: var(--font-cormorant-garamond), Georgia, serif; font-size: 72px; line-height: 1; color: rgba(184, 148, 30, 0.25); font-weight: 700; }
      .essay-pyq-page .thesis-card h4 { font-size: 11px; letter-spacing: 1.8px; text-transform: uppercase; font-weight: 700; color: #8a6a1f; margin-bottom: 6px; }
      .essay-pyq-page .thesis-card p { font-family: var(--font-cormorant-garamond), Georgia, serif; font-size: 19px; line-height: 1.55; color: #1f2937; font-style: italic; font-weight: 500; padding-left: 4px; }

      .essay-pyq-page .parchment { position: relative; isolation: isolate; border-radius: 20px; padding: 38px 42px 44px; background: linear-gradient(180deg, #FFFDF7 0%, #FFFFFF 100%); border: 1px solid rgba(212, 175, 55, 0.18); overflow: hidden; }
      @media (max-width: 720px) { .essay-pyq-page .parchment { padding: 24px 20px; } }
      .essay-pyq-page .parchment::before { content: ''; position: absolute; top: -60px; right: -60px; width: 260px; height: 260px; background: radial-gradient(circle, rgba(212,175,55,0.10), transparent 70%); }
      .essay-pyq-page .essay-body { max-width: 780px; margin: 0 auto; position: relative; z-index: 1; }
      .essay-pyq-page .essay-title { font-family: var(--font-cormorant-garamond), Georgia, serif; font-size: 40px; line-height: 1.1; font-weight: 700; color: #0B1229; text-align: center; margin-bottom: 8px; letter-spacing: -0.5px; }
      @media (max-width: 720px) { .essay-pyq-page .essay-title { font-size: 30px; } }
      .essay-pyq-page .essay-flourish { display: flex; align-items: center; justify-content: center; gap: 12px; margin: 14px 0 30px; color: #B8941E; }
      .essay-pyq-page .essay-flourish::before, .essay-pyq-page .essay-flourish::after { content: ''; height: 1px; width: 60px; background: linear-gradient(90deg, transparent, rgba(184,148,30,0.5)); }
      .essay-pyq-page .essay-flourish::after { background: linear-gradient(90deg, rgba(184,148,30,0.5), transparent); }
      .essay-pyq-page .essay-section-title { font-family: var(--font-cormorant-garamond), Georgia, serif; font-size: 26px; line-height: 1.25; font-weight: 700; color: #0F1B3D; margin: 34px 0 14px; display: flex; align-items: baseline; gap: 12px; }
      .essay-pyq-page .essay-section-title::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: linear-gradient(135deg, #F5D06E, #D4AF37); flex-shrink: 0; align-self: center; }
      .essay-pyq-page .essay-para { font-size: 15.5px; line-height: 1.85; color: #2A2E3A; margin-bottom: 16px; text-align: justify; hyphens: auto; }
      .essay-pyq-page .essay-body > div:first-of-type .essay-para:first-of-type::first-letter { font-family: var(--font-cormorant-garamond), Georgia, serif; font-size: 52px; float: left; line-height: 0.9; padding: 4px 10px 0 0; color: #B8941E; font-weight: 700; }

      .essay-pyq-page .repo-block { border-radius: 14px; padding: 20px 22px; background: #fff; border: 1px solid #E7EAF0; margin-bottom: 14px; transition: all .3s ease; }
      .essay-pyq-page .repo-block:hover { border-color: rgba(212,175,55,0.4); box-shadow: 0 8px 24px rgba(15,27,61,0.06); }
      .essay-pyq-page .repo-block .rb-head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px dashed #E7EAF0; }
      .essay-pyq-page .repo-block .rb-icon { width: 36px; height: 36px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .essay-pyq-page .repo-block h4 { font-family: var(--font-dm-sans), sans-serif; font-weight: 700; font-size: 15px; color: #0B1229; }
      .essay-pyq-page .repo-block .rb-sub { font-size: 11px; color: #8B95A8; letter-spacing: 1px; text-transform: uppercase; margin-top: 1px; }
      .essay-pyq-page .quote-item { position: relative; padding: 14px 16px 14px 44px; border-radius: 10px; background: linear-gradient(135deg, #FFFDF5, #FFFFFF); border: 1px solid #F3EAD1; margin-bottom: 10px; }
      .essay-pyq-page .quote-item::before { content: '"'; position: absolute; top: 4px; left: 12px; font-family: var(--font-cormorant-garamond), Georgia, serif; font-size: 46px; color: #D4AF37; font-weight: 700; line-height: 1; }
      .essay-pyq-page .quote-item .qt { color: #374151; font-size: 13.5px; line-height: 1.6; font-style: italic; }
      .essay-pyq-page .quote-item .qa { display: block; margin-top: 6px; color: #B8941E; font-size: 11.5px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; font-style: normal; }
      .essay-pyq-page .quote-item .qr { display: block; margin-top: 6px; color: #6B7690; font-size: 12px; }
      .essay-pyq-page .quote-item .qr strong { color: #4A5468; }
      .essay-pyq-page .repo-list-item { display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px dashed #EEF0F5; }
      .essay-pyq-page .repo-list-item:last-child { border-bottom: none; }
      .essay-pyq-page .repo-list-item .bullet { width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, #FFF6DC, #F5D06E); display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #7a5b10; margin-top: 2px; box-shadow: inset 0 0 0 1px rgba(212,175,55,0.25); }
      .essay-pyq-page .repo-list-item .txt { font-size: 13.5px; line-height: 1.6; color: #374151; }
      .essay-pyq-page .repo-list-item .txt strong { color: #0B1229; font-weight: 700; }
      .essay-pyq-page .repo-list-item .txt em { color: #B8941E; font-style: normal; font-weight: 600; }

      .essay-pyq-page .year-btn { display: block; border: 1px solid #E2E6EE; border-radius: 8px; padding: 8px 0; font-size: 14px; font-weight: 500; transition: all 0.2s; color: #364153; background: #fff; }
      .essay-pyq-page .year-btn:hover { border-color: #D4AF37; color: #D4AF37; background: #FFFDF5; }
      .essay-pyq-page .year-btn.active { background: #0B1229; color: white; border-color: #0B1229; }
      .essay-pyq-page .more-question-card { background: #fff; border: 1px solid #E2E6EE; }
      .essay-pyq-page .more-question-card:hover { border-color: #D4AF37; box-shadow: 0 8px 24px rgba(11,18,41,0.07); transform: translateY(-1px); }
      .essay-pyq-page .eval-card { background: linear-gradient(135deg, #FAF8F5 0%, #FFFFFF 100%); border: 1px solid #E2E6EE; position: relative; overflow: hidden; }

      @media (max-width: 1024px) { .essay-pyq-page .main-grid { grid-template-columns: 1fr !important; } .essay-pyq-page .sidebar-cta { position: static; } }

      /* Write modal */
      .write-modal-root .write-modal-backdrop { position: absolute; inset: 0; background: rgba(8, 12, 24, 0.64); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
      .write-modal-shell { position: relative; width: min(1150px, calc(100vw - 72px)); height: min(740px, calc(100vh - 68px)); background: #fff; border-radius: 24px; overflow: hidden; box-shadow: 0 34px 90px rgba(3, 7, 18, 0.46); border: 1px solid rgba(255,255,255,0.28); }
      .write-modal-head { height: 106px; background: #0D1223; color: #fff; display: flex; align-items: flex-start; justify-content: space-between; padding: 28px 31px 20px; }
      .write-modal-brand { display: flex; gap: 16px; align-items: flex-start; }
      .write-modal-icon { width: 47px; height: 47px; border-radius: 11px; background: linear-gradient(135deg, #E4C85B 0%, #D0AD3D 100%); display: inline-flex; align-items: center; justify-content: center; color: #0D1223; box-shadow: 0 10px 22px rgba(212,175,55,0.22); }
      .write-modal-title { font-family: var(--font-cormorant-garamond), Georgia, serif; font-size: 27px; line-height: 1; font-weight: 700; letter-spacing: -0.2px; }
      .write-modal-tags { display: flex; gap: 8px; margin-top: 12px; }
      .write-modal-tag { display: inline-flex; align-items: center; gap: 5px; height: 25px; padding: 0 12px; border-radius: 5px; background: #FFF8D9; color: #1F2635; font-size: 12px; line-height: 1; font-weight: 800; border: 1px solid rgba(212,175,55,0.32); }
      .write-modal-close { width: 40px; height: 40px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.14); color: rgba(255,255,255,0.74); transition: all .2s ease; }
      .write-modal-close:hover { color: #fff; background: rgba(255,255,255,0.18); }
      .write-modal-body { height: calc(100% - 106px); display: grid; grid-template-columns: minmax(0, 1fr) 292px; background: #fff; }
      .write-modal-main { padding: 19px 30px 28px; overflow-y: auto; }
      .write-question-card { min-height: 81px; border-radius: 10px; padding: 17px 20px; border-left: 4px solid #D4AF37; background: linear-gradient(135deg, #F7F8FA 0%, #F3F4F7 100%); }
      .write-eyebrow { font-size: 11px; font-weight: 900; letter-spacing: 2.2px; color: #A7AEBD; text-transform: uppercase; }
      .write-question-text { margin-top: 10px; font-size: 15.5px; color: #31394A; font-weight: 600; font-style: italic; }
      .write-meta { display: flex; gap: 29px; align-items: center; margin: 15px 0 17px; color: #6B7280; font-size: 12.5px; font-weight: 800; flex-wrap: wrap; }
      .write-upload-title { display: flex; align-items: center; gap: 10px; color: #111827; font-size: 16px; font-weight: 900; margin-bottom: 13px; }
      .write-upload-title svg { color: #D4AF37; }
      .write-dropzone { min-height: 260px; border: 1.5px dashed #D9DFEA; border-radius: 12px; background: #F8F9FB; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 20px; }
      .write-upload-badge { width: 48px; height: 48px; border-radius: 11px; background: #0D1223; color: #D4AF37; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 19px; }
      .write-drop-title { color: #161B2A; font-size: 16px; font-weight: 900; margin-bottom: 9px; }
      .write-drop-sub { color: #9AA3B4; font-size: 14px; margin-bottom: 20px; max-width: 340px; }
      .write-file-types { display: flex; justify-content: center; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
      .write-file-types span { background: #E6E9EF; color: #4E5667; border-radius: 4px; padding: 5px 11px; font-size: 12px; font-weight: 700; }
      .write-browse { min-width: 132px; height: 38px; border-radius: 8px; background: #fff; border: 1px solid #D7DCE5; color: #202737; font-size: 13.5px; font-weight: 900; }
      .write-browse:hover { border-color: #D4AF37; }
      .write-or-row { display: flex; align-items: center; gap: 12px; margin: 15px 0 16px; }
      .write-or-row::before, .write-or-row::after { content: ''; height: 1px; background: #E8EBF1; flex: 1; }
      .write-or-pill { height: 38px; padding: 0 17px; border-radius: 999px; background: #fff; border: 1px solid #E1E5EC; color: #6B7280; font-size: 13px; font-weight: 900; display: inline-flex; align-items: center; gap: 8px; }
      .write-or-pill:hover { border-color: #D4AF37; color: #B8941E; }
      .write-submit { width: 100%; height: 47px; border-radius: 10px; background: #9EA2AA; color: #fff; font-size: 15px; font-weight: 900; display: inline-flex; align-items: center; justify-content: center; gap: 10px; margin-top: 18px; transition: background .2s ease; }
      .write-modal-side { background: #F6F7FA; border-left: 1px solid #E8EBF1; padding: 19px 19px 24px; overflow-y: auto; }
      .timer-card, .tips-card { background: #fff; border-radius: 18px; border: 1px solid #F0F1F4; box-shadow: 0 1px 2px rgba(15,23,42,0.02); }
      .timer-card { padding: 18px 14px 16px; text-align: center; }
      .timer-label { color: #A4ABBA; font-size: 10.5px; font-weight: 900; letter-spacing: 2.2px; text-transform: uppercase; }
      .timer-circle { width: 166px; height: 166px; margin: 18px auto 17px; border-radius: 50%; border: 5px solid #D4B646; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #0D1223; }
      .timer-time { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 30px; font-weight: 900; letter-spacing: -1.5px; line-height: 1; }
      .timer-auto { margin-top: 12px; font-size: 8.5px; letter-spacing: 1.4px; color: #A8AFBD; font-weight: 900; text-transform: uppercase; }
      .timer-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .timer-start, .timer-reset { height: 40px; border-radius: 8px; font-size: 12.5px; font-weight: 900; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
      .timer-start { background: #0D1223; color: #fff; }
      .timer-reset { background: #fff; color: #626B7B; border: 1px solid #E0E3EA; }
      .tips-card { margin-top: 15px; padding: 17px 15px; }
      .tips-title { display: flex; align-items: center; gap: 8px; color: #182033; font-size: 13px; font-weight: 900; margin-bottom: 14px; }
      .tip-item { display: flex; align-items: center; gap: 12px; min-height: 55px; background: #F0F1F4; border-radius: 8px; padding: 10px 12px; margin-bottom: 11px; }
      .tip-item:last-child { margin-bottom: 0; }
      .tip-icon { width: 34px; height: 34px; border-radius: 8px; background: #fff; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .tip-copy { color: #3F4655; font-size: 12.5px; line-height: 1.35; font-weight: 900; }
      @media (max-width: 900px) {
        .write-modal-shell { width: calc(100vw - 24px); height: auto; max-height: calc(100vh - 24px); overflow-y: auto; }
        .write-modal-head { height: auto; padding: 22px; }
        .write-modal-body { height: auto; grid-template-columns: 1fr; }
        .write-modal-side { border-left: 0; border-top: 1px solid #E8EBF1; }
      }
    `}</style>
  );
}
