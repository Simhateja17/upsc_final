'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/contexts/AuthContext';
import { jeetAIService } from '@/lib/services';

/* ── Spinner ── */
const Spinner = () => (
  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
  </svg>
);

/* ── Suggestion cards (matches design) ── */
const suggestionCards = [
  {
    bar: '#6366f1',
    icon: '📖',
    title: 'Explain a UPSC topic',
    desc: 'Deep explanation with dimensions, UPSC angle & related PYQs',
    prompt: 'Explain a UPSC topic in depth with dimensions, UPSC angle and related questions',
  },
  {
    bar: '#f59e0b',
    icon: '⚖️',
    title: 'Ethics case study',
    desc: 'Real-world scenarios + how to frame and structure your answer',
    prompt: 'Give me an Ethics case study I should know for UPSC Mains with how to frame my answer',
  },
  {
    bar: '#22c55e',
    icon: '🗓️',
    title: 'Build my study plan',
    desc: 'Personalised schedule based on exam date & syllabus gaps',
    prompt: 'Build me a personalised study plan based on my exam date and syllabus gaps',
  },
  {
    bar: '#ef4444',
    icon: '🎯',
    title: 'Study strategy',
    desc: 'Personalised roadmap, daily schedule + topic prioritisation',
    prompt: 'Give me a study strategy and prioritisation roadmap for all UPSC topics',
  },
];

const topicChips = [
  { label: 'Federalism', prompt: 'Explain federalism in India' },
  { label: 'Preamble', prompt: 'What is the Preamble significance?' },
  { label: 'Current Affairs', prompt: 'Summarise current affairs for this week' },
  { label: 'DPSP vs FR', prompt: 'Explain Directive Principles vs Fundamental Rights' },
  { label: 'Answer writing', prompt: 'How to write a good UPSC answer?' },
  { label: 'Economic Survey', prompt: 'Explain the economic survey key points' },
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
          <h1 className="font-bold text-[18px] leading-7 mt-4 mb-2" style={{ color: '#1a1d23' }}>{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="font-bold text-[16px] leading-6 mt-4 mb-2" style={{ color: '#1a1d23' }}>{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="font-bold text-[14px] leading-6 mt-3 mb-1" style={{ color: '#1a1d23' }}>{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="font-bold text-[13px] leading-5 mt-3 mb-1" style={{ color: '#1a1d23' }}>{children}</h4>
        ),
        p: ({ children }) => (
          <p className="text-[13px] leading-6 mb-2" style={{ color: '#374151' }}>{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-5 space-y-1 mb-2">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-5 space-y-1 mb-2">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-[13px] leading-6" style={{ color: '#374151' }}>{children}</li>
        ),
        strong: ({ children }) => (
          <strong style={{ color: '#1a1d23' }}>{children}</strong>
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
              className="px-1.5 py-0.5 rounded text-[12px]"
              style={{ background: '#eef2f5', color: '#1447E6', fontFamily: 'monospace' }}
              {...props}
            >
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre
            className="rounded-lg p-3 mb-2 overflow-x-auto text-[12px] leading-5"
            style={{ background: '#1E293B', color: '#E2E8F0', fontFamily: 'monospace' }}
          >
            {children}
          </pre>
        ),
        blockquote: ({ children }) => (
          <blockquote
            className="pl-3 mb-2 italic"
            style={{ borderLeft: '3px solid #f0a500', color: '#4A5565' }}
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
        hr: () => <hr className="my-3" style={{ borderColor: '#E5E7EB' }} />,
        table: ({ children }) => (
          <div className="overflow-x-auto mb-2">
            <table className="w-full border-collapse text-[12px]" style={{ border: '1px solid #E5E7EB' }}>
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => <thead>{children}</thead>,
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => <tr>{children}</tr>,
        th: ({ children }) => (
          <th
            className="font-semibold text-left px-3 py-2"
            style={{ background: '#F9FAFB', color: '#1a1d23', border: '1px solid #E5E7EB' }}
          >
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td
            className="px-3 py-2"
            style={{ color: '#374151', border: '1px solid #E5E7EB' }}
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

/* ── Icons ── */
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
);
const IconSend = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
);
const IconPaperclip = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
);
const IconMic = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0M12 17v4" /></svg>
);
const IconChat = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
);
const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></svg>
);
const IconBook = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5z" /><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /></svg>
);

