import { normalizeAngle } from '../geometry/transform.js';
import { MIN_PIECE_SIZE } from '../geometry/resize.js';
import { localOutline } from '../geometry/furnitureOutline.js';
import { newId } from './ids.js';

const DEFAULT_LABEL = 'Furniture';
const DEFAULT_COLOR = '#8aa9d6';
const DEFAULT_SIZE = { rect: [48, 30], ellipse: [36, 36], lshape: [60, 60], polygon: [48, 30] };

const isNumber = (n) => typeof n === 'number' && Number.isFinite(n);

/** Create a piece centered at the origin. `overrides` may set any field. */
export function createFurniture(kind, overrides = {}) {
  const [width, depth] = DEFAULT_SIZE[kind] ?? DEFAULT_SIZE.rect;
  const w = overrides.width ?? width;
  const d = overrides.depth ?? depth;
  const f = {
    id: newId('f'),
    label: DEFAULT_LABEL,
    kind,
    x: 0,
    y: 0,
    width: w,
    depth: d,
    rotation: 0,
    color: DEFAULT_COLOR,
    ...overrides,
  };
  if (kind === 'lshape') {
    f.armWidth = overrides.armWidth ?? w / 3;
    f.armDepth = overrides.armDepth ?? d / 3;
  }
  if (kind === 'polygon' && !overrides.points) {
    f.points = [
      { x: -w / 2, y: -d / 2 }, { x: w / 2, y: -d / 2 },
      { x: w / 2, y: d / 2 }, { x: -w / 2, y: d / 2 },
    ];
  }
  return f;
}

export function createFromPreset(preset) {
  return createFurniture(preset.kind, {
    label: preset.label,
    width: preset.width,
    depth: preset.depth,
  });
}

function scalePolygon(f, width, depth) {
  const pts = localOutline(f);
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const w = Math.max(...xs) - Math.min(...xs);
  const d = Math.max(...ys) - Math.min(...ys);
  const sx = w > 0 ? width / w : 1;
  const sy = d > 0 ? depth / d : 1;
  return { ...f, points: pts.map((p) => ({ x: p.x * sx, y: p.y * sy })), width, depth };
}

/**
 * Apply a partial change to a piece. Invalid values are ignored, a blank label falls back to
 * "Furniture", sizes never drop below the minimum, and rotation is normalized to [0, 360).
 */
export function updateFurniture(f, change) {
  let out = { ...f };

  if (typeof change.label === 'string') out.label = change.label.trim() || DEFAULT_LABEL;
  if (typeof change.color === 'string') out.color = change.color;
  if (isNumber(change.x)) out.x = change.x;
  if (isNumber(change.y)) out.y = change.y;
  if (isNumber(change.rotation)) out.rotation = normalizeAngle(change.rotation);

  const width = isNumber(change.width) ? Math.max(MIN_PIECE_SIZE, change.width) : out.width;
  const depth = isNumber(change.depth) ? Math.max(MIN_PIECE_SIZE, change.depth) : out.depth;
  if (f.kind === 'polygon') {
    if (width !== out.width || depth !== out.depth) out = scalePolygon(out, width, depth);
  } else {
    out.width = width;
    out.depth = depth;
  }

  if (f.kind === 'lshape') {
    const arm = (value, size) => Math.min(Math.max(1, value), size);
    out.armWidth = arm(isNumber(change.armWidth) ? change.armWidth : out.armWidth, out.width);
    out.armDepth = arm(isNumber(change.armDepth) ? change.armDepth : out.armDepth, out.depth);
  }
  return out;
}
