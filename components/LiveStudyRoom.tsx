import React from 'react';

const LiveStudyRoom = () => {
  const features = [
    { emoji: '⏱️', title: 'Pomodoro Timer', desc: 'Stay focused with proven time management' },
    { emoji: '🏆', title: 'Leaderboards', desc: 'Track rankings & compete healthily' },
    { emoji: '📋', title: 'Task Cards', desc: 'Share goals & stay accountable' },
    { emoji: '🔍', title: 'Peer Review', desc: 'Get feedback from fellow aspirants' },
  ];

  const avatars = [
    { letter: 'S', bg: '#4CAF50' },
    { letter: 'R', bg: '#E91E63' },
    { letter: 'A', bg: '#FF9800' },
    { letter: 'P', bg: '#9C27B0' },
  ];

  return (
    <section 
      className="w-full flex flex-col items-center"
      style={{
        background: '#05070A',
        paddingTop: 'clamp(3rem, 6vw, 80px)',
        paddingBottom: 'clamp(3rem, 6vw, 80px)',
        paddingLeft: 'clamp(1.5rem, 5vw, 80px)',
        paddingRight: 'clamp(1.5rem, 5vw, 80px)',
      }}
    >
      
      {/* Section Title */}
      <h2 
        className="font-lora font-bold text-center"
        style={{
          fontSize: 'clamp(2rem, 3.385vw, 4.063rem)',
          lineHeight: '150%',
          letterSpacing: '0.01em',
          color: '#FFD170',
          marginBottom: 'clamp(1.5rem, 3vw, 40px)',
        }}
      >
        Live Study Room
      </h2>

      {/* Subheading */}
      <h3
        className="font-lora font-semibold text-center text-white"
        style={{
          fontSize: 'clamp(1.25rem, 2.2vw, 2.5rem)',
          lineHeight: '140%',
          marginBottom: 'clamp(1rem, 2vw, 24px)',
        }}
      >
        Study With 10,000+ UPSC Aspirants
      </h3>

      {/* Live Badge */}
      <div 
        className="flex items-center gap-2 rounded-full"
        style={{
          padding: 'clamp(0.4rem, 0.7vw, 0.6rem) clamp(1rem, 2vw, 1.5rem)',
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          marginBottom: 'clamp(2rem, 4vw, 50px)',
        }}
      >
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        <span 
          className="font-inter"
          style={{ fontSize: 'clamp(0.85rem, 1vw, 1rem)', color: '#4ADE80' }}
        >
          532
        </span>
        <span 
          className="font-inter text-white/70"
          style={{ fontSize: 'clamp(0.85rem, 1vw, 1rem)' }}
        >
          students studying now
        </span>
      </div>

      {/* Integrated Live Study Room Card */}
      <div 
        className="w-full flex justify-center"
        style={{ marginBottom: 'clamp(2.5rem, 5vw, 60px)' }}
      >
        <div 
          className="rounded-2xl flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
          style={{
            padding: 'clamp(1rem, 2vw, 1.5rem) clamp(1.5rem, 3vw, 2.5rem)',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(20, 30, 55, 0.9))',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Avatars */}
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {avatars.map((a, i) => (
                <div 
                  key={i}
                  className="flex items-center justify-center rounded-full border-2 border-[#0E182D] font-bold text-white"
                  style={{
                    width: 'clamp(32px, 2.5vw, 40px)',
                    height: 'clamp(32px, 2.5vw, 40px)',
                    fontSize: 'clamp(0.7rem, 0.9vw, 0.85rem)',
                    background: a.bg,
                    zIndex: avatars.length - i,
                  }}
                >
                  {a.letter}
                </div>
              ))}
              <div 
                className="flex items-center justify-center rounded-full border-2 border-[#0E182D] font-semibold text-white/80"
                style={{
                  width: 'clamp(32px, 2.5vw, 40px)',
                  height: 'clamp(32px, 2.5vw, 40px)',
                  fontSize: 'clamp(0.6rem, 0.75vw, 0.75rem)',
                  background: 'rgba(255, 255, 255, 0.15)',
                }}
              >
                +120
              </div>
            </div>
          </div>

          {/* Study Info */}
          <div className="text-center sm:text-left">
            <p className="font-plus-jakarta font-bold text-white" style={{ fontSize: 'clamp(0.9rem, 1.1vw, 1.1rem)' }}>
              Live Study Room
            </p>
            <p className="font-inter text-white/60" style={{ fontSize: 'clamp(0.75rem, 0.85vw, 0.85rem)' }}>
              Currently studying: Modern History | Silent Collaboration Mode Active
            </p>
          </div>

          {/* Status Badges */}
          <div className="flex items-center gap-3">
            <div 
              className="flex items-center gap-1.5 rounded-full"
              style={{
                padding: '0.3rem 0.75rem',
                background: 'rgba(74, 222, 128, 0.15)',
                border: '1px solid rgba(74, 222, 128, 0.3)',
              }}
            >
              <span style={{ fontSize: '0.7rem' }}>🛡️</span>
              <span className="font-inter font-semibold uppercase" style={{ fontSize: 'clamp(0.6rem, 0.7vw, 0.7rem)', color: '#4ADE80' }}>
                Focus Guard On
              </span>
            </div>
            <div 
              className="flex items-center gap-1.5 rounded-full"
              style={{
                padding: '0.3rem 0.75rem',
                background: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
              }}
            >
              <span style={{ fontSize: '0.7rem' }}>👥</span>
              <span className="font-inter font-semibold uppercase" style={{ fontSize: 'clamp(0.6rem, 0.7vw, 0.7rem)', color: '#A855F7' }}>
                124 Online
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div 
        className="w-full grid grid-cols-2 lg:grid-cols-4"
        style={{
          maxWidth: '1000px',
          gap: 'clamp(1.5rem, 3vw, 3rem)',
          marginBottom: 'clamp(2.5rem, 5vw, 60px)',
        }}
      >
        {features.map((f, i) => (
          <div key={i} className="flex flex-col items-center text-center">
            <span style={{ fontSize: 'clamp(2rem, 3vw, 3rem)', marginBottom: 'clamp(0.5rem, 1vw, 0.75rem)' }}>
              {f.emoji}
            </span>
            <h4 
              className="font-plus-jakarta font-bold text-white"
              style={{ fontSize: 'clamp(0.9rem, 1.1vw, 1.1rem)', marginBottom: '0.35rem' }}
            >
              {f.title}
            </h4>
            <p 
              className="font-inter text-white/50"
              style={{ fontSize: 'clamp(0.78rem, 0.9vw, 0.9rem)', lineHeight: '150%' }}
            >
              {f.desc}
            </p>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <button
        className="font-plus-jakarta font-semibold text-white rounded-full transition-all hover:scale-105 hover:shadow-lg"
        style={{
          fontSize: 'clamp(0.95rem, 1.1vw, 1.1rem)',
          padding: 'clamp(0.75rem, 1.2vw, 1rem) clamp(2rem, 3.5vw, 3rem)',
          background: 'linear-gradient(135deg, #E8623F, #D94F2E)',
          boxShadow: '0 4px 20px rgba(232, 98, 63, 0.35)',
        }}
      >
        Join Study Room →
      </button>
    </section>
  );
};

export default LiveStudyRoom;
