import { furnitureOutline } from '../geometry/furnitureOutline.js';
import { polygonInside, polygonsOverlap } from '../geometry/polygon.js';

/**
 * Collision warnings for a layout: a Map from furniture id to
 * `{ overlaps: string[], outside: boolean }`, with entries only for pieces that have a problem.
 * Touching walls or other pieces is not a warning.
 */
export function computeWarnings(layout) {
  const outlines = layout.furniture.map((f) => ({ id: f.id, points: furnitureOutline(f) }));
  const warnings = new Map();
  const entry = (id) => {
    if (!warnings.has(id)) warnings.set(id, { overlaps: [], outside: false });
    return warnings.get(id);
  };

  for (const { id, points } of outlines) {
    if (!polygonInside(points, layout.room.points)) entry(id).outside = true;
  }

  for (let i = 0; i < outlines.length; i++) {
    for (let j = i + 1; j < outlines.length; j++) {
      if (polygonsOverlap(outlines[i].points, outlines[j].points)) {
        entry(outlines[i].id).overlaps.push(outlines[j].id);
        entry(outlines[j].id).overlaps.push(outlines[i].id);
      }
    }
  }
  return warnings;
}

/** Plain-language description of one piece's warning, e.g. `Overlaps: Sofa. Outside room`. */
export function describeWarning(warning, furniture) {
  const parts = [];
  if (warning.overlaps.length) {
    const names = warning.overlaps.map((id) => furniture.find((f) => f.id === id)?.label ?? 'another piece');
    parts.push(`Overlaps: ${names.join(', ')}`);
  }
  if (warning.outside) parts.push('Outside room');
  return parts.join('. ');
}
