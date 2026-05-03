'use client';

import { useState, useEffect, useMemo } from 'react';
import DashboardPageHero from '@/components/DashboardPageHero';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { leaderboardService } from '@/lib/services';

type Tab = 'overall' | 'mcq' | 'mains';
type Range = 'all' | 'week' | 'month';

interface LeaderboardUser {
  rank: number;
  userId: string;
  name: string;
  initial: string;
  avatarUrl: string | null;
  totalScore: number;
  mcqAvg: number;
  mockAvg: number;
  mainsAvg: number;
  streak: number;
  studyHours: number;
  accuracy: number;
  handle: string;
}

const avatarColorByInitial: Record<string, string> = {
  S: '#D98A0A',
  A: '#EF4444',
  K: '#D946A6',
  V: '#0F9D90',
  M: '#7C4DFF',
  R: '#F97316',
  D: '#1D9BF0',
  N: '#10B981',
};

function getInitial(name: string) {
  return name?.[0]?.toUpperCase() || '?';
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('overall');
  const [range, setRange] = useState<Range>('all');
  const [showRangeMenu, setShowRangeMenu] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [myRank, setMyRank] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [myRankLoading, setMyRankLoading] = useState(true);

  const rangeLabel =
    range === 'all' ? '🏆 All Time' : range === 'week' ? '📅 This Week' : '📅 This Month';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    leaderboardService
      .getLeaderboard(tab, range)
      .then((res) => {
        if (!cancelled && res.data) {
          setLeaderboard(res.data as LeaderboardUser[]);
        }
      })
      .catch(() => {
        if (!cancelled) setLeaderboard([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, range]);

  useEffect(() => {
    let cancelled = false;
    setMyRankLoading(true);
    leaderboardService
      .getMyRank(range)
      .then((res) => {
        if (!cancelled && res.data) {
          setMyRank(res.data);
        }
      })
      .catch(() => {
        if (!cancelled) setMyRank(null);
      })
      .finally(() => {
        if (!cancelled) setMyRankLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  const podium = useMemo(() => {
    const top3 = leaderboard.slice(0, 3);
    const ordered = [top3[1], top3[0], top3[2]].filter(Boolean);
    return ordered.map((item, idx) => {
      const place = idx === 1 ? 1 : idx === 0 ? 2 : 3;
      const medal = place === 1 ? '🥇' : place === 2 ? '🥈' : '🥉';
      const winner = place === 1;
      return {
        place: place as 1 | 2 | 3,
        medal,
        initial: item.initial || getInitial(item.name),
        name: item.name,
        city: '',
        points: String(Math.round(item.totalScore)),
        accuracy: `${item.accuracy}%`,
        winner,
      };
    });
  }, [leaderboard]);

  const rows = useMemo(() => {
    return leaderboard.slice(3).map((item) => ({
      rank: String(item.rank),
      initial: item.initial || getInitial(item.name),
      name: item.name,
      handle: item.handle || '',
      city: '',
      score: String(Math.round(item.totalScore)),
      accuracy: item.accuracy,
      streak: String(item.streak),
      hours: `${Math.round(item.studyHours)}h`,
    }));
  }, [leaderboard]);

  const myInitial = useMemo(() => {
    if (myRank?.name) return getInitial(myRank.name);
    if (user?.firstName) return getInitial(user.firstName);
    return 'Y';
  }, [myRank, user]);

  const myAvatarBg = useMemo(() => {
    return avatarColorByInitial[myInitial] || '#7B61FF';
  }, [myInitial]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-arimo">
      <DashboardPageHero
        badgeIcon={<img src="/cap.png" alt="cap" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />}
        badgeText="COMMUNITY RANKINGS"
        title={
          <>
            Rise through the{' '}
            <em className="not-italic" style={{ color: '#e8a820', fontStyle: 'italic' }}>
              ranks
            </em>
          </>
        }
        subtitle="Compete, improve, and see where you stand among 15,000+ UPSC aspirants preparing with RiseWithJeet."
        stats={[
          { value: '15K+', label: 'Aspirants', color: '#FDC700' },
          { value: '50K+', label: 'Tests Taken', color: '#F87171' },
          { value: '547', label: 'Active Right Now', color: '#4ADE80' },
          { value: '∞', label: 'Always Free', color: '#FFFFFF' },
        ]}
      />

      <main className="mx-auto -mt-4 max-w-[1060px] px-4 pb-0">
        {/* Your Rank Card */}
        <section className="relative mx-auto mb-4 max-w-[964px] overflow-hidden rounded-[14px] border border-[#D7DEE9] bg-[linear-gradient(90deg,#0C1424_0%,#1B2C59_100%)] px-[22px] py-[18px] text-white shadow-[0_8px_22px_rgba(12,20,36,0.18)]">
          <div className="absolute -right-16 -top-16 h-[220px] w-[220px] rounded-full bg-[#E8B84B]/8 blur-3xl" />
          <div className="relative flex flex-wrap items-center gap-5">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="h-[46px] w-[46px] rounded-full object-cover"
              />
            ) : (
              <div
                className="flex h-[46px] w-[46px] items-center justify-center rounded-full text-[20px] font-bold text-white"
                style={{ background: myAvatarBg }}
              >
                {myInitial}
              </div>
            )}

            <div className="min-w-[250px] flex-1">
              <p className="text-[15px] font-bold text-white" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                {myRank?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'You'}
                {user?.email && (
                  <span className="ml-1 text-[11px] font-normal text-white/40">· {user.email}</span>
                )}
              </p>
              <p className="mt-[2px] text-[12px] text-white/45" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                {myRankLoading ? 'Loading stats…' : 'Keep pushing — every point counts'}
              </p>
            </div>

            <div className="grid grid-cols-4 gap-7 text-center">
              {[
                [`#${myRank?.rank ?? '-'}`, 'Overall Rank'],
                [`#${myRank?.mcqRank ?? '-'}`, 'Daily MCQ'],
                [`#${myRank?.mainsRank ?? '-'}`, 'Mains Challenge'],
                [`${myRank?.streak ?? 0}🔥`, 'Day Streak'],
              ].map(([value, label]) => (
                <div key={label}>
                  <div
                    className="text-[24px] font-bold leading-none text-[#E8B84B]"
                    style={{ fontFamily: 'var(--font-cormorant)' }}
                  >
                    {value}
                  </div>
                  <div
                    className="mt-[4px] text-[10px] uppercase tracking-[0.8px] text-white/38"
                    style={{ fontFamily: 'var(--font-dm-sans)' }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>

            <div
              className="rounded-[9px] bg-[#E8B84B] px-5 py-[9px] text-[13px] font-bold text-[#0C1424]"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              Your Rank
            </div>
          </div>
        </section>

        {/* Tabs & Range */}
        <section className="mx-auto mb-1 flex max-w-[964px] flex-wrap items-center justify-between gap-4">
          <div className="rounded-[10px] border border-[rgba(0,0,0,0.07)] bg-white p-[4px]">
            <button
              onClick={() => setTab('overall')}
              className={`mr-[4px] inline-flex items-center gap-[7px] rounded-[9px] px-[22px] py-[9px] text-[13px] ${
                tab === 'overall'
                  ? 'bg-[#0D1B2E] text-white shadow-[0_2px_7px_rgba(11,22,40,0.07)]'
                  : 'border border-[rgba(0,0,0,0.07)] text-[#0D1B2E]'
              }`}
              style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: tab === 'overall' ? 700 : 600 }}
            >
              <span className={tab === 'overall' ? '' : 'opacity-50'}>🏆</span>
              Overall
            </button>
            <button
              onClick={() => setTab('mcq')}
              className={`mr-[4px] inline-flex items-center gap-[7px] rounded-[9px] border border-[rgba(0,0,0,0.07)] px-[22px] py-[9px] text-[13px] ${
                tab === 'mcq' ? 'bg-[#0D1B2E] text-white' : 'text-[#0D1B2E]'
              }`}
              style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 600 }}
            >
              <span className={tab === 'mcq' ? '' : 'opacity-50'}>🎯</span>
              Daily MCQ
            </button>
            <button
              onClick={() => setTab('mains')}
              className={`inline-flex items-center gap-[7px] rounded-[9px] border border-[rgba(0,0,0,0.07)] px-[22px] py-[9px] text-[13px] ${
                tab === 'mains' ? 'bg-[#0D1B2E] text-white' : 'text-[#0D1B2E]'
              }`}
              style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 600 }}
            >
              <span className={tab === 'mains' ? '' : 'opacity-50'}>✍️</span>
              Mains Challenge
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowRangeMenu((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-[9px] border border-[#DFE4ED] bg-white px-4 py-2 text-[12px] font-semibold text-[#6B7A99]"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              {rangeLabel}
              <span className="text-[11px]">▾</span>
            </button>

            {showRangeMenu && (
              <div className="absolute right-0 z-20 mt-1 w-[114px] rounded-[10px] border border-[#D8DEE9] bg-[#F5F8FF] p-[4px] shadow-[0_10px_20px_rgba(15,23,42,0.1)]">
                {[
                  { key: 'week', label: '📅 This Week' },
                  { key: 'month', label: '📅 This Month' },
                  { key: 'all', label: '🏆 All Time' },
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => {
                      setRange(option.key as Range);
                      setShowRangeMenu(false);
                    }}
                    className={`block w-full rounded-[8px] px-2 py-2 text-left text-[12px] font-semibold ${
                      range === option.key ? 'bg-[#DDE7FB] text-[#2E4A84]' : 'text-[#6B7A99] hover:bg-white'
                    }`}
                    style={{ fontFamily: 'var(--font-dm-sans)' }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="mx-auto mb-14 max-w-[964px] text-left text-[12px] text-[#9AA3B8]" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Updates every 30 min
        </div>

        {/* Leaderboard Content */}
        <section className="mx-auto max-w-[964px]">
          {loading ? (
            <div className="py-20 text-center text-[14px] text-[#9AA3B8]">Loading leaderboard…</div>
          ) : leaderboard.length === 0 ? (
            <div className="py-20 text-center text-[14px] text-[#9AA3B8]">No data yet. Start practicing to appear on the leaderboard!</div>
          ) : (
            <>
              {/* Podium */}
              <div className="mb-8 grid grid-cols-1 items-end justify-center gap-4 md:grid-cols-[175px_230px_175px]">
                {podium.map((item) => (
                  <article
                    key={item.place}
                    className={`relative overflow-visible rounded-[16px] border text-center ${
                      item.winner
                        ? 'min-h-[309px] border-[rgba(232,184,75,0.3)] bg-[linear-gradient(160deg,#FFFDF7_0%,#FFF9ED_100%)] pt-[39px]'
                        : 'min-h-[284px] border-[rgba(11,22,40,0.09)] bg-white pt-[28px]'
                    }`}
                  >
                    {item.winner && (
                      <>
                        <div className="absolute left-0 right-0 top-0 h-[3px] rounded-tl-[16px] rounded-tr-[16px] bg-gradient-to-r from-[#C99730] via-[#E8B84B] to-[#F5CE72]" />
                        <div className="absolute left-1/2 top-[-15px] -translate-x-1/2 text-[24px] leading-none">👑</div>
                      </>
                    )}

                    <div
                      className={`mx-auto mb-3 text-center leading-none ${item.winner ? 'text-[30px] text-[#C99730]' : item.place === 2 ? 'text-[25px] text-[#94A3B8]' : 'text-[22px] text-[#B87C4B]'}`}
                      aria-hidden
                    >
                      {item.medal}
                    </div>

                    <div
                      className={`mx-auto mb-4 flex items-center justify-center rounded-full font-extrabold text-white ${item.winner ? 'h-[72px] w-[72px]' : 'h-[60px] w-[60px]'}`}
                      style={{
                        border: item.winner ? '3px solid #E8B84B' : '2px solid #94A3B8',
                        background: item.winner
                          ? 'linear-gradient(135deg,#6F63F6,#7C5CF9)'
                          : item.place === 2
                            ? 'linear-gradient(135deg,#2DA2FF,#1F7AE0)'
                            : 'linear-gradient(135deg,#16B68B,#0E9A78)',
                        fontFamily: 'var(--font-dm-sans)',
                        fontSize: item.winner ? '26px' : '22px',
                        lineHeight: item.winner ? '41.6px' : '35.2px',
                      }}
                    >
                      {item.initial}
                    </div>

                    <h3 className="text-[14px] font-bold leading-[22.4px] text-[#0C1424]" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      {item.name}
                    </h3>

                    <p className="mt-[2px] text-[11px] leading-[17.6px] text-[#9AA3B8]" style={{ fontFamily: 'var(--font-dm-sans)' }}>{item.city}</p>

                    <div className={`mt-4 font-bold leading-none ${item.winner ? 'text-[28.8px] text-[#C99730]' : 'text-[24px] text-[#0C1424]'}`} style={{ fontFamily: 'var(--font-cormorant)' }}>
                      {item.points}
                    </div>
                    <p className="mt-[1px] text-[10px] tracking-[0.5px] text-[#9AA3B8]" style={{ fontFamily: 'var(--font-dm-sans)' }}>Total Points</p>

                    <div className="mx-auto mt-[10px] inline-flex rounded-[20px] border border-[rgba(29,164,92,0.25)] bg-[rgba(29,164,92,0.1)] px-[11px] py-[4px] text-[10px] font-bold leading-[16px] text-[#1DA45C]" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      ✓ {item.accuracy} accuracy
                    </div>
                  </article>
                ))}
              </div>

              {/* Table */}
              <div className="mx-auto mb-8 max-w-[964px] overflow-hidden rounded-[14px] border border-[rgba(11,22,40,0.09)] bg-white shadow-[0_2px_14px_rgba(11,22,40,0.07)]">
                <div className="grid grid-cols-[70px_1fr_120px_100px_85px_100px] border-b border-[rgba(143,164,190,0.43)] px-5 py-[11px] text-[10px] font-bold uppercase tracking-[1px] text-[#9AA3B8]" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  <span>Rank</span>
                  <span>Aspirant</span>
                  <span className="text-center">Total Score</span>
                  <span className="text-center">Accuracy</span>
                  <span className="text-center">Streak</span>
                  <span className="text-center">Total Hours</span>
                </div>

                {rows.map((row) => {
                  const pillClass =
                    row.accuracy >= 80
                      ? 'border-[#B7E5C9] bg-[#EAF8EF] text-[#1DA45C]'
                      : 'border-[#ECD9B3] bg-[#FFF6E6] text-[#C99730]';
                  const avatarBg = avatarColorByInitial[row.initial] || '#3B82F6';

                  return (
                    <div key={`${row.rank}-${row.name}`} className="grid h-[66px] grid-cols-[70px_1fr_120px_100px_85px_100px] items-center border-b border-[rgba(11,22,40,0.09)] px-5 last:border-b-0">
                      <div className="text-center text-[14px] font-extrabold text-[#6B7A99]" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                        {row.rank}
                      </div>

                      <div className="flex items-center gap-3 pl-3">
                        <div className="flex h-[36px] w-[36px] items-center justify-center rounded-full text-[13px] font-extrabold text-white" style={{ background: avatarBg, fontFamily: 'var(--font-dm-sans)' }}>
                          {row.initial}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold leading-[1.1] text-[#0C1424]" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                            {row.name}
                          </p>
                          <p className="mt-[2px] truncate text-[11px] text-[#9AA3B8]" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                            {row.handle} · {row.city}
                          </p>
                        </div>
                      </div>

                      <div className="text-center text-[18.4px] font-bold leading-none text-[#0C1424]" style={{ fontFamily: 'var(--font-cormorant)' }}>
                        {row.score}
                      </div>

                      <div className="text-center">
                        <span className={`inline-flex rounded-[20px] border px-[10px] py-[4px] text-[11px] font-bold leading-none ${pillClass}`} style={{ fontFamily: 'var(--font-dm-sans)' }}>
                          {row.accuracy}%
                        </span>
                      </div>

                      <div className="flex items-center justify-center gap-1 text-[#374560]" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                        <span className="text-[13px] leading-none">🔥</span>
                        <span className="text-[12px] font-semibold leading-none">{row.streak}</span>
                      </div>

                      <div className="text-center text-[18.4px] font-bold leading-none text-[#0C1424]" style={{ fontFamily: 'var(--font-cormorant)' }}>
                        {row.hours}
                      </div>
                    </div>
                  );
                })}

                <div className="py-5 text-center">
                  <button
                    className="rounded-[10px] border border-[rgba(11,22,40,0.17)] bg-[#FAF8F4] px-[23px] py-[10px] text-[13px] font-semibold text-[#374560]"
                    style={{ fontFamily: 'var(--font-dm-sans)' }}
                  >
                    Show more aspirants ↓
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        <section className="relative left-1/2 right-1/2 mt-20 w-screen -translate-x-1/2 overflow-hidden bg-[#090E1C] px-4 pb-[72px] pt-[71px] text-white">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[-80px] h-[400px] w-[600px] -translate-x-1/2"
            style={{ background: 'radial-gradient(ellipse at center, rgba(232,184,75,0.08) 0%, rgba(232,184,75,0) 65%)' }}
          />

          <div className="relative mx-auto flex w-full max-w-[1060px] flex-col items-center gap-[10.9px] px-[48px]">
            <h2
              className="text-center text-[44.8px] font-semibold leading-[53.76px] text-white"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Ready to <em className="text-[#E8B84B]">climb higher?</em>
            </h2>

            <div
              className="w-full max-w-[440px] text-center text-[15px] font-normal leading-[27.75px] text-[rgba(255,255,255,0.44)]"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              <p>Practice daily MCQs, write Mains answers, and let AI-powered</p>
              <p>analytics guide you to the top.</p>
            </div>

            <div className="flex flex-wrap justify-center gap-x-3 gap-y-0 pt-[17px]">
              <Link
                href="/dashboard/daily-mcq"
                className="rounded-[10px] bg-[#E8B84B] px-[28px] pb-[14px] pt-[12px] text-center text-[14px] font-bold text-[#090E1C] shadow-[0px_4px_10px_rgba(232,184,75,0.28)]"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                Start Today's MCQ →
              </Link>
              <Link
                href="/dashboard/daily-answer"
                className="rounded-[10px] border border-[rgba(255,255,255,0.14)] px-[29px] py-[13px] text-center text-[14px] font-medium text-[rgba(255,255,255,0.68)]"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                Attempt Mains Challenge
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
