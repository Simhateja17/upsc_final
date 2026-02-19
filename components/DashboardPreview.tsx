'use client';

import React from 'react';

const DashboardPreview = () => {
  return (
    <section className="w-full panel-recessed py-[clamp(3rem,6vw,8rem)]">
      <div className="w-full max-w-[120rem] mx-auto px-[clamp(1.5rem,4vw,5rem)]">
        {/* Section Title - consistent with other sections */}
        <h2
          className="font-lora font-bold text-center text-[#1C2E45] leading-[150%]"
          style={{
            fontSize: 'clamp(2rem, 3.385vw, 4.063rem)',
            letterSpacing: '0.01em'
          }}
        >
          Personalized Dashboard Preview
        </h2>
        
        {/* Placeholder space for dashboard preview */}
        <div
          className="w-full mt-[clamp(2rem,4vw,5rem)]"
          style={{ minHeight: 'clamp(200px, 25vw, 400px)' }}
        />
      </div>
    </section>
  );
};

export default DashboardPreview;
