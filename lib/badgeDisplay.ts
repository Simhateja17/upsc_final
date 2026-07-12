// Shared display metadata (emoji + title) for every achievement badge, keyed by
// the badge key returned from `GET /user/achievements`. Both the full
// achievement board (app/dashboard/achievement-badges) and the dashboard
// Achievement Badges widget (components/PerformanceStatsWidget) read from here
// so the badge names/emojis stay in sync with the backend catalog
// (upsc_backend/src/services/badges/badgeCatalog.ts).

export type BadgeCategoryKey =
  | 'streak'
  | 'learning'
  | 'practice'
  | 'revision'
  | 'analytics'
  | 'community';

export interface BadgeDisplay {
  title: string;
  emoji: string;
  category: BadgeCategoryKey;
}

// Ordered to match the backend catalog so "showcase" selection is deterministic.
export const BADGE_DISPLAY: Record<string, BadgeDisplay> = {
  // Streak & consistency
  'first-light': { title: 'First Light', emoji: '🌅', category: 'streak' },
  'three-in-a-row': { title: 'Three in a Row', emoji: '🌤️', category: 'streak' },
  ignition: { title: 'Ignition', emoji: '🔥', category: 'streak' },
  'iron-discipline': { title: 'Iron Discipline', emoji: '⚡', category: 'streak' },
  'the-grind': { title: 'The Grind', emoji: '💎', category: 'streak' },
  'rise-365': { title: 'Rise 365', emoji: '🏆', category: 'streak' },
  'comeback-king': { title: 'Comeback King', emoji: '💪', category: 'streak' },
  'perfect-week': { title: 'Perfect Week', emoji: '✨', category: 'streak' },

  // Learning
  'first-lecture': { title: 'First Lecture', emoji: '▶️', category: 'learning' },
  'jeet-student': { title: 'Jeet Student', emoji: '📺', category: 'learning' },
  'subject-conqueror': { title: 'Subject Conqueror', emoji: '🎓', category: 'learning' },
  'century-scholar': { title: 'Century Scholar', emoji: '🏫', category: 'learning' },
  'daily-briefing': { title: 'Daily Briefing', emoji: '🗞️', category: 'learning' },
  'current-weekly': { title: 'Current Weekly', emoji: '📆', category: 'learning' },
  'world-watcher': { title: 'World Watcher', emoji: '📡', category: 'learning' },
  'always-informed': { title: 'Always Informed', emoji: '🌐', category: 'learning' },
  'page-turner': { title: 'Page Turner', emoji: '📰', category: 'learning' },
  'deep-reader': { title: 'Deep Reader', emoji: '📖', category: 'learning' },
  'constitution-keeper': { title: 'Constitution Keeper', emoji: '🏛️', category: 'learning' },
  'prelims-ready': { title: 'Prelims Ready', emoji: '🌟', category: 'learning' },
  'mapped-out': { title: 'Mapped Out', emoji: '🗺️', category: 'learning' },
  'quarter-done': { title: 'Quarter Done', emoji: '🎯', category: 'learning' },

  // Practice
  'test-debut': { title: 'Test Debut', emoji: '✏️', category: 'practice' },
  'question-crusher': { title: 'Question Crusher', emoji: '⚔️', category: 'practice' },
  'ten-battles': { title: 'Ten Battles', emoji: '🛡️', category: 'practice' },
  'rank-list-bound': { title: 'Rank List Bound', emoji: '📈', category: 'practice' },
  'first-attempt': { title: 'First Attempt', emoji: '🧩', category: 'practice' },
  'perfect-ten': { title: 'Perfect Ten', emoji: '🔟', category: 'practice' },
  'century-club': { title: 'Century Club', emoji: '💯', category: 'practice' },
  'mcq-marathon': { title: 'MCQ Marathon', emoji: '🇮🇳', category: 'practice' },
  'pen-drawn': { title: 'Pen Drawn', emoji: '✍️', category: 'practice' },
  'mains-rising': { title: 'Mains Rising', emoji: '📝', category: 'practice' },
  'word-smith': { title: 'Word Smith', emoji: '🖊️', category: 'practice' },
  'answer-century': { title: 'Answer Century', emoji: '🏅', category: 'practice' },
  'archive-opener': { title: 'Archive Opener', emoji: '📜', category: 'practice' },
  'pattern-cracker': { title: 'Pattern Cracker', emoji: '🔎', category: 'practice' },
  'pyq-perfectionist': { title: 'PYQ Perfectionist', emoji: '🎖️', category: 'practice' },
  'decade-diver': { title: 'Decade Diver', emoji: '🤿', category: 'practice' },

  // Revision
  'flash-pro': { title: 'Flash Pro', emoji: '⚡', category: 'revision' },
  'review-streak': { title: 'Review Streak', emoji: '🔁', category: 'revision' },
  'card-master': { title: 'Card Master', emoji: '🃏', category: 'revision' },
  'mind-mapper': { title: 'Mind Mapper', emoji: '🧠', category: 'revision' },
  'web-weaver': { title: 'Web Weaver', emoji: '🕸️', category: 'revision' },
  'recall-champion': { title: 'Recall Champion', emoji: '🧩', category: 'revision' },
  'memory-builder': { title: 'Memory Builder', emoji: '🧬', category: 'revision' },
  'retention-expert': { title: 'Retention Expert', emoji: '🎯', category: 'revision' },

  // Analytics
  'data-driven': { title: 'Data-Driven', emoji: '📊', category: 'analytics' },
  'trend-watcher': { title: 'Trend Watcher', emoji: '📉', category: 'analytics' },
  'consistent-growth': { title: 'Consistent Growth', emoji: '🚀', category: 'analytics' },
  'all-green': { title: 'All Green', emoji: '💚', category: 'analytics' },

  // Community
  'top-10': { title: 'Top-10', emoji: '🔝', category: 'community' },
  'top-of-the-board': { title: 'Top of the Board', emoji: '🏔️', category: 'community' },
  'peer-mentor': { title: 'Peer Mentor', emoji: '💡', category: 'community' },
  'forum-expert': { title: 'Forum Expert', emoji: '🎓', category: 'community' },
};
