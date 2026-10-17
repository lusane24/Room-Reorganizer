import { describe, it, expect, beforeEach } from 'vitest';
import { svgEl } from '../../src/render/svg.js';
import { renderRoom } from '../../src/render/roomRenderer.js';
import { renderFurniture } from '../../src/render/furnitureRenderer.js';
import { renderGrid } from '../../src/render/gridRenderer.js';
import { createViewport } from '../../src/render/viewport.js';
import { defaultRoom } from '../../src/model/room.js';
import { createFurniture } from '../../src/model/furniture.js';

let group;
beforeEach(() => {
  group = svgEl('g');
});

describe('renderRoom', () => {
  it('draws the room polygon and one length label per wall', () => {
    renderRoom(group, defaultRoom(), { labelSize: 4 });
    expect(group.querySelectorAll('polygon.room')).toHaveLength(1);
    const labels = [...group.querySelectorAll('text.wall-label')].map((t) => t.textContent);
    expect(labels).toEqual(["12'", "12'", "12'", "12'"]);
  });

  it('can hide the length labels', () => {
    renderRoom(group, defaultRoom(), { labelSize: 4, showDimensions: false });
    expect(group.querySelectorAll('text.wall-label')).toHaveLength(0);
  });

  it('replaces earlier content on each call', () => {
    renderRoom(group, defaultRoom(), { labelSize: 4 });
    renderRoom(group, defaultRoom(), { labelSize: 4 });
    expect(group.querySelectorAll('polygon.room')).toHaveLength(1);
  });
});

describe('renderFurniture', () => {
  const pieces = () => [
    createFurniture('rect', { id: 'a', label: 'Bed', x: 50, y: 50, rotation: 30 }),
    createFurniture('ellipse', { id: 'b', label: 'Table', x: 120, y: 50 }),
    createFurniture('lshape', { id: 'c', label: 'Desk', x: 50, y: 120 }),
    createFurniture('polygon', { id: 'd', label: 'Rug', x: 120, y: 120 }),
  ];

  it('draws one group and one label per piece, tagged with its id', () => {
    renderFurniture(group, pieces(), { labelSize: 4 });
    expect([...group.querySelectorAll('g.piece')].map((g) => g.dataset.id)).toEqual(['a', 'b', 'c', 'd']);
    expect([...group.querySelectorAll('text.piece-label')].map((t) => t.textContent)).toEqual([
      'Bed', 'Table', 'Desk', 'Rug',
    ]);
  });

  it('marks only warned pieces and only the selected piece', () => {
    const warnings = new Map([['b', { overlaps: ['a'], outside: false }]]);
    renderFurniture(group, pieces(), { labelSize: 4, warnings, selectedId: 'c' });
    expect([...group.querySelectorAll('g.piece.warning')].map((g) => g.dataset.id)).toEqual(['b']);
    expect([...group.querySelectorAll('g.piece.selected')].map((g) => g.dataset.id)).toEqual(['c']);
    expect(group.querySelectorAll('.warning-badge')).toHaveLength(1);
  });

  it('keeps labels upright for a rotated piece', () => {
    renderFurniture(group, pieces(), { labelSize: 4 });
    const bed = group.querySelector('g.piece[data-id="a"]');
    expect(bed.querySelector('g.shape').getAttribute('transform')).toContain('rotate(30)');
    const label = bed.querySelector('text.piece-label');
    expect(label.closest('g.shape')).toBeNull();
    expect(label.getAttribute('transform')).toBeNull();
  });

  it('uses the right element for each shape kind', () => {
    renderFurniture(group, pieces(), { labelSize: 4 });
    expect(group.querySelector('g.piece[data-id="a"] rect')).not.toBeNull();
    expect(group.querySelector('g.piece[data-id="b"] ellipse')).not.toBeNull();
    expect(group.querySelector('g.piece[data-id="c"] polygon')).not.toBeNull();
    expect(group.querySelector('g.piece[data-id="d"] polygon')).not.toBeNull();
  });
});

describe('renderGrid', () => {
  it('draws one line per foot across the visible area', () => {
    const v = createViewport({ zoom: 3, panX: 0, panY: 0 });
    renderGrid(group, v, { width: 360, height: 360 }); // 120 world inches = 10 feet each way
    const lines = group.querySelectorAll('line');
    expect(lines.length).toBeGreaterThanOrEqual(20);
    expect(lines.length).toBeLessThanOrEqual(30);
  });

  it('thins out the grid when zoomed far out', () => {
    const v = createViewport({ zoom: 0.2, panX: 0, panY: 0 });
    renderGrid(group, v, { width: 800, height: 600 });
    expect(group.querySelectorAll('line').length).toBeLessThan(80);
  });
});
