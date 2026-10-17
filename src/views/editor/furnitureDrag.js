import { patchFurniture, removeFurniture } from '../../model/layoutEdits.js';
import { pieceAt } from '../../model/hitTest.js';
import { getLayout } from '../../model/store.js';
import { pointerToWorld } from './canvasInput.js';

const isTyping = (target) => ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName);

/**
 * Pieces on the canvas: press to select and drag to move (never blocked, even outside the room),
 * press empty canvas to deselect, Delete removes the selection, double-click renames a piece.
 * Returns a function that removes the listeners.
 */
export function attachFurnitureDrag(svg, viewport, layoutId, selection) {
  let drag = null;

  const onDown = (e) => {
    if (e.target.closest?.('[data-handle]')) return;
    const pieceEl = e.target.closest?.('g.piece');
    if (!pieceEl) {
      selection.set(null);
      return;
    }
    if (e.button !== 0) return;
    const piece = getLayout(layoutId)?.furniture.find((f) => f.id === pieceEl.dataset.id);
    if (!piece) return;
    const world = pointerToWorld(svg, viewport, e);
    drag = { id: piece.id, dx: piece.x - world.x, dy: piece.y - world.y };
    selection.set(piece.id);
    e.preventDefault();
  };

  const onMove = (e) => {
    if (!drag) return;
    const world = pointerToWorld(svg, viewport, e);
    patchFurniture(layoutId, drag.id, { x: world.x + drag.dx, y: world.y + drag.dy });
  };

  const onUp = () => {
    drag = null;
  };

  const onKey = (e) => {
    const id = selection.get();
    if ((e.key !== 'Delete' && e.key !== 'Backspace') || !id || isTyping(e.target)) return;
    removeFurniture(layoutId, id);
    selection.set(null);
  };

  const onDoubleClick = (e) => {
    const layout = getLayout(layoutId);
    const id = layout && pieceAt(layout, pointerToWorld(svg, viewport, e));
    if (!id) return;
    const piece = layout.furniture.find((f) => f.id === id);
    const label = window.prompt('Label for this piece', piece.label);
    if (label === null || label === undefined) return;
    patchFurniture(layoutId, id, { label });
    selection.set(id);
  };

  svg.addEventListener('pointerdown', onDown);
  svg.addEventListener('dblclick', onDoubleClick);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('keydown', onKey);

  return () => {
    svg.removeEventListener('pointerdown', onDown);
    svg.removeEventListener('dblclick', onDoubleClick);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('keydown', onKey);
  };
}
