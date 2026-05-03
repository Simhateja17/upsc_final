'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import CreateFlashcardModal from '@/components/CreateFlashcardModal';
import { flashcardService } from '@/lib/services';
import DashboardPageHero from '@/components/DashboardPageHero';

const DECK_COLORS: Record<string, string> = {
  polity: '#155DFC',
  history: '#D08700',
  geography: '#F6339A',
  economy: '#F0AE00',
  science: '#AD46FF',
  environment: '#14B8A6',
  ethics: '#A78BFA',
  'current-affairs': '#00C950',
  weak: '#E7000B',
};

const DECK_ICONS: Record<string, string> = {
  polity: '🏛️',
  history: '📜',
  geography: '🌍',
  economy: '💰',
  science: '🔬',
  environment: '🌿',
  ethics: '⚖️',
  'current-affairs': '📰',
  weak: '⚠️',
};

const DECK_CARD_STYLES: Record<string, { bg: string; border: string; bar: string }> = {
  polity: { bg: '#FFF7E6', border: '#FED7AA', bar: '#F0AE00' },
  history: { bg: '#FFF7ED', border: '#FDBA74', bar: '#D08700' },
  geography: { bg: '#ECFDF5', border: '#A7F3D0', bar: '#14B8A6' },
  economy: { bg: '#F5F3FF', border: '#DDD6FE', bar: '#8B5CF6' },
  environment: { bg: '#E8FFF3', border: '#BBF7D0', bar: '#22C55E' },
  ethics: { bg: '#EEF2FF', border: '#C7D2FE', bar: '#6366F1' },
  'current-affairs': { bg: '#FEF2F2', border: '#FECACA', bar: '#EF4444' },
  science: { bg: '#EAF4FF', border: '#BFDBFE', bar: '#3B82F6' },
  weak: { bg: '#F8FAFC', border: '#CBD5E1', bar: '#64748B' },
};

type Deck = {
  id: string;
  subject: string;
  icon: string;
  totalCards: number;
  topics: number;
  mastery: number;
  masteredCards: number;
};

function displaySubjectName(subject: string) {
  if (subject === 'Modern History') return 'History';
  return subject;
}

export default function FlashcardsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    flashcardService.getSubjects()
      .then((res) => {
        if (res.status === 'success') setDecks(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalCards = decks.reduce((s, d) => s + d.totalCards, 0);
  const totalMastered = decks.reduce((s, d) => s + d.masteredCards, 0);
  const coverage = totalCards > 0 ? Math.round((totalMastered / totalCards) * 100) : 0;
  const needReview = decks.reduce((s, d) => s + (d.totalCards - d.masteredCards), 0);

  const bannerMetrics = [
    { label: 'TOTAL CARDS', value: String(totalCards), valueColor: '#F5A623', valueSize: 18 },
    { label: 'MASTERED', value: String(totalMastered), valueColor: '#FF7070', valueSize: 18 },
    { label: 'COVERAGE', value: `${coverage}%`, valueColor: '#FFFFFF', valueSize: 18 },
    { label: 'NEED REVIEW', value: String(needReview), valueColor: '#0E8A56', valueSize: 18 },
  ];

  return (
    <div className="flex overflow-hidden font-arimo" style={{ background: '#F9FAFB', height: '100%' }}>
      <div className="flex-1 overflow-y-auto">
        <DashboardPageHero
          badgeText="Revision - Smart Learning System"
          title={<>Your <span style={{ color: '#FFCB47', fontStyle: 'italic' }}>Flashcard</span> <span style={{ fontStyle: 'italic', color: '#FFFFFF' }}>Vault.</span></>}
          subtitle="Powered by spaced repetition science. Study smarter each card surfaces exactly when your brain is about to forget it."
          stats={bannerMetrics.map(m => ({ value: m.value, label: m.label, color: m.valueColor }))}
        />
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

          {/* 1 Choose a Subject */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: '#101828', fontFamily: 'Inter', fontWeight: 600, fontSize: 14, lineHeight: '20px', color: '#FFFFFF' }}
              >
                1
              </div>
              <h2 style={{ fontFamily: 'Georgia', fontWeight: 700, fontSize: 36, lineHeight: '40px', color: '#101828' }}>
                Choose a <span style={{ fontStyle: 'italic', color: '#F0B100' }}>Subject</span>
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 rounded-[10px] px-5 py-2.5"
              style={{
                background: 'linear-gradient(90deg, #F0AE00 0%, #FE6D00 100%)',
                boxShadow: '0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1)',
                fontFamily: 'Inter', fontWeight: 700, fontSize: 14, lineHeight: '20px', color: '#FFFFFF',
              }}
            >
              <span>+</span> New Flashcard
            </button>
          </div>
          <p
            className="mb-6"
            style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 14, lineHeight: '20px', color: '#6A7282' }}
          >
            Pick the subject you want to revise today
          </p>

          {/* Subject cards grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 xl:gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-[10px] border animate-pulse" style={{ border: '0.8px solid #E5E7EB', background: '#F9FAFB', minHeight: 201 }} />
              ))}
            </div>
          ) : decks.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg font-semibold mb-2">No flashcard decks yet</p>
              <p className="text-sm">Create your first flashcard to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 xl:gap-5">
              {decks.map((deck) => {
                const progressColor = DECK_COLORS[deck.id] ?? '#155DFC';
                const cardStyle = DECK_CARD_STYLES[deck.id] ?? { bg: '#FFFFFF', border: '#E5E7EB', bar: progressColor };
                const icon = DECK_ICONS[deck.id] ?? deck.icon;
                const due = deck.totalCards - deck.masteredCards;
                return (
                  <Link
                    key={deck.id}
                    href={`/dashboard/flashcards/${deck.id}`}
                    className="block rounded-[16px] p-5 border transition-all hover:-translate-y-0.5 hover:shadow-md"
                    style={{ border: `1px solid ${cardStyle.border}`, background: cardStyle.bg, minHeight: 172 }}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-3xl" aria-hidden>{icon}</span>
                    </div>
                    <h3
                      className="mt-4 mb-1"
                      style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 18, lineHeight: '28px', color: '#101828' }}
                    >
                      {displaySubjectName(deck.subject)}
                    </h3>
                    <p
                      className="mb-3"
                      style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 12, lineHeight: '16px', color: '#6A7282' }}
                    >
                      {deck.totalCards} cards · {deck.topics} topics
                    </p>
                    <div className="w-full h-1 rounded-full mb-3" style={{ background: '#F3F4F6' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${deck.mastery}%`, background: cardStyle.bar, maxWidth: '100%' }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 12, lineHeight: '16px', color: progressColor }}>
                        {deck.mastery}% mastered
                      </span>
                      {due === 0 ? (
                        <span style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, lineHeight: '16px', color: '#00C950' }}>
                          ✓ All done
                        </span>
                      ) : (
                        <span style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, lineHeight: '16px', color: '#F54900' }}>
                          {due} due
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <CreateFlashcardModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
