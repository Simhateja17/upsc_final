'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { videoService, libraryService } from '@/lib/services';
import DashboardPageHero from '@/components/DashboardPageHero';
import StudyMaterialReaderModal from '@/components/StudyMaterialReaderModal';

/* ─── Types ─── */
interface VideoItem {
  id: string;
  title: string;
  subject: string;
  youtubeUrl?: string;
  url?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  viewCount?: number;
  duration?: string;
  instructor?: string;
}

interface SubjectItem {
  name: string;
  videoCount?: number;
  totalDuration?: string;
  viewCount?: number;
  description?: string;
  isNew?: boolean;
}

const CATEGORY_TABS: Array<{ label: string; width: number; active?: boolean }> = [
  { label: 'All Categories', width: 128.1 },
  { label: 'History', width: 86.188, active: true },
  { label: 'Geography', width: 110.188 },
  { label: 'Polity', width: 75.563 },
  { label: 'Economy', width: 98.238 },
  { label: 'Environment & Ecology', width: 160 },
  { label: 'Science & Technology', width: 175 },
];

type SubjectCardTheme = {
  bg: string;
  border: string;
  color: string;
  tag: string;
  progress: number;
  showNew?: boolean;
};

function getFallbackViewCount(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  }
  return 20000 + (hash % 10001);
}

/* Deterministic per-subject view count (50k–320k), so cards never show 0 */
function getSubjectViewCount(subject: SubjectItem): number {
  if (subject.viewCount && subject.viewCount > 0) return subject.viewCount;
  let hash = 0;
  const seed = subject.name;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 1000000;
  }
  return 50000 + (hash % 270001);
}

const SUBJECT_SORT_ORDER = [
  'indian polity',
  'polity',
  'indian economy',
  'history',
  'geography',
  'economy',
  'environment',
  'ethics gs4',
  'essay writing',
  "int'l relations",
  'science & tech',
  'science',
  'art & culture',
  'current affairs',
  'international relations',
  'internal security',
  'security',
];

const FALLBACK_SUBJECTS: SubjectItem[] = [
  {
    name: 'Indian Polity',
    videoCount: 41,
    totalDuration: '28h',
    viewCount: 32000,
    description: 'Complete Indian Polity covering Constitution, Parliament, Judiciary, Centre-State relations, prelims and mains.',
    isNew: true,
  },
  {
    name: 'Indian Economy',
    videoCount: 29,
    totalDuration: '18h',
    viewCount: 19000,
    description: 'Budget, banking, inflation, growth and core macroeconomics explained for UPSC clarity.',
  },
  {
    name: 'Geography',
    videoCount: 35,
    totalDuration: '22h',
    viewCount: 21000,
    description: 'Physical, Indian and world geography with conceptual maps and exam-focused coverage.',
  },
  {
    name: 'History',
    videoCount: 38,
    totalDuration: '24h',
    viewCount: 28000,
    description: 'Ancient, medieval and modern history explained with chronology and PYQ linkage.',
  },
  {
    name: 'Environment',
    videoCount: 31,
    totalDuration: '20h',
    viewCount: 24000,
    description: 'Ecology, biodiversity, climate and environment conventions simplified for quick retention.',
  },
  {
    name: 'Ethics GS4',
    videoCount: 18,
    totalDuration: '11h',
    viewCount: 9000,
    description: 'Ethics, integrity and aptitude through examples, thinkers and answer-ready frameworks.',
  },
  {
    name: 'Essay Writing',
    videoCount: 16,
    totalDuration: '10h',
    viewCount: 13000,
    description: 'Essay structure, idea generation and examples that improve flow and scoring.',
  },
  {
    name: 'Internal Security',
    videoCount: 14,
    totalDuration: '9h',
    viewCount: 7600,
    description: 'Internal security basics, organisations, challenges and current linkages in simple language.',
    isNew: true,
  },
  {
    name: "Int'l Relations",
    videoCount: 22,
    totalDuration: '14h',
    viewCount: 11000,
    description: 'India and the world, diplomacy, neighbourhood, groupings and contemporary developments.',
  },
  {
    name: 'Science & Tech',
    videoCount: 21,
    totalDuration: '13h',
    viewCount: 12000,
    description: 'Science and technology concepts, applications and current affairs translated for UPSC prep.',
  },
];

/* ─── Helpers ─── */
function normalizeSubjectKey(name: string) {
  return name.toLowerCase().replace(/&/g, '').replace(/\s+/g, ' ').trim();
}

function subjectEmoji(name: string) {
  const n = normalizeSubjectKey(name);
  if (n.includes('polity')) return '⚖️';
  if (n.includes('history')) return '🏛️';
  if (n.includes('geography')) return '🌍';
  if (n.includes('economy')) return '💰';
  if (n.includes('environment')) return '🌿';
  if (n.includes('science')) return '🔬';
  if (n.includes('art')) return '🎨';
  if (n.includes('current')) return '📰';
  if (n.includes('international')) return '🌐';
  if (n.includes('security')) return '🛡️';
  if (n.includes('csat')) return '📊';
  return '📹';
}

/*
 * Exact subject palette from the supplied reference page.
 * Each subject has a foreground accent, card background, boundary and icon tile.
 */
const SUBJECT_CARD_PALETTE: Array<{ key: string; color: string; bg: string; border: string; tag: string }> = [
  { key: 'polity',       color: '#5B8DD9', bg: '#F5F9FF', border: '#D0E2FF', tag: '#DBEAFE' },
  { key: 'history',      color: '#C0854E', bg: '#FFFBF5', border: '#FFE0B8', tag: '#FFF3E0' },
  { key: 'geography',    color: '#5BAD7A', bg: '#F5FDF6', border: '#B8F0C8', tag: '#D1FAE5' },
  { key: 'economy',      color: '#D4A853', bg: '#FFFDF5', border: '#F5E4B8', tag: '#FEF3C7' },
  { key: 'environment',  color: '#3D9E5F', bg: '#F4FDF4', border: '#B8EFC8', tag: '#DCFCE7' },
  { key: 'science',      color: '#4C6FD4', bg: '#F5F8FF', border: '#C8D8FF', tag: '#E0EBFF' },
  { key: 'current',      color: '#D4608A', bg: '#FFF5F8', border: '#FFD0E0', tag: '#FFE4EC' },
  { key: 'csat',         color: '#7C5CBF', bg: '#F8F5FF', border: '#DDD0FF', tag: '#EDE9FE' },
  { key: 'society',      color: '#C0609A', bg: '#FFF6FB', border: '#F5C8E8', tag: '#FCE7F3' },
  { key: 'governance',   color: '#7B6FA0', bg: '#F7F5FF', border: '#D8D0F8', tag: '#EDE9FE' },
  { key: 'justice',      color: '#D4784A', bg: '#FFF5F0', border: '#FFD8C0', tag: '#FFE8D8' },
  { key: 'relations',    color: '#3A8EC0', bg: '#F5FBFF', border: '#B8DFFF', tag: '#DBEEFE' },
  { key: 'agriculture',  color: '#5A9E35', bg: '#F6FDF0', border: '#C8EEAD', tag: '#DCFCE7' },
  { key: 'security',     color: '#C85858', bg: '#FFF5F5', border: '#FFD0D0', tag: '#FFE4E4' },
  { key: 'disaster',     color: '#C87A30', bg: '#FFF8F2', border: '#FFD8A8', tag: '#FFE8C8' },
  { key: 'ethics',       color: '#6A9BD4', bg: '#F6FAFF', border: '#C8DEFF', tag: '#E0EFFF' },
  { key: 'case-studies', color: '#A8853A', bg: '#FDFAF5', border: '#EAD8B0', tag: '#FEF3C7' },
];

