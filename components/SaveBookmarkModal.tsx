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

const TAB_TITLES: Record<string, string> = {
  editorial: 'Save an Article',
  mcq: 'Save an MCQ',
  'answer-writing': 'Save a Question',
  pyq: 'Save a PYQ',
  flashcard: 'Add a Flashcard',
  video: 'Save a Lecture',
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
      case 'editorial':
        if (!fields.title?.trim()) return setError('Title is required.');
        title = fields.title.trim();
        source = fields.source?.trim() || 'Current Affairs';
        sourceUrl = fields.sourceUrl?.trim() || undefined;
        tag = fields.category?.trim() || undefined;
        content = { summary: fields.summary?.trim() || '', tags: tag ? [tag] : [] };
        break;
      case 'mcq':
        if (!fields.questionText?.trim()) return setError('Question text is required.');
        title = fields.questionText.trim().slice(0, 140);
        source = 'Manual Save';
        tag = fields.category?.trim() || undefined;
        content = {
          questionText: fields.questionText.trim(),
          options: ['A', 'B', 'C', 'D'].map((label) => ({ id: label, label, text: fields[`option${label}`]?.trim() || '' })).filter((o) => o.text),
          correctOption: fields.correctOption?.trim() || undefined,
          difficulty: fields.difficulty?.trim() || undefined,
          category: fields.category?.trim() || undefined,
          status: 'new',
        };
        break;
      case 'answer-writing':
        if (!fields.questionText?.trim()) return setError('Question text is required.');
        title = fields.questionText.trim().slice(0, 140);
        source = 'Manual Save';
        content = {
          questionText: fields.questionText.trim(),
          gsPaper: fields.gsPaper?.trim() || undefined,
          marks: fields.marks?.trim() || undefined,
          type: fields.type?.trim() || undefined,
          tags: fields.tags?.trim() ? fields.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
          status: 'Not Attempted',
        };
        break;
      case 'pyq':
        if (!fields.questionText?.trim()) return setError('Question text is required.');
        title = fields.questionText.trim().slice(0, 140);
        source = 'Manual Save';
        content = {
          questionText: fields.questionText.trim(),
          year: fields.year?.trim() || undefined,
          paper: fields.paper?.trim() || 'Prelims',
          options: fields.paper === 'Mains'
            ? undefined
            : ['A', 'B', 'C', 'D'].map((label) => ({ id: label, label, text: fields[`option${label}`]?.trim() || '' })).filter((o) => o.text),
          keyPoints: fields.paper === 'Mains' && fields.keyPoints?.trim()
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
          mastery: 'new',
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
          watchStatus: 'Not Watched',
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
            <Field label="Title"><input value={fields.title || ''} onChange={set('title')} className="w-full rounded-[10px] px-4 py-3 border outline-none" style={inputStyle} placeholder="Article title" /></Field>
            <Field label="Source"><input value={fields.source || ''} onChange={set('source')} className="w-full rounded-[10px] px-4 py-3 border outline-none" style={inputStyle} placeholder="e.g. The Hindu" /></Field>
            <Field label="Source URL"><input value={fields.sourceUrl || ''} onChange={set('sourceUrl')} className="w-full rounded-[10px] px-4 py-3 border outline-none" style={inputStyle} placeholder="https://..." /></Field>
            <Field label="Category / Tag"><input value={fields.category || ''} onChange={set('category')} className="w-full rounded-[10px] px-4 py-3 border outline-none" style={inputStyle} placeholder="e.g. Polity" /></Field>
            <Field label="Summary"><textarea value={fields.summary || ''} onChange={set('summary')} rows={3} className="w-full rounded-[10px] px-4 py-3 border outline-none resize-y" style={inputStyle} placeholder="Short summary for revision" /></Field>
          </>
        );
      case 'mcq':
        return (
          <>
            <Field label="Question Text"><textarea value={fields.questionText || ''} onChange={set('questionText')} rows={3} className="w-full rounded-[10px] px-4 py-3 border outline-none resize-y" style={inputStyle} placeholder="Enter the question" /></Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Option A"><input value={fields.optionA || ''} onChange={set('optionA')} className="w-full rounded-[10px] px-4 py-3 border outline-none" style={inputStyle} /></Field>
              <Field label="Option B"><input value={fields.optionB || ''} onChange={set('optionB')} className="w-full rounded-[10px] px-4 py-3 border outline-none" style={inputStyle} /></Field>
              <Field label="Option C"><input value={fields.optionC || ''} onChange={set('optionC')} className="w-full rounded-[10px] px-4 py-3 border outline-none" style={inputStyle} /></Field>
              <Field label="Option D"><input value={fields.optionD || ''} onChange={set('optionD')} className="w-full rounded-[10px] px-4 py-3 border outline-none" style={inputStyle} /></Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Correct Option"><input value={fields.correctOption || ''} onChange={set('correctOption')} className="w-full rounded-[10px] px-4 py-3 border outline-none" style={inputStyle} placeholder="A / B / C / D" /></Field>
              <Field label="Difficulty"><input value={fields.difficulty || ''} onChange={set('difficulty')} className="w-full rounded-[10px] px-4 py-3 border outline-none" style={inputStyle} placeholder="Easy / Medium / Hard" /></Field>
              <Field label="GS Paper / Category"><input value={fields.category || ''} onChange={set('category')} className="w-full rounded-[10px] px-4 py-3 border outline-none" style={inputStyle} placeholder="e.g. GS1" /></Field>
            </div>
          </>
        );
      case 'answer-writing':
        return (
          <>
            <Field label="Question Text"><textarea value={fields.questionText || ''} onChange={set('questionText')} rows={3} className="w-full rounded-[10px] px-4 py-3 border outline-none resize-y" style={inputStyle} placeholder="Enter the question" /></Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="GS Paper"><input value={fields.gsPaper || ''} onChange={set('gsPaper')} className="w-full rounded-[10px] px-4 py-3 border outline-none" style={inputStyle} placeholder="e.g. GS2" /></Field>
              <Field label="Marks"><input value={fields.marks || ''} onChange={set('marks')} className="w-full rounded-[10px] px-4 py-3 border outline-none" style={inputStyle} placeholder="e.g. 15" /></Field>
              <Field label="Type"><input value={fields.type || ''} onChange={set('type')} className="w-full rounded-[10px] px-4 py-3 border outline-none" style={inputStyle} placeholder="e.g. Analytical" /></Field>
            </div>
            <Field label="Tags (comma-separated)"><input value={fields.tags || ''} onChange={set('tags')} className="w-full rounded-[10px] px-4 py-3 border outline-none" style={inputStyle} placeholder="e.g. Polity, Ethics" /></Field>
          </>
        );
      case 'pyq':
        return (
          <>
            <Field label="Question Text"><textarea value={fields.questionText || ''} onChange={set('questionText')} rows={3} className="w-full rounded-[10px] px-4 py-3 border outline-none resize-y" style={inputStyle} placeholder="Enter the question" /></Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Year"><input value={fields.year || ''} onChange={set('year')} className="w-full rounded-[10px] px-4 py-3 border outline-none" style={inputStyle} placeholder="e.g. 2023" /></Field>
              <Field label="Paper">
                <select value={fields.paper || 'Prelims'} onChange={set('paper')} className="w-full rounded-[10px] px-4 py-2.5 border outline-none" style={inputStyle}>
                  <option value="Prelims">Prelims</option>
                  <option value="Mains">Mains</option>
                </select>
              </Field>
            </div>
            {fields.paper === 'Mains' ? (
              <Field label="Key Points (one per line)"><textarea value={fields.keyPoints || ''} onChange={set('keyPoints')} rows={3} className="w-full rounded-[10px] px-4 py-3 border outline-none resize-y" style={inputStyle} placeholder="Key point 1&#10;Key point 2" /></Field>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Option A"><input value={fields.optionA || ''} onChange={set('optionA')} className="w-full rounded-[10px] px-4 py-3 border outline-none" style={inputStyle} /></Field>
                <Field label="Option B"><input value={fields.optionB || ''} onChange={set('optionB')} className="w-full rounded-[10px] px-4 py-3 border outline-none" style={inputStyle} /></Field>
                <Field label="Option C"><input value={fields.optionC || ''} onChange={set('optionC')} className="w-full rounded-[10px] px-4 py-3 border outline-none" style={inputStyle} /></Field>
                <Field label="Option D"><input value={fields.optionD || ''} onChange={set('optionD')} className="w-full rounded-[10px] px-4 py-3 border outline-none" style={inputStyle} /></Field>
              </div>
            )}
          </>
        );
      case 'flashcard':
        return (
          <>
            <Field label="Front"><textarea value={fields.front || ''} onChange={set('front')} rows={2} className="w-full rounded-[10px] px-4 py-3 border outline-none resize-y" style={inputStyle} placeholder="Question / prompt" /></Field>
            <Field label="Back"><textarea value={fields.back || ''} onChange={set('back')} rows={3} className="w-full rounded-[10px] px-4 py-3 border outline-none resize-y" style={inputStyle} placeholder="Answer" /></Field>
            <Field label="Deck"><input value={fields.deck || ''} onChange={set('deck')} className="w-full rounded-[10px] px-4 py-3 border outline-none" style={inputStyle} placeholder="e.g. Polity" /></Field>
          </>
        );
      case 'video':
        return (
          <>
            <Field label="Title"><input value={fields.title || ''} onChange={set('title')} className="w-full rounded-[10px] px-4 py-3 border outline-none" style={inputStyle} placeholder="Lecture title" /></Field>
            <Field label="Video URL"><input value={fields.sourceUrl || ''} onChange={set('sourceUrl')} className="w-full rounded-[10px] px-4 py-3 border outline-none" style={inputStyle} placeholder="https://..." /></Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Duration"><input value={fields.duration || ''} onChange={set('duration')} className="w-full rounded-[10px] px-4 py-3 border outline-none" style={inputStyle} placeholder="e.g. 24:10" /></Field>
              <Field label="Subject"><input value={fields.subject || ''} onChange={set('subject')} className="w-full rounded-[10px] px-4 py-3 border outline-none" style={inputStyle} placeholder="e.g. Economy" /></Field>
              <Field label="Instructor"><input value={fields.instructor || ''} onChange={set('instructor')} className="w-full rounded-[10px] px-4 py-3 border outline-none" style={inputStyle} placeholder="e.g. Vikas Sir" /></Field>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="rounded-[16px] bg-white w-full max-w-[640px] max-h-[90vh] overflow-y-auto shadow-xl" style={{ padding: '32px' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-8">
          <h2 style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 24, lineHeight: '32px', color: '#101828' }}>
            {TAB_TITLES[entityType] || 'Save Item'}
          </h2>
          <button type="button" onClick={onClose} className="w-6 h-6 rounded-lg flex items-center justify-center text-xl font-bold" style={{ background: '#F3F4F6', color: '#364153' }} aria-label="Close">×</button>
        </div>

        <div className="space-y-5 mb-6">
          {renderFields()}
        </div>

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-[10px] px-5 py-2.5 border disabled:opacity-50" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 14, color: '#364153', background: '#FFFFFF', border: '0.8px solid #D1D5DC' }}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving} className="rounded-[10px] px-5 py-2.5 disabled:opacity-50" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 14, color: '#FFFFFF', background: '#101828' }}>
            {saving ? 'Saving...' : 'Save'}
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
