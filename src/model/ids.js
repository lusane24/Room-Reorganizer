let counter = 0;

/** Short unique id such as `f-3-k2j9x1`. */
export function newId(prefix) {
  counter += 1;
  return `${prefix}-${counter}-${Math.random().toString(36).slice(2, 8)}`;
}
