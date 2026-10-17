import { describe, it, expect, beforeEach } from 'vitest';
import { renderRoomTab } from '../../src/views/editor/roomTab.js';
import { createLayout, getLayout, updateLayout, resetStore } from '../../src/model/store.js';
import { deleteCorner } from '../../src/model/room.js';
import { wallLengths } from '../../src/geometry/polygon.js';

let container;
let id;
beforeEach(() => {
  resetStore();
  document.body.innerHTML = '<div id="tab"></div>';
  container = document.getElementById('tab');
  id = createLayout('A');
});

const inputs = () => [...container.querySelectorAll('[data-role="wall-length"]')];
const type = (input, text) => {
  input.value = text;
  input.dispatchEvent(new Event('change', { bubbles: true }));
};

describe('room tab', () => {
  it('lists one row per wall formatted in feet', () => {
    renderRoomTab(container, id);
    expect(inputs().map((i) => i.value)).toEqual(["12'", "12'", "12'", "12'"]);
  });

  it('updates the room when a wall length is typed', () => {
    renderRoomTab(container, id);
    type(inputs()[0], "10'");
    expect(wallLengths(getLayout(id).room.points)[0]).toBeCloseTo(120, 9);
    expect(inputs()[0].value).toBe("10'");
  });

  it.each(['abc', '0', '', '-4'])('restores the old value for %j', (text) => {
    renderRoomTab(container, id);
    const before = JSON.stringify(getLayout(id).room);
    type(inputs()[0], text);
    expect(JSON.stringify(getLayout(id).room)).toBe(before);
    expect(inputs()[0].value).toBe("12'");
  });

  it('shows the real length again when the room refuses a change', () => {
    updateLayout(id, (l) => ({
      ...l,
      room: {
        points: [
          { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 },
          { x: 50, y: 50 }, { x: 50, y: 100 }, { x: 0, y: 100 },
        ],
      },
    }));
    renderRoomTab(container, id);
    type(inputs()[2], "20'"); // would drive the wall through the opposite side
    expect(wallLengths(getLayout(id).room.points)[2]).toBeCloseTo(50, 9);
    expect(inputs()[2].value).toBe('4\' 2"');
  });

  it('splits a wall by adding a corner at its midpoint', () => {
    renderRoomTab(container, id);
    container.querySelector('[data-action="split-wall"]').click();
    const pts = getLayout(id).room.points;
    expect(pts).toHaveLength(5);
    expect(pts[1]).toEqual({ x: 72, y: 0 });
  });

  it('removes a corner', () => {
    renderRoomTab(container, id);
    container.querySelector('[data-action="delete-corner"]').click();
    expect(getLayout(id).room.points).toHaveLength(3);
  });

  it('will not remove a corner from a three-corner room', () => {
    updateLayout(id, (l) => ({ ...l, room: deleteCorner(l.room, 1) }));
    renderRoomTab(container, id);
    const buttons = [...container.querySelectorAll('[data-action="delete-corner"]')];
    expect(buttons).toHaveLength(3);
    expect(buttons.every((b) => b.disabled)).toBe(true);
    buttons[0].click();
    expect(getLayout(id).room.points).toHaveLength(3);
  });

  it('refreshes when the room changes elsewhere, and stops after cleanup', () => {
    const cleanup = renderRoomTab(container, id);
    container.querySelector('[data-action="split-wall"]').click();
    expect(inputs()).toHaveLength(5);
    cleanup();
    updateLayout(id, (l) => ({ ...l, room: deleteCorner(l.room, 0) }));
    expect(inputs()).toHaveLength(5);
  });
});
