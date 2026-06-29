'use client';

import React, { useState, useEffect } from 'react';
import { flashcardService } from '@/lib/services';

const FLASHCARD_SUBJECT_OPTIONS = [
  'Polity',
  'History',
  'Geography',
  'Economy',
  'Environment & Ecology',
  'Science & Technology',
  'Current Affairs',
  'Society',
  'Governance',
  'International Relations',
  'Social Justice',
  'Agriculture',
  'Internal Security',
  'Disaster Management',
  'Ethics',
  'GS1',
  'GS2',
  'GS3',
  'GS4',
  'Essay',
  'Optional Paper 1',
  'Optional Paper 2',
 ] as const;

const SUBJECT_TO_ID: Record<string, string> = {
  'Polity': 'polity',
  'History': 'history',
  'Geography': 'geography',
  'Economy': 'economy',
  'Environment & Ecology': 'environment-ecology',
  'Science & Technology': 'science-technology',
  'Current Affairs': 'current-affairs',
  'Society': 'society',
  'Governance': 'governance',
  'International Relations': 'international-relations',
  'Social Justice': 'social-justice',
  'Agriculture': 'agriculture',
  'Internal Security': 'internal-security',
  'Disaster Management': 'disaster-management',
  'Ethics': 'ethics',
  'GS1': 'gs1',
  'GS2': 'gs2',
  'GS3': 'gs3',
  'GS4': 'gs4',
  'Essay': 'essay',
  'Optional Paper 1': 'optional-paper-1',
  'Optional Paper 2': 'optional-paper-2',
};

const inputShadow = '0px 1px 3px 0px rgba(0,0,0,0.4), 0px 1px 2px -1px rgba(0,0,0,0.4)';

type Props = {
  open: boolean;
  onClose: () => void;
  initialSubject?: string;
  initialDeck?: string;
  onCreated?: () => void;
};

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy', emoji: '😊' },
  { value: 'medium', label: 'Medium', emoji: '🤔' },
  { value: 'hard', label: 'Hard', emoji: '😣' },
] as const;

