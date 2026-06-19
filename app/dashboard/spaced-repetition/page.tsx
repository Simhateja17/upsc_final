'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { dashboardService, spacedRepService } from '@/lib/services';
import DashboardPageHero from '@/components/DashboardPageHero';
import { EntitlementGate, UpgradePrompt } from '@/components/entitlements';
import { useEntitlements } from '@/contexts/EntitlementsContext';
import {
  MODAL_SUBJECTS,
  MODAL_SCHEDULE_OPTIONS,
  MODAL_TYPE_OPTIONS,
  SUBJECT_HEALTH,
  isSameLocalDate,
  resolveAccuracy,
  scheduleToDays,
  sourceTypeToLabel,
  strengthMeta,
  subjectBg,
  subjectOptions,
  type ModalScheduleId,
  type SpacedRepItem,
} from './shared';

export default function SpacedRepetitionPage() {
  const entitlements = useEntitlements();
  const [items, setItems] = useState<SpacedRepItem[]>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [subjectAccuracy, setSubjectAccuracy] = useState<Record<string, number>>({});
  const [showAddModal, setShowAddModal] = useState(false);

  // Modal state
  const [modalDeck, setModalDeck] = useState('polity');
  const [modalSourceType, setModalSourceType] = useState('custom');
  const [modalQuestion, setModalQuestion] = useState('');
  const [modalAnswer, setModalAnswer] = useState('');
  const [modalSchedule, setModalSchedule] = useState<ModalScheduleId>('3days');
  const [modalCustomDays, setModalCustomDays] = useState('');
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
      answer: modalAnswer || undefined,
      subject: subjectLabel,
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
    <EntitlementGate
      accessKey="spaced_repetition"
      allowed={['full', 'limited']}
      requiredTier="aspire"
      title="Spaced Repetition starts on Aspire"
      message="Free users can preview other revision tools. Aspire unlocks a 2-question spaced-repetition preview; Rise unlocks the full system."
    >
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
          {entitlements.isLimited('spaced_repetition') && (
            <div className="mb-6">
              <UpgradePrompt
                title="Aspire preview: 2 spaced-repetition questions"
                currentTier={entitlements.tier}
                requiredTier="rise"
                message="Upgrade to Rise to add unlimited weak-area questions and unlock the full revision queue."
              />
            </div>
          )}

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
              disabled={entitlements.isLimited('spaced_repetition')}
              className="flex items-center gap-2 rounded-[10px] px-5 py-2.5"
              style={{
                background: 'linear-gradient(90deg, #F0AE00 0%, #FE6D00 100%)',
                opacity: entitlements.isLimited('spaced_repetition') ? 0.55 : 1,
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

          <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
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
                  style={{ border: `1px solid ${s.border}`, background: subjectBg(s.label), height: 190 }}
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
          className="fixed inset-0 z-50 overflow-y-auto"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => setShowAddModal(false)}
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
                onClick={() => setShowAddModal(false)}
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
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
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
    </EntitlementGate>
  );
}
