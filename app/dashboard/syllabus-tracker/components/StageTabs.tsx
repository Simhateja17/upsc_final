'use client';

import { Mode, TrackerState, SyllabusData } from '../page';

interface StageTabsProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  states: TrackerState;
  syllabusData: SyllabusData;
  cms?: Record<string, any>;
}

export default function StageTabs({ mode, onModeChange, states, syllabusData, cms }: StageTabsProps) {
  const stageTabs = (() => {
    try {
      return JSON.parse(cms?.stage_tabs || '{}');
    } catch {
      return {};
    }
  })();
  const stageMeta: Record<Mode, { accent: string; icon: string }> = {
    prelims: { accent: '#F59E0B', icon: '🎯' },
    mains: { accent: '#F3A312', icon: '✍️' },
    optional: { accent: '#2563EB', icon: '📖' },
  };

  const calculateModePct = (modeKey: Mode) => {
    const subjects = syllabusData[modeKey];
    let total = 0;
    let done = 0;

    subjects.forEach((subject) => {
      subject.topics.forEach((topic, ti) => {
        topic.subs.forEach((_, si) => {
          total++;
          const key = `${subject.id}__${ti}__${si}`;
          if (states[key]?.status === 'done') done++;
        });
      });
    });

    return total > 0 ? Math.round((done / total) * 100) : 0;
  };

  const tabs = [
    { key: 'prelims' as Mode, label: stageTabs.prelims || 'Prelims', pct: calculateModePct('prelims') },
    { key: 'mains' as Mode, label: stageTabs.mains || 'Mains', pct: calculateModePct('mains') },
    { key: 'optional' as Mode, label: stageTabs.optional || 'Optional', pct: calculateModePct('optional') },
  ];

  return (
    <div className="flex justify-start">
      <div
        className="relative inline-flex items-center min-w-max max-w-full"
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F6F8FC 100%)',
          borderRadius: '999px',
          padding: '6px',
          gap: '4px',
          border: '1px solid #E4E9F2',
          boxShadow: '0 10px 30px -22px rgba(15, 23, 43, 0.35), inset 0 1px 0 rgba(255,255,255,0.95)',
        }}
      >
      {tabs.map((tab) => {
        const isActive = mode === tab.key;

        return (
          <button
            key={tab.key}
            onClick={() => onModeChange(tab.key)}
            className="relative z-10 flex items-center justify-center gap-2 whitespace-nowrap transition-colors duration-200"
            style={{
              padding: '12px 22px',
              borderRadius: '999px',
              color: isActive ? '#FFFFFF' : '#17223E',
              background: isActive ? '#0F172B' : 'transparent',
              boxShadow: isActive ? '0 8px 20px rgba(15, 23, 43, 0.24)' : 'none',
              fontWeight: 700,
              fontSize: '14px',
              lineHeight: '1',
              transition: 'background 220ms ease, color 200ms ease, box-shadow 220ms ease',
            }}
            aria-label={`${tab.label} ${tab.pct}% complete`}
          >
            <span
              aria-hidden="true"
              style={{
                fontSize: '16px',
                lineHeight: 1,
                filter: isActive ? 'none' : 'saturate(0.95)',
              }}
            >
              {stageMeta[tab.key].icon}
            </span>
            <span>{tab.label}</span>
          </button>
        );
      })}
      </div>
    </div>
  );
}
