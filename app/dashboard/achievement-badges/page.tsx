'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import DashboardPageHero from '@/components/DashboardPageHero';

type BadgeStatus = 'earned' | 'locked';

interface Badge {
  key: string;
  emoji: string;
  title: string;
  quote: string;
  description: string;
  tag: string;
  destination: string;
  destinationHref: string;
  status: BadgeStatus;
}

interface BadgeCategory {
  key: string;
  emoji: string;
  iconKey: string;
  title: string;
  earned: number;
  total: number;
  badges: Badge[];
}

const PILL_COLORS: Record<string, { bg: string; text: string }> = {
  STREAK: { bg: 'rgba(192,37,74,0.10)', text: '#3a3530' },
  LEARNING: { bg: 'rgba(34,109,255,0.10)', text: '#3a3530' },
  PRACTICE: { bg: 'rgba(245,158,11,0.12)', text: '#3a3530' },
  REVISION: { bg: 'rgba(124,77,255,0.10)', text: '#3a3530' },
  ANALYTICS: { bg: 'rgba(16,185,129,0.10)', text: '#3a3530' },
  COMMUNITY: { bg: 'rgba(236,72,153,0.10)', text: '#3a3530' },
};

const CATEGORIES: BadgeCategory[] = [
  {
    key: 'streak',
    emoji: '🔥',
    iconKey: 'ignition',
    title: 'Streak & Consistency',
    earned: 1,
    total: 8,
    badges: [
      {
        key: 'first-light',
        emoji: '🌅',
        title: 'First Light',
        quote: '"Every great journey starts with a single step."',
        description: 'You showed up. That already puts you ahead of 90% of aspirants. Welcome to RiseWithJeet.',
        tag: 'STREAK',
        destination: 'Dashboard',
        destinationHref: '/dashboard',
        status: 'earned',
      },
      {
        key: 'three-in-a-row',
        emoji: '🌤️',
        title: 'Three in a Row',
        quote: '"Habits are built one day at a time."',
        description: 'Three consecutive days of login. Your preparation habit is taking shape keep it going.',
        tag: 'STREAK',
        destination: 'Dashboard',
        destinationHref: '/dashboard',
        status: 'locked',
      },
      {
        key: 'ignition',
        emoji: '🔥',
        title: 'Ignition',
        quote: '"Seven days of fire — you are burning bright."',
        description: 'A full week of consistent login. You now have real momentum. This is where serious aspirants are made.',
        tag: 'STREAK',
        destination: 'Dashboard',
        destinationHref: '/dashboard',
        status: 'locked',
      },
      {
        key: 'iron-discipline',
        emoji: '⚡',
        title: 'Iron Discipline',
        quote: '"Two weeks strong — discipline is your edge."',
        description: '14 days of showing up without fail. While others sleep in, you are building the habit that wins UPSC.',
        tag: 'STREAK',
        destination: 'Dashboard',
        destinationHref: '/dashboard',
        status: 'locked',
      },
      {
        key: 'the-grind',
        emoji: '💎',
        title: 'The Grind',
        quote: '"30 days. No shortcuts. No excuses."',
        description: 'A full month of consistent study. You have crossed the threshold from aspirant to serious contender.',
        tag: 'STREAK',
        destination: 'Dashboard',
        destinationHref: '/dashboard',
        status: 'locked',
      },
      {
        key: 'rise-365',
        emoji: '🏆',
        title: 'Rise 365',
        quote: '"A full year on the path to the IAS. Unmatched."',
        description: '365 consecutive days of dedication. This badge is carried by fewer than 1% of aspirants. You are elite.',
        tag: 'STREAK',
        destination: 'Dashboard',
        destinationHref: '/dashboard',
        status: 'locked',
      },
      {
        key: 'comeback-king',
        emoji: '💪',
        title: 'Comeback King',
        quote: '"Rise after every fall."',
        description: 'Rebuild a streak to 7+ days after breaking it.',
        tag: 'STREAK',
        destination: 'Dashboard',
        destinationHref: '/dashboard',
        status: 'locked',
      },
      {
        key: 'perfect-week',
        emoji: '✨',
        title: 'Perfect Week',
        quote: '"Seven days. Zero misses."',
        description: 'Complete 100% of daily tasks for 7 days straight.',
        tag: 'STREAK',
        destination: 'Dashboard',
        destinationHref: '/dashboard',
        status: 'locked',
      },
    ],
  },
  {
    key: 'learning',
    emoji: '📚',
    iconKey: 'page-turner',
    title: 'Learning Lectures, Materials & Current Affairs',
    earned: 1,
    total: 14,
    badges: [
      {
        key: 'first-lecture',
        emoji: '▶️',
        title: 'First Lecture',
        quote: '"The classroom opens. Your mind follows."',
        description: 'You watched your first video lecture on RiseWithJeet. The first lesson is always the most important.',
        tag: 'LEARNING',
        destination: 'Video Lectures',
        destinationHref: '/dashboard/video-lectures',
        status: 'earned',
      },
      {
        key: 'jeet-student',
        emoji: '📺',
        title: 'Jeet Student',
        quote: '"20 lectures in would be a proud moment."',
        description: 'You have watched 20 lectures. Your foundation is being built brick by brick.',
        tag: 'LEARNING',
        destination: 'Video Lectures',
        destinationHref: '/dashboard/video-lectures',
        status: 'locked',
      },
      {
        key: 'subject-conqueror',
        emoji: '🎓',
        title: 'Subject Conqueror',
        quote: '"You did not just study it. You conquered it."',
        description: 'Every single lecture in one full subject watched and completed. That is mastery.',
        tag: 'LEARNING',
        destination: 'Video Lectures',
        destinationHref: '/dashboard/video-lectures',
        status: 'locked',
      },
      {
        key: 'century-scholar',
        emoji: '🏫',
        title: 'Century Scholar',
        quote: '"100 lectures. Relentless. Unstoppable."',
        description: 'A hundred lectures completed. You are not preparing for UPSC you are living it.',
        tag: 'LEARNING',
        destination: 'Video Lectures',
        destinationHref: '/dashboard/video-lectures',
        status: 'locked',
      },
      {
        key: 'daily-briefing',
        emoji: '🗞️',
        title: 'Daily Briefing',
        quote: '"Stay informed. Stay ahead."',
        description: 'Your first Current Affairs article read. The IAS officer of tomorrow knows what is happening today.',
        tag: 'LEARNING',
        destination: 'Current Affairs',
        destinationHref: '/dashboard/current-affairs',
        status: 'locked',
      },
      {
        key: 'current-weekly',
        emoji: '📆',
        title: 'Current Weekly',
        quote: '"Seven days of staying current real commitment."',
        description: 'A 7-day streak of reading Current Affairs. Most toppers say CA is what separates rank-holders from the rest.',
        tag: 'LEARNING',
        destination: 'Current Affairs',
        destinationHref: '/dashboard/current-affairs',
        status: 'locked',
      },
      {
        key: 'world-watcher',
        emoji: '📡',
        title: 'World Watcher',
        quote: '"100 articles in you see the world like a future IFS."',
        description: 'A hundred Current Affairs articles read and absorbed. Your situational awareness is razor sharp.',
        tag: 'LEARNING',
        destination: 'Current Affairs',
        destinationHref: '/dashboard/current-affairs',
        status: 'locked',
      },
      {
        key: 'always-informed',
        emoji: '🌐',
        title: 'Always Informed',
        quote: '"30 days of news nothing escapes you."',
        description: 'A full month of reading Current Affairs every single day. You are building the awareness that IAS demands.',
        tag: 'LEARNING',
        destination: 'Current Affairs',
        destinationHref: '/dashboard/current-affairs',
        status: 'locked',
      },
      {
        key: 'page-turner',
        emoji: '📰',
        title: 'Page Turner',
        quote: '"Read your first study material document."',
        description: 'First material read. Every expert was once a beginner with page 1.',
        tag: 'LEARNING',
        destination: 'Study Material',
        destinationHref: '/dashboard/library',
        status: 'locked',
      },
      {
        key: 'deep-reader',
        emoji: '📖',
        title: 'Deep Reader',
        quote: '"Seven straight days of serious reading."',
        description: 'Engaged with study materials every day for a full week. Quality reading is what separates toppers.',
        tag: 'LEARNING',
        destination: 'Study Material',
        destinationHref: '/dashboard/library',
        status: 'locked',
      },
      {
        key: 'constitution-keeper',
        emoji: '🏛️',
        title: 'Constitution Keeper',
        quote: '"Laxmikanth is closed. You know it cold."',
        description: 'Every single Polity and Governance topic marked Done. The highest-weightage subject fully owned.',
        tag: 'LEARNING',
        destination: 'Syllabus Tracker',
        destinationHref: '/dashboard/syllabus-tracker',
        status: 'locked',
      },
      {
        key: 'prelims-ready',
        emoji: '🌟',
        title: 'Prelims Ready',
        quote: '"Nothing left uncovered. The exam has no surprises for you."',
        description: 'All 74 Prelims GS topics marked as Done. The single most important badge in the Syllabus Tracker.',
        tag: 'LEARNING',
        destination: 'Syllabus Tracker',
        destinationHref: '/dashboard/syllabus-tracker',
        status: 'locked',
      },
      {
        key: 'mapped-out',
        emoji: '🗺️',
        title: 'Mapped Out',
        quote: '"Your battle plan is drawn. Now execute it."',
        description: 'First topic tracked in the Syllabus Tracker. The aspirant who maps the syllabus controls the exam.',
        tag: 'LEARNING',
        destination: 'Syllabus Tracker',
        destinationHref: '/dashboard/syllabus-tracker',
        status: 'locked',
      },
      {
        key: 'quarter-done',
        emoji: '🎯',
        title: 'Quarter Done',
        quote: '"25% complete momentum is everything."',
        description: 'A quarter of your Prelims GS syllabus is done. You have crossed the hardest milestone getting started.',
        tag: 'LEARNING',
        destination: 'Syllabus Tracker',
        destinationHref: '/dashboard/syllabus-tracker',
        status: 'locked',
      },
    ],
  },
  {
    key: 'practice',
    emoji: '🎯',
    iconKey: 'quarter-done',
    title: 'Practice MCQ, Writing, Mocks & PYQ',
    earned: 1,
    total: 16,
    badges: [
      {
        key: 'test-debut',
        emoji: '✏️',
        title: 'Test Debut',
        quote: '"Your first battle. The war begins now."',
        description: 'You attempted your first test in the Test Series. Every IAS topper started exactly here.',
        tag: 'PRACTICE',
        destination: 'Test Series',
        destinationHref: '/dashboard/test-series',
        status: 'earned',
      },
      {
        key: 'question-crusher',
        emoji: '⚔️',
        title: 'Question Crusher',
        quote: '"80% and above the cut-off is not your ceiling."',
        description: 'Scored 80% or more in a test. You are not just preparing you are performing at rank-list level.',
        tag: 'PRACTICE',
        destination: 'Test Series',
        destinationHref: '/dashboard/test-series',
        status: 'locked',
      },
      {
        key: 'ten-battles',
        emoji: '🛡️',
        title: 'Ten Battles',
        quote: '"Ten mocks fought. The real exam holds no fear."',
        description: 'Ten full-length mock tests completed. Every mock you finish is a rehearsal for the day that matters most.',
        tag: 'PRACTICE',
        destination: 'Mock Tests',
        destinationHref: '/dashboard/mock-tests',
        status: 'locked',
      },
      {
        key: 'rank-list-bound',
        emoji: '📈',
        title: 'Rank List Bound',
        quote: '"Top 10 in a mock your name belongs on that list."',
        description: 'Ranked in the Top 10 in a mock test leaderboard. This is what a future IAS officer looks like.',
        tag: 'PRACTICE',
        destination: 'Mock Tests',
        destinationHref: '/dashboard/mock-tests',
        status: 'locked',
      },
      {
        key: 'first-attempt',
        emoji: '🧩',
        title: 'First Attempt',
        quote: '"The first question answered is the hardest."',
        description: 'You answered your first Daily MCQ. Every UPSC rank starts with someone clicking their first answer.',
        tag: 'PRACTICE',
        destination: 'Daily MCQ',
        destinationHref: '/dashboard/daily-mcq',
        status: 'locked',
      },
      {
        key: 'perfect-ten',
        emoji: '🔟',
        title: 'Perfect Ten',
        quote: '"10 out of 10. Flawless."',
        description: 'A perfect score on the Daily MCQ. No guessing, no luck just complete command of the topic.',
        tag: 'PRACTICE',
        destination: 'Daily MCQ',
        destinationHref: '/dashboard/daily-mcq',
        status: 'locked',
      },
      {
        key: 'century-club',
        emoji: '💯',
        title: 'Century Club',
        quote: '"100 questions answered you are in a different league."',
        description: 'Five hundred MCQs attempted across the platform. You have seen more questions than most aspirants ever will.',
        tag: 'PRACTICE',
        destination: 'Daily MCQ',
        destinationHref: '/dashboard/daily-mcq',
        status: 'locked',
      },
      {
        key: 'mcq-marathon',
        emoji: '🇮🇳',
        title: 'MCQ Marathon',
        quote: '"30 days of daily MCQs. Relentless precision."',
        description: 'The daily MCQ completed every single day for a month. Consistent practice is the only strategy that works.',
        tag: 'PRACTICE',
        destination: 'Daily MCQ',
        destinationHref: '/dashboard/daily-mcq',
        status: 'locked',
      },
      {
        key: 'pen-drawn',
        emoji: '✍️',
        title: 'Pen Drawn',
        quote: '"The pen is your most powerful weapon for Mains."',
        description: 'First answer submitted in Daily Answer Writing. The Mains exam is won at the desk, not in the head.',
        tag: 'PRACTICE',
        destination: 'Answer Writing',
        destinationHref: '/dashboard/daily-answer',
        status: 'locked',
      },
      {
        key: 'mains-rising',
        emoji: '📝',
        title: 'Mains Rising',
        quote: '"10 answers written your Mains foundation is solid."',
        description: 'Ten answers submitted. Most aspirants never write a single structured answer. You are already ahead.',
        tag: 'PRACTICE',
        destination: 'Answer Writing',
        destinationHref: '/dashboard/daily-answer',
        status: 'locked',
      },
      {
        key: 'word-smith',
        emoji: '🖊️',
        title: 'Word Smith',
        quote: '"Submit 50 answer writing responses."',
        description: '50 answers! Consistent writing is the single biggest Mains differentiator.',
        tag: 'PRACTICE',
        destination: 'Answer Writing',
        destinationHref: '/dashboard/daily-answer',
        status: 'locked',
      },
      {
        key: 'answer-century',
        emoji: '🏅',
        title: 'Answer Century',
        quote: '"100 answers. A Mains warrior in the making."',
        description: 'Fifty answers written and submitted. You have put in more deliberate practice than most aspirants in a year.',
        tag: 'PRACTICE',
        destination: 'Answer Writing',
        destinationHref: '/dashboard/daily-answer',
        status: 'locked',
      },
      {
        key: 'archive-opener',
        emoji: '📜',
        title: 'Archive Opener',
        quote: '"The past holds the blueprint for the future."',
        description: 'First Previous Year Question attempted. UPSC has a pattern and you have just started cracking it.',
        tag: 'PRACTICE',
        destination: 'PYQ Bank',
        destinationHref: '/dashboard/pyq',
        status: 'locked',
      },
      {
        key: 'pattern-cracker',
        emoji: '🔎',
        title: 'Pattern Cracker',
        quote: '"50 PYQs down the exam is starting to make sense."',
        description: 'Solved 50 Previous Year Questions. You are not just studying topics — you are studying how UPSC thinks.',
        tag: 'PRACTICE',
        destination: 'PYQ Bank',
        destinationHref: '/dashboard/pyq',
        status: 'locked',
      },
      {
        key: 'pyq-perfectionist',
        emoji: '🎖️',
        title: 'PYQ Perfectionist',
        quote: '"One complete year of UPSC questions conquered."',
        description: 'Every question from a single year of Prelims done. You understand how UPSC builds an entire exam paper.',
        tag: 'PRACTICE',
        destination: 'PYQ Bank',
        destinationHref: '/dashboard/pyq',
        status: 'locked',
      },
      {
        key: 'decade-diver',
        emoji: '🤿',
        title: 'Decade Diver',
        quote: '"10 years of UPSC questions. Nothing surprises you."',
        description: 'Every PYQ from 2014 to 2024 solved. This badge is the gold standard of UPSC practice. Carry it with pride.',
        tag: 'PRACTICE',
        destination: 'PYQ Bank',
        destinationHref: '/dashboard/pyq',
        status: 'locked',
      },
    ],
  },
  {
    key: 'revision',
    emoji: '🔄',
    iconKey: 'review-streak',
    title: 'Revision Tools — Flashcards, Mindmaps & Spaced Repetition',
    earned: 0,
    total: 8,
    badges: [
      {
        key: 'flash-pro',
        emoji: '⚡',
        title: 'Flash Pro',
        quote: '"Create 50 total flashcards."',
        description: '50 cards means you have a serious, portable revision system now.',
        tag: 'REVISION',
        destination: 'Flashcards',
        destinationHref: '/dashboard/flashcards',
        status: 'locked',
      },
      {
        key: 'review-streak',
        emoji: '🔁',
        title: 'Review Streak',
        quote: '"Review flashcards for 14 consecutive days."',
        description: 'Reviewing cards daily for 2 weeks locks information into long-term memory permanently.',
        tag: 'REVISION',
        destination: 'Flashcards',
        destinationHref: '/dashboard/flashcards',
        status: 'locked',
      },
      {
        key: 'card-master',
        emoji: '🃏',
        title: 'Card Master',
        quote: '"Create and review 200 flashcards."',
        description: '200 cards! You have built a comprehensive, self-tested revision arsenal.',
        tag: 'REVISION',
        destination: 'Flashcards',
        destinationHref: '/dashboard/flashcards',
        status: 'locked',
      },
      {
        key: 'mind-mapper',
        emoji: '🧠',
        title: 'Mind Mapper',
        quote: '"Create your first mind map."',
        description: 'Visual thinking is a hidden topper skill. Your first map is your first edge.',
        tag: 'REVISION',
        destination: 'Mindmap',
        destinationHref: '/dashboard/mindmap',
        status: 'locked',
      },
      {
        key: 'web-weaver',
        emoji: '🕸️',
        title: 'Web Weaver',
        quote: '"Create a mind map with 3+ levels of branches."',
        description: 'A complex multi-level map shows you understand how UPSC topics interconnect.',
        tag: 'REVISION',
        destination: 'Mindmap',
        destinationHref: '/dashboard/mindmap',
        status: 'locked',
      },
      {
        key: 'recall-champion',
        emoji: '🧩',
        title: 'Recall Champion',
        quote: '"Complete your first spaced repetition session."',
        description: 'Spaced repetition is backed by decades of memory science. You are using the best tool.',
        tag: 'REVISION',
        destination: 'Spaced Repetition',
        destinationHref: '/dashboard/spaced-repetition',
        status: 'locked',
      },
      {
        key: 'memory-builder',
        emoji: '🧬',
        title: 'Memory Builder',
        quote: '"Use spaced repetition consistently for 4 weeks."',
        description: '4 weeks of SR = permanent retention. You won’t forget what you study ever again.',
        tag: 'REVISION',
        destination: 'Spaced Repetition',
        destinationHref: '/dashboard/spaced-repetition',
        status: 'locked',
      },
      {
        key: 'retention-expert',
        emoji: '🎯',
        title: 'Retention Expert',
        quote: '"Complete SR cycles across 5 different topics."',
        description: '5 subjects mastered through SR. Your revision system is now genuinely exam-proof.',
        tag: 'REVISION',
        destination: 'Spaced Repetition',
        destinationHref: '/dashboard/spaced-repetition',
        status: 'locked',
      },
    ],
  },
  {
    key: 'analytics',
    emoji: '📊',
    iconKey: 'data-driven',
    title: 'Performance Analytics',
    earned: 1,
    total: 4,
    badges: [
      {
        key: 'data-driven',
        emoji: '📊',
        title: 'Data-Driven',
        quote: '"View your performance analytics for the first time."',
        description: 'Checking your analytics shows self-awareness the rarest quality in aspirants.',
        tag: 'ANALYTICS',
        destination: 'Performance',
        destinationHref: '/dashboard/performance',
        status: 'earned',
      },
      {
        key: 'trend-watcher',
        emoji: '📉',
        title: 'Trend Watcher',
        quote: '"Check analytics weekly for 4 consecutive weeks."',
        description: 'Tracking your score trend weekly means you catch problems before they become exam disasters.',
        tag: 'ANALYTICS',
        destination: 'Performance',
        destinationHref: '/dashboard/performance',
        status: 'locked',
      },
      {
        key: 'consistent-growth',
        emoji: '🚀',
        title: 'Consistent Growth',
        quote: '"Show consistent score improvement for 1 month in analytics."',
        description: '1 month of improving scores. Data doesn’t lie you are genuinely getting better.',
        tag: 'ANALYTICS',
        destination: 'Performance',
        destinationHref: '/dashboard/performance',
        status: 'locked',
      },
      {
        key: 'all-green',
        emoji: '💚',
        title: 'All Green',
        quote: '"Achieve above-average scores in all GS subjects simultaneously."',
        description: 'Every subject showing green on analytics. You are a complete, well-rounded aspirant.',
        tag: 'ANALYTICS',
        destination: 'Performance',
        destinationHref: '/dashboard/performance',
        status: 'locked',
      },
    ],
  },
  {
    key: 'community',
    emoji: '🤝',
    iconKey: 'peer-mentor',
    title: 'Community Groups, Leaderboard & Q&A',
    earned: 0,
    total: 4,
    badges: [
      {
        key: 'top-10',
        emoji: '🔝',
        title: 'Top-10',
        quote: '"Finish in the top 10 on any weekly leaderboard."',
        description: 'Top 10 on the weekly board. You are no longer just participating you are competing.',
        tag: 'COMMUNITY',
        destination: 'Leaderboard',
        destinationHref: '/dashboard/leaderboard',
        status: 'locked',
      },
      {
        key: 'top-of-the-board',
        emoji: '🏔️',
        title: 'Top of the Board',
        quote: '"Rank #1 on any weekly leaderboard."',
        description: 'Rank #1 for the week. This week’s score says: you’re rising.',
        tag: 'COMMUNITY',
        destination: 'Leaderboard',
        destinationHref: '/dashboard/leaderboard',
        status: 'locked',
      },
      {
        key: 'peer-mentor',
        emoji: '💡',
        title: 'Peer Mentor',
        quote: '"Give 5 answers marked helpful in the Discussion Forum."',
        description: 'Teaching others forces you to deepen your own understanding. That’s double the gain.',
        tag: 'COMMUNITY',
        destination: 'Q&A Forum',
        destinationHref: '/dashboard/qa-forum',
        status: 'locked',
      },
      {
        key: 'forum-expert',
        emoji: '🎓',
        title: 'Forum Expert',
        quote: '"Give 25 answers marked helpful in Discussion Forum."',
        description: '25 helpful answers makes you the go-to expert. Leadership + knowledge = UPSC looks up to.',
        tag: 'COMMUNITY',
        destination: 'Q&A Forum',
        destinationHref: '/dashboard/qa-forum',
        status: 'locked',
      },
    ],
  },
];

