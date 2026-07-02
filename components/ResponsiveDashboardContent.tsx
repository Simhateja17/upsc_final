'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardService, studyPlannerService } from '@/lib/services';
import { getSubjectEmoji } from '@/lib/subjectEmojis';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getDashboardUserName(firstName?: string, email?: string) {
  if (firstName?.trim()) {
    const trimmed = firstName.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }
  const emailPrefix = email?.split('@')[0]?.trim().toLowerCase();
  if (!emailPrefix) return '';
  const withoutDigits = emailPrefix.replace(/\d+$/g, '');
  const parts = withoutDigits.split(/[._-]+/).filter(Boolean);
  if (parts.length > 0) {
    return parts
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
  if (withoutDigits.length <= 6) {
    return withoutDigits.charAt(0).toUpperCase() + withoutDigits.slice(1);
  }
  return withoutDigits.charAt(0).toUpperCase() + withoutDigits.slice(1, 4);
}

interface DashboardData {
  daysRemaining?: number;
  targetYear?: string;
  trio?: {
    mcq?: { status?: string; topic?: string; questionCount?: number };
    editorial?: { status?: string; topic?: string };
    mains?: { status?: string; topic?: string };
  };
}

interface StudyTask {
  _id?: string;
  id?: string;
  title: string;
  type?: string;
  subject?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  completed?: boolean;
  isCompleted?: boolean;
  priority?: string;
}

function toMinutes(time?: string) {
  if (!time) return Number.POSITIVE_INFINITY;
  const [h, m] = time.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return Number.POSITIVE_INFINITY;
  return h * 60 + m;
}

function compareTasksByTime(a: StudyTask, b: StudyTask) {
  const startDiff = toMinutes(a.startTime) - toMinutes(b.startTime);
  if (startDiff !== 0) return startDiff;
  const endDiff = toMinutes(a.endTime) - toMinutes(b.endTime);
  if (endDiff !== 0) return endDiff;
  return (a.title || '').localeCompare(b.title || '');
}

function toDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const AddTaskModal = ({
  onClose,
  onTaskAdded,
  selectedTaskDate,
}: {
  onClose: () => void;
  onTaskAdded: (task: StudyTask) => void;
  selectedTaskDate: Date;
}) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [taskType, setTaskType] = useState('reading');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('14:30');

  const TIME_SLOTS = (() => {
    const slots: string[] = [];
    for (let h = 5; h < 24; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
      slots.push(`${String(h).padStart(2, '0')}:30`);
    }
    return slots;
  })();

  const fmtSlot = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h < 12 ? 'AM' : 'PM';
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `${hh}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const handleStartChange = (val: string) => {
    setStartTime(val);
    const [h, m] = val.split(':').map(Number);
    const nextMin = h * 60 + m + 30;
    const nh = Math.floor(nextMin / 60) % 24;
    const nm = nextMin % 60;
    const next = `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
    if (TIME_SLOTS.includes(next)) setEndTime(next);
  };
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!title.trim()) {
      setError('Please enter a task title.');
      return;
    }
    const subjectValue = customSubject.trim() || subject;
    setSaving(true);
    setError('');
    try {
      // Calculate duration in minutes from start/end times
      let duration: number | undefined;
      if (startTime && endTime) {
        const [sh, sm] = startTime.split(':').map(Number);
        const [eh, em] = endTime.split(':').map(Number);
        const diff = (eh * 60 + em) - (sh * 60 + sm);
        if (diff > 0) duration = diff;
      }
      const res = await studyPlannerService.createTask({
        title: title.trim(),
        subject: subjectValue || undefined,
        type: taskType,
        date: toDateParam(selectedTaskDate),
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        duration,
      });
      const created: StudyTask = res?.data ?? { title: title.trim(), subject: subjectValue, startTime, endTime, duration };
      onTaskAdded(created);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      setError(message ? `Failed to save task: ${message}` : 'Failed to save task. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#0e1430] to-[#1a2550] px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5b400" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Custom Study Task
          </h3>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Task Title */}
          <div>
            <label className="block text-sm font-semibold text-[#0e1430] mb-2">Task Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Complete Polity Chapter 5"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#f5b400] focus:outline-none transition-colors text-sm"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold text-[#0e1430] mb-2">Subject</label>
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#f5b400] focus:outline-none transition-colors text-sm bg-white"
            >
              <option value="">Select Subject</option>
              <option value="history">History</option>
              <option value="geography">Geography</option>
              <option value="polity">Polity</option>
              <option value="economy">Economy</option>
              <option value="environment">Environment & Ecology</option>
              <option value="science-tech">Science & Technology</option>
            </select>
            <input
              type="text"
              value={customSubject}
              onChange={e => setCustomSubject(e.target.value)}
              placeholder="Or type your own subject"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#f5b400] focus:outline-none transition-colors text-sm mt-2"
            />
          </div>

          {/* Task Type */}
          <div>
            <label className="block text-sm font-semibold text-[#0e1430] mb-2">Task Type</label>
            <select
              value={taskType}
              onChange={e => setTaskType(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#f5b400] focus:outline-none transition-colors text-sm bg-white"
            >
              <option value="reading">📖 Reading</option>
              <option value="practice">✏️ Practice</option>
              <option value="revision">🔄 Revision</option>
              <option value="notes">📝 Notes Making</option>
              <option value="test">🎯 Test</option>
              <option value="answer">✍️ Answer Writing</option>
              <option value="other">📌 Other</option>
            </select>
          </div>

          {/* Time — keep existing slot dropdowns + auto-fill logic */}
          <div>
            <label className="block text-sm font-semibold text-[#0e1430] mb-2">Time</label>
            <div className="flex items-center gap-3">
              {/* Start */}
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">START</div>
                <select
                  value={startTime}
                  onChange={e => handleStartChange(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#f5b400] focus:outline-none transition-colors text-sm bg-white cursor-pointer"
                >
                  {TIME_SLOTS.map(t => (
                    <option key={t} value={t}>{fmtSlot(t)}</option>
                  ))}
                </select>
              </div>

              {/* Chevron divider */}
              <div className="text-gray-400 mt-5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </div>

              {/* End */}
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">END</div>
                <select
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#f5b400] focus:outline-none transition-colors text-sm bg-white cursor-pointer"
                >
                  {TIME_SLOTS.map(t => (
                    <option key={t} value={t}>{fmtSlot(t)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Duration pill */}
            {(() => {
              const [sh, sm] = startTime.split(':').map(Number);
              const [eh, em] = endTime.split(':').map(Number);
              const diff = (eh * 60 + em) - (sh * 60 + sm);
              if (diff <= 0) return null;
              const hrs = Math.floor(diff / 60);
              const mins = diff % 60;
              const label = hrs > 0 ? (mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`) : `${mins}m`;
              return (
                <div className="mt-2 inline-flex items-center gap-1.5 bg-[#eef1ff] text-[#0e1430] text-xs font-semibold px-3 py-1.5 rounded-full">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {label} session
                </div>
              );
            })()}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 text-sm flex items-center gap-2 bg-gradient-to-b from-[#ffd24a] to-[#f5b400] text-[#1a1407] rounded-[0.7rem] font-bold hover:shadow-lg transition-shadow disabled:opacity-60"
          >
            {saving ? (
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1a1407]" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            )}
            {saving ? 'Saving...' : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ResponsiveDashboardContent = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [showLoginToast, setShowLoginToast] = useState(false);
  const [isReturningLogin, setIsReturningLogin] = useState(false);
  const [selectedTaskDate, setSelectedTaskDate] = useState(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  });

  const userName = getDashboardUserName(user?.firstName, user?.email);
  const greeting = getGreeting();

  useEffect(() => {
    let mounted = true;
    async function fetchDashboard() {
      try {
        const res = await dashboardService.getDashboard();
        if (mounted && res?.data) {
          setDashboardData(res.data);
        }
      } catch {
        // Graceful degradation – keep defaults
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchDashboard();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function fetchTasks() {
      try {
        setTasksLoading(true);
        setTasksError(null);
        const res = await Promise.race([
          studyPlannerService.getTodayTasks(toDateParam(selectedTaskDate)),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 7000)),
        ]);
        if (mounted && res?.data) {
          const fetchedTasks = Array.isArray(res.data) ? res.data : res.data.tasks || [];
          setTasks([...fetchedTasks].sort(compareTasksByTime));
        }
      } catch {
        if (mounted) setTasksError('Could not load tasks quickly. Open Study Planner to sync.');
      } finally {
        if (mounted) setTasksLoading(false);
      }
    }
    fetchTasks();
    return () => { mounted = false; };
  }, [selectedTaskDate]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem('rwj_login_success') !== '1') return;
    const returningFlag = sessionStorage.getItem('rwj_login_returning') === '1';
    setIsReturningLogin(returningFlag);
    sessionStorage.removeItem('rwj_login_returning');
    sessionStorage.removeItem('rwj_login_success');
    setShowLoginToast(true);
    const timeout = setTimeout(() => setShowLoginToast(false), 7000);
    return () => clearTimeout(timeout);
  }, []);

  const trio = dashboardData?.trio;
  const daysRemaining = dashboardData?.daysRemaining ?? null;
  const targetYear = dashboardData?.targetYear || '2026';

  const mcqStatus = trio?.mcq?.status || null;
  const mcqTopic = trio?.mcq?.topic || null;
  const mcqCount = trio?.mcq?.questionCount || 5;
  const editorialStatus = trio?.editorial?.status || null;
  const editorialTopic = trio?.editorial?.topic || null;
  const mainsStatus = trio?.mains?.status || null;
  const mainsTopic = trio?.mains?.topic || null;

  const isMcqCompleted = mcqStatus?.toLowerCase() === 'completed';
  const isEditorialCompleted = editorialStatus?.toLowerCase() === 'completed';
  const isMainsCompleted = mainsStatus?.toLowerCase() === 'completed';

  const isTodayView = selectedTaskDate.toDateString() === new Date().toDateString();
  const taskDateStr = selectedTaskDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const displayTasks = [...tasks].sort(compareTasksByTime);

  function normalizeStatus(status?: string | null) {
    const value = (status || '').toLowerCase();
    if (!value || value === 'available' || value === 'pending') return 'Pending';
    if (value === 'completed') return 'Completed';
    if (value === 'unavailable') return 'Unavailable';
    return status || 'Pending';
  }

  function isTaskCompleted(task: StudyTask) {
    return Boolean(task.completed ?? task.isCompleted);
  }

  async function handleToggleTask(task: StudyTask) {
    const taskId = task._id || task.id;
    if (!taskId || updatingTaskId) return;

    const nextCompleted = !isTaskCompleted(task);
    setUpdatingTaskId(taskId);
    setTasks(prev => prev.map(item =>
      (item._id || item.id) === taskId
        ? { ...item, completed: nextCompleted, isCompleted: nextCompleted }
        : item
    ));

    try {
      await studyPlannerService.updateTask(taskId, { isCompleted: nextCompleted });
    } catch {
      setTasks(prev => prev.map(item =>
        (item._id || item.id) === taskId
          ? { ...item, completed: !nextCompleted, isCompleted: !nextCompleted }
          : item
      ));
    } finally {
      setUpdatingTaskId(null);
    }
  }

  function routeSearch() {
    const q = searchInput.trim().toLowerCase();
    if (!q) {
      router.push('/dashboard/jeet-gpt');
      return;
    }
    if (q.includes('planner') || q.includes('schedule') || q.includes('task')) {
      router.push('/dashboard/study-planner');
      return;
    }
    if (q.includes('mock') || q.includes('test') || q.includes('practice')) {
      router.push('/dashboard/mock-tests');
      return;
    }
    if (q.includes('mcq')) {
      router.push('/dashboard/daily-mcq');
      return;
    }
    if (q.includes('mains') || q.includes('answer')) {
      router.push('/dashboard/daily-answer');
      return;
    }
    router.push('/dashboard/jeet-gpt');
  }

  function formatDuration(mins?: number) {
    if (!mins) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `(${h}h ${m}m)`;
    if (h > 0) return `(${h}h)`;
    return `(${m}m)`;
  }

  return (
    <>
    {showLoginToast && (
      <div className="fixed right-6 top-6 z-[70] w-[min(390px,calc(100vw-32px))] rounded-2xl border border-white/10 bg-[#101827] p-4 text-white shadow-2xl">
        <button
          type="button"
          onClick={() => setShowLoginToast(false)}
          className="absolute right-3 top-3 text-white/45 hover:text-white transition-colors"
          aria-label="Dismiss login message"
        >
          x
        </button>
        <div className="flex gap-3 pr-6">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#22C55E] text-white">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="font-inter text-sm font-bold">Success</p>
            <p className="mt-1 font-inter text-sm leading-5 text-white/70">
              {isReturningLogin ? 'Welcome back' : 'Welcome'}{userName ? `, ${userName}` : ''}. Keep your streak going.
            </p>
          </div>
        </div>
      </div>
    )}
    <div className="w-full min-h-screen py-[clamp(1rem,1.5vw,2rem)] px-[clamp(1rem,2vw,3rem)]" style={{ background: '#FAFBFE' }}>
      <div className="w-full">

        {/* Greeting Card */}
        <div
          className="w-full rounded-[16px] p-[clamp(1rem,1.5vw,1.5rem)] mb-[clamp(0.75rem,1vw,1rem)]"
          style={{
            background: 'linear-gradient(180deg, #090E1C 0%, #10192F 100%)',
          }}
        >
          {/* Greeting Section */}
          <div className="mb-[clamp(0.25rem,0.4vw,0.5rem)]">
            <h1
              className="font-arimo font-bold text-white mb-[clamp(0.4rem,0.6vw,0.6rem)]"
              style={{
                fontSize: 'clamp(24px,1.56vw,30px)',
                lineHeight: '1.2',
                letterSpacing: '0px',
              }}
            >
                  {greeting}{userName ? `, ` : '!'}{userName ? <span style={{ color: '#E8B84B' }}>{userName}!</span> : null}
            </h1>

            <div
              className="font-arimo text-white/90 space-y-1"
              style={{
                fontSize: 'clamp(14px,0.83vw,16px)',
                lineHeight: '1.5',
                letterSpacing: '0px',
              }}
            >
              <p>Welcome to your personalized command center for UPSC {targetYear} preparation.</p>
              <p className="font-bold text-white">Ready to rise up? Let&apos;s make today count.</p>
            </div>
          </div>

          {/* Countdown Section */}
          <div
            className="px-[clamp(1rem,1.04vw,1.25rem)] py-[clamp(0.75rem,0.83vw,1rem)] rounded-[4px] flex items-center gap-3"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderLeft: '4px solid #FDC700',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/red.png" alt="Calendar" className="w-[clamp(16px,1.04vw,20px)] h-[clamp(16px,1.04vw,20px)] flex-shrink-0" />
            <p
              className="font-arimo text-white"
              style={{
                fontSize: 'clamp(13px,0.83vw,16px)',
                lineHeight: '1.43',
                letterSpacing: '0px',
              }}
            >
              UPSC Prelims {targetYear}: {daysRemaining !== null ? `${daysRemaining} days remaining` : '– days remaining'}.
            </p>
          </div>
        </div>

        {/* Search Bar & Action Buttons */}
        <div className="flex flex-wrap gap-[clamp(0.75rem,1.04vw,1.25rem)] items-center mb-[clamp(0.75rem,1vw,1.25rem)]">
          {/* Search Bar */}
          <div
            className="flex-1 min-w-[280px] flex items-center gap-[clamp(0.5rem,0.68vw,0.75rem)] px-[clamp(1.25rem,1.56vw,1.75rem)] rounded-[40px] bg-[#DAE2FF]"
            style={{
              height: 'clamp(48px,2.8vw,56px)',
            }}
          >
            <svg
              className="w-[clamp(16px,1.04vw,20px)] h-[clamp(16px,1.04vw,20px)] flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="11" cy="11" r="7" stroke="#6B7280" strokeWidth="2"/>
              <path d="M20 20L16.5 16.5" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Ask Jeet AI Mentor: 'Fundamental Rights vs DPSP'"
              value={searchInput}
              onFocus={() => router.push('/dashboard/jeet-gpt')}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') routeSearch();
              }}
              className="flex-1 bg-transparent outline-none font-inter text-black placeholder:text-black"
              style={{
                fontSize: 'clamp(14px,0.83vw,16px)',
                lineHeight: '1',
              }}
            />
          </div>

          {/* Add Task Button */}
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="px-[clamp(1.25rem,1.46vw,1.75rem)] rounded-[20px] font-inter font-medium text-white border-2 flex items-center gap-2 hover:opacity-90 transition-opacity"
            style={{
              height: 'clamp(48px,2.8vw,56px)',
              fontSize: 'clamp(14px,0.78vw,15px)',
              background: '#17223E',
              borderColor: '#17223E',
              boxShadow: '0px 4px 17.1px 0px rgba(255, 255, 255, 0.06) inset',
            }}
          >
            <svg
              className="w-[clamp(14px,0.83vw,16px)] h-[clamp(14px,0.83vw,16px)]"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <span>Add Task</span>
          </button>

          {/* Schedule Button */}
          <Link href="/dashboard/study-planner">
            <button
              className="px-[clamp(1.25rem,1.46vw,1.75rem)] rounded-[20px] font-inter font-medium border-2 hover:bg-[#17223E] hover:text-white transition-colors flex items-center gap-2"
              style={{
                height: 'clamp(48px,2.8vw,56px)',
                fontSize: 'clamp(14px,0.78vw,15px)',
                background: 'rgba(255, 255, 255, 0.11)',
                borderColor: '#17223E',
                color: '#17223E',
                boxShadow: '0px 4px 17.1px 0px rgba(255, 255, 255, 0.06) inset',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/calendar-icon.png"
                alt="Calendar"
                className="w-[clamp(14px,0.83vw,16px)] h-[clamp(14px,0.83vw,16px)]"
              />
              <span>Schedule</span>
            </button>
          </Link>

          {/* Generate Test Button */}
          <Link href="/dashboard/mock-tests">
            <button
              className="px-[clamp(1.25rem,1.46vw,1.75rem)] rounded-[20px] font-inter font-medium text-white border-2 flex items-center gap-2 hover:opacity-90 transition-opacity"
              style={{
                height: 'clamp(48px,2.8vw,56px)',
                fontSize: 'clamp(14px,0.78vw,15px)',
                background: 'linear-gradient(135deg, #FDC700 0%, #FF8904 100%)',
                borderColor: '#FDC700',
                boxShadow: '0px 4px 17.1px 0px rgba(253, 199, 0, 0.3) inset',
              }}
              aria-label="Generate Test"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/rocket.png"
                alt=""
                aria-hidden="true"
                className="w-[clamp(14px,0.83vw,16px)] h-[clamp(14px,0.83vw,16px)] object-contain"
              />
              <span>Practice Test</span>
            </button>
          </Link>
        </div>

        {/* Today's Trio Section */}
        <div
          className="mb-[clamp(1rem,1.25vw,1.5rem)] rounded-[14px] p-[clamp(0.75rem,1vw,1.25rem)]"
          style={{
            background: '#FFFFFF',
            border: '0.8px solid #E5E7EB',
          }}
        >
          <div className="flex items-center gap-2 mb-[clamp(0.5rem,0.75vw,0.75rem)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/dashboard/trio-header.png" alt="Today's Trio" className="w-[clamp(18px,1.25vw,22px)] h-[clamp(18px,1.25vw,22px)]" />
            <h2 className="font-inter font-bold text-[clamp(18px,1.2vw,20px)] text-[#1A1A1A]">
              Today{'\''}s Trio
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#17223E]"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[clamp(0.75rem,1vw,1rem)]">
              {/* Daily MCQ Card */}
              <Link
                href="/dashboard/daily-mcq"
                aria-label="Open Daily MCQ"
                className="block bg-[#F9FAFB] rounded-[14px] border p-[clamp(0.75rem,1vw,1.25rem)] relative cursor-pointer h-full flex flex-col transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg"
                style={{ borderColor: isMcqCompleted ? '#22C55E' : '#E5E7EB', borderTop: '3px solid #22C55E' }}
              >
                {isMcqCompleted && (
                  <div className="absolute top-4 right-4 w-8 h-8 bg-[#22C55E] rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}

                <div className="mb-1 py-0 text-[clamp(12px,0.73vw,13px)] invisible">AI Evaluation</div>

                <div className="flex items-center gap-3 mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/target-icon.png"
                    alt="MCQ"
                    className="w-7 h-7 object-contain"
                  />
                  <h3 className="font-inter font-bold text-[clamp(18px,1.15vw,20px)] text-[#1A1A1A]">
                    Daily MCQ Challenge
                  </h3>
                </div>

                <p className="font-inter text-[clamp(14px,0.83vw,15px)] text-gray-600 mb-2">
                  <span className={`font-medium ${isMcqCompleted ? 'text-green-600' : ''}`}>Status: {normalizeStatus(mcqStatus)}</span>
                </p>
                <p className="font-inter text-[clamp(14px,0.83vw,15px)] text-[#1A1A1A] font-medium mb-3 flex-grow">
                  {mcqCount} Questions{mcqTopic ? ` - ${mcqTopic}` : ''}
                </p>

                {isMcqCompleted ? (
                  <div className="w-full bg-[#17223E] text-white rounded-[8px] py-2 px-4 font-inter font-medium text-[clamp(13px,0.78vw,14px)] hover:bg-[#1E2875] transition-colors flex items-center justify-center gap-2" role="button">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/mcq-completed-icon.png" alt="" className="w-[22px] h-[16px] object-contain flex-shrink-0" />
                    <span>Completed</span>
                  </div>
                ) : (
                  <div className="w-full bg-[#17223E] text-white rounded-[8px] py-2 px-4 font-inter font-medium text-[clamp(13px,0.78vw,14px)] hover:bg-[#1E2875] transition-colors flex items-center justify-center gap-2" role="button">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/TrioCard (1).png" alt="Attempt" className="w-5 h-5" />
                    Attempt Now
                  </div>
                )}
              </Link>

              {/* Mains Question Card */}
              <Link href="/dashboard/daily-answer" className="block h-full">
              <div
                className="bg-[#F9FAFB] rounded-[14px] border p-[clamp(0.75rem,1vw,1.25rem)] h-full flex flex-col transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg cursor-pointer relative"
                style={{ borderColor: isMainsCompleted ? '#22C55E' : '#E5E7EB', borderTop: '3px solid #94A3B8' }}
              >
                {isMainsCompleted && (
                  <div className="absolute top-4 right-4 w-8 h-8 bg-[#22C55E] rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
                <div className="mb-1 py-0 text-[clamp(12px,0.73vw,13px)] invisible">Status</div>

                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[26px] leading-none" aria-hidden="true">✍️</span>
                  <h3 className="font-inter font-bold text-[clamp(18px,1.15vw,20px)] text-[#1A1A1A]">
                    Daily Mains Challenge
                  </h3>
                </div>

                <p className="font-inter text-[clamp(14px,0.83vw,15px)] text-gray-600 mb-2">
                  <span className={`font-medium ${isMainsCompleted ? 'text-green-600' : ''}`}>Status: {normalizeStatus(mainsStatus)}</span>
                </p>
                <p className="font-inter text-[clamp(14px,0.83vw,15px)] text-[#1A1A1A] font-medium mb-3 flex-grow">
                  {mainsTopic || '–'}
                </p>

                {isMainsCompleted ? (
                  <div className="w-full bg-[#17223E] text-white rounded-[8px] py-2 px-4 font-inter font-medium text-[clamp(13px,0.78vw,14px)] hover:bg-[#1E2875] transition-colors flex items-center justify-center gap-2" role="button">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/mcq-completed-icon.png" alt="" className="w-[22px] h-[16px] object-contain flex-shrink-0" />
                    Completed
                  </div>
                ) : (
                  <div className="w-full bg-[#17223E] text-white rounded-[8px] py-2 px-4 font-inter font-medium text-[clamp(13px,0.78vw,14px)] hover:bg-[#1E2875] transition-colors flex items-center justify-center gap-2" role="button">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/TrioCard (1).png" alt="Attempt" className="w-5 h-5" />
                    Attempt Now
                  </div>
                )}
              </div>
              </Link>

              {/* Daily Editorial Card */}
              <Link href="/dashboard/daily-editorial" className="block h-full">
              <div
                className="bg-[#F9FAFB] rounded-[14px] border p-[clamp(0.75rem,1vw,1.25rem)] h-full flex flex-col transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg cursor-pointer relative"
                style={{ borderColor: isEditorialCompleted ? '#22C55E' : '#E5E7EB', borderTop: '3px solid #F59E0B' }}
              >
                {isEditorialCompleted && (
                  <div className="absolute top-4 right-4 w-8 h-8 bg-[#22C55E] rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
                <div className="mb-1 py-0 text-[clamp(12px,0.73vw,13px)] invisible">Status</div>

                <div className="flex items-center gap-3 mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icons/dashboard/editorial.png" alt="Editorial" className="w-7 h-7" />
                  <h3 className="font-inter font-bold text-[clamp(18px,1.15vw,20px)] text-[#1A1A1A]">
                    Daily Editorial Analysis
                  </h3>
                </div>

                <p className="font-inter text-[clamp(14px,0.83vw,15px)] text-gray-600 mb-2">
                  <span className={`font-medium ${isEditorialCompleted ? 'text-green-600' : ''}`}>Status: {normalizeStatus(editorialStatus)}</span>
                </p>
                <p className="font-inter text-[clamp(14px,0.83vw,15px)] text-[#1A1A1A] font-medium mb-3 flex-grow">
                  {editorialTopic || '–'}
                </p>

                {isEditorialCompleted ? (
                  <div className="w-full bg-[#17223E] text-white rounded-[8px] py-2 px-4 font-inter font-medium text-[clamp(13px,0.78vw,14px)] hover:bg-[#1E2875] transition-colors flex items-center justify-center gap-2" role="button">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/mcq-completed-icon.png" alt="" className="w-[22px] h-[16px] object-contain flex-shrink-0" />
                    Completed
                  </div>
                ) : (
                  <div className="w-full bg-[#17223E] text-white rounded-[8px] py-2 px-4 font-inter font-medium text-[clamp(13px,0.78vw,14px)] hover:bg-[#1E2875] transition-colors flex items-center justify-center gap-2" role="button">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/TrioCard.png" alt="Read" className="w-5 h-5" />
                    Read Now
                  </div>
                )}
              </div>
              </Link>
            </div>
          )}
        </div>

        {/* Today's Study Tasks Section */}
        <div
          className="mb-[clamp(2rem,2.5vw,3rem)] rounded-[14px] p-[clamp(1.25rem,1.5vw,1.75rem)]"
          style={{
            background: '#FFFFFF',
            border: '0.8px solid #E5E7EB',
          }}
        >
          <div className="flex items-center justify-between mb-[clamp(1rem,1.25vw,1.5rem)]">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/dashboard/tasks-header.png" alt="Today's Study Tasks" className="w-[clamp(18px,1.25vw,22px)] h-[clamp(18px,1.25vw,22px)]" />
              <h2 className="font-inter font-bold text-[clamp(18px,1.2vw,20px)] text-[#1A1A1A]">
                Today{'\''}s Study Tasks
              </h2>
              <Link
                href="/dashboard/study-planner"
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#3B5BDB] px-3 py-1 rounded-full transition-all hover:bg-[#EEF1FF]"
                style={{ background: '#F0F4FF' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3B5BDB" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                Open Study Planner
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const prev = new Date(selectedTaskDate);
                  prev.setDate(prev.getDate() - 1);
                  setSelectedTaskDate(prev);
                }}
                className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18l-6-6 6-6" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <span className="font-inter text-[clamp(13px,0.73vw,14px)] text-gray-400 px-4">
                {isTodayView ? 'Today' : 'Selected Day'} {'\u2022'} {taskDateStr}
              </span>
              <button
                type="button"
                onClick={() => {
                  const next = new Date(selectedTaskDate);
                  next.setDate(next.getDate() + 1);
                  setSelectedTaskDate(next);
                }}
                className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          {tasksError && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-700">
              {tasksError}
            </div>
          )}

          {tasksLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#17223E]"></div>
            </div>
          ) : displayTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <svg className="w-10 h-10 mb-3 text-gray-300" viewBox="0 0 24 24" fill="none">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="font-inter text-[14px]">No tasks scheduled for today.</p>
              <p className="font-inter text-[13px] mt-1">Add a custom task to get started.</p>
            </div>
          ) : (
            <>
              {displayTasks.map((task, index) => {
                const completed = isTaskCompleted(task);
                // Green left border only for completed tasks; incomplete tasks use a normal grey border.
                const leftBorderColor = completed ? '#22C55E' : '#E5E7EB';
                const taskId = task._id || task.id || '';
                const timeLabel = task.startTime && task.endTime
                  ? `${task.startTime} - ${task.endTime} ${formatDuration(task.duration)}`
                  : task.duration ? formatDuration(task.duration) : '';

                return (
                  <div
                    key={task._id || task.id || index}
                    className={`rounded-lg border border-[#E5E7EB] border-l-4 p-[clamp(0.75rem,1vw,1.25rem)] mb-[clamp(0.75rem,1vw,1rem)] flex items-start justify-between ${completed ? 'bg-green-50' : 'bg-[#F9FAFB]'}`}
                    style={{ boxShadow: '0 1px 1px rgba(16, 24, 40, 0.04)', borderLeftColor: leftBorderColor }}
                  >
                    <div className="flex-1">
                      <Link href="/dashboard/study-planner" className="block">
                        <h3 className={`font-inter font-semibold text-[clamp(14px,0.94vw,16px)] mb-2 ${completed ? 'text-green-700 line-through' : 'text-[#1A1A1A]'}`}>
                          {task.title}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[clamp(12px,0.68vw,13px)] font-medium text-blue-600" style={{ background: '#DBEAFE' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/b.png" alt="Type" className="w-3.5 h-3.5" />
                          {(() => { const t = task.type || 'Reading'; return t.charAt(0).toUpperCase() + t.slice(1); })()}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[clamp(12px,0.68vw,13px)] font-medium text-purple-700" style={{ background: '#F3E8FF' }}>
                          {task.subject ? `${getSubjectEmoji(task.subject)} ${task.subject}` : '📚 General'}
                        </span>
                        {timeLabel && (
                          <span className="inline-flex items-center gap-1 text-gray-600 text-[clamp(12px,0.68vw,13px)]">
                            <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                              {/* bells */}
                              <ellipse cx="5" cy="5" rx="2.6" ry="2" transform="rotate(-40 5 5)" fill="#dc2626" />
                              <ellipse cx="19" cy="5" rx="2.6" ry="2" transform="rotate(40 19 5)" fill="#dc2626" />
                              {/* feet */}
                              <path d="M6 19l-1.6 2.2M18 19l1.6 2.2" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" />
                              {/* body */}
                              <circle cx="12" cy="13" r="8" fill="#ef4444" />
                              <circle cx="12" cy="13" r="5.6" fill="#fff" />
                              {/* hands + center */}
                              <path d="M12 13V9.2M12 13l2.4 1.4" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" />
                              <circle cx="12" cy="13" r="0.9" fill="#dc2626" />
                            </svg>
                            {timeLabel}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleTask(task)}
                      disabled={updatingTaskId === taskId}
                      className={`ml-3 w-6 h-6 rounded border-2 transition-colors flex items-center justify-center flex-shrink-0 ${
                        completed ? 'border-green-600 bg-green-600' : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
                      } ${updatingTaskId === taskId ? 'opacity-60' : ''}`}
                    >
                      {completed && (
                        <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none">
                          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  </div>
                );
              })}
            </>
          )}

          {/* Add Custom Task */}
          <div
            onClick={() => setShowAddTaskModal(true)}
            className="group rounded-xl border-2 border-dashed border-[#f5b400]/40 bg-gradient-to-br from-[#fffdf5] to-[#fff9e6] p-[clamp(0.75rem,1vw,1.25rem)] mb-[clamp(0.75rem,1vw,1rem)] flex items-center justify-between cursor-pointer transition-all duration-200 ease-out hover:border-[#f5b400]/70 hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3">
              <div className="w-[clamp(40px,2.6vw,48px)] h-[clamp(40px,2.6vw,48px)] bg-gradient-to-br from-[#f5b400] to-[#ffcb3a] rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <h3 className="font-inter font-bold text-[clamp(14px,0.94vw,16px)] text-[#0e1430]">
                  Add Custom Task
                </h3>
                <p className="font-inter text-[clamp(12px,0.68vw,13px)] text-gray-600">
                  Create your own study task for today
                </p>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setShowAddTaskModal(true); }}
              className="px-[clamp(1rem,1.25vw,1.5rem)] py-[clamp(0.4rem,0.52vw,0.6rem)] bg-gradient-to-b from-[#ffd24a] to-[#f5b400] text-[#1a1407] rounded-[0.7rem] font-inter font-bold text-[clamp(12px,0.68vw,13px)] group-hover:shadow-lg transition-shadow flex items-center gap-1.5 flex-shrink-0"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              Add Task
            </button>
          </div>

          {/* Start Focus Session Button */}
          <button
            onClick={() => router.push('/dashboard/study-groups?tab=solo&autostart=1')}
            className="w-full bg-[#0e1430] text-white rounded-[0.6rem] py-[clamp(0.75rem,1vw,1rem)] font-inter font-semibold text-[clamp(14px,0.94vw,16px)] hover:bg-[#1a2150] transition-colors flex items-center justify-center gap-2"
          >
            <span aria-hidden="true">▶️</span>
            Start Focus Session
          </button>
        </div>

      </div>
    </div>

      {showAddTaskModal && (
        <AddTaskModal
          onClose={() => setShowAddTaskModal(false)}
          selectedTaskDate={selectedTaskDate}
          onTaskAdded={(task) => setTasks(prev => [...prev, task].sort(compareTasksByTime))}
        />
      )}
    </>
  );
};

export default ResponsiveDashboardContent;
