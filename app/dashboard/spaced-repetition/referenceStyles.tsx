'use client';

import React from 'react';

/**
 * Scoped port of the reference HTML/CSS (RiseWithJeet | Spaced Repetition).
 * Everything is namespaced under `.sr-scope` so it never collides with the
 * surrounding dashboard styles. This reproduces — exactly — every section
 * BELOW the blue hero: subject cards, the science/timeline/retention sections,
 * the notification preview, the CTA banner, the full question view and the
 * Add-Question / Review modals.
 *
 * Only the keyframes leak to the global scope (CSS keyframes can't be scoped),
 * so they are prefixed with `sr-` to stay collision-free.
 */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=DM+Sans:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');

.sr-scope{
  --dark:#0a0e17;--dark-card:#111827;--dark-border:#1e293b;
  --gold:#d4af37;--gold-light:#f5e6a3;--gold-dim:rgba(212,175,55,.15);
  --purple:#7c3aed;--purple-light:#a78bfa;--purple-dim:rgba(124,58,237,.12);
  --orange:#f59e0b;--orange-light:#fbbf24;
  --green:#10b981;--green-light:#6ee7b7;--green-dim:rgba(16,185,129,.12);
  --red:#ef4444;--red-light:#fca5a5;--red-dim:rgba(239,68,68,.1);
  --blue:#3b82f6;--blue-dim:rgba(59,130,246,.1);
  --bg:#f8f9fb;--white:#ffffff;--card:#ffffff;
  --text:#1a1a2e;--text-mid:#4b5563;--text-light:#9ca3af;
  --border:#e5e7eb;--border-light:#f3f4f6;
  --radius:14px;--radius-sm:10px;--radius-xs:8px;
  --shadow:0 1px 3px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.04);
  --shadow-lg:0 4px 24px rgba(0,0,0,.08),0 1px 4px rgba(0,0,0,.04);
  --font-serif:'Playfair Display',Georgia,serif;
  --font-sans:'DM Sans','Inter',system-ui,sans-serif;
  --font-display:'Instrument Serif',Georgia,serif;
  font-family:var(--font-sans);
  background:var(--bg);
  color:var(--text);
  line-height:1.6;
  -webkit-font-smoothing:antialiased;
}
.sr-scope *,.sr-scope *::before,.sr-scope *::after{box-sizing:border-box}
.sr-scope h1,.sr-scope h2,.sr-scope h3,.sr-scope h4,.sr-scope p{margin:0}
.sr-scope button{font-family:inherit}

/* === SECTION HEADERS === */
.sr-scope .section-header{text-align:center;margin-bottom:48px}
.sr-scope .section-badge{display:inline-flex;align-items:center;gap:6px;background:var(--gold-dim);color:var(--gold);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;padding:6px 14px;border-radius:20px;margin-bottom:14px}
.sr-scope .section-header h2{font-family:var(--font-serif);font-size:clamp(26px,3.5vw,38px);font-weight:700;color:var(--text);line-height:1.2;margin-bottom:10px}
.sr-scope .section-header h2 em{font-family:var(--font-serif);font-style:italic;font-weight:800;color:var(--gold)}
.sr-scope .section-header p{color:var(--text-mid);font-size:15px;max-width:540px;margin:0 auto}

