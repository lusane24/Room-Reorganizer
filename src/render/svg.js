const SVG_NS = 'http://www.w3.org/2000/svg';

/** Create an SVG element with attributes and optional children. */
export function svgEl(name, attrs = {}, children = []) {
  const el = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== undefined && value !== null && value !== false) el.setAttribute(key, String(value));
  }
  el.append(...children);
  return el;
}

/** Format points as an SVG `points` attribute. */
export const pointsAttr = (points) => points.map((p) => `${p.x},${p.y}`).join(' ');
