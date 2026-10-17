import { describe, it, expect } from 'vitest';
import {
  defaultRoom, moveCorner, insertCorner, deleteCorner, setRoomWallLength, roomCenter,
} from '../../src/model/room.js';
import { wallLengths } from '../../src/geometry/polygon.js';

describe('defaultRoom', () => {
  it('is a 12 by 12 foot square', () => {
    const room = defaultRoom();
    expect(room.points).toHaveLength(4);
    expect(wallLengths(room.points)).toEqual([144, 144, 144, 144]);
  });
});

describe('moveCorner', () => {
  it('moves one corner', () => {
    const out = moveCorner(defaultRoom(), 2, { x: 200, y: 150 });
    expect(out.points[2]).toEqual({ x: 200, y: 150 });
  });

  it('refuses a move that makes the room cross itself', () => {
    const room = defaultRoom();
    expect(moveCorner(room, 2, { x: -50, y: 72 })).toBe(room);
  });

  it('ignores a non-finite target', () => {
    const room = defaultRoom();
    expect(moveCorner(room, 0, { x: NaN, y: 0 })).toBe(room);
  });
});

describe('insertCorner', () => {
  it('adds a corner after the given edge', () => {
    const out = insertCorner(defaultRoom(), 0, { x: 72, y: 0 });
    expect(out.points).toHaveLength(5);
    expect(out.points[1]).toEqual({ x: 72, y: 0 });
  });
});

describe('deleteCorner', () => {
  it('removes a corner from a four corner room', () => {
    expect(deleteCorner(defaultRoom(), 1).points).toHaveLength(3);
  });

  it('refuses to go below three corners', () => {
    const triangle = deleteCorner(defaultRoom(), 1);
    expect(deleteCorner(triangle, 0)).toBe(triangle);
  });
});

describe('setRoomWallLength', () => {
  it('changes one wall to the typed length', () => {
    const out = setRoomWallLength(defaultRoom(), 0, 100);
    expect(wallLengths(out.points)[0]).toBeCloseTo(100, 9);
  });

  it.each([0, -5, NaN, Infinity])('ignores invalid length %s', (len) => {
    const room = defaultRoom();
    expect(setRoomWallLength(room, 0, len)).toBe(room);
  });

  it('refuses a length that makes the room cross itself', () => {
    const lShape = {
      points: [
        { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 },
        { x: 50, y: 50 }, { x: 50, y: 100 }, { x: 0, y: 100 },
      ],
    };
    // Lengthening wall 2 (100,50 -> 50,50) to 200 pushes its end through the room's far wall.
    expect(setRoomWallLength(lShape, 2, 200)).toBe(lShape);
  });
});

describe('roomCenter', () => {
  it('is the middle of the room bounding box', () => {
    expect(roomCenter(defaultRoom())).toEqual({ x: 72, y: 72 });
  });
});

describe('rooms cannot be turned inside out or flattened', () => {
  const triangle = { points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 100 }] };

  it('refuses to drag a triangle corner across the opposite wall', () => {
    expect(moveCorner(triangle, 2, { x: 50, y: -60 })).toBe(triangle);
  });

  it('refuses to flatten a triangle onto its opposite wall', () => {
    expect(moveCorner(triangle, 2, { x: 50, y: 0 })).toBe(triangle);
  });

  it('still allows ordinary moves of a triangle corner', () => {
    expect(moveCorner(triangle, 2, { x: 60, y: 120 }).points[2]).toEqual({ x: 60, y: 120 });
  });
});
