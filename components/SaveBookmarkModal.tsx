'use client';

import { useState, useEffect } from 'react';
import { bookmarkService } from '@/lib/services';

const inputShadow = '0px 1px 3px 0px rgba(0,0,0,0.4), 0px 1px 2px -1px rgba(0,0,0,0.4)';
const inputStyle = {
  fontFamily: 'Inter',
  fontWeight: 400,
  fontSize: 14,
  lineHeight: '20px',
  background: '#FFFFFF',
  border: '0.8px solid #E5E7EB',
  boxShadow: inputShadow,
  color: '#101828',
} as const;

const labelClass = 'block uppercase tracking-[0.3px]';
const labelStyle = { fontFamily: 'Inter', fontWeight: 600, fontSize: 12, lineHeight: '16px', color: '#4A5565' } as const;
const inputClass = 'w-full rounded-[10px] px-4 py-3 border outline-none';
const selectClass = 'w-full rounded-[10px] px-4 py-2.5 border outline-none appearance-auto';

const TAB_ICONS: Record<string, string> = {
  editorial: '📰',
  mcq: '🎯',
  'answer-writing': '✍️',
  pyq: '📚',
  flashcard: '🗂️',
  video: '🎬',
};

const TAB_TITLES: Record<string, string> = {
  editorial: 'Save an Article',
  mcq: 'Save an MCQ',
  'answer-writing': 'Save a Question',
  pyq: 'Save a PYQ',
  flashcard: 'Add a Flashcard',
  video: 'Save a Lecture',
};

const TAB_SUBTITLES: Record<string, string> = {
  editorial: 'Tag it, add Mains angles, track your reading',
  mcq: 'Bookmark this question for later practice',
  'answer-writing': 'Bookmark this answer writing question with your notes',
  pyq: 'Bookmark previous year questions with your answers',
  flashcard: 'Quick revision card with front and back',
  video: 'Bookmark video lectures and track your watch progress',
};

const SUBMIT_LABELS: Record<string, string> = {
  editorial: 'Save Article',
  mcq: 'Save MCQ',
  'answer-writing': 'Save Question',
  pyq: 'Save PYQ',
  flashcard: 'Save Flashcard',
  video: 'Save Lecture',
};

type Props = {
  open: boolean;
  entityType: string;
  onClose: () => void;
  onSaved: () => void;
};

