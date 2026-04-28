'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { mindmapService } from '@/lib/services';

const Icons = {
  Polity: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 21H21" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 21V7" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 21V7" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 7L12 3L19 7" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 21V11C10 10.4477 10.4477 10 11 10H13C13.5523 10 14 10.4477 14 11V21" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Default: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="#4B5563" strokeWidth="2" />
      <path d="M2 12H22" stroke="#4B5563" strokeWidth="2" />
    </svg>
  ),
};

const SUBJECT_COLORS: Record<string, string> = {
  'indian-polity': '#3B82F6',
  'geography': '#EC4899',
  'indian-economy': '#F59E0B',
  'modern-history': '#D97706',
  'environment': '#10B981',
  'science-and-tech': '#8B5CF6',
  'gs-iv-ethics': '#6366F1',
  'current-affairs': '#14B8A6',
};

const SUBJECT_CARD_STYLES: Record<string, { bg: string; border: string; bar: string }> = {
  'indian-polity': { bg: '#FFF7E6', border: '#FED7AA', bar: '#F0AE00' },
  'modern-history': { bg: '#FFF7ED', border: '#FDBA74', bar: '#D08700' },
  geography: { bg: '#ECFDF5', border: '#A7F3D0', bar: '#14B8A6' },
  'indian-economy': { bg: '#F5F3FF', border: '#DDD6FE', bar: '#8B5CF6' },
  environment: { bg: '#E8FFF3', border: '#BBF7D0', bar: '#22C55E' },
  'gs-iv-ethics': { bg: '#EEF2FF', border: '#C7D2FE', bar: '#6366F1' },
  'current-affairs': { bg: '#FEF2F2', border: '#FECACA', bar: '#EF4444' },
  'science-and-tech': { bg: '#EAF4FF', border: '#BFDBFE', bar: '#3B82F6' },
};

type SubjectData = {
  id: string;
  name: string;
  icon: string;
  slug: string;
  total: number;
  explored: number;
  progress: number;
};

