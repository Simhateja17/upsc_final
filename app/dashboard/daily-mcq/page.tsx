'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { dailyMcqService, dashboardService } from '@/lib/services';

interface MCQData {
  id: string;
  title: string;
  topic: string;
  tags: string[];
  questionCount: number;
  timeLimit: number;
  totalMarks: number;
  attempted: boolean;
}

// "20th June 2026" style date for the landing header.
function formatChallengeDate(date: Date) {
  const day = date.getDate();
  const suffix = day % 10 === 1 && day !== 11 ? 'st'
    : day % 10 === 2 && day !== 12 ? 'nd'
    : day % 10 === 3 && day !== 13 ? 'rd'
    : 'th';
  const month = date.toLocaleString('en-US', { month: 'long' });
  return `${day}${suffix} ${month} ${date.getFullYear()}`;
}

// label + emoji + pastel-palette class (per reference).
const DAILY_MCQ_SUBJECTS = [
  { label: 'History', icon: '🏛️', cls: 'history' },
  { label: 'Polity', icon: '⚖️', cls: 'polity' },
  { label: 'Geography', icon: '🌍', cls: 'geography' },
  { label: 'Environment', icon: '🌿', cls: 'environment' },
  { label: 'Science & Tech', icon: '🔬', cls: 'science' },
  { label: 'Economy', icon: '📈', cls: 'economy' },
  { label: 'Current Affairs', icon: '📰', cls: 'current' },
];

