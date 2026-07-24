'use client';

import Link from 'next/link';

const RANK_BG = [
  'linear-gradient(135deg,#F5B800,#E5A300)',
  'linear-gradient(135deg,#A8A9AD,#7F8284)',
  'linear-gradient(135deg,#CD7F32,#B06C2A)',
];

export interface LeaderboardRankingRow {
  rank: number;
  userId: string;
  name: string;
  value: number;
}

export interface LeaderboardYouRow {
  rank: number | string;
  name: string;
}

/**
 * Ranking card used by the Daily Mains Challenge "Mains League" widget.
 * Shared so every leaderboard surface renders identical rows/typography
 * instead of each page hand-rolling its own ranking list.
 */
export default function LeaderboardRankingCard({
  icon,
  title,
  viewAllHref,
  rows,
  you,
  valueFormatter = (value) => String(Math.round(value * 10) / 10),
  loading = false,
  emptyMessage = 'No data yet. Start practicing to appear on the leaderboard!',
}: {
  icon: string;
  title: string;
  viewAllHref?: string;
  rows: LeaderboardRankingRow[];
  you?: LeaderboardYouRow | null;
  valueFormatter?: (value: number) => string;
  loading?: boolean;
  emptyMessage?: string;
}) {
  return (
    <div className="bg-white rounded-[24px]" style={{ padding: '24px', boxShadow: '0 1px 2px rgba(15,23,42,.04), 0 8px 24px rgba(15,23,42,.06), inset 0 0 0 1px #E6E8EE' }}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '20px' }}>{icon}</span>
          <h3 className="font-bold" style={{ fontSize: '16px', background: 'linear-gradient(135deg,#F5B800,#E5A300)', padding: '2px 10px', borderRadius: '8px', color: '#0B1020' }}>{title}</h3>
        </div>
        {viewAllHref ? (
          <Link href={viewAllHref} className="hover:underline" style={{ fontSize: '14px', fontWeight: 600, color: '#0B1020' }}>View All →</Link>
        ) : null}
      </div>

      {loading ? (
        <div className="py-10 text-center" style={{ fontSize: '13px', color: '#9AA3B8' }}>Loading leaderboard…</div>
      ) : rows.length === 0 ? (
        <div className="py-10 text-center" style={{ fontSize: '13px', color: '#9AA3B8' }}>{emptyMessage}</div>
      ) : (
        <div className="flex flex-col">
          {rows.map((row, i) => {
            const isMedal = i < 3;
            return (
              <div
                key={row.userId}
                className="flex min-w-0 items-center gap-3"
                style={{ padding: '10px 0', borderBottom: '1px solid #E6E8EE' }}
              >
                <div
                  className="flex items-center justify-center font-bold flex-shrink-0"
                  style={{
                    width: '30px', height: '30px', borderRadius: '50%', fontSize: '12px',
                    background: isMedal ? RANK_BG[i] : '#F1F3F5',
                    color: isMedal ? '#fff' : '#6B7280',
                    boxShadow: i === 0 ? '0 2px 8px rgba(245,184,0,0.3)' : i < 3 ? '0 2px 6px rgba(127,130,132,0.22)' : 'none',
                  }}
                >
                  {row.rank}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-semibold text-[#0B1020] truncate" style={{ fontSize: '13px' }}>{row.name}</div>
                  <div style={{ fontSize: '10.5px', color: '#6B7280' }}>Rank #{row.rank}</div>
                </div>
                <div className="font-bold text-[#0B1020]" style={{ fontSize: '13px' }}>{valueFormatter(row.value)}</div>
              </div>
            );
          })}

          {you ? (
            <div
              className="flex min-w-0 items-center gap-3 rounded-[12px] mt-4"
              style={{ background: '#F5F6F8', padding: '12px' }}
            >
              <div className="flex items-center justify-center font-bold flex-shrink-0" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0B1020', color: '#F5B800', fontSize: '13px' }}>
                {you.rank}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="font-semibold text-[#0B1020] truncate" style={{ fontSize: '14px' }}>You · {you.name}</div>
                <div style={{ fontSize: '11px', color: '#6B7280' }}>Rank #{you.rank}</div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
