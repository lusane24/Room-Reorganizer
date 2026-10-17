# Room Reorganizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A 2D in-browser tool where the user models any room polygon, places labeled and resizable furniture, and keeps several layouts that can be reopened and edited while the page stays open.

**Architecture:** Pure `units/` and `geometry/` at the bottom, a `model/` layer whose `store.js` owns all layouts, a `render/` layer that draws model data to SVG, and `views/` (home, editor) on top. Nothing above `model/` holds layout data. A future 3D renderer or saving layer is a sibling or a change inside `store.js`.

**Tech Stack:** Plain JavaScript (ES modules), SVG, Vite (dev server), Vitest + jsdom (tests). Node v24 at `~/.local/node`.

**Spec:** `docs/superpowers/specs/2026-10-17-room-reorganizer-design.md` (read it first; "Builder-check calls" holds many pinned values). Folder layout also in `CLAUDE.md`.

## Global Constraints
- No UI framework and no runtime dependencies. Dev dependencies only: `vite`, `vitest`, `jsdom`.
- All stored lengths are **inches**; feet/inches conversion only in `src/units/`.
- y axis points down (SVG). Room polygon is normalized to one winding on every edit.
- Nothing is persisted: no localStorage, files, or network. Reload clears everything.
- Furniture is never blocked from any placement. Room edits that would make the outline cross itself are rejected (corner snaps back).
- Touching is not a collision: overlap and outside tests use a **0.1 inch** tolerance. Ellipse collision outline has **32** sides.
- New layout starts as a 12' by 12' rectangle (144 x 144 in). Room minimum 3 corners; polygon furniture minimum 3 points.
- `model/` never touches the DOM. `render/` is the only code that writes SVG.
- Keep modules small, named after what they do. Update `CLAUDE.md` status checklist as tasks finish.

## Review Focus
1. Typing junk into any size or length field (empty, `abc`, `0`, negative): keeps the previous value, never produces `NaN` or a zero-size piece (min piece size 6 in).
2. Opening a layout id that no longer exists (deleted, or stale): returns to home without an error.
3. Deleting a room corner at 3 corners, or dragging a corner so the room crosses itself: refused, room unchanged.
4. Rotated pieces: rotation of `-30`, `360`, `725` behaves as its normalized angle, and collisions use the rotated outline.
5. Empty or whitespace layout name or furniture label: falls back to `Untitled` / `Furniture`; duplicate names are allowed.

---

### Task 1: Scaffold project
**Files:**
- Create: `package.json`, `vite.config.js`, `.gitignore`, `index.html`, `README.md`, `src/main.js`, `styles/base.css`, `tests/smoke.test.js`
- Modify: `CLAUDE.md` (check off scaffold)

**Interfaces:**
- Produces: `npm run dev`, `npm test` (Vitest, jsdom environment), mount element `<div id="app">`, and `src/main.js` exporting nothing yet.

- [ ] **Step 1:** `git init`; add `.gitignore` for `node_modules`, `dist`.
- [ ] **Step 2:** `npm init`, then `npm i -D vite vitest jsdom`. Scripts: `dev`, `build`, `test` (`vitest run`). Vitest `environment: 'jsdom'` in `vite.config.js`.
- [ ] **Step 3: Write failing test** `tests/smoke.test.js`: `it('mounts app root', ...)` asserts that importing `src/main.js` against a document with `#app` leaves `#app` non-empty.
- [ ] **Step 4:** Run `npm test`. Expected: FAIL.
- [ ] **Step 5:** Implement `src/main.js` rendering a placeholder heading into `#app`; `index.html` loads it as a module with `styles/base.css`. README gives run commands and folder summary.
- [ ] **Step 6:** `npm test` passes; `npm run dev` serves a page showing the heading.
- [ ] **Step 7:** Commit `chore: scaffold vite and vitest`.

### Task 2: Units
**Files:** Create `src/units/feetInches.js`; Test `tests/units/feetInches.test.js`

**Interfaces:**
- Produces: `parseLength(text: string): number | null` (inches, `null` if invalid or not > 0) and `formatLength(inches: number): string`.

