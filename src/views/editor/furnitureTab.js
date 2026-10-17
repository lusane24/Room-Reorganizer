import { createFromPreset, createFurniture } from '../../model/furniture.js';
import { addFurniture, patchFurniture, removeFurniture } from '../../model/layoutEdits.js';
import { PRESETS } from '../../model/presets.js';
import { roomCenter } from '../../model/room.js';
import { getLayout, subscribe } from '../../model/store.js';
import { formatLength, parseLength } from '../../units/feetInches.js';
import { h } from '../dom.js';

const SHAPES = [
  ['rect', 'Rectangle'],
  ['ellipse', 'Ellipse'],
  ['lshape', 'L-shape'],
  ['polygon', 'Free shape'],
];

/**
 * Side panel for furniture: add shapes or presets, list pieces, and edit the selected piece.
 * Redraws itself when the layout or selection changes. Returns a cleanup function.
 */
export function renderFurnitureTab(container, layoutId, selection) {
  function place(piece) {
    const center = roomCenter(getLayout(layoutId).room);
    const placed = { ...piece, x: center.x, y: center.y };
    addFurniture(layoutId, placed);
    selection.set(placed.id);
  }

  function lengthField(role, label, value, apply) {
    const input = h('input', { type: 'text', value: formatLength(value), 'data-role': role, 'aria-label': label });
    input.addEventListener('change', () => {
      const inches = parseLength(input.value);
      if (inches !== null) apply(inches);
      render();
    });
    return row(label, input);
  }

  const row = (label, input) => h('label', { class: 'field' }, h('span', {}, label), input);

  function selectedForm(piece) {
    const patch = (change) => patchFurniture(layoutId, piece.id, change);

    const label = h('input', { type: 'text', value: piece.label, 'data-role': 'label', 'aria-label': 'Label' });
    label.addEventListener('change', () => {
      patch({ label: label.value });
      render();
    });

    const rotation = h('input', {
      type: 'number', step: 5, value: String(Math.round(piece.rotation * 10) / 10),
      'data-role': 'rotation', 'aria-label': 'Rotation in degrees',
    });
    rotation.addEventListener('change', () => {
      const degrees = Number(rotation.value);
      if (rotation.value.trim() !== '' && Number.isFinite(degrees)) patch({ rotation: degrees });
      render();
    });

    const color = h('input', { type: 'color', value: piece.color, 'data-role': 'color', 'aria-label': 'Color' });
    color.addEventListener('change', () => patch({ color: color.value }));

    return h(
      'div',
      { class: 'piece-form' },
      row('Label', label),
      lengthField('width', 'Width', piece.width, (v) => patch({ width: v })),
      lengthField('depth', 'Depth', piece.depth, (v) => patch({ depth: v })),
      piece.kind === 'lshape' && lengthField('arm-width', 'Arm width', piece.armWidth, (v) => patch({ armWidth: v })),
      piece.kind === 'lshape' && lengthField('arm-depth', 'Arm depth', piece.armDepth, (v) => patch({ armDepth: v })),
      row('Rotation (°)', rotation),
      row('Color', color),
      h('button', {
        type: 'button', class: 'danger', 'data-action': 'delete-piece',
        onClick: () => {
          removeFurniture(layoutId, piece.id);
          selection.set(null);
        },
      }, 'Delete piece'),
    );
  }

  function render() {
    const layout = getLayout(layoutId);
    if (!layout) return;
    const selected = layout.furniture.find((f) => f.id === selection.get());

    const preset = h(
      'select',
      { 'data-role': 'preset', 'aria-label': 'Add a preset' },
      h('option', { value: '' }, 'Add a preset…'),
      PRESETS.map((p) => h('option', { value: p.id }, `${p.label} (${formatLength(p.width)} × ${formatLength(p.depth)})`)),
    );
    preset.addEventListener('change', () => {
      const chosen = PRESETS.find((p) => p.id === preset.value);
      if (chosen) place(createFromPreset(chosen));
      else render();
    });

    container.replaceChildren(
      h('h2', {}, 'Furniture'),
      h('div', { class: 'add-row' },
        SHAPES.map(([kind, name]) => h('button', { type: 'button', 'data-add': kind, onClick: () => place(createFurniture(kind)) }, name))),
      preset,
      h('ul', { class: 'piece-list' },
        layout.furniture.map((f) =>
          h('li', {}, h('button', {
            type: 'button', 'data-action': 'select-piece', 'aria-pressed': f.id === selected?.id,
            class: f.id === selected?.id ? 'active' : null,
            onClick: () => selection.set(f.id),
          }, f.label)))),
      selected ? selectedForm(selected) : h('p', { class: 'hint' }, 'Select a piece on the canvas or in the list to edit it.'),
    );
  }

  const stops = [subscribe(render), selection.subscribe(render)];
  render();
  return () => stops.forEach((stop) => stop());
}
