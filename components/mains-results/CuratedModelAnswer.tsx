'use client';

/**
 * CuratedModelAnswer — renders a curated markdown model answer with the
 * reference exam layout: 📌 Introduction → Key Points Checklist → gold-accented
 * body sections → ✅ Conclusion. Self-contained (literal colors, no CSS-var
 * dependency) so it renders identically inside the Daily/PYQ/Mock results view
 * and on the standalone PYQ Mains question page.
 */

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const INK = '#0B1020';
const GOLD = '#F5B800';
const LINE = '#E6E8EE';

/* Inline markdown component styles for the body of a model-answer section
   (paragraphs, bullets, bold lead-ins, tables). Headings are handled at the
   section level, so no heading overrides are needed here. */
const CURATED_MD_COMPONENTS = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p style={{ fontSize: 15.5, lineHeight: 1.75, color: '#364153', margin: '0 0 12px' }}>{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul style={{ fontSize: 15.5, lineHeight: 1.75, color: '#364153', margin: '0 0 14px', paddingLeft: 22, listStyleType: 'disc' }}>{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol style={{ fontSize: 15.5, lineHeight: 1.75, color: '#364153', margin: '0 0 14px', paddingLeft: 22, listStyleType: 'decimal' }}>{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li style={{ marginBottom: 7 }}>{children}</li>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong style={{ fontWeight: 700, color: '#111827' }}>{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => <em>{children}</em>,
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#4F46E5', textDecoration: 'underline' }}>{children}</a>
  ),
  hr: () => null,
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote style={{ borderLeft: `3px solid ${GOLD}`, paddingLeft: 14, margin: '0 0 12px', color: '#4A5565', fontStyle: 'italic' }}>{children}</blockquote>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div style={{ overflowX: 'auto', margin: '0 0 14px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, border: `1px solid ${LINE}` }}>{children}</table>
    </div>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th style={{ textAlign: 'left', fontWeight: 700, padding: '9px 11px', background: '#F9FAFB', color: INK, border: `1px solid ${LINE}` }}>{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td style={{ padding: '9px 11px', color: '#374151', border: `1px solid ${LINE}`, verticalAlign: 'top' }}>{children}</td>
  ),
  // Any residual sub-heading inside a section body renders as a plain bold label.
  h1: ({ children }: { children?: React.ReactNode }) => <div style={{ fontSize: 15.5, fontWeight: 700, color: INK, margin: '12px 0 6px' }}>{children}</div>,
  h2: ({ children }: { children?: React.ReactNode }) => <div style={{ fontSize: 15.5, fontWeight: 700, color: INK, margin: '12px 0 6px' }}>{children}</div>,
  h3: ({ children }: { children?: React.ReactNode }) => <div style={{ fontSize: 15, fontWeight: 700, color: INK, margin: '12px 0 6px' }}>{children}</div>,
  h4: ({ children }: { children?: React.ReactNode }) => <div style={{ fontSize: 14.5, fontWeight: 700, color: INK, margin: '10px 0 5px' }}>{children}</div>,
};

function CuratedMarkdown({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={CURATED_MD_COMPONENTS}>
      {markdown}
    </ReactMarkdown>
  );
}

type CuratedSection = {
  level: number;
  heading: string | null;
  kind: 'intro' | 'conclusion' | 'body' | 'preamble';
  body: string;
};

/* Split a curated markdown answer into semantic sections by heading, so the
   Introduction, body sections and Conclusion can each be styled distinctly. */
function parseCuratedSections(markdown: string): CuratedSection[] {
  const sections: CuratedSection[] = [];
  for (const line of markdown.replace(/\r/g, '').split('\n')) {
    const m = line.match(/^\s{0,3}(#{1,4})\s+(.*\S)\s*$/);
    if (m) {
      const heading = m[2].replace(/[*_`]+/g, '').trim();
      const lower = heading.toLowerCase();
      const kind: CuratedSection['kind'] =
        lower === 'introduction' ? 'intro' : lower === 'conclusion' ? 'conclusion' : 'body';
      sections.push({ level: m[1].length, heading, kind, body: '' });
    } else {
      if (sections.length === 0) {
        sections.push({ level: 0, heading: null, kind: 'preamble', body: '' });
      }
      const last = sections[sections.length - 1];
      last.body = last.body ? `${last.body}\n${line}` : line;
    }
  }
  // Drop standalone --- separators and trim bodies.
  for (const s of sections) {
    s.body = s.body
      .split('\n')
      .filter((l) => !/^\s*(-{3,}|\*{3,})\s*$/.test(l))
      .join('\n')
      .trim();
  }
  // Drop a redundant leading title heading (empty body, appears before intro).
  if (sections.length > 1 && sections[0].kind === 'body' && !sections[0].body) {
    sections.shift();
  }
  return sections.filter((s) => s.heading || s.body);
}

function IntroBlock({ body }: { body: string }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#4F46E5', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><span>📌</span> INTRODUCTION</div>
      <CuratedMarkdown markdown={body} />
    </div>
  );
}

function ConclusionBlock({ body }: { body: string }) {
  return (
    <div style={{ background: 'linear-gradient(135deg,#F0FDF4 0%,#DCFCE7 100%)', borderRadius: 16, padding: 20, marginTop: 8, border: '1px solid rgba(22,163,74,0.15)' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><span>✅</span> CONCLUSION</div>
      <CuratedMarkdown markdown={body} />
    </div>
  );
}

function BodySection({ section, isTop }: { section: CuratedSection; isTop: boolean }) {
  const heading = section.heading || '';
  return (
    <div style={{ marginBottom: 20 }}>
      {heading && (
        isTop ? (
          <div style={{ fontSize: 16.5, fontWeight: 700, color: INK, marginBottom: 10, paddingLeft: 14, borderLeft: `3px solid ${GOLD}` }}>{heading}</div>
        ) : (
          <div style={{ fontSize: 15, fontWeight: 700, color: INK, margin: '14px 0 6px' }}>{heading}</div>
        )
      )}
      {section.body && <div style={{ paddingLeft: heading && isTop ? 4 : 0 }}><CuratedMarkdown markdown={section.body} /></div>}
    </div>
  );
}

function KeyPointsCard({ points }: { points: string[] }) {
  return (
    <div style={{ background: 'linear-gradient(135deg,#EEF0FF 0%,#F5F3FF 100%)', borderRadius: 16, padding: 20, marginBottom: 22, border: '1px solid rgba(99,102,241,0.15)' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#4F46E5', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><span>📌</span> KEY POINTS CHECKLIST</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
        {points.map((pt) => (
          <div key={pt} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ color: '#16A34A', fontSize: 15, marginTop: 2 }}>✓</span>
            <span style={{ fontSize: 14.5, color: INK, lineHeight: 1.5 }}>{pt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CuratedModelAnswer({ markdown, keyPoints }: { markdown: string; keyPoints?: string[] }) {
  const sections = useMemo(() => parseCuratedSections(markdown), [markdown]);
  const minLevel = useMemo(() => {
    const levels = sections.filter((s) => s.kind === 'body' && s.heading).map((s) => s.level);
    return levels.length ? Math.min(...levels) : 2;
  }, [sections]);

  const checklist = keyPoints && keyPoints.length > 0 ? <KeyPointsCard points={keyPoints} /> : null;
  const nodes: React.ReactNode[] = [];
  let checklistPlaced = false;

  sections.forEach((s, i) => {
    if (s.kind === 'intro') {
      nodes.push(<IntroBlock key={`intro-${i}`} body={s.body} />);
      if (checklist) { nodes.push(<div key="checklist">{checklist}</div>); checklistPlaced = true; }
    } else if (s.kind === 'conclusion') {
      nodes.push(<ConclusionBlock key={`concl-${i}`} body={s.body} />);
    } else {
      nodes.push(<BodySection key={`sec-${i}`} section={s} isTop={s.level === minLevel} />);
    }
  });
  if (checklist && !checklistPlaced) nodes.unshift(<div key="checklist-top">{checklist}</div>);

  return <div style={{ color: INK }}>{nodes}</div>;
}
