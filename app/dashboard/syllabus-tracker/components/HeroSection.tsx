'use client';

import { TrackerState, SyllabusData } from '../page';

interface HeroSectionProps {
  states: TrackerState;
  syllabusData: SyllabusData;
  userName?: string;
  // kept for backwards-compat with parent; unused here
  mode?: string;
}

export default function HeroSection({ states, syllabusData, userName }: HeroSectionProps) {
  const calculateModeStats = (modeKey: keyof SyllabusData) => {
    const subjects = syllabusData[modeKey];
    let total = 0, done = 0, reading = 0;

    subjects.forEach(subject => {
      subject.topics.forEach((topic, ti) => {
        topic.subs.forEach((_, si) => {
          total++;
          const key = `${subject.id}__${ti}__${si}`;
          const status = states[key]?.status || 'none';
          if (status === 'done') done++;
          if (status === 'in-progress') reading++;
        });
      });
    });

    return { total, done, reading, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  };

  const prelimsStats = calculateModeStats('prelims');
  const mainsStats   = calculateModeStats('mains');
  const optionalStats = calculateModeStats('optional');

  const allTotal   = prelimsStats.total   + mainsStats.total   + optionalStats.total;
  const allDone    = prelimsStats.done    + mainsStats.done    + optionalStats.done;
  const allReading = prelimsStats.reading + mainsStats.reading + optionalStats.reading;
  const overallPct = allTotal > 0 ? Math.round((allDone / allTotal) * 100) : 0;

  return (
    <div
      className="mx-[18px] mt-[14px] rounded-[16px] border border-white/5 overflow-hidden relative"
      style={{
        background: 'linear-gradient(115deg, #0a1628 0%, #0d1e38 40%, #112347 70%, #0d1d3a 100%)',
        padding: '22px 24px 20px',
      }}
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,.028) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />

      {/* Glow effect */}
      <div
        className="absolute left-[50%] -translate-x-1/2 -top-[40px] w-[280px] h-[280px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(201,168,76,.10) 0%, transparent 65%)' }}
      />

      <div className="flex flex-col items-center text-center relative z-10">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-[6px] mb-[12px]"
          style={{
            background: 'rgba(10,22,40,0.85)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: '100px',
            padding: '5px 6px 5px 14px',
          }}
        >
          <span style={{ color: '#e8a820', fontWeight: 800, fontSize: '11px', letterSpacing: '1.2px', textTransform: 'uppercase' }}>
            PERSONALIZED
          </span>
          <span
            style={{
              background: '#F59E0B',
              color: '#0a1628',
              fontWeight: 800,
              fontSize: '11px',
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
              padding: '4px 12px',
              borderRadius: '100px',
            }}
          >
            SYLLABUS TRACKER
          </span>
        </div>

        <h1 className="font-playfair text-[27px] text-white mb-[7px] leading-tight font-bold">
          Know Exactly Where<br />You Stand, <em className="italic text-[#e8a820]">{userName || 'Aspirant'}.</em>
        </h1>

        <p className="text-[11.5px] text-white/40 max-w-[520px] leading-relaxed mb-[14px]">
          Your UPSC syllabus, fully mapped. Track every topic across Prelims, Mains and Optional, see what&apos;s done, what&apos;s pending, and what to conquer next.
        </p>

        {/* Countdown pill — matches home page style */}
        <div
          className="relative flex items-center w-full max-w-[480px] mb-[18px]"
          style={{
            height: '45px',
            background: '#161C2D',
            borderLeft: '4px solid #FF8904',
            borderRadius: '4px',
          }}
        >
          <img
            src="/calendar-icon.png"
            alt="Calendar"
            className="absolute left-[14px] w-[21px] h-[18px] object-contain"
          />
          <p
            className="absolute left-[46px] font-arimo font-normal leading-[20px] text-white"
            style={{ fontSize: '16px' }}
          >
            UPSC Prelims 2026: {Math.max(0, Math.ceil((new Date(2026, 5, 2).getTime() - Date.now()) / 86400000))} days remaining.
          </p>
        </div>

        {/* Stats Strip */}
        <div
          className="flex gap-0 rounded-[10px] overflow-hidden w-full max-w-[480px]"
          style={{ border: '0.8px solid #364153' }}
        >
          <div className="flex-1 p-[8px_12px] text-center" style={{ background: '#1C273B', borderRight: '0.8px solid #364153' }}>
            <div className="font-playfair text-[18px] font-bold leading-none" style={{ color: '#e8a820' }}>{overallPct}%</div>
            <div className="text-[9px] font-bold tracking-[0.8px] uppercase mt-[2px]" style={{ color: '#6A7282' }}>Overall</div>
          </div>
          <div className="flex-1 p-[8px_12px] text-center" style={{ background: '#1C273B', borderRight: '0.8px solid #364153' }}>
            <div className="font-playfair text-[18px] font-bold leading-none" style={{ color: '#F87171' }}>{allDone}</div>
            <div className="text-[9px] font-bold tracking-[0.8px] uppercase mt-[2px]" style={{ color: '#6A7282' }}>Done</div>
          </div>
          <div className="flex-1 p-[8px_12px] text-center" style={{ background: '#1C273B', borderRight: '0.8px solid #364153' }}>
            <div className="font-playfair text-[18px] font-bold leading-none" style={{ color: '#FFFFFF' }}>{allReading}</div>
            <div className="text-[9px] font-bold tracking-[0.8px] uppercase mt-[2px]" style={{ color: '#6A7282' }}>Revising</div>
          </div>
          <div className="flex-1 p-[8px_12px] text-center" style={{ background: '#1C273B' }}>
            <div className="font-playfair text-[18px] font-bold leading-none" style={{ color: '#4ade80' }}>{allTotal - allDone - allReading}</div>
            <div className="text-[9px] font-bold tracking-[0.8px] uppercase mt-[2px]" style={{ color: '#6A7282' }}>Remaining</div>
          </div>
        </div>
      </div>
    </div>
  );
}
