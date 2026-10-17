import { createLayout, listLayouts, subscribe } from '../../model/store.js';
import { h } from '../dom.js';
import { layoutCard } from './layoutCard.js';

/**
 * Home screen: the list of layouts with New, Open, Rename, Duplicate and Delete.
 * Returns a cleanup function that stops listening to the store.
 */
export function renderHome(root, { onOpen }) {
  const nameInput = h('input', {
    type: 'text',
    'data-role': 'new-name',
    placeholder: 'Layout name, e.g. Bedroom',
    'aria-label': 'New layout name',
  });
  const form = h(
    'form',
    { class: 'new-layout' },
    nameInput,
    h('button', { type: 'submit', class: 'primary', 'data-action': 'new' }, 'New layout'),
  );
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    createLayout(nameInput.value);
    nameInput.value = '';
  });

  const list = h('div', { class: 'layout-grid' });

  function renderList() {
    const layouts = listLayouts();
    list.replaceChildren(
      ...(layouts.length
        ? layouts.map((l) => layoutCard(l, { onOpen, onRefresh: renderList }))
        : [h('p', { class: 'empty' }, 'No layouts yet. Name one above and press New layout to start.')]),
    );
  }

  root.replaceChildren(
    h(
      'main',
      { class: 'home' },
      h('h1', {}, 'Room Reorganizer'),
      h('p', { class: 'subtitle' }, 'Try out furniture arrangements before moving anything.'),
      form,
      list,
    ),
  );

  const unsubscribe = subscribe(renderList);
  renderList();
  return () => unsubscribe();
}
