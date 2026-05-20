'use client';

import React, { useEffect, useState } from 'react';
import PageHeroBackground from '@/components/PageHeroBackground';

type TabId = 'current-affairs' | 'mcqs' | 'answer-writing' | 'pyqs' | 'flashcards' | 'video-lectures';
type OptionState = 'default' | 'correct' | 'wrong';

type FilterPill = { id: string; label: string; count: number; icon?: string };
type Badge = { label: string; tone: 'blue' | 'gold' | 'green' | 'red' | 'orange' | 'slate' | 'dark' };
type Status = { label: string; tone: 'gold' | 'green' | 'red' | 'blue' };
type Option = { key: string; text: string; state?: OptionState };

type ArticleCard = {
  kind: 'article';
  id: string;
  accent: string;
  badges: Badge[];
  source: string;
  date: string;
  title: string;
  description: string;
  tags: string[];
  status: Status;
};

type McqCard = {
  kind: 'mcq';
  id: string;
  accent: string;
  difficulty: Badge;
  gs: Badge;
  source: string;
  date: string;
  question: string;
  options: Option[];
  status: Status;
  reveal?: boolean;
};

type TextCard = {
  kind: 'text';
  id: string;
  accent: string;
  badges: Badge[];
  date: string;
  title: string;
  description?: string;
  tags: string[];
  status: Status;
};

type FlashcardCard = {
  kind: 'flashcard';
  id: string;
  accent: string;
  badges: Badge[];
  date: string;
  front: string;
  back: string;
  status: Status;
};

type VideoCard = {
  kind: 'video';
  id: string;
  accent: string;
  duration: string;
  subject: string;
  date: string;
  title: string;
  author: string;
  description: string;
  status: Status;
  progress?: number;
  remaining?: string;
};

type SavedCard = ArticleCard | McqCard | TextCard | FlashcardCard | VideoCard;

const tabs: Array<{ id: TabId; label: string; count: number; icon: string }> = [
  { id: 'current-affairs', label: 'Current Affairs', count: 18, icon: '📰' },
  { id: 'mcqs', label: 'MCQs', count: 12, icon: '🎯' },
  { id: 'answer-writing', label: 'Answer Writing', count: 8, icon: '✍️' },
  { id: 'pyqs', label: 'PYQs', count: 7, icon: '📜' },
  { id: 'flashcards', label: 'Flashcards', count: 9, icon: '🗂️' },
  { id: 'video-lectures', label: 'Video Lectures', count: 6, icon: '🎬' },
];

const filtersByTab: Record<TabId, FilterPill[]> = {
  'current-affairs': [
    { id: 'all', label: 'All', count: 18 },
    { id: 'unread', label: 'Unread', count: 7 },
    { id: 'read', label: 'Read', count: 9 },
    { id: 'revision', label: 'For Revision', count: 2 },
    { id: 'starred', label: 'Starred', count: 4, icon: '*' },
  ],
  mcqs: [
    { id: 'all', label: 'All', count: 12 },
    { id: 'new', label: 'New', count: 4 },
    { id: 'attempted', label: 'Attempted', count: 6 },
    { id: 'wrong', label: 'Got Wrong', count: 3, icon: 'x' },
    { id: 'revision', label: 'Revision', count: 2, icon: 'R' },
    { id: 'starred', label: 'Starred', count: 3, icon: '*' },
  ],
  'answer-writing': [
    { id: 'all', label: 'All', count: 8 },
    { id: 'not-attempted', label: 'Not Attempted', count: 3 },
    { id: 'draft', label: 'Draft', count: 2 },
    { id: 'submitted', label: 'Submitted', count: 2 },
    { id: 'revision', label: 'Revision', count: 1, icon: 'R' },
    { id: 'starred', label: 'Starred', count: 3, icon: '*' },
  ],
  pyqs: [
    { id: 'all', label: 'All', count: 7 },
    { id: 'prelims', label: 'Prelims', count: 3 },
    { id: 'mains', label: 'Mains', count: 4 },
    { id: 'revision', label: 'Revision', count: 2, icon: 'R' },
    { id: 'starred', label: 'Starred', count: 3, icon: '*' },
  ],
  flashcards: [
    { id: 'all', label: 'All', count: 9 },
    { id: 'new', label: 'New', count: 3 },
    { id: 'learning', label: 'Learning', count: 4 },
    { id: 'mastered', label: 'Mastered', count: 2, icon: 'M' },
    { id: 'starred', label: 'Starred', count: 3, icon: '*' },
  ],
  'video-lectures': [
    { id: 'all', label: 'All', count: 6 },
    { id: 'not-watched', label: 'Not Watched', count: 2 },
    { id: 'watching', label: 'Watching', count: 2, icon: 'P' },
    { id: 'watched', label: 'Watched', count: 2, icon: 'W' },
    { id: 'starred', label: 'Starred', count: 3, icon: '*' },
  ],
};

