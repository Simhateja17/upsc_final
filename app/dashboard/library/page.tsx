'use client';

import React, { useState, useEffect } from 'react';
import { libraryService, pricingService } from '@/lib/services';
import { useCmsContent } from '@/hooks/useCmsContent';
import DashboardPageHero from '@/components/DashboardPageHero';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const SUBJECT_ICONS: Record<string, string> = {
  'polity': '\uD83C\uDFDB\uFE0F',
  'history': '\uD83D\uDCDC',
  'geography': '\uD83C\uDF0D',
  'economy': '\uD83D\uDCCA',
  'environment': '\uD83C\uDF3F',
  'science': '\uD83D\uDD2C',
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
  { emoji: '\uD83C\uDFAF', bg: '#FEE2E2', title: 'UPSC-First Approach', desc: 'Every line written from the examiner\u2019s lens. No fluff \u2014 only what earns marks in Prelims and Mains.' },
  { emoji: '\uD83D\uDD04', bg: '#DBEAFE', title: 'Updated Every Week', desc: 'Budget, new schemes, policy shifts \u2014 our notes are refreshed weekly so you\u2019re study outcomes.' },
  { emoji: '\uD83D\uDC9C', bg: '#EDE9FE', title: 'YouTube + Notes Synced', desc: 'Every PDF maps directly to Jeet Sir\u2019s YouTube lessons. Watch, then revise \u2014 the most powerful UPSC loop.' },
  { emoji: '\uD83C\uDF81', bg: '#FEF3C7', title: 'Free. Forever. No Catch.', desc: 'No paywalls, no \u2018premium only\u2019 tricks. Quality UPSC preparation should never be gated behind money.' },
  { emoji: '\uD83D\uDCCA', bg: '#DCFCE7', title: 'PYQ-Backed Content', desc: 'All notes reviewed, weightaged from 10-years of PYQs \u2014 calibrated to exactly what UPSC asks every year.' },
  { emoji: '\uD83C\uDFC6', bg: '#FFEDD5', title: 'Toppers Trust It', desc: 'Used by 94,000+ aspirants including students who cleared Prelims, Mains, and made it to the interview.' },
];

const heroStats = [
  { number: '100', suffix: '+', label: 'FREE PDFs', numberColor: '#F5C75D' },
  { number: '25', suffix: '+', label: 'PYQ-BACKED NOTES', numberColor: '#FF6B6B' },
  { number: '1L', suffix: '+', label: 'DOWNLOADS', numberColor: '#10B981' },
  { number: '\u221E', suffix: '', label: 'ALWAYS FREE', numberColor: '#FFFFFF' },
];

const bottomStats = [
  { number: '94K', suffix: '+', label: 'ACTIVE ASPIRANTS', suffixColor: '#155DFC' },
  { number: '280', suffix: '+', label: 'FREE PDFS', suffixColor: '#EA580C' },
  { number: '500', suffix: '+', label: 'PYQS SOLVED', suffixColor: '#155DFC' },
  { number: '100', suffix: '%', label: 'ALWAYS FREE', suffixColor: '#16A34A' },
];


