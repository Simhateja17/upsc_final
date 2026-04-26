'use client';

import { useState } from 'react';
import { Mode, TrackerState, SyllabusData } from '../page';

interface StageTabsProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  states: TrackerState;
  syllabusData: SyllabusData;
}

export default function StageTabs({ mode, onModeChange, states, syllabusData }: StageTabsProps) {
  const [hoveredTab, setHoveredTab] = useState<Mode | null>(null);

  const calculateModePct = (modeKey: Mode) => {
    const subjects = syllabusData[modeKey];
    let total = 0;
    let done = 0;

    subjects.forEach(subject => {
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

  const prelimsPct = calculateModePct('prelims');
  const mainsPct = calculateModePct('mains');
  const optionalPct = calculateModePct('optional');

  const tabs = [
    { key: 'prelims' as Mode, label: 'Prelims', icon: '🎯', pct: prelimsPct },
    { key: 'mains' as Mode, label: 'Mains', icon: '✍️', pct: mainsPct },
    { key: 'optional' as Mode, label: 'Optional', icon: '📖', pct: optionalPct },
  ];

  const highlightedTab = hoveredTab ?? mode;
  const highlightedIndex = tabs.findIndex(tab => tab.key === highlightedTab);
  const thumbLeft =
    highlightedIndex === 0
      ? '4px'
      : highlightedIndex === 1
        ? 'calc(8px + ((100% - 16px) / 3))'
        : 'calc(12px + 2 * ((100% - 16px) / 3))';

  return (
    <div
      className="relative flex items-center w-full overflow-hidden"
      style={{
        background: '#F1F3F9',
        borderRadius: '26843500px',
        padding: '4px',
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[4px] bottom-[4px] z-0"
        style={{
          left: thumbLeft,
          width: 'calc((100% - 16px) / 3)',
          borderRadius: '26843500px',
          background: '#0F172B',
          boxShadow: '0px 4px 12px rgba(15, 23, 43, 0.3)',
          transition: 'left 220ms ease, width 220ms ease, background 220ms ease, box-shadow 220ms ease',
        }}
      />

      {tabs.map(tab => {
        const isActive = mode === tab.key;
        const isHovered = hoveredTab === tab.key;
        const isHighlighted = isActive || isHovered;

        return (
          <button
            key={tab.key}
            onClick={() => onModeChange(tab.key)}
            onMouseEnter={() => setHoveredTab(tab.key)}
            onMouseLeave={() => setHoveredTab(null)}
            onFocus={() => setHoveredTab(tab.key)}
            onBlur={() => setHoveredTab(null)}
            className="relative z-10 flex flex-1 items-center justify-center gap-2 whitespace-nowrap transition-colors duration-200"
            style={{
              padding: '10px 20px',
              color: isHighlighted ? '#FFFFFF' : '#4A5565',
              fontWeight: 700,
              fontSize: '16px',
              lineHeight: '1',
            }}
          >
            <span style={{ fontSize: '18px', lineHeight: '1' }}>{tab.icon}</span>
            <span>{tab.label}</span>
            <span
              className="rounded-full px-2 py-[2px] text-[12px] font-extrabold"
              style={{
                background: isHighlighted ? 'rgba(255,255,255,0.18)' : '#FFFFFF',
                color: isHighlighted ? '#FFFFFF' : '#17223E',
                boxShadow: isHighlighted ? 'none' : '0 1px 3px rgba(15, 23, 43, 0.08)',
              }}
            >
              {tab.pct}%
            </span>
          </button>
        );
      })}
    </div>
  );
}
