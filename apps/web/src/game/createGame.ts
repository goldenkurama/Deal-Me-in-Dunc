import Phaser from "phaser";
import type { PublicUser } from "@fox-blackjack/shared-types";
import { BootScene } from "../scenes/BootScene";
import { LobbyScene } from "../scenes/LobbyScene";
import { ShopScene } from "../scenes/ShopScene";
import { TableScene } from "../scenes/TableScene";

export function createGame(
  parent: HTMLElement,
  user: PublicUser,
  onLogout: () => void
): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 960,
    height: 540,
    backgroundColor: "#21170f",
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    callbacks: {
      preBoot(game) {
        game.registry.set("currentUser", user);
        game.events.on("auth:logout", onLogout);
      }
    },
    scene: [BootScene, LobbyScene, TableScene, ShopScene]
  });
}
