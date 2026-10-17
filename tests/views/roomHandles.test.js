import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { attachRoomHandles } from '../../src/views/editor/roomHandles.js';
import { createViewport } from '../../src/render/viewport.js';
import { svgEl } from '../../src/render/svg.js';
import { createLayout, getLayout, resetStore } from '../../src/model/store.js';

let svg;
let id;
let handles;
beforeEach(() => {
  resetStore();
  document.body.innerHTML = '';
  svg = svgEl('svg', {}, [svgEl('g', { class: 'world' })]);
  document.body.append(svg);
  id = createLayout('A');
  handles = attachRoomHandles(svg, createViewport({ zoom: 1 }), id);
});
afterEach(() => handles.detach());

const fire = (target, type, x, y, extra = {}) =>
  target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, ...extra }));
const corner = (i) => svg.querySelector(`[data-handle="corner"][data-index="${i}"]`);
const edge = (i) => svg.querySelector(`[data-handle="edge"][data-index="${i}"]`);
const points = () => getLayout(id).room.points;

describe('room handles', () => {
  it('draws a handle for every corner and every wall', () => {
    expect(svg.querySelectorAll('[data-handle="corner"]')).toHaveLength(4);
    expect(svg.querySelectorAll('[data-handle="edge"]')).toHaveLength(4);
  });

  it('moves a corner by the drag distance', () => {
    fire(corner(2), 'pointerdown', 144, 144);
    fire(svg, 'pointermove', 164, 154);
    fire(svg, 'pointerup', 164, 154);
    expect(points()[2]).toEqual({ x: 164, y: 154 });
  });

  it('leaves the room unchanged when a drag would make it cross itself', () => {
    fire(corner(2), 'pointerdown', 144, 144);
    fire(svg, 'pointermove', -50, 72);
    fire(svg, 'pointerup', -50, 72);
    expect(points()[2]).toEqual({ x: 144, y: 144 });
  });

  it('inserts a corner at the middle of a wall and lets you drag it', () => {
    fire(edge(0), 'pointerdown', 72, 0);
    expect(points()).toHaveLength(5);
    expect(points()[1]).toEqual({ x: 72, y: 0 });
    fire(svg, 'pointermove', 72, -30);
    fire(svg, 'pointerup', 72, -30);
    expect(points()[1]).toEqual({ x: 72, y: -30 });
  });

  it('removes a corner on right-click', () => {
    const ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    corner(1).dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    expect(points()).toHaveLength(3);
  });

  it('removes the selected corner with the Delete key, but not below three corners', () => {
    fire(corner(1), 'pointerdown', 144, 0);
    fire(svg, 'pointerup', 144, 0);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));
    expect(points()).toHaveLength(3);
    fire(corner(0), 'pointerdown', 0, 0);
    fire(svg, 'pointerup', 0, 0);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));
    expect(points()).toHaveLength(3);
  });

  it('ignores the Delete key while typing in a field', () => {
    fire(corner(1), 'pointerdown', 144, 0);
    fire(svg, 'pointerup', 144, 0);
    const input = document.createElement('input');
    document.body.append(input);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
    expect(points()).toHaveLength(4);
  });

  it('stops reacting after detach', () => {
    handles.detach();
    expect(svg.querySelectorAll('[data-handle]')).toHaveLength(0);
  });
});
