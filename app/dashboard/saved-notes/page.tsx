'use client';

import { useEffect, useMemo, useState } from 'react';
import { editorialService } from '@/lib/services';

interface SavedEditorial {
  id: string;
  title: string;
  summary: string | null;
  source: string;
  category: string;
  tags: string[];
  savedAt?: string;
}

const CARD_ACCENTS = ['#63BF7A', '#F59E0B', '#8B5CF6', '#60A5FA', '#EC4899'];

export default function SavedNotesPage() {
  const [savedNotes, setSavedNotes] = useState<SavedEditorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');

  useEffect(() => {
    editorialService
      .getStats()
      .then((res) => {
        if (res.data?.savedItems && Array.isArray(res.data.savedItems)) {
          setSavedNotes(res.data.savedItems);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = savedNotes.filter((note) => {
      const matchesFilter = activeFilter === 'ALL' || note.category === activeFilter;
      if (!matchesFilter) return false;
      if (!query) return true;
      const haystack = `${note.title} ${note.summary ?? ''} ${note.source} ${(note.tags ?? []).join(' ')}`.toLowerCase();
      return haystack.includes(query);
    });

    return filtered.reduce<Record<string, SavedEditorial[]>>((acc, note) => {
      const key = note.category || 'General';
      if (!acc[key]) acc[key] = [];
      acc[key].push(note);
      return acc;
    }, {});
  }, [savedNotes, search, activeFilter]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: savedNotes.length };
    for (const note of savedNotes) {
      const key = note.category || 'General';
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [savedNotes]);

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
        <div className="mb-7 flex flex-wrap items-center gap-3 border-b border-[#E5EAF3] pb-4 text-sm">
          {Object.entries(categoryCounts).map(([name, count]) => (
            <button
              key={name}
              onClick={() => setActiveFilter(name)}
              className="rounded-full px-3 py-1.5 transition"
              style={{
                color: activeFilter === name ? '#C98A1D' : '#5A6B85',
                background: activeFilter === name ? '#FFF4DD' : 'transparent',
                fontWeight: activeFilter === name ? 600 : 500,
              }}
            >
              {name} <span className="ml-1 text-xs opacity-70">{count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 text-center text-[#5A6B85]">Loading bookmarks...</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-10 text-center text-[#5A6B85]">
            No bookmarks found for this filter.
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([section, items]) => (
              <section key={section}>
                <div className="mb-4 flex items-end justify-between border-b border-[#E5EAF3] pb-2">
                  <div>
                    <h2 className="text-[30px] font-semibold leading-none text-[#0B1323]">{section}</h2>
                    <p className="mt-2 text-sm text-[#6A7892]">{items.length} resources</p>
                  </div>
                  <span className="text-2xl text-[#9AA7BD]">{items.length}</span>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((note, idx) => {
                    const accent = CARD_ACCENTS[idx % CARD_ACCENTS.length];
                    const chips = (note.tags?.length ? note.tags : [note.category]).slice(0, 3);
                    return (
                      <article
                        key={note.id}
                        className="rounded-2xl border border-[#E8EDF5] bg-white p-4"
                        style={{ borderLeft: `3px solid ${accent}` }}
                      >
                        <div className="mb-3 flex items-center justify-between text-[11px] text-[#8A97AE]">
                          <div className="flex items-center gap-1.5">
                            <span className="rounded-full bg-[#EEF3FF] px-2 py-0.5 text-[#4F46E5]">GS</span>
                            <span className="rounded-full bg-[#FFF4DD] px-2 py-0.5 text-[#C98A1D]">PRELIMS</span>
                            <span>{note.source || 'Source'}</span>
                          </div>
                          <span>{note.savedAt ? new Date(note.savedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : ''}</span>
                        </div>

                        <h3 className="line-clamp-2 text-[21px] font-semibold leading-7 text-[#121A2D]">{note.title}</h3>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#5C6B85]">{note.summary || 'Saved for quick revision.'}</p>

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {chips.map((tag) => (
                            <span key={tag} className="rounded-md bg-[#FFF4DD] px-2 py-1 text-[11px] text-[#B7791F]">
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-[#EEF2F8] pt-3">
                          <span className="rounded-full bg-[#FFF4DD] px-2.5 py-1 text-xs text-[#A87216]">Revision</span>
                          <button
                            onClick={() => setSavedNotes((prev) => prev.filter((x) => x.id !== note.id))}
                            className="rounded-lg border border-[#F4D7D9] px-2.5 py-1 text-xs text-[#C2414D]"
                          >
                            Remove
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
