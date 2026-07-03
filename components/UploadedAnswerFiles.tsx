'use client';

import { useEffect, useState } from 'react';
import FilePreviewThumb from './FilePreviewThumb';

type Props = {
  /** The uploaded answer files to display. */
  files: File[];
  /** Remove the file at the given index. */
  onRemove: (index: number) => void;
};

/**
 * Uploaded-answer file list with visible thumbnails, in-page preview and a
 * remove action — extracted from the Mains Answer Evaluation module so the
 * Daily Mains Challenge (and any other upload area) reuse the exact same UI.
 */
export default function UploadedAnswerFiles({ files, onRemove }: Props) {
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Object URL for the full-size preview modal.
  useEffect(() => {
    if (!previewFile) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(previewFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [previewFile]);

  // Close the preview on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPreviewFile(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (files.length === 0) return null;

  return (
    <>
      {/* ── Uploaded file preview cards (image/PDF thumbnails) ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {files.map((f, fi) => (
          <div
            key={`${f.name}-${fi}`}
            style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '12px 14px', borderRadius: '14px',
              border: '1.5px solid #BBF7D0', background: '#F0FDF4',
            }}
          >
            <FilePreviewThumb file={f} size={56} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13.5px', fontWeight: 700, color: '#17223E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.name}
                </span>
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }} aria-hidden="true">
                  <circle cx="9" cy="9" r="9" fill="#16A34A" />
                  <path d="M5 9.5L7.5 12L13 6.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6A7282' }}>
                {(f.size / 1024 / 1024).toFixed(1)} MB
                {files.length > 1 && <> · Page {fi + 1} of {files.length}</>}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setPreviewFile(f)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '8px 12px', background: 'none', border: '1px solid #E5E7EB', borderRadius: '10px', cursor: 'pointer' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="#6B7280" strokeWidth="2"/></svg>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, color: '#6B7280' }}>Preview</span>
              </button>
              <button
                type="button"
                onClick={() => onRemove(fi)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '8px 12px', background: 'none', border: '1px solid #FECACA', borderRadius: '10px', cursor: 'pointer' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0v14a1 1 0 01-1 1H7a1 1 0 01-1-1V6" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, color: '#DC2626' }}>Remove</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── In-page file preview modal ── */}
      {previewFile && (
        <div
          onClick={() => setPreviewFile(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(15, 23, 43, 0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF', borderRadius: '16px', overflow: 'hidden',
              width: 'min(900px, 100%)', maxHeight: '90vh',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '14px 18px', borderBottom: '1px solid #E5E7EB' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#101828', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {previewFile.name}
              </span>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                aria-label="Close preview"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FFFFFF', cursor: 'pointer', flexShrink: 0 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            </div>
            {/* Body */}
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {previewUrl && (
                previewFile.type.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt={previewFile.name} style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', display: 'block' }} />
                ) : (previewFile.type === 'application/pdf' || previewFile.name.toLowerCase().endsWith('.pdf')) ? (
                  <iframe src={previewUrl} title={previewFile.name} style={{ width: '100%', height: '80vh', border: 'none' }} />
                ) : (
                  <div style={{ padding: '48px 24px', textAlign: 'center', fontFamily: 'Inter, sans-serif', color: '#6B7280' }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>📄</div>
                    <div style={{ fontSize: '14px' }}>Preview not available for this file type.</div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
