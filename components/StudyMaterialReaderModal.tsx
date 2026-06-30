'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const PdfViewer = dynamic(() => import('@/components/PdfViewer'), { ssr: false });

/* ------------------------------------------------------------------ */
/*  Shared Study-Material PDF reader modal.                            */
/*  This is THE single in-app PDF viewer experience used by the        */
/*  Study Material (library) module. Any feature that needs to let a   */
/*  user "Read" a note (e.g. Video Lectures) reuses this component –    */
/*  do not build a second viewer.                                      */
/* ------------------------------------------------------------------ */

const PRO_GRADIENT = 'linear-gradient(135deg, #1A2440 0%, #0B1424 100%)';
const PRO_SHADOW = 'inset 0 0 0 1px rgba(245,179,1,0.35), 0 8px 24px -10px rgba(245,179,1,0.35)';
const PRO_SHADOW_HOVER = 'inset 0 0 0 1px rgba(245,179,1,0.5), 0 10px 28px -10px rgba(245,179,1,0.5)';

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const SparklesIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFD96B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

export interface StudyMaterialReaderModalProps {
  /** Rendered page image URLs (already fetched via libraryService.getMaterialViewPages). */
  pages: string[];
  /** Document title shown in the header. */
  title: string;
  /** Small subtitle shown under the title (e.g. the subject name). */
  subjectLabel?: string;
  /** Close handler. */
  onClose: () => void;
  /** "Get PDF" / "Upgrade to Download" handler. Defaults to the billing upgrade flow. */
  onGetPdf?: () => void;
}

