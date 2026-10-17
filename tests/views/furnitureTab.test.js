import { describe, it, expect, beforeEach } from 'vitest';
import { renderFurnitureTab } from '../../src/views/editor/furnitureTab.js';
import { createSelection } from '../../src/views/editor/selection.js';
import { createLayout, getLayout, updateLayout, resetStore } from '../../src/model/store.js';
import { createFurniture } from '../../src/model/furniture.js';

let container;
let id;
let selection;
beforeEach(() => {
  resetStore();
  document.body.innerHTML = '<div id="tab"></div>';
  container = document.getElementById('tab');
  id = createLayout('A');
  selection = createSelection();
  renderFurnitureTab(container, id, selection);
});

const pieces = () => getLayout(id).furniture;
const field = (role) => container.querySelector(`[data-role="${role}"]`);
const change = (el, value) => {
  el.value = value;
  el.dispatchEvent(new Event('change', { bubbles: true }));
};
const addPiece = (overrides = {}, kind = 'rect') => {
  const f = createFurniture(kind, { label: 'Bed', width: 60, depth: 80, x: 72, y: 72, ...overrides });
  updateLayout(id, (l) => ({ ...l, furniture: [...l.furniture, f] }));
  selection.set(f.id);
  return f;
};

describe('adding furniture', () => {
  it('adds a preset at its real size in the middle of the room, selected', () => {
    change(field('preset'), 'queen-bed');
    expect(pieces()).toHaveLength(1);
    const [bed] = pieces();
    expect([bed.label, bed.width, bed.depth, bed.x, bed.y]).toEqual(['Queen bed', 60, 80, 72, 72]);
    expect(selection.get()).toBe(bed.id);
    expect(field('preset').value).toBe('');
  });

  it.each(['rect', 'ellipse', 'lshape', 'polygon'])('adds a %s from its button', (kind) => {
    container.querySelector(`[data-add="${kind}"]`).click();
    expect(pieces()[0].kind).toBe(kind);
    expect(selection.get()).toBe(pieces()[0].id);
  });
});

describe('editing the selected piece', () => {
  it('tells you to select a piece when nothing is selected', () => {
    expect(container.textContent).toContain('Select a piece');
    expect(field('label')).toBeNull();
  });

  it('fills the fields from the piece', () => {
    addPiece();
    expect(field('label').value).toBe('Bed');
    expect(field('width').value).toBe("5'");
    expect(field('depth').value).toBe('6\' 8"');
    expect(field('rotation').value).toBe('0');
  });

  it('changes the width from a typed length', () => {
    addPiece();
    change(field('width'), "6'");
    expect(pieces()[0].width).toBe(72);
  });

  it.each(['abc', '0', '-3', ''])('keeps the old width when %j is typed', (text) => {
    addPiece();
    change(field('width'), text);
    expect(pieces()[0].width).toBe(60);
    expect(field('width').value).toBe("5'");
  });

  it('falls back to "Furniture" for a blank label', () => {
    addPiece();
    change(field('label'), '   ');
    expect(pieces()[0].label).toBe('Furniture');
    expect(field('label').value).toBe('Furniture');
  });

  it('stores rotation normalized and ignores junk', () => {
    addPiece();
    change(field('rotation'), '-30');
    expect(pieces()[0].rotation).toBe(330);
    change(field('rotation'), 'abc');
    expect(pieces()[0].rotation).toBe(330);
    expect(field('rotation').value).toBe('330');
  });

  it('changes the color', () => {
    addPiece();
    change(field('color'), '#ff0000');
    expect(pieces()[0].color).toBe('#ff0000');
  });

  it('shows arm thickness fields only for L-shapes', () => {
    addPiece();
    expect(field('arm-width')).toBeNull();
    addPiece({ label: 'Desk' }, 'lshape');
    expect(field('arm-width')).not.toBeNull();
    change(field('arm-width'), "1'");
    expect(pieces()[1].armWidth).toBe(12);
  });

  it('deletes the selected piece and clears the selection', () => {
    addPiece();
    addPiece({ label: 'Sofa' });
    container.querySelector('[data-action="delete-piece"]').click();
    expect(pieces().map((f) => f.label)).toEqual(['Bed']);
    expect(selection.get()).toBeNull();
  });

  it('lists every piece and selects one when clicked', () => {
    const a = addPiece();
    addPiece({ label: 'Sofa' });
    const rows = [...container.querySelectorAll('[data-action="select-piece"]')];
    expect(rows.map((r) => r.textContent)).toEqual(['Bed', 'Sofa']);
    rows[0].click();
    expect(selection.get()).toBe(a.id);
  });
});
