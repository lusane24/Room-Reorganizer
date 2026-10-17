import { furnitureOutline, localOutline } from '../geometry/furnitureOutline.js';
import { pointsAttr, svgEl } from './svg.js';

function shapeElement(f) {
  const common = { class: 'body', fill: f.color, 'fill-opacity': 0.85 };
  switch (f.kind) {
    case 'ellipse':
      return svgEl('ellipse', { ...common, cx: 0, cy: 0, rx: f.width / 2, ry: f.depth / 2 });
    case 'rect':
      return svgEl('rect', { ...common, x: -f.width / 2, y: -f.depth / 2, width: f.width, height: f.depth });
    default:
      return svgEl('polygon', { ...common, points: pointsAttr(localOutline(f)) });
  }
}

function warningText(warning, pieces) {
  const parts = [];
  if (warning.overlaps.length) {
    const names = warning.overlaps.map((id) => pieces.find((p) => p.id === id)?.label ?? 'another piece');
    parts.push(`Overlaps: ${names.join(', ')}`);
  }
  if (warning.outside) parts.push('Outside room');
  return parts.join('. ');
}

function badge(f, warning, pieces, labelSize) {
  const outline = furnitureOutline(f);
  const x = Math.max(...outline.map((p) => p.x));
  const y = Math.min(...outline.map((p) => p.y));
  const r = labelSize * 0.8;
  const mark = svgEl('text', {
    x, y, 'font-size': labelSize, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#fff',
  });
  mark.textContent = '!';
  const title = svgEl('title');
  title.textContent = warningText(warning, pieces);
  return svgEl('g', { class: 'warning-badge', 'pointer-events': 'none' }, [
    title,
    svgEl('circle', { cx: x, cy: y, r, fill: 'var(--danger, #d92d20)' }),
    mark,
  ]);
}

/**
 * Draw every piece. Each piece is `g.piece[data-id]` holding its rotated shape and an upright label.
 * `warnings` is the Map from computeWarnings; flagged pieces get the `warning` class and a badge.
 */
export function renderFurniture(group, furniture, { selectedId = null, warnings = new Map(), labelSize = 4 } = {}) {
  group.replaceChildren(
    ...furniture.map((f) => {
      const warning = warnings.get(f.id);
      const classes = ['piece', f.id === selectedId && 'selected', warning && 'warning'].filter(Boolean);
      const label = svgEl('text', {
        x: f.x,
        y: f.y,
        'font-size': labelSize,
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
        class: 'piece-label',
        'pointer-events': 'none',
      });
      label.textContent = f.label;
      return svgEl('g', { class: classes.join(' '), 'data-id': f.id }, [
        svgEl('g', { class: 'shape', transform: `translate(${f.x} ${f.y}) rotate(${f.rotation ?? 0})` }, [shapeElement(f)]),
        label,
        warning ? badge(f, warning, furniture, labelSize) : null,
      ].filter(Boolean));
    }),
  );
}
