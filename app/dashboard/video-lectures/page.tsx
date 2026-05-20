'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
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

/* Subject card background colors — one per subject, cycling */
const SUBJECT_COLORS: Record<string, { bg: string; border: string; accent: string }> = {
  'History': { bg: '#FEF3C7', border: '#FDE68A', accent: '#B45309' },
  'Geography': { bg: '#DBEAFE', border: '#BFDBFE', accent: '#1D4ED8' },
  'Polity': { bg: '#EDE9FE', border: '#DDD6FE', accent: '#7C3AED' },
  'Economy': { bg: '#FFF7ED', border: '#FED7AA', accent: '#EA580C' },
  'Environment & Ecology': { bg: '#F0FDF4', border: '#BBF7D0', accent: '#16A34A' },
  'Science & Technology': { bg: '#DBEAFE', border: '#BFDBFE', accent: '#0369A1' },
};

const SUBJECT_ICON_GRADIENTS: Record<string, string> = {
  history:           'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
  geography:         'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
  polity:            'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
  economy:           'linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)',
  environment:       'linear-gradient(135deg, #10B981 0%, #16A34A 100%)',
  scienceandtech:    'linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)',
  sciencetechnology: 'linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)',
};

const SUBJECT_CARD_THEMES: Record<string, SubjectCardTheme> = {
  indianpolity: { bg: 'linear-gradient(145deg, #FFF4E2 0%, #FBE9CC 100%)', border: '#F4CCA0', progress: 72 },
  indianeconomy: { bg: 'linear-gradient(145deg, #F3EEFF 0%, #E7DEFF 100%)', border: '#D7C8FF', progress: 38 },
  geography: { bg: 'linear-gradient(145deg, #F4ECD2 0%, #ECE3C2 100%)', border: '#D9C88E', progress: 48 },
  history: { bg: 'linear-gradient(145deg, #FFF7EC 0%, #FCECD8 100%)', border: '#F2CFA5', progress: 55 },
  environment: { bg: 'linear-gradient(145deg, #EEFBF4 0%, #DCF5E8 100%)', border: '#BCE9D1', progress: 62 },
  ethicsgs4: { bg: 'linear-gradient(145deg, #EEF4FB 0%, #E4ECF7 100%)', border: '#D1DFF0', progress: 32 },
  essaywriting: { bg: 'linear-gradient(145deg, #FFF7EE 0%, #FDEBD7 100%)', border: '#F5D0A9', progress: 45 },
  internalsecurity: { bg: 'linear-gradient(145deg, #FFF1F2 0%, #FDE7EA 100%)', border: '#F6C6CF', progress: 22, showNew: true },
  intlrelations: { bg: 'linear-gradient(145deg, #F2ECFF 0%, #E9E0FF 100%)', border: '#D8CBFB', progress: 35 },
  scienceandtech: { bg: 'linear-gradient(145deg, #E7F0FC 0%, #D7E6F8 100%)', border: '#BED4EE', progress: 28 },
};

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

function getSubjectCardTheme(name: string) {
  const n = normalizeSubjectKey(name);
  if (n.includes('polity')) return { bg: '#EFF6FF', border: '#BFDBFE', progress: 80, showNew: true };
  if (n.includes('history')) return { bg: '#FFF7ED', border: '#FDBA74', progress: 65, showNew: false };
  if (n.includes('geography')) return { bg: '#ECFDF5', border: '#A7F3D0', progress: 55, showNew: false };
  if (n.includes('economy')) return { bg: '#F5F3FF', border: '#DDD6FE', progress: 70, showNew: false };
  if (n.includes('environment')) return { bg: '#F0FDF4', border: '#BBF7D0', progress: 45, showNew: false };
  if (n.includes('science')) return { bg: '#FEF2F2', border: '#FECACA', progress: 60, showNew: true };
  return { bg: '#F8FAFC', border: '#CBD5E1', progress: 50, showNew: false };
}

function getSubjectIconGradient(name: string) {
  const n = normalizeSubjectKey(name);
  if (n.includes('polity')) return 'linear-gradient(135deg, #3B82F6, #1D4ED8)';
  if (n.includes('history')) return 'linear-gradient(135deg, #F59E0B, #D97706)';
  if (n.includes('geography')) return 'linear-gradient(135deg, #10B981, #059669)';
  if (n.includes('economy')) return 'linear-gradient(135deg, #8B5CF6, #7C3AED)';
  if (n.includes('environment')) return 'linear-gradient(135deg, #22C55E, #16A34A)';
  if (n.includes('science')) return 'linear-gradient(135deg, #EF4444, #DC2626)';
  return 'linear-gradient(135deg, #64748B, #475569)';
}

