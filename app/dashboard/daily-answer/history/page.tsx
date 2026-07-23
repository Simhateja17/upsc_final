'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { dailyAnswerService } from '@/lib/services';
import { getSubjectMetaStyle } from '@/lib/subjectPalette';

interface CalendarItem {
  date: string;
  title: string;
  questionText: string;
  paper: string;
  subject: string;
  marks: number;
  attempted: boolean;
  score: number | null;
  maxScore: number | null;
  evaluationStatus: string | null;
}

const LIMIT = 10;

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return toDateStr(d);
}

function formatDateLabel(dateStr: string, todayStr: string): string {
  if (dateStr === addDaysStr(todayStr, -1)) return 'Yesterday';
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  const day = d.getUTCDate();
  const month = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const year = d.getUTCFullYear();
  return `${day} ${month}, ${year}`;
}

export default function DailyAnswerHistoryPage() {
  const todayStr = toDateStr(new Date());
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    dailyAnswerService.getCalendar({ to: addDaysStr(todayStr, -1), page, limit: LIMIT })
      .then(res => {
        setItems(res.data?.items || []);
        setTotal(res.data?.total || 0);
      })
      .catch(() => {
        setItems([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [page, todayStr]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="flex flex-col bg-[#F3F4F6] font-arimo" style={{ minHeight: '100%', overflowY: 'auto' }}>
      <div className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 w-full max-w-[1200px] mx-auto">
        <div className="w-full" style={{ maxWidth: '1091px' }}>
          <div className="flex items-center justify-between mb-5">
            <h1 className="font-bold text-[#101828]" style={{ fontSize: '24px' }}>All Past Challenges</h1>
            <Link href="/dashboard/daily-answer/challenge" className="text-[#0F766E] hover:underline" style={{ fontSize: '13px', fontWeight: 500 }}>
              ← Back to Today
            </Link>
          </div>

          <div
            className="rounded-[16px] bg-white"
            style={{ boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A', padding: '22px 26px' }}
          >
            {loading ? (
              <div className="flex items-center justify-center" style={{ minHeight: '200px' }}>
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
              </div>
            ) : items.length === 0 ? (
              <p className="text-[#6A7282] text-center" style={{ fontSize: '13px', padding: '40px 0' }}>No past challenges yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {items.map((c) => {
                  const paperStyle = getSubjectMetaStyle(c.paper);
                  const subjectStyle = getSubjectMetaStyle(c.subject);
                  return (
                    <Link
                      key={c.date}
                      href={`/dashboard/daily-answer/challenge?date=${c.date}`}
                      className="block rounded-[10px] bg-[#F9FAFB] transition hover:opacity-90"
                      style={{ borderLeft: '3px solid #17223E', padding: '14px 18px' }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold inline-flex items-center gap-1" style={{ background: paperStyle.bg, color: paperStyle.color, border: `1px solid ${paperStyle.border}`, fontSize: '12px', padding: '4px 12px', borderRadius: '999px' }}><span aria-hidden>{paperStyle.icon}</span>{c.paper}</span>
                          <span className="font-medium inline-flex items-center gap-1" style={{ background: subjectStyle.bg, color: subjectStyle.color, border: `1px solid ${subjectStyle.border}`, fontSize: '12px', padding: '4px 12px', borderRadius: '999px' }}><span aria-hidden>{subjectStyle.icon}</span>{c.subject}</span>
                        </div>
                        <span className="text-[#6A7282]" style={{ fontSize: '12px' }}>{formatDateLabel(c.date, todayStr)}</span>
                      </div>
                      <p className="text-[#101828] font-bold mb-2" style={{ fontSize: '14px', lineHeight: '20px' }}>{c.questionText || c.title}</p>
                      <p className="text-[#4A5565]" style={{ fontSize: '12px' }}>
                        {c.score != null
                          ? <>Score: <span className="font-bold text-[#101828]">{c.score}/{c.maxScore}</span></>
                          : c.attempted
                            ? `Evaluation ${c.evaluationStatus}`
                            : 'Not attempted yet'}
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}

            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between mt-5 pt-4" style={{ borderTop: '1px solid #E5E7EB' }}>
                <button
                  type="button"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-4 py-2 rounded-[8px] border border-[#D1D5DB] text-[#374151] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontSize: '13px' }}
                >
                  ← Previous
                </button>
                <span className="text-[#6A7282]" style={{ fontSize: '13px' }}>Page {page} of {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-4 py-2 rounded-[8px] border border-[#D1D5DB] text-[#374151] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontSize: '13px' }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
