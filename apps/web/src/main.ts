import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { TableScene } from "./scenes/TableScene";
import { ShopScene } from "./scenes/ShopScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  width: 960,
  height: 540,
  backgroundColor: "#16101f",
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, TableScene, ShopScene]
};

new Phaser.Game(config);
