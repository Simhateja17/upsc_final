'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { dashboardService, spacedRepService } from '@/lib/services';
import DashboardPageHero from '@/components/DashboardPageHero';
import { EntitlementGate, UpgradePrompt } from '@/components/entitlements';
import { useEntitlements } from '@/contexts/EntitlementsContext';
import SpacedRepStyles from './referenceStyles';
import AddQuestionModal, { type AddQuestionPayload } from './AddQuestionModal';
import {
  SUBJECT_HEALTH,
  isSameLocalDate,
  resolveAccuracy,
  sourceTypeToLabel,
  strengthMeta,
  subjectOptions,
  type SpacedRepItem,
} from './shared';

// Per-subject card tint + accent colour, matching the reference layout exactly.
const CARD_STYLE: Record<string, { tint: string; accent: string }> = {
  polity: { tint: 'tint-yellow', accent: 'var(--orange)' },
  geography: { tint: 'tint-green', accent: 'var(--green)' },
  history: { tint: 'tint-peach', accent: 'var(--orange)' },
  economy: { tint: 'tint-yellow', accent: 'var(--gold)' },
  'environment-ecology': { tint: 'tint-mint', accent: 'var(--green)' },
  'science-technology': { tint: 'tint-peach', accent: 'var(--orange)' },
  'current-affairs': { tint: 'tint-rose', accent: 'var(--red)' },
  ethics: { tint: 'tint-yellow', accent: 'var(--gold)' },
};

