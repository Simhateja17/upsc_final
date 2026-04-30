'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardPageHero from '@/components/DashboardPageHero';

// ── constants ────────────────────────────────────────────────────────────────

const moods = [
  { emoji: '😤', label: 'Frustrated' },
  { emoji: '😰', label: 'Anxious' },
  { emoji: '😔', label: 'Low' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '🙂', label: 'Good' },
  { emoji: '😄', label: 'Great' },
  { emoji: '🔥', label: 'On Fire!' },
  { emoji: '😴', label: 'Exhausted' },
];

const weekDays = [
  { key: 'MON', emoji: '🧘', label: 'Morning\nmeditation', status: 'done' },
  { key: 'TUE', emoji: '📔', label: 'Journaling', status: 'done' },
  { key: 'WED', emoji: '🚶', label: '10 min walk', status: 'done' },
  { key: 'TODAY', emoji: '🫁', label: 'Breathing', status: 'today' },
  { key: 'FRI', emoji: '📔', label: 'Weekly\nreview', status: 'future' },
  { key: 'SAT', emoji: '🌿', label: 'Rest +\nNature', status: 'future' },
  { key: 'SUN', emoji: '📋', label: 'Week\nplanning', status: 'future' },
];

const moodDays = [
  { label: 'Mon', color: 'linear-gradient(to bottom, #4ade80, #22c55e)' },
  { label: 'Tue', color: 'linear-gradient(to bottom, #f5ce72, #e8b84b)' },
  { label: 'Wed', color: 'linear-gradient(to bottom, #93c5fd, #4a7fa8)' },
  { label: 'Thu', color: 'linear-gradient(to bottom, #fca5a5, #c4637a)' },
  { label: 'Fri', color: 'linear-gradient(to bottom, #f5ce72, #e8b84b)' },
  { label: 'Sat', color: 'linear-gradient(to bottom, #4ade80, #22c55e)' },
  { label: 'Today', color: 'linear-gradient(to bottom, #f5ce72, #e8b84b)', today: true },
];

const tips = [
  { icon: '🧘', text: 'Take 5 minutes of box breathing before your study session' },
  { icon: '🌿', text: 'Spend 10 min outside — sunlight resets cortisol naturally' },
  { icon: '📋', text: "Write tomorrow's 3 tasks tonight — reduces morning anxiety" },
];

const affirmations = [
  'The UPSC exam tests your consistency, not your brilliance. Show up every single day and the result will take care of itself.',
  'Every page you read today is a brick in the foundation of your success. Keep building.',
  'Rest is not giving up. Rest is part of the strategy.',
];

const mindTools = [
  {
    icon: '🫁',
    title: 'Box Breathing',
    desc: '4-4-4-4 breathing technique to calm nerves before exams or when overwhelmed.',
    duration: '3–5 min',
    action: 'Start →',
    borderColor: 'linear-gradient(to right, #4a7c59, #4ade80)',
  },
  {
    icon: '🧘',
    title: 'Focus Meditation',
    desc: 'Guided mindfulness to sharpen concentration before a deep study session.',
    duration: '7 min',
    action: 'Start →',
    borderColor: 'linear-gradient(to right, #4a7fa8, #93c5fd)',
  },
  {
    icon: '📔',
    title: 'Reflective Journaling',
    desc: 'Guided prompts to process exam anxiety, self-doubt, or a difficult day.',
    duration: '5 min',
    action: 'Open Journal →',
    borderColor: 'linear-gradient(to right, #c99730, #e8b84b)',
  },
  {
    icon: '💫',
    title: 'Positive Affirmations',
    desc: 'UPSC-specific affirmations to rebuild confidence after a tough day or mock test.',
    duration: '2 min',
    action: 'Start →',
    borderColor: 'linear-gradient(to right, #c4637a, #fca5a5)',
  },
  {
    icon: '🌱',
    title: '5-4-3-2-1 Grounding',
    desc: 'Anxiety spiraling? This sensory technique brings you back to the present in minutes.',
    duration: '3 min',
    action: 'Start →',
    borderColor: 'linear-gradient(to right, #4a7c59, #4a7fa8)',
  },
  {
    icon: '🎯',
    title: 'Study Pressure Release',
    desc: 'Quick somatic exercise to release shoulder & neck tension after long study hours.',
    duration: '4 min',
    action: 'Start →',
    borderColor: 'linear-gradient(to right, #c99730, #e8b84b)',
  },
];

