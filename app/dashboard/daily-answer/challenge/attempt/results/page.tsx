'use client';

import React from 'react';

const METRICS = [
  {
    id: 'structure',
    label: 'STRUCTURE',
    value: 'Well Organized',
    icon: '✓',
    bg: '#F0FDF4',
    borderColor: '#B9F8CF',
    iconColor: '#0D542B',
    valueColor: '#0D542B',
  },
  {
    id: 'content',
    label: 'CONTENT DEPTH',
    value: 'Needs Examples',
    icon: '⚠',
    bg: '#FEFCE8',
    borderColor: '#FFF085',
    iconColor: '#A16207',
    valueColor: '#713F12',
  },
  {
    id: 'clarity',
    label: 'CLARITY',
    value: 'Clear Articulation',
    icon: '✓',
    bg: '#F0FDF4',
    borderColor: '#B9F8CF',
    iconColor: '#0D542B',
    valueColor: '#0D542B',
  },
  {
    id: 'timemgmt',
    label: 'TIME MGMT',
    value: 'Good Pace',
    icon: '⚡',
    bg: '#F9FAFB',
    borderColor: '#E5E7EB',
    iconColor: '#374151',
    valueColor: '#101828',
  },
];

const DID_WELL = [
  'Clear introduction defining local self-government',
  'Correct constitutional references (73rd & 74th Amendments)',
  'Good logical flow from historical to current context',
  'Appropriate conclusion summarizing key points',
  'Effective use of headings and paragraph breaks',
];

const AREAS_TO_IMPROVE = [
  "Add specific examples (Kerala's People's Plan, MP women representatives)",
  'Include quantitative data (% women representatives, budget trends)',
  'Balance arguments more evenly between strengths/limitations',
  'Connect each point explicitly to "strengthening democracy"',
  'Add more recent initiatives (e-Gram Swaraj, 15th FC recommendations)',
];

const VALUE_IDEAS = [
  'Reference 2nd ARC report on local governance reforms',
  'Compare Panchayati Raj vs. Municipal governance structures',
  'Quote Mahatma Gandhi on "gram swaraj" concept',
  'Mention SC/ST reservation impact on social justice',
  'Discuss challenges in metropolitan governance',
];

export default function ResultsPage() {
  return (
    <div
      className="min-h-screen font-arimo"
      style={{ background: 'linear-gradient(180deg, #E6EAF0 0%, #DDE2EA 100%)' }}
    >
      {/* Main Content */}
      <div className="flex flex-col items-center py-10 px-6 gap-6">

        {/* Score Card */}
        <div
          className="flex flex-col items-center justify-center"
          style={{
            width: '988px',
            height: '168px',
            borderRadius: '14px',
            background: 'linear-gradient(90deg, #101828 0%, #17223E 100%)',
          }}
        >
          <p
            style={{
              fontFamily: 'Arimo',
              fontWeight: 700,
              fontSize: '14px',
              lineHeight: '20px',
              letterSpacing: '0.35px',
              textTransform: 'uppercase',
              color: '#D1D5DC',
              marginBottom: '4px',
            }}
          >
            SCORE
          </p>
          <div className="flex items-baseline gap-1">
            <span
              style={{
                fontFamily: 'Arimo',
                fontWeight: 700,
                fontSize: '82px',
                lineHeight: '72px',
                color: '#FDC700',
              }}
            >
              6.5
            </span>
            <span
              style={{
                fontFamily: 'Arimo',
                fontWeight: 700,
                fontSize: '35px',
                lineHeight: '48px',
                color: '#FDC70087',
              }}
            >
              /10
            </span>
          </div>
        </div>

        {/* Feedback Card */}
        <div
          style={{
            width: '988px',
            borderRadius: '14px',
            background: '#FFFFFF',
            boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A',
            padding: '32px 32px 32px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* Feedback Header Row */}
          <img
            src="/feedback-header.png"
            alt="Personalized Feedback"
            style={{
              width: '924px',
              objectFit: 'fill',
            }}
          />

          {/* Subtitle */}
          <img
            src="/feedback-subtitle.png"
            alt="Actionable insights to help you improve, not just a score"
            style={{
              width: '924px',
              objectFit: 'fill',
            }}
          />

          {/* 4 Metric Cards */}
          <img
            src="/metrics-container.png"
            alt="Metrics"
            style={{
              width: '924px',
              objectFit: 'fill',
            }}
          />

          {/* 3 Feedback Columns */}
          <img
            src="/feedback-container.png"
            alt="Feedback"
            style={{
              width: '924px',
              height: '387.2px',
              objectFit: 'fill',
            }}
          />
        </div>
      </div>
    </div>
  );
}
