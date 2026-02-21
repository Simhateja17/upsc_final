'use client';

import Link from 'next/link';
import { useState } from 'react';

const Sidebar = () => {
  const [activeItem, setActiveItem] = useState('overview');

  const navigationSections = [
    {
      title: 'DASHBOARD',
      items: [
        { id: 'overview', label: 'Overview', icon: '/sidebar-overview-new.png', path: '/dashboard' },
        { id: 'study-planner', label: 'Study Planner', icon: '/sidebar-study-planner.png', path: '/dashboard/study-planner' },
        { id: 'jeet-gpt', label: 'Jeet GPT', icon: '/sidebar-jeet-gpt.png', path: '/dashboard/jeet-gpt' },
        { id: 'syllabus-tracker', label: 'Syllabus Tracker', icon: '/sidebar-syllabus-new.png', path: '/dashboard/syllabus-tracker' },
      ],
    },
    {
      title: 'LEARNING',
      items: [
        { id: 'video-lectures', label: 'Video Lectures', icon: '/sidebar-video.png', path: '/dashboard/video-lectures' },
        { id: 'study-material', label: 'Study Material', icon: '/sidebar-study-material-new2.png', path: '/dashboard/library' },
        { id: 'current-affairs', label: 'Current Affairs', icon: '/sidebar-current-affairs.png', path: '/dashboard/current-affairs' },
        { id: 'test-series', label: 'Test Series', icon: '/sidebar-test-series.png', path: '/dashboard/test-series' },
        { id: 'mentorship', label: 'Personal Mentorship', icon: '/sidebar-mentorship-new.png', path: '/dashboard/mentorship' },
      ],
    },
    {
      title: 'PRACTICE',
      items: [
        { id: 'daily-mcq', label: 'Daily MCQ', icon: '/sidebar-daily-mcq-new.png', path: '/dashboard/daily-mcq' },
        { id: 'daily-answer', label: 'Daily Answer Writing', icon: '/sidebar-daily-answer-new.png', path: '/dashboard/daily-answer' },
        { id: 'mock-tests', label: 'Mock Tests', icon: '/sidebar-mock-tests-new.png', path: '/dashboard/mock-tests' },
        { id: 'pyq', label: 'Previous Year Questions', icon: '/sidebar-pyq-new.png', path: '/dashboard/pyq' },
      ],
    },
    {
      title: 'ANALYTICS',
      items: [
        { id: 'performance', label: 'Performance Analytics', icon: '/sidebar-performance-new.png', path: '/dashboard/performance' },
        { id: 'test-analytics', label: 'Analytics', icon: '/sidebar-analytics-new.png', path: '/dashboard/test-analytics' },
      ],
    },
    {
      title: 'REVISION TOOLS',
      items: [
        { id: 'flashcards', label: 'Flashcards', icon: '/sidebar-flashcards-new.png', path: '/dashboard/flashcards' },
        { id: 'mindmap', label: 'Mindmaps', icon: '/sidebar-mindmap-new.png', path: '/dashboard/mindmap' },
      ],
    },
    {
      title: 'COMMUNITY',
      items: [
        { id: 'study-groups', label: 'Study Groups', icon: '/sidebar-study-groups.png', path: '/dashboard/study-groups' },
        { id: 'discussion', label: 'Discussion', icon: '/sidebar-discussion.png', path: '/dashboard/discussion' },
      ],
    },
    {
      title: 'SUPPORT',
      items: [
        { id: 'qa-forum', label: 'Q&A Forum', icon: '/sidebar-qa-forum.png', path: '/dashboard/qa-forum' },
        { id: 'mental-health', label: 'Mental Health Buddy', icon: '/sidebar-mental-health-new.png', path: '/dashboard/mental-health' },
      ],
    },
  ];

  return (
    <aside className="w-[clamp(280px,15.4vw,305px)] h-screen bg-white overflow-y-auto sticky top-0 left-0" style={{ boxShadow: '3px 0 12px rgba(0,0,0,0.06), 1px 0 3px rgba(0,0,0,0.04)', zIndex: 1 }}>
      {/* Sidebar Content */}
      <nav className="py-[clamp(1rem,1.5vw,1.5rem)] px-[clamp(0.75rem,1vw,1rem)]">
        {navigationSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-[clamp(1.5rem,2vw,2rem)]">
            {/* Section Title */}
            <h3 className="text-[#666666] font-inter font-medium text-[clamp(14px,1.04vw,20px)] uppercase tracking-[-0.01em] mb-[clamp(0.75rem,1vw,1rem)] px-[clamp(0.5rem,0.625vw,0.75rem)]">
              {section.title}
            </h3>

            {/* Section Items */}
            <ul className="space-y-[clamp(0.25rem,0.4vw,0.5rem)]">
              {section.items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.path}
                    onClick={() => setActiveItem(item.id)}
                    className={`
                      flex items-center gap-[clamp(0.75rem,0.83vw,1rem)]
                      px-[clamp(0.5rem,0.625vw,0.75rem)]
                      py-[clamp(0.5rem,0.625vw,0.75rem)]
                      rounded-[4px]
                      transition-all duration-200
                      ${
                        activeItem === item.id
                          ? 'bg-[#EFF6FF] text-[#17223E]'
                          : 'text-[#1A1A1A] hover:bg-gray-50 hover:text-[#17223E]'
                      }
                    `}
                  >
                    {/* Icon */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={item.icon} 
                      alt={item.label}
                      className="w-[clamp(16px,1.25vw,24px)] h-[clamp(16px,1.25vw,24px)] flex-shrink-0 object-contain"
                    />

                    {/* Label */}
                    <span className="font-inter font-medium text-[clamp(14px,0.94vw,18px)] leading-[100%]">
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
