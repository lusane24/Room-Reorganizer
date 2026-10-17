import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHome } from '../../src/views/home/homeView.js';
import { mountApp, showEditor, showHome } from '../../src/app/router.js';
import {
  createLayout, listLayouts, updateLayout, resetStore,
} from '../../src/model/store.js';
import { createFurniture } from '../../src/model/furniture.js';

let root;
beforeEach(() => {
  resetStore();
  document.body.innerHTML = '<div id="root"></div>';
  root = document.getElementById('root');
});
afterEach(() => vi.restoreAllMocks());

const cards = () => [...root.querySelectorAll('.layout-card')];
const titles = () => cards().map((c) => c.querySelector('.card-title').textContent);
const addLayout = (name) => {
  root.querySelector('[data-role="new-name"]').value = name;
  root.querySelector('[data-action="new"]').click();
};

describe('home view', () => {
  it('shows an empty state with no layouts', () => {
    renderHome(root, { onOpen: () => {} });
    expect(root.textContent).toContain('No layouts yet');
    expect(cards()).toHaveLength(0);
  });

  it('adds a layout from the name field', () => {
    renderHome(root, { onOpen: () => {} });
    addLayout('Bedroom');
    expect(titles()).toEqual(['Bedroom']);
    expect(cards()[0].querySelector('.card-count').textContent).toBe('0 pieces');
    expect(root.textContent).not.toContain('No layouts yet');
  });

  it('allows a blank name and shows Untitled', () => {
    renderHome(root, { onOpen: () => {} });
    addLayout('');
    expect(titles()).toEqual(['Untitled']);
  });

  it('counts pieces with the right plural', () => {
    const id = createLayout('A');
    updateLayout(id, (l) => ({ ...l, furniture: [createFurniture('rect')] }));
    renderHome(root, { onOpen: () => {} });
    expect(cards()[0].querySelector('.card-count').textContent).toBe('1 piece');
  });

  it('shows layout names as text, not markup', () => {
    createLayout('<b>bold</b>');
    renderHome(root, { onOpen: () => {} });
    expect(root.querySelector('.card-title b')).toBeNull();
    expect(titles()).toEqual(['<b>bold</b>']);
  });

  it('deletes only after confirmation', () => {
    createLayout('A');
    createLayout('B');
    renderHome(root, { onOpen: () => {} });
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    cards()[0].querySelector('[data-action="delete"]').click();
    expect(titles()).toEqual(['A', 'B']);
    cards()[0].querySelector('[data-action="delete"]').click();
    expect(titles()).toEqual(['B']);
    expect(confirm).toHaveBeenCalledTimes(2);
  });

  it('duplicates a layout', () => {
    createLayout('Bedroom');
    renderHome(root, { onOpen: () => {} });
    cards()[0].querySelector('[data-action="duplicate"]').click();
    expect(titles()).toEqual(['Bedroom', 'Bedroom copy']);
  });

  it('renames a layout inline and cancels with Escape', () => {
    createLayout('Old');
    renderHome(root, { onOpen: () => {} });
    cards()[0].querySelector('[data-action="rename"]').click();
    const input = root.querySelector('.rename-input');
    input.value = 'Guest room';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(titles()).toEqual(['Guest room']);

    cards()[0].querySelector('[data-action="rename"]').click();
    const again = root.querySelector('.rename-input');
    again.value = 'Nope';
    again.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(titles()).toEqual(['Guest room']);
  });

  it('opens a layout when its card is clicked, but not when a button is', () => {
    const id = createLayout('A');
    const onOpen = vi.fn();
    renderHome(root, { onOpen });
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    cards()[0].querySelector('[data-action="delete"]').click();
    expect(onOpen).not.toHaveBeenCalled();
    cards()[0].querySelector('[data-action="open"]').click();
    expect(onOpen).toHaveBeenCalledWith(id);
  });

  it('stops updating after cleanup', () => {
    const cleanup = renderHome(root, { onOpen: () => {} });
    cleanup();
    createLayout('Late');
    expect(cards()).toHaveLength(0);
  });
});

describe('router', () => {
  it('returns to the home view when asked to open a layout that does not exist', () => {
    mountApp(root);
    showEditor('missing');
    expect(root.querySelector('[data-role="new-name"]')).not.toBeNull();
  });

  it('keeps a layout while going home and back', () => {
    mountApp(root);
    addLayout('Kept');
    const id = listLayouts()[0].id;
    showEditor(id);
    expect(root.querySelector('[data-role="new-name"]')).toBeNull();
    showHome();
    expect(titles()).toEqual(['Kept']);
  });
});
