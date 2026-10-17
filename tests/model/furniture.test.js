import { describe, it, expect } from 'vitest';
import { createFurniture, createFromPreset, updateFurniture, isValidPolygonShape } from '../../src/model/furniture.js';
import { PRESETS } from '../../src/model/presets.js';

describe('createFurniture', () => {
  it('creates a labeled rect with defaults', () => {
    const f = createFurniture('rect');
    expect(f.label).toBe('Furniture');
    expect(f.rotation).toBe(0);
    expect(f.id).toBeTruthy();
  });

  it('gives L-shapes arms of one third of the size', () => {
    const f = createFurniture('lshape', { width: 60, depth: 90 });
    expect(f.armWidth).toBe(20);
    expect(f.armDepth).toBe(30);
  });

  it('starts a polygon as four rectangle points', () => {
    const f = createFurniture('polygon');
    expect(f.points).toHaveLength(4);
  });

  it('gives each piece a unique id', () => {
    expect(createFurniture('rect').id).not.toBe(createFurniture('rect').id);
  });
});

describe('createFromPreset', () => {
  it('creates a queen bed at 60 by 80', () => {
    const queen = PRESETS.find((p) => p.id === 'queen-bed');
    const f = createFromPreset(queen);
    expect(f.label).toBe('Queen bed');
    expect(f.width).toBe(60);
    expect(f.depth).toBe(80);
  });
});

describe('updateFurniture', () => {
  const base = () => createFurniture('rect', { width: 60, depth: 80 });

  it('falls back to "Furniture" for a blank label', () => {
    expect(updateFurniture(base(), { label: '   ' }).label).toBe('Furniture');
  });

  it('trims labels', () => {
    expect(updateFurniture(base(), { label: '  Bed ' }).label).toBe('Bed');
  });

  it.each([NaN, Infinity, 'abc', undefined, null])('ignores invalid width %s', (w) => {
    expect(updateFurniture(base(), { width: w }).width).toBe(60);
  });

  it('clamps sizes to the 6 inch minimum', () => {
    const out = updateFurniture(base(), { width: 2, depth: -4 });
    expect(out.width).toBe(6);
    expect(out.depth).toBe(6);
  });

  it('normalizes rotation', () => {
    expect(updateFurniture(base(), { rotation: 725 }).rotation).toBe(5);
    expect(updateFurniture(base(), { rotation: -30 }).rotation).toBe(330);
  });

  it('ignores a non-finite rotation', () => {
    expect(updateFurniture(base(), { rotation: NaN }).rotation).toBe(0);
  });

  it('keeps arm thickness within the piece', () => {
    const f = createFurniture('lshape', { width: 60, depth: 60 });
    expect(updateFurniture(f, { armWidth: 500 }).armWidth).toBe(60);
  });

  it('scales polygon points about the center when width changes', () => {
    const f = createFurniture('polygon', { width: 48, depth: 30 });
    const out = updateFurniture(f, { width: 96 });
    const xs = out.points.map((p) => p.x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(96, 9);
    expect(out.width).toBeCloseTo(96, 9);
    expect(out.x).toBe(f.x);
  });

  it('does not mutate its input', () => {
    const f = base();
    const copy = JSON.stringify(f);
    updateFurniture(f, { label: 'x', width: 100 });
    expect(JSON.stringify(f)).toBe(copy);
  });
});

describe('isValidPolygonShape', () => {
  const rect = [{ x: -24, y: -15 }, { x: 24, y: -15 }, { x: 24, y: 15 }, { x: -24, y: 15 }];

  it('accepts a normal shape', () => {
    expect(isValidPolygonShape(rect)).toBe(true);
  });

  it('rejects a shape that crosses itself', () => {
    expect(isValidPolygonShape([rect[0], rect[2], rect[1], rect[3]])).toBe(false);
  });

  it('rejects a shape thinner than the 6 inch minimum', () => {
    expect(isValidPolygonShape([{ x: -10, y: -10 }, { x: 10, y: -10 }, { x: 10, y: -8 }])).toBe(false);
  });
});
