'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rooms' | 'my'>('rooms');
  const [subjectFilter, setSubjectFilter] = useState('All Rooms');
  const [search, setSearch] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', subject: 'Polity', maxMembers: 50 });
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    if (!createForm.name || !createForm.subject) return;
    try {
      const res = await studyGroupService.createGroup({
        name: createForm.name,
        description: createForm.description,
        subject: createForm.subject,
        maxMembers: createForm.maxMembers,
      });
      if (res.status === 'success') {
        setShowCreate(false);
        setCreateForm({ name: '', description: '', subject: 'Polity', maxMembers: 50 });
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
        badgeIcon={<img src="/cap.png" alt="cap" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />}
        badgeText="STUDY TOGETHER"
        title={
          <>
            Your Digital <em className="not-italic" style={{ color: '#e8a820', fontStyle: 'italic' }}>Study Library</em>
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
      />

      <main className="mx-auto max-w-[1244px] px-4 pb-16">
        {/* Tabs */}
        <div className="flex h-14 items-center justify-between border-b border-[#E1E6EF] bg-white px-8">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('rooms')}
              className={`rounded-[8px] px-5 py-2 text-[13px] font-semibold ${activeTab === 'rooms' ? 'bg-[#090E1C] text-[#E8B84B]' : 'text-[#6B7A99]'}`}
            >
              🏛️ Study Rooms
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`rounded-[8px] px-5 py-2 text-[13px] font-semibold ${activeTab === 'my' ? 'bg-[#090E1C] text-[#E8B84B]' : 'text-[#6B7A99]'}`}
            >
              🎯 My Groups {myGroups.length > 0 ? `(${myGroups.length})` : ''}
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreate(true)}
              className="rounded-[8px] bg-[#E8B84B] px-5 py-2 text-[13px] font-semibold text-[#090E1C]"
            >
              + Create Room
            </button>
          </div>
        </div>

        {/* Search & filters */}
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
      </main>

      {/* Create Group Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-[18px] border border-[#E1E6EF] bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-[18px] font-bold text-[#0C1424]">Create Study Room</h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-[#6B7A99]">Room Name</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Polity Warriors"
                  className="w-full rounded-[10px] border border-[#E1E6EF] bg-[#F4F6FA] px-4 py-2 text-[13px] outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-[#6B7A99]">Subject</label>
                <select
                  value={createForm.subject}
                  onChange={(e) => setCreateForm((p) => ({ ...p, subject: e.target.value }))}
                  className="w-full rounded-[10px] border border-[#E1E6EF] bg-[#F4F6FA] px-4 py-2 text-[13px] outline-none"
                >
                  {SUBJECTS.filter((s) => s !== 'All Rooms').map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-[#6B7A99]">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="What's this group about?"
                  rows={3}
                  className="w-full rounded-[10px] border border-[#E1E6EF] bg-[#F4F6FA] px-4 py-2 text-[13px] outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-[#6B7A99]">Max Members</label>
                <input
                  type="number"
                  min={2}
                  max={500}
                  value={createForm.maxMembers}
                  onChange={(e) => setCreateForm((p) => ({ ...p, maxMembers: Number(e.target.value) }))}
                  className="w-full rounded-[10px] border border-[#E1E6EF] bg-[#F4F6FA] px-4 py-2 text-[13px] outline-none"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 rounded-[10px] border border-[#E1E6EF] py-2 text-[13px] font-semibold text-[#6B7A99]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!createForm.name || !createForm.subject}
                className="flex-1 rounded-[10px] bg-[#E8B84B] py-2 text-[13px] font-bold text-[#090E1C] disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
