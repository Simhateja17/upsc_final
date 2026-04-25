'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Subject, TrackerState } from '../page';

interface RightPanelProps {
  subjects: Subject[];
  states: TrackerState;
}

export default function RightPanel({ subjects, states }: RightPanelProps) {
  const [showViewAll, setShowViewAll] = useState(false);

  // Calculate subject progress
  const getSubjectStats = (subject: Subject) => {
    let total = 0;
    let done = 0;

    subject.topics.forEach((topic, ti) => {
      topic.subs.forEach((_, si) => {
        total++;
        const key = `${subject.id}__${ti}__${si}`;
        if (states[key]?.status === 'done') done++;
      });
    });

    return { 
      total, 
      done, 
      pct: total > 0 ? Math.round((done / total) * 100) : 0 
    };
  };

  // Calculate mode-level stats for summary cards
  const calculateModeStats = (modeSubjects: Subject[]) => {
    let total = 0;
    let done = 0;
    modeSubjects.forEach(subject => {
      subject.topics.forEach((topic, ti) => {
        topic.subs.forEach((_, si) => {
          total++;
          const key = `${subject.id}__${ti}__${si}`;
          if (states[key]?.status === 'done') done++;
        });
      });
    });
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  };

  const prelimsStats = calculateModeStats(subjects.filter(s => s.id.startsWith('p')));
  const mainsStats = calculateModeStats(subjects.filter(s => s.id.startsWith('m')));
  const optionalStats = calculateModeStats(subjects.filter(s => s.id.startsWith('opt')));

  const summaryCards = [
    { id: 'prelims', label: 'Prelims GS', icon: '🎯', stats: prelimsStats, color: '#e8a820', activeColor: '#c9921a' },
    { id: 'mains', label: 'Mains', icon: '✍️', stats: mainsStats, color: '#60a5fa', activeColor: '#3b82f6' },
    { id: 'optional', label: 'Optional', icon: '📚', stats: optionalStats, color: '#c4b5fd', activeColor: '#8b5cf6' },
  ];

  return (
    <div className="w-[228px] min-w-[228px] flex flex-col gap-[11px] overflow-y-auto flex-shrink-0">
      {/* Subject Progress Card */}
      <div className="bg-white border-[1.5px] border-[#e0e8f4] rounded-[14px] p-[13px] shadow-sm">
        <div className="flex items-center justify-between mb-[11px]">
          <div className="flex items-center gap-[6px]">
            <div className="w-[3px] h-[13px] bg-[#c9921a] rounded-[2px]" />
            <div className="text-[9.5px] font-extrabold tracking-[1.2px] uppercase text-[#3c4f6d]">
              Subject Progress
            </div>
          </div>
          <button 
            onClick={() => setShowViewAll(true)}
            className="text-[11px] font-bold text-[#0f1f3d] cursor-pointer no-underline transition-colors duration-150 hover:text-[#c9921a] bg-transparent border-none"
          >
            View all →
          </button>
        </div>
        
        <div>
          {subjects.map(subject => {
            const stats = getSubjectStats(subject);
            const progressColor = stats.pct === 100 ? '#16a34a' : subject.color;

            return (
              <div key={subject.id} className="flex items-center gap-[7px] mb-[9px] last:mb-0">
                <div className="text-[12px] flex-shrink-0 w-[14px] text-center">
                  {subject.icon}
                </div>
                <div className="text-[10.5px] font-semibold text-[#0f1f3d] flex-shrink-0 w-[56px] whitespace-nowrap overflow-hidden text-ellipsis">
                  {subject.short}
                </div>
                <div className="flex-1">
                  <div className="h-[5px] bg-[#d8e4f5] rounded-[4px] overflow-hidden">
                    <div
                      className="h-full rounded-[4px] transition-all duration-900"
                      style={{ 
                        width: `${stats.pct}%`, 
                        background: progressColor 
                      }}
                    />
                  </div>
                </div>
                <div 
                  className="text-[10px] font-bold flex-shrink-0 w-[26px] text-right"
                  style={{ color: progressColor }}
                >
                  {stats.pct}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Study Planner CTA */}
      <Link
        href="/dashboard/study-planner"
        className="block border-[1.5px] border-dashed rounded-[13px] p-[16px_14px] text-center cursor-pointer transition-all duration-200 no-underline"
        style={{
          borderColor: 'rgba(201,146,26,.30)',
          background: 'linear-gradient(135deg, rgba(201,146,26,.04), rgba(201,146,26,.09))',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#c9921a';
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(201,146,26,.09), rgba(201,146,26,.16))';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(201,146,26,.30)';
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(201,146,26,.04), rgba(201,146,26,.09))';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div className="text-[24px] mb-[8px]">📅</div>
        <div className="text-[12.5px] font-extrabold text-[#0f1f3d] mb-[4px]">
          Plan Today's Study
        </div>
        <div className="text-[10.5px] text-[#8795ae] mb-[12px] leading-relaxed">
          Set daily goals with Jeet AI and stay on track for UPSC 2026.
        </div>
        <span
          className="inline-flex items-center gap-[5px] px-[18px] py-[8px] rounded-[9px] text-[11.5px] font-extrabold text-[#0f1f3d] cursor-pointer border-none transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, #e8a820, #c9921a)',
            boxShadow: '0 2px 8px rgba(201,146,26,.28)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(201,146,26,.36)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(201,146,26,.28)';
          }}
        >
          + Add in Study Planner
        </span>
      </Link>

      {/* View All Modal */}
      {showViewAll && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowViewAll(false)}
        >
          <div 
            className="bg-white rounded-[20px] p-6 w-full max-w-[520px] mx-4 max-h-[85vh] overflow-y-auto"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-inter font-bold text-[18px] text-[#1A1A1A]">All Subject Progress</h2>
              <button 
                onClick={() => setShowViewAll(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                ✕
              </button>
            </div>

            {/* Summary Cards */}
            <div className="space-y-3 mb-6">
              {summaryCards.map(card => (
                <div
                  key={card.id}
                  className="rounded-[12px] p-[14px_16px] relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0d1e38 100%)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[18px]">{card.icon}</span>
                      <span className="text-[13px] font-bold text-white">{card.label}</span>
                      {card.id === 'prelims' && (
                        <span className="text-[9px] font-extrabold px-[8px] py-[2px] rounded-[20px] tracking-[0.4px] uppercase bg-green-400/20 text-green-400 border border-green-400/30">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <span className="text-[22px] font-bold" style={{ color: card.color }}>
                      {card.stats.pct}%
                    </span>
                  </div>
                  <div className="text-[11px] text-white/40 mb-2">
                    {card.stats.done} of {card.stats.total} topics done
                  </div>
                  <div className="h-[4px] bg-white/10 rounded-[4px] overflow-hidden">
                    <div
                      className="h-full rounded-[4px] transition-all duration-500"
                      style={{
                        width: `${card.stats.pct}%`,
                        background: `linear-gradient(90deg, ${card.activeColor}, ${card.color})`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* All Subjects List */}
            <div className="space-y-3">
              {subjects.map(subject => {
                const stats = getSubjectStats(subject);
                const progressColor = stats.pct === 100 ? '#16a34a' : subject.color;
                return (
                  <div key={subject.id} className="flex items-center gap-3">
                    <div className="text-[16px] flex-shrink-0 w-[24px] text-center">
                      {subject.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-semibold text-[#0f1f3d]">{subject.name}</span>
                        <span className="text-[11px] font-bold" style={{ color: progressColor }}>
                          {stats.pct}%
                        </span>
                      </div>
                      <div className="h-[6px] bg-[#E5E7EB] rounded-[4px] overflow-hidden">
                        <div
                          className="h-full rounded-[4px] transition-all duration-500"
                          style={{ width: `${stats.pct}%`, background: progressColor }}
                        />
                      </div>
                      <div className="text-[10px] text-[#9CA3AF] mt-0.5">
                        {stats.done} of {stats.total} topics done
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
