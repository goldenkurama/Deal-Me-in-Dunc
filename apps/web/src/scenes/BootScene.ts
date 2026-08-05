import Phaser from "phaser";
import {
  CARD_ASSETS,
  DEALER_ASSETS,
  SCENE_ASSETS,
  TRINKET_ASSETS,
  UI_ASSETS
} from "../assets";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload(): void {
    this.load.spritesheet(
      DEALER_ASSETS.idle.key,
      DEALER_ASSETS.idle.url,
      {
        frameWidth: DEALER_ASSETS.idle.frameWidth,
        frameHeight: DEALER_ASSETS.idle.frameHeight
      }
    );

    this.load.image(CARD_ASSETS.back.key, CARD_ASSETS.back.url);
    this.load.image(UI_ASSETS.chip.key, UI_ASSETS.chip.url);
    this.load.image(UI_ASSETS.dunkaroo.key, UI_ASSETS.dunkaroo.url);

    if (SCENE_ASSETS.room.ready) {
      this.load.image(SCENE_ASSETS.room.key, SCENE_ASSETS.room.url);
    }
    if (SCENE_ASSETS.table.ready) {
      this.load.image(SCENE_ASSETS.table.key, SCENE_ASSETS.table.url);
    }
    if (TRINKET_ASSETS.conveyor.ready) {
      this.load.image(
        TRINKET_ASSETS.conveyor.key,
        TRINKET_ASSETS.conveyor.url
      );
    }

    // Add music later, after exporting an OGG or MP3 file:
    // this.load.audio("table-theme", "/assets/audio/music/table-theme.ogg");
  }

  create(): void {
    this.anims.create({
      key: "dealer-idle",
      frames: this.anims.generateFrameNumbers("dealer-idle-sheet", {
        start: DEALER_ASSETS.idle.firstFrame,
        end: DEALER_ASSETS.idle.lastFrame
      }),
      frameRate: 4,
      repeat: -1
    });

    this.scene.start("LobbyScene");
  }
}
