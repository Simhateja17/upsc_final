'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { flashcardService, spacedRepService, userService } from '@/lib/services';
import {
  FREE_QUESTION_LIMIT,
  MODAL_SUBJECTS,
  MODAL_TYPE_OPTIONS,
  MODAL_SCHEDULE_OPTIONS,
  normalizeScheduleDays,
  reviewInfo,
  scheduleOptions,
  scheduleToDays,
  sourceColor,
  sourceTypeToLabel,
  subjectBg,
  subjectHealthById,
  subjectLabelToId,
  subjectOptions,
  type ModalScheduleId,
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
  const [deleteTarget, setDeleteTarget] = useState<SpacedRepItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<SpacedRepItem | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  // Modal state
  const [modalDeck, setModalDeck] = useState(subjectId || 'polity');
  const [modalSourceType, setModalSourceType] = useState('custom');
  const [modalQuestion, setModalQuestion] = useState('');
  const [modalAnswer, setModalAnswer] = useState('');
  const [modalSchedule, setModalSchedule] = useState<ModalScheduleId>('3days');
  const [modalCustomDays, setModalCustomDays] = useState('');
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

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
    setAddError(null);
    const subjectName = subjectOptions.find((d) => d.id === modalDeck)?.label ?? modalDeck;
    spacedRepService.addItem({
      questionText: modalQuestion,
      answer: modalAnswer || undefined,
      subject: subjectName,
      source: sourceTypeToLabel(modalSourceType),
      sourceType: modalSourceType,
      scheduleDays: scheduleToDays(modalSchedule, modalCustomDays),
    })
      .then((res) => {
        if (res.status === 'success') {
          setItems((prev) => [res.data, ...prev]);
          setModalQuestion('');
          setModalAnswer('');
          setModalSourceType('custom');
          setModalSchedule('3days');
          setModalCustomDays('');
          setShowAddModal(false);
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to add question. Please try again.';
        setAddError(msg);
      })
      .finally(() => setSaving(false));
  };

  const handleDeleteItem = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await spacedRepService.deleteItem(deleteTarget.id);
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {}
    setDeleting(false);
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
            className="flex flex-wrap items-center justify-between gap-4 py-4 px-6 rounded-[16px] mb-3"
            style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}
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

          {/* Table column labels */}
          <div
            className="hidden md:grid px-6 pb-2"
            style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 11, lineHeight: '16px', letterSpacing: '0.6px', color: '#9CA3AF', textTransform: 'uppercase', gridTemplateColumns: '1fr 140px 120px 150px 80px 40px', gap: 16 }}
          >
            <span>Question</span>
            <span>Subject</span>
            <span>Next Review</span>
            <span>Schedule</span>
            <span>Remind</span>
            <span></span>
          </div>

          {/* Question cards */}
          <div className="flex flex-col gap-3">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="rounded-[16px] border border-[#E5E7EB] bg-white px-6 py-4 animate-pulse" style={{ minHeight: 83 }}>
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              ))
            ) : visibleItems.length === 0 ? (
              <div className="rounded-[16px] border border-[#E5E7EB] bg-white px-6 py-12 text-center text-gray-400">
                No questions {filter === 'All' ? '' : 'match this filter'} for {subjectLabel} yet. Add your first question above.
              </div>
            ) : (
              visibleItems.map((q) => {
                const rev = reviewInfo(q.nextReviewAt);
                const activeDays = normalizeScheduleDays(q);
                return (
                  <div
                    key={q.id}
                    className="grid grid-cols-1 md:grid-cols-[1fr_140px_120px_150px_80px_40px] gap-4 items-center bg-white px-6 py-4"
                    style={{
                      minHeight: 83,
                      borderRadius: 16,
                      border: '1px solid #E5E7EB',
                      borderLeft: `4px solid ${rev.accent}`,
                    }}
                    onMouseEnter={() => setHoveredRow(q.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <div>
                      <p
                        onClick={() => { setReviewTarget(q); setShowAnswer(false); }}
                        style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 14, lineHeight: '22.75px', color: '#101828', marginBottom: 6, cursor: 'pointer' }}
                        className="hover:text-[#E8B84B] transition-colors"
                      >{q.questionText}</p>
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
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(q)}
                        aria-label="Delete question"
                        style={{
                          opacity: hoveredRow === q.id ? 1 : 0,
                          transition: 'opacity 0.15s, color 0.15s',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 4,
                          color: '#9CA3AF',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#9CA3AF')}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add Custom Question/Topic */}
          <div
            className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-[16px] border border-[#E5E7EB] mt-3"
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
                  {usedSlots} of {FREE_QUESTION_LIMIT} free slots used
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

      {/* Question review modal */}
      {reviewTarget && (() => {
        const rev = reviewInfo(reviewTarget.nextReviewAt);
        const hasAnswer = !!reviewTarget.answer?.trim();
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(16,24,40,0.45)' }}
            onClick={() => { setReviewTarget(null); setShowAnswer(false); }}
          >
            <div
              className="bg-white w-full max-w-[600px] shadow-2xl flex flex-col"
              style={{ borderRadius: 24, overflow: 'hidden' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top accent bar */}
              <div style={{ height: 4, background: `linear-gradient(90deg, ${rev.accent}, ${rev.accent}88)` }} />

              <div className="px-8 pt-7 pb-8">
                {/* Chips */}
                <div className="flex flex-wrap items-center gap-2 mb-5">
                  <span
                    className="rounded-full px-3 py-1"
                    style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 12, background: rev.chipBg, color: rev.chipColor }}
                  >
                    {rev.icon} {rev.chipText}
                  </span>
                  <span
                    className="rounded-full px-3 py-1"
                    style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 12, background: subjectBg(reviewTarget.subject), color: '#101828' }}
                  >
                    {reviewTarget.subject}
                  </span>
                  <span
                    className="rounded-full px-3 py-1"
                    style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 12, background: '#F3F4F6', color: sourceColor(reviewTarget.sourceType) }}
                  >
                    {reviewTarget.source}
                  </span>
                </div>

                {/* Question */}
                <p style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 22, lineHeight: '32px', color: '#101828', marginBottom: 28 }}>
                  {reviewTarget.questionText}
                </p>

                {/* Show Answer / Answer box */}
                {!showAnswer ? (
                  <button
                    type="button"
                    onClick={() => setShowAnswer(true)}
                    className="w-full rounded-[14px] py-4 flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(90deg, #F0AE00 0%, #FE6D00 100%)',
                      fontFamily: 'Inter', fontWeight: 700, fontSize: 16, color: '#17223E',
                      boxShadow: '0 2px 8px rgba(240,174,0,0.25)',
                    }}
                  >
                    💡 Show Answer
                  </button>
                ) : (
                  <div
                    className="rounded-[14px] p-5"
                    style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}
                  >
                    <p style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 10, letterSpacing: '0.8px', color: '#D97706', textTransform: 'uppercase', marginBottom: 10 }}>
                      ANSWER &amp; KEY POINTS
                    </p>
                    {hasAnswer ? (
                      <p style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 14, lineHeight: '22px', color: '#374151', whiteSpace: 'pre-wrap' }}>
                        {reviewTarget.answer}
                      </p>
                    ) : (
                      <p style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 14, color: '#9CA3AF', fontStyle: 'italic' }}>
                        No answer saved. Edit this question to add key points.
                      </p>
                    )}
                  </div>
                )}

                {/* Close */}
                <button
                  type="button"
                  onClick={() => { setReviewTarget(null); setShowAnswer(false); }}
                  className="mt-5 w-full rounded-[12px] py-2.5 border"
                  style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 14, color: '#6A7282', borderColor: '#E5E7EB', background: '#FFFFFF' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete confirmation modal */}
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
              Delete this question?
            </h2>
            <p style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 14, color: '#6B7280', textAlign: 'center' }}>
              &ldquo;{deleteTarget.questionText.length > 100 ? deleteTarget.questionText.slice(0, 100) + '…' : deleteTarget.questionText}&rdquo;
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
                onClick={handleDeleteItem}
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

      {/* Add Question modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => { setShowAddModal(false); setAddError(null); }}
        >
          <div className="flex min-h-full items-start justify-center p-4 py-8">
          <div
            className="bg-white flex flex-col w-full max-w-[560px] shadow-2xl"
            style={{ borderRadius: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-7 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <span aria-hidden style={{ fontSize: 22 }}>📝</span>
                <span style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 20, color: '#101828' }}>
                  Add Question to Review
                </span>
              </div>
              <button
                type="button"
                onClick={() => { setShowAddModal(false); setAddError(null); }}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: '#F3F4F6', color: '#6A7282', fontSize: 18, fontWeight: 700, lineHeight: 1 }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="px-7 pb-5 space-y-4">

              {/* Question */}
              <div className="space-y-1.5">
                <label style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 10, letterSpacing: '0.7px', color: '#99A1AF', textTransform: 'uppercase', display: 'block' }}>
                  YOUR QUESTION / TOPIC
                </label>
                <textarea
                  placeholder="e.g. Why does the Coriolis force deflect objects to the right in the Northern Hemisphere?"
                  value={modalQuestion}
                  onChange={(e) => setModalQuestion(e.target.value)}
                  rows={2}
                  className="w-full rounded-[12px] px-4 py-2.5 outline-none resize-none"
                  style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 14, lineHeight: '21px', background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#101828' }}
                />
              </div>

              {/* Answer (optional) */}
              <div className="space-y-1.5">
                <label style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 10, letterSpacing: '0.7px', color: '#99A1AF', textTransform: 'uppercase', display: 'block' }}>
                  YOUR ANSWER / KEY POINTS <span style={{ color: '#C4C9D4', fontWeight: 500 }}>(OPTIONAL)</span>
                </label>
                <textarea
                  placeholder="Add what you want to remember..."
                  value={modalAnswer}
                  onChange={(e) => setModalAnswer(e.target.value)}
                  rows={2}
                  className="w-full rounded-[12px] px-4 py-2.5 outline-none resize-none"
                  style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 14, lineHeight: '21px', background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#101828' }}
                />
              </div>

              {/* Type */}
              <div className="space-y-1.5">
                <label style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 10, letterSpacing: '0.7px', color: '#99A1AF', textTransform: 'uppercase', display: 'block' }}>
                  TYPE
                </label>
                <div className="flex flex-wrap gap-2">
                  {MODAL_TYPE_OPTIONS.map((t) => {
                    const active = modalSourceType === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setModalSourceType(t.id)}
                        className="flex items-center gap-1.5 rounded-[10px] px-4 py-2 transition-colors"
                        style={{
                          fontFamily: 'Inter', fontWeight: 600, fontSize: 14,
                          background: active ? '#101828' : '#FFFFFF',
                          border: active ? '1px solid #101828' : '1px solid #E5E7EB',
                          color: active ? '#FFFFFF' : '#364153',
                        }}
                      >
                        <span aria-hidden>{t.icon}</span> {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 10, letterSpacing: '0.7px', color: '#99A1AF', textTransform: 'uppercase', display: 'block' }}>
                  SUBJECT
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {MODAL_SUBJECTS.map((s) => {
                    const active = modalDeck === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setModalDeck(s.id)}
                        className="flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-left transition-colors"
                        style={{
                          fontFamily: 'Inter', fontWeight: 500, fontSize: 13,
                          background: active ? '#101828' : '#FFFFFF',
                          border: active ? '1px solid #101828' : '1px solid #E5E7EB',
                          color: active ? '#FFFFFF' : '#364153',
                        }}
                      >
                        <span aria-hidden style={{ flexShrink: 0 }}>{s.icon}</span>
                        <span className="truncate">{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Review Schedule */}
              <div className="space-y-1.5">
                <label style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 10, letterSpacing: '0.7px', color: '#99A1AF', textTransform: 'uppercase', display: 'block' }}>
                  REVIEW SCHEDULE
                </label>
                <div className="flex flex-wrap gap-2">
                  {MODAL_SCHEDULE_OPTIONS.map((s) => {
                    const active = modalSchedule === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setModalSchedule(s.id as ModalScheduleId)}
                        className="flex items-center gap-1.5 rounded-full px-4 py-2 transition-colors"
                        style={{
                          fontFamily: 'Inter', fontWeight: 600, fontSize: 13,
                          background: active ? '#FFFBEB' : '#FFFFFF',
                          border: active ? '1.5px solid #E8B84B' : '1px solid #E5E7EB',
                          color: active ? '#D97706' : '#364153',
                        }}
                      >
                        <span aria-hidden>{s.icon}</span> {s.label}
                      </button>
                    );
                  })}
                </div>
                {modalSchedule === 'custom' && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      min={1}
                      max={365}
                      placeholder="Days"
                      value={modalCustomDays}
                      onChange={(e) => setModalCustomDays(e.target.value)}
                      className="rounded-[10px] px-3 py-2 outline-none w-24"
                      style={{ fontFamily: 'Inter', fontSize: 14, background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#101828' }}
                    />
                    <span style={{ fontFamily: 'Inter', fontSize: 13, color: '#6A7282' }}>days from today</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 px-7 py-4" style={{ borderTop: '1px solid #F3F4F6' }}>
              {addError && (
                <span style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, color: '#E7000B', flex: 1 }}>
                  {addError}
                </span>
              )}
              <button
                type="button"
                onClick={() => { setShowAddModal(false); setAddError(null); }}
                className="rounded-[12px] py-3 border transition-colors"
                style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 15, borderColor: '#E5E7EB', color: '#374151', flex: 1, background: '#FFFFFF' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddItem}
                disabled={saving || !modalQuestion.trim()}
                className="rounded-[12px] py-3 disabled:opacity-50 transition-opacity"
                style={{
                  flex: 2,
                  background: 'linear-gradient(90deg, #F0AE00 0%, #FE6D00 100%)',
                  fontFamily: 'Inter', fontWeight: 700, fontSize: 15, color: '#17223E',
                  boxShadow: '0px 1px 3px rgba(0,0,0,0.12)',
                }}
              >
                ✓ {saving ? 'Saving...' : 'Add to Review Queue'}
              </button>
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