export default function CreateFlashcardModal({ open, onClose, initialSubject, initialDeck, onCreated }: Props) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [subject, setSubject] = useState(initialSubject || '');
  const [deck, setDeck] = useState(initialDeck || '');
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setSubject(initialSubject ?? '');
      setDeck(initialDeck ?? '');
      setDifficulty('medium');
      setError('');
    }
  }, [open, initialSubject, initialDeck]);

  if (!open) return null;

  const getSubjectId = () => {
    const name = deck || subject;
    return SUBJECT_TO_ID[name] ?? name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const doSave = async (): Promise<boolean> => {
    if (!question.trim() || !answer.trim()) {
      setError('Question and answer are required.');
      return false;
    }
    const subjectName = deck || subject;
    if (!subjectName) {
      setError('Please select a subject or deck.');
      return false;
    }
    setError('');
    setSaving(true);
    try {
      const res = await flashcardService.createCard({
        subjectId: getSubjectId(),
        subject: subjectName,
        question: question.trim(),
        answer: answer.trim(),
        difficulty,
      });
      if (res.status === 'success') {
        onCreated?.();
        return true;
      }
      setError('Failed to save card. Please try again.');
      return false;
    } catch {
      setError('Failed to save card. Please try again.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCard = async () => {
    const ok = await doSave();
    if (ok) onClose();
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'Inter',
    fontWeight: 600,
    fontSize: 12,
    lineHeight: '16px',
    color: '#4A5565',
  };

  const fieldStyle: React.CSSProperties = {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: 14,
    lineHeight: '20px',
    letterSpacing: 0,
    background: '#FFFFFF',
    border: '0.8px solid #E5E7EB',
    boxShadow: inputShadow,
    color: '#101828',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="rounded-[16px] bg-white w-full max-w-[513px] overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{ background: '#0B1220', padding: '20px 24px' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-[10px]"
              style={{
                width: 40,
                height: 40,
                background: 'linear-gradient(135deg, #F3A301 0%, #FD7201 100%)',
                fontSize: 20,
              }}
            >
              📝
            </div>
            <div>
              <h2
                style={{
                  fontFamily: 'Georgia, serif',
                  fontWeight: 700,
                  fontSize: 20,
                  lineHeight: '26px',
                  color: '#FFFFFF',
                }}
              >
                Create Flashcard
              </h2>
              <p
                style={{
                  fontFamily: 'Inter',
                  fontWeight: 400,
                  fontSize: 13,
                  lineHeight: '18px',
                  color: '#98A2B3',
                }}
              >
                Question on the front, answer on the back.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center rounded-full text-lg"
            style={{ width: 32, height: 32, background: '#1F2A3C', color: '#98A2B3' }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Question / Front */}
          <div className="space-y-2 mb-5">
            <label className="block uppercase tracking-[0.3px]" style={labelStyle}>
              Question / Front
            </label>
            <textarea
              placeholder="e.g. What is the significance of the 42nd Amendment Act (1976)?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              className="w-full rounded-[10px] px-4 py-3 border outline-none focus:ring-2 focus:ring-[#155DFC] focus:border-transparent resize-y placeholder:text-[#9CA3AF]"
              style={fieldStyle}
            />
          </div>

          {/* Answer / Back */}
          <div className="space-y-2 mb-5">
            <label className="block uppercase tracking-[0.3px]" style={labelStyle}>
              Answer / Back
            </label>
            <textarea
              placeholder="Write the answer, key points, or mnemonics..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={4}
              className="w-full rounded-[10px] px-4 py-3 border outline-none focus:ring-2 focus:ring-[#155DFC] focus:border-transparent resize-y placeholder:text-[#9CA3AF]"
              style={fieldStyle}
            />
          </div>

          {/* Subject & Topic/Deck side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div className="space-y-2">
              <label className="block uppercase tracking-[0.3px]" style={labelStyle}>
                Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-[10px] px-4 py-2.5 border outline-none focus:ring-2 focus:ring-[#155DFC] focus:border-transparent"
                style={fieldStyle}
              >
                <option value="">Select subject</option>
                {FLASHCARD_SUBJECT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block uppercase tracking-[0.3px]" style={labelStyle}>
                Topic / Deck
              </label>
              <select
                value={deck}
                onChange={(e) => setDeck(e.target.value)}
                className="w-full rounded-[10px] px-4 py-2.5 border outline-none focus:ring-2 focus:ring-[#155DFC] focus:border-transparent"
                style={fieldStyle}
              >
                <option value="">Select topic</option>
                {FLASHCARD_SUBJECT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Difficulty */}
          <div className="space-y-2 mb-6">
            <label className="block uppercase tracking-[0.3px]" style={labelStyle}>
              Difficulty
            </label>
            <div className="grid grid-cols-3 gap-3">
              {DIFFICULTY_OPTIONS.map((opt) => {
                const selected = difficulty === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDifficulty(opt.value)}
                    className="flex items-center justify-center gap-2 rounded-[10px] px-4 py-2.5"
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 600,
                      fontSize: 14,
                      lineHeight: '20px',
                      color: selected ? '#FFFFFF' : '#364153',
                      background: selected
                        ? 'linear-gradient(90deg, #F3A301 0%, #FD7201 100%)'
                        : '#FFFFFF',
                      border: selected ? 'none' : '0.8px solid #E5E7EB',
                      boxShadow: selected ? 'none' : inputShadow,
                    }}
                  >
                    <span>{opt.emoji}</span>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-[10px] px-5 py-2.5 disabled:opacity-50"
              style={{
                fontFamily: 'Inter',
                fontWeight: 500,
                fontSize: 14,
                lineHeight: '20px',
                color: '#364153',
                background: 'transparent',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveCard}
              disabled={saving}
              className="rounded-[10px] px-5 py-2.5 disabled:opacity-50"
              style={{
                fontFamily: 'Inter',
                fontWeight: 600,
                fontSize: 14,
                lineHeight: '20px',
                color: '#FFFFFF',
                background: '#101828',
              }}
            >
              {saving ? 'Saving...' : 'Save Card'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
