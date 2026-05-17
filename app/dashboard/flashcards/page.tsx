'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import CreateFlashcardModal from '@/components/CreateFlashcardModal';
import { flashcardService } from '@/lib/services';
import DashboardPageHero from '@/components/DashboardPageHero';

type Deck = {
  id: string;
  subject: string;
  icon: string;
  totalCards: number;
  topics: number;
  mastery: number;
  masteredCards: number;
};

type SubjectCatalogItem = {
  id: string;
  subject: string;
  shortLabel?: string;
  icon: string;
  viewsLabel: string;
  isNew?: boolean;
  card: { bg: string; border: string; bar: string };
};

const SUBJECT_CATALOG: SubjectCatalogItem[] = [
  { id: 'polity', subject: 'Polity', shortLabel: 'Indian Polity', icon: '⚖️', viewsLabel: '3.2L views', card: { bg: '#FDF0DE', border: '#C0D9F5', bar: '#E9A12D' } },
  { id: 'economy', subject: 'Economy', shortLabel: 'Indian Economy', icon: '📈', viewsLabel: '1.9L views', card: { bg: 'linear-gradient(139deg, #F3EFFD 0%, #EDE7FB 100%)', border: '#E8E1FD', bar: '#F16CB0' } },
  { id: 'geography', subject: 'Geography', icon: '🌍', viewsLabel: '2.1L views', card: { bg: 'rgba(201, 168, 76, 0.19)', border: '#B2EDD0', bar: '#D5A53C' } },
  { id: 'history', subject: 'History', icon: '🏛️', viewsLabel: '2.8L views', card: { bg: '#FFF8EE', border: '#FFD5A8', bar: '#E8B164' } },
  { id: 'environment-ecology', subject: 'Environment & Ecology', shortLabel: 'Environment', icon: '🌿', viewsLabel: '2.4L views', card: { bg: 'linear-gradient(139deg, #EDF9F3 0%, #E0F5EA 100%)', border: '#B2EDD0', bar: '#D6A437' } },
  { id: 'ethics', subject: 'Ethics', shortLabel: 'Ethics GS4', icon: '🤝', viewsLabel: '96K views', card: { bg: 'linear-gradient(139deg, #EEF2F8 0%, #E8EDF6 100%)', border: '#DDE5F0', bar: '#D8A23A' } },
  { id: 'essay', subject: 'Essay', shortLabel: 'Essay Writing', icon: '✍️', viewsLabel: '3.5L views', card: { bg: 'linear-gradient(139deg, #FEF5EC 0%, #FEF0E0 100%)', border: '#FFD5A8', bar: '#E8B164' } },
  { id: 'internal-security', subject: 'Internal Security', icon: '🛡️', viewsLabel: '76K views', isNew: true, card: { bg: 'linear-gradient(139deg, #FEF0F0 0%, #FDE8E8 100%)', border: '#FFCECE', bar: '#F0A33E' } },
  { id: 'international-relations', subject: 'International Relations', shortLabel: "Int'l Relations", icon: '🌐', viewsLabel: '1.1L views', card: { bg: 'linear-gradient(139deg, #F0EBFF 0%, #E8E1FD 100%)', border: '#E8E1FD', bar: '#F2A63D' } },
  { id: 'science-technology', subject: 'Science & Technology', shortLabel: 'Science & Tech', icon: '🔬', viewsLabel: '2.1L views', card: { bg: 'linear-gradient(139deg, #E0EBF9 0%, #D4E4F7 100%)', border: '#C0D9F5', bar: '#E0A446' } },
  { id: 'current-affairs', subject: 'Current Affairs', icon: '📰', viewsLabel: '2.6L views', card: { bg: 'linear-gradient(139deg, #FFF1E8 0%, #FFE6D5 100%)', border: '#FFD1AA', bar: '#F39A3C' } },
  { id: 'society', subject: 'Society', icon: '👥', viewsLabel: '84K views', card: { bg: 'linear-gradient(139deg, #F8F2FF 0%, #F0E7FF 100%)', border: '#E6D8FF', bar: '#D79A41' } },
  { id: 'governance', subject: 'Governance', icon: '🏛', viewsLabel: '92K views', card: { bg: 'linear-gradient(139deg, #EFF6FF 0%, #E0EEFF 100%)', border: '#C8DEFF', bar: '#E3A33A' } },
  { id: 'social-justice', subject: 'Social Justice', icon: '⚖', viewsLabel: '73K views', card: { bg: 'linear-gradient(139deg, #FFF5EF 0%, #FFE9DE 100%)', border: '#FFD8BF', bar: '#E5A246' } },
  { id: 'agriculture', subject: 'Agriculture', icon: '🌾', viewsLabel: '68K views', card: { bg: 'linear-gradient(139deg, #EDF9F3 0%, #E3F6EC 100%)', border: '#C9EED8', bar: '#D39B37' } },
  { id: 'disaster-management', subject: 'Disaster Management', icon: '🚨', viewsLabel: '58K views', card: { bg: 'linear-gradient(139deg, #FFF0F1 0%, #FFE4E7 100%)', border: '#FFC9D0', bar: '#E39C4A' } },
  { id: 'gs1', subject: 'GS1', icon: '📘', viewsLabel: '1.2L views', card: { bg: 'linear-gradient(139deg, #EEF4FF 0%, #E3ECFF 100%)', border: '#C8D7FF', bar: '#D9A13C' } },
  { id: 'gs2', subject: 'GS2', icon: '📙', viewsLabel: '1.1L views', card: { bg: 'linear-gradient(139deg, #F9F0FF 0%, #F2E6FF 100%)', border: '#E7D2FF', bar: '#E0A13F' } },
  { id: 'gs3', subject: 'GS3', icon: '📗', viewsLabel: '1.0L views', card: { bg: 'linear-gradient(139deg, #EEF9F2 0%, #E2F4E8 100%)', border: '#C9EBD3', bar: '#D7A038' } },
  { id: 'gs4', subject: 'GS4', icon: '📕', viewsLabel: '88K views', card: { bg: 'linear-gradient(139deg, #FFF6EE 0%, #FFECDD 100%)', border: '#FFDAB7', bar: '#E2A24A' } },
  { id: 'optional-paper-1', subject: 'Optional Paper 1', icon: '📓', viewsLabel: '64K views', card: { bg: 'linear-gradient(139deg, #EEF2FF 0%, #E6EBFF 100%)', border: '#D0D9FF', bar: '#DB9F43' } },
  { id: 'optional-paper-2', subject: 'Optional Paper 2', icon: '📔', viewsLabel: '61K views', card: { bg: 'linear-gradient(139deg, #F8F2FF 0%, #F1E8FF 100%)', border: '#E6D6FF', bar: '#DDA042' } },
];

