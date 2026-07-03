'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardPageHero from '@/components/DashboardPageHero';
import { studyGroupService, dashboardService, studyPlannerService } from '@/lib/services';
import { useAuth } from '@/contexts/AuthContext';
import { useEntitlements } from '@/contexts/EntitlementsContext';

const SUBJECTS = ['All Rooms', 'Polity', 'History', 'Economy', 'Geography', 'Current Affairs', 'Ethics', 'Sci & Tech'];
const STATUSES = ['All', 'open', 'live', 'closed'];

// ── Reference design-system maps (ported from STUDY_GROUP_SURI_FINAL) ──────
// SVG icon markup keyed by subject/icon slug, rendered inside a tinted tile.
const SUBJECT_ICONS: Record<string, string> = {
  polity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="M5 7l7-3 7 3"/><path d="M5 7l-2 6a4 4 0 008 0L9 7"/><path d="M19 7l-2 6a4 4 0 008 0l-2-6"/><path d="M4 21h16"/></svg>',
  history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M3 10h18"/><path d="M5 6l7-3 7 3"/><path d="M4 10v11"/><path d="M20 10v11"/><path d="M8 14v4"/><path d="M12 14v4"/><path d="M16 14v4"/></svg>',
  economy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10"/><path d="M15 9.5c0-1.4-1.3-2-3-2s-3 .6-3 2 1.5 1.8 3 2 3 .6 3 2-1.3 2-3 2-3-.6-3-2"/></svg>',
  geography: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 010 18"/><path d="M12 3a15 15 0 000 18"/></svg>',
  current: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h14a3 3 0 003-3V5H8v14a3 3 0 01-3 3 3 3 0 01-3-3v-8h4"/><path d="M11 7h7"/><path d="M11 11h7"/><path d="M11 15h7"/></svg>',
  ethics: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/></svg>',
  sci: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/></svg>',
  books: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>',
  graduation: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10L12 4 2 10l10 6 10-6z"/><path d="M6 12v5c0 1.7 3 3 6 3s6-1.3 6-3v-5"/></svg>',
  pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
  brain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4a3 3 0 00-3 3v.5A3 3 0 006 10a3 3 0 00.5 6A3 3 0 009 20a3 3 0 003-3V4z"/><path d="M12 4a3 3 0 013 3v.5A3 3 0 0118 10a3 3 0 01-.5 6A3 3 0 0115 20a3 3 0 01-3-3V4z"/></svg>',
  rocket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1 0-2.9a2 2 0 00-3 0z"/><path d="M12 15l-3-3a22 22 0 012-9 12.8 12.8 0 0110 0 22 22 0 01-2 9l-3 3H12z"/><path d="M15 9a2 2 0 11-4 0 2 2 0 014 0z"/><path d="M9 12H4l3-3h3"/><path d="M15 12h5l-3 3h-3"/></svg>',
  target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h12v5a6 6 0 01-12 0V4z"/><path d="M6 6H3v2a3 3 0 003 3"/><path d="M18 6h3v2a3 3 0 01-3 3"/><path d="M10 15h4v3h-4z"/><path d="M8 21h8"/></svg>',
  flame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2s5 5 5 10a5 5 0 01-10 0c0-2 1-3 1-3s-1 4 2 4 3-3 2-6c-1-2 0-5 0-5z"/></svg>',
  lightbulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 00-4 12.7c1 1 1.5 1.8 1.5 3.3h5c0-1.5.5-2.3 1.5-3.3A7 7 0 0012 2z"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15 9 22 9.5 17 14 18.5 21 12 17.5 5.5 21 7 14 2 9.5 9 9 12 2"/></svg>',
  constitution: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h13a3 3 0 013 3v13H7a3 3 0 01-3-3V4z"/><path d="M4 17a3 3 0 013-3h13"/><path d="M12 8l1 2 2 .3-1.5 1.5.4 2.2L12 13l-2 1 .4-2.2L9 10.3 11 10z"/></svg>',
  parliament: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M4 21V10"/><path d="M20 21V10"/><path d="M9 21v-6"/><path d="M15 21v-6"/><path d="M12 21v-6"/><path d="M2 10h20"/><path d="M4 10a8 8 0 0116 0"/><path d="M12 2v3"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z"/><polyline points="9 12 11 14 15 10"/></svg>',
  environment: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 019.8 6.14 11 11 0 0122 3c0 5-2.5 10-11 17z"/><path d="M2 22c3-4 7-6 11-6"/></svg>',
  satellite: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10l6-6 4 4-6 6z"/><path d="M14 8l2-2 4 4-2 2"/><path d="M8 14l2 2"/><path d="M12 18a6 6 0 006-6"/><path d="M15 21a9 9 0 009-9"/></svg>',
  map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 8 3 16 6 23 3 23 18 16 21 8 18 1 21 1 6"/><line x1="8" y1="3" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="21"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>',
};
const SUBJECT_LABELS: Record<string, string> = {
  polity: 'Polity', history: 'History', economy: 'Economy', geography: 'Geography',
  current: 'Current Affairs', ethics: 'Ethics', sci: 'Sci & Tech', books: 'Books',
  graduation: 'Graduation', pen: 'Notes', brain: 'Brain', rocket: 'Launch',
  target: 'Goal', trophy: 'Achieve', flame: 'Streak', lightbulb: 'Ideas', star: 'Star',
  constitution: 'Constitution', parliament: 'Parliament', shield: 'IAS Shield',
  environment: 'Environment', satellite: 'Space & ISRO', map: 'Indian Map', clock: 'Focus',
};
const ICON_PALETTE: Record<string, { bg: string; color: string }> = {
  slate: { bg: 'linear-gradient(135deg,#F7F7F5,#EEEEEB)', color: '#4B5563' },
  ink: { bg: 'linear-gradient(135deg,#F4F5F7,#EBECF0)', color: '#3F3D56' },
  plum: { bg: 'linear-gradient(135deg,#F5F1F4,#EBE4EB)', color: '#6B4E71' },
  teal: { bg: 'linear-gradient(135deg,#F0F4F3,#E4EDEB)', color: '#4C6E6C' },
  sage: { bg: 'linear-gradient(135deg,#F2F5EF,#E6ECE0)', color: '#5C7350' },
  brick: { bg: 'linear-gradient(135deg,#F5EFED,#ECE1DD)', color: '#8B4A4A' },
  ochre: { bg: 'linear-gradient(135deg,#F5F1E9,#ECE4D5)', color: '#8B6F3E' },
  indigo: { bg: 'linear-gradient(135deg,#F1F2F6,#E5E8EF)', color: '#4F5B85' },
  rose: { bg: 'linear-gradient(135deg,#F5EFF1,#ECE1E6)', color: '#8B5A6B' },
};
const SUBJECT_STYLE_KEY: Record<string, keyof typeof ICON_PALETTE> = {
  polity: 'indigo', history: 'ochre', economy: 'sage', geography: 'teal',
  current: 'ink', ethics: 'rose', sci: 'indigo', books: 'plum', graduation: 'indigo',
  pen: 'ochre', brain: 'rose', rocket: 'plum', target: 'brick', trophy: 'ochre',
  flame: 'brick', lightbulb: 'ochre', star: 'ochre', constitution: 'ochre',
  parliament: 'brick', shield: 'indigo', environment: 'sage', satellite: 'slate',
  map: 'sage', clock: 'teal',
};
const iconStyle = (k: string) => ICON_PALETTE[SUBJECT_STYLE_KEY[k] || 'indigo'];
// Map a human subject label (from the backend Group.subject) to an icon slug.
const SUBJECT_LABEL_TO_KEY: Record<string, string> = {
  'Polity': 'polity', 'History': 'history', 'Economy': 'economy', 'Economics': 'economy',
  'Geography': 'geography', 'Current Affairs': 'current', 'Ethics': 'ethics',
  'Sci & Tech': 'sci', 'Science & Technology': 'sci', 'Science': 'sci',
};
const subjectSlug = (label?: string) => SUBJECT_LABEL_TO_KEY[label || ''] || 'polity';
// Top-strip accent colours cycled across the room grid.
const ROOM_BORDERS = ['red', 'blue', 'green', 'purple', 'orange', 'gold'] as const;
const ROOM_BORDER_HEX: Record<string, string> = {
  red: '#E8A0A0', blue: '#A0BFE0', green: '#A8D5B8',
  purple: '#C4B0E0', orange: '#E8C89A', gold: '#D4C090',
};

type UpgradeIntent =
  | { kind: 'solo' } | { kind: 'mygroup' } | { kind: 'filter' } | { kind: 'create' }
  | { kind: 'rooms' } | { kind: 'room'; title?: string; subject?: string } | null;

// Upgrade-modal copy, personalised to what the locked user just tried to do.
function personalizeUpgrade(intent: UpgradeIntent): { title: string; sub: string } {
  if (!intent) return { title: "You're one step from your study circle.", sub: 'Live Study Rooms are available on Rise and Ascent plans.' };
  switch (intent.kind) {
    case 'solo': return { title: 'Enter your Solo Focus sanctuary.', sub: 'Pomodoro timer, task tracker, and focus streaks — zero distractions.' };
    case 'mygroup': return { title: 'Rejoin your study group in seconds.', sub: 'Your study groups are waiting on the other side.' };
    case 'room':
      if (intent.subject) return { title: `Join the ${intent.subject} room in seconds.`, sub: `${intent.title ? `"${intent.title}" ` : ''}is live right now — sit alongside peers.` };
      return { title: intent.title ? `Join "${intent.title}" in seconds.` : 'Join this live room in seconds.', sub: 'Sit alongside peers preparing for the same exam.' };
    case 'filter': return { title: 'Filter and join live rooms instantly.', sub: 'Available on Rise and Ascent — start your first session today.' };
    case 'create': return { title: 'Host your own study room.', sub: 'Invite peers, set the pace, and lead the session.' };
    default: return { title: "You're one step from your study circle.", sub: 'Join live rooms with peers preparing for the same exam — right now.' };
  }
}
const PLAN_PRICES = {
  rise: { price: '399', suffix: '/mo', tag: 'Most students choose this', badge: 'RECOMMENDED' },
  ascent: { price: '699', suffix: '/mo', tag: 'For serious rankers', badge: 'PREMIUM' },
};
// Icons offered in the Create-Room icon picker.
const ICON_PICKER_KEYS = [
  'polity', 'history', 'economy', 'geography', 'current', 'ethics', 'sci', 'constitution',
  'parliament', 'shield', 'environment', 'satellite', 'map', 'books', 'graduation', 'pen',
  'brain', 'rocket', 'target', 'trophy', 'flame', 'lightbulb', 'star', 'clock',
];

