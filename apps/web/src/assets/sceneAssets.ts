/** Shared 960 x 540 scene art. The current room already includes its table. */
export const SCENE_ASSETS = Object.freeze({
  room: {
    key: "back-room-background",
    url: "/assets/backgrounds/back-room.png",
    width: 960,
    height: 540,
    ready: true,
    includesTable: true
  },
  table: {
    key: "blackjack-table",
    url: "/assets/tables/blackjack-table.png",
    width: 960,
    height: 540,
    ready: false
  }
});