const communityCards = [
  {
    icon: '🫂',
    title: 'Peer Support Circle',
    desc: 'Join a safe, small-group conversation with fellow aspirants going through similar feelings.',
    badge: 'LIVE NOW · 7 MEMBERS',
    badgeBg: 'rgba(74,127,168,0.11)',
    badgeColor: '#4a7fa8',
  },
  {
    icon: '🥇',
    title: 'Stories of Resilience',
    desc: 'Read how aspirants overcame failures, family pressure, and self-doubt to clear the exam.',
    badge: '24 STORIES',
    badgeBg: 'rgba(74,124,89,0.11)',
    badgeColor: '#4a7c59',
  },
  {
    icon: '🧭',
    title: 'Talk to a Mentor',
    desc: "A cleared IAS/IPS officer who's been exactly where you are. Book a 30-min conversation.",
    badge: 'BOOK SESSION',
    badgeBg: 'rgba(232,184,75,0.11)',
    badgeColor: '#c99730',
  },
];

// ── helpers ──────────────────────────────────────────────────────────────────

function getEnergyLabel(value: number) {
  if (value <= 20) return 'Very Low';
  if (value <= 40) return 'Low';
  if (value <= 60) return 'Moderate';
  if (value <= 80) return 'High';
  return 'On Fire!';
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ── Stress gauge SVG ─────────────────────────────────────────────────────────

function StressGauge({ level = 0.5 }: { level?: number }) {
  // level: 0 = low (left), 1 = high (right)
  const cx = 130, cy = 122, r = 100;
  // Needle angle: from -180deg (left) to 0deg (right) mapped to level
  const angleDeg = -180 + level * 180;
  const angleRad = (angleDeg * Math.PI) / 180;
  const needleLen = 75;
  const nx = cx + needleLen * Math.cos(angleRad);
  const ny = cy + needleLen * Math.sin(angleRad);

  return (
    <svg width="260" height="130" viewBox="0 0 260 130" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4a7c59" />
          <stop offset="40%" stopColor="#e8b84b" />
          <stop offset="100%" stopColor="#c4637a" />
        </linearGradient>
        <clipPath id="halfCircle">
          <rect x="0" y="0" width="260" height="122" />
        </clipPath>
      </defs>
      {/* Background arc */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(11,22,40,0.07)" strokeWidth="20" clipPath="url(#halfCircle)" />
      {/* Colored arc */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#gaugeGrad)" strokeWidth="18" clipPath="url(#halfCircle)" />
      {/* Needle */}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#101d36" strokeWidth="3" strokeLinecap="round" />
      {/* Pivot dot */}
      <circle cx={cx} cy={cy} r={7} fill="#101d36" stroke="white" strokeWidth="3" />
    </svg>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function MentalHealthPage() {
  const { user } = useAuth();
  const firstName = user?.firstName || 'Friend';

  const [mood, setMood] = useState('Good');
  const [energy, setEnergy] = useState(55);
  const [note, setNote] = useState('');
  const [affIdx, setAffIdx] = useState(0);

  const dm = 'var(--font-dm-sans), Inter, sans-serif';
  const cg = 'var(--font-cormorant), Georgia, serif';

  return (
    <div className="min-h-screen" style={{ background: '#f4f6fa', fontFamily: dm }}>

      {/* ── slider styles ── */}
      <style>{`
        .energy-slider {
          -webkit-appearance: none; appearance: none;
          width: 100%; height: 6px; border-radius: 6px;
          background: linear-gradient(to right, #4a7c59, #e8b84b 50%, #c4637a);
          outline: none; cursor: pointer;
        }
        .energy-slider::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 20px; height: 20px; border-radius: 50%;
          background: white; border: 3px solid #e8b84b;
          box-shadow: 0px 2px 8px rgba(11,22,40,0.15); cursor: pointer;
        }
        .energy-slider::-moz-range-thumb {
          width: 20px; height: 20px; border-radius: 50%;
          background: white; border: 3px solid #e8b84b;
          box-shadow: 0px 2px 8px rgba(11,22,40,0.15); cursor: pointer;
        }
      `}</style>

      <DashboardPageHero
        badgeIcon={<img src="/cap.png" alt="cap" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />}
        badgeText="MENTAL HEALTH BUDDY"
        title={
          <>
            Nurture Your <em className="not-italic" style={{ color: '#e8a820', fontStyle: 'italic' }}>Mind</em>,
            <br />
            Ace Your Exam
          </>
        }
        subtitle="Evidence-based tools to manage UPSC stress and stay mentally strong throughout your journey."
        stats={[
          { value: 'Daily', label: 'Check-ins', color: '#FDC700' },
          { value: '6',     label: 'Mind Tools', color: '#F87171' },
          { value: '12',    label: 'Day Streak', color: '#4ADE80' },
          { value: '∞', label: 'Always Free', color: '#FFFFFF' },
        ]}
      />

      <div className="mx-auto max-w-[1040px] px-4 py-8" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ══ DAILY CHECK-IN CARD ══════════════════════════════════════════════ */}
        <div className="relative overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(11,22,40,0.08)', borderRadius: 20, boxShadow: '0px 8px 36px rgba(11,22,40,0.11)', padding: '33px 37px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* rainbow top */}
          <div className="absolute left-0 right-0 top-0" style={{ height: 4, background: 'linear-gradient(to right, #4a7c59, #e8b84b 50%, #c4637a)' }} />

          {/* header */}
          <div className="flex items-start justify-between mb-3">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontFamily: cg, fontWeight: 600, fontSize: 25.6, color: '#0c1424' }}>Daily Check-In</span>
              <span style={{ fontFamily: dm, fontSize: 13, color: '#6b7a99' }}>{formatDate()} · Takes 60 seconds</span>
            </div>
            <div style={{ background: 'rgba(232,184,75,0.11)', border: '1px solid rgba(232,184,75,0.28)', borderRadius: 12, padding: '10px 17px 11px', textAlign: 'center' as const, minWidth: 64 }}>
              <div style={{ fontFamily: cg, fontWeight: 700, fontSize: 22.4, color: '#c99730', lineHeight: '22.4px' }}>12</div>
              <div style={{ fontFamily: dm, fontSize: 11, color: '#6b7a99', lineHeight: '14.3px' }}>day<br />streak 🔥</div>
            </div>
          </div>

          {/* mood */}
          <div style={{ paddingTop: 12 }}>
            <div style={{ fontFamily: dm, fontWeight: 700, fontSize: 11, letterSpacing: '1.1px', textTransform: 'uppercase' as const, color: '#9aa3b8', marginBottom: 12 }}>
              How are you feeling right now?
            </div>
            <div className="flex flex-wrap gap-[10px]">
              {moods.map(({ emoji, label }) => {
                const sel = mood === label;
                return (
                  <button key={label} onClick={() => setMood(label)} style={{ background: sel ? 'rgba(232,184,75,0.11)' : '#fff', border: sel ? '1px solid #e8b84b' : '1px solid rgba(11,22,40,0.08)', borderRadius: 14, padding: '15px 19px', minWidth: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', boxShadow: sel ? '0px 4px 8px rgba(232,184,75,0.15)' : 'none', transition: 'all 0.15s' }}>
                    <span style={{ fontSize: 26, lineHeight: '26px' }}>{emoji}</span>
                    <span style={{ fontFamily: dm, fontWeight: 600, fontSize: 11, color: sel ? '#c99730' : '#6b7a99' }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* energy */}
          <div style={{ paddingTop: 24 }}>
            <div style={{ fontFamily: dm, fontWeight: 700, fontSize: 11, letterSpacing: '1.1px', textTransform: 'uppercase' as const, color: '#9aa3b8', marginBottom: 12 }}>Energy level today</div>
            <div className="flex items-center gap-[14px]">
              <span style={{ fontSize: 18 }}>🪫</span>
              <input type="range" min={0} max={100} value={energy} onChange={e => setEnergy(+e.target.value)} className="energy-slider flex-1" />
              <span style={{ fontSize: 18 }}>⚡</span>
              <span style={{ fontFamily: dm, fontWeight: 600, fontSize: 13, color: '#374560', minWidth: 70, textAlign: 'center' as const }}>{getEnergyLabel(energy)}</span>
            </div>
          </div>

          {/* textarea */}
          <div style={{ paddingTop: 24 }}>
            <div style={{ fontFamily: dm, fontWeight: 700, fontSize: 11, letterSpacing: '1.1px', textTransform: 'uppercase' as const, color: '#9aa3b8', marginBottom: 12 }}>
              One thing on your mind <span style={{ fontWeight: 400, textTransform: 'none' as const, letterSpacing: 0 }}>(optional)</span>
            </div>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={4}
              placeholder="Write anything — a worry, a win, a thought, or simply how you feel right now. No one else sees this."
              style={{ width: '100%', background: 'rgba(255,255,255,0.8)', border: '1px solid #8fa4be', borderRadius: 12, padding: '14px 17px', fontFamily: cg, fontStyle: 'italic', fontSize: 16, lineHeight: '27.2px', color: '#0c1424', outline: 'none', resize: 'vertical', boxSizing: 'border-box' as const }} />
          </div>

          {/* footer */}
          <div className="flex items-center justify-between" style={{ paddingTop: 12 }}>
            <span style={{ fontFamily: dm, fontSize: 12, color: '#9aa3b8' }}>🔒 Your check-ins are private and never shared.</span>
            <button style={{ background: '#090e1c', border: 'none', borderRadius: 10, padding: '11px 28px', fontFamily: dm, fontWeight: 700, fontSize: 14, color: '#e8b84b', cursor: 'pointer' }}>
              Save Check-In ✓
            </button>
          </div>
        </div>

        {/* ══ TWO-COLUMN ROW ════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── LEFT: This Week ── */}
          <div style={{ background: '#fff', border: '1px solid rgba(11,22,40,0.08)', borderRadius: 18, boxShadow: '0px 2px 7px rgba(11,22,40,0.07)', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* "THIS WEEK" label */}
            <div className="flex items-center gap-[10px]">
              <div style={{ width: 28, height: 2, background: '#e8b84b', borderRadius: 2 }} />
              <span style={{ fontFamily: dm, fontWeight: 700, fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: '#e8b84b' }}>This Week</span>
            </div>

            {/* Weekly Wellness Plan card */}
            <div style={{ border: '1px solid rgba(11,22,40,0.08)', borderRadius: 18, overflow: 'hidden', boxShadow: '0px 2px 14px rgba(11,22,40,0.07)' }}>
              {/* header */}
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(11,22,40,0.08)' }}>
                <span style={{ fontFamily: cg, fontWeight: 600, fontSize: 17.6, color: '#0c1424' }}>🗓 Weekly Wellness Plan</span>
                <button style={{ fontFamily: dm, fontWeight: 600, fontSize: 12, color: '#c99730', background: 'none', border: 'none', cursor: 'pointer' }}>Customize</button>
              </div>

              {/* 7-day grid */}
              <div className="grid grid-cols-7" style={{ minHeight: 120 }}>
                {weekDays.map(({ key, emoji, label, status }) => {
                  const isToday = status === 'today';
                  const isDone = status === 'done';
                  return (
                    <div key={key} style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      padding: '12px 4px',
                      background: isToday ? '#090e1c' : isDone ? 'rgba(74,124,89,0.1)' : 'transparent',
                      borderRight: '1px solid rgba(11,22,40,0.08)',
                    }}>
                      <span style={{ fontFamily: dm, fontWeight: 700, fontSize: 10, letterSpacing: '0.6px', textTransform: 'uppercase' as const, color: isToday ? 'rgba(255,255,255,0.4)' : '#9aa3b8', textAlign: 'center' as const }}>{key}</span>
                      <span style={{ fontSize: 18, color: isToday ? '#e8b84b' : 'inherit' }}>{emoji}</span>
                      <span style={{ fontFamily: dm, fontSize: 10, color: isToday ? 'rgba(255,255,255,0.5)' : '#6b7a99', textAlign: 'center' as const, lineHeight: '14px', whiteSpace: 'pre-line' as const }}>{label}</span>
                      <span style={{ fontFamily: dm, fontSize: 13, color: isToday ? '#e8b84b' : '#000', textAlign: 'center' as const }}>
                        {isDone ? '✅' : isToday ? '○' : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Your Mood Journey */}
            <div>
              <h3 style={{ fontFamily: cg, fontWeight: 600, fontSize: 19.2, color: '#0c1424', margin: '0 0 12px' }}>Your Mood Journey</h3>

              {/* day tabs */}
              <div className="grid grid-cols-7 gap-0 mb-4">
                {moodDays.map(d => (
                  <div key={d.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ height: 4, width: '90%', borderRadius: '6px 6px 0 0', background: d.color }} />
                    <span style={{ fontFamily: dm, fontWeight: d.today ? 700 : 600, fontSize: 10, color: d.today ? '#c99730' : '#9aa3b8' }}>{d.label}</span>
                  </div>
                ))}
              </div>

              {/* stat tiles */}
              <div className="grid grid-cols-3 gap-3">
                <div style={{ background: 'rgba(11,22,40,0.08)', borderRadius: 10, padding: '9px 14px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontFamily: cg, fontWeight: 700, fontSize: 20.8, color: '#4a7c59', lineHeight: '20.8px' }}>🟢 5/7</span>
                  <span style={{ fontFamily: dm, fontSize: 10, color: '#9aa3b8' }}>Positive days</span>
                </div>
                <div style={{ background: 'rgba(11,22,40,0.08)', borderRadius: 10, padding: '9px 14px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontFamily: cg, fontWeight: 700, fontSize: 20.8, color: '#c99730', lineHeight: '20.8px' }}>7.4</span>
                  <span style={{ fontFamily: dm, fontSize: 10, color: '#9aa3b8' }}>Avg wellness score</span>
                </div>
                <div style={{ background: 'rgba(11,22,40,0.08)', borderRadius: 10, padding: '9px 14px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontFamily: cg, fontWeight: 700, fontSize: 20.8, color: '#4a7fa8', lineHeight: '20.8px' }}>12🔥</span>
                  <span style={{ fontFamily: dm, fontSize: 10, color: '#9aa3b8' }}>Check-in streak</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: UPSC Stress Index ── */}
          <div style={{ background: '#fff', border: '1px solid rgba(11,22,40,0.08)', borderRadius: 18, boxShadow: '0px 2px 7px rgba(11,22,40,0.07)', padding: '24px', display: 'flex', flexDirection: 'column', gap: 0 }}>

            {/* "UPSC STRESS INDEX" label */}
            <div className="flex items-center gap-[10px] mb-3">
              <div style={{ width: 28, height: 2, background: '#e8b84b', borderRadius: 2 }} />
              <span style={{ fontFamily: dm, fontWeight: 700, fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: '#e8b84b' }}>UPSC Stress Index</span>
            </div>

            <h3 style={{ fontFamily: cg, fontWeight: 600, fontSize: 19.2, color: '#0c1424', margin: '0 0 4px' }}>Your Pressure Level</h3>

            {/* gauge */}
            <div className="flex flex-col items-center" style={{ marginTop: 8, marginBottom: 4 }}>
              <StressGauge level={0.5} />
              <span style={{ fontFamily: cg, fontWeight: 700, fontSize: 20.8, color: '#d97706', marginTop: -8 }}>Moderate 🌤</span>
              <span style={{ fontFamily: dm, fontSize: 12, color: '#6b7a99', marginTop: 4, textAlign: 'center' as const }}>
                You&apos;re managing well. A few mindful practices will keep you steady.
              </span>
            </div>

            {/* tips */}
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column' }}>
              {tips.map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '7px 0', borderBottom: i < tips.length - 1 ? '1px solid rgba(11,22,40,0.08)' : 'none' }}>
                  <span style={{ fontSize: 14, lineHeight: '21.7px', flexShrink: 0 }}>{tip.icon}</span>
                  <span style={{ fontFamily: dm, fontSize: 12, color: '#6b7a99', lineHeight: '18.6px' }}>{tip.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ AFFIRMATION CARD ══════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden" style={{ background: '#0c1424', border: '1px solid rgba(232,184,75,0.18)', borderRadius: 18, padding: '29px 33px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* radial glow */}
          <div className="absolute pointer-events-none" style={{ right: -80, top: -80, width: 240, height: 240, background: 'radial-gradient(circle at 50% 50%, rgba(232,184,75,0.08) 0%, rgba(232,184,75,0) 65%)' }} />

          {/* quote */}
          <div style={{ position: 'relative', paddingLeft: 24 }}>
            <span style={{ position: 'absolute', left: 0, top: -4, fontFamily: cg, fontStyle: 'italic', fontSize: 48, color: '#e8b84b', opacity: 0.4, lineHeight: '48px' }}>&ldquo;</span>
            <p style={{ fontFamily: cg, fontStyle: 'italic', fontSize: 21.6, color: '#fff', lineHeight: '34.56px', margin: 0 }}>
              {affirmations[affIdx]}
            </p>
          </div>

          {/* label */}
          <span style={{ fontFamily: dm, fontSize: 12, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.72px' }}>
            Daily Affirmation · Day 12 of your journey
          </span>

          {/* actions */}
          <div className="flex items-center gap-[10px]">
            <button onClick={() => setAffIdx(i => (i + 1) % affirmations.length)} style={{ background: '#e8b84b', border: 'none', borderRadius: 8, padding: '8px 18px', fontFamily: dm, fontWeight: 700, fontSize: 12, color: '#090e1c', cursor: 'pointer' }}>
              Next Affirmation →
            </button>
            <button style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 19px', fontFamily: dm, fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
              🔖 Save
            </button>
            <span style={{ fontFamily: dm, fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>
              4 of 30 affirmations today
            </span>
          </div>
        </div>

        {/* ══ TOOLS FOR YOUR MIND ═══════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* header */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="flex items-center gap-[10px]">
              <div style={{ width: 28, height: 2, background: '#e8b84b', borderRadius: 2 }} />
              <span style={{ fontFamily: dm, fontWeight: 700, fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: '#e8b84b' }}>Guided Exercises</span>
            </div>
            <h2 style={{ fontFamily: cg, fontWeight: 600, fontSize: 'clamp(26px, 3.5vw, 32px)', color: '#0c1424', margin: 0 }}>
              Tools for Your Mind
            </h2>
            <p style={{ fontFamily: dm, fontSize: 14, color: '#6b7a99', margin: 0 }}>
              Quick practices designed for UPSC aspirants do them between study sessions.
            </p>
          </div>

          {/* cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mindTools.map((tool, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid rgba(11,22,40,0.08)', borderRadius: 16, overflow: 'hidden', boxShadow: '0px 2px 7px rgba(11,22,40,0.07)', display: 'flex', flexDirection: 'column' }}>
                {/* colored top border */}
                <div style={{ height: 4, background: tool.borderColor }} />
                <div style={{ padding: '20px 22px 18px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                  <span style={{ fontSize: 26, lineHeight: '26px' }}>{tool.icon}</span>
                  <span style={{ fontFamily: dm, fontWeight: 700, fontSize: 15.5, color: '#0c1424' }}>{tool.title}</span>
                  <p style={{ fontFamily: dm, fontSize: 13, color: '#6b7a99', lineHeight: '20px', margin: 0, flex: 1 }}>{tool.desc}</p>
                  <div className="flex items-center justify-between" style={{ paddingTop: 6 }}>
                    <span style={{ fontFamily: dm, fontSize: 12, color: '#9aa3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9aa3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {tool.duration}
                    </span>
                    <button style={{ fontFamily: dm, fontWeight: 700, fontSize: 12, color: '#c99730', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                      {tool.action}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ CRISIS SUPPORT BANNER ═════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ background: '#0c1424', borderRadius: 16, padding: '20px 26px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 16 }}>🤝</span>
              <span style={{ fontFamily: dm, fontWeight: 700, fontSize: 14, color: '#fff' }}>Feeling overwhelmed beyond study stress?</span>
            </div>
            <span style={{ fontFamily: dm, fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: '18px' }}>
              If you&apos;re going through something deeper iCall India: 9152987821 · Vandrevala Foundation: 1860-2662-345 (24/7, free, confidential)
            </span>
          </div>
          <button style={{ background: 'rgba(232,184,75,0.12)', border: '1px solid rgba(232,184,75,0.35)', borderRadius: 10, padding: '9px 20px', fontFamily: dm, fontWeight: 700, fontSize: 12, color: '#e8b84b', cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
            Get Support
          </button>
        </div>

        {/* ══ COMMUNITY WELLNESS ════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* header */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="flex items-center gap-[10px]">
              <div style={{ width: 28, height: 2, background: '#e8b84b', borderRadius: 2 }} />
              <span style={{ fontFamily: dm, fontWeight: 700, fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: '#e8b84b' }}>Community Wellness</span>
            </div>
            <h2 style={{ fontFamily: cg, fontWeight: 600, fontSize: 'clamp(26px, 3.5vw, 32px)', color: '#0c1424', margin: 0 }}>
              You&apos;re Not Alone
            </h2>
            <p style={{ fontFamily: dm, fontSize: 14, color: '#6b7a99', margin: 0 }}>
              Every aspirant here understands exactly what you&apos;re going through.
            </p>
          </div>

          {/* cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {communityCards.map((card, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid rgba(11,22,40,0.08)', borderRadius: 18, boxShadow: '0px 2px 7px rgba(11,22,40,0.07)', display: 'flex', flexDirection: 'column', padding: '24px 22px 22px', gap: 12 }}>
                <span style={{ fontSize: 28, lineHeight: '28px' }}>{card.icon}</span>
                <span style={{ fontFamily: dm, fontWeight: 700, fontSize: 16, color: '#0c1424' }}>{card.title}</span>
                <p style={{ fontFamily: dm, fontSize: 13.5, color: '#6b7a99', lineHeight: '21px', margin: 0, flex: 1 }}>{card.desc}</p>
                <span style={{ fontFamily: dm, fontWeight: 700, fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase' as const, color: card.badgeColor, background: card.badgeBg, borderRadius: 8, padding: '6px 12px', alignSelf: 'flex-start' }}>
                  {card.badge}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
