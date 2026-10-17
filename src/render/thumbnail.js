import { furnitureOutline } from '../geometry/furnitureOutline.js';
import { pointsAttr, svgEl } from './svg.js';

/** Small picture of a room and its furniture, scaled to fit a `size` by `size` square. */
export function thumbnailSvg(room, furniture, size = 160) {
  const xs = room.points.map((p) => p.x);
  const ys = room.points.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const w = Math.max(...xs) - minX;
  const h = Math.max(...ys) - minY;
  const pad = Math.max(w, h) * 0.06;

  return svgEl(
    'svg',
    {
      width: size,
      height: size,
      viewBox: `${minX - pad} ${minY - pad} ${w + pad * 2} ${h + pad * 2}`,
      class: 'thumbnail',
      'aria-hidden': 'true',
    },
    [
      svgEl('polygon', { points: pointsAttr(room.points), class: 'thumb-room' }),
      ...furniture.map((f) =>
        svgEl('polygon', {
          points: pointsAttr(furnitureOutline(f)),
          fill: f.color,
          'fill-opacity': 0.8,
          class: 'thumb-piece',
        }),
      ),
    ],
  );
}
