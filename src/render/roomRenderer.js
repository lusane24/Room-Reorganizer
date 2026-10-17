import { wallLengths } from '../geometry/polygon.js';
import { formatLength } from '../units/feetInches.js';
import { pointsAttr, svgEl } from './svg.js';

/**
 * Draw the room outline and, unless `showDimensions` is false, each wall's length just outside
 * the wall. `labelSize` is the text height in world units (use 12 / zoom for constant on-screen size).
 */
export function renderRoom(group, room, { labelSize = 4, showDimensions = true } = {}) {
  const children = [svgEl('polygon', { points: pointsAttr(room.points), class: 'room' })];

  if (showDimensions) {
    const lengths = wallLengths(room.points);
    room.points.forEach((a, i) => {
      const b = room.points[(i + 1) % room.points.length];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const offset = labelSize * 1.1;
      const label = svgEl('text', {
        x: (a.x + b.x) / 2 + (dy / len) * offset,
        y: (a.y + b.y) / 2 - (dx / len) * offset,
        'font-size': labelSize,
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
        class: 'wall-label',
        'pointer-events': 'none',
      });
      label.textContent = formatLength(lengths[i]);
      children.push(label);
    });
  }
  group.replaceChildren(...children);
}
