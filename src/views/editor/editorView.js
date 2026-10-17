import { getLayout, renameLayout, subscribe } from '../../model/store.js';
import { renderGrid } from '../../render/gridRenderer.js';
import { renderFurniture } from '../../render/furnitureRenderer.js';
import { renderRoom } from '../../render/roomRenderer.js';
import { svgEl } from '../../render/svg.js';
import { createViewport } from '../../render/viewport.js';
import { h } from '../dom.js';
import { attachCanvasInput } from './canvasInput.js';
import { attachFurnitureDrag } from './furnitureDrag.js';
import { attachFurnitureHandles } from './furnitureHandles.js';
import { attachPolygonHandles } from './polygonHandles.js';
import { renderFurnitureTab } from './furnitureTab.js';
import { renderRoomTab } from './roomTab.js';
import { attachRoomHandles } from './roomHandles.js';
import { createSelection } from './selection.js';

const FALLBACK_SIZE = { width: 800, height: 600 };
const LABEL_PX = 12;

/**
 * Editor screen for one layout: canvas on the left, Room/Furniture panel on the right.
 * Returns a cleanup function that removes every listener it added.
 */
export function renderEditor(root, layoutId, { onBack }) {
  const layout = getLayout(layoutId);
  const viewport = createViewport();
  const selection = createSelection();

  const gridG = svgEl('g', { class: 'grid' });
  const roomG = svgEl('g', { class: 'room-layer' });
  const furnitureG = svgEl('g', { class: 'furniture-layer' });
  const world = svgEl('g', { class: 'world' }, [gridG, roomG, furnitureG]);
  const svg = svgEl('svg', { class: 'canvas' }, [world]);

  const nameInput = h('input', { class: 'layout-name', type: 'text', value: layout.name, 'aria-label': 'Layout name' });
  nameInput.addEventListener('change', () => renameLayout(layoutId, nameInput.value));

  const tabContent = h('div', { class: 'tab-content' });
  const tabButtons = ['room', 'furniture'].map((name) =>
    h('button', { type: 'button', class: 'tab', 'data-tab': name, onClick: () => showTab(name) },
      name === 'room' ? 'Room' : 'Furniture'),
  );

  root.replaceChildren(
    h('div', { class: 'editor' },
      h('header', { class: 'editor-bar' },
        h('button', { type: 'button', 'data-action': 'back', onClick: onBack }, '← Back'),
        nameInput),
      h('div', { class: 'editor-body' },
        h('div', { class: 'canvas-wrap' }, svg),
        h('aside', { class: 'side-panel' }, h('div', { class: 'tabs' }, tabButtons), tabContent))),
  );

  const canvasSize = () => {
    const rect = svg.getBoundingClientRect();
    return { width: rect.width || FALLBACK_SIZE.width, height: rect.height || FALLBACK_SIZE.height };
  };

  function redraw() {
    const current = getLayout(layoutId);
    if (!current) return;
    const labelSize = LABEL_PX / viewport.zoom;
    world.setAttribute('transform', viewport.transformAttr());
    renderGrid(gridG, viewport, canvasSize());
    renderRoom(roomG, current.room, { labelSize });
    renderFurniture(furnitureG, current.furniture, { selectedId: selection.get(), labelSize });
    tools.forEach((tool) => tool.refresh?.());
  }

  // Canvas tools for the active tab; each has detach() and, if its look depends on zoom, refresh().
  let tools = [];
  let tabCleanup = null;

  function showTab(name) {
    tabCleanup?.();
    tools.forEach((tool) => tool.detach());
    tabButtons.forEach((b) => b.classList.toggle('active', b.dataset.tab === name));

    if (name === 'room') {
      tabCleanup = renderRoomTab(tabContent, layoutId);
      tools = [attachRoomHandles(svg, viewport, layoutId)];
    } else {
      tabCleanup = renderFurnitureTab(tabContent, layoutId, selection);
      tools = [
        { detach: attachFurnitureDrag(svg, viewport, layoutId, selection) },
        attachFurnitureHandles(svg, viewport, layoutId, selection),
        attachPolygonHandles(svg, viewport, layoutId, selection),
      ];
    }
  }

  const detachInput = attachCanvasInput(svg, viewport, redraw);
  const unsubscribe = subscribe(redraw);
  const unsubscribeSelection = selection.subscribe(redraw);
  window.addEventListener('resize', redraw);

  const { width, height } = canvasSize();
  viewport.fitTo(layout.room.points, width, height);
  showTab('room');
  redraw();

  return () => {
    unsubscribe();
    unsubscribeSelection();
    detachInput();
    window.removeEventListener('resize', redraw);
    tabCleanup?.();
    tools.forEach((tool) => tool.detach());
  };
}
