import type { TrinketId } from "@fox-blackjack/game-core";

interface TrinketArtAsset {
  readonly key: string;
  readonly url: string;
  readonly ready: boolean;
}

export const TRINKET_ART: Readonly<Record<TrinketId, TrinketArtAsset>> = Object.freeze({
  "golf-scoring-card": { key: "trinket-golf-scoring-card", url: "/assets/trinkets/golf-scoring-card.png", ready: true },
  record: { key: "trinket-record", url: "/assets/trinkets/record.png", ready: true },
  sunglasses: { key: "trinket-sunglasses", url: "/assets/trinkets/sunglasses.png", ready: true },
  "trading-card": { key: "trinket-trading-card", url: "/assets/trinkets/trading-card.png", ready: true },
  "rubber-chicken": { key: "trinket-rubber-chicken", url: "/assets/trinkets/rubber-chicken.png", ready: true },
  "lucky-keychain": { key: "trinket-lucky-keychain", url: "/assets/trinkets/lucky-keychain.png", ready: true },
  gameshark: { key: "trinket-gameshark", url: "/assets/trinkets/gameshark.png", ready: true },
  "piggy-bank": { key: "trinket-piggy-bank", url: "/assets/trinkets/piggy-bank.png", ready: true },
  "band-aid": { key: "trinket-band-aid", url: "/assets/trinkets/band-aid.png", ready: true },
  "time-capsule": { key: "trinket-time-capsule", url: "/assets/trinkets/time-capsule.png", ready: true },
  "rubber-band": { key: "trinket-rubber-band", url: "/assets/trinkets/rubber-band.png", ready: true },
  dice: { key: "trinket-dice", url: "/assets/trinkets/dice.png", ready: true },
  "punch-card": { key: "trinket-punch-card", url: "/assets/trinkets/punch-card.png", ready: true },
  "magic-8-ball": { key: "trinket-magic-8-ball", url: "/assets/trinkets/magic-8-ball.png", ready: true },
  "issue-17": { key: "trinket-issue-17", url: "/assets/trinkets/issue-17.png", ready: true },
  "hall-pass": { key: "trinket-hall-pass", url: "/assets/trinkets/hall-pass.png", ready: true },
  "booster-pack": { key: "trinket-booster-pack", url: "/assets/trinkets/booster-pack.png", ready: true },
  "broken-calculator": { key: "trinket-broken-calculator", url: "/assets/trinkets/broken-calculator.png", ready: true },
  "safety-scissors": { key: "trinket-safety-scissors", url: "/assets/trinkets/trinket-placeholder.png", ready: false },
  "three-ring-binder": { key: "trinket-three-ring-binder", url: "/assets/trinkets/trinket-placeholder.png", ready: false },
  "participation-trophy": { key: "trinket-participation-trophy", url: "/assets/trinkets/trinket-placeholder.png", ready: false },
  "deck-of-many-bs-things": { key: "trinket-deck-of-many-bs-things", url: "/assets/trinkets/trinket-placeholder.png", ready: false },
  "junk-drawer": { key: "trinket-junk-drawer", url: "/assets/trinkets/trinket-placeholder.png", ready: false },
  "universal-remote": { key: "trinket-universal-remote", url: "/assets/trinkets/trinket-placeholder.png", ready: false },
  "swap-meet-ticket": { key: "trinket-swap-meet-ticket", url: "/assets/trinkets/trinket-placeholder.png", ready: false },
  "loaded-shoe": { key: "trinket-loaded-shoe", url: "/assets/trinkets/trinket-placeholder.png", ready: false },
  "dry-cleaning-ticket": { key: "trinket-dry-cleaning-ticket", url: "/assets/trinkets/trinket-placeholder.png", ready: false },
  "maxxed-out-credit-card": { key: "trinket-maxxed-out-credit-card", url: "/assets/trinkets/trinket-placeholder.png", ready: false },
  "cash-only-coupon": { key: "trinket-cash-only-coupon", url: "/assets/trinkets/trinket-placeholder.png", ready: false },
  "return-receipt": { key: "trinket-return-receipt", url: "/assets/trinkets/trinket-placeholder.png", ready: false },
  "half-off-coupon": { key: "trinket-half-off-coupon", url: "/assets/trinkets/trinket-placeholder.png", ready: false },
  "dry-cleaning-tag": { key: "trinket-dry-cleaning-tag", url: "/assets/trinkets/trinket-placeholder.png", ready: false },
  bookmark: { key: "trinket-bookmark", url: "/assets/trinkets/trinket-placeholder.png", ready: false },
  "express-lane-sign": { key: "trinket-express-lane-sign", url: "/assets/trinkets/trinket-placeholder.png", ready: false },
  "two-for-one-coupon": { key: "trinket-two-for-one-coupon", url: "/assets/trinkets/trinket-placeholder.png", ready: false },
  "do-over-token": { key: "trinket-do-over-token", url: "/assets/trinkets/trinket-placeholder.png", ready: false }
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
  },
  transitionDurationMs: 420
});

export function trinketTextureKey(id: TrinketId): string {
  const art = TRINKET_ART[id];
  return art.ready ? art.key : TRINKET_ASSETS.placeholder.key;
}
