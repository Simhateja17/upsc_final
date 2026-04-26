'use client';

import type { CSSProperties } from 'react';
import { parseMatchListQuestion } from '@/lib/parseMatchListQuestion';

interface QuestionTextRendererProps {
  text?: string | null;
  className?: string;
  style?: CSSProperties;
  textClassName?: string;
  textStyle?: CSSProperties;
}

export default function QuestionTextRenderer({
  text,
  className,
  style,
  textClassName,
  textStyle,
}: QuestionTextRendererProps) {
  const parsed = text ? parseMatchListQuestion(text) : { isMatchList: false as const };
  const stemHeading = parsed.isMatchList ? parsed.intro ?? parsed.heading : null;

  if (parsed.isMatchList && parsed.rows && parsed.rows.length > 0) {
    return (
      <div className={className} style={style}>
        {stemHeading && (
          <div className={textClassName} style={textStyle}>
            {stemHeading}
          </div>
        )}
        <div
          className="mt-4 overflow-hidden rounded-[16px] border border-[#DADDE3] bg-white"
          style={{ boxShadow: '0px 1px 2px rgba(0,0,0,0.03)' }}
        >
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th
                  className="w-1/2 border-b border-r border-[#E5E7EB] px-4 py-3 text-center text-[16px] font-bold text-[#364153]"
                >
                  {parsed.listAHeader || 'List I'}
                </th>
                <th className="w-1/2 border-b border-[#E5E7EB] px-4 py-3 text-center text-[16px] font-bold text-[#364153]">
                  {parsed.listBHeader || 'List II'}
                </th>
              </tr>
            </thead>
            <tbody>
              {parsed.rows.map((row, index) => (
                <tr key={`${row.left}-${row.right}-${index}`}>
                  <td className="align-top border-r border-b border-[#E5E7EB] px-4 py-4 text-[15px] leading-[1.5] text-[#1E2939]">
                    {row.left}
                  </td>
                  <td className="align-top border-b border-[#E5E7EB] px-4 py-4 text-[15px] leading-[1.5] text-[#1E2939]">
                    {row.right}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {parsed.codesBlock && (
          <div className="mt-4 rounded-[14px] bg-[#F8FAFC] px-4 py-3">
            <div className="mb-1 text-[14px] font-semibold uppercase tracking-[0.08em] text-[#364153]">
              Codes
            </div>
            <pre className="whitespace-pre-wrap text-[15px] leading-[1.6] text-[#1E2939]">
              {parsed.codesBlock}
            </pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', ...style }}>
      <div className={textClassName} style={textStyle}>
        {text}
      </div>
    </div>
  );
}
