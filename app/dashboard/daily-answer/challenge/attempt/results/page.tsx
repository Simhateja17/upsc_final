'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { dailyAnswerService } from '@/lib/services';

interface ParameterScore {
  parameter: string;
  score: number;
  maxScore: number;
  comment?: string;
}

interface ResultsData {
  score: number;
  maxScore: number;
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  detailedFeedback?: string;
  checkedCopyUrl?: string | null;
  checkedCopyPages?: Array<{ pageNumber: number; checkedCopyUrl?: string | null; status?: string; reason?: string }>;
  checkedCopyStatus?: string | null;
  annotationPlan?: unknown;
  wordCount?: number | null;
  submittedAt?: string | null;
  keyTerms?: Array<{ term: string; found: boolean }>;
  nextAttemptFocus?: string | null;
  evaluatorConclusion?: string | null;
  modelAnswerUrl?: string | null;
  modelAnswerKeyPoints?: string[];
  modelAnswerContent?: string;
  parameterScores?: ParameterScore[];
  question?: {
    title: string;
    subject: string;
    paper: string;
    date: string;
    marks: number;
    wordLimit: number;
    timeLimit: number;
  };
}

type TabKey = 'feedback' | 'markup' | 'breakdown' | 'next';

const BETA_DISCLAIMER =
  'Jeet AI Mentor is currently in beta and evolving every day alongside you. Our evaluation engine is built to deliver meaningful, structured, and exam-relevant feedback, but it can still make mistakes. Use it as a smart companion alongside your mentors, notes, and judgment.';

/* ----------------------------------------------------------------------------
   Demo fallback content — mirrors the shared HTML so every section looks
   complete even before the evaluator returns structured data for that field.
---------------------------------------------------------------------------- */
const DEMO_STRENGTHS = [
  'Answer is internally organized with headings and chronological flow.',
  'Some historical points (Plassey, Buxar, Diwani) are factually relevant — but to a different question.',
];
const DEMO_IMPROVEMENTS = [
  'Identify the paper and theme correctly: this was GS-III Security, not modern history.',
  'Structure as: threat landscape, implications for architecture, reforms, and safeguards.',
];
const DEMO_SUGGESTIONS = [
  'Read GS-III Security chapters covering cyber security, border management, terrorism.',
  'Follow MHA annual report, CERT-In advisories, NCIIPC material.',
  'Use newspapers/editorials on hybrid threats to enrich examples.',
];
const DEMO_KEY_TERMS = [
  'LAC', 'drone smuggling', 'border fencing', 'CIBMS', 'BSF',
  'smart border', 'thermal imagers', 'community policing', 'coordination', 'multi-agency approach',
].map((term) => ({ term, found: false }));

const DEMO_NEXT_FOCUS =
  'Your next attempt must begin with decoding the exact subject of the question before writing. Build headings directly from the demand and use contemporary security institutions, examples and rights-based safeguards.';
const DEMO_CONCLUSION =
  'This answer addresses an entirely different subject. If you fix question interpretation and write even a basic relevant GS-3 security answer with current examples, you can realistically move into the 5–7 range.';

const DEMO_RUBRIC: Array<{ label: string; percent: number; fraction: string; color: string; note: string }> = [
  { label: 'Relevance to demand', percent: 5, fraction: '0/5', color: '#DC2626', note: 'Answer is mostly off-topic for the GS-III security question.' },
  { label: 'Structure', percent: 38, fraction: '1/2', color: '#E07B00', note: 'Headings exist, but they are mapped to the wrong topic. Readable flow and conclusion discipline are strengths to retain.' },
  { label: 'Depth of analysis', percent: 12, fraction: '0/2', color: '#DC2626', note: 'No critical examination of border-management vulnerabilities or the required multi-dimensional security approach.' },
  { label: 'Examples & data', percent: 18, fraction: '0/2', color: '#E07B00', note: 'No relevant cases, commissions, or contemporary examples. Expected terms like LAC, ISR, CIBMS, BSF are absent.' },
  { label: 'Terminology', percent: 8, fraction: '0/2', color: '#DC2626', note: 'Expected terms like LAC, CIBMS, BSF, drone smuggling, thermal imagers are not used.' },
  { label: 'Actionability', percent: 10, fraction: '0/1', color: '#DC2626', note: 'No concrete reforms or measures suggested for strengthening border preparedness.' },
  { label: 'Presentation', percent: 58, fraction: '0/1', color: '#16A34A', note: 'Readable handwriting, neat structure, and conclusion discipline are strengths to retain.' },
];

type Segment = { text: string; flag?: 'red' | 'amber' | 'green'; title?: string };
type Block =
  | { type: 'line'; segments: Segment[] }
  | { type: 'note'; tone: 'red' | 'amber' | 'green'; strong: string; text: string }
  | { type: 'expected'; title: string; items: string[] };

const DEMO_MARKUP_PAGES: Array<{ page: number; title: string; blocks: Block[]; comment: string }> = [
  {
    page: 1,
    title: 'FROM TRADE TO EMPIRE: THE BRITISH EAST INDIA COMPANY IN 18TH-CENTURY INDIA',
    comment:
      "Good introduction and factual grounding. Geographical factors are well-covered. However, the analysis lacks critical depth — you state facts without evaluating their interconnection. Define technical terms (ISR) before use. Data citations are a plus but need IPCC-level sources.",
    blocks: [
      {
        type: 'line',
        segments: [
          { flag: 'red', title: 'Off-topic introduction', text: '“The transformation of the British East India Company from a trading entity to a dominant political power was not accidental;”' },
          { text: ' it was the outcome of India’s internal fragmentation.' },
        ],
      },
      { type: 'note', tone: 'red', strong: '✋ Examiner remark:', text: 'Off-topic. The question was on India’s current security architecture, not 18th-century colonial history. This entire answer addresses a different paper.' },
      {
        type: 'line',
        segments: [
          { text: 'The Battle of Plassey (1757) and the Battle of Buxar (1764) marked turning points in the Company’s rise. ' },
          { flag: 'amber', title: 'Good factual recall but irrelevant to question', text: '※ Well-recalled facts, but not relevant to GS-III Security.' },
          { text: ' The Diwani rights of 1765 further consolidated British economic control over Bengal.' },
        ],
      },
      { type: 'note', tone: 'red', strong: '✋ Examiner remark:', text: 'None of this addresses the LAC tensions, drone-based smuggling, border management vulnerabilities, or the requested multi-dimensional security approach.' },
      {
        type: 'line',
        segments: [
          { flag: 'amber', title: 'Needs critical evaluation', text: '● From trade to territory:' },
          { text: ' The Company progressively transformed from a commercial enterprise into a territorial power, exploiting the political vacuum left by the decline of the Mughal Empire.' },
        ],
      },
      { type: 'note', tone: 'amber', strong: '💡 Suggestion:', text: 'Decode the demand before writing. A relevant answer should define border-management vulnerabilities, then connect technology, infrastructure, intelligence, and border-community participation.' },
      {
        type: 'line',
        segments: [
          { text: 'The geopolitical landscape of the Indian subcontinent was fundamentally altered. ' },
          { flag: 'green', title: 'Clear sentence construction', text: '✓ Clear writing style.' },
          { text: ' Regional powers like the Marathas, Mysore, and the Nizam of Hyderabad played crucial roles in shaping the outcome.' },
        ],
      },
    ],
  },
  {
    page: 2,
    title: 'CONTINUATION: COLONIAL EXPANSION AND ADMINISTRATIVE CONSOLIDATION',
    comment:
      'Presentation remains neat, but the answer continues on the wrong theme. The conclusion is coherent in isolation, yet it does not answer border-management vulnerabilities or the required technology–infrastructure–community framework. Preserve the structure, but rebuild the content around the exact question demand.',
    blocks: [
      {
        type: 'line',
        segments: [
          { text: 'The Company’s administrative expansion was supported by revenue extraction, subsidiary alliances, and military superiority. ' },
          { flag: 'red', title: 'Question mismatch repeated', text: 'This repeats the same mismatch.' },
        ],
      },
      { type: 'note', tone: 'red', strong: '✋ Examiner remark:', text: 'The answer continues as Modern History. It still does not examine India’s border management framework, LAC-related gaps, drone threats, or federal coordination challenges.' },
      {
        type: 'line',
        segments: [
          { text: 'In conclusion, the British did not conquer India solely by strength, but by exploiting weaknesses. ' },
          { flag: 'amber', title: 'Conclusion not mapped to asked theme', text: 'Conclusion is coherent but unrelated to the asked security theme.' },
        ],
      },
      { type: 'note', tone: 'green', strong: '✓ What to retain:', text: 'The answer has legible structure, headings, and conclusion discipline. Keep that structure, but map every heading to the actual demand of the question.' },
      {
        type: 'expected',
        title: 'What page 2 should have contained',
        items: [
          'Vulnerabilities: terrain gaps, legacy fencing, surveillance blind spots, and inter-agency coordination issues.',
          'Technology: drones, anti-drone systems, CIBMS, thermal imagers, satellite/ISR, and AI-enabled analytics.',
          'Infrastructure and people: roads, border villages, community policing, intelligence sharing, and humanitarian safeguards.',
        ],
      },
    ],
  },
];