function formatViews(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatCardViews(n: number | undefined) {
  return formatViews(n ?? 0);
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
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [apiSubjects, setApiSubjects] = useState<SubjectItem[]>([]);
  const [apiVideos, setApiVideos] = useState<VideoItem[]>([]);
  const [subjectVideos, setSubjectVideos] = useState<VideoItem[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [subjectVideosLoading, setSubjectVideosLoading] = useState(false);
  const [apiStats, setApiStats] = useState<any>(null);

  const [watchVideo, setWatchVideo] = useState<VideoItem | null>(null);
  const [videoQuestions, setVideoQuestions] = useState<any[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResults, setQuizResults] = useState<any>(null);
  const [quizLoading, setQuizLoading] = useState(false);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [modalVideo, setModalVideo] = useState<VideoItem | null>(null);
  const [mentorQuestion, setMentorQuestion] = useState('');
  const [mentorSubmitting, setMentorSubmitting] = useState(false);
  const [mentorSuccess, setMentorSuccess] = useState(false);
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
    setSelectedSubject((prev) => {
      const nextSubject = prev === name ? null : name;
      lastAutoScrolledSubjectRef.current = nextSubject ? null : prev;
      lastGridAutoScrolledSubjectRef.current = nextSubject ? null : prev;
      return prev === name ? null : name;
    });
  };

  const openVideoActionModal = (type: 'pdf' | 'mentor', video: VideoItem) => {
    setModalVideo(video);
    if (type === 'pdf') {
      setShowLoginModal(true);
      return;
    }
    setShowMentorModal(true);
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

  const handleAskMentor = async () => {
    if (!mentorQuestion.trim()) return;
    setMentorSubmitting(true);
    try {
      await videoService.askMentor({ question: mentorQuestion.trim() });
      setMentorSuccess(true);
      setMentorQuestion('');
      setTimeout(() => setMentorSuccess(false), 3000);
    } catch {}
    setMentorSubmitting(false);
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

  const matchedSelectedSubject = visibleSubjects.find((subject) => subject.name === selectedSubject) ?? null;
  const fallbackSubjectVideos = selectedSubject
    ? apiVideos.filter((video) => normalizeSubjectKey(video.subject || '') === normalizeSubjectKey(selectedSubject))
    : [];
  const visibleSubjectVideos = subjectVideos.length > 0 ? subjectVideos : fallbackSubjectVideos;

  useEffect(() => {
    if (!selectedSubject) {
      lastAutoScrolledSubjectRef.current = null;
      lastGridAutoScrolledSubjectRef.current = null;
      return;
    }
    if (lastAutoScrolledSubjectRef.current === selectedSubject) return;

    const scrollTimer = window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        const section = selectedVideosRef.current;
        const scrollContainer = section?.closest('main');
        if (!section || !scrollContainer) return;

        const sectionRect = section.getBoundingClientRect();
        const containerRect = scrollContainer.getBoundingClientRect();
        const scrollTop = scrollContainer.scrollTop + sectionRect.top - containerRect.top - 16;

        scrollContainer.scrollTo({
          top: Math.max(0, scrollTop),
          behavior: 'smooth',
        });
        lastAutoScrolledSubjectRef.current = selectedSubject;
      });
    }, 0);

    return () => window.clearTimeout(scrollTimer);
  }, [selectedSubject]);

  useEffect(() => {
    if (!selectedSubject || subjectVideosLoading || visibleSubjectVideos.length === 0) return;
    if (lastGridAutoScrolledSubjectRef.current === selectedSubject) return;

    const scrollTimer = window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        const grid = selectedVideoGridRef.current;
        const scrollContainer = grid?.closest('main');
        if (!grid || !scrollContainer) return;

        const gridRect = grid.getBoundingClientRect();
        const containerRect = scrollContainer.getBoundingClientRect();
        const scrollTop = scrollContainer.scrollTop + gridRect.top - containerRect.top - 16;

        scrollContainer.scrollTo({
          top: Math.max(0, scrollTop),
          behavior: 'smooth',
        });
        lastGridAutoScrolledSubjectRef.current = selectedSubject;
      });
    }, 60);

    return () => window.clearTimeout(scrollTimer);
  }, [selectedSubject, subjectVideosLoading, visibleSubjectVideos.length]);

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
          { value: '50+', label: 'Video Lectures', color: '#FDC700' },
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
              columnGap: '14px',
              rowGap: '16px',
              marginBottom: selectedSubject ? 'clamp(24px, 2.5vw, 36px)' : '0',
            }}
          >
            {visibleSubjects.map((subject) => {
              const theme = getSubjectCardTheme(subject.name);
              const isSelected = selectedSubject === subject.name;
              const showNew = theme.showNew || subject.isNew;
              return (
                <button
                  type="button"
                  key={subject.name}
                  onClick={() => handleSubjectClick(subject.name)}
                  style={{
                    width: '169px',
                    height: '143px',
                    background: theme.bg,
                    borderRadius: '18px',
                    padding: '16px 14px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: isSelected ? '1.6px solid #162456' : `0.8px solid ${theme.border}`,
                    boxShadow: isSelected ? '0 6px 14px rgba(22,36,86,0.16)' : 'none',
                    position: 'relative',
                    textAlign: 'left',
                  }}
                >
                  {showNew && (
                    <div
                      className="font-arimo font-bold"
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '9px',
                        height: '18.25px',
                        minWidth: '40.375px',
                        padding: '2px 9px 0',
                        borderRadius: '20px',
                        background: 'linear-gradient(155.676deg, #F5A623 0%, #D4881A 100%)',
                        color: '#1A2744',
                        fontSize: '9.5px',
                        lineHeight: '14.25px',
                        letterSpacing: '0',
                      }}
                    >
                      NEW
                    </div>
                  )}

                  <div style={{ fontSize: '30px', lineHeight: '30px', marginBottom: '10px' }}>
                    {subjectEmoji(subject.name)}
                  </div>
                  <div className="font-arimo font-bold" style={{ fontSize: '14px', lineHeight: '20px', color: '#1A2744', letterSpacing: '-0.3px' }}>
                    {subject.name}
                  </div>
                  <div className="font-arimo" style={{ fontSize: '11.5px', lineHeight: '17.25px', color: '#5A7096', marginTop: '3px', marginBottom: '2px' }}>
                    {subject.videoCount ?? 0} videos{subject.totalDuration ? ` \u00B7 ${subject.totalDuration}` : ''}
                  </div>
                  <div className="font-arimo" style={{ fontSize: '10.5px', lineHeight: '15.75px', color: '#8FA4BE', marginBottom: '9px' }}>
                    {subject.viewCount ? formatCardViews(subject.viewCount) : '0'} views
                  </div>
                  <div className="rounded-full overflow-hidden" style={{ width: '141px', height: '4px', background: '#DDE5F0' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${theme.progress}%`,
                        background: 'linear-gradient(90deg, #F5A623 0%, #D4881A 100%)',
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* YouTube CTA banner — shown below subjects when nothing is selected */}
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
                background: 'linear-gradient(180deg, #FCFDFF 0%, #F8FAFD 100%)',
                border: '1px solid #E3EAF4',
                borderRadius: '22px',
                padding: 'clamp(18px, 2vw, 26px)',
                marginBottom: 'clamp(20px, 2vw, 28px)',
                boxShadow: '0 16px 36px rgba(15, 23, 42, 0.05)',
              }}
            >
              <div className="flex items-start justify-between" style={{ gap: '16px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <div className="flex items-center" style={{ gap: '12px', marginBottom: '4px' }}>
                  <div
                    className="flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #FF6900 0%, #FB2C36 100%)',
                      borderRadius: '14px',
                      width: '48px',
                      height: '48px',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: '24px', lineHeight: '32px' }}>{subjectEmoji(selectedSubject)}</span>
                  </div>
                  <div>
                    <h2
                      className="font-arimo font-bold"
                      style={{ fontSize: '24px', color: '#101828', lineHeight: '32px' }}
                    >
                      {getSubjectHeroLabel(selectedSubject)} Simplified
                    </h2>
                    <p className="font-arimo" style={{ fontSize: '14px', lineHeight: '20px', color: '#4A5565' }}>
                      {'\u{1F4FA}'} {visibleSubjectVideos.length} Video{visibleSubjectVideos.length !== 1 ? 's' : ''}
                      {matchedSelectedSubject?.totalDuration ? ` · ${matchedSelectedSubject.totalDuration}` : ''}
                    </p>
                  </div>
                </div>
                <a
                  href="https://www.youtube.com/@RiseWithJeet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-arimo font-semibold text-white"
                  style={{
                    background: '#17223E',
                    borderRadius: '999px',
                    padding: '8px 14px',
                    fontSize: '13px',
                    textDecoration: 'none',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43z" fill="#FF0000"/>
                    <path d="M9.75 15.02l5.75-3.27-5.75-3.27v6.54z" fill="#FFFFFF"/>
                  </svg>
                  @RiseWithJeet
                </a>
              </div>
              {matchedSelectedSubject?.description ? (
                <p className="font-arimo" style={{ fontSize: 'clamp(13px, 1.12vw, 15px)', color: '#4A5565', lineHeight: 1.5 }}>
                  {matchedSelectedSubject.description}
                </p>
              ) : null}
            </div>

            {subjectVideosLoading ? (
              <div className="flex flex-col items-center justify-center" style={{ padding: 'clamp(32px, 4vw, 56px) 0', color: '#9CA3AF' }}>
                <p className="font-arimo font-medium" style={{ fontSize: 'clamp(14px, 1.2vw, 16px)' }}>
                  Loading videos...
                </p>
              </div>
            ) : visibleSubjectVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center" style={{ padding: 'clamp(32px, 4vw, 56px) 0', color: '#9CA3AF' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>{'\u{1F4ED}'}</div>
                <p className="font-arimo font-medium" style={{ fontSize: 'clamp(14px, 1.2vw, 16px)' }}>
                  No videos available for {selectedSubject}
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
                  {visibleSubjectVideos.map((video) => (
                    <div
                      key={video.id}
                      style={{
                        background: '#FFFFFF',
                        borderRadius: '16px',
                        boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.08), 0px 1px 2px -1px rgba(0,0,0,0.06)',
                        overflow: 'hidden',
                        border: '1px solid #E5E7EB',
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
                        style={{ background: '#EFF6FF', height: 'clamp(150px, 14vw, 190px)', position: 'relative' }}
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
                          style={{ fontSize: 'clamp(10px, 0.85vw, 12px)', color: '#C68A0B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 'clamp(4px, 0.4vw, 6px)' }}
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
                            onClick={() => openVideoActionModal('pdf', video)}
                            className="flex items-center gap-1 font-arimo font-bold"
                            style={{ padding: '5px 8px', borderRadius: '10px', background: '#F0F4FA', border: '1.5px solid #CBD5E1', color: '#1A1A2E', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                              <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="#1A1A2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M7 11l5 5 5-5" stroke="#1A1A2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M12 4v12" stroke="#1A1A2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            PDF
                          </button>
                          <button
                            onClick={() => openVideoActionModal('mentor', video)}
                            className="flex items-center gap-1 font-arimo font-bold"
                            style={{ padding: '5px 8px', borderRadius: '10px', background: '#F0F4FA', border: '1.5px solid #CBD5E1', color: '#1A1A2E', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                          >
                            <span style={{ fontSize: '14px' }}>{'\u{1F9D1}\u200D\u{1F3EB}'}</span>
                            Ask Mentor
                          </button>
                          <button
                            onClick={() => openVideoInNewTab(video)}
                            className="flex items-center gap-1 font-arimo font-bold text-white"
                            style={{ padding: '5px 8px', borderRadius: '10px', background: '#17223E', border: '1.5px solid #17223E', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <rect width="24" height="24" rx="5" fill="#FF0000"/>
                              <path d="M10 8l6 4-6 4V8z" fill="white"/>
                            </svg>
                            Watch
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </>
            )}

            {/* YouTube CTA Banner — always shown below videos when a subject is selected */}
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

      {/* Bottom support cards removed — PDF and Ask Mentor open as modals via openVideoActionModal */}
      {false && (
      <div style={{ display: 'none' }}>
        <div>
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              border: '1.6px solid #9AA4B2',
              padding: '32px',
              width: '100%',
              minHeight: '607.188px',
            }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '34px' }}>{'\u{1F4E5}'}</span>
              <button
                type="button"
                className="flex items-center justify-center"
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F3F4F6', border: 'none', color: '#6B7280' }}
              >
                ×
              </button>
            </div>

            <h3 className="font-arimo font-bold" style={{ fontSize: '30px', color: '#101828', lineHeight: '36px', marginBottom: '8px' }}>
              Login to Download
            </h3>
            <p className="font-arimo" style={{ fontSize: '14px', color: '#4A5565', marginBottom: '20px', lineHeight: '20px' }}>
              Please Sign-in to download <strong>Telegram Accts</strong>
            </p>

            <div style={{ marginBottom: '12px' }}>
              <input
                type="email"
                placeholder="Email address"
                className="w-full font-arimo outline-none"
                style={{ height: '55px', borderRadius: '14px', border: '1.6px solid #D1D5DC', padding: '0 16px', fontSize: '14px' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <input
                type="password"
                placeholder="Password"
                className="w-full font-arimo outline-none"
                style={{ height: '55px', borderRadius: '14px', border: '1.6px solid #D1D5DC', padding: '0 16px', fontSize: '14px' }}
              />
            </div>

            <button
              type="button"
              className="w-full font-arimo font-bold text-white"
              style={{ height: '60px', borderRadius: '14px', background: '#162456', border: 'none', fontSize: '18px', marginBottom: '16px' }}
            >
              Sign In & Download →
            </button>

            <div className="flex items-center" style={{ gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
              <span className="font-arimo" style={{ fontSize: '14px', color: '#6A7282' }}>— or —</span>
              <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
            </div>

            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 font-arimo font-semibold"
              style={{ height: '59px', borderRadius: '14px', border: '1.6px solid #D1D5DC', background: '#FFFFFF', color: '#101828', fontSize: '16px', marginBottom: '16px' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center justify-between">
              <span className="font-arimo" style={{ fontSize: '12px', color: '#155DFC' }}>New? Create free account →</span>
              <span className="font-arimo" style={{ fontSize: '12px', color: '#155DFC' }}>{'\u{1F4E7}'} Forgot?</span>
            </div>
          </div>

          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              border: '1.6px solid #9AA4B2',
              padding: '32px',
              width: '100%',
              minHeight: '607.188px',
              marginTop: '151.8px',
            }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '34px' }}>{'\u{1F914}'}</span>
              <button
                type="button"
                className="flex items-center justify-center"
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F3F4F6', border: 'none', color: '#6B7280' }}
              >
                ×
              </button>
            </div>

            <h3 className="font-arimo font-bold" style={{ fontSize: '30px', color: '#101828', lineHeight: '36px', marginBottom: '8px' }}>
              Ask the Mentor
            </h3>
            <p className="font-arimo" style={{ fontSize: '14px', color: '#4A5565', marginBottom: '24px', lineHeight: '20px' }}>
              Have any doubt about <strong>Introduction to Indian Constitution I Historical Background</strong>...Jeet Sir responds within 24 hours.
            </p>

            <p className="font-arimo font-bold" style={{ fontSize: '14px', color: '#364153', marginBottom: '8px' }}>
              Your doubt or question
            </p>
            <textarea
              placeholder="e.g. At 18:32, I didn't understand why Article 370 had was mentioned u..."
              className="w-full font-arimo outline-none resize-none"
              value={mentorQuestion}
              onChange={(e) => setMentorQuestion(e.target.value)}
              style={{ height: '115px', borderRadius: '14px', border: '1.6px solid #D1D5DC', padding: '16px', fontSize: '14px', marginBottom: '12px' }}
            />

            <p className="font-arimo font-bold" style={{ fontSize: '14px', color: '#364153', marginBottom: '8px' }}>
              Your name (optional)
            </p>
            <input
              type="text"
              placeholder="e.g. Rahul from Delhi"
              className="w-full font-arimo outline-none"
              style={{ height: '55px', borderRadius: '14px', border: '1.6px solid #D1D5DC', padding: '0 16px', fontSize: '14px', marginBottom: '14px' }}
            />

            <button
              type="button"
              onClick={handleAskMentor}
              disabled={mentorSubmitting || !mentorQuestion.trim()}
              className="w-full font-arimo font-bold text-white"
              style={{ height: '60px', borderRadius: '14px', background: mentorSubmitting || !mentorQuestion.trim() ? '#6A7282' : '#101828', border: 'none', fontSize: '18px', marginBottom: '14px', opacity: !mentorQuestion.trim() ? 0.6 : 1 }}
            >
              {mentorSubmitting ? 'Submitting...' : 'Submit Doubt →'}
            </button>

            <p className="font-arimo text-center" style={{ fontSize: '12px', color: '#6A7282', lineHeight: '16px' }}>
              Answers posted on <span style={{ color: '#E7000B', fontWeight: 700 }}>YouTube Community</span> & <span style={{ color: '#1E40AF', fontWeight: 700 }}>Telegram</span>
            </p>
          </div>
        </div>
      </div>
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

      {/* Ask Our Team Modal */}
      {showMentorModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowMentorModal(false)}
        >
          <div
            style={{ background: '#FFFFFF', borderRadius: '24px', border: '1.6px solid #6A7282', padding: '28px', width: '100%', maxWidth: '480px', margin: '0 16px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/mentor-icon.png" alt="Ask Our Team" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
              <button onClick={() => setShowMentorModal(false)}
                className="flex items-center justify-center"
                style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#F3F4F6', border: 'none', cursor: 'pointer' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="#4A5565" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <h3 className="font-arimo font-bold" style={{ fontSize: '20px', color: '#101828', marginBottom: '8px' }}>
              Ask Our Team
            </h3>
            <p className="font-arimo" style={{ fontSize: '14px', color: '#6A7282', marginBottom: '20px' }}>
              {modalVideo ? `Ask our team about "${modalVideo.title}" and get a clear answer.` : 'Got a doubt? Ask our team and get a clear answer.'}
            </p>

            {mentorSuccess && (
              <div className="flex items-center gap-2 mb-4 p-3 rounded-lg" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                <span style={{ fontSize: '18px' }}>{'\u2705'}</span>
                <span className="font-arimo font-medium" style={{ fontSize: '14px', color: '#065F46' }}>
                  Question submitted successfully!
                </span>
              </div>
            )}

            <textarea
              value={mentorQuestion}
              onChange={(e) => setMentorQuestion(e.target.value)}
              placeholder="Type your question here..."
              className="w-full font-arimo outline-none resize-none"
              style={{
                height: '120px',
                borderRadius: '12px',
                border: '1.6px solid #E5E7EB',
                padding: '14px 16px',
                fontSize: '14px',
                color: '#101828',
                marginBottom: '16px',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#4F78F6'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
            />

            <button
              onClick={handleAskMentor}
              disabled={mentorSubmitting || !mentorQuestion.trim()}
              className="w-full font-arimo font-bold text-white"
              style={{
                height: '48px',
                borderRadius: '12px',
                background: mentorSubmitting || !mentorQuestion.trim() ? '#9CA3AF' : '#162456',
                border: 'none',
                cursor: mentorSubmitting || !mentorQuestion.trim() ? 'not-allowed' : 'pointer',
                fontSize: '15px',
              }}
            >
              {mentorSubmitting ? 'Submitting...' : 'Submit Question'}
            </button>

            <div className="mt-4 text-center">
              <p className="font-arimo" style={{ fontSize: '12px', marginBottom: '6px' }}>
                <Link href="/dashboard/free-trial" className="text-[#162456] font-semibold hover:underline">
                  Go to Mentorship Module
                </Link>
              </p>
              <p className="font-arimo" style={{ fontSize: '12px', color: '#6A7282' }}>
                {'\u2192'}{' '}
                <a href="https://www.youtube.com/@RiseWithJeet/community" target="_blank" rel="noopener noreferrer" className="text-[#162456] font-medium hover:underline">Join our YouTube Community</a>
                {' & '}
                <a href="https://t.me/togetherrisewithjeet" target="_blank" rel="noopener noreferrer" className="text-[#162456] font-medium hover:underline">Telegram</a>
                {' for Doubts Discussion'}
              </p>
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
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>{'\u{1F512}'}</div>
            <h3 className="font-arimo font-bold" style={{ fontSize: '20px', color: '#101828', marginBottom: '8px' }}>
              PDF Access
            </h3>
            <p className="font-arimo" style={{ fontSize: '14px', color: '#6A7282', marginBottom: '24px' }}>
              {modalVideo ? `Please subscribe to download the PDF for "${modalVideo.title}".` : 'Please subscribe to access downloadable PDFs.'}
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
