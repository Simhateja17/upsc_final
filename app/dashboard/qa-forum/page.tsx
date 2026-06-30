'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardPageHero from '@/components/DashboardPageHero';
import { forumService } from '@/lib/services';

interface ForumUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
}

interface ForumPost {
  id: string;
  title: string;
  body: string;
  subject: string;
  tags: string[];
  status: string;
  votes: number;
  views: number;
  createdAt: string;
  user: ForumUser;
  answerCount?: number;
  userVote?: number;
  isBookmarked?: boolean;
}

interface ForumAnswer {
  id: string;
  body: string;
  votes: number;
  isAccepted: boolean;
  createdAt: string;
  user: ForumUser;
  userVote?: number;
}

interface SubjectItem {
  label: string;
  count: number;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function initials(u?: ForumUser | null) {
  const first = u?.firstName?.[0] ?? '';
  const last = u?.lastName?.[0] ?? '';
  return (first + last) || '?';
}

function displayName(u?: ForumUser | null) {
  if (!u) return 'Anonymous';
  return [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Anonymous';
}

function badgeFromStatus(status: string) {
  switch (status) {
    case 'answered':
      return { label: 'Answered', bg: '#ECFDF5', text: '#16A34A' };
    case 'top':
      return { label: 'Top', bg: '#F3E8FF', text: '#9333EA' };
    default:
      return { label: 'Open', bg: '#FEF3C7', text: '#D08700' };
  }
}

const SUBJECT_PALETTE: Record<string, { bg: string; stripe: string; badgeBg: string; badgeText: string }> = {
  'Indian Polity': { bg: '#E8F5E9', stripe: '#86EFAC', badgeBg: '#EFF6FF', badgeText: '#2563EB' },
  'Economy': { bg: '#FFF8E1', stripe: '#FDE047', badgeBg: '#FFF7ED', badgeText: '#D08700' },
  'History': { bg: '#F3E8FF', stripe: '#D8B4FE', badgeBg: '#F3E8FF', badgeText: '#9333EA' },
  'Ethics': { bg: '#DBEAFE', stripe: '#93C5FD', badgeBg: '#DBEAFE', badgeText: '#2563EB' },
  'Geography': { bg: '#E0F2FE', stripe: '#7DD3FC', badgeBg: '#E0F2FE', badgeText: '#0284C7' },
  'Environment & Ecology': { bg: '#E8F5E9', stripe: '#4ADE80', badgeBg: '#ECFDF5', badgeText: '#16A34A' },
  'Science & Technology': { bg: '#F3E8FF', stripe: '#A78BFA', badgeBg: '#F3E8FF', badgeText: '#9333EA' },
};

function subjectStyle(subject: string) {
  return (
    SUBJECT_PALETTE[subject] ?? {
      bg: '#F8FAFC',
      stripe: '#CBD5E1',
      badgeBg: '#F1F5F9',
      badgeText: '#475569',
    }
  );
}

const FORUM_SUBJECTS = [
  { label: 'Indian Polity', icon: '⚖️' },
  { label: 'History', icon: '🏛️' },
  { label: 'Economy', icon: '💰' },
  { label: 'Geography', icon: '🌍' },
  { label: 'Ethics & GS4', icon: '📜' },
  { label: 'Current Affairs', icon: '🗞️' },
  { label: 'Science & Tech', icon: '🔬' },
  { label: 'Mains Strategy', icon: '✏️' },
  { label: 'Environment & Ecology', icon: '🌿' },
  { label: 'Art & Culture', icon: '🏺' },
];

export default function QAForumPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeBrowse, setActiveBrowse] = useState('Home Feed');
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [sort, setSort] = useState<'latest' | 'top' | 'unanswered'>('latest');
  const [search, setSearch] = useState('');

