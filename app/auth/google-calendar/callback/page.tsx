'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { studyPlannerService } from '@/lib/services';

export default function GoogleCalendarCallbackPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const complete = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const error = params.get('error');

        if (error) throw new Error(error);
        if (!code || !state) throw new Error('Google Calendar authorization response is missing code or state.');

        await studyPlannerService.completeGoogleCalendarCallback(code, state);
        router.replace('/dashboard/study-planner?calendarSync=connected');
      } catch (error) {
        setErrorMsg(error instanceof Error ? error.message : 'Google Calendar sync connection failed.');
      }
    };

    complete();
  }, [router]);

  if (errorMsg) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F9FAFB]">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm" style={{ maxWidth: 420 }}>
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="font-inter font-semibold text-[#111827] mb-2">Calendar sync failed</h2>
          <p className="text-sm text-[#6B7280] mb-6">{errorMsg}</p>
          <button
            onClick={() => router.replace('/dashboard/study-planner')}
            className="px-5 py-2 rounded-lg text-white font-inter font-medium text-sm"
            style={{ background: '#101828' }}
          >
            Back to Study Planner
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F9FAFB]">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#101828] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-inter text-[#374151] text-sm">Connecting Google Calendar...</p>
      </div>
    </div>
  );
}
