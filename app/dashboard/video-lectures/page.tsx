'use client';

import React, { useState } from 'react';
import Link from 'next/link';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const categories = [
  'All Categories',
  'Polity',
  'History',
  'Geography',
  'Economy',
  'Environment',
  'Science & Tech',
  'Ethics',
  'IR',
  'Art & Culture',
  'Current Affairs',
];

const subjectCards = [
  { name: 'Indian Polity', emoji: '\uD83C\uDFDB\uFE0F', videos: 81, views: '312K' },
  { name: 'Modern History', emoji: '\uD83D\uDCDC', videos: 64, views: '287K' },
  { name: 'Geography', emoji: '\uD83C\uDF0D', videos: 72, views: '245K' },
  { name: 'Indian Economy', emoji: '\uD83D\uDCCA', videos: 58, views: '198K' },
  { name: 'Environment', emoji: '\uD83C\uDF3F', videos: 45, views: '176K' },
  { name: 'Science & Tech', emoji: '\uD83D\uDD2C', videos: 39, views: '154K' },
  { name: 'Ancient History', emoji: '\uD83C\uDFFA', videos: 36, views: '142K' },
  { name: 'Ethics GSA', emoji: '\u2696\uFE0F', videos: 42, views: '168K' },
  { name: 'International Relations', emoji: '\uD83C\uDF10', videos: 33, views: '129K' },
  { name: 'Art & Culture', emoji: '\uD83C\uDFA8', videos: 28, views: '115K' },
  { name: 'Internal Security', emoji: '\uD83D\uDEE1\uFE0F', videos: 24, views: '98K' },
  { name: 'Essay & Answer Writing', emoji: '\u270D\uFE0F', videos: 31, views: '186K' },
];

const polityVideos = [
  {
    id: 1,
    title: 'Introduction to Indian Constitution',
    category: 'INDIAN POLITY',
    categoryColor: '#1E40AF',
    views: '3.2L',
    date: '2 days ago',
    hot: true,
  },
  {
    id: 2,
    title: 'Parliament — Structure & Functions',
    category: 'INDIAN POLITY',
    categoryColor: '#1E40AF',
    views: '2.8L',
    date: '5 days ago',
    hot: true,
  },
  {
    id: 3,
    title: 'Judiciary — Supreme Court & High Courts',
    category: 'INDIAN POLITY',
    categoryColor: '#1E40AF',
    views: '2.1L',
    date: '1 week ago',
    hot: false,
  },
];

