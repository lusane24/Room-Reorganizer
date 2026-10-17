import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { attachPolygonHandles } from '../../src/views/editor/polygonHandles.js';
import { createSelection } from '../../src/views/editor/selection.js';
import { createViewport } from '../../src/render/viewport.js';
import { svgEl } from '../../src/render/svg.js';
import { createLayout, getLayout, updateLayout, resetStore } from '../../src/model/store.js';
import { createFurniture } from '../../src/model/furniture.js';

let svg;
let id;
let selection;
let handles;
beforeEach(() => {
  resetStore();
  document.body.innerHTML = '';
  id = createLayout('A');
  svg = svgEl('svg', {}, [svgEl('g', { class: 'world' })]);
  document.body.append(svg);
  selection = createSelection();
});
afterEach(() => handles?.detach());

const setup = (overrides = {}, kind = 'polygon') => {
  const f = createFurniture(kind, { id: 'p', x: 100, y: 100, width: 48, depth: 30, ...overrides });
  updateLayout(id, (l) => ({ ...l, furniture: [f] }));
  selection.set('p');
  handles = attachPolygonHandles(svg, createViewport({ zoom: 1 }), id, selection);
};
const fire = (target, type, x, y, extra = {}) =>
  target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, ...extra }));
const vertex = (i) => svg.querySelector(`[data-handle="vertex"][data-index="${i}"]`);
const pedge = (i) => svg.querySelector(`[data-handle="pedge"][data-index="${i}"]`);
const stored = () => getLayout(id).furniture[0];
const key = (k) => document.body.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

describe('polygon handles', () => {
  it('shows a handle per vertex for a free shape only', () => {
    setup();
    expect(svg.querySelectorAll('[data-handle="vertex"]')).toHaveLength(4);
    handles.detach();
    document.body.innerHTML = '';
    svg = svgEl('svg', {}, [svgEl('g', { class: 'world' })]);
    document.body.append(svg);
    setup({}, 'rect');
    expect(svg.querySelectorAll('[data-handle]')).toHaveLength(0);
  });

  it('moves one vertex and updates the width', () => {
    setup(); // points at +/-24, +/-15 around (100, 100); vertex 2 is the bottom-right corner
    fire(vertex(2), 'pointerdown', 124, 115);
    fire(svg, 'pointermove', 134, 125);
    fire(svg, 'pointerup', 134, 125);
    expect(stored().points[2]).toEqual({ x: 34, y: 25 });
    expect(stored().points[0]).toEqual({ x: -24, y: -15 });
    expect(stored().width).toBe(58);
  });

  it('moves a vertex in the piece\'s own axes when the piece is rotated', () => {
    setup({ rotation: 90 });
    // local (24, 15) turned 90 degrees clockwise on screen lands at world (100 - 15, 100 + 24)
    fire(vertex(2), 'pointerdown', 85, 124);
    fire(svg, 'pointermove', 85, 134); // straight down in the world = +x in the piece
    fire(svg, 'pointerup', 85, 134);
    expect(stored().points[2].x).toBeCloseTo(34, 9);
    expect(stored().points[2].y).toBeCloseTo(15, 9);
  });

  it('adds a vertex in the middle of an edge and lets you drag it', () => {
    setup();
    fire(pedge(0), 'pointerdown', 100, 85);
    expect(stored().points).toHaveLength(5);
    expect(stored().points[1]).toEqual({ x: 0, y: -15 });
    fire(svg, 'pointermove', 100, 75);
    fire(svg, 'pointerup', 100, 75);
    expect(stored().points[1]).toEqual({ x: 0, y: -25 });
  });

  it('removes a vertex on right-click but never below three', () => {
    setup();
    vertex(1).dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    expect(stored().points).toHaveLength(3);
    vertex(0).dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    expect(stored().points).toHaveLength(3);
  });

  it('removes the selected vertex with Delete instead of deleting the piece', () => {
    setup();
    fire(vertex(1), 'pointerdown', 124, 85);
    fire(svg, 'pointerup', 124, 85);
    key('Delete');
    expect(stored().points).toHaveLength(3);
    fire(vertex(0), 'pointerdown', 76, 85);
    fire(svg, 'pointerup', 76, 85);
    key('Delete');
    expect(stored().points).toHaveLength(3);
    expect(getLayout(id).furniture).toHaveLength(1);
  });
});