  const [askOpen, setAskOpen] = useState(false);
  const [detailPostId, setDetailPostId] = useState<string | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let res: any;
      if (activeBrowse === 'My Questions') {
        res = await forumService.getMyPosts();
      } else if (activeBrowse === 'My Answers') {
        const ansRes = await forumService.getMyAnswers();
        // my-answers returns answers; we can show them as a list of linked posts
        const mapped = (ansRes.data ?? []).map((a: any) => ({
          id: a.post?.id ?? a.id,
          title: a.post?.title ?? 'Untitled',
          body: a.body,
          subject: a.post?.subject ?? 'General',
          tags: [],
          status: 'answered',
          votes: a.votes,
          views: 0,
          createdAt: a.createdAt,
          user: a.user,
          answerCount: 0,
        }));
        setPosts(mapped);
        setLoading(false);
        return;
      } else if (activeBrowse === 'Saved Posts') {
        res = await forumService.getBookmarks();
      } else {
        const sortParam = activeBrowse === 'Trending' ? 'top' : sort;
        res = await forumService.getPosts({
          sort: sortParam,
          subject: activeSubject ?? undefined,
          search: search || undefined,
          page: 1,
          limit: 20,
        });
      }
      setPosts(res.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await forumService.getSubjects();
      setSubjects(res.data ?? []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBrowse, activeSubject, sort, search]);

