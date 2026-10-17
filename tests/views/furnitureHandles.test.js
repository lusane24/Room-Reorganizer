import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { attachFurnitureHandles } from '../../src/views/editor/furnitureHandles.js';
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

const setup = (overrides = {}, kind = 'rect', select = true) => {
  const f = createFurniture(kind, { id: 'p', label: 'Bed', x: 100, y: 100, width: 60, depth: 80, ...overrides });
  updateLayout(id, (l) => ({ ...l, furniture: [f] }));
  if (select) selection.set('p');
  handles = attachFurnitureHandles(svg, createViewport({ zoom: 1 }), id, selection);
  return f;
};
const fire = (target, type, x, y, extra = {}) =>
  target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, ...extra }));
const handle = (kind, dir) =>
  svg.querySelector(kind === 'resize' ? `[data-handle="resize"][data-dir="${dir}"]` : '[data-handle="rotate"]');
const stored = () => getLayout(id).furniture[0];

describe('furniture handles', () => {
  it('shows 8 resize handles and a rotation handle for the selected piece only', () => {
    setup();
    expect(svg.querySelectorAll('[data-handle="resize"]')).toHaveLength(8);
    expect(handle('rotate')).not.toBeNull();
    selection.set(null);
    expect(svg.querySelectorAll('[data-handle]')).toHaveLength(0);
  });

  it('shows nothing when no piece is selected', () => {
    setup({}, 'rect', false);
    expect(svg.querySelectorAll('[data-handle]')).toHaveLength(0);
  });

  it('resizes along the piece axis from the east handle', () => {
    setup();
    fire(handle('resize', 'e'), 'pointerdown', 130, 100);
    fire(svg, 'pointermove', 140, 100);
    fire(svg, 'pointerup', 140, 100);
    expect(stored().width).toBe(70);
    expect(stored().x).toBeCloseTo(105, 9);
  });

  it('resizes along the rotated axis for a piece turned 90 degrees', () => {
    setup({ rotation: 90 });
    fire(handle('resize', 'e'), 'pointerdown', 100, 130);
    fire(svg, 'pointermove', 100, 140);
    fire(svg, 'pointerup', 100, 140);
    expect(stored().width).toBe(70);
    expect(stored().y).toBeCloseTo(105, 9);
    expect(stored().x).toBeCloseTo(100, 9);
  });

  it('never shrinks a piece below 6 inches', () => {
    setup();
    fire(handle('resize', 'e'), 'pointerdown', 130, 100);
    fire(svg, 'pointermove', -500, 100);
    fire(svg, 'pointerup', -500, 100);
    expect(stored().width).toBe(6);
  });

  it('keeps L-shape arm thickness when resizing', () => {
    setup({ armWidth: 20, armDepth: 25 }, 'lshape');
    fire(handle('resize', 'e'), 'pointerdown', 130, 100);
    fire(svg, 'pointermove', 150, 100);
    fire(svg, 'pointerup', 150, 100);
    expect([stored().armWidth, stored().armDepth]).toEqual([20, 25]);
  });

  it('turns the piece toward the pointer from the rotation handle', () => {
    setup();
    fire(handle('rotate'), 'pointerdown', 100, 40);
    fire(svg, 'pointermove', 200, 100); // straight right of the center
    fire(svg, 'pointerup', 200, 100);
    expect(stored().rotation).toBeCloseTo(90, 6);
  });

  it('snaps rotation to 15 degree steps while Shift is held', () => {
    setup();
    const angle = ((-73 * Math.PI) / 180);
    const x = 100 + 50 * Math.cos(angle);
    const y = 100 + 50 * Math.sin(angle);
    fire(handle('rotate'), 'pointerdown', 100, 40);
    fire(svg, 'pointermove', x, y);
    expect(stored().rotation).toBeCloseTo(17, 6);
    fire(svg, 'pointermove', x, y, { shiftKey: true });
    expect(stored().rotation).toBe(15);
    fire(svg, 'pointerup', x, y);
  });

  it('keeps rotation inside 0 to 360', () => {
    setup();
    const angle = ((-100 * Math.PI) / 180);
    fire(handle('rotate'), 'pointerdown', 100, 40);
    fire(svg, 'pointermove', 100 + 50 * Math.cos(angle), 100 + 50 * Math.sin(angle));
    fire(svg, 'pointerup', 0, 0);
    expect(stored().rotation).toBeCloseTo(350, 6);
  });

  it('removes its handles on detach', () => {
    setup();
    handles.detach();
    expect(svg.querySelectorAll('[data-handle]')).toHaveLength(0);
  });
});

describe('free shapes', () => {
  it('get a rotation handle but no resize squares, which would sit on their vertex handles', () => {
    setup({}, 'polygon');
    expect(svg.querySelectorAll('[data-handle="resize"]')).toHaveLength(0);
    expect(handle('rotate')).not.toBeNull();
  });
});

describe('pointer handling', () => {
  it('captures the pointer when a drag starts', () => {
    setup();
    svg.setPointerCapture = vi.fn();
    fire(handle('resize', 'e'), 'pointerdown', 130, 100);
    expect(svg.setPointerCapture).toHaveBeenCalledTimes(1);
  });

  it('ends the drag when the pointer is cancelled', () => {
    setup();
    fire(handle('resize', 'e'), 'pointerdown', 130, 100);
    fire(svg, 'pointercancel', 130, 100);
    fire(svg, 'pointermove', 200, 100);
    expect(stored().width).toBe(60);
  });
});
