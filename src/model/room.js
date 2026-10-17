import { normalizeWinding, selfIntersects, setWallLength } from '../geometry/polygon.js';

const MIN_CORNERS = 3;
const isPoint = (p) => p && Number.isFinite(p.x) && Number.isFinite(p.y);

/** Accept the new points only if the outline does not cross itself; otherwise keep `room`. */
function accept(room, points) {
  return selfIntersects(points) ? room : { ...room, points: normalizeWinding(points) };
}

/** A 12 by 12 foot square room. */
export function defaultRoom() {
  return {
    points: normalizeWinding([
      { x: 0, y: 0 }, { x: 144, y: 0 }, { x: 144, y: 144 }, { x: 0, y: 144 },
    ]),
  };
}

export function moveCorner(room, index, point) {
  if (!isPoint(point) || !room.points[index]) return room;
  const points = room.points.map((p, i) => (i === index ? { x: point.x, y: point.y } : p));
  return accept(room, points);
}

/** Insert a corner on the wall that starts at `edgeIndex`. */
export function insertCorner(room, edgeIndex, point) {
  if (!isPoint(point) || !room.points[edgeIndex]) return room;
  const points = [...room.points];
  points.splice(edgeIndex + 1, 0, { x: point.x, y: point.y });
  return accept(room, points);
}

export function deleteCorner(room, index) {
  if (room.points.length <= MIN_CORNERS || !room.points[index]) return room;
  return accept(room, room.points.filter((_, i) => i !== index));
}

export function setRoomWallLength(room, index, length) {
  if (!(length > 0) || !Number.isFinite(length) || !room.points[index]) return room;
  return accept(room, setWallLength(room.points, index, length));
}
