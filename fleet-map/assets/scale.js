// ─────────────────────────────────────────────────────────
//  DASCOLA — Nautical Asset Scale System
//  Standardized sizing for all map symbols across zoom/canvas sizes
// ─────────────────────────────────────────────────────────

const REFERENCE_WIDTH = 1200;

export const SCALE = {
  vessel:  { xs: 6, sm: 10, md: 16, lg: 24, xl: 36 },
  port:    { sm: 4, md: 8,  lg: 14 },
  marker:  { sm: 8, md: 12, lg: 18 },
  icon:    { sm: 10, md: 16, lg: 24 },
  text:    { xs: 7, sm: 9, md: 11, lg: 14, xl: 18 },
};

const DEFAULT_EMPHASIS = {
  vessel: 1.0,
  port:   1.5,
  marker: 1.0,
  icon:   1.0,
  text:   1.0,
};

/**
 * Get pixel size for a category/size at a given canvas width
 */
export function scaleFor(category, size, canvasWidth) {
  const base = SCALE[category];
  if (!base || base[size] == null) return 12;
  return base[size] * (canvasWidth / REFERENCE_WIDTH);
}

/**
 * Get artistic emphasis multiplier for a category from a theme
 */
export function emphasisFor(category, theme) {
  if (theme && theme.emphasis && theme.emphasis[category] != null) {
    return theme.emphasis[category];
  }
  return DEFAULT_EMPHASIS[category] || 1.0;
}

/**
 * Combined: scale * emphasis
 */
export function scaledSize(category, size, canvasWidth, theme) {
  return scaleFor(category, size, canvasWidth) * emphasisFor(category, theme);
}

/**
 * Responsive text size with min/max clamping
 */
export function textSize(size, canvasWidth, theme) {
  const s = scaledSize('text', size, canvasWidth, theme);
  return Math.max(7, Math.min(s, 22));
}
