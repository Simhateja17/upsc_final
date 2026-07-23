/**
 * Topic name -> emoji icon, shared by the Flashcards and Mindmaps topic screens.
 *
 * Insertion order is load-bearing: an exact name match wins, otherwise
 * getTopicIcon returns the first key that appears anywhere in the name. Since
 * 'Climate' precedes 'Climate Change', a name like 'Climate Change Impacts'
 * resolves to the 'Climate' icon. Reordering these keys silently changes which
 * icons topics get.
 */
export const TOPIC_ICONS: Record<string, string> = {
  // Polity
  'Constitutional Amendments': '📜', 'Amendment': '📜',
  'Fundamental Rights': '⚖️', 'Fundamental Rights & DPSPs': '⚖️', 'DPSP': '📖',
  'Judiciary': '🏛️', 'Supreme Court': '🏛️', 'Judiciary & Supreme Court': '🏛️',
  'Centre-State': '🗺️', 'Centre-State Relations': '🗺️', 'Federalism': '🗺️',
  'Election Commission': '🗳️', 'Election': '🗳️',
  'Parliament': '🏛️', 'Lok Sabha': '🏛️', 'Rajya Sabha': '🏛️',
  'President': '👑', 'Governor': '🏛️', 'Prime Minister': '👔',
  'Emergency': '🚨', 'Emergency Provisions': '🚨',
  'Panchayati Raj': '🏘️', 'Local Government': '🏘️', 'Municipalities': '🏘️',
  'Constitutional Bodies': '📋', 'Statutory Bodies': '📋',
  'UPSC': '📋', 'CAG': '📋', 'Finance Commission': '💹',
  'Directive Principles': '📖', 'Fundamental Duties': '✊',
  'Citizenship': '🪪', 'Preamble': '📜', 'Schedules': '📋',
  // History
  'Ancient India': '🏺', 'Vedic': '📿', 'Harappan': '🏺', 'Indus Valley': '🏺',
  'Maurya': '🦁', 'Gupta': '🌟', 'Buddhism': '☸️', 'Jainism': '🕯️',
  'Medieval India': '🏰', 'Mughal': '🕌', 'Maratha': '⚔️', 'Delhi Sultanate': '🕌',
  'Modern India': '🇮🇳', 'British': '🗺️', 'Freedom Movement': '🇮🇳',
  'Independence': '🇮🇳', 'Revolt': '⚔️', 'Partition': '🗓️',
  'Art & Culture': '🎨', 'Architecture': '🕌', 'Literature': '📚',
  'Post-Independence': '📜', 'Post Independence': '📜',
  // Geography
  'Physical Geography': '🌍', 'Climate': '☁️', 'Rivers': '🌊', 'Mountains': '⛰️',
  'Soil': '🌱', 'Agriculture': '🌾', 'Industry': '🏭',
  'Transport': '🚆', 'Natural Disasters': '🌪️', 'Ocean': '🌊',
  'World Geography': '🌐', 'Indian Geography': '🗺️', 'Atmosphere': '🌤️',
  // Economy
  'National Income': '💹', 'GDP': '💹', 'Money': '💰', 'Banking': '🏦',
  'Inflation': '📈', 'Budget': '💼', 'Fiscal': '💼', 'Poverty': '🤝',
  'Agriculture Sector': '🌾', 'Industry Sector': '🏭', 'Services': '🏢',
  'External Sector': '🌐', 'Trade': '🌐', 'Balance of Payments': '⚖️',
  'Infrastructure': '🏗️', 'Human Development': '👥',
  // Environment
  'Ecosystem': '🌿', 'Ecology': '🌿', 'Biodiversity': '🦋',
  'Pollution': '🏭', 'Climate Change': '🌡️', 'Wildlife': '🐘',
  'Conservation': '🌳', 'Wetlands': '💧', 'Protected Areas': '🌳',
  // Science
  'Physics': '⚛️', 'Chemistry': '🧪', 'Biology': '🧬',
  'Space': '🚀', 'Nuclear': '☢️', 'Computer': '💻', 'IT': '💻',
  'Biotechnology': '🧬', 'Nanotechnology': '🔬', 'Defence': '🛡️',
  'Health': '🏥', 'Disease': '🦠',
  // Cross-cutting keywords — appended last so the specific keys above win first.
  // These help long, descriptive mindmap titles resolve to a relevant icon
  // instead of the generic fallback.
  'Demographic': '👥', 'Population': '👥', 'Census': '👥', 'Migration': '🧳',
  'Inequality': '⚖️', 'Gender': '♀️', 'Women': '♀️', 'Child': '🧒',
  'Education': '🎓', 'Skill': '🛠️', 'Employment': '💼', 'Unemployment': '💼', 'Labour': '👷',
  'Urban': '🏙️', 'Rural': '🏘️', 'Housing': '🏠',
  'Governance': '🏛️', 'Reform': '🔧', 'Policy': '📋', 'Scheme': '📋', 'Welfare': '🤝',
  'Growth': '📈', 'Development': '📈', 'Investment': '📈',
  'Tax': '💰', 'GST': '💰', 'Subsidy': '💵', 'Revenue': '💰',
  'Digital': '💻', 'Technology': '💡', 'Innovation': '💡', 'Startup': '🚀', 'Governance & Reforms': '🏛️',
  'Energy': '⚡', 'Renewable': '☀️', 'Water': '💧', 'Food': '🍚', 'Security': '🛡️',
  'Corruption': '🚫', 'Law': '⚖️', 'Justice': '⚖️', 'Rights': '⚖️',
  'Foreign': '🌐', 'Diplomacy': '🤝', 'Border': '🗺️', 'War': '⚔️',
  'Culture': '🎭', 'Society': '👪', 'Social': '👪', 'Caste': '👥', 'Religion': '🛐',
};

export function getTopicIcon(name: string): string {
  if (TOPIC_ICONS[name]) return TOPIC_ICONS[name];
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(TOPIC_ICONS)) {
    if (lower.includes(key.toLowerCase())) return icon;
  }
  return '📄';
}
