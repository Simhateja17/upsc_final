// Tag colors sourced from upsc_subject_color_palette.html
export const SUBJECT_PALETTE: Record<string, { bg: string; color: string; topic: string }[]> = {
  history: [
    { bg: '#F5E8D4', color: '#7A5230', topic: 'Ancient India' },
    { bg: '#EDD5E6', color: '#7A3D72', topic: 'Medieval India' },
    { bg: '#FDE9C0', color: '#8A6010', topic: 'Art & Culture' },
    { bg: '#D8E4CC', color: '#445E38', topic: 'Modern History' },
  ],
  geography: [
    { bg: '#C8E8F4', color: '#1E6A9A', topic: 'Physical Geo – World' },
    { bg: '#D8F0DC', color: '#2E6E3E', topic: 'Physical Geo – India' },
    { bg: '#F4EDD0', color: '#826020', topic: 'Economic Geography' },
    { bg: '#ECD8F4', color: '#6A3A90', topic: 'Human Geography' },
  ],
  polity: [
    { bg: '#D0DDF4', color: '#2A4490', topic: 'Polity' },
  ],
  economy: [
    { bg: '#F8EDD8', color: '#7A5818', topic: 'Basic Economy' },
    { bg: '#D0ECD8', color: '#2E6848', topic: 'Public Finance' },
    { bg: '#C8ECF4', color: '#1E6880', topic: 'External Sector' },
    { bg: '#D8F0CC', color: '#3A6828', topic: 'Agriculture' },
    { bg: '#F4F0CC', color: '#6A6018', topic: 'Sectors of Economy' },
    { bg: '#D4DCE8', color: '#3A4A62', topic: 'Infrastructure' },
    { bg: '#F4E0D8', color: '#7A3A28', topic: 'Human Resource Dev.' },
  ],
  environment: [
    { bg: '#C8ECCC', color: '#2A6438', topic: 'Ecology & Ecosystem' },
    { bg: '#D0F0D4', color: '#1E5C34', topic: 'Biodiversity' },
    { bg: '#E8E4DC', color: '#5A5248', topic: 'Pollution' },
    { bg: '#D8ECF8', color: '#1E5A80', topic: 'Climate Change' },
    { bg: '#D4EEDC', color: '#2A6040', topic: 'Conservation Efforts' },
  ],
  science: [
    { bg: '#DCF0F8', color: '#1A5878', topic: 'General Science' },
    { bg: '#CCF0D4', color: '#1A5830', topic: 'Biotechnology' },
    { bg: '#F8DCDC', color: '#7A2828', topic: 'Human Health & Diseases' },
    { bg: '#D4D0F4', color: '#3A2A90', topic: 'Space' },
    { bg: '#D8E0CC', color: '#3A4828', topic: 'Defence' },
    { bg: '#F4F0BC', color: '#6A6010', topic: 'Nuclear Energy' },
    { bg: '#C8ECF8', color: '#1A5870', topic: 'Electronics & IT' },
    { bg: '#E8E4F4', color: '#4A3880', topic: 'Nano Science' },
  ],
};

export const NEUTRAL_TAG_STYLE = { bg: '#F3F4F6', color: '#6A7282' };

// One distinct badge color per subject (Polity→Purple, Geography→Blue,
// Economy→Yellow, Environment→Green, …). Matched by substring so variant
// names like "Indian Polity & Governance" still resolve correctly.
export const SUBJECT_BADGE_STYLES: Array<{ match: (n: string) => boolean; bg: string; color: string }> = [
  { match: (n) => n.includes('polit') || n.includes('governance'), bg: '#EDE9FE', color: '#6D28D9' }, // Purple
  { match: (n) => n.includes('geo'), bg: '#DBEAFE', color: '#1D4ED8' }, // Blue
  { match: (n) => n.includes('econ'), bg: '#FEF3C7', color: '#92400E' }, // Yellow
  { match: (n) => n.includes('environ') || n.includes('ecolog'), bg: '#DCFCE7', color: '#15803D' }, // Green
  { match: (n) => n.includes('histor') || n.includes('art') || n.includes('culture'), bg: '#FFEDD5', color: '#9A3412' }, // Orange
  { match: (n) => n.includes('scien') || n.includes('tech'), bg: '#CFFAFE', color: '#0E7490' }, // Cyan
  { match: (n) => n.includes('current') || n.includes('affair'), bg: '#FFE4E6', color: '#BE123C' }, // Rose
];

export function getSubjectBadgeStyle(subjectName: string): { bg: string; color: string } {
  const n = (subjectName || '').toLowerCase();
  return SUBJECT_BADGE_STYLES.find((s) => s.match(n)) ?? { bg: '#EFF6FF', color: '#17223E' };
}

export function hashIndex(str: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return mod > 0 ? h % mod : 0;
}

function chipsForSubject(subjectName: string) {
  const lower = subjectName.toLowerCase();
  return Object.entries(SUBJECT_PALETTE).find(([key]) => lower.includes(key))?.[1];
}

// Returns one pill style per key, picking distinct palette chips for the
// given subject so none of the tags land on the same color (falls back to
// neutral grey if the subject isn't in the palette, or reuses a chip if
// the palette doesn't have enough distinct colors for every key).
export function getDistinctChipStyles(subjectName: string, keys: string[]): { bg: string; color: string }[] {
  const chips = chipsForSubject(subjectName);
  if (!chips || chips.length === 0) {
    return keys.map(() => NEUTRAL_TAG_STYLE);
  }

  const used = new Set<number>();
  return keys.map((key) => {
    let idx = hashIndex(key, chips.length);
    let attempts = 0;
    while (used.has(idx) && attempts < chips.length) {
      idx = (idx + 1) % chips.length;
      attempts++;
    }
    used.add(idx);
    return { bg: chips[idx].bg, color: chips[idx].color };
  });
}
