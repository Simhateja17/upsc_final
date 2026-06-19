type IconProps = {
  size?: number;
  className?: string;
};

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  'aria-hidden': true as const,
});

export function NewspaperIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3" y="4" width="14" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M17 8H20C20.5523 8 21 8.44772 21 9V18C21 19.1046 20.1046 20 19 20H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 8H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 11.5H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 15H11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function TargetIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
    </svg>
  );
}

export function PencilIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 20H21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16.5 3.5L19.5 6.5L8.5 17.5L4.5 18.5L5.5 14.5L16.5 3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArchiveIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3" y="4" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M4 8V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 12H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function LayersIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 3L21 7.5L12 12L3 7.5L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M3 12L12 16.5L21 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 16.5L12 21L21 16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FilmIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10 9.5L15 12L10 14.5V9.5Z" fill="currentColor" />
    </svg>
  );
}

export function XCircleIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 9L15 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15 9L9 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function RefreshIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3 12C3 7.02944 7.02944 3 12 3C15.0312 3 17.7152 4.49934 19.3676 6.82918" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 3V8H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12C21 16.9706 16.9706 21 12 21C8.96882 21 6.28481 19.5007 4.63241 17.1708" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 21V16H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StarIcon({ size = 16, className, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg {...base(size)} className={className} fill={filled ? 'currentColor' : 'none'}>
      <path d="M12 3L14.7 8.6L21 9.5L16.5 13.8L17.6 20L12 17L6.4 20L7.5 13.8L3 9.5L9.3 8.6L12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function TrashIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 7H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 7V4.5C9 3.94772 9.44772 3.5 10 3.5H14C14.5523 3.5 15 3.94772 15 4.5V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 7L7 19.5C7 20.0523 7.44772 20.5 8 20.5H16C16.5523 20.5 17 20.0523 17 19.5L18 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M14 11V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function ExternalLinkIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M7 17L17 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 7H17V15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckIcon({ size = 12, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M5 12.5L9.5 17L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function XIcon({ size = 12, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function DotIcon({ size = 8, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="currentColor">
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}
