'use client';

import React, { useState, useEffect } from 'react';
import { libraryService } from '@/lib/services';
import { useCmsContent } from '@/hooks/useCmsContent';
import DashboardPageHero from '@/components/DashboardPageHero';
import { useIsMobile } from '@/hooks/useIsMobile';
import { handleEntitlementError } from '@/components/entitlements';
import { useEntitlements } from '@/contexts/EntitlementsContext';
import StudyMaterialReaderModal from '@/components/StudyMaterialReaderModal';

/* ------------------------------------------------------------------ */
/*  Study-material action button styling (Read / Get PDF / Unlock)     */
/* ------------------------------------------------------------------ */

// Gold fill / ghost / shine styling for the Read · Get PDF · Unlock buttons
// lives in globals.css (.sm-btn, .sm-btn-gold, .sm-btn-ghost, .sm-shine),
// ported 1:1 from the Study_material_Suri_Final reference.

const BookOpenIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </svg>
);

/* "Why aspirants pick us" feature icons — lucide line icons, inherit `currentColor`. */
const FeatureSvg = ({ children }: { children: React.ReactNode }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const TargetIcon = () => (
  <FeatureSvg><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></FeatureSvg>
);
const RefreshIcon = () => (
  <FeatureSvg>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </FeatureSvg>
);
const HeartIcon = () => (
  <FeatureSvg><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></FeatureSvg>
);
const BarChartIcon = () => (
  <FeatureSvg><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></FeatureSvg>
);
const TrophyIcon = () => (
  <FeatureSvg>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </FeatureSvg>
);

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const SUBJECT_ICONS: Record<string, string> = {
  'polity': '⚖️',
  'history': '🏛️',
  'geography': '🌍',
  'economy': '💰',
  'environment': '🌿',
  'science': '🔬',
};

function subjectIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(SUBJECT_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return '\uD83D\uDCDA';
}

// Static per-subject styling for the sidebar (icon-box tint).
const SUBJECT_META: Record<string, { box: string }> = {
  'history': { box: '#FEF3C7' },
  'geography': { box: '#E0F2FE' },
  'polity': { box: '#FFE4E6' },
  'economy': { box: '#FEF9C3' },
  'environment': { box: '#D1FAE5' },
  'science': { box: '#E0E7FF' },
  'current affairs': { box: '#FAE8FF' },
};

function subjectMeta(name: string): { box: string } {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(SUBJECT_META)) {
    if (lower.includes(key)) return val;
  }
  return { box: '#F1F5F9' };
}

// Tag colors sourced from upsc_subject_color_palette.html
const SUBJECT_PALETTE: Record<string, { bg: string; color: string; topic: string }[]> = {
  history: [
    { bg: '#F5E8D4', color: '#7A5230', topic: 'Ancient India' },
    { bg: '#EDD5E6', color: '#7A3D72', topic: 'Medieval India' },
    { bg: '#FDE9C0', color: '#8A6010', topic: 'Art & Culture' },
    { bg: '#D8E4CC', color: '#445E38', topic: 'Modern History' },
  ],
  geography: [
    { bg: '#C8E8F4', color: '#1E6A9A', topic: 'Physical Geo \u2013 World' },
    { bg: '#D8F0DC', color: '#2E6E3E', topic: 'Physical Geo \u2013 India' },
    { bg: '#F4EDD0', color: '#826020', topic: 'Economic Geography' },
    { bg: '#ECD8F4', color: '#6A3A90', topic: 'Human Geography' },
  ],
  polity: [
    { bg: '#D0DDF4', color: '#2A4490', topic: 'Polity' },
  ],
  economy: [
    { bg: '#F8EDD8', color: '#7A5818', topic: 'Basic Economy' },
    { bg: '#D0ECD8', color: '#2E6848', topic: 'Public Finance' },
    { bg: '#C8ECF4', color: '#1E6880', topic: 'External Sector' },
    { bg: '#D8F0CC', color: '#3A6828', topic: 'Agriculture' },
    { bg: '#F4F0CC', color: '#6A6018', topic: 'Sectors of Economy' },
    { bg: '#D4DCE8', color: '#3A4A62', topic: 'Infrastructure' },
    { bg: '#F4E0D8', color: '#7A3A28', topic: 'Human Resource Dev.' },
  ],
  environment: [
    { bg: '#C8ECCC', color: '#2A6438', topic: 'Ecology & Ecosystem' },
    { bg: '#D0F0D4', color: '#1E5C34', topic: 'Biodiversity' },
    { bg: '#E8E4DC', color: '#5A5248', topic: 'Pollution' },
    { bg: '#D8ECF8', color: '#1E5A80', topic: 'Climate Change' },
    { bg: '#D4EEDC', color: '#2A6040', topic: 'Conservation Efforts' },
  ],
  science: [
    { bg: '#DCF0F8', color: '#1A5878', topic: 'General Science' },
    { bg: '#CCF0D4', color: '#1A5830', topic: 'Biotechnology' },
    { bg: '#F8DCDC', color: '#7A2828', topic: 'Human Health & Diseases' },
    { bg: '#D4D0F4', color: '#3A2A90', topic: 'Space' },
    { bg: '#D8E0CC', color: '#3A4828', topic: 'Defence' },
    { bg: '#F4F0BC', color: '#6A6010', topic: 'Nuclear Energy' },
    { bg: '#C8ECF8', color: '#1A5870', topic: 'Electronics & IT' },
    { bg: '#E8E4F4', color: '#4A3880', topic: 'Nano Science' },
  ],
};

function hashIndex(str: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return mod > 0 ? h % mod : 0;
}

const NEUTRAL_TAG_STYLE = { bg: '#F3F4F6', color: '#6A7282' };

