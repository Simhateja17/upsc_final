'use client';

import { useEffect, useState } from 'react';

type Props = {
  /** File to preview. When null, the modal is closed. */
  file: File | null;
  /** Called when the user dismisses the modal (backdrop, close button, or Esc). */
  onClose: () => void;
};

/**
 * Full-screen, in-page preview of an uploaded answer file. Keeps the user inside
 * the current flow (no new tab / no navigation):
 *   - images → rendered inline
 *   - PDFs   → embedded in an <iframe>
 *   - other  → filename + download fallback
 */
export default function FilePreviewModal({ file, onClose }: Props) {
  const [url, setUrl] = useState<string | null>(null);

  const isImage = !!file && file.type.startsWith('image/');
  const isPdf = !!file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));

  // Build (and later revoke) an object URL for the current file.
  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  // Close on Escape.
  useEffect(() => {
    if (!file) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [file, onClose]);

  if (!file) return null;

  const sizeLabel = `${(file.size / 1024 / 1024).toFixed(1)} MB`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${file.name}`}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15,23,42,0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'mfp-fade 0.15s ease',
      }}
    >
      <style>{`@keyframes mfp-fade { from { opacity: 0 } to { opacity: 1 } }`}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 860,
          maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 18px', borderBottom: '1px solid #EEF1F6' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#17223E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {file.name}
            </div>
            <div style={{ fontSize: 12, color: '#6A7282' }}>{sizeLabel}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 8, border: '1px solid #E5E7EB', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, minHeight: 0, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto' }}>
          {url && isImage && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={url} alt={file.name} style={{ maxWidth: '100%', maxHeight: '82vh', objectFit: 'contain', display: 'block' }} />
          )}
          {url && isPdf && (
            <iframe title={file.name} src={url} style={{ width: '100%', height: '82vh', border: 'none' }} />
          )}
          {url && !isImage && !isPdf && (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>📄</div>
              <div style={{ fontSize: 14, color: '#4A5565', marginBottom: 16 }}>
                Preview isn&apos;t available for this file type.
              </div>
              <a
                href={url}
                download={file.name}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, background: '#17223E', color: '#FFFFFF', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}
              >
                Download file
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