const actionByTab: Record<TabId, string> = {
  'current-affairs': 'Save Article',
  mcqs: 'Save MCQ',
  'answer-writing': 'Save Question',
  pyqs: 'Save PYQ',
  flashcards: 'Add Flashcard',
  'video-lectures': 'Save Lecture',
};

const cardsByTab: Record<TabId, SavedCard[]> = {
  'current-affairs': [
    {
      kind: 'article',
      id: 'ca-1',
      accent: '#55B76C',
      badges: [{ label: 'GS 1', tone: 'blue' }, { label: 'PRELIMS', tone: 'gold' }],
      source: 'PIB',
      date: 'Apr 15',
      title: 'Archaeological Survey of India discovers Bronze Age settlement in Rajasthan',
      description: 'The ASI has announced a significant Bronze Age discovery near Jodhpur, potentially rewriting our understanding of...',
      tags: ['History', 'Culture', 'Archaeology'],
      status: { label: 'Revision', tone: 'gold' },
    },
    {
      kind: 'article',
      id: 'ca-2',
      accent: '#FB8B4C',
      badges: [{ label: 'GS 3', tone: 'orange' }, { label: 'MAINS', tone: 'blue' }],
      source: 'Indian Express',
      date: 'Apr 17',
      title: "India's Green Hydrogen Mission: Progress and challenges in 2026",
      description: 'The National Green Hydrogen Mission is entering a critical implementation phase with several pilot projects coming...',
      tags: ['Environment', 'Energy', 'Climate'],
      status: { label: 'Unread', tone: 'red' },
    },
    {
      kind: 'article',
      id: 'ca-3',
      accent: '#F4C15A',
      badges: [{ label: 'GS 1', tone: 'blue' }, { label: 'PRELIMS', tone: 'gold' }],
      source: 'PIB',
      date: 'Apr 15',
      title: 'Archaeological Survey of India discovers Bronze Age settlement in Rajasthan',
      description: 'The ASI has announced a significant Bronze Age discovery near Jodhpur, potentially rewriting our understanding of...',
      tags: ['History', 'Culture', 'Archaeology'],
      status: { label: 'Revision', tone: 'gold' },
    },
  ],
  mcqs: [
    {
      kind: 'mcq',
      id: 'mcq-1',
      accent: '#7AA3FF',
      difficulty: { label: 'MEDIUM', tone: 'gold' },
      gs: { label: 'GS 1', tone: 'blue' },
      source: 'UPSC 2023',
      date: 'Apr 16',
      question: 'With reference to the Champaran Satyagraha, consider the following statements:',
      options: [
        { key: 'A', text: 'It was directed against the European indigo planters' },
        { key: 'B', text: 'The movement was initiated in 1917 by Mahatma Gandhi', state: 'correct' },
        { key: 'C', text: 'It led to the Rowlatt Act of 1919' },
        { key: 'D', text: 'It was part of the Non-Cooperation Movement', state: 'wrong' },
      ],
      status: { label: 'Attempted', tone: 'green' },
    },
    {
      kind: 'mcq',
      id: 'mcq-2',
      accent: '#EF7777',
      difficulty: { label: 'HARD', tone: 'red' },
      gs: { label: 'GS 3', tone: 'orange' },
      source: 'RWJ Mock',
      date: 'Apr 14',
      question: "Which of the following is/are correctly matched regarding India's fiscal deficit targets under the FRBM Act?",
      options: [
        { key: 'A', text: '3% of GDP as the medium-term target', state: 'correct' },
        { key: 'B', text: '2.5% of GDP as escape clause threshold' },
        { key: 'C', text: 'Both A and B', state: 'wrong' },
        { key: 'D', text: 'Neither A nor B' },
      ],
      status: { label: 'Got Wrong', tone: 'red' },
    },
    {
      kind: 'mcq',
      id: 'mcq-3',
      accent: '#A77CF2',
      difficulty: { label: 'EASY', tone: 'green' },
      gs: { label: 'GS 2', tone: 'green' },
      source: 'UPSC 2022',
      date: 'Apr 12',
      question: "The 'Zero Hour' in the Parliament of India refers to:",
      options: [
        { key: 'A', text: 'The first hour of each sitting of both Houses' },
        { key: 'B', text: 'The time immediately after Question Hour' },
        { key: 'C', text: "The time for private members' business" },
        { key: 'D', text: 'The last hour of each sitting' },
      ],
      status: { label: 'New', tone: 'red' },
      reveal: true,
    },
  ],
  'answer-writing': [
    {
      kind: 'text',
      id: 'aw-1',
      accent: '#FFCA67',
      badges: [{ label: 'GS MAINS IV', tone: 'green' }, { label: '10 MARKS', tone: 'gold' }, { label: 'ESSAY', tone: 'green' }],
      date: 'Apr 10',
      title: 'Technology is a double-edged sword - it solves one problem and creates another.',
      tags: ['Science & Tech', 'Society', 'Essay'],
      status: { label: 'Submitted', tone: 'green' },
    },
    {
      kind: 'text',
      id: 'aw-2',
      accent: '#6BC8A0',
      badges: [{ label: 'GS MAINS III', tone: 'green' }, { label: '15 MARKS', tone: 'gold' }, { label: 'ESSAY', tone: 'green' }],
      date: 'Apr 10',
      title: 'Technology is a double-edged sword - it solves one problem and creates another.',
      tags: ['Science & Tech', 'Society', 'Essay'],
      status: { label: 'Submitted', tone: 'green' },
    },
    {
      kind: 'text',
      id: 'aw-3',
      accent: '#6BC8A0',
      badges: [{ label: 'ESSAY', tone: 'green' }, { label: '125 MARKS', tone: 'gold' }, { label: 'ESSAY', tone: 'green' }],
      date: 'Apr 10',
      title: 'Technology is a double-edged sword - it solves one problem and creates another.',
      tags: ['Science & Tech', 'Society', 'Essay'],
      status: { label: 'Submitted', tone: 'green' },
    },
  ],
  pyqs: [
    {
      kind: 'text',
      id: 'pyq-1',
      accent: '#F6CE70',
      badges: [{ label: '2023', tone: 'dark' }, { label: 'MAINS - GS 2', tone: 'slate' }],
      date: 'Saved Apr 18',
      title: 'Discuss the significance of cooperative federalism in addressing regional imbalances in India. How can Centre-State relations be further strengthened?',
      description: 'Key points: Finance Commission role, GST Council as model, Niti Aayog vs Planning Commission, Article 263 Inter-State...',
      tags: ['Federalism', 'Governance', 'GS 2'],
      status: { label: 'For Revision', tone: 'gold' },
    },
    {
      kind: 'mcq',
      id: 'pyq-2',
      accent: '#D7DCE8',
      difficulty: { label: '2022', tone: 'dark' },
      gs: { label: 'PRELIMS - GS 1', tone: 'slate' },
      source: '',
      date: 'Saved Apr 14',
      question: 'With reference to the Swadeshi movement, which of the following statements is/are correct?',
      options: [
        { key: 'A', text: 'It was launched in protest against the partition of Bengal (1905)', state: 'correct' },
        { key: 'B', text: 'It was purely an economic movement without political dimensions' },
      ],
      status: { label: 'Attempted', tone: 'green' },
    },
  ],
  flashcards: [
    {
      kind: 'flashcard',
      id: 'fc-1',
      accent: '#F6CE70',
      badges: [{ label: 'POLITY', tone: 'slate' }, { label: 'Learning', tone: 'gold' }],
      date: 'Apr 18',
      front: 'Difference between Fundamental Rights (Part III) and Directive Principles of State Policy (Part IV)',
      back: 'FRs are justiciable & enforceable; DPSPs are non-justiciable guidelines for policy-making. FRs protect individual liberty; DPSPs promote social welfare.',
      status: { label: 'Learning', tone: 'gold' },
    },
    {
      kind: 'flashcard',
      id: 'fc-2',
      accent: '#65C79E',
      badges: [{ label: 'ECONOMY', tone: 'slate' }],
      date: 'Apr 12',
      front: 'What is the difference between Repo Rate and Reverse Repo Rate?',
      back: 'Repo Rate: Rate at which RBI lends to commercial banks. Reverse Repo: Rate at which RBI borrows from banks. Higher Repo -> costlier loans -> reduced inflation.',
      status: { label: 'Mastered', tone: 'green' },
    },
    {
      kind: 'flashcard',
      id: 'fc-3',
      accent: '#D7DCE8',
      badges: [{ label: 'ENVIRONMENT', tone: 'slate' }],
      date: 'Apr 20',
      front: 'Name the 5 Ramsar Wetland Sites added by India in 2023',
      back: 'Ankasamudra Bird Conservation Reserve (KA), Aghanashini Estuary (KA), Magadi Kere (KA), Karaivetti Bird Sanctuary (TN), Longwood Shola Reserve Forest (TN)',
      status: { label: 'New', tone: 'red' },
    },
  ],
  'video-lectures': [
    {
      kind: 'video',
      id: 'vl-1',
      accent: '#EF7777',
      duration: '1H 42M',
      subject: 'Polity',
      date: 'Apr 16',
      title: 'Indian Constitution - Fundamental Rights Deep Dive (Part 2)',
      author: 'RiseWithJeet - Jeet Sir',
      description: '',
      progress: 64,
      remaining: '1h 42m',
      status: { label: 'Watching', tone: 'gold' },
    },
    {
      kind: 'video',
      id: 'vl-2',
      accent: '#65C79E',
      duration: '58M',
      subject: 'Economy',
      date: 'Apr 12',
      title: 'RBI Monetary Policy Transmission - How interest rates affect the economy',
      author: 'RiseWithJeet',
      description: 'Covers repo rate, CRR, SLR, open market operations and their cascading effects on inflation and growth.',
      status: { label: 'Watched', tone: 'green' },
    },
    {
      kind: 'video',
      id: 'vl-3',
      accent: '#EF7777',
      duration: '2H 15M',
      subject: 'History',
      date: 'Apr 10',
      title: 'Modern India - From 1857 to Independence Complete Revision Series',
      author: 'Jeet Sir',
      description: 'Comprehensive coverage of the freedom struggle, key movements, and constitutional developments for UPSC...',
      status: { label: 'Not Watched', tone: 'red' },
    },
  ],
};

