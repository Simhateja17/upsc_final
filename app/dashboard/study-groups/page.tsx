'use client';

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardPageHero from '@/components/DashboardPageHero';
import { studyGroupService, dashboardService, studyPlannerService } from '@/lib/services';
import { EntitlementGate } from '@/components/entitlements';
import { useAuth } from '@/contexts/AuthContext';

const ROOM_FILTERS = ['All', 'Open', 'Full'];

interface Group {
  id: string;
  name: string;
  description?: string;
  subject: string;
  status: string;
  maxMembers: number;
  memberCount: number;
  // Number of members currently in an active study session (clicked "Start
  // Studying"). Populated by the presence API; falls back to memberCount until
  // the real-time backend pass lands.
  studyingNow?: number;
  isMember: boolean;
  // 'none' | 'pending' | 'rejected' | 'member' — my relationship to a room I
  // haven't joined. Drives the modal/card CTA (Enter vs Request vs Pending).
  myRequestStatus?: string;
  isAdmin?: boolean;
  pendingRequestCount?: number;
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
  const [previewGroup, setPreviewGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rooms' | 'solo' | 'my'>('rooms');
  const [roomFilter, setRoomFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', subject: 'Polity', maxMembers: 50, focusTopic: '', subjects: [] as string[], timeGoal: 4 });
  const [sending, setSending] = useState(false);
  const [inRoom, setInRoom] = useState<Group | null>(null);
  const [chatTab, setChatTab] = useState<'chat' | 'goals' | 'board'>('chat');
  const [roomFocusMode, setRoomFocusMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Transient toast (e.g. "Request sent to RK — waiting for approval")
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  // Admin approval panel — pending join requests across my created rooms
  interface JoinRequest { id: string; groupId: string; groupName: string; userId: string; userName: string; userInitials: string; avatarUrl: string | null; createdAt: string; }
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [showRequests, setShowRequests] = useState(false);
  const [processingReqIds, setProcessingReqIds] = useState<Set<string>>(new Set());

  // Room count-up study timer (distinct from the Solo Focus pomodoro). Starts at
  // 00:00 and counts UP; a full ring = 1 hour. Only runs after "Start Studying".
  const [roomRunning, setRoomRunning] = useState(false);
  const [roomElapsed, setRoomElapsed] = useState(0);
  const roomTickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Session Score ("Session Complete!") overlay
  const [showSessionScore, setShowSessionScore] = useState(false);

  // Room Goals – shared goal list for the current room, per-member completion
  interface RoomGoal { id: string; title: string; createdById: string; createdByName: string; createdAt: string; }
  interface RoomMemberTime { userId: string; name: string; avatarUrl: string | null; focusSeconds: number; isStudying?: boolean; }
  const [roomGoals, setRoomGoals] = useState<RoomGoal[]>([]);
  const [myCompletedGoalIds, setMyCompletedGoalIds] = useState<Set<string>>(new Set());
  const [newGoalInput, setNewGoalInput] = useState('');
  const [addingGoal, setAddingGoal] = useState(false);
  const [togglingGoalIds, setTogglingGoalIds] = useState<Set<string>>(new Set());
  const [memberTimes, setMemberTimes] = useState<RoomMemberTime[]>([]);
  const [teamTotalSeconds, setTeamTotalSeconds] = useState(0);
  const roomPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
            // Every tick while running already added +1 (see below), so the
            // cycle-completion tick only needs to account for its own final
            // second — adding focusSecs again here would double-count the
            // whole session.
            setTodaySeconds((t) => {
              const next = t + 1;
              persistTodaySeconds(next);
              flushSoloSession(next);
              flushRoomFocusTime(next);
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
            if (next % 30 === 0) { persistTodaySeconds(next); flushSoloSession(next); flushRoomFocusTime(next); }
            return next;
          });
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (pomoTickRef.current) clearInterval(pomoTickRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pomoRunning, pomoMode]);

  const handlePomoStart = () => {
    setPomoRunning((r) => {
      if (r && pomoMode === 'focus') { flushSoloSession(todaySeconds); flushRoomFocusTime(todaySeconds); }
      return !r;
    });
  };
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
  // Always renders both units, e.g. "0h 0m" / "2h 45m" — used where a bare
  // "0m" would read ambiguously (the serif "0m" looks like "om").
  const formatHM = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}h ${m}m`;
  };
  // Spelled-out variant for the prominent "Your Time Today" readout, e.g.
  // "0 Hrs 0 Mins" — avoids the serif "0m" reading like "om".
  const formatHrsMins = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h} Hrs ${m} Mins`;
  };

  const pomoTotalForMode = pomoMode === 'focus' ? focusMinutes * 60 : BREAK_SECONDS;
  const pomoProgress = 1 - pomoSecondsLeft / pomoTotalForMode;

  // A user only counts as "studying now" once they click Start Studying inside a
  // room and the count-up timer is actually running. Joining a room alone does
  // NOT make them a studier — this gates the presence count and the green
  // "active" dot on their own avatar.
  const isStudying = !!inRoom && roomRunning;

  // Today's Study Tasks – shared with Study Planner via studyPlannerService
  interface Task {
    id: string;
    title: string;
    subject?: string;
    type: string;
    date: string;
    isCompleted: boolean;
    actualDuration?: number;
  }
  // Deliberately never pass an explicit date string to studyPlannerService here.
  // The backend's default "today" (no date param) resolves to local midnight,
  // which is what the Dashboard's study-hours stat exact-matches against. An
  // explicit "YYYY-MM-DD" string gets stored at noon UTC instead (a separate,
  // pre-existing convention used for date-navigation), which silently fails
  // that exact-match — so tasks created that way never count toward Dashboard
  // hours even though they're genuinely "today".
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [addingTask, setAddingTask] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setTasksLoading(true);
    studyPlannerService.getTodayTasks()
      .then((res: any) => { if (!cancelled) setTasks(Array.isArray(res.data) ? res.data : []); })
      .catch(() => { if (!cancelled) setTasks([]); })
      .finally(() => { if (!cancelled) setTasksLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const toggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
    try {
      await studyPlannerService.updateTask(id, { isCompleted: !task.isCompleted });
    } catch {
      setTasks((prev) => prev.map((t) => t.id === id ? { ...t, isCompleted: task.isCompleted } : t));
    }
  };
  const taskInputRef = useRef<HTMLInputElement>(null);
  const addTask = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const title = newTaskInput.trim();
    if (!title || addingTask) return;
    setAddingTask(true);
    try {
      const res: any = await studyPlannerService.createTask({ title });
      if (res.data) setTasks((prev) => [...prev, res.data]);
      setNewTaskInput('');
      taskInputRef.current?.focus();
    } catch {
      // silent – input keeps its value so the user can retry
    } finally {
      setAddingTask(false);
    }
  };

