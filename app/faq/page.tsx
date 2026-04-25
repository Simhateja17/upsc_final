'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { faqService } from '@/lib/services';

// ── ICON MAP FOR API CATEGORIES ───────────────────────────────────────────────

function getCategoryMeta(name: string) {
  const map: Record<string, { icon: string; iconBg: string }> = {
    'General': { icon: '⚡', iconBg: 'rgba(232,184,75,0.15)' },
    'Study Planner': { icon: '📅', iconBg: 'rgba(8,145,178,0.12)' },
    'Jeet GPT': { icon: '🤖', iconBg: 'rgba(20,184,166,0.12)' },
    'Syllabus': { icon: '📋', iconBg: 'rgba(26,48,96,0.1)' },
    'Syllabus Tracker': { icon: '📋', iconBg: 'rgba(26,48,96,0.1)' },
    'Video Lectures': { icon: '🎬', iconBg: 'rgba(220,60,60,0.1)' },
    'Videos': { icon: '🎬', iconBg: 'rgba(220,60,60,0.1)' },
    'Study Material': { icon: '📚', iconBg: 'rgba(29,164,92,0.1)' },
    'Current Affairs': { icon: '🌐', iconBg: 'rgba(20,184,166,0.12)' },
    'Test Series': { icon: '📝', iconBg: 'rgba(232,184,75,0.12)' },
    'Personal Mentorship': { icon: '🎓', iconBg: 'rgba(26,48,96,0.1)' },
    'Mentorship': { icon: '🎓', iconBg: 'rgba(26,48,96,0.1)' },
    'Daily MCQ': { icon: '✏️', iconBg: 'rgba(232,184,75,0.12)' },
    'MCQ': { icon: '✏️', iconBg: 'rgba(232,184,75,0.12)' },
    'Answer Writing': { icon: '✍️', iconBg: 'rgba(29,164,92,0.1)' },
    'Mock Tests': { icon: '🎯', iconBg: 'rgba(220,60,60,0.1)' },
    'Previous Year Questions': { icon: '🗂️', iconBg: 'rgba(20,184,166,0.12)' },
    'PYQ': { icon: '🗂️', iconBg: 'rgba(20,184,166,0.12)' },
    'Performance Analytics': { icon: '📈', iconBg: 'rgba(8,145,178,0.12)' },
    'Analytics': { icon: '📈', iconBg: 'rgba(8,145,178,0.12)' },
    'Revision Tools': { icon: '🔁', iconBg: 'rgba(29,164,92,0.1)' },
    'Flashcards': { icon: '🔁', iconBg: 'rgba(29,164,92,0.1)' },
    'Pricing': { icon: '💳', iconBg: 'rgba(26,48,96,0.1)' },
    'Technical': { icon: '🔧', iconBg: 'rgba(100,100,100,0.1)' },
  };
  return map[name] || { icon: '❓', iconBg: 'rgba(100,100,100,0.1)' };
}

// ── FALLBACK FAQ DATA ─────────────────────────────────────────────────────────

