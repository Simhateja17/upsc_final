const imgSectionHero = 'https://www.figma.com/api/mcp/asset/e8222ec8-fa48-4325-9caf-dc8a813db837';

const rooms = [
  { title: 'Polity Warriors — Evening Batch', tags: ['Indian Polity', 'GS2'], status: 'LIVE', students: 18, color: '#EF4444', top: '#EF4444' },
  { title: 'Economics Deep Dive', tags: ['Economy', 'GS3'], status: 'LIVE', students: 7, color: '#EF4444', top: '#2563EB' },
  { title: 'Geography Explorers', tags: ['Geography'], status: 'LIVE', students: 23, color: '#EF4444', top: '#22C55E' },
  { title: 'Current Affairs Daily', tags: ['Current Affairs'], status: 'OPEN', students: 5, color: '#22C55E', top: '#E5E7EB' },
  { title: 'Ethics & Integrity Circle', tags: ['Ethics', 'GS4'], status: 'OPEN', students: 3, color: '#22C55E', top: '#E5E7EB' },
  { title: 'Science & Tech Sprint', tags: ['Sci & Tech'], status: 'STARTS 8PM', students: 1, color: '#E8B84B', top: '#E5E7EB' },
];

const features = [
  ['🍅', 'Pomodoro Timer', 'Stay deep in focus with proven time blocks'],
  ['🏆', 'Leaderboards', 'Track rankings and compete with peers'],
  ['📋', 'Task Cards', 'Share daily goals, stay accountable'],
  ['🔍', 'Peer Review', 'Get answer feedback from fellow aspirants'],
];

