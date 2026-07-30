'use client';

import { useState, useEffect, useMemo } from 'react';
import DashboardPageHero from '@/components/DashboardPageHero';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { leaderboardService } from '@/lib/services';
import LeaderboardRankingCard from '@/components/LeaderboardRankingCard';
import HowRankingsWorkModal from '@/components/HowRankingsWorkModal';

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

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('overall');
  const [range, setRange] = useState<Range>('week');
  const [showRangeMenu, setShowRangeMenu] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [myRank, setMyRank] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRankingsModal, setShowRankingsModal] = useState(false);

  const rangeLabel =
    range === 'all' ? '🏆 All Time' : range === 'week' ? '📅 This Week' : '📅 This Month';

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const rangeParam = params.get('range');
    if (tabParam === 'overall' || tabParam === 'mcq' || tabParam === 'mains') {
      setTab(tabParam);
    }
    if (rangeParam === 'all' || rangeParam === 'week' || rangeParam === 'month') {
      setRange(rangeParam);
    }
  }, []);

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
        if (!cancelled) {
          setLeaderboard([]);
        }
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
    leaderboardService
      .getMyRank(range)
      .then((res) => {
        if (!cancelled && res.data) {
          setMyRank(res.data);
        }
      })
      .catch(() => {
        if (!cancelled) setMyRank(null);
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  const rankingRows = useMemo(() => {
    return leaderboard.slice(0, 10).map((item) => ({
      rank: item.rank,
      userId: item.userId,
      name: item.name,
      value: tab === 'mains' ? item.mainsAvg : tab === 'mcq' ? item.mcqAvg : item.totalScore,
    }));
  }, [leaderboard, tab]);

  const myInitial = useMemo(() => {
    if (myRank?.name) return myRank.name[0].toUpperCase();
    if (user?.firstName) return user.firstName[0].toUpperCase();
    return 'Y';
  }, [myRank, user]);

  const myAvatarBg = avatarColorByInitial[myInitial] || '#7B61FF';

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-arimo">
      <DashboardPageHero
        // eslint-disable-next-line @next/next/no-img-element
        badgeIcon={<img src="/icons/trophy.png" alt="trophy" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />}
        badgeText="COMMUNITY RANKINGS"
        title={
          <>
            Rise Through the{' '}
            <em className="not-italic" style={{ color: '#E8B84B', fontStyle: 'italic' }}>
              Ranks
            </em>
          </>
        }
        subtitle="Compete, improve, and see where you stand among UPSC aspirants preparing with RiseWithJeet."
      />

      <main className="mx-auto max-w-[1060px] px-4 pb-0">
        {/* Your Rank Card */}
        <section className="relative mx-auto mb-4 max-w-[964px] overflow-hidden rounded-[14px] border border-[#D7DEE9] bg-[linear-gradient(90deg,#0C1424_0%,#1B2C59_100%)] px-[22px] py-[18px] text-white shadow-[0_8px_22px_rgba(12,20,36,0.18)]" style={{ marginTop: '16px' }}>
          <div className="absolute -right-16 -top-16 h-[220px] w-[220px] rounded-full bg-[#E8B84B]/8 blur-3xl" />
          <div className="relative flex flex-wrap items-center gap-5">
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="" className="h-[46px] w-[46px] rounded-full object-cover" />
            ) : (
              <div className="flex h-[46px] w-[46px] items-center justify-center rounded-full text-[20px] font-bold text-white" style={{ background: myAvatarBg }}>
                {myInitial}
              </div>
            )}

            <div className="min-w-[250px] flex-1">
              <p className="text-[15px] font-bold text-white" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                {myRank?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'You'}
                {user?.email && <span className="ml-1 text-[11px] font-normal text-white/40">· {user.email}</span>}
              </p>
              <p className="mt-[2px] text-[12px] text-white/45" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                {!myRank ? 'Loading stats…' : myRank.isOverallRankEligible === false ? 'Complete an MCQ and a Mains challenge to unlock your overall rank' : 'Keep pushing – every point counts'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4 sm:gap-7">
              {[
                [`#${myRank?.rank ?? '-'}`, 'Overall Rank'],
                [`#${myRank?.mcqRank ?? '-'}`, 'Daily MCQ'],
                [`#${myRank?.mainsRank ?? '-'}`, 'Mains Challenge'],
                [`${myRank?.streak ?? 0}🔥`, 'Day Streak'],
              ].map(([value, label]) => (
                <div key={label}>
                  <div className="text-[24px] font-bold leading-none text-[#E8B84B]" style={{ fontFamily: 'var(--font-cormorant)' }}>{value}</div>
                  <div className="mt-[4px] text-[10px] uppercase tracking-[0.8px] text-white/38" style={{ fontFamily: 'var(--font-dm-sans)' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tabs & Range */}
        <section className="mx-auto mb-1 flex max-w-[964px] flex-wrap items-center justify-between gap-4" style={{ marginTop: '16px' }}>
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

        {/* Leaderboard Content - same ranking-card design as the Daily Mains Challenge's "Mains League" widget */}
        <section className="mx-auto max-w-[964px] mb-8">
          <LeaderboardRankingCard
            icon={tab === 'mains' ? '✍️' : tab === 'mcq' ? '🎯' : '🏆'}
            title={tab === 'mains' ? 'Mains League' : tab === 'mcq' ? 'Daily MCQ League' : 'Overall Leaderboard'}
            rows={rankingRows}
            you={{
              rank: myRank?.rank ?? '-',
              name: myRank?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'You',
            }}
            valueFormatter={(value) => value.toFixed(2)}
            loading={loading}
          />

          {!loading && leaderboard.length > 0 ? (
            <div className="py-5 text-center">
              <button
                onClick={() => setShowRankingsModal(true)}
                className="rounded-[10px] border border-[rgba(11,22,40,0.17)] bg-[#FAF8F4] px-[23px] py-[10px] text-[13px] font-semibold text-[#374560]"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                How Rankings Work
              </button>
            </div>
          ) : null}
        </section>

        <HowRankingsWorkModal isOpen={showRankingsModal} onClose={() => setShowRankingsModal(false)} />

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
                Start Today{'\''}s MCQ →
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
