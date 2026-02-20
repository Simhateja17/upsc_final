'use client';

import React, { useState } from 'react';
import Link from 'next/link';

/* ------------------------------------------------------------------ */
/*  Sample data                                                        */
/* ------------------------------------------------------------------ */
const newsCards = [
  {
    id: 1,
    tags: [
      { label: 'GS Paper II', color: '#1E40AF', bg: '#DBEAFE' },
      { label: 'Polity', color: '#7C3AED', bg: '#EDE9FE' },
      { label: 'Prelims Focus', color: '#EA580C', bg: '#FFF7ED' },
    ],
    readTime: 8,
    title: 'Panchayati Raj at the Crossroads: Devolution, Democracy, and the 3F Challenge',
    description:
      'The editorial examines the persistent gap between constitutional promise and ground reality in local governance \u2014 30 years after the 73rd Amendment.',
    saved: false,
    read: false,
  },
  {
    id: 2,
    tags: [
      { label: 'GS II', color: '#1E40AF', bg: '#DBEAFE' },
      { label: "Int'l Relations", color: '#EA580C', bg: '#FFF7ED' },
      { label: 'High Yield', color: '#16A34A', bg: '#F0FDF4' },
    ],
    readTime: 8,
    title: 'The India-Middle East-Europe Corridor: Geopolitics of Infrastructure',
    description:
      "With the IMEC project gaining momentum, India\u2019s strategic calculation balances trade interests against regional geopolitical sensitivities.",
    saved: false,
    read: false,
  },
  {
    id: 3,
    tags: [
      { label: 'GS III', color: '#1E40AF', bg: '#DBEAFE' },
      { label: 'Environment', color: '#16A34A', bg: '#F0FDF4' },
    ],
    readTime: 8,
    title: 'Climate Finance Gap: Why COP29 Pledges Fall Short',
    description:
      "Developed nations' $300 billion climate finance commitment is less than a third of what vulnerable nations actually need.",
    saved: false,
    read: false,
  },
  {
    id: 4,
    tags: [
      { label: 'GS III', color: '#1E40AF', bg: '#DBEAFE' },
      { label: 'Technology', color: '#7C3AED', bg: '#EDE9FE' },
    ],
    readTime: 8,
    title: "India's Semiconductor Push: PLI Scheme Progress",
    description:
      'Two years into the India Semiconductor Mission, chip fab projects are progressing but talent pipeline gaps threaten long-term viability.',
    saved: false,
    read: false,
  },
  {
    id: 5,
    tags: [
      { label: 'GS II', color: '#1E40AF', bg: '#DBEAFE' },
      { label: 'Judiciary', color: '#DC2626', bg: '#FEF2F2' },
    ],
    readTime: 8,
    title: 'Judicial Backlog: New Bill Proposes Reforms',
    description:
      'Government introduces measures to address the 5-crore pending cases crisis through alternate dispute resolution mechanisms.',
    saved: false,
    read: false,
  },
];

const subjects = [
  { emoji: '\uD83C\uDF3E', label: 'Agriculture', bg: '#DBEAFE', border: '#BFDBFE' },
  { emoji: '\uD83D\uDCB0', label: 'Economy', bg: '#FFF7ED', border: '#FED7AA' },
  { emoji: '\uD83C\uDF0D', label: 'IR', bg: '#DBEAFE', border: '#BFDBFE' },
  { emoji: '\uD83C\uDF0E', label: 'Environment', bg: '#F0FDF4', border: '#BBF7D0' },
  { emoji: '\uD83D\uDCBB', label: 'Tech', bg: '#DBEAFE', border: '#BFDBFE' },
  { emoji: '\uD83C\uDFDB', label: 'Polity', bg: '#F3E8FF', border: '#DDD6FE' },
];

const learningStats = [
  { icon: '\u2611\uFE0F', label: 'Editorials read', value: '142 / 210', color: '#047857' },
  { icon: '\uD83D\uDD52', label: 'Total reading time', value: '28.5 hrs', color: '#1D4ED8' },
  { icon: '\u2705', label: "This week's target", value: '78%', color: '#16A34A' },
  { icon: '\uD83C\uDFC5', label: 'Longest streak', value: '21 days', color: '#7C3AED' },
];

