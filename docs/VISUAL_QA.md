# Nocturne Guard visual QA

The redesign was exercised against the live Vite application with `agent-browser`.

## Viewport matrix

| Viewport | Routes checked | Result |
| --- | --- | --- |
| 1440 × 1000 | role selection, parent monitor, settings | Pass |
| 390 × 844 | role selection, baby monitor, parent monitor, settings, help | Pass |
| 320 × 568 | role selection, baby monitor, settings | Pass |

## Checks

- No horizontal document overflow at any tested width.
- Long settings content scrolls vertically without clipped controls.
- Header, page margins, and bottom actions account for CSS safe-area insets.
- Video feeds remain the primary focus and preserve rounded clipping.
- Buttons and icon controls retain visible focus states and mobile touch targets.
- Both navigation paths and settings save feedback were exercised.
- Browser console contained no application exceptions.

## Iterations completed

1. Reframed exported nursery imagery to remove mock controls baked into the Stitch assets.
2. Removed an unrelated “Settings not changed” toast that appeared when leaving Settings.
3. Constrained intrinsic video sizing to eliminate a 3 px overflow at 320 px width.
4. Added explicit top, left, right, and bottom safe-area handling.

The final screenshots in `docs/screenshots/` were captured after these fixes from a reset application state.