const FALLBACK_CATEGORIES = [
  {
    id: 'cat-general',
    icon: '⚡',
    title: 'General',
    iconBg: 'rgba(232,184,75,0.15)',
    questions: [
      {
        q: 'What is RiseWithJeet and who is it for?',
        a: 'RiseWithJeet is an AI-powered UPSC preparation platform built for aspirants at every stage, whether you\'re in your first year or approaching your final attempt. It was started by <strong>Abhijeet Soni</strong>, an IIT Kharagpur alumnus and AI professional, who wanted to make high-quality, structured UPSC preparation accessible to every aspirant in India regardless of location or financial background.',
      },
      {
        q: 'Is there a free plan?',
        a: 'Yes. The <strong>Starter plan is completely free</strong> and includes daily MCQ practice, current affairs access, and the live study room. You can use these features for as long as you like at no cost. Paid plans unlock the full platform including AI evaluation, mock tests, mentorship, and the complete revision suite.',
      },
      {
        q: 'Is there a mobile app?',
        a: 'Yes. RiseWithJeet has a full-featured app for Android and iOS. Flashcards work offline, and you can photograph handwritten answers directly from the app to submit for AI evaluation.',
      },
      {
        q: 'Does the platform work on slow internet?',
        a: 'Yes, we specifically built RiseWithJeet to work well on low-bandwidth connections, because many of our users are in towns and cities where internet speeds are variable. The app also supports offline access for flashcards and downloaded study materials.',
      },
    ],
  },
  {
    id: 'cat-planner',
    icon: '📅',
    title: 'Study Planner',
    iconBg: 'rgba(8,145,178,0.12)',
    questions: [
      {
        q: 'How does the AI Study Planner work?',
        a: 'The Study Planner generates a personalised daily schedule based on your target exam date, the number of study hours you have available each day, your Syllabus Tracker progress, and your weak areas identified from MCQ and test performance. It adapts every week as your data changes, so the plan always reflects where you actually stand, not where you planned to be.',
      },
      {
        q: 'Can I customise my study plan?',
        a: 'Yes. You can set your daily study hours, preferred subject order, and optional subject from Account Settings. You can also regenerate the plan at any time with a single click. Tasks you complete get marked off and the system adjusts the remaining schedule accordingly.',
      },
      {
        q: 'What happens if I miss a day in my plan?',
        a: 'The planner does not penalise missed days. It simply redistributes the pending tasks across your remaining schedule. If you have fallen significantly behind, you can also regenerate the plan from scratch and it will recalculate based on the realistic time left.',
      },
    ],
  },
  {
    id: 'cat-jeetgpt',
    icon: '🤖',
    title: 'Jeet GPT',
    iconBg: 'rgba(20,184,166,0.12)',
    questions: [
      {
        q: 'What is Jeet GPT and what can I use it for?',
        a: 'Jeet GPT is your personal UPSC AI assistant. You can ask it anything related to your preparation: explain a concept from any GS paper, help structure a Mains answer step by step, summarise a current affairs topic and tag it to the syllabus, suggest relevant examples or case studies for a theme, or review your preparation strategy and flag gaps. It responds instantly and is trained on UPSC-specific content, not generic AI.',
      },
      {
        q: 'Is Jeet GPT available 24 hours a day?',
        a: 'Yes. Jeet GPT is available at any time of the day. There is no waiting, no scheduling, and no dependency on a human being available. Ask it at midnight before an exam if you need to.',
      },
      {
        q: 'Can Jeet GPT evaluate my answers?',
        a: 'Jeet GPT can give you quick feedback and structure suggestions in a conversational way. For detailed, scored evaluation across 8 parameters with examiner-level feedback, use the dedicated <strong>Daily Answer Writing</strong> module, which is specifically designed and trained for that purpose.',
      },
      {
        q: 'Is Jeet GPT accurate for UPSC content?',
        a: 'Jeet GPT is trained on UPSC-specific material including the full syllabus, PYQs, standard reference texts, and current affairs. That said, like all AI, it can occasionally be incomplete or imperfect on very specific factual queries. Always cross-check critical facts with source material before writing them in an exam answer.',
      },
    ],
  },
  {
    id: 'cat-syllabus',
    icon: '📋',
    title: 'Syllabus Tracker',
    iconBg: 'rgba(26,48,96,0.1)',
    questions: [
      {
        q: 'How do I use the Syllabus Tracker?',
        a: 'The Syllabus Tracker maps the full UPSC syllabus — GS I, II, III, IV, and Optional — into individual topics. For each topic, you can mark your status as <strong>Not Started</strong>, <strong>Reading</strong>, <strong>Revised</strong>, or <strong>Done</strong>. As you update topics, the tracker shows your overall coverage percentage and highlights areas that need attention. The AI Study Planner uses this data to build your daily schedule.',
      },
      {
        q: 'Does the tracker cover Optional subjects?',
        a: 'Yes. The Syllabus Tracker covers Optionals as well. At setup, select your Optional subject and the tracker will map the relevant topics. Coverage for Optional is tracked separately from GS so you can monitor both without them mixing.',
      },
      {
        q: 'Can I reset my syllabus progress?',
        a: 'Yes. You can reset any individual topic or the entire tracker from Settings. If you are starting a revision cycle and want to reset all topics to "Not Started" to track your second pass, you can do that with one action. Your previous data is not permanently lost until you confirm the reset.',
      },
    ],
  },
  {
    id: 'cat-videos',
    icon: '🎬',
    title: 'Video Lectures',
    iconBg: 'rgba(220,60,60,0.1)',
    questions: [
      {
        q: 'What subjects and topics do the video lectures cover?',
        a: 'The video library covers the full UPSC GS syllabus across all four papers — History, Geography, Polity, Economy, Environment, Science and Technology, Ethics, and Current Affairs analysis. Videos are tagged by GS paper and topic so you can find exactly what you need without browsing.',
      },
      {
        q: 'Are video lectures available offline?',
        a: 'Downloaded videos are available offline on the mobile app for Pro and Mentorship Pro users. On the web platform, an internet connection is required to stream. We recommend downloading sessions you plan to watch in low-connectivity areas.',
      },
      {
        q: 'Who makes the video lectures?',
        a: 'Video lectures are created by Abhijeet Soni and a team of subject-matter educators with deep UPSC expertise. Every video is scripted and reviewed before publishing. We do not publish content that has not been quality-checked for UPSC relevance and accuracy.',
      },
    ],
  },
  {
    id: 'cat-material',
    icon: '📚',
    title: 'Study Material',
    iconBg: 'rgba(29,164,92,0.1)',
    questions: [
      {
        q: 'What study material is available on the platform?',
        a: 'The Study Material section includes curated notes across all GS subjects, NCERT summaries mapped to the UPSC syllabus, PYQ analysis documents, model answer compilations, and current affairs monthly archives. Material is updated regularly and is available in a readable format on both web and mobile.',
      },
      {
        q: 'Is all study material free or only some of it?',
        a: 'Core GS notes and NCERT summaries are available on the free plan. The full library — including model answers, monthly current affairs archives, and in-depth topic notes — is available on Pro Aspirant and Mentorship Pro plans.',
      },
      {
        q: 'Can I download study material as a PDF?',
        a: 'Yes. Material marked as downloadable can be saved as a PDF for offline reference. On the mobile app, downloaded material is accessible without an internet connection.',
      },
    ],
  },
  {
    id: 'cat-ca',
    icon: '🌐',
    title: 'Current Affairs',
    iconBg: 'rgba(20,184,166,0.12)',
    questions: [
      {
        q: 'How is RiseWithJeet\'s current affairs different from just reading newspapers?',
        a: 'Every item in our current affairs digest is manually tagged with the GS subject it maps to, whether it is Prelims-relevant, Mains-relevant, or both, and its question probability. This means you never read irrelevant news or have to figure out what is UPSC-worthy on your own. The digest is updated by <strong>7 AM every morning</strong>.',
      },
      {
        q: 'How far back does the current affairs archive go?',
        a: 'The current affairs archive is available from February 2025 onwards, when the platform launched. Pro users have full access to the complete archive. Free users can access the current week\'s digest.',
      },
      {
        q: 'How do I add a current affairs item to my study list?',
        a: 'Every article in the digest has a <strong>+ Study list</strong> button. Clicking it saves the item to your personal study list, which you can review later from the Study Material section. This helps you build a tagged collection of the most important stories without relying on separate notes.',
      },
      {
        q: 'Can I filter current affairs by subject or relevance?',
        a: 'Yes. The current affairs section has filter pills for GS subject, relevance type (Prelims or Mains), and time period. You can also search by keyword. This lets you quickly pull all Economy-related stories from the past month, for example, while preparing a specific topic.',
      },
    ],
  },
  {
    id: 'cat-tests',
    icon: '📝',
    title: 'Test Series',
    iconBg: 'rgba(232,184,75,0.12)',
    questions: [
      {
        q: 'What does the Test Series include?',
        a: 'The Test Series includes full-length Prelims simulations (100 questions, UPSC pattern, 2-hour timer), CSAT tests, and subject-specific sectional tests. Each test is followed by a detailed performance analysis including time spent per question, accuracy by subject, and comparison with other aspirants on the platform.',
      },
      {
        q: 'How often are new tests added?',
        a: 'New tests are added regularly throughout the year, with a higher frequency in the months leading up to the Prelims exam. The schedule is visible in the Test Series section and you will also receive notifications when new tests go live.',
      },
      {
        q: 'Can I retake a test?',
        a: 'Yes. You can retake any test as many times as you like. Each attempt is recorded separately in your analytics so you can track improvement over time. We recommend waiting at least a week before retaking a test so the questions feel fresh.',
      },
    ],
  },
  {
    id: 'cat-mentorship',
    icon: '🎓',
    title: 'Personal Mentorship',
    iconBg: 'rgba(26,48,96,0.1)',
    questions: [
      {
        q: 'What is included in Mentorship Pro?',
        a: 'Mentorship Pro includes everything in the Pro Aspirant plan plus: weekly 1-on-1 video sessions with an assigned mentor, a personalised Jeet Path roadmap built around your exam date and weak areas, priority answer review with mentor feedback, an interview preparation module, and direct access to your mentor between sessions.',
      },
      {
        q: 'Who are the mentors?',
        a: 'All mentors on RiseWithJeet are either educators with deep, specialised UPSC domain experience or aspirants with strong exam performance who have gone through the process seriously. Each mentor is vetted before being assigned. If you feel the match is not right for you, you can request a change at any time.',
      },
      {
        q: 'How do I reschedule a mentorship session?',
        a: 'To reschedule, please notify us at least <strong>24 hours before</strong> your scheduled session through the platform or by emailing <a href="mailto:support@risewithjeet.in" class="text-[#E8B84B] underline underline-offset-2">support@risewithjeet.in</a>. Sessions missed without prior notice are considered used and cannot be carried forward.',
      },
      {
        q: 'What is the Jeet Path roadmap?',
        a: 'The Jeet Path roadmap is a personalised preparation plan built by your mentor specifically for you, based on your exam date, current syllabus coverage, weak areas, and study hours. Unlike the AI-generated daily planner, the Jeet Path is a strategic document that gives you a weeks-level overview of exactly what to study, in what order, and why. It is updated at regular intervals as your progress evolves.',
      },
    ],
  },
  {
    id: 'cat-mcq',
    icon: '✏️',
    title: 'Daily MCQ',
    iconBg: 'rgba(232,184,75,0.12)',
    questions: [
      {
        q: 'How are daily MCQs selected for me?',
        a: 'On the free plan, you get a curated set of 10 questions per day drawn from the 10,000+ question library, spread across subjects. On the Pro plan, the selection is <strong>adaptive</strong> — the system analyses your past performance and surfaces more questions from your weak sub-topics while maintaining coverage across the syllabus.',
      },
      {
        q: 'Can I filter MCQs by subject or difficulty?',
        a: 'Yes. From the Daily MCQ section, you can filter by subject (History, Polity, Geography, Economy, Environment, Science and Technology, Ethics), difficulty level, and source type (PYQ, new, or curated). Subject filter pills are shown at the top of the practice screen for quick switching.',
      },
      {
        q: 'What happens if I run out of daily MCQs?',
        a: 'On the Pro plan, there is no limit — you can attempt as many questions as you like in a day. On the free plan, you have 10 MCQs per day. Once you complete them, they reset the next morning. If you want to practice more, you can upgrade or wait for the daily reset.',
      },
    ],
  },
  {
    id: 'cat-answerwriting',
    icon: '✍️',
    title: 'Daily Answer Writing',
    iconBg: 'rgba(29,164,92,0.1)',
    questions: [
      {
        q: 'How does the AI answer evaluation work?',
        a: 'You submit a typed or handwritten answer (via photo upload). The AI evaluates it across <strong>8 parameters</strong>: content accuracy, structure and flow, introduction quality, conclusion quality, depth of analysis, use of examples and data, language clarity, and question relevance. You receive a score out of 10 along with specific, actionable feedback. The entire process takes under 60 seconds.',
      },
      {
        q: 'How accurate is the AI evaluation compared to a human examiner?',
        a: 'Our AI is trained on a large library of UPSC answer scripts with scores, designed in consultation with educators who understand UPSC marking patterns in depth. It is a strong tool for identifying structural and content gaps. That said, treat it as a high-quality feedback tool, not a substitute for the final examiner. Use it to build consistent improvement over time rather than to obsess over any single score.',
      },
      {
        q: 'Can I upload a photo of a handwritten answer?',
        a: 'Yes. In the Answer Writing section, tap the camera icon to photograph your handwritten answer directly from the mobile app. On web, you can upload an image file. The AI processes the image and evaluates the content within seconds. Make sure the photo is well-lit and the handwriting is legible for best results.',
      },
      {
        q: 'Are model answers available for reference?',
        a: 'Yes. After each evaluation, you can access a model answer for the same question to compare structure, arguments, and examples. The model answer library is also available separately in the Study Material section for Pro users.',
      },
    ],
  },
  {
    id: 'cat-mock',
    icon: '🎯',
    title: 'Mock Tests',
    iconBg: 'rgba(220,60,60,0.1)',
    questions: [
      {
        q: 'How is a mock test different from daily MCQ practice?',
        a: 'Mock tests simulate the actual UPSC Prelims exam environment — timed (2 hours), 100 questions, negative marking, and randomised question order. Daily MCQ practice is adaptive and subject-specific. Mock tests are designed to build exam temperament, time management, and test-taking strategy, while daily MCQs are designed for daily concept reinforcement and weak area targeting.',
      },
      {
        q: 'Is there negative marking in mock tests?',
        a: 'Yes. Mock tests use UPSC\'s standard negative marking scheme: <strong>1/3 mark is deducted</strong> for every wrong answer. Questions left unattempted carry no negative marking. This mirrors the actual exam so your score reflects your realistic exam-day performance.',
      },
      {
        q: 'Can I review my answers after a mock test?',
        a: 'Yes. After submitting a mock test, you get a full performance analysis including your score, time spent per question, accuracy by subject, questions you got wrong with correct answers and explanations, and your percentile ranking among all aspirants who took the same test on the platform.',
      },
    ],
  },
  {
    id: 'cat-pyq',
    icon: '🗂️',
    title: 'Previous Year Questions',
    iconBg: 'rgba(20,184,166,0.12)',
    questions: [
      {
        q: 'How many PYQs are available on the platform?',
        a: 'The PYQ bank covers over 3,200 questions from UPSC Prelims across the last 30 years, along with Mains questions tagged by paper and year. Each question is accompanied by a detailed explanation and is tagged to the relevant syllabus topic so you can see which themes UPSC returns to repeatedly.',
      },
      {
        q: 'How should I use PYQs in my preparation?',
        a: 'PYQs are most effective when used in two ways: first, early in preparation to understand what UPSC actually tests (as opposed to what textbooks cover), and second, in the final revision phase to identify patterns and check your readiness. In the PYQ section, you can filter by year, subject, and difficulty to build targeted practice sessions.',
      },
      {
        q: 'Are Mains PYQs also available?',
        a: 'Yes. The PYQ bank includes both Prelims and Mains questions. Mains PYQs are tagged by GS paper (I, II, III, IV) and year, and are accompanied by key points that a strong answer should address. They are particularly useful for practising question analysis and structuring answers during your Daily Answer Writing sessions.',
      },
    ],
  },
  {
    id: 'cat-analytics',
    icon: '📈',
    title: 'Performance Analytics',
    iconBg: 'rgba(8,145,178,0.12)',
    questions: [
      {
        q: 'What does the Performance Analytics section show?',
        a: 'Performance Analytics gives you a subject-wise accuracy breakdown, your score trend across the last 14 tests, your UPSC Readiness Score (updated daily), total study hours, MCQs attempted, and your platform rank. It also identifies your specific weak sub-topics so you know exactly where to focus next, not just which broad subject needs work.',
      },
      {
        q: 'What is the UPSC Readiness Score?',
        a: 'The Readiness Score is a composite metric calculated daily from your MCQ accuracy, test performance, syllabus coverage, and answer writing consistency. It gives you a single number to track your overall progress. A score above 70 generally indicates solid Prelims readiness. The score updates every morning based on the previous day\'s activity.',
      },
      {
        q: 'How is Test Analytics different from Performance Analytics?',
        a: 'Performance Analytics is your overall platform-wide dashboard, covering everything you have done across all modules. Test Analytics is specifically for your mock test and test series performance, with detailed question-level breakdowns, time analysis per question, and test-specific percentile rankings. Both are available from the Analytics section in the sidebar.',
      },
    ],
  },
  {
    id: 'cat-revision',
    icon: '🔁',
    title: 'Revision Tools',
    iconBg: 'rgba(29,164,92,0.1)',
    questions: [
      {
        q: 'How do Flashcards work on RiseWithJeet?',
        a: 'The Flashcard library has 5,000+ pre-built cards covering key facts, definitions, constitutional articles, important dates, and static GS content. You rate each card as Hard, Okay, or Easy after reviewing it. The spaced repetition engine uses your ratings to decide when to show each card again — cards you find hard come back sooner, cards you find easy are spaced further out. This maximises retention with the minimum time investment.',
      },
      {
        q: 'What are Mind Maps and how do I use them?',
        a: 'Mind Maps are visual concept diagrams that show how topics, sub-topics, and related ideas connect to each other across the GS syllabus. They are especially useful during revision to see the big picture of a subject before drilling into details. You can browse the mind map library by subject or access a mind map directly from any topic in the Syllabus Tracker.',
      },
      {
        q: 'Can I create my own flashcards?',
        a: 'Yes. In addition to the pre-built library, you can create custom flashcards from any content on the platform. When reading study material or current affairs, highlight a key fact and save it as a flashcard with one tap. Custom cards are stored in your personal deck and participate in the same spaced repetition schedule as the pre-built ones.',
      },
    ],
  },
];

