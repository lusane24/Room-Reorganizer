import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mountApp } from '../../src/app/router.js';
import { resetStore } from '../../src/model/store.js';

let root;
beforeEach(() => {
  resetStore();
  document.body.innerHTML = '<div id="root"></div>';
  root = document.getElementById('root');
  mountApp(root);
});

const $ = (selector) => root.querySelector(selector);
const cards = () => [...root.querySelectorAll('.layout-card')];
const cardNamed = (name) => cards().find((c) => c.querySelector('.card-title').textContent === name);
const addLayout = (name) => {
  $('[data-role="new-name"]').value = name;
  $('[data-action="new"]').click();
};
const choosePreset = (id) => {
  const select = $('[data-role="preset"]');
  select.value = id;
  select.dispatchEvent(new Event('change', { bubbles: true }));
};

describe('a full session', () => {
  it('keeps layouts intact while moving between screens, duplicating, and deleting', () => {
    // Layout A: reshape the room and furnish it.
    addLayout('A');
    cardNamed('A').querySelector('[data-action="open"]').click();
    $('[data-action="split-wall"]').click(); // room now has 5 corners
    $('[data-tab="furniture"]').click();
    choosePreset('queen-bed');
    choosePreset('sofa');
    expect(root.querySelectorAll('svg.canvas g.piece')).toHaveLength(2);
    $('[data-action="back"]').click();
    expect(cardNamed('A').querySelector('.card-count').textContent).toBe('2 pieces');

    // Layout B and a copy of A.
    addLayout('B');
    cardNamed('A').querySelector('[data-action="duplicate"]').click();
    expect(cards().map((c) => c.querySelector('.card-title').textContent)).toEqual(['A', 'B', 'A copy']);
    expect(cardNamed('A copy').querySelector('.card-count').textContent).toBe('2 pieces');

    // Reopen A: room and furniture are exactly as left.
    cardNamed('A').querySelector('[data-action="open"]').click();
    expect($('polygon.room').getAttribute('points').split(' ')).toHaveLength(5);
    $('[data-tab="furniture"]').click();
    expect([...root.querySelectorAll('[data-action="select-piece"]')].map((b) => b.textContent)).toEqual(['Queen bed', 'Sofa']);
    $('[data-action="back"]').click();

    // Delete the copy; A and B are untouched.
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    cardNamed('A copy').querySelector('[data-action="delete"]').click();
    expect(cards().map((c) => c.querySelector('.card-title').textContent)).toEqual(['A', 'B']);
    expect(cardNamed('A').querySelector('.card-count').textContent).toBe('2 pieces');
  });

  it('edits a layout, leaves, and finds the edit when coming back', () => {
    addLayout('Den');
    cardNamed('Den').querySelector('[data-action="open"]').click();
    $('[data-tab="furniture"]').click();
    $('[data-add="ellipse"]').click();
    const label = $('[data-role="label"]');
    label.value = 'Rug';
    label.dispatchEvent(new Event('change', { bubbles: true }));
    $('[data-action="back"]').click();
    cardNamed('Den').querySelector('[data-action="open"]').click();
    expect($('g.piece text.piece-label').textContent).toBe('Rug');
  });

  it('starts empty after a fresh mount, because nothing is persisted', () => {
    addLayout('Gone soon');
    resetStore();
    document.body.innerHTML = '<div id="root"></div>';
    root = document.getElementById('root');
    mountApp(root);
    expect(cards()).toHaveLength(0);
    expect(localStorage.length).toBe(0);
  });
});
