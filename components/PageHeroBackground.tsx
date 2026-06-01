'use client';

import React from 'react';

interface PageHeroBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Reusable hero section background used across all inner dashboard pages.
 * Renders the dark navy base, rectangular grid overlay, and gold glow in the
 * top-left corner. Drop any page-specific content (heading, badge, stats)
 * as children – they'll layer on top.
 */
export default function PageHeroBackground({
  children,
  className = '',
  style,
}: PageHeroBackgroundProps) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        backgroundColor: '#090E1C',
        ...style,
      }}
    >
      {/* Gold / amber glow – top-left corner */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 520px 380px at -6% -8%, rgba(194,140,40,0.22) 0%, transparent 70%)',
        }}
      />

      {/* Page content */}
      <div className="relative z-10 flex h-full flex-col">{children}</div>
    </div>
  );
}
