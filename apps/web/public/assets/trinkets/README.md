Trinket art contract
====================

Draw each Trinket as a 48 x 48 pixel transparent PNG. The table renders the
art at that native size with nearest-neighbor filtering.

Each Trinket already has an individual URL and texture key in
`src/assets/trinketAssets.ts`. To replace the shared placeholder:

1. Add the PNG using the filename listed in that manifest.
2. Change that Trinket's `ready` value from `false` to `true`.

The current `trinket-placeholder.png` source is 160 x 160 pixels and is scaled
down to 48 x 48 until the individual art is available.