/* === SUBJECT CARDS === */
.sr-scope .subjects-section{padding:32px 32px 32px;max-width:1100px;margin:0 auto}
.sr-scope .subjects-header{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:32px;flex-wrap:wrap;gap:16px;padding-bottom:20px;border-bottom:1px solid var(--border-light)}
.sr-scope .subjects-header .left h2{font-family:var(--font-serif);font-size:28px;font-weight:700;line-height:1.3}
.sr-scope .subjects-header .left h2 em{font-family:var(--font-serif);font-style:italic;font-weight:800;background:linear-gradient(135deg,var(--gold),var(--orange));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-shadow:0 2px 12px rgba(212,175,55,.15)}
.sr-scope .subjects-header .left p{font-size:15px;color:var(--text-mid);margin-top:6px;font-weight:500;letter-spacing:.01em}
.sr-scope .add-q-btn{background:linear-gradient(135deg,var(--gold),var(--orange));color:var(--dark);border:none;padding:12px 24px;border-radius:var(--radius-sm);font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all .3s cubic-bezier(.4,0,.2,1);font-family:var(--font-sans);box-shadow:0 4px 16px rgba(212,175,55,.35);letter-spacing:.02em}
.sr-scope .add-q-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 6px 24px rgba(212,175,55,.5)}
.sr-scope .add-q-btn:disabled{opacity:.55;cursor:not-allowed}
.sr-scope .subjects-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px}
.sr-scope .subject-card{border:1px solid var(--border);border-radius:var(--radius);padding:20px;cursor:pointer;transition:all .3s cubic-bezier(.4,0,.2,1);position:relative;overflow:hidden;text-decoration:none;color:inherit;display:block}
.sr-scope .subject-card:hover{transform:translateY(-3px);box-shadow:var(--shadow-lg);border-color:transparent}
.sr-scope .subject-card .card-accent{position:absolute;top:0;left:0;right:0;height:3px;opacity:0;transition:opacity .3s}
.sr-scope .subject-card:hover .card-accent{opacity:1}
.sr-scope .subject-card .s-icon{font-size:28px;margin-bottom:10px;display:block}
.sr-scope .subject-card h3{font-family:var(--font-serif);font-size:16px;font-weight:700;margin-bottom:6px}
.sr-scope .subject-card .s-status{font-size:12px;color:var(--text-mid);margin-bottom:10px;font-weight:500}
.sr-scope .subject-card .s-bar{height:4px;background:var(--border-light);border-radius:4px;overflow:hidden;margin-bottom:12px}
.sr-scope .subject-card .s-bar-fill{height:100%;border-radius:4px;transition:width .6s ease}
.sr-scope .subject-card .s-action{font-size:12px;color:var(--text-light);font-weight:500;display:flex;align-items:center;gap:4px;transition:color .2s}
.sr-scope .subject-card:hover .s-action{color:var(--gold)}
.sr-scope .subject-card .s-badge{position:absolute;top:12px;right:12px;font-size:10px;font-weight:600;padding:3px 8px;border-radius:10px}
.sr-scope .subject-card .s-badge.warn{background:var(--red-dim);color:var(--red)}
.sr-scope .subject-card .s-badge.good{background:var(--green-dim);color:var(--green)}
.sr-scope .subject-card .s-badge.mid{background:rgba(245,158,11,.12);color:var(--orange)}
.sr-scope .subject-card.tint-yellow{background:#fffbeb}
.sr-scope .subject-card.tint-green{background:#f0fdf4}
.sr-scope .subject-card.tint-peach{background:#fff7ed}
.sr-scope .subject-card.tint-mint{background:#ecfdf5}
.sr-scope .subject-card.tint-rose{background:#fff1f2}
.sr-scope .subject-card .s-click-hint{position:absolute;bottom:8px;right:12px;font-size:10px;color:var(--text-light);opacity:0;transition:opacity .25s}
.sr-scope .subject-card:hover .s-click-hint{opacity:1}

/* === SCHEDULE TIMELINE === */
.sr-scope .schedule-section{padding:64px 32px;max-width:1100px;margin:0 auto}
.sr-scope .timeline-viz{position:relative;padding:20px 0}
.sr-scope .timeline-track{display:flex;align-items:center;gap:0;justify-content:center;overflow-x:auto}
.sr-scope .timeline-node{display:flex;flex-direction:column;align-items:center;position:relative;flex:0 0 auto}
.sr-scope .timeline-node .node-card{background:var(--white);border:1px solid var(--border);border-radius:var(--radius);padding:18px 16px;width:140px;text-align:center;box-shadow:var(--shadow);transition:all .35s cubic-bezier(.4,0,.2,1);position:relative;overflow:hidden}
.sr-scope .timeline-node .node-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg)}
.sr-scope .timeline-node .node-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;border-radius:var(--radius) var(--radius) 0 0}
.sr-scope .timeline-node.day0 .node-card::before{background:var(--gold)}
.sr-scope .timeline-node.day3 .node-card::before{background:var(--orange)}
.sr-scope .timeline-node.day7 .node-card::before{background:var(--orange-light)}
.sr-scope .timeline-node.day15 .node-card::before{background:var(--red-light)}
.sr-scope .timeline-node.day30 .node-card::before{background:var(--green)}
.sr-scope .node-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;font-size:20px}
.sr-scope .day0 .node-icon{background:var(--gold-dim)}
.sr-scope .day3 .node-icon{background:rgba(245,158,11,.12)}
.sr-scope .day7 .node-icon{background:rgba(245,158,11,.08)}
.sr-scope .day15 .node-icon{background:var(--red-dim)}
.sr-scope .day30 .node-icon{background:var(--green-dim)}
.sr-scope .node-card h4{font-family:var(--font-serif);font-size:14px;font-weight:700;margin-bottom:4px}
.sr-scope .node-card .node-day{font-size:12px;color:var(--text-mid);font-weight:500}
.sr-scope .node-card .node-subject{display:inline-block;margin-top:8px;font-size:11px;font-weight:600;padding:3px 10px;border-radius:12px}
.sr-scope .day0 .node-subject{background:var(--gold-dim);color:var(--gold)}
.sr-scope .day3 .node-subject{background:rgba(245,158,11,.12);color:var(--orange)}
.sr-scope .day7 .node-subject{background:rgba(245,158,11,.08);color:#b45309}
.sr-scope .day15 .node-subject{background:var(--red-dim);color:var(--red)}
.sr-scope .day30 .node-subject{background:var(--green-dim);color:var(--green)}
.sr-scope .timeline-connector{display:flex;align-items:center;padding:0;align-self:center;margin-bottom:10px;flex-shrink:0}
.sr-scope .timeline-connector .conn-line{width:40px;height:0;border-top:2px dashed #9ca3af;opacity:.6}
.sr-scope .timeline-connector .conn-arrow{width:0;height:0;border-top:6px solid transparent;border-bottom:6px solid transparent;border-left:7px solid #9ca3af;opacity:.6}
.sr-scope .schedule-legend{display:flex;justify-content:center;gap:24px;margin-top:36px;flex-wrap:wrap}
.sr-scope .legend-item{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-mid)}
.sr-scope .legend-dot{width:10px;height:10px;border-radius:50%}

/* Retention curve */
.sr-scope .retention-curve{margin:40px auto 0;max-width:700px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius);padding:28px;box-shadow:var(--shadow);opacity:0;transform:translateY(20px);transition:all .6s ease}
.sr-scope .retention-curve.visible{opacity:1;transform:translateY(0)}
.sr-scope .retention-curve h3{font-family:var(--font-serif);font-size:18px;margin-bottom:4px}
.sr-scope .retention-curve .curve-sub{font-size:13px;color:var(--text-light);margin-bottom:20px}
.sr-scope .curve-svg{width:100%;height:180px}
.sr-scope .curve-svg .draw-line{stroke-dasharray:1000;stroke-dashoffset:1000;transition:stroke-dashoffset 2s ease}
.sr-scope .retention-curve.visible .draw-line{stroke-dashoffset:0}

/* Timeline node animations */
.sr-scope .timeline-node{opacity:0;transform:translateY(24px);transition:all .5s cubic-bezier(.4,0,.2,1)}
.sr-scope .timeline-node.visible{opacity:1;transform:translateY(0)}
.sr-scope .timeline-connector{opacity:0;transition:opacity .4s ease}
.sr-scope .timeline-connector.visible{opacity:1}

/* Intervals explanation */
.sr-scope .intervals-explanation{max-width:800px;margin:0 auto 48px;padding:0 20px}
.sr-scope .explanation-text{text-align:center;font-size:15px;color:var(--text-mid);line-height:1.7;margin-bottom:32px}
.sr-scope .benefits-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px}
.sr-scope .benefit-card{background:var(--white);border:1px solid var(--border);border-radius:var(--radius);padding:24px;text-align:center;transition:all .3s}
.sr-scope .benefit-card:hover{border-color:var(--gold);transform:translateY(-2px);box-shadow:var(--shadow)}
.sr-scope .benefit-icon{font-size:32px;margin-bottom:12px}
.sr-scope .benefit-card h3{font-family:var(--font-serif);font-size:16px;font-weight:700;margin-bottom:8px;color:var(--text)}
.sr-scope .benefit-card p{font-size:13px;color:var(--text-mid);line-height:1.6}

/* Retention curve info */
.sr-scope .retention-info{max-width:700px;margin:24px auto 0;padding:20px;background:var(--bg);border-radius:var(--radius-sm);border-left:3px solid var(--gold)}
.sr-scope .retention-info p{font-size:13px;color:var(--text-mid);line-height:1.7;margin:0}
.sr-scope .retention-info strong{color:var(--text);font-weight:600}

/* === NOTIFICATION SECTION === */
.sr-scope .notif-section{padding:48px 32px;background:var(--dark);background-image:radial-gradient(circle at 30% 70%,rgba(212,175,55,.06) 0%,transparent 50%),radial-gradient(circle at 70% 30%,rgba(212,175,55,.04) 0%,transparent 50%);position:relative;border-radius:var(--radius)}
.sr-scope .notif-section .section-header h2{color:#fff}
.sr-scope .notif-section .section-header p{color:#9ca3af}
.sr-scope .notif-section .section-badge{background:var(--gold-dim);color:var(--gold-light)}
.sr-scope .notif-cards-wrap{display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:820px;margin:0 auto}
.sr-scope .notif-preview{background:var(--dark-card);border:1px solid var(--dark-border);border-radius:var(--radius);padding:14px 18px;transition:all .3s;position:relative;overflow:hidden}
.sr-scope .notif-preview:hover{border-color:rgba(255,255,255,.12);transform:translateY(-2px)}
.sr-scope .notif-preview .np-time{font-size:11px;color:#6b7280;font-weight:600;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em}
.sr-scope .notif-preview .np-title{font-size:14px;font-weight:600;color:#fff;margin-bottom:4px;line-height:1.4}
.sr-scope .notif-preview .np-desc{font-size:13px;color:#9ca3af;line-height:1.5;margin-bottom:8px}
.sr-scope .notif-preview .np-desc strong{color:#d1d5db}
.sr-scope .notif-preview .np-action{font-size:13px;font-weight:600;color:var(--gold);display:inline-flex;align-items:center;gap:4px;cursor:pointer;transition:color .2s}
.sr-scope .notif-preview .np-action:hover{color:var(--gold-light)}
.sr-scope .notif-preview.daily{border-left:3px solid var(--gold)}
.sr-scope .notif-preview.overdue{border-left:3px solid var(--red)}
.sr-scope .notif-helper{max-width:820px;margin:32px auto 0;display:flex;gap:24px;justify-content:center;flex-wrap:wrap}
.sr-scope .notif-helper-item{display:flex;align-items:center;gap:8px;font-size:13px;color:#6b7280}
.sr-scope .notif-helper-item .nh-icon{font-size:16px;opacity:.7}

/* === CTA BANNER === */
.sr-scope .cta-section{padding:32px 32px 64px;max-width:1100px;margin:0 auto}
.sr-scope .cta-banner{background:linear-gradient(135deg,#fbbf24 0%,#f97316 60%,#ea580c 100%);border-radius:var(--radius);padding:40px 44px;display:flex;align-items:center;justify-content:space-between;gap:24px;position:relative;overflow:hidden}
.sr-scope .cta-banner::before{content:'';position:absolute;top:-50px;right:-50px;width:200px;height:200px;background:radial-gradient(circle,rgba(255,255,255,.15) 0%,transparent 70%);pointer-events:none}
.sr-scope .cta-banner .cta-left{flex:1}
.sr-scope .cta-banner .cta-text h3{font-family:var(--font-serif);font-size:24px;font-weight:700;color:#1a1a2e;margin-bottom:8px;line-height:1.3}
.sr-scope .cta-banner .cta-text p{font-size:14px;color:#4a3520;line-height:1.6;margin-bottom:20px;max-width:500px}
.sr-scope .cta-buttons{display:flex;gap:12px;flex-wrap:wrap}
.sr-scope .cta-btn-dark{background:#1a1a2e;color:#fff;border:none;padding:11px 24px;border-radius:22px;font-size:14px;font-weight:600;cursor:pointer;transition:all .25s;font-family:var(--font-sans);text-decoration:none;display:inline-block}
.sr-scope .cta-btn-dark:hover{background:#000;transform:translateY(-1px)}
.sr-scope .cta-btn-light{background:#fff;color:#1a1a2e;border:1px solid rgba(0,0,0,.12);padding:11px 24px;border-radius:22px;font-size:14px;font-weight:600;cursor:pointer;transition:all .25s;font-family:var(--font-sans);text-decoration:none;display:inline-block}
.sr-scope .cta-btn-light:hover{background:#fafafa;transform:translateY(-1px)}
.sr-scope .cta-rocket{font-size:100px;flex-shrink:0;position:relative;z-index:1;filter:drop-shadow(0 8px 24px rgba(0,0,0,.2));animation:sr-rocketFloat 4s ease-in-out infinite}
@keyframes sr-rocketFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}

/* === CONNECTOR NOTE === */
.sr-scope .connector-note{max-width:820px;margin:0 auto;padding:48px 32px;text-align:center}
.sr-scope .connector-note .cn-title{font-family:var(--font-serif);font-size:22px;font-weight:600;color:var(--text);line-height:1.4;margin-bottom:12px}
.sr-scope .connector-note .cn-sub{font-size:14px;color:var(--text-mid);line-height:1.7;max-width:560px;margin:0 auto}

/* === QUESTION VIEW === */
.sr-scope.question-view,.sr-scope .question-view{max-width:1100px;margin:0 auto;padding:32px;animation:sr-fadeUp .4s ease both}
.sr-scope .qv-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:16px}
.sr-scope .qv-header .qv-left{display:flex;align-items:center;gap:14px}
.sr-scope .qv-back{width:38px;height:38px;border-radius:10px;background:var(--white);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;flex-shrink:0}
.sr-scope .qv-back:hover{background:var(--bg);border-color:var(--gold)}
.sr-scope .qv-back svg{width:18px;height:18px;stroke:var(--text-mid);fill:none;stroke-width:2}
.sr-scope .qv-title h2{font-family:var(--font-serif);font-size:22px;font-weight:700}
.sr-scope .qv-title .qv-subject-badge{display:inline-flex;align-items:center;gap:6px;background:var(--gold-dim);border:1px solid rgba(212,175,55,.3);color:var(--text);padding:6px 14px;border-radius:20px;font-size:13px;font-weight:600;margin-top:8px}
.sr-scope .qv-title .qv-subject-badge span{font-size:16px}
.sr-scope .qv-title .qv-count{display:inline-flex;align-items:center;justify-content:center;background:var(--red);color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;margin-left:8px;vertical-align:middle}
.sr-scope .qv-title p{font-size:13px;color:var(--text-mid);margin-top:2px}

/* Filters */
.sr-scope .qv-filters{display:flex;gap:8px;margin-bottom:24px;flex-wrap:wrap}
.sr-scope .qv-filter{background:var(--white);border:1px solid var(--border);padding:7px 16px;border-radius:20px;font-size:13px;font-weight:500;cursor:pointer;transition:all .2s;font-family:var(--font-sans);color:var(--text-mid);display:flex;align-items:center;gap:6px}
.sr-scope .qv-filter:hover{border-color:var(--text-mid)}
.sr-scope .qv-filter.active{background:linear-gradient(135deg,var(--gold),var(--orange));color:#fff;border-color:var(--gold);box-shadow:0 2px 8px rgba(212,175,55,.25)}
.sr-scope .qv-filter .f-count{font-size:11px;opacity:.7}

/* Add custom question row */
.sr-scope .qv-add-custom{background:var(--white);padding:20px 24px;display:flex;align-items:center;gap:14px;cursor:pointer;transition:background .2s}
.sr-scope .qv-add-custom:hover{background:#fffbeb}
.sr-scope .qv-add-icon{width:40px;height:40px;border-radius:50%;background:var(--gold-dim);display:flex;align-items:center;justify-content:center;font-size:18px;color:var(--gold);flex-shrink:0}
.sr-scope .qv-add-text h4{font-size:14px;font-weight:600;color:var(--text)}
.sr-scope .qv-add-text p{font-size:12px;color:var(--text-light)}
.sr-scope .qv-add-btn{background:linear-gradient(135deg,var(--gold),var(--orange));color:#fff;border:none;padding:8px 18px;border-radius:var(--radius-xs);font-size:13px;font-weight:600;cursor:pointer;margin-left:auto;font-family:var(--font-sans);transition:all .25s;box-shadow:0 2px 8px rgba(212,175,55,.25)}
.sr-scope .qv-add-btn:hover{box-shadow:0 4px 12px rgba(212,175,55,.4);transform:translateY(-1px)}

/* Table layout */
.sr-scope .qv-table-wrap{margin-bottom:24px}
.sr-scope .qv-col-headers{display:grid;grid-template-columns:2.5fr 100px 110px 160px 50px;gap:16px;padding:12px 24px;background:var(--border-light);border-radius:var(--radius-sm) var(--radius-sm) 0 0;border:1px solid var(--border);border-bottom:none;align-items:center}
.sr-scope .qv-col-headers span{font-size:11px;font-weight:700;color:var(--text-light);letter-spacing:.06em;text-transform:uppercase}
.sr-scope .qv-col-headers .qh-question{text-align:left}
.sr-scope .qv-col-headers .qh-subject,
.sr-scope .qv-col-headers .qh-review,
.sr-scope .qv-col-headers .qh-schedule,
.sr-scope .qv-col-headers .qh-remind{text-align:center}
.sr-scope .qv-list{display:flex;flex-direction:column;gap:1px;background:var(--border-light);border:1px solid var(--border);border-radius:0 0 var(--radius) var(--radius);overflow:hidden}
.sr-scope .qv-question{background:var(--white);padding:20px 24px;display:grid;grid-template-columns:2.5fr 100px 110px 160px 50px;gap:16px;align-items:center;transition:background .2s;cursor:pointer;border-left:3px solid transparent}
.sr-scope .qv-question:hover{background:#fffbeb;border-left-color:var(--gold)}
.sr-scope .qv-q-content{min-width:0}
.sr-scope .qv-q-text{font-size:14px;font-weight:500;color:var(--text);margin-bottom:6px;line-height:1.5}
.sr-scope .qv-q-tags{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.sr-scope .qv-tag{font-size:10px;font-weight:600;padding:2px 8px;border-radius:8px;display:inline-flex;align-items:center;gap:3px}
.sr-scope .qv-tag.overdue{background:var(--red-dim);color:var(--red)}
.sr-scope .qv-tag.custom{background:rgba(107,114,128,.08);color:var(--text-mid)}
.sr-scope .qv-tag.today{background:var(--gold-dim);color:#b45309}
.sr-scope .qv-tag.upcoming{background:var(--green-dim);color:var(--green)}
.sr-scope .qv-tag.flashcard{background:var(--green-dim);color:var(--green)}
.sr-scope .qv-flashcard-btn{background:none;border:none;cursor:pointer;padding:0;font-size:10px;font-weight:600;color:var(--blue);display:inline-flex;align-items:center;gap:3px}
.sr-scope .qv-flashcard-btn:hover{text-decoration:underline}
.sr-scope .qv-delete-btn{opacity:0;transition:opacity .2s;background:none;border:none;cursor:pointer;padding:2px 6px;border-radius:6px;display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:600;color:var(--red)}
.sr-scope .qv-delete-btn:hover{background:var(--red-dim)}
.sr-scope .qv-question:hover .qv-delete-btn{opacity:1}
.sr-scope .qv-subject-col{display:flex;align-items:center;justify-content:center}
.sr-scope .qv-subject-pill{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--text-mid);background:var(--gold-dim);padding:6px 12px;border-radius:20px}
.sr-scope .qv-subject-pill .sp-dot{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;background:rgba(212,175,55,.3)}
.sr-scope .qv-review-col{display:flex;align-items:center;justify-content:center}
.sr-scope .qv-review-status{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;text-align:center}
.sr-scope .qv-review-status.overdue{color:var(--red)}
.sr-scope .qv-review-status.today{color:#b45309}
.sr-scope .qv-review-status.upcoming{color:var(--green)}
.sr-scope .qv-schedule{display:flex;align-items:center;justify-content:center;gap:4px}
.sr-scope .qv-schedule-btn{padding:5px 10px;border-radius:6px;font-size:11px;font-weight:600;border:1px solid var(--border);background:var(--white);cursor:pointer;transition:all .2s;font-family:var(--font-sans);color:var(--text-mid)}
.sr-scope .qv-schedule-btn:hover{border-color:var(--gold);color:#b45309}
.sr-scope .qv-schedule-btn.active{background:linear-gradient(135deg,var(--gold),var(--orange));color:#fff;border-color:var(--gold);box-shadow:0 2px 8px rgba(212,175,55,.25)}
.sr-scope .qv-remind-toggle{width:34px;height:20px;background:var(--border);border-radius:10px;position:relative;cursor:pointer;transition:background .25s;justify-self:center;border:none;padding:0;flex-shrink:0}
.sr-scope .qv-remind-toggle.on{background:var(--green)}
.sr-scope .qv-remind-toggle::after{content:'';position:absolute;top:2px;left:2px;width:16px;height:16px;background:#fff;border-radius:50%;transition:transform .25s;box-shadow:0 1px 2px rgba(0,0,0,.15)}
.sr-scope .qv-remind-toggle.on::after{transform:translateX(14px)}
.sr-scope .qv-empty{background:var(--white);border:1px solid var(--border);border-top:none;padding:48px 24px;text-align:center;color:var(--text-light);font-size:14px}
.sr-scope .qv-upgrade-prompt-bottom{text-align:center;margin-top:20px;padding:14px;background:var(--gold-dim);border-radius:var(--radius-sm);font-size:13px;color:var(--text-mid);border:1px solid rgba(212,175,55,.2)}
.sr-scope .qv-upgrade-prompt-bottom strong{color:#b45309}

/* === MODALS === */
.sr-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;animation:sr-fadeIn .25s ease;font-family:'DM Sans','Inter',system-ui,sans-serif;
  --dark:#0a0e17;--gold:#d4af37;--gold-light:#f5e6a3;--gold-dim:rgba(212,175,55,.15);
  --orange:#f59e0b;--green:#10b981;--green-dim:rgba(16,185,129,.12);--red:#ef4444;
  --blue:#3b82f6;--blue-dim:rgba(59,130,246,.1);--white:#fff;
  --text:#1a1a2e;--text-mid:#4b5563;--text-light:#9ca3af;--bg:#f8f9fb;
  --border:#e5e7eb;--border-light:#f3f4f6;--radius:14px;--radius-sm:10px;--radius-xs:8px;
  --font-serif:'Playfair Display',Georgia,serif;--font-sans:'DM Sans','Inter',system-ui,sans-serif;}
.sr-modal-overlay *{box-sizing:border-box}
.sr-modal-box{background:var(--white);border-radius:18px;max-width:520px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.15);animation:sr-scaleIn .3s cubic-bezier(.4,0,.2,1)}
.sr-modal-box .modal-header{padding:20px 24px 0;display:flex;align-items:center;justify-content:space-between}
.sr-modal-box .modal-header h3{font-family:var(--font-serif);font-size:20px;font-weight:700;margin:0}
.sr-modal-box .modal-close{width:32px;height:32px;border-radius:50%;background:var(--bg);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s;font-size:18px;color:var(--text-mid)}
.sr-modal-box .modal-close:hover{background:var(--border)}
.sr-modal-box .modal-body{padding:16px 24px 24px}
.sr-modal-box .modal-form-group{margin-bottom:14px}
.sr-modal-box .modal-form-group label{display:block;font-size:12px;font-weight:600;color:var(--text-mid);margin-bottom:5px;text-transform:uppercase;letter-spacing:.04em}
.sr-modal-box .modal-form-group input,.sr-modal-box .modal-form-group textarea,.sr-modal-box .modal-form-group select{width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:var(--radius-xs);font-size:14px;font-family:var(--font-sans);color:var(--text);transition:border-color .2s;background:var(--white)}
.sr-modal-box .modal-form-group input:focus,.sr-modal-box .modal-form-group textarea:focus,.sr-modal-box .modal-form-group select:focus{outline:none;border-color:var(--gold)}
.sr-modal-box .modal-form-group textarea{resize:vertical;min-height:60px}
.sr-modal-box .modal-tags{display:flex;gap:8px;flex-wrap:wrap}
.sr-modal-box .modal-tag{padding:5px 14px;border-radius:16px;font-size:12px;font-weight:500;border:1px solid var(--border);background:var(--white);cursor:pointer;transition:all .2s;font-family:var(--font-sans);color:var(--text-mid)}
.sr-modal-box .modal-tag:hover{border-color:var(--text-mid);color:var(--text)}
.sr-modal-box .modal-tag.selected{background:linear-gradient(135deg,var(--gold),var(--orange));color:#fff;border-color:var(--gold);font-weight:600;box-shadow:0 2px 8px rgba(212,175,55,.25)}
.sr-modal-box .modal-custom-days{display:flex;align-items:center;gap:8px;margin-top:8px}
.sr-modal-box .modal-custom-days input{width:96px}
.sr-modal-box .modal-custom-days span{font-size:13px;color:var(--text-mid)}
.sr-modal-box .modal-error{font-size:12px;font-weight:500;color:var(--red);margin-bottom:8px}
.sr-modal-box .modal-submit{width:100%;padding:10px;border:none;border-radius:var(--radius-sm);font-size:14px;font-weight:700;cursor:pointer;font-family:var(--font-sans);transition:all .25s;margin-top:4px}
.sr-modal-box .modal-submit.primary{background:linear-gradient(135deg,var(--orange),#ea580c);color:#fff;box-shadow:0 2px 8px rgba(245,158,11,.3)}
.sr-modal-box .modal-submit.primary:hover:not(:disabled){box-shadow:0 4px 16px rgba(245,158,11,.4);transform:translateY(-1px)}
.sr-modal-box .modal-submit:disabled{opacity:.5;cursor:not-allowed}
/* Review modal */
.sr-modal-box .review-tags{display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap}
.sr-modal-box .review-tag{font-size:12px;font-weight:600;padding:4px 12px;border-radius:12px}
.sr-modal-box .review-question{font-family:var(--font-serif);font-size:22px;font-weight:700;color:var(--text);margin-bottom:20px;line-height:1.4}
.sr-modal-box .show-answer-btn{width:100%;padding:16px;background:linear-gradient(135deg,var(--orange),#ea580c);color:#fff;border:none;border-radius:var(--radius-sm);font-size:15px;font-weight:700;cursor:pointer;font-family:var(--font-sans);transition:all .25s;box-shadow:0 4px 16px rgba(245,158,11,.3);margin-bottom:12px}
.sr-modal-box .show-answer-btn:hover{transform:translateY(-1px);box-shadow:0 6px 24px rgba(245,158,11,.4)}
.sr-modal-box .answer-reveal{background:var(--green-dim);border:1px solid rgba(16,185,129,.2);border-radius:var(--radius-sm);padding:16px;margin-bottom:16px;font-size:14px;color:var(--text);line-height:1.6;animation:sr-fadeUp .3s ease}
.sr-modal-box .answer-reveal strong{color:var(--green)}
.sr-modal-box .review-close-btn{width:100%;padding:12px;background:transparent;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-weight:500;cursor:pointer;font-family:var(--font-sans);color:var(--text-mid);transition:all .2s}
.sr-modal-box .review-close-btn:hover{border-color:var(--text-mid);color:var(--text)}
/* Modal dark header */
.sr-modal-box .modal-header-dark{background:var(--dark);color:#fff;padding:16px 24px;border-radius:var(--radius) var(--radius) 0 0;display:flex;align-items:center;justify-content:space-between}
.sr-modal-box .modal-header-dark h3{font-family:var(--font-serif);font-size:20px;font-weight:700;margin:0;color:#fff;display:flex;align-items:center;gap:8px}
.sr-modal-box .modal-header-dark h3 svg{stroke:var(--gold);filter:drop-shadow(0 0 4px rgba(212,175,55,.3))}
.sr-modal-box .modal-close-light{background:transparent;border:none;color:#fff;font-size:24px;cursor:pointer;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:all .2s}
.sr-modal-box .modal-close-light:hover{background:rgba(255,255,255,.1)}
.sr-modal-box .optional-tag{color:var(--text-light);font-size:12px;font-weight:400;font-style:italic}

/* === ANIMATIONS === */
@keyframes sr-fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes sr-fadeIn{from{opacity:0}to{opacity:1}}
@keyframes sr-scaleIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
.sr-scope .anim-fade-up{animation:sr-fadeUp .6s ease both}
.sr-scope .anim-fade-up-d1{animation:sr-fadeUp .6s ease .1s both}
.sr-scope .anim-fade-up-d2{animation:sr-fadeUp .6s ease .2s both}
.sr-scope .anim-fade-up-d3{animation:sr-fadeUp .6s ease .3s both}
.sr-scope .anim-fade-up-d4{animation:sr-fadeUp .6s ease .4s both}

/* === RESPONSIVE === */
@media(max-width:768px){
  .sr-scope .schedule-section,.sr-scope .subjects-section,.sr-scope .cta-section{padding:40px 16px}
  .sr-scope .notif-section{padding:40px 16px}
  .sr-scope.question-view,.sr-scope .question-view{padding:16px}
  .sr-scope .timeline-track{flex-direction:column;align-items:center}
  .sr-scope .timeline-connector{transform:rotate(90deg);margin:8px 0}
  .sr-scope .subjects-grid{grid-template-columns:repeat(auto-fill,minmax(160px,1fr))}
  .sr-scope .notif-cards-wrap{grid-template-columns:1fr}
  .sr-scope .cta-banner{flex-direction:column;text-align:center}
  .sr-scope .cta-buttons{justify-content:center}
  .sr-scope .qv-col-headers{display:none}
  .sr-scope .qv-question{grid-template-columns:1fr}
}
`;

export default function SpacedRepStyles() {
  return <style dangerouslySetInnerHTML={{ __html: CSS }} />;
}