  // Solo Focus Session time syncs into a daily placeholder StudyPlanTask, so it
  // counts toward Dashboard study hours the same way Study Planner's own
  // Focus Session does (both write actualDuration onto real task rows).
  const SOLO_SESSION_TITLE = 'Solo Focus Session';
  const SOLO_SESSION_TYPE = 'study';
  const soloSessionTaskRef = useRef<Task | null>(null);

  useEffect(() => {
    if (tasksLoading) return;
    const existing = tasks.find((t) => t.type === SOLO_SESSION_TYPE && t.title === SOLO_SESSION_TITLE);
    if (existing) soloSessionTaskRef.current = existing;
  }, [tasks, tasksLoading]);

  const flushSoloSession = useCallback(async (secs: number) => {
    if (secs <= 0 || tasksLoading) return;
    try {
      let task: Task | null = soloSessionTaskRef.current;
      if (!task) {
        const res: any = await studyPlannerService.createTask({
          title: SOLO_SESSION_TITLE,
          type: SOLO_SESSION_TYPE,
        });
        if (!res.data) return;
        task = res.data as Task;
        soloSessionTaskRef.current = task;
        setTasks((prev) => [...prev, task as Task]);
      }
      if (!task) return;
      const updates = { actualDuration: secs, isCompleted: true };
      await studyPlannerService.updateTask(task.id, updates);
      const updatedTask: Task = { ...task, ...updates };
      soloSessionTaskRef.current = updatedTask;
      setTasks((prev) => prev.map((t) => t.id === updatedTask.id ? updatedTask : t));
    } catch {
      // silent – local timer state already has the correct value; next flush retries
    }
  }, [tasksLoading]);

  // When focusing while inside a room, also log the same cumulative seconds
  // as room-scoped time (separate from the personal diary flush above).
  const flushRoomFocusTime = useCallback(async (secs: number) => {
    if (secs <= 0 || !inRoom) return;
    try {
      await studyGroupService.postFocusTime(inRoom.id, secs);
    } catch {
      // silent – next flush retries
    }
  }, [inRoom]);

  // ── Room count-up timer ────────────────────────────────────────────────
  // Ticks every second while running: advances the session counter AND the
  // daily total (which persists locally + flushes to the room/diary APIs).
  useEffect(() => {
    if (!roomRunning) {
      if (roomTickRef.current) { clearInterval(roomTickRef.current); roomTickRef.current = null; }
      return;
    }
    roomTickRef.current = setInterval(() => {
      setRoomElapsed((e) => e + 1);
      setTodaySeconds((t) => {
        const next = t + 1;
        if (next % 30 === 0) { persistTodaySeconds(next); flushSoloSession(next); flushRoomFocusTime(next); }
        return next;
      });
    }, 1000);
    return () => { if (roomTickRef.current) clearInterval(roomTickRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomRunning]);

  const handleRoomStart = async () => {
    if (!inRoom) return;
    const next = !roomRunning;
    setRoomRunning(next);
    try {
      if (next) {
        await studyGroupService.startStudying(inRoom.id);
      } else {
        // Pausing → flush accrued time and drop out of the live count.
        flushSoloSession(todaySeconds);
        flushRoomFocusTime(todaySeconds);
        await studyGroupService.stopStudying(inRoom.id);
      }
    } catch {
      // silent – presence is best-effort; the timer still reflects local state
    }
    // Reflect the change immediately in the polled data so the count doesn't lag.
    fetchRoomGoalsAndTimes(inRoom.id);
  };

  const handleRoomReset = async () => {
    setRoomRunning(false);
    setRoomElapsed(0);
    if (inRoom) {
      try { await studyGroupService.stopStudying(inRoom.id); } catch { /* silent */ }
    }
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

  const fetchJoinRequests = useCallback(async () => {
    try {
      const res = await studyGroupService.getJoinRequests();
      if (res.status === 'success' && res.data) {
        setJoinRequests(res.data as JoinRequest[]);
      }
    } catch {
      // silent
    }
  }, []);

  // Poll pending join requests for the admin badge/panel (every 20s).
  useEffect(() => {
    fetchJoinRequests();
    const id = setInterval(fetchJoinRequests, 20000);
    return () => clearInterval(id);
  }, [fetchJoinRequests]);

  const handleApproveRequest = async (req: JoinRequest) => {
    if (processingReqIds.has(req.id)) return;
    setProcessingReqIds((p) => new Set(p).add(req.id));
    try {
      const res = await studyGroupService.approveJoinRequest(req.groupId, req.id);
      if (res.status === 'success') {
        setJoinRequests((prev) => prev.filter((r) => r.id !== req.id));
        showToast(`Approved — ${req.userName} joined ${req.groupName}`);
        fetchGroups();
      }
    } catch {
      showToast('Could not approve request');
    } finally {
      setProcessingReqIds((p) => { const n = new Set(p); n.delete(req.id); return n; });
    }
  };

  const handleRejectRequest = async (req: JoinRequest) => {
    if (processingReqIds.has(req.id)) return;
    setProcessingReqIds((p) => new Set(p).add(req.id));
    try {
      const res = await studyGroupService.rejectJoinRequest(req.groupId, req.id);
      if (res.status === 'success') {
        setJoinRequests((prev) => prev.filter((r) => r.id !== req.id));
        showToast(`Declined ${req.userName}'s request`);
      }
    } catch {
      showToast('Could not decline request');
    } finally {
      setProcessingReqIds((p) => { const n = new Set(p); n.delete(req.id); return n; });
    }
  };

  // Restore the immersive "in room" view after navigating away and back —
  // `inRoom` is plain component state, wiped when this page unmounts on
  // route change, even though the user is still an active room member
  // server-side. sessionStorage remembers which room to re-enter.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const activeRoomId = sessionStorage.getItem('rwj_active_room_id');
    if (!activeRoomId) return;
    (async () => {
      try {
        const res = await studyGroupService.getGroup(activeRoomId);
        if (res.status === 'success' && res.data && res.data.isMember) {
          if (res.data.messages) setMessages(res.data.messages);
          setInRoom(res.data);
          setActiveTab('my');
        } else {
          sessionStorage.removeItem('rwj_active_room_id');
        }
      } catch {
        // silent – leave the stored id, will retry on next mount
      }
    })();
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
    setPreviewGroup(group);
    try {
      const res = await studyGroupService.getGroup(group.id);
      if (res.status === 'success' && res.data) {
        setPreviewGroup(res.data);
      }
    } catch {
      // silent
    }
  }, []);

  const fetchRoomGoalsAndTimes = useCallback(async (roomId: string) => {
    try {
      const [goalsRes, timesRes] = await Promise.all([
        studyGroupService.getGoals(roomId),
        studyGroupService.getMemberTimes(roomId),
      ]);
      if (goalsRes.status === 'success' && goalsRes.data) {
        setRoomGoals(goalsRes.data.goals || []);
        setMyCompletedGoalIds(new Set(goalsRes.data.myCompletedGoalIds || []));
      }
      if (timesRes.status === 'success' && timesRes.data) {
        setMemberTimes(timesRes.data.members || []);
        setTeamTotalSeconds(timesRes.data.teamTotalSeconds || 0);
      }
    } catch {
      // silent
    }
  }, []);

  // Fetch + poll room goals and member times every 12s while inside a room
  useEffect(() => {
    if (roomPollRef.current) clearInterval(roomPollRef.current);
    if (!inRoom) { setRoomGoals([]); setMyCompletedGoalIds(new Set()); setMemberTimes([]); setTeamTotalSeconds(0); return; }

    fetchRoomGoalsAndTimes(inRoom.id);
    roomPollRef.current = setInterval(() => fetchRoomGoalsAndTimes(inRoom.id), 12000);
    return () => { if (roomPollRef.current) clearInterval(roomPollRef.current); };
  }, [inRoom?.id, fetchRoomGoalsAndTimes]);

  const handleAddGoal = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const title = newGoalInput.trim();
    if (!title || !inRoom || addingGoal) return;
    setAddingGoal(true);
    try {
      const res = await studyGroupService.addGoal(inRoom.id, title);
      if (res.status === 'success' && res.data) {
        setRoomGoals((prev) => [...prev, res.data]);
        setNewGoalInput('');
      }
    } catch {
      // silent
    } finally {
      setAddingGoal(false);
    }
  };

