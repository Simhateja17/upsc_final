'use client';

import { useEffect, useMemo, useState } from 'react';
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

export default function QAForumPage() {
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
    <div className="min-h-screen bg-[#F4F6FA] font-inter text-[#0C1424]">
      <DashboardPageHero
        badgeIcon={<img src="/cap.png" alt="cap" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />}
        badgeText="DISCUSSION FORUM"
        title={
          <>
            Ask, <em className="not-italic" style={{ color: '#e8a820', fontStyle: 'italic' }}>Discuss</em>, Rise Together
          </>
        }
        subtitle="Your community of UPSC aspirants. Every doubt answered, every insight shared."
        stats={[
          { value: '2.6K', label: 'Questions Asked', color: '#FDC700' },
          { value: '89K+', label: 'Answers Given', color: '#F87171' },
          { value: '547', label: 'Active Right Now', color: '#4ADE80' },
          { value: '∞', label: 'Always Free', color: '#FFFFFF' },
        ]}
      />

      <main className="mx-auto mt-2 grid max-w-[1180px] grid-cols-1 gap-6 px-4 pb-14 lg:grid-cols-[220px_1fr]">
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
              <span className="h-2 w-2 rounded-full bg-gray-400" />
              All Subjects
            </span>
            <span className="rounded-full bg-[#EEF2F7] px-2 text-[10px] text-[#6B7A99]">
              {subjects.reduce((sum, s) => sum + s.count, 0)}
            </span>
          </div>
          {subjects.map((item) => (
            <div
              key={item.label}
              onClick={() => setActiveSubject(item.label)}
              className={`flex items-center justify-between rounded-[8px] px-3 py-2 text-[12px] cursor-pointer transition-colors ${activeSubject === item.label ? 'bg-[#090E1C] text-[#E8B84B]' : 'text-[#6B7A99] hover:bg-[#F8FAFC]'}`}
            >
              <span className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full" style={{ background: subjectStyle(item.label).stripe }} />
                {item.label}
              </span>
              <span className="rounded-full bg-[#EEF2F7] px-2 text-[10px] text-[#6B7A99]">{item.count}</span>
            </div>
          ))}
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
                        <span className="flex items-center gap-1">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                          {post.answerCount ?? 0} replies
                        </span>
                        <span className="flex items-center gap-1">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                          {post.views} views
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleBookmark(post.id, post.isBookmarked); }}
                          className={`flex items-center gap-1 transition-colors ${post.isBookmarked ? 'text-[#E8B84B]' : 'text-[#C99730] hover:text-[#E8B84B]'}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill={post.isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
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
      </main>

      {askOpen && <AskModal onClose={() => setAskOpen(false)} onCreated={fetchPosts} />}
      {detailPostId && <DetailModal postId={detailPostId} onClose={() => setDetailPostId(null)} />}
    </div>
  );
}

function AskModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || !subject.trim()) return;
    setSubmitting(true);
    try {
      await forumService.createPost({
        title: title.trim(),
        body: body.trim(),
        subject: subject.trim(),
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      onClose();
      onCreated();
    } catch (err: any) {
      alert(err?.message || 'Failed to post question');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-[14px] bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[18px] font-bold text-[#0C1424]">Ask a Question</h3>
          <button onClick={onClose} className="text-[#9AA3B8] hover:text-[#0C1424]">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-[#6B7A99]">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-[10px] border border-[#E1E6EF] px-4 py-2 text-[13px] outline-none focus:border-[#E8B84B]"
              placeholder="e.g. What is the difference between..."
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-[#6B7A99]">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-[10px] border border-[#E1E6EF] px-4 py-2 text-[13px] outline-none focus:border-[#E8B84B]"
              placeholder="e.g. Indian Polity"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-[#6B7A99]">Tags (comma separated)</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full rounded-[10px] border border-[#E1E6EF] px-4 py-2 text-[13px] outline-none focus:border-[#E8B84B]"
              placeholder="Prelims, Mains, Current Affairs"
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-[#6B7A99]">Details</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="w-full rounded-[10px] border border-[#E1E6EF] px-4 py-2 text-[13px] outline-none focus:border-[#E8B84B]"
              placeholder="Describe your doubt in detail..."
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-[10px] border border-[#E1E6EF] px-4 py-2 text-[13px] font-semibold text-[#6B7A99]">Cancel</button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-[10px] bg-[#090E1C] px-5 py-2 text-[13px] font-bold text-white disabled:opacity-60"
            >
              {submitting ? 'Posting...' : 'Post Question'}
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
