const FRAME_WIDTH = 320;
const FRAME_HEIGHT = 250;

export const DEALER_ASSETS = Object.freeze({
  displayArea: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT
  },
  talking: {
    key: "duncan-talking",
    url: "/assets/sprites/dealer/duncan-talk.png",
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT
  },
  animations: {
    idle: {
      key: "duncan-idle-sheet",
      animationKey: "duncan-idle",
      url: "/assets/sprites/dealer/duncan-idle.png",
      frameWidth: FRAME_WIDTH,
      frameHeight: FRAME_HEIGHT,
      frameDurationsMs: [1250, 600, 1000, 600],
      repeat: -1
    },
    blink: {
      key: "duncan-blink-sheet",
      animationKey: "duncan-blink",
      url: "/assets/sprites/dealer/duncan-blink.png",
      frameWidth: FRAME_WIDTH,
      frameHeight: FRAME_HEIGHT,
      frameDurationsMs: [1250, 600, 100, 100, 100, 1000, 600],
      repeat: 0
    },
    twitchBlink: {
      key: "duncan-twitch-blink-sheet",
      animationKey: "duncan-twitch-blink",
      url: "/assets/sprites/dealer/duncan-twitch-blink.png",
      frameWidth: FRAME_WIDTH,
      frameHeight: FRAME_HEIGHT,
      frameDurationsMs: [1250, 600, 100, 100, 100, 1000, 600, 100, 100, 100],
      repeat: 0
    },
    twitchBlinkFast: {
      key: "duncan-twitch-blink-fast-sheet",
      animationKey: "duncan-twitch-blink-fast",
      url: "/assets/sprites/dealer/duncan-twitch-blink-fast.png",
      frameWidth: FRAME_WIDTH,
      frameHeight: FRAME_HEIGHT,
      frameDurationsMs: [1250, 100, 100, 100, 100, 1000, 100, 100, 100, 100],
      repeat: 0
    }
  }
} as const);

export const DEALER_IDLE_VARIATIONS = [
  { name: "blink", weight: 5 },
  { name: "twitchBlink", weight: 3 },
  { name: "twitchBlinkFast", weight: 1 }
] as const;

export type DealerIdleVariationName =
  (typeof DEALER_IDLE_VARIATIONS)[number]["name"];
