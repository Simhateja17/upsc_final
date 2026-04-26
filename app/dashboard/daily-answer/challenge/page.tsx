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

export default function DailyMainsChallengeContextPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [data, setData] = useState<QuestionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [challengeStarted, setChallengeStarted] = useState(false);
  const [textExpanded, setTextExpanded] = useState(false);

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

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const timerPct = data?.timeLimit ? (timeLeft / (data.timeLimit * 60)) * 100 : (timeLeft / 900) * 100;
  const circumference = 2 * Math.PI * 44;

  const handleBeginChallenge = () => {
    setChallengeStarted(true);
    setIsActive(true);
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
      <div className="flex flex-col bg-[#F3F4F6] font-arimo" style={{ height: '100%', overflow: 'hidden' }}>
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 w-full max-w-[1200px] mx-auto">

          {/* Badge */}
          <div
            className="flex items-center justify-center gap-2 px-4 py-1.5 mb-4"
            style={{ borderRadius: '26px', border: '0.8px solid #E9D4FF', background: '#FAF5FF', width: 'fit-content' }}
          >
            <img src="/Icon%20(5).png" alt="" style={{ width: '16px', height: '16px' }} />
            <span style={{ color: '#8200DB', fontSize: '14px', fontWeight: 500 }}>Practice. Evaluate. Improve</span>
          </div>

          {/* Title */}
          <h1
            className="text-center text-[#17223E] mb-3"
            style={{ fontSize: 'clamp(28px, 3vw, 42px)', lineHeight: '1.2', fontWeight: 400 }}
          >
            Daily Answer Writing with Detailed Feedback &amp; Evaluation
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
                  <img src="/Icon%20(8).png" alt="" style={{ width: '20px', height: '20px' }} />
                  <span>Time: {data.timeLimit} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <img src="/Icon%20(7).png" alt="" style={{ width: '20px', height: '20px' }} />
                  <span>Word limit: {data.wordLimit} words</span>
                </div>
                <div className="flex items-center gap-2">
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
                <img src="/Icon%20(8).png" alt="" style={{ width: '16px', height: '16px' }} />
                <span>{data.timeLimit} min</span>
              </div>
              <div className="flex items-center gap-1.5">
                <img src="/Icon%20(7).png" alt="" style={{ width: '16px', height: '16px' }} />
                <span>{data.wordLimit} words</span>
              </div>
              <div className="flex items-center gap-1.5">
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
              {isActive ? 'In Progress' : timeLeft === 0 ? 'Time Up' : 'Paused'}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsActive(a => !a)}
                className="flex items-center justify-center gap-1.5 text-white font-bold transition-transform hover:scale-105"
                style={{
                  width: '110px', height: '40px',
                  background: isActive ? '#DC2626' : '#00BC7D',
                  borderRadius: '10px', fontSize: '14px'
                }}
              >
                <img src="/Icon%20(11).png" alt="" style={{ width: '18px', height: '18px', filter: 'brightness(0) invert(1)' }} />
                {isActive ? 'Pause' : 'Resume'}
              </button>
              <button
                onClick={() => { setIsActive(false); setTimeLeft(data.timeLimit * 60); }}
                className="flex items-center justify-center gap-1.5 bg-white border border-[#D1D5DB] text-[#374151] font-bold transition-transform hover:scale-105"
                style={{ width: '80px', height: '40px', borderRadius: '10px', fontSize: '14px' }}
              >
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
              <><img src="/Icon%20(13).png" alt="" style={{ width: '22px', height: '22px' }} />Submit Answer for Evaluation</>
            )}
          </button>

          <div className="flex items-center justify-center gap-2">
            <img src="/Text%20(8).png" alt="" style={{ height: '18px' }} />
            <span className="font-bold text-[#364153]" style={{ fontSize: '13px' }}>Get detailed feedback in 60 seconds</span>
          </div>
        </div>

      </div>
    </div>
  );
}
