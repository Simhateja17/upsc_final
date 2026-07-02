'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { editorialService } from '@/lib/services';
import { ApiRequestError } from '@/lib/api';
import DashboardPageHero from '@/components/DashboardPageHero';

interface EditorialCard {
  id: string;
  title: string;
  summary: string | null;
  aiSummary?: string | null;
  source: string;
  sourceUrl?: string;
  category: string;
  tags: string[];
  publishedAt?: string;
  isRead: boolean;
  isSaved: boolean;
}

/* ── parse markdown into named sections (mirrors the inline parser used
   when rendering the summary modal, exposed here so handleSummarize can
   validate a fetched summary actually has parseable sections) ── */
function parseSections(md: string): { title: string; body: string }[] {
  const sections: { title: string; body: string }[] = [];
  const lines = md.split('\n');
  let cur: { title: string; lines: string[] } | null = null;
  let hasHeading = false;

  const isSectionHeading = (line: string): string | null => {
    const trimmed = line.trim();
    const h3Match = trimmed.match(/^#{3}\s*((?:\d+[.)]\s*)?.+?)(?:\s*[-–—]\s*.+)?$/);
    if (h3Match) return h3Match[1].trim();
    const h12Match = trimmed.match(/^#{1,2}\s*((?:\d+[.)]\s*)?.+)$/);
    if (h12Match) return h12Match[1].trim();
    const numMatch = trimmed.match(/^(\d+[.)]\s+)([A-Z].+)$/);
    if (numMatch && sections.length < 6) return numMatch[0].trim();
    return null;
  };

  for (const line of lines) {
    const heading = isSectionHeading(line);
    if (heading) {
      hasHeading = true;
      if (cur) sections.push({ title: cur.title, body: cur.lines.join('\n').trim() });
      cur = { title: heading, lines: [] };
    } else {
      if (!cur && !hasHeading) {
        cur = { title: "Summary", lines: [] };
      }
      cur?.lines.push(line);
    }
  }
  if (cur) sections.push({ title: cur.title, body: cur.lines.join('\n').trim() });
  return sections;
}

const categoryColors: Record<string, { color: string; bg: string }> = {
  'History': { color: '#B45309', bg: '#FEF3C7' },
  'Geography': { color: '#1D4ED8', bg: '#DBEAFE' },
  'Polity': { color: '#7C3AED', bg: '#EDE9FE' },
  'Economy': { color: '#EA580C', bg: '#FFF7ED' },
  'Environment & Ecology': { color: '#16A34A', bg: '#F0FDF4' },
  'Science & Technology': { color: '#0369A1', bg: '#DBEAFE' },
  'Current Affairs': { color: '#C2410C', bg: '#FFF7ED' },
  'Society': { color: '#BE185D', bg: '#FDF2F8' },
  'Governance': { color: '#1D4ED8', bg: '#EFF6FF' },
  'International Relations': { color: '#0F766E', bg: '#F0FDFA' },
  'Social Justice': { color: '#9A3412', bg: '#FFF7ED' },
  'Agriculture': { color: '#15803D', bg: '#F0FDF4' },
  'Internal Security': { color: '#991B1B', bg: '#FEF2F2' },
  'Disaster Management': { color: '#92400E', bg: '#FFFBEB' },
  'Ethics': { color: '#4338CA', bg: '#EEF2FF' },
};

const subjects = [
  { id: 'polity', label: 'Polity', emoji: '⚖️', bg: '#EDE9FE', border: '#DDD6FE', color: '#7C3AED', terms: ['polity'] },
  { id: 'history', label: 'History', emoji: '📜', bg: '#FEF3C7', border: '#FDE68A', color: '#B45309', terms: ['history'] },
  { id: 'geography', label: 'Geography', emoji: '🌍', bg: '#DBEAFE', border: '#BFDBFE', color: '#1D4ED8', terms: ['geography'] },
  { id: 'economy', label: 'Economy', emoji: '💰', bg: '#FFF7ED', border: '#FED7AA', color: '#EA580C', terms: ['economy', 'economic'] },
  { id: 'environment-ecology', label: 'Environment & Ecology', emoji: '🌿', bg: '#F0FDF4', border: '#BBF7D0', color: '#16A34A', terms: ['environment', 'ecology'] },
  { id: 'science-technology', label: 'Science & Technology', emoji: '🔬', bg: '#DBEAFE', border: '#BFDBFE', color: '#0369A1', terms: ['science', 'technology'] },
  { id: 'current-affairs', label: 'Current Affairs', emoji: '📰', bg: '#FFF7ED', border: '#FED7AA', color: '#C2410C', terms: ['current affairs', 'current-affairs'] },
  { id: 'society', label: 'Society', emoji: '👥', bg: '#FDF2F8', border: '#FBCFE8', color: '#BE185D', terms: ['society', 'social'] },
  { id: 'governance', label: 'Governance', emoji: '🏛️', bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8', terms: ['governance'] },
  { id: 'international-relations', label: 'Int. Relations', emoji: '🤝', bg: '#F0FDFA', border: '#99F6E4', color: '#0F766E', terms: ['international relations', 'foreign policy'] },
  { id: 'social-justice', label: 'Social Justice', emoji: '⚖️', bg: '#FFF7ED', border: '#FED7AA', color: '#9A3412', terms: ['social justice'] },
  { id: 'agriculture', label: 'Agriculture', emoji: '🌾', bg: '#F0FDF4', border: '#BBF7D0', color: '#15803D', terms: ['agriculture', 'agri'] },
  { id: 'internal-security', label: 'Internal Security', emoji: '🚨', bg: '#FEF2F2', border: '#FECACA', color: '#991B1B', terms: ['internal security', 'security'] },
  { id: 'disaster-management', label: 'Disaster Mgmt', emoji: '🆘', bg: '#FFFBEB', border: '#FDE68A', color: '#92400E', terms: ['disaster management', 'disaster'] },
  { id: 'ethics', label: 'Ethics', emoji: '🧭', bg: '#EEF2FF', border: '#C7D2FE', color: '#4338CA', terms: ['ethics', 'integrity'] },
] as const;

const defaultLearningStats = [
  { icon: '/dark.png', label: 'Editorials read', value: '0', color: '#047857' },
  { icon: '/tatal.png', label: 'Total saved', value: '0', color: '#1D4ED8' },
];

const normalizeSubjectValue = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

/* ------------------------------------------------------------------ */
/*  Calendar helper                                                    */
/* ------------------------------------------------------------------ */
function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function DailyEditorialPage() {
  const router = useRouter();
  const [activeNewspaper, setActiveNewspaper] = useState<'hindu' | 'express'>('hindu');
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [editorials, setEditorials] = useState<EditorialCard[]>([]);
  const [learningStats, setLearningStats] = useState(defaultLearningStats);
  const [glanceStats, setGlanceStats] = useState({ hindu: 0, express: 0, read: 0, ai: 0 });
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  // Streak data pulled from /editorials/stats
  const [streakData, setStreakData] = useState<{ streak: number; weekChecks: boolean[]; readToday: number; targetToday: number }>({
    streak: 0,
    weekChecks: [false, false, false, false, false, false, false],
    readToday: 0,
    targetToday: 7,
  });
  const PAGE_SIZE = 10;
  const [summarizing, setSummarizing] = useState<string | null>(null);
  const [summaryModal, setSummaryModal] = useState<{
    open: boolean;
    loading: boolean;
    editorial: EditorialCard | null;
    summary: string | null;
    loadStep: number;
    error: string | null;
  }>({ open: false, loading: false, editorial: null, summary: null, loadStep: 0, error: null });

  useEffect(() => {
    const source = activeNewspaper === 'hindu' ? 'The Hindu' : 'Indian Express';
    const month = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
    setAvailabilityLoading(true);
    setAvailableDates(new Set());
    editorialService.getAvailability(source, month)
      .then(res => {
        const dates = Array.isArray(res.data?.availableDates) ? res.data.availableDates : [];
        setAvailableDates(new Set(dates));
      })
      .catch(() => setAvailableDates(new Set()))
      .finally(() => setAvailabilityLoading(false));
  }, [activeNewspaper, calMonth, calYear]);

  useEffect(() => {
    const source = activeNewspaper === 'hindu' ? 'The Hindu' : 'Indian Express';
    setLoading(true);
    setCurrentPage(1);
    editorialService.getToday(source, selectedDate)
      .then(res => {
        const articles = res.data && Array.isArray(res.data) ? res.data : [];
        if (articles.length > 0) {
          setEditorials(articles);
          setLastFetched(new Date());
        } else {
          // DB empty – fall back to live News API (only for today)
          const isToday = selectedDate === new Date().toISOString().slice(0, 10);
          if (isToday) {
            return editorialService.getLiveNews(source).then(liveRes => {
              if (liveRes.data && Array.isArray(liveRes.data)) {
                setEditorials(liveRes.data);
                setLastFetched(new Date());
              }
            });
          } else {
            setEditorials([]);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeNewspaper, selectedDate]);

  useEffect(() => {
    editorialService.getStats()
      .then(res => {
        if (res.data) {
          const d = res.data;
          setLearningStats([
            { icon: '/dark.png', label: 'Editorials read', value: `${d.totalRead || 0}`, color: '#047857' },
            { icon: '/tatal.png', label: 'Total saved', value: `${d.totalSaved || 0}`, color: '#1D4ED8' },
          ]);
          // Derive 7-day checklist: fill from the left for each day read in current streak
          const streakLen = d.streak || 0;
          const weekChecks = Array.from({ length: 7 }, (_, i) => i < streakLen);
          setStreakData({
            streak: streakLen,
            weekChecks,
            readToday: d.readToday || 0,
            targetToday: d.dailyTarget || 7,
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setGlanceStats(prev => ({
      ...prev,
      [activeNewspaper]: editorials.length,
      read: editorials.filter(e => e.isRead).length,
      ai: editorials.filter(e => e.aiSummary || e.summary).length,
    }));
  }, [activeNewspaper, editorials]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSubject]);

  const handleSave = async (id: string) => {
    try {
      const res = await editorialService.toggleSave(id);
      setEditorials(prev => prev.map(e => e.id === id ? { ...e, isSaved: res.data?.saved ?? !e.isSaved } : e));
    } catch {}
  };

  const handleMarkRead = async (id: string) => {
    try {
      await editorialService.markRead(id);
      setEditorials(prev => prev.map(e => e.id === id ? { ...e, isRead: true } : e));
    } catch {}
  };

  const handleSummarize = async (card: EditorialCard) => {
    // Use cached summary if available – no AI call needed
    if (card.aiSummary) {
      setSummaryModal({ open: true, loading: false, editorial: card, summary: card.aiSummary, loadStep: 4, error: null });
      return;
    }

    setSummarizing(card.id);
    setSummaryModal({ open: true, loading: true, editorial: card, summary: null, loadStep: 0, error: null });

    // Animate loading steps
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setSummaryModal(prev => ({ ...prev, loadStep: step }));
      if (step >= 3) clearInterval(interval);
    }, 900);

    try {
      const res = await editorialService.summarize(card.id);
      clearInterval(interval);
      const rawSummary = res.data?.summary || "";
      const summary = rawSummary.trim().length > 50 ? rawSummary.trim() : null;

      if (!summary) {
        setEditorials(prev => prev.filter(e => e.id !== card.id));
        setSummaryModal(prev => ({ ...prev, open: false }));
        return;
      }

      const testSections = parseSections(summary);
      if (testSections.length === 0) {
        setEditorials(prev => prev.filter(e => e.id !== card.id));
        setSummaryModal(prev => ({ ...prev, open: false }));
        return;
      }

      setEditorials(prev => prev.map(e => e.id === card.id ? { ...e, aiSummary: summary } : e));
      setSummaryModal(prev => ({ ...prev, loading: false, summary, loadStep: 4 }));
    } catch (err) {
      clearInterval(interval);
      setEditorials(prev => prev.filter(e => e.id !== card.id));
      setSummaryModal(prev => ({ ...prev, open: false }));
    }
    setSummarizing(null);
  };


  const calDays = getCalendarDays(calYear, calMonth);
  const now = new Date();
  const today = now.getMonth() === calMonth && now.getFullYear() === calYear ? now.getDate() : -1;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const selectedSubjectMeta = subjects.find((subject) => subject.id === selectedSubject);
  const filteredEditorials = selectedSubjectMeta
    ? editorials.filter((editorial) => {
        const searchableValues = [editorial.category || '', ...(editorial.tags || [])].map((value) => normalizeSubjectValue(value));
        return selectedSubjectMeta.terms.some((term) => {
          const needle = normalizeSubjectValue(term);
          return searchableValues.some((value) => value.includes(needle));
        });
      })
    : editorials;
  const totalPages = Math.max(1, Math.ceil(filteredEditorials.length / PAGE_SIZE));
  const paginatedEditorials = filteredEditorials.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };

  // eslint-disable-next-line @next/next/no-img-element
  const newspaperIcon = <img src="/icon-newspaper.png" alt="newspaper" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />;

  return (
    <div
      className="font-arimo w-full min-h-screen"
      style={{ background: '#F9FAFB' }}
    >
      <DashboardPageHero
        badgeIcon={newspaperIcon}
        badgeText="DAILY NEWS ANALYSIS"
        title={
          <>
            Where <em style={{ color: '#E8B84B', fontStyle: 'italic' }}>News</em> Meets
            <br />
            The <em style={{ color: '#E8B84B', fontStyle: 'italic' }}>Syllabus</em>
          </>
        }
        subtitle="Every editorial, every perspective mapped to what UPSC asks."
        stats={[
          { value: String(glanceStats.hindu || 0),   label: 'The Hindu',      color: '#F87171' },
          { value: String(glanceStats.express || 0), label: 'Indian Express', color: '#FDC700' },
          { value: String(glanceStats.read || 0),    label: 'Read So Far',    color: '#4ADE80' },
          { value: String(glanceStats.ai || 0),      label: 'AI Summaries',   color: '#FFFFFF' },
        ]}
      />
      {/* ============================================================ */}
      {/*  MAIN TWO-COLUMN LAYOUT                                      */}
      {/* ============================================================ */}
      <div
        style={{
          background: '#FAFBFE',
          borderRadius: '28px 28px 0 0',
          marginTop: '-4px',
          paddingTop: 'clamp(24px, 3vw, 40px)',
        }}
      >
      <div
        className="mx-auto grid w-full grid-cols-1 xl:grid-cols-[minmax(0,1fr)_clamp(280px,24vw,340px)]"
        style={{
          maxWidth: 'min(94vw, 1400px)',
          padding: '0 clamp(16px, 2vw, 30px)',
          gap: 'clamp(16px, 2vw, 28px)',
          paddingBottom: 'clamp(40px, 5vw, 80px)',
        }}
      >
        {/* ========================================================== */}
        {/*  LEFT COLUMN – News Cards                                   */}
        {/* ========================================================== */}
        <div>
          {/* Top controls row */}
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between" style={{ gap: '12px', marginBottom: 'clamp(12px, 1.2vw, 16px)' }}>
            {/* Newspaper toggles */}
            <div className="flex flex-col sm:flex-row sm:items-center" style={{ gap: '10px' }}>
              <div className="grid w-full grid-cols-2 items-center sm:w-auto" style={{ background: '#FFFFFF', border: '1px solid #D7DEEA', borderRadius: '999px', padding: '4px', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
                {[ 
                  { id: 'hindu' as const, label: 'The Hindu', icon: '/hindu-full.png' },
                  { id: 'express' as const, label: 'Indian Express', icon: '/indian.png' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveNewspaper(item.id)}
                    className="flex min-w-0 items-center justify-center gap-2 font-fahkwang"
                    style={{
                      height: '48px',
                      padding: '0 clamp(8px, 1.4vw, 22px)',
                      borderRadius: '999px',
                      background: activeNewspaper === item.id ? '#101828' : 'transparent',
                      color: activeNewspaper === item.id ? '#FFFFFF' : '#101828',
                      fontSize: 'clamp(11px, 1.2vw, 18px)',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span
                      style={{
                        width: item.id === 'hindu' ? 'clamp(42px, 7vw, 96px)' : '22px',
                        height: item.id === 'hindu' ? '32px' : '22px',
                        borderRadius: '999px',
                        background: '#FFFFFF',
                        border: activeNewspaper === item.id ? '1px solid rgba(255,255,255,0.3)' : '1px solid #E5E7EB',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: item.id === 'hindu' ? '0 10px' : '3px',
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.icon}
                        alt={item.label}
                        style={{
                          width: item.id === 'hindu' ? '100%' : '16px',
                          height: item.id === 'hindu' ? '100%' : '16px',
                          objectFit: item.id === 'hindu' ? 'cover' : 'contain',
                          objectPosition: item.id === 'hindu' ? 'center' : 'center',
                          filter: 'none',
                          imageRendering: 'auto',
                          transform: 'none',
                        }}
                      />
                    </span>
                    <span
                      className="min-w-0 truncate"
                      style={{
                        fontFamily: 'inherit',
                        fontWeight: 500,
                        fontSize: 'inherit',
                        lineHeight: 1,
                        letterSpacing: 'normal',
                      }}
                    >
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>

            </div>

          </div>

          {/* Divider */}
          <div style={{ borderBottom: '1px solid #D1D5DC', marginBottom: 'clamp(14px, 1.5vw, 20px)' }} />

          {/* Last updated + article count */}
          {!loading && editorials.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2" style={{ marginBottom: '12px' }}>
              <span className="font-arimo" style={{ fontSize: '13px', color: '#6A7282' }}>
                🕐 Updated {lastFetched ? lastFetched.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'just now'} &nbsp;·&nbsp; {editorials.length} articles (last 24 hrs)
              </span>
              <span className="font-arimo" style={{ fontSize: '13px', color: '#6A7282' }}>
                Page {Math.min(currentPage, totalPages)} of {totalPages}
              </span>
            </div>
          )}

          {/* News cards */}
          <div
            style={{
              display: loading ? 'block' : 'grid',
              gridTemplateColumns: '1fr',
              gap: 'clamp(14px, 1.5vw, 20px)',
            }}
          >
            {loading ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div></div>
            ) : (() => {
              if (filteredEditorials.length === 0) {
                return (
                  <div className="text-center py-12 text-gray-500">
                    {selectedSubject ? 'No articles for this subject on this date.' : 'No articles in the last 24 hours. Check back later.'}
                  </div>
                );
              }
              return paginatedEditorials.map((card) => {
              const secondaryTags = (card.tags || []).filter((tag) => {
                const normalized = tag.toLowerCase();
                return normalized !== card.category.toLowerCase()
                  && normalized !== 'the hindu'
                  && normalized !== 'indian express';
              });
              const tagList = [card.category, ...secondaryTags].slice(0, 3);
              return (
              <div
                key={card.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '14px',
                  padding: 'clamp(18px, 2vw, 28px)',
                  boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)',
                  opacity: card.isRead ? 0.7 : 1,
                }}
              >
                {/* Tags row + source */}
                <div className="flex items-center justify-between" style={{ marginBottom: 'clamp(8px, 0.9vw, 12px)' }}>
                  <div className="flex items-center flex-wrap" style={{ gap: 'clamp(6px, 0.6vw, 8px)' }}>
                    {tagList.map((tag) => {
                      const colors = categoryColors[tag] || { color: '#1E40AF', bg: '#DBEAFE' };
                      return (
                      <span
                        key={tag}
                        className="font-arimo font-medium"
                        style={{
                          fontSize: 'clamp(11px, 0.9vw, 13px)',
                          lineHeight: '1',
                          padding: 'clamp(4px, 0.45vw, 6px) clamp(8px, 0.9vw, 12px)',
                          borderRadius: '6px',
                          background: colors.bg,
                          color: colors.color,
                        }}
                      >
                        {tag}
                      </span>
                      );
                    })}
                  </div>
                  <div
                    className="flex items-center gap-1 font-arimo shrink-0"
                    style={{ color: '#6A7282', fontSize: 'clamp(12px, 0.97vw, 13px)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="#6A7282" strokeWidth="1.5"/>
                      <path d="M12 6V12L16 14" stroke="#6A7282" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    {card.source}
                  </div>
                </div>

                {/* Title */}
                <h3
                  className="font-arimo font-bold"
                  style={{
                    fontSize: 'clamp(16px, 1.5vw, 20px)',
                    lineHeight: 'clamp(22px, 2.06vw, 27.5px)',
                    color: '#101828',
                    marginBottom: 'clamp(6px, 0.75vw, 10px)',
                  }}
                >
                  {card.title}
                </h3>

                {/* Description */}
                <p
                  className="font-arimo"
                  style={{
                    fontSize: 'clamp(12px, 1.05vw, 14px)',
                    lineHeight: 'clamp(18px, 1.7vw, 22.75px)',
                    color: '#4A5565',
                    marginBottom: 'clamp(10px, 1.2vw, 16px)',
                  }}
                >
                  {card.summary || 'Click to read the full editorial analysis.'}
                </p>

                {/* Divider */}
                <div style={{ borderBottom: '1px solid #D1D5DC', marginBottom: 'clamp(10px, 1.2vw, 16px)' }} />

                {/* Action buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center" style={{ gap: 'clamp(6px, 0.75vw, 10px)' }}>
                    <button
                      onClick={() => handleSave(card.id)}
                      className="flex items-center gap-2 font-arimo"
                      style={{
                        padding: 'clamp(6px, 0.75vw, 10px) clamp(12px, 1.2vw, 16px)',
                        borderRadius: '26843500px',
                        border: `0.8px solid ${card.isSaved ? '#86EFAC' : '#DBEAFE'}`,
                        background: card.isSaved ? '#DCFCE7' : '#EFF6FF',
                        color: card.isSaved ? '#166534' : '#1C398E',
                        fontSize: 'clamp(12px, 1.05vw, 14px)',
                        cursor: 'pointer',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/paper.png" alt="Save" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />
                      {card.isSaved ? 'Saved' : 'Save'}
                    </button>

                    <button
                      onClick={() => handleMarkRead(card.id)}
                      className="flex items-center gap-2 font-arimo"
                      style={{
                        padding: 'clamp(6px, 0.75vw, 10px) clamp(12px, 1.2vw, 16px)',
                        borderRadius: '26843500px',
                        border: '0.8px solid #DBEAFE',
                        background: card.isRead ? '#F0FDF4' : '#EFF6FF',
                        color: card.isRead ? '#16A34A' : '#1C398E',
                        fontSize: 'clamp(12px, 1.05vw, 14px)',
                        cursor: 'pointer',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        {card.isRead ? (
                          <path d="M20 6L9 17L4 12" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        ) : (
                          <circle cx="12" cy="12" r="10" stroke="#1C398E" strokeWidth="1.5"/>
                        )}
                      </svg>
                      {card.isRead ? 'Read' : 'Mark read'}
                    </button>
                  </div>

                  <button
                    onClick={() => handleSummarize(card)}
                    disabled={summarizing === card.id}
                    className="flex w-full items-center justify-center gap-2 font-arimo font-bold sm:w-auto"
                    style={{
                      padding: 'clamp(8px, 0.75vw, 10px) clamp(14px, 1.5vw, 20px)',
                      borderRadius: '26843500px',
                      background: '#162456',
                      color: '#FFD272',
                      fontSize: 'clamp(12px, 1.05vw, 14px)',
                      cursor: 'pointer',
                      opacity: summarizing === card.id ? 0.6 : 1,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/summaruze.png" alt="Summarize" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />
                    {summarizing === card.id ? 'Summarizing...' : 'Summarize with Jeet AI'}
                  </button>
                </div>
              </div>
              );
            });
            })()}
          </div>

          {/* Pagination controls */}
          {!loading && filteredEditorials.length > PAGE_SIZE && (
            <div className="flex items-center justify-center" style={{ gap: '8px', marginTop: '8px', paddingBottom: '8px' }}>
              <button
                onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={currentPage === 1}
                className="font-arimo font-medium"
                style={{
                  padding: '8px 16px', borderRadius: '8px', border: '1px solid #E5E7EB',
                  background: currentPage === 1 ? '#F9FAFB' : '#FFFFFF',
                  color: currentPage === 1 ? '#9CA3AF' : '#101828',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                }}
              >← Prev</button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="font-arimo font-medium"
                  style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    border: page === currentPage ? 'none' : '1px solid #E5E7EB',
                    background: page === currentPage ? '#101828' : '#FFFFFF',
                    color: page === currentPage ? '#FFFFFF' : '#101828',
                    cursor: 'pointer', fontSize: '13px',
                  }}
                >{page}</button>
              ))}

              <button
                onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={currentPage === totalPages}
                className="font-arimo font-medium"
                style={{
                  padding: '8px 16px', borderRadius: '8px', border: '1px solid #E5E7EB',
                  background: currentPage === totalPages ? '#F9FAFB' : '#FFFFFF',
                  color: currentPage === totalPages ? '#9CA3AF' : '#101828',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                }}
              >Next →</button>
            </div>
          )}
        </div>

        {/* ========================================================== */}
        {/*  RIGHT COLUMN – Sidebar Widgets                             */}
        {/* ========================================================== */}
        <div className="flex flex-col" style={{ gap: 'clamp(14px, 1.5vw, 20px)' }}>
          {/* -------------------------------------------------------- */}
          {/*  Calendar Widget                                          */}
          {/* -------------------------------------------------------- */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '0.8px solid #E5E7EB',
              padding: 'clamp(14px, 1.5vw, 20px)',
              boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)',
            }}
          >
            {/* Calendar header */}
            <div className="flex items-center justify-between" style={{ marginBottom: 'clamp(10px, 1vw, 14px)' }}>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '20px', lineHeight: 1 }}>📅</span>
                <span className="font-arimo font-bold" style={{ fontSize: '16px', color: '#101828' }}>
                  {monthNames[calMonth]} {calYear}
                </span>
              </div>
              <span
                className="font-arimo font-bold"
                style={{
                  fontSize: '12px',
                  background: '#FFD171',
                  color: '#162456',
                  padding: '4px 12px',
                  borderRadius: '26843500px',
                }}
              >
                {(() => {
                  const d = new Date(selectedDate + 'T00:00:00');
                  return `${d.getDate()} ${monthNames[d.getMonth()]}`;
                })()}
              </span>
            </div>

            {/* Month navigation */}
            <div className="flex items-center justify-between" style={{ marginBottom: 'clamp(8px, 0.75vw, 10px)' }}>
              <button
                onClick={prevMonth}
                className="flex items-center justify-center font-arimo font-bold"
                style={{
                  width: '24px', height: '24px', borderRadius: '6px',
                  background: 'rgba(28,80,212,0.05)', border: '1px solid rgba(28,80,212,0.08)',
                  color: '#364153', fontSize: '14px', cursor: 'pointer',
                }}
              >&lt;</button>
              <span className="font-arimo font-bold" style={{ fontSize: '14px', color: '#101828' }}>
                {monthNames[calMonth]} {calYear}
              </span>
              <button
                onClick={nextMonth}
                className="flex items-center justify-center font-arimo font-bold"
                style={{
                  width: '24px', height: '24px', borderRadius: '6px',
                  background: 'rgba(28,80,212,0.05)', border: '1px solid rgba(28,80,212,0.08)',
                  color: '#364153', fontSize: '14px', cursor: 'pointer',
                }}
              >&gt;</button>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 text-center" style={{ marginBottom: 'clamp(4px, 0.5vw, 6px)' }}>
              {dayLabels.map((d) => (
                <span key={d} className="font-arimo font-bold" style={{ fontSize: '12px', color: '#6A7282', padding: '4px 0' }}>
                  {d}
                </span>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 text-center">
              {calDays.map((day, idx) => {
                if (!day) {
                  return <div key={idx} />;
                }
                const iso = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isFuture = new Date(iso) > new Date();
                const hasArticles = availableDates.has(iso);
                const isUnavailable = !availabilityLoading && !hasArticles;
                const isSelected = iso === selectedDate && !isFuture && !isUnavailable;
                return (
                  <button
                    key={idx}
                    disabled={isFuture || isUnavailable}
                    onClick={() => !(isFuture || isUnavailable) && setSelectedDate(iso)}
                    className="flex flex-col items-center justify-center font-arimo"
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      maxHeight: '36px',
                      fontSize: '14px',
                      borderRadius: '10px',
                      background: isSelected ? '#162456' : 'transparent',
                      color: isSelected ? '#FFFFFF' : (isFuture || isUnavailable) ? '#B8C0CC' : '#364153',
                      fontWeight: isSelected ? 700 : 400,
                      cursor: (isFuture || isUnavailable) ? 'not-allowed' : 'pointer',
                      border: 'none',
                      gap: '2px',
                    }}
                    aria-label={`${iso}${hasArticles ? ', articles available' : ', no articles available'}`}
                  >
                    <span style={{ lineHeight: '14px' }}>{day}</span>
                    <span
                      aria-hidden="true"
                      style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '999px',
                        background: hasArticles ? (isSelected ? '#FFFFFF' : '#1D4ED8') : 'transparent',
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* -------------------------------------------------------- */}
          {/*  Filter by Subject                                        */}
          {/* -------------------------------------------------------- */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '0.8px solid #E5E7EB',
              padding: 'clamp(16px, 1.86vw, 24.8px)',
              boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)',
            }}
          >
            <div className="flex items-center gap-2" style={{ marginBottom: 'clamp(12px, 1.2vw, 16px)' }}>
              <span style={{ fontSize: '18px' }}>🔍</span>
              <span className="font-arimo font-bold" style={{ fontSize: '14px', color: '#6A7282', letterSpacing: '0.35px', textTransform: 'uppercase' }}>
                Filter by Subject
              </span>
            </div>
            <div className="grid grid-cols-2" style={{ gap: '12px' }}>
              {[
                { id: 'history',                 emoji: '📜', label: 'History',              bg: '#FEF3C7', border: '#FDE68A', color: '#B45309' },
                { id: 'geography',               emoji: '🌍', label: 'Geography',            bg: '#DBEAFE', border: '#BFDBFE', color: '#1D4ED8' },
                { id: 'polity',                  emoji: '⚖️', label: 'Polity',               bg: '#EDE9FE', border: '#DDD6FE', color: '#7C3AED' },
                { id: 'economy',                 emoji: '💰', label: 'Economy',              bg: '#FFF7ED', border: '#FED7AA', color: '#EA580C' },
                { id: 'environment',             emoji: '🌿', label: 'Environment & Ecology', bg: '#F0FDF4', border: '#BBF7D0', color: '#16A34A' },
                { id: 'science-tech',            emoji: '🔬', label: 'Science & Technology',  bg: '#DBEAFE', border: '#BFDBFE', color: '#0369A1' },
              ].map((s) => {
                const active = selectedSubject === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSubject(active ? null : s.id)}
                    className="flex items-center gap-2 font-arimo font-bold relative"
                    style={{
                      padding: '10px 12px',
                      borderRadius: '14px',
                      background: active ? '#17223E' : s.bg,
                      border: `0.8px solid ${active ? '#17223E' : s.border}`,
                      color: active ? '#FFFFFF' : s.color,
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      lineHeight: 1.3,
                      wordBreak: 'break-word',
                    }}
                  >
                    {active ? (
                      <span style={{ fontSize: '15px', flexShrink: 0 }}>✓</span>
                    ) : (
                      <span style={{ fontSize: '15px', flexShrink: 0 }}>{s.emoji}</span>
                    )}
                    {s.label}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '10px', marginTop: '10px' }}>
              {subjects
                .filter((subject) => !['history', 'geography', 'polity', 'economy'].includes(subject.id) && !['environment-ecology', 'science-technology'].includes(subject.id))
                .map((subject) => {
                  const active = selectedSubject === subject.id;
                  return (
                    <button
                      key={subject.id}
                      onClick={() => setSelectedSubject(active ? null : subject.id)}
                      className="flex items-center gap-2 font-arimo font-bold"
                      style={{
                        padding: '12px 16px',
                        borderRadius: '14px',
                        background: active ? '#17223E' : subject.bg,
                        border: `0.8px solid ${active ? '#17223E' : subject.border}`,
                        color: active ? '#FFFFFF' : subject.color,
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        textAlign: 'left',
                      }}
                    >
                      <span
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '999px',
                          background: active ? 'rgba(255,255,255,0.16)' : '#FFFFFF',
                          border: active ? '1px solid rgba(255,255,255,0.18)' : `1px solid ${subject.border}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          fontSize: active ? '15px' : '14px',
                        }}
                      >
                        {active ? '✓' : subject.emoji}
                      </span>
                      <span style={{ lineHeight: 1.3 }}>{subject.label}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* -------------------------------------------------------- */}
          {/*  Your Learning Streak (white stats card)                  */}
          {/* -------------------------------------------------------- */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: '24px',
              paddingBottom: '20px',
              boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)',
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-2" style={{ marginBottom: '24px' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2 14L7 9L11 13L18 5" stroke="#E7000B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 5H18V9" stroke="#E7000B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="font-arimo font-bold" style={{ fontSize: '16px', color: '#101828' }}>
                Your Learning Streak
              </span>
            </div>

            {/* Orange gradient streak pill */}
            <div
              className="flex items-center justify-between"
              style={{
                background: 'linear-gradient(90deg, #FF6900 0%, #FB2C36 100%)',
                display: 'none',
                borderRadius: '14px',
                padding: '0 16px',
                height: '64px',
                marginBottom: '24px',
              }}
            >
              <div className="flex items-center gap-2">
                {/* White flame outline */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C12 2 7 7 7 12C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12C17 9.5 15.5 7.5 14 6C14 6 14 8 12 9C12 9 9 7 9 5C9 5 10.5 3.5 12 2Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="font-arimo font-bold" style={{ fontSize: '18px', color: '#FFFFFF' }}>
                  {streakData.streak} days
                </span>
                <span className="font-arimo" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>
                  · current streak
                </span>
              </div>
              {/* Warm flame right */}
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M16 4C16 4 10 10 10 17C10 20.31 12.69 23 16 23C19.31 23 22 20.31 22 17C22 14 20 11.5 18.5 10C18.5 10 18.5 12 16 13C16 13 12 10.5 12 8C12 8 14 6 16 4Z" fill="#FCA955" opacity="0.9"/>
              </svg>
            </div>

            <div
              style={{
                background: '#0E182D',
                borderRadius: '16px',
                border: '1px solid #1E2A40',
                padding: '24px',
                marginBottom: '20px',
                boxShadow: '0px 10px 15px -3px rgba(0,0,0,0.08), 0px 4px 6px -4px rgba(0,0,0,0.08)',
              }}
            >
              <div className="flex items-center gap-2" style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '24px', lineHeight: 1 }}>🔥</span>
                <span className="font-arimo font-bold" style={{ fontSize: '22px', color: '#F3BB4B' }}>
                  {streakData.streak}-Day Streak
                </span>
              </div>
              <p className="font-arimo" style={{ fontSize: '14px', color: '#99A1AF', marginBottom: '20px' }}>
                Keep it up! Read {streakData.readToday} today
              </p>

              <div className="flex items-center" style={{ gap: '10px', marginBottom: '16px' }}>
                {streakData.weekChecks.map((checked, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-center"
                    style={{
                      flex: 1,
                      aspectRatio: '3 / 4',
                      maxHeight: '64px',
                      borderRadius: '16px',
                      background: checked ? '#F3BB4B' : '#17223E',
                      border: checked ? '1.5px solid #E5A632' : '1.5px solid #4A5565',
                    }}
                  >
                    {checked && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src="/tick.png"
                        alt=""
                        style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                      />
                    )}
                  </div>
                ))}
              </div>

              <p className="font-arimo" style={{ fontSize: '14px', color: '#99A1AF' }}>
                {streakData.readToday} of {streakData.targetToday} articles read today
              </p>
            </div>

            <div className="flex flex-col" style={{ gap: '16px', marginBottom: '20px' }}>
              {[
                {
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="0.5" y="0.5" width="15" height="15" rx="3.5" stroke="#16A34A" strokeWidth="1"/>
                      <path d="M4 8L7 11L12 5" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ),
                  label: 'Editorials read',
                  value: learningStats[0]?.value ?? '0',
                },
                {
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6.5" stroke="#2563EB" strokeWidth="1"/>
                      <path d="M8 5V8.5L10.5 10" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  ),
                  label: 'Total saved',
                  value: learningStats[1]?.value ?? '0',
                },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {stat.icon}
                    <span className="font-arimo" style={{ fontSize: '14px', color: '#364153' }}>{stat.label}</span>
                  </div>
                  <span className="font-arimo font-bold" style={{ fontSize: '14px', color: '#101828' }}>{stat.value}</span>
                </div>
              ))}
            </div>

            {/* Stats rows */}
            <div className="flex flex-col" style={{ gap: '16px', marginBottom: '0', display: 'none' }}>
              {[
                {
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="0.5" y="0.5" width="15" height="15" rx="3.5" stroke="#16A34A" strokeWidth="1"/>
                      <path d="M4 8L7 11L12 5" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ),
                  label: 'Editorials read',
                  value: learningStats[0]?.value ?? '0',
                },
                {
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6.5" stroke="#2563EB" strokeWidth="1"/>
                      <path d="M8 5V8.5L10.5 10" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  ),
                  label: 'Total reading time',
                  value: '–',
                },
                {
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="0.5" y="0.5" width="15" height="15" rx="3.5" stroke="#16A34A" strokeWidth="1"/>
                      <path d="M4 8L7 11L12 5" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ),
                  label: "This week's target",
                  value: '–',
                },
                {
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 1L9.5 5.5H14.5L10.5 8.5L12 13L8 10L4 13L5.5 8.5L1.5 5.5H6.5L8 1Z" stroke="#7C3AED" strokeWidth="1" strokeLinejoin="round"/>
                    </svg>
                  ),
                  label: 'Longest streak',
                  value: '–',
                },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {stat.icon}
                    <span className="font-arimo" style={{ fontSize: '14px', color: '#364153' }}>{stat.label}</span>
                  </div>
                  <span className="font-arimo font-bold" style={{ fontSize: '14px', color: '#101828' }}>{stat.value}</span>
                </div>
              ))}

              {/* Divider + Next row */}
              <div style={{ borderTop: '0.8px solid #E5E7EB', paddingTop: '16px' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="1" y="2.5" width="14" height="12" rx="2" stroke="#6A7282" strokeWidth="1"/>
                      <path d="M5 1V4M11 1V4" stroke="#6A7282" strokeWidth="1" strokeLinecap="round"/>
                      <path d="M1 6.5H15" stroke="#6A7282" strokeWidth="1"/>
                    </svg>
                    <span className="font-arimo" style={{ fontSize: '14px', color: '#364153' }}>
                      Next: {(() => {
                        const next = new Date();
                        next.setDate(next.getDate() + 1);
                        return `${next.getDate()} ${monthNames[next.getMonth()]}`;
                      })()}
                    </span>
                  </div>
                  <span className="font-arimo font-bold" style={{ fontSize: '14px', color: '#E7000B' }}>
                    +{streakData.targetToday} articles
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* ============================================================ */}
      {/*  Jeet AI SUMMARY MODAL  – new structured design               */}
      {/* ============================================================ */}
      {summaryModal.open && (() => {
        const ed = summaryModal.editorial;
        const closeModal = () => setSummaryModal(prev => ({ ...prev, open: false }));

        /* ── parse markdown into named sections ── */
        const parseSections = (md: string) => {
          const sections: { title: string; body: string }[] = [];
          const lines = md.split('\n');
          let cur: { title: string; lines: string[] } | null = null;
          let hasHeading = false;

          const isSectionHeading = (line: string): string | null => {
            const trimmed = line.trim();
            const h3Match = trimmed.match(/^#{3}\s*((?:\d+[.)]\s*)?.+?)(?:\s*[-–—]\s*.+)?$/);
            if (h3Match) return h3Match[1].trim();
            const h12Match = trimmed.match(/^#{1,2}\s*((?:\d+[.)]\s*)?.+)$/);
            if (h12Match) return h12Match[1].trim();
            const numMatch = trimmed.match(/^(\d+[.)]\s+)([A-Z].+)$/);
            if (numMatch && sections.length < 6) return numMatch[0].trim();
            return null;
          };

          for (const line of lines) {
            const heading = isSectionHeading(line);
            if (heading) {
              hasHeading = true;
              if (cur) sections.push({ title: cur.title, body: cur.lines.join('\n').trim() });
              cur = { title: heading, lines: [] };
            } else {
              if (!cur && !hasHeading) {
                cur = { title: "Summary", lines: [] };
              }
              cur?.lines.push(line);
            }
          }
          if (cur) sections.push({ title: cur.title, body: cur.lines.join('\n').trim() });
          return sections;
        };

        /* ── render section body by type ── */
        const renderSectionBody = (title: string, body: string) => {
          const tl = title.toLowerCase();

          if (tl.includes('key arguments')) {
            const blocks = body.split(/\n(?=\*\*|###\s*\d|[A-Z][a-z]{2,}:)/).filter(Boolean);
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {blocks.map((block, i) => {
                  const lines = block.trim().split('\n');
                  const heading = lines[0].replace(/\*\*/g, '').replace(/^###?\s*/, '').replace(/:$/, '').trim();
                  const text = lines.slice(1).join(' ').replace(/\*\*/g, '').trim() || lines[0].replace(/\*\*/g, '').trim();
                  return (
                    <div key={i} style={{ paddingLeft: 12, borderLeft: '2.5px solid #dce3ef' }}>
                      {lines.length > 1 && <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2233', marginBottom: 4 }}>{heading}</div>}
                      <div style={{ fontSize: 13, color: '#4a5a72', lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#1a2233;font-weight:700">$1</strong>') }} />
                    </div>
                  );
                })}
              </div>
            );
          }

          if (tl.includes('upsc relevance')) {
            const blocks = body
              .split(/\n+(?=\s*(?:\*\*|###\s*\d|-\s*[A-Z]|GS Paper))/)
              .map(b => b.trim().replace(/\n+/g, ' ').replace(/\*\*/g, '').replace(/^-\s*/, '').trim())
              .filter(Boolean);
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {blocks.map((text, i) => (
                  <div key={i} style={{ padding: '10px 12px', background: '#f0f4fa', borderRadius: 9, border: '1px solid #dce3ef' }}>
                    <div style={{ fontSize: 13, color: '#4a5a72', lineHeight: 1.6 }}>{text}</div>
                  </div>
                ))}
              </div>
            );
          }

          if (tl.includes('key term')) {
            let content = body.replace(/^#{1,3}\s*(?:\d+[.)]\s*)?Key Terms[^-]*/i, '').trim();
            const terms: string[] = [];
            const candidates = content.split(/\s*[-–—]\s*|\n/).map(t => t.trim()).filter(Boolean);
            for (const candidate of candidates) {
              const cleaned = candidate.replace(/\*\*/g, '').replace(/[#_~`]/g, '').trim();
              if (!cleaned || cleaned.length < 3) continue;
              terms.push(cleaned.charAt(0).toUpperCase() + cleaned.slice(1));
            }
            return (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {terms.map((term, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', background: '#eef2fb', border: '1px solid #c8d7f5', color: '#2a4a8a', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 8 }}>{term}</span>
                ))}
              </div>
            );
          }

          if (tl.includes('exam question') || tl.includes('potential')) {
            const qs = body.split('\n')
              .map(l => l.replace(/\*\*/g, '').replace(/^[-*"'0-9.\s]+/, '').replace(/['"\s]+$/, '').trim())
              .filter(Boolean);
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {qs.map((q, i) => (
                  <div key={i} style={{ padding: '11px 13px', background: '#f0f4fa', border: '1px solid #dce3ef', borderLeft: '3px solid #f0a500', borderRadius: '0 9px 9px 0', fontSize: 13, color: '#3a4a62', fontStyle: 'italic', lineHeight: 1.6 }}>
                    &ldquo;{q}&rdquo;
                  </div>
                ))}
              </div>
            );
          }

          if (tl.includes('critical analysis')) {
            const blocks = body
              .split(/(?:^|\s)-\s+(?=\*\*)/)
              .map(b => b.trim())
              .filter(Boolean);
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {blocks.map((block, i) => {
                  const match = block.match(/^\*\*(.*?)\*\*:?\s*([\s\S]*)$/);
                  const heading = match ? match[1].replace(/:$/, '').trim() : '';
                  const text = (match ? match[2] : block).replace(/\*\*/g, '').trim();
                  return (
                    <div key={i} style={{ paddingLeft: 12, borderLeft: '2.5px solid #dce3ef' }}>
                      {heading && <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2233', marginBottom: 4 }}>{heading}</div>}
                      <div style={{ fontSize: 13, color: '#4a5a72', lineHeight: 1.65 }}>{text}</div>
                    </div>
                  );
                })}
              </div>
            );
          }

          /* default */
          const html = body
            .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#1a2233;font-weight:700">$1</strong>')
            .replace(/\n\n/g, '<br/><br/>');
          return (
            <div style={{ fontSize: 13, color: '#4a5a72', lineHeight: 1.75 }} dangerouslySetInnerHTML={{ __html: html }} />
          );
        };

        const sections = summaryModal.summary ? parseSections(summaryModal.summary) : [];
        const tags: string[] = ed?.tags?.length ? ed.tags : ed?.category ? [ed.category] : [];

        return (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          >
            <div style={{ width: '100%', maxWidth: 580, background: '#f0f4fa', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(18,36,68,.18), 0 4px 16px rgba(18,36,68,.1)', border: '1px solid #dce3ef', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>

              {/* ── HEADER ── */}
              <div style={{ background: '#12192b', padding: '20px 22px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', flexShrink: 0 }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px)', backgroundSize: '36px 36px', pointerEvents: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, zIndex: 1 }}>
                  <div style={{ width: 38, height: 38, background: '#1e2d45', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, border: '1px solid #2a3d58', flexShrink: 0 }}>🧠</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#e8edf5', letterSpacing: '-.01em' }}>
                    <span style={{ color: '#f0a500' }}>Jeet AI</span> Summary
                  </div>
                </div>
                <button onClick={closeModal} style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid #2a3d58', background: '#1a2540', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#8a97b0', zIndex: 1, flexShrink: 0 }}>✕</button>
              </div>

              {/* ── META BAR ── */}
              {ed && (
                <div style={{ background: '#1a2540', padding: '14px 22px 16px', borderBottom: '1px solid #dce3ef', flexShrink: 0 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#e05050', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 7, marginBottom: 10, letterSpacing: '.03em' }}>
                    📰 {ed.source}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#e8edf5', lineHeight: 1.4, marginBottom: 10 }}>{ed.title}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {tags.map(t => (
                      <span key={t} style={{ display: 'inline-block', background: '#243352', border: '1px solid #2e4268', color: '#8fb3e8', fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 6 }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── LOADING ── */}
              {summaryModal.loading && (
                <div style={{ padding: '24px 22px', background: '#fff', flexShrink: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0 20px', gap: 8 }}>
                    <span style={{ fontSize: 36 }}>🧠</span>
                    <span style={{ fontSize: 17, fontWeight: 700, color: '#1a2233' }}>Analyzing editorial...</span>
                    <span style={{ fontSize: 12, color: '#9aa8bc' }}>UPSC lens activated</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { icon: '📄', label: 'Reading full article', color: '#3B82F6' },
                      { icon: '🔍', label: 'Extracting key arguments', color: '#06B6D4' },
                      { icon: '🎯', label: 'Mapping to UPSC syllabus', color: '#EC4899' },
                      { icon: '✏️', label: 'Generating practice questions', color: '#F97316' },
                    ].map((step, i) => (
                      <div key={step.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0f4fa', borderRadius: 10, padding: '11px 14px', border: '1px solid #dce3ef' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 18 }}>{step.icon}</span>
                          <span style={{ fontSize: 13, fontWeight: 500, color: i <= summaryModal.loadStep ? '#1a2233' : '#9aa8bc' }}>{step.label}</span>
                        </div>
                        {i < summaryModal.loadStep && <span style={{ color: '#22C55E' }}>✓</span>}
                        {i === summaryModal.loadStep && <div style={{ width: 16, height: 16, border: '2px solid #dce3ef', borderTopColor: '#2563c7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── BODY sections ── */}
              {!summaryModal.loading && summaryModal.summary && (
                <div style={{ overflowY: 'auto', flex: 1, scrollBehavior: 'smooth' }}>
                  {(() => {
                    const desiredOrder = ['key arguments', 'critical analysis', 'upsc relevance', 'key term', 'exam question', 'potential'];
                    const ordered = [...sections].sort((a, b) => {
                      const aIdx = desiredOrder.findIndex(o => a.title.toLowerCase().includes(o));
                      const bIdx = desiredOrder.findIndex(o => b.title.toLowerCase().includes(o));
                      return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
                    });
                    const filtered = ordered.filter(s => !s.title.toLowerCase().includes('takeaway'));
                    return filtered.map((sec, idx) => (
                      <div key={idx} style={{ padding: '18px 22px', borderBottom: '1px solid #dce3ef', background: idx % 2 === 0 ? '#fff' : '#f7f9fd' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#2563c7', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7, letterSpacing: '.01em' }}>
                          <div style={{ width: 22, height: 22, background: '#e8f0fd', border: '1px solid #c0d4f7', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#2563c7', flexShrink: 0 }}>{idx + 1}</div>
                          {sec.title.replace(/^#{1,3}\s*/, '').replace(/^\d+[.)]\s*/, '').replace(/\s*[-–—]\s*.*$/, '').trim()}
                        </div>
                        {renderSectionBody(sec.title, sec.body)}
                      </div>
                    ));
                  })()}
                </div>
              )}

              {/* ── ERROR / NO CONTENT ── */}
              {!summaryModal.loading && summaryModal.error && (
                <div style={{ padding: '24px 22px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 8 }}>
                  <span style={{ fontSize: 32 }}>📄</span>
                  <div style={{ fontSize: 13, color: '#4a5a72', lineHeight: 1.6, maxWidth: 360 }}>{summaryModal.error}</div>
                </div>
              )}

              {/* ── FOOTER ACTIONS ── */}
              {!summaryModal.loading && summaryModal.summary && (
                <>
                  <div style={{ background: '#f0f4fa', borderTop: '1px solid #dce3ef', padding: '14px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(120px, 100%), 1fr))', gap: 8, flexShrink: 0 }}>
                    {[
                      {
                        icon: ed?.isSaved ? '✅' : '📌',
                        label: ed?.isSaved ? 'Saved' : 'Save Note',
                        action: async () => {
                          if (!ed) return;
                          if (ed.isSaved) { router.push('/dashboard/saved-notes?tab=bookmarks'); return; }
                          await handleSave(ed.id);
                          setSummaryModal(prev => prev.editorial ? { ...prev, editorial: { ...prev.editorial!, isSaved: true } } : prev);
                        },
                      },
                      {
                        icon: '✏️', label: 'Practice MCQ',
                        action: () => { if (!ed) return; closeModal(); router.push(`/dashboard/mock-tests?from=editorial&editorialId=${ed.id}&mode=prelims`); },
                      },
                      {
                        icon: '📝', label: 'Practice Exam Qs',
                        action: () => { if (!ed) return; closeModal(); router.push(`/dashboard/mock-tests?from=editorial&editorialId=${ed.id}&mode=mains&intent=potential-questions`); },
                      },
                      {
                        icon: '🔗', label: 'Source',
                        action: () => ed?.sourceUrl && window.open(ed.sourceUrl, '_blank'),
                      },
                    ].map(btn => (
                      <button key={btn.label} onClick={btn.action} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 8px', borderRadius: 11, border: '1px solid #dce3ef', background: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#4a5a72', transition: 'all .15s' }}>
                        <span style={{ fontSize: 20 }}>{btn.icon}</span>
                        {btn.label}
                      </button>
                    ))}
                  </div>
                  {/* Secure row */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 16, padding: '10px 16px 12px', background: '#f0f4fa', flexShrink: 0 }}>
                    {[
                      { icon: <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 1L1.5 3v3.5C1.5 9.1 3.5 11 6 11s4.5-1.9 4.5-4.5V3L6 1z" stroke="#9aa8bc" strokeWidth="1.2" fill="none"/></svg>, text: '256-bit SSL encrypted' },
                      { icon: null, text: '· Powered by Jeet AI ·' },
                      { icon: <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#9aa8bc" strokeWidth="1.2"/><path d="M4 6l1.5 1.5L8 4" stroke="#9aa8bc" strokeWidth="1.2" strokeLinecap="round"/></svg>, text: 'UPSC Verified Content' },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#9aa8bc' }}>
                        {item.icon}{item.text}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