- [ ] **Step 1: Failing tests:** `parseLength("12' 6\"") === 150`, `"12'6" === 150`, `"12.5" === 150` (bare number is feet), `"150\"" === 150`, `"6in" === 6`, and `parseLength("abc")`, `""`, `"0"`, `"-3"` are all `null`. `formatLength(150) === "12' 6\""`, `formatLength(144) === "12'"`, `formatLength(6) === "6\""`, and `parseLength(formatLength(x)) === x` for `x` in `[6, 13, 150, 144, 97.5]`.
- [ ] **Step 2:** Run, expect FAIL. **Step 3:** Implement both functions (round format to nearest 0.5 in). **Step 4:** Run, expect PASS. **Step 5:** Commit.

### Task 3: Geometry core
**Files:** Create `src/geometry/polygon.js`, `src/geometry/transform.js`; Test `tests/geometry/polygon.test.js`, `tests/geometry/transform.test.js`

**Interfaces:**
- Produces (all points are `{x, y}` in inches):
  - `normalizeWinding(points): Point[]` (consistent winding, y-down)
  - `selfIntersects(points): boolean`
  - `pointInPolygon(p, points): boolean`
  - `polygonsOverlap(a, b, tolerance = 0.1): boolean` (works for concave shapes; touching returns false)
  - `polygonInside(inner, outer, tolerance = 0.1): boolean`
  - `wallLengths(points): number[]` (wall `i` runs from point `i` to `i+1`, wrapping)
  - `setWallLength(points, i, length): Point[]` (moves point `i+1` along the wall direction; does not mutate)
  - `rotatePoint(p, center, degrees): Point`, `normalizeAngle(deg): number` (range `[0, 360)`), `ellipsePolygon(w, d, sides = 32): Point[]`

- [ ] **Step 1: Failing tests:** two squares sharing an edge are not overlapping; overlapping by 1 in are; an L-shaped outer contains a square in its arm but not one in its notch; bowtie `[(0,0),(10,10),(10,0),(0,10)]` self-intersects and a square does not; `wallLengths` of a 12x12 ft square is four 144s; `setWallLength(square, 0, 100)` makes wall 0 length 100 and leaves point 0 unchanged; `normalizeAngle(-30) === 330`, `(360) === 0`, `(725) === 5`; `rotatePoint({x:1,y:0},{x:0,y:0},90)` is `(0,1)` within 1e-9; `ellipsePolygon(10,10).length === 32`.
- [ ] **Step 2:** Run, expect FAIL. **Step 3:** Implement. Overlap: edge-intersection test plus point-in-polygon containment either way, with tolerance shrinking the test (touching counts as clear). **Step 4:** Run, PASS. **Step 5:** Commit.

### Task 4: Furniture outlines and resizing math
**Files:** Create `src/geometry/furnitureOutline.js`, `src/geometry/resize.js`; Test `tests/geometry/furnitureOutline.test.js`, `tests/geometry/resize.test.js`

**Interfaces:**
- Consumes: Task 3 geometry.
- Produces:
  - `furnitureOutline(f: Furniture): Point[]` world-space polygon for kinds `rect`, `ellipse`, `lshape`, `polygon` (applies shape, `rotation`, center `x,y`). `lshape` uses `armWidth`, `armDepth`; `polygon` uses `points` relative to center.
  - `resizeFurniture(f, handle: 'n'|'s'|'e'|'w'|'ne'|'nw'|'se'|'sw', localDelta: {x,y}): Furniture` resizes in the piece's own rotated axes, keeps the opposite edge fixed, clamps width and depth to a minimum of 6 in, and scales `points` for `polygon` kind (returns new object).
  - `MIN_PIECE_SIZE = 6`.

- [ ] **Step 1: Failing tests:** unrotated 60x80 rect centered at (100,100) has bounding box x 70–130, y 60–140; rotated 90 it is x 60–140, y 70–130; `lshape` outline has 6 points and area `w*d - (w-armWidth)*(d-armDepth)`; ellipse outline has 32 points; `resizeFurniture` on handle `e` with delta +10 grows width 10 and moves center 5 along the piece's local x (check for rotation 0 and 90); shrinking by more than available clamps width to 6.
- [ ] **Step 2:** Run, FAIL. **Step 3:** Implement. **Step 4:** Run, PASS. **Step 5:** Commit.