/* ------------------------------------------------------------------ */
/*  Calendar helper                                                    */
/* ------------------------------------------------------------------ */
function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function DailyEditorialPage() {
  const [activeNewspaper, setActiveNewspaper] = useState<'hindu' | 'express'>('hindu');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [calMonth, setCalMonth] = useState(1); // Feb = 1 (0-indexed)
  const [calYear, setCalYear] = useState(2026);

  const calDays = getCalendarDays(calYear, calMonth);
  const today = 12; // highlight the 12th
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };

  return (
    <div
      className="font-arimo w-full min-h-screen"
      style={{ background: '#F9FAFB' }}
    >
      {/* ============================================================ */}
      {/*  BACK TO DASHBOARD BUTTON                                     */}
      {/* ============================================================ */}
      <div style={{ padding: 'clamp(12px, 1.27vw, 17px) clamp(20px, 2.25vw, 30px)' }}>
        <Link href="/dashboard">
          <button
            className="flex items-center gap-2 font-arimo font-semibold"
            style={{
              width: 'clamp(180px, 17.73vw, 237px)',
              height: 'clamp(40px, 3.81vw, 51px)',
              borderRadius: '20px',
              background: 'rgba(255,255,255,0.05)',
              boxShadow: '0px 4px 4px 0px rgba(0,0,0,0.25)',
              border: '1px solid #E5E7EB',
              padding: '0 clamp(14px, 1.5vw, 20px)',
              fontSize: 'clamp(13px, 1.05vw, 14px)',
              color: '#17223E',
              backgroundColor: '#FFFFFF',
            }}
          >
            {/* Arrow left */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#17223E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to dashboard
          </button>
        </Link>
      </div>

      {/* ============================================================ */}
      {/*  HERO SECTION                                                 */}
      {/* ============================================================ */}
      <div className="flex flex-col items-center" style={{ paddingTop: 'clamp(8px, 1vw, 16px)', paddingBottom: 'clamp(24px, 2.5vw, 40px)' }}>
        {/* Tag pill */}
        <div
          className="flex items-center gap-2 font-arimo font-semibold text-white"
          style={{
            background: '#101828',
            borderRadius: '26843500px',
            padding: 'clamp(6px, 0.6vw, 8px) clamp(14px, 1.5vw, 20px)',
            fontSize: 'clamp(11px, 0.9vw, 13px)',
            letterSpacing: '0.5px',
            marginBottom: 'clamp(14px, 1.5vw, 20px)',
          }}
        >
          {/* Sparkle icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" fill="#FFD273" stroke="#FFD273" strokeWidth="1"/>
          </svg>
          DAILY NEWS ANALYSIS
        </div>

        {/* Main heading */}
        <h1
          className="font-tinos italic text-center"
          style={{
            fontSize: 'clamp(32px, 3.59vw, 48px)',
            lineHeight: 'clamp(36px, 3.59vw, 48px)',
            color: '#17223E',
            marginBottom: 'clamp(10px, 1vw, 16px)',
          }}
        >
          Where{' '}
          <span style={{ color: '#FFD273' }}>news</span>{' '}
          meets
          <br />
          the{' '}
          <span style={{ color: '#FFD273' }}>syllabus</span>
        </h1>

        {/* Description */}
        <p
          className="font-arimo text-center"
          style={{
            fontSize: 'clamp(14px, 1.35vw, 18px)',
            lineHeight: 'clamp(22px, 2.1vw, 28px)',
            color: '#4A5565',
            maxWidth: '524px',
          }}
        >
          Every editorial, every perspective &mdash; mapped to what UPSC asks.
        </p>
      </div>

      {/* ============================================================ */}
      {/*  MAIN TWO-COLUMN LAYOUT                                      */}
      {/* ============================================================ */}
      <div
        className="w-full mx-auto"
        style={{
          maxWidth: 'clamp(960px, 75vw, 1020px)',
          padding: '0 clamp(16px, 2vw, 30px)',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) clamp(260px, 23.05vw, 308px)',
          gap: 'clamp(16px, 2vw, 28px)',
          paddingBottom: 'clamp(40px, 5vw, 80px)',
        }}
      >
        {/* ========================================================== */}
        {/*  LEFT COLUMN — News Cards                                   */}
        {/* ========================================================== */}
        <div>
          {/* Top controls row */}
          <div className="flex items-center justify-between" style={{ marginBottom: 'clamp(12px, 1.2vw, 16px)' }}>
            {/* Newspaper toggles */}
            <div className="flex items-center" style={{ gap: 'clamp(6px, 0.6vw, 8px)' }}>
              <button
                onClick={() => setActiveNewspaper('hindu')}
                className="flex items-center gap-2 font-fahkwang"
                style={{
                  height: 'clamp(32px, 2.77vw, 37px)',
                  padding: '0 clamp(12px, 1.2vw, 16px)',
                  borderRadius: '20px',
                  border: '0.8px solid #E5E7EB',
                  background: activeNewspaper === 'hindu' ? '#101828' : '#FFFFFF',
                  color: activeNewspaper === 'hindu' ? '#FFFFFF' : '#101828',
                  fontSize: 'clamp(12px, 1.05vw, 14px)',
                  fontWeight: 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Hindu icon placeholder */}
                <span style={{ fontSize: 'clamp(14px, 1.2vw, 16px)' }}>&#x1F4F0;</span>
                The Hindu
              </button>

              <button
                onClick={() => setActiveNewspaper('express')}
                className="flex items-center gap-2 font-fahkwang"
                style={{
                  height: 'clamp(32px, 2.77vw, 37px)',
                  padding: '0 clamp(12px, 1.2vw, 16px)',
                  borderRadius: '20px',
                  border: '0.8px solid #E5E7EB',
                  background: activeNewspaper === 'express' ? '#101828' : '#FFFFFF',
                  color: activeNewspaper === 'express' ? '#FFFFFF' : '#101828',
                  fontSize: 'clamp(12px, 1.05vw, 14px)',
                  fontWeight: 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ fontSize: 'clamp(14px, 1.2vw, 16px)' }}>&#x1F4D1;</span>
                Indian Express
              </button>
            </div>

            {/* View mode toggles */}
            <div className="flex items-center" style={{ gap: '0' }}>
              <button
                onClick={() => setViewMode('list')}
                className="flex items-center gap-2 font-arimo font-medium"
                style={{
                  height: 'clamp(30px, 2.69vw, 36px)',
                  padding: '0 clamp(10px, 1.1vw, 14px)',
                  borderRadius: '10px',
                  background: viewMode === 'list' ? '#162456' : '#F3F4F6',
                  color: viewMode === 'list' ? '#FFFFFF' : '#4A5565',
                  fontSize: 'clamp(12px, 1.05vw, 14px)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* List icon */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M8 6H21M8 12H21M8 18H21M3 6H3.01M3 12H3.01M3 18H3.01" stroke={viewMode === 'list' ? '#FFFFFF' : '#4A5565'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                List View
              </button>

              <button
                onClick={() => setViewMode('grid')}
                className="flex items-center gap-2 font-arimo font-medium"
                style={{
                  height: 'clamp(30px, 2.69vw, 36px)',
                  padding: '0 clamp(10px, 1.1vw, 14px)',
                  borderRadius: '10px',
                  background: viewMode === 'grid' ? '#162456' : '#F3F4F6',
                  color: viewMode === 'grid' ? '#FFFFFF' : '#4A5565',
                  fontSize: 'clamp(12px, 1.05vw, 14px)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Grid View
              </button>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderBottom: '1px solid #D1D5DC', marginBottom: 'clamp(14px, 1.5vw, 20px)' }} />

          {/* News cards */}
          <div className="flex flex-col" style={{ gap: 'clamp(14px, 1.5vw, 20px)' }}>
            {newsCards.map((card) => (
              <div
                key={card.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '14px',
                  padding: 'clamp(18px, 2vw, 28px)',
                  boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)',
                }}
              >
                {/* Tags row + read time */}
                <div className="flex items-center justify-between" style={{ marginBottom: 'clamp(8px, 0.9vw, 12px)' }}>
                  <div className="flex items-center flex-wrap" style={{ gap: 'clamp(6px, 0.6vw, 8px)' }}>
                    {card.tags.map((tag) => (
                      <span
                        key={tag.label}
                        className="font-arimo font-medium"
                        style={{
                          fontSize: 'clamp(11px, 0.9vw, 13px)',
                          lineHeight: '1',
                          padding: 'clamp(4px, 0.45vw, 6px) clamp(8px, 0.9vw, 12px)',
                          borderRadius: '6px',
                          background: tag.bg,
                          color: tag.color,
                        }}
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>
                  <div
                    className="flex items-center gap-1 font-arimo shrink-0"
                    style={{ color: '#6A7282', fontSize: 'clamp(12px, 0.97vw, 13px)' }}
                  >
                    {/* Clock icon */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="#6A7282" strokeWidth="1.5"/>
                      <path d="M12 6V12L16 14" stroke="#6A7282" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    {card.readTime} min
                  </div>
                </div>

                {/* Title */}
                <h3
                  className="font-arimo font-bold"
                  style={{
                    fontSize: 'clamp(16px, 1.5vw, 20px)',
                    lineHeight: 'clamp(22px, 2.06vw, 27.5px)',
                    color: '#101828',
                    marginBottom: 'clamp(6px, 0.75vw, 10px)',
                  }}
                >
                  {card.title}
                </h3>

                {/* Description */}
                <p
                  className="font-arimo"
                  style={{
                    fontSize: 'clamp(12px, 1.05vw, 14px)',
                    lineHeight: 'clamp(18px, 1.7vw, 22.75px)',
                    color: '#4A5565',
                    marginBottom: 'clamp(10px, 1.2vw, 16px)',
                  }}
                >
                  {card.description}
                </p>

                {/* Divider */}
                <div style={{ borderBottom: '1px solid #D1D5DC', marginBottom: 'clamp(10px, 1.2vw, 16px)' }} />

                {/* Action buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center" style={{ gap: 'clamp(6px, 0.75vw, 10px)' }}>
                    {/* Save button */}
                    <button
                      className="flex items-center gap-2 font-arimo"
                      style={{
                        padding: 'clamp(6px, 0.75vw, 10px) clamp(12px, 1.2vw, 16px)',
                        borderRadius: '26843500px',
                        border: '0.8px solid #DBEAFE',
                        background: '#EFF6FF',
                        color: '#1C398E',
                        fontSize: 'clamp(12px, 1.05vw, 14px)',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>&#x1F4CC;</span>
                      Save
                    </button>

                    {/* Mark read button */}
                    <button
                      className="flex items-center gap-2 font-arimo"
                      style={{
                        padding: 'clamp(6px, 0.75vw, 10px) clamp(12px, 1.2vw, 16px)',
                        borderRadius: '26843500px',
                        border: '0.8px solid #DBEAFE',
                        background: '#EFF6FF',
                        color: '#1C398E',
                        fontSize: 'clamp(12px, 1.05vw, 14px)',
                        cursor: 'pointer',
                      }}
                    >
                      {/* Circle icon */}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="#1C398E" strokeWidth="1.5"/>
                      </svg>
                      Mark read
                    </button>
                  </div>

                  {/* Summarize button */}
                  <button
                    className="flex items-center gap-2 font-arimo font-bold"
                    style={{
                      padding: 'clamp(8px, 0.75vw, 10px) clamp(14px, 1.5vw, 20px)',
                      borderRadius: '26843500px',
                      background: '#162456',
                      color: '#FFD272',
                      fontSize: 'clamp(12px, 1.05vw, 14px)',
                      cursor: 'pointer',
                    }}
                  >
                    {/* Sparkle */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" fill="#FFD272" stroke="#FFD272" strokeWidth="1"/>
                    </svg>
                    Summarize with Jeet AI
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================== */}
        {/*  RIGHT COLUMN — Sidebar Widgets                             */}
        {/* ========================================================== */}
        <div className="flex flex-col" style={{ gap: 'clamp(14px, 1.5vw, 20px)' }}>
          {/* -------------------------------------------------------- */}
          {/*  Calendar Widget                                          */}
          {/* -------------------------------------------------------- */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '0.8px solid #E5E7EB',
              padding: 'clamp(14px, 1.5vw, 20px)',
              boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)',
            }}
          >
            {/* Calendar header */}
            <div className="flex items-center justify-between" style={{ marginBottom: 'clamp(10px, 1vw, 14px)' }}>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '16px' }}>&#x1F4C5;</span>
                <span className="font-arimo font-bold" style={{ fontSize: 'clamp(13px, 1.12vw, 15px)', color: '#101828' }}>
                  {monthNames[calMonth]} {calYear === 2024 ? '2024' : calYear.toString()}
                </span>
              </div>
              <span
                className="font-arimo font-medium"
                style={{
                  fontSize: 'clamp(11px, 0.9vw, 12px)',
                  background: '#FFF7ED',
                  color: '#101828',
                  padding: '3px 10px',
                  borderRadius: '26843500px',
                }}
              >
                {today} {monthNames[calMonth]}
              </span>
            </div>

            {/* Month navigation */}
            <div className="flex items-center justify-between" style={{ marginBottom: 'clamp(8px, 0.75vw, 10px)' }}>
              <button onClick={prevMonth} className="text-gray-400 hover:text-gray-600 cursor-pointer" style={{ fontSize: '18px' }}>&lt;</button>
              <span className="font-arimo font-bold" style={{ fontSize: 'clamp(12px, 1.05vw, 14px)', color: '#101828' }}>
                {monthNames[calMonth]} {calYear}
              </span>
              <button onClick={nextMonth} className="text-gray-400 hover:text-gray-600 cursor-pointer" style={{ fontSize: '18px' }}>&gt;</button>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 text-center" style={{ marginBottom: 'clamp(4px, 0.5vw, 6px)' }}>
              {dayLabels.map((d) => (
                <span key={d} className="font-arimo font-medium" style={{ fontSize: 'clamp(10px, 0.82vw, 11px)', color: '#6A7282', padding: '4px 0' }}>
                  {d}
                </span>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 text-center">
              {calDays.map((day, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-center font-arimo"
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    maxHeight: '36px',
                    fontSize: 'clamp(11px, 0.9vw, 13px)',
                    borderRadius: day === today ? '50%' : '0',
                    background: day === today ? '#101828' : 'transparent',
                    color: day === today ? '#FFFFFF' : day ? '#364153' : 'transparent',
                    fontWeight: day === today ? 700 : 400,
                    cursor: day ? 'pointer' : 'default',
                  }}
                >
                  {day ?? ''}
                </div>
              ))}
            </div>
          </div>

          {/* -------------------------------------------------------- */}
          {/*  Filter by Subject                                        */}
          {/* -------------------------------------------------------- */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '0.8px solid #E5E7EB',
              padding: 'clamp(16px, 1.86vw, 24.8px)',
              boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)',
            }}
          >
            <div className="flex items-center gap-2" style={{ marginBottom: 'clamp(12px, 1.2vw, 16px)' }}>
              <span style={{ fontSize: '16px' }}>&#x1F50D;</span>
              <span className="font-arimo font-bold" style={{ fontSize: 'clamp(12px, 1.05vw, 14px)', color: '#101828', letterSpacing: '0.5px' }}>
                FILTER BY SUBJECT
              </span>
            </div>
            <div className="grid grid-cols-2" style={{ gap: 'clamp(8px, 0.9vw, 12px)' }}>
              {subjects.map((s) => (
                <button
                  key={s.label}
                  className="flex items-center gap-2 font-arimo font-medium"
                  style={{
                    padding: 'clamp(8px, 0.9vw, 12px) clamp(10px, 1.1vw, 14px)',
                    borderRadius: '12px',
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                    color: '#101828',
                    fontSize: 'clamp(12px, 1.05vw, 14px)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span>{s.emoji}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* -------------------------------------------------------- */}
          {/*  Today at a Glance                                        */}
          {/* -------------------------------------------------------- */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '0.8px solid #E5E7EB',
              padding: 'clamp(16px, 1.86vw, 24px)',
              boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)',
            }}
          >
            <div className="flex items-center gap-2" style={{ marginBottom: 'clamp(12px, 1.5vw, 20px)' }}>
              <span style={{ fontSize: '16px' }}>&#x1F4CA;</span>
              <span className="font-arimo font-bold" style={{ fontSize: 'clamp(14px, 1.2vw, 16px)', color: '#101828' }}>
                Today at a Glance
              </span>
            </div>

            {/* 2x2 stats grid */}
            <div className="grid grid-cols-2" style={{ gap: 'clamp(8px, 0.9vw, 12px)', marginBottom: 'clamp(12px, 1.5vw, 20px)' }}>
              {[
                { num: '8', label: 'The Hindu' },
                { num: '6', label: 'Indian Express' },
                { num: '4', label: 'Read so far' },
                { num: '2', label: 'AI Summaries' },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: '#EFF6FF',
                    borderRadius: '12px',
                    padding: 'clamp(10px, 1.2vw, 16px)',
                  }}
                >
                  <div className="font-arimo font-bold" style={{ fontSize: 'clamp(22px, 2.25vw, 30px)', color: '#101828' }}>
                    {item.num}
                  </div>
                  <div className="font-arimo" style={{ fontSize: 'clamp(11px, 0.9vw, 13px)', color: '#4A5565' }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Reading progress circle */}
            <div
              className="flex flex-col items-center"
              style={{
                background: '#EFF6FF',
                borderRadius: '12px',
                padding: 'clamp(14px, 1.5vw, 20px)',
              }}
            >
              {/* SVG circular progress */}
              <div style={{ position: 'relative', width: '60px', height: '60px', marginBottom: '8px' }}>
                <svg width="60" height="60" viewBox="0 0 60 60">
                  <circle cx="30" cy="30" r="26" fill="none" stroke="#E5E7EB" strokeWidth="4"/>
                  <circle
                    cx="30" cy="30" r="26"
                    fill="none" stroke="#16A34A" strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 26 * 0.29} ${2 * Math.PI * 26 * 0.71}`}
                    transform="rotate(-90 30 30)"
                  />
                </svg>
                <div
                  className="absolute inset-0 flex items-center justify-center font-arimo font-bold"
                  style={{ fontSize: '11px', color: '#101828' }}
                >
                  29%
                </div>
              </div>
              <span className="font-arimo font-bold" style={{ fontSize: 'clamp(13px, 1.12vw, 15px)', color: '#101828' }}>
                Reading complete
              </span>
              <span className="font-arimo" style={{ fontSize: 'clamp(11px, 0.9vw, 13px)', color: '#4A5565' }}>
                4 / 14 articles
              </span>
            </div>
          </div>

          {/* -------------------------------------------------------- */}
          {/*  14-Day Streak                                            */}
          {/* -------------------------------------------------------- */}
          <div
            style={{
              background: '#0E182D',
              borderRadius: '16px',
              border: '1.6px solid #193CB8',
              padding: 'clamp(16px, 1.86vw, 24px)',
              boxShadow: '0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px -4px rgba(0,0,0,0.1)',
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-2" style={{ marginBottom: 'clamp(6px, 0.6vw, 8px)' }}>
              <span style={{ fontSize: '20px' }}>&#x1F525;</span>
              <span className="font-arimo font-bold" style={{ fontSize: 'clamp(16px, 1.5vw, 20px)', color: '#FFD273' }}>
                14-Day Streak
              </span>
            </div>

            <p className="font-arimo" style={{ fontSize: 'clamp(12px, 1.05vw, 14px)', color: '#9CA3AF', marginBottom: 'clamp(12px, 1.2vw, 16px)' }}>
              Keep it up! Read 3 today
            </p>

            {/* Check boxes row */}
            <div className="flex items-center" style={{ gap: 'clamp(6px, 0.6vw, 8px)', marginBottom: 'clamp(10px, 1vw, 14px)' }}>
              {[true, true, true, false, false, false, false].map((checked, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center"
                  style={{
                    width: 'clamp(32px, 3vw, 40px)',
                    height: 'clamp(32px, 3vw, 40px)',
                    borderRadius: 'clamp(6px, 0.6vw, 8px)',
                    background: checked ? '#FFD273' : 'rgba(255,255,255,0.08)',
                    border: checked ? 'none' : '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  {checked && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12L10 17L19 6" stroke="#0E182D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              ))}
            </div>

            <p className="font-arimo" style={{ fontSize: 'clamp(11px, 0.9vw, 13px)', color: '#6B7280' }}>
              3 of 7 articles read today
            </p>
          </div>

          {/* -------------------------------------------------------- */}
          {/*  Your Learning Streak                                     */}
          {/* -------------------------------------------------------- */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: 'clamp(16px, 1.8vw, 24px)',
              boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)',
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-2" style={{ marginBottom: 'clamp(12px, 1.2vw, 16px)' }}>
              <span style={{ fontSize: '16px', color: '#DC2626' }}>&#x1F4C8;</span>
              <span className="font-arimo font-bold" style={{ fontSize: 'clamp(14px, 1.2vw, 16px)', color: '#101828' }}>
                Your Learning Streak
              </span>
            </div>

            {/* Streak banner */}
            <div
              className="flex items-center justify-between"
              style={{
                background: 'linear-gradient(90deg, #FF6900 0%, #FB2C36 100%)',
                borderRadius: '12px',
                padding: 'clamp(12px, 1.2vw, 16px) clamp(14px, 1.5vw, 20px)',
                marginBottom: 'clamp(14px, 1.5vw, 20px)',
              }}
            >
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '20px' }}>&#x1F525;</span>
                <span className="font-arimo font-bold" style={{ fontSize: 'clamp(20px, 1.95vw, 26px)', color: '#FFFFFF' }}>
                  12 days
                </span>
                <span className="font-arimo" style={{ fontSize: 'clamp(12px, 1.05vw, 14px)', color: 'rgba(255,255,255,0.8)' }}>
                  &middot; current streak
                </span>
              </div>
              <span style={{ fontSize: '20px' }}>&#x1F525;</span>
            </div>

            {/* Stats list */}
            <div className="flex flex-col" style={{ gap: 'clamp(10px, 1.1vw, 14px)', marginBottom: 'clamp(14px, 1.5vw, 20px)' }}>
              {learningStats.map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '14px' }}>{stat.icon}</span>
                    <span className="font-arimo" style={{ fontSize: 'clamp(12px, 1.05vw, 14px)', color: '#4A5565' }}>
                      {stat.label}
                    </span>
                  </div>
                  <span className="font-arimo font-bold" style={{ fontSize: 'clamp(12px, 1.05vw, 14px)', color: '#101828' }}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ borderBottom: '1px solid #E5E7EB', marginBottom: 'clamp(10px, 1.1vw, 14px)' }} />

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '14px' }}>&#x1F4C5;</span>
                <span className="font-arimo" style={{ fontSize: 'clamp(12px, 1.05vw, 14px)', color: '#4A5565' }}>
                  Next: 16 Oct
                </span>
              </div>
              <span className="font-arimo font-bold" style={{ fontSize: 'clamp(12px, 1.05vw, 14px)', color: '#DC2626' }}>
                +3 articles
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
