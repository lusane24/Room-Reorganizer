import { defaultRoom } from './room.js';
import { newId } from './ids.js';

/** A new layout with a 12 by 12 foot room and no furniture. */
export function createLayoutObject(name) {
  return {
    id: newId('l'),
    name: typeof name === 'string' && name.trim() ? name.trim() : 'Untitled',
    room: defaultRoom(),
    furniture: [],
  };
}
