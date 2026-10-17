import { localOutline } from './furnitureOutline.js';
import { normalizeAngle, rotatePoint } from './transform.js';

export const MIN_PIECE_SIZE = 6;

const clampSize = (size) => Math.max(MIN_PIECE_SIZE, size);

function extent(points, axis) {
  const values = points.map((p) => p[axis]);
  return { min: Math.min(...values), max: Math.max(...values) };
}

/**
 * Resize a piece by dragging `handle` ('n','s','e','w','ne','nw','se','sw') by `localDelta`,
 * measured along the piece's own (rotated) axes. The opposite edge stays fixed and sizes
 * never drop below MIN_PIECE_SIZE. Returns a new piece.
 */
export function resizeFurniture(f, handle, localDelta) {
  const signX = handle.includes('e') ? 1 : handle.includes('w') ? -1 : 0;
  const signY = handle.includes('s') ? 1 : handle.includes('n') ? -1 : 0;

  if (f.kind === 'polygon') return resizePolygon(f, signX, signY, localDelta);

  const growX = signX ? clampSize(f.width + signX * localDelta.x) - f.width : 0;
  const growY = signY ? clampSize(f.depth + signY * localDelta.y) - f.depth : 0;
  const width = f.width + growX;
  const depth = f.depth + growY;
  const shift = rotatePoint(
    { x: (signX * growX) / 2, y: (signY * growY) / 2 },
    { x: 0, y: 0 },
    normalizeAngle(f.rotation ?? 0),
  );

  const out = { ...f, width, depth, x: f.x + shift.x, y: f.y + shift.y };
  if (f.kind === 'lshape') {
    out.armWidth = Math.min(f.armWidth, width);
    out.armDepth = Math.min(f.armDepth, depth);
  }
  return out;
}

function resizePolygon(f, signX, signY, localDelta) {
  const pts = localOutline(f);
  const ex = extent(pts, 'x');
  const ey = extent(pts, 'y');
  const width = ex.max - ex.min;
  const depth = ey.max - ey.min;
  const newW = signX && width > 0 ? clampSize(width + signX * localDelta.x) : width;
  const newD = signY && depth > 0 ? clampSize(depth + signY * localDelta.y) : depth;
  const sx = width > 0 ? newW / width : 1;
  const sy = depth > 0 ? newD / depth : 1;
  const anchorX = signX >= 0 ? ex.min : ex.max;
  const anchorY = signY >= 0 ? ey.min : ey.max;

  return {
    ...f,
    points: pts.map((p) => ({
      x: anchorX + (p.x - anchorX) * sx,
      y: anchorY + (p.y - anchorY) * sy,
    })),
    width: newW,
    depth: newD,
  };
}
