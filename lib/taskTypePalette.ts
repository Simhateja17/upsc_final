export type TaskTypeStyle = { bg: string; accent: string; icon: string; label: string };

// Per-task-type palette so the type pill on a study task (Reading, Test,
// Revision…) reads as its own colour instead of every type sharing one blue.
const TASK_TYPE_STYLES: Array<TaskTypeStyle & { aliases: string[] }> = [
  { label: 'Reading', icon: '📖', bg: '#EEF5F7', accent: '#3D7A9E', aliases: ['reading', 'read', 'video', 'video lectures', 'lecture'] },
  { label: 'Practice', icon: '✏️', bg: '#F8EFE7', accent: '#B0703F', aliases: ['practice', 'practise', 'mcq', 'mcqs'] },
  { label: 'Revision', icon: '🔄', bg: '#EDF4EC', accent: '#4E8455', aliases: ['revision', 'revise', 'review'] },
  { label: 'Notes Making', icon: '📝', bg: '#F2EDF7', accent: '#7760B4', aliases: ['notes', 'note', 'notes making', 'note making', 'notes-making', 'note-making'] },
  { label: 'Test', icon: '🎯', bg: '#F8F4E5', accent: '#A8873A', aliases: ['test', 'tests', 'mock test', 'mock', 'quiz'] },
  { label: 'Answer Writing', icon: '✍️', bg: '#F3ECE6', accent: '#8A6A50', aliases: ['answer', 'answer writing', 'answer-writing', 'mains answer'] },
  { label: 'Other', icon: '📌', bg: '#EEF0F2', accent: '#5A6B8C', aliases: ['other', 'others', 'misc'] },
];

const OTHER = TASK_TYPE_STYLES[TASK_TYPE_STYLES.length - 1];

function normalizeTaskType(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getTaskTypeStyle(taskType?: string): TaskTypeStyle {
  const n = normalizeTaskType(taskType || '');
  if (!n) return TASK_TYPE_STYLES[0];

  const meta = TASK_TYPE_STYLES.find((entry) =>
    entry.aliases.some((alias) => normalizeTaskType(alias) === n),
  );
  if (meta) return { bg: meta.bg, accent: meta.accent, icon: meta.icon, label: meta.label };

  // Unknown/free-text types (e.g. "Revision Session") still get a sensible
  // colour when they contain a known alias as a word.
  const partial = TASK_TYPE_STYLES.find((entry) =>
    entry.aliases.some((alias) => {
      const a = normalizeTaskType(alias);
      return a.length >= 4 && (n === a || n.startsWith(`${a} `) || n.endsWith(` ${a}`) || n.includes(` ${a} `));
    }),
  );

  const fallback = partial ?? OTHER;
  return {
    bg: fallback.bg,
    accent: fallback.accent,
    icon: fallback.icon,
    label: partial ? partial.label : taskType || OTHER.label,
  };
}