export default function StudyGroupsPage() {
  return (
    <div className="min-h-screen bg-[#F4F6FA] font-inter text-[#0C1424]">
      <section className="relative min-h-[495px] overflow-hidden bg-[#071022] text-center text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgSectionHero} alt="" className="absolute left-0 top-[-14%] h-[128%] w-full object-cover opacity-95" />
        <div className="absolute inset-0 bg-[#071022]/35" />
        <div className="relative mx-auto flex max-w-[1244px] flex-col items-center px-4 pt-[58px]">
          <div className="mb-7 flex items-center gap-3">
            <span className="h-px w-11 bg-[#E8B84B]" />
            <span className="text-[11px] font-bold uppercase tracking-[1.98px] text-[#E8B84B]">Study Together</span>
            <span className="h-px w-11 bg-[#E8B84B]" />
          </div>
          <h1 className="mb-6 text-[46px] leading-[1.1] md:text-[58px]" style={{ fontFamily: 'Georgia, serif' }}>
            Your Digital <span className="italic text-[#E8B84B]">Study Library</span><br />Open 24/7
          </h1>
          <p className="mb-8 max-w-[520px] text-[15px] leading-[26px] text-white/45">
            Join 15,000+ aspirants. Study with accountability, focus deep, and rise together.
          </p>
          <div className="mb-7 flex gap-3">
            <button className="rounded-[10px] bg-[#E8B84B] px-7 py-3 text-[14px] font-bold text-[#090E1C]">🚀 Create a Room</button>
            <button className="rounded-[10px] border border-white/15 bg-white/7 px-7 py-3 text-[14px] font-semibold text-white/80">🎧 Solo Focus Session</button>
          </div>
          <div className="grid grid-cols-4 overflow-hidden rounded-[14px] border border-white/10 bg-white/5">
            {[
              ['547', 'Online Now', '#0E8A56'],
              ['38', 'Live Rooms', 'rgba(255,255,255,0.35)'],
              ['2.4h', 'Avg. Session', 'rgba(255,255,255,0.35)'],
              ['15K+', 'Aspirants', 'rgba(255,255,255,0.35)'],
            ].map(([value, label, color]) => (
              <div key={label} className="border-r border-white/10 px-8 py-4 last:border-r-0">
                <div className="text-[28px] font-bold text-[#E8B84B]" style={{ fontFamily: 'Georgia, serif' }}>{value}</div>
                <div className="text-[11px] tracking-[0.44px]" style={{ color }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1244px] px-4 pb-16">
        <div className="flex h-14 items-center justify-between border-b border-[#E1E6EF] bg-white px-8">
          <div className="flex gap-1">
            <button className="rounded-[8px] bg-[#090E1C] px-5 py-2 text-[13px] font-semibold text-[#E8B84B]">🏛️ Study Rooms</button>
            <button className="rounded-[8px] px-5 py-2 text-[13px] font-semibold text-[#6B7A99]">🎯 Solo Focus</button>
          </div>
          <div className="flex gap-3">
            <button className="rounded-[8px] bg-[#090E1C] px-5 py-2 text-[13px] font-semibold text-white/80">🎧 Solo Session</button>
            <button className="rounded-[8px] bg-[#E8B84B] px-5 py-2 text-[13px] font-semibold text-[#090E1C]">+ Create Room</button>
          </div>
        </div>

        <section className="mt-8 overflow-hidden rounded-[18px] border border-[#E8B84B]/20 bg-[#0C1424] px-8 py-6 text-white">
          <div className="grid items-center gap-6 md:grid-cols-[170px_1fr_70px_80px_190px]">
            <div className="flex">
              {['A', 'R', 'P', 'S', '+120'].map((item) => (
                <div key={item} className="-mr-2 flex size-[42px] items-center justify-center rounded-full border-2 border-[#0C1424] bg-[#172444] text-[12px] font-bold text-[#E8B84B]">{item}</div>
              ))}
            </div>
            <div>
              <h2 className="mb-2 text-[19px] text-white" style={{ fontFamily: 'Georgia, serif' }}>🔥 Live Study Room - Silent Mode</h2>
              <p className="text-[12px] text-white/40">Currently studying: Modern History · GS1 · Focus Guard ON</p>
            </div>
            <div className="text-center">
              <div className="text-[22px] font-bold text-[#E8B84B]" style={{ fontFamily: 'Georgia, serif' }}>124</div>
              <div className="text-[10px] text-white/35">Online Now</div>
            </div>
            <div className="text-center">
              <div className="text-[22px] font-bold text-[#E8B84B]" style={{ fontFamily: 'Georgia, serif' }}>2h 14m</div>
              <div className="text-[10px] text-white/35">Session</div>
            </div>
            <button className="rounded-[10px] bg-[#E8B84B] px-7 py-3 text-[14px] font-bold text-[#090E1C]">Join Study Room →</button>
          </div>
        </section>

        <section className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {['All Rooms', '🔴 Live', 'Open', 'Polity', 'History', 'Economy'].map((item, index) => (
              <button key={item} className={`rounded-full border px-4 py-2 text-[12px] font-semibold ${index === 0 ? 'border-[#E8B84B] bg-[#E8B84B]/10 text-[#C99730]' : 'border-[#DDE3EC] bg-white text-[#6B7A99]'}`}>{item}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-[10px] border border-[#E1E6EF] bg-white px-4 py-2 text-[13px] text-[#757575]">
            <span>🔍</span>
            <span>Search rooms...</span>
          </div>
        </section>

        <div className="mt-5 flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#6B7A99]">Active Right Now</span>
          <span className="h-px flex-1 bg-[#DDE3EC]" />
        </div>

        <section className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
          {rooms.map((room) => (
            <article key={room.title} className="overflow-hidden rounded-[16px] border border-[#E1E6EF] bg-white shadow-sm" style={{ borderTop: `3px solid ${room.top}` }}>
              <div className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="rounded-full border px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.9px]" style={{ color: room.color, borderColor: `${room.color}33`, background: `${room.color}18` }}>● {room.status}</span>
                  <div className="flex gap-1">
                    {room.tags.map((tag) => <span key={tag} className="rounded-[6px] bg-[#F0F2F5] px-2 py-1 text-[10px] font-semibold text-[#6B7A99]">{tag}</span>)}
                  </div>
                </div>
                <h3 className="mb-2 text-[15px] font-bold text-[#0C1424]">{room.title}</h3>
                <p className="mb-5 text-[12px] text-[#6B7A99]">Goal 10hrs · Members 23/45 people · Attendance 38%</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[12px] text-[#6B7A99]">
                    <span className="flex -space-x-1">{['A', 'R', 'P'].map((x) => <span key={x} className="flex size-5 items-center justify-center rounded-full bg-[#172444] text-[9px] text-white">{x}</span>)}</span>
                    <span>{room.students} studying</span>
                  </div>
                  <button className="rounded-[8px] bg-[#E8B84B] px-4 py-2 text-[12px] font-bold text-[#090E1C]">Join Room →</button>
                </div>
              </div>
            </article>
          ))}
        </section>

        <div className="mt-6 flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#6B7A99]">Room Features</span>
          <span className="h-px flex-1 bg-[#DDE3EC]" />
        </div>
        <section className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
          {features.map(([icon, title, desc]) => (
            <div key={title} className="rounded-[14px] border border-[#E1E6EF] bg-white p-6 text-center">
              <div className="mb-3 text-[26px]">{icon}</div>
              <h3 className="mb-2 text-[13px] font-bold text-[#0C1424]">{title}</h3>
              <p className="text-[12px] text-[#6B7A99]">{desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