function BadgeIcon({ badgeKey, title, locked }: { badgeKey: string; title: string; locked: boolean }) {
  const src = `/icons/achievement/${badgeKey}.png`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      srcSet={`${src} 4x`}
      alt={title}
      width={56}
      height={56}
      decoding="async"
      loading="lazy"
      className="rounded-[14px] shrink-0"
      style={{
        width: 56,
        height: 56,
        objectFit: 'contain',
        filter: locked ? 'grayscale(0.6) opacity(0.85)' : 'none',
      }}
    />
  );
}

function CategoryIcon({ iconKey, title }: { iconKey: string; title: string }) {
  const src = `/icons/achievement/${iconKey}.png`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      srcSet={`${src} 4x`}
      alt=""
      width={18}
      height={18}
      decoding="async"
      loading="lazy"
      aria-hidden="true"
      className="shrink-0 rounded-[5px]"
      style={{ width: 18, height: 18, objectFit: 'contain' }}
      title={title}
    />
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" stroke="#9CA3AF" strokeWidth="1.6" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#16A34A" />
      <path d="M7.5 12.5L10.5 15.5L16.5 9.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BadgeCard({ badge }: { badge: Badge }) {
  const isLocked = badge.status === 'locked';
  const pill = PILL_COLORS[badge.tag] ?? PILL_COLORS.STREAK;

  return (
    <div
      className="relative flex flex-col rounded-[14px] border bg-white"
      style={{
        borderColor: '#EEF0F4',
        boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.04)',
      }}
    >
      <div className="absolute right-3 top-3">
        {isLocked ? <LockIcon /> : <CheckIcon />}
      </div>

      <div className="flex gap-[14px] p-5 pb-3">
        <BadgeIcon badgeKey={badge.key} title={badge.title} locked={isLocked} />
        <div className="flex flex-1 min-w-0 flex-col gap-[3px]">
          <div
            className="pr-7"
            style={{
              color: '#141210',
              fontFamily: '"DM Sans", var(--font-dm-sans), system-ui, sans-serif',
              fontSize: '14.1px',
              fontStyle: 'normal',
              fontWeight: 800,
              lineHeight: 'normal',
            }}
          >
            {badge.title}
          </div>
          <div className="text-[10.5px] italic leading-[1.35] text-[#B8820A] font-arimo">
            {badge.quote}
          </div>
          <div className="pt-1 text-[10.8px] leading-[1.5] text-[#6B645A] font-arimo">
            {badge.description}
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-[6px] border-t border-[rgba(0,0,0,0.07)] px-5 py-[10px]">
        <span
          className="rounded-[4px] px-[7px] py-[2px] text-[8.6px] font-bold uppercase tracking-[0.864px]"
          style={{ background: pill.bg, color: pill.text }}
        >
          {badge.tag}
        </span>
        <Link
          href={badge.destinationHref}
          className="text-[9.6px] font-bold text-[#3A3530] hover:underline"
        >
          {badge.destination}
        </Link>
      </div>
    </div>
  );
}

