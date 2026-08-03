'use client';

import { useEffect, useState } from 'react';

export type CompanyPageTocItem = {
  id: string;
  num: string;
  label: string;
};

type CompanyPageTocProps = {
  ariaLabel: string;
  items: CompanyPageTocItem[];
  contactLabel: string;
  contactValue: string;
  contactHref?: string;
  /**
   * 'legal' reproduces the Terms/Privacy sidebar: gold serif numbers and cream
   * highlight chips, for pages sitting on a white surface. Omit it to keep the
   * original styling (white chips on a cream page).
   */
  variant?: 'default' | 'legal';
};

export default function CompanyPageToc({
  ariaLabel,
  items,
  contactLabel,
  contactValue,
  contactHref,
  variant = 'default',
}: CompanyPageTocProps) {
  const isLegal = variant === 'legal';
  const [activeId, setActiveId] = useState(items[0]?.id ?? '');

  useEffect(() => {
    const sectionEls = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (sectionEls.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target.id) {
          setActiveId(visible.target.id);
        }
      },
      { threshold: [0.18, 0.35, 0.6], rootMargin: '-96px 0px -48% 0px' }
    );

    sectionEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  return (
    <aside className="sticky top-24 hidden max-h-[calc(100vh-7rem)] w-56 shrink-0 self-start overflow-hidden lg:block">
      <div>
        <p
          className={
            isLegal
              ? 'mb-3 text-[10px] font-bold uppercase tracking-[0.13em] text-[#6b7a99]'
              : 'mb-4 text-[11px] font-semibold uppercase tracking-widest text-[#9aa3b8]'
          }
        >
          Contents
        </p>
        <div
          role="navigation"
          aria-label={ariaLabel}
          className={`flex flex-col gap-1.5 ${isLegal ? 'text-[13px]' : 'text-sm'}`}
        >
          {items.map((item) => {
            const active = activeId === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setActiveId(item.id)}
                className={`flex items-center gap-2.5 rounded-[7px] border-l-2 px-3 py-2 transition ${
                  isLegal
                    ? active
                      ? 'border-l-[#E8B84B] bg-[#faf8f4] font-semibold text-[#1e3060]'
                      : 'border-l-transparent text-[#6b7a99] hover:border-l-[#E8B84B] hover:bg-[#faf8f4] hover:text-[#0c1424]'
                    : active
                      ? 'border-l-[#E8B84B] bg-white font-semibold text-[#1e3060]'
                      : 'border-l-transparent text-[#374560] hover:border-l-[#E8B84B] hover:bg-white hover:text-[#0c1424]'
                }`}
              >
                <span
                  className={`w-5 shrink-0 text-xs font-bold ${
                    isLegal ? 'text-[#e8b84b]' : 'font-semibold text-[#9aa3b8]'
                  }`}
                  // Serif numerals, matching .terms-toc-num on the Terms page.
                  style={isLegal ? { fontFamily: "'Cormorant Garamond', Georgia, serif" } : undefined}
                >
                  {item.num}
                </span>
                {item.label}
              </a>
            );
          })}
        </div>
        {isLegal ? (
          // Cream contact card, matching .terms-toc-contact on the Terms page.
          <div className="mt-3 border-t border-[rgba(11,22,40,0.09)] pt-3">
            <div className="mt-3 rounded-[10px] border-[1.5px] border-[rgba(11,22,40,0.09)] bg-[#faf8f4] p-3.5">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#6b7a99]">
                {contactLabel}
              </p>
              {contactHref ? (
                <a href={contactHref} className="block break-all text-[13px] font-medium text-[#1e3060]">
                  {contactValue}
                </a>
              ) : (
                <p className="break-all text-[13px] font-medium text-[#1e3060]">{contactValue}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-6 border-t border-[rgba(11,22,40,0.09)] pt-5">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[#9aa3b8]">
              {contactLabel}
            </p>
            {contactHref ? (
              <a href={contactHref} className="block break-words text-sm text-[#374560] hover:text-[#0c1424]">
                {contactValue}
              </a>
            ) : (
              <p className="break-words text-sm text-[#374560]">{contactValue}</p>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
