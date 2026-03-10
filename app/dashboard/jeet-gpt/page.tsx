'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/contexts/AuthContext';
import { aiService } from '@/lib/services';
import Sidebar from '@/components/Sidebar';

/* Leaf/feather logo for sidebar */
const LeafLogo = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
    <path
      d="M12 2C8 8 12 14 12 20c0 0 4-6 8-12-4 4-8 8-12 10-2-2-4-4-4-6 0-4 4-8 8-12z"
      fill="#4ADE80"
      stroke="#4ADE80"
      strokeWidth="0.5"
    />
  </svg>
);

const suggestionCards = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#92400E]">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 7h8M8 11h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    iconBg: '#FFF7ED',
    title: 'Explain a UPSC topic',
    subtitle: 'Deep explanation with dimensions, UPSC angle & related questions',
    prompt: 'Explain a UPSC topic in depth with all dimensions that an examiner would reward.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#7C3AED]">
        <path d="M12 2v4M8 6l4 4 4-4M12 6v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 22h16M4 22l3-8M20 22l-3-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    iconBg: '#FAF5FF',
    title: 'Ethics case study I should know',
    subtitle: 'Real-world ethics + how to frame and structure your answer',
    prompt: 'Give me an important ethics case study for UPSC with stakeholder analysis and answer structure.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#DC2626]">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    iconBg: '#FEF2F2',
    title: 'Build my study plan',
    subtitle: 'Personalized schedule based on your exam date and syllabus gaps',
    prompt: 'Help me build a personalized UPSC study plan based on my preparation level.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#2563EB]">
        <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    iconBg: '#EFF6FF',
    title: 'Study strategy & planner',
    subtitle: 'Personalized roadmap, daily schedules + all-topic prioritization',
    prompt: 'Give me a study strategy and daily schedule for UPSC preparation with topic prioritization.',
  },
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
}

interface GroupedConversations {
  today: Conversation[];
  yesterday: Conversation[];
  earlier: Conversation[];
}

