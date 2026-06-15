'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StarIcon, TrashIcon, ExternalLinkIcon, CheckIcon, XIcon, DotIcon } from '@/components/icons/BookmarkIcons';

export interface BookmarkItem {
  id: string;
  type: string;
  entityId: string;
  title: string;
  source: string;
  sourceUrl?: string | null;
  tag?: string | null;
  tagColor?: string | null;
  content?: any;
  createdAt: string;
  isPinned: boolean;
}

type Props = {
  item: BookmarkItem;
  index?: number;
  onTogglePin?: (item: BookmarkItem) => void;
  onDelete: (item: BookmarkItem) => void;
};

const ACCENT_COLORS = ['#3B82F6', '#EF4444', '#8B5CF6', '#10B981', '#F59E0B', '#0EA5E9'];

function accentColor(index?: number): string {
  if (index === undefined) return '#E8EDF5';
  return ACCENT_COLORS[index % ACCENT_COLORS.length];
}

const DIFFICULTY_STYLES: Record<string, { bg: string; border: string; color: string }> = {
  easy: { bg: 'rgba(29,164,92,0.1)', border: 'rgba(29,164,92,0.25)', color: '#1DA45C' },
  medium: { bg: 'rgba(232,184,75,0.12)', border: 'rgba(232,184,75,0.3)', color: '#C99730' },
  hard: { bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.18)', color: '#DC2626' },
};

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const style = DIFFICULTY_STYLES[difficulty.toLowerCase()] || { bg: 'rgba(11,22,40,0.04)', border: 'rgba(11,22,40,0.09)', color: '#6B7A99' };
  return (
    <span
      className="rounded-[4px] border px-[9px] py-[3px] text-[9px] font-extrabold uppercase tracking-[0.36px]"
      style={{ background: style.bg, borderColor: style.border, color: style.color }}
    >
      {difficulty}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      className="rounded-full border px-[10px] py-[4px] text-[9px] font-extrabold uppercase tracking-[0.45px]"
      style={{ background: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.22)', color: '#6366F1' }}
    >
      {category}
    </span>
  );
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string; icon?: 'check' | 'x' | 'dot' }> = {
  new: { bg: '#FEE2E2', color: '#DC2626', label: 'New', icon: 'dot' },
  attempted: { bg: '#DCFCE7', color: '#15803D', label: 'Attempted', icon: 'check' },
  gotwrong: { bg: '#FEE2E2', color: '#DC2626', label: 'Got Wrong', icon: 'x' },
  notattempted: { bg: '#F3F4F6', color: '#6B7280', label: 'Not Attempted' },
  draft: { bg: '#FEF3C7', color: '#92400E', label: 'Draft' },
  submitted: { bg: '#DCFCE7', color: '#166534', label: 'Submitted', icon: 'check' },
  prelims: { bg: '#EFF6FF', color: '#1D4ED8', label: 'Prelims' },
  mains: { bg: '#FDF4FF', color: '#A21CAF', label: 'Mains' },
  learning: { bg: '#FEF3C7', color: '#92400E', label: 'Learning' },
  mastered: { bg: '#DCFCE7', color: '#166534', label: 'Mastered', icon: 'check' },
  notwatched: { bg: '#F3F4F6', color: '#6B7280', label: 'Not Watched' },
  watching: { bg: '#FEF3C7', color: '#92400E', label: 'Watching' },
  watched: { bg: '#DCFCE7', color: '#166534', label: 'Watched', icon: 'check' },
};

function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return null;
  const key = status.toLowerCase().replace(/\s+/g, '');
  const style = STATUS_STYLES[key];
  if (!style) return null;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: style.bg, color: style.color }}
    >
      {style.icon === 'check' && <CheckIcon size={12} />}
      {style.icon === 'x' && <XIcon size={12} />}
      {style.icon === 'dot' && <DotIcon size={8} />}
      {style.label}
    </span>
  );
}

function destinationFor(item: BookmarkItem): { href: string; external: boolean } {
  switch (item.type) {
    case 'mcq':
      return { href: '/dashboard/daily-mcq/review', external: false };
    case 'answer-writing':
      return { href: '/dashboard/daily-answer', external: false };
    case 'pyq':
      return { href: '/dashboard/pyq', external: false };
    case 'flashcard':
      return { href: '/dashboard/flashcards', external: false };
    case 'video':
      return item.sourceUrl
        ? { href: item.sourceUrl, external: true }
        : { href: '/dashboard/video-lectures', external: false };
    case 'editorial':
    default:
      return item.sourceUrl
        ? { href: item.sourceUrl, external: true }
        : { href: '/dashboard/saved-notes', external: false };
  }
}

