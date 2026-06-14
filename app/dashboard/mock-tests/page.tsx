'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { mockTestService, dashboardService, pricingService } from '@/lib/services';
import DashboardPageHero from '@/components/DashboardPageHero';
import { liveStudentCount } from '@/lib/liveCount';
import { UPSC_SUBJECTS } from '@/lib/upscSubjects';
import { handleEntitlementError, UsageMeter } from '@/components/entitlements';
import { useEntitlements } from '@/contexts/EntitlementsContext';

/* ─── Static Config (UI structure only, not data) ─── */

const prelimsPaperTypes = [
  { id: 'gs1', icon: '/2k.png', label: 'GS Paper I', description: 'General Studies – History, Geography, Polity, Economy, Science', isDefault: true },
  { id: 'csat', icon: '/3k.png', label: 'CSAT', description: 'Aptitude · Comprehension · Logical Reasoning' },
];

const fallbackQuestionSources = [
  { id: 'daily-mcq', icon: '/target-icon.png', label: 'Daily MCQ', description: 'Fresh from 10 curated daily picks' },
  { id: 'practice-pyq', icon: '/script.png', label: 'Practice PYQ', description: 'UPSC papers 2010 – 2024' },
  { id: 'subject-wise', icon: '/booksss.png', label: 'Subject-wise', description: 'Deep-dive any one subject' },
  { id: 'mixed-bag', icon: '/shinee.png', label: 'Mixed Bag', description: 'Random cross-subject mix' },
  { id: 'full-length', icon: '/cuppp.png', label: 'Full Length Test', description: 'Complete 100-Q simulation', pro: true },
];

const PRELIMS_SUBJECTS = [
  'All Subjects',
  'Polity',
  'History',
  'Geography',
  'Economy',
  'Environment & Ecology',
  'Science & Technology',
  'Current Affairs',
];

const MAINS_SUBJECTS = [
  'All Subjects',
  'Polity',
  'History',
  'Geography',
  'Economy',
  'Environment & Ecology',
  'Science & Technology',
  'Society',
  'Governance',
  'International Relations',
  'Social Justice',
  'Agriculture',
  'Internal Security',
  'Disaster Management',
  'Ethics',
  'Current Affairs',
];

const SUBJECT_COUNT_ALIASES: Record<string, string[]> = {
  'Science & Tech': ['Science & Technology'],
  'Environment': ['Environment & Ecology'],
  "Int'l Relations": ['International Relations'],
};

const subjectEmojiMap: Record<string, string> = {
  'All Subjects': '🌐',
  'All Topics': '🌐',
  'History': '🏛️',
  'Geography': '🌍',
  'Polity': '⚖️',
  'Economy': '💰',
  'Science & Tech': '🔬',
  'Environment': '🌿',
  'Current Affairs': '📰',
  'Art & Culture': '🎨',
  'International Relations': '🌐',
  'Security & Defence': '🛡️',
  'Art': '🎨',
};

Object.assign(subjectEmojiMap, {
  'All Subjects': '🌐',
  'All Topics': '🌐',
  'History': '🏛️',
  'Geography': '🌍',
  'Polity': '⚖️',
  'Economy': '💰',
  'Science & Tech': '🔬',
  'Science & Technology': '🔬',
  'Environment': '🌿',
  'Environment & Ecology': '🌿',
  'Current Affairs': '📰',
  'Art & Culture': '🎨',
  'International Relations': '🌐',
  'Security & Defence': '🛡️',
  'Internal Security': '🛡️',
  'Art': '🎨',
  'Society': '👥',
  'Governance': '🏛️',
  'Social Justice': '🤝',
  'Agriculture': '🌾',
  'Disaster Management': '🚨',
  'Ethics': '🧠',
});

const optionalSubjectIcons: Record<string, string> = {
  'Public Administration': '🏛️',
  'Geography': '🌍',
  'Geography (Optional)': '🌍',
  'History': '🏛️',
  'History (Optional)': '🏛️',
  'Sociology': '👥',
  'Political Science': '🗳️',
  'Political Science & International Relations': '🗳️',
  'Philosophy': '💭',
  'Economics': '📈',
  'Anthropology': '🧬',
  'Psychology': '🧠',
  'Law': '⚖️',
  'Agriculture': '🌾',
  'Animal Husbandry & Veterinary Science': '🐄',
  'Botany': '🌿',
  'Chemistry': '🧪',
  'Civil Engineering': '🏗️',
  'Commerce & Accountancy': '📊',
  'Electrical Engineering': '⚡',
  'Geology': '🪨',
  'Management': '💼',
  'Mathematics': '📐',
  'Mechanical Engineering': '⚙️',
  'Medical Science': '🏥',
  'Physics': '⚛️',
  'Statistics': '📉',
  'Zoology': '🐘',
  'Literature': '📚',
};

