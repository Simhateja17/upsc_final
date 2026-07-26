'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/lib/services';

interface FeedbackItem {
  id: string;
  rating: number;
  category: string | null;
  workingWell: string | null;
  couldBeBetter: string | null;
  createdAt: string;
  user: { firstName: string | null; lastName: string | null; email: string | null };
}

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: '#F59E0B', letterSpacing: '1px' }}>
      {'★'.repeat(rating)}
      <span style={{ color: '#E5E7EB' }}>{'★'.repeat(5 - rating)}</span>
    </span>
  );
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    adminService.getFeedback()
      .then((res) => setFeedback(res.data || []))
      .catch((err: any) => setMsg(`Error: ${err.message}`))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-inter font-bold text-[#111827]" style={{ fontSize: 'clamp(22px, 1.6vw, 30px)' }}>
          User Feedback
        </h1>
      </div>

      {msg && (
        <div className="mb-4 p-3 rounded-lg text-sm font-inter bg-red-50 text-red-700">
          {msg}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-gray-200 border-t-[#0F172B] rounded-full animate-spin" />
        </div>
      ) : feedback.length === 0 ? (
        <div className="text-center py-12 text-gray-500 font-inter">No feedback submitted yet.</div>
      ) : (
        <div className="space-y-3">
          {feedback.map((f) => {
            const name = [f.user.firstName, f.user.lastName].filter(Boolean).join(' ') || f.user.email || 'Unknown user';
            return (
              <div key={f.id} className="bg-white border rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-inter font-semibold text-[#111827] text-sm">{name}</p>
                      {f.user.email && (
                        <span className="font-inter text-xs text-gray-400">{f.user.email}</span>
                      )}
                      {f.category && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700">
                          {f.category}
                        </span>
                      )}
                    </div>
                    <div className="mt-1"><Stars rating={f.rating} /></div>
                    {f.workingWell && (
                      <p className="font-inter text-gray-600 text-sm mt-2">
                        <span className="font-medium text-gray-700">Working well: </span>{f.workingWell}
                      </p>
                    )}
                    {f.couldBeBetter && (
                      <p className="font-inter text-gray-600 text-sm mt-1">
                        <span className="font-medium text-gray-700">Could be better: </span>{f.couldBeBetter}
                      </p>
                    )}
                    <p className="font-inter text-gray-400 text-xs mt-2">
                      {new Date(f.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
