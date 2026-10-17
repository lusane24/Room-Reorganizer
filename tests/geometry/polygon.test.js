import { describe, it, expect } from 'vitest';
import {
  normalizeWinding,
  selfIntersects,
  pointInPolygon,
  polygonsOverlap,
  polygonInside,
  wallLengths,
  setWallLength,
} from '../../src/geometry/polygon.js';

const rect = (x0, y0, x1, y1) => [
  { x: x0, y: y0 },
  { x: x1, y: y0 },
  { x: x1, y: y1 },
  { x: x0, y: y1 },
];
const L_ROOM = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 50 },
  { x: 50, y: 50 },
  { x: 50, y: 100 },
  { x: 0, y: 100 },
];
const signedArea = (pts) =>
  pts.reduce((sum, p, i) => {
    const q = pts[(i + 1) % pts.length];
    return sum + (p.x * q.y - q.x * p.y);
  }, 0) / 2;

describe('normalizeWinding', () => {
  it('gives both input windings the same (clockwise on screen) orientation', () => {
    const cw = rect(0, 0, 10, 10);
    const ccw = [...cw].reverse();
    expect(signedArea(normalizeWinding(cw))).toBeGreaterThan(0);
    expect(signedArea(normalizeWinding(ccw))).toBeGreaterThan(0);
  });

  it('does not mutate its input', () => {
    const ccw = [...rect(0, 0, 10, 10)].reverse();
    const copy = JSON.stringify(ccw);
    normalizeWinding(ccw);
    expect(JSON.stringify(ccw)).toBe(copy);
  });
});

describe('selfIntersects', () => {
  it('detects a bowtie', () => {
    const bowtie = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 10, y: 0 },
      { x: 0, y: 10 },
    ];
    expect(selfIntersects(bowtie)).toBe(true);
  });

  it('accepts a square and a concave L', () => {
    expect(selfIntersects(rect(0, 0, 10, 10))).toBe(false);
    expect(selfIntersects(L_ROOM)).toBe(false);
  });
});

describe('pointInPolygon', () => {
  it('distinguishes arm from notch of an L', () => {
    expect(pointInPolygon({ x: 25, y: 75 }, L_ROOM)).toBe(true);
    expect(pointInPolygon({ x: 75, y: 75 }, L_ROOM)).toBe(false);
  });
});

describe('polygonsOverlap', () => {
  it('treats squares sharing an edge as not overlapping', () => {
    expect(polygonsOverlap(rect(0, 0, 10, 10), rect(10, 0, 20, 10))).toBe(false);
  });

  it('detects a 1 inch overlap', () => {
    expect(polygonsOverlap(rect(0, 0, 10, 10), rect(9, 0, 19, 10))).toBe(true);
  });

  it('ignores an overlap smaller than the tolerance', () => {
    expect(polygonsOverlap(rect(0, 0, 10, 10), rect(9.95, 0, 20, 10))).toBe(false);
  });

  it('detects a plus-shaped crossing with no vertex inside the other', () => {
    expect(polygonsOverlap(rect(0, 40, 100, 60), rect(40, 0, 60, 100))).toBe(true);
  });

  it('detects identical polygons', () => {
    expect(polygonsOverlap(rect(0, 0, 10, 10), rect(0, 0, 10, 10))).toBe(true);
  });

  it('detects one polygon fully inside another', () => {
    expect(polygonsOverlap(rect(0, 0, 100, 100), rect(40, 40, 60, 60))).toBe(true);
  });

  it('reports separate polygons as not overlapping', () => {
    expect(polygonsOverlap(rect(0, 0, 10, 10), rect(50, 50, 60, 60))).toBe(false);
  });

  it('works against a concave polygon (notch of an L is empty)', () => {
    expect(polygonsOverlap(L_ROOM, rect(60, 60, 90, 90))).toBe(false);
    expect(polygonsOverlap(L_ROOM, rect(10, 60, 40, 90))).toBe(true);
  });
});

describe('polygonInside', () => {
  it('accepts a square inside the arm of an L but not one in the notch', () => {
    expect(polygonInside(rect(10, 10, 40, 90), L_ROOM)).toBe(true);
    expect(polygonInside(rect(60, 60, 90, 90), L_ROOM)).toBe(false);
  });

  it('accepts a piece flush against the walls', () => {
    expect(polygonInside(rect(0, 0, 144, 144), rect(0, 0, 144, 144))).toBe(true);
  });

  it('rejects a piece poking out of a wall', () => {
    expect(polygonInside(rect(100, 10, 150, 40), rect(0, 0, 144, 144))).toBe(false);
  });

  it('rejects a piece whose corners are inside but whose edge crosses the notch', () => {
    const triangle = [
      { x: 40, y: 10 },
      { x: 10, y: 90 },
      { x: 90, y: 40 },
    ];
    expect(polygonInside(triangle, L_ROOM)).toBe(false);
  });
});

describe('wallLengths and setWallLength', () => {
  const square = rect(0, 0, 144, 144);

  it('measures every wall', () => {
    expect(wallLengths(square)).toEqual([144, 144, 144, 144]);
  });

  it('moves the later endpoint to the typed length', () => {
    const out = setWallLength(square, 0, 100);
    expect(wallLengths(out)[0]).toBeCloseTo(100, 9);
    expect(out[0]).toEqual(square[0]);
    expect(out[1].y).toBeCloseTo(0, 9);
  });

  it('does not mutate the input', () => {
    const copy = JSON.stringify(square);
    setWallLength(square, 0, 100);
    expect(JSON.stringify(square)).toBe(copy);
  });

  it('wraps around for the last wall', () => {
    const out = setWallLength(square, 3, 100);
    expect(wallLengths(out)[3]).toBeCloseTo(100, 9);
  });
});
