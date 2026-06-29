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
  const [deletingCard, setDeletingCard] = useState(false);

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
  const handleDeleteCard = () => {
    if (!card || deletingCard) return;
    setDeletingCard(true);
    flashcardService.deleteCard(card.id)
      .then(() => {
        const newCards = cards.filter((c) => c.id !== card.id);
        setCards(newCards);
        if (newCards.length === 0) { setShowSessionComplete(true); return; }
        setCurrentIndex((i) => Math.min(i, newCards.length - 1));
        setRevealed(false);
      })
      .catch(() => {})
      .finally(() => setDeletingCard(false));
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

            {/* Delete card button — right */}
            <div className="ml-auto flex items-center gap-3">
              <span style={{ fontFamily: 'Inter', fontSize: 11, color: '#9CA3AF' }}>{ratedCount} of {totalCards} seen</span>
              <button
                type="button"
                onClick={handleDeleteCard}
                disabled={deletingCard}
                title="Delete this card"
                className="flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 transition-colors hover:bg-red-50"
                style={{ border: '1px solid #FCA5A5', background: '#FFF5F5', color: '#EF4444', fontFamily: 'Inter', fontWeight: 600, fontSize: 12, opacity: deletingCard ? 0.6 : 1 }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
                {deletingCard ? 'Deleting…' : 'Delete Card'}
              </button>
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
            <span style={{ color: '#6B7280', fontSize: 10 }}>›</span>
            <Link
              href={`/dashboard/flashcards/${subjectId}`}
              className="flex items-center gap-1"
              style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, color: '#9CA3AF', textDecoration: 'none' }}
            >
              Topic
              <span style={{ fontSize: 10, marginLeft: 2 }}>×</span>
            </Link>
            <span style={{ color: '#6B7280', fontSize: 10 }}>›</span>
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
                  className="absolute inset-0 rounded-[24px] flex flex-col"
                  style={{
                    backfaceVisibility: 'hidden',
                    background: 'linear-gradient(180deg, #0F1419 0%, #1A2332 50%, #0D1218 100%)',
                    border: '0.8px solid rgba(30,41,57,0.5)',
                    boxShadow: '0px 20px 30px rgba(0,0,0,0.5)',
                    minHeight: 280,
                    overflow: 'hidden',
                  }}
                >
                  {/* Top row: QUESTION label + SUBJECT · TOPIC */}
                  <div className="flex items-center justify-between px-8 pt-7 pb-0">
                    <span
                      style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 10, color: '#6A7282', letterSpacing: '2px', textTransform: 'uppercase' }}
                    >
                      Question
                    </span>
                    <span
                      style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 10, color: '#F0B100', letterSpacing: '1.5px', textTransform: 'uppercase' }}
                    >
                      {pretty(subjectId)} · {pretty(topicId)}
                    </span>
                  </div>

                  {/* Question text — left-aligned with padding, vertically centred */}
                  <div className="flex-1 flex items-center px-16 py-6">
                    <p style={{ fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: 28, lineHeight: '46px', color: '#FFFFFF' }}>
                      {card.question}
                    </p>
                  </div>

                  {/* Divider + tap hint */}
                  <div className="px-16 pb-7">
                    <div className="w-full mb-4" style={{ height: '0.8px', background: 'rgba(255,255,255,0.1)' }} />
                    <div className="flex items-center justify-center gap-2">
                      <span style={{ fontSize: 14 }}>👆</span>
                      <span style={{ fontFamily: 'Inter', fontSize: 12, color: '#6A7282' }}>Tap to reveal answer</span>
                    </div>
                  </div>
                </div>

                {/* Back */}
                <div
                  className="absolute inset-0 rounded-[16px] flex flex-col"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    background: '#FFFFFF',
                    border: '0.8px solid #E5E7EB',
                    boxShadow: '0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)',
                    minHeight: 280,
                    overflow: 'hidden',
                  }}
                >
                  {/* Top row: ANSWER label + SUBJECT · TOPIC */}
                  <div className="flex items-center justify-between px-8 pt-7 pb-0">
                    <span
                      style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 12, color: '#101828', letterSpacing: '0.3px', textTransform: 'uppercase' }}
                    >
                      Answer
                    </span>
                    <span
                      style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 10, color: '#101828', letterSpacing: '1.5px', textTransform: 'uppercase' }}
                    >
                      {pretty(subjectId)} · {pretty(topicId)}
                    </span>
                  </div>

                  {/* Answer text */}
                  <div className="flex-1 flex items-center px-12 py-6">
                    <p style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 16, lineHeight: '26px', color: '#101828' }}>
                      {card.answer}
                    </p>
                  </div>

                  {/* Divider + tap to hide hint */}
                  <div className="px-12 pb-7">
                    <div className="w-full mb-4" style={{ height: '0.8px', background: '#E5E7EB' }} />
                    <div className="flex items-center justify-center gap-1">
                      <span style={{ fontSize: 16 }}>👆</span>
                      <span style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 14, color: '#6A7282' }}>Tap to hide answer</span>
                    </div>
                  </div>
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

            {/* Center group — Flip Card/Back + Got it stay together */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleFlip}
                className="flex items-center justify-center gap-2 rounded-[10px] px-6 py-2.5"
                style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 14, color: '#FFFFFF', background: 'linear-gradient(90deg, #F0AE00 0%, #FE6D00 100%)', boxShadow: '0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1)', minWidth: 148 }}
              >
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
            </div>

            {/* Next */}
            <button
              type="button"
              onClick={goNext}
              className="rounded-[10px] px-5 py-2.5"
              style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 14, color: '#FFFFFF', background: '#101828', minWidth: 100 }}
            >
              {isLast ? 'Done' : 'Next ›'}
            </button>
          </div>

        </div>
      </div>

      {/* ── Session complete modal ── */}
      {showSessionComplete && (() => {
        const mastery = totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0;
        return (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowSessionComplete(false)}
        >
          <div
            className="rounded-[24px] bg-white w-full max-w-[400px] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dark header */}
            <div className="text-center" style={{ background: '#0F1629', padding: '32px 32px 28px' }}>
              <div className="text-4xl mb-3" aria-hidden>📚</div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 24, lineHeight: '30px', color: '#FFFFFF' }}>
                Session Complete!
              </h2>
              <p style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 14, color: '#98A2B3', marginTop: 6 }}>
                {pretty(topicId)}
              </p>
            </div>

            {/* Body */}
            <div style={{ padding: '28px 32px 32px' }}>
              {/* Mastery ring */}
              <div className="flex justify-center mb-7">
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 140,
                    height: 140,
                    background: `conic-gradient(#F59E0B ${mastery * 3.6}deg, #E5E7EB 0deg)`,
                  }}
                >
                  <div
                    className="flex flex-col items-center justify-center rounded-full bg-white"
                    style={{ width: 112, height: 112 }}
                  >
                    <span style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 30, color: '#101828' }}>
                      {mastery}%
                    </span>
                    <span className="uppercase tracking-wide" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                      Mastery
                    </span>
                  </div>
                </div>
              </div>

              {/* Stat boxes */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="rounded-[12px] text-center" style={{ background: '#EFF4FF', border: '1px solid #DBE6FF', padding: '16px 12px' }}>
                  <p style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 22, color: '#2563EB' }}>100%</p>
                  <p className="uppercase tracking-wide" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 11, color: '#2563EB', marginTop: 2 }}>Reviewed</p>
                </div>
                <div className="rounded-[12px] text-center" style={{ background: '#E9F9EF', border: '1px solid #CDEFD9', padding: '16px 12px' }}>
                  <p style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 22, color: '#16A34A' }}>{mastery}%</p>
                  <p className="uppercase tracking-wide" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 11, color: '#16A34A', marginTop: 2 }}>Completed</p>
                </div>
              </div>

              {/* Message */}
              <p className="text-center mb-6 mx-auto max-w-[320px]" style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 14, lineHeight: '20px', color: '#6A7282' }}>
                Keep practicing! Spaced repetition will help you master these cards over time.
              </p>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => { setShowSessionComplete(false); setCurrentIndex(0); setRevealed(false); }}
                  className="w-full flex items-center justify-center gap-2 rounded-[12px] py-3"
                  style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 15, color: '#101828', background: 'linear-gradient(90deg, #F3A301 0%, #FD7201 100%)' }}
                >
                  <span aria-hidden>↻</span> Review Again
                </button>
                <Link
                  href="/dashboard/flashcards"
                  className="w-full flex items-center justify-center gap-2 rounded-[12px] py-3"
                  style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 15, color: '#101828', background: '#FFFFFF', border: '1px solid #E5E7EB' }}
                >
                  🏠 Back to Decks
                </Link>
              </div>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
