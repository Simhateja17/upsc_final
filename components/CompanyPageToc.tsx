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
};

export default function CompanyPageToc({
  ariaLabel,
  items,
  contactLabel,
  contactValue,
  contactHref,
}: CompanyPageTocProps) {
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
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-[#9aa3b8]">
          Contents
        </p>
        <div role="navigation" aria-label={ariaLabel} className="flex flex-col gap-1.5 text-sm">
          {items.map((item) => {
            const active = activeId === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setActiveId(item.id)}
                className={`flex items-center gap-2.5 rounded-[7px] border-l-2 px-3 py-2 transition ${
                  active
                    ? 'border-l-[#E8B84B] bg-white font-semibold text-[#1e3060]'
                    : 'border-l-transparent text-[#374560] hover:border-l-[#E8B84B] hover:bg-white hover:text-[#0c1424]'
                }`}
              >
                <span className="w-5 shrink-0 text-xs font-semibold text-[#9aa3b8]">
                  {item.num}
                </span>
                {item.label}
              </a>
            );
          })}
        </div>
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
      </div>
    </aside>
  );
}
