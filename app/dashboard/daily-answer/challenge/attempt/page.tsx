'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DailyAnswerAttemptPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/daily-answer/challenge');
  }, [router]);

  return null;
}