/* ══════════════════════════════════════════════════════════════════════════ */
export default function JeetGPTPage() {
  const { user } = useAuth();
  const [historyOpen, setHistoryOpen] = useState(false);

  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [queriesUsed, setQueriesUsed] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [conversations, setConversations] = useState<GroupedConversations>({
    today: [],
    yesterday: [],
    earlier: [],
  });
  const [sidebarLoading, setSidebarLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 80) + 'px';
  }, []);

  useEffect(() => {
    autoResize();
  }, [inputValue, autoResize]);

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
    setShowUpgradeModal(false);
    setHistoryOpen(false);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const queriesExhausted = queriesUsed >= DAILY_QUERY_LIMIT;
  const showChat = messages.length > 0;
  const displayName = user
    ? ((user.firstName ?? '') + (user.firstName && user.lastName ? ' ' : '') + (user.lastName ?? '')).trim() || user.email
    : 'Loading...';
  const initials = getInitials(user?.firstName, user?.lastName, user?.email);
  const userPlan = user?.role === 'admin' ? 'Admin' : 'Free plan';
  const canSend = inputValue.trim().length > 0 && !isLoading && !queriesExhausted;
  const fillPct = Math.round((queriesUsed / DAILY_QUERY_LIMIT) * 100);

  const allConvos: { label: string; items: ConversationSummary[] }[] = [
    { label: 'Today', items: conversations.today },
    { label: 'Yesterday', items: conversations.yesterday },
    { label: 'Earlier', items: conversations.earlier },
  ].filter((g) => g.items.length > 0);
  const hasConversations = allConvos.length > 0;

  return (
    <div className="jai-layout">
      {/* ── Mobile drawer backdrop ── */}
      {historyOpen && <div className="jai-backdrop" onClick={() => setHistoryOpen(false)} />}

      {/* ── Sidebar ── */}
      <aside className={`jai-sidebar${historyOpen ? ' open' : ''}`}>
        <div className="jai-sidebar-top">
          <button type="button" className="jai-new-btn" onClick={startNewConversation}>
            <IconPlus /> New Conversation
          </button>
        </div>

        <div className="jai-convo-list">
          {sidebarLoading ? (
            <div className="jai-empty-convo" style={{ color: 'rgba(255,255,255,0.4)' }}><Spinner /></div>
          ) : !hasConversations ? (
            <div className="jai-empty-convo">
              <div className="jai-empty-convo-ic"><IconChat size={32} /></div>
              <div className="jai-empty-convo-title">No chats yet</div>
              <div className="jai-empty-convo-sub">Start a conversation and your history will appear here.</div>
            </div>
          ) : (
            allConvos.map((group) => (
              <div key={group.label}>
                <div className="jai-section-label">{group.label}</div>
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => loadConversation(item.id)}
                    onKeyDown={(e) => e.key === 'Enter' && loadConversation(item.id)}
                    className={`jai-convo-item${activeConversationId === item.id ? ' active' : ''}`}
                  >
                    <div className="jai-convo-name">{item.title}</div>
                    <div className="jai-convo-meta">{formatTime(item.updatedAt)}</div>
                    <button type="button" className="jai-convo-del" title="Delete" onClick={(e) => deleteConversation(item.id, e)}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#8b949e" strokeWidth="1.6"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" strokeLinecap="round" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        <div className="jai-sidebar-bottom">
          <div className="jai-query-wrap">
            <div className="jai-query-top">
              <span className="jai-query-label">Daily queries used</span>
              <span className="jai-query-count">{queriesUsed} / {DAILY_QUERY_LIMIT}</span>
            </div>
            <div className="jai-query-bar">
              <div className="jai-query-fill" style={{ width: fillPct + '%' }} />
            </div>
          </div>
          <Link href="/dashboard/profile" className="jai-user-row">
            <div className="jai-user-av">{initials}</div>
            <div className="jai-user-info">
              <div className="jai-user-name">{displayName}</div>
              <div className="jai-user-plan">
                {userPlan}
                {user?.role !== 'admin' && <> · <span className="jai-upgrade-link">Upgrade ↗</span></>}
              </div>
            </div>
          </Link>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="jai-main">
        <div className="jai-main-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button type="button" className="jai-menu-btn" onClick={() => setHistoryOpen(true)} aria-label="Open chats">
              <IconChat size={15} /> Chats
            </button>
            <div style={{ minWidth: 0 }}>
              <div className="jai-main-title">Jeet <span>AI</span> — Your UPSC Partner</div>
              <div className="jai-main-sub">Ask anything about your preparation</div>
            </div>
          </div>
          <div className="jai-badges">
            <div className="jai-badge green"><IconCheck /> UPSC-focused</div>
            <div className="jai-badge blue"><IconBook /> NCERT aligned</div>
          </div>
        </div>

        <div className="jai-chat-area">
          {!showChat ? (
            <div className="jai-welcome">
              <div className="jai-ai-avatar">JA</div>
              <div className="jai-welcome-title">Hi {user?.firstName || 'there'}, I&apos;m <span>Jeet AI.</span></div>
              <div className="jai-welcome-sub">Your intelligent UPSC preparation partner — from Ancient History to Current Affairs, revision strategy, ethics case studies, or just thinking through a tough concept together.</div>

              <div className="jai-prompt-cards">
                {suggestionCards.map((card) => (
                  <button
                    key={card.title}
                    type="button"
                    className="jai-pcard"
                    onClick={() => { setInputValue(card.prompt); textareaRef.current?.focus(); }}
                  >
                    <div className="jai-pcard-bar" style={{ background: card.bar }} />
                    <div className="jai-pcard-icon">{card.icon}</div>
                    <div className="jai-pcard-title">{card.title}</div>
                    <div className="jai-pcard-desc">{card.desc}</div>
                  </button>
                ))}
              </div>

              <div className="jai-chips">
                {topicChips.map((chip) => (
                  <button key={chip.label} type="button" className="jai-chip" onClick={() => { setInputValue(chip.prompt); textareaRef.current?.focus(); }}>
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {messages.map((msg) =>
                msg.role === 'user' ? (
                  <div key={msg.id} className="jai-msg-user">
                    <div className="jai-msg-user-bubble">{msg.content}</div>
                  </div>
                ) : (
                  <div key={msg.id} className="jai-msg-ai">
                    <div className="jai-msg-ai-av">JA</div>
                    <div className="jai-msg-ai-bubble">
                      <div className="jai-msg-ai-head">
                        <span className="jai-msg-ai-name">Jeet AI</span>
                        <span className="jai-msg-ai-time">{formatTime(msg.createdAt)}</span>
                      </div>
                      <MarkdownRenderer content={msg.content} />
                    </div>
                  </div>
                )
              )}

              {isLoading && (
                <div className="jai-msg-ai">
                  <div className="jai-msg-ai-av">JA</div>
                  <div className="jai-msg-ai-bubble">
                    <div className="jai-typing"><span /><span /><span /></div>
                  </div>
                </div>
              )}

              {error && (
                <div className="jai-msg-ai">
                  <div className="jai-msg-ai-bubble" style={{ background: '#FEF2F2', border: '0.5px solid #FCA5A5', color: '#DC2626' }}>{error}</div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="jai-input-wrap">
          <form className="jai-input-row" onSubmit={handleSubmit}>
            <textarea
              ref={textareaRef}
              rows={1}
              className="jai-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={queriesExhausted ? 'Daily limit reached — upgrade for unlimited queries' : 'Ask me anything about your preparation…'}
              disabled={isLoading || queriesExhausted}
            />
            <div className="jai-input-actions">
              <div className="jai-action-btn" title="Attach file"><IconPaperclip /></div>
              <div className="jai-action-btn" title="Voice input"><IconMic /></div>
              <button type="submit" className={`jai-send-btn${canSend ? ' active' : ''}`} disabled={!canSend}>
                {isLoading ? <Spinner /> : <IconSend />}
              </button>
            </div>
          </form>
          <div className="jai-disclaimer">Jeet AI may make mistakes. Always verify important facts from <span>NCERT &amp; official sources</span>.</div>
        </div>
      </div>

      {/* ── Daily-limit Upgrade Modal ── */}
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
            <button
              type="button"
              onClick={() => setShowUpgradeModal(false)}
              aria-label="Close popup"
              className="absolute flex items-center justify-center transition-colors"
              style={{ top: '14px', right: '14px', width: '28px', height: '28px', borderRadius: '50%', background: '#F1F4FB', color: '#8A96B4' }}
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 2l10 10M12 2L2 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>

            <div className="relative mx-auto flex items-center justify-center" style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'linear-gradient(135deg, #1B2E6B 0%, #2E4499 100%)', boxShadow: '0 4px 18px rgba(27,46,107,0.22)', marginBottom: '18px' }}>
              <div className="jeet-crown-glow" style={{ position: 'absolute', inset: '-3px', borderRadius: '21px', border: '1.5px solid rgba(245, 206, 110, 0.35)', pointerEvents: 'none' }} />
              <svg width="30" height="30" viewBox="0 0 24 24" fill="#F5CE6E" aria-hidden="true"><path d="M3 7.5l3.8 3 3.4-5.2a1 1 0 011.6 0l3.4 5.2 3.8-3a1 1 0 011.6.95l-1.7 9.3a1 1 0 01-1 .82H5.1a1 1 0 01-1-.82L2.4 8.45A1 1 0 013 7.5z" /></svg>
            </div>

            <div className="flex justify-center" style={{ marginBottom: '14px' }}>
              <div className="inline-flex items-center uppercase" style={{ gap: '5px', background: '#FEF4D8', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '99px', padding: '4px 12px', fontSize: '11px', fontWeight: 600, color: '#9A7020', letterSpacing: '0.05em' }}>
                <span className="jeet-badge-dot" style={{ width: '5px', height: '5px', background: '#C9A84C', borderRadius: '50%' }} /> Limit reached
              </div>
            </div>

            <h2 className="text-center" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 700, color: '#0E1D54', lineHeight: 1.3, margin: '0 0 8px' }}>
              You&apos;ve hit <span style={{ color: '#C9A84C' }}>{DAILY_QUERY_LIMIT} / {DAILY_QUERY_LIMIT}</span><br />queries today!
            </h2>
            <p className="text-center" style={{ fontSize: '13px', color: '#6B7899', lineHeight: 1.6, margin: '0 0 22px' }}>
              Your free quota is up. Upgrade to <strong style={{ color: '#0E1D54' }}>Jeet Pro</strong> and prep without limits — every day, all day.
            </p>

            <div className="flex justify-between items-center" style={{ marginBottom: '7px' }}>
              <span style={{ fontSize: '12px', color: '#8A96B4', fontWeight: 500 }}>Daily queries</span>
              <strong style={{ fontSize: '12px', fontWeight: 700, color: '#C05A2A' }}>{DAILY_QUERY_LIMIT} / {DAILY_QUERY_LIMIT} used</strong>
            </div>
            <div style={{ height: '7px', background: '#EEF2FF', borderRadius: '99px', overflow: 'hidden', marginBottom: '22px' }}>
              <div className="jeet-prog-fill" style={{ height: '100%', background: 'linear-gradient(90deg, #E05A28 0%, #C9A84C 100%)', borderRadius: '99px', width: '100%' }} />
            </div>

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
        </div>
      )}

      <style jsx global>{`
        .jai-layout{display:flex;height:100%;overflow:hidden;font-family:var(--font-dm-sans),sans-serif;background:#0d1117;color:#e6edf3;position:relative;}
        .jai-backdrop{position:fixed;inset:0;z-index:30;background:rgba(0,0,0,0.45);}

        .jai-sidebar{width:220px;background:#0d1117;border-right:0.5px solid #21262d;display:flex;flex-direction:column;flex-shrink:0;}
        .jai-sidebar-top{padding:12px;}
        .jai-new-btn{width:100%;padding:10px;border-radius:10px;background:linear-gradient(135deg,#f0a500,#d97706);color:#0d1117;font-family:var(--font-sora),sans-serif;font-size:12px;font-weight:700;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:filter .15s;}
        .jai-new-btn:hover{filter:brightness(1.06);}
        .jai-section-label{font-size:10px;color:#6e7681;letter-spacing:1px;text-transform:uppercase;padding:12px 12px 6px;}
        .jai-convo-list{flex:1;overflow-y:auto;padding:0 8px;}
        .jai-convo-item{position:relative;padding:9px 10px;border-radius:8px;cursor:pointer;margin-bottom:2px;transition:background .15s;}
        .jai-convo-item:hover{background:#161b22;}
        .jai-convo-item.active{background:#1c2128;}
        .jai-convo-name{font-size:12px;color:#c9d1d9;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:18px;}
        .jai-convo-meta{font-size:10px;color:#6e7681;margin-top:2px;}
        .jai-convo-del{position:absolute;top:8px;right:8px;opacity:0;width:18px;height:18px;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:4px;transition:opacity .15s,background .15s;}
        .jai-convo-item:hover .jai-convo-del{opacity:1;}
        .jai-convo-del:hover{background:rgba(255,255,255,.08);}
        .jai-empty-convo{padding:24px 16px;text-align:center;}
        .jai-empty-convo-ic{color:#30363d;margin-bottom:10px;display:flex;justify-content:center;}
        .jai-empty-convo-title{font-size:12px;color:#6e7681;margin-bottom:4px;font-weight:500;}
        .jai-empty-convo-sub{font-size:11px;color:#484f58;line-height:1.5;}
        .jai-sidebar-bottom{border-top:0.5px solid #21262d;padding:12px;}
        .jai-query-wrap{background:#161b22;border-radius:8px;padding:10px 12px;}
        .jai-query-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}
        .jai-query-label{font-size:11px;color:#8b949e;}
        .jai-query-count{font-size:11px;font-weight:600;color:#f0a500;}
        .jai-query-bar{height:4px;background:#21262d;border-radius:4px;overflow:hidden;}
        .jai-query-fill{height:100%;background:linear-gradient(90deg,#f0a500,#e8820c);border-radius:4px;transition:width .3s;}
        .jai-user-row{display:flex;align-items:center;gap:8px;margin-top:10px;text-decoration:none;padding:4px;border-radius:8px;transition:background .15s;}
        .jai-user-row:hover{background:#161b22;}
        .jai-user-av{width:28px;height:28px;border-radius:50%;background:#f0a500;display:flex;align-items:center;justify-content:center;font-family:var(--font-sora),sans-serif;font-weight:700;font-size:11px;color:#0d1117;flex-shrink:0;}
        .jai-user-info{flex:1;min-width:0;}
        .jai-user-name{font-size:12px;color:#c9d1d9;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .jai-user-plan{font-size:10px;color:#6e7681;}
        .jai-upgrade-link{color:#f0a500;font-weight:500;}

        .jai-main{flex:1;min-width:0;display:flex;flex-direction:column;background:#fff;overflow:hidden;}
        .jai-main-header{padding:14px 20px 12px;border-bottom:0.5px solid #f1f3f5;display:flex;align-items:center;justify-content:space-between;gap:12px;}
        .jai-main-title{font-family:var(--font-sora),sans-serif;font-size:15px;font-weight:700;color:#1a1d23;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .jai-main-title span{color:#f0a500;}
        .jai-main-sub{font-size:11px;color:#9ca3af;margin-top:1px;}
        .jai-badges{display:flex;gap:6px;flex-shrink:0;}
        .jai-badge{display:flex;align-items:center;gap:4px;font-size:10px;padding:3px 8px;border-radius:10px;font-weight:500;white-space:nowrap;}
        .jai-badge.green{background:#f0fdf4;color:#16a34a;border:0.5px solid #bbf7d0;}
        .jai-badge.blue{background:#eff6ff;color:#1d4ed8;border:0.5px solid #bfdbfe;}

        .jai-chat-area{flex:1;overflow-y:auto;padding:24px 32px 16px;}
        .jai-welcome{text-align:center;max-width:480px;margin:0 auto;}
        .jai-ai-avatar{width:60px;height:60px;border-radius:16px;background:linear-gradient(135deg,#667eea,#764ba2,#f093fb);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-family:var(--font-sora),sans-serif;font-weight:800;font-size:18px;color:#fff;letter-spacing:-0.5px;}
        .jai-welcome-title{font-family:var(--font-sora),sans-serif;font-size:20px;font-weight:700;color:#1a1d23;margin-bottom:8px;}
        .jai-welcome-title span{color:#f0a500;}
        .jai-welcome-sub{font-size:13px;color:#6b7280;line-height:1.6;margin-bottom:20px;}

        .jai-prompt-cards{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;text-align:left;}
        .jai-pcard{border:0.5px solid #e2e5ed;border-radius:12px;padding:14px;cursor:pointer;transition:all .18s;background:#fafafa;position:relative;overflow:hidden;text-align:left;font-family:inherit;}
        .jai-pcard-bar{position:absolute;top:0;left:0;width:3px;height:100%;border-radius:2px 0 0 2px;}
        .jai-pcard:hover{border-color:#c7d0de;background:#fff;transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,0.06);}
        .jai-pcard-icon{font-size:18px;margin-bottom:7px;}
        .jai-pcard-title{font-size:13px;font-weight:600;color:#1a1d23;margin-bottom:3px;font-family:var(--font-sora),sans-serif;}
        .jai-pcard-desc{font-size:11px;color:#9ca3af;line-height:1.4;}

        .jai-chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;}
        .jai-chip{padding:5px 12px;border-radius:20px;border:0.5px solid #e2e5ed;font-size:11px;color:#6b7280;cursor:pointer;background:#fff;transition:all .15s;font-weight:500;font-family:inherit;}
        .jai-chip:hover{border-color:#f0a500;color:#b07a00;background:#fffbf0;}

        .jai-input-wrap{padding:14px 20px;border-top:0.5px solid #f1f3f5;background:#fff;flex-shrink:0;}
        .jai-input-row{display:flex;align-items:flex-end;gap:10px;background:#f8f9fa;border:1px solid #e2e5ed;border-radius:14px;padding:10px 14px;transition:border .2s,background .2s;}
        .jai-input-row:focus-within{border-color:#f0a500;background:#fff;}
        .jai-input{flex:1;border:none;background:transparent;font-size:13px;font-family:var(--font-dm-sans),sans-serif;color:#1a1d23;resize:none;outline:none;line-height:1.5;max-height:80px;}
        .jai-input::placeholder{color:#9ca3af;}
        .jai-input:disabled{cursor:not-allowed;}
        .jai-input-actions{display:flex;align-items:center;gap:6px;flex-shrink:0;}
        .jai-action-btn{width:30px;height:30px;border-radius:8px;border:0.5px solid #e2e5ed;background:#fff;color:#6b7280;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;}
        .jai-action-btn:hover{border-color:#374151;color:#1a1d23;}
        .jai-send-btn{width:34px;height:34px;border-radius:10px;background:#1a1d23;color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s;flex-shrink:0;}
        .jai-send-btn:hover:not(:disabled){background:#374151;}
        .jai-send-btn.active{background:#f0a500;}
        .jai-send-btn:disabled{opacity:.5;cursor:default;}
        .jai-disclaimer{text-align:center;font-size:10px;color:#c9cfd8;margin-top:8px;}
        .jai-disclaimer span{color:#f0a500;font-weight:500;}

        .jai-msg-user{display:flex;justify-content:flex-end;margin-bottom:14px;}
        .jai-msg-user-bubble{max-width:70%;background:#1a1d23;color:#e6edf3;padding:10px 14px;border-radius:12px 12px 2px 12px;font-size:13px;line-height:1.5;white-space:pre-wrap;word-break:break-word;}
        .jai-msg-ai{display:flex;gap:8px;margin-bottom:14px;align-items:flex-start;}
        .jai-msg-ai-av{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0;font-family:var(--font-sora),sans-serif;}
        .jai-msg-ai-bubble{background:#f8f9fa;border:0.5px solid #e2e5ed;padding:10px 14px;border-radius:2px 12px 12px 12px;font-size:13px;color:#374151;line-height:1.6;max-width:75%;overflow-x:auto;}
        .jai-msg-ai-head{display:flex;align-items:center;gap:6px;margin-bottom:4px;}
        .jai-msg-ai-name{font-size:11px;font-weight:600;color:#6366f1;font-family:var(--font-sora),sans-serif;}
        .jai-msg-ai-time{font-size:10px;color:#9ca3af;}
        .jai-typing{display:flex;gap:4px;padding:5px 2px;}
        .jai-typing span{width:7px;height:7px;border-radius:50%;background:#c7c9d1;animation:jaiBounce 1.2s infinite;}
        .jai-typing span:nth-child(2){animation-delay:.15s;}
        .jai-typing span:nth-child(3){animation-delay:.3s;}
        @keyframes jaiBounce{0%,60%,100%{transform:translateY(0);opacity:.5;}30%{transform:translateY(-5px);opacity:1;}}

        .jai-menu-btn{display:none;}

        @media(max-width:1023px){
          .jai-sidebar{position:fixed;left:0;top:clamp(56px,5.78vw,111px);bottom:0;z-index:40;width:240px;max-width:85vw;transform:translateX(-100%);transition:transform .2s;}
          .jai-sidebar.open{transform:translateX(0);box-shadow:0 12px 40px rgba(0,0,0,.4);}
          .jai-chat-area{padding:20px 16px 12px;}
          .jai-main-header{padding:12px 14px;}
          .jai-input-wrap{padding:12px 14px;}
          .jai-prompt-cards{grid-template-columns:1fr;}
          .jai-menu-btn{display:flex;align-items:center;gap:6px;height:34px;padding:0 11px;border-radius:8px;background:#0d1117;color:#fff;border:none;cursor:pointer;font-size:12px;font-weight:600;font-family:var(--font-sora),sans-serif;flex-shrink:0;}
        }

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
  );
}
