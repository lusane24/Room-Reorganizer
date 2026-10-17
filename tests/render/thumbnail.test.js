import { describe, it, expect } from 'vitest';
import { thumbnailSvg } from '../../src/render/thumbnail.js';
import { defaultRoom } from '../../src/model/room.js';
import { createFurniture } from '../../src/model/furniture.js';

describe('thumbnailSvg', () => {
  it('draws the room plus one shape per piece', () => {
    const svg = thumbnailSvg(defaultRoom(), [createFurniture('rect'), createFurniture('ellipse')], 120);
    expect(svg.tagName.toLowerCase()).toBe('svg');
    expect(svg.querySelectorAll('polygon')).toHaveLength(3);
    expect(svg.getAttribute('width')).toBe('120');
  });

  it('fits the room inside its view box', () => {
    const svg = thumbnailSvg(defaultRoom(), [], 100);
    const [x, y, w, h] = svg.getAttribute('viewBox').split(' ').map(Number);
    expect(x).toBeLessThan(0);
    expect(y).toBeLessThan(0);
    expect(x + w).toBeGreaterThan(144);
    expect(y + h).toBeGreaterThan(144);
  });
});
