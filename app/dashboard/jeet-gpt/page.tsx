'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/contexts/AuthContext';
import { jeetAIService } from '@/lib/services';

/* ── Spinner ── */
const Spinner = () => (
  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
  </svg>
);

/* ── Suggestion cards ── */
const suggestionCards = [
  {
    iconSrc: '/jeet-gpt-icons/books.png',
    iconAlt: 'Books',
    iconBg: '#FFF7ED',
    accent: '#4F46E5',
    accentSoft: '#EEF2FF',
    shadow: 'rgba(79, 70, 229, 0.18)',
    title: 'Explain a UPSC topic',
    subtitle: 'Deep explanation with dimensions, UPSC angle & related questions',
    prompt: 'Explain the Bhakti Movement and its socio-religious significance for UPSC preparation',
  },
  {
    iconSrc: '/jeet-gpt-icons/scales.png',
    iconAlt: 'Ethics scales',
    iconBg: '#FAF5FF',
    accent: '#E59A0A',
    accentSoft: '#FFFBEB',
    shadow: 'rgba(229, 154, 10, 0.18)',
    title: 'Ethics case study I should know',
    subtitle: 'Real-world ethics + how to frame and structure your answer',
    prompt: 'Give me an important ethics case study with stakeholders and how to write a UPSC GS Paper 4 answer',
  },
  {
    iconSrc: '/jeet-gpt-icons/notes.png',
    iconAlt: 'Study notes',
    iconBg: '#FEF2F2',
    accent: '#16A34A',
    accentSoft: '#F0FDF4',
    shadow: 'rgba(22, 163, 74, 0.16)',
    title: 'Build my study plan',
    subtitle: 'Personalized schedule based on your exam date and syllabus gaps',
    prompt: 'Build me a personalized UPSC study plan for the next 3 months covering all GS papers',
  },
  {
    iconSrc: '/jeet-gpt-icons/chart.png',
    iconAlt: 'Strategy chart',
    iconBg: '#EFF6FF',
    accent: '#DC2626',
    accentSoft: '#FEF2F2',
    shadow: 'rgba(220, 38, 38, 0.16)',
    title: 'Study strategy & planner',
    subtitle: 'Personalized roadmap, daily schedules + all-topic prioritization',
    prompt: 'What is the best study strategy for a UPSC first-time aspirant? Give me a prioritized roadmap',
  },
];

/* ── Types ── */
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
}

interface GroupedConversations {
  today: ConversationSummary[];
  yesterday: ConversationSummary[];
  earlier: ConversationSummary[];
}

function getInitials(firstName?: string, lastName?: string, email?: string): string {
  if (firstName && lastName) return (firstName[0] + lastName[0]).toUpperCase();
  if (firstName) return firstName.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return 'U';
}

function formatTime(dateStr?: string | Date): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  let h = d.getHours();
  const m = d.getMinutes();
  const am = h < 12;
  h = h % 12 || 12;
  return h + ':' + m.toString().padStart(2, '0') + ' ' + (am ? 'am' : 'pm');
}

function UserAvatar({ initials, size = 32 }: { initials: string; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-inter font-bold text-white flex-shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, Math.round(size * 0.38)),
        background: 'linear-gradient(135deg, #51A2FF 0%, #155DFC 100%)',
      }}
    >
      {initials}
    </div>
  );
}

function JeetAIAvatar({ size = 32 }: { size?: number }) {
  return (
    <Image src="/jeet-ai-icon.png" alt="Jeet AI" width={size} height={size} className="object-contain flex-shrink-0" />
  );
}

/* ── Markdown renderer using react-markdown ── */
function normalizeJeetMarkup(content: string): string {
  return content
    .replace(/>?\s*\[!ALERT[^\]]*\]\s*\n([\s\S]*?)\n>?\s*\[\/ALERT\]/g, (_match, body: string) => {
      const lines = body
        .split('\n')
        .map((line) => line.replace(/^>\s?/, '').trimEnd())
        .filter(Boolean);

      return ['> **Important:**', ...lines.map((line) => `> ${line}`)].join('\n');
    })
    .replace(/>?\s*\[!TIP\]\s*\n([\s\S]*?)\n>?\s*\[\/TIP\]/g, (_match, body: string) => {
      const lines = body
        .split('\n')
        .map((line) => line.replace(/^>\s?/, '').trimEnd())
        .filter(Boolean);

      return ['> **Tip:**', ...lines.map((line) => `> ${line}`)].join('\n');
    })
    .replace(/==[a-z]+{([^{}]+)}==/gi, '**$1**')
    .replace(/^---\s*BADGES:\s*(.*?)\s*---$/gim, '**Tags:** $1');
}

