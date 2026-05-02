'use client';

import React, { useState, useEffect } from 'react';
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

/* ─── Constants ─── */
const SUBJECT_SORT_ORDER = [
  'polity',
  'history',
  'geography',
  'economy',
  'environment',
  'science',
  'art & culture',
  'current affairs',
  'international relations',
  'security',
];

/* ─── Helpers ─── */
function normalizeSubjectKey(name: string) {
  return name.toLowerCase().replace(/&/g, '').replace(/\s+/g, ' ').trim();
}

function subjectEmoji(name: string) {
  const n = normalizeSubjectKey(name);
  if (n.includes('polity')) return '🏛️';
  if (n.includes('history')) return '📜';
  if (n.includes('geography')) return '🌍';
  if (n.includes('economy')) return '📊';
  if (n.includes('environment')) return '🌿';
  if (n.includes('science')) return '🔬';
  if (n.includes('art')) return '🎨';
  if (n.includes('current')) return '📰';
  if (n.includes('international')) return '🌐';
  if (n.includes('security')) return '🛡️';
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

function getVideoViewCount(v: VideoItem) {
  return v.viewCount ?? 0;
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
  const [mentorQuestion, setMentorQuestion] = useState('');
  const [mentorSubmitting, setMentorSubmitting] = useState(false);
  const [mentorSuccess, setMentorSuccess] = useState(false);

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
      .then((res: any) => setSubjectVideos(Array.isArray(res.data) ? res.data : []))
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
    setSelectedSubject((prev) => (prev === name ? null : name));
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

  const featuredSubjectName = apiSubjects[0]?.name ?? 'Polity';

  return (
    <div className="font-arimo w-full min-h-screen" style={{ background: '#F9FAFB' }}>
      <DashboardPageHero
        badgeIcon={<img src="/🎥.png" alt="video" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />}
        badgeText="SIMPLIFIED VIDEO LECTURES"
        title={
          <>
            Master Your{' '}
            <em className="not-italic" style={{ color: '#e8a820', fontStyle: 'italic' }}>UPSC Journey</em>
            <br />
            with Expert Video Lectures
          </>
        }
        subtitle="Every editorial, every perspective mapped to what UPSC asks."
        stats={[
          { value: `${apiStats?.totalLectures ?? '100'}+`, label: 'Video Lectures', color: '#FDC700' },
          { value: `${apiStats?.totalSubjects ?? '12'}+`, label: 'Core Subjects', color: '#F87171' },
          { value: `${apiStats?.totalHours ?? '15'}K+`, label: 'Subscribers', color: '#4ADE80' },
          { value: '\u221E', label: 'Always Free', color: '#FFFFFF' },
        ]}
      />

      {/* Browse by Subject */}
      <div
        className="w-full mx-auto"
        style={{
          maxWidth: 'min(94vw, 1400px)',
          padding: 'clamp(32px, 4vw, 56px) clamp(16px, 2vw, 30px)',
        }}
      >
        {/* Super heading + Heading */}
        <div className="text-center" style={{ marginBottom: '34px' }}>
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
            className="font-arimo font-bold"
            style={{
              fontSize: 'clamp(28px, 3vw, 36px)',
              color: '#17223E',
              lineHeight: '40px',
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
        ) : apiSubjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center" style={{ padding: 'clamp(32px, 4vw, 56px) 0', color: '#9CA3AF' }}>
            <p className="font-arimo font-medium" style={{ fontSize: 'clamp(14px, 1.2vw, 16px)' }}>
              No subjects available
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(169px, 169px))',
              justifyContent: 'center',
              columnGap: '14px',
              rowGap: '16px',
              marginBottom: selectedSubject ? 'clamp(24px, 2.5vw, 36px)' : '0',
            }}
          >
            {orderedSubjects.map((subject) => {
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

        {/* Inline videos for selected subject */}
        {selectedSubject && (
          <div style={{ marginTop: 'clamp(24px, 2.5vw, 36px)' }}>
            <div style={{ marginBottom: 'clamp(20px, 2vw, 28px)' }}>
              <div className="flex items-center" style={{ gap: '12px', marginBottom: '4px' }}>
                <div
                  className="flex items-center justify-center"
                  style={{
                    background: getSubjectIconGradient(selectedSubject),
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
                    {selectedSubject} Simplified
                  </h2>
                  <p className="font-arimo" style={{ fontSize: '14px', lineHeight: '20px', color: '#4A5565' }}>
                    {'\u{1F4FA}'} {subjectVideos.length} Video{subjectVideos.length !== 1 ? 's' : ''}
                    {(() => {
                      const matched = apiSubjects.find(s => s.name === selectedSubject);
                      return matched?.totalDuration ? ` \u00B7 ${matched.totalDuration}` : '';
                    })()}
                  </p>
                </div>
              </div>
              {(() => {
                const matched = apiSubjects.find(s => s.name === selectedSubject);
                return matched?.description ? (
                  <p className="font-arimo" style={{ fontSize: 'clamp(13px, 1.12vw, 15px)', color: '#4A5565', marginTop: 'clamp(8px, 0.8vw, 12px)', lineHeight: 1.5 }}>
                    {matched.description}
                  </p>
                ) : null;
              })()}
            </div>

            {subjectVideosLoading ? (
              <div className="flex flex-col items-center justify-center" style={{ padding: 'clamp(32px, 4vw, 56px) 0', color: '#9CA3AF' }}>
                <p className="font-arimo font-medium" style={{ fontSize: 'clamp(14px, 1.2vw, 16px)' }}>
                  Loading videos...
                </p>
              </div>
            ) : subjectVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center" style={{ padding: 'clamp(32px, 4vw, 56px) 0', color: '#9CA3AF' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>{'\u{1F4ED}'}</div>
                <p className="font-arimo font-medium" style={{ fontSize: 'clamp(14px, 1.2vw, 16px)' }}>
                  No videos available for {selectedSubject}
                </p>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
                    gap: 'clamp(16px, 1.8vw, 24px)',
                  }}
                >
                  {subjectVideos.map((video) => (
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
                        className="flex items-center justify-center"
                        style={{ background: '#EFF6FF', height: 'clamp(150px, 14vw, 190px)', position: 'relative' }}
                      >
                        {video.thumbnailUrl ? (
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
                          {selectedSubject}
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
                            onClick={() => setShowLoginModal(true)}
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
                            onClick={() => setShowMentorModal(true)}
                            className="flex items-center gap-1 font-arimo font-bold"
                            style={{ padding: '5px 8px', borderRadius: '10px', background: '#F0F4FA', border: '1.5px solid #CBD5E1', color: '#1A1A2E', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                          >
                            <span style={{ fontSize: '14px' }}>{'\u{1F9D1}\u200D\u{1F3EB}'}</span>
                            Ask Mentor
                          </button>
                          <button
                            onClick={() => { const u = video.youtubeUrl || video.url || ''; window.open(u.startsWith('http') ? u : `https://${u}`, '_blank'); }}
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

                {/* YouTube CTA Banner */}
                <div style={{ marginTop: 'clamp(28px, 3vw, 40px)' }}>
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #0E182D, #172240)',
                      borderRadius: '24px',
                      padding: 'clamp(28px, 3vw, 44px) clamp(32px, 3.5vw, 48px)',
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
                        style={{
                          fontSize: 'clamp(28px, 2.7vw, 36px)',
                          lineHeight: 1.2,
                          color: '#FFFFFF',
                          marginBottom: 'clamp(4px, 0.4vw, 6px)',
                        }}
                      >
                        Never Miss a<br />
                        <span style={{ color: '#F0B100' }}>Lecture Again.</span>
                      </h3>
                      <p
                        className="font-arimo"
                        style={{
                          fontSize: 'clamp(18px, 1.88vw, 25px)',
                          color: '#FFFFFF',
                          marginBottom: 'clamp(12px, 1.2vw, 16px)',
                        }}
                      >
                        Stay Consistent. Stay Ahead.
                      </p>
                      <p
                        className="font-arimo"
                        style={{
                          fontSize: 'clamp(13px, 1.12vw, 15px)',
                          lineHeight: 'clamp(20px, 1.88vw, 25px)',
                          color: '#FFFFFF',
                          marginBottom: 'clamp(20px, 2vw, 28px)',
                          maxWidth: '480px',
                        }}
                      >
                        Subscribe to Rise with Jeet on YouTube and get instant notifications for new lectures, current affairs drops, and live sessions &mdash; completely free.
                      </p>
                      <a
                        href="https://www.youtube.com/@RiseWithJeet"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 font-arimo font-bold text-white"
                        style={{
                          background: '#E7000B',
                          borderRadius: '26843500px',
                          padding: 'clamp(12px, 1.2vw, 14px) clamp(24px, 2.25vw, 30px)',
                          fontSize: 'clamp(13px, 1.12vw, 15px)',
                          marginBottom: 'clamp(12px, 1.2vw, 16px)',
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43z" fill="#FFFFFF"/>
                          <path d="M9.75 15.02l5.75-3.27-5.75-3.27v6.54z" fill="#E7000B"/>
                        </svg>
                        Join Our YouTube Family
                      </a>
                      <p className="font-arimo" style={{ fontSize: 'clamp(12px, 1.05vw, 14px)', color: '#FFFFFF' }}>
                        Join 15K+ in our YouTube family
                      </p>
                    </div>
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 'clamp(100px, 10vw, 140px)',
                        height: 'clamp(100px, 10vw, 140px)',
                        borderRadius: '50%',
                        background: 'rgba(25,60,184,0.3)',
                        flexShrink: 0,
                        opacity: 0.4,
                      }}
                    >
                      <span style={{ fontSize: 'clamp(48px, 5vw, 68px)' }}>{'\u{1F514}'}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Featured videos section (when no subject selected) */}
        {!selectedSubject && apiVideos.length > 0 && (
          <div style={{ marginTop: 'clamp(40px, 4vw, 56px)' }}>
            <div style={{ marginBottom: 'clamp(20px, 2vw, 28px)' }}>
              <div className="flex items-center gap-3" style={{ marginBottom: 'clamp(4px, 0.4vw, 6px)' }}>
                <div
                  className="flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #FF6900 0%, #FB2C36 100%)',
                    borderRadius: '12px',
                    width: 'clamp(40px, 3.5vw, 48px)',
                    height: 'clamp(40px, 3.5vw, 48px)',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 'clamp(22px, 2vw, 26px)' }}>{subjectEmoji(featuredSubjectName)}</span>
                </div>
                <div>
                  <h2
                    className="font-arimo font-bold"
                    style={{ fontSize: 'clamp(20px, 1.88vw, 26px)', color: '#101828', lineHeight: 1.2 }}
                  >
                    {featuredSubjectName}
                  </h2>
                  <p className="font-arimo" style={{ fontSize: 'clamp(12px, 1.05vw, 14px)', color: '#4A5565' }}>
                    {'\u{1F4FA}'} {apiVideos.length} Video{apiVideos.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
                gap: 'clamp(16px, 1.8vw, 24px)',
              }}
            >
              {apiVideos.map((video) => (
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
                    className="flex items-center justify-center"
                    style={{ background: '#EFF6FF', height: 'clamp(150px, 14vw, 190px)', position: 'relative' }}
                  >
                    {video.thumbnailUrl ? (
                      <img src={video.thumbnailUrl} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: 'clamp(48px, 5vw, 64px)' }}>{subjectEmoji(featuredSubjectName)}</span>
                    )}
                  </div>

                  <div style={{ padding: 'clamp(14px, 1.5vw, 20px)' }}>
                    <p
                      className="font-arimo font-bold"
                      style={{ fontSize: 'clamp(10px, 0.85vw, 12px)', color: '#C68A0B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 'clamp(4px, 0.4vw, 6px)' }}
                    >
                      {featuredSubjectName}
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
                        onClick={() => setShowLoginModal(true)}
                        className="flex items-center gap-1.5 font-arimo font-bold"
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
                        onClick={() => setShowMentorModal(true)}
                        className="flex items-center gap-1.5 font-arimo font-bold"
                        style={{ padding: '5px 8px', borderRadius: '10px', background: '#F0F4FA', border: '1.5px solid #CBD5E1', color: '#1A1A2E', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                      >
                        <span style={{ fontSize: '14px' }}>{'\u{1F9D1}\u200D\u{1F3EB}'}</span>
                        Ask Mentor
                      </button>
                      {video.videoUrl ? (
                        <a
                          href={video.videoUrl.startsWith('http') ? video.videoUrl : `https://${video.videoUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 font-arimo font-bold text-white"
                          style={{ padding: '5px 8px', borderRadius: '10px', background: '#17223E', border: '1.5px solid #17223E', fontSize: '12px', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <rect width="24" height="24" rx="5" fill="#FF0000"/>
                            <path d="M10 8l6 4-6 4V8z" fill="white"/>
                          </svg>
                          Watch
                        </a>
                      ) : (
                        <button
                          onClick={() => { const u = video.youtubeUrl || video.url || ''; window.open(u.startsWith('http') ? u : `https://${u}`, '_blank'); }}
                          className="flex items-center gap-1 font-arimo font-bold text-white"
                          style={{ padding: '5px 8px', borderRadius: '10px', background: '#17223E', border: '1.5px solid #17223E', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <rect width="24" height="24" rx="5" fill="#FF0000"/>
                            <path d="M10 8l6 4-6 4V8z" fill="white"/>
                          </svg>
                          Watch
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
              Got a doubt? Ask our team and get a clear answer.
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
            style={{ background: '#FFFFFF', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '400px', margin: '0 16px', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>{'\u{1F512}'}</div>
            <h3 className="font-arimo font-bold" style={{ fontSize: '20px', color: '#101828', marginBottom: '8px' }}>
              PDF Access
            </h3>
            <p className="font-arimo" style={{ fontSize: '14px', color: '#6A7282', marginBottom: '24px' }}>
              Please subscribe to access downloadable PDFs.
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
