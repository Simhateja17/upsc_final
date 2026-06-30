'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardPageHero from '@/components/DashboardPageHero';
import { studyGroupService, dashboardService } from '@/lib/services';
import { EntitlementGate } from '@/components/entitlements';
import { useAuth } from '@/contexts/AuthContext';

const SUBJECTS = ['All Rooms', 'Polity', 'History', 'Economy', 'Geography', 'Current Affairs', 'Ethics', 'Sci & Tech'];
const STATUSES = ['All', 'open', 'live', 'closed'];

interface Group {
  id: string;
  name: string;
  description?: string;
  subject: string;
  status: string;
  maxMembers: number;
  memberCount: number;
  isMember: boolean;
  createdById: string;
  creator?: { firstName?: string; lastName?: string; avatarUrl?: string };
  members?: { firstName?: string; lastName?: string; avatarUrl?: string }[];
  createdAt: string;
}

interface Message {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  user?: { firstName?: string; lastName?: string; avatarUrl?: string };
}

export default function StudyGroupsPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const userInitials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rooms' | 'solo' | 'my'>('rooms');
  const [subjectFilter, setSubjectFilter] = useState('All Rooms');
  const [search, setSearch] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', subject: 'Polity', maxMembers: 50, focusTopic: '', subjects: [] as string[], timeGoal: 4 });
  const [sending, setSending] = useState(false);
  const [inRoom, setInRoom] = useState<Group | null>(null);
  const [chatTab, setChatTab] = useState<'chat' | 'goals' | 'board'>('chat');
  const [roomFocusMode, setRoomFocusMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pomodoro timer state – Solo Session
  const BREAK_SECONDS = 5 * 60;
  const [focusMinutes, setFocusMinutes] = useState(25);
  const focusMinutesRef = useRef(25);
  const [pomoSecondsLeft, setPomoSecondsLeft] = useState(25 * 60);
  const [pomoRunning, setPomoRunning] = useState(false);
  const [pomoSession, setPomoSession] = useState(1); // 1..4
  const [pomoMode, setPomoMode] = useState<'focus' | 'break'>('focus');
  const [todaySeconds, setTodaySeconds] = useState(0);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [dayStreak, setDayStreak] = useState(0);
  const [weeklyHours, setWeeklyHours] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const pomoTickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSetFocusMinutes = (m: number) => {
    if (pomoRunning) return;
    const clamped = Math.max(1, Math.min(180, m));
    focusMinutesRef.current = clamped;
    setFocusMinutes(clamped);
    if (pomoMode === 'focus') setPomoSecondsLeft(clamped * 60);
  };

  // Load today's accumulated focus seconds from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const todayKey = `rwj_solo_focus_${new Date().toISOString().slice(0, 10)}`;
    const stored = parseInt(localStorage.getItem(todayKey) || '0', 10);
    if (!Number.isNaN(stored)) setTodaySeconds(stored);
  }, []);

  const persistTodaySeconds = useCallback((secs: number) => {
    if (typeof window === 'undefined') return;
    const todayKey = `rwj_solo_focus_${new Date().toISOString().slice(0, 10)}`;
    localStorage.setItem(todayKey, String(secs));
  }, []);

  // Load completed sessions for today from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = `rwj_solo_sessions_${new Date().toISOString().slice(0, 10)}`;
    const stored = parseInt(localStorage.getItem(key) || '0', 10);
    if (!Number.isNaN(stored)) setCompletedSessions(stored);
  }, []);

  // Compute weekly hours from per-day localStorage entries (Mon–Sun)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const now = new Date();
    const dow = now.getDay(); // 0=Sun
    const mondayOffset = (dow + 6) % 7;
    const hours: number[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - mondayOffset + i);
      const key = `rwj_solo_focus_${d.toISOString().slice(0, 10)}`;
      const secs = parseInt(localStorage.getItem(key) || '0', 10);
      hours.push(secs / 3600);
    }
    setWeeklyHours(hours);
  }, [todaySeconds]);

  // Fetch streak from dashboard
  useEffect(() => {
    dashboardService.getStreak().then((res: any) => {
      if (res?.data?.currentStreak != null) setDayStreak(res.data.currentStreak);
    }).catch(() => {});
  }, []);

  // Tick interval
  useEffect(() => {
    if (!pomoRunning) {
      if (pomoTickRef.current) { clearInterval(pomoTickRef.current); pomoTickRef.current = null; }
      return;
    }
    pomoTickRef.current = setInterval(() => {
      setPomoSecondsLeft((prev) => {
        const focusSecs = focusMinutesRef.current * 60;
        if (prev <= 1) {
          setPomoRunning(false);
          if (pomoMode === 'focus') {
            setTodaySeconds((t) => {
              const next = t + focusSecs;
              persistTodaySeconds(next);
              return next;
            });
            setCompletedSessions((s) => {
              const next = s + 1;
              if (typeof window !== 'undefined') {
                const key = `rwj_solo_sessions_${new Date().toISOString().slice(0, 10)}`;
                localStorage.setItem(key, String(next));
              }
              return next;
            });
            // Move to break, or next focus if session was last
            if (pomoSession >= 4) {
              setPomoSession(1);
              setPomoMode('focus');
              return focusSecs;
            }
            setPomoMode('break');
            return BREAK_SECONDS;
          }
          // break finished → next focus session
          setPomoMode('focus');
          setPomoSession((s) => s + 1);
          return focusSecs;
        }
        if (pomoMode === 'focus') {
          setTodaySeconds((t) => {
            const next = t + 1;
            if (next % 30 === 0) persistTodaySeconds(next);
            return next;
          });
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (pomoTickRef.current) clearInterval(pomoTickRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pomoRunning, pomoMode]);

  const handlePomoStart = () => setPomoRunning((r) => !r);
  const handlePomoReset = () => {
    setPomoRunning(false);
    setPomoSecondsLeft(pomoMode === 'focus' ? focusMinutesRef.current * 60 : BREAK_SECONDS);
  };
  const handlePomoSkip = () => {
    setPomoRunning(false);
    const focusSecs = focusMinutesRef.current * 60;
    if (pomoMode === 'focus') {
      if (pomoSession >= 4) { setPomoSession(1); setPomoSecondsLeft(focusSecs); return; }
      setPomoMode('break');
      setPomoSecondsLeft(BREAK_SECONDS);
    } else {
      setPomoMode('focus');
      setPomoSession((s) => s + 1);
      setPomoSecondsLeft(focusSecs);
    }
  };

  const formatMMSS = (s: number) => {
    const mm = Math.floor(s / 60).toString().padStart(2, '0');
    const ss = (s % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  };
  const formatHourMin = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const pomoTotalForMode = pomoMode === 'focus' ? focusMinutes * 60 : BREAK_SECONDS;
  const pomoProgress = 1 - pomoSecondsLeft / pomoTotalForMode;

  // Today's Study Tasks – persisted per day in localStorage
  interface StudyTask { id: string; text: string; done: boolean; }
  const tasksDayKey = useMemo(() => {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    return `rwj_study_tasks_${localDate}`;
  }, []);
  const [studyTasks, setStudyTasks] = useState<StudyTask[]>([]);
  const [newTaskInput, setNewTaskInput] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const storedTasks = JSON.parse(localStorage.getItem(tasksDayKey) || '[]');
      if (Array.isArray(storedTasks)) setStudyTasks(storedTasks);
    } catch {
      setStudyTasks([]);
    }
  }, [tasksDayKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(tasksDayKey, JSON.stringify(studyTasks));
  }, [studyTasks, tasksDayKey]);

  const toggleTask = (id: string) => {
    setStudyTasks((tasks) => tasks.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  };
  const taskInputRef = useRef<HTMLInputElement>(null);
  const addTask = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = newTaskInput.trim();
    if (!text) return;
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Date.now().toString();
    setStudyTasks((tasks) => [...tasks, { id, text, done: false }]);
    setNewTaskInput('');
    taskInputRef.current?.focus();
  };

  const fetchGroups = useCallback(async () => {
    try {
      const res = await studyGroupService.getGroups();
      if (res.status === 'success' && res.data) {
        setGroups(res.data);
      }
    } catch {
      // silent
    }
  }, []);

  const fetchMyGroups = useCallback(async () => {
    try {
      const res = await studyGroupService.getMyGroups();
      if (res.status === 'success' && res.data) {
        setMyGroups(res.data);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      await Promise.all([fetchGroups(), fetchMyGroups()]);
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, [fetchGroups, fetchMyGroups]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'solo' || tab === 'my' || tab === 'rooms') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const openGroup = useCallback(async (group: Group) => {
    setSelectedGroup(group);
    setMessages([]);
    try {
      const res = await studyGroupService.getGroup(group.id);
      if (res.status === 'success' && res.data) {
        const g = res.data;
        setSelectedGroup(g);
        if (g.messages) setMessages(g.messages);
      }
    } catch {
      // silent
    }
  }, []);

  // Poll messages every 5s when a group is selected
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (!selectedGroup) return;

    const poll = async () => {
      try {
        const last = messages[messages.length - 1];
        const res = await studyGroupService.getMessages(selectedGroup.id, last?.createdAt);
        if (res.status === 'success' && res.data && res.data.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newMsgs = res.data!.filter((m: Message) => !existingIds.has(m.id));
            return [...prev, ...newMsgs];
          });
        }
      } catch {
        // silent
      }
    };

    pollRef.current = setInterval(poll, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroup?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleJoin = async (groupId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const res = await studyGroupService.joinGroup(groupId);
      if (res.status === 'success') {
        await fetchGroups();
        await fetchMyGroups();
        const g = groups.find((x) => x.id === groupId);
        if (g) {
          const joined = { ...g, isMember: true };
          openGroup(joined);
          setInRoom(joined);
          setRoomFocusMode(false);
          setActiveTab('my');
        }
      }
    } catch {
      // silent
    }
  };

  const handleLeaveRoom = async () => {
    if (!inRoom) return;
    await handleLeave(inRoom.id);
    setInRoom(null);
    setRoomFocusMode(false);
  };

  const handleLeave = async (groupId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const res = await studyGroupService.leaveGroup(groupId);
      if (res.status === 'success') {
        await fetchGroups();
        await fetchMyGroups();
        if (selectedGroup?.id === groupId) {
          setSelectedGroup(null);
          setMessages([]);
        }
      }
    } catch {
      // silent
    }
  };

  const handleSend = async () => {
    if (!selectedGroup || !messageInput.trim()) return;
    setSending(true);
    try {
      const res = await studyGroupService.postMessage(selectedGroup.id, messageInput.trim());
      if (res.status === 'success' && res.data) {
        setMessages((prev) => [...prev, res.data]);
        setMessageInput('');
      }
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.name) return;
    try {
      const res = await studyGroupService.createGroup({
        name: createForm.name,
        description: createForm.description || createForm.focusTopic || (createForm.subjects || []).join(', '),
        subject: (createForm.subjects && createForm.subjects.length > 0) ? createForm.subjects[0] : createForm.subject,
        maxMembers: createForm.maxMembers,
      });
      if (res.status === 'success') {
        setShowCreate(false);
        setCreateForm({ name: '', description: '', subject: 'Polity', maxMembers: 50, focusTopic: '', subjects: [], timeGoal: 4 });
        await fetchGroups();
        await fetchMyGroups();
      }
    } catch {
      // silent
    }
  };

  const filteredGroups = (activeTab === 'rooms' ? groups : myGroups).filter((g) => {
    const matchSubject = subjectFilter === 'All Rooms' || g.subject === subjectFilter;
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) ||
                        (g.description || '').toLowerCase().includes(search.toLowerCase());
    return matchSubject && matchSearch;
  });

  const totalOnline = groups.reduce((sum, g) => sum + (g.memberCount || 0), 0);
  const liveCount = groups.filter((g) => g.status === 'live').length;

  const statusColor: Record<string, string> = {
    live: '#EF4444',
    open: '#22C55E',
    closed: '#6B7280',
  };

  const statusBg: Record<string, string> = {
    live: '#EF444418',
    open: '#22C55E18',
    closed: '#6B728018',
  };

  const statusBorder: Record<string, string> = {
    live: '#EF444433',
    open: '#22C55E33',
    closed: '#6B728033',
  };

  const roomTopBorderColors = [
    '#DC2626',
    '#2563EB',
    '#2E7D32',
    '#F59E0B',
    '#8B5CF6',
    '#F97316',
  ];

  return (
    <>
    <EntitlementGate
      accessKey="live_study_room"
      allowed={['full']}
      requiredTier="rise"
      title="Study Groups are available on Rise+"
      message="Upgrade to Rise to join live study rooms, group accountability, and focused community sessions."
    >
    <div className="min-h-screen bg-[#F9FAFB] font-arimo text-[#0C1424]">
      <DashboardPageHero
        // eslint-disable-next-line @next/next/no-img-element
        badgeIcon={<img src="/study-together-icon.png" alt="Study Together" style={{ width: '26px', height: '26px', objectFit: 'contain' }} />}
        badgeText="STUDY TOGETHER"
        title={
          <>
            Your Digital <em className="not-italic" style={{ color: '#E8B84B', fontStyle: 'italic' }}>Study Library</em>
            <br />
            Open 24/7
          </>
        }
        subtitle="Join aspirants. Study with accountability, focus deep, and rise together."
        stats={[
          { value: String(totalOnline || 0), label: 'Online Now', color: '#4ADE80' },
          { value: String(liveCount || 0), label: 'Live Rooms', color: '#FDC700' },
          { value: '2.4h', label: 'Avg. Session', color: '#F87171' },
          { value: String(groups.length || 0), label: 'Groups', color: '#FFFFFF' },
        ]}
        contentShiftY={-20}
        titleMarginBottom={12}
      />

      <main className="mx-auto max-w-[1244px] px-4 pb-16">
        {/* Tabs */}
        <div className="flex flex-col gap-3 border-b border-[#E1E6EF] bg-white px-3 py-3 sm:px-5 md:h-14 md:flex-row md:items-center md:justify-between md:px-8 md:py-0">
          <div className="grid w-full grid-cols-3 gap-1 md:flex md:w-auto">
            <button
              onClick={() => setActiveTab('rooms')}
              className={`flex min-w-0 items-center justify-center gap-1.5 rounded-[8px] px-2 py-2 text-center text-[11px] font-semibold sm:text-[12px] md:px-5 md:text-[13px] ${activeTab === 'rooms' ? 'bg-[#090E1C] text-[#E8B84B]' : 'text-[#6B7A99]'}`}
            >
              ️ Study Rooms
            </button>
            <button
              onClick={() => setActiveTab('solo')}
              className={`flex min-w-0 items-center justify-center gap-1.5 rounded-[8px] px-2 py-2 text-center text-[11px] font-semibold sm:text-[12px] md:px-5 md:text-[13px] ${activeTab === 'solo' ? 'bg-[#090E1C] text-[#E8B84B]' : 'text-[#6B7A99]'}`}
            >
              <svg className="hidden shrink-0 sm:block" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 18v-6a9 9 0 1118 0v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" fill="currentColor"/>
              </svg>
              Solo Focus
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`flex min-w-0 items-center justify-center gap-1.5 rounded-[8px] px-2 py-2 text-center text-[11px] font-semibold sm:text-[12px] md:px-5 md:text-[13px] ${activeTab === 'my' ? 'bg-[#090E1C] text-[#E8B84B]' : 'text-[#6B7A99]'}`}
            >
               In Room {myGroups.length > 0 ? `(${myGroups.length})` : ''}
            </button>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 md:flex md:w-auto md:gap-3">
            <button
              onClick={() => setActiveTab('solo')}
              className="flex min-w-0 items-center justify-center gap-2 rounded-[8px] bg-[#090E1C] px-3 py-2 text-[12px] font-semibold text-white md:px-5 md:text-[13px]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 18v-6a9 9 0 1118 0v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" fill="currentColor"/>
              </svg>
              Solo Session
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="min-w-0 rounded-[8px] bg-[#E8B84B] px-3 py-2 text-[12px] font-semibold text-[#090E1C] md:px-5 md:text-[13px]"
            >
              + Create Room
            </button>
          </div>
        </div>

        {/* Solo Focus Tab Content – Pomodoro timer */}
        {activeTab === 'solo' && (
          <section className="mt-5">
            <div className="mb-4 flex items-center gap-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M3 18v-6a9 9 0 1118 0v6" stroke="#6B7A99" strokeWidth="2" strokeLinecap="round"/>
                <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" fill="#6B7A99"/>
              </svg>
              <h2 className="text-[24px] font-bold text-[#0C1424]">Solo Session</h2>
            </div>

            <div className="rounded-[18px] border border-[#E1E6EF] bg-white px-6 py-10 shadow-sm">
              {/* Time picker – shown when timer is idle */}
              {!pomoRunning && (
                <div className="mb-8 flex flex-col items-center gap-3">
                  <p className="text-[12px] font-bold uppercase tracking-[1.2px] text-[#6B7A99]">Set Focus Duration</p>
                  <div className="flex items-center gap-2">
                    {[15, 25, 45, 60].map((m) => (
                      <button
                        key={m}
                        onClick={() => handleSetFocusMinutes(m)}
                        className="rounded-[8px] border px-4 py-1.5 text-[13px] font-semibold transition"
                        style={{
                          background: focusMinutes === m ? '#E8B84B' : '#F9FAFB',
                          borderColor: focusMinutes === m ? '#E8B84B' : '#DDE3EC',
                          color: focusMinutes === m ? '#0C1424' : '#6B7A99',
                        }}
                      >
                        {m}m
                      </button>
                    ))}
                    <div className="flex items-center gap-1 rounded-[8px] border border-[#DDE3EC] bg-[#F9FAFB] px-3 py-1.5">
                      <input
                        type="number"
                        min={1}
                        max={180}
                        value={focusMinutes}
                        onChange={(e) => handleSetFocusMinutes(Number(e.target.value))}
                        className="w-12 bg-transparent text-center text-[13px] font-semibold text-[#0C1424] outline-none"
                      />
                      <span className="text-[12px] text-[#6B7A99]">min</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Circular timer */}
              <div className="flex flex-col items-center">
                <div className="relative" style={{ width: 280, height: 280 }}>
                  <svg width="280" height="280" viewBox="0 0 280 280">
                    <circle cx="140" cy="140" r="128" stroke="#F1F3F8" strokeWidth="10" fill="none" />
                    <circle
                      cx="140"
                      cy="140"
                      r="128"
                      stroke={pomoMode === 'focus' ? '#E8B84B' : '#22C55E'}
                      strokeWidth="10"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 128}
                      strokeDashoffset={(2 * Math.PI * 128) * (1 - pomoProgress)}
                      transform="rotate(-90 140 140)"
                      style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div
                      className="text-[#0C1424]"
                      style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 64, lineHeight: 1, letterSpacing: '-1px' }}
                    >
                      {formatMMSS(pomoSecondsLeft)}
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[1.5px] text-[#6B7A99]">
                      {pomoMode === 'focus' ? 'Focus Time' : 'Break Time'}
                      <span aria-hidden>🎯</span>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="mt-6 flex items-center gap-3">
                  <button
                    onClick={handlePomoReset}
                    className="flex items-center gap-2 rounded-[10px] border border-[#DDE3EC] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#6B7A99] hover:bg-[#F9FAFB]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M3 12a9 9 0 1 0 3-6.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 4v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Reset
                  </button>
                  <button
                    onClick={handlePomoStart}
                    className="flex items-center gap-2 rounded-[10px] bg-[#E8B84B] px-7 py-2.5 text-[14px] font-bold text-[#0C1424] hover:brightness-105"
                  >
                    {pomoRunning ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
                        Pause
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5z"/></svg>
                        Start Focus
                      </>
                    )}
                  </button>
                  <button
                    onClick={handlePomoSkip}
                    className="flex items-center gap-2 rounded-[10px] border border-[#DDE3EC] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#6B7A99] hover:bg-[#F9FAFB]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4 5v14l8-7-8-7z"/><path d="M13 5v14l8-7-8-7z"/></svg>
                    Skip
                  </button>
                </div>

                {/* Today total */}
                <div className="mt-8 text-center">
                  <div
                    className="text-[#C99730]"
                    style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 700, fontSize: 22 }}
                  >
                    {formatHourMin(todaySeconds)}
                  </div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-[1.5px] text-[#6B7A99]">
                    Your Time Today
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Study Tasks */}
            <div
              className="mt-5 bg-white"
              style={{
                borderRadius: 16,
                border: '1px solid rgba(11,22,40,0.09)',
                padding: '41px 25px 25px',
              }}
            >
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 13, color: '#0C1424', margin: 0 }}>
                  📋 Today&apos;s Study Tasks
                </h3>
                <button
                  type="button"
                  onClick={() => taskInputRef.current?.focus()}
                  style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 13, color: '#C99730', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  + Add Task
                </button>
              </div>

              {studyTasks.length === 0 && (
                <p style={{ fontSize: 13, color: '#9AA3B8', marginBottom: 12 }}>No tasks yet. Add one below to track your session goals.</p>
              )}

              {/* Task list */}
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {studyTasks.map((task) => (
                  <li
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      paddingTop: 9,
                      paddingBottom: 10,
                      borderBottom: '1px solid rgba(11,22,40,0.09)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleTask(task.id)}
                      style={{
                        flexShrink: 0,
                        width: 20,
                        height: 20,
                        borderRadius: 5,
                        border: task.done ? '1px solid #22C55E' : '1px solid rgba(11,22,40,0.17)',
                        background: task.done ? '#22C55E' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'background 0.15s, border-color 0.15s',
                      }}
                    >
                      {task.done && (
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                          <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                    <span
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: 13,
                        fontWeight: 400,
                        color: task.done ? '#9AA3B8' : '#374560',
                        textDecoration: task.done ? 'line-through' : 'none',
                      }}
                    >
                      {task.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Input row */}
              <form className="mt-3 flex items-center gap-2" onSubmit={addTask}>
                <input
                  ref={taskInputRef}
                  type="text"
                  placeholder="Add a task for this session..."
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  style={{
                    flex: 1,
                    background: '#FAF8F4',
                    border: '1px solid rgba(11,22,40,0.09)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 13,
                    color: '#0C1424',
                    outline: 'none',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(232,184,75,0.5)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(11,22,40,0.09)'; }}
                />
                <button
                  type="submit"
                  style={{
                    background: 'rgba(232,184,75,0.12)',
                    border: '1px solid rgba(232,184,75,0.30)',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontFamily: 'DM Sans, sans-serif',
                    fontWeight: 700,
                    fontSize: 12,
                    color: '#C99730',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Add
                </button>
              </form>
            </div>

            {/* ── Dashboard Stats Row ────────────────────────────── */}
            {(() => {
              const doneTasks = studyTasks.filter((t) => t.done).length;
              const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
              const todayWeekIdx = (new Date().getDay() + 6) % 7;
              const totalWeekHours = weeklyHours.reduce((a, b) => a + b, 0);
              const maxBar = Math.max(...weeklyHours, 0.01);
              const totalWeekFormatted = (() => {
                const h = Math.floor(totalWeekHours);
                const m = Math.round((totalWeekHours - h) * 60);
                return h > 0 ? `${h}h ${m}m total` : `${m}m total`;
              })();
              const quotes = [
                { text: '"Success is not final, failure is not fatal: It is the courage to continue that counts."', author: '— Winston Churchill' },
                { text: '"The secret of getting ahead is getting started."', author: '— Mark Twain' },
                { text: '"It does not matter how slowly you go as long as you do not stop."', author: '— Confucius' },
                { text: '"Believe you can and you\'re halfway there."', author: '— Theodore Roosevelt' },
                { text: '"An investment in knowledge pays the best interest."', author: '— Benjamin Franklin' },
                { text: '"The expert in anything was once a beginner."', author: '— Helen Hayes' },
                { text: '"Hard work beats talent when talent doesn\'t work hard."', author: '— Tim Notke' },
              ];
              const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
              const quote = quotes[dayOfYear % quotes.length];

              return (
                <>
                  {/* Stats cards */}
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { value: String(completedSessions), label: 'Sessions Today', color: '#C99730' },
                      { value: String(doneTasks), label: 'Tasks Done', color: '#C99730' },
                      { value: formatHourMin(todaySeconds), label: 'Study Time', color: todaySeconds > 0 ? '#C99730' : '#6B7A99' },
                      { value: `${dayStreak}${dayStreak > 0 ? '🔥' : ''}`, label: 'Day Streak', color: '#C99730' },
                    ].map(({ value, label, color }) => (
                      <div
                        key={label}
                        className="flex flex-col items-center justify-center rounded-[14px] border border-[#E1E6EF] bg-white py-4"
                      >
                        <span className="text-[22px] font-bold" style={{ color }}>{value}</span>
                        <span className="mt-1 text-[11px] text-[#6B7A99]">{label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Motivational quote */}
                  <div
                    className="mt-5 rounded-[14px] px-5 py-5"
                    style={{ background: '#FFFBEF', border: '1.5px solid #E8B84B' }}
                  >
                    <div className="mb-2 flex justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2a7 7 0 017 7c0 3-1.8 5.5-4.5 6.7V17a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1.3C6.8 14.5 5 12 5 9a7 7 0 017-7z" stroke="#C99730" strokeWidth="1.5" fill="#FFF3CD"/>
                        <path d="M9 21h6M10 18v3M14 18v3" stroke="#C99730" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <p
                      className="text-center text-[13px] italic"
                      style={{ fontFamily: 'Georgia, serif', lineHeight: '1.6', color: '#6B4F00' }}
                    >
                      {quote.text}
                    </p>
                    <p className="mt-2 text-center text-[12px] font-semibold" style={{ color: '#C99730' }}>
                      {quote.author}
                    </p>
                  </div>

                  {/* This Week's Study Hours */}
                  <div className="mt-5 rounded-[14px] border border-[#E1E6EF] bg-white px-5 py-4">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-[13px] font-bold text-[#0C1424]">📅 This Week&apos;s Study Hours</span>
                      <span className="text-[12px] font-semibold" style={{ color: '#C99730' }}>{totalWeekFormatted}</span>
                    </div>
                    <div className="flex items-end justify-between gap-2" style={{ height: 88 }}>
                      {weeklyHours.map((h, i) => {
                        const isToday = i === todayWeekIdx;
                        const barH = Math.max(4, (h / maxBar) * 64);
                        return (
                          <div key={weekLabels[i]} className="flex flex-1 flex-col items-center gap-1.5">
                            <div
                              className="w-full rounded-t-[4px]"
                              style={{ height: barH, background: isToday ? '#C99730' : '#EDE8DC' }}
                            />
                            <span
                              className="text-[10px] font-semibold"
                              style={{ color: isToday ? '#C99730' : '#9AA3B8' }}
                            >
                              {weekLabels[i]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Want to study with others? */}
                  <div
                    className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-[14px] px-5 py-4"
                    style={{ background: '#0C1424' }}
                  >
                    <div className="flex items-center gap-3">
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <circle cx="12" cy="10" r="4" fill="#6B7A99"/>
                        <circle cx="20" cy="10" r="4" fill="#4B5A79"/>
                        <path d="M4 26c0-4.4 3.6-8 8-8h8c4.4 0 8 3.6 8 8" stroke="#6B7A99" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <div>
                        <p className="text-[13px] font-bold text-white">Want to study with others?</p>
                        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          Join a Study Room and rise together with 15,000+ aspirants
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('rooms')}
                      className="shrink-0 rounded-[10px] px-5 py-2 text-[12px] font-bold text-[#0C1424] hover:brightness-105"
                      style={{ background: '#C99730' }}
                    >
                      Browse Rooms →
                    </button>
                  </div>

                  {/* Back to Study Rooms */}
                  <div className="mt-5 mb-2 flex justify-center">
                    <button
                      onClick={() => setActiveTab('rooms')}
                      className="text-[12px] font-semibold underline underline-offset-2"
                      style={{ color: '#6B7A99', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      ← Back to Study Rooms
                    </button>
                  </div>
                </>
              );
            })()}
          </section>
        )}

        {/* Search & filters - only show for rooms tab */}
        {activeTab === 'rooms' && (
        <section className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map((item) => (
              <button
                key={item}
                onClick={() => setSubjectFilter(item)}
                className={`rounded-full border px-4 py-2 text-[12px] font-semibold ${subjectFilter === item ? 'border-[#E8B84B] bg-[#E8B84B]/10 text-[#C99730]' : 'border-[#DDE3EC] bg-white text-[#6B7A99]'}`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="flex w-full items-center gap-2 rounded-[10px] border border-[#E1E6EF] bg-white px-4 py-2 text-[13px] text-[#757575] sm:w-auto">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search rooms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#757575] sm:min-w-[140px]"
            />
          </div>
        </section>
        )}

        {/* Room/My Groups Content */}
        {activeTab !== 'solo' && (
        <>
        {/* Divider */}
        <div className="mt-5 flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#6B7A99]">
            {activeTab === 'rooms' ? 'Active Right Now' : 'Your Groups'}
          </span>
          <span className="h-px flex-1 bg-[#DDE3EC]" />
        </div>

        {/* Groups grid */}
        {loading ? (
          <div className="mt-8 text-center text-[#6B7A99]">Loading rooms...</div>
        ) : filteredGroups.length === 0 ? (
          <div className="mt-8 text-center text-[#6B7A99]">
            No rooms found. {activeTab === 'rooms' ? 'Be the first to create one!' : 'Join a group to see it here.'}
          </div>
        ) : (
          <section className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
            {filteredGroups.map((group, index) => (
              <article
                key={group.id}
                onClick={() => openGroup(group)}
                className="cursor-pointer overflow-hidden rounded-[16px] border border-[#E1E6EF] bg-white shadow-sm transition-shadow hover:shadow-md"
                style={{ borderTop: `4px solid ${roomTopBorderColors[index % roomTopBorderColors.length]}` }}
              >
                <div className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span
                      className="rounded-full border px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.9px]"
                      style={{
                        color: statusColor[group.status] || '#6B7280',
                        borderColor: statusBorder[group.status] || '#6B728033',
                        background: statusBg[group.status] || '#6B728018',
                      }}
                    >
                      ● {group.status}
                    </span>
                    <div className="flex gap-1">
                      <span className="rounded-[6px] bg-[#F0F2F5] px-2 py-1 text-[10px] font-semibold text-[#6B7A99]">
                        {group.subject}
                      </span>
                    </div>
                  </div>
                  <h3 className="mb-2 text-[15px] font-bold text-[#0C1424]">{group.name}</h3>
                  <p className="mb-5 text-[12px] text-[#6B7A99]">
                    {group.description || `Members ${group.memberCount}/${group.maxMembers}`}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[12px] text-[#6B7A99]">
                      <span className="flex -space-x-1">
                        {(group.members ?? []).slice(0, 5).map((m, i) => {
                          const initials = ((m.firstName?.[0] ?? '') + (m.lastName?.[0] ?? '')).toUpperCase() || '?';
                          const colors = ['#172444', '#1e3a5f', '#3b1f6e', '#1a4731', '#5c2d0a'];
                          return (
                            <span key={i} style={{ background: colors[i % colors.length] }} className="flex size-5 items-center justify-center rounded-full text-[9px] font-bold text-white ring-1 ring-white">
                              {initials}
                            </span>
                          );
                        })}
                        {(group.members?.length ?? 0) === 0 && (
                          <span className="flex size-5 items-center justify-center rounded-full bg-[#172444] text-[9px] text-white">–</span>
                        )}
                      </span>
                      <span>{group.memberCount} studying</span>
                    </div>
                    {group.isMember ? (
                      <button
                        onClick={(e) => handleLeave(group.id, e)}
                        className="rounded-[8px] border border-[#EF4444] px-4 py-2 text-[12px] font-bold text-[#EF4444]"
                      >
                        Leave
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleJoin(group.id, e)}
                        className="rounded-[8px] bg-[#E8B84B] px-4 py-2 text-[12px] font-bold text-[#090E1C]"
                      >
                        Join Room →
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}

        {/* Chat Panel */}
        {selectedGroup && (
          <div className="mt-8 overflow-hidden rounded-[18px] border border-[#E1E6EF] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E1E6EF] bg-[#0C1424] px-6 py-4">
              <div>
                <h3 className="text-[16px] font-bold text-white">{selectedGroup.name}</h3>
                <p className="text-[11px] text-white/50">
                  {selectedGroup.subject} · {selectedGroup.memberCount} members · {selectedGroup.status}
                </p>
              </div>
              <div className="flex gap-2">
                {selectedGroup.isMember && (
                  <button
                    onClick={() => handleLeave(selectedGroup.id)}
                    className="rounded-[8px] border border-white/20 px-4 py-2 text-[12px] font-bold text-white/80"
                  >
                    Leave
                  </button>
                )}
                <button
                  onClick={() => { setSelectedGroup(null); setMessages([]); }}
                  className="rounded-[8px] bg-[#E8B84B] px-4 py-2 text-[12px] font-bold text-[#090E1C]"
                >
                  Close
                </button>
              </div>
            </div>

            {selectedGroup.isMember ? (
              <>
                <div className="h-[320px] overflow-y-auto bg-[#F4F6FA] px-6 py-4">
                  {messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-[12px] text-[#6B7A99]">
                      No messages yet. Say hello! 👋
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {messages.map((msg) => (
                        <div key={msg.id} className="flex items-start gap-3">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#172444] text-[10px] font-bold text-white">
                            {(msg.user?.firstName?.[0] || 'U')}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-[#0C1424]">
                                {msg.user?.firstName || 'User'} {msg.user?.lastName || ''}
                              </span>
                              <span className="text-[10px] text-[#6B7A99]">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[13px] text-[#0C1424]">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 border-t border-[#E1E6EF] bg-white px-6 py-3">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                    placeholder="Type a message..."
                    className="flex-1 rounded-[10px] border border-[#E1E6EF] bg-[#F4F6FA] px-4 py-2 text-[13px] text-[#0C1424] outline-none placeholder:text-[#9CA3AF]"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !messageInput.trim()}
                    className="rounded-[10px] bg-[#E8B84B] px-5 py-2 text-[13px] font-bold text-[#090E1C] disabled:opacity-50"
                  >
                    {sending ? '...' : 'Send'}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center px-6 py-10">
                <p className="mb-4 text-[14px] text-[#6B7A99]">Join this group to view and send messages.</p>
                <button
                  onClick={() => handleJoin(selectedGroup.id)}
                  className="rounded-[10px] bg-[#E8B84B] px-7 py-3 text-[14px] font-bold text-[#090E1C]"
                >
                  Join Group →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Features section */}
        <div className="mt-10 flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#6B7A99]">Room Features</span>
          <span className="h-px flex-1 bg-[#DDE3EC]" />
        </div>
        <section className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            ['🍅', 'Pomodoro Timer', 'Stay deep in focus with proven time blocks'],
            ['🏆', 'Leaderboards', 'Track rankings and compete with peers'],
            ['📋', 'Task Cards', 'Share daily goals, stay accountable'],
            ['🔍', 'Peer Review', 'Get answer feedback from fellow aspirants'],
          ].map(([icon, title, desc]) => (
            <div key={title} className="rounded-[14px] border border-[#E1E6EF] bg-white p-6 text-center">
              <div className="mb-3 text-[26px]">{icon}</div>
              <h3 className="mb-2 text-[13px] font-bold text-[#0C1424]">{title}</h3>
              <p className="text-[12px] text-[#6B7A99]">{desc}</p>
            </div>
          ))}
        </section>
        </>
        )}
      </main>

      {/* Create Group Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setShowCreate(false)}>
          <div className="relative w-full max-w-[520px] rounded-[20px] bg-[#F4F6FA] p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => setShowCreate(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#6B7A99] transition hover:bg-[#E1E6EF] hover:text-[#0C1424]"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <span className="text-[24px]">🚀</span>
                <span className="rounded-[8px] bg-[#FFD700] px-3 py-1.5">
                  <h3 className="text-[22px] font-bold text-[#0C1424]" style={{ fontFamily: 'var(--font-cormorant)' }}>
                    Create Study Room
                  </h3>
                </span>
              </div>
              <p className="mt-2 text-[14px] text-[#6B7A99]">
                Set up your space and invite aspirants to study together.
              </p>
            </div>

            {/* Form */}
            <div className="flex flex-col gap-5">
              {/* Room Name */}
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[1px] text-[#6B7A99]">
                  Room Name
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., Polity Warriors · Evening Batch"
                  className="w-full rounded-[12px] border border-[#DDE3EC] bg-white px-4 py-3 text-[14px] text-[#0C1424] outline-none placeholder:text-[#9CA3AF] focus:border-[#E8B84B]"
                />
              </div>

              {/* Group Rules */}
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[1px] text-[#6B7A99]">
                  Group Rules <span className="font-normal normal-case text-[#9CA3AF]">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={createForm.focusTopic || ''}
                  onChange={(e) => setCreateForm((p) => ({ ...p, focusTopic: e.target.value }))}
                  placeholder="Describe the group, its purpose, rules, joining criteria, expectations from members, and include a motivational welcome message for aspirants."
                  className="w-full resize-none rounded-[12px] border border-[#DDE3EC] bg-white px-4 py-3 text-[14px] text-[#0C1424] outline-none placeholder:text-[#9CA3AF] focus:border-[#E8B84B]"
                />
              </div>

              {/* Capacity & Daily Time Goal */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[1px] text-[#6B7A99]">
                    Capacity
                  </label>
                  <select
                    value={createForm.maxMembers}
                    onChange={(e) => setCreateForm((p) => ({ ...p, maxMembers: Number(e.target.value) }))}
                    className="w-full appearance-none rounded-[12px] border border-[#DDE3EC] bg-white px-4 py-3 text-[14px] text-[#0C1424] outline-none focus:border-[#E8B84B]"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                  >
                    {[0, 5, 10, 20, 50, 100].map((n) => (
                      <option key={n} value={n}>{n === 0 ? 'Unlimited' : `${n} People`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[1px] text-[#6B7A99]">
                    Daily Time Goal
                  </label>
                  <select
                    value={createForm.timeGoal || 4}
                    onChange={(e) => setCreateForm((p) => ({ ...p, timeGoal: Number(e.target.value) }))}
                    className="w-full appearance-none rounded-[12px] border border-[#DDE3EC] bg-white px-4 py-3 text-[14px] text-[#0C1424] outline-none focus:border-[#E8B84B]"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                  >
                    {[1, 2, 3, 4, 5, 6, 8].map((h) => (
                      <option key={h} value={h}>{h} {h === 1 ? 'hour' : 'hours'} per day</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => {
                  setShowCreate(false);
                  setCreateForm({ name: '', description: '', subject: 'Polity', maxMembers: 50, focusTopic: '', subjects: [], timeGoal: 4 });
                }}
                className="flex-1 rounded-[12px] border border-[#DDE3EC] bg-white py-3 text-[14px] font-semibold text-[#6B7A99] hover:bg-[#F9FAFB]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!createForm.name}
                className="flex-[2] rounded-[12px] bg-[#0C1424] py-3 text-[14px] font-bold text-[#E8B84B] disabled:opacity-50 hover:bg-[#17223E]"
              >
                🚀 Go Live Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </EntitlementGate>

    {/* ── Full-screen Room View ────────────────────────────────────────── */}
    {inRoom && (
      <div className="fixed inset-0 z-[200] flex flex-col" style={{ background: '#F8F3EA' }}>

        {/* Dark Navbar — matches DashboardHeader exactly */}
        <header
          className="flex shrink-0 items-center justify-between px-3 md:px-6"
          style={{ background: 'rgba(7,14,30,0.98)', backdropFilter: 'blur(24px) saturate(200%)', borderBottom: '1px solid rgba(255,255,255,0.06)', height: 64 }}
        >
          {/* Logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="RiseWithJeet Logo" className="h-auto w-[90px] md:w-[110px] object-contain" />

          {/* Center tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setInRoom(null); setRoomFocusMode(false); setActiveTab('rooms'); }}
              className="px-4 py-2 text-[13px] font-semibold text-white/60 hover:text-white/90 transition"
            >
              Study Rooms
            </button>
            <button
              onClick={() => { setInRoom(null); setRoomFocusMode(false); setActiveTab('solo'); }}
              className="px-4 py-2 text-[13px] font-semibold text-white/60 hover:text-white/90 transition"
            >
              Solo Focus
            </button>
            <button
              className="flex items-center gap-2 rounded-[8px] px-4 py-2 text-[13px] font-bold text-white"
              style={{ background: 'rgba(255,255,255,0.12)' }}
            >
              <span className="text-[10px]">■</span> In Room
            </button>
          </div>

          {/* Right actions — mirrors DashboardHeader */}
          <div className="flex items-center gap-3">
            {/* Focus Mode pill */}
            <button
              type="button"
              onClick={() => setRoomFocusMode((active) => !active)}
              aria-pressed={roomFocusMode}
              title={roomFocusMode ? 'Focus mode on - chat hidden' : 'Focus mode off - chat visible'}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
              style={{
                background: roomFocusMode ? 'rgba(239,68,68,0.16)' : 'rgba(34,197,94,0.12)',
                border: `1px solid ${roomFocusMode ? 'rgba(239,68,68,0.34)' : 'rgba(34,197,94,0.28)'}`,
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: roomFocusMode ? '#EF4444' : '#22C55E' }}
              />
              <span className="text-[12px] font-semibold text-white/80">🎯 Focus Mode</span>
            </button>

            {/* Upgrade button — gold filled, matching Image #8 */}
            <button
              className="hidden sm:inline-flex items-center gap-1.5 rounded-[12px] px-4 py-2 text-[13px] font-semibold"
              style={{ background: '#E8B84B', color: '#0C1424', border: 'none' }}
            >
              + Upgrade
            </button>

            {/* Bell — same style as DashboardHeader */}
            <button
              className="relative flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-[#1a2540] text-white hover:bg-[#243050] transition-colors flex-shrink-0"
              style={{ border: '1px solid rgba(255,255,255,0.16)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"/>
                <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"/>
              </svg>
            </button>

            {/* User avatar — gold gradient with real initials */}
            <div
              className="flex h-[38px] w-[38px] items-center justify-center rounded-full text-[14px] font-bold text-[#0E182D]"
              style={{ background: 'linear-gradient(135deg, #FFD170 0%, #D4A843 100%)' }}
            >
              {userInitials}
            </div>
          </div>
        </header>

        {/* Room header bar */}
        <div
          className="flex shrink-0 items-center justify-between px-6 py-3"
          style={{ background: 'white', borderBottom: '1px solid #E8E3D8' }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold text-[#EF4444]"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <span className="h-2 w-2 rounded-full bg-[#EF4444]" /> Live
            </span>
            <div>
              <h1 className="text-[18px] font-bold text-[#0C1424]">{inRoom.name}</h1>
              <p className="text-[12px] text-[#6B7A99]">{inRoom.description || inRoom.subject}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#E1E6EF] bg-white text-[18px] hover:bg-[#F4F6FA] transition">
              🔕
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#E1E6EF] bg-white text-[18px] hover:bg-[#F4F6FA] transition">
              🎯
            </button>
            <button
              onClick={handleLeaveRoom}
              className="rounded-[10px] border border-[#EF4444] bg-[#FFF5F5] px-5 py-2 text-[13px] font-bold text-[#EF4444] hover:bg-[#FEF2F2] transition"
            >
              Leave Room
            </button>
          </div>
        </div>

        {/* Body: main area + chat panel */}
        <div className="flex flex-1 overflow-hidden">

          {/* Main scrollable area */}
          <div className="flex-1 overflow-y-auto p-6">

            {/* Pomodoro timer card */}
            <div
              className="mb-5 rounded-[20px] bg-white p-8"
              style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
            >
              {/* Circular timer */}
              <div className="flex flex-col items-center">
                <div className="relative" style={{ width: 220, height: 220 }}>
                  <svg width="220" height="220" viewBox="0 0 220 220">
                    <circle cx="110" cy="110" r="100" stroke="#EDE8DC" strokeWidth="8" fill="none"/>
                    <circle
                      cx="110" cy="110" r="100"
                      stroke={pomoMode === 'focus' ? '#C99730' : '#22C55E'}
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 100}
                      strokeDashoffset={(2 * Math.PI * 100) * (1 - pomoProgress)}
                      transform="rotate(-90 110 110)"
                      style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div
                      className="text-[#0C1424]"
                      style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 52, lineHeight: 1, letterSpacing: '-1px' }}
                    >
                      {formatMMSS(pomoSecondsLeft)}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[1.5px] text-[#6B7A99]">
                      {pomoMode === 'focus' ? 'Focus Time' : 'Break Time'} <span>🎯</span>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-[11px] font-bold uppercase tracking-[1.2px] text-[#6B7A99]">
                  🔴 Pomodoro · Session {pomoSession} of 4
                </p>

                {/* Controls */}
                <div className="mt-5 flex items-center gap-3">
                  <button
                    onClick={handlePomoReset}
                    className="flex items-center gap-2 rounded-[10px] border border-[#DDE3EC] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#6B7A99] hover:bg-[#F9FAFB]"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path d="M3 12a9 9 0 1 0 3-6.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 4v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Reset
                  </button>
                  <button
                    onClick={handlePomoStart}
                    className="flex items-center gap-2 rounded-[10px] px-7 py-2.5 text-[14px] font-bold text-[#0C1424] hover:brightness-105"
                    style={{ background: '#C99730' }}
                  >
                    {pomoRunning ? (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
                        Pause
                      </>
                    ) : (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5z"/></svg>
                        Start Focus
                      </>
                    )}
                  </button>
                  <button
                    onClick={handlePomoSkip}
                    className="flex items-center gap-2 rounded-[10px] border border-[#DDE3EC] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#6B7A99] hover:bg-[#F9FAFB]"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M4 5v14l8-7-8-7z"/><path d="M13 5v14l8-7-8-7z"/></svg>
                    Skip
                  </button>
                </div>

                {/* Today total */}
                <div className="mt-6 text-center">
                  <div
                    className="text-[#C99730]"
                    style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 700, fontSize: 26 }}
                  >
                    {formatHourMin(todaySeconds)}
                  </div>
                  <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[1.5px] text-[#6B7A99]">
                    Your Time Today
                  </div>
                </div>
              </div>
            </div>

            {/* Studying Now card */}
            <div
              className="rounded-[20px] bg-white p-6"
              style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
            >
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[1.2px] text-[#6B7A99]">Studying Now</p>
              <div className="flex flex-wrap gap-5">
                {[
                  { letter: 'Y', name: 'You', time: formatHourMin(todaySeconds), color: '#172444', dot: '#22C55E' },
                  { letter: 'R', name: 'Rahul', time: '42m', color: '#1E3A8A', dot: '#F59E0B' },
                  { letter: 'P', name: 'Priya', time: '1h 8m', color: '#1D4ED8', dot: '#22C55E' },
                  { letter: 'A', name: 'Arjun', time: '0m', color: '#166534', dot: '#6B7A99' },
                  { letter: 'S', name: 'Sneha', time: '2h 14m', color: '#78350F', dot: '#F59E0B' },
                  { letter: 'K', name: 'Kiran', time: '55m', color: '#134E4A', dot: '#22C55E' },
                ].map((u) => (
                  <div key={u.name} className="flex flex-col items-center gap-1.5">
                    <div className="relative">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-full text-[16px] font-bold text-white"
                        style={{ background: u.color }}
                      >
                        {u.letter}
                      </div>
                      <span
                        className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white"
                        style={{ background: u.dot }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-[#0C1424]">{u.name}</span>
                    <span className="text-[10px] text-[#6B7A99]">{u.time}</span>
                  </div>
                ))}
                {inRoom.memberCount > 6 && (
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full text-[12px] font-bold text-[#6B7A99]"
                      style={{ background: '#F1F3F8', border: '1px dashed #DDE3EC' }}
                    >
                      +{inRoom.memberCount - 6}
                    </div>
                    <span className="text-[11px] font-semibold text-[#6B7A99]">more</span>
                    <span className="text-[10px] text-transparent">.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat panel */}
          {!roomFocusMode && (
          <div
            className="flex w-[295px] shrink-0 flex-col"
            style={{ background: '#FAF6EE', borderLeft: '1px solid #E8E3D8' }}
          >
            {/* Tabs */}
            <div className="flex shrink-0 border-b border-[#E8E3D8] bg-white px-4">
              {(['chat', 'goals', 'board'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setChatTab(t)}
                  className="relative px-3 py-3 text-[13px] font-semibold capitalize transition"
                  style={{ color: chatTab === t ? '#C99730' : '#6B7A99' }}
                >
                  {t === 'chat' ? '💬' : t === 'goals' ? '🎯' : '🏆'} {t.charAt(0).toUpperCase() + t.slice(1)}
                  {chatTab === t && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t bg-[#C99730]" />
                  )}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {chatTab === 'chat' && (
                <div className="flex flex-col gap-3">
                  {/* System join message */}
                  <div className="text-center">
                    <span className="rounded-full bg-[#EDE8DC] px-3 py-1 text-[11px] text-[#6B7A99]">
                      You joined the room
                    </span>
                  </div>

                  {messages.length === 0 ? (
                    <p className="text-center text-[12px] text-[#9AA3B8]">No messages yet. Say hello! 👋</p>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className="flex items-start gap-2.5">
                        <div
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                          style={{ background: '#172444' }}
                        >
                          {msg.user?.firstName?.[0] || 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-bold text-[#0C1424]">
                              {msg.user?.firstName || 'User'}
                            </span>
                            <span className="text-[10px] text-[#9AA3B8]">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div
                            className="mt-1 rounded-[10px] px-3 py-2 text-[12px] text-[#0C1424]"
                            style={{ background: 'rgba(255,255,255,0.7)' }}
                          >
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
              {chatTab === 'goals' && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="text-[32px]">🎯</span>
                  <p className="mt-2 text-[13px] font-semibold text-[#0C1424]">Goals</p>
                  <p className="mt-1 text-[12px] text-[#9AA3B8]">Set your session goals here.</p>
                </div>
              )}
              {chatTab === 'board' && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="text-[32px]">🏆</span>
                  <p className="mt-2 text-[13px] font-semibold text-[#0C1424]">Leaderboard</p>
                  <p className="mt-1 text-[12px] text-[#9AA3B8]">See who&apos;s studying the most today.</p>
                </div>
              )}
            </div>

            {/* Warning footer */}
            <div
              className="shrink-0 border-t border-[#E8E3D8] px-4 py-2 text-center text-[11px] text-[#9AA3B8]"
              style={{ background: 'white' }}
            >
              ⬆ Be respectful — abusive messages → permanent ban
            </div>

            {/* Input */}
            <div
              className="shrink-0 flex items-center gap-2 border-t border-[#E8E3D8] px-3 py-3"
              style={{ background: 'white' }}
            >
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                placeholder="Say something..."
                className="flex-1 rounded-[8px] border border-[#E1E6EF] bg-[#F8F3EA] px-3 py-2 text-[12px] text-[#0C1424] outline-none placeholder:text-[#9CA3AF]"
              />
              <button
                onClick={handleSend}
                disabled={sending || !messageInput.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-[8px] disabled:opacity-50"
                style={{ background: '#C99730' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
                </svg>
              </button>
              <button
                onClick={() => setRoomFocusMode(true)}
                className="rounded-[8px] border border-[#DDE3EC] bg-white px-3 py-2 text-[12px] font-semibold text-[#6B7A99] hover:bg-[#F4F6FA]"
              >
                Hide
              </button>
            </div>
          </div>
          )}
        </div>
      </div>
    )}
    </>
  );
}
