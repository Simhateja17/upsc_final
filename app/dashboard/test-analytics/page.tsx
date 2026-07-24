'use client';

import React, { useState, useEffect } from 'react';
import { dashboardService } from '@/lib/services';
import { useAuth } from '@/contexts/AuthContext';
import DashboardPageHero from '@/components/DashboardPageHero';
import Toast from '@/components/Toast';
import { useEntitlements } from '@/contexts/EntitlementsContext';
import { LockedWidget, LockedWidgetStyles, TestAnalyticsUpgradeModal } from '@/components/upgrade/UpgradeModals';
import { AnalyticsUiStyles, SectionDivider, StatCard } from '@/components/analytics/analyticsUi';
import { getSubjectAccentColor } from '@/lib/subjectPalette';


// ─── SVG Line Chart ───────────────────────────────────────────────────────────
// Ported 1:1 from the HTML reference's inline SVG charts: a plain filled-circle
// polyline over a gradient area fill, no background gridlines, no dot ring —
// `dashed` mirrors the reference's Mains trend stroke-dasharray="6,4".
function LineChart({ data, width = 400, height = 120, color = '#00D5BE', dashed = false, dotRadius = 4 }: {
  data: { label: string; value: number }[];
  width?: number;
  height?: number;
  color?: string;
  dashed?: boolean;
  dotRadius?: number;
}) {
  if (!data.length) return (
    <div className="flex items-center justify-center text-[12px] text-[#6A7282]" style={{ height }}>
      No data yet
    </div>
  );

  const pad = { top: 10, right: 10, bottom: 24, left: 30 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const values = data.map(d => d.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;

  const pts = data.map((d, i) => ({
    x: pad.left + (i / Math.max(data.length - 1, 1)) * innerW,
    y: pad.top + (1 - (d.value - minV) / range) * innerH,
  }));

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L${pts.at(-1)!.x.toFixed(1)},${(pad.top + innerH).toFixed(1)} L${pts[0].x.toFixed(1)},${(pad.top + innerH).toFixed(1)} Z`;

  const gradId = `grad-${color.replace('#', '')}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`} />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeDasharray={dashed ? '6,4' : undefined}
      />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={dotRadius} fill={color} />
      ))}
      {data.map((d, i) => (
        <text key={i} x={pts[i].x} y={height - 4} textAnchor="middle"
          fontSize="9" fill="#6A7282" fontFamily="Inter, sans-serif">
          {d.label}
        </text>
      ))}
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatSeconds(s: number): string {
  if (!s) return '0s';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m${sec > 0 ? sec + 's' : ''}` : `${sec}s`;
}

function timeColor(s: number): string {
  if (s === 0) return '#6A7282';
  if (s < 90) return '#51cf66';
  if (s <= 120) return '#ff9933';
  return '#ef4444';
}

const WEEK_BAR_COLORS = ['#111827', '#111827', '#111827', '#111827', '#FDC700', '#D1D5DB', '#D1D5DB'];

// Chart heading with the reference's coloured dot marker. Sizes ported 1:1 from
// the HTML reference (.chart-header, .chart-dot, .chart-title, .chart-subtitle).
function ChartHeading({ dotColor, title, subtitle, filterToggle }: { dotColor: string; title: React.ReactNode; subtitle?: string; filterToggle?: React.ReactNode }) {
  return (
    <div>
      <h2
        className="flex items-center gap-2"
        style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3, color: '#1e293b', marginBottom: subtitle ? 0 : 16 }}
      >
        <span className="h-[10px] w-[10px] flex-shrink-0 rounded-full" style={{ background: dotColor }} />
        {title}
        {filterToggle}
      </h2>
      {subtitle && (
        <div style={{ fontSize: 10.5, color: '#64748b', marginTop: -2, marginBottom: 14 }}>{subtitle}</div>
      )}
    </div>
  );
}

// Day/Week/Month segmented toggle, ported 1:1 from the HTML reference's
// .chart-filter-toggle / .chart-filter-btn (purely a display-period switch —
// the reference's own setMainsPeriod() only swaps the active tab, it doesn't
// re-fetch or recompute data, so this mirrors that exactly).
const CHART_FILTER_PERIODS = ['day', 'week', 'month'] as const;
type ChartFilterPeriod = typeof CHART_FILTER_PERIODS[number];

