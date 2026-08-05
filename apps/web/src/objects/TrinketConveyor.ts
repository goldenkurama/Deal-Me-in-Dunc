import Phaser from "phaser";
import { TRINKET_ASSETS } from "../assets";
import { GAME_FONT_FAMILY } from "../config/typography";

export class TrinketConveyor extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    scene.add.existing(this);

    if (scene.textures.exists(TRINKET_ASSETS.conveyor.key)) {
      this.add(
        scene.add
          .image(0, 0, TRINKET_ASSETS.conveyor.key)
          .setOrigin(0)
          .setDisplaySize(
            TRINKET_ASSETS.conveyor.width,
            TRINKET_ASSETS.conveyor.height
          )
      );
    } else {
      this.drawPlaceholder(scene);
    }

    this.addSlotLabels(scene);
  }

  private drawPlaceholder(scene: Phaser.Scene): void {
    const graphics = scene.add.graphics();
    graphics.fillStyle(0x2a1b13, 0.96);
    graphics.fillRoundedRect(0, 0, 160, 300, 24);
    graphics.lineStyle(6, 0x5b3b28);
    graphics.strokeRoundedRect(3, 3, 154, 294, 21);

    graphics.fillStyle(0x765033);
    graphics.fillRoundedRect(31, 16, 98, 268, 34);
    graphics.fillStyle(0x332217);
    graphics.fillCircle(80, 20, 13);
    graphics.fillCircle(80, 280, 13);

    for (const center of TRINKET_ASSETS.slot.centers) {
      const halfSlot = TRINKET_ASSETS.slot.size / 2;
      const halfTrinket = TRINKET_ASSETS.trinket.displaySize / 2;

      graphics.fillStyle(0xe5c99b);
      graphics.fillRoundedRect(
        center.x - halfSlot,
        center.y - halfSlot,
        TRINKET_ASSETS.slot.size,
        TRINKET_ASSETS.slot.size,
        8
      );
      graphics.lineStyle(4, 0x3b281d);
      graphics.strokeRoundedRect(
        center.x - halfSlot,
        center.y - halfSlot,
        TRINKET_ASSETS.slot.size,
        TRINKET_ASSETS.slot.size,
        8
      );
      graphics.lineStyle(2, 0xb88d59, 0.8);
      graphics.strokeRect(
        center.x - halfTrinket,
        center.y - halfTrinket,
        TRINKET_ASSETS.trinket.displaySize,
        TRINKET_ASSETS.trinket.displaySize
      );
    }

    this.add(graphics);
  }

  private addSlotLabels(scene: Phaser.Scene): void {
    const labels = ["1 NEW", "2", "3 OLD"];
    TRINKET_ASSETS.slot.centers.forEach((center, index) => {
      this.add(
        scene.add
          .text(151, center.y, labels[index], {
            fontFamily: GAME_FONT_FAMILY,
            fontSize: "10px",
            fontStyle: "bold",
            color: "#ead6ae",
            backgroundColor: "#5b3b28",
            padding: { x: 4, y: 3 }
          })
          .setOrigin(1, 0.5)
      );
    });
  }
}
