'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { dailyAnswerService } from '@/lib/services';
import Link from 'next/link';

interface QuestionData {
  id: string;
  questionText: string;
  paper: string;
  subject: string;
  marks: number;
  wordLimit: number;
  timeLimit: number;
  attemptCount: number;
}

type DailyAnswerSubmitResponse = {
  attemptId?: string;
  status?: string;
  message?: string;
  data?: {
    attemptId?: string;
    status?: string;
    data?: {
      attemptId?: string;
    };
  };
};

const READING_WINDOW_SECONDS = 15;

const PAST_CHALLENGES: Array<{
  paper: string; subject: string; subjectBg: string; subjectColor: string;
  date: string; text: string; score: string; note: string;
}> = [
  {
    paper: 'GS2', subject: 'Science & Technology',
    subjectBg: '#CCFBF1', subjectColor: '#0F766E',
    date: 'Yesterday',
    text: 'What are biosimilars? Discuss how the Biopharma Shakti initiative can help improve access to biological therapies in India.',
    score: '8/10', note: 'Your best this week!',
  },
  {
    paper: 'GS2', subject: 'Environment & Ecology',
    subjectBg: '#DCFCE7', subjectColor: '#15803D',
    date: '9 Feb, 2026',
    text: '"The approval of irrigation projects within tiger reserves reflects the complex trade-off between developmental needs and wildlife conservation." Discuss this statement with reference to the Kopra irrigation project in the Veerangana...',
    score: '6.5/10', note: 'Words: 242',
  },
  {
    paper: 'GS2', subject: 'Environment & Ecology',
    subjectBg: '#DCFCE7', subjectColor: '#15803D',
    date: '8 Feb, 2026',
    text: '"The approval of irrigation projects within tiger reserves reflects the complex trade-off between developmental needs and wildlife conservation." Discuss this statement with reference to the Kopra irrigation project in the Veerangana...',
    score: '6.5/10', note: 'Words: 242',
  },
];

type CalDay = { label: string; bg?: string; color: string; bold?: boolean };
const CALENDAR_DAYS: CalDay[] = [
  { label: '26', color: '#D1D5DB' }, { label: '27', color: '#D1D5DB' },
  { label: '28', color: '#D1D5DB' }, { label: '29', color: '#D1D5DB' },
  { label: '30', color: '#D1D5DB' }, { label: '31', color: '#D1D5DB' },
  { label: '1', color: '#101828' },
  { label: '2', color: '#101828' }, { label: '3', color: '#101828' },
  { label: '4', color: '#101828' }, { label: '5', color: '#101828' },
  { label: '6', bg: '#A7F3D0', color: '#065F46' },
  { label: '7', bg: '#A7F3D0', color: '#065F46' },
  { label: '8', bg: '#A7F3D0', color: '#065F46' },
  { label: '9', bg: '#A7F3D0', color: '#065F46' },
  { label: '10', bg: '#EF4444', color: '#FFFFFF' },
  { label: '11', bg: '#A7F3D0', color: '#065F46' },
  { label: '12', bg: '#0F766E', color: '#FFFFFF', bold: true },
  { label: '13', color: '#101828' }, { label: '14', color: '#101828' },
  { label: '15', color: '#101828' },
];

const ACHIEVEMENTS = [
  { icon: '/badge-consistency.png', name: 'Consistency', desc: '14-day streak', locked: false },
  { icon: '/badge-speed-writer.png', name: 'Speed Writer', desc: '5 under 10 min', locked: false },
  { icon: '/badge-structure.png', name: 'Structure', desc: 'Perfect 3/3', locked: false },
  { icon: '/badge-data-master.png', name: 'Data Master', desc: '10+ data points', locked: false },
  { icon: '/badge-content-king.png', name: 'Content King', desc: 'Score 8+ in 5 answers', locked: true },
  { icon: '/badge-most-improved.png', name: 'Most Improved', desc: 'Week 2 Progress champion', locked: true },
];

