import Phaser from "phaser";
import {
  getTrinket,
  isTrinketId,
  type TrinketId,
  type TrinketSlots
} from "@fox-blackjack/game-core";
import { TRINKET_ASSETS, trinketTextureKey } from "../assets";
import { GAME_FONT_FAMILY } from "../config/typography";

export class TrinketConveyor extends Phaser.GameObjects.Container {
  private readonly slotContents: Phaser.GameObjects.Image[] = [];
  private readonly slotIconLayer: Phaser.GameObjects.Container;
  private readonly slotMaskShape: Phaser.GameObjects.Graphics;
  private readonly slotMask: Phaser.Display.Masks.GeometryMask;
  private readonly tooltip: Phaser.GameObjects.Text;
  private onActivate: (id: TrinketId) => void = () => undefined;

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

    this.slotIconLayer = scene.add.container(0, 0);
    this.add(this.slotIconLayer);
    this.slotMaskShape = scene.make.graphics({ x, y });
    this.slotMaskShape.fillStyle(0xffffff);
    for (const center of TRINKET_ASSETS.slot.centers) {
      const halfSlot = TRINKET_ASSETS.slot.size / 2;
      this.slotMaskShape.fillRoundedRect(
        center.x - halfSlot,
        center.y - halfSlot,
        TRINKET_ASSETS.slot.size,
        TRINKET_ASSETS.slot.size,
        8
      );
    }
    this.slotMask = this.slotMaskShape.createGeometryMask();
    this.slotIconLayer.setMask(this.slotMask);

    this.addSlotLabels(scene);
    this.tooltip = scene.add
      .text(172, 8, "", {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: "12px",
        color: "#2a1b13",
        backgroundColor: "#f6e8c8",
        padding: { x: 9, y: 7 },
        wordWrap: { width: 235 }
      })
      .setVisible(false)
      .setDepth(100);
    this.add(this.tooltip);

    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.slotMask.destroy();
      this.slotMaskShape.destroy();
    });
  }

  setSlots(slots: TrinketSlots, onActivate: (id: TrinketId) => void): void {
    this.onActivate = onActivate;
    for (const content of this.slotContents.splice(0)) content.destroy();

    slots.forEach((slot, index) => {
      if (!slot || !isTrinketId(slot.id)) return;
      const trinketId = slot.id;
      const center = TRINKET_ASSETS.slot.centers[index];
      const definition = getTrinket(trinketId);
      const icon = this.scene.add
        .image(center.x, center.y, trinketTextureKey(trinketId))
        .setDisplaySize(
          TRINKET_ASSETS.trinket.displaySize,
          TRINKET_ASSETS.trinket.displaySize
        )
        .setInteractive({ useHandCursor: definition.interaction !== "passive" });
      icon.on("pointerover", () => {
        this.tooltip
          .setText(`${definition.name.toUpperCase()}\n${definition.description}`)
          .setVisible(true);
      });
      icon.on("pointerout", () => this.tooltip.setVisible(false));
      icon.on("pointerdown", () => this.onActivate(trinketId));
      this.slotContents.push(icon);
      this.slotIconLayer.add(icon);
    });
  }

  animateAging(slots: TrinketSlots, onActivate: (id: TrinketId) => void): Promise<void> {
    this.onActivate = onActivate;
    this.tooltip.setVisible(false);
    for (const icon of this.slotContents) icon.disableInteractive();

    if (this.slotContents.length === 0) {
      this.setSlots(slots, onActivate);
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      let finished = false;
      const finish = (renderFinalSlots: boolean): void => {
        if (finished) return;
        finished = true;
        this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, abort);
        if (renderFinalSlots && this.active && this.scene.sys.isActive()) {
          this.setSlots(slots, onActivate);
        }
        resolve();
      };
      const abort = (): void => finish(false);
      this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, abort);
      this.scene.tweens.add({
        targets: this.slotContents,
        y: `+=${TRINKET_ASSETS.slot.centers[1].y - TRINKET_ASSETS.slot.centers[0].y}`,
        duration: TRINKET_ASSETS.transitionDurationMs,
        ease: "Sine.easeInOut",
        onComplete: () => finish(true)
      });
    });
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
