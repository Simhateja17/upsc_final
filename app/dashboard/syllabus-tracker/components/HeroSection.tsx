'use client';

import { Mode, TrackerState, SyllabusData } from '../page';

const heroBackground = 'https://www.figma.com/api/mcp/asset/2647baef-a909-4b4e-9b8d-4a96da466239';

interface HeroSectionProps {
  mode: Mode;
  states: TrackerState;
  syllabusData: SyllabusData;
  userName?: string;
}

export default function HeroSection({ mode, states, syllabusData, userName }: HeroSectionProps) {
  const calculateModeStats = (modeKey: Mode) => {
    const subjects = syllabusData[modeKey];
    let total = 0;
    let done = 0;
    let reading = 0;
    let revision = 0;

    subjects.forEach((subject) => {
      subject.topics.forEach((topic, ti) => {
        topic.subs.forEach((_, si) => {
          total++;
          const key = `${subject.id}__${ti}__${si}`;
          const status = states[key]?.status || 'none';
          if (status === 'done') done++;
          if (status === 'in-progress') reading++;
          if (status === 'needs-revision') revision++;
        });
      });
    });

    return { total, done, reading, revision, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  };

  const prelimsStats = calculateModeStats('prelims');
  const mainsStats = calculateModeStats('mains');
  const optionalStats = calculateModeStats('optional');

  const allTotal = prelimsStats.total + mainsStats.total + optionalStats.total;
  const allDone = prelimsStats.done + mainsStats.done + optionalStats.done;
  const allRevision = prelimsStats.revision + mainsStats.revision + optionalStats.revision;
  const overallPct = allTotal > 0 ? Math.round((allDone / allTotal) * 100) : 0;

  const stageCards = [
    { id: 'prelims' as const, label: 'Prelims GS', icon: '🏛️', stats: prelimsStats, color: '#05DF72', bar: '#05DF72' },
    { id: 'mains' as const, label: 'Mains', icon: '📚', stats: mainsStats, color: '#51A2FF', bar: '#51A2FF' },
    { id: 'optional' as const, label: 'Optional', icon: '🎓', stats: optionalStats, color: '#C27AFF', bar: '#C27AFF' },
  ];

  const summaryStats = [
    { label: 'Overall', value: `${overallPct}%`, color: '#F5A623' },
    { label: 'Done', value: String(allDone), color: '#FF7070' },
    { label: 'Revising', value: String(allRevision), color: '#FFFFFF' },
    { label: 'Remaining', value: String(Math.max(allTotal - allDone, 0)), color: '#0E8A56' },
  ];

  return (
    <section className="mx-[18px] mt-[14px] overflow-hidden rounded-[16px] border border-white/[0.06] bg-[#050A18]">
      <div className="relative min-h-[256px] px-[26px] py-[26px] md:px-[26px] md:py-[26px]">
        <img
          src={heroBackground}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(5,10,24,0.18) 0%, rgba(5,10,24,0.04) 48%, rgba(5,10,24,0.10) 100%)',
          }}
        />

        <div className="relative z-10 flex min-h-[204px] flex-col justify-between gap-8 lg:flex-row lg:items-start">
          <div className="max-w-[660px] pt-0">
            <div className="mb-[10px] inline-flex rounded-[20px] border border-white/[0.12] bg-white/[0.06] px-[11px] py-[5px] text-[8px] font-extrabold uppercase leading-[10px] tracking-[0.7px] text-[#FDC700]">
              Personalized Syllabus Tracker
            </div>

            <h1 className="max-w-[640px] text-[32px] font-bold leading-[40px] text-white sm:text-[42px] sm:leading-[48px] lg:text-[48px]">
              Know Exactly Where
              <br />
              You Stand,{' '}
              <em className="font-playfair font-bold italic text-[#E8B84B]">
                {userName || 'Aspirant'}
              </em>
              .
            </h1>

            <p className="mt-[14px] max-w-[650px] text-[13px] leading-[20px] text-[#4A5565] sm:text-[16px] sm:leading-[26px]">
              Your UPSC syllabus, fully mapped. Track every topic across Prelims, Mains and Optional see what&apos;s done,
              what&apos;s pending, and what to conquer next.
            </p>

            <div className="mt-[22px] grid max-w-[600px] grid-cols-2 gap-[10px] sm:inline-grid sm:grid-cols-4">
              {summaryStats.map((stat) => (
                <div
                  key={stat.label}
                  className="min-w-[124px] rounded-[10px] border border-white/80 bg-white/[0.08] px-[18px] py-[10px] text-center shadow-[0_10px_24px_rgba(0,0,0,0.12)]"
                >
                  <div className="font-jakarta text-[16px] font-extrabold leading-[20px]" style={{ color: stat.color }}>
                    {stat.value}
                  </div>
                  <div className="mt-[3px] font-jakarta text-[9.5px] uppercase leading-[12px] tracking-[0.6px] text-white/40">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex w-full flex-col gap-[10px] lg:mt-0 lg:w-[246px] lg:min-w-[246px]">
            {stageCards.map((card) => {
              const isActive = mode === card.id;

              return (
                <div
                  key={card.id}
                  className="rounded-[8px] border border-white/[0.1] bg-white/[0.1] px-[11px] py-[10px]"
                  style={{ backdropFilter: 'blur(6px)' }}
                >
                  <div className="mb-[5px] flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-[8px]">
                      <span className="mt-[1px] text-[13px] leading-[18px]">{card.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-[7px]">
                          <span className="truncate text-[12px] font-bold leading-[16px] text-white">{card.label}</span>
                          {isActive ? (
                            <span className="rounded-[4px] bg-[#FF6900]/30 px-[5px] py-[1px] text-[7px] font-bold uppercase leading-[10px] text-[#FFB86A]">
                              Active
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-[1px] text-[10px] leading-[13px] text-[#99A1AF]">
                          {card.stats.done} of {card.stats.total} topics done
                        </div>
                      </div>
                    </div>
                    <div className="text-[16px] font-bold leading-[20px]" style={{ color: card.color }}>
                      {card.stats.pct}%
                    </div>
                  </div>

                  <div className="h-[6px] overflow-hidden rounded-full bg-white/[0.1]">
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{ width: `${card.stats.pct}%`, background: card.bar }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
