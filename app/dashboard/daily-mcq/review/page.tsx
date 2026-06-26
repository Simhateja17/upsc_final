'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { dailyMcqService, flashcardService, bookmarkService, spacedRepService } from '@/lib/services';
import { getSubjectBadgeStyle } from '@/lib/subjectPalette';

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

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

type FilterType = 'all' | 'correct' | 'wrong' | 'skipped';

function getOptionKey(option: { id: string; text: string }, idx: number): string {
  const labels = ['A', 'B', 'C', 'D'];
  return option.id || labels[idx] || String(idx);
}

function getStatus(q: ReviewQuestion) {
  if (q.selectedOption === null) {
    return { label: 'Skipped', color: '#D97706', background: '#FFFBEB', border: '#FDE68A' };
  }
  if (q.isCorrect) {
    return { label: 'Correct', color: '#059669', background: '#F0FDF4', border: '#BBF7D0' };
  }
  return { label: 'Wrong', color: '#DC2626', background: '#FEF2F2', border: '#FECACA' };
}

export default function QuestionReviewPage() {
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});
  const [needReview, setNeedReview] = useState<Record<string, boolean>>({});
  // Spaced-repetition item id per question, so "Need to Review" can also remove it.
  const [needReviewItemId, setNeedReviewItemId] = useState<Record<string, string>>({});

  useEffect(() => {
    dailyMcqService.getReview()
      .then(res => {
        const qs: ReviewQuestion[] = res.data.questions || [];
        setQuestions(qs);
        // Hydrate "Need to Review" from Spaced Repetition: a question is "marked"
        // when it already exists in the user's spaced-repetition queue.
        if (qs.length > 0) {
          spacedRepService.getItems()
            .then(r => {
              const items: Array<{ id: string; questionText: string }> = r.data?.items || r.data || [];
              const byText = new Map(items.map(it => [it.questionText, it.id]));
              const marked: Record<string, boolean> = {};
              const ids: Record<string, string> = {};
              qs.forEach(q => {
                const itemId = byText.get(q.questionText);
                if (itemId) { marked[q.id] = true; ids[q.id] = itemId; }
              });
              setNeedReview(marked);
              setNeedReviewItemId(ids);
            })
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleAddToFlashcards = async (q: ReviewQuestion) => {
    setActionLoading(`flashcard-${q.id}`);
    try {
      const correctOpt = q.options.find((opt, idx) => getOptionKey(opt, idx) === q.correctOption);
      const subjectId = q.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'general';
      await flashcardService.createCard({
        subjectId,
        subject: q.category,
        topic: q.category,
        question: q.questionText,
        answer: correctOpt?.text || q.correctOption,
        difficulty: q.difficulty,
      });
      showToast('Added to flashcards!');
    } catch {
      showToast('Failed to add to flashcards', 'error');
    }
    setActionLoading(null);
  };

  const handleToggleBookmark = async (q: ReviewQuestion) => {
    const wasBookmarked = !!bookmarked[q.id];
    setActionLoading(`bookmark-${q.id}`);
    setBookmarked(prev => ({ ...prev, [q.id]: !wasBookmarked }));
    try {
      await bookmarkService.toggle({
        entityType: 'mcq',
        entityId: q.id,
        title: q.questionText.slice(0, 140),
        source: 'Daily MCQ Review',
        tag: q.category,
        content: {
          questionText: q.questionText,
          options: q.options,
          correctOption: q.correctOption,
          explanation: q.explanation,
          difficulty: q.difficulty,
          category: q.category,
          selectedOption: q.selectedOption,
          isCorrect: q.isCorrect,
        },
      });
      showToast(wasBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks!');
    } catch {
      setBookmarked(prev => ({ ...prev, [q.id]: wasBookmarked }));
      showToast('Failed to update bookmark', 'error');
    }
    setActionLoading(null);
  };

  // "Need to Review" adds the question to the user's Spaced Repetition queue
  // (and removes it again when toggled off).
  const handleToggleNeedReview = async (q: ReviewQuestion) => {
    const wasMarked = !!needReview[q.id];
    setActionLoading(`review-${q.id}`);
    setNeedReview(prev => ({ ...prev, [q.id]: !wasMarked }));
    try {
      if (wasMarked) {
        const itemId = needReviewItemId[q.id];
        if (itemId) await spacedRepService.deleteItem(itemId);
        setNeedReviewItemId(prev => {
          const next = { ...prev };
          delete next[q.id];
          return next;
        });
        showToast('Removed from Spaced Repetition');
      } else {
        const correctOpt = q.options.find((opt, idx) => getOptionKey(opt, idx) === q.correctOption);
        const res = await spacedRepService.addItem({
          questionText: q.questionText,
          answer: correctOpt?.text || q.correctOption,
          subject: q.category,
          source: 'Daily MCQ Review',
          sourceType: 'daily-mcq',
        });
        const newId = res.data?.id;
        if (newId) setNeedReviewItemId(prev => ({ ...prev, [q.id]: newId }));
        showToast('Added to Spaced Repetition!');
      }
    } catch {
      setNeedReview(prev => ({ ...prev, [q.id]: wasMarked }));
      showToast(wasMarked ? 'Failed to remove from Spaced Repetition' : 'Failed to add to Spaced Repetition', 'error');
    }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col overflow-hidden" style={{ height: '100vh', background: '#FAFBFE' }}>
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </main>
      </div>
    );
  }

  const correctCount = questions.filter(q => q.isCorrect).length;
  const wrongCount = questions.filter(q => q.selectedOption !== null && !q.isCorrect).length;
  const skippedCount = questions.filter(q => q.selectedOption === null).length;

  const filteredQuestions = questions.filter(q => {
    if (filter === 'correct') return q.isCorrect;
    if (filter === 'wrong') return q.selectedOption !== null && !q.isCorrect;
    if (filter === 'skipped') return q.selectedOption === null;
    return true;
  });

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: questions.length },
    { key: 'correct', label: 'Correct', count: correctCount },
    { key: 'wrong', label: 'Wrong', count: wrongCount },
    { key: 'skipped', label: 'Skipped', count: skippedCount },
  ];

  return (
    <div className="flex flex-col overflow-y-auto relative" style={{ minHeight: 'calc(100vh - clamp(90px, 5.78vw, 111px))', background: '#FAFBFE' }}>
      <style>{`
        .review-pill{display:inline-flex;align-items:center;gap:7px;padding:7px 14px;border-radius:999px;border:1px solid #E5E7EB;background:#FFFFFF;font-size:clamp(12px,0.73vw,13px);font-weight:700;cursor:pointer;transition:all .15s ease;white-space:nowrap;}
        .review-pill:hover{border-color:#CBD5E1;background:#F8FAFC;transform:translateY(-1px);box-shadow:0 4px 12px -8px rgba(15,23,42,.25);}
        .review-pill:disabled{opacity:.5;cursor:default;transform:none;box-shadow:none;}
      `}</style>
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all"
          style={{
            background: toast.type === 'success' ? '#F0FDF4' : '#FEF2F2',
            border: toast.type === 'success' ? '1px solid #86EFAC' : '1px solid #FCA5A5',
            color: toast.type === 'success' ? '#166534' : '#991B1B',
          }}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.message}
        </div>
      )}

      <main className="flex-1 flex flex-col items-center px-[clamp(1rem,2vw,3rem)] py-[clamp(1rem,2vh,1.5rem)]">
        <div className="w-full" style={{ maxWidth: 'clamp(700px,60vw,1100px)' }}>

          {/* Header */}
          <div className="card-elevated rounded-2xl flex items-center justify-between gap-4 px-[clamp(1.25rem,1.5vw,2rem)] py-[clamp(1rem,1.25vw,1.5rem)] mb-[clamp(1rem,1.25vw,1.5rem)] bg-white">
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/dashboard/daily-mcq/results">
                <button className="flex items-center justify-center rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] transition-colors flex-shrink-0"
                  style={{ width: '40px', height: '40px' }} aria-label="Back to results">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="#374151" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </Link>
              <div className="min-w-0">
                <h1 className="font-arimo font-extrabold tracking-tight text-[#17223E] flex items-center gap-2"
                  style={{ fontSize: 'clamp(17px,1.1vw,21px)' }}>
                  <span>✅</span> Answer Review
                </h1>
                <p className="font-arimo font-medium text-[#475467]" style={{ fontSize: 'clamp(12px,0.68vw,14px)' }}>
                  Detailed explanation for each question
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="rounded-full px-3 py-1.5 font-arimo font-bold"
                style={{ background: '#F0FDF4', color: '#16A34A', fontSize: 'clamp(12px,0.68vw,14px)' }}>
                {correctCount} Correct
              </span>
              <span className="rounded-full px-3 py-1.5 font-arimo font-bold"
                style={{ background: '#FEF2F2', color: '#DC2626', fontSize: 'clamp(12px,0.68vw,14px)' }}>
                {wrongCount} Wrong
              </span>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mb-[clamp(1rem,1.25vw,1.5rem)] flex-wrap">
            {filters.map(f => (
              <button key={f.key}
                onClick={() => setFilter(f.key)}
                className="font-arimo font-bold rounded-full transition-colors"
                style={{
                  padding: 'clamp(8px,0.6vw,10px) clamp(16px,1.1vw,20px)',
                  fontSize: 'clamp(12px,0.73vw,14px)',
                  background: filter === f.key ? '#17223E' : '#FFFFFF',
                  color: filter === f.key ? '#FFFFFF' : '#4B5563',
                  border: filter === f.key ? '1px solid #17223E' : '1px solid #E5E7EB',
                }}>
                {f.label} ({f.count})
              </button>
            ))}
          </div>

          {/* Question List */}
          <div className="space-y-3 pb-[clamp(1.5rem,2vw,2.5rem)]">
            {filteredQuestions.length > 0 ? filteredQuestions.map((question) => {
              const isOpen = openId === question.id;
              const status = getStatus(question);
              const originalIndex = questions.findIndex(q => q.id === question.id);

              return (
                <div key={question.id}
                  className="overflow-hidden rounded-2xl border border-white/60 bg-white shadow-sm transition-all duration-300">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenId(isOpen ? null : question.id)}
                    className="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50/50">
                    <span
                      className="flex h-7 min-w-7 flex-shrink-0 items-center justify-center rounded-lg font-arimo text-xs font-bold text-white"
                      style={{ background: '#17223E' }}>
                      {question.questionNum || originalIndex + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block font-arimo text-sm font-bold leading-relaxed text-[#101828] whitespace-pre-line ${isOpen ? '' : 'line-clamp-2'}`}>
                        {question.questionText}
                      </span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-2">
                        {(() => {
                          const subjectStyle = getSubjectBadgeStyle(question.category);
                          return (
                            <span className="rounded-full px-2 py-0.5 font-arimo text-xs font-bold"
                              style={{ background: subjectStyle.bg, color: subjectStyle.color }}>
                              {question.category || 'Daily MCQ'}
                            </span>
                          );
                        })()}
                        {question.difficulty && (
                          <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 font-arimo text-xs text-[#6B7280]">
                            {question.difficulty}
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="flex flex-shrink-0 items-center gap-2">
                      <span
                        className="rounded-lg border px-2 py-1 font-arimo text-xs font-semibold"
                        style={{ color: status.color, background: status.background, borderColor: status.border }}>
                        {status.label}
                      </span>
                      <svg
                        width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"
                        className="text-[#9CA3AF] transition-transform duration-300"
                        style={{ transform: isOpen ? 'rotate(180deg)' : undefined }}>
                        <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </button>

                  {isOpen && (
                    <div className="space-y-4 border-t border-[#F3F4F6] px-5 py-4">
                      <div className="space-y-2">
                        {question.options.map((option, optionIdx) => {
                          const optionKey = getOptionKey(option, optionIdx);
                          const isCorrectOption = optionKey === question.correctOption;
                          const isSelectedWrong = optionKey === question.selectedOption && !isCorrectOption;

                          return (
                            <div
                              key={option.id || optionIdx}
                              className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 font-arimo"
                              style={{
                                background: isCorrectOption ? '#F0FDF4' : isSelectedWrong ? '#FEF2F2' : '#F9FAFB',
                                border: isCorrectOption ? '2px solid #22C55E' : isSelectedWrong ? '2px solid #EF4444' : '1.5px solid #E5E7EB',
                                color: isCorrectOption ? '#15803D' : isSelectedWrong ? '#DC2626' : '#374151',
                              }}>
                              <span
                                className="flex h-6 min-w-6 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                                style={{
                                  background: isCorrectOption ? '#22C55E' : isSelectedWrong ? '#EF4444' : '#E5E7EB',
                                  color: isCorrectOption || isSelectedWrong ? '#FFFFFF' : '#6B7280',
                                }}>
                                {optionKey}
                              </span>
                              <span className="flex-1 text-sm">{option.text}</span>
                              {isCorrectOption && <span className="ml-auto text-xs font-bold text-[#22C55E]">Correct</span>}
                              {isSelectedWrong && <span className="ml-auto text-xs font-bold text-[#EF4444]">Wrong</span>}
                            </div>
                          );
                        })}
                      </div>

                      <div className="font-arimo text-sm text-[#6B7280]">
                        You picked:{' '}
                        <span className="font-bold" style={{ color: status.color }}>
                          {question.selectedOption ? `Option ${question.selectedOption}` : 'Skipped'}
                        </span>
                      </div>

                      <div className="rounded-xl border border-[#D9E7FF] bg-[#EFF6FF] p-4">
                        <h4 className="mb-2 font-arimo text-xs font-bold uppercase tracking-wider text-[#17223E] flex items-center gap-1.5">
                          <span>💡</span> Explanation
                        </h4>
                        <p className="font-arimo text-sm leading-relaxed text-[#374151]">
                          {question.explanation || 'Explanation is not available for this question yet.'}
                        </p>
                      </div>

                      <div className="pt-1 border-t border-[#E5E7EB]">
                        <div className="flex items-center gap-3 flex-wrap pt-3">
                          {/* Add to Flashcard */}
                          <button
                            onClick={() => handleAddToFlashcards(question)}
                            disabled={actionLoading === `flashcard-${question.id}`}
                            className="review-pill font-arimo"
                            style={{ color: '#475467' }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
                            </svg>
                            {actionLoading === `flashcard-${question.id}` ? 'Adding…' : 'Add to Flashcard'}
                          </button>
                          {/* Need to Review */}
                          <button
                            onClick={() => handleToggleNeedReview(question)}
                            disabled={actionLoading === `review-${question.id}`}
                            className="review-pill font-arimo"
                            style={needReview[question.id]
                              ? { color: '#B45309', background: '#FFFBEB', borderColor: '#FCD34D' }
                              : { color: '#475467' }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M3 2v6h6" />
                              <path d="M3.51 15a9 9 0 1 0 .49-9.36L3 8" />
                            </svg>
                            {actionLoading === `review-${question.id}` ? 'Saving…' : needReview[question.id] ? 'Marked for Review' : 'Need to Review'}
                          </button>
                          {/* Bookmark */}
                          <button
                            onClick={() => handleToggleBookmark(question)}
                            disabled={actionLoading === `bookmark-${question.id}`}
                            className="review-pill font-arimo"
                            style={bookmarked[question.id]
                              ? { color: '#1D4ED8', background: '#EFF6FF', borderColor: '#BFDBFE' }
                              : { color: '#475467' }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill={bookmarked[question.id] ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            </svg>
                            {actionLoading === `bookmark-${question.id}` ? 'Saving…' : bookmarked[question.id] ? 'Bookmarked' : 'Bookmark'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            }) : (
              <div className="bg-white border border-[#E5E7EB] rounded-2xl text-center font-arimo text-[#4A5565] py-10"
                style={{ fontSize: 'clamp(12px,0.68vw,14px)' }}>
                No questions match this filter.
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-center gap-[clamp(1rem,1.25vw,1.5rem)] pb-[clamp(1.25rem,1.5vw,2rem)]">
            <Link href="/dashboard/daily-mcq/results">
              <button className="flex items-center justify-center gap-2 bg-white hover:opacity-70 transition-opacity font-arimo"
                style={{ height: '51.2px', borderRadius: '10px', border: '1.6px solid #2B7FFF', fontSize: '16px', fontWeight: 400, color: '#155DFC', padding: '0 32px', whiteSpace: 'nowrap' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="#155DFC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Back to Results
              </button>
            </Link>
            <Link href="/dashboard/daily-mcq/next-steps">
              <button className="bg-[#17223E] text-white hover:bg-[#1E2875] transition-colors font-arimo"
                style={{ height: '51.2px', borderRadius: '10px', fontSize: '16px', fontWeight: 400, padding: '0 32px', whiteSpace: 'nowrap' }}>
                View Smart Next Steps
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
