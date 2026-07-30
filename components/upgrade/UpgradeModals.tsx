'use client';

/**
 * Plan-limit upgrade modals.
 * Faithful ports of the approved designs in upgrade_htmls/ - one shell shared by
 * every feature, with per-feature icon/copy variants keyed by plan tier.
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlanTier } from '@/contexts/EntitlementsContext';

/* ------------------------------------------------------------------ */
/* Shared styles (ported from upgrade_htmls modal CSS)                 */
/* ------------------------------------------------------------------ */

const SHARED_CSS = `
.upm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 15, 0.65);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: upmFadeIn 0.3s ease;
  z-index: 1000;
  font-family: var(--font-dm-sans), 'DM Sans', sans-serif;
}
.upm-modal {
  background: #FFFFFF;
  border-radius: 20px;
  width: 100%;
  max-width: 420px;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  padding: 36px 32px 32px;
  position: relative;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.15), 0 8px 20px rgba(0, 0, 0, 0.08);
  animation: upmSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.upm-modal::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, #F5C542, transparent);
  border-radius: 20px 20px 0 0;
}
.upm-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #F5F5F7;
  color: #6B7080;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 16px;
  line-height: 1;
}
.upm-close:hover { background: #E8E8EC; color: #1E2028; }
.upm-icon {
  width: 72px;
  height: 72px;
  margin: 0 auto 24px;
  border-radius: 50%;
  background: #101827;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 26px rgba(15, 23, 38, 0.22), 0 4px 12px rgba(0, 0, 0, 0.10);
}
.upm-icon svg { width: 42px; height: 42px; }
.upm-icon img { width: 100%; height: 100%; object-fit: contain; display: block; }
/* 3D card-flip icon reveal (Flashcard Vault modal only) */
.upm-icon-flip { perspective: 500px; }
.upm-icon-flip svg { animation: upmCardFlip 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both; }
@keyframes upmCardFlip {
  0% { transform: rotateY(0deg) scale(0.8); opacity: 0; }
  50% { transform: rotateY(180deg) scale(1.1); }
  100% { transform: rotateY(360deg) scale(1); opacity: 1; }
}
/* Staggered mindmap node reveal (Mindmap Library modal icon only) */
.upm-mm-node-center, .upm-mm-node, .upm-mm-line { opacity: 0; transform-origin: center; }
.upm-mm-node-center { animation: upmMmNodeAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both; }
.upm-mm-line-1 { animation: upmMmLineDraw 0.3s ease 0.45s both; }
.upm-mm-node-1 { animation: upmMmNodeAppear 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) 0.55s both; }
.upm-mm-line-2 { animation: upmMmLineDraw 0.3s ease 0.7s both; }
.upm-mm-node-2 { animation: upmMmNodeAppear 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) 0.8s both; }
.upm-mm-line-3 { animation: upmMmLineDraw 0.3s ease 0.95s both; }
.upm-mm-node-3 { animation: upmMmNodeAppear 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) 1.05s both; }
.upm-mm-line-4 { animation: upmMmLineDraw 0.3s ease 1.2s both; }
.upm-mm-node-4 { animation: upmMmNodeAppear 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) 1.3s both; }
@keyframes upmMmNodeAppear {
  0% { opacity: 0; transform: scale(0); }
  60% { opacity: 1; transform: scale(1.3); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes upmMmLineDraw {
  0% { opacity: 0; stroke-dasharray: 20; stroke-dashoffset: 20; }
  100% { opacity: 1; stroke-dasharray: 20; stroke-dashoffset: 0; }
}
.upm-title {
  font-family: var(--font-cormorant-garamond), 'Cormorant Garamond', serif;
  font-size: 26px;
  font-weight: 700;
  color: #1E2028;
  text-align: center;
  line-height: 1.2;
  margin-bottom: 10px;
  letter-spacing: -0.3px;
}
.upm-description {
  font-size: 13.5px;
  color: #4A4E5A;
  text-align: center;
  line-height: 1.65;
  margin-top: 6px;
  margin-bottom: 20px;
  padding: 0 4px;
}
.upm-meter { margin-bottom: 16px; }
.upm-meter-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 7px;
}
.upm-meter-label {
  font-size: 12px;
  font-weight: 500;
  color: #6B7080;
  letter-spacing: 0.1px;
}
.upm-meter-count {
  font-size: 12px;
  font-weight: 700;
  color: #C05A2A;
  letter-spacing: 0.2px;
  opacity: 0;
  animation: upmCountPop 0.24s cubic-bezier(0.34, 1.56, 0.64, 1) 0.82s forwards;
}
.upm-meter-track {
  width: 100%;
  height: 7px;
  background: #EFEFF2;
  border-radius: 999px;
  overflow: hidden;
  position: relative;
}
.upm-meter-fill {
  height: 100%;
  width: 0%;
  border-radius: 999px;
  background: linear-gradient(90deg, #E14B2A 0%, #E86A2B 35%, #E89A2B 65%, #D9B65C 100%);
  background-size: 200% 100%;
  box-shadow: 0 1px 2px rgba(225, 75, 42, 0.25);
  animation: upmFillGrow 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.2s forwards;
  position: relative;
  overflow: hidden;
}
.upm-meter-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -40%;
  width: 40%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.55), transparent);
  transform: skewX(-20deg);
  animation: upmFillSweep 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.2s forwards;
}
.upm-plan-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 18px;
  background: #F5F5F7;
  border-radius: 12px;
  margin-bottom: 6px;
}
.upm-plan-label {
  font-size: 12px;
  font-weight: 600;
  color: #6B7080;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}
.upm-plan-items { display: flex; column-gap: 24px; row-gap: 8px; flex-wrap: wrap; justify-content: center; }
.upm-plan-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13.5px;
  color: #1E2028;
  font-weight: 500;
}
.upm-plan-item .upm-check { color: #22C55E; font-weight: 800; font-size: 15px; }
.upm-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
}
.upm-divider-line { flex: 1; height: 1px; background: #E8E8EC; }
.upm-divider-text {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #C9A227;
}
.upm-benefits {
  background: #F5F5F7;
  border-radius: 14px;
  padding: 20px 22px;
  margin-bottom: 28px;
}
.upm-benefits-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #C9A227;
  margin-bottom: 14px;
}
.upm-benefit-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}
.upm-benefit-item:last-child { margin-bottom: 0; }
.upm-benefit-check {
  color: #22C55E;
  font-weight: 900;
  font-size: 15px;
  line-height: 1;
  flex: 0 0 auto;
  margin-top: 2px;
}
.upm-benefit-text {
  font-size: 13.5px;
  color: #1E2028;
  line-height: 1.45;
  font-weight: 400;
}
.upm-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}
.upm-btn-primary {
  width: 100%;
  padding: 15px 28px;
  background: #1E2028;
  color: #F5C542;
  border: 1.5px solid transparent;
  border-radius: 12px;
  font-family: var(--font-dm-sans), 'DM Sans', sans-serif;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
  letter-spacing: 0.2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.upm-btn-primary .upm-sparkle {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 0 4px rgba(245, 197, 66, 0.6));
}
.upm-btn-primary:hover {
  transform: translateY(-1px);
  border-color: #F5C542;
  box-shadow: 0 0 0 2px rgba(245, 197, 66, 0.35), 0 0 18px rgba(245, 197, 66, 0.35), 0 6px 20px rgba(30, 32, 40, 0.25);
}
.upm-btn-primary:active { transform: translateY(0); }
.upm-btn-secondary {
  background: none;
  border: none;
  font-family: var(--font-dm-sans), 'DM Sans', sans-serif;
  font-size: 13.5px;
  color: #6B7080;
  cursor: pointer;
  padding: 8px 16px;
  transition: color 0.2s ease;
  font-weight: 500;
}
.upm-btn-secondary:hover { color: #1E2028; }
@keyframes upmFadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes upmSlideUp {
  from { opacity: 0; transform: translateY(16px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes upmFillGrow {
  0% { width: 0%; }
  70% { width: 104%; }
  85% { width: 98%; }
  100% { width: 100%; }
}
@keyframes upmFillSweep {
  0% { left: -40%; opacity: 0; }
  15% { opacity: 1; }
  100% { left: 110%; opacity: 0; }
}
@keyframes upmCountPop {
  0% { opacity: 0; transform: translateY(-2px) scale(0.9); }
  60% { opacity: 1; transform: translateY(0) scale(1.1); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
@media (max-width: 480px) {
  .upm-modal { padding: 32px 24px 28px; border-radius: 16px; max-width: 100%; }
  .upm-title { font-size: 23px; }
  .upm-benefits { padding: 16px 18px; }
}
`;