const badgeStyles: Record<Badge['tone'], string> = {
  blue: 'bg-[#EEF2FF] border-[#CCD5FF] text-[#6366F1]',
  gold: 'bg-[#FFF7E6] border-[#F4D28B] text-[#D49A22]',
  green: 'bg-[#EAF9F1] border-[#BFE9D1] text-[#18A35A]',
  red: 'bg-[#FFF1F1] border-[#FFBFC0] text-[#E22A2A]',
  orange: 'bg-[#FFF0E6] border-[#FFC7A1] text-[#F06B23]',
  slate: 'bg-[#EEF2F6] border-[#D7DEE8] text-[#8794A8]',
  dark: 'bg-[#111927] border-[#111927] text-[#F2C94C]',
};

const statusStyles: Record<Status['tone'], string> = {
  gold: 'bg-[#FFF7E6] border-[#F1D799] text-[#C48A19]',
  green: 'bg-[#EAF9F1] border-[#BFE9D1] text-[#18A35A]',
  red: 'bg-[#FFF1F1] border-[#FFBFC0] text-[#E22A2A]',
  blue: 'bg-[#EEF6FF] border-[#C8DCF8] text-[#3178D6]',
};

const optionStyles: Record<OptionState, string> = {
  default: 'bg-[#FBFCFE] border-[#E2E6EC] text-[#344158]',
  correct: 'bg-[#EAF8F0] border-[#BCE7D0] text-[#18A35A] font-bold',
  wrong: 'bg-[#FFF1F1] border-[#FFC6C6] text-[#E22A2A]',
};

