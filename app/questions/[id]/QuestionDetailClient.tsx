'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/Footer';
import LandingNav from '@/components/LandingNav';
import StructuredQuestionRenderer from '@/components/StructuredQuestionRenderer';
import QuestionTextRenderer from '@/components/QuestionTextRenderer';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { bookmarkService, pyqService } from '@/lib/services';

type PublicQuestion = {
  id: string;
  mode?: 'prelims' | 'mains';
  year?: number | null;
  paper?: string | null;
  questionNum?: number | null;
  questionText: string;
  subject?: string | null;
  subSubject?: string | null;
  topic?: string | null;
  difficulty?: string | null;
  options?: Array<{ label: string; text: string }> | null;
  correctOption?: string | null;
  explanation?: string | null;
  structuredJson?: any;
  questionStructure?: any;
};

type Props = {
  question: PublicQuestion;
  mode: 'prelims' | 'mains';
  relatedQuestions: PublicQuestion[];
  pyqNavigation: PyqNavigation;
};

type PyqModeKey = 'prelims' | 'mains' | 'csat';

type PyqNavigation = {
  modes: Array<{
    key: PyqModeKey;
    label: string;
    years: Array<{ year: number; count: number }>;
  }>;
  years: Array<{ year: number; count: number }>;
};

const chipStyles = {
  year: 'bg-[#DBEAFE] text-[#1447E6]',
  subject: 'bg-[#E0E7FF] text-[#432DD7]',
  subSubject: 'bg-[#E0F2FE] text-[#0369A1]',
  topic: 'bg-[#F3E8FF] text-[#7E22CE]',
  difficultyEasy: 'bg-[#DCFCE7] text-[#008236]',
  difficultyMedium: 'bg-[#FFEDD4] text-[#CA3500]',
  difficultyHard: 'bg-[#FFE2E2] text-[#C10007]',
  mains: 'bg-[#F3E8FF] text-[#7E22CE]',
};
const QUESTION_FONT = 'var(--font-sora), Inter, sans-serif';
const PLATFORM_ITEMS = [
  { title: 'Daily MCQ Challenge', subtitle: '10 questions daily, all subjects', href: '/dashboard/daily-mcq', icon: 'mcq', bg: 'from-violet-500 to-purple-600' },
  { title: 'Study Planner', subtitle: 'Personalized day-by-day plan', href: '/dashboard/study-planner', icon: 'calendar', bg: 'from-blue-500 to-cyan-600' },
  { title: 'Mock Tests', subtitle: 'Full-length simulated exams', href: '/dashboard/mock-tests', icon: 'star', bg: 'from-amber-500 to-orange-600' },
  { title: 'Jeet AI Mentor', subtitle: 'Ask anything, get instant help', href: '/dashboard/jeet-gpt', icon: 'chat', bg: 'from-rose-500 to-pink-600' },
  { title: 'Performance Analytics', subtitle: 'Deep insights on your prep', href: '/dashboard/performance', icon: 'pulse', bg: 'from-emerald-500 to-teal-600' },
  { title: 'Flashcards & Revision', subtitle: 'Smart spaced repetition', href: '/dashboard/flashcards', icon: 'monitor', bg: 'from-indigo-500 to-blue-700' },
  { title: 'Syllabus Tracker', subtitle: 'Track every topic you cover', href: '/dashboard/syllabus-tracker', icon: 'book', bg: 'from-cyan-500 to-teal-600' },
  { title: 'Study Groups', subtitle: 'Learn together, grow together', href: '/dashboard/study-groups', icon: 'users', bg: 'from-pink-500 to-rose-600' },
];

function cleanText(value?: string | null) {
  return String(value || '').trim();
}

function truncateForUi(value: string, max = 100) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trim()}...` : clean;
}

function getExplanationText(question: PublicQuestion) {
  return (
    question.explanation ||
    question.structuredJson?.explanation?.displayText ||
    question.structuredJson?.explanation?.rawText ||
    ''
  );
}

function optionList(question: PublicQuestion) {
  if (!Array.isArray(question.options)) return [];
  return question.options
    .map((option) => ({
      label: cleanText(option?.label),
      text: cleanText(option?.text),
    }))
    .filter((option) => option.label && option.text);
}

function difficultyClass(difficulty?: string | null) {
  const normalized = cleanText(difficulty).toLowerCase();
  if (normalized === 'hard') return chipStyles.difficultyHard;
  if (normalized === 'easy') return chipStyles.difficultyEasy;
  return chipStyles.difficultyMedium;
}

function QuestionChip({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.02em] ${className}`}>
      {children}
    </span>
  );
}

