# WastraCanvas Agent Instructions

Read `ARCHITECTURE.md` before changing this feature.

## Boundaries

- Keep `resources/js/Pages/WastraCanvas.jsx` as the page-level composition and cross-domain coordinator. Do not put large JSX regions back into the page.
- Put visual regions in focused `.jsx` components. Split a component again when it starts owning multiple independent workflows.
- Put stateful browser behavior in `hooks/`. A hook should own one domain: rendering, drawing interaction, history, malam processing, tutorial flow, saved drawings, or collaboration.
- Keep shared constants in `constants.js` and Laravel request headers in `http.js`.
- Load the two Three.js malam scenes only through `MalamScenes.jsx`; they must remain lazy-loaded.

## Invariants

- The artwork lives on an offscreen `960 × 960` canvas. The visible canvas composites the cloth/guide layer and artwork layer. Do not paint guides or the cloth background into the artwork canvas.
- World-space strokes must remain independent of pan and zoom. Convert pointer coordinates to world coordinates before drawing.
- Preserve the malam state sequence: `cold → preparing → heating → pouring → ready → drawing → hardened`.
- Preserve the local-storage keys `wastrakarya_studio_save` and `wastrakarya_studio_session` unless a migration is implemented.
- Preserve the Echo presence channel name `canvas.{drawingId}` and the whisper names/payload contracts: `stroke`, `cursor`, `clear`, `trace`, `motif`, `request_sync`, and `sync_state_chunk`.
- Collaboration snapshot chunk limits belong in `constants.js`. Validate chunk count, index, size, target user, and timeout before applying remote data.
- Only owners may persist or share a drawing. Non-owner editing remains gated by an active subscription.
- Use Tailwind CSS v3-compatible utilities and follow the existing dark studio palette.

## Verification

After changing WastraCanvas:

1. Run `npm run build`.
2. Run `php artisan test --compact tests/Feature/CanvasCollaborationTest.php` when collaboration, sharing, ownership, or loading behavior is touched.
3. Manually verify drawing, pan/zoom, undo/redo, malam heating, save/load, tutorial, and remote cursors when the affected behavior can be exercised in a browser.
