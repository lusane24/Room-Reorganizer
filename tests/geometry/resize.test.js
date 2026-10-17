import { describe, it, expect } from 'vitest';
import { resizeFurniture, MIN_PIECE_SIZE } from '../../src/geometry/resize.js';
import { furnitureOutline } from '../../src/geometry/furnitureOutline.js';

const piece = (overrides) => ({
  id: 'f1', label: 'Bed', kind: 'rect', x: 100, y: 100, width: 60, depth: 80, rotation: 0, ...overrides,
});

describe('resizeFurniture', () => {
  it('grows width from the east handle and keeps the west edge fixed', () => {
    const out = resizeFurniture(piece(), 'e', { x: 10, y: 0 });
    expect(out.width).toBe(70);
    expect(out.x).toBeCloseTo(105, 9);
    expect(out.y).toBeCloseTo(100, 9);
  });

  it('works along the rotated local axis', () => {
    const out = resizeFurniture(piece({ rotation: 90 }), 'e', { x: 10, y: 0 });
    expect(out.width).toBe(70);
    expect(out.x).toBeCloseTo(100, 9);
    expect(out.y).toBeCloseTo(105, 9);
  });

  it('moves the center the other way for the west handle', () => {
    const out = resizeFurniture(piece(), 'w', { x: 10, y: 0 });
    expect(out.width).toBe(50);
    expect(out.x).toBeCloseTo(105, 9);
  });

  it('resizes both axes from a corner handle', () => {
    const out = resizeFurniture(piece(), 'se', { x: 10, y: 20 });
    expect(out.width).toBe(70);
    expect(out.depth).toBe(100);
    expect(out.x).toBeCloseTo(105, 9);
    expect(out.y).toBeCloseTo(110, 9);
  });

  it('clamps to the minimum size and moves the center only by what changed', () => {
    const out = resizeFurniture(piece(), 'e', { x: -500, y: 0 });
    expect(MIN_PIECE_SIZE).toBe(6);
    expect(out.width).toBe(6);
    expect(out.x).toBeCloseTo(100 + (6 - 60) / 2, 9);
  });

  it('does not mutate the input', () => {
    const f = piece();
    const copy = JSON.stringify(f);
    resizeFurniture(f, 'e', { x: 10, y: 0 });
    expect(JSON.stringify(f)).toBe(copy);
  });

  it('preserves L-shape arm thickness', () => {
    const f = piece({ kind: 'lshape', armWidth: 20, armDepth: 25 });
    const out = resizeFurniture(f, 'e', { x: 10, y: 0 });
    expect(out.armWidth).toBe(20);
    expect(out.armDepth).toBe(25);
  });

  it('scales polygon points and keeps the opposite edge in place', () => {
    const f = piece({
      kind: 'polygon',
      points: [{ x: -30, y: -30 }, { x: 30, y: -30 }, { x: 30, y: 30 }, { x: -30, y: 30 }],
      width: 60,
      depth: 60,
    });
    const out = resizeFurniture(f, 'e', { x: 30, y: 0 });
    const xs = furnitureOutline(out).map((p) => p.x);
    expect(Math.min(...xs)).toBeCloseTo(70, 9);
    expect(Math.max(...xs)).toBeCloseTo(160, 9);
    expect(out.width).toBeCloseTo(90, 9);
  });
});
