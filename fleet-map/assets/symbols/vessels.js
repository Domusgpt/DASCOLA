// ─────────────────────────────────────────────────────────
//  DASCOLA — Vessel Symbol Definitions
//  Procedural canvas draw functions for fishing vessel types
//  Each vessel provides: drawTopDown, drawProfile, drawIcon
// ─────────────────────────────────────────────────────────

function drawTriangleTopDown(ctx, size, heading, color) {
  const h = size, w = size * 0.6;
  ctx.beginPath();
  ctx.moveTo(0, -h / 2);
  ctx.lineTo(-w / 2, h / 2);
  ctx.lineTo(w / 2, h / 2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

export const VESSELS = {
  trawler: {
    name: 'Trawler',
    drawTopDown(ctx, size, heading, color) {
      const h = size, w = size * 0.45;
      ctx.beginPath();
      // Hull — rounded bow, wide stern
      ctx.moveTo(0, -h * 0.5);
      ctx.bezierCurveTo(-w * 0.3, -h * 0.3, -w * 0.5, -h * 0.1, -w * 0.5, h * 0.15);
      ctx.lineTo(-w * 0.45, h * 0.45);
      ctx.lineTo(w * 0.45, h * 0.45);
      ctx.lineTo(w * 0.5, h * 0.15);
      ctx.bezierCurveTo(w * 0.5, -h * 0.1, w * 0.3, -h * 0.3, 0, -h * 0.5);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
      // Outrigger booms
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.05);
      ctx.lineTo(-size * 0.7, h * 0.1);
      ctx.moveTo(0, -h * 0.05);
      ctx.lineTo(size * 0.7, h * 0.1);
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha = 1;
    },
    drawProfile(ctx, size, heading, color) {
      const h = size * 0.6, w = size;
      ctx.beginPath();
      // Hull side view
      ctx.moveTo(-w * 0.5, 0);
      ctx.quadraticCurveTo(-w * 0.4, h * 0.4, -w * 0.1, h * 0.35);
      ctx.lineTo(w * 0.35, h * 0.3);
      ctx.quadraticCurveTo(w * 0.5, h * 0.15, w * 0.45, 0);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      // Cabin
      ctx.fillRect(-w * 0.15, -h * 0.35, w * 0.25, h * 0.35);
      // Mast
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.35);
      ctx.lineTo(0, -h * 0.7);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();
      // Outrigger boom
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.5);
      ctx.lineTo(w * 0.45, -h * 0.15);
      ctx.stroke();
    },
    drawIcon(ctx, size, heading, color) {
      drawTriangleTopDown(ctx, size, heading, color);
      // Add small boom lines
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.1);
      ctx.lineTo(-size * 0.5, size * 0.15);
      ctx.moveTo(0, -size * 0.1);
      ctx.lineTo(size * 0.5, size * 0.15);
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.8;
      ctx.globalAlpha = 0.6;
      ctx.stroke();
      ctx.globalAlpha = 1;
    },
  },

  longliner: {
    name: 'Longliner',
    drawTopDown(ctx, size, heading, color) {
      const h = size, w = size * 0.35;
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.5);
      ctx.bezierCurveTo(-w * 0.4, -h * 0.25, -w * 0.5, 0, -w * 0.45, h * 0.4);
      ctx.lineTo(w * 0.45, h * 0.4);
      ctx.bezierCurveTo(w * 0.5, 0, w * 0.4, -h * 0.25, 0, -h * 0.5);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
      // Longline trailing astern
      ctx.beginPath();
      ctx.moveTo(0, h * 0.4);
      ctx.lineTo(0, h * 0.8);
      ctx.setLineDash([2, 3]);
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 0.7;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    },
    drawProfile(ctx, size, heading, color) {
      const h = size * 0.55, w = size;
      ctx.beginPath();
      ctx.moveTo(-w * 0.5, 0);
      ctx.quadraticCurveTo(-w * 0.35, h * 0.35, 0, h * 0.3);
      ctx.lineTo(w * 0.4, h * 0.2);
      ctx.quadraticCurveTo(w * 0.5, h * 0.05, w * 0.45, -h * 0.05);
      ctx.lineTo(-w * 0.45, 0);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.fillRect(-w * 0.1, -h * 0.4, w * 0.2, h * 0.4);
    },
    drawIcon: drawTriangleTopDown,
  },

  scalloper: {
    name: 'Scalloper',
    drawTopDown(ctx, size, heading, color) {
      const h = size * 0.9, w = size * 0.55;
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.5);
      ctx.bezierCurveTo(-w * 0.3, -h * 0.3, -w * 0.55, -h * 0.05, -w * 0.55, h * 0.2);
      ctx.lineTo(-w * 0.5, h * 0.45);
      ctx.lineTo(w * 0.5, h * 0.45);
      ctx.lineTo(w * 0.55, h * 0.2);
      ctx.bezierCurveTo(w * 0.55, -h * 0.05, w * 0.3, -h * 0.3, 0, -h * 0.5);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
      // Dredge gear boom
      ctx.beginPath();
      ctx.moveTo(0, h * 0.1);
      ctx.lineTo(size * 0.6, h * 0.35);
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.globalAlpha = 1;
    },
    drawProfile(ctx, size, heading, color) {
      const h = size * 0.6, w = size;
      ctx.beginPath();
      ctx.moveTo(-w * 0.45, 0);
      ctx.quadraticCurveTo(-w * 0.3, h * 0.4, 0, h * 0.35);
      ctx.lineTo(w * 0.35, h * 0.3);
      ctx.quadraticCurveTo(w * 0.5, h * 0.1, w * 0.45, 0);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.fillRect(-w * 0.2, -h * 0.3, w * 0.3, h * 0.3);
      // Dredge A-frame
      ctx.beginPath();
      ctx.moveTo(w * 0.2, -h * 0.3);
      ctx.lineTo(w * 0.35, -h * 0.6);
      ctx.lineTo(w * 0.5, -h * 0.15);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();
    },
    drawIcon: drawTriangleTopDown,
  },

  gillnetter: {
    name: 'Gillnetter',
    drawTopDown(ctx, size, heading, color) {
      const h = size, w = size * 0.4;
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.48);
      ctx.bezierCurveTo(-w * 0.35, -h * 0.25, -w * 0.5, 0, -w * 0.45, h * 0.4);
      ctx.lineTo(w * 0.45, h * 0.4);
      ctx.bezierCurveTo(w * 0.5, 0, w * 0.35, -h * 0.25, 0, -h * 0.48);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
      // Net reel circle
      ctx.beginPath();
      ctx.arc(0, h * 0.15, size * 0.1, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.globalAlpha = 1;
    },
    drawProfile(ctx, size, heading, color) {
      const h = size * 0.55, w = size;
      ctx.beginPath();
      ctx.moveTo(-w * 0.45, 0);
      ctx.quadraticCurveTo(-w * 0.3, h * 0.35, 0, h * 0.3);
      ctx.lineTo(w * 0.35, h * 0.25);
      ctx.quadraticCurveTo(w * 0.5, h * 0.1, w * 0.4, 0);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.fillRect(-w * 0.1, -h * 0.35, w * 0.18, h * 0.35);
      // Net reel
      ctx.beginPath();
      ctx.arc(w * 0.2, -h * 0.1, size * 0.08, 0, Math.PI * 2);
      ctx.stroke();
    },
    drawIcon: drawTriangleTopDown,
  },

  lobster: {
    name: 'Lobster Boat',
    drawTopDown(ctx, size, heading, color) {
      const h = size * 0.85, w = size * 0.38;
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.5);
      ctx.bezierCurveTo(-w * 0.3, -h * 0.3, -w * 0.45, 0, -w * 0.4, h * 0.35);
      ctx.quadraticCurveTo(0, h * 0.5, w * 0.4, h * 0.35);
      ctx.bezierCurveTo(w * 0.45, 0, w * 0.3, -h * 0.3, 0, -h * 0.5);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
    },
    drawProfile(ctx, size, heading, color) {
      const h = size * 0.5, w = size * 0.9;
      ctx.beginPath();
      ctx.moveTo(-w * 0.45, 0);
      ctx.quadraticCurveTo(-w * 0.3, h * 0.35, 0, h * 0.3);
      ctx.lineTo(w * 0.3, h * 0.25);
      ctx.quadraticCurveTo(w * 0.45, h * 0.1, w * 0.4, 0);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      // Small cabin
      ctx.fillRect(-w * 0.05, -h * 0.3, w * 0.15, h * 0.3);
    },
    drawIcon: drawTriangleTopDown,
  },

  cargo: {
    name: 'Cargo',
    drawTopDown(ctx, size, heading, color) {
      const h = size * 1.1, w = size * 0.4;
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.5);
      ctx.lineTo(-w * 0.4, -h * 0.3);
      ctx.lineTo(-w * 0.5, h * 0.35);
      ctx.lineTo(-w * 0.4, h * 0.45);
      ctx.lineTo(w * 0.4, h * 0.45);
      ctx.lineTo(w * 0.5, h * 0.35);
      ctx.lineTo(w * 0.4, -h * 0.3);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
      // Hold hatches
      for (let i = 0; i < 3; i++) {
        const y = -h * 0.15 + i * h * 0.18;
        ctx.strokeRect(-w * 0.25, y, w * 0.5, h * 0.1);
      }
    },
    drawProfile(ctx, size, heading, color) {
      const h = size * 0.55, w = size * 1.1;
      ctx.beginPath();
      ctx.moveTo(-w * 0.5, 0);
      ctx.lineTo(-w * 0.4, h * 0.3);
      ctx.lineTo(w * 0.4, h * 0.25);
      ctx.lineTo(w * 0.5, 0);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      // Superstructure at stern
      ctx.fillRect(w * 0.2, -h * 0.5, w * 0.2, h * 0.5);
      // Crane
      ctx.beginPath();
      ctx.moveTo(-w * 0.1, -h * 0.05);
      ctx.lineTo(-w * 0.1, -h * 0.5);
      ctx.lineTo(w * 0.1, -h * 0.35);
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    },
    drawIcon: drawTriangleTopDown,
  },

  sailboat: {
    name: 'Sailboat',
    drawTopDown(ctx, size, heading, color) {
      const h = size, w = size * 0.3;
      // Hull
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.5);
      ctx.bezierCurveTo(-w * 0.4, -h * 0.2, -w * 0.5, h * 0.1, 0, h * 0.45);
      ctx.bezierCurveTo(w * 0.5, h * 0.1, w * 0.4, -h * 0.2, 0, -h * 0.5);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
    },
    drawProfile(ctx, size, heading, color) {
      const h = size * 0.8, w = size;
      // Hull
      ctx.beginPath();
      ctx.moveTo(-w * 0.4, 0);
      ctx.quadraticCurveTo(-w * 0.2, h * 0.35, w * 0.1, h * 0.3);
      ctx.quadraticCurveTo(w * 0.4, h * 0.15, w * 0.35, 0);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      // Mast
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -h * 0.9);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();
      // Sail
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.85);
      ctx.quadraticCurveTo(w * 0.35, -h * 0.4, 0, h * 0.05);
      ctx.closePath();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = color;
      ctx.fill();
      ctx.globalAlpha = 1;
    },
    drawIcon: drawTriangleTopDown,
  },

  generic: {
    name: 'Generic',
    drawTopDown: drawTriangleTopDown,
    drawProfile(ctx, size, heading, color) {
      const h = size * 0.5, w = size * 0.8;
      ctx.beginPath();
      ctx.moveTo(-w * 0.4, 0);
      ctx.lineTo(-w * 0.2, h * 0.3);
      ctx.lineTo(w * 0.3, h * 0.25);
      ctx.lineTo(w * 0.4, 0);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    },
    drawIcon: drawTriangleTopDown,
  },
};

/**
 * Map vessel type strings to symbol IDs
 */
export const VESSEL_TYPE_MAP = {
  'Trawler':    'trawler',
  'Dragger':    'trawler',
  'Longliner':  'longliner',
  'Scalloper':  'scalloper',
  'Gillnetter': 'gillnetter',
  'Lobster':    'lobster',
  'Pot Boat':   'lobster',
  'Cargo':      'cargo',
  'Freighter':  'cargo',
  'Sailboat':   'sailboat',
  'Sailing':    'sailboat',
};

/**
 * Resolve a vessel type to a symbol object, falling back to generic
 */
export function getVesselSymbol(type) {
  const id = VESSEL_TYPE_MAP[type] || 'generic';
  return VESSELS[id] || VESSELS.generic;
}
