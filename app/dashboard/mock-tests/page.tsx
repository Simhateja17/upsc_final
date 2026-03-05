'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/* ─── Data Arrays ─── */

const questionSources = [
  { id: 'daily-mcq', icon: '/99k.png', label: 'Daily MCQ', description: 'Fresh from 10 curated daily picks' },
  { id: 'practice-pyq', icon: '/88k.png', label: 'Practice PYQ', description: 'UPSC papers 2010 - 2024' },
  { id: 'subject-wise', icon: '/77k.png', label: 'Subject-wise', description: 'Deep-dive and one subject' },
  { id: 'mixed-bag', icon: '/66k.png', label: 'Mixed Bag', description: 'Random cross-subject mix' },
  { id: 'full-length', icon: '/55k.png', label: 'Full Length Test', description: 'Complete 100-Q simulation', pro: true },
];

const subjects = [
  { id: 'all', emoji: '🌐', label: 'All Topics', count: null },
  { id: 'history', emoji: '📜', label: 'History', count: 340 },
  { id: 'geography', emoji: '🗺️', label: 'Geography', count: 280 },
  { id: 'polity', emoji: '🏛️', label: 'Polity', count: 310 },
  { id: 'economy', emoji: '💰', label: 'Economy', count: 250 },
  { id: 'science-tech', emoji: '🔬', label: 'Science & Tech', count: 220 },
  { id: 'environment', emoji: '🌿', label: 'Environment', count: 190 },
  { id: 'current-affairs', emoji: '📰', label: 'Current Affairs', count: 410 },
  { id: 'art-culture', emoji: '🎨', label: 'Art & Culture', count: 160 },
  { id: 'international-relations', emoji: '🌍', label: 'International Relations', count: 130 },
  { id: 'security-defence', emoji: '🛡️', label: 'Security & Defence', count: 95 },
];

const prelimsPaperTypes = [
  { id: 'gs1', icon: '/2k.png', label: 'GS Paper I', description: 'General Studies — History, Geography, Polity, Economy, Science', isDefault: true },
  { id: 'csat', icon: '/3k.png', label: 'CSAT', description: 'Aptitude · Comprehension · Logical Reasoning' },
];

const examModes = [
  { id: 'prelims', label: 'Prelims', description: 'Objective MCQs · 2 hour format' },
  { id: 'mains', label: 'Mains', description: 'Analytical & descriptive questions' },
];

const mainsPaperTypes = [
  { id: 'gs1', icon: '/2k.png', label: 'GS Paper I', description: 'Indian Heritage, History, Geography & Society', isDefault: true },
  { id: 'gs2', icon: '/2k.png', label: 'GS Paper II', description: 'Governance, Constitution, Polity & IR' },
];

const optionalSubjects = [
  'Public Administration', 'Geography', 'History', 'Sociology',
  'Political Science', 'Philosophy', 'Economics', 'Anthropology',
  'Psychology', 'Law',
];

const difficulties = [
  { id: 'easy', emoji: '🌱', label: 'Easy', description: 'Foundation level' },
  { id: 'medium', emoji: '⚡', label: 'Medium', description: 'Exam standard' },
  { id: 'hard', emoji: '🔥', label: 'Hard', description: 'Advanced level' },
  { id: 'mixed', emoji: '🎯', label: 'Mixed', description: 'All difficulty levels' },
];

const benchmarks = [
  { emoji: '🏆', label: 'Rank 1-100 avg 82%+', color: '#3B82F6', width: '82%' },
  { emoji: '✅', label: 'Cutoff clearers 60+ daily', color: '#16A34A', width: '60%' },
  { emoji: '📊', label: 'Your streak top 18%', color: '#F97316', width: '45%' },
];

const evaluationSteps = [
  'Reading your handwritten answers',
  'Identifying key points & arguments',
  'Comparing with model answers',
  'Preparing detailed markup & feedback',
  "Generating Jeet Sir's analysis",
];

/* ─── StepHeader Helper ─── */

function StepHeader({ step, label }: { step: number; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 0.6vw, 12px)', marginBottom: 'clamp(12px, 1vw, 18px)' }}>
      <div style={{
        width: 'clamp(28px, 2vw, 34px)',
        height: 'clamp(28px, 2vw, 34px)',
        borderRadius: '50%',
        background: '#17223E',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-inter), Inter, sans-serif',
        fontWeight: 700,
        fontSize: 'clamp(12px, 0.85vw, 15px)',
        flexShrink: 0,
      }}>
        {step}
      </div>
      <span style={{
        fontFamily: 'var(--font-inter), Inter, sans-serif',
        fontWeight: 700,
        fontSize: 'clamp(12px, 0.85vw, 15px)',
        letterSpacing: '0.06em',
        color: '#17223E',
        textTransform: 'uppercase' as const,
      }}>
        {label}
      </span>
    </div>
  );
}

/* ─── Page Component ─── */

