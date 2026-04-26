import Link from 'next/link';

const podium = [
  { place: 2, medal: '🥈', initial: 'P', name: 'Priya Nair', city: 'Mumbai', points: 149, accuracy: '88%', size: 'side' },
  { place: 1, medal: '🥇', initial: 'A', name: 'Arjun Sharma', city: 'Delhi', points: 151, accuracy: '90%', size: 'winner' },
  { place: 3, medal: '🥉', initial: 'R', name: 'Rahul Verma', city: 'Bangalore', points: 143, accuracy: '87%', size: 'side' },
];

const rows = [
  ['4', 'S', 'Sneha Patel', '@sneha2026 · Hyderabad', '140', '87%', '19', '140h'],
  ['5', 'A', 'Aditya Singh', '@aditya_ias · Chennai', '141', '84%', '18', '140h'],
  ['6', 'K', 'Kavya Reddy', '@kavya_rises · Pune', '138', '86%', '17', '140h'],
  ['7', 'V', 'Vikram Joshi', '@vikram_upsc · Jaipur', '132', '83%', '16', '140h'],
  ['8', 'M', 'Meera Iyer', '@meera_ias · Kochi', '130', '82%', '16', '140h'],
  ['9', 'R', 'Rohan Gupta', '@rohan_upsc · Lucknow', '127', '82%', '16', '140h'],
  ['10', 'A', 'Anjali Mishra', '@anjali_prep · Patna', '125', '79%', '14', '140h'],
  ['11', 'K', 'Karan Mehta', '@karan_ias · Chandigarh', '119', '80%', '15', '140h'],
  ['12', 'D', 'Divya Rao', '@divya2026 · Bhopal', '122', '78%', '15', '140h'],
  ['13', 'N', 'Nikhil Tiwari', '@nikhil_ias · Delhi', '116', '75%', '15', '140h'],
];