export default function SpacedRepetitionPage() {
  const entitlements = useEntitlements();
  const isLimited = entitlements.isLimited('spaced_repetition');
  const [items, setItems] = useState<SpacedRepItem[]>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [subjectAccuracy, setSubjectAccuracy] = useState<Record<string, number>>({});
  const [showAddModal, setShowAddModal] = useState(false);

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

  const handleAddItem = async (payload: AddQuestionPayload): Promise<boolean> => {
    const subjectLabel = subjectOptions.find((d) => d.id === payload.subjectId)?.label
      ?? SUBJECT_HEALTH.find((s) => s.id === payload.subjectId)?.label
      ?? payload.subjectId;
    const res = await spacedRepService.addItem({
      questionText: payload.questionText,
      answer: payload.answer || undefined,
      subject: subjectLabel,
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
    <SpacedRepStyles />
    <div className="flex overflow-hidden" style={{ background: '#F9FAFB', height: '100%' }}>
      <div className="flex-1 overflow-y-auto">
        <DashboardPageHero
          // eslint-disable-next-line @next/next/no-img-element
          badgeIcon={<img src="/sidebar-spaced-repetition.png" alt="spaced repetition" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />}
          badgeText="WEAK SUBJECT TRACKER - SPACED REPETITION"
          title={<>Close every <span style={{ fontStyle: 'italic', color: '#E8B84B' }}>gap</span> before exam day.</>}
          subtitle="Smart spaced repetition that adapts to your memory. Review at the perfect moment, not too early, not too late."
          stats={heroStats.map(s => ({ value: String(s.value), label: s.label, color: s.valueColor }))}
        />

        {/* Everything below the blue hero — ported from the reference exactly. */}
        <div className="sr-scope">
          {isLimited && (
            <div className="subjects-section" style={{ paddingBottom: 0 }}>
              <UpgradePrompt
                title="Aspire preview: 2 spaced-repetition questions"
                currentTier={entitlements.tier}
                requiredTier="rise"
                message="Upgrade to Rise to add unlimited weak-area questions and unlock the full revision queue."
              />
            </div>
          )}

          {/* SECTION 1: SUBJECT CARDS */}
          <section className="subjects-section">
            <div className="subjects-header">
              <div className="left">
                <h2>Choose a <em>Subject</em></h2>
                <p>Pick the subject you want to revise today</p>
              </div>
              <button className="add-q-btn" onClick={() => setShowAddModal(true)} disabled={isLimited}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                Add Question
              </button>
            </div>
            <div className="subjects-grid">
              {SUBJECT_HEALTH.map((s) => {
                const style = CARD_STYLE[s.id] ?? { tint: 'tint-yellow', accent: 'var(--gold)' };
                const acc = resolveAccuracy(subjectAccuracy, s);
                const meta = strengthMeta(acc);
                const barWidth = acc <= 0 ? 0 : Math.max(acc, 6);
                const pending = subjectCounts[s.label] ?? 0;
                const showStrengthBadge = pending === 0 && acc > 0 && (acc >= 65 || (acc >= 50 && acc < 65));
                return (
                  <Link key={s.id} href={`/dashboard/spaced-repetition/${s.id}`} className={`subject-card ${style.tint}`}>
                    <div className="card-accent" style={{ background: style.accent }} />
                    {pending > 0 && <span className="s-badge warn">{pending} to revisit</span>}
                    {showStrengthBadge && (
                      <span className={`s-badge ${acc >= 65 ? 'good' : 'mid'}`}>
                        {acc >= 65 ? '✓ Excellent' : '⚡ Moderate'}
                      </span>
                    )}
                    <span className="s-icon">{s.icon}</span>
                    <h3>{s.shortLabel ?? s.label}</h3>
                    <div className="s-status">{acc > 0 ? `${acc}% ${meta.word}` : 'No data yet'}</div>
                    <div className="s-bar"><div className="s-bar-fill" style={{ width: `${barWidth}%`, background: style.accent }} /></div>
                    <div className="s-action">⊕ Start revising</div>
                    <span className="s-click-hint">Click to view →</span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* SECTION 2: SCIENCE BEHIND SPACED REPETITION */}
          <section className="schedule-section" style={{ padding: '16px 32px' }}>
            <div className="section-header" style={{ marginBottom: 16 }}>
              <div className="section-badge">🧠 The Science</div>
              <h2>The Science Behind <em>Spaced Repetition</em></h2>
              <p style={{ marginTop: 8, fontSize: 17, fontWeight: 500, color: 'var(--text)', lineHeight: 1.7, fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
                &ldquo;We forget 70% of what we learn within 24 hours unless we interrupt the curve at the right moment.&rdquo;
              </p>
            </div>

            <div className="intervals-explanation" style={{ marginBottom: 32 }}>
              <div style={{ maxWidth: 640, margin: '0 auto 28px', textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.7 }}>
                  Spaced repetition exploits this weakness of human memory. Instead of cramming and forgetting, it schedules your reviews at the exact moment your brain is about to let go, reinforcing the memory at its weakest point and locking it in for good.
                </p>
              </div>
              <div className="benefits-grid">
                <div className="benefit-card">
                  <div className="benefit-icon">🧠</div>
                  <h3>Long-term Retention</h3>
                  <p>Move knowledge from short-term to long-term memory through strategic review intervals.</p>
                </div>
                <div className="benefit-card">
                  <div className="benefit-icon">⚡</div>
                  <h3>Efficient Learning</h3>
                  <p>Focus your time on topics you&rsquo;re about to forget, not ones you already know well.</p>
                </div>
                <div className="benefit-card">
                  <div className="benefit-icon">📈</div>
                  <h3>Progressive Mastery</h3>
                  <p>Each successful review extends the interval, building confidence and mastery over time.</p>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: HOW INTERVALS WORK */}
          <IntervalsSection />

          {/* SECTION 4: NOTIFICATIONS */}
          <section className="schedule-section" style={{ paddingTop: 16, paddingBottom: 16 }}>
            <div className="notif-section">
              <div className="section-header">
                <div className="section-badge">🔔 Notification Preview</div>
                <h2>How <em>Notifications</em> Look</h2>
                <p>Clean, timely alerts that remind you exactly when to review. Nothing more.</p>
              </div>
              <div className="notif-cards-wrap">
                <div className="notif-preview daily">
                  <div className="np-time">8:00 AM · Daily Alert</div>
                  <div className="np-title">📚 Time to revise, 3 questions due today!</div>
                  <div className="np-desc">Polity · Geography · Ethics · <strong>Don&rsquo;t let the forgetting curve win!</strong></div>
                  <div className="np-action">Start Review →</div>
                </div>
                <div className="notif-preview overdue">
                  <div className="np-time">9:00 PM · Overdue Alert</div>
                  <div className="np-title">⚠️ Overdue: 2 questions need attention</div>
                  <div className="np-desc">Coriolis Force (2d overdue) · Lok Sabha vs Rajya Sabha (1d overdue)</div>
                  <div className="np-action">Review Now →</div>
                </div>
              </div>
              <div className="notif-helper">
                <div className="notif-helper-item"><span className="nh-icon">⏰</span> Missed a review? It shows as Overdue</div>
                <div className="notif-helper-item"><span className="nh-icon">🔔</span> Notifications alert you on your review days</div>
              </div>
            </div>
          </section>

          {/* CONNECTOR NOTE */}
          <div className="connector-note">
            <p className="cn-title">This is just a preview of what&rsquo;s possible.</p>
            <p className="cn-sub">
              Imagine having all your subjects organized, personalized review schedules that adapt to your memory, and timely notifications that keep you on track. No more forgetting, no more cramming, just smart revision that works with how your brain actually learns.
            </p>
          </div>

          {/* SECTION 5: CTA BANNER */}
          <section className="cta-section">
            <div className="cta-banner">
              <div className="cta-left">
                <div className="cta-text">
                  <h3>Ready to master your revision the smart way?</h3>
                  <p>Unlock unlimited spaced repetition questions, AI-powered scheduling, and priority review sessions. Everything you need to close every gap before exam day.</p>
                </div>
                <div className="cta-buttons">
                  <Link href="/dashboard/billing/plans" className="cta-btn-dark">Upgrade →</Link>
                  <Link href="/contact" className="cta-btn-light">Contact Us</Link>
                </div>
              </div>
              <div className="cta-rocket">🚀</div>
            </div>
          </section>
        </div>
      </div>

      <AddQuestionModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddItem}
      />
    </div>
    </EntitlementGate>
  );
}

// Timeline + retention curve, with the reference's scroll-reveal animations.
function IntervalsSection() {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    // Reveal once on mount (the reference uses IntersectionObserver; a simple
    // reveal keeps the same visual result without observer plumbing).
    const t = setTimeout(() => setRevealed(true), 100);
    return () => clearTimeout(t);
  }, []);

  const nodes = [
    { cls: 'day0', icon: '✏️', title: 'First Learn', day: 'Day 0', tag: 'Start' },
    { cls: 'day3', icon: '1️⃣', title: '1st Review', day: '→ Day 3', tag: 'Spacing' },
    { cls: 'day7', icon: '2️⃣', title: '2nd Review', day: '→ Day 7', tag: 'Reinforce' },
    { cls: 'day15', icon: '3️⃣', title: '3rd Review', day: '→ Day 15', tag: 'Deepen' },
    { cls: 'day30', icon: '🏆', title: 'Mastered!', day: '→ Long-term', tag: 'Locked In' },
  ];

  return (
    <section className="schedule-section" style={{ paddingTop: 16 }}>
      <div className="section-header" style={{ marginBottom: 32 }}>
        <div className="section-badge">📊 Your Spaced Repetition Timeline</div>
        <h2>How <em>Intervals</em> Work</h2>
        <p>Each review is spaced further apart, building stronger memory with every session.</p>
      </div>

      <div className="timeline-viz">
        <div className="timeline-track">
          {nodes.map((n, i) => (
            <React.Fragment key={n.cls}>
              <div className={`timeline-node ${n.cls}${revealed ? ' visible' : ''}`}>
                <div className="node-card">
                  <div className="node-icon">{n.icon}</div>
                  <h4>{n.title}</h4>
                  <div className="node-day">{n.day}</div>
                  <div className="node-subject">{n.tag}</div>
                </div>
              </div>
              {i < nodes.length - 1 && (
                <div className={`timeline-connector${revealed ? ' visible' : ''}`}>
                  <div className="conn-line" />
                  <div className="conn-arrow" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="schedule-legend">
        <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--gold)' }} />Day 0 Learn</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--orange)' }} />Day 3</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--orange-light)' }} />Day 7</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--red-light)' }} />Day 15</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--green)' }} />Day 30 Mastered</div>
      </div>

      <div className={`retention-curve${revealed ? ' visible' : ''}`}>
        <h3>Memory Retention Curve</h3>
        <p className="curve-sub">Each review strengthens your memory. Spacing them out builds lasting knowledge.</p>
        <svg className="curve-svg" viewBox="0 0 700 180" preserveAspectRatio="none">
          <line x1="0" y1="45" x2="700" y2="45" stroke="#f3f4f6" strokeWidth="1" />
          <line x1="0" y1="90" x2="700" y2="90" stroke="#f3f4f6" strokeWidth="1" />
          <line x1="0" y1="135" x2="700" y2="135" stroke="#f3f4f6" strokeWidth="1" />
          <text x="4" y="42" fill="#9ca3af" fontSize="10" fontFamily="DM Sans">100%</text>
          <text x="4" y="88" fill="#9ca3af" fontSize="10" fontFamily="DM Sans">50%</text>
          <text x="4" y="133" fill="#9ca3af" fontSize="10" fontFamily="DM Sans">0%</text>
          <path className="draw-line" d="M50,30 C150,35 250,100 400,140 S600,165 680,170" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="6,4" opacity=".5" />
          <text x="590" y="165" fill="#ef4444" fontSize="10" fontFamily="DM Sans" opacity=".7">Without review</text>
          <path className="draw-line" d="M50,30 C100,50 130,80 160,55 C190,75 230,95 260,50 C290,70 340,88 370,40 C400,58 450,75 480,35 C510,50 560,65 590,30 C620,42 660,50 680,25" fill="none" stroke="#10b981" strokeWidth="2.5" />
          <circle cx="160" cy="55" r="5" fill="#10b981" opacity=".3" /><circle cx="160" cy="55" r="3" fill="#10b981" />
          <text x="148" y="75" fill="#10b981" fontSize="9" fontFamily="DM Sans" fontWeight="600">Review</text>
          <circle cx="260" cy="50" r="5" fill="#10b981" opacity=".3" /><circle cx="260" cy="50" r="3" fill="#10b981" />
          <circle cx="370" cy="40" r="5" fill="#10b981" opacity=".3" /><circle cx="370" cy="40" r="3" fill="#10b981" />
          <circle cx="480" cy="35" r="5" fill="#10b981" opacity=".3" /><circle cx="480" cy="35" r="3" fill="#10b981" />
          <circle cx="590" cy="30" r="5" fill="#10b981" opacity=".3" /><circle cx="590" cy="30" r="3" fill="#10b981" />
          <text x="340" y="178" fill="#9ca3af" fontSize="10" fontFamily="DM Sans" textAnchor="middle">Days →</text>
        </svg>
        <div className="retention-info">
          <p><strong>The green curve shows spaced repetition in action.</strong> Each review (marked by dots) resets your forgetting curve, but at a higher retention level. The red dashed curve shows what happens without reviews, rapid forgetting. The spacing effect means you retain more by reviewing less frequently but at strategic intervals.</p>
        </div>
      </div>
    </section>
  );
}
