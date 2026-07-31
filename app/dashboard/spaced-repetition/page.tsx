'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { dashboardService, spacedRepService } from '@/lib/services';
import DashboardPageHero from '@/components/DashboardPageHero';
import { EntitlementGate } from '@/components/entitlements';
import { useEntitlements } from '@/contexts/EntitlementsContext';
import { ApiRequestError } from '@/lib/api';
import {
  SpacedRepOnboardingModal,
  SpacedRepAddSubjectUpgradeModal,
  SpacedRepLimitModal,
} from '@/components/upgrade/UpgradeModals';
import AddSubjectModal, { type NewSubject } from '@/components/AddSubjectModal';
import SpacedRepStyles from './referenceStyles';
import AddQuestionModal, { type AddQuestionPayload } from './AddQuestionModal';
import { getSubjectCardStyle, getSubjectMetaStyle } from '@/lib/subjectPalette';
import SubjectChoiceCard, { SubjectChoiceCardStyles } from '@/components/SubjectChoiceCard';
import {
  SUBJECT_HEALTH,
  isSameLocalDate,
  sourceTypeToLabel,
  subjectOptions,
  type SpacedRepItem,
} from './shared';

export default function SpacedRepetitionPage() {
  const entitlements = useEntitlements();
  const isLimited = entitlements.isLimited('spaced_repetition');
  const [items, setItems] = useState<SpacedRepItem[]>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showAddSubjectUpgradeModal, setShowAddSubjectUpgradeModal] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [customSubjects, setCustomSubjects] = useState<NewSubject[]>([]);

  const FREE_QUESTION_LIMIT = 5;
  const questionLimitReached = isLimited && items.length >= FREE_QUESTION_LIMIT;

  // Onboarding popup greets every visit to the module (all plans).
  useEffect(() => {
    setShowOnboardingModal(true);
  }, []);

  const handleAddQuestionClick = () => {
    if (questionLimitReached) {
      setShowLimitModal(true);
      return;
    }
    setShowAddModal(true);
  };

  const handleAddSubjectClick = () => {
    if (isLimited) {
      setShowAddSubjectUpgradeModal(true);
      return;
    }
    setShowAddSubjectModal(true);
  };

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

  const handleAddItem = async (payload: AddQuestionPayload): Promise<boolean> => {
    const subjectLabel = subjectOptions.find((d) => d.id === payload.subjectId)?.label
      ?? SUBJECT_HEALTH.find((s) => s.id === payload.subjectId)?.label
      ?? payload.subjectId;
    try {
      const res = await spacedRepService.addItem({
        questionText: payload.questionText,
        answer: payload.answer || undefined,
        subject: subjectLabel,
        source: sourceTypeToLabel(payload.sourceType),
        sourceType: payload.sourceType,
        scheduleDays: payload.scheduleDays,
      });
      if (res.status === 'success') {
        setItems((prev) => [res.data, ...prev]);
        return true;
      }
      return false;
    } catch (err) {
      const code = err instanceof ApiRequestError ? err.payload?.code : null;
      if (code === 'FEATURE_LIMIT_REACHED') {
        setShowAddModal(false);
        setShowLimitModal(true);
        return false;
      }
      throw err;
    }
  };

  // Hero subject-health stats from real data
  const heroStats = (() => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const pendingItems = items.filter((item) => item.status !== 'completed');
    const overdue = pendingItems.filter((item) => new Date(item.nextReviewAt) < startOfToday).length;
    const scheduled = pendingItems.length;
    const dueToday = pendingItems.filter((item) => {
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

  // The subject grid is driven only by outstanding SR reviews - never by MCQ accuracy.
  const subjectReviewState = (() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setHours(23, 59, 59, 999);
    const states: Record<string, { pending: number; overdue: number; dueToday: number; nextReviewAt?: Date }> = {};
    for (const item of items) {
      if (item.status === 'completed') continue;
      const state = states[item.subject] ?? { pending: 0, overdue: 0, dueToday: 0 };
      const due = new Date(item.nextReviewAt);
      state.pending++;
      if (due < startOfToday) state.overdue++;
      else if (due <= endOfToday) state.dueToday++;
      if (!state.nextReviewAt || due < state.nextReviewAt) state.nextReviewAt = due;
      states[item.subject] = state;
    }
    return states;
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
    <SubjectChoiceCardStyles />
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

        {/* Everything below the blue hero - ported from the reference exactly. */}
        <div className="sr-scope">
          {/* SECTION 1: SUBJECT CARDS */}
          <section className="subjects-section">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                  style={{ background: '#101828', fontFamily: 'Inter', fontWeight: 600, fontSize: 14, lineHeight: '20px', color: '#FFFFFF' }}
                >
                  1
                </div>
                <div>
                  <h2 style={{ fontFamily: 'Georgia', fontWeight: 700, fontSize: 36, lineHeight: '40px', color: '#101828' }}>
                    Choose a <span style={{ fontStyle: 'italic', color: '#E8B84B' }}>Subject</span>
                  </h2>
                  <p style={{ fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: 15, lineHeight: '22px', color: '#6A7282', marginTop: 4 }}>
                    Pick the subject you want to revise today
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="add-q-btn" onClick={handleAddQuestionClick}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                  Add Question
                </button>
                <button
                  type="button"
                  onClick={handleAddSubjectClick}
                  className="flex items-center gap-2 rounded-[10px] px-5 py-2.5"
                  style={{
                    background: 'linear-gradient(90deg, #F0AE00 0%, #FE6D00 100%)',
                    border: 'none',
                    boxShadow: '0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1)',
                    fontFamily: 'Inter',
                    fontWeight: 700,
                    fontSize: 14,
                    lineHeight: '20px',
                    color: '#17223E',
                    cursor: 'pointer',
                  }}
                >
                  <span className="text-lg leading-none">+</span> Add Subject
                </button>
              </div>
            </div>
            <div className="subject-card-grid">
              {SUBJECT_HEALTH.map((s) => {
                const style = getSubjectCardStyle(s.label);
                const subjectMeta = getSubjectMetaStyle(s.label);
                const review = subjectReviewState[s.label] ?? { pending: 0, overdue: 0, dueToday: 0 };
                const pending = review.pending;
                const isOverdue = review.overdue > 0;
                const isDueToday = !isOverdue && review.dueToday > 0;
                const nextReviewLabel = review.nextReviewAt
                  ? review.nextReviewAt.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
                  : '';
                const meta = isOverdue
                  ? `${review.overdue} overdue`
                  : isDueToday
                    ? `${review.dueToday} due today`
                    : pending > 0
                      ? `${pending} scheduled · next ${nextReviewLabel}`
                      : 'No reviews scheduled';
                const statusLine = isOverdue
                  ? '⚠ Review now'
                  : isDueToday
                    ? '⚡ Due today'
                    : pending > 0
                      ? '📅 Upcoming review'
                      : undefined;
                const statusColor = isOverdue ? '#E02424' : isDueToday ? '#D97706' : '#6A7282';
                const barColor = isOverdue ? '#EF4444' : isDueToday ? '#E8B84B' : style.bar;
                return (
                  <SubjectChoiceCard
                    key={s.id}
                    href={pending > 0 ? `/dashboard/spaced-repetition/${s.id}` : undefined}
                    onClick={pending > 0 ? undefined : () => setShowOnboardingModal(true)}
                    icon={subjectMeta.icon}
                    iconBg={subjectMeta.bg}
                    accentColor={style.bar}
                    title={s.shortLabel ?? s.label}
                    meta={meta}
                    topRight={(isOverdue || isDueToday) && (
                      <span
                        className="inline-flex flex-shrink-0 items-center rounded-full px-2 py-0.5"
                        style={{ background: '#EF4444', fontFamily: 'Inter', fontWeight: 700, fontSize: 9, lineHeight: '14px', color: '#FFFFFF', whiteSpace: 'nowrap' }}
                      >
                        {isOverdue ? `${review.overdue} overdue` : `${review.dueToday} due`}
                      </span>
                    )}
                    statusLine={statusLine}
                    statusLineColor={statusColor}
                    progressPercent={pending > 0 ? 100 : 0}
                    progressColor={barColor}
                    footerRight={isOverdue || isDueToday ? 'Review now →' : pending > 0 ? 'View schedule →' : 'Add a question →'}
                    footerRightColor="#6A7282"
                  />
                );
              })}

              {customSubjects.map((s) => (
                <SubjectChoiceCard
                  key={`custom-${s.name}`}
                  onClick={() => setShowOnboardingModal(true)}
                  icon={s.icon}
                  iconBg={s.tint}
                  accentColor="#16A34A"
                  title={s.name}
                  meta="No data yet"
                  progressPercent={0}
                  footerRight="Start revising →"
                  footerRightColor="#6A7282"
                />
              ))}

              {/* Add-a-subject dotted box (gated for Free/Aspire) */}
              <button
                type="button"
                onClick={handleAddSubjectClick}
                className="rounded-[16px] border-2 border-dashed p-5 flex flex-col items-center justify-center text-center transition-all hover:bg-white hover:-translate-y-0.5 hover:shadow-md"
                style={{ borderColor: '#E9EAEE', background: 'transparent', height: 190, cursor: 'pointer' }}
                aria-label="Add a subject"
              >
                <span
                  className="grid place-items-center rounded-2xl border-2 border-dashed"
                  style={{ width: 48, height: 48, borderColor: '#D8E0EA', fontSize: 24, lineHeight: 1, color: '#6A7282' }}
                >
                  +
                </span>
                <span
                  className="mt-3"
                  style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 14, lineHeight: '20px', color: '#6A7282' }}
                >
                  Add a Subject
                </span>
              </button>
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

      <SpacedRepOnboardingModal
        open={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        onAddFirstQuestion={() => {
          setShowOnboardingModal(false);
          handleAddQuestionClick();
        }}
      />

      <SpacedRepAddSubjectUpgradeModal
        open={showAddSubjectUpgradeModal}
        onClose={() => setShowAddSubjectUpgradeModal(false)}
      />

      <SpacedRepLimitModal
        open={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        used={Math.min(items.length, FREE_QUESTION_LIMIT)}
        limit={FREE_QUESTION_LIMIT}
      />

      <AddSubjectModal
        open={showAddSubjectModal}
        onClose={() => setShowAddSubjectModal(false)}
        onCreate={(subject) => {
          setCustomSubjects((prev) =>
            prev.some((s) => s.name.toLowerCase() === subject.name.toLowerCase()) ? prev : [...prev, subject]
          );
          setShowAddSubjectModal(false);
        }}
      />
    </div>
    </EntitlementGate>
  );
}

// Timeline + retention curve, with the reference's scroll-reveal animations.
function IntervalsSection() {
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const connectorRefs = useRef<(HTMLDivElement | null)[]>([]);
  const retentionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const nodeEls = nodeRefs.current.filter((el): el is HTMLDivElement => el !== null);
    const connectorEls = connectorRefs.current.filter((el): el is HTMLDivElement => el !== null);
    const targets: HTMLElement[] = [...nodeEls, ...connectorEls];
    if (retentionRef.current) targets.push(retentionRef.current);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          if (el.dataset.anim === 'timeline') {
            const idx = nodeEls.indexOf(el as HTMLDivElement);
            setTimeout(() => el.classList.add('visible'), idx * 120);
          } else if (el.dataset.anim === 'conn') {
            const idx = connectorEls.indexOf(el as HTMLDivElement);
            setTimeout(() => el.classList.add('visible'), idx * 120 + 80);
          } else if (el.classList.contains('retention-curve')) {
            el.classList.add('visible');
          }
          observer.unobserve(el);
        });
      },
      { threshold: 0.2 }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
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
              <div
                className={`timeline-node ${n.cls}`}
                data-anim="timeline"
                ref={(el) => { nodeRefs.current[i] = el; }}
              >
                <div className="node-card">
                  <div className="node-icon">{n.icon}</div>
                  <h4>{n.title}</h4>
                  <div className="node-day">{n.day}</div>
                  <div className="node-subject">{n.tag}</div>
                </div>
              </div>
              {i < nodes.length - 1 && (
                <div
                  className="timeline-connector"
                  data-anim="conn"
                  ref={(el) => { connectorRefs.current[i] = el; }}
                >
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

      <div className="retention-curve" ref={retentionRef}>
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
          <circle className="curve-dot-ring" style={{ animationDelay: '0s' }} cx="160" cy="55" r="5" fill="#10b981" /><circle cx="160" cy="55" r="3" fill="#10b981" />
          <text x="148" y="75" fill="#10b981" fontSize="9" fontFamily="DM Sans" fontWeight="600">Review</text>
          <circle className="curve-dot-ring" style={{ animationDelay: '.3s' }} cx="260" cy="50" r="5" fill="#10b981" /><circle cx="260" cy="50" r="3" fill="#10b981" />
          <circle className="curve-dot-ring" style={{ animationDelay: '.6s' }} cx="370" cy="40" r="5" fill="#10b981" /><circle cx="370" cy="40" r="3" fill="#10b981" />
          <circle className="curve-dot-ring" style={{ animationDelay: '.9s' }} cx="480" cy="35" r="5" fill="#10b981" /><circle cx="480" cy="35" r="3" fill="#10b981" />
          <circle className="curve-dot-ring" style={{ animationDelay: '1.2s' }} cx="590" cy="30" r="5" fill="#10b981" /><circle cx="590" cy="30" r="3" fill="#10b981" />
          <text x="340" y="178" fill="#9ca3af" fontSize="10" fontFamily="DM Sans" textAnchor="middle">Days →</text>
        </svg>
        <div className="retention-info">
          <p><strong>The green curve shows spaced repetition in action.</strong> Each review (marked by dots) resets your forgetting curve, but at a higher retention level. The red dashed curve shows what happens without reviews, rapid forgetting. The spacing effect means you retain more by reviewing less frequently but at strategic intervals.</p>
        </div>
      </div>
    </section>
  );
}
