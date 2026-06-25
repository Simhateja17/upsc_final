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

            <div className="flex justify-center mb-[clamp(0.5rem,0.8vw,0.85rem)]">
              <span className="inline-flex items-center gap-1.5 rounded-full font-arimo font-bold"
                style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '4px 12px', fontSize: 'clamp(11px,0.65vw,12px)', color: '#047857' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                Challenge Completed
              </span>
            </div>

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
              {(() => {
                const pct = r.questionCount > 0 ? Math.round((r.correctCount / r.questionCount) * 100) : 0;
                const size = 140;
                const stroke = 11;
                const radius = (size - stroke) / 2;
                const circ = 2 * Math.PI * radius;
                const dash = (pct / 100) * circ;
                return (
                  <div style={{ position: 'relative', width: size, height: size }}>
                    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
                      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#10B981" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div className="font-arimo font-bold leading-none" style={{ fontSize: 'clamp(28px,2.1vw,38px)', color: '#101828' }}>
                        {r.correctCount}<span style={{ color: '#9CA3AF', fontSize: '0.58em' }}>/{r.questionCount}</span>
                      </div>
                      <div className="font-arimo font-bold" style={{ fontSize: 11, letterSpacing: '0.08em', color: '#10B981', marginTop: 6, textTransform: 'uppercase' }}>
                        Score · {pct}%
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-[clamp(0.65rem,0.9vw,1rem)] mb-[clamp(0.85rem,1.2vw,1.15rem)]">
              {[
                { label: 'Accuracy', value: `${Math.round(r.accuracy)}%`, sub: 'this attempt', valueSize: 'clamp(18px,1.15vw,24px)' },
                { label: 'Time Taken', value: `${minutes}m ${seconds}s`, sub: 'of 10 min', valueSize: 'clamp(18px,1.15vw,24px)' },
                { label: 'Speed', value: `${speed} min/Q`, sub: 'Avg per question', valueSize: 'clamp(14px,0.95vw,20px)' },
                { label: 'Rank', value: rankLabel, sub: 'among aspirants today', valueSize: 'clamp(16px,1.05vw,22px)' },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-[#E5E7EB] rounded-[clamp(10px,0.73vw,14px)]"
                  style={{ padding: 'clamp(0.65rem,0.85vw,1rem)' }}>
                  <div className="font-arimo font-bold"
                    style={{ fontSize: 'clamp(10px,0.6vw,11px)', letterSpacing: '0.06em', color: '#8892A4', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
                  <div className="font-arimo font-bold text-[#101828]" style={{ fontSize: s.valueSize, lineHeight: 1.1 }}>{s.value}</div>
                  <div className="font-arimo" style={{ fontSize: 'clamp(10px,0.62vw,12px)', color: '#9CA3AF', marginTop: 4 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            <div className="space-y-[clamp(0.65rem,0.85vw,0.9rem)]">
              <Link href="/dashboard/daily-mcq/review">
                <button
                  type="button"
                  className="qw-review-btn w-full font-arimo font-bold"
                  style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(8px,0.9vw,12px)', borderRadius: 14, padding: 'clamp(12px,1vw,16px)', fontSize: 'clamp(13px,0.8vw,15px)', cursor: 'pointer' }}>
                  <span className="qw-shimmer" />
                  <span className="qw-badge">{r.questionCount} Q</span>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" style={{ position: 'relative', zIndex: 1 }}>
                    <path d="M4 7h16M4 12h16M4 17h16" />
                  </svg>
                  <span style={{ position: 'relative', zIndex: 1 }}>View Question-wise Review</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ position: 'relative', zIndex: 1 }}>
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              </Link>

              {/* Result action buttons — colors per reference (.act-*) */}
              <style>{`
                .qw-review-btn{color:#0B1426;background:radial-gradient(120% 140% at 100% 0%, rgba(245,197,24,.18) 0%, rgba(245,197,24,0) 55%),linear-gradient(135deg,#FBF6E7 0%,#F4ECD8 55%,#EFE3BE 100%);box-shadow:0 10px 22px -14px rgba(107,83,32,.45), inset 0 1px 0 rgba(255,255,255,.6);border:1px solid #E4D8B5;letter-spacing:.01em;}
                .qw-review-btn::after{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(180deg,#F5C518,#B7860B);border-radius:12px 0 0 12px;}
                .qw-review-btn:hover{filter:brightness(1.02);transform:translateY(-1px);box-shadow:0 16px 30px -16px rgba(107,83,32,.55);}
                .qw-shimmer{position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.55) 50%,transparent 70%);transform:translateX(-100%);animation:qwShine 4s ease-in-out infinite;pointer-events:none;}
                @keyframes qwShine{0%{transform:translateX(-100%)}60%{transform:translateX(100%)}100%{transform:translateX(100%)}}
                .qw-badge{position:relative;z-index:1;background:#0B1426;color:#F5C518;font-size:10.5px;font-weight:800;letter-spacing:.14em;padding:3px 8px;border-radius:999px;border:1px solid #0B1426;}
                .mcq-act{display:flex;align-items:center;gap:clamp(8px,0.8vw,12px);padding:clamp(10px,0.85vw,14px) clamp(12px,1vw,16px);border-radius:14px;font-weight:700;font-size:clamp(12px,0.78vw,14px);border:1px solid transparent;cursor:pointer;transition:all .18s;background:#fff;width:100%;text-align:left;}
                .mcq-act:hover{transform:translateY(-1px);box-shadow:0 10px 24px -16px rgba(11,20,38,.18);}
                .mcq-act .ic{width:clamp(28px,2.2vw,34px);height:clamp(28px,2.2vw,34px);border-radius:10px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;}
                .mcq-act-share{background:#EDF2EE;color:#34503F;border-color:#D6DFD9;}
                .mcq-act-share .ic{background:#fff;color:#34503F;}
                .mcq-act-download{background:#E8EDF5;color:#2E3C5C;border-color:#D2DAE8;}
                .mcq-act-download .ic{background:#fff;color:#2E3C5C;}
                .mcq-act-retake{background:#F4E2DD;color:#8A4A39;border-color:#E8CFC7;}
                .mcq-act-retake .ic{background:#fff;color:#8A4A39;}
                .mcq-act-next{background:linear-gradient(135deg,#0B1426,#1A2848);color:#fff;border-color:#0B1426;}
                .mcq-act-next .ic{background:#F5C518;color:#0B1426;}
                .mcq-act-dash{background:#FBFAF7;color:#3A4357;border-color:#ECE7DD;}
                .mcq-act-dash .ic{background:#fff;color:#3A4357;}
              `}</style>

              <div className="grid grid-cols-3 gap-[clamp(0.5rem,0.65vw,0.75rem)]">
                <button type="button" onClick={handleShareScore} className="mcq-act mcq-act-share font-arimo">
                  <span className="ic">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M6.5 5.5L10 3.5M6.5 10.5L10 12.5M6.5 8A2 2 0 1 1 2.5 8A2 2 0 0 1 6.5 8ZM13.5 3A2 2 0 1 1 9.5 3A2 2 0 0 1 13.5 3ZM13.5 13A2 2 0 1 1 9.5 13A2 2 0 0 1 13.5 13Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  Share Score
                </button>
                <button type="button" onClick={handleDownloadReport} className="mcq-act mcq-act-download font-arimo">
                  <span className="ic">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M8 2V9M8 9L5 6M8 9L11 6M3 12V13.5H13V12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  Download Report
                </button>
                <Link href="/dashboard/daily-mcq/challenge?retake=1" className="min-w-0">
                  <button type="button" className="mcq-act mcq-act-retake font-arimo">
                    <span className="ic">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M13 7A5 5 0 1 0 11.5 10.55M13 7V3.5M13 7H9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    Retake
                  </button>
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-[clamp(0.5rem,0.8vw,1rem)]">
                <Link href="/dashboard/daily-mcq/next-steps" className="min-w-0">
                  <button className="mcq-act mcq-act-next font-arimo">
                    <span className="ic">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M8 2.5L9.15 6.85L13.5 8L9.15 9.15L8 13.5L6.85 9.15L2.5 8L6.85 6.85L8 2.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                      </svg>
                    </span>
                    View Smart Next Steps
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginLeft: 'auto' }}>
                      <path d="M5 12h14" /><path d="M13 6l6 6-6 6" />
                    </svg>
                  </button>
                </Link>
                <Link href="/dashboard" className="min-w-0">
                  <button className="mcq-act mcq-act-dash font-arimo">
                    <span className="ic">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M2.5 7.5L8 3L13.5 7.5V13H9.75V9.5H6.25V13H2.5V7.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                      </svg>
                    </span>
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
