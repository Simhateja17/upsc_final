'use client';

import React from 'react';

// Quote Icon for testimonial
const QuoteIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 18H12L8 26H14L18 18V6H6V18Z" fill="#1A9E75"/>
    <path d="M20 18H26L22 26H28L32 18V6H20V18Z" fill="#1A9E75"/>
  </svg>
);

// User Icon
const UserIcon = () => (
  <div className="w-10 h-10 rounded-full bg-[#1A9E75] flex items-center justify-center">
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 10C12.21 10 14 8.21 14 6C14 3.79 12.21 2 10 2C7.79 2 6 3.79 6 6C6 8.21 7.79 10 10 10Z" fill="white"/>
      <path d="M10 12C6.13 12 3 14.13 3 17V18H17V17C17 14.13 13.87 12 10 12Z" fill="white"/>
    </svg>
  </div>
);

// Feature icons for Jeet Path
const SessionIcon = () => (
  <div className="w-6 h-6 flex items-center justify-center">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#1A9E75"/>
      <rect x="3" y="4" width="4" height="3" fill="white"/>
      <rect x="9" y="4" width="4" height="3" fill="white"/>
      <rect x="3" y="9" width="4" height="3" fill="white"/>
      <rect x="9" y="9" width="4" height="3" fill="white"/>
    </svg>
  </div>
);

const ChartIcon = () => (
  <div className="w-6 h-6 flex items-center justify-center">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#1A9E75"/>
      <path d="M3 12L6 8L9 10L13 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
);

const PlanIcon = () => (
  <div className="w-6 h-6 flex items-center justify-center">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#F5A623"/>
      <path d="M4 8L7 11L12 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
);