function CategorySection({ category }: { category: BadgeCategory }) {
  return (
    <section className="mt-10 first:mt-0">
      <div className="mb-5 flex items-center justify-center gap-3">
        <div className="h-[1px] flex-1 bg-[rgba(0,0,0,0.08)]" />
        <div className="flex items-center gap-2 rounded-full bg-white px-[14px] py-[6px] shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <CategoryIcon iconKey={category.iconKey} title={category.title} />
          <span className="font-arimo text-[13.5px] font-bold text-[#1E2875]">{category.title}</span>
          <span className="ml-1 rounded-full bg-[#F4F5F8] px-[10px] py-[2px] text-[11px] font-semibold text-[#4B5563]">
            {category.earned} / {category.total} earned
          </span>
        </div>
        <div className="h-[1px] flex-1 bg-[rgba(0,0,0,0.08)]" />
      </div>

      <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-4">
        {category.badges.map((b) => (
          <BadgeCard key={b.key} badge={b} />
        ))}
      </div>
    </section>
  );
}

export default function AchievementBadgesPage() {
  const totals = useMemo(() => {
    const totalBadges = CATEGORIES.reduce((s, c) => s + c.total, 0);
    const earned = CATEGORIES.reduce((s, c) => s + c.earned, 0);
    return { totalBadges, earned };
  }, []);

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-arimo">
      <DashboardPageHero
        badgeText="YOUR ACHIEVEMENT BOARD"
        title={
          <>
            <em className="not-italic" style={{ color: '#E8B84B', fontStyle: 'italic' }}>
              Earn Your Badges.
            </em>{' '}
            <span>Rise to the Top.</span>
          </>
        }
        subtitle="A complete achievement system for UPSC aspirants, designed to motivate, retain and recognise every kind of effort on the RiseWithJeet platform."
        stats={[
          { value: String(totals.earned), label: 'Badges Earned', color: '#FDC700' },
          { value: String(totals.totalBadges), label: 'Total Badges', color: '#F87171' },
          { value: '4', label: 'Day Streak', color: '#4ADE80' },
          { value: '60%', label: 'Syllabus Done', color: '#FFFFFF' },
        ]}
      />

      <main className="mx-auto max-w-[1180px] px-4 pb-16">
        {CATEGORIES.map((category) => (
          <CategorySection key={category.key} category={category} />
        ))}
      </main>
    </div>
  );
}
