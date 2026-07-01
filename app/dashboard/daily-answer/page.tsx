'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { dailyAnswerService, dashboardService } from '@/lib/services';

interface AnswerData {
  id: string;
  title: string;
  paper: string;
  subject: string;
  marks: number;
  wordLimit: number;
  timeLimit: number;
  attempted: boolean;
  attemptCount: number;
}

// "26 Jun 2026" — matches the reference top strip.
function formatShortDate(d: Date) {
  const day = d.getDate();
  const month = d.toLocaleString('en-US', { month: 'short' });
  return `${day} ${month} ${d.getFullYear()}`;
}

export default function DailyMainsChallengePage() {
  const router = useRouter();
  const [data, setData] = useState<AnswerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streak, setStreak] = useState<number | null>(null);

  const destination = data?.attempted
    ? '/dashboard/daily-answer/challenge/attempt/results'
    : '/dashboard/daily-answer/challenge';

  const begin = () => router.push(destination);

  useEffect(() => {
    dailyAnswerService.getToday()
      .then(res => setData(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Current streak for the top strip (best-effort; the page still works without it).
  useEffect(() => {
    dashboardService.getStreak()
      .then(res => setStreak(Number(res.data?.currentStreak ?? 0)))
      .catch(() => setStreak(null));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col bg-[#F5F6F8] font-jakarta" style={{ height: '100%', overflow: 'hidden' }}>
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B1020]" />
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col bg-[#F5F6F8] font-jakarta" style={{ height: '100%', overflow: 'hidden' }}>
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-[#0B1020] mb-2">No Mains Challenge Today</h2>
            <p className="text-[#6B7280]">{error || "Check back later for today's challenge."}</p>
            <Link href="/dashboard" className="mt-4 inline-block text-[#3B82F6] hover:underline">Back to Dashboard</Link>
          </div>
        </main>
      </div>
    );
  }

  const aspirants = data.attemptCount > 0 ? data.attemptCount.toLocaleString('en-US') : '1,248';

  return (
    <div className="bg-[#F5F6F8] font-jakarta text-[#0B1020]" style={{ minHeight: '100%', overflowY: 'auto' }}>
      <style>{`
        @keyframes da-livePulse {
          0%   { box-shadow: 0 0 0 0 rgba(220,38,38,0.55); }
          70%  { box-shadow: 0 0 0 8px rgba(220,38,38,0); }
          100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
        }
        @keyframes da-screenIn {
          0%   { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .da-livedot { width:8px; height:8px; border-radius:50%; background:#DC2626; display:inline-block; animation:da-livePulse 1.6s ease infinite; }
        .da-screen  { animation: da-screenIn .4s ease; }
        .da-av { width:26px; height:26px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; color:#fff; border:2px solid #fff; }
        .da-chip { display:inline-flex; align-items:center; gap:5px; padding:5px 14px; border-radius:100px; font-size:12px; font-weight:600; letter-spacing:0.02em; white-space:nowrap; }
        .da-welcome-wrap { width:100%; max-width:420px; margin:0 auto; }
        .da-welcome-card { padding:30px 28px 28px !important; border-radius:28px !important; }
        .da-welcome-live-strip { padding:12px 15px !important; border-radius:18px !important; }
        .da-welcome-live-copy { min-width:0; flex:1; text-align:left; white-space:nowrap; font-size:12.5px !important; }
        .da-welcome-live-copy div:first-child { white-space:nowrap; }
        .da-btn-primary { background:#0B1020; color:#fff; border:none; border-radius:16px; font-weight:600; cursor:pointer; transition:.2s; font-family:var(--font-jakarta), sans-serif; display:inline-flex; align-items:center; justify-content:center; gap:8px; }
        .da-btn-primary:hover { background:#11172A; transform:translateY(-1px); box-shadow:0 2px 6px rgba(15,23,42,.06), 0 18px 50px rgba(15,23,42,.10); }
        @media (max-width:720px) {
          .da-welcome-wrap { max-width:92vw; }
          .da-welcome-live-copy { white-space:normal; }
        }
      `}</style>

      <main className="flex-1 flex items-center justify-center p-4" style={{ minHeight: 'calc(100vh - clamp(90px, 5.78vw, 111px))' }}>
        <div className="da-screen da-welcome-wrap">

          {/* Top strip */}
          <div className="flex items-center justify-between gap-2" style={{ marginBottom: '8px', padding: '0 4px' }}>
            <div
              className="flex items-center gap-2"
              style={{ padding: '6px 14px', borderRadius: '100px', background: '#FFFFFF', border: '1px solid #E6E8EE', boxShadow: '0 1px 2px rgba(15,23,42,.04), 0 8px 24px rgba(15,23,42,.06)' }}
            >
              <span className="da-livedot" />
              <span style={{ fontSize: '11px', fontWeight: 600 }}>Today&apos;s Challenge is live</span>
              <span style={{ fontSize: '11px', color: '#6B7280' }}>· {formatShortDate(new Date())}</span>
            </div>
            {streak !== null && streak > 0 && (
              <div
                className="flex items-center gap-1.5"
                style={{ padding: '6px 14px', borderRadius: '100px', background: 'linear-gradient(135deg,#FFF3D6,#FFE6B0)', border: '1px solid rgba(245,184,0,0.3)', boxShadow: '0 1px 2px rgba(15,23,42,.04), 0 8px 24px rgba(15,23,42,.06)' }}
              >
                <span style={{ fontSize: '12px' }}>🔥</span>
                <span style={{ fontSize: '11px', fontWeight: 700 }}>{streak}-day streak</span>
              </div>
            )}
          </div>

          {/* Main card */}
          <div
            className="da-welcome-card text-center"
            style={{ background: '#FFFFFF', borderRadius: '24px', padding: '20px 28px', boxShadow: '0 1px 2px rgba(15,23,42,.04), 0 8px 24px rgba(15,23,42,.06), inset 0 0 0 1px #E6E8EE', position: 'relative', overflow: 'hidden' }}
          >
            {/* Icon */}
            <div style={{ position: 'relative', width: '84px', height: '84px', margin: '0 auto 16px' }}>
              <div style={{ position: 'absolute', inset: '-10px', borderRadius: '50%', background: 'linear-gradient(135deg,rgba(245,184,0,0.20),rgba(99,102,241,0.15))', filter: 'blur(14px)' }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/pen-circle.png"
                alt="Daily Mains Challenge"
                style={{ position: 'relative', width: '84px', height: '84px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 8px 32px rgba(11,16,32,0.18),0 2px 8px rgba(11,16,32,0.08)', border: '4px solid #fff' }}
              />
            </div>

            <h1 style={{ fontFamily: 'var(--font-dm-serif), serif', fontSize: '25px', letterSpacing: '-0.02em', marginBottom: '6px', lineHeight: 1.15 }}>
              Daily Mains Challenge
            </h1>
            <p style={{ color: '#6B7280', fontSize: '13px', lineHeight: 1.45, maxWidth: '340px', margin: '0 auto' }}>
              Sharpen your answer writing with today&apos;s carefully crafted question — build structure, clarity, and depth, one day at a time.
            </p>

            {/* Chips */}
            <div className="flex justify-center flex-wrap" style={{ gap: '8px', marginTop: '16px' }}>
              <span className="da-chip" style={{ background: '#EEF0FF', color: '#4338CA' }}>{data.paper}</span>
              <span className="da-chip" style={{ background: '#E8F0FF', color: '#1d4ed8' }}>{data.subject}</span>
            </div>

            {/* Stat boxes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginTop: '16px' }}>
              {[
                { value: data.timeLimit, label: 'Minutes' },
                { value: data.marks, label: 'Marks' },
                { value: data.wordLimit, label: 'Word Limit' },
              ].map((s) => (
                <div key={s.label} style={{ borderRadius: '16px', padding: '15px 0', textAlign: 'center', background: '#F8F9FB', border: '1px solid #EDEEF2' }}>
                  <div style={{ fontSize: '23px', fontWeight: 800, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '5px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Live strip */}
            <div
              className="da-welcome-live-strip flex items-center justify-between"
              style={{ marginTop: '16px', gap: '12px', padding: '11px 14px', borderRadius: '16px', background: '#FFFFFF', border: '1px solid #E6E8EE', boxShadow: '0 1px 2px rgba(15,23,42,.04), 0 8px 24px rgba(15,23,42,.06)' }}
            >
              <div className="flex items-center" style={{ gap: '10px' }}>
                <div className="flex">
                  <span className="da-av" style={{ background: '#3B82F6', zIndex: 4 }}>A</span>
                  <span className="da-av" style={{ background: '#10B981', marginLeft: '-8px', zIndex: 3 }}>M</span>
                  <span className="da-av" style={{ background: '#8B5CF6', marginLeft: '-8px', zIndex: 2 }}>K</span>
                  <span className="da-av" style={{ background: '#F59E0B', marginLeft: '-8px', zIndex: 1 }}>R</span>
                </div>
                <div className="da-welcome-live-copy" style={{ fontSize: '12px', lineHeight: 1.4, textAlign: 'left' }}>
                  <div style={{ whiteSpace: 'nowrap' }}><strong>{aspirants}</strong> aspirants attempting now</div>
                  <div style={{ fontSize: '10px', color: '#6B7280' }}>Join them - every day counts</div>
                </div>
              </div>
              <span className="flex items-center" style={{ gap: '4px', padding: '4px 10px', borderRadius: '100px', background: 'rgba(220,38,38,0.1)', color: '#DC2626', fontSize: '10px', fontWeight: 700 }}>
                <span className="da-livedot" />LIVE
              </span>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={begin}
              className="da-btn-primary"
              style={{ width: '100%', marginTop: '16px', padding: '15px' }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F5B800' }} />
              {data.attempted ? 'View Result' : 'Click to begin'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