const Mentorship = () => {
  return (
    <section className="w-full panel-recessed py-[clamp(2rem,4vw,5rem)]">
      <div className="w-full max-w-[120rem] mx-auto px-[clamp(1.5rem,4vw,5rem)]">
        {/* Section Title with border */}
        <div className="flex justify-center mb-[clamp(1.5rem,3vw,3rem)]">
          <h2
            className="font-lora font-bold text-center"
            style={{
              fontSize: 'clamp(1.75rem, 3.646vw, 70px)',
              lineHeight: '150%',
              letterSpacing: '-1.5%',
              color: '#00052E',
            }}
          >
            Personalized Mentorship
          </h2>
        </div>

        {/* Subtitle */}
        <p 
          className="text-center text-[#5A6B7D] mb-[clamp(1rem,1.5vw,1.5rem)]"
          style={{
            fontSize: 'clamp(0.875rem, 1.042vw, 1.25rem)',
          }}
        >
          Guidance from experienced mentors who understand the UPSC journey
        </p>

        {/* Accent line */}
        <div className="flex justify-center mb-[clamp(2rem,3vw,4rem)]">
          <div className="w-16 h-1 bg-[#1A9E75] rounded-full"></div>
        </div>

        {/* Mentorship Content Grid */}
        <div className="flex flex-col lg:flex-row gap-[clamp(2rem,4vw,5rem)] items-start">
          {/* Left - Testimonial Card */}
          <div 
            className="w-full lg:w-[45%] bg-white rounded-2xl p-[clamp(1.5rem,2.5vw,3rem)] shadow-sm"
            style={{
              border: '1px solid #E7E0DA',
            }}
          >
            {/* Quote Icon */}
            <div className="mb-[clamp(1rem,1.5vw,1.5rem)]">
              <QuoteIcon />
            </div>

            {/* Quote Text */}
            <p 
              className="font-inter italic text-[#1C2E45] mb-[clamp(1.5rem,2vw,2.5rem)]"
              style={{
                fontSize: 'clamp(0.875rem, 1.146vw, 1.375rem)',
                lineHeight: '170%',
              }}
            >
              The difference between aspirants and officers is often not knowledge but strategy. We help you build the right strategy, maintain consistency, and overcome plateaus.
            </p>

            {/* Author */}
            <div className="flex items-center gap-3">
              <UserIcon />
              <div>
                <p 
                  className="font-inter font-semibold text-[#1C2E45]"
                  style={{
                    fontSize: 'clamp(0.875rem, 1.042vw, 1.25rem)',
                  }}
                >
                  Jeet Sharma
                </p>
                <p 
                  className="font-inter text-[#5A6B7D]"
                  style={{
                    fontSize: 'clamp(0.75rem, 0.833vw, 1rem)',
                  }}
                >
                  Founder & Mentor, Ex-Civil Servant
                </p>
              </div>
            </div>
          </div>

          {/* Right - Jeet Path Features */}
          <div className="w-full lg:w-[55%]">
            <h3 
              className="font-plus-jakarta font-bold text-[#1C2E45] mb-[clamp(0.75rem,1vw,1rem)]"
              style={{
                fontSize: 'clamp(1.25rem, 1.563vw, 1.875rem)',
              }}
            >
              Jeet Path: Your Personalized Roadmap
            </h3>

            <p 
              className="text-[#5A6B7D] mb-[clamp(1.5rem,2vw,2.5rem)]"
              style={{
                fontSize: 'clamp(0.75rem, 0.938vw, 1.125rem)',
                lineHeight: '160%',
              }}
            >
              Every aspirant is unique. Our mentorship program adapts to your strengths, weaknesses, and learning pace.
            </p>

            {/* Feature List */}
            <div className="space-y-[clamp(1rem,1.5vw,1.5rem)]">
              {/* Weekly Sessions */}
              <div className="flex items-start gap-3">
                <SessionIcon />
                <div>
                  <p 
                    className="font-inter font-semibold text-[#1C2E45]"
                    style={{
                      fontSize: 'clamp(0.875rem, 1.042vw, 1.25rem)',
                    }}
                  >
                    Weekly One-on-One Sessions
                  </p>
                  <p 
                    className="text-[#5A6B7D]"
                    style={{
                      fontSize: 'clamp(0.75rem, 0.833vw, 1rem)',
                    }}
                  >
                    Personalized feedback and strategy adjustments
                  </p>
                </div>
              </div>

              {/* Progress Analytics */}
              <div className="flex items-start gap-3">
                <ChartIcon />
                <div>
                  <p 
                    className="font-inter font-semibold text-[#1C2E45]"
                    style={{
                      fontSize: 'clamp(0.875rem, 1.042vw, 1.25rem)',
                    }}
                  >
                    Progress Analytics Dashboard
                  </p>
                  <p 
                    className="text-[#5A6B7D]"
                    style={{
                      fontSize: 'clamp(0.75rem, 0.833vw, 1rem)',
                    }}
                  >
                    Visualize your preparation with detailed insights
                  </p>
                </div>
              </div>

              {/* Dynamic Study Plan */}
              <div className="flex items-start gap-3">
                <PlanIcon />
                <div>
                  <p 
                    className="font-inter font-semibold text-[#1C2E45]"
                    style={{
                      fontSize: 'clamp(0.875rem, 1.042vw, 1.25rem)',
                    }}
                  >
                    Dynamic Study Plan Adjustments
                  </p>
                  <p 
                    className="text-[#5A6B7D]"
                    style={{
                      fontSize: 'clamp(0.75rem, 0.833vw, 1rem)',
                    }}
                  >
                    Your plan evolves based on performance and goals
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button 
              className="mt-[clamp(1.5rem,2.5vw,3rem)] flex items-center gap-2 bg-[#1C2E45] hover:bg-[#2A4060] text-white rounded-lg transition-colors"
              style={{
                padding: 'clamp(0.75rem, 1vw, 1rem) clamp(1.5rem, 2vw, 2rem)',
                fontSize: 'clamp(0.875rem, 1.042vw, 1.25rem)',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 2L9 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18 2L12 18L9 11L2 8L18 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Schedule Mentor Session
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Mentorship;
