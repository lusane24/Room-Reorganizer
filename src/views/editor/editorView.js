import { h } from '../dom.js';

// Placeholder until the real editor lands (plan Task 9).
export function renderEditor(root, layoutId, { onBack }) {
  root.replaceChildren(
    h('main', {}, h('button', { type: 'button', 'data-action': 'back', onClick: onBack }, 'Back'), h('h1', {}, 'Editor')),
  );
  return () => {};
}
