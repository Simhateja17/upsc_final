export type SubjectBadgeStyle = { bg: string; color: string };
export type SubjectMetaStyle = SubjectBadgeStyle & {
  icon: string;
  border: string;
  accent: string;
  label: string;
};

const DARK_TEXT = '#17223E';

const SUBJECT_META_STYLES: Array<{
  label: string;
  icon: string;
  bg: string;
  accent: string;
  aliases: string[];
}> = [
  { label: 'History', icon: '🏛️', bg: '#F5E6CC', accent: '#A8783E', aliases: ['history', 'modern history', 'ancient history', 'medieval history', 'art culture', 'art & culture'] },
  { label: 'Indian Society', icon: '👥', bg: '#F3D8E2', accent: '#B35B7A', aliases: ['indian society', 'society'] },
  { label: 'Geography', icon: '🌍', bg: '#D8EDF5', accent: '#3D8CAE', aliases: ['geography', 'geog'] },
  { label: 'Polity', icon: '⚖️', bg: '#D8E2F3', accent: '#4D6FA9', aliases: ['polity', 'indian polity'] },
  { label: 'Governance', icon: '🏛️', bg: '#FDF1B6', accent: '#B89516', aliases: ['governance'] },
  { label: 'Social Justice', icon: '🤝', bg: '#FADADD', accent: '#C65D66', aliases: ['social justice'] },
  { label: 'International Relations', icon: '🌐', bg: '#D9D6F5', accent: '#6D68B8', aliases: ['international relations', 'int relations', "int'l relations", 'ir', 'foreign policy'] },
  { label: 'Economy', icon: '📈', bg: '#F5D8D0', accent: '#B66D5A', aliases: ['economy', 'indian economy', 'economic'] },
  { label: 'Science & Technology', icon: '🔬', bg: '#E1D8F5', accent: '#7964B4', aliases: ['science & technology', 'science and technology', 'science technology', 'science & tech', 'science and tech', 's&t', 'science', 'technology'] },
  { label: 'Environment', icon: '🌿', bg: '#E1F5E1', accent: '#529B59', aliases: ['environment', 'environment & ecology', 'environment ecology', 'ecology'] },
  { label: 'Disaster Management', icon: '🚨', bg: '#FAD2A7', accent: '#BC7224', aliases: ['disaster management', 'disaster mgmt'] },
  { label: 'Internal Security', icon: '🛡️', bg: '#EFEFE1', accent: '#7F806B', aliases: ['internal security', 'security'] },
  { label: 'Ethics', icon: '🧭', bg: '#F5E8EC', accent: '#B3708A', aliases: ['ethics', 'ethics integrity aptitude', 'ethics gs4', 'gs-iv ethics'] },
  { label: 'Current Affairs', icon: '📰', bg: '#E3F0F7', accent: '#4E6A8F', aliases: ['current affairs', 'current-affairs'] },
  { label: 'Agriculture', icon: '🌾', bg: '#E8F5D8', accent: '#6E9C3F', aliases: ['agriculture', 'agri'] },
  { label: 'Essay', icon: '✍️', bg: '#F9F3D9', accent: '#B89516', aliases: ['essay', 'essay writing'] },
  { label: 'CSAT', icon: '🧩', bg: '#F4EDE4', accent: '#9A8258', aliases: ['csat', 'csat paper ii'] },
  { label: 'GS Paper 1', icon: '📘', bg: '#E8F4F8', accent: '#3D7A9E', aliases: ['gs1', 'gs i', 'gs paper i', 'gs paper 1', 'gs paper1'] },
  { label: 'GS Paper 2', icon: '📗', bg: '#E6F5E8', accent: '#529B59', aliases: ['gs2', 'gs ii', 'gs paper ii', 'gs paper 2', 'gs paper2'] },
  { label: 'GS Paper 3', icon: '📙', bg: '#F7ECE1', accent: '#B66D5A', aliases: ['gs3', 'gs iii', 'gs paper iii', 'gs paper 3', 'gs paper3'] },
  { label: 'GS Paper 4', icon: '📕', bg: '#EBE4F5', accent: '#7760B4', aliases: ['gs4', 'gs iv', 'gs paper iv', 'gs paper 4', 'gs paper4'] },
  { label: 'Optional Paper 1', icon: '📓', bg: '#E8EDF5', accent: '#5A6B99', aliases: ['optional paper 1', 'optional i'] },
  { label: 'Optional Paper 2', icon: '📔', bg: '#F0ECE6', accent: '#8A7B63', aliases: ['optional paper 2', 'optional ii'] },
];

