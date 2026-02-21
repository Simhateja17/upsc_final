'use client';

import Link from 'next/link';

const DashboardHeader = () => {
  return (
    <header className="w-full h-[clamp(90px,5.78vw,111px)] bg-gradient-to-r from-[#0E182D] to-[#17223E] flex items-center justify-between px-[clamp(1rem,2vw,2.5rem)] sticky top-0 z-50">
      {/* Logo Section */}
      <Link href="/dashboard" className="flex items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="RiseWithJeet Logo"
          className="w-[clamp(100px,6vw,120px)] h-[clamp(100px,6vw,120px)] object-contain"
        />
      </Link>

      {/* Right Section - Button + User Profile */}
      <div className="flex items-center gap-[clamp(1rem,1.5vw,2rem)]">
        {/* Start Free Trial Button */}
        <Link href="/dashboard/free-trial">
          <button
            className="inline-flex items-center justify-end"
            style={{
              padding: '15px 24px 14px 24px',
              borderRadius: '30px',
              background: '#FFD170',
              boxShadow: '0 4px 17.1px 0 rgba(255, 255, 255, 0.06) inset',
              color: '#000',
              textAlign: 'center',
              fontFamily: '"SF Pro", -apple-system, BlinkMacSystemFont, sans-serif',
              fontSize: 'clamp(18px, 1.3vw, 25px)',
              fontWeight: 590,
              lineHeight: '110%',
              letterSpacing: '-0.375px',
              whiteSpace: 'nowrap',
            }}
          >
            Start Free Trial
          </button>
        </Link>

        {/* User Profile Section */}
      <div
        className="flex items-center gap-[clamp(0.5rem,0.8vw,1rem)] px-[clamp(0.75rem,1.2vw,1.5rem)] py-[clamp(0.5rem,0.6vw,0.75rem)] rounded-[36px] min-w-[clamp(180px,11.6vw,223px)] h-[clamp(48px,2.97vw,57px)] relative"
        style={{
          background: 'linear-gradient(85.13deg, rgba(30, 40, 117, 0.5) 2.96%, rgba(30, 40, 117, 0.5) 96.14%)',
          border: '1px solid #B19E66',
          boxShadow: '0px 16px 64px 0px rgba(104, 1, 255, 0.12)',
        }}
      >
        {/* User Avatar */}
        <div className="w-[clamp(35px,2.6vw,50px)] h-[clamp(32px,2.3vw,45px)] flex-shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="100%"
            height="100%"
            viewBox="0 0 50 45"
            fill="none"
            preserveAspectRatio="xMidYMid meet"
          >
            <ellipse cx="25" cy="22.5" rx="25" ry="22.5" fill="#D9D9D9"/>
          </svg>
        </div>

        {/* User Info */}
        <div className="flex flex-col justify-center flex-1 min-w-0">
          <div
            className="text-white font-poppins font-medium leading-[100%] truncate"
            style={{
              fontSize: 'clamp(14px, 1.02vw, 19.58px)',
            }}
          >
            Rahul Joshi
          </div>
          <div
            className="text-white font-poppins font-medium leading-[100%] truncate mt-[clamp(2px,0.3vw,4px)]"
            style={{
              fontSize: 'clamp(9px, 0.6vw, 11.52px)',
            }}
          >
            2025 UPSC Aspirant
          </div>
        </div>

        {/* Dropdown Arrow */}
        <div className="flex-shrink-0">
          <svg
            width={`clamp(10px, 0.68vw, 13px)`}
            height={`clamp(6px, 0.37vw, 7.13px)`}
            viewBox="0 0 13 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-[clamp(10px,0.68vw,13px)] h-auto"
          >
            <path
              d="M1 1L6.5 6.5L12 1"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
