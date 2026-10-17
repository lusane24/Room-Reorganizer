import { localBounds } from '../../geometry/furnitureOutline.js';
import { rotatePoint } from '../../geometry/transform.js';
import { resizeFurniture } from '../../geometry/resize.js';
import { patchFurniture, replaceFurniture } from '../../model/layoutEdits.js';
import { getLayout, subscribe } from '../../model/store.js';
import { svgEl } from '../../render/svg.js';
import { capturePointer, pointerToWorld } from './canvasInput.js';

const HANDLE_PX = 8;
const ROTATE_OFFSET_PX = 28;
const SNAP_DEGREES = 15;
const ORIGIN = { x: 0, y: 0 };

// Where each resize handle sits, as a fraction across the bounding box.
const DIRECTIONS = {
  nw: [0, 0], n: [0.5, 0], ne: [1, 0], e: [1, 0.5], se: [1, 1], s: [0.5, 1], sw: [0, 1], w: [0, 0.5],
};

/**
 * Resize and rotation handles for the selected piece. Resizing works along the piece's own axes
 * with the opposite edge fixed; the rotation handle sits above the piece (Shift snaps to 15°).
 * Handles live in `g.furniture-handles` inside the svg's `g.world`. Returns `{ refresh, detach }`.
 */
export function attachFurnitureHandles(svg, viewport, layoutId, selection) {
  const group = svgEl('g', { class: 'furniture-handles' });
  svg.querySelector('g.world').append(group);
  let drag = null;

  const selectedPiece = () => getLayout(layoutId)?.furniture.find((f) => f.id === selection.get());

  function refresh() {
    const f = selectedPiece();
    if (!f) {
      group.replaceChildren();
      return;
    }
    const b = localBounds(f);
    const size = HANDLE_PX / viewport.zoom;
    const stemTop = b.minY - ROTATE_OFFSET_PX / viewport.zoom;

    // Free shapes are resized with their vertex handles, which sit exactly where these squares would.
    const squares = f.kind === 'polygon' ? [] : Object.entries(DIRECTIONS).map(([dir, [fx, fy]]) =>
      svgEl('rect', {
        x: b.minX + fx * (b.maxX - b.minX) - size / 2,
        y: b.minY + fy * (b.maxY - b.minY) - size / 2,
        width: size,
        height: size,
        class: 'handle resize-handle',
        'data-handle': 'resize',
        'data-dir': dir,
      }),
    );
    group.replaceChildren(
      svgEl('g', { transform: `translate(${f.x} ${f.y}) rotate(${f.rotation ?? 0})` }, [
        svgEl('rect', {
          x: b.minX, y: b.minY, width: b.maxX - b.minX, height: b.maxY - b.minY,
          class: 'selection-box', 'pointer-events': 'none',
        }),
        svgEl('line', { x1: 0, y1: b.minY, x2: 0, y2: stemTop, class: 'rotate-stem', 'pointer-events': 'none' }),
        svgEl('circle', {
          cx: 0, cy: stemTop, r: size * 0.7, class: 'handle rotate-handle', 'data-handle': 'rotate',
        }),
        ...squares,
      ]),
    );
  }

  const onDown = (e) => {
    const el = e.target.closest?.('[data-handle]');
    if (!el || !group.contains(el) || e.button !== 0) return;
    const piece = selectedPiece();
    if (!piece) return;
    drag = el.dataset.handle === 'rotate'
      ? { type: 'rotate' }
      : { type: 'resize', dir: el.dataset.dir, start: piece, from: pointerToWorld(svg, viewport, e) };
    capturePointer(svg, e);
    e.preventDefault();
  };

  const onMove = (e) => {
    if (!drag) return;
    const world = pointerToWorld(svg, viewport, e);
    if (drag.type === 'resize') {
      const delta = { x: world.x - drag.from.x, y: world.y - drag.from.y };
      const local = rotatePoint(delta, ORIGIN, -(drag.start.rotation ?? 0));
      replaceFurniture(layoutId, resizeFurniture(drag.start, drag.dir, local));
      return;
    }
    const f = selectedPiece();
    if (!f) return;
    let degrees = (Math.atan2(world.y - f.y, world.x - f.x) * 180) / Math.PI + 90;
    if (e.shiftKey) degrees = Math.round(degrees / SNAP_DEGREES) * SNAP_DEGREES;
    patchFurniture(layoutId, f.id, { rotation: degrees });
  };

  const onUp = () => {
    drag = null;
  };

  svg.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  const stops = [subscribe(refresh), selection.subscribe(refresh)];
  refresh();

  return {
    refresh,
    detach() {
      svg.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      stops.forEach((stop) => stop());
      group.remove();
    },
  };
}