function MarkdownRenderer({ content }: { content: string }) {
  const normalizedContent = normalizeJeetMarkup(content);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="font-inter font-bold text-[20px] leading-8 mt-5 mb-2" style={{ color: '#101828' }}>{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="font-inter font-bold text-[17px] leading-7 mt-5 mb-2" style={{ color: '#101828' }}>{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="font-inter font-bold text-[15px] leading-6 mt-4 mb-1" style={{ color: '#101828' }}>{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="font-inter font-bold text-[14px] leading-5 mt-3 mb-1" style={{ color: '#101828' }}>{children}</h4>
        ),
        p: ({ children }) => (
          <p className="font-inter text-[14px] leading-6 mb-2" style={{ color: '#364153' }}>{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-5 space-y-1 mb-3">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-5 space-y-1 mb-3">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="font-inter text-[14px] leading-6" style={{ color: '#364153' }}>{children}</li>
        ),
        strong: ({ children }) => (
          <strong style={{ color: '#101828' }}>{children}</strong>
        ),
        em: ({ children }) => <em>{children}</em>,
        code: ({ className, children, ...props }) => {
          const isBlock = className?.includes('language-');
          if (isBlock) {
            return (
              <code className={className} {...props}>{children}</code>
            );
          }
          return (
            <code
              className="px-1.5 py-0.5 rounded text-[13px]"
              style={{ background: '#F3F4F6', color: '#1447E6', fontFamily: 'monospace' }}
              {...props}
            >
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre
            className="rounded-lg p-4 mb-3 overflow-x-auto text-[13px] leading-5"
            style={{ background: '#1E293B', color: '#E2E8F0', fontFamily: 'monospace' }}
          >
            {children}
          </pre>
        ),
        blockquote: ({ children }) => (
          <blockquote
            className="pl-4 mb-3 italic"
            style={{ borderLeft: '3px solid #E8B84B', color: '#4A5565' }}
          >
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: '#1447E6' }}
          >
            {children}
          </a>
        ),
        hr: () => <hr className="my-4" style={{ borderColor: '#E5E7EB' }} />,
        table: ({ children }) => (
          <div className="overflow-x-auto mb-3">
            <table className="w-full border-collapse text-[13px]" style={{ border: '1px solid #E5E7EB' }}>
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => <thead>{children}</thead>,
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => <tr>{children}</tr>,
        th: ({ children }) => (
          <th
            className="font-inter font-semibold text-left px-3 py-2"
            style={{ background: '#F9FAFB', color: '#101828', border: '1px solid #E5E7EB' }}
          >
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td
            className="font-inter px-3 py-2"
            style={{ color: '#364153', border: '1px solid #E5E7EB' }}
          >
            {children}
          </td>
        ),
      }}
    >
      {normalizedContent}
    </ReactMarkdown>
  );
}

const DAILY_QUERY_LIMIT = 10;