### Task 5: Model and store
**Files:** Create `src/model/room.js`, `src/model/furniture.js`, `src/model/presets.js`, `src/model/layout.js`, `src/model/store.js`; Test `tests/model/store.test.js`, `tests/model/furniture.test.js`, `tests/model/room.test.js`

**Interfaces:**
- Consumes: Task 3 and 4 geometry.
- Produces:
  - `room.js`: `defaultRoom(): Room` (144x144 square), `moveCorner(room, i, point): Room` (returns `room` unchanged if the result self-intersects), `insertCorner(room, edgeIndex, point): Room`, `deleteCorner(room, i): Room` (unchanged at 3 corners), `setRoomWallLength(room, i, length): Room` (unchanged if self-intersecting or `length` invalid).
  - `furniture.js`: `createFurniture(kind, overrides?): Furniture` (defaults: label `Furniture`, rotation 0, `lshape` arms one third of width and depth, `polygon` starts as four rectangle points), `updateFurniture(f, change): Furniture` (blank label becomes `Furniture`, rotation normalized, sizes clamped to `MIN_PIECE_SIZE`, non-finite numbers ignored).
  - `presets.js`: `PRESETS: {id, label, kind, width, depth}[]` (twin bed 38x75, queen bed 60x80, sofa 84x36, desk 60x30, dresser 60x18, table 48x30, armchair 34x34, bookshelf 36x12).
  - `layout.js`: `createLayoutObject(name): Layout` (blank name becomes `Untitled`).
  - `store.js`: `createLayout(name): string` (id), `getLayout(id): Layout | undefined`, `listLayouts(): Layout[]`, `updateLayout(id, change: (layout) => Layout): void`, `renameLayout(id, name)`, `duplicateLayout(id): string` (deep copy, name `"<name> copy"`, new ids for layout and furniture), `deleteLayout(id)`, `subscribe(fn): unsubscribe`, `resetStore()` (tests only). Listeners fire after every change.

- [ ] **Step 1: Failing tests:** creating two layouts lists both in order; `deleteLayout` removes one only; `getLayout` of a deleted id is `undefined`; `duplicateLayout` produces equal room and furniture content with different ids, and editing the copy does not change the original; subscribers fire on update and stop after unsubscribe; `moveCorner` that crosses the room over itself returns the original; `deleteCorner` on a 3-corner room is unchanged; `updateFurniture(f, {label: "  "}).label === "Furniture"`; `updateFurniture(f, {width: NaN})` keeps old width; `updateFurniture(f, {width: 2}).width === 6`; `updateFurniture(f, {rotation: 725}).rotation === 5`; a blank layout name becomes `Untitled` and two layouts may share a name.
- [ ] **Step 2:** Run, FAIL. **Step 3:** Implement with immutable updates (return new objects). **Step 4:** Run, PASS. **Step 5:** Commit.

### Task 6: Collision warnings
**Files:** Create `src/model/warnings.js`; Test `tests/model/warnings.test.js`

**Interfaces:**
- Consumes: `furnitureOutline`, `polygonsOverlap`, `polygonInside`, Layout.
- Produces: `computeWarnings(layout: Layout): Map<furnitureId, {overlaps: string[], outside: boolean}>` with an entry only for pieces that have a warning.

- [ ] **Step 1: Failing tests:** piece flush against a wall and another flush piece produce no warnings; overlapping pieces list each other; piece partly outside gets `outside: true`; a rotated 725° piece uses the 5° outline; a piece in the notch of an L-shaped room is flagged outside; empty furniture gives an empty map.
- [ ] **Step 2:** Run, FAIL. **Step 3:** Implement. **Step 4:** Run, PASS. **Step 5:** Commit.

### Task 7: App shell and home view
**Files:** Create `src/app/router.js`, `src/views/home/homeView.js`, `src/views/home/layoutCard.js`, `src/render/thumbnail.js`, `styles/home.css`; Modify `src/main.js`; Test `tests/views/homeView.test.js`

