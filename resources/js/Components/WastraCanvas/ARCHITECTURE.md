# WastraCanvas Architecture Decision Record

Last updated: 2026-11-19

## Context

`WastraCanvas.jsx` had grown to 4,478 lines and combined page composition, large UI regions, canvas rendering, pointer interaction, undo/redo, malam timing, persistence, tutorials, and Laravel Echo collaboration. The coupling made small visual changes risky and made domain behavior difficult to locate.

## Decisions

### Keep the Inertia page as the coordinator

`resources/js/Pages/WastraCanvas.jsx` now composes the feature, owns metadata that crosses domains, and coordinates save/load/share flows. Large visual regions and self-contained browser behaviors live outside the page.

Explicit props are used instead of a feature-wide React context. This keeps dependencies visible at each component boundary and avoids making high-frequency pointer state update every consumer through one global provider.

### Separate behavior by domain hook

| Hook | Responsibility |
| --- | --- |
| `useCanvasRenderer` | Offscreen artwork canvas, cached base layer, and scheduled visible-canvas rendering |
| `useCanvasInteraction` | Tools, pointer-to-world conversion, stroke drawing, cursors, pan/zoom controls, and keyboard shortcuts |
| `useCanvasHistory` | Bounded artwork snapshots and undo/redo stacks |
| `useMalamProcess` | Malam state machine, heating/drawing timers, dialog animation, wax color, and actions |
| `useCanvasTutorial` | Tutorial progression, spotlight measurement, and popup targeting |
| `useCanvasCollaboration` | Echo presence membership, whispers, remote cursors/strokes, and chunked snapshot synchronization |
| `useToast` | Single timed toast lifecycle |

### Keep canvas layers distinct

The canvas has three conceptual layers:

1. A cached base layer containing cloth texture, motif guide, and optional tile grid.
2. An offscreen artwork layer containing only user and collaborator strokes.
3. The visible canvas, which applies pan/zoom and composites the first two layers.

This preserves clean exports, zoom-independent stroke widths, inexpensive guide changes, and reliable collaboration snapshots.

When a pakem motif is selected, pencil, canting, and eraser strokes repeat at the shared `160 × 160` motif interval. The repeated stroke wraps across canvas edges, while **Tanpa Pola** keeps free drawing untiled.

### Model the malam workflow as a state machine

Malam behavior remains in one hook because its timers, modal animation, color lock, and drawing eligibility are one workflow. Visual pieces are split into the tool panel and heating overlay components, while state transitions stay centralized in `useMalamProcess`.

### Treat collaboration messages as a protocol

Echo event names and payloads were not redesigned during this refactor. They are an interoperability contract between participants. Full-canvas synchronization remains chunked and guarded by size, count, target-user, duplicate-chunk, and timeout checks.

The `stroke` whisper includes whether the stroke was tiled. Receivers fall back to the active motif for strokes sent by older clients that do not include that flag.

### Lazy-load expensive 3D scenes

`MalamPouring3D` and `MalamHardening3D` are exported through `MalamScenes.jsx`. The hook may preload them immediately before use, while React Suspense controls their rendered loading state.

### Centralize request headers

`http.js` owns CSRF-aware JSON and non-JSON request headers. WastraCanvas API calls and `ShareModal` use the same implementation.

### Keep persistence authoritative and recovery scoped

Authenticated saves use the database as the source of truth. The `wastrakarya_studio_save` and `wastrakarya_studio_session` local-storage keys remain for guest persistence and legacy recovery, while `wastrakarya_mockup_snapshot` is a short-lived session recovery record. Recovery records are scoped to both canvas and user, never override newer server data, and are cleared after matching authenticated persistence succeeds.

Empty newly-created rows do not clear artwork already present in the editor. Artwork layers are persisted as compact WebP data URLs, and the canting size remains the decimal value `3.5`.

## Component Map

```text
WastraCanvas page
├── StudioHeader
├── CollaborationPreviewBanner
├── MalamToolPanel
│   ├── MalamStatusCard
│   ├── WaxColorPicker
│   └── DrawingToolPicker
├── CanvasWorkspace
│   ├── CanvasToolbar
│   └── CanvasSurface
├── MotifLibraryPanel
│   └── MotifGrid
├── HeatingOverlay
│   ├── PopupTutorialCard
│   ├── HeatingProcessSteps
│   ├── HeatingScene
│   └── HeatingStatus
├── TutorialSpotlight
├── MotifDetailModal
├── SaveDrawingModal
├── ShareModal
└── SubscriptionModal
```

## Extension Guidance

- Add a new toolbar action in `CanvasToolbar`, but keep its canvas mutation in the relevant hook or page coordinator.
- Add a new drawing tool in `DrawingToolPicker` and implement its stroke semantics in `useCanvasInteraction`.
- Add a new tutorial step in `constants.js`, then update automatic progression in `useCanvasTutorial` if it depends on an action.
- Add a new collaboration whisper only after documenting its payload and cleanup behavior here and in `AGENTS.md`.
- Avoid dependency changes for this feature unless the existing Canvas, React, Inertia, Echo, and Three.js stack cannot implement the requirement.
