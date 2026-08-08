import type { TrinketId } from "@fox-blackjack/game-core";

interface TrinketArtAsset {
  readonly key: string;
  readonly url: string;
  readonly ready: boolean;
}

export const TRINKET_ART: Readonly<Record<TrinketId, TrinketArtAsset>> = Object.freeze({
  "golf-scoring-card": { key: "trinket-golf-scoring-card", url: "/assets/trinkets/golf-scoring-card.png", ready: false },
  record: { key: "trinket-record", url: "/assets/trinkets/record.png", ready: false },
  sunglasses: { key: "trinket-sunglasses", url: "/assets/trinkets/sunglasses.png", ready: false },
  "trading-card": { key: "trinket-trading-card", url: "/assets/trinkets/trading-card.png", ready: false },
  "rubber-chicken": { key: "trinket-rubber-chicken", url: "/assets/trinkets/rubber-chicken.png", ready: false },
  "lucky-keychain": { key: "trinket-lucky-keychain", url: "/assets/trinkets/lucky-keychain.png", ready: false },
  gameshark: { key: "trinket-gameshark", url: "/assets/trinkets/gameshark.png", ready: false },
  "piggy-bank": { key: "trinket-piggy-bank", url: "/assets/trinkets/piggy-bank.png", ready: false },
  "band-aid": { key: "trinket-band-aid", url: "/assets/trinkets/band-aid.png", ready: false },
  "time-capsule": { key: "trinket-time-capsule", url: "/assets/trinkets/time-capsule.png", ready: false },
  "rubber-band": { key: "trinket-rubber-band", url: "/assets/trinkets/rubber-band.png", ready: false },
  dice: { key: "trinket-dice", url: "/assets/trinkets/dice.png", ready: false },
  "punch-card": { key: "trinket-punch-card", url: "/assets/trinkets/punch-card.png", ready: false },
  "magic-8-ball": { key: "trinket-magic-8-ball", url: "/assets/trinkets/magic-8-ball.png", ready: false },
  "issue-17": { key: "trinket-issue-17", url: "/assets/trinkets/issue-17.png", ready: false },
  "hall-pass": { key: "trinket-hall-pass", url: "/assets/trinkets/hall-pass.png", ready: false },
  "booster-pack": { key: "trinket-booster-pack", url: "/assets/trinkets/booster-pack.png", ready: false },
  "broken-calculator": { key: "trinket-broken-calculator", url: "/assets/trinkets/broken-calculator.png", ready: false }
});

export const TRINKET_ASSETS = Object.freeze({
  conveyor: {
    key: "trinket-conveyor",
    url: "/assets/ui/trinket-conveyor.png",
    width: 160,
    height: 300,
    ready: false
  },
  placeholder: {
    key: "trinket-placeholder",
    url: "/assets/trinkets/trinket-placeholder.png",
    sourceSize: 160,
    displaySize: 48
  },
  slot: {
    size: 72,
    centers: Object.freeze([
      Object.freeze({ x: 80, y: 70 }),
      Object.freeze({ x: 80, y: 150 }),
      Object.freeze({ x: 80, y: 230 })
    ])
  },
  trinket: {
    displaySize: 48
  }
});

export function trinketTextureKey(id: TrinketId): string {
  const art = TRINKET_ART[id];
  return art.ready ? art.key : TRINKET_ASSETS.placeholder.key;
}