export default function MindmapPage() {
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mindmapService.getSubjects()
      .then((res) => {
        if (res.status === 'success') setSubjects(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalMaps = subjects.reduce((s, sub) => s + sub.total, 0);
  const totalExplored = subjects.reduce((s, sub) => s + sub.explored, 0);

  const mastered = totalExplored;
  const coverage = totalMaps > 0 ? Math.round((totalExplored / totalMaps) * 100) : 0;
  const needReview = Math.max(0, totalMaps - totalExplored);

  return (
    <div className="min-h-screen font-inter" style={{ background: '#070F24' }}>

      {/* ── Hero: full-width, centered, matching Daily Editorial pattern ── */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: 'clamp(28px, 3vw, 44px) clamp(16px, 3vw, 42px) clamp(36px, 4vw, 56px)',
        }}
      >
        {/* Subtle grid overlay */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
          }}
        />
        {/* Gold radial glow top-center */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-80px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '400px',
            background: 'radial-gradient(ellipse at center, rgba(253,199,0,0.09) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Back to Dashboard — top left */}
          <Link href="/dashboard">
            <button
              className="flex items-center gap-2 font-inter font-semibold"
              style={{
                height: '36px',
                borderRadius: '999px',
                border: '1px solid rgba(255,255,255,0.18)',
                padding: '0 14px',
                fontSize: '13px',
                color: '#FFFFFF',
                backgroundColor: 'rgba(255,255,255,0.08)',
                whiteSpace: 'nowrap',
                marginBottom: 'clamp(24px, 3vw, 40px)',
                cursor: 'pointer',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              ← Back to Dashboard
            </button>
          </Link>

          {/* Centered content */}
          <div className="flex flex-col items-center text-center">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 font-inter font-bold"
              style={{
                background: '#FDC700',
                borderRadius: '999px',
                padding: '6px 16px',
                fontSize: '11px',
                color: '#101828',
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                marginBottom: '24px',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" fill="#101828"/>
                <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="#101828" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              REVISION — VISUAL LEARNING
            </div>

            {/* Heading */}
            <h1
              className="font-inter font-bold"
              style={{
                fontSize: 'clamp(36px, 5vw, 64px)',
                lineHeight: '1.05',
                color: '#FFFFFF',
                marginBottom: '16px',
              }}
            >
              Your <span style={{ color: '#FDC700', fontStyle: 'italic' }}>Mindmap</span> Library.
            </h1>

            {/* Subtitle */}
            <p
              className="font-inter"
              style={{
                fontSize: 'clamp(14px, 1.2vw, 16px)',
                lineHeight: '1.6',
                color: '#B7C2D8',
                marginBottom: 'clamp(28px, 3vw, 40px)',
              }}
            >
              See the big picture. Every topic structured as a visual tree — revise faster, remember longer.
            </p>

            {/* Stats strip — horizontal with dividers */}
            <div
              style={{
                display: 'inline-flex',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '16px',
                overflow: 'hidden',
              }}
            >
              {[
                { num: totalMaps,   label: 'TOTAL CARDS',  color: '#46ECD5' },
                { num: mastered,    label: 'MASTERED',     color: '#DAB2FF' },
                { num: `${coverage}%`, label: 'COVERAGE',  color: '#4ADE80' },
                { num: needReview,  label: 'NEED REVIEW',  color: '#FF6B6B' },
              ].map((item, i, arr) => (
                <div
                  key={item.label}
                  style={{
                    padding: 'clamp(14px, 1.5vw, 20px) clamp(20px, 2.5vw, 36px)',
                    textAlign: 'center',
                    borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.10)' : 'none',
                  }}
                >
                  <div
                    className="font-inter font-bold"
                    style={{ fontSize: 'clamp(22px, 2.5vw, 32px)', color: item.color, lineHeight: 1 }}
                  >
                    {item.num}
                  </div>
                  <div
                    className="font-inter font-semibold"
                    style={{ fontSize: '10px', color: '#6B7A9A', letterSpacing: '0.8px', marginTop: '6px', textTransform: 'uppercase' }}
                  >
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content section: light background ── */}
      <div
        style={{
          background: '#F5F6FA',
          borderRadius: '28px 28px 0 0',
          marginTop: '-4px',
          paddingTop: 'clamp(24px, 3vw, 40px)',
        }}
      >
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 pb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-[#10182D] text-white flex items-center justify-center font-semibold text-[14px]">1</div>
          <h2 className="text-[36px] font-bold text-[#10182D] font-serif">
            Choose a <span className="italic text-[#F0B100]">Subject</span>
          </h2>
        </div>
        <p className="text-[#6A7282] text-[14px] mb-8 ml-11">Select the subject whose mindmaps you want to study today</p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 ml-0 sm:ml-11">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-[16px] h-[180px] animate-pulse" />
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-16 text-gray-400 ml-11">
            <p className="text-lg font-semibold mb-2">No mindmap subjects yet</p>
            <p className="text-sm">Ask an admin to seed some mindmaps to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 ml-0 sm:ml-11">
            {subjects.map((subject) => {
              const color = SUBJECT_COLORS[subject.slug] ?? '#6B7280';
              const cardStyle = SUBJECT_CARD_STYLES[subject.slug] ?? { bg: '#FFFFFF', border: '#E5E7EB', bar: color };
              return (
                <Link key={subject.slug} href={`/dashboard/mindmap/${subject.slug}`} className="block">
                  <div className="rounded-[16px] overflow-hidden shadow-sm flex flex-col h-[172px] relative group hover:-translate-y-0.5 hover:shadow-md transition-all" style={{ background: cardStyle.bg, border: `1px solid ${cardStyle.border}` }}>
                    <div className="h-[4px] w-full" style={{ backgroundColor: cardStyle.bar }} />
                    <div className="p-5 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center text-xl">
                            {subject.icon}
                          </div>
                        </div>
                        <h3 className="text-[16px] font-bold text-[#1A1A1A] font-inter mb-1">{subject.name}</h3>
                        <p className="text-[12px] text-[#6B7280] font-inter">{subject.total} mindmaps</p>
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between items-center text-[11px] font-medium mb-2">
                          <span className="text-[#374151] font-bold">{subject.progress}% explored</span>
                          <span className="px-2 py-0.5 rounded text-[10px] text-[#6B7280]" style={{ backgroundColor: `${color}15` }}>
                            {subject.explored === 0 ? 'Not started' : `${subject.explored} explored`}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${subject.progress}%`, backgroundColor: cardStyle.bar }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