  const handleToggleGoal = async (goalId: string) => {
    if (!inRoom || togglingGoalIds.has(goalId)) return;
    const wasCompleted = myCompletedGoalIds.has(goalId);
    setTogglingGoalIds((prev) => new Set(prev).add(goalId));
    setMyCompletedGoalIds((prev) => {
      const next = new Set(prev);
      if (wasCompleted) next.delete(goalId); else next.add(goalId);
      return next;
    });
    try {
      await studyGroupService.toggleGoal(inRoom.id, goalId);
    } catch {
      setMyCompletedGoalIds((prev) => {
        const next = new Set(prev);
        if (wasCompleted) next.add(goalId); else next.delete(goalId);
        return next;
      });
    } finally {
      setTogglingGoalIds((prev) => { const next = new Set(prev); next.delete(goalId); return next; });
    }
  };

  // Entering a room resets the per-session count-up timer to a clean 00:00.
  const enterRoom = useCallback((group: Group, roomMessages: Message[]) => {
    setPreviewGroup(null);
    setMessages(roomMessages);
    setRoomRunning(false);
    setRoomElapsed(0);
    setInRoom(group);
    setRoomFocusMode(false);
    setActiveTab('my');
    if (typeof window !== 'undefined') sessionStorage.setItem('rwj_active_room_id', group.id);
  }, []);

