'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import '@/styles/landing.css';

const NAV_DROPDOWNS = {
  prepare: [
    { label: 'Study Material', href: '/dashboard/library' },
    { label: 'Video Lectures', href: '/dashboard/video-lectures' },
    { label: 'Current Affairs', href: '/dashboard/current-affairs' },
    { label: 'Study Planner', href: '/dashboard/study-planner' },
    { label: 'Syllabus Tracker', href: '/dashboard/syllabus-tracker' },
  ],
  practice: [
    { label: 'Daily MCQs', href: '/dashboard/daily-mcq' },
    { label: 'Daily Mains Answer', href: '/dashboard/daily-answer' },
    { label: 'Mock Tests', href: '/dashboard/mock-tests' },
    { label: 'Previous Year Questions', href: '/dashboard/pyq' },
    { label: 'Test Series', href: '/dashboard/test-series' },
  ],
  revision: [
    { label: 'Flashcards', href: '/dashboard/flashcards' },
    { label: 'Mind Maps', href: '/dashboard/mindmap' },
    { label: 'Spaced Repetition', href: '/dashboard/spaced-repetition' },
  ],
};

export default function LandingNav() {
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const go = (path: string) => {
    setMobileNavOpen(false);
    document.body.style.overflow = '';
    router.push(path);
  };

  const closeMobileNav = () => {
    setMobileNavOpen(false);
    document.body.style.overflow = '';
  };

  // Scroll tint effect
  useEffect(() => {
    const nav = document.getElementById('lp-main-nav');
    if (!nav) return;
    const onScroll = () => {
      nav.style.background = window.scrollY > 60 ? 'rgba(7,14,30,0.99)' : 'rgba(7,14,30,0.98)';
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Cleanup body scroll lock on unmount
  useEffect(() => {
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <>
      <nav className="landing-nav" id="lp-main-nav">
        <Link href="/" className="logo">
          <Image
            src="/logo.png"
            alt="RiseWithJeet"
            width={500}
            height={500}
            className="w-[90px] md:w-[110px] h-auto object-contain"
          />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center" style={{ gap: 28 }}>
          <Link href="/dashboard/jeet-gpt" style={{ color: 'rgba(255,255,255,0.58)', textDecoration: 'none', fontSize: 14, fontWeight: 500, fontFamily: "'Outfit',sans-serif", whiteSpace: 'nowrap', transition: 'color 0.2s' }} className="hover:!text-[#E8B84B]">Jeet AI</Link>
          <Link href="/dashboard/daily-answer/challenge" style={{ color: 'rgba(255,255,255,0.58)', textDecoration: 'none', fontSize: 14, fontWeight: 500, fontFamily: "'Outfit',sans-serif", whiteSpace: 'nowrap', transition: 'color 0.2s' }} className="hover:!text-[#E8B84B]">Daily Mains Challenge</Link>

          {(['prepare', 'practice', 'revision'] as const).map((key) => {
            const labels: Record<string, string> = { prepare: 'Prepare', practice: 'Practice', revision: 'Revision Tools' };
            return (
              <div
                key={key}
                className="relative"
                onMouseEnter={() => setActiveDropdown(key)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'rgba(255,255,255,0.58)', fontSize: 14, fontWeight: 500, fontFamily: "'Outfit',sans-serif", cursor: 'pointer', whiteSpace: 'nowrap', padding: 0 }} className="hover:!text-[#E8B84B]">
                  {labels[key]}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                </button>
                {activeDropdown === key && (
                  /* pt-2 bridges the gap so the mouse doesn't leave the hover zone */
                  <div className="absolute top-full left-0 pt-2 z-50" style={{ minWidth: 200 }}>
                    <div className="rounded-xl shadow-2xl py-1" style={{ background: '#0E182D', border: '1px solid rgba(255,255,255,0.10)' }}>
                      {NAV_DROPDOWNS[key].map(item => (
                        <Link
                          key={item.href}
                          href={item.href}
                          style={{ display: 'block', padding: '10px 16px', fontSize: 13.5, color: 'rgba(255,255,255,0.70)', textDecoration: 'none', fontFamily: "'Outfit',sans-serif", transition: 'color 0.15s, background 0.15s' }}
                          className="hover:!text-[#E8B84B] hover:!bg-white/5"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <Link href="/dashboard/study-groups" style={{ color: 'rgba(255,255,255,0.58)', textDecoration: 'none', fontSize: 14, fontWeight: 500, fontFamily: "'Outfit',sans-serif", whiteSpace: 'nowrap' }} className="hover:!text-[#E8B84B]">Community</Link>
          <Link href="/dashboard/billing/plans" style={{ color: 'rgba(255,255,255,0.58)', textDecoration: 'none', fontSize: 14, fontWeight: 500, fontFamily: "'Outfit',sans-serif", whiteSpace: 'nowrap' }} className="hover:!text-[#E8B84B]">Pricing</Link>
        </div>

        <div className="nav-btns hidden md:flex">
          <button className="btn-nav-ghost" onClick={() => go('/login?tab=login')}>Login</button>
          <button className="btn-nav-gold" onClick={() => go('/login?tab=signup')}>Start Free →</button>
        </div>

        <button
          className={`nav-hamburger${mobileNavOpen ? ' open' : ''}`}
          aria-label="Open menu"
          onClick={() => {
            const next = !mobileNavOpen;
            setMobileNavOpen(next);
            document.body.style.overflow = next ? 'hidden' : '';
          }}
        >
          <span /><span /><span />
        </button>
      </nav>

      {/* Mobile nav */}
      <div className={`mobile-nav${mobileNavOpen ? ' open' : ''}`}>
        <a href="/dashboard/jeet-gpt" onClick={closeMobileNav}>Jeet AI</a>
        <a href="/dashboard/daily-answer/challenge" onClick={closeMobileNav}>Daily Mains Challenge</a>
        <div style={{ padding: '10px 0 4px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ color: '#E8B84B', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Prepare</div>
          {NAV_DROPDOWNS.prepare.map(i => <a key={i.href} href={i.href} onClick={closeMobileNav} style={{ paddingLeft: 12, fontSize: 14 }}>{i.label}</a>)}
        </div>
        <div style={{ padding: '10px 0 4px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ color: '#E8B84B', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Practice</div>
          {NAV_DROPDOWNS.practice.map(i => <a key={i.href} href={i.href} onClick={closeMobileNav} style={{ paddingLeft: 12, fontSize: 14 }}>{i.label}</a>)}
        </div>
        <div style={{ padding: '10px 0 4px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ color: '#E8B84B', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Revision Tools</div>
          {NAV_DROPDOWNS.revision.map(i => <a key={i.href} href={i.href} onClick={closeMobileNav} style={{ paddingLeft: 12, fontSize: 14 }}>{i.label}</a>)}
        </div>
        <a href="/dashboard/study-groups" onClick={closeMobileNav}>Community</a>
        <a href="/dashboard/billing/plans" onClick={closeMobileNav}>Pricing</a>
        <div className="mobile-nav-btns">
          <button className="btn-nav-ghost" onClick={() => go('/login?tab=login')}>Login</button>
          <button className="btn-nav-gold" onClick={() => go('/login?tab=signup')}>Start Free →</button>
        </div>
      </div>
    </>
  );
}
