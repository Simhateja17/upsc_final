'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { flashcardService, spacedRepService, userService } from '@/lib/services';
import {
  FREE_QUESTION_LIMIT,
  difficultyOptions,
  normalizeScheduleDays,
  reviewInfo,
  scheduleOptions,
  sourceColor,
  subjectBg,
  subjectHealthById,
  subjectLabelToId,
  subjectOptions,
  type SpacedRepItem,
} from '../shared';

const FILTERS = ['All', 'mcq', 'mains', 'pyq', 'custom', 'Overdue', 'Due Today'] as const;
type FilterKey = (typeof FILTERS)[number];

function filterLabel(f: FilterKey): string {
  if (f === 'All') return 'All';
  if (f === 'Overdue') return 'Overdue';
  if (f === 'Due Today') return 'Due Today';
  return f.toUpperCase();
}

export default function SpacedRepetitionSubjectPage() {
  const params = useParams<{ subjectId: string }>();
  const subjectId = typeof params?.subjectId === 'string' ? params.subjectId : '';
  const health = subjectHealthById(subjectId);
  const option = subjectOptions.find((o) => o.id === subjectId);
  const subjectLabel = health?.label ?? option?.label ?? subjectId;
  const subjectIcon = health?.icon ?? option?.icon ?? '📚';
  const accentBar = health?.bar ?? '#7C3AED';

  const [items, setItems] = useState<SpacedRepItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('All');
  const [flashcardToast, setFlashcardToast] = useState<{ subjectId: string; subject: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [arrowImgFailed, setArrowImgFailed] = useState(false);

  // Modal state
  const [modalDeck, setModalDeck] = useState(subjectId || 'polity');
  const [modalDifficulty, setModalDifficulty] = useState('Hard');
  const [modalQuestion, setModalQuestion] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    spacedRepService.getItems()
      .then((res) => {
        if (res.status === 'success') setItems(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addToFlashcards = async (q: SpacedRepItem) => {
    if (q.addedToFlashcard) return;
    setItems((prev) => prev.map((i) => (i.id === q.id ? { ...i, addedToFlashcard: true } : i)));
    try {
      const deckId = subjectLabelToId(q.subject);
      await flashcardService.createCard({
        subjectId: deckId,
        subject: q.subject,
        topicId: 'spaced-rep',
        topic: 'From Spaced Repetition',
        question: q.questionText,
        answer: 'Review this question.',
      });
      spacedRepService.updateItem(q.id, { addedToFlashcard: true }).catch(() => {});
      setFlashcardToast({ subjectId: deckId, subject: q.subject });
      setTimeout(() => setFlashcardToast(null), 5000);
    } catch (err) {
      console.error('[addToFlashcards] createCard failed:', err);
      setItems((prev) => prev.map((i) => (i.id === q.id ? { ...i, addedToFlashcard: false } : i)));
    }
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    spacedRepService.deleteItem(id).catch(() => {
      // rollback on failure
      spacedRepService.getItems().then((res) => {
        if (res.status === 'success') setItems(res.data);
      });
    });
  };

  const toggleRemind = (id: string, current: boolean) => {
    spacedRepService.updateItem(id, { remindEnabled: !current })
      .then(async (res: { status: string }) => {
        if (res.status !== 'success') return;
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, remindEnabled: !current } : i)));

        const item = items.find((i) => i.id === id);
        if (!current && item) {
          try {
            await userService.createNotification({
              title: 'Spaced Repetition Reminder Set',
              body: `We'll remind you to revise "${item.questionText.slice(0, 60)}${item.questionText.length > 60 ? '...' : ''}" in ${item.scheduleDay} day${item.scheduleDay === 1 ? '' : 's'}.`,
              type: 'spaced_rep',
            });
          } catch {
            // ignore
          }

          if (typeof window !== 'undefined' && 'Notification' in window) {
            try {
              if (Notification.permission === 'default') await Notification.requestPermission();
              if (Notification.permission === 'granted') {
                new Notification('Reminder set', {
                  body: `We'll remind you to revise this in ${item.scheduleDay} day${item.scheduleDay === 1 ? '' : 's'}.`,
                  icon: '/favicon.ico',
                });
              }
            } catch {
              // ignore – backend will still deliver the reminder
            }
          }
        }
      })
      .catch(() => {});
  };

  const toggleSchedule = (id: string, day: number) => {
    const targetItem = items.find((item) => item.id === id);
    if (!targetItem) return;

    const currentDays = normalizeScheduleDays(targetItem);
    const nextDays = currentDays.includes(day)
      ? currentDays.filter((value) => value !== day)
      : [...currentDays, day].sort((a, b) => a - b);

    setItems((prev) => prev.map((item) => (
      item.id === id ? { ...item, scheduleDay: nextDays[0] ?? item.scheduleDay, scheduleDays: nextDays } : item
    )));

    spacedRepService.updateItem(id, { scheduleDays: nextDays })
      .then((res: { status: string; data?: SpacedRepItem }) => {
        if (res.status === 'success' && res.data) {
          setItems((prev) => prev.map((item) => (
            item.id === id
              ? {
                  ...item,
                  scheduleDay: res.data?.scheduleDay ?? nextDays[0] ?? item.scheduleDay,
                  scheduleDays: res.data?.scheduleDays ?? nextDays,
                }
              : item
          )));
        }
      })
      .catch(() => {
        setItems((prev) => prev.map((item) => (
          item.id === id ? { ...item, scheduleDay: currentDays[0] ?? item.scheduleDay, scheduleDays: currentDays } : item
        )));
      });
  };

  const handleAddItem = () => {
    if (!modalQuestion.trim()) return;
    setSaving(true);
    const subjectName = subjectOptions.find((d) => d.id === modalDeck)?.label ?? modalDeck;
    spacedRepService.addItem({
      questionText: modalQuestion,
      subject: subjectName,
      source: 'Custom',
      sourceType: 'custom',
      scheduleDays: [3],
    })
      .then((res) => {
        if (res.status === 'success') {
          setItems((prev) => [res.data, ...prev]);
          setModalQuestion('');
          setShowAddModal(false);
        }
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  // All items for this subject (regardless of source filter) — drives counts + the Pro meter.
  const subjectItems = items.filter((item) => item.subject === subjectLabel);

  const counts: Record<FilterKey, number> = {
    All: subjectItems.length,
    mcq: subjectItems.filter((i) => i.sourceType === 'mcq').length,
    mains: subjectItems.filter((i) => i.sourceType === 'mains').length,
    pyq: subjectItems.filter((i) => i.sourceType === 'pyq').length,
    custom: subjectItems.filter((i) => i.sourceType === 'custom').length,
    Overdue: subjectItems.filter((i) => reviewInfo(i.nextReviewAt).tone === 'overdue').length,
    'Due Today': subjectItems.filter((i) => reviewInfo(i.nextReviewAt).tone === 'today').length,
  };

  const visibleItems = subjectItems.filter((i) => {
    if (filter === 'All') return true;
    if (filter === 'Overdue') return reviewInfo(i.nextReviewAt).tone === 'overdue';
    if (filter === 'Due Today') return reviewInfo(i.nextReviewAt).tone === 'today';
    return i.sourceType === filter;
  });

  const usedSlots = items.length;
  const freeRemaining = Math.max(0, FREE_QUESTION_LIMIT - usedSlots);

  return (
    <div className="flex overflow-hidden font-arimo" style={{ background: '#F9FAFB', height: '100%' }}>
      {/* Flashcard success toast */}
      {flashcardToast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#101828', color: '#fff', borderRadius: 14, padding: '14px 18px', boxShadow: '0 8px 32px rgba(0,0,0,0.22)', display: 'flex', alignItems: 'center', gap: 12, maxWidth: 340 }}>
          <span style={{ fontSize: 20 }}>✅</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>Added to Flashcards!</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
              Card saved to your <strong style={{ color: '#E8B84B' }}>{flashcardToast.subject}</strong> deck.{' '}
              <a href={`/dashboard/flashcards/${flashcardToast.subjectId}`} style={{ color: '#E8B84B', textDecoration: 'underline', fontWeight: 600 }}>View deck →</a>
            </div>
          </div>
          <button onClick={() => setFlashcardToast(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 16, marginLeft: 4 }}>✕</button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Back to Subjects */}
          <Link
            href="/dashboard/spaced-repetition"
            className="inline-flex items-center gap-2 mb-4"
            style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 14, lineHeight: '20px', color: '#4A5565' }}
          >
            {!arrowImgFailed && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/ArrowLeft.png" alt="" className="w-5 h-5 object-contain flex-shrink-0 mr-1" onError={() => setArrowImgFailed(true)} />
            )}
            {arrowImgFailed && <span aria-hidden className="mr-1">←</span>}
            Back to Subjects
          </Link>

          {/* Subject summary card */}
          <div
            className="w-full rounded-[10px] px-6 py-5 flex items-center gap-4 mb-6"
            style={{ border: '0.8px solid #E5E7EB', background: '#FFFFFF', borderLeft: `4px solid ${accentBar}`, minHeight: 101 }}
          >
            <span className="text-4xl flex-shrink-0" aria-hidden>{subjectIcon}</span>
            <div>
              <h1 style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 24, lineHeight: '32px', color: '#101828' }}>{subjectLabel}</h1>
              <p style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 14, lineHeight: '20px', color: '#6A7282' }}>
                {counts.All} question{counts.All === 1 ? '' : 's'} to revisit · {counts.Overdue} overdue · {counts['Due Today']} due today
              </p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: '#00C950', fontFamily: 'Inter', fontWeight: 400, fontSize: 18, lineHeight: '28px', color: '#FFFFFF' }}
              >
                ✓
              </div>
              <span style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 14, lineHeight: '20px', color: '#6A7282' }}>Subject selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: '#101828', fontFamily: 'Inter', fontWeight: 600, fontSize: 14, lineHeight: '20px', color: '#FFFFFF' }}
              >
                2
              </div>
              <span style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 20, lineHeight: '28px', color: '#101828' }}>Questions to Revisit</span>
            </div>
          </div>
          <p className="mb-6" style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 14, lineHeight: '20px', color: '#6A7282' }}>
            Revise these questions to close the gaps in {subjectLabel}
          </p>

          {/* Questions header */}
          <div
            className="flex flex-wrap items-center justify-between gap-4 py-4 px-6 rounded-t-[10px]"
            style={{ borderBottom: '0.8px solid #F3F4F6', background: '#FFFFFF' }}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span aria-hidden>⚠️</span>
              <span style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 16, lineHeight: '24px', color: '#101828' }}>Questions to Revisit</span>
              <span className="rounded px-2.5 py-1" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 12, lineHeight: '16px', background: '#FEF2F2', color: '#E7000B' }}>
                {counts.All} total
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {FILTERS.map((f) => {
                  const active = filter === f;
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFilter(f)}
                      className="rounded-[10px] px-3 py-2"
                      style={{
                        fontFamily: 'Inter', fontWeight: 500, fontSize: 14, lineHeight: '20px',
                        background: active ? '#101828' : '#F3F4F6',
                        color: active ? '#FFFFFF' : '#4A5565',
                      }}
                    >
                      {filterLabel(f)} ({counts[f]})
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 rounded-[10px] px-4 py-2"
              style={{
                background: 'linear-gradient(90deg, #F0AE00 0%, #FE6D00 100%)',
                boxShadow: '0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1)',
                fontFamily: 'Inter', fontWeight: 700, fontSize: 14, lineHeight: '20px', color: '#FFFFFF',
              }}
            >
              <span>+</span> Add Question
            </button>
          </div>

          {/* Table header */}
          <div
            className="hidden md:grid px-6 py-3"
            style={{ background: '#F9FAFB', fontFamily: 'Inter', fontWeight: 600, fontSize: 12, lineHeight: '16px', letterSpacing: '0.6px', color: '#6A7282', textTransform: 'uppercase', gridTemplateColumns: '1fr 140px 120px 150px 80px 40px', gap: 16 }}
          >
            <span>Question</span>
            <span>Subject</span>
            <span>Next Review</span>
            <span>Schedule</span>
            <span>Remind</span>
            <span></span>
          </div>

          {/* Question rows */}
          <div style={{ background: '#FFFFFF', borderLeft: '1px solid #F3F4F6', borderRight: '1px solid #F3F4F6' }}>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="px-6 py-4 border-b border-[#F3F4F6] animate-pulse" style={{ minHeight: 83 }}>
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              ))
            ) : visibleItems.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-400">
                No questions {filter === 'All' ? '' : 'match this filter'} for {subjectLabel} yet. Add your first question above.
              </div>
            ) : (
              visibleItems.map((q) => {
                const rev = reviewInfo(q.nextReviewAt);
                const activeDays = normalizeScheduleDays(q);
                return (
                  <div
                    key={q.id}
                    className="group grid grid-cols-1 md:grid-cols-[1fr_140px_120px_150px_80px_40px] gap-4 items-start px-6 py-4 border-b border-[#F3F4F6]"
                    style={{ minHeight: 83, borderLeft: `4px solid ${rev.accent}` }}
                  >
                    <div>
                      <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 14, lineHeight: '22.75px', color: '#101828', marginBottom: 6 }}>{q.questionText}</p>
                      <div className="flex flex-wrap items-center gap-2 text-[12px]">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1"
                          style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 11, lineHeight: '14px', background: rev.chipBg, color: rev.chipColor }}
                        >
                          <span aria-hidden>{rev.icon}</span> {rev.chipText}
                        </span>
                        <span style={{ fontFamily: 'Inter', fontWeight: 600, color: sourceColor(q.sourceType) }}>{q.source}</span>
                        {q.addedToFlashcard ? (
                          <span style={{ fontFamily: 'Inter', fontWeight: 600, color: '#009966' }}>✓ Added to Flashcards</span>
                        ) : (
                          <button
                            type="button"
                            className="font-semibold"
                            style={{ fontFamily: 'Inter', color: '#155DFC' }}
                            onClick={() => addToFlashcards(q)}
                          >
                            + Add to Flashcards
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <span
                        className="inline-block rounded-full px-3 py-1"
                        style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 12, lineHeight: '16px', background: subjectBg(q.subject), color: '#0A0A0A' }}
                      >
                        {q.subject}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 13, lineHeight: '18px', color: rev.nextColor, textTransform: rev.tone === 'overdue' ? 'uppercase' : 'none' }}>
                        {rev.nextLabel}
                      </span>
                    </div>
                    <div className="flex gap-1.5 flex-wrap items-center">
                      {scheduleOptions.map((day) => {
                        const isActive = activeDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleSchedule(q.id, day)}
                            className="rounded px-2 py-1 text-[12px] font-bold transition-colors"
                            style={{
                              fontFamily: 'Inter', lineHeight: '16px',
                              background: isActive ? '#101828' : '#E5E7EB',
                              color: isActive ? '#FFFFFF' : '#4A5565',
                            }}
                          >
                            {day}d
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={q.remindEnabled}
                        onClick={() => toggleRemind(q.id, q.remindEnabled)}
                        className="relative w-11 h-6 rounded-full transition-colors flex items-center"
                        style={{ background: q.remindEnabled ? '#00BC7D' : '#D1D5DC', paddingLeft: 4, paddingRight: 4 }}
                      >
                        <span
                          className="block w-4 h-4 rounded-full bg-white shadow transition-transform"
                          style={{ transform: q.remindEnabled ? 'translateX(20px)' : 'translateX(0)' }}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(q.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg p-1.5 hover:bg-red-50"
                        title="Delete"
                        style={{ color: '#EF4444' }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add Custom Question/Topic */}
          <div
            className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-b-[10px] border-x border-b border-[#F3F4F6]"
            style={{ background: '#FFFFFF', minHeight: 96 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-[12px] flex items-center justify-center text-xl" style={{ background: '#EEF2FF', color: '#6366F1' }}>+</div>
              <div>
                <p className="font-bold" style={{ fontFamily: 'Inter', fontSize: 16, lineHeight: '24px', color: '#101828' }}>Add Custom Question / Topic</p>
                <p style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 13, lineHeight: '18px', color: '#6A7282' }}>
                  Create your own question for review · {freeRemaining} free slot{freeRemaining === 1 ? '' : 's'} remaining
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 rounded-[10px] px-5 py-2.5"
              style={{ background: '#EEF2FF', fontFamily: 'Inter', fontWeight: 600, fontSize: 14, lineHeight: '20px', color: '#4338CA' }}
            >
              + Add
            </button>
          </div>

          {/* Pro upsell banner */}
          <div
            className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-[12px] mt-6"
            style={{ background: 'linear-gradient(90deg, #101828 0%, #1E293B 100%)' }}
          >
            <div className="flex items-center gap-3">
              <span aria-hidden style={{ fontSize: 20 }}>⚡</span>
              <div>
                <p className="font-bold" style={{ fontFamily: 'Inter', fontSize: 16, lineHeight: '24px', color: '#FFFFFF' }}>Unlock unlimited questions with Pro</p>
                <p style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 13, lineHeight: '18px', color: 'rgba(255,255,255,0.65)' }}>
                  {usedSlots} of {FREE_QUESTION_LIMIT} free slots used · Upgrade for AI scheduling + unlimited reviews
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/billing/plans"
              className="flex items-center gap-2 rounded-[10px] px-5 py-2.5"
              style={{
                background: 'linear-gradient(90deg, #F0AE00 0%, #FE6D00 100%)',
                fontFamily: 'Inter', fontWeight: 700, fontSize: 14, lineHeight: '20px', color: '#FFFFFF',
              }}
            >
              Upgrade →
            </Link>
          </div>
        </div>
      </div>

      {/* Add Question modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="rounded-[16px] bg-white flex flex-col w-full max-w-[512px] overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '0.8px solid #E5E7EB', minHeight: 60.8 }}>
              <div className="flex items-center gap-2">
                <span aria-hidden style={{ fontSize: 22 }}>📇</span>
                <span style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 16, lineHeight: '24px', color: '#101828' }}>Add Question to Review</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-[10px] flex items-center justify-center text-[18px] font-bold"
                style={{ background: '#F3F4F6', color: '#364153' }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-5" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              <div className="space-y-2">
                <label className="block uppercase tracking-[0.5px]" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 10, lineHeight: '15px', color: '#99A1AF' }}>
                  QUESTION
                </label>
                <textarea
                  placeholder="e.g. What is the Coriolis Effect?"
                  value={modalQuestion}
                  onChange={(e) => setModalQuestion(e.target.value)}
                  rows={3}
                  className="w-full rounded-[10px] px-4 py-2.5 border outline-none focus:ring-2 focus:ring-[#155DFC] focus:border-transparent resize-y"
                  style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 14, lineHeight: '20px', background: '#F9FAFB', border: '0.8px solid #E5E7EB', color: '#101828' }}
                />
              </div>

              <div className="space-y-2">
                <label className="block uppercase tracking-[0.5px]" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 10, lineHeight: '15px', color: '#99A1AF' }}>
                  SELECT SUBJECT
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {subjectOptions.map((deck) => (
                    <button
                      key={deck.id}
                      type="button"
                      onClick={() => setModalDeck(deck.id)}
                      className="flex items-center gap-2 rounded-[10px] px-3 py-2.5 text-left border transition-colors"
                      style={{
                        border: '0.8px solid ' + (modalDeck === deck.id ? '#FDC700' : '#E5E7EB'),
                        background: modalDeck === deck.id ? '#FEFCE8' : '#FFFFFF',
                        fontFamily: 'Inter', fontWeight: 500, fontSize: 14, lineHeight: '20px',
                        color: modalDeck === deck.id ? '#101828' : '#364153',
                      }}
                    >
                      <span aria-hidden>{deck.icon}</span>
                      <span className="flex-1">{deck.label}</span>
                      {modalDeck === deck.id && <span className="w-2 h-2 rounded-full bg-orange-500" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block uppercase tracking-[0.5px]" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 10, lineHeight: '15px', color: '#99A1AF' }}>
                  DIFFICULTY
                </label>
                <div className="flex flex-wrap gap-2">
                  {difficultyOptions.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setModalDifficulty(d)}
                      className="rounded-[10px] px-4 py-2 border"
                      style={{
                        fontFamily: 'Inter', fontWeight: 500, fontSize: 14, lineHeight: '20px',
                        border: '0.8px solid ' + (modalDifficulty === d ? '#101828' : '#E5E7EB'),
                        background: modalDifficulty === d ? '#101828' : '#FFFFFF',
                        color: modalDifficulty === d ? '#FFFFFF' : '#364153',
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 14, color: '#6A7282' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddItem}
                disabled={saving || !modalQuestion.trim()}
                className="flex items-center gap-2 rounded-[10px] px-5 py-2.5 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(90deg, #F0AE00 0%, #FE6D00 100%)',
                  boxShadow: '0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1)',
                  fontFamily: 'Inter', fontWeight: 700, fontSize: 14, lineHeight: '20px', color: '#FFFFFF',
                }}
              >
                <span aria-hidden>✓</span> {saving ? 'Saving...' : 'Add Question'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
