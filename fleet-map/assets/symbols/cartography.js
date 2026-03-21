// ─────────────────────────────────────────────────────────
//  DASCOLA — Cartographic Chart Symbols
//  Depth soundings, boundaries, hazard areas
// ─────────────────────────────────────────────────────────

export const CARTOGRAPHY = {
  'depth-sounding': {
    name: 'Spot Depth Number',
    draw(ctx, size, color, { depth = 0, unit = 'fm' } = {}) {
      ctx.fillStyle = color || 'rgba(139,175,196,0.35)';
      ctx.font = `${Math.round(size * 0.7)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${depth}`, 0, 0);
    },
  },

  'shipping-lane': {
    name: 'Traffic Separation Line',
    drawLine(ctx, points, size, color) {
      if (points.length < 2) return;
      ctx.setLineDash([size * 1.5, size]);
      ctx.strokeStyle = color || 'rgba(180,120,200,0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    },
  },

  'boundary': {
    name: 'Jurisdictional Boundary',
    drawLine(ctx, points, size, color) {
      if (points.length < 2) return;
      ctx.setLineDash([size * 2, size * 0.5, size * 0.5, size * 0.5]);
      ctx.strokeStyle = color || 'rgba(200,168,76,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    },
  },

  'hazard-area': {
    name: 'Hatched Danger Zone',
    drawArea(ctx, points, size, color) {
      if (points.length < 3) return;
      ctx.save();
      // Clip to area
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
      }
      ctx.closePath();
      ctx.clip();
      // Cross-hatch fill
      ctx.strokeStyle = color || 'rgba(200,60,60,0.15)';
      ctx.lineWidth = 0.5;
      const bounds = getBounds(points);
      const step = size * 1.5;
      for (let x = bounds.minX - bounds.h; x < bounds.maxX + bounds.h; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, bounds.minY);
        ctx.lineTo(x + bounds.h, bounds.maxY);
        ctx.stroke();
      }
      ctx.restore();
      // Outline
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
      }
      ctx.closePath();
      ctx.strokeStyle = color || 'rgba(200,60,60,0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
    },
  },

  'fishing-ground': {
    name: 'Named Fishing Area',
    drawArea(ctx, points, size, color, { name = '' } = {}) {
      if (points.length < 3) return;
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
      }
      ctx.closePath();
      ctx.fillStyle = color || 'rgba(201,168,76,0.04)';
      ctx.fill();
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = color || 'rgba(201,168,76,0.15)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.setLineDash([]);
      // Name label
      if (name) {
        const center = getCenter(points);
        ctx.fillStyle = color || 'rgba(201,168,76,0.12)';
        ctx.font = `italic ${Math.round(size * 0.8)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name, center[0], center[1]);
      }
    },
  },

  'restricted-area': {
    name: 'Restricted / Prohibited Zone',
    drawArea(ctx, points, size, color) {
      if (points.length < 3) return;
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(200,60,60,0.05)';
      ctx.fill();
      ctx.strokeStyle = color || 'rgba(200,60,60,0.3)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([6, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    },
  },

  'anchorage-area': {
    name: 'Designated Anchorage Boundary',
    drawArea(ctx, points, size, color) {
      if (points.length < 3) return;
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(201,168,76,0.03)';
      ctx.fill();
      ctx.strokeStyle = color || 'rgba(201,168,76,0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    },
  },
};

function getBounds(points) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

function getCenter(points) {
  let sx = 0, sy = 0;
  for (const [x, y] of points) { sx += x; sy += y; }
  return [sx / points.length, sy / points.length];
}