**Interfaces:**
- Consumes: store API (Task 5).
- Produces: `router.js` with `showHome()`, `showEditor(layoutId)` (falls back to `showHome()` if the id does not exist), `mountApp(root)`; `renderHome(root, {onOpen(id)})`; `thumbnailSvg(room: Room, furniture: Furniture[], size): SVGElement`.

- [ ] **Step 1: Failing tests (jsdom):** home shows an empty state message with zero layouts; clicking New layout (name from a text input, blank allowed) adds a card with the name and `0 pieces`; Delete asks `confirm` and removes only on yes; Duplicate adds a card named `"<name> copy"`; Rename changes the card title; clicking a card calls `onOpen` with its id; `showEditor("missing")` ends on the home view.
- [ ] **Step 2:** Run, FAIL. **Step 3:** Implement; home subscribes to the store and re-renders. **Step 4:** Run, PASS; open in browser and click through. **Step 5:** Commit.

### Task 8: Canvas rendering and viewport
**Files:** Create `src/render/viewport.js`, `src/render/roomRenderer.js`, `src/render/furnitureRenderer.js`, `src/render/gridRenderer.js`; Test `tests/render/viewport.test.js`, `tests/render/renderers.test.js`

**Interfaces:**
- Consumes: `furnitureOutline`, `formatLength`.
- Produces: `createViewport(): {pan, zoom, toWorld(px, py), toScreen(x, y), panBy(dx, dy), zoomAt(px, py, factor)}` (zoom clamped 0.2–8, world units are inches); `renderRoom(svgGroup, room, opts)`, `renderFurniture(svgGroup, furnitureList, {selectedId, warnings})` (label drawn upright, red outline when the id is in `warnings`), `renderGrid(svgGroup, viewport, size)` (1-foot lines).

- [ ] **Step 1: Failing tests:** `toWorld(toScreen(p))` round-trips; `zoomAt` keeps the point under the cursor fixed; zoom clamps at both limits; renderer output has one `<path>`/shape per piece, a `<text>` with the label, and a `warning` class only for ids in the map; label stays upright for a rotated piece.
- [ ] **Step 2:** Run, FAIL. **Step 3:** Implement. **Step 4:** Run, PASS. **Step 5:** Commit.

### Task 9: Editor shell and room editing
**Files:** Create `src/views/editor/editorView.js`, `src/views/editor/canvasInput.js`, `src/views/editor/roomTab.js`, `src/views/editor/roomHandles.js`, `styles/editor.css`; Test `tests/views/roomTab.test.js`, `tests/views/roomHandles.test.js`

**Interfaces:**
- Consumes: store, `room.js` edit functions, viewport and renderers, `parseLength`, `formatLength`.
- Produces: `renderEditor(root, layoutId, {onBack})` (top bar with back button and editable layout name, canvas with pan by dragging empty space and wheel zoom, side panel with Room and Furniture tabs); `renderRoomTab(container, layoutId)`; `attachRoomHandles(svg, viewport, layoutId)` (drag corner, click edge midpoint to insert, right-click or Delete key on a selected corner removes it).

- [ ] **Step 1: Failing tests (jsdom):** room tab lists one row per wall formatted like `12'`; typing `10'` into wall 0 updates the room via the store; typing `abc`, `0`, or empty restores the previous value; deleting a corner on a 3-corner room does nothing; simulated pointer drag of a corner moves it by the drag delta in inches; a drag that crosses the room over itself leaves the stored room unchanged; edge-click inserts a corner at that point.
- [ ] **Step 2:** Run, FAIL. **Step 3:** Implement; pointer events with `setPointerCapture`; all edits go through `updateLayout`. **Step 4:** Run, PASS; verify in browser (make an L-shape). **Step 5:** Commit.

### Task 10: Furniture add, select, move, panel
**Files:** Create `src/views/editor/furnitureTab.js`, `src/views/editor/furnitureDrag.js`; Test `tests/views/furnitureTab.test.js`, `tests/views/furnitureDrag.test.js`

