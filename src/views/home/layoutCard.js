import { thumbnailSvg } from '../../render/thumbnail.js';
import { deleteLayout, duplicateLayout, renameLayout } from '../../model/store.js';
import { h } from '../dom.js';

const countText = (n) => `${n} ${n === 1 ? 'piece' : 'pieces'}`;

/**
 * One card in the layout list. `onOpen(id)` runs when the card or its Open button is used;
 * `onRefresh()` redraws the list (used to leave rename mode).
 */
export function layoutCard(layout, { onOpen, onRefresh }) {
  const title = h('h3', { class: 'card-title' }, layout.name);

  function startRename() {
    const input = h('input', { class: 'rename-input', type: 'text', value: layout.name });
    let finished = false;
    const finish = (commit) => {
      if (finished) return;
      finished = true;
      if (commit) renameLayout(layout.id, input.value);
      else onRefresh();
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') finish(true);
      if (e.key === 'Escape') finish(false);
    });
    input.addEventListener('blur', () => finish(true));
    title.replaceWith(input);
    input.focus();
    input.select();
  }

  const actions = h(
    'div',
    { class: 'card-actions' },
    h('button', { type: 'button', 'data-action': 'open', onClick: () => onOpen(layout.id) }, 'Open'),
    h('button', { type: 'button', 'data-action': 'rename', onClick: startRename }, 'Rename'),
    h('button', { type: 'button', 'data-action': 'duplicate', onClick: () => duplicateLayout(layout.id) }, 'Duplicate'),
    h(
      'button',
      {
        type: 'button',
        class: 'danger',
        'data-action': 'delete',
        onClick: () => {
          if (window.confirm(`Delete "${layout.name}"? This cannot be undone.`)) deleteLayout(layout.id);
        },
      },
      'Delete',
    ),
  );

  const card = h(
    'article',
    { class: 'layout-card' },
    h('div', { class: 'card-thumb' }, thumbnailSvg(layout.room, layout.furniture, 160)),
    title,
    h('p', { class: 'card-count' }, countText(layout.furniture.length)),
    actions,
  );

  card.addEventListener('click', (e) => {
    if (e.target.closest('.card-actions, .rename-input')) return;
    onOpen(layout.id);
  });
  return card;
}
