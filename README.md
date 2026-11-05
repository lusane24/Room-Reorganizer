# Room Reorganizer

A browser app for trying out furniture arrangements before moving anything. Draw a room of any shape in feet and inches, add labeled furniture at its real size, drag it around, and keep several layouts to compare. Pieces that overlap each other or stick out of the room are flagged in red as you move them.

Everything lives in memory: you can leave a layout and come back to it while the page is open, but closing or refreshing the page clears it all. Nothing is written to disk or to the browser.

## Engineering

- **Plain JavaScript, no runtime dependencies.** ES modules and SVG, no framework. Vite serves it and Vitest tests it; those are the only dev dependencies.
- **The model never touches the screen.** `src/model` holds the layouts and the rules, `src/geometry` and `src/units` are pure functions, and `src/render` is the only code that draws. A 3D view or saving to disk can be added without changing the model.
- **One owner for the data.** Every layout lives in `src/model/store.js`. Screens subscribe to it and redraw; nothing else keeps its own copy.
- **Edits that would break the room are refused.** A corner drag that makes the walls cross, flips the room inside out, or shrinks it below 1 sq in is rejected and the corner stops. Free-shape furniture refuses self-crossing outlines the same way. Furniture is never blocked, only warned about.
- **Drags that survive a stray pointer.** Every drag captures the pointer and also handles `pointercancel`, so a drag cannot get stuck.
- **Bugs found by a fresh reviewer, fixed test-first.** A final whole-branch review found four serious bugs, such as a triangular room being destroyed by dragging a corner across the opposite wall. Each was reproduced with a failing test before it was fixed.

## What it is

- **Layouts:** create, rename, duplicate, open and delete. Each card shows a thumbnail of the room and the number of pieces. A new layout starts as a 12' × 12' rectangle.
- **Rooms of any shape:** a polygon you edit by dragging corners, clicking a wall to add a corner, removing a corner (3 minimum), or typing a wall length such as `12' 6"`. The corner at the end of that wall moves to match.
- **Furniture:** rectangle, ellipse, L-shape or free polygon, each with a label, width, depth, rotation and color. Eight presets give realistic starting sizes: twin bed, queen bed, sofa, desk, dresser, table, armchair and bookshelf. Every preset can be resized.
- **Moving things:** drag to move, square handles to resize in the piece's own rotated axes, a dot above the piece to rotate (hold Shift for 15° steps), and double-click to rename.
- **Warnings:** a piece that overlaps another, or leaves the room, gets a red outline and a `!` badge. Touching counts as fine: overlap and outside-room tests use a 0.1 inch tolerance, so a bed flush against a wall stays clean.
- **Canvas:** scroll to zoom, drag empty space to pan, and a scale grid.

## How it works

**Inches inside, feet and inches outside.** Every length is stored in inches. `src/units/feetInches.js` converts only at the edges, parsing `12' 6"`, `12'6`, `12.5` and `150"`, and formatting back to `12' 6"`.

**Layouts are plain data.**

```js
Layout    { id, name, room: { points: [{x, y}] }, furniture: [Furniture] }
Furniture { id, label, kind: 'rect' | 'ellipse' | 'lshape' | 'polygon',
            x, y, width, depth, rotation, color }   // polygon pieces carry their own points
```

y points down, as in SVG, and the room polygon is kept in one consistent winding on every edit.

**Warnings come from outlines.** `src/geometry/furnitureOutline.js` turns any piece into a world-space polygon (shape, then rotation, then position). Ellipses become 32-sided polygons. Overlap uses segment intersection plus point-in-polygon, which handles concave rooms and L-shapes; "inside the room" means every outline point is inside and no edge crosses a wall.

**Edits go through the store.** A drag or a typed field calls `updateLayout`, the store notifies its subscribers, and the editor redraws the canvas and recomputes warnings. That is why leaving the editor never loses work.

## Testing

- `npm test` runs 248 Vitest tests in 24 files, in about 5 seconds. They mirror `src`, and `tests/e2e/session.test.js` replays a whole session: create a layout, edit the room, add furniture, leave, return, duplicate, delete.
- The geometry and unit code is tested as pure functions, including round trips (parse, then format, then parse).
- Every bug fix was written test-first: the test was seen failing before the fix went in.
- **Real browser:** the built app was also driven in headless Chrome with real mouse input and passed 20 of 20 checks, with no console errors and nothing written to localStorage. That script is a one-off and is not part of the repo, so these checks are not rerun by `npm test`.

## Get started

Requires Node.js 24.

```
npm install
npm run dev       # dev server, prints a localhost URL
npm test          # unit and integration tests
npm run build     # production build into dist/
```

If `node` is not found after installing it to `~/.local/node`, run `source ~/.zshrc`.

## Repository map

```
src/units/       feet and inches parsing and display
src/geometry/    polygons, rotation, overlap, resizing, furniture outlines
src/model/       layouts, the store, presets, warnings, edit rules. No DOM.
src/render/      the only code that draws: viewport, grid, room, furniture, thumbnails
src/views/       the home and editor screens (views/home, views/editor)
src/app/         the router that switches between screens
styles/          CSS
tests/           mirrors src, plus tests/e2e for a whole session
CLAUDE.md        decisions, rules and status for the project
```

## Roadmap

Not scheduled. Deliberately left out of version 1: snap-to-grid, undo and redo, a 3D view, and saving to disk.

- **3D:** add a renderer next to `src/render` that reads the same layouts from the store.
- **Saving:** change `src/model/store.js` only: load layouts on startup and save after each change.

Known rough edges:

- A piece's label can be hidden behind a piece drawn on top of it.
- The layout name field does not refresh after a blank rename (it is stored as "Untitled").
- The side panel is rebuilt on every change, so keyboard focus is lost after a field is committed.
- Length fields reject `.5` and fractions such as `6 1/2"`, and show no message when input is refused.
- A free shape can drift from its own center after vertex edits.
- Double-clicking a handle opens the rename prompt.
- L-shape arm thickness can be set from 1 inch up to the full width.
- Touch screens can drag but cannot pinch-zoom.
- A refused room edit gives no message; the corner just stops.

## Privacy

The app runs entirely in your browser. It sends no data anywhere, sets no cookies, and uses no browser storage.

## Credits

No third-party code ships with the app. Vite, Vitest and jsdom are build and test tools only.

## License

None chosen yet.
