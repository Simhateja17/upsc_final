'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const AddTaskModal = ({ onClose }: { onClose: () => void }) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('15:30');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-8 w-full max-w-[520px] mx-4 relative"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-inter font-bold text-[22px] text-[#17223E]">Add Custom Study Task</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-gray-500 font-medium text-[16px]"
          >
            ✕
          </button>
        </div>

        {/* Task Title */}
        <div className="mb-5">
          <label className="block font-inter font-medium text-[14px] text-[#6366F1] mb-2">Task Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g., Complete Polity Chapter 5"
            className="w-full border-2 border-[#6366F1] rounded-xl px-4 py-3 font-inter text-[14px] text-gray-500 outline-none focus:border-[#4F46E5] transition-colors"
          />
        </div>

        {/* Subject */}
        <div className="mb-5">
          <label className="block font-inter font-medium text-[14px] text-[#6366F1] mb-2">Subject</label>
          <select
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 font-inter text-[14px] text-gray-500 outline-none focus:border-[#6366F1] bg-white transition-colors appearance-auto"
          >
            <option value="">Select Subject</option>
            <option value="indian-polity">Indian Polity</option>
            <option value="history">History</option>
            <option value="geography">Geography</option>
            <option value="economics">Economics</option>
            <option value="environment">Environment</option>
            <option value="current-affairs">Current Affairs</option>
            <option value="science-tech">Science & Technology</option>
          </select>
        </div>

        {/* Time */}
        <div className="mb-7">
          <label className="block font-inter font-medium text-[14px] text-[#6366F1] mb-2">Time</label>
          <div className="flex gap-4">
            <input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 font-inter text-[14px] text-gray-700 outline-none focus:border-[#6366F1] transition-colors"
            />
            <input
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 font-inter text-[14px] text-gray-700 outline-none focus:border-[#6366F1] transition-colors"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border-2 border-gray-200 rounded-xl py-3 font-inter font-medium text-[15px] text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <span>✕</span> Cancel
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl py-3 font-inter font-medium text-[15px] text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v14a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17 21v-8H7v8M7 3v5h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Add Task
          </button>
        </div>
      </div>
    </div>
  );
};

const ResponsiveDashboardContent = () => {
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  return (
    <>
    <div className="w-full min-h-screen py-[clamp(1.5rem,3vw,4rem)] px-[clamp(1rem,2vw,3rem)]" style={{ background: '#FAFBFE' }}>
      <div className="max-w-[1400px] mx-auto">

        {/* Greeting Card */}
        <div
          className="w-full rounded-[16px] p-[clamp(1.5rem,2.08vw,2rem)] mb-[clamp(1.5rem,2vw,2.5rem)]"
          style={{
            background: 'linear-gradient(180deg, #0E182D 0%, #17223E 100%)',
          }}
        >
          {/* Greeting Section */}
          <div className="mb-[clamp(0.5rem,0.75vw,0.75rem)]">
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
              <p className="font-bold text-white">Ready to rise up? Let&apos;s make today count.</p>
            </div>
          </div>

          {/* Countdown Section */}
          <div
            className="px-[clamp(1rem,1.04vw,1.25rem)] py-[clamp(0.75rem,0.83vw,1rem)] rounded-[4px] flex items-center gap-3"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderLeft: '4px solid #FF8904',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/red.png" alt="Calendar" className="w-[clamp(16px,1.04vw,20px)] h-[clamp(16px,1.04vw,20px)] flex-shrink-0" />
            <p
              className="font-arimo text-white"
              style={{
                fontSize: 'clamp(13px,0.83vw,16px)',
                lineHeight: '1.43',
                letterSpacing: '0px',
              }}
            >
              UPSC Prelims 2026: 89 days remaining.
            </p>
          </div>
        </div>

        {/* Search Bar & Action Buttons */}
        <div className="flex flex-wrap gap-[clamp(0.75rem,1.04vw,1.25rem)] items-center mb-[clamp(2rem,3vw,3.5rem)]">
          {/* Search Bar */}
          <div
            className="flex-1 min-w-[280px] flex items-center gap-[clamp(0.5rem,0.68vw,0.75rem)] px-[clamp(1.25rem,1.56vw,1.75rem)] rounded-[40px] bg-[#DAE2FF]"
            style={{
              height: 'clamp(48px,2.8vw,56px)',
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
                fontSize: 'clamp(14px,0.83vw,16px)',
                lineHeight: '1',
              }}
            />
          </div>

          {/* Add Task Button */}
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="px-[clamp(1.25rem,1.46vw,1.75rem)] rounded-[20px] font-inter font-medium text-white border-2 flex items-center gap-2 hover:opacity-90 transition-opacity"
            style={{
              height: 'clamp(48px,2.8vw,56px)',
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
              height: 'clamp(48px,2.8vw,56px)',
              fontSize: 'clamp(14px,0.78vw,15px)',
              background: 'rgba(255, 255, 255, 0.11)',
              borderColor: '#17223E',
              color: '#17223E',
              boxShadow: '0px 4px 17.1px 0px rgba(255, 255, 255, 0.06) inset',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/c.png"
              alt="Calendar"
              className="w-[clamp(14px,0.83vw,16px)] h-[clamp(14px,0.83vw,16px)]"
            />
            <span>Schedule</span>
          </button>

          {/* Generate Test Button */}
          <Link href="/dashboard/practice-test">
            <button
              className="px-[clamp(1.25rem,1.46vw,1.75rem)] rounded-[20px] font-inter font-medium text-white border-2 flex items-center gap-2 hover:opacity-90 transition-opacity"
              style={{
                height: 'clamp(38px,2.03vw,39px)',
                fontSize: 'clamp(14px,0.78vw,15px)',
                background: 'linear-gradient(135deg, #FDC700 0%, #FF8904 100%)',
                borderColor: '#FDC700',
                boxShadow: '0px 4px 17.1px 0px rgba(253, 199, 0, 0.3) inset',
              }}
            >
              <span>🚀</span>
              <span>Generate Test</span>
            </button>
          </Link>
        </div>

        {/* Today's Trio Section */}
        <div
          className="mb-[clamp(2rem,2.5vw,3rem)] rounded-[14px] p-[clamp(1.25rem,1.5vw,1.75rem)]"
          style={{
            background: '#FFFFFF',
            border: '0.8px solid #E5E7EB',
          }}
        >
          <div className="flex items-center gap-2 mb-[clamp(1rem,1.25vw,1.5rem)]">
            <img src="/image-removebg-preview (46) 1.png" alt="Today's Trio" className="w-[clamp(18px,1.25vw,22px)] h-[clamp(18px,1.25vw,22px)]" />
            <h2 className="font-inter font-bold text-[clamp(18px,1.2vw,20px)] text-[#1A1A1A]">
              Today's Trio
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-[clamp(1rem,1.25vw,1.5rem)]">
            {/* Daily MCQ Card */}
            <Link
              href="/dashboard/daily-mcq"
              aria-label="Open Daily MCQ"
              className="block bg-[#F9FAFB] rounded-[14px] border border-[#E5E7EB] p-[clamp(1.25rem,1.75vw,2rem)] relative cursor-pointer h-full flex flex-col hover:border-[#D0D5DD] transition-colors"
            >
              <div className="absolute top-4 right-4 flex items-center justify-center" style={{ width: '24px', height: '24px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/container-icon.png" alt="Completed" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
              </div>

              <div className="mb-4 py-1 text-[clamp(12px,0.73vw,13px)] invisible">AI Evaluation</div>

              <div className="flex items-center gap-3 mb-4">
                <img src="/Text.png" alt="MCQ" className="w-7 h-7" />
                <h3 className="font-inter font-bold text-[clamp(18px,1.15vw,20px)] text-[#1A1A1A]">
                  Daily MCQ
                </h3>
              </div>

              <p className="font-inter text-[clamp(14px,0.83vw,15px)] text-gray-600 mb-2">
                <span className="font-medium text-green-600">Status: Completed</span>
              </p>
              <p className="font-inter text-[clamp(14px,0.83vw,15px)] text-[#1A1A1A] font-medium mb-6 flex-grow">
                5 Questions - Policy & Economy
              </p>

              <div className="w-full bg-[#17223E] text-white rounded-[8px] py-3 px-4 font-inter font-medium text-[clamp(14px,0.83vw,15px)] hover:bg-[#1E2875] transition-colors flex items-center justify-center gap-2" role="button">
                <div style={{
                  width: '22px',
                  height: '16px',
                  aspectRatio: '11/8',
                  background: 'url("/image-removebg-preview (48) 1.png") transparent 50% / cover no-repeat',
                  flexShrink: 0,
                }} />
                Completed
              </div>
            </Link>

            {/* Daily Editorial Card */}
            <Link href="/dashboard/daily-editorial" className="block h-full">
            <div className="bg-[#F9FAFB] rounded-[14px] border border-[#E5E7EB] p-[clamp(1.25rem,1.75vw,2rem)] h-full flex flex-col hover:border-[#D0D5DD] transition-colors cursor-pointer">
              <div className="mb-4 py-1 text-[clamp(12px,0.73vw,13px)] invisible">AI Evaluation</div>

              <div className="flex items-center gap-3 mb-4">
                <img src="/image-removebg-preview (31) 1.png" alt="Editorial" className="w-7 h-7" />
                <h3 className="font-inter font-bold text-[clamp(18px,1.15vw,20px)] text-[#1A1A1A]">
                  Daily Editorial
                </h3>
              </div>

              <p className="font-inter text-[clamp(14px,0.83vw,15px)] text-gray-600 mb-2">
                <span className="font-medium">Status: Pending</span>
              </p>
              <p className="font-inter text-[clamp(14px,0.83vw,15px)] text-[#1A1A1A] font-medium mb-6 flex-grow">
                India-US Trade Relations
              </p>

              <div className="w-full bg-[#17223E] text-white rounded-[8px] py-3 px-4 font-inter font-medium text-[clamp(14px,0.83vw,15px)] hover:bg-[#1E2875] transition-colors flex items-center justify-center gap-2" role="button">
                <img src="/TrioCard.png" alt="Read" className="w-5 h-5" />
                Read Now
              </div>
            </div>
            </Link>

            {/* Mains Question Card */}
            <Link href="/dashboard/daily-answer" className="block h-full">
            <div className="bg-[#F9FAFB] rounded-[14px] border border-[#E5E7EB] p-[clamp(1.25rem,1.75vw,2rem)] h-full flex flex-col hover:border-[#D0D5DD] transition-colors cursor-pointer">
              <div className="mb-4 px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[clamp(12px,0.73vw,13px)] font-medium w-fit">
                AI Evaluation
              </div>

              <div className="flex items-center gap-3 mb-4">
                <img src="/image-removebg-preview (31) 1.png" alt="Mains" className="w-7 h-7" />
                <h3 className="font-inter font-bold text-[clamp(18px,1.15vw,20px)] text-[#1A1A1A]">
                  Mains Question
                </h3>
              </div>

              <p className="font-inter text-[clamp(14px,0.83vw,15px)] text-gray-600 mb-2">
                <span className="font-medium">Status: Pending</span>
              </p>
              <p className="font-inter text-[clamp(14px,0.83vw,15px)] text-[#1A1A1A] font-medium mb-6 flex-grow">
                Local Self Governance
              </p>

              <button className="w-full bg-[#17223E] text-white rounded-[8px] py-3 px-4 font-inter font-medium text-[clamp(14px,0.83vw,15px)] hover:bg-[#1E2875] transition-colors flex items-center justify-center gap-2">
                <img src="/TrioCard (1).png" alt="Attempt" className="w-5 h-5" />
                Attempt Now
              </button>
            </div>
            </Link>
          </div>
        </div>

        {/* Today's Study Tasks Section */}
        <div
          className="mb-[clamp(2rem,2.5vw,3rem)] rounded-[14px] p-[clamp(1.25rem,1.5vw,1.75rem)]"
          style={{
            background: '#FFFFFF',
            border: '0.8px solid #E5E7EB',
          }}
        >
          <div className="flex items-center justify-between mb-[clamp(1rem,1.25vw,1.5rem)]">
            <div className="flex items-center gap-2">
              <img src="/image-removebg-preview (5) 1.png" alt="Today's Study Tasks" className="w-[clamp(18px,1.25vw,22px)] h-[clamp(18px,1.25vw,22px)]" />
              <h2 className="font-inter font-bold text-[clamp(18px,1.2vw,20px)] text-[#1A1A1A]">
                Today's Study Tasks
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18l-6-6 6-6" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <span className="font-inter font-medium text-[clamp(13px,0.83vw,15px)] text-gray-400 px-2">
                Today • Wed, Mar 19
              </span>
              <button className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Task 1 - Red Border */}
          <div className="rounded-lg border-l-4 border-red-500 bg-white p-[clamp(0.75rem,1vw,1.25rem)] mb-[clamp(0.75rem,1vw,1rem)] flex items-start justify-between" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <div className="flex-1">
              <h3 className="font-inter font-semibold text-[clamp(14px,0.94vw,16px)] text-[#1A1A1A] mb-2">
                Complete Polity Chapter 5 - Fundamental Rights
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[clamp(12px,0.68vw,13px)] font-medium text-blue-600" style={{ background: '#DBEAFE' }}>
                  <img src="/b.png" alt="Reading" className="w-3.5 h-3.5" />
                  Reading
                </span>
                <span className="inline-flex items-center gap-1 text-gray-600 text-[clamp(12px,0.68vw,13px)]">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  9:00 AM - 11:00 AM (2h)
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[clamp(12px,0.68vw,13px)] font-medium text-purple-700" style={{ background: '#F3E8FF' }}>
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
          <div className="rounded-lg border-l-4 border-green-500 bg-white p-[clamp(0.75rem,1vw,1.25rem)] mb-[clamp(0.75rem,1vw,1rem)] flex items-start justify-between" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <div className="flex-1">
              <h3 className="font-inter font-semibold text-[clamp(14px,0.94vw,16px)] text-[#1A1A1A] mb-2">
                Watch Economics Lecture - Fiscal Policy
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[clamp(12px,0.68vw,13px)] font-medium text-blue-600" style={{ background: '#DBEAFE' }}>
                  <img src="/b.png" alt="Reading" className="w-3.5 h-3.5" />
                  Reading
                </span>
                <span className="inline-flex items-center gap-1 text-gray-600 text-[clamp(12px,0.68vw,13px)]">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  2:00 PM - 3:30 PM (1.5h)
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[clamp(12px,0.68vw,13px)] font-medium text-purple-700" style={{ background: '#F3E8FF' }}>
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
          <div className="rounded-lg border-l-4 border-yellow-500 bg-white p-[clamp(0.75rem,1vw,1.25rem)] mb-[clamp(0.75rem,1vw,1rem)] flex items-start justify-between" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <div className="flex-1">
              <h3 className="font-inter font-semibold text-[clamp(14px,0.94vw,16px)] text-[#1A1A1A] mb-2">
                Solve 50 MCQs on Modern History
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[clamp(12px,0.68vw,13px)] font-medium text-blue-600" style={{ background: '#DBEAFE' }}>
                  <img src="/b.png" alt="Reading" className="w-3.5 h-3.5" />
                  Reading
                </span>
                <span className="inline-flex items-center gap-1 text-gray-600 text-[clamp(12px,0.68vw,13px)]">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  4:00 PM - 5:00 PM (1h)
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[clamp(12px,0.68vw,13px)] font-medium text-purple-700" style={{ background: '#F3E8FF' }}>
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
          <div className="rounded-lg p-[clamp(0.75rem,1vw,1.25rem)] mb-[clamp(0.75rem,1vw,1rem)] flex items-center justify-between">
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
            <button onClick={() => setShowAddTaskModal(true)} className="px-[clamp(1rem,1.25vw,1.5rem)] py-[clamp(0.4rem,0.52vw,0.6rem)] bg-[#17223E] text-white rounded-lg font-inter font-medium text-[clamp(12px,0.68vw,13px)] hover:bg-[#1E2875] transition-colors flex items-center gap-1.5 flex-shrink-0">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              Add Task
            </button>
          </div>

          {/* Start Focus Session Button */}
          <button className="w-full bg-[#17223E] text-white rounded-lg py-[clamp(0.75rem,1vw,1rem)] font-inter font-semibold text-[clamp(14px,0.94vw,16px)] hover:bg-[#1E2875] transition-colors flex items-center justify-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" fill="white"/>
              <path d="M10 8l6 4-6 4V8z" fill="#17223E"/>
            </svg>
            Start Focus Session (25 Mins)
          </button>
        </div>

      </div>
    </div>

      {showAddTaskModal && <AddTaskModal onClose={() => setShowAddTaskModal(false)} />}
    </>
  );
};

export default ResponsiveDashboardContent;
