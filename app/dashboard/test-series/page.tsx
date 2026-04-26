'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { testSeriesService } from '@/lib/services';

interface HeroStats {
  activeSeries: number;
  totalStudents: number;
  testsTaken: number;
  successRate: number;
}

const filters = [
  { key: 'all', label: '📚 All Series' },
  { key: 'prelims', label: '🏛️ Prelims' },
  { key: 'mains', label: '✍️ Mains' },
  { key: 'current-affairs', label: '📰 Current Affairs' },
  { key: 'pyq', label: '📋 PYQ' },
  { key: 'csat', label: '📊 CSAT' },
  { key: 'foundation', label: '🏁 Foundation' },
  { key: 'gs-papers', label: '📑 GS Papers' },
  { key: 'optional', label: '🎓 Optional' },
  { key: 'free', label: '🎁 Free' },
];

// Map examMode/subject to an emoji icon
function seriesIcon(examMode: string, subject?: string | null): string {
  if (subject?.toLowerCase().includes('polity')) return '🏛️';
  if (subject?.toLowerCase().includes('history')) return '📜';
  if (subject?.toLowerCase().includes('geography')) return '🌍';
  if (subject?.toLowerCase().includes('economy')) return '📈';
  if (subject?.toLowerCase().includes('science')) return '🔬';
  if (examMode === 'mains') return '✍️';
  return '📄';
}

interface SeriesItem {
  id: string;
  title: string;
  description: string;
  examMode: string;
  subject?: string | null;
  difficulty: string;
  totalTests: number;
  questionsPerTest: number;
  price: number;
  enrollmentCount?: number;
  compareAtPrice?: number | null;
  discountPercent?: number | null;
  thumbnailUrl?: string | null;
  categoryLabel?: string;
  durationLabel?: string;
  rating?: number;
  listingStatus?: string;
  published?: boolean;
  features?: { analytics?: boolean; aiAnalysis?: boolean; videoSolutions?: boolean };
}

interface EnrolledItem {
  enrollmentId: string;
  testsCompleted: number;
  progress: string;
  series: SeriesItem;
}

