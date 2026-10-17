import { getLayout } from '../model/store.js';
import { renderEditor } from '../views/editor/editorView.js';
import { renderHome } from '../views/home/homeView.js';

let root = null;
let cleanup = null;

function show(render) {
  if (cleanup) cleanup();
  cleanup = render() ?? null;
}

export function showHome() {
  show(() => renderHome(root, { onOpen: showEditor }));
}

/** Open a layout in the editor; an unknown id goes back to the home screen. */
export function showEditor(layoutId) {
  if (!getLayout(layoutId)) {
    showHome();
    return;
  }
  show(() => renderEditor(root, layoutId, { onBack: showHome }));
}

export function mountApp(rootElement) {
  root = rootElement;
  showHome();
}