const LEADERBOARD: Array<{ rank: number; name: string; score: string; medal?: string }> = [
  { rank: 1, name: 'John Doe', score: '998.5', medal: '/medal-gold.png' },
  { rank: 2, name: 'Shubham Bharti', score: '948', medal: '/medal-silver.png' },
  { rank: 3, name: 'Manish Singh', score: '931.5', medal: '/medal-bronze.png' },
  { rank: 4, name: 'John Doe', score: '998.5' },
  { rank: 5, name: 'Shubham Bharti', score: '948' },
  { rank: 6, name: 'Manish Singh', score: '931.5' },
  { rank: 7, name: 'John Doe', score: '998.5' },
  { rank: 8, name: 'Shubham Bharti', score: '948' },
  { rank: 9, name: 'Manish Singh', score: '931.5' },
  { rank: 10, name: 'Manish Singh', score: '931.5' },
];

export default function DailyMainsChallengeContextPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [data, setData] = useState<QuestionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [challengeStarted, setChallengeStarted] = useState(false);
  const [textExpanded, setTextExpanded] = useState(false);
  const [readTimeLeft, setReadTimeLeft] = useState<number | null>(null);

  // Timer
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [isActive, setIsActive] = useState(false);

  // Answer
  const [answerText, setAnswerText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    dailyAnswerService.getFullQuestion()
      .then(res => {
        setData(res.data);
        if (res.data?.timeLimit) setTimeLeft(res.data.timeLimit * 60);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      if (interval) clearInterval(interval);
      setIsActive(false);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, timeLeft]);

  useEffect(() => {
    if (!challengeStarted || readTimeLeft === null) return;

    if (readTimeLeft <= 0) {
      setReadTimeLeft(null);
      setIsActive(true);
      return;
    }

    const timer = setTimeout(() => {
      setReadTimeLeft((prev) => (prev === null ? null : prev - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [challengeStarted, readTimeLeft]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const timerPct = data?.timeLimit ? (timeLeft / (data.timeLimit * 60)) * 100 : (timeLeft / 900) * 100;
  const circumference = 2 * Math.PI * 44;

  const handleBeginChallenge = () => {
    setChallengeStarted(true);
    setIsActive(false);
    setReadTimeLeft(READING_WINDOW_SECONDS);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setSubmitError('File size must be less than 10MB'); return; }
    setSelectedFile(file);
    setSubmitError(null);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setSubmitError('File size must be less than 10MB'); return; }
    const valid = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!valid.includes(file.type)) { setSubmitError('Invalid file type. Please upload JPG, PNG, PDF, or DOCX'); return; }
    setSelectedFile(file);
    setSubmitError(null);
  };

  const handleSubmit = async () => {
    if (!answerText.trim() && !selectedFile) {
      setSubmitError('Please write your answer or upload a file before submitting.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = (selectedFile
        ? await dailyAnswerService.uploadFile(selectedFile)
        : await dailyAnswerService.submitText(answerText)) as DailyAnswerSubmitResponse;
      const attemptId = res.attemptId || res.data?.attemptId || res.data?.data?.attemptId;
      if (attemptId && typeof window !== 'undefined') {
        sessionStorage.setItem('dailyAnswerAttemptId', attemptId);
      }
      router.push('/dashboard/daily-answer/challenge/attempt/evaluating');
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit answer. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex bg-[#F3F4F6] font-arimo" style={{ height: '100%', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex bg-[#F3F4F6] font-arimo" style={{ height: '100%', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Could not load question</h2>
          <p className="text-gray-500">{error || 'Please try again later.'}</p>
          <Link href="/dashboard/daily-answer" className="mt-4 inline-block text-blue-600 hover:underline">Back</Link>
        </div>
      </div>
    );
  }

  // ── PRE-CHALLENGE: single screen, no scroll ────────────────────────────────
  if (!challengeStarted) {
    return (
      <div className="flex flex-col bg-[#F3F4F6] font-arimo" style={{ minHeight: '100%', overflowY: 'auto' }}>
        <div className="flex-1 flex flex-col items-center px-6 py-8 w-full max-w-[1200px] mx-auto">

          {/* Badge */}
          <div
            className="flex items-center justify-center gap-2 px-4 py-1.5 mb-4"
            style={{ borderRadius: '26px', border: '0.8px solid #E9D4FF', background: '#FAF5FF', width: 'fit-content' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Icon%20(5).png" alt="" style={{ width: '16px', height: '16px' }} />
            <span style={{ color: '#8200DB', fontSize: '14px', fontWeight: 500 }}>Practice. Evaluate. Improve</span>
          </div>

          {/* Title */}
          <h1
            className="text-center text-[#17223E] mb-3"
            style={{ fontSize: 'clamp(28px, 3vw, 42px)', lineHeight: '1.2', fontWeight: 400 }}
          >
            <span className="block">Daily Answer Writing with</span>
            <span className="block">Detailed Feedback &amp; Evaluation</span>
          </h1>

          {/* Description */}
          <p className="text-center text-[#4A5565] mb-6 px-4" style={{ fontSize: '15px', lineHeight: '22px', maxWidth: '720px' }}>
            Practice one UPSC level question every day. Get structured feedback,
            personalized insights, model answers, and actionable improvement points to steadily boost your mains scores.
          </p>

          {/* Question Card */}
          <div
            className="relative rounded-[24px] w-full"
            style={{ maxWidth: '1091px', boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A', padding: '24px 32px', background: '#FFFFFF' }}
          >
            {/* Tags row */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex gap-3">
                <div className="flex items-center px-3 py-1.5 rounded-[10px]" style={{ background: '#FAF5FF', boxShadow: '0px 1px 2px -1px #0000001A' }}>
                  <span style={{ fontSize: '14px', color: '#8200DB' }}>{data.paper}</span>
                </div>
                <div className="flex items-center px-3 py-1.5 bg-[#EFF6FF] rounded-[10px]" style={{ boxShadow: '0px 1px 2px -1px #0000001A' }}>
                  <span style={{ fontSize: '14px', color: '#1447E6' }}>{data.subject}</span>
                </div>
              </div>
              <div className="flex items-center px-4 py-1 gap-2" style={{ background: '#FEF2F2', border: '0.8px solid #FFC9C9', borderRadius: '20px' }}>
                <div className="w-2 h-2 rounded-full bg-[#DC2626]" />
                <span style={{ color: '#DC2626', fontSize: '12px', fontWeight: 700 }}>LIVE NOW</span>
              </div>
            </div>

            {/* Question */}
            <div className="mb-5 p-5 rounded-[10px] bg-[#F9FAFB]" style={{ boxShadow: '0px 1px 2px -1px #0000001A' }}>
              <p className="text-[#101828] font-bold" style={{ fontSize: '16px', lineHeight: '26px' }}>
                &quot;{data.questionText}&quot;
              </p>
            </div>

            {/* Meta + Actions */}
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-8 text-[#4A5565]" style={{ fontSize: '14px' }}>
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/Icon%20(8).png" alt="" style={{ width: '20px', height: '20px' }} />
                  <span>Time: {data.timeLimit} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/Icon%20(7).png" alt="" style={{ width: '20px', height: '20px' }} />
                  <span>Word limit: {data.wordLimit} words</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/Icon%20(6).png" alt="" style={{ width: '20px', height: '20px' }} />
                  <span>Marks: {data.marks}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <button
                    onClick={handleBeginChallenge}
                    className="bg-[#17223E] text-white flex items-center justify-center gap-2 transition-transform hover:scale-105"
                    style={{ width: '195px', height: '52px', borderRadius: '14px', fontSize: '17px', fontWeight: 700, boxShadow: '0px 10px 15px -3px rgba(0,0,0,0.1)' }}
                  >
                    🚀 Begin Challenge
                  </button>
                  <button
                    className="bg-[#17223E] text-white flex items-center justify-center gap-2 transition-transform hover:scale-105"
                    style={{ width: '260px', height: '52px', borderRadius: '14px', fontSize: '16px', fontWeight: 700, boxShadow: '0px 10px 15px -3px rgba(0,0,0,0.1)' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/Icon%20(9).png" alt="" style={{ width: '24px', height: '24px' }} />
                    Attempt Challenge on App
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-blue-400 border-2 border-white" />
                    <div className="w-8 h-8 rounded-full bg-green-400 border-2 border-white" />
                    <div className="w-8 h-8 rounded-full bg-purple-400 border-2 border-white" />
                  </div>
                  <span className="text-[#4A5565]" style={{ fontSize: '14px' }}>{data.attemptCount}+ Students already attempted</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Past Challenges ── */}
          <div className="w-full mt-10" style={{ maxWidth: '1091px' }}>
            <div
              className="rounded-[16px] bg-white"
              style={{ boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A', padding: '22px 26px' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icon-folder.png" alt="" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                  <h2 className="font-bold text-[#101828]" style={{ fontSize: '18px' }}>Past Challenges</h2>
                </div>
                <Link href="/dashboard/daily-answer" className="text-[#0F766E] hover:underline" style={{ fontSize: '13px', fontWeight: 500 }}>
                  View All →
                </Link>
              </div>
              <div className="flex flex-col gap-3">
                {PAST_CHALLENGES.map((c, i) => (
                  <div
                    key={i}
                    className="rounded-[10px] bg-[#F9FAFB]"
                    style={{ borderLeft: '3px solid #17223E', padding: '14px 18px' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold" style={{ background: '#2B7FFF', fontSize: '12px', padding: '4px 12px', borderRadius: '999px' }}>{c.paper}</span>
                        <span className="font-medium" style={{ background: c.subjectBg, color: c.subjectColor, fontSize: '12px', padding: '4px 12px', borderRadius: '999px' }}>{c.subject}</span>
                      </div>
                      <span className="text-[#6A7282]" style={{ fontSize: '12px' }}>{c.date}</span>
                    </div>
                    <p className="text-[#101828] font-bold mb-2" style={{ fontSize: '14px', lineHeight: '20px' }}>{c.text}</p>
                    <p className="text-[#4A5565]" style={{ fontSize: '12px' }}>
                      Score: <span className="font-bold text-[#101828]">{c.score}</span> · {c.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Two-column: (Calendar + Progress + Achievements) | Mains League ── */}
          <div className="w-full mt-5 grid" style={{ maxWidth: '1091px', gridTemplateColumns: '1fr 1.25fr', gap: '20px', alignItems: 'start' }}>

            {/* LEFT COLUMN */}
            <div className="flex flex-col gap-5">

              {/* Calendar */}
              <div className="bg-white rounded-[16px]" style={{ padding: '20px 22px', boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icon-calendar.png" alt="" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                    <span className="font-bold text-[#101828]" style={{ fontSize: '15px' }}>February 2026</span>
                  </div>
                  <Link href="#" className="text-[#0F766E] hover:underline" style={{ fontSize: '12px', fontWeight: 500 }}>Month →</Link>
                </div>
                <div className="grid grid-cols-7" style={{ gap: '6px' }}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                    <div key={`dow-${i}`} className="text-center text-[#6A7282]" style={{ fontSize: '12px', fontWeight: 600, padding: '4px 0' }}>{d}</div>
                  ))}
                  {CALENDAR_DAYS.map((day, i) => (
                    <div
                      key={`d-${i}`}
                      className="flex items-center justify-center rounded-md"
                      style={{
                        height: '34px',
                        fontSize: '12px',
                        fontWeight: day.bold ? 700 : 600,
                        background: day.bg || 'transparent',
                        color: day.color,
                      }}
                    >
                      {day.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Your Progress */}
              <div className="bg-white rounded-[16px]" style={{ padding: '20px 22px', boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icon-progress-chart.png" alt="" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                    <span className="font-bold text-[#101828]" style={{ fontSize: '15px' }}>Your Progress</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-lg" style={{ background: '#DCFCE7' }}>
                    <span className="font-bold" style={{ color: '#15803D', fontSize: '16px' }}>47</span>
                    <div className="flex flex-col leading-tight">
                      <span className="font-bold" style={{ color: '#15803D', fontSize: '11px' }}>Day Streak</span>
                      <span style={{ color: '#15803D', fontSize: '10px' }}>Keep going!</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-around items-end">
                  <div className="text-center">
                    <div className="font-bold text-[#101828]" style={{ fontSize: '28px', lineHeight: '32px' }}>89</div>
                    <div className="text-[#4A5565] mt-1" style={{ fontSize: '12px' }}>Questions Attempted</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-[#101828]" style={{ fontSize: '28px', lineHeight: '32px' }}>7.2</div>
                    <div className="text-[#4A5565] mt-1" style={{ fontSize: '12px' }}>Avg. Score / 10</div>
                  </div>
                </div>
              </div>

              {/* Achievements */}
              <div className="bg-white rounded-[16px]" style={{ padding: '20px 22px', boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icon-trophy.png" alt="" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                    <span className="font-bold text-[#101828]" style={{ fontSize: '15px' }}>Achievements</span>
                  </div>
                  <Link href="#" className="text-[#0F766E] hover:underline" style={{ fontSize: '12px', fontWeight: 500 }}>All Badges →</Link>
                </div>
                <div className="grid grid-cols-2" style={{ gap: '10px' }}>
                  {ACHIEVEMENTS.map((a, i) => (
                    <div
                      key={i}
                      className="rounded-[10px] text-center"
                      style={{
                        padding: '14px 10px',
                        background: a.locked ? '#F3F4F6' : 'rgba(232, 184, 75, 0.14)',
                        border: a.locked ? '1px solid #E5E7EB' : '1px solid rgba(232, 184, 75, 0.35)',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.icon} alt={a.name} style={{ width: '32px', height: '32px', objectFit: 'contain', margin: '0 auto 4px' }} />
                      <div className="font-bold text-[#101828]" style={{ fontSize: '13px' }}>{a.name}</div>
                      <div className="text-[#6A7282] mt-0.5" style={{ fontSize: '11px' }}>{a.desc}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-center text-[#6A7282]" style={{ fontSize: '11px', lineHeight: '16px' }}>
                  Next milestone: <span className="font-bold text-[#101828]">&quot;Data &amp; Examples Pro&quot;</span> badge<br />
                  Add 5+ data points in a week (3 more to go!)
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Mains League */}
            <div className="bg-white rounded-[16px]" style={{ padding: '20px 22px', boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icon-medal.png" alt="" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                  <span className="font-bold text-[#101828]" style={{ fontSize: '15px', background: '#E8B84B', padding: '0 6px', borderRadius: '2px' }}>Mains League</span>
                </div>
                <Link href="#" className="text-[#0F766E] hover:underline" style={{ fontSize: '12px', fontWeight: 500 }}>View All →</Link>
              </div>
              <div className="flex flex-col gap-2">
                {LEADERBOARD.map((row, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg"
                    style={{ background: '#F9FAFB', padding: '8px 14px' }}
                  >
                    <div className="flex items-center gap-3">
                      <span style={{ width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        {row.medal && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={row.medal} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                        )}
                      </span>
                      <div className="rounded-full bg-[#2B7FFF] text-white flex items-center justify-center font-bold" style={{ width: '28px', height: '28px', fontSize: '12px' }}>{row.rank}</div>
                      <span className="font-bold text-[#101828]" style={{ fontSize: '13px' }}>{row.name}</span>
                    </div>
                    <span className="font-bold text-[#0F766E]" style={{ fontSize: '13px' }}>{row.score}</span>
                  </div>
                ))}
                <div
                  className="flex items-center justify-between rounded-lg mt-2"
                  style={{ border: '2px solid #2B7FFF', background: '#EFF6FF', padding: '8px 14px' }}
                >
                  <div className="flex items-center gap-3">
                    <span style={{ width: '22px', display: 'inline-block' }} />
                    <div className="rounded-full bg-[#2B7FFF] text-white flex items-center justify-center font-bold" style={{ width: '28px', height: '28px', fontSize: '12px' }}>53</div>
                    <span className="text-[#101828]" style={{ fontSize: '13px' }}>You · 7.2 avg · 14 streak</span>
                  </div>
                  <span className="font-bold text-[#15803D]" style={{ fontSize: '13px' }}>+2 ↑</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ── CHALLENGE STARTED: question + timer side-by-side, answer below ─────────
  return (
    <div className="bg-[#F3F4F6] font-arimo" style={{ height: '100%', overflowY: 'auto' }}>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .slide-up { animation: slideUp 0.35s ease forwards; }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="flex flex-col px-6 py-5 w-full max-w-[1200px] mx-auto slide-up">

        {/* ── Row 1: Compact question (left) + Timer (right) ── */}
        <div className="flex gap-5 mb-5">

          {/* Compact Question Card */}
          <div
            className="flex-1 bg-white rounded-[20px]"
            style={{ padding: '20px 24px', boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A' }}
          >
            {/* Tags */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center px-3 py-1 rounded-[8px]" style={{ background: '#FAF5FF' }}>
                <span style={{ fontSize: '13px', color: '#8200DB' }}>{data.paper}</span>
              </div>
              <div className="flex items-center px-3 py-1 bg-[#EFF6FF] rounded-[8px]">
                <span style={{ fontSize: '13px', color: '#1447E6' }}>{data.subject}</span>
              </div>
              <div className="ml-auto flex items-center px-3 py-1 gap-2" style={{ background: '#FEF2F2', border: '0.8px solid #FFC9C9', borderRadius: '20px' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                <span style={{ color: '#DC2626', fontSize: '11px', fontWeight: 700 }}>LIVE NOW</span>
              </div>
            </div>

            {/* Question text */}
            <div className="rounded-[10px] bg-[#F9FAFB] p-4 mb-4" style={{ boxShadow: '0px 1px 2px -1px #0000001A' }}>
              <p className="text-[#101828] font-bold" style={{ fontSize: '15px', lineHeight: '25px' }}>
                &quot;{data.questionText}&quot;
              </p>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-6 text-[#4A5565]" style={{ fontSize: '13px' }}>
              <div className="flex items-center gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Icon%20(8).png" alt="" style={{ width: '16px', height: '16px' }} />
                <span>{data.timeLimit} min</span>
              </div>
              <div className="flex items-center gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Icon%20(7).png" alt="" style={{ width: '16px', height: '16px' }} />
                <span>{data.wordLimit} words</span>
              </div>
              <div className="flex items-center gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Icon%20(6).png" alt="" style={{ width: '16px', height: '16px' }} />
                <span>{data.marks} marks</span>
              </div>
            </div>
          </div>

          {/* Timer Card */}
          <div
            className="bg-white rounded-[20px] flex flex-col items-center justify-center"
            style={{ width: '260px', flexShrink: 0, padding: '20px', boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A' }}
          >
            <div className="uppercase tracking-widest text-[#6A7282] mb-3" style={{ fontSize: '11px', fontWeight: 600 }}>
              Writing Timer
            </div>

            {/* SVG circular timer */}
            <div className="relative flex items-center justify-center mb-3" style={{ width: '100px', height: '100px' }}>
              <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="44" fill="none" stroke="#F3F4F6" strokeWidth="6" />
                <circle
                  cx="50" cy="50" r="44" fill="none"
                  stroke={isActive ? '#00BC7D' : timeLeft === 0 ? '#EF4444' : '#101828'}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - timerPct / 100)}
                  style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
                />
              </svg>
              <span
                className="absolute font-bold"
                style={{ fontSize: '22px', color: '#101828', fontFamily: 'Arimo' }}
              >
                {formatTime(timeLeft)}
              </span>
            </div>

            <div className="uppercase tracking-widest text-[#6A7282] mb-4" style={{ fontSize: '10px', fontWeight: 600 }}>
              {readTimeLeft !== null
                ? `Auto-start in ${readTimeLeft}s`
                : isActive
                  ? 'In Progress'
                  : timeLeft === 0
                    ? 'Time Up'
                    : 'Paused'}
            </div>

            {readTimeLeft !== null && (
              <p className="text-center text-[#4A5565] mb-4" style={{ fontSize: '12px', lineHeight: '18px' }}>
                Reading time is live. The writing timer will begin automatically so students can first read the full question.
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (readTimeLeft !== null) {
                    setReadTimeLeft(null);
                    setIsActive(true);
                    return;
                  }
                  setIsActive((active) => !active);
                }}
                className="flex items-center justify-center gap-1.5 text-white font-bold transition-transform hover:scale-105"
                style={{
                  width: '110px', height: '40px',
                  background: readTimeLeft !== null ? '#17223E' : isActive ? '#DC2626' : '#00BC7D',
                  borderRadius: '10px', fontSize: '14px'
                }}
              >
                {readTimeLeft !== null ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M8 5.5v13l10-6.5-10-6.5Z" fill="currentColor" />
                  </svg>
                ) : isActive ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M8 5v14M16 5v14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M8 5.5v13l10-6.5-10-6.5Z" fill="currentColor" />
                  </svg>
                )}
                {readTimeLeft !== null ? 'Start now' : isActive ? 'Pause' : 'Resume'}
              </button>
              <button
                onClick={() => {
                  setIsActive(false);
                  setReadTimeLeft(READING_WINDOW_SECONDS);
                  setTimeLeft(data.timeLimit * 60);
                }}
                className="flex items-center justify-center gap-1.5 bg-white border border-[#D1D5DB] text-[#374151] font-bold transition-transform hover:scale-105"
                style={{ width: '80px', height: '40px', borderRadius: '10px', fontSize: '14px' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Icon%20(10).png" alt="" style={{ width: '16px', height: '16px' }} />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* ── Row 2: Answer Submission ── */}
        <div
          className="bg-white rounded-[20px]"
          style={{ padding: '28px 36px', boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A' }}
        >
          {/* ── Upload zone FIRST ── */}
          <div
            className={`rounded-[14px] flex flex-col items-center mb-4 cursor-pointer transition-colors ${isDragging ? 'bg-blue-50' : 'bg-[#F9FAFB]'}`}
            style={{
              width: '100%',
              border: isDragging ? '2px dashed #3B82F6' : '1px dashed #17223E',
              padding: '28px 20px 20px',
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={!selectedFile ? () => fileInputRef.current?.click() : undefined}
          >
            <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" onChange={handleFileSelect} className="hidden" />

            {selectedFile ? (
              <>
                <span className="text-3xl mb-2">📄</span>
                <p className="font-bold text-[#101828] mb-1" style={{ fontSize: '15px', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedFile.name}
                </p>
                <p className="text-[#4A5565] mb-2" style={{ fontSize: '13px' }}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                <button
                  onClick={e => { e.stopPropagation(); setSelectedFile(null); }}
                  className="text-red-600 hover:text-red-700 text-sm underline"
                >Remove file</button>
              </>
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/upload-icon.png" alt="" style={{ width: '48px', height: '48px', objectFit: 'contain', marginBottom: '12px' }} />
                <p className="font-bold text-[#101828] mb-1" style={{ fontSize: '15px' }}>Drop your answer script here</p>
                <p className="text-[#4A5565] mb-3" style={{ fontSize: '13px' }}>Upload handwritten answers for AI evaluation</p>
                <div className="flex gap-2 mb-4 flex-wrap justify-center">
                  {['JPG', 'PNG', 'PDF', 'DOCX', 'Max 10MB'].map(f => (
                    <span key={f} className="px-2.5 py-1 bg-[#E5E7EB] rounded text-[#374151]" style={{ fontSize: '12px' }}>{f}</span>
                  ))}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="bg-white border border-[#D1D5DB] text-[#111827] font-bold rounded-[8px] hover:bg-gray-50 transition-colors"
                  style={{ width: '130px', height: '38px', fontSize: '14px' }}
                >
                  Browse Files
                </button>
              </>
            )}
          </div>

          {/* ── Collapsible "OR Type your answer" ── */}
          <button
            onClick={() => setTextExpanded(e => !e)}
            className="w-full flex items-center gap-3 mb-1 group"
          >
            <div className="flex-1 h-px bg-[#E5E7EB]" />
            <span
              className="flex items-center gap-1.5 text-[#4A5565] group-hover:text-[#17223E] transition-colors select-none"
              style={{ fontSize: '13px', whiteSpace: 'nowrap' }}
            >
              OR Type your answer
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                style={{ transition: 'transform 0.25s', transform: textExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div className="flex-1 h-px bg-[#E5E7EB]" />
          </button>

          {/* Expandable textarea */}
          {textExpanded && (
            <div className="mt-3 mb-4" style={{ animation: 'slideDown 0.2s ease' }}>
              <textarea
                id="answer-text"
                value={answerText}
                onChange={e => { setAnswerText(e.target.value); if (submitError) setSubmitError(null); }}
                placeholder="Write your answer here..."
                autoFocus
                className="w-full rounded-[10px] border border-[#D1D5DB] bg-[#F9FAFB] p-4 text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#17223E] focus:border-transparent resize-vertical"
                style={{ minHeight: '160px', fontSize: '15px', lineHeight: '24px' }}
              />
              <p className="mt-1 text-right text-[#6A7282]" style={{ fontSize: '12px' }}>
                {answerText.trim().split(/\s+/).filter(Boolean).length} words
              </p>
            </div>
          )}

          {submitError && (
            <div className="mt-4 mb-3 px-4 py-3 bg-red-50 border border-red-200 rounded-[10px] text-red-700" style={{ fontSize: '13px' }}>
              {submitError}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 text-white font-bold transition-transform hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 mt-4 mb-3"
            style={{ height: '52px', background: '#17223E', borderRadius: '14px', fontSize: '16px', boxShadow: '0px 10px 15px -3px rgba(0,0,0,0.1)' }}
          >
            {submitting ? (
              <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />Submitting...</>
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Icon%20(13).png" alt="" style={{ width: '22px', height: '22px' }} />Submit Answer for Evaluation
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Text%20(8).png" alt="" style={{ height: '18px' }} />
            <span className="font-bold text-[#364153]" style={{ fontSize: '13px' }}>Get detailed feedback in 60 seconds</span>
          </div>
        </div>

      </div>
    </div>
  );
}