function displaySubjectName(subject: string) {
  if (subject === 'Modern History') return 'History';
  return subject;
}

export default function FlashcardsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [prefillSubject, setPrefillSubject] = useState('');
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

  const totalCards = decks.reduce((sum, deck) => sum + deck.totalCards, 0);
  const totalMastered = decks.reduce((sum, deck) => sum + deck.masteredCards, 0);
  const coverage = totalCards > 0 ? Math.round((totalMastered / totalCards) * 100) : 0;
  const needReview = decks.reduce((sum, deck) => sum + (deck.totalCards - deck.masteredCards), 0);

  const bannerMetrics = [
    { label: 'TOTAL CARDS', value: String(totalCards), valueColor: '#F5A623' },
    { label: 'MASTERED', value: String(totalMastered), valueColor: '#FF7070' },
    { label: 'COVERAGE', value: `${coverage}%`, valueColor: '#FFFFFF' },
    { label: 'NEED REVIEW', value: String(needReview), valueColor: '#0E8A56' },
  ];

  const deckMap = new Map(decks.map((deck) => [deck.id, deck]));
  const subjectCards = SUBJECT_CATALOG.map((item) => {
    const deck = deckMap.get(item.id);
    return {
      ...item,
      deck,
      totalCards: deck?.totalCards ?? 0,
      topics: deck?.topics ?? 0,
      mastery: deck?.mastery ?? 0,
      masteredCards: deck?.masteredCards ?? 0,
    };
  });

  return (
    <div className="flex overflow-hidden font-arimo" style={{ background: '#F9FAFB', height: '100%' }}>
      <div className="flex-1 overflow-y-auto">
        <DashboardPageHero
          badgeText="Revision - Smart Learning System"
          title={<>Your <span style={{ color: '#E8B84B', fontStyle: 'italic' }}>Flashcard</span> <span style={{ fontStyle: 'italic', color: '#FFFFFF' }}>Vault.</span></>}
          subtitle="Powered by spaced repetition science. Study smarter each card surfaces exactly when your brain is about to forget it."
          stats={bannerMetrics.map((metric) => ({ value: metric.value, label: metric.label, color: metric.valueColor }))}
        />

        <div className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                style={{ background: '#101828', fontFamily: 'Inter', fontWeight: 600, fontSize: 14, lineHeight: '20px', color: '#FFFFFF' }}
              >
                1
              </div>
              <h2 style={{ fontFamily: 'Georgia', fontWeight: 700, fontSize: 36, lineHeight: '40px', color: '#101828' }}>
                Choose a <span style={{ fontStyle: 'italic', color: '#E8B84B' }}>Subject</span>
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 rounded-[10px] px-5 py-2.5"
              style={{
                background: 'linear-gradient(90deg, #F0AE00 0%, #FE6D00 100%)',
                boxShadow: '0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1)',
                fontFamily: 'Inter',
                fontWeight: 700,
                fontSize: 14,
                lineHeight: '20px',
                color: '#FFFFFF',
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

          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {[...Array(10)].map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse rounded-[16px] border"
                  style={{ border: '0.8px solid #E5E7EB', background: '#F9FAFB', minHeight: 176 }}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {subjectCards.map((item) => {
                const hasDeck = Boolean(item.deck);
                const due = item.totalCards - item.masteredCards;
                const progressWidth = hasDeck ? Math.max(item.mastery, 10) : 0;
                const title = item.shortLabel ?? displaySubjectName(item.subject);

                const cardContent = (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <span aria-hidden style={{ fontSize: 24, lineHeight: '24px' }}>{item.icon}</span>
                      {item.isNew ? (
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5"
                          style={{
                            background: '#FDB022',
                            fontFamily: 'Inter',
                            fontWeight: 700,
                            fontSize: 9,
                            lineHeight: '12px',
                            letterSpacing: '0.04em',
                            color: '#FFFFFF',
                          }}
                        >
                          NEW
                        </span>
                      ) : null}
                    </div>

                    <h3
                      className="mt-4"
                      style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 18, lineHeight: '22px', color: '#22304D' }}
                    >
                      {title}
                    </h3>

                    <p
                      className="mt-1"
                      style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, lineHeight: '16px', color: '#8A94A6' }}
                    >
                      {hasDeck ? `${item.totalCards} cards - ${item.topics} topics` : '0 cards - Start here'}
                    </p>

                    <p
                      className="mt-1"
                      style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 11, lineHeight: '14px', color: '#A0A7B5' }}
                    >
                      {item.viewsLabel}
                    </p>

                    <div className="mt-5 h-[4px] w-full rounded-full" style={{ background: '#D8E8F6' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${progressWidth}%`, background: item.card.bar }}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span
                        style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 11, lineHeight: '14px', color: '#7B8794' }}
                      >
                        {hasDeck ? `${item.mastery}% mastered` : 'Create first card'}
                      </span>
                      <span
                        style={{
                          fontFamily: 'Inter',
                          fontWeight: 600,
                          fontSize: 11,
                          lineHeight: '14px',
                          color: hasDeck && due === 0 ? '#00A63E' : '#F08C00',
                        }}
                      >
                        {hasDeck ? (due === 0 ? 'All done' : `${due} due`) : 'New deck'}
                      </span>
                    </div>
                  </>
                );

                if (hasDeck) {
                  return (
                    <Link
                      key={item.id}
                      href={`/dashboard/flashcards/${item.id}`}
                      className="block rounded-[16px] border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
                      style={{ border: `1px solid ${item.card.border}`, background: item.card.bg, minHeight: 176 }}
                    >
                      {cardContent}
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setPrefillSubject(item.subject);
                      setShowAddModal(true);
                    }}
                    className="rounded-[16px] border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
                    style={{ border: `1px solid ${item.card.border}`, background: item.card.bg, minHeight: 176 }}
                  >
                    {cardContent}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <CreateFlashcardModal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setPrefillSubject('');
        }}
        initialSubject={prefillSubject}
        initialDeck={prefillSubject}
      />
    </div>
  );
}