function SmallBadge({ badge }: { badge: Badge }) {
  return (
    <span className={`inline-flex h-[20px] items-center rounded-[5px] border px-2 text-[10px] font-extrabold uppercase tracking-[0.2px] ${badgeStyles[badge.tone]}`}>
      {badge.label}
    </span>
  );
}

function StatusPill({ status }: { status: Status }) {
  const prefix = status.tone === 'green' ? 'OK' : status.tone === 'red' ? 'NEW' : 'R';
  return (
    <span className={`inline-flex h-[25px] items-center gap-1 rounded-full border px-3 text-[11px] font-bold ${statusStyles[status.tone]}`}>
      <span className="text-[9px]">{prefix}</span>
      {status.label}
    </span>
  );
}

function CardShell({ accent, children, footer }: { accent: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <article className="relative overflow-hidden rounded-[14px] border border-[#E2E7EF] bg-white shadow-[0_1px_2px_rgba(11,22,40,0.03)]">
      <span className="absolute bottom-0 left-0 top-0 w-[4px]" style={{ background: accent }} />
      <div className="min-h-[168px] px-[22px] py-[18px]">{children}</div>
      <div className="flex h-[52px] items-center justify-between border-t border-[#EDF0F5] px-[22px]">{footer}</div>
    </article>
  );
}

