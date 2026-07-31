'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

/** Authored size of every client-supplied demo asset. */
export const DEMO_W = 380;
export const DEMO_H = 660;

/**
 * Scales the fixed 380x660 asset down to whatever width the AI
 * section's column gives us, so the demos stay inside the device frame
 * on narrow viewports without any of the assets' internals needing to
 * become fluid. Never scales above 1 - the assets are pixel-tuned and
 * upscaling them looks soft.
 */
export function useFitScale(ref: React.RefObject<HTMLElement | null>) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(Math.min(1, w / DEMO_W));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return scale;
}

/**
 * Center of `el` relative to `root`, walking the offsetParent chain.
 *
 * The assets used getBoundingClientRect, which reports post-transform
 * pixels - wrong here, because DemoStage scales the whole card on
 * narrow viewports and the cursors live *inside* that scaled subtree.
 * offsetLeft/offsetTop ignore transforms, so these stay in the card's
 * own authored coordinate space at any scale.
 */
export function centerWithin(el: HTMLElement, root: HTMLElement) {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x: x + el.offsetWidth / 2, y: y + el.offsetHeight / 2 };
}

/** True when the visitor has asked the OS to minimise motion. */
export function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Shared shell for the three demo animations. Owns the scale-to-fit
 * box so each demo can be written at its authored 380x660 size.
 *
 * `variant` becomes the CSS scope class (jd-mains / jd-chat / jd-mock
 * / jd-ca) that namespaces the asset's stylesheet in
 * styles/landing-demos.css.
 */
export default function DemoStage({
  variant,
  children,
}: {
  variant: 'jd-mains' | 'jd-chat' | 'jd-mock' | 'jd-ca';
  children: ReactNode;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const scale = useFitScale(stageRef);

  return (
    /* Height comes from .demo-content in landing.css, which derives the
       same 380:660 ratio from its own width - so the stage just fills
       it and only has to work out the card's scale factor. */
    <div ref={stageRef} className="jd-stage" aria-hidden="true">
      <div className={`jd-card ${variant}`} style={{ '--jd-scale': scale } as React.CSSProperties}>
        {children}
      </div>
    </div>
  );
}
