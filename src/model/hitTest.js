import { furnitureOutline } from '../geometry/furnitureOutline.js';
import { pointInPolygon } from '../geometry/polygon.js';

/** Id of the topmost piece (last drawn) containing `point`, or null. */
export function pieceAt(layout, point) {
  for (let i = layout.furniture.length - 1; i >= 0; i--) {
    const f = layout.furniture[i];
    if (pointInPolygon(point, furnitureOutline(f))) return f.id;
  }
  return null;
}
