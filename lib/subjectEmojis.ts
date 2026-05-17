export const SUBJECT_EMOJI_MAP: Record<string, string> = {
  Polity: "🏛️",
  History: "📜",
  Geography: "🌍",
  Economy: "💰",
  "Environment & Ecology": "🌿",
  "Science & Technology": "🔬",
  "Current Affairs": "📰",
  "Indian Society": "👥",
  Governance: "🏢",
  "Social Justice": "⚖️",
  "International Relations": "🤝",
  Agriculture: "🌾",
  "Internal Security": "🚨",
  "Disaster Management": "🆘",
  Ethics: "🧭",
  "Ethics & Human Values": "🧭",
  "Case Studies": "📘",
  CSAT: "🧠",
  GS1: "📘",
  GS2: "📗",
  GS3: "📙",
  GS4: "📕",
  Essay: "✍️",
  "Optional Paper 1": "📓",
  "Optional Paper 2": "📔",
};

export function getSubjectEmoji(subject?: string): string {
  if (!subject) return "📚";
  return SUBJECT_EMOJI_MAP[subject] ?? "📚";
}
