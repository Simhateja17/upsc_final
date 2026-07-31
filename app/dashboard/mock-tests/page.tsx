'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { mockTestService, dashboardService } from '@/lib/services';
import DashboardPageHero from '@/components/DashboardPageHero';
import GeneratingTestModal from '@/components/GeneratingTestModal';
import { UPSC_SUBJECTS } from '@/lib/upscSubjects';
import { mainsTimeLimit } from '@/lib/mainsPattern';
import { handleEntitlementError } from '@/components/entitlements';
import { useEntitlements } from '@/contexts/EntitlementsContext';
import { MainsEvaluationLimitModal, MockTestLimitModal } from '@/components/upgrade/UpgradeModals';
import { getSubjectMetaStyle } from '@/lib/subjectPalette';

/* ─── Static Config (UI structure only, not data) ─── */

const prelimsPaperTypes = [
  { id: 'gs1', emoji: '🔑', label: 'GS Paper I', description: 'History · Geography · Polity · Economy · Science', isDefault: true },
  { id: 'csat', emoji: '🧩', label: 'CSAT', description: 'Aptitude · Comprehension · Logical Reasoning' },
];

const fallbackQuestionSources = [
  { id: 'daily_mcq', icon: '/target-icon.png', label: 'Daily MCQ Challenge', description: 'Fresh curated questions' },
  { id: 'pyq', icon: '/script.png', label: 'Previous Year Questions', badge: 'PYQ', description: 'UPSC PYQs (2011–2025)' },
  { id: 'subject_wise', icon: '🗃️', label: 'Question Bank', description: 'Curated expert questions' },
  { id: 'mixed', icon: '🎲', label: 'Mixed Bag', description: 'Variety from all sources' },
  { id: 'full_length', icon: '📋', label: 'Full Length Test', description: '100 questions, full paper simulation' },
];

const mainsQuestionSources = [
  { id: 'daily-mains', icon: '🌅', label: 'Daily MCQ Challenge', description: 'Fresh curated questions' },
  { id: 'practice-pyq', icon: '/script.png', label: 'Previous Year Questions', badge: 'PYQ', description: 'UPSC PYQs (2011–2025)' },
  { id: 'question-bank', icon: '🗃️', label: 'Question Bank', description: 'Curated expert questions' },
  { id: 'mixed-bag', icon: '🎲', label: 'Mixed Bag', description: 'Variety from all sources' },
  { id: 'full-length', icon: '📋', label: 'Full Length Test', description: '100 questions, full paper simulation' },
];

