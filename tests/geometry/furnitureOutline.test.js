import { describe, it, expect } from 'vitest';
import { furnitureOutline, localBounds } from '../../src/geometry/furnitureOutline.js';

const bbox = (pts) => ({
  minX: Math.min(...pts.map((p) => p.x)),
  maxX: Math.max(...pts.map((p) => p.x)),
  minY: Math.min(...pts.map((p) => p.y)),
  maxY: Math.max(...pts.map((p) => p.y)),
});
const area = (pts) =>
  Math.abs(
    pts.reduce((s, p, i) => {
      const q = pts[(i + 1) % pts.length];
      return s + (p.x * q.y - q.x * p.y);
    }, 0) / 2,
  );
const piece = (overrides) => ({
  id: 'f1', label: 'Bed', kind: 'rect', x: 100, y: 100, width: 60, depth: 80, rotation: 0, ...overrides,
});

describe('furnitureOutline', () => {
  it('places an unrotated rect around its center', () => {
    const b = bbox(furnitureOutline(piece()));
    expect(b).toEqual({ minX: 70, maxX: 130, minY: 60, maxY: 140 });
  });

  it('swaps the extents when rotated 90 degrees', () => {
    const b = bbox(furnitureOutline(piece({ rotation: 90 })));
    expect(b.minX).toBeCloseTo(60, 9);
    expect(b.maxX).toBeCloseTo(140, 9);
    expect(b.minY).toBeCloseTo(70, 9);
    expect(b.maxY).toBeCloseTo(130, 9);
  });

  it('uses the normalized angle for out-of-range rotations', () => {
    const a = furnitureOutline(piece({ rotation: 725 }));
    const b = furnitureOutline(piece({ rotation: 5 }));
    a.forEach((p, i) => {
      expect(p.x).toBeCloseTo(b[i].x, 9);
      expect(p.y).toBeCloseTo(b[i].y, 9);
    });
  });

  it('builds a 6 point L-shape with the expected area', () => {
    const f = piece({ kind: 'lshape', width: 60, depth: 80, armWidth: 20, armDepth: 25 });
    const pts = furnitureOutline(f);
    expect(pts).toHaveLength(6);
    expect(area(pts)).toBeCloseTo(60 * 80 - (60 - 20) * (80 - 25), 9);
  });

  it('builds a 32 sided ellipse', () => {
    expect(furnitureOutline(piece({ kind: 'ellipse' }))).toHaveLength(32);
  });

  it('offsets polygon points from the center', () => {
    const f = piece({
      kind: 'polygon',
      points: [{ x: -10, y: -10 }, { x: 10, y: -10 }, { x: 0, y: 10 }],
      rotation: 0,
    });
    expect(furnitureOutline(f)).toEqual([
      { x: 90, y: 90 }, { x: 110, y: 90 }, { x: 100, y: 110 },
    ]);
  });
});

describe('localBounds', () => {
  it('is centered on the origin for a rect', () => {
    expect(localBounds(piece())).toEqual({ minX: -30, maxX: 30, minY: -40, maxY: 40 });
  });

  it('follows the points of a polygon', () => {
    const f = piece({ kind: 'polygon', points: [{ x: -5, y: -2 }, { x: 20, y: -2 }, { x: 4, y: 9 }] });
    expect(localBounds(f)).toEqual({ minX: -5, maxX: 20, minY: -2, maxY: 9 });
  });
});