**Interfaces:**
- Consumes: `createFurniture`, `updateFurniture`, `PRESETS`, renderers.
- Produces: `renderFurnitureTab(container, layoutId, selection)` with add-by-shape buttons, preset dropdown, and fields for label, width, depth, rotation, color, and delete for the selected piece (`lshape` also shows arm width and arm depth); `attachFurnitureDrag(svg, viewport, layoutId, selection)` (click selects, drag moves, click empty space deselects, Delete key removes the selected piece, double-click edits the label); `selection: {get(): string|null, set(id|null), subscribe(fn)}`.

- [ ] **Step 1: Failing tests:** adding a queen bed preset creates a 60x80 piece labeled `Queen bed` centered in the room; selecting a piece fills the fields; changing width to `5'` stores 60; width `abc`, `0`, `-3` keep the old value; blank label becomes `Furniture`; rotation `-30` stores 330; drag moves the center by the pointer delta in inches; Delete removes only the selected piece; pieces are never refused a position (drag outside the room works).
- [ ] **Step 2:** Run, FAIL. **Step 3:** Implement. **Step 4:** Run, PASS; verify in browser. **Step 5:** Commit.

### Task 11: Resize, rotate, and shape handles
**Files:** Create `src/views/editor/furnitureHandles.js`, `src/views/editor/polygonHandles.js`; Test `tests/views/furnitureHandles.test.js`, `tests/views/polygonHandles.test.js`

**Interfaces:**
- Consumes: `resizeFurniture`, `normalizeAngle`, `rotatePoint`.
- Produces: `attachFurnitureHandles(svg, viewport, layoutId, selection)` (8 resize handles in rotated axes, rotation handle above the piece, Shift snaps rotation to 15°); `attachPolygonHandles(...)` for `polygon` kind (drag vertex, edge-click inserts, right-click or Delete removes; minimum 3 points).

- [ ] **Step 1: Failing tests:** dragging the east handle on a piece rotated 90 resizes along its local axis; resize cannot go below 6 in; rotation handle drag sets the angle toward the pointer; with Shift the angle is a multiple of 15; rotation result is in `[0, 360)`; polygon vertex drag moves that point only; deleting a vertex at 3 points does nothing; `lshape` arm values are preserved on resize.
- [ ] **Step 2:** Run, FAIL. **Step 3:** Implement. **Step 4:** Run, PASS; verify in browser. **Step 5:** Commit.

### Task 12: Live collision display
**Files:** Modify `src/views/editor/editorView.js`, `src/render/furnitureRenderer.js`; Test `tests/views/editorWarnings.test.js`

**Interfaces:**
- Consumes: `computeWarnings`, store subscription.
- Produces: the editor recomputes warnings on every store change and passes them to `renderFurniture`; a warning badge shows on flagged pieces; the Furniture tab shows `Overlaps: <labels>` and `Outside room` for the selected piece.

- [ ] **Step 1: Failing tests:** moving a piece onto another adds `warning` to both; moving it away clears both; resizing a piece out through a wall flags `Outside room`; reshaping the room so a piece is left outside flags it without moving it; flush placement shows no warning.
- [ ] **Step 2:** Run, FAIL. **Step 3:** Implement. **Step 4:** Run, PASS. **Step 5:** Commit.

### Task 13: End-to-end pass and docs
**Files:** Modify `README.md`, `CLAUDE.md`; Test `tests/e2e/session.test.js`

- [ ] **Step 1: Failing test** (jsdom, whole app): create layout A, reshape room, add a bed and sofa, go back home, create layout B, duplicate A, open A again and check room and furniture are exactly as left, delete the copy, and A is untouched.
- [ ] **Step 2:** Run, FAIL (fix whatever is missing). **Step 3:** Run, PASS.
- [ ] **Step 4:** Manual run through the spec's Goals in the browser (`npm run dev`): L-shaped room, typed wall length, queen bed rotated 30° into a wall shows red, flush stays clean, refresh clears everything. Check the console is free of errors.
- [ ] **Step 5:** Update README (how to run, folder map, how to add a renderer) and tick every checklist item in `CLAUDE.md`. Commit.