const PRELIMS_SUBJECTS = [
  'All Subjects',
  'Polity',
  'History',
  'Geography',
  'Economy',
  'Environment',
  'Science & Technology',
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

// Focus Subjects available for each Mains GS Paper. The Focus Subject list in
// the Exam Mode section is derived from the currently selected GS Paper using
// this mapping — never a single hardcoded list for every paper.
const MAINS_PAPER_FOCUS_SUBJECTS: Record<string, string[]> = {
  gs1: ['History', 'Geography', 'Society'],
  gs2: ['Polity', 'International Relations', 'Governance', 'Social Justice'],
  gs3: ['Economy', 'Environment & Ecology', 'Science & Technology', 'Internal Security', 'Disaster Management'],
  gs4: ['Ethics'],
};

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

// Mock Test Mains only uses 10-mark questions (cheaper to auto-evaluate),
// so every question in the set is a 10-marker — including Full Length.
function buildMainsMarksPattern(questionCount: number) {
  return Array(Math.max(1, questionCount)).fill(10);
}

const fallbackExamModes = [
  { id: 'prelims', label: 'Prelims', description: 'Objective MCQs · 2 hour format' },
  { id: 'mains', label: 'Mains', description: 'Analytical & descriptive questions' },
];

const fallbackMainsPaperTypes = [
  { id: 'gs1', emoji: '📘', label: 'GS Paper I', description: 'History · Geography · Society' },
  { id: 'gs2', emoji: '📗', label: 'GS Paper II', description: 'Polity · Governance · IR' },
  { id: 'gs3', emoji: '📙', label: 'GS Paper III', description: 'Economy · Environment · Sci-Tech' },
  { id: 'gs4', emoji: '📕', label: 'GS Paper IV', description: 'Ethics, Integrity & Aptitude' },
  { id: 'essay', emoji: '✏️', label: 'Essay', description: 'Paper I · 2 essays' },
  { id: 'optional', emoji: '📚', label: 'Optional', description: 'Choose your optional subject' },
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
/* ─── StepHeader Helper ─── */

function StepHeader({ step, label, subtitle }: { step: number; label: string; subtitle?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: 'clamp(12px, 1vw, 18px)' }}>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        background: '#1E2D4E',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-inter), Inter, sans-serif',
        fontWeight: 700,
        fontSize: '15px',
        flexShrink: 0,
      }}>
        {step}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{
          fontFamily: 'var(--font-inter), Inter, sans-serif',
          fontWeight: 700,
          fontSize: '13px',
          letterSpacing: '0.09em',
          color: '#101828',
          textTransform: 'uppercase' as const,
        }}>
          {label}
        </span>
        {subtitle && (
          <p style={{ margin: 0, fontFamily: 'var(--font-inter), Inter, sans-serif', fontSize: '14px', color: '#6B7280' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Page Component ─── */

function UpgradeSparkIcon({ size = 18, color = '#162456' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M12 2.5c.35 2.9 1.05 5.05 2.1 6.4 1.05 1.35 3.2 2.05 6.4 2.1-3.2.05-5.35.75-6.4 2.1-1.05 1.35-1.75 3.5-2.1 6.4-.35-2.9-1.05-5.05-2.1-6.4C8.85 11.75 6.7 11.05 3.5 11c3.2-.05 5.35-.75 6.4-2.1C10.95 7.55 11.65 5.4 12 2.5z" fill={color} />
      <path d="M19 15.2c.18 1.25.48 2.18.92 2.78.44.6 1.36.9 2.78.92-1.42.02-2.34.32-2.78.92-.44.6-.74 1.53-.92 2.78-.18-1.25-.48-2.18-.92-2.78-.44-.6-1.36-.9-2.78-.92 1.42-.02 2.34-.32 2.78-.92.44-.6.74-1.53.92-2.78z" fill={color} opacity="0.78" />
    </svg>
  );
}

function MockTestsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entitlements = useEntitlements();
  const [selectedSource, setSelectedSource] = useState('daily_mcq');
  const [focusSubjectOpen, setFocusSubjectOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [selectedExamMode, setSelectedExamMode] = useState('prelims');
  const [selectedPaperType, setSelectedPaperType] = useState('gs1');
  const [selectedOptional, setSelectedOptional] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(1);
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
  const [badgeCount, setBadgeCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedTestId, setGeneratedTestId] = useState<string | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generateBtnHovered, setGenerateBtnHovered] = useState(false);
  const [hoveredPaperType, setHoveredPaperType] = useState<string | null>(null);
  const [hoveredTick, setHoveredTick] = useState<number | null>(null);
  const [hoveredSource, setHoveredSource] = useState<string | null>(null);
  const [hoveredDifficulty, setHoveredDifficulty] = useState<string | null>(null);
  const [hoveredCounter, setHoveredCounter] = useState<'minus' | 'plus' | null>(null);
  // Becomes true once we've pulled the user's live entitlement/usage on entry,
  // so the limit check runs against real, current data (not a stale cache).
  const [usageChecked, setUsageChecked] = useState(false);
  // Ensures the on-entry upgrade popup is auto-shown at most once, so the user
  // can dismiss it without it re-opening on every render.
  const autoUpgradePromptShown = useRef(false);
  const minQuestionCount = 1;
  const maxQuestionCount = selectedExamMode === 'mains' ? 20 : 100;
  const questionSliderProgress = ((questionCount - minQuestionCount) / (maxQuestionCount - minQuestionCount)) * 100;
  // Single source of truth for the Active Aspirants count: the platform-stats
  // API (`usersCount`). Rendered in exactly one place on this page.
  const activeAspirantsCount = platformStats
    ? platformStats.usersCount.toLocaleString('en-IN') + '+'
    : '2,400+';
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
  // Focus Subject options shown in the dropdown. In Mains mode the list is
  // narrowed to the subjects that belong to the currently selected GS Paper,
  // so switching papers immediately swaps the Focus Subjects on screen.
  const focusSubjectOptions = useMemo(() => {
    if (selectedExamMode !== 'mains') return availableSubjects;
    const allowed = MAINS_PAPER_FOCUS_SUBJECTS[selectedPaperType];
    if (!allowed) return availableSubjects.filter((s) => s.name === 'All Subjects');
    return availableSubjects.filter(
      (s) => s.name === 'All Subjects' || allowed.includes(s.name),
    );
  }, [availableSubjects, selectedExamMode, selectedPaperType]);
  const mainsMarksPattern = selectedExamMode === 'mains' ? buildMainsMarksPattern(questionCount) : [];

  const difficultyDisplay: Record<string, { short: string; imgSrc: string; label: string; description: string }> = {
    easy: { short: '🌱', imgSrc: '/diff-easy.png', label: 'Easy', description: 'Foundational · single-dimensional' },
    medium: { short: '⚖️', imgSrc: '/diff-medium.png', label: 'Medium', description: 'Standard UPSC level · analytical' },
    hard: { short: '🔥', imgSrc: '/diff-hard.png', label: 'Hard', description: 'Multi-dimensional · interlinked' },
    mixed: { short: '🌀', imgSrc: '/diff-mixed.png', label: 'Mixed', description: 'Real-exam balance · recommended' },
  };

  /* ─── Load all data from API ─── */
  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [subjectsRes, configRes, statsRes, platformRes] = await Promise.all([
          mockTestService.getSubjects(),
          mockTestService.getConfig(),
          dashboardService.getPracticeStats(),
          mockTestService.getPlatformStats(),
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
          if (cfg.sources || cfg.questionSources) {
            const apiSources = cfg.sources || cfg.questionSources;
            setQuestionSources(apiSources.map((src: any) => ({
              id: String(src.id || '').replace(/-/g, '_'),
              icon: src.icon || fallbackQuestionSources.find((fallback) => fallback.id === String(src.id || '').replace(/-/g, '_'))?.icon || '/script.png',
              label: src.label || src.name || src.title,
              description: src.description || '',
              isPro: src.isPro,
            })));
          }
          if (cfg.examModes) setExamModes(cfg.examModes);
          // mainsPaperTypes are fixed UPSC papers — always use the static fallback
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

  /* ─── Badges earned (independent, non-blocking — feeds the "Your Activity" card) ─── */
  useEffect(() => {
    let cancelled = false;
    dashboardService.getAchievements()
      .then((res) => {
        if (cancelled) return;
        const list = res?.data?.badges;
        if (Array.isArray(list)) {
          setBadgeCount(list.filter((b: any) => b.status === 'earned').length);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  /* ─── On entering the page, refresh the user's real entitlement + usage so the
     Custom Mock Test limit check reflects their current subscription usage,
     not whatever was cached earlier in the session. ─── */
  useEffect(() => {
    let active = true;
    Promise.resolve(entitlements.refreshEntitlements()).finally(() => {
      if (active) setUsageChecked(true);
    });
    return () => { active = false; };
  }, [entitlements.refreshEntitlements]);

  /* ─── Pre-fill from series query params ─── */
  useEffect(() => {
    const subject = searchParams.get('subject');
    const difficulty = searchParams.get('difficulty');
    if (subject) setSelectedSubject(subject);
    if (difficulty) setSelectedDifficulty(difficulty);
  }, [searchParams]);

  useEffect(() => {
    setQuestionCount((count) => {
      if (selectedExamMode === 'mains') return Math.min(Math.max(count, minQuestionCount), 20);
      return Math.min(Math.max(count, minQuestionCount), 100);
    });
  }, [selectedExamMode]);

  useEffect(() => {
    if (!focusSubjectOptions.some((subject) => subject.name === selectedSubject)) {
      setSelectedSubject('All Subjects');
    }
  }, [focusSubjectOptions, selectedSubject]);

  useEffect(() => {
    if (selectedSource === 'subject_wise') {
      setFocusSubjectOpen(true);
    }
    if (selectedSource === 'full_length' && selectedExamMode === 'prelims') {
      setQuestionCount(100);
      setSelectedDifficulty('mixed');
      setSelectedPaperType('gs1');
    }
  }, [selectedSource, selectedExamMode]);

  /* ─── Generate Test Handler ─── */
  const handleGenerateTest = async () => {
    const featureKey = selectedExamMode === 'mains' ? 'mains_evaluation' : 'prelims_mock_attempt';
    const quota = entitlements.featureStatus(featureKey);
    if (quota?.allowed === false) {
      setShowLimitModal(true);
      setError(quota.message || 'You have used your current plan limit.');
      return;
    }

    setGenerating(true);
    setGeneratedTestId(null);
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
      if (selectedExamMode === 'prelims' && selectedPaperType === 'csat') {
        throw new Error('CSAT question bank is coming soon. Currently available: GS Paper I.');
      }
      if (selectedExamMode === 'prelims' && selectedSource === 'subject_wise' && selectedSubject === 'All Subjects') {
        setFocusSubjectOpen(true);
        throw new Error('Please select a focus subject for Subject-wise mock test.');
      }
      const res = await mockTestService.generate(config);
      const testId = res.data?.testId || res.data?.id;
      if (!testId) {
        throw new Error('No test ID returned from server');
      }
      // Hand the id to the modal — it finishes its progress animation and
      // then navigates via onComplete.
      setGeneratedTestId(testId);
    } catch (err: any) {
      console.error('Failed to generate test:', err);
      const parsed = handleEntitlementError(err);
      if (parsed.action === 'Upgrade plan' && selectedExamMode === 'prelims' && entitlements.tier === 'aspire') {
        setShowLimitModal(true);
        setError(parsed.message || 'Failed to generate test. Please try again.');
      } else if (parsed.title === 'Limit reached' || parsed.title === 'Upgrade required') {
        setShowLimitModal(true);
      } else {
        setError(parsed.message || 'Failed to generate test. Please try again.');
      }
      setGenerating(false);
      setGeneratedTestId(null);
    }
  };

  const estimatedMinutes = selectedExamMode === 'mains'
    ? mainsMarksPattern.reduce((total, marks) => total + mainsTimeLimit(marks), 0)
    // Prelims: 100 questions = 120 minutes, scaled proportionally (1.2 min/question).
    : Math.round(questionCount * 1.2);

  /* Live setup progress for the Test Summary (4 required steps → 25% each) */
  // A default selection is already a completed selection.  Do not use click
  // history here: that left the button disabled on first load and after
  // presets (for example Full Length) changed multiple values at once.
  const availablePaperTypes = selectedExamMode === 'mains' ? mainsPaperTypes : prelimsPaperTypes;
  const availableSources = selectedExamMode === 'mains' ? mainsQuestionSources : questionSources;
  const setupNodes = [
    { label: 'Paper', done: availablePaperTypes.some((paper) => paper.id === selectedPaperType && !(selectedExamMode === 'prelims' && paper.id === 'csat')) },
    { label: 'Question Source', done: availableSources.some((source) => source.id === selectedSource) },
    { label: 'Number of Questions', done: Number.isInteger(questionCount) && questionCount >= minQuestionCount && questionCount <= maxQuestionCount },
    { label: 'Difficulty', done: difficulties.some((difficulty) => difficulty.id === selectedDifficulty) },
  ];
  const focusSubjectValid = selectedSource !== 'subject_wise' || selectedSubject !== 'All Subjects';
  const canGenerate = setupNodes.every(n => n.done) && focusSubjectValid;
  const progressPct = Math.round((setupNodes.filter(node => node.done).length / setupNodes.length) * 100);

  /* Derive display labels for summary */
  const paperLabel = selectedExamMode === 'mains'
    ? (mainsPaperTypes.find(p => p.id === selectedPaperType)?.label ?? 'GS I')
    : (prelimsPaperTypes.find(p => p.id === selectedPaperType)?.label ?? 'GS Paper I');
  const subjectLabel = availableSubjects.find(s => s.name === selectedSubject)?.name ?? selectedSubject ?? 'All Topics';
  const difficultyLabel = difficulties.find(d => d.id === selectedDifficulty)?.label ?? 'Medium';
  const sourceLabel = (selectedExamMode === 'mains' ? mainsQuestionSources : questionSources)
    .find(source => source.id === selectedSource)?.label ?? selectedSource;
  const prelimsQuota = entitlements.featureStatus('prelims_mock_attempt');
  const activeQuota = entitlements.featureStatus(selectedExamMode === 'mains' ? 'mains_evaluation' : 'prelims_mock_attempt');
  const quotaExhausted = activeQuota?.allowed === false;
  const isPrelimsAttemptsExhausted = selectedExamMode === 'prelims' && entitlements.tier === 'aspire' && !!prelimsQuota && (
    prelimsQuota.code === 'FEATURE_LIMIT_REACHED' ||
    (prelimsQuota.limit !== null && prelimsQuota.remaining !== null && prelimsQuota.remaining <= 0)
  );

  /* ─── If the user has already exhausted their plan's Custom Mock Tests, show
     the upgrade popup immediately on page entry — don't wait for a Generate
     click. Only fires once real usage has loaded, and only once per visit. ─── */
  useEffect(() => {
    if (!usageChecked || entitlements.loading) return;
    if (autoUpgradePromptShown.current) return;
    if (isPrelimsAttemptsExhausted) {
      autoUpgradePromptShown.current = true;
      setShowLimitModal(true);
    }
  }, [usageChecked, entitlements.loading, isPrelimsAttemptsExhausted]);

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
      {selectedExamMode === 'mains' ? (
        <MainsEvaluationLimitModal
          open={showLimitModal}
          onClose={() => setShowLimitModal(false)}
          tier={entitlements.tier}
          used={activeQuota?.used}
          limit={activeQuota?.limit}
          backLabel="Back to Mock Tests"
        />
      ) : (
        <MockTestLimitModal
          open={showLimitModal}
          onClose={() => setShowLimitModal(false)}
          tier={entitlements.tier}
          used={activeQuota?.used}
          limit={activeQuota?.limit}
          backLabel="Back to Mock Tests"
        />
      )}
      <style>{`
        .question-count-slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #FDC700;
          border: 2px solid #FFFFFF;
          box-shadow: 0 1px 4px rgba(201, 162, 39, 0.35);
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .question-count-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #FDC700;
          border: 2px solid #FFFFFF;
          box-shadow: 0 1px 4px rgba(201, 162, 39, 0.35);
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .question-count-slider:hover::-webkit-slider-thumb,
        .question-count-slider:focus-visible::-webkit-slider-thumb {
          transform: scale(1.18);
          box-shadow: 0 2px 10px rgba(201, 162, 39, 0.5);
        }
        .question-count-slider:hover::-moz-range-thumb,
        .question-count-slider:focus-visible::-moz-range-thumb {
          transform: scale(1.18);
          box-shadow: 0 2px 10px rgba(201, 162, 39, 0.5);
        }
        .question-count-slider:active::-webkit-slider-thumb {
          transform: scale(1.22);
        }
        .question-count-slider:active::-moz-range-thumb {
          transform: scale(1.22);
        }
        .question-count-slider:focus-visible {
          outline: none;
        }
      `}</style>

      {/* ── Generating Test popup (blurred backdrop + pop-out) ── */}
      {generating && (
        <GeneratingTestModal
          isReady={!!generatedTestId}
          variant={selectedExamMode === 'prelims' ? 'prelims' : 'mains'}
          onComplete={() => {
            if (generatedTestId) {
              const params = new URLSearchParams({
                testId: generatedTestId,
                examMode: selectedExamMode,
                paper: paperLabel,
                subject: subjectLabel,
                difficulty: difficultyLabel,
              });
              router.push(`/dashboard/mock-tests/attempt?${params.toString()}`);
            }
          }}
        />
      )}

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
              onClick={() => {
                setSelectedExamMode('prelims'); setSelectedSource('daily_mcq');
              }}
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
              onClick={() => {
                setSelectedExamMode('mains'); setSelectedSource('daily-mains');
              }}
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
            <div style={{ marginBottom: '22px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: '#1E2D4E', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#FFF' }}>1</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#101828', letterSpacing: '0.09em', textTransform: 'uppercase' as const }}>
                  Exam Mode
                </span>
                <p style={{ margin: 0, fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B7280' }}>
                  {selectedExamMode === 'mains'
                    ? 'Choose the paper, narrow to a subject, or pick your optional.'
                    : 'Pick the paper you want to practise today'}
                </p>
              </div>
            </div>

            {/* Paper Type Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: selectedExamMode === 'mains' ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
              gridAutoRows: '1fr',
              gap: '10px',
              marginBottom: '20px',
            }}>
              {(selectedExamMode === 'mains' ? mainsPaperTypes : prelimsPaperTypes).map(paper => {
                const isSelected = selectedPaperType === paper.id;
                const isOptionalLocked = selectedExamMode === 'mains' && paper.id === 'optional';
                const isComingSoon = (selectedExamMode === 'prelims' && paper.id === 'csat') || isOptionalLocked;
                const paperStyle = getSubjectMetaStyle(paper.label);
                const isHovered = hoveredPaperType === paper.id && !isSelected && !isComingSoon;
                return (
                  <button
                    key={paper.id}
                    onClick={() => {
                      if (!isComingSoon) setSelectedPaperType(paper.id);
                    }}
                    disabled={isComingSoon}
                    onMouseEnter={() => setHoveredPaperType(paper.id)}
                    onMouseLeave={() => setHoveredPaperType(null)}
                    style={{
                      background: isSelected ? '#EFF6FF' : isHovered ? paperStyle.bg : '#FAFAFA',
                      border: isSelected
                        ? '2px solid #155DFC'
                        : isHovered
                        ? `1.8px solid ${paperStyle.accent}`
                        : `1.6px solid ${paperStyle.border}`,
                      borderRadius: '12px',
                      padding: '14px 12px',
                      cursor: isComingSoon ? 'not-allowed' : 'pointer',
                      opacity: isComingSoon ? 0.58 : 1,
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      height: '100%',
                      transform: isHovered ? 'translateY(-3px) scale(1.015)' : 'translateY(0) scale(1)',
                      boxShadow: isHovered
                        ? `0 10px 24px 0 ${paperStyle.accent}33, 0 2px 6px 0 rgba(16,24,40,0.08)`
                        : '0 0 0 0 rgba(0,0,0,0)',
                      transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease',
                    }}
                  >
                    <span style={{ fontSize: '22px', flexShrink: 0, lineHeight: 1, width: 42, height: 42, borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFFAA', border: `1px solid ${paperStyle.border}`, filter: isOptionalLocked ? 'blur(1.5px)' : 'none' }}>
                      {isOptionalLocked ? '🔒' : ((paper as any).emoji ?? '📄')}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#101828', marginBottom: '2px', filter: isOptionalLocked ? 'blur(1.2px)' : 'none' }}>
                        {paper.label}
                      </div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: isOptionalLocked ? '#9333EA' : '#6B7280', fontWeight: isOptionalLocked ? 700 : 400, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                        {isOptionalLocked ? 'Coming Soon' : isComingSoon ? 'Coming soon after CSAT bank import' : paper.description}
                      </div>
                    </div>
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                      border: isSelected
                        ? '5px solid #155DFC'
                        : isHovered
                        ? `1.5px solid ${paperStyle.accent}`
                        : '1.5px solid #D1D5DB',
                      background: '#FFF', transition: 'all 0.18s ease',
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
                    value={selectedSubject}
                    onChange={e => setSelectedSubject(e.target.value)}
                    style={{
                      // Right padding clears the chevron (at right:12px) with a
                      // comfortable gap so long labels like "Science & Technology"
                      // never touch the border; overflow/ellipsis guards the rest.
                      width: '100%', maxWidth: '100%', boxSizing: 'border-box',
                      padding: '10px 40px 10px 14px',
                      border: '1px solid #E5E7EB', borderRadius: '10px',
                      background: '#FFF', fontSize: '14px', color: '#101828',
                      fontFamily: 'Inter, sans-serif', cursor: 'pointer', outline: 'none',
                      appearance: 'none' as any, WebkitAppearance: 'none' as any,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}
                  >
                    <option value="All Subjects">All topics within this paper</option>
                    {focusSubjectOptions.filter(s => s.name !== 'All Subjects').map(s => (
                      <option key={s.name} value={s.name}>{subjectEmojiMap[s.name] ? `${subjectEmojiMap[s.name]} ` : ''}{s.name}</option>
                    ))}
                  </select>
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' as const, color: '#6B7280', fontSize: '14px' }}>▾</span>
                </div>
              )}
            </div>

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
              <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
              `}</style>
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
                <StepHeader step={2} label="Question Source" subtitle="Where should we pull your questions from?" />
                <div style={{
                  display: 'flex',
                  flexWrap: 'nowrap',
                  gap: '8px',
                  overflowX: 'auto',
                  // The row is a horizontal scrollport, so reserve vertical
                  // space for the hover lift and shadow instead of clipping
                  // the highlighted card at its top edge.
                  padding: '6px 2px',
                }}>
              {(selectedExamMode === 'mains' ? mainsQuestionSources : questionSources).map(src => {
                const isSelected = selectedSource === src.id;
                const isHovered = hoveredSource === src.id && !isSelected;
                const badge = (src as any).badge as string | undefined;
                return (
                  <button
                    key={src.id}
                    onClick={() => {
                      setSelectedSource(src.id);
                      if (src.id === 'subject_wise') setFocusSubjectOpen(true);
                      if (src.id === 'full_length' && selectedExamMode === 'prelims') {
                        setQuestionCount(100);
                        setSelectedDifficulty('mixed');
                        setSelectedPaperType('gs1');
                      }
                    }}
                    onMouseEnter={() => setHoveredSource(src.id)}
                    onMouseLeave={() => setHoveredSource(null)}
                    style={{
                      flex: '1 1 0',
                      minWidth: '110px',
                      background: isSelected ? '#EFF6FF' : isHovered ? '#F5F8FF' : '#FFF',
                      border: isSelected
                        ? '2px solid #155DFC'
                        : isHovered
                        ? '1.5px solid #155DFC'
                        : '1.5px solid #E5E7EB',
                      borderRadius: '14px',
                      padding: '16px 16px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      position: 'relative',
                      transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                      boxShadow: isHovered
                        ? '0 6px 18px 0 rgba(21,93,252,0.13), 0 1.5px 5px 0 rgba(16,24,40,0.06)'
                        : '0 0 0 0 rgba(0,0,0,0)',
                      transition: 'all 0.18s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{ marginBottom: '8px', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {(src as any).icon?.startsWith('/') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={(src as { icon?: string }).icon} alt={src.label} style={{ width: '44px', height: '44px', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ fontSize: '40px', lineHeight: '44px', display: 'block', textAlign: 'center' }}>{(src as any).icon}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-inter), Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#101828' }}>
                        {src.label}
                      </span>
                      {badge && (
                        <span style={{
                          fontFamily: 'var(--font-inter), Inter, sans-serif',
                          fontWeight: 600,
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: badge === 'PYQ' ? '#FEF3E2' : '#EDE9FE',
                          color: badge === 'PYQ' ? '#C2410C' : '#7C3AED',
                        }}>
                          {badge}
                        </span>
                      )}
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
            <StepHeader
              step={3}
              label="Number of Questions"
              subtitle={selectedExamMode === 'mains' ? 'Slide to set your set size · auto-balanced for time.' : undefined}
            />

            {/* Counter */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(4px, 0.4vw, 8px)', marginBottom: 'clamp(16px, 1.2vw, 22px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(18px, 1.5vw, 28px)' }}>
                <button
                  onClick={() => { setQuestionCount(c => Math.max(minQuestionCount, c - 1)); }}
                  onMouseEnter={() => setHoveredCounter('minus')}
                  onMouseLeave={() => setHoveredCounter(null)}
                  style={{
                    width: '56px', height: '56px', borderRadius: '50%',
                    border: selectedExamMode === 'mains' ? '1.5px solid #D4B483' : 'none',
                    background: hoveredCounter === 'minus'
                      ? (selectedExamMode === 'mains' ? 'rgba(212,180,131,0.16)' : '#EFF6FF')
                      : (selectedExamMode === 'mains' ? 'transparent' : '#F3F4F6'),
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 400, fontSize: '26px',
                    color: hoveredCounter === 'minus'
                      ? '#17223E'
                      : (selectedExamMode === 'mains' ? '#17223E' : '#364153'),
                    transform: hoveredCounter === 'minus' ? 'scale(1.08)' : 'scale(1)',
                    boxShadow: hoveredCounter === 'minus'
                      ? (selectedExamMode === 'mains' ? '0 4px 12px rgba(201,162,39,0.22)' : '0 4px 12px rgba(23,34,62,0.18)')
                      : '0 0 0 0 rgba(0,0,0,0)',
                    transition: 'all 0.15s ease',
                  }}
                >−</button>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontFamily: selectedExamMode === 'mains' ? 'Georgia, serif' : 'Inter, sans-serif',
                    fontWeight: selectedExamMode === 'mains' ? 400 : 700,
                    fontSize: selectedExamMode === 'mains' ? '72px' : '48px',
                    lineHeight: selectedExamMode === 'mains' ? '72px' : '48px',
                    color: '#17223E',
                  }}>
                    {questionCount}
                  </div>
                  <div style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: '11px',
                    letterSpacing: selectedExamMode === 'mains' ? '0.08em' : 0,
                    textTransform: selectedExamMode === 'mains' ? 'uppercase' as const : 'none' as const,
                    color: '#6A7282',
                    marginTop: '6px',
                  }}>
                    {selectedExamMode === 'mains' ? 'QUESTIONS' : 'questions'}
                  </div>
                  <div style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: '12px',
                    color: selectedExamMode === 'mains' ? '#B8960C' : '#99A1AF',
                    marginTop: '2px',
                  }}>
                    {`~${estimatedMinutes} mins`}
                  </div>
                </div>
                <button
                  onClick={() => { setQuestionCount(c => Math.min(maxQuestionCount, c + 1)); }}
                  onMouseEnter={() => setHoveredCounter('plus')}
                  onMouseLeave={() => setHoveredCounter(null)}
                  style={{
                    width: '56px', height: '56px', borderRadius: '50%',
                    border: selectedExamMode === 'mains' ? '1.5px solid #D4B483' : 'none',
                    background: hoveredCounter === 'plus'
                      ? (selectedExamMode === 'mains' ? 'rgba(212,180,131,0.16)' : '#EFF6FF')
                      : (selectedExamMode === 'mains' ? 'transparent' : '#F3F4F6'),
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 400, fontSize: '26px',
                    color: hoveredCounter === 'plus'
                      ? '#17223E'
                      : (selectedExamMode === 'mains' ? '#17223E' : '#364153'),
                    transform: hoveredCounter === 'plus' ? 'scale(1.08)' : 'scale(1)',
                    boxShadow: hoveredCounter === 'plus'
                      ? (selectedExamMode === 'mains' ? '0 4px 12px rgba(201,162,39,0.22)' : '0 4px 12px rgba(23,34,62,0.18)')
                      : '0 0 0 0 rgba(0,0,0,0)',
                    transition: 'all 0.15s ease',
                  }}
                >+</button>
              </div>
            </div>

            {/* Range Slider */}
            <div style={{ padding: '10px 32px', marginBottom: selectedExamMode === 'mains' ? '4px' : '0' }}>
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <input
                  type="range"
                  min={minQuestionCount}
                  max={maxQuestionCount}
                  value={questionCount}
                  onChange={(e) => { setQuestionCount(Number(e.target.value)); }}
                  className="question-count-slider"
                  style={{
                    width: '100%', height: '6px', borderRadius: '999px',
                    background: `linear-gradient(90deg, #EAAE06 0%, #EAAE06 ${questionSliderProgress}%, #E5DFC8 ${questionSliderProgress}%, #E5DFC8 100%)`,
                    appearance: 'none', cursor: 'pointer',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {(selectedExamMode === 'mains' ? [1, 5, 10, 15, 20] : [1, 25, 50, 75, 100]).map(val => {
                  const isTickActive = questionCount === val;
                  const isTickHovered = hoveredTick === val;
                  return (
                    <span
                      key={val}
                      onClick={() => { setQuestionCount(val); }}
                      onMouseEnter={() => setHoveredTick(val)}
                      onMouseLeave={() => setHoveredTick(null)}
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '12px',
                        fontWeight: isTickActive ? 700 : 500,
                        color: isTickActive || isTickHovered ? '#B8960C' : '#99A1AF',
                        cursor: 'pointer',
                        transition: 'color 0.15s ease, font-weight 0.15s ease',
                      }}
                    >
                      {val}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
          )}

          {/* ── Step 4: Difficulty ── */}
          {!loading && (
          <div style={cardStyle}>
            <StepHeader step={4} label="Difficulty" subtitle="Tune the cognitive load. We'll calibrate prompt depth accordingly." />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap: 'clamp(18px, 1.6vw, 28px)' }}>
              {difficulties.map(diff => {
                const isSelected = selectedDifficulty === diff.id;
                const isHovered = hoveredDifficulty === diff.id && !isSelected;
                const display = difficultyDisplay[diff.id] ?? {
                  short: '🎯',
                  imgSrc: '/diff-mixed.png',
                  label: diff.label || 'Difficulty',
                  description: diff.description || 'Select level',
                };
                return (
                  <button
                    key={diff.id}
                    onClick={() => { setSelectedDifficulty(diff.id); }}
                    onMouseEnter={() => setHoveredDifficulty(diff.id)}
                    onMouseLeave={() => setHoveredDifficulty(null)}
                    style={{
                      background: isSelected ? '#EFF6FF' : isHovered ? '#F5F8FF' : '#FFF',
                      // Border matches the Mains Answer Evaluator "Maximum Question Marks"
                      // selector (theme navy #17223E) in both Mains and Prelims modes.
                      border: isSelected
                        ? '1.8px solid #17223E'
                        : isHovered
                        ? '1.6px solid #17223E'
                        : '1.6px solid #E5E7EB',
                      borderRadius: '14px',
                      minHeight: '120px',
                      padding: '16px 14px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                      transition: 'all 0.18s ease',
                      // Flat neutral shadow (no sky-blue glow) to match the Evaluator's
                      // theme-navy selectors, in both Mains and Prelims modes.
                      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                    }}
                  >
                    <div style={{ width: 36, height: 36, margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 28, lineHeight: 1 }}>{display.short}</span>
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
            <div style={{
              position: 'sticky',
              top: '80px',
              height: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #162456 0%, #0F172B 50%, #030712 100%)',
                borderRadius: '20px',
                padding: 'clamp(20px, 1.6vw, 28px)',
                color: '#FFF',
                flex: 'none',
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'visible',
              }}>
              {/* Header */}
              <div style={{ marginBottom: 'clamp(16px, 1.3vw, 24px)' }}>
                <span style={{
                  fontFamily: 'var(--font-inter), Inter, sans-serif',
                  fontWeight: 800,
                  fontSize: 'clamp(11px, 0.75vw, 13px)',
                  letterSpacing: '0.08em',
                  color: '#94A3B8',
                  textTransform: 'uppercase' as const,
                }}>
                  Your Activity
                </span>
              </div>

              {/* Activity Rows — streak, tests taken today, badges earned */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 1.1vw, 18px)', marginBottom: 'clamp(18px, 1.4vw, 26px)' }}>
                {[
                  {
                    emoji: '🔥',
                    text: practiceStats === null
                      ? 'Loading...'
                      : practiceStats.streak > 0
                      ? `${practiceStats.streak} day streak`
                      : 'No streak yet',
                    bar: 'rgba(255,255,255,0.14)',
                  },
                  {
                    emoji: '📝',
                    text: practiceStats === null
                      ? 'Loading...'
                      : practiceStats.todayCount > 0
                      ? `${practiceStats.todayCount} test${practiceStats.todayCount === 1 ? '' : 's'} today`
                      : 'No tests today',
                    bar: 'rgba(255,255,255,0.14)',
                  },
                  {
                    emoji: '🎓',
                    text: badgeCount === null
                      ? 'Loading...'
                      : badgeCount > 0
                      ? `${badgeCount} badge${badgeCount === 1 ? '' : 's'} earned`
                      : 'No badges yet',
                    bar: 'linear-gradient(90deg, #22C55E, #16A34A)',
                  },
                ].map((row, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: 'clamp(14px, 0.95vw, 16px)', lineHeight: 1, flexShrink: 0 }}>{row.emoji}</span>
                      <span style={{
                        fontFamily: 'var(--font-inter), Inter, sans-serif',
                        fontWeight: 600,
                        fontSize: 'clamp(12px, 0.8vw, 14px)',
                        color: '#CBD5E1',
                      }}>
                        {row.text}
                      </span>
                    </div>
                    <div style={{ background: row.bar, borderRadius: '6px', height: '6px', width: '100%' }} />
                  </div>
                ))}
              </div>

              {/* Test Summary — keeps the selected configuration visible while
                  retaining the activity information above. */}
              <div style={{
                borderTop: '1px solid rgba(255,255,255,0.1)',
                paddingTop: 'clamp(16px, 1.2vw, 20px)',
                marginBottom: 'clamp(18px, 1.4vw, 26px)',
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'clamp(8px, 0.7vw, 12px)',
                  marginBottom: 'clamp(14px, 1vw, 18px)',
                }}>
                  {[
                    { emoji: '📋', value: `${questionCount}`, label: 'Questions' },
                    { emoji: '⏱', value: `${estimatedMinutes} min`, label: 'Duration' },
                    { emoji: '🔥', value: sourceLabel, label: 'Source' },
                    { emoji: '📘', value: paperLabel, label: 'Paper' },
                    { emoji: '⚡', value: difficultyLabel, label: 'Difficulty' },
                    { emoji: '🎯', value: subjectLabel, label: 'Focus Subject' },
                  ].map((item) => (
                    <div key={item.label} style={{
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: '10px',
                      padding: 'clamp(9px, 0.7vw, 12px)',
                      minHeight: 'clamp(70px, 5.2vw, 84px)',
                      minWidth: 0,
                      boxSizing: 'border-box',
                      display: 'flex',
                      flexDirection: 'column',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                        <span style={{ fontSize: 'clamp(12px, 0.8vw, 15px)', lineHeight: 1 }}>{item.emoji}</span>
                        <span style={{
                          fontFamily: 'var(--font-inter), Inter, sans-serif',
                          fontWeight: 600,
                          fontSize: 'clamp(8px, 0.56vw, 10px)',
                          letterSpacing: '0.06em',
                          color: '#94A3B8',
                          textTransform: 'uppercase' as const,
                        }}>{item.label}</span>
                      </div>
                      <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        fontFamily: 'var(--font-inter), Inter, sans-serif',
                        fontWeight: 700,
                        fontSize: 'clamp(11px, 0.75vw, 14px)',
                        lineHeight: 1.2,
                        color: '#FFF',
                        minWidth: 0,
                        wordBreak: 'break-word',
                      }}>{item.value}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontFamily: 'var(--font-inter), Inter, sans-serif', fontSize: 'clamp(10px, 0.68vw, 12px)', fontWeight: 600, color: '#94A3B8' }}>Setup Progress</span>
                    <span style={{ fontFamily: 'var(--font-inter), Inter, sans-serif', fontSize: 'clamp(10px, 0.68vw, 12px)', fontWeight: 800, color: '#F97316' }}>{progressPct}%</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '6px', height: '6px', overflow: 'hidden' }}>
                    <div style={{ background: 'linear-gradient(90deg, #FDC700, #FF8904)', width: `${progressPct}%`, height: '100%', borderRadius: '6px', transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              </div>

              {/* Generate Test Button */}
              <button
                onClick={isPrelimsAttemptsExhausted
                  ? () => setShowLimitModal(true)
                  : handleGenerateTest}
                disabled={generating || loading || (!isPrelimsAttemptsExhausted && !canGenerate)}
                onMouseEnter={() => setGenerateBtnHovered(true)}
                onMouseLeave={() => setGenerateBtnHovered(false)}
                style={{
                width: '100%',
                marginTop: '0',
                background: generating
                  ? '#9CA3AF'
                  : isPrelimsAttemptsExhausted
                  ? 'linear-gradient(90deg, #FDC700, #FF8904, #FF6900)'
                  : !canGenerate
                  ? '#9CA3AF'
                  : generateBtnHovered
                  ? 'linear-gradient(90deg, #E6B000, #E87200, #E05800)'
                  : 'linear-gradient(90deg, #FDC700, #FF8904, #FF6900)',
                border: 'none',
                borderRadius: '14px',
                padding: 'clamp(12px, 1vw, 16px)',
                fontFamily: 'var(--font-inter), Inter, sans-serif',
                fontWeight: 800,
                fontSize: 'clamp(14px, 0.95vw, 17px)',
                color: '#FFF',
                cursor: (generating || loading || (!isPrelimsAttemptsExhausted && !canGenerate)) ? 'not-allowed' : 'pointer',
                letterSpacing: '0.02em',
                marginBottom: 'clamp(14px, 1.1vw, 20px)',
                opacity: (generating || loading || (!isPrelimsAttemptsExhausted && !canGenerate)) ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'background 0.2s ease',
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
                ) : isPrelimsAttemptsExhausted ? (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.3 }}>
                      <span style={{ color: '#162456' }}>Free Attempts Exhausted</span>
                      <span style={{ color: '#162456', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <UpgradeSparkIcon size={16} color="#162456" />
                        Unlock Unlimited Access
                      </span>
                    </div>
                  </>
                ) : '🚀 Generate Test'}
              </button>

              {/* Bottom info */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontFamily: 'var(--font-inter), Inter, sans-serif',
                fontSize: 'clamp(10px, 0.68vw, 12px)',
                color: '#64748B',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  {['#22C55E', '#F97316', '#3B82F6'].map((color, i) => (
                    <span
                      key={i}
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: color,
                        flexShrink: 0,
                      }}
                    />
                  ))}
                </div>
                {/* Active Aspirants — the page's only display of this count, sourced from the platform-stats API */}
                <span style={{ textAlign: 'center' }}>{activeAspirantsCount} aspirants actively preparing on this platform</span>
              </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom "Social Proof Banner: Aspirants" removed per client feedback —
            the Active Aspirants count now renders only in the setup summary panel. */}
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
