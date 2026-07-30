/**
 * Parses the markdown stored in `structuredJson.essay.parts` into the structured
 * shapes the essay model-answer page renders (decode cards, essay sections,
 * value-addition repository).
 *
 * The dataset is ~95% consistent but a handful of rows use `## Central Theme`
 * headings instead of `**Central Theme:**` bold labels, numbered lists instead of
 * bullets, and `*Relevance*:` instead of `**Relevance:**`. Every parser here
 * accepts those variants and returns null when it cannot find structure, so the
 * caller can fall back to plain markdown rendering.
 */

export type EssayDecode = {
  centralTheme: string;
  meaningOfTopic: string;
  keywords: string[];
  hiddenDimensions: string;
  multipleInterpretations: string;
  thesis: string;
  extras: Array<{ label: string; text: string }>;
};

export type EssaySection = { title: string; paragraphs: string[] };

export type EssayBody = {
  title: string;
  lead: string[];
  sections: EssaySection[];
};

export type RepositoryItem = {
  /** Bold lead-in - a quotation in section A, a concept name elsewhere. */
  primary: string;
  /** "- Martin Luther King Jr." for quotations. */
  attribution: string;
  body: string;
  /** "Relevance" | "Application" | "Connection" */
  tailLabel: string;
  tailText: string;
};

export type RepositorySection = {
  key: string;
  title: string;
  items: RepositoryItem[];
  raw: string;
};

export type ParsedEssayAnswer = {
  decode: EssayDecode | null;
  body: EssayBody | null;
  repository: RepositorySection[];
  raw: { topicDecoding: string; modelEssay: string; valueAdditionRepository: string };
};

const DECODE_LABELS = [
  ['centralTheme', ['Central Theme', 'Central Thesis']],
  ['meaningOfTopic', ['Meaning of the Topic', 'Meaning of Topic', 'Meaning']],
  ['keywords', ['Important Keywords', 'Keywords', 'Key Words']],
  ['hiddenDimensions', ['Hidden Dimensions', 'Hidden Dimension']],
  ['multipleInterpretations', ['Multiple Interpretations', 'Interpretations']],
  ['thesis', ['One-line Central Thesis', 'One Line Central Thesis', 'Central Thesis', 'Thesis']],
] as const;

