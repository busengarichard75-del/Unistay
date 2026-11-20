// src/lib/coverArt.ts
export interface CoverArt {
  gradient: string;
  solidColor: string;
  iconColor: string;
}

const CATEGORY_STYLES: Record<string, { gradient: string; solidColor: string; iconColor: string }> = {
  notes: { 
    gradient: "from-blue-500 to-blue-700", 
    solidColor: "bg-blue-600",
    iconColor: "text-blue-100" 
  },
  past_papers: { 
    gradient: "from-rose-500 to-rose-700", 
    solidColor: "bg-rose-600",
    iconColor: "text-rose-100" 
  },
  summaries: { 
    gradient: "from-amber-400 to-amber-600", 
    solidColor: "bg-amber-500",
    iconColor: "text-amber-100" 
  },
  guides: { 
    gradient: "from-emerald-500 to-emerald-700", 
    solidColor: "bg-emerald-600",
    iconColor: "text-emerald-100" 
  },
  default: { 
    gradient: "from-indigo-500 to-indigo-700", 
    solidColor: "bg-indigo-600",
    iconColor: "text-indigo-100" 
  },
};

export function getCoverArt(seed: string, category: string): CoverArt {
  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.default;
  return {
    gradient: style.gradient,
    solidColor: style.solidColor,
    iconColor: style.iconColor,
  };
}