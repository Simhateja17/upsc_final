import React from 'react';
import Link from 'next/link';

const Icons = {
  Polity: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 21H21" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 21V7" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 21V7" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 7L12 3L19 7" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 21V11C10 10.4477 10.4477 10 11 10H13C13.5523 10 14 10.4477 14 11V21" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Geography: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="#4B5563" strokeWidth="2" />
      <path d="M2 12H22" stroke="#4B5563" strokeWidth="2" />
      <path
        d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2V2Z"
        stroke="#4B5563"
        strokeWidth="2"
      />
    </svg>
  ),
  Economy: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 1V23" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3688 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6"
        stroke="#4B5563"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  History: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M6.5 2H20V22H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2Z"
        stroke="#4B5563"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Environment: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22V12" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 18C12 18 15 17 15 12C15 6.477 12 2 12 2" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 12C12 12 9 11 9 6" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Science: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2L9 4.5" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 2L15 4.5" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 10C8.5 10 7 11.5 7 14C7 16 8 17 11.5 17" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.5 10C15.5 10 17 11.5 17 14C17 16 16 17 12.5 17" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 17V22" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 22H16" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M9 4.5C9 4.5 9.5 7.5 7 7.5C4.5 7.5 2 6 2 4.5C2 3 4.5 2 6.5 2C8.5 2 9 4.5 9 4.5Z"
        stroke="#4B5563"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 4.5C15 4.5 14.5 7.5 17 7.5C19.5 7.5 22 6 22 4.5C22 3 19.5 2 17.5 2C15.5 2 15 4.5 15 4.5Z"
        stroke="#4B5563"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Ethics: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3L2 12H22L12 3Z" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M23 18C23 18 21 21 17 21C13 21 13 18 13 18" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1 18C1 18 3 21 7 21C11 21 11 18 11 18" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 13V3" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  CurrentAffairs: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z"
        stroke="#4B5563"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7 7H17" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 12H17" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 17H13" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

type IconKey = keyof typeof Icons;

type Subject = {
  title: string;
  count: number;
  progress: number;
  explored: number;
  color: string;
  Icon: IconKey;
};

const subjects: Subject[] = [
  { title: 'Indian Polity', count: 7, progress: 71, explored: 5, color: '#3B82F6', Icon: 'Polity' },
  { title: 'Geography', count: 6, progress: 33, explored: 2, color: '#EC4899', Icon: 'Geography' },
  { title: 'Indian Economy', count: 6, progress: 17, explored: 1, color: '#F59E0B', Icon: 'Economy' },
  { title: 'Modern History', count: 5, progress: 80, explored: 4, color: '#D97706', Icon: 'History' },
  { title: 'Environment', count: 5, progress: 60, explored: 3, color: '#10B981', Icon: 'Environment' },
  { title: 'Science & Tech', count: 4, progress: 25, explored: 1, color: '#8B5CF6', Icon: 'Science' },
  { title: 'GS IV — Ethics', count: 3, progress: 67, explored: 2, color: '#6366F1', Icon: 'Ethics' },
  { title: 'Current Affairs', count: 4, progress: 0, explored: 0, color: '#14B8A6', Icon: 'CurrentAffairs' },
];

type SubjectCardProps = {
  subject: Subject;
};

