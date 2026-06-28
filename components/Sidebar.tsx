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
        { id: 'overview', label: 'Home', icon: '/sidebar-overview.png', path: '/dashboard' },
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
        { id: 'pyq', label: 'Previous Year Questions', icon: '/sidebar-pyq-new.png', path: '/dashboard/pyq' },
        // Test Series is hidden for now; re-enable when it is ready.
        // { id: 'test-series', label: 'Test Series', icon: '/sidebar-test-series.png', path: '/dashboard/test-series' },
      ],
    },
    {
      title: 'PRACTICE',
      items: [
        { id: 'daily-mcq', label: 'Daily MCQ Challenge', icon: '/target-icon.png', path: '/dashboard/daily-mcq' },
        { id: 'daily-answer', label: 'Daily Answer Writing', icon: '/sidebar-daily-answer-new.png', path: '/dashboard/daily-answer' },
        { id: 'mock-tests', label: 'Mock Tests', icon: '/sidebar-mock-tests-new.png', path: '/dashboard/mock-tests' },
        { id: 'mains-answer-evaluator', label: 'Mains Answer Evaluator', icon: '✍️', path: '/dashboard/mains-answer-evaluator' },
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
        {/* Focus Mode + Hamburger toggle — desktop only.
            Expanded: Focus Mode pill on the left, hamburger on the right (same row).
            Collapsed: Focus Mode icon on top, hamburger below (stacked, centered). */}
        <div
          className={`
            hidden lg:flex flex-shrink-0 border-b border-[#F0F2F5] gap-2
            ${collapsed ? 'flex-col items-center px-0 py-3' : 'flex-row items-center justify-center px-3 py-3'}
          `}
        >
          {/* Focus Mode button */}
          <Link
            href="/dashboard/study-groups?tab=solo"
            title="Focus Mode"
            onClick={onClose}
            style={{
              boxShadow:
                '0 1px 0 rgba(255,255,255,.7) inset, 0 1px 2px rgba(14,20,48,.06)',
            }}
            className={`
              relative flex items-center select-none overflow-hidden
              bg-white border border-[#E5E7EB]
              hover:border-[#D9D2FF] transition-all
              ${collapsed ? 'justify-center w-9 h-9 rounded-[0.6rem]' : 'gap-[0.55rem] px-[0.8rem] py-2 rounded-full'}
            `}
          >
            {/* Pulsing indigo dot */}
            {!collapsed && (
              <span className="focus-pulse-dot h-[9px] w-[9px] flex-shrink-0" aria-hidden="true" />
            )}
            {/* Focus icon (person) */}
            <svg className="w-[17px] h-[17px] flex-shrink-0 text-[#4F46E5]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="12" cy="5.4" r="2.4" />
              <path d="M12 9.2c-3.4 0-6 2.4-7 5.6-.4 1.2-1.3 1.5-2 1.7-.7.2-1 .7-1 1.3 0 .7.5 1.2 1.2 1.2h17.6c.7 0 1.2-.5 1.2-1.2 0-.6-.3-1.1-1-1.3-.7-.2-1.6-.5-2-1.7-1-3.2-3.6-5.6-7-5.6z" />
            </svg>
            {!collapsed && (
              <span className="font-inter font-semibold text-[0.9rem] leading-none whitespace-nowrap tracking-[0.1px] text-[#0E1430]">
                Focus Mode
              </span>
            )}
          </Link>

          {/* Hamburger toggle */}
          <button
            onClick={toggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="w-8 h-8 flex items-center justify-center rounded-[6px] flex-shrink-0 text-[#9AA3B2] hover:bg-[#F3F4F6] hover:text-[#17223E] transition-colors"
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
                      {item.icon.startsWith('/') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.icon}
                          alt={item.label}
                          className="w-[18px] h-[18px] flex-shrink-0 object-contain"
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="w-[18px] h-[18px] flex-shrink-0 flex items-center justify-center text-[15px] leading-none"
                        >
                          {item.icon}
                        </span>
                      )}
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
