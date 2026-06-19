'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardPageHero from '@/components/DashboardPageHero';
import { dailyAnswerService } from '@/lib/services';

/* ─── Static config ─── */

const PAPERS = [
  { id: 'gs1', emoji: '📜', label: 'GS Paper 1', description: 'Heritage, Culture, History & Geography' },
  { id: 'gs2', emoji: '🏛️', label: 'GS Paper 2', description: 'Governance, Polity, Social Justice & IR' },
  { id: 'gs3', emoji: '🌱', label: 'GS Paper 3', description: 'Technology, Economy, Environment & Security' },
  { id: 'gs4', emoji: '⚖️', label: 'GS Paper 4', description: 'Ethics, Integrity & Aptitude' },
  { id: 'optional', emoji: '📖', label: 'Optional Paper', description: 'Your optional subject', badge: 'Up to 20M' },
];

const MARK_OPTIONS = [
  { value: 10, words: 150 },
  { value: 15, words: 250 },
  { value: 20, words: 350 },
];

const SAMPLE_QUESTION = 'Analyze the role of technology in transforming Indian agriculture. What are the key barriers to its adoption?';

const HOW_IT_WORKS = [
  { emoji: '📋', title: 'Select Paper & Marks', description: 'Choose GS1–4 or Optional with marking scheme' },
  { emoji: '❓', title: 'Add Your Question', description: 'Type it or pick a sample — or auto-detect' },
  { emoji: '📷', title: 'Upload Answer', description: 'PDF or photos of your answer pages' },
  { emoji: '🎯', title: 'Get AI Feedback', description: 'Receive detailed scores & suggestions instantly' },
];

const CRITERIA = [
  { label: 'Content & Relevance', pct: 35, color: '#3B82F6' },
  { label: 'Structure & Flow', pct: 25, color: '#6366F1' },
  { label: 'Analytical Depth', pct: 20, color: '#8B5CF6' },
  { label: 'Language & Clarity', pct: 12, color: '#14B8A6' },
  { label: 'Conclusion Quality', pct: 8, color: '#F59E0B' },
];
const CRITERIA_MAX = Math.max(...CRITERIA.map(c => c.pct));