const SUBJECT_THEME_CHIPS: Record<string, { bg: string; topic: string }[]> = {
  history: [
    { topic: 'Ancient History', bg: '#E6D8F5' },
    { topic: 'Medieval India', bg: '#D8F5E9' },
    { topic: 'Art & Culture', bg: '#F5D8D8' },
    { topic: 'Modern History', bg: '#CDE6F5' },
    { topic: 'World History', bg: '#F5F5D8' },
    { topic: 'Post Independence India', bg: '#D8E5F5' },
  ],
  geography: [
    { topic: 'Physical Geography', bg: '#E0F5F2' },
    { topic: 'Indian Geography', bg: '#E5E0F5' },
    { topic: 'Human Geography', bg: '#F5E6D8' },
    { topic: 'Economic Geography', bg: '#F5D8EB' },
    { topic: 'World Geography', bg: '#F5F5D8' },
    { topic: 'Mapping', bg: '#D8F5E0' },
  ],
  polity: [
    { topic: 'Constitutional History', bg: '#E8F3D8' },
    { topic: 'Constitutional Framework', bg: '#E0D8F1' },
    { topic: 'Executive', bg: '#D8F3EF' },
    { topic: 'Legislature', bg: '#EBE0F7' },
    { topic: 'Judiciary', bg: '#E6E6E6' },
    { topic: 'Federalism', bg: '#F3E1D8' },
    { topic: 'Local Governance', bg: '#F3D8F0' },
  ],
  'indian society': [
    { topic: 'Salient Features of Indian Society', bg: '#D8F3E9' },
    { topic: 'Diversity & National Integration', bg: '#E9F3D8' },
    { topic: 'Women & Gender Issues', bg: '#D8E9F3' },
    { topic: 'Population & Urbanization', bg: '#F3E9D8' },
    { topic: 'Poverty & Development Issues', bg: '#E2D8F3' },
  ],
  governance: [
    { topic: 'Governance Basics', bg: '#B6FDF1' },
    { topic: 'Government Policies & Programmes', bg: '#B6C2FD' },
    { topic: 'Civil Society & Development', bg: '#FDB6C2' },
    { topic: 'E-Governance', bg: '#C2B6FD' },
  ],
  economy: [
    { topic: 'Economic Fundamentals', bg: '#D0F5E8' },
    { topic: 'Financial System', bg: '#D0E8F5' },
    { topic: 'Public Finance', bg: '#F5D0E8' },
    { topic: 'External Sector', bg: '#E8F5D0' },
    { topic: 'Agriculture', bg: '#F5F0D0' },
    { topic: 'Industry & Services', bg: '#D0D5F5' },
    { topic: 'Infrastructure', bg: '#E8D0F5' },
  ],
  environment: [
    { topic: 'Ecology & Ecosystems', bg: '#D1E1F5' },
    { topic: 'Biodiversity', bg: '#F5E1D1' },
    { topic: 'Conservation & Protected Areas', bg: '#D1F5F2' },
    { topic: 'Climate Change', bg: '#E1D1F5' },
  ],
  science: [
    { topic: 'General Science', bg: '#D0F5D5' },
    { topic: 'Biotechnology', bg: '#D8F5E1' },
    { topic: 'Human Health & Diseases', bg: '#F5E1D8' },
    { topic: 'Space Technology', bg: '#D8F5F1' },
    { topic: 'Defence Technology', bg: '#F5F5D8' },
    { topic: 'Nuclear Technology', bg: '#D8E1F5' },
  ],
};

export const NEUTRAL_TAG_STYLE = { bg: '#F3F4F6', color: '#17223E' };

