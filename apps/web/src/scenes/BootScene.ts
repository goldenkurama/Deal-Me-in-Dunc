import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload(): void {
    this.load.spritesheet(
      "dealer-idle-sheet",
      "/assets/sprites/dealer/dealer-idle.png",
      { frameWidth: 64, frameHeight: 96 }
    );

    this.load.image("card-back", "/assets/cards/card-back.png");
    this.load.image("chip-icon", "/assets/ui/chip.png");
    this.load.image("dunkaroo-icon", "/assets/ui/dunkaroo.png");

    // Add music later, after exporting an OGG or MP3 file:
    // this.load.audio("table-theme", "/assets/audio/music/table-theme.ogg");
  }

  create(): void {
    this.anims.create({
      key: "dealer-idle",
      frames: this.anims.generateFrameNumbers("dealer-idle-sheet", {
        start: 0,
        end: 3
      }),
      frameRate: 4,
      repeat: -1
    });

    this.scene.start("TableScene");
  }
}
