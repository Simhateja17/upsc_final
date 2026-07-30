'use client';

/**
 * MainsResultsView - shared results UI for AI-evaluated mains answers.
 *
 * Extracted from the Daily Answer Writing results page so Daily Answer,
 * PYQ Mains and Mock Test Mains all render the exact same experience:
 *   - Score banner (aggregated when a test has multiple questions)
 *   - Question selector chips (only when more than one question)
 *   - Tabs: Feedback / Examiner's Markup / Score Breakdown / What's Next
 *   - The Examiner's Markup tab is HIDDEN for typed answers (no checked-copy
 *     pages) - visual markup only exists for handwritten uploads.
 *   - Model answer modal (curated markdown answer preferred, AI-generated
 *     fallback), share modal, unreadable-upload modal, AI disclaimer.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { wordCountChip, mainsWordLimit, mainsTimeLimit, stripMarksSuffix } from '@/lib/mainsPattern';
import { useAuth } from '@/contexts/AuthContext';
import CuratedModelAnswer from './CuratedModelAnswer';

export interface MainsParameterScore {
  parameter: string;
  score: number;
  maxScore: number;
  comment?: string;
}

export interface StructuredModelAnswer {
  introduction: string;
  sections: Array<{ heading: string; points: string[] }>;
  conclusion: string;
}

export interface MainsQuestionResultData {
  score: number;
  maxScore: number;
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  detailedFeedback?: string | null;
  checkedCopyUrl?: string | null;
  checkedCopyPages?: Array<{ pageNumber: number; checkedCopyUrl?: string | null; status?: string; reason?: string }>;
  checkedCopyStatus?: string | null;
  wordCount?: number | null;
  submittedAt?: string | null;
  answerText?: string | null;
  keyTerms?: Array<{ term: string; found: boolean }>;
  nextAttemptFocus?: string | null;
  evaluatorConclusion?: string | null;
  modelAnswerKeyPoints?: string[];
  modelAnswerContent?: string | null;
  modelAnswerStructure?: StructuredModelAnswer | null;
  curatedModelAnswer?: string | null;
  curatedModelAnswerKeyPoints?: string[];
  parameterScores?: MainsParameterScore[];
  question?: {
    title?: string | null;
    questionText?: string | null;
    subject?: string | null;
    paper?: string | null;
    date?: string | null;
    marks?: number | null;
    year?: number | null;
  } | null;
}

export interface MainsResultsViewProps {
  /** One entry per mains question (Daily/PYQ pass one; Mock passes many). */
  results: MainsQuestionResultData[];
  /** Kicker inside the share modal, e.g. "Daily Answer Writing". */
  shareHeading: string;
  /** Route for "Rewrite Answer" / rewrite CTA. */
  rewriteRoute: string;
  /** Route for "Back to Dashboard". Defaults to /dashboard. */
  backRoute?: string;
  /** Breadcrumb label after "Dashboard ›", e.g. "Result". */
  breadcrumbLabel?: string;
}

type TabKey = 'feedback' | 'markup' | 'breakdown' | 'next';

