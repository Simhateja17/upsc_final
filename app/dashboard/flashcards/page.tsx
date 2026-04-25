'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import CreateFlashcardModal from '@/components/CreateFlashcardModal';
import { flashcardService } from '@/lib/services';

const heroBackground = 'https://www.figma.com/api/mcp/asset/ff3b4559-2efb-467e-86d0-c6f5844156ff';

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
    { label: 'TOTAL CARDS', value: String(totalCards), valueColor: '#7D96B3' },
    { label: 'MASTERED', value: String(totalMastered), valueColor: '#4ADE80' },
    { label: 'COVERAGE', value: `${coverage}%`, valueColor: '#FBBF24' },
    { label: 'NEED REVIEW', value: String(needReview), valueColor: '#FB7185' },
  ];

  return (
    <div className="flex overflow-hidden" style={{ background: '#FAFBFE', height: '100%' }}>
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Flashcard Vault banner */}
          <div
            className="relative w-full overflow-hidden rounded-[16px] px-4 sm:px-8 pt-8 sm:pt-10 pb-8 mb-8"
            style={{
              background: '#161C2D',
              minHeight: 277,
            }}
          >
            <div className="pointer-events-none absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroBackground}
                alt=""
                aria-hidden="true"
                className="absolute left-0 top-[-14%] h-[128%] w-full max-w-none object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(180deg, rgba(18,24,39,0.92) 0%, rgba(18,24,39,0.96) 100%)',
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)',
                  backgroundSize: '28px 28px',
                  opacity: 0.28,
                }}
              />
              <div
                className="absolute -right-20 bottom-[-56px] h-56 w-[420px] rounded-full blur-3xl"
                style={{ background: 'radial-gradient(circle, rgba(255,196,107,0.18) 0%, rgba(255,196,107,0) 70%)' }}
              />
            </div>

            <div className="relative z-10">
              <div className="mb-2 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.55px] text-[#FFCB47]" style={{ fontFamily: 'Inter' }}>
                Revision — Smart Learning System
              </div>

              <div className="relative max-w-[920px]">
                <h1 className="max-w-[680px] text-white" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 48, lineHeight: '48px', letterSpacing: 0 }}>
                  Your <span style={{ color: '#FFCB47', fontStyle: 'italic' }}>Flashcard</span> <span style={{ fontStyle: 'italic', color: '#FFFFFF' }}>Vault.</span>
                </h1>

                <p
                  className="mt-5 max-w-[574px]"
                  style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 14, lineHeight: '20px', letterSpacing: 0, color: '#4A5565' }}
                >
                  Powered by spaced repetition science. Study smarter each card surfaces exactly when your brain is about to forget it.
                </p>
              </div>

              <div className="mt-12 flex items-start">
                <div
                  className="grid w-full max-w-[690px] grid-cols-4 overflow-hidden rounded-[20px] bg-[#1A2134]"
                  style={{ boxShadow: '0px 6px 18px rgba(0,0,0,0.18)' }}
                >
                  {bannerMetrics.map((m, index) => (
                    <div
                      key={m.label}
                      className={`flex min-h-[63px] flex-col items-center justify-center px-3 py-3 ${index < bannerMetrics.length - 1 ? 'border-r border-white/8' : ''}`}
                    >
                      <div
                        className="text-[18px] font-extrabold leading-none tracking-[-0.4px]"
                        style={{ fontFamily: 'var(--font-jakarta)', color: m.valueColor }}
                      >
                        {m.value}
                      </div>
                      <div
                        className="mt-1 text-[9.5px] font-normal uppercase tracking-[0.6px] text-white/40"
                        style={{ fontFamily: 'var(--font-jakarta)' }}
                      >
                        {m.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute right-4 top-4 hidden sm:block">
              <div className="relative h-[187px] w-[310px]">
                <div className="absolute left-[82px] top-[7px] h-[126px] w-[181px] -rotate-6 rounded-[16px] border border-[rgba(61,90,127,0.3)] bg-[rgba(30,58,95,0.4)]" />
                <div className="absolute left-[95px] top-[2px] h-[129px] w-[181px] -rotate-3 rounded-[16px] border border-[rgba(61,95,130,0.4)] bg-[rgba(35,69,103,0.5)]" />
                <div className="absolute left-[107px] top-0 h-[129px] w-[181px] rounded-[16px] border-[1.6px] border-[rgba(90,122,159,0.4)] bg-gradient-to-b from-[#3d5f82] to-[#2a4562] p-[1.6px] shadow-[0px_25px_50px_0px_rgba(0,0,0,0.25)]">
                  <div className="flex h-full w-full flex-col gap-4 px-6 pt-6">
                    <div style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 10, lineHeight: '16px', letterSpacing: '1.8px', textTransform: 'uppercase', color: 'rgba(122,154,184,0.6)' }}>
                      Question
                    </div>
                    <div className="relative h-[26px] w-full">
                      <div className="absolute left-[0.4px] top-[0.41px] h-[6px] w-[129px] rounded-full bg-[rgba(90,122,159,0.25)]" />
                      <div className="absolute left-[0.4px] top-[13.41px] h-[5px] w-[129px] rounded-full bg-[rgba(90,122,159,0.25)]" />
                    </div>
                  </div>
                </div>
                <div className="absolute left-[-20px] top-[-34px] h-[254px] w-[397px]">
                  <div className="absolute left-[20.9px] top-[42px] size-[10px] rounded-full bg-[rgba(0,212,146,0.5)]" />
                  <div className="absolute left-[8.35px] top-[98px] size-[8px] rounded-full bg-[rgba(0,187,167,0.4)]" />
                  <div className="absolute left-[33.44px] top-[190px] size-[6px] rounded-full bg-[rgba(106,114,130,0.3)]" />
                  <div className="absolute left-[50.15px] top-[216px] size-[8px] rounded-full bg-[rgba(81,162,255,0.4)]" />
                  <div className="absolute left-[249.16px] top-[247.6px] size-[10px] rounded-full bg-[rgba(43,127,255,0.5)]" />
                  <div className="absolute left-[332.76px] top-[22.4px] size-[10px] rounded-full bg-[rgba(240,177,0,0.6)]" />
                  <div className="absolute left-[359.85px] top-[50.4px] size-[8px] rounded-full bg-[rgba(254,154,0,0.5)]" />
                  <div className="absolute left-[294.96px] top-[33.6px] size-[6px] rounded-full bg-[rgba(153,161,175,0.3)]" />
                </div>
              </div>
            </div>
          </div>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 xl:gap-6">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 xl:gap-6">
              {decks.map((deck) => {
                const progressColor = DECK_COLORS[deck.id] ?? '#155DFC';
                const icon = DECK_ICONS[deck.id] ?? deck.icon;
                const due = deck.totalCards - deck.masteredCards;
                return (
                  <Link
                    key={deck.id}
                    href={`/dashboard/flashcards/${deck.id}`}
                    className="block rounded-[10px] p-6 border transition-shadow hover:shadow-md"
                    style={{ border: '0.8px solid #E5E7EB', background: '#FFFFFF', minHeight: 201.57 }}
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
                        style={{ width: `${deck.mastery}%`, background: progressColor, maxWidth: '100%' }}
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