function PlatformIcon({ icon, color = 'white' }: { icon: string; color?: string }) {
  const common = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (icon) {
    case 'sparkle':
      return <svg {...common}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>;
    case 'calendar':
      return <svg {...common}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
    case 'doc':
      return <svg {...common}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>;
    case 'pen':
      return <svg {...common}><path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="M2 2l7.586 7.586" /><circle cx="11" cy="11" r="2" /></svg>;
    case 'star':
      return <svg {...common}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>;
    case 'chat':
      return <svg {...common}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>;
    case 'pulse':
      return <svg {...common}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>;
    case 'monitor':
      return <svg {...common}><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>;
    case 'book':
      return <svg {...common}><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" /></svg>;
    case 'users':
      return <svg {...common}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
  }
}

function modeHref(key: PyqModeKey, year?: number) {
  const query = new URLSearchParams();
  if (key !== 'prelims') query.set('mode', key);
  if (year) query.set('year', String(year));
  const qs = query.toString();
  return `/dashboard/pyq${qs ? `?${qs}` : ''}`;
}

function YearWisePyqSection({
  activeYear,
  mode,
  navigation,
}: {
  activeYear?: number;
  mode: 'prelims' | 'mains';
  navigation: PyqNavigation;
}) {
  const fallbackMode = {
    key: mode,
    label: mode === 'prelims' ? 'Prelims' : 'Mains',
    years: activeYear ? [{ year: activeYear, count: 1 }] : [],
  };
  const modes = navigation.modes.length > 0 ? navigation.modes : [fallbackMode];
  const activeMode = modes.find((item) => item.key === mode) || modes[0];
  const years = activeMode.years.length > 0
    ? activeMode.years
    : navigation.years.length > 0
      ? navigation.years
      : fallbackMode.years;

  if (modes.length === 0 || years.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="mb-5 text-[26px] font-bold text-[#1F2937]" style={{ fontFamily: 'var(--font-cormorant-garamond), Georgia, serif' }}>
        Year-wise UPSC PYQs
      </h2>
      <div className="mb-5 flex items-center gap-2">
        {modes.map((item) => (
          <Link
            key={item.key}
            href={modeHref(item.key)}
            className={`rounded-full px-5 py-2 text-[14px] font-bold transition ${mode === item.key ? 'bg-[#0B1229] text-white' : 'bg-[#F1F3F7] text-[#6B7280] hover:bg-[#E5E7EB]'}`}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {years.map((item) => (
          <Link
            key={item.year}
            href={modeHref(activeMode.key, item.year)}
            title={`${item.count} question${item.count === 1 ? '' : 's'}`}
            className={`rounded-[10px] border px-4 py-3 text-center text-[16px] font-semibold transition ${activeYear === item.year ? 'border-[#D4AF37] bg-[#FFFDF5] text-[#B8941E]' : 'border-[#E2E6EE] bg-white text-[#364153] hover:border-[#D4AF37] hover:bg-[#FFFDF5] hover:text-[#B8941E]'}`}
          >
            {item.year}
          </Link>
        ))}
      </div>
    </section>
  );
}

function TodaysTrioCard() {
  return (
    <div className="rounded-[16px] border border-[#D4AF37]/15 bg-[#0B1229] p-5 shadow-[0_10px_34px_rgba(15,23,42,0.18)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-gradient-to-r from-[#F5D06E] to-[#D4AF37]">
            <PlatformIcon icon="sparkle" />
          </span>
          <p className="text-[14px] font-bold text-white">Today&apos;s Trio</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.04em] text-[#4ADE80]">
          <span className="h-2 w-2 rounded-full bg-[#10B981]" />
          1,248 practising now
        </div>
      </div>
      <div className="space-y-3">
        {[
          ['mcq', 'Daily MCQ Challenge', '10 Questions • All Subjects', 'bg-emerald-500/20', '#10B981'],
          ['pen', 'Daily Mains Challenge', 'Answer Writing • Evaluated', 'bg-blue-500/20', '#3B82F6'],
          ['doc', 'Daily Editorial Analysis', 'The Hindu • Key Insights', 'bg-orange-500/20', '#F97316'],
        ].map(([icon, title, subtitle, bg, color]) => (
          <Link key={title} href="/dashboard" className="flex items-start gap-3 rounded-[10px] px-2 py-1.5 transition hover:bg-white/5">
            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] ${bg}`} style={{ color }}>
              <PlatformIcon icon={String(icon)} color={String(color)} />
            </span>
            <span>
              <span className="block text-[13px] font-semibold leading-tight text-white/90">{title}</span>
              <span className="mt-1 block text-[11px] text-white/45">{subtitle}</span>
            </span>
          </Link>
        ))}
      </div>
      <Link href="/?auth=signup" className="mt-4 flex w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-[#F5D06E] to-[#D4AF37] py-3 text-[13px] font-bold text-[#0B1229]">
        Join Now <span>→</span>
      </Link>
    </div>
  );
}

function Explanation({ question }: { question: PublicQuestion }) {
  const explanation = getExplanationText(question);
  if (!explanation) return null;

  const paragraphs = String(explanation)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <div className="mt-5 rounded-[14px] border border-[#BBF7D0] bg-[#F0FDF4] p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#10B981] text-sm font-bold text-white">✓</span>
        <span className="text-[13px] font-bold uppercase tracking-[0.1em] text-[#016630]">Explanation</span>
      </div>
      <div className="space-y-3">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="whitespace-pre-wrap text-[15px] leading-[26px] text-[#364153]">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}

function PublicHeader() {
  return (
    <div className="question-public-nav">
      <LandingNav />
    </div>
  );
}

function AuthQuestionHeader({ userName, initials }: { userName?: string; initials?: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[rgba(7,14,30,0.98)] backdrop-blur-[24px]">
      <div className="mx-auto flex h-[66px] max-w-[1280px] items-center justify-between px-5 sm:px-8">
        <Link href="/dashboard" className="flex items-center">
          <Image
            src="/logo.png"
            alt="RiseWithJeet"
            width={500}
            height={500}
            className="h-auto w-[90px] object-contain md:w-[110px]"
          />
        </Link>
        <nav className="hidden items-center gap-7 text-[14px] font-medium md:flex" style={{ fontFamily: "'Outfit', sans-serif" }}>
          <Link href="/dashboard" className="text-white/60 transition hover:text-[#E8B84B]">Dashboard</Link>
          <Link href="/dashboard/pyq" className="text-white/60 transition hover:text-[#E8B84B]">PYQ Bank</Link>
          <Link href="/dashboard/saved-notes?tab=pyq" className="text-white/60 transition hover:text-[#E8B84B]">Saved PYQs</Link>
        </nav>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A2540] text-white transition hover:bg-[#243050]"
            style={{ border: '1px solid rgba(255,255,255,0.16)' }}
            aria-label="Notifications"
            title="Notifications"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9Z" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#EF4444]" />
          </button>
          <Link
            href="/dashboard/profile"
            className="flex h-12 w-12 items-center justify-center rounded-full text-[18px] font-bold text-[#0E182D] transition hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #FFD170 0%, #D4A843 100%)', fontFamily: 'Georgia, serif' }}
            title={userName || 'Profile'}
            aria-label="Profile"
          >
            {initials || 'U'}
          </Link>
          <Link href="/dashboard/pyq" className="rounded-[8px] bg-gradient-to-br from-[#E8B84B] to-[#C8960A] px-4 py-2 text-[13.5px] font-bold text-[#061125] shadow-[0_4px_16px_rgba(232,184,75,0.3)] transition hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(232,184,75,0.45)]">
            Back to PYQ
          </Link>
        </div>
      </div>
    </header>
  );
}

function PublicSidebar() {
  return (
    <>
      <div className="rounded-[18px] border border-[#D1FAE5] bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_28px_rgba(15,23,42,0.06)]">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#10B981] px-3 py-1.5 text-[12px] font-bold text-white">
          <span>★</span> Trusted by 15,000+ aspirants
        </div>
        <h3 className="mb-3 text-[24px] font-bold leading-[1.15] text-[#111827]" style={{ fontFamily: 'var(--font-cormorant-garamond), Georgia, serif' }}>
          Master UPSC with India&apos;s Smartest PYQ Platform
        </h3>
        <ul className="mb-5 space-y-2.5 text-[14px] leading-[1.5] text-[#4A5565]">
          <li>✓ 6,500+ questions with detailed explanations</li>
          <li>✓ AI-powered performance analytics</li>
          <li>✓ Track weak areas and repeated themes</li>
        </ul>
        <Link href="/?auth=signup" className="block rounded-[12px] bg-gradient-to-r from-[#F5D06E] to-[#D4AF37] px-5 py-3 text-center text-[15px] font-bold text-[#0B1229] shadow-[0_6px_18px_rgba(212,175,55,0.28)]">
          Start Practicing Free →
        </Link>
      </div>

      <div className="rounded-[18px] border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <h4 className="mb-4 text-[12px] font-bold uppercase tracking-[0.18em] text-[#8B95A8]">Explore Our Platform</h4>
        <div className="space-y-2.5">
          {PLATFORM_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="group flex items-center gap-3 rounded-[12px] p-3 transition hover:bg-[#F8F9FB]">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br ${item.bg}`}>
                <PlatformIcon icon={item.icon} />
              </span>
              <span>
                <span className="block text-[14px] font-bold text-[#1F2937] transition group-hover:text-[#B8941E]">{item.title}</span>
                <span className="block text-[12px] text-[#8B95A8]">{item.subtitle}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      <TodaysTrioCard />
    </>
  );
}

function PracticeSidebar({
  revealed,
  selectedOption,
  correctOption,
  submitStatus,
  submitError,
  nextHref,
  onBookmark,
  bookmarkStatus,
  bookmarked,
  revisionMarked,
  onRevision,
  question,
}: {
  revealed: boolean;
  selectedOption: string | null;
  correctOption: string;
  submitStatus: 'idle' | 'saving' | 'saved' | 'error';
  submitError: string | null;
  nextHref?: string;
  onBookmark: () => void;
  bookmarkStatus: 'idle' | 'saving' | 'saved' | 'error';
  bookmarked: boolean;
  revisionMarked: boolean;
  onRevision: () => void;
  question: PublicQuestion;
}) {
  const isCorrect = revealed && selectedOption && correctOption && selectedOption === correctOption;
  return (
    <>
      <div className="rounded-[18px] border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.16em] text-[#8B95A8]">Practice Status</p>
        <h3 className="text-[22px] font-bold leading-[1.15] text-[#111827]" style={{ fontFamily: 'var(--font-cormorant-garamond), Georgia, serif' }}>
          {revealed ? (isCorrect ? 'Correct answer' : 'Review this one') : 'Attempt this question'}
        </h3>
        <div className="mt-4 rounded-[12px] border border-[#E5E7EB] bg-[#F8F9FB] p-4">
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-semibold text-[#6B7280]">Your answer</span>
            <span className="font-bold text-[#111827]">{selectedOption || 'Not attempted'}</span>
          </div>
          {revealed ? (
            <div className="mt-2 flex items-center justify-between text-[13px]">
              <span className="font-semibold text-[#6B7280]">Correct answer</span>
              <span className="font-bold text-[#047857]">{correctOption || 'See explanation'}</span>
            </div>
          ) : null}
        </div>
        <p className="mt-3 text-[12px] leading-5 text-[#6B7280]">
          {submitStatus === 'saving'
            ? 'Saving your attempt...'
            : submitStatus === 'saved'
              ? 'Attempt saved to your account.'
              : submitStatus === 'error'
                ? `Attempt shown locally. ${submitError || 'Could not save right now.'}`
                : 'Choose an option to reveal the explanation.'}
        </p>
      </div>

      <div className="rounded-[18px] border border-[#E5E7EB] bg-white p-5 text-[13px] shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.16em] text-[#8B95A8]">Question Details</p>
        {[
          ['Year', question.year || 'UPSC'],
          ['Subject', cleanText(question.subject) || 'UPSC'],
          ['Topic', cleanText(question.topic) || cleanText(question.paper) || 'General'],
          ['Difficulty', cleanText(question.difficulty) || 'Medium'],
        ].map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-3 border-t border-[#F1F3F7] py-2 first:border-t-0">
            <span className="font-semibold text-[#8B95A8]">{label}</span>
            <span className="max-w-[190px] text-right font-bold text-[#364153]">{value}</span>
          </div>
        ))}
      </div>

      <div className="rounded-[18px] border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <div className="grid gap-3">
          <Link href="/dashboard/pyq" className="rounded-[12px] border border-[#E5E7EB] px-4 py-3 text-center text-[14px] font-bold text-[#111827] hover:bg-[#F8F9FB]">
            Back to PYQ List
          </Link>
          {nextHref ? (
            <Link href={nextHref} className="rounded-[12px] bg-[#0B1229] px-4 py-3 text-center text-[14px] font-bold text-white">
              Next PYQ →
            </Link>
          ) : null}
          <button type="button" onClick={onBookmark} disabled={bookmarkStatus === 'saving'} className="rounded-[12px] border border-[#E5E7EB] px-4 py-3 text-[14px] font-bold text-[#111827] hover:bg-[#F8F9FB] disabled:opacity-60">
            {bookmarkStatus === 'saving' ? 'Saving...' : bookmarked ? 'Bookmarked' : 'Bookmark'}
          </button>
          <button type="button" onClick={onRevision} className="rounded-[12px] border border-[#E5E7EB] px-4 py-3 text-[14px] font-bold text-[#111827] hover:bg-[#F8F9FB]">
            {revisionMarked ? 'Marked for Revision' : 'Mark for Revision'}
          </button>
          <Link href="/contact" className="rounded-[12px] border border-[#E5E7EB] px-4 py-3 text-center text-[14px] font-bold text-[#6B7280] hover:bg-[#F8F9FB]">
            Report Issue
          </Link>
        </div>
      </div>
    </>
  );
}

export default function QuestionDetailClient({ question, mode, relatedQuestions, pyqNavigation }: Props) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkStatus, setBookmarkStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [revisionMarked, setRevisionMarked] = useState(false);
  const options = useMemo(() => optionList(question), [question]);
  const correctOption = cleanText(question.correctOption);
  const isPrelims = mode === 'prelims';
  const questionNumber = question.questionNum || 1;
  const year = question.year || undefined;
  const subject = cleanText(question.subject) || 'UPSC';
  const subSubject = cleanText(question.subSubject);
  const topic = cleanText(question.topic);
  const difficulty = cleanText(question.difficulty) || 'Medium';
  const paper = cleanText(question.paper) || (isPrelims ? 'Prelims' : 'Mains');
  const isLoggedIn = isAuthenticated && !isLoading;
  const displayName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email?.split('@')[0] || '';
  const userInitials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || 'U';
  const nextHref = relatedQuestions[0]
    ? `/questions/${relatedQuestions[0].id}${mode === 'mains' ? '?mode=mains' : ''}`
    : undefined;

  useEffect(() => {
    setSelectedOption(null);
    setRevealed(false);
    setSubmitStatus('idle');
    setSubmitError(null);
    setBookmarkStatus('idle');
    setRevisionMarked(false);
  }, [question.id]);

  useEffect(() => {
    if (!isLoggedIn) return;
    bookmarkService.check('pyq', question.id)
      .then((res) => setBookmarked(Boolean(res.data?.bookmarked || res.data?.isBookmarked)))
      .catch(() => undefined);
  }, [isLoggedIn, question.id]);

  const chooseOption = async (label: string) => {
    if (revealed) return;
    setSelectedOption(label);
    setRevealed(true);
    setSubmitError(null);
    if (isLoggedIn && isPrelims) {
      setSubmitStatus('saving');
      try {
        await pyqService.submitPrelimsAnswer(question.id, label);
        setSubmitStatus('saved');
      } catch (error) {
        setSubmitStatus('error');
        setSubmitError(error instanceof Error ? error.message : 'Could not save right now.');
      }
    }
  };

  const handleBookmark = async () => {
    if (!isLoggedIn) {
      openAuthModal('signup');
      return;
    }
    setBookmarkStatus('saving');
    try {
      await bookmarkService.toggle({
        entityType: 'pyq',
        entityId: question.id,
        title: truncateForUi(question.questionText, 90),
        source: 'PYQ',
        sourceUrl: `/questions/${question.id}${mode === 'mains' ? '?mode=mains' : ''}`,
        tag: `${year || 'UPSC'} · ${subject}`,
        content: {
          mode,
          year,
          subject,
          topic,
          difficulty,
        },
      });
      setBookmarked((prev) => !prev);
      setBookmarkStatus('saved');
    } catch {
      setBookmarkStatus('error');
    }
  };

  const handleRevision = () => {
    setRevisionMarked((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#1E293B]" style={{ fontFamily: 'var(--font-dm-sans), Inter, sans-serif' }}>
      <style jsx global>{`
        .question-public-nav .landing-nav {
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .question-public-nav + nav {
          margin-top: 72px;
        }
        .question-card-hover {
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .question-card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
          border-color: rgba(212, 175, 55, 0.45);
        }
      `}</style>

      {isLoggedIn ? <AuthQuestionHeader userName={displayName} initials={userInitials} /> : <PublicHeader />}

      <nav className="mx-auto max-w-[1280px] px-5 pb-4 pt-6 text-[14px] font-medium text-[#8B95A8] sm:px-8">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-[#D4AF37]">Home</Link></li>
          <li>›</li>
          <li><Link href="/dashboard/pyq" className="hover:text-[#D4AF37]">Previous Year Questions</Link></li>
          <li>›</li>
          <li className="capitalize">{mode}</li>
          {year ? <><li>›</li><li>{year}</li></> : null}
          <li>›</li>
          <li className="max-w-[360px] truncate text-[#364153]">{question.questionText}</li>
        </ol>
      </nav>

      <main className="mx-auto grid max-w-[1280px] grid-cols-1 gap-8 px-5 pb-14 sm:px-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <article className="overflow-hidden rounded-[18px] border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_30px_rgba(15,23,42,0.06)]">
            <div className="h-1 bg-gradient-to-r from-[#F5D06E] via-[#D4AF37] to-[#B8941E]" />
            <div className="p-6 sm:p-9">
              <div className="mb-6 flex flex-wrap gap-2">
                {year ? <QuestionChip className={chipStyles.year}>UPSC {year}</QuestionChip> : null}
                <QuestionChip className={chipStyles.subject}>{subject}</QuestionChip>
                {subSubject ? <QuestionChip className={chipStyles.subSubject}>{subSubject}</QuestionChip> : null}
                {topic ? <QuestionChip className={chipStyles.topic}>{topic}</QuestionChip> : null}
                <QuestionChip className={difficultyClass(difficulty)}>{difficulty}</QuestionChip>
                <QuestionChip className={isPrelims ? 'bg-[#ECFDF5] text-[#047857]' : chipStyles.mains}>{mode}</QuestionChip>
              </div>

              <div className="mb-5 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#9CA3AF]">
                {mode} · Question #{questionNumber} · {paper}
              </div>

              {isPrelims ? (
                <StructuredQuestionRenderer
                  questionStructure={question.questionStructure}
                  questionText={question.questionText}
                  className="mb-7 text-[20px] font-medium leading-[1.65] text-[#111827]"
                  textClassName="text-[20px] font-medium leading-[1.65] text-[#111827]"
                  textStyle={{ fontFamily: QUESTION_FONT }}
                />
              ) : (
                <QuestionTextRenderer
                  text={question.questionText}
                  className="mb-7 text-[20px] font-medium leading-[1.65] text-[#111827]"
                  textClassName="text-[20px] font-medium leading-[1.65] text-[#111827]"
                  textStyle={{ fontFamily: QUESTION_FONT }}
                />
              )}

              {options.length > 0 ? (
                <div className="mb-5 grid grid-cols-1 gap-3">
                  {options.map((option) => {
                    const isCorrect = option.label === correctOption;
                    const isSelected = option.label === selectedOption;
                    const showCorrect = revealed && isCorrect;
                    const showIncorrect = revealed && isSelected && !isCorrect;
                    const stateClass = showCorrect
                      ? 'border-[#10B981] bg-[#F0FDF9] text-[#065F46]'
                      : showIncorrect
                        ? 'border-[#EF4444] bg-[#FEF2F2] text-[#991B1B]'
                        : 'border-[#E2E6EE] bg-white text-[#1E293B] hover:border-[#D4AF37] hover:bg-[#FFFDF5]';
                    const letterClass = showCorrect
                      ? 'bg-[#10B981] text-white'
                      : showIncorrect
                        ? 'bg-[#EF4444] text-white'
                        : 'bg-[#F1F4F9] text-[#475067]';

                    return (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => chooseOption(option.label)}
                        className={`flex min-h-[58px] w-full items-center gap-4 rounded-[14px] border px-5 py-4 text-left transition ${stateClass}`}
                      >
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[14px] font-bold ${letterClass}`}>
                          {option.label}
                        </span>
                        <span className="whitespace-pre-wrap text-[18px] leading-[29px]" style={{ fontFamily: QUESTION_FONT }}>{option.text}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {!revealed && options.length > 0 ? (
                <div className="rounded-[14px] border border-dashed border-[#C9CFDB] px-5 py-3.5 text-center text-[15px] font-bold text-[#475569]">
                  Select an option to reveal the answer and explanation.
                </div>
              ) : null}

              {(revealed || !options.length) ? <Explanation question={question} /> : null}

              {!isLoggedIn && revealed ? (
                <div className="mt-5 rounded-[16px] border border-[#F5D06E]/60 bg-[#FFFDF5] p-5">
                  <p className="text-[15px] font-bold text-[#0B1229]">Want to save this attempt?</p>
                  <p className="mt-1 text-[13px] leading-5 text-[#6B7280]">Your answer was checked locally. Create an account to save progress, bookmarks, and revision history.</p>
                  <button type="button" onClick={() => openAuthModal('signup')} className="mt-4 rounded-[12px] bg-[#0B1229] px-5 py-3 text-[14px] font-bold text-white">
                    Save Progress for Free
                  </button>
                </div>
              ) : null}
            </div>
          </article>

          {relatedQuestions.length > 0 ? (
            <section className="mt-10">
              <h2 className="mb-5 text-[26px] font-bold text-[#1F2937]" style={{ fontFamily: 'var(--font-cormorant-garamond), Georgia, serif' }}>
                More Questions from {year ? `UPSC ${year}` : subject}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {relatedQuestions.map((related) => (
                  <Link
                    key={related.id}
                    href={`/questions/${related.id}${mode === 'mains' ? '?mode=mains' : ''}`}
                    className="question-card-hover rounded-[14px] border border-[#E2E6EE] bg-white p-4"
                  >
                    <div className="mb-2 flex flex-wrap gap-2">
                      <QuestionChip className={chipStyles.subject}>{cleanText(related.subject) || subject}</QuestionChip>
                      <QuestionChip className={difficultyClass(related.difficulty)}>{cleanText(related.difficulty) || 'Medium'}</QuestionChip>
                    </div>
                    <p className="line-clamp-2 text-[14px] font-semibold leading-[1.5] text-[#364153]">
                      {related.questionText}
                    </p>
                    <p className="mt-2 text-[12px] text-[#8B95A8]">
                      Question #{related.questionNum || 1} · {cleanText(related.topic) || cleanText(related.paper) || mode}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <YearWisePyqSection activeYear={year} mode={mode} navigation={pyqNavigation} />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-[96px] lg:self-start">
          {isLoggedIn ? (
            <PracticeSidebar
              revealed={revealed}
              selectedOption={selectedOption}
              correctOption={correctOption}
              submitStatus={submitStatus}
              submitError={submitError}
              nextHref={nextHref}
              onBookmark={handleBookmark}
              bookmarkStatus={bookmarkStatus}
              bookmarked={bookmarked}
              revisionMarked={revisionMarked}
              onRevision={handleRevision}
              question={question}
            />
          ) : (
            <PublicSidebar />
          )}
        </aside>
      </main>

      {!isLoggedIn ? <section className="bg-gradient-to-b from-[#EEF1F7] to-[#F8F9FB] px-5 py-16">
        <div className="mx-auto max-w-[920px] overflow-hidden rounded-[24px] bg-[#071126] px-8 py-12 text-center shadow-[0_25px_60px_rgba(15,23,42,0.22)] sm:px-14">
          <h2 className="text-[38px] font-bold leading-[1.1] text-white sm:text-[48px]" style={{ fontFamily: 'var(--font-cormorant-garamond), Georgia, serif' }}>
            Your UPSC Journey Starts <span className="text-[#F5D06E]">Today</span>
          </h2>
          <p className="mx-auto mt-4 max-w-[560px] text-[16px] leading-[1.65] text-white/65">
            Smart preparation, structured planning, and AI-powered insights for serious aspirants.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/?auth=signup" className="rounded-[12px] bg-[#D4AF37] px-6 py-3 text-[15px] font-bold text-[#0B1229]">Start Free Trial →</Link>
            <Link href="/contact" className="rounded-[12px] border border-white/20 px-6 py-3 text-[15px] font-semibold text-white">Contact Us</Link>
          </div>
        </div>
      </section> : null}

      <Footer />
    </div>
  );
}
