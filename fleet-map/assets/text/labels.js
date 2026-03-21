// ─────────────────────────────────────────────────────────
//  DASCOLA — Typography & Label System
//  Standardized text rendering for all map label types
// ─────────────────────────────────────────────────────────

import { textSize } from '../scale.js';

/**
 * Label type definitions with default styling
 */
export const LABEL_TYPES = {
  'water-body': {
    sizeKey: 'lg',
    alpha: 0.08,
    fontType: 'display',
    transform: 'wide-track',
    baseline: 'middle',
    align: 'center',
  },
  'land-mass': {
    sizeKey: 'lg',
    alpha: 0.35,
    fontType: 'display',
    transform: 'wide-track',
    baseline: 'middle',
    align: 'center',
  },
  'port-name': {
    sizeKey: 'sm',
    alpha: 0.65,
    fontType: 'sans',
    transform: 'uppercase',
    baseline: 'middle',
    align: 'left',
  },
  'vessel-name': {
    sizeKey: 'xs',
    alpha: 0.3,
    fontType: 'sans',
    transform: 'none',
    baseline: 'top',
    align: 'center',
  },
  'depth-sounding': {
    sizeKey: 'xs',
    alpha: 0.2,
    fontType: 'sans',
    transform: 'none',
    baseline: 'middle',
    align: 'center',
  },
  'coordinate': {
    sizeKey: 'xs',
    alpha: 0.15,
    fontType: 'sans',
    transform: 'none',
    baseline: 'middle',
    align: 'center',
  },
  'fishing-ground': {
    sizeKey: 'sm',
    alpha: 0.12,
    fontType: 'sans',
    transform: 'italic',
    baseline: 'middle',
    align: 'center',
  },
  'warning': {
    sizeKey: 'md',
    alpha: 0.9,
    fontType: 'sans',
    transform: 'uppercase-bold',
    baseline: 'middle',
    align: 'center',
  },
  'route-name': {
    sizeKey: 'xs',
    alpha: 0.25,
    fontType: 'sans',
    transform: 'none',
    baseline: 'top',
    align: 'left',
  },
  'title': {
    sizeKey: 'xl',
    alpha: 0.6,
    fontType: 'display',
    transform: 'none',
    baseline: 'top',
    align: 'left',
  },
  'subtitle': {
    sizeKey: 'sm',
    alpha: 0.3,
    fontType: 'sans',
    transform: 'uppercase',
    baseline: 'top',
    align: 'left',
  },
};

/**
 * Apply wide tracking to a string
 */
function wideTrack(str) {
  return str.split('').join(' ');
}

/**
 * Transform text based on label type
 */
function transformText(text, transform) {
  switch (transform) {
    case 'wide-track':    return wideTrack(text.toUpperCase());
    case 'uppercase':     return text.toUpperCase();
    case 'uppercase-bold':return text.toUpperCase();
    case 'italic':        return text;
    default:              return text;
  }
}

/**
 * Build CSS font string for a label type
 */
function buildFont(type, fontSize, fonts) {
  const def = LABEL_TYPES[type];
  if (!def) return `${fontSize}px sans-serif`;
  const family = def.fontType === 'display' ? fonts.display : fonts.sans;
  const prefix = def.transform === 'uppercase-bold' ? 'bold ' :
                 def.transform === 'italic' ? 'italic ' : '';
  return `${prefix}${fontSize}px ${family}`;
}

/**
 * Draw a label on the canvas
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} type — label type key from LABEL_TYPES
 * @param {string} text — raw text to render
 * @param {number} x — screen x
 * @param {number} y — screen y
 * @param {object} opts — { canvasWidth, fonts, color, theme, rotation }
 */
export function drawLabel(ctx, type, text, x, y, opts = {}) {
  const def = LABEL_TYPES[type];
  if (!def) return;

  const { canvasWidth = 1200, fonts = {}, color, theme, rotation } = opts;
  const fontSize = textSize(def.sizeKey, canvasWidth, theme);
  const displayText = transformText(text, def.transform);

  ctx.save();
  ctx.translate(x, y);
  if (rotation) ctx.rotate(rotation);

  ctx.font = buildFont(type, fontSize, fonts);
  ctx.textAlign = def.align;
  ctx.textBaseline = def.baseline;
  ctx.globalAlpha = def.alpha;
  ctx.fillStyle = color || '#fff';
  ctx.fillText(displayText, 0, 0);

  ctx.restore();
}

/**
 * Measure label width for layout calculations
 */
export function measureLabel(ctx, type, text, opts = {}) {
  const def = LABEL_TYPES[type];
  if (!def) return 0;
  const { canvasWidth = 1200, fonts = {}, theme } = opts;
  const fontSize = textSize(def.sizeKey, canvasWidth, theme);
  const displayText = transformText(text, def.transform);
  ctx.save();
  ctx.font = buildFont(type, fontSize, fonts);
  const w = ctx.measureText(displayText).width;
  ctx.restore();
  return w;
}