function Avatar({ initial, large = false }: { initial: string; large?: boolean }) {
  return (
    <div
      className={`mx-auto flex items-center justify-center rounded-full border border-[#D8DEE9] bg-[#F7FAFF] font-bold text-[#5570D8] ${large ? 'size-[72px] text-[30px]' : 'size-[60px] text-[24px]'}`}
    >
      {initial}
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-[#F4F6FA] font-inter">
      <section className="relative min-h-[360px] overflow-hidden bg-[#071022] px-4 pt-16 text-center text-white">
        <div className="absolute inset-0 opacity-45" style={{
          backgroundImage: 'linear-gradient(rgba(232,184,75,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(232,184,75,0.07) 1px, transparent 1px)',
          backgroundSize: '34px 34px',
        }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(232,184,75,0.16),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(67,88,132,0.2),transparent_30%)]" />
        <div className="relative mx-auto max-w-[1060px]">
          <div className="mb-5 flex items-center justify-center gap-3">
            <span className="h-px w-11 bg-[#E8B84B]" />
            <span className="text-[11px] font-bold uppercase tracking-[1.8px] text-[#E8B84B]">Community Rankings</span>
            <span className="h-px w-11 bg-[#E8B84B]" />
          </div>
          <h1 className="mb-4 text-[46px] leading-[1.05] md:text-[72px]" style={{ fontFamily: 'Georgia, serif' }}>
            Rise through the <span className="italic text-[#E8B84B]">ranks</span>
          </h1>
          <p className="mx-auto max-w-[500px] text-[15px] leading-[26px] text-white/45">
            Compete, improve, and see where you stand among 15,000+ UPSC aspirants preparing with RiseWithJeet.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-[1060px] px-4 pb-12 pt-20">
        <section className="relative mx-auto mb-3 max-w-[964px] overflow-hidden rounded-[20px] bg-[#0C1424] px-[29px] py-[25px] text-white shadow-[0_18px_45px_rgba(12,20,36,0.18)]">
          <div className="absolute -right-12 -top-12 size-[220px] rounded-full bg-[#E8B84B]/10 blur-3xl" />
          <div className="relative flex flex-wrap items-center gap-6">
            <div className="flex size-[52px] items-center justify-center rounded-full bg-[#5B50D6] text-[20px] font-bold">T</div>
            <div className="min-w-[240px] flex-1">
              <p className="text-[15px] font-bold">Tanshi <span className="font-normal text-white/45">· tanshi494@gmail.com</span></p>
              <p className="mt-1 text-[13px] text-white/45">Joined Feb 2025 · Delhi</p>
            </div>
            <div className="grid grid-cols-4 gap-6 text-center">
              {[
                ['#47', 'Overall Rank'],
                ['#31', 'Daily MCQ'],
                ['#62', 'Mains Challenge'],
                ['14🔥', 'Day Streak'],
              ].map(([value, label]) => (
                <div key={label}>
                  <div className="text-[18px] font-bold text-[#E8B84B]">{value}</div>
                  <div className="text-[11px] text-white/45">{label}</div>
                </div>
              ))}
            </div>
            <div className="rounded-[10px] bg-[#E8B84B] px-5 py-2 text-[13px] font-bold text-[#090E1C]">Your Rank</div>
          </div>
        </section>

        <section className="mx-auto mb-2 flex max-w-[964px] flex-wrap items-center justify-between gap-4">
          <div className="rounded-[14px] border border-[#DFE4ED] bg-white p-[5px]">
            {['🏆 Overall', '🎯 Daily MCQ', '✍️ Mains Challenge'].map((tab, index) => (
              <button key={tab} className={`rounded-[10px] px-5 py-2 text-[13px] font-semibold ${index === 0 ? 'bg-[#090E1C] text-[#E8B84B]' : 'text-[#6B7A99]'}`}>
                {tab}
              </button>
            ))}
          </div>
          <button className="rounded-[9px] border border-[#DFE4ED] bg-white px-4 py-2 text-[12px] font-semibold text-[#0C1424]">🏆 All Time</button>
        </section>
        <div className="mx-auto mb-20 max-w-[964px] text-right text-[12px] text-[#9AA3B8]">Updates every 30 min</div>

        <section className="mx-auto max-w-[964px]">
          <div className="mb-8 grid grid-cols-1 items-end justify-center gap-4 md:grid-cols-[175px_210px_175px] md:gap-4">
            {podium.map((person) => (
              <div
                key={person.place}
                className={`relative rounded-[18px] border bg-white text-center shadow-sm ${person.size === 'winner' ? 'min-h-[309px] border-[#E8B84B] pt-10' : 'min-h-[284px] border-[#E4E8F0] pt-8 md:mb-0'}`}
              >
                {person.size === 'winner' && <div className="absolute left-1/2 top-[-15px] -translate-x-1/2 text-[22px]">👑</div>}
                <div className="mx-auto mb-7 inline-flex rounded-full border border-[#E8B84B]/30 bg-[#FFF7DE] px-3 py-1 text-[14px]">{person.medal}</div>
                <Avatar initial={person.initial} large={person.size === 'winner'} />
                <h2 className="mt-5 text-[18px] font-bold text-[#0C1424]">{person.name}</h2>
                <p className="mt-1 text-[12px] text-[#6B7A99]">{person.city}</p>
                <p className={`mt-4 font-bold text-[#0C1424] ${person.size === 'winner' ? 'text-[26px]' : 'text-[22px]'}`}>{person.points}</p>
                <p className="text-[11px] text-[#9AA3B8]">Total Points</p>
                <div className="mx-auto mt-3 inline-flex rounded-full border border-[#BBF7D0] bg-[#F0FDF4] px-3 py-1 text-[11px] font-semibold text-[#16A34A]">
                  ✓ {person.accuracy} accuracy
                </div>
              </div>
            ))}
          </div>

          <div className="mx-auto max-w-[818px] overflow-hidden rounded-[18px] bg-white shadow-sm">
            <div className="grid grid-cols-[68px_1fr_110px_100px_78px_95px] border-b border-[#EEF2F7] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.7px] text-[#9AA3B8]">
              <span>Rank</span>
              <span>Aspirant</span>
              <span className="text-center">MCQ Score</span>
              <span className="text-center">Accuracy</span>
              <span className="text-center">Streak</span>
              <span className="text-center">Total hours</span>
            </div>
            {rows.map(([rank, initial, name, handle, score, accuracy, streak, hours]) => (
              <div key={`${rank}-${name}`} className="grid grid-cols-[68px_1fr_110px_100px_78px_95px] items-center border-b border-[#EEF2F7] px-5 py-[14px] last:border-b-0">
                <div className="text-center text-[13px] font-semibold text-[#6B7A99]">{rank}</div>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-[#EEF2FF] text-[13px] font-bold text-[#5570D8]">{initial}</div>
                  <div>
                    <div className="text-[13px] font-bold text-[#0C1424]">{name}</div>
                    <div className="text-[11px] text-[#9AA3B8]">{handle}</div>
                  </div>
                </div>
                <div className="text-center text-[15px] font-bold text-[#0C1424]">{score}</div>
                <div className="text-center"><span className="rounded-full bg-[#F0FDF4] px-3 py-1 text-[11px] font-bold text-[#16A34A]">{accuracy}</span></div>
                <div className="text-center text-[13px] text-[#0C1424]">🔥 {streak}</div>
                <div className="text-center text-[15px] font-bold text-[#0C1424]">{hours}</div>
              </div>
            ))}
            <div className="py-5 text-center">
              <button className="rounded-[10px] border border-[#DFE4ED] px-6 py-2 text-[13px] font-bold text-[#0C1424]">Show more aspirants ↓</button>
            </div>
          </div>
        </section>

        <section className="mt-20 rounded-[24px] bg-[#071022] px-6 py-14 text-center text-white">
          <h2 className="mb-3 text-[42px]" style={{ fontFamily: 'Georgia, serif' }}>Ready to climb higher?</h2>
          <p className="mx-auto mb-7 max-w-[460px] text-[15px] leading-7 text-white/50">
            Practice daily MCQs, write Mains answers, and let AI-powered analytics guide you to the top.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/dashboard/daily-mcq" className="rounded-[10px] bg-[#E8B84B] px-7 py-3 text-[14px] font-bold text-[#090E1C]">Start Today&apos;s MCQ →</Link>
            <Link href="/dashboard/daily-answer" className="rounded-[10px] border border-white/15 px-7 py-3 text-[14px] font-bold text-white">Attempt Mains Challenge</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
