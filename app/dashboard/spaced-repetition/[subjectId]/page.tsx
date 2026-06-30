'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { flashcardService, spacedRepService, userService } from '@/lib/services';
import SpacedRepStyles from '../referenceStyles';
import AddQuestionModal, { type AddQuestionPayload } from '../AddQuestionModal';
import {
  FREE_QUESTION_LIMIT,
  normalizeScheduleDays,
  reviewInfo,
  scheduleOptions,
  sourceTypeToLabel,
  subjectHealthById,
  subjectLabelToId,
  subjectOptions,
  type SpacedRepItem,
} from '../shared';

const FILTERS = ['All', 'mcq', 'mains', 'pyq', 'custom', 'Overdue', 'Due Today'] as const;
type FilterKey = (typeof FILTERS)[number];

const FILTER_META: Record<FilterKey, { label: string; showCount: boolean }> = {
  All: { label: 'All', showCount: true },
  mcq: { label: '📝 MCQ', showCount: true },
  mains: { label: '✍️ Mains', showCount: true },
  pyq: { label: '📊 PYQ', showCount: true },
  custom: { label: '📄 Custom', showCount: true },
  Overdue: { label: '⏰ Overdue', showCount: false },
  'Due Today': { label: '⚡ Due Today', showCount: false },
};

function sourceMeta(sourceType: string): { icon: string; label: string } {
  switch (sourceType) {
    case 'mcq': return { icon: '📝', label: 'MCQ' };
    case 'mains': return { icon: '✍️', label: 'Mains' };
    case 'pyq': return { icon: '📊', label: 'PYQ' };
    default: return { icon: '✏️', label: 'Custom' };
  }
}

