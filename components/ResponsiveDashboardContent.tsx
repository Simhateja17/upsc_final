'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardService, studyPlannerService, syllabusService } from '@/lib/services';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

interface DashboardData {
  daysRemaining?: number;
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

const COLD_BLUE = '#E9EEF5';
const COLD_BLUE_DARK = '#D8DEE8';

const borderColors: Record<string, string> = {
  high: '#FF6467',
  medium: '#22C55E',
  low: '#EAB308',
};

const borderColorsFallback = ['#FF6467', '#22C55E', '#EAB308'];

interface NotificationItem {
  id: string;
  icon: string;
  iconBg: string;
  title: string;
  time: string;
  read: boolean;
}

const notificationsData: NotificationItem[] = [
  {
    id: '1',
    icon: '🔥',
    iconBg: '#FEF3C7',
    title: '7-day streak! Top 8% of aspirants',
    time: 'Just now',
    read: false,
  },
  {
    id: '2',
    icon: '✅',
    iconBg: '#D1FAE5',
    title: 'Your answer has been evaluated — Score: 7.5/10',
    time: '2 hours ago',
    read: false,
  },
  {
    id: '3',
    icon: '📰',
    iconBg: '#E9EEF5',
    title: "Today's current affairs are ready",
    time: 'This morning',
    read: true,
  },
  {
    id: '4',
    icon: '📝',
    iconBg: '#E9EEF5',
    title: 'New mock test available — GS Prelims Test 15',
    time: 'Yesterday',
    read: true,
  },
];

const NotificationModal = ({ onClose }: { onClose: () => void }) => {
  const [notifications, setNotifications] = useState(notificationsData);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-[440px] mx-4 relative overflow-hidden"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E7EB]">
          <h2 className="font-inter font-bold text-[18px] text-[#1A1A1A]">Notifications</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">✕</button>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`px-6 py-4 flex items-start gap-3 border-b border-[#F3F4F6] ${notif.read ? 'opacity-70' : ''}`}
              style={notif.read ? {} : { background: '#FAFBFE' }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                style={{ background: notif.iconBg }}
              >
                {notif.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-inter text-[14px] text-[#1A1A1A] leading-[20px]">{notif.title}</p>
                <p className="font-inter text-[12px] text-[#9CA3AF] mt-1">{notif.time}</p>
              </div>
              {!notif.read && (
                <div className="w-2 h-2 rounded-full bg-[#6366F1] flex-shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>

        <div className="px-6 py-4 flex items-center justify-between border-t border-[#E5E7EB] bg-[#FAFBFE]">
          <button
            onClick={onClose}
            className="font-inter text-[13px] text-[#6B7280] hover:text-[#374151] px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
          <button
            onClick={markAllRead}
            className="font-inter text-[13px] text-[#6366F1] font-medium hover:text-[#4F46E5] px-4 py-2 rounded-lg hover:bg-[#EEF2FF] transition-colors"
          >
            Mark all read
          </button>
        </div>
      </div>
    </div>
  );
};

const AddTaskModal = ({ onClose, onTaskAdded }: { onClose: () => void; onTaskAdded: (task: StudyTask) => void }) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('15:30');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!title.trim()) {
      setError('Please enter a task title.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      let duration: number | undefined;
      if (startTime && endTime) {
        const [sh, sm] = startTime.split(':').map(Number);
        const [eh, em] = endTime.split(':').map(Number);
        const diff = (eh * 60 + em) - (sh * 60 + sm);
        if (diff > 0) duration = diff;
      }
      const res = await studyPlannerService.createTask({
        title: title.trim(),
        subject: subject || undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        duration,
      });
      const created: StudyTask = res?.data ?? { title: title.trim(), subject, startTime, endTime, duration };
      onTaskAdded(created);
      onClose();
    } catch {
      setError('Failed to save task. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-8 w-full max-w-[520px] mx-4 relative"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-inter font-bold text-[22px] text-[#17223E]">Add Custom Study Task</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-gray-500 font-medium text-[16px]"
          >
            ✕
          </button>
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="mb-5">
          <label className="block font-inter font-medium text-[14px] text-[#6366F1] mb-2">Task Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g., Complete Polity Chapter 5"
            className="w-full border-2 border-[#6366F1] rounded-xl px-4 py-3 font-inter text-[14px] text-gray-500 outline-none focus:border-[#4F46E5] transition-colors"
          />
        </div>

        <div className="mb-5">
          <label className="block font-inter font-medium text-[14px] text-[#6366F1] mb-2">Subject</label>
          <select
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 font-inter text-[14px] text-gray-500 outline-none focus:border-[#6366F1] bg-white transition-colors appearance-auto"
          >
            <option value="">Select Subject</option>
            <option value="indian-polity">Indian Polity</option>
            <option value="history">History</option>
            <option value="geography">Geography</option>
            <option value="economics">Economics</option>
            <option value="environment">Environment</option>
            <option value="current-affairs">Current Affairs</option>
            <option value="science-tech">Science & Technology</option>
          </select>
        </div>

        <div className="mb-7">
          <label className="block font-inter font-medium text-[14px] text-[#6366F1] mb-2">Time</label>
          <div className="flex gap-4">
            <input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 font-inter text-[14px] text-gray-700 outline-none focus:border-[#6366F1] transition-colors"
            />
            <input
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 font-inter text-[14px] text-gray-700 outline-none focus:border-[#6366F1] transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 border-2 border-gray-200 rounded-xl py-3 font-inter font-medium text-[15px] text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>✕</span> Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-xl py-3 font-inter font-medium text-[15px] text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
          >
            {saving ? (
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v14a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 21v-8H7v8M7 3v5h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            {saving ? 'Saving...' : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ResponsiveDashboardContent = () => {
  const { user } = useAuth();
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isBreak, setIsBreak] = useState(false);
  const [showLoginToast, setShowLoginToast] = useState(false);

  // Syllabus coverage from tracker
  const [syllabusCoverage, setSyllabusCoverage] = useState<{ subject: string; percentage: number; color: string }[]>([]);
  const [syllabusLoading, setSyllabusLoading] = useState(true);

  // Calendar date navigation
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarTasks, setCalendarTasks] = useState<StudyTask[]>([]);

  const userName = user?.firstName || '';
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
        const res = await studyPlannerService.getTodayTasks();
        if (mounted && res?.data) {
          setTasks(Array.isArray(res.data) ? res.data : res.data.tasks || []);
        }
      } catch {
      } finally {
        if (mounted) setTasksLoading(false);
      }
    }
    fetchTasks();
    return () => { mounted = false; };
  }, []);

  // Fetch syllabus coverage from syllabus tracker
  useEffect(() => {
    let mounted = true;
    async function fetchSyllabusCoverage() {
      try {
        const res = await syllabusService.getSyllabus();
        if (mounted && res?.data) {
          const data = res.data;
          const coverage: { subject: string; percentage: number; color: string }[] = [];
          const allSubjects = [
            ...(data.prelims || []),
            ...(data.mains || []),
            ...(data.optional || []),
          ];
          allSubjects.forEach((subject: any) => {
            let total = 0;
            let done = 0;
            (subject.topics || []).forEach((topic: any) => {
              (topic.subs || []).forEach(() => {
                total++;
              });
            });
            // For now, calculate from localStorage tracker states if available
            const saved = localStorage.getItem('syllabusTrackerState');
            if (saved) {
              try {
                const states = JSON.parse(saved);
                (subject.topics || []).forEach((topic: any, ti: number) => {
                  (topic.subs || []).forEach((_sub: any, si: number) => {
                    const key = `${subject.id}__${ti}__${si}`;
                    if (states[key]?.status === 'done') done++;
                  });
                });
              } catch {}
            }
            coverage.push({
              subject: subject.short || subject.name,
              percentage: total > 0 ? Math.round((done / total) * 100) : 0,
              color: subject.color || '#1E2875',
            });
          });
          if (mounted) setSyllabusCoverage(coverage);
        }
      } catch {
      } finally {
        if (mounted) setSyllabusLoading(false);
      }
    }
    fetchSyllabusCoverage();
    return () => { mounted = false; };
  }, []);

  // Fetch tasks for selected calendar date
  useEffect(() => {
    let mounted = true;
    async function fetchCalendarTasks() {
      try {
        // Format date as YYYY-MM-DD in local timezone
        const y = selectedDate.getFullYear();
        const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const d = String(selectedDate.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;
        const res = await studyPlannerService.getTodayTasks(dateStr);
        if (mounted && res?.data) {
          const allTasks = Array.isArray(res.data) ? res.data : res.data.tasks || [];
          setCalendarTasks(allTasks);
        }
      } catch {
      }
    }
    fetchCalendarTasks();
    return () => { mounted = false; };
  }, [selectedDate]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            setTimerRunning(false);
            setIsBreak(b => !b);
            return isBreak ? 25 * 60 : 5 * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [timerRunning, timerSeconds, isBreak]);

  useEffect(() => {
    const shouldShowToast = sessionStorage.getItem('rwj_login_success') === '1';
    if (!shouldShowToast) return;

    sessionStorage.removeItem('rwj_login_success');
    setShowLoginToast(true);
    const timer = setTimeout(() => setShowLoginToast(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const trio = dashboardData?.trio;
  const prelimsDate = new Date(2026, 4, 24);
  const daysRemaining = Math.max(0, Math.ceil((prelimsDate.getTime() - Date.now()) / 86400000));

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

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const isToday = selectedDate.toDateString() === new Date().toDateString();

  const displayTasks = isToday ? tasks : calendarTasks;

  function formatStatus(status?: string | null) {
    if (!status || status === 'available') return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  function isTaskComplete(task: StudyTask) {
    return Boolean(task.completed ?? task.isCompleted);
  }

  async function handleToggleTask(task: StudyTask, index: number) {
    const taskId = task._id || task.id;
    const nextCompleted = !isTaskComplete(task);

    setTasks(prev => prev.map((item, itemIndex) =>
      itemIndex === index ? { ...item, completed: nextCompleted, isCompleted: nextCompleted } : item
    ));

    if (!taskId) return;

    try {
      await studyPlannerService.updateTask(taskId, { isCompleted: nextCompleted, completed: nextCompleted });
    } catch {
      setTasks(prev => prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, completed: !nextCompleted, isCompleted: !nextCompleted } : item
      ));
    }
  }

  function formatTimerTime(totalSeconds: number) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  function handleStartFocusSession() {
    if (timerRunning) {
      setTimerRunning(false);
    } else {
      if (timerSeconds <= 0) {
        setTimerSeconds(isBreak ? 5 * 60 : 25 * 60);
      }
      setTimerRunning(true);
    }
  }

  function handleResetFocusSession() {
    setTimerRunning(false);
    setIsBreak(false);
    setTimerSeconds(25 * 60);
  }

  function formatDuration(mins?: number) {
    if (!mins) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `(${h}h ${m}m)`;
    if (h > 0) return `(${h}h)`;
    return `(${m}m)`;
  }

  // Calendar navigation
  const prevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };
  const nextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };
  const selectedDateStr = selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  // Pie chart helper
  function pieSlicePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    return `M ${cx} ${cy} L ${x1.toFixed(3)} ${y1.toFixed(3)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(3)} ${y2.toFixed(3)} Z`;
  }

  // Time distribution data (mock based on task types)
  const timeDistributionData = [
    { label: 'Video Lectures', minutes: 210, color: '#FF6B6B' },
    { label: 'Reading', minutes: 120, color: '#2DD4BF' },
    { label: 'Practice', minutes: 90, color: '#FBBF24' },
    { label: 'Answer Writing', minutes: 60, color: '#34D399' },
  ].filter(d => d.minutes > 0);
  const totalTimeMins = timeDistributionData.reduce((s, d) => s + d.minutes, 0);
  const fmtHours = (m: number) => (m / 60 % 1 === 0 ? (m / 60).toFixed(0) : (m / 60).toFixed(1)) + 'h';

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
              Welcome back{userName ? `, ${userName}` : ''}. Keep your streak going.
            </p>
          </div>
        </div>
      </div>
    )}
    <div className="w-full min-h-screen py-[clamp(0.5rem,1vw,1rem)] px-[clamp(0.5rem,1vw,1rem)]" style={{ background: '#E9EEF5' }}>
      <div className="max-w-[1400px] mx-auto">

        {/* Notification Bell */}
        <div className="flex justify-end mb-3">
          <button
            onClick={() => setShowNotificationModal(true)}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/60 transition-colors"
            style={{ background: 'rgba(255,255,255,0.5)' }}
          >
            <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">3</span>
          </button>
        </div>

        {/* Greeting Card */}
        <div
          className="w-full rounded-[16px] p-[clamp(0.75rem,1.25vw,1.25rem)] mb-[clamp(0.5rem,1vw,1rem)] relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0B1A2E 0%, #0F2847 40%, #0D1F3C 100%)',
            boxShadow: '0px 4px 24px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div
            className="absolute -right-16 -top-16 w-64 h-64 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(100, 160, 255, 0.12) 0%, rgba(50, 100, 200, 0.05) 40%, transparent 70%)',
              filter: 'blur(20px)',
            }}
          />
          <div
            className="absolute -right-8 top-8 w-40 h-40 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(140, 180, 255, 0.08) 0%, transparent 60%)',
              filter: 'blur(15px)',
            }}
          />
          <div className="mb-[clamp(0.25rem,0.5vw,0.5rem)]">
            <h1
              className="font-arimo font-bold text-white mb-[clamp(0.25rem,0.5vw,0.5rem)]"
              style={{
                fontSize: 'clamp(20px,1.3vw,26px)',
                lineHeight: '1.2',
                letterSpacing: '0px',
              }}
            >
              {greeting}{userName ? `, ` : '!'}{userName ? <span style={{ color: '#FFB954' }}>{userName}!</span> : null}
            </h1>

            <div
              className="font-arimo text-white/90 space-y-0.5"
              style={{
                fontSize: 'clamp(12px,0.73vw,14px)',
                lineHeight: '1.4',
                letterSpacing: '0px',
              }}
            >
              <p>Welcome to your personalized command center for UPSC 2026 preparation.</p>
              <p className="font-bold text-white">Ready to rise up? Let&apos;s make today count.</p>
            </div>
          </div>

          <div
            className="px-[clamp(0.5rem,0.75vw,1rem)] py-[clamp(0.4rem,0.5vw,0.5rem)] rounded-[4px] flex items-center gap-2"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderLeft: '3px solid #FF8904',
            }}
          >
            <svg width="clamp(14px,0.83vw,16px)" height="clamp(14px,0.83vw,16px)" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
              <rect x="3.5" y="4.5" width="17" height="16" rx="2.5" stroke="white" strokeWidth="2" />
              <path d="M8 2.5V6.5M16 2.5V6.5M3.5 9.5H20.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p
              className="font-arimo text-white"
              style={{
                fontSize: 'clamp(11px,0.73vw,14px)',
                lineHeight: '1.4',
                letterSpacing: '0px',
              }}
            >
              UPSC Prelims 2026: {daysRemaining !== null ? `${daysRemaining} days remaining` : '— days remaining'}.
            </p>
          </div>
        </div>