// Returns distinct pill colors for the topic tag and the sub-subject tag,
// preferring an exact palette match for the sub-subject and never letting
// the two pills land on the same color.
function getTagStyles(subjectName: string, topicText: string, subSubjectText: string): {
  topic: { bg: string; color: string };
  subSubject: { bg: string; color: string };
} {
  const lower = subjectName.toLowerCase();
  const chips = Object.entries(SUBJECT_PALETTE).find(([key]) => lower.includes(key))?.[1];
  if (!chips || chips.length === 0) {
    return { topic: NEUTRAL_TAG_STYLE, subSubject: NEUTRAL_TAG_STYLE };
  }

  const findChipIndex = (text: string) => {
    const matchedIdx = chips.findIndex((c) => c.topic.toLowerCase() === text.toLowerCase());
    return matchedIdx !== -1 ? matchedIdx : hashIndex(text, chips.length);
  };

  const subIdx = findChipIndex(subSubjectText);
  let topicIdx = findChipIndex(topicText);
  if (topicIdx === subIdx) {
    topicIdx = chips.length > 1 ? (topicIdx + 1) % chips.length : topicIdx;
  }

  const subChip = chips[subIdx];
  const topicChip = chips.length > 1 ? chips[topicIdx] : NEUTRAL_TAG_STYLE;
  return {
    topic: { bg: topicChip.bg, color: topicChip.color },
    subSubject: { bg: subChip.bg, color: subChip.color },
  };
}

const features = [
  { emoji: '\uD83C\uDFAF', bg: '#FEE2E2', title: 'UPSC-First Approach', desc: 'Every line written from the examiner\u2019s lens. No fluff, only what earns marks in Prelims and Mains.' },
  { emoji: '\uD83D\uDD04', bg: '#DBEAFE', title: 'Updated Every Week', desc: 'Budget, new schemes, policy shifts, our notes are refreshed weekly so your prep stays current.' },
  { emoji: '\uD83D\uDC9C', bg: '#EDE9FE', title: 'Video + Notes Synced', desc: 'Every PDF maps directly to Jeet Sir\u2019s lessons. Watch, then revise \u2014 the most powerful UPSC loop.' },
  { emoji: '\uD83D\uDCCA', bg: '#DCFCE7', title: 'PYQ-Backed Content', desc: 'All notes are reviewed and weighted from 10 years of PYQs, calibrated to what UPSC asks every year.' },
  { emoji: '\uD83C\uDFC6', bg: '#FFEDD5', title: 'Toppers Trust It', desc: 'Used by 15,000+ aspirants building stronger Prelims, Mains, and interview preparation.' },
];

const heroStatItems = [
  { value: '100+', label: 'PDFs', color: '#FDC700' },
  { value: '25+', label: 'PYQ-Backed Notes', color: '#F87171' },
  { value: '50k+', label: 'Downloads', color: '#4ADE80' },
  { value: '4.9', label: 'Ratings', color: '#FFFFFF' },
];


