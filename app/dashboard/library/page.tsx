'use client';

import React, { useState, useEffect } from 'react';
import { libraryService } from '@/lib/services';
import { useCmsContent } from '@/hooks/useCmsContent';
import DashboardPageHero from '@/components/DashboardPageHero';
import { useIsMobile } from '@/hooks/useIsMobile';

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

const COMING_SOON_SUBJECTS = [
  'Advanced Polity Compendium',
  'Geography Map Workbook',
  'Economy Data Handbook',
  'Environment & Ecology Digest',
  'Science & Technology Updates',
  'History Timeline Archive',
];

const features = [
  { emoji: '\uD83C\uDFAF', bg: '#FEE2E2', title: 'UPSC-First Approach', desc: 'Every line written from the examiner\u2019s lens. No fluff, only what earns marks in Prelims and Mains.' },
  { emoji: '\uD83D\uDD04', bg: '#DBEAFE', title: 'Updated Every Week', desc: 'Budget, new schemes, policy shifts, our notes are refreshed weekly so your prep stays current.' },
  { emoji: '\uD83D\uDC9C', bg: '#EDE9FE', title: 'YouTube + Notes Synced', desc: 'Every PDF maps directly to Jeet Sir\u2019s YouTube lessons. Watch, then revise, the most powerful UPSC loop.' },
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
    sidebar_header_title: 'CHOOSE A SUBJECT',
    section_label_notes: 'FOUNDATIONAL NOTES',
    section_label_pyq: 'PREVIOUS YEAR QUESTIONS',
    banner_badge: 'WHY RISE WITH JEET',
    banner_title: 'Not just notes. A system built to crack UPSC.',
    banner_subtitle: "Every PDF is designed with one obsession, your selection. Here's what makes us different from every other resource out there.",
    banner_stat_number: '15K+',
    banner_stat_label: "Aspirants trust\nRise with Jeet",
    cta_title: 'Ready to start your IAS journey the right way?',
    cta_subtitle: 'Access 100+ PDFs, PYQ notes, and study roadmaps, all designed to help you crack UPSC.',
    cta_button_primary: 'Start Studying',
    cta_button_secondary: 'Watch on YouTube',
  });

  const heroBadge = 'STUDY MATERIAL';
  const heroSubtitle = 'From PYQ-backed notes to concise summaries, everything you need, simplified.';
  const sidebarHeaderTitle = cms?.sidebar_header_title || 'CHOOSE A SUBJECT';
  const sectionLabelNotes = cms?.section_label_notes || 'FOUNDATIONAL NOTES';
  const sectionLabelPyq = cms?.section_label_pyq || 'PREVIOUS YEAR QUESTIONS';
  const bannerTitle = cms?.banner_title || 'Not just notes. A system built to crack UPSC.';
  const bannerSubtitle = "Every PDF is designed with one obsession, your selection. Here's what makes us different from every other resource out there.";
  const bannerStatNumber = cms?.banner_stat_number || '15K+';
  const bannerStatLabel = cms?.banner_stat_label || "Aspirants trust\nRise with Jeet";
  const ctaTitle = cms?.cta_title || 'Ready to start your IAS journey the right way?';
  const ctaSubtitle = 'Access 100+ PDFs, PYQ notes, and study roadmaps, all designed to help you crack UPSC.';
  const ctaButtonPrimary = 'Start Studying';
  const ctaButtonSecondary = cms?.cta_button_secondary || 'Watch on YouTube';
  const features = [
    { emoji: '🎯', bg: '#FEE2E2', title: 'UPSC-First Approach', desc: 'Every line written from the examiner\u2019s lens. No fluff, only what earns marks in Prelims and Mains.' },
    { emoji: '🔄', bg: '#DBEAFE', title: 'Updated Every Week', desc: 'Budget, new schemes, policy shifts, our notes are refreshed weekly so your prep stays current.' },
    { emoji: '💜', bg: '#EDE9FE', title: 'YouTube + Notes Synced', desc: 'Every PDF maps directly to Jeet Sir\u2019s YouTube lessons. Watch, then revise, the most powerful UPSC loop.' },
    { emoji: '📊', bg: '#DCFCE7', title: 'PYQ-Backed Content', desc: 'All notes are reviewed and weighted from 10 years of PYQs, calibrated to what UPSC asks every year.' },
    { emoji: '🏆', bg: '#FFEDD5', title: 'Toppers Trust It', desc: 'Used by 15,000+ aspirants building stronger Prelims, Mains, and interview preparation.' },
  ];

  const isMobile = useIsMobile();
  const [selectedSubject, setSelectedSubject] = useState('');
  const [activeTab, setActiveTab] = useState('Notes');
  const [examStage, setExamStage] = useState<'prelims' | 'mains' | 'optional'>('prelims');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [apiSubjects, setApiSubjects] = useState<any[]>([]);
  const [apiChapters, setApiChapters] = useState<Record<string, any[]>>({});
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [downloadingChapter, setDownloadingChapter] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [readModal, setReadModal] = useState<{ url: string; title: string } | null>(null);
  const [loadingRead, setLoadingRead] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
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

  // Read: fetch URL and open in protected in-app viewer (no download)
  const handleRead = async (material: any) => {
    const materialId = material._id || material.id;
    if (!materialId) return;
    setLoadingRead(materialId);
    try {
      const res: any = await libraryService.getMaterialDownloadUrl(materialId);
      const url = res.data?.url || res.data?.downloadUrl || res.data;
      if (url && typeof url === 'string') {
        setIframeLoaded(false);
        setReadModal({ url, title: material.title || material.name || 'Note' });
      }
    } catch (_e) {}
    finally { setLoadingRead(null); }
  };

  // Get PDF: always go to upgrade/billing
  const handleGetPdf = () => {
    window.location.href = '/dashboard/billing/plans?source=library';
  };

  // Upgrade (locked notes)
  const handleUpgrade = () => {
    window.location.href = '/dashboard/billing/plans?source=library';
  };

  const tabs = ['Notes', 'PYQ Notes', 'Tricks & Mnemonics', 'Current Affairs'] as const;
  type TabKey = typeof tabs[number];

  const TAB_CONFIG: Record<TabKey, { color: string; activeColor: string; activeBg: string; borderColor: string; icon: (active: boolean) => React.ReactNode }> = {
    'Notes': {
      color: '#155DFC', activeColor: '#155DFC', activeBg: '#EFF6FF', borderColor: '#155DFC',
      icon: (active) => (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="1" width="12" height="14" rx="2" fill={active ? '#DBEAFE' : '#F3F4F6'} stroke={active ? '#155DFC' : '#6A7282'} strokeWidth="1.3"/>
          <line x1="5" y1="5" x2="11" y2="5" stroke={active ? '#155DFC' : '#9CA3AF'} strokeWidth="1.2"/>
          <line x1="5" y1="8" x2="11" y2="8" stroke={active ? '#155DFC' : '#9CA3AF'} strokeWidth="1.2"/>
          <line x1="5" y1="11" x2="9" y2="11" stroke={active ? '#155DFC' : '#9CA3AF'} strokeWidth="1.2"/>
        </svg>
      ),
    },
    'PYQ Notes': {
      color: '#D97706', activeColor: '#D97706', activeBg: '#FEF3C7', borderColor: '#D97706',
      icon: (active) => (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="2" width="6" height="12" rx="1" fill={active ? '#FDE68A' : '#F3F4F6'} stroke={active ? '#D97706' : '#6A7282'} strokeWidth="1.2"/>
          <rect x="9" y="2" width="6" height="12" rx="1" fill={active ? '#FDE68A' : '#F3F4F6'} stroke={active ? '#D97706' : '#6A7282'} strokeWidth="1.2"/>
          <line x1="3" y1="5" x2="5" y2="5" stroke={active ? '#D97706' : '#9CA3AF'} strokeWidth="1"/>
          <line x1="3" y1="7.5" x2="5" y2="7.5" stroke={active ? '#D97706' : '#9CA3AF'} strokeWidth="1"/>
          <line x1="11" y1="5" x2="13" y2="5" stroke={active ? '#D97706' : '#9CA3AF'} strokeWidth="1"/>
          <line x1="11" y1="7.5" x2="13" y2="7.5" stroke={active ? '#D97706' : '#9CA3AF'} strokeWidth="1"/>
        </svg>
      ),
    },
    'Tricks & Mnemonics': {
      color: '#7C3AED', activeColor: '#7C3AED', activeBg: '#EDE9FE', borderColor: '#7C3AED',
      icon: (active) => (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 1.5L10 6H14.5L11 9L12.5 13.5L8 11L3.5 13.5L5 9L1.5 6H6L8 1.5Z" fill={active ? '#C4B5FD' : '#E5E7EB'} stroke={active ? '#7C3AED' : '#6A7282'} strokeWidth="1.1" strokeLinejoin="round"/>
        </svg>
      ),
    },
    'Current Affairs': {
      color: '#059669', activeColor: '#059669', activeBg: '#D1FAE5', borderColor: '#059669',
      icon: (active) => (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6.5" fill={active ? '#A7F3D0' : '#F3F4F6'} stroke={active ? '#059669' : '#6A7282'} strokeWidth="1.2"/>
          <path d="M5 8.5L7 10.5L11 6" stroke={active ? '#059669' : '#9CA3AF'} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 4V5.5" stroke={active ? '#059669' : '#9CA3AF'} strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      ),
    },
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
            <div
              style={{
                background: 'linear-gradient(135deg, #0E182D 0%, #172240 100%)',
                borderRadius: '16px 16px 0 0',
                padding: 'clamp(16px, 1.5vw, 20px)',
              }}
            >
              <div
                className="font-arimo font-bold"
                style={{
                  fontSize: 'clamp(10px, 0.9vw, 12px)',
                  color: '#BEDBFF',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  marginBottom: 'clamp(4px, 0.3vw, 6px)',
                }}
              >
                {sidebarHeaderTitle}
              </div>
              <div
                className="font-arimo font-bold"
                style={{
                  fontSize: 'clamp(14px, 1.2vw, 16px)',
                  color: '#FFFFFF',
                }}
              >
                {apiSubjects.length} Active &middot; {COMING_SOON_SUBJECTS.length} Coming Soon
              </div>
            </div>

            {/* Active subjects list */}
            <div style={{ padding: 'clamp(8px, 0.8vw, 12px)' }}>
              {apiSubjects.length === 0 ? (
                <div className="font-arimo" style={{ padding: '12px 16px', color: '#9CA3AF', fontSize: '13px' }}>
                  Loading subjects...
                </div>
              ) : apiSubjects.map((subject) => {
                const isSelected = selectedSubject === subject.name;
                return (
                  <button
                    key={subject.id}
                    onClick={() => { setSelectedSubject(subject.name); setActiveTab('Notes'); setExamStage('prelims'); setSearchQuery(''); setShowSearch(false); }}
                    className="w-full"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'clamp(10px, 1.1vw, 16px)',
                      borderRadius: '14px',
                      background: isSelected ? 'linear-gradient(135deg, #0F1A30 0%, #172240 100%)' : 'linear-gradient(135deg, #EEF4FF 0%, #F8FAFF 100%)',
                      color: isSelected ? '#FFFFFF' : '#101828',
                      border: 'none',
                      cursor: 'pointer',
                      marginBottom: 'clamp(4px, 0.3vw, 6px)',
                      transition: 'all 0.2s ease',
                      textAlign: 'left',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      className="pointer-events-none"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: isSelected ? 0.08 : 0.12,
                        backgroundImage:
                          'linear-gradient(rgba(59,130,246,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.35) 1px, transparent 1px)',
                        backgroundSize: '18px 18px',
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 0.8vw, 12px)', minWidth: 0 }}>
                      <span style={{ fontSize: 'clamp(18px, 1.6vw, 22px)', flexShrink: 0 }}>{subjectIcon(subject.name)}</span>
                      <div style={{ minWidth: 0 }}>
                        <div
                          className="font-arimo font-bold"
                          style={{
                            fontSize: 'clamp(12px, 1.05vw, 14px)',
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
                            fontSize: 'clamp(10px, 0.82vw, 12px)',
                            color: isSelected ? '#94A3B8' : '#6A7282',
                          }}
                        >
                          {subject.pdfCount ?? subject.chapterCount ?? 0} PDFs
                        </div>
                      </div>
                    </div>
                    {(subject.tags?.[0]) && (
                      <div
                        className="font-arimo font-bold"
                        style={{
                          fontSize: 'clamp(9px, 0.75vw, 11px)',
                          color: '#FFFFFF',
                          background: '#16A34A',
                          borderRadius: '4px',
                          padding: 'clamp(2px, 0.3vw, 4px) clamp(6px, 0.6vw, 8px)',
                          flexShrink: 0,
                          letterSpacing: '0.3px',
                        }}
                      >
                        {subject.tags[0].toUpperCase()}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: '#E5E7EB', margin: '0 clamp(8px, 0.8vw, 12px)' }} />

            {/* Coming Soon section */}
            <div style={{ padding: 'clamp(8px, 0.8vw, 12px)' }}>
              <div
                className="font-arimo font-bold"
                style={{
                  fontSize: 'clamp(10px, 0.82vw, 12px)',
                  color: '#9CA3AF',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  padding: 'clamp(8px, 0.8vw, 12px) clamp(10px, 1.1vw, 16px)',
                  marginBottom: 'clamp(2px, 0.2vw, 4px)',
                }}
              >
                COMING SOON
              </div>
              {COMING_SOON_SUBJECTS.map((item) => (
                <div
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'clamp(8px, 0.8vw, 12px)',
                    padding: 'clamp(8px, 0.8vw, 12px) clamp(10px, 1.1vw, 16px)',
                    color: '#9CA3AF',
                    background: 'linear-gradient(135deg, #EEF4FF 0%, #F8FAFF 100%)',
                    borderRadius: '12px',
                    marginBottom: '6px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    className="pointer-events-none"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: 0.08,
                      backgroundImage:
                        'linear-gradient(rgba(59,130,246,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.35) 1px, transparent 1px)',
                      backgroundSize: '18px 18px',
                    }}
                  />
                  <span style={{ fontSize: 'clamp(16px, 1.4vw, 20px)', opacity: 0.5 }}>{'\uD83D\uDCC4'}</span>
                  <div style={{ minWidth: 0 }}>
                    <div
                      className="font-arimo"
                      style={{
                        fontSize: 'clamp(12px, 1.05vw, 14px)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item}
                    </div>
                    <div className="font-arimo" style={{ fontSize: 'clamp(9px, 0.75vw, 11px)' }}>
                      SOON
                    </div>
                  </div>
                </div>
              ))}
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
                padding: 'clamp(24px, 2.5vw, 32px)',
                position: 'relative',
              }}
            >
              <div className="relative z-10">
                {/* Header area */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'clamp(12px, 1.2vw, 16px)', flexWrap: 'wrap' as const, marginBottom: 'clamp(8px, 0.8vw, 10px)' }}>
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
                      {selectedApiSubject?.description ?? ''}
                    </p>
                  </div>

                  {/* Mini stats card */}
                  <div
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '24px',
                      border: '0.8px solid #E5E7EB',
                      boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.08)',
                      padding: isMobile ? '16px 24px' : '20px 48px',
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
                    <div style={{ width: '1px', height: '48px', background: '#E5E7EB' }} />
                    <div className="flex flex-col items-center">
                      <div className="font-arimo font-bold" style={{ fontSize: isMobile ? '32px' : '40px', color: '#C68A0B', lineHeight: 1.1 }}>
                        {selectedApiSubject?.pageCount ?? selectedApiSubject?.pages ?? selectedApiSubject?.chapterCount ?? 0}
                      </div>
                      <div className="font-arimo" style={{ fontSize: '14px', color: '#6A7282' }}>
                        Pages
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
                        gap: '8px',
                        padding: '5px',
                        background: '#F3F4F6',
                        borderRadius: '12px',
                        display: 'inline-flex',
                        maxWidth: '100%',
                        overflowX: 'auto',
                        scrollbarWidth: 'none',
                      }}
                    >
                      {stages.map(({ key, label, icon }) => {
                        const active = examStage === key;
                        return (
                          <button
                            key={key}
                            onClick={() => { setExamStage(key); setActiveTab('Notes'); setSearchQuery(''); setShowSearch(false); }}
                            className="font-arimo font-bold flex items-center transition-all"
                            style={{
                              gap: '6px',
                              padding: isMobile ? '7px 12px' : '7px 18px',
                              flexShrink: 0,
                              borderRadius: '8px',
                              fontSize: '13px',
                              border: 'none',
                              cursor: 'pointer',
                              background: active ? '#FFFFFF' : 'transparent',
                              color: active ? '#101828' : '#6A7282',
                              boxShadow: active ? '0px 1px 3px rgba(0,0,0,0.12)' : 'none',
                              lineHeight: '20px',
                              whiteSpace: 'nowrap',
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
                        color: isActive ? cfg.activeColor : '#6A7282',
                        background: 'none',
                        border: 'none',
                        borderBottom: isActive ? `2px solid ${cfg.borderColor}` : '2px solid transparent',
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
                      {cfg.icon(isActive)}
                      {tab}
                      <span
                        className="font-arimo font-bold"
                        style={{
                          fontSize: 'clamp(10px, 0.82vw, 12px)',
                          background: isActive ? cfg.activeBg : '#F3F4F6',
                          color: isActive ? cfg.activeColor : '#6A7282',
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
                    border: showSearch ? `1px solid ${TAB_CONFIG[activeTab as TabKey]?.activeColor ?? '#155DFC'}` : '1px solid #E5E7EB',
                    background: showSearch ? (TAB_CONFIG[activeTab as TabKey]?.activeBg ?? '#EFF6FF') : '#FFFFFF',
                    color: showSearch ? (TAB_CONFIG[activeTab as TabKey]?.activeColor ?? '#155DFC') : '#6A7282',
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
                const materialSize = material.fileSize
                  ? `${(material.fileSize / (1024 * 1024)).toFixed(1)} MB`
                  : material.size || '';
                const cardKey = materialId || materialTitle + idx;
                const isHovered = hoveredCard === cardKey;
                const tabColor = TAB_CONFIG[activeTab as TabKey]?.activeColor ?? '#155DFC';
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
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#FEF2F2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M6 2H11L16 7V17C16 17.5523 15.5523 18 15 18H6C5.44772 18 5 17.5523 5 17V3C5 2.44772 5.44772 2 6 2Z" fill="#EF4444" opacity="0.85" />
                      <path d="M11 2V7H16" fill="#FECACA" />
                      <path d="M11 2L16 7" stroke="#DC2626" strokeWidth="0.5" />
                      <path d="M11 2V6C11 6.55228 11.4477 7 12 7H16" stroke="#DC2626" strokeWidth="0.5" fill="#FECACA" />
                    </svg>
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
                      className="font-arimo"
                      style={{
                        fontSize: '14px',
                        lineHeight: '20px',
                        color: '#6A7282',
                      }}
                    >
                      {'\uD83D\uDCC4'} {material.topicTitle} · {material.subSubjectTitle}
                      {materialPages ? ` · ${materialPages} pages` : ''}
                      {materialSize ? ` · ${materialSize}` : ''}
                      {material.isLocked ? ' · Locked' : ''}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center" style={{ gap: '10px', flexShrink: 0, flexBasis: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'flex-end' : undefined }}>
                    {material.isLocked ? (
                      <>
                        {/* Unlock */}
                        <button
                          className="font-arimo font-bold active:translate-y-[3px]"
                          onClick={handleUpgrade}
                          style={{
                            fontSize: '13px',
                            background: '#EDE9FE',
                            color: '#6D28D9',
                            borderRadius: '10px',
                            height: '38px',
                            padding: '0 18px',
                            border: '1.5px solid #C4B5FD',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '7px',
                            boxShadow: '0 4px 0 0 #A78BFA',
                            transition: 'transform 0.08s ease, box-shadow 0.08s ease',
                          }}
                        >
                          <span style={{ fontSize: '15px', lineHeight: 1 }}>🔒</span>
                          Unlock
                        </button>
                        {/* Upgrade */}
                        <button
                          className="font-arimo font-bold active:translate-y-[3px]"
                          onClick={handleUpgrade}
                          style={{
                            fontSize: '13px',
                            background: '#F59E0B',
                            color: '#FFFFFF',
                            borderRadius: '10px',
                            height: '38px',
                            padding: '0 18px',
                            border: '1.5px solid #D97706',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '7px',
                            boxShadow: '0 4px 0 0 #B45309',
                            transition: 'transform 0.08s ease, box-shadow 0.08s ease',
                          }}
                        >
                          <span style={{ fontSize: '15px', lineHeight: 1 }}>✦</span>
                          Upgrade
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Read — opens protected in-app viewer */}
                        <button
                          className="font-arimo font-bold active:translate-y-[3px]"
                          onClick={() => materialId && handleRead(material)}
                          disabled={loadingRead === materialId}
                          style={{
                            fontSize: '13px',
                            background: '#F0FDF4',
                            color: '#166534',
                            borderRadius: '10px',
                            height: '38px',
                            padding: '0 18px',
                            border: '1.5px solid #86EFAC',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '7px',
                            opacity: loadingRead === materialId ? 0.6 : 1,
                            boxShadow: '0 4px 0 0 #4ADE80',
                            transition: 'transform 0.08s ease, box-shadow 0.08s ease',
                          }}
                        >
                          <span style={{ fontSize: '15px', lineHeight: 1 }}>📖</span>
                          {loadingRead === materialId ? 'Opening…' : 'Read'}
                        </button>
                        {/* Get PDF — always goes to upgrade */}
                        <button
                          className="font-arimo font-bold active:translate-y-[3px]"
                          onClick={handleGetPdf}
                          style={{
                            fontSize: '13px',
                            background: '#F59E0B',
                            color: '#FFFFFF',
                            borderRadius: '10px',
                            height: '38px',
                            padding: '0 18px',
                            border: '1.5px solid #D97706',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '7px',
                            boxShadow: '0 4px 0 0 #B45309',
                            transition: 'transform 0.08s ease, box-shadow 0.08s ease',
                          }}
                        >
                          <span style={{ fontSize: '15px', lineHeight: 1 }}>⬇️</span>
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
        {/*  SECTION 4: FEATURE CARDS (3x2 grid)                          */}
        {/* ============================================================ */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))',
            gap: 'clamp(14px, 1.5vw, 24px)',
            marginBottom: 'clamp(40px, 4vw, 60px)',
          }}
        >
          {features.map((feature: any) => (
            <div
              key={feature.title}
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '0.8px solid #E5E7EB',
                padding: 'clamp(18px, 2vw, 24px)',
                boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.06)',
              }}
            >
              {/* Icon circle */}
              <div
                style={{
                  width: 'clamp(40px, 3.6vw, 48px)',
                  height: 'clamp(40px, 3.6vw, 48px)',
                  borderRadius: '50%',
                  background: feature.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'clamp(12px, 1.2vw, 16px)',
                }}
              >
                <span style={{ fontSize: 'clamp(18px, 1.6vw, 22px)' }}>{feature.emoji}</span>
              </div>
              <h4
                className="font-arimo font-bold"
                style={{
                  fontSize: 'clamp(15px, 1.35vw, 18px)',
                  color: '#101828',
                  marginBottom: 'clamp(6px, 0.6vw, 8px)',
                }}
              >
                {feature.title}
              </h4>
              <p
                className="font-arimo"
                style={{
                  fontSize: 'clamp(12px, 1.05vw, 14px)',
                  lineHeight: 'clamp(18px, 1.6vw, 22px)',
                  color: '#4A5565',
                }}
              >
                {feature.desc}
              </p>
            </div>
          ))}
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

    {/* ── Read Modal – protected in-app viewer ── */}
    {readModal && (
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style={{ background: 'rgba(10,14,26,0.72)', backdropFilter: 'blur(8px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) setReadModal(null); }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* shimmer keyframes */}
        <style>{`
          @keyframes rwj-shimmer {
            0%   { background-position: -500px 0; }
            100% { background-position: 500px 0; }
          }
        `}</style>

        <div
          className="flex flex-col w-full"
          style={{
            maxWidth: '820px',
            height: 'min(92vh, 920px)',
            borderRadius: '18px',
            overflow: 'hidden',
            boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
            background: '#FFFFFF',
            userSelect: 'none',
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* ── Header – matches image style ── */}
          <div
            className="flex items-center justify-between flex-shrink-0"
            style={{
              background: '#FFFFFF',
              borderBottom: '1px solid #E5E7EB',
              padding: '12px 18px',
              gap: '12px',
            }}
          >
            {/* Left: icon + title + subtitle */}
            <div className="flex items-center gap-3 min-w-0">
              <div style={{
                width: '34px', height: '34px', borderRadius: '9px',
                background: '#EFF6FF', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ fontSize: '17px' }}>📄</span>
              </div>
              <div className="min-w-0">
                <p className="font-arimo font-bold truncate" style={{ fontSize: '14px', color: '#101828', lineHeight: '20px' }}>
                  {readModal.title}
                </p>
                <p className="font-arimo" style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '1px' }}>
                  {selectedSubject} · View only
                </p>
              </div>
            </div>

            {/* Right: lock badge + upgrade + close */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="font-arimo font-bold" style={{
                fontSize: '10px', padding: '3px 9px', borderRadius: '20px',
                background: '#FEF3C7', color: '#D97706', letterSpacing: '0.4px',
                whiteSpace: 'nowrap',
              }}>
                🔒 VIEW ONLY
              </div>
              <button
                onClick={handleGetPdf}
                className="font-arimo font-bold active:translate-y-[1px] flex items-center gap-1.5"
                style={{
                  fontSize: '12px', background: '#F59E0B', color: '#fff',
                  borderRadius: '8px', height: '30px', padding: '0 12px',
                  border: '1.5px solid #D97706', cursor: 'pointer',
                  boxShadow: '0 3px 0 0 #B45309',
                  transition: 'transform 0.08s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                ⬇️ Get PDF
              </button>
              <button
                onClick={() => setReadModal(null)}
                style={{
                  width: '30px', height: '30px', borderRadius: '8px',
                  background: '#F3F4F6', border: '1px solid #E5E7EB',
                  color: '#6B7280', cursor: 'pointer', fontSize: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* ── Viewer area with watermark + iframe ── */}
          <div
            className="flex-1 relative overflow-hidden"
            style={{ background: '#E8ECF3', userSelect: 'none' }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Loading skeleton */}
            {!iframeLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5"
                style={{ background: '#F1F4FA', zIndex: 20 }}>
                <div style={{
                  width: '220px', height: '290px', borderRadius: '10px',
                  background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)',
                  backgroundSize: '500px 100%',
                  animation: 'rwj-shimmer 1.4s infinite linear',
                  boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
                }} />
                <div style={{ textAlign: 'center' }}>
                  <p className="font-arimo font-bold" style={{ fontSize: '14px', color: '#374151' }}>Loading note…</p>
                  <p className="font-arimo" style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>Fetching from secure storage</p>
                </div>
              </div>
            )}

            {/* Google Docs viewer iframe */}
            <iframe
              key={readModal.url}
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(readModal.url)}&embedded=true`}
              style={{
                width: '100%', height: '100%',
                border: 'none', display: 'block',
                opacity: iframeLoaded ? 1 : 0,
                transition: 'opacity 0.35s ease',
              }}
              title={readModal.title}
              onLoad={() => setIframeLoaded(true)}
              allow="fullscreen"
            />

            {/* ── Watermark overlay ──
                Sits above the iframe (pointer-events:none so scroll is unaffected).
                The repeated diagonal text appears in any screenshot. */}
            {iframeLoaded && (
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 10,
                  pointerEvents: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'%3E%3Ctext transform='rotate(-32 160 90)' x='8' y='100' font-family='Arial,sans-serif' font-size='13' font-weight='bold' fill='rgba(17%2C24%2C39%2C0.07)' letter-spacing='1'%3ERISE WITH JEET • VIEW ONLY%3C/text%3E%3C/svg%3E")`,
                  backgroundRepeat: 'repeat',
                  backgroundSize: '320px 180px',
                }}
              />
            )}
          </div>

          {/* ── Footer ── */}
          <div
            className="flex items-center justify-between flex-shrink-0"
            style={{
              background: '#FAFAFA',
              borderTop: '1px solid #E5E7EB',
              padding: '9px 18px',
            }}
          >
            <p className="font-arimo" style={{ fontSize: '11px', color: '#9CA3AF' }}>
              🛡️ Protected · watermarked · right-click & selection disabled
            </p>
            <button
              onClick={handleGetPdf}
              className="font-arimo font-bold active:translate-y-[1px] flex items-center gap-2"
              style={{
                fontSize: '12px', background: '#17223E', color: '#FFD272',
                borderRadius: '9px', height: '34px', padding: '0 16px',
                border: 'none', cursor: 'pointer',
                boxShadow: '0 3px 0 0 #0A1220',
                transition: 'transform 0.08s ease',
              }}
            >
              ✦ Upgrade to Download
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
