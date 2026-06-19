'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { editorialService, bookmarkService } from '@/lib/services';
import BookmarkCard, { BookmarkItem } from '@/components/BookmarkCard';
import SaveBookmarkModal from '@/components/SaveBookmarkModal';
import {
  NewspaperIcon,
  TargetIcon,
  PencilIcon,
  ArchiveIcon,
  LayersIcon,
  FilmIcon,
  XCircleIcon,
  StarIcon,
} from '@/components/icons/BookmarkIcons';

const TABS = [
  { key: 'editorial', label: 'Current Affairs', icon: NewspaperIcon },
  { key: 'mcq', label: 'MCQs', icon: TargetIcon },
  { key: 'answer-writing', label: 'Answer Writing', icon: PencilIcon },
  { key: 'pyq', label: 'PYQs', icon: ArchiveIcon },
  { key: 'flashcard', label: 'Flashcards', icon: LayersIcon },
  { key: 'video', label: 'Video Lectures', icon: FilmIcon },
] as const;

type TabKey = typeof TABS[number]['key'];

const FILTER_CHIPS: Record<TabKey, string[]> = {
  editorial: ['All', 'Unread', 'Read', 'For Revision', 'Starred'],
  mcq: ['All', 'New', 'Attempted', 'Got Wrong', 'Starred'],
  'answer-writing': ['All', 'Not Attempted', 'Draft', 'Submitted', 'Starred'],
  pyq: ['All', 'Prelims', 'Mains', 'Starred'],
  flashcard: ['All', 'New', 'Learning', 'Mastered', 'Starred'],
  video: ['All', 'Not Watched', 'Watching', 'Watched', 'Starred'],
};

const CHIP_ICONS: Record<string, (props: { size?: number; className?: string }) => JSX.Element> = {
  'Got Wrong': XCircleIcon,
  Starred: StarIcon,
};

const SAVE_LABELS: Record<TabKey, string> = {
  editorial: '+ Save Article',
  mcq: '+ Save MCQ',
  'answer-writing': '+ Save Question',
  pyq: '+ Save PYQ',
  flashcard: '+ Add Flashcard',
  video: '+ Save Lecture',
};

const STATUS_LABEL_NORMALIZE: Record<string, string> = {
  new: 'New',
  attempted: 'Attempted',
  gotwrong: 'Got Wrong',
  notattempted: 'Not Attempted',
  draft: 'Draft',
  submitted: 'Submitted',
  prelims: 'Prelims',
  mains: 'Mains',
  learning: 'Learning',
  mastered: 'Mastered',
  notwatched: 'Not Watched',
  watching: 'Watching',
  watched: 'Watched',
};

function statusFieldFor(tab: TabKey, item: BookmarkItem): string | undefined {
  const c = item.content || {};
  switch (tab) {
    case 'mcq':
    case 'answer-writing':
      return c.status;
    case 'pyq':
      return c.paper;
    case 'flashcard':
      return c.mastery;
    case 'video':
      return c.watchStatus;
    default:
      return undefined;
  }
}

const EMPTY_ITEMS: Record<TabKey, BookmarkItem[]> = {
  editorial: [],
  mcq: [],
  'answer-writing': [],
  pyq: [],
  flashcard: [],
  video: [],
};