// ── COMPONENTS ────────────────────────────────────────────────────────────────

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`border rounded-xl mb-2 overflow-hidden transition-all duration-200 cursor-pointer ${
        open
          ? 'border-[rgba(232,184,75,0.4)] shadow-[0_2px_14px_rgba(232,184,75,0.08)]'
          : 'border-[rgba(28,46,69,0.12)] hover:border-[rgba(28,46,69,0.22)]'
      } bg-white`}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-start justify-between gap-4 px-5 py-4">
        <span
          className={`text-sm font-medium leading-relaxed flex-1 ${
            open ? 'text-[#1C2E45] font-semibold' : 'text-[#374560]'
          }`}
        >
          {question}
        </span>
        <span
          className={`flex-shrink-0 w-6 h-6 rounded-md border flex items-center justify-center text-xs transition-all duration-200 mt-0.5 ${
            open
              ? 'bg-[rgba(232,184,75,0.15)] border-[rgba(232,184,75,0.4)] text-[#C99730] rotate-180'
              : 'bg-[#faf8f4] border-[rgba(28,46,69,0.12)] text-[#6b7a99]'
          }`}
        >
          ▾
        </span>
      </div>
      {open && (
        <div className="px-5 pb-4">
          <p
            className="text-sm text-[#374560] leading-7"
            dangerouslySetInnerHTML={{ __html: answer }}
          />
        </div>
      )}
    </div>
  );
}

