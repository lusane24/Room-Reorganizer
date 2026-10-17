import { localBounds } from '../../geometry/furnitureOutline.js';
import { rotatePoint } from '../../geometry/transform.js';
import { isValidPolygonShape } from '../../model/furniture.js';
import { replaceFurniture } from '../../model/layoutEdits.js';
import { getLayout, subscribe } from '../../model/store.js';
import { svgEl } from '../../render/svg.js';
import { capturePointer, pointerToWorld } from './canvasInput.js';

const HANDLE_PX = 7;
const MIN_POINTS = 3;
const ORIGIN = { x: 0, y: 0 };
const isTyping = (target) => ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName);

/** Copy of the piece with new points and a width/depth that matches them. */
function withPoints(f, points) {
  const b = localBounds({ ...f, points });
  return { ...f, points, width: b.maxX - b.minX, depth: b.maxY - b.minY };
}

/**
 * Vertex editing for a selected free-shape piece: drag a vertex, press a diamond on an edge to add
 * one, right-click or press Delete on a selected vertex to remove it (minimum 3).
 * Handles live in `g.polygon-handles` inside the svg's `g.world`. Returns `{ refresh, detach }`.
 */
export function attachPolygonHandles(svg, viewport, layoutId, selection) {
  const group = svgEl('g', { class: 'polygon-handles' });
  svg.querySelector('g.world').append(group);
  let dragIndex = null;
  let selectedVertex = null;

  const selectedPiece = () => {
    const f = getLayout(layoutId)?.furniture.find((p) => p.id === selection.get());
    return f?.kind === 'polygon' ? f : null;
  };
  const edit = (f, points) => replaceFurniture(layoutId, withPoints(f, points));
  const toLocal = (f, world) => rotatePoint({ x: world.x - f.x, y: world.y - f.y }, ORIGIN, -(f.rotation ?? 0));

  function refresh() {
    const f = selectedPiece();
    if (!f) {
      group.replaceChildren();
      return;
    }
    const r = HANDLE_PX / viewport.zoom;
    const pts = f.points;
    const edges = pts.map((a, i) => {
      const b = pts[(i + 1) % pts.length];
      const x = (a.x + b.x) / 2;
      const y = (a.y + b.y) / 2;
      return svgEl('polygon', {
        points: `${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}`,
        class: 'handle edge-handle',
        'data-handle': 'pedge',
        'data-index': i,
      });
    });
    const vertices = pts.map((p, i) =>
      svgEl('circle', {
        cx: p.x, cy: p.y, r,
        class: `handle corner-handle${i === selectedVertex ? ' selected' : ''}`,
        'data-handle': 'vertex',
        'data-index': i,
      }),
    );
    group.replaceChildren(
      svgEl('g', { transform: `translate(${f.x} ${f.y}) rotate(${f.rotation ?? 0})` }, [...edges, ...vertices]),
    );
  }

  const handleOf = (e) => {
    const el = e.target.closest?.('[data-handle]');
    return el && group.contains(el) ? el : null;
  };

  const onDown = (e) => {
    const el = handleOf(e);
    if (!el) {
      if (selectedVertex !== null) {
        selectedVertex = null;
        refresh();
      }
      return;
    }
    const f = selectedPiece();
    if (!f || e.button !== 0) return;
    const index = Number(el.dataset.index);
    if (el.dataset.handle === 'pedge') {
      const a = f.points[index];
      const b = f.points[(index + 1) % f.points.length];
      const points = [...f.points];
      points.splice(index + 1, 0, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
      edit(f, points);
      dragIndex = index + 1;
    } else {
      dragIndex = index;
    }
    selectedVertex = dragIndex;
    capturePointer(svg, e);
    e.preventDefault();
    refresh();
  };

  const onMove = (e) => {
    if (dragIndex === null) return;
    const f = selectedPiece();
    if (!f || !f.points[dragIndex]) return;
    const local = toLocal(f, pointerToWorld(svg, viewport, e));
    const points = f.points.map((p, i) => (i === dragIndex ? local : p));
    if (isValidPolygonShape(points)) edit(f, points);
  };

  const onUp = () => {
    dragIndex = null;
  };

  function removeVertex(index) {
    const f = selectedPiece();
    if (f && f.points.length > MIN_POINTS) edit(f, f.points.filter((_, i) => i !== index));
    selectedVertex = null;
    refresh();
  }

  const onContextMenu = (e) => {
    const el = handleOf(e);
    if (!el || el.dataset.handle !== 'vertex') return;
    e.preventDefault();
    removeVertex(Number(el.dataset.index));
  };

  // Capture phase, so a selected vertex takes the Delete key before the piece-delete handler sees it.
  const onKey = (e) => {
    if ((e.key !== 'Delete' && e.key !== 'Backspace') || selectedVertex === null || isTyping(e.target)) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    removeVertex(selectedVertex);
  };

  svg.addEventListener('pointerdown', onDown);
  svg.addEventListener('contextmenu', onContextMenu);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  window.addEventListener('keydown', onKey, true);
  const stops = [
    subscribe(refresh),
    selection.subscribe(() => {
      selectedVertex = null; // a vertex selected on one piece must not take the next Delete on another
      dragIndex = null;
      refresh();
    }),
  ];
  refresh();

  return {
    refresh,
    detach() {
      svg.removeEventListener('pointerdown', onDown);
      svg.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('keydown', onKey, true);
      stops.forEach((stop) => stop());
      group.remove();
    },
  };
}
