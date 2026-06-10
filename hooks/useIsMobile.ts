'use client';

import { useEffect, useState } from 'react';

/**
 * SSR-safe media-query hook. Returns `true` when the viewport matches the query.
 * Defaults to a phone breakpoint (≤767px) so inline-styled layouts can switch to
 * a stacked / single-column arrangement on mobile.
 *
 * Renders `false` on the server and on first client paint, then updates after mount,
 * which keeps hydration stable (server and first client render agree).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    // Safari < 14 uses addListener/removeListener
    if (mql.addEventListener) {
      mql.addEventListener('change', update);
      return () => mql.removeEventListener('change', update);
    }
    mql.addListener(update);
    return () => mql.removeListener(update);
  }, [query]);

  return matches;
}

/** True when viewport width ≤ 767px (phones). */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/** True when viewport width ≤ 1023px (phones + small tablets). */
export function useIsTabletOrBelow(): boolean {
  return useMediaQuery('(max-width: 1023px)');
}

export default useIsMobile;