interface FaqCategory {
  id: string;
  icon: string;
  title: string;
  iconBg: string;
  questions: { q: string; a: string }[];
}

function FAQSection({
  category,
}: {
  category: FaqCategory;
}) {
  return (
    <div id={category.id} className="mb-12 scroll-mt-24">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[rgba(28,46,69,0.1)]">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: category.iconBg }}
        >
          {category.icon}
        </div>
        <h2 className="font-lora font-semibold text-[#1C2E45] text-xl">
          {category.title}
        </h2>
        <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full bg-[#faf8f4] text-[#6b7a99] border border-[rgba(28,46,69,0.1)]">
          {category.questions.length} questions
        </span>
      </div>
      {category.questions.map((item, i) => (
        <FAQItem key={i} question={item.q} answer={item.a} />
      ))}
    </div>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function FAQPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('cat-general');
  const [apiCategories, setApiCategories] = useState<FaqCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    faqService.getPublicFaqs()
      .then((res) => {
        const grouped = res.data || {};
        const mapped: FaqCategory[] = Object.entries(grouped).map(([category, questions]: [string, any]) => {
          const meta = getCategoryMeta(category);
          const id = 'cat-' + category.toLowerCase().replace(/\s+/g, '-');
          return {
            id,
            icon: meta.icon,
            title: category,
            iconBg: meta.iconBg,
            questions: (questions as any[]).map((q: any) => ({ q: q.question, a: q.answer })),
          };
        });
        setApiCategories(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displayCategories = apiCategories.length > 0 ? apiCategories : FALLBACK_CATEGORIES;

  // Filter categories/questions by search
  const filtered = search.trim()
    ? displayCategories.map((cat) => ({
        ...cat,
        questions: cat.questions.filter(
          (q) =>
            q.q.toLowerCase().includes(search.toLowerCase()) ||
            q.a.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter((cat) => cat.questions.length > 0)
    : displayCategories;

  const totalFiltered = filtered.reduce((sum, c) => sum + c.questions.length, 0);

  // Update active TOC item on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.id);
            break;
          }
        }
      },
      { threshold: 0.25, rootMargin: '-80px 0px -60% 0px' }
    );
    const sections = document.querySelectorAll('[data-faq-section]');
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [filtered]);

  // Set first category active once loaded
  useEffect(() => {
    if (displayCategories.length > 0 && activeCategory === 'cat-general') {
      setActiveCategory(displayCategories[0].id);
    }
  }, [displayCategories]);

  function jumpTo(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="min-h-screen bg-[#faf8f4]">
      <Header />

      {/* ── HERO ── */}
      <section className="pt-28 pb-12 px-6 bg-[#090e1c] border-b border-[rgba(255,255,255,0.06)]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(232,184,75,0.12)] border border-[rgba(232,184,75,0.25)] mb-5">
            <span className="text-[#E8B84B] text-xs font-semibold tracking-wide uppercase">FAQ</span>
          </div>
          <h1 className="font-lora font-semibold text-white text-4xl md:text-5xl mb-4 leading-tight">
            We have got answers
          </h1>
          <p className="text-[#9aa3b8] text-base mb-8">
            Everything you need to know about RiseWithJeet — from how the AI works to billing details.
          </p>
          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7a99] text-base pointer-events-none">
              🔍
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions, e.g. flashcards, mock tests..."
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] text-white placeholder-[#6b7a99] text-sm focus:outline-none focus:border-[rgba(232,184,75,0.4)] transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b7a99] hover:text-white transition-colors text-sm"
              >
                ✕
              </button>
            )}
          </div>
          {search && (
            <p className="mt-3 text-[#6b7a99] text-sm">
              {totalFiltered > 0
                ? `${totalFiltered} result${totalFiltered !== 1 ? 's' : ''} for "${search}"`
                : `No results for "${search}"`}
            </p>
          )}
        </div>
      </section>

      {/* ── BODY ── */}
      <div className="max-w-5xl mx-auto px-6 py-12 flex gap-10 items-start">

        {/* Sticky TOC Sidebar */}
        {!search && (
          <aside className="hidden lg:block w-52 flex-shrink-0 sticky top-24 self-start">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9aa3b8] mb-3 px-2">
              Modules
            </p>
            <nav className="flex flex-col gap-0.5">
              {displayCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => jumpTo(cat.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-all duration-150 ${
                    activeCategory === cat.id
                      ? 'bg-[rgba(232,184,75,0.12)] text-[#1C2E45] font-semibold'
                      : 'text-[#374560] hover:bg-[rgba(28,46,69,0.05)]'
                  }`}
                >
                  <span className="text-base w-5 text-center">{cat.icon}</span>
                  <span>{cat.title}</span>
                </button>
              ))}
            </nav>
            <div className="mt-5 p-3.5 rounded-xl bg-white border border-[rgba(28,46,69,0.1)]">
              <p className="text-xs font-semibold text-[#374560] mb-1">Still stuck?</p>
              <a
                href="mailto:support@risewithjeet.in"
                className="text-xs text-[#E8B84B] hover:underline"
              >
                support@risewithjeet.in
              </a>
            </div>
          </aside>
        )}

        {/* FAQ Content */}
        <div className="flex-1 min-w-0" ref={mainRef}>
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-[#374560] font-medium mb-1">No questions matched</p>
              <p className="text-sm text-[#6b7a99]">
                Try different keywords or{' '}
                <a href="mailto:support@risewithjeet.in" className="text-[#E8B84B] underline underline-offset-2">
                  write to us directly
                </a>
                .
              </p>
            </div>
          ) : (
            filtered.map((cat) => (
              <div key={cat.id} id={cat.id} data-faq-section>
                <FAQSection category={cat} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── CTA ── */}
      <section className="bg-[#090e1c] border-t border-[rgba(255,255,255,0.06)] py-16 px-6 text-center">
        <h2 className="font-lora font-semibold text-white text-3xl mb-3">
          Still have a question?<br />
          <em className="text-[#E8B84B] not-italic">We are here to help.</em>
        </h2>
        <p className="text-[#6b7a99] text-sm mb-8">
          Our support team reads every message. No bots, no auto-replies.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="mailto:support@risewithjeet.in"
            className="px-6 py-3 rounded-xl bg-[#E8B84B] text-[#090e1c] font-semibold text-sm hover:bg-[#f5ce72] transition-colors"
          >
            Email support@risewithjeet.in
          </a>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl border border-[rgba(255,255,255,0.12)] text-white font-semibold text-sm hover:border-[rgba(255,255,255,0.25)] transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
