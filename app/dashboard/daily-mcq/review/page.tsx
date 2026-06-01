'use client';

import React, { useEffect, useState } from 'react';
import { dailyMcqService, flashcardService, spacedRepService } from '@/lib/services';

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

function getOptionKey(option: { id: string; text: string }, idx: number): string {
  const labels = ['A', 'B', 'C', 'D'];
  return option.id || labels[idx] || String(idx);
}

export default function QuestionReviewPage() {
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showExplanation, setShowExplanation] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showWeakAreas, setShowWeakAreas] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    dailyMcqService.getReview()
      .then(res => setQuestions(res.data.questions || []))
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
      const correctOpt = q.options.find((_, idx) => getOptionKey(_, idx) === q.correctOption);
      await flashcardService.createCard({
        subjectId: '',
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

  const handleNeedToRevise = async (q: ReviewQuestion) => {
    setActionLoading(`revise-${q.id}`);
    try {
      await spacedRepService.addItem({
        questionText: q.questionText,
        subject: q.category,
        source: 'daily-mcq',
        sourceType: 'mcq',
        scheduleDay: 1,
        scheduleDays: [1, 3, 7, 14, 30],
        remindEnabled: true,
      });
      showToast('Added to spaced repetition!');
    } catch {
      showToast('Failed to add to revision', 'error');
    }
    setActionLoading(null);
  };

  const handleStudyNotes = (q: ReviewQuestion) => {
    if (typeof window !== 'undefined') {
      const notes = JSON.parse(sessionStorage.getItem('studyNotes') || '[]');
      notes.push({
        questionId: q.id,
        question: q.questionText,
        category: q.category,
        addedAt: new Date().toISOString(),
      });
      sessionStorage.setItem('studyNotes', JSON.stringify(notes));
    }
    showToast('Saved to study notes!');
  };

  if (loading) {
    return (
      <div className="flex flex-col overflow-hidden" style={{ height: '100vh', background: '#E8EDF5' }}>
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </main>
      </div>
    );
  }

  const q = questions[currentIndex];
  if (!q) return <div className="flex flex-col overflow-hidden" style={{ height: '100vh', background: '#E8EDF5' }}><main className="flex-1 flex items-center justify-center"><p>No review data available.</p></main></div>;

  const wrongQuestions = questions.filter((qw) => !qw.isCorrect);
  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="flex flex-col overflow-hidden relative" style={{ height: '100vh', background: '#E8EDF5' }}>
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

      <main className="flex-1 flex flex-col items-center justify-center px-[clamp(1rem,2vw,3rem)] py-4">
        <div className="card-elevated rounded-[clamp(10px,0.52vw,10px)] flex-1 flex flex-col"
          style={{ width: 'clamp(700px,50vw,962px)', maxHeight: 'calc(100vh - 2rem)' }}>

          <div className="flex items-center justify-between px-[clamp(1.5rem,2vw,2.5rem)] pt-[clamp(1.25rem,1.5vw,2rem)] pb-3 flex-shrink-0">
            <div className="flex items-center gap-[clamp(8px,0.625vw,12px)]">
              <img src="/question-review-icon.png" alt="Question Review"
                style={{ width: 'clamp(20px,1.46vw,28px)', height: 'clamp(20px,1.46vw,28px)' }} />
              <h1 className="font-arimo font-bold text-[#101828]"
                style={{ fontSize: 'clamp(16px,0.94vw,18px)', lineHeight: 'clamp(24px,1.46vw,28px)' }}>
                Question Review ({currentIndex + 1}/{questions.length})
              </h1>
            </div>
            <div className="flex gap-2">
              <button disabled={currentIndex === 0} onClick={() => setCurrentIndex(i => i - 1)}
                className="px-3 py-1 rounded border text-sm disabled:opacity-30 font-arimo">Prev</button>
              <button disabled={currentIndex === questions.length - 1} onClick={() => setCurrentIndex(i => i + 1)}
                className="px-3 py-1 rounded border text-sm disabled:opacity-30 font-arimo">Next</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-[clamp(1.5rem,2vw,2.5rem)] pb-4">
            <div className="flex gap-[clamp(1rem,1.25vw,1.5rem)]">
              <div className="flex-shrink-0 rounded-full bg-[#F9FAFB] flex items-center justify-center font-arimo text-[#99A1AF]"
                style={{ width: 'clamp(28px,1.67vw,32px)', height: 'clamp(28px,1.67vw,32px)', fontSize: 'clamp(20px,1.25vw,24px)' }}>
                {currentIndex + 1}
              </div>

              <div className="flex-1">
                <div className="mb-[clamp(0.75rem,1vw,1.25rem)]">
                  <p className="font-arimo text-[#364153]"
                    style={{ fontSize: 'clamp(13px,0.73vw,14px)', lineHeight: 'clamp(18px,1.19vw,22.75px)' }}>
                    {q.questionText}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-[clamp(0.75rem,1vw,1.25rem)] mb-[clamp(1rem,1.25vw,1.5rem)]">
                  {(q.options as any[]).map((option: any, idx: number) => {
                    const optKey = getOptionKey(option, idx);
                    const isCorrect = optKey === q.correctOption;
                    const isSelected = optKey === q.selectedOption;
                    const label = optionLabels[idx] || optKey;

                    let bg = '#F9FAFB';
                    let border = '1px solid #E5E7EB';
                    let textColor = '#364153';
                    let labelBg = '#F3F4F6';
                    let labelColor = '#6B7280';
                    let labelBorder = '1px solid #E5E7EB';
                    let badge = '';
                    let badgeColor = '';

                    if (isCorrect) {
                      bg = '#F0FDF4';
                      border = '2px solid #00C950';
                      textColor = '#14532D';
                      labelBg = '#DCFCE7';
                      labelColor = '#16A34A';
                      labelBorder = '1px solid #86EFAC';
                      badge = '✓ Correct';
                      badgeColor = '#16A34A';
                    } else if (isSelected && !isCorrect) {
                      bg = '#FEF2F2';
                      border = '2px solid #FB2C36';
                      textColor = '#7F1D1D';
                      labelBg = '#FEE2E2';
                      labelColor = '#DC2626';
                      labelBorder = '1px solid #FCA5A5';
                      badge = ' Your Answer';
                      badgeColor = '#DC2626';
                    }

                    return (
                      <div key={option.id || idx}
                        className="rounded-[clamp(8px,0.52vw,10px)] flex items-center justify-between"
                        style={{
                          padding: 'clamp(0.75rem,1vw,1.25rem)',
                          background: bg,
                          border,
                        }}>
                        <div className="flex items-center gap-3">
                          <span className="font-arimo font-bold flex-shrink-0" style={{
                            width: 'clamp(24px,1.5vw,28px)',
                            height: 'clamp(24px,1.5vw,28px)',
                            borderRadius: '6px',
                            background: labelBg,
                            color: labelColor,
                            border: labelBorder,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 'clamp(12px,0.73vw,14px)',
                          }}>
                            {label}
                          </span>
                          <span className="font-arimo" style={{ fontSize: 'clamp(13px,0.73vw,14px)', lineHeight: 'clamp(18px,1.19vw,22.75px)', color: textColor }}>
                            {option.text}
                          </span>
                        </div>
                        {badge && (
                          <span className="font-arimo font-bold flex-shrink-0 ml-2" style={{ fontSize: 'clamp(11px,0.65vw,13px)', color: badgeColor }}>
                            {badge}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button onClick={() => setShowExplanation(!showExplanation)}
                  className="flex items-center gap-2 font-arimo font-bold text-[#101828] hover:opacity-70 transition-opacity mb-[clamp(0.75rem,1vw,1.25rem)]"
                  style={{ fontSize: 'clamp(13px,0.73vw,14px)' }}>
                  {showExplanation ? 'Hide' : 'View'} Explanation
                  <img src="/arrow-down-icon.png" alt="Arrow"
                    style={{ width: 'clamp(14px,0.83vw,16px)', height: 'clamp(14px,0.83vw,16px)', transform: showExplanation ? 'rotate(180deg)' : undefined }} />
                </button>

                {showExplanation && q.explanation && (
                  <div className="bg-[#EFF6FF] rounded-[clamp(8px,0.52vw,10px)] border border-[#BFDBFE]"
                    style={{ padding: 'clamp(1rem,1.25vw,1.5rem)' }}>
                    <h3 className="font-arimo font-bold text-[#155DFC] mb-[clamp(0.5rem,0.75vw,1rem)]"
                      style={{ fontSize: 'clamp(14px,0.83vw,16px)' }}>Explanation</h3>
                    <p className="font-arimo text-[#1C398E]"
                      style={{ fontSize: 'clamp(13px,0.73vw,14px)', lineHeight: 'clamp(18px,1.19vw,22.75px)' }}>
                      {q.explanation}
                    </p>
                  </div>
                )}

                {/* Action Links for Wrong Answers — matches screenshot design */}
                {!q.isCorrect && (
                  <div className="mt-4 pt-3 border-t border-[#E5E7EB]">
                    <div className="flex items-center gap-4 flex-wrap">
                      <button
                        onClick={() => handleAddToFlashcards(q)}
                        disabled={actionLoading === `flashcard-${q.id}`}
                        className="font-arimo font-bold hover:underline transition-colors disabled:opacity-50"
                        style={{ fontSize: 'clamp(12px,0.73vw,13px)', color: '#7C3AED' }}>
                        {actionLoading === `flashcard-${q.id}` ? 'Adding...' : 'Add to Flashcards'}
                      </button>
                      <button
                        onClick={() => handleNeedToRevise(q)}
                        disabled={actionLoading === `revise-${q.id}`}
                        className="font-arimo font-bold hover:underline transition-colors disabled:opacity-50"
                        style={{ fontSize: 'clamp(12px,0.73vw,13px)', color: '#DC2626' }}>
                        {actionLoading === `revise-${q.id}` ? 'Adding...' : 'Need to Revise'}
                      </button>
                      <button
                        onClick={() => handleStudyNotes(q)}
                        className="font-arimo font-bold hover:underline transition-colors"
                        style={{ fontSize: 'clamp(12px,0.73vw,13px)', color: '#2563EB' }}>
                        Study Notes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Review Weak Areas Section */}
          {wrongQuestions.length > 0 && (
            <div className="px-[clamp(1.5rem,2vw,2.5rem)] pb-3 flex-shrink-0">
              <button
                onClick={() => setShowWeakAreas(!showWeakAreas)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all"
                style={{
                  borderColor: showWeakAreas ? '#FB2C36' : '#E5E7EB',
                  background: showWeakAreas ? '#FEF2F2' : '#FFFFFF',
                }}>
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '18px' }}>⚠️</span>
                  <div className="text-left">
                    <span className="font-arimo font-bold text-[#991B1B]" style={{ fontSize: 'clamp(13px,0.73vw,14px)' }}>
                      Review Weak Areas ({wrongQuestions.length} question{wrongQuestions.length > 1 ? 's' : ''})
                    </span>
                    <p className="font-arimo text-[#7F1D1D]" style={{ fontSize: 'clamp(11px,0.65vw,12px)' }}>
                      Questions you got wrong — save them for spaced repetition
                    </p>
                  </div>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  style={{ transform: showWeakAreas ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }}>
                  <path d="M6 9l6 6 6-6" stroke="#991B1B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

                {showWeakAreas && (
                  <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                    {wrongQuestions.map((wq, idx) => {
                      const originalIndex = questions.findIndex(q => q.id === wq.id);
                      return (
                      <div key={wq.id} className="flex items-start gap-3 p-3 rounded-lg bg-white border border-[#FECACA]">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FEE2E2] flex items-center justify-center text-[#DC2626] font-bold text-xs">
                          {originalIndex + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-arimo text-[#101828] truncate" style={{ fontSize: '12px' }}>
                            {wq.questionText}
                          </p>
                          <div className="flex gap-3 mt-2">
                            <button
                              onClick={() => {
                                setCurrentIndex(originalIndex);
                                setShowWeakAreas(false);
                              }}
                              className="font-arimo font-bold hover:underline text-[#155DFC]"
                              style={{ fontSize: '11px' }}>
                              View Question
                            </button>
                            <button
                              onClick={() => handleAddToFlashcards(wq)}
                              className="font-arimo font-bold hover:underline text-[#7C3AED]"
                              style={{ fontSize: '11px' }}>
                              Add to Flashcards
                            </button>
                            <button
                              onClick={() => handleNeedToRevise(wq)}
                              className="font-arimo font-bold hover:underline text-[#DC2626]"
                              style={{ fontSize: '11px' }}>
                              Need to Revise
                            </button>
                            <button
                              onClick={() => handleStudyNotes(wq)}
                              className="font-arimo font-bold hover:underline text-[#2563EB]"
                              style={{ fontSize: '11px' }}>
                              Study Notes
                            </button>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
            </div>
          )}

          <div className="flex items-center justify-center gap-[clamp(1rem,1.25vw,1.5rem)] px-[clamp(1.5rem,2vw,2.5rem)] pb-[clamp(1.25rem,1.5vw,2rem)] flex-shrink-0">
            <a href="/dashboard">
              <button className="flex items-center justify-center gap-2 bg-white hover:opacity-70 transition-opacity font-arimo"
                style={{ height: '51.2px', borderRadius: '10px', border: '1.6px solid #2B7FFF', fontSize: '16px', fontWeight: 400, color: '#155DFC', padding: '0 20px', whiteSpace: 'nowrap' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="#155DFC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Back to Dashboard
              </button>
            </a>
            <a href="/dashboard/daily-mcq/next-steps">
              <button className="bg-[#17223E] text-white rounded-[clamp(8px,0.52vw,10px)] hover:bg-[#1E2875] transition-colors"
                style={{ padding: 'clamp(10px,0.83vw,12px) clamp(1.5rem,1.67vw,2rem)', fontSize: 'clamp(14px,0.83vw,16px)', fontFamily: 'Arimo, sans-serif' }}>
                View Smart Next Steps
              </button>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
