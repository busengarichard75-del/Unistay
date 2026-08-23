// Shared transition configuration – ensures consistency across pages
export const pageTransition = {
  initial: { opacity: 0, scale: 0.97, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 8 },
  transition: {
    duration: 0.45,
    ease: [0.4, 0, 0.2, 1],
  },
};

// Subtle colour shift during transition (used in the wrapper)
export const colorShiftGradient = "from-blue-50 via-indigo-50 to-purple-50";