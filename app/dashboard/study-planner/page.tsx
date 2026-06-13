'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { dashboardService, studyPlannerService, syllabusService, userService } from '@/lib/services';
import { getSubjectEmoji } from '@/lib/subjectEmojis';

function fmtTimer(secs: number): string {
  const s = Math.max(0, secs);
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

// Coverage bar/percentage colour by completion: Good (>30%) green, Review needed (>10%) orange, else Weak red
function coverageColor(pct: number): string {
  if (pct > 30) return '#16A34A';
  if (pct > 10) return '#F59E0B';
  return '#EF4444';
}

function taskDurationSecs(task: Task): number {
  if (task.startTime && task.endTime) {
    const [sh, sm] = task.startTime.split(':').map(Number);
    const [eh, em] = task.endTime.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff > 0) return diff * 60;
  }
  return 3600;
}

function toDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toMinutes(time?: string): number {
  if (!time) return Number.POSITIVE_INFINITY;
  const [h, m] = time.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return Number.POSITIVE_INFINITY;
  return h * 60 + m;
}

function compareTasksByTime(a: Task, b: Task): number {
  const startDiff = toMinutes(a.startTime) - toMinutes(b.startTime);
  if (startDiff !== 0) return startDiff;
  const endDiff = toMinutes(a.endTime) - toMinutes(b.endTime);
  if (endDiff !== 0) return endDiff;
  return a.title.localeCompare(b.title);
}