/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function LibraryPage() {
  const { content: cms } = useCmsContent('dashboard/library', {
    hero_badge: 'FREE STUDY MATERIALS',
    hero_title: 'Master UPSC with Expert Notes and Free Resources',
    hero_subtitle: 'From PYQ-backed notes to concise summaries — everything you need, free.',
    hero_stats: JSON.stringify([
      { value: '100+', label: 'Free PDFs', color: '#FDC700' },
      { value: '25+', label: 'PYQ-Backed Notes', color: '#F87171' },
      { value: '1L+', label: 'Downloads', color: '#4ADE80' },
      { value: '∞', label: 'Always Free', color: '#FFFFFF' },
    ]),
    sidebar_header_title: 'CHOOSE A SUBJECT',
    section_label_notes: 'FOUNDATIONAL NOTES',
    section_label_pyq: 'PREVIOUS YEAR QUESTIONS',
    banner_badge: 'WHY RISE WITH JEET',
    banner_title: 'Not just notes. A system built to crack UPSC.',
    banner_subtitle: "Every PDF is designed with one obsession — your selection. Here's what makes us different from every other resource out there.",
    banner_stat_number: '15K+',
    banner_stat_label: "Aspirants trust\nRise with Jeet",
    testimonials_badge: 'ASPIRANT STORIES',
    testimonials_title: 'What UPSC Aspirants Say',
    cta_title: 'Ready to start your IAS journey the right way?',
    cta_subtitle: 'Access 360+ free PDFs, PYQ notes, and study roadmaps — all designed to help you crack UPSC on your first attempt.',
    cta_button_primary: 'Start Studying Free',
    cta_button_secondary: 'Watch on YouTube',
  });

  const heroBadge = cms?.hero_badge || 'FREE STUDY MATERIALS';
  const heroTitle = cms?.hero_title || 'Master UPSC with Expert Notes and Free Resources';
  const heroSubtitle = cms?.hero_subtitle || 'From PYQ-backed notes to concise summaries — everything you need, free.';
  const heroStats = (() => { try { return JSON.parse(cms?.hero_stats || '[]'); } catch { return []; } })();
  const sidebarHeaderTitle = cms?.sidebar_header_title || 'CHOOSE A SUBJECT';
  const sectionLabelNotes = cms?.section_label_notes || 'FOUNDATIONAL NOTES';
  const sectionLabelPyq = cms?.section_label_pyq || 'PREVIOUS YEAR QUESTIONS';
  const bannerBadge = cms?.banner_badge || 'WHY RISE WITH JEET';
  const bannerTitle = cms?.banner_title || 'Not just notes. A system built to crack UPSC.';
  const bannerSubtitle = cms?.banner_subtitle || "Every PDF is designed with one obsession — your selection. Here's what makes us different from every other resource out there.";
  const bannerStatNumber = cms?.banner_stat_number || '15K+';
  const bannerStatLabel = cms?.banner_stat_label || "Aspirants trust\nRise with Jeet";
  const testimonialsBadge = cms?.testimonials_badge || 'ASPIRANT STORIES';
  const testimonialsTitle = cms?.testimonials_title || 'What UPSC Aspirants Say';
  const ctaTitle = cms?.cta_title || 'Ready to start your IAS journey the right way?';
  const ctaSubtitle = cms?.cta_subtitle || 'Access 360+ free PDFs, PYQ notes, and study roadmaps — all designed to help you crack UPSC on your first attempt.';
  const ctaButtonPrimary = cms?.cta_button_primary || 'Start Studying Free';
  const ctaButtonSecondary = cms?.cta_button_secondary || 'Watch on YouTube';
  const cmsFeatures = (() => { try { return JSON.parse(cms?.features || '[]'); } catch { return []; } })();
  const cmsBottomStats = (() => { try { return JSON.parse(cms?.bottom_stats || '[]'); } catch { return []; } })();

  const features = cmsFeatures.length > 0 ? cmsFeatures : [
    { emoji: '🎯', bg: '#FEE2E2', title: 'UPSC-First Approach', desc: 'Every line written from the examiner\u2019s lens. No fluff \u2014 only what earns marks in Prelims and Mains.' },
    { emoji: '🔄', bg: '#DBEAFE', title: 'Updated Every Week', desc: 'Budget, new schemes, policy shifts \u2014 our notes are refreshed weekly so you\u2019re study outcomes.' },
    { emoji: '💜', bg: '#EDE9FE', title: 'YouTube + Notes Synced', desc: 'Every PDF maps directly to Jeet Sir\u2019s YouTube lessons. Watch, then revise \u2014 the most powerful UPSC loop.' },
    { emoji: '🎁', bg: '#FEF3C7', title: 'Free. Forever. No Catch.', desc: 'No paywalls, no \u2018premium only\u2019 tricks. Quality UPSC preparation should never be gated behind money.' },
    { emoji: '📊', bg: '#DCFCE7', title: 'PYQ-Backed Content', desc: 'All notes reviewed, weightaged from 10-years of PYQs \u2014 calibrated to exactly what UPSC asks every year.' },
    { emoji: '🏆', bg: '#FFEDD5', title: 'Toppers Trust It', desc: 'Used by 94,000+ aspirants including students who cleared Prelims, Mains, and made it to the interview.' },
  ];

  const bottomStats = cmsBottomStats.length > 0 ? cmsBottomStats : [
    { number: '94K', suffix: '+', label: 'ACTIVE ASPIRANTS', suffixColor: '#155DFC' },
    { number: '280', suffix: '+', label: 'FREE PDFS', suffixColor: '#EA580C' },
    { number: '500', suffix: '+', label: 'PYQS SOLVED', suffixColor: '#155DFC' },
    { number: '100', suffix: '%', label: 'ALWAYS FREE', suffixColor: '#16A34A' },
  ];

  const [selectedSubject, setSelectedSubject] = useState('');
  const [activeTab, setActiveTab] = useState('Notes');
  const [apiSubjects, setApiSubjects] = useState<any[]>([]);
  const [apiChapters, setApiChapters] = useState<Record<string, any[]>>({});
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [downloadingChapter, setDownloadingChapter] = useState<string | null>(null);
  const [apiTestimonials, setApiTestimonials] = useState<any[]>([]);

  const selectedApiSubject = apiSubjects.find(s => s.name === selectedSubject) ?? null;

  // Fetch subjects and testimonials on mount
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

    pricingService.getTestimonials()
      .then((res: any) => {
        const items = res?.data ?? [];
        setApiTestimonials(Array.isArray(items) ? items : []);
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

  // Handle PDF download via API
  const handleDownload = async (chapter: any) => {
    const chapterId = chapter._id || chapter.id;
    if (!chapterId) return;
    setDownloadingChapter(chapterId);
    try {
      const res: any = await libraryService.getDownloadUrl(chapterId);
      const url = res.data?.url || res.data?.downloadUrl || res.data;
      if (url && typeof url === 'string') {
        window.open(url, '_blank');
      }
    } catch (_e) {
      // Download not available
    } finally {
      setDownloadingChapter(null);
    }
  };

  const tabs = ['Notes', 'PYQ Notes'] as const;

  const getChaptersForTab = (tab: string) => {
    const apiChapterList = apiChapters[selectedSubject];
    if (apiChapterList && apiChapterList.length > 0) {
      const filtered = apiChapterList.filter(
        (c: any) => c.category === tab || c.type === tab
      );
      if (filtered.length > 0) return filtered;
      if (tab === 'Notes') return apiChapterList;
    }
    return [];
  };

  return (
    <div
      className="font-arimo w-full min-h-screen"
      style={{ background: '#F9FAFB' }}
    >
      <DashboardPageHero
        badgeIcon={<img src="/cap.png" alt="cap" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />}
        badgeText={heroBadge}
        title={
          <>
            {heroTitle}
          </>
        }
        subtitle={heroSubtitle}
        stats={heroStats.length > 0 ? heroStats : [
          { value: '100+', label: 'Free PDFs', color: '#FDC700' },
          { value: '25+', label: 'PYQ-Backed Notes', color: '#F87171' },
          { value: '1L+', label: 'Downloads', color: '#4ADE80' },
          { value: '∞', label: 'Always Free', color: '#FFFFFF' },
        ]}
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
            gap: 'clamp(16px, 2vw, 28px)',
            alignItems: 'flex-start',
            marginBottom: 'clamp(40px, 4vw, 60px)',
            flexWrap: 'wrap' as const,
          }}
        >
          {/* ── Left Sidebar ── */}
          <div
            style={{
              width: 'clamp(240px, 24vw, 310px)',
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
                    onClick={() => { setSelectedSubject(subject.name); setActiveTab('Notes'); }}
                    className="w-full"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'clamp(10px, 1.1vw, 16px)',
                      borderRadius: '14px',
                      background: isSelected ? '#0F1A30' : '#F9FAFB',
                      color: isSelected ? '#FFFFFF' : '#101828',
                      border: 'none',
                      cursor: 'pointer',
                      marginBottom: 'clamp(4px, 0.3vw, 6px)',
                      transition: 'all 0.2s ease',
                      textAlign: 'left',
                    }}
                  >
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
                  }}
                >
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
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '0.8px solid #E5E7EB',
              boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Subject header with bluish grid texture */}
            <div
              style={{
                background: 'linear-gradient(135deg, #E8EEF8 0%, #F0F4FB 100%)',
                padding: 'clamp(18px, 2vw, 28px)',
                position: 'relative',
                overflow: 'hidden',
                borderBottom: '0.8px solid #E5E7EB',
              }}
            >
              {/* Grid texture overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  opacity: 0.08,
                  backgroundImage:
                    'linear-gradient(rgba(59,130,246,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.4) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Decorative ellipse */}
              <div style={{
                position: 'absolute',
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: 'rgba(171,197,255,0.15)',
                top: '-80px',
                right: '-40px',
                pointerEvents: 'none',
              }} />

              <div className="relative z-10">
                {/* Header area */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'clamp(12px, 1.2vw, 16px)', flexWrap: 'wrap' as const, marginBottom: 'clamp(12px, 1.2vw, 16px)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2
                      className="font-arimo font-bold"
                      style={{
                        fontSize: 'clamp(22px, 2.2vw, 30px)',
                        color: '#101828',
                        marginBottom: 'clamp(6px, 0.6vw, 10px)',
                        lineHeight: 1.2,
                      }}
                    >
                      {selectedApiSubject?.name ?? selectedSubject}
                    </h2>
                    <p
                      className="font-arimo"
                      style={{
                        fontSize: 'clamp(12px, 1.05vw, 14px)',
                        lineHeight: 'clamp(18px, 1.6vw, 22px)',
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
                      padding: 'clamp(10px, 1vw, 14px) clamp(16px, 1.5vw, 22px)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'clamp(12px, 1.2vw, 18px)',
                      flexShrink: 0,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Decorative ellipses */}
                    <div style={{
                      position: 'absolute',
                      width: '252px',
                      height: '134px',
                      borderRadius: '50%',
                      background: '#ABC5FF30',
                      top: '-40px',
                      left: '-60px',
                      pointerEvents: 'none',
                    }} />
                    <div style={{
                      position: 'absolute',
                      width: '170.472px',
                      height: '187.861px',
                      borderRadius: '50%',
                      background: '#ABC5FF30',
                      transform: 'rotate(-90.622deg)',
                      bottom: '-60px',
                      right: '-50px',
                      pointerEvents: 'none',
                    }} />
                    <div className="flex flex-col items-center">
                      <div className="font-arimo font-bold" style={{ fontSize: 'clamp(20px, 2vw, 28px)', color: '#101828', lineHeight: 1.2 }}>
                        {selectedApiSubject?.pdfCount ?? 0}
                      </div>
                      <div className="font-arimo" style={{ fontSize: 'clamp(10px, 0.82vw, 12px)', color: '#6A7282' }}>
                        PDFs
                      </div>
                    </div>
                    <div style={{ width: '1px', height: 'clamp(24px, 2.5vw, 36px)', background: '#E5E7EB' }} />
                    <div className="flex flex-col items-center">
                      <div className="font-arimo font-bold" style={{ fontSize: 'clamp(20px, 2vw, 28px)', color: '#C68A0B', lineHeight: 1.2 }}>
                        {selectedApiSubject?.pageCount ?? selectedApiSubject?.pages ?? selectedApiSubject?.chapterCount ?? 0}
                      </div>
                      <div className="font-arimo" style={{ fontSize: 'clamp(10px, 0.82vw, 12px)', color: '#6A7282' }}>
                        Pages
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags row */}
                <div
                  className="flex items-center"
                  style={{
                    gap: 'clamp(10px, 1.2vw, 16px)',
                    flexWrap: 'wrap',
                  }}
                >
                  {(selectedApiSubject?.tags ?? []).map((tag: string) => (
                    <span
                      key={tag}
                      className="font-arimo"
                      style={{
                        fontSize: 'clamp(12px, 1.05vw, 14px)',
                        color: '#4A5565',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Content area below header */}
            <div style={{ padding: 'clamp(18px, 2vw, 28px)' }}>

            {/* Tab bar */}
            <div style={{ borderBottom: '2px solid #E5E7EB', marginBottom: 'clamp(20px, 2vw, 28px)' }}>
              <div className="flex" style={{ gap: 'clamp(20px, 2.5vw, 36px)' }}>
                {tabs.map((tab) => {
                  const isActive = activeTab === tab;
                  const count = getChaptersForTab(tab).length;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className="font-arimo font-bold"
                      style={{
                        fontSize: 'clamp(13px, 1.12vw, 15px)',
                        color: isActive ? '#155DFC' : '#6A7282',
                        background: 'none',
                        border: 'none',
                        borderBottom: isActive ? '2px solid #155DFC' : '2px solid transparent',
                        padding: 'clamp(8px, 0.8vw, 12px) 0',
                        marginBottom: '-2px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'clamp(6px, 0.5vw, 8px)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {tab}
                      <span
                        className="font-arimo font-bold"
                        style={{
                          fontSize: 'clamp(10px, 0.82vw, 12px)',
                          background: isActive ? '#EFF6FF' : '#F3F4F6',
                          color: isActive ? '#155DFC' : '#6A7282',
                          borderRadius: '26843500px',
                          padding: '2px clamp(6px, 0.5vw, 8px)',
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section label */}
            <div
              className="font-arimo font-bold"
              style={{
                fontSize: 'clamp(10px, 0.82vw, 12px)',
                color: '#6A7282',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                marginBottom: 'clamp(12px, 1.2vw, 16px)',
              }}
            >
              {activeTab === 'Notes' ? sectionLabelNotes : sectionLabelPyq}
            </div>

            {/* Chapter cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1vw, 14px)' }}>
              {loadingChapters && (
                <div className="font-arimo" style={{ textAlign: 'center', padding: '20px', color: '#6A7282' }}>
                  Loading chapters...
                </div>
              )}
              {getChaptersForTab(activeTab).map((chapter: any, idx: number) => {
                const chapterId = chapter._id || chapter.id;
                const chapterTitle = chapter.title || chapter.name || '';
                const chapterPages = chapter.pages || 0;
                const chapterSize = chapter.size || '';
                return (
                <div
                  key={chapterTitle + idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'clamp(12px, 1.2vw, 16px)',
                    borderRadius: '14px',
                    border: '0.8px solid #E5E7EB',
                    padding: 'clamp(12px, 1.2vw, 16px)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Chapter number */}
                  <div
                    className="font-arimo font-bold"
                    style={{
                      fontSize: 'clamp(16px, 1.6vw, 22px)',
                      color: '#9CA3AF',
                      minWidth: 'clamp(28px, 2.5vw, 36px)',
                      textAlign: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </div>

                  {/* Document icon */}
                  <div
                    style={{
                      width: 'clamp(36px, 3.2vw, 44px)',
                      height: 'clamp(36px, 3.2vw, 44px)',
                      borderRadius: '50%',
                      background: '#FEE2E2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: 'clamp(16px, 1.4vw, 20px)' }}>{'\uD83D\uDCC4'}</span>
                  </div>

                  {/* Title & subtitle */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      className="font-arimo font-bold"
                      style={{
                        fontSize: 'clamp(13px, 1.12vw, 15px)',
                        color: '#101828',
                        marginBottom: '2px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {chapterTitle}
                    </div>
                    <div
                      className="font-arimo"
                      style={{
                        fontSize: 'clamp(11px, 0.9vw, 13px)',
                        color: '#6A7282',
                      }}
                    >
                      {chapterPages} pages{chapterSize ? ` | ${chapterSize}` : ''}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center" style={{ gap: 'clamp(6px, 0.6vw, 10px)', flexShrink: 0 }}>
                    <button
                      className="font-arimo font-bold"
                      onClick={() => chapterId && handleDownload(chapter)}
                      style={{
                        fontSize: 'clamp(12px, 1.05vw, 14px)',
                        background: '#FFD274',
                        color: '#17223E',
                        borderRadius: '10px',
                        padding: 'clamp(6px, 0.6vw, 8px) clamp(14px, 1.3vw, 18px)',
                        border: 'none',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        opacity: downloadingChapter === chapterId ? 0.6 : 1,
                      }}
                    >
                      <img src="/bbook.png" alt="read" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                      {downloadingChapter === chapterId ? 'Opening...' : 'Read'}
                    </button>
                    <button
                      className="font-arimo font-bold"
                      onClick={() => chapterId && handleDownload(chapter)}
                      style={{
                        fontSize: 'clamp(12px, 1.05vw, 14px)',
                        background: '#17223E',
                        color: '#FFD272',
                        borderRadius: '10px',
                        padding: 'clamp(6px, 0.6vw, 8px) clamp(14px, 1.3vw, 18px)',
                        border: 'none',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        opacity: downloadingChapter === chapterId ? 0.6 : 1,
                      }}
                    >
                      <img src="/get pdf.png" alt="get pdf" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                      {downloadingChapter === chapterId ? 'Loading...' : 'Get PDF'}
                    </button>
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
              {bannerBadge}
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

          {/* Books image — absolute, center-top of banner, bleeds from top */}
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

          {/* Right side — Stats only */}
          <div style={{ flexShrink: 0, zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              className="font-arimo font-bold"
              style={{ fontSize: 'clamp(40px, 4.5vw, 64px)', color: '#F5C75D', lineHeight: 1.1 }}
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
        {/*  SECTION 5: STATS ROW                                          */}
        {/* ============================================================ */}
        <div
          className="flex"
          style={{
            gap: 'clamp(12px, 1.2vw, 18px)',
            marginBottom: 'clamp(40px, 4vw, 60px)',
            flexWrap: 'wrap' as const,
          }}
        >
          {bottomStats.map((stat: any) => (
            <div
              key={stat.label}
              style={{
                flex: 1,
                minWidth: 'clamp(160px, 16vw, 200px)',
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '0.8px solid #E5E7EB',
                padding: 'clamp(18px, 2vw, 28px)',
                textAlign: 'center',
                boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.06)',
              }}
            >
              <div className="font-arimo font-bold" style={{ fontSize: 'clamp(28px, 2.8vw, 38px)', color: '#101828', lineHeight: 1.2 }}>
                {stat.number}
                <span style={{ color: stat.suffixColor }}>{stat.suffix}</span>
              </div>
              <div
                className="font-arimo font-bold"
                style={{
                  fontSize: 'clamp(10px, 0.82vw, 12px)',
                  color: '#6A7282',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginTop: 'clamp(4px, 0.4vw, 6px)',
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* ============================================================ */}
        {/*  SECTION 6: ASPIRANT STORIES                                   */}
        {/* ============================================================ */}
        <div style={{ marginBottom: 'clamp(40px, 4vw, 60px)' }}>
          {/* Header */}
          <div className="flex flex-col items-center" style={{ marginBottom: 'clamp(20px, 2vw, 28px)' }}>
            <div
              className="flex items-center gap-2 font-arimo font-bold"
              style={{
                fontSize: 'clamp(10px, 0.82vw, 12px)',
                color: '#DBAC49',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                marginBottom: 'clamp(6px, 0.6vw, 8px)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" fill="#DBAC49" stroke="#DBAC49" strokeWidth="1" />
              </svg>
              {testimonialsBadge}
            </div>
            <h2
              className="font-arimo font-bold text-center"
              style={{
                fontSize: 'clamp(24px, 2.5vw, 34px)',
                color: '#101828',
                lineHeight: 1.3,
              }}
            >
              {testimonialsTitle}
            </h2>
          </div>

          {/* Testimonial cards */}
          {apiTestimonials.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))',
                gap: 'clamp(14px, 1.5vw, 24px)',
              }}
            >
              {apiTestimonials.slice(0, 3).map((t) => {
                const initials = t.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <div
                    key={t.id}
                    style={{
                      background: 'linear-gradient(135deg, #FEFCE8 0%, #FFF7ED 100%)',
                      borderRadius: '16px',
                      padding: 'clamp(18px, 2vw, 24px)',
                      border: '1px solid #FFF085',
                    }}
                  >
                    {/* Stars */}
                    <div style={{ marginBottom: 'clamp(10px, 1vw, 14px)', display: 'flex', gap: '2px' }}>
                      {Array.from({ length: t.rating ?? 5 }).map((_: unknown, i: number) => (
                        <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1" />
                        </svg>
                      ))}
                    </div>

                    {/* Quote */}
                    <p
                      className="font-arimo italic"
                      style={{
                        fontSize: 'clamp(12px, 1.05vw, 14px)',
                        lineHeight: 'clamp(18px, 1.8vw, 24px)',
                        color: '#374151',
                        marginBottom: 'clamp(16px, 1.6vw, 22px)',
                      }}
                    >
                      &ldquo;{t.content}&rdquo;
                    </p>

                    {/* Avatar + name */}
                    <div className="flex items-center" style={{ gap: 'clamp(10px, 1vw, 14px)' }}>
                      <div
                        className="flex items-center justify-center font-arimo font-bold"
                        style={{
                          width: 'clamp(36px, 3.2vw, 44px)',
                          height: 'clamp(36px, 3.2vw, 44px)',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #1C398E 0%, #1447E6 100%)',
                          color: '#FFFFFF',
                          fontSize: 'clamp(12px, 1.05vw, 14px)',
                          flexShrink: 0,
                        }}
                      >
                        {initials}
                      </div>
                      <div>
                        <div
                          className="font-arimo font-bold"
                          style={{ fontSize: 'clamp(13px, 1.12vw, 15px)', color: '#101828' }}
                        >
                          {t.name}
                        </div>
                        <div
                          className="font-arimo"
                          style={{ fontSize: 'clamp(11px, 0.9vw, 13px)', color: '#6A7282' }}
                        >
                          {t.title}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/*  SECTION 7: CTA BANNER                                         */}
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
            className="flex items-center justify-center"
            style={{
              width: 'clamp(80px, 8vw, 110px)',
              height: 'clamp(80px, 8vw, 110px)',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.3)',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 'clamp(40px, 4vw, 56px)' }}>{'\uD83D\uDE80'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