const NEXT_CARDS = [
  { tone: 'blue', icon: '✍️', title: 'Rewrite with Feedback', desc: 'Rewrite today’s answer using the examiner comments and missed-demand checklist.', pill: '~15 min', action: 'Rewrite', route: '/dashboard/daily-answer/challenge' },
  { tone: 'rose', icon: '✒️', title: 'Practice Answer Writing', desc: 'Write with your own question — create a fresh prompt and get targeted feedback.', pill: '10 marks · 150 words', action: 'Write', route: '/dashboard/mains-answer-evaluator' },
  { tone: 'green', icon: '🧾', title: 'Read & Practice MCQs', desc: 'Read a short concept note, then solve targeted MCQs from the areas you missed.', pill: '5 min · 10 MCQs', action: 'Practice', route: '/dashboard/daily-mcq' },
  { tone: 'amber', icon: '🎧', title: 'Enter Study Room', desc: 'Join a focused, distraction-free session with peers working on answer writing.', pill: '● 1,284 studying now', action: 'Enter', route: '/dashboard/discussion' },
] as const;

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'feedback', label: 'Feedback' },
  { key: 'markup', label: "Examiner's Markup" },
  { key: 'breakdown', label: 'Score Breakdown' },
  { key: 'next', label: "What's Next" },
];

/* Scoped CSS — every selector is prefixed with #dmcResults so the generic class
   names (.card, .chip, .btn-primary, …) cannot leak into the dashboard chrome. */
