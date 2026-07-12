'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
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
    case 'streak_milestone': return '\u{1F525}';
    case 'streak_daily': return '\u{1F525}';
    case 'weekly_progress': return '\u{1F4CA}';
    case 'spaced_rep': return '\u{1F504}';
    case 'mock_test_available': return '\u{1F4CC}';
    case 'daily_trio_reminder': return '\u{1F4DA}';
    default: return '\u{1F514}';
  }
}

function getNotificationRoute(type: string): string {
  switch (type) {
    case 'mcq_reminder': return '/dashboard/daily-mcq';
    case 'answer_evaluated': return '/dashboard/daily-answer/history';
    case 'digest': return '/dashboard/current-affairs';
    case 'streak_alert': return '/dashboard';
    case 'streak_milestone': return '/dashboard';
    case 'streak_daily': return '/dashboard';
    case 'weekly_progress': return '/dashboard/performance';
    case 'spaced_rep': return '/dashboard/spaced-repetition';
    case 'mock_test_available': return '/dashboard/mock-tests';
    case 'daily_trio_reminder': return '/dashboard';
    default: return '/dashboard';
  }
}

function getNotificationIconStyle(type: string): { background: string; color: string } {
  switch (type) {
    case 'streak_alert':
    case 'streak_milestone':
    case 'streak_daily':
      return { background: '#FFF1DC', color: '#E48A00' };
    case 'answer_evaluated':
      return { background: '#EAF2FF', color: '#3459E6' };
    case 'digest':
      return { background: '#EAFFF3', color: '#0DA95E' };
    case 'weekly_progress':
      return { background: '#FFF5D8', color: '#C98A06' };
    case 'spaced_rep':
      return { background: '#F3EFFF', color: '#7447DB' };
    default:
      return { background: '#FFF0F0', color: '#C83333' };
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

// Only these high-value, out-of-band notification types pop a transient toast.
// Everything else (reminders, digests) lives quietly in the bell.
const TOAST_WHITELIST = new Set(['streak_milestone', 'answer_evaluated']);

const DashboardHeader = ({ onMenuClick }: DashboardHeaderProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toasts, setToasts] = useState<NotificationItem[]>([]);
  const [mounted, setMounted] = useState(false);

  const seenKey = user?.id ? `notif_seen_${user.id}` : null;

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await userService.getNotifications();
      const list = (res.data || []) as NotificationItem[];
      setNotifications(list);

      // Surface only genuinely-new, high-value notifications as toasts. "Seen"
      // ids are persisted per-user so a page refresh or tab-focus refetch never
      // re-toasts something the user has already been shown.
      if (seenKey) {
        let seen: string[] = [];
        try { seen = JSON.parse(localStorage.getItem(seenKey) || '[]'); } catch {}
        const seenSet = new Set(seen);
        const fresh = list.filter(
          (n) => TOAST_WHITELIST.has(n.type) && !n.read && !seenSet.has(n.id)
        );
        if (fresh.length > 0) {
          const toShow = fresh.slice(0, 3);
          setToasts((prev) => [...toShow, ...prev].slice(0, 3));
          toShow.forEach((n) => setTimeout(() => dismissToast(n.id), 6000));
        }
        const merged = Array.from(new Set([...seen, ...list.map((n) => n.id)])).slice(-300);
        try { localStorage.setItem(seenKey, JSON.stringify(merged)); } catch {}
      }
    } catch {
      // Silent fail — notification fetch is non-critical
    }
  }, [seenKey, dismissToast]);

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
  const visibleNotifications = notifications;

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

  const isLoggedIn = Boolean(user);
  const displayName = isLoggedIn
    ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email?.split('@')[0] || 'User'
    : '';
  const initials = isLoggedIn
    ? `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || user?.email?.[0]?.toUpperCase() || ''
    : '';
  const avatarUrl = isLoggedIn ? user?.avatarUrl || '' : '';

  const handleMarkAllRead = async () => {
    try {
      await userService.markAllNotificationsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    } catch {
      // Silent fail
    }
  };

  const handleClearAll = async () => {
    try {
      await userService.clearAllNotifications();
      setNotifications([]);
    } catch {
      // Silent fail
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    setShowNotifications(false);
    router.push(getNotificationRoute(item.type));
    try {
      await userService.markNotificationRead(item.id);
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
        {isLoggedIn ? (
          <>
            {/* Upgrade Button */}
            <Link href="/dashboard/billing/plans#upgrade-plans" className="hidden sm:block">
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
              {/* Unread count badge */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* User Avatar */}
            <div className="relative flex-shrink-0" ref={dropdownRef}>
              <div
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-[clamp(38px,2.8vw,48px)] h-[clamp(38px,2.8vw,48px)] rounded-full flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity font-serif font-bold text-[#0E182D] overflow-hidden"
                style={{
                  background: avatarUrl ? '#0E182D' : 'linear-gradient(135deg, #FFD170 0%, #D4A843 100%)',
                  fontSize: 'clamp(14px, 1.1vw, 18px)',
                }}
                title={displayName || 'Profile'}
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={displayName || 'Profile'}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  initials
                )}
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
                  href="/dashboard/billing/plans"
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
          </>
        ) : isLoading ? (
          <div className="h-[clamp(38px,2.8vw,48px)] w-20 rounded-xl bg-white/10" aria-hidden="true" />
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="h-[clamp(38px,2.8vw,48px)] rounded-xl border border-white/25 px-4 text-[13px] font-semibold text-white transition-colors hover:bg-white/10"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => openAuthModal('signup')}
              className="hidden h-[clamp(38px,2.8vw,48px)] rounded-xl px-4 text-[13px] font-semibold text-[#0E182D] transition-opacity hover:opacity-90 sm:block"
              style={{ background: 'linear-gradient(135deg, #FFD170 0%, #D4A843 100%)' }}
            >
              Start Free
            </button>
          </div>
        )}
      </div>

      {isLoggedIn && showNotifications && mounted && createPortal(
        <aside
          ref={notificationModalRef}
          className="fixed right-5 top-[calc(clamp(56px,5.78vw,111px)+12px)] z-[90] flex max-h-[calc(100vh-100px)] w-[min(400px,calc(100vw-24px))] flex-col overflow-hidden rounded-[20px] border border-[#E5EAF4] bg-white shadow-[0_28px_70px_rgba(10,17,35,0.22)] max-sm:left-2.5 max-sm:right-2.5 max-sm:w-auto"
          role="dialog"
          aria-label="Notifications"
        >
          <div className="flex items-center justify-between border-b border-[#EEF1F8] px-5 pb-3.5 pt-[18px]">
            <div className="flex items-center gap-2.5">
              <h2 className="font-inter text-[18px] font-black tracking-[-0.03em] text-[#171B2A]">Notifications</h2>
              {unreadCount > 0 && (
                <span className="min-w-[22px] rounded-full bg-gradient-to-br from-[#FFBD00] to-[#FF8A00] px-2 py-[3px] text-center text-[11px] font-black text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={handleMarkAllRead}
              className="rounded-lg px-2 py-1 text-[12px] font-black text-[#4F63D9] transition-colors hover:bg-[#EAF0FF]"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-[380px] overflow-y-auto px-3 pb-3 pt-2 [scrollbar-width:thin] [scrollbar-color:#D5DAE6_transparent]">
            {visibleNotifications.length === 0 ? (
              <p className="px-5 py-10 text-center text-[13px] font-bold text-[#A0A8B9]">You&apos;re all caught up.</p>
            ) : (
              visibleNotifications.map((item) => {
                const iconStyle = getNotificationIconStyle(item.type);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNotificationClick(item)}
                    className="grid w-full grid-cols-[40px_minmax(0,1fr)_auto] items-start gap-3 rounded-[14px] px-2.5 py-3 text-left transition-all hover:-translate-x-0.5 hover:bg-[#F7F9FD]"
                    style={{ background: item.read ? 'transparent' : '#F7F9FD' }}
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-[12px] text-[18px]" style={iconStyle}>
                      {getNotificationIcon(item.type)}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[14px] font-black tracking-[-0.01em] text-[#171B2A]">{item.title}</span>
                      {item.body && <span className="mt-[3px] block line-clamp-2 text-[12.5px] leading-[1.4] text-[#626C80]">{item.body}</span>}
                    </span>
                    <span className="mt-[3px] whitespace-nowrap text-[10.5px] font-extrabold text-[#A0A8B9]">{formatRelativeTime(item.created_at)}</span>
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t border-[#EEF1F8] px-5 py-3 text-center">
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 text-[13px] font-black text-[#27337A] transition-colors hover:text-[#4F63D9]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
              Clear All
            </button>
          </div>
        </aside>,
        document.body,
      )}

      {/* Transient toasts for high-value notifications (top-right) */}
      {mounted && toasts.length > 0 && createPortal(
        <div className="fixed top-[76px] right-4 z-[9999] flex flex-col gap-2 w-[340px] max-w-[calc(100vw-2rem)]">
          {toasts.map((t) => (
            <div
              key={t.id}
              onClick={() => { dismissToast(t.id); handleNotificationClick(t); }}
              role="status"
              className="cursor-pointer rounded-xl bg-white shadow-[0_8px_24px_rgba(15,23,42,0.16)] border border-[#E5E7EB] px-4 py-3 flex gap-3 items-start animate-[slideInRight_0.25s_ease-out]"
            >
              <span className="text-[18px] leading-none mt-[2px]">{getNotificationIcon(t.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="font-inter font-semibold text-[14px] leading-[20px] text-[#334155]">{t.title}</p>
                <p className="font-inter text-[13px] leading-[18px] text-[#64748B] mt-0.5">{t.body}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); dismissToast(t.id); }}
                className="text-[#94A3B8] hover:text-[#334155] text-[16px] leading-none flex-shrink-0"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </header>
  );
};

export default DashboardHeader;