const cleanModelAnswerText = (value: string) => value
  .replace(/(\*{1,3}|_{1,3}|`)/g, '')
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .replace(/\s+/g, ' ')
  .trim();

/** Converts existing curated Markdown into the JSON shape used by new reports. */
function structureLegacyModelAnswer(markdown: string | null | undefined): StructuredModelAnswer | null {
  if (!markdown?.trim()) return null;
  const result: StructuredModelAnswer = { introduction: '', sections: [], conclusion: '' };
  let target: 'introduction' | 'conclusion' | { heading: string; points: string[] } = 'introduction';
  const prose: string[] = [];
  const flushProse = () => {
    const text = cleanModelAnswerText(prose.join(' '));
    prose.length = 0;
    if (!text) return;
    if (target === 'introduction') result.introduction = [result.introduction, text].filter(Boolean).join(' ');
    else if (target === 'conclusion') result.conclusion = [result.conclusion, text].filter(Boolean).join(' ');
    else target.points.push(text);
  };

  for (const rawLine of markdown.replace(/\r/g, '').split('\n')) {
    const line = rawLine.trim();
    if (!line || /^(-{3,}|\*{3,})$/.test(line)) { flushProse(); continue; }
    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      flushProse();
      const title = cleanModelAnswerText(heading[1]);
      if (/^introduction$/i.test(title)) target = 'introduction';
      else if (/^conclusion$/i.test(title)) target = 'conclusion';
      else {
        const section = { heading: title, points: [] as string[] };
        result.sections.push(section); target = section;
      }
      continue;
    }
    const bullet = line.match(/^[-*+]\s+(.+)$/);
    if (bullet) { flushProse(); const text = cleanModelAnswerText(bullet[1]); if (text) target === 'introduction' ? result.introduction = [result.introduction, text].filter(Boolean).join(' ') : target === 'conclusion' ? result.conclusion = [result.conclusion, text].filter(Boolean).join(' ') : target.points.push(text); }
    else prose.push(line);
  }
  flushProse();
  if (!result.introduction && !result.sections.length && !result.conclusion) return null;
  return result;
}

const BETA_DISCLAIMER =
  'Jeet AI Mentor is currently in beta and evolving every day alongside you. Our evaluation engine is built to deliver meaningful, structured, and exam-relevant feedback, but it can still make mistakes. Use it as a smart companion alongside your mentors, notes, and judgment.';

/* Scoped CSS - every selector is prefixed with #dmcResults so the generic class
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

#dmcResults .qchip{display:inline-flex;align-items:center;gap:8px;padding:9px 14px;border-radius:12px;border:1px solid var(--line);background:#fff;color:#374151;font-size:13px;font-weight:700;cursor:pointer;transition:.2s;font-family:var(--font-body);}
#dmcResults .qchip:hover:not(.active){background:var(--bg);}
#dmcResults .qchip.active{background:var(--ink);border-color:var(--ink);color:#fff;}
#dmcResults .qchip .qchip-score{font-size:11px;font-weight:800;}
#dmcResults .qchip.active .qchip-score{color:var(--gold);}

/* ---- Question-wise breakdown list (clickable rows → detail) ---- */
#dmcResults .qbd-card{background:var(--card);border-radius:20px;border:1px solid var(--line);box-shadow:0 1px 2px rgba(15,23,42,.04),0 8px 24px rgba(15,23,42,.06);padding:24px;}
#dmcResults .qbd-head h3{font-size:17px;font-weight:700;color:var(--ink);display:flex;align-items:center;gap:8px;}
#dmcResults .qbd-head p{font-size:13px;color:var(--muted);margin-top:4px;}
#dmcResults .qbd-list{display:flex;flex-direction:column;gap:10px;margin-top:18px;}
#dmcResults .qbd-row{display:flex;align-items:center;gap:16px;width:100%;text-align:left;padding:16px 18px;border-radius:14px;border:1px solid var(--line);background:#fff;cursor:pointer;transition:transform .18s,box-shadow .18s,border-color .18s,background .18s;font-family:var(--font-body);}
#dmcResults .qbd-row:hover{background:var(--bg);border-color:#D5D9E2;transform:translateY(-1px);box-shadow:0 10px 24px -16px rgba(11,16,32,.28);}
#dmcResults .qbd-qn{flex-shrink:0;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:var(--ink);color:#fff;font-weight:800;font-size:14px;font-family:var(--font-body);}
#dmcResults .qbd-qt{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;}
#dmcResults .qbd-qt-text{font-size:14px;font-weight:700;color:var(--ink);line-height:1.4;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}
#dmcResults .qbd-qt small{font-size:12px;color:var(--muted);font-weight:600;}
#dmcResults .qbd-score{flex-shrink:0;font-size:20px;font-weight:800;font-family:var(--font-heading);line-height:1;}
#dmcResults .qbd-score small{font-size:13px;color:var(--muted);font-weight:600;}
#dmcResults .qbd-arrow{flex-shrink:0;color:#9AA2B1;}
#dmcResults .qbd-back{display:inline-flex;align-items:center;gap:6px;background:none;border:none;color:var(--muted);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--font-body);margin-bottom:14px;transition:color .2s;padding:0;}
#dmcResults .qbd-back:hover{color:var(--ink);}

#dmcResults .question-card{background:var(--card);border-radius:20px;border:1px solid var(--line);box-shadow:0 1px 2px rgba(15,23,42,.04),0 8px 24px rgba(15,23,42,.06);padding:20px 24px;}
#dmcResults .question-text{font-family:var(--font-heading);font-size:16px;line-height:1.7;color:#101828;font-style:italic;padding:16px 18px;border-radius:12px;background:#F9FAFB;border-left:4px solid var(--gold);margin:0;white-space:pre-line;}

#dmcResults .score-banner{background:radial-gradient(120% 120% at 0% 0%,#1a2240 0%,#0b1020 60%);border-radius:24px;padding:clamp(28px,3.4vw,48px) clamp(24px,3.4vw,48px);color:#fff;position:relative;overflow:hidden;}
#dmcResults .score-banner::before{content:"";position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.06) 1px,transparent 1px);background-size:18px 18px;pointer-events:none;}
#dmcResults .score-banner-glow{position:absolute;top:-60px;right:-60px;width:240px;height:240px;border-radius:50%;background:rgba(245,184,0,.06);filter:blur(2px);pointer-events:none;}
#dmcResults .score-banner-glow2{position:absolute;bottom:-80px;left:-40px;width:200px;height:200px;border-radius:50%;background:rgba(245,184,0,.03);filter:blur(2px);pointer-events:none;}
#dmcResults .score-banner-inner{display:flex;align-items:center;justify-content:space-between;gap:clamp(24px,3vw,40px);position:relative;z-index:1;}
#dmcResults .score-label{font-size:10px;letter-spacing:.18em;color:#F5B800;font-weight:700;text-transform:uppercase;}
#dmcResults .score-headline{font-family:var(--font-heading);font-size:clamp(24px,2.6vw,32px);color:#fff;line-height:1.3;}
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
#dmcResults .markup-scroll{overflow:auto;max-height:640px;background:linear-gradient(180deg,#f8fafc 0%,#eef2f7 100%);padding:22px;}
#dmcResults .markup-paper{width:min(760px,100%);margin:0 auto;padding:38px 42px;background:#fff;border:1px solid rgba(15,23,42,.10);box-shadow:0 18px 46px rgba(15,23,42,.10);min-height:520px;transform-origin:top center;transition:transform .3s;}
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
/* Hover: a small lift + a slightly deeper version of the same warm gold shadow.
   Kept to 2px / 0.4% scale so the banner settles rather than pops. */
#dmcResults .model-answer-cta{transition:transform .28s cubic-bezier(.22,1,.36,1),box-shadow .28s ease;will-change:transform;}
#dmcResults .model-answer-cta:hover{transform:translateY(-2px) scale(1.004);box-shadow:0 14px 30px rgba(129,98,22,.14),inset 0 1px 0 rgba(255,255,255,.9);}
@media (prefers-reduced-motion: reduce){#dmcResults .model-answer-cta{transition:none;}#dmcResults .model-answer-cta:hover{transform:none;}}
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
  #dmcResults .score-banner-inner{flex-direction:column;align-items:center;text-align:center;gap:22px;}
  #dmcResults .score-sub{margin-left:auto!important;margin-right:auto!important;}
  #dmcResults .next-steps-grid{grid-template-columns:1fr;}
  #dmcResults .next-card p{max-width:100%;}
  #dmcResults .model-answer-cta{flex-direction:column;text-align:left;align-items:flex-start;}
  #dmcResults .feedback-grid{grid-template-columns:1fr!important;}
  #dmcResults .feedback-divider{display:none!important;}
}
`;

function checkedPagesOf(q: MainsQuestionResultData): Array<{ pageNumber: number; checkedCopyUrl?: string | null }> {
  const pages = (q.checkedCopyPages || []).filter((p) => p.checkedCopyUrl);
  if (pages.length > 0) return pages;
  if (q.checkedCopyUrl) return [{ pageNumber: 1, checkedCopyUrl: q.checkedCopyUrl }];
  return [];
}

/** True when the upload could not be read as a handwritten answer. */
function isUnreadableUpload(q: MainsQuestionResultData): boolean {
  const hasNoAnswerText = !q.answerText?.trim();
  const hasNoCheckedCopy = checkedPagesOf(q).length === 0;
  const isLowScore = (q.score ?? 0) === 0;
  const hasUnreadableMessage = q.improvements?.some(
    (i) =>
      i.toLowerCase().includes("couldn't read") ||
      i.toLowerCase().includes('handwriting') ||
      i.toLowerCase().includes('uploaded file') ||
      i.toLowerCase().includes('readable response')
  );
  return hasNoAnswerText && hasNoCheckedCopy && (isLowScore || Boolean(hasUnreadableMessage));
}

export default function MainsResultsView({
  results,
  shareHeading,
  rewriteRoute,
  backRoute = '/dashboard',
  breadcrumbLabel = 'Result',
}: MainsResultsViewProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [selectedQ, setSelectedQ] = useState(0);
  const [tab, setTab] = useState<TabKey>('feedback');
  // Master → detail navigation. Multi-question tests (Mock) open on the
  // question-wise breakdown list; picking a row drills into its detail. Single
  // question results (Daily / PYQ) skip the list and render the detail directly.
  const [view, setView] = useState<'list' | 'detail'>(results.length > 1 ? 'list' : 'detail');
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [modelAnswerOpen, setModelAnswerOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);

  // Markup viewer state
  const [markupPage, setMarkupPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [fullscreen, setFullscreen] = useState(false);
  const [unreadableModalOpen, setUnreadableModalOpen] = useState(false);
  const unreadableShownRef = useRef(false);

  const multi = results.length > 1;
  const data = results[Math.min(selectedQ, results.length - 1)];

  // Open a question's detailed evaluation from the breakdown list.
  const openQuestion = (i: number) => {
    setSelectedQ(i);
    setMarkupPage(1);
    setTab('feedback');
    setView('detail');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Aggregate score across all questions (equals the single question's score
  // for Daily/PYQ).
  const totalScore = results.reduce((a, b) => a + (b.score || 0), 0);
  const totalMax = results.reduce((a, b) => a + (b.maxScore || 0), 0) || 1;
  const scorePercent = Math.max(0, Math.min(100, Math.round((totalScore / totalMax) * 100)));
  const reportName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email?.split('@')[0] || 'Aspirant';
  const reportInitials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || 'AS';

  // Checked-copy pages for the SELECTED question. Typed answers have none -
  // in that case the Examiner's Markup tab is hidden entirely.
  const realImagePages = checkedPagesOf(data);
  const hasMarkup = realImagePages.length > 0;

  const tabs: Array<{ key: TabKey; label: string }> = useMemo(() => {
    const list: Array<{ key: TabKey; label: string }> = [{ key: 'feedback', label: 'Feedback' }];
    if (hasMarkup) list.push({ key: 'markup', label: "Examiner's Markup" });
    list.push({ key: 'breakdown', label: 'Score Breakdown' });
    list.push({ key: 'next', label: "What's Next" });
    return list;
  }, [hasMarkup]);

  // Selecting a question without markup while on the markup tab falls back to Feedback.
  useEffect(() => {
    if (tab === 'markup' && !hasMarkup) setTab('feedback');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedQ, hasMarkup]);

  // Unreadable-upload popup: shown once when any submitted upload could not be read.
  useEffect(() => {
    if (unreadableShownRef.current) return;
    if (results.some(isUnreadableUpload)) {
      unreadableShownRef.current = true;
      setUnreadableModalOpen(true);
    }
  }, [results]);

  // Escape exits fullscreen markup
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  const strengths = data.strengths || [];
  const improvements = data.improvements || [];
  const suggestions = data.suggestions || [];
  const keyTerms = data.keyTerms || [];
  const nextFocus = data.nextAttemptFocus?.trim() || '';
  const conclusion = data.evaluatorConclusion?.trim() || '';
  const wordCount = data.wordCount ?? 0;
  const detailedFeedback = data.detailedFeedback?.trim() ?? '';

  const totalMarkupPages = Math.max(1, realImagePages.length);
  const safeMarkupPage = Math.max(1, Math.min(totalMarkupPages, markupPage));

  const rubricRows = useMemo(() => {
    if (!data.parameterScores?.length) return [];
    return data.parameterScores.map((p) => {
      const pct = p.maxScore > 0 ? Math.round((p.score / p.maxScore) * 100) : 0;
      const color = pct >= 50 ? '#16A34A' : pct >= 15 ? '#E07B00' : '#DC2626';
      return { label: p.parameter, percent: pct, fraction: `${p.score}/${p.maxScore}`, color, note: p.comment || '' };
    });
  }, [data.parameterScores]);

  const breadcrumbDate = useMemo(() => {
    const raw = data.question?.date || data.submittedAt;
    const d = raw ? new Date(raw) : new Date();
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }, [data.question?.date, data.submittedAt]);
  const paperLabel = data.question?.paper || 'GS Paper';
  const subjectLabel = data.question?.subject || '';
  const marks = data.question?.marks ?? data.maxScore ?? 15;
  const questionText = stripMarksSuffix(data.question?.questionText?.trim() || '');
  const questionTitle = data.question?.title?.trim() || questionText;
  // The model-answer modal shows the actual QUESTION it answers (not the topic
  // title). Prefer the real question text; fall back to the title only when the
  // question text isn't available.
  const modalQuestion = questionText || questionTitle;
  // Word-limit verdict is derived, not stored: it's a pure function of the
  // student's word count and the question's marks, so it can never drift from
  // the limit the evaluator graded against.
  const wordChip = wordCountChip(wordCount, marks);

  const hasModelAnswer = Boolean(
    data.curatedModelAnswer ||
    data.modelAnswerStructure ||
    data.modelAnswerContent ||
    (data.modelAnswerKeyPoints && data.modelAnswerKeyPoints.length > 0)
  );

  const copyLink = () => {
    const url = typeof window !== 'undefined' ? window.location.href : 'risewithjeet.com';
    if (navigator?.clipboard) navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadEvaluationReport = async () => {
    if (isDownloadingReport || typeof window === 'undefined') return;
    setIsDownloadingReport(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const left = 42, right = 553, width = 595.28, height = 841.89, contentWidth = right - left;
      const reportDate = new Date(data.question?.date || data.submittedAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      const plain = (value?: string | null) => (value || '')
        // Model answers are authored as Markdown. jsPDF renders plain text, so
        // remove the syntax while retaining the readable heading/link text.
        .replace(/(^|\n)\s{0,3}#{1,6}\s+/g, '$1')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/(\*{1,3}|_{1,3}|`)/g, '')
        .replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/[\u2013\u2014]/g, '-')
        .replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ').trim();
      let page = 1;
      let y = 0;
      let brandMark: string | null = null;
      try {
        const response = await fetch('/risewithjeet_favicon.jpg');
        const blob = await response.blob();
        brandMark = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch {
        // The text brand remains usable when the decorative mark is unavailable.
      }
      const footer = () => {
        doc.setDrawColor(226, 232, 240); doc.setLineWidth(.75); doc.line(left, height - 45, right, height - 45);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
        doc.text('Telegram  |  YouTube  |  www.risewithjeet.com', width / 2, height - 31, { align: 'center' });
        doc.setFontSize(7.5); doc.text(`Evaluation Report | ${reportDate}`, left, height - 17); doc.text(`Page ${page}`, right, height - 17, { align: 'right' });
      };
      const header = (section = 'Performance Report') => {
        doc.setFillColor(15, 23, 42); doc.rect(0, 0, width, 4, 'F'); doc.setFillColor(217, 119, 6); doc.rect(width * .65, 0, width * .35, 4, 'F');
        if (brandMark) doc.addImage(brandMark, 'JPEG', left, 18, 28, 28);
        const brandX = left + (brandMark ? 36 : 0);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(15, 23, 42); doc.text('RiseWithJeet', brandX, 34);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 116, 139); doc.text(shareHeading.toUpperCase(), brandX, 47);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(15, 23, 42); doc.text(section.toUpperCase(), right, 34, { align: 'right' });
        doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139); doc.text(reportDate, right, 47, { align: 'right' });
        doc.setDrawColor(15, 23, 42); doc.setLineWidth(1.3); doc.line(left, 59, right, 59); y = 82;
      };
      const newPage = (section?: string) => { footer(); doc.addPage(); page += 1; header(section); };
      const ensure = (space: number, section?: string) => { if (y + space > height - 55) newPage(section); };
      const text = (value: string, x: number, maxWidth: number, lineHeight = 12, section = 'Evaluation Report') => {
        const lines = doc.splitTextToSize(plain(value), maxWidth) as string[];
        lines.forEach((line) => { ensure(lineHeight + 2, section); doc.text(line, x, y); y += lineHeight; });
      };
      const card = (x: number, top: number, w: number, h: number, fill: [number, number, number], border: [number, number, number] = [226, 232, 240]) => {
        doc.setFillColor(...fill); doc.setDrawColor(...border); doc.setLineWidth(.75); doc.roundedRect(x, top, w, h, 8, 8, 'FD');
      };
      const sectionHead = (kicker: string, subtitle: string, color: [number, number, number], section = 'Evaluation Report') => {
        ensure(34, section);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...color); doc.text(kicker.toUpperCase(), left, y);
        y += 12; doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(100, 116, 139); doc.text(subtitle, left, y);
        y += 9; doc.setDrawColor(226, 232, 240); doc.setLineWidth(.65); doc.line(left, y, right, y); y += 12;
      };
      const listCard = (title: string, values: string[], accent: [number, number, number], section = 'Evaluation Report') => {
        const items = values.length ? values : ['No specific observations were recorded.'];
        const lines = items.flatMap((item, index) => doc.splitTextToSize(`${index + 1}. ${plain(item)}`, contentWidth - 32) as string[]);
        const cardHeight = 32 + lines.length * 10;
        ensure(cardHeight + 10, section);
        card(left, y, contentWidth, cardHeight, [250, 250, 250]);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...accent); doc.text(title.toUpperCase(), left + 14, y + 18);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.4); doc.setTextColor(15, 23, 42); doc.text(lines, left + 14, y + 35);
        y += cardHeight + 9;
      };

      header();
      doc.setFillColor(15, 23, 42); doc.roundedRect(left, y, contentWidth, 72, 10, 10, 'F');
      doc.setFillColor(251, 191, 36); doc.circle(left + 30, y + 36, 18, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(15, 23, 42); doc.text(reportInitials, left + 30, y + 40, { align: 'center' });
      doc.setFontSize(14); doc.setTextColor(255, 255, 255); doc.text(reportName, left + 58, y + 29);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(203, 213, 225); doc.text(`${shareHeading} | ${paperLabel}${subjectLabel ? ` | ${subjectLabel}` : ''}`, left + 58, y + 46);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(251, 191, 36); doc.text(`${totalScore}/${totalMax}`, right - 18, y + 32, { align: 'right' });
      doc.setFontSize(8); doc.text('SCORE', right - 18, y + 47, { align: 'right' }); y += 86;

      const chipLabels = [paperLabel, subjectLabel, `${marks} Marks`, `${mainsWordLimit(marks)} Words`, wordCount ? `${wordCount} written` : 'Word count unavailable'].filter(Boolean);
      let chipX = left;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
      for (const label of chipLabels) {
        const chipWidth = Math.min(112, doc.getTextWidth(String(label)) + 18);
        doc.setFillColor(250, 250, 250); doc.setDrawColor(226, 232, 240); doc.roundedRect(chipX, y, chipWidth, 22, 4, 4, 'FD');
        doc.setTextColor(String(label).includes('written') ? 22 : 15, String(label).includes('written') ? 163 : 23, String(label).includes('written') ? 74 : 42);
        doc.text(String(label), chipX + chipWidth / 2, y + 14, { align: 'center' }); chipX += chipWidth + 6;
      }
      y += 34;

      const questionLines = doc.splitTextToSize(`"${plain(questionText || questionTitle)}"`, contentWidth - 32) as string[];
      const questionHeight = 28 + questionLines.length * 11;
      card(left, y, contentWidth, questionHeight, [255, 249, 230], [253, 230, 138]);
      doc.setFillColor(251, 191, 36); doc.roundedRect(left, y, 3, questionHeight, 2, 2, 'F');
      doc.setFont('helvetica', 'italic'); doc.setFontSize(8.8); doc.setTextColor(51, 65, 85); doc.text(questionLines, left + 16, y + 18); y += questionHeight + 16;

      sectionHead('Personalised Feedback', 'Actionable insights to help you improve', [37, 99, 235]);
      listCard('Strengths', data.strengths || [], [22, 163, 74]);
      listCard('Areas to Improve', data.improvements || [], [234, 88, 12]);
      listCard('Recommendations', data.suggestions || [], [8, 145, 178]);

      if (data.keyTerms?.length) {
        sectionHead('Key Terms Analysis', 'Expected terminology', [220, 38, 38]);
        const termLines = data.keyTerms.map((term) => `${term.found ? '[FOUND]' : '[MISSED]'} ${plain(term.term)}`);
        const termHeight = 28 + Math.ceil(termLines.length / 2) * 14;
        ensure(termHeight + 10);
        card(left, y, contentWidth, termHeight, [250, 250, 250]);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); 
        termLines.forEach((term, index) => {
          const found = term.startsWith('[FOUND]'); const x = left + 14 + (index % 2) * 246; const termY = y + 18 + Math.floor(index / 2) * 14;
          doc.setTextColor(found ? 22 : 220, found ? 163 : 38, found ? 74 : 38); doc.text(term, x, termY);
        });
        y += termHeight + 12;
      }

      const frontRows = data.parameterScores || [];
      if (frontRows.length) {
        sectionHead('7-Parameter Rubric', 'Score breakdown', [217, 119, 6]);
        doc.setFillColor(250, 250, 250); doc.rect(left, y, contentWidth, 24, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(100, 116, 139);
        doc.text('PARAMETER', left + 10, y + 15); doc.text('SCORE', left + 190, y + 15); doc.text('REMARK', left + 248, y + 15); y += 24;
        for (const row of frontRows) {
          const remarkLines = doc.splitTextToSize(plain(row.comment || ''), contentWidth - 260) as string[];
          const rowHeight = Math.max(31, 15 + remarkLines.length * 9); ensure(rowHeight, 'Score Breakdown');
          doc.setDrawColor(226, 232, 240); doc.line(left, y + rowHeight, right, y + rowHeight);
          doc.setFont('helvetica', 'bold'); doc.setFontSize(8.2); doc.setTextColor(15, 23, 42); doc.text(plain(row.parameter), left + 10, y + 16);
          doc.setTextColor(row.score > 0 ? 217 : 220, row.score > 0 ? 119 : 38, row.score > 0 ? 6 : 38); doc.text(`${row.score} / ${row.maxScore}`, left + 208, y + 16, { align: 'center' });
          doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); doc.setTextColor(100, 116, 139); doc.text(remarkLines, left + 248, y + 14); y += rowHeight;
        }
      }

      newPage('Detailed Evaluation');
      results.forEach((result, index) => {
        if (index > 0) newPage('Detailed Evaluation');
        const q = stripMarksSuffix(result.question?.questionText || result.question?.title || `Question ${index + 1}`);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(15, 23, 42); doc.text(`Question ${index + 1} Evaluation`, left, y); y += 18;
        doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.setTextColor(51, 65, 85); text(q, left, contentWidth, 12, 'Detailed Evaluation'); y += 10;
        const rows = result.parameterScores || [];
        if (rows.length) {
          doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(37, 99, 235); doc.text('RUBRIC BREAKDOWN', left, y); y += 14;
          rows.forEach((row) => { ensure(40, 'Detailed Evaluation'); card(left, y, contentWidth, 32, [255, 255, 255]); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(15, 23, 42); doc.text(plain(row.parameter), left + 12, y + 14); doc.setTextColor(217, 119, 6); doc.text(`${row.score}/${row.maxScore}`, right - 12, y + 14, { align: 'right' }); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.8); doc.setTextColor(100, 116, 139); doc.text(doc.splitTextToSize(plain(row.comment || ''), contentWidth - 24).slice(0, 1), left + 12, y + 26); y += 40; });
        }
      });

      newPage("Examiner's Comments");
      results.forEach((result, index) => {
        if (index > 0) newPage("Examiner's Comments");
        const q = result.question?.questionText || result.question?.title || `Question ${index + 1}`;
        sectionHead("Examiner's Comments", multi ? `Question ${index + 1} detailed remarks` : 'Detailed examiner remarks', [124, 58, 237], "Examiner's Comments");
        if (multi) {
          doc.setFont('helvetica', 'italic'); doc.setFontSize(8.5); doc.setTextColor(51, 65, 85); text(q, left, contentWidth, 11, "Examiner's Comments"); y += 8;
        }
        const feedback = result.detailedFeedback || result.suggestions?.join(' ') || 'Review the rubric and recommendations before your next attempt.';
        const feedbackLines = doc.splitTextToSize(plain(feedback), contentWidth - 32) as string[];
        const feedbackHeight = 32 + feedbackLines.length * 10;
        ensure(feedbackHeight + 10, "Examiner's Comments"); card(left, y, contentWidth, feedbackHeight, [250, 250, 250]);
        doc.setFillColor(203, 213, 225); doc.rect(left + 14, y + 13, 3, 15, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(71, 85, 105); doc.text(multi ? `QUESTION ${index + 1} REMARKS` : 'OVERALL REMARKS', left + 24, y + 22);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(15, 23, 42); doc.text(feedbackLines, left + 14, y + 42); y += feedbackHeight + 10;

        if (result.nextAttemptFocus) listCard('Next Attempt Focus', [result.nextAttemptFocus], [13, 148, 136], "Examiner's Comments");
        if (result.evaluatorConclusion) listCard("Evaluator's Conclusion", [result.evaluatorConclusion], [159, 18, 57], "Examiner's Comments");

        const modelAnswer = result.curatedModelAnswer || result.modelAnswerContent || result.modelAnswerKeyPoints?.join('\n') || '';
        const structuredModelAnswer = result.modelAnswerStructure || structureLegacyModelAnswer(modelAnswer);
        if (structuredModelAnswer || modelAnswer) {
          ensure(130, 'Model Answer');
          sectionHead('Model Answer', 'Comprehensive answer framework', [217, 119, 6], 'Model Answer');
          const bannerHeight = 49;
          card(left, y, contentWidth, bannerHeight, [255, 249, 230], [253, 230, 138]);
          doc.setFillColor(245, 158, 11); doc.circle(left + 23, y + 23, 10, 'F');
          doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(255, 255, 255); doc.text('!', left + 23, y + 27, { align: 'center' });
          doc.setTextColor(146, 64, 14); doc.setFontSize(9); doc.text('REFERENCE ONLY', left + 42, y + 19);
          doc.setFont('helvetica', 'normal'); doc.setFontSize(7.8); doc.setTextColor(120, 113, 108); doc.text("Read after writing your own answer. Understand gaps; do not memorise it.", left + 42, y + 34); y += bannerHeight + 10;

          const tagValues = [result.question?.paper || paperLabel, result.question?.subject || subjectLabel].filter(Boolean);
          let tagX = left;
          doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
          tagValues.forEach((tag) => { const tagWidth = doc.getTextWidth(String(tag)) + 18; doc.setFillColor(219, 234, 254); doc.roundedRect(tagX, y, tagWidth, 20, 10, 10, 'F'); doc.setTextColor(30, 64, 175); doc.text(String(tag), tagX + tagWidth / 2, y + 13, { align: 'center' }); tagX += tagWidth + 7; });
          y += 29;
          doc.setFont('helvetica', 'italic'); doc.setFontSize(8.2); doc.setTextColor(15, 23, 42); text(`"${q}"`, left, contentWidth, 10, 'Model Answer'); y += 7;
          doc.setDrawColor(226, 232, 240); doc.line(left, y, right, y); y += 14;
          const modelBlocks = structuredModelAnswer
            ? [
                structuredModelAnswer.introduction ? { title: 'INTRODUCTION', values: [structuredModelAnswer.introduction], bullets: false } : null,
                ...structuredModelAnswer.sections.map((section) => ({ title: section.heading, values: section.points, bullets: true })),
                structuredModelAnswer.conclusion ? { title: 'CONCLUSION', values: [structuredModelAnswer.conclusion], bullets: false } : null,
              ].filter((block): block is { title: string; values: string[]; bullets: boolean } => Boolean(block))
            : [{ title: 'MODEL ANSWER', values: [modelAnswer], bullets: false }];

          for (const block of modelBlocks) {
            const blockLines = block.values.flatMap((value) => {
              const lines = doc.splitTextToSize(`${block.bullets ? '• ' : ''}${plain(value)}`, contentWidth - 28) as string[];
              return lines;
            });
            let remainingLines = [...blockLines];
            let isContinuation = false;
            while (remainingLines.length) {
              if (y + 46 > height - 55) newPage('Model Answer');
              const isConclusion = block.title === 'CONCLUSION';
              doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(isConclusion ? 22 : block.title === 'INTRODUCTION' ? 79 : 15, isConclusion ? 163 : block.title === 'INTRODUCTION' ? 70 : 23, isConclusion ? 74 : block.title === 'INTRODUCTION' ? 229 : 42);
              doc.text(isContinuation ? `${block.title} (CONTINUED)` : block.title, left + (isConclusion ? 14 : 10), y + 2);
              if (!isConclusion) { doc.setFillColor(block.title === 'INTRODUCTION' ? 79 : 245, block.title === 'INTRODUCTION' ? 70 : 158, block.title === 'INTRODUCTION' ? 229 : 11); doc.roundedRect(left, y - 7, 3, 14, 2, 2, 'F'); }
              y += 12;
              const lineCapacity = Math.max(1, Math.floor((height - 55 - y - 24) / 12));
              const pageLines = remainingLines.splice(0, lineCapacity);
              const blockHeight = 30 + pageLines.length * 12;
              if (isConclusion) card(left, y, contentWidth, blockHeight, [240, 253, 244], [187, 247, 208]);
              doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(51, 65, 85);
              doc.text(pageLines, left + (isConclusion ? 14 : 4), y + 18);
              y += blockHeight + 12;
              if (remainingLines.length) { newPage('Model Answer'); isContinuation = true; }
            }
          }
        }
      });
      footer();
      doc.save(`mains-evaluation-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('Unable to generate mains evaluation report', error);
    } finally { setIsDownloadingReport(false); }
  };

  const ringCirc = 2 * Math.PI * 50;

  const NEXT_CARDS = [
    { tone: 'blue', icon: '✍️', title: 'Rewrite with Feedback', desc: 'Rewrite your answer using the examiner comments and missed-demand checklist.', pill: '~15 min', action: 'Rewrite', route: rewriteRoute },
    { tone: 'rose', icon: '✒️', title: 'Practice Answer Writing', desc: 'Write with your own question - create a fresh prompt and get targeted feedback.', pill: '10 marks · 150 words', action: 'Write', route: '/dashboard/mains-answer-evaluator' },
    { tone: 'green', icon: '🧾', title: 'Read & Practice MCQs', desc: 'Read a short concept note, then solve targeted MCQs from the areas you missed.', pill: '5 min · 10 MCQs', action: 'Practice', route: '/dashboard/daily-mcq' },
  ] as const;

  return (
    <div id="dmcResults">
      <style dangerouslySetInnerHTML={{ __html: SCOPED_CSS }} />

      {/* Unreadable-upload popup: appears when the user submits an image that
          is not a readable handwritten answer (random image, cover page, etc.) */}
      {unreadableModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(11,16,32,0.55)',
            backdropFilter: 'blur(4px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => setUnreadableModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="unreadable-title"
        >
          <div
            style={{
              width: '100%',
              maxWidth: 520,
              background: '#fff',
              borderRadius: 24,
              padding: '32px 28px',
              boxShadow: '0 24px 60px rgba(11,16,32,0.22)',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 56, marginBottom: 12 }}>📝</div>
            <h2 id="unreadable-title" style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', marginBottom: 10 }}>
              Upload not recognized as an answer
            </h2>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20 }}>
              We could not detect any handwritten answer text in the image you uploaded. It may be a cover page, a random photo, or too unclear to read.
            </p>
            <div style={{ textAlign: 'left', background: '#F8FAFC', borderRadius: 16, padding: '18px 20px', marginBottom: 24 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>What you can do</p>
              <ul style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.7, paddingLeft: 18, margin: 0 }}>
                <li>Upload a clear photo of your actual handwritten answer.</li>
                <li>Use bright, even lighting and keep the page flat and in full frame.</li>
                <li>Make sure the handwriting is dark and readable.</li>
                <li>Or type your answer directly for instant evaluation.</li>
              </ul>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn-primary" type="button" onClick={() => setUnreadableModalOpen(false)}>
                Got it
              </button>
              <Link href={rewriteRoute} style={{ textDecoration: 'none' }}>
                <button className="btn-secondary" type="button">
                  Upload new answer
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="container">

        {/* Breadcrumb + top actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
            <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontFamily: 'var(--font-body)', fontSize: 13 }}>Dashboard</button>
            <span style={{ margin: '0 4px' }}>›</span>
            <span>{breadcrumbLabel}</span><span style={{ margin: '0 4px' }}>·</span><span>{breadcrumbDate}</span>
            <span className="chip chip-purple" style={{ marginLeft: 4 }}>{paperLabel}</span>
            {subjectLabel && <span className="chip chip-blue">{subjectLabel}</span>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="action-btn action-btn-share" style={{ padding: '8px 14px', fontSize: 12 }} onClick={() => setShareOpen(true)}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
              Share
            </button>
            <button type="button" className="action-btn action-btn-copy" style={{ padding: '8px 14px', fontSize: 12 }} onClick={downloadEvaluationReport} disabled={isDownloadingReport}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                {isDownloadingReport ? 'Generating Report...' : 'Download Copy'}
            </button>
          </div>
        </div>

        {/* Score banner */}
        <div className="score-banner" style={{ marginBottom: 24 }}>
          <div className="score-banner-glow" />
          <div className="score-banner-glow2" />
          <div className="score-banner-inner">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="score-label" style={{ marginBottom: 16 }}>Jeet AI · Evaluation Ready</div>
              <div className="score-headline" style={{ marginBottom: 12 }}>Your answer{multi ? 's have' : ' has'} been <span className="accent">evaluated.</span></div>
              <p className="score-sub" style={{ maxWidth: 440, margin: 0 }}>
                {multi
                  ? 'Below is your aggregated scorecard along with model answers and improvement notes for each question.'
                  : 'Below is your scorecard along with model answers and improvement notes for your answer.'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <div className="score-ring">
                <div className="score-glow" />
                <svg width="120" height="120" viewBox="0 0 130 130">
                  <circle className="ring-track" cx="65" cy="65" r="50" />
                  <circle className="ring-progress" cx="65" cy="65" r="50" strokeDasharray={ringCirc} strokeDashoffset={ringCirc * (1 - scorePercent / 100)} />
                </svg>
                <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="score-num">{totalScore}</span>
                  <span className="score-total">/ {totalMax}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Question-wise breakdown - clickable rows that open each question's
            detailed evaluation. Mirrors the live reference's question navigation
            concept; data comes straight from the real evaluation results. */}
        {multi && view === 'list' && (
          <div className="qbd-card" style={{ marginBottom: 16 }}>
            <div className="qbd-head">
              <h3>📊 Question-wise breakdown</h3>
              <p>Select a question to open its detailed evaluation.</p>
            </div>
            <div className="qbd-list">
              {results.map((mq, i) => {
                const mPct = mq.maxScore > 0 ? Math.round((mq.score / mq.maxScore) * 100) : 0;
                const tone = mPct >= 60 ? '#16A34A' : mPct >= 40 ? '#D97706' : '#DC2626';
                const qText = stripMarksSuffix(mq.question?.questionText?.trim() || mq.question?.title?.trim() || `Question ${i + 1}`);
                const qPaper = mq.question?.paper?.trim() || '';
                const qSubject = mq.question?.subject?.trim() || '';
                const qMarks = mq.question?.marks ?? mq.maxScore ?? 15;
                const meta = [`${qMarks} marks`, qPaper, qSubject].filter(Boolean).join(' · ');
                return (
                  <button key={i} type="button" className="qbd-row" onClick={() => openQuestion(i)}>
                    <span className="qbd-qn">Q{i + 1}</span>
                    <span className="qbd-qt">
                      <span className="qbd-qt-text">{qText}</span>
                      <small>{meta}</small>
                    </span>
                    <span className="qbd-score" style={{ color: tone }}>
                      {mq.score}<small> / {mq.maxScore}</small>
                    </span>
                    <svg className="qbd-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {(!multi || view === 'detail') && (
        <>
        {multi && (
          <button type="button" className="qbd-back" onClick={() => setView('list')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
            Back to all questions
          </button>
        )}

        {/* Question selector chips (multi-question tests only) */}
        {multi && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {results.map((mq, i) => {
              const active = i === selectedQ;
              const mPct = mq.maxScore > 0 ? Math.round((mq.score / mq.maxScore) * 100) : 0;
              const tone = mPct >= 60 ? '#16A34A' : mPct >= 40 ? '#D97706' : '#DC2626';
              return (
                <button
                  key={i}
                  type="button"
                  className={`qchip${active ? ' active' : ''}`}
                  onClick={() => { setSelectedQ(i); setMarkupPage(1); }}
                >
                  Q{i + 1}
                  <span className="qchip-score" style={active ? undefined : { color: tone }}>
                    {mq.score}/{mq.maxScore}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Question text (when available) */}
        {questionText && (
          <div className="question-card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="chip chip-purple">{paperLabel}</span>
                {subjectLabel && <span className="chip chip-blue">{subjectLabel}</span>}
                {data.question?.year && <span className="chip chip-red">UPSC {data.question.year}</span>}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--muted)', textTransform: 'uppercase' }}>
                {multi ? `Question ${selectedQ + 1} · ` : ''}{marks} marks
              </span>
            </div>
            <p className="question-text">&quot;{questionText}&quot;</p>
          </div>
        )}

        {/* Tab bar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 30, padding: '12px 0', background: 'rgba(248,247,244,0.92)', backdropFilter: 'blur(12px)' }}>
          <div className="tab-bar">
            {tabs.map((t) => (
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
                <span
                  title={`UPSC pattern: ${marks}-marker → ${wordChip.limit} words`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 100, background: wordChip.bg, fontSize: 12, fontWeight: 600, color: wordChip.color }}
                >
                  {wordChip.label} <span style={{ fontSize: 14 }}>{wordChip.icon}</span>
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>Actionable insights to help you improve, not just a score.</p>

              {wordChip.status !== 'within' && (
                <div style={{ marginTop: 14, borderRadius: 12, padding: '12px 16px', background: wordChip.bg, border: `1px solid ${wordChip.color}22`, fontSize: 13, lineHeight: 1.6, color: wordChip.color }}>
                  <strong>Word limit breached.</strong>{' '}
                  {wordChip.status === 'over'
                    ? `A ${marks}-mark answer must be about ${wordChip.limit} words - you wrote ${wordCount}. In the real exam the surplus goes unread and eats time meant for other questions. Trim to the limit and prioritise analysis over listing.`
                    : `A ${marks}-mark answer should be about ${wordChip.limit} words - you wrote only ${wordCount}. At this length the question's demand cannot be fully developed.`}
                </div>
              )}

              <div className="feedback-grid" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', gap: 0, marginTop: 20 }}>
                {/* What You Did Well */}
                <div style={{ padding: '0 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <span style={{ width: 24, height: 24, borderRadius: 8, background: '#E6F7EC', display: 'grid', placeItems: 'center', fontSize: 12 }}>✅</span>
                    What You Did Well
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {strengths.length > 0 ? strengths.map((s, i) => (
                      <div key={i} style={{ background: '#E6F7EC', borderRadius: 12, padding: 12, fontSize: 13, lineHeight: 1.5 }}>→ {s}</div>
                    )) : (
                      <div style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>No strengths recorded for this submission.</div>
                    )}
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
                    {improvements.length > 0 ? improvements.map((s, i) => (
                      <div key={i} style={{ background: '#FFF1E0', borderRadius: 12, padding: 12, fontSize: 13, lineHeight: 1.5 }}>▲ {s}</div>
                    )) : (
                      <div style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>No improvement areas recorded.</div>
                    )}
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
                    {suggestions.length > 0 ? suggestions.map((s, i) => (
                      <div key={i} style={{ background: '#E8F0FF', borderRadius: 12, padding: 12, fontSize: 13, lineHeight: 1.5 }}>◆ {s}</div>
                    )) : (
                      <div style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>No suggestions recorded.</div>
                    )}
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
                {keyTerms.length > 0 ? keyTerms.map((kt, i) => (
                  <span key={i} className={`key-term${kt.found ? ' found' : ''}`}><span style={{ fontSize: 10 }}>{kt.found ? '✓' : '✗'}</span> {kt.term}</span>
                )) : (
                  <div style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>No key-term analysis available.</div>
                )}
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--accent-red)', fontWeight: 600 }}>✗ Missed</span> terms should appear in your next attempt.
              </div>
            </div>

            {/* Next Attempt Focus */}
            {nextFocus && (
              <div style={{ borderRadius: 16, padding: 20, background: '#EEF0FF', border: '1px solid rgba(99,102,241,0.1)', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 14 }}>🎯</span>
                  <span style={{ fontSize: 10, letterSpacing: '0.12em', fontWeight: 700, color: '#4F46E5' }}>NEXT ATTEMPT FOCUS</span>
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--ink)' }}>{nextFocus}</p>
              </div>
            )}

            {/* Evaluator's Conclusion */}
            {conclusion && (
              <div style={{ borderRadius: 16, padding: 20, background: '#E6F7EC', border: '1px solid rgba(22,163,74,0.1)', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 14 }}>✅</span>
                  <span style={{ fontSize: 10, letterSpacing: '0.12em', fontWeight: 700, color: '#16A34A' }}>EVALUATOR&apos;S CONCLUSION</span>
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--ink)' }}>{conclusion}</p>
              </div>
            )}
          </div>
        )}

        {/* ===== MARKUP (only rendered when the tab exists, i.e. handwritten upload) ===== */}
        {tab === 'markup' && hasMarkup && (
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
                </div>
              </div>

              {/* Paper */}
              <div className="markup-scroll" style={fullscreen ? { maxHeight: 'calc(100vh - 190px)' } : undefined}>
                <div className="markup-paper" style={{ transform: `scale(${zoom / 100})`, padding: 16 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={realImagePages[safeMarkupPage - 1]?.checkedCopyUrl || ''} alt={`Checked copy page ${safeMarkupPage}`} style={{ width: '100%', borderRadius: 10, display: 'block' }} />
                </div>
              </div>

              {/* Page nav */}
              <div className="page-nav">
                <button className="page-nav-btn" type="button" disabled={safeMarkupPage === 1} onClick={() => setMarkupPage((p) => Math.max(1, p - 1))}>‹ Prev</button>
                <span className="page-label">Page {safeMarkupPage} of {totalMarkupPages}</span>
                <button className="page-nav-btn" type="button" disabled={safeMarkupPage === totalMarkupPages} onClick={() => setMarkupPage((p) => Math.min(totalMarkupPages, p + 1))}>Next ›</button>
              </div>
            </div>

            {/* Examiner's overall comment */}
            {detailedFeedback && (
              <div className="examiner-comment">
                <div className="examiner-comment-label">📋 Examiner&apos;s Overall Comment</div>
                <p className="examiner-comment-text">{detailedFeedback}</p>
              </div>
            )}
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
                Examiner rubric · {data.maxScore} marks
              </span>
            </div>
            <div className="rubric-bars">
              {rubricRows.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)', fontSize: 14 }}>
                  No score breakdown available for this submission.
                </div>
              )}
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
        {hasModelAnswer && (
          <div className="model-answer-cta" style={{ marginTop: 24 }}>
            <div className="model-banner-content">
              <div className="model-banner-label">📋 Model Answer Available</div>
              <div className="model-banner-headline">Compare with a structured reference answer</div>
              <div className="model-banner-sub">See how a top-scoring response is framed, structured, and substantiated.</div>
            </div>
            <button className="btn-view-now" onClick={() => setModelAnswerOpen(true)}>View Now →</button>
          </div>
        )}
        </>
        )}

        {/* Action bar (global) */}
        <div className="card" style={{ marginTop: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <button className="action-btn-back" onClick={() => router.push(backRoute)}>
            <span style={{ fontSize: 16 }}>🏠</span> Back to Dashboard
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button className="action-btn action-btn-share" onClick={() => setShareOpen(true)}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
              Share
            </button>
            <button type="button" className="action-btn action-btn-copy" onClick={downloadEvaluationReport} disabled={isDownloadingReport}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                {isDownloadingReport ? 'Generating Report...' : 'Download Copy'}
            </button>
            <button className="action-btn action-btn-rewrite" onClick={() => router.push(rewriteRoute)}>
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
                <span style={{ color: '#F5B800', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{shareHeading}</span>
              </div>
              <div style={{ color: '#fff', fontSize: 20, fontWeight: 700, lineHeight: 1.4 }}>
                I scored <span style={{ color: '#F5B800' }}>{totalScore}/{totalMax}</span> in the<br />{shareHeading.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}!
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
          <div className="dmc-modal-content" style={{ maxWidth: 680, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            {/* Warning */}
            <div style={{ background: 'linear-gradient(135deg,#FFF7ED 0%,#FEF3C7 100%)', padding: '16px 24px', borderBottom: '1px solid rgba(245,158,11,0.2)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(245,158,11,0.15)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><span style={{ fontSize: 16 }}>⚡</span></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 4 }}>Reference Only</div>
                  <div style={{ fontSize: 12, color: '#78350F', lineHeight: 1.5 }}>Read after you&apos;ve written your own answer. Use this to understand gaps, not to memorise.</div>
                </div>
              </div>
            </div>
            {/* Header */}
            <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="chip chip-purple">{paperLabel}</span>
                  {subjectLabel && <span className="chip chip-blue">{subjectLabel}</span>}
                </div>
                <button onClick={() => setModelAnswerOpen(false)} style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid var(--line)', background: '#fff', cursor: 'pointer', fontSize: 16, display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>×</button>
              </div>
              <div style={{ fontSize: 10, letterSpacing: '0.14em', fontWeight: 700, color: '#C47B00', textTransform: 'uppercase', marginBottom: 8 }}>
                Model Answer · {marks} Marks{multi ? ` · Question ${selectedQ + 1}` : ''}
              </div>
              {modalQuestion && (
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 17, lineHeight: 1.5, color: 'var(--ink)', fontStyle: 'italic' }}>
                  &ldquo;{modalQuestion}&rdquo;
                </div>
              )}
            </div>
            {/* Body */}
            <div style={{ padding: '24px 28px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
              {data.curatedModelAnswer ? (
                <CuratedModelAnswer markdown={data.curatedModelAnswer} keyPoints={data.curatedModelAnswerKeyPoints} />
              ) : data.modelAnswerContent ? (
                <CuratedModelAnswer markdown={data.modelAnswerContent} keyPoints={data.modelAnswerKeyPoints} />
              ) : (
                <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic' }}>The model answer for this question is not available yet.</p>
              )}
            </div>
            {/* Footer */}
            <div style={{ padding: '16px 28px', borderTop: '1px solid var(--line)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Your target · ~{mainsWordLimit(marks)} words · {mainsTimeLimit(marks)} min</div>
              <button className="btn-primary" onClick={() => { setModelAnswerOpen(false); router.push(rewriteRoute); }} style={{ padding: '10px 20px', fontSize: 13 }}>✍️ Rewrite with this knowledge</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
