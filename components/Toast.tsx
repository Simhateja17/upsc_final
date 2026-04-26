'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  autoCloseDuration?: number;
}

export default function Toast({
  message,
  type,
  onClose,
  autoCloseDuration = 3000,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, autoCloseDuration);
    return () => clearTimeout(timer);
  }, [onClose, autoCloseDuration]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const icon = type === 'success' ? '✓' : '✕';

  return (
    <div className={`fixed top-6 right-6 flex items-center gap-3 px-6 py-4 rounded-lg text-white ${bgColor} shadow-lg z-50`} style={{ animation: 'slideInRight 0.3s ease-out' }}>
      <span className="text-xl font-bold">{icon}</span>
      <span className="font-medium">{message}</span>
    </div>
  );
}
