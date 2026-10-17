import { deleteCorner, insertCorner, setRoomWallLength } from '../../model/room.js';
import { getLayout, subscribe, updateLayout } from '../../model/store.js';
import { wallLengths } from '../../geometry/polygon.js';
import { formatLength, parseLength } from '../../units/feetInches.js';
import { h } from '../dom.js';

const MIN_CORNERS = 3;

/**
 * Side panel for the room: one row per wall with an editable length, plus split-wall and
 * remove-corner buttons. Redraws itself when the layout changes. Returns a cleanup function.
 */
export function renderRoomTab(container, layoutId) {
  const edit = (change) => updateLayout(layoutId, (l) => ({ ...l, room: change(l.room) }));

  function render() {
    const layout = getLayout(layoutId);
    if (!layout) return;
    const pts = layout.room.points;
    const lengths = wallLengths(pts);

    const rows = lengths.map((length, i) => {
      const input = h('input', {
        type: 'text',
        value: formatLength(length),
        'data-role': 'wall-length',
        'data-index': i,
        'aria-label': `Wall ${i + 1} length`,
      });
      input.addEventListener('change', () => {
        const inches = parseLength(input.value);
        if (inches === null) {
          input.value = formatLength(length);
          return;
        }
        edit((room) => setRoomWallLength(room, i, inches));
        render();
      });
      return h(
        'li',
        { class: 'wall-row' },
        h('span', { class: 'wall-name' }, `Wall ${i + 1}`),
        input,
        h('button', {
          type: 'button',
          'data-action': 'split-wall',
          title: 'Add a corner in the middle of this wall',
          onClick: () => {
            const a = pts[i];
            const b = pts[(i + 1) % pts.length];
            edit((room) => insertCorner(room, i, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }));
          },
        }, 'Split'),
        h('button', {
          type: 'button',
          'data-action': 'delete-corner',
          disabled: pts.length <= MIN_CORNERS,
          title: `Remove corner ${i + 1}`,
          onClick: () => edit((room) => deleteCorner(room, i)),
        }, `Remove corner ${i + 1}`),
      );
    });

    container.replaceChildren(
      h('h2', {}, 'Room'),
      h('p', { class: 'hint' }, 'Drag the round corner dots on the canvas, press a diamond to add a corner, or type wall lengths here (for example 12\' 6").'),
      h('ul', { class: 'wall-list' }, rows),
    );
  }

  const unsubscribe = subscribe(render);
  render();
  return () => unsubscribe();
}