/* ------------------------------------------------------------------ */
/* Locked subject card (blur + hover lock overlay)                     */
/* Ported from Flashcard_blur-subject-design.html / mindmap-blur.html: */
/* content sits at ~2.5px blur by default (slightly readable) and     */
/* sharpens to 4px on hover while the lock overlay fades in.          */
/* ------------------------------------------------------------------ */

const LOCKED_CARD_CSS = `
.upm-lock-wrap { position: relative; cursor: pointer; border-radius: 16px; width: 100%; display: block; }
.upm-lock-wrap .upm-lock-blur {
  width: 100%;
  filter: blur(2.5px);
  user-select: none;
  pointer-events: none;
  transition: filter 0.3s ease;
}
/* The wrapped SubjectChoiceCard renders as a <button>/<a>, which sizes to its
   content by default - force it to fill the grid cell like an unwrapped card. */
.upm-lock-wrap .upm-lock-blur > * { width: 100%; }
.upm-lock-wrap:hover .upm-lock-blur { filter: blur(4px); }
.upm-lock-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  z-index: 2;
  border-radius: 16px;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.upm-lock-wrap:hover .upm-lock-overlay {
  opacity: 1;
  background: rgba(255,255,255,0.35);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
.upm-lock-icon {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #1E2028;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(30,32,40,0.25);
  transition: transform 0.3s ease, opacity 0.3s ease;
  opacity: 0;
  transform: scale(0.8);
}
.upm-lock-wrap:hover .upm-lock-icon { transform: scale(1); opacity: 1; }
.upm-lock-icon svg { width: 18px; height: 18px; }
.upm-lock-label {
  font-size: 11.5px;
  font-weight: 700;
  color: #6B7080;
  letter-spacing: 0.2px;
  text-transform: uppercase;
  transition: opacity 0.3s ease, color 0.3s ease;
  opacity: 0;
}
.upm-lock-wrap:hover .upm-lock-label { opacity: 1; color: #1E2028; }
`;

export function LockedCardStyles() {
  return <style dangerouslySetInnerHTML={{ __html: LOCKED_CARD_CSS }} />;
}

