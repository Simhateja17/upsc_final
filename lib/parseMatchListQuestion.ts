// Parse "Match List I with List II" UPSC-style prelims questions and
// return a heading, a 2-column table, and the original codes/options block.

export interface ParsedMatchList {
  isMatchList: boolean;
  intro?: string;
  heading?: string;
  listAHeader?: string;
  listBHeader?: string;
  rows?: Array<{ left: string; right: string }>;
  codesBlock?: string;
}

const HEAD_REGEX = /Match\s+List[\s-]*I[\s-]*with\s+List[\s-]*II/i;

export function parseMatchListQuestion(text: string): ParsedMatchList {
  if (!text || !HEAD_REGEX.test(text)) return { isMatchList: false };

  const normalized = text.replace(/\s+/g, ' ').trim();

  // Try to capture two parenthesized list captions like
  // "(Cricketers)" / "(Country)" or "(Sport/Game)".
  const captionMatches = normalized.match(/List[\s-]*I\s*\(([^)]+)\).*?List[\s-]*II\s*\(([^)]+)\)/i);
  const listAHeader = captionMatches?.[1];
  const listBHeader = captionMatches?.[2];

  const headingMatch = normalized.match(/^(.*?)(?=List[\s-]*I\b)/i);
  const intro = headingMatch?.[1]?.replace(/:\s*$/, '').trim();

  const lefts: { key: string; text: string }[] = [];
  const rights: { key: string; text: string }[] = [];

  const leftSectionMatch = normalized.match(/List[\s-]*I\b.*?(?=List[\s-]*II\b|Codes\s*:|$)/i);
  const rightSectionMatch = normalized.match(/List[\s-]*II\b.*?(?=Codes\s*:|$)/i);
  const leftSection = leftSectionMatch?.[0] ?? normalized;
  const rightSection = rightSectionMatch?.[0] ?? normalized;

  const leftItemRe = /([A-D])\.\s*(.*?)(?=(?:\s+[A-D]\.\s)|(?:\s+\d\.\s)|(?:\s+Codes\s*:)|$)/g;
  const rightItemRe = /(\d)\.\s*(.*?)(?=(?:\s+\d\.\s)|(?:\s+Codes\s*:)|$)/g;

  for (const match of leftSection.matchAll(leftItemRe)) {
    lefts.push({ key: match[1], text: match[2].trim() });
  }
  for (const match of rightSection.matchAll(rightItemRe)) {
    rights.push({ key: match[1], text: match[2].trim() });
  }

  if (lefts.length < 2 || rights.length < 2) {
    return { isMatchList: false };
  }

  const rows = lefts.map((l, i) => ({
    left: `${l.key}. ${l.text}`,
    right: rights[i] ? `${rights[i].key}. ${rights[i].text}` : '',
  }));

  // Pull a "Codes:" block (a-d/1-4) for display below the table if present
  const codesIdx = text.search(/Codes\s*:/i);
  const codesBlock = codesIdx >= 0 ? text.slice(codesIdx).trim() : undefined;

  return {
    isMatchList: true,
    intro,
    heading: 'Match List I with List II and select the correct answer:',
    listAHeader: listAHeader || 'List I',
    listBHeader: listBHeader || 'List II',
    rows,
    codesBlock,
  };
}
