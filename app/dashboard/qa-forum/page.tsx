'use client';

import DashboardPageHero from '@/components/DashboardPageHero';

const posts = [
  { votes: 57, status: 'Answered', subject: 'Indian Polity', tag: 'Mains', title: 'What is the difference between President Rule (Article 356) and National Emergency Article 352?', desc: 'I keep mixing up these two in mock tests. Can someone explain with clear differences and when each is applied? Are there any landmark cases I should know?', user: 'Rahul V.', badge: 'Scholar', time: '3 hours ago', replies: 14, views: 329, bg: '#E8F5E9', stripe: '#86EFAC', statusColor: '#ECFDF5', statusText: '#16A34A' },
  { votes: 43, status: 'Open', subject: 'Economy', tag: 'Current Affairs', title: 'How should we approach the new RBI monetary policy framework for Mains 2026? Any good sources besides the official RBI report?', desc: 'RBI has made some key changes recently. I\'m trying to understand how to frame answers in GS3. Standard notes don\'t seem to cover the nuances...', user: 'Priya D.', badge: 'Pro', time: '5 hours ago', replies: 8, views: 441, bg: '#FFF8E1', stripe: '#FDE047', statusColor: '#FEF3C7', statusText: '#D08700' },
  { votes: 39, status: 'Top', subject: 'History', tag: 'Prelims', title: 'Is the Bhakti Movement more important for Prelims or Mains? How much depth should I go into?', desc: 'I\'ve been spending a lot of time on this topic but not sure how much is enough. PYQs suggest surface-level for Prelims but Mains needs analysis...', user: 'Ananya S.', badge: 'Scholar', time: '8 hours ago', replies: 9, views: 385, bg: '#F3E8FF', stripe: '#D8B4FE', statusColor: '#F3E8FF', statusText: '#9333EA' },
  { votes: 29, status: 'Answered', subject: 'Ethics', tag: 'GS4', title: 'Case Study: A District Magistrate knows a local politician is diverting funds. What are his ethical obligations?', desc: 'Working through this case study for my GS4 practice. Need guidance on structuring the answer and which ethical frameworks to apply.', user: 'Kiran M.', badge: 'Pro', time: 'Yesterday', replies: 6, views: 222, bg: '#DBEAFE', stripe: '#93C5FD', statusColor: '#DBEAFE', statusText: '#2563EB' },
  { votes: 19, status: 'Open', subject: 'Geography', tag: 'Maps', title: 'Confusing myself with Indian Ocean Dipole vs El Nino — can someone give a simple, exam-ready comparison?', desc: 'I understand each individually but always mix them up when answering MCQs under time pressure. A crisp table or framework would help a lot.', user: 'Deepak R.', badge: 'Scholar', time: 'Yesterday', replies: 5, views: 189, bg: '#E0F2FE', stripe: '#7DD3FC', statusColor: '#E0F2FE', statusText: '#0284C7' },
];

const browseItems = [
  { label: 'Home Feed', count: '38', icon: '🏠' },
  { label: 'My Questions', count: '7', icon: '❓' },
  { label: 'My Answers', count: '12', icon: '💬' },
  { label: 'Saved Posts', count: '5', icon: '🔖' },
  { label: 'Trending', count: '', icon: '🔥', badge: 'New' },
];

const subjects = [
  { label: 'History', count: '198', color: '#FBBF24' },
  { label: 'Geography', count: '176', color: '#60A5FA' },
  { label: 'Polity', count: '312', color: '#F87171' },
  { label: 'Economy', count: '241', color: '#34D399' },
  { label: 'Environment & Ecology', count: '156', color: '#22D3EE' },
  { label: 'Science & Technology', count: '134', color: '#A78BFA' },
];

