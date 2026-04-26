'use client';

import React, { useState, useEffect } from 'react';
import { dashboardService } from '@/lib/services';
import { useAuth } from '@/contexts/AuthContext';

// ─── SVG Line Chart ───────────────────────────────────────────────────────────
function LineChart({ data, width = 400, height = 120, color = '#00D5BE' }: {
  data: { label: string; value: number }[];
  width?: number;
  height?: number;
  color?: string;
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
      {[0, 1, 2, 3].map((line) => (
        <line
          key={line}
          x1={pad.left}
          x2={width - pad.right}
          y1={pad.top + (line / 3) * innerH}
          y2={pad.top + (line / 3) * innerH}
          stroke="#E5E7EB"
          strokeWidth="0.8"
          opacity="0.7"
        />
      ))}
      <path d={areaD} fill={`url(#${gradId})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill={color} stroke="#fff" strokeWidth="2" />
      ))}
      {data.map((d, i) => (
        <text key={i} x={pts[i].x} y={height - 4} textAnchor="middle"
          fontSize="9" fill="#6A7282" fontFamily="Inter">
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
  if (s < 90) return '#22C55E';
  if (s <= 120) return '#F59E0B';
  return '#EF4444';
}

const SUBJECT_COLORS = ['#00BBA7', '#A855F7', '#14B8A6', '#F97316', '#155DFC', '#EF4444', '#D97706', '#EC4899'];
const WEEK_BAR_COLORS = ['#111827', '#111827', '#111827', '#111827', '#FDC700', '#D1D5DB', '#D1D5DB'];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TestAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

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

  const totalTests = summary.totalTests ?? 0;
  const avgAccuracy = summary.avgAccuracy ?? 0;
  const bestPercentile = summary.bestPercentile ?? 0;
  const currentStreak = summary.currentStreak ?? 0;
  const totalQuestions = summary.totalQuestions ?? 0;
  const mcqAttempts = summary.mcqAttempts ?? 0;

  const mcqCorrect = summary.mcqCorrect ?? 0;
  const mcqWrong = summary.mcqWrong ?? 0;
  const mcqSkipped = summary.mcqSkipped ?? 0;

  const topStripCards = [
    { label: 'tests taken', value: String(totalTests), valueColor: '#D4AF37' },
    { label: 'avg accuracy', value: `${avgAccuracy}%`, valueColor: '#00D492' },
    { label: 'questions', value: totalQuestions.toLocaleString('en-IN'), valueColor: '#FFFFFF' },
    { label: 'best percentile', value: bestPercentile > 0 ? `${bestPercentile}th` : 'N/A', valueColor: '#FF8904' },
    { label: 'day\nstreak', value: String(currentStreak), valueColor: '#FFFFFF' },
  ];

  const summaryCards = [
    { title: 'Overall Percentile', value: bestPercentile > 0 ? String(bestPercentile) : 'N/A', accent: '#00BBA7', icon: '📊', sub: 'Best percentile achieved' },
    { title: 'Tests Attempted', value: String(totalTests), accent: '#FF6900', icon: '📝', sub: 'Full length & sectional mocks' },
    { title: 'Questions Attempted', value: totalQuestions.toLocaleString('en-IN'), accent: '#155DFC', icon: '✍️', sub: 'MCQs, PYQs and mock tests' },
    { title: 'Overall Accuracy', value: `${avgAccuracy}%`, accent: '#22C55E', icon: '🎯', sub: 'Net accuracy after negatives' },
    { title: 'Best Rank', value: 'N/A', accent: '#8B5CF6', icon: '🏆', sub: 'Across all mock test series' },
  ];

  const weeklyChartData = weeklyMcqTrend.map(w => ({ label: w.week, value: w.score }));
  const mainsChartData = mainsTrend.map(t => ({ label: t.attempt, value: t.score }));

  const maxQuestions = Math.max(...dailyActivity.map(d => d.questionsAttempted), 1);

  return (
    <div
      className="flex overflow-hidden"
      style={{ background: '#FFFFFF', minHeight: 'calc(100vh - clamp(90px, 5.78vw, 111px))' }}
    >
      <div className="flex-1 overflow-y-auto">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 relative">
          {loading && !error && (
            <div
              className="absolute right-6 top-4 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.08em]"
              style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', fontFamily: 'Inter', fontWeight: 700 }}
            >
              Syncing
            </div>
          )}
          {error && (
            <div
              className="mb-6 rounded-[12px] px-5 py-4 text-[13px]"
              style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', fontFamily: 'Inter' }}
            >
              {error}
            </div>
          )}

          {/* ── Hero ── */}
          <div
            className="w-full max-w-[980px] rounded-[18px] px-10 pt-8 pb-6 mb-6 flex flex-col gap-6"
            style={{
              background: 'radial-gradient(circle at top left, rgba(255,210,115,0.12), transparent 34%), linear-gradient(135deg, #0F172B 0%, #1E2939 100%)',
              boxShadow: '0 18px 50px rgba(15,23,43,0.16)',
            }}
          >
            <div className="flex flex-col gap-3 items-start text-left">
              <span
                className="inline-flex items-center justify-center rounded-full px-3 py-1 uppercase tracking-[0.12em]"
                style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 12, lineHeight: '16px', letterSpacing: '1.2px', color: '#0B1120', background: '#00D5BE' }}
              >
                Analytics - Test Dashboard
              </span>
              <h1
                className="text-[40px] sm:text-[48px] leading-[48px] font-bold"
                style={{ color: '#FFFFFF', fontFamily: 'Inter, system-ui' }}
              >
                {user?.firstName ?? 'Your'}&apos;s{' '}
                <span style={{ fontFamily: 'Georgia, ui-serif', fontWeight: 700, fontStyle: 'italic' }}>
                  Progress.
                </span>
              </h1>
              <p
                className="max-w-[660px]"
                style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 14, lineHeight: '22.75px', color: '#D1D5DC' }}
              >
                Detailed analytics for every test — MCQ trends, subject accuracy, mains writing scores,
                time management insights and complete test history.
              </p>
            </div>

            {/* Stats strip */}
            <div className="flex flex-wrap gap-0 rounded-[14px] overflow-hidden mt-2">
              {topStripCards.map((card, index) => {
                const isFirst = index === 0;
                const isLast = index === topStripCards.length - 1;
                return (
                  <div
                    key={index}
                    className="flex-1 min-w-[130px] flex flex-col items-center justify-center px-6 py-5"
                    style={{
                      background: '#1C273B',
                      borderTop: '0.8px solid #364153',
                      borderBottom: '0.8px solid #364153',
                      borderLeft: index > 0 ? '0.8px solid #364153' : undefined,
                      borderRight: index < topStripCards.length - 1 ? '0.8px solid #364153' : undefined,
                      borderTopLeftRadius: isFirst ? 14 : 0,
                      borderBottomLeftRadius: isFirst ? 14 : 0,
                      borderTopRightRadius: isLast ? 14 : 0,
                      borderBottomRightRadius: isLast ? 14 : 0,
                    }}
                  >
                    <div className="mb-1 text-[28px] font-bold leading-[34px]"
                      style={{ fontFamily: 'Inter', color: card.valueColor, whiteSpace: 'pre-line' }}>
                      {card.value}
                    </div>
                    <div className="uppercase text-[11px] tracking-[0.3px] text-center"
                      style={{ fontFamily: 'Inter', fontWeight: 400, lineHeight: '16px', color: '#6A7282', whiteSpace: 'pre-line' }}>
                      {card.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 5 Summary Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {summaryCards.map((card) => (
              <div
                key={card.title}
                className="rounded-[14px] bg-white flex flex-col justify-between"
                style={{
                  borderTop: `4px solid ${card.accent}`,
                  boxShadow: '0px 10px 24px -16px rgba(15,23,42,0.35), 0px 1px 3px rgba(0,0,0,0.1)',
                  minHeight: 148,
                }}
              >
                <div className="px-5 pt-6 pb-5">
                  <div
                    className="mb-4 flex h-11 w-11 items-center justify-center rounded-[12px] text-[22px]"
                    style={{ background: `${card.accent}18`, border: `1px solid ${card.accent}2E` }}
                  >
                    {card.icon}
                  </div>
                  <div className="mb-2 text-[32px] leading-[38px] font-bold" style={{ fontFamily: 'Inter', color: '#101828' }}>
                    {card.value}
                  </div>
                  <div className="uppercase text-[11px] tracking-[0.6px] mb-1" style={{ fontFamily: 'Inter', fontWeight: 600, color: '#6A7282' }}>
                    {card.title}
                  </div>
                  <p className="text-[11px]" style={{ fontFamily: 'Inter', fontWeight: 400, color: '#6A7282' }}>
                    {card.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Row 1: MCQ Trend + Subject Accuracy ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/* MCQ Performance Trend */}
            <div className="rounded-[18px] bg-white" style={{ boxShadow: '0px 14px 34px -22px rgba(15,23,42,0.4), 0px 1px 3px rgba(0,0,0,0.1)' }}>
              <div className="px-8 pt-8 pb-6">
                <h2 className="text-[18px] leading-[26px] font-bold mb-6 flex items-center gap-2" style={{ fontFamily: 'Inter', color: '#1A1F36' }}>
                  <span aria-hidden>📊</span> MCQ Performance Trend
                </h2>

                <div className="flex flex-wrap gap-5 mb-6">
                  {[
                    { label: 'Correct', value: mcqCorrect, color: '#101828' },
                    { label: 'Wrong', value: mcqWrong, color: '#FB2C36' },
                    { label: 'Skipped', value: mcqSkipped, color: '#D1D5DC' },
                    { label: 'Net Accuracy', value: `${avgAccuracy}%`, color: '#FF6900' },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="text-[28px] leading-[34px] font-bold" style={{ fontFamily: 'Inter', color: item.color }}>
                        {typeof item.value === 'number' ? item.value.toLocaleString('en-IN') : item.value}
                      </div>
                      <div className="uppercase text-[11px] tracking-[0.6px]" style={{ fontFamily: 'Inter', fontWeight: 600, color: '#99A1AF' }}>
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Weekly line chart */}
                <div className="rounded-[14px] overflow-hidden bg-[#F8F5FF] px-4 pt-4 pb-2 mb-5" style={{ border: '1px solid #E9D5FF' }}>
                  <div className="text-[11px] uppercase tracking-[0.6px] mb-2" style={{ color: '#6A7282', fontFamily: 'Inter' }}>
                    Weekly Accuracy Trend
                  </div>
                  <LineChart data={weeklyChartData} color="#A855F7" height={140} />
                </div>

                {/* Daily bar chart */}
                <div>
                  <div className="text-[11px] uppercase tracking-[0.6px] mb-3" style={{ color: '#6A7282', fontFamily: 'Inter' }}>
                    Questions attempted this week
                  </div>
                  <div className="flex items-end gap-2 h-[92px] rounded-[12px] bg-[#F9FAFB] px-4 pt-4 pb-2">
                    {dailyActivity.map((d, i) => {
                      const pct = (d.questionsAttempted / maxQuestions) * 100;
                      return (
                        <div key={d.day} className="flex flex-col items-center flex-1 gap-1">
                          <div className="text-[10px] text-[#6A7282]" style={{ fontFamily: 'Inter' }}>
                            {d.questionsAttempted || ''}
                          </div>
                          <div
                            className="w-full rounded-t-[4px]"
                            style={{
                              height: Math.max(pct * 0.36, pct > 0 ? 4 : 0),
                              background: pct > 0 ? WEEK_BAR_COLORS[i % WEEK_BAR_COLORS.length] : '#E5E7EB',
                              minHeight: pct > 0 ? 4 : 2,
                            }}
                          />
                          <div className="text-[10px] text-[#6A7282]" style={{ fontFamily: 'Inter' }}>{d.day}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Subject Accuracy */}
            <div className="rounded-[18px] bg-white" style={{ boxShadow: '0px 14px 34px -22px rgba(15,23,42,0.4), 0px 1px 3px rgba(0,0,0,0.1)' }}>
              <div className="px-8 pt-8 pb-6">
                <h2 className="text-[18px] leading-[26px] font-bold mb-1 flex items-center gap-2" style={{ fontFamily: 'Inter', color: '#1A1F36' }}>
                  <span aria-hidden>🎯</span> Subject Accuracy
                </h2>
                <div className="mb-6 text-[12px] text-[#99A1AF]" style={{ fontFamily: 'Inter' }}>Across all attempted MCQs</div>

                {subjectAccuracy.length === 0 ? (
                  <div className="flex items-center justify-center h-[200px] text-[13px] text-[#6A7282]" style={{ fontFamily: 'Inter' }}>
                    No mock test data yet
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {subjectAccuracy.slice(0, 8).map((s, i) => (
                      <div key={s.subject}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: SUBJECT_COLORS[i % SUBJECT_COLORS.length] }} />
                            <span className="text-[13px] font-medium" style={{ fontFamily: 'Inter', color: '#1A1F36' }}>{s.subject}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[12px]" style={{ fontFamily: 'Inter' }}>
                            <span style={{ color: '#22C55E' }}>{s.correct}✓</span>
                            <span style={{ color: '#EF4444' }}>{s.wrong}✗</span>
                            <span className="font-semibold" style={{ color: SUBJECT_COLORS[i % SUBJECT_COLORS.length] }}>{s.accuracy}%</span>
                          </div>
                        </div>
                        <div className="w-full rounded-full" style={{ height: 6, background: '#F3F4F6' }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${s.accuracy}%`, background: SUBJECT_COLORS[i % SUBJECT_COLORS.length] }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Row 2: Mains Trend + Time Per Question ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/* Mains Answer Writing Trend */}
            <div className="rounded-[18px] bg-white" style={{ boxShadow: '0px 14px 34px -22px rgba(15,23,42,0.4), 0px 1px 3px rgba(0,0,0,0.1)' }}>
              <div className="px-8 pt-8 pb-6">
                <h2 className="text-[18px] leading-[26px] font-bold mb-1 flex items-center gap-2" style={{ fontFamily: 'Inter', color: '#1A1F36' }}>
                  <span aria-hidden>📝</span> Mains Answer Writing Trend
                </h2>
                <div className="mb-5 text-[12px] text-[#99A1AF]" style={{ fontFamily: 'Inter' }}>Answer scoring performance</div>

                <div className="flex flex-wrap gap-5 mb-5">
                  {[
                    { label: 'Answers Written', value: mainsStats.totalAnswers ?? 0, color: '#101828' },
                    { label: 'Avg Score', value: mainsStats.avgScore ?? 0, color: '#155DFC' },
                    { label: 'Latest Score', value: mainsStats.latestScore ?? 0, color: '#FF6900' },
                    {
                      label: 'Improvement',
                      value: mainsStats.improvement != null
                        ? `${mainsStats.improvement >= 0 ? '+' : ''}${mainsStats.improvement}`
                        : '—',
                      color: mainsStats.improvement > 0 ? '#22C55E' : mainsStats.improvement < 0 ? '#EF4444' : '#6A7282',
                    },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="text-[28px] leading-[34px] font-bold" style={{ fontFamily: 'Inter', color: item.color }}>
                        {item.value}
                      </div>
                      <div className="uppercase text-[11px] tracking-[0.6px]" style={{ fontFamily: 'Inter', fontWeight: 600, color: '#99A1AF' }}>
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-[14px] overflow-hidden bg-[#FFF7ED] px-4 pt-4 pb-2" style={{ border: '1px solid #FED7AA' }}>
                  <div className="text-[11px] uppercase tracking-[0.6px] mb-2" style={{ color: '#6A7282', fontFamily: 'Inter' }}>
                    Score progression
                  </div>
                  <LineChart data={mainsChartData} color="#FB923C" height={140} />
                </div>
              </div>
            </div>

            {/* Time Spent per Question — Daily */}
            <div className="rounded-[18px] bg-white" style={{ boxShadow: '0px 14px 34px -22px rgba(15,23,42,0.4), 0px 1px 3px rgba(0,0,0,0.1)' }}>
              <div className="px-8 pt-8 pb-6">
                <h2 className="text-[18px] leading-[26px] font-bold mb-1 flex items-center gap-2" style={{ fontFamily: 'Inter', color: '#1A1F36' }}>
                  <span aria-hidden>⏱️</span> Time Spent per Question - Daily
                </h2>
                <div className="mb-5 text-[12px] text-[#99A1AF]" style={{ fontFamily: 'Inter' }}>Average seconds per question</div>

                <div className="grid grid-cols-7 gap-2 mb-6">
                  {timePerQuestion.map((d) => (
                    <div key={d.day} className="flex flex-col items-center gap-2">
                      <div
                        className="w-full rounded-[8px] flex items-center justify-center py-3 text-center"
                        style={{ background: d.avgSeconds > 0 ? timeColor(d.avgSeconds) + '22' : '#F3F4F6' }}
                      >
                        <span className="text-[11px] font-semibold leading-tight" style={{ fontFamily: 'Inter', color: timeColor(d.avgSeconds) }}>
                          {d.avgSeconds > 0 ? formatSeconds(d.avgSeconds) : '—'}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#6A7282]" style={{ fontFamily: 'Inter' }}>{d.day}</span>
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex gap-4 mb-5">
                  {[['#22C55E', '< 90s'], ['#F59E0B', '90–120s'], ['#EF4444', '> 120s']].map(([c, l]) => (
                    <div key={l} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                      <span className="text-[11px] text-[#6A7282]" style={{ fontFamily: 'Inter' }}>{l}</span>
                    </div>
                  ))}
                </div>

                {/* Slowest / Fastest subjects */}
                {subjectAccuracy.length >= 2 && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[10px] px-4 py-3" style={{ background: '#FEF2F2' }}>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.5px] mb-1" style={{ color: '#EF4444', fontFamily: 'Inter' }}>Lowest Accuracy</div>
                      <div className="text-[13px] font-semibold" style={{ fontFamily: 'Inter', color: '#1A1F36' }}>
                        {subjectAccuracy.at(-1)?.subject ?? '—'}
                      </div>
                      <div className="text-[12px]" style={{ color: '#EF4444', fontFamily: 'Inter' }}>
                        {subjectAccuracy.at(-1)?.accuracy ?? 0}%
                      </div>
                    </div>
                    <div className="rounded-[10px] px-4 py-3" style={{ background: '#F0FDF4' }}>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.5px] mb-1" style={{ color: '#22C55E', fontFamily: 'Inter' }}>Highest Accuracy</div>
                      <div className="text-[13px] font-semibold" style={{ fontFamily: 'Inter', color: '#1A1F36' }}>
                        {subjectAccuracy[0]?.subject ?? '—'}
                      </div>
                      <div className="text-[12px]" style={{ color: '#22C55E', fontFamily: 'Inter' }}>
                        {subjectAccuracy[0]?.accuracy ?? 0}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Complete Test History ── */}
          <div className="rounded-[14px] bg-white mb-8" style={{ boxShadow: '0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px rgba(0,0,0,0.1)' }}>
            <div className="px-8 pt-8 pb-2">
              <h2 className="text-[18px] leading-[26px] font-bold mb-6" style={{ fontFamily: 'Inter', color: '#1A1F36' }}>
                Complete Test History
              </h2>
            </div>

            {testHistory.length === 0 ? (
              <div className="px-8 pb-10 text-center">
                <p className="text-[14px] text-[#6A7282]" style={{ fontFamily: 'Inter' }}>No tests attempted yet</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                        {['#', 'Test Name', 'Series', 'Date', 'Score', 'Accuracy', 'Rank', 'Report'].map(h => (
                          <th
                            key={h}
                            className="px-6 py-3 text-left text-[11px] uppercase tracking-[0.6px]"
                            style={{ fontFamily: 'Inter', fontWeight: 600, color: '#99A1AF' }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {testHistory.map((row, i) => (
                        <tr
                          key={row.id}
                          style={{ borderBottom: i < testHistory.length - 1 ? '1px solid #F9FAFB' : undefined }}
                          className="hover:bg-[#FAFAFA] transition-colors"
                        >
                          <td className="px-6 py-4 text-[13px]" style={{ fontFamily: 'Inter', color: '#6A7282' }}>{i + 1}</td>
                          <td className="px-6 py-4">
                            <div className="text-[13px] font-semibold" style={{ fontFamily: 'Inter', color: '#1A1F36' }}>{row.name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                              style={{ background: '#EFF6FF', color: '#155DFC', fontFamily: 'Inter' }}
                            >
                              {row.series}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[13px]" style={{ fontFamily: 'Inter', color: '#6A7282' }}>{row.date}</td>
                          <td className="px-6 py-4 text-[13px] font-semibold" style={{ fontFamily: 'Inter', color: '#1A1F36' }}>{row.score}</td>
                          <td className="px-6 py-4">
                            <span className="text-[13px] font-semibold" style={{ fontFamily: 'Inter', color: row.accuracy >= 70 ? '#22C55E' : row.accuracy >= 50 ? '#F59E0B' : '#EF4444' }}>
                              {row.accuracy}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[13px]" style={{ fontFamily: 'Inter', color: '#6A7282' }}>{row.rank ?? 'N/A'}</td>
                          <td className="px-6 py-4">
                            <button
                              type="button"
                              onClick={() => setSelectedReport(row)}
                              className="text-[13px] font-medium hover:underline"
                              style={{ fontFamily: 'Inter', color: '#155DFC' }}
                            >
                              View report →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-8 py-4 border-t border-[#F3F4F6]">
                  <p className="text-[12px]" style={{ fontFamily: 'Inter', color: '#99A1AF' }}>
                    Showing {testHistory.length} of {totalTests} tests
                  </p>
                </div>
              </>
            )}
          </div>

        </div>
      </div>

      {selectedReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.55)' }}
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="w-full max-w-[840px] rounded-[24px] bg-white p-7"
            style={{ boxShadow: '0 25px 60px rgba(15,23,42,0.28)' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 inline-flex rounded-full bg-[#ECFDF5] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#047857]">
                  Detailed Test Report
                </div>
                <h2 className="m-0 text-[26px] font-bold text-[#101828]" style={{ fontFamily: 'Inter' }}>
                  {selectedReport.name || 'Test Report'}
                </h2>
                <p className="mt-1 text-[13px] text-[#6A7282]" style={{ fontFamily: 'Inter' }}>
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
                  <div className="text-[24px] font-bold capitalize" style={{ fontFamily: 'Inter', color: item.color }}>
                    {item.value}
                  </div>
                  <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6A7282]" style={{ fontFamily: 'Inter' }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[16px] border border-[#E5E7EB] p-5">
                <h3 className="mb-3 text-[15px] font-bold text-[#101828]" style={{ fontFamily: 'Inter' }}>Performance Summary</h3>
                <p className="text-[13px] leading-[22px] text-[#4A5565]" style={{ fontFamily: 'Inter' }}>
                  This report summarizes the selected attempt without redirecting away from analytics. Use it to review score,
                  accuracy, rank and test context before opening the original module for a deeper question-by-question review.
                </p>
              </div>
              <div className="rounded-[16px] border border-[#E5E7EB] p-5">
                <h3 className="mb-3 text-[15px] font-bold text-[#101828]" style={{ fontFamily: 'Inter' }}>Next Actions</h3>
                <ul className="m-0 list-none space-y-2 p-0 text-[13px] text-[#4A5565]" style={{ fontFamily: 'Inter' }}>
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
