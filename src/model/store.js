import { createLayoutObject } from './layout.js';
import { newId } from './ids.js';

// The only place layouts are kept. Memory only: a page reload clears everything.
const layouts = new Map();
const listeners = new Set();

const notify = () => listeners.forEach((fn) => fn());

export function createLayout(name) {
  const layout = createLayoutObject(name);
  layouts.set(layout.id, layout);
  notify();
  return layout.id;
}

export function getLayout(id) {
  return layouts.get(id);
}

export function listLayouts() {
  return [...layouts.values()];
}

/** Replace a layout with the result of `change(layout)`. Unknown ids are ignored. */
export function updateLayout(id, change) {
  const current = layouts.get(id);
  if (!current) return;
  layouts.set(id, { ...change(current), id });
  notify();
}

export function renameLayout(id, name) {
  const trimmed = typeof name === 'string' ? name.trim() : '';
  updateLayout(id, (l) => ({ ...l, name: trimmed || 'Untitled' }));
}

/** Copy a layout (room and furniture) under new ids. Returns the new id, or undefined. */
export function duplicateLayout(id) {
  const original = layouts.get(id);
  if (!original) return undefined;
  const copy = JSON.parse(JSON.stringify(original));
  copy.id = newId('l');
  copy.name = `${original.name} copy`;
  copy.furniture = copy.furniture.map((f) => ({ ...f, id: newId('f') }));
  layouts.set(copy.id, copy);
  notify();
  return copy.id;
}

export function deleteLayout(id) {
  if (layouts.delete(id)) notify();
}

/** Call `fn` after every change. Returns a function that stops the calls. */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Clear all layouts and listeners. For tests. */
export function resetStore() {
  layouts.clear();
  listeners.clear();
}
