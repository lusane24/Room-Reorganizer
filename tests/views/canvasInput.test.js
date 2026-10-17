import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { attachCanvasInput } from '../../src/views/editor/canvasInput.js';
import { createViewport } from '../../src/render/viewport.js';
import { svgEl } from '../../src/render/svg.js';

let svg;
let viewport;
let detach;
beforeEach(() => {
  document.body.innerHTML = '';
  svg = svgEl('svg');
  document.body.append(svg);
  viewport = createViewport({ zoom: 1 });
  detach = attachCanvasInput(svg, viewport, () => {});
});
afterEach(() => detach());

const fire = (type, x, y) =>
  svg.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 }));

describe('canvas panning', () => {
  it('pans while empty canvas is dragged', () => {
    fire('pointerdown', 10, 10);
    fire('pointermove', 40, 30);
    fire('pointerup', 40, 30);
    expect([viewport.panX, viewport.panY]).toEqual([30, 20]);
  });

  it('captures the pointer when a pan starts', () => {
    svg.setPointerCapture = vi.fn();
    fire('pointerdown', 10, 10);
    expect(svg.setPointerCapture).toHaveBeenCalledTimes(1);
  });

  it('stops panning when the pointer is cancelled', () => {
    fire('pointerdown', 10, 10);
    fire('pointercancel', 10, 10);
    fire('pointermove', 90, 90);
    expect([viewport.panX, viewport.panY]).toEqual([0, 0]);
  });
});