export default function TestSeriesPage() {
  const [allSeries, setAllSeries] = useState<SeriesItem[]>([]);
  const [enrollments, setEnrollments] = useState<EnrolledItem[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [heroStats, setHeroStats] = useState<HeroStats | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [seriesRes, enrolledRes, statsRes] = await Promise.allSettled([
          testSeriesService.listSeries(),
          testSeriesService.getEnrolled(),
          testSeriesService.getStats(),
        ]);

        if (seriesRes.status === 'fulfilled' && seriesRes.value.data) {
          setAllSeries(seriesRes.value.data as SeriesItem[]);
        }

        if (enrolledRes.status === 'fulfilled' && enrolledRes.value.data) {
          const enrolled = enrolledRes.value.data as EnrolledItem[];
          setEnrollments(enrolled);
          setEnrolledIds(new Set(enrolled.map((e) => e.series.id)));
        }

        if (statsRes.status === 'fulfilled' && statsRes.value.data) {
          setHeroStats(statsRes.value.data as HeroStats);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleEnroll = async (seriesId: string) => {
    if (enrolling) return;
    setEnrolling(seriesId);
    try {
      await testSeriesService.enroll(seriesId);
      const enrolled = await testSeriesService.getEnrolled();
      if (enrolled.data) {
        const items = enrolled.data as EnrolledItem[];
        setEnrollments(items);
        setEnrolledIds(new Set(items.map((e) => e.series.id)));
      }
    } catch (err) {
      console.error('Enroll failed:', err);
    } finally {
      setEnrolling(null);
    }
  };

  // Enrolled series with their full data
  const enrolledSeries = enrollments.map((e) => ({ ...e.series, progress: e.progress, testsCompleted: e.testsCompleted }));

  // Non-enrolled series
  const exploreSeries = allSeries.filter((s) => !enrolledIds.has(s.id));

  return (
    <div
      style={{
        background: '#F9FAFB',
        minHeight: 'calc(100vh - 111px)',
        fontFamily: 'Inter, system-ui, sans-serif',
        overflowX: 'hidden',
      }}
    >
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div
            style={{
              width: '100%',
              maxWidth: '100%',
              margin: 0,
              padding: '0 0 48px',
              boxSizing: 'border-box',
            }}
          >
            {/* Hero */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                marginLeft: 0,
                marginRight: 0,
                marginTop: 0,
                minHeight: 320,
                marginBottom: 32,
                background: '#060C1C',
                padding: '24px 24px 42px',
                boxSizing: 'border-box',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage:
                    'linear-gradient(rgba(66, 88, 128, 0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(66, 88, 128, 0.18) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  background:
                    'radial-gradient(circle at 12% 38%, rgba(253, 199, 0, 0.16) 0%, transparent 36%), radial-gradient(circle at 92% 78%, rgba(59, 130, 246, 0.24) 0%, transparent 30%)',
                }}
              />
              <div style={{ position: 'relative', zIndex: 1, maxWidth: 920, margin: '0 auto', textAlign: 'center', paddingTop: 8 }}>
                {/* Badge pill */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '100px',
                    padding: '6px 14px',
                    marginBottom: '16px',
                  }}
                >
                  <img src="/lightning.png" alt="lightning" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                  <span
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 700,
                      fontSize: '12px',
                      lineHeight: '16px',
                      color: '#081228',
                      background: '#FDC700',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      letterSpacing: '0.3px',
                    }}
                  >
                    TEST SERIES
                  </span>
                  <span style={{ color: '#FDC700', fontWeight: 700, fontSize: '12px', lineHeight: '16px', letterSpacing: '0.3px' }}>
                    ALL PROGRAMS
                  </span>
                </div>
                <h1
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 700,
                    fontSize: '48px',
                    lineHeight: '48px',
                    color: '#FFFFFF',
                    margin: 0,
                    marginBottom: 14,
                  }}
                >
                  Choose Your <span style={{ color: '#E8B84B', fontStyle: 'italic', fontWeight: 700 }}>Battle Plan.</span>
                </h1>
                <p
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 500,
                    fontSize: 14,
                    lineHeight: '20px',
                    color: '#6A7282',
                    maxWidth: 1080,
                    margin: '0 auto 30px',
                  }}
                >
                  From NCERT foundations to full Prelims war-room simulations each series is crafted to mirror real UPSC patterns. Rise every day. Rise with Jeet.
                </p>
                {(() => {
                  const statCards = [
                    { value: heroStats ? String(heroStats.activeSeries) : '847', label: 'ACTIVE', valueColor: '#F5A623' },
                    { value: heroStats ? heroStats.totalStudents.toLocaleString('en-IN') : '1.2L+', label: 'STUDENTS', valueColor: '#FB7185' },
                    { value: heroStats ? heroStats.testsTaken.toLocaleString('en-IN') + (heroStats.testsTaken > 0 ? '+' : '') : '42,980+', label: 'TESTS TAKEN', valueColor: '#FFFFFF' },
                    { value: heroStats ? `${heroStats.successRate}%` : '68%', label: 'SUCCESS RATE', valueColor: '#22C55E' },
                  ];
                  return (
                    <div
                      style={{
                        display: 'inline-flex',
                        width: 'min(100%, 760px)',
                        borderRadius: 16,
                        overflow: 'hidden',
                        border: '0.8px solid #2E3B55',
                        background: 'rgba(21, 32, 54, 0.92)',
                        flexWrap: 'wrap',
                      }}
                    >
                      {statCards.map((card, index) => (
                        <div
                          key={card.label}
                          style={{
                            flex: '1 1 170px',
                            minHeight: 88,
                            padding: '14px 16px',
                            borderLeft: index === 0 ? undefined : '0.8px solid #2E3B55',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            boxSizing: 'border-box',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'Inter',
                              fontWeight: 700,
                              fontSize: 40,
                              lineHeight: '36px',
                              color: card.valueColor,
                            }}
                          >
                            {card.value}
                          </span>
                          <span
                            style={{
                              fontFamily: 'Inter',
                              fontWeight: 600,
                              fontSize: 12,
                              lineHeight: '16px',
                              color: '#6A7282',
                              letterSpacing: '0.5px',
                              marginTop: 8,
                            }}
                          >
                            {card.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Filter bar */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 8,
                marginBottom: 24,
                padding: '12px 0',
                width: '100%',
                maxWidth: 1639,
              }}
            >
              {filters.map((f, i) => (
                <button
                  key={f.key}
                  type="button"
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 600,
                    fontSize: 14,
                    lineHeight: '20px',
                    height: 37.6,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    borderRadius: 26843500,
                    padding: '8px 16px',
                    boxSizing: 'border-box',
                    color: i === 0 ? '#FFFFFF' : '#364153',
                    background: i === 0 ? '#101828' : '#FFFFFF',
                    border: i === 0 ? '0.8px solid #101828' : '0.8px solid #E5E7EB',
                    borderTop: i === 0 ? '0.8px solid #101828' : '0.8px solid #E5E7EB',
                    cursor: 'pointer',
                  }}
                >
                  {f.label}
                </button>
              ))}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <Link
                  href="/dashboard/test-analytics"
                  style={{
                    height: 38,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    borderRadius: 10,
                    padding: '8px 16px',
                    boxSizing: 'border-box',
                    fontFamily: 'Inter',
                    fontWeight: 600,
                    fontSize: 14,
                    lineHeight: '20px',
                    color: '#0B1120',
                    background: 'linear-gradient(89.92deg, #F1A901 0.07%, #FD7302 99.93%)',
                    border: '0.8px solid #E5E7EB',
                    borderTop: '0.8px solid #E5E7EB',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  📊&nbsp; Analytics
                </Link>
              </div>
            </div>

            {/* Content block */}
            <div
              style={{
                width: '100%',
                maxWidth: 1639,
                minHeight: 400,
                background: '#F9FAFB',
                boxSizing: 'border-box',
              }}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: 12 }}>
                  <div style={{ width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#0F172B', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ color: '#6B7280', fontSize: 14 }}>Loading series...</span>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              ) : (
                <>
                  {/* Explore All Programs */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <span aria-hidden="true" style={{ fontSize: 18, lineHeight: '18px' }}>🧭</span>
                      <h2 style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 20, lineHeight: '28px', color: '#101828', margin: 0 }}>Explore All Programs</h2>
                    </div>
                    {exploreSeries.length === 0 ? (
                      <div style={{ color: '#6B7280', fontSize: 14, padding: '32px 0' }}>
                        {allSeries.length === 0 ? 'No test series available yet. Check back soon!' : 'You\'re enrolled in all available series!'}
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 24, width: '100%' }}>
                        {exploreSeries.map((s) => (
                          <ProgramCard
                            key={s.id}
                            series={s}
                            isEnrolled={false}
                            enrolling={enrolling === s.id}
                            onEnroll={() => handleEnroll(s.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const statusTagStyles: Record<string, { bg: string; color: string }> = {
  prelims: { bg: '#D1FAE5', color: '#065F46' },
  mains: { bg: '#DBEAFE', color: '#1447E6' },
  free: { bg: '#D1FAE5', color: '#065F46' },
  default: { bg: '#F3F4F6', color: '#374151' },
};

function formatEnrolled(n: number | undefined) {
  if (n == null) return '—';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function ProgramCard({
  series,
  isEnrolled,
  enrolling,
  onEnroll,
}: {
  series: SeriesItem & { progress?: string; testsCompleted?: number };
  isEnrolled: boolean;
  enrolling: boolean;
  onEnroll: () => void;
}) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  const statusStyle = statusTagStyles[series.examMode] ?? statusTagStyles.default;
  const icon = seriesIcon(series.examMode, series.subject);
  const isFree = series.price === 0;
  const priceDisplay = isFree ? 'Free' : `₹${series.price.toLocaleString('en-IN')}`;
  const statusLabel = series.examMode.charAt(0).toUpperCase() + series.examMode.slice(1);
  const showLive = series.listingStatus === 'open' && series.published !== false;
  const duration = series.durationLabel ?? 'Ongoing';
  const rating = series.rating ?? 4.5;
  const compare = series.compareAtPrice;

  const handleResume = () => {
    if (starting) return;
    setStarting(true);
    router.push(`/dashboard/test-series/${series.id}/attempt?test=1`);
  };

  const openAnalytics = () => {
    router.push(`/dashboard/test-analytics?series=${encodeURIComponent(series.id)}`);
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 524,
        minHeight: 303,
        borderRadius: 24,
        border: '0.8px solid #E5E7EB',
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden',
        boxShadow: '0px 2px 4px -2px rgba(0,0,0,0.10), 0px 4px 6px -1px rgba(0,0,0,0.10)',
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 84.8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.8px 24px 0px',
          background: 'linear-gradient(135deg, #EFF6FF 0%, #FAF5FF 100%)',
          borderBottom: '0.8px solid #E5E7EB',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              flexShrink: 0,
              boxShadow: '0px 1px 2px -1px rgba(0,0,0,0.10), 0px 1px 3px rgba(0,0,0,0.10)',
              overflow: 'hidden',
            }}
          >
            {series.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={series.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              icon
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                fontFamily: 'var(--font-playfair), "Playfair Display", serif',
                fontWeight: 700,
                fontSize: 18,
                lineHeight: '28px',
                color: '#101828',
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {series.title}
            </h3>
            <div style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, lineHeight: '16px', color: '#99A1AF', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              {(series.categoryLabel ?? series.examMode).toUpperCase()}
              {series.subject ? ` · ${series.subject}` : ''}
            </div>
          </div>
        </div>
        <span
          style={{
            fontFamily: 'Inter',
            fontWeight: 600,
            fontSize: 12,
            lineHeight: '16px',
            color: showLive ? '#DC2626' : statusStyle.color,
            background: showLive ? '#FEE2E2' : statusStyle.bg,
            padding: '6px 12px',
            borderRadius: 10,
            textTransform: 'uppercase',
            flexShrink: 0,
          }}
        >
          {showLive ? 'Live' : statusLabel}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '24px 24px 0px', boxSizing: 'border-box', flex: 1 }}>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontFamily: 'Inter', fontWeight: 600, fontSize: 14, lineHeight: '20px', color: '#364153', marginBottom: 12 }}>
          <span style={{ color: '#7C3AED' }}>👤 {formatEnrolled(series.enrollmentCount)}</span>
          <span style={{ color: '#EA580C' }}>📄 {series.totalTests} Tests</span>
          <span style={{ color: '#2563EB' }}>🕐 {duration}</span>
          <span style={{ color: '#CA8A04' }}>⭐ {rating.toFixed(1)}</span>
        </div>
        <p
          style={{
            fontFamily: 'Inter',
            fontWeight: 400,
            fontSize: 14,
            lineHeight: '22.75px',
            color: '#6A7282',
            margin: 0,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {series.description}
        </p>
        {isEnrolled && series.progress && (
          <div style={{ marginTop: 8, fontFamily: 'Inter', fontSize: 12, color: '#6B7280' }}>
            Progress: {series.progress}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-playfair), "Playfair Display", serif', fontWeight: 700, fontSize: 24, lineHeight: '32px', color: '#101828' }}>{priceDisplay}</span>
          {compare != null && compare > series.price && (
            <span style={{ fontFamily: 'Inter', fontSize: 14, color: '#9CA3AF', textDecoration: 'line-through' }}>₹{compare.toLocaleString('en-IN')}</span>
          )}
          {series.discountPercent != null && series.discountPercent > 0 && (
            <span style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 12, color: '#DC2626', background: '#FEE2E2', padding: '4px 8px', borderRadius: 8 }}>
              -{series.discountPercent}%
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isEnrolled ? (
            <>
              <button
                type="button"
                onClick={openAnalytics}
                style={{ minWidth: 101, height: 40, fontFamily: 'Inter', fontWeight: 600, fontSize: 14, color: '#4A5565', background: '#F3F4F6', border: 'none', borderRadius: 10, cursor: 'pointer' }}
              >
                📊 Analytics
              </button>
              <button
                type="button"
                onClick={handleResume}
                disabled={starting}
                style={{
                  minWidth: 104,
                  height: 40,
                  fontFamily: 'Inter',
                  fontWeight: 700,
                  fontSize: 14,
                  color: '#FFFFFF',
                  background: starting ? '#4A5565' : '#1E2939',
                  border: 'none',
                  borderRadius: 10,
                  cursor: starting ? 'not-allowed' : 'pointer',
                  opacity: starting ? 0.8 : 1,
                }}
              >
                ▶ {starting ? 'Starting…' : 'Resume'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => router.push(`/dashboard/test-series/${series.id}`)}
                style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 13, color: '#374151', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 14px', cursor: 'pointer' }}
              >
                Open
              </button>
              <button
                type="button"
                onClick={onEnroll}
                disabled={enrolling}
                style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 14, color: isFree ? '#065F46' : '#FFFFFF', background: enrolling ? '#9CA3AF' : (isFree ? '#D1FAE5' : '#101828'), border: 'none', borderRadius: 8, padding: '8px 16px', cursor: enrolling ? 'not-allowed' : 'pointer' }}
              >
                {enrolling ? '...' : (isFree ? '► Start Free' : '► Enroll Now')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

