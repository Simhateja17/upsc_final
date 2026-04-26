const posts = [
  { votes: 57, status: 'Answered', subject: 'Indian Polity', tag: 'Mains', title: 'What is the difference between President Rule (Article 356) and National Emergency Article 352?', user: 'Rahul V.', replies: 14, views: 329, bg: '#DCFCE7' },
  { votes: 43, status: 'Open', subject: 'Economy', tag: 'Current Affairs', title: 'How should we approach the new RBI monetary policy framework for Mains 2026?', user: 'Priya D.', replies: 8, views: 441, bg: '#FEF3C7' },
  { votes: 39, status: 'Top', subject: 'History', tag: 'Prelims', title: 'Is the Bhakti Movement more important for Prelims or Mains? How much depth should I go into?', user: 'Ananya S.', replies: 9, views: 385, bg: '#F3E8FF' },
  { votes: 29, status: 'Answered', subject: 'Ethics', tag: 'GS4', title: 'Can Sardar Vallabhbhai Patel be used as a local politician in delivering funds?', user: 'Kiran M.', replies: 6, views: 222, bg: '#DBEAFE' },
  { votes: 19, status: 'Open', subject: 'Geography', tag: 'Maps', title: 'Confusing myself with Indian Ocean currents. What is the correct revision sequence?', user: 'Meera I.', replies: 3, views: 118, bg: '#E0F2FE' },
];

export default function QAForumPage() {
  return (
    <div className="min-h-screen bg-[#F4F6FA] font-inter text-[#0C1424]">
      <section className="relative min-h-[430px] overflow-hidden bg-[#071022] px-4 pt-20 text-center text-white">
        <div className="absolute inset-0 opacity-45" style={{
          backgroundImage: 'linear-gradient(rgba(232,184,75,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(232,184,75,0.07) 1px, transparent 1px)',
          backgroundSize: '34px 34px',
        }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_22%,rgba(232,184,75,0.15),transparent_32%),radial-gradient(circle_at_78%_0%,rgba(54,75,122,0.25),transparent_34%)]" />
        <div className="relative mx-auto max-w-[760px]">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[1.8px] text-[#E8B84B]">Discussion Forum</p>
          <h1 className="mb-4 text-[45px] leading-[1.1] md:text-[58px]" style={{ fontFamily: 'Georgia, serif' }}>
            Ask, <span className="italic text-[#E8B84B]">Discuss</span>, Rise Together
          </h1>
          <p className="mx-auto max-w-[540px] text-[14px] leading-6 text-white/45">
            Your community of 15,000+ UPSC aspirants. Every doubt answered, every insight shared.
          </p>
          <div className="mt-7 flex justify-center gap-3">
            <button className="rounded-[10px] bg-[#E8B84B] px-7 py-3 text-[14px] font-bold text-[#090E1C]">✍️ Ask a Question</button>
            <button className="rounded-[10px] border border-white/15 bg-white/7 px-7 py-3 text-[14px] font-semibold text-white/80">🏛️ Join Study Room</button>
          </div>
          <div className="mx-auto mt-8 grid max-w-[430px] grid-cols-3 overflow-hidden rounded-[12px] border border-white/10 bg-white/5">
            {[
              ['2.6K', 'Questions Asked'],
              ['89.2K', 'Answers Given'],
              ['547', 'Active Right Now'],
            ].map(([value, label]) => (
              <div key={label} className="border-r border-white/10 px-6 py-4 last:border-r-0">
                <div className="text-[24px] font-bold text-[#E8B84B]" style={{ fontFamily: 'Georgia, serif' }}>{value}</div>
                <div className="text-[10px] text-white/35">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto -mt-4 grid max-w-[1180px] grid-cols-1 gap-6 px-4 pb-14 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-[14px] bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[1.5px] text-[#6B7A99]">Browse</h2>
          {['Home Feed', 'My Questions', 'My Answers', 'Saved Posts', 'Trending'].map((item, index) => (
            <button key={item} className={`mb-1 flex w-full items-center justify-between rounded-[8px] px-3 py-2 text-left text-[13px] font-semibold ${index === 0 ? 'bg-[#090E1C] text-[#E8B84B]' : 'text-[#6B7A99] hover:bg-[#F8FAFC]'}`}>
              {item}
              <span className={`rounded-full px-2 text-[10px] ${index === 0 ? 'bg-[#E8B84B]/15' : 'bg-[#EEF2F7]'}`}>{index === 0 ? '24' : ''}</span>
            </button>
          ))}
          <h2 className="mb-3 mt-6 text-[10px] font-bold uppercase tracking-[1.5px] text-[#6B7A99]">Subjects</h2>
          {['Indian Polity', 'History', 'Economy', 'Geography', 'Ethics & GS4', 'Current Affairs', 'Science & Tech', 'Mains Strategy'].map((item) => (
            <div key={item} className="flex items-center justify-between rounded-[8px] px-3 py-2 text-[12px] text-[#6B7A99]">
              <span>{item}</span>
              <span className="rounded-full bg-[#EEF2F7] px-2 text-[10px]">128</span>
            </div>
          ))}
        </aside>

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              {['Latest', 'Top', 'Unanswered'].map((item, index) => (
                <button key={item} className={`rounded-full border px-4 py-2 text-[12px] font-semibold ${index === 0 ? 'border-[#E8B84B] bg-[#E8B84B]/10 text-[#C99730]' : 'border-[#DDE3EC] bg-white text-[#6B7A99]'}`}>{item}</button>
              ))}
            </div>
            <div className="flex gap-3">
              <div className="rounded-[10px] border border-[#E1E6EF] bg-white px-4 py-2 text-[13px] text-[#9AA3B8]">🔍 Search discussions...</div>
              <button className="rounded-[10px] bg-[#090E1C] px-5 py-2 text-[13px] font-bold text-white">Ask Question</button>
            </div>
          </div>

          <div className="space-y-4">
            {posts.map((post) => (
              <article key={post.title} className="grid overflow-hidden rounded-[14px] border border-[#E1E6EF] bg-white shadow-sm md:grid-cols-[70px_1fr]">
                <div className="flex flex-row items-center justify-center gap-2 py-4 md:flex-col" style={{ background: post.bg }}>
                  <span className="text-[#6B7A99]">▲</span>
                  <span className="text-[16px] font-bold text-[#0C1424]">{post.votes}</span>
                  <span className="text-[#6B7A99]">▼</span>
                </div>
                <div className="p-5">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="rounded-[6px] bg-[#ECFDF5] px-3 py-1 text-[10px] font-bold uppercase text-[#16A34A]">{post.status}</span>
                    <span className="rounded-[6px] bg-[#EFF6FF] px-3 py-1 text-[10px] font-bold uppercase text-[#2563EB]">{post.subject}</span>
                    <span className="rounded-[6px] bg-[#FFF7ED] px-3 py-1 text-[10px] font-bold uppercase text-[#D08700]">{post.tag}</span>
                  </div>
                  <h2 className="mb-2 text-[17px] font-bold text-[#0C1424]">{post.title}</h2>
                  <p className="mb-4 text-[13px] leading-5 text-[#6B7A99]">
                    I keep mixing up these two in mock tests. Can someone explain with clear differences and when each is applied?
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-[12px] text-[#9AA3B8]">
                    <span>{post.user} · Scholar</span>
                    <span>{post.replies} replies</span>
                    <span>{post.views} views</span>
                    <button className="text-[#C99730]">Save</button>
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
