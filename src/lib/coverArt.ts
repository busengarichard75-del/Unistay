// src/lib/coverArt.ts
export interface CoverArt {
  gradient: string;
  iconColor: string;
}

const CATEGORY_STYLES: Record<string, { gradient: string; iconColor: string }> = {
  // Muted Dusty Blue
  notes: { 
    gradient: "from-blue-300 to-cyan-300", 
    iconColor: "text-blue-900/60" 
  },
  // Muted Dusty Rose
  past_papers: { 
    gradient: "from-rose-300 to-orange-300", 
    iconColor: "text-rose-900/60" 
  },
  // Muted Lavender
  summaries: { 
    gradient: "from-violet-300 to-fuchsia-300", 
    iconColor: "text-violet-900/60" 
  },
  // Muted Sage
  guides: { 
    gradient: "from-emerald-300 to-teal-300", 
    iconColor: "text-emerald-900/60" 
  },
  // Default Muted Indigo
  default: { 
    gradient: "from-indigo-300 to-purple-300", 
    iconColor: "text-indigo-900/60" 
  },
};

export function getCoverArt(seed: string, category: string): CoverArt {
  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.default;
  return {
    gradient: style.gradient,
    iconColor: style.iconColor,
  };
}