function formatTime(dateStr?: string) {
  const d = dateStr ? new Date(dateStr) : new Date();
  let h = d.getHours();
  const m = d.getMinutes();
  const am = h < 12;
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, '0')} ${am ? 'am' : 'pm'}`;
}

export default function JeetGPTPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dashboardSidebarOpen, setDashboardSidebarOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<GroupedConversations>({ today: [], yesterday: [], earlier: [] });
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const firstName = user?.firstName || 'there';
  const initials = `${(user?.firstName || 'U')[0]}${(user?.lastName || '')[0] || ''}`.toUpperCase();

  // Load conversation history on mount
  useEffect(() => {
    aiService.getConversations()
      .then((res) => setConversations(res.data || { today: [], yesterday: [], earlier: [] }))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const refreshConversations = useCallback(() => {
    aiService.getConversations()
      .then((res) => setConversations(res.data || { today: [], yesterday: [], earlier: [] }))
      .catch(() => {});
  }, []);

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setSending(true);

    try {
      const res = await aiService.chat(trimmed, conversationId || undefined);
      const data = res.data;
      if (data?.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data?.reply || 'Sorry, I could not generate a response.',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      refreshConversations();
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: err?.message?.includes('rate') || err?.message?.includes('Too many')
          ? 'You\'ve hit the rate limit. Please wait a few minutes before sending another message.'
          : 'Something went wrong. Please try again.',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(inputValue);
  };

  const loadConversation = async (id: string) => {
    try {
      const res = await aiService.getConversation(id);
      const data = res.data;
      setConversationId(data.id);
      setMessages(
        (data.messages || []).map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        }))
      );
    } catch {
      // ignore
    }
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await aiService.deleteConversation(id);
      if (conversationId === id) {
        startNewConversation();
      }
      refreshConversations();
    } catch {
      // ignore
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setInputValue('');
  };

  const inChat = messages.length > 0;

  const renderConversationGroup = (label: string, items: Conversation[]) => {
    if (items.length === 0) return null;
    return (
      <div>
        <div className="font-inter text-[10px] leading-[15px] tracking-[0.5px] uppercase mb-2" style={{ color: '#6A7282' }}>
          {label}
        </div>
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => loadConversation(item.id)}
            className={`group flex items-center gap-2 py-2 px-3 rounded-[10px] mb-1 cursor-pointer hover:bg-white/5 ${conversationId === item.id ? 'bg-white/10' : ''}`}
          >
            <span className="font-inter text-[12px] leading-4 truncate flex-1" style={{ color: '#D1D5DC' }}>
              {item.title}
            </span>
            <button
              onClick={(e) => deleteConversation(item.id, e)}
              className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 flex-shrink-0"
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="#99A1AF" strokeWidth="1.5"><path d="M2 2l10 10M12 2L2 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        ))}
      </div>
    );
  };

  const markdownComponents = {
    h1: ({ children }: any) => (
      <h1 className="font-inter font-bold text-[20px] leading-8 mt-4 mb-2" style={{ color: '#101828' }}>{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="font-inter font-bold text-[17px] leading-7 mt-4 mb-2" style={{ color: '#101828' }}>{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="font-inter font-bold text-[15px] leading-6 mt-3 mb-1" style={{ color: '#101828' }}>{children}</h3>
    ),
    p: ({ children }: any) => (
      <p className="font-inter text-[14px] leading-[22px] mb-2" style={{ color: '#364153' }}>{children}</p>
    ),
    strong: ({ children }: any) => (
      <strong className="font-semibold" style={{ color: '#101828' }}>{children}</strong>
    ),
    em: ({ children }: any) => (
      <em className="italic" style={{ color: '#364153' }}>{children}</em>
    ),
    ul: ({ children }: any) => (
      <ul className="my-2 space-y-1 pl-4" style={{ listStyleType: 'disc', color: '#364153' }}>{children}</ul>
    ),
    ol: ({ children }: any) => (
      <ol className="my-2 space-y-1 pl-4" style={{ listStyleType: 'decimal', color: '#364153' }}>{children}</ol>
    ),
    li: ({ children }: any) => (
      <li className="font-inter text-[14px] leading-[22px]" style={{ color: '#364153' }}>{children}</li>
    ),
    hr: () => (
      <hr className="my-4" style={{ borderColor: '#E5E7EB' }} />
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 pl-4 my-3 italic" style={{ borderColor: '#F0B100', color: '#6A7282' }}>{children}</blockquote>
    ),
    code: ({ inline, children }: any) =>
      inline ? (
        <code className="px-1.5 py-0.5 rounded text-[13px] font-mono" style={{ background: '#F3F4F6', color: '#101828' }}>{children}</code>
      ) : (
        <pre className="p-4 rounded-[10px] overflow-x-auto my-3 text-[13px] font-mono" style={{ background: '#0F1C2E', color: '#E5E7EB' }}>
          <code>{children}</code>
        </pre>
      ),
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-4">
        <table className="w-full text-[13px] font-inter border-collapse" style={{ border: '1px solid #E5E7EB' }}>{children}</table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead style={{ background: '#F9FAFB' }}>{children}</thead>
    ),
    th: ({ children }: any) => (
      <th className="px-3 py-2 text-left font-semibold" style={{ color: '#101828', borderBottom: '1px solid #E5E7EB' }}>{children}</th>
    ),
    td: ({ children }: any) => (
      <td className="px-3 py-2" style={{ color: '#364153', borderBottom: '1px solid #F3F4F6' }}>{children}</td>
    ),
    tr: ({ children }: any) => (
      <tr className="hover:bg-[#FAFAFA]">{children}</tr>
    ),
  };

  return (
    <div
      className="flex overflow-hidden bg-white"
      style={{ height: 'calc(100vh - clamp(90px, 5.78vw, 111px))' }}
    >
      {/* Dashboard sidebar — shown when toggled from Jeet sidebar */}
      {dashboardSidebarOpen && <Sidebar forceShow />}

      {/* Left Sidebar - Dark, collapsible */}
      <aside
        className="flex-shrink-0 flex flex-col overflow-hidden transition-all duration-300"
        style={{ width: sidebarOpen ? '266px' : '0px', background: '#0A1628' }}
      >
        {/* Logo with leaf icon + dashboard sidebar toggle */}
        <div className="pt-5 px-4 pb-2 flex items-start justify-between gap-2">
          <Link href="/dashboard" className="flex items-start gap-2 flex-1 min-w-0">
            <LeafLogo />
            <div className="min-w-0">
              <div className="font-inter font-bold text-[18px] leading-7 text-white truncate">
                Rise with Jeet IAS
              </div>
              <div
                className="font-inter text-[10px] leading-[15px] tracking-[0.5px] uppercase mt-0.5"
                style={{ color: '#99A1AF' }}
              >
                India&apos;s Premier UPSC Platform
              </div>
            </div>
          </Link>
          {/* Toggle dashboard sidebar */}
          <button
            type="button"
            onClick={() => setDashboardSidebarOpen((v) => !v)}
            title={dashboardSidebarOpen ? 'Hide navigation' : 'Show navigation'}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-[6px] mt-0.5 transition-colors"
            style={{ background: dashboardSidebarOpen ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)' }}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <rect x="0.75" y="0.75" width="13.5" height="13.5" rx="2" stroke="#99A1AF" strokeWidth="1.2"/>
              <line x1="5" y1="0.75" x2="5" y2="14.25" stroke="#99A1AF" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M2 5.5L3.2 7.5L2 9.5" stroke="#99A1AF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* New Conversation Button */}
        <div className="px-4 pt-4">
          <button
            type="button"
            onClick={startNewConversation}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-[10px] font-inter font-semibold text-[14px] leading-5 text-white"
            style={{ background: 'linear-gradient(90deg, #F0B100 0%, #FF6900 100%)' }}
          >
            + New Conversation
          </button>
        </div>

        {/* Conversation History */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {loadingHistory ? (
            <p className="text-[12px] text-center" style={{ color: '#6A7282' }}>Loading...</p>
          ) : (
            <>
              {renderConversationGroup('Today', conversations.today)}
              {renderConversationGroup('Yesterday', conversations.yesterday)}
              {renderConversationGroup('Earlier', conversations.earlier)}
              {conversations.today.length === 0 && conversations.yesterday.length === 0 && conversations.earlier.length === 0 && (
                <p className="text-[12px] text-center" style={{ color: '#6A7282' }}>No conversations yet</p>
              )}
            </>
          )}
        </div>

        {/* User Profile */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-2 p-2 rounded-[10px]">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center font-inter font-bold text-[10px] leading-[15px] text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #51A2FF 0%, #155DFC 100%)' }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-inter font-semibold text-[12px] leading-4 text-white truncate">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="font-inter text-[10px] leading-[15px]" style={{ color: '#99A1AF' }}>
                {user?.role === 'admin' ? 'Admin' : 'Free user'}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden" style={{ background: '#FFFFFF' }}>
        {/* Header */}
        <header
          className="flex-shrink-0 flex items-center gap-3 py-3 px-4"
          style={{ borderBottom: '0.8px solid #E5E7EB' }}
        >
          {/* Sidebar toggle */}
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-[8px] flex-shrink-0 transition-colors hover:bg-[#F3F4F6]"
            title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="1" y="1" width="16" height="16" rx="2.5" stroke="#6A7282" strokeWidth="1.4"/>
              <line x1="6" y1="1.7" x2="6" y2="16.3" stroke="#6A7282" strokeWidth="1.4" strokeLinecap="round"/>
              {sidebarOpen && (
                <>
                  <path d="M3.5 6.5L4.5 9L3.5 11.5" stroke="#6A7282" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </>
              )}
            </svg>
          </button>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-inter font-bold text-[18px] leading-7" style={{ color: '#101828' }}>Jeet AI</span>
              <span className="font-inter text-[14px] leading-5" style={{ color: '#6A7282' }}>—</span>
              <span className="font-inter text-[14px] leading-5" style={{ color: '#6A7282' }}>Your UPSC Mentor</span>
            </div>
            <div className="font-inter text-[12px] leading-4" style={{ color: '#99A1AF' }}>
              Ask anything about UPSC preparation
            </div>
          </div>
        </header>

        {!inChat ? (
          /* Welcome Section */
          <div className="flex-1 overflow-y-auto flex flex-col items-center px-6 py-8">
            <div
              className="w-20 h-20 rounded-[24px] flex items-center justify-center text-4xl mb-6"
              style={{
                background: '#1E3A5F',
                boxShadow: '0px 4px 6px -4px rgba(0,0,0,0.1), 0px 10px 15px -3px rgba(0,0,0,0.1)',
              }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <h1 className="font-inter font-bold text-[30px] leading-9 text-center mb-4" style={{ color: '#101828' }}>
              Hi {firstName}, I&apos;m <span className="font-bold italic" style={{ color: '#D08700' }}>Jeet AI</span>.
            </h1>
            <p className="font-inter text-[16px] leading-6 text-center max-w-[561px] mb-4" style={{ color: '#4A5565' }}>
              I&apos;m Jeet AI, your intelligent UPSC preparation partner — from ancient history to current affairs,
              revision strategy, or just thinking through a topic together.
            </p>
            <p className="font-inter text-[18px] leading-5 mb-10" style={{ color: '#99A1AF' }}>
              How can I help you today in your preparation?
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[800px] w-full mb-10">
              {suggestionCards.map((card, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(card.prompt)}
                  className="text-left p-6 rounded-[16px] border transition-colors hover:border-[#D08700]/50 hover:shadow-md"
                  style={{ border: '0.8px solid #E5E7EB', background: '#FFFFFF' }}
                >
                  <div className="w-10 h-10 rounded-[14px] flex items-center justify-center mb-4" style={{ background: card.iconBg }}>
                    {card.icon}
                  </div>
                  <h3 className="font-inter font-bold text-[18px] leading-[27px] mb-2" style={{ color: '#101828' }}>{card.title}</h3>
                  <p className="font-inter text-[14px] leading-5" style={{ color: '#6A7282' }}>{card.subtitle}</p>
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="w-full max-w-[968px]">
              <div className="flex items-center gap-3 px-4 py-3 rounded-[16px]" style={{ border: '0.8px solid #E5E7EB', background: '#F9FAFB' }}>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask me anything about your preparation..."
                  className="flex-1 bg-transparent font-inter text-[16px] outline-none placeholder:font-normal"
                  style={{ color: '#101828' }}
                />
                <button type="submit" disabled={sending} className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 disabled:opacity-50" style={{ background: '#1E3A5F' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                </button>
              </div>
              <p className="font-inter text-[12px] leading-4 text-center mt-3 italic" style={{ color: '#99A1AF' }}>
                Jeet AI can make mistakes. Verify important facts from NCERT & official sources.
              </p>
            </form>
          </div>
        ) : (
          /* Chat View */
          <>
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id}>
                  {msg.role === 'user' ? (
                    <>
                      <div className="flex justify-end mb-1">
                        <div
                          className="max-w-[672px] py-3 px-6 rounded-[24px] font-inter text-[14px] leading-5 text-white"
                          style={{ background: '#0F1C2E' }}
                        >
                          {msg.content}
                        </div>
                      </div>
                      <div className="flex justify-end mb-2">
                        <span className="font-inter text-[12px] leading-4" style={{ color: '#99A1AF' }}>
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div
                      className="max-w-[840px] rounded-[16px] p-6 border mb-2"
                      style={{
                        border: '0.8px solid #E5E7EB',
                        background: '#FFFFFF',
                        boxShadow: '0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1)',
                      }}
                    >
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#1E3A5F' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F0B100" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                            {msg.content}
                          </ReactMarkdown>
                          <div className="mt-3">
                            <span className="font-inter text-[12px] leading-4" style={{ color: '#99A1AF' }}>
                              {formatTime(msg.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {sending && (
                <div
                  className="max-w-[840px] rounded-[16px] p-6 border"
                  style={{ border: '0.8px solid #E5E7EB', background: '#FFFFFF' }}
                >
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#1E3A5F' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F0B100" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                    </div>
                    <div className="flex items-center gap-1 py-2">
                      <div className="w-2 h-2 rounded-full bg-[#99A1AF] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-[#99A1AF] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-[#99A1AF] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input bar - chat view */}
            <div className="flex-shrink-0 pt-4 px-6 pb-6 border-t" style={{ borderTop: '0.8px solid #E5E7EB', background: '#FFFFFF' }}>
              <form onSubmit={handleSubmit} className="flex items-center gap-3 px-4 py-3.5 rounded-[16px]" style={{ border: '0.8px solid #E5E7EB', background: '#F9FAFB' }}>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask Jeet AI anything about UPSC..."
                  className="flex-1 bg-transparent font-inter text-[14px] outline-none placeholder:font-normal min-w-0"
                  style={{ color: '#101828' }}
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !inputValue.trim()}
                  className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white flex-shrink-0 disabled:opacity-50"
                  style={{ background: '#1E3A5F' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                </button>
              </form>
              <p className="font-inter text-[12px] leading-4 text-center mt-3 italic" style={{ color: '#99A1AF' }}>
                Jeet AI can make mistakes. Verify important facts from NCERT & official sources.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