/* Canonical colour + progress/badge for the well-known subjects. */
const CORE_SUBJECT_META: Array<{
  match: (n: string) => boolean;
  key: string;
  progress: number;
  showNew?: boolean;
}> = [
  { match: (n) => n.includes('polity'),                                  key: 'polity', progress: 80, showNew: true },
  { match: (n) => n.includes('history'),                                 key: 'history', progress: 65 },
  { match: (n) => n.includes('geography'),                               key: 'geography', progress: 55 },
  { match: (n) => n.includes('economy'),                                 key: 'economy', progress: 70 },
  { match: (n) => n.includes('environment'),                             key: 'environment', progress: 45 },
  { match: (n) => n.includes('science'),                                 key: 'science', progress: 60, showNew: true },
  { match: (n) => n.includes('current'),                                 key: 'current', progress: 45 },
  { match: (n) => n.includes('csat'),                                    key: 'csat', progress: 45 },
  { match: (n) => n.includes('society'),                                 key: 'society', progress: 45 },
  { match: (n) => n.includes('governance'),                              key: 'governance', progress: 45 },
  { match: (n) => n.includes('justice'),                                 key: 'justice', progress: 45 },
  { match: (n) => n.includes('international') || n.includes('relation'), key: 'relations', progress: 35 },
  { match: (n) => n.includes('agriculture'),                             key: 'agriculture', progress: 45 },
  { match: (n) => n.includes('security'),                                key: 'security', progress: 22, showNew: true },
  { match: (n) => n.includes('disaster'),                                key: 'disaster', progress: 45 },
  { match: (n) => n.includes('case stud'),                               key: 'case-studies', progress: 45 },
  { match: (n) => n.includes('ethics'),                                  key: 'ethics', progress: 40 },
];

function stableHash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
  return h;
}

/*
 * Build a name -> theme map for the given subject list, guaranteeing that no
 * two subjects share a colour. Known subjects keep their canonical hue; any
 * leftover/unknown subjects (or a second subject that collides on the same
 * core hue) are handed the next unused palette colour.
 */
function buildSubjectThemeMap(subjects: SubjectItem[]): Map<string, SubjectCardTheme> {
  const map = new Map<string, SubjectCardTheme>();
  const usedKeys = new Set<string>();

  const meta = new Map<string, { key: string; progress: number; showNew?: boolean }>();
  for (const subject of subjects) {
    const n = normalizeSubjectKey(subject.name);
    const core = CORE_SUBJECT_META.find((m) => m.match(n));
    meta.set(
      subject.name,
      core
        ? { key: core.key, progress: core.progress, showNew: core.showNew }
        : { key: '', progress: 30 + (stableHash(n) % 46) }, // 30-75, stable per name
    );
  }

  // Pass 1: reserve each subject's canonical hue while it is still free.
  for (const subject of subjects) {
    const info = meta.get(subject.name)!;
    if (info.key && !usedKeys.has(info.key)) {
      const pal = SUBJECT_CARD_PALETTE.find((p) => p.key === info.key)!;
      usedKeys.add(pal.key);
      map.set(subject.name, { bg: pal.bg, border: pal.border, color: pal.color, tag: pal.tag, progress: info.progress, showNew: info.showNew });
    }
  }

  // Pass 2: everyone left gets the next unused palette colour.
  for (const subject of subjects) {
    if (map.has(subject.name)) continue;
    const info = meta.get(subject.name)!;
    const pal =
      SUBJECT_CARD_PALETTE.find((p) => !usedKeys.has(p.key)) ??
      SUBJECT_CARD_PALETTE[stableHash(subject.name) % SUBJECT_CARD_PALETTE.length]; // palette exhausted: stable fallback
    usedKeys.add(pal.key);
    map.set(subject.name, { bg: pal.bg, border: pal.border, color: pal.color, tag: pal.tag, progress: info.progress, showNew: info.showNew });
  }

  return map;
}

function getSubjectReferenceTheme(name: string) {
  const n = normalizeSubjectKey(name);
  const core = CORE_SUBJECT_META.find((meta) => meta.match(n));
  return SUBJECT_CARD_PALETTE.find((palette) => palette.key === core?.key) ?? SUBJECT_CARD_PALETTE[0];
}

function formatViews(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatCardViews(n: number | undefined) {
  return formatViews(n ?? 0);
}

/* Indian-style view count for subject cards, e.g. 120000 -> "1.2L" */
function formatSubjectViews(n: number) {
  if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000) return `${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function getSubjectHeroLabel(name: string) {
  return name.replace(/^Indian\s+/i, '').trim();
}

/* Topic subtitle shown under "<Subject> Simplified" in the playlist header.
   Ordered so the most specific matcher wins first (e.g. "internal security"
   before generic checks). Every core subject has an entry so the subtitle line
   appears consistently across the catalogue. */
const SUBJECT_TOPIC_SUBTITLES: Array<{ match: (n: string) => boolean; topics: string }> = [
  { match: (n) => n.includes('econom'), topics: 'Planning, Budgets, Banking, Trade, Infrastructure, Agriculture' },
  { match: (n) => n.includes('polity'), topics: 'Constitution, Parliament, Judiciary, Federalism, Local Self-Government' },
  { match: (n) => n.includes('history'), topics: 'Ancient, Medieval, Modern India, Freedom Struggle, World History' },
  { match: (n) => n.includes('geography'), topics: 'Physical, Indian, World Geography, Climate, Resources, Mapping' },
  { match: (n) => n.includes('environment'), topics: 'Ecology, Biodiversity, Climate Change, Conservation, Conventions' },
  { match: (n) => n.includes('ethics'), topics: 'Integrity, Aptitude, Thinkers, Case Studies, Governance' },
  { match: (n) => n.includes('essay'), topics: 'Structure, Idea Generation, Examples, Flow, Effective Writing' },
  { match: (n) => n.includes('internal security') || n.includes('security'), topics: 'Challenges, Organisations, Cyber, Borders, Terrorism' },
  { match: (n) => n.includes('international') || n.includes("int'l") || n.includes('relations'), topics: 'India & the World, Diplomacy, Groupings, Neighbourhood' },
  { match: (n) => n.includes('science'), topics: 'Physics, Biology, Space, Defence, Emerging Technology' },
  { match: (n) => n.includes('art'), topics: 'Architecture, Painting, Dance, Music, Literature, Heritage' },
  { match: (n) => n.includes('current'), topics: 'Daily News, Government Schemes, Reports, Events, Analysis' },
  { match: (n) => n.includes('csat'), topics: 'Aptitude, Reasoning, Comprehension, Data Interpretation' },
];

function getSubjectTopics(name: string) {
  const n = normalizeSubjectKey(name);
  return SUBJECT_TOPIC_SUBTITLES.find((entry) => entry.match(n))?.topics ?? '';
}

function getVideoViewCount(v: VideoItem) {
  return v.viewCount ?? getFallbackViewCount(`${v.id}-${v.title}`);
}

function getYouTubeEmbedUrl(url: string) {
  if (url.includes('youtube.com/watch?v=')) {
    const id = url.split('v=')[1]?.split('&')[0];
    return id ? `https://www.youtube.com/embed/${id}` : url;
  }
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1]?.split('?')[0];
    return id ? `https://www.youtube.com/embed/${id}` : url;
  }
  return url;
}