function buildMainsMarksPattern(questionCount: number) {
  if (questionCount <= 1) return [10];
  if (questionCount === 2) return [10, 15];

  const pattern: number[] = [];
  for (let idx = 0; idx < questionCount; idx += 1) {
    pattern.push((idx + 1) % 3 === 0 ? 15 : 10);
  }
  return pattern;
}

const fallbackExamModes = [
  { id: 'prelims', label: 'Prelims', description: 'Objective MCQs · 2 hour format' },
  { id: 'mains', label: 'Mains', description: 'Analytical & descriptive questions' },
];

const fallbackMainsPaperTypes = [
  { id: 'gs1', emoji: '🌍', label: 'GS I', description: 'Heritage, Culture, History & Geography' },
  { id: 'gs2', emoji: '⚖️', label: 'GS II', description: 'Governance, Polity, Social Justice & IR' },
  { id: 'gs3', emoji: '🚀', label: 'GS III', description: 'Technology, Economy, Environment & Security' },
  { id: 'gs4', emoji: '🧠', label: 'GS IV', description: 'Ethics, Integrity & Aptitude' },
];

const OPTIONAL_SUBJECTS_SCIENCE = [
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
];
const OPTIONAL_SUBJECTS_SOCIAL = [
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
];
const OPTIONAL_SUBJECTS_LITERATURE = [
  'Literature: Assamese', 'Literature: Bengali', 'Literature: Bodo',
  'Literature: Dogri', 'Literature: English', 'Literature: Gujarati',
  'Literature: Hindi', 'Literature: Kannada', 'Literature: Kashmiri',
  'Literature: Konkani', 'Literature: Maithili', 'Literature: Malayalam',
  'Literature: Manipuri', 'Literature: Marathi', 'Literature: Nepali',
  'Literature: Odia', 'Literature: Punjabi', 'Literature: Sanskrit',
  'Literature: Santhali', 'Literature: Sindhi', 'Literature: Tamil',
  'Literature: Telugu', 'Literature: Urdu',
];
const fallbackOptionalSubjects = [
  ...OPTIONAL_SUBJECTS_SCIENCE,
  ...OPTIONAL_SUBJECTS_SOCIAL,
  ...OPTIONAL_SUBJECTS_LITERATURE,
];

const fallbackDifficulties = [
  { id: 'easy', emoji: '🌱', label: 'Foundation level', description: 'Build concepts' },
  { id: 'medium', emoji: '⚡', label: 'Exam standard', description: 'UPSC pattern' },
  { id: 'hard', emoji: '🔥', label: 'Advanced', description: 'High difficulty' },
  { id: 'mixed', emoji: '🎯', label: 'All levels', description: 'Balanced mix' },
];

const difficultyMetaById: Record<string, { emoji: string; description: string }> = {
  easy: { emoji: '🌱', description: 'Build concepts' },
  medium: { emoji: '⚡', description: 'UPSC pattern' },
  hard: { emoji: '🔥', description: 'High difficulty' },
  mixed: { emoji: '🎯', description: 'Balanced mix' },
};

