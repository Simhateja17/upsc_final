'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { dashboardService, spacedRepService } from '@/lib/services';
import DashboardPageHero from '@/components/DashboardPageHero';
import {
  SUBJECT_HEALTH,
  difficultyOptions,
  isSameLocalDate,
  resolveAccuracy,
  strengthMeta,
  subjectBg,
  subjectOptions,
  type SpacedRepItem,
} from './shared';

export default function SpacedRepetitionPage() {
  const [items, setItems] = useState<SpacedRepItem[]>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [subjectAccuracy, setSubjectAccuracy] = useState<Record<string, number>>({});
  const [showAddModal, setShowAddModal] = useState(false);

  // Modal state
  const [modalDeck, setModalDeck] = useState('polity');
  const [modalDifficulty, setModalDifficulty] = useState('Hard');
  const [modalQuestion, setModalQuestion] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    spacedRepService.getItems()
      .then((res) => {
        if (res.status === 'success') setItems(res.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;
    dashboardService.getStreak()
      .then((res) => {
        if (mounted && res?.data) setStreakDays(Number(res.data.currentStreak ?? 0));
      })
      .catch(() => {
        if (mounted) setStreakDays(0);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    dashboardService.getTestAnalytics()
      .then((res) => {
        const rows = res?.data?.subjectAccuracy;
        if (!mounted || !Array.isArray(rows)) return;
        const map: Record<string, number> = {};
        for (const row of rows) {
          if (row?.subject) map[String(row.subject).toLowerCase()] = Number(row.accuracy ?? 0);
        }
        setSubjectAccuracy(map);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const handleAddItem = () => {
    if (!modalQuestion.trim()) return;
    setSaving(true);
    const subjectLabel = subjectOptions.find((d) => d.id === modalDeck)?.label ?? modalDeck;
    spacedRepService.addItem({
      questionText: modalQuestion,
      subject: subjectLabel,
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

  // Hero subject-health stats from real data
  const heroStats = (() => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const overdue = items.filter((item) => new Date(item.nextReviewAt) < startOfToday).length;
    const scheduled = items.length;
    const dueToday = items.filter((item) => {
      const reviewAt = new Date(item.nextReviewAt);
      return isSameLocalDate(reviewAt, now) || (reviewAt >= startOfToday && reviewAt <= endOfToday);
    }).length;

    return [
      { value: overdue, label: 'OVERDUE', valueColor: '#F5A623' },
      { value: scheduled, label: 'SCHEDULED', valueColor: '#FF7070' },
      { value: dueToday, label: 'DUE TODAY', valueColor: '#FFFFFF' },
      { value: streakDays, label: 'DAYS STREAK', valueColor: '#0E8A56' },
    ];
  })();

  // Count of pending questions per subject (shown on each card).
  const subjectCounts = (() => {
    const counts: Record<string, number> = {};
    for (const item of items) counts[item.subject] = (counts[item.subject] ?? 0) + 1;
    return counts;
  })();

  return (
    <div className="flex overflow-hidden font-arimo" style={{ background: '#F9FAFB', height: '100%' }}>
      <div className="flex-1 overflow-y-auto">
        <DashboardPageHero
          // eslint-disable-next-line @next/next/no-img-element
          badgeIcon={<img src="/sidebar-spaced-repetition.png" alt="spaced repetition" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />}
          badgeText="WEAK SUBJECT TRACKER - SPACED REPETITION"
          title={<>Close every <span style={{ fontStyle: 'italic', color: '#E8B84B' }}>gap</span> before exam day.</>}
          subtitle="Real-time subject health monitoring pinpoints exactly which topics need your attention and builds a smart revision plan by ranking gaps through:"
          stats={heroStats.map(s => ({ value: String(s.value), label: s.label, color: s.valueColor }))}
        />
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

          {/* Choose a Subject */}
          <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                style={{ background: '#101828', fontFamily: 'Inter', fontWeight: 600, fontSize: 14, lineHeight: '20px', color: '#FFFFFF' }}
              >
                1
              </div>
              <h2 style={{ fontFamily: 'Georgia', fontWeight: 700, fontSize: 36, lineHeight: '40px', color: '#101828' }}>
                Choose a <span style={{ fontStyle: 'italic', color: '#E8B84B' }}>Subject</span>
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 rounded-[10px] px-5 py-2.5"
              style={{
                background: 'linear-gradient(90deg, #F0AE00 0%, #FE6D00 100%)',
                boxShadow: '0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1)',
                fontFamily: 'Inter', fontWeight: 700, fontSize: 14, lineHeight: '20px', color: '#FFFFFF',
              }}
            >
              <span>+</span> Add Question
            </button>
          </div>
          <p
            className="mb-6"
            style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 14, lineHeight: '20px', color: '#6A7282' }}
          >
            Pick the subject you want to revise today
          </p>

          <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SUBJECT_HEALTH.map((s) => {
              const acc = resolveAccuracy(subjectAccuracy, s);
              const meta = strengthMeta(acc);
              const barWidth = acc <= 0 ? 0 : Math.max(acc, 6);
              const pending = subjectCounts[s.label] ?? 0;
              return (
                <Link
                  key={s.id}
                  href={`/dashboard/spaced-repetition/${s.id}`}
                  className="flex flex-col rounded-[16px] border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
                  style={{ border: `1.5px solid ${s.border}`, background: subjectBg(s.label), height: 190 }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span aria-hidden style={{ fontSize: 22, lineHeight: '22px' }}>{s.icon}</span>
                    {pending > 0 && (
                      <span
                        className="rounded-full px-2 py-0.5"
                        style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 10, lineHeight: '14px', background: 'rgba(255,255,255,0.7)', color: '#4A5565' }}
                      >
                        {pending} to revisit
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 16, lineHeight: '20px', color: '#22304D' }}>
                    {s.shortLabel ?? s.label}
                  </h3>
                  <p className="mt-1" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 12, lineHeight: '16px', color: '#6A7282' }}>
                    {acc > 0 ? `${acc}% ${meta.word}` : 'No data yet'}
                  </p>
                  <div className="mt-4 h-[4px] w-full rounded-full" style={{ background: 'rgba(0,0,0,0.06)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${barWidth}%`, background: s.bar }} />
                  </div>
                  <p className="mt-2" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 11, lineHeight: '14px', color: meta.color }}>
                    {meta.status}
                  </p>
                </Link>
              );
            })}
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
