'use client';

import React, { useEffect, useState } from 'react';

const ICON_OPTIONS = [
  '⚖️', '📜', '🌍', '🗺️', '📊', '🌿',
  '🔬', '🧪', '🧬', '🪐', '💻', '🧮',
  '📰', '🧭', '🤝', '🏛️', '🛡️', '✍️',
  '📚', '🎨', '🎵', '🎭', '🏺', '🗣️',
];

const TINT_OPTIONS = [
  '#FECACA', '#FED7AA', '#FDE68A', '#FEF08A', '#D9F99D', '#BBF7D0', '#99F6E4', '#A5F3FC',
  '#BAE6FD', '#BFDBFE', '#C7D2FE', '#DDD6FE', '#E9D5FF', '#F5D0FE', '#FBCFE8', '#FECDD3',
];

const DEFAULT_ICON = '📚';
const DEFAULT_TINT = '#BAE6FD';

export type NewSubject = { name: string; icon: string; tint: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (subject: NewSubject) => void;
};

export default function AddSubjectModal({ open, onClose, onCreate }: Props) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(DEFAULT_ICON);
  const [tint, setTint] = useState(DEFAULT_TINT);

  useEffect(() => {
    if (open) {
      setName('');
      setIcon(DEFAULT_ICON);
      setTint(DEFAULT_TINT);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate({ name: trimmed, icon, tint });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(11,18,38,0.65)', backdropFilter: 'saturate(140%) blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[560px] rounded-3xl overflow-hidden bg-white"
        style={{ border: '1px solid #E9EAEE', boxShadow: '0 40px 100px -30px rgba(11,18,38,0.6)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="relative flex items-center justify-between px-6 py-5"
          style={{ background: '#0D1221', color: '#fff' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="grid h-9 w-9 place-items-center rounded-xl"
              style={{ background: 'linear-gradient(135deg, #F5B942, #E89A2B)' }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
            </div>
            <div>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 18, lineHeight: '22px', fontWeight: 700 }}>
                Add a Subject
              </h3>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Create a new bucket for your decks.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="z-20 grid h-9 w-9 place-items-center rounded-full"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form id="addSubjectForm" onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          {/* Subject name */}
          <div>
            <label
              className="mb-2 block uppercase"
              style={{ fontSize: 11, letterSpacing: '0.08em', color: '#62636A' }}
            >
              Subject name
            </label>
            <input
              name="name"
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ethics & Integrity"
              className="h-11 w-full rounded-xl border bg-white px-3 outline-none focus:ring-2 focus:ring-amber-400/40"
              style={{ borderColor: '#E9EAEE', fontSize: 15, color: '#111827' }}
            />
          </div>

          {/* Pick an icon */}
          <div>
            <label
              className="mb-2 block uppercase"
              style={{ fontSize: 11, letterSpacing: '0.08em', color: '#62636A' }}
            >
              Pick an icon
            </label>
            <div className="grid grid-cols-6 gap-2">
              {ICON_OPTIONS.map((opt) => {
                const selected = opt === icon;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setIcon(opt)}
                    title={opt}
                    className="flex h-11 items-center justify-center rounded-xl border text-xl transition hover:bg-amber-50"
                    style={{
                      borderColor: selected ? '#E89A2B' : '#E9EAEE',
                      background: selected ? '#FFF7E8' : '#fff',
                      boxShadow: selected ? '0 0 0 1px #E89A2B' : 'none',
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card tint */}
          <div>
            <label
              className="mb-2 block uppercase"
              style={{ fontSize: 11, letterSpacing: '0.08em', color: '#62636A' }}
            >
              Card tint
            </label>
            <div className="grid grid-cols-8 gap-2">
              {TINT_OPTIONS.map((opt) => {
                const selected = opt.toLowerCase() === tint.toLowerCase();
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setTint(opt)}
                    title={opt}
                    aria-label={`Tint ${opt}`}
                    className="h-10 rounded-xl border transition hover:scale-105"
                    style={{
                      background: opt,
                      borderColor: selected ? '#0D1221' : 'rgba(0,0,0,0.06)',
                      boxShadow: selected ? '0 0 0 2px #0D1221' : 'none',
                    }}
                  />
                );
              })}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 border-t px-6 py-4"
          style={{ borderColor: '#E9EAEE', background: '#fff' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl px-5 text-sm font-medium hover:bg-black/5"
            style={{ color: '#62636A' }}
          >
            Cancel
          </button>
          <button
            form="addSubjectForm"
            type="submit"
            disabled={!name.trim()}
            className="flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #F97316 0%, #F5B942 100%)',
              color: '#0D1221',
              boxShadow: '0 0 0 1px rgba(245,185,66,0.35), 0 10px 30px -10px rgba(245,185,66,0.35)',
            }}
          >
            <span>+</span> Create Subject
          </button>
        </div>
      </div>
    </div>
  );
}