const TAIL_LABELS = ['Relevance', 'Application', 'Connection', 'Usage', 'Use'];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function clean(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

/** Drops the leading "## Part 2 - Model UPSC Essay" style heading. */
function stripPartHeading(markdown: string) {
  return markdown.replace(/^\s*(?:#{1,6}\s*|\*\*)?Part\s*-?\s*\d+\s*[-:–-]?[^\n]*\n/i, '').trim();
}

/** Strips markdown emphasis so parsed values render as plain text in the cards. */
function stripEmphasis(value: string) {
  // Bold first, then any remaining single-asterisk italics.
  return value.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*([^*]+?)\*/g, '$1');
}

/**
 * Finds `**Label:** value` or `## Label\nvalue`, consuming until the next label
 * or heading of any kind.
 */
function extractLabelled(markdown: string, aliases: readonly string[]): string {
  for (const alias of aliases) {
    const name = escapeRegExp(alias);
    const bold = new RegExp(`\\*\\*${name}\\s*:?\\*\\*\\s*:?\\s*([\\s\\S]*?)(?=\\n\\s*\\*\\*[^*\\n]{2,60}?\\s*:?\\*\\*|\\n\\s*#{1,6}\\s|\\n\\s*---|$)`, 'i');
    const boldMatch = bold.exec(markdown);
    if (boldMatch?.[1]?.trim()) return boldMatch[1].trim();

    const heading = new RegExp(`^\\s*#{1,6}\\s*${name}\\s*:?\\s*$([\\s\\S]*?)(?=^\\s*#{1,6}\\s|^\\s*---|(?![\\s\\S]))`, 'im');
    const headingMatch = heading.exec(markdown);
    if (headingMatch?.[1]?.trim()) return headingMatch[1].trim();
  }
  return '';
}

/** "Truth, Color, Prejudice." or a bullet list → ["Truth", "Color", "Prejudice"] */
function parseKeywords(value: string): string[] {
  if (!value) return [];
  const bulletLines = value
    .split('\n')
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter(Boolean);

  const usesBullets = /^\s*(?:[-*•]|\d+[.)])\s/m.test(value);
  const rawItems = usesBullets ? bulletLines : clean(value).split(/[,;]/);

  return rawItems
    // Bullet keywords come as "Truth: the ultimate reality" - keep only the term.
    .map((item) => stripEmphasis(item).split(/[:–-]/)[0])
    .map((item) => clean(item).replace(/[.]+$/, ''))
    .filter((item) => item.length > 0 && item.length <= 48);
}

export function parseTopicDecoding(markdown: string): EssayDecode | null {
  const text = stripPartHeading(markdown || '');
  if (!text) return null;

  const found: Record<string, string> = {};
  for (const [key, aliases] of DECODE_LABELS) {
    found[key] = extractLabelled(text, aliases);
  }

  const filled = Object.entries(found).filter(([, value]) => value).length;
  if (filled < 3) return null;

  return {
    centralTheme: stripEmphasis(clean(found.centralTheme)),
    meaningOfTopic: stripEmphasis(clean(found.meaningOfTopic)),
    keywords: parseKeywords(found.keywords),
    hiddenDimensions: stripEmphasis(clean(found.hiddenDimensions)),
    multipleInterpretations: stripEmphasis(clean(found.multipleInterpretations)),
    thesis: stripEmphasis(clean(found.thesis)),
    extras: [],
  };
}

export function parseModelEssay(markdown: string, questionText: string): EssayBody | null {
  const text = stripPartHeading(markdown || '');
  if (!text) return null;

  const headingRe = /^\s*#{1,6}\s+(.+?)\s*$/gm;
  const headings: Array<{ title: string; start: number; end: number }> = [];
  let match: RegExpExecArray | null;
  while ((match = headingRe.exec(text)) !== null) {
    headings.push({ title: clean(match[1]), start: match.index, end: match.index + match[0].length });
  }

  const normalizedQuestion = clean(questionText).replace(/[."'“”‘’]/g, '').toLowerCase();
  const isTitleHeading = (title: string) => {
    const normalized = clean(title).replace(/[."'“”‘’]/g, '').toLowerCase();
    return normalized === normalizedQuestion || normalizedQuestion.startsWith(normalized) || normalized.startsWith(normalizedQuestion);
  };

  let title = clean(questionText).replace(/^["'“‘]|["'”’.]+$/g, '');
  let cursor = 0;
  if (headings.length > 0 && isTitleHeading(headings[0].title)) {
    title = headings[0].title.replace(/^["'“‘]|["'”’.]+$/g, '');
    cursor = headings[0].end;
    headings.shift();
  }

  const toParagraphs = (chunk: string) =>
    chunk
      .split(/\n{2,}/)
      .map((paragraph) => clean(paragraph))
      .filter((paragraph) => paragraph.length > 0 && !/^-{3,}$/.test(paragraph));

  const lead = toParagraphs(text.slice(cursor, headings[0]?.start ?? text.length));
  const sections: EssaySection[] = headings.map((heading, index) => ({
    title: heading.title,
    paragraphs: toParagraphs(text.slice(heading.end, headings[index + 1]?.start ?? text.length)),
  }));

  if (sections.length === 0 && lead.length === 0) return null;
  return { title, lead, sections };
}

/** `- **X:** body **Relevance:** tail` → its three pieces. */
function parseRepositoryItem(raw: string): RepositoryItem {
  let text = clean(raw);
  let tailLabel = '';
  let tailText = '';

  const tailRe = new RegExp(`(?:\\*\\*|\\*)?(${TAIL_LABELS.join('|')})(?:\\*\\*|\\*)?\\s*:\\s*(?:\\*\\*)?\\s*([\\s\\S]+)$`, 'i');
  const tailMatch = tailRe.exec(text);
  if (tailMatch) {
    tailLabel = clean(tailMatch[1]);
    tailText = stripEmphasis(clean(tailMatch[2]));
    text = clean(text.slice(0, tailMatch.index));
  }

  let primary = '';
  let attribution = '';

  // Section A quotations: **"…"** – Author.  (quotes may or may not be bolded)
  const quoteMatch = /^\*{0,2}\s*[“"]([\s\S]+?)[”"]\s*\*{0,2}\s*(?:[–-]\s*([\s\S]+?))?\.?\s*$/.exec(text);
  if (quoteMatch) {
    primary = clean(quoteMatch[1]);
    attribution = clean(quoteMatch[2] || '').replace(/[.]+$/, '');
    return { primary, attribution, body: '', tailLabel, tailText };
  }

  // Sections B–D: **Concept name:** description
  const boldMatch = /^\*\*(.+?)\s*:?\*\*\s*:?\s*([\s\S]*)$/.exec(text);
  if (boldMatch) {
    return {
      primary: stripEmphasis(clean(boldMatch[1])).replace(/:$/, ''),
      attribution: '',
      body: stripEmphasis(clean(boldMatch[2])),
      tailLabel,
      tailText,
    };
  }

  return { primary: '', attribution: '', body: stripEmphasis(text), tailLabel, tailText };
}

export function parseValueRepository(markdown: string): RepositorySection[] {
  const text = stripPartHeading(markdown || '');
  if (!text) return [];

  // Section headers appear as "### A. Relevant Quotations" or "**A. Relevant Quotations**".
  const sectionRe = /^\s*(?:#{1,6}\s*|\*\*)([A-F])[.)]\s*([^\n*]+?)(?:\*\*)?\s*$/gm;
  const heads: Array<{ key: string; title: string; start: number; end: number }> = [];
  let match: RegExpExecArray | null;
  while ((match = sectionRe.exec(text)) !== null) {
    heads.push({ key: match[1], title: clean(match[2]), start: match.index, end: match.index + match[0].length });
  }
  if (heads.length === 0) return [];

  return heads.map((head, index) => {
    const raw = text.slice(head.end, heads[index + 1]?.start ?? text.length).trim();

    // Preferred: bullet or numbered list markers at line start.
    const usesList = /^\s*(?:[-*•]|\d+[.)])\s+/m.test(raw);
    let chunks: string[];
    if (usesList) {
      chunks = raw.split(/^\s*(?:[-*•]|\d+[.)])\s+/m);
    } else if (/^\s*\*\*[^\n]+?\*\*/m.test(raw)) {
      // Fallback: each item is its own `**Label:** body` paragraph (no markers).
      chunks = raw.split(/\n{2,}/);
    } else {
      chunks = [];
    }
    const items = chunks
      .map((part) => part.trim())
      .filter((part) => part && !/^\|/.test(part) && !/^:?-{2,}/.test(part))
      .map(parseRepositoryItem)
      .filter((item) => item.primary || item.body);

    return { key: head.key, title: head.title, items, raw };
  });
}

function partsOf(question: any) {
  const parts = question?.structuredJson?.essay?.parts;
  const read = (key: string) => (typeof parts?.[key] === 'string' ? parts[key].trim() : '');
  return {
    topicDecoding: read('topicDecoding'),
    modelEssay: read('modelEssay'),
    valueAdditionRepository: read('valueAdditionRepository'),
  };
}

export function parseEssayAnswer(question: any): ParsedEssayAnswer {
  const raw = partsOf(question);
  return {
    decode: parseTopicDecoding(raw.topicDecoding),
    body: parseModelEssay(raw.modelEssay, String(question?.questionText || '')),
    repository: parseValueRepository(raw.valueAdditionRepository),
    raw,
  };
}

export function isEssayQuestion(question: any): boolean {
  const paper = String(question?.paper || '').trim().toLowerCase();
  return paper === 'essay' || Boolean(question?.structuredJson?.essay);
}

export function essaySection(question: any): string {
  return String(question?.structuredJson?.essay?.section || '').trim();
}

export function essayQuestionNumber(question: any): number | null {
  const value = question?.structuredJson?.questionNumber;
  return Number.isFinite(Number(value)) ? Number(value) : null;
}