const stats = [
  { number: '500', suffix: '+', label: 'Free Lectures' },
  { number: '12', suffix: '+', label: 'Core Subjects' },
  { number: '1L', suffix: '+', label: 'Subscribers' },
  { number: '\u221E', suffix: '', label: 'Always Free' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function VideoLecturesPage() {
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#17223E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to dashboard
          </button>
        </Link>
      </div>

      {/* Centered content wrapper — Section 1 */}
      <div
        className="w-full mx-auto"
        style={{
          maxWidth: 'clamp(960px, 75vw, 1200px)',
          padding: '0 clamp(16px, 2vw, 30px)',
        }}
      >
        {/* ============================================================ */}
        {/*  SECTION 1: HERO                                              */}
        {/* ============================================================ */}
        <div className="flex flex-col items-center" style={{ paddingTop: 'clamp(8px, 1vw, 16px)', paddingBottom: 'clamp(24px, 2.5vw, 40px)' }}>
          {/* @RiseWithJeet button - top right */}
          <div className="w-full flex justify-end" style={{ marginBottom: 'clamp(16px, 1.5vw, 24px)' }}>
            <a
              href="https://www.youtube.com/@RiseWithJeet"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 font-arimo font-semibold text-white"
              style={{
                background: '#17223E',
                borderRadius: '26843500px',
                padding: 'clamp(8px, 0.75vw, 10px) clamp(16px, 1.5vw, 20px)',
                fontSize: 'clamp(12px, 1.05vw, 14px)',
              }}
            >
              {/* YouTube icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43z" fill="#FF0000"/>
                <path d="M9.75 15.02l5.75-3.27-5.75-3.27v6.54z" fill="white"/>
              </svg>
              @RiseWithJeet
            </a>
          </div>

          {/* Badge pill */}
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" fill="#FFD273" stroke="#FFD273" strokeWidth="1"/>
            </svg>
            India&apos;s Most Comprehensive UPSC Platform
          </div>

          {/* Main heading */}
          <h1
            className="font-arimo font-bold text-center"
            style={{
              fontSize: 'clamp(32px, 3.59vw, 48px)',
              lineHeight: 'clamp(38px, 4.2vw, 56px)',
              color: '#17223E',
              marginBottom: 'clamp(10px, 1vw, 16px)',
            }}
          >
            Master Your{' '}
            <span className="font-tinos italic" style={{ color: '#C68A0B' }}>UPSC Journey</span>
            <br />
            with Expert Video Lectures
          </h1>

          {/* Description */}
          <p
            className="font-arimo text-center"
            style={{
              fontSize: 'clamp(14px, 1.35vw, 18px)',
              lineHeight: 'clamp(22px, 2.1vw, 28px)',
              color: '#4A5565',
              maxWidth: '524px',
              marginBottom: 'clamp(20px, 2vw, 28px)',
            }}
          >
            Every editorial, every perspective &mdash; mapped to what UPSC asks.
          </p>

          {/* Start Learning button */}
          <button
            className="flex items-center gap-2 font-arimo font-bold"
            style={{
              background: '#FDC700',
              color: '#17223E',
              borderRadius: '30px',
              padding: 'clamp(12px, 1.2vw, 16px) clamp(28px, 2.5vw, 36px)',
              fontSize: 'clamp(14px, 1.2vw, 16px)',
              cursor: 'pointer',
              border: 'none',
              marginBottom: 'clamp(28px, 3vw, 40px)',
            }}
          >
            {/* Play icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 3L19 12L5 21V3Z" fill="#17223E"/>
            </svg>
            Start Learning
          </button>

          {/* Stats card */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              padding: 'clamp(20px, 2vw, 28px) clamp(28px, 3vw, 44px)',
              boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)',
              width: '100%',
              maxWidth: '720px',
            }}
          >
            <div className="flex items-center justify-between">
              {stats.map((stat, idx) => (
                <React.Fragment key={stat.label}>
                  <div className="flex flex-col items-center" style={{ flex: 1 }}>
                    <div className="font-arimo font-bold" style={{ fontSize: 'clamp(24px, 2.5vw, 34px)', color: '#162456', lineHeight: 1.2 }}>
                      {stat.number}
                      {stat.suffix && <span style={{ color: '#DBAC49' }}>{stat.suffix}</span>}
                    </div>
                    <div className="font-arimo" style={{ fontSize: 'clamp(11px, 0.9vw, 13px)', color: '#6A7282', marginTop: '4px' }}>
                      {stat.label}
                    </div>
                  </div>
                  {idx < stats.length - 1 && (
                    <div style={{ width: '1px', height: 'clamp(32px, 3vw, 44px)', background: '#E5E7EB' }} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/*  SECTION 2: CATEGORY FILTER BAR — full viewport width         */}
      {/* ============================================================ */}
      <div
        style={{
          background: '#F9FAFB',
          borderTop: '1px solid #E5E7EB',
          borderBottom: '1px solid #E5E7EB',
          padding: 'clamp(12px, 1.2vw, 16px) 0',
          marginBottom: 'clamp(40px, 4vw, 60px)',
        }}
      >
        <div
          className="flex items-center gap-2"
          style={{
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            padding: '0 clamp(16px, 2vw, 30px)',
            justifyContent: 'center',
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="font-arimo font-bold whitespace-nowrap"
              style={{
                padding: 'clamp(8px, 0.75vw, 10px) clamp(16px, 1.5vw, 20px)',
                borderRadius: '26843500px',
                background: selectedCategory === cat ? '#162456' : '#F3F4F6',
                color: selectedCategory === cat ? '#FFFFFF' : '#364153',
                fontSize: 'clamp(12px, 1.05vw, 14px)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Centered content wrapper — Sections 3–6 */}
      <div
        className="w-full mx-auto"
        style={{
          maxWidth: 'clamp(960px, 75vw, 1200px)',
          padding: '0 clamp(16px, 2vw, 30px)',
          paddingBottom: 'clamp(60px, 6vw, 100px)',
        }}
      >
        {/* ============================================================ */}
        {/*  SECTION 3: BROWSE BY SUBJECT                                  */}
        {/* ============================================================ */}
        <div style={{ marginBottom: 'clamp(40px, 4vw, 60px)' }}>
          {/* Super heading */}
          <div
            className="font-arimo font-bold"
            style={{
              color: '#FDC700',
              fontSize: 'clamp(12px, 1.05vw, 14px)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: 'clamp(6px, 0.6vw, 8px)',
              textAlign: 'center',
            }}
          >
            BROWSE BY SUBJECT
          </div>

          {/* Heading */}
          <h2
            className="font-arimo font-bold"
            style={{
              fontSize: 'clamp(24px, 2.5vw, 34px)',
              color: '#17223E',
              marginBottom: 'clamp(24px, 2.5vw, 36px)',
              lineHeight: 1.3,
              textAlign: 'center',
            }}
          >
            Pick Your Subject,{' '}
            <span className="font-tinos italic" style={{ color: '#FDC700' }}>Start Learning.</span>
          </h2>

          {/* 4x3 subject grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 'clamp(14px, 1.5vw, 20px)',
            }}
          >
            {subjectCards.map((subject) => (
              <div
                key={subject.name}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '14px',
                  padding: 'clamp(18px, 2vw, 24px)',
                  boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Emoji icon */}
                <div style={{ fontSize: 'clamp(28px, 3vw, 38px)', marginBottom: 'clamp(10px, 1vw, 14px)' }}>
                  {subject.emoji}
                </div>

                {/* Subject name */}
                <div
                  className="font-arimo font-bold"
                  style={{
                    fontSize: 'clamp(14px, 1.2vw, 16px)',
                    color: '#17223E',
                    marginBottom: 'clamp(4px, 0.4vw, 6px)',
                  }}
                >
                  {subject.name}
                </div>

                {/* Stats */}
                <div
                  className="font-arimo"
                  style={{
                    fontSize: 'clamp(10px, 0.9vw, 12px)',
                    color: '#364153',
                  }}
                >
                  {subject.videos} videos &middot; {subject.views} Views
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================================ */}
        {/*  SECTION 4: YOUTUBE CTA BANNER                                */}
        {/* ============================================================ */}
        <div style={{ marginBottom: 'clamp(40px, 4vw, 60px)' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #0E182D, #172240)',
              borderRadius: '24px',
              padding: 'clamp(32px, 3.5vw, 48px) clamp(32px, 3.5vw, 48px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'clamp(24px, 3vw, 40px)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Left content */}
            <div style={{ flex: 1, zIndex: 1 }}>
              <h3
                className="font-tinos font-bold"
                style={{
                  fontSize: 'clamp(28px, 2.7vw, 36px)',
                  lineHeight: 1.2,
                  color: '#FFFFFF',
                  marginBottom: 'clamp(4px, 0.4vw, 6px)',
                }}
              >
                Never Miss a{' '}
                <span style={{ color: '#F0B100' }}>Lecture Again.</span>
              </h3>

              <p
                className="font-tinos"
                style={{
                  fontSize: 'clamp(18px, 1.88vw, 25px)',
                  color: '#FFFFFF',
                  marginBottom: 'clamp(12px, 1.2vw, 16px)',
                }}
              >
                Stay Consistent. Stay Ahead.
              </p>

              <p
                className="font-arimo"
                style={{
                  fontSize: 'clamp(13px, 1.12vw, 15px)',
                  lineHeight: 'clamp(20px, 1.88vw, 25px)',
                  color: '#BEDBFF',
                  marginBottom: 'clamp(20px, 2vw, 28px)',
                  maxWidth: '480px',
                }}
              >
                Subscribe to our YouTube channel for daily UPSC video lectures, current affairs analysis, and exam strategy sessions &mdash; completely free, forever.
              </p>

              {/* YouTube button */}
              <a
                href="https://www.youtube.com/@RiseWithJeet"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-arimo font-bold text-white"
                style={{
                  background: '#E7000B',
                  borderRadius: '26843500px',
                  padding: 'clamp(12px, 1.2vw, 14px) clamp(24px, 2.25vw, 30px)',
                  fontSize: 'clamp(13px, 1.12vw, 15px)',
                  marginBottom: 'clamp(12px, 1.2vw, 16px)',
                }}
              >
                {/* YouTube icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43z" fill="#FFFFFF"/>
                  <path d="M9.75 15.02l5.75-3.27-5.75-3.27v6.54z" fill="#E7000B"/>
                </svg>
                Join Our YouTube Family
              </a>

              <p className="font-arimo" style={{ fontSize: 'clamp(12px, 1.05vw, 14px)', color: '#8EC5FF' }}>
                Join 140,000+ UPSC Aspirants Here
              </p>
            </div>

            {/* Right - Bell icon */}
            <div
              className="flex items-center justify-center"
              style={{
                width: 'clamp(100px, 10vw, 140px)',
                height: 'clamp(100px, 10vw, 140px)',
                borderRadius: '50%',
                background: 'rgba(25,60,184,0.3)',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 'clamp(48px, 5vw, 68px)' }}>{'\uD83D\uDD14'}</span>
            </div>
          </div>

          {/* @RiseWithJeet button below banner */}
          <div className="flex justify-end" style={{ marginTop: 'clamp(12px, 1.2vw, 16px)' }}>
            <a
              href="https://www.youtube.com/@RiseWithJeet"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 font-arimo font-semibold text-white"
              style={{
                background: '#17223E',
                borderRadius: '26843500px',
                padding: 'clamp(8px, 0.75vw, 10px) clamp(16px, 1.5vw, 20px)',
                fontSize: 'clamp(12px, 1.05vw, 14px)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43z" fill="#FF0000"/>
                <path d="M9.75 15.02l5.75-3.27-5.75-3.27v6.54z" fill="white"/>
              </svg>
              @RiseWithJeet
            </a>
          </div>
        </div>

        {/* ============================================================ */}
        {/*  SECTION 5: POLITY SIMPLIFIED (VIDEO LIST)                    */}
        {/* ============================================================ */}
        <div style={{ marginBottom: 'clamp(40px, 4vw, 60px)' }}>
          {/* Header */}
          <div style={{ marginBottom: 'clamp(6px, 0.6vw, 8px)' }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 'clamp(4px, 0.4vw, 6px)' }}>
              <span style={{ fontSize: 'clamp(22px, 2vw, 28px)' }}>{'\uD83C\uDFDB\uFE0F'}</span>
              <h2
                className="font-arimo font-bold"
                style={{
                  fontSize: 'clamp(20px, 1.88vw, 24px)',
                  color: '#101828',
                }}
              >
                Polity Simplified
              </h2>
            </div>
            <p className="font-arimo" style={{ fontSize: 'clamp(12px, 1.05vw, 14px)', color: '#4A5565', marginBottom: 'clamp(4px, 0.4vw, 6px)' }}>
              {'\uD83D\uDCFA'} 5 Videos &middot; 15h+ 45 min
            </p>
            <p className="font-arimo" style={{ fontSize: 'clamp(13px, 1.12vw, 15px)', color: '#4A5565', marginBottom: 'clamp(20px, 2vw, 28px)' }}>
              Complete Indian Polity &mdash; Constitution, Parliament, Judiciary, Centre-State Relations &amp; more.
            </p>
          </div>

          {/* Video cards row */}
          <div
            className="flex"
            style={{ gap: 'clamp(14px, 1.5vw, 20px)' }}
          >
            {polityVideos.map((video) => (
              <div
                key={video.id}
                style={{
                  flex: 1,
                  background: '#FFFFFF',
                  borderRadius: '14px',
                  boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                }}
              >
                {/* Image area */}
                <div
                  className="flex items-center justify-center"
                  style={{
                    background: '#EFF6FF',
                    height: 'clamp(140px, 13vw, 180px)',
                    position: 'relative',
                  }}
                >
                  <span style={{ fontSize: 'clamp(40px, 4vw, 56px)' }}>{'\uD83C\uDFDB\uFE0F'}</span>

                  {/* HOT badge */}
                  {video.hot && (
                    <div
                      className="flex items-center gap-1 font-arimo font-bold"
                      style={{
                        position: 'absolute',
                        top: 'clamp(8px, 0.75vw, 12px)',
                        left: 'clamp(8px, 0.75vw, 12px)',
                        background: '#17223E',
                        color: '#FFFFFF',
                        borderRadius: '26843500px',
                        padding: '4px 10px',
                        fontSize: 'clamp(10px, 0.82vw, 12px)',
                      }}
                    >
                      {'\uD83D\uDD25'} HOT
                    </div>
                  )}
                </div>

                {/* Card content */}
                <div style={{ padding: 'clamp(14px, 1.5vw, 20px)' }}>
                  {/* Category label */}
                  <div
                    className="font-arimo font-bold"
                    style={{
                      fontSize: 'clamp(10px, 0.82vw, 12px)',
                      color: video.categoryColor,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: 'clamp(6px, 0.6vw, 8px)',
                    }}
                  >
                    {video.category}
                  </div>

                  {/* Title */}
                  <h3
                    className="font-arimo font-bold"
                    style={{
                      fontSize: 'clamp(14px, 1.2vw, 16px)',
                      color: '#101828',
                      marginBottom: 'clamp(8px, 0.75vw, 10px)',
                      lineHeight: 1.3,
                    }}
                  >
                    {video.title}
                  </h3>

                  {/* Stats */}
                  <p
                    className="font-arimo"
                    style={{
                      fontSize: 'clamp(11px, 0.9vw, 13px)',
                      color: '#4A5565',
                      marginBottom: 'clamp(12px, 1.2vw, 16px)',
                    }}
                  >
                    {'\uD83D\uDC41\uFE0F'} {video.views} &middot; {'\uD83D\uDCC5'} {video.date}
                  </p>

                  {/* Action buttons */}
                  <div className="flex items-center" style={{ gap: 'clamp(6px, 0.6vw, 8px)' }}>
                    {/* PDF button */}
                    <button
                      className="flex items-center gap-1 font-arimo font-medium"
                      style={{
                        padding: 'clamp(6px, 0.6vw, 8px) clamp(10px, 1vw, 14px)',
                        borderRadius: '10px',
                        background: '#EFF6FF',
                        border: '1px solid #101828',
                        color: '#101828',
                        fontSize: 'clamp(11px, 0.9vw, 13px)',
                        cursor: 'pointer',
                      }}
                    >
                      {/* PDF icon */}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#101828" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#101828" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      PDF
                    </button>

                    {/* Ask Mentor button */}
                    <button
                      className="flex items-center gap-1 font-arimo font-medium"
                      style={{
                        padding: 'clamp(6px, 0.6vw, 8px) clamp(10px, 1vw, 14px)',
                        borderRadius: '10px',
                        background: '#EFF6FF',
                        border: '1px solid #101828',
                        color: '#101828',
                        fontSize: 'clamp(11px, 0.9vw, 13px)',
                        cursor: 'pointer',
                      }}
                    >
                      {/* Chat icon */}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="#101828" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Ask Mentor
                    </button>

                    {/* Watch button */}
                    <button
                      className="flex items-center gap-1 font-arimo font-bold text-white"
                      style={{
                        padding: 'clamp(6px, 0.6vw, 8px) clamp(10px, 1vw, 14px)',
                        borderRadius: '10px',
                        background: '#162456',
                        border: 'none',
                        fontSize: 'clamp(11px, 0.9vw, 13px)',
                        cursor: 'pointer',
                      }}
                    >
                      {/* YouTube play icon */}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43z" fill="#FFFFFF"/>
                        <path d="M9.75 15.02l5.75-3.27-5.75-3.27v6.54z" fill="#162456"/>
                      </svg>
                      Watch
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================================ */}
        {/*  SECTION 6: BOTTOM CARDS (LOGIN + ASK MENTOR)                  */}
        {/* ============================================================ */}
        <div
          className="flex"
          style={{
            gap: 'clamp(16px, 1.8vw, 24px)',
            alignItems: 'flex-start',
          }}
        >
          {/* ── Login to Download Card ── */}
          <div
            style={{
              flex: 1,
              background: '#FFFFFF',
              borderRadius: '24px',
              border: '1.6px solid #6A7282',
              padding: 'clamp(20px, 2.51vw, 33px)',
            }}
          >
            {/* Top row: emoji + close */}
            <div className="flex items-center justify-between" style={{ marginBottom: 'clamp(12px, 1.2vw, 16px)' }}>
              <span style={{ fontSize: 'clamp(28px, 2.8vw, 38px)' }}>📥</span>
              <button
                className="flex items-center justify-center"
                style={{
                  width: 'clamp(26px, 2.2vw, 30px)',
                  height: 'clamp(26px, 2.2vw, 30px)',
                  borderRadius: '50%',
                  background: '#F3F4F6',
                  border: 'none',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="#4A5565" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Heading */}
            <h3
              className="font-arimo font-bold"
              style={{ fontSize: 'clamp(20px, 2.09vw, 28px)', color: '#101828', lineHeight: 1.2, marginBottom: 'clamp(6px, 0.6vw, 8px)' }}
            >
              Login to Download
            </h3>

            <p className="font-arimo" style={{ fontSize: 'clamp(12px, 1.05vw, 14px)', color: '#4A5565', marginBottom: 'clamp(18px, 1.8vw, 24px)' }}>
              Please Sign-in to download <strong>Telegram Accts</strong>
            </p>

            {/* Email input */}
            <div style={{ marginBottom: 'clamp(10px, 1vw, 14px)' }}>
              <input
                type="email"
                placeholder="Email address"
                className="w-full font-arimo outline-none"
                style={{
                  height: 'clamp(44px, 4.12vw, 55px)',
                  borderRadius: '14px',
                  border: '1.6px solid #D1D5DC',
                  padding: '0 16px',
                  fontSize: 'clamp(13px, 1.12vw, 15px)',
                  color: '#0A0A0A',
                  background: '#FFFFFF',
                }}
              />
            </div>

            {/* Password input */}
            <div style={{ marginBottom: 'clamp(14px, 1.5vw, 18px)' }}>
              <input
                type="password"
                placeholder="Password"
                className="w-full font-arimo outline-none"
                style={{
                  height: 'clamp(44px, 4.12vw, 55px)',
                  borderRadius: '14px',
                  border: '1.6px solid #D1D5DC',
                  padding: '0 16px',
                  fontSize: 'clamp(13px, 1.12vw, 15px)',
                  color: '#0A0A0A',
                  background: '#FFFFFF',
                }}
              />
            </div>

            {/* Sign In & Download button */}
            <button
              className="w-full flex items-center justify-center gap-2 font-arimo font-bold text-white"
              style={{
                height: 'clamp(48px, 4.48vw, 60px)',
                borderRadius: '14px',
                background: '#162456',
                fontSize: 'clamp(13px, 1.12vw, 15px)',
                border: 'none',
                cursor: 'pointer',
                marginBottom: 'clamp(14px, 1.4vw, 18px)',
              }}
            >
              Sign In &amp; Download &rarr;
            </button>

            {/* Divider */}
            <div className="flex items-center" style={{ gap: 'clamp(10px, 1vw, 14px)', marginBottom: 'clamp(14px, 1.4vw, 18px)' }}>
              <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
              <span className="font-arimo" style={{ fontSize: 'clamp(12px, 1.05vw, 14px)', color: '#6A7282' }}>— or —</span>
              <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
            </div>

            {/* Continue with Google button */}
            <button
              className="w-full flex items-center justify-center gap-2 font-arimo font-semibold"
              style={{
                height: 'clamp(48px, 4.48vw, 60px)',
                borderRadius: '14px',
                border: '1.6px solid #D1D5DC',
                background: '#FFFFFF',
                color: '#101828',
                fontSize: 'clamp(13px, 1.12vw, 15px)',
                cursor: 'pointer',
                marginBottom: 'clamp(14px, 1.4vw, 18px)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Footer links */}
            <div className="flex items-center justify-between">
              <span className="font-arimo" style={{ fontSize: 'clamp(12px, 1.05vw, 14px)', color: '#1E40AF', cursor: 'pointer' }}>
                New? Create free account &rarr;
              </span>
              <span className="font-arimo" style={{ fontSize: 'clamp(12px, 1.05vw, 14px)', color: '#6A7282', cursor: 'pointer' }}>
                🌐 Forgot?
              </span>
            </div>
          </div>

          {/* ── Ask the Mentor Card (offset down) ── */}
          <div
            style={{
              flex: 1,
              background: '#FFFFFF',
              borderRadius: '24px',
              border: '1.6px solid #6A7282',
              padding: 'clamp(20px, 2.51vw, 33px)',
              marginTop: 'clamp(100px, 12.33vw, 165px)',
            }}
          >
            {/* Top row: emoji + close */}
            <div className="flex items-center justify-between" style={{ marginBottom: 'clamp(12px, 1.2vw, 16px)' }}>
              <span style={{ fontSize: 'clamp(28px, 2.8vw, 38px)' }}>{'\uD83E\uDD14'}</span>
              <button
                className="flex items-center justify-center"
                style={{
                  width: 'clamp(26px, 2.2vw, 30px)',
                  height: 'clamp(26px, 2.2vw, 30px)',
                  borderRadius: '50%',
                  background: '#F3F4F6',
                  border: 'none',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="#4A5565" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Heading */}
            <h3
              className="font-arimo font-bold"
              style={{ fontSize: 'clamp(20px, 2.09vw, 28px)', color: '#101828', lineHeight: 1.2, marginBottom: 'clamp(6px, 0.6vw, 8px)' }}
            >
              Ask the Mentor
            </h3>

            <p className="font-arimo" style={{ fontSize: 'clamp(12px, 1.05vw, 14px)', color: '#4A5565', marginBottom: 'clamp(18px, 1.8vw, 24px)', lineHeight: 1.5 }}>
              Have any doubt about <strong>Introduction to Indian Constitution I Historical Background</strong>...Jeet Sir responds within 24 hours.
            </p>

            {/* Your doubt or question */}
            <p className="font-arimo font-bold" style={{ fontSize: 'clamp(12px, 1.05vw, 14px)', color: '#101828', marginBottom: 'clamp(6px, 0.6vw, 8px)' }}>
              Your doubt or question
            </p>
            <textarea
              placeholder="e.g. At 18:32, I didn't understand why Article 370 had was mentioned u..."
              className="w-full font-arimo outline-none resize-none"
              style={{
                height: 'clamp(90px, 8.61vw, 115px)',
                borderRadius: '14px',
                border: '1.6px solid #D1D5DC',
                padding: '16px',
                fontSize: 'clamp(13px, 1.12vw, 15px)',
                color: '#0A0A0A',
                background: '#FFFFFF',
                marginBottom: 'clamp(12px, 1.2vw, 16px)',
              }}
            />

            {/* Your name (optional) */}
            <p className="font-arimo font-bold" style={{ fontSize: 'clamp(12px, 1.05vw, 14px)', color: '#101828', marginBottom: 'clamp(6px, 0.6vw, 8px)' }}>
              Your name (optional)
            </p>
            <input
              type="text"
              placeholder="e.g. Rahul from Delhi"
              className="w-full font-arimo outline-none"
              style={{
                height: 'clamp(44px, 4.12vw, 55px)',
                borderRadius: '14px',
                border: '1.6px solid #D1D5DC',
                padding: '0 16px',
                fontSize: 'clamp(13px, 1.12vw, 15px)',
                color: '#0A0A0A',
                background: '#FFFFFF',
                marginBottom: 'clamp(14px, 1.5vw, 20px)',
              }}
            />

            {/* Submit Doubt button */}
            <button
              className="w-full flex items-center justify-center gap-2 font-arimo font-bold text-white"
              style={{
                height: 'clamp(48px, 4.48vw, 60px)',
                borderRadius: '14px',
                background: '#101828',
                fontSize: 'clamp(13px, 1.12vw, 15px)',
                border: 'none',
                cursor: 'pointer',
                marginBottom: 'clamp(12px, 1.2vw, 16px)',
              }}
            >
              Submit Doubt &rarr;
            </button>

            <p className="font-arimo text-center" style={{ fontSize: 'clamp(11px, 0.9vw, 13px)', color: '#6A7282' }}>
              Answers posted on{' '}
              <span style={{ color: '#E7000B', fontWeight: 600, cursor: 'pointer' }}>YouTube Community</span>
              {' '}&amp;{' '}
              <span style={{ color: '#1E40AF', fontWeight: 600, cursor: 'pointer' }}>Telegram</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
