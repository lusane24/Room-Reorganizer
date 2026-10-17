import { deleteCorner, insertCorner, moveCorner } from '../../model/room.js';
import { getLayout, subscribe, updateLayout } from '../../model/store.js';
import { svgEl } from '../../render/svg.js';
import { pointerToWorld } from './canvasInput.js';

const HANDLE_PX = 7;
const isTyping = (target) => ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName);

/**
 * Room editing on the canvas: drag a round corner handle, press a diamond on a wall to add a
 * corner there, right-click a corner or press Delete on a selected corner to remove it.
 * Handles live in `g.room-handles` inside the svg's `g.world`. Returns `{ refresh, detach }`.
 */
export function attachRoomHandles(svg, viewport, layoutId) {
  const group = svgEl('g', { class: 'room-handles' });
  svg.querySelector('g.world').append(group);
  let dragIndex = null;
  let selected = null;

  const edit = (change) => updateLayout(layoutId, (l) => ({ ...l, room: change(l.room) }));

  function refresh() {
    const layout = getLayout(layoutId);
    if (!layout) return;
    const pts = layout.room.points;
    const r = HANDLE_PX / viewport.zoom;
    const edges = pts.map((a, i) => {
      const b = pts[(i + 1) % pts.length];
      const x = (a.x + b.x) / 2;
      const y = (a.y + b.y) / 2;
      return svgEl('polygon', {
        points: `${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}`,
        class: 'handle edge-handle',
        'data-handle': 'edge',
        'data-index': i,
      });
    });
    const corners = pts.map((p, i) =>
      svgEl('circle', {
        cx: p.x, cy: p.y, r,
        class: `handle corner-handle${i === selected ? ' selected' : ''}`,
        'data-handle': 'corner',
        'data-index': i,
      }),
    );
    group.replaceChildren(...edges, ...corners);
  }

  const handleOf = (e) => {
    const el = e.target.closest?.('[data-handle]');
    return el && group.contains(el) ? el : null;
  };

  const onDown = (e) => {
    const el = handleOf(e);
    if (!el) {
      if (selected !== null) {
        selected = null;
        refresh();
      }
      return;
    }
    if (e.button !== 0) return;
    const index = Number(el.dataset.index);
    if (el.dataset.handle === 'edge') {
      const pts = getLayout(layoutId).room.points;
      const a = pts[index];
      const b = pts[(index + 1) % pts.length];
      edit((room) => insertCorner(room, index, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }));
      if (getLayout(layoutId).room.points.length === pts.length) return;
      dragIndex = index + 1;
    } else {
      dragIndex = index;
    }
    selected = dragIndex;
    e.preventDefault();
    refresh();
  };

  const onMove = (e) => {
    if (dragIndex === null) return;
    const world = pointerToWorld(svg, viewport, e);
    edit((room) => moveCorner(room, dragIndex, world));
  };

  const onUp = () => {
    dragIndex = null;
  };

  const onContextMenu = (e) => {
    const el = handleOf(e);
    if (!el || el.dataset.handle !== 'corner') return;
    e.preventDefault();
    edit((room) => deleteCorner(room, Number(el.dataset.index)));
    selected = null;
    refresh();
  };

  const onKey = (e) => {
    if ((e.key !== 'Delete' && e.key !== 'Backspace') || selected === null || isTyping(e.target)) return;
    edit((room) => deleteCorner(room, selected));
    selected = null;
    refresh();
  };

  svg.addEventListener('pointerdown', onDown);
  svg.addEventListener('contextmenu', onContextMenu);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('keydown', onKey);
  const unsubscribe = subscribe(refresh);
  refresh();

  return {
    refresh,
    detach() {
      svg.removeEventListener('pointerdown', onDown);
      svg.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('keydown', onKey);
      unsubscribe();
      group.remove();
    },
  };
}