function ActionButtons({ external = false }: { external?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <button className="grid h-[32px] w-[32px] place-items-center rounded-[8px] border border-[#F2D79B] bg-[#FFF9EF] text-[14px] font-bold text-[#E7B52F]" aria-label="Star">
        *
      </button>
      {external && (
        <button className="grid h-[32px] w-[32px] place-items-center rounded-[8px] border border-[#D4DAE4] bg-[#FBFCFE] text-[12px] font-bold text-[#8090A4]" aria-label="Open">
          NE
        </button>
      )}
      <button className="grid h-[32px] w-[32px] place-items-center rounded-[8px] border border-[#D4DAE4] bg-[#FBFCFE] text-[10px] font-bold text-[#8090A4]" aria-label="Delete">
        DEL
      </button>
    </div>
  );
}

function ArticleSavedCard({ card }: { card: ArticleCard }) {
  return (
    <CardShell accent={card.accent} footer={<><StatusPill status={card.status} /><ActionButtons external /></>}>
      <div className="mb-3 flex items-center gap-2">
        {card.badges.map((badge) => <SmallBadge key={badge.label} badge={badge} />)}
        <span className="text-[11px] font-medium text-[#9AA5B8]">- {card.source}</span>
        <span className="ml-auto text-[10px] text-[#9AA5B8]">{card.date}</span>
      </div>
      <h3 className="mb-3 text-[16px] font-bold leading-[1.35] text-[#111827]">{card.title}</h3>
      <p className="mb-3 line-clamp-2 text-[13px] leading-[1.5] text-[#41506A]">{card.description}</p>
      <div className="flex flex-wrap gap-2">{card.tags.map((tag) => <SmallBadge key={tag} badge={{ label: tag, tone: 'gold' }} />)}</div>
    </CardShell>
  );
}

