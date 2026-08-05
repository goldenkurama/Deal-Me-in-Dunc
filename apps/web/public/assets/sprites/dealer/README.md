# Duncan animation sheets

Each PNG is a horizontal sprite sheet made from the corresponding LibreSprite
GIF. Every frame is a 320×250 transparent canvas.

| File | Frames | Configured frame durations (ms) |
| --- | ---: | --- |
| `duncan-idle.png` | 4 | 1000, 300, 500, 300 |
| `duncan-blink.png` | 7 | 1000, 300, 100, 100, 100, 500, 300 |
| `duncan-twitch-blink.png` | 10 | 1000, 300, 100, 100, 100, 500, 300, 100, 100, 100 |
| `duncan-twitch-blink-fast.png` | 10 | 1000, 100, 100, 100, 100, 500, 100, 100, 100, 100 |

The original GIFs remain in the artist's animations folder. Phaser preloads
these sheets and chooses a one-shot idle variation at randomized intervals.