export default function QAForumPage() {
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
        subtitle="Your community of 15,000+ UPSC aspirants. Every doubt answered, every insight shared."
        stats={[
          { value: '2.6K',  label: 'Questions Asked', color: '#FDC700' },
          { value: '89K+',  label: 'Answers Given',   color: '#F87171' },
          { value: '547',   label: 'Active Right Now', color: '#4ADE80' },
          { value: '∞', label: 'Always Free',    color: '#FFFFFF' },
        ]}
      />

      <main className="mx-auto mt-2 grid max-w-[1180px] grid-cols-1 gap-6 px-4 pb-14 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-[14px] bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[1.5px] text-[#6B7A99]">Browse</h2>
          {browseItems.map((item, index) => (
            <button key={item.label} className={`mb-1 flex w-full items-center justify-between rounded-[8px] px-3 py-2 text-left text-[13px] font-semibold ${index === 0 ? 'bg-[#090E1C] text-[#E8B84B]' : 'text-[#6B7A99] hover:bg-[#F8FAFC]'}`}>
              <span className="flex items-center gap-2.5">
                <span className="text-[14px]">{item.icon}</span>
                {item.label}
              </span>
              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <span className="rounded-[4px] bg-[#FEE2E2] px-1.5 py-0.5 text-[9px] font-bold text-[#EF4444]">{item.badge}</span>
                )}
                {item.count && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${index === 0 ? 'bg-[#E8B84B]/15 text-[#E8B84B]' : 'bg-[#EEF2F7] text-[#6B7A99]'}`}>{item.count}</span>
                )}
              </div>
            </button>
          ))}

          <h2 className="mb-3 mt-6 text-[10px] font-bold uppercase tracking-[1.5px] text-[#6B7A99]">Subjects</h2>
          {subjects.map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-[8px] px-3 py-2 text-[12px] text-[#6B7A99] hover:bg-[#F8FAFC] cursor-pointer transition-colors">
              <span className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                {item.label}
              </span>
              <span className="rounded-full bg-[#EEF2F7] px-2 text-[10px] text-[#6B7A99]">{item.count}</span>
            </div>
          ))}
        </aside>

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 rounded-full border border-[#E8B84B] bg-[#E8B84B]/10 px-4 py-2 text-[12px] font-semibold text-[#C99730]">
                <span>✨</span> Latest
              </button>
              <button className="flex items-center gap-1.5 rounded-full border border-[#DDE3EC] bg-white px-4 py-2 text-[12px] font-semibold text-[#6B7A99]">
                <span>🔥</span> Top
              </button>
              <button className="flex items-center gap-1.5 rounded-full border border-[#DDE3EC] bg-white px-4 py-2 text-[12px] font-semibold text-[#6B7A99]">
                <span>❓</span> Unanswered
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-[10px] border border-[#E1E6EF] bg-white px-4 py-2 text-[13px] text-[#9AA3B8]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                Search discussions...
              </div>
              <button className="flex items-center gap-1.5 rounded-[10px] bg-[#090E1C] px-5 py-2 text-[13px] font-bold text-white">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5v14"/></svg>
                Ask Question
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {posts.map((post) => (
              <article key={post.title} className="flex overflow-hidden rounded-[14px] border border-[#E1E6EF] bg-white shadow-sm">
                {/* Colored stripe */}
                <div className="w-[6px] shrink-0" style={{ background: post.stripe }} />
                {/* Vote column */}
                <div className="flex w-[56px] shrink-0 flex-col items-center justify-center gap-1 py-5" style={{ background: post.bg }}>
                  <button className="text-[#9AA3B8] hover:text-[#0C1424] transition-colors text-[12px]">▲</button>
                  <span className="text-[15px] font-bold text-[#0C1424]">{post.votes}</span>
                  <button className="text-[#9AA3B8] hover:text-[#0C1424] transition-colors text-[12px]">▼</button>
                </div>
                {/* Content */}
                <div className="flex-1 p-5">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-[6px] px-3 py-1 text-[10px] font-bold uppercase" style={{ background: post.statusColor, color: post.statusText }}>{post.status}</span>
                    <span className="rounded-[6px] bg-[#EFF6FF] px-3 py-1 text-[10px] font-bold uppercase text-[#2563EB]">{post.subject}</span>
                    <span className="rounded-[6px] bg-[#FFF7ED] px-3 py-1 text-[10px] font-bold uppercase text-[#D08700]">{post.tag}</span>
                  </div>
                  <h2 className="mb-2 text-[16px] font-bold leading-snug text-[#0C1424]">{post.title}</h2>
                  <p className="mb-4 text-[13px] leading-[1.6] text-[#6B7A99]">{post.desc}</p>
                  <div className="flex flex-wrap items-center gap-4 text-[12px] text-[#9AA3B8]">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#090E1C] text-[10px] font-bold text-white">
                        {post.user.charAt(0)}
                      </div>
                      <span className="font-medium text-[#0C1424]">{post.user}</span>
                      <span className="rounded-[4px] bg-[#EEF2F7] px-1.5 py-0.5 text-[10px] font-semibold text-[#6B7A99]">{post.badge}</span>
                      <span>· {post.time}</span>
                    </div>
                    <div className="ml-auto flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                        {post.replies} replies
                      </span>
                      <span className="flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                        {post.views} views
                      </span>
                      <button className="flex items-center gap-1 text-[#C99730] hover:text-[#E8B84B] transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
