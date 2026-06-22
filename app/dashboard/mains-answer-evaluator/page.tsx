'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardPageHero from '@/components/DashboardPageHero';
import FilePreviewThumb from '@/components/FilePreviewThumb';
import { dailyAnswerService } from '@/lib/services';

/* ─── Static config ─── */

const PAPERS = [
  { id: 'gs1', emoji: '🏛️', label: 'GS Paper I', description: 'History · Geography · Society' },
  { id: 'gs2', emoji: '⚖️', label: 'GS Paper II', description: 'Polity · Governance · IR' },
  { id: 'gs3', emoji: '📈', label: 'GS Paper III', description: 'Economy · Environment · Sci-Tech' },
  { id: 'gs4', emoji: '🎯', label: 'GS Paper IV', description: 'Ethics, Integrity & Aptitude' },
  { id: 'essay', emoji: '✏️', label: 'Essay', description: 'Paper I · 2 essays' },
  { id: 'optional', emoji: '📚', label: 'Optional', description: 'Choose your optional subject' },
];

/* Focus-subject options per paper (optional narrowing) */
const FOCUS_SUBJECTS: Record<string, string[]> = {
  gs1: ['Art & Culture', 'Modern History', 'World History', 'Geography', 'Indian Society'],
  gs2: ['Polity', 'Governance', 'Social Justice', 'International Relations'],
  gs3: ['Economy', 'Agriculture', 'Science & Tech', 'Environment', 'Internal Security'],
  gs4: ['Ethics — Theory', 'Case Studies'],
  essay: [],
  optional: [],
};

const MARK_OPTIONS = [
  { value: 10, mins: 7, words: 150 },
  { value: 15, mins: 11, words: 200 },
  { value: 20, mins: 15, words: 250 },
];

const SAMPLE_QUESTION = 'Analyze the role of technology in transforming Indian agriculture. What are the key barriers to its adoption?';

const QUICK_TIPS = [
  { key: 'ink', icon: '✏️', label: 'Ink & Paper', points: ['Use dark blue or black ink only', 'Unruled sheets work best for evaluation', 'Avoid pencil — AI may miss faint marks'] },
  { key: 'photo', icon: '📷', label: 'Photography', points: ['Take photos in bright, shadow-free lighting', 'Keep camera parallel to paper (no angle)', 'Avoid reflections — turn off flash if needed'] },
  { key: 'format', icon: '📝', label: 'Writing Format', points: ['Leave proper margins on both sides', 'Write question numbers clearly at the top', 'Upload pages in correct order (P1, P2...)'] },
  { key: 'accuracy', icon: '🎯', label: 'For Accuracy', points: ['Number each page if multi-page answer', 'Keep handwriting legible — not too rushed', 'Upload the right page for each question'] },
];

const ACCEPTED_TYPES = '.jpg,.jpeg,.png,.webp,.pdf';
const MAX_FILE_MB = 10;

/* ─── Card style helper ─── */
const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: '18px',
  padding: '24px 28px',
  marginBottom: 'clamp(14px, 1.2vw, 20px)',
  boxShadow: '0 4px 24px 0 rgba(16,24,40,0.07), 0 1.5px 6px 0 rgba(16,24,40,0.04)',
};

type StepState = 'done' | 'current' | 'upcoming';