  const handleVotePost = async (postId: string, direction: 1 | -1, currentVote?: number) => {
    try {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const oldVote = currentVote ?? 0;
          let newVote: number = direction;
          let delta: number = direction;
          if (oldVote === direction) {
            newVote = 0;
            delta = -direction;
          } else if (oldVote !== 0) {
            delta = direction - oldVote;
          }
          return { ...p, votes: p.votes + delta, userVote: newVote };
        })
      );
      await forumService.vote({ postId, direction });
    } catch {
      fetchPosts();
    }
  };

  const handleBookmark = async (postId: string, isBookmarked?: boolean) => {
    try {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, isBookmarked: !isBookmarked } : p))
      );
      if (isBookmarked) {
        await forumService.deleteBookmark(postId);
      } else {
        await forumService.createBookmark(postId);
      }
    } catch {
      fetchPosts();
    }
  };

  const browseItems = [
    { label: 'Home Feed', icon: '🏠' },
    { label: 'My Questions', icon: '❓' },
    { label: 'My Answers', icon: '💬' },
    { label: 'Saved Posts', icon: '🔖' },
    { label: 'Trending', icon: '🔥', badge: 'New' },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-arimo text-[#0C1424]">
      <DashboardPageHero
        // eslint-disable-next-line @next/next/no-img-element
        badgeIcon={<img src="/cap.png" alt="cap" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />}
        badgeText="DISCUSSION FORUM"
        title={
          <>
            Ask, <em className="not-italic" style={{ color: '#E8B84B', fontStyle: 'italic' }}>Discuss</em>, Rise Together
          </>
        }
        subtitle="Your community of 15,000+ UPSC aspirants. Every doubt answered, every insight shared."
        buttons={
          <>
            <button
              type="button"
              onClick={() => setAskOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                minWidth: '180px',
                height: '46px',
                background: '#E8B84B',
                color: '#0C1424',
                border: 'none',
                borderRadius: '8px',
                padding: '0 22px',
                fontSize: '14px',
                fontWeight: 700,
                fontFamily: 'var(--font-arimo), Arimo, sans-serif',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Ask a Question
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard/study-groups')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                minWidth: '190px',
                height: '46px',
                background: 'transparent',
                color: '#FFFFFF',
                border: '1.5px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                padding: '0 22px',
                fontSize: '14px',
                fontWeight: 700,
                fontFamily: 'var(--font-arimo), Arimo, sans-serif',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Join Study Room
            </button>
          </>
        }
        stats={[
          { value: '24.6K', label: 'Questions Asked', color: '#FDC700' },
          { value: '89.2K', label: 'Answers Given', color: '#F87171' },
          { value: '547', label: 'Active Right Now', color: '#4ADE80' },
          { value: '∞', label: 'Always Free', color: '#FFFFFF' },
        ]}
        heroHeight="400px"
        contentShiftY={0}
        enforceUniformLayout={false}
      />

      <main className="mx-auto mt-2 grid max-w-[1400px] grid-cols-1 gap-6 px-4 pb-14 lg:grid-cols-[220px_1fr_240px]">
        <aside className="h-fit rounded-[14px] bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[1.5px] text-[#6B7A99]">Browse</h2>
          {browseItems.map((item, index) => {
            const active = activeBrowse === item.label;
            return (
              <button
                key={item.label}
                onClick={() => { setActiveBrowse(item.label); setActiveSubject(null); }}
                className={`mb-1 flex w-full items-center justify-between rounded-[8px] px-3 py-2 text-left text-[13px] font-semibold ${active ? 'bg-[#090E1C] text-[#E8B84B]' : 'text-[#6B7A99] hover:bg-[#F8FAFC]'}`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-[14px]">{item.icon}</span>
                  {item.label}
                </span>
                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span className="rounded-[4px] bg-[#FEE2E2] px-1.5 py-0.5 text-[9px] font-bold text-[#EF4444]">{item.badge}</span>
                  )}
                </div>
              </button>
            );
          })}

          <h2 className="mb-3 mt-6 text-[10px] font-bold uppercase tracking-[1.5px] text-[#6B7A99]">Subjects</h2>
          <div
            onClick={() => setActiveSubject(null)}
            className={`flex items-center justify-between rounded-[8px] px-3 py-2 text-[12px] cursor-pointer transition-colors ${activeSubject === null ? 'bg-[#090E1C] text-[#E8B84B]' : 'text-[#6B7A99] hover:bg-[#F8FAFC]'}`}
          >
            <span className="flex items-center gap-2.5">
              <span className="text-[15px]">📚</span>
              All Subjects
            </span>
            <span className="rounded-full bg-[#EEF2F7] px-2 text-[10px] text-[#6B7A99]">
              {subjects.reduce((sum, s) => sum + s.count, 0)}
            </span>
          </div>
          {FORUM_SUBJECTS.map((item) => {
            const apiEntry = subjects.find((s) => s.label.toLowerCase() === item.label.toLowerCase());
            const count = apiEntry?.count ?? 0;
            const active = activeSubject === item.label;
            return (
              <div
                key={item.label}
                onClick={() => setActiveSubject(item.label)}
                className={`flex items-center justify-between rounded-[8px] px-3 py-2 text-[12px] cursor-pointer transition-colors ${active ? 'bg-[#090E1C] text-[#E8B84B]' : 'text-[#6B7A99] hover:bg-[#F8FAFC]'}`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-[15px]">{item.icon}</span>
                  {item.label}
                </span>
                {count > 0 && (
                  <span className="rounded-full bg-[#EEF2F7] px-2 text-[10px] text-[#6B7A99]">{count}</span>
                )}
              </div>
            );
          })}
        </aside>

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              {(['latest', 'top', 'unanswered'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-[12px] font-semibold ${sort === s ? 'border-[#E8B84B] bg-[#E8B84B]/10 text-[#C99730]' : 'border-[#DDE3EC] bg-white text-[#6B7A99]'}`}
                >
                  {s === 'latest' && <span>✨</span>}
                  {s === 'top' && <span>🔥</span>}
                  {s === 'unanswered' && <span>❓</span>}
                  {s[0].toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-[10px] border border-[#E1E6EF] bg-white px-4 py-2 text-[13px] text-[#9AA3B8]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search discussions..."
                  className="bg-transparent outline-none text-[#0C1424] placeholder:text-[#9AA3B8] w-40"
                />
              </div>
              <button
                onClick={() => setAskOpen(true)}
                className="flex items-center gap-1.5 rounded-[10px] bg-[#090E1C] px-5 py-2 text-[13px] font-bold text-white"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5v14"/></svg>
                Ask Question
              </button>
            </div>
          </div>

          {loading && <div className="py-10 text-center text-[#6B7A99]">Loading...</div>}

          <div className="space-y-4">
            {!loading && posts.length === 0 && (
              <div className="rounded-[14px] border border-[#E1E6EF] bg-white p-8 text-center text-[#6B7A99]">
                No discussions found. Be the first to ask a question!
              </div>
            )}
            {posts.map((post) => {
              const style = subjectStyle(post.subject);
              const badge = badgeFromStatus(post.status);
              const firstTag = post.tags?.[0] ?? 'General';
              return (
                <article key={post.id} className="flex overflow-hidden rounded-[14px] border border-[#E1E6EF] bg-white shadow-sm">
                  <div className="w-[6px] shrink-0" style={{ background: style.stripe }} />
                  <div className="flex w-[56px] shrink-0 flex-col items-center justify-center gap-1 py-5" style={{ background: style.bg }}>
                    <button
                      onClick={() => handleVotePost(post.id, 1, post.userVote)}
                      className={`transition-colors text-[12px] ${post.userVote === 1 ? 'text-[#E8B84B]' : 'text-[#9AA3B8] hover:text-[#0C1424]'}`}
                    >▲</button>
                    <span className="text-[15px] font-bold text-[#0C1424]">{post.votes}</span>
                    <button
                      onClick={() => handleVotePost(post.id, -1, post.userVote)}
                      className={`transition-colors text-[12px] ${post.userVote === -1 ? 'text-[#EF4444]' : 'text-[#9AA3B8] hover:text-[#0C1424]'}`}
                    >▼</button>
                  </div>
                  <div className="flex-1 p-5 cursor-pointer" onClick={() => setDetailPostId(post.id)}>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-[6px] px-3 py-1 text-[10px] font-bold uppercase" style={{ background: badge.bg, color: badge.text }}>{badge.label}</span>
                      <span className="rounded-[6px] px-3 py-1 text-[10px] font-bold uppercase" style={{ background: style.badgeBg, color: style.badgeText }}>{post.subject}</span>
                      <span className="rounded-[6px] bg-[#FFF7ED] px-3 py-1 text-[10px] font-bold uppercase text-[#D08700]">{firstTag}</span>
                    </div>
                    <h2 className="mb-2 text-[16px] font-bold leading-snug text-[#0C1424]">{post.title}</h2>
                    <p className="mb-4 text-[13px] leading-[1.6] text-[#6B7A99] line-clamp-2">{post.body}</p>
                    <div className="flex flex-wrap items-center gap-4 text-[12px] text-[#9AA3B8]">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#090E1C] text-[10px] font-bold text-white">
                          {initials(post.user)}
                        </div>
                        <span className="font-medium text-[#0C1424]">{displayName(post.user)}</span>
                        <span>· {timeAgo(post.createdAt)}</span>
                      </div>
                      <div className="ml-auto flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                          <span aria-hidden>💬</span>
                          {post.answerCount ?? 0} replies
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span aria-hidden>👁</span>
                          {post.views} views
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleBookmark(post.id, post.isBookmarked); }}
                          className={`flex items-center gap-1.5 transition-colors ${post.isBookmarked ? 'text-[#E8B84B]' : 'text-[#C99730] hover:text-[#E8B84B]'}`}
                        >
                          <span aria-hidden>🔖</span>
                          {post.isBookmarked ? 'Saved' : 'Save'}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ── Right Sidebar ── */}
        <aside className="hidden lg:flex flex-col gap-4 h-fit sticky top-4">

          {/* Live Study Rooms */}
          <div className="rounded-[14px] border border-[#E1E6EF] bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[1.5px] text-[#6B7A99]">
              🏛️ Live Study Rooms
            </h3>
            <div className="flex flex-col gap-2">
              {[
                { name: 'Polity Warriors', count: 18, icon: '🏛️', color: '#EFF6FF', iconColor: '#2563EB' },
                { name: 'History Explorers', count: 12, icon: '🏛️', color: '#F5F3FF', iconColor: '#7C3AED' },
                { name: 'Geography Navigators', count: 8, icon: '🌍', color: '#ECFDF5', iconColor: '#16A34A' },
              ].map((room) => (
                <div key={room.name} className="flex items-center gap-3 rounded-[10px] p-2 hover:bg-[#F8FAFC] transition-colors">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-[16px]"
                    style={{ background: room.color }}
                  >
                    {room.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-[#0C1424] truncate">{room.name}</p>
                    <p className="text-[11px] text-[#6B7A99]">{room.count} active now</p>
                  </div>
                  <span className="h-2 w-2 shrink-0 rounded-full bg-[#22C55E]" />
                </div>
              ))}
            </div>
            <button
              onClick={() => window.location.href = '/dashboard/study-groups'}
              className="mt-3 w-full rounded-[8px] border border-[#E8B84B] py-2 text-[12px] font-bold text-[#C99730] hover:bg-[#FFF8E7] transition-colors"
            >
              View All Rooms →
            </button>
          </div>

          {/* Top Contributors */}
          <div className="rounded-[14px] border border-[#E8B84B]/40 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3" style={{ background: '#FFF8E7' }}>
              <h3 className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#C99730]">
                ⭐ Top Contributors
              </h3>
            </div>
            <div className="flex flex-col gap-0 p-3">
              {[
                { rank: 1, initials: 'SK', name: 'Sneha K.', answers: 234, color: '#EC4899' },
                { rank: 2, initials: 'VR', name: 'Vikram R.', answers: 189, color: '#F97316' },
                { rank: 3, initials: 'AP', name: 'Arjun P.', answers: 156, color: '#8B5CF6' },
              ].map((c) => (
                <div key={c.rank} className="flex items-center gap-3 rounded-[8px] px-2 py-2.5 hover:bg-[#F8FAFC] transition-colors">
                  <span className="w-4 text-[11px] font-bold text-[#9AA3B8]">{c.rank}.</span>
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ background: c.color }}
                  >
                    {c.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-[#0C1424]">{c.name}</p>
                    <p className="text-[11px] text-[#6B7A99]">{c.answers} answers</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Community Guidelines */}
          <div
            className="rounded-[14px] p-4"
            style={{ background: '#FFF5F5', border: '1px solid #FECACA' }}
          >
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-[#EF4444]">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="9" x2="12" y2="13" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/>
                <line x1="12" y1="17" x2="12.01" y2="17" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Community Guidelines
            </p>
            <p className="text-[11px] leading-[1.6] text-[#374151]">
              Be respectful &amp; constructive. Violations may lead to{' '}
              <strong className="text-[#EF4444]">permanent deactivation</strong> from Rise With Jeet.
            </p>
          </div>

        </aside>
      </main>

      {askOpen && <AskModal onClose={() => setAskOpen(false)} onCreated={fetchPosts} />}
      {detailPostId && <DetailModal postId={detailPostId} onClose={() => setDetailPostId(null)} />}
    </div>
  );
}

const UPSC_SUBJECTS = [
  'Indian Polity & Governance',
  'Indian History',
  'Geography',
  'Indian Economy',
  'Environment & Ecology',
  'Science & Technology',
  'Current Affairs',
  'Ethics, Integrity & Aptitude',
  'Art & Culture',
  'International Relations',
  'Social Issues',
  'Internal Security',
  'Disaster Management',
  'Agriculture',
  'General Studies',
];

const TAG_SUGGESTIONS = [
  'Prelims', 'Mains', 'Current Affairs', 'UPSC', 'IAS',
  'Optional', 'Essay', 'Interview', 'GS1', 'GS2', 'GS3', 'GS4',
  'Polity', 'History', 'Geography', 'Economy', 'Environment',
  'Science', 'Ethics', 'Art', 'Culture', 'Security',
];

const TAG_SHORTCUTS: Record<string, string> = {
  p: 'Prelims',
  m: 'Mains',
  c: 'Current Affairs',
  u: 'UPSC',
  i: 'IAS',
  o: 'Optional',
  e: 'Essay',
  g: 'GS',
};

const QUERY_TYPES = [
  { value: 'General', icon: '🌐' },
  { value: 'Prep Related', icon: '🗒️' },
  { value: 'Subject Related', icon: '📖' },
  { value: 'Specific Subject', icon: '🎯' },
];

const SUBJECT_TAGS = [
  { label: 'Indian Polity', emoji: '🏛️', bg: '#FFF8E7', border: '#E8B84B', text: '#C99730' },
  { label: 'History', emoji: '📜', bg: '#FDF4F0', border: '#E8C4A0', text: '#A0522D' },
  { label: 'Economy', emoji: '📊', bg: '#F0FDF4', border: '#86EFAC', text: '#16A34A' },
  { label: 'Geography', emoji: '🌍', bg: '#EFF6FF', border: '#93C5FD', text: '#2563EB' },
  { label: 'Ethics & GS4', emoji: '🎯', bg: '#FFF0F6', border: '#F9A8D4', text: '#DB2777' },
  { label: 'Current Affairs', emoji: '📰', bg: '#F5F3FF', border: '#C4B5FD', text: '#7C3AED' },
  { label: 'Science & Tech', emoji: '🔬', bg: '#F0FDFA', border: '#99F6E4', text: '#0F766E' },
  { label: 'Mains Strategy', emoji: '✏️', bg: '#FEFCE8', border: '#FDE047', text: '#A16207' },
  { label: 'Prelims', emoji: '🎯', bg: '#FFF1F2', border: '#FECDD3', text: '#E11D48' },
  { label: 'GS1', emoji: '📚', bg: '#F0FDF4', border: '#86EFAC', text: '#16A34A' },
  { label: 'GS2', emoji: '⚖️', bg: '#F0FDFA', border: '#99F6E4', text: '#0F766E' },
  { label: 'GS3', emoji: '🌿', bg: '#F0FDF4', border: '#86EFAC', text: '#15803D' },
  { label: 'GS4', emoji: '🧠', bg: '#F5F3FF', border: '#C4B5FD', text: '#7C3AED' },
];

function AskModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [queryType, setQueryType] = useState('General');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    const subjectFromTag = selectedTags[0] ?? queryType;
    setSubmitting(true);
    try {
      await forumService.createPost({
        title: title.trim(),
        body: body.trim(),
        subject: subjectFromTag,
        tags: [...selectedTags, queryType].filter(Boolean),
      });
      onClose();
      onCreated();
    } catch (err: any) {
      alert(err?.message || 'Failed to post question');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = title.trim().length > 0 && body.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-[520px] max-h-[92vh] overflow-y-auto rounded-[20px] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between rounded-t-[20px] bg-white px-6 pt-6 pb-4 border-b border-[#F1F3F8]">
          <div>
            <h3 className="text-[22px] font-bold text-[#0C1424]">✏️ Ask a Question</h3>
            <p className="mt-1 text-[13px] text-[#6B7A99]">Be specific. Good questions get great answers from the community.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E1E6EF] text-[#9AA3B8] hover:bg-[#F8FAFC] hover:text-[#0C1424] transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Query Type */}
          <div>
            <label className="mb-3 block text-[11px] font-bold uppercase tracking-[1.5px] text-[#6B7A99]">Query Type</label>
            <div className="grid grid-cols-2 gap-2">
              {QUERY_TYPES.map((q) => {
                const active = queryType === q.value;
                return (
                  <button
                    key={q.value}
                    type="button"
                    onClick={() => setQueryType(q.value)}
                    className="flex items-center gap-2.5 rounded-[12px] border px-4 py-3 text-[13px] font-semibold transition-all"
                    style={{
                      borderColor: active ? '#E8B84B' : '#E1E6EF',
                      background: active ? '#FFFBEF' : '#FAFBFE',
                      color: active ? '#C99730' : '#374151',
                    }}
                  >
                    <span className="text-[15px]">{q.icon}</span>
                    {q.value}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Title */}
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[1.5px] text-[#6B7A99]">Question Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-[12px] border border-[#E1E6EF] bg-[#FAFBFE] px-4 py-3 text-[13px] text-[#0C1424] outline-none placeholder:text-[#9AA3B8] focus:border-[#E8B84B] transition-colors"
              placeholder="e.g., What is the difference between Article 356 and 352?"
              required
            />
          </div>

          {/* Describe Your Doubt */}
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[1.5px] text-[#6B7A99]">Describe Your Doubt</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-[12px] border border-[#E1E6EF] bg-[#FAFBFE] px-4 py-3 text-[13px] text-[#0C1424] outline-none placeholder:text-[#9AA3B8] focus:border-[#E8B84B] transition-colors"
              placeholder="Add more context — what have you already tried? What specifically is confusing you? The more detail, the better answers you'll get."
              required
            />
          </div>

          {/* Subject Tags */}
          <div>
            <label className="mb-3 block text-[11px] font-bold uppercase tracking-[1.5px] text-[#6B7A99]">Subject Tags</label>
            <div className="flex flex-wrap gap-2">
              {SUBJECT_TAGS.map((tag) => {
                const active = selectedTags.includes(tag.label);
                return (
                  <button
                    key={tag.label}
                    type="button"
                    onClick={() => toggleTag(tag.label)}
                    className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all"
                    style={{
                      background: active ? tag.bg : '#FAFBFE',
                      borderColor: active ? tag.border : '#E1E6EF',
                      color: active ? tag.text : '#6B7A99',
                    }}
                  >
                    <span>{tag.emoji}</span>
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Post Anonymously */}
          <div className="flex items-center justify-between rounded-[12px] border border-[#E1E6EF] bg-[#FAFBFE] px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-[22px]">🎭</span>
              <div>
                <p className="text-[13px] font-semibold text-[#0C1424]">Post Anonymously</p>
                <p className="text-[11px] text-[#9AA3B8]">Your name won&apos;t be shown</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAnonymous((a) => !a)}
              className="relative h-6 w-11 rounded-full transition-colors duration-200"
              style={{ background: anonymous ? '#E8B84B' : '#E1E6EF' }}
            >
              <span
                className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
                style={{ transform: anonymous ? 'translateX(20px)' : 'translateX(2px)' }}
              />
            </button>
          </div>

          {/* Community Guidelines banner */}
          <div className="rounded-[10px] border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-[12px] text-[#374151]">
            <span className="font-bold text-[#D08700]">⚠️ Community Guidelines: </span>
            Be respectful and constructive. Posting offensive or misleading content may result in{' '}
            <strong className="text-[#DC2626]">permanent deactivation</strong> from the Rise With Jeet platform.
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pb-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-[12px] border border-[#E1E6EF] bg-white py-3 text-[14px] font-semibold text-[#374151] hover:bg-[#F8FAFC] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !canSubmit}
              className="flex-[2] rounded-[12px] py-3 text-[14px] font-bold transition-colors disabled:opacity-50"
              style={{
                background: canSubmit ? '#090E1C' : '#6B7A99',
                color: canSubmit ? '#E8B84B' : '#FFFFFF',
              }}
            >
              {submitting ? 'Posting...' : 'Post Question →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DetailModal({ postId, onClose }: { postId: string; onClose: () => void }) {
  const [post, setPost] = useState<ForumPost & { answers: ForumAnswer[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [answerBody, setAnswerBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPost = async () => {
    try {
      const res = await forumService.getPost(postId);
      setPost(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const handleVotePost = async (direction: 1 | -1) => {
    if (!post) return;
    const oldVote = post.userVote ?? 0;
    let newVote: number = direction;
    let delta: number = direction;
    if (oldVote === direction) {
      newVote = 0;
      delta = -direction;
    } else if (oldVote !== 0) {
      delta = direction - oldVote;
    }
    setPost({ ...post, votes: post.votes + delta, userVote: newVote });
    try {
      await forumService.vote({ postId, direction });
    } catch {
      fetchPost();
    }
  };

  const handleVoteAnswer = async (answerId: string, direction: 1 | -1) => {
    if (!post) return;
    setPost({
      ...post,
      answers: post.answers.map((a) => {
        if (a.id !== answerId) return a;
        const oldVote = a.userVote ?? 0;
        let newVote: number = direction;
        let delta: number = direction;
        if (oldVote === direction) {
          newVote = 0;
          delta = -direction;
        } else if (oldVote !== 0) {
          delta = direction - oldVote;
        }
        return { ...a, votes: a.votes + delta, userVote: newVote };
      }),
    });
    try {
      await forumService.vote({ answerId, direction });
    } catch {
      fetchPost();
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerBody.trim()) return;
    setSubmitting(true);
    try {
      await forumService.createAnswer(postId, answerBody.trim());
      setAnswerBody('');
      fetchPost();
    } catch (err: any) {
      alert(err?.message || 'Failed to post answer');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !post) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-2xl rounded-[14px] bg-white p-8 text-center">Loading...</div>
      </div>
    );
  }

  const style = subjectStyle(post.subject);
  const badge = badgeFromStatus(post.status);
  const firstTag = post.tags?.[0] ?? 'General';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[14px] bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E1E6EF] bg-white px-6 py-4">
          <h3 className="text-[16px] font-bold text-[#0C1424]">Discussion</h3>
          <button onClick={onClose} className="text-[#9AA3B8] hover:text-[#0C1424]">✕</button>
        </div>

        <div className="p-6">
          <div className="flex">
            <div className="mr-4 flex flex-col items-center gap-1">
              <button onClick={() => handleVotePost(1)} className={`text-[16px] ${post.userVote === 1 ? 'text-[#E8B84B]' : 'text-[#9AA3B8] hover:text-[#0C1424]'}`}>▲</button>
              <span className="text-[18px] font-bold text-[#0C1424]">{post.votes}</span>
              <button onClick={() => handleVotePost(-1)} className={`text-[16px] ${post.userVote === -1 ? 'text-[#EF4444]' : 'text-[#9AA3B8] hover:text-[#0C1424]'}`}>▼</button>
            </div>
            <div className="flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-[6px] px-3 py-1 text-[10px] font-bold uppercase" style={{ background: badge.bg, color: badge.text }}>{badge.label}</span>
                <span className="rounded-[6px] px-3 py-1 text-[10px] font-bold uppercase" style={{ background: style.badgeBg, color: style.badgeText }}>{post.subject}</span>
                <span className="rounded-[6px] bg-[#FFF7ED] px-3 py-1 text-[10px] font-bold uppercase text-[#D08700]">{firstTag}</span>
              </div>
              <h2 className="mb-2 text-[18px] font-bold text-[#0C1424]">{post.title}</h2>
              <p className="mb-4 text-[14px] leading-[1.7] text-[#374151]">{post.body}</p>
              <div className="flex items-center gap-2 text-[12px] text-[#9AA3B8]">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#090E1C] text-[10px] font-bold text-white">
                  {initials(post.user)}
                </div>
                <span className="font-medium text-[#0C1424]">{displayName(post.user)}</span>
                <span>· {timeAgo(post.createdAt)}</span>
                <span>· {post.views} views</span>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-[#E1E6EF] pt-6">
            <h4 className="mb-4 text-[14px] font-bold text-[#0C1424]">{post.answers.length} Answers</h4>
            <div className="space-y-4">
              {post.answers.map((ans) => (
                <div key={ans.id} className="flex rounded-[10px] border border-[#E1E6EF] bg-[#F8FAFC] p-4">
                  <div className="mr-3 flex flex-col items-center gap-1">
                    <button onClick={() => handleVoteAnswer(ans.id, 1)} className={`text-[14px] ${ans.userVote === 1 ? 'text-[#E8B84B]' : 'text-[#9AA3B8] hover:text-[#0C1424]'}`}>▲</button>
                    <span className="text-[14px] font-bold text-[#0C1424]">{ans.votes}</span>
                    <button onClick={() => handleVoteAnswer(ans.id, -1)} className={`text-[14px] ${ans.userVote === -1 ? 'text-[#EF4444]' : 'text-[#9AA3B8] hover:text-[#0C1424]'}`}>▼</button>
                  </div>
                  <div className="flex-1">
                    <p className="mb-2 text-[13px] leading-[1.7] text-[#374151]">{ans.body}</p>
                    <div className="flex items-center gap-2 text-[11px] text-[#9AA3B8]">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#090E1C] text-[9px] font-bold text-white">
                        {initials(ans.user)}
                      </div>
                      <span className="font-medium text-[#0C1424]">{displayName(ans.user)}</span>
                      <span>· {timeAgo(ans.createdAt)}</span>
                      {ans.isAccepted && <span className="ml-2 rounded-[4px] bg-[#ECFDF5] px-2 py-0.5 text-[10px] font-bold text-[#16A34A]">Accepted</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmitAnswer} className="mt-6">
              <label className="mb-1 block text-[12px] font-semibold text-[#6B7A99]">Your Answer</label>
              <textarea
                value={answerBody}
                onChange={(e) => setAnswerBody(e.target.value)}
                rows={4}
                className="w-full rounded-[10px] border border-[#E1E6EF] px-4 py-2 text-[13px] outline-none focus:border-[#E8B84B]"
                placeholder="Write your answer..."
                required
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-[10px] bg-[#090E1C] px-5 py-2 text-[13px] font-bold text-white disabled:opacity-60"
                >
                  {submitting ? 'Posting...' : 'Post Answer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
