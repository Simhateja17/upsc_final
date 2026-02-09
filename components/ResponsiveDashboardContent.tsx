import React from 'react';

const ResponsiveDashboardContent = () => {
  return (
    <div className="w-full min-h-screen bg-white py-[clamp(1.5rem,3vw,4rem)] px-[clamp(1rem,2vw,3rem)]">
      <div className="max-w-[1400px] mx-auto">

        {/* Greeting Card */}
        <div
          className="w-full max-w-[min(848px,90vw)] mx-auto rounded-[16px] p-[clamp(1.5rem,2.08vw,2rem)] mb-[clamp(1.5rem,2vw,2.5rem)]"
          style={{
            background: 'linear-gradient(180deg, #0E182D 0%, #17223E 100%)',
          }}
        >
          {/* Greeting Section */}
          <div className="mb-[clamp(1.5rem,2.34vw,2.5rem)]">
            <h1
              className="font-arimo font-bold text-white mb-[clamp(1rem,1.56vw,1.5rem)]"
              style={{
                fontSize: 'clamp(24px,1.56vw,30px)',
                lineHeight: '1.2',
                letterSpacing: '0px',
              }}
            >
              Good morning, <span style={{ color: '#FFB954' }}>Rahul!</span>
            </h1>

            <div
              className="font-arimo text-white/90 space-y-1"
              style={{
                fontSize: 'clamp(14px,0.83vw,16px)',
                lineHeight: '1.5',
                letterSpacing: '0px',
              }}
            >
              <p>Welcome to your personalized command center for UPSC 2026 preparation.</p>
              <p>🗓 <span className="font-medium">UPSC Prelims 2026: 89 days remaining.</span> Ready to rise up? Let's make today count.</p>
            </div>
          </div>

          {/* Quote Section */}
          <div
            className="px-[clamp(1rem,1.04vw,1.25rem)] py-[clamp(0.75rem,0.83vw,1rem)] rounded-[4px]"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderLeft: '4px solid #FF8904',
            }}
          >
            <p
              className="font-arimo italic text-white"
              style={{
                fontSize: 'clamp(13px,0.73vw,14px)',
                lineHeight: '1.43',
                letterSpacing: '0px',
              }}
            >
              "Success is not final, failure is not fatal: it is the courage to continue that counts." - Winston Churchill
            </p>
          </div>
        </div>

        {/* Search Bar & Action Buttons */}
        <div className="flex flex-wrap gap-[clamp(0.75rem,1.04vw,1.25rem)] items-center justify-center mb-[clamp(2rem,3vw,3.5rem)]">
          {/* Search Bar */}
          <div
            className="flex-1 max-w-[min(602px,50vw)] min-w-[280px] flex items-center gap-[clamp(0.5rem,0.68vw,0.75rem)] px-[clamp(1rem,1.56vw,1.5rem)] rounded-[40px] bg-[#DAE2FF]"
            style={{
              height: 'clamp(38px,2.03vw,39px)',
            }}
          >
            <svg
              className="w-[clamp(16px,1.04vw,20px)] h-[clamp(16px,1.04vw,20px)] flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="11" cy="11" r="7" stroke="#6B7280" strokeWidth="2"/>
              <path d="M20 20L16.5 16.5" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Ask jeet AI: 'Explain currant affairs'"
              className="flex-1 bg-transparent outline-none font-inter text-black placeholder:text-black"
              style={{
                fontSize: 'clamp(13px,0.73vw,14px)',
                lineHeight: '1',
              }}
            />
          </div>

          {/* Add Task Button */}
          <button
            className="px-[clamp(1.25rem,1.46vw,1.75rem)] rounded-[20px] font-inter font-medium text-white border-2 flex items-center gap-2 hover:opacity-90 transition-opacity"
            style={{
              height: 'clamp(38px,2.03vw,39px)',
              fontSize: 'clamp(14px,0.78vw,15px)',
              background: '#17223E',
              borderColor: '#17223E',
              boxShadow: '0px 4px 17.1px 0px rgba(255, 255, 255, 0.06) inset',
            }}
          >
            <svg
              className="w-[clamp(14px,0.83vw,16px)] h-[clamp(14px,0.83vw,16px)]"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <span>Add Task</span>
          </button>

          {/* Schedule Button */}
          <button
            className="px-[clamp(1.25rem,1.46vw,1.75rem)] rounded-[20px] font-inter font-medium border-2 hover:bg-[#17223E] hover:text-white transition-colors flex items-center gap-2"
            style={{
              height: 'clamp(38px,2.03vw,39px)',
              fontSize: 'clamp(14px,0.78vw,15px)',
              background: 'rgba(255, 255, 255, 0.11)',
              borderColor: '#17223E',
              color: '#17223E',
              boxShadow: '0px 4px 17.1px 0px rgba(255, 255, 255, 0.06) inset',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/calendar.png"
              alt="Calendar"
              className="w-[clamp(14px,0.83vw,16px)] h-[clamp(14px,0.83vw,16px)]"
            />
            <span>Schedule</span>
          </button>
        </div>

        {/* Today's Trio Section */}
        <div className="mb-[clamp(2rem,2.5vw,3rem)]">
          <div className="flex items-center gap-2 mb-[clamp(1rem,1.25vw,1.5rem)]">
            <svg className="w-[clamp(18px,1.25vw,22px)] h-[clamp(18px,1.25vw,22px)] text-red-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
            <h2 className="font-inter font-bold text-[clamp(18px,1.2vw,20px)] text-[#1A1A1A]">
              Today's Trio
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-[clamp(1rem,1.25vw,1.5rem)]">
            {/* Daily MCQ Card */}
            <div className="bg-white rounded-lg p-[clamp(1rem,1.25vw,1.5rem)] border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="absolute top-3 right-3 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <img src="/paper-write--Streamline-Ultimate.png" alt="MCQ" className="w-5 h-5" />
                <h3 className="font-inter font-semibold text-[clamp(15px,0.94vw,16px)] text-[#1A1A1A]">
                  Daily MCQ
                </h3>
              </div>

              <p className="font-inter text-[clamp(13px,0.73vw,14px)] text-gray-600 mb-1">
                <span className="font-medium text-green-600">Status: Completed</span>
              </p>
              <p className="font-inter text-[clamp(13px,0.73vw,14px)] text-[#1A1A1A] font-medium mb-4">
                5 Questions - Policy & Economy
              </p>

              <button className="w-full bg-[#17223E] text-white rounded-lg py-2 px-4 font-inter font-medium text-[clamp(13px,0.73vw,14px)] hover:bg-[#1E2875] transition-colors flex items-center justify-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Completed
              </button>
            </div>

            {/* Daily Editorial Card */}
            <div className="bg-white rounded-lg p-[clamp(1rem,1.25vw,1.5rem)] border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <img src="/newspaper-folding.png" alt="Editorial" className="w-5 h-5" />
                <h3 className="font-inter font-semibold text-[clamp(15px,0.94vw,16px)] text-[#1A1A1A]">
                  Daily Editorial
                </h3>
              </div>

              <p className="font-inter text-[clamp(13px,0.73vw,14px)] text-gray-600 mb-1">
                <span className="font-medium">Status: Pending</span>
              </p>
              <p className="font-inter text-[clamp(13px,0.73vw,14px)] text-[#1A1A1A] font-medium mb-4">
                India-US Trade Relations
              </p>

              <button className="w-full bg-[#17223E] text-white rounded-lg py-2 px-4 font-inter font-medium text-[clamp(13px,0.73vw,14px)] hover:bg-[#1E2875] transition-colors">
                Read Now
              </button>
            </div>

            {/* Mains Question Card */}
            <div className="bg-white rounded-lg p-[clamp(1rem,1.25vw,1.5rem)] border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="absolute top-3 right-3 px-2 py-1 bg-teal-50 text-teal-600 rounded text-[clamp(11px,0.63vw,12px)] font-medium">
                AI Evaluation
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <img src="/icon-mains.png" alt="Mains" className="w-5 h-5" />
                <h3 className="font-inter font-semibold text-[clamp(15px,0.94vw,16px)] text-[#1A1A1A]">
                  Mains Question
                </h3>
              </div>

              <p className="font-inter text-[clamp(13px,0.73vw,14px)] text-gray-600 mb-1">
                <span className="font-medium">Status: Pending</span>
              </p>
              <p className="font-inter text-[clamp(13px,0.73vw,14px)] text-[#1A1A1A] font-medium mb-4">
                Local Self Governance
              </p>

              <button className="w-full bg-[#17223E] text-white rounded-lg py-2 px-4 font-inter font-medium text-[clamp(13px,0.73vw,14px)] hover:bg-[#1E2875] transition-colors">
                Attempt Now
              </button>
            </div>
          </div>
        </div>

        {/* Today's Study Tasks Section */}
        <div className="mb-[clamp(2rem,2.5vw,3rem)]">
          <div className="flex items-center justify-between mb-[clamp(1rem,1.25vw,1.5rem)]">
            <div className="flex items-center gap-2">
              <svg className="w-[clamp(18px,1.25vw,22px)] h-[clamp(18px,1.25vw,22px)] text-red-500" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 3v4M16 3v4M3 11h18" stroke="currentColor" strokeWidth="2"/>
                <text x="12" y="17" fontSize="8" fill="currentColor" textAnchor="middle" fontWeight="bold">17</text>
              </svg>
              <h2 className="font-inter font-bold text-[clamp(18px,1.2vw,20px)] text-[#1A1A1A]">
                Today's Study Tasks
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              <span className="font-inter text-[clamp(13px,0.73vw,14px)] text-gray-600 font-medium">
                Today
              </span>
              <span className="font-inter text-[clamp(13px,0.73vw,14px)] text-gray-400">
                Wed, Mar 19
              </span>
              <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Task 1 - Red Border */}
          <div className="bg-white rounded-lg border-l-4 border-red-500 p-[clamp(0.75rem,1vw,1.25rem)] mb-[clamp(0.75rem,1vw,1rem)] shadow-sm flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-inter font-semibold text-[clamp(14px,0.94vw,16px)] text-[#1A1A1A] mb-2">
                Complete Polity Chapter 5 - Fundamental Rights
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[clamp(12px,0.68vw,13px)] font-medium">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <path d="M12 6.25278V19.2528M12 6.25278C10.8321 5.47686 9.24649 5 7.5 5C5.75351 5 4.16789 5.47686 3 6.25278V19.2528C4.16789 18.4769 5.75351 18 7.5 18C9.24649 18 10.8321 18.4769 12 19.2528M12 6.25278C13.1679 5.47686 14.7535 5 16.5 5C18.2465 5 19.8321 5.47686 21 6.25278V19.2528C19.8321 18.4769 18.2465 18 16.5 18C14.7535 18 13.1679 18.4769 12 19.2528" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Reading
                </span>
                <span className="inline-flex items-center gap-1 text-gray-600 text-[clamp(12px,0.68vw,13px)]">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  9:00 AM - 11:00 AM (2h)
                </span>
                <span className="text-purple-600 text-[clamp(12px,0.68vw,13px)] font-medium">
                  Indian Polity
                </span>
              </div>
            </div>
            <button className="ml-3 w-5 h-5 rounded border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 transition-colors flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-green-600" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Task 2 - Green Border */}
          <div className="bg-white rounded-lg border-l-4 border-green-500 p-[clamp(0.75rem,1vw,1.25rem)] mb-[clamp(0.75rem,1vw,1rem)] shadow-sm flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-inter font-semibold text-[clamp(14px,0.94vw,16px)] text-[#1A1A1A] mb-2">
                Watch Economics Lecture - Fiscal Policy
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[clamp(12px,0.68vw,13px)] font-medium">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <path d="M12 6.25278V19.2528M12 6.25278C10.8321 5.47686 9.24649 5 7.5 5C5.75351 5 4.16789 5.47686 3 6.25278V19.2528C4.16789 18.4769 5.75351 18 7.5 18C9.24649 18 10.8321 18.4769 12 19.2528M12 6.25278C13.1679 5.47686 14.7535 5 16.5 5C18.2465 5 19.8321 5.47686 21 6.25278V19.2528C19.8321 18.4769 18.2465 18 16.5 18C14.7535 18 13.1679 18.4769 12 19.2528" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Reading
                </span>
                <span className="inline-flex items-center gap-1 text-gray-600 text-[clamp(12px,0.68vw,13px)]">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  2:00 PM - 3:30 PM (1.5h)
                </span>
                <span className="text-purple-600 text-[clamp(12px,0.68vw,13px)] font-medium">
                  Indian Polity
                </span>
              </div>
            </div>
            <button className="ml-3 w-5 h-5 rounded border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 transition-colors flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-green-600" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Task 3 - Yellow Border */}
          <div className="bg-white rounded-lg border-l-4 border-yellow-500 p-[clamp(0.75rem,1vw,1.25rem)] mb-[clamp(0.75rem,1vw,1rem)] shadow-sm flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-inter font-semibold text-[clamp(14px,0.94vw,16px)] text-[#1A1A1A] mb-2">
                Solve 50 MCQs on Modern History
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[clamp(12px,0.68vw,13px)] font-medium">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <path d="M12 6.25278V19.2528M12 6.25278C10.8321 5.47686 9.24649 5 7.5 5C5.75351 5 4.16789 5.47686 3 6.25278V19.2528C4.16789 18.4769 5.75351 18 7.5 18C9.24649 18 10.8321 18.4769 12 19.2528M12 6.25278C13.1679 5.47686 14.7535 5 16.5 5C18.2465 5 19.8321 5.47686 21 6.25278V19.2528C19.8321 18.4769 18.2465 18 16.5 18C14.7535 18 13.1679 18.4769 12 19.2528" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Reading
                </span>
                <span className="inline-flex items-center gap-1 text-gray-600 text-[clamp(12px,0.68vw,13px)]">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  4:00 PM - 5:00 PM (1h)
                </span>
                <span className="text-purple-600 text-[clamp(12px,0.68vw,13px)] font-medium">
                  Indian Polity
                </span>
              </div>
            </div>
            <button className="ml-3 w-5 h-5 rounded border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 transition-colors flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-green-600" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Add Custom Task */}
          <div className="bg-white rounded-lg p-[clamp(0.75rem,1vw,1.25rem)] mb-[clamp(0.75rem,1vw,1rem)] shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-[clamp(40px,2.6vw,48px)] h-[clamp(40px,2.6vw,48px)] bg-[#17223E] rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <h3 className="font-inter font-semibold text-[clamp(14px,0.94vw,16px)] text-[#1A1A1A]">
                  Add Custom Task
                </h3>
                <p className="font-inter text-[clamp(12px,0.68vw,13px)] text-gray-500">
                  Create your own study task for today
                </p>
              </div>
            </div>
            <button className="px-[clamp(1rem,1.25vw,1.5rem)] py-[clamp(0.4rem,0.52vw,0.6rem)] bg-[#17223E] text-white rounded-lg font-inter font-medium text-[clamp(12px,0.68vw,13px)] hover:bg-[#1E2875] transition-colors flex items-center gap-1.5 flex-shrink-0">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              Add Task
            </button>
          </div>

          {/* Start Focus Session Button */}
          <button className="w-full bg-[#17223E] text-white rounded-lg py-[clamp(0.75rem,1vw,1rem)] font-inter font-semibold text-[clamp(14px,0.94vw,16px)] hover:bg-[#1E2875] transition-colors flex items-center justify-center gap-2 shadow-md">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" fill="white"/>
              <path d="M10 8l6 4-6 4V8z" fill="#17223E"/>
            </svg>
            Start Focus Session (25 Mins)
          </button>
        </div>

      </div>
    </div>
  );
};

export default ResponsiveDashboardContent;
