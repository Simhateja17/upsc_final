'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { mindmapService } from '@/lib/services';
import DashboardPageHero from '@/components/DashboardPageHero';

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
  'indian-polity':  '#EA580C', // orange
  'modern-history': '#92400E', // brown
  'geography':      '#0D9488', // teal
  'indian-economy': '#7C3AED', // purple
  'environment':    '#16A34A', // green
  'gs-iv-ethics':   '#4F46E5', // indigo
  'current-affairs':'#EF4444', // red
  'science-and-tech':'#0369A1',// sky blue
};

const SUBJECT_CARD_STYLES: Record<string, { bg: string; border: string; bar: string }> = {
  'indian-polity':  { bg: 'linear-gradient(145deg, #FFF4E2 0%, #FBE9CC 100%)', border: '#F4CCA0', bar: '#EA580C' }, // orange
  'modern-history': { bg: 'linear-gradient(145deg, #FDF5EB 0%, #F0E2CC 100%)', border: '#DBBF99', bar: '#92400E' }, // sepia-brown
  geography:        { bg: 'linear-gradient(145deg, #E0F7F6 0%, #CCEEEC 100%)', border: '#99D9D6', bar: '#0D9488' }, // teal
  'indian-economy': { bg: 'linear-gradient(145deg, #F3EEFF 0%, #E7DEFF 100%)', border: '#D7C8FF', bar: '#7C3AED' }, // purple
  environment:      { bg: 'linear-gradient(145deg, #EEFBF4 0%, #DCF5E8 100%)', border: '#BCE9D1', bar: '#16A34A' }, // green
  'gs-iv-ethics':   { bg: 'linear-gradient(145deg, #EEF0FF 0%, #E0E3FF 100%)', border: '#C4C9F8', bar: '#4F46E5' }, // indigo
  'current-affairs':{ bg: 'linear-gradient(145deg, #FFF1F2 0%, #FDE7EA 100%)', border: '#F6C6CF', bar: '#EF4444' }, // red
  'science-and-tech':{ bg: 'linear-gradient(145deg, #E0F4FF 0%, #CCE8FF 100%)', border: '#99CFEE', bar: '#0369A1' }, // sky blue
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
    <div className="min-h-screen font-arimo" style={{ background: '#F9FAFB' }}>

      <DashboardPageHero
        // eslint-disable-next-line @next/next/no-img-element
        badgeIcon={
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/mindmap-badge-icon.png" alt="Mindmaps" style={{ width: 16, height: 16, objectFit: 'contain' }} />
        }
        badgeText="VISUAL LEARNING"
        title={
          <>
            Map Your <em className="not-italic" style={{ color: '#E8B84B', fontStyle: 'italic' }}>Knowledge</em>
            <br />
            with Mindmaps
          </>
        }
        subtitle="See the big picture. Every topic structured as a visual tree, revise faster, remember longer."
        stats={[
          { value: String(totalMaps),      label: 'Total Maps',   color: '#FDC700' },
          { value: String(mastered),        label: 'Mastered',     color: '#4ADE80' },
          { value: coverage + '%',          label: 'Coverage',     color: '#F87171' },
          { value: String(needReview),      label: 'Need Review',  color: '#FFFFFF' },
        ]}
      />

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
            Choose a <span className="italic text-[#E8B84B]">Subject</span>
          </h2>
        </div>
        <p className="text-[#6A7282] text-[14px] mb-8 ml-11">Select the subject whose mindmaps you want to study today</p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 ml-0 sm:ml-11">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-[16px] h-[176px] animate-pulse" />
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
                  <div className="rounded-[16px] overflow-hidden shadow-sm flex flex-col h-[176px] relative group hover:-translate-y-0.5 hover:shadow-md transition-all" style={{ background: cardStyle.bg, border: `1.5px solid ${cardStyle.border}` }}>
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
