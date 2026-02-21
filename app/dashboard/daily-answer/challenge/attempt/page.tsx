'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardPreview from '@/components/DashboardPreview';

export default function DailyAnswerAttemptPage() {
    const router = useRouter();
    const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(timeLeft => timeLeft - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            if (interval) clearInterval(interval);
            setIsActive(false);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, timeLeft]);

    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(15 * 60);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex min-h-screen bg-[#F8F9FC] font-sans justify-center">
            
            <main className="flex-1 max-w-[1200px]">

                    {/* Main Content Area - Centered Card */}
                    <div className="p-10 flex flex-col items-center w-full">
                        
                        {/* Timer Card Section */}
                        <div 
                            className="bg-white rounded-[16px] flex flex-col items-center justify-center mb-6"
                            style={{
                                width: '909px',
                                minHeight: '263px',
                                boxShadow: '0px 1px 3px 0px #0000001A, 0px 1px 2px -1px #0000001A',
                                padding: '30px'
                            }}
                        >
                            {/* Title: WRITING TIMER */}
                            <div style={{
                                fontFamily: 'Arimo',
                                fontSize: '20px',
                                fontWeight: 400,
                                letterSpacing: '0.3px',
                                color: '#6A7282',
                                textTransform: 'uppercase',
                                marginBottom: '20px'
                            }}>
                                WRITING TIMER
                            </div>

                            {/* Timer Circle */}
                            <div 
                                className="rounded-full border-4 border-[#101828] flex items-center justify-center mb-4"
                                style={{
                                    width: '112px',
                                    height: '112px'
                                }}
                            >
                                <span style={{
                                    fontFamily: 'Arimo',
                                    fontWeight: 700,
                                    fontSize: '24px',
                                    color: '#101828'
                                }}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>

                            {/* Subtitle: WRITING IN PROGESS */}
                            <div style={{
                                fontFamily: 'Arimo',
                                fontSize: '20px',
                                fontWeight: 400,
                                letterSpacing: '0.3px',
                                color: '#6A7282',
                                textTransform: 'uppercase',
                                marginBottom: '24px'
                            }}>
                                WRITING IN PROGESS
                            </div>

                            {/* Buttons Row */}
                            <div className="flex gap-4">
                                {/* Start Timer Button */}
                                <button 
                                    onClick={toggleTimer}
                                    className="flex items-center justify-center gap-2 text-white font-bold transition-transform hover:scale-105"
                                    style={{
                                        width: '136px',
                                        height: '48px',
                                        background: isActive ? '#dc2626' : '#00BC7D', // Red if active, Green default
                                        borderRadius: '10px',
                                        fontSize: '16px'
                                    }}
                                >
                                    <img src="/Icon%20(11).png" alt="" style={{ width: '24px', height: '24px', filter: 'brightness(0) invert(1)' }} />
                                    {isActive ? 'Pause' : 'Start Timer'}
                                </button>

                                 {/* Reset Button */}
                                 <button
                                    onClick={resetTimer} 
                                    className="flex items-center justify-center gap-2 bg-white border border-[#D1D5DB] text-[#374151] font-bold transition-transform hover:scale-105"
                                    style={{
                                        width: '96px',
                                        height: '48px',
                                        borderRadius: '10px',
                                        fontSize: '16px'
                                    }}
                                >
                                    <img src="/Icon%20(10).png" alt="Reset" style={{ width: '20px', height: '20px' }} />
                                    Reset
                                </button>
                            </div>
                        </div>

                        {/* Bottom Card Container (Wrapping Upload & Submit) */}
                        <div 
                            className="bg-white rounded-[16px] flex flex-col items-center pt-[68px] pb-8 mb-8"
                            style={{
                                width: '909px',
                                minHeight: '600px', // Enough to hold upload box + button
                                boxShadow: '0px 1px 3px 0px #0000001A, 0px 1px 2px -1px #0000001A'
                            }}
                        >
                            {/* Check Dotted Box for Upload */}
                            <div 
                                className="bg-[#F9FAFB] rounded-[16px] flex flex-col items-center justify-center mb-8 relative"
                                style={{
                                    width: '639.81px', 
                                    height: '427.2px',
                                    border: '1px dashed #17223E',
                                    // padding: '40px' // Removed fixed padding to let flex center content
                                }}
                            >
                                {/* Cloud Icon */}
                                <div className="mb-4">
                                    <img src="/uplaod/.png" alt="Upload" style={{ width: '80px', height: '80px' }} />
                                </div>

                                {/* Drop Text */}
                                <h3 style={{
                                    fontFamily: 'Arimo',
                                    fontWeight: 700,
                                    fontSize: '20px',
                                    textAlign: 'center',
                                    color: '#101828',
                                    marginBottom: '8px'
                                }}>
                                    Drop your answer script here
                                </h3>
                                
                                <p style={{
                                    fontFamily: 'Arimo',
                                    fontWeight: 400,
                                    fontSize: '14px',
                                    textAlign: 'center',
                                    color: '#4A5565',
                                    marginBottom: '24px'
                                }}>
                                    Upload handwritten answers for AI evaluation
                                </p>

                                {/* File Format Chips */}
                                <div className="flex gap-3 mb-8">
                                    {['JPG', 'PNG', 'PDF', 'DOCX'].map((fmt) => (
                                        <span key={fmt} className="px-3 py-1 bg-[#E5E7EB] rounded text-[#374151] font-arimo" style={{ fontSize: '14px' }}>
                                            {fmt}
                                        </span>
                                    ))}
                                    <span className="px-3 py-1 bg-[#E5E7EB] rounded text-[#374151] font-arimo" style={{ fontSize: '14px' }}>Max 10MB</span>
                                </div>

                                {/* Browse Files Button */}
                                <button 
                                    className="bg-white border border-[#D1D5DB] text-[#111827] font-bold rounded-[10px] hover:bg-gray-50 transition-colors"
                                    style={{
                                        width: '156px',
                                        height: '48px',
                                        fontSize: '16px'
                                    }}
                                >
                                    Browse Files
                                </button>
                            </div>

                            {/* Submit Button */}
                            <button 
                                onClick={() => router.push('/dashboard/daily-answer/challenge/attempt/evaluating')}
                                className="flex items-center justify-center gap-2 text-white font-bold transition-transform hover:scale-105 mb-4"
                                style={{
                                    width: '640px',
                                    height: '56px',
                                    background: '#17223E',
                                    borderRadius: '14px',
                                    fontSize: '16px',
                                    boxShadow: '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -4px rgba(0, 0, 0, 0.1)'
                                }}
                            >
                                <img src="/Icon%20(13).png" alt="" style={{ width: '24px', height: '24px' }} />
                                Submit Answer for Evaluation
                            </button>

                            {/* Footer Feedback Text */}
                            <div className="flex items-center gap-2">
                                <img src="/Text%20(8).png" alt="Flash" style={{ height: '20px' }} />
                                <span style={{
                                    fontFamily: 'Arimo',
                                    fontWeight: 700,
                                    fontSize: '14px',
                                    color: '#364153'
                                }}>
                                    Get detailed feedback in 60 seconds
                                </span>
                            </div>
                        </div>
                    </div>
            </main>
        </div>
    );
}
