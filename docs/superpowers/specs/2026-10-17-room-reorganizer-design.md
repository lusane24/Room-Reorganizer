# Room Reorganizer: Design

Date: 2026-10-17. Status: draft for review.

## Intent
The user is rearranging real rooms and wants to try arrangements on screen before moving anything. They need to model any room, including odd shapes, and place their actual furniture at its real size. Several candidate layouts should be kept side by side for the length of one session so they can be compared and revised.

## Goals
- Model a room as any polygon, in feet and inches.
- Add furniture with a label, a basic shape, a size, and a rotation, and drag it freely.
- Keep many layouts. Create, rename, open, edit, leave, reopen and delete them without loss while the program is running.
- Warn visibly when furniture overlaps other furniture or leaves the room.
- Keep the code readable, separated by responsibility, and easy to extend. The user reads the code and will keep adding to it.

## Non-goals
- No persistence past the running page. Closing or refreshing deletes everything. Nothing goes to disk, localStorage, or a server.
- No snap-to-grid, undo/redo, or 3D in this version.
- No multi-user, accounts, or import/export.

## Anti-goals
- A rewrite when 3D or saving is added later. The data model must not depend on how it is drawn.
- Warnings that block the user. Placement is always allowed.

## Decisions made with the user
- Plain JavaScript with ES modules, no UI framework. Rendering is 2D SVG.
- Vite dev server, Vitest tests. Node.js v24 LTS is installed at `~/.local/node`.
- Two screens: a home screen (layout list) and an editor.
- Layouts auto-save to an in-memory store when edited. No Save button (assumed, user has not objected).
- Room shape: draggable corners, add corner by clicking an edge, delete corner (minimum 3), and editable wall lengths. All edit the same polygon.
- Furniture shapes: rectangle, ellipse, L-shape, free polygon. Labeled, resizable, rotatable.
- Folder layout as in `CLAUDE.md`.

## Architecture
Layers, with dependencies pointing downward only:

1. `units/` and `geometry/`: pure functions, no state, no DOM.
2. `model/`: data shapes and rules. `store.js` is the single owner of all layouts.
3. `render/`: draws model data into SVG. Knows nothing about screens.
4. `views/`: the home and editor screens. Handle user input, call the store, ask render to draw.
5. `main.js`: starts the app and switches views.

A 3D renderer later is a sibling of `render/` reading the same model. Saving later is a change inside `store.js` only.

### Data model
```
Layout    { id, name, room: Room, furniture: Furniture[] }
Room      { points: [{x, y}] }                    // inches, polygon, clockwise
Furniture { id, label, kind: 'rect'|'ellipse'|'lshape'|'polygon',
            x, y,            // center, inches
            width, depth,    // inches (rect, ellipse, lshape)
            points,          // polygon kind only, relative to center
            rotation,        // degrees
            color }
```
All stored values are inches. Conversion to feet and inches happens only at the display and input edge, in `units/`.

### Store
`store.js` exposes `createLayout(name)`, `getLayout(id)`, `listLayouts()`, `updateLayout(id, change)`, `deleteLayout(id)`, `subscribe(fn)`. Views subscribe and re-render on change. Nothing else holds layout data. Edits during dragging update the store continuously, so leaving the editor never loses work. New layouts start as a 12' by 12' rectangle.

### Geometry
- Furniture outline as a world-space polygon (apply shape, rotation, position). Ellipses are approximated by a many-sided polygon for collision.
- Polygon-polygon overlap (separating axis for convex pieces; segment-intersection plus point-in-polygon covers concave rooms and L-shapes).
- "Inside room" test: every outline vertex inside the room polygon and no edge crossings.
- Wall length and angle from points, and moving a corner so a wall reaches a typed length.

### Units
Parse `12' 6"`, `12'6`, `12.5`, `150"` into inches. Format inches as `12' 6"`. Round-trip tests.

### Editor behavior
- Canvas with pan, zoom, and a scale grid. Pointer events so touch works.
- Selecting furniture shows resize handles and a rotation handle (Shift = 15° steps).
- Side panel, Room tab: wall list with editable lengths, add and delete corner.
- Side panel, Furniture tab: add piece (pick shape), edit label, width, depth, rotation, color, delete.
- Colliding pieces and pieces outside the room get a red outline and a badge. Recomputed on every change.

### Home behavior
Cards for each layout (name, small room thumbnail, furniture count). New layout, rename, delete (with confirm), open.

## Constraints
- Runs locally in a modern desktop browser. macOS, Node v24, no admin rights.
- No framework and no runtime dependencies. Dev dependencies: Vite, Vitest.

## Left to the builder
Visual styling, exact handle sizes, default furniture presets and colors, thumbnail drawing approach, and test file breakdown. Builder should keep modules small and name files after what they do.

## Builder-check calls (made by the design author, marked as calls, not user decisions)
- **L-shape:** adds `armWidth` and `armDepth` (the thickness of the two arms, default one third of width and depth). Handles resize the bounding box. Arm thickness is edited in the panel.
- **Polygon furniture:** starts as a rectangle with four points. Corners drag, edge-click adds one, delete removes one (minimum 3), same behavior as the room. Resize handles and the width and depth fields scale the points about the center. `width` and `depth` are derived from the points for this kind.
- **Wall length edit:** the later endpoint (in point order) moves along the wall's direction. Adjacent walls change as a result.
- **Invalid room edits:** a room edit that would make the outline cross itself is rejected and the corner snaps back. This differs from furniture, where nothing is ever blocked.
- **Room changes vs furniture:** furniture stays where it is. Pieces left outside the room show the outside warning.
- **Coordinates:** y points down, as in SVG. The room polygon is normalized to a consistent winding on every edit, so callers never depend on it.
- **Touching is not a collision.** Overlap and "outside room" tests use a 0.1 inch tolerance, so flush placement against walls and other pieces is clean.
- **Ellipse collision outline:** 32 sides.
- **Resize on rotated pieces:** handles work in the piece's own rotated axes, and the opposite edge stays fixed.
- **Add furniture:** shape picker plus a small list of presets with realistic sizes (see open points).
- **Project state:** greenfield. `CLAUDE.md` exists in the project root and holds the folder layout. No git repo yet.

## Open points
- None. The user approved both additions on 2026-10-17: a **Duplicate** button on each home card (copies room and furniture into a new layout), and **furniture presets** (twin and queen bed, sofa, desk, dresser and similar, with realistic starting sizes, all still resizable).
- Home and editor screen mockups have not been reviewed by the user. Layout of the editor side panel is the builder's proposal until then.