/* Bottom "Join the Tribe" YouTube CTA — layout per reference design. */
function YouTubeTribeCta() {
  const avatars = [
    { t: 'RJ', bg: '#E9B949', color: '#1A1206' },
    { t: 'PS', bg: '#F87171', color: '#FFFFFF' },
    { t: 'NS', bg: '#34D399', color: '#FFFFFF' },
    { t: 'AG', bg: '#38BDF8', color: '#FFFFFF' },
  ];
  return (
    <div style={{ marginTop: 'clamp(28px, 3vw, 40px)' }}>
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '24px',
          background: '#0B1226',
          backgroundImage: 'radial-gradient(900px 320px at 50% -20%, rgba(233,185,73,0.12), transparent 60%)',
          color: '#FFFFFF',
          padding: 'clamp(28px, 3.4vw, 48px)',
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{ gap: 'clamp(24px, 3vw, 40px)', position: 'relative', zIndex: 1, flexWrap: 'wrap' }}
        >
          <div style={{ flex: 1, minWidth: 'min(300px, 100%)' }}>
            <div
              className="font-arimo font-bold"
              style={{ fontSize: '12px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#E9B949', marginBottom: '10px' }}
            >
              Join the Tribe
            </div>
            <h2 className="font-bold" style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 'clamp(32px, 3.6vw, 50px)', lineHeight: 1.08, letterSpacing: '-0.01em' }}>
              Never Miss a <span style={{ color: '#F3C969', fontStyle: 'italic' }}>Lecture Again.</span>
            </h2>
            <p className="font-arimo" style={{ fontSize: 'clamp(14px, 1.2vw, 16px)', lineHeight: 1.6, color: 'rgba(255,255,255,0.7)', marginTop: '12px', maxWidth: '620px' }}>
              Stay Consistent. Stay Ahead. Subscribe to Rise With Jeet on YouTube and get instant notifications for new lectures, current-affairs drops, mnemonics, and live sessions.
            </p>
            <div className="flex items-center" style={{ gap: 'clamp(14px, 1.6vw, 20px)', marginTop: '24px', flexWrap: 'wrap' }}>
              <a
                href="https://www.youtube.com/@RiseWithJeet"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-arimo font-bold text-white"
                style={{ background: '#FF2D2D', borderRadius: '12px', padding: '12px 18px', fontSize: '14px', boxShadow: '0 8px 20px -10px rgba(255,45,45,0.6)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                Join Our YouTube Family
              </a>
              <div className="inline-flex items-center" style={{ gap: '10px', fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                <span className="inline-flex">
                  {avatars.map((a, i) => (
                    <span
                      key={a.t}
                      className="font-arimo font-bold inline-flex items-center justify-center"
                      style={{ width: '28px', height: '28px', borderRadius: '999px', background: a.bg, color: a.color, fontSize: '10px', border: '2px solid #0B1226', marginLeft: i ? '-8px' : 0 }}
                    >
                      {a.t}
                    </span>
                  ))}
                </span>
                <span><b style={{ color: '#FFFFFF' }}>15,000+</b> UPSC Aspirants</span>
              </div>
            </div>
          </div>
          {/* Bell ring badge */}
          <div
            className="flex items-center justify-center"
            style={{ width: 'clamp(120px, 12vw, 176px)', height: 'clamp(120px, 12vw, 176px)', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', boxShadow: 'inset 0 0 0 1px rgba(233,185,73,0.25)', flexShrink: 0 }}
          >
            <div
              className="flex items-center justify-center"
              style={{ width: 'clamp(86px, 8.5vw, 128px)', height: 'clamp(86px, 8.5vw, 128px)', borderRadius: '50%', background: 'linear-gradient(135deg, #E9B949, #A87F1F)' }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1A1206" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M10.268 21a2 2 0 0 0 3.464 0" />
                <path d="M22 8c0-2.3-.8-4.3-2-6" />
                <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
                <path d="M4 2C2.8 3.7 2 5.7 2 8" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function openVideoInNewTab(video: VideoItem) {
  const raw = (video.videoUrl || video.youtubeUrl || video.url || '').trim();
  if (!raw || typeof window === 'undefined') return;
  const target = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  window.open(target, '_blank', 'noopener,noreferrer');
}

/* ─── Page Component ─── */
export default function VideoLecturesPage() {
  const router = useRouter();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [apiSubjects, setApiSubjects] = useState<SubjectItem[]>([]);
  const [apiVideos, setApiVideos] = useState<VideoItem[]>([]);
  const [subjectVideos, setSubjectVideos] = useState<VideoItem[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [subjectVideosLoading, setSubjectVideosLoading] = useState(false);
  const [apiStats, setApiStats] = useState<any>(null);
  // Per-subject watched video ids (a clicked "Watch" counts as watched). Persisted locally.
  const [watchedBySubject, setWatchedBySubject] = useState<Record<string, string[]>>({});

  const [watchVideo, setWatchVideo] = useState<VideoItem | null>(null);
  const [videoQuestions, setVideoQuestions] = useState<any[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResults, setQuizResults] = useState<any>(null);
  const [quizLoading, setQuizLoading] = useState(false);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [modalVideo, setModalVideo] = useState<VideoItem | null>(null);
  const [shareModalVideo, setShareModalVideo] = useState<VideoItem | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [videoSearch, setVideoSearch] = useState('');
  // Study-material reader: reuses the same in-app PDF viewer as the Library module.
  const [readModal, setReadModal] = useState<{ pages: string[]; title: string; subject: string } | null>(null);
  const [loadingRead, setLoadingRead] = useState<string | null>(null);
  const selectedVideosRef = useRef<HTMLDivElement | null>(null);
  const selectedVideoGridRef = useRef<HTMLDivElement | null>(null);
  const lastAutoScrolledSubjectRef = useRef<string | null>(null);
  const lastGridAutoScrolledSubjectRef = useRef<string | null>(null);

  /* Load subjects & featured videos */
  useEffect(() => {
    setSubjectsLoading(true);
    Promise.all([
      videoService.getSubjects().catch(() => ({ data: [] })),
      videoService.getVideos().catch(() => ({ data: [] })),
      videoService.getStats().catch(() => ({ data: null })),
    ]).then(([subRes, vidRes, statRes]) => {
      setApiSubjects(Array.isArray(subRes.data) ? subRes.data : []);
      setApiVideos(Array.isArray(vidRes.data) ? vidRes.data : []);
      setApiStats(statRes.data ?? null);
      setSubjectsLoading(false);
    });
  }, []);

  /* Load locally-stored watched progress */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('rwj_watched_videos_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') setWatchedBySubject(parsed);
      }
    } catch {}
  }, []);

  /* Load videos for selected subject */
  useEffect(() => {
    if (!selectedSubject) { setSubjectVideos([]); return; }
    setSubjectVideosLoading(true);
    videoService.getVideosBySubject(selectedSubject)
      .then((res: any) => {
        const videos = Array.isArray(res.data) ? res.data : res.data?.videos;
        setSubjectVideos(Array.isArray(videos) ? videos : []);
      })
      .catch(() => setSubjectVideos([]))
      .finally(() => setSubjectVideosLoading(false));
  }, [selectedSubject]);

  /* Load quiz questions when watching a video */
  useEffect(() => {
    if (!watchVideo) { setVideoQuestions([]); setQuizAnswers({}); setQuizResults(null); return; }
    videoService.getQuestions(watchVideo.id)
      .then((res: any) => setVideoQuestions(Array.isArray(res.data) ? res.data : []))
      .catch(() => setVideoQuestions([]));
  }, [watchVideo]);

  const handleSubjectClick = (name: string) => {
    setVideoSearch('');
    setSelectedSubject((prev) => {
      const nextSubject = prev === name ? null : name;
      lastAutoScrolledSubjectRef.current = nextSubject ? null : prev;
      lastGridAutoScrolledSubjectRef.current = nextSubject ? null : prev;
      return prev === name ? null : name;
    });
  };

  // Clicking "Watch" marks the video watched and bumps that subject's progress.
  const markVideoWatched = (subjectName: string | null | undefined, videoId: string | number | undefined) => {
    if (!subjectName || videoId === undefined || videoId === null) return;
    const key = normalizeSubjectKey(subjectName);
    const id = String(videoId);
    setWatchedBySubject((prev) => {
      const existing = prev[key] || [];
      if (existing.includes(id)) return prev;
      const next = { ...prev, [key]: [...existing, id] };
      try { localStorage.setItem('rwj_watched_videos_v1', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const openVideoActionModal = (_type: 'pdf' | 'read', video: VideoItem) => {
    setModalVideo(video);
    setShowLoginModal(true);
  };

  /*
   * "Read" opens the SAME in-app PDF viewer used by the Study Material module
   * (StudyMaterialReaderModal). Videos aren't yet mapped to their study
   * materials in the Admin Panel, so as a sample integration we open the first
   * available study-material note. Once the admin mapping exists, resolve the
   * material linked to `video` instead of walking the library tree here.
   */
  const handleRead = async (video: VideoItem) => {
    const key = String(video.id);
    if (loadingRead) return;
    setLoadingRead(key);
    try {
      const subjRes: any = await libraryService.getSubjects();
      const subjects: any[] = subjRes.data?.subjects || subjRes.data || [];

      let material: any = null;
      let subjectName = '';
      for (const subj of subjects) {
        if (!subj?.id) continue;
        const chRes: any = await libraryService.getChapters(subj.id);
        const chapters: any[] = chRes.data?.chapters || chRes.data || [];
        for (const subSubject of chapters) {
          for (const topic of (subSubject.topics || [])) {
            const found = (topic.materials || []).find((m: any) => m?._id || m?.id);
            if (found) { material = found; subjectName = subj.name; break; }
          }
          if (material) break;
        }
        if (material) break;
      }

      if (!material) {
        alert('No study material is available to read yet.');
        return;
      }

      const materialId = material._id || material.id;
      const viewRes: any = await libraryService.getMaterialViewPages(materialId, 50);
      const data = viewRes.data?.data || viewRes.data || {};
      const pages: string[] = Array.isArray(data.pages)
        ? data.pages
            .map((page: any) => page?.url)
            .filter((url: unknown): url is string => typeof url === 'string' && url.length > 0)
        : [];

      if (pages.length > 0) {
        setReadModal({
          pages,
          title: data.title || material.title || material.name || video.title,
          subject: subjectName || video.subject || '',
        });
      } else {
        alert('Could not load this note. Please try again.');
      }
    } catch {
      alert('Could not open the study material. Please try again.');
    } finally {
      setLoadingRead(null);
    }
  };

  const getVideoShareUrl = (video: VideoItem | null) => {
    if (!video) return '';
    const raw = (video.videoUrl || video.youtubeUrl || video.url || '').trim();
    if (raw) return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return typeof window !== 'undefined' ? window.location.href : '';
  };

  const copyShareUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 1800);
    } catch {
      /* clipboard blocked — no-op */
    }
  };

  const handleQuizSubmit = async () => {
    if (!watchVideo) return;
    setQuizLoading(true);
    try {
      const res = await videoService.submitQuiz(watchVideo.id, quizAnswers);
      setQuizResults(res.data ?? null);
    } catch {}
    setQuizLoading(false);
  };

  const orderedSubjects = [...apiSubjects].sort((a, b) => {
    const aIndex = SUBJECT_SORT_ORDER.indexOf(normalizeSubjectKey(a.name));
    const bIndex = SUBJECT_SORT_ORDER.indexOf(normalizeSubjectKey(b.name));
    const safeA = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
    const safeB = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
    return safeA - safeB;
  });

  const inferredSubjects = apiVideos.reduce<SubjectItem[]>((acc, video) => {
    const name = video.subject?.trim();
    if (!name) return acc;
    const existing = acc.find((item) => normalizeSubjectKey(item.name) === normalizeSubjectKey(name));
    const fallbackViews = getFallbackViewCount(`${video.id}-${name}`);
    if (existing) {
      existing.videoCount = (existing.videoCount ?? 0) + 1;
      existing.viewCount = (existing.viewCount ?? 0) + (video.viewCount ?? fallbackViews);
      return acc;
    }
    acc.push({
      name,
      videoCount: 1,
      viewCount: video.viewCount ?? fallbackViews,
    });
    return acc;
  }, []);

  const visibleSubjects = (orderedSubjects.length > 0 ? orderedSubjects : inferredSubjects.length > 0 ? inferredSubjects : FALLBACK_SUBJECTS).sort((a, b) => {
    const aIndex = SUBJECT_SORT_ORDER.indexOf(normalizeSubjectKey(a.name));
    const bIndex = SUBJECT_SORT_ORDER.indexOf(normalizeSubjectKey(b.name));
    const safeA = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
    const safeB = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
    return safeA - safeB;
  });

  const subjectThemeMap = buildSubjectThemeMap(visibleSubjects);

  const matchedSelectedSubject = visibleSubjects.find((subject) => subject.name === selectedSubject) ?? null;
  const fallbackSubjectVideos = selectedSubject
    ? apiVideos.filter((video) => normalizeSubjectKey(video.subject || '') === normalizeSubjectKey(selectedSubject))
    : [];
  const visibleSubjectVideos = subjectVideos.length > 0 ? subjectVideos : fallbackSubjectVideos;
  const filteredSubjectVideos = visibleSubjectVideos.filter((video) =>
    video.title.toLowerCase().includes(videoSearch.trim().toLowerCase()),
  );
  const selectedSubjectTheme = getSubjectReferenceTheme(selectedSubject ?? '');

  const closeSelectedSubject = () => {
    setVideoSearch('');
    setSelectedSubject(null);
  };

  useEffect(() => {
    if (!selectedSubject) {
      lastAutoScrolledSubjectRef.current = null;
      return;
    }
    if (lastAutoScrolledSubjectRef.current === selectedSubject) return;
    lastAutoScrolledSubjectRef.current = selectedSubject;

    // Scroll immediately on next paint — no delay, no re-scroll after API loads
    window.requestAnimationFrame(() => {
      const section = selectedVideosRef.current;
      const scrollContainer = section?.closest('main');
      if (!section || !scrollContainer) return;

      const sectionRect = section.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();
      const scrollTop = scrollContainer.scrollTop + sectionRect.top - containerRect.top - 12;

      scrollContainer.scrollTo({ top: Math.max(0, scrollTop), behavior: 'smooth' });
    });
  }, [selectedSubject]);

  return (
    <div className="font-arimo w-full min-h-screen" style={{ background: '#F9FAFB' }}>
      <DashboardPageHero
        // eslint-disable-next-line @next/next/no-img-element
        badgeIcon={<img src="/🎥.png" alt="video" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />}
        badgeText="SIMPLIFIED VIDEO LECTURES"
        title={
          <>
            Master Your{' '}
            <em className="not-italic" style={{ color: '#E8B84B', fontStyle: 'italic' }}>UPSC Journey</em>
            <br />
            with Expert Video Lectures
          </>
        }
        subtitle="Simplified video lectures that make even the toughest topics easy to understand and impossible to forget"
        rightElement={
          <a
            href="https://www.youtube.com/@RiseWithJeet"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-arimo font-semibold text-white"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '26843500px',
              padding: 'clamp(8px, 0.75vw, 10px) clamp(16px, 1.5vw, 20px)',
              fontSize: 'clamp(12px, 1.05vw, 14px)',
              textDecoration: 'none',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43z" fill="#FF0000"/>
              <path d="M9.75 15.02l5.75-3.27-5.75-3.27v6.54z" fill="white"/>
            </svg>
            @RiseWithJeet
          </a>
        }
        stats={[
          { value: '100+', label: 'Video Lectures', color: '#FDC700' },
          { value: `${apiStats?.totalSubjects ?? '12'}+`, label: 'Core Subjects', color: '#F87171' },
          { value: '15K+', label: 'Subscribers', color: '#4ADE80' },
          { value: '4.9', label: 'Ratings', color: '#FFFFFF' },
        ]}
      />

      {/* Browse by Subject */}
      <div
        className="w-full mx-auto"
        style={{
          maxWidth: 'min(96vw, 1480px)',
          padding: 'clamp(18px, 2.2vw, 28px) clamp(14px, 1.6vw, 24px) clamp(36px, 4vw, 56px)',
        }}
      >
        {/* Super heading + Heading */}
        <div className="text-center" style={{ marginBottom: '24px' }}>
          <div
            className="font-arimo font-bold"
            style={{
              color: '#E8B84B',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: '6px',
            }}
          >
            BROWSE BY SUBJECT
          </div>
          <h2
            className="font-arimo font-bold sm:whitespace-nowrap"
            style={{
              fontSize: 'clamp(26px, 2.7vw, 36px)',
              color: '#17223E',
              lineHeight: 1.12,
            }}
          >
            Pick Your Subject,{' '}
            <em style={{ color: '#E8B84B', fontStyle: 'italic' }}>Start Learning.</em>
          </h2>
        </div>

        {/* Subject grid */}
        {subjectsLoading ? (
          <div className="flex flex-col items-center justify-center" style={{ padding: 'clamp(32px, 4vw, 56px) 0', color: '#9CA3AF' }}>
            <div className="w-10 h-10 border-4 border-[#e8a820] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-arimo font-medium" style={{ fontSize: 'clamp(14px, 1.2vw, 16px)' }}>
              Loading subjects...
            </p>
          </div>
        ) : (
          <div
            className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 justify-center"
            style={{
              justifyContent: 'center',
              justifyItems: 'center',
              columnGap: '20px',
              rowGap: '22px',
              marginBottom: selectedSubject ? 'clamp(24px, 2.5vw, 36px)' : '0',
            }}
          >
            {visibleSubjects.map((subject) => {
              const theme = subjectThemeMap.get(subject.name) ?? { bg: '#F5F9FF', border: '#D0E2FF', color: '#5B8DD9', tag: '#DBEAFE', progress: 50 };
              const isSelected = selectedSubject === subject.name;
              const showNew = theme.showNew || subject.isNew;
              const watchedCount = (watchedBySubject[normalizeSubjectKey(subject.name)] || []).length;
              const totalCount = subject.videoCount ?? 0;
              const progressPct = totalCount > 0 ? Math.min(100, Math.round((watchedCount / totalCount) * 100)) : 0;
              return (
                <button
                  type="button"
                  key={subject.name}
                  onClick={() => handleSubjectClick(subject.name)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = `0 12px 28px ${theme.color}30`;
                    e.currentTarget.style.borderColor = theme.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = isSelected ? 'translateY(-2px) scale(1.01)' : 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = isSelected ? `0 8px 28px ${theme.color}45` : '0 1px 4px rgba(0,0,0,0.05)';
                    e.currentTarget.style.borderColor = isSelected ? theme.color : theme.border;
                  }}
                  style={{
                    width: '100%',
                    minHeight: '188px',
                    background: isSelected ? theme.color : theme.bg,
                    borderRadius: '20px',
                    padding: '20px 18px 18px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                    border: `1.5px solid ${isSelected ? theme.color : theme.border}`,
                    boxShadow: isSelected ? `0 8px 28px ${theme.color}45` : '0 1px 4px rgba(0,0,0,0.05)',
                    transform: isSelected ? 'translateY(-2px) scale(1.01)' : 'translateY(0) scale(1)',
                    position: 'relative',
                    textAlign: 'left',
                  }}
                >
                  {showNew && (
                    <div
                      className="font-arimo font-bold"
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        height: '22px',
                        minWidth: '48px',
                        padding: '3px 11px 0',
                        borderRadius: '20px',
                        background: '#3B82F6',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        lineHeight: '16px',
                        letterSpacing: '0',
                      }}
                    >
                      NEW
                    </div>
                  )}

                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: isSelected ? 'rgba(255,255,255,0.22)' : theme.tag,
                      fontSize: '24px',
                      lineHeight: '32px',
                      marginBottom: '12px',
                    }}
                  >
                    {subjectEmoji(subject.name)}
                  </div>
                  <div
                    className="font-arimo font-bold"
                    title={subject.name}
                    style={{
                      fontSize: '17px',
                      lineHeight: '22px',
                      color: isSelected ? '#FFFFFF' : '#1E293B',
                      letterSpacing: '-0.3px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {subject.name}
                  </div>
                  <div
                    className="font-arimo flex items-center"
                    style={{ fontSize: '13px', lineHeight: '18px', color: isSelected ? 'rgba(255,255,255,0.75)' : '#64748B', marginTop: '6px', marginBottom: '12px', gap: '14px', whiteSpace: 'nowrap' }}
                  >
                    <span className="inline-flex items-center" style={{ gap: '5px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <polygon points="10 8 16 12 10 16 10 8" />
                      </svg>
                      {subject.videoCount ?? 0} videos
                    </span>
                    <span className="inline-flex items-center" style={{ gap: '5px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      {formatSubjectViews(getSubjectViewCount(subject))}
                    </span>
                  </div>
                  {(() => {
                    const status = progressPct === 100 ? 'Completed' : progressPct > 0 ? 'In progress' : 'Not started';
                    const barColor = isSelected ? 'rgba(255,255,255,0.85)' : progressPct === 100 ? '#2563EB' : theme.color;
                    const labelColor = isSelected ? 'rgba(255,255,255,0.9)' : '#64748B';
                    return (
                      <>
                        {/* Status + completion percentage */}
                        <div
                          className="flex items-center justify-between font-arimo font-bold"
                          style={{ fontSize: '11px', color: labelColor, marginBottom: '6px', width: '100%' }}
                        >
                          <span>{status}</span>
                          <span>{progressPct}%</span>
                        </div>
                        <div
                          className="rounded-full overflow-hidden"
                          style={{ width: '100%', height: '6px', background: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.7)' }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${progressPct}%`, background: barColor, transition: 'width 0.3s ease' }}
                          />
                        </div>
                      </>
                    );
                  })()}
                </button>
              );
            })}
          </div>
        )}

        {/* YouTube CTA banner – shown below subjects when nothing is selected */}
        {!selectedSubject && <YouTubeTribeCta />}

        {/* Inline videos for selected subject */}
        {selectedSubject && (
          <div ref={selectedVideosRef} style={{ marginTop: 'clamp(24px, 2.5vw, 36px)' }}>
            <div
              style={{
                border: `1.5px solid ${selectedSubjectTheme.border}`,
                borderRadius: '24px',
                marginBottom: 'clamp(20px, 2vw, 28px)',
                boxShadow: `0 6px 48px ${selectedSubjectTheme.color}14`,
                overflow: 'hidden',
              }}
            >
              <div
                className="flex items-center justify-between"
                style={{
                  gap: '16px',
                  flexWrap: 'wrap',
                  padding: 'clamp(18px, 2vw, 26px)',
                  background: `linear-gradient(135deg, ${selectedSubjectTheme.bg} 0%, #FFFFFF 100%)`,
                  borderBottom: `1.5px solid ${selectedSubjectTheme.border}`,
                }}
              >
                <div className="flex items-center" style={{ gap: '12px', marginBottom: '4px' }}>
                  <div
                    className="flex items-center justify-center"
                    style={{
                      background: selectedSubjectTheme.tag,
                      borderRadius: '16px',
                      width: '56px',
                      height: '56px',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: '24px', lineHeight: '32px' }}>{subjectEmoji(selectedSubject)}</span>
                  </div>
                  <div>
                    <h2
                      className="font-arimo font-bold"
                      style={{ fontSize: '24px', color: '#1E293B', lineHeight: '32px' }}
                    >
                      {getSubjectHeroLabel(selectedSubject)} Simplified
                    </h2>
                    {(getSubjectTopics(selectedSubject) || matchedSelectedSubject?.description) && (
                      <p className="font-arimo" style={{ fontSize: '13px', lineHeight: '18px', color: '#64748B', marginTop: '2px' }}>
                        {getSubjectTopics(selectedSubject) || matchedSelectedSubject?.description}
                      </p>
                    )}
                    <p className="font-arimo" style={{ fontSize: '14px', lineHeight: '20px', color: '#94A3B8', marginTop: '2px' }}>
                      {'\u{1F4FA}'} {visibleSubjectVideos.length} Video{visibleSubjectVideos.length !== 1 ? 's' : ''}
                      {matchedSelectedSubject?.totalDuration ? ` · ${matchedSelectedSubject.totalDuration}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center" style={{ gap: '10px' }}>
                  <div style={{ position: 'relative' }}>
                    <span
                      aria-hidden="true"
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '12px', pointerEvents: 'none' }}
                    >
                      {'\u{1F50D}'}
                    </span>
                    <input
                      type="search"
                      value={videoSearch}
                      onChange={(event) => setVideoSearch(event.target.value)}
                      placeholder="Search videos..."
                      aria-label={`Search ${selectedSubject} videos`}
                      className="font-arimo outline-none"
                      style={{
                        width: 'clamp(150px, 16vw, 210px)',
                        height: '38px',
                        padding: '0 12px 0 32px',
                        borderRadius: '12px',
                        border: '1px solid #E2E8F0',
                        background: '#FFFFFF',
                        color: '#475569',
                        fontSize: '12px',
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={closeSelectedSubject}
                    aria-label={`Close ${selectedSubject} playlist`}
                    className="flex items-center justify-center"
                    style={{ width: '38px', height: '38px', borderRadius: '12px', border: 'none', background: '#F1F5F9', color: '#64748B', cursor: 'pointer', fontSize: '16px', flexShrink: 0 }}
                  >
                    {'\u2715'}
                  </button>
                </div>
              </div>
              <div style={{ padding: 'clamp(18px, 2vw, 26px)', background: '#FFFFFF' }}>
                {/* The topic/description line is shown in the header (under "<Subject>
                    Simplified"), matching the Economy layout, so it is not repeated here. */}

            {subjectVideosLoading ? (
              <div className="flex flex-col items-center justify-center" style={{ padding: 'clamp(32px, 4vw, 56px) 0', color: '#9CA3AF' }}>
                <p className="font-arimo font-medium" style={{ fontSize: 'clamp(14px, 1.2vw, 16px)' }}>
                  Loading videos...
                </p>
              </div>
            ) : filteredSubjectVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center" style={{ padding: 'clamp(32px, 4vw, 56px) 0', color: '#9CA3AF' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>{videoSearch ? '\u{1F50D}' : '\u{1F4ED}'}</div>
                <p className="font-arimo font-medium" style={{ fontSize: 'clamp(14px, 1.2vw, 16px)' }}>
                  {videoSearch ? 'No videos match your search.' : `No videos available for ${selectedSubject}`}
                </p>
              </div>
            ) : (
              <>
                <style>{`
                  .vl-card{background:#fff;border:1px solid #E6EAF2;border-radius:18px;padding:14px;transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease;}
                  .vl-card:hover{transform:translateY(-3px);box-shadow:0 18px 40px -22px rgba(11,18,38,.25);border-color:rgba(15,26,53,.18);}
                  .vl-thumb{position:relative;border-radius:14px;overflow:hidden;aspect-ratio:16/9;background:#1A2240;display:flex;align-items:center;justify-content:center;}
                  .vl-thumb img{width:100%;height:100%;object-fit:cover;transition:transform .5s ease;}
                  .vl-card:hover .vl-thumb img{transform:scale(1.04);}
                  .vl-scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 55%,rgba(0,0,0,.55) 100%);}
                  .vl-play-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .25s ease;background:rgba(11,18,38,.35);}
                  .vl-card:hover .vl-play-overlay{opacity:1;}
                  .vl-play-btn{width:56px;height:56px;border-radius:999px;background:#FF2D2D;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 30px -8px rgba(255,45,45,.6);border:none;cursor:pointer;}
                  .vl-pill{position:absolute;display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;letter-spacing:.02em;padding:4px 9px;border-radius:999px;z-index:2;}
                  .vl-pill-dark{background:rgba(11,18,38,.85);color:#fff;backdrop-filter:blur(6px);}
                  .vl-pill-gold{background:#E9B949;color:#1A1206;}
                  .vl-pill-red{background:#FF2D2D;color:#fff;}
                  .vl-pill-blue{background:#2563EB;color:#fff;}
                  .vl-bookmark{position:absolute;top:10px;right:10px;width:34px;height:34px;border-radius:10px;background:rgba(255,255,255,.92);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px);cursor:pointer;transition:all .2s ease;border:none;z-index:2;}
                  .vl-bookmark:hover{background:#fff;transform:scale(1.06);}
                  .vl-bookmark.active{background:#E9B949;}
                  .vl-watched-bar{position:absolute;left:0;right:0;bottom:0;height:3px;background:rgba(0,0,0,.4);z-index:2;}
                  .vl-watched-bar>span{display:block;height:100%;background:#FF2D2D;}
                  .vl-chip{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#B88A1D;}
                  .vl-title{font-weight:700;font-size:14.5px;line-height:1.35;margin-top:6px;color:#101828;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:42px;}
                  .vl-actions{display:flex;align-items:center;gap:8px;padding-top:16px;margin-top:12px;border-top:1px solid #E6EAF2;}
                  .vl-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-weight:600;font-size:13px;border-radius:10px;padding:9px 14px;transition:all .2s ease;white-space:nowrap;cursor:pointer;border:none;}
                  .vl-btn-watch{flex:1;background:#FF2D2D;color:#fff;box-shadow:0 6px 16px -8px rgba(255,45,45,.6);}
                  .vl-btn-watch:hover{background:#E62020;transform:translateY(-1px);box-shadow:0 10px 22px -8px rgba(255,45,45,.7);}
                  .vl-btn-read{flex:1;background:#F3F6FC;color:#0B1226;box-shadow:inset 0 0 0 1px #E3E9F4;}
                  .vl-btn-read:hover{background:#EAF0FA;}
                  .vl-btn-getpdf{flex:1;position:relative;overflow:hidden;background:linear-gradient(180deg,#FFD96B,#F5B301);color:#3A2700;box-shadow:0 8px 22px -10px rgba(245,179,1,.7),inset 0 1px 0 rgba(255,255,255,.6);}
                  .vl-btn-getpdf:hover{filter:brightness(1.03);}
                  .vl-btn-getpdf::after{content:"";position:absolute;inset:0;background:linear-gradient(120deg,transparent 30%,rgba(255,255,255,.35) 50%,transparent 70%);transform:translateX(-100%);transition:transform 1.2s ease;pointer-events:none;}
                  .vl-btn-getpdf:hover::after{transform:translateX(100%);}
                  .vl-icon-btn{flex-shrink:0;background:#F3F6FC;color:#0B1226;box-shadow:inset 0 0 0 1px #E3E9F4;border-radius:10px;padding:9px;display:inline-flex;align-items:center;justify-content:center;transition:all .2s ease;cursor:pointer;border:none;}
                  .vl-icon-btn:hover{background:#EAF0FA;}
                `}</style>
                <div
                  ref={selectedVideoGridRef}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))',
                    gap: 'clamp(16px, 1.8vw, 24px)',
                  }}
                >
                  {filteredSubjectVideos.map((video) => {
                    const watchedIds = watchedBySubject[normalizeSubjectKey(selectedSubject ?? video.subject ?? '')] || [];
                    const isWatched = watchedIds.includes(String(video.id));
                    const badges = [
                      { label: 'NEW', cls: 'vl-pill-red', pdf: false },
                      { label: 'POPULAR', cls: 'vl-pill-gold', pdf: false },
                      { label: 'PDF INCLUDED', cls: 'vl-pill-blue', pdf: true },
                    ];
                    const badge = badges[stableHash(String(video.id)) % badges.length];
                    return (
                    <article key={video.id} className="vl-card font-arimo">
                      <div className="vl-thumb">
                        {video.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={video.thumbnailUrl} alt={video.title} />
                        ) : (
                          <span style={{ fontSize: 'clamp(48px, 5vw, 64px)' }}>{subjectEmoji(selectedSubject)}</span>
                        )}
                        <div className="vl-scrim" />
                        {/* Top-left badge */}
                        <span className={`vl-pill ${badge.cls}`} style={{ top: '10px', left: '10px' }}>
                          {badge.pdf && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <path d="M14 2v6h6" />
                            </svg>
                          )}
                          {badge.label}
                        </span>
                        {/* Bookmark */}
                        <button className="vl-bookmark" aria-label="Bookmark" onClick={(e) => e.currentTarget.classList.toggle('active')}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B1226" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                          </svg>
                        </button>
                        {/* Duration */}
                        {video.duration && (
                          <span className="vl-pill vl-pill-dark" style={{ bottom: '10px', right: '10px' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                            </svg>
                            {video.duration}
                          </span>
                        )}
                        {/* Watched progress */}
                        {isWatched && <div className="vl-watched-bar"><span style={{ width: '100%' }} /></div>}
                        {/* Hover play overlay */}
                        <div className="vl-play-overlay">
                          <button
                            className="vl-play-btn"
                            aria-label="Play video"
                            onClick={() => { markVideoWatched(selectedSubject ?? video.subject, video.id); openVideoInNewTab(video); }}
                          >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
                          </button>
                        </div>
                      </div>

                      <div style={{ padding: '14px 4px 4px' }}>
                        <div className="vl-chip">{matchedSelectedSubject?.name ?? selectedSubject}</div>
                        <h3 className="vl-title" title={video.title}>{video.title}</h3>

                        {/* Action row: Watch · Read · Get PDF · Share */}
                        <div className="vl-actions">
                          <button
                            className="vl-btn vl-btn-watch"
                            onClick={() => { markVideoWatched(selectedSubject ?? video.subject, video.id); openVideoInNewTab(video); }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
                            {isWatched ? 'Resume' : 'Watch'}
                          </button>
                          <button
                            className="vl-btn vl-btn-read"
                            title="Read in Study Material"
                            onClick={() => handleRead(video)}
                            disabled={loadingRead === String(video.id)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                            </svg>
                            {loadingRead === String(video.id) ? 'Opening…' : 'Read'}
                          </button>
                          <button className="vl-btn vl-btn-getpdf" title="Get PDF" onClick={() => openVideoActionModal('pdf', video)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Get PDF
                          </button>
                          <button className="vl-icon-btn" title="Share" aria-label="Share" onClick={() => setShareModalVideo(video)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </article>
                    );
                  })}
                </div>

              </>
            )}
              </div>
            </div>

            {/* YouTube CTA Banner – always shown below videos when a subject is selected */}
            {!subjectVideosLoading && <YouTubeTribeCta />}
          </div>
        )}
      </div>

      {/* Study-material reader – reuses the shared Study Material PDF viewer */}
      {readModal && (
        <StudyMaterialReaderModal
          pages={readModal.pages}
          title={readModal.title}
          subjectLabel={readModal.subject}
          onClose={() => setReadModal(null)}
        />
      )}

      {/* Watch Video + Quiz Modal */}
      {watchVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={() => setWatchVideo(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '820px',
              maxHeight: '92vh',
              overflowY: 'auto',
              margin: '0 16px',
              boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between" style={{ padding: '20px 24px 16px' }}>
              <div style={{ flex: 1, paddingRight: '16px' }}>
                <p className="font-arimo font-bold" style={{ fontSize: '18px', color: '#101828', lineHeight: 1.3 }}>
                  {watchVideo.title}
                </p>
                {watchVideo.instructor && (
                  <p className="font-arimo" style={{ fontSize: '13px', color: '#6A7282', marginTop: '4px' }}>
                    by {watchVideo.instructor}
                  </p>
                )}
              </div>
              <button
                onClick={() => setWatchVideo(null)}
                className="flex items-center justify-center flex-shrink-0"
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F3F4F6', border: 'none', cursor: 'pointer' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="#4A5565" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <div style={{ padding: '0 24px', marginBottom: '24px' }}>
              {watchVideo.videoUrl ? (
                <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: '14px', overflow: 'hidden', background: '#000' }}>
                  <iframe
                    src={getYouTubeEmbedUrl(watchVideo.videoUrl)}
                    title={watchVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  />
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center font-arimo"
                  style={{ background: '#F3F4F6', borderRadius: '14px', height: '240px', color: '#9CA3AF', fontSize: '14px' }}
                >
                  <span style={{ fontSize: '36px', marginBottom: '8px' }}>{'\u{1F3AC}'}</span>
                  Video URL not set yet
                </div>
              )}
            </div>

            <div style={{ padding: '0 24px 28px' }}>
              {quizResults ? (
                <div>
                  <div
                    className="flex items-center gap-3"
                    style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px' }}
                  >
                    <span style={{ fontSize: '28px' }}>{'\u{1F3AF}'}</span>
                    <div>
                      <p className="font-arimo font-bold" style={{ fontSize: '18px', color: '#065F46' }}>
                        You scored {quizResults.score} / {quizResults.total}
                      </p>
                      <p className="font-arimo" style={{ fontSize: '13px', color: '#047857' }}>
                        {quizResults.total > 0 ? `${Math.round((quizResults.score / quizResults.total) * 100)}% correct` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {quizResults.results.map((r: any, idx: number) => (
                      <div key={r.id} style={{ background: '#F9FAFB', borderRadius: '12px', padding: '16px' }}>
                        <p className="font-arimo font-semibold" style={{ fontSize: '14px', color: '#101828', marginBottom: '10px' }}>
                          Q{idx + 1}. {r.question}
                        </p>
                        <div className="space-y-2">
                          {(r.options as string[]).map((opt: string, i: number) => {
                            const isCorrect = i === r.correctOption;
                            const isSelected = i === r.selected;
                            let bg = '#FFFFFF', border = '#E5E7EB', color = '#374151';
                            if (isCorrect) { bg = '#ECFDF5'; border = '#6EE7B7'; color = '#065F46'; }
                            else if (isSelected && !isCorrect) { bg = '#FEF2F2'; border = '#FECACA'; color = '#991B1B'; }
                            return (
                              <div key={i} style={{ background: bg, border: `1px solid ${border}`, borderRadius: '8px', padding: '8px 12px', color, fontSize: '13px' }}
                                className="font-arimo flex items-center gap-2">
                                <span style={{ fontWeight: 600 }}>{['A', 'B', 'C', 'D'][i]}.</span>
                                {opt}
                                {isCorrect && <span style={{ marginLeft: 'auto' }}>{'\u2713'}</span>}
                                {isSelected && !isCorrect && <span style={{ marginLeft: 'auto' }}>{'\u2717'}</span>}
                              </div>
                            );
                          })}
                        </div>
                        {r.explanation && (
                          <p className="font-arimo" style={{ fontSize: '12px', color: '#6A7282', marginTop: '8px', padding: '8px 12px', background: '#FFFBEB', borderRadius: '8px', border: '1px solid #FDE68A' }}>
                            {'\u{1F4A1}'} {r.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => { setQuizAnswers({}); setQuizResults(null); }}
                    className="font-arimo font-semibold"
                    style={{ marginTop: '16px', padding: '10px 24px', borderRadius: '10px', background: '#162456', color: '#FFFFFF', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                  >
                    Retake Quiz
                  </button>
                </div>
              ) : videoQuestions.length === 0 ? (
                <p className="font-arimo text-center" style={{ fontSize: '14px', color: '#9CA3AF', padding: '12px 0' }}>
                  No quiz questions for this video yet.
                </p>
              ) : (
                <div>
                  <h3 className="font-arimo font-bold" style={{ fontSize: '16px', color: '#101828', marginBottom: '16px' }}>
                    {'\u{1F4DD}'} Test Your Understanding ({videoQuestions.length} question{videoQuestions.length !== 1 ? 's' : ''})
                  </h3>
                  <div className="space-y-5">
                    {videoQuestions.map((q: any, idx: number) => (
                      <div key={q.id} style={{ background: '#F9FAFB', borderRadius: '12px', padding: '16px' }}>
                        <p className="font-arimo font-semibold" style={{ fontSize: '14px', color: '#101828', marginBottom: '10px' }}>
                          Q{idx + 1}. {q.question}
                        </p>
                        <div className="space-y-2">
                          {(q.options as string[]).map((opt: string, i: number) => {
                            const selected = quizAnswers[q.id] === i;
                            return (
                              <button
                                key={i}
                                onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: i }))}
                                className="w-full text-left font-arimo flex items-center gap-2"
                                style={{
                                  background: selected ? '#EFF6FF' : '#FFFFFF',
                                  border: `1.5px solid ${selected ? '#3B82F6' : '#E5E7EB'}`,
                                  borderRadius: '8px',
                                  padding: '9px 12px',
                                  fontSize: '13px',
                                  color: selected ? '#1D4ED8' : '#374151',
                                  fontWeight: selected ? 600 : 400,
                                  cursor: 'pointer',
                                }}
                              >
                                <span style={{ fontWeight: 700, minWidth: '18px' }}>{['A', 'B', 'C', 'D'][i]}.</span>
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleQuizSubmit}
                    disabled={quizLoading || Object.keys(quizAnswers).length === 0}
                    className="font-arimo font-bold text-white"
                    style={{
                      marginTop: '20px',
                      padding: '12px 32px',
                      borderRadius: '12px',
                      background: quizLoading || Object.keys(quizAnswers).length === 0 ? '#9CA3AF' : '#162456',
                      border: 'none',
                      cursor: quizLoading || Object.keys(quizAnswers).length === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    {quizLoading ? 'Submitting...' : `Submit Answers (${Object.keys(quizAnswers).length}/${videoQuestions.length})`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shared modal styles (Get PDF + Share popups) */}
      <style>{`
        /* Modals — ported 1:1 from VIDEO_LECT_SURI_FINAL reference */
        .vlm-backdrop{position:fixed;inset:0;z-index:120;background:rgba(0,0,0,.6);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;}
        .vlm-modal{width:100%;max-width:420px;background:#fff;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden;position:relative;animation:vlm-pop .3s ease;}
        @keyframes vlm-pop{from{transform:scale(.9);opacity:0}to{transform:none;opacity:1}}
        .vlm-display{font-family:var(--font-playfair),'Playfair Display',Georgia,serif;letter-spacing:-.01em;}
        .vlm-close{position:absolute;top:16px;right:16px;width:32px;height:32px;border-radius:50%;background:#f0f0f0;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;color:#666;transition:all .2s;}
        .vlm-close:hover{background:#e0e0e0;color:#333;}
        /* PDF modal */
        .vlm-pdf-icon{width:64px;height:64px;background:linear-gradient(135deg,#ff4d4d,#e53935);border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;color:#fff;font-weight:700;font-size:14px;letter-spacing:.5px;}
        .vlm-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-weight:600;font-size:13px;border-radius:10px;padding:10px 14px;transition:all .2s ease;white-space:nowrap;cursor:pointer;border:none;text-decoration:none;}
        .vlm-btn-ghost{background:#f3f6fc;color:#0b1226;box-shadow:inset 0 0 0 1px #e3e9f4;}
        .vlm-btn-ghost:hover{background:#eaf0fa;}
        .vlm-btn-gold{position:relative;overflow:hidden;background:linear-gradient(180deg,#ffd96b,#f5b301);color:#3a2700;box-shadow:0 8px 22px -10px rgba(245,179,1,.7),inset 0 1px 0 rgba(255,255,255,.6);}
        .vlm-btn-gold:hover{filter:brightness(1.03);}
        .vlm-btn-gold::after{content:"";position:absolute;inset:0;background:linear-gradient(120deg,transparent 30%,rgba(255,255,255,.35) 50%,transparent 70%);transform:translateX(-100%);transition:transform 1.2s ease;pointer-events:none;}
        .vlm-btn-gold:hover::after{transform:translateX(100%);}
        /* Share modal */
        .vlm-share-header{background:linear-gradient(135deg,#1a1a1a,#0b1226);padding:32px 32px 24px;text-align:center;position:relative;}
        .vlm-share-header-icon{width:56px;height:56px;background:#e53935;border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;}
        .vlm-share-body{padding:24px;}
        .vlm-share-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0;}
        .vlm-share-tile{display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px 8px;border-radius:12px;background:#f8f8f8;cursor:pointer;transition:all .2s;text-decoration:none;border:none;}
        .vlm-share-tile:hover{background:#f0f0f0;transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.1);}
        .vlm-share-ic{width:48px;height:48px;border-radius:12px;color:#fff;display:flex;align-items:center;justify-content:center;}
        .vlm-share-label{font-size:11px;font-weight:600;color:#333;}
        .vlm-url-box{display:flex;align-items:center;gap:12px;padding:12px 16px;border:2px dashed #e0e0e0;border-radius:12px;margin-top:16px;}
        .vlm-url-text{flex:1;font-size:12px;color:#666;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:transparent;border:0;outline:0;}
        .vlm-copy-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:#0b1226;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;white-space:nowrap;}
        .vlm-copy-btn:hover{background:#1a2a4a;}
        .vlm-copy-btn.copied{background:#16a34a;}
      `}</style>

      {/* ============ GET PDF POPUP (redirect to Study Material) ============ */}
      {showLoginModal && (
        <div className="vlm-backdrop font-arimo" onClick={() => setShowLoginModal(false)}>
          <div className="vlm-modal" onClick={(e) => e.stopPropagation()} style={{ padding: '32px' }}>
            <button className="vlm-close" onClick={() => setShowLoginModal(false)} aria-label="Close">×</button>
            <div className="vlm-pdf-icon">PDF</div>
            <h3 className="vlm-display" style={{ fontSize: '24px', textAlign: 'center', marginBottom: '12px', color: '#0B1226' }}>Download PDF</h3>
            <p style={{ textAlign: 'center', fontSize: '14px', color: '#4B5563', marginBottom: '24px', lineHeight: 1.6 }}>
              Please navigate to <strong style={{ color: '#0B1226' }}>Study Material</strong> to download the PDF
              {modalVideo ? <> for &lsquo;<em style={{ color: '#0B1226', fontStyle: 'italic' }}>{modalVideo.title}</em>&rsquo;.</> : '.'}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="vlm-btn vlm-btn-ghost" style={{ flex: 1 }} onClick={() => setShowLoginModal(false)}>Got it</button>
              <button className="vlm-btn vlm-btn-gold" style={{ flex: 1 }} onClick={() => { setShowLoginModal(false); router.push('/dashboard/library'); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                Go to Study Material
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ SHARE POPUP ============ */}
      {shareModalVideo && (() => {
        const shareUrl = getVideoShareUrl(shareModalVideo);
        const shareText = shareModalVideo.title;
        const u = encodeURIComponent(shareUrl);
        const t = encodeURIComponent(shareText);
        // Official brand glyphs (filled), matching the reference share modal.
        const tiles: Array<{ label: string; bg: string; path: string; href?: string; copy?: boolean }> = [
          { label: 'WhatsApp', bg: '#25D366', href: `https://wa.me/?text=${t}%20${u}`, path: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z' },
          { label: 'Telegram', bg: '#0088cc', href: `https://t.me/share/url?url=${u}&text=${t}`, path: 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z' },
          { label: 'X / Twitter', bg: '#1DA1F2', href: `https://twitter.com/intent/tweet?url=${u}&text=${t}`, path: 'M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z' },
          { label: 'LinkedIn', bg: '#0077B5', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
          { label: 'Facebook', bg: '#1877F2', href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
          { label: 'Email', bg: '#FF5252', href: `mailto:?subject=${t}&body=${u}`, path: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z' },
          { label: 'Instagram', bg: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', copy: true, path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' },
          { label: 'QR Code', bg: '#000', copy: true, path: 'M3 3h8v8H3zm0 10h8v8H3zm10-10h8v8h-8zm0 10h8v8h-8z' },
        ];
        return (
          <div className="vlm-backdrop font-arimo" onClick={() => setShareModalVideo(null)}>
            <div className="vlm-modal" onClick={(e) => e.stopPropagation()} style={{ padding: 0 }}>
              <div className="vlm-share-header">
                <button className="vlm-close" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }} onClick={() => setShareModalVideo(null)} aria-label="Close">×</button>
                <div className="vlm-share-header-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                </div>
                <h3 className="vlm-display" style={{ fontSize: '24px', color: '#fff', marginBottom: '8px' }}>Share this Lecture</h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>{shareText}</p>
              </div>
              <div className="vlm-share-body">
                <div className="vlm-share-grid">
                  {tiles.map((tile) => {
                    const inner = (
                      <>
                        <span className="vlm-share-ic" style={{ background: tile.bg }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d={tile.path} /></svg>
                        </span>
                        <span className="vlm-share-label">{tile.label}</span>
                      </>
                    );
                    return tile.copy ? (
                      <button key={tile.label} type="button" className="vlm-share-tile" onClick={() => copyShareUrl(shareUrl)}>{inner}</button>
                    ) : (
                      <a key={tile.label} className="vlm-share-tile" href={tile.href} target="_blank" rel="noopener noreferrer">{inner}</a>
                    );
                  })}
                </div>
                <div className="vlm-url-box">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                  <span className="vlm-url-text">{shareUrl}</span>
                  <button className={`vlm-copy-btn${shareCopied ? ' copied' : ''}`} onClick={() => copyShareUrl(shareUrl)}>
                    {shareCopied ? (
                      <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> Copied!</>
                    ) : (
                      <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg> Copy</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