function IconButton({
  onClick,
  href,
  title,
  active,
  children,
}: {
  onClick?: () => void;
  href?: string;
  title: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  const className = 'flex h-8 w-8 items-center justify-center rounded-lg border transition';
  const style = {
    color: active ? '#D97706' : '#9AA7BD',
    background: active ? '#FFFBEB' : '#FFFFFF',
    borderColor: active ? '#FDE68A' : '#E5E7EB',
  };
  if (href) {
    return (
      <a href={href} title={title} className={className} style={style}>
        {children}
      </a>
    );
  }
  return (
    <button onClick={onClick} title={title} className={className} style={style}>
      {children}
    </button>
  );
}

function TrashButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Remove"
      className="flex h-8 w-8 items-center justify-center rounded-lg border text-[#C2414D] transition"
      style={{ borderColor: '#F4D7D9', background: '#FFFFFF' }}
    >
      <TrashIcon size={15} />
    </button>
  );
}

function StarButton({ pinned, onClick }: { pinned: boolean; onClick: () => void }) {
  return (
    <IconButton onClick={onClick} title={pinned ? 'Unstar' : 'Star'} active={pinned}>
      <StarIcon size={15} filled={pinned} />
    </IconButton>
  );
}

function OpenButton({ item }: { item: BookmarkItem }) {
  const router = useRouter();
  const dest = destinationFor(item);
  return (
    <IconButton
      onClick={() => (dest.external ? window.open(dest.href, '_blank', 'noopener,noreferrer') : router.push(dest.href))}
      title="Open"
    >
      <ExternalLinkIcon size={15} />
    </IconButton>
  );
}

function CardFooter({ item, onTogglePin, onDelete }: Props) {
  return (
    <div className="mt-3 flex items-center justify-between border-t border-[#EEF2F8] pt-3">
      <div className="flex items-center gap-2">
        {onTogglePin && <StarButton pinned={item.isPinned} onClick={() => onTogglePin(item)} />}
        <OpenButton item={item} />
      </div>
      <TrashButton onClick={() => onDelete(item)} />
    </div>
  );
}

function McqCard(props: Props) {
  const { item } = props;
  const c = item.content || {};
  const options: { id?: string; label?: string; text: string }[] = c.options || [];
  const selected = c.selectedOption;
  const correct = c.correctOption;
  const [revealed, setRevealed] = useState(false);

  return (
    <article className="rounded-2xl border border-[#E8EDF5] bg-white p-4" style={{ borderLeft: `3px solid ${accentColor(props.index)}` }}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {c.difficulty && <DifficultyBadge difficulty={c.difficulty} />}
        {c.category && <CategoryBadge category={c.category} />}
        {item.source && (
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#9AA3B8]">
            <span className="h-[3px] w-[3px] rounded-[1.5px] bg-[#9AA3B8]" />
            {item.source}
          </span>
        )}
        <span className="ml-auto text-[10px] text-[#9AA3B8]">{formatDate(item.createdAt)}</span>
      </div>
      <p className="line-clamp-3 text-[14px] font-semibold leading-[20.3px] text-[#0C1424]">{c.questionText || item.title}</p>
      {options.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {options.map((opt) => {
            const key = opt.id || opt.label || '';
            const isCorrect = correct && key === correct;
            const isSelectedWrong = selected && key === selected && selected !== correct;
            let bg = 'rgba(11,22,40,0.02)';
            let border = 'rgba(11,22,40,0.09)';
            let color = '#374560';
            let fontWeight = 400;
            if (isCorrect && (selected || revealed)) { bg = 'rgba(29,164,92,0.1)'; border = 'rgba(29,164,92,0.25)'; color = '#1DA45C'; fontWeight = 600; }
            if (isSelectedWrong) { bg = 'rgba(220,38,38,0.08)'; border = 'rgba(220,38,38,0.18)'; color = '#DC2626'; }
            return (
              <div
                key={key}
                className="flex items-start gap-2 rounded-[7px] border px-[11px] py-[8px] text-[12px]"
                style={{ background: bg, borderColor: border, color, fontWeight }}
              >
                <span className="text-[11px] font-bold">{key}</span>
                <span>{opt.text}</span>
              </div>
            );
          })}
        </div>
      )}
      {!selected && correct && (
        <button
          onClick={() => setRevealed((r) => !r)}
          className="mt-3 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#2563EB]"
        >
          {revealed ? 'Hide Answer' : 'Reveal Answer'}
        </button>
      )}
      <div className="mt-3 flex items-center justify-between border-t border-[#EEF2F8] pt-3">
        <StatusBadge status={c.status} />
        <div className="flex items-center gap-2">
          {props.onTogglePin && <StarButton pinned={item.isPinned} onClick={() => props.onTogglePin!(item)} />}
          <IconButton href="/dashboard/daily-mcq/review" title="Open">
            <ExternalLinkIcon size={15} />
          </IconButton>
          <TrashButton onClick={() => props.onDelete(item)} />
        </div>
      </div>
    </article>
  );
}

