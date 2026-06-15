'use client';

import { useEffect, useRef } from 'react';

interface PdfViewerProps {
  pages: string[];
  pageNumber: number;
  zoomLevel: number;
  onLoadSuccess: (numPages: number) => void;
  onLoadError: () => void;
}

export default function PdfViewer({ pages, pageNumber, zoomLevel, onLoadSuccess, onLoadError }: PdfViewerProps) {
  const reportedPageCount = useRef(0);
  const safePageNumber = Math.min(Math.max(pageNumber, 1), Math.max(pages.length, 1));
  const pageUrl = pages[safePageNumber - 1];
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

  if (!pageUrl) return null;

  return (
    <div
      style={{
        width: 'max-content',
        minWidth: zoomLevel >= 100 ? `${pageWidth}px` : '0',
        display: 'flex',
        justifyContent: 'center',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        style={{
          width: `${pageWidth}px`,
          maxWidth: 'none',
        }}
      >
        <img
          key={pageUrl}
          src={pageUrl}
          alt={`Page ${safePageNumber}`}
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
    </div>
  );
}
