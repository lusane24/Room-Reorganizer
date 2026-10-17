import { describe, it, expect } from 'vitest';
import { rotatePoint, normalizeAngle, ellipsePolygon } from '../../src/geometry/transform.js';

describe('normalizeAngle', () => {
  it.each([
    [-30, 330],
    [360, 0],
    [725, 5],
    [0, 0],
    [90, 90],
  ])('normalizes %d to %d', (input, expected) => {
    expect(normalizeAngle(input)).toBe(expected);
  });

  it('falls back to 0 for non-finite input', () => {
    expect(normalizeAngle(NaN)).toBe(0);
    expect(normalizeAngle(Infinity)).toBe(0);
  });
});

describe('rotatePoint', () => {
  it('rotates 90 degrees clockwise on screen (y down)', () => {
    const p = rotatePoint({ x: 1, y: 0 }, { x: 0, y: 0 }, 90);
    expect(p.x).toBeCloseTo(0, 9);
    expect(p.y).toBeCloseTo(1, 9);
  });

  it('rotates about a non-origin center', () => {
    const p = rotatePoint({ x: 12, y: 10 }, { x: 10, y: 10 }, 180);
    expect(p.x).toBeCloseTo(8, 9);
    expect(p.y).toBeCloseTo(10, 9);
  });
});

describe('ellipsePolygon', () => {
  it('has 32 sides by default and spans the width and depth', () => {
    const pts = ellipsePolygon(10, 6);
    expect(pts).toHaveLength(32);
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    expect(Math.max(...xs)).toBeCloseTo(5, 9);
    expect(Math.max(...ys)).toBeCloseTo(3, 1);
  });
});
