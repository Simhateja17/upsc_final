'use client';

import React, { useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const subjects = [
  { name: 'Indian Polity', emoji: '\uD83C\uDFDB\uFE0F', pdfs: 23, tag: 'UPDATED', tagColor: '#155DFC' },
  { name: 'History', emoji: '\uD83D\uDCDC', pdfs: 18, tag: 'LIVE', tagColor: '#16A34A' },
  { name: 'Geography', emoji: '\uD83C\uDF0D', pdfs: 15, tag: 'LIVE', tagColor: '#16A34A' },
  { name: 'Indian Economy', emoji: '\uD83D\uDCCA', pdfs: 12, tag: 'NEW', tagColor: '#16A34A' },
  { name: 'Environment', emoji: '\uD83C\uDF3F', pdfs: 20, tag: 'ALERT', tagColor: '#DC2626' },
  { name: 'Science & Technology', emoji: '\uD83D\uDD2C', pdfs: 14, tag: 'NEW', tagColor: '#16A34A' },
  { name: 'Art & Culture', emoji: '\uD83C\uDFA8', pdfs: 10, tag: 'LIVE', tagColor: '#16A34A' },
  { name: 'Current Affairs', emoji: '\uD83D\uDCF0', pdfs: 45, tag: 'ALERT', tagColor: '#DC2626' },
];

const comingSoon = [
  'International Relations',
  'Essay Module',
  'Ethics GS-IV',
  'Internal Security',
  'Social Issues',
  'Monthly Digest Arch...',
];

interface ChapterInfo {
  title: string;
  pages: number;
  size: string;
}

const subjectData: Record<string, {
  fullName: string;
  description: string;
  tags: string[];
  totalPages: string;
  chapters: Record<string, ChapterInfo[]>;
}> = {
  'Indian Polity': {
    fullName: 'Indian Polity & Constitution',
    description: 'Covers everything from Constitution, Parliament, Judiciary and\nDPSP \u2014 aligned with Laxmikanth and UPSC PYQs.',
    tags: ['Polity', 'Mains GS-II', 'Laxmikanth', 'PYQ-Included'],
    totalPages: '400+',
    chapters: {
      Notes: [
        { title: 'Constitution', pages: 45, size: '+7 MB' },
        { title: 'Parliament & Legislature \u2014 Complete Notes', pages: 38, size: '+7 MB' },
        { title: 'Supreme Court & Judicial Review', pages: 29, size: '+7 MB' },
        { title: 'President, Governor & Executive Powers', pages: 32, size: '+7 MB' },
        { title: 'DPSP & Fundamental Duties', pages: 24, size: '+7 MB' },
      ],
      Roadmaps: [
        { title: 'Polity Complete Preparation Roadmap', pages: 18, size: '+3 MB' },
        { title: 'Laxmikanth Chapter-wise Reading Strategy', pages: 22, size: '+4 MB' },
        { title: 'Parliament & Legislation Practice Framework', pages: 15, size: '+3 MB' },
        { title: 'Judiciary & Constitutional Bodies Study Plan', pages: 20, size: '+4 MB' },
        { title: 'Polity Revision & Mock Test Schedule', pages: 12, size: '+2 MB' },
      ],
      'PYQ Notes': [
        { title: 'Polity PYQ Trend Analysis (2015\u20132024)', pages: 35, size: '+6 MB' },
        { title: 'Parliament & Legislature PYQ Compilation', pages: 28, size: '+5 MB' },
        { title: 'Judiciary & Courts PYQ Analysis', pages: 22, size: '+4 MB' },
        { title: 'Executive & President PYQ Breakdown', pages: 19, size: '+3 MB' },
        { title: 'Fundamental Rights & DPSP PYQ Notes', pages: 25, size: '+5 MB' },
      ],
    },
  },
  'History': {
    fullName: 'History \u2014 Ancient, Medieval & Modern',
    description: 'From Harappan civilization to Indian Independence \u2014\ncovering ancient, medieval, and modern India comprehensively.',
    tags: ['History', 'Mains GS-I', 'Spectrum', 'PYQ-Included'],
    totalPages: '350+',
    chapters: {
      Notes: [
        { title: 'Ancient India & Harappan Civilization', pages: 42, size: '+7 MB' },
        { title: 'Vedic Period & Buddhism', pages: 35, size: '+6 MB' },
        { title: 'Medieval India \u2014 Delhi Sultanate', pages: 38, size: '+7 MB' },
        { title: 'Mughal Empire & Administration', pages: 40, size: '+7 MB' },
        { title: 'Modern India \u2014 British Rule', pages: 44, size: '+8 MB' },
      ],
      Roadmaps: [
        { title: 'History Complete Preparation Roadmap', pages: 20, size: '+3 MB' },
        { title: 'Ancient India Reading Strategy', pages: 16, size: '+3 MB' },
        { title: 'Medieval India Study Framework', pages: 18, size: '+3 MB' },
        { title: 'Modern India \u2014 Spectrum-based Plan', pages: 22, size: '+4 MB' },
        { title: 'History Revision & Timeline Sheets', pages: 14, size: '+2 MB' },
      ],
      'PYQ Notes': [
        { title: 'Ancient India PYQ Analysis (2015\u20132024)', pages: 30, size: '+5 MB' },
        { title: 'Medieval India PYQ Compilation', pages: 25, size: '+4 MB' },
        { title: 'Modern India PYQ Trend Breakdown', pages: 35, size: '+6 MB' },
        { title: 'Art & Architecture PYQ Notes', pages: 18, size: '+3 MB' },
        { title: 'Freedom Movement PYQ Analysis', pages: 28, size: '+5 MB' },
      ],
    },
  },
  'Geography': {
    fullName: 'Geography \u2014 Physical & Indian',
    description: 'Physical geography, Indian climate, rivers, soils,\nand resources \u2014 mapped to GC Leong and NCERT.',
    tags: ['Geography', 'Mains GS-I', 'GC Leong', 'NCERT-Backed'],
    totalPages: '320+',
    chapters: {
      Notes: [
        { title: 'Physical Geography of India', pages: 40, size: '+7 MB' },
        { title: 'Indian Climate & Monsoon', pages: 34, size: '+6 MB' },
        { title: 'Drainage Systems & Rivers', pages: 28, size: '+5 MB' },
        { title: 'Soil Types & Agriculture', pages: 32, size: '+6 MB' },
        { title: 'Mineral & Energy Resources', pages: 26, size: '+5 MB' },
      ],
      Roadmaps: [
        { title: 'Geography Complete Study Roadmap', pages: 18, size: '+3 MB' },
        { title: 'Map-based Learning Strategy', pages: 15, size: '+3 MB' },
        { title: 'Climate & Monsoon Deep Dive Plan', pages: 16, size: '+3 MB' },
        { title: 'Indian Agriculture Study Framework', pages: 20, size: '+4 MB' },
        { title: 'Geography Revision Checklist', pages: 12, size: '+2 MB' },
      ],
      'PYQ Notes': [
        { title: 'Physical Geography PYQ Analysis', pages: 28, size: '+5 MB' },
        { title: 'Climate & Monsoon PYQ Compilation', pages: 22, size: '+4 MB' },
        { title: 'Rivers & Drainage PYQ Breakdown', pages: 20, size: '+4 MB' },
        { title: 'Agriculture & Soil PYQ Notes', pages: 24, size: '+4 MB' },
        { title: 'Resource Geography PYQ Analysis', pages: 18, size: '+3 MB' },
      ],
    },
  },
  'Indian Economy': {
    fullName: 'Indian Economy \u2014 Macro & Micro',
    description: 'GDP, monetary policy, fiscal policy, agriculture and\nindustry \u2014 aligned with Ramesh Singh and Economic Survey.',
    tags: ['Economy', 'Mains GS-III', 'Ramesh Singh', 'Budget-Updated'],
    totalPages: '280+',
    chapters: {
      Notes: [
        { title: 'Indian Economy Basics & GDP', pages: 36, size: '+6 MB' },
        { title: 'Monetary Policy & RBI', pages: 30, size: '+5 MB' },
        { title: 'Fiscal Policy & Budget', pages: 34, size: '+6 MB' },
        { title: 'Agriculture & Food Security', pages: 28, size: '+5 MB' },
        { title: 'Industry & Infrastructure', pages: 32, size: '+6 MB' },
      ],
      Roadmaps: [
        { title: 'Economy Complete Preparation Roadmap', pages: 18, size: '+3 MB' },
        { title: 'Budget Analysis Study Guide', pages: 14, size: '+2 MB' },
        { title: 'Banking & Finance Framework', pages: 16, size: '+3 MB' },
        { title: 'Economic Survey Reading Strategy', pages: 20, size: '+4 MB' },
        { title: 'Economy Revision & Data Sheets', pages: 12, size: '+2 MB' },
      ],
      'PYQ Notes': [
        { title: 'Economy PYQ Trend Analysis (2015\u20132024)', pages: 32, size: '+5 MB' },
        { title: 'Monetary & Fiscal Policy PYQs', pages: 24, size: '+4 MB' },
        { title: 'Agriculture & Rural Economy PYQs', pages: 20, size: '+4 MB' },
        { title: 'Industry & Infrastructure PYQs', pages: 22, size: '+4 MB' },
        { title: 'External Sector & Trade PYQ Notes', pages: 18, size: '+3 MB' },
      ],
    },
  },
  'Environment': {
    fullName: 'Environment & Ecology',
    description: 'Ecology, biodiversity, climate change, environmental laws\nand conservation \u2014 updated with latest policies.',
    tags: ['Environment', 'Mains GS-III', 'Shankar IAS', 'Updated-2025'],
    totalPages: '360+',
    chapters: {
      Notes: [
        { title: 'Ecology & Biodiversity', pages: 38, size: '+7 MB' },
        { title: 'Climate Change & Agreements', pages: 34, size: '+6 MB' },
        { title: 'Environmental Laws & Policies', pages: 30, size: '+5 MB' },
        { title: 'Forest & Wildlife Conservation', pages: 36, size: '+6 MB' },
        { title: 'Pollution & Waste Management', pages: 28, size: '+5 MB' },
      ],
      Roadmaps: [
        { title: 'Environment Complete Study Roadmap', pages: 18, size: '+3 MB' },
        { title: 'Biodiversity Hotspots & Species Guide', pages: 22, size: '+4 MB' },
        { title: 'Climate Agreements Timeline', pages: 14, size: '+2 MB' },
        { title: 'Environmental Law Study Framework', pages: 16, size: '+3 MB' },
        { title: 'Environment Revision Checklist', pages: 12, size: '+2 MB' },
      ],
      'PYQ Notes': [
        { title: 'Ecology & Biodiversity PYQ Analysis', pages: 30, size: '+5 MB' },
        { title: 'Climate Change PYQ Compilation', pages: 24, size: '+4 MB' },
        { title: 'Environmental Laws PYQ Breakdown', pages: 20, size: '+4 MB' },
        { title: 'Conservation & Wildlife PYQs', pages: 26, size: '+5 MB' },
        { title: 'Pollution & Waste PYQ Notes', pages: 18, size: '+3 MB' },
      ],
    },
  },
  'Science & Technology': {
    fullName: 'Science & Technology',
    description: 'Space, nuclear, biotech, IT and defence technology \u2014\ncovering all emerging tech topics for UPSC.',
    tags: ['Sci & Tech', 'Mains GS-III', 'Current-Heavy', 'ISRO-Updated'],
    totalPages: '260+',
    chapters: {
      Notes: [
        { title: 'Space Technology & ISRO', pages: 32, size: '+6 MB' },
        { title: 'Nuclear Energy & Policy', pages: 26, size: '+5 MB' },
        { title: 'Biotechnology & Genetics', pages: 30, size: '+5 MB' },
        { title: 'IT & Emerging Technologies', pages: 28, size: '+5 MB' },
        { title: 'Defence Technology', pages: 24, size: '+4 MB' },
      ],
      Roadmaps: [
        { title: 'Science & Tech Preparation Roadmap', pages: 16, size: '+3 MB' },
        { title: 'Space & ISRO Study Guide', pages: 14, size: '+2 MB' },
        { title: 'Biotech & Health Tech Framework', pages: 18, size: '+3 MB' },
        { title: 'Emerging Tech Tracker Strategy', pages: 12, size: '+2 MB' },
        { title: 'S&T Revision & Quick Reference', pages: 10, size: '+2 MB' },
      ],
      'PYQ Notes': [
        { title: 'Space Technology PYQ Analysis', pages: 22, size: '+4 MB' },
        { title: 'Nuclear & Energy PYQ Compilation', pages: 18, size: '+3 MB' },
        { title: 'Biotechnology PYQ Breakdown', pages: 20, size: '+4 MB' },
        { title: 'IT & Digital India PYQ Notes', pages: 16, size: '+3 MB' },
        { title: 'Defence & Security Tech PYQs', pages: 14, size: '+2 MB' },
      ],
    },
  },
  'Art & Culture': {
    fullName: 'Art & Culture of India',
    description: 'Architecture, dance, music, paintings and religious\nmovements \u2014 aligned with Nitin Singhania.',
    tags: ['Art & Culture', 'Mains GS-I', 'Nitin Singhania', 'Visual-Notes'],
    totalPages: '220+',
    chapters: {
      Notes: [
        { title: 'Indian Architecture', pages: 30, size: '+6 MB' },
        { title: 'Classical Dance Forms', pages: 24, size: '+5 MB' },
        { title: 'Indian Music & Theatre', pages: 22, size: '+4 MB' },
        { title: 'Painting Traditions', pages: 26, size: '+5 MB' },
        { title: 'Religious Movements & Philosophy', pages: 28, size: '+5 MB' },
      ],
      Roadmaps: [
        { title: 'Art & Culture Complete Roadmap', pages: 16, size: '+3 MB' },
        { title: 'Architecture Timeline Guide', pages: 14, size: '+2 MB' },
        { title: 'Dance & Music Quick Reference', pages: 12, size: '+2 MB' },
        { title: 'Painting Schools Study Framework', pages: 14, size: '+2 MB' },
        { title: 'Religion & Philosophy Revision', pages: 16, size: '+3 MB' },
      ],
      'PYQ Notes': [
        { title: 'Architecture PYQ Analysis', pages: 20, size: '+4 MB' },
        { title: 'Dance & Music PYQ Compilation', pages: 16, size: '+3 MB' },
        { title: 'Painting & Sculpture PYQs', pages: 14, size: '+2 MB' },
        { title: 'Religious Movements PYQ Notes', pages: 18, size: '+3 MB' },
        { title: 'UNESCO Heritage Sites PYQs', pages: 12, size: '+2 MB' },
      ],
    },
  },
  'Current Affairs': {
    fullName: 'Current Affairs \u2014 Monthly & Weekly',
    description: 'Union budget, G20, landmark judgments, new legislation\nand international treaties \u2014 updated weekly.',
    tags: ['Current Affairs', 'All GS Papers', 'Weekly-Updated', 'Exam-Critical'],
    totalPages: '900+',
    chapters: {
      Notes: [
        { title: 'Union Budget 2025 Analysis', pages: 48, size: '+8 MB' },
        { title: 'India\u2019s G20 Presidency Review', pages: 36, size: '+6 MB' },
        { title: 'Supreme Court Landmark Judgments', pages: 42, size: '+7 MB' },
        { title: 'New Legislation & Amendments', pages: 38, size: '+7 MB' },
        { title: 'International Treaties & Summits', pages: 34, size: '+6 MB' },
      ],
      Roadmaps: [
        { title: 'Current Affairs Monthly Reading Plan', pages: 20, size: '+3 MB' },
        { title: 'Budget & Economy Current Tracker', pages: 16, size: '+3 MB' },
        { title: 'International Affairs Weekly Guide', pages: 18, size: '+3 MB' },
        { title: 'Legislation & Judiciary Tracker', pages: 14, size: '+2 MB' },
        { title: 'Current Affairs Revision Strategy', pages: 12, size: '+2 MB' },
      ],
      'PYQ Notes': [
        { title: 'Current Affairs-based PYQ Trends', pages: 38, size: '+6 MB' },
        { title: 'Economy Current Affairs PYQs', pages: 30, size: '+5 MB' },
        { title: 'Polity Current Affairs PYQs', pages: 28, size: '+5 MB' },
        { title: 'International Relations PYQs', pages: 24, size: '+4 MB' },
        { title: 'Science & Environment PYQs', pages: 22, size: '+4 MB' },
      ],
    },
  },
};

const features = [
  { emoji: '\uD83C\uDFAF', bg: '#FEE2E2', title: 'UPSC-First Approach', desc: 'Every line written from the examiner\u2019s lens. No fluff \u2014 only what earns marks in Prelims and Mains.' },
  { emoji: '\uD83D\uDD04', bg: '#DBEAFE', title: 'Updated Every Week', desc: 'Budget, new schemes, policy shifts \u2014 our notes are refreshed weekly so you\u2019re study outcomes.' },
  { emoji: '\uD83D\uDC9C', bg: '#EDE9FE', title: 'YouTube + Notes Synced', desc: 'Every PDF maps directly to Jeet Sir\u2019s YouTube lessons. Watch, then revise \u2014 the most powerful UPSC loop.' },
  { emoji: '\uD83C\uDF81', bg: '#FEF3C7', title: 'Free. Forever. No Catch.', desc: 'No paywalls, no \u2018premium only\u2019 tricks. Quality UPSC preparation should never be gated behind money.' },
  { emoji: '\uD83D\uDCCA', bg: '#DCFCE7', title: 'PYQ-Backed Content', desc: 'All notes reviewed, weightaged from 10-years of PYQs \u2014 calibrated to exactly what UPSC asks every year.' },
  { emoji: '\uD83C\uDFC6', bg: '#FFEDD5', title: 'Toppers Trust It', desc: 'Used by 94,000+ aspirants including students who cleared Prelims, Mains, and made it to the interview.' },
];

const heroStats = [
  { number: '360', suffix: '+', label: 'Free PDFs' },
  { number: '25', suffix: '+', label: 'PYQ-Backed Notes' },
  { number: '1L', suffix: '+', label: 'Downloads' },
  { number: '\u221E', suffix: '', label: 'Always Free' },
];

const bottomStats = [
  { number: '94K', suffix: '+', label: 'ACTIVE ASPIRANTS', suffixColor: '#155DFC' },
  { number: '280', suffix: '+', label: 'FREE PDFS', suffixColor: '#EA580C' },
  { number: '500', suffix: '+', label: 'PYQS SOLVED', suffixColor: '#155DFC' },
  { number: '100', suffix: '%', label: 'ALWAYS FREE', suffixColor: '#16A34A' },
];

const testimonials = [
  {
    initials: 'PR',
    name: 'Priya Rajan',
    credential: 'UPSC Prelims 2024 Cleared \u2014 Delhi',
    quote: 'The polity notes from Rise with Jeet IAS were my go-to during Prelims revision. Clear, concise, and perfectly aligned with Laxmikanth. I saved months of note-making.',
  },
  {
    initials: 'AK',
    name: 'Ankit Kumar',
    credential: 'UPSC Mains 2024 \u2014 Bihar',
    quote: 'I relied entirely on the free PDFs and YouTube lectures for my Mains preparation. The PYQ analysis helped me understand exactly what UPSC expects.',
  },
  {
    initials: 'SM',
    name: 'Sneha Mishra',
    credential: 'UPSC Mains 2025 \u2014 MP',
    quote: 'The weekly current affairs updates and synced notes made my preparation so much more efficient. Best free resource for UPSC aspirants.',
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function LibraryPage() {
  const [selectedSubject, setSelectedSubject] = useState('Indian Polity');
  const [activeTab, setActiveTab] = useState('Notes');

  const currentData = subjectData[selectedSubject];
  const currentSubject = subjects.find((s) => s.name === selectedSubject)!;
  const tabs = ['Notes', 'Roadmaps', 'PYQ Notes'] as const;

  return (
    <div
      className="font-arimo w-full min-h-screen"
      style={{ background: '#F9FAFB' }}
    >
      {/* Centered content wrapper */}
      <div
        className="w-full mx-auto"
        style={{
          maxWidth: 'clamp(960px, 75vw, 1200px)',
          padding: '0 clamp(16px, 2vw, 30px)',
        }}
      >
        {/* ============================================================ */}
        {/*  SECTION 1: HERO                                              */}
        {/* ============================================================ */}
        <div
          className="flex flex-col items-center"
          style={{
            paddingTop: 'clamp(24px, 3vw, 48px)',
            paddingBottom: 'clamp(24px, 2.5vw, 40px)',
          }}
        >
          {/* Badge pill */}
          <div
            className="flex items-center gap-2 font-arimo font-semibold text-white"
            style={{
              background: '#101828',
              borderRadius: '26843500px',
              padding: 'clamp(6px, 0.6vw, 8px) clamp(14px, 1.5vw, 20px)',
              fontSize: 'clamp(11px, 0.9vw, 13px)',
              letterSpacing: '0.5px',
              marginBottom: 'clamp(14px, 1.5vw, 20px)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" fill="#FFD273" stroke="#FFD273" strokeWidth="1" />
            </svg>
            India&apos;s Most Comprehensive UPSC Platform
          </div>

          {/* Main heading */}
          <h1
            className="font-arimo font-bold text-center"
            style={{
              fontSize: 'clamp(32px, 3.59vw, 48px)',
              lineHeight: 'clamp(38px, 4.2vw, 56px)',
              color: '#17223E',
              marginBottom: 'clamp(10px, 1vw, 16px)',
            }}
          >
            Your Complete{' '}
            <span className="font-tinos italic" style={{ color: '#C68A0B' }}>Library</span>
            <br />
            for UPSC Preparation
          </h1>

          {/* Description */}
          <p
            className="font-arimo text-center"
            style={{
              fontSize: 'clamp(14px, 1.2vw, 18px)',
              lineHeight: 'clamp(22px, 2.1vw, 28px)',
              color: '#4A5565',
              maxWidth: 'clamp(420px, 40vw, 560px)',
              marginBottom: 'clamp(8px, 0.6vw, 10px)',
            }}
          >
            Video lectures, assignment &amp; PYQ collections &mdash; everything&apos;s free. And we mean it.
          </p>
          <p
            className="font-arimo text-center"
            style={{
              fontSize: 'clamp(14px, 1.2vw, 18px)',
              lineHeight: 'clamp(22px, 2.1vw, 28px)',
              color: '#4A5565',
              maxWidth: 'clamp(420px, 40vw, 560px)',
              marginBottom: 'clamp(20px, 2vw, 28px)',
            }}
          >
            Best of teaches on YouTube, beautifully organised and free
          </p>

          {/* Stats card */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              padding: 'clamp(20px, 2vw, 28px) clamp(28px, 3vw, 44px)',
              boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)',
              width: '100%',
              maxWidth: 'clamp(580px, 55vw, 720px)',
            }}
          >
            <div className="flex items-center justify-between">
              {heroStats.map((stat, idx) => (
                <React.Fragment key={stat.label}>
                  <div className="flex flex-col items-center" style={{ flex: 1 }}>
                    <div className="font-arimo font-bold" style={{ fontSize: 'clamp(24px, 2.5vw, 34px)', color: '#162456', lineHeight: 1.2 }}>
                      {stat.number}
                      {stat.suffix && <span style={{ color: '#DBAC49' }}>{stat.suffix}</span>}
                    </div>
                    <div className="font-arimo" style={{ fontSize: 'clamp(11px, 0.9vw, 13px)', color: '#6A7282', marginTop: '4px' }}>
                      {stat.label}
                    </div>
                  </div>
                  {idx < heroStats.length - 1 && (
                    <div style={{ width: '1px', height: 'clamp(32px, 3vw, 44px)', background: '#E5E7EB', flexShrink: 0 }} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/*  SECTION 2: SUBJECT SIDEBAR + CONTENT PANEL                   */}
        {/* ============================================================ */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(16px, 2vw, 28px)',
            alignItems: 'flex-start',
            marginBottom: 'clamp(40px, 4vw, 60px)',
            flexWrap: 'wrap' as const,
          }}
        >
          {/* ── Left Sidebar ── */}
          <div
            style={{
              width: 'clamp(240px, 24vw, 310px)',
              flexShrink: 0,
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '0.8px solid #E5E7EB',
              boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)',
              overflow: 'hidden',
            }}
          >
            {/* Sidebar header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0E182D 0%, #172240 100%)',
                borderRadius: '16px 16px 0 0',
                padding: 'clamp(16px, 1.5vw, 20px)',
              }}
            >
              <div
                className="font-arimo font-bold"
                style={{
                  fontSize: 'clamp(10px, 0.9vw, 12px)',
                  color: '#BEDBFF',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  marginBottom: 'clamp(4px, 0.3vw, 6px)',
                }}
              >
                CHOOSE A SUBJECT
              </div>
              <div
                className="font-arimo font-bold"
                style={{
                  fontSize: 'clamp(14px, 1.2vw, 16px)',
                  color: '#FFFFFF',
                }}
              >
                8 Active &middot; 6 Coming Soon
              </div>
            </div>

            {/* Active subjects list */}
            <div style={{ padding: 'clamp(8px, 0.8vw, 12px)' }}>
              {subjects.map((subject) => {
                const isSelected = selectedSubject === subject.name;
                return (
                  <button
                    key={subject.name}
                    onClick={() => { setSelectedSubject(subject.name); setActiveTab('Notes'); }}
                    className="w-full"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'clamp(10px, 1.1vw, 16px)',
                      borderRadius: '14px',
                      background: isSelected ? '#0F1A30' : '#F9FAFB',
                      color: isSelected ? '#FFFFFF' : '#101828',
                      border: 'none',
                      cursor: 'pointer',
                      marginBottom: 'clamp(4px, 0.3vw, 6px)',
                      transition: 'all 0.2s ease',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 0.8vw, 12px)', minWidth: 0 }}>
                      <span style={{ fontSize: 'clamp(18px, 1.6vw, 22px)', flexShrink: 0 }}>{subject.emoji}</span>
                      <div style={{ minWidth: 0 }}>
                        <div
                          className="font-arimo font-bold"
                          style={{
                            fontSize: 'clamp(12px, 1.05vw, 14px)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {subject.name}
                        </div>
                        <div
                          className="font-arimo"
                          style={{
                            fontSize: 'clamp(10px, 0.82vw, 12px)',
                            color: isSelected ? '#94A3B8' : '#6A7282',
                          }}
                        >
                          {subject.pdfs} PDFs
                        </div>
                      </div>
                    </div>
                    <div
                      className="font-arimo font-bold"
                      style={{
                        fontSize: 'clamp(9px, 0.75vw, 11px)',
                        color: '#FFFFFF',
                        background: subject.tagColor,
                        borderRadius: '4px',
                        padding: 'clamp(2px, 0.3vw, 4px) clamp(6px, 0.6vw, 8px)',
                        flexShrink: 0,
                        letterSpacing: '0.3px',
                      }}
                    >
                      {subject.tag}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: '#E5E7EB', margin: '0 clamp(8px, 0.8vw, 12px)' }} />

            {/* Coming Soon section */}
            <div style={{ padding: 'clamp(8px, 0.8vw, 12px)' }}>
              <div
                className="font-arimo font-bold"
                style={{
                  fontSize: 'clamp(10px, 0.82vw, 12px)',
                  color: '#9CA3AF',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  padding: 'clamp(8px, 0.8vw, 12px) clamp(10px, 1.1vw, 16px)',
                  marginBottom: 'clamp(2px, 0.2vw, 4px)',
                }}
              >
                COMING SOON
              </div>
              {comingSoon.map((item) => (
                <div
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'clamp(8px, 0.8vw, 12px)',
                    padding: 'clamp(8px, 0.8vw, 12px) clamp(10px, 1.1vw, 16px)',
                    color: '#9CA3AF',
                  }}
                >
                  <span style={{ fontSize: 'clamp(16px, 1.4vw, 20px)', opacity: 0.5 }}>{'\uD83D\uDCC4'}</span>
                  <div style={{ minWidth: 0 }}>
                    <div
                      className="font-arimo"
                      style={{
                        fontSize: 'clamp(12px, 1.05vw, 14px)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item}
                    </div>
                    <div className="font-arimo" style={{ fontSize: 'clamp(9px, 0.75vw, 11px)' }}>
                      SOON
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right Content Panel ── */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '0.8px solid #E5E7EB',
              boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)',
              padding: 'clamp(18px, 2vw, 28px)',
            }}
          >
            {/* Header area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'clamp(12px, 1.2vw, 16px)', flexWrap: 'wrap' as const, marginBottom: 'clamp(12px, 1.2vw, 16px)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2
                  className="font-arimo font-bold"
                  style={{
                    fontSize: 'clamp(22px, 2.2vw, 30px)',
                    color: '#101828',
                    marginBottom: 'clamp(6px, 0.6vw, 10px)',
                    lineHeight: 1.2,
                  }}
                >
                  {currentData.fullName}
                </h2>
                <p
                  className="font-arimo"
                  style={{
                    fontSize: 'clamp(12px, 1.05vw, 14px)',
                    lineHeight: 'clamp(18px, 1.6vw, 22px)',
                    color: '#4A5565',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {currentData.description}
                </p>
              </div>

              {/* Mini stats card */}
              <div
                style={{
                  borderRadius: '24px',
                  border: '0.8px solid #E5E7EB',
                  boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.08)',
                  padding: 'clamp(10px, 1vw, 14px) clamp(16px, 1.5vw, 22px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(12px, 1.2vw, 18px)',
                  flexShrink: 0,
                }}
              >
                <div className="flex flex-col items-center">
                  <div className="font-arimo font-bold" style={{ fontSize: 'clamp(20px, 2vw, 28px)', color: '#101828', lineHeight: 1.2 }}>
                    {currentSubject.pdfs}
                  </div>
                  <div className="font-arimo" style={{ fontSize: 'clamp(10px, 0.82vw, 12px)', color: '#6A7282' }}>
                    PDFs
                  </div>
                </div>
                <div style={{ width: '1px', height: 'clamp(24px, 2.5vw, 36px)', background: '#E5E7EB' }} />
                <div className="flex flex-col items-center">
                  <div className="font-arimo font-bold" style={{ fontSize: 'clamp(20px, 2vw, 28px)', color: '#C68A0B', lineHeight: 1.2 }}>
                    {currentData.totalPages}
                  </div>
                  <div className="font-arimo" style={{ fontSize: 'clamp(10px, 0.82vw, 12px)', color: '#6A7282' }}>
                    Pages
                  </div>
                </div>
              </div>
            </div>

            {/* Tags row */}
            <div
              className="flex items-center"
              style={{
                gap: 'clamp(10px, 1.2vw, 16px)',
                marginBottom: 'clamp(16px, 1.8vw, 24px)',
                flexWrap: 'wrap',
              }}
            >
              {currentData.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-arimo"
                  style={{
                    fontSize: 'clamp(12px, 1.05vw, 14px)',
                    color: '#4A5565',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Tab bar */}
            <div style={{ borderBottom: '2px solid #E5E7EB', marginBottom: 'clamp(20px, 2vw, 28px)' }}>
              <div className="flex" style={{ gap: 'clamp(20px, 2.5vw, 36px)' }}>
                {tabs.map((tab) => {
                  const isActive = activeTab === tab;
                  const count = currentData.chapters[tab]?.length ?? 0;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className="font-arimo font-bold"
                      style={{
                        fontSize: 'clamp(13px, 1.12vw, 15px)',
                        color: isActive ? '#155DFC' : '#6A7282',
                        background: 'none',
                        border: 'none',
                        borderBottom: isActive ? '2px solid #155DFC' : '2px solid transparent',
                        padding: 'clamp(8px, 0.8vw, 12px) 0',
                        marginBottom: '-2px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'clamp(6px, 0.5vw, 8px)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {tab}
                      <span
                        className="font-arimo font-bold"
                        style={{
                          fontSize: 'clamp(10px, 0.82vw, 12px)',
                          background: isActive ? '#EFF6FF' : '#F3F4F6',
                          color: isActive ? '#155DFC' : '#6A7282',
                          borderRadius: '26843500px',
                          padding: '2px clamp(6px, 0.5vw, 8px)',
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section label */}
            <div
              className="font-arimo font-bold"
              style={{
                fontSize: 'clamp(10px, 0.82vw, 12px)',
                color: '#6A7282',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                marginBottom: 'clamp(12px, 1.2vw, 16px)',
              }}
            >
              {activeTab === 'Notes' ? 'FOUNDATIONAL NOTES' : activeTab === 'Roadmaps' ? 'STUDY ROADMAPS' : 'PREVIOUS YEAR QUESTIONS'}
            </div>

            {/* Chapter cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1vw, 14px)' }}>
              {(currentData.chapters[activeTab] ?? []).map((chapter, idx) => (
                <div
                  key={chapter.title}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'clamp(12px, 1.2vw, 16px)',
                    borderRadius: '14px',
                    border: '0.8px solid #E5E7EB',
                    padding: 'clamp(12px, 1.2vw, 16px)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Chapter number */}
                  <div
                    className="font-arimo font-bold"
                    style={{
                      fontSize: 'clamp(16px, 1.6vw, 22px)',
                      color: '#9CA3AF',
                      minWidth: 'clamp(28px, 2.5vw, 36px)',
                      textAlign: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </div>

                  {/* Document icon */}
                  <div
                    style={{
                      width: 'clamp(36px, 3.2vw, 44px)',
                      height: 'clamp(36px, 3.2vw, 44px)',
                      borderRadius: '50%',
                      background: '#FEE2E2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: 'clamp(16px, 1.4vw, 20px)' }}>{'\uD83D\uDCC4'}</span>
                  </div>

                  {/* Title & subtitle */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      className="font-arimo font-bold"
                      style={{
                        fontSize: 'clamp(13px, 1.12vw, 15px)',
                        color: '#101828',
                        marginBottom: '2px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {chapter.title}
                    </div>
                    <div
                      className="font-arimo"
                      style={{
                        fontSize: 'clamp(11px, 0.9vw, 13px)',
                        color: '#6A7282',
                      }}
                    >
                      {chapter.pages} pages | {chapter.size}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center" style={{ gap: 'clamp(6px, 0.6vw, 10px)', flexShrink: 0 }}>
                    <button
                      className="font-arimo font-bold"
                      style={{
                        fontSize: 'clamp(12px, 1.05vw, 14px)',
                        background: '#FFD274',
                        color: '#17223E',
                        borderRadius: '10px',
                        padding: 'clamp(6px, 0.6vw, 8px) clamp(14px, 1.3vw, 18px)',
                        border: 'none',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Read
                    </button>
                    <button
                      className="font-arimo font-bold"
                      style={{
                        fontSize: 'clamp(12px, 1.05vw, 14px)',
                        background: '#17223E',
                        color: '#FFD272',
                        borderRadius: '10px',
                        padding: 'clamp(6px, 0.6vw, 8px) clamp(14px, 1.3vw, 18px)',
                        border: 'none',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Get PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/*  SECTION 3: WHY RISE WITH JEET IAS BANNER                     */}
        {/* ============================================================ */}
        <div
          style={{
            borderRadius: '24px',
            background: 'linear-gradient(90deg, #0F192F 0%, #17223F 100%)',
            padding: 'clamp(28px, 3vw, 40px) clamp(28px, 3vw, 44px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'clamp(24px, 3vw, 40px)',
            marginBottom: 'clamp(40px, 4vw, 60px)',
            flexWrap: 'wrap' as const,
          }}
        >
          {/* Left side */}
          <div style={{ flex: 1, minWidth: 'clamp(280px, 40vw, 400px)' }}>
            <div
              className="flex items-center gap-2 font-arimo font-bold"
              style={{
                fontSize: 'clamp(10px, 0.82vw, 12px)',
                color: '#DBAC49',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                marginBottom: 'clamp(10px, 1vw, 14px)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" fill="#DBAC49" stroke="#DBAC49" strokeWidth="1" />
              </svg>
              WHY RISE WITH JEET IAS
            </div>
            <h3
              className="font-arimo font-bold"
              style={{
                fontSize: 'clamp(22px, 2.2vw, 30px)',
                lineHeight: 1.3,
                color: '#FFFFFF',
                marginBottom: 'clamp(4px, 0.4vw, 6px)',
              }}
            >
              Not just notes.
            </h3>
            <h3
              className="font-arimo font-bold"
              style={{
                fontSize: 'clamp(22px, 2.2vw, 30px)',
                lineHeight: 1.3,
                color: '#FFFFFF',
                marginBottom: 'clamp(12px, 1.2vw, 16px)',
              }}
            >
              A <span style={{ color: '#FDC700' }}>system built to crack UPSC.</span>
            </h3>
            <p
              className="font-arimo"
              style={{
                fontSize: 'clamp(12px, 1.05vw, 14px)',
                lineHeight: 'clamp(18px, 1.8vw, 24px)',
                color: '#94A3B8',
                maxWidth: 'clamp(360px, 36vw, 480px)',
              }}
            >
              Every PDF is designed with one obsession &mdash; your selection. Here&apos;s what makes us different from every other resource out there.
            </p>
          </div>

          {/* Right side */}
          <div className="flex flex-col items-center" style={{ flexShrink: 0 }}>
            <div
              className="font-arimo font-bold"
              style={{
                fontSize: 'clamp(36px, 3.6vw, 48px)',
                color: '#C68A0B',
                lineHeight: 1.1,
              }}
            >
              94K+
            </div>
            <div
              className="font-arimo"
              style={{
                fontSize: 'clamp(13px, 1.12vw, 15px)',
                color: '#FFFFFF',
                textAlign: 'center',
                marginTop: 'clamp(4px, 0.4vw, 6px)',
              }}
            >
              Aspirants trust
            </div>
            <div
              className="font-arimo font-bold"
              style={{
                fontSize: 'clamp(13px, 1.12vw, 15px)',
                color: '#FFFFFF',
                textAlign: 'center',
              }}
            >
              Rise with Jeet IAS
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/*  SECTION 4: FEATURE CARDS (3x2 grid)                          */}
        {/* ============================================================ */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'clamp(14px, 1.5vw, 24px)',
            marginBottom: 'clamp(40px, 4vw, 60px)',
          }}
        >
          {features.map((feature) => (
            <div
              key={feature.title}
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '0.8px solid #E5E7EB',
                padding: 'clamp(18px, 2vw, 24px)',
                boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.06)',
              }}
            >
              {/* Icon circle */}
              <div
                style={{
                  width: 'clamp(40px, 3.6vw, 48px)',
                  height: 'clamp(40px, 3.6vw, 48px)',
                  borderRadius: '50%',
                  background: feature.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'clamp(12px, 1.2vw, 16px)',
                }}
              >
                <span style={{ fontSize: 'clamp(18px, 1.6vw, 22px)' }}>{feature.emoji}</span>
              </div>
              <h4
                className="font-arimo font-bold"
                style={{
                  fontSize: 'clamp(15px, 1.35vw, 18px)',
                  color: '#101828',
                  marginBottom: 'clamp(6px, 0.6vw, 8px)',
                }}
              >
                {feature.title}
              </h4>
              <p
                className="font-arimo"
                style={{
                  fontSize: 'clamp(12px, 1.05vw, 14px)',
                  lineHeight: 'clamp(18px, 1.6vw, 22px)',
                  color: '#4A5565',
                }}
              >
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

        {/* ============================================================ */}
        {/*  SECTION 5: STATS ROW                                          */}
        {/* ============================================================ */}
        <div
          className="flex"
          style={{
            gap: 'clamp(12px, 1.2vw, 18px)',
            marginBottom: 'clamp(40px, 4vw, 60px)',
            flexWrap: 'wrap' as const,
          }}
        >
          {bottomStats.map((stat) => (
            <div
              key={stat.label}
              style={{
                flex: 1,
                minWidth: 'clamp(160px, 16vw, 200px)',
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '0.8px solid #E5E7EB',
                padding: 'clamp(18px, 2vw, 28px)',
                textAlign: 'center',
                boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.06)',
              }}
            >
              <div className="font-arimo font-bold" style={{ fontSize: 'clamp(28px, 2.8vw, 38px)', color: '#101828', lineHeight: 1.2 }}>
                {stat.number}
                <span style={{ color: stat.suffixColor }}>{stat.suffix}</span>
              </div>
              <div
                className="font-arimo font-bold"
                style={{
                  fontSize: 'clamp(10px, 0.82vw, 12px)',
                  color: '#6A7282',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginTop: 'clamp(4px, 0.4vw, 6px)',
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* ============================================================ */}
        {/*  SECTION 6: ASPIRANT STORIES                                   */}
        {/* ============================================================ */}
        <div style={{ marginBottom: 'clamp(40px, 4vw, 60px)' }}>
          {/* Header */}
          <div className="flex flex-col items-center" style={{ marginBottom: 'clamp(20px, 2vw, 28px)' }}>
            <div
              className="flex items-center gap-2 font-arimo font-bold"
              style={{
                fontSize: 'clamp(10px, 0.82vw, 12px)',
                color: '#DBAC49',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                marginBottom: 'clamp(6px, 0.6vw, 8px)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" fill="#DBAC49" stroke="#DBAC49" strokeWidth="1" />
              </svg>
              ASPIRANT STORIES
            </div>
            <h2
              className="font-arimo font-bold text-center"
              style={{
                fontSize: 'clamp(24px, 2.5vw, 34px)',
                color: '#101828',
                lineHeight: 1.3,
              }}
            >
              What UPSC Aspirants Say
            </h2>
          </div>

          {/* Testimonial cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 'clamp(14px, 1.5vw, 24px)',
            }}
          >
            {testimonials.map((t) => (
              <div
                key={t.initials}
                style={{
                  background: '#FFFBEB',
                  borderRadius: '16px',
                  padding: 'clamp(18px, 2vw, 24px)',
                }}
              >
                {/* Stars */}
                <div style={{ marginBottom: 'clamp(10px, 1vw, 14px)', display: 'flex', gap: '2px' }}>
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1" />
                    </svg>
                  ))}
                </div>

                {/* Quote */}
                <p
                  className="font-arimo italic"
                  style={{
                    fontSize: 'clamp(12px, 1.05vw, 14px)',
                    lineHeight: 'clamp(18px, 1.8vw, 24px)',
                    color: '#374151',
                    marginBottom: 'clamp(16px, 1.6vw, 22px)',
                  }}
                >
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Avatar + name */}
                <div className="flex items-center" style={{ gap: 'clamp(10px, 1vw, 14px)' }}>
                  <div
                    className="flex items-center justify-center font-arimo font-bold"
                    style={{
                      width: 'clamp(36px, 3.2vw, 44px)',
                      height: 'clamp(36px, 3.2vw, 44px)',
                      borderRadius: '50%',
                      background: '#1E40AF',
                      color: '#FFFFFF',
                      fontSize: 'clamp(12px, 1.05vw, 14px)',
                      flexShrink: 0,
                    }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div
                      className="font-arimo font-bold"
                      style={{
                        fontSize: 'clamp(13px, 1.12vw, 15px)',
                        color: '#101828',
                      }}
                    >
                      {t.name}
                    </div>
                    <div
                      className="font-arimo"
                      style={{
                        fontSize: 'clamp(11px, 0.9vw, 13px)',
                        color: '#6A7282',
                      }}
                    >
                      {t.credential}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================================ */}
        {/*  SECTION 7: CTA BANNER                                         */}
        {/* ============================================================ */}
        <div
          style={{
            borderRadius: '24px',
            background: 'linear-gradient(90deg, #FDC700 0%, #FF8904 50%, #FF6900 100%)',
            padding: 'clamp(32px, 3.5vw, 48px) clamp(28px, 3vw, 44px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'clamp(24px, 3vw, 40px)',
            marginBottom: 'clamp(40px, 4vw, 60px)',
            position: 'relative',
            overflow: 'hidden',
            flexWrap: 'wrap' as const,
          }}
        >
          {/* Left side */}
          <div style={{ flex: 1, minWidth: 'clamp(280px, 40vw, 400px)', zIndex: 1 }}>
            <h3
              className="font-arimo font-bold"
              style={{
                fontSize: 'clamp(22px, 2.2vw, 30px)',
                lineHeight: 1.3,
                color: '#101828',
                marginBottom: 'clamp(8px, 0.8vw, 12px)',
              }}
            >
              Ready to start your IAS journey the right way?
            </h3>
            <p
              className="font-arimo"
              style={{
                fontSize: 'clamp(13px, 1.2vw, 16px)',
                lineHeight: 'clamp(20px, 1.8vw, 26px)',
                color: '#374151',
                marginBottom: 'clamp(18px, 2vw, 28px)',
                maxWidth: 'clamp(360px, 36vw, 480px)',
              }}
            >
              Access 360+ free PDFs, PYQ notes, and study roadmaps &mdash; all designed to help you crack UPSC on your first attempt.
            </p>

            <div className="flex items-center" style={{ gap: 'clamp(10px, 1vw, 14px)', flexWrap: 'wrap' }}>
              <button
                className="font-arimo font-bold"
                style={{
                  background: '#101828',
                  color: '#FFFFFF',
                  borderRadius: '14px',
                  padding: 'clamp(12px, 1.2vw, 16px) clamp(22px, 2vw, 28px)',
                  fontSize: 'clamp(13px, 1.12vw, 15px)',
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Start Studying Free
              </button>
              <button
                className="font-arimo font-bold"
                style={{
                  background: '#FFFFFF',
                  color: '#101828',
                  borderRadius: '14px',
                  padding: 'clamp(12px, 1.2vw, 16px) clamp(22px, 2vw, 28px)',
                  fontSize: 'clamp(13px, 1.12vw, 15px)',
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Watch on YouTube
              </button>
            </div>
          </div>

          {/* Right side - decorative rocket */}
          <div
            className="flex items-center justify-center"
            style={{
              width: 'clamp(80px, 8vw, 110px)',
              height: 'clamp(80px, 8vw, 110px)',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.3)',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 'clamp(40px, 4vw, 56px)' }}>{'\uD83D\uDE80'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