/* ══════════════════════════════════════════════════════════════════════════ */
export default function JeetGPTPage() {
  const { user } = useAuth();
  const [historyOpen, setHistoryOpen] = useState(false);

  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [queriesUsed, setQueriesUsed] = useState(0);
  const [proCardDismissed, setProCardDismissed] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [conversations, setConversations] = useState<GroupedConversations>({
    today: [],
    yesterday: [],
    earlier: [],
  });
  const [sidebarLoading, setSidebarLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const fetchConversations = useCallback(async () => {
    try {
      setSidebarLoading(true);
      const res = await jeetAIService.getConversations();
      if (res.status === 'success' && res.data) {
        setConversations(res.data);
      }
    } catch {
      // silent
    } finally {
      setSidebarLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const loadConversation = async (id: string) => {
    try {
      setIsLoading(true);
      const res = await jeetAIService.getConversation(id);
      if (res.status === 'success' && res.data) {
        setMessages(res.data.messages as Message[]);
        setActiveConversationId(id);
        setQueriesUsed(0);
        setShowUpgradeModal(false);
        setHistoryOpen(false);
        setError(null);
      }
    } catch {
      setError('Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await jeetAIService.deleteConversation(id);
      if (activeConversationId === id) startNewConversation();
      fetchConversations();
    } catch {
      // silent
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setActiveConversationId(null);
    setInputValue('');
    setQueriesUsed(0);
    setError(null);
    setProCardDismissed(false);
    setShowUpgradeModal(false);
    setHistoryOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading || queriesUsed >= DAILY_QUERY_LIMIT) return;

    const tempId = 'temp-' + Date.now();
    const tempUserMsg: Message = { id: tempId, role: 'user', content: trimmed, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, tempUserMsg]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const res = await jeetAIService.sendMessage(trimmed, activeConversationId ?? undefined);
      if (res.status === 'success' && res.data) {
        const { conversationId, reply } = res.data;
        setActiveConversationId(conversationId);
        setQueriesUsed((prev) => {
          const next = prev + 1;
          if (next >= DAILY_QUERY_LIMIT) setShowUpgradeModal(true);
          return next;
        });
        const aiMsg: Message = { id: 'ai-' + Date.now(), role: 'assistant', content: reply, createdAt: new Date().toISOString() };
        setMessages((prev) => [...prev, aiMsg]);
        fetchConversations();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to get response. Please try again.');
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsLoading(false);
    }
  };

  const queriesExhausted = queriesUsed >= DAILY_QUERY_LIMIT;
  const showChat = messages.length > 0;
  const displayName = user
    ? ((user.firstName ?? '') + (user.firstName && user.lastName ? ' ' : '') + (user.lastName ?? '')).trim() || user.email
    : 'Loading...';
  const initials = getInitials(user?.firstName, user?.lastName, user?.email);
  const userPlan = user?.role === 'admin' ? 'Admin' : 'Free user';
  const hasConversations = conversations.today.length > 0 || conversations.yesterday.length > 0 || conversations.earlier.length > 0;

  return (
    <div className="flex min-h-0 overflow-hidden bg-white" style={{ height: '100%' }}>

      {/* ── History drawer overlay (mobile + tablet) ── */}
      {historyOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setHistoryOpen(false)} />
      )}

      {/* ── Left Sidebar (off-canvas drawer below lg, inline on desktop) ── */}
      <aside
        className={`flex-shrink-0 flex flex-col overflow-hidden fixed lg:relative left-0 z-40 lg:z-auto top-[clamp(56px,5.78vw,111px)] bottom-0 lg:top-auto lg:bottom-auto transition-transform duration-200 ${historyOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ width: '266px', maxWidth: '85vw', background: '#0A1628' }}
      >
        <div className="px-4 pt-6">
          <button type="button" onClick={startNewConversation} className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-[10px] font-inter font-semibold text-[14px] leading-5" style={{ background: '#E8B84B', color: '#155DFC' }}>
            ⚡ New Conversation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {sidebarLoading ? (
            <div className="flex justify-center py-8 text-white/50"><Spinner /></div>
          ) : !hasConversations ? (
            <div className="mt-8 rounded-[10px] px-4 py-5 text-center" style={{ background: 'rgba(255,255,255,0.035)', border: '0.8px solid rgba(255,255,255,0.08)' }}>
              <p className="font-inter font-semibold text-[13px] leading-5" style={{ color: '#D1D5DC' }}>No chats yet</p>
              <p className="font-inter text-[12px] leading-5 mt-1" style={{ color: '#6A7282' }}>Start a conversation and your history will appear here.</p>
            </div>
          ) : (
            <>
              {conversations.today.length > 0 && (
                <div>
                  <div className="font-inter text-[10px] leading-[15px] tracking-[0.5px] uppercase mb-2" style={{ color: '#6A7282' }}>Today</div>
                  {conversations.today.map((item) => <ConvItem key={item.id} item={item} active={activeConversationId === item.id} onClick={() => loadConversation(item.id)} onDelete={(e) => deleteConversation(item.id, e)} />)}
                </div>
              )}
              {conversations.yesterday.length > 0 && (
                <div>
                  <div className="font-inter text-[10px] leading-[15px] tracking-[0.5px] uppercase mb-2" style={{ color: '#6A7282' }}>Yesterday</div>
                  {conversations.yesterday.map((item) => <ConvItem key={item.id} item={item} active={activeConversationId === item.id} onClick={() => loadConversation(item.id)} onDelete={(e) => deleteConversation(item.id, e)} />)}
                </div>
              )}
              {conversations.earlier.length > 0 && (
                <div>
                  <div className="font-inter text-[10px] leading-[15px] tracking-[0.5px] uppercase mb-2" style={{ color: '#6A7282' }}>Earlier</div>
                  {conversations.earlier.map((item) => <ConvItem key={item.id} item={item} active={activeConversationId === item.id} onClick={() => loadConversation(item.id)} onDelete={(e) => deleteConversation(item.id, e)} />)}
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-4 py-4 border-t border-white/10">
          <div className="font-inter text-[10px] leading-[15px] tracking-[0.5px] uppercase mb-2" style={{ color: '#6A7282' }}>Daily Queries</div>
          <div className="rounded-[10px] p-3 mb-3" style={{ border: '1px solid #787C82', background: 'rgba(217, 217, 217, 0.1)' }}>
            <div className="flex justify-between items-center font-inter text-[12px]" style={{ color: '#D1D5DC' }}>
              <span>{queriesUsed}/{DAILY_QUERY_LIMIT}</span>
              {queriesExhausted && <span className="text-[10px]" style={{ color: '#FB2C36' }}>Limit reached</span>}
            </div>
            <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <div className="h-full rounded-full transition-all duration-300" style={{ width: ((queriesUsed / DAILY_QUERY_LIMIT) * 100) + '%', background: queriesExhausted ? '#FB2C36' : '#E8B84B' }} />
            </div>
          </div>
          <Link href="/dashboard/profile" className="flex items-center gap-2 p-2 rounded-[10px] hover:bg-white/5 transition-colors">
            <UserAvatar initials={initials} size={24} />
            <div className="flex-1 min-w-0">
              <div className="font-inter font-semibold text-[12px] leading-4 text-white truncate">{displayName}</div>
              <div className="font-inter text-[10px] leading-[15px] flex items-center gap-1 min-w-0" style={{ color: '#99A1AF' }}>
                <span>{userPlan}</span>
                {user?.role !== 'admin' && (
                  <>
                    <span style={{ color: '#4A5565' }}>-</span>
                    <span className="font-semibold" style={{ color: '#E8B84B' }}>Upgrade ↗</span>
                  </>
                )}
              </div>
            </div>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0 text-white/70"><path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden" style={{ background: '#FFFFFF' }}>
        <header className="flex-shrink-0 flex flex-col gap-0.5 py-3 px-4 md:px-6" style={{ borderBottom: '0.8px solid #E5E7EB' }}>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="lg:hidden inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-white hover:opacity-90 transition-opacity flex-shrink-0 mr-1"
              style={{ background: '#0A1628' }}
              aria-label="Open conversation history"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span className="font-inter font-semibold text-[13px] leading-none">Chats</span>
            </button>
            <span className="font-inter font-semibold text-[18px] leading-7">
              <span style={{ color: '#1E3A5F' }}>Jeet</span> <span style={{ color: '#E8B84B' }}>AI</span>
            </span>
            <span className="font-inter font-semibold text-[18px] leading-7" style={{ color: '#99A1AF' }}>-</span>
            <span className="font-inter font-semibold text-[18px] leading-7" style={{ color: '#6A7282' }}>Your UPSC Preparation Partner</span>
            <span className="font-inter font-semibold text-[11px] leading-4 px-2.5 py-1 rounded-full whitespace-nowrap" style={{ color: '#1E3A5F', background: 'rgba(30, 58, 95, 0.08)', border: '0.8px solid rgba(30, 58, 95, 0.14)' }}>UPSC Focused</span>
            <span className="font-inter font-semibold text-[11px] leading-4 px-2.5 py-1 rounded-full whitespace-nowrap" style={{ color: '#A66B00', background: 'rgba(232, 184, 75, 0.16)', border: '0.8px solid rgba(232, 184, 75, 0.28)' }}>NCERT Aligned</span>
          </div>
          <div className="font-inter text-[12px] leading-4" style={{ color: '#99A1AF' }}>Ask anything about UPSC preparation</div>
        </header>

        {queriesExhausted && !showChat ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-[672px] rounded-[24px] p-6 flex flex-col gap-5" style={{ borderTop: '0.8px solid #364153', background: 'linear-gradient(180deg, #0F1A2E 0%, #1A2942 100%)', boxShadow: '0px 25px 50px -12px rgba(0,0,0,0.25)' }}>
              <div className="flex items-center justify-between">
                <span className="font-inter font-bold text-[14px] uppercase tracking-[1.4px]" style={{ color: '#99A1AF' }}>Daily Queries</span>
                <span className="font-inter font-bold text-[48px] leading-[48px]">
                  <span style={{ color: '#E8B84B' }}>{DAILY_QUERY_LIMIT}</span>
                  <span style={{ color: '#99A1AF' }}>/{DAILY_QUERY_LIMIT} used</span>
                </span>
              </div>
              <div className="w-full h-3 rounded-full" style={{ background: 'linear-gradient(90deg, #FB2C36 0%, #FF6900 50%, #E7000B 100%)' }} />
              <p className="font-inter text-[14px] text-center" style={{ color: '#99A1AF' }}>Resets daily at midnight</p>
            </div>
          </div>
        ) : !showChat ? (
          /* Welcome screen */
          <div className="flex-1 flex flex-col items-center justify-start lg:justify-center px-4 md:px-6 py-4 overflow-y-auto">
            <Image src="/jeet-ai-icon.png" alt="Jeet AI" width={64} height={64} className="object-contain mb-3" />
            <h1 className="font-inter font-bold text-[24px] leading-8 text-center mb-2" style={{ color: '#101828' }}>
              Hi {user?.firstName || 'there'}, I&apos;m <span className="font-bold italic" style={{ color: '#1E3A5F' }}>Jeet</span> <span className="font-bold italic" style={{ color: '#E8B84B' }}>AI</span>.
            </h1>
            <p className="font-inter text-[14px] leading-5 text-center max-w-[561px] mb-2" style={{ color: '#4A5565' }}>
              I&apos;m your intelligent UPSC preparation partner – from ancient history to current affairs, revision strategy, or just thinking through a topic together.
            </p>
            <p className="font-inter text-[15px] leading-5 mb-5" style={{ color: '#99A1AF' }}>How can I help you today in your preparation?</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-[800px] w-full mb-5">
              {suggestionCards.map((card, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInputValue(card.prompt)}
                  className="group relative text-left p-4 rounded-[16px] transition-all duration-200 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 overflow-hidden"
                  style={{
                    border: `1.4px solid ${card.accent}`,
                    background: `linear-gradient(135deg, #FFFFFF 0%, ${card.accentSoft} 100%)`,
                    boxShadow: `0 14px 28px -20px ${card.shadow}, 0 8px 18px -16px rgba(15, 23, 42, 0.3), inset 4px 0 0 ${card.accent}`,
                    '--tw-ring-color': card.accent,
                  } as React.CSSProperties}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                    style={{ background: `linear-gradient(135deg, ${card.accentSoft} 0%, rgba(255,255,255,0) 58%)` }}
                  />
                  <div className="relative flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                      style={{ background: '#FFFFFF', border: `1px solid ${card.accent}`, boxShadow: `0 8px 18px -12px ${card.shadow}` }}
                    >
                      <Image src={card.iconSrc} alt={card.iconAlt} width={24} height={24} className="object-contain" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-inter font-bold text-[15px] leading-5 mb-1" style={{ color: '#101828' }}>{card.title}</h3>
                      <p className="font-inter font-semibold text-[12px] leading-4" style={{ color: '#6A7282' }}>{card.subtitle}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="w-full max-w-[968px]">
              <div className="flex items-center gap-3 px-4 py-3 rounded-[16px]" style={{ border: '0.8px solid #E5E7EB', background: '#F9FAFB' }}>
                <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Ask me anything about your preparation..." className="flex-1 bg-transparent font-inter text-[14px] outline-none" style={{ color: '#101828' }} disabled={isLoading} />
                <button type="submit" disabled={!inputValue.trim() || isLoading} className="w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0 disabled:opacity-50" style={{ background: '#1E3A5F' }}>
                  {isLoading ? <Spinner /> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>}
                </button>
              </div>
              {error && <p className="font-inter text-[12px] text-center mt-2" style={{ color: '#FB2C36' }}>{error}</p>}
              <p className="font-inter text-[11px] leading-4 text-center mt-2 italic" style={{ color: '#99A1AF' }}>
                Jeet AI can make mistakes. Verify important facts from NCERT &amp; official sources.
              </p>
            </form>
          </div>
        ) : (
          /* Chat view */
          <>
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 space-y-6">
              {messages.map((msg) =>
                msg.role === 'user' ? (
                  <div key={msg.id} className="flex flex-col items-end gap-1">
                    <div className="flex items-end gap-3 max-w-[720px]">
                      <div className="max-w-[672px] py-3 px-6 rounded-[24px] font-inter text-[14px] leading-5 text-white" style={{ background: '#0F1C2E' }}>{msg.content}</div>
                      <UserAvatar initials={initials} />
                    </div>
                    <span className="font-inter text-[12px]" style={{ color: '#99A1AF' }}>{formatTime(msg.createdAt)}</span>
                  </div>
                ) : (
                  <div key={msg.id} className="flex flex-col gap-1">
                    <div className="w-full max-w-[840px] rounded-[16px] p-6 border" style={{ border: '0.8px solid #E5E7EB', background: '#FFFFFF', boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1)' }}>
                      <div className="flex gap-3">
                        <JeetAIAvatar />
                        <div className="flex-1 min-w-0"><MarkdownRenderer content={msg.content} /></div>
                      </div>
                      <div className="flex justify-end mt-3">
                        <span className="font-inter text-[12px]" style={{ color: '#99A1AF' }}>{formatTime(msg.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                )
              )}

              {isLoading && (
                <div className="flex flex-col gap-1">
                  <div className="max-w-[840px] rounded-[16px] p-6 border" style={{ border: '0.8px solid #E5E7EB', background: '#FFFFFF' }}>
                    <div className="flex gap-3 items-center">
                      <JeetAIAvatar />
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#E8B84B', animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#E8B84B', animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#E8B84B', animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex justify-center">
                  <div className="rounded-[10px] px-4 py-2 font-inter text-[13px]" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }}>{error}</div>
                </div>
              )}

              {queriesUsed >= 5 && !proCardDismissed && (
                <div className="max-w-[896px] rounded-[24px] flex items-center justify-between gap-4 p-5" style={{ borderTop: '1.6px solid #FFD6A8', background: 'linear-gradient(90deg, #FFFBEB 0%, #FFF7ED 100%)', boxShadow: '0px 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  <div className="w-9 h-10 rounded-[14px] flex items-center justify-center flex-shrink-0 text-white text-lg" style={{ background: 'linear-gradient(135deg, #FF8904 0%, #FB2C36 100%)' }}>✨</div>
                  <p className="font-inter text-[14px] leading-5 flex-1 min-w-0" style={{ color: '#364153' }}>You&apos;re making great progress! <strong>Pro members</strong> get unlimited queries, saved notes, and priority answer evaluation.</p>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Link href="/dashboard/billing/plans">
                      <button type="button" className="font-inter font-bold text-[14px] text-white py-2.5 px-5 rounded-[14px] whitespace-nowrap" style={{ background: 'linear-gradient(90deg, #FF6900 0%, #FB2C36 100%)' }}>Explore Pro →</button>
                    </Link>
                    <button type="button" onClick={() => setProCardDismissed(true)} className="w-8 h-8 rounded-[10px] flex items-center justify-center hover:bg-gray-100" style={{ background: '#E5E7EB' }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 2l10 10M12 2L2 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="flex-shrink-0 pt-4 px-6 pb-6 border-t" style={{ borderTop: '0.8px solid #E5E7EB', background: '#FFFFFF' }}>
              <form onSubmit={handleSubmit} className="flex items-center gap-3 px-4 py-3.5 rounded-[16px]" style={{ border: '0.8px solid #E5E7EB', background: '#F9FAFB' }}>
                <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Ask Jeet AI anything about UPSC..." className="flex-1 bg-transparent font-inter text-[14px] outline-none min-w-0" style={{ color: '#101828' }} disabled={isLoading || queriesExhausted} />
                <button type="submit" disabled={!inputValue.trim() || isLoading || queriesExhausted} className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white flex-shrink-0 disabled:opacity-50" style={{ background: '#1E3A5F' }}>
                  {isLoading ? <Spinner /> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>}
                </button>
              </form>
            </div>
          </>
        )}
      </main>

      {/* ── Daily-limit Upgrade Modal (pastel, blurred backdrop) ── */}
      {showUpgradeModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 jeet-upgrade-overlay"
          style={{ background: 'rgba(224, 231, 255, 0.55)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
          onClick={() => setShowUpgradeModal(false)}
        >
          <div
            className="relative w-full max-w-[400px] jeet-upgrade-pop"
            style={{
              background: '#fff',
              borderRadius: '24px',
              padding: '36px 32px 28px',
              border: '1.5px solid rgba(201, 168, 76, 0.22)',
              boxShadow: '0 8px 40px rgba(27, 46, 107, 0.13), 0 1.5px 6px rgba(27,46,107,0.07)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              type="button"
              onClick={() => setShowUpgradeModal(false)}
              aria-label="Close popup"
              className="absolute flex items-center justify-center transition-colors"
              style={{ top: '14px', right: '14px', width: '28px', height: '28px', borderRadius: '50%', background: '#F1F4FB', color: '#8A96B4' }}
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 2l10 10M12 2L2 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>

            {/* Crown */}
            <div className="relative mx-auto flex items-center justify-center" style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'linear-gradient(135deg, #1B2E6B 0%, #2E4499 100%)', boxShadow: '0 4px 18px rgba(27,46,107,0.22)', marginBottom: '18px' }}>
              <div className="jeet-crown-glow" style={{ position: 'absolute', inset: '-3px', borderRadius: '21px', border: '1.5px solid rgba(245, 206, 110, 0.35)', pointerEvents: 'none' }} />
              <svg width="30" height="30" viewBox="0 0 24 24" fill="#F5CE6E" aria-hidden="true"><path d="M3 7.5l3.8 3 3.4-5.2a1 1 0 011.6 0l3.4 5.2 3.8-3a1 1 0 011.6.95l-1.7 9.3a1 1 0 01-1 .82H5.1a1 1 0 01-1-.82L2.4 8.45A1 1 0 013 7.5z" /></svg>
            </div>

            {/* Badge */}
            <div className="flex justify-center" style={{ marginBottom: '14px' }}>
              <div className="inline-flex items-center uppercase" style={{ gap: '5px', background: '#FEF4D8', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '99px', padding: '4px 12px', fontSize: '11px', fontWeight: 600, color: '#9A7020', letterSpacing: '0.05em' }}>
                <span className="jeet-badge-dot" style={{ width: '5px', height: '5px', background: '#C9A84C', borderRadius: '50%' }} /> Limit reached
              </div>
            </div>

            {/* Title */}
            <h2 className="text-center" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 700, color: '#0E1D54', lineHeight: 1.3, margin: '0 0 8px' }}>
              You&apos;ve hit <span style={{ color: '#C9A84C' }}>{DAILY_QUERY_LIMIT} / {DAILY_QUERY_LIMIT}</span><br />queries today!
            </h2>
            <p className="text-center" style={{ fontSize: '13px', color: '#6B7899', lineHeight: 1.6, margin: '0 0 22px' }}>
              Your free quota is up. Upgrade to <strong style={{ color: '#0E1D54' }}>Jeet Pro</strong> and prep without limits — every day, all day.
            </p>

            {/* Progress */}
            <div className="flex justify-between items-center" style={{ marginBottom: '7px' }}>
              <span style={{ fontSize: '12px', color: '#8A96B4', fontWeight: 500 }}>Daily queries</span>
              <strong style={{ fontSize: '12px', fontWeight: 700, color: '#C05A2A' }}>{DAILY_QUERY_LIMIT} / {DAILY_QUERY_LIMIT} used</strong>
            </div>
            <div style={{ height: '7px', background: '#EEF2FF', borderRadius: '99px', overflow: 'hidden', marginBottom: '22px' }}>
              <div className="jeet-prog-fill" style={{ height: '100%', background: 'linear-gradient(90deg, #E05A28 0%, #C9A84C 100%)', borderRadius: '99px', width: '100%' }} />
            </div>

            {/* Perks 2x2 */}
            <div className="grid grid-cols-2" style={{ gap: '9px', marginBottom: '22px' }}>
              {[
                { bg: '#E8EEFF', color: '#1B2E6B', title: 'Unlimited queries', sub: 'Zero daily cap', icon: <path d="M5 12a3 3 0 013-3c1.6 0 2.7 1.1 4 2.5s2.4 2.5 4 2.5a3 3 0 100-6c-1.6 0-2.7 1.1-4 2.5s-2.4 2.5-4 2.5a3 3 0 100 6c1.6 0 2.7-1.1 4-2.5" /> },
                { bg: '#FEF4D8', color: '#B8860B', title: 'Saved notes', sub: 'Revisit anytime', icon: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 3v18M5 8h4M5 12h4M5 16h4" /></> },
                { bg: '#E2F4F1', color: '#0E7A6A', title: 'Priority answers', sub: 'Faster & richer', icon: <path d="M13 2L5 13h5l-1 9 9-12h-6l1-8z" strokeLinejoin="round" /> },
                { bg: '#FDE8EE', color: '#BE2B57', title: 'Answer grading', sub: 'Score your Mains', icon: <><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4a2 2 0 012-2h2a2 2 0 012 2" /><path d="M8.5 12.5l1.5 1.5 3-3" /></> },
              ].map((p) => (
                <div key={p.title} className="flex items-start" style={{ gap: '9px', background: '#F7F9FF', border: '1px solid #E4E9F7', borderRadius: '14px', padding: '12px 11px' }}>
                  <div className="flex items-center justify-center flex-shrink-0" style={{ width: '30px', height: '30px', borderRadius: '9px', background: p.bg, color: p.color }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">{p.icon}</svg>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#1B2E6B', lineHeight: 1.3 }}>{p.title}</p>
                    <span style={{ fontSize: '11px', color: '#8A96B4' }}>{p.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ height: '1px', background: '#EEF2FF', margin: '0 0 18px' }} />

            {/* CTA */}
            <Link href="/dashboard/billing/plans" className="block">
              <button type="button" className="w-full jeet-btn-pro flex items-center justify-center" style={{ padding: '14px', background: 'linear-gradient(135deg, #1B2E6B 0%, #2E4499 100%)', border: 'none', borderRadius: '14px', fontSize: '14px', fontWeight: 700, color: '#fff', gap: '8px', letterSpacing: '0.02em', marginBottom: '9px', boxShadow: '0 4px 16px rgba(27,46,107,0.25)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#F5CE6E" aria-hidden="true"><path d="M3 7.5l3.8 3 3.4-5.2a1 1 0 011.6 0l3.4 5.2 3.8-3a1 1 0 011.6.95l-1.7 9.3a1 1 0 01-1 .82H5.1a1 1 0 01-1-.82L2.4 8.45A1 1 0 013 7.5z" /></svg>
                Upgrade to Pro &nbsp;→
              </button>
            </Link>
            <button type="button" onClick={() => setShowUpgradeModal(false)} className="w-full transition-colors" style={{ padding: '11px', background: 'transparent', border: '1px solid #E4E9F7', borderRadius: '14px', fontSize: '13px', fontWeight: 500, color: '#8A96B4' }}>
              Maybe tomorrow
            </button>

            <p className="flex items-center justify-center" style={{ textAlign: 'center', fontSize: '10.5px', color: '#B0BCDA', marginTop: '12px', gap: '4px' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>
              Secure payment &nbsp;·&nbsp; Cancel anytime
            </p>
          </div>

          <style jsx>{`
            @keyframes jeetPopIn { from { opacity: 0; transform: scale(0.88) translateY(16px); } to { opacity: 1; transform: scale(1) translateY(0); } }
            @keyframes jeetOverlayIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes jeetGlowPulse { 0%,100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 1; transform: scale(1.04); } }
            @keyframes jeetBadgePulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
            @keyframes jeetFill { from { width: 0%; } to { width: 100%; } }
            .jeet-upgrade-overlay { animation: jeetOverlayIn 0.25s ease both; }
            .jeet-upgrade-pop { animation: jeetPopIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
            .jeet-crown-glow { animation: jeetGlowPulse 2.2s ease-in-out infinite; }
            .jeet-badge-dot { animation: jeetBadgePulse 1.4s infinite; }
            .jeet-prog-fill { animation: jeetFill 0.7s ease 0.3s both; }
            .jeet-btn-pro { transition: opacity 0.18s, transform 0.1s; }
            .jeet-btn-pro:hover { opacity: 0.92; }
            .jeet-btn-pro:active { transform: scale(0.98); }
          `}</style>
        </div>
      )}
    </div>
  );
}

/* ── Sidebar conversation item ── */
function ConvItem({ item, active, onClick, onDelete }: { item: ConversationSummary; active: boolean; onClick: () => void; onDelete: (e: React.MouseEvent) => void; }) {
  return (
    <div role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => e.key === 'Enter' && onClick()} className="group flex items-center gap-2 py-2 px-3 rounded-[10px] mb-1 cursor-pointer hover:bg-white/5 transition-colors" style={active ? { background: 'rgba(255,255,255,0.1)' } : {}}>
      <span className="font-inter text-[12px] leading-4 flex-1 truncate" style={{ color: '#D1D5DC' }}>{item.title}</span>
      <button type="button" onClick={onDelete} className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-opacity hover:bg-white/10" title="Delete">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#99A1AF" strokeWidth="1.5"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" strokeLinecap="round" /></svg>
      </button>
    </div>
  );
}
