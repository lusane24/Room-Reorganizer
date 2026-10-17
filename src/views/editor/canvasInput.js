const INTERACTIVE = '[data-handle], g.piece';

/**
 * Keep receiving this pointer's events on the canvas until it is released, even if it leaves the
 * window. Safe where pointer capture is unavailable.
 */
export function capturePointer(svg, event) {
  try {
    svg.setPointerCapture?.(event.pointerId);
  } catch {
    // The pointer may already be gone; the drag then ends on pointerup or pointercancel.
  }
}

/** World position (inches) of a pointer event over the canvas. */
export function pointerToWorld(svg, viewport, event) {
  const rect = svg.getBoundingClientRect();
  return viewport.toWorld(event.clientX - rect.left, event.clientY - rect.top);
}

/**
 * Pan by dragging empty canvas and zoom with the mouse wheel.
 * `onViewChange()` runs after every pan or zoom. Returns a function that removes the listeners.
 */
export function attachCanvasInput(svg, viewport, onViewChange) {
  let last = null;

  const onDown = (e) => {
    if (e.button !== 0 && e.button !== 1) return;
    if (e.target.closest?.(INTERACTIVE)) return;
    last = { x: e.clientX, y: e.clientY };
    capturePointer(svg, e);
  };
  const onMove = (e) => {
    if (!last) return;
    viewport.panBy(e.clientX - last.x, e.clientY - last.y);
    last = { x: e.clientX, y: e.clientY };
    onViewChange();
  };
  const onUp = () => {
    last = null;
  };
  const onWheel = (e) => {
    e.preventDefault();
    const rect = svg.getBoundingClientRect();
    viewport.zoomAt(e.clientX - rect.left, e.clientY - rect.top, Math.exp(-e.deltaY * 0.0015));
    onViewChange();
  };

  svg.addEventListener('pointerdown', onDown);
  svg.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);

  return () => {
    svg.removeEventListener('pointerdown', onDown);
    svg.removeEventListener('wheel', onWheel);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
  };
}
