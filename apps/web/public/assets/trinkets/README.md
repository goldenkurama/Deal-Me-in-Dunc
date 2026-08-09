Trinket art contract
====================

Draw each Trinket as a 48 x 48 pixel transparent PNG. The table renders the
art at that native size with nearest-neighbor filtering.

All 18 current Trinkets have individual art enabled through
`src/assets/trinketAssets.ts`. To replace one later:

1. Overwrite its PNG using the filename listed in that manifest.
2. Keep that Trinket's `ready` value set to `true`.

`trinket-placeholder.png` remains available as the fallback for future art
that has not been marked ready.
