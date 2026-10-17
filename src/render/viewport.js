export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 8;

const clampZoom = (z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

/**
 * Maps between world coordinates (inches) and screen pixels.
 * screen = world * zoom + pan.
 */
export function createViewport({ zoom = 3, panX = 0, panY = 0 } = {}) {
  const view = {
    zoom: clampZoom(zoom),
    panX,
    panY,

    toScreen(x, y) {
      return { x: x * view.zoom + view.panX, y: y * view.zoom + view.panY };
    },

    toWorld(px, py) {
      return { x: (px - view.panX) / view.zoom, y: (py - view.panY) / view.zoom };
    },

    panBy(dx, dy) {
      view.panX += dx;
      view.panY += dy;
    },

    /** Zoom by `factor` keeping the world point under screen position (px, py) fixed. */
    zoomAt(px, py, factor) {
      const anchor = view.toWorld(px, py);
      view.zoom = clampZoom(view.zoom * factor);
      view.panX = px - anchor.x * view.zoom;
      view.panY = py - anchor.y * view.zoom;
    },

    /** Zoom and pan so `points` are centered in a canvas of the given pixel size. */
    fitTo(points, width, height, margin = 60) {
      const xs = points.map((p) => p.x);
      const ys = points.map((p) => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const w = Math.max(...xs) - minX || 1;
      const h = Math.max(...ys) - minY || 1;
      view.zoom = clampZoom(Math.min((width - margin * 2) / w, (height - margin * 2) / h));
      view.panX = width / 2 - (minX + w / 2) * view.zoom;
      view.panY = height / 2 - (minY + h / 2) * view.zoom;
    },

    /** Value for the `transform` attribute of the SVG group that holds all world content. */
    transformAttr() {
      return `translate(${view.panX} ${view.panY}) scale(${view.zoom})`;
    },
  };
  return view;
}