// Scoped design-system CSS ported from the client reference. Everything is
// namespaced under `.sg` so it can never leak into the dashboard shell.
const SG_CSS = `
.sg { --gold:#F4C430; --gold-light:#F8D04D; --gold-dark:#E6B800; --green:#22C55E;
  --green-bg:#DCFCE7; --green-dark:#166534; --red:#EF4444; --red-bg:#FEE2E2;
  --bg-dark:#0B1021; --text-primary:#1A1D2E; --text-secondary:#6B7280; --text-muted:#9CA3AF;
  --border:#E5E7EB; --border-light:#F3F4F6; --radius-full:9999px; --orange:#F59E0B;
  --transition:0.25s cubic-bezier(0.4,0,0.2,1); }
@keyframes sgPulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.15);} }
@keyframes sgSlideUp { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }
@keyframes sgScaleIn { from{opacity:0;transform:scale(0.96);} to{opacity:1;transform:scale(1);} }
@keyframes sgPop { from{opacity:0;transform:scale(0.96) translateY(6px);} to{opacity:1;transform:scale(1) translateY(0);} }
@keyframes sgLive { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.55);} 50%{box-shadow:0 0 0 6px rgba(34,197,94,0);} }

/* Filter pills */
.sg .sg-pill { padding:8px 16px; border-radius:var(--radius-full); font-size:13px; font-weight:500;
  color:var(--text-secondary); background:#fff; border:1px solid var(--border); transition:var(--transition); cursor:pointer; }
.sg .sg-pill:hover { border-color:var(--gold); color:var(--gold-dark); }
.sg .sg-pill.active { background:var(--bg-dark); color:var(--gold); border-color:var(--gold); font-weight:600; }

/* Section label */
.sg .sg-section-label { font-size:11px; font-weight:700; letter-spacing:1.5px; color:var(--text-muted);
  text-transform:uppercase; display:flex; align-items:center; gap:16px; }
.sg .sg-section-label::after { content:''; flex:1; height:1px; background:var(--border); }

/* Subject icon tile */
.sg .subject-icon { width:40px; height:40px; flex-shrink:0; display:inline-flex; align-items:center;
  justify-content:center; border-radius:11px; border:1px solid rgba(15,23,42,0.05);
  transition:transform 0.25s ease, box-shadow 0.25s ease; }
.sg .subject-icon svg { width:20px; height:20px; stroke-width:1.5; opacity:0.92; }

/* Room card */
.sg .room-card { background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.06);
  border:1px solid var(--border); transition:var(--transition); animation:sgSlideUp 0.4s ease backwards; cursor:pointer; position:relative; }
.sg .room-card:hover { box-shadow:0 4px 12px rgba(0,0,0,0.08); transform:translateY(-3px); }
.sg .room-card:hover .subject-icon { transform:scale(1.04); box-shadow:0 3px 8px rgba(15,23,42,0.06); }
.sg .room-card.is-full { background:#FAFAFB; border-color:#ECEDEF; box-shadow:none; }
.sg .room-card.is-full .subject-icon { filter:grayscale(0.7); opacity:0.55; }
.sg .room-card.is-full .room-card-title { color:#8A8F9C; }
.sg .room-card.is-full .member-count { color:#A5A9B4; }
.sg .room-card-top { height:4px; width:100%; }
.sg .room-card-body { padding:16px 20px 20px; }
.sg .room-card-title-row { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
.sg .room-card-title { font-size:17px; font-weight:700; color:var(--text-primary); line-height:1.25; }
.sg .room-card-desc { font-size:12.5px; color:var(--text-secondary); margin-bottom:14px; min-height:18px; }
.sg .room-card-footer { display:flex; align-items:center; justify-content:space-between; }
.sg .member-avatars { display:flex; }
.sg .m-av { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center;
  font-size:11px; font-weight:700; color:#fff; margin-left:-6px; border:2px solid #fff; }
.sg .m-av:first-child { margin-left:0; }
.sg .member-count { font-size:12px; color:var(--text-secondary); font-weight:500; margin-left:8px; }
.sg .badge-open { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:var(--radius-full);
  background:var(--green-bg); color:var(--green-dark); font-size:11px; font-weight:700; }
.sg .badge-open::before { content:''; width:6px; height:6px; border-radius:50%; background:var(--green); animation:sgPulse 2s infinite; }
.sg .badge-full { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:var(--radius-full);
  background:var(--red-bg); color:var(--red); font-size:11px; font-weight:700; }
.sg .badge-subject { padding:4px 10px; border-radius:var(--radius-full); background:var(--border-light);
  color:var(--text-secondary); font-size:11px; font-weight:600; }
.sg .btn-join { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:var(--radius-full);
  background:var(--gold); color:var(--bg-dark); font-size:13px; font-weight:700; transition:var(--transition); border:none; cursor:pointer; }
.sg .btn-join:hover { background:var(--gold-light); transform:scale(1.03); }
.sg .btn-join.enter { background:var(--green); color:#fff; }
.sg .btn-join.full { background:var(--red-bg); color:var(--red); cursor:not-allowed; }

/* Locked plan treatment */
.sg.plan-locked .room-card::before { content:''; position:absolute; top:10px; right:10px; width:26px; height:26px; z-index:2;
  border-radius:50%; background:#fff url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23B8860B' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><rect x='4' y='11' width='16' height='10' rx='2'/><path d='M8 11V7a4 4 0 018 0v4'/></svg>") center/14px no-repeat;
  box-shadow:0 2px 8px rgba(0,0,0,0.12); border:1px solid rgba(244,196,48,0.5); }

/* Plan ribbon */
.sg .plan-ribbon { display:flex; align-items:center; gap:10px; margin:16px 0 4px; padding:10px 16px; border-radius:16px;
  background:linear-gradient(90deg, rgba(244,196,48,0.14), rgba(244,196,48,0.04)); border:1px solid rgba(244,196,48,0.35);
  color:#7a5c00; font-size:13px; font-weight:600; }
.sg .plan-ribbon .ribbon-spark { width:24px; height:24px; border-radius:50%;
  background:linear-gradient(135deg, var(--gold), var(--gold-light)); display:flex; align-items:center; justify-content:center;
  color:var(--bg-dark); font-weight:800; font-size:13px; box-shadow:0 2px 8px rgba(244,196,48,0.45); }
.sg .plan-ribbon .ribbon-cta { margin-left:auto; background:var(--bg-dark); color:var(--gold); padding:6px 14px;
  border-radius:999px; font-size:12px; font-weight:700; transition:var(--transition); border:none; cursor:pointer; }
.sg .plan-ribbon .ribbon-cta:hover { background:#000; transform:translateY(-1px); }

/* Overlays */
.sg-overlay { position:fixed; inset:0; z-index:500; background:rgba(11,16,33,0.62); backdrop-filter:blur(8px);
  display:flex; align-items:center; justify-content:center; padding:20px; animation:sgScaleIn 0.2s ease; }

/* Preview modal */
.sg-preview-box { background:#fff; border-radius:24px; width:600px; max-width:92vw; max-height:88vh;
  box-shadow:0 24px 80px rgba(0,0,0,0.25); animation:sgScaleIn 0.3s ease; overflow:hidden; display:flex; flex-direction:column; }
.sg-preview-header { padding:24px 28px 20px; border-bottom:1px solid var(--border); position:relative; }
.sg-preview-header::before { content:''; position:absolute; top:0; left:0; right:0; height:4px; }
.sg-preview-close { position:absolute; top:16px; right:16px; width:36px; height:36px; border-radius:50%; display:flex;
  align-items:center; justify-content:center; font-size:22px; color:var(--text-muted); background:var(--border-light); border:none; cursor:pointer; }
.sg-preview-close:hover { background:var(--border); }
.sg-preview-badges { display:flex; gap:8px; margin-bottom:10px; }
.sg-preview-title { font-size:26px; font-weight:700; margin-bottom:6px; color:var(--text-primary); }
.sg-preview-desc { font-size:14px; color:var(--text-secondary); line-height:1.5; }
.sg-preview-body { padding:24px 28px; overflow-y:auto; }
.sg-preview-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:22px; }
.sg-preview-stat { background:var(--border-light); border-radius:12px; padding:16px; text-align:center; }
.sg-preview-stat-num { font-size:22px; font-weight:800; display:block; }
.sg-preview-stat-lbl { font-size:10px; font-weight:700; letter-spacing:1px; color:var(--text-muted); text-transform:uppercase; margin-top:4px; }
.sg-preview-footer { padding:18px 28px; border-top:1px solid var(--border); display:flex; gap:12px; justify-content:flex-end; background:var(--border-light); }
.sg-btn-back { padding:11px 22px; border-radius:var(--radius-full); font-size:14px; font-weight:600; color:var(--text-secondary);
  border:1.5px solid var(--border); background:#fff; cursor:pointer; }
.sg-btn-primary { padding:11px 26px; border-radius:var(--radius-full); background:var(--gold); color:var(--bg-dark);
  font-size:14px; font-weight:700; display:inline-flex; align-items:center; gap:8px; border:none; cursor:pointer; transition:var(--transition); }
.sg-btn-primary:hover { background:var(--gold-light); transform:translateY(-1px); }

/* Icon picker (Create modal) */
.sg-icon-picker-wrap { position:relative; }
.sg-icon-trigger { width:100%; padding:10px 14px; border:1.5px solid var(--border); border-radius:12px; background:#fff;
  display:flex; align-items:center; gap:12px; cursor:pointer; font-size:14px; font-weight:600; color:var(--text-primary); text-align:left; }
.sg-icon-trigger.open { border-color:var(--gold); box-shadow:0 0 0 3px rgba(244,196,48,0.15); }
.sg-icon-trigger .subject-icon { width:32px; height:32px; border-radius:9px; }
.sg-icon-trigger .subject-icon svg { width:18px; height:18px; }
.sg-icon-trigger .trigger-label { flex:1; }
.sg-icon-trigger .trigger-hint { font-size:11px; font-weight:500; color:var(--text-muted); display:block; margin-top:2px; }
.sg-icon-trigger .trigger-chev { width:16px; height:16px; color:var(--text-muted); transition:transform 0.25s ease; }
.sg-icon-trigger.open .trigger-chev { transform:rotate(180deg); }
.sg-icon-panel { position:absolute; top:calc(100% + 6px); left:0; right:0; background:#fff; border:1px solid var(--border);
  border-radius:12px; box-shadow:0 10px 30px rgba(15,23,42,0.12); padding:14px; z-index:20; max-height:300px; overflow-y:auto; animation:sgScaleIn 0.15s ease; }
.sg-icon-search { width:100%; padding:8px 12px; border:1px solid var(--border); border-radius:8px; font-size:13px;
  margin-bottom:12px; outline:none; background:#F8F9FB; }
.sg-icon-search:focus { border-color:var(--gold); background:#fff; }
.sg-icon-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:8px; }
.sg-icon-item { aspect-ratio:1/1; border:1.5px solid transparent; border-radius:10px; background:transparent; display:flex;
  align-items:center; justify-content:center; cursor:pointer; transition:transform 0.15s ease, border-color 0.15s ease; position:relative; padding:4px; }
.sg-icon-item .subject-icon { width:100%; height:100%; border-radius:8px; }
.sg-icon-item .subject-icon svg { width:18px; height:18px; }
.sg-icon-item:hover { transform:translateY(-1px); background:#F5F6F8; }
.sg-icon-item.selected { border-color:var(--gold); background:rgba(244,196,48,0.08); }

/* Join Study Room prompt */
.sg-join-box { position:relative; background:#fff; border-radius:22px; width:420px; max-width:92vw; padding:32px 28px 24px;
  box-shadow:0 24px 80px rgba(0,0,0,0.25); animation:sgScaleIn 0.24s ease; text-align:center; }
.sg-join-icon { width:56px; height:56px; margin:0 auto 16px; border-radius:16px; display:flex; align-items:center; justify-content:center;
  border:1px solid rgba(15,23,42,0.05); }
.sg-join-icon svg { width:28px; height:28px; stroke-width:1.5; }
.sg-join-title { font-size:20px; font-weight:700; color:var(--text-primary); margin-bottom:4px; }
.sg-join-name { font-size:15px; font-weight:600; color:var(--text-secondary); margin-bottom:12px; }
.sg-join-badges { display:flex; gap:8px; justify-content:center; margin-bottom:14px; }
.sg-join-desc { font-size:13.5px; color:var(--text-secondary); line-height:1.55; margin-bottom:16px; }
.sg-join-note { display:flex; align-items:center; gap:8px; justify-content:center; padding:10px 14px; border-radius:10px;
  background:#FFFBEB; border:1px solid #FCD34D; color:#92400E; font-size:12px; font-weight:600; margin-bottom:20px; text-align:left; }
.sg-join-note svg { flex-shrink:0; color:#B8860B; }
.sg-join-footer { display:flex; gap:12px; }
.sg-join-footer .sg-btn-back, .sg-join-footer .sg-btn-primary { flex:1; justify-content:center; }

/* Upgrade modal */
.sg-upgrade { width:100%; max-width:520px; background:#fff; border-radius:22px; box-shadow:0 30px 80px rgba(0,0,0,0.35);
  overflow:hidden; position:relative; animation:sgPop 0.24s cubic-bezier(0.2,0.9,0.35,1.1); max-height:92vh; overflow-y:auto; }
.sg-upgrade::before { content:''; position:absolute; top:0; left:0; right:0; height:4px;
  background:linear-gradient(90deg, var(--gold-dark), var(--gold), var(--gold-light)); }
.sg-upgrade-close { position:absolute; top:14px; right:14px; width:30px; height:30px; border-radius:50%; background:rgba(0,0,0,0.04);
  color:var(--text-secondary); display:flex; align-items:center; justify-content:center; font-size:18px; border:none; cursor:pointer; z-index:2; }
.sg-upgrade-head { padding:32px 28px 18px; text-align:center; }
.sg-upgrade-icon { width:56px; height:56px; margin:0 auto 14px; border-radius:16px;
  background:linear-gradient(135deg, var(--gold), var(--gold-light)); display:flex; align-items:center; justify-content:center;
  color:var(--bg-dark); box-shadow:0 8px 22px rgba(244,196,48,0.4); }
.sg-upgrade-icon svg { width:28px; height:28px; }
.sg-upgrade-title { font-size:23px; font-weight:700; line-height:1.25; color:var(--text-primary); margin-bottom:8px; }
.sg-upgrade-sub { font-size:14px; color:var(--text-secondary); line-height:1.5; max-width:360px; margin:0 auto; }
.sg-upgrade-social { margin:18px 28px 20px; padding:12px 16px;
  background:linear-gradient(90deg, rgba(34,197,94,0.08), rgba(34,197,94,0.02)); border:1px solid rgba(34,197,94,0.22);
  border-radius:12px; display:flex; align-items:center; gap:12px; }
.sg-upgrade-social .m-av { width:26px; height:26px; margin-left:-8px; }
.sg-upgrade-social .m-av:first-child { margin-left:0; }
.sg-upgrade-social-text { font-size:13px; color:var(--green-dark); font-weight:600; }
.sg-upgrade-social-text .live-dot { display:inline-block; width:7px; height:7px; border-radius:50%; background:var(--green);
  margin-right:6px; animation:sgLive 1.6s ease-in-out infinite; }
.sg-upgrade-benefits { padding:0 28px 20px; display:grid; gap:10px; }
.sg-upgrade-benefit { display:flex; align-items:flex-start; gap:12px; padding:10px 12px; border-radius:10px; background:#F4F5F7; }
.sg-upgrade-benefit-icon { width:30px; height:30px; border-radius:8px; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,0.06);
  display:flex; align-items:center; justify-content:center; color:var(--gold-dark); flex-shrink:0; }
.sg-upgrade-benefit-icon svg { width:16px; height:16px; }
.sg-upgrade-benefit-text { font-size:13px; color:var(--text-primary); line-height:1.45; }
.sg-upgrade-plans { padding:4px 28px 22px; display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.sg-upgrade-plan { position:relative; border:1.5px solid var(--border); border-radius:14px; padding:16px 14px 14px; background:#fff;
  transition:var(--transition); cursor:pointer; }
.sg-upgrade-plan:hover { transform:translateY(-2px); box-shadow:0 4px 12px rgba(0,0,0,0.08); }
.sg-upgrade-plan.featured { border-color:var(--gold); background:linear-gradient(180deg, rgba(244,196,48,0.06), rgba(244,196,48,0));
  box-shadow:0 6px 20px rgba(244,196,48,0.18); }
.sg-upgrade-plan-badge { position:absolute; top:-10px; left:50%; transform:translateX(-50%); padding:3px 10px; border-radius:999px;
  background:var(--bg-dark); color:var(--gold); font-size:10px; font-weight:700; white-space:nowrap; }
.sg-upgrade-plan.featured .sg-upgrade-plan-badge { background:var(--gold); color:var(--bg-dark); }
.sg-upgrade-plan-name { font-size:18px; font-weight:700; margin-bottom:2px; color:var(--text-primary); }
.sg-upgrade-plan-tag { font-size:11px; color:var(--text-secondary); margin-bottom:10px; }
.sg-upgrade-plan-price { font-size:22px; font-weight:800; color:var(--text-primary); margin-bottom:12px; }
.sg-upgrade-plan-price small { font-size:12px; font-weight:500; color:var(--text-secondary); }
.sg-upgrade-plan .btn { width:100%; padding:10px 12px; border-radius:10px; font-size:13px; font-weight:700; border:none; cursor:pointer; }
.sg-upgrade-plan.featured .btn { background:linear-gradient(135deg, var(--gold), var(--gold-light)); color:var(--bg-dark); }
.sg-upgrade-plan .btn.ghost { background:transparent; color:var(--text-primary); border:1.5px solid var(--border); }
.sg-upgrade-trust { padding:0 28px 12px; display:flex; flex-wrap:wrap; gap:14px; justify-content:center; font-size:11px;
  color:var(--text-secondary); font-weight:500; }
.sg-upgrade-trust span { display:inline-flex; align-items:center; gap:4px; }
.sg-upgrade-trust svg { width:12px; height:12px; color:var(--green); }
.sg-upgrade-later { display:block; width:100%; padding:14px 28px 22px; text-align:center; font-size:13px; color:var(--text-muted);
  font-weight:500; background:none; border:none; cursor:pointer; }
`;