function ChartFilterToggle({ value, onChange }: { value: ChartFilterPeriod; onChange: (period: ChartFilterPeriod) => void }) {
  return (
    <div className="pa-filter-toggle">
      {CHART_FILTER_PERIODS.map((period) => (
        <button
          key={period}
          type="button"
          onClick={() => onChange(period)}
          className={`pa-filter-btn capitalize ${value === period ? 'pa-filter-btn-active' : ''}`}
        >
          {period}
        </button>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TestAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [mainsTrendPeriod, setMainsTrendPeriod] = useState<ChartFilterPeriod>('day');
  const [timePerQuestionPeriod, setTimePerQuestionPeriod] = useState<ChartFilterPeriod>('day');
  // Test History series filter + sort — pure client-side display state over the
  // already-fetched `testHistory` list (same "swap the view, don't recompute"
  // pattern as ChartFilterToggle above), ported 1:1 from the HTML reference's
  // filterBySeries()/sortTests().
  const [historySeriesFilter, setHistorySeriesFilter] = useState<'all' | 'daily_mcq' | 'mock' | 'pyq'>('all');
  const [historySortField, setHistorySortField] = useState<'date' | 'accuracy' | 'score'>('date');
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const entitlements = useEntitlements();
  // Free & Aspire see the page with detailed widgets blurred + locked;
  // clicking a locked widget opens the tier-specific upgrade modal.
  const analyticsLocked = !entitlements.canAccess('test_analytics', ['full']);
  const openUpgradeModal = () => setShowUpgradeModal(true);
  // Unlocked (Rise/Ascent) widgets get the reference 3D hover lift; locked
  // widgets get their own hover from LockedWidget, so we don't double it up.
  const widgetClass = `pa-card ${analyticsLocked ? '' : 'pa-card-3d'} overflow-hidden`;
  // Padding + radius ported 1:1 from the HTML reference's .chart-widget (padding: 24px; border-radius: var(--radius) = 12px).
  const widgetStyle = { borderRadius: 12, padding: 24 } as React.CSSProperties;

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setError('Please log in again to view test analytics.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadAnalytics = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await dashboardService.getTestAnalytics();
        if (!cancelled) setData(res.data ?? null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load test analytics';

        if (!cancelled) setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated]);

  const summary = data?.summary ?? {};
  const subjectAccuracy: any[] = data?.subjectAccuracy ?? [];
  const weeklyMcqTrend: any[] = data?.weeklyMcqTrend ?? [];
  const dailyActivity: any[] = data?.dailyActivity ?? [];
  const mainsTrend: any[] = data?.mainsTrend ?? [];
  const mainsStats = data?.mainsStats ?? {};
  const timePerQuestion: any[] = data?.timePerQuestion ?? [];
  const testHistory: any[] = data?.testHistory ?? [];

  // Series filter → matches the backend's `type` field per row (see
  // dashboard.service.ts: daily-mcq / daily-answer / mock-prelims / mock-mains
  // / pyq-mains / test-series). "All" always shows every row.
  const displayedTestHistory = testHistory
    .filter((row) => {
      if (historySeriesFilter === 'all') return true;
      if (historySeriesFilter === 'daily_mcq') return row.type === 'daily-mcq';
      if (historySeriesFilter === 'mock') return row.type === 'mock-prelims' || row.type === 'mock-mains';
      if (historySeriesFilter === 'pyq') return row.type === 'pyq-mains';
      return true;
    })
    .slice()
    .sort((a, b) => {
      if (historySortField === 'accuracy') return (b.accuracy ?? 0) - (a.accuracy ?? 0);
      if (historySortField === 'score') {
        const scoreNum = (row: any) => parseInt(String(row.score ?? '0').split('/')[0], 10) || 0;
        return scoreNum(b) - scoreNum(a);
      }
      return 0; // 'date' — testHistory already arrives most-recent-first from the backend
    });

  const totalTests = summary.totalTests ?? 0;
  const avgAccuracy = summary.avgAccuracy ?? 0;
  const bestPercentile = summary.bestPercentile ?? 0;
  const currentStreak = summary.currentStreak ?? 0;
  const totalQuestions = summary.totalQuestions ?? 0;

  const mcqCorrect = summary.mcqCorrect ?? 0;
  const mcqWrong = summary.mcqWrong ?? 0;
  const mcqSkipped = summary.mcqSkipped ?? 0;

  const topStripCards = [
    { label: 'TEST TAKEN', value: String(totalTests), valueColor: '#f5a623' },
    { label: 'AVG SCORE', value: String(summary.avgScore ?? 0), valueColor: '#ff7070' },
    { label: 'ACCURACY', value: `${avgAccuracy}%`, valueColor: '#FFFFFF' },
    { label: 'DAY STREAK', value: String(currentStreak), valueColor: '#0e8a56' },
  ];

  // Icon-left stat cards (reference stats row), driven by real analytics data.
  const summaryCards: { title: string; value: React.ReactNode; color: string; icon: string; sub: string }[] = [
    { title: 'Percentile', value: bestPercentile > 0 ? String(bestPercentile) : 'N/A', color: '#14b8a6', icon: '📊', sub: 'Best percentile achieved' },
    { title: 'Tests Attempted', value: String(totalTests), color: '#ff9933', icon: '✏️', sub: 'Full length & sectional mocks' },
    { title: 'Questions Attempted', value: totalQuestions.toLocaleString('en-IN'), color: '#cc5de8', icon: '📝', sub: 'MCQs, PYQs and mock tests' },
    { title: 'Overall Accuracy', value: `${avgAccuracy}%`, color: '#51cf66', icon: '🎯', sub: 'Net accuracy after negatives' },
    { title: 'Best Rank', value: 'N/A', color: '#d4a843', icon: '🏆', sub: 'Across all mock test series' },
    { title: 'Avg Score', value: String(summary.avgScore ?? 0), color: '#4dabf7', icon: '📈', sub: 'Average across attempts' },
  ];

  const weeklyChartData = weeklyMcqTrend.map(w => ({ label: w.week, value: w.score }));
  const mainsChartData = mainsTrend.map(t => ({ label: t.attempt, value: t.score }));

  const maxQuestions = Math.max(...dailyActivity.map(d => d.questionsAttempted), 1);

  return (
    <div
      className="flex overflow-hidden font-arimo"
      style={{ background: '#F9FAFB', minHeight: 'calc(100vh - clamp(90px, 5.78vw, 111px))' }}
    >
      <AnalyticsUiStyles />
      <LockedWidgetStyles />
      <TestAnalyticsUpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        tier={entitlements.tier}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="w-full relative">
          {loading && !error && (
            <div
              className="absolute right-6 top-4 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.08em]"
              style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', fontWeight: 700 }}
            >
              Syncing
            </div>
          )}
          {error && (
            <Toast
              message={error}
              type="error"
              onClose={() => setError(null)}
              autoCloseDuration={4000}
            />
          )}

          <DashboardPageHero
            badgeIcon={
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/sidebar-analytics-new.png" alt="test analytics" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
            }
            badgeText="Analytics - Test Dashboard"
            title={<>{user?.firstName ?? 'Your'}&apos;s <span style={{ fontStyle: 'italic', color: '#e8b84b' }}>Test Analytics</span></>}
            subtitle="Your complete UPSC test analytics — score trends, subject mastery, rank history, time management and AI-powered next steps."
            stats={topStripCards.map(c => ({ value: c.value, label: c.label, color: c.valueColor }))}
          />
        </div>
        <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-6 lg:px-8 py-8">
          {/* ── Stat cards (open on every plan) ── */}
          <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3 lg:grid-cols-6">
            {summaryCards.map((card) => (
              <StatCard
                key={card.title}
                label={card.title}
                value={card.value}
                icon={<span aria-hidden>{card.icon}</span>}
                color={card.color}
                sub={card.sub}
                trend="none"
              />
            ))}
          </div>

          {/* ── MCQ & Subject Analytics ── */}
          <SectionDivider label="MCQ &amp; Subject Analytics" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* MCQ Performance Trend */}
            <LockedWidget
              locked={analyticsLocked}
              onClick={openUpgradeModal}
              className={widgetClass}
              style={widgetStyle}
              heading={<ChartHeading dotColor="#cc5de8" title="MCQ Performance Trend" />}
            >
              <div>
                <div className="flex flex-wrap gap-6 mb-5">
                  {[
                    { label: 'Correct', value: mcqCorrect, color: '#101828' },
                    { label: 'Wrong', value: mcqWrong, color: '#FB2C36' },
                    { label: 'Skipped', value: mcqSkipped, color: '#D1D5DC' },
                    { label: 'Net Accuracy', value: `${avgAccuracy}%`, color: '#FF6900' },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="font-bold" style={{ fontSize: 15.4, lineHeight: 1.2, color: item.color }}>
                        {typeof item.value === 'number' ? item.value.toLocaleString('en-IN') : item.value}
                      </div>
                      <div className="uppercase" style={{ fontSize: 9.1, letterSpacing: '0.6px', fontWeight: 600, color: '#99A1AF' }}>
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Weekly line chart */}
                <div>
                  <div className="uppercase mb-2" style={{ fontSize: 9.1, fontWeight: 700, letterSpacing: '0.8px', color: '#64748b' }}>
                    Weekly Accuracy Trend
                  </div>
                  <LineChart data={weeklyChartData} color="#cc5de8" height={140} />
                </div>

                {/* Daily bar chart */}
                <div className="mt-3">
                  <div className="uppercase mb-2" style={{ fontSize: 9.1, fontWeight: 700, letterSpacing: '0.8px', color: '#64748b' }}>
                    Questions attempted this week
                  </div>
                  <div className="flex items-end gap-2 h-[60px]">
                    {dailyActivity.map((d, i) => {
                      const pct = (d.questionsAttempted / maxQuestions) * 100;
                      return (
                        <div key={d.day} className="flex flex-col items-center flex-1 gap-1">
                          <div className="text-[10px] text-[#6A7282]">
                            {d.questionsAttempted || ''}
                          </div>
                          <div
                            className="rounded-t-[4px] mx-auto"
                            style={{
                              width: 28,
                              height: Math.max(pct * 0.24, pct > 0 ? 4 : 0),
                              background: pct > 0 ? WEEK_BAR_COLORS[i % WEEK_BAR_COLORS.length] : 'transparent',
                              minHeight: pct > 0 ? 4 : 0,
                            }}
                          />
                          <div className="text-[10px] text-[#6A7282]">{d.day}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </LockedWidget>

            {/* Subject Accuracy */}
            <LockedWidget
              locked={analyticsLocked}
              onClick={openUpgradeModal}
              className={widgetClass}
              style={widgetStyle}
              heading={<ChartHeading dotColor="#51cf66" title="Subject Accuracy" subtitle="Across all attempted MCQs" />}
            >
              <div>
                {subjectAccuracy.length === 0 ? (
                  <div className="flex items-center justify-center h-[200px] text-[13px] text-[#6A7282]">
                    No mock test data yet
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {subjectAccuracy.slice(0, 8).map((s) => {
                      const subjectColor = getSubjectAccentColor(s.subject);
                      return (
                        <div key={s.subject} className="flex items-center gap-2.5 border-b border-[#F1F5F9] py-2.5 last:border-b-0">
                          <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: subjectColor }} />
                          <span
                            className="flex-shrink-0 overflow-hidden text-ellipsis whitespace-nowrap font-medium"
                            style={{ fontSize: 11.9, color: '#1A1F36', width: 160 }}
                            title={s.subject}
                          >
                            {s.subject}
                          </span>
                          <div className="flex-1 overflow-hidden rounded-full" style={{ height: 8, background: '#F3F4F6' }}>
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${s.accuracy}%`, background: subjectColor }}
                            />
                          </div>
                          <span className="flex-shrink-0 whitespace-nowrap text-right" style={{ fontSize: 10.5, minWidth: 80 }}>
                            <span style={{ color: '#22C55E' }}>{s.correct}✓</span> <span style={{ color: '#EF4444' }}>{s.wrong}✗</span>
                          </span>
                          <span className="flex-shrink-0 text-right font-semibold" style={{ fontSize: 11.2, width: 40, color: subjectColor }}>
                            {s.accuracy}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </LockedWidget>
          </div>

          {/* ── Writing & Time Analysis ── */}
          <SectionDivider label="Writing &amp; Time Analysis" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Mains Answer Writing Trend */}
            <LockedWidget
              locked={analyticsLocked}
              onClick={openUpgradeModal}
              className={widgetClass}
              style={widgetStyle}
              heading={
                <ChartHeading
                  dotColor="#ff9933"
                  title="Mains Answer Writing Trend"
                  subtitle="Answer scoring performance"
                  filterToggle={<ChartFilterToggle value={mainsTrendPeriod} onChange={setMainsTrendPeriod} />}
                />
              }
            >
              <div>
                <div className="flex flex-wrap gap-6 mb-5">
                  {[
                    { label: 'Answers Written', value: mainsStats.totalAnswers ?? 0, color: '#101828' },
                    { label: 'Avg Score', value: mainsStats.avgScore ?? 0, color: '#155DFC' },
                    { label: 'Latest Score', value: mainsStats.latestScore ?? 0, color: '#FF6900' },
                    {
                      label: 'Improvement',
                      value: mainsStats.improvement != null
                        ? `${mainsStats.improvement >= 0 ? '+' : ''}${mainsStats.improvement}`
                        : '–',
                      color: mainsStats.improvement > 0 ? '#22C55E' : mainsStats.improvement < 0 ? '#EF4444' : '#6A7282',
                    },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="font-bold" style={{ fontSize: 15.4, lineHeight: 1.2, color: item.color }}>
                        {item.value}
                      </div>
                      <div className="uppercase" style={{ fontSize: 9.1, letterSpacing: '0.6px', fontWeight: 600, color: '#99A1AF' }}>
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="uppercase mb-2" style={{ fontSize: 9.1, fontWeight: 700, letterSpacing: '0.8px', color: '#64748b' }}>
                    Score progression
                  </div>
                  <LineChart data={mainsChartData} color="#ff9933" height={140} dashed dotRadius={3.5} />
                </div>
              </div>
            </LockedWidget>

            {/* Time Spent per Question – Daily */}
            <LockedWidget
              locked={analyticsLocked}
              onClick={openUpgradeModal}
              className={widgetClass}
              style={widgetStyle}
              heading={
                <ChartHeading
                  dotColor="#14b8a6"
                  title="Time Spent per Question"
                  subtitle="Average seconds per question"
                  filterToggle={<ChartFilterToggle value={timePerQuestionPeriod} onChange={setTimePerQuestionPeriod} />}
                />
              }
            >
              <div>
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {timePerQuestion.map((d) => (
                    <div
                      key={d.day}
                      className="flex aspect-square flex-col items-center justify-center gap-1 rounded-[10px]"
                      style={{
                        border: '1px solid #e5e7eb',
                        background: d.avgSeconds > 0 ? timeColor(d.avgSeconds) + '1A' : '#fafafa',
                      }}
                    >
                      <span className="uppercase" style={{ fontSize: 9.1, fontWeight: 700, color: '#64748b' }}>{d.day}</span>
                      <span className="font-bold" style={{ fontSize: 15.4, color: d.avgSeconds > 0 ? timeColor(d.avgSeconds) : '#64748b' }}>
                        {d.avgSeconds > 0 ? formatSeconds(d.avgSeconds) : '–'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex gap-4 mb-4">
                  {[['#51cf66', '< 90s'], ['#ff9933', '90–120s'], ['#ef4444', '> 120s']].map(([c, l]) => (
                    <div key={l} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: c }} />
                      <span style={{ fontSize: 10.08, color: '#64748b' }}>{l}</span>
                    </div>
                  ))}
                </div>

                {/* Slowest / Fastest subjects */}
                {subjectAccuracy.length >= 2 && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[10px] p-4 text-center" style={{ background: '#FEF2F2' }}>
                      <div className="font-semibold uppercase mb-1.5" style={{ fontSize: 9.1, letterSpacing: '0.5px', color: '#EF4444' }}>Lowest Accuracy</div>
                      <div className="font-semibold mb-0.5" style={{ fontSize: 11.9, color: '#1A1F36' }}>
                        {subjectAccuracy.at(-1)?.subject ?? '–'}
                      </div>
                      <div className="font-bold" style={{ fontSize: 16.8, color: '#EF4444' }}>
                        {subjectAccuracy.at(-1)?.accuracy ?? 0}%
                      </div>
                    </div>
                    <div className="rounded-[10px] p-4 text-center" style={{ background: '#F0FDF4' }}>
                      <div className="font-semibold uppercase mb-1.5" style={{ fontSize: 9.1, letterSpacing: '0.5px', color: '#22C55E' }}>Highest Accuracy</div>
                      <div className="font-semibold mb-0.5" style={{ fontSize: 11.9, color: '#1A1F36' }}>
                        {subjectAccuracy[0]?.subject ?? '–'}
                      </div>
                      <div className="font-bold" style={{ fontSize: 16.8, color: '#22C55E' }}>
                        {subjectAccuracy[0]?.accuracy ?? 0}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </LockedWidget>
          </div>

          {/* ── Complete Test History ── */}
          <SectionDivider label="Test History" />
          <LockedWidget
            locked={analyticsLocked}
            onClick={openUpgradeModal}
            className={`pa-card ${analyticsLocked ? '' : 'pa-card-3d'} overflow-hidden`}
            style={widgetStyle}
            heading={
              <div className="mb-5 font-bold" style={{ fontSize: 16.1, color: '#1A1F36' }}>
                Complete Test History
              </div>
            }
          >
            {testHistory.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-[14px] text-[#6A7282]">No tests attempted yet</p>
              </div>
            ) : (
              <>
                {/* Series filter + sort — client-side view over testHistory, see displayedTestHistory above */}
                <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="pa-filter-label">Series:</span>
                    {([
                      { key: 'all', label: 'All' },
                      { key: 'daily_mcq', label: 'Daily MCQ' },
                      { key: 'mock', label: 'Mock Tests' },
                      { key: 'pyq', label: 'PYQ' },
                    ] as const).map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setHistorySeriesFilter(f.key)}
                        className={`pa-history-btn ${historySeriesFilter === f.key ? 'pa-history-btn-active' : ''}`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="pa-filter-label">Sort:</span>
                    {([
                      { key: 'date', label: 'Recent' },
                      { key: 'accuracy', label: 'Accuracy' },
                      { key: 'score', label: 'Score' },
                    ] as const).map((s) => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => setHistorySortField(s.key)}
                        className={`pa-history-btn ${historySortField === s.key ? 'pa-history-btn-active' : ''}`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {displayedTestHistory.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-[14px] text-[#6A7282]">No tests match this filter</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                          {['#', 'Test Name', 'Series', 'Date', 'Score', 'Accuracy', 'Rank', 'Report'].map(h => (
                            <th
                              key={h}
                              className="px-3 pb-3 text-left uppercase"
                              style={{ fontSize: 9.52, letterSpacing: '0.8px', fontWeight: 700, color: '#64748b' }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {displayedTestHistory.filter(Boolean).map((row, i) => (
                          <tr
                            key={row.id ?? i}
                            style={{ borderBottom: i < displayedTestHistory.length - 1 ? '1px solid #f5f5f5' : undefined }}
                            className="hover:bg-[#FAFAFA] transition-colors"
                          >
                            <td className="px-3 py-3.5" style={{ fontSize: 11.9, color: '#6A7282' }}>{i + 1}</td>
                            <td className="px-3 py-3.5">
                              <div className="font-semibold" style={{ fontSize: 11.9, color: '#1A1F36' }}>{row.name}</div>
                            </td>
                            <td className="px-3 py-3.5">
                              <span
                                className="inline-flex items-center px-2.5 font-medium rounded-full"
                                style={{ fontSize: 10.08, paddingTop: 3, paddingBottom: 3, background: '#EFF6FF', color: '#155DFC' }}
                              >
                                {row.series}
                              </span>
                            </td>
                            <td className="px-3 py-3.5" style={{ fontSize: 11.9, color: '#6A7282' }}>{row.date}</td>
                            <td className="px-3 py-3.5 font-semibold" style={{ fontSize: 11.9, color: '#1A1F36' }}>{row.score}</td>
                            <td className="px-3 py-3.5">
                              <span className="font-bold" style={{ fontSize: 11.9, color: row.accuracy >= 70 ? '#22C55E' : row.accuracy >= 50 ? '#F59E0B' : '#EF4444' }}>
                                {row.accuracy}%
                              </span>
                            </td>
                            <td className="px-3 py-3.5" style={{ fontSize: 11.9, color: '#6A7282' }}>{row.rank ?? 'N/A'}</td>
                            <td className="px-3 py-3.5">
                              <button
                                type="button"
                                onClick={() => setSelectedReport(row)}
                                className="pa-link-gold font-medium hover:underline"
                                style={{ fontSize: 11.48, color: '#155DFC' }}
                              >
                                View report →
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="pt-4 mt-2 border-t" style={{ borderColor: '#F3F4F6' }}>
                  <p className="text-[12px]" style={{ color: '#99A1AF' }}>
                    Showing {displayedTestHistory.length} of {totalTests} tests
                  </p>
                </div>
              </>
            )}
          </LockedWidget>

        </div>
      </div>

      {selectedReport && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
          style={{ background: 'rgba(15,23,42,0.55)' }}
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="w-full max-w-[840px] rounded-[24px] bg-white p-7 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto"
            style={{ boxShadow: '0 25px 60px rgba(15,23,42,0.28)' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 inline-flex rounded-full bg-[#ECFDF5] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#047857]">
                  Detailed Test Report
                </div>
                <h2 className="m-0 text-[26px] font-bold text-[#101828]">
                  {selectedReport.name || 'Test Report'}
                </h2>
                <p className="mt-1 text-[13px] text-[#6A7282]">
                  {selectedReport.series || 'Practice'} · {selectedReport.date || 'Recent attempt'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="h-10 w-10 rounded-full bg-[#101828] text-white"
                aria-label="Close report"
              >
                x
              </button>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: 'Score', value: selectedReport.score ?? 'N/A', color: '#155DFC' },
                { label: 'Accuracy', value: selectedReport.accuracy != null ? `${selectedReport.accuracy}%` : 'N/A', color: '#22C55E' },
                { label: 'Rank', value: selectedReport.rank ?? 'N/A', color: '#FF8904' },
                { label: 'Type', value: selectedReport.type ? String(selectedReport.type).replace(/-/g, ' ') : 'Practice', color: '#8B5CF6' },
              ].map((item) => (
                <div key={item.label} className="rounded-[16px] border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                  <div className="text-[24px] font-bold capitalize" style={{ color: item.color }}>
                    {item.value}
                  </div>
                  <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6A7282]">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[16px] border border-[#E5E7EB] p-5">
                <h3 className="mb-3 text-[15px] font-bold text-[#101828]">Performance Summary</h3>
                <p className="text-[13px] leading-[22px] text-[#4A5565]">
                  This report summarizes the selected attempt without redirecting away from analytics. Use it to review score,
                  accuracy, rank and test context before opening the original module for a deeper question-by-question review.
                </p>
              </div>
              <div className="rounded-[16px] border border-[#E5E7EB] p-5">
                <h3 className="mb-3 text-[15px] font-bold text-[#101828]">Next Actions</h3>
                <ul className="m-0 list-none space-y-2 p-0 text-[13px] text-[#4A5565]">
                  <li>Review weak subjects from the subject accuracy panel.</li>
                  <li>Retake a similar mock if accuracy is below 60%.</li>
                  <li>Add recurring weak areas to Smart Revision Tools.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
