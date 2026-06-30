'use client';

import React, { useEffect, useState } from 'react';
import { SUBJECT_HEALTH } from './shared';

export type AddQuestionPayload = {
  questionText: string;
  answer: string;
  subjectId: string;
  sourceType: string;
  firstReviewDays: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  defaultSubjectId?: string;
  /** Returns true on success (modal resets + closes), false to keep it open. */
  onSubmit: (payload: AddQuestionPayload) => Promise<boolean>;
};

const TYPE_OPTIONS = [
  { id: 'mcq', label: '📝 MCQ' },
  { id: 'mains', label: '✍️ Mains' },
  { id: 'pyq', label: '📊 PYQ' },
  { id: 'custom', label: '📄 Custom' },
];

const REVIEW_OPTIONS = [
  { days: 1, label: '1 day' },
  { days: 3, label: '3 days' },
  { days: 7, label: '7 days' },
  { days: 15, label: '15 days' },
];

export default function AddQuestionModal({ open, onClose, defaultSubjectId, onSubmit }: Props) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [subjectId, setSubjectId] = useState(defaultSubjectId ?? SUBJECT_HEALTH[0].id);
  const [sourceType, setSourceType] = useState('mcq');
  const [firstReview, setFirstReview] = useState(3);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && defaultSubjectId) setSubjectId(defaultSubjectId);
  }, [open, defaultSubjectId]);

  if (!open) return null;

  const reset = () => {
    setQuestion('');
    setAnswer('');
    setSourceType('mcq');
    setFirstReview(3);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!question.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const ok = await onSubmit({
        questionText: question.trim(),
        answer: answer.trim(),
        subjectId,
        sourceType,
        firstReviewDays: firstReview,
      });
      if (ok) {
        reset();
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add question. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sr-modal-overlay" onClick={onClose}>
      <div className="sr-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-dark">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 21L3.00012 17.0001L15.5858 4.4144C15.9574 4.04285 16.4612 3.83404 16.9863 3.83404C17.5115 3.83404 18.0153 4.04285 18.3868 4.4144L19.5856 5.6132C19.9571 5.98475 20.1659 6.48856 20.1659 7.0137C20.1659 7.53885 19.9571 8.04265 19.5856 8.4142L7.00012 21L3 21Z" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Add Question to Review</span>
          </h3>
          <button className="modal-close-light" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-form-group">
            <label>Question / Topic</label>
            <textarea
              placeholder="e.g. Why does the Coriolis force deflect objects to the right in the Northern Hemisphere?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>
          <div className="modal-form-group">
            <label>Answer/Key Points <span className="optional-tag">(Optional)</span></label>
            <textarea
              placeholder="Add what you want to remember..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
          </div>
          <div className="modal-form-group">
            <label>Subject</label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              {SUBJECT_HEALTH.map((s) => (
                <option key={s.id} value={s.id}>{s.shortLabel ?? s.label}</option>
              ))}
            </select>
          </div>
          <div className="modal-form-group">
            <label>Question Type</label>
            <div className="modal-tags">
              {TYPE_OPTIONS.map((t) => (
                <span
                  key={t.id}
                  className={`modal-tag${sourceType === t.id ? ' selected' : ''}`}
                  onClick={() => setSourceType(t.id)}
                >
                  {t.label}
                </span>
              ))}
            </div>
          </div>
          <div className="modal-form-group">
            <label>First review in</label>
            <div className="modal-tags">
              {REVIEW_OPTIONS.map((r) => (
                <span
                  key={r.days}
                  className={`modal-tag${firstReview === r.days ? ' selected' : ''}`}
                  onClick={() => setFirstReview(r.days)}
                >
                  {r.label}
                </span>
              ))}
            </div>
          </div>
          {error && <div className="modal-error">{error}</div>}
          <button className="modal-submit primary" onClick={handleSubmit} disabled={saving || !question.trim()}>
            {saving ? 'Adding…' : '+ Add Question'}
          </button>
        </div>
      </div>
    </div>
  );
}