function McqSavedCard({ card }: { card: McqCard }) {
  return (
    <CardShell accent={card.accent} footer={<><StatusPill status={card.status} /><ActionButtons /></>}>
      <div className="mb-3 flex items-center gap-2">
        <SmallBadge badge={card.difficulty} />
        <SmallBadge badge={card.gs} />
        {card.source && <span className="text-[11px] font-medium text-[#9AA5B8]">- {card.source}</span>}
        <span className="ml-auto text-[10px] text-[#9AA5B8]">{card.date}</span>
      </div>
      <h3 className="mb-4 text-[16px] font-bold leading-[1.35] text-[#111827]">{card.question}</h3>
      <div className="space-y-2">
        {card.options.map((option) => (
          <div key={option.key} className={`flex min-h-[36px] items-start gap-3 rounded-[7px] border px-3 py-2 text-[13px] leading-[1.35] ${optionStyles[option.state ?? 'default']}`}>
            <span className="w-4 shrink-0 font-bold">{option.key}</span>
            <span>{option.text}</span>
          </div>
        ))}
      </div>
      {card.reveal && (
        <button className="mt-4 h-[30px] rounded-[7px] border border-[#BFD5FF] bg-[#EFF5FF] px-3 text-[12px] font-bold text-[#2563EB]">
          Reveal Answer
        </button>
      )}
    </CardShell>
  );
}

function TextSavedCard({ card }: { card: TextCard }) {
  return (
    <CardShell accent={card.accent} footer={<><StatusPill status={card.status} /><ActionButtons /></>}>
      <div className="mb-3 flex items-center gap-2">
        {card.badges.map((badge) => <SmallBadge key={badge.label} badge={badge} />)}
        <span className="ml-auto text-[10px] text-[#9AA5B8]">{card.date}</span>
      </div>
      <h3 className="mb-3 text-[16px] font-bold leading-[1.35] text-[#111827]">{card.title}</h3>
      {card.description && <p className="mb-3 line-clamp-2 text-[13px] leading-[1.5] text-[#41506A]">{card.description}</p>}
      <div className="flex flex-wrap gap-2">{card.tags.map((tag) => <SmallBadge key={tag} badge={{ label: tag, tone: 'gold' }} />)}</div>
    </CardShell>
  );
}

