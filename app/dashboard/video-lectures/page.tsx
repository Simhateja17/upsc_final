'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { videoService } from '@/lib/services';
import DashboardPageHero from '@/components/DashboardPageHero';

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

/* Topic subtitle shown under "<Subject> Simplified" in the playlist header. */
const SUBJECT_TOPIC_SUBTITLES: Array<{ match: (n: string) => boolean; topics: string }> = [
  { match: (n) => n.includes('econom'), topics: 'Planning, Budgets, Banking, Trade, Infrastructure, Agriculture' },
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
                    {getSubjectTopics(selectedSubject) && (
                      <p className="font-arimo" style={{ fontSize: '13px', lineHeight: '18px', color: '#64748B', marginTop: '2px' }}>
                        {getSubjectTopics(selectedSubject)}
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
                {matchedSelectedSubject?.description ? (
                  <p className="font-arimo" style={{ fontSize: 'clamp(13px, 1.12vw, 15px)', color: '#94A3B8', lineHeight: 1.5, marginBottom: '18px' }}>
                    {matchedSelectedSubject.description}
                  </p>
                ) : null}

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
                  .vl-btn{display:inline-flex;align-items:center;gap:8px;font-weight:600;font-size:13px;border-radius:12px;transition:all .2s ease;white-space:nowrap;cursor:pointer;}
                  .vl-btn-watch{flex:1;justify-content:center;background:linear-gradient(135deg,#FF3B3B,#C61212);color:#fff;padding:10px 14px;box-shadow:0 8px 20px -10px rgba(198,18,18,.55),inset 0 1px 0 rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.08);position:relative;overflow:hidden;}
                  .vl-btn-watch:hover{transform:translateY(-1px);box-shadow:0 12px 26px -10px rgba(198,18,18,.65),inset 0 1px 0 rgba(255,255,255,.22);}
                  .vl-watch-icon{width:20px;height:20px;border-radius:6px;background:rgba(255,255,255,.18);display:inline-flex;align-items:center;justify-content:center;}
                  .vl-btn-read{background:#fff;color:#0F1A35;padding:10px 14px;border:1px solid rgba(15,26,53,.10);box-shadow:0 4px 10px -6px rgba(11,18,38,.18),inset 0 1px 0 #fff;}
                  .vl-btn-read:hover{background:#0B1226;color:#fff;border-color:#0B1226;transform:translateY(-1px);}
                  .vl-btn-getpdf{position:relative;overflow:hidden;background:linear-gradient(180deg,#FCD564 0%,#E9B949 55%,#CAA036 100%);color:#1A1206;padding:10px 16px;font-weight:700;border:1px solid rgba(184,138,29,.55);box-shadow:0 8px 18px -8px rgba(202,160,54,.55),inset 0 1px 0 rgba(255,255,255,.55),inset 0 -2px 0 rgba(133,98,16,.18);}
                  .vl-btn-getpdf:hover{transform:translateY(-1px);box-shadow:0 12px 24px -8px rgba(202,160,54,.7),inset 0 1px 0 rgba(255,255,255,.65),inset 0 -2px 0 rgba(133,98,16,.22);}
                  .vl-getpdf-shine{position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(110deg,transparent 0%,rgba(255,255,255,0) 30%,rgba(255,255,255,.85) 50%,rgba(255,255,255,0) 70%,transparent 100%);transform:skewX(-20deg);animation:vl-shine 3.2s ease-in-out infinite;pointer-events:none;mix-blend-mode:overlay;}
                  @keyframes vl-shine{0%{left:-60%}50%{left:120%}100%{left:120%}}
                  .vl-icon-btn{width:38px;height:38px;border-radius:12px;background:#fff;border:1px solid rgba(15,26,53,.10);display:inline-flex;align-items:center;justify-content:center;color:#0B1226;transition:all .2s ease;cursor:pointer;flex-shrink:0;}
                  .vl-icon-btn:hover{background:#0B1226;color:#E9B949;border-color:#0B1226;transform:translateY(-1px);}
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
                            <span className="vl-watch-icon">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
                            </span>
                            {isWatched ? 'Resume' : 'Watch'}
                          </button>
                          <button className="vl-btn vl-btn-read" title="Read in Study Material" onClick={() => router.push('/dashboard/library')}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                            </svg>
                            Read
                          </button>
                          <button className="vl-btn vl-btn-getpdf" title="Get PDF" onClick={() => openVideoActionModal('pdf', video)}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Get PDF
                            <span className="vl-getpdf-shine" />
                          </button>
                          <button className="vl-icon-btn" title="Share" aria-label="Share" onClick={() => setShareModalVideo(video)}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        .vlm-backdrop{position:fixed;inset:0;z-index:120;background:rgba(8,12,28,.55);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;}
        .vlm-modal{width:100%;max-width:460px;background:#fff;border-radius:22px;box-shadow:0 40px 80px -30px rgba(0,0,0,.5),0 0 0 1px rgba(15,26,53,.06);overflow:hidden;position:relative;animation:vlm-pop .3s cubic-bezier(.2,.9,.3,1.2);}
        @keyframes vlm-pop{from{transform:translateY(14px) scale(.98);opacity:.4}to{transform:none;opacity:1}}
        .vlm-close{position:absolute;top:14px;right:14px;width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;transition:all .2s ease;cursor:pointer;border:none;}
        .vlm-head{position:relative;padding:26px 26px 18px;background:radial-gradient(600px 200px at 50% -20%,rgba(233,185,73,.18),transparent 70%),#0B1226;color:#fff;}
        .vlm-head::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:18px;background:linear-gradient(180deg,transparent,#fff);}
        .vlm-icon{width:54px;height:54px;border-radius:14px;display:flex;align-items:center;justify-content:center;margin-bottom:14px;}
        .vlm-title{font-size:24px;font-weight:700;line-height:1.2;}
        .vlm-sub{color:rgba(255,255,255,.65);font-size:13px;margin-top:4px;}
        .vlm-body{padding:8px 26px 26px;}
        .vlm-actions{display:flex;gap:10px;margin-top:18px;}
        .vlm-btn-primary{flex:1;background:linear-gradient(135deg,#E9B949,#B88A1D);color:#1A1206;padding:12px;border-radius:12px;font-weight:700;font-size:14px;display:inline-flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 10px 22px -10px rgba(184,138,29,.55),inset 0 1px 0 rgba(255,255,255,.5);transition:all .2s ease;cursor:pointer;border:none;}
        .vlm-btn-primary:hover{transform:translateY(-1px);box-shadow:0 14px 28px -10px rgba(184,138,29,.7),inset 0 1px 0 rgba(255,255,255,.6);}
        .vlm-btn-secondary{background:#fff;color:#0B1226;padding:12px 16px;border-radius:12px;font-weight:600;font-size:14px;border:1px solid rgba(15,26,53,.14);transition:all .2s ease;cursor:pointer;}
        .vlm-btn-secondary:hover{background:#0B1226;color:#fff;border-color:#0B1226;}
        .vlm-share-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:14px;}
        .vlm-share-tile{display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 8px;border-radius:14px;background:#F7F5EF;border:1px solid #E6EAF2;cursor:pointer;transition:all .2s ease;text-decoration:none;}
        .vlm-share-tile:hover{transform:translateY(-2px);border-color:rgba(11,18,38,.2);box-shadow:0 10px 22px -14px rgba(11,18,38,.3);background:#fff;}
        .vlm-share-ic{width:40px;height:40px;border-radius:12px;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 14px -8px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.2);}
        .vlm-share-label{font-size:11px;font-weight:600;color:#0B1226;}
        .vlm-copy{margin-top:16px;display:flex;align-items:center;gap:8px;padding:8px 8px 8px 14px;background:#F7F5EF;border:1px dashed rgba(15,26,53,.18);border-radius:12px;}
        .vlm-copy input{flex:1;background:transparent;border:0;outline:0;font-size:12.5px;color:#3A4358;}
        .vlm-copy button{background:#0B1226;color:#fff;padding:7px 12px;border-radius:9px;font-size:12px;font-weight:600;display:inline-flex;align-items:center;gap:6px;transition:all .2s ease;cursor:pointer;border:none;white-space:nowrap;}
        .vlm-copy button:hover{background:#E9B949;color:#1A1206;}
        .vlm-copy button.copied{background:#16A34A;color:#fff;}
      `}</style>

      {/* ============ GET PDF POPUP (redirect to Study Material) ============ */}
      {showLoginModal && (
        <div className="vlm-backdrop font-arimo" onClick={() => setShowLoginModal(false)}>
          <div className="vlm-modal" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <button className="vlm-close" style={{ background: 'rgba(15,26,53,.06)', color: '#0B1226' }} onClick={() => setShowLoginModal(false)} aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
            <div style={{ padding: '28px', textAlign: 'center' }}>
              {/* PDF icon with gold lock badge */}
              <div style={{ margin: '0 auto 20px', position: 'relative', width: '64px', height: '74px' }}>
                <div style={{ width: '64px', height: '74px', borderRadius: '10px', background: 'linear-gradient(180deg,#FF5252,#C61212)', boxShadow: '0 14px 30px -10px rgba(198,18,18,.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '8px', color: '#fff', fontSize: '11px', fontWeight: 800, letterSpacing: '.08em', position: 'relative' }}>
                  PDF
                  <span style={{ position: 'absolute', top: 0, right: 0, width: '18px', height: '18px', background: 'linear-gradient(225deg,#fff 50%,transparent 50%)', borderTopRightRadius: '10px' }} />
                </div>
                <span style={{ position: 'absolute', bottom: '-6px', right: '-8px', width: '26px', height: '26px', borderRadius: '999px', background: 'linear-gradient(135deg,#E9B949,#A87F1F)', color: '#1A1206', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #fff', boxShadow: '0 6px 12px -4px rgba(184,138,29,.6)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                </span>
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#0B1226' }}>Download PDF</h3>
              <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '8px', lineHeight: 1.6 }}>
                Please navigate to <b style={{ color: '#0B1226' }}>Study Material</b> to download the PDF
                {modalVideo ? <> for<br />&ldquo;<span style={{ color: '#0B1226', fontWeight: 500 }}>{modalVideo.title}</span>&rdquo;.</> : '.'}
              </p>
              <div className="vlm-actions">
                <button className="vlm-btn-secondary" style={{ flex: 1 }} onClick={() => setShowLoginModal(false)}>Got it</button>
                <button className="vlm-btn-primary" onClick={() => { setShowLoginModal(false); router.push('/dashboard/library'); }}>
                  Go to Study Material
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                </button>
              </div>
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
        const tiles: Array<{ label: string; bg: string; icon: React.ReactNode; href?: string; copy?: boolean }> = [
          { label: 'WhatsApp', bg: '#25D366', href: `https://wa.me/?text=${t}%20${u}`, icon: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /> },
          { label: 'Telegram', bg: '#0088CC', href: `https://t.me/share/url?url=${u}&text=${t}`, icon: <line x1="22" y1="2" x2="11" y2="13" /> },
          { label: 'X / Twitter', bg: '#1D9BF0', href: `https://twitter.com/intent/tweet?url=${u}&text=${t}`, icon: <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" /> },
          { label: 'LinkedIn', bg: '#0A66C2', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, icon: <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></> },
          { label: 'Facebook', bg: '#1877F2', href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, icon: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /> },
          { label: 'Email', bg: '#EA4335', href: `mailto:?subject=${t}&body=${u}`, icon: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" /></> },
          { label: 'Instagram', bg: 'linear-gradient(135deg,#F58529,#DD2A7B,#8134AF)', copy: true, icon: <><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></> },
          { label: 'Copy Link', bg: '#0B1226', copy: true, icon: <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></> },
        ];
        return (
          <div className="vlm-backdrop font-arimo" onClick={() => setShareModalVideo(null)}>
            <div className="vlm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="vlm-head">
                <button className="vlm-close" style={{ background: 'rgba(255,255,255,.08)', color: '#fff' }} onClick={() => setShareModalVideo(null)} aria-label="Close">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </button>
                <div className="vlm-icon" style={{ background: 'linear-gradient(135deg,#FF5252,#C61212)', color: '#fff', boxShadow: '0 12px 24px -10px rgba(198,18,18,.5), inset 0 1px 0 rgba(255,255,255,.3)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                </div>
                <div className="vlm-title">Share this Lecture</div>
                <div className="vlm-sub">Help a fellow aspirant — share knowledge that compounds.</div>
              </div>
              <div className="vlm-body">
                <div className="vlm-share-grid">
                  {tiles.map((tile) => {
                    const inner = (
                      <>
                        <span className="vlm-share-ic" style={{ background: tile.bg }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{tile.icon}</svg>
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
                <div className="vlm-copy">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 17H7A5 5 0 0 1 7 7h2" /><path d="M15 7h2a5 5 0 0 1 0 10h-2" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                  <input value={shareUrl} readOnly />
                  <button className={shareCopied ? 'copied' : ''} onClick={() => copyShareUrl(shareUrl)}>
                    {shareCopied ? 'Copied' : 'Copy'}
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