const humanizeDifficultyId = (id: string) => {
  if (!id) return '';
  return id
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
};
const fallbackUpgradePlans = [
  { name: 'Monthly Pro', price: 299, duration: 'month', features: ['Unlimited tests, all subjects, PYQ, analytics'], isPopular: false },
  { name: '6-Month Pro + Mentorship', price: 1299, duration: '6 months', features: ['Pro + personal mentorship with Jeet Sir'], isPopular: true },
  { name: 'Annual Elite', price: 1999, duration: 'year', features: ['Full year + live classes + interview prep'], isPopular: false },
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

function MockTestsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entitlements = useEntitlements();
  const [selectedSource, setSelectedSource] = useState('daily-mcq');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [selectedExamMode, setSelectedExamMode] = useState('prelims');
  const [selectedPaperType, setSelectedPaperType] = useState('gs1');
  const [selectedOptional, setSelectedOptional] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(5);
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');

  /* ─── API State ─── */
  const [subjects, setSubjects] = useState<{ name: string; count: number }[]>([]);
  const [questionSources, setQuestionSources] = useState(fallbackQuestionSources);
  const [examModes, setExamModes] = useState(fallbackExamModes);
  const [mainsPaperTypes, setMainsPaperTypes] = useState(fallbackMainsPaperTypes);
  const [optionalSubjects, setOptionalSubjects] = useState(fallbackOptionalSubjects);
  const [difficulties, setDifficulties] = useState(fallbackDifficulties);
  const [practiceStats, setPracticeStats] = useState<{ todayCount: number; streak: number } | null>(null);
  const [platformStats, setPlatformStats] = useState<{ questionsCount: number; testsCount: number; usersCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pricingPlans, setPricingPlans] = useState<any[]>([]);
  const questionPresets = selectedExamMode === 'mains'
    ? [
        { value: 2, label: 'Free 2', icon: '/90.png', pro: false },
        { value: 5, label: 'Practice 5', icon: '/text7.png', pro: true },
        { value: 10, label: 'Deep 10', icon: '/text8.png', pro: true },
        { value: 15, label: 'Answer 15', icon: '/text8.png', pro: true },
        { value: 20, label: 'Full 20', icon: '/text8.png', pro: true },
      ]
    : [
        { value: 5, label: 'Quick 5', icon: '/90.png', pro: false },
        { value: 10, label: 'Standard 10', icon: '/text7.png', pro: false },
        { value: 25, label: '25 Q', icon: '/text8.png', pro: true },
        { value: 50, label: '50 Q', icon: '/text8.png', pro: true },
        { value: 75, label: '75 Q', icon: '/text8.png', pro: true },
        { value: 100, label: 'Full 100', icon: '/text8.png', pro: true },
      ];
  const maxQuestionCount = selectedExamMode === 'mains' ? 20 : 100;
  const subjectCountMap = subjects.reduce<Record<string, number>>((acc, subject) => {
    acc[subject.name] = subject.count;
    return acc;
  }, {});
  const resolveSubjectCount = (name: string) =>
    subjectCountMap[name] ??
    SUBJECT_COUNT_ALIASES[name]?.reduce<number | null>((found, alias) => {
      if (found != null) return found;
      return subjectCountMap[alias] ?? null;
    }, null) ??
    0;
  const subjectOptions = (selectedExamMode === 'mains' ? MAINS_SUBJECTS : PRELIMS_SUBJECTS)
    .filter((name) => name !== 'All Subjects')
    .map((name) => ({
      name,
      count: resolveSubjectCount(name),
    }));
  const availableSubjects = useMemo(() => [
    { name: 'All Subjects', count: subjectCountMap['All Subjects'] ?? subjectOptions.reduce((sum, subject) => sum + subject.count, 0) },
    ...subjectOptions,
  ], [subjectCountMap, subjectOptions]);
  const mainsMarksPattern = selectedExamMode === 'mains' ? buildMainsMarksPattern(questionCount) : [];

  const difficultyDisplay: Record<string, { short: string; imgSrc: string; label: string; description: string }> = {
    easy: { short: '🌱', imgSrc: '/diff-easy.png', label: 'Easy', description: 'Build confidence' },
    medium: { short: '⚡', imgSrc: '/diff-medium.png', label: 'Medium', description: 'UPSC standard' },
    hard: { short: '🔥', imgSrc: '/diff-hard.png', label: 'Hard', description: 'Push limits' },
    mixed: { short: '🎯', imgSrc: '/diff-mixed.png', label: 'Mixed', description: 'Real exam feel' },
  };

  /* ─── Load all data from API ─── */
  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [subjectsRes, configRes, statsRes, platformRes, plansRes] = await Promise.all([
          mockTestService.getSubjects(),
          mockTestService.getConfig(),
          dashboardService.getPracticeStats(),
          mockTestService.getPlatformStats(),
          pricingService.getPlans(),
        ]);

        if (cancelled) return;

        if (subjectsRes.data) {
          // Merge API counts with the canonical UPSC subject list so students
          // always see the full subject repository, not just whatever the
          // question bank currently contains.
          const apiMap: Record<string, number> = {};
          for (const s of subjectsRes.data as Array<{ name: string; count: number }>) {
            apiMap[s.name] = s.count;
          }
          const merged: Array<{ name: string; count: number }> = [
            { name: 'All Subjects', count: apiMap['All Subjects'] ?? Object.values(apiMap).reduce((a, b) => a + b, 0) },
            ...Array.from(new Set([
              ...UPSC_SUBJECTS.map((s) => s.label),
              ...PRELIMS_SUBJECTS,
              ...MAINS_SUBJECTS,
            ])).map((name) => ({ name, count: apiMap[name] ?? 0 })),
          ];
          // Include any API subjects not in the canonical list (long tail)
          for (const s of subjectsRes.data as Array<{ name: string; count: number }>) {
            if (!merged.find((m) => m.name === s.name)) merged.push(s);
          }
          setSubjects(merged);
        }
        if (configRes.data) {
          const cfg = configRes.data;
          if (cfg.questionSources) setQuestionSources(cfg.questionSources);
          if (cfg.examModes) setExamModes(cfg.examModes);
          if (cfg.mainsPaperTypes) setMainsPaperTypes(cfg.mainsPaperTypes);
          if (cfg.optionalSubjects) setOptionalSubjects(cfg.optionalSubjects);
          if (Array.isArray(cfg.difficulties)) {
            const normalizedDifficulties = cfg.difficulties
              .map((item: any) => {
                const rawId = String(item?.id ?? item?.value ?? item?.name ?? '').trim();
                const id = rawId.toLowerCase().replace(/\s+/g, '_');
                if (!id) return null;
                const meta = difficultyMetaById[id];
                const label = String(item?.label ?? item?.name ?? item?.title ?? humanizeDifficultyId(id)).trim();
                const description = String(item?.description ?? meta?.description ?? '').trim();
                const emoji = String(item?.emoji ?? meta?.emoji ?? '🎯').trim();
                return {
                  id,
                  label,
                  description,
                  emoji,
                };
              })
              .filter(Boolean) as Array<{ id: string; label: string; description: string; emoji: string }>;

            setDifficulties(normalizedDifficulties.length > 0 ? normalizedDifficulties : fallbackDifficulties);
          }
        }
        if (statsRes.data) setPracticeStats(statsRes.data);
        if (platformRes.data) setPlatformStats(platformRes.data);
        if (Array.isArray(plansRes?.data)) setPricingPlans(plansRes.data);
      } catch (err: any) {
        if (!cancelled) {
          console.error('Failed to load mock test config:', err);
          setError(err.message || 'Failed to load configuration');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  /* ─── Pre-fill from series query params ─── */
  useEffect(() => {
    const subject = searchParams.get('subject');
    const difficulty = searchParams.get('difficulty');
    if (subject) setSelectedSubject(subject);
    if (difficulty) setSelectedDifficulty(difficulty);
  }, [searchParams]);

  useEffect(() => {
    setQuestionCount((count) => {
      if (selectedExamMode === 'mains') return Math.min(Math.max(count, 2), 20);
      return Math.min(Math.max(count, 5), 100);
    });
  }, [selectedExamMode]);

  useEffect(() => {
    if (!availableSubjects.some((subject) => subject.name === selectedSubject)) {
      setSelectedSubject('All Subjects');
    }
  }, [availableSubjects, selectedSubject]);

  /* ─── Generate Test Handler ─── */
  const handleGenerateTest = async () => {
    const featureKey = selectedExamMode === 'mains' ? 'mains_evaluation' : 'prelims_mock_attempt';
    const quota = entitlements.featureStatus(featureKey);
    if (quota?.allowed === false) {
      setError(quota.message || 'You have used your current plan limit.');
      return;
    }

    setGenerating(true);
    setError(null);
    try {
      const config = {
        source: selectedSource,
        subject: selectedSubject,
        examMode: selectedExamMode,
        paperType: selectedExamMode === 'mains' ? selectedPaperType : undefined,
        questionCount,
        difficulty: selectedDifficulty,
      };
      const res = await mockTestService.generate(config);
      const testId = res.data?.testId || res.data?.id;
      if (!testId) {
        throw new Error('No test ID returned from server');
      }
      router.push(`/dashboard/mock-tests/attempt?testId=${testId}&examMode=${selectedExamMode}`);
    } catch (err: any) {
      console.error('Failed to generate test:', err);
      setError(handleEntitlementError(err).message || 'Failed to generate test. Please try again.');
      setGenerating(false);
    }
  };

  const estimatedMinutes = selectedExamMode === 'mains'
    ? mainsMarksPattern.reduce((total, marks) => total + (marks === 15 ? 11 : 7), 0)
    : questionCount;
  const upgradePlans = (pricingPlans.length > 0 ? pricingPlans : fallbackUpgradePlans).slice(0, 3);

  /* Derive display labels for summary */
  const sourceLabel = questionSources.find(s => s.id === selectedSource)?.label ?? 'Daily MCQ';
  const paperLabel = selectedExamMode === 'mains'
    ? (mainsPaperTypes.find(p => p.id === selectedPaperType)?.label ?? 'GS I')
    : (prelimsPaperTypes.find(p => p.id === selectedPaperType)?.label ?? 'GS Paper I');
  const subjectLabel = availableSubjects.find(s => s.name === selectedSubject)?.name ?? selectedSubject ?? 'All Topics';
  const difficultyLabel = difficulties.find(d => d.id === selectedDifficulty)?.label ?? 'Medium';
  const activeQuota = entitlements.featureStatus(selectedExamMode === 'mains' ? 'mains_evaluation' : 'prelims_mock_attempt');
  const quotaExhausted = activeQuota?.allowed === false;

  /* ─── Card style helper ─── */
  const cardStyle: React.CSSProperties = {
    background: '#FFF',
    border: '0.8px solid #E5E7EB',
    borderRadius: '16px',
    padding: 'clamp(20px, 1.7vw, 28px)',
    marginBottom: 'clamp(14px, 1.2vw, 20px)',
  };

  return (
    <div className="flex overflow-hidden font-arimo" style={{ background: '#F9FAFB', height: 'calc(100vh - clamp(90px, 5.78vw, 111px))' }}>

      {/* ── Pro Upgrade Modal ── */}

      {/* Main scrollable content */}
      <main className="flex-1 overflow-y-auto font-arimo" style={{ background: '#F9FAFB' }}>

        <DashboardPageHero
          // eslint-disable-next-line @next/next/no-img-element
          badgeIcon={<img src="/badge-mocktest.png" alt="mocktest" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />}
          badgeText="MOCK TEST PLATFORM"
          title={
            <>
              Build Your{' '}
              <em className="not-italic" style={{ color: '#E8B84B', fontStyle: 'italic' }}>Perfect</em>{' '}
              Mock Test
            </>
          }
          subtitle="Adaptive questions · Real exam environment · Detailed analytics. Add as much as it takes."
          heroHeight="320px"
          contentShiftY={-12}
          titleMarginBottom={2}
          stats={[
            { value: platformStats ? platformStats.questionsCount.toLocaleString('en-IN') + '+' : '5000+', label: 'Questions', color: '#FDC700' },
            { value: platformStats ? platformStats.testsCount.toLocaleString('en-IN') + '+' : '12K+', label: 'Tests Taken', color: '#F97316' },
            { value: '15K+', label: 'Community', color: '#22C55E' },
            { value: '86%', label: 'Success Rate', color: '#FFFFFF' },
          ]}
        />

                {/* ── Prelims / Mains Toggle (below hero, on light bg) ── */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'clamp(16px, 1.8vw, 24px) 0' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            borderRadius: '999px',
            padding: '5px',
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.10)',
          }}>
            <button
              onClick={() => setSelectedExamMode('prelims')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                paddingLeft: '30px',
                paddingRight: '30px',
                height: '58px',
                borderRadius: '999px',
                border: 'none',
                cursor: 'pointer',
                background: selectedExamMode === 'prelims' ? '#0F172B' : 'transparent',
                transition: 'all 0.2s ease',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/9k.png" alt="Prelims" style={{ width: '22px', height: '22px', objectFit: 'contain', flexShrink: 0 }} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '17px', color: selectedExamMode === 'prelims' ? '#FFFFFF' : '#4A5565' }}>Prelims</span>
            </button>
            <button
              onClick={() => setSelectedExamMode('mains')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                paddingLeft: '30px',
                paddingRight: '30px',
                height: '58px',
                borderRadius: '999px',
                border: 'none',
                cursor: 'pointer',
                background: selectedExamMode === 'mains' ? '#0F172B' : 'transparent',
                transition: 'all 0.2s ease',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/8k.png" alt="Mains" style={{ width: '22px', height: '22px', objectFit: 'contain', flexShrink: 0 }} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '17px', color: selectedExamMode === 'mains' ? '#FFFFFF' : '#4A5565' }}>Mains</span>
            </button>
          </div>
        </div>

        {/* ── Two Column Layout: Steps + Test Summary ── */}
        <div style={{ display: 'flex', gap: 'clamp(10px, 1vw, 16px)', padding: '0 clamp(12px, 1.2vw, 20px) clamp(12px, 1.2vw, 20px)', maxWidth: '1320px', margin: '0 auto' }}>

        {/* ── Left Column: Steps ── */}
        <div style={{ flex: '1 1 0', minWidth: 0 }}>

          {/* ── Step 1: Exam Mode ── */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '18px',
            padding: '24px 28px',
            marginBottom: 'clamp(14px, 1.2vw, 20px)',
            boxShadow: '0 4px 24px 0 rgba(16,24,40,0.07), 0 1.5px 6px 0 rgba(16,24,40,0.04)',
          }}>
            {/* Step Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#0F172B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#FFFFFF' }}>1</span>
              </div>
              <span style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: '14px',
                letterSpacing: '0.35px',
                textTransform: 'uppercase' as const,
                color: '#101828',
              }}>
                Exam Mode
              </span>
            </div>

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

            {/* Paper Type Cards */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
              {(selectedExamMode === 'mains' ? mainsPaperTypes : prelimsPaperTypes).map(paper => {
                const isSelected = selectedPaperType === paper.id;
                return (
                  <button
                    key={paper.id}
                    onClick={() => setSelectedPaperType(paper.id)}
                    style={{
                      flex: '1 1 0',
                      minWidth: selectedExamMode === 'mains' ? '110px' : '190px',
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
                    {(paper as { emoji?: string }).emoji && (
                      <div style={{ fontSize: '26px', marginBottom: '6px', lineHeight: 1 }}>
                        {(paper as { emoji?: string }).emoji}
                      </div>
                    )}
                    {(paper as { icon?: string }).icon && (
                      <div style={{ marginBottom: '5px' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={(paper as { icon?: string }).icon} alt={paper.label} style={{ width: '24px', height: '28px', objectFit: 'contain' }} />
                      </div>
                    )}
                    {(paper as { isDefault?: boolean }).isDefault && (
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
                        DEFAULT
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

            {/* Focus on a Specific Subject */}
            <div style={{
              background: '#F0F4FF',
              borderRadius: '14px',
              padding: '16px 20px',
            }}>
              <div style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: '13px',
                letterSpacing: '0.5px',
                color: '#17223E',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                🎯 FOCUS ON A SPECIFIC SUBJECT
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {availableSubjects.map(subj => {
                  const isSelected = selectedSubject === subj.name;
                  return (
                    <button
                      key={subj.name}
                      onClick={() => setSelectedSubject(subj.name)}
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
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      {subjectEmojiMap[subj.name] && (
                        <span style={{ fontSize: '14px', lineHeight: 1 }}>{subjectEmojiMap[subj.name]}</span>
                      )}
                      {subj.name}
                      {subj.count > 0 && (
                        <span style={{ opacity: 0.7, fontWeight: 500, fontSize: 'clamp(11px, 0.7vw, 13px)' }}>{subj.count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Subject (Mains only) */}
            {selectedExamMode === 'mains' && (
              <div style={{ marginTop: '20px' }}>
                <div style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 700,
                  fontSize: 'clamp(12px, 0.82vw, 13px)',
                  color: '#17223E',
                  marginBottom: '10px',
                }}>
                  Optional Subject
                </div>
                <div style={{ position: 'relative', maxWidth: 380 }}>
                  <select
                    value={selectedOptional ?? ''}
                    onChange={(e) => setSelectedOptional(e.target.value || null)}
                    style={{
                      width: '100%',
                      padding: 'clamp(9px, 0.6vw, 11px) clamp(36px, 2.5vw, 40px) clamp(9px, 0.6vw, 11px) clamp(10px, 0.8vw, 14px)',
                      border: selectedOptional ? '1.5px solid #17223E' : '1.5px solid #D1D5DB',
                      borderRadius: 10,
                      background: selectedOptional ? '#17223E' : '#FFFFFF',
                      color: selectedOptional ? '#FFFFFF' : '#374151',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: selectedOptional ? 600 : 400,
                      fontSize: 'clamp(12px, 0.78vw, 13px)',
                      cursor: 'pointer',
                      outline: 'none',
                      appearance: 'none' as any,
                      WebkitAppearance: 'none' as any,
                      transition: 'all 0.15s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    }}
                  >
                    <option value="">— Select Optional Subject —</option>
                    <optgroup label="Science &amp; Engineering">
                      {OPTIONAL_SUBJECTS_SCIENCE.map((s) => (
                        <option key={s} value={s}>{optionalSubjectIcons[s] ?? '📘'} {s}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Social Sciences &amp; Humanities">
                      {OPTIONAL_SUBJECTS_SOCIAL.map((s) => (
                        <option key={s} value={s}>{optionalSubjectIcons[s] ?? '📘'} {s}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Literature">
                      {OPTIONAL_SUBJECTS_LITERATURE.map((s) => (
                        <option key={s} value={s}>📚 {s}</option>
                      ))}
                    </optgroup>
                  </select>
                  <span style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: selectedOptional ? '#FFFFFF' : '#9CA3AF',
                    fontSize: 13,
                    pointerEvents: 'none' as const,
                  }}>▾</span>
                </div>
                {selectedOptional && (
                  <button
                    onClick={() => setSelectedOptional(null)}
                    style={{
                      marginTop: 8,
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 12,
                      color: '#6B7280',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline',
                    }}
                  >
                    Clear selection
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Loading Spinner ── */}
          {loading && (
            <div style={{
              ...cardStyle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'clamp(40px, 3vw, 60px)',
              gap: '12px',
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                border: '3px solid #E5E7EB',
                borderTopColor: '#17223E',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              <span style={{
                fontFamily: 'var(--font-inter), Inter, sans-serif',
                fontSize: 'clamp(13px, 0.85vw, 15px)',
                color: '#6B7280',
              }}>
                Loading configuration...
              </span>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* ── Error Banner ─── */}
          {error && (
            <div style={{
              ...cardStyle,
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: 'clamp(14px, 1vw, 20px)',
            }}>
              <span style={{ fontSize: '18px' }}>⚠️</span>
              <span style={{
                fontFamily: 'var(--font-inter), Inter, sans-serif',
                fontSize: 'clamp(13px, 0.85vw, 15px)',
                color: '#991B1B',
              }}>
                {error}
              </span>
            </div>
          )}

          {/* ── Step 1: Question Source ── */}
          {!loading && (
          <div style={cardStyle}>
                <UsageMeter
                  status={activeQuota}
                  label={selectedExamMode === 'mains' ? 'Mains evaluation quota' : 'Prelims mock quota'}
                  className="mb-4"
                />
                <StepHeader step={2} label="Question Source" />
                <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '8px', overflowX: 'auto' }}>
              {questionSources.map(src => {
                const isSelected = selectedSource === src.id;
                return (
                  <button
                    key={src.id}
                    onClick={() => setSelectedSource(src.id)}
                    style={{
                      flex: '1 1 0',
                      minWidth: '110px',
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
                    {(src as any).pro && (
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
                    <div style={{ marginBottom: '8px' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={(src as { icon?: string }).icon} alt={src.label} style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
                    </div>
                    <div style={{ fontFamily: 'var(--font-inter), Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#101828', marginBottom: '4px' }}>
                      {src.label}
                    </div>
                    <div style={{ fontFamily: 'var(--font-inter), Inter, sans-serif', fontSize: '12px', color: '#6B7280', lineHeight: 1.4 }}>
                      {src.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          )}


          {/* ── Step 3: Number of Questions ── */}
          {!loading && (
          <div style={cardStyle}>
            <StepHeader step={3} label="Number of Questions" />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(4px, 0.4vw, 8px)', marginBottom: 'clamp(16px, 1.2vw, 22px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(18px, 1.5vw, 28px)' }}>
                <button
                  onClick={() => setQuestionCount(c => Math.max(selectedExamMode === 'mains' ? 1 : 5, c - 1))}
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
                    ~{estimatedMinutes} min · Free tier
                  </div>
                </div>
                <button
                  onClick={() => setQuestionCount(c => Math.min(maxQuestionCount, c + 1))}
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
                  min={selectedExamMode === 'mains' ? 1 : 5}
                  max={maxQuestionCount}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '26843500px',
                    background: `linear-gradient(90deg, #0F172A 0%, #0F172A ${(questionCount / maxQuestionCount) * 100}%, #E5E7EB ${(questionCount / maxQuestionCount) * 100}%, #E5E7EB 100%)`,
                    appearance: 'none',
                    cursor: 'pointer',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {(selectedExamMode === 'mains' ? [2, 5, 10, 15, 20] : [5, 25, 50, 75, 100]).map(val => (
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
              {questionPresets.map(preset => {
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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
            </div>

            {selectedExamMode === 'mains' && (
              <div style={{
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '24px',
              }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#1D4ED8', marginBottom: '4px' }}>
                  Mains marking pattern
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#1E3A8A', lineHeight: '20px' }}>
                  {mainsMarksPattern.map((marks, idx) => `Q${idx + 1}: ${marks} marks`).join(' · ')}
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#1D4ED8', lineHeight: '18px', marginTop: '4px' }}>
                  10 marker = 7 min · 15 marker = 11 min
                </div>
              </div>
            )}

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
                  <strong>Guideline:</strong> You&apos;re setting <strong>{questionCount} questions</strong>. Free users have <strong>{selectedExamMode === 'mains' ? 2 : 10} questions daily</strong>. This is generated from <strong>PYQ, questions bank</strong>.
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard/billing/plans?plan=pro&source=mock-tests')}
                style={{
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#101828" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <path d="M3 7.5l3.8 3 3.4-5.2a1 1 0 011.6 0l3.4 5.2 3.8-3a1 1 0 011.6.95l-1.7 9.3a1 1 0 01-1 .82H5.1a1 1 0 01-1-.82L2.4 8.45A1 1 0 013 7.5z" />
                </svg>
                Unlock
              </button>
            </div>
          </div>
          )}

          {/* ── Step 4: Difficulty ── */}
          {!loading && (
          <div style={cardStyle}>
            <StepHeader step={4} label="Difficulty" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap: 'clamp(18px, 1.6vw, 28px)' }}>
              {difficulties.map(diff => {
                const isSelected = selectedDifficulty === diff.id;
                const display = difficultyDisplay[diff.id] ?? {
                  short: '🎯',
                  imgSrc: '/diff-mixed.png',
                  label: diff.label || 'Difficulty',
                  description: diff.description || 'Select level',
                };
                return (
                  <button
                    key={diff.id}
                    onClick={() => setSelectedDifficulty(diff.id)}
                    style={{
                      background: isSelected ? '#FEF3C7' : '#FFF',
                      border: isSelected ? '2px solid #FDC700' : '1.5px solid #E5E7EB',
                      borderRadius: '14px',
                      minHeight: '120px',
                      padding: '16px 14px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 8px 20px -18px rgba(245, 158, 11, 0.9)' : '0 1px 2px rgba(15, 23, 42, 0.04)',
                    }}
                  >
                    <div style={{ width: 36, height: 36, margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={display.imgSrc} alt={display.label} style={{ width: 36, height: 36, objectFit: 'contain' }} />
                    </div>
                    <div style={{ fontFamily: 'var(--font-inter), Inter, sans-serif', fontWeight: 800, fontSize: '16px', lineHeight: '22px', color: '#101828', marginBottom: '3px' }}>
                      {display.label}
                    </div>
                    <div style={{ fontFamily: 'var(--font-inter), Inter, sans-serif', fontSize: '13px', lineHeight: '18px', color: '#6B7280' }}>
                      {display.description}
                  </div>
                  </button>
                );
              })}
            </div>
          </div>
          )}

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
                  Test Summary - Ready to Begin?
                </span>
              </div>

              {/* 2x3 Info Grid */}
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
                  Your Activity
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 0.8vw, 14px)' }}>
                  {[
                    {
                      emoji: '🔥',
                      label: practiceStats ? `${practiceStats.streak} day streak` : 'No streak yet',
                      color: '#F97316',
                      width: practiceStats ? `${Math.min(practiceStats.streak * 10, 100)}%` : '0%',
                    },
                    {
                      emoji: '📝',
                      label: practiceStats ? `${practiceStats.todayCount} test${practiceStats.todayCount !== 1 ? 's' : ''} today` : 'No tests today',
                      color: '#3B82F6',
                      width: practiceStats ? `${Math.min(practiceStats.todayCount * 20, 100)}%` : '0%',
                    },
                    {
                      emoji: '📚',
                      label: platformStats ? `${platformStats.questionsCount.toLocaleString('en-IN')} questions available` : 'Loading...',
                      color: '#16A34A',
                      width: '100%',
                    },
                  ].map((b, i) => (
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
                onClick={handleGenerateTest}
                disabled={generating || loading || quotaExhausted}
                style={{
                width: '100%',
                background: generating || quotaExhausted ? '#9CA3AF' : 'linear-gradient(90deg, #FDC700, #FF8904, #FF6900)',
                border: 'none',
                borderRadius: '14px',
                padding: 'clamp(12px, 1vw, 16px)',
                fontFamily: 'var(--font-inter), Inter, sans-serif',
                fontWeight: 800,
                fontSize: 'clamp(14px, 0.95vw, 17px)',
                color: '#FFF',
                cursor: generating || loading || quotaExhausted ? 'not-allowed' : 'pointer',
                letterSpacing: '0.02em',
                marginBottom: 'clamp(14px, 1.1vw, 20px)',
                opacity: generating || loading || quotaExhausted ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}>
                {generating ? (
                  <>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#FFF',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    Generating...
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </>
                ) : (
                  quotaExhausted ? 'Limit reached - upgrade to continue' : '🚀 Generate Test'
                )}
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
                <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {[
                    { initials: 'AK', bg: '#3B82F6' },
                    { initials: 'PS', bg: '#8B5CF6' },
                    { initials: 'RV', bg: '#14B8A6' },
                  ].map((a, i) => (
                    <span
                      key={a.initials}
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: a.bg,
                        border: '1.5px solid #0F172B',
                        color: '#FFFFFF',
                        fontSize: '8px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginLeft: i === 0 ? 0 : '-7px',
                      }}
                    >
                      {a.initials}
                    </span>
                  ))}
                </div>
                <span>{liveStudentCount('mock-tests')} students are taking tests right now</span>
              </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default function MockTestsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#FAFBFE' }} />}>
      <MockTestsPageInner />
    </Suspense>
  );
}
