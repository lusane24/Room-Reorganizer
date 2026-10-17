import { updateFurniture } from './furniture.js';
import { updateLayout } from './store.js';

/** Add a piece to a layout. */
export function addFurniture(layoutId, piece) {
  updateLayout(layoutId, (l) => ({ ...l, furniture: [...l.furniture, piece] }));
}

/** Apply a partial change (see updateFurniture) to one piece of a layout. */
export function patchFurniture(layoutId, pieceId, change) {
  updateLayout(layoutId, (l) => ({
    ...l,
    furniture: l.furniture.map((f) => (f.id === pieceId ? updateFurniture(f, change) : f)),
  }));
}

/** Replace one piece outright, for edits that need more than updateFurniture's fields (resize, reshape). */
export function replaceFurniture(layoutId, piece) {
  updateLayout(layoutId, (l) => ({
    ...l,
    furniture: l.furniture.map((f) => (f.id === piece.id ? piece : f)),
  }));
}

export function removeFurniture(layoutId, pieceId) {
  updateLayout(layoutId, (l) => ({ ...l, furniture: l.furniture.filter((f) => f.id !== pieceId) }));
}