  // "Join" a room created by someone else → sends an approval request (the admin
  // must approve). Joining your OWN room (or one you're already in) enters
  // directly. The backend decides which via res.data.status.
  const handleJoin = async (groupId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const res = await studyGroupService.joinGroup(groupId);
      if (res.status !== 'success') return;

      const outcome = res.data?.status;
      if (outcome === 'pending') {
        const adminLabel = previewGroup && previewGroup.id === groupId
          ? getCreatorInitials(previewGroup)
          : res.data?.adminInitials || 'the admin';
        setPreviewGroup(null);
        showToast(`Request sent to ${adminLabel} — waiting for approval`);
        await fetchGroups();
        return;
      }

      // Became a member (own room / already a member) → enter it.
      await fetchGroups();
      await fetchMyGroups();
      const groupRes = await studyGroupService.getGroup(groupId);
      const joined = groupRes.status === 'success' && groupRes.data
        ? groupRes.data
        : groups.find((x) => x.id === groupId);
      if (joined) {
        enterRoom({ ...joined, isMember: true }, groupRes.status === 'success' && groupRes.data?.messages ? groupRes.data.messages : []);
      }
    } catch {
      // silent
    }
  };

  const handleEnterRoom = async (groupId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const res = await studyGroupService.getGroup(groupId);
      if (res.status === 'success' && res.data) {
        enterRoom(res.data, res.data.messages || []);
      }
    } catch {
      // silent
    }
  };

  // Close the immersive room view but STAY a member. Stops the timer + live
  // presence and flushes accrued time. Used by the timer's "Exit" button.
  const handleExitRoom = async () => {
    if (!inRoom) return;
    if (roomRunning) { flushSoloSession(todaySeconds); flushRoomFocusTime(todaySeconds); }
    try { await studyGroupService.stopStudying(inRoom.id); } catch { /* silent */ }
    setRoomRunning(false);
    setRoomElapsed(0);
    setInRoom(null);
    setRoomFocusMode(false);
    if (typeof window !== 'undefined') sessionStorage.removeItem('rwj_active_room_id');
  };

  // Leave the room entirely (drop membership). Used by the header "Leave Room".
  const handleLeaveRoom = async () => {
    if (!inRoom) return;
    try { await studyGroupService.stopStudying(inRoom.id); } catch { /* silent */ }
    await handleLeave(inRoom.id);
    setRoomRunning(false);
    setRoomElapsed(0);
    setInRoom(null);
    setRoomFocusMode(false);
    if (typeof window !== 'undefined') sessionStorage.removeItem('rwj_active_room_id');
  };

  const handleLeave = async (groupId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const res = await studyGroupService.leaveGroup(groupId);
      if (res.status === 'success') {
        await fetchGroups();
        await fetchMyGroups();
        if (previewGroup?.id === groupId) {
          setPreviewGroup(null);
        }
      }
    } catch {
      // silent
    }
  };

  const handleSend = async () => {
    if (!inRoom || !messageInput.trim()) return;
    setSending(true);
    try {
      const res = await studyGroupService.postMessage(inRoom.id, messageInput.trim());
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const normalizeSubjectKey = (group: Pick<Group, 'subject' | 'name' | 'description'>) => {
    const text = `${group.subject || ''} ${group.name || ''} ${group.description || ''}`.toLowerCase();
    if (text.includes('history') || text.includes('ancient') || text.includes('modern')) return 'history';
    if (text.includes('economy') || text.includes('economic') || text.includes('budget')) return 'economy';
    if (text.includes('geo') || text.includes('map')) return 'geography';
    if (text.includes('current') || text.includes('affair') || text.includes('news')) return 'current';
    if (text.includes('ethic') || text.includes('case study')) return 'ethics';
    if (text.includes('sci') || text.includes('tech') || text.includes('isro') || text.includes('space')) return 'sci';
    return 'polity';
  };

  const subjectMeta: Record<string, { label: string; bg: string; color: string; icon: ReactNode }> = {
    polity: {
      label: 'Polity',
      bg: 'linear-gradient(135deg,#F1F2F6,#E5E8EF)',
      color: '#4F5B85',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v18"/><path d="M5 7l7-3 7 3"/><path d="M5 7l-2 6a4 4 0 0 0 8 0L9 7"/><path d="M19 7l-2 6a4 4 0 0 0 8 0l-2-6"/><path d="M4 21h16"/>
        </svg>
      ),
    },
    history: {
      label: 'History',
      bg: 'linear-gradient(135deg,#F5F1E9,#ECE4D5)',
      color: '#8B6F3E',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18"/><path d="M3 10h18"/><path d="M5 6l7-3 7 3"/><path d="M4 10v11"/><path d="M20 10v11"/><path d="M8 14v4"/><path d="M12 14v4"/><path d="M16 14v4"/>
        </svg>
      ),
    },
    economy: {
      label: 'Economy',
      bg: 'linear-gradient(135deg,#F2F5EF,#E6ECE0)',
      color: '#5C7350',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9"/><path d="M12 7v10"/><path d="M15 9.5c0-1.4-1.3-2-3-2s-3 .6-3 2 1.5 1.8 3 2 3 .6 3 2-1.3 2-3 2-3-.6-3-2"/>
        </svg>
      ),
    },
    geography: {
      label: 'Geography',
      bg: 'linear-gradient(135deg,#F0F4F3,#E4EDEB)',
      color: '#4C6E6C',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18"/><path d="M12 3a15 15 0 0 0 0 18"/>
        </svg>
      ),
    },
    current: {
      label: 'Current Affairs',
      bg: 'linear-gradient(135deg,#F4F5F7,#EBECF0)',
      color: '#3F3D56',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 22h14a3 3 0 0 0 3-3V5H8v14a3 3 0 0 1-6 0v-8h4"/><path d="M11 7h7"/><path d="M11 11h7"/><path d="M11 15h7"/>
        </svg>
      ),
    },
    ethics: {
      label: 'Ethics',
      bg: 'linear-gradient(135deg,#F5EFF1,#ECE1E6)',
      color: '#8B5A6B',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      ),
    },
    sci: {
      label: 'Sci & Tech',
      bg: 'linear-gradient(135deg,#F1F2F6,#E5E8EF)',
      color: '#4F5B85',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>
        </svg>
      ),
    },
  };

  const getSubjectMeta = (group: Pick<Group, 'subject' | 'name' | 'description'>) => {
    const key = normalizeSubjectKey(group);
    return subjectMeta[key] || subjectMeta.polity;
  };

  const getRoomFull = (group: Pick<Group, 'memberCount' | 'maxMembers'>) => (
    group.maxMembers > 0 && group.memberCount >= group.maxMembers
  );

  const getCreatorInitials = (group: Group) => {
    const first = group.creator?.firstName?.[0] || '';
    const last = group.creator?.lastName?.[0] || '';
    return `${first}${last}`.toUpperCase() || 'Admin';
  };

  const getMemberInitials = (member?: { firstName?: string; lastName?: string; avatarUrl?: string }) => {
    const initials = `${member?.firstName?.[0] || ''}${member?.lastName?.[0] || ''}`.toUpperCase();
    return initials || '?';
  };

  const previewMembers = (group: Group) => {
    return (group.members ?? []).slice(0, 8).map((member) => {
      const initials = getMemberInitials(member);
      const name = [member.firstName, member.lastName].filter(Boolean).join(' ');
      return { initials, name };
    });
  };

  const filteredGroups = (activeTab === 'rooms' ? groups : myGroups).filter((g) => {
    const isFull = getRoomFull(g);
    const matchRoomState = roomFilter === 'All' || (roomFilter === 'Open' && !isFull) || (roomFilter === 'Full' && isFull);
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) ||
                        (g.description || '').toLowerCase().includes(search.toLowerCase());
    return matchRoomState && matchSearch;
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
               My Study Group {myGroups.length > 0 ? `(${myGroups.length})` : ''}
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
            {joinRequests.length > 0 && (
              <button
                onClick={() => setShowRequests(true)}
                className="relative col-span-2 flex min-w-0 items-center justify-center gap-2 rounded-[8px] border border-[#E8B84B] bg-[#FFFBEF] px-3 py-2 text-[12px] font-semibold text-[#C99730] md:col-span-1 md:px-4 md:text-[13px]"
                aria-label="Pending join requests"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
                Requests
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[11px] font-bold text-white">
                  {joinRequests.length}
                </span>
              </button>
            )}
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
                    {formatHrsMins(todaySeconds)}
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

              {!tasksLoading && tasks.length === 0 && (
                <p style={{ fontSize: 13, color: '#9AA3B8', marginBottom: 12 }}>No tasks yet. Add one below to track your session goals.</p>
              )}

              {/* Task list */}
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {tasks.map((task) => (
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
                        border: task.isCompleted ? '1px solid #22C55E' : '1px solid rgba(11,22,40,0.17)',
                        background: task.isCompleted ? '#22C55E' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'background 0.15s, border-color 0.15s',
                      }}
                    >
                      {task.isCompleted && (
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
                        color: task.isCompleted ? '#9AA3B8' : '#374560',
                        textDecoration: task.isCompleted ? 'line-through' : 'none',
                      }}
                    >
                      {task.title}
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
                  disabled={addingTask}
                  style={{
                    background: 'rgba(232,184,75,0.12)',
                    border: '1px solid rgba(232,184,75,0.30)',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontFamily: 'DM Sans, sans-serif',
                    fontWeight: 700,
                    fontSize: 12,
                    color: '#C99730',
                    cursor: addingTask ? 'not-allowed' : 'pointer',
                    opacity: addingTask ? 0.6 : 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {addingTask ? 'Adding…' : 'Add'}
                </button>
              </form>
            </div>

            {/* ── Dashboard Stats Row ────────────────────────────── */}
            {(() => {
              const doneTasks = tasks.filter((t) => t.isCompleted).length;
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
            {ROOM_FILTERS.map((item) => (
              <button
                key={item}
                onClick={() => setRoomFilter(item)}
                className={`rounded-full border px-4 py-2 text-[12px] font-semibold ${roomFilter === item ? 'border-[#E8B84B] bg-[#090E1C] text-[#E8B84B]' : 'border-[#DDE3EC] bg-white text-[#6B7A99]'}`}
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
            {filteredGroups.map((group, index) => {
              const meta = getSubjectMeta(group);
              const isFull = getRoomFull(group);
              const members = group.members ?? [];
              const visibleMembers = members.slice(0, 3);
              return (
                <article
                  key={group.id}
                  onClick={() => openGroup(group)}
                  className={`cursor-pointer overflow-hidden rounded-[16px] border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${isFull && !group.isMember ? 'opacity-60 grayscale-[0.35]' : ''}`}
                  style={{ borderColor: '#E1E6EF', borderTop: `4px solid ${roomTopBorderColors[index % roomTopBorderColors.length]}` }}
                >
                  <div className="p-5">
                    <div className="mb-5 flex items-center gap-3">
                      <span
                        className="flex size-10 shrink-0 items-center justify-center rounded-[11px] border border-black/5"
                        style={{ background: meta.bg, color: meta.color }}
                        aria-hidden
                      >
                        <span className="size-5">{meta.icon}</span>
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate text-[18px] font-bold leading-tight text-[#0C1424]">{group.name}</h3>
                        {group.description && (
                          <p className="mt-1 truncate text-[12px] text-[#6B7A99]">{group.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex shrink-0 -space-x-1.5">
                          {visibleMembers.map((m, i) => {
                            const colors = ['#1E3A5F', '#2D5016', '#5B2C6F', '#7C4A1E', '#1A4D4D'];
                            return (
                              <span
                                key={`${group.id}-${i}`}
                                style={{ background: colors[i % colors.length] }}
                                className="flex size-6 items-center justify-center rounded-full border-2 border-white text-[9px] font-bold text-white"
                              >
                                {getMemberInitials(m)}
                              </span>
                            );
                          })}
                        </span>
                        <span className="truncate text-[12px] font-medium text-[#6B7A99]">
                          {group.studyingNow ?? group.memberCount} studying
                        </span>
                      </div>

                      {group.isMember ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEnterRoom(group.id);
                          }}
                          className="shrink-0 rounded-full bg-[#22C55E] px-5 py-2 text-[13px] font-bold text-white"
                        >
                          Enter →
                        </button>
                      ) : isFull ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openGroup(group);
                          }}
                          className="shrink-0 rounded-full bg-[#FEE2E2] px-5 py-2 text-[12px] font-bold text-[#EF4444]"
                        >
                          Study Room Full
                        </button>
                      ) : group.myRequestStatus === 'pending' ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openGroup(group);
                          }}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#F1F3F8] px-4 py-2 text-[12px] font-bold text-[#6B7A99]"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          Pending
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openGroup(group);
                          }}
                          className="shrink-0 rounded-full bg-[#E8B84B] px-5 py-2 text-[13px] font-bold text-[#090E1C]"
                        >
                          View →
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
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

      {previewGroup && (() => {
        const meta = getSubjectMeta(previewGroup);
        const isFull = getRoomFull(previewGroup);
        const membersForPreview = previewMembers(previewGroup);
        const previewBorder = roomTopBorderColors[Math.max(0, groups.findIndex((g) => g.id === previewGroup.id)) % roomTopBorderColors.length];
        return (
          <div
            className="fixed inset-0 z-[210] flex items-center justify-center bg-black/50 px-4 backdrop-blur-[4px]"
            onClick={() => setPreviewGroup(null)}
          >
            <div
              className="relative flex max-h-[85vh] w-full max-w-[600px] flex-col overflow-hidden rounded-[20px] bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              style={{ borderTop: `4px solid ${previewBorder}` }}
            >
              <button
                type="button"
                onClick={() => setPreviewGroup(null)}
                aria-label="Close room preview"
                className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-[#F3F4F6] text-[24px] font-bold leading-none text-[#9CA3AF] transition hover:bg-[#E5E7EB] hover:text-[#6B7280]"
              >
                ×
              </button>

              <div className="border-b border-[#E5E7EB] px-7 pb-5 pt-6">
                <div className="mb-3 flex flex-wrap items-center gap-2 pr-12">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase"
                    style={{
                      background: isFull && !previewGroup.isMember ? '#FEE2E2' : statusBg[previewGroup.status] || '#22C55E18',
                      color: isFull && !previewGroup.isMember ? '#EF4444' : statusColor[previewGroup.status] || '#166534',
                    }}
                  >
                    <span
                      className="size-1.5 rounded-full"
                      style={{ background: isFull && !previewGroup.isMember ? '#EF4444' : statusColor[previewGroup.status] || '#22C55E' }}
                    />
                    {isFull && !previewGroup.isMember ? 'Full' : previewGroup.status}
                  </span>
                  <span className="rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[11px] font-bold text-[#6B7280]">
                    {meta.label}
                  </span>
                </div>

                <div className="mb-2 inline-flex rounded-full bg-[#F4C430] px-3 py-1 text-[11px] font-extrabold text-[#0C1424]">
                  Admin: {getCreatorInitials(previewGroup)}
                </div>

                <h2
                  className="text-[28px] font-bold leading-tight text-[#1A1D2E]"
                  style={{ fontFamily: 'var(--font-cormorant)' }}
                >
                  {previewGroup.name}
                </h2>
                {previewGroup.description && (
                  <p className="mt-1.5 text-[15px] font-medium leading-snug text-[#6B7280]">
                    {previewGroup.description}
                  </p>
                )}
              </div>

              <div className="overflow-y-auto px-7 py-6">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-[12px] bg-[#F3F4F6] px-2 py-4 text-center">
                    <div className="text-[24px] font-extrabold text-[#22C55E]" style={{ fontFamily: 'var(--font-cormorant)' }}>
                      {previewGroup.studyingNow ?? previewGroup.memberCount}
                    </div>
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-[1px] text-[#9CA3AF]">
                      Studying Now
                    </div>
                  </div>
                  <div className="rounded-[12px] bg-[#F3F4F6] px-2 py-4 text-center">
                    <div className="text-[24px] font-extrabold text-[#E8B84B]" style={{ fontFamily: 'var(--font-cormorant)' }}>
                      {previewGroup.maxMembers > 0 ? `${previewGroup.memberCount}/${previewGroup.maxMembers}` : previewGroup.memberCount}
                    </div>
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-[1px] text-[#9CA3AF]">
                      Members
                    </div>
                  </div>
                  <div className="rounded-[12px] bg-[#F3F4F6] px-2 py-4 text-center">
                    <div className="text-[24px] font-extrabold text-[#3B82F6]" style={{ fontFamily: 'var(--font-cormorant)' }}>
                      {meta.label}
                    </div>
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-[1px] text-[#9CA3AF]">
                      Subject
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-3 text-[11px] font-bold uppercase tracking-[1px] text-[#9CA3AF]">
                    Studying Now
                  </div>
                  {membersForPreview.length > 0 ? (
                    <div className="flex flex-wrap gap-4">
                      {membersForPreview.map((member, index) => {
                        const colors = ['#2D5016', '#5B2C6F', '#1A4D4D', '#7C4A1E', '#4A1942', '#0F4C75', '#6B3FA0', '#B91C1C'];
                        return (
                          <div key={`${previewGroup.id}-preview-${index}`} className="flex flex-col items-center gap-1.5">
                            <div
                              className="relative flex size-[52px] items-center justify-center rounded-full text-[18px] font-bold text-white"
                              style={{ background: colors[index % colors.length] }}
                            >
                              {member.initials}
                              <span className="absolute bottom-0.5 right-0.5 size-2.5 rounded-full border-2 border-white bg-[#22C55E]" />
                            </div>
                            {member.name && (
                              <span className="max-w-[72px] truncate text-center text-[13px] font-semibold text-[#1A1D2E]">
                                {member.name}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-[12px] bg-[#F9FAFB] px-5 py-5 text-center text-[13px] font-medium text-[#9CA3AF]">
                      No one studying right now. Be the first!
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#E5E7EB] bg-[#F9FAFB] px-7 py-4">
                <button
                  type="button"
                  onClick={() => setPreviewGroup(null)}
                  className="rounded-full border border-[#E1E6EF] bg-white px-6 py-3 text-[14px] font-semibold text-[#6B7280] shadow-sm"
                >
                  Go Back
                </button>
                {isFull && !previewGroup.isMember ? (
                  <button
                    type="button"
                    disabled
                    className="rounded-full bg-[#E5E7EB] px-8 py-3 text-[14px] font-bold text-[#9CA3AF]"
                  >
                    Study Room Full
                  </button>
                ) : previewGroup.isMember ? (
                  <button
                    type="button"
                    onClick={(e) => handleEnterRoom(previewGroup.id, e)}
                    className="rounded-full bg-[#E8B84B] px-8 py-3 text-[14px] font-bold text-[#090E1C]"
                  >
                    Enter Room →
                  </button>
                ) : previewGroup.myRequestStatus === 'pending' ? (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-2 rounded-full bg-[#E5E7EB] px-8 py-3 text-[14px] font-bold text-[#6B7280]"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Request Pending
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => handleJoin(previewGroup.id, e)}
                    className="rounded-full bg-[#E8B84B] px-8 py-3 text-[14px] font-bold text-[#090E1C]"
                  >
                    Request to Join →
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
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
              <span className="text-[10px]">■</span> My Study Group
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

            {/* Study status message — only "studying" after clicking Start Studying */}
            <div
              className="mx-auto mb-3 w-fit rounded-full px-4 py-2 text-center text-[12px] font-semibold transition"
              style={
                isStudying
                  ? { background: '#22C55E1A', color: '#16A34A' }
                  : { background: '#F1F3F8', color: '#6B7A99' }
              }
            >
              {isStudying
                ? '● You are now studying'
                : 'Click "Start Studying" to begin and make your day count'}
            </div>

            {/* Focus timer card */}
            <div
              className="mb-5 rounded-[20px] bg-white p-8"
              style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
            >
              {/* Timer header — label + Active/Paused status */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[15px] font-bold text-[#0C1424]">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: isStudying ? '#22C55E' : '#E8B84B' }}
                  />
                  Focus Timer
                </div>
                <span
                  className="rounded-full px-3 py-1 text-[11px] font-bold"
                  style={
                    isStudying
                      ? { background: '#22C55E1A', color: '#16A34A' }
                      : { background: '#FCEFCF', color: '#B7791F' }
                  }
                >
                  {isStudying ? 'Active' : 'Paused'}
                </span>
              </div>

              {/* Circular count-up timer — full ring = 1 hour */}
              <div className="flex flex-col items-center">
                <div className="relative" style={{ width: 220, height: 220 }}>
                  <svg width="220" height="220" viewBox="0 0 220 220">
                    <circle cx="110" cy="110" r="100" stroke="#EDE8DC" strokeWidth="8" fill="none"/>
                    <circle
                      cx="110" cy="110" r="100"
                      stroke={isStudying ? '#22C55E' : '#C99730'}
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 100}
                      strokeDashoffset={(2 * Math.PI * 100) * (1 - Math.min(roomElapsed / 3600, 1))}
                      transform="rotate(-90 110 110)"
                      style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div
                      className="text-[#0C1424]"
                      style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 52, lineHeight: 1, letterSpacing: '-1px' }}
                    >
                      {formatMMSS(roomElapsed)}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[1.5px] text-[#6B7A99]">
                      Minutes : Seconds
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="mt-6 flex items-center gap-3">
                  <button
                    onClick={handleRoomReset}
                    className="flex items-center gap-2 rounded-[10px] border border-[#DDE3EC] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#6B7A99] hover:bg-[#F9FAFB]"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path d="M3 12a9 9 0 1 0 3-6.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 4v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Reset
                  </button>
                  <button
                    onClick={handleRoomStart}
                    className="flex items-center gap-2 rounded-[10px] px-7 py-2.5 text-[14px] font-bold text-[#0C1424] hover:brightness-105"
                    style={{ background: isStudying ? '#22C55E' : '#E8B84B', color: isStudying ? '#fff' : '#0C1424' }}
                  >
                    {roomRunning ? (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
                        Pause
                      </>
                    ) : (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5z"/></svg>
                        Start Studying
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleExitRoom}
                    className="flex items-center gap-2 rounded-[10px] border border-[#EF4444] bg-[#FFF5F5] px-5 py-2.5 text-[13px] font-semibold text-[#EF4444] hover:bg-[#FEF2F2]"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Exit
                  </button>
                </div>

                {/* Today total */}
                <div className="mt-6 text-center">
                  <div
                    className="text-[#C99730]"
                    style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 700, fontSize: 26 }}
                  >
                    {formatHrsMins(todaySeconds)}
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
                {(() => {
                  const AVATAR_COLORS = ['#172444', '#1E3A8A', '#1D4ED8', '#166534', '#78350F', '#134E4A', '#5B21B6', '#9D174D'];
                  return memberTimes.slice(0, 6).map((m, idx) => {
                    const isMe = m.userId === user?.id;
                    const displayTime = isMe ? formatHourMin(todaySeconds) : formatHourMin(m.focusSeconds);
                    // My own dot reflects whether I'm actively studying right now
                    // (Start Studying clicked), not merely whether I've logged
                    // time today. Other members fall back to the presence flag
                    // from the API (m.isStudying) once available, else logged time.
                    const active = isMe ? isStudying : (m.isStudying ?? m.focusSeconds > 0);
                    return (
                      <div key={m.userId} className="flex flex-col items-center gap-1.5">
                        <div className="relative">
                          <div
                            className="flex h-12 w-12 items-center justify-center rounded-full text-[16px] font-bold text-white"
                            style={{ background: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}
                          >
                            {(isMe ? 'You' : m.name).charAt(0).toUpperCase()}
                          </div>
                          <span
                            className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white"
                            style={{ background: active ? '#22C55E' : '#6B7A99' }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-[#0C1424]">{isMe ? 'You' : m.name}</span>
                        <span className="text-[10px] text-[#6B7A99]">{displayTime}</span>
                      </div>
                    );
                  });
                })()}
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

            {/* This Week's Study Hours */}
            {(() => {
              const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
              const todayWeekIdx = (new Date().getDay() + 6) % 7;
              const totalWeekHours = weeklyHours.reduce((a, b) => a + b, 0);
              const maxBar = Math.max(...weeklyHours, 0.01);
              const h = Math.floor(totalWeekHours);
              const m = Math.round((totalWeekHours - h) * 60);
              const totalWeekFormatted = `${h}h ${m}m total`;
              return (
                <div className="mt-5 rounded-[20px] bg-white p-6" style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-[13px] font-bold text-[#0C1424]">📈 This Week&apos;s Study Hours</span>
                    <span className="text-[12px] font-semibold" style={{ color: '#C99730' }}>{totalWeekFormatted}</span>
                  </div>
                  <div className="flex items-end justify-between gap-2" style={{ height: 88 }}>
                    {weeklyHours.map((hr, i) => {
                      const isToday = i === todayWeekIdx;
                      const barH = Math.max(4, (hr / maxBar) * 64);
                      return (
                        <div key={weekLabels[i]} className="flex flex-1 flex-col items-center gap-1.5">
                          <div className="w-full rounded-t-[4px]" style={{ height: barH, background: isToday ? '#C99730' : '#EDE8DC' }} />
                          <span className="text-[10px] font-semibold" style={{ color: isToday ? '#C99730' : '#9AA3B8' }}>{weekLabels[i]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Want to study solo? CTA */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-[16px] px-5 py-4" style={{ background: '#0C1424' }}>
              <div className="flex items-center gap-3">
                <span className="text-[26px]">🎯</span>
                <div>
                  <p className="text-[13px] font-bold text-white">Want to study solo?</p>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.55)' }}>Deep focus, zero distractions. Your personal study sanctuary.</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('solo')}
                className="rounded-full bg-[#E8B84B] px-5 py-2 text-[13px] font-bold text-[#0C1424]"
              >
                Solo Focus →
              </button>
            </div>

            {/* View Session Score */}
            <div className="mt-5 text-center">
              <button
                onClick={() => setShowSessionScore(true)}
                className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-[14px] font-bold text-[#E8B84B]"
                style={{ background: '#0C1424', border: '1.5px solid #E8B84B' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6-6 6 6"/><path d="M12 3v14"/><path d="M5 21h14"/></svg>
                View Session Score
              </button>
            </div>

            {/* Back to Study Rooms */}
            <div className="mt-4 pb-6 text-center">
              <button
                onClick={handleExitRoom}
                className="text-[14px] font-semibold text-[#6B7A99] transition hover:text-[#0C1424]"
              >
                ← Back to Study Rooms
              </button>
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
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-[#6B7A99]">🎯 Room Goals Today</p>
                      <span className="text-[11px] font-semibold text-[#6B7A99]">
                        {myCompletedGoalIds.size}/{roomGoals.length} completed
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#EDE8DC]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: roomGoals.length ? `${(myCompletedGoalIds.size / roomGoals.length) * 100}%` : '0%',
                          background: '#C99730',
                          transition: 'width 0.2s ease',
                        }}
                      />
                    </div>
                  </div>

                  {roomGoals.length === 0 ? (
                    <p className="py-4 text-center text-[12px] text-[#9AA3B8]">No goals yet. Add one below to kick off the session.</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {roomGoals.map((goal) => {
                        const done = myCompletedGoalIds.has(goal.id);
                        return (
                          <li key={goal.id} className="flex items-center gap-2.5 rounded-[10px] bg-white px-3 py-2.5">
                            <button
                              type="button"
                              onClick={() => handleToggleGoal(goal.id)}
                              disabled={togglingGoalIds.has(goal.id)}
                              style={{
                                flexShrink: 0,
                                width: 18,
                                height: 18,
                                borderRadius: 5,
                                border: done ? '1px solid #22C55E' : '1px solid rgba(11,22,40,0.17)',
                                background: done ? '#22C55E' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                padding: 0,
                              }}
                            >
                              {done && (
                                <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                                  <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </button>
                            <span
                              className="text-[12px]"
                              style={{ color: done ? '#9AA3B8' : '#0C1424', textDecoration: done ? 'line-through' : 'none' }}
                            >
                              {goal.title}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  <form className="flex items-center gap-2" onSubmit={handleAddGoal}>
                    <input
                      type="text"
                      value={newGoalInput}
                      onChange={(e) => setNewGoalInput(e.target.value)}
                      placeholder="Add a goal for the room..."
                      className="flex-1 rounded-[8px] border border-[#E1E6EF] bg-[#F8F3EA] px-3 py-2 text-[12px] text-[#0C1424] outline-none placeholder:text-[#9CA3AF]"
                    />
                    <button
                      type="submit"
                      disabled={addingGoal || !newGoalInput.trim()}
                      className="rounded-[8px] px-3 py-2 text-[12px] font-bold text-[#0C1424] disabled:opacity-50"
                      style={{ background: '#C99730' }}
                    >
                      {addingGoal ? '…' : '+ Add'}
                    </button>
                  </form>

                  <div className="border-t border-[#E8E3D8] pt-3 text-center">
                    <div
                      className="text-[#C99730]"
                      style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 700, fontSize: 20 }}
                    >
                      {formatHourMin(teamTotalSeconds)}
                    </div>
                    <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[1.5px] text-[#6B7A99]">
                      Team Total Today
                    </div>
                  </div>
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

    {/* ── Admin: Pending Join Requests panel ─────────────────────────────── */}
    {showRequests && (
      <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/50 px-4 backdrop-blur-[4px]" onClick={() => setShowRequests(false)}>
        <div className="w-full max-w-[440px] overflow-hidden rounded-[20px] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
            <h3 className="text-[16px] font-bold text-[#0C1424]">Join Requests</h3>
            <button onClick={() => setShowRequests(false)} className="flex size-8 items-center justify-center rounded-full bg-[#F3F4F6] text-[20px] text-[#9CA3AF] hover:bg-[#E5E7EB]">×</button>
          </div>
          <div className="max-h-[60vh] overflow-y-auto px-4 py-3">
            {joinRequests.length === 0 ? (
              <div className="px-4 py-10 text-center text-[#9CA3AF]">
                <div className="mb-2 text-[40px]">📭</div>
                <p className="text-[15px] font-semibold text-[#6B7280]">No pending requests</p>
                <p className="mt-1 text-[13px]">When someone requests to join your rooms, you&apos;ll see it here.</p>
              </div>
            ) : (
              joinRequests.map((req) => {
                const busy = processingReqIds.has(req.id);
                return (
                  <div key={req.id} className="flex items-center gap-3 border-b border-[#F1F3F8] px-2 py-3 last:border-0">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#F4C430] text-[14px] font-bold text-[#0C1424]">
                      {req.userInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-bold text-[#0C1424]">{req.userName}</div>
                      <div className="truncate text-[12px] text-[#6B7A99]">wants to join <strong>{req.groupName}</strong></div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => handleApproveRequest(req)}
                        disabled={busy}
                        className="rounded-full bg-[#22C55E] px-3.5 py-1.5 text-[12px] font-bold text-white disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req)}
                        disabled={busy}
                        className="rounded-full border border-[#E1E6EF] bg-white px-3.5 py-1.5 text-[12px] font-bold text-[#6B7280] disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    )}

    {/* ── Session Score ("Session Complete!") overlay ────────────────────── */}
    {showSessionScore && (() => {
      const doneTasks = tasks.filter((t) => t.isCompleted).length;
      return (
        <div className="fixed inset-0 z-[230] overflow-y-auto" style={{ background: 'linear-gradient(180deg,#0B1120,#131A2E)' }}>
          <div className="mx-auto max-w-[860px] px-5 py-12 text-center">
            <div className="text-[56px]">🏆</div>
            <h2 className="mt-2 text-[40px] font-bold text-white" style={{ fontFamily: 'var(--font-cormorant)' }}>Session Complete!</h2>
            <p className="mt-2 text-[15px]" style={{ color: 'rgba(255,255,255,0.55)' }}>Great focus session. Here&apos;s how you did today.</p>

            <div className="mt-8 rounded-[18px] px-6 py-10" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="text-[64px] font-bold text-[#E8B84B]" style={{ fontFamily: 'var(--font-cormorant)' }}>{formatHM(todaySeconds)}</div>
              <div className="mt-1 text-[12px] font-bold uppercase tracking-[2px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Total Focus Time</div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-4">
              {[
                { value: String(completedSessions), label: 'Sessions', color: '#E8B84B' },
                { value: String(doneTasks), label: 'Tasks Done', color: '#22C55E' },
                { value: `${dayStreak}${dayStreak > 0 ? '🔥' : ''}`, label: 'Day Streak', color: '#3B82F6' },
              ].map((s) => (
                <div key={s.label} className="rounded-[16px] px-4 py-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="text-[28px] font-bold" style={{ color: s.color }}>{s.value}</div>
                  <div className="mt-1 text-[11px] font-bold uppercase tracking-[1.5px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-left">
              <div className="mb-3 text-[12px] font-bold uppercase tracking-[1.5px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Today&apos;s Tasks</div>
              {tasks.length === 0 ? (
                <p className="text-[14px]" style={{ color: 'rgba(255,255,255,0.4)' }}>No tasks added today.</p>
              ) : (
                <ul className="flex flex-col">
                  {tasks.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 border-b py-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                      <span className="flex size-6 items-center justify-center rounded-full" style={{ background: t.isCompleted ? '#22C55E' : 'rgba(255,255,255,0.1)' }}>
                        {t.isCompleted && <svg width="12" height="12" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </span>
                      <span className="text-[15px]" style={{ color: t.isCompleted ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.85)', textDecoration: t.isCompleted ? 'line-through' : 'none' }}>{t.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => setShowSessionScore(false)}
                className="rounded-full px-7 py-3 text-[14px] font-bold text-white"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                ← Back to Room
              </button>
              <button
                onClick={() => { setShowSessionScore(false); handleExitRoom(); }}
                className="rounded-full bg-[#E8B84B] px-7 py-3 text-[14px] font-bold text-[#0C1424]"
              >
                Study Rooms →
              </button>
            </div>
          </div>
        </div>
      );
    })()}

    {/* ── Toast ──────────────────────────────────────────────────────────── */}
    {toast && (
      <div className="fixed bottom-6 left-1/2 z-[240] -translate-x-1/2 px-4">
        <div className="flex items-center gap-3 rounded-[14px] bg-[#0C1424] px-5 py-3.5 text-[14px] font-semibold text-white shadow-2xl">
          <span className="text-[18px]">🔔</span>
          {toast}
        </div>
      </div>
    )}
    </>
  );
}
