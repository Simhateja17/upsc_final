'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '@/components/Footer';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  id: string;
  title: string;
  icon: string;
  iconBg: string;
  items: FAQItem[];
}

const faqData: FAQSection[] = [
  {
    id: 'cat-general',
    title: 'General',
    icon: '/sidebar-overview.png',
    iconBg: 'rgba(232,184,75,0.12)',
    items: [
      {
        question: 'What is RiseWithJeet and who is it for?',
        answer: '<p>RiseWithJeet is an AI-powered UPSC preparation platform built for aspirants at every stage, whether you\'re in your first year or approaching your final attempt. It was started by <strong>Abhijeet Soni</strong>, an IIT Kharagpur alumnus and AI professional, who wanted to make high-quality, structured UPSC preparation accessible to every aspirant in India regardless of location or financial background.</p>',
      },
      {
        question: 'Is there a free plan?',
        answer: '<p>Yes. The <strong>Aspire plan is completely free</strong> and includes Daily MCQ practice, Daily Answer Writing, Daily Current affairs, Jeet AI conversations. You can use these features for as long as you like at no cost. Paid plans unlock the full platform including AI evaluation, mock tests, mentorship, and the complete revision suite.</p>',
      },
      {
        question: 'Is there a mobile app?',
        answer: '<p>Yes. RiseWithJeet has a full-featured app for Android and iOS. Flashcards work offline, and you can photograph handwritten answers directly from the app to submit for AI evaluation.</p>',
      },
      {
        question: 'Does the platform work on slow internet?',
        answer: '<p>Yes, we specifically built RiseWithJeet to work well on low-bandwidth connections, because many of our users are in towns and cities where internet speeds are variable. The app also supports offline access for flashcards and downloaded study materials.</p>',
      },
    ],
  },
  {
    id: 'cat-planner',
    title: 'Study Planner',
    icon: '/sidebar-study-planner.png',
    iconBg: 'rgba(8,145,178,0.1)',
    items: [
      {
        question: 'How should I use the Study Planner if I am preparing for UPSC full-time?',
        answer: '<p>Start by creating a realistic daily schedule instead of an ideal one. Divide your day into GS, Current Affairs, Revision, Answer Writing, and Optional. Focus on consistency over overload. A sustainable 8\u201310 productive hours is better than an unrealistic 14-hour timetable that breaks in 3 days.</p>',
      },
      {
        question: 'Can beginners use this planner?',
        answer: '<p>Yes. The planner is designed for both beginners and experienced aspirants. If you are starting out, begin with 2\u20133 focused study blocks per day, track syllabus coverage, and gradually increase intensity as your preparation stabilizes.</p>',
      },
      {
        question: 'How much time should I dedicate to revision?',
        answer: '<p>A good thumb rule is:</p><p>70% learning + 30% revision during foundation stage, and<br/>50% learning + 50% revision closer to Prelims/Mains.</p><p>Without revision, even strong preparation fades quickly.</p>',
      },
      {
        question: 'Can I plan Optional Subject preparation here?',
        answer: '<p>Absolutely. Add dedicated blocks for your Optional every day or alternate days. UPSC toppers often recommend 2\u20133 hours of Optional preparation daily, especially during Mains-focused preparation.</p>',
      },
    ],
  },
  {
    id: 'cat-jeetai',
    title: 'Jeet AI',
    icon: '/sidebar-jeet-gpt.png',
    iconBg: 'rgba(8,145,178,0.1)',
    items: [
      {
        question: 'What is Jeet AI and what can I use it for?',
        answer: '<p>Jeet AI is your personal UPSC AI assistant. You can ask it anything related to your preparation:</p><ul><li>Explain a concept from any GS paper</li><li>Help structure a Mains answer step by step</li><li>Summarise a current affairs topic and tag it to the syllabus</li><li>Suggest relevant examples or case studies for a theme</li><li>Review your preparation strategy and flag gaps</li></ul><p>It responds instantly and is trained on UPSC-specific content, not generic AI.</p>',
      },
      {
        question: 'Is Jeet AI available 24 hours a day?',
        answer: '<p>Yes. Jeet AI is available at any time of the day. There is no waiting, no scheduling, and no dependency on a human being available. Ask it at midnight before an exam if you need to.</p>',
      },
      {
        question: 'Can Jeet AI evaluate my answers?',
        answer: '<p>Jeet AI can give you quick feedback and structure suggestions in a conversational way. For detailed, scored evaluation across 8 parameters with examiner-level feedback, use the dedicated <strong>Daily Answer Writing</strong> module, which is specifically designed and trained for that purpose.</p>',
      },
      {
        question: 'Is Jeet AI accurate for UPSC content?',
        answer: '<p>Jeet AI is trained on UPSC-specific material including the full syllabus, PYQs, standard reference texts, and current affairs. That said, like all AI, it can occasionally be incomplete or imperfect on very specific factual queries. Always cross-check critical facts with source material before writing them in an exam answer.</p>',
      },
    ],
  },
  {
    id: 'cat-syllabus',
    title: 'Syllabus Tracker',
    icon: '/sidebar-syllabus-new.png',
    iconBg: 'rgba(26,48,96,0.08)',
    items: [
      {
        question: 'How do I use the Syllabus Tracker?',
        answer: '<p>The Syllabus Tracker maps the full UPSC syllabus, GS I, II, III, IV, and Optional, into individual topics. For each topic, you can mark your status as <strong>Not Started</strong>, <strong>Reading</strong>, <strong>Revised</strong>, or <strong>Done</strong>. As you update topics, the tracker shows your overall coverage percentage and highlights areas that need attention.</p>',
      },
      {
        question: 'Does the tracker cover Optional subjects?',
        answer: '<p>Yes. The Syllabus Tracker covers Optionals as well. At setup, select your Optional subject and the tracker will map the relevant topics. Coverage for Optional is tracked separately from GS so you can monitor both without them mixing.</p>',
      },
      {
        question: 'When should I mark a topic as "Done"?',
        answer: '<p>Mark a topic as completed only when you have:</p><ul><li>\u2705 Covered core concepts</li><li>\u2705 Made/revised notes</li><li>\u2705 Solved PYQs or MCQs (if relevant)</li><li>\u2705 Revised at least once</li></ul><p>Completion should mean exam readiness, not just watching lectures.</p>',
      },
      {
        question: 'What if I forget topics after marking them complete?',
        answer: '<p>That is normal in UPSC preparation. The tracker is not a memory test, it is a revision system. If recall weakens, move the topic back to Active or Revision Mode instead of feeling guilty.</p>',
      },
      {
        question: 'What is the biggest mistake aspirants make with syllabus tracking?',
        answer: '<p>Confusing content consumption with preparation.</p><p>Watching lectures \u2260 completion.<br/>Reading once \u2260 retention.</p><p>A topic is prepared only when it can be recalled, revised, and applied in questions.</p>',
      },
    ],
  },
  {
    id: 'cat-material',
    title: 'Study Material',
    icon: '/sidebar-study-material-new2.png',
    iconBg: 'rgba(29,164,92,0.1)',
    items: [
      {
        question: 'What study material is available on the platform?',
        answer: '<p>The Study Material section includes curated notes across all GS subjects, NCERT summaries mapped to the UPSC syllabus, PYQ analysis documents, model answer compilations, and current affairs monthly archives. Material is updated regularly and is available in a readable format on both web and mobile.</p>',
      },
      {
        question: 'Will lecture PDFs from YouTube classes be available here?',
        answer: '<p>Yes. All major lecture PDFs, notes, and supporting material from our YouTube sessions will be uploaded here free of cost, so you can revisit concepts anytime. This creates a single, organized learning space for aspirants.</p>',
      },
      {
        question: 'Why can\'t I download the PDFs?',
        answer: '<p>We understand this question comes up often. A lot of research, curation, simplification, and effort goes into creating these materials. To protect the work from misuse, unauthorized circulation, and piracy, PDFs are currently view-only within the platform. This helps us continue improving and updating the resources for serious aspirants.</p>',
      },
      {
        question: 'Can I request material on a topic?',
        answer: '<p>Absolutely. If many aspirants are struggling with a topic, we may prioritize - Notes, Simplified explainers, Roadmaps, PYQ breakdowns. Community feedback helps shape future content.</p>',
      },
      {
        question: 'Why do some subjects show "Coming Soon"?',
        answer: '<p>We are building this carefully. Instead of uploading rushed material, we prefer releasing well-structured, useful resources that genuinely improve preparation quality.</p>',
      },
    ],
  },
  {
    id: 'cat-ca',
    title: 'Current Affairs',
    icon: '/sidebar-current-affairs.png',
    iconBg: 'rgba(8,145,178,0.1)',
    items: [
      {
        question: 'How is RiseWithJeet\'s current affairs different from just reading newspapers?',
        answer: '<p>Every item in our current affairs digest is manually tagged with the GS subject it maps to, whether it is Prelims-relevant, Mains-relevant, or both, and its question probability. This means you never read irrelevant news or have to figure out what is UPSC-worthy on your own. The digest is updated by <strong>8 AM every morning</strong>.</p>',
      },
      {
        question: 'How should I use the Daily News module for UPSC preparation?',
        answer: '<p>The ideal approach: Read \u2192 Understand \u2192 Connect \u2192 Revise</p><ul><li>Read the news summary</li><li>Understand the issue and background</li><li>See its UPSC syllabus relevance</li><li>Practice MCQs or potential Mains questions</li><li>Save important notes for revision</li></ul><p>The goal is not just reading news - it is learning how UPSC sees the news.</p>',
      },
      {
        question: 'What is "Jeet AI Summary" and how should I use it?',
        answer: '<p>Jeet AI Summary breaks complex editorials into UPSC-ready understanding. It provides Key arguments, UPSC relevance, Important concepts, Potential exam questions based on PYQ & trend analysis and Critical analysis. Think of it as editorial decoding for aspirants.</p>',
      },
    ],
  },
  {
    id: 'cat-mcq',
    title: 'Daily MCQ Challenge',
    icon: '/target-icon.png',
    iconBg: 'rgba(232,184,75,0.12)',
    items: [
      {
        question: 'What is the Daily MCQ Challenge?',
        answer: '<p>The Daily MCQ Challenge is a focused UPSC practice session designed to strengthen your Prelims mindset through consistent question-solving. Every challenge includes: UPSC-style MCQs, Mixed subjects, Time pressure simulation, Performance tracking, Explanation-based learning. These small daily practices help aspirants build daily discipline, sharper thinking, and stronger Prelims instincts.</p>',
      },
      {
        question: 'Why only 10 questions a day?',
        answer: '<p>Consistency matters more than overload. The goal is to build a daily habit of active recall and elimination thinking without overwhelming aspirants. Even 10 high-quality questions daily = 3,650+ questions a year.</p>',
      },
      {
        question: 'Are explanations provided for answers?',
        answer: '<p>Yes. The most important learning comes from understanding why an answer is correct and why others are wrong. Reading explanations often teaches more than solving the question itself.</p>',
      },
    ],
  },
  {
    id: 'cat-answerwriting',
    title: 'Daily Answer Writing',
    icon: '/sidebar-daily-answer-new.png',
    iconBg: 'rgba(29,164,92,0.1)',
    items: [
      {
        question: 'What is the Daily Mains Challenge?',
        answer: '<p>The Daily Mains Challenge helps you build the most important skill in UPSC Mains - answer writing. Every day, you get: One UPSC-style question, Time-bound writing practice, Structured evaluation, Detailed feedback, Improvement suggestions, Model-answer direction.</p><p>The goal is steady improvement through consistency and to make answer writing less intimidating.</p>',
      },
      {
        question: 'How does the AI answer evaluation work?',
        answer: '<p>You submit a typed or handwritten answer (via photo upload). The AI evaluates it across <strong>8 parameters</strong>: content accuracy, structure and flow, introduction quality, conclusion quality, depth of analysis, use of examples and data, language clarity, and question relevance. You receive a score out of 10 along with specific, actionable feedback. The entire process takes under 60 seconds.</p>',
      },
      {
        question: 'How accurate is the AI evaluation compared to a human examiner?',
        answer: '<p>Our AI is trained on a large library of UPSC answer scripts with scores, designed in consultation with educators who understand UPSC marking patterns in depth. It is a strong tool for identifying structural and content gaps. That said, treat it as a high-quality feedback tool, not a substitute for the final examiner. Use it to build consistent improvement over time rather than to obsess over any single score.</p>',
      },
      {
        question: 'Can I upload a photo of a handwritten answer?',
        answer: '<p>Yes. In the Answer Writing section, tap the camera icon to photograph your handwritten answer directly from the mobile app. On web, you can upload an image file. The AI processes the image and evaluates the content within seconds. Make sure the photo is well-lit and the handwriting is legible for best results.</p>',
      },
      {
        question: 'Why only one question a day?',
        answer: '<p>Because consistency beats overload. Writing one good answer daily for a year = 365 structured answers. Most aspirants delay answer writing waiting to "finish the syllabus." This challenge helps you build the skill gradually alongside preparation.</p>',
      },
      {
        question: 'What does the AI evaluation check?',
        answer: '<p>Jeet AI evaluates answers through an examiner-style lens, including:</p><ul><li>Structure (Intro\u2013Body\u2013Conclusion)</li><li>Demand fulfillment</li><li>Content depth</li><li>Multi-dimensional perspective</li><li>Facts/examples</li><li>Balance & analysis</li><li>Relevance to question</li></ul><p>The aim is actionable feedback, not just a score.</p>',
      },
    ],
  },
  {
    id: 'cat-mock',
    title: 'Mock Tests',
    icon: '/sidebar-mock-tests-new.png',
    iconBg: 'rgba(220,60,60,0.1)',
    items: [
      {
        question: 'What is the Mock Test Platform?',
        answer: '<p>The Mock Test Platform helps you practice UPSC in a real exam-like environment. You can:</p><ul><li>Create customized tests</li><li>Practice subject-wise MCQs</li><li>Attempt PYQ-based tests</li><li>Simulate full Prelims papers</li><li>Improve speed, accuracy, and elimination skills</li></ul><p>The goal is not just testing knowledge - it is building exam temperament.</p>',
      },
      {
        question: 'Is there negative marking in mock tests?',
        answer: '<p>Yes. Mock tests use UPSC\'s standard negative marking scheme: <strong>1/3 mark is deducted</strong> for every wrong answer. Questions left unattempted carry no negative marking. This mirrors the actual exam so your score reflects your realistic exam-day performance.</p>',
      },
      {
        question: 'Can I review my answers after a mock test?',
        answer: '<p>Yes. After submitting a mock test, you get a full performance analysis including your score, time spent per question, accuracy by subject, questions you got wrong with correct answers and explanations, and your percentile ranking among all aspirants who took the same test on the platform.</p>',
      },
      {
        question: 'How is this different from Daily MCQ Challenge?',
        answer: '<p>Think of them differently:</p><p><strong>Daily MCQ Challenge</strong> \u2192 Habit building (quick daily practice)<br/><strong>Mock Tests</strong> \u2192 Exam simulation (deep evaluation)</p><p>Daily MCQs build consistency. Mock tests build performance.</p>',
      },
      {
        question: 'Can I customize my mock test?',
        answer: '<p>Yes. You can personalize: Subject, Difficulty level, Number of questions, Question source, Paper type (GS/CSAT). This helps you target weaknesses instead of practicing randomly.</p>',
      },
    ],
  },
  {
    id: 'cat-pyq',
    title: 'Previous Year Questions',
    icon: '/sidebar-pyq-new.png',
    iconBg: 'rgba(8,145,178,0.1)',
    items: [
      {
        question: 'What is the philosophy behind the PYQ Platform?',
        answer: '<p>To help aspirants stop preparing blindly. Because every serious UPSC aspirant should know: UPSC leaves clues in its previous papers. The more deeply you study PYQs, the better you understand: What UPSC values, how it frames questions, and how to navigate during the exam.</p>',
      },
      {
        question: 'How should I use PYQs in my preparation?',
        answer: '<p>PYQs are most effective when used in two ways: first, early in preparation to understand what UPSC actually tests (as opposed to what textbooks cover), and second, in the final revision phase to identify patterns and check your readiness. In the PYQ section, you can filter by year, subject, and difficulty to build targeted practice sessions.</p>',
      },
      {
        question: 'Are Mains PYQs also available?',
        answer: '<p>Yes. The PYQ bank includes both Prelims and Mains questions. Mains PYQs are tagged by GS paper (I, II, III, IV) and year, and are accompanied by key points that a strong answer should address. They are particularly useful for practising question analysis and structuring answers during your Daily Answer Writing sessions.</p>',
      },
    ],
  },
  {
    id: 'cat-analytics',
    title: 'Performance Analytics',
    icon: '/sidebar-performance-new.png',
    iconBg: 'rgba(8,145,178,0.1)',
    items: [
      {
        question: 'What is the Performance Analytics Dashboard?',
        answer: '<p>The Performance Dashboard gives you a clear picture of your UPSC preparation. Instead of guessing "Am I improving?", you can track: Study consistency, Accuracy trends, Subject strengths & weak areas, Mock test performance, Daily challenge activity, Study streaks, Time spent learning. Because UPSC preparation should not feel like guessing. The dashboard helps you: Track better \u2192 Revise smarter \u2192 Improve steadily \u2192 Stay accountable.</p>',
      },
      {
        question: 'Why is analytics important for UPSC preparation?',
        answer: '<p>UPSC preparation often feels uncertain. Many aspirants study for months without knowing: What they are improving in, What they keep forgetting, Which subjects need revision. Analytics converts effort into measurable progress.</p>',
      },
      {
        question: 'How is Test Analytics different from Performance Analytics?',
        answer: '<p>Performance Analytics is your overall platform-wide dashboard, covering everything you have done across all modules. Test Analytics is specifically for your mock test and test series performance, with detailed question-level breakdowns, time analysis per question, and test-specific percentile rankings. Both are available from the Analytics section in the sidebar.</p>',
      },
    ],
  },
  {
    id: 'cat-revision',
    title: 'Revision Tools',
    icon: '/sidebar-flashcards-new.png',
    iconBg: 'rgba(29,164,92,0.1)',
    items: [
      {
        question: 'How do Flashcards work on RiseWithJeet?',
        answer: '<p>The Flashcard library has 500+ pre-built cards covering key facts, definitions, constitutional articles, important dates, and static GS content. You rate each card as Hard, Okay, or Easy after reviewing it. The spaced repetition engine uses your ratings to decide when to show each card again \u2014 cards you find hard come back sooner, cards you find easy are spaced further out. This maximises retention with the minimum time investment.</p>',
      },
      {
        question: 'What are Mind Maps and how do I use them?',
        answer: '<p>Mind Maps are visual concept diagrams that show how topics, sub-topics, and related ideas connect to each other across the GS syllabus. They are especially useful during revision to see the big picture of a subject before drilling into details. You can browse the mind map library by subject or access a mind map directly from any topic in the Syllabus Tracker.</p>',
      },
      {
        question: 'Can I create my own flashcards?',
        answer: '<p>Yes. In addition to the pre-built library, you can create custom flashcards from any content on the platform. When reading study material or current affairs, highlight a key fact and save it as a flashcard with one tap. Custom cards are stored in your personal deck and participate in the same spaced repetition schedule as the pre-built ones.</p>',
      },
    ],
  },
];