/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function LibraryPage() {
  const entitlements = useEntitlements();
  const { content: cms } = useCmsContent('dashboard/library', {
    hero_badge: 'STUDY MATERIAL',
    hero_title: 'Master UPSC with Expert Notes and Simplified Resources',
    hero_subtitle: 'From PYQ-backed notes to concise summaries, everything you need, simplified.',
    hero_stats: JSON.stringify([
      { value: '100+', label: 'PDFs', color: '#FDC700' },
      { value: '25+', label: 'PYQ-Backed Notes', color: '#F87171' },
      { value: '50k+', label: 'Downloads', color: '#4ADE80' },
      { value: '4.9', label: 'Ratings', color: '#FFFFFF' },
    ]),
    sidebar_header_title: 'Subject Library',
    section_label_notes: 'FOUNDATIONAL NOTES',
    section_label_pyq: 'PREVIOUS YEAR QUESTIONS',
    banner_badge: 'WHY RISE WITH JEET',
    banner_title: 'Not just notes. A system built to crack UPSC.',
    banner_subtitle: "Every PDF is designed with one obsession, your selection. Here's what makes us different from every other resource out there.",
    banner_stat_number: '15K+',
    banner_stat_label: "Aspirants trust\nRise with Jeet",
    cta_title: 'Unlock Simplified Notes, Smart Mnemonic Tricks',
    cta_subtitle: 'Get access to 100+ PYQ-backed notes, mnemonics, simplified mindmap PDFs - everything you need to crack UPSC.',
    cta_button_primary: 'Download PDFs',
    cta_button_secondary: 'Watch on YouTube',
  });

  const heroBadge = 'STUDY MATERIAL';
  const heroSubtitle = 'From PYQ-backed notes to concise summaries, everything you need, simplified.';
  const sidebarHeaderTitle = cms?.sidebar_header_title || 'Subject Library';
  const sectionLabelNotes = cms?.section_label_notes || 'FOUNDATIONAL NOTES';
  const sectionLabelPyq = cms?.section_label_pyq || 'PREVIOUS YEAR QUESTIONS';
  const bannerTitle = cms?.banner_title || 'Not just notes. A system built to crack UPSC.';
  const bannerSubtitle = "Every PDF is designed with one obsession, your selection. Here's what makes us different from every other resource out there.";
  const bannerStatNumber = cms?.banner_stat_number || '15K+';
  const bannerStatLabel = cms?.banner_stat_label || "Aspirants trust\nRise with Jeet";
  const ctaTitle = 'Unlock Simplified Notes, Smart Mnemonic Tricks';
  const ctaSubtitle = 'Get access to 100+ PYQ-backed notes, mnemonics, simplified mindmap PDFs - everything you need to crack UPSC.';
  const ctaButtonPrimary = 'Download PDFs';
  const ctaButtonSecondary = cms?.cta_button_secondary || 'Watch on YouTube';
  // Visual design (icons, tinted boxes, card gradient) ported from the reference;
  // copy text kept as-is (product uses YouTube branding).
  const features = [
    { Icon: TargetIcon, iconBg: '#FFE4E6', iconColor: '#E11D48', tint: 'rgba(255,241,242,0.4)', title: 'UPSC-First Approach', desc: 'Every line written from the examiner\u2019s lens. No fluff, only what earns marks in Prelims and Mains.' },
    { Icon: RefreshIcon, iconBg: '#E0F2FE', iconColor: '#0284C7', tint: 'rgba(240,249,255,0.4)', title: 'Updated Every Week', desc: 'Budget, new schemes, policy shifts, our notes are refreshed weekly so your prep stays current.' },
    { Icon: HeartIcon, iconBg: '#EDE9FE', iconColor: '#7C3AED', tint: 'rgba(245,243,255,0.4)', title: 'Video + Notes Synced', desc: 'Every PDF maps directly to Jeet Sir\u2019s lessons. Watch, then revise \u2014 the most powerful UPSC loop.' },
    { Icon: BarChartIcon, iconBg: '#E0E7FF', iconColor: '#4F46E5', tint: 'rgba(238,242,255,0.4)', title: 'PYQ-Backed Content', desc: 'All notes are reviewed and weighted from 10 years of PYQs, calibrated to what UPSC asks every year.' },
    { Icon: TrophyIcon, iconBg: '#FEF3C7', iconColor: '#D97706', tint: 'rgba(255,251,235,0.4)', title: 'Toppers Trust It', desc: 'Used by 15,000+ aspirants building stronger Prelims, Mains, and interview preparation.' },
  ];

  const isMobile = useIsMobile();
  const [selectedSubject, setSelectedSubject] = useState('');
  const [activeTab, setActiveTab] = useState('Notes');
  const [examStage, setExamStage] = useState<'prelims' | 'mains' | 'optional'>('prelims');
  const stageTabRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const [stageIndicator, setStageIndicator] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [apiSubjects, setApiSubjects] = useState<any[]>([]);
  const [apiChapters, setApiChapters] = useState<Record<string, any[]>>({});
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [downloadingChapter, setDownloadingChapter] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [readModal, setReadModal] = useState<{ pages: string[]; title: string } | null>(null);
  const [loadingRead, setLoadingRead] = useState<string | null>(null);
  const selectedApiSubject = apiSubjects.find(s => s.name === selectedSubject) ?? null;

  // Fetch subjects on mount
  useEffect(() => {
    libraryService.getSubjects()
      .then((res: any) => {
        const data = res.data?.subjects || res.data || [];
        if (Array.isArray(data) && data.length > 0) {
          setApiSubjects(data);
          setSelectedSubject((prev) => prev || data[0].name);
        }
      })
      .catch(() => {});

  }, []);

  // Fetch chapters when a subject is selected
  useEffect(() => {
    const apiSubject = apiSubjects.find(s => s.name === selectedSubject);
    if (!apiSubject?.id) return;

    setLoadingChapters(true);
    libraryService.getChapters(apiSubject.id)
      .then((res: any) => {
        const data = res.data?.chapters || res.data || [];
        if (Array.isArray(data)) {
          setApiChapters((prev) => ({ ...prev, [selectedSubject]: data }));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingChapters(false));
  }, [selectedSubject, apiSubjects]);

  // Sliding active-pill indicator for the Prelims / Mains / Optional stage tabs
  React.useLayoutEffect(() => {
    const measure = () => {
      const el = stageTabRefs.current[examStage];
      if (el) {
        setStageIndicator({ left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [examStage, isMobile, selectedSubject, apiSubjects]);

  // Read: fetch rendered page images and open in protected in-app viewer (no raw PDF URL)
  const handleRead = async (material: any) => {
    const materialId = material._id || material.id;
    if (!materialId) return;
    setLoadingRead(materialId);
    try {
      const res: any = await libraryService.getMaterialViewPages(materialId, 50);
      const data = res.data?.data || res.data || {};
      const pages = Array.isArray(data.pages)
        ? data.pages.map((page: any) => page?.url).filter((url: unknown): url is string => typeof url === 'string' && url.length > 0)
        : [];

      if (pages.length > 0) {
        setReadModal({ pages, title: data.title || material.title || material.name || 'Note' });
        entitlements.refreshEntitlements();
      } else {
        alert('Could not load this note. Please try again.');
      }
    } catch (err) {
      alert(handleEntitlementError(err).message);
    }
    finally { setLoadingRead(null); }
  };

  // Get PDF: always go to upgrade/billing
  const handleGetPdf = () => {
    window.location.href = '/dashboard/billing/plans?source=library';
  };

  const tabs = ['Notes', 'PYQ Notes', 'Tricks & Mnemonics', 'Current Affairs'] as const;
  type TabKey = typeof tabs[number];

  const ACTIVE_TAB_COLOR = '#0F172B';
  const ACTIVE_TAB_BG = '#E8EAF0';

  const TAB_CONFIG: Record<TabKey, { icon: string }> = {
    'Notes': { icon: '📄' },
    'PYQ Notes': { icon: '📌' },
    'Tricks & Mnemonics': { icon: '💡' },
    'Current Affairs': { icon: '📰' },
  };

  const getChaptersForTab = (tab: string) => {
    const subSubjects = apiChapters[selectedSubject] || [];
    return subSubjects.flatMap((subSubject: any) =>
      (subSubject.topics || []).flatMap((topic: any) =>
        (topic.materials || [])
          .filter((material: any) => {
            // Type filter across all 4 tabs
            const mType: string = (material.type || '').toLowerCase();
            let typeMatch: boolean;
            if (tab === 'PYQ Notes') {
              typeMatch = mType === 'pyq notes' || mType === 'pyq';
            } else if (tab === 'Tricks & Mnemonics') {
              typeMatch = mType.includes('trick') || mType.includes('mnemonic');
            } else if (tab === 'Current Affairs') {
              typeMatch = mType.includes('current affairs') || mType.includes('current affair');
            } else {
              // Notes: everything that isn't one of the above specific types
              typeMatch = !['pyq notes', 'pyq', 'tricks & mnemonics', 'tricks', 'mnemonics', 'current affairs', 'current affair'].includes(mType)
                && !mType.includes('trick') && !mType.includes('mnemonic') && !mType.includes('current affair');
            }
            // Stage filter: if the material carries an examStage/stage/tags field, use it;
            // otherwise show the material for every stage (don't hide content unnecessarily).
            const materialStage: string | undefined =
              material.examStage ?? material.stage ?? material.exam_stage;
            const materialTags: string[] = material.tags ?? [];
            const hasStageInfo = materialStage !== undefined || materialTags.length > 0;
            const stageMatch = !hasStageInfo ||
              (materialStage && materialStage.toLowerCase() === examStage) ||
              materialTags.some((t: string) => t.toLowerCase() === examStage);
            return typeMatch && stageMatch;
          })
          .map((material: any) => ({
            ...material,
            subSubjectTitle: subSubject.title || subSubject.name,
            topicTitle: topic.title || topic.name,
          }))
      )
    ).filter((material: any) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (material.title || material.name || '').toLowerCase().includes(q) ||
        (material.topicTitle || '').toLowerCase().includes(q) ||
        (material.subSubjectTitle || '').toLowerCase().includes(q)
      );
    });
  };

  return (
    <>
    <div
      className="font-arimo w-full min-h-screen"
      style={{ background: '#FAFBFE' }}
    >
      <DashboardPageHero
        // eslint-disable-next-line @next/next/no-img-element
        badgeIcon={<img src="/sidebar-study-material-new.png" alt="study material" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />}
        badgeText={heroBadge}
        title={
          <>
            Master UPSC with <em style={{ color: '#E8B84B', fontStyle: 'italic' }}>Expert</em> Notes and <em style={{ color: '#E8B84B', fontStyle: 'italic' }}>Simplified</em> Resources
          </>
        }
        subtitle={heroSubtitle}
        stats={heroStatItems}
      />
      {/* Centered content wrapper for bottom sections */}
      <div
        className="w-full mx-auto"
        style={{
          maxWidth: 'min(94vw, 1400px)',
          padding: '0 clamp(16px, 2vw, 30px)',
        }}
      >
        {/* ============================================================ */}
        {/*  SECTION 2: SUBJECT SIDEBAR + CONTENT PANEL                   */}
        {/* ============================================================ */}
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 'clamp(16px, 2vw, 28px)',
            alignItems: isMobile ? 'stretch' : 'flex-start',
            marginBottom: 'clamp(40px, 4vw, 60px)',
            flexWrap: isMobile ? ('nowrap' as const) : ('wrap' as const),
          }}
        >
          {/* ── Left Sidebar ── */}
          <div
            style={{
              width: isMobile ? '100%' : 'clamp(240px, 24vw, 310px)',
              flexShrink: 0,
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '0.8px solid #E5E7EB',
              boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)',
              overflow: 'hidden',
            }}
          >
            {/* Sidebar header */}
            <div style={{ padding: 'clamp(12px, 1vw, 16px)' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, #0E182D 0%, #172240 100%)',
                  borderRadius: '16px',
                  padding: 'clamp(14px, 1.3vw, 18px)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  className="pointer-events-none"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0.5,
                    backgroundImage:
                      'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)',
                    backgroundSize: '14px 14px',
                  }}
                />
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFD96B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M8 3v18" /><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H8v18H6.5A2.5 2.5 0 0 1 4 18.5z" />
                      <path d="m12 3 6 18" /><path d="M11.5 4 18 2.5l4 17-6.5 1.5z" />
                    </svg>
                    <div className="font-arimo font-bold" style={{ fontSize: 'clamp(16px, 1.5vw, 18px)', color: '#FFFFFF', letterSpacing: '-0.2px' }}>
                      {sidebarHeaderTitle}
                    </div>
                  </div>
                  <div className="font-arimo" style={{ fontSize: 'clamp(11px, 1vw, 12px)', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
                    100+ PDFs across GS papers
                  </div>
                </div>
              </div>
            </div>

            {/* Active subjects list */}
            <div style={{ padding: '0 clamp(8px, 0.8vw, 12px) clamp(8px, 0.8vw, 12px)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {apiSubjects.length === 0 ? (
                <div className="font-arimo" style={{ padding: '12px 16px', color: '#9CA3AF', fontSize: '13px' }}>
                  Loading subjects...
                </div>
              ) : apiSubjects.map((subject) => {
                const isSelected = selectedSubject === subject.name;
                const meta = subjectMeta(subject.name);
                const pdfCount = subject.pdfCount ?? subject.chapterCount ?? 0;
                const pyqCount = subject.pyqCount ?? subject.pyqsCount ?? subject.pyqs ?? null;
                const countLabel = pyqCount !== null && pyqCount !== undefined
                  ? `${pdfCount} PDFs · ${pyqCount} PYQs`
                  : `${pdfCount} PDFs`;
                return (
                  <button
                    key={subject.id}
                    onClick={() => { setSelectedSubject(subject.name); setActiveTab('Notes'); setExamStage('prelims'); setSearchQuery(''); setShowSearch(false); }}
                    className="w-full"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'clamp(8px, 0.8vw, 12px)',
                      padding: 'clamp(10px, 1vw, 12px)',
                      borderRadius: '12px',
                      background: isSelected ? 'linear-gradient(135deg, #0F1A30 0%, #172240 100%)' : 'transparent',
                      border: isSelected ? '1px solid rgba(255,217,107,0.55)' : '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#F8FAFC'; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Icon box */}
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: isSelected ? 'rgba(251,191,36,0.15)' : meta.box,
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: '20px',
                        flexShrink: 0,
                      }}
                    >
                      {subjectIcon(subject.name)}
                    </div>

                    {/* Title + counts */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        className="font-arimo font-bold"
                        style={{
                          fontSize: 'clamp(12px, 1.05vw, 13.5px)',
                          color: isSelected ? '#FFFFFF' : '#1E293B',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {subject.name}
                      </div>
                      <div
                        className="font-arimo"
                        style={{
                          fontSize: 'clamp(10px, 0.82vw, 11px)',
                          color: isSelected ? 'rgba(255,255,255,0.6)' : '#64748B',
                        }}
                      >
                        {countLabel}
                      </div>
                    </div>

                    {/* Right: chevron */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isSelected ? '#FFD96B' : '#94A3B8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Right Content Panel ── */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              width: isMobile ? '100%' : undefined,
              maxWidth: '100%',
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '0.8px solid #E5E7EB',
              boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Decorative ellipses on the container */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/top_ellipse.svg"
              alt=""
              aria-hidden="true"
              style={{
                position: 'absolute',
                right: '0',
                top: '0',
                width: '252px',
                height: '134px',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
            {/* Subject header */}
            <div
              style={{
                padding: 'clamp(20px, 2vw, 28px) clamp(24px, 2.5vw, 32px) clamp(12px, 1.2vw, 16px)',
                position: 'relative',
              }}
            >
              <div className="relative z-10">
                {/* Header area */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'clamp(12px, 1.2vw, 16px)', flexWrap: 'wrap' as const, marginBottom: 'clamp(2px, 0.3vw, 4px)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2
                      className="font-arimo font-bold"
                      style={{
                        fontSize: 'clamp(22px, 2.2vw, 30px)',
                        color: '#101828',
                        marginBottom: 'clamp(6px, 0.6vw, 8px)',
                        lineHeight: '36px',
                      }}
                    >
                      {selectedApiSubject?.name ?? selectedSubject}
                    </h2>
                    <p
                      className="font-arimo"
                      style={{
                        fontSize: 'clamp(12px, 1.05vw, 14px)',
                        lineHeight: '20px',
                        color: '#4A5565',
                        whiteSpace: 'pre-line',
                      }}
                    >
                      Notes, PYQs and Mnemonics – everything you need to master this subject.
                    </p>
                  </div>

                  {/* Mini stats card */}
                  <div
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '24px',
                      border: '0.8px solid #E5E7EB',
                      boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.08)',
                      padding: isMobile ? '12px 24px' : '14px 48px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: isMobile ? '20px' : '32px',
                      flexShrink: 0,
                      width: isMobile ? '100%' : undefined,
                      justifyContent: isMobile ? 'center' : undefined,
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    <div className="flex flex-col items-center">
                      <div className="font-arimo font-bold" style={{ fontSize: isMobile ? '32px' : '40px', color: '#101828', lineHeight: 1.1 }}>
                        {selectedApiSubject?.pdfCount ?? 0}
                      </div>
                      <div className="font-arimo" style={{ fontSize: '14px', color: '#6A7282' }}>
                        PDFs
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prelims / Mains / Optional stage tabs */}
                {(() => {
                  const stages: { key: 'prelims' | 'mains' | 'optional'; label: string; icon: string }[] = [
                    { key: 'prelims' as const, label: 'Prelims', icon: '📋' },
                    { key: 'mains' as const, label: 'Mains', icon: '✍️' },
                    { key: 'optional' as const, label: 'Optional', icon: '📚' },
                  ];
                  return (
                    <div
                      className="flex items-center"
                      style={{
                        position: 'relative',
                        gap: '6px',
                        padding: '6px',
                        background: 'linear-gradient(180deg, #FFFFFF 0%, #F6F8FC 100%)',
                        borderRadius: '999px',
                        border: '1px solid #E4E9F2',
                        boxShadow: '0 10px 30px -22px rgba(15, 23, 43, 0.35), inset 0 1px 0 rgba(255,255,255,0.95)',
                        display: 'inline-flex',
                        maxWidth: '100%',
                        overflowX: 'auto',
                        scrollbarWidth: 'none',
                      }}
                    >
                      {/* Sliding indicator */}
                      {stageIndicator && (
                        <span
                          aria-hidden="true"
                          style={{
                            position: 'absolute',
                            left: stageIndicator.left,
                            top: stageIndicator.top,
                            width: stageIndicator.width,
                            height: stageIndicator.height,
                            background: '#0F172B',
                            borderRadius: '999px',
                            boxShadow: '0 8px 20px rgba(15, 23, 43, 0.24)',
                            transition: 'left 300ms cubic-bezier(.4,0,.2,1), width 300ms cubic-bezier(.4,0,.2,1), top 300ms cubic-bezier(.4,0,.2,1), height 300ms cubic-bezier(.4,0,.2,1)',
                            zIndex: 0,
                          }}
                        />
                      )}
                      {stages.map(({ key, label, icon }) => {
                        const active = examStage === key;
                        return (
                          <button
                            key={key}
                            ref={(el) => { stageTabRefs.current[key] = el; }}
                            onClick={() => { setExamStage(key); setActiveTab('Notes'); setSearchQuery(''); setShowSearch(false); }}
                            className="font-arimo font-bold flex items-center"
                            style={{
                              position: 'relative',
                              zIndex: 1,
                              gap: '6px',
                              padding: isMobile ? '10px 16px' : '12px 22px',
                              flexShrink: 0,
                              borderRadius: '999px',
                              fontSize: '13px',
                              border: 'none',
                              cursor: 'pointer',
                              background: 'transparent',
                              color: active ? '#FFFFFF' : '#17223E',
                              lineHeight: '20px',
                              whiteSpace: 'nowrap',
                              transition: 'color 200ms ease',
                            }}
                          >
                            <span style={{ fontSize: '14px' }}>{icon}</span>
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Content area below header */}
            <div style={{ padding: '0 clamp(24px, 2.5vw, 32px) clamp(24px, 2.5vw, 32px)' }}>

            {/* Tab bar */}
            <div
              style={{
                borderBottom: '2px solid #E5E7EB',
                marginBottom: 'clamp(20px, 2vw, 28px)',
                position: 'relative',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/bottom_ellipse.svg"
                alt=""
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  right: 'calc(-1 * clamp(24px, 2.5vw, 32px))',
                  bottom: '0',
                  width: '187px',
                  height: '172px',
                  pointerEvents: 'none',
                  zIndex: 0,
                }}
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" style={{ position: 'relative', zIndex: 1 }}>
              <div className="flex overflow-x-auto" style={{ gap: 'clamp(20px, 2.5vw, 36px)', maxWidth: '100%', minWidth: 0, scrollbarWidth: 'none' }}>
                {tabs.map((tab) => {
                  const isActive = activeTab === tab;
                  const cfg = TAB_CONFIG[tab];
                  const count = getChaptersForTab(tab).length;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className="font-arimo font-bold"
                      style={{
                        fontSize: 'clamp(12px, 1.05vw, 14px)',
                        color: isActive ? ACTIVE_TAB_COLOR : '#6A7282',
                        background: 'none',
                        border: 'none',
                        borderBottom: isActive ? `2px solid ${ACTIVE_TAB_COLOR}` : '2px solid transparent',
                        padding: 'clamp(8px, 0.8vw, 12px) 0',
                        marginBottom: '-2px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span style={{ fontSize: '16px', lineHeight: 1 }}>{cfg.icon}</span>
                      {tab}
                      <span
                        className="font-arimo font-bold"
                        style={{
                          fontSize: 'clamp(10px, 0.82vw, 12px)',
                          background: isActive ? ACTIVE_TAB_COLOR : ACTIVE_TAB_BG,
                          color: isActive ? '#FFFFFF' : ACTIVE_TAB_COLOR,
                          borderRadius: '999px',
                          padding: '2px clamp(6px, 0.5vw, 8px)',
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search — right side of tab bar */}
              <div className="flex items-center" style={{ gap: '8px', paddingBottom: '2px' }}>
                {showSearch && (
                  <div className="flex items-center" style={{
                    height: '34px',
                    borderRadius: '8px',
                    border: '1px solid #C7D7FF',
                    background: '#F5F8FF',
                    padding: '0 10px',
                    gap: '6px',
                    minWidth: '220px',
                    maxWidth: '300px',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                      <circle cx="11" cy="11" r="7" stroke="#6A7282" strokeWidth="2"/>
                      <path d="M16.5 16.5L21 21" stroke="#6A7282" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={`Search in ${selectedSubject || 'this subject'}...`}
                      className="font-arimo outline-none bg-transparent flex-1 min-w-0"
                      style={{ fontSize: '13px', color: '#101828', border: 'none' }}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        style={{ flexShrink: 0, color: '#9CA3AF', lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    )}
                  </div>
                )}
                <button
                  onClick={() => {
                    const next = !showSearch;
                    setShowSearch(next);
                    if (!next) setSearchQuery('');
                    else setTimeout(() => searchInputRef.current?.focus(), 50);
                  }}
                  className="flex items-center gap-1.5 font-arimo font-bold transition-all"
                  style={{
                    height: '34px',
                    padding: '0 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    border: showSearch ? `1px solid ${ACTIVE_TAB_COLOR}` : '1px solid #E5E7EB',
                    background: showSearch ? ACTIVE_TAB_BG : '#FFFFFF',
                    color: showSearch ? ACTIVE_TAB_COLOR : '#6A7282',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
                    <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Search PDFs
                </button>
              </div>

              </div>
            </div>


            {/* PDF cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {loadingChapters && (
                <div className="font-arimo" style={{ textAlign: 'center', padding: '20px', color: '#6A7282' }}>
                  Loading syllabus PDFs...
                </div>
              )}
              {!loadingChapters && getChaptersForTab(activeTab).length === 0 && (
                <div className="font-arimo" style={{ textAlign: 'center', padding: '32px 20px', color: '#6A7282' }}>
                  {searchQuery.trim()
                    ? <>No PDFs matched <strong>&ldquo;{searchQuery}&rdquo;</strong> in {selectedSubject}.</>
                    : 'No published PDFs in this section yet.'}
                </div>
              )}
              {getChaptersForTab(activeTab).map((material: any, idx: number) => {
                const materialId = material._id || material.id;
                const materialTitle = material.title || material.name || '';
                const materialPages = material.pageCount || material.pages || 0;
                const cardKey = materialId || materialTitle + idx;
                const isHovered = hoveredCard === cardKey;
                const tabColor = ACTIVE_TAB_COLOR;
                return (
                <div
                  key={cardKey}
                  onMouseEnter={() => setHoveredCard(cardKey)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: isMobile ? 'wrap' : 'nowrap',
                    gap: '16px',
                    borderRadius: '14px',
                    border: isHovered ? `1.5px solid ${tabColor}` : '0.8px solid #E5E7EB',
                    padding: '16px',
                    transition: 'all 0.18s ease',
                    boxShadow: isHovered
                      ? `0 4px 20px rgba(0,0,0,0.08), 0 0 0 3px ${tabColor}18`
                      : '0 1px 2px rgba(0,0,0,0.04)',
                    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                    background: isHovered ? '#FAFBFF' : '#FFFFFF',
                    cursor: 'default',
                  }}
                >
                  {/* PDF number */}
                  <div
                    className="font-arimo font-bold"
                    style={{
                      fontSize: '14px',
                      lineHeight: '20px',
                      color: '#99A1AF',
                      minWidth: '32px',
                      textAlign: 'left',
                      flexShrink: 0,
                    }}
                  >
                      {String(idx + 1).padStart(2, '0')}
                  </div>

                  {/* Document icon */}
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: '#F9EDE8',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '18px',
                      flexShrink: 0,
                    }}
                  >
                    {material.isLocked ? '🔒' : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="7" y="3" width="13" height="18" rx="2" fill="#9CA3AF" />
                        <rect x="4" y="6" width="13" height="15" rx="2" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1" />
                        <line x1="7" y1="10" x2="14" y2="10" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" />
                        <line x1="7" y1="13" x2="14" y2="13" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" />
                        <line x1="7" y1="16" x2="11" y2="16" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                    )}
                  </div>

                  {/* Title & subtitle */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      className="font-arimo font-bold"
                      style={{
                        fontSize: '16px',
                        lineHeight: '24px',
                        color: '#101828',
                        marginBottom: '4px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {materialTitle}
                    </div>
                    <div
                      className="font-arimo flex items-center flex-wrap"
                      style={{
                        fontSize: '14px',
                        lineHeight: '20px',
                        color: '#6A7282',
                        gap: '6px',
                      }}
                    >
                      {(() => {
                        const tagStyles = getTagStyles(selectedSubject, material.topicTitle || '', material.subSubjectTitle || '');
                        return (
                          <>
                            {material.topicTitle && (
                              <span
                                className="font-arimo font-bold"
                                style={{
                                  fontSize: '12px',
                                  lineHeight: '18px',
                                  padding: '2px 10px',
                                  borderRadius: '999px',
                                  background: tagStyles.topic.bg,
                                  color: tagStyles.topic.color,
                                }}
                              >
                                {material.topicTitle}
                              </span>
                            )}
                            {material.subSubjectTitle && (
                              <span
                                className="font-arimo font-bold"
                                style={{
                                  fontSize: '12px',
                                  lineHeight: '18px',
                                  padding: '2px 10px',
                                  borderRadius: '999px',
                                  background: tagStyles.subSubject.bg,
                                  color: tagStyles.subSubject.color,
                                }}
                              >
                                {material.subSubjectTitle}
                              </span>
                            )}
                          </>
                        );
                      })()}
                      {(() => {
                        const extras = [
                          materialPages ? `${materialPages} pages` : null,
                          material.isLocked ? 'Locked' : null,
                        ].filter(Boolean).join(' · ');
                        return extras ? <span>{extras}</span> : null;
                      })()}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center" style={{ gap: '10px', flexShrink: 0, flexBasis: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'flex-end' : undefined }}>
                    {material.isLocked ? (
                      /* Unlock & Get PDF — glossy gold, dark text + lock icon */
                      <button
                        className="font-arimo font-bold sm-btn sm-btn-gold sm-shine"
                        onClick={handleGetPdf}
                      >
                        <LockIcon />
                        Unlock &amp; Get PDF
                      </button>
                    ) : (
                      <>
                        {/* Read — ghost (light) button + open-book icon */}
                        <button
                          className="font-arimo font-bold sm-btn sm-btn-ghost"
                          onClick={() => materialId && handleRead(material)}
                          disabled={loadingRead === materialId}
                        >
                          <BookOpenIcon />
                          {loadingRead === materialId ? 'Opening…' : 'Read'}
                        </button>
                        {/* Get PDF — glossy gold + download icon + shine */}
                        <button
                          className="font-arimo font-bold sm-btn sm-btn-gold sm-shine"
                          onClick={handleGetPdf}
                        >
                          <DownloadIcon />
                          Get PDF
                        </button>
                      </>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/*  SECTION 3: WHY RISE WITH JEET BANNER                         */}
        {/* ============================================================ */}
        <div
          style={{
            borderRadius: '24px',
            background: '#060C1C',
            padding: 'clamp(28px, 3vw, 40px) clamp(28px, 3vw, 44px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'clamp(24px, 3vw, 40px)',
            marginBottom: 'clamp(40px, 4vw, 60px)',
            flexWrap: 'wrap' as const,
            position: 'relative',
            overflow: 'hidden',
          }}
        >

          {/* Left side */}
          <div style={{ flex: 1, minWidth: 'clamp(280px, 40vw, 400px)', position: 'relative', zIndex: 1 }}>
            <div
              className="flex items-center gap-2 font-arimo font-bold"
              style={{
                fontSize: 'clamp(10px, 0.82vw, 12px)',
                color: '#DBAC49',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                marginBottom: 'clamp(10px, 1vw, 14px)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" fill="#DBAC49" stroke="#DBAC49" strokeWidth="1" />
              </svg>
              WHY RISE WITH JEET
            </div>
            <h3
              className="font-arimo font-bold"
              style={{
                fontSize: 'clamp(22px, 2.2vw, 30px)',
                lineHeight: 1.3,
                color: '#FFFFFF',
                marginBottom: 'clamp(4px, 0.4vw, 6px)',
              }}
              dangerouslySetInnerHTML={{ __html: bannerTitle }}
            />
            <p
              className="font-arimo"
              style={{
                fontSize: 'clamp(12px, 1.05vw, 14px)',
                lineHeight: 'clamp(18px, 1.8vw, 24px)',
                color: '#94A3B8',
                maxWidth: 'clamp(360px, 36vw, 480px)',
              }}
            >
              {bannerSubtitle}
            </p>
          </div>

          {/* Books image – absolute, center-top of banner, bleeds from top */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/books-stack.png"
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '-20px',
              left: '65%',
              transform: 'translateX(-50%)',
              width: 'clamp(140px, 14vw, 200px)',
              height: 'auto',
              objectFit: 'contain',
              opacity: 0.45,
              zIndex: 0,
              pointerEvents: 'none',
            }}
          />

          {/* Right side – Stats only */}
          <div style={{ flexShrink: 0, zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              className="font-arimo font-bold"
              style={{ fontSize: 'clamp(40px, 4.5vw, 64px)', color: '#E8B84B', lineHeight: 1.1 }}
            >
              {bannerStatNumber}
            </div>
            <div
              className="font-arimo"
              style={{ fontSize: 'clamp(12px, 1vw, 14px)', color: '#94A3B8', textAlign: 'center', marginTop: '8px', lineHeight: '1.5', whiteSpace: 'pre-line' }}
            >
              {bannerStatLabel}
            </div>
          </div>

        </div>

        {/* ============================================================ */}
        {/*  SECTION 4: FEATURE CARDS (heading + 5-up grid)               */}
        {/* ============================================================ */}
        {/* Whole section wrapped in a white card (per reference: `.card p-6 lg:p-8`) */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '18px',
            boxShadow: '0 1px 0 rgba(13,20,36,.04), 0 12px 30px -18px rgba(13,20,36,.18), 0 0 0 1px rgba(13,20,36,.05)',
            padding: 'clamp(24px, 3vw, 32px)',
            marginBottom: 'clamp(40px, 4vw, 60px)',
          }}
        >
          {/* Header — eyebrow + serif title */}
          <div className="flex flex-wrap items-end justify-between" style={{ gap: 'clamp(8px, 1vw, 16px)' }}>
            <div style={{ minWidth: 'min(280px, 100%)' }}>
              <div
                className="font-arimo font-bold"
                style={{
                  fontSize: '10px',
                  color: '#D97706',
                  textTransform: 'uppercase',
                  letterSpacing: '0.22em',
                }}
              >
                WHY ASPIRANTS PICK US
              </div>
              <h3
                className="font-fraunces"
                style={{
                  fontSize: 'clamp(26px, 2.6vw, 30px)',
                  fontWeight: 500,
                  lineHeight: 1.15,
                  color: '#101828',
                  letterSpacing: '-0.01em',
                  marginTop: '4px',
                }}
              >
                Built the way <span style={{ fontStyle: 'italic' }}>UPSC</span> tests you
              </h3>
            </div>
          </div>

          {/* 5-up card grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile
                ? 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))'
                : 'repeat(5, minmax(0, 1fr))',
              gap: '12px',
              marginTop: '20px',
            }}
          >
            {features.map((feature: any) => {
              const Icon = feature.Icon;
              return (
                <div
                  key={feature.title}
                  style={{
                    background: `linear-gradient(to bottom, #FFFFFF, ${feature.tint})`,
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: '0 1px 0 rgba(13,20,36,.04), 0 0 0 1px rgba(13,20,36,.06)',
                  }}
                >
                  {/* Icon — rounded-square tinted box */}
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: feature.iconBg,
                      color: feature.iconColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon />
                  </div>
                  <div
                    className="font-arimo"
                    style={{
                      fontSize: '15px',
                      fontWeight: 600,
                      color: '#101828',
                      marginTop: '12px',
                    }}
                  >
                    {feature.title}
                  </div>
                  <p
                    className="font-arimo"
                    style={{
                      fontSize: '12.5px',
                      lineHeight: 1.5,
                      color: '#64748B',
                      marginTop: '4px',
                    }}
                  >
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
        {/* ============================================================ */}
        {/*  SECTION 6: CTA BANNER                                         */}
        {/* ============================================================ */}
        <div
          style={{
            borderRadius: '24px',
            background: 'linear-gradient(90deg, #FDC700 0%, #FF8904 50%, #FF6900 100%)',
            padding: 'clamp(32px, 3.5vw, 48px) clamp(28px, 3vw, 44px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'clamp(24px, 3vw, 40px)',
            marginBottom: 'clamp(40px, 4vw, 60px)',
            position: 'relative',
            overflow: 'hidden',
            flexWrap: 'wrap' as const,
          }}
        >
          {/* Left side */}
          <div style={{ flex: 1, minWidth: 'clamp(280px, 40vw, 400px)', zIndex: 1 }}>
            <h3
              className="font-arimo font-bold"
              style={{
                fontSize: 'clamp(22px, 2.2vw, 30px)',
                lineHeight: 1.3,
                color: '#101828',
                marginBottom: 'clamp(8px, 0.8vw, 12px)',
              }}
            >
              {ctaTitle}
            </h3>
            <p
              className="font-arimo"
              style={{
                fontSize: 'clamp(13px, 1.2vw, 16px)',
                lineHeight: 'clamp(20px, 1.8vw, 26px)',
                color: '#374151',
                marginBottom: 'clamp(18px, 2vw, 28px)',
                maxWidth: 'clamp(360px, 36vw, 480px)',
              }}
            >
              {ctaSubtitle}
            </p>

            <div className="flex items-center" style={{ gap: 'clamp(10px, 1vw, 14px)', flexWrap: 'wrap' }}>
              <button
                className="font-arimo font-bold"
                style={{
                  background: '#101828',
                  color: '#FFFFFF',
                  borderRadius: '14px',
                  padding: 'clamp(12px, 1.2vw, 16px) clamp(22px, 2vw, 28px)',
                  fontSize: 'clamp(13px, 1.12vw, 15px)',
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {ctaButtonPrimary}
              </button>
              <button
                className="font-arimo font-bold"
                onClick={() => window.open('https://www.youtube.com/@RisewithJeet', '_blank', 'noopener,noreferrer')}
                style={{
                  background: '#FFFFFF',
                  color: '#101828',
                  borderRadius: '14px',
                  padding: 'clamp(12px, 1.2vw, 16px) clamp(22px, 2vw, 28px)',
                  fontSize: 'clamp(13px, 1.12vw, 15px)',
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {ctaButtonSecondary}
              </button>
            </div>
          </div>

          {/* Right side - decorative rocket */}
          <div
            style={{
              position: 'absolute',
              right: 'clamp(20px, 3vw, 40px)',
              top: '50%',
              transform: 'translateY(-50%)',
              width: 'clamp(120px, 12vw, 180px)',
              height: 'clamp(120px, 12vw, 180px)',
              opacity: 0.6,
              pointerEvents: 'none',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/rocket.png"
              alt=""
              aria-hidden="true"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        </div>
      </div>
    </div>

    {/* ── Read Modal – reuses the shared Study-Material PDF viewer ── */}
    {readModal && (
      <StudyMaterialReaderModal
        pages={readModal.pages}
        title={readModal.title}
        subjectLabel={selectedSubject}
        onClose={() => setReadModal(null)}
        onGetPdf={handleGetPdf}
      />
    )}
    </>
  );
}
