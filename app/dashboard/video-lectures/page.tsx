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

  const openVideoActionModal = (_type: 'pdf', video: VideoItem) => {
    setModalVideo(video);
    setShowLoginModal(true);
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
          { value: `${apiStats?.totalHours ?? '15'}K+`, label: 'Subscribers', color: '#4ADE80' },
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
                      lineHeight: '24px',
                      color: isSelected ? '#FFFFFF' : '#1E293B',
                      letterSpacing: '-0.3px',
                      height: '48px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {subject.name}
                  </div>
                  <div className="font-arimo" style={{ fontSize: '13px', lineHeight: '19.5px', color: isSelected ? 'rgba(255,255,255,0.75)' : '#94A3B8', marginTop: '4px', marginBottom: '2px' }}>
                    {subject.videoCount ?? 0} videos{subject.totalDuration ? ` \u00B7 ${subject.totalDuration}` : ''}
                  </div>
                  <div className="font-arimo" style={{ fontSize: '12px', lineHeight: '18px', color: isSelected ? 'rgba(255,255,255,0.75)' : '#94A3B8', marginBottom: '12px' }}>
                    {formatSubjectViews(getSubjectViewCount(subject))} views
                  </div>
                  <div className="flex items-center" style={{ gap: '8px', width: '100%' }}>
                    <div className="rounded-full overflow-hidden" style={{ flex: 1, height: '5px', background: isSelected ? 'rgba(255,255,255,0.25)' : theme.border }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${progressPct}%`,
                          background: isSelected ? 'rgba(255,255,255,0.8)' : theme.color,
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                    <span className="font-arimo font-bold" style={{ fontSize: '11px', color: isSelected ? 'rgba(255,255,255,0.9)' : theme.color, flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {progressPct}% complete
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* YouTube CTA banner – shown below subjects when nothing is selected */}
        {!selectedSubject && (
          <div style={{ marginTop: 'clamp(28px, 3vw, 40px)' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #0E182D, #172240)',
                borderRadius: '24px',
                padding: 'clamp(28px, 3vw, 44px) clamp(28px, 3vw, 42px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'clamp(24px, 3vw, 40px)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ flex: 1, zIndex: 1 }}>
                <h3
                  className="font-arimo font-bold"
                  style={{ fontSize: 'clamp(28px, 2.7vw, 36px)', lineHeight: 1.2, color: '#FFFFFF', marginBottom: 'clamp(4px, 0.4vw, 6px)' }}
                >
                  Never Miss a<br />
                  <span style={{ color: '#E8B84B' }}>Lecture Again.</span>
                </h3>
                <p className="font-arimo" style={{ fontSize: 'clamp(18px, 1.88vw, 25px)', color: '#FFFFFF', marginBottom: 'clamp(12px, 1.2vw, 16px)' }}>
                  Stay Consistent. Stay Ahead.
                </p>
                <p className="font-arimo" style={{ fontSize: 'clamp(13px, 1.12vw, 15px)', lineHeight: 'clamp(20px, 1.88vw, 25px)', color: '#FFFFFF', marginBottom: 'clamp(20px, 2vw, 28px)', maxWidth: '560px' }}>
                  Subscribe to Rise with Jeet IAS on YouTube and get instant notifications for new lectures, current affairs drops, and live sessions all completely free.
                </p>
                <div className="flex items-center" style={{ gap: 'clamp(12px, 1.4vw, 20px)', flexWrap: 'wrap' }}>
                  <a
                    href="https://www.youtube.com/@RiseWithJeet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-arimo font-bold text-white"
                    style={{ background: '#E7000B', borderRadius: '26843500px', padding: 'clamp(12px, 1.2vw, 14px) clamp(24px, 2.25vw, 30px)', fontSize: 'clamp(13px, 1.12vw, 15px)' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43z" fill="#FFFFFF"/>
                      <path d="M9.75 15.02l5.75-3.27-5.75-3.27v6.54z" fill="#E7000B"/>
                    </svg>
                    Join Our YouTube Family
                  </a>
                  <p className="font-arimo font-bold" style={{ fontSize: 'clamp(13px, 1.12vw, 15px)', color: '#FFFFFF' }}>
                    Join 15,000+ UPSC Aspirants Here
                  </p>
                </div>
              </div>
              <div
                className="flex items-center justify-center"
                style={{ width: 'clamp(100px, 10vw, 140px)', height: 'clamp(100px, 10vw, 140px)', borderRadius: '50%', background: 'rgba(25,60,184,0.3)', flexShrink: 0 }}
              >
                <span style={{ fontSize: 'clamp(48px, 5vw, 68px)' }}>{'\u{1F514}'}</span>
              </div>
            </div>
          </div>
        )}

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
                    <p className="font-arimo" style={{ fontSize: '14px', lineHeight: '20px', color: '#94A3B8' }}>
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
                <div
                  ref={selectedVideoGridRef}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))',
                    gap: 'clamp(16px, 1.8vw, 24px)',
                  }}
                >
                  {filteredSubjectVideos.map((video) => (
                    <div
                      key={video.id}
                      style={{
                        background: '#FFFFFF',
                        borderRadius: '16px',
                        boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.08), 0px 1px 2px -1px rgba(0,0,0,0.06)',
                        overflow: 'hidden',
                        border: '1.5px solid #F1F5F9',
                      }}
                    >
                      <div
                        className="font-arimo font-bold"
                        style={{
                          position: 'absolute',
                          top: '10px',
                          left: '10px',
                          background: '#17223E',
                          color: '#FFFFFF',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '10px',
                          lineHeight: 1,
                          zIndex: 1,
                        }}
                      >
                        🔥 HOT
                      </div>
                      <div
                        className="flex items-center justify-center"
                        style={{ background: selectedSubjectTheme.tag, height: 'clamp(150px, 14vw, 190px)', position: 'relative' }}
                      >
                        {video.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={video.thumbnailUrl} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: 'clamp(48px, 5vw, 64px)' }}>{subjectEmoji(selectedSubject)}</span>
                        )}
                      </div>

                      <div style={{ padding: 'clamp(14px, 1.5vw, 20px)' }}>
                        <p
                          className="font-arimo font-bold"
                          style={{ fontSize: 'clamp(10px, 0.85vw, 12px)', color: selectedSubjectTheme.color, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 'clamp(4px, 0.4vw, 6px)' }}
                        >
                          {matchedSelectedSubject?.name ?? selectedSubject}
                        </p>
                        <h3
                          className="font-arimo font-bold"
                          style={{ fontSize: 'clamp(14px, 1.15vw, 15px)', color: '#101828', marginBottom: 'clamp(6px, 0.6vw, 8px)', lineHeight: 1.35 }}
                        >
                          {video.title}
                        </h3>
                        <p className="font-arimo" style={{ fontSize: 'clamp(11px, 0.9vw, 12px)', color: '#6A7282', marginBottom: 'clamp(12px, 1.2vw, 16px)' }}>
                          {'\u{1F440}'} {formatViews(getVideoViewCount(video))} views
                        </p>

                        <div className="flex items-center" style={{ gap: '4px', flexWrap: 'nowrap', minWidth: 0 }}>
                          <button
                            onClick={() => { markVideoWatched(selectedSubject ?? video.subject, video.id); openVideoInNewTab(video); }}
                            className="flex items-center gap-1 font-arimo font-bold text-white"
                            style={{ padding: '5px 8px', borderRadius: '10px', background: '#17223E', border: '1.5px solid #17223E', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <rect width="24" height="24" rx="5" fill="#FF0000"/>
                              <path d="M10 8l6 4-6 4V8z" fill="white"/>
                            </svg>
                            Watch
                          </button>
                          <button
                            onClick={() => openVideoActionModal('pdf', video)}
                            className="flex items-center gap-1 font-arimo font-bold"
                            style={{ padding: '5px 8px', borderRadius: '10px', background: '#F0F4FA', border: '1.5px solid #CBD5E1', color: '#1A1A2E', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                              <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="#1A1A2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M7 11l5 5 5-5" stroke="#1A1A2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M12 4v12" stroke="#1A1A2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Download PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </>
            )}
              </div>
            </div>

            {/* YouTube CTA Banner – always shown below videos when a subject is selected */}
            {!subjectVideosLoading && (
              <div style={{ marginTop: 'clamp(28px, 3vw, 40px)' }}>
                <div
                  style={{
                    background: 'linear-gradient(135deg, #0E182D, #172240)',
                    borderRadius: '24px',
                    padding: 'clamp(28px, 3vw, 44px) clamp(28px, 3vw, 42px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 'clamp(24px, 3vw, 40px)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ flex: 1, zIndex: 1 }}>
                    <h3
                      className="font-arimo font-bold"
                      style={{ fontSize: 'clamp(28px, 2.7vw, 36px)', lineHeight: 1.2, color: '#FFFFFF', marginBottom: 'clamp(4px, 0.4vw, 6px)' }}
                    >
                      Never Miss a<br />
                      <span style={{ color: '#E8B84B' }}>Lecture Again.</span>
                    </h3>
                    <p className="font-arimo" style={{ fontSize: 'clamp(18px, 1.88vw, 25px)', color: '#FFFFFF', marginBottom: 'clamp(12px, 1.2vw, 16px)' }}>
                      Stay Consistent. Stay Ahead.
                    </p>
                    <p className="font-arimo" style={{ fontSize: 'clamp(13px, 1.12vw, 15px)', lineHeight: 'clamp(20px, 1.88vw, 25px)', color: '#FFFFFF', marginBottom: 'clamp(20px, 2vw, 28px)', maxWidth: '560px' }}>
                      Subscribe to Rise with Jeet IAS on YouTube and get instant notifications for new lectures, current affairs drops, and live sessions all completely free.
                    </p>
                    <div className="flex items-center" style={{ gap: 'clamp(12px, 1.4vw, 20px)', flexWrap: 'wrap' }}>
                      <a
                        href="https://www.youtube.com/@RiseWithJeet"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 font-arimo font-bold text-white"
                        style={{ background: '#E7000B', borderRadius: '26843500px', padding: 'clamp(12px, 1.2vw, 14px) clamp(24px, 2.25vw, 30px)', fontSize: 'clamp(13px, 1.12vw, 15px)' }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43z" fill="#FFFFFF"/>
                          <path d="M9.75 15.02l5.75-3.27-5.75-3.27v6.54z" fill="#E7000B"/>
                        </svg>
                        Join Our YouTube Family
                      </a>
                      <p className="font-arimo font-bold" style={{ fontSize: 'clamp(13px, 1.12vw, 15px)', color: '#FFFFFF' }}>
                        Join 15,000+ UPSC Aspirants Here
                      </p>
                    </div>
                  </div>
                  <div
                    className="flex items-center justify-center"
                    style={{ width: 'clamp(100px, 10vw, 140px)', height: 'clamp(100px, 10vw, 140px)', borderRadius: '50%', background: 'rgba(25,60,184,0.3)', flexShrink: 0 }}
                  >
                    <span style={{ fontSize: 'clamp(48px, 5vw, 68px)' }}>{'\u{1F514}'}</span>
                  </div>
                </div>
              </div>
            )}
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

      {/* Login Modal placeholder */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
              onClick={() => setShowLoginModal(false)}
        >
          <div
            style={{ background: '#FFFFFF', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '420px', margin: '0 16px', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sidebar-study-material-new2.png" alt="Study Material" style={{ width: '56px', height: '56px', objectFit: 'contain', marginBottom: '16px' }} />
            <h3 className="font-arimo font-bold" style={{ fontSize: '20px', color: '#101828', marginBottom: '8px' }}>
              Download PDF
            </h3>
            <p className="font-arimo" style={{ fontSize: '14px', color: '#6A7282', marginBottom: '24px' }}>
              {modalVideo
                ? `Please navigate to study material to download the PDF for "${modalVideo.title}".`
                : 'Please navigate to study material to download the PDF.'}
            </p>
            <button
              onClick={() => setShowLoginModal(false)}
              className="font-arimo font-bold text-white"
              style={{ height: '44px', borderRadius: '12px', background: '#162456', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '0 32px' }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
