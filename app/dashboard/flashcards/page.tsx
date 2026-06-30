'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import CreateFlashcardModal from '@/components/CreateFlashcardModal';
import AddSubjectModal, { NewSubject } from '@/components/AddSubjectModal';
import { flashcardService } from '@/lib/services';
import DashboardPageHero from '@/components/DashboardPageHero';
import FlashcardScienceSections from '@/components/FlashcardScienceSections';
import { UpgradePrompt } from '@/components/entitlements';
import { useEntitlements } from '@/contexts/EntitlementsContext';

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
  { id: 'polity', subject: 'Polity', icon: '⚖️', viewsLabel: '3.2L views', card: { bg: '#FDF0DE', border: '#C0D9F5', bar: '#E9A12D' } },
  { id: 'history', subject: 'History', icon: '📜', viewsLabel: '2.8L views', card: { bg: '#FFF8EE', border: '#FFD5A8', bar: '#E8B164' } },
  { id: 'geography', subject: 'Geography', icon: '🌍', viewsLabel: '2.1L views', card: { bg: 'rgba(201, 168, 76, 0.19)', border: '#B2EDD0', bar: '#D5A53C' } },
  { id: 'economy', subject: 'Economy', icon: '📈', viewsLabel: '1.9L views', card: { bg: 'linear-gradient(139deg, #F3EFFD 0%, #EDE7FB 100%)', border: '#E8E1FD', bar: '#F16CB0' } },
  { id: 'environment-ecology', subject: 'Environment & Ecology', shortLabel: 'Environment', icon: '🌿', viewsLabel: '2.4L views', card: { bg: 'linear-gradient(139deg, #EDF9F3 0%, #E0F5EA 100%)', border: '#B2EDD0', bar: '#D6A437' } },
  { id: 'science-technology', subject: 'Science & Technology', shortLabel: 'Science & Tech', icon: '🔬', viewsLabel: '2.1L views', card: { bg: 'linear-gradient(139deg, #E0EBF9 0%, #D4E4F7 100%)', border: '#C0D9F5', bar: '#E0A446' } },
  { id: 'current-affairs', subject: 'Current Affairs', icon: '📰', viewsLabel: '2.6L views', card: { bg: 'linear-gradient(139deg, #FFF1E8 0%, #FFE6D5 100%)', border: '#FFD1AA', bar: '#F39A3C' } },
];

function displaySubjectName(subject: string) {
  if (subject === 'Modern History') return 'History';
  return subject;
}

