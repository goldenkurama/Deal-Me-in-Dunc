# Duncan animation sheets

Each PNG is a horizontal sprite sheet made from the corresponding LibreSprite
GIF. Every frame is a 320×250 transparent canvas.

| File | Frames | Configured frame durations (ms) |
| --- | ---: | --- |
| `duncan-idle.png` | 4 | 1250, 600, 1000, 600 |
| `duncan-blink.png` | 7 | 1250, 600, 100, 100, 100, 1000, 600 |
| `duncan-twitch-blink.png` | 10 | 1250, 600, 100, 100, 100, 1000, 600, 100, 100, 100 |
| `duncan-twitch-blink-fast.png` | 10 | 1250, 100, 100, 100, 100, 1000, 100, 100, 100, 100 |

The original GIFs remain in the artist's animations folder. Phaser preloads
these sheets and chooses a one-shot idle variation at randomized intervals.