export default function SavedNotesPage() {
  const [itemsByTab, setItemsByTab] = useState<Record<TabKey, BookmarkItem[]>>(EMPTY_ITEMS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('editorial');
  const [activeChip, setActiveChip] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);

  const loadAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      editorialService.getStats().catch(() => null),
      bookmarkService.list('mcq').catch(() => null),
      bookmarkService.list('answer-writing').catch(() => null),
      bookmarkService.list('pyq').catch(() => null),
      bookmarkService.list('flashcard').catch(() => null),
      bookmarkService.list('video').catch(() => null),
    ])
      .then(([editorialRes, mcqRes, awRes, pyqRes, fcRes, videoRes]) => {
        const editorialItems: BookmarkItem[] = (editorialRes?.data?.savedItems || []).map((note: any) => ({
          id: note.id,
          type: 'editorial',
          entityId: note.id,
          title: note.title,
          source: note.source,
          sourceUrl: null,
          tag: note.category,
          tagColor: null,
          content: { summary: note.summary, tags: note.tags, category: note.category },
          createdAt: note.savedAt,
          isPinned: false,
        }));

        setItemsByTab({
          editorial: editorialItems,
          mcq: mcqRes?.data?.bookmarks || [],
          'answer-writing': awRes?.data?.bookmarks || [],
          pyq: pyqRes?.data?.bookmarks || [],
          flashcard: fcRes?.data?.bookmarks || [],
          video: videoRes?.data?.bookmarks || [],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    setActiveChip('All');
  }, [activeTab]);

  const chipCounts = useMemo(() => {
    const items = itemsByTab[activeTab] || [];
    const query = search.trim().toLowerCase();
    const base = items.filter((item) => {
      if (!query) return true;
      const haystack = `${item.title} ${item.source} ${item.tag ?? ''} ${JSON.stringify(item.content ?? {})}`.toLowerCase();
      return haystack.includes(query);
    });

    const counts: Record<string, number> = {};
    FILTER_CHIPS[activeTab].forEach((chip) => {
      if (chip === 'All') {
        counts[chip] = base.length;
      } else if (chip === 'Starred') {
        counts[chip] = base.filter((item) => item.isPinned).length;
      } else {
        counts[chip] = base.filter((item) => {
          const status = statusFieldFor(activeTab, item);
          const normalized = status ? STATUS_LABEL_NORMALIZE[status.toLowerCase().replace(/\s+/g, '')] : undefined;
          return normalized === chip;
        }).length;
      }
    });
    return counts;
  }, [itemsByTab, activeTab, search]);

  const filteredItems = useMemo(() => {
    const items = itemsByTab[activeTab] || [];
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      if (activeChip !== 'All') {
        if (activeChip === 'Starred') {
          if (!item.isPinned) return false;
        } else {
          const status = statusFieldFor(activeTab, item);
          const normalized = status ? STATUS_LABEL_NORMALIZE[status.toLowerCase().replace(/\s+/g, '')] : undefined;
          if (normalized !== activeChip) return false;
        }
      }
      if (!query) return true;
      const haystack = `${item.title} ${item.source} ${item.tag ?? ''} ${JSON.stringify(item.content ?? {})}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [itemsByTab, activeTab, activeChip, search]);

  const handleTogglePin = async (item: BookmarkItem) => {
    try {
      await bookmarkService.togglePin(item.id);
      setItemsByTab((prev) => ({
        ...prev,
        [activeTab]: prev[activeTab].map((it) => (it.id === item.id ? { ...it, isPinned: !it.isPinned } : it)),
      }));
    } catch {}
  };

  const handleDelete = async (item: BookmarkItem) => {
    try {
      if (item.type === 'editorial') {
        await editorialService.toggleSave(item.entityId);
      } else {
        await bookmarkService.remove(item.id);
      }
      setItemsByTab((prev) => ({
        ...prev,
        [activeTab]: prev[activeTab].filter((it) => it.id !== item.id),
      }));
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      <section className="relative overflow-hidden bg-[#020A1D] px-4 pb-10 pt-5 sm:px-6 lg:px-10">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage: 'radial-gradient(circle at 0% 30%, rgba(255,255,255,0.14), transparent 32%)',
          }}
        />

        <div className="relative mx-auto max-w-5xl text-center">
          <p className="flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.28em] text-[#D6A94F]">
            <span style={{ display: 'block', width: 44, height: 1, background: 'linear-gradient(to right, transparent, #C8972A)' }} />
            Your Bookmarks Vault
            <span style={{ display: 'block', width: 44, height: 1, background: 'linear-gradient(to left, transparent, #C8972A)' }} />
          </p>
          <h1
            className="mx-auto mt-4 max-w-[920px] text-center text-white"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '60.8px',
              fontStyle: 'normal',
              fontWeight: 600,
              lineHeight: '66.88px',
            }}
          >
            Everything you&apos;ve <span className="italic text-[#E8B84B]">saved</span>, in one place
          </h1>
          <p
            className="mx-auto mt-5 max-w-[710px] text-[15px] leading-[26.25px] text-[rgba(255,255,255,0.48)]"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Articles, MCQs, questions, flashcards, lectures all your bookmarks from every module, tagged and ready for revision.
          </p>

          <div
            className="mx-auto mt-7 flex max-w-[860px] items-center rounded-[12px] border px-[17px] py-[5px] backdrop-blur"
            style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.13)' }}
          >
            <span className="mr-3 text-[15px] text-[rgba(255,255,255,0.3)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search across all saved items…"
              className="w-full bg-transparent py-[10px] text-[15px] text-[#E2E8F0] placeholder:text-[#757575] outline-none"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            />
            <span
              className="rounded-[6px] border px-3 py-1.5 text-[11px] text-[rgba(255,255,255,0.3)]"
              style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }}
            >
              ⌘K
            </span>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-12 pt-5 sm:px-6 lg:px-10">
        {/* Tab bar */}
        <div
          className="mb-4 flex flex-wrap items-center gap-1 rounded-t-xl px-2 text-sm"
          style={{ background: '#F4F6FA', borderBottom: '1px solid rgba(11,22,40,0.09)', boxShadow: '0px 2px 6px rgba(11,22,40,0.06)' }}
        >
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="flex items-center gap-[7px] border-b-2 px-[18px] py-[14px] transition"
                style={{
                  color: active ? '#E8B84B' : '#6B7A99',
                  borderColor: active ? '#E8B84B' : 'transparent',
                  fontWeight: active ? 700 : 500,
                }}
              >
                <Icon size={14} className="text-[#6B7A99]" />
                {label}
                <span
                  className="rounded-[20px] px-[7px] py-[1px] text-[10px] font-bold"
                  style={{ background: 'rgba(11,22,40,0.09)', color: '#6B7A99' }}
                >
                  {itemsByTab[key].length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sub-filter chips + Save button */}
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {FILTER_CHIPS[activeTab].map((chip) => {
              const active = activeChip === chip;
              const ChipIcon = CHIP_ICONS[chip];
              const iconColor = !active && chip === 'Got Wrong' ? '#DC2626' : !active && chip === 'Starred' ? '#D97706' : undefined;
              return (
                <button
                  key={chip}
                  onClick={() => setActiveChip(chip)}
                  className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition"
                  style={{
                    borderColor: active ? '#101828' : '#E5EAF3',
                    background: active ? '#101828' : '#FFFFFF',
                    color: active ? '#FFFFFF' : '#5A6B85',
                  }}
                >
                  {ChipIcon && (
                    <span className="shrink-0" style={iconColor ? { color: iconColor } : undefined}>
                      <ChipIcon size={13} />
                    </span>
                  )}
                  {chip}
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[11px]"
                    style={{
                      background: active ? 'rgba(255,255,255,0.16)' : '#EEF1F6',
                      color: active ? '#FFFFFF' : '#8A97AE',
                    }}
                  >
                    {chipCounts[chip] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-full px-4 py-2 text-xs font-semibold text-white"
            style={{ background: '#101828' }}
          >
            {SAVE_LABELS[activeTab]}
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-[#5A6B85]">Loading bookmarks...</div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-10 text-center text-[#5A6B85]">
            No bookmarks found for this filter.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item, index) => (
              <BookmarkCard
                key={item.id}
                item={item}
                index={index}
                onTogglePin={activeTab === 'editorial' ? undefined : handleTogglePin}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      <SaveBookmarkModal
        open={modalOpen}
        entityType={activeTab}
        onClose={() => setModalOpen(false)}
        onSaved={loadAll}
      />
    </div>
  );
}
