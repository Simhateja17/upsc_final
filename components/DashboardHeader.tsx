'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/lib/services';

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  created_at: string;
}

function getNotificationIcon(type: string): string {
  switch (type) {
    case 'mcq_reminder': return '\u{1F4DD}';
    case 'answer_evaluated': return '✅';
    case 'digest': return '\u{1F4F0}';
    case 'streak_alert': return '\u{1F525}';
    case 'weekly_progress': return '\u{1F4CA}';
    case 'spaced_rep': return '\u{1F504}';
    default: return '\u{1F514}';
  }
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

const DashboardHeader = ({ onMenuClick }: DashboardHeaderProps) => {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [mounted, setMounted] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await userService.getNotifications();
      setNotifications(res.data || []);
    } catch {
      // Silent fail — notification fetch is non-critical
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const handleFocus = () => fetchNotifications();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchNotifications]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationModalRef = useRef<HTMLDivElement>(null);
  const isUpgradeActive = pathname === '/dashboard/billing/plans' || pathname.startsWith('/dashboard/billing/plans/');
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (notificationModalRef.current && !notificationModalRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get display name
  const displayName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email?.split('@')[0] || 'User';

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  const handleMarkAllRead = async () => {
    try {
      await userService.markAllNotificationsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    } catch {
      // Silent fail
    }
  };

  const handleNotificationClick = async (id: string) => {
    try {
      await userService.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: true } : item))
      );
    } catch {
      // Silent fail
    }
  };

  return (
    <header className="w-full h-[clamp(56px,5.78vw,111px)] flex items-center justify-between px-3 md:px-[clamp(1rem,2vw,2.5rem)] sticky top-0 z-50" style={{ background: 'rgba(7,14,30,0.98)', backdropFilter: 'blur(24px) saturate(200%)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Left: Hamburger (mobile) + Logo */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Hamburger button – visible on mobile/tablet only */}
        <button
          onClick={onMenuClick}
          className="lg:hidden flex items-center justify-center w-11 h-11 rounded-lg text-white hover:bg-white/10 transition-colors flex-shrink-0"
          aria-label="Open navigation menu"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6H19M3 11H19M3 16H19" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <Link href="/dashboard" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="RiseWithJeet Logo"
            className="w-[90px] md:w-[110px] h-auto object-contain"
          />
        </Link>
      </div>

      {/* Right Section - Upgrade + Bell + User Avatar */}
      <div className="flex items-center gap-3 md:gap-[clamp(1rem,1.5vw,2rem)]">
        {/* Upgrade Button */}
        <Link href="/dashboard/billing/plans" className="hidden sm:block">
          <button
            className="inline-flex items-center gap-1.5 group"
            style={{
              padding: 'clamp(8px,0.7vw,12px) clamp(16px,1.2vw,24px)',
              borderRadius: '12px',
              border: isUpgradeActive ? '1.5px solid #FFD170' : '1.5px solid rgba(255,209,112,0.25)',
              background: 'transparent',
              color: '#FFD170',
              fontFamily: '"SF Pro", -apple-system, BlinkMacSystemFont, sans-serif',
              fontSize: 'clamp(13px, 1.1vw, 18px)',
              fontWeight: 600,
              lineHeight: '110%',
              letterSpacing: '-0.2px',
              whiteSpace: 'nowrap',
              boxShadow: isUpgradeActive ? '0 0 12px rgba(255,209,112,0.18)' : 'none',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = '#FFD170';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 12px rgba(255,209,112,0.18)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = isUpgradeActive ? '#FFD170' : 'rgba(255,209,112,0.25)';
              (e.currentTarget as HTMLElement).style.boxShadow = isUpgradeActive ? '0 0 12px rgba(255,209,112,0.18)' : 'none';
            }}
          >
            Upgrade
            <span style={{ fontSize: 'clamp(14px, 1.2vw, 20px)' }}>✨</span>
          </button>
        </Link>

        {/* Notification Bell */}
        <button
          onClick={() => setShowNotifications((prev) => !prev)}
          className="relative flex items-center justify-center w-[clamp(38px,2.8vw,48px)] h-[clamp(38px,2.8vw,48px)] rounded-xl bg-[#1a2540] text-white hover:bg-[#243050] transition-colors flex-shrink-0"
          style={{ border: '1px solid rgba(255,255,255,0.16)' }}
          aria-label="Notifications"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" fill="currentColor"/>
            <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" fill="currentColor"/>
          </svg>
          {/* Notification dot */}
          {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>}
        </button>

        {/* User Avatar - Simple gold circle with initials */}
        <div className="relative flex-shrink-0" ref={dropdownRef}>
          <div
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-[clamp(38px,2.8vw,48px)] h-[clamp(38px,2.8vw,48px)] rounded-full flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity font-serif font-bold text-[#0E182D]"
            style={{
              background: 'linear-gradient(135deg, #FFD170 0%, #D4A843 100%)',
              fontSize: 'clamp(14px, 1.1vw, 18px)',
            }}
          >
            {initials}
          </div>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div
              className="absolute right-0 top-full mt-2 z-50"
              style={{
                width: '240px',
                borderRadius: '12px',
                background: '#FFFFFF',
                boxShadow: '0px 4px 6px -4px #0000001A, 0px 10px 15px -3px #0000001A',
              }}
            >
              {/* User Info Section */}
              <div className="px-4 pt-4 pb-3">
                <div className="font-inter font-semibold text-[14px] leading-[20px] text-[#111827]">
                  {displayName}
                </div>
                <div className="font-inter text-[12px] leading-[16px] text-[#9CA3AF] mt-0.5">
                  {user?.email || ''}
                </div>
              </div>

              <hr className="border-[#F3F4F6] mx-0" />

              {/* Menu Items */}
              <div className="py-1.5">
                <Link
                  href="/dashboard/profile"
                  className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 transition-colors"
                  onClick={() => setShowDropdown(false)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/nav-profile.png" alt="" className="w-4 h-4 object-contain opacity-60" />
                  <span className="font-inter font-medium text-[13px] leading-none text-[#374151]">
                    My Profile
                  </span>
                </Link>

                <Link
                  href="/dashboard/billing"
                  className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 transition-colors"
                  onClick={() => setShowDropdown(false)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/nav-billing.png" alt="" className="w-4 h-4 object-contain opacity-60" />
                  <span className="font-inter font-medium text-[13px] leading-none text-[#374151]">
                    Billing &amp; Plan
                  </span>
                </Link>

                <Link
                  href="/dashboard/bookmarks"
                  className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 transition-colors"
                  onClick={() => setShowDropdown(false)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/nav-bookmark.png" alt="" className="w-4 h-4 object-contain opacity-60" />
                  <span className="font-inter font-medium text-[13px] leading-none text-[#374151]">
                    Bookmarks
                  </span>
                </Link>

                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 transition-colors"
                  onClick={() => setShowDropdown(false)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/nav-settings.png" alt="" className="w-4 h-4 object-contain opacity-60" />
                  <span className="font-inter font-medium text-[13px] leading-none text-[#374151]">
                    Account Settings
                  </span>
                </Link>

                <Link
                  href="/contact"
                  className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 transition-colors"
                  onClick={() => setShowDropdown(false)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/nav-sos.png" alt="" className="w-4 h-4 object-contain opacity-60" />
                  <span className="font-inter font-medium text-[13px] leading-none text-[#374151]">
                    Help &amp; Support
                  </span>
                </Link>

                <Link
                  href="/dashboard/feedback"
                  className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 transition-colors"
                  onClick={() => setShowDropdown(false)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/nav-feedback.png" alt="" className="w-4 h-4 object-contain opacity-60" />
                  <span className="font-inter font-medium text-[13px] leading-none text-[#374151]">
                    Feedback
                  </span>
                </Link>

                {user?.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowDropdown(false)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/nav-admin.png" alt="" className="w-4 h-4 object-contain opacity-60" />
                    <span className="font-inter font-medium text-[13px] leading-none text-[#374151]">
                      Admin Panel
                    </span>
                  </Link>
                )}
              </div>

            </div>
          )}
        </div>
      </div>

      {showNotifications && mounted && createPortal(
        <div className="fixed inset-0 z-[90] bg-black/35 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div
            ref={notificationModalRef}
            className="w-full max-w-[520px] max-h-[90vh] rounded-2xl bg-white border border-[#E5E7EB] shadow-[0_20px_60px_rgba(0,0,0,0.18)] flex flex-col overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
          >
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
              <h2 className="font-inter font-semibold text-[20px] leading-[28px] text-[#334155]">Notifications</h2>
              <button
                onClick={() => setShowNotifications(false)}
                className="w-8 h-8 rounded-md text-[#94A3B8] hover:bg-[#F8FAFC] transition-colors flex items-center justify-center"
                aria-label="Close notifications"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-3">
              {notifications.length === 0 ? (
                <p className="font-inter text-[14px] text-[#94A3B8] text-center py-6">You&apos;re all caught up.</p>
              ) : (
                notifications.map((item, index) => (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item.id)}
                    className="rounded-xl px-4 py-3 flex items-start gap-3 cursor-pointer hover:opacity-90 transition-opacity"
                    style={{
                      background: item.read ? '#E9EEF8' : index === 0 ? '#F8F2E8' : '#E9EEF8',
                      opacity: item.read ? 0.75 : 1,
                    }}
                  >
                    <span className="text-[16px] leading-none mt-[2px]">{getNotificationIcon(item.type)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-inter text-[14px] leading-[20px] text-[#334155] font-medium truncate">{item.title}</p>
                      {item.body && (
                        <p className="font-inter text-[12px] leading-[16px] text-[#64748B] mt-0.5 line-clamp-2">{item.body}</p>
                      )}
                      <p className="font-inter text-[11px] leading-[16px] text-[#94A3B8] mt-0.5">{formatRelativeTime(item.created_at)}</p>
                    </div>
                    {!item.read && (
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-[#2563eb] flex-shrink-0" />
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex-shrink-0 px-5 py-4 border-t border-[#E5E7EB] flex justify-end gap-2">
              <button
                onClick={() => setShowNotifications(false)}
                className="px-4 py-2 rounded-lg border border-[#D8DFEC] bg-[#F2F5FB] text-[#64748B] font-inter text-[13px] leading-[18px] font-semibold hover:bg-[#E9EEF8] transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleMarkAllRead}
                className="px-4 py-2 rounded-lg border border-[#D8DFEC] bg-[#F2F5FB] text-[#334155] font-inter text-[13px] leading-[18px] font-semibold hover:bg-[#E9EEF8] transition-colors"
              >
                Mark all read
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </header>
  );
};

export default DashboardHeader;