export default function FlashcardsPage() {
  const entitlements = useEntitlements();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [customSubjects, setCustomSubjects] = useState<SubjectCatalogItem[]>([]);
  const [prefillSubject, setPrefillSubject] = useState('');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [hoveredBin, setHoveredBin] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; subject: string; totalCards: number } | null>(null);
  const [deleting, setDeleting] = useState(false);

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
  ];

  const deckMap = new Map(decks.map((deck) => [deck.id, deck]));
  const catalogIds = new Set(SUBJECT_CATALOG.map((item) => item.id));
  const withDeck = (item: SubjectCatalogItem) => {
    const deck = deckMap.get(item.id);
    return {
      ...item,
      deck,
      totalCards: deck?.totalCards ?? 0,
      topics: deck?.topics ?? 0,
      mastery: deck?.mastery ?? 0,
      masteredCards: deck?.masteredCards ?? 0,
    };
  };

  const subjectCards = SUBJECT_CATALOG.map(withDeck);

  // Custom subjects: persisted decks that aren't part of the curated catalog,
  // plus subjects added this session that don't have a deck yet.
  const customCatalogItems = new Map<string, SubjectCatalogItem>();
  customSubjects.forEach((item) => customCatalogItems.set(item.id, item));
  decks
    .filter((deck) => !catalogIds.has(deck.id))
    .forEach((deck) => {
      const existing = customCatalogItems.get(deck.id);
      customCatalogItems.set(deck.id, {
        id: deck.id,
        subject: deck.subject,
        icon: existing?.icon ?? deck.icon ?? '📚',
        viewsLabel: '',
        card: existing?.card ?? { bg: '#F8FAFC', border: '#E5E7EB', bar: '#16A34A' },
      });
    });
  const customSubjectCards = Array.from(customCatalogItems.values()).map(withDeck);

  const hasFullAccess = entitlements.canAccess('flashcards', ['full']);
  const previewCount = entitlements.preview.flashcard_subjects ?? subjectCards.length;
  const visibleSubjectCards = hasFullAccess
    ? [...subjectCards, ...customSubjectCards]
    : subjectCards.slice(0, previewCount || 0);

  function slugifySubject(name: string) {
    return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  function handleCreateSubject({ name, icon, tint }: NewSubject) {
    const id = slugifySubject(name);
    if (!id) return;
    setCustomSubjects((prev) => {
      if (prev.some((s) => s.id === id) || catalogIds.has(id)) return prev;
      return [
        ...prev,
        { id, subject: name, icon, viewsLabel: '', isNew: true, card: { bg: tint, border: 'rgba(0,0,0,0.08)', bar: '#16A34A' } },
      ];
    });
    setShowAddSubjectModal(false);
  }

  async function handleDeleteSubject() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await flashcardService.deleteSubject(deleteTarget.id);
      setDecks((prev) => prev.filter((d) => d.id !== deleteTarget.id));
    } catch {}
    setDeleting(false);
    setDeleteTarget(null);
  }

  return (
    <div className="flex overflow-hidden font-arimo" style={{ background: '#F9FAFB', height: '100%' }}>
      <div className="flex-1 overflow-y-auto">
        <DashboardPageHero
          badgeIcon={<img src="/flashcard-icon.png" alt="" aria-hidden className="w-5 h-5 object-contain flex-shrink-0" />}
          badgeText="Revision - Smart Learning System"
          title={<>Your <span style={{ color: '#E8B84B', fontStyle: 'italic' }}>Flashcard</span> <span style={{ fontStyle: 'italic', color: '#FFFFFF' }}>Vault.</span></>}
          subtitle="Powered by spaced repetition science. Study smarter each card surfaces exactly when your brain is about to forget it."
          stats={bannerMetrics.map((metric) => ({ value: metric.value, label: metric.label, color: metric.valueColor }))}
        />

        <div className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {!hasFullAccess && (
            <div className="mb-6">
              <UpgradePrompt
                title="Flashcards preview"
                currentTier={entitlements.tier}
                requiredTier="rise"
                message={`Your plan includes ${previewCount || 0} preview subjects. Upgrade to Rise to create flashcards and unlock the full subject vault.`}
              />
            </div>
          )}

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

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => hasFullAccess ? setShowAddModal(true) : undefined}
                disabled={!hasFullAccess}
                className="flex items-center gap-2 rounded-[10px] px-5 py-2.5"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1)',
                  opacity: hasFullAccess ? 1 : 0.55,
                  fontFamily: 'Inter',
                  fontWeight: 600,
                  fontSize: 14,
                  lineHeight: '20px',
                  letterSpacing: 0,
                  color: '#17223E',
                }}
              >
                <span className="text-lg leading-none">+</span> New Flashcard
              </button>

              <button
                type="button"
                onClick={() => hasFullAccess ? setShowAddSubjectModal(true) : undefined}
                disabled={!hasFullAccess}
                className="flex items-center gap-2 rounded-[10px] px-5 py-2.5"
                style={{
                  background: 'linear-gradient(90deg, #F0AE00 0%, #FE6D00 100%)',
                  border: 'none',
                  boxShadow: '0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1)',
                  opacity: hasFullAccess ? 1 : 0.55,
                  fontFamily: 'Inter',
                  fontWeight: 700,
                  fontSize: 14,
                  lineHeight: '20px',
                  letterSpacing: 0,
                  color: '#17223E',
                }}
              >
                <span className="text-lg leading-none">+</span> Add Subject
              </button>
            </div>
          </div>

          <p
            className="mb-6"
            style={{ fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: 15, lineHeight: '22px', color: '#6A7282' }}
          >
            Pick the subject you want to revise today
          </p>

          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {[...Array(10)].map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse rounded-[16px] border"
                  style={{ border: '0.8px solid #E5E7EB', background: '#F9FAFB', height: 190 }}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {visibleSubjectCards.map((item) => {
                const hasDeck = Boolean(item.deck);
                const due = item.totalCards - item.masteredCards;
                const progressWidth = hasDeck ? Math.max(item.mastery, 10) : 0;
                const title = item.shortLabel ?? displaySubjectName(item.subject);

                const cardContent = (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <span
                        aria-hidden
                        className="flex items-center justify-center flex-shrink-0"
                        style={{ width: 44, height: 44, borderRadius: 12, background: `${item.card.bar}1A`, fontSize: 24, lineHeight: 1 }}
                      >
                        {item.icon}
                      </span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {item.isNew && (
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5"
                            style={{ background: '#FDB022', fontFamily: 'Inter', fontWeight: 700, fontSize: 9, lineHeight: '12px', color: '#FFFFFF' }}
                          >
                            NEW
                          </span>
                        )}
                        {hasDeck && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDeleteTarget({ id: item.id, subject: item.subject, totalCards: item.totalCards });
                            }}
                            onMouseEnter={() => setHoveredBin(item.id)}
                            onMouseLeave={() => setHoveredBin(null)}
                            style={{
                              opacity: hoveredCard === item.id ? 1 : 0,
                              transition: 'opacity 0.15s, color 0.15s',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 4,
                              lineHeight: 1,
                              color: hoveredBin === item.id ? '#EF4444' : '#9CA3AF',
                            }}
                            aria-label={`Delete ${item.subject}`}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    <h3
                      className="mt-3"
                      style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 17, lineHeight: '22px', color: '#22304D' }}
                    >
                      {title}
                    </h3>

                    <p
                      className="mt-1"
                      style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 11, lineHeight: '15px', color: '#8A94A6' }}
                    >
                      {hasDeck ? `${item.totalCards} cards · ${item.topics} topics · ${item.viewsLabel}` : '0 cards · Start here'}
                    </p>

                    <div className="mt-4 h-[4px] w-full rounded-full" style={{ background: 'rgba(0,0,0,0.08)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${progressWidth}%`, background: '#16A34A' }}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 12, lineHeight: '16px', color: '#16A34A' }}>
                        {hasDeck ? `✓ ${item.masteredCards} mastered` : 'Create first card'}
                      </span>
                      <span style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 12, lineHeight: '16px', color: hasDeck && due === 0 ? '#16A34A' : '#EF4444' }}>
                        {hasDeck ? (due === 0 ? '✓ All done' : `${due} to go`) : 'New deck'}
                      </span>
                    </div>
                  </>
                );

                if (hasDeck) {
                  return (
                    <Link
                      key={item.id}
                      href={`/dashboard/flashcards/${item.id}`}
                      className="block rounded-[16px] border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md flex flex-col"
                      style={{ border: `1px solid ${item.card.border}`, background: item.card.bg, height: 190 }}
                      onMouseEnter={() => setHoveredCard(item.id)}
                      onMouseLeave={() => setHoveredCard(null)}
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
                      if (!hasFullAccess) return;
                      setPrefillSubject(item.subject);
                      setShowAddModal(true);
                    }}
                    className="rounded-[16px] border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md flex flex-col"
                    style={{ border: `1px solid ${item.card.border}`, background: item.card.bg, height: 190 }}
                    onMouseEnter={() => setHoveredCard(item.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    {cardContent}
                  </button>
                );
              })}

              {hasFullAccess && (
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(true)}
                  className="rounded-[16px] border-2 border-dashed p-5 flex flex-col items-center justify-center text-center transition-all hover:bg-white hover:-translate-y-0.5 hover:shadow-md"
                  style={{ borderColor: '#E9EAEE', background: 'transparent', height: 190 }}
                  aria-label="Add new subject"
                >
                  <span
                    className="grid place-items-center rounded-2xl border-2 border-dashed"
                    style={{ width: 48, height: 48, borderColor: '#D8E0EA', fontSize: 24, lineHeight: 1, color: '#6A7282' }}
                  >
                    +
                  </span>
                  <span
                    className="mt-3"
                    style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 14, lineHeight: '20px', color: '#6A7282' }}
                  >
                    Add New Subject
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        <FlashcardScienceSections />
      </div>

      <AddSubjectModal
        open={showAddSubjectModal}
        onClose={() => setShowAddSubjectModal(false)}
        onCreate={handleCreateSubject}
      />

      <CreateFlashcardModal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setPrefillSubject('');
        }}
        initialSubject={prefillSubject}
        initialDeck={prefillSubject}
      />

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-xl"
            style={{ minWidth: 320, maxWidth: 420 }}
            onClick={(e) => e.stopPropagation()}
          >
            <span style={{ fontSize: 40 }}>🗑️</span>
            <h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 20, color: '#22304D', textAlign: 'center' }}>
              Are you sure?
            </h2>
            <p style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 14, color: '#6B7280', textAlign: 'center' }}>
              Delete subject &ldquo;{deleteTarget.subject}&rdquo; and all its {deleteTarget.totalCards} flashcard(s)?
            </p>
            <div className="flex gap-3 w-full mt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-full border py-3 text-sm font-semibold"
                style={{ borderColor: '#E5E7EB', color: '#374151', fontFamily: 'Inter' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubject}
                disabled={deleting}
                className="flex-1 rounded-full py-3 text-sm font-semibold text-white"
                style={{ background: '#EF4444', fontFamily: 'Inter', opacity: deleting ? 0.6 : 1 }}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
