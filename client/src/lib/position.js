// client/src/lib/position.js
/**
 * Client-side fractional position midpoint calculator (matches server formula)
 */
export const calcPosition = (before, after) => {
  if (before != null && after != null) return (before + after) / 2;
  if (before != null) return before + 1024;
  if (after != null) return after / 2;
  return 1024;
};
