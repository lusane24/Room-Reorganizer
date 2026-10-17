/** Rotate a point about a center. Positive degrees turn clockwise on screen (y points down). */
export function rotatePoint(p, center, degrees) {
  const r = (degrees * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  return { x: center.x + dx * cos - dy * sin, y: center.y + dx * sin + dy * cos };
}

/** Bring any angle into [0, 360). Non-finite input becomes 0. */
export function normalizeAngle(degrees) {
  if (!Number.isFinite(degrees)) return 0;
  return ((degrees % 360) + 360) % 360;
}

/** Polygon approximating an ellipse centered on the origin. */
export function ellipsePolygon(width, depth, sides = 32) {
  const points = [];
  for (let k = 0; k < sides; k++) {
    const a = (2 * Math.PI * k) / sides;
    points.push({ x: (Math.cos(a) * width) / 2, y: (Math.sin(a) * depth) / 2 });
  }
  return points;
}
