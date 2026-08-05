export const TRINKET_ASSETS = Object.freeze({
  conveyor: {
    key: "trinket-conveyor",
    url: "/assets/ui/trinket-conveyor.png",
    width: 160,
    height: 300,
    ready: false
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
