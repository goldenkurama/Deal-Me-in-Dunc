# Trinket conveyor assets

- Conveyor canvas: `trinket-conveyor.png`, exactly 160 x 300 pixels.
- Slot openings: 72 x 72 pixels.
- Trinket sprites: draw on transparent 48 x 48 pixel canvases.
- Slot centers within the conveyor canvas: `(80, 70)`, `(80, 150)`, and
  `(80, 230)`.
- Slot 1 is newest and Slot 3 is oldest.

After adding the conveyor image, change `TRINKET_ASSETS.conveyor.ready` to
`true` in `src/assets/trinketAssets.ts`. Trinket image manifests can be added
to that file as individual trinkets are implemented.
