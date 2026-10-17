import { ellipsePolygon, normalizeAngle, rotatePoint } from './transform.js';

const ORIGIN = { x: 0, y: 0 };

/** Outline of a piece around its own center, before rotation. */
export function localOutline(f) {
  const hw = f.width / 2;
  const hd = f.depth / 2;
  switch (f.kind) {
    case 'ellipse':
      return ellipsePolygon(f.width, f.depth);
    case 'lshape':
      return [
        { x: -hw, y: -hd },
        { x: -hw + f.armWidth, y: -hd },
        { x: -hw + f.armWidth, y: hd - f.armDepth },
        { x: hw, y: hd - f.armDepth },
        { x: hw, y: hd },
        { x: -hw, y: hd },
      ];
    case 'polygon':
      return f.points.map((p) => ({ x: p.x, y: p.y }));
    case 'rect':
    default:
      return [
        { x: -hw, y: -hd },
        { x: hw, y: -hd },
        { x: hw, y: hd },
        { x: -hw, y: hd },
      ];
  }
}

/** World-space polygon of a piece: shape, then rotation, then position. */
export function furnitureOutline(f) {
  const angle = normalizeAngle(f.rotation ?? 0);
  return localOutline(f).map((p) => {
    const r = rotatePoint(p, ORIGIN, angle);
    return { x: r.x + f.x, y: r.y + f.y };
  });
}

/** Bounding box of a piece in its own (unrotated) coordinates around its center. */
export function localBounds(f) {
  if (f.kind === 'polygon') {
    const xs = f.points.map((p) => p.x);
    const ys = f.points.map((p) => p.y);
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
  }
  return { minX: -f.width / 2, maxX: f.width / 2, minY: -f.depth / 2, maxY: f.depth / 2 };
}