const SCOPED_CSS = `
#dmcResults{
  --bg:#F5F6F8;--card:#FFFFFF;--ink:#0B1020;--ink2:#11172A;--muted:#6B7280;--line:#E6E8EE;
  --gold:#F5B800;--accent-purple:#6366F1;--accent-green:#16A34A;--accent-red:#DC2626;--accent-blue:#3B82F6;--accent-amber:#E07B00;
  --font-body:var(--font-jakarta),ui-sans-serif,system-ui,sans-serif;
  --font-heading:var(--font-dm-serif),serif;
  font-family:var(--font-body);color:var(--ink);background:var(--bg);min-height:100%;
  -webkit-font-smoothing:antialiased;line-height:1.6;
}
#dmcResults *,#dmcResults ::before,#dmcResults ::after{box-sizing:border-box;}
#dmcResults .container{max-width:1200px;margin:0 auto;padding:24px 20px;}
#dmcResults .card{background:var(--card);border-radius:24px;box-shadow:0 1px 2px rgba(15,23,42,.04),0 8px 24px rgba(15,23,42,.06),inset 0 0 0 1px var(--line);padding:28px;position:relative;overflow:hidden;}
#dmcResults .chip{display:inline-flex;align-items:center;gap:5px;padding:5px 14px;border-radius:100px;font-size:12px;font-weight:600;letter-spacing:.02em;}
#dmcResults .chip-purple{background:#EEF0FF;color:#4338CA;}
#dmcResults .chip-blue{background:#E8F0FF;color:#1d4ed8;}
#dmcResults .chip-red{background:#FFE9E9;color:#DC2626;}
#dmcResults .btn-primary{background:var(--ink);color:#fff;border:none;padding:14px 28px;border-radius:16px;font-weight:600;font-size:14px;cursor:pointer;transition:.2s;font-family:var(--font-body);display:inline-flex;align-items:center;gap:8px;}
#dmcResults .btn-primary:hover{background:var(--ink2);}
#dmcResults .btn-secondary{background:var(--bg);color:var(--ink);border:1px solid var(--line);padding:14px 28px;border-radius:16px;font-weight:600;font-size:14px;cursor:pointer;transition:.2s;font-family:var(--font-body);display:inline-flex;align-items:center;gap:8px;}
#dmcResults .btn-secondary:hover{background:var(--line);}

#dmcResults .tab-bar{display:flex;gap:6px;background:var(--card);border-radius:16px;padding:6px;border:1px solid var(--line);box-shadow:0 1px 2px rgba(15,23,42,.04),0 8px 24px rgba(15,23,42,.06);overflow-x:auto;scrollbar-width:none;}
#dmcResults .tab-bar::-webkit-scrollbar{display:none;}
#dmcResults .tab-btn{flex:1 1 0%;min-width:max-content;padding:10px 18px;border:none;background:transparent;border-radius:12px;font-weight:600;font-size:14px;color:#374151;cursor:pointer;transition:.25s;white-space:nowrap;font-family:var(--font-body);}
#dmcResults .tab-btn.active{background:var(--ink);color:#fff;box-shadow:0 6px 16px rgba(11,16,32,.18);}
#dmcResults .tab-btn:hover:not(.active){background:var(--bg);color:var(--ink);}

#dmcResults .score-banner{background:radial-gradient(120% 120% at 0% 0%,#1a2240 0%,#0b1020 60%);border-radius:24px;padding:48px 48px 48px 40px;color:#fff;position:relative;overflow:hidden;}
#dmcResults .score-banner::before{content:"";position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.06) 1px,transparent 1px);background-size:18px 18px;pointer-events:none;}
#dmcResults .score-banner-glow{position:absolute;top:-60px;right:-60px;width:240px;height:240px;border-radius:50%;background:rgba(245,184,0,.06);filter:blur(2px);pointer-events:none;}
#dmcResults .score-banner-glow2{position:absolute;bottom:-80px;left:-40px;width:200px;height:200px;border-radius:50%;background:rgba(245,184,0,.03);filter:blur(2px);pointer-events:none;}
#dmcResults .score-banner-inner{display:flex;align-items:center;justify-content:space-between;gap:32px;position:relative;z-index:1;}
#dmcResults .score-label{font-size:10px;letter-spacing:.18em;color:#F5B800;font-weight:700;text-transform:uppercase;}
#dmcResults .score-headline{font-family:var(--font-heading);font-size:32px;color:#fff;line-height:1.3;}
#dmcResults .score-headline .accent{color:#F5B800;font-style:italic;}
#dmcResults .score-sub{color:rgba(255,255,255,.5);font-size:14px;line-height:1.6;font-weight:300;}
#dmcResults .score-ring{width:130px;height:130px;position:relative;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
#dmcResults .score-ring svg{transform:rotate(-90deg);}
#dmcResults .score-ring circle{fill:none;stroke-width:5;}
#dmcResults .score-ring .ring-track{stroke:rgba(255,255,255,.08);}
#dmcResults .score-ring .ring-progress{stroke:#F5B800;stroke-linecap:round;transition:stroke-dashoffset 1.8s cubic-bezier(.4,0,.2,1);}
#dmcResults .score-ring .score-num{font-family:var(--font-heading);font-size:42px;color:#F5B800;line-height:1;}
#dmcResults .score-ring .score-total{font-family:var(--font-heading);font-size:16px;color:rgba(255,255,255,.4);}
#dmcResults .score-glow{position:absolute;width:100px;height:100px;border-radius:50%;background:radial-gradient(circle,rgba(245,184,0,.15) 0%,transparent 70%);pointer-events:none;}

#dmcResults .key-term{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:100px;border:1px solid rgba(220,38,38,.2);background:#FFE9E9;font-size:12px;font-weight:500;color:#DC2626;}
#dmcResults .key-term.found{border-color:rgba(22,163,74,.25);background:#E6F7EC;color:#166534;}

/* ---- Examiner markup viewer ---- */
#dmcResults .markup-shell{margin-top:0;}
#dmcResults .markup-viewer{border-radius:24px;border:1px solid rgba(15,23,42,.10);box-shadow:0 18px 50px rgba(15,23,42,.08);overflow:hidden;background:#fff;}
#dmcResults .markup-toolbar{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:rgba(255,255,255,.86);backdrop-filter:blur(14px);border-bottom:1px solid var(--line);flex-wrap:wrap;gap:8px;}
#dmcResults .markup-toolbar-left,#dmcResults .markup-toolbar-center,#dmcResults .markup-toolbar-right{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
#dmcResults .markup-page-chip{display:inline-flex;align-items:center;justify-content:center;padding:5px 11px;border-radius:999px;background:#fff1f1;color:#b91c1c;border:1px solid rgba(220,38,38,.18);font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;}
#dmcResults .zoom-btn{width:32px;height:32px;border-radius:999px;border:1px solid var(--line);background:#fff;cursor:pointer;display:grid;place-items:center;font-size:16px;font-weight:600;color:var(--ink);transition:.15s;font-family:var(--font-body);}
#dmcResults .zoom-btn:hover{background:var(--bg);}
#dmcResults .zoom-label{font-size:13px;font-weight:600;color:var(--ink);min-width:40px;text-align:center;}
#dmcResults .markup-link-btn{font-size:12px;font-weight:600;color:#1d4ed8;cursor:pointer;background:#eef4ff;border:none;font-family:var(--font-body);display:inline-flex;align-items:center;gap:4px;padding:8px 12px;border-radius:999px;}
#dmcResults .markup-link-btn:hover{background:#dbeafe;}
#dmcResults .toggle-btn{font-size:12px;font-weight:600;color:var(--ink);cursor:pointer;background:#f8fafc;border:1px solid var(--line);border-radius:999px;padding:8px 12px;font-family:var(--font-body);transition:.15s;display:inline-flex;align-items:center;gap:4px;}
#dmcResults .toggle-btn:hover{background:#eef2f7;}
#dmcResults .markup-scroll{overflow:auto;max-height:640px;background:linear-gradient(180deg,#f8fafc 0%,#eef2f7 100%);padding:22px;}
#dmcResults .markup-paper{width:min(760px,100%);margin:0 auto;padding:38px 42px;background:#fff;border:1px solid rgba(15,23,42,.10);box-shadow:0 18px 46px rgba(15,23,42,.10);min-height:520px;transform-origin:top center;transition:transform .3s;}
#dmcResults .markup-page{display:none;position:relative;}
#dmcResults .markup-page.active{display:block;}
#dmcResults .paper-watermark{position:absolute;top:-18px;left:-22px;color:rgba(11,16,32,.08);font-family:var(--font-heading);font-size:54px;pointer-events:none;}
#dmcResults .paper-title{text-align:center;color:#1a3a6b;font-weight:800;text-decoration:underline;font-size:14px;letter-spacing:.04em;margin-bottom:18px;}
#dmcResults .handwriting-line{margin-bottom:14px;line-height:1.9;font-family:var(--font-heading);font-size:16px;color:#1a3a6b;}
#dmcResults .flag-red{background:rgba(225,112,85,.15);border-bottom:2px wavy #E17055;cursor:help;}
#dmcResults .flag-amber{background:rgba(245,184,0,.22);border-bottom:2px solid #F5B800;cursor:help;}
#dmcResults .flag-green{background:rgba(22,163,74,.13);border-bottom:2px solid #16A34A;cursor:help;}
#dmcResults .examiner-note{margin:18px 0;padding:15px 17px;border-radius:0 15px 15px 0;font-size:13px;line-height:1.65;font-family:var(--font-body);box-shadow:inset 0 0 0 1px rgba(255,255,255,.45);}
#dmcResults .note-red{background:rgba(225,112,85,.07);border-left:4px solid #E17055;color:#A33625;}
#dmcResults .note-amber{background:rgba(245,184,0,.10);border-left:4px solid #F5B800;color:#8B6400;}
#dmcResults .note-green{background:rgba(22,163,74,.08);border-left:4px solid #16A34A;color:#166534;}
#dmcResults .expected-answer-card{margin-top:18px;padding:18px;border-radius:18px;background:#eef6ff;border:1px solid rgba(59,130,246,.18);color:#1e3a8a;}
#dmcResults .expected-title{font-size:11px;letter-spacing:.13em;text-transform:uppercase;font-weight:900;margin-bottom:8px;}
#dmcResults .expected-answer-card ul{padding-left:18px;font-size:13px;line-height:1.7;}
#dmcResults .markup-annotation{transition:opacity .3s,background-color .2s,border-color .2s;}
#dmcResults .markup-annotation.markup-clean{background:transparent!important;border-bottom-color:transparent!important;color:inherit!important;}
#dmcResults .markup-annotation.markup-note-hidden{display:none!important;}
#dmcResults .page-nav{display:flex;align-items:center;justify-content:center;gap:18px;padding:15px 20px;border-top:1px solid var(--line);background:rgba(255,255,255,.9);}
#dmcResults .page-nav-btn{font-size:13px;font-weight:600;color:var(--ink);cursor:pointer;background:#fff;border:1px solid rgba(11,16,32,.09);padding:8px 14px;border-radius:999px;box-shadow:0 3px 10px rgba(11,16,32,.04);display:inline-flex;align-items:center;gap:4px;}
#dmcResults .page-nav-btn:hover:not(:disabled){background:var(--ink);color:#fff;}
#dmcResults .page-nav-btn:disabled{color:var(--muted);opacity:.4;cursor:default;}
#dmcResults .page-label{font-size:13px;color:var(--ink);font-weight:800;padding:8px 14px;border-radius:999px;background:#f1f5f9;}

#dmcResults .examiner-comment{position:relative;overflow:hidden;margin-top:24px;padding:24px 26px 24px 28px;border-radius:22px;background:linear-gradient(135deg,#F6F4FF 0%,#FFFFFF 48%,#EEF7FF 100%);border:1px solid rgba(99,102,241,.16);border-left:4px solid #8B8CF6;box-shadow:0 16px 42px rgba(71,85,105,.09),inset 0 1px 0 rgba(255,255,255,.80);}
#dmcResults .examiner-comment::before{content:"";position:absolute;width:170px;height:170px;right:-56px;top:-68px;border-radius:50%;background:radial-gradient(circle,rgba(139,140,246,.20),transparent 68%);}
#dmcResults .examiner-comment-label{font-size:11px;letter-spacing:.14em;font-weight:700;color:#4F46E5;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:6px;position:relative;}
#dmcResults .examiner-comment-text{font-size:15px;line-height:1.85;color:#243044;position:relative;}

/* ---- Score breakdown ---- */
#dmcResults .breakdown-card{padding:28px;background:linear-gradient(180deg,#FFFFFF 0%,#F8FAFC 100%);border:1px solid rgba(15,23,42,.08);box-shadow:0 18px 54px rgba(15,23,42,.08);}
#dmcResults .breakdown-head{display:flex;align-items:center;gap:14px;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid rgba(15,23,42,.08);}
#dmcResults .breakdown-icon{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(135deg,#FFF7D6,#FFE9A6);box-shadow:inset 0 0 0 1px rgba(214,168,57,.22);font-size:20px;}
#dmcResults .breakdown-head h3{font-size:18px;line-height:1.15;font-weight:900;color:#101827;}
#dmcResults .breakdown-head p{margin-top:4px;color:#64748B;font-size:12px;line-height:1.45;}
#dmcResults .rubric-bars{display:flex;flex-direction:column;gap:20px;}
#dmcResults .rubric-row{animation:dmcRubricIn .42s ease both;}
#dmcResults .rubric-row-top{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:8px;}
#dmcResults .rubric-title{font-size:14px;font-weight:700;color:#111827;}
#dmcResults .rubric-score-wrap{display:inline-flex;align-items:center;gap:6px;flex-shrink:0;}
#dmcResults .rubric-points{padding:4px 10px;border-radius:8px;background:color-mix(in srgb,var(--rubric-color) 8%,white);color:var(--rubric-color);font-size:12px;font-weight:800;display:inline-block;}
#dmcResults .rubric-percent{font-size:15px;font-weight:800;min-width:42px;text-align:right;color:var(--rubric-color);}
#dmcResults .rubric-track{height:10px;border-radius:999px;background:#EEF2F7;overflow:hidden;}
#dmcResults .rubric-fill{height:100%;width:var(--rubric-percent);border-radius:inherit;background:var(--rubric-color);transition:width 1s cubic-bezier(.4,0,.2,1);}
#dmcResults .rubric-note{margin-top:8px;color:#64748B;font-size:12px;line-height:1.5;font-style:italic;}

/* ---- What's next ---- */
#dmcResults .next-steps-head h3{font-family:var(--font-body);font-size:24px;line-height:1.2;color:#172033;letter-spacing:-.02em;margin-top:8px;}
#dmcResults .next-steps-head p{color:#64748b;font-size:13px;margin-top:7px;}
#dmcResults .next-kicker{color:#C47B00;font-size:10px;letter-spacing:.22em;font-weight:900;text-transform:uppercase;}
#dmcResults .next-steps-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:22px;}
#dmcResults .next-card{position:relative;min-height:190px;padding:20px;border-radius:18px;background:#fff;border:1px solid #E2E8F0;overflow:hidden;box-shadow:0 1px 2px rgba(15,23,42,.03);transition:transform .2s,box-shadow .2s,border-color .2s;text-align:left;cursor:pointer;width:100%;font-family:var(--font-body);}
#dmcResults .next-card:hover{transform:translateY(-2px);box-shadow:0 18px 40px rgba(15,23,42,.08);border-color:rgba(15,23,42,.15);}
#dmcResults .next-orb{position:absolute;width:110px;height:110px;border-radius:50%;top:-30px;right:-30px;opacity:.85;}
#dmcResults .next-blue .next-orb{background:#E8E7FA;}#dmcResults .next-rose .next-orb{background:#FBE2E7;}#dmcResults .next-green .next-orb{background:#DFF4EB;}#dmcResults .next-amber .next-orb{background:#FFF3D8;}
#dmcResults .next-icon{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;font-size:18px;background:#F8FAFC;position:relative;z-index:2;}
#dmcResults .next-blue .next-icon{background:#EEF0FF;}#dmcResults .next-rose .next-icon{background:#FFF0F2;}#dmcResults .next-green .next-icon{background:#EAF8F0;}#dmcResults .next-amber .next-icon{background:#FFF8E7;}
#dmcResults .next-card h4{position:relative;z-index:1;margin-top:24px;color:#111827;font-size:16px;line-height:1.2;font-weight:800;}
#dmcResults .next-card p{position:relative;z-index:1;margin-top:8px;color:#64748b;font-size:12px;line-height:1.55;max-width:86%;}
#dmcResults .next-card-foot{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:18px;}
#dmcResults .next-pill{display:inline-flex;align-items:center;justify-content:center;padding:6px 13px;border-radius:999px;font-size:11px;line-height:1;font-weight:800;border:1px solid currentColor;background:#fff;}
#dmcResults .next-pill.blue,#dmcResults .next-action.blue{color:#4F46E5;}
#dmcResults .next-pill.rose,#dmcResults .next-action.rose{color:#BE123C;}
#dmcResults .next-pill.green,#dmcResults .next-action.green{color:#047857;}
#dmcResults .next-pill.amber,#dmcResults .next-action.amber{color:#B45309;}
#dmcResults .next-action{border:0;background:transparent;cursor:pointer;font-family:var(--font-body);font-size:13px;font-weight:800;}

/* ---- Model answer CTA ---- */
#dmcResults .model-answer-cta{position:relative;overflow:hidden;min-height:88px;padding:20px 24px;border-radius:14px;display:flex;align-items:center;justify-content:space-between;gap:24px;background:linear-gradient(100deg,#FFFEF8 0%,#FDF8E8 48%,#F8F0D4 100%);border:1px solid rgba(200,175,90,.22);border-left:4px solid #D4BE6A;color:#0B1020;box-shadow:0 8px 20px rgba(129,98,22,.08),inset 0 1px 0 rgba(255,255,255,.78);}
#dmcResults .model-answer-cta::before{content:"";position:absolute;width:240px;height:240px;top:-108px;right:-62px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.88) 0%,rgba(255,255,255,.36) 32%,transparent 70%);opacity:.95;}
#dmcResults .model-banner-label{display:flex;align-items:center;gap:6px;color:#7A5510;letter-spacing:.15em;font-size:10px;font-weight:900;text-transform:uppercase;margin-bottom:8px;}
#dmcResults .model-banner-headline{margin:0 0 5px;color:#0B1020;font-family:var(--font-heading);font-size:22px;font-weight:500;line-height:1.22;}
#dmcResults .model-banner-sub{color:rgba(11,16,32,.62);font-size:12px;line-height:1.5;max-width:420px;font-weight:500;}
#dmcResults .model-banner-content{position:relative;z-index:1;}
#dmcResults .btn-view-now{position:relative;z-index:1;background:#0B1020;color:#F7C843;border:none;padding:11px 22px;border-radius:999px;font-weight:900;font-size:14px;cursor:pointer;transition:.2s;font-family:var(--font-body);display:inline-flex;align-items:center;gap:6px;white-space:nowrap;flex-shrink:0;box-shadow:0 8px 20px rgba(11,16,32,.12);}
#dmcResults .btn-view-now:hover{background:#151D33;color:#FFD766;}

/* ---- Action buttons ---- */
#dmcResults .action-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:12px;font-weight:600;font-size:13px;cursor:pointer;transition:.2s;border:none;font-family:var(--font-body);text-decoration:none;}
#dmcResults .action-btn:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(11,16,32,.08);}
#dmcResults .action-btn-share{background:#E8F0EB;color:#16A34A;}
#dmcResults .action-btn-copy{background:#F5E2DE;color:#8B4537;}
#dmcResults .action-btn-rewrite{background:var(--ink);color:#fff;padding:12px 24px;border-radius:100px;font-size:14px;}
#dmcResults .action-btn-back{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--muted);font-weight:500;cursor:pointer;background:none;border:none;font-family:var(--font-body);transition:.2s;}
#dmcResults .action-btn-back:hover{color:var(--ink);}

/* ---- Modals ---- */
.dmc-modal-overlay{position:fixed;inset:0;background:rgba(11,16,32,.55);backdrop-filter:blur(8px);z-index:1000;display:grid;place-items:center;padding:20px;animation:dmcFadeIn .25s ease;}
.dmc-modal-content{background:#fff;border-radius:18px;max-width:520px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 30px 80px rgba(0,0,0,.3);animation:dmcModalIn .3s ease;font-family:var(--font-jakarta),ui-sans-serif,system-ui,sans-serif;}

@keyframes dmcRubricIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
@keyframes dmcFadeIn{from{opacity:0;}to{opacity:1;}}
@keyframes dmcModalIn{from{opacity:0;transform:scale(.95) translateY(10px);}to{opacity:1;transform:scale(1) translateY(0);}}

@media (max-width:768px){
  #dmcResults .score-banner{padding:28px 24px;}
  #dmcResults .score-banner-inner{flex-direction:column;text-align:center;}
  #dmcResults .next-steps-grid{grid-template-columns:1fr;}
  #dmcResults .next-card p{max-width:100%;}
  #dmcResults .model-answer-cta{flex-direction:column;text-align:left;align-items:flex-start;}
  #dmcResults .feedback-grid{grid-template-columns:1fr!important;}
  #dmcResults .feedback-divider{display:none!important;}
}
`;

function ResultsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');
  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  const [tab, setTab] = useState<TabKey>('feedback');
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [modelAnswerOpen, setModelAnswerOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Markup viewer state
  const [markupPage, setMarkupPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [markupsHidden, setMarkupsHidden] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (dateParam) return;
    if (typeof window !== 'undefined') {
      const storedAttemptId = sessionStorage.getItem('dailyAnswerAttemptId');
      if (storedAttemptId) setAttemptId(storedAttemptId);
    }
  }, [dateParam]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    dailyAnswerService.getResults(dateParam ? undefined : attemptId || undefined, dateParam || undefined)
      .then((res) => {
        if (cancelled) return;
        setData(res.data);
        if (!dateParam && typeof window !== 'undefined') {
          sessionStorage.removeItem('dailyAnswerAttemptId');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Could not load results');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [attemptId, dateParam]);

  // Escape exits fullscreen markup
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  const score = data?.score ?? 0;
  const maxScore = data?.maxScore ?? 15;
  const scorePercent = maxScore > 0 ? Math.max(0, Math.min(100, Math.round((score / maxScore) * 100))) : 0;

  const strengths = data?.strengths?.length ? data.strengths : DEMO_STRENGTHS;
  const improvements = data?.improvements?.length ? data.improvements : DEMO_IMPROVEMENTS;
  const suggestions = data?.suggestions?.length ? data.suggestions : DEMO_SUGGESTIONS;
  const keyTerms = data?.keyTerms?.length ? data.keyTerms : DEMO_KEY_TERMS;
  const nextFocus = data?.nextAttemptFocus?.trim() || DEMO_NEXT_FOCUS;
  const conclusion = data?.evaluatorConclusion?.trim() || DEMO_CONCLUSION;
  const wordCount = data?.wordCount ?? 247;

  const detailedFeedback = data?.detailedFeedback?.trim() ?? '';

  // Real checked-copy images (when the evaluator produced them)
  const checkedCopyPages = (data?.checkedCopyPages || []).filter((p) => p.checkedCopyUrl);
  const realImagePages = checkedCopyPages.length > 0
    ? checkedCopyPages
    : data?.checkedCopyUrl
      ? [{ pageNumber: 1, checkedCopyUrl: data.checkedCopyUrl }]
      : [];
  const useRealImages = realImagePages.length > 0;

  const totalMarkupPages = useRealImages ? realImagePages.length : DEMO_MARKUP_PAGES.length;
  const safeMarkupPage = Math.max(1, Math.min(totalMarkupPages, markupPage));
  const activeDemoPage = DEMO_MARKUP_PAGES[safeMarkupPage - 1] ?? DEMO_MARKUP_PAGES[0];
  const examinerComment = useRealImages
    ? (detailedFeedback || activeDemoPage.comment)
    : activeDemoPage.comment;

  const rubricRows = useMemo(() => {
    if (data?.parameterScores?.length) {
      return data.parameterScores.map((p) => {
        const pct = p.maxScore > 0 ? Math.round((p.score / p.maxScore) * 100) : 0;
        const color = pct >= 50 ? '#16A34A' : pct >= 15 ? '#E07B00' : '#DC2626';
        return { label: p.parameter, percent: pct, fraction: `${p.score}/${p.maxScore}`, color, note: p.comment || '' };
      });
    }
    return DEMO_RUBRIC;
  }, [data?.parameterScores]);

  const breadcrumbDate = useMemo(() => {
    const raw = data?.question?.date || data?.submittedAt;
    const d = raw ? new Date(raw) : new Date();
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }, [data?.question?.date, data?.submittedAt]);
  const paperLabel = data?.question?.paper || 'GS Paper III';
  const subjectLabel = data?.question?.subject || 'Security';
  const marks = data?.question?.marks ?? maxScore ?? 15;

  const copyLink = () => {
    const url = typeof window !== 'undefined' ? window.location.href : 'risewithjeet.com';
    if (navigator?.clipboard) navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ringCirc = 2 * Math.PI * 50;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F6F8' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F6F8' }}>
        <div className="text-center px-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Could not load results</h2>
          <p className="text-gray-500 mb-4">{error || 'Please try again in a moment.'}</p>
          <Link href="/dashboard/daily-answer" className="text-blue-600 hover:underline">Back to Daily Answer</Link>
        </div>
      </div>
    );
  }

  return (
    <div id="dmcResults">
      <style dangerouslySetInnerHTML={{ __html: SCOPED_CSS }} />
      <div className="container">

        {/* Breadcrumb + top actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
            <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontFamily: 'var(--font-body)', fontSize: 13 }}>Dashboard</button>
            <span style={{ margin: '0 4px' }}>›</span>
            <span>Result</span><span style={{ margin: '0 4px' }}>·</span><span>{breadcrumbDate}</span>
            <span className="chip chip-purple" style={{ marginLeft: 4 }}>{paperLabel}</span>
            <span className="chip chip-blue">{subjectLabel}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="action-btn action-btn-share" style={{ padding: '8px 14px', fontSize: 12 }} onClick={() => setShareOpen(true)}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
              Share
            </button>
            {data.checkedCopyUrl ? (
              <a className="action-btn action-btn-copy" style={{ padding: '8px 14px', fontSize: 12 }} href={data.checkedCopyUrl} target="_blank" rel="noreferrer">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                Download Copy
              </a>
            ) : (
              <button className="action-btn action-btn-copy" style={{ padding: '8px 14px', fontSize: 12 }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                Download Copy
              </button>
            )}
          </div>
        </div>

        {/* Score banner */}
        <div className="score-banner" style={{ marginBottom: 24 }}>
          <div className="score-banner-glow" />
          <div className="score-banner-glow2" />
          <div className="score-banner-inner">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="score-label" style={{ marginBottom: 16 }}>Jeet AI · Evaluation Ready</div>
              <div className="score-headline" style={{ marginBottom: 12 }}>Your mock has been <span className="accent">evaluated.</span></div>
              <p className="score-sub" style={{ maxWidth: 440, margin: 0 }}>Below is your scorecard along with model answers and improvement notes for your answer.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <div className="score-ring">
                <div className="score-glow" />
                <svg width="120" height="120" viewBox="0 0 130 130">
                  <circle className="ring-track" cx="65" cy="65" r="50" />
                  <circle className="ring-progress" cx="65" cy="65" r="50" strokeDasharray={ringCirc} strokeDashoffset={ringCirc * (1 - scorePercent / 100)} />
                </svg>
                <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="score-num">{score}</span>
                  <span className="score-total">/ {maxScore}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 30, padding: '12px 0', background: 'rgba(248,247,244,0.92)', backdropFilter: 'blur(12px)' }}>
          <div className="tab-bar">
            {TABS.map((t) => (
              <button key={t.key} className={`tab-btn${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* ===== FEEDBACK ===== */}
        {tab === 'feedback' && (
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>🎯</span>
                  <h3 style={{ fontWeight: 700, fontSize: 17 }}>Personalised Feedback</h3>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 100, background: '#E8F7F3', fontSize: 12, fontWeight: 600, color: '#0D9488' }}>
                  Words Count: {wordCount} <span style={{ fontSize: 14 }}>✓</span>
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>Actionable insights to help you improve, not just a score.</p>

              <div className="feedback-grid" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', gap: 0, marginTop: 20 }}>
                {/* What You Did Well */}
                <div style={{ padding: '0 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <span style={{ width: 24, height: 24, borderRadius: 8, background: '#E6F7EC', display: 'grid', placeItems: 'center', fontSize: 12 }}>✅</span>
                    What You Did Well
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {strengths.map((s, i) => (
                      <div key={i} style={{ background: '#E6F7EC', borderRadius: 12, padding: 12, fontSize: 13, lineHeight: 1.5 }}>→ {s}</div>
                    ))}
                  </div>
                </div>
                <div className="feedback-divider" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 2, height: '80%', background: 'linear-gradient(to bottom,transparent 0%,#CBD5E1 15%,#CBD5E1 85%,transparent 100%)', borderRadius: 2 }} />
                </div>
                {/* Areas to Improve */}
                <div style={{ padding: '0 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#E07B00', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <span style={{ width: 24, height: 24, borderRadius: 8, background: '#FFF1E0', display: 'grid', placeItems: 'center', fontSize: 12 }}>⚠️</span>
                    Areas to Improve
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {improvements.map((s, i) => (
                      <div key={i} style={{ background: '#FFF1E0', borderRadius: 12, padding: 12, fontSize: 13, lineHeight: 1.5 }}>▲ {s}</div>
                    ))}
                  </div>
                </div>
                <div className="feedback-divider" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 2, height: '80%', background: 'linear-gradient(to bottom,transparent 0%,#CBD5E1 15%,#CBD5E1 85%,transparent 100%)', borderRadius: 2 }} />
                </div>
                {/* Value-Add Ideas */}
                <div style={{ padding: '0 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <span style={{ width: 24, height: 24, borderRadius: 8, background: '#E8F0FF', display: 'grid', placeItems: 'center', fontSize: 12 }}>💡</span>
                    Value-Add Ideas
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {suggestions.map((s, i) => (
                      <div key={i} style={{ background: '#E8F0FF', borderRadius: 12, padding: 12, fontSize: 13, lineHeight: 1.5 }}>◆ {s}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Key Terms */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 18 }}>🔑</span>
                <h3 style={{ fontWeight: 700, fontSize: 17 }}>Key Terms Analysis</h3>
              </div>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>Terms an examiner would expect in a {marks}-mark answer.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
                {keyTerms.map((kt, i) => (
                  <span key={i} className={`key-term${kt.found ? ' found' : ''}`}><span style={{ fontSize: 10 }}>{kt.found ? '✓' : '✗'}</span> {kt.term}</span>
                ))}
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--accent-red)', fontWeight: 600 }}>✗ Missed</span> terms should appear in your next attempt.
              </div>
            </div>

            {/* Next Attempt Focus */}
            <div style={{ borderRadius: 16, padding: 20, background: '#EEF0FF', border: '1px solid rgba(99,102,241,0.1)', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>🎯</span>
                <span style={{ fontSize: 10, letterSpacing: '0.12em', fontWeight: 700, color: '#4F46E5' }}>NEXT ATTEMPT FOCUS</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--ink)' }}>{nextFocus}</p>
            </div>

            {/* Evaluator's Conclusion */}
            <div style={{ borderRadius: 16, padding: 20, background: '#E6F7EC', border: '1px solid rgba(22,163,74,0.1)', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>✅</span>
                <span style={{ fontSize: 10, letterSpacing: '0.12em', fontWeight: 700, color: '#16A34A' }}>EVALUATOR&apos;S CONCLUSION</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--ink)' }}>{conclusion}</p>
            </div>
          </div>
        )}

        {/* ===== MARKUP ===== */}
        {tab === 'markup' && (
          <div className="markup-shell">
            <div className={`markup-viewer${fullscreen ? ' fullscreen' : ''}`}
              style={fullscreen ? { position: 'fixed', inset: '48px 24px 24px', zIndex: 1001 } : undefined}>
              {/* Toolbar */}
              <div className="markup-toolbar">
                <div className="markup-toolbar-left">
                  <span className="markup-page-chip">Page {safeMarkupPage}</span>
                  <span className="chip chip-red" style={{ fontSize: 10 }}>CHECKED COPY</span>
                </div>
                <div className="markup-toolbar-center" aria-label="Zoom controls">
                  <button className="zoom-btn" type="button" onClick={() => setZoom((z) => Math.max(70, z - 10))} aria-label="Zoom out">−</button>
                  <span className="zoom-label">{zoom}%</span>
                  <button className="zoom-btn" type="button" onClick={() => setZoom((z) => Math.min(160, z + 10))} aria-label="Zoom in">+</button>
                </div>
                <div className="markup-toolbar-right">
                  <button className="markup-link-btn" type="button" onClick={() => setFullscreen((f) => !f)}>{fullscreen ? '✕ Close full size' : '⤢ Open full size'}</button>
                  {!useRealImages && (
                    <button className="toggle-btn" type="button" onClick={() => setMarkupsHidden((h) => !h)}>👁 {markupsHidden ? 'Show markups' : 'Hide markups'}</button>
                  )}
                </div>
              </div>

              {/* Paper */}
              <div className="markup-scroll" style={fullscreen ? { maxHeight: 'calc(100vh - 190px)' } : undefined}>
                {useRealImages ? (
                  <div className="markup-paper" style={{ transform: `scale(${zoom / 100})`, padding: 16 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={realImagePages[safeMarkupPage - 1]?.checkedCopyUrl || ''} alt={`Checked copy page ${safeMarkupPage}`} style={{ width: '100%', borderRadius: 10, display: 'block' }} />
                  </div>
                ) : (
                  <div className="markup-paper" style={{ transform: `scale(${zoom / 100})` }}>
                    {DEMO_MARKUP_PAGES.map((pg) => (
                      <div key={pg.page} className={`markup-page${pg.page === safeMarkupPage ? ' active' : ''}`}>
                        <div className="paper-watermark">Page {pg.page}</div>
                        <div className="paper-title">{pg.title}</div>
                        {pg.blocks.map((block, bi) => {
                          if (block.type === 'line') {
                            return (
                              <p key={bi} className="handwriting-line">
                                {block.segments.map((seg, si) =>
                                  seg.flag ? (
                                    <span key={si} className={`markup-annotation flag-${seg.flag}${markupsHidden ? ' markup-clean' : ''}`} title={seg.title}>{seg.text}</span>
                                  ) : (
                                    <span key={si}>{seg.text}</span>
                                  )
                                )}
                              </p>
                            );
                          }
                          if (block.type === 'note') {
                            return (
                              <div key={bi} className={`markup-annotation examiner-note note-${block.tone}${markupsHidden ? ' markup-note-hidden' : ''}`}>
                                <strong>{block.strong}</strong> {block.text}
                              </div>
                            );
                          }
                          return (
                            <div key={bi} className={`expected-answer-card markup-annotation${markupsHidden ? ' markup-note-hidden' : ''}`}>
                              <div className="expected-title">{block.title}</div>
                              <ul>{block.items.map((it, ii) => <li key={ii}>{it}</li>)}</ul>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Page nav */}
              <div className="page-nav">
                <button className="page-nav-btn" type="button" disabled={safeMarkupPage === 1} onClick={() => setMarkupPage((p) => Math.max(1, p - 1))}>‹ Prev</button>
                <span className="page-label">Page {safeMarkupPage} of {totalMarkupPages}</span>
                <button className="page-nav-btn" type="button" disabled={safeMarkupPage === totalMarkupPages} onClick={() => setMarkupPage((p) => Math.min(totalMarkupPages, p + 1))}>Next ›</button>
              </div>
            </div>

            {/* Examiner's overall comment */}
            <div className="examiner-comment">
              <div className="examiner-comment-label">📋 Examiner&apos;s Overall Comment — Page {safeMarkupPage}</div>
              <p className="examiner-comment-text">{examinerComment}</p>
            </div>
          </div>
        )}

        {/* ===== BREAKDOWN ===== */}
        {tab === 'breakdown' && (
          <div className="card breakdown-card">
            <div className="breakdown-head">
              <div className="breakdown-icon">⭐</div>
              <div style={{ flex: 1 }}>
                <h3>7-Parameter Score Breakdown</h3>
                <p>Marks mapped to demand, concepts, depth, evidence, structure, value-add, and presentation.</p>
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, background: '#EEF0FF', color: '#4338CA', fontSize: 11, fontWeight: 700, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                Examiner rubric · {maxScore} marks
              </span>
            </div>
            <div className="rubric-bars">
              {rubricRows.map((r, i) => (
                <div key={i} className="rubric-row" style={{ ['--rubric-color' as string]: r.color, ['--rubric-percent' as string]: `${r.percent}%`, animationDelay: `${i * 60}ms` } as React.CSSProperties}>
                  <div className="rubric-row-top">
                    <div><span className="rubric-title">{r.label}</span></div>
                    <div className="rubric-score-wrap">
                      <span className="rubric-points">{r.fraction}</span>
                      <span className="rubric-percent">{r.percent}%</span>
                    </div>
                  </div>
                  <div className="rubric-track"><div className="rubric-fill" /></div>
                  {r.note && <p className="rubric-note">{r.note}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== WHAT'S NEXT ===== */}
        {tab === 'next' && (
          <div className="next-steps-frame">
            <div className="next-steps-head">
              <div>
                <div className="next-kicker">SMART NEXT STEPS</div>
                <h3>Personalized for your weak areas</h3>
                <p>Curated for you based on today&apos;s performance.</p>
              </div>
            </div>
            <div className="next-steps-grid">
              {NEXT_CARDS.map((c) => (
                <button key={c.title} type="button" className={`next-card next-${c.tone}`} onClick={() => router.push(c.route)}>
                  <div className="next-orb" />
                  <div className="next-icon">{c.icon}</div>
                  <h4>{c.title}</h4>
                  <p>{c.desc}</p>
                  <div className="next-card-foot">
                    <span className={`next-pill ${c.tone}`}>{c.pill}</span>
                    <span className={`next-action ${c.tone}`}>{c.action} →</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Model answer CTA (global) */}
        <div className="model-answer-cta" style={{ marginTop: 24 }}>
          <div className="model-banner-content">
            <div className="model-banner-label">📋 Model Answer Available</div>
            <div className="model-banner-headline">Compare with a structured reference answer</div>
            <div className="model-banner-sub">See how a top-scoring response is framed, structured, and substantiated.</div>
          </div>
          <button className="btn-view-now" onClick={() => setModelAnswerOpen(true)}>View Now →</button>
        </div>

        {/* Action bar (global) */}
        <div className="card" style={{ marginTop: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <button className="action-btn-back" onClick={() => router.push('/dashboard/daily-answer')}>
            <span style={{ fontSize: 16 }}>🏠</span> Back to Dashboard
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button className="action-btn action-btn-share" onClick={() => setShareOpen(true)}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
              Share
            </button>
            {data.checkedCopyUrl ? (
              <a className="action-btn action-btn-copy" href={data.checkedCopyUrl} target="_blank" rel="noreferrer">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                Download Copy
              </a>
            ) : (
              <button className="action-btn action-btn-copy">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                Download Copy
              </button>
            )}
            <button className="action-btn action-btn-rewrite" onClick={() => router.push('/dashboard/daily-answer/challenge')}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
              Rewrite Answer
            </button>
          </div>
        </div>

        {/* AI disclaimer */}
        <div style={{ marginTop: 16 }}>
          <button
            onClick={() => setDisclaimerOpen((o) => !o)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', borderRadius: disclaimerOpen ? '10px 10px 0 0' : 10, background: '#F3F4F6', border: 'none', cursor: 'pointer', color: '#4A5565', fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 500 }}
          >
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="#6A7282" strokeWidth="1.8" /><path d="M10 9v5" stroke="#6A7282" strokeWidth="1.8" strokeLinecap="round" /><circle cx="10" cy="6.5" r="0.9" fill="#6A7282" /></svg>
            AI Disclaimer
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: disclaimerOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}><path d="M2 4l4 4 4-4" stroke="#6A7282" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          {disclaimerOpen && (
            <div style={{ borderRadius: '0 0 10px 10px', background: '#FEFCE8', borderLeft: '4px solid #FDC700', padding: '14px 20px' }}>
              <p style={{ fontSize: 12, lineHeight: 1.5, color: '#713F12' }}><strong>Note:</strong> {BETA_DISCLAIMER}</p>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen backdrop */}
      {fullscreen && tab === 'markup' && (
        <div onClick={() => setFullscreen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(11,16,32,0.62)', backdropFilter: 'blur(8px)', zIndex: 1000 }} />
      )}

      {/* ===== SHARE MODAL ===== */}
      {shareOpen && (
        <div className="dmc-modal-overlay" onClick={() => setShareOpen(false)}>
          <div className="dmc-modal-content" style={{ maxWidth: 520, padding: 0, overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ background: 'linear-gradient(135deg,#1a2240 0%,#0b1020 100%)', padding: '24px 28px 20px', position: 'relative' }}>
              <button onClick={() => setShareOpen(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'rgba(255,255,255,0.7)', width: 28, height: 28, borderRadius: 8, cursor: 'pointer', fontSize: 16, display: 'grid', placeItems: 'center' }}>×</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ color: '#F5B800', fontSize: 14 }}>▼</span>
                <span style={{ color: '#F5B800', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>DAILY MAINS CHALLENGE</span>
              </div>
              <div style={{ color: '#fff', fontSize: 20, fontWeight: 700, lineHeight: 1.4 }}>
                I scored <span style={{ color: '#F5B800' }}>{score}/{maxScore}</span> in today&apos;s<br />Daily Mains Challenge!
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                {[['7.4', 'Avg Score'], ['#14', 'Rank'], ['47 🔥', 'Streak']].map(([v, l], i) => (
                  <React.Fragment key={l}>
                    {i > 0 && <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.1)' }} />}
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{v}</div>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>{l}</div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div style={{ padding: '24px 28px', background: '#fff' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>SHARE TO</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 24 }}>
                {[
                  { bg: '#25D366', label: 'WhatsApp', txt: '✆' },
                  { bg: '#000', label: 'X', txt: '𝕏' },
                  { bg: '#0A66C2', label: 'LinkedIn', txt: 'in' },
                  { bg: 'linear-gradient(45deg,#f09433,#dc2743,#bc1888)', label: 'Instagram', txt: '◎' },
                  { bg: '#0088cc', label: 'Telegram', txt: '✈' },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: s.bg, display: 'grid', placeItems: 'center', color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{s.txt}</div>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>OR COPY LINK</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 14px' }}>
                <input type="text" value={typeof window !== 'undefined' ? window.location.href : 'risewithjeet.com'} readOnly style={{ flex: 1, border: 'none', background: 'transparent', color: '#374151', fontSize: 13, outline: 'none', fontFamily: 'var(--font-jakarta)' }} />
                <button onClick={copyLink} style={{ background: '#0B1020', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{copied ? 'Copied!' : 'Copy'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODEL ANSWER MODAL ===== */}
      {modelAnswerOpen && (
        <div className="dmc-modal-overlay" onClick={() => setModelAnswerOpen(false)}>
          <div className="dmc-modal-content" style={{ maxWidth: 680, padding: 0, overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            {/* Warning */}
            <div style={{ background: 'linear-gradient(135deg,#FFF7ED 0%,#FEF3C7 100%)', padding: '16px 24px', borderBottom: '1px solid rgba(245,158,11,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(245,158,11,0.15)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><span style={{ fontSize: 16 }}>⚡</span></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 4 }}>Reference Only</div>
                  <div style={{ fontSize: 12, color: '#78350F', lineHeight: 1.5 }}>Read after you&apos;ve written your own answer. Use this to understand gaps, not to memorise.</div>
                </div>
              </div>
            </div>
            {/* Header */}
            <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="chip chip-purple">{paperLabel}</span>
                  <span className="chip chip-blue">{subjectLabel}</span>
                </div>
                <button onClick={() => setModelAnswerOpen(false)} style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid var(--line)', background: '#fff', cursor: 'pointer', fontSize: 16, display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>×</button>
              </div>
              <div style={{ fontSize: 10, letterSpacing: '0.14em', fontWeight: 700, color: '#C47B00', textTransform: 'uppercase', marginBottom: 8 }}>Model Answer · {maxScore} Marks</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, lineHeight: 1.4, color: 'var(--ink)' }}>India&apos;s National Security Architecture: A Multi-Dimensional Approach</div>
            </div>
            {/* Body */}
            <div style={{ padding: '24px 28px', maxHeight: '60vh', overflowY: 'auto' }}>
              {data.modelAnswerContent ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {data.modelAnswerContent.split(/\n+/).map((p) => p.trim()).filter(Boolean).map((para, i) => (
                    <p key={i} style={{ fontSize: 14, color: '#1F2937', lineHeight: 1.8 }}>{para}</p>
                  ))}
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-purple)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><span>📌</span> INTRODUCTION</div>
                    <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--ink)', margin: 0 }}>
                      India&apos;s national security landscape has undergone a paradigm shift from traditional state-centric threats to a complex matrix of <strong>conventional military challenges</strong>, <strong>non-traditional security threats</strong>, and <strong>emerging technological risks</strong>. The convergence of these threats demands a holistic recalibration of India&apos;s internal and external security architecture.
                    </p>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg,#EEF0FF 0%,#F5F3FF 100%)', borderRadius: 16, padding: 20, marginBottom: 24, border: '1px solid rgba(99,102,241,0.15)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#4F46E5', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><span>📌</span> KEY POINTS CHECKLIST</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                      {[
                        'Threat landscape mapping (traditional + non-traditional)',
                        'Implications for security architecture',
                        'Institutional reforms needed',
                        'Technological integration (CIBMS, AI, drones)',
                        'Democratic safeguards & rights-based approach',
                        'Contemporary examples & data points',
                      ].map((pt) => (
                        <div key={pt} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <span style={{ color: '#16A34A', fontSize: 14, marginTop: 2 }}>✓</span>
                          <span style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {[
                    { t: '1. Evolving Threat Landscape', body: <><p style={{ fontSize: 13, lineHeight: 1.8, margin: '0 0 12px' }}><strong>Traditional Threats:</strong> Border tensions along the Line of Actual Control (LAC) with China and Line of Control (LoC) with Pakistan remain persistent challenges. The 2020 Galwan Valley incident underscored the volatility of undefined borders.</p><p style={{ fontSize: 13, lineHeight: 1.8, margin: 0 }}><strong>Emerging Challenges:</strong></p><ul style={{ fontSize: 13, lineHeight: 1.8, margin: '8px 0 0 20px' }}><li><strong>Cyber warfare:</strong> State-sponsored attacks on critical infrastructure (Kudankulam, 2019)</li><li><strong>Drone-based smuggling:</strong> Arms/narcotics infiltration via drones along Punjab and J&amp;K borders</li><li><strong>Disinformation:</strong> Coordinated campaigns to destabilise social harmony</li></ul></> },
                    { t: '2. Implications for Security Architecture', body: <ul style={{ fontSize: 13, lineHeight: 1.8, margin: '0 0 0 20px' }}><li><strong>Institutional fragmentation:</strong> Lack of integrated coordination between intelligence agencies, military, and paramilitary forces</li><li><strong>Technological lag:</strong> Inadequate cyber defence and delayed border surveillance adoption</li><li><strong>Legal gaps:</strong> Outdated frameworks for hybrid threats and cross-border terrorism</li></ul> },
                    { t: '3. Measures to Strengthen Preparedness', body: <ul style={{ fontSize: 13, lineHeight: 1.8, margin: '0 0 0 20px' }}><li>Establish a <strong>National Security Commission</strong> for integrated threat assessment</li><li>Accelerate <strong>CIBMS</strong> deployment with AI-powered surveillance and anti-drone systems</li><li>Enact a <strong>Data Protection Law</strong> and judicial oversight to balance security and privacy</li></ul> },
                  ].map((sec) => (
                    <div key={sec.t} style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 10, paddingLeft: 12, borderLeft: '3px solid var(--gold)' }}>{sec.t}</div>
                      <div style={{ paddingLeft: 16, color: 'var(--ink)' }}>{sec.body}</div>
                    </div>
                  ))}
                  <div style={{ background: 'linear-gradient(135deg,#F0FDF4 0%,#DCFCE7 100%)', borderRadius: 16, padding: 20, border: '1px solid rgba(22,163,74,0.15)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><span>✅</span> CONCLUSION</div>
                    <p style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--ink)', margin: 0 }}>
                      India&apos;s security architecture must evolve from a reactive, siloed approach to a <strong>proactive, integrated framework</strong> that addresses the full spectrum of threats while upholding democratic values.
                    </p>
                  </div>
                </>
              )}
            </div>
            {/* Footer */}
            <div style={{ padding: '16px 28px', borderTop: '1px solid var(--line)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Reference answer · Read after your attempt</div>
              <button className="btn-primary" onClick={() => { setModelAnswerOpen(false); router.push('/dashboard/daily-answer/challenge'); }} style={{ padding: '10px 20px', fontSize: 13 }}>✍️ Rewrite with this knowledge</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F6F8' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    }>
      <ResultsPageInner />
    </Suspense>
  );
}
