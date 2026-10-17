import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderEditor } from '../../src/views/editor/editorView.js';
import { createLayout, getLayout, resetStore } from '../../src/model/store.js';

let root;
let id;
beforeEach(() => {
  resetStore();
  document.body.innerHTML = '<div id="root"></div>';
  root = document.getElementById('root');
  id = createLayout('Bedroom');
});

describe('editor view', () => {
  it('shows the layout name, the room and the Room tab by default', () => {
    renderEditor(root, id, { onBack: () => {} });
    expect(root.querySelector('.layout-name').value).toBe('Bedroom');
    expect(root.querySelectorAll('svg.canvas polygon.room')).toHaveLength(1);
    expect(root.querySelectorAll('[data-role="wall-length"]')).toHaveLength(4);
    expect(root.querySelectorAll('[data-handle="corner"]')).toHaveLength(4);
  });

  it('goes back when Back is pressed', () => {
    const onBack = vi.fn();
    renderEditor(root, id, { onBack });
    root.querySelector('[data-action="back"]').click();
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('renames the layout from the title field', () => {
    renderEditor(root, id, { onBack: () => {} });
    const input = root.querySelector('.layout-name');
    input.value = 'Guest room';
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(getLayout(id).name).toBe('Guest room');
  });

  it('hides room handles on the Furniture tab and brings them back', () => {
    renderEditor(root, id, { onBack: () => {} });
    root.querySelector('[data-tab="furniture"]').click();
    expect(root.querySelectorAll('[data-handle]')).toHaveLength(0);
    root.querySelector('[data-tab="room"]').click();
    expect(root.querySelectorAll('[data-handle="corner"]')).toHaveLength(4);
  });

  it('redraws the room when it is reshaped', () => {
    renderEditor(root, id, { onBack: () => {} });
    root.querySelector('[data-action="split-wall"]').click();
    const points = root.querySelector('polygon.room').getAttribute('points').split(' ');
    expect(points).toHaveLength(5);
  });

  it('zooms the canvas with the mouse wheel', () => {
    renderEditor(root, id, { onBack: () => {} });
    const world = root.querySelector('g.world');
    const before = world.getAttribute('transform');
    root.querySelector('svg.canvas').dispatchEvent(new WheelEvent('wheel', { deltaY: -200, bubbles: true, cancelable: true }));
    expect(world.getAttribute('transform')).not.toBe(before);
  });

  it('pans the canvas when empty space is dragged', () => {
    renderEditor(root, id, { onBack: () => {} });
    const svg = root.querySelector('svg.canvas');
    const world = root.querySelector('g.world');
    const before = world.getAttribute('transform');
    const fire = (t, type, x, y) => t.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0 }));
    fire(svg, 'pointerdown', 10, 10);
    fire(svg, 'pointermove', 40, 30);
    fire(svg, 'pointerup', 40, 30);
    expect(world.getAttribute('transform')).not.toBe(before);
  });

  it('stops listening to the store after cleanup', () => {
    const cleanup = renderEditor(root, id, { onBack: () => {} });
    cleanup();
    root.querySelector('polygon.room').remove();
    createLayout('Other');
    expect(root.querySelectorAll('polygon.room')).toHaveLength(0);
  });
});

describe('editor view furniture tab', () => {
  it('adds a piece from the Furniture tab and draws it', () => {
    renderEditor(root, id, { onBack: () => {} });
    root.querySelector('[data-tab="furniture"]').click();
    root.querySelector('[data-add="rect"]').click();
    expect(getLayout(id).furniture).toHaveLength(1);
    expect(root.querySelectorAll('svg.canvas g.piece')).toHaveLength(1);
    expect(root.querySelectorAll('svg.canvas g.piece.selected')).toHaveLength(1);
  });
});
