'use client';

import { useState } from 'react';
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
  const [hoveredTab, setHoveredTab] = useState<Mode | null>(null);
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

  const highlightedTab = hoveredTab ?? mode;
  const highlightedIndex = tabs.findIndex((tab) => tab.key === highlightedTab);
  const thumbLeft =
    highlightedIndex === 0
      ? '6px'
      : highlightedIndex === 1
        ? 'calc(12px + ((100% - 18px) / 3))'
        : 'calc(18px + 2 * ((100% - 18px) / 3))';

  return (
    <div className="flex justify-center">
      <div
        className="relative inline-flex items-center overflow-hidden min-w-max max-w-full"
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F6F8FC 100%)',
          borderRadius: '999px',
          padding: '6px',
          border: '1px solid #E4E9F2',
          boxShadow: '0 10px 30px -22px rgba(15, 23, 43, 0.35), inset 0 1px 0 rgba(255,255,255,0.95)',
        }}
      >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[3px] bottom-[3px] z-0"
        style={{
          left: thumbLeft,
          top: '6px',
          bottom: '6px',
          width: 'calc((100% - 18px) / 3)',
          borderRadius: '999px',
          background: '#0F172B',
          boxShadow: '0 8px 20px rgba(15, 23, 43, 0.24)',
          transition: 'left 220ms ease, width 220ms ease, background 220ms ease, box-shadow 220ms ease',
        }}
      />

      {tabs.map((tab) => {
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
            className="relative z-10 flex items-center justify-center gap-2 whitespace-nowrap transition-colors duration-200"
            style={{
              padding: '12px 22px',
              color: isHighlighted ? '#FFFFFF' : '#17223E',
              fontWeight: 700,
              fontSize: '14px',
              lineHeight: '1',
            }}
            aria-label={`${tab.label} ${tab.pct}% complete`}
          >
            <span
              aria-hidden="true"
              style={{
                fontSize: '16px',
                lineHeight: 1,
                filter: isHighlighted ? 'none' : 'saturate(0.95)',
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