function normalizeSubjectName(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function withAlpha(hex: string, alphaHex: string) {
  return `${hex}${alphaHex}`;
}

export function getSubjectMetaStyle(subjectName: string): SubjectMetaStyle {
  const n = normalizeSubjectName(subjectName || '');
  const tokens = n.split(' ');

  const matchesAlias = (entry: (typeof SUBJECT_META_STYLES)[number]) => {
    if (normalizeSubjectName(entry.label) === n) return true;
    return entry.aliases.some((alias) => {
      const a = normalizeSubjectName(alias);
      if (!a) return false;
      // Word-boundary match so short aliases (e.g. 'ir') don't match inside
      // unrelated words like 'envIRonment'.
      return (
        n === a ||
        tokens.includes(a) ||
        n.includes(` ${a} `) ||
        n.startsWith(`${a} `) ||
        n.endsWith(` ${a}`)
      );
    });
  };

  // Second pass: stem match. Real task subjects arrive as morphological
  // variants the word-boundary pass misses - "Economics" vs the `economic`
  // alias, "Environmental" vs `environment`, "Geographical" vs `geog` - and
  // those all fell through to the neutral default, so every such pill on the
  // dashboard rendered the same grey-blue. Here a token matches a label/alias
  // when one is a prefix of the other, guarded to length >= 4 so short stems
  // ('ir', 'gs', 'eco') can't cause cross-subject false positives. Only runs
  // when the strict pass finds nothing, so it never changes an existing match.
  const matchesStem = (entry: (typeof SUBJECT_META_STYLES)[number]) =>
    [entry.label, ...entry.aliases].some((candidate) => {
      const a = normalizeSubjectName(candidate);
      if (a.length < 4) return false;
      return tokens.some(
        (t) => t.length >= 4 && (t.startsWith(a) || a.startsWith(t)),
      );
    });

  const meta =
    SUBJECT_META_STYLES.find(matchesAlias) ??
    SUBJECT_META_STYLES.find(matchesStem);

  if (!meta) {
    return {
      bg: '#EFF6FF',
      color: DARK_TEXT,
      border: withAlpha('#5A6B8C', '55'),
      accent: '#5A6B8C',
      icon: '📚',
      label: subjectName || 'Subject',
    };
  }

  return {
    bg: meta.bg,
    color: DARK_TEXT,
    border: withAlpha(meta.accent, '55'),
    accent: meta.accent,
    icon: meta.icon,
    label: meta.label,
  };
}

export function getSubjectBadgeStyle(subjectName: string): SubjectBadgeStyle {
  const meta = getSubjectMetaStyle(subjectName);
  return { bg: meta.bg, color: meta.color };
}

export function getSubjectAccentColor(subjectName: string): string {
  return getSubjectMetaStyle(subjectName).accent;
}

export function getSubjectIcon(subjectName?: string): string {
  return getSubjectMetaStyle(subjectName || '').icon;
}

export function getSubjectCardStyle(subjectName: string): { bg: string; border: string; bar: string; iconBg: string; color: string } {
  const meta = getSubjectMetaStyle(subjectName);
  return {
    bg: meta.bg,
    border: meta.border,
    bar: meta.accent,
    iconBg: '#FFFFFFAA',
    color: meta.color,
  };
}

export function hashIndex(str: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return mod > 0 ? h % mod : 0;
}

function chipsForSubject(subjectName: string) {
  const meta = getSubjectMetaStyle(subjectName);
  const key = normalizeSubjectName(meta.label).replace(/\s+/g, ' ');
  const chips = SUBJECT_THEME_CHIPS[key] ?? SUBJECT_THEME_CHIPS[key.split(' ')[0]];
  if (chips?.length) {
    return chips.map((chip) => ({ bg: chip.bg, color: DARK_TEXT, topic: chip.topic }));
  }
  return [{ bg: meta.bg, color: DARK_TEXT, topic: meta.label }];
}

export function getDistinctChipStyles(subjectName: string, keys: string[]): SubjectBadgeStyle[] {
  const chips = chipsForSubject(subjectName);
  if (!chips || chips.length === 0) return keys.map(() => NEUTRAL_TAG_STYLE);

  const used = new Set<number>();
  return keys.map((key) => {
    const exactIdx = chips.findIndex((chip) => normalizeSubjectName(chip.topic) === normalizeSubjectName(key));
    let idx = exactIdx >= 0 ? exactIdx : hashIndex(key, chips.length);
    let attempts = 0;
    while (used.has(idx) && attempts < chips.length) {
      idx = (idx + 1) % chips.length;
      attempts++;
    }
    used.add(idx);
    return { bg: chips[idx].bg, color: chips[idx].color };
  });
}

export function getTagStyles(subjectName: string, topicText: string, subSubjectText: string): {
  topic: SubjectBadgeStyle;
  subSubject: SubjectBadgeStyle;
} {
  const [subSubject, topic] = getDistinctChipStyles(subjectName, [subSubjectText, topicText]);
  return { topic, subSubject };
}
