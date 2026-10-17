const EPS = 1e-9;
export const DEFAULT_TOLERANCE = 0.1;

const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

function signedArea(points) {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const q = points[(i + 1) % points.length];
    sum += p.x * q.y - q.x * p.y;
  }
  return sum / 2;
}

const edgesOf = (points) =>
  points.map((p, i) => [p, points[(i + 1) % points.length]]);

/** Copy of the polygon with one consistent winding (clockwise on screen, y down). */
export function normalizeWinding(points) {
  const copy = points.map((p) => ({ x: p.x, y: p.y }));
  return signedArea(copy) < 0 ? copy.reverse() : copy;
}

function onSegment(a, b, p) {
  return (
    Math.min(a.x, b.x) - EPS <= p.x && p.x <= Math.max(a.x, b.x) + EPS &&
    Math.min(a.y, b.y) - EPS <= p.y && p.y <= Math.max(a.y, b.y) + EPS
  );
}

function segmentsIntersect(a, b, c, d) {
  const d1 = cross(a, b, c);
  const d2 = cross(a, b, d);
  const d3 = cross(c, d, a);
  const d4 = cross(c, d, b);
  if (((d1 > EPS && d2 < -EPS) || (d1 < -EPS && d2 > EPS)) &&
      ((d3 > EPS && d4 < -EPS) || (d3 < -EPS && d4 > EPS))) return true;
  return (
    (Math.abs(d1) <= EPS && onSegment(a, b, c)) ||
    (Math.abs(d2) <= EPS && onSegment(a, b, d)) ||
    (Math.abs(d3) <= EPS && onSegment(c, d, a)) ||
    (Math.abs(d4) <= EPS && onSegment(c, d, b))
  );
}

/** True when any two non-neighboring walls touch or cross. */
export function selfIntersects(points) {
  const n = points.length;
  const edges = edgesOf(points);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (j === i + 1 || (i === 0 && j === n - 1)) continue;
      if (segmentsIntersect(edges[i][0], edges[i][1], edges[j][0], edges[j][1])) return true;
    }
  }
  return false;
}

/** Ray-casting point test. Points exactly on the boundary may go either way. */
export function pointInPolygon(p, points) {
  let inside = false;
  for (const [a, b] of edgesOf(points)) {
    if ((a.y > p.y) !== (b.y > p.y)) {
      const x = a.x + ((p.y - a.y) / (b.y - a.y)) * (b.x - a.x);
      if (p.x < x) inside = !inside;
    }
  }
  return inside;
}

function distToSegment(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  const t = lenSq < EPS ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function distToBoundary(p, points) {
  return Math.min(...edgesOf(points).map(([a, b]) => distToSegment(p, a, b)));
}

const insideDeep = (p, points, tol) =>
  pointInPolygon(p, points) && distToBoundary(p, points) > tol;

/** Midpoints of the pieces segment a-b is cut into where it crosses the polygon's walls. */
function pieceMidpoints(a, b, points) {
  const ts = [0, 1];
  const r = { x: b.x - a.x, y: b.y - a.y };
  for (const [c, d] of edgesOf(points)) {
    const s = { x: d.x - c.x, y: d.y - c.y };
    const denom = r.x * s.y - r.y * s.x;
    if (Math.abs(denom) < EPS) continue;
    const qp = { x: c.x - a.x, y: c.y - a.y };
    const t = (qp.x * s.y - qp.y * s.x) / denom;
    const u = (qp.x * r.y - qp.y * r.x) / denom;
    if (t > 0 && t < 1 && u >= 0 && u <= 1) ts.push(t);
  }
  ts.sort((x, y) => x - y);
  const mids = [];
  for (let i = 0; i < ts.length - 1; i++) {
    if (ts[i + 1] - ts[i] < EPS) continue;
    const t = (ts[i] + ts[i + 1]) / 2;
    mids.push({ x: a.x + r.x * t, y: a.y + r.y * t });
  }
  return mids;
}

/** A point well inside the polygon (centroid of the first usable corner triangle). */
function interiorPoint(points) {
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const a = points[(i + n - 1) % n];
    const b = points[i];
    const c = points[(i + 1) % n];
    const p = { x: (a.x + b.x + c.x) / 3, y: (a.y + b.y + c.y) / 3 };
    if (pointInPolygon(p, points) && distToBoundary(p, points) > EPS) return p;
  }
  return points[0];
}

/** True when the polygons share interior area deeper than `tolerance`. Touching is not overlap. */
export function polygonsOverlap(a, b, tolerance = DEFAULT_TOLERANCE) {
  for (const [p, q] of [[a, b], [b, a]]) {
    for (const [s, e] of edgesOf(p)) {
      if (pieceMidpoints(s, e, q).some((m) => insideDeep(m, q, tolerance))) return true;
    }
    if (insideDeep(interiorPoint(p), q, tolerance)) return true;
  }
  return false;
}

/** True when `inner` lies within `outer`, allowing it to touch or exceed the boundary by `tolerance`. */
export function polygonInside(inner, outer, tolerance = DEFAULT_TOLERANCE) {
  const ok = (p) => pointInPolygon(p, outer) || distToBoundary(p, outer) <= tolerance;
  for (const [s, e] of edgesOf(inner)) {
    if (!ok(s)) return false;
    if (!pieceMidpoints(s, e, outer).every(ok)) return false;
  }
  return true;
}

/** Length of each wall; wall i runs from point i to point i+1, wrapping at the end. */
export function wallLengths(points) {
  return edgesOf(points).map(([a, b]) => Math.hypot(b.x - a.x, b.y - a.y));
}

/** Copy of the points with wall i resized by moving its later endpoint along the wall. */
export function setWallLength(points, i, length) {
  const copy = points.map((p) => ({ x: p.x, y: p.y }));
  if (!(length > 0) || !Number.isFinite(length)) return copy;
  const a = copy[i];
  const j = (i + 1) % copy.length;
  const dx = copy[j].x - a.x;
  const dy = copy[j].y - a.y;
  const len = Math.hypot(dx, dy);
  const dir = len < EPS ? { x: 1, y: 0 } : { x: dx / len, y: dy / len };
  copy[j] = { x: a.x + dir.x * length, y: a.y + dir.y * length };
  return copy;
}
