import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { attachFurnitureDrag } from '../../src/views/editor/furnitureDrag.js';
import { createSelection } from '../../src/views/editor/selection.js';
import { createViewport } from '../../src/render/viewport.js';
import { renderFurniture } from '../../src/render/furnitureRenderer.js';
import { svgEl } from '../../src/render/svg.js';
import { createLayout, getLayout, updateLayout, resetStore } from '../../src/model/store.js';
import { createFurniture } from '../../src/model/furniture.js';

let svg;
let id;
let selection;
let detach;
beforeEach(() => {
  resetStore();
  document.body.innerHTML = '';
  id = createLayout('A');
  const bed = createFurniture('rect', { id: 'bed', label: 'Bed', x: 50, y: 50, width: 40, depth: 40 });
  const sofa = createFurniture('rect', { id: 'sofa', label: 'Sofa', x: 120, y: 50, width: 40, depth: 40 });
  updateLayout(id, (l) => ({ ...l, furniture: [bed, sofa] }));
  const furnitureG = svgEl('g');
  svg = svgEl('svg', {}, [svgEl('g', { class: 'world' }, [furnitureG])]);
  document.body.append(svg);
  renderFurniture(furnitureG, getLayout(id).furniture);
  selection = createSelection();
  detach = attachFurnitureDrag(svg, createViewport({ zoom: 1 }), id, selection);
});
afterEach(() => {
  detach();
  vi.restoreAllMocks();
});

const fire = (target, type, x, y, extra = {}) =>
  target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, ...extra }));
const piece = (pid) => svg.querySelector(`g.piece[data-id="${pid}"] rect`);
const stored = (pid) => getLayout(id).furniture.find((f) => f.id === pid);

describe('furniture drag', () => {
  it('selects a piece on press and moves it by the drag distance', () => {
    fire(piece('bed'), 'pointerdown', 55, 52);
    expect(selection.get()).toBe('bed');
    fire(svg, 'pointermove', 75, 82);
    fire(svg, 'pointerup', 75, 82);
    expect([stored('bed').x, stored('bed').y]).toEqual([70, 80]);
    expect([stored('sofa').x, stored('sofa').y]).toEqual([120, 50]);
  });

  it('lets a piece be dragged anywhere, even far outside the room', () => {
    fire(piece('bed'), 'pointerdown', 50, 50);
    fire(svg, 'pointermove', 900, -400);
    fire(svg, 'pointerup', 900, -400);
    expect([stored('bed').x, stored('bed').y]).toEqual([900, -400]);
  });

  it('deselects when empty canvas is pressed', () => {
    selection.set('bed');
    fire(svg, 'pointerdown', 300, 300);
    expect(selection.get()).toBeNull();
  });

  it('deletes only the selected piece with the Delete key', () => {
    selection.set('bed');
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));
    expect(getLayout(id).furniture.map((f) => f.id)).toEqual(['sofa']);
    expect(selection.get()).toBeNull();
  });

  it('ignores the Delete key while typing in a field', () => {
    selection.set('bed');
    const input = document.createElement('input');
    document.body.append(input);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
    expect(getLayout(id).furniture).toHaveLength(2);
  });

  it('renames a piece on double-click', () => {
    vi.spyOn(window, 'prompt').mockReturnValue('  Big sofa ');
    fire(svg, 'dblclick', 120, 50);
    expect(stored('sofa').label).toBe('Big sofa');
  });

  it('leaves the label alone when the prompt is cancelled', () => {
    vi.spyOn(window, 'prompt').mockReturnValue(null);
    fire(svg, 'dblclick', 120, 50);
    expect(stored('sofa').label).toBe('Sofa');
  });

  it('does nothing on double-click over empty space', () => {
    const prompt = vi.spyOn(window, 'prompt');
    fire(svg, 'dblclick', 400, 400);
    expect(prompt).not.toHaveBeenCalled();
  });
});