const SubjectCard: React.FC<SubjectCardProps> = ({ subject }) => {
  const { title, count, progress, explored, color, Icon } = subject;
  const IconComponent = Icons[Icon];

  const subjectSlug = title.toLowerCase().replace(/ /g, '-').replace(/&/g, 'and').replace(/—/g, '-');

  return (
    <Link href={`/dashboard/mindmap/${subjectSlug}`} className="block">
      <div className="bg-white rounded-[16px] overflow-hidden shadow-sm border border-gray-100 flex flex-col h-[180px] relative group hover:shadow-md transition-shadow">
        <div className="h-[4px] w-full" style={{ backgroundColor: color }} />

        <div className="p-6 flex flex-col justify-between h-full">
          <div>
            <div className="flex justify-between items-start mb-2">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                <IconComponent />
              </div>
            </div>

            <h3 className="text-[16px] font-bold text-[#1A1A1A] font-inter mb-1">{title}</h3>
            <p className="text-[12px] text-[#6B7280] font-inter">{count} mindmaps</p>
          </div>

          <div className="mt-4">
            <div className="flex justify-between items-center text-[11px] font-medium mb-2">
              <span className="text-[#374151] font-bold">{progress}% explored</span>
              <span
                className="px-2 py-0.5 rounded text-[10px] text-[#6B7280]"
                style={{ backgroundColor: `${color}15` }}
              >
                {explored === 0 ? 'Not started' : `${explored} explored`}
              </span>
            </div>

            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, backgroundColor: color }} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default function MindmapPage() {
  return (
    <div className="min-h-screen bg-[#F5F6FA] font-inter">
      <div
        className="w-full h-[281px] relative overflow-hidden p-8 rounded-[16px] mb-8"
        style={{
          background: 'linear-gradient(90.14deg, #10182D 1.9%, #0F172B 97.25%)',
          margin: '32px',
          width: 'calc(100% - 64px)',
        }}
      >
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-20 pointer-events-none">
          <svg width="100%" height="100%" viewBox="0 0 400 300">
            <circle cx="300" cy="150" r="100" fill="#4B5563" opacity="0.1" />
            <circle cx="350" cy="100" r="50" fill="#4B5563" opacity="0.1" />
            <line x1="300" y1="150" x2="350" y2="100" stroke="#4B5563" strokeWidth="2" opacity="0.1" />
          </svg>
        </div>

        <div className="relative z-10 text-white">
          <div className="mb-2">
            <span className="text-[#FDC700] text-[11px] font-medium tracking-[0.05em] uppercase">REVISION — VISUAL LEARNING</span>
          </div>

          <h1 className="text-[48px] font-bold leading-tight mb-2">
            Your <span className="italic text-[#FDC700]">Mindmap</span> Library.
          </h1>

          <p className="text-[#D1D5DC] text-[14px] max-w-[610px] mb-8">
            See the big picture. Every topic structured as a visual tree — revise faster, remember longer.
          </p>

          <div className="flex gap-4">
            <div className="bg-[#1C273B] border border-[#1E29394D] rounded-[16px] p-4 flex flex-col justify-center min-w-[140px]">
              <div className="text-[#46ECD5] text-[36px] font-bold leading-none mb-1">42</div>
              <div className="text-[#99A1AF] text-[11px] uppercase tracking-wider">TOTAL MAPS</div>
            </div>

            <div className="bg-[#1C273B] border border-[#1E29394D] rounded-[16px] p-4 flex flex-col justify-center min-w-[140px]">
              <div className="text-[#DAB2FF] text-[36px] font-bold leading-none mb-1">8</div>
              <div className="text-[#99A1AF] text-[11px] uppercase tracking-wider">SUBJECTS</div>
            </div>

            <div className="bg-[#1C273B] border border-[#1E29394D] rounded-[16px] p-4 flex flex-col justify-center min-w-[140px]">
              <div className="text-[#FDC700] text-[36px] font-bold leading-none mb-1">18</div>
              <div className="text-[#99A1AF] text-[11px] uppercase tracking-wider">EXPLORED</div>
            </div>

            <div className="bg-[#1C273B] border border-[#1E29394D] rounded-[16px] p-4 flex flex-col justify-center min-w-[140px]">
              <div className="text-[#FFFFFF] text-[36px] font-bold leading-none mb-1">78%</div>
              <div className="text-[#99A1AF] text-[11px] uppercase tracking-wider">AVG RETENTION</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 pb-12" style={{ margin: '0 32px' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-[#10182D] text-white flex items-center justify-center font-semibold text-[14px]">1</div>
          <h2 className="text-[36px] font-bold text-[#10182D] font-serif">
            Choose a <span className="italic text-[#F0B100]">Subject</span>
          </h2>
        </div>

        <p className="text-[#6A7282] text-[14px] mb-8 ml-11">Select the subject whose mindmaps you want to study today</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ml-11">
          {subjects.map((subject) => (
            <SubjectCard key={subject.title} subject={subject} />
          ))}
        </div>
      </div>
    </div>
  );
}