/* ─── In-card step header (number + title + subtitle) ─── */
function StepHeader({ step, title, subtitle, badge, state }: {
  step: number;
  title: string;
  subtitle?: string;
  badge?: string;
  state: StepState;
}) {
  // Navy rounded-square numbered badge — same design as Step 1 (no green tick)
  const circleBg = '#1E2D4E';
  const numColor = '#FFFFFF';
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '20px' }}>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        background: circleBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 700,
        fontSize: '15px',
        color: numColor,
        transition: 'all 0.2s ease',
      }}>
        {step}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '18px', color: '#101828', lineHeight: 1.25 }}>
          {title}
          {badge && (
            <span style={{ fontWeight: 600, fontSize: '14px', color: '#9AA3B2', marginLeft: '6px' }}>({badge})</span>
          )}
        </div>
        {subtitle && (
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Horizontal progress stepper ─── */
function ProgressStepper({ nodes, currentStep }: { nodes: { label: string; done: boolean }[]; currentStep: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', maxWidth: '560px', margin: '0 auto', padding: '24px 12px 52px' }}>
      {nodes.map((s, i) => {
        const state: StepState = s.done ? 'done' : i === currentStep ? 'current' : 'upcoming';
        // current → blue, done → green, future → grey
        const circleBg = state === 'current' ? '#1E2D4E' : state === 'done' ? '#16A34A' : '#EEF1F6';
        const numColor = state === 'upcoming' ? '#9AA3B2' : '#FFFFFF';
        const labelColor = state === 'current' ? '#1E2D4E' : state === 'done' ? '#16A34A' : '#9AA3B2';
        return (
          <React.Fragment key={s.label}>
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: circleBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: '16px',
                color: numColor,
                transition: 'all 0.2s ease',
              }}>
                {s.done ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 13l4 4L19 7" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (i + 1)}
              </div>
              <span style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                whiteSpace: 'nowrap',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '13px',
                color: labelColor,
                transition: 'color 0.2s ease',
              }}>
                {s.label}
              </span>
            </div>
            {i < nodes.length - 1 && (
              <div style={{
                flex: 1,
                minWidth: '24px',
                height: '2px',
                marginTop: '21px',
                marginInline: '8px',
                borderRadius: '2px',
                background: s.done ? '#86EFAC' : '#E5E7EB',
                transition: 'background 0.2s ease',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function MainsAnswerEvaluatorPage() {
  const [selectedPaper, setSelectedPaper] = useState('gs1');
  const [paperTouched, setPaperTouched] = useState(true);
  const [focusSubjectOpen, setFocusSubjectOpen] = useState(false);
  const [focusSubject, setFocusSubject] = useState('');
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [openTip, setOpenTip] = useState<string | null>(null);
  const [selectedMarks, setSelectedMarks] = useState<number | null>(null);
  const [question, setQuestion] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [answerText, setAnswerText] = useState('');
  const [showTypeAnswer, setShowTypeAnswer] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [dropHover, setDropHover] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  /* ─── In-page file preview (modal) — build & revoke an object URL ─── */
  useEffect(() => {
    if (!previewFile) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(previewFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [previewFile]);

  // Close the preview modal on Escape
  useEffect(() => {
    if (!previewFile) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPreviewFile(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewFile]);

  const paperLabel = PAPERS.find(p => p.id === selectedPaper)?.label ?? 'GS Paper 1';

  /* ─── Step completion ─── */
  const paperDone = paperTouched;
  const questionDone = question.trim().length > 0; // optional
  const answerDone = files.length > 0 || answerText.trim().length > 0;
  const marksDone = selectedMarks !== null;
  const canEvaluate = paperDone && answerDone && marksDone;

  const nodes = [
    { label: 'Select Paper', done: paperDone },
    { label: 'Set Marks', done: marksDone },
    { label: 'Your Question', done: questionDone },
    { label: 'Upload Answer & Get Feedback', done: answerDone },
  ];
  // Done steps → green, the first not-yet-completed step → blue (current), rest → grey
  const currentStep = nodes.findIndex(n => !n.done);
  const stepState = (i: number): StepState => nodes[i].done ? 'done' : i === currentStep ? 'current' : 'upcoming';

  // Live progress for the Evaluation Summary (4 steps → 25% each)
  const progressPct = nodes.filter(n => n.done).length * 25;

  /* ─── File handling (multi-file: append uploaded answer pages) ─── */
  function acceptFiles(incoming: FileList | File[] | null) {
    setError(null);
    if (!incoming) return;
    const list = Array.from(incoming);
    const tooBig = list.find(f => f.size > MAX_FILE_MB * 1024 * 1024);
    if (tooBig) {
      setError(`File is too large. Please upload files under ${MAX_FILE_MB} MB each.`);
      return;
    }
    if (list.length === 0) return;
    setFiles(prev => [...prev, ...list]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    acceptFiles(e.dataTransfer.files ?? null);
  }

  async function handleSubmit() {
    if (!canEvaluate || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      // Reuse the existing Daily Mains Challenge evaluation pipeline:
      // submit the answer, stash the attemptId, then hand off to the shared
      // AI evaluation engine → results screens.
      const res = files.length > 0
        ? await dailyAnswerService.uploadFiles(files)
        : await dailyAnswerService.submitText(answerText);
      const attemptId =
        (res as any)?.attemptId ||
        (res as any)?.data?.attemptId ||
        (res as any)?.data?.data?.attemptId;
      if (attemptId && typeof window !== 'undefined') {
        sessionStorage.setItem('dailyAnswerAttemptId', attemptId);
      }
      router.push('/dashboard/daily-answer/challenge/attempt/evaluating');
    } catch (err: any) {
      setError(err?.message || 'Failed to submit answer. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="flex overflow-hidden font-arimo" style={{ background: '#F9FAFB', height: 'calc(100vh - clamp(90px, 5.78vw, 111px))' }}>
      <main className="flex-1 overflow-y-auto font-arimo" style={{ background: '#F9FAFB' }}>

        <DashboardPageHero
          badgeIcon={<span style={{ fontSize: '16px', lineHeight: 1 }}>✍️</span>}
          badgeText="MAINS ANSWER EVALUATOR"
          title={
            <>
              Evaluate Your{' '}
              <em className="not-italic" style={{ color: '#E8B84B', fontStyle: 'italic' }}>Mains</em>{' '}
              Answers
            </>
          }
          subtitle="Upload your answer sheets and receive instant evaluation with detailed feedback, personalized insights, and actionable improvement suggestions. Practice smarter and maximize your Mains score."
          stats={[
            { value: '10,230+', label: 'Answers Evaluated', color: '#FDC700' },
            { value: '98.2%', label: 'Accuracy Rate', color: '#F97316' },
            { value: '< 60s', label: 'Evaluation Time', color: '#22C55E' },
            { value: <>4.8<span style={{ color: '#FDC700' }}>★</span></>, label: 'Average Rating', color: '#FFFFFF' },
          ]}
        />

        {/* ── Two-column layout: tool (left) + sidebar (right) ── */}
        <div style={{ display: 'flex', gap: 'clamp(12px, 1.2vw, 20px)', maxWidth: '1320px', margin: '0 auto', padding: '0 clamp(12px, 1.2vw, 20px) clamp(20px, 2vw, 32px)' }}>

          {/* ── Left: main column ── */}
          <div style={{ flex: '1 1 0', minWidth: 0 }}>

            <ProgressStepper nodes={nodes} currentStep={currentStep} />

            <>
                {/* ── Step 1: Select Your Paper (Exam Mode block copied from Mock Tests) ── */}
                <div style={cardStyle}>
                  {/* Step Header — navy numbered box */}
                  <div style={{ marginBottom: '22px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: '#1E2D4E', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', flexShrink: 0,
                    }}>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#FFF' }}>1</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '18px', color: '#101828', lineHeight: 1.25 }}>
                        Select Your Paper
                      </span>
                      <p style={{ margin: 0, fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6B7280' }}>
                        Choose the paper, narrow to a subject, or pick your optional.
                      </p>
                    </div>
                  </div>

                  {/* Paper Type Cards — 3-column grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gridAutoRows: '1fr',
                    gap: '10px',
                    marginBottom: '20px',
                  }}>
                    {PAPERS.map(paper => {
                      const isSelected = selectedPaper === paper.id;
                      return (
                        <button
                          key={paper.id}
                          onClick={() => { setSelectedPaper(paper.id); setPaperTouched(true); setFocusSubject(''); }}
                          style={{
                            background: isSelected ? '#EFF6FF' : '#FAFAFA',
                            border: isSelected ? '1.8px solid #17223E' : '1.6px solid #E5E7EB',
                            borderRadius: '12px',
                            padding: '14px 12px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            width: '100%',
                            height: '100%',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span style={{ fontSize: '22px', flexShrink: 0, lineHeight: 1 }}>
                            {paper.emoji}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#101828', marginBottom: '2px' }}>
                              {paper.label}
                            </div>
                            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6B7280', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                              {paper.description}
                            </div>
                          </div>
                          <div style={{
                            width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                            border: isSelected ? '5px solid #17223E' : '1.5px solid #D1D5DB',
                            background: '#FFF', transition: 'all 0.15s ease',
                          }} />
                        </button>
                      );
                    })}
                  </div>

                  {/* Focus Subject Dropdown */}
                  <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: focusSubjectOpen ? '16px 18px' : '14px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: focusSubjectOpen ? '10px' : '0' }}>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.6px', color: '#6B7280', textTransform: 'uppercase' as const }}>
                        FOCUS SUBJECT{' '}
                        <span style={{ fontWeight: 400, color: '#9CA3AF', textTransform: 'none' as const }}>(optional)</span>
                      </span>
                      <button
                        onClick={() => setFocusSubjectOpen(o => !o)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
                          color: '#9CA3AF', fontSize: '16px', lineHeight: 1,
                          transition: 'transform 0.2s ease',
                          transform: focusSubjectOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                        aria-label="Toggle focus subject"
                      >
                        ▾
                      </button>
                    </div>
                    {focusSubjectOpen && (
                      <div style={{ position: 'relative' }}>
                        <select
                          value={focusSubject}
                          onChange={e => setFocusSubject(e.target.value)}
                          style={{
                            width: '100%', padding: '10px 36px 10px 14px',
                            border: '1px solid #E5E7EB', borderRadius: '10px',
                            background: '#FFF', fontSize: '14px', color: '#101828',
                            fontFamily: 'Inter, sans-serif', cursor: 'pointer', outline: 'none',
                            appearance: 'none' as any, WebkitAppearance: 'none' as any,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                          }}
                        >
                          <option value="">All topics within this paper</option>
                          {(FOCUS_SUBJECTS[selectedPaper] ?? []).map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' as const, color: '#6B7280', fontSize: '14px' }}>▾</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Step 2: Maximum Question Marks (matches Mock Tests "Question Source" block) ── */}
                <div style={cardStyle}>
                  <StepHeader step={2} title="Maximum Question Marks" subtitle="Select marks for the question" state={stepState(1)} />
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {MARK_OPTIONS.map(m => {
                      const isSelected = selectedMarks === m.value;
                      return (
                        <button
                          key={m.value}
                          onClick={() => setSelectedMarks(m.value)}
                          style={{
                            flex: '1 1 0',
                            minWidth: '120px',
                            background: isSelected ? '#EFF6FF' : '#FAFAFA',
                            border: isSelected ? '1.8px solid #17223E' : '1.6px solid #E5E7EB',
                            borderRadius: '12px',
                            padding: '12px 14px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            position: 'relative',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '26px', lineHeight: 1, color: isSelected ? '#17223E' : '#1E2D4E' }}>{m.value}</div>
                          <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: isSelected ? '#17223E' : '#1E2D4E', marginTop: '2px' }}>Marks</div>
                          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6B7280', lineHeight: 1.4, marginTop: '8px' }}>~{m.mins} mins · {m.words} words</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Step 3: Question (Optional) ── */}
                <div style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    <StepHeader step={3} title="Question" badge="Optional" subtitle="Type Your Question or let AI auto-detect from your answer sheet" state={stepState(2)} />
                    <button
                      onClick={() => setQuestion(SAMPLE_QUESTION)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '10px',
                        padding: '8px 14px',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 600,
                        fontSize: '13px',
                        color: '#155DFC',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      ✨ Use Sample Question
                    </button>
                  </div>
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Type or paste your question here (or leave blank to auto-detect from your answer)…"
                    rows={4}
                    style={{
                      width: '100%',
                      border: '1.5px solid #E5E7EB',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      color: '#101828',
                      lineHeight: 1.5,
                      resize: 'vertical',
                      outline: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#64748B' }}>
                      {question.length} characters
                    </span>
                    {question.length > 0 && (
                      <button
                        onClick={() => setQuestion('')}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                          fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6B7280',
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                        }}
                      >
                        Clear ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* ── Step 4: Upload Answer & Get Feedback ── */}
                <div style={cardStyle}>
                  <StepHeader step={4} title="Upload Your Answer" subtitle="Upload your answer or Type Your Answer for Evaluation" state={stepState(3)} />

                  {/* ── Upload Mode ── */}
                  {!showTypeAnswer && (
                    <>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onMouseEnter={() => setDropHover(true)}
                        onMouseLeave={() => setDropHover(false)}
                        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={handleDrop}
                        style={{
                          border: `1.5px dashed ${(dragActive || dropHover) ? '#1D4ED8' : '#BEDBFF'}`,
                          borderRadius: '14px',
                          background: (dragActive || dropHover) ? '#EFF6FF' : '#F8FAFF',
                          padding: 'clamp(18px, 1.8vw, 26px)',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept={ACCEPTED_TYPES}
                          multiple
                          onChange={(e) => acceptFiles(e.target.files)}
                          style={{ display: 'none' }}
                        />
                        {/* Navy upload icon */}
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '11px', background: '#0F172B',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px',
                        }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M12 15V3M12 3l-4 4M12 3l4 4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M5 16v3a1 1 0 001 1h12a1 1 0 001-1v-3" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#101828', marginBottom: '4px' }}>
                          Drag & Drop Answer Scripts here
                        </div>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6B7280' }}>
                          Upload handwritten answers
                        </div>
                        {/* Browse Files */}
                        <div style={{ marginTop: '12px' }}>
                          <span style={{
                            display: 'inline-block', background: '#FFFFFF', border: '1px solid #D1D5DB',
                            borderRadius: '10px', padding: '10px 24px',
                            fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#101828',
                          }}>
                            Browse Files
                          </span>
                        </div>
                      </div>

                      {/* ── Uploaded file preview cards (image/PDF thumbnails) ── */}
                      {files.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                          {files.map((f, fi) => (
                            <div
                              key={`${f.name}-${fi}`}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '14px',
                                padding: '12px 14px', borderRadius: '14px',
                                border: '1.5px solid #BBF7D0', background: '#F0FDF4',
                              }}
                            >
                              <FilePreviewThumb file={f} size={56} />
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13.5px', fontWeight: 700, color: '#17223E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {f.name}
                                  </span>
                                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }} aria-hidden="true">
                                    <circle cx="9" cy="9" r="9" fill="#16A34A" />
                                    <path d="M5 9.5L7.5 12L13 6.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </div>
                                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6A7282' }}>
                                  {(f.size / 1024 / 1024).toFixed(1)} MB
                                  {files.length > 1 && <> · Page {fi + 1} of {files.length}</>}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                <button
                                  type="button"
                                  onClick={() => setPreviewFile(f)}
                                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '8px 12px', background: 'none', border: '1px solid #E5E7EB', borderRadius: '10px', cursor: 'pointer' }}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="#6B7280" strokeWidth="2"/></svg>
                                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, color: '#6B7280' }}>Preview</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeFile(fi)}
                                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '8px 12px', background: 'none', border: '1px solid #FECACA', borderRadius: '10px', cursor: 'pointer' }}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0v14a1 1 0 01-1 1H7a1 1 0 01-1-1V6" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, color: '#DC2626' }}>Remove</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* ── Type Answer Mode ── */}
                  {showTypeAnswer && (
                    <>
                      <textarea
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="Type or paste your answer here…"
                        rows={10}
                        style={{
                          width: '100%',
                          border: '1.5px solid #E5E7EB',
                          borderRadius: '12px',
                          padding: '14px 16px',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          color: '#101828',
                          lineHeight: 1.6,
                          resize: 'vertical',
                          outline: 'none',
                        }}
                      />
                      <div style={{ marginTop: '8px', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#64748B' }}>
                        {answerText.trim() ? answerText.trim().split(/\s+/).length : 0} words
                      </div>
                    </>
                  )}

                  {/* ── Accordion toggle: Upload Mode ⇄ Type Answer Mode ── */}
                  <button
                    onClick={() => setShowTypeAnswer(v => !v)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      width: '100%', marginTop: '16px', background: 'none', border: 'none', cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: '#1E2D4E',
                    }}
                  >
                    <span style={{ fontSize: '11px' }}>{showTypeAnswer ? '▲' : '▼'}</span>
                    {showTypeAnswer ? 'OR Upload Your Answer' : 'OR Type Your Answer'}
                  </button>

                  <div style={{ height: '24px' }} />
                  {error && (
                    <div style={{
                      background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px',
                      padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px',
                    }}>
                      <span style={{ fontSize: '16px' }}>⚠️</span>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#991B1B' }}>{error}</span>
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={!canEvaluate || submitting}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      background: canEvaluate ? '#1E2D4E' : '#E5E7EB',
                      color: canEvaluate ? '#FFFFFF' : '#9AA3B2',
                      border: 'none',
                      borderRadius: '14px',
                      padding: 'clamp(14px, 1.1vw, 18px)',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 800,
                      fontSize: 'clamp(15px, 1vw, 17px)',
                      cursor: (canEvaluate && !submitting) ? 'pointer' : 'not-allowed',
                      opacity: submitting ? 0.7 : 1,
                      letterSpacing: '0.02em',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {submitting ? (
                      'Submitting…'
                    ) : canEvaluate ? (
                      <>
                        <span aria-hidden="true">🚀</span>
                        <span>Evaluate My Answer</span>
                        <span aria-hidden="true" style={{ fontSize: '1.1em', lineHeight: 1 }}>→</span>
                      </>
                    ) : (
                      'Complete all steps to evaluate'
                    )}
                  </button>
                  {!canEvaluate && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginTop: '14px' }}>
                      {[
                        { label: 'Select a paper', done: paperDone },
                        { label: 'Select maximum marks', done: marksDone },
                        { label: 'Upload or type your answer', done: answerDone },
                      ].map(req => (
                        <span key={req.label} style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          background: req.done ? '#DCFCE7' : '#F3F4F6',
                          color: req.done ? '#16A34A' : '#9AA3B2',
                          borderRadius: '999px',
                          padding: '6px 14px',
                          fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px',
                        }}>
                          {req.done && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                              <path d="M5 13l4 4L19 7" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                          {req.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Disclaimer (centered, subtle text-row accordion) ── */}
                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={() => setDisclaimerOpen(o => !o)}
                    aria-expanded={disclaimerOpen}
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      margin: '0 auto',
                      background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: '13px', color: '#9CA3AF', flexShrink: 0 }}>ⓘ</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '12px', color: '#9CA3AF' }}>
                      AI Disclaimer
                    </span>
                    <span style={{
                      fontSize: '10px', color: '#9CA3AF', flexShrink: 0,
                      transition: 'transform 0.2s ease',
                      transform: disclaimerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}>
                      ▼
                    </span>
                  </button>
                  {disclaimerOpen && (
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9CA3AF', lineHeight: 1.5, margin: '8px auto 0', maxWidth: '560px', textAlign: 'center' }}>
                      This AI-powered evaluation is for practice and self-improvement purposes only. Results are based on algorithmic
                      analysis and should not be considered as official UPSC feedback. Evaluation quality may vary based on handwriting
                      clarity and image resolution. <strong>Rise with Jeet</strong> does not guarantee specific scores in the actual examination.
                    </p>
                  )}
                </div>
              </>
          </div>

          {/* ── Right: sticky sidebar ── */}
          <aside className="hidden xl:block" style={{ width: 'clamp(300px, 22vw, 360px)', flexShrink: 0 }}>
            <div style={{ position: 'sticky', top: '16px' }}>

              {/* Evaluation Summary (live) */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '18px',
                overflow: 'hidden',
                marginBottom: '16px',
                boxShadow: '0 4px 24px 0 rgba(16,24,40,0.06)',
              }}>
                {/* Header — blue gradient bar with gold dot (same as before) */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '16px 20px',
                  background: 'linear-gradient(120deg, #16235C 0%, #2747B8 100%)',
                }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FDC700', flexShrink: 0 }} />
                  <span style={{
                    fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '13px',
                    letterSpacing: '0.08em', color: '#FFFFFF', textTransform: 'uppercase' as const,
                  }}>
                    Evaluation Summary
                  </span>
                </div>

                {/* Body */}
                <div style={{ padding: '20px' }}>

                {/* 2×2 info grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  {[
                    { icon: '📄', label: 'Paper', value: paperTouched ? paperLabel : 'Not selected' },
                    { icon: '⭐', label: 'Max Marks', value: selectedMarks !== null ? `${selectedMarks} Marks` : 'Not selected' },
                    { icon: '❓', label: 'Question', value: questionDone ? 'Entered' : 'Not Entered' },
                    { icon: '📎', label: 'Answer Sheet', value: files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''}` : (answerText.trim() ? 'Typed' : 'Not uploaded') },
                  ].map(item => (
                    <div key={item.label} style={{ background: '#F8FAFC', borderRadius: '12px', padding: '14px' }}>
                      <div style={{ fontSize: '18px', lineHeight: 1, marginBottom: '8px' }}>{item.icon}</div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.06em', color: '#6B7280', textTransform: 'uppercase' as const, marginBottom: '4px' }}>
                        {item.label}
                      </div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#101828', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Setup Progress */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>Setup Progress</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 800, color: '#F97316' }}>{progressPct}%</span>
                  </div>
                  <div style={{ background: '#EEF1F6', borderRadius: '6px', height: '6px', overflow: 'hidden' }}>
                    <div style={{
                      background: 'linear-gradient(90deg, #FDC700, #FF8904)',
                      width: `${progressPct}%`,
                      height: '100%',
                      borderRadius: '6px',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>

                {/* Evaluate button */}
                <button
                  onClick={handleSubmit}
                  disabled={!canEvaluate || submitting}
                  style={{
                    width: '100%',
                    background: canEvaluate ? '#1E2D4E' : '#FEF3C7',
                    color: canEvaluate ? '#FFFFFF' : '#B45309',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: (canEvaluate && !submitting) ? 'pointer' : 'not-allowed',
                    opacity: submitting ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {submitting ? (
                    'Submitting…'
                  ) : canEvaluate ? (
                    <>
                      <span aria-hidden="true">🚀</span>
                      <span>Evaluate My Answer</span>
                      <span aria-hidden="true" style={{ fontSize: '1.1em', lineHeight: 1 }}>→</span>
                    </>
                  ) : (
                    <>
                      <span>⏳</span>
                      <span>Complete all steps to evaluate</span>
                    </>
                  )}
                </button>
                </div>
              </div>

              {/* Tips For Best Results (accordion — same as Mock Test reference) */}
              <div
                className="bg-white overflow-hidden"
                style={{ borderRadius: 20, marginBottom: '16px', boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A' }}
              >
                <div className="flex items-center gap-2" style={{ padding: '14px 20px', background: '#FEFCE8', borderBottom: '1px solid #FEF08A' }}>
                  <span style={{ fontSize: 18 }}>💡</span>
                  <span className="font-bold text-[#101828]" style={{ fontSize: 13, letterSpacing: '0.04em' }}>QUICK TIPS FOR BEST EVALUATION</span>
                </div>
                {QUICK_TIPS.map((tip) => (
                  <div key={tip.key} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <button
                      type="button"
                      onClick={() => setOpenTip(openTip === tip.key ? null : tip.key)}
                      className="w-full flex items-center justify-between hover:bg-[#F9FAFB] transition-colors text-left"
                      style={{ padding: '14px 20px' }}
                    >
                      <span className="flex items-center gap-2 font-semibold text-[#101828]" style={{ fontSize: 14 }}>
                        <span>{tip.icon}</span>
                        {tip.label}
                      </span>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, color: '#9CA3AF', transition: 'transform 0.2s', transform: openTip === tip.key ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    {openTip === tip.key && (
                      <div style={{ padding: '0 20px 14px' }}>
                        {tip.points.map((pt, idx) => (
                          <div key={idx} className="flex items-start gap-3" style={{ marginBottom: 8 }}>
                            <span className="font-bold flex-shrink-0" style={{ color: '#0F766E', fontSize: 14, marginTop: 1 }}>✓</span>
                            <span className="text-[#4A5565]" style={{ fontSize: 13, lineHeight: '20px' }}>{pt}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

            </div>
          </aside>

        </div>
      </main>

      {/* ── In-page file preview modal ── */}
      {previewFile && (
        <div
          onClick={() => setPreviewFile(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(15, 23, 43, 0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF', borderRadius: '16px', overflow: 'hidden',
              width: 'min(900px, 100%)', maxHeight: '90vh',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '14px 18px', borderBottom: '1px solid #E5E7EB' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#101828', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {previewFile.name}
              </span>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                aria-label="Close preview"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FFFFFF', cursor: 'pointer', flexShrink: 0 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            </div>
            {/* Body */}
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {previewUrl && (
                previewFile.type.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt={previewFile.name} style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', display: 'block' }} />
                ) : (previewFile.type === 'application/pdf' || previewFile.name.toLowerCase().endsWith('.pdf')) ? (
                  <iframe src={previewUrl} title={previewFile.name} style={{ width: '100%', height: '80vh', border: 'none' }} />
                ) : (
                  <div style={{ padding: '48px 24px', textAlign: 'center', fontFamily: 'Inter, sans-serif', color: '#6B7280' }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>📄</div>
                    <div style={{ fontSize: '14px' }}>Preview not available for this file type.</div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
