import { describe, it, expect } from 'vitest';
import { computeWarnings } from '../../src/model/warnings.js';

const square = (size) => ({
  points: [{ x: 0, y: 0 }, { x: size, y: 0 }, { x: size, y: size }, { x: 0, y: size }],
});
const L_ROOM = {
  points: [
    { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 },
    { x: 50, y: 50 }, { x: 50, y: 100 }, { x: 0, y: 100 },
  ],
};
const piece = (id, x, y, overrides = {}) => ({
  id, label: id, kind: 'rect', x, y, width: 20, depth: 20, rotation: 0, ...overrides,
});
const layout = (room, furniture) => ({ id: 'l', name: 'L', room, furniture });

describe('computeWarnings', () => {
  it('returns an empty map for no furniture', () => {
    expect(computeWarnings(layout(square(144), [])).size).toBe(0);
  });

  it('does not warn about pieces flush against a wall and each other', () => {
    const l = layout(square(144), [piece('a', 10, 10), piece('b', 30, 10)]);
    expect(computeWarnings(l).size).toBe(0);
  });

  it('lists overlapping pieces on both sides', () => {
    const l = layout(square(144), [piece('a', 50, 50), piece('b', 60, 50)]);
    const w = computeWarnings(l);
    expect(w.get('a')).toEqual({ overlaps: ['b'], outside: false });
    expect(w.get('b')).toEqual({ overlaps: ['a'], outside: false });
  });

  it('flags a piece that sticks out of the room', () => {
    const l = layout(square(144), [piece('a', 140, 70)]);
    expect(computeWarnings(l).get('a')).toEqual({ overlaps: [], outside: true });
  });

  it('flags a piece sitting in the notch of an L-shaped room', () => {
    const l = layout(L_ROOM, [piece('a', 75, 75)]);
    expect(computeWarnings(l).get('a').outside).toBe(true);
  });

  it('uses the rotated outline for out-of-range angles', () => {
    // 725 degrees is the same as 5: a bar that fits mid-room pokes out once it hugs the wall.
    const room = square(100);
    const fits = layout(room, [piece('a', 50, 50, { width: 80, depth: 20, rotation: 725 })]);
    expect(computeWarnings(fits).size).toBe(0);
    const pokes = layout(room, [piece('a', 50, 10, { width: 90, depth: 20, rotation: 725 })]);
    expect(computeWarnings(pokes).get('a').outside).toBe(true);
  });
});
