'use client';

import React, { useState, useEffect, useRef } from 'react';
import { studyPlannerService } from '@/lib/services';

function fmtTimer(secs: number): string {
  const s = Math.max(0, secs);
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
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

function pieSlicePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x1.toFixed(3)} ${y1.toFixed(3)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(3)} ${y2.toFixed(3)} Z`;
}

interface Task {
  id: string;
  title: string;
  subject?: string;
  type: string;
  startTime?: string;
  endTime?: string;
  isCompleted: boolean;
}

export default function StudyPlannerPage() {
  const [taskTitle, setTaskTitle] = useState('');
  const [taskSubject, setTaskSubject] = useState('');
  const [studyType, setStudyType] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [weeklyStudied, setWeeklyStudied] = useState<number | null>(null);
  const [weeklyTarget, setWeeklyTarget] = useState<number | null>(null);
  const [syllabusCoverage, setSyllabusCoverage] = useState<{ subject: string; percentage: number }[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<{ title: string; completed: boolean }[]>([]);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [editGoals, setEditGoals] = useState<{ title: string; completed: boolean }[]>([]);
  const [savingGoals, setSavingGoals] = useState(false);
  const [adding, setAdding] = useState(false);
  const [studiedDays, setStudiedDays] = useState<number[]>([]);
  const [showSaveToast, setShowSaveToast] = useState(false);
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
  const focusTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    studyPlannerService.getStreak()
      .then(res => {
        if (res.data) {
          setStreakDays(res.data.currentStreak || 0);
          setLongestStreak(res.data.longestStreak || 0);
          if (res.data.weeklyStudied !== undefined) setWeeklyStudied(res.data.weeklyStudied);
          if (res.data.weeklyTarget !== undefined) setWeeklyTarget(res.data.weeklyTarget);
        }
      })
      .catch(() => {});
    studyPlannerService.getSyllabusCoverage()
      .then(res => {
        if (res.data && Array.isArray(res.data)) {
          setSyllabusCoverage(res.data);
        } else if (res.data?.subjects && Array.isArray(res.data.subjects)) {
          setSyllabusCoverage(res.data.subjects);
        }
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
      const res = await studyPlannerService.createTask({
        title: taskTitle,
        subject: taskSubject || undefined,
        type: studyType || 'reading',
        date: toDateParam(currentDate),
        startTime,
        endTime,
      });
      if (res.data) setTasks(prev => [...prev, res.data]);
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

  const showSaveAcknowledgement = () => {
    setShowSaveToast(true);
    if (saveToastTimerRef.current) clearTimeout(saveToastTimerRef.current);
    saveToastTimerRef.current = setTimeout(() => setShowSaveToast(false), 3000);
  };

  // Focus session timer
  useEffect(() => {
    if (focusActive && !focusPaused && !focusDone) {
      focusTimerRef.current = setInterval(() => {
        setFocusTaskSecs(s => s + 1);
        setFocusTotalSecs(s => s + 1);
      }, 1000);
    } else {
      if (focusTimerRef.current) clearInterval(focusTimerRef.current);
    }
    return () => { if (focusTimerRef.current) clearInterval(focusTimerRef.current); };
  }, [focusActive, focusPaused, focusDone]);

  useEffect(() => {
    return () => {
      if (saveToastTimerRef.current) clearTimeout(saveToastTimerRef.current);
    };
  }, []);

  const startFocusSession = () => {
    if (tasks.length === 0) return;
    setFocusSessionTasks([...tasks]);
    setFocusTaskIdx(0);
    setFocusTaskSecs(0);
    setFocusTotalSecs(0);
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
    if (task && !task.isCompleted) {
      await handleToggleTask(task.id, false);
    }
    const updated = focusSessionTasks.map((t, i) => i === focusTaskIdx ? { ...t, isCompleted: true } : t);
    setFocusSessionTasks(updated);
    setJustCompleted(true);
    setTimeout(() => {
      setJustCompleted(false);
      setFocusTaskIdx(prev => {
        const newIdx = prev + 1;
        if (newIdx >= updated.length) {
          setFocusDone(true);
        }
        return newIdx;
      });
      setFocusTaskSecs(0);
    }, 1400);
  };

  const focusSkip = () => {
    focusAdvance(focusTaskIdx + 1, focusSessionTasks);
  };

  const closeFocusSession = () => {
    setFocusActive(false);
    setFocusDone(false);
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
  const offset = (firstDayOfMonth.getDay() + 6) % 7; // 0=Mon â€¦ 6=Sun
  const emptySlots = Array.from({ length: offset }, (_, i) => ({ day: 0, empty: true, studied: false, today: false }));
  const daySlots = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    empty: false,
    studied: studiedDays.includes(i + 1),
    today: i + 1 === todayNum,
  }));
  const calendarDays = [...emptySlots, ...daySlots];

  const studyTypes = [
    { id: 'reading', label: 'Reading', icon: '/study-type-reading.png' },
    { id: 'practice', label: 'Practice', icon: '/practise.png' },
    { id: 'revision', label: 'Revision', icon: '/revision.png' },
    { id: 'test', label: 'Test', icon: '/study-type-test.png' },
    { id: 'notes', label: 'Note Making', icon: '/notes.png' },
    { id: 'answer', label: 'Answer Writing', icon: '/answer writing.png' },
    { id: 'other', label: 'Other', icon: '/others.png' },
  ];

  const quickAddRows = [
    ['Polity', 'History'],
    ['Science & Technology', 'Geography'],
    ['Economy', 'Environment & Ecology'],
  ];

  const quickAddSubjectMap: Record<string, string> = {
    Polity: 'Polity',
    History: 'History',
    'Science & Technology': 'Science & Technology',
    Economy: 'Economy',
    Geography: 'Geography',
    'Environment & Ecology': 'Environment & Ecology',
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
    : 'Total Study Time: â€”';

  // Time distribution by study type
  const typeConfig = [
    { id: 'reading',  label: 'Reading',        color: '#2DD4BF' },
    { id: 'practice', label: 'Practice',        color: '#FBBF24' },
    { id: 'revision', label: 'Revision',        color: '#312C85' },
    { id: 'test',     label: 'Test',            color: '#FF6900' },
    { id: 'notes',    label: 'Note Making',     color: '#818CF8' },
    { id: 'answer',   label: 'Answer Writing',  color: '#34D399' },
    { id: 'other',    label: 'Other',           color: '#9CA3AF' },
  ];
  const timeByType = typeConfig.map(tc => {
    const mins = tasks
      .filter(t => {
        if (!t.startTime || !t.endTime) return false;
        if (tc.id === 'reading' && (!t.type || t.type === 'study')) return true;
        return t.type === tc.id;
      })
      .reduce((sum, t) => {
        const [sh, sm] = t.startTime!.split(':').map(Number);
        const [eh, em] = t.endTime!.split(':').map(Number);
        const diff = (eh * 60 + em) - (sh * 60 + sm);
        return sum + (diff > 0 ? diff : 0);
      }, 0);
    return { ...tc, minutes: mins };
  }).filter(x => x.minutes > 0);
  const totalTypeMins = timeByType.reduce((s, x) => s + x.minutes, 0);
  const fmtHours = (m: number) => (m / 60 % 1 === 0 ? (m / 60).toFixed(0) : (m / 60).toFixed(1)) + 'h';

  // Dynamic month/year display for calendar header
  const calendarMonthYear = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Weekly streak display
  const weeklyStreakLabel = weeklyStudied !== null && weeklyTarget !== null
    ? `${weeklyStudied}/${weeklyTarget} This Week`
    : weeklyStudied !== null
    ? `${weeklyStudied} days this week`
    : null;

  return (
    <>
    <div className="flex flex-col bg-gray-50 overflow-x-hidden" style={{ height: '100%' }}>
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-row gap-5 p-4 md:p-6">

          {/* â•â•â•â•â•â•â• Left Column: Main Content â•â•â•â•â•â•â• */}
          <div className="flex-1 min-w-0">

            {/* Hero Banner â€” matches Figma study planner design */}
            <div
              className="rounded-[16px] border border-white/5 overflow-hidden relative"
              style={{
                background: 'linear-gradient(105deg, #060C1C 0%, #080F1C 50%, #0D121F 75%, #1A1819 100%)',
                padding: '24px 26px 22px',
                marginBottom: '16px',
              }}
            >
              {/* Warm radial glow â€” bottom-right like Figma */}
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
              {/* Subtle gold glow â€” upper-middle */}
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
                      <span
                        className="inline-flex items-center justify-center rounded-[4px]"
                        style={{
                          width: '14px',
                          height: '14px',
                          background: 'rgba(255,255,255,0.15)',
                          color: '#E8B84B',
                          fontSize: '10px',
                          lineHeight: '10px',
                        }}
                      >
                        ▦
                      </span>
                      <span
                        className="text-[11px] font-bold uppercase tracking-[0.5px]"
                        style={{ color: '#E8B84B', fontFamily: 'Inter, system-ui, sans-serif' }}
                      >
                        Daily Study Planner
                      </span>
                    </div>
                  </div>

                  {/* Heading - Orange Pill */}
                  <div
                    className="inline-block rounded-[8px] px-[10px] py-[4px]"
                    style={{
                      background: '#F5A623',
                      boxShadow: '0 2px 8px rgba(245,166,35,0.22)',
                    }}
                  >
                    <h1
                      className="font-bold leading-[1.14]"
                      style={{
                        fontSize: 'clamp(20px, 2.2vw, 45px)',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        letterSpacing: '-0.4px',
                        color: '#0F172A',
                      }}
                    >
                      Where planning meets purpose
                    </h1>
                  </div>
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

            {/* â”€â”€ Two Cards Side by Side â”€â”€ */}
            <div
              style={{
                borderRadius: '10px',
                border: '0.8px solid #E5E7EB',
                background: '#FFFFFF',
                boxShadow: '0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A',
                padding: '24px',
              }}
            >
            <div className="flex" style={{ gap: '16px' }}>

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
                        <option value="History">History</option>
                        <option value="Geography">Geography</option>
                        <option value="Polity">Polity</option>
                        <option value="Economy">Economy</option>
                        <option value="Environment & Ecology">Environment &amp; Ecology</option>
                        <option value="Science & Technology">Science &amp; Technology</option>
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
                    <div className="grid grid-cols-4" style={{ gap: '10px' }}>
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
                          onChange={(e) => setStartTime(e.target.value)}
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
                {/* Tasks List or Empty State */}
                {tasks.length === 0 ? (
                <div
                  className="flex-1 flex flex-col items-center justify-center text-center"
                  style={{
                    height: '477px',
                    borderRadius: '14px',
                    border: '1px dashed #D1D5DC',
                    padding: '20px',
                  }}
                >
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
                    {tasks.map(task => (
                      <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white">
                        <button onClick={() => handleToggleTask(task.id, task.isCompleted)}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${task.isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                          {task.isCompleted && <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`font-arimo font-bold text-sm ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.title}</p>
                          {task.startTime && <p className="font-arimo text-xs text-gray-500">{task.startTime} - {task.endTime || ''}</p>}
                        </div>
                        <button onClick={() => handleDeleteTask(task.id)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                )}

                {/* Bottom Stats */}
                <div style={{ paddingTop: '16px' }}>
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
                    disabled={tasks.length === 0}
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

            {/* â”€â”€ Bottom Row: Syllabus Coverage + Weekly Goals + Planner Sync â”€â”€ */}
            <div className="grid grid-cols-1 gap-4 mt-4 xl:grid-cols-[1fr_1fr_360px]">

              {/* Card 0: Syllabus Coverage */}
              <div
                className="bg-white rounded-[16px] border-[0.8px] border-[#E5E7EB] p-6 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A] min-h-[360px]"
              >
                <div className="flex items-center gap-2 mb-4">
                  <img src="/image-removebg-preview%20(60)%201.png" alt="Syllabus" style={{ width: '24px', height: '24px', objectFit: 'contain', flexShrink: 0 }} />
                  <h3 className="font-arimo font-bold text-[#101828]" style={{ fontSize: '16px', lineHeight: '24px' }}>
                    Syllabus Coverage
                  </h3>
                </div>

                <div className="space-y-3">
                  {syllabusCoverage.map((item) => (
                    <div key={item.subject}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-arimo text-[#101828]" style={{ fontSize: '13px' }}>{item.subject}</span>
                        <span className="font-arimo font-bold text-[#101828]" style={{ fontSize: '13px' }}>{item.percentage}%</span>
                      </div>
                      <div className="w-full bg-[#E5E7EB] rounded-full h-2">
                        <div className="bg-[#17223E] h-2 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 1: Weekly Goals */}
              <div
                className="bg-white rounded-[16px] border-[0.8px] border-[#E5E7EB] p-6 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A] min-h-[360px]"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {/* Target Icon */}
                    <img src="/image-removebg-preview%20(61)%201%20(1).png" alt="Goals" style={{ width: '24px', height: '24px', objectFit: 'contain', flexShrink: 0 }} />
                    <h3 className="font-arimo font-bold text-[#101828]" style={{ fontSize: '16px', lineHeight: '24px' }}>
                      Weekly Goals
                    </h3>
                  </div>
                  <button
                    onClick={() => { setEditGoals(weeklyGoals.map(g => ({ ...g }))); setShowGoalsModal(true); }}
                    className="flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
                    style={{ width: '32px', height: '32px' }}
                    title="Edit goals"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </div>

                <div className="space-y-3">
                  {weeklyGoals.length > 0 ? (
                    weeklyGoals.map((goal, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 cursor-pointer select-none"
                        onClick={() => {
                          const updated = weeklyGoals.map((g, idx) =>
                            idx === i ? { ...g, completed: !g.completed } : g
                          );
                          setWeeklyGoals(updated);
                          studyPlannerService.saveWeeklyGoals(updated).catch(() => {});
                        }}
                      >
                        <div
                          className={`w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${goal.completed ? 'bg-[#4F78F6] border-2 border-[#4F78F6]' : 'border-2 border-[#D1D5DB] hover:border-[#4F78F6]'}`}
                        >
                          {goal.completed && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <span className={`font-arimo ${goal.completed ? 'line-through text-gray-400' : 'text-[#101828]'}`} style={{ fontSize: '14px', lineHeight: '20px' }}>{goal.title}</span>
                      </div>
                    ))
                  ) : (
                    <p className="font-arimo text-[#6B7280] text-center" style={{ fontSize: '13px', paddingTop: '8px' }}>
                      No weekly goals set.
                    </p>
                  )}
                </div>
              </div>

              {/* Card 2: Planner Sync â€” fixed width matches "Your Plan is Empty" above */}
              <div
                className="bg-white rounded-[16px] border-[0.8px] border-[#E5E7EB] shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A] flex flex-col justify-between"
                style={{ width: '100%', padding: '24px' }}
              >
                <div>
                    <div className="flex items-center gap-2 mb-4">
                      <img src="/image-removebg-preview%20(64)%201.png" alt="Sync" style={{ width: '24px', height: '24px', objectFit: 'contain', flexShrink: 0 }} />
                      <h3 className="font-arimo font-bold text-[#101828]" style={{ fontSize: '16px', lineHeight: '24px' }}>
                        Planner Sync
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {/* Google Calendar */}
                      <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
                        <div className="flex items-center gap-3">
                          <img src="/Container%20(3).png" alt="GCal" style={{ width: '20px', height: '20px', objectFit: 'contain', flexShrink: 0 }} />
                          <span className="font-arimo text-[#101828]" style={{ fontSize: '14px' }}>Google Calendar</span>
                        </div>
                        {/* Toggle ON */}
                        <div className="w-10 h-6 bg-[#101828] rounded-full relative cursor-pointer">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-transform"></div>
                        </div>
                      </div>

                      {/* Smart Notifications */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
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
                    className="w-full bg-[#101828] text-white font-arimo font-bold rounded-[8px] hover:opacity-90 transition-opacity"
                    style={{ height: '40px', fontSize: '14px' }}
                >
                    Start Today&apos;s Session
                </button>
              </div>

            </div>
          </div>

          {/* â•â•â•â•â•â•â• Right Column (290px): Streak + Quick Add â•â•â•â•â•â•â• */}
          <div className="flex-shrink-0 flex flex-col gap-5 w-[290px]">

            {/* Study Streak Card */}
            <div
              style={{
                width: '290px',
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
                <img src="/fire-icon.png" alt="Fire" style={{ width: '16px', height: '20px' }} />
                <span className="font-arimo font-bold" style={{ fontSize: '16px', lineHeight: '24px', letterSpacing: '0px', color: '#00BC7D' }}>
                  {weeklyStreakLabel || 'â€”'}
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
                width: '290px',
                borderRadius: '16px',
                border: '0.8px solid #E5E7EB',
                background: '#FFFFFF',
                padding: '20px 16px',
              }}
            >
              {/* Header */}
              <div className="flex items-center" style={{ marginBottom: '16px', gap: '8px' }}>
                <img src="/plus.png" alt="Plus" style={{ width: '24px', height: '24px', objectFit: 'contain', flexShrink: 0 }} />
                <span className="font-arimo font-bold" style={{ fontSize: '18px', lineHeight: '24px', color: '#101828' }}>
                  Quick Add to Plan
                </span>
              </div>

              {/* Quick Add Buttons â€” row-by-row layout */}
              <div className="flex flex-col" style={{ gap: '8px' }}>
                {quickAddRows.map((row, rowIdx) => (
                  <div
                    key={rowIdx}
                    className="grid"
                    style={{
                      gridTemplateColumns: row.length === 4 ? 'repeat(4, 1fr)' : row.length === 2 ? 'repeat(2, 1fr)' : '1fr',
                      gap: '8px',
                    }}
                  >
                    {row.map((item) => (
                      <button
                        key={item}
                        onClick={() => handleQuickAdd(item)}
                        className="flex items-center justify-center font-arimo hover:bg-gray-100 transition-colors"
                        style={{
                          height: '40px',
                          borderRadius: '10px',
                          border: '0.8px solid #E5E7EB',
                          background: '#F9FAFB',
                          fontSize: row.length === 4 ? '12px' : '14px',
                          lineHeight: '20px',
                          fontWeight: 400,
                          color: '#374151',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Time Distribution */}
            <div
              style={{
                width: '290px',
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
                {totalTypeMins === 0 ? (
                  <div className="flex items-center justify-center font-arimo text-[#9CA3AF] text-sm" style={{ height: '140px' }}>
                    No timed tasks today
                  </div>
                ) : (
                  <svg viewBox="0 0 220 220" width="160" height="160">
                    {(() => {
                      const cx = 110, cy = 110, r = 85;
                      let angle = -Math.PI / 2;
                      return timeByType.map((slice) => {
                        const sliceAngle = (slice.minutes / totalTypeMins) * 2 * Math.PI;
                        const path = pieSlicePath(cx, cy, r, angle, angle + sliceAngle);
                        angle += sliceAngle;
                        return <path key={slice.id} d={path} fill={slice.color} stroke="#fff" strokeWidth="2" />;
                      });
                    })()}
                    <text x="110" y="105" textAnchor="middle" dominantBaseline="middle" fill="#17223E" fontWeight="bold" fontSize="22" fontFamily="Arimo, sans-serif">
                      {fmtHours(totalTypeMins)}
                    </text>
                    <text x="110" y="128" textAnchor="middle" dominantBaseline="middle" fill="#6B7280" fontSize="11" fontFamily="Arimo, sans-serif">
                      total
                    </text>
                  </svg>
                )}
              </div>

              {/* Legend */}
              <div className="space-y-2">
                {totalTypeMins === 0 ? (
                  typeConfig.slice(0, 3).map(tc => (
                    <div key={tc.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: tc.color }}></span>
                        <span className="font-arimo text-[#374151]" style={{ fontSize: '13px' }}>{tc.label}</span>
                      </div>
                      <span className="font-arimo font-bold text-[#9CA3AF]" style={{ fontSize: '13px' }}>â€”</span>
                    </div>
                  ))
                ) : (
                  timeByType.map(slice => (
                    <div key={slice.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: slice.color }}></span>
                        <span className="font-arimo text-[#374151]" style={{ fontSize: '13px' }}>{slice.label}</span>
                      </div>
                      <span className="font-arimo font-bold text-[#111827]" style={{ fontSize: '13px' }}>{fmtHours(slice.minutes)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

    {/* â”€â”€ Save Plan Popup â”€â”€ */}
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

    {/* â”€â”€ Focus Session Modal â”€â”€ */}
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
            /* â”€â”€ Summary Screen â”€â”€ */
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
              <p className="font-arimo text-[#6B7280] mb-6" style={{ fontSize: '15px' }}>Great work â€” keep the momentum going.</p>
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
            /* â”€â”€ Active Session Screen â”€â”€ */
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
                      <h3 className="font-arimo font-bold text-[#101828]" style={{ fontSize: '20px', lineHeight: '1.3' }}>{task?.title ?? 'â€”'}</h3>
                      {task?.subject && (
                        <span className="inline-block font-arimo text-[#312C85] mt-1" style={{ fontSize: '12px', background: '#EEF2FF', borderRadius: '6px', padding: '2px 8px' }}>
                          {task.subject}
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
                            remaining Â· {fmtTimer(focusTotalSecs)} total
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
                            <p className="font-arimo text-[#9CA3AF]" style={{ fontSize: '12px' }}>{task.startTime}{task.endTime ? ` â€“ ${task.endTime}` : ''}</p>
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
                            {isJustMarked ? 'Done âœ“' : 'Active'}
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
                  onClick={focusMarkDone}
                  disabled={justCompleted}
                  className="flex-1 font-arimo font-bold text-white"
                  style={{
                    height: '44px',
                    borderRadius: '10px',
                    background: justCompleted ? '#15803D' : '#00BC7D',
                    fontSize: '14px',
                    transition: 'all 0.25s ease',
                    transform: justCompleted ? 'scale(1.04)' : 'scale(1)',
                    boxShadow: justCompleted ? '0 0 0 4px rgba(0,188,125,0.25)' : 'none',
                    letterSpacing: justCompleted ? '0.02em' : '0',
                  }}
                >
                  {justCompleted ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Task Marked Done!
                    </span>
                  ) : 'âœ“ Mark Done & Next'}
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

    {/* â”€â”€ Weekly Goals Edit Modal â”€â”€ */}
    {showGoalsModal && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.45)' }}
        onClick={(e) => { if (e.target === e.currentTarget) setShowGoalsModal(false); }}
      >
        <div className="bg-white rounded-[16px] shadow-xl w-full max-w-md mx-4" style={{ padding: '28px' }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <img src="/image-removebg-preview%20(61)%201%20(1).png" alt="Goals" style={{ width: '24px', height: '24px', objectFit: 'contain', flexShrink: 0 }} />
              <h2 className="font-arimo font-bold text-[#101828]" style={{ fontSize: '18px' }}>Edit Weekly Goals</h2>
            </div>
            <button onClick={() => setShowGoalsModal(false)} className="hover:bg-gray-100 rounded-lg p-1 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Goals list */}
          <div className="space-y-2 mb-4" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {editGoals.map((goal, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={goal.title}
                  onChange={(e) => {
                    const updated = [...editGoals];
                    updated[i] = { ...updated[i], title: e.target.value };
                    setEditGoals(updated);
                  }}
                  className="flex-1 font-arimo outline-none border border-[#E5E7EB] rounded-[8px] px-3 focus:border-[#4F78F6]"
                  style={{ height: '40px', fontSize: '14px', color: '#101828' }}
                  placeholder="Goal title"
                />
                <button
                  onClick={() => setEditGoals(editGoals.filter((_, idx) => idx !== i))}
                  className="flex-shrink-0 hover:bg-red-50 rounded-lg p-1.5 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Add goal */}
          <button
            onClick={() => setEditGoals([...editGoals, { title: '', completed: false }])}
            className="flex items-center gap-2 font-arimo text-[#4F78F6] hover:text-[#3b62d6] transition-colors mb-6"
            style={{ fontSize: '14px', fontWeight: 500 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add goal
          </button>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowGoalsModal(false)}
              className="flex-1 font-arimo font-bold rounded-[8px] border border-[#E5E7EB] hover:bg-gray-50 transition-colors"
              style={{ height: '44px', fontSize: '14px', color: '#374151' }}
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                const cleaned = editGoals.filter(g => g.title.trim());
                setSavingGoals(true);
                try {
                  await studyPlannerService.saveWeeklyGoals(cleaned);
                  setWeeklyGoals(cleaned);
                  setShowGoalsModal(false);
                } catch {
                  // optimistic update even if API fails
                  setWeeklyGoals(cleaned);
                  setShowGoalsModal(false);
                } finally {
                  setSavingGoals(false);
                }
              }}
              disabled={savingGoals}
              className="flex-1 font-arimo font-bold bg-[#101828] text-white rounded-[8px] hover:opacity-90 transition-opacity disabled:opacity-60"
              style={{ height: '44px', fontSize: '14px' }}
            >
              {savingGoals ? 'Savingâ€¦' : 'Save Goals'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