        {/* Search Bar & Action Buttons */}
        <div className="flex flex-wrap gap-[clamp(0.5rem,0.75vw,0.75rem)] items-center mb-[clamp(0.75rem,1.25vw,1.25rem)]">
          <div
            className="flex-1 min-w-[280px] flex items-center gap-[clamp(0.5rem,0.68vw,0.75rem)] px-[clamp(1rem,1.25vw,1.5rem)] rounded-[40px] bg-[#DAE2FF]"
            style={{
              height: 'clamp(40px,2.4vw,48px)',
            }}
          >
            <svg
              className="w-[clamp(14px,0.83vw,18px)] h-[clamp(14px,0.83vw,18px)] flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="11" cy="11" r="7" stroke="#6B7280" strokeWidth="2"/>
              <path d="M20 20L16.5 16.5" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Ask Jeet AI: 'Explain current affairs'"
              className="flex-1 bg-transparent outline-none font-inter text-black placeholder:text-black"
              style={{
                fontSize: 'clamp(12px,0.73vw,14px)',
                lineHeight: '1',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  window.location.href = '/dashboard/jeet-gpt';
                }
              }}
            />
          </div>

          <button
            onClick={() => setShowAddTaskModal(true)}
            className="px-[clamp(1rem,1.25vw,1.5rem)] rounded-[20px] font-inter font-medium text-white border-2 flex items-center gap-2 hover:opacity-90 transition-opacity"
            style={{
              height: 'clamp(40px,2.4vw,48px)',
              fontSize: 'clamp(12px,0.68vw,14px)',
              background: '#17223E',
              borderColor: '#17223E',
              boxShadow: '0px 4px 17.1px 0px rgba(255, 255, 255, 0.06) inset',
            }}
          >
            <svg
              className="w-[clamp(12px,0.68vw,14px)] h-[clamp(12px,0.68vw,14px)]"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <span>Add Task</span>
          </button>

          <Link href="/dashboard/study-planner">
            <button
              className="px-[clamp(1rem,1.25vw,1.5rem)] rounded-[20px] font-inter font-medium border-2 hover:bg-[#17223E] hover:text-white transition-colors flex items-center gap-2"
              style={{
                height: 'clamp(40px,2.4vw,48px)',
                fontSize: 'clamp(12px,0.68vw,14px)',
                background: 'rgba(255, 255, 255, 0.11)',
                borderColor: '#17223E',
                color: '#17223E',
                boxShadow: '0px 4px 17.1px 0px rgba(255, 255, 255, 0.06) inset',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/c.png"
                alt="Calendar"
                className="w-[clamp(12px,0.68vw,14px)] h-[clamp(12px,0.68vw,14px)]"
              />
              <span>Schedule</span>
            </button>
          </Link>

          <Link href="/dashboard/mock-tests">
            <button
              className="px-[clamp(1rem,1.25vw,1.5rem)] rounded-[20px] font-inter font-medium text-white border-2 flex items-center gap-2 hover:opacity-90 transition-opacity"
              style={{
                height: 'clamp(40px,2.4vw,48px)',
                fontSize: 'clamp(12px,0.68vw,14px)',
                background: 'linear-gradient(135deg, #FDC700 0%, #FF8904 100%)',
                borderColor: '#FDC700',
                boxShadow: '0px 4px 17.1px 0px rgba(253, 199, 0, 0.3) inset',
              }}
            >
              <span>🚀</span>
              <span>Practice Test</span>
            </button>
          </Link>
        </div>

        {/* Today's Trio Section */}
        <div
          className="mb-[clamp(0.75rem,1.25vw,1.25rem)] rounded-[14px] p-[clamp(0.75rem,1vw,1.25rem)]"
          style={{
            background: '#FFFFFF',
            border: '0.8px solid #E5E7EB',
          }}
        >
          <div className="flex items-center justify-between mb-[clamp(0.5rem,0.75vw,0.75rem)]">
            <div className="flex items-center gap-2">
              <img src="/icons/dashboard/trio-header.png" alt="Today's Trio" className="w-[clamp(16px,1vw,20px)] h-[clamp(16px,1vw,20px)]" />
              <h2 className="font-inter font-bold text-[clamp(16px,1.1vw,18px)] text-[#1A1A1A]">
                Today's Trio
              </h2>
            </div>
            <Link href="/dashboard" className="font-inter text-[14px] text-[#6366F1] font-medium hover:text-[#4F46E5] transition-colors">
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#17223E]"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[clamp(0.5rem,0.75vw,1rem)]">
              {/* Daily MCQ Card */}
              <Link
                href="/dashboard/daily-mcq"
                aria-label="Open Daily MCQ"
                className="block rounded-[14px] p-[clamp(0.75rem,1.25vw,1.5rem)] relative cursor-pointer h-full flex flex-col transition-all hover:shadow-md"
                style={{
                  background: COLD_BLUE,
                  border: `1.5px solid ${isMcqCompleted ? '#22C55E' : COLD_BLUE_DARK}`,
                }}
              >
                {isMcqCompleted && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#22C55E] rounded-t-[14px]" />
                )}

                {isMcqCompleted && (
                  <div className="absolute top-4 right-4 w-7 h-7 bg-[#22C55E] rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}

                <div className="mb-2 py-1 text-[clamp(11px,0.65vw,12px)] invisible">AI Evaluation</div>

                <div className="flex items-center gap-2 mb-2">
                  <img src="/icons/dashboard/daily-mcq.png" alt="MCQ" className="w-6 h-6" />
                  <h3 className="font-inter font-bold text-[clamp(15px,1vw,18px)] text-[#1A1A1A]">
                    Daily MCQ
                  </h3>
                </div>

                <p className="font-inter text-[clamp(12px,0.75vw,14px)] text-gray-600 mb-1">
                  <span className={`font-medium ${isMcqCompleted ? 'text-[#22C55E]' : ''}`}>Status: {formatStatus(mcqStatus)}</span>
                </p>
                <p className="font-inter text-[clamp(12px,0.75vw,14px)] text-[#1A1A1A] font-medium mb-3 flex-grow">
                  {mcqCount} Questions{mcqTopic ? ` - ${mcqTopic}` : ''}
                </p>

                <div
                  className="w-full rounded-[8px] py-2.5 px-4 font-inter font-medium text-[clamp(12px,0.75vw,14px)] flex items-center justify-center gap-2 transition-colors"
                  style={isMcqCompleted
                    ? { background: '#17223E', color: '#FFFFFF' }
                    : { background: '#17223E', color: '#FFFFFF' }
                  }
                  role="button"
                >
                  {isMcqCompleted ? (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Completed · Review
                    </>
                  ) : (
                    <>
                      <img src="/TrioCard.png" alt="Start" className="w-4 h-4" />
                      Start Now
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1 mt-3">
                  {[0,1,2,3,4,5].map(i => (
                    <div key={i} className={`w-2 h-2 rounded-full ${i < (isMcqCompleted ? 5 : 3) ? 'bg-[#22C55E]' : 'bg-[#D1D5DB]'}`} />
                  ))}
                </div>
              </Link>

              {/* Daily Editorial Card */}
              <Link href="/dashboard/daily-editorial" className="block h-full">
              <div
                className="rounded-[14px] p-[clamp(0.75rem,1.25vw,1.5rem)] h-full flex flex-col transition-all hover:shadow-md relative"
                style={{
                  background: COLD_BLUE,
                  border: `1.5px solid ${isEditorialCompleted ? '#22C55E' : '#F59E0B'}`,
                }}
              >
                <div className={`absolute top-0 left-0 right-0 h-1 ${isEditorialCompleted ? 'bg-[#22C55E]' : 'bg-[#F59E0B]'} rounded-t-[14px]`} />

                {isEditorialCompleted && (
                  <div className="absolute top-4 right-4 w-7 h-7 bg-[#22C55E] rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}

                <div className="mb-2 py-1 text-[clamp(11px,0.65vw,12px)] invisible">AI Evaluation</div>

                <div className="flex items-center gap-2 mb-2">
                  <img src="/icons/dashboard/editorial.png" alt="Editorial" className="w-6 h-6" />
                  <h3 className="font-inter font-bold text-[clamp(15px,1vw,18px)] text-[#1A1A1A]">
                    Daily Editorial
                  </h3>
                </div>

                <p className="font-inter text-[clamp(12px,0.75vw,14px)] text-gray-600 mb-1">
                  <span className={`font-medium ${isEditorialCompleted ? 'text-[#22C55E]' : ''}`}>Status: {formatStatus(editorialStatus)}</span>
                </p>
                <p className="font-inter text-[clamp(12px,0.75vw,14px)] text-[#1A1A1A] font-medium mb-3 flex-grow">
                  {editorialTopic || '—'}
                </p>

                <div
                  className="w-full rounded-[8px] py-2.5 px-4 font-inter font-medium text-[clamp(12px,0.75vw,14px)] flex items-center justify-center gap-2 transition-colors"
                  style={isEditorialCompleted
                    ? { background: '#17223E', color: '#FFFFFF' }
                    : { background: '#FEF3C7', color: '#92400E', border: '1px solid #F59E0B' }
                  }
                  role="button"
                >
                  {isEditorialCompleted ? (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Completed · Review
                    </>
                  ) : (
                    <>
                      <img src="/TrioCard.png" alt="Read" className="w-4 h-4" />
                      Read Now
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1 mt-3">
                  {[0,1,2,3,4,5].map(i => (
                    <div key={i} className={`w-2 h-2 rounded-full ${i < (isEditorialCompleted ? 5 : 3) ? (isEditorialCompleted ? 'bg-[#22C55E]' : 'bg-[#F59E0B]') : 'bg-[#D1D5DB]'}`} />
                  ))}
                </div>
              </div>
              </Link>

              {/* Mains Question Card */}
              <Link href="/dashboard/daily-answer" className="block h-full">
              <div
                className="rounded-[14px] p-[clamp(0.75rem,1.25vw,1.5rem)] h-full flex flex-col transition-all hover:shadow-md relative"
                style={{
                  background: COLD_BLUE,
                  border: `1.5px solid ${isMainsCompleted ? '#22C55E' : COLD_BLUE_DARK}`,
                }}
              >
                {isMainsCompleted && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#22C55E] rounded-t-[14px]" />
                )}

                {isMainsCompleted && (
                  <div className="absolute top-4 right-4 w-7 h-7 bg-[#22C55E] rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}

                <div className="mb-2 px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[clamp(11px,0.65vw,12px)] font-medium w-fit">
                  AI Evaluation
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <img src="/icons/dashboard/mains.png" alt="Mains" className="w-6 h-6" />
                  <h3 className="font-inter font-bold text-[clamp(15px,1vw,18px)] text-[#1A1A1A]">
                    Mains Question
                  </h3>
                </div>

                <p className="font-inter text-[clamp(12px,0.75vw,14px)] text-gray-600 mb-1">
                  <span className={`font-medium ${isMainsCompleted ? 'text-[#22C55E]' : ''}`}>Status: {formatStatus(mainsStatus)}</span>
                </p>
                <p className="font-inter text-[clamp(12px,0.75vw,14px)] text-[#1A1A1A] font-medium mb-3 flex-grow">
                  {mainsTopic || '—'}
                </p>

                <div
                  className="w-full rounded-[8px] py-2.5 px-4 font-inter font-medium text-[clamp(12px,0.75vw,14px)] flex items-center justify-center gap-2 transition-colors"
                  style={isMainsCompleted
                    ? { background: '#17223E', color: '#FFFFFF' }
                    : { background: '#D1FAE5', color: '#065F46', border: '1px solid #22C55E' }
                  }
                  role="button"
                >
                  {isMainsCompleted ? (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Completed · Review
                    </>
                  ) : (
                    <>
                      <img src="/TrioCard (1).png" alt="Attempt" className="w-4 h-4" />
                      Attempt Now
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1 mt-3">
                  {[0,1,2,3,4,5].map(i => (
                    <div key={i} className={`w-2 h-2 rounded-full ${i < (isMainsCompleted ? 5 : 3) ? 'bg-[#22C55E]' : 'bg-[#D1D5DB]'}`} />
                  ))}
                </div>
              </div>
              </Link>
            </div>
          )}
        </div>

        {/* Time Distribution & Syllabus Coverage Row */}
        <div className="mb-[clamp(0.75rem,1.25vw,1.25rem)] grid grid-cols-1 lg:grid-cols-5 gap-[clamp(0.75rem,1vw,1.25rem)]">
          {/* Time Distribution Card */}
          <div
            className="lg:col-span-2 rounded-[14px] p-[clamp(1rem,1.25vw,1.5rem)] flex flex-col"
            style={{
              background: '#FFFFFF',
              border: '0.8px solid #E5E7EB',
              boxShadow: '0px 4px 12px 0px #00000026',
            }}
          >
            <div className="flex items-center gap-2 mb-[clamp(1rem,1.25vw,1.5rem)]">
              <svg className="w-[clamp(18px,1.25vw,22px)] h-[clamp(18px,1.25vw,22px)]" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="url(#timeGrad)" strokeWidth="3" strokeDasharray="20 10 15 10" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="timeGrad" x1="0" y1="0" x2="24" y2="24">
                    <stop offset="0%" stopColor="#FF6B6B"/>
                    <stop offset="33%" stopColor="#FFD93D"/>
                    <stop offset="66%" stopColor="#6BCB77"/>
                    <stop offset="100%" stopColor="#4D96FF"/>
                  </linearGradient>
                </defs>
              </svg>
              <h2 className="font-inter font-bold text-[clamp(16px,1.1vw,18px)] text-[#1A1A1A]">
                Time Distribution
              </h2>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
              {/* SVG Pie Chart */}
              <div className="flex items-center justify-center mb-4">
                {totalTimeMins === 0 ? (
                  <div className="flex items-center justify-center font-inter text-[#9CA3AF] text-sm" style={{ height: '140px' }}>
                    No study data yet
                  </div>
                ) : (
                  <svg viewBox="0 0 220 220" width="140" height="140">
                    {(() => {
                      const cx = 110, cy = 110, r = 85;
                      let angle = -Math.PI / 2;
                      return timeDistributionData.map((slice) => {
                        const sliceAngle = (slice.minutes / totalTimeMins) * 2 * Math.PI;
                        const path = pieSlicePath(cx, cy, r, angle, angle + sliceAngle);
                        angle += sliceAngle;
                        return <path key={slice.label} d={path} fill={slice.color} stroke="#fff" strokeWidth="2" />;
                      });
                    })()}
                    {/* Center label */}
                    <text x="110" y="105" textAnchor="middle" dominantBaseline="middle" fill="#17223E" fontWeight="bold" fontSize="22" fontFamily="Inter, sans-serif">
                      {fmtHours(totalTimeMins)}
                    </text>
                    <text x="110" y="128" textAnchor="middle" dominantBaseline="middle" fill="#6B7280" fontSize="11" fontFamily="Inter, sans-serif">
                      total
                    </text>
                  </svg>
                )}
              </div>

              <div className="w-full space-y-[clamp(8px,0.63vw,12px)]">
                {timeDistributionData.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                      <span className="font-arimo text-[clamp(12px,0.73vw,14px)] text-[#4A5565]">{item.label}</span>
                    </div>
                    <span className="font-inter font-semibold text-[clamp(12px,0.73vw,14px)] text-[#17223E]">{fmtHours(item.minutes)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Syllabus Coverage Card */}
          <div
            className="lg:col-span-3 rounded-[14px] p-[clamp(1rem,1.25vw,1.5rem)]"
            style={{
              background: '#FFFFFF',
              border: '0.8px solid #E5E7EB',
              boxShadow: '0px 4px 12px 0px #00000026',
            }}
          >
            <div className="flex items-center gap-2 mb-[clamp(1rem,1.25vw,1.5rem)]">
              <svg className="w-[clamp(18px,1.25vw,22px)] h-[clamp(18px,1.25vw,22px)]" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#FF6B6B" opacity="0.3"/>
                <path d="M12 2v10l7 4" stroke="#4D96FF" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M12 2C6.48 2 2 6.48 2 12" stroke="#6BCB77" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              <h2 className="font-inter font-bold text-[clamp(16px,1.1vw,18px)] text-[#1A1A1A]">
                Syllabus Coverage
              </h2>
              <Link href="/dashboard/syllabus-tracker" className="ml-auto font-inter text-[13px] text-[#6366F1] font-medium hover:text-[#4F46E5] transition-colors no-underline">
                View Tracker →
              </Link>
            </div>

            {syllabusLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#17223E]"></div>
              </div>
            ) : (
              <div className="space-y-[clamp(8px,0.63vw,12px)] max-h-[280px] overflow-y-auto pr-1">
                {syllabusCoverage.length > 0 ? syllabusCoverage.map((item, i) => (
                  <div key={item.subject}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-arimo text-[clamp(11px,0.68vw,13px)] text-[#4A5565]">{item.subject}</span>
                      <span className="font-arimo font-bold text-[clamp(11px,0.68vw,13px)] text-[#0A1172]">{item.percentage}%</span>
                    </div>
                    <div className="w-full rounded-full overflow-hidden" style={{ height: 'clamp(6px,0.42vw,8px)', background: '#E5E7EB' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.percentage}%`, background: item.color }}
                      />
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-4 text-gray-400">
                    <p className="font-inter text-[13px]">No syllabus data available.</p>
                    <Link href="/dashboard/syllabus-tracker" className="font-inter text-[12px] text-[#6366F1] mt-1 inline-block no-underline">
                      Go to Syllabus Tracker
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Today's Study Tasks Section */}
        <div
          className="mb-[clamp(0.75rem,1.25vw,1.25rem)] rounded-[14px] p-[clamp(0.75rem,1vw,1.25rem)]"
          style={{
            background: '#FFFFFF',
            border: '0.8px solid #E5E7EB',
          }}
        >
          <div className="flex items-center justify-between mb-[clamp(0.5rem,0.75vw,0.75rem)]">
            <div className="flex items-center gap-2">
              <img src="/icons/dashboard/tasks-header.png" alt="Today's Study Tasks" className="w-[clamp(16px,1vw,20px)] h-[clamp(16px,1vw,20px)]" />
              <h2 className="font-inter font-bold text-[clamp(16px,1.1vw,18px)] text-[#1A1A1A]">
                Today's Study Tasks
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={prevDay} className="w-7 h-7 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18l-6-6 6-6" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <span className="font-inter text-[clamp(12px,0.65vw,13px)] text-gray-400 px-3">
                {isToday ? 'Today' : selectedDateStr} {'\u2022'} {selectedDateStr}
              </span>
              <button onClick={nextDay} className="w-7 h-7 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          {tasksLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#17223E]"></div>
            </div>
          ) : displayTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <svg className="w-8 h-8 mb-2 text-gray-300" viewBox="0 0 24 24" fill="none">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="font-inter text-[13px]">No tasks scheduled for today.</p>
              <p className="font-inter text-[12px] mt-1">Add a custom task to get started.</p>
            </div>
          ) : (
            <>
              {displayTasks.map((task, index) => {
                const leftBorderColor = task.priority
                  ? (borderColors[task.priority] || borderColorsFallback[index % 3])
                  : borderColorsFallback[index % 3];
                const timeLabel = task.startTime && task.endTime
                  ? `${task.startTime} - ${task.endTime} ${formatDuration(task.duration)}`
                  : task.duration ? formatDuration(task.duration) : '';
                const taskComplete = isTaskComplete(task);

                return (
                  <div
                    key={task._id || task.id || index}
                    className={`rounded-lg border border-[#E5E7EB] border-l-4 p-[clamp(0.5rem,0.75vw,1rem)] mb-[clamp(0.5rem,0.75vw,0.75rem)] flex items-start justify-between ${taskComplete ? 'bg-green-50' : 'bg-[#F9FAFB]'}`}
                    style={{ boxShadow: '0 1px 1px rgba(16, 24, 40, 0.04)', borderLeftColor: taskComplete ? '#22C55E' : leftBorderColor }}
                  >
                    <div className="flex-1">
                      <h3 className={`font-inter font-semibold text-[clamp(13px,0.83vw,15px)] mb-1.5 ${taskComplete ? 'text-[#15803D] line-through' : 'text-[#1A1A1A]'}`}>
                        {task.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[clamp(11px,0.6vw,12px)] font-medium text-blue-600" style={{ background: '#DBEAFE' }}>
                          <img src="/b.png" alt="Type" className="w-3 h-3" />
                          {task.type || 'Reading'}
                        </span>
                        {timeLabel && (
                          <span className="inline-flex items-center gap-1 text-gray-600 text-[clamp(11px,0.6vw,12px)]">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                              <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            {timeLabel}
                          </span>
                        )}
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[clamp(11px,0.6vw,12px)] font-medium text-purple-700" style={{ background: '#F3E8FF' }}>
                          {task.subject || 'General'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleTask(task, index)}
                      className={`ml-3 w-5 h-5 rounded-full border-2 transition-colors flex items-center justify-center flex-shrink-0 ${taskComplete ? 'border-green-500 bg-green-500' : 'border-gray-300 hover:border-green-500 hover:bg-green-50'}`}
                      aria-label={taskComplete ? 'Mark task incomplete' : 'Mark task complete'}
                    >
                      <svg className={`w-3 h-3 ${taskComplete ? 'text-white' : 'text-green-600 opacity-0'}`} viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                );
              })}
            </>
          )}

          {/* Add Custom Task */}
          <div
            className="rounded-lg border border-[#E5E7EB] p-[clamp(0.75rem,1vw,1.25rem)] mb-[clamp(0.75rem,1vw,1rem)] flex items-center justify-between"
            style={{ background: '#FFFFFF' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-[clamp(36px,2.2vw,44px)] h-[clamp(36px,2.2vw,44px)] bg-[#17223E] rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <h3 className="font-inter font-semibold text-[clamp(13px,0.83vw,15px)] text-[#1A1A1A]">
                  Add Custom Task
                </h3>
                <p className="font-inter text-[clamp(11px,0.6vw,12px)] text-gray-500">
                  Create your own study task for today
                </p>
              </div>
            </div>
            <button onClick={() => setShowAddTaskModal(true)} className="px-[clamp(0.75rem,1vw,1.25rem)] py-[clamp(0.35rem,0.45vw,0.5rem)] bg-[#17223E] text-white rounded-lg font-inter font-medium text-[clamp(11px,0.6vw,12px)] hover:bg-[#1E2875] transition-colors flex items-center gap-1.5 flex-shrink-0">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              Add Task
            </button>
          </div>

          {/* Start Focus Session Button with Timer */}
          <div className="rounded-lg overflow-hidden" style={{ background: 'linear-gradient(135deg, #1E2875 0%, #17223E 100%)' }}>
            {timerRunning || timerSeconds < 25 * 60 ? (
              <div className="flex items-center justify-between px-[clamp(1rem,1.5vw,1.5rem)] py-[clamp(0.75rem,1vw,1rem)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      {timerRunning ? (
                        <>
                          <rect x="6" y="4" width="4" height="16" rx="1" fill="white"/>
                          <rect x="14" y="4" width="4" height="16" rx="1" fill="white"/>
                        </>
                      ) : (
                        <path d="M10 8l6 4-6 4V8z" fill="white"/>
                      )}
                    </svg>
                  </div>
                  <div>
                    <p className="font-inter font-semibold text-white text-[clamp(14px,0.94vw,16px)]">
                      {isBreak ? 'Break Time' : 'Focus Session'}
                    </p>
                    <p className="font-inter text-white/70 text-[clamp(12px,0.73vw,14px)]">
                      {isBreak ? 'Take a short break' : 'Stay focused and productive'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-mono font-bold text-white text-[clamp(20px,1.5vw,28px)] leading-none tracking-wider">
                      {formatTimerTime(timerSeconds)}
                    </p>
                    <p className="font-inter text-white/60 text-[11px] mt-1">
                      {isBreak ? '5 min break' : '25 min focus'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleResetFocusSession}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                      aria-label="Reset timer"
                    >
                      <svg className="w-4 h-4 text-white/70" viewBox="0 0 24 24" fill="none">
                        <path d="M3 12a9 9 0 119 9M3 12V7m0 5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button
                      onClick={handleStartFocusSession}
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                      style={{ background: 'rgba(255,255,255,0.2)' }}
                      aria-label={timerRunning ? 'Pause' : 'Start'}
                    >
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        {timerRunning ? (
                          <>
                            <rect x="6" y="4" width="4" height="16" rx="1" fill="white"/>
                            <rect x="14" y="4" width="4" height="16" rx="1" fill="white"/>
                          </>
                        ) : (
                          <path d="M10 8l6 4-6 4V8z" fill="white"/>
                        )}
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={handleStartFocusSession}
                className="w-full text-white rounded-lg py-[clamp(0.75rem,1vw,1rem)] font-inter font-semibold text-[clamp(14px,0.94vw,16px)] hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" fill="white"/>
                  <path d="M10 8l6 4-6 4V8z" fill="#17223E"/>
                </svg>
                Start Focus Session (25 Mins)
              </button>
            )}
          </div>
        </div>

      </div>
    </div>

      {showAddTaskModal && (
        <AddTaskModal
          onClose={() => setShowAddTaskModal(false)}
          onTaskAdded={(task) => setTasks(prev => [...prev, task])}
        />
      )}

      {showNotificationModal && (
        <NotificationModal
          onClose={() => setShowNotificationModal(false)}
        />
      )}
    </>
  );
};

export default ResponsiveDashboardContent;

