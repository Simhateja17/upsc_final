'use client';

import React from 'react';
import Link from 'next/link';

export default function DailyMcqResultsPage() {
  return (
    <div className="flex flex-col min-h-screen panel-recessed">
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-[clamp(2rem,4vw,4rem)] px-[clamp(1rem,2vw,3rem)]">
        <div 
          className="card-elevated rounded-[clamp(10px,0.52vw,10px)]"
          style={{ 
            width: 'clamp(600px,40vw,768px)',
            padding: 'clamp(2rem,2.5vw,3rem) clamp(1.5rem,2vw,2.5rem)'
          }}
        >
          {/* Title Section */}
          <div className="text-center mb-[clamp(1.5rem,2vw,2rem)]">
            <h1 
              className="font-arimo font-bold text-[#101828] mb-[clamp(0.5rem,0.625vw,0.625rem)]"
              style={{ 
                fontSize: 'clamp(20px,1.25vw,24px)',
                lineHeight: 'clamp(28px,1.67vw,32px)'
              }}
            >
              Daily MCQs Completed! 🎉
            </h1>
            <p 
              className="font-arimo text-[#4A5565]"
              style={{ 
                fontSize: 'clamp(13px,0.73vw,14px)',
                lineHeight: 'clamp(18px,1.04vw,20px)'
              }}
            >
              Great effort! Here's your performance analysis
            </p>
          </div>

          {/* Score Circle */}
          <div className="flex justify-center mb-[clamp(2rem,2.5vw,3rem)]">
            <div 
              className="rounded-full bg-[#17223E] flex flex-col items-center justify-center gap-1"
              style={{ 
                width: 'clamp(100px,6.67vw,128px)',
                height: 'clamp(100px,6.67vw,128px)'
              }}
            >
              <div 
                className="font-arimo font-bold text-white leading-none"
                style={{ 
                  fontSize: 'clamp(28px,2.08vw,40px)'
                }}
              >
                0/5
              </div>
              <div 
                className="font-arimo font-bold text-white"
                style={{ 
                  fontSize: 'clamp(10px,0.625vw,12px)',
                  lineHeight: 'clamp(14px,0.83vw,16px)'
                }}
              >
                Score
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div 
            className="grid grid-cols-4 gap-[clamp(0.75rem,1vw,1.25rem)] mb-[clamp(1.5rem,2vw,2rem)]"
          >
            {/* Accuracy */}
            <div 
              className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[clamp(10px,0.73vw,14px)] text-center"
              style={{ padding: 'clamp(0.75rem,1vw,1.25rem) clamp(0.5rem,0.625vw,0.75rem)' }}
            >
              <div 
                className="font-arimo text-[#4A5565] mb-[clamp(0.25rem,0.42vw,0.5rem)]"
                style={{ 
                  fontSize: 'clamp(12px,0.73vw,14px)',
                  lineHeight: 'clamp(16px,1.04vw,20px)'
                }}
              >
                Accuracy
              </div>
              <div 
                className="font-arimo font-bold text-[#101828]"
                style={{ 
                  fontSize: 'clamp(20px,1.25vw,24px)',
                  lineHeight: 'clamp(24px,1.67vw,32px)'
                }}
              >
                0%
              </div>
            </div>

            {/* Time Taken */}
            <div 
              className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[clamp(10px,0.73vw,14px)] text-center"
              style={{ padding: 'clamp(0.75rem,1vw,1.25rem) clamp(0.5rem,0.625vw,0.75rem)' }}
            >
              <div 
                className="font-arimo text-[#4A5565] mb-[clamp(0.25rem,0.42vw,0.5rem)]"
                style={{ 
                  fontSize: 'clamp(12px,0.73vw,14px)',
                  lineHeight: 'clamp(16px,1.04vw,20px)'
                }}
              >
                Time Taken
              </div>
              <div 
                className="font-arimo font-bold text-[#101828]"
                style={{ 
                  fontSize: 'clamp(20px,1.25vw,24px)',
                  lineHeight: 'clamp(24px,1.67vw,32px)'
                }}
              >
                8m 42s
              </div>
            </div>

            {/* Speed */}
            <div 
              className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[clamp(10px,0.73vw,14px)] text-center"
              style={{ padding: 'clamp(0.75rem,1vw,1.25rem) clamp(0.5rem,0.625vw,0.75rem)' }}
            >
              <div 
                className="font-arimo text-[#4A5565] mb-[clamp(0.25rem,0.42vw,0.5rem)]"
                style={{ 
                  fontSize: 'clamp(12px,0.73vw,14px)',
                  lineHeight: 'clamp(16px,1.04vw,20px)'
                }}
              >
                Speed
              </div>
              <div 
                className="font-arimo font-bold text-[#101828]"
                style={{ 
                  fontSize: 'clamp(16px,1.04vw,20px)',
                  lineHeight: 'clamp(20px,1.46vw,28px)'
                }}
              >
                1.74 min/Q
              </div>
            </div>

            {/* Rank */}
            <div 
              className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[clamp(10px,0.73vw,14px)] text-center"
              style={{ padding: 'clamp(0.75rem,1vw,1.25rem) clamp(0.5rem,0.625vw,0.75rem)' }}
            >
              <div 
                className="font-arimo text-[#4A5565] mb-[clamp(0.25rem,0.42vw,0.5rem)]"
                style={{ 
                  fontSize: 'clamp(12px,0.73vw,14px)',
                  lineHeight: 'clamp(16px,1.04vw,20px)'
                }}
              >
                Rank
              </div>
              <div 
                className="font-arimo font-bold text-[#101828]"
                style={{ 
                  fontSize: 'clamp(18px,1.15vw,22px)',
                  lineHeight: 'clamp(22px,1.46vw,28px)'
                }}
              >
                Top 42%
              </div>
            </div>
          </div>

          {/* Strengths and Weaknesses Section */}
          <div 
            className="grid grid-cols-2 gap-[clamp(1rem,1.25vw,1.5rem)] mb-[clamp(1.5rem,2vw,2.5rem)]"
          >
            {/* Strong Topics */}
            <div 
              className="bg-[#F0FDF4] rounded-[clamp(8px,0.52vw,10px)]"
              style={{ padding: 'clamp(1rem,1.04vw,1.25rem)' }}
            >
              <div className="flex items-center gap-2 mb-[clamp(0.75rem,1vw,1.25rem)]">
                <img 
                  src="/strong-icon.png" 
                  alt="Strong" 
                  className="w-[clamp(18px,1.25vw,24px)] h-[clamp(18px,1.25vw,24px)]"
                />
                <h3 
                  className="font-arimo font-bold text-[#0D542B]"
                  style={{ 
                    fontSize: 'clamp(14px,0.83vw,16px)',
                    lineHeight: 'clamp(20px,1.25vw,24px)'
                  }}
                >
                  You're strong in:
                </h3>
              </div>
              <div className="space-y-[clamp(0.5rem,0.625vw,0.75rem)]">
                {['Fundamental Rights', 'Right to Equality', 'Judicial Review'].map((topic) => (
                  <div key={topic} className="flex items-center gap-2">
                    <svg className="w-[clamp(14px,0.83vw,16px)] h-[clamp(14px,0.83vw,16px)] text-[#016630] flex-shrink-0" viewBox="0 0 16 16" fill="none">
                      <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span 
                      className="font-arimo text-[#016630]"
                      style={{ 
                        fontSize: 'clamp(13px,0.73vw,14px)',
                        lineHeight: 'clamp(18px,1.04vw,20px)'
                      }}
                    >
                      {topic}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Needs Revision */}
            <div 
              className="bg-[#FEF2F2] rounded-[clamp(8px,0.52vw,10px)]"
              style={{ padding: 'clamp(1rem,1.04vw,1.25rem)' }}
            >
              <div className="flex items-center gap-2 mb-[clamp(0.75rem,1vw,1.25rem)]">
                <img 
                  src="/revision-icon.png" 
                  alt="Needs Revision" 
                  className="w-[clamp(18px,1.25vw,24px)] h-[clamp(18px,1.25vw,24px)]"
                />
                <h3 
                  className="font-arimo font-bold text-[#991B1B]"
                  style={{ 
                    fontSize: 'clamp(14px,0.83vw,16px)',
                    lineHeight: 'clamp(20px,1.25vw,24px)'
                  }}
                >
                  Needs revision:
                </h3>
              </div>
              <div className="space-y-[clamp(0.5rem,0.625vw,0.75rem)]">
                {['Constitutional Remedies', 'DPSP (Directive Principles)', 'Writs under Article 32'].map((topic) => (
                  <div key={topic} className="flex items-center gap-2">
                    <span className="text-[#DC2626] font-bold flex-shrink-0" style={{ fontSize: 'clamp(14px,0.83vw,16px)' }}>!</span>
                    <span 
                      className="font-arimo text-[#991B1B]"
                      style={{ 
                        fontSize: 'clamp(13px,0.73vw,14px)',
                        lineHeight: 'clamp(18px,1.04vw,20px)'
                      }}
                    >
                      {topic}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-[clamp(1rem,1.25vw,1.5rem)]">
            <Link href="/dashboard/daily-mcq/review">
              <button 
                className="bg-[#00A63E] text-white rounded-[clamp(8px,0.52vw,10px)] hover:bg-[#008C35] transition-colors"
                style={{ 
                  padding: 'clamp(10px,0.83vw,12px) clamp(1.5rem,1.67vw,2rem)',
                  fontSize: 'clamp(14px,0.83vw,16px)',
                  lineHeight: 'clamp(20px,1.25vw,24px)',
                  fontFamily: 'Arimo, sans-serif'
                }}
              >
                View Analysis
              </button>
            </Link>
            <Link href="/dashboard/daily-mcq/next-steps">
              <button 
                className="bg-[#17223E] text-white rounded-[clamp(8px,0.52vw,10px)] hover:bg-[#1E2875] transition-colors"
                style={{ 
                  padding: 'clamp(10px,0.83vw,12px) clamp(1.5rem,1.67vw,2rem)',
                  fontSize: 'clamp(14px,0.83vw,16px)',
                  lineHeight: 'clamp(20px,1.25vw,24px)',
                  fontFamily: 'Arimo, sans-serif'
                }}
              >
                View Smart Next Steps
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
