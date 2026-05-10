'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { editorialService, mentalHealthService } from '@/lib/services';

interface SavedEditorial {
  id: string;
  title: string;
  summary: string | null;
  source: string;
  category: string;
  tags: string[];
  savedAt?: string;
}

interface CheckIn {
  id: string;
  mood: string;
  energy: number;
  note?: string;
  date: string;
  createdAt?: string;
}

const categoryColors: Record<string, { color: string; bg: string }> = {
  'History': { color: '#B45309', bg: '#FEF3C7' },
  'Geography': { color: '#1D4ED8', bg: '#DBEAFE' },
  'Polity': { color: '#7C3AED', bg: '#EDE9FE' },
  'Economy': { color: '#EA580C', bg: '#FFF7ED' },
  'Environment & Ecology': { color: '#16A34A', bg: '#F0FDF4' },
  'Science & Technology': { color: '#0369A1', bg: '#DBEAFE' },
};

export default function SavedNotesPage() {
  const searchParams = useSearchParams();
  const [savedNotes, setSavedNotes] = useState<SavedEditorial[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'notes' | 'bookmarks' | 'checkins'>(() => {
    const requestedTab = searchParams.get('tab');
    return requestedTab === 'bookmarks' || requestedTab === 'checkins' ? requestedTab : 'notes';
  });

  useEffect(() => {
    const requestedTab = searchParams.get('tab');
    if (requestedTab === 'bookmarks' || requestedTab === 'checkins' || requestedTab === 'notes') {
      setActiveTab(requestedTab);
    }
  }, [searchParams]);

  useEffect(() => {
    Promise.all([
      editorialService.getStats(),
      mentalHealthService.getCheckIns(30),
    ])
      .then(([editorialRes, checkInRes]) => {
        if (editorialRes.data?.savedItems && Array.isArray(editorialRes.data.savedItems)) {
          setSavedNotes(editorialRes.data.savedItems);
        }
        if (checkInRes.data && Array.isArray(checkInRes.data)) {
          setCheckIns(checkInRes.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUnsave = async (id: string) => {
    try {
      await editorialService.toggleSave(id);
      setSavedNotes(prev => prev.filter(n => n.id !== id));
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#FAFBFE] px-4 sm:px-6 py-6 md:py-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-4">
        <Link href="/dashboard" className="font-normal text-[14px] leading-[20px] text-[#62748e] hover:text-[#314158]">
          Home
        </Link>
        <span className="text-[14px] leading-[20px] text-[#90a1b9]">›</span>
        <Link href="/dashboard/profile" className="font-normal text-[14px] leading-[20px] text-[#62748e] hover:text-[#314158]">
          Profile
        </Link>
        <span className="text-[14px] leading-[20px] text-[#90a1b9]">›</span>
        <span className="font-medium text-[14px] leading-[20px] text-[#0f172b]">Saved Notes</span>
      </nav>

      {/* Page Title */}
      <h1 className="text-xl md:text-2xl lg:text-[30px] leading-[36px] text-[#0f172b] mb-6 md:mb-8" style={{ fontFamily: "'Georgia', serif" }}>
        Saved Notes & Bookmarks
      </h1>

      {/* Tab bar */}
      <div style={{ borderBottom: '2px solid #E5E7EB', marginBottom: '24px' }}>
        <div className="flex" style={{ gap: '24px' }}>
          {(['notes', 'bookmarks', 'checkins'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="font-arimo font-bold"
              style={{
                fontSize: '15px',
                color: activeTab === tab ? '#155DFC' : '#6A7282',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #155DFC' : '2px solid transparent',
                padding: '12px 0',
                marginBottom: '-2px',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tab === 'checkins' ? 'Check-ins' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
        </div>
      ) : activeTab === 'checkins' ? (
        /* Check-ins Tab Content */
        checkIns.length === 0 ? (
          <div className="text-center py-16">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧠</div>
            <h3 className="font-semibold text-[18px] text-[#0f172b] mb-2">No check-ins yet</h3>
            <p className="text-[14px] text-[#62748e] mb-6">
              Start tracking your mental health from the Mental Health Buddy page.
            </p>
            <Link href="/dashboard/mental-health">
              <button
                style={{
                  background: '#101828',
                  color: '#FFFFFF',
                  borderRadius: '10px',
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Go to Mental Health
              </button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {checkIns.map((checkIn) => {
              const moodEmojis: Record<string, string> = {
                'On Fire!': '🔥', Great: '', Good: '🙂', Okay: '😐',
                Low: '😔', Anxious: '😰', Frustrated: '', Exhausted: '😴',
              };
              const energyColor =
                checkIn.energy >= 7 ? '#4ade80' :
                checkIn.energy >= 4 ? '#e8b84b' : '#c4637a';
              return (
                <div
                  key={checkIn.id}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '14px',
                    padding: '20px',
                    boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)',
                  }}
                >
                  {/* Header: Date + Mood */}
                  <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                    <div className="flex items-center gap-3">
                      <span style={{ fontSize: '28px' }}>{moodEmojis[checkIn.mood] || '😐'}</span>
                      <div>
                        <span className="font-arimo font-bold" style={{ fontSize: '16px', color: '#101828' }}>
                          {checkIn.mood}
                        </span>
                        <span className="font-arimo" style={{ fontSize: '13px', color: '#6A7282', marginLeft: '8px' }}>
                          · Energy: {checkIn.energy}/10
                        </span>
                      </div>
                    </div>
                    <span className="font-arimo" style={{ fontSize: '13px', color: '#6A7282' }}>
                      {checkIn.date ? new Date(checkIn.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Recent'}
                    </span>
                  </div>

                  {/* Energy Bar */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ height: '6px', background: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${(checkIn.energy / 10) * 100}%`,
                          background: energyColor,
                          borderRadius: '3px',
                        }}
                      />
                    </div>
                  </div>

                  {/* Note */}
                  {checkIn.note && (
                    <p
                      className="font-arimo"
                      style={{
                        fontSize: '14px',
                        color: '#4A5565',
                        fontStyle: 'italic',
                        lineHeight: '1.6',
                        padding: '12px',
                        background: '#F9FAFB',
                        borderRadius: '8px',
                        borderLeft: '3px solid #e8b84b',
                      }}
                    >
                      {checkIn.note}
                    </p>
                  )}

                  {/* Footer */}
                  <div style={{ borderBottom: '1px solid #E5E7EB', marginTop: '12px', marginBottom: '12px' }} />
                  <div className="flex items-center justify-between">
                    <span className="font-arimo" style={{ fontSize: '12px', color: '#6A7282' }}>
                      Mental Health Check-in
                    </span>
                    <Link href="/dashboard/mental-health">
                      <button
                        className="font-arimo"
                        style={{
                          padding: '6px 16px',
                          borderRadius: '26843500px',
                          border: '0.8px solid #E5E7EB',
                          background: '#F9FAFB',
                          color: '#155DFC',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        View Details →
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : savedNotes.length === 0 ? (
        <div className="text-center py-16">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📌</div>
          <h3 className="font-semibold text-[18px] text-[#0f172b] mb-2">
            {activeTab === 'bookmarks' ? 'No bookmarks yet' : 'No saved notes yet'}
          </h3>
          <p className="text-[14px] text-[#62748e] mb-6">
            {activeTab === 'bookmarks'
              ? 'Bookmark editorials from the Daily Editorial page to keep them in one place.'
              : 'Start saving editorials from the Daily Editorial page to build your collection.'}
          </p>
          <Link href="/dashboard/daily-editorial">
            <button
              style={{
                background: '#101828',
                color: '#FFFFFF',
                borderRadius: '10px',
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Browse Editorials
            </button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {savedNotes.map((note) => {
            const tagList = note.tags?.length > 0 ? note.tags : [note.category];
            return (
              <div
                key={note.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '14px',
                  padding: '20px',
                  boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)',
                }}
              >
                {/* Tags row + source */}
                <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                  <div className="flex items-center flex-wrap" style={{ gap: '8px' }}>
                    {tagList.map((tag) => {
                      const colors = categoryColors[tag] || { color: '#1E40AF', bg: '#DBEAFE' };
                      return (
                        <span
                          key={tag}
                          className="font-arimo font-medium"
                          style={{
                            fontSize: '13px',
                            padding: '4px 12px',
                            borderRadius: '6px',
                            background: colors.bg,
                            color: colors.color,
                          }}
                        >
                          {tag}
                        </span>
                      );
                    })}
                  </div>
                  <span className="font-arimo shrink-0" style={{ color: '#6A7282', fontSize: '13px' }}>
                    {note.source}
                  </span>
                </div>

                {/* Title */}
                <h3
                  className="font-arimo font-bold"
                  style={{
                    fontSize: '18px',
                    color: '#101828',
                    marginBottom: '8px',
                  }}
                >
                  {note.title}
                </h3>

                {/* Summary */}
                {note.summary && (
                  <p
                    className="font-arimo"
                    style={{
                      fontSize: '14px',
                      color: '#4A5565',
                      marginBottom: '16px',
                    }}
                  >
                    {note.summary}
                  </p>
                )}

                {/* Divider */}
                <div style={{ borderBottom: '1px solid #E5E7EB', marginBottom: '12px' }} />

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <span className="font-arimo" style={{ fontSize: '12px', color: '#6A7282' }}>
                    {note.savedAt ? new Date(note.savedAt).toLocaleDateString('en-IN') : 'Saved recently'}
                  </span>
                  <button
                    onClick={() => handleUnsave(note.id)}
                    className="font-arimo"
                    style={{
                      padding: '6px 16px',
                      borderRadius: '26843500px',
                      border: '0.8px solid #FEE2E2',
                      background: '#FEF2F2',
                      color: '#DC2626',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
