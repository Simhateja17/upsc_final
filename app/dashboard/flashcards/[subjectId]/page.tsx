'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import CreateFlashcardModal from '@/components/CreateFlashcardModal';
import { flashcardService } from '@/lib/services';

type Topic = {
  id: string;
  name: string;
  cards: number;
  mastery: number;
};

type DeckMeta = {
  subject: string;
  icon: string;
};

function displaySubjectName(subject: string) {
  if (subject === 'Modern History') return 'History';
  return subject;
}

function getMasteryColor(mastery: number): { barColor: string; textColor: string; accentColor: string } {
  if (mastery === 100) return { barColor: '#16A34A', textColor: '#16A34A', accentColor: '#16A34A' };
  if (mastery > 0)    return { barColor: '#F59E0B', textColor: '#D97706', accentColor: '#F59E0B' };
  return               { barColor: '#EF4444', textColor: '#EF4444', accentColor: '#EF4444' };
}

const TOPIC_ICONS: Record<string, string> = {
  // Polity
  'Constitutional Amendments': '📜', 'Amendment': '📜',
  'Fundamental Rights': '⚖️', 'Fundamental Rights & DPSPs': '⚖️', 'DPSP': '📖',
  'Judiciary': '🏛️', 'Supreme Court': '🏛️', 'Judiciary & Supreme Court': '🏛️',
  'Centre-State': '🗺️', 'Centre-State Relations': '🗺️', 'Federalism': '🗺️',
  'Election Commission': '🗳️', 'Election': '🗳️',
  'Parliament': '🏛️', 'Lok Sabha': '🏛️', 'Rajya Sabha': '🏛️',
  'President': '👑', 'Governor': '🏛️', 'Prime Minister': '👔',
  'Emergency': '🚨', 'Emergency Provisions': '🚨',
  'Panchayati Raj': '🏘️', 'Local Government': '🏘️', 'Municipalities': '🏘️',
  'Constitutional Bodies': '📋', 'Statutory Bodies': '📋',
  'UPSC': '📋', 'CAG': '📋', 'Finance Commission': '💹',
  'Directive Principles': '📖', 'Fundamental Duties': '✊',
  'Citizenship': '🪪', 'Preamble': '📜', 'Schedules': '📋',
  // History
  'Ancient India': '🏺', 'Vedic': '📿', 'Harappan': '🏺', 'Indus Valley': '🏺',
  'Maurya': '🦁', 'Gupta': '🌟', 'Buddhism': '☸️', 'Jainism': '🕯️',
  'Medieval India': '🏰', 'Mughal': '🕌', 'Maratha': '⚔️', 'Delhi Sultanate': '🕌',
  'Modern India': '🇮🇳', 'British': '🗺️', 'Freedom Movement': '🇮🇳',
  'Independence': '🇮🇳', 'Revolt': '⚔️', 'Partition': '🗓️',
  'Art & Culture': '🎨', 'Architecture': '🕌', 'Literature': '📚',
  'Post-Independence': '📜', 'Post Independence': '📜',
  // Geography
  'Physical Geography': '🌍', 'Climate': '☁️', 'Rivers': '🌊', 'Mountains': '⛰️',
  'Soil': '🌱', 'Agriculture': '🌾', 'Industry': '🏭',
  'Transport': '🚆', 'Natural Disasters': '🌪️', 'Ocean': '🌊',
  'World Geography': '🌐', 'Indian Geography': '🗺️', 'Atmosphere': '🌤️',
  // Economy
  'National Income': '💹', 'GDP': '💹', 'Money': '💰', 'Banking': '🏦',
  'Inflation': '📈', 'Budget': '💼', 'Fiscal': '💼', 'Poverty': '🤝',
  'Agriculture Sector': '🌾', 'Industry Sector': '🏭', 'Services': '🏢',
  'External Sector': '🌐', 'Trade': '🌐', 'Balance of Payments': '⚖️',
  'Infrastructure': '🏗️', 'Human Development': '👥',
  // Environment
  'Ecosystem': '🌿', 'Ecology': '🌿', 'Biodiversity': '🦋',
  'Pollution': '🏭', 'Climate Change': '🌡️', 'Wildlife': '🐘',
  'Conservation': '🌳', 'Wetlands': '💧', 'Protected Areas': '🌳',
  // Science
  'Physics': '⚛️', 'Chemistry': '🧪', 'Biology': '🧬',
  'Space': '🚀', 'Nuclear': '☢️', 'Computer': '💻', 'IT': '💻',
  'Biotechnology': '🧬', 'Nanotechnology': '🔬', 'Defence': '🛡️',
  'Health': '🏥', 'Disease': '🦠',
};

