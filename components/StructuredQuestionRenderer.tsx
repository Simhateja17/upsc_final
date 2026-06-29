'use client';

import type { CSSProperties } from 'react';
import QuestionTextRenderer from './QuestionTextRenderer';

interface QuestionStructure {
  intro?: string | null;
  items: { label: string; text: string }[];
  prompt?: string | null;
}

interface Props {
  questionStructure?: QuestionStructure | null;
  questionText?: string | null;
  className?: string;
  style?: CSSProperties;
  textClassName?: string;
  textStyle?: CSSProperties;
}

function parseNumberedStatements(text: string): QuestionStructure | null {
  const normalized = text
    .replace(/[–—]/g, '-')
    .replace(/\s+(\d+\.)\s+/g, '\n$1 ')
    .trim();

  const lines = normalized.split('\n');
  const itemIndices: number[] = [];

  lines.forEach((line, i) => {
    if (/^\d+\.\s/.test(line.trim())) itemIndices.push(i);
  });

  if (itemIndices.length < 2) return null;

  const firstItem = itemIndices[0];
  const lastItem = itemIndices[itemIndices.length - 1];

  const intro = lines.slice(0, firstItem).join('\n').trim() || null;
  const promptLines = lines.slice(lastItem + 1).join('\n').trim();
  const prompt = promptLines || null;

  const items = itemIndices.map((idx, i) => {
    const end = i + 1 < itemIndices.length ? itemIndices[i + 1] : lastItem + 1;
    const itemLines = lines.slice(idx, end).join('\n').trim();
    const match = itemLines.match(/^(\d+)\.\s+([\s\S]*)$/);
    return match
      ? { label: match[1], text: match[2].trim() }
      : { label: String(i + 1), text: itemLines };
  });

  return { intro, items, prompt };
}

export default function StructuredQuestionRenderer({
  questionStructure,
  questionText,
  className,
  style,
  textClassName,
  textStyle,
}: Props) {
  const structure: QuestionStructure | null =
    questionStructure?.items?.length
      ? questionStructure
      : questionText
        ? parseNumberedStatements(questionText)
        : null;

  if (!structure || !structure.items.length) {
    return (
      <QuestionTextRenderer
        text={questionText}
        className={className}
        style={style}
        textClassName={textClassName}
        textStyle={textStyle}
      />
    );
  }

  return (
    <div className={className} style={style}>
      {structure.intro && (
        <div
          className={textClassName}
          style={{ marginBottom: 14, whiteSpace: 'pre-wrap', wordBreak: 'break-word', ...textStyle }}
        >
          {structure.intro}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {structure.items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#2B7FFF',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              {item.label}
            </span>
            <span
              className={textClassName}
              style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.55', ...textStyle }}
            >
              {item.text}
            </span>
          </div>
        ))}
      </div>
      {structure.prompt && (
        <div
          className={textClassName}
          style={{ marginTop: 14, fontWeight: 700, fontStyle: 'italic', ...textStyle }}
        >
          {structure.prompt}
        </div>
      )}
    </div>
  );
}
