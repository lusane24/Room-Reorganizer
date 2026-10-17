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
