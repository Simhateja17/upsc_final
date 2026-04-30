'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      router.replace(user?.role === 'admin' ? '/admin' : '/dashboard');
      return;
    }
    // Avoid iframe-based landing rendering issues by navigating directly.
    window.location.replace('/riswithjeet-landing.html');
  }, [isAuthenticated, isLoading, user, router]);

  return (
    <div
      className="flex items-center justify-center"
      style={{ minHeight: '100dvh', background: '#FAFBFE', color: '#6B7280' }}
    >
      Loading...
    </div>
  );
}
