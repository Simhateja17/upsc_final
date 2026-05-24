'use client';

import { Subject, TrackerState } from '../page';

interface TopicListProps {
  subject: Subject | null | undefined;
  openTopics: Set<string>;
  selectedTopic: { subjectId: string; topicIndex: number } | null;
  onToggleTopic: (subjectId: string, topicIndex: number) => void;
  states: TrackerState;
}

export default function TopicList({ subject, openTopics, selectedTopic, onToggleTopic, states }: TopicListProps) {
  // Calculate topic stats
  const getTopicStats = (subjectId: string, topicIndex: number, totalSubs: number) => {
    let done = 0;
    let active = 0;
    
    for (let si = 0; si < totalSubs; si++) {
      const key = `${subjectId}__${topicIndex}__${si}`;
      const status = states[key]?.status || 'none';
      if (status === 'done') done++;
      else if (status !== 'none') active++;
    }

    return { 
      total: totalSubs, 
      done, 
      active, 
      pct: totalSubs > 0 ? Math.round((done / totalSubs) * 100) : 0 
    };
  };

  if (!subject) {
    return (
      <div className="w-full min-w-0 flex-1 bg-white rounded-[14px] border-[1.5px] border-[#e0e8f4] flex flex-col overflow-hidden shadow-sm">
        <div className="flex items-center justify-center flex-1 p-[16px_14px]">
          <div className="flex flex-col items-center text-center gap-0">
            <div className="relative w-[60px] h-[60px] mb-[14px]">
              <div className="absolute inset-0 rounded-full border-[2.5px] border-dashed border-[rgba(201,146,26,.30)]"
                   style={{ animation: 'spinRing 8s linear infinite' }} />
              <div className="absolute inset-0 flex items-center justify-center text-[22px]"
                   style={{ animation: 'floatDot 3s ease-in-out infinite' }}>
                👈
              </div>
            </div>
            <div className="font-playfair text-[13px] font-bold text-[#0f1f3d] mb-[6px]">
              Select a Subject
            </div>
            <div className="text-[10px] text-[#8795ae] leading-relaxed max-w-[160px] mb-[16px]">
              Choose any subject from the left panel to explore its topics and begin tracking
            </div>
            <div className="flex items-start gap-[5px] justify-center">
              <div className="flex flex-col items-center gap-[3px]">
                <div className="w-[20px] h-[20px] rounded-full bg-[#0f1f3d] text-white text-[9px] font-extrabold flex items-center justify-center">
                  1
                </div>
                <div className="text-[8.5px] leading-[1.2] font-semibold text-[#8795ae] text-center">
                  Pick a
                  <br />
                  subject
                </div>
              </div>
              <div className="text-[10px] text-[#c9921a] mt-[3px] font-bold">→</div>
              <div className="flex flex-col items-center gap-[3px]">
                <div className="w-[20px] h-[20px] rounded-full bg-[#0f1f3d] text-white text-[9px] font-extrabold flex items-center justify-center">
                  2
                </div>
                <div className="text-[8.5px] leading-[1.2] font-semibold text-[#8795ae] text-center">
                  Open a<br />topic
                </div>
              </div>
              <div className="text-[10px] text-[#c9921a] mt-[3px] font-bold">→</div>
              <div className="flex flex-col items-center gap-[3px]">
                <div className="w-[20px] h-[20px] rounded-full bg-[#0f1f3d] text-white text-[9px] font-extrabold flex items-center justify-center">
                  3
                </div>
                <div className="text-[8.5px] leading-[1.2] font-semibold text-[#8795ae] text-center">
                  Mark<br />progress
                </div>
              </div>
            </div>
          </div>
        </div>
        <style jsx>{`
          @keyframes spinRing { to { transform: rotate(360deg); } }
          @keyframes floatDot { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        `}</style>
      </div>
    );
  }

  const stats = subject.topics.map((_, ti) => 
    getTopicStats(subject.id, ti, subject.topics[ti].subs.length)
  );
  const totalDone = stats.reduce((sum, s) => sum + s.done, 0);
  const totalSubs = stats.reduce((sum, s) => sum + s.total, 0);
  const overallPct = totalSubs > 0 ? Math.round((totalDone / totalSubs) * 100) : 0;
  const progressColor = overallPct === 100 ? '#16a34a' : overallPct > 50 ? '#c9921a' : subject.color;

  return (
    <div className="w-full min-w-0 flex-1 bg-white rounded-[14px] border-[1.5px] border-[#e0e8f4] flex flex-col overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-[12px_13px_10px] border-b-[1.5px] border-[#e0e8f4] bg-white flex-shrink-0">
        <div className="flex items-center gap-[8px] mb-[2px]">
          <div 
            className="w-[24px] h-[24px] rounded-[6px] flex items-center justify-center text-[13px] flex-shrink-0"
            style={{ background: subject.bg }}
          >
            {subject.icon}
          </div>
          <div className="font-playfair text-[14px] text-[#0f1f3d] font-bold">
            {subject.name}
          </div>
        </div>
        <div className="text-[10px] text-[#8795ae] mt-[1px]">
          {subject.topics.length} topics | {totalDone}/{totalSubs} done
        </div>
        <div className="h-[3px] bg-[#d8e4f5] rounded-[4px] mt-[7px] overflow-hidden">
          <div 
            className="h-full rounded-[4px] transition-all duration-900"
            style={{ 
              width: `${overallPct}%`, 
              background: progressColor 
            }}
          />
        </div>
      </div>

      {/* Topics List */}
      <div className="flex-1 overflow-y-auto p-[6px]">
        {subject.topics.map((topic, ti) => {
          const topicKey = `${subject.id}__${ti}`;
          const isOpen = openTopics.has(topicKey);
          const isSelected = selectedTopic?.subjectId === subject.id && selectedTopic?.topicIndex === ti;
          const topicStats = stats[ti];
          const fillColor = topicStats.pct === 100 ? '#16a34a' : topicStats.pct > 0 ? subject.color : '#d8e4f5';
          
          // Status icon based on completion
          const statusIcon = topicStats.pct === 100 
            ? '/topic-completed.png' 
            : topicStats.pct > 0 
              ? '/topic-in-progress.png' 
              : null;
          
          // Topic emoji icons
          const topicEmojis: Record<string, string> = {
            'Ancient India': '🏺',
            'Medieval India': '🏰',
            'Modern India': '🇮🇳',
            'Art & Culture': '🎨',
            'Performing Arts': '🎭',
            'Post Independence': '📜',
            'Physical Geography': '🌍',
            'Indian Geography': '🗺️',
            'World Geography': '🌐',
            'Mapping': '📍',
            'Constitution': '📖',
            'Parliament': '🏛️',
            'Judiciary': '⚖️',
            'Governance': '📋',
            'Rights': '✊',
            'Growth': '📈',
            'Fiscal Policy': '💰',
            'Banking': '🏦',
            'External Sector': '🌐',
            'Agriculture': '🌾',
            'Ecology': '🌿',
            'Biodiversity': '🦋',
            'Climate Change': '🌡️',
            'Conservation': '🌳',
            'Biotech': '🧬',
            'Space': '🚀',
            'Defence Tech': '🛡️',
            'IT & Computers': '💻',
            'Neighbourhood': '🤝',
            'Global Institutions': '🌐',
            'Bilateral Relations': '🤝',
            'Architecture': '🏛️',
            'Literature': '📚',
            'Paintings': '🎨',
            'Schemes': '📋',
            'Reports': '📊',
            'Awards': '🏆',
          };
          
          const topicEmoji = topicEmojis[topic.name] || '📄';

          return (
            <div
              key={ti}
              className={`
                bg-white border-[1.5px] rounded-[12px] mb-[4px] overflow-hidden transition-all duration-200 shadow-sm
                ${isOpen ? 'border-[#0f1f3d]' : isSelected ? 'border-[#c9921a]' : 'border-[#e0e8f4] hover:border-[rgba(15,31,61,.12)] hover:shadow-md'}
              `}
              style={isSelected ? { boxShadow: '0 0 0 2px rgba(201,146,26,.12)' } : {}}
            >
              <div
                className="flex items-center gap-[10px] p-[10px_12px] cursor-pointer select-none"
                onClick={() => onToggleTopic(subject.id, ti)}
              >
                {/* Status Icon */}
                <div className="w-[28px] h-[28px] flex-shrink-0 flex items-center justify-center">
                  {statusIcon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={statusIcon}
                      alt={topicStats.pct === 100 ? 'Completed' : 'In Progress'}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-[20px] h-[20px] rounded-[6px] border-[1.5px] border-[#d8e4f5]" />
                  )}
                </div>
                
                {/* Topic Emoji */}
                <div className="text-[18px] flex-shrink-0">
                  {topicEmoji}
                </div>
                
                {/* Topic Info */}
                <div className="flex-1 min-w-0">
                  <div
                    title={topic.name}
                    className="text-[13px] font-bold leading-tight text-[#0f1f3d] whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    {topic.name}
                  </div>
                  <div className="text-[10px] text-[#8795ae] mt-[1px] whitespace-nowrap overflow-hidden text-ellipsis">
                    {topicStats.total} topics | {topicStats.done}/{topicStats.total} done
                  </div>
                </div>
                
                {/* Progress Count */}
                
                <span 
                  className="text-[12px] text-[#8795ae] transition-transform duration-200 inline-block flex-shrink-0"
                  style={{ transform: isOpen || isSelected ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  ›
                </span>
              </div>
              <div className="h-[2px] bg-[#f3f6fb]">
                <div 
                  className="h-full transition-all duration-600"
                  style={{ 
                    width: `${topicStats.pct}%`, 
                    background: fillColor 
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

