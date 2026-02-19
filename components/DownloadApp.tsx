'use client';

import React from 'react';
import Image from 'next/image';

const DownloadApp = () => {
  return (
    <section
      className="w-full flex flex-col items-center panel-recessed"
      style={{
        paddingTop: 'clamp(3rem, 5vw, 70px)',
        paddingBottom: 'clamp(3rem, 5vw, 70px)',
        paddingLeft: 'clamp(1.5rem, 5vw, 80px)',
        paddingRight: 'clamp(1.5rem, 5vw, 80px)'
      }}
    >
      {/* Heading - consistent with other sections */}
      <h2
        className="font-lora font-bold text-center text-[#1C2E45]"
        style={{
          fontSize: 'clamp(2rem, 3.385vw, 4.063rem)',
          lineHeight: '150%',
          letterSpacing: '0.01em',
          marginBottom: 'clamp(2rem, 4vw, 50px)'
        }}
      >
        Download the App
      </h2>

      {/* iPhone Image - compact */}
      <div
        className="relative"
        style={{
          width: 'clamp(180px, 22vw, 300px)',
          aspectRatio: '360/767'
        }}
      >
        <Image
          src="/app-download-iphone.png"
          alt="Download our App - iPhone Preview"
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Store Buttons */}
      <div
        className="flex items-center justify-center gap-4 flex-wrap"
        style={{ marginTop: 'clamp(1.5rem, 3vw, 40px)' }}
      >
        <a
          href="#"
          className="flex items-center gap-2 rounded-xl transition-transform hover:scale-105 bg-[#1C2E45] text-white"
          style={{ padding: 'clamp(0.6rem, 1vw, 0.85rem) clamp(1.2rem, 2vw, 1.75rem)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          <div>
            <div className="font-inter text-[0.6rem] opacity-80">Download on the</div>
            <div className="font-plus-jakarta font-semibold" style={{ fontSize: 'clamp(0.85rem, 1vw, 1rem)' }}>App Store</div>
          </div>
        </a>
        <a
          href="#"
          className="flex items-center gap-2 rounded-xl transition-transform hover:scale-105 bg-[#1C2E45] text-white"
          style={{ padding: 'clamp(0.6rem, 1vw, 0.85rem) clamp(1.2rem, 2vw, 1.75rem)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M3.61 1.814L13.793 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.61-.92zm.86-.41l11.17 6.15L12.58 10.6 4.47 1.404zM16.64 8.554l2.86 1.57a1 1 0 010 1.752l-2.86 1.57-3.45-3.446 3.45-3.446zM4.47 22.596l8.11-9.196 3.06 3.056-11.17 6.14z"/>
          </svg>
          <div>
            <div className="font-inter text-[0.6rem] opacity-80">Get it on</div>
            <div className="font-plus-jakarta font-semibold" style={{ fontSize: 'clamp(0.85rem, 1vw, 1rem)' }}>Google Play</div>
          </div>
        </a>
      </div>
    </section>
  );
};

export default DownloadApp;
