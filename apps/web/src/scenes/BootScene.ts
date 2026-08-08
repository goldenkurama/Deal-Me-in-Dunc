import Phaser from "phaser";
import {
  CARD_ASSETS,
  DEALER_ASSETS,
  DUNCAN_VOICE_ASSETS,
  GAME_MUSIC,
  GAME_SFX,
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

    this.load.spritesheet(CARD_ASSETS.faces.key, CARD_ASSETS.faces.url, {
      frameWidth: CARD_ASSETS.faces.frameWidth,
      frameHeight: CARD_ASSETS.faces.frameHeight
    });
    this.load.spritesheet(CARD_ASSETS.backs.key, CARD_ASSETS.backs.url, {
      frameWidth: CARD_ASSETS.backs.frameWidth,
      frameHeight: CARD_ASSETS.backs.frameHeight
    });
    this.load.image(UI_ASSETS.chip.key, UI_ASSETS.chip.url);
    this.load.image(UI_ASSETS.dunkaroo.key, UI_ASSETS.dunkaroo.url);

    for (const voice of DUNCAN_VOICE_ASSETS) {
      this.load.audio(voice.key, voice.url);
    }

    for (const effect of Object.values(GAME_SFX)) {
      this.load.audio(effect.key, effect.url);
    }

    for (const track of Object.values(GAME_MUSIC)) {
      this.load.audio(track.key, track.url);
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

  }

  create(): void {
    this.textures
      .get(CARD_ASSETS.faces.key)
      .setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures
      .get(CARD_ASSETS.backs.key)
      .setFilter(Phaser.Textures.FilterMode.NEAREST);

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
