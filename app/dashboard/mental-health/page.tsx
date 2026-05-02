'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardPageHero from '@/components/DashboardPageHero';
import { mentalHealthService } from '@/lib/services';

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

const mindTools = [
  {
    icon: '🫁',
    title: 'Box Breathing',
    desc: '4-4-4-4 breathing technique to calm nerves before exams or when overwhelmed.',
    duration: 3,
    action: 'Start →',
    borderColor: 'linear-gradient(to right, #4a7c59, #4ade80)',
  },
  {
    icon: '🧘',
    title: 'Focus Meditation',
    desc: 'Guided mindfulness to sharpen concentration before a deep study session.',
    duration: 7,
    action: 'Start →',
    borderColor: 'linear-gradient(to right, #4a7fa8, #93c5fd)',
  },
  {
    icon: '📔',
    title: 'Reflective Journaling',
    desc: 'Guided prompts to process exam anxiety, self-doubt, or a difficult day.',
    duration: 5,
    action: 'Open Journal →',
    borderColor: 'linear-gradient(to right, #c99730, #e8b84b)',
  },
  {
    icon: '💫',
    title: 'Positive Affirmations',
    desc: 'UPSC-specific affirmations to rebuild confidence after a tough day or mock test.',
    duration: 2,
    action: 'Start →',
    borderColor: 'linear-gradient(to right, #c4637a, #fca5a5)',
  },
  {
    icon: '🌱',
    title: '5-4-3-2-1 Grounding',
    desc: 'Anxiety spiraling? This sensory technique brings you back to the present in minutes.',
    duration: 3,
    action: 'Start →',
    borderColor: 'linear-gradient(to right, #4a7c59, #4a7fa8)',
  },
  {
    icon: '🎯',
    title: 'Study Pressure Release',
    desc: 'Quick somatic exercise to release shoulder & neck tension after long study hours.',
    duration: 4,
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

function formatDate(d = new Date()) {
  return d.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function getDayLabel(d: Date) {
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return days[d.getDay()];
}

function isToday(d: Date) {
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

function getMoodColor(mood: string) {
  const map: Record<string, string> = {
    'On Fire!': 'linear-gradient(to bottom, #4ade80, #22c55e)',
    Great: 'linear-gradient(to bottom, #4ade80, #22c55e)',
    Good: 'linear-gradient(to bottom, #f5ce72, #e8b84b)',
    Okay: 'linear-gradient(to bottom, #93c5fd, #4a7fa8)',
    Low: 'linear-gradient(to bottom, #fca5a5, #c4637a)',
    Anxious: 'linear-gradient(to bottom, #fca5a5, #c4637a)',
    Frustrated: 'linear-gradient(to bottom, #fca5a5, #c4637a)',
    Exhausted: 'linear-gradient(to bottom, #9aa3b8, #6b7a99)',
  };
  return map[mood] || 'linear-gradient(to bottom, #9aa3b8, #6b7a99)';
}

// ── Stress gauge SVG ─────────────────────────────────────────────────────────

function StressGauge({ level = 0.5 }: { level?: number }) {
  const cx = 130, cy = 122, r = 100;
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
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(11,22,40,0.07)" strokeWidth="20" clipPath="url(#halfCircle)" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#gaugeGrad)" strokeWidth="18" clipPath="url(#halfCircle)" />
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#101d36" strokeWidth="3" strokeLinecap="round" />
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
  const [saving, setSaving] = useState(false);

  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [stress, setStress] = useState<{ level: number; label: string; tips: string[] }>({ level: 0.5, label: 'Moderate', tips: [] });
  const [dailyContent, setDailyContent] = useState<{ tip: string; affirmation: string } | null>(null);
  const [toolStats, setToolStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [affIdx, setAffIdx] = useState(0);

  const dm = 'var(--font-dm-sans), Inter, sans-serif';
  const cg = 'var(--font-cormorant), Georgia, serif';

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [streakRes, checkInsRes, stressRes, contentRes, statsRes] = await Promise.all([
        mentalHealthService.getStreak(),
        mentalHealthService.getCheckIns(7),
        mentalHealthService.getStressIndex(7),
        mentalHealthService.getDailyContent(),
        mentalHealthService.getToolStats(),
      ]);

      setStreak(streakRes.data?.currentStreak ?? 0);
      setLongestStreak(streakRes.data?.longestStreak ?? 0);
      setCheckIns(checkInsRes.data ?? []);
      setStress({
        level: stressRes.data?.level ?? 0.5,
        label: stressRes.data?.label ?? 'Moderate',
        tips: stressRes.data?.tips ?? [],
      });
      setDailyContent(contentRes.data ?? null);
      setToolStats(statsRes.data ?? []);

      // Pre-fill today's check-in if exists
      const todayCheckIn = (checkInsRes.data ?? []).find((c: any) => {
        const d = new Date(c.date);
        return isToday(d);
      });
      if (todayCheckIn) {
        setMood(todayCheckIn.mood);
        setEnergy(todayCheckIn.energy * 10);
        setNote(todayCheckIn.note || '');
      }
    } catch (err) {
      console.error('Failed to load mental health data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveCheckIn = async () => {
    try {
      setSaving(true);
      await mentalHealthService.saveCheckIn({
        mood,
        energy: Math.max(1, Math.round(energy / 10)),
        note: note || undefined,
      });
      await loadData();
    } catch (err) {
      console.error('Failed to save check-in', err);
      alert('Failed to save check-in. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleStartTool = async (tool: typeof mindTools[0]) => {
    try {
      await mentalHealthService.saveToolSession({
        toolType: tool.title,
        duration: tool.duration,
        completed: true,
      });
      const statsRes = await mentalHealthService.getToolStats();
      setToolStats(statsRes.data ?? []);
      alert(`Great job completing ${tool.title}! 🎉`);
    } catch (err) {
      console.error('Failed to save tool session', err);
    }
  };

  // Build last 7 days mood journey
  const moodDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = getDayLabel(d);
    const checkIn = checkIns.find((c: any) => {
      const cd = new Date(c.date);
      return cd.getFullYear() === d.getFullYear() && cd.getMonth() === d.getMonth() && cd.getDate() === d.getDate();
    });
    return {
      label,
      color: checkIn ? getMoodColor(checkIn.mood) : 'linear-gradient(to bottom, #e5e7eb, #d1d5db)',
      today: isToday(d),
      mood: checkIn?.mood ?? null,
    };
  });

  const positiveDays = checkIns.filter((c: any) =>
    ['Good', 'Great', 'On Fire!'].includes(c.mood)
  ).length;
  const avgScore = checkIns.length > 0
    ? (checkIns.reduce((sum: number, c: any) => sum + (c.energy ?? 5), 0) / checkIns.length).toFixed(1)
    : '0.0';

  const weekDays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((key, idx) => {
    const d = new Date();
    const dayOffset = (d.getDay() + 6) % 7; // Monday = 0
    const target = new Date(d);
    target.setDate(d.getDate() - dayOffset + idx);
    const hasCheckIn = checkIns.some((c: any) => {
      const cd = new Date(c.date);
      return cd.getFullYear() === target.getFullYear() && cd.getMonth() === target.getMonth() && cd.getDate() === target.getDate();
    });
    const isToday = target.getDay() === d.getDay();
    const icons = ['🧘','📔','🚶','🫁','📔','🌿','📋'];
    const labels = ['Morning\nmeditation','Journaling','10 min walk','Breathing','Weekly\nreview','Rest +\nNature','Week\nplanning'];
    return {
      key: isToday ? 'TODAY' : key,
      emoji: icons[idx],
      label: labels[idx],
      status: hasCheckIn ? 'done' : isToday ? 'today' : 'future' as 'done' | 'today' | 'future',
    };
  });

  const affirmations = dailyContent
    ? [dailyContent.affirmation]
    : ['The UPSC exam tests your consistency, not your brilliance. Show up every single day and the result will take care of itself.'];

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
          { value: String(streak || 0), label: 'Day Streak', color: '#4ADE80' },
          { value: '∞', label: 'Always Free', color: '#FFFFFF' },
        ]}
      />

      <div className="mx-auto max-w-[1040px] px-4 py-8" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ══ DAILY CHECK-IN CARD ══════════════════════════════════════════════ */}
        <div className="relative overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(11,22,40,0.08)', borderRadius: 20, boxShadow: '0px 8px 36px rgba(11,22,40,0.11)', padding: '33px 37px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div className="absolute left-0 right-0 top-0" style={{ height: 4, background: 'linear-gradient(to right, #4a7c59, #e8b84b 50%, #c4637a)' }} />

          <div className="flex items-start justify-between mb-3">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontFamily: cg, fontWeight: 600, fontSize: 25.6, color: '#0c1424' }}>Daily Check-In</span>
              <span style={{ fontFamily: dm, fontSize: 13, color: '#6b7a99' }}>{formatDate()} · Takes 60 seconds</span>
            </div>
            <div style={{ background: 'rgba(232,184,75,0.11)', border: '1px solid rgba(232,184,75,0.28)', borderRadius: 12, padding: '10px 17px 11px', textAlign: 'center' as const, minWidth: 64 }}>
              <div style={{ fontFamily: cg, fontWeight: 700, fontSize: 22.4, color: '#c99730', lineHeight: '22.4px' }}>{streak}</div>
              <div style={{ fontFamily: dm, fontSize: 11, color: '#6b7a99', lineHeight: '14.3px' }}>day<br />streak 🔥</div>
            </div>
          </div>

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

          <div style={{ paddingTop: 24 }}>
            <div style={{ fontFamily: dm, fontWeight: 700, fontSize: 11, letterSpacing: '1.1px', textTransform: 'uppercase' as const, color: '#9aa3b8', marginBottom: 12 }}>Energy level today</div>
            <div className="flex items-center gap-[14px]">
              <span style={{ fontSize: 18 }}>🪫</span>
              <input type="range" min={0} max={100} value={energy} onChange={e => setEnergy(+e.target.value)} className="energy-slider flex-1" />
              <span style={{ fontSize: 18 }}>⚡</span>
              <span style={{ fontFamily: dm, fontWeight: 600, fontSize: 13, color: '#374560', minWidth: 70, textAlign: 'center' as const }}>{getEnergyLabel(energy)}</span>
            </div>
          </div>

          <div style={{ paddingTop: 24 }}>
            <div style={{ fontFamily: dm, fontWeight: 700, fontSize: 11, letterSpacing: '1.1px', textTransform: 'uppercase' as const, color: '#9aa3b8', marginBottom: 12 }}>
              One thing on your mind <span style={{ fontWeight: 400, textTransform: 'none' as const, letterSpacing: 0 }}>(optional)</span>
            </div>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={4}
              placeholder="Write anything — a worry, a win, a thought, or simply how you feel right now. No one else sees this."
              style={{ width: '100%', background: 'rgba(255,255,255,0.8)', border: '1px solid #8fa4be', borderRadius: 12, padding: '14px 17px', fontFamily: cg, fontStyle: 'italic', fontSize: 16, lineHeight: '27.2px', color: '#0c1424', outline: 'none', resize: 'vertical', boxSizing: 'border-box' as const }} />
          </div>

          <div className="flex items-center justify-between" style={{ paddingTop: 12 }}>
            <span style={{ fontFamily: dm, fontSize: 12, color: '#9aa3b8' }}>🔒 Your check-ins are private and never shared.</span>
            <button
              onClick={handleSaveCheckIn}
              disabled={saving}
              style={{ background: '#090e1c', border: 'none', borderRadius: 10, padding: '11px 28px', fontFamily: dm, fontWeight: 700, fontSize: 14, color: '#e8b84b', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Saving...' : 'Save Check-In ✓'}
            </button>
          </div>
        </div>

        {/* ══ TWO-COLUMN ROW ════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── LEFT: This Week ── */}
          <div style={{ background: '#fff', border: '1px solid rgba(11,22,40,0.08)', borderRadius: 18, boxShadow: '0px 2px 7px rgba(11,22,40,0.07)', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            <div className="flex items-center gap-[10px]">
              <div style={{ width: 28, height: 2, background: '#e8b84b', borderRadius: 2 }} />
              <span style={{ fontFamily: dm, fontWeight: 700, fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: '#e8b84b' }}>This Week</span>
            </div>

            <div style={{ border: '1px solid rgba(11,22,40,0.08)', borderRadius: 18, overflow: 'hidden', boxShadow: '0px 2px 14px rgba(11,22,40,0.07)' }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(11,22,40,0.08)' }}>
                <span style={{ fontFamily: cg, fontWeight: 600, fontSize: 17.6, color: '#0c1424' }}>🗓 Weekly Wellness Plan</span>
                <button style={{ fontFamily: dm, fontWeight: 600, fontSize: 12, color: '#c99730', background: 'none', border: 'none', cursor: 'pointer' }}>Customize</button>
              </div>

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

            <div>
              <h3 style={{ fontFamily: cg, fontWeight: 600, fontSize: 19.2, color: '#0c1424', margin: '0 0 12px' }}>Your Mood Journey</h3>

              <div className="grid grid-cols-7 gap-0 mb-4">
                {moodDays.map(d => (
                  <div key={d.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ height: 4, width: '90%', borderRadius: '6px 6px 0 0', background: d.color }} />
                    <span style={{ fontFamily: dm, fontWeight: d.today ? 700 : 600, fontSize: 10, color: d.today ? '#c99730' : '#9aa3b8' }}>{d.label}</span>
                    {d.mood && <span style={{ fontSize: 10 }}>{d.mood}</span>}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div style={{ background: 'rgba(11,22,40,0.08)', borderRadius: 10, padding: '9px 14px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontFamily: cg, fontWeight: 700, fontSize: 20.8, color: '#4a7c59', lineHeight: '20.8px' }}>🟢 {positiveDays}/{checkIns.length || 1}</span>
                  <span style={{ fontFamily: dm, fontSize: 10, color: '#9aa3b8' }}>Positive days</span>
                </div>
                <div style={{ background: 'rgba(11,22,40,0.08)', borderRadius: 10, padding: '9px 14px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontFamily: cg, fontWeight: 700, fontSize: 20.8, color: '#c99730', lineHeight: '20.8px' }}>{avgScore}</span>
                  <span style={{ fontFamily: dm, fontSize: 10, color: '#9aa3b8' }}>Avg wellness score</span>
                </div>
                <div style={{ background: 'rgba(11,22,40,0.08)', borderRadius: 10, padding: '9px 14px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontFamily: cg, fontWeight: 700, fontSize: 20.8, color: '#4a7fa8', lineHeight: '20.8px' }}>{streak}🔥</span>
                  <span style={{ fontFamily: dm, fontSize: 10, color: '#9aa3b8' }}>Check-in streak</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: UPSC Stress Index ── */}
          <div style={{ background: '#fff', border: '1px solid rgba(11,22,40,0.08)', borderRadius: 18, boxShadow: '0px 2px 7px rgba(11,22,40,0.07)', padding: '24px', display: 'flex', flexDirection: 'column', gap: 0 }}>

            <div className="flex items-center gap-[10px] mb-3">
              <div style={{ width: 28, height: 2, background: '#e8b84b', borderRadius: 2 }} />
              <span style={{ fontFamily: dm, fontWeight: 700, fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: '#e8b84b' }}>UPSC Stress Index</span>
            </div>

            <h3 style={{ fontFamily: cg, fontWeight: 600, fontSize: 19.2, color: '#0c1424', margin: '0 0 4px' }}>Your Pressure Level</h3>

            <div className="flex flex-col items-center" style={{ marginTop: 8, marginBottom: 4 }}>
              <StressGauge level={stress.level} />
              <span style={{ fontFamily: cg, fontWeight: 700, fontSize: 20.8, color: stress.level > 0.65 ? '#c4637a' : stress.level > 0.35 ? '#d97706' : '#4a7c59', marginTop: -8 }}>
                {stress.label} {stress.level > 0.65 ? '⛈' : stress.level > 0.35 ? '🌤' : '☀'}
              </span>
              <span style={{ fontFamily: dm, fontSize: 12, color: '#6b7a99', marginTop: 4, textAlign: 'center' as const }}>
                {stress.tips[0] || "You're managing well. A few mindful practices will keep you steady."}
              </span>
            </div>

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column' }}>
              {(stress.tips.slice(1).length ? stress.tips.slice(1) : ['Take 5 minutes of box breathing before your study session', 'Spend 10 min outside — sunlight resets cortisol naturally', "Write tomorrow's 3 tasks tonight — reduces morning anxiety"]).map((tip, i, arr) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '7px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(11,22,40,0.08)' : 'none' }}>
                  <span style={{ fontSize: 14, lineHeight: '21.7px', flexShrink: 0 }}>{['🧘','🌿','📋'][i]}</span>
                  <span style={{ fontFamily: dm, fontSize: 12, color: '#6b7a99', lineHeight: '18.6px' }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ AFFIRMATION CARD ══════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden" style={{ background: '#0c1424', border: '1px solid rgba(232,184,75,0.18)', borderRadius: 18, padding: '29px 33px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="absolute pointer-events-none" style={{ right: -80, top: -80, width: 240, height: 240, background: 'radial-gradient(circle at 50% 50%, rgba(232,184,75,0.08) 0%, rgba(232,184,75,0) 65%)' }} />

          <div style={{ position: 'relative', paddingLeft: 24 }}>
            <span style={{ position: 'absolute', left: 0, top: -4, fontFamily: cg, fontStyle: 'italic', fontSize: 48, color: '#e8b84b', opacity: 0.4, lineHeight: '48px' }}>&ldquo;</span>
            <p style={{ fontFamily: cg, fontStyle: 'italic', fontSize: 21.6, color: '#fff', lineHeight: '34.56px', margin: 0 }}>
              {affirmations[affIdx % affirmations.length]}
            </p>
          </div>

          <span style={{ fontFamily: dm, fontSize: 12, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.72px' }}>
            Daily Affirmation · Day {streak} of your journey
          </span>

          <div className="flex items-center gap-[10px]">
            <button onClick={() => setAffIdx(i => i + 1)} style={{ background: '#e8b84b', border: 'none', borderRadius: 8, padding: '8px 18px', fontFamily: dm, fontWeight: 700, fontSize: 12, color: '#090e1c', cursor: 'pointer' }}>
              Next Affirmation →
            </button>
            <button style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 19px', fontFamily: dm, fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
              🔖 Save
            </button>
            <span style={{ fontFamily: dm, fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>
              {affIdx + 1} of {affirmations.length} affirmations
            </span>
          </div>
        </div>

        {/* ══ TOOLS FOR YOUR MIND ═══════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mindTools.map((tool, i) => {
              const stat = toolStats.find((s: any) => s.toolType === tool.title);
              return (
                <div key={i} style={{ background: '#fff', border: '1px solid rgba(11,22,40,0.08)', borderRadius: 16, overflow: 'hidden', boxShadow: '0px 2px 7px rgba(11,22,40,0.07)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: 4, background: tool.borderColor }} />
                  <div style={{ padding: '20px 22px 18px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                    <span style={{ fontSize: 26, lineHeight: '26px' }}>{tool.icon}</span>
                    <span style={{ fontFamily: dm, fontWeight: 700, fontSize: 15.5, color: '#0c1424' }}>{tool.title}</span>
                    <p style={{ fontFamily: dm, fontSize: 13, color: '#6b7a99', lineHeight: '20px', margin: 0, flex: 1 }}>{tool.desc}</p>
                    {stat && (
                      <span style={{ fontFamily: dm, fontSize: 11, color: '#4a7c59' }}>
                        ✅ {stat.sessions} sessions · {stat.totalMinutes} min
                      </span>
                    )}
                    <div className="flex items-center justify-between" style={{ paddingTop: 6 }}>
                      <span style={{ fontFamily: dm, fontSize: 12, color: '#9aa3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9aa3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {tool.duration} min
                      </span>
                      <button
                        onClick={() => handleStartTool(tool)}
                        style={{ fontFamily: dm, fontWeight: 700, fontSize: 12, color: '#c99730', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                      >
                        {tool.action}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