function FlashcardSavedCard({ card }: { card: FlashcardCard }) {
  return (
    <CardShell accent={card.accent} footer={<><StatusPill status={card.status} /><ActionButtons /></>}>
      <div className="mb-3 flex items-center gap-2">
        {card.badges.map((badge) => <SmallBadge key={badge.label} badge={badge} />)}
        <span className="ml-auto text-[10px] text-[#9AA5B8]">{card.date}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="min-h-[150px] rounded-[8px] bg-[#111D31] p-4 text-white">
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[1px] text-[#AEB9CB]">Front</div>
          <p className="text-[13px] leading-[1.55]">{card.front}</p>
        </div>
        <div className="min-h-[150px] rounded-[8px] border border-[#F1DDAA] bg-[#FFF9EC] p-4 text-[#172033]">
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[1px] text-[#9A8A66]">Back</div>
          <p className="text-[13px] leading-[1.55]">{card.back}</p>
        </div>
      </div>
    </CardShell>
  );
}

function VideoSavedCard({ card }: { card: VideoCard }) {
  return (
    <CardShell accent={card.accent} footer={<><StatusPill status={card.status} /><ActionButtons external /></>}>
      <div className="mb-3 grid h-[182px] place-items-center rounded-[8px] bg-[#101D31] text-[24px] text-[#B9C1CF]">PLAY</div>
      <div className="mb-2 flex items-center gap-2">
        <SmallBadge badge={{ label: card.duration, tone: 'red' }} />
        <span className="text-[11px] font-medium text-[#9AA5B8]">- {card.subject}</span>
        <span className="ml-auto text-[10px] text-[#9AA5B8]">{card.date}</span>
      </div>
      <h3 className="mb-2 text-[16px] font-bold leading-[1.35] text-[#111827]">{card.title}</h3>
      <p className="mb-2 text-[12px] font-medium text-[#526078]">{card.author}</p>
      {card.description && <p className="line-clamp-2 text-[13px] leading-[1.5] text-[#41506A]">{card.description}</p>}
      {typeof card.progress === 'number' && (
        <div className="mt-3">
          <div className="h-[4px] overflow-hidden rounded-full bg-[#E8ECF2]">
            <div className="h-full bg-[#FF5B6E]" style={{ width: `${card.progress}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-[#8B96A8]">
            <span>{card.progress}% watched</span>
            <span>{card.remaining}</span>
          </div>
        </div>
      )}
    </CardShell>
  );
}

function SavedCardView({ card }: { card: SavedCard }) {
  if (card.kind === 'article') return <ArticleSavedCard card={card} />;
  if (card.kind === 'mcq') return <McqSavedCard card={card} />;
  if (card.kind === 'text') return <TextSavedCard card={card} />;
  if (card.kind === 'flashcard') return <FlashcardSavedCard card={card} />;
  return <VideoSavedCard card={card} />;
}

function BookmarksHero() {
  return (
    <PageHeroBackground
      className="flex min-h-[360px] flex-col items-center justify-center px-6 py-0"
      style={{
        boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.08)',
      }}
    >
      <div className="mx-auto flex w-full max-w-[760px] flex-col items-center text-center">
        <div className="mb-4 flex w-full items-center justify-center gap-4">
          <span className="h-px w-[38px] bg-[#E8B84B]/75" />
          <span className="text-[11px] font-bold uppercase tracking-[3px] text-[#E8B84B]">Your Bookmarks Vault</span>
          <span className="h-px w-[38px] bg-[#E8B84B]/75" />
        </div>
        <h1
          className="mx-auto max-w-[710px] text-center text-[52px] font-semibold leading-[1.08] text-white max-md:text-[40px]"
          style={{ fontFamily: 'var(--font-cormorant-garamond), Georgia, serif' }}
        >
          Everything you&apos;ve <span className="italic text-[#E8B84B]">saved</span>, in one
          <br />
          place
        </h1>
        <p className="mx-auto mt-5 max-w-[610px] text-center text-[14px] leading-[1.55] text-white/50">
          Articles, MCQs, questions, flashcards, lectures all your bookmarks from every module, tagged and ready for revision.
        </p>
        <div className="mx-auto mt-7 flex h-[40px] w-full max-w-[480px] items-center gap-3 rounded-[10px] border border-white/15 bg-white/[0.08] px-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" className="shrink-0 text-white/45">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="flex-1 text-[13px] text-white/45">Search across all saved items...</span>
          <span className="rounded-[6px] border border-white/15 bg-white/[0.06] px-2 py-1 text-[10px] font-bold text-white/40">K</span>
        </div>
      </div>
    </PageHeroBackground>
  );
}

function RevisionCta() {
  return (
    <section className="bg-[#090E1C] px-6 py-20 text-center">
      <h2
        className="text-[42px] font-semibold leading-[1.08] text-white"
        style={{ fontFamily: 'var(--font-cormorant-garamond), Georgia, serif' }}
      >
        Keep rising,
      </h2>
      <h2
        className="text-[42px] font-semibold italic leading-[1.08] text-[#E8B84B]"
        style={{ fontFamily: 'var(--font-cormorant-garamond), Georgia, serif' }}
      >
        keep revising.
      </h2>
      <p className="mx-auto mt-5 max-w-[560px] text-[14px] leading-[1.7] text-white/55">
        Every MCQ, article, and question you bookmark brings you one step closer to the IAS dream.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button className="h-[42px] rounded-[9px] bg-[#E8B84B] px-5 text-[13px] font-bold text-[#0B1428]">
          + Save to Current Module
        </button>
        <button className="h-[42px] rounded-[9px] border border-white/20 px-5 text-[13px] font-bold text-white">
          Explore All Modules
        </button>
      </div>
    </section>
  );
}

export default function BookmarksPage() {
  const [activeTab, setActiveTab] = useState<TabId>('mcqs');
  const [activeFilter, setActiveFilter] = useState('all');
  const [mockTestMcqs, setMockTestMcqs] = useState<McqCard[]>([]);
  const filters = filtersByTab[activeTab];
  const mergedCardsByTab: Record<TabId, SavedCard[]> = {
    ...cardsByTab,
    mcqs: [...mockTestMcqs, ...cardsByTab.mcqs],
  };
  const cards = mergedCardsByTab[activeTab];
  const tabCounts = tabs.reduce<Record<TabId, number>>((acc, tab) => {
    acc[tab.id] = mergedCardsByTab[tab.id].length;
    return acc;
  }, {} as Record<TabId, number>);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('mock-test-bookmarked-mcqs');
      const saved = JSON.parse(raw || '[]');
      if (!Array.isArray(saved)) return;
      setMockTestMcqs(saved.map((item: any, index: number): McqCard => ({
        kind: 'mcq',
        id: String(item.id ?? `mock-bookmark-${index}`),
        accent: '#7AA3FF',
        difficulty: { label: String(item.difficulty ?? 'MEDIUM').toUpperCase(), tone: 'gold' },
        gs: { label: item.subject || 'GS', tone: 'blue' },
        source: item.source || 'Mock Test',
        date: item.date || 'Today',
        question: item.question || '',
        options: Array.isArray(item.options)
          ? item.options.map((opt: any) => ({
              key: String(opt.label ?? opt.key ?? ''),
              text: String(opt.text ?? ''),
              state: opt.label === item.correct ? 'correct' : undefined,
            }))
          : [],
        status: { label: 'Revision', tone: 'gold' },
        reveal: true,
      })));
    } catch {
      setMockTestMcqs([]);
    }
  }, []);

  function selectTab(tab: TabId) {
    setActiveTab(tab);
    setActiveFilter('all');
  }

  return (
    <div className="min-h-full bg-[#F4F6FB] font-arimo">
      <BookmarksHero />

      <div className="h-[48px] overflow-x-auto border-b border-[#DDE2EA] bg-white shadow-[0_4px_16px_rgba(11,22,40,0.08)]">
        <div className="mx-auto flex h-full max-w-[1240px] items-center gap-4 px-6">
          {tabs.map((tab) => {
            const active = tab.id === activeTab;
            const count = tabCounts[tab.id] ?? tab.count;
            return (
              <button
                key={tab.id}
                onClick={() => selectTab(tab.id)}
                className="relative flex h-full shrink-0 items-center gap-2 px-2 text-[13px] font-semibold"
                style={{ color: active ? '#D49216' : '#66758D' }}
              >
                <span className="text-[13px] leading-none">{tab.icon}</span>
                <span>{tab.label}</span>
                <span className="rounded-full bg-[#E9EDF4] px-2 py-[1px] text-[10px] font-bold text-[#738197]">{count}</span>
                {active && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t bg-[#F0B32B]" />}
              </button>
            );
          })}
        </div>
      </div>

      <main className="mx-auto max-w-[1240px] px-6 py-9">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((filter) => {
              const active = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className="flex h-[32px] items-center gap-2 rounded-full border px-4 text-[13px] font-bold"
                  style={{
                    background: active ? '#EFC143' : '#FFFFFF',
                    borderColor: active ? '#EFC143' : '#D8DFEA',
                    color: active ? '#101827' : '#67768E',
                  }}
                >
                  {filter.icon && <span className="text-[11px]">{filter.icon}</span>}
                  {filter.label}
                  <span className="rounded-full bg-[#E9EDF4] px-2 py-[1px] text-[10px] text-[#6F7E92]">{filter.count}</span>
                </button>
              );
            })}
          </div>
          <button className="h-[38px] shrink-0 rounded-[11px] border border-dashed border-[#ECCB82] bg-[#FFF5DC] px-5 text-[14px] font-bold text-[#C48A19]">
            + {actionByTab[activeTab]}
          </button>
        </div>

        {cards.length > 0 ? (
          <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(330px,1fr))]">
            {cards.map((card) => <SavedCardView key={card.id} card={card} />)}
          </div>
        ) : (
          <div className="grid min-h-[360px] place-items-center text-center">
            <div>
              <div className="mx-auto mb-4 grid h-9 w-9 place-items-center rounded bg-[#E1E5EC] text-[11px] font-bold text-[#9AA5B8]">CA</div>
              <p className="mb-4 text-[14px] font-medium text-[#7D8AA0]">No articles saved yet</p>
              <button className="h-[36px] rounded-[10px] border border-dashed border-[#ECCB82] bg-[#FFF5DC] px-5 text-[13px] font-bold text-[#C48A19]">
                + Save your first article
              </button>
            </div>
          </div>
        )}
      </main>

      <RevisionCta />
    </div>
  );
}