export function LockedSubjectCard({
  onClick,
  children,
  className = '',
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`upm-lock-wrap ${className}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
    >
      <div className="upm-lock-blur">{children}</div>
      <div className="upm-lock-overlay">
        <div className="upm-lock-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="#F5C542" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <span className="upm-lock-label">Upgrade to Unlock</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Locked analytics widget                                             */
/* Ported from test-analytics / performance-analytics blur logic:      */
/* widget body blurred 4px by default (5px on hover) while the heading */
/* stays sharp; lock overlay fades in on hover; click opens the modal. */
/* ------------------------------------------------------------------ */

const LOCKED_WIDGET_CSS = `
.upm-widget-lock { cursor: pointer; position: relative; overflow: hidden; }
.upm-widget-lock:hover {
  transform: translateY(-4px) !important;
  box-shadow: 0 12px 32px rgba(0,0,0,0.08) !important;
}
.upm-widget-lock .upm-widget-blur {
  filter: blur(4px);
  user-select: none;
  pointer-events: none;
  transition: filter 0.3s ease;
}
.upm-widget-lock:hover .upm-widget-blur { filter: blur(5px); }
.upm-widget-lock .upm-widget-heading {
  position: relative;
  z-index: 6;
  pointer-events: none;
}
.upm-widget-lock .upm-widget-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.6);
  z-index: 5;
  transition: all 0.3s ease;
  pointer-events: none;
  opacity: 0;
}
.upm-widget-lock:hover .upm-widget-overlay {
  opacity: 1;
  background: rgba(255,255,255,0.35);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
.upm-widget-lock .upm-widget-lock-icon {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #1E2028;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  box-shadow: 0 4px 14px rgba(30,32,40,0.25);
  transition: transform 0.3s ease, opacity 0.3s ease;
  opacity: 0;
  transform: scale(0.8);
}
.upm-widget-lock:hover .upm-widget-lock-icon { transform: scale(1); opacity: 1; }
.upm-widget-lock .upm-widget-lock-icon svg { width: 18px; height: 18px; }
.upm-widget-lock .upm-widget-lock-label {
  font-size: 11.5px;
  font-weight: 700;
  color: #6B7080;
  letter-spacing: 0.2px;
  text-transform: uppercase;
  transition: opacity 0.3s ease, color 0.3s ease;
  opacity: 0;
}
.upm-widget-lock:hover .upm-widget-lock-label { opacity: 1; color: #1E2028; }
`;

export function LockedWidgetStyles() {
  return <style dangerouslySetInnerHTML={{ __html: LOCKED_WIDGET_CSS }} />;
}

export function LockedWidget({
  locked,
  onClick,
  heading,
  children,
  className = '',
  style,
}: {
  locked: boolean;
  onClick: () => void;
  /** Rendered sharp (never blurred) above the blurred body, like the reference design. */
  heading?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  if (!locked) {
    return (
      <div className={className} style={style}>
        {heading}
        {children}
      </div>
    );
  }
  return (
    <div
      className={`upm-widget-lock ${className}`}
      style={style}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
    >
      {heading && <div className="upm-widget-heading">{heading}</div>}
      <div className="upm-widget-blur">{children}</div>
      <div className="upm-widget-overlay" aria-hidden="true">
        <div className="upm-widget-lock-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="#F5C542" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <span className="upm-widget-lock-label">Upgrade to Unlock</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

export const SparkleIcon = () => (
  <svg className="upm-sparkle" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M12 2.5c.35 2.9 1.05 5.05 2.1 6.4 1.05 1.35 3.2 2.05 6.4 2.1-3.2.05-5.35.75-6.4 2.1-1.05 1.35-1.75 3.5-2.1 6.4-.35-2.9-1.05-5.05-2.1-6.4C8.85 11.75 6.7 11.05 3.5 11c3.2-.05 5.35-.75 6.4-2.1C10.95 7.55 11.65 5.4 12 2.5z" fill="#F5C542" />
    <path d="M19.5 15.5c.2 1.5.55 2.6 1.05 3.3.5.7 1.6 1.05 3.3 1.05-1.7 0-2.8.35-3.3 1.05-.5.7-.85 1.8-1.05 3.3-.2-1.5-.55-2.6-1.05-3.3-.5-.7-1.6-1.05-3.3-1.05 1.7 0 2.8-.35 3.3-1.05.5-.7.85-1.8 1.05-3.3z" fill="#F5C542" opacity="0.85" />
  </svg>
);

export function UpgradeModalShell({
  open,
  onClose,
  children,
  showClose = true,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  showClose?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="upm-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <style dangerouslySetInnerHTML={{ __html: SHARED_CSS }} />
      <div className="upm-modal" role="dialog" aria-modal="true">
        {showClose && (
          <button className="upm-close" onClick={onClose} aria-label="Close">&times;</button>
        )}
        {children}
      </div>
    </div>
  );
}

export function UsageMeterBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  return (
    <div className="upm-meter" role="group" aria-label="Plan usage">
      <div className="upm-meter-row">
        <span className="upm-meter-label">{label}</span>
        <span className="upm-meter-count"><b>{used}</b> / {limit} Used</span>
      </div>
      <div className="upm-meter-track" aria-hidden="true">
        <div className="upm-meter-fill" />
      </div>
    </div>
  );
}

export function BenefitsList({ label = "What You'll Unlock", items }: { label?: string; items: string[] }) {
  return (
    <div className="upm-benefits">
      <div className="upm-benefits-label">{label}</div>
      {items.map((text) => (
        <div className="upm-benefit-item" key={text}>
          <span className="upm-benefit-check">&#10003;</span>
          <span className="upm-benefit-text" dangerouslySetInnerHTML={{ __html: text }} />
        </div>
      ))}
    </div>
  );
}

export function UpgradeActions({
  onClose,
  backLabel,
  primaryLabel = 'Upgrade',
  upgradeHref = '/dashboard/billing/plans',
}: {
  onClose: () => void;
  backLabel: string;
  primaryLabel?: string;
  upgradeHref?: string;
}) {
  const router = useRouter();
  return (
    <div className="upm-actions">
      <button className="upm-btn-primary" onClick={() => router.push(upgradeHref)}>
        <span>{primaryLabel}</span>
        <SparkleIcon />
      </button>
      <button className="upm-btn-secondary" onClick={onClose}>{backLabel}</button>
    </div>
  );
}

export function ModalDivider({ text = 'Upgrade to Unlock' }: { text?: string }) {
  return (
    <div className="upm-divider">
      <span className="upm-divider-line" />
      <span className="upm-divider-text">{text}</span>
      <span className="upm-divider-line" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Feature icons                                                       */
/* ------------------------------------------------------------------ */

const FountainPenIcon = () => (
  <svg width="42" height="42" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g transform="rotate(-45 25 25)">
      <rect x="22" y="2" width="6" height="12" rx="2" fill="#F5C542" />
      <rect x="21.5" y="13" width="7" height="2" rx="0.5" fill="#E8D48B" />
      <rect x="22" y="15" width="6" height="18" rx="1" fill="#F5C542" />
      <path d="M22 33 L22.5 38 L27.5 38 L28 33 Z" fill="#E8D48B" />
      <path d="M23 38 L23.5 41 L26.5 41 L27 38 Z" fill="#F5C542" />
      <path d="M24 41 L25 47 L26 41 Z" fill="#F5C542" />
      <line x1="25" y1="40" x2="25" y2="46" stroke="#1E2028" strokeWidth="0.8" opacity="0.5" />
      <circle cx="25" cy="39.5" r="1" fill="#1E2028" opacity="0.4" />
      <rect x="23" y="16" width="1.5" height="15" rx="0.5" fill="#FFFFFF" opacity="0.2" />
    </g>
  </svg>
);

const MockTestIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 42, height: 42 }}>
    <rect x="10" y="4" width="28" height="40" rx="4" stroke="#F5C542" strokeWidth="2.5" fill="none" />
    <rect x="18" y="2" width="12" height="6" rx="2" fill="#F5C542" />
    <path d="M17 20l3 3 7-7" stroke="#F5C542" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="16" y1="30" x2="32" y2="30" stroke="#F5C542" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    <line x1="16" y1="36" x2="28" y2="36" stroke="#F5C542" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
  </svg>
);

const ChecklistIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 42, height: 42 }}>
    <rect x="8" y="6" width="32" height="38" rx="4" stroke="#F5C542" strokeWidth="2.5" fill="none" />
    <rect x="17" y="3" width="14" height="6" rx="2" fill="#F5C542" />
    <path d="M14 18l3 3 6-6" stroke="#F5C542" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="27" y1="18" x2="35" y2="18" stroke="#F5C542" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    <path d="M14 30l3 3 6-6" stroke="#F5C542" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="27" y1="30" x2="35" y2="30" stroke="#F5C542" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
  </svg>
);

const JeetAiIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#F5C542" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 38, height: 38 }}>
    <path d="M12 8V4H8" />
    <rect x="4" y="8" width="16" height="12" rx="2" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <path d="M15 13v2" />
    <path d="M9 13v2" />
  </svg>
);

const FlashcardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#F5C542" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 34, height: 34 }}>
    <rect x="2" y="4" width="20" height="16" rx="2.5" />
    <path d="M6 8h12" opacity="0.5" />
    <path d="M6 12h8" opacity="0.5" />
    <path d="M6 16h5" opacity="0.5" />
    <path d="M15 13l3 3-3 3" strokeWidth="1.8" />
  </svg>
);

const SubjectBookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#F5C542" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 34, height: 34 }}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const SimpleFlashcardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#F5C542" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 34, height: 34 }}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M7 9h10" opacity="0.5" />
    <path d="M7 13h7" opacity="0.5" />
    <path d="M7 17h4" opacity="0.5" />
  </svg>
);

const TopicFileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#F5C542" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 34, height: 34 }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <line x1="9" y1="15" x2="15" y2="15" />
  </svg>
);

const MindmapIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#F5C542" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 34, height: 34 }}>
    <circle className="upm-mm-node-center" cx="12" cy="12" r="3" />
    <path className="upm-mm-line upm-mm-line-1" d="M9.5 10.5L5.5 7.5" />
    <circle className="upm-mm-node upm-mm-node-1" cx="4" cy="6" r="2" />
    <path className="upm-mm-line upm-mm-line-2" d="M14.5 10.5L18.5 7.5" />
    <circle className="upm-mm-node upm-mm-node-2" cx="20" cy="6" r="2" />
    <path className="upm-mm-line upm-mm-line-3" d="M9.5 13.5L5.5 16.5" />
    <circle className="upm-mm-node upm-mm-node-3" cx="4" cy="18" r="2" />
    <path className="upm-mm-line upm-mm-line-4" d="M14.5 13.5L18.5 16.5" />
    <circle className="upm-mm-node upm-mm-node-4" cx="20" cy="18" r="2" />
  </svg>
);

const RevisionClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#F5C542" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 36, height: 36 }}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" opacity="0.7" />
    <path d="M8 2h8" strokeWidth="2" />
    <path d="M12 2v2" strokeWidth="2" />
    <circle cx="12" cy="12" r="3" fill="#F5C542" stroke="none" opacity="0.3" />
  </svg>
);

/* ------------------------------------------------------------------ */
/* 1. Mains evaluation limit (daily challenge / evaluator / PYQ)       */
/* ------------------------------------------------------------------ */

const MAINS_COPY: Record<string, { title: string; description: string; meterLabel: string; used: number; limit: number; benefits: string[] }> = {
  free: {
    title: 'Unlock More Evaluations',
    description: "You've used all 3 Mains answer evaluations included with your Free plan. Upgrade to continue receiving detailed feedback on your answers.",
    meterLabel: 'Total Evaluations Used',
    used: 3,
    limit: 3,
    benefits: [
      'More Mains Answer Evaluations',
      'Personalized Improvement Insights',
      'Detailed Markups & Score Breakdown',
      'Access to Premium Features and More...',
    ],
  },
  aspire: {
    title: 'Unlock More Evaluations',
    description: "You've reached the 5 Mains answer evaluations per day included with your Aspire plan. Upgrade to evaluate more answers and keep improving.",
    meterLabel: 'Evaluations Used Today',
    used: 5,
    limit: 5,
    benefits: [
      'More Daily Answer Evaluations',
      'Personalized Improvement Insights',
      'Detailed Markups & Score Breakdown',
      'Examiner-Style Feedback',
    ],
  },
  rise: {
    title: 'Unlock Unlimited Evaluations',
    description: "You've reached the 25 Mains answer evaluations per day included with your Rise plan. Upgrade to Ascent for unlimited evaluations and uninterrupted feedback.",
    meterLabel: 'Evaluations Used Today',
    used: 25,
    limit: 25,
    benefits: [
      'Unlimited Mains Answer Evaluations',
      'Personalized Improvement Insights',
      'Detailed Markups & Score Breakdown',
      'Examiner-Style Feedback',
    ],
  },
};

export function MainsEvaluationLimitModal({
  open,
  onClose,
  tier,
  used,
  limit,
  backLabel = 'Back to Dashboard',
}: {
  open: boolean;
  onClose: () => void;
  tier: PlanTier;
  used?: number | null;
  limit?: number | null;
  backLabel?: string;
}) {
  const copy = MAINS_COPY[tier] || MAINS_COPY.free;
  return (
    <UpgradeModalShell open={open} onClose={onClose}>
      <div className="upm-icon"><FountainPenIcon /></div>
      <h2 className="upm-title">{copy.title}</h2>
      <p className="upm-description">{copy.description}</p>
      <UsageMeterBar label={copy.meterLabel} used={used ?? copy.used} limit={limit ?? copy.limit} />
      <BenefitsList items={copy.benefits} />
      <UpgradeActions onClose={onClose} backLabel={backLabel} />
    </UpgradeModalShell>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Prelims mock test limit                                          */
/* ------------------------------------------------------------------ */

const MOCK_COPY: Record<string, { title: string; description: React.ReactNode; meterLabel: string; used: number; limit: number; benefits: string[] }> = {
  free: {
    title: 'Unlock Unlimited Mock Practice',
    description: <>You&apos;ve used the <b>1</b> custom mock test included with your Free plan. Upgrade to create more mock tests and continue practicing with personalized exam-ready tests.</>,
    meterLabel: 'Total Custom Mock Tests',
    used: 1,
    limit: 1,
    benefits: [
      'More Custom Mock Tests',
      'Practice by Subject &amp; Topic',
      'Adaptive Question Selection',
      'Detailed Performance Analytics',
    ],
  },
  aspire: {
    title: 'Unlock More Mock Practice',
    description: <>You&apos;ve reached the <b>5</b> custom mock tests per day included with your Aspire plan. Upgrade to continue creating more personalized mock tests.</>,
    meterLabel: 'Mock Tests Used Today',
    used: 5,
    limit: 5,
    benefits: [
      'More Daily Mock Tests',
      'Practice by Subject &amp; Topic',
      'Adaptive Question Selection',
      'Detailed Performance Analytics',
    ],
  },
  rise: {
    title: 'Unlock Unlimited Mock Practice',
    description: <>You&apos;ve reached the <b>50</b> custom mock tests per day included with your Rise plan. Upgrade to Ascent for unlimited personalized mock tests.</>,
    meterLabel: 'Mock Tests Used Today',
    used: 50,
    limit: 50,
    benefits: [
      'Unlimited Custom Mock Tests',
      'Practice by Subject &amp; Topic',
      'Adaptive Question Selection',
      'Detailed Performance Analytics',
    ],
  },
};

export function MockTestLimitModal({
  open,
  onClose,
  tier,
  used,
  limit,
  backLabel = 'Back to Mock Tests',
}: {
  open: boolean;
  onClose: () => void;
  tier: PlanTier;
  used?: number | null;
  limit?: number | null;
  backLabel?: string;
}) {
  const copy = MOCK_COPY[tier] || MOCK_COPY.free;
  return (
    <UpgradeModalShell open={open} onClose={onClose}>
      <div className="upm-icon"><MockTestIcon /></div>
      <h2 className="upm-title">{copy.title}</h2>
      <p className="upm-description">{copy.description}</p>
      <UsageMeterBar label={copy.meterLabel} used={used ?? copy.used} limit={limit ?? copy.limit} />
      <BenefitsList items={copy.benefits} />
      <UpgradeActions onClose={onClose} backLabel={backLabel} />
    </UpgradeModalShell>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Jeet AI Mentor limit                                             */
/* ------------------------------------------------------------------ */

const JEET_COPY: Record<string, { title: string; description: React.ReactNode; meterLabel: string; used: number; limit: number; benefits: string[] }> = {
  free: {
    title: 'Unlock Unlimited Jeet AI Mentoring',
    description: <>You&apos;ve reached your <b>2 Jeet AI Mentor queries</b> for today. Upgrade to continue learning and get doubt resolution.</>,
    meterLabel: 'AI Mentor Queries Today',
    used: 2,
    limit: 2,
    benefits: [
      '<b>More</b> AI Mentor Queries',
      '<b>24×7</b> AI-Powered Mentoring',
      'Subject-wise Learning Support',
      'Personalized Preparation Strategies',
    ],
  },
  aspire: {
    title: 'Unlock More Jeet AI Mentoring',
    description: <>You&apos;ve reached your <b>10 Jeet AI Mentor queries</b> for today. Upgrade for more AI-powered guidance and instant doubt resolution.</>,
    meterLabel: 'Jeet AI Mentor Queries Today',
    used: 10,
    limit: 10,
    benefits: [
      '<b>More Daily</b> Jeet AI Mentor Queries',
      '<b>24×7</b> AI-Powered Mentoring',
      'Subject-wise Learning Support',
      'Personalized Preparation Strategies',
    ],
  },
  rise: {
    title: 'Unlock Unlimited Jeet AI Mentoring',
    description: <>You&apos;ve reached your <b>100 Jeet AI Mentor queries</b> for today. Upgrade to Ascent for unlimited mentoring and instant doubt resolution.</>,
    meterLabel: 'Jeet AI Mentor Queries Today',
    used: 100,
    limit: 100,
    benefits: [
      '<b>Unlimited</b> Jeet AI Mentor Queries',
      '<b>24×7</b> AI-Powered Mentoring',
      'Subject-wise Learning Support',
      'Personalized Preparation Strategies',
    ],
  },
};

export function JeetAiLimitModal({
  open,
  onClose,
  tier,
  used,
  limit,
  backLabel = 'Back to Dashboard',
}: {
  open: boolean;
  onClose: () => void;
  tier: PlanTier;
  used?: number | null;
  limit?: number | null;
  backLabel?: string;
}) {
  const copy = JEET_COPY[tier] || JEET_COPY.free;
  return (
    <UpgradeModalShell open={open} onClose={onClose}>
      <div className="upm-icon"><JeetAiIcon /></div>
      <h2 className="upm-title">{copy.title}</h2>
      <p className="upm-description">{copy.description}</p>
      <UsageMeterBar label={copy.meterLabel} used={used ?? copy.used} limit={limit ?? copy.limit} />
      <BenefitsList items={copy.benefits} />
      <UpgradeActions onClose={onClose} backLabel={backLabel} />
    </UpgradeModalShell>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Syllabus tracker limit                                           */
/* ------------------------------------------------------------------ */

export function SyllabusTrackerLimitModal({
  open,
  onClose,
  used = 5,
  limit = 5,
}: {
  open: boolean;
  onClose: () => void;
  used?: number;
  limit?: number;
}) {
  return (
    <UpgradeModalShell open={open} onClose={onClose}>
      <div className="upm-icon"><ChecklistIcon /></div>
      <h2 className="upm-title">Unlock Unlimited Syllabus Tracking</h2>
      <p className="upm-description">Upgrade to continue tracking every topic, monitor your progress, and stay organized throughout your UPSC preparation.</p>
      <UsageMeterBar label="Syllabus topics tracked" used={used} limit={limit} />
      <BenefitsList
        items={[
          '<b>Unlimited</b> syllabus topic tracking',
          'Full Prelims, Mains &amp; Optional coverage',
          'Subject-wise progress &amp; revision insights',
          'PYQ mapping and access to all premium features',
        ]}
      />
      <UpgradeActions onClose={onClose} backLabel="Back to Dashboard" />
    </UpgradeModalShell>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Flashcards                                                       */
/* ------------------------------------------------------------------ */

export function FlashcardVaultUpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <UpgradeModalShell open={open} onClose={onClose}>
      <div className="upm-icon upm-icon-flip"><FlashcardIcon /></div>
      <h2 className="upm-title">Unlock Full Flashcard Vault</h2>
      <p className="upm-description">Continue your revision with all UPSC subjects and access thousands of expertly curated flashcards designed for smarter learning.</p>
      <div className="upm-plan-section">
        <span className="upm-plan-label">Current Plan Includes</span>
        <div className="upm-plan-items">
          <span className="upm-plan-item"><span className="upm-check">&#10003;</span> Polity</span>
          <span className="upm-plan-item"><span className="upm-check">&#10003;</span> Economy</span>
        </div>
      </div>
      <ModalDivider />
      <BenefitsList
        label="What You'll Get"
        items={[
          'All UPSC Subjects Flashcards',
          'Progress &amp; Mastery Tracking',
          'New Subjects Added Regularly',
          'Thousands of Ready-to-Study Flashcards',
        ]}
      />
      <UpgradeActions onClose={onClose} backLabel="Back to Flashcards" />
    </UpgradeModalShell>
  );
}

export function FlashcardAddSubjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <UpgradeModalShell open={open} onClose={onClose}>
      <div className="upm-icon"><SubjectBookIcon /></div>
      <h2 className="upm-title">Create Your Own Subjects</h2>
      <p className="upm-description">Organize your preparation by creating custom subjects for your personal revision.</p>
      <ModalDivider />
      <BenefitsList
        label="What You'll Get"
        items={[
          'Create Unlimited Subjects, Topics & Flashcards',
          'Build Your Personal Revision Library',
          'Smart Spaced Repetition',
          'Progress & Mastery Tracking',
        ]}
      />
      <UpgradeActions onClose={onClose} backLabel="Back to Flashcards" />
    </UpgradeModalShell>
  );
}

export function FlashcardAddFlashcardModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <UpgradeModalShell open={open} onClose={onClose}>
      <div className="upm-icon"><SimpleFlashcardIcon /></div>
      <h2 className="upm-title">Create Personalized Flashcards</h2>
      <p className="upm-description">Build your own flashcards and revise smarter with active recall.</p>
      <ModalDivider />
      <BenefitsList
        label="What You'll Get"
        items={[
          'Create Unlimited Subjects, Topics & Flashcards',
          'Build Your Personal Revision Library',
          'Smart Spaced Repetition',
          'Progress & Mastery Tracking',
        ]}
      />
      <UpgradeActions onClose={onClose} backLabel="Back to Flashcards" />
    </UpgradeModalShell>
  );
}

export function FlashcardAddTopicModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <UpgradeModalShell open={open} onClose={onClose}>
      <div className="upm-icon"><TopicFileIcon /></div>
      <h2 className="upm-title">Create Custom Topics</h2>
      <p className="upm-description">Organize your flashcards into structured topics for efficient revision.</p>
      <ModalDivider />
      <BenefitsList
        label="What You'll Get"
        items={[
          'Create Unlimited Subjects, Topics & Flashcards',
          'Build Your Personal Revision Library',
          'Smart Spaced Repetition',
          'Progress & Mastery Tracking',
        ]}
      />
      <UpgradeActions onClose={onClose} backLabel="Back to Flashcards" />
    </UpgradeModalShell>
  );
}

/* ------------------------------------------------------------------ */
/* 6. Mindmaps                                                         */
/* ------------------------------------------------------------------ */

export function MindmapUpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <UpgradeModalShell open={open} onClose={onClose}>
      <div className="upm-icon"><MindmapIcon /></div>
      <h2 className="upm-title">Unlock Full Mindmap Library</h2>
      <p className="upm-description">Continue your visual learning with all UPSC subjects and access thousands of expertly curated mindmaps and revise faster with interconnected concepts.</p>
      <div className="upm-plan-section">
        <span className="upm-plan-label">Current Plan Includes</span>
        <div className="upm-plan-items">
          <span className="upm-plan-item"><span className="upm-check">&#10003;</span> Polity</span>
          <span className="upm-plan-item"><span className="upm-check">&#10003;</span> Economy</span>
        </div>
      </div>
      <ModalDivider />
      <BenefitsList
        label="What You'll Get"
        items={[
          'All UPSC Subject Mind Maps',
          'Concept-Based Visual Learning',
          'Regularly Updated Mind Maps',
          'Faster Revision &amp; Better Retention',
        ]}
      />
      <UpgradeActions onClose={onClose} backLabel="Back to Mindmaps" />
    </UpgradeModalShell>
  );
}

/* ------------------------------------------------------------------ */
/* 7. Spaced repetition                                                */
/* ------------------------------------------------------------------ */

export function SpacedRepOnboardingModal({
  open,
  onClose,
  onAddFirstQuestion,
}: {
  open: boolean;
  onClose: () => void;
  onAddFirstQuestion: () => void;
}) {
  return (
    <UpgradeModalShell open={open} onClose={onClose}>
      <div className="upm-icon"><RevisionClockIcon /></div>
      <h2 className="upm-title">Start Building Your Revision Bank</h2>
      <p className="upm-description">Add important questions from mock tests, PYQs, or your notes, and we&apos;ll schedule them for revision using spaced repetition.</p>
      <div className="upm-plan-section">
        <span className="upm-plan-label">Free Plan Includes</span>
        <div className="upm-plan-items">
          <span className="upm-plan-item"><span className="upm-check">&#10003;</span> Up to 5 Revision Questions</span>
          <span className="upm-plan-item"><span className="upm-check">&#10003;</span> Spaced Review Reminders</span>
        </div>
      </div>
      <ModalDivider />
      <BenefitsList
        label="What You'll Get"
        items={[
          'Add Unlimited Revision Questions',
          'Smart Long-Term Scheduling',
          'Build Your Complete Revision System',
          'Access to many more premium features',
        ]}
      />
      <div className="upm-actions">
        <button className="upm-btn-primary" onClick={onAddFirstQuestion}>
          <span>&#10133; Add Your First Question</span>
          <SparkleIcon />
        </button>
        <button className="upm-btn-secondary" onClick={onClose}>Back to Spaced Repetition</button>
      </div>
    </UpgradeModalShell>
  );
}

export function SpacedRepAddSubjectUpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <UpgradeModalShell open={open} onClose={onClose}>
      <div className="upm-icon"><SubjectBookIcon /></div>
      <h2 className="upm-title">Create Your Own Subjects</h2>
      <p className="upm-description">Organize your preparation by creating custom subjects for your spaced repetition revision.</p>
      <ModalDivider />
      <BenefitsList
        label="What You'll Get"
        items={[
          'Create Unlimited Subjects & Topics',
          'Build Your Personal Revision Library',
          'Smart Spaced Repetition Scheduling',
          'Progress & Mastery Tracking',
        ]}
      />
      <UpgradeActions onClose={onClose} backLabel="Back to Spaced Repetition" primaryLabel="Upgrade to Add Subject" />
    </UpgradeModalShell>
  );
}

/* ------------------------------------------------------------------ */
/* 8. Analytics (performance dashboard + test analytics)               */
/* ------------------------------------------------------------------ */

const AnalyticsTrendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#F5C542" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 34, height: 34 }}>
    <path d="M3 3v18h18" />
    <path d="M7 14l4-4 3 3 5-5" />
    <circle cx="7" cy="14" r="1.5" fill="#F5C542" />
    <circle cx="11" cy="10" r="1.5" fill="#F5C542" />
    <circle cx="14" cy="13" r="1.5" fill="#F5C542" />
    <circle cx="19" cy="8" r="1.5" fill="#F5C542" />
  </svg>
);

const AnalyticsLineIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#F5C542" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 34, height: 34 }}>
    <path d="M3 3v18h18" />
    <path d="m7 16 4-8 4 4 5-9" />
  </svg>
);

export function PerformanceAnalyticsUpgradeModal({
  open,
  onClose,
  tier,
}: {
  open: boolean;
  onClose: () => void;
  tier: PlanTier;
}) {
  const isAspire = tier === 'aspire';
  return (
    <UpgradeModalShell open={open} onClose={onClose}>
      <div className="upm-icon">{isAspire ? <AnalyticsLineIcon /> : <AnalyticsTrendIcon />}</div>
      <h2 className="upm-title">{isAspire ? 'Unlock Advanced Analytics' : 'Unlock Your Performance Dashboard'}</h2>
      <p className="upm-description">
        {isAspire
          ? "You're viewing the basic Performance Dashboard. Upgrade to access advanced insights, detailed subject analytics, and personalized recommendations."
          : 'Upgrade to track your preparation with detailed analytics, identify strengths and weak areas, subject-wise insights, and progress over time.'}
      </p>
      <BenefitsList
        items={isAspire
          ? [
              'Complete Subject-wise Analytics',
              'Strong &amp; Weak Area Tracking',
              'AI-Powered Insights',
              'Smart Study Recommendations',
            ]
          : [
              'Complete Performance Dashboard',
              'Subject-wise Accuracy Analytics',
              'Strong &amp; Weak Area Tracking',
              'Study Time &amp; Progress Insights',
            ]}
      />
      <UpgradeActions onClose={onClose} backLabel="Back to Dashboard" />
    </UpgradeModalShell>
  );
}

export function TestAnalyticsUpgradeModal({
  open,
  onClose,
  tier,
}: {
  open: boolean;
  onClose: () => void;
  tier: PlanTier;
}) {
  const isAspire = tier === 'aspire';
  return (
    <UpgradeModalShell open={open} onClose={onClose}>
      <div className="upm-icon">{isAspire ? <AnalyticsLineIcon /> : <AnalyticsTrendIcon />}</div>
      <h2 className="upm-title">{isAspire ? 'Unlock Advanced Test Analytics' : 'Unlock Your Test Analytics'}</h2>
      <p className="upm-description">
        {isAspire
          ? "You're viewing the basic test stats. Upgrade to access detailed subject analytics, score trends, time management insights, and full test history."
          : 'Upgrade to track your test performance with detailed analytics, subject-wise insights, score trends, and AI-powered recommendations.'}
      </p>
      <BenefitsList
        items={isAspire
          ? [
              'MCQ &amp; Mains Performance Trends',
              'Subject-wise Accuracy Breakdown',
              'Time Management Analytics',
              'Complete Test History &amp; Reports',
            ]
          : [
              'Complete Test Analytics Dashboard',
              'Subject-wise Accuracy Breakdown',
              'MCQ Performance Trends',
              'Full Test History &amp; Reports',
            ]}
      />
      <UpgradeActions onClose={onClose} backLabel="Back to Dashboard" />
    </UpgradeModalShell>
  );
}

export function SpacedRepLimitModal({
  open,
  onClose,
  used = 5,
  limit = 5,
}: {
  open: boolean;
  onClose: () => void;
  used?: number;
  limit?: number;
}) {
  return (
    <UpgradeModalShell open={open} onClose={onClose}>
      <div className="upm-icon"><RevisionClockIcon /></div>
      <h2 className="upm-title">Unlock Unlimited Revision Questions</h2>
      <p className="upm-description">Your Free plan includes up to 5 revision questions. Upgrade to continue adding important questions from PYQs, mock tests, and your notes, and let spaced repetition help you revise them at the right time.</p>
      <UsageMeterBar label="Revision Questions Added" used={used} limit={limit} />
      <ModalDivider />
      <BenefitsList
        items={[
          'Unlimited Revision Questions',
          'Smart Spaced Repetition Scheduling',
          'Subject-wise Progress Tracking',
          'Build Your Personalized Revision Queue',
        ]}
      />
      <UpgradeActions onClose={onClose} backLabel="Back to Spaced Repetition" />
    </UpgradeModalShell>
  );
}

/* ------------------------------------------------------------------ */
/* Study Material – download PDFs upgrade                              */
/* Icon + copy ported 1:1 from study-material-upgrade-modal.html.      */
/* ------------------------------------------------------------------ */

const BookDownloadIcon = () => (
  <svg width="38" height="38" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    {/* Open book base */}
    <path d="M6 12C6 10.9 6.9 10 8 10H20C21.1 10 22 9.4 22 8.5V38C22 38 20 37 18 37H8C6.9 37 6 36.1 6 35V12Z" fill="#F5C542" opacity="0.85" />
    <path d="M42 12C42 10.9 41.1 10 40 10H28C26.9 10 26 9.4 26 8.5V38C26 38 28 37 30 37H40C41.1 37 42 36.1 42 35V12Z" fill="#E8D48B" opacity="0.85" />
    {/* Book spine */}
    <rect x="22" y="8" width="4" height="30" rx="1" fill="#C9A227" />
    {/* Page lines left */}
    <line x1="10" y1="16" x2="19" y2="16" stroke="#1E2028" strokeWidth="1" opacity="0.2" />
    <line x1="10" y1="20" x2="19" y2="20" stroke="#1E2028" strokeWidth="1" opacity="0.2" />
    <line x1="10" y1="24" x2="17" y2="24" stroke="#1E2028" strokeWidth="1" opacity="0.2" />
    {/* Page lines right */}
    <line x1="29" y1="16" x2="38" y2="16" stroke="#1E2028" strokeWidth="1" opacity="0.15" />
    <line x1="29" y1="20" x2="38" y2="20" stroke="#1E2028" strokeWidth="1" opacity="0.15" />
    <line x1="29" y1="24" x2="36" y2="24" stroke="#1E2028" strokeWidth="1" opacity="0.15" />
    {/* Download arrow overlay */}
    <circle cx="36" cy="34" r="9" fill="#101827" stroke="#F5C542" strokeWidth="1.5" />
    <path d="M36 29V37" stroke="#F5C542" strokeWidth="2" strokeLinecap="round" />
    <path d="M32.5 34.5L36 38L39.5 34.5" stroke="#F5C542" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function StudyMaterialDownloadUpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <UpgradeModalShell open={open} onClose={onClose}>
      <div className="upm-icon"><BookDownloadIcon /></div>
      <h2 className="upm-title">Unlock Unlimited Study Material Downloads</h2>
      <p className="upm-description">Upgrade to download unlimited notes, PDFs, handouts, and premium study resources to support every stage of your UPSC preparation.</p>
      <BenefitsList
        items={[
          'Unlimited Study Material Downloads',
          'Subject-wise Notes &amp; Resources',
          'Current Affairs Compilations',
          'Revision Notes &amp; Handouts',
        ]}
      />
      <UpgradeActions onClose={onClose} backLabel="Back to Study Material" />
    </UpgradeModalShell>
  );
}
