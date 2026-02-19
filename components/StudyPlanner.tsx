'use client';

import React from 'react';

const StudyPlanner = () => {
  return (
    <section className="w-full panel-recessed py-[clamp(3rem,5.208vw,6.25rem)]">
      <div className="w-full max-w-[120rem] mx-auto px-[clamp(1.5rem,4vw,5rem)]">
        {/* Section Title */}
        <h2 
          className="font-lora font-bold text-center text-black mb-[clamp(2.5rem,4.167vw,5rem)]"
          style={{
            fontSize: 'clamp(2.25rem, 3.646vw, 4.375rem)',
            lineHeight: '150%',
            letterSpacing: '-0.015em',
          }}
        >
          Your Smart Study Planner
        </h2>

        {/* Content Grid */}
        <div className="flex flex-col lg:flex-row gap-[clamp(2rem,4vw,5rem)] items-center justify-center">
          {/* Left - Daily Plan Card */}
          <div 
            className="w-full lg:w-[45%] max-w-[500px] bg-white rounded-2xl p-[clamp(1.5rem,2vw,2.5rem)] shadow-lg"
            style={{
              border: '1px solid #E7E0DA',
            }}
          >
            {/* Mac-style window dots */}
            <div className="flex items-center gap-2 mb-[clamp(1rem,1.5vw,1.5rem)]">
              <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
              <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
            </div>

            {/* Card Title */}
            <div className="flex items-center justify-center gap-2 mb-[clamp(1.25rem,2vw,2rem)]">
              <span className="text-xl">📅</span>
              <h3 
                className="font-inter font-semibold text-[#1C2E45]"
                style={{
                  fontSize: 'clamp(1rem, 1.25vw, 1.5rem)',
                }}
              >
                Your Daily Plan
              </h3>
            </div>

            {/* Time Blocks */}
            <div className="space-y-[clamp(0.75rem,1vw,1rem)]">
              {/* Morning */}
              <div 
                className="rounded-lg p-[clamp(0.75rem,1vw,1rem)]"
                style={{
                  backgroundColor: '#E3F2FD',
                  borderLeft: '4px solid #2196F3',
                }}
              >
                <p 
                  className="font-inter font-semibold text-[#1C2E45]"
                  style={{
                    fontSize: 'clamp(0.875rem, 1.042vw, 1.25rem)',
                  }}
                >
                  Morning (6-9 AM)
                </p>
                <p 
                  className="font-inter text-[#5A6B7D]"
                  style={{
                    fontSize: 'clamp(0.75rem, 0.833vw, 1rem)',
                  }}
                >
                  Static GS + NCERT Foundation
                </p>
              </div>

              {/* Afternoon */}
              <div 
                className="rounded-lg p-[clamp(0.75rem,1vw,1rem)]"
                style={{
                  backgroundColor: '#FFF3E0',
                  borderLeft: '4px solid #FF9800',
                }}
              >
                <p 
                  className="font-inter font-semibold text-[#1C2E45]"
                  style={{
                    fontSize: 'clamp(0.875rem, 1.042vw, 1.25rem)',
                  }}
                >
                  Afternoon (2-5 PM)
                </p>
                <p 
                  className="font-inter text-[#5A6B7D]"
                  style={{
                    fontSize: 'clamp(0.75rem, 0.833vw, 1rem)',
                  }}
                >
                  Answer Writing Practice
                </p>
              </div>

              {/* Evening */}
              <div 
                className="rounded-lg p-[clamp(0.75rem,1vw,1rem)]"
                style={{
                  backgroundColor: '#E8F5E9',
                  borderLeft: '4px solid #4CAF50',
                }}
              >
                <p 
                  className="font-inter font-semibold text-[#1C2E45]"
                  style={{
                    fontSize: 'clamp(0.875rem, 1.042vw, 1.25rem)',
                  }}
                >
                  Evening (7-10 PM)
                </p>
                <p 
                  className="font-inter text-[#5A6B7D]"
                  style={{
                    fontSize: 'clamp(0.75rem, 0.833vw, 1rem)',
                  }}
                >
                  Current Affairs + Revision
                </p>
              </div>
            </div>
          </div>

          {/* Right - Features */}
          <div className="w-full lg:w-[45%] max-w-[500px]">
            <h3 
              className="font-plus-jakarta font-bold text-[#1C2E45] mb-[clamp(1rem,1.5vw,1.5rem)]"
              style={{
                fontSize: 'clamp(1.5rem, 2.083vw, 2.5rem)',
                lineHeight: '140%',
              }}
            >
              Never Miss a Day with Jeet Planner
            </h3>

            {/* Feature List */}
            <div className="space-y-[clamp(0.875rem,1.25vw,1.25rem)]">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#1A9E75] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p 
                  className="font-inter text-[#1C2E45]"
                  style={{
                    fontSize: 'clamp(0.875rem, 1.042vw, 1.25rem)',
                    lineHeight: '160%',
                  }}
                >
                  Personalized study schedules based on your goals and timeline
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#1A9E75] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p 
                  className="font-inter text-[#1C2E45]"
                  style={{
                    fontSize: 'clamp(0.875rem, 1.042vw, 1.25rem)',
                    lineHeight: '160%',
                  }}
                >
                  Integrated with all 10 modules for seamless planning
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#1A9E75] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p 
                  className="font-inter text-[#1C2E45]"
                  style={{
                    fontSize: 'clamp(0.875rem, 1.042vw, 1.25rem)',
                    lineHeight: '160%',
                  }}
                >
                  Track progress and adaptive daily adjustments
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#1A9E75] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p 
                  className="font-inter text-[#1C2E45]"
                  style={{
                    fontSize: 'clamp(0.875rem, 1.042vw, 1.25rem)',
                    lineHeight: '160%',
                  }}
                >
                  Balance between reading, practice, and revision
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <button 
              className="mt-[clamp(1.5rem,2vw,2.5rem)] bg-[#F5A623] hover:bg-[#E09915] text-white font-semibold rounded-lg transition-colors"
              style={{
                padding: 'clamp(0.75rem, 1vw, 1rem) clamp(1.5rem, 2vw, 2rem)',
                fontSize: 'clamp(0.875rem, 1.042vw, 1.25rem)',
              }}
            >
              Start Planning Free →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StudyPlanner;
