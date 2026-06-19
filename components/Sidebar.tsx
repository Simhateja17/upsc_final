'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useEntitlements } from '@/contexts/EntitlementsContext';

interface SidebarProps {
  forceShow?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  /** When true, render only as a mobile drawer (hidden on desktop). */
  mobileOnly?: boolean;
  /** Controlled collapsed state. When provided, the parent manages collapse. */
  collapsed?: boolean;
  /** Callback when the sidebar toggle is clicked (used in controlled mode). */
  onToggle?: () => void;
}

const Sidebar = ({ isOpen, onClose, mobileOnly = false, collapsed: collapsedProp, onToggle }: SidebarProps) => {
  const pathname = usePathname();
  const entitlements = useEntitlements();
  const isControlled = collapsedProp !== undefined;
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = isControlled ? collapsedProp : internalCollapsed;

  useEffect(() => {
    if (isControlled) return;
    try {
      setInternalCollapsed(localStorage.getItem('rwj_sidebar_collapsed') === 'true');
    } catch {
      // ignore
    }
  }, [isControlled]);

  function toggle() {
    if (isControlled) {
      onToggle?.();
      return;
    }
    const next = !internalCollapsed;
    setInternalCollapsed(next);
    try { localStorage.setItem('rwj_sidebar_collapsed', String(next)); } catch { /* ignore */ }
  }

  const navigationSections = [
    {
      title: 'DASHBOARD',
      items: [
        { id: 'overview', label: 'Overview', icon: '/sidebar-overview.png', path: '/dashboard' },
        { id: 'study-planner', label: 'Study Planner', icon: '/sidebar-study-planner.png', path: '/dashboard/study-planner' },
        { id: 'jeet-gpt', label: 'Jeet AI Mentor', icon: '/sidebar-jeet-gpt.png', path: '/dashboard/jeet-gpt' },
        { id: 'syllabus-tracker', label: 'Syllabus Tracker', icon: '/sidebar-syllabus-new.png', path: '/dashboard/syllabus-tracker', accessKey: 'syllabus_tracker', allowed: ['full', 'limited'] },
      ],
    },
    {
      title: 'PREPARE',
      items: [
        { id: 'study-material', label: 'Study Material', icon: '/sidebar-study-material-new2.png', path: '/dashboard/library' },
        { id: 'video-lectures', label: 'Video Lectures', icon: '/sidebar-video.png', path: '/dashboard/video-lectures' },
        { id: 'current-affairs', label: 'Current Affairs', icon: '/sidebar-current-affairs.png', path: '/dashboard/daily-editorial' },
        { id: 'test-series', label: 'Test Series', icon: '/sidebar-test-series.png', path: '/dashboard/test-series' },
      ],
    },
    {
      title: 'PRACTICE',
      items: [
        { id: 'daily-mcq', label: 'Daily MCQ Challenge', icon: '/target-icon.png', path: '/dashboard/daily-mcq' },
        { id: 'daily-answer', label: 'Daily Answer Writing', icon: '/sidebar-daily-answer-new.png', path: '/dashboard/daily-answer' },
        { id: 'mock-tests', label: 'Mock Tests', icon: '/sidebar-mock-tests-new.png', path: '/dashboard/mock-tests' },
        { id: 'mains-answer-evaluator', label: 'Mains Answer Evaluator', icon: '/sidebar-daily-answer-new.png', path: '/dashboard/mains-answer-evaluator' },
        { id: 'pyq', label: 'Previous Year Questions', icon: '/sidebar-pyq-new.png', path: '/dashboard/pyq' },
      ],
    },
    {
      title: 'ANALYTICS',
      items: [
        { id: 'performance', label: 'Performance Analytics', icon: '/sidebar-performance-new.png', path: '/dashboard/performance', accessKey: 'analytics', allowed: ['full', 'limited'] },
        { id: 'test-analytics', label: 'Test Analytics', icon: '/sidebar-analytics-new.png', path: '/dashboard/test-analytics', accessKey: 'test_analytics', allowed: ['full', 'limited'] },
      ],
    },
    {
      title: 'REVISION TOOLS',
      items: [
        { id: 'flashcards', label: 'Flashcards', icon: '/sidebar-flashcards-new.png', path: '/dashboard/flashcards', accessKey: 'flashcards', allowed: ['full', 'limited'] },
        { id: 'mindmap', label: 'Mindmaps', icon: '/sidebar-mindmap-new.png', path: '/dashboard/mindmap', accessKey: 'mindmaps', allowed: ['full', 'limited'] },
        { id: 'spaced-repetition', label: 'Spaced Repetition', icon: '/sidebar-spaced-repetition.png', path: '/dashboard/spaced-repetition', accessKey: 'spaced_repetition', allowed: ['full', 'limited'] },
      ],
    },
    {
      title: 'COMMUNITY',
      items: [
        { id: 'study-groups', label: 'Study Groups', icon: '/sidebar-mindmap.png', path: '/dashboard/study-groups', accessKey: 'live_study_room', allowed: ['full'] },
        { id: 'leaderboard', label: 'Leaderboard', icon: '/sidebar-study-groups.png', path: '/dashboard/leaderboard' },
        { id: 'discussion', label: 'Discussion Forum', icon: '/sidebar-discussion.png', path: '/dashboard/discussion' },
        { id: 'mental-health', label: 'Mental Health Buddy', icon: '/sidebar-mental-health-new.png', path: '/dashboard/mental-health', accessKey: 'mental_health_buddy', allowed: ['full'] },
      ],
    },
  ];

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          bg-white flex-shrink-0 flex flex-col
          ${collapsed ? 'w-[60px] min-w-[60px]' : 'w-[260px] min-w-[260px]'}
          ${mobileOnly ? 'fixed lg:hidden' : 'fixed lg:relative'} left-0 z-30 lg:z-auto
          top-[clamp(56px,5.78vw,111px)] bottom-0 lg:top-0 lg:bottom-auto lg:h-full
          ${isOpen ? 'translate-x-0' : `-translate-x-full ${mobileOnly ? '' : 'lg:translate-x-0'}`}
        `}
        style={{
          boxShadow: '3px 0 12px rgba(0,0,0,0.06), 1px 0 3px rgba(0,0,0,0.04)',
          transition: 'width 220ms ease, min-width 220ms ease, transform 220ms ease',
        }}
      >
        {/* Hamburger toggle — desktop only */}
        <div
          className={`
            hidden lg:flex items-center flex-shrink-0 border-b border-[#F0F2F5]
            ${collapsed ? 'justify-center px-0 py-3' : 'justify-end px-3 py-3'}
          `}
        >
          <button
            onClick={toggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="w-8 h-8 flex items-center justify-center rounded-[6px] text-[#9AA3B2] hover:bg-[#F3F4F6] hover:text-[#17223E] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect y="2.5" width="16" height="1.5" rx="0.75" fill="currentColor"/>
              <rect y="7.25" width="16" height="1.5" rx="0.75" fill="currentColor"/>
              <rect y="12" width="16" height="1.5" rx="0.75" fill="currentColor"/>
            </svg>
          </button>
        </div>

        {/* Nav items */}
        <nav className={`flex-1 overflow-y-auto ${collapsed ? 'pt-3 pb-8 px-2' : 'pt-3 pb-8 px-4'}`}>
          {navigationSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-5">
              {!collapsed && (
                <h3 className="text-[#999999] font-inter font-semibold text-[10px] uppercase tracking-[0.08em] mb-2 px-3">
                  {section.title}
                </h3>
              )}

              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const locked = item.accessKey ? !entitlements.canAccess(item.accessKey, item.allowed as any) : false;
                  return (
                  <li key={item.id}>
                    <Link
                      href={item.path}
                      title={collapsed ? item.label : undefined}
                      onClick={onClose}
                      className={`
                        flex items-center gap-[10px]
                        ${collapsed ? 'justify-center px-0 py-[9px]' : 'px-3 py-[9px]'}
                        rounded-[6px]
                        transition-all duration-200
                        ${
                          pathname === item.path
                            ? 'bg-[#EFF6FF] text-[#17223E]'
                            : 'text-[#1A1A1A] hover:bg-gray-50 hover:text-[#17223E]'
                        }
                      `}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.icon}
                        alt={item.label}
                        className="w-[18px] h-[18px] flex-shrink-0 object-contain"
                      />
                      {!collapsed && (
                        <>
                          <span className="font-inter font-medium text-[13px] leading-none whitespace-nowrap">
                            {item.label}
                          </span>
                          {locked && (
                            <span className="ml-auto rounded-full bg-[#FFF7E0] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.04em] text-[#9A7020]">
                              Lock
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                )})}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
