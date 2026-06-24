'use client';

import { useEffect, useRef } from 'react';

interface ScrollRequest {
  page: number;
  /** nonce — bumped on every request so repeated jumps to the same page still fire */
  n: number;
}

interface PdfViewerProps {
  pages: string[];
  zoomLevel: number;
  onLoadSuccess: (numPages: number) => void;
  onLoadError: () => void;
  /** Reports the page currently centered in the viewport while scrolling. */
  onPageChange?: (page: number) => void;
  /** When this changes, the viewer smooth-scrolls the requested page into view. */
  scrollRequest?: ScrollRequest;
}

const PAGE_GAP = 16;
const VIEWER_PADDING = 24;

export default function PdfViewer({
  pages,
  zoomLevel,
  onLoadSuccess,
  onLoadError,
  onPageChange,
  scrollRequest,
}: PdfViewerProps) {
  const reportedPageCount = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const currentPage = useRef(1);

  const scale = zoomLevel / 100;
  const pageWidth = Math.round(980 * scale);

  useEffect(() => {
    if (!pages.length) {
      onLoadError();
      return;
    }
    if (reportedPageCount.current !== pages.length) {
      reportedPageCount.current = pages.length;
      onLoadSuccess(pages.length);
    }
  }, [pages.length, onLoadError, onLoadSuccess]);

  // Smooth-scroll to the requested page when a navigation request comes in.
  useEffect(() => {
    if (!scrollRequest) return;
    const el = pageRefs.current[scrollRequest.page - 1];
    const scroller = scrollRef.current;
    if (el && scroller) {
      scroller.scrollTo({ top: el.offsetTop - VIEWER_PADDING, behavior: 'smooth' });
    }
  }, [scrollRequest]);

  // Track which page is centered in the viewport and report it upward.
  const handleScroll = () => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const mid = scroller.scrollTop + scroller.clientHeight / 2;
    let visible = 1;
    for (let i = 0; i < pageRefs.current.length; i++) {
      const el = pageRefs.current[i];
      if (el && el.offsetTop <= mid) visible = i + 1;
    }
    if (visible !== currentPage.current) {
      currentPage.current = visible;
      onPageChange?.(visible);
    }
  };

  if (!pages.length) return null;

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: 'relative',
        height: '100%',
        width: '100%',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: `${PAGE_GAP}px`,
        padding: `${VIEWER_PADDING}px`,
      }}
    >
      {pages.map((url, i) => (
        <div
          key={`${url}-${i}`}
          ref={(el) => { pageRefs.current[i] = el; }}
          style={{ width: `${pageWidth}px`, maxWidth: 'none', flexShrink: 0 }}
        >
          <img
            src={url}
            alt={`Page ${i + 1}`}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
            onError={onLoadError}
            style={{
              display: 'block',
              width: '100%',
              height: 'auto',
              background: '#FFFFFF',
              boxShadow: '0 10px 30px rgba(15, 23, 43, 0.18)',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        </div>
      ))}
    </div>
  );
}