export default function FAQContent() {
  const [activeSection, setActiveSection] = useState('cat-general');
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.25 }
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const jumpTo = (id: string) => {
    setActiveSection(id);
    const el = sectionRefs.current[id];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleFAQ = (sectionId: string, index: number) => {
    const key = `${sectionId}-${index}`;
    setOpenItem(openItem === key ? null : key);
  };

  const filteredData = searchQuery.trim()
    ? faqData
        .map((section) => ({
          ...section,
          items: section.items.filter(
            (item) =>
              item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.answer.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((section) => section.items.length > 0)
    : faqData;

  const noResults = searchQuery.trim() && filteredData.length === 0;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
        .faq-page { --navy: #090e1c; --navy-2: #0c1424; --navy-5: #1e3060; --gold: #e8b84b; --gold-2: #f5ce72; --gold-3: #c99730; --gold-dim: rgba(232,184,75,.12); --gold-ln: rgba(232,184,75,.30); --cream: #faf8f4; --t1: #0c1424; --t2: #374560; --t3: #6b7a99; --b1: rgba(11,22,40,.09); --b2: rgba(11,22,40,.17); --serif: 'Cormorant Garamond', Georgia, serif; --sans: 'DM Sans', system-ui, sans-serif; font-family: var(--sans); }
        .faq-hero { min-height: 40vh; position: relative; overflow: hidden; display: flex; flex-direction: column; padding-top: 66px; background: #090e1c; }
        .faq-hero-bg { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px); background-size: 48px 48px; }
        .faq-hero-bg::after { content: ''; position: absolute; left: -128px; top: -128px; width: 500px; height: 500px; background: radial-gradient(circle, rgba(232,184,75,0.08) 0%, transparent 65%); }
        .faq-hero-inner { position: relative; z-index: 2; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 48px 32px; text-align: center; }
        .faq-badge { display: inline-flex; align-items: center; gap: 7px; background: rgba(232,184,75,.10); border: 1px solid rgba(232,184,75,.30); border-radius: 30px; padding: 5px 16px; font-size: 12px; font-weight: 500; color: var(--gold); margin-bottom: 18px; }
        .faq-eyebrow { display: flex; align-items: center; gap: 12px; justify-content: center; margin-bottom: 14px; }
        .faq-ey-line { width: 36px; height: 1px; background: rgba(232,184,75,.30); }
        .faq-ey-txt { font-size: 10px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: rgba(232,184,75,.70); }
        .faq-h1 { font-family: var(--serif); font-size: 60.80px; font-weight: 600; color: #ffffff; line-height: 69.92px; margin-bottom: 14px; }
        .faq-h1 em { font-style: italic; color: var(--gold); font-weight: 400; }
        .faq-hero-sub { font-size: 15px; color: rgba(255,255,255,.44); max-width: 520px; margin: 0 auto 24px; line-height: 1.85; }
        .faq-search-wrap { position: relative; width: 100%; max-width: 480px; margin: 0 auto; }
        .faq-search-input { width: 100%; padding: 13px 18px 13px 42px; border: 1.5px solid rgba(255,255,255,.1); border-radius: 12px; background: rgba(255,255,255,.06); color: #fff; font-size: 14px; font-family: var(--sans); outline: none; transition: all .2s; }
        .faq-search-input::placeholder { color: rgba(255,255,255,.3); }
        .faq-search-input:focus { border-color: rgba(232,184,75,.35); background: rgba(255,255,255,.08); }
        .faq-search-ico { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 16px; pointer-events: none; }
        .faq-body-section { background: #faf8f4; padding: 72px 0; }
        .faq-inner { max-width: 1060px; margin: 0 auto; padding: 0 48px; display: grid; grid-template-columns: 220px 1fr; gap: 56px; align-items: start; }
        .faq-toc { position: sticky; top: 96px; align-self: start; max-height: calc(100vh - 112px); overflow: hidden; }
        .faq-toc-label { font-size: 10px; font-weight: 700; letter-spacing: .13em; text-transform: uppercase; color: var(--t3); margin-bottom: 12px; }
        .faq-toc-item { display: flex; align-items: center; gap: 9px; padding: 7px 10px; border-radius: 7px; font-size: 13px; color: var(--t3); cursor: pointer; transition: all .15s; margin-bottom: 2px; border-left: 2px solid transparent; }
        .faq-toc-item:hover { color: var(--t1); background: #fff; border-left-color: var(--b2); }
        .faq-toc-item.active { color: var(--navy-5); background: #fff; border-left-color: var(--gold); font-weight: 600; }
        .faq-toc-ico { width: 18px; height: 18px; flex-shrink: 0; object-fit: contain; }
        .faq-toc-sep { height: 1px; background: var(--b1); margin: 12px 0; }
        .faq-toc-box { background: #fff; border: 1.5px solid var(--b1); border-radius: 10px; padding: 14px; margin-top: 12px; }
        .faq-toc-box-lbl { font-size: 10px; font-weight: 700; color: var(--t3); text-transform: uppercase; letter-spacing: .08em; margin-bottom: 6px; }
        .faq-toc-box-val { font-size: 13px; color: var(--navy-5); font-weight: 500; }
        .faq-section-block { margin-bottom: 52px; }
        .faq-section-block:last-child { margin-bottom: 0; }
        .faq-section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 2px solid var(--b1); }
        .faq-sec-icon { width: 38px; height: 38px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .faq-sec-icon img { width: 20px; height: 20px; object-fit: contain; }
        .faq-sec-title { font-family: var(--serif); font-size: 1.35rem; font-weight: 600; color: var(--t1); }
        .faq-sec-count { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 20px; background: var(--cream); color: var(--t3); border: 1.5px solid var(--b1); margin-left: auto; flex-shrink: 0; }
        .faq-item { background: #fff; border: 1.5px solid var(--b1); border-radius: 11px; margin-bottom: 8px; overflow: hidden; transition: border-color .2s, box-shadow .2s; }
        .faq-item:hover { border-color: var(--b2); }
        .faq-item.open { border-color: var(--gold-ln); box-shadow: 0 2px 14px rgba(232,184,75,.1); }
        .faq-q { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; padding: 16px 18px; cursor: pointer; user-select: none; }
        .faq-q-text { font-size: 14px; font-weight: 500; color: var(--t1); line-height: 1.5; flex: 1; }
        .faq-item.open .faq-q-text { color: var(--navy-5); font-weight: 600; }
        .faq-chevron { width: 24px; height: 24px; border-radius: 6px; background: var(--cream); border: 1.5px solid var(--b1); display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all .25s; font-size: 10px; color: var(--t3); }
        .faq-item.open .faq-chevron { background: var(--gold-dim); border-color: var(--gold-ln); color: var(--gold-3); transform: rotate(180deg); }
        .faq-a { max-height: 0; overflow: hidden; transition: max-height .3s ease, padding .3s ease; padding: 0 18px; }
        .faq-item.open .faq-a { max-height: 800px; padding: 0 18px 16px; }
        .faq-a-inner { font-size: 14px; color: var(--t2); line-height: 1.85; }
        .faq-a-inner p { margin-bottom: 9px; }
        .faq-a-inner p:last-child { margin-bottom: 0; }
        .faq-a-inner strong { color: var(--t1); font-weight: 600; }
        .faq-a-inner ul { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 6px; margin: 8px 0; }
        .faq-a-inner ul li { display: flex; gap: 9px; font-size: 14px; color: var(--t2); line-height: 1.65; }
        .faq-a-inner ul li::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: var(--gold); flex-shrink: 0; margin-top: 8px; }
        .faq-no-results { text-align: center; padding: 48px 24px; color: var(--t3); }
        .faq-no-results .icon { font-size: 36px; margin-bottom: 12px; }
        .faq-cta-section { background: #faf8f4; padding: 72px 48px 104px; display: flex; flex-direction: column; align-items: center; }
        .faq-cta-box { background: linear-gradient(135deg, #0b1530 0%, #0f2050 100%); border: 1px solid rgba(255,255,255,.07); border-radius: 24px; box-shadow: 0 40px 80px rgba(11,29,58,.24); min-height: 384px; max-width: 700px; width: 100%; padding: 69px 76px 79px; text-align: center; position: relative; overflow: hidden; }
        .faq-cta-box::before { content: ''; position: absolute; left: -80px; top: -80px; width: 320px; height: 320px; border-radius: 160px; background: rgba(232,184,75,.06); }
        .faq-cta-box::after { content: ''; position: absolute; right: -60px; bottom: -60px; width: 250px; height: 250px; border-radius: 125px; background: rgba(46,93,179,.08); }
        .faq-cta-box h2 { font-family: var(--serif); font-size: 50px; font-weight: 700; color: #fff; line-height: 54px; letter-spacing: -1.2px; margin: 0 0 30px; position: relative; z-index: 1; }
        .faq-cta-box h2 em { display: block; font-style: italic; color: var(--gold); font-weight: 700; }
        .faq-cta-box p { font-family: 'Outfit', var(--sans); font-size: 16px; font-weight: 400; color: rgba(255,255,255,.58); max-width: 489px; margin: 0 auto 30px; line-height: 26.4px; position: relative; z-index: 1; }
        .faq-cta-row { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; position: relative; z-index: 1; }
        .faq-btn-gold { min-width: 286px; height: 53px; background: linear-gradient(144deg, #e8b84b 0%, #b8780a 100%); color: #0b1530; padding: 0 24px; border-radius: 12px; font-size: 15.5px; font-weight: 700; cursor: pointer; border: none; font-family: 'Outfit', var(--sans); transition: all .2s; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 8px 14px rgba(232,184,75,.38); }
        .faq-btn-gold:hover { filter: brightness(1.06); transform: translateY(-2px); }
        .faq-btn-outline { min-width: 189px; height: 52px; background: rgba(255,255,255,.06); color: #fff; padding: 0 24px; border-radius: 12px; font-size: 15.5px; font-weight: 600; cursor: pointer; border: 1px solid rgba(255,255,255,.20); font-family: 'Outfit', var(--sans); transition: all .2s; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
        .faq-btn-outline:hover { border-color: rgba(255,255,255,.32); background: rgba(255,255,255,.09); color: #fff; }
        @media(max-width: 860px) {
          .faq-inner { grid-template-columns: 1fr; padding: 0 22px; }
          .faq-toc { display: none; }
          .faq-hero-inner { padding: 32px 22px 28px; }
          .faq-cta-box { min-height: auto; padding: 52px 24px; }
          .faq-cta-box h2 { font-size: 38px; line-height: 42px; letter-spacing: -0.6px; }
          .faq-cta-box p { font-size: 15px; line-height: 24px; }
          .faq-btn-gold, .faq-btn-outline { width: 100%; min-width: 0; }
          .faq-cta-section { padding: 48px 22px; }
        }
      ` }} />

      <div className="faq-page">
        {/* Hero */}
        <section className="faq-hero">
          <div className="faq-hero-bg" />
          <div className="faq-hero-inner">
            <div className="faq-badge"><span>💬</span> Help Center</div>
            <div className="faq-eyebrow">
              <div className="faq-ey-line" />
              <span className="faq-ey-txt">We have got answers</span>
              <div className="faq-ey-line" />
            </div>
            <h1 className="faq-h1">Frequently Asked <em>Questions</em></h1>
            <p className="faq-hero-sub">Everything you need to know about every module. Can&apos;t find what you&apos;re looking for? Write to us directly.</p>
            <div className="faq-search-wrap">
              <input
                type="text"
                className="faq-search-input"
                placeholder="Search questions, e.g. flashcards, mock tests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="faq-search-ico">🔍</span>
            </div>
          </div>
        </section>

        {/* Body */}
        <section className="faq-body-section">
          <div className="faq-inner">
            {/* Sidebar TOC */}
            <aside className="faq-toc">
              <div className="faq-toc-label">Modules</div>
              {faqData.map((section) => (
                <div
                  key={section.id}
                  className={`faq-toc-item ${activeSection === section.id ? 'active' : ''}`}
                  onClick={() => jumpTo(section.id)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={section.icon} alt={section.title} className="faq-toc-ico" />
                  {section.title}
                </div>
              ))}
              <div className="faq-toc-sep" />
              <div className="faq-toc-box">
                <div className="faq-toc-box-lbl">Still stuck?</div>
                <div className="faq-toc-box-val">together@risewithjeet.com</div>
              </div>
            </aside>

            {/* FAQ Main */}
            <div>
              {noResults && (
                <div className="faq-no-results">
                  <div className="icon">🔍</div>
                  <p>No questions matched &ldquo;<strong>{searchQuery}</strong>&rdquo;</p>
                  <p style={{ marginTop: 6, fontSize: 13 }}>
                    Try different keywords or <a href="mailto:together@risewithjeet.com">write to us directly</a>.
                  </p>
                </div>
              )}

              {filteredData.map((section) => (
                <div
                  key={section.id}
                  id={section.id}
                  className="faq-section-block"
                  ref={(el) => { sectionRefs.current[section.id] = el; }}
                >
                  <div className="faq-section-header">
                    <div className="faq-sec-icon" style={{ background: section.iconBg }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={section.icon} alt={section.title} />
                    </div>
                    <div className="faq-sec-title">{section.title}</div>
                    <div className="faq-sec-count">{section.items.length} questions</div>
                  </div>

                  {section.items.map((item, idx) => {
                    const key = `${section.id}-${idx}`;
                    const isOpen = openItem === key;
                    return (
                      <div key={idx} className={`faq-item ${isOpen ? 'open' : ''}`}>
                        <div className="faq-q" onClick={() => toggleFAQ(section.id, idx)}>
                          <span className="faq-q-text">{item.question}</span>
                          <span className="faq-chevron">▾</span>
                        </div>
                        <div className="faq-a">
                          <div className="faq-a-inner" dangerouslySetInnerHTML={{ __html: item.answer }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA - smaller box with white background */}
        <section className="faq-cta-section">
          <div className="faq-cta-box">
            <h2>Still have a question?<em>We are here to help</em></h2>
            <p>Our support team reads every message. No bots, no auto-replies.</p>
            <div className="faq-cta-row">
              <a href="mailto:together@risewithjeet.com" className="faq-btn-gold">Email: together@risewithjeet.com</a>
              <Link href="/contact" className="faq-btn-outline">Contact Us</Link>
            </div>
          </div>
        </section>

        {/* Footer from landing page */}
        <Footer />
      </div>
    </>
  );
}
