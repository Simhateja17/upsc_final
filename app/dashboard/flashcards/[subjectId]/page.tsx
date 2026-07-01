'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import CreateFlashcardModal from '@/components/CreateFlashcardModal';
import NewTopicModal from '@/components/NewTopicModal';
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
  const router = useRouter();
  const [meta, setMeta] = useState<DeckMeta | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [arrowImgFailed, setArrowImgFailed] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; cards: number } | null>(null);
  const [deletingTopicId, setDeletingTopicId] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [hoveredBin, setHoveredBin] = useState<string | null>(null);

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

  const handleDeleteTopic = (e: React.MouseEvent, topic: Topic) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteTarget({ id: topic.id, name: topic.name, cards: topic.cards });
  };

  const confirmDeleteTopic = () => {
    if (!deleteTarget || deletingTopicId) return;
    setDeletingTopicId(deleteTarget.id);
    flashcardService.deleteTopic(subjectId, deleteTarget.id)
      .then(() => {
        setTopics((prev) => prev.filter((t) => t.id !== deleteTarget.id));
        setDeleteTarget(null);
      })
      .catch(() => {})
      .finally(() => setDeletingTopicId(null));
  };

  const handleCreateTopic = (topicName: string) => {
    const id = topicName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!id) return;
    setTopics((prev) => {
      if (prev.some((t) => t.id === id)) return prev;
      return [...prev, { id, name: topicName, cards: 0, mastery: 0 }];
    });
    setShowNewTopicModal(false);
  };

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
              <span
                className="flex items-center justify-center flex-shrink-0"
                aria-hidden
                style={{ width: 56, height: 56, borderRadius: 16, background: '#EFF6FF', fontSize: 30, lineHeight: 1 }}
              >
                {meta.icon}
              </span>
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
                  <div style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 20, color: '#2563EB' }}>{coverage}%</div>
                  <div style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.5px', textTransform: 'uppercase', marginTop: 2 }}>Coverage</div>
                </div>
              </div>
            </div>
          )}

          {/* Completion progress bar (mirrors the reference) */}
          {!loading && meta && (
            <div className="mb-6">
              <div style={{ height: 8, borderRadius: 999, background: '#ECEEF2', overflow: 'hidden' }}>
                <div style={{ width: `${coverage}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #F0B429, #E8B84B)', transition: 'width .6s ease' }} />
              </div>
              <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
                <span style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, color: '#9CA3AF' }}>0%</span>
                <span style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 12, color: '#CA8A04' }}>{coverage}% complete</span>
                <span style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, color: '#9CA3AF' }}>100%</span>
              </div>
            </div>
          )}

          {/* Step heading — just "2. Choose a Topic", no green tick */}
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: '#101828', fontFamily: 'Inter', fontWeight: 700, fontSize: 13, color: '#FFFFFF' }}
              >
                2
              </div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 22, lineHeight: '28px', color: '#101828' }}>
                Choose a <span style={{ fontStyle: 'italic', color: '#E8B84B' }}>Topic</span>
              </h2>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 rounded-[8px] px-4 py-2"
                style={{
                  background: 'linear-gradient(90deg, #F0AE00 0%, #FE6D00 100%)',
                  border: 'none',
                  boxShadow: '0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1)',
                  fontFamily: 'Inter', fontWeight: 700, fontSize: 13, lineHeight: '20px', letterSpacing: 0, color: '#17223E',
                }}
              >
                + Add Card
              </button>
              <button
                type="button"
                onClick={() => setShowNewTopicModal(true)}
                className="flex items-center gap-1.5 rounded-[8px] px-4 py-2"
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #D1D5DC',
                  fontFamily: 'Inter', fontWeight: 600, fontSize: 13, lineHeight: '20px', color: '#364153',
                }}
              >
                + New Topic
              </button>
            </div>
          </div>

          {/* Topic list */}
          {loading ? (
            <div className="space-y-2 mb-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="rounded-[28px] h-[68px] animate-pulse" style={{ background: '#F0F2F5', border: '0.8px solid #E5E7EB' }} />
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
                const isDeleting = deletingTopicId === topic.id;
                return (
                  <div
                    key={topic.id}
                    onClick={() => router.push(`/dashboard/flashcards/${subjectId}/${topic.id}`)}
                    onMouseEnter={() => setHoveredCard(topic.id)}
                    onMouseLeave={() => { setHoveredCard(null); setHoveredBin(null); }}
                    className="flex items-center rounded-[28px] overflow-hidden transition-all hover:shadow-md hover:-translate-y-px cursor-pointer"
                    style={{ borderTop: '0.8px solid #E2E5ED', borderRight: '0.8px solid #E2E5ED', borderBottom: '0.8px solid #E2E5ED', borderLeft: `4px solid ${accentColor}`, background: '#FFFFFF', minHeight: 68 }}
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0 flex items-center justify-center mx-4" style={{ width: 40, height: 40, borderRadius: 12, background: '#EFF6FF', fontSize: 20 }}>
                      {topicIcon}
                    </div>

                    {/* Name + meta */}
                    <div className="flex-1 min-w-0 py-4 pr-4">
                      <h3 style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 14, lineHeight: '20px', color: '#101828' }}>
                        {topic.name}
                      </h3>
                      <p style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                        {topic.cards} cards · ~{readMin} min
                      </p>
                    </div>

                    {/* Progress + % + delete + arrow */}
                    <div className="flex items-center gap-3 flex-shrink-0 pr-5">
                      <div className="rounded-full overflow-hidden hidden sm:block" style={{ width: 110, height: 5, background: '#F1F3F5' }}>
                        <div className="h-full rounded-full" style={{ width: `${topic.mastery}%`, background: barColor, maxWidth: '100%' }} />
                      </div>
                      <span style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 14, color: textColor, minWidth: 38, textAlign: 'right' }}>
                        {topic.mastery}%
                      </span>
                      {(hoveredCard === topic.id || isDeleting) && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteTopic(e, topic)}
                          onMouseEnter={() => setHoveredBin(topic.id)}
                          onMouseLeave={() => setHoveredBin(null)}
                          disabled={isDeleting}
                          title="Delete topic"
                          className="flex items-center justify-center rounded-[4px] transition-colors"
                          style={{ width: 28, height: 28, color: hoveredBin === topic.id ? '#EF4444' : '#9CA3AF', opacity: isDeleting ? 0.5 : 1 }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                      )}
                      <span style={{ color: '#000000', fontSize: 17, fontWeight: 800 }} aria-hidden>›</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Custom Flashcard */}
          <div
            onClick={() => setShowAddModal(true)}
            className="group rounded-xl border-2 border-dashed border-[#f5b400]/40 bg-gradient-to-br from-[#fffdf5] to-[#fff9e6] p-[clamp(0.75rem,1vw,1.25rem)] flex items-center justify-between cursor-pointer transition-all duration-200 ease-out hover:border-[#f5b400]/70 hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3">
              <div className="w-[clamp(40px,2.6vw,48px)] h-[clamp(40px,2.6vw,48px)] bg-gradient-to-br from-[#f5b400] to-[#ffcb3a] rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <h3 className="font-inter font-bold text-[clamp(14px,0.94vw,16px)] text-[#0e1430]">
                  Add Custom Flashcard
                </h3>
                <p className="font-inter text-[clamp(12px,0.68vw,13px)] text-gray-600">
                  Create your own flashcard for today
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowAddModal(true); }}
              className="px-[clamp(1rem,1.25vw,1.5rem)] py-[clamp(0.4rem,0.52vw,0.6rem)] bg-gradient-to-b from-[#ffd24a] to-[#f5b400] text-[#1a1407] rounded-[0.7rem] font-inter font-bold text-[clamp(12px,0.68vw,13px)] group-hover:shadow-lg transition-shadow flex items-center gap-1.5 flex-shrink-0"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              Add Flashcard
            </button>
          </div>

        </div>
      </div>

      <CreateFlashcardModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        initialSubject={meta?.subject}
      />

      <NewTopicModal
        open={showNewTopicModal}
        subjectName={meta ? displaySubjectName(meta.subject) : 'this subject'}
        onClose={() => setShowNewTopicModal(false)}
        onCreate={handleCreateTopic}
      />

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-xl"
            style={{ minWidth: 320, maxWidth: 420 }}
            onClick={(e) => e.stopPropagation()}
          >
            <span style={{ fontSize: 40 }}>🗑️</span>
            <h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 20, color: '#22304D', textAlign: 'center' }}>
              Are you sure?
            </h2>
            <p style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 14, color: '#6B7280', textAlign: 'center' }}>
              Delete topic &ldquo;{deleteTarget.name}&rdquo; and all its {deleteTarget.cards} flashcard(s)?
            </p>
            <div className="flex gap-3 w-full mt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-full border py-3 text-sm font-semibold"
                style={{ borderColor: '#E5E7EB', color: '#374151', fontFamily: 'Inter' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteTopic}
                disabled={!!deletingTopicId}
                className="flex-1 rounded-full py-3 text-sm font-semibold text-white"
                style={{ background: '#EF4444', fontFamily: 'Inter', opacity: deletingTopicId ? 0.6 : 1 }}
              >
                {deletingTopicId ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
