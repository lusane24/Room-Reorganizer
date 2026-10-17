import { describe, it, expect, beforeEach } from 'vitest';
import { renderEditor } from '../../src/views/editor/editorView.js';
import { createLayout, getLayout, updateLayout, resetStore } from '../../src/model/store.js';
import { createFurniture } from '../../src/model/furniture.js';
import { patchFurniture } from '../../src/model/layoutEdits.js';
import { moveCorner } from '../../src/model/room.js';

let root;
let id;
beforeEach(() => {
  resetStore();
  document.body.innerHTML = '<div id="root"></div>';
  root = document.getElementById('root');
  id = createLayout('A');
  const bed = createFurniture('rect', { id: 'bed', label: 'Bed', x: 40, y: 40, width: 20, depth: 20 });
  const sofa = createFurniture('rect', { id: 'sofa', label: 'Sofa', x: 100, y: 100, width: 20, depth: 20 });
  updateLayout(id, (l) => ({ ...l, furniture: [bed, sofa] }));
  renderEditor(root, id, { onBack: () => {} });
});

const flagged = () => [...root.querySelectorAll('g.piece.warning')].map((g) => g.dataset.id);

describe('live collision display', () => {
  it('shows no warnings for pieces that are apart', () => {
    expect(flagged()).toEqual([]);
  });

  it('flags both pieces when one is moved onto the other, and clears when moved away', () => {
    patchFurniture(id, 'sofa', { x: 50, y: 40 });
    expect(flagged()).toEqual(['bed', 'sofa']);
    expect(root.querySelectorAll('.warning-badge')).toHaveLength(2);
    patchFurniture(id, 'sofa', { x: 100, y: 100 });
    expect(flagged()).toEqual([]);
    expect(root.querySelectorAll('.warning-badge')).toHaveLength(0);
  });

  it('does not flag pieces placed flush against each other or a wall', () => {
    patchFurniture(id, 'sofa', { x: 60, y: 40 }); // bed spans x 30-50, sofa x 50-70
    patchFurniture(id, 'bed', { x: 10, y: 10 }); // touches the room corner
    expect(flagged()).toEqual([]);
  });

  it('flags a piece that is resized out through a wall', () => {
    patchFurniture(id, 'sofa', { x: 130, width: 60 });
    expect(flagged()).toEqual(['sofa']);
  });

  it('flags a piece left outside when the room is reshaped, without moving it', () => {
    updateLayout(id, (l) => ({ ...l, room: moveCorner(l.room, 2, { x: 90, y: 90 }) }));
    expect(flagged()).toEqual(['sofa']);
    expect(getLayout(id).furniture.find((f) => f.id === 'sofa').x).toBe(100);
  });

  it('explains the warning in the Furniture tab for the selected piece', () => {
    root.querySelector('[data-tab="furniture"]').click();
    patchFurniture(id, 'sofa', { x: 50, y: 40 });
    root.querySelector('[data-action="select-piece"]').click(); // Bed
    expect(root.querySelector('.warning-text').textContent).toBe('Overlaps: Sofa');
    patchFurniture(id, 'sofa', { x: 130, y: 40, width: 60 });
    root.querySelectorAll('[data-action="select-piece"]')[1].click(); // Sofa
    expect(root.querySelector('.warning-text').textContent).toBe('Outside room');
  });

  it('shows no explanation for a piece without a warning', () => {
    root.querySelector('[data-tab="furniture"]').click();
    root.querySelector('[data-action="select-piece"]').click();
    expect(root.querySelector('.warning-text')).toBeNull();
  });
});
