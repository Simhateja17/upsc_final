'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Subject, Mode, TrackerState } from '../page';

interface SubjectListProps {
  subjects: Subject[];
  activeSubject: string | null;
  onSelectSubject: (subjectId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  states: TrackerState;
  mode: Mode;
  optionalNoSelection?: boolean;
  optionalSubjects?: string[];
  optionalDraft?: string;
  onOptionalDraftChange?: (value: string) => void;
  onSetOptional?: () => void;
  savingOptional?: boolean;
}

export default function SubjectList({
  subjects,
  activeSubject,
  onSelectSubject,
  searchQuery,
  onSearchChange,
  states,
  optionalNoSelection = false,
  optionalSubjects = [],
  optionalDraft = '',
  onOptionalDraftChange,
  onSetOptional,
  savingOptional = false,
}: SubjectListProps) {
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
      pct: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  };

  const filteredSubjects = subjects.filter(
    (subject) => !searchQuery || subject.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full min-w-0 flex-1 bg-white rounded-[14px] border-[1.5px] border-[#e0e8f4] flex flex-col overflow-hidden shadow-sm">
      <div className="p-[11px_13px_9px] border-b-[1.5px] border-[#e0e8f4] flex-shrink-0">
        <div className="mb-[10px] flex items-center gap-[8px]">
          <Image
            src="/Subjects.svg"
            alt=""
            width={22}
            height={22}
            className="h-[22px] w-[22px]"
            aria-hidden="true"
          />
          <div className="text-[24px] leading-[1] font-bold tracking-[-1px] text-[#101828]">
            Subjects
          </div>
        </div>
        <div className="relative">
          <span className="absolute left-[9px] top-1/2 -translate-y-1/2 text-[#8795ae] text-[9px] font-bold uppercase tracking-[0.8px] pointer-events-none">
            Search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter subjects..."
            className="w-full bg-[#f3f6fb] border-[1.5px] border-[#e0e8f4] rounded-[8px] pl-[54px] pr-[10px] py-[6px] text-[11.5px] text-[#0f1f3d] outline-none transition-all duration-200 focus:border-[rgba(201,146,26,.30)] focus:bg-white"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-[10px]">
        {optionalNoSelection ? (
          <div className="flex flex-col items-center text-center px-[14px] py-[24px]">
            <div className="text-[40px] mb-[8px]" aria-hidden="true">📘</div>
            <div className="text-[17px] font-bold text-[#0f1f3d] mb-[6px] leading-tight">
              Pick your Optional Subject
            </div>
            <div className="text-[12px] text-[#8795ae] leading-relaxed mb-[16px] max-w-[240px]">
              Choose your UPSC optional right here to start tracking Paper-wise themes and topics.
            </div>
            <select
              value={optionalDraft}
              onChange={(e) => onOptionalDraftChange?.(e.target.value)}
              className="w-full bg-white outline-none transition-colors focus:border-[rgba(201,146,26,.30)]"
              style={{ height: '40px', borderRadius: '9px', border: '1.5px solid #e0e8f4', padding: '0 12px', fontSize: '12.5px', color: '#0f1f3d' }}
            >
              <option value="">-- Select Optional --</option>
              {optionalSubjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onSetOptional?.()}
              disabled={savingOptional || !optionalDraft.trim()}
              className="w-full mt-[12px] font-extrabold text-[#5b4a12] transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ height: '42px', borderRadius: '9px', fontSize: '12.5px', background: 'linear-gradient(135deg, #e6ce8c, #d9bd63)', boxShadow: '0 2px 8px rgba(201,146,26,.22)' }}
            >
              {savingOptional ? 'Saving…' : 'Set Optional Subject'}
            </button>
            <div className="text-[11px] text-[#8795ae] my-[10px]">or</div>
            <Link
              href="/dashboard/profile"
              className="text-[12.5px] font-bold text-[#c9921a] no-underline hover:opacity-80 transition-opacity"
            >
              Choose in Profile →
            </Link>
          </div>
        ) : filteredSubjects.map((subject) => {
          const stats = getSubjectStats(subject);
          const isActive = activeSubject === subject.id;
          const r = 15;
          const circ = 2 * Math.PI * r;
          const off = circ - (circ * stats.pct) / 100;
          const ringColor = stats.pct === 100 ? '#16a34a' : stats.pct > 50 ? '#c9921a' : subject.color;

          return (
            <div
              key={subject.id}
              onClick={() => onSelectSubject(subject.id)}
              className={`
                flex items-center gap-[11px] p-[11px_13px] rounded-[12px] cursor-pointer border-[1.5px] mb-[6px] relative overflow-hidden transition-all duration-200
                ${
                  isActive
                    ? 'border-[rgba(201,146,26,.30)] shadow-md'
                    : 'border-[#e0e8f4] bg-white hover:border-[#d8e4f5] hover:bg-[#edf2fc] hover:-translate-y-[2px] hover:shadow-lg active:translate-y-0 active:shadow-sm'
                }
              `}
              style={
                isActive
                  ? {
                      background: 'linear-gradient(135deg, rgba(232,168,32,.06), rgba(201,146,26,.03))',
                      boxShadow: '0 4px 16px rgba(201,146,26,.16), 0 0 0 3px rgba(201,146,26,.08)',
                    }
                  : {
                      boxShadow: '0 2px 8px rgba(15,31,61,.05)',
                    }
              }
            >
              {isActive && (
                <div
                  className="absolute left-0 top-0 bottom-0 w-[3.5px] rounded-r-[2px]"
                  style={{ background: 'linear-gradient(180deg, #e8a820, #c9921a)' }}
                />
              )}

              <div
                className="absolute inset-0 rounded-[12px] pointer-events-none"
                style={{
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.8), inset 0 -1px 0 rgba(15,31,61,.06)',
                }}
              />

              <div
                className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-[19px] flex-shrink-0"
                style={{
                  background: subject.bg,
                  boxShadow: '0 2px 8px rgba(0,0,0,.10), inset 0 1px 0 rgba(255,255,255,.3)',
                }}
              >
                {subject.icon}
              </div>

              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="text-[12.5px] font-bold mb-[2px] leading-[1.25] text-[#0f1f3d] whitespace-nowrap overflow-hidden text-ellipsis" title={subject.name}>
                  {subject.name}
                </div>
                <div className="text-[10px] text-[#8795ae] whitespace-nowrap overflow-hidden text-ellipsis">
                  {subject.topics.length} Sub-subject{subject.topics.length !== 1 ? 's' : ''} | {stats.done}/{stats.total} topics
                </div>
              </div>

              <div className="flex-shrink-0 relative w-[40px] h-[36px]">
                <svg width="36" height="36" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r={r} fill="none" stroke="#d8e4f5" strokeWidth="2.5" />
                  <circle
                    cx="18"
                    cy="18"
                    r={r}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={circ.toFixed(2)}
                    strokeDashoffset={off.toFixed(2)}
                    style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[8px] font-extrabold text-[#3c4f6d]">
                  {stats.pct}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