function getTopicIcon(name: string): string {
  if (TOPIC_ICONS[name]) return TOPIC_ICONS[name];
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(TOPIC_ICONS)) {
    if (lower.includes(key.toLowerCase())) return icon;
  }
  return '📄';
}

export default function FlashcardsSubjectPage() {
  const params = useParams<{ subjectId: string }>();
  const subjectId = typeof params?.subjectId === 'string' ? params.subjectId : '';
  const [meta, setMeta] = useState<DeckMeta | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [arrowImgFailed, setArrowImgFailed] = useState(false);

  useEffect(() => {
    if (!subjectId) return;
    flashcardService.getTopics(subjectId)
      .then((res) => {
        if (res.status === 'success') {
          setMeta(res.data.deck);
          setTopics(res.data.topics);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [subjectId]);

  const totalCards = topics.reduce((s, t) => s + t.cards, 0);
  const totalMastered = topics.reduce((s, t) => s + Math.round((t.mastery / 100) * t.cards), 0);
  const dueToday = topics.reduce((s, t) => s + (t.mastery < 100 ? Math.max(1, Math.round(t.cards * 0.1)) : 0), 0);
  const coverage = totalCards > 0 ? Math.round((totalMastered / totalCards) * 100) : 0;

  return (
    <div className="flex overflow-hidden" style={{ background: '#FAFBFE', height: '100%' }}>
      <div className="flex-1 overflow-y-auto" style={{ background: '#FAFBFE' }}>
        <div className="w-full max-w-[960px] mx-auto px-6 py-6">

          {/* Back link */}
          <Link
            href="/dashboard/flashcards"
            className="inline-flex items-center gap-2 mb-5"
            style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 13, color: '#6B7280' }}
          >
            {!arrowImgFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/ArrowLeft.png" alt="" className="w-4 h-4 object-contain" onError={() => setArrowImgFailed(true)} />
            ) : (
              <span aria-hidden>←</span>
            )}
            Back to Subjects
          </Link>

          {/* Subject summary card */}
          {loading ? (
            <div className="w-full rounded-[12px] h-[88px] animate-pulse mb-6" style={{ background: '#F0F2F5', border: '0.8px solid #E5E7EB' }} />
          ) : meta && (
            <div
              className="w-full rounded-[12px] px-6 py-4 flex items-center gap-5 mb-6"
              style={{ border: '0.8px solid #E2E5ED', background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
            >
              <span className="text-4xl flex-shrink-0" aria-hidden>{meta.icon}</span>
              <div className="flex-1 min-w-0">
                <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 22, lineHeight: '28px', color: '#101828' }}>
                  {displaySubjectName(meta.subject)}
                </h1>
                <p style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 13, color: '#6A7282', marginTop: 2 }}>
                  {totalCards} cards · {topics.length} topics
                </p>
              </div>
              {/* Stats */}
              <div className="hidden sm:flex items-center gap-6 flex-shrink-0">
                <div className="text-center">
                  <div style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 20, color: '#16A34A' }}>{totalMastered}</div>
                  <div style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.5px', textTransform: 'uppercase', marginTop: 2 }}>Mastered</div>
                </div>
                <div className="text-center">
                  <div style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 20, color: '#EF4444' }}>{dueToday}</div>
                  <div style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.5px', textTransform: 'uppercase', marginTop: 2 }}>Due Today</div>
                </div>
                <div className="text-center">
                  <div style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 20, color: '#2563EB' }}>{coverage}%</div>
                  <div style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.5px', textTransform: 'uppercase', marginTop: 2 }}>Coverage</div>
                </div>
              </div>
              <Link
                href={`/dashboard/flashcards/${subjectId}/all`}
                className="hidden sm:flex items-center gap-2 rounded-[8px] px-4 py-2 flex-shrink-0"
                style={{ background: '#101828', color: '#FFFFFF', fontFamily: 'Inter', fontWeight: 700, fontSize: 12 }}
              >
                ▶ Start All Due
              </Link>
            </div>
          )}

          {/* Step heading — just "2. Choose a Topic", no green tick */}
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: '#101828', fontFamily: 'Inter', fontWeight: 700, fontSize: 13, color: '#FFFFFF' }}
            >
              2
            </div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 22, lineHeight: '28px', color: '#101828' }}>
              Choose a Topic
            </h2>
          </div>

          {/* Topic list */}
          {loading ? (
            <div className="space-y-2 mb-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="rounded-[10px] h-[68px] animate-pulse" style={{ background: '#F0F2F5', border: '0.8px solid #E5E7EB' }} />
              ))}
            </div>
          ) : topics.length === 0 ? (
            <div className="text-center py-12 text-gray-400 mb-6">
              <p>No topics found for this subject yet.</p>
            </div>
          ) : (
            <div className="space-y-2 mb-6">
              {topics.map((topic) => {
                const { barColor, textColor, accentColor } = getMasteryColor(topic.mastery);
                const readMin = Math.max(1, Math.ceil(topic.cards * 0.5));
                const topicIcon = getTopicIcon(topic.name);
                return (
                  <Link
                    key={topic.id}
                    href={`/dashboard/flashcards/${subjectId}/${topic.id}`}
                    className="flex items-center rounded-[10px] overflow-hidden transition-all hover:shadow-md hover:-translate-y-px"
                    style={{ border: '0.8px solid #E2E5ED', background: '#FFFFFF', minHeight: 68 }}
                  >
                    {/* Left color accent strip */}
                    <div className="flex-shrink-0 self-stretch w-[4px]" style={{ background: accentColor }} />

                    {/* Icon */}
                    <div className="flex-shrink-0 flex items-center justify-center mx-4" style={{ width: 36, fontSize: 20 }}>
                      {topicIcon}
                    </div>

                    {/* Name + meta */}
                    <div className="flex-1 min-w-0 py-4 pr-4">
                      <h3 style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 14, lineHeight: '20px', color: '#101828' }}>
                        {topic.name}
                      </h3>
                      <p style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                        {topic.cards} cards · {readMin} min
                      </p>
                    </div>

                    {/* Progress + % + arrow */}
                    <div className="flex items-center gap-4 flex-shrink-0 pr-5">
                      <div className="rounded-full overflow-hidden hidden sm:block" style={{ width: 110, height: 5, background: '#F1F3F5' }}>
                        <div className="h-full rounded-full" style={{ width: `${topic.mastery}%`, background: barColor, maxWidth: '100%' }} />
                      </div>
                      <span style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 14, color: textColor, minWidth: 38, textAlign: 'right' }}>
                        {topic.mastery}%
                      </span>
                      <span style={{ color: '#D1D5DB', fontSize: 16 }} aria-hidden>›</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Add Custom Flashcard */}
          <div
            className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-[12px] border-2 border-dashed"
            style={{ borderColor: '#D1D5DC', background: '#FFFFFF' }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: '#101828', color: '#FFFFFF' }}
              >
                +
              </div>
              <div>
                <p style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 16, color: '#101828' }}>
                  Add Custom Flashcard
                </p>
                <p style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 13, color: '#6A7282', marginTop: 2 }}>
                  Create your own flashcard for today
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 rounded-[8px] px-5 py-2.5"
              style={{ background: '#FFFFFF', border: '1.5px solid #2563EB', fontFamily: 'Inter', fontWeight: 700, fontSize: 13, color: '#2563EB' }}
            >
              + Add Flashcard
            </button>
          </div>

        </div>
      </div>

      <CreateFlashcardModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        initialSubject={meta?.subject}
      />
    </div>
  );
}
