'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { dailyMcqService } from '@/lib/services';

interface ResultsData {
  score: number;
  totalMarks: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  accuracy: number;
  timeTaken: number;
  rank: number;
  percentile: number;
  questionCount: number;
  strongTopics: string[];
  weakTopics: string[];
}

interface ReviewQuestion {
  id: string;
  questionNum: number;
  questionText: string;
  category: string;
  difficulty: string;
  options: { id: string; text: string }[];
  correctOption: string;
  explanation: string | null;
  selectedOption: string | null;
  isCorrect: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
  maxLife: number;
  shape: 'circle' | 'rect' | 'star';
}

function getOptionKey(option: { id: string; text: string }, idx: number): string {
  const labels = ['A', 'B', 'C', 'D'];
  return option.id || labels[idx] || String(idx);
}

function ConfettiCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!active || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE'];
    const shapes: Particle['shape'][] = ['circle', 'rect', 'star'];

    const particles: Particle[] = [];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 3;

    for (let i = 0; i < 150; i++) {
      const angle = (Math.PI * 2 * i) / 150 + (Math.random() - 0.5) * 0.5;
      const speed = 3 + Math.random() * 8;
      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 6,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        life: 0,
        maxLife: 60 + Math.random() * 60,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      });
    }

    particlesRef.current = particles;

    const drawStar = (cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
      let rot = Math.PI / 2 * 3;
      const step = Math.PI / spikes;
      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
        rot += step;
        ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      particlesRef.current.forEach(p => {
        if (p.life < p.maxLife) {
          alive = true;
          p.life++;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.15;
          p.vx *= 0.99;
          p.rotation += p.rotationSpeed;

          const alpha = 1 - (p.life / p.maxLife);
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;

          if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.shape === 'rect') {
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          } else {
            drawStar(0, 0, 5, p.size / 2, p.size / 4);
            ctx.fill();
          }

          ctx.restore();
        }
      });

      if (alive) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999 }}
    />
  );
}