export default function MockTestsPage() {
  const router = useRouter();
  const [selectedSource, setSelectedSource] = useState('daily-mcq');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedExamMode, setSelectedExamMode] = useState('prelims');
  const [selectedPaperType, setSelectedPaperType] = useState('gs1');
  const [selectedOptional, setSelectedOptional] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(5);
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');

  const estimatedMinutes = Math.ceil(questionCount * 1.6);

  /* ─── Mains Practice Modal State ─── */
  const [showMainsModal, setShowMainsModal] = useState(false);
  const [mainsCurrentQ, setMainsCurrentQ] = useState(1);
  const [mainsAllRead, setMainsAllRead] = useState(false);
  const [mainsSeconds, setMainsSeconds] = useState(66 * 60 + 56);
  const [mainsUploadedFiles, setMainsUploadedFiles] = useState<File[]>([]);
  const [showMainsEvaluation, setShowMainsEvaluation] = useState(false);
  const [evaluationStep, setEvaluationStep] = useState(0);
  const [showMainsResults, setShowMainsResults] = useState(false);
  const mainsFileRef = useRef<HTMLInputElement>(null);
  const TOTAL_MAINS_Q = 2;

  const mainsQuestions = [
    {
      text: [
        'Examine the role of ',
        'socio-religious reform movements',
        ' of the 19th century in laying the foundation of Indian nationalism.',
      ],
      boldIdx: [1],
      hint: 'Discuss key reformers, their social impact and how reform created a modern consciousness.',
      marks: 15,
      time: 7,
    },
    {
      text: [
        'Critically examine the role of ',
        'civil society organisations',
        ' in Indian policy-making and the challenges of ensuring their accountability.',
      ],
      boldIdx: [1],
      hint: 'Discuss examples from governance, RTI, environment and social welfare sectors.',
      marks: 15,
      time: 7,
    },
  ];

  useEffect(() => {
    if (!showMainsModal) return;
    const interval = setInterval(() => {
      setMainsSeconds(s => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [showMainsModal]);

  useEffect(() => {
    if (!showMainsEvaluation) return;
    setEvaluationStep(0);
    const interval = setInterval(() => {
      setEvaluationStep(prev => {
        if (prev >= evaluationSteps.length - 1) return prev;
        return prev + 1;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [showMainsEvaluation]);

  useEffect(() => {
    if (!showMainsEvaluation || evaluationStep < evaluationSteps.length - 1) return;
    const t = setTimeout(() => {
      setShowMainsEvaluation(false);
      setShowMainsResults(true);
    }, 800);
    return () => clearTimeout(t);
  }, [showMainsEvaluation, evaluationStep]);

  const formatMainsTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const openMainsModal = () => {
    setShowMainsModal(true);
    setMainsCurrentQ(1);
    setMainsAllRead(false);
    setMainsSeconds(66 * 60 + 56);
    setMainsUploadedFiles([]);
    setShowMainsEvaluation(false);
    setShowMainsResults(false);
  };

  const closeMainsModal = () => {
    setShowMainsModal(false);
    setShowMainsEvaluation(false);
    setShowMainsResults(false);
  };

  const handleMainsNext = () => {
    if (mainsCurrentQ < TOTAL_MAINS_Q) {
      setMainsCurrentQ(q => q + 1);
    } else {
      setMainsAllRead(true);
    }
  };

  /* Derive display labels for summary */
  const sourceLabel = questionSources.find(s => s.id === selectedSource)?.label ?? 'Daily MCQ';
  const paperLabel = selectedExamMode === 'mains'
    ? (mainsPaperTypes.find(p => p.id === selectedPaperType)?.label ?? 'GS I')
    : (prelimsPaperTypes.find(p => p.id === selectedPaperType)?.label ?? 'GS Paper I');
  const subjectLabel = subjects.find(s => s.id === selectedSubject)?.label ?? 'All Topics';
  const difficultyLabel = difficulties.find(d => d.id === selectedDifficulty)?.label ?? 'Medium';

  /* ─── Card style helper ─── */
  const cardStyle: React.CSSProperties = {
    background: '#FFF',
    border: '0.8px solid #E5E7EB',
    borderRadius: '16px',
    padding: 'clamp(20px, 1.8vw, 32px)',
    marginBottom: 'clamp(16px, 1.4vw, 24px)',
  };

  return (
    <div className="flex overflow-hidden" style={{ background: '#D8DEE6', height: 'calc(100vh - clamp(90px, 5.78vw, 111px))' }}>
      {/* Main scrollable content */}
      <main className="flex-1 overflow-y-auto" style={{ background: '#F9FAFB' }}>

        {/* ── Hero Area (Full Width) ── */}
        <div style={{ textAlign: 'center', padding: 'clamp(28px, 3vw, 48px) clamp(16px, 1.5vw, 24px) clamp(16px, 1.4vw, 24px)', maxWidth: '1320px', margin: '0 auto' }}>

            {/* Badge pill */}
            <div style={{
              display: 'inline-block',
              background: '#0F172B',
              color: '#FFFFFF',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: '12px',
              lineHeight: '16px',
              letterSpacing: '0px',
              padding: '4px 14px',
              borderRadius: '999px',
              marginBottom: '20px',
              border: '1px solid #0F172B',
              boxShadow: '0px 1px 3px 0px #0000001A',
            }}>
              📊 India&apos;s #1 UPSC Mock Test Platform
            </div>

            {/* Heading */}
            <h1 style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '48px',
              lineHeight: '48px',
              letterSpacing: '0px',
              color: '#101828',
              marginBottom: '16px',
            }}>
              Build Your{' '}
              <span style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontStyle: 'italic', fontSize: '48px', lineHeight: '48px', color: '#C68A0B' }}>Perfect</span>{' '}
              Mock Test
            </h1>

            {/* Subtitle */}
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              fontSize: '16px',
              lineHeight: '24px',
              letterSpacing: '0px',
              color: '#4A5565',
              marginBottom: '0px',
            }}>
              Adaptive questions · Real exam environment · Detailed analytics.
            </p>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              fontSize: '16px',
              lineHeight: '24px',
              letterSpacing: '0px',
              color: '#4A5565',
              marginBottom: '28px',
            }}>
              Everything free. Add as much it.
            </p>

            {/* Stats Container */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              border: '0.8px solid #E5E7EB',
              boxShadow: '0px 1px 3px 0px #0000001A, 0px 1px 2px -1px #0000001A',
              padding: '24px 32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              maxWidth: '614px',
              margin: '0 auto',
            }}>
              {[
                { value: '4800+', label: 'Questions', color: '#101828' },
                { value: '2.1L+', label: 'Tests Taken', color: '#101828' },
                { value: '94K+', label: 'Community', color: '#101828' },
                { value: '\u221E', label: 'Always Growing', color: '#DBAC49' },
              ].map((stat, idx, arr) => (
                <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontFamily: 'Arimo, sans-serif',
                      fontWeight: 700,
                      fontSize: '36px',
                      lineHeight: '40px',
                      letterSpacing: '0px',
                      color: stat.color,
                      fontVariantEmoji: 'text' as React.CSSProperties['fontVariantEmoji'],
                    }}>
                      {stat.value.includes('+')
                        ? <>{stat.value.replace('+', '')}<span style={{ color: '#DBAC49' }}>+</span></>
                        : stat.value}
                    </div>
                    <div style={{
                      fontFamily: 'Arimo, sans-serif',
                      fontWeight: 400,
                      fontSize: '14px',
                      lineHeight: '20px',
                      letterSpacing: '0px',
                      color: '#6A7282',
                      textAlign: 'center',
                    }}>
                      {stat.label}
                    </div>
                  </div>
                  {idx < arr.length - 1 && (
                    <div style={{ width: '1px', height: '40px', background: '#E5E7EB', margin: '0 24px' }} />
                  )}
                </div>
              ))}
            </div>

            {/* Prelims / Mains Toggle */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: '26843500px',
              padding: '8px',
              gap: '0px',
              background: '#FFFFFF',
              border: '0.8px solid #E5E7EB',
              boxShadow: '0px 1px 3px 0px #0000001A, 0px 1px 2px -1px #0000001A',
              marginTop: '28px',
            }}>
              <button
                onClick={() => setSelectedExamMode('prelims')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  paddingLeft: '32px',
                  paddingRight: '32px',
                  height: '64px',
                  borderRadius: '26843500px',
                  border: 'none',
                  cursor: 'pointer',
                  background: selectedExamMode === 'prelims' ? '#0F172B' : 'transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                <img src="/9k.png" alt="Prelims" style={{ width: '24px', height: '24px', objectFit: 'contain', flexShrink: 0 }} />
                <span style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 700,
                  fontSize: '18px',
                  lineHeight: '28px',
                  color: selectedExamMode === 'prelims' ? '#FFFFFF' : '#4A5565',
                }}>Prelims</span>
              </button>
              <button
                onClick={() => { setSelectedExamMode('mains'); openMainsModal(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  paddingLeft: '32px',
                  paddingRight: '32px',
                  height: '64px',
                  borderRadius: '26843500px',
                  border: 'none',
                  cursor: 'pointer',
                  background: selectedExamMode === 'mains' ? '#0F172B' : 'transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                <img src="/8k.png" alt="Mains" style={{ width: '24px', height: '24px', objectFit: 'contain', flexShrink: 0 }} />
                <span style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 700,
                  fontSize: '18px',
                  lineHeight: '28px',
                  color: selectedExamMode === 'mains' ? '#FFFFFF' : '#4A5565',
                }}>Mains</span>
              </button>
            </div>

          </div>

        {/* ── Two Column Layout: Steps + Test Summary ── */}
        <div style={{ display: 'flex', gap: 'clamp(16px, 1.4vw, 24px)', padding: '0 clamp(16px, 1.5vw, 24px) clamp(20px, 2vw, 36px)', maxWidth: '1320px', margin: '0 auto' }}>

        {/* ── Left Column: Steps ── */}
        <div style={{ flex: '1 1 0', minWidth: 0 }}>

          {/* ── Step 1: Exam Mode ── */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '24px',
            padding: '32px',
            marginBottom: 'clamp(16px, 1.4vw, 24px)',
          }}>
            {/* Step Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '26843500px',
                background: '#0F172B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 700,
                  fontSize: '14px',
                  lineHeight: '20px',
                  color: '#FFFFFF',
                }}>1</span>
              </div>
              <span style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: '14px',
                lineHeight: '20px',
                letterSpacing: '0.35px',
                textTransform: 'uppercase' as const,
                color: '#101828',
              }}>
                Exam Mode
              </span>
            </div>

            {/* Subtitle */}
            <div style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: '20px',
              color: '#4A5565',
              marginBottom: '20px',
            }}>
              Select paper type
            </div>

            {/* Paper Type Cards */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {(selectedExamMode === 'mains' ? mainsPaperTypes : prelimsPaperTypes).map(paper => {
                const isSelected = selectedPaperType === paper.id;
                return (
                  <button
                    key={paper.id}
                    onClick={() => setSelectedPaperType(paper.id)}
                    style={{
                      flex: '1 1 0',
                      minWidth: '280px',
                      height: '179px',
                      background: isSelected ? '#EFF6FF' : '#F9FAFB',
                      border: isSelected ? '1.6px solid #BEDBFF' : '1.6px solid #E5E7EB',
                      borderRadius: '16px',
                      padding: '20px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      position: 'relative',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column' as const,
                    }}
                  >
                    <div style={{ marginBottom: '12px' }}>
                      <img src={paper.icon} alt={paper.label} style={{ width: '36px', height: '40px', objectFit: 'contain' }} />
                    </div>
                    {'isDefault' in paper && paper.isDefault && (
                      <span style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: '#FDC700',
                        color: '#101828',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 700,
                        fontSize: '12px',
                        lineHeight: '16px',
                        padding: '4px 12px',
                        borderRadius: '26843500px',
                      }}>
                        DEFAULT
                      </span>
                    )}
                    <div style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 700,
                      fontSize: '18px',
                      lineHeight: '28px',
                      color: '#101828',
                      marginBottom: '4px',
                    }}>
                      {paper.label}
                    </div>
                    <div style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 400,
                      fontSize: '14px',
                      lineHeight: '20px',
                      color: '#4A5565',
                    }}>
                      {paper.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

            {/* Focus on a Specific Topic */}
            <div style={{
              background: '#F0EFFF',
              borderRadius: '16px',
              padding: '24px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
              }}>
                <span style={{ fontSize: '18px', lineHeight: '28px' }}>📌</span>
                <span style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 700,
                  fontSize: '14px',
                  lineHeight: '20px',
                  letterSpacing: '0.7px',
                  textTransform: 'uppercase' as const,
                  color: '#312C85',
                }}>
                  Focus on a Specific Topic (Optional)
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {subjects.map(subj => {
                  const isSelected = selectedSubject === subj.id;
                  return (
                    <button
                      key={subj.id}
                      onClick={() => setSelectedSubject(subj.id)}
                      style={{
                        background: isSelected ? '#312C85' : '#FFFFFF',
                        color: isSelected ? '#FFFFFF' : '#101828',
                        border: 'none',
                        borderRadius: '999px',
                        padding: '8px 16px',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500,
                        fontSize: '14px',
                        lineHeight: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>{subj.emoji}</span>
                      {subj.label}
                      {subj.count !== null && (
                        <span style={{
                          fontWeight: 500,
                          fontSize: '14px',
                          color: isSelected ? 'rgba(255,255,255,0.7)' : '#101828',
                        }}>{subj.count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mains: Optional Subject */}
            {selectedExamMode === 'mains' && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 700,
                  fontSize: '14px',
                  color: '#17223E',
                  marginBottom: '12px',
                }}>
                  Optional Subject
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {optionalSubjects.map(opt => {
                    const isSelected = selectedOptional === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => setSelectedOptional(isSelected ? null : opt)}
                        style={{
                          background: isSelected ? '#17223E' : '#FFF',
                          color: isSelected ? '#FFF' : '#374151',
                          border: isSelected ? '1.5px solid #17223E' : '1.5px solid #E5E7EB',
                          borderRadius: '999px',
                          padding: '6px 16px',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 600,
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          {/* ── Step 2: Question Source ── */}
          <div style={cardStyle}>
                <StepHeader step={2} label="Question Source" />
                <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 'clamp(8px, 0.6vw, 12px)', overflowX: 'auto' }}>
              {questionSources.map(src => {
                const isSelected = selectedSource === src.id;
                return (
                  <button
                    key={src.id}
                    onClick={() => setSelectedSource(src.id)}
                    style={{
                      flex: '1 1 0',
                      minWidth: '120px',
                      background: isSelected ? '#EFF6FF' : '#FFF',
                      border: isSelected ? '2px solid #155DFC' : '1.5px solid #E5E7EB',
                      borderRadius: '14px',
                      padding: 'clamp(14px, 1.1vw, 20px)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      position: 'relative',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {src.pro && (
                      <span style={{
                        position: 'absolute',
                        top: 'clamp(8px, 0.6vw, 12px)',
                        right: 'clamp(8px, 0.6vw, 12px)',
                        background: '#FDC700',
                        color: '#17223E',
                        fontFamily: 'var(--font-inter), Inter, sans-serif',
                        fontWeight: 800,
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '999px',
                      }}>
                        PRO
                      </span>
                    )}
                    <div style={{ marginBottom: '6px' }}>
                      <img src={src.icon} alt={src.label} style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
                    </div>
                    <div style={{ fontFamily: 'var(--font-inter), Inter, sans-serif', fontWeight: 700, fontSize: 'clamp(13px, 0.85vw, 15px)', color: '#101828', marginBottom: '4px' }}>
                      {src.label}
                    </div>
                    <div style={{ fontFamily: 'var(--font-inter), Inter, sans-serif', fontSize: 'clamp(11px, 0.72vw, 13px)', color: '#6B7280', lineHeight: 1.4 }}>
                      {src.description}
                    </div>
                  </button>
                  );
                })}
                </div>
              </div>

              {/* ── Step 3: Number of Questions ── */}
              <div style={cardStyle}>
                <StepHeader step={3} label="Number of Questions" />

                {/* Counter Section */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <button
                  onClick={() => setQuestionCount(c => Math.max(1, c - 1))}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '26843500px',
                    border: 'none',
                    background: '#F3F4F6',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: '24px',
                    lineHeight: '32px',
                    color: '#364153',
                    transition: 'all 0.15s ease',
                  }}
                >
                  −
                </button>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: '48px',
                    lineHeight: '48px',
                    color: '#101828',
                  }}>
                    {questionCount}
                  </div>
                  <div style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '20px',
                    color: '#6A7282',
                    marginTop: '4px',
                  }}>
                    questions
                  </div>
                  <div style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: '12px',
                    lineHeight: '16px',
                    color: '#99A1AF',
                  }}>
                    ~{Math.ceil(questionCount * 2)} min · Free tier
                  </div>
                </div>
                <button
                  onClick={() => setQuestionCount(c => Math.min(100, c + 1))}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '26843500px',
                    border: 'none',
                    background: '#F3F4F6',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: '24px',
                    lineHeight: '32px',
                    color: '#364153',
                    transition: 'all 0.15s ease',
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Range Slider */}
            <div style={{ padding: '10px 32px', marginBottom: '24px' }}>
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '26843500px',
                    background: `linear-gradient(90deg, #0F172A 0%, #0F172A ${questionCount}%, #E5E7EB ${questionCount}%, #E5E7EB 100%)`,
                    appearance: 'none',
                    cursor: 'pointer',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {[1, 25, 50, 75, 100].map(val => (
                  <span
                    key={val}
                    onClick={() => setQuestionCount(val)}
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 400,
                      fontSize: '12px',
                      lineHeight: '16px',
                      color: '#99A1AF',
                      cursor: 'pointer',
                    }}
                  >
                    {val}
                  </span>
                ))}
              </div>
            </div>

            {/* Preset Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
              {[
                { value: 5, label: 'Quick 5', icon: '/90.png', active: true },
                { value: 10, label: 'Standard 10', icon: '/text7.png', active: false },
                { value: 25, label: '25 Q', icon: '/text8.png', active: false },
                { value: 50, label: '50 Q', icon: '/text8.png', active: false },
                { value: 75, label: '75 Q', icon: '/text8.png', active: false },
              ].map(preset => {
                const isActive = questionCount === preset.value;
                return (
                  <button
                    key={preset.value}
                    onClick={() => setQuestionCount(preset.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      paddingLeft: '20px',
                      paddingRight: '20px',
                      height: '40px',
                      borderRadius: '26843500px',
                      border: isActive ? 'none' : '1px solid #E5E7EB',
                      background: isActive ? '#0F172B' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <img src={preset.icon} alt="" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                    <span style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 600,
                      fontSize: '14px',
                      lineHeight: '20px',
                      color: isActive ? '#FFFFFF' : '#364153',
                    }}>
                      {preset.label}
                    </span>
                  </button>
                );
              })}
              <button
                onClick={() => setQuestionCount(100)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  paddingLeft: '20px',
                  paddingRight: '20px',
                  height: '40px',
                  borderRadius: '26843500px',
                  border: questionCount === 100 ? 'none' : '1px solid #E5E7EB',
                  background: questionCount === 100 ? '#0F172B' : '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <img src="/text8.png" alt="" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                <span style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '14px',
                  lineHeight: '20px',
                  color: questionCount === 100 ? '#FFFFFF' : '#364153',
                }}>
                  Full 100
                </span>
              </button>
            </div>

            {/* Guideline Banner */}
            <div style={{
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '12px',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
                  <path d="M9 1.5L1.5 15H16.5L9 1.5Z" stroke="#D97706" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M9 7V10" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="9" cy="12.5" r="0.75" fill="#D97706"/>
                </svg>
                <p style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  color: '#92400E',
                  lineHeight: '20px',
                  margin: 0,
                }}>
                  <strong>Guideline:</strong> You&apos;re setting <strong>{questionCount} questions</strong>. Free users have <strong>10 questions daily</strong>. This generates from <strong>PYQ, questions bank</strong>.
                </p>
              </div>
              <button style={{
                background: '#FDC700',
                color: '#101828',
                border: 'none',
                borderRadius: '999px',
                padding: '8px 20px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                }}>
                  Unlock
                </button>
              </div>
              </div>

              {/* ── Step 4: Difficulty ── */}
              <div style={cardStyle}>
                <StepHeader step={4} label="Difficulty" />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(10px, 0.8vw, 14px)' }}>
              {difficulties.map(diff => {
                const isSelected = selectedDifficulty === diff.id;
                return (
                  <button
                    key={diff.id}
                    onClick={() => setSelectedDifficulty(diff.id)}
                    style={{
                      flex: '1 1 clamp(120px, 12vw, 160px)',
                      background: isSelected ? '#FEF3C7' : '#FFF',
                      border: isSelected ? '2px solid #FDC700' : '1.5px solid #E5E7EB',
                      borderRadius: '14px',
                      padding: 'clamp(14px, 1.1vw, 20px)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontSize: 'clamp(22px, 1.6vw, 30px)', marginBottom: '6px' }}>{diff.emoji}</div>
                    <div style={{ fontFamily: 'var(--font-inter), Inter, sans-serif', fontWeight: 700, fontSize: 'clamp(13px, 0.85vw, 15px)', color: '#101828', marginBottom: '2px' }}>
                      {diff.label}
                    </div>
                    <div style={{ fontFamily: 'var(--font-inter), Inter, sans-serif', fontSize: 'clamp(11px, 0.7vw, 12px)', color: '#6B7280' }}>
                      {diff.description}
                  </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* ── Right Column: Sticky Test Summary ── */}
        <div className="hidden xl:block" style={{ width: 'clamp(280px, 20vw, 340px)', flexShrink: 0 }}>
            <div style={{ position: 'sticky', top: '80px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #162456 0%, #0F172B 50%, #030712 100%)',
                borderRadius: '20px',
                padding: 'clamp(20px, 1.6vw, 28px)',
                color: '#FFF',
              }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'clamp(16px, 1.3vw, 24px)' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FDC700' }} />
                <span style={{
                  fontFamily: 'var(--font-inter), Inter, sans-serif',
                  fontWeight: 800,
                  fontSize: 'clamp(11px, 0.75vw, 13px)',
                  letterSpacing: '0.08em',
                  color: '#FDC700',
                  textTransform: 'uppercase' as const,
                }}>
                  Test Summary — Ready to Begin?
                </span>
              </div>

              {/* 2×3 Info Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'clamp(10px, 0.8vw, 14px)',
                marginBottom: 'clamp(18px, 1.4vw, 26px)',
              }}>
                {[
                  { emoji: '📋', value: `${questionCount}`, label: 'Questions' },
                  { emoji: '⏱', value: `${estimatedMinutes} min`, label: 'Duration' },
                  { emoji: '📚', value: sourceLabel, label: 'Source' },
                  { emoji: '🌍', value: paperLabel, label: 'Paper' },
                  { emoji: '⚡', value: difficultyLabel, label: 'Difficulty' },
                  { emoji: '🌐', value: subjectLabel, label: 'Subjects' },
                ].map((item, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: '10px',
                    padding: 'clamp(10px, 0.8vw, 14px)',
                  }}>
                    <div style={{ fontSize: 'clamp(14px, 1vw, 18px)', marginBottom: '4px' }}>{item.emoji}</div>
                    <div style={{
                      fontFamily: 'var(--font-inter), Inter, sans-serif',
                      fontWeight: 700,
                      fontSize: 'clamp(13px, 0.85vw, 15px)',
                      color: '#FFF',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {item.value}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-inter), Inter, sans-serif',
                      fontWeight: 600,
                      fontSize: 'clamp(10px, 0.65vw, 11px)',
                      letterSpacing: '0.06em',
                      color: '#94A3B8',
                      textTransform: 'uppercase' as const,
                    }}>
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Performance Benchmark */}
              <div style={{ marginBottom: 'clamp(18px, 1.4vw, 26px)' }}>
                <div style={{
                  fontFamily: 'var(--font-inter), Inter, sans-serif',
                  fontWeight: 700,
                  fontSize: 'clamp(11px, 0.72vw, 13px)',
                  letterSpacing: '0.06em',
                  color: '#94A3B8',
                  textTransform: 'uppercase' as const,
                  marginBottom: 'clamp(10px, 0.8vw, 14px)',
                }}>
                  Performance Benchmark
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 0.8vw, 14px)' }}>
                  {benchmarks.map((b, i) => (
                    <div key={i}>
                      <div style={{
                        fontFamily: 'var(--font-inter), Inter, sans-serif',
                        fontSize: 'clamp(11px, 0.72vw, 13px)',
                        color: '#CBD5E1',
                        marginBottom: '5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}>
                        <span>{b.emoji}</span> {b.label}
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
                        <div style={{ background: b.color, width: b.width, height: '100%', borderRadius: '6px', transition: 'width 0.3s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generate Test Button */}
              <button
                onClick={() => router.push('/dashboard/mock-tests/attempt')}
                style={{
                width: '100%',
                background: 'linear-gradient(90deg, #FDC700, #FF8904, #FF6900)',
                border: 'none',
                borderRadius: '14px',
                padding: 'clamp(12px, 1vw, 16px)',
                fontFamily: 'var(--font-inter), Inter, sans-serif',
                fontWeight: 800,
                fontSize: 'clamp(14px, 0.95vw, 17px)',
                color: '#FFF',
                cursor: 'pointer',
                letterSpacing: '0.02em',
                marginBottom: 'clamp(14px, 1.1vw, 20px)',
              }}>
                🚀 Generate Test
              </button>

              {/* Bottom info */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontFamily: 'var(--font-inter), Inter, sans-serif',
                fontSize: 'clamp(10px, 0.68vw, 12px)',
                color: '#64748B',
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16A34A' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3B82F6' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FDC700' }} />
                <span style={{ marginLeft: '4px' }}>247 students are taking tests right now</span>
              </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* ─── Mains Practice Modal ─── */}
      {showMainsModal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
          style={{ background: 'rgba(15,23,42,0.72)', paddingTop: '40px', paddingBottom: '40px' }}
          onClick={closeMainsModal}
        >
          <div
            style={{ width: '960px', maxWidth: 'calc(100vw - 32px)', display: 'flex', flexDirection: 'column', gap: '24px' }}
            onClick={e => e.stopPropagation()}
          >
            {!showMainsEvaluation && (
              <>
            {/* ── CARD 1: Question Reader ── */}
            <div style={{
              borderRadius: '32px',
              background: '#FFFFFF',
              boxShadow: '0px 4px 6px -4px #0000001A, 0px 10px 15px -3px #0000001A',
              overflow: 'hidden',
            }}>
              {/* Header */}
              {!mainsAllRead ? (
                <div style={{
                  height: '56px',
                  background: '#0F172B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingLeft: '32px',
                  paddingRight: '32px',
                }}>
                  {/* Left: brand */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px', lineHeight: 1 }}>✨</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '16px', lineHeight: '24px', color: '#FDC700' }}>
                      Mains Practice
                    </span>
                  </div>
                  {/* Right: counter + timer */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#99A1AF' }}>
                      Q {mainsCurrentQ} of {TOTAL_MAINS_Q}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="8" cy="8" r="6.5" stroke="#99A1AF" strokeWidth="1.3"/>
                        <path d="M8 5v3.2l2.1 2.1" stroke="#99A1AF" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', lineHeight: '20px', color: '#FFFFFF' }}>
                        {formatMainsTime(mainsSeconds)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Header after all read */
                <div style={{
                  height: '68px',
                  background: '#0F172B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingLeft: '32px',
                  paddingRight: '32px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px', lineHeight: 1 }}>✨</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '16px', lineHeight: '24px', color: '#FDC700' }}>
                      Mains Practice
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#99A1AF' }}>
                      Upload your answers
                    </span>
                    <button
                      onClick={closeMainsModal}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        paddingLeft: '24px',
                        paddingRight: '16px',
                        height: '36px',
                        borderRadius: '26843500px',
                        background: '#FFFFFF',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 8.5L6.5 12L13 5" stroke="#0F172B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', lineHeight: '20px', color: '#0F172B', paddingRight: '8px' }}>
                        Done
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Body */}
              {!mainsAllRead ? (
                <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Question meta row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{
                      background: '#1E293B',
                      borderRadius: '999px',
                      padding: '4px 14px',
                    }}>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', lineHeight: '16px', color: '#FFFFFF', letterSpacing: '0px' }}>
                        QUESTION {mainsCurrentQ} OF {TOTAL_MAINS_Q}
                      </span>
                    </div>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', lineHeight: '20px', color: '#6A7282' }}>
                      {mainsQuestions[mainsCurrentQ - 1].marks} marks · {mainsQuestions[mainsCurrentQ - 1].time} min
                    </span>
                  </div>

                  {/* Question text */}
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '18px', lineHeight: '29.25px', color: '#101828', margin: 0 }}>
                    {mainsQuestions[mainsCurrentQ - 1].text.map((part, i) =>
                      mainsQuestions[mainsCurrentQ - 1].boldIdx.includes(i)
                        ? <strong key={i} style={{ fontWeight: 700 }}>{part}</strong>
                        : <span key={i}>{part}</span>
                    )}
                  </p>

                  {/* Hint box */}
                  <div style={{
                    borderTopRightRadius: '14px',
                    borderBottomRightRadius: '14px',
                    borderLeft: '4px solid #FDC700',
                    background: '#FFFBEB',
                    padding: '16px 16px 16px 20px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                  }}>
                    <span style={{ fontSize: '16px', flexShrink: 0, lineHeight: 1.4 }}>💡</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontStyle: 'italic', fontSize: '14px', lineHeight: '20px', color: '#364153' }}>
                      {mainsQuestions[mainsCurrentQ - 1].hint}
                    </span>
                  </div>

                  {/* Next / Finish button */}
                  <button
                    onClick={handleMainsNext}
                    style={{
                      width: '186.86px',
                      height: '48px',
                      borderRadius: '14px',
                      background: '#0F172B',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 600,
                      fontSize: '16px',
                      lineHeight: '24px',
                      color: '#FFFFFF',
                      textAlign: 'center',
                    }}
                  >
                    {mainsCurrentQ < TOTAL_MAINS_Q ? 'Next Question →' : 'Finish Reading →'}
                  </button>
                </div>
              ) : (
                /* All read body */
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '48px 40px 52px',
                  gap: '12px',
                }}>
                  <span style={{ fontSize: '52px', lineHeight: 1 }}>✍️</span>
                  <h3 style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: '24px',
                    lineHeight: '32px',
                    color: '#101828',
                    margin: '8px 0 0',
                  }}>
                    All {TOTAL_MAINS_Q} questions read!
                  </h3>
                  <p style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: '16px',
                    lineHeight: '24px',
                    color: '#6A7282',
                    textAlign: 'center',
                    maxWidth: '480px',
                    margin: '4px 0 0',
                  }}>
                    Now write your answers on paper. Take your time — there&apos;s no rush.<br />
                    Once done, photograph your answer sheets and upload below for AI evaluation.
                  </p>
                </div>
              )}
            </div>

            {/* ── CARD 2: Upload Handwritten Answers (visible after all read) ── */}
            {mainsAllRead && (
              <div style={{
                borderRadius: '32px',
                background: '#FFFFFF',
                boxShadow: '0px 4px 6px -4px #0000001A, 0px 10px 15px -3px #0000001A',
                padding: '40px',
              }}>
                {/* Upload heading */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '9999px',
                    background: '#D08700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: '16px', lineHeight: 1 }}>📝</span>
                  </div>
                  <span style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: '14px',
                    lineHeight: '20px',
                    letterSpacing: '0.7px',
                    textTransform: 'uppercase',
                    color: '#364153',
                  }}>
                    Upload Your Handwritten Answers
                  </span>
                </div>

                {/* Description */}
                <p style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: '16px',
                  lineHeight: '24px',
                  color: '#6A7282',
                  marginBottom: '32px',
                  maxWidth: '837px',
                }}>
                  You&apos;ve read all the questions. Now write your answers on paper, photograph/scan the{' '}
                  <strong style={{ fontWeight: 700, color: '#101828' }}>sheets</strong> and upload below. AI will{' '}
                  <span style={{ fontWeight: 700, color: '#432DD7' }}>evaluate</span> each answer with detailed markup.
                </p>

                {/* Upload dropzone */}
                <div
                  onClick={() => mainsFileRef.current?.click()}
                  style={{
                    borderRadius: '16px',
                    border: '1.6px solid #D1D5DC',
                    background: '#F9FAFB',
                    height: '247.2px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    marginBottom: '24px',
                    gap: '8px',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  <input
                    ref={mainsFileRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    multiple
                    style={{ display: 'none' }}
                    onChange={e => { if (e.target.files) setMainsUploadedFiles(Array.from(e.target.files)); }}
                  />
                  <span style={{ fontSize: '48px', lineHeight: 1 }}>📄</span>
                  <span style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    fontSize: '16px',
                    lineHeight: '24px',
                    color: '#101828',
                    textAlign: 'center',
                  }}>
                    {mainsUploadedFiles.length > 0
                      ? `${mainsUploadedFiles.length} file(s) selected`
                      : 'Click to upload answer sheet(s)'}
                  </span>
                  <span style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '20px',
                    color: '#6A7282',
                    textAlign: 'center',
                  }}>
                    JPG, PNG or PDF · Multiple pages supported
                  </span>
                </div>

                {/* Submit button */}
                <button
                  onClick={() => setShowMainsEvaluation(true)}
                  style={{
                    width: '100%',
                    height: '60px',
                    borderRadius: '16px',
                    background: '#45556C',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                  }}
                >
                  <span style={{ fontSize: '22px', lineHeight: 1 }}>🤖</span>
                  <span style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: '18px',
                    lineHeight: '28px',
                    color: '#FFFFFF',
                    textAlign: 'center',
                  }}>
                    Submit for AI Evaluation
                  </span>
                </button>

                {/* Helper text */}
                <p style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: '12px',
                  lineHeight: '16px',
                  color: '#6A7282',
                  textAlign: 'center',
                  margin: 0,
                }}>
                  AI will analyze your answers in <strong style={{ fontWeight: 700 }}>~30 seconds</strong>. Detailed markup provided.
                </p>
              </div>
            )}

            </>
            )}

            {showMainsEvaluation && (
              <div
                style={{
                  width: '960px',
                  maxWidth: '100%',
                  height: '472px',
                  borderRadius: '32px',
                  background: 'linear-gradient(135deg, #1D293D 0%, #0F172B 50%, #162456 100%)',
                  boxShadow: '0px 8px 10px -6px #0000001A, 0px 20px 25px -5px #0000001A',
                  padding: '40px 48px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: '24px',
                }}
              >
                <div style={{ width: '864px', maxWidth: '100%', textAlign: 'center' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{ fontSize: '40px', lineHeight: 1 }}>🧠</span>
                  </div>
                  <h2
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 700,
                      fontSize: '30px',
                      lineHeight: '36px',
                      letterSpacing: '0px',
                      color: '#FFFFFF',
                      margin: 0,
                    }}
                  >
                    AI is evaluating your answers...
                  </h2>
                  <p
                    style={{
                      marginTop: '8px',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 400,
                      fontSize: '16px',
                      lineHeight: '24px',
                      letterSpacing: '0px',
                      color: '#BEDBFF',
                    }}
                  >
                    This usually takes about 30 seconds
                  </p>
                </div>

                {/* Progress bar */}
                <div style={{ width: '448px', maxWidth: '100%', marginTop: '16px' }}>
                  <div
                    style={{
                      width: '100%',
                      height: '8px',
                      borderRadius: '26843500px',
                      background: '#314158',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${((evaluationStep + 1) / evaluationSteps.length) * 100}%`,
                        height: '100%',
                        borderRadius: '26843500px',
                        background: 'linear-gradient(90deg, #FDC700 0%, #FF6900 100%)',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>

                {/* Steps list */}
                <div
                  style={{
                    width: '448px',
                    maxWidth: '100%',
                    marginTop: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {evaluationSteps.map((stepLabel, index) => {
                    const isActive = index === evaluationStep;
                    return (
                      <div
                        key={stepLabel}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          opacity: isActive ? 1 : 0.85,
                        }}
                      >
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '26843500px',
                            border: `2px solid ${isActive ? '#FDC700' : '#4B5563'}`,
                            background: isActive ? '#FDC700' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {isActive && (
                            <span
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '999px',
                                background: '#0F172B',
                              }}
                            />
                          )}
                        </div>
                        <span
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: isActive ? 500 : 400,
                            fontSize: '14px',
                            lineHeight: '20px',
                            letterSpacing: '0px',
                            color: isActive ? '#FDC700' : '#6A7282',
                          }}
                        >
                          {stepLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── AI Evaluation Results ─── */}
            {showMainsResults && (
              <div style={{ width: '960px', maxWidth: 'calc(100vw - 32px)', display: 'flex', flexDirection: 'column', gap: 0 }}>
                {/* Results header */}
                <div
                  style={{
                    width: '100%',
                    minHeight: '160px',
                    padding: '32px 40px 32px 40px',
                    background: 'linear-gradient(135deg, #1D293D 0%, #0F172B 50%, #162456 100%)',
                    borderRadius: '32px 32px 0 0',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '24px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '16px', lineHeight: 1 }}>🤖</span>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', lineHeight: '16px', letterSpacing: '0px', color: '#FDC700', textTransform: 'uppercase' }}>
                        AI EVALUATION COMPLETE
                      </span>
                    </div>
                    <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '30px', lineHeight: '36px', letterSpacing: '0px', color: '#FFFFFF', margin: '0 0 8px' }}>
                      Good attempt across 2 questions
                    </h2>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', letterSpacing: '0px', color: '#BEDBFF', margin: 0 }}>
                      Mains · GS Paper I · 2 Questions evaluated
                    </p>
                  </div>
                  <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '30px', lineHeight: '36px', color: '#FFFFFF' }}>64%</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: '#99A1AF', textTransform: 'uppercase' }}>Marks</span>
                  </div>
                </div>

                {/* Results content card */}
                <div style={{ padding: '40px', background: '#FFFFFF', borderRadius: '0 0 32px 32px', boxShadow: '0px 4px 6px -4px #0000001A, 0px 10px 15px -3px #0000001A' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '880px',
                        borderRadius: '16px',
                        background: '#EFF6FF',
                        padding: '24px',
                      }}
                    >
                      <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', lineHeight: '16px', letterSpacing: '0.6px', textTransform: 'uppercase', color: '#312C85', marginBottom: '12px' }}>
                        Question 1
                      </div>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '16px', lineHeight: '24px', color: '#101828', margin: '0 0 16px' }}>
                        Examine the role of socio-religious reform movements of the 19th century in laying the foundation of Indian nationalism.
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '48px', lineHeight: '48px', color: '#312C85' }}>B+</span>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#4A5565' }}>9/15</span>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1', minWidth: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '20px', lineHeight: 1 }}>✓</span>
                          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', lineHeight: '16px', color: '#101828', textAlign: 'center' }}>What went right</span>
                        </div>
                        <div style={{ flex: '1', minWidth: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '20px', lineHeight: 1 }}>↑</span>
                          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', lineHeight: '16px', color: '#101828', textAlign: 'center' }}>Needs improvement</span>
                        </div>
                        <div style={{ flex: '1', minWidth: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '20px', lineHeight: 1 }}>✗</span>
                          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', lineHeight: '16px', color: '#101828', textAlign: 'center' }}>Key misses</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <span style={{ color: '#16A34A', fontSize: '16px', flexShrink: 0, lineHeight: '24px' }}>✓</span>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '16px', lineHeight: '24px', color: '#16A34A', margin: 0 }}>
                            <strong style={{ fontWeight: 600 }}>Strengths:</strong>{' '}
                            <strong>Strong introduction with relevant context.</strong> Multidimensional analysis covering <strong>social, economic and political angles.</strong>
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <span style={{ color: '#2563EB', fontSize: '16px', flexShrink: 0, lineHeight: '24px' }}>ℹ</span>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '16px', lineHeight: '24px', color: '#2563EB', margin: 0 }}>
                            <strong style={{ fontWeight: 600 }}>Improve:</strong>{' '}
                            <strong>Conclusion could be more forward-looking</strong> — mention <strong>contemporary relevance.</strong>
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <span style={{ color: '#DC2626', fontSize: '16px', flexShrink: 0, lineHeight: '24px' }}>✗</span>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '16px', lineHeight: '24px', color: '#DC2626', margin: 0 }}>
                            <strong style={{ fontWeight: 600 }}>Missed:</strong>{' '}
                            <strong>Did not address the &quot;regional variation&quot; dimension.</strong> Could mention Bengal, Maharashtra separately.
                          </p>
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px', lineHeight: 1 }}>📊</span>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', lineHeight: '16px', letterSpacing: '0.6px', textTransform: 'uppercase', color: '#312C85' }}>
                          Jeet Sir&apos;s Overall Feedback
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <span style={{ fontSize: '14px', flexShrink: 0, lineHeight: '20px' }}>💡</span>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#101828', margin: 0 }}>
                            Your writing shows <strong style={{ fontWeight: 700 }}>conceptual clarity</strong> but needs more <strong style={{ fontWeight: 700 }}>structured formatting</strong> — use subheadings, bullet points where allowed.
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <span style={{ fontSize: '14px', flexShrink: 0, lineHeight: '20px' }}>📚</span>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#101828', margin: 0 }}>
                            Revise <strong style={{ fontWeight: 700 }}>recent government schemes</strong> and link them to answers — examiners reward contemporary examples.
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <span style={{ fontSize: '14px', flexShrink: 0, lineHeight: '20px' }}>🎯</span>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#101828', margin: 0 }}>
                            Word limit discipline is good. Focus on <strong style={{ fontWeight: 700 }}>dimensions analysis</strong> — social, economic, political, environmental angles strengthen answers significantly.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => { closeMainsModal(); router.push('/dashboard/mock-tests/next-steps'); }}
                        style={{
                          width: '100%',
                          height: '56px',
                          borderRadius: '16px',
                          background: '#0F172B',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 700,
                          fontSize: '16px',
                          lineHeight: '24px',
                          color: '#FFFFFF',
                        }}
                      >
                        <span style={{ fontSize: '18px', lineHeight: 1 }}>💬</span>
                        What would you like to do next? →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
