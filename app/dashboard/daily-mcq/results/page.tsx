'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { dailyMcqService, dashboardService, leaderboardService } from '@/lib/services';
import { useAuth } from '@/contexts/AuthContext';
import SmartNextStepsModal from '@/components/SmartNextStepsModal';
import ShareScoreModal from '@/components/mcq-review/ShareScoreModal';

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

const PDF_PAGE = { width: 595.28, height: 841.89, left: 42, right: 553 };

function pdfText(value: string | null | undefined): string {
  return (value || '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pdfOptionLabel(option: { id: string; text: string }, index: number): string {
  const labels = ['A', 'B', 'C', 'D'];
  return option.id || labels[index] || String(index + 1);
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
  const { user } = useAuth();
  const [results, setResults] = useState<ResultsData | null>(null);
  const [reviewQuestions, setReviewQuestions] = useState<ReviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showNextSteps, setShowNextSteps] = useState(false);
  const [streak, setStreak] = useState<number | null>(null);
  // Real leaderboard rank (prelims/MCQ bucket) — replaces the old "Top X%" percentile bucket.
  const [myRank, setMyRank] = useState<{ mcqRank: number | null; isRankUnlocked: boolean; attemptsToUnlockRank: number; realRankedCount: number } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lightweight toast (mirrors the reference's toast() used by the share popup).
  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2000);
  };

  // Current streak for the share card (best-effort; the modal still works without it).
  useEffect(() => {
    dashboardService.getStreak()
      .then(res => setStreak(Number(res.data?.currentStreak ?? 0)))
      .catch(() => setStreak(null));
  }, []);

  // Real leaderboard rank for this aspirant (all-time, MCQ/prelims bucket).
  useEffect(() => {
    leaderboardService.getMyRank('all')
      .then(res => setMyRank(res.data || null))
      .catch(() => setMyRank(null));
  }, []);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

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

  // Real leaderboard rank (prelims/MCQ bucket). Falls back to an unlock hint until
  // the aspirant has enough attempts, then to a neutral "updating" message.
  const rankUnlocked = !!myRank?.isRankUnlocked && !!myRank?.mcqRank;
  const rankedTotal = myRank?.realRankedCount ?? 0;
  const rankLabel = rankUnlocked
    ? `#${(myRank!.mcqRank as number).toLocaleString('en-IN')}`
    : myRank && myRank.attemptsToUnlockRank > 0
      ? `${myRank.attemptsToUnlockRank} more to unlock`
      : 'Rankings updating...';
  const rankSubLabel = rankUnlocked && rankedTotal > 0
    ? `of ${rankedTotal.toLocaleString('en-IN')} ranked`
    : 'among aspirants today';
  // Bar fills more the higher you rank (rank #1 ≈ full bar).
  const rankBarPct = rankUnlocked && rankedTotal > 0
    ? Math.max(4, Math.min(100, Math.round((1 - ((myRank!.mcqRank as number) - 1) / rankedTotal) * 100)))
    : 0;

  // Report metadata shown in the download/share popups (matches the reference: date · name · report id).
  const reportName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Aspirant';
  const reportInitials = (reportName.split(' ').map((w) => w[0]).join('').slice(0, 2) || 'AS').toUpperCase();
  const reportDate = new Date();
  const reportDateLabel = reportDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const reportId = `DMQ-${reportDate.getFullYear()}${String(reportDate.getMonth() + 1).padStart(2, '0')}${String(reportDate.getDate()).padStart(2, '0')}-${reportInitials}`;

  // Shareable link + text for the Share Score modal (mirrors reference: risewithjeet.com/share/daily-mcq/AS-20jun26).
  const monAbbrev = reportDate.toLocaleString('en-US', { month: 'short' }).toLowerCase();
  const shareSlug = `${reportInitials}-${reportDate.getDate()}${monAbbrev}${String(reportDate.getFullYear()).slice(-2)}`;
  const shareUrl = `risewithjeet.com/share/daily-mcq/${shareSlug}`;

  const performDownload = async () => {
    if (typeof window === 'undefined' || isDownloading) return;

    setIsDownloading(true);
    try {
      // Loaded only after the user requests a report, so this fairly large library
      // never affects the Daily MCQ result screen's initial load.
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const { width, height, left, right } = PDF_PAGE;
      const contentWidth = right - left;
      const scorePercent = r.questionCount > 0 ? Math.round((r.correctCount / r.questionCount) * 100) : 0;
      let pageNumber = 1;
      let y = 0;

      const footer = () => {
        doc.setDrawColor(226, 232, 240);
        doc.line(left, height - 37, right, height - 37);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`MCQ Challenge Report | ${reportDateLabel}`, left, height - 22);
        doc.text(`Page ${pageNumber}`, right, height - 22, { align: 'right' });
      };

      const header = (section = 'Performance Report') => {
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, width, 5, 'F');
        doc.setFillColor(13, 148, 136);
        doc.rect(width * 0.45, 0, width * 0.32, 5, 'F');
        doc.setFillColor(217, 119, 6);
        doc.rect(width * 0.77, 0, width * 0.23, 5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.setTextColor(15, 23, 42);
        doc.text('RiseWithJeet', left, 34);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('DAILY MCQS CHALLENGE', left, 47);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(section.toUpperCase(), right, 34, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(reportDateLabel, right, 47, { align: 'right' });
        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(1.3);
        doc.line(left, 59, right, 59);
        y = 82;
      };

      const addPage = (section?: string) => {
        footer();
        doc.addPage();
        pageNumber += 1;
        header(section);
      };

      const ensure = (space: number, section?: string) => {
        if (y + space > height - 55) addPage(section);
      };

      const wrappedText = (text: string, x: number, maxWidth: number, lineHeight = 12) => {
        const lines = doc.splitTextToSize(pdfText(text), maxWidth) as string[];
        for (const line of lines) {
          ensure(lineHeight + 2, 'Question-wise Review');
          doc.text(line, x, y);
          y += lineHeight;
        }
      };

      const roundedCard = (x: number, top: number, cardWidth: number, cardHeight: number, fill: [number, number, number]) => {
        doc.setFillColor(...fill);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(x, top, cardWidth, cardHeight, 8, 8, 'FD');
      };

      header();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(23);
      doc.setTextColor(15, 23, 42);
      doc.text('Daily MCQ Challenge Report', left, y);
      y += 18;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text('Your complete performance analysis and question-wise revision guide.', left, y);
      y += 20;

      doc.setFillColor(15, 23, 42);
      doc.roundedRect(left, y, contentWidth, 63, 9, 9, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text(reportName, left + 18, y + 27);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(203, 213, 225);
      doc.text(`Report ID: ${reportId}`, left + 18, y + 43);
      doc.setTextColor(251, 191, 36);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(`${r.correctCount}/${r.questionCount}`, right - 18, y + 28, { align: 'right' });
      doc.setFontSize(8);
      doc.text('QUESTIONS CORRECT', right - 18, y + 43, { align: 'right' });
      y += 84;

      const scoreX = left + 45;
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(11);
      doc.circle(scoreX, y + 53, 35, 'S');
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(6);
      doc.circle(scoreX, y + 53, 35, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42);
      doc.text(`${r.correctCount}`, scoreX, y + 52, { align: 'center' });
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`of ${r.questionCount}`, scoreX, y + 66, { align: 'center' });

      const metrics = [
        { label: 'Accuracy', value: `${Math.round(r.accuracy)}%`, sub: 'this attempt', fill: [240, 253, 244] as [number, number, number], valueColor: [22, 163, 74] as [number, number, number] },
        { label: 'Time taken', value: `${minutes}m ${seconds}s`, sub: 'of 10 min', fill: [239, 246, 255] as [number, number, number], valueColor: [37, 99, 235] as [number, number, number] },
        { label: 'Speed', value: `${speed} min/Q`, sub: 'average per question', fill: [255, 247, 237] as [number, number, number], valueColor: [217, 119, 6] as [number, number, number] },
        { label: 'Rank', value: rankLabel, sub: rankSubLabel, fill: [245, 243, 255] as [number, number, number], valueColor: [124, 58, 237] as [number, number, number] },
      ];
      const cardWidth = 100;
      metrics.forEach((metric, index) => {
        const x = left + 104 + (index % 2) * 112;
        const top = y + Math.floor(index / 2) * 58;
        roundedCard(x, top, cardWidth, 50, metric.fill);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(metric.label.toUpperCase(), x + 10, top + 16);
        doc.setFontSize(13);
        doc.setTextColor(...metric.valueColor);
        doc.text(metric.value, x + 10, top + 31);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(pdfText(metric.sub), x + 10, top + 43);
      });
      y += 126;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('Attempt Summary', left, y);
      y += 12;
      const summary = [
        { label: `${r.correctCount} Correct`, fill: [240, 253, 244] as [number, number, number], text: [22, 163, 74] as [number, number, number] },
        { label: `${r.wrongCount} Wrong`, fill: [254, 242, 242] as [number, number, number], text: [220, 38, 38] as [number, number, number] },
        { label: `${r.skippedCount} Skipped`, fill: [248, 250, 252] as [number, number, number], text: [100, 116, 139] as [number, number, number] },
      ];
      summary.forEach((item, index) => {
        const x = left + index * 120;
        doc.setFillColor(...item.fill);
        doc.roundedRect(x, y, 108, 24, 12, 12, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...item.text);
        doc.text(item.label, x + 54, y + 16, { align: 'center' });
      });
      y += 48;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('Topic Insights', left, y);
      y += 14;
      const topicColumns = [
        { title: 'Strengths to maintain', topics: r.strongTopics, fill: [240, 253, 244] as [number, number, number], color: [22, 163, 74] as [number, number, number], empty: 'Keep practising consistently to build strengths.' },
        { title: 'Focus areas', topics: r.weakTopics, fill: [255, 247, 237] as [number, number, number], color: [194, 65, 12] as [number, number, number], empty: 'Review the explanations for questions you missed.' },
      ];
      topicColumns.forEach((column, index) => {
        const x = left + index * 258;
        roundedCard(x, y, 246, 69, column.fill);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...column.color);
        doc.text(column.title.toUpperCase(), x + 13, y + 17);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        const body = column.topics.length ? column.topics.join(' | ') : column.empty;
        doc.text(doc.splitTextToSize(pdfText(body), 218), x + 13, y + 35);
      });
      y += 93;

      doc.setFillColor(15, 23, 42);
      doc.roundedRect(left, y, contentWidth, 76, 10, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text('Make the next attempt count.', left + 18, y + 23);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(203, 213, 225);
      doc.text('1. Review every explanation, including correct guesses.', left + 18, y + 42);
      doc.text('2. Revisit your focus areas before tomorrow\'s challenge.', left + 18, y + 56);
      doc.text(`Good effort, ${reportName.split(' ')[0]}. Consistency makes you sharper.`, left + 18, y + 70);

      addPage('Question-wise Review');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text('Question-wise Review', left, y);
      y += 18;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Use this section to understand every answer and revise the concepts behind it.', left, y);
      y += 22;

      reviewQuestions.forEach((question, questionIndex) => {
        const correctOption = question.options.find((option, optionIndex) => getOptionKey(option, optionIndex) === question.correctOption);
        const selectedOption = question.options.find((option, optionIndex) => getOptionKey(option, optionIndex) === question.selectedOption);
        const questionLines = doc.splitTextToSize(pdfText(question.questionText), contentWidth - 34) as string[];
        const estimatedHeight = 72 + questionLines.length * 12 + question.options.length * 25;
        ensure(Math.min(estimatedHeight, 260), 'Question-wise Review');

        doc.setFillColor(250, 250, 250);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(left, y, contentWidth, 36, 8, 8, 'FD');
        doc.setFillColor(15, 23, 42);
        doc.circle(left + 18, y + 18, 11, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text(String(question.questionNum || questionIndex + 1), left + 18, y + 21, { align: 'center' });
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(10);
        doc.text(`Question ${question.questionNum || questionIndex + 1}`, left + 38, y + 21);
        const status = question.selectedOption ? (question.isCorrect ? 'CORRECT' : 'WRONG') : 'SKIPPED';
        const statusColor: [number, number, number] = status === 'CORRECT' ? [22, 163, 74] : status === 'WRONG' ? [220, 38, 38] : [100, 116, 139];
        doc.setTextColor(...statusColor);
        doc.setFontSize(8);
        doc.text(status, right - 14, y + 21, { align: 'right' });
        y += 52;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        wrappedText(question.questionText, left, contentWidth, 13);
        y += 7;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(30, 64, 175);
        doc.text(`${pdfText(question.category || 'General Studies')}  |  ${pdfText(question.difficulty || 'Practice')}`, left, y);
        y += 15;

        question.options.forEach((option, optionIndex) => {
          const optionLabel = pdfOptionLabel(option, optionIndex);
          const isCorrectOption = getOptionKey(option, optionIndex) === question.correctOption;
          const isSelectedOption = getOptionKey(option, optionIndex) === question.selectedOption;
          const optionLines = doc.splitTextToSize(pdfText(option.text), contentWidth - 66) as string[];
          const optionHeight = Math.max(24, optionLines.length * 10 + 14);
          ensure(optionHeight + 5, 'Question-wise Review');
          if (isCorrectOption) doc.setFillColor(240, 253, 244);
          else if (isSelectedOption) doc.setFillColor(254, 242, 242);
          else doc.setFillColor(255, 255, 255);
          doc.setDrawColor(...(isCorrectOption ? [22, 163, 74] as [number, number, number] : isSelectedOption ? [220, 38, 38] as [number, number, number] : [226, 232, 240] as [number, number, number]));
          doc.roundedRect(left, y, contentWidth, optionHeight, 6, 6, 'FD');
          doc.setFillColor(...(isCorrectOption ? [22, 163, 74] as [number, number, number] : isSelectedOption ? [220, 38, 38] as [number, number, number] : [241, 245, 249] as [number, number, number]));
          doc.circle(left + 16, y + optionHeight / 2, 8, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(...(isCorrectOption || isSelectedOption ? [255, 255, 255] as [number, number, number] : [15, 23, 42] as [number, number, number]));
          doc.text(optionLabel, left + 16, y + optionHeight / 2 + 3, { align: 'center' });
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(30, 41, 59);
          doc.text(optionLines, left + 32, y + 14);
          y += optionHeight + 5;
        });

        const picked = selectedOption ? `Your answer: ${pdfOptionLabel(selectedOption, question.options.indexOf(selectedOption))}` : 'Your answer: Skipped';
        const correct = correctOption ? `Correct answer: ${pdfOptionLabel(correctOption, question.options.indexOf(correctOption))}` : `Correct answer: ${question.correctOption}`;
        ensure(27, 'Question-wise Review');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(question.isCorrect ? 22 : 220, question.isCorrect ? 163 : 38, question.isCorrect ? 74 : 38);
        doc.text(`${picked}   |   ${correct}`, left + 4, y + 10);
        y += 20;

        if (question.explanation) {
          ensure(35, 'Question-wise Review');
          doc.setFillColor(255, 251, 235);
          doc.roundedRect(left, y, contentWidth, 22, 6, 6, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(180, 83, 9);
          doc.text('EXPLANATION', left + 11, y + 14);
          y += 32;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(51, 65, 85);
          wrappedText(question.explanation, left + 4, contentWidth - 8, 12);
        }
        y += 18;
      });

      footer();
      doc.save(`daily-mcq-report-${reportDate.toISOString().slice(0, 10)}.pdf`);
      setShowDownloadModal(false);
      showToast('Your PDF report has been downloaded.');
    } catch (error) {
      console.error('Unable to generate Daily MCQ PDF report', error);
      showToast('Unable to generate the PDF report. Please try again.');
    } finally {
      setIsDownloading(false);
    }
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
              <h1 className="font-arimo font-extrabold tracking-tight text-[#17223E] text-[26px] leading-[32px] sm:text-[28px] sm:leading-[34px] mb-[clamp(0.25rem,0.5vw,0.5rem)]">
                Daily MCQs Challenge Completed!
              </h1>
              <p className="font-arimo font-medium text-[#475467] text-[14px] leading-[20px]">
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
                      <div className="font-arimo font-extrabold tracking-tight leading-none" style={{ fontSize: 'clamp(28px,2.1vw,38px)', color: '#17223E' }}>
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

            <style>{`
              .dmscore-card{position:relative;border-radius:16px;padding:clamp(12px,1vw,18px);overflow:hidden;transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease;border:1px solid #E5E7EB;box-shadow:0 1px 2px rgba(16,24,40,.04),0 6px 18px -10px rgba(16,24,40,.08);}
              .dmscore-card:hover{transform:translateY(-2px);border-color:#D1D5DB;box-shadow:0 1px 2px rgba(16,24,40,.05),0 14px 28px -14px rgba(16,24,40,.15);}
              .dmscore-card::after{content:"";position:absolute;top:-40px;right:-40px;width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.55),rgba(255,255,255,0));pointer-events:none;}
              .dmscore-accuracy{border-color:#DCE8E1;background:linear-gradient(160deg,#FBFDFC 0%,#F1F7F4 100%);}
              .dmscore-time{border-color:#DCE2EC;background:linear-gradient(160deg,#FBFCFE 0%,#F1F4F9 100%);}
              .dmscore-speed{border-color:#E8DFCE;background:linear-gradient(160deg,#FDFCFA 0%,#F8F4EE 100%);}
              .dmscore-rank{border-color:#E2DAEC;background:linear-gradient(160deg,#FCFBFD 0%,#F4F1F8 100%);}
              .dmscore-icon{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;position:relative;z-index:1;}
              .dmscore-icon-accuracy{background:#ECF5F0;color:#3F8C6E;}
              .dmscore-icon-time{background:#EEF2F8;color:#4A6B96;}
              .dmscore-icon-speed{background:#F6F0E6;color:#9C7A3F;}
              .dmscore-icon-rank{background:#F1EDF6;color:#7A6699;}
              .dmscore-bar{height:5px;border-radius:999px;background:rgba(255,255,255,.6);overflow:hidden;position:relative;z-index:1;}
              .dmscore-bar>span{display:block;height:100%;border-radius:999px;transition:width .4s ease;}
            `}</style>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-[clamp(0.65rem,0.9vw,1rem)] mb-[clamp(0.85rem,1.2vw,1.15rem)]">
              {[
                { label: 'Accuracy', value: `${Math.round(r.accuracy)}%`, sub: 'this attempt', valueSize: 'clamp(18px,1.35vw,26px)', cls: 'dmscore-accuracy', iconCls: 'dmscore-icon-accuracy', barColor: '#7FB29A', barPct: Math.max(0, Math.min(100, Math.round(r.accuracy))), icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>) },
                { label: 'Time Taken', value: `${minutes}m ${seconds}s`, sub: 'of 10 min', valueSize: 'clamp(18px,1.35vw,26px)', cls: 'dmscore-time', iconCls: 'dmscore-icon-time', barColor: '#8AA3C4', barPct: Math.max(0, Math.min(100, Math.round((effectiveTimeSeconds / 600) * 100))), icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2"/><path d="M9 2h6"/></svg>) },
                { label: 'Speed', value: `${speed} min/Q`, sub: 'Avg per question', valueSize: 'clamp(14px,1.1vw,22px)', cls: 'dmscore-speed', iconCls: 'dmscore-icon-speed', barColor: '#C9A876', barPct: Math.max(0, Math.min(100, Math.round(parseFloat(speed) * 100))), icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" fill="currentColor" stroke="none"/></svg>) },
                { label: 'Rank', value: rankLabel, sub: rankSubLabel, valueSize: 'clamp(15px,1.15vw,22px)', cls: 'dmscore-rank', iconCls: 'dmscore-icon-rank', barColor: '#A99BC4', barPct: rankBarPct, icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4h10v4a5 5 0 0 1-10 0V4z"/><path d="M5 4H3v2a3 3 0 0 0 3 3"/><path d="M19 4h2v2a3 3 0 0 1-3 3"/><path d="M12 13v4"/><path d="M8 21h8"/><path d="M9 17h6l1 4H8z" fill="currentColor" stroke="none"/></svg>) },
              ].map((s) => (
                <div key={s.label} className={`dmscore-card ${s.cls}`}>
                  <div className={`dmscore-icon ${s.iconCls}`}>{s.icon}</div>
                  <div className="font-arimo font-bold" style={{ fontSize: 'clamp(10px,0.62vw,11px)', letterSpacing: '0.08em', color: '#64748B', textTransform: 'uppercase', marginTop: 10, position: 'relative', zIndex: 1 }}>{s.label}</div>
                  <div className="font-arimo font-extrabold tracking-tight" style={{ color: '#0F172A', fontSize: s.valueSize, lineHeight: 1.1, marginTop: 4, position: 'relative', zIndex: 1 }}>{s.value}</div>
                  <div className="dmscore-bar" style={{ marginTop: 8 }}><span style={{ width: `${s.barPct}%`, background: s.barColor }} /></div>
                  <div className="font-arimo" style={{ fontSize: 'clamp(10px,0.66vw,12px)', color: '#64748B', marginTop: 8, position: 'relative', zIndex: 1 }}>{s.sub}</div>
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
                .weak-review-btn{color:#8A4A39;background:linear-gradient(135deg,#FEF3F2 0%,#FDE7E3 55%,#FAD9D2 100%);box-shadow:0 10px 22px -14px rgba(138,74,57,.45), inset 0 1px 0 rgba(255,255,255,.6);border:1px solid #F2CFC7;letter-spacing:.01em;}
                .weak-review-btn::after{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(180deg,#F97362,#B23A28);border-radius:12px 0 0 12px;}
                .weak-review-btn:hover{filter:brightness(1.02);transform:translateY(-1px);box-shadow:0 16px 30px -16px rgba(138,74,57,.55);}
                .weak-badge{position:relative;z-index:1;background:#8A4A39;color:#FDE7E3;font-size:10.5px;font-weight:800;letter-spacing:.1em;padding:3px 8px;border-radius:999px;border:1px solid #8A4A39;}
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
                <button type="button" onClick={() => setShowShareModal(true)} className="mcq-act mcq-act-share font-arimo" style={{ justifyContent: 'center', textAlign: 'center' }}>
                  <span className="ic">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M6.5 5.5L10 3.5M6.5 10.5L10 12.5M6.5 8A2 2 0 1 1 2.5 8A2 2 0 0 1 6.5 8ZM13.5 3A2 2 0 1 1 9.5 3A2 2 0 0 1 13.5 3ZM13.5 13A2 2 0 1 1 9.5 13A2 2 0 0 1 13.5 13Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  Share Score
                </button>
                <button type="button" onClick={() => setShowDownloadModal(true)} className="mcq-act mcq-act-download font-arimo" style={{ justifyContent: 'center', textAlign: 'center' }}>
                  <span className="ic">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M8 2V9M8 9L5 6M8 9L11 6M3 12V13.5H13V12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  Download Report
                </button>
                <Link href="/dashboard/daily-mcq?retake=1" className="min-w-0">
                  <button type="button" className="mcq-act mcq-act-retake font-arimo" style={{ justifyContent: 'center', textAlign: 'center' }}>
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
                <button type="button" onClick={() => setShowNextSteps(true)} className="mcq-act mcq-act-next font-arimo min-w-0" style={{ justifyContent: 'center', textAlign: 'center' }}>
                  <span className="ic">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M8 2.5L9.15 6.85L13.5 8L9.15 9.15L8 13.5L6.85 9.15L2.5 8L6.85 6.85L8 2.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                    </svg>
                  </span>
                  View Smart Next Steps
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14" /><path d="M13 6l6 6-6 6" />
                  </svg>
                </button>
                <Link href="/dashboard" className="min-w-0">
                  <button className="mcq-act mcq-act-dash font-arimo" style={{ justifyContent: 'center', textAlign: 'center' }}>
                    <span className="ic" aria-hidden="true" style={{ fontSize: 16, lineHeight: 1 }}>🏠</span>
                    Back to Dashboard
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Download Report modal — mirrors the reference popup */}
      {showDownloadModal && (
        <div
          onClick={() => setShowDownloadModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ fontFamily: 'var(--font-inter-rwj), ui-sans-serif, system-ui, sans-serif', width: '100%', maxWidth: 560, background: '#FFFFFF', borderRadius: 18, boxShadow: '0 30px 70px -25px rgba(15,23,42,0.45)', overflow: 'hidden' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '22px 28px 16px', borderBottom: '1px solid #F0F2F6' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, letterSpacing: '0.16em', fontWeight: 700, color: '#2E3C5C' }}>📥 PERFORMANCE REPORT</div>
                <h3 className="font-jakarta font-extrabold tracking-tight" style={{ fontSize: 20, marginTop: 6, color: '#17223E' }}>Your Daily MCQ Report</h3>
                <p style={{ fontSize: 13, color: '#6B7689', marginTop: 4 }}>{reportDateLabel} · {reportName} · {reportId}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDownloadModal(false)}
                aria-label="Close"
                style={{ width: 36, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#4B5468', cursor: 'pointer', flexShrink: 0 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            {/* What's inside the report */}
            <div style={{ padding: '20px 24px' }}>
              <div style={{ borderRadius: 16, border: '1px solid #D2DAE8', background: 'linear-gradient(135deg,#FBFCFE,#E8EDF5)', padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, flexShrink: 0, background: 'linear-gradient(135deg,#2E3C5C,#1A2848)', boxShadow: '0 8px 18px -10px rgba(46,60,92,.55)' }}>📄</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10.5, letterSpacing: '0.18em', fontWeight: 700, color: '#2E3C5C' }}>PDF · A4 · QUESTION-WISE REVIEW</div>
                    <div className="font-jakarta font-extrabold" style={{ fontSize: 15.5, marginTop: 2, lineHeight: 1.25, color: '#17223E' }}>Your detailed performance dossier — ready to download</div>
                    <p style={{ fontSize: 12.5, color: '#6B7689', marginTop: 4, lineHeight: 1.45 }}>A printable companion you can revise on the go and share with mentors.</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
                  {[
                    { icon: '📊', bg: '#ECFDF5', color: '#047857', label: 'Score & accuracy snapshot' },
                    { icon: '🧭', bg: '#EFF6FF', color: '#0369A1', label: 'Topic-wise strengths & gaps' },
                    { icon: '📝', bg: '#FFFBEB', color: '#B45309', label: `All ${r.questionCount} Qs with explanations` },
                    { icon: '🎯', bg: '#FDF4FF', color: '#A21CAF', label: 'Personalised next steps' },
                  ].map((item) => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12, background: '#FFFFFF', border: '1px solid #E6EAF1', padding: '10px 12px' }}>
                      <span style={{ width: 28, height: 28, borderRadius: 10, background: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>{item.icon}</span>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1F2937' }}>{item.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, fontSize: 11.5, color: '#6B7689' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} /> Updated just now
                  </div>
                  <div>~ 480 KB · {reportId}</div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
                <button
                  type="button"
                  onClick={performDownload}
                  disabled={isDownloading}
                  className="mcq-act mcq-act-download"
                  style={{ justifyContent: 'center', opacity: isDownloading ? 0.7 : 1, cursor: isDownloading ? 'wait' : 'pointer' }}
                >
                  <span className="ic">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M6 11l6 6 6-6M5 21h14" /></svg>
                  </span>
                  {isDownloading ? 'Generating PDF...' : 'Download PDF'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowDownloadModal(false); setShowShareModal(true); }}
                  className="mcq-act mcq-act-share"
                  style={{ justifyContent: 'center' }}
                >
                  <span className="ic">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></svg>
                  </span>
                  Share Detailed Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Score modal — shared component (also used by the Prelims Mock Test score screen) */}
      <ShareScoreModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        brandLabel="RISEWITHJEET · DAILY MCQ"
        challengeName="Daily MCQ Challenge"
        correctCount={r.correctCount}
        totalCount={r.questionCount}
        accuracyPct={Math.round(r.accuracy)}
        rankLabel={rankLabel}
        streak={streak}
        shareUrl={shareUrl}
      />

      {/* Toast */}
      {toastMsg && (
        <div
          style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#0B1426', color: '#fff', padding: '12px 18px', borderRadius: 12, fontSize: 13.5, fontWeight: 500, zIndex: 1100, boxShadow: '0 12px 28px -12px rgba(11,20,38,0.5)' }}
          role="status"
        >
          {toastMsg}
        </div>
      )}

      <SmartNextStepsModal open={showNextSteps} onClose={() => setShowNextSteps(false)} />
    </>
  );
}
