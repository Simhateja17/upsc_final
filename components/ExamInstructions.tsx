'use client';

import { useState } from 'react';

/* ─────────────────────────────────────────────────────────────
   ExamInstructions — pre-test gate shown after the test is
   generated and before the writing/attempt screen opens.
   Themed to match the app (navy hero, gold accents) and sized
   to fit on one screen without vertical scrolling.
   ───────────────────────────────────────────────────────────── */

type Props = {
  isMains: boolean;
  questionCount: number;
  totalTimeMinutes: number;
  paperLabel: string;       // e.g. "GS I · All Subjects"
  difficultyLabel: string;  // e.g. "Medium"
  onBack: () => void;
  onStart: () => void;
};

const MAINS_GUIDELINES: { title: string; body: string }[] = [
  { title: 'Answer in your own words.', body: 'Stick to the prescribed word limit (150 / 200 / 250 words). Brevity and structure carry weight.' },
  { title: 'Write neatly and legibly.', body: 'Clear handwriting and clean presentation help you maximize your marks.' },
  { title: 'Write on paper:', body: 'You can upload a clear photo / PDF of your handwritten answer once you click "Submit All & Upload".' },
  { title: 'Structure your answer:', body: 'proper introduction · body with sub-headings or points · brief conclusion. Use of diagrams, flowcharts and maps is encouraged where appropriate.' },
  { title: 'One timer for the whole paper:', body: "The clock starts when you begin. Pause is allowed but shouldn't be misused, and it auto-submits when time runs out." },
  { title: 'Jeet AI will evaluate:', body: "on Content · Structure · Examples · Conclusion · Presentation, and you'll receive marks plus detailed feedback post submission." },
];

const PRELIMS_GUIDELINES: { title: string; body: string }[] = [
  { title: 'Single best answer.', body: 'Each question has exactly one correct option. Pick the best fit before moving on.' },
  { title: 'One timer for the whole paper.', body: 'The clock starts when you begin and submits automatically when it reaches zero.' },
  { title: 'Mark & review.', body: 'Flag tricky questions and revisit them any time before final submission.' },
  { title: 'No external help.', body: 'Treat it like the real exam. No notes, books or searches while attempting.' },
  { title: 'AI explains every answer.', body: 'After submission you get the correct option plus a clear explanation.' },
  { title: 'Stay honest.', body: 'This is a self-paced rehearsal. Closing the tab will auto-submit your attempt.' },
];

const SERIF = "var(--font-playfair), 'Palatino Linotype', Georgia, serif";
const SANS = 'var(--font-inter), Inter, system-ui, sans-serif';

function StatCard({ emoji, tint, value, label }: { emoji: string; tint: string; value: string; label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '18px 20px',
        borderRadius: 14,
        background: '#F9FAFB',
        border: '1px solid #E5E7EB',
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 50,
          height: 50,
          borderRadius: 13,
          background: tint,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 23,
          lineHeight: 1,
        }}
      >
        {emoji}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 'clamp(15px, 1.2vw, 18px)', color: '#0F172B', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {value}
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 11, letterSpacing: '0.07em', color: '#9AA4B2', textTransform: 'uppercase', marginTop: 3 }}>
          {label}
        </div>
      </div>
    </div>
  );
}

