'use client';

import { useState } from 'react';

const moods = ['Anxious', 'Tired', 'Okay', 'Focused', 'Confident'];
const resources = [
  { title: 'Breathing Reset', desc: 'A 3-minute guided reset before study blocks.', action: 'Start' },
  { title: 'Stress Journaling', desc: 'Write what is worrying you and separate facts from fears.', action: 'Open Journal' },
  { title: 'Study Pressure Reflection', desc: 'A quick self-check for burnout patterns.', action: 'Reflect' },
  { title: 'Micro Motivation', desc: 'A short reminder for low-energy days.', action: 'Read' },
];

export default function MentalHealthPage() {
  const [mood, setMood] = useState('Okay');
  const [note, setNote] = useState('');
  const [breathing, setBreathing] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F4EF] pb-12 font-inter">
      <section className="bg-[#0B1220] px-6 py-12 text-center text-white">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[1.6px] text-[#F0B100]">Mental Health Buddy</p>
        <h1 className="mb-4 text-[38px] leading-tight md:text-[52px]" style={{ fontFamily: 'Georgia, serif' }}>
          Your UPSC journey is a marathon, <span className="italic text-[#F0B100]">not a sprint</span>.
        </h1>
        <p className="mx-auto max-w-[650px] text-[15px] leading-6 text-[#AAB4C3]">
          Burnout, anxiety and self-doubt are real. This space helps you pause, reflect and return to study with clarity.
        </p>
      </section>

      <main className="mx-auto -mt-8 max-w-[1040px] px-4">
        <section className="mb-6 rounded-[18px] bg-white p-6 shadow-lg">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-[22px] font-bold text-[#101828]">Daily Check-in</h2>
              <p className="text-[13px] text-[#62748E]">How are you feeling before today&apos;s study session?</p>
            </div>
            <div className="rounded-[12px] bg-[#FFF7ED] px-4 py-3 text-center">
              <div className="text-[18px] font-bold text-[#D08700]">Streak 12</div>
              <div className="text-[11px] text-[#9A3412]">healthy check-ins</div>
            </div>
          </div>
          <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
            {moods.map((item) => (
              <button
                key={item}
                onClick={() => setMood(item)}
                className="rounded-[14px] border px-4 py-4 text-[14px] font-bold"
                style={{
                  borderColor: mood === item ? '#F0B100' : '#E2E8F0',
                  background: mood === item ? '#FFFBEB' : '#FFFFFF',
                  color: '#101828',
                }}
              >
                {item}
              </button>
            ))}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mb-4 h-[96px] w-full rounded-[12px] border border-[#E2E8F0] px-4 py-3 text-[14px] outline-none focus:ring-2 focus:ring-[#F0B100]"
            placeholder="Write one thing on your mind..."
          />
          <button className="rounded-[10px] bg-[#101828] px-5 py-3 text-[13px] font-bold text-white">Save Check-in</button>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-[18px] bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-[20px] font-bold text-[#101828]">Quick Calm</h2>
            <div className="mb-5 flex items-center justify-center">
              <div className={`flex size-44 items-center justify-center rounded-full border-[12px] text-center transition-all duration-700 ${breathing ? 'scale-110 border-[#22C55E]' : 'scale-100 border-[#D9E4D2]'}`}>
                <div>
                  <div className="text-[32px] font-bold text-[#16A34A]">{breathing ? '4' : '3'}</div>
                  <div className="text-[11px] uppercase tracking-[1px] text-[#62748E]">{breathing ? 'Breathe in' : 'Ready'}</div>
                </div>
              </div>
            </div>
            <button onClick={() => setBreathing((value) => !value)} className="w-full rounded-[10px] bg-[#16A34A] px-5 py-3 text-[13px] font-bold text-white">
              {breathing ? 'Stop' : 'Start Breathing'}
            </button>
          </section>

          <section className="rounded-[18px] bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-[20px] font-bold text-[#101828]">Stress Grounding</h2>
            {['Name 5 things you can see right now', 'Name 4 things you can feel', 'Name 3 sounds you can hear', 'Name 2 things you can smell', 'Name 1 thing you are grateful for'].map((item) => (
              <label key={item} className="mb-3 flex items-center gap-3 rounded-[10px] bg-[#F8FAFC] px-4 py-3 text-[14px] text-[#45556C]">
                <input type="checkbox" />
                {item}
              </label>
            ))}
          </section>
        </div>

        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {resources.map((item) => (
            <div key={item.title} className="rounded-[16px] border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <h3 className="mb-2 font-bold text-[#101828]">{item.title}</h3>
              <p className="mb-4 text-[13px] leading-5 text-[#62748E]">{item.desc}</p>
              <button className="text-[13px] font-bold text-[#D08700]">{item.action} →</button>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
