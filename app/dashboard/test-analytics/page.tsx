'use client';

import React from 'react';

export default function TestAnalyticsPage() {
  return (
    <div
      className="flex overflow-hidden"
      style={{ background: '#FFFFFF', minHeight: 'calc(100vh - clamp(90px, 5.78vw, 111px))' }}
    >
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-[1180px] mx-auto px-6 py-8">
          {/* Simple hero so the route is visible */}
          <div
            className="w-full rounded-[16px] px-8 pt-8 pb-6 mb-8"
            style={{
              background: 'linear-gradient(135deg, #0F172B 0%, #1E2939 100%)',
            }}
          >
            <div className="mb-3">
              <span
                className="inline-flex items-center justify-center rounded-full px-3 py-1 uppercase tracking-[0.12em]"
                style={{
                  fontFamily: 'Inter',
                  fontWeight: 700,
                  fontSize: 12,
                  lineHeight: '16px',
                  letterSpacing: '1.2px',
                  color: '#0B1120',
                  background: '#00D5BE',
                }}
              >
                Analytics - Test Dashboard
              </span>
            </div>

            <h1
              className="text-[32px] sm:text-[40px] leading-[40px] font-bold mb-2"
              style={{ color: '#FFFFFF', fontFamily: 'Inter, system-ui' }}
            >
              Test Analytics.
            </h1>

            <p
              className="max-w-[620px]"
              style={{
                fontFamily: 'Inter',
                fontWeight: 400,
                fontSize: 14,
                lineHeight: '22px',
                color: '#D1D5DC',
              }}
            >
              Detailed performance for each mock test — scores, accuracy, time spent per question and
              rank history. This page is wired and ready; you can extend it with charts and tables
              similar to the Performance Analytics screen.
            </p>
          </div>

          <div
            className="rounded-[14px] border border-dashed border-[#E5E7EB] px-6 py-10 text-center"
            style={{ background: '#F9FAFB' }}
          >
            <h2
              className="text-[18px] font-semibold mb-2"
              style={{ fontFamily: 'Inter', color: '#111827' }}
            >
              Test Analytics Coming Soon
            </h2>
            <p
              className="text-[14px]"
              style={{ fontFamily: 'Inter', color: '#6B7280' }}
            >
              The route <code className="px-1 py-0.5 rounded bg-white border border-[#E5E7EB] text-[12px]">/dashboard/test-analytics</code>{' '}
              is now active. When you are ready, you can add MCQ trends, subject-wise breakdown and
              complete test history components here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
