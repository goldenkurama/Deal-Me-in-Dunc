import Phaser from "phaser";
import {
  CARD_ASSETS,
  DEALER_ASSETS,
  DUNCAN_VOICE_ASSETS,
  SCENE_ASSETS,
  TRINKET_ASSETS,
  UI_ASSETS
} from "../assets";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload(): void {
    for (const animation of Object.values(DEALER_ASSETS.animations)) {
      this.load.spritesheet(animation.key, animation.url, {
        frameWidth: animation.frameWidth,
        frameHeight: animation.frameHeight
      });
    }

    this.load.image(CARD_ASSETS.back.key, CARD_ASSETS.back.url);
    this.load.image(UI_ASSETS.chip.key, UI_ASSETS.chip.url);
    this.load.image(UI_ASSETS.dunkaroo.key, UI_ASSETS.dunkaroo.url);

    for (const voice of DUNCAN_VOICE_ASSETS) {
      this.load.audio(voice.key, voice.url);
    }

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
    for (const animation of Object.values(DEALER_ASSETS.animations)) {
      const baseFrameDuration = Math.min(...animation.frameDurationsMs);
      this.anims.create({
        key: animation.animationKey,
        frames: animation.frameDurationsMs.map((duration, frame) => ({
          key: animation.key,
          frame,
          duration: duration - baseFrameDuration
        })),
        frameRate: 1000 / baseFrameDuration,
        repeat: animation.repeat
      });
    }

    this.scene.start("LobbyScene");
  }
}
