# Room Reorganizer

A 2D tool for trying out furniture arrangements. Layouts live in memory only: they survive moving between screens, but closing or refreshing the page clears them.

## Run
```
npm install
npm run dev     # dev server
npm test        # unit tests
```
Node.js is expected at `~/.local/node` (add `~/.local/node/bin` to PATH).

## Folders
- `src/units` feet/inches parsing and display
- `src/geometry` pure math (polygons, rotation, resizing)
- `src/model` layout data, store, collision warnings (no DOM)
- `src/render` SVG drawing only
- `src/views` home and editor screens
- `tests` mirrors `src`

See `CLAUDE.md` for decisions and `docs/superpowers/` for the design and build plan.
