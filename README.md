# Room Reorganizer

A 2D tool for trying out furniture arrangements. Model a room of any shape, add labeled furniture of any size, and drag it around. Layouts live in memory only: you can leave the editor and come back to them while the page is open, but closing or refreshing the page clears everything.

## Run
```
npm install
npm run dev     # dev server, prints a localhost URL
npm test        # unit and integration tests (Vitest)
npm run build   # production build into dist/
```
Node.js is installed at `~/.local/node`. If `node` is not found, run `source ~/.zshrc`.

## Using it
- **Home:** type a name and press *New layout*. Each card has Open, Rename, Duplicate and Delete.
- **Room tab:** drag the round corner dots, press a diamond on a wall to add a corner, right-click a corner (or select it and press Delete) to remove it, or type wall lengths such as `12' 6"`. A change that would make the walls cross is refused.
- **Furniture tab:** add a rectangle, ellipse, L-shape, free shape, or a preset such as a queen bed. Drag to move, use the square handles to resize, the dot above the piece to rotate (hold Shift for 15° steps), and double-click a piece to rename it. Free shapes have corner dots you can drag, add and remove like the room.
- Overlapping furniture, or furniture outside the room, gets a red outline and a `!` badge. This is only a warning; nothing is ever blocked.
- Scroll to zoom, drag empty canvas to pan.

## How the code is organized
Dependencies point downward only.

| Folder | What it holds |
| --- | --- |
| `src/units` | feet/inches parsing and display (everything is stored in inches) |
| `src/geometry` | pure math: polygons, rotation, overlap, resizing, furniture outlines |
| `src/model` | layout data, the store, collision warnings. No DOM. |
| `src/render` | the only code that draws: viewport, room/furniture/grid SVG, thumbnails |
| `src/views` | the home and editor screens (`views/home`, `views/editor`) |
| `src/app` | the router that switches between screens |
| `styles` | CSS |
| `tests` | mirrors `src`, plus `tests/e2e` for a whole session |

All layouts are owned by `src/model/store.js`; nothing else keeps its own copy. Edits go through `updateLayout`, and screens subscribe to the store to redraw.

### Adding a 3D view later
A 3D renderer would sit next to `src/render` and read the same layout data from the store. Nothing in `model/`, `geometry/` or `units/` depends on how things are drawn.

### Adding saving later
Change `src/model/store.js` only: load layouts into the map on startup and save after `notify()`.

## More
`CLAUDE.md` has the decisions and status. `docs/superpowers/specs/` has the design; `docs/superpowers/plans/` has the build plan.