export default function DailyMcqResultsPage() {
  const [results, setResults] = useState<ResultsData | null>(null);
  const [reviewQuestions, setReviewQuestions] = useState<ReviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showQuestionReview, setShowQuestionReview] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      dailyMcqService.getResults(),
      dailyMcqService.getReview(),
    ])
      .then(([resultsRes, reviewRes]) => {
        if (resultsRes.status === 'fulfilled') {
          setResults(resultsRes.value.data);
        }

        if (reviewRes.status === 'fulfilled') {
          setReviewQuestions(reviewRes.value.data?.questions || []);
        }

        const accuracy = resultsRes.status === 'fulfilled' ? resultsRes.value.data?.accuracy || 0 : 0;
        if (accuracy > 50) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: '#FAFBFE' }}>
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </main>
      </div>
    );
  }

  const r = results || {
    score: 0, totalMarks: 20, correctCount: 0, wrongCount: 0, skippedCount: 0,
    accuracy: 0, timeTaken: 0, rank: 0, percentile: 0, questionCount: 10,
    strongTopics: [], weakTopics: [],
  };

  const minutes = Math.floor(r.timeTaken / 60);
  const seconds = r.timeTaken % 60;
  const attemptedCount = r.correctCount + r.wrongCount;
  const effectiveTimeSeconds = Math.min(r.timeTaken, 10 * 60);
  const speed = attemptedCount > 0 ? (effectiveTimeSeconds / 60 / attemptedCount).toFixed(2) : '0';

  // Fix ranking display: show meaningful rank even with low participation
  const displayPercentile = Math.min(Math.max(r.percentile, 0), 99);
  const rankLabel = r.rank > 0 && r.questionCount > 1
    ? displayPercentile >= 95 ? `Top 5%` : displayPercentile >= 90 ? `Top 10%` : displayPercentile >= 75 ? `Top 25%` : displayPercentile >= 50 ? `Top 50%` : `Keep practicing!`
    : r.rank === 0 && r.questionCount > 0 ? 'First to attempt!' : 'Rankings updating...';

  const handleShareScore = async () => {
    const text = `I scored ${r.correctCount}/${r.questionCount} in the Daily MCQs Challenge with ${Math.round(r.accuracy)}% accuracy.`;

    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: 'Daily MCQs Challenge Score', text });
        return;
      } catch {
        // Fall back to clipboard when the native share sheet is dismissed or unavailable.
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
  };

  const handleDownloadReport = () => {
    if (typeof window === 'undefined') return;

    const lines = [
      'Daily MCQs Challenge Report',
      `Score: ${r.correctCount}/${r.questionCount}`,
      `Accuracy: ${Math.round(r.accuracy)}%`,
      `Time Taken: ${minutes}m ${seconds}s`,
      `Speed: ${speed} min/Q`,
      `Rank: ${rankLabel}`,
      '',
      'Question-wise Review',
      ...reviewQuestions.map((q, idx) => {
        const correct = q.options.find((option, optionIdx) => getOptionKey(option, optionIdx) === q.correctOption);
        const selected = q.options.find((option, optionIdx) => getOptionKey(option, optionIdx) === q.selectedOption);
        return `${idx + 1}. ${q.isCorrect ? 'Correct' : 'Needs revision'} - ${q.questionText}\n   Your answer: ${selected?.text || q.selectedOption || 'Skipped'}\n   Correct answer: ${correct?.text || q.correctOption}`;
      }),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'daily-mcq-report.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <ConfettiCanvas active={showConfetti} />
      <div className="flex flex-col overflow-y-auto" style={{ minHeight: 'calc(100vh - clamp(90px, 5.78vw, 111px))', maxHeight: 'calc(100vh - clamp(90px, 5.78vw, 111px))', background: '#FAFBFE' }}>
        <main className="flex-1 flex items-start justify-center px-[clamp(1rem,2vw,3rem)] pt-[clamp(1rem,2vh,1.5rem)] pb-[clamp(2rem,4vh,3rem)]">
          <div className="card-elevated rounded-[clamp(10px,0.52vw,10px)]"
            style={{ width: 'clamp(640px,42vw,820px)', padding: 'clamp(1.25rem,1.6vw,2rem) clamp(1.4rem,1.8vw,2.2rem)', boxShadow: '0 26px 60px -30px rgba(15,23,42,0.24), 0 12px 28px -20px rgba(15,23,42,0.18), inset 0 1px 0 rgba(255,255,255,0.9)' }}>

            <div className="text-center mb-[clamp(0.9rem,1.2vw,1.25rem)]">
              <h1 className="font-arimo font-bold text-[#101828] mb-[clamp(0.25rem,0.5vw,0.5rem)]"
                style={{ fontSize: 'clamp(20px,1.25vw,24px)', lineHeight: 'clamp(28px,1.67vw,32px)' }}>
                Daily MCQs Challenge Completed!
              </h1>
              <p className="font-arimo text-[#4A5565]"
                style={{ fontSize: 'clamp(13px,0.73vw,14px)', lineHeight: 'clamp(18px,1.04vw,20px)' }}>
                Great effort! Here{'\''}s your performance analysis
              </p>
            </div>

            <div className="flex justify-center mb-[clamp(1rem,1.5vw,1.4rem)]">
              <div className="rounded-full bg-[#17223E] flex flex-col items-center justify-center gap-1"
                style={{ width: 'clamp(100px,6.67vw,128px)', height: 'clamp(100px,6.67vw,128px)' }}>
                <div className="font-arimo font-bold text-white leading-none"
                  style={{ fontSize: 'clamp(28px,2.08vw,40px)' }}>
                  {r.correctCount}/{r.questionCount}
                </div>
                <div className="font-arimo font-bold text-white"
                  style={{ fontSize: 'clamp(10px,0.625vw,12px)', lineHeight: 'clamp(14px,0.83vw,16px)' }}>
                  Score
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-[clamp(0.65rem,0.9vw,1rem)] mb-[clamp(0.85rem,1.2vw,1.15rem)]">
              <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[clamp(10px,0.73vw,14px)] text-center"
                style={{ padding: 'clamp(0.5rem,0.75vw,1rem) clamp(0.5rem,0.625vw,0.75rem)' }}>
                <div className="font-arimo text-[#4A5565] mb-[clamp(0.15rem,0.3vw,0.25rem)]"
                  style={{ fontSize: 'clamp(11px,0.65vw,14px)' }}>Accuracy</div>
                <div className="font-arimo font-bold text-[#101828]"
                  style={{ fontSize: 'clamp(18px,1.15vw,24px)' }}>{Math.round(r.accuracy)}%</div>
              </div>
              <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[clamp(10px,0.73vw,14px)] text-center"
                style={{ padding: 'clamp(0.5rem,0.75vw,1rem) clamp(0.5rem,0.625vw,0.75rem)' }}>
                <div className="font-arimo text-[#4A5565] mb-[clamp(0.15rem,0.3vw,0.25rem)]"
                  style={{ fontSize: 'clamp(11px,0.65vw,14px)' }}>Time Taken</div>
                <div className="font-arimo font-bold text-[#101828]"
                  style={{ fontSize: 'clamp(18px,1.15vw,24px)' }}>{minutes}m {seconds}s</div>
              </div>
              <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[clamp(10px,0.73vw,14px)] text-center"
                style={{ padding: 'clamp(0.5rem,0.75vw,1rem) clamp(0.5rem,0.625vw,0.75rem)' }}>
                <div className="font-arimo text-[#4A5565] mb-[clamp(0.15rem,0.3vw,0.25rem)]"
                  style={{ fontSize: 'clamp(11px,0.65vw,14px)' }}>Speed</div>
                <div className="font-arimo font-bold text-[#101828]"
                  style={{ fontSize: 'clamp(14px,0.95vw,20px)' }}>{speed} min/Q</div>
              </div>
              <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[clamp(10px,0.73vw,14px)] text-center"
                style={{ padding: 'clamp(0.5rem,0.75vw,1rem) clamp(0.5rem,0.625vw,0.75rem)' }}>
                <div className="font-arimo text-[#4A5565] mb-[clamp(0.15rem,0.3vw,0.25rem)]"
                  style={{ fontSize: 'clamp(11px,0.65vw,14px)' }}>Rank</div>
                <div className="font-arimo font-bold text-[#101828]"
                  style={{ fontSize: 'clamp(16px,1.05vw,22px)' }}>{rankLabel}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-[clamp(0.65rem,0.9vw,1rem)] mb-[clamp(0.9rem,1.2vw,1.2rem)]">
              <div className="bg-[#F0FDF4] rounded-[clamp(8px,0.52vw,10px)]" style={{ padding: 'clamp(0.75rem,1vw,1.25rem)' }}>
                <div className="flex items-center gap-2 mb-[clamp(0.5rem,0.75vw,1rem)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/strong-icon.png" alt="Strong" className="w-[clamp(18px,1.25vw,24px)] h-[clamp(18px,1.25vw,24px)]" />
                  <h3 className="font-arimo font-bold text-[#0D542B]" style={{ fontSize: 'clamp(13px,0.78vw,16px)' }}>You{'\''}re strong in:</h3>
                </div>
                <div className="space-y-[clamp(0.35rem,0.5vw,0.6rem)]">
                  {(r.strongTopics.length > 0 ? r.strongTopics : ['No data yet']).map((topic) => (
                    <div key={topic} className="flex items-center gap-2">
                      <svg className="w-[clamp(14px,0.83vw,16px)] h-[clamp(14px,0.83vw,16px)] text-[#016630] flex-shrink-0" viewBox="0 0 16 16" fill="none">
                        <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="font-arimo text-[#016630]" style={{ fontSize: 'clamp(12px,0.68vw,14px)' }}>{topic}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#FEF2F2] rounded-[clamp(8px,0.52vw,10px)]" style={{ padding: 'clamp(0.75rem,1vw,1.25rem)' }}>
                <div className="flex items-center gap-2 mb-[clamp(0.5rem,0.75vw,1rem)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/revision-icon.png" alt="Needs Revision" className="w-[clamp(18px,1.25vw,24px)] h-[clamp(18px,1.25vw,24px)]" />
                  <h3 className="font-arimo font-bold text-[#991B1B]" style={{ fontSize: 'clamp(13px,0.78vw,16px)' }}>Needs revision:</h3>
                </div>
                <div className="space-y-[clamp(0.35rem,0.5vw,0.6rem)]">
                  {(r.weakTopics.length > 0 ? r.weakTopics : ['No data yet']).map((topic) => (
                    <div key={topic} className="flex items-center gap-2">
                      <span className="text-[#DC2626] font-bold flex-shrink-0" style={{ fontSize: 'clamp(13px,0.78vw,16px)' }}>!</span>
                      <span className="font-arimo text-[#991B1B]" style={{ fontSize: 'clamp(12px,0.68vw,14px)' }}>{topic}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-[clamp(0.65rem,0.85vw,0.9rem)]">
              <button
                type="button"
                onClick={() => setShowQuestionReview((show) => !show)}
                className="w-full bg-white border border-[#E5E7EB] rounded-[clamp(8px,0.52vw,10px)] text-[#364153] font-arimo font-bold flex items-center justify-center gap-2 hover:border-[#9CA3AF] transition-colors"
                style={{ padding: 'clamp(9px,0.73vw,12px)', fontSize: 'clamp(12px,0.73vw,14px)' }}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M5.5 3.5H13M5.5 8H13M5.5 12.5H13M3 3.5H3.01M3 8H3.01M3 12.5H3.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                View Question-wise Review
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ transform: showQuestionReview ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }}>
                  <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {showQuestionReview && (
                <div className="max-h-[clamp(160px,18vh,230px)] overflow-y-auto space-y-2">
                  {reviewQuestions.length > 0 ? reviewQuestions.map((question, index) => {
                    const selected = question.options.find((option, optionIdx) => getOptionKey(option, optionIdx) === question.selectedOption);
                    const correct = question.options.find((option, optionIdx) => getOptionKey(option, optionIdx) === question.correctOption);

                    return (
                      <div
                        key={question.id || index}
                        className="bg-white border rounded-[clamp(8px,0.52vw,10px)]"
                        style={{
                          padding: 'clamp(0.65rem,0.8vw,0.9rem)',
                          borderColor: question.isCorrect ? '#BBF7D0' : '#FCA5A5',
                        }}>
                        <div className="font-arimo font-bold text-[#155DFC] mb-1" style={{ fontSize: 'clamp(10px,0.6vw,12px)' }}>
                          Question {question.questionNum || index + 1}
                        </div>
                        <p className="font-arimo text-[#364153] mb-2" style={{ fontSize: 'clamp(11px,0.68vw,13px)', lineHeight: '1.45' }}>
                          {question.questionText}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 font-arimo" style={{ fontSize: 'clamp(10px,0.62vw,12px)' }}>
                          <span className="text-[#4A5565]">Your answer: {selected?.text || question.selectedOption || 'Skipped'}</span>
                          <span className="font-bold text-[#016630]">Correct: {correct?.text || question.correctOption}</span>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="bg-white border border-[#E5E7EB] rounded-[clamp(8px,0.52vw,10px)] text-center font-arimo text-[#4A5565]"
                      style={{ padding: 'clamp(0.75rem,1vw,1.25rem)', fontSize: 'clamp(12px,0.68vw,14px)' }}>
                      No question review data available yet.
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-[clamp(0.5rem,0.65vw,0.75rem)]">
                <button
                  type="button"
                  onClick={handleShareScore}
                  className="bg-white border border-[#E5E7EB] rounded-[clamp(8px,0.52vw,10px)] text-[#6B7280] font-arimo font-bold flex items-center justify-center gap-2 hover:border-[#9CA3AF] hover:text-[#101828] transition-colors"
                  style={{ padding: 'clamp(9px,0.73vw,12px)', fontSize: 'clamp(11px,0.68vw,13px)' }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M6.5 5.5L10 3.5M6.5 10.5L10 12.5M6.5 8A2 2 0 1 1 2.5 8A2 2 0 0 1 6.5 8ZM13.5 3A2 2 0 1 1 9.5 3A2 2 0 0 1 13.5 3ZM13.5 13A2 2 0 1 1 9.5 13A2 2 0 0 1 13.5 13Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Share Score
                </button>
                <button
                  type="button"
                  onClick={handleDownloadReport}
                  className="bg-white border border-[#E5E7EB] rounded-[clamp(8px,0.52vw,10px)] text-[#6B7280] font-arimo font-bold flex items-center justify-center gap-2 hover:border-[#9CA3AF] hover:text-[#101828] transition-colors"
                  style={{ padding: 'clamp(9px,0.73vw,12px)', fontSize: 'clamp(11px,0.68vw,13px)' }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M8 2V9M8 9L5 6M8 9L11 6M3 12V13.5H13V12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Download Report
                </button>
                <Link href="/dashboard/daily-mcq/challenge" className="min-w-0">
                  <button
                    type="button"
                    className="w-full bg-white border border-[#E5E7EB] rounded-[clamp(8px,0.52vw,10px)] text-[#6B7280] font-arimo font-bold flex items-center justify-center gap-2 hover:border-[#9CA3AF] hover:text-[#101828] transition-colors"
                    style={{ padding: 'clamp(9px,0.73vw,12px)', fontSize: 'clamp(11px,0.68vw,13px)' }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M13 7A5 5 0 1 0 11.5 10.55M13 7V3.5M13 7H9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Retake
                  </button>
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-[clamp(0.5rem,0.8vw,1rem)]">
                <Link href="/dashboard/daily-mcq/next-steps" className="min-w-0">
                  <button className="w-full bg-[#00A63E] text-white rounded-[clamp(8px,0.52vw,10px)] hover:bg-[#008C35] transition-colors font-arimo font-bold flex items-center justify-center gap-2"
                    style={{ padding: 'clamp(11px,0.83vw,14px)', fontSize: 'clamp(12px,0.78vw,15px)' }}>
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M8 2.5L9.15 6.85L13.5 8L9.15 9.15L8 13.5L6.85 9.15L2.5 8L6.85 6.85L8 2.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                    </svg>
                    View Smart Next Steps
                  </button>
                </Link>
                <Link href="/dashboard" className="min-w-0">
                  <button className="w-full bg-[#1A1D23] text-white rounded-[clamp(8px,0.52vw,10px)] hover:bg-[#2D3140] transition-colors font-arimo font-bold flex items-center justify-center gap-2"
                    style={{ padding: 'clamp(11px,0.83vw,14px)', fontSize: 'clamp(12px,0.78vw,15px)' }}>
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M2.5 7.5L8 3L13.5 7.5V13H9.75V9.5H6.25V13H2.5V7.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                    </svg>
                    Back to Dashboard
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
