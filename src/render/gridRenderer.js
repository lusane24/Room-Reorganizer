import { svgEl } from './svg.js';

const STEPS = [12, 60, 120, 600]; // 1 ft, 5 ft, 10 ft, 50 ft in inches
const MIN_SPACING_PX = 20;

/** Draw grid lines (one per foot, thinning out when zoomed far out) over the visible area. */
export function renderGrid(group, viewport, { width, height }) {
  const step = STEPS.find((s) => s * viewport.zoom >= MIN_SPACING_PX) ?? STEPS[STEPS.length - 1];
  const topLeft = viewport.toWorld(0, 0);
  const bottomRight = viewport.toWorld(width, height);
  const lines = [];

  for (let x = Math.floor(topLeft.x / step) * step; x <= bottomRight.x; x += step) {
    lines.push(svgEl('line', { x1: x, y1: topLeft.y, x2: x, y2: bottomRight.y, class: x % 60 === 0 ? 'grid-major' : 'grid-minor' }));
  }
  for (let y = Math.floor(topLeft.y / step) * step; y <= bottomRight.y; y += step) {
    lines.push(svgEl('line', { x1: topLeft.x, y1: y, x2: bottomRight.x, y2: y, class: y % 60 === 0 ? 'grid-major' : 'grid-minor' }));
  }
  group.replaceChildren(...lines);
}
