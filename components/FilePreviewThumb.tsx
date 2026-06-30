'use client';

import { useEffect, useState } from 'react';

type Props = {
  file: File;
  size?: number;
};

/* Renders a small first-page thumbnail of an uploaded answer file:
   - images  → the image itself
   - PDFs    → first page rasterised via pdfjs-dist (worker in /public)
   - other   → a document glyph fallback                              */
export default function FilePreviewThumb({ file, size = 56 }: Props) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  // Images: cheap object URL
  useEffect(() => {
    if (!isImage) return;
    const url = URL.createObjectURL(file);
    setThumbUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, isImage]);

  // PDFs: render page 1 to a canvas → data URL
  useEffect(() => {
    if (!isPdf) return;
    let cancelled = false;

    (async () => {
      try {
        // Load pdfjs as a native browser ESM from /public (copied from pdfjs-dist).
        // webpackIgnore keeps Next's bundler from processing it — bundling pdfjs 5.x
        // ESM throws "Object.defineProperty called on non-object" at import time.
        // @ts-ignore -- resolved at runtime, not by the bundler
        const pdfjs: any = await import(/* webpackIgnore: true */ '/pdf.min.mjs');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        const buf = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: buf }).promise;
        const page = await pdf.getPage(1);

        const scale = (size * 2) / page.getViewport({ scale: 1 }).width; // hi-dpi for the small box
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('no canvas context');

        await page.render({ canvas, canvasContext: ctx, viewport } as any).promise;
        if (!cancelled) setThumbUrl(canvas.toDataURL('image/png'));
      } catch (err) {
        console.error('PDF thumbnail failed:', err);
        if (!cancelled) setFailed(true);
      }
    })();

    return () => { cancelled = true; };
  }, [file, isPdf, size]);

  const box: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: 8,
    overflow: 'hidden',
    flexShrink: 0,
    border: '1px solid #E5E7EB',
    background: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: Math.round(size * 0.42),
  };

  if ((isImage || isPdf) && thumbUrl && !failed) {
    return (
      <div style={box}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumbUrl} alt="answer preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }

  // Loading (pdf) or non-previewable / failed → glyph
  return <div style={box}>📄</div>;
}