const QUICK_TIPS = [
  'Write clearly — OCR works best with neat handwriting',
  'Ensure good lighting when photographing pages',
  'Upload all pages in the correct order',
  'Include the question at the top of your answer',
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
  const circleBg = state === 'done' ? '#DCFCE7' : '#EEF1F6';
  const numColor = '#9AA3B2';
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '20px' }}>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
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
        {state === 'done' ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 13l4 4L19 7" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : step}
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
function ProgressStepper({ nodes }: { nodes: { label: string; done: boolean }[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', maxWidth: '760px', margin: '0 auto', padding: '24px 12px 52px' }}>
      {nodes.map((s, i) => {
        const circleBg = s.done ? '#DCFCE7' : '#EEF1F6';
        const numColor = '#9AA3B2';
        const labelColor = s.done ? '#16A34A' : '#9AA3B2';
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
                    <path d="M5 13l4 4L19 7" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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

/* ─── Sidebar card shell ─── */
function SidebarCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: '18px',
      padding: '22px',
      marginBottom: '16px',
      boxShadow: '0 4px 24px 0 rgba(16,24,40,0.06)',
      ...style,
    }}>
      {children}
    </div>
  );
}

export default function MainsAnswerEvaluatorPage() {
  const [selectedPaper, setSelectedPaper] = useState('gs1');
  const [paperTouched, setPaperTouched] = useState(false);
  const [selectedMarks, setSelectedMarks] = useState<number | null>(null);
  const [question, setQuestion] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [showTypeAnswer, setShowTypeAnswer] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [dropHover, setDropHover] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const paperLabel = PAPERS.find(p => p.id === selectedPaper)?.label ?? 'GS Paper 1';

  /* ─── Step completion ─── */
  const paperDone = paperTouched;
  const questionDone = question.trim().length > 0; // optional
  const answerDone = file !== null || answerText.trim().length > 0;
  const marksDone = selectedMarks !== null;
  const canEvaluate = paperDone && answerDone && marksDone;

  const nodes = [
    { label: 'Select Paper', done: paperDone },
    { label: 'Set Marks', done: marksDone },
    { label: 'Your Question', done: questionDone },
    { label: 'Upload Answer & Get Feedback', done: answerDone },
  ];
  // Steps tick green as completed; everything not done stays grey (no blue "current" highlight)
  const stepState = (i: number): StepState => nodes[i].done ? 'done' : 'upcoming';

  // Live progress for the Evaluation Summary (4 steps → 25% each)
  const progressPct = nodes.filter(n => n.done).length * 25;

  /* ─── File handling ─── */
  function acceptFile(f: File | null) {
    setError(null);
    if (!f) { setFile(null); return; }
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`File is too large. Please upload a file under ${MAX_FILE_MB} MB.`);
      return;
    }
    setFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    acceptFile(e.dataTransfer.files?.[0] ?? null);
  }

  async function handleSubmit() {
    if (!canEvaluate || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      // Reuse the existing Daily Mains Challenge evaluation pipeline:
      // submit the answer, stash the attemptId, then hand off to the shared
      // AI evaluation engine → results screens.
      const res = file
        ? await dailyAnswerService.uploadFile(file)
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

  function handleReset() {
    setSubmitted(false);
    setPaperTouched(false);
    setSelectedMarks(null);
    setQuestion('');
    setFile(null);
    setAnswerText('');
    setShowTypeAnswer(false);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="flex overflow-hidden font-arimo" style={{ background: '#F9FAFB', height: 'calc(100vh - clamp(90px, 5.78vw, 111px))' }}>
      <main className="flex-1 overflow-y-auto font-arimo" style={{ background: '#F9FAFB' }}>

        <DashboardPageHero
          // eslint-disable-next-line @next/next/no-img-element
          badgeIcon={<img src="/sidebar-daily-answer-new.png" alt="evaluator" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />}
          badgeText="MAINS ANSWER EVALUATOR"
          title={
            <>
              Evaluate Your{' '}
              <em className="not-italic" style={{ color: '#E8B84B', fontStyle: 'italic' }}>Mains</em>{' '}
              Answers
            </>
          }
          subtitle=""
          stats={[
            { value: '10,230+', label: 'Answers Evaluated', color: '#FDC700' },
            { value: '98.2%', label: 'Accuracy Rate', color: '#F97316' },
            { value: '< 60s', label: 'Evaluation Time', color: '#22C55E' },
            { value: '4.8★', label: 'Average Rating', color: '#FFFFFF' },
          ]}
        />

        {/* ── Two-column layout: tool (left) + sidebar (right) ── */}
        <div style={{ display: 'flex', gap: 'clamp(12px, 1.2vw, 20px)', maxWidth: '1320px', margin: '0 auto', padding: '0 clamp(12px, 1.2vw, 20px) clamp(20px, 2vw, 32px)' }}>

          {/* ── Left: main column ── */}
          <div style={{ flex: '1 1 0', minWidth: 0 }}>

            <ProgressStepper nodes={nodes} />

            {submitted ? (
              /* ── Confirmation State ── */
              <div style={{ ...cardStyle, textAlign: 'center', padding: 'clamp(36px, 4vw, 56px)' }}>
                <div style={{ fontSize: '56px', marginBottom: '16px' }}>📝</div>
                <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '24px', color: '#101828', marginBottom: '8px' }}>
                  Answer submitted for evaluation
                </h2>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#4A5565', maxWidth: '520px', margin: '0 auto 12px', lineHeight: 1.5 }}>
                  Your <strong>{paperLabel}</strong> answer ({selectedMarks} marks) has been received. You&apos;ll be notified once the
                  detailed evaluation across all parameters is ready.
                </p>
                <div style={{ display: 'inline-flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px', margin: '12px auto 28px' }}>
                  {[paperLabel, `${selectedMarks} Marks`, file ? `File: ${file.name}` : 'Typed answer'].map(tag => (
                    <span key={tag} style={{
                      background: '#EFF6FF', color: '#101828', borderRadius: '999px',
                      padding: '6px 16px', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px',
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div>
                  <button
                    onClick={handleReset}
                    style={{
                      background: '#0F172B', color: '#FFFFFF', border: 'none', borderRadius: '12px',
                      padding: '12px 28px', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', cursor: 'pointer',
                    }}
                  >
                    Evaluate Another Answer
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* ── Step 1: Select Your Paper ── */}
                <div style={cardStyle}>
                  <StepHeader step={1} title="Select Your Paper" subtitle="Choose the UPSC Mains paper for evaluation" state={stepState(0)} />
                  {/* Select paper type label */}
                  <div style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: '14px',
                    color: '#17223E',
                    marginBottom: '12px',
                  }}>
                    Select paper type
                  </div>

                  {/* Paper Type Cards (matches Mock Tests "Exam Mode" block) */}
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
                    {PAPERS.map(paper => {
                      const isSelected = selectedPaper === paper.id;
                      return (
                        <button
                          key={paper.id}
                          onClick={() => { setSelectedPaper(paper.id); setPaperTouched(true); }}
                          style={{
                            flex: '1 1 0',
                            minWidth: '150px',
                            background: isSelected ? '#EFF6FF' : '#F9FAFB',
                            border: isSelected ? '1.6px solid #BEDBFF' : '1.6px solid #E5E7EB',
                            borderRadius: '14px',
                            padding: '16px 16px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            position: 'relative',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            flexDirection: 'column' as const,
                          }}
                        >
                          <div style={{ fontSize: '26px', marginBottom: '6px', lineHeight: 1 }}>
                            {paper.emoji}
                          </div>
                          {paper.badge && (
                            <span style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              background: '#FDC700',
                              color: '#101828',
                              fontFamily: 'Inter, sans-serif',
                              fontWeight: 700,
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '999px',
                            }}>
                              {paper.badge}
                            </span>
                          )}
                          <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#101828', marginBottom: '3px' }}>
                            {paper.label}
                          </div>
                          <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '13px', color: '#4A5565', lineHeight: 1.4 }}>
                            {paper.description}
                          </div>
                        </button>
                      );
                    })}
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
                            background: isSelected ? '#EFF6FF' : '#FFF',
                            border: isSelected ? '2px solid #155DFC' : '1.5px solid #E5E7EB',
                            borderRadius: '14px',
                            padding: '16px 16px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            position: 'relative',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ marginBottom: '8px' }}>
                            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '34px', lineHeight: 1, color: isSelected ? '#155DFC' : '#101828' }}>{m.value}</span>
                          </div>
                          <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#101828', marginBottom: '4px' }}>Marks</div>
                          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6B7280', lineHeight: 1.4 }}>~{m.words} words answer</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Step 3: Question (Optional) ── */}
                <div style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    <StepHeader step={3} title="Question" badge="Optional" subtitle="type your question or let AI auto-detect from your answer sheet" state={stepState(2)} />
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
                  <StepHeader step={4} title="Upload Your Answer" subtitle="Upload your answer or Type your Answer for Evaluation" state={stepState(3)} />

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
                          padding: 'clamp(28px, 3vw, 48px)',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept={ACCEPTED_TYPES}
                          onChange={(e) => acceptFile(e.target.files?.[0] ?? null)}
                          style={{ display: 'none' }}
                        />
                        {/* Navy upload icon */}
                        <div style={{
                          width: '48px', height: '48px', borderRadius: '12px', background: '#0F172B',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
                        }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M12 15V3M12 3l-4 4M12 3l4 4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M5 16v3a1 1 0 001 1h12a1 1 0 001-1v-3" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '17px', color: '#101828', marginBottom: '4px' }}>
                          {file ? file.name : 'Drop your answer script here'}
                        </div>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6B7280' }}>
                          Upload handwritten answers for AI evaluation
                        </div>
                        {/* Format chips */}
                        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                          {['JPG', 'PNG', 'PDF', `Max ${MAX_FILE_MB}MB`].map(chip => (
                            <span key={chip} style={{
                              background: '#EEF1F6', color: '#6B7280', borderRadius: '8px',
                              padding: '4px 12px', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px',
                            }}>
                              {chip}
                            </span>
                          ))}
                        </div>
                        {/* Browse Files */}
                        <div style={{ marginTop: '16px' }}>
                          <span style={{
                            display: 'inline-block', background: '#FFFFFF', border: '1px solid #D1D5DB',
                            borderRadius: '10px', padding: '10px 24px',
                            fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#101828',
                          }}>
                            Browse Files
                          </span>
                        </div>
                      </div>
                      {file && (
                        <button
                          onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                          style={{
                            marginTop: '10px', background: 'none', border: 'none', color: '#6B7280',
                            fontFamily: 'Inter, sans-serif', fontSize: '12px', textDecoration: 'underline', cursor: 'pointer', padding: 0,
                          }}
                        >
                          Remove file
                        </button>
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
                      fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: '#155DFC',
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
                      background: canEvaluate ? '#155DFC' : '#E5E7EB',
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
                    {submitting ? 'Submitting…' : (canEvaluate ? 'Evaluate My Answer' : 'Complete all steps to evaluate')}
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

                {/* ── Disclaimer ── */}
                <div style={{
                  background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '14px',
                  padding: '18px 20px', display: 'flex', gap: '12px', alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
                  <div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#92400E', marginBottom: '4px' }}>
                      Disclaimer
                    </div>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#92400E', lineHeight: 1.5, margin: 0 }}>
                      This AI-powered evaluation is for practice and self-improvement purposes only. Results are based on algorithmic
                      analysis and should not be considered as official UPSC feedback. Evaluation quality may vary based on handwriting
                      clarity and image resolution. <strong>Rise with Jeet</strong> does not guarantee specific scores in the actual examination.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Right: sticky sidebar ── */}
          <aside className="hidden xl:block" style={{ width: 'clamp(300px, 22vw, 360px)', flexShrink: 0 }}>
            <div style={{ position: 'sticky', top: '16px' }}>

              {/* Evaluation Summary (live, reuses Mock Tests "Test Summary" design) */}
              <div style={{
                background: 'linear-gradient(135deg, #162456 0%, #0F172B 50%, #030712 100%)',
                borderRadius: '18px',
                padding: '22px',
                color: '#FFFFFF',
                marginBottom: '16px',
                boxShadow: '0 4px 24px 0 rgba(16,24,40,0.06)',
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FDC700' }} />
                  <span style={{
                    fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '13px',
                    letterSpacing: '0.08em', color: '#FDC700', textTransform: 'uppercase' as const,
                  }}>
                    Evaluation Summary
                  </span>
                </div>

                {/* Live fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  {[
                    { label: 'Paper', value: paperTouched ? paperLabel : '—' },
                    { label: 'Max Marks', value: selectedMarks !== null ? `${selectedMarks} Marks` : '—' },
                    { label: 'Answer Sheet', value: file ? 'Uploaded' : (answerText.trim() ? 'Typed' : 'Not provided') },
                    { label: 'Question', value: questionDone ? 'Entered' : 'Not Entered' },
                  ].map(f => (
                    <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#94A3B8', flexShrink: 0 }}>{f.label}</span>
                      <span style={{
                        fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 700, color: '#FFFFFF',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' as const,
                      }}>
                        {f.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Dynamic progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#94A3B8' }}>Progress</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 800, color: '#FDC700' }}>{progressPct}%</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
                    <div style={{
                      background: 'linear-gradient(90deg, #FDC700, #FF8904)',
                      width: `${progressPct}%`,
                      height: '100%',
                      borderRadius: '6px',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>
              </div>

              {/* How It Works */}
              <SidebarCard>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                  <span style={{
                    width: '28px', height: '28px', borderRadius: '8px', background: '#EFF6FF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px',
                  }}>❓</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '17px', color: '#101828' }}>How It Works</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {HOW_IT_WORKS.map((item, i) => (
                    <div key={item.title} style={{ display: 'flex', gap: '12px' }}>
                      <span style={{
                        width: '24px', height: '24px', borderRadius: '50%', background: '#EFF6FF',
                        color: '#155DFC', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px',
                      }}>{i + 1}</span>
                      <div>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#101828' }}>
                          {item.emoji} {item.title}
                        </div>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6B7280', lineHeight: 1.4 }}>
                          {item.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </SidebarCard>

              {/* Evaluation Criteria */}
              <SidebarCard>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                  <span style={{
                    width: '28px', height: '28px', borderRadius: '8px', background: '#FEF3C7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px',
                  }}>⭐</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '17px', color: '#101828' }}>Evaluation Criteria</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {CRITERIA.map(c => (
                    <div key={c.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#374151' }}>{c.label}</span>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 800, color: '#101828' }}>{c.pct}%</span>
                      </div>
                      <div style={{ background: '#EEF1F6', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
                        <div style={{ background: c.color, width: `${(c.pct / CRITERIA_MAX) * 100}%`, height: '100%', borderRadius: '6px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </SidebarCard>

              {/* RISE PRO upsell */}
              <SidebarCard style={{
                border: 'none',
                background: 'linear-gradient(135deg, #162456 0%, #0F172B 50%, #030712 100%)',
                color: '#FFFFFF',
              }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: '#FDC700', color: '#101828', borderRadius: '999px',
                  padding: '4px 12px', fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '11px',
                  letterSpacing: '0.04em', marginBottom: '14px',
                }}>⭐ RISE PRO</span>
                <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '20px', marginBottom: '8px' }}>
                  Unlock Full Power
                </div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, margin: '0 0 16px' }}>
                  Unlimited evaluations, expert mentor review, model answers &amp; progress analytics.
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '28px' }}>₹499</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>/month</span>
                  <span style={{
                    background: '#16A34A', color: '#FFFFFF', borderRadius: '6px',
                    padding: '2px 8px', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '11px',
                  }}>50% OFF</span>
                </div>
                <Link
                  href="/dashboard/billing/plans?plan=pro&source=mains-evaluator"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    background: 'linear-gradient(90deg, #FDC700, #FF8904, #FF6900)',
                    color: '#FFFFFF', borderRadius: '12px', padding: '14px',
                    fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '15px', textDecoration: 'none',
                  }}
                >
                  Upgrade Now →
                </Link>
              </SidebarCard>

              {/* Quick Tips */}
              <SidebarCard style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '16px', color: '#101828', marginBottom: '14px' }}>
                  💡 Tips For Best Results
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {QUICK_TIPS.map(tip => (
                    <div key={tip} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true">
                        <path d="M5 13l4 4L19 7" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#15803D', lineHeight: 1.4 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </SidebarCard>

            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}
