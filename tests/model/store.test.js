import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createLayout, getLayout, listLayouts, updateLayout, renameLayout,
  duplicateLayout, deleteLayout, subscribe, resetStore,
} from '../../src/model/store.js';
import { createFurniture } from '../../src/model/furniture.js';

beforeEach(() => resetStore());

describe('store', () => {
  it('lists layouts in creation order', () => {
    createLayout('A');
    createLayout('B');
    expect(listLayouts().map((l) => l.name)).toEqual(['A', 'B']);
  });

  it('starts a layout as a 12 by 12 foot room with no furniture', () => {
    const layout = getLayout(createLayout('A'));
    expect(layout.room.points).toHaveLength(4);
    expect(layout.furniture).toEqual([]);
  });

  it('deletes only the chosen layout', () => {
    const a = createLayout('A');
    const b = createLayout('B');
    deleteLayout(a);
    expect(getLayout(a)).toBeUndefined();
    expect(getLayout(b).name).toBe('B');
  });

  it('uses "Untitled" for blank names and allows duplicates', () => {
    const a = createLayout('   ');
    createLayout('Same');
    createLayout('Same');
    expect(getLayout(a).name).toBe('Untitled');
    expect(listLayouts().filter((l) => l.name === 'Same')).toHaveLength(2);
  });

  it('renames a layout', () => {
    const id = createLayout('A');
    renameLayout(id, 'Bedroom');
    expect(getLayout(id).name).toBe('Bedroom');
  });

  it('applies updates and keeps them for later reads', () => {
    const id = createLayout('A');
    const bed = createFurniture('rect', { label: 'Bed' });
    updateLayout(id, (l) => ({ ...l, furniture: [...l.furniture, bed] }));
    expect(getLayout(id).furniture.map((f) => f.label)).toEqual(['Bed']);
  });

  it('ignores updates and deletes for a missing id', () => {
    expect(() => updateLayout('nope', (l) => l)).not.toThrow();
    expect(() => deleteLayout('nope')).not.toThrow();
    expect(() => renameLayout('nope', 'x')).not.toThrow();
  });

  it('notifies subscribers until they unsubscribe', () => {
    const fn = vi.fn();
    const stop = subscribe(fn);
    const id = createLayout('A');
    renameLayout(id, 'B');
    expect(fn).toHaveBeenCalledTimes(2);
    stop();
    deleteLayout(id);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('duplicateLayout', () => {
  it('copies room and furniture under new ids and a "copy" name', () => {
    const id = createLayout('Bedroom');
    updateLayout(id, (l) => ({ ...l, furniture: [createFurniture('rect', { label: 'Bed' })] }));
    const copyId = duplicateLayout(id);
    const original = getLayout(id);
    const copy = getLayout(copyId);
    expect(copyId).not.toBe(id);
    expect(copy.name).toBe('Bedroom copy');
    expect(copy.room).toEqual(original.room);
    expect(copy.furniture[0].label).toBe('Bed');
    expect(copy.furniture[0].id).not.toBe(original.furniture[0].id);
  });

  it('does not share state with the original', () => {
    const id = createLayout('A');
    const copyId = duplicateLayout(id);
    updateLayout(copyId, (l) => ({ ...l, furniture: [createFurniture('rect')] }));
    expect(getLayout(id).furniture).toHaveLength(0);
  });

  it('returns undefined for a missing layout', () => {
    expect(duplicateLayout('nope')).toBeUndefined();
  });
});