// Stroke-only arc for a donut ring segment (no center lines / fill).
function donutArcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${x1.toFixed(3)} ${y1.toFixed(3)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(3)} ${y2.toFixed(3)}`;
}

interface Task {
  id: string;
  title: string;
  subject?: string;
  type: string;
  startTime?: string;
  endTime?: string;
  isCompleted: boolean;
  recur?: string;
}

type RecurType = 'daily' | 'weekly' | 'weekdays' | 'custom';
type RecurEnd = 'exam' | '2weeks' | '1month' | '3months';

// Cap how many task instances a single recurring add can generate, to avoid
// flooding the backend with hundreds of API calls.
const MAX_RECUR_OCCURRENCES = 60;

const RECUR_TYPE_LABEL: Record<RecurType, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  weekdays: 'Weekdays',
  custom: 'Custom',
};

const RECUR_TYPE_SUMMARY: Record<RecurType, string> = {
  daily: 'Repeats every day',
  weekly: 'Repeats every week',
  weekdays: 'Repeats on weekdays (Mon–Fri)',
  custom: 'Repeats on selected days',
};

const RECUR_END_SUMMARY: Record<RecurEnd, string> = {
  exam: 'until your exam date',
  '2weeks': 'for 2 weeks',
  '1month': 'for 1 month',
  '3months': 'for 3 months',
};

// 0 = Monday … 6 = Sunday
const DAY_PILLS: { label: string; index: number }[] = [
  { label: 'M', index: 0 },
  { label: 'T', index: 1 },
  { label: 'W', index: 2 },
  { label: 'T', index: 3 },
  { label: 'F', index: 4 },
  { label: 'S', index: 5 },
  { label: 'S', index: 6 },
];

// Convert a JS getDay() (0 = Sunday) into our Monday-first index (0 = Monday).
function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function recurrenceEndDate(start: Date, end: RecurEnd): Date {
  const d = new Date(start);
  switch (end) {
    case '2weeks': d.setDate(d.getDate() + 14); break;
    case '1month': d.setMonth(d.getMonth() + 1); break;
    case '3months': d.setMonth(d.getMonth() + 3); break;
    case 'exam': default: d.setMonth(d.getMonth() + 3); break; // bounded horizon
  }
  return d;
}

// Expand a recurrence rule into the list of dates (YYYY-MM-DD) on which the
// session should be created, starting from `start` and inclusive of the range.
function getRecurrenceDates(start: Date, type: RecurType, days: number[], end: RecurEnd): string[] {
  const result: string[] = [];
  const endDate = recurrenceEndDate(start, end);
  const startIdx = mondayIndex(start);
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  while (cursor <= endDate && result.length < MAX_RECUR_OCCURRENCES) {
    const idx = mondayIndex(cursor);
    let include = false;
    if (type === 'daily') include = true;
    else if (type === 'weekdays') include = idx <= 4;
    else if (type === 'weekly') include = idx === startIdx;
    else if (type === 'custom') include = days.includes(idx);
    if (include) result.push(toDateParam(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

const SUBJECT_OPTIONS = [
  'Polity',
  'History',
  'Geography',
  'Economy',
  'Environment & Ecology',
  'Science & Technology',
  'Current Affairs',
  'Society',
  'Governance',
  'International Relations',
  'Social Justice',
  'Agriculture',
  'Internal Security',
  'Disaster Management',
  'Ethics',
  'GS1',
  'GS2',
  'GS3',
  'GS4',
  'Essay',
  'Optional Paper 1',
  'Optional Paper 2',
];

const SUBJECT_ICON_MAP: Record<string, string> = {
  Polity: '/study-planner-icons/polity.png',
  Economy: '/study-planner-icons/economy.png',
  Society: '/study-planner-icons/society.png',
  'Indian Society': '/study-planner-icons/society.png',
  Governance: '/study-planner-icons/governance.png',
  'Social Justice': '/study-planner-icons/social-justice.png',
  'International Relations': '/study-planner-icons/international-relations.png',
  'Disaster Management': '/study-planner-icons/disaster-management.png',
  Ethics: '/study-planner-icons/ethics.png',
  'Ethics & Human Values': '/study-planner-icons/ethics.png',
  CSAT: '/study-planner-icons/csat.png',
  'Case Studies': '/study-planner-icons/case-studies.png',
};

const quickAddIconBoxStyle: React.CSSProperties = {
  width: '24px',
  height: '24px',
  minWidth: '24px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
};

export default function StudyPlannerPage() {
  const [taskTitle, setTaskTitle] = useState('');
  const [taskSubject, setTaskSubject] = useState('');
  const [studyType, setStudyType] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [recurEnabled, setRecurEnabled] = useState(false);
  const [recurType, setRecurType] = useState<RecurType>('daily');
  const [recurDays, setRecurDays] = useState<number[]>([1, 3]); // Tue & Thu by default
  const [recurEnd, setRecurEnd] = useState<RecurEnd>('exam');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [weeklyStudied, setWeeklyStudied] = useState<number | null>(null);
  const [weeklyTarget, setWeeklyTarget] = useState<number | null>(null);
  const [syllabusCoverage, setSyllabusCoverage] = useState<{ subject: string; percentage: number; done: number; total: number }[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<{ title: string; completed: boolean }[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [adding, setAdding] = useState(false);
  const [studiedDays, setStudiedDays] = useState<number[]>([]);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [calendarSyncEnabled, setCalendarSyncEnabled] = useState(false);
  const [calendarSyncConnected, setCalendarSyncConnected] = useState(false);
  const [calendarSyncLoading, setCalendarSyncLoading] = useState(false);
  const [calendarSyncError, setCalendarSyncError] = useState('');
  const saveToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus session state
  const [focusActive, setFocusActive] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const [focusDone, setFocusDone] = useState(false);
  const [focusSessionTasks, setFocusSessionTasks] = useState<Task[]>([]);
  const [focusTaskIdx, setFocusTaskIdx] = useState(0);
  const [focusTaskSecs, setFocusTaskSecs] = useState(0);
  const [focusTotalSecs, setFocusTotalSecs] = useState(0);
  const [justCompleted, setJustCompleted] = useState(false);
  // Actual time spent (seconds) per task, captured from the focus timer on completion.
  const [actualSecondsByTask, setActualSecondsByTask] = useState<Record<string, number>>({});
  const focusTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    Promise.allSettled([
      dashboardService.getStreak(),
      studyPlannerService.getStreak(),
    ])
      .then(([dashboardStreakRes, plannerStreakRes]) => {
        const dashboardStreak = dashboardStreakRes.status === 'fulfilled' ? dashboardStreakRes.value?.data : null;
        const plannerStreak = plannerStreakRes.status === 'fulfilled' ? plannerStreakRes.value?.data : null;

        setStreakDays(Number(dashboardStreak?.currentStreak ?? plannerStreak?.currentStreak ?? 0));
        setLongestStreak(Number(dashboardStreak?.longestStreak ?? plannerStreak?.longestStreak ?? 0));

        const normalizedWeeklyStudied =
          plannerStreak?.weeklyStudied ??
          (Array.isArray(dashboardStreak?.weekDays) ? dashboardStreak.weekDays.filter(Boolean).length : undefined);
        const normalizedWeeklyTarget =
          plannerStreak?.weeklyTarget ??
          (Array.isArray(dashboardStreak?.weekDays) ? dashboardStreak.weekDays.length : 7);

        if (normalizedWeeklyStudied !== undefined) setWeeklyStudied(Number(normalizedWeeklyStudied));
        if (normalizedWeeklyTarget !== undefined) setWeeklyTarget(Number(normalizedWeeklyTarget));
      })
      .catch(() => {});
    // Syllabus Coverage is derived from the SAME source as the Syllabus Tracker
    // module (syllabusService.getSyllabus + the user's tracker states) so the two
    // screens always show identical subject names and progress.
    Promise.all([
      syllabusService.getSyllabus(),
      userService.getSyllabusTracker(),
    ])
      .then(([syllabusRes, trackerRes]) => {
        const data = syllabusRes?.data;
        if (!data) return;
        let states = trackerRes?.data?.states as Record<string, { status?: string }> | undefined;
        if ((!states || Object.keys(states).length === 0) && typeof window !== 'undefined') {
          const saved = localStorage.getItem('syllabusTrackerState');
          if (saved) { try { states = JSON.parse(saved); } catch {} }
        }
        const stateMap = states ?? {};
        const stages: ('prelims' | 'mains' | 'optional')[] = ['prelims', 'mains', 'optional'];
        const rows: { subject: string; percentage: number; done: number; total: number }[] = [];
        stages.forEach((stage) => {
          const subjects = Array.isArray(data[stage]) ? data[stage] : [];
          subjects.forEach((subject: any) => {
            let total = 0;
            let done = 0;
            (subject.topics ?? []).forEach((topic: any, ti: number) => {
              (topic.subs ?? []).forEach((_: any, si: number) => {
                total += 1;
                if (stateMap[`${subject.id}__${ti}__${si}`]?.status === 'done') done += 1;
              });
            });
            rows.push({
              subject: subject.short || subject.name,
              percentage: total > 0 ? Math.round((done / total) * 100) : 0,
              done,
              total,
            });
          });
        });
        setSyllabusCoverage(rows);
      })
      .catch(() => {});
    studyPlannerService.getWeeklyGoals()
      .then(res => {
        if (res.data && Array.isArray(res.data)) {
          setWeeklyGoals(res.data);
        } else if (res.data?.goals && Array.isArray(res.data.goals)) {
          setWeeklyGoals(res.data.goals);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    studyPlannerService.getTodayTasks(toDateParam(currentDate))
      .then(res => { if (res.data) setTasks(res.data); else setTasks([]); })
      .catch(() => setTasks([]));
  }, [currentDate]);

  useEffect(() => {
    studyPlannerService.getCalendarSyncStatus()
      .then(res => {
        setCalendarSyncEnabled(!!res.data?.enabled);
        setCalendarSyncConnected(!!res.data?.connected);
        setCalendarSyncError(res.data?.lastSyncError || '');
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    studyPlannerService.getMonthlyActivity(currentDate.getFullYear(), currentDate.getMonth() + 1)
      .then(res => {
        if (res.data?.studiedDays) setStudiedDays(res.data.studiedDays);
        else setStudiedDays([]);
      })
      .catch(() => {});
  }, [currentDate]);

  const handleAddTask = async () => {
    if (!taskTitle.trim()) return;
    setAdding(true);
    try {
      const todayParam = toDateParam(currentDate);
      const recurLabel = recurEnabled ? RECUR_TYPE_LABEL[recurType] : undefined;

      // When recurrence is on, expand the rule into one task per matching date.
      // Otherwise just create the single task for the selected day.
      const dates = recurEnabled
        ? getRecurrenceDates(currentDate, recurType, recurDays, recurEnd)
        : [todayParam];
      // Always make sure the currently-viewed day gets a task.
      if (!dates.includes(todayParam)) dates.unshift(todayParam);

      const base = {
        title: taskTitle,
        subject: taskSubject || undefined,
        type: studyType || 'reading',
        startTime,
        endTime,
      };

      const results = await Promise.allSettled(
        dates.map(date => studyPlannerService.createTask({ ...base, date }))
      );

      // Append only the task(s) created for the day currently in view.
      dates.forEach((date, i) => {
        if (date !== todayParam) return;
        const r = results[i];
        if (r.status === 'fulfilled' && r.value.data) {
          setTasks(prev => [...prev, { ...r.value.data, recur: recurLabel }]);
        }
      });

      setTaskTitle('');
      setTaskSubject('');
      setStudyType('');
    } catch {}
    setAdding(false);
  };

  const handleToggleTask = async (id: string, completed: boolean) => {
    try {
      await studyPlannerService.updateTask(id, { isCompleted: !completed });
      setTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !completed } : t));
    } catch {}
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await studyPlannerService.deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch {}
  };

  const persistGoals = (goals: { title: string; completed: boolean }[]) => {
    setWeeklyGoals(goals);
    studyPlannerService.saveWeeklyGoals(goals).catch(() => {});
  };

  const handleAddGoal = () => {
    const title = newGoal.trim();
    if (!title) return;
    persistGoals([...weeklyGoals, { title, completed: false }]);
    setNewGoal('');
  };

  const handleToggleGoal = (i: number) => {
    persistGoals(weeklyGoals.map((g, idx) => (idx === i ? { ...g, completed: !g.completed } : g)));
  };

  const handleDeleteGoal = (i: number) => {
    persistGoals(weeklyGoals.filter((_, idx) => idx !== i));
  };

  const handleGoogleCalendarToggle = async () => {
    if (calendarSyncLoading) return;
    setCalendarSyncLoading(true);
    setCalendarSyncError('');

    try {
      if (calendarSyncEnabled) {
        const res = await studyPlannerService.updateCalendarSync(false);
        setCalendarSyncEnabled(!!res.data?.enabled);
        setCalendarSyncConnected(!!res.data?.connected);
        setCalendarSyncError(res.data?.lastSyncError || '');
        return;
      }

      if (!calendarSyncConnected) {
        const res = await studyPlannerService.getGoogleCalendarAuthUrl();
        if (res.data?.url) {
          window.location.href = res.data.url;
          return;
        }
      }

      const res = await studyPlannerService.updateCalendarSync(true);
      if (res.data?.needsAuth && res.data?.authUrl) {
        window.location.href = res.data.authUrl;
        return;
      }
      setCalendarSyncEnabled(!!res.data?.enabled);
      setCalendarSyncConnected(!!res.data?.connected);
      setCalendarSyncError(res.data?.lastSyncError || '');
    } catch (error) {
      setCalendarSyncError(error instanceof Error ? error.message : 'Google Calendar sync failed');
    } finally {
      setCalendarSyncLoading(false);
    }
  };

  const showSaveAcknowledgement = () => {
    setShowSaveToast(true);
    if (saveToastTimerRef.current) clearTimeout(saveToastTimerRef.current);
    saveToastTimerRef.current = setTimeout(() => setShowSaveToast(false), 3000);
  };

  // Focus session timer
  useEffect(() => {
    if (focusActive && !focusPaused && !focusDone && !justCompleted) {
      focusTimerRef.current = setInterval(() => {
        setFocusTaskSecs(s => s + 1);
        setFocusTotalSecs(s => s + 1);
      }, 1000);
    } else {
      if (focusTimerRef.current) clearInterval(focusTimerRef.current);
    }
    return () => { if (focusTimerRef.current) clearInterval(focusTimerRef.current); };
  }, [focusActive, focusPaused, focusDone, justCompleted]);

  useEffect(() => {
    return () => {
      if (saveToastTimerRef.current) clearTimeout(saveToastTimerRef.current);
    };
  }, []);

  const startFocusSession = () => {
    const orderedTasks = [...tasks].sort(compareTasksByTime);
    if (orderedTasks.length === 0) return;
    const firstPendingIdx = orderedTasks.findIndex((task) => !task.isCompleted);
    if (firstPendingIdx === -1) return;
    setFocusSessionTasks(orderedTasks);
    setFocusTaskIdx(firstPendingIdx);
    setFocusTaskSecs(0);
    setFocusTotalSecs(0);
    setJustCompleted(false);
    setFocusPaused(false);
    setFocusDone(false);
    setFocusActive(true);
  };

  const focusAdvance = (newIdx: number, sessionTasks: Task[]) => {
    if (newIdx >= sessionTasks.length) {
      setFocusDone(true);
    } else {
      setFocusTaskIdx(newIdx);
      setFocusTaskSecs(0);
    }
  };

  const focusMarkDone = async () => {
    const task = focusSessionTasks[focusTaskIdx];
    // Record the actual time the user spent on this task (from the focus timer).
    if (task && focusTaskSecs > 0) {
      setActualSecondsByTask(prev => ({ ...prev, [task.id]: focusTaskSecs }));
    }
    if (task && !task.isCompleted) {
      await handleToggleTask(task.id, false);
    }
    const updated = focusSessionTasks.map((t, i) => i === focusTaskIdx ? { ...t, isCompleted: true } : t);
    setFocusSessionTasks(updated);
    setJustCompleted(true);
  };

  const focusNextTask = () => {
    setJustCompleted(false);
    setFocusTaskIdx(prev => {
      let newIdx = prev + 1;
      while (newIdx < focusSessionTasks.length && focusSessionTasks[newIdx].isCompleted) {
        newIdx += 1;
      }
      if (newIdx >= focusSessionTasks.length) {
        setFocusDone(true);
      }
      return newIdx;
    });
    setFocusTaskSecs(0);
  };

  const focusSkip = () => {
    let nextIdx = focusTaskIdx + 1;
    while (nextIdx < focusSessionTasks.length && focusSessionTasks[nextIdx].isCompleted) {
      nextIdx += 1;
    }
    focusAdvance(nextIdx, focusSessionTasks);
  };

  const closeFocusSession = () => {
    setFocusActive(false);
    setFocusPaused(false);
    setFocusDone(false);
    setJustCompleted(false);
    setFocusTaskIdx(0);
    setFocusTaskSecs(0);
    setFocusTotalSecs(0);
    setFocusSessionTasks([]);
  };

  const formatDate = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const prevDay = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 1); setCurrentDate(d); };
  const nextDay = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 1); setCurrentDate(d); };

  // Generate calendar days dynamically for the current month
  const today = new Date();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const todayNum = today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear()
    ? today.getDate() : -1;
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const offset = (firstDayOfMonth.getDay() + 6) % 7; // 0=Mon … 6=Sun
  const emptySlots = Array.from({ length: offset }, (_, i) => ({ day: 0, empty: true, studied: false, today: false }));
  const daySlots = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    empty: false,
    studied: studiedDays.includes(i + 1),
    today: i + 1 === todayNum,
  }));
  const calendarDays = [...emptySlots, ...daySlots];

  const studyTypes = [
    { id: 'video', label: 'Video Lectures', icon: '/study-type-video.png' },
    { id: 'reading', label: 'Reading', icon: '/study-type-reading.png' },
    { id: 'practice', label: 'Practice', icon: '/practise.png' },
    { id: 'revision', label: 'Revision', icon: '/revision.png' },
    { id: 'test', label: 'Test', icon: '/study-type-test.png' },
    { id: 'notes', label: 'Note Making', icon: '/notes.png' },
    { id: 'answer', label: 'Answer Writing', icon: '/answer writing.png' },
    { id: 'other', label: 'Other', icon: '/others.png' },
  ];

  const studyTypeLabel = (id?: string) => studyTypes.find((t) => t.id === id)?.label ?? '';

  const quickAddSubjects = SUBJECT_OPTIONS;

  const quickAddSubjectMap: Record<string, string> = {
    ...Object.fromEntries(SUBJECT_OPTIONS.map((subject) => [subject, subject])),
  };

  const quickAddTypeMap: Record<string, string> = {
    Revision: 'revision',
    'Mock Test': 'test',
    'Answer Writing': 'answer',
  };

  const handleQuickAdd = (item: string) => {
    const mappedSubject = quickAddSubjectMap[item];
    const mappedType = quickAddTypeMap[item] || 'reading';

    if (mappedSubject) {
      setTaskSubject(mappedSubject);
    } else {
      setTaskSubject('');
    }

    setStudyType(mappedType);
    setTaskTitle(item === 'Mock Test' ? 'Mock Test Practice' : `${item} Study Session`);
  };

  const timeOptions = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
    '22:00', '22:30', '23:00',
  ];

  // Add 30 minutes to a "HH:MM" time, capped at the last available option
  const addThirtyMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + 30;
    const hh = String(Math.floor(total / 60)).padStart(2, '0');
    const mm = String(total % 60).padStart(2, '0');
    const next = `${hh}:${mm}`;
    return timeOptions.includes(next) ? next : timeOptions[timeOptions.length - 1];
  };

  // Compute total study time from tasks that have start/end times
  const totalStudyMinutes = tasks.reduce((sum, task) => {
    if (task.startTime && task.endTime) {
      const [sh, sm] = task.startTime.split(':').map(Number);
      const [eh, em] = task.endTime.split(':').map(Number);
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      return sum + (diff > 0 ? diff : 0);
    }
    return sum;
  }, 0);
  const totalStudyHours = Math.floor(totalStudyMinutes / 60);
  const totalStudyMins = totalStudyMinutes % 60;

  // Completed task hours
  const completedStudyMinutes = tasks
    .filter(t => t.isCompleted)
    .reduce((sum, t) => {
      if (t.startTime && t.endTime) {
        const [sh, sm] = t.startTime.split(':').map(Number);
        const [eh, em] = t.endTime.split(':').map(Number);
        return sum + Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
      }
      return sum;
    }, 0);
  const completedStudyHours = Math.floor(completedStudyMinutes / 60);

  const totalStudyLabel = totalStudyMinutes > 0
    ? `Total Study Time: ${totalStudyMinutes} minutes (${totalStudyHours}h ${totalStudyMins}m)`
    : 'Total Study Time: -';
  const pendingTaskCount = tasks.filter((task) => !task.isCompleted).length;
  const sortedTasks = [...tasks].sort(compareTasksByTime);

  // Time distribution by subject (completed/ticked tasks only)
  const subjectColorPalette = [
    '#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', '#059669',
    '#06B6D4', '#F97316', '#EC4899', '#6366F1', '#0EA5E9',
    '#F43F5E', '#84CC16', '#EF4444', '#EAB308', '#7C3AED',
    '#14B8A6', '#E8B84B', '#FF6900', '#2DD4BF', '#34D399',
  ];
  // Time spent per subject (in seconds). Prefer the actual time tracked by the
  // focus timer; fall back to the planned slot length for tasks completed without it.
  const subjectSecondsMap = new Map<string, number>();
  tasks.filter(t => t.isCompleted).forEach(t => {
    const subj = t.subject?.trim() || 'General';
    let secs = 0;
    const actual = actualSecondsByTask[t.id];
    if (actual != null && actual > 0) {
      secs = actual;
    } else if (t.startTime && t.endTime) {
      const [sh, sm] = t.startTime.split(':').map(Number);
      const [eh, em] = t.endTime.split(':').map(Number);
      const diffMin = (eh * 60 + em) - (sh * 60 + sm);
      if (diffMin > 0) secs = diffMin * 60;
    }
    if (secs > 0) subjectSecondsMap.set(subj, (subjectSecondsMap.get(subj) ?? 0) + secs);
  });
  const timeByType = Array.from(subjectSecondsMap.entries())
    .map(([subj, secs], idx) => ({
      id: subj,
      label: subj,
      color: subjectColorPalette[idx % subjectColorPalette.length],
      seconds: secs,
    }))
    .sort((a, b) => b.seconds - a.seconds);
  const totalTypeSecs = timeByType.reduce((s, x) => s + x.seconds, 0);
  const hasCompletedTimeDistribution = totalTypeSecs > 0;
  const fmtDuration = (secs: number) => {
    if (secs >= 3600) {
      const h = secs / 3600;
      return (h % 1 === 0 ? h.toFixed(0) : h.toFixed(1)) + 'h';
    }
    if (secs >= 60) return Math.round(secs / 60) + 'm';
    return Math.round(secs) + 's';
  };

  // Dynamic month/year display for calendar header
  const calendarMonthYear = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Weekly streak display
  const weeklyStreakLabel = weeklyStudied !== null && weeklyTarget !== null
    ? `${weeklyStudied}/${weeklyTarget} This Week`
    : weeklyStudied !== null
    ? `${weeklyStudied} days this week`
    : '0/7 This Week';

  return (
    <>
    <div className="flex flex-col bg-gray-50 overflow-x-hidden" style={{ height: '100%' }}>
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col xl:flex-row gap-5 p-4 md:p-6">

          {/* ═══════ Left Column: Main Content ═══════ */}
          <div className="flex-1 min-w-0">

            {/* Hero Banner – matches Figma study planner design */}
            <div
              className="rounded-[16px] border border-white/5 overflow-hidden relative"
              style={{
                background: 'linear-gradient(105deg, #060C1C 0%, #080F1C 50%, #0D121F 75%, #1A1819 100%)',
                padding: '24px 26px 22px',
                marginBottom: '16px',
              }}
            >
              {/* Warm radial glow – bottom-right like Figma */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(ellipse at 92% 88%, rgba(55,53,51,0.40) 0%, rgba(55,53,51,0.15) 25%, rgba(55,53,51,0.04) 50%, transparent 70%)',
                }}
              />
              {/* Fine grid overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)',
                  backgroundSize: '48px 48px',
                }}
              />
              {/* Subtle gold glow – upper-middle */}
              <div
                className="absolute left-[28%] -top-[50px] w-[260px] h-[260px] rounded-full pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(232,184,75,.07) 0%, transparent 65%)',
                }}
              />

              <div className="relative z-10">
                {/* Top badge and heading */}
                <div className="mb-[8px]">
                  <div className="mb-[12px]">
                    <div
                      className="inline-flex items-center gap-[8px]"
                      style={{
                        padding: '8px 18px',
                        borderRadius: '999px',
                        background: 'rgba(19,36,70,0.55)',
                        border: '1px solid rgba(255,255,255,0.12)',
                      }}
                    >
                      <Image
                        src="/study-planner-badge.png"
                        alt="Study planner"
                        width={22}
                        height={22}
                        style={{ width: '22px', height: '22px', objectFit: 'contain' }}
                      />
                      <span
                        className="text-[11px] font-bold uppercase tracking-[0.5px]"
                        style={{ color: '#E8B84B', fontFamily: 'Inter, system-ui, sans-serif' }}
                      >
                        Daily Study Planner
                      </span>
                    </div>
                  </div>

                  <h1
                    className="font-bold leading-[1.14]"
                    style={{
                      fontSize: 'clamp(20px, 2.2vw, 45px)',
                      fontFamily: '"Cormorant Garamond", Georgia, serif',
                      letterSpacing: '-0.4px',
                      color: '#FFFFFF',
                    }}
                  >
                    Where <span style={{ color: '#E8B84B' }}>Planning</span> meets <span style={{ color: '#E8B84B' }}>Purpose</span>
                  </h1>
                </div>

                {/* Subtitle */}
                <p
                  className="mb-[12px]"
                  style={{
                    fontSize: '13px',
                    lineHeight: '20px',
                    color: 'rgba(255,255,255,0.72)',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                >
                  Personalized study schedule with daily targets and progress tracking.
                </p>

                {/* Stats Strip */}
                <div
                  className="flex gap-0 rounded-[10px] overflow-hidden"
                  style={{ border: '0.8px solid #2A3242', maxWidth: '520px' }}
                >
                  <div
                    className="flex-1 p-[10px_12px] text-center"
                    style={{ background: 'rgba(28,39,59,0.7)', borderRight: '0.8px solid #2A3242' }}
                  >
                    <div
                      className="text-[18px] font-bold leading-none"
                      style={{ color: '#F59E0B', fontFamily: 'Inter, system-ui, sans-serif' }}
                    >
                      {totalStudyHours}h
                    </div>
                    <div
                      className="text-[9px] font-bold tracking-[1px] uppercase mt-[4px]"
                      style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, system-ui, sans-serif' }}
                    >
                      Planned
                    </div>
                  </div>
                  <div
                    className="flex-1 p-[10px_12px] text-center"
                    style={{ background: 'rgba(28,39,59,0.7)', borderRight: '0.8px solid #2A3242' }}
                  >
                    <div
                      className="text-[18px] font-bold leading-none"
                      style={{ color: '#F87171', fontFamily: 'Inter, system-ui, sans-serif' }}
                    >
                      {completedStudyHours > 0 ? `${completedStudyHours}h` : '0h'}
                    </div>
                    <div
                      className="text-[9px] font-bold tracking-[1px] uppercase mt-[4px]"
                      style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, system-ui, sans-serif' }}
                    >
                      Done
                    </div>
                  </div>
                  <div
                    className="flex-1 p-[10px_12px] text-center"
                    style={{ background: 'rgba(28,39,59,0.7)', borderRight: '0.8px solid #2A3242' }}
                  >
                    <div
                      className="text-[18px] font-bold leading-none"
                      style={{ color: '#34D399', fontFamily: 'Inter, system-ui, sans-serif' }}
                    >
                      {tasks.filter(t => t.isCompleted).length}/{tasks.length}
                    </div>
                    <div
                      className="text-[9px] font-bold tracking-[1px] uppercase mt-[4px]"
                      style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, system-ui, sans-serif' }}
                    >
                      Tasks
                    </div>
                  </div>
                  <div
                    className="flex-1 p-[10px_12px] text-center"
                    style={{ background: 'rgba(28,39,59,0.7)' }}
                  >
                    <div
                      className="text-[18px] font-bold leading-none"
                      style={{ color: '#FFFFFF', fontFamily: 'Inter, system-ui, sans-serif' }}
                    >
                      {tasks.length > 0 ? Math.round((tasks.filter(t => t.isCompleted).length / tasks.length) * 100) + '%' : '-'}
                    </div>
                    <div
                      className="text-[9px] font-bold tracking-[1px] uppercase mt-[4px]"
                      style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, system-ui, sans-serif' }}
                    >
                      Progress
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Date Picker */}
            <div
              className="inline-flex items-center"
              style={{
                height: '48px',
                borderRadius: '10px',
                background: '#1C50D40D',
                border: '1px solid #1C50D40D',
                padding: '0 14px',
                gap: '10px',
                marginBottom: '16px',
              }}
            >
              <button onClick={prevDay} className="flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors" style={{ width: '24px', height: '24px' }}>
                <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="#17223E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <span className="font-arimo font-bold whitespace-nowrap" style={{ fontSize: '15px', lineHeight: '24px', color: '#17223E' }}>
                {formatDate(currentDate)}
              </span>
              <button onClick={nextDay} className="flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors" style={{ width: '24px', height: '24px' }}>
                <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none">
                  <path d="M9 18L15 12L9 6" stroke="#17223E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* ── Two Cards Side by Side ── */}
            <div
              style={{
                borderRadius: '10px',
                border: '0.8px solid #E5E7EB',
                background: '#FFFFFF',
                boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A',
                padding: '24px',
              }}
            >
            <div className="flex flex-col lg:flex-row" style={{ gap: '16px' }}>

              {/* Left Card: Build Your Study Plan */}
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  borderRadius: '10px',
                  border: '0.8px solid #E5E7EB',
                  background: '#FFFFFF',
                  boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A',
                  padding: '24px',
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between" style={{ marginBottom: '18px' }}>
                  <div className="flex items-center" style={{ gap: '6px' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/build.png" alt="Build" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                    <h2 className="font-arimo font-bold" style={{ fontSize: '18px', lineHeight: '24px', color: '#101828' }}>
                      Build Your Study Plan
                    </h2>
                  </div>
                  <button
                    className="flex items-center gap-2 font-arimo font-semibold text-white hover:opacity-90 transition-opacity"
                    style={{ height: '34px', padding: '0 14px', borderRadius: '8px', background: '#17223E', fontSize: '13px' }}
                    onClick={showSaveAcknowledgement}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/saved.png" alt="Save" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />
                    Save Plan
                  </button>
                </div>

                {/* Inner form area with light blue bg */}
                <div
                  style={{
                    borderRadius: '10px',
                    background: '#DAE2FF40',
                    padding: '20px',
                  }}
                >
                  {/* Task Title */}
                  <div style={{ marginBottom: '14px' }}>
                    <label className="font-arimo font-bold block" style={{ fontSize: '14px', lineHeight: '20px', color: '#101828', marginBottom: '6px' }}>
                      Task Title
                    </label>
                    <input
                      type="text"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="Polity Study Session"
                      className="w-full font-arimo outline-none transition-colors"
                      style={{ height: '44px', borderRadius: '10px', border: '0.8px solid #E5E7EB', padding: '0 14px', fontSize: '16px', color: '#0A0A0A', background: '#FFFFFF' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#4F78F6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79, 120, 246, 0.15)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                  </div>

                  {/* Subject */}
                  <div style={{ marginBottom: '14px' }}>
                    <label className="font-arimo font-bold block" style={{ fontSize: '14px', lineHeight: '20px', color: '#101828', marginBottom: '6px' }}>
                      Subject
                    </label>
                    <div className="relative">
                      <select
                        value={taskSubject}
                        onChange={(e) => setTaskSubject(e.target.value)}
                        className="w-full font-arimo outline-none appearance-none cursor-pointer transition-colors"
                        style={{ height: '44px', borderRadius: '10px', border: '0.8px solid #E5E7EB', padding: '0 36px 0 14px', fontSize: '16px', color: taskSubject ? '#0A0A0A' : '#9CA3AF', background: '#FFFFFF' }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = '#4F78F6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79, 120, 246, 0.15)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        <option value="" disabled>Select Subject</option>
                        {SUBJECT_OPTIONS.map((subject) => (
                          <option key={subject} value={subject}>{subject}</option>
                        ))}
                      </select>
                      <svg className="absolute pointer-events-none" style={{ right: '14px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none">
                        <path d="M6 9l6 6 6-6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>

                  {/* Study Type */}
                  <div style={{ marginBottom: '14px' }}>
                    <label className="font-arimo font-bold block" style={{ fontSize: '14px', lineHeight: '20px', color: '#101828', marginBottom: '6px' }}>
                      Study Type
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: '10px' }}>
                      {studyTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setStudyType(type.id)}
                          className="flex flex-col items-center justify-center font-arimo transition-colors"
                          style={{
                            width: '100%',
                            height: '80px',
                            borderRadius: '20px',
                            border: studyType === type.id ? '2px solid #17223E' : '1px solid #E5E7EB',
                            background: '#FFFFFF',
                            boxShadow: '0px 4px 4px 0px #00000040',
                            padding: '8px 6px',
                            gap: '4px',
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={type.icon} alt={type.label} style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                          <span
                            className="font-arimo text-center"
                            style={{
                              fontSize: '12px',
                              lineHeight: '16px',
                              fontWeight: 500,
                              color: '#374151',
                            }}
                          >
                            {type.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Start Time + End Time */}
                  <div className="flex items-start" style={{ gap: '12px', marginBottom: '18px' }}>
                    <div className="flex-1">
                      <label className="font-arimo font-bold block" style={{ fontSize: '14px', lineHeight: '20px', color: '#101828', marginBottom: '6px' }}>
                        Start Time
                      </label>
                      <div className="relative">
                        <select
                          value={startTime}
                          onChange={(e) => {
                            const newStart = e.target.value;
                            setStartTime(newStart);
                            setEndTime(addThirtyMinutes(newStart));
                          }}
                          className="w-full font-arimo outline-none appearance-none cursor-pointer transition-colors"
                          style={{ height: '44px', borderRadius: '10px', border: '0.8px solid #E5E7EB', padding: '0 36px 0 14px', fontSize: '16px', color: '#0A0A0A', background: '#FFFFFF' }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = '#4F78F6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79, 120, 246, 0.15)'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                          {timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <svg className="absolute pointer-events-none" style={{ right: '14px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none">
                          <path d="M6 9l6 6 6-6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="font-arimo font-bold block" style={{ fontSize: '14px', lineHeight: '20px', color: '#101828', marginBottom: '6px' }}>
                        End Time
                      </label>
                      <div className="relative">
                        <select
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-full font-arimo outline-none appearance-none cursor-pointer transition-colors"
                          style={{ height: '44px', borderRadius: '10px', border: '0.8px solid #E5E7EB', padding: '0 36px 0 14px', fontSize: '16px', color: '#0A0A0A', background: '#FFFFFF' }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = '#4F78F6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79, 120, 246, 0.15)'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                          {timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <svg className="absolute pointer-events-none" style={{ right: '14px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none">
                          <path d="M6 9l6 6 6-6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Repeat this session (recurrence) */}
                  <div
                    style={{
                      borderRadius: '10px',
                      border: '0.8px solid #E5E7EB',
                      background: '#FFFFFF',
                      padding: '14px',
                      marginBottom: '18px',
                    }}
                  >
                    {/* Toggle row */}
                    <div
                      className="flex items-center justify-between cursor-pointer select-none"
                      onClick={() => setRecurEnabled(v => !v)}
                    >
                      <div className="flex items-center" style={{ gap: '8px' }}>
                        <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="#4F78F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 1l4 4-4 4" />
                          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                          <path d="M7 23l-4-4 4-4" />
                          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                        </svg>
                        <span className="font-arimo font-bold" style={{ fontSize: '14px', lineHeight: '20px', color: '#101828' }}>
                          Repeat this session
                        </span>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={recurEnabled}
                        aria-label="Repeat this session"
                        onClick={(e) => { e.stopPropagation(); setRecurEnabled(v => !v); }}
                        className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ${recurEnabled ? 'bg-[#4F78F6]' : 'bg-[#E5E7EB]'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${recurEnabled ? 'left-[18px]' : 'left-0.5'}`} />
                      </button>
                    </div>

                    {recurEnabled && (
                      <div style={{ marginTop: '14px' }}>
                        {/* Repeat type */}
                        <div className="font-arimo font-bold uppercase" style={{ fontSize: '11px', letterSpacing: '0.8px', color: '#6B7280', marginBottom: '8px' }}>
                          Repeat
                        </div>
                        <div className="flex flex-wrap" style={{ gap: '6px', marginBottom: '12px' }}>
                          {(['daily', 'weekly', 'weekdays', 'custom'] as RecurType[]).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setRecurType(t)}
                              className="font-arimo font-medium transition-colors"
                              style={{
                                padding: '5px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                border: recurType === t ? '1px solid #4F78F6' : '0.8px solid #E5E7EB',
                                background: recurType === t ? '#EEF2FF' : '#FFFFFF',
                                color: recurType === t ? '#4F46E5' : '#6B7280',
                              }}
                            >
                              {t === 'custom' ? 'Custom days' : RECUR_TYPE_LABEL[t]}
                            </button>
                          ))}
                        </div>

                        {/* Day picker (custom only) */}
                        {recurType === 'custom' && (
                          <div style={{ marginBottom: '12px' }}>
                            <div className="font-arimo font-bold uppercase" style={{ fontSize: '11px', letterSpacing: '0.8px', color: '#6B7280', marginBottom: '8px' }}>
                              Pick days
                            </div>
                            <div className="flex" style={{ gap: '6px' }}>
                              {DAY_PILLS.map((d) => {
                                const sel = recurDays.includes(d.index);
                                return (
                                  <button
                                    key={d.index}
                                    type="button"
                                    onClick={() => setRecurDays(prev => prev.includes(d.index) ? prev.filter(x => x !== d.index) : [...prev, d.index])}
                                    className="flex items-center justify-center font-arimo font-medium transition-colors"
                                    style={{
                                      width: '30px',
                                      height: '30px',
                                      borderRadius: '50%',
                                      fontSize: '12px',
                                      border: sel ? '1px solid #4F78F6' : '0.8px solid #E5E7EB',
                                      background: sel ? '#4F78F6' : '#FFFFFF',
                                      color: sel ? '#FFFFFF' : '#6B7280',
                                    }}
                                  >
                                    {d.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Ends */}
                        <div className="font-arimo font-bold uppercase" style={{ fontSize: '11px', letterSpacing: '0.8px', color: '#6B7280', marginBottom: '8px' }}>
                          Ends
                        </div>
                        <div className="relative" style={{ marginBottom: '12px' }}>
                          <select
                            value={recurEnd}
                            onChange={(e) => setRecurEnd(e.target.value as RecurEnd)}
                            className="w-full font-arimo outline-none appearance-none cursor-pointer"
                            style={{ height: '40px', borderRadius: '10px', border: '0.8px solid #E5E7EB', padding: '0 36px 0 14px', fontSize: '14px', color: '#0A0A0A', background: '#FFFFFF' }}
                          >
                            <option value="exam">On exam date</option>
                            <option value="2weeks">After 2 weeks</option>
                            <option value="1month">After 1 month</option>
                            <option value="3months">After 3 months</option>
                          </select>
                          <svg className="absolute pointer-events-none" style={{ right: '14px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none">
                            <path d="M6 9l6 6 6-6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>

                        {/* Summary */}
                        <div
                          className="flex items-center font-arimo"
                          style={{ gap: '6px', padding: '8px 10px', borderRadius: '8px', background: '#EEF2FF', fontSize: '12px', color: '#4F46E5' }}
                        >
                          <svg style={{ width: '14px', height: '14px', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
                          </svg>
                          <span>
                            {RECUR_TYPE_SUMMARY[recurType]} {RECUR_END_SUMMARY[recurEnd]}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Add to Plan Button */}
                  <button
                    onClick={handleAddTask}
                    disabled={adding || !taskTitle.trim()}
                    className="flex items-center justify-center gap-2 font-arimo font-bold text-white hover:opacity-90 transition-opacity w-full disabled:opacity-50"
                    style={{ height: '48px', borderRadius: '10px', background: '#17223E', fontSize: '16px' }}
                  >
                    <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                    {adding ? 'Adding...' : "Add to Today's Plan"}
                  </button>
                </div>
              </div>

              {/* Right Card: Today's Planned Tasks */}
              <div
                className="flex flex-col"
                style={{
                  width: '100%', maxWidth: '360px',
                  minWidth: '280px',
                  flexShrink: 0,
                }}
              >
                {/* Header — parallel to "Build Your Study Plan" */}
                <div className="flex items-center" style={{ gap: '6px', marginBottom: '18px', height: '34px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/study-tasks-icon.png" alt="Today's Plan" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                  <h2 className="font-arimo font-bold" style={{ fontSize: '18px', lineHeight: '24px', color: '#101828' }}>
                    Today&apos;s Plan
                  </h2>
                </div>

                {/* Tasks List or Empty State */}
                {tasks.length === 0 ? (
                <div
                  className="flex-1 flex flex-col items-center justify-center text-center"
                  style={{
                    borderRadius: '14px',
                    border: '1px dashed #D1D5DC',
                    padding: '20px',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/empty-plan-calendar.png"
                    alt="Empty calendar"
                    style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '20px' }}
                  />
                  <p className="font-arimo font-bold" style={{ fontSize: '24px', lineHeight: '30px', color: '#4A5565', marginBottom: '8px' }}>
                    Your plan is empty
                  </p>
                  <p className="font-arimo" style={{ fontSize: '20px', lineHeight: '28px', fontWeight: 400, color: '#4A5565' }}>
                    Add study tasks to build your<br />personalized schedule
                  </p>
                </div>
                ) : (
                <div className="flex-1 overflow-y-auto" style={{ maxHeight: '477px' }}>
                  <div className="space-y-3">
                    {sortedTasks.map(task => (
                      <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white">
                        <button onClick={() => handleToggleTask(task.id, task.isCompleted)}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${task.isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                          {task.isCompleted && <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`font-arimo font-bold text-sm ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.title}</p>
                          {(task.startTime || task.type) && (
                            <p className="font-arimo text-xs text-gray-500 flex items-center gap-1.5 flex-wrap">
                              <span>
                                {task.startTime && <>{task.startTime} - {task.endTime || ''}</>}
                                {task.startTime && studyTypeLabel(task.type) && ' · '}
                                {studyTypeLabel(task.type)}
                              </span>
                              {task.recur && (
                                <span
                                  className="font-arimo font-medium"
                                  style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '10px', background: '#EEF2FF', color: '#4F78F6' }}
                                >
                                  ↻ {task.recur}
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                        <button onClick={() => handleDeleteTask(task.id)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                )}

                {/* Bottom Stats — aligned with the left card's "Add to Today's Plan" button */}
                <div style={{ paddingTop: '16px', marginTop: 'auto', marginBottom: '44px' }}>
                  {/* Total Study Time */}
                  <div
                    className="flex items-center justify-center font-arimo"
                    style={{
                      height: '38px',
                      borderRadius: '10px',
                      background: '#EEF2FF',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#312C85',
                      marginBottom: '10px',
                    }}
                  >
                    {totalStudyLabel}
                  </div>

                  {/* Start Focus Session */}
                  <button
                    onClick={startFocusSession}
                    disabled={pendingTaskCount === 0}
                    className="flex items-center justify-center gap-2 font-arimo font-bold text-white hover:opacity-90 transition-opacity w-full disabled:opacity-40"
                    style={{
                      height: '44px',
                      borderRadius: '10px',
                      background: '#00BC7D',
                      fontSize: '14px',
                    }}
                  >
                    <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="10" fill="white"/>
                      <path d="M10 8l6 4-6 4V8z" fill="#00BC7D"/>
                    </svg>
                    Start Focus Session with This Plan
                  </button>
                </div>
              </div>
            </div>
            </div>

            {/* ── Bottom Row: Syllabus Coverage + Weekly Goals + Planner Sync ── */}
            <div className="grid grid-cols-1 gap-4 mt-4 xl:grid-cols-[1fr_1fr_360px]">

              {/* Card 0: Syllabus Coverage */}
              <div
                className="bg-white rounded-[16px] border-[0.8px] border-[#E5E7EB] p-6 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A] min-h-[360px] flex flex-col"
              >
                {/* Header (stays fixed — indentation preserved up to the pie-chart icon) */}
                <div className="flex items-center gap-2 mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/image-removebg-preview%20(60)%201.png" alt="Syllabus" style={{ width: '24px', height: '24px', objectFit: 'contain', flexShrink: 0 }} />
                  <h3 className="font-arimo font-bold text-[#101828]" style={{ fontSize: '16px', lineHeight: '24px' }}>
                    Syllabus Coverage
                  </h3>
                </div>

                {/* Overall Progress */}
                {(() => {
                  const totalDone = syllabusCoverage.reduce((s, i) => s + i.done, 0);
                  const totalAll = syllabusCoverage.reduce((s, i) => s + i.total, 0);
                  const overall = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;
                  return (
                    <div
                      className="flex items-center justify-between rounded-[10px] px-3 mb-3 flex-shrink-0"
                      style={{ height: '40px', background: '#F0FDF4', border: '1px solid #DCFCE7' }}
                    >
                      <span className="font-arimo text-[#15803D]" style={{ fontSize: '13px' }}>Overall Progress</span>
                      <span className="font-arimo font-bold text-[#15803D]" style={{ fontSize: '16px' }}>{overall}%</span>
                    </div>
                  );
                })()}

                {/* Scrollable subject list */}
                <div className="flex-1 overflow-y-auto pr-1" style={{ maxHeight: '240px' }}>
                  <div className="space-y-3">
                    {syllabusCoverage.length === 0 ? (
                      <p className="font-arimo text-[#9CA3AF]" style={{ fontSize: '13px' }}>No syllabus data yet.</p>
                    ) : syllabusCoverage.map((item) => {
                      const color = coverageColor(item.percentage);
                      return (
                        <div key={item.subject}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-arimo text-[#101828]" style={{ fontSize: '13px' }}>{item.subject}</span>
                            <span className="font-arimo font-bold" style={{ fontSize: '13px', color }}>{item.percentage}%</span>
                          </div>
                          <div className="w-full bg-[#E5E7EB] rounded-full h-2">
                            <div className="h-2 rounded-full" style={{ width: `${item.percentage}%`, background: color }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Legend (stays fixed at the bottom) */}
                <div className="flex items-center gap-4 flex-wrap mt-3 pt-3 flex-shrink-0" style={{ borderTop: '1px solid #F3F4F6' }}>
                  <span className="flex items-center gap-1.5 font-arimo text-[#6B7280]" style={{ fontSize: '11px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16A34A', display: 'inline-block', flexShrink: 0 }} /> Good (&gt;30%)
                  </span>
                  <span className="flex items-center gap-1.5 font-arimo text-[#6B7280]" style={{ fontSize: '11px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B', display: 'inline-block', flexShrink: 0 }} /> Review needed
                  </span>
                  <span className="flex items-center gap-1.5 font-arimo text-[#6B7280]" style={{ fontSize: '11px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', display: 'inline-block', flexShrink: 0 }} /> Weak
                  </span>
                </div>
              </div>

              {/* Card 1: Weekly Goals */}
              <div
                className="bg-white rounded-[16px] border-[0.8px] border-[#E5E7EB] p-6 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A] min-h-[360px]"
              >
                {/* Inline add-goal row */}
                <div className="flex items-center gap-2 mb-5">
                  <input
                    type="text"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddGoal(); }}
                    placeholder="Add a weekly goal..."
                    className="flex-1 min-w-0 font-arimo outline-none transition-colors"
                    style={{ height: '40px', borderRadius: '10px', border: '0.8px solid #E5E7EB', padding: '0 14px', fontSize: '14px', color: '#101828', background: '#FFFFFF' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#4F78F6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79, 120, 246, 0.15)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                  <button
                    onClick={handleAddGoal}
                    disabled={!newGoal.trim()}
                    className="flex items-center gap-1.5 font-arimo font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-40 flex-shrink-0"
                    style={{ height: '40px', padding: '0 16px', borderRadius: '10px', background: '#17223E', fontSize: '13px' }}
                  >
                    <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                    Add
                  </button>
                </div>

                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                  {/* Target Icon */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/image-removebg-preview%20(61)%201%20(1).png" alt="Goals" style={{ width: '24px', height: '24px', objectFit: 'contain', flexShrink: 0 }} />
                  <h3 className="font-arimo font-bold text-[#101828]" style={{ fontSize: '16px', lineHeight: '24px' }}>
                    Weekly Goals
                  </h3>
                </div>

                {/* This week's progress */}
                {weeklyGoals.length > 0 && (() => {
                  const completed = weeklyGoals.filter(g => g.completed).length;
                  const total = weeklyGoals.length;
                  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                  return (
                    <div style={{ background: '#F5F3FF', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
                      <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                        <span className="font-arimo font-medium" style={{ fontSize: '13px', color: '#4F46E5' }}>This week&apos;s progress</span>
                        <span className="font-arimo font-bold" style={{ fontSize: '13px', color: '#4F46E5' }}>{completed} / {total} done</span>
                      </div>
                      <div className="w-full rounded-full" style={{ height: '6px', background: '#E0E7FF' }}>
                        <div className="rounded-full transition-all" style={{ height: '6px', width: `${pct}%`, background: '#4F46E5' }} />
                      </div>
                    </div>
                  );
                })()}

                {/* Goals list */}
                <div className="space-y-3">
                  {weeklyGoals.length > 0 ? (
                    weeklyGoals.map((goal, i) => (
                      <div key={i} className="flex items-start gap-3 group">
                        <div
                          className={`w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors cursor-pointer ${goal.completed ? 'bg-[#4F78F6] border-2 border-[#4F78F6]' : 'border-2 border-[#D1D5DB] hover:border-[#4F78F6]'}`}
                          onClick={() => handleToggleGoal(i)}
                        >
                          {goal.completed && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <span
                          className={`flex-1 font-arimo cursor-pointer select-none ${goal.completed ? 'line-through text-gray-400' : 'text-[#101828]'}`}
                          style={{ fontSize: '14px', lineHeight: '20px' }}
                          onClick={() => handleToggleGoal(i)}
                        >
                          {goal.title}
                        </span>
                        <button
                          onClick={() => handleDeleteGoal(i)}
                          className="flex-shrink-0 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete goal"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="font-arimo text-[#6B7280] text-center" style={{ fontSize: '13px', paddingTop: '8px' }}>
                      No goals yet — add one above to get started.
                    </p>
                  )}
                </div>
              </div>

              {/* Card 2: Planner Sync – fixed width matches "Your Plan is Empty" above */}
              <div
                className="bg-white rounded-[16px] border-[0.8px] border-[#E5E7EB] shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A] flex flex-col justify-between"
                style={{ width: '100%', padding: '24px' }}
              >
                <div>
                    <div className="flex items-center gap-2 mb-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/image-removebg-preview%20(64)%201.png" alt="Sync" style={{ width: '24px', height: '24px', objectFit: 'contain', flexShrink: 0 }} />
                      <h3 className="font-arimo font-bold text-[#101828]" style={{ fontSize: '16px', lineHeight: '24px' }}>
                        Planner Sync
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {/* Google Calendar */}
                      <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/Container%20(3).png" alt="GCal" style={{ width: '20px', height: '20px', objectFit: 'contain', flexShrink: 0 }} />
                          <div>
                            <span className="font-arimo text-[#101828]" style={{ fontSize: '14px' }}>Google Calendar</span>
                            {calendarSyncError && (
                              <p className="font-arimo text-[#DC2626] mt-1 max-w-[180px]" style={{ fontSize: '11px', lineHeight: '14px' }}>
                                {calendarSyncError}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleGoogleCalendarToggle}
                          disabled={calendarSyncLoading}
                          aria-pressed={calendarSyncEnabled}
                          aria-label={`${calendarSyncEnabled ? 'Disable' : 'Enable'} Google Calendar sync`}
                          className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors disabled:cursor-wait disabled:opacity-60 ${calendarSyncEnabled ? 'bg-[#101828]' : 'bg-[#D1D5DB]'}`}
                        >
                          <span
                            className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${calendarSyncEnabled ? 'translate-x-4' : 'translate-x-0'}`}
                          />
                        </button>
                      </div>

                      {/* Smart Notifications */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/Container%20(4).png" alt="Notifications" style={{ width: '20px', height: '20px', objectFit: 'contain', flexShrink: 0 }} />
                          <span className="font-arimo text-[#101828]" style={{ fontSize: '14px' }}>Smart Notifications</span>
                        </div>
                        {/* Toggle ON */}
                         <div className="w-10 h-6 bg-[#101828] rounded-full relative cursor-pointer">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-transform"></div>
                        </div>
                      </div>
                    </div>
                </div>
                
                {/* Button */}
                <button
                    onClick={startFocusSession}
                    disabled={pendingTaskCount === 0}
                    className="w-full bg-[#101828] text-white font-arimo font-bold rounded-[8px] hover:opacity-90 transition-opacity disabled:opacity-40"
                    style={{ height: '40px', fontSize: '14px' }}
                >
                    Start Today&apos;s Session
                </button>
              </div>

            </div>
          </div>

          {/* ═══════ Right Column (290px): Streak + Quick Add ═══════ */}
          <div className="flex-shrink-0 flex flex-col gap-5 w-full xl:w-[290px]">

            {/* Study Streak Card */}
            <div
              style={{
                width: '100%',
                borderRadius: '16px',
                border: '0.8px solid #E5E7EB',
                background: '#FFFFFF',
                paddingTop: '24.8px',
                paddingRight: '24.8px',
                paddingBottom: '0.8px',
                paddingLeft: '24.8px',
              }}
            >
              <p className="font-arimo" style={{ fontSize: '16px', lineHeight: '24px', fontWeight: 400, color: '#6A7282', marginBottom: '0' }}>
                Study Streak
              </p>
              <h2 className="font-arimo font-bold" style={{ fontSize: '48px', lineHeight: '48px', letterSpacing: '0px', color: '#312C85', marginBottom: '8px' }}>
                {streakDays} Days
              </h2>
                <div className="flex items-center" style={{ gap: '6px', marginBottom: '4px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/fire-icon.png" alt="Fire" style={{ width: '16px', height: '20px' }} />
                <span className="font-arimo font-bold" style={{ fontSize: '16px', lineHeight: '24px', letterSpacing: '0px', color: '#00BC7D' }}>
                  {weeklyStreakLabel || '-'}
                </span>
              </div>
              <p className="font-arimo" style={{ fontSize: '14px', lineHeight: '20px', fontWeight: 400, letterSpacing: '0px', color: '#6A7282', marginBottom: '24px' }}>
                Longest: {longestStreak} Days
              </p>

              <p className="font-arimo font-bold" style={{ fontSize: '16px', lineHeight: '24px', letterSpacing: '0px', color: '#101828', marginBottom: '12px' }}>
                {calendarMonthYear}
              </p>

              <div className="grid grid-cols-7" style={{ marginBottom: '10px' }}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <span key={i} className="font-arimo text-center" style={{ fontSize: '14px', lineHeight: '20px', fontWeight: 400, color: '#6A7282' }}>
                    {d}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7" style={{ gap: '6px 0', paddingBottom: '16px' }}>
                {calendarDays.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-center font-arimo font-bold"
                    style={{
                      width: '27.5px',
                      height: '27.5px',
                      borderRadius: (item.studied || item.today) ? '10px' : '0',
                      background: item.empty ? 'transparent' : item.today ? '#FF6900' : item.studied ? '#00BC7D' : 'transparent',
                      color: item.empty ? 'transparent' : (item.studied || item.today) ? '#FFFFFF' : '#99A1AF',
                      fontSize: '14px',
                      lineHeight: '20px',
                      margin: '0 auto',
                    }}
                  >
                    {item.empty ? '' : item.day}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Add to Plan */}
            <div
              style={{
                width: '100%',
                borderRadius: '16px',
                border: '0.8px solid #E5E7EB',
                background: '#FFFFFF',
                padding: '20px 16px',
              }}
            >
              {/* Header */}
              <div className="flex items-center" style={{ marginBottom: '16px', gap: '8px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/plus.png" alt="Plus" style={{ width: '24px', height: '24px', objectFit: 'contain', flexShrink: 0 }} />
                <span className="font-arimo font-bold" style={{ fontSize: '18px', lineHeight: '24px', color: '#101828' }}>
                  Quick Add to Plan
                </span>
              </div>

              <div className="flex flex-wrap" style={{ gap: '8px' }}>
                {quickAddSubjects.map((item) => (
                  <button
                    key={item}
                    onClick={() => handleQuickAdd(item)}
                    className="font-arimo hover:bg-gray-100 transition-colors"
                    style={{
                      minHeight: '40px',
                      borderRadius: '10px',
                      border: '0.8px solid #E5E7EB',
                      background: '#F9FAFB',
                      fontSize: '12px',
                      lineHeight: '16px',
                      fontWeight: 500,
                      color: '#374151',
                      padding: '8px 10px',
                      flex: '1 1 120px',
                      textAlign: 'left',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    {SUBJECT_ICON_MAP[item] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={SUBJECT_ICON_MAP[item]}
                        alt=""
                        aria-hidden="true"
                        style={{ ...quickAddIconBoxStyle, objectFit: 'contain' }}
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        style={{ ...quickAddIconBoxStyle, fontSize: '18px', lineHeight: '24px' }}
                      >
                        {getSubjectEmoji(item)}
                      </span>
                    )}
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Distribution */}
            <div
              style={{
                width: '100%',
                borderRadius: '16px',
                border: '0.8px solid #E5E7EB',
                background: '#FFFFFF',
                padding: '20px 16px',
              }}
            >
              <div className="flex items-center gap-2" style={{ marginBottom: '16px' }}>
                <div style={{ width: '22px', height: '22px', flexShrink: 0 }}>
                  <div className="w-full h-full rounded-full border-4 border-t-yellow-400 border-r-red-400 border-b-green-400 border-l-blue-500"></div>
                </div>
                <span className="font-arimo font-bold" style={{ fontSize: '18px', lineHeight: '24px', color: '#101828' }}>
                  Time Distribution
                </span>
              </div>

              {/* SVG Pie Chart */}
              <div className="flex items-center justify-center" style={{ marginBottom: '12px' }}>
                {!hasCompletedTimeDistribution ? (
                  <div className="flex items-center justify-center font-arimo text-[#9CA3AF] text-sm" style={{ height: '140px' }}>
                    Complete at least one task to see distribution
                  </div>
                ) : (
                  <svg viewBox="0 0 160 160" width="160" height="160">
                    {(() => {
                      const cx = 80, cy = 80, r = 60, strokeWidth = 20;
                      const gap = timeByType.length > 1 ? 0.06 : 0; // small gap between segments
                      let angle = -Math.PI / 2;
                      return timeByType.map((slice) => {
                        const sliceAngle = (slice.seconds / totalTypeSecs) * 2 * Math.PI;
                        // Single full-ring segment: draw a plain circle (arc can't close 360°).
                        if (timeByType.length === 1) {
                          return (
                            <circle
                              key={slice.id}
                              cx={cx}
                              cy={cy}
                              r={r}
                              fill="none"
                              stroke={slice.color}
                              strokeWidth={strokeWidth}
                            />
                          );
                        }
                        const start = angle + gap / 2;
                        const end = angle + sliceAngle - gap / 2;
                        const path = donutArcPath(cx, cy, r, start, end);
                        angle += sliceAngle;
                        return (
                          <path
                            key={slice.id}
                            d={path}
                            fill="none"
                            stroke={slice.color}
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                          />
                        );
                      });
                    })()}
                    <text x="80" y="74" textAnchor="middle" dominantBaseline="middle" fill="#17223E" fontWeight="bold" fontSize="26" fontFamily="Arimo, sans-serif">
                      {fmtDuration(totalTypeSecs)}
                    </text>
                    <text x="80" y="96" textAnchor="middle" dominantBaseline="middle" fill="#9CA3AF" fontSize="12" fontFamily="Arimo, sans-serif">
                      today
                    </text>
                  </svg>
                )}
              </div>

              {/* Legend */}
              <div className="space-y-2">
                {!hasCompletedTimeDistribution ? (
                  <div className="font-arimo text-[#9CA3AF] text-center" style={{ fontSize: '13px', paddingTop: '4px' }}>
                    Complete tasks to see subject-wise distribution
                  </div>
                ) : (
                  timeByType.map(slice => (
                    <div key={slice.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: slice.color }}></span>
                        <span className="font-arimo text-[#374151]" style={{ fontSize: '13px' }}>{slice.label}</span>
                      </div>
                      <span className="font-arimo font-bold text-[#111827]" style={{ fontSize: '13px' }}>{fmtDuration(slice.seconds)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

    {/* ── Save Plan Popup ── */}
    {showSaveToast && (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center px-4"
        style={{ background: 'rgba(15, 23, 42, 0.42)' }}
        onClick={() => setShowSaveToast(false)}
      >
        <div
          className="rounded-2xl bg-white shadow-2xl"
          style={{
            width: 'min(92vw, 360px)',
            border: '1px solid #E5E7EB',
            padding: '22px 20px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center rounded-full" style={{ width: '38px', height: '38px', background: '#DCFCE7' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17L4 12" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="font-arimo font-bold text-[#101828]" style={{ fontSize: '18px' }}>
              Your plan is saved!
            </h3>
          </div>
          <p className="font-arimo text-[#4B5563]" style={{ fontSize: '14px', lineHeight: '20px' }}>
            Study plan details are saved successfully.
          </p>
          <button
            onClick={() => setShowSaveToast(false)}
            className="mt-5 w-full font-arimo font-bold text-white rounded-[10px] hover:opacity-90 transition-opacity"
            style={{ height: '42px', background: '#17223E', fontSize: '14px' }}
          >
            OK
          </button>
        </div>
      </div>
    )}

    {/* ── Focus Session Modal ── */}
    {focusActive && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(11,18,42,0.82)' }}
      >
        <div
          className="bg-white shadow-2xl flex flex-col"
          style={{ borderRadius: '24px', width: '520px', maxWidth: '95vw', maxHeight: '90vh', overflow: 'hidden' }}
        >
          {focusDone ? (
            /* ── Summary Screen ── */
            <div className="flex flex-col items-center justify-center p-10 text-center" style={{ minHeight: '360px' }}>
              <div
                className="flex items-center justify-center mb-6"
                style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#DCFCE7' }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="font-arimo font-bold text-[#101828] mb-2" style={{ fontSize: '26px' }}>Session Complete!</h2>
              <p className="font-arimo text-[#6B7280] mb-6" style={{ fontSize: '15px' }}>Great work. Keep the momentum going.</p>
              <div className="flex gap-8 mb-8">
                <div className="text-center">
                  <p className="font-arimo font-bold text-[#17223E]" style={{ fontSize: '32px', lineHeight: '1' }}>{fmtTimer(focusTotalSecs)}</p>
                  <p className="font-arimo text-[#9CA3AF]" style={{ fontSize: '13px', marginTop: '4px' }}>Time Studied</p>
                </div>
                <div className="text-center">
                  <p className="font-arimo font-bold text-[#17223E]" style={{ fontSize: '32px', lineHeight: '1' }}>
                    {focusSessionTasks.filter(t => t.isCompleted).length}/{focusSessionTasks.length}
                  </p>
                  <p className="font-arimo text-[#9CA3AF]" style={{ fontSize: '13px', marginTop: '4px' }}>Tasks Done</p>
                </div>
              </div>
              <button
                onClick={closeFocusSession}
                className="font-arimo font-bold text-white hover:opacity-90 transition-opacity"
                style={{ height: '48px', borderRadius: '12px', background: '#17223E', fontSize: '15px', padding: '0 40px' }}
              >
                Close
              </button>
            </div>
          ) : (
            /* ── Active Session Screen ── */
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-7 pt-6 pb-4" style={{ borderBottom: '1px solid #F3F4F6' }}>
                <div>
                  <h2 className="font-arimo font-bold text-[#101828]" style={{ fontSize: '18px' }}>Focus Session</h2>
                  <p className="font-arimo text-[#9CA3AF]" style={{ fontSize: '13px' }}>{formatDate(new Date())}</p>
                </div>
                <button onClick={closeFocusSession} className="hover:bg-gray-100 rounded-lg p-1.5 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              {/* Current Task + Countdown */}
              {(() => {
                const task = focusSessionTasks[focusTaskIdx];
                const durSecs = task ? taskDurationSecs(task) : 3600;
                const remaining = Math.max(0, durSecs - focusTaskSecs);
                const pct = Math.min(100, Math.round((focusTaskSecs / durSecs) * 100));
                const isTimeUp = focusTaskSecs >= durSecs;
                return (
                  <div className="px-7 py-5">
                    {/* Task name + subject */}
                    <div className="mb-1">
                      <p className="font-arimo text-[#9CA3AF]" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Task {focusTaskIdx + 1} of {focusSessionTasks.length}
                      </p>
                      <h3 className="font-arimo font-bold text-[#101828]" style={{ fontSize: '20px', lineHeight: '1.3' }}>{task?.title ?? '-'}</h3>
                      {task?.subject && (
                        <span className="inline-block font-arimo text-[#312C85] mt-1" style={{ fontSize: '12px', background: '#EEF2FF', borderRadius: '6px', padding: '2px 8px' }}>
                          {getSubjectEmoji(task.subject)} {task.subject}
                        </span>
                      )}
                    </div>

                    {/* Countdown */}
                    <div className="flex items-center justify-between mt-4 mb-2">
                      <div>
                        <p
                          className="font-arimo font-bold"
                          style={{ fontSize: '42px', lineHeight: '1', color: isTimeUp ? '#EF4444' : '#17223E' }}
                        >
                          {isTimeUp ? 'Time\'s up!' : fmtTimer(remaining)}
                        </p>
                        {!isTimeUp && (
                          <p className="font-arimo text-[#9CA3AF]" style={{ fontSize: '12px', marginTop: '2px' }}>
                            remaining | {fmtTimer(focusTotalSecs)} total
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setFocusPaused(p => !p)}
                        className="flex items-center gap-2 font-arimo font-bold hover:opacity-80 transition-opacity"
                        style={{ height: '40px', borderRadius: '10px', background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '0 16px', fontSize: '14px', color: '#374151' }}
                      >
                        {focusPaused ? (
                          <><svg width="14" height="14" viewBox="0 0 24 24" fill="#374151"><path d="M8 5v14l11-7z"/></svg>Resume</>
                        ) : (
                          <><svg width="14" height="14" viewBox="0 0 24 24" fill="#374151"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>Pause</>
                        )}
                      </button>
                    </div>

                    {/* Progress bar for current task */}
                    <div className="w-full bg-[#F3F4F6] rounded-full" style={{ height: '6px' }}>
                      <div
                        className="rounded-full transition-all"
                        style={{ height: '6px', width: `${pct}%`, background: isTimeUp ? '#EF4444' : '#00BC7D' }}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Task Queue */}
              <div className="flex-1 overflow-y-auto px-7 pb-2" style={{ maxHeight: '240px' }}>
                <p className="font-arimo text-[#9CA3AF] mb-2" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>All Tasks</p>
                <div className="space-y-2">
                  {focusSessionTasks.map((task, i) => {
                    const isActive = i === focusTaskIdx && !justCompleted;
                    const isDone = task.isCompleted || i < focusTaskIdx || (i === focusTaskIdx && justCompleted);
                    const isJustMarked = i === focusTaskIdx && justCompleted;
                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 rounded-[10px] px-3 py-2.5"
                        style={{
                          background: isActive ? '#EEF2FF' : isJustMarked ? '#DCFCE7' : 'transparent',
                          border: isActive ? '1px solid #C7D2FE' : isJustMarked ? '1px solid #86EFAC' : '1px solid transparent',
                          opacity: !isActive && !isJustMarked && i > focusTaskIdx ? 0.5 : 1,
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <div
                          className="flex-shrink-0 flex items-center justify-center rounded-full"
                          style={{
                            width: '22px', height: '22px',
                            background: isDone ? '#00BC7D' : isActive ? '#312C85' : '#E5E7EB',
                            border: 'none',
                            transition: 'all 0.3s ease',
                          }}
                        >
                          {isDone ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          ) : (
                            <span className="font-arimo font-bold text-white" style={{ fontSize: '11px' }}>{i + 1}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-arimo font-bold truncate ${isDone ? 'line-through text-[#9CA3AF]' : 'text-[#101828]'}`} style={{ fontSize: '14px' }}>
                            {task.title}
                          </p>
                          {task.startTime && (
                            <p className="font-arimo text-[#9CA3AF]" style={{ fontSize: '12px' }}>{task.startTime}{task.endTime ? ` - ${task.endTime}` : ''}</p>
                          )}
                        </div>
                        {(isActive || isJustMarked) && (
                          <span
                            className="font-arimo font-bold"
                            style={{
                              fontSize: '11px',
                              background: isJustMarked ? '#DCFCE7' : '#E0E7FF',
                              color: isJustMarked ? '#15803D' : '#312C85',
                              borderRadius: '4px',
                              padding: '2px 6px',
                              transition: 'all 0.25s ease',
                            }}
                          >
                            {isJustMarked ? 'Done' : 'Active'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-7 py-4 flex gap-3" style={{ borderTop: '1px solid #F3F4F6' }}>
                <button
                  onClick={focusSkip}
                  className="font-arimo font-bold hover:bg-gray-100 transition-colors"
                  style={{ height: '44px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px', color: '#6B7280', padding: '0 20px' }}
                >
                  Skip
                </button>
                <button
                  onClick={justCompleted ? focusNextTask : focusMarkDone}
                  className="flex-1 font-arimo font-bold text-white"
                  style={{
                    height: '44px',
                    borderRadius: '10px',
                    background: justCompleted ? '#15803D' : '#00BC7D',
                    fontSize: '14px',
                    transition: 'all 0.25s ease',
                  }}
                >
                  {justCompleted ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Next Task →
                    </span>
                  ) : 'Mark Done & Next'}
                </button>
                <button
                  onClick={() => setFocusDone(true)}
                  className="font-arimo font-bold hover:bg-gray-100 transition-colors"
                  style={{ height: '44px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px', color: '#EF4444', padding: '0 20px' }}
                >
                  End
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )}

    </>
  );
}