interface Group {
  id: string;
  name: string;
  description?: string;
  subject: string;
  status: string;
  maxMembers: number;
  memberCount: number;
  isMember: boolean;
  createdById: string;
  creator?: { firstName?: string; lastName?: string; avatarUrl?: string };
  members?: { firstName?: string; lastName?: string; avatarUrl?: string }[];
  createdAt: string;
}

interface Message {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  user?: { firstName?: string; lastName?: string; avatarUrl?: string };
}

export default function StudyGroupsPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { tier, canAccess } = useEntitlements();
  const userInitials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  // Plan gating — Rise/Ascent get full Live Study Room access; Free/Aspire are
  // "locked": they see the whole UI but any interaction opens the upgrade modal.
  const locked = !canAccess('live_study_room', ['full']);
  const [upgrade, setUpgrade] = useState<{ title: string; sub: string } | null>(null);
  const openUpgrade = useCallback((intent: UpgradeIntent) => setUpgrade(personalizeUpgrade(intent)), []);
  // Run `fn` only when unlocked; otherwise surface the personalised upgrade modal.
  const guard = useCallback((intent: UpgradeIntent, fn: () => void) => {
    if (locked) { openUpgrade(intent); return; }
    fn();
  }, [locked, openUpgrade]);

  // Create-Room icon picker
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState('polity');
  const [iconSearch, setIconSearch] = useState('');
  // Room-preview modal (peek before joining)
  const [previewGroup, setPreviewGroup] = useState<Group | null>(null);
  const [previewStudying, setPreviewStudying] = useState<number | null>(null);
  // Join-Study-Room prompt — shown when a non-member clicks a room; they must
  // join here before they're allowed to enter (client requirement).
  const [joinPrompt, setJoinPrompt] = useState<Group | null>(null);
  const [joining, setJoining] = useState(false);
  // Study Rooms status filter: all | open | full
  const [roomStateFilter, setRoomStateFilter] = useState<'all' | 'open' | 'full'>('all');

  // Joining a room ≠ studying. `isStudying` becomes true only when the user
  // clicks "Start Studying"; until then they see other participants but are NOT
  // counted in the room's live "X studying" total (client requirement).
  const [isStudying, setIsStudying] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rooms' | 'solo' | 'my'>('rooms');
  const [subjectFilter, setSubjectFilter] = useState('All Rooms');
  const [search, setSearch] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', subject: 'Polity', maxMembers: 50, focusTopic: '', subjects: [] as string[], timeGoal: 4 });
  const [sending, setSending] = useState(false);
  const [inRoom, setInRoom] = useState<Group | null>(null);
  const [chatTab, setChatTab] = useState<'chat' | 'goals' | 'board'>('chat');
  const [roomFocusMode, setRoomFocusMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Room Goals – shared goal list for the current room, per-member completion
  interface RoomGoal { id: string; title: string; createdById: string; createdByName: string; createdAt: string; }
  interface RoomMemberTime { userId: string; name: string; avatarUrl: string | null; focusSeconds: number; }
  const [roomGoals, setRoomGoals] = useState<RoomGoal[]>([]);
  const [myCompletedGoalIds, setMyCompletedGoalIds] = useState<Set<string>>(new Set());
  const [newGoalInput, setNewGoalInput] = useState('');
  const [addingGoal, setAddingGoal] = useState(false);
  const [togglingGoalIds, setTogglingGoalIds] = useState<Set<string>>(new Set());
  const [memberTimes, setMemberTimes] = useState<RoomMemberTime[]>([]);
  const [teamTotalSeconds, setTeamTotalSeconds] = useState(0);
  const roomPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pomodoro timer state – Solo Session
  const BREAK_SECONDS = 5 * 60;
  const [focusMinutes, setFocusMinutes] = useState(25);
  const focusMinutesRef = useRef(25);
  const [pomoSecondsLeft, setPomoSecondsLeft] = useState(25 * 60);
  const [pomoRunning, setPomoRunning] = useState(false);
  const [pomoSession, setPomoSession] = useState(1); // 1..4
  const [pomoMode, setPomoMode] = useState<'focus' | 'break'>('focus');
  const [todaySeconds, setTodaySeconds] = useState(0);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [dayStreak, setDayStreak] = useState(0);
  const [weeklyHours, setWeeklyHours] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const pomoTickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSetFocusMinutes = (m: number) => {
    if (pomoRunning) return;
    const clamped = Math.max(1, Math.min(180, m));
    focusMinutesRef.current = clamped;
    setFocusMinutes(clamped);
    if (pomoMode === 'focus') setPomoSecondsLeft(clamped * 60);
  };

  // Load today's accumulated focus seconds from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const todayKey = `rwj_solo_focus_${new Date().toISOString().slice(0, 10)}`;
    const stored = parseInt(localStorage.getItem(todayKey) || '0', 10);
    if (!Number.isNaN(stored)) setTodaySeconds(stored);
  }, []);

  const persistTodaySeconds = useCallback((secs: number) => {
    if (typeof window === 'undefined') return;
    const todayKey = `rwj_solo_focus_${new Date().toISOString().slice(0, 10)}`;
    localStorage.setItem(todayKey, String(secs));
  }, []);

  // Load completed sessions for today from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = `rwj_solo_sessions_${new Date().toISOString().slice(0, 10)}`;
    const stored = parseInt(localStorage.getItem(key) || '0', 10);
    if (!Number.isNaN(stored)) setCompletedSessions(stored);
  }, []);

  // Compute weekly hours from per-day localStorage entries (Mon–Sun)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const now = new Date();
    const dow = now.getDay(); // 0=Sun
    const mondayOffset = (dow + 6) % 7;
    const hours: number[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - mondayOffset + i);
      const key = `rwj_solo_focus_${d.toISOString().slice(0, 10)}`;
      const secs = parseInt(localStorage.getItem(key) || '0', 10);
      hours.push(secs / 3600);
    }
    setWeeklyHours(hours);
  }, [todaySeconds]);

  // Fetch streak from dashboard
  useEffect(() => {
    dashboardService.getStreak().then((res: any) => {
      if (res?.data?.currentStreak != null) setDayStreak(res.data.currentStreak);
    }).catch(() => {});
  }, []);

  // Tick interval
  useEffect(() => {
    if (!pomoRunning) {
      if (pomoTickRef.current) { clearInterval(pomoTickRef.current); pomoTickRef.current = null; }
      return;
    }
    pomoTickRef.current = setInterval(() => {
      setPomoSecondsLeft((prev) => {
        const focusSecs = focusMinutesRef.current * 60;
        if (prev <= 1) {
          setPomoRunning(false);
          if (pomoMode === 'focus') {
            // Every tick while running already added +1 (see below), so the
            // cycle-completion tick only needs to account for its own final
            // second — adding focusSecs again here would double-count the
            // whole session.
            setTodaySeconds((t) => {
              const next = t + 1;
              persistTodaySeconds(next);
              flushSoloSession(next);
              flushRoomFocusTime(next);
              return next;
            });
            setCompletedSessions((s) => {
              const next = s + 1;
              if (typeof window !== 'undefined') {
                const key = `rwj_solo_sessions_${new Date().toISOString().slice(0, 10)}`;
                localStorage.setItem(key, String(next));
              }
              return next;
            });
            // Move to break, or next focus if session was last
            if (pomoSession >= 4) {
              setPomoSession(1);
              setPomoMode('focus');
              return focusSecs;
            }
            setPomoMode('break');
            return BREAK_SECONDS;
          }
          // break finished → next focus session
          setPomoMode('focus');
          setPomoSession((s) => s + 1);
          return focusSecs;
        }
        if (pomoMode === 'focus') {
          setTodaySeconds((t) => {
            const next = t + 1;
            if (next % 30 === 0) { persistTodaySeconds(next); flushSoloSession(next); flushRoomFocusTime(next); }
            return next;
          });
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (pomoTickRef.current) clearInterval(pomoTickRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pomoRunning, pomoMode]);

  const handlePomoStart = () => {
    setPomoRunning((r) => {
      if (r && pomoMode === 'focus') { flushSoloSession(todaySeconds); flushRoomFocusTime(todaySeconds); }
      return !r;
    });
  };
  // Room "Start Studying" — begins the timer AND marks the user as an active
  // studier (so they now count toward the room's live "X studying" total).
  // Pausing stops the timer and drops them back to present-but-idle.
  const toggleStudying = () => {
    if (isStudying) {
      setIsStudying(false);
      setPomoRunning(false);
      if (pomoMode === 'focus') { flushSoloSession(todaySeconds); flushRoomFocusTime(todaySeconds); }
    } else {
      setIsStudying(true);
      setPomoRunning(true);
    }
  };
  const handlePomoReset = () => {
    setPomoRunning(false);
    setIsStudying(false);
    setPomoSecondsLeft(pomoMode === 'focus' ? focusMinutesRef.current * 60 : BREAK_SECONDS);
  };
  const handlePomoSkip = () => {
    setPomoRunning(false);
    const focusSecs = focusMinutesRef.current * 60;
    if (pomoMode === 'focus') {
      if (pomoSession >= 4) { setPomoSession(1); setPomoSecondsLeft(focusSecs); return; }
      setPomoMode('break');
      setPomoSecondsLeft(BREAK_SECONDS);
    } else {
      setPomoMode('focus');
      setPomoSession((s) => s + 1);
      setPomoSecondsLeft(focusSecs);
    }
  };

  const formatMMSS = (s: number) => {
    const mm = Math.floor(s / 60).toString().padStart(2, '0');
    const ss = (s % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  };
  const formatHourMin = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const pomoTotalForMode = pomoMode === 'focus' ? focusMinutes * 60 : BREAK_SECONDS;
  const pomoProgress = 1 - pomoSecondsLeft / pomoTotalForMode;

  // Today's Study Tasks – shared with Study Planner via studyPlannerService
  interface Task {
    id: string;
    title: string;
    subject?: string;
    type: string;
    date: string;
    isCompleted: boolean;
    actualDuration?: number;
  }
  // Deliberately never pass an explicit date string to studyPlannerService here.
  // The backend's default "today" (no date param) resolves to local midnight,
  // which is what the Dashboard's study-hours stat exact-matches against. An
  // explicit "YYYY-MM-DD" string gets stored at noon UTC instead (a separate,
  // pre-existing convention used for date-navigation), which silently fails
  // that exact-match — so tasks created that way never count toward Dashboard
  // hours even though they're genuinely "today".
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [addingTask, setAddingTask] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setTasksLoading(true);
    studyPlannerService.getTodayTasks()
      .then((res: any) => { if (!cancelled) setTasks(Array.isArray(res.data) ? res.data : []); })
      .catch(() => { if (!cancelled) setTasks([]); })
      .finally(() => { if (!cancelled) setTasksLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const toggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
    try {
      await studyPlannerService.updateTask(id, { isCompleted: !task.isCompleted });
    } catch {
      setTasks((prev) => prev.map((t) => t.id === id ? { ...t, isCompleted: task.isCompleted } : t));
    }
  };
  const taskInputRef = useRef<HTMLInputElement>(null);
  const addTask = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const title = newTaskInput.trim();
    if (!title || addingTask) return;
    setAddingTask(true);
    try {
      const res: any = await studyPlannerService.createTask({ title });
      if (res.data) setTasks((prev) => [...prev, res.data]);
      setNewTaskInput('');
      taskInputRef.current?.focus();
    } catch {
      // silent – input keeps its value so the user can retry
    } finally {
      setAddingTask(false);
    }
  };

  // Solo Focus Session time syncs into a daily placeholder StudyPlanTask, so it
  // counts toward Dashboard study hours the same way Study Planner's own
  // Focus Session does (both write actualDuration onto real task rows).
  const SOLO_SESSION_TITLE = 'Solo Focus Session';
  const SOLO_SESSION_TYPE = 'study';
  const soloSessionTaskRef = useRef<Task | null>(null);

  useEffect(() => {
    if (tasksLoading) return;
    const existing = tasks.find((t) => t.type === SOLO_SESSION_TYPE && t.title === SOLO_SESSION_TITLE);
    if (existing) soloSessionTaskRef.current = existing;
  }, [tasks, tasksLoading]);

  const flushSoloSession = useCallback(async (secs: number) => {
    if (secs <= 0 || tasksLoading) return;
    try {
      let task: Task | null = soloSessionTaskRef.current;
      if (!task) {
        const res: any = await studyPlannerService.createTask({
          title: SOLO_SESSION_TITLE,
          type: SOLO_SESSION_TYPE,
        });
        if (!res.data) return;
        task = res.data as Task;
        soloSessionTaskRef.current = task;
        setTasks((prev) => [...prev, task as Task]);
      }
      if (!task) return;
      const updates = { actualDuration: secs, isCompleted: true };
      await studyPlannerService.updateTask(task.id, updates);
      const updatedTask: Task = { ...task, ...updates };
      soloSessionTaskRef.current = updatedTask;
      setTasks((prev) => prev.map((t) => t.id === updatedTask.id ? updatedTask : t));
    } catch {
      // silent – local timer state already has the correct value; next flush retries
    }
  }, [tasksLoading]);

  // When focusing while inside a room, also log the same cumulative seconds
  // as room-scoped time (separate from the personal diary flush above).
  const flushRoomFocusTime = useCallback(async (secs: number) => {
    if (secs <= 0 || !inRoom) return;
    try {
      await studyGroupService.postFocusTime(inRoom.id, secs);
    } catch {
      // silent – next flush retries
    }
  }, [inRoom]);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await studyGroupService.getGroups();
      if (res.status === 'success' && res.data) {
        setGroups(res.data);
      }
    } catch {
      // silent
    }
  }, []);

  const fetchMyGroups = useCallback(async () => {
    try {
      const res = await studyGroupService.getMyGroups();
      if (res.status === 'success' && res.data) {
        setMyGroups(res.data);
      }
    } catch {
      // silent
    }
  }, []);

  // Restore the immersive "in room" view after navigating away and back —
  // `inRoom` is plain component state, wiped when this page unmounts on
  // route change, even though the user is still an active room member
  // server-side. sessionStorage remembers which room to re-enter.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const activeRoomId = sessionStorage.getItem('rwj_active_room_id');
    if (!activeRoomId) return;
    (async () => {
      try {
        const res = await studyGroupService.getGroup(activeRoomId);
        if (res.status === 'success' && res.data && res.data.isMember) {
          setSelectedGroup(res.data);
          if (res.data.messages) setMessages(res.data.messages);
          setInRoom(res.data);
          setActiveTab('my');
        } else {
          sessionStorage.removeItem('rwj_active_room_id');
        }
      } catch {
        // silent – leave the stored id, will retry on next mount
      }
    })();
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      await Promise.all([fetchGroups(), fetchMyGroups()]);
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, [fetchGroups, fetchMyGroups]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'solo' || tab === 'my' || tab === 'rooms') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const openGroup = useCallback(async (group: Group) => {
    setSelectedGroup(group);
    setMessages([]);
    try {
      const res = await studyGroupService.getGroup(group.id);
      if (res.status === 'success' && res.data) {
        const g = res.data;
        setSelectedGroup(g);
        if (g.messages) setMessages(g.messages);
      }
    } catch {
      // silent
    }
  }, []);

  // Poll messages every 5s when a group is selected
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (!selectedGroup) return;

    const poll = async () => {
      try {
        const last = messages[messages.length - 1];
        const res = await studyGroupService.getMessages(selectedGroup.id, last?.createdAt);
        if (res.status === 'success' && res.data && res.data.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newMsgs = res.data!.filter((m: Message) => !existingIds.has(m.id));
            return [...prev, ...newMsgs];
          });
        }
      } catch {
        // silent
      }
    };

    pollRef.current = setInterval(poll, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroup?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchRoomGoalsAndTimes = useCallback(async (roomId: string) => {
    try {
      const [goalsRes, timesRes] = await Promise.all([
        studyGroupService.getGoals(roomId),
        studyGroupService.getMemberTimes(roomId),
      ]);
      if (goalsRes.status === 'success' && goalsRes.data) {
        setRoomGoals(goalsRes.data.goals || []);
        setMyCompletedGoalIds(new Set(goalsRes.data.myCompletedGoalIds || []));
      }
      if (timesRes.status === 'success' && timesRes.data) {
        setMemberTimes(timesRes.data.members || []);
        setTeamTotalSeconds(timesRes.data.teamTotalSeconds || 0);
      }
    } catch {
      // silent
    }
  }, []);

  // Fetch + poll room goals and member times every 12s while inside a room
  useEffect(() => {
    if (roomPollRef.current) clearInterval(roomPollRef.current);
    if (!inRoom) { setRoomGoals([]); setMyCompletedGoalIds(new Set()); setMemberTimes([]); setTeamTotalSeconds(0); return; }

    fetchRoomGoalsAndTimes(inRoom.id);
    roomPollRef.current = setInterval(() => fetchRoomGoalsAndTimes(inRoom.id), 12000);
    return () => { if (roomPollRef.current) clearInterval(roomPollRef.current); };
  }, [inRoom?.id, fetchRoomGoalsAndTimes]);

  // Entering (or switching) a room resets the studying session: the user is
  // present but idle, and the timer is paused until they click Start Studying.
  useEffect(() => {
    setIsStudying(false);
    setPomoRunning(false);
  }, [inRoom?.id]);

  // Truthful "studying now" count for the preview peek — members with focus
  // time logged today, not merely everyone who has joined.
  useEffect(() => {
    if (!previewGroup) { setPreviewStudying(null); return; }
    let cancelled = false;
    studyGroupService.getMemberTimes(previewGroup.id)
      .then((res: any) => {
        if (cancelled) return;
        const members = res?.data?.members || [];
        setPreviewStudying(members.filter((m: any) => (m.focusSeconds || 0) > 0).length);
      })
      .catch(() => { if (!cancelled) setPreviewStudying(0); });
    return () => { cancelled = true; };
  }, [previewGroup?.id]);

  const handleAddGoal = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const title = newGoalInput.trim();
    if (!title || !inRoom || addingGoal) return;
    setAddingGoal(true);
    try {
      const res = await studyGroupService.addGoal(inRoom.id, title);
      if (res.status === 'success' && res.data) {
        setRoomGoals((prev) => [...prev, res.data]);
        setNewGoalInput('');
      }
    } catch {
      // silent
    } finally {
      setAddingGoal(false);
    }
  };

  const handleToggleGoal = async (goalId: string) => {
    if (!inRoom || togglingGoalIds.has(goalId)) return;
    const wasCompleted = myCompletedGoalIds.has(goalId);
    setTogglingGoalIds((prev) => new Set(prev).add(goalId));
    setMyCompletedGoalIds((prev) => {
      const next = new Set(prev);
      if (wasCompleted) next.delete(goalId); else next.add(goalId);
      return next;
    });
    try {
      await studyGroupService.toggleGoal(inRoom.id, goalId);
    } catch {
      setMyCompletedGoalIds((prev) => {
        const next = new Set(prev);
        if (wasCompleted) next.add(goalId); else next.delete(goalId);
        return next;
      });
    } finally {
      setTogglingGoalIds((prev) => { const next = new Set(prev); next.delete(goalId); return next; });
    }
  };

  const handleJoin = async (groupId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const res = await studyGroupService.joinGroup(groupId);
      if (res.status === 'success') {
        await fetchGroups();
        await fetchMyGroups();
        const g = groups.find((x) => x.id === groupId);
        if (g) {
          const joined = { ...g, isMember: true };
          openGroup(joined);
          setInRoom(joined);
          setRoomFocusMode(false);
          setActiveTab('my');
          if (typeof window !== 'undefined') sessionStorage.setItem('rwj_active_room_id', joined.id);
        }
      }
    } catch {
      // silent
    }
  };

  const handleLeaveRoom = async () => {
    if (!inRoom) return;
    await handleLeave(inRoom.id);
    setInRoom(null);
    setRoomFocusMode(false);
    if (typeof window !== 'undefined') sessionStorage.removeItem('rwj_active_room_id');
  };

  const handleLeave = async (groupId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const res = await studyGroupService.leaveGroup(groupId);
      if (res.status === 'success') {
        await fetchGroups();
        await fetchMyGroups();
        if (selectedGroup?.id === groupId) {
          setSelectedGroup(null);
          setMessages([]);
        }
      }
    } catch {
      // silent
    }
  };

  const handleSend = async () => {
    if (!selectedGroup || !messageInput.trim()) return;
    setSending(true);
    try {
      const res = await studyGroupService.postMessage(selectedGroup.id, messageInput.trim());
      if (res.status === 'success' && res.data) {
        setMessages((prev) => [...prev, res.data]);
        setMessageInput('');
      }
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.name) return;
    try {
      const res = await studyGroupService.createGroup({
        name: createForm.name,
        description: createForm.description || createForm.focusTopic || (createForm.subjects || []).join(', '),
        subject: (createForm.subjects && createForm.subjects.length > 0) ? createForm.subjects[0] : createForm.subject,
        maxMembers: createForm.maxMembers,
      });
      if (res.status === 'success') {
        setShowCreate(false);
        setCreateForm({ name: '', description: '', subject: 'Polity', maxMembers: 50, focusTopic: '', subjects: [], timeGoal: 4 });
        await fetchGroups();
        await fetchMyGroups();
      }
    } catch {
      // silent
    }
  };

  const filteredGroups = (activeTab === 'rooms' ? groups : myGroups).filter((g) => {
    const matchSubject = subjectFilter === 'All Rooms' || g.subject === subjectFilter;
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) ||
                        (g.description || '').toLowerCase().includes(search.toLowerCase());
    return matchSubject && matchSearch;
  });

  const totalOnline = groups.reduce((sum, g) => sum + (g.memberCount || 0), 0);
  const liveCount = groups.filter((g) => g.status === 'live').length;

  return (
    <>
    <div className={`sg min-h-screen bg-[#F9FAFB] font-arimo text-[#0C1424]${locked ? ' plan-locked' : ''}`}>
      <style dangerouslySetInnerHTML={{ __html: SG_CSS }} />
      <DashboardPageHero
        // eslint-disable-next-line @next/next/no-img-element
        badgeIcon={<img src="/study-together-icon.png" alt="Study Together" style={{ width: '26px', height: '26px', objectFit: 'contain' }} />}
        badgeText="STUDY TOGETHER"
        title={
          <>
            Your Digital <em className="not-italic" style={{ color: '#E8B84B', fontStyle: 'italic' }}>Study Library</em>
            <br />
            Open 24/7
          </>
        }
        subtitle="Join aspirants. Study with accountability, focus deep, and rise together."
        stats={[
          { value: String(totalOnline || 0), label: 'Online Now', color: '#4ADE80' },
          { value: String(liveCount || 0), label: 'Live Rooms', color: '#FDC700' },
          { value: '2.4h', label: 'Avg. Session', color: '#F87171' },
          { value: String(groups.length || 0), label: 'Groups', color: '#FFFFFF' },
        ]}
        contentShiftY={-20}
        titleMarginBottom={12}
      />

      <main className="mx-auto max-w-[1244px] px-4 pb-16">
        {/* Tabs */}
        <div className="flex flex-col gap-3 border-b border-[#E1E6EF] bg-white px-3 py-3 sm:px-5 md:h-14 md:flex-row md:items-center md:justify-between md:px-8 md:py-0">
          <div className="grid w-full grid-cols-3 gap-1 md:flex md:w-auto">
            <button
              onClick={() => setActiveTab('rooms')}
              className={`flex min-w-0 items-center justify-center gap-1.5 rounded-[8px] px-2 py-2 text-center text-[11px] font-semibold sm:text-[12px] md:px-5 md:text-[13px] ${activeTab === 'rooms' ? 'bg-[#090E1C] text-[#E8B84B]' : 'text-[#6B7A99]'}`}
            >
              ️ Study Rooms
            </button>
            <button
              onClick={() => guard({ kind: 'solo' }, () => setActiveTab('solo'))}
              className={`flex min-w-0 items-center justify-center gap-1.5 rounded-[8px] px-2 py-2 text-center text-[11px] font-semibold sm:text-[12px] md:px-5 md:text-[13px] ${activeTab === 'solo' ? 'bg-[#090E1C] text-[#E8B84B]' : 'text-[#6B7A99]'}`}
            >
              <svg className="hidden shrink-0 sm:block" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 18v-6a9 9 0 1118 0v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" fill="currentColor"/>
              </svg>
              Solo Focus
            </button>
            <button
              onClick={() => guard({ kind: 'mygroup' }, () => setActiveTab('my'))}
              className={`flex min-w-0 items-center justify-center gap-1.5 rounded-[8px] px-2 py-2 text-center text-[11px] font-semibold sm:text-[12px] md:px-5 md:text-[13px] ${activeTab === 'my' ? 'bg-[#090E1C] text-[#E8B84B]' : 'text-[#6B7A99]'}`}
            >
               My Study Group {myGroups.length > 0 ? `(${myGroups.length})` : ''}
            </button>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 md:flex md:w-auto md:gap-3">
            <button
              onClick={() => guard({ kind: 'solo' }, () => setActiveTab('solo'))}
              className="flex min-w-0 items-center justify-center gap-2 rounded-[8px] bg-[#090E1C] px-3 py-2 text-[12px] font-semibold text-white md:px-5 md:text-[13px]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 18v-6a9 9 0 1118 0v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" fill="currentColor"/>
              </svg>
              Solo Session
            </button>
            <button
              onClick={() => guard({ kind: 'create' }, () => setShowCreate(true))}
              className="min-w-0 rounded-[8px] bg-[#E8B84B] px-3 py-2 text-[12px] font-semibold text-[#090E1C] md:px-5 md:text-[13px]"
            >
              + Create Room
            </button>
          </div>
        </div>

        {/* Solo Focus Tab Content – Pomodoro timer */}
        {activeTab === 'solo' && (
          <section className="mt-5">
            <div className="mb-4 flex items-center gap-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M3 18v-6a9 9 0 1118 0v6" stroke="#6B7A99" strokeWidth="2" strokeLinecap="round"/>
                <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" fill="#6B7A99"/>
              </svg>
              <h2 className="text-[24px] font-bold text-[#0C1424]">Solo Session</h2>
            </div>

            <div className="grid items-start gap-5 lg:grid-cols-2">
            <div className="rounded-[18px] border border-[#E1E6EF] bg-white px-6 py-10 shadow-sm">
              {/* Time picker – shown when timer is idle */}
              {!pomoRunning && (
                <div className="mb-8 flex flex-col items-center gap-3">
                  <p className="text-[12px] font-bold uppercase tracking-[1.2px] text-[#6B7A99]">Set Focus Duration</p>
                  <div className="flex items-center gap-2">
                    {[15, 25, 45, 60].map((m) => (
                      <button
                        key={m}
                        onClick={() => handleSetFocusMinutes(m)}
                        className="rounded-[8px] border px-4 py-1.5 text-[13px] font-semibold transition"
                        style={{
                          background: focusMinutes === m ? '#E8B84B' : '#F9FAFB',
                          borderColor: focusMinutes === m ? '#E8B84B' : '#DDE3EC',
                          color: focusMinutes === m ? '#0C1424' : '#6B7A99',
                        }}
                      >
                        {m}m
                      </button>
                    ))}
                    <div className="flex items-center gap-1 rounded-[8px] border border-[#DDE3EC] bg-[#F9FAFB] px-3 py-1.5">
                      <input
                        type="number"
                        min={1}
                        max={180}
                        value={focusMinutes}
                        onChange={(e) => handleSetFocusMinutes(Number(e.target.value))}
                        className="w-12 bg-transparent text-center text-[13px] font-semibold text-[#0C1424] outline-none"
                      />
                      <span className="text-[12px] text-[#6B7A99]">min</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Circular timer */}
              <div className="flex flex-col items-center">
                <div className="relative" style={{ width: 280, height: 280 }}>
                  <svg width="280" height="280" viewBox="0 0 280 280">
                    <circle cx="140" cy="140" r="128" stroke="#F1F3F8" strokeWidth="10" fill="none" />
                    <circle
                      cx="140"
                      cy="140"
                      r="128"
                      stroke={pomoMode === 'focus' ? '#E8B84B' : '#22C55E'}
                      strokeWidth="10"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 128}
                      strokeDashoffset={(2 * Math.PI * 128) * (1 - pomoProgress)}
                      transform="rotate(-90 140 140)"
                      style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div
                      className="text-[#0C1424]"
                      style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 64, lineHeight: 1, letterSpacing: '-1px' }}
                    >
                      {formatMMSS(pomoSecondsLeft)}
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[1.5px] text-[#6B7A99]">
                      {pomoMode === 'focus' ? 'Focus Time' : 'Break Time'}
                      <span aria-hidden>🎯</span>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="mt-6 flex items-center gap-3">
                  <button
                    onClick={handlePomoReset}
                    className="flex items-center gap-2 rounded-[10px] border border-[#DDE3EC] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#6B7A99] hover:bg-[#F9FAFB]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M3 12a9 9 0 1 0 3-6.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 4v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Reset
                  </button>
                  <button
                    onClick={handlePomoStart}
                    className="flex items-center gap-2 rounded-[10px] bg-[#E8B84B] px-7 py-2.5 text-[14px] font-bold text-[#0C1424] hover:brightness-105"
                  >
                    {pomoRunning ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
                        Pause
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5z"/></svg>
                        Start Focus
                      </>
                    )}
                  </button>
                  <button
                    onClick={handlePomoSkip}
                    className="flex items-center gap-2 rounded-[10px] border border-[#DDE3EC] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#6B7A99] hover:bg-[#F9FAFB]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4 5v14l8-7-8-7z"/><path d="M13 5v14l8-7-8-7z"/></svg>
                    Skip
                  </button>
                </div>

                {/* Today total */}
                <div className="mt-8 text-center">
                  <div
                    className="text-[#C99730]"
                    style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 700, fontSize: 22 }}
                  >
                    {formatHourMin(todaySeconds)}
                  </div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-[1.5px] text-[#6B7A99]">
                    Your Time Today
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Study Tasks */}
            <div
              className="bg-white"
              style={{
                borderRadius: 16,
                border: '1px solid rgba(11,22,40,0.09)',
                padding: '41px 25px 25px',
              }}
            >
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 13, color: '#0C1424', margin: 0 }}>
                  📋 Today&apos;s Study Tasks
                </h3>
                <button
                  type="button"
                  onClick={() => taskInputRef.current?.focus()}
                  style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 13, color: '#C99730', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  + Add Task
                </button>
              </div>

              {!tasksLoading && tasks.length === 0 && (
                <p style={{ fontSize: 13, color: '#9AA3B8', marginBottom: 12 }}>No tasks yet. Add one below to track your session goals.</p>
              )}

              {/* Task list */}
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      paddingTop: 9,
                      paddingBottom: 10,
                      borderBottom: '1px solid rgba(11,22,40,0.09)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleTask(task.id)}
                      style={{
                        flexShrink: 0,
                        width: 20,
                        height: 20,
                        borderRadius: 5,
                        border: task.isCompleted ? '1px solid #22C55E' : '1px solid rgba(11,22,40,0.17)',
                        background: task.isCompleted ? '#22C55E' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'background 0.15s, border-color 0.15s',
                      }}
                    >
                      {task.isCompleted && (
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                          <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                    <span
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: 13,
                        fontWeight: 400,
                        color: task.isCompleted ? '#9AA3B8' : '#374560',
                        textDecoration: task.isCompleted ? 'line-through' : 'none',
                      }}
                    >
                      {task.title}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Input row */}
              <form className="mt-3 flex items-center gap-2" onSubmit={addTask}>
                <input
                  ref={taskInputRef}
                  type="text"
                  placeholder="Add a task for this session..."
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  style={{
                    flex: 1,
                    background: '#FAF8F4',
                    border: '1px solid rgba(11,22,40,0.09)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 13,
                    color: '#0C1424',
                    outline: 'none',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(232,184,75,0.5)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(11,22,40,0.09)'; }}
                />
                <button
                  type="submit"
                  disabled={addingTask}
                  style={{
                    background: 'rgba(232,184,75,0.12)',
                    border: '1px solid rgba(232,184,75,0.30)',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontFamily: 'DM Sans, sans-serif',
                    fontWeight: 700,
                    fontSize: 12,
                    color: '#C99730',
                    cursor: addingTask ? 'not-allowed' : 'pointer',
                    opacity: addingTask ? 0.6 : 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {addingTask ? 'Adding…' : 'Add'}
                </button>
              </form>
            </div>
            </div>

            {/* ── Dashboard Stats Row ────────────────────────────── */}
            {(() => {
              const doneTasks = tasks.filter((t) => t.isCompleted).length;
              const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
              const todayWeekIdx = (new Date().getDay() + 6) % 7;
              const totalWeekHours = weeklyHours.reduce((a, b) => a + b, 0);
              const maxBar = Math.max(...weeklyHours, 0.01);
              const totalWeekFormatted = (() => {
                const h = Math.floor(totalWeekHours);
                const m = Math.round((totalWeekHours - h) * 60);
                return h > 0 ? `${h}h ${m}m total` : `${m}m total`;
              })();
              const quotes = [
                { text: '"Success is not final, failure is not fatal: It is the courage to continue that counts."', author: '— Winston Churchill' },
                { text: '"The secret of getting ahead is getting started."', author: '— Mark Twain' },
                { text: '"It does not matter how slowly you go as long as you do not stop."', author: '— Confucius' },
                { text: '"Believe you can and you\'re halfway there."', author: '— Theodore Roosevelt' },
                { text: '"An investment in knowledge pays the best interest."', author: '— Benjamin Franklin' },
                { text: '"The expert in anything was once a beginner."', author: '— Helen Hayes' },
                { text: '"Hard work beats talent when talent doesn\'t work hard."', author: '— Tim Notke' },
              ];
              const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
              const quote = quotes[dayOfYear % quotes.length];

              return (
                <>
                  {/* Stats cards */}
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { value: String(completedSessions), label: 'Sessions Today', color: '#C99730' },
                      { value: String(doneTasks), label: 'Tasks Done', color: '#C99730' },
                      { value: formatHourMin(todaySeconds), label: 'Study Time', color: todaySeconds > 0 ? '#C99730' : '#6B7A99' },
                      { value: `${dayStreak}${dayStreak > 0 ? '🔥' : ''}`, label: 'Day Streak', color: '#C99730' },
                    ].map(({ value, label, color }) => (
                      <div
                        key={label}
                        className="flex flex-col items-center justify-center rounded-[14px] border border-[#E1E6EF] bg-white py-4"
                      >
                        <span className="text-[22px] font-bold" style={{ color }}>{value}</span>
                        <span className="mt-1 text-[11px] text-[#6B7A99]">{label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Motivational quote */}
                  <div
                    className="mt-5 rounded-[14px] px-5 py-5"
                    style={{ background: '#FFFBEF', border: '1.5px solid #E8B84B' }}
                  >
                    <div className="mb-2 flex justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2a7 7 0 017 7c0 3-1.8 5.5-4.5 6.7V17a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1.3C6.8 14.5 5 12 5 9a7 7 0 017-7z" stroke="#C99730" strokeWidth="1.5" fill="#FFF3CD"/>
                        <path d="M9 21h6M10 18v3M14 18v3" stroke="#C99730" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <p
                      className="text-center text-[13px] italic"
                      style={{ fontFamily: 'Georgia, serif', lineHeight: '1.6', color: '#6B4F00' }}
                    >
                      {quote.text}
                    </p>
                    <p className="mt-2 text-center text-[12px] font-semibold" style={{ color: '#C99730' }}>
                      {quote.author}
                    </p>
                  </div>

                  {/* This Week's Study Hours */}
                  <div className="mt-5 rounded-[14px] border border-[#E1E6EF] bg-white px-5 py-4">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-[13px] font-bold text-[#0C1424]">📅 This Week&apos;s Study Hours</span>
                      <span className="text-[12px] font-semibold" style={{ color: '#C99730' }}>{totalWeekFormatted}</span>
                    </div>
                    <div className="flex items-end justify-between gap-2" style={{ height: 88 }}>
                      {weeklyHours.map((h, i) => {
                        const isToday = i === todayWeekIdx;
                        const barH = Math.max(4, (h / maxBar) * 64);
                        return (
                          <div key={weekLabels[i]} className="flex flex-1 flex-col items-center gap-1.5">
                            <div
                              className="w-full rounded-t-[4px]"
                              style={{ height: barH, background: isToday ? '#C99730' : '#EDE8DC' }}
                            />
                            <span
                              className="text-[10px] font-semibold"
                              style={{ color: isToday ? '#C99730' : '#9AA3B8' }}
                            >
                              {weekLabels[i]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Want to study with others? */}
                  <div
                    className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-[14px] px-5 py-4"
                    style={{ background: '#0C1424' }}
                  >
                    <div className="flex items-center gap-3">
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <circle cx="12" cy="10" r="4" fill="#6B7A99"/>
                        <circle cx="20" cy="10" r="4" fill="#4B5A79"/>
                        <path d="M4 26c0-4.4 3.6-8 8-8h8c4.4 0 8 3.6 8 8" stroke="#6B7A99" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <div>
                        <p className="text-[13px] font-bold text-white">Want to study with others?</p>
                        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          Join a Study Room and rise together with 15,000+ aspirants
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('rooms')}
                      className="shrink-0 rounded-[10px] px-5 py-2 text-[12px] font-bold text-[#0C1424] hover:brightness-105"
                      style={{ background: '#C99730' }}
                    >
                      Browse Rooms →
                    </button>
                  </div>

                  {/* Back to Study Rooms */}
                  <div className="mt-5 mb-2 flex justify-center">
                    <button
                      onClick={() => setActiveTab('rooms')}
                      className="text-[12px] font-semibold underline underline-offset-2"
                      style={{ color: '#6B7A99', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      ← Back to Study Rooms
                    </button>
                  </div>
                </>
              );
            })()}
          </section>
        )}

        {/* Study Rooms + My Study Group grids (reference-faithful) */}
        {activeTab !== 'solo' && (() => {
          const isFullGroup = (g: Group) => g.maxMembers > 0 && g.memberCount >= g.maxMembers;
          const stateFiltered = filteredGroups.filter((g) => {
            if (roomStateFilter === 'open') return !isFullGroup(g);
            if (roomStateFilter === 'full') return isFullGroup(g);
            return true;
          });
          const AV_COLORS = ['#1E3A5F', '#2D5016', '#5B2C6F', '#7C4A1E', '#1A4D4D', '#4A1942', '#0F4C75', '#6B3FA0'];
          const enterRoom = (g: Group) => {
            openGroup(g);
            setInRoom(g);
            setRoomFocusMode(false);
            setActiveTab('my');
            if (typeof window !== 'undefined') sessionStorage.setItem('rwj_active_room_id', g.id);
          };
          return (
          <>
            {/* Locked-plan upsell ribbon */}
            {locked && (
              <div className="plan-ribbon">
                <span className="ribbon-spark">✦</span>
                <span>Live Study Rooms are a Rise feature — join peers studying in real time.</span>
                <button className="ribbon-cta" onClick={() => openUpgrade({ kind: 'rooms' })}>Unlock with Rise</button>
              </div>
            )}

            {/* Header row: section label + status pills + search */}
            <section className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <div className="sg-section-label" style={{ flex: '0 0 auto' }}>
                {activeTab === 'rooms' ? 'Available Study Rooms' : 'Your Groups'}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(['all', 'open', 'full'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => guard({ kind: 'filter' }, () => setRoomStateFilter(s))}
                    className={`sg-pill${roomStateFilter === s ? ' active' : ''}`}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {s}
                  </button>
                ))}
                <div className="flex items-center gap-2 rounded-full border border-[#E1E6EF] bg-white px-4 py-2 text-[13px] text-[#757575]">
                  <span>🔍</span>
                  <input
                    type="text"
                    placeholder="Search rooms..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#757575] sm:min-w-[140px]"
                  />
                </div>
              </div>
            </section>

            {/* Grid */}
            {loading ? (
              <div className="mt-8 text-center text-[#6B7A99]">Loading rooms...</div>
            ) : stateFiltered.length === 0 ? (
              <div className="mt-8 text-center text-[#6B7A99]">
                No rooms found. {activeTab === 'rooms' ? 'Be the first to create one!' : 'Join a group to see it here.'}
              </div>
            ) : (
              <section className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {stateFiltered.map((group, index) => {
                  const slug = subjectSlug(group.subject);
                  const st = iconStyle(slug);
                  const border = ROOM_BORDERS[index % ROOM_BORDERS.length];
                  const full = isFullGroup(group);
                  const members = group.members ?? [];
                  return (
                    <article
                      key={group.id}
                      className={`room-card${full && !group.isMember ? ' is-full' : ''}`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                      onClick={() => guard({ kind: 'room', title: group.name, subject: group.subject }, () => (group.isMember ? setPreviewGroup(group) : setJoinPrompt(group)))}
                    >
                      <div className="room-card-top" style={{ background: ROOM_BORDER_HEX[border] }} />
                      <div className="room-card-body">
                        <div className="room-card-title-row">
                          <span
                            className="subject-icon"
                            style={{ background: st.bg, color: st.color }}
                            dangerouslySetInnerHTML={{ __html: SUBJECT_ICONS[slug] || SUBJECT_ICONS.polity }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="room-card-title">{group.name}</div>
                            <div style={{ marginTop: 4, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                              {full ? <span className="badge-full">FULL</span> : <span className="badge-open">OPEN</span>}
                              <span className="badge-subject">{group.subject}</span>
                            </div>
                          </div>
                        </div>
                        <div className="room-card-desc">{group.description || 'A focused space to study together.'}</div>
                        <div className="room-card-footer">
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div className="member-avatars">
                              {members.slice(0, 3).map((m, i) => {
                                const initials = ((m.firstName?.[0] ?? '') + (m.lastName?.[0] ?? '')).toUpperCase() || '?';
                                return (
                                  <span key={i} className="m-av" style={{ background: AV_COLORS[i % AV_COLORS.length] }}>{initials}</span>
                                );
                              })}
                              {members.length === 0 && <span className="m-av" style={{ background: '#1E3A5F' }}>–</span>}
                            </div>
                            <span className="member-count">{group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}</span>
                          </div>
                          {group.isMember ? (
                            <button className="btn-join enter" onClick={(e) => { e.stopPropagation(); enterRoom(group); }}>Enter →</button>
                          ) : full ? (
                            <button className="btn-join full" onClick={(e) => { e.stopPropagation(); guard({ kind: 'room', title: group.name, subject: group.subject }, () => setJoinPrompt(group)); }}>Study Room Full</button>
                          ) : (
                            <button className="btn-join" onClick={(e) => { e.stopPropagation(); guard({ kind: 'room', title: group.name, subject: group.subject }, () => setJoinPrompt(group)); }}>Join Room →</button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </section>
            )}
          </>
          );
        })()}
      </main>

      {/* Create Group Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setShowCreate(false)}>
          <div className="relative w-full max-w-[520px] rounded-[20px] bg-[#F4F6FA] p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => setShowCreate(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#6B7A99] transition hover:bg-[#E1E6EF] hover:text-[#0C1424]"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <span className="text-[24px]">🚀</span>
                <span className="rounded-[8px] bg-[#FFD700] px-3 py-1.5">
                  <h3 className="text-[22px] font-bold text-[#0C1424]" style={{ fontFamily: 'var(--font-cormorant)' }}>
                    Create Study Room
                  </h3>
                </span>
              </div>
              <p className="mt-2 text-[14px] text-[#6B7A99]">
                Set up your space and invite aspirants to study together.
              </p>
            </div>

            {/* Form */}
            <div className="flex flex-col gap-5">
              {/* Room Name */}
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[1px] text-[#6B7A99]">
                  Room Name
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., Polity Warriors · Evening Batch"
                  className="w-full rounded-[12px] border border-[#DDE3EC] bg-white px-4 py-3 text-[14px] text-[#0C1424] outline-none placeholder:text-[#9CA3AF] focus:border-[#E8B84B]"
                />
              </div>

              {/* Room Icon picker */}
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[1px] text-[#6B7A99]">
                  Room Icon
                </label>
                <div className="sg-icon-picker-wrap">
                  <button
                    type="button"
                    className={`sg-icon-trigger${iconPickerOpen ? ' open' : ''}`}
                    onClick={() => setIconPickerOpen((o) => !o)}
                  >
                    <span
                      className="subject-icon"
                      style={{ background: iconStyle(selectedIcon).bg, color: iconStyle(selectedIcon).color }}
                      dangerouslySetInnerHTML={{ __html: SUBJECT_ICONS[selectedIcon] || SUBJECT_ICONS.polity }}
                    />
                    <span className="trigger-label">
                      {SUBJECT_LABELS[selectedIcon] || 'Polity'}
                      <span className="trigger-hint">Click to browse UPSC icons</span>
                    </span>
                    <svg className="trigger-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                  </button>
                  {iconPickerOpen && (
                    <div className="sg-icon-panel">
                      <input
                        type="text"
                        className="sg-icon-search"
                        placeholder="Search icons..."
                        value={iconSearch}
                        onChange={(e) => setIconSearch(e.target.value)}
                      />
                      <div className="sg-icon-grid">
                        {ICON_PICKER_KEYS
                          .filter((k) => !iconSearch || (SUBJECT_LABELS[k] || k).toLowerCase().includes(iconSearch.toLowerCase()))
                          .map((k) => (
                            <button
                              key={k}
                              type="button"
                              title={SUBJECT_LABELS[k] || k}
                              className={`sg-icon-item${selectedIcon === k ? ' selected' : ''}`}
                              onClick={() => { setSelectedIcon(k); setIconPickerOpen(false); setIconSearch(''); }}
                            >
                              <span
                                className="subject-icon"
                                style={{ background: iconStyle(k).bg, color: iconStyle(k).color }}
                                dangerouslySetInnerHTML={{ __html: SUBJECT_ICONS[k] }}
                              />
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Group Rules */}
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[1px] text-[#6B7A99]">
                  Group Rules <span className="font-normal normal-case text-[#9CA3AF]">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={createForm.focusTopic || ''}
                  onChange={(e) => setCreateForm((p) => ({ ...p, focusTopic: e.target.value }))}
                  placeholder="Describe the group, its purpose, rules, joining criteria, expectations from members, and include a motivational welcome message for aspirants."
                  className="w-full resize-none rounded-[12px] border border-[#DDE3EC] bg-white px-4 py-3 text-[14px] text-[#0C1424] outline-none placeholder:text-[#9CA3AF] focus:border-[#E8B84B]"
                />
              </div>

              {/* Capacity & Daily Time Goal */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[1px] text-[#6B7A99]">
                    Capacity
                  </label>
                  <select
                    value={createForm.maxMembers}
                    onChange={(e) => setCreateForm((p) => ({ ...p, maxMembers: Number(e.target.value) }))}
                    className="w-full appearance-none rounded-[12px] border border-[#DDE3EC] bg-white px-4 py-3 text-[14px] text-[#0C1424] outline-none focus:border-[#E8B84B]"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                  >
                    {[0, 5, 10, 20, 50, 100].map((n) => (
                      <option key={n} value={n}>{n === 0 ? 'Unlimited' : `${n} People`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[1px] text-[#6B7A99]">
                    Daily Time Goal
                  </label>
                  <select
                    value={createForm.timeGoal || 4}
                    onChange={(e) => setCreateForm((p) => ({ ...p, timeGoal: Number(e.target.value) }))}
                    className="w-full appearance-none rounded-[12px] border border-[#DDE3EC] bg-white px-4 py-3 text-[14px] text-[#0C1424] outline-none focus:border-[#E8B84B]"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                  >
                    {[1, 2, 3, 4, 5, 6, 8].map((h) => (
                      <option key={h} value={h}>{h} {h === 1 ? 'hour' : 'hours'} per day</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => {
                  setShowCreate(false);
                  setCreateForm({ name: '', description: '', subject: 'Polity', maxMembers: 50, focusTopic: '', subjects: [], timeGoal: 4 });
                }}
                className="flex-1 rounded-[12px] border border-[#DDE3EC] bg-white py-3 text-[14px] font-semibold text-[#6B7A99] hover:bg-[#F9FAFB]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!createForm.name}
                className="flex-[2] rounded-[12px] bg-[#0C1424] py-3 text-[14px] font-bold text-[#E8B84B] disabled:opacity-50 hover:bg-[#17223E]"
              >
                🚀 Go Live Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Room Preview Modal ─────────────────────────────────────────── */}
      {previewGroup && (() => {
        const pv = previewGroup;
        const pslug = subjectSlug(pv.subject);
        const pst = iconStyle(pslug);
        const pfull = pv.maxMembers > 0 && pv.memberCount >= pv.maxMembers;
        const pmembers = pv.members ?? [];
        const AV = ['#2D5016', '#5B2C6F', '#1A4D4D', '#7C4A1E', '#4A1942', '#0F4C75', '#6B3FA0', '#B91C1C'];
        return (
          <div className="sg-overlay" onClick={() => setPreviewGroup(null)}>
            <div className="sg-preview-box" onClick={(e) => e.stopPropagation()}>
              <div className="sg-preview-header">
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: pst.color }} />
                <button className="sg-preview-close" onClick={() => setPreviewGroup(null)}>×</button>
                <div className="sg-preview-badges">
                  {pfull ? <span className="badge-full">FULL</span> : <span className="badge-open">OPEN</span>}
                  <span className="badge-subject">{pv.subject}</span>
                </div>
                {pv.creator && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 9999, background: '#F4C430', color: '#0B1021', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
                    Admin: {(pv.creator.firstName || 'Host')}{pv.creator.lastName ? ` ${pv.creator.lastName}` : ''}
                  </div>
                )}
                <h2 className="sg-preview-title">{pv.name}</h2>
                <p className="sg-preview-desc">{pv.description || 'A focused space to study together.'}</p>
              </div>
              <div className="sg-preview-body">
                <div className="sg-preview-stats">
                  <div className="sg-preview-stat"><span className="sg-preview-stat-num" style={{ color: '#22C55E' }}>{previewStudying ?? '—'}</span><span className="sg-preview-stat-lbl">Studying Now</span></div>
                  <div className="sg-preview-stat"><span className="sg-preview-stat-num" style={{ color: '#E6B800' }}>{pv.memberCount}/{pv.maxMembers > 0 ? pv.maxMembers : '∞'}</span><span className="sg-preview-stat-lbl">Members</span></div>
                  <div className="sg-preview-stat"><span className="sg-preview-stat-num" style={{ color: '#3B82F6' }}>2.4h</span><span className="sg-preview-stat-lbl">Avg Session</span></div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 12 }}>Studying Now</div>
                {pmembers.length === 0 ? (
                  <div style={{ color: '#9CA3AF', fontSize: 14, padding: 20, textAlign: 'center' }}>No one studying right now. Be the first!</div>
                ) : (
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {pmembers.slice(0, 8).map((m, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <div style={{ position: 'relative', width: 52, height: 52, borderRadius: '50%', background: AV[i % AV.length], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 700 }}>
                          {((m.firstName?.[0] ?? '') || '?').toUpperCase()}
                          <span style={{ position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: '50%', border: '2px solid #fff', background: '#22C55E' }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{m.firstName || 'Member'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="sg-preview-footer">
                <button className="sg-btn-back" onClick={() => setPreviewGroup(null)}>Go Back</button>
                {pv.isMember ? (
                  <button className="sg-btn-primary" onClick={() => {
                    const g = pv; setPreviewGroup(null); openGroup(g); setInRoom(g); setRoomFocusMode(false); setActiveTab('my');
                    if (typeof window !== 'undefined') sessionStorage.setItem('rwj_active_room_id', g.id);
                  }}>Enter Room →</button>
                ) : pfull ? (
                  <button className="sg-btn-primary" style={{ background: '#F3F4F6', color: '#9CA3AF', cursor: 'not-allowed' }} disabled>Study Room Full</button>
                ) : (
                  <button className="sg-btn-primary" onClick={() => { const id = pv.id; setPreviewGroup(null); handleJoin(id); }}>Join Room →</button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Join Study Room prompt (non-members) ───────────────────────── */}
      {joinPrompt && (() => {
        const jp = joinPrompt;
        const jslug = subjectSlug(jp.subject);
        const jst = iconStyle(jslug);
        const jfull = jp.maxMembers > 0 && jp.memberCount >= jp.maxMembers;
        return (
          <div className="sg-overlay" onClick={() => !joining && setJoinPrompt(null)}>
            <div className="sg-join-box" onClick={(e) => e.stopPropagation()}>
              <button className="sg-preview-close" onClick={() => !joining && setJoinPrompt(null)} disabled={joining}>×</button>
              <div className="sg-join-icon" style={{ background: jst.bg, color: jst.color }} dangerouslySetInnerHTML={{ __html: SUBJECT_ICONS[jslug] || SUBJECT_ICONS.polity }} />
              <h3 className="sg-join-title">Join Study Room</h3>
              <p className="sg-join-name">{jp.name}</p>
              <div className="sg-join-badges">
                <span className="badge-subject">{jp.subject}</span>
                <span className="badge-subject">{jp.memberCount}{jp.maxMembers > 0 ? `/${jp.maxMembers}` : ''} members</span>
              </div>
              <p className="sg-join-desc">
                {jfull
                  ? 'This room has reached its capacity. Try another room to start studying with a group.'
                  : (jp.description || 'Join this room to study alongside the group and track focus time together.')}
              </p>
              <div className="sg-join-note">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                You need to join before you can enter and start studying.
              </div>
              <div className="sg-join-footer">
                <button className="sg-btn-back" onClick={() => setJoinPrompt(null)} disabled={joining}>Cancel</button>
                {jfull ? (
                  <button className="sg-btn-primary" style={{ background: '#F3F4F6', color: '#9CA3AF', cursor: 'not-allowed' }} disabled>Room Full</button>
                ) : (
                  <button
                    className="sg-btn-primary"
                    disabled={joining}
                    onClick={async () => {
                      const id = jp.id;
                      setJoining(true);
                      try { await handleJoin(id); setJoinPrompt(null); }
                      finally { setJoining(false); }
                    }}
                  >
                    {joining ? 'Joining…' : 'Join Study Room →'}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Upgrade Modal (Free/Aspire plans) ──────────────────────────── */}
      {upgrade && (
        <div className="sg-overlay" onClick={() => setUpgrade(null)}>
          <div className="sg-upgrade" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button className="sg-upgrade-close" aria-label="Close" onClick={() => setUpgrade(null)}>×</button>
            <div className="sg-upgrade-head">
              <div className="sg-upgrade-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>
              </div>
              <h2 className="sg-upgrade-title">{upgrade.title}</h2>
              <p className="sg-upgrade-sub">{upgrade.sub}</p>
            </div>
            <div className="sg-upgrade-social">
              <div className="member-avatars" style={{ display: 'flex' }}>
                {[['RK', '#5B2C6F'], ['MT', '#1E4E8C'], ['PS', '#166534'], ['AS', '#8B5CF6'], ['SN', '#B8860B']].map(([t, c]) => (
                  <span key={t} className="m-av" style={{ background: c }}>{t}</span>
                ))}
              </div>
              <div className="sg-upgrade-social-text"><span className="live-dot" />237 students studying right now</div>
            </div>
            <div className="sg-upgrade-benefits">
              {[
                ['Solo Focus rooms', ' with Pomodoro timer & task tracker'],
                ['Live subject groups', ' — Polity, History, Economy & more'],
                ['Weekly focus streaks', ' & leaderboard among 15,000+ aspirants'],
              ].map(([b, rest]) => (
                <div key={b} className="sg-upgrade-benefit">
                  <div className="sg-upgrade-benefit-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <div className="sg-upgrade-benefit-text"><b>{b}</b>{rest}</div>
                </div>
              ))}
            </div>
            <div className="sg-upgrade-plans">
              <div className="sg-upgrade-plan featured" onClick={() => { if (typeof window !== 'undefined') window.location.assign('/pricing'); }}>
                <div className="sg-upgrade-plan-badge">{PLAN_PRICES.rise.badge}</div>
                <div className="sg-upgrade-plan-name">Rise</div>
                <div className="sg-upgrade-plan-tag">{PLAN_PRICES.rise.tag}</div>
                <div className="sg-upgrade-plan-price">₹{PLAN_PRICES.rise.price}<small>{PLAN_PRICES.rise.suffix}</small></div>
                <button className="btn">Start with Rise →</button>
              </div>
              <div className="sg-upgrade-plan" onClick={() => { if (typeof window !== 'undefined') window.location.assign('/pricing'); }}>
                <div className="sg-upgrade-plan-badge">{PLAN_PRICES.ascent.badge}</div>
                <div className="sg-upgrade-plan-name">Ascent</div>
                <div className="sg-upgrade-plan-tag">{PLAN_PRICES.ascent.tag}</div>
                <div className="sg-upgrade-plan-price">₹{PLAN_PRICES.ascent.price}<small>{PLAN_PRICES.ascent.suffix}</small></div>
                <button className="btn ghost">Compare Ascent</button>
              </div>
            </div>
            <div className="sg-upgrade-trust">
              {['Cancel anytime', '7-day access on us', 'Instant activation'].map((t) => (
                <span key={t}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> {t}</span>
              ))}
            </div>
            <button className="sg-upgrade-later" onClick={() => setUpgrade(null)}>Maybe later</button>
          </div>
        </div>
      )}
    </div>

    {/* ── Full-screen Room View ────────────────────────────────────────── */}
    {inRoom && (
      <div className="fixed inset-0 z-[200] flex flex-col" style={{ background: '#F8F3EA' }}>

        {/* Dark Navbar — matches DashboardHeader exactly */}
        <header
          className="flex shrink-0 items-center justify-between px-3 md:px-6"
          style={{ background: 'rgba(7,14,30,0.98)', backdropFilter: 'blur(24px) saturate(200%)', borderBottom: '1px solid rgba(255,255,255,0.06)', height: 64 }}
        >
          {/* Logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="RiseWithJeet Logo" className="h-auto w-[90px] md:w-[110px] object-contain" />

          {/* Center tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setInRoom(null); setRoomFocusMode(false); setActiveTab('rooms'); }}
              className="px-4 py-2 text-[13px] font-semibold text-white/60 hover:text-white/90 transition"
            >
              Study Rooms
            </button>
            <button
              onClick={() => { setInRoom(null); setRoomFocusMode(false); setActiveTab('solo'); }}
              className="px-4 py-2 text-[13px] font-semibold text-white/60 hover:text-white/90 transition"
            >
              Solo Focus
            </button>
            <button
              className="flex items-center gap-2 rounded-[8px] px-4 py-2 text-[13px] font-bold text-white"
              style={{ background: 'rgba(255,255,255,0.12)' }}
            >
              <span className="text-[10px]">■</span> My Study Group
            </button>
          </div>

          {/* Right actions — mirrors DashboardHeader */}
          <div className="flex items-center gap-3">
            {/* Focus Mode pill */}
            <button
              type="button"
              onClick={() => setRoomFocusMode((active) => !active)}
              aria-pressed={roomFocusMode}
              title={roomFocusMode ? 'Focus mode on - chat hidden' : 'Focus mode off - chat visible'}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
              style={{
                background: roomFocusMode ? 'rgba(239,68,68,0.16)' : 'rgba(34,197,94,0.12)',
                border: `1px solid ${roomFocusMode ? 'rgba(239,68,68,0.34)' : 'rgba(34,197,94,0.28)'}`,
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: roomFocusMode ? '#EF4444' : '#22C55E' }}
              />
              <span className="text-[12px] font-semibold text-white/80">🎯 Focus Mode</span>
            </button>

            {/* Upgrade button — gold filled, matching Image #8 */}
            <button
              className="hidden sm:inline-flex items-center gap-1.5 rounded-[12px] px-4 py-2 text-[13px] font-semibold"
              style={{ background: '#E8B84B', color: '#0C1424', border: 'none' }}
            >
              + Upgrade
            </button>

            {/* Bell — same style as DashboardHeader */}
            <button
              className="relative flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-[#1a2540] text-white hover:bg-[#243050] transition-colors flex-shrink-0"
              style={{ border: '1px solid rgba(255,255,255,0.16)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"/>
                <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"/>
              </svg>
            </button>

            {/* User avatar — gold gradient with real initials */}
            <div
              className="flex h-[38px] w-[38px] items-center justify-center rounded-full text-[14px] font-bold text-[#0E182D]"
              style={{ background: 'linear-gradient(135deg, #FFD170 0%, #D4A843 100%)' }}
            >
              {userInitials}
            </div>
          </div>
        </header>

        {/* Room header bar */}
        <div
          className="flex shrink-0 items-center justify-between px-6 py-3"
          style={{ background: 'white', borderBottom: '1px solid #E8E3D8' }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold text-[#EF4444]"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <span className="h-2 w-2 rounded-full bg-[#EF4444]" /> Live
            </span>
            <div>
              <h1 className="text-[18px] font-bold text-[#0C1424]">{inRoom.name}</h1>
              <p className="text-[12px] text-[#6B7A99]">{inRoom.description || inRoom.subject}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#E1E6EF] bg-white text-[18px] hover:bg-[#F4F6FA] transition">
              🔕
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#E1E6EF] bg-white text-[18px] hover:bg-[#F4F6FA] transition">
              🎯
            </button>
            <button
              onClick={handleLeaveRoom}
              className="rounded-[10px] border border-[#EF4444] bg-[#FFF5F5] px-5 py-2 text-[13px] font-bold text-[#EF4444] hover:bg-[#FEF2F2] transition"
            >
              Leave Room
            </button>
          </div>
        </div>

        {/* Body: main area + chat panel */}
        <div className="flex flex-1 overflow-hidden">

          {/* Main scrollable area */}
          <div className="flex-1 overflow-y-auto p-6">

            {/* Pomodoro timer card */}
            <div
              className="mb-5 rounded-[20px] bg-white p-8"
              style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
            >
              {/* Circular timer */}
              <div className="flex flex-col items-center">
                <div className="relative" style={{ width: 220, height: 220 }}>
                  <svg width="220" height="220" viewBox="0 0 220 220">
                    <circle cx="110" cy="110" r="100" stroke="#EDE8DC" strokeWidth="8" fill="none"/>
                    <circle
                      cx="110" cy="110" r="100"
                      stroke={pomoMode === 'focus' ? '#C99730' : '#22C55E'}
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 100}
                      strokeDashoffset={(2 * Math.PI * 100) * (1 - pomoProgress)}
                      transform="rotate(-90 110 110)"
                      style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div
                      className="text-[#0C1424]"
                      style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 52, lineHeight: 1, letterSpacing: '-1px' }}
                    >
                      {formatMMSS(pomoSecondsLeft)}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[1.5px] text-[#6B7A99]">
                      {pomoMode === 'focus' ? 'Focus Time' : 'Break Time'} <span>🎯</span>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-[11px] font-bold uppercase tracking-[1.2px] text-[#6B7A99]">
                  🔴 Pomodoro · Session {pomoSession} of 4
                </p>

                {/* Studying status — user isn't counted until they start */}
                <div
                  className="mt-3 flex items-center gap-2 rounded-full px-4 py-1.5 text-[12px] font-semibold"
                  style={
                    isStudying
                      ? { background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.28)', color: '#166534' }
                      : { background: '#F1F3F8', border: '1px solid #E1E6EF', color: '#6B7A99' }
                  }
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: isStudying ? '#22C55E' : '#9CA3AF' }} />
                  {isStudying
                    ? "You're studying — counted in this room's live total"
                    : 'Click “Start Studying” to begin and make your day count'}
                </div>

                {/* Controls */}
                <div className="mt-5 flex items-center gap-3">
                  <button
                    onClick={handlePomoReset}
                    className="flex items-center gap-2 rounded-[10px] border border-[#DDE3EC] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#6B7A99] hover:bg-[#F9FAFB]"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path d="M3 12a9 9 0 1 0 3-6.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 4v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Reset
                  </button>
                  <button
                    onClick={toggleStudying}
                    className="flex items-center gap-2 rounded-[10px] px-7 py-2.5 text-[14px] font-bold text-[#0C1424] hover:brightness-105"
                    style={{ background: isStudying ? '#E8E3D8' : '#C99730' }}
                  >
                    {isStudying ? (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
                        Pause Studying
                      </>
                    ) : (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5z"/></svg>
                        Start Studying
                      </>
                    )}
                  </button>
                  <button
                    onClick={handlePomoSkip}
                    className="flex items-center gap-2 rounded-[10px] border border-[#DDE3EC] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#6B7A99] hover:bg-[#F9FAFB]"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M4 5v14l8-7-8-7z"/><path d="M13 5v14l8-7-8-7z"/></svg>
                    Skip
                  </button>
                </div>

                {/* Today total */}
                <div className="mt-6 text-center">
                  <div
                    className="text-[#C99730]"
                    style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 700, fontSize: 26 }}
                  >
                    {formatHourMin(todaySeconds)}
                  </div>
                  <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[1.5px] text-[#6B7A99]">
                    Your Time Today
                  </div>
                </div>
              </div>
            </div>

            {/* Studying Now card */}
            <div
              className="rounded-[20px] bg-white p-6"
              style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
            >
              {(() => {
                const othersStudying = memberTimes.filter((m) => m.userId !== user?.id && (m.focusSeconds || 0) > 0).length;
                const studyingCount = othersStudying + (isStudying ? 1 : 0);
                return (
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-[#6B7A99]">Studying Now</p>
                    <span
                      className="rounded-full px-3 py-1 text-[11px] font-bold"
                      style={studyingCount > 0
                        ? { background: 'rgba(34,197,94,0.12)', color: '#166534' }
                        : { background: '#F1F3F8', color: '#6B7A99' }}
                    >
                      {studyingCount} {studyingCount === 1 ? 'person' : 'people'} studying
                    </span>
                  </div>
                );
              })()}
              <div className="flex flex-wrap gap-5">
                {(() => {
                  const AVATAR_COLORS = ['#172444', '#1E3A8A', '#1D4ED8', '#166534', '#78350F', '#134E4A', '#5B21B6', '#9D174D'];
                  return memberTimes.slice(0, 6).map((m, idx) => {
                    const isMe = m.userId === user?.id;
                    const displayTime = isMe ? formatHourMin(todaySeconds) : formatHourMin(m.focusSeconds);
                    const active = isMe ? isStudying : m.focusSeconds > 0;
                    return (
                      <div key={m.userId} className="flex flex-col items-center gap-1.5">
                        <div className="relative">
                          <div
                            className="flex h-12 w-12 items-center justify-center rounded-full text-[16px] font-bold text-white"
                            style={{ background: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}
                          >
                            {(isMe ? 'You' : m.name).charAt(0).toUpperCase()}
                          </div>
                          <span
                            className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white"
                            style={{ background: active ? '#22C55E' : '#6B7A99' }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-[#0C1424]">{isMe ? 'You' : m.name}</span>
                        <span className="text-[10px] text-[#6B7A99]">{displayTime}</span>
                      </div>
                    );
                  });
                })()}
                {inRoom.memberCount > 6 && (
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full text-[12px] font-bold text-[#6B7A99]"
                      style={{ background: '#F1F3F8', border: '1px dashed #DDE3EC' }}
                    >
                      +{inRoom.memberCount - 6}
                    </div>
                    <span className="text-[11px] font-semibold text-[#6B7A99]">more</span>
                    <span className="text-[10px] text-transparent">.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat panel */}
          {!roomFocusMode && (
          <div
            className="flex w-[295px] shrink-0 flex-col"
            style={{ background: '#FAF6EE', borderLeft: '1px solid #E8E3D8' }}
          >
            {/* Tabs */}
            <div className="flex shrink-0 border-b border-[#E8E3D8] bg-white px-4">
              {(['chat', 'goals', 'board'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setChatTab(t)}
                  className="relative px-3 py-3 text-[13px] font-semibold capitalize transition"
                  style={{ color: chatTab === t ? '#C99730' : '#6B7A99' }}
                >
                  {t === 'chat' ? '💬' : t === 'goals' ? '🎯' : '🏆'} {t.charAt(0).toUpperCase() + t.slice(1)}
                  {chatTab === t && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t bg-[#C99730]" />
                  )}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {chatTab === 'chat' && (
                <div className="flex flex-col gap-3">
                  {/* System join message */}
                  <div className="text-center">
                    <span className="rounded-full bg-[#EDE8DC] px-3 py-1 text-[11px] text-[#6B7A99]">
                      You joined the room
                    </span>
                  </div>

                  {messages.length === 0 ? (
                    <p className="text-center text-[12px] text-[#9AA3B8]">No messages yet. Say hello! 👋</p>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className="flex items-start gap-2.5">
                        <div
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                          style={{ background: '#172444' }}
                        >
                          {msg.user?.firstName?.[0] || 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-bold text-[#0C1424]">
                              {msg.user?.firstName || 'User'}
                            </span>
                            <span className="text-[10px] text-[#9AA3B8]">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div
                            className="mt-1 rounded-[10px] px-3 py-2 text-[12px] text-[#0C1424]"
                            style={{ background: 'rgba(255,255,255,0.7)' }}
                          >
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
              {chatTab === 'goals' && (
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-[#6B7A99]">🎯 Room Goals Today</p>
                      <span className="text-[11px] font-semibold text-[#6B7A99]">
                        {myCompletedGoalIds.size}/{roomGoals.length} completed
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#EDE8DC]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: roomGoals.length ? `${(myCompletedGoalIds.size / roomGoals.length) * 100}%` : '0%',
                          background: '#C99730',
                          transition: 'width 0.2s ease',
                        }}
                      />
                    </div>
                  </div>

                  {roomGoals.length === 0 ? (
                    <p className="py-4 text-center text-[12px] text-[#9AA3B8]">No goals yet. Add one below to kick off the session.</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {roomGoals.map((goal) => {
                        const done = myCompletedGoalIds.has(goal.id);
                        return (
                          <li key={goal.id} className="flex items-center gap-2.5 rounded-[10px] bg-white px-3 py-2.5">
                            <button
                              type="button"
                              onClick={() => handleToggleGoal(goal.id)}
                              disabled={togglingGoalIds.has(goal.id)}
                              style={{
                                flexShrink: 0,
                                width: 18,
                                height: 18,
                                borderRadius: 5,
                                border: done ? '1px solid #22C55E' : '1px solid rgba(11,22,40,0.17)',
                                background: done ? '#22C55E' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                padding: 0,
                              }}
                            >
                              {done && (
                                <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                                  <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </button>
                            <span
                              className="text-[12px]"
                              style={{ color: done ? '#9AA3B8' : '#0C1424', textDecoration: done ? 'line-through' : 'none' }}
                            >
                              {goal.title}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  <form className="flex items-center gap-2" onSubmit={handleAddGoal}>
                    <input
                      type="text"
                      value={newGoalInput}
                      onChange={(e) => setNewGoalInput(e.target.value)}
                      placeholder="Add a goal for the room..."
                      className="flex-1 rounded-[8px] border border-[#E1E6EF] bg-[#F8F3EA] px-3 py-2 text-[12px] text-[#0C1424] outline-none placeholder:text-[#9CA3AF]"
                    />
                    <button
                      type="submit"
                      disabled={addingGoal || !newGoalInput.trim()}
                      className="rounded-[8px] px-3 py-2 text-[12px] font-bold text-[#0C1424] disabled:opacity-50"
                      style={{ background: '#C99730' }}
                    >
                      {addingGoal ? '…' : '+ Add'}
                    </button>
                  </form>

                  <div className="border-t border-[#E8E3D8] pt-3 text-center">
                    <div
                      className="text-[#C99730]"
                      style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 700, fontSize: 20 }}
                    >
                      {formatHourMin(teamTotalSeconds)}
                    </div>
                    <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[1.5px] text-[#6B7A99]">
                      Team Total Today
                    </div>
                  </div>
                </div>
              )}
              {chatTab === 'board' && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="text-[32px]">🏆</span>
                  <p className="mt-2 text-[13px] font-semibold text-[#0C1424]">Leaderboard</p>
                  <p className="mt-1 text-[12px] text-[#9AA3B8]">See who&apos;s studying the most today.</p>
                </div>
              )}
            </div>

            {/* Warning footer */}
            <div
              className="shrink-0 border-t border-[#E8E3D8] px-4 py-2 text-center text-[11px] text-[#9AA3B8]"
              style={{ background: 'white' }}
            >
              ⬆ Be respectful — abusive messages → permanent ban
            </div>

            {/* Input */}
            <div
              className="shrink-0 flex items-center gap-2 border-t border-[#E8E3D8] px-3 py-3"
              style={{ background: 'white' }}
            >
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                placeholder="Say something..."
                className="flex-1 rounded-[8px] border border-[#E1E6EF] bg-[#F8F3EA] px-3 py-2 text-[12px] text-[#0C1424] outline-none placeholder:text-[#9CA3AF]"
              />
              <button
                onClick={handleSend}
                disabled={sending || !messageInput.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-[8px] disabled:opacity-50"
                style={{ background: '#C99730' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
                </svg>
              </button>
              <button
                onClick={() => setRoomFocusMode(true)}
                className="rounded-[8px] border border-[#DDE3EC] bg-white px-3 py-2 text-[12px] font-semibold text-[#6B7A99] hover:bg-[#F4F6FA]"
              >
                Hide
              </button>
            </div>
          </div>
          )}
        </div>
      </div>
    )}
    </>
  );
}