export default function SaveBookmarkModal({ open, entityType, onClose, onSaved }: Props) {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setFields({});
      setError('');
    }
  }, [open, entityType]);

  if (!open) return null;

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setFields((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = async () => {
    setError('');

    let title = '';
    let source = '';
    let sourceUrl: string | undefined;
    let tag: string | undefined;
    let content: any = {};

    switch (entityType) {
      case 'editorial': {
        if (!fields.title?.trim()) return setError('Title is required.');
        const topics = fields.topics?.trim() ? fields.topics.split(',').map((t) => t.trim()).filter(Boolean) : [];
        title = fields.title.trim();
        source = fields.source?.trim() || 'Current Affairs';
        sourceUrl = fields.sourceUrl?.trim() || undefined;
        tag = topics[0];
        content = {
          summary: fields.summary?.trim() || '',
          tags: topics,
          gsPaper: fields.gsPaper?.trim() || undefined,
          relevance: fields.relevance?.trim() || undefined,
          status: fields.status?.trim() || 'Unread',
        };
        break;
      }
      case 'mcq':
        if (!fields.questionText?.trim()) return setError('Question text is required.');
        title = fields.questionText.trim().slice(0, 140);
        source = fields.source?.trim() || 'Manual Save';
        tag = fields.category?.trim() || undefined;
        content = {
          questionText: fields.questionText.trim(),
          options: ['A', 'B', 'C', 'D'].map((label) => ({ id: label, label, text: fields[`option${label}`]?.trim() || '' })).filter((o) => o.text),
          correctOption: fields.correctOption?.trim() || undefined,
          difficulty: fields.difficulty?.trim() || undefined,
          category: fields.category?.trim() || undefined,
          explanation: fields.explanation?.trim() || undefined,
          status: fields.status?.trim() || 'New',
        };
        break;
      case 'answer-writing':
        if (!fields.questionText?.trim()) return setError('Question text is required.');
        title = fields.questionText.trim().slice(0, 140);
        source = fields.source?.trim() || 'Manual Save';
        content = {
          questionText: fields.questionText.trim(),
          gsPaper: fields.gsPaper?.trim() || undefined,
          wordLimit: fields.wordLimit?.trim() || undefined,
          tags: fields.tags?.trim() ? fields.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
          keyPoints: fields.keyPoints?.trim() ? fields.keyPoints.split('\n').map((t) => t.trim()).filter(Boolean) : [],
          status: fields.status?.trim() || 'Not Attempted',
        };
        break;
      case 'pyq':
        if (!fields.questionText?.trim()) return setError('Question text is required.');
        title = fields.questionText.trim().slice(0, 140);
        source = fields.source?.trim() || 'Manual Save';
        content = {
          questionText: fields.questionText.trim(),
          year: fields.year?.trim() || undefined,
          paper: fields.paper?.trim() || 'Prelims',
          gsPaper: fields.gsPaper?.trim() || undefined,
          tags: fields.tags?.trim() ? fields.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
          status: fields.status?.trim() || 'New',
          options: fields.paper === 'Mains'
            ? undefined
            : ['A', 'B', 'C', 'D'].map((label) => ({ id: label, label, text: fields[`option${label}`]?.trim() || '' })).filter((o) => o.text),
          keyPoints: fields.keyPoints?.trim()
            ? fields.keyPoints.split('\n').map((t) => t.trim()).filter(Boolean)
            : undefined,
        };
        break;
      case 'flashcard':
        if (!fields.front?.trim() || !fields.back?.trim()) return setError('Front and back are required.');
        title = fields.front.trim().slice(0, 140);
        source = 'Manual Save';
        content = {
          front: fields.front.trim(),
          back: fields.back.trim(),
          deck: fields.deck?.trim() || undefined,
          mastery: fields.mastery?.trim() || 'New',
        };
        break;
      case 'video':
        if (!fields.title?.trim()) return setError('Title is required.');
        title = fields.title.trim();
        source = fields.instructor?.trim() || 'Video Lectures';
        sourceUrl = fields.sourceUrl?.trim() || undefined;
        content = {
          duration: fields.duration?.trim() || undefined,
          subject: fields.subject?.trim() || undefined,
          instructor: fields.instructor?.trim() || undefined,
          watchStatus: fields.watchStatus?.trim() || 'Not Watched',
          notes: fields.notes?.trim() || undefined,
        };
        break;
      default:
        return;
    }

    setSaving(true);
    try {
      const entityId = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await bookmarkService.toggle({ entityType, entityId, title, source, sourceUrl, tag, content });
      onSaved();
      onClose();
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderFields = () => {
    switch (entityType) {
      case 'editorial':
        return (
          <>
            <Field label="Headline / Title"><input value={fields.title || ''} onChange={set('title')} className={inputClass} style={inputStyle} placeholder="Article headline…" /></Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Source"><input value={fields.source || ''} onChange={set('source')} className={inputClass} style={inputStyle} placeholder="e.g. The Hindu" /></Field>
              <Field label="GS Paper"><input value={fields.gsPaper || ''} onChange={set('gsPaper')} className={inputClass} style={inputStyle} placeholder="e.g. GS3" /></Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Relevance">
                <select value={fields.relevance || 'Prelims + Mains'} onChange={set('relevance')} className={selectClass} style={inputStyle}>
                  <option value="Prelims">Prelims</option>
                  <option value="Mains">Mains</option>
                  <option value="Prelims + Mains">Prelims + Mains</option>
                </select>
              </Field>
              <Field label="Status">
                <select value={fields.status || 'Unread'} onChange={set('status')} className={selectClass} style={inputStyle}>
                  <option value="Unread">Unread</option>
                  <option value="Read">Read</option>
                  <option value="For Revision">For Revision</option>
                </select>
              </Field>
            </div>
            <Field label="URL"><input value={fields.sourceUrl || ''} onChange={set('sourceUrl')} className={inputClass} style={inputStyle} placeholder="https://…" /></Field>
            <Field label="Key Points / Summary"><textarea value={fields.summary || ''} onChange={set('summary')} rows={3} className={`${inputClass} resize-y`} style={inputStyle} placeholder="What are the key takeaways?" /></Field>
            <Field label="UPSC Topics (comma separated)"><input value={fields.topics || ''} onChange={set('topics')} className={inputClass} style={inputStyle} placeholder="e.g. federalism, judiciary" /></Field>
          </>
        );
      case 'mcq':
        return (
          <>
            <Field label="Question Text"><textarea value={fields.questionText || ''} onChange={set('questionText')} rows={3} className={`${inputClass} resize-y`} style={inputStyle} placeholder="Enter the question" /></Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Option A"><input value={fields.optionA || ''} onChange={set('optionA')} className={inputClass} style={inputStyle} /></Field>
              <Field label="Option B"><input value={fields.optionB || ''} onChange={set('optionB')} className={inputClass} style={inputStyle} /></Field>
              <Field label="Option C"><input value={fields.optionC || ''} onChange={set('optionC')} className={inputClass} style={inputStyle} /></Field>
              <Field label="Option D"><input value={fields.optionD || ''} onChange={set('optionD')} className={inputClass} style={inputStyle} /></Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Correct Answer"><input value={fields.correctOption || ''} onChange={set('correctOption')} className={inputClass} style={inputStyle} placeholder="A / B / C / D" /></Field>
              <Field label="Difficulty">
                <select value={fields.difficulty || 'Medium'} onChange={set('difficulty')} className={selectClass} style={inputStyle}>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="GS Paper"><input value={fields.category || ''} onChange={set('category')} className={inputClass} style={inputStyle} placeholder="e.g. GS3" /></Field>
              <Field label="Source"><input value={fields.source || ''} onChange={set('source')} className={inputClass} style={inputStyle} placeholder="e.g. UPSC 2023" /></Field>
            </div>
            <Field label="Explanation"><textarea value={fields.explanation || ''} onChange={set('explanation')} rows={2} className={`${inputClass} resize-y`} style={inputStyle} placeholder="Why is this the correct answer?" /></Field>
            <Field label="My Attempt">
              <select value={fields.status || 'New'} onChange={set('status')} className={selectClass} style={inputStyle}>
                <option value="New">New</option>
                <option value="Attempted">Attempted</option>
                <option value="Got Wrong">Got Wrong</option>
              </select>
            </Field>
          </>
        );
      case 'answer-writing':
        return (
          <>
            <Field label="Question Text"><textarea value={fields.questionText || ''} onChange={set('questionText')} rows={3} className={`${inputClass} resize-y`} style={inputStyle} placeholder="Enter the question" /></Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Word Limit"><input value={fields.wordLimit || ''} onChange={set('wordLimit')} className={inputClass} style={inputStyle} placeholder="e.g. 250 words (15 marks)" /></Field>
              <Field label="GS Paper"><input value={fields.gsPaper || ''} onChange={set('gsPaper')} className={inputClass} style={inputStyle} placeholder="e.g. GS3" /></Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Year / Source"><input value={fields.source || ''} onChange={set('source')} className={inputClass} style={inputStyle} placeholder="e.g. UPSC 2022" /></Field>
              <Field label="Status">
                <select value={fields.status || 'Not Attempted'} onChange={set('status')} className={selectClass} style={inputStyle}>
                  <option value="Not Attempted">Not Attempted</option>
                  <option value="Draft">Draft</option>
                  <option value="Submitted">Submitted</option>
                </select>
              </Field>
            </div>
            <Field label="Key Points / Outline"><textarea value={fields.keyPoints || ''} onChange={set('keyPoints')} rows={3} className={`${inputClass} resize-y`} style={inputStyle} placeholder="Introduction points, key arguments…" /></Field>
            <Field label="UPSC Topics (comma separated)"><input value={fields.tags || ''} onChange={set('tags')} className={inputClass} style={inputStyle} placeholder="e.g. federalism, governance, rights" /></Field>
          </>
        );
      case 'pyq':
        return (
          <>
            <Field label="Question Text"><textarea value={fields.questionText || ''} onChange={set('questionText')} rows={3} className={`${inputClass} resize-y`} style={inputStyle} placeholder="Enter the question" /></Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Year"><input value={fields.year || ''} onChange={set('year')} className={inputClass} style={inputStyle} placeholder="e.g. 2023" /></Field>
              <Field label="Exam Type">
                <select value={fields.paper || 'Prelims'} onChange={set('paper')} className={selectClass} style={inputStyle}>
                  <option value="Prelims">Prelims</option>
                  <option value="Mains">Mains</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="GS Paper"><input value={fields.gsPaper || ''} onChange={set('gsPaper')} className={inputClass} style={inputStyle} placeholder="e.g. GS3" /></Field>
              <Field label="Status">
                <select value={fields.status || 'New'} onChange={set('status')} className={selectClass} style={inputStyle}>
                  <option value="New">New</option>
                  <option value="Attempted">Attempted</option>
                  <option value="Got Wrong">Got Wrong</option>
                </select>
              </Field>
            </div>
            {fields.paper === 'Mains' ? (
              <Field label="Model Answer / Key Points"><textarea value={fields.keyPoints || ''} onChange={set('keyPoints')} rows={3} className={`${inputClass} resize-y`} style={inputStyle} placeholder="Key point 1&#10;Key point 2" /></Field>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Option A"><input value={fields.optionA || ''} onChange={set('optionA')} className={inputClass} style={inputStyle} /></Field>
                <Field label="Option B"><input value={fields.optionB || ''} onChange={set('optionB')} className={inputClass} style={inputStyle} /></Field>
                <Field label="Option C"><input value={fields.optionC || ''} onChange={set('optionC')} className={inputClass} style={inputStyle} /></Field>
                <Field label="Option D"><input value={fields.optionD || ''} onChange={set('optionD')} className={inputClass} style={inputStyle} /></Field>
              </div>
            )}
            <Field label="UPSC Topics (comma separated)"><input value={fields.tags || ''} onChange={set('tags')} className={inputClass} style={inputStyle} placeholder="e.g. environment, governance" /></Field>
          </>
        );
      case 'flashcard':
        return (
          <>
            <Field label="Front (Concept / Term)"><textarea value={fields.front || ''} onChange={set('front')} rows={2} className={`${inputClass} resize-y`} style={inputStyle} placeholder="e.g. What is the difference between Fundamental Rights and Directive Principles?" /></Field>
            <Field label="Back (Answer / Explanation)"><textarea value={fields.back || ''} onChange={set('back')} rows={3} className={`${inputClass} resize-y`} style={inputStyle} placeholder="Key points, definition, or explanation…" /></Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Deck / Category"><input value={fields.deck || ''} onChange={set('deck')} className={inputClass} style={inputStyle} placeholder="e.g. Polity" /></Field>
              <Field label="Mastery">
                <select value={fields.mastery || 'New'} onChange={set('mastery')} className={selectClass} style={inputStyle}>
                  <option value="New">New</option>
                  <option value="Learning">Learning</option>
                  <option value="Mastered">Mastered</option>
                </select>
              </Field>
            </div>
          </>
        );
      case 'video':
        return (
          <>
            <Field label="Lecture Title"><input value={fields.title || ''} onChange={set('title')} className={inputClass} style={inputStyle} placeholder="e.g. India's Foreign Policy - Lecture 3" /></Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Educator / Channel"><input value={fields.instructor || ''} onChange={set('instructor')} className={inputClass} style={inputStyle} placeholder="e.g. RiseWithJeet, Jeet Sir" /></Field>
              <Field label="Duration"><input value={fields.duration || ''} onChange={set('duration')} className={inputClass} style={inputStyle} placeholder="e.g. 1h 24m" /></Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Subject"><input value={fields.subject || ''} onChange={set('subject')} className={inputClass} style={inputStyle} placeholder="e.g. Polity" /></Field>
              <Field label="Watch Status">
                <select value={fields.watchStatus || 'Not Watched'} onChange={set('watchStatus')} className={selectClass} style={inputStyle}>
                  <option value="Not Watched">Not Watched</option>
                  <option value="Watching">Watching</option>
                  <option value="Watched">Watched</option>
                </select>
              </Field>
            </div>
            <Field label="URL / Link"><input value={fields.sourceUrl || ''} onChange={set('sourceUrl')} className={inputClass} style={inputStyle} placeholder="https://youtube.com/…" /></Field>
            <Field label="Notes"><textarea value={fields.notes || ''} onChange={set('notes')} rows={3} className={`${inputClass} resize-y`} style={inputStyle} placeholder="Key concepts covered, timestamps to revisit…" /></Field>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="rounded-[16px] bg-white w-full max-w-[640px] max-h-[90vh] overflow-y-auto shadow-xl" style={{ padding: '32px' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-1">
          <h2 className="flex items-center gap-2.5" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 24, lineHeight: '32px', color: '#101828' }}>
            <span aria-hidden="true">{TAB_ICONS[entityType]}</span>
            {TAB_TITLES[entityType] || 'Save Item'}
          </h2>
          <button type="button" onClick={onClose} className="w-6 h-6 rounded-lg flex items-center justify-center text-xl font-bold flex-shrink-0" style={{ background: '#F3F4F6', color: '#364153' }} aria-label="Close">×</button>
        </div>
        <p className="mb-7 text-sm" style={{ fontFamily: 'Inter', color: '#8A97AE' }}>{TAB_SUBTITLES[entityType]}</p>

        <div className="space-y-5 mb-6">
          {renderFields()}
        </div>

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-[10px] px-5 py-2.5 border disabled:opacity-50" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 14, color: '#364153', background: '#FFFFFF', border: '0.8px solid #D1D5DC' }}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving} className="rounded-[10px] px-5 py-2.5 disabled:opacity-50" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 14, color: '#101828', background: '#E8B84B' }}>
            {saving ? 'Saving...' : `${SUBMIT_LABELS[entityType] || 'Save'} →`}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className={labelClass} style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}
