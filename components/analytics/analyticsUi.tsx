'use client';

import React from 'react';

/* ─────────────────────────────────────────────────────────────
   Shared analytics UI kit — ported from the approved PRD HTML
   references (performance_analytics / test-analytics). Provides the
   card/section 3D treatment, styled section dividers and the
   icon-left stat card used by both the Performance Analytics and
   Test Analytics pages, so the two screens share one faithful look.

   NOTE: This is presentation only. Plan-based blur/lock stays with
   the existing entitlement components (LockedAnalyticsCard /
   LockedWidget), driven by the user's real subscription.
   ───────────────────────────────────────────────────────────── */

const ANALYTICS_UI_CSS = `
/* Card base + 3D hover lift (reference: --card-shadow, translateY(-6px), gold border) */
.pa-card {
  background: #FFFFFF;
  border-radius: 12px;
  border: 1.5px solid #EDEDF0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04);
  position: relative;
  overflow: hidden;
  transition: transform 0.3s cubic-bezier(0.25,1,0.5,1), box-shadow 0.3s cubic-bezier(0.25,1,0.5,1), border-color 0.3s;
}
.pa-card-3d { cursor: default; }
.pa-card-3d:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.10);
  border-color: #F5C542;
}
/* Gold glow bar that sweeps in along the top edge on hover */
.pa-glow {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, #F5C542, #f5d77a, #F5C542);
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 4;
}
.pa-card-3d:hover .pa-glow { opacity: 1; }

/* Icon-left stat card (sizes ported 1:1 from the approved HTML reference, which
   sets html{font-size:14px} — e.g. .stat-label 0.62rem = 8.7px, .stat-value
   1.55rem = 21.7px, .stat-sub 0.65rem = 9.1px, .stat-icon 1.1rem = 15.4px). */
.pa-stat-card { display: flex; align-items: flex-start; gap: 8px; padding: 18px 12px; }
.pa-stat-icon {
  width: 36px; height: 36px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15.4px; line-height: 1;
  flex-shrink: 0;
}
.pa-stat-info { flex: 1; min-width: 0; }
.pa-stat-label {
  font-size: 8.7px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5px; color: #64748b; margin-bottom: 3px;
  white-space: normal; line-height: 1.3; overflow-wrap: break-word;
}
.pa-stat-value { font-size: 21.7px; font-weight: 700; line-height: 1; margin-bottom: 3px; }
.pa-stat-sub { font-size: 9.1px; color: #64748b; display: flex; align-items: center; gap: 2px; white-space: normal; line-height: 1.3; overflow-wrap: break-word; margin-top: 0; }
.pa-stat-sub .pa-up { color: #22C55E; font-weight: 700; }
.pa-stat-sub .pa-down { color: #EF4444; font-weight: 700; }

/* Chart filter toggle (Day / Week / Month) — ported 1:1 from the HTML
   reference's .chart-filter-toggle / .chart-filter-btn (0.72rem = 10.08px). */
.pa-filter-toggle { display: flex; gap: 2px; margin-left: auto; background: #f1f5f9; border-radius: 8px; padding: 2px; }
.pa-filter-btn {
  padding: 4px 12px; border-radius: 6px; border: none; background: transparent;
  font-family: inherit; font-size: 10.08px; font-weight: 600; color: #64748b;
  cursor: pointer; transition: all 0.15s;
}
.pa-filter-btn:hover { color: #1e293b; }
.pa-filter-btn.pa-filter-btn-active {
  background: #fff; color: #1e293b; box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

/* Test History series/sort filter buttons — ported 1:1 from the HTML
   reference's .filter-label / .history-filter-btn / .sort-btn (.72rem = 10.08px
   label, .75rem = 10.5px buttons). */
.pa-filter-label { font-size: 10.08px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
.pa-history-btn {
  padding: 5px 12px; border-radius: 6px; border: 1px solid #e2e8f0; background: #fff;
  font-family: inherit; font-size: 10.5px; font-weight: 600; color: #64748b;
  cursor: pointer; transition: all 0.15s;
}
.pa-history-btn:hover { border-color: #cbd5e1; color: #1e293b; }
.pa-history-btn.pa-history-btn-active { background: #1E2028; border-color: #1E2028; color: #fff; }

/* Section divider (line — LABEL — line) */
.pa-divider { display: flex; align-items: center; gap: 16px; margin: 32px 0 24px; }
.pa-divider::before, .pa-divider::after { content: ''; flex: 1; height: 1px; background: #E2E8F0; }
.pa-divider > span {
  font-size: 10.9px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 1.5px; color: #64748b; white-space: nowrap;
}

/* 3D navy + gold button (reference .btn-cta) */
.pa-btn-3d {
  background: #1E2028; color: #F5C542;
  border: 1.5px solid transparent; border-radius: 10px;
  font-weight: 700; cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}
.pa-btn-3d:hover {
  transform: translateY(-1px);
  border-color: #F5C542;
  box-shadow: 0 0 0 2px rgba(245,197,66,0.35), 0 0 18px rgba(245,197,66,0.35), 0 6px 20px rgba(30,32,40,0.25);
}

/* Small interaction accents from the reference */
.pa-trio { transition: background 0.15s, transform 0.15s; }
.pa-trio:hover { background: #F1F5F9 !important; transform: translateX(4px); }
.pa-cal-day { transition: transform 0.15s; }
.pa-cal-day:hover { transform: scale(1.05); }
.pa-link-gold { transition: color 0.2s; }
.pa-link-gold:hover { color: #d4a843; }
/* Achievement badge card (.badge-card in the reference). Colours/opacity are set
   inline per badge; the shared shadow + hover lift live here. */
.pa-badge-card {
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04);
  transition: transform 0.2s, box-shadow 0.2s;
}
.pa-badge-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
}
`;

export function AnalyticsUiStyles() {
  return <style dangerouslySetInnerHTML={{ __html: ANALYTICS_UI_CSS }} />;
}

export function SectionDivider({ label }: { label: string }) {
  return (
    <div className="pa-divider">
      <span>{label}</span>
    </div>
  );
}

/** Icon-left stat card matching the reference stats row (gold glow + 3D hover). */
export function StatCard({
  label,
  value,
  icon,
  color,
  sub,
  trend = 'up',
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  /** Accent hex used for the value text and the icon tile background. */
  color: string;
  sub?: React.ReactNode;
  /** Arrow shown before the sub text: 'up' (green), 'down' (red) or 'none'. */
  trend?: 'up' | 'down' | 'none';
}) {
  return (
    <div className="pa-card pa-card-3d pa-stat-card">
      <span className="pa-glow" />
      <div className="pa-stat-icon" style={{ background: `${color}1F`, border: `1px solid ${color}33` }}>
        {icon}
      </div>
      <div className="pa-stat-info">
        <div className="pa-stat-label">{label}</div>
        <div className="pa-stat-value" style={{ color }}>{value}</div>
        {sub != null && (
          <div className="pa-stat-sub">
            {trend === 'up' && <span className="pa-up">↑</span>}
            {trend === 'down' && <span className="pa-down">↓</span>}
            <span>{sub}</span>
          </div>
        )}
      </div>
    </div>
  );
}