export default function StudyMaterialReaderModal({
  pages,
  title,
  subjectLabel,
  onClose,
  onGetPdf,
}: StudyMaterialReaderModalProps) {
  const [docLoaded, setDocLoaded] = useState(false);
  const [docError, setDocError] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  // Bumped on prev/next click so the viewer scrolls the requested page into view.
  const [scrollRequest, setScrollRequest] = useState<{ page: number; n: number }>({ page: 1, n: 0 });

  // Reset viewer state whenever a new document is opened.
  useEffect(() => {
    setDocLoaded(false);
    setDocError(false);
    setNumPages(pages.length);
    setPageNumber(1);
    setZoomLevel(100);
    setScrollRequest({ page: 1, n: 0 });
  }, [pages]);

  const handleGetPdf =
    onGetPdf ?? (() => { window.location.href = '/dashboard/billing/plans?source=library'; });

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(10,14,26,0.72)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* shimmer keyframes */}
      <style>{`
        @keyframes rwj-shimmer {
          0%   { background-position: -500px 0; }
          100% { background-position: 500px 0; }
        }
        .rwj-shine { position: relative; overflow: hidden; }
        .rwj-shine::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%);
          transform: translateX(-100%);
          transition: transform 1.2s ease;
        }
        .rwj-shine:hover::after { transform: translateX(100%); }
      `}</style>

      <div
        className="flex flex-col w-full"
        style={{
          maxWidth: '820px',
          height: 'min(92vh, 920px)',
          borderRadius: '18px',
          overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
          background: '#FFFFFF',
          userSelect: 'none',
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between flex-shrink-0"
          style={{
            background: '#FFFFFF',
            borderBottom: '1px solid #E5E7EB',
            padding: '12px 18px',
            gap: '12px',
          }}
        >
          {/* Left: icon + title + subtitle */}
          <div className="flex items-center gap-3 min-w-0">
            <div style={{
              width: '34px', height: '34px', borderRadius: '9px',
              background: '#EFF6FF', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: '17px' }}>📄</span>
            </div>
            <div className="min-w-0">
              <p className="font-arimo font-bold truncate" style={{ fontSize: '14px', color: '#101828', lineHeight: '20px' }}>
                {title}
              </p>
              <p className="font-arimo" style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '1px' }}>
                {subjectLabel ? `${subjectLabel} · View only` : 'View only'}
              </p>
            </div>
          </div>

          {/* Right: zoom + lock badge + upgrade + close */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {docLoaded && (
              <div
                className="flex items-center font-arimo font-bold"
                style={{
                  height: '36px',
                  gap: '4px',
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  padding: '0 6px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              >
                <button
                  onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                  title="Zoom out"
                  aria-label="Zoom out"
                  style={{
                    width: '26px', height: '26px', borderRadius: '6px',
                    background: '#F3F4F6', border: 'none', color: '#374151',
                    cursor: 'pointer', fontSize: '14px', lineHeight: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  −
                </button>
                <span style={{ fontSize: '12px', color: '#374151', minWidth: '40px', textAlign: 'center' }}>
                  {zoomLevel}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(200, z + 10))}
                  title="Zoom in"
                  aria-label="Zoom in"
                  style={{
                    width: '26px', height: '26px', borderRadius: '6px',
                    background: '#F3F4F6', border: 'none', color: '#374151',
                    cursor: 'pointer', fontSize: '14px', lineHeight: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  +
                </button>
              </div>
            )}
            <div className="font-arimo font-bold flex items-center" style={{
              height: '36px',
              fontSize: '11px', padding: '0 12px', borderRadius: '10px',
              background: '#FEF3C7', color: '#D97706', letterSpacing: '0.4px',
              whiteSpace: 'nowrap',
            }}>
              🔒 VIEW ONLY
            </div>
            <button
              onClick={handleGetPdf}
              className="font-arimo font-bold sm-btn sm-btn-gold sm-shine"
              style={{ height: '36px', padding: '0 16px' }}
            >
              <DownloadIcon />
              Get PDF
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: '#F3F4F6', border: '1px solid #E5E7EB',
                color: '#6B7280', cursor: 'pointer', fontSize: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Viewer area with watermark + self-hosted PDF renderer ── */}
        <div
          className="flex-1 relative overflow-hidden"
          style={{ background: '#E8ECF3', userSelect: 'none' }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Loading skeleton */}
          {!docLoaded && !docError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5"
              style={{ background: '#F1F4FA', zIndex: 20 }}>
              <div style={{
                width: '220px', height: '290px', borderRadius: '10px',
                background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)',
                backgroundSize: '500px 100%',
                animation: 'rwj-shimmer 1.4s infinite linear',
                boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
              }} />
              <div style={{ textAlign: 'center' }}>
                <p className="font-arimo font-bold" style={{ fontSize: '14px', color: '#374151' }}>Loading note…</p>
                <p className="font-arimo" style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>Fetching from secure storage</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {docError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
              style={{ background: '#F1F4FA', zIndex: 20 }}>
              <p className="font-arimo font-bold" style={{ fontSize: '14px', color: '#374151' }}>Couldn&apos;t load this note</p>
              <p className="font-arimo" style={{ fontSize: '12px', color: '#9CA3AF' }}>Please close and try again</p>
            </div>
          )}

          {/* Self-hosted PDF renderer — continuous scroll, no pop-out, no download UI */}
          <div className="absolute inset-0">
            <PdfViewer
              pages={pages}
              zoomLevel={zoomLevel}
              scrollRequest={scrollRequest}
              onPageChange={(p) => setPageNumber(p)}
              onLoadSuccess={(n) => { setNumPages(n); setDocLoaded(true); }}
              onLoadError={() => setDocError(true)}
            />
          </div>

          {/* ── Page navigation ── */}
          {docLoaded && numPages > 1 && (
            <div
              className="flex items-center font-arimo font-bold"
              style={{
                position: 'absolute',
                bottom: '14px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 15,
                gap: '8px',
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '4px 6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              <button
                onClick={() => setScrollRequest((r) => ({ page: Math.max(1, pageNumber - 1), n: r.n + 1 }))}
                disabled={pageNumber <= 1}
                title="Previous page"
                style={{
                  width: '24px', height: '24px', borderRadius: '6px',
                  background: '#F3F4F6', border: 'none', color: '#374151',
                  cursor: pageNumber <= 1 ? 'default' : 'pointer', fontSize: '14px', lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: pageNumber <= 1 ? 0.4 : 1,
                }}
              >
                ‹
              </button>
              <span style={{ fontSize: '12px', color: '#374151', minWidth: '64px', textAlign: 'center' }}>
                Page {pageNumber} of {numPages}
              </span>
              <button
                onClick={() => setScrollRequest((r) => ({ page: Math.min(numPages, pageNumber + 1), n: r.n + 1 }))}
                disabled={pageNumber >= numPages}
                title="Next page"
                style={{
                  width: '24px', height: '24px', borderRadius: '6px',
                  background: '#F3F4F6', border: 'none', color: '#374151',
                  cursor: pageNumber >= numPages ? 'default' : 'pointer', fontSize: '14px', lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: pageNumber >= numPages ? 0.4 : 1,
                }}
              >
                ›
              </button>
            </div>
          )}

          {/* ── Watermark overlay ── */}
          {docLoaded && (
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 10,
                pointerEvents: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'%3E%3Ctext transform='rotate(-32 160 90)' x='8' y='100' font-family='Arial,sans-serif' font-size='13' font-weight='bold' fill='rgba(17%2C24%2C39%2C0.07)' letter-spacing='1'%3ERISE WITH JEET • VIEW ONLY%3C/text%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat',
                backgroundSize: '320px 180px',
              }}
            />
          )}
        </div>

        {/* ── Footer ── */}
        <div
          className="flex items-center justify-end flex-shrink-0"
          style={{
            background: 'linear-gradient(90deg, rgba(255,251,235,0.6), #FFFFFF)',
            borderTop: '1px solid #E5E7EB',
            padding: '10px 18px',
          }}
        >
          <button
            onClick={handleGetPdf}
            className="font-arimo font-bold rwj-shine flex items-center"
            style={{
              fontSize: '13px',
              background: PRO_GRADIENT,
              color: '#FFD96B',
              borderRadius: '12px',
              height: '40px',
              padding: '0 18px',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              gap: '8px',
              boxShadow: PRO_SHADOW,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = PRO_SHADOW_HOVER;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = PRO_SHADOW;
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(1px)'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
          >
            <SparklesIcon />
            Upgrade to Download
          </button>
        </div>
      </div>
    </div>
  );
}
