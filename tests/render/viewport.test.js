import { describe, it, expect } from 'vitest';
import { createViewport, MIN_ZOOM, MAX_ZOOM } from '../../src/render/viewport.js';

describe('viewport', () => {
  it('round-trips between world and screen coordinates', () => {
    const v = createViewport({ zoom: 2.5, panX: 30, panY: -10 });
    const p = v.toWorld(...Object.values(v.toScreen(144, 72)));
    expect(p.x).toBeCloseTo(144, 9);
    expect(p.y).toBeCloseTo(72, 9);
  });

  it('keeps the point under the cursor fixed when zooming', () => {
    const v = createViewport({ zoom: 3, panX: 20, panY: 40 });
    const before = v.toWorld(200, 150);
    v.zoomAt(200, 150, 1.5);
    const after = v.toWorld(200, 150);
    expect(after.x).toBeCloseTo(before.x, 9);
    expect(after.y).toBeCloseTo(before.y, 9);
    expect(v.zoom).toBeCloseTo(4.5, 9);
  });

  it('clamps zoom at both limits', () => {
    const v = createViewport();
    v.zoomAt(0, 0, 1000);
    expect(v.zoom).toBe(MAX_ZOOM);
    v.zoomAt(0, 0, 1e-6);
    expect(v.zoom).toBe(MIN_ZOOM);
    expect([MIN_ZOOM, MAX_ZOOM]).toEqual([0.2, 8]);
  });

  it('pans by screen pixels', () => {
    const v = createViewport({ zoom: 2, panX: 0, panY: 0 });
    v.panBy(10, -5);
    expect(v.toScreen(0, 0)).toEqual({ x: 10, y: -5 });
  });

  it('describes its transform for an SVG group', () => {
    const v = createViewport({ zoom: 2, panX: 10, panY: 20 });
    expect(v.transformAttr()).toBe('translate(10 20) scale(2)');
  });

  it('centers a set of points in a canvas', () => {
    const v = createViewport();
    v.fitTo([{ x: 0, y: 0 }, { x: 144, y: 144 }], 800, 600);
    const mid = v.toScreen(72, 72);
    expect(mid.x).toBeCloseTo(400, 6);
    expect(mid.y).toBeCloseTo(300, 6);
    const corner = v.toScreen(144, 144);
    expect(corner.x).toBeLessThanOrEqual(800);
    expect(corner.y).toBeLessThanOrEqual(600);
  });
});
