'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardPageHero from '@/components/DashboardPageHero';
import { studyGroupService } from '@/lib/services';

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
        if (g) openGroup({ ...g, isMember: true });
      }
    } catch {
      // silent
    }
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

  return (
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
        <div className="flex h-14 items-center justify-between border-b border-[#E1E6EF] bg-white px-8">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('rooms')}
              className={`flex items-center gap-2 rounded-[8px] px-5 py-2 text-[13px] font-semibold ${activeTab === 'rooms' ? 'bg-[#090E1C] text-[#E8B84B]' : 'text-[#6B7A99]'}`}
            >
              ️ Study Rooms
            </button>
            <button
              onClick={() => setActiveTab('solo')}
              className={`flex items-center gap-2 rounded-[8px] px-5 py-2 text-[13px] font-semibold ${activeTab === 'solo' ? 'bg-[#090E1C] text-[#E8B84B]' : 'text-[#6B7A99]'}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 18v-6a9 9 0 1118 0v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" fill="currentColor"/>
              </svg>
              Solo Focus
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`flex items-center gap-2 rounded-[8px] px-5 py-2 text-[13px] font-semibold ${activeTab === 'my' ? 'bg-[#090E1C] text-[#E8B84B]' : 'text-[#6B7A99]'}`}
            >
               My Groups {myGroups.length > 0 ? `(${myGroups.length})` : ''}
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab('solo')}
              className="flex items-center gap-2 rounded-[8px] bg-[#090E1C] px-5 py-2 text-[13px] font-semibold text-white"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 18v-6a9 9 0 1118 0v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" fill="currentColor"/>
              </svg>
              Solo Session
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="rounded-[8px] bg-[#E8B84B] px-5 py-2 text-[13px] font-semibold text-[#090E1C]"
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

                <div className="mt-4 text-[11px] font-bold uppercase tracking-[1.5px] text-[#6B7A99]">
                  🍅 Pomodoro · Session {pomoSession} of 4
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
          <div className="flex items-center gap-2 rounded-[10px] border border-[#E1E6EF] bg-white px-4 py-2 text-[13px] text-[#757575]">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search rooms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none placeholder:text-[#757575]"
              style={{ minWidth: 140 }}
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
            {filteredGroups.map((group) => (
              <article
                key={group.id}
                onClick={() => openGroup(group)}
                className="cursor-pointer overflow-hidden rounded-[16px] border border-[#E1E6EF] bg-white shadow-sm transition-shadow hover:shadow-md"
                style={{ borderTop: `3px solid ${statusColor[group.status] || '#E5E7EB'}` }}
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
                        {['A', 'R', 'P'].map((x) => (
                          <span key={x} className="flex size-5 items-center justify-center rounded-full bg-[#172444] text-[9px] text-white">
                            {x}
                          </span>
                        ))}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-[520px] rounded-[20px] bg-[#F4F6FA] p-8 shadow-2xl">
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

              {/* Focus Topic */}
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[1px] text-[#6B7A99]">
                  Focus Topic <span className="font-normal normal-case text-[#9CA3AF]">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={createForm.focusTopic || ''}
                  onChange={(e) => setCreateForm((p) => ({ ...p, focusTopic: e.target.value }))}
                  placeholder="e.g., GS2 – Parliament & Governance"
                  className="w-full rounded-[12px] border border-[#DDE3EC] bg-white px-4 py-3 text-[14px] text-[#0C1424] outline-none placeholder:text-[#9CA3AF] focus:border-[#E8B84B]"
                />
              </div>

              {/* Subjects */}
              <div>
                <label className="mb-3 block text-[11px] font-bold uppercase tracking-[1px] text-[#6B7A99]">
                  Subjects <span className="font-normal normal-case text-[#9CA3AF]">(Optional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Indian Polity', icon: '🏛️', value: 'Polity' },
                    { label: 'History', icon: '📜', value: 'History' },
                    { label: 'Geography', icon: '🌍', value: 'Geography' },
                    { label: 'Economy', icon: '💰', value: 'Economy' },
                    { label: 'Environment', icon: '🌿', value: 'Environment' },
                    { label: 'Science & Tech', icon: '🔬', value: 'Sci & Tech' },
                    { label: 'Current Affairs', icon: '📰', value: 'Current Affairs' },
                    { label: 'Ethics', icon: '⚖️', value: 'Ethics' },
                  ].map((subject) => {
                    const isSelected = createForm.subjects?.includes(subject.value);
                    return (
                      <button
                        key={subject.value}
                        onClick={() => {
                          const current = createForm.subjects || [];
                          const updated = isSelected
                            ? current.filter((s: string) => s !== subject.value)
                            : [...current, subject.value];
                          setCreateForm((p) => ({ ...p, subjects: updated }));
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${
                          isSelected
                            ? 'border-[#E8B84B] bg-[#E8B84B]/10 text-[#C99730]'
                            : 'border-[#DDE3EC] bg-white text-[#6B7A99] hover:border-[#C99730]'
                        }`}
                      >
                        <span>{subject.icon}</span>
                        <span>{subject.label}</span>
                      </button>
                    );
                  })}
                </div>
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
  );
}
