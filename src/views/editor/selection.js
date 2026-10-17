/** Which furniture piece is selected in the editor (an id, or null). */
export function createSelection() {
  let selectedId = null;
  const listeners = new Set();
  return {
    get: () => selectedId,
    set(id) {
      if (id === selectedId) return;
      selectedId = id;
      listeners.forEach((fn) => fn());
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
