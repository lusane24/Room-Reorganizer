# Room Reorganizer

A 2D, in-browser tool for trying out furniture arrangements. You model a room of any shape, add labeled furniture of adjustable size and shape, and drag it around. Several layouts can be kept, reopened and edited while the program is running.

## Status
v1 is built and verified in headless Chrome with real mouse input. Update this section as work progresses.
- [x] Node.js v24 LTS installed at `~/.local/node` (on PATH via `~/.zshrc`)
- [x] Design approved (specs in `docs/superpowers/specs/`)
- [x] Scaffold (Vite + Vitest)
- [x] `geometry/` and `units/` with tests
- [x] `model/` and store
- [x] Home view (new, open, rename, duplicate, delete)
- [x] Editor view (room shape, furniture, rotation, collision warning)
- [ ] Not in v1: snap-to-grid, undo/redo, 3D, saving to disk

Known polish ideas (deferred from the final review):
- A piece's label can be hidden behind a piece drawn on top of it.
- The layout name field in the editor does not refresh after a blank rename (stored as "Untitled").
- The side panel is rebuilt on every change, so keyboard focus is lost after a field commits.
- Length fields reject `.5`, fractions like `6 1/2"`, and give no message when input is refused.
- After vertex edits a free shape can drift away from its own center (rotation and scaling use the piece origin).
- Double-clicking a handle opens the rename prompt.
- L-shape arm thickness can be set down to 1 in or up to the full width.

## Decisions
- **Stack:** plain JavaScript (ES modules), no framework. Vite for dev server, Vitest for tests. Rendering is SVG.
- **Storage:** in memory only. Layouts survive going from the editor back to home while the page is open. Closing or refreshing the page deletes everything. Nothing is written to disk or browser storage.
- **Saving:** edits auto-save to the store. No Save button. (Assumed, not yet confirmed.)
- **Units:** feet and inches, stored internally as inches.
- **Room shape:** any polygon. Edit by dragging corners, clicking an edge to add a corner, deleting a corner (minimum 3), or typing wall lengths.
- **Furniture:** labeled. Rectangle, ellipse, L-shape and free polygon. Resizable, rotatable.
- **Collision warning:** pieces overlapping each other or leaving the room get a red outline. A warning only, never blocks placement.
- **Out of scope for v1:** snap-to-grid, undo/redo, 3D, saving to disk. 3D is a possible later addition, so keep the data model separate from rendering.

## Architecture rules
- `model/` holds data and rules. It never touches the DOM.
- `render/` is the only code that draws. A future 3D renderer would read the same model.
- All layout access goes through `model/store.js`. No other module keeps its own copy of layouts.
- `geometry/` and `units/` are pure functions with tests.

## Folder layout
```
Room reorganizor/
  index.html
  README.md              how to run and how the code is organized
  CLAUDE.md              this file
  src/
    main.js              starts the app, switches home/editor
    app/                 router.js (home/editor switching)
    model/               layout, room, furniture, presets, store, layoutEdits, warnings, hitTest
    geometry/            overlap, rotation, polygon helpers
    units/               feet/inches parsing and display
    views/
      home/              layout list screen
      editor/            canvas, selection, drag, side panel
    render/              2D SVG drawing
  styles/
  tests/
```

## Commands
- `npm run dev` start the dev server
- `npm test` run Vitest

## Environment notes
- Node is installed at `~/.local/node`. If `node` is not found, run `source ~/.zshrc`.