function EditorialCard(props: Props) {
  const { item } = props;
  const c = item.content || {};
  const tags: string[] = (c.tags?.length ? c.tags : [item.tag]).filter(Boolean);

  return (
    <article className="rounded-2xl border border-[#E8EDF5] bg-white p-4" style={{ borderLeft: '3px solid #63BF7A' }}>
      <div className="mb-3 flex items-center justify-between text-[11px] text-[#8A97AE]">
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-[#EEF3FF] px-2 py-0.5 text-[#4F46E5]">GS</span>
          <span>{item.source || 'Source'}</span>
        </div>
        <span>{formatDate(item.createdAt)}</span>
      </div>
      <h3 className="line-clamp-2 text-[21px] font-semibold leading-7 text-[#121A2D]">{item.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#5C6B85]">{c.summary || 'Saved for quick revision.'}</p>
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.slice(0, 3).map((tag: string) => (
            <span key={tag} className="rounded-md bg-[#FFF4DD] px-2 py-1 text-[11px] text-[#B7791F]">{tag}</span>
          ))}
        </div>
      )}
      <CardFooter {...props} />
    </article>
  );
}

function AnswerWritingCard(props: Props) {
  const { item } = props;
  const c = item.content || {};
  const tags: string[] = c.tags || [];

  return (
    <article className="rounded-2xl border border-[#E8EDF5] bg-white p-4" style={{ borderLeft: `3px solid ${accentColor(props.index)}` }}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
        <div className="flex flex-wrap items-center gap-1.5">
          {c.gsPaper && <span className="rounded-full bg-[#EEF3FF] px-2 py-0.5 font-semibold text-[#4F46E5]">{c.gsPaper}</span>}
          {c.marks && <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[#4B5563]">{c.marks} marks</span>}
          {c.type && <span className="rounded-full bg-[#FFF4DD] px-2 py-0.5 text-[#C98A1D]">{c.type}</span>}
        </div>
        <span className="text-[#9AA7BD]">{formatDate(item.createdAt)}</span>
      </div>
      <p className="line-clamp-3 text-sm leading-6 text-[#121A2D]">{c.questionText || item.title}</p>
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-md bg-[#F3F4F6] px-2 py-1 text-[11px] text-[#4B5563]">{tag}</span>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between border-t border-[#EEF2F8] pt-3">
        <StatusBadge status={c.status} />
        <div className="flex items-center gap-2">
          {props.onTogglePin && <StarButton pinned={item.isPinned} onClick={() => props.onTogglePin!(item)} />}
          <IconButton href="/dashboard/daily-answer" title="Open">
            <ExternalLinkIcon size={15} />
          </IconButton>
          <TrashButton onClick={() => props.onDelete(item)} />
        </div>
      </div>
    </article>
  );
}

function PyqCard(props: Props) {
  const { item } = props;
  const c = item.content || {};
  const isPrelims = (c.paper || '').toLowerCase() === 'prelims';
  const options: { id?: string; label?: string; text: string }[] = c.options || [];
  const keyPoints: string[] = c.keyPoints || [];

  return (
    <article className="rounded-2xl border border-[#E8EDF5] bg-white p-4" style={{ borderLeft: `3px solid ${accentColor(props.index)}` }}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
        <div className="flex flex-wrap items-center gap-1.5">
          {c.year && <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[#4B5563]">{c.year}</span>}
          {c.paper && <StatusBadge status={c.paper} />}
        </div>
        <span className="text-[#9AA7BD]">{formatDate(item.createdAt)}</span>
      </div>
      <p className="line-clamp-3 text-sm leading-6 text-[#121A2D]">{c.questionText || item.title}</p>
      {isPrelims && options.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {options.map((opt) => {
            const key = opt.id || opt.label || '';
            return (
              <div key={key} className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 py-1.5 text-xs text-[#374151]">
                <span className="font-semibold mr-1">{key}.</span>{opt.text}
              </div>
            );
          })}
        </div>
      )}
      {!isPrelims && keyPoints.length > 0 && (
        <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-[#5C6B85]">
          {keyPoints.slice(0, 4).map((point, i) => <li key={i}>{point}</li>)}
        </ul>
      )}
      <div className="mt-3 flex items-center justify-between border-t border-[#EEF2F8] pt-3">
        <StatusBadge status={c.status} />
        <div className="flex items-center gap-2">
          {props.onTogglePin && <StarButton pinned={item.isPinned} onClick={() => props.onTogglePin!(item)} />}
          <IconButton href="/dashboard/pyq" title="Open">
            <ExternalLinkIcon size={15} />
          </IconButton>
          <TrashButton onClick={() => props.onDelete(item)} />
        </div>
      </div>
    </article>
  );
}

function FlashcardCard(props: Props) {
  const { item } = props;
  const c = item.content || {};

  return (
    <article className="rounded-2xl border border-[#E8EDF5] bg-white p-4" style={{ borderLeft: `3px solid ${accentColor(props.index)}` }}>
      <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[11px]">
        {c.deck && <span className="rounded-full bg-[#EEF3FF] px-2 py-0.5 font-semibold text-[#4F46E5]">{c.deck}</span>}
        <StatusBadge status={c.mastery} />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-2.5">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#9AA7BD]">Front</p>
          <p className="line-clamp-3 text-xs text-[#121A2D]">{c.front || item.title}</p>
        </div>
        <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-2.5">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#9AA7BD]">Back</p>
          <p className="line-clamp-3 text-xs text-[#5C6B85]">{c.back || '—'}</p>
        </div>
      </div>
      <CardFooter {...props} />
    </article>
  );
}

function VideoCard(props: Props) {
  const { item } = props;
  const c = item.content || {};
  const progress = typeof c.progress === 'number' ? Math.max(0, Math.min(100, c.progress)) : null;

  return (
    <article className="rounded-2xl border border-[#E8EDF5] bg-white p-4" style={{ borderLeft: `3px solid ${accentColor(props.index)}` }}>
      <div className="mb-3 flex h-28 items-center justify-center rounded-xl bg-[#F3F4F6] text-3xl text-[#C7CDD6]">▶</div>
      <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[11px]">
        {c.duration && <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[#4B5563]">{c.duration}</span>}
        {c.subject && <span className="rounded-full bg-[#EEF3FF] px-2 py-0.5 font-semibold text-[#4F46E5]">{c.subject}</span>}
      </div>
      <h3 className="line-clamp-2 text-sm font-semibold leading-6 text-[#121A2D]">{item.title}</h3>
      {c.instructor && <p className="mt-1 text-xs text-[#9AA7BD]">{c.instructor}</p>}
      {c.watchStatus === 'Watching' && progress !== null && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
          <div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${progress}%` }} />
        </div>
      )}
      <div className="mt-3 flex items-center justify-between border-t border-[#EEF2F8] pt-3">
        <StatusBadge status={c.watchStatus} />
        <div className="flex items-center gap-2">
          {props.onTogglePin && <StarButton pinned={item.isPinned} onClick={() => props.onTogglePin!(item)} />}
          <OpenButton item={item} />
          <TrashButton onClick={() => props.onDelete(item)} />
        </div>
      </div>
    </article>
  );
}

export default function BookmarkCard(props: Props) {
  switch (props.item.type) {
    case 'mcq':
      return <McqCard {...props} />;
    case 'editorial':
      return <EditorialCard {...props} />;
    case 'answer-writing':
      return <AnswerWritingCard {...props} />;
    case 'pyq':
      return <PyqCard {...props} />;
    case 'flashcard':
      return <FlashcardCard {...props} />;
    case 'video':
      return <VideoCard {...props} />;
    default:
      return <EditorialCard {...props} />;
  }
}
