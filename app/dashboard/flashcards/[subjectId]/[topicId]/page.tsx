'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { flashcardService } from '@/lib/services';

type Card = {
  id: string;
  question: string;
  answer: string;
  difficulty: string;
  mastered: boolean;
};

const SUBJECT_ICONS: Record<string, string> = {
  polity: '🏛️', history: '📜', geography: '🌍', economy: '💰',
  'environment-ecology': '🌿', 'science-technology': '🔬', 'current-affairs': '📰',
};

function pretty(slug: string) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function FlashcardReviewPage() {
  const params = useParams<{ subjectId: string; topicId: string }>();
  const subjectId = typeof params?.subjectId === 'string' ? params.subjectId : '';
  const topicId   = typeof params?.topicId   === 'string' ? params.topicId   : '';

  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [showSessionComplete, setShowSessionComplete] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);

  useEffect(() => {
    if (!subjectId || !topicId) return;
    flashcardService.getCards(subjectId, topicId)
      .then((res) => {
        if (res.status === 'success') {
          setCards(res.data);
          setMasteredCount(res.data.filter((c: Card) => c.mastered).length);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [subjectId, topicId]);

  const totalCards = cards.length;
  const card = cards[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast  = currentIndex === totalCards - 1;

  const goPrev = () => {
    if (!isFirst) { setCurrentIndex((i) => i - 1); setRevealed(false); }
  };
  const goNext = () => {
    if (isLast) setShowSessionComplete(true);
    else { setCurrentIndex((i) => i + 1); setRevealed(false); }
  };
  const handleFlip = () => {
    if (!revealed && card && !card.mastered) {
      flashcardService.updateProgress(card.id, false).catch(() => {});
    }
    setRevealed((v) => !v);
  };
  const handleMastered = () => {
    if (!card) return;
    flashcardService.updateProgress(card.id, true)
      .then(() => {
        setCards((prev) => prev.map((c) => c.id === card.id ? { ...c, mastered: true } : c));
        setMasteredCount((n) => n + 1);
        goNext();
      })
      .catch(() => goNext());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ background: '#FAFBFE', height: '100%' }}>
        <div className="animate-pulse text-gray-400">Loading cards…</div>
      </div>
    );
  }

  if (!loading && cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4" style={{ background: '#FAFBFE', height: '100%' }}>
        <p className="text-gray-500">No cards found for this topic.</p>
        <Link href={`/dashboard/flashcards/${subjectId}`} className="text-blue-600 underline text-sm">← Back to Topics</Link>
      </div>
    );
  }

  const subjectIcon = SUBJECT_ICONS[subjectId] ?? '📘';
  const ratedCount = cards.filter((c, i) => c.mastered || i < currentIndex).length;

  return (
    <div className="flex overflow-hidden" style={{ background: '#FAFBFE', height: '100%' }}>
      <div className="flex-1 overflow-y-auto" style={{ background: '#FAFBFE' }}>
        <div className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 py-5">

          {/* ── Back link ── */}
          <Link
            href={`/dashboard/flashcards/${subjectId}`}
            className="inline-flex items-center gap-1.5 mb-4"
            style={{ fontFamily: 'Inter', fontSize: 13, color: '#6B7280' }}
          >
            <span aria-hidden>←</span> Back to Topics
          </Link>

          {/* ── Top nav: colorful chips + card count + keyboard hint ── */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {/* Subject chip — purple */}
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1"
              style={{ background: '#EDE9FE', color: '#7C3AED', fontFamily: 'Inter', fontWeight: 600, fontSize: 12 }}
            >
              <span aria-hidden>{subjectIcon}</span>
              {pretty(subjectId)}
            </span>

            {/* Topic chip — blue */}
            <span
              className="inline-flex items-center rounded-full px-3 py-1"
              style={{ background: '#DBEAFE', color: '#1D4ED8', fontFamily: 'Inter', fontWeight: 600, fontSize: 12 }}
            >
              {pretty(topicId)}
            </span>

            <span style={{ fontFamily: 'Inter', fontSize: 12, color: '#9CA3AF', marginLeft: 4 }}>
              Card {currentIndex + 1} / {totalCards}
            </span>

            {/* Keyboard hints — right */}
            <div className="ml-auto hidden sm:flex items-center gap-2" style={{ fontFamily: 'Inter', fontSize: 11, color: '#C9CFD8' }}>
              <span style={{ background: '#F1F3F5', border: '0.5px solid #E2E5ED', borderRadius: 4, padding: '1px 6px', fontSize: 10, color: '#6B7280' }}>Space</span>
              <span>Flip</span>
              <span style={{ background: '#F1F3F5', border: '0.5px solid #E2E5ED', borderRadius: 4, padding: '1px 6px', fontSize: 10, color: '#6B7280' }}>→</span>
              <span>Next</span>
              <span style={{ marginLeft: 8, color: '#9CA3AF' }}>{ratedCount} of {totalCards} seen</span>
            </div>
          </div>

          {/* ── Segmented progress bar ── */}
          <div className="flex gap-1 mb-4" style={{ height: 6 }}>
            {cards.map((c, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm transition-colors duration-300"
                style={{
                  background: c.mastered
                    ? '#22C55E'
                    : i === currentIndex
                    ? '#6366F1'
                    : i < currentIndex
                    ? '#C7D2FE'
                    : '#E5E7EB',
                }}
              />
            ))}
          </div>

          {/* ── Step breadcrumb row — grey Subject × Topic × | Flashcards active ── */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Link
              href="/dashboard/flashcards"
              className="flex items-center gap-1"
              style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, color: '#9CA3AF', textDecoration: 'none' }}
            >
              Subject
              <span style={{ fontSize: 10, marginLeft: 2 }}>×</span>
            </Link>
            <span style={{ color: '#E5E7EB', fontSize: 10 }}>›</span>
            <Link
              href={`/dashboard/flashcards/${subjectId}`}
              className="flex items-center gap-1"
              style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, color: '#9CA3AF', textDecoration: 'none' }}
            >
              Topic
              <span style={{ fontSize: 10, marginLeft: 2 }}>×</span>
            </Link>
            <span style={{ color: '#E5E7EB', fontSize: 10 }}>›</span>
            <span
              className="flex items-center gap-1.5"
              style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 13, color: '#101828' }}
            >
              🧠 Flashcards
              <span
                className="inline-flex items-center justify-center rounded-full"
                style={{ background: '#101828', color: '#FFFFFF', fontFamily: 'Inter', fontWeight: 700, fontSize: 10, width: 20, height: 20, flexShrink: 0 }}
              >
                {totalCards}
              </span>
            </span>

            {/* Right side: difficulty + hint + bookmark */}
            {card && (
              <div className="ml-auto flex items-center gap-2">
                {card.difficulty && (
                  <span
                    className="rounded-full px-3 py-0.5"
                    style={{
                      fontFamily: 'Inter', fontWeight: 600, fontSize: 11,
                      ...(card.difficulty.toLowerCase() === 'easy'
                        ? { background: '#F0FDF4', color: '#16A34A', border: '0.5px solid #BBF7D0' }
                        : card.difficulty.toLowerCase() === 'medium'
                        ? { background: '#FFFBEB', color: '#D97706', border: '0.5px solid #FDE68A' }
                        : { background: '#FEF2F2', color: '#DC2626', border: '0.5px solid #FCA5A5' }),
                    }}
                  >
                    {card.difficulty.charAt(0).toUpperCase() + card.difficulty.slice(1).toLowerCase()}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── Main flashcard ── */}
          {card && (
            <div className="w-full mb-5" style={{ perspective: '1400px' }}>
              <div
                role="button"
                tabIndex={0}
                onClick={handleFlip}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFlip(); } }}
                className="relative cursor-pointer outline-none"
                style={{
                  minHeight: 280,
                  transformStyle: 'preserve-3d',
                  transition: 'transform 600ms cubic-bezier(0.4, 0.2, 0.2, 1)',
                  transform: revealed ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* Front */}
                <div
                  className="absolute inset-0 rounded-[18px] p-7 flex flex-col"
                  style={{
                    backfaceVisibility: 'hidden',
                    background: 'linear-gradient(145deg, #1A1D23, #2D3140)',
                    border: '0.5px solid #30363D',
                    minHeight: 280,
                  }}
                >
                  <span
                    className="uppercase tracking-[1.5px] mb-5"
                    style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 10, color: '#6E7681' }}
                  >
                    Question
                  </span>
                  <div className="flex-1 flex items-center">
                    <p style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 22, lineHeight: '36px', color: '#FFFFFF' }}>
                      {card.question}
                    </p>
                  </div>
                  {/* Subtle "click to reveal" hint bottom-right */}
                  <div className="flex justify-end mt-4">
                    <span style={{ fontFamily: 'Inter', fontSize: 11, color: '#484F58', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 1v7M8 1L5 4M8 1l3 3" stroke="#484F58" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 9v4a1 1 0 001 1h8a1 1 0 001-1V9" stroke="#484F58" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      Click to reveal answer
                    </span>
                  </div>
                </div>

                {/* Back */}
                <div
                  className="absolute inset-0 rounded-[18px] p-7 flex flex-col"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    background: '#FFFFFF',
                    border: '1.5px solid #E2E5ED',
                    minHeight: 280,
                  }}
                >
                  <span
                    className="uppercase tracking-[1.5px] mb-5"
                    style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 10, color: '#9CA3AF' }}
                  >
                    Answer
                  </span>
                  <div className="flex-1 flex flex-col justify-center">
                    <p style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 16, lineHeight: '26px', color: '#101828' }}>
                      {card.answer}
                    </p>
                  </div>
                  <div className="h-px w-full mt-4 mb-3" style={{ background: '#F1F3F5' }} />
                  <p style={{ fontFamily: 'Inter', fontSize: 11, color: '#9CA3AF' }}>
                    How well did you know this? Mark below.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Bottom buttons ── */}
          <div className="flex items-center justify-between gap-3">
            {/* Prev */}
            <button
              type="button"
              onClick={goPrev}
              disabled={isFirst}
              className="rounded-[10px] px-5 py-2.5 border disabled:opacity-40"
              style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 14, color: '#364153', background: '#FFFFFF', border: '0.8px solid #D1D5DC', minWidth: 100 }}
            >
              ‹ Prev
            </button>

            {/* Flip Card — amber bg, dark navy text, rotate icon */}
            <button
              type="button"
              onClick={handleFlip}
              className="flex items-center gap-2 rounded-[10px] px-6 py-2.5"
              style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 14, color: '#101828', background: '#F0AE00', minWidth: 148 }}
            >
              {/* Rotate / flip icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
              {revealed ? 'Flip Back' : 'Flip Card'}
            </button>

            {/* Got it — only when revealed and not yet mastered */}
            {revealed && !card?.mastered && (
              <button
                type="button"
                onClick={handleMastered}
                className="rounded-[10px] px-5 py-2.5"
                style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 14, color: '#FFFFFF', background: '#16A34A', minWidth: 110 }}
              >
                ✓ Got it!
              </button>
            )}

            {/* Next */}
            <button
              type="button"
              onClick={goNext}
              className="rounded-[10px] px-5 py-2.5"
              style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 14, color: '#FFFFFF', background: '#101828', minWidth: 100 }}
            >
              Next ›
            </button>
          </div>

        </div>
      </div>

      {/* ── Session complete modal ── */}
      {showSessionComplete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowSessionComplete(false)}
        >
          <div
            className="rounded-[24px] bg-white w-full max-w-md overflow-hidden shadow-xl text-center"
            style={{ padding: '40px 32px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-4xl mb-4" aria-hidden>🎉</div>
            <h2 className="mb-2" style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 24, color: '#101828' }}>
              Session Complete!
            </h2>
            <p className="mb-8 mx-auto max-w-[320px]" style={{ fontFamily: 'Inter', fontSize: 14, color: '#6A7282' }}>
              Great work! Cards updated in your spaced repetition schedule.
            </p>
            <div className="flex justify-center gap-8 mb-8">
              <div>
                <p style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 28, color: '#7C3AED' }}>{totalCards}</p>
                <p className="uppercase tracking-wide" style={{ fontFamily: 'Inter', fontSize: 10, color: '#6A7282' }}>Reviewed</p>
              </div>
              <div>
                <p style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 28, color: '#16A34A' }}>100%</p>
                <p className="uppercase tracking-wide" style={{ fontFamily: 'Inter', fontSize: 10, color: '#6A7282' }}>Completed</p>
              </div>
              <div>
                <p style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 28, color: '#F59E0B' }}>
                  {totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0}%
                </p>
                <p className="uppercase tracking-wide" style={{ fontFamily: 'Inter', fontSize: 10, color: '#6A7282' }}>Mastery</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => { setShowSessionComplete(false); setCurrentIndex(0); setRevealed(false); }}
                className="rounded-[10px] px-5 py-2.5 border"
                style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 14, color: '#364153', background: '#FFFFFF', border: '0.8px solid #D1D5DC' }}
              >
                Review Again
              </button>
              <Link
                href="/dashboard/flashcards"
                className="inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5"
                style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 14, color: '#FFFFFF', background: '#101828' }}
              >
                🏠 Back to Decks
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