export default function SpacedRepetitionSubjectPage() {
  const params = useParams<{ subjectId: string }>();
  const subjectId = typeof params?.subjectId === 'string' ? params.subjectId : '';
  const health = subjectHealthById(subjectId);
  const option = subjectOptions.find((o) => o.id === subjectId);
  const subjectLabel = health?.label ?? option?.label ?? subjectId;
  const subjectIcon = health?.icon ?? option?.icon ?? '📚';

  const [items, setItems] = useState<SpacedRepItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('All');
  const [flashcardToast, setFlashcardToast] = useState<{ subjectId: string; subject: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<SpacedRepItem | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

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
        answer: q.answer?.trim() || 'Review this question.',
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

  const handleAddItem = async (payload: AddQuestionPayload): Promise<boolean> => {
    const subjectName = subjectOptions.find((d) => d.id === payload.subjectId)?.label
      ?? subjectHealthById(payload.subjectId)?.label
      ?? payload.subjectId;
    const res = await spacedRepService.addItem({
      questionText: payload.questionText,
      answer: payload.answer || undefined,
      subject: subjectName,
      source: sourceTypeToLabel(payload.sourceType),
      sourceType: payload.sourceType,
      scheduleDays: [payload.firstReviewDays],
    });
    if (res.status === 'success') {
      setItems((prev) => [res.data, ...prev]);
      return true;
    }
    return false;
  };

  const deleteItem = (q: SpacedRepItem) => {
    setItems((prev) => prev.filter((i) => i.id !== q.id));
    spacedRepService.deleteItem(q.id).catch(() => {
      // Re-add on failure so the user doesn't silently lose the row.
      setItems((prev) => [q, ...prev]);
    });
  };

  // All items for this subject — drives counts + the free-slot meter.
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
    <div className="flex overflow-hidden" style={{ background: '#f8f9fb', height: '100%' }}>
      <SpacedRepStyles />

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
        <div className="sr-scope question-view">
          {/* Header */}
          <div className="qv-header">
            <div className="qv-left">
              <Link href="/dashboard/spaced-repetition" className="qv-back" aria-label="Back to subjects">
                <svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              </Link>
              <div className="qv-title">
                <h2>
                  <span>{subjectIcon}</span> {subjectLabel}
                  {counts.All > 0 && <span className="qv-count">{counts.All}</span>}
                </h2>
                <p>Revise these questions to close the gaps in {subjectLabel}</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="qv-filters">
            {FILTERS.map((f) => {
              const meta = FILTER_META[f];
              return (
                <div
                  key={f}
                  className={`qv-filter${filter === f ? ' active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {meta.label}
                  {meta.showCount && <span className="f-count">({counts[f]})</span>}
                </div>
              );
            })}
          </div>

          {/* Table */}
          <div className="qv-table-wrap">
            <div className="qv-col-headers">
              <span className="qh-question">QUESTION</span>
              <span className="qh-subject">SUBJECT</span>
              <span className="qh-review">NEXT REVIEW</span>
              <span className="qh-schedule">SCHEDULE</span>
              <span className="qh-remind">REMIND</span>
            </div>
            <div className="qv-list">
              {loading ? (
                <div className="qv-empty">Loading questions…</div>
              ) : visibleItems.length === 0 ? (
                <div className="qv-empty">
                  No questions {filter === 'All' ? '' : 'match this filter'} for {subjectLabel} yet. Add your first question below.
                </div>
              ) : (
                visibleItems.map((q) => {
                  const rev = reviewInfo(q.nextReviewAt);
                  const activeDays = normalizeScheduleDays(q);
                  const src = sourceMeta(q.sourceType);
                  return (
                    <div className="qv-question" key={q.id} onClick={() => { setReviewTarget(q); setShowAnswer(false); }}>
                      <div className="qv-q-content">
                        <div className="qv-q-text">{q.questionText}</div>
                        <div className="qv-q-tags">
                          <span className={`qv-tag ${rev.tone}`}>{rev.icon} {rev.chipText}</span>
                          <span className="qv-tag custom">{src.icon} {src.label}</span>
                          {q.addedToFlashcard ? (
                            <span className="qv-tag flashcard">✓ In Flashcards</span>
                          ) : (
                            <button
                              className="qv-flashcard-btn"
                              onClick={(e) => { e.stopPropagation(); addToFlashcards(q); }}
                            >
                              + Add to Flashcards
                            </button>
                          )}
                          <button
                            className="qv-delete-btn"
                            onClick={(e) => { e.stopPropagation(); deleteItem(q); }}
                            title="Delete question"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                      <div className="qv-subject-col">
                        <div className="qv-subject-pill"><div className="sp-dot">{subjectIcon}</div>{subjectLabel}</div>
                      </div>
                      <div className="qv-review-col">
                        <span className={`qv-review-status ${rev.tone}`}>{rev.nextLabel.toUpperCase()}</span>
                      </div>
                      <div className="qv-schedule">
                        {scheduleOptions.map((day) => (
                          <button
                            key={day}
                            className={`qv-schedule-btn${activeDays.includes(day) ? ' active' : ''}`}
                            onClick={(e) => { e.stopPropagation(); toggleSchedule(q.id, day); }}
                          >
                            {day}d
                          </button>
                        ))}
                      </div>
                      <button
                        className={`qv-remind-toggle${q.remindEnabled ? ' on' : ''}`}
                        onClick={(e) => { e.stopPropagation(); toggleRemind(q.id, q.remindEnabled); }}
                        role="switch"
                        aria-checked={q.remindEnabled}
                        aria-label="Toggle reminder"
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Add custom question row */}
          <div className="qv-add-custom" onClick={() => setShowAddModal(true)}>
            <div className="qv-add-icon">+</div>
            <div className="qv-add-text">
              <h4>Add Custom Question / Topic</h4>
              <p>Create your own question for review · {freeRemaining} free slot{freeRemaining === 1 ? '' : 's'} remaining</p>
            </div>
            <button className="qv-add-btn" onClick={(e) => { e.stopPropagation(); setShowAddModal(true); }}>+ Add</button>
          </div>

          <div className="qv-upgrade-prompt-bottom">
            🔓 <strong>Unlock unlimited questions with Pro</strong> | {usedSlots} of {FREE_QUESTION_LIMIT} free slots used
          </div>
        </div>
      </div>

      {/* Add Question modal */}
      <AddQuestionModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        defaultSubjectId={subjectId}
        onSubmit={handleAddItem}
      />

      {/* Review modal */}
      {reviewTarget && (() => {
        const rev = reviewInfo(reviewTarget.nextReviewAt);
        const src = sourceMeta(reviewTarget.sourceType);
        const hasAnswer = !!reviewTarget.answer?.trim();
        const close = () => { setReviewTarget(null); setShowAnswer(false); };
        return (
          <div className="sr-modal-overlay" onClick={close}>
            <div className="sr-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Question Review</h3>
                <button className="modal-close" onClick={close} aria-label="Close">✕</button>
              </div>
              <div className="modal-body">
                <div className="review-tags">
                  <span className="review-tag" style={{ background: rev.chipBg, color: rev.chipColor }}>{rev.icon} {rev.chipText}</span>
                  <span className="review-tag" style={{ background: 'rgba(245,158,11,.12)', color: 'var(--orange)' }}>{subjectIcon} {reviewTarget.subject}</span>
                  <span className="review-tag" style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}>{src.icon} {src.label}</span>
                </div>
                <div className="review-question">{reviewTarget.questionText}</div>
                {!showAnswer ? (
                  <button className="show-answer-btn" onClick={() => setShowAnswer(true)}>💡 Show Answer</button>
                ) : (
                  <div className="answer-reveal">
                    {hasAnswer ? (
                      <><strong>Answer:</strong> {reviewTarget.answer}</>
                    ) : (
                      <em>No answer saved yet. Edit this question to add key points.</em>
                    )}
                  </div>
                )}
                <button className="review-close-btn" onClick={close}>Close</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