export default function DailyMcqIntroPage() {
  const router = useRouter();
  const [mcq, setMcq] = useState<MCQData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  // Retake: arriving with ?retake=1 means the user wants to start over, so we
  // show the "Start" CTA (begin from the first screen) even if today is attempted.
  const [isRetake, setIsRetake] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsRetake(new URLSearchParams(window.location.search).get('retake') === '1');
    }
  }, []);

  const FIXED_QUESTION_COUNT = 10;
  const FIXED_TIME_LIMIT = 10;
  const FIXED_TOTAL_MARKS = 20;

  useEffect(() => {
    dailyMcqService.getToday()
      .then(res => setMcq(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Current streak for the landing screen (best-effort; landing still works without it).
  useEffect(() => {
    dashboardService.getStreak()
      .then(res => setStreak(Number(res.data?.currentStreak ?? 0)))
      .catch(() => setStreak(null));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: '#F5F6F8' }}>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </main>
      </div>
    );
  }

  if (error || !mcq) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: '#F5F6F8' }}>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">No MCQ Challenge Today</h2>
            <p className="text-gray-500">{error || 'Check back later for today\'s challenge.'}</p>
            <Link href="/dashboard" className="mt-4 inline-block text-blue-600 hover:underline">Back to Dashboard</Link>
          </div>
        </main>
      </div>
    );
  }

  const attemptedView = mcq.attempted && !isRetake;
  const buttonLabel = attemptedView
    ? 'View Results'
    : isRetake ? 'Retake Challenge' : "Start Today's Challenge";

  const handleStart = () => {
    if (attemptedView) {
      router.push('/dashboard/daily-mcq/results');
      return;
    }
    router.push(`/dashboard/daily-mcq/challenge${isRetake ? '?retake=1' : ''}`);
  };

  return (
    <div className="dmcw-root">
      <style>{`
        .dmcw-root {
          --bg: #F5F6F8;
          --card: #FFFFFF;
          --text-primary: #1A1A1A;
          --text-secondary: #6B7280;
          --text-muted: #9CA3AF;
          --border: #E5E7EB;
          --border-light: #F0F0F2;
          --navy: #0F172A;
          --accent-red: #DC2626;
          --accent-red-bg: #FEE2E2;
          --radius-card: 24px;
          --radius-md: 16px;
          --radius-pill: 20px;
          --shadow-card: 0 10px 40px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04);
          font-family: var(--font-dm-sans), 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          background: var(--bg);
          color: var(--text-primary);
          min-height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0 16px 6px;
          -webkit-font-smoothing: antialiased;
        }

        /* --- LIVE BAR --- */
        .dmcw-live-bar {
          width: 100%;
          max-width: 540px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 4px 0 4px;
          animation: dmcw-fadeInUp 0.5s ease both;
        }
        .dmcw-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: var(--radius-pill);
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
        }
        .dmcw-pill-live {
          background: var(--card);
          border: 1px solid var(--border);
          color: #333;
        }
        .dmcw-pill-live .dmcw-dot {
          width: 8px; height: 8px;
          background: var(--accent-red);
          border-radius: 50%;
          animation: dmcw-pulse-dot 1.8s ease-in-out infinite;
        }
        .dmcw-pill-streak {
          background: linear-gradient(135deg, #FFF9C4 0%, #FFE082 100%);
          border: 1px solid #FFE082;
          color: #3E2723;
          font-weight: 600;
          box-shadow: 0 2px 10px rgba(255,183,0,0.15);
        }
        @keyframes dmcw-pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        /* --- MAIN CARD --- */
        .dmcw-card {
          width: 100%;
          max-width: 540px;
          background: var(--card);
          border-radius: var(--radius-card);
          box-shadow: var(--shadow-card);
          padding: 10px 28px 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: dmcw-fadeInUp 0.6s ease 0.15s both;
        }

        /* --- ICON --- */
        .dmcw-icon-badge {
          width: 52px; height: 52px;
          border-radius: 50%;
          background: var(--navy);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: 0 0 24px rgba(255,179,0,0.25);
          border: 3px solid rgba(255,255,255,0.15);
          animation: dmcw-fadeInUp 0.5s ease 0.2s both;
        }
        .dmcw-icon-badge svg { width: 26px; height: 26px; }

        /* --- TITLE & DESC --- */
        .dmcw-title {
          font-family: var(--font-playfair), 'Playfair Display', Georgia, serif;
          font-size: 23px;
          font-weight: 800;
          color: var(--text-primary);
          margin-top: 8px;
          text-align: center;
          letter-spacing: -0.3px;
          animation: dmcw-fadeInUp 0.5s ease 0.3s both;
        }
        .dmcw-description {
          font-size: 14.5px;
          color: var(--text-secondary);
          text-align: center;
          line-height: 1.4;
          margin-top: 4px;
          max-width: 88%;
          animation: dmcw-fadeInUp 0.5s ease 0.35s both;
        }

        /* --- SUBJECTS WRAP --- */
        .dmcw-subjects-section {
          width: 100%;
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: dmcw-fadeInUp 0.5s ease 0.45s both;
        }
        .dmcw-subjects-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          color: var(--text-muted);
          margin-bottom: 10px;
        }
        .dmcw-subjects-wrap {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          max-width: 480px;
        }
        .dmcw-subject-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 12.5px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
          animation: dmcw-fadeInUp 0.4s ease both;
        }
        .dmcw-subject-pill:hover {
          transform: translateY(-1px);
          box-shadow: 0 3px 10px rgba(0,0,0,0.06);
        }
        .dmcw-subject-pill .dmcw-emoji { font-size: 13px; line-height: 1; }

        .dmcw-subject-pill.history     { background: #FFF7ED; color: #9A5B2F; border-color: #FDECD0; }
        .dmcw-subject-pill.history:hover { background: #FEF0E0; }
        .dmcw-subject-pill.polity      { background: #F0F4FF; color: #4A5DB5; border-color: #DDE4FF; }
        .dmcw-subject-pill.polity:hover { background: #E6ECFF; }
        .dmcw-subject-pill.economy     { background: #ECFDF5; color: #2E7D5B; border-color: #C6F0DC; }
        .dmcw-subject-pill.economy:hover { background: #DFF8EC; }
        .dmcw-subject-pill.environment { background: #F0FDF4; color: #3D7A4A; border-color: #D1F0DB; }
        .dmcw-subject-pill.environment:hover { background: #E4FAE9; }
        .dmcw-subject-pill.science     { background: #F5F3FF; color: #6D5AAC; border-color: #E2DBFF; }
        .dmcw-subject-pill.science:hover { background: #EDE8FF; }
        .dmcw-subject-pill.geography   { background: #FFFDF0; color: #8A7528; border-color: #F5EFCA; }
        .dmcw-subject-pill.geography:hover { background: #FFF9E0; }
        .dmcw-subject-pill.current     { background: #FFF1F2; color: #A04550; border-color: #FDDEE0; }
        .dmcw-subject-pill.current:hover { background: #FFE8EA; }

        .dmcw-subject-pill:nth-child(1) { animation-delay: 0.5s; }
        .dmcw-subject-pill:nth-child(2) { animation-delay: 0.53s; }
        .dmcw-subject-pill:nth-child(3) { animation-delay: 0.56s; }
        .dmcw-subject-pill:nth-child(4) { animation-delay: 0.59s; }
        .dmcw-subject-pill:nth-child(5) { animation-delay: 0.62s; }
        .dmcw-subject-pill:nth-child(6) { animation-delay: 0.65s; }
        .dmcw-subject-pill:nth-child(7) { animation-delay: 0.68s; }

        /* --- STATS ROW --- */
        .dmcw-stats-row {
          display: flex;
          gap: 10px;
          width: 100%;
          margin-top: 10px;
          animation: dmcw-fadeInUp 0.5s ease 0.55s both;
        }
        .dmcw-stat-box {
          flex: 1;
          background: #F9FAFB;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 7px 10px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .dmcw-stat-box .dmcw-number {
          font-size: 26px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1;
        }
        .dmcw-stat-box .dmcw-label {
          font-size: 12px;
          color: var(--text-secondary);
          font-weight: 500;
        }

        /* --- MARKING PATTERN --- */
        .dmcw-marking-section {
          width: 100%;
          margin-top: 8px;
          animation: dmcw-fadeInUp 0.5s ease 0.65s both;
        }
        .dmcw-marking-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          color: var(--text-muted);
          text-align: center;
          margin-bottom: 8px;
        }
        .dmcw-marking-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 6px 14px;
          border-radius: var(--radius-md);
          background: #FAFBFC;
          border: 1px solid var(--border-light);
          transition: all 0.2s ease;
        }
        .dmcw-marking-card + .dmcw-marking-card { margin-top: 6px; }
        .dmcw-marking-card:hover { transform: translateX(3px); }
        .dmcw-marking-dot {
          width: 32px; height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
        }
        .dmcw-marking-card.correct .dmcw-marking-dot {
          background: linear-gradient(135deg, #34D399 0%, #10B981 100%);
          box-shadow: 0 3px 10px rgba(16,185,129,0.25);
        }
        .dmcw-marking-card.wrong .dmcw-marking-dot {
          background: linear-gradient(135deg, #FCA5A5 0%, #F87171 100%);
          box-shadow: 0 3px 10px rgba(248,113,113,0.25);
        }
        .dmcw-marking-body {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .dmcw-marking-title { font-size: 12px; font-weight: 500; color: #6B7280; }
        .dmcw-marking-value {
          font-size: 15px;
          font-weight: 700;
          font-family: var(--font-dm-sans), 'DM Sans', sans-serif;
        }
        .dmcw-marking-card.correct .dmcw-marking-value { color: #059669; }
        .dmcw-marking-card.wrong .dmcw-marking-value { color: #EF4444; }

        /* --- ASPIRANTS BANNER --- */
        .dmcw-aspirants-banner {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 8px;
          padding: 8px 16px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          animation: dmcw-fadeInUp 0.5s ease 0.75s both;
        }
        .dmcw-avatars { display: flex; flex-shrink: 0; }
        .dmcw-avatar {
          width: 30px; height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: #fff;
          border: 2px solid #fff;
          margin-left: -6px;
        }
        .dmcw-avatar:first-child { margin-left: 0; }
        .dmcw-avatar-1 { background: #3B82F6; z-index: 4; }
        .dmcw-avatar-2 { background: #10B981; z-index: 3; }
        .dmcw-avatar-3 { background: #8B5CF6; z-index: 2; }
        .dmcw-avatar-4 { background: #F59E0B; z-index: 1; }
        .dmcw-banner-text { flex: 1; min-width: 0; }
        .dmcw-banner-text .dmcw-line1 { font-size: 13px; font-weight: 600; color: #1F2937; }
        .dmcw-banner-text .dmcw-line2 { font-size: 11.5px; color: var(--text-secondary); margin-top: 2px; }
        .dmcw-badge-live {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: var(--accent-red-bg);
          border-radius: 8px;
          font-size: 10px;
          font-weight: 700;
          color: var(--accent-red);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .dmcw-badge-live .dmcw-dot {
          width: 6px; height: 6px;
          background: var(--accent-red);
          border-radius: 50%;
          animation: dmcw-pulse-dot 1.8s ease-in-out infinite;
        }

        /* --- START BUTTON --- */
        .dmcw-start-btn {
          width: 100%;
          margin-top: 8px;
          padding: 11px 24px;
          background: var(--navy);
          color: #fff;
          border: none;
          border-radius: var(--radius-md);
          font-family: var(--font-dm-sans), 'DM Sans', sans-serif;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
          animation: dmcw-fadeInUp 0.5s ease 0.85s both;
        }
        .dmcw-start-btn:hover {
          background: #1E293B;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(15,23,42,0.25);
        }
        .dmcw-start-btn:active { transform: translateY(0); }
        .dmcw-start-btn .dmcw-btn-dot {
          width: 8px; height: 8px;
          background: #FBBF24;
          border-radius: 50%;
          animation: dmcw-pulse-yellow 1.6s ease-in-out infinite;
        }
        @keyframes dmcw-pulse-yellow {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(251,191,36,0.6); }
          50% { opacity: 0.6; box-shadow: 0 0 0 6px rgba(251,191,36,0); }
        }

        /* --- ANIMATIONS --- */
        @keyframes dmcw-fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* LIVE BAR (outside card, on gray background) */}
      <div className="dmcw-live-bar">
        <div className="dmcw-pill dmcw-pill-live">
          <span className="dmcw-dot" />
          Today&apos;s Challenge is LIVE · {formatChallengeDate(new Date())}
        </div>
        {streak !== null && streak > 0 && (
          <div className="dmcw-pill dmcw-pill-streak">
            🔥 {streak}-day Streak
          </div>
        )}
      </div>

      {/* MAIN CARD */}
      <div className="dmcw-card">

        {/* Icon: Dartboard */}
        <div className="dmcw-icon-badge">
          <svg viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Board shadow */}
            <ellipse cx="47" cy="49" rx="33" ry="33" fill="rgba(0,0,0,0.06)" />
            {/* Outer red ring */}
            <circle cx="45" cy="47" r="32" fill="#E53E3E" />
            {/* White ring */}
            <circle cx="45" cy="47" r="27" fill="#FFF5F5" />
            {/* Inner red ring */}
            <circle cx="45" cy="47" r="22" fill="#E53E3E" />
            {/* Inner white ring */}
            <circle cx="45" cy="47" r="17" fill="#FFF5F5" />
            {/* Center red */}
            <circle cx="45" cy="47" r="12" fill="#E53E3E" />
            {/* Bullseye */}
            <circle cx="45" cy="47" r="6" fill="#C53030" />
            {/* Highlight */}
            <ellipse cx="36" cy="36" rx="14" ry="9" fill="rgba(255,255,255,0.1)" transform="rotate(-30 36 36)" />
            {/* Dart tip */}
            <circle cx="45" cy="47" r="2.5" fill="#fff" />
            {/* Dart barrel */}
            <line x1="45" y1="47" x2="54" y2="38" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
            {/* Dart shaft */}
            <line x1="54" y1="38" x2="70" y2="22" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
            {/* Dart flights (fins) */}
            <path d="M70 22 L78 15 L73 23 Z" fill="#FBBF24" />
            <path d="M70 22 L76 13 L71 19 Z" fill="#F59E0B" />
            <path d="M70 22 L80 19 L72 25 Z" fill="#FCD34D" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="dmcw-title">Daily MCQ Challenge</h1>
        <p className="dmcw-description">Sharpen your knowledge with focused practice questions</p>

        {/* Subjects */}
        <div className="dmcw-subjects-section">
          <div className="dmcw-subjects-wrap">
            {DAILY_MCQ_SUBJECTS.map((subject) => (
              <div key={subject.label} className={`dmcw-subject-pill ${subject.cls}`}>
                <span className="dmcw-emoji" aria-hidden="true">{subject.icon}</span>
                {subject.label}
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="dmcw-stats-row">
          <div className="dmcw-stat-box">
            <span className="dmcw-number">{FIXED_QUESTION_COUNT}</span>
            <span className="dmcw-label">Questions</span>
          </div>
          <div className="dmcw-stat-box">
            <span className="dmcw-number">{FIXED_TIME_LIMIT}</span>
            <span className="dmcw-label">Minutes</span>
          </div>
          <div className="dmcw-stat-box">
            <span className="dmcw-number">{FIXED_TOTAL_MARKS}</span>
            <span className="dmcw-label">Max Marks</span>
          </div>
        </div>

        {/* Marking Pattern */}
        <div className="dmcw-marking-section">
          <div className="dmcw-marking-label">Marking Pattern</div>
          <div className="dmcw-marking-card correct">
            <div className="dmcw-marking-dot">✓</div>
            <div className="dmcw-marking-body">
              <span className="dmcw-marking-title">Correct answer</span>
              <span className="dmcw-marking-value">+2 marks</span>
            </div>
          </div>
          <div className="dmcw-marking-card wrong">
            <div className="dmcw-marking-dot">✗</div>
            <div className="dmcw-marking-body">
              <span className="dmcw-marking-title">Wrong answer</span>
              <span className="dmcw-marking-value">−0.66 marks</span>
            </div>
          </div>
        </div>

        {/* Aspirants Banner */}
        <div className="dmcw-aspirants-banner">
          <div className="dmcw-avatars">
            <div className="dmcw-avatar dmcw-avatar-1">A</div>
            <div className="dmcw-avatar dmcw-avatar-2">M</div>
            <div className="dmcw-avatar dmcw-avatar-3">K</div>
            <div className="dmcw-avatar dmcw-avatar-4">R</div>
          </div>
          <div className="dmcw-banner-text">
            <div className="dmcw-line1">1,248 aspirants attempting now</div>
            <div className="dmcw-line2">Join them — every day counts</div>
          </div>
          <div className="dmcw-badge-live">
            <span className="dmcw-dot" />
            LIVE
          </div>
        </div>

        {/* Start Button */}
        <button
          type="button"
          className="dmcw-start-btn"
          onClick={handleStart}
          aria-label={attemptedView ? "View today's daily MCQ results" : isRetake ? 'Retake today\'s daily MCQ challenge' : 'Start today\'s daily MCQ challenge'}
        >
          <span className="dmcw-btn-dot" />
          {buttonLabel}
        </button>

      </div>
    </div>
  );
}