export default function ExamInstructions({
  isMains,
  questionCount,
  totalTimeMinutes,
  paperLabel,
  difficultyLabel,
  onBack,
  onStart,
}: Props) {
  const [accepted, setAccepted] = useState(false);
  const guidelines = isMains ? MAINS_GUIDELINES : PRELIMS_GUIDELINES;

  return (
    <div
      style={{
        minHeight: '100%',
        background: '#FAFBFE',
        padding: 'clamp(16px, 2vw, 32px)',
        fontFamily: SANS,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        animation: 'exi-fade 0.3s ease',
      }}
    >
      <div
        style={{
          width: 'min(780px, 100%)',
          background: '#FFFFFF',
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 20px 50px -28px rgba(15,23,42,0.3)',
          border: '1px solid #EEF1F5',
        }}
      >
        {/* ── Navy hero ── */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1D293D 0%, #0F172B 55%, #162456 100%)',
            padding: 'clamp(26px, 3vw, 40px) clamp(24px, 3vw, 40px)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 16px',
              borderRadius: 999,
              border: '1px solid rgba(250,204,21,0.35)',
              background: 'rgba(250,204,21,0.06)',
              marginBottom: 'clamp(16px, 2vw, 24px)',
            }}
          >
            <span style={{ color: '#FCD34D', fontSize: 12 }}>✦</span>
            <span style={{ color: '#FCD34D', fontWeight: 800, fontSize: 12, letterSpacing: '0.12em' }}>
              {isMains ? 'MAINS' : 'PRELIMS'} MOCK TEST · INSTRUCTIONS
            </span>
          </div>
          <h1
            style={{
              margin: 0,
              fontFamily: SERIF,
              fontWeight: 600,
              color: '#FFFFFF',
              fontSize: 'clamp(24px, 2.9vw, 36px)',
              lineHeight: 1.08,
              letterSpacing: '-0.01em',
            }}
          >
            Before you begin, please read carefully.
          </h1>
          <p
            style={{
              margin: '14px 0 0',
              color: '#94A3B8',
              fontSize: 'clamp(13px, 1.15vw, 16px)',
              lineHeight: 1.4,
            }}
          >
            {isMains
              ? 'Simulate the real UPSC Mains environment. Manage time, write neatly, think clearly.'
              : 'Simulate the real UPSC Prelims environment. Manage time, stay calm, think clearly.'}
          </p>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: 'clamp(22px, 2.6vw, 36px) clamp(24px, 3vw, 40px) clamp(24px, 2.8vw, 36px)' }}>
          {/* Stat cards — 2×2 grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 'clamp(12px, 1.4vw, 18px)',
            }}
          >
            <StatCard emoji="📋" tint="#FBEFD0" value={`${questionCount} Questions`} label="Total Questions" />
            <StatCard emoji="⏱️" tint="#D6F0E0" value={`${totalTimeMinutes} minutes`} label={isMains ? 'Total Writing Time' : 'Total Time'} />
            <StatCard emoji="📄" tint="#E4E1F7" value={paperLabel} label="Paper" />
            <StatCard emoji="⚡" tint="#FBE2CB" value={difficultyLabel} label="Difficulty" />
          </div>

          {/* Guidelines */}
          <div style={{ marginTop: 'clamp(22px, 2.6vw, 32px)' }}>
            <div style={{ fontWeight: 800, fontSize: 12, letterSpacing: '0.12em', color: '#9AA4B2', textTransform: 'uppercase', marginBottom: 'clamp(14px, 1.6vw, 20px)' }}>
              Standard Guidelines
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 1.6vw, 20px)' }}>
              {guidelines.map((g, i) => (
                <div key={g.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <span
                    style={{
                      flexShrink: 0,
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: '#F1F5F9',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 13,
                      color: '#0F172B',
                    }}
                  >
                    {i + 1}
                  </span>
                  <p style={{ margin: 0, fontSize: 'clamp(13px, 1.05vw, 15px)', lineHeight: 1.5, color: '#475569' }}>
                    <strong style={{ color: '#0F172B', fontWeight: 700 }}>{g.title}</strong>{' '}
                    {g.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Acceptance checkbox */}
          <button
            type="button"
            onClick={() => setAccepted((a) => !a)}
            style={{
              width: '100%',
              marginTop: 'clamp(20px, 2.4vw, 30px)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
              padding: '16px 20px',
              borderRadius: 14,
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s ease',
            }}
          >
            <span
              style={{
                flexShrink: 0,
                marginTop: 2,
                width: 24,
                height: 24,
                borderRadius: 7,
                background: accepted ? '#16A34A' : '#FFFFFF',
                border: accepted ? '1px solid #16A34A' : '1.5px solid #A7D7B9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s ease',
              }}
            >
              {accepted && (
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7.2L5.7 9.9L11 4.2" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span style={{ fontSize: 'clamp(13px, 1.05vw, 15px)', color: '#15803D', fontWeight: 500, lineHeight: 1.5 }}>
              <strong style={{ fontWeight: 700, color: '#166534' }}>I have read and understood the instructions.</strong>{' '}
              I will write my responses honestly without external help, and I consent to AI evaluation of my submissions.
            </span>
          </button>

          {/* Actions */}
          <div style={{ marginTop: 'clamp(18px, 2.2vw, 28px)', display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onBack}
              style={{
                padding: '13px 26px',
                borderRadius: 14,
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                fontWeight: 700,
                fontSize: 16,
                color: '#475569',
                cursor: 'pointer',
              }}
            >
              ← Back
            </button>
            <button
              type="button"
              disabled={!accepted}
              onClick={onStart}
              style={{
                padding: '13px 32px',
                borderRadius: 14,
                background: accepted ? '#0F172B' : '#E2E8F0',
                border: 'none',
                fontWeight: 800,
                fontSize: 16,
                color: accepted ? '#FCD34D' : '#94A3B8',
                cursor: accepted ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s ease, color 0.2s ease',
              }}
            >
              {isMains ? 'Start Writing →' : 'Start Test →'}
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes exi-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
