import Phaser from "phaser";
import type {
  PublicUser,
  ShopItemSummary
} from "@fox-blackjack/shared-types";
import { GAME_MUSIC, GAME_SFX } from "../assets";
import { ApiError } from "../api/authApi";
import { getShopCatalog, purchaseShopItem } from "../api/shopApi";
import { AudioManager } from "../audio/AudioManager";
import { GAME_FONT_FAMILY } from "../config/typography";

export class ShopScene extends Phaser.Scene {
  private audio!: AudioManager;
  private balancesText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;

  constructor() {
    super("ShopScene");
  }

  create(): void {
    this.audio = new AudioManager(this);
    this.audio.stopLoop(GAME_MUSIC.breakbeatChips.key);
    this.audio.playLoop(GAME_MUSIC.switchWithMe.key);
    this.audio.playLoop(GAME_MUSIC.rain.key, 0.2);

    this.drawShopFrame();
    this.drawHeader();
    this.createBackButton();
    void this.loadCatalog();
  }

  private drawShopFrame(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x241b14);
    graphics.fillRect(0, 0, 960, 540);
    graphics.fillStyle(0xe5c99b);
    graphics.fillRoundedRect(90, 45, 780, 450, 18);
    graphics.lineStyle(10, 0x5b3b28);
    graphics.strokeRoundedRect(90, 45, 780, 450, 18);
    graphics.lineStyle(3, 0xb88d59);
    graphics.strokeRoundedRect(106, 61, 748, 418, 12);
  }

  private drawHeader(): void {
    this.add
      .text(130, 88, "DUNC'S BACK-ROOM SHOP", {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: "31px",
        fontStyle: "bold",
        color: "#2a1b13"
      })
      .setOrigin(0, 0.5);

    this.balancesText = this.add
      .text(830, 75, "", {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: "17px",
        color: "#5b3b28",
        align: "right",
        lineSpacing: 5
      })
      .setOrigin(1, 0);
    this.refreshBalances();

    this.statusText = this.add
      .text(480, 430, "LOADING INVENTORY...", {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: "16px",
        color: "#62452e",
        align: "center"
      })
      .setOrigin(0.5);
  }

  private async loadCatalog(): Promise<void> {
    try {
      const { items } = await getShopCatalog();
      if (!this.scene.isActive()) return;

      if (items.length === 0) {
        this.statusText.setText("DUNC'S OUT OF STOCK.");
        return;
      }

      items.slice(0, 3).forEach((item, index) => {
        this.createItemRow(item, 155 + index * 90);
      });
      this.statusText.setText("MORE STUFF COMING LATER.");
    } catch {
      if (this.scene.isActive()) {
        this.statusText.setText("COULDN'T LOAD THE SHOP. TRY AGAIN LATER.");
      }
    }
  }

  private createItemRow(item: ShopItemSummary, y: number): void {
    const card = this.add.graphics();
    card.fillStyle(0xfff3d5);
    card.fillRoundedRect(130, y, 700, 72, 8);
    card.lineStyle(3, 0x8d6840);
    card.strokeRoundedRect(130, y, 700, 72, 8);

    this.add.text(154, y + 12, item.name, {
      fontFamily: GAME_FONT_FAMILY,
      fontSize: "22px",
      fontStyle: "bold",
      color: "#2a1b13"
    });
    this.add.text(154, y + 42, item.description, {
      fontFamily: GAME_FONT_FAMILY,
      fontSize: "15px",
      color: "#62452e"
    });

    const buyButton = this.add
      .text(750, y + 36, `${item.priceDunkaroos} DUNKAROOS`, {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: "15px",
        fontStyle: "bold",
        color: "#f6e8c8",
        backgroundColor: "#345b42",
        padding: { x: 14, y: 9 }
      })
      .setOrigin(0.5);

    const refreshButton = (): void => {
      const user = this.currentUser();
      const affordable = user.dunkaroos >= item.priceDunkaroos;
      buyButton
        .setText(
          affordable
            ? `${item.priceDunkaroos} DUNKAROOS`
            : `NEED ${item.priceDunkaroos}`
        )
        .setAlpha(affordable ? 1 : 0.45);
      if (affordable) {
        buyButton.setInteractive({ useHandCursor: true });
      } else {
        buyButton.disableInteractive();
      }
    };

    buyButton.on("pointerdown", () => {
      void this.buyItem(item, buyButton, refreshButton);
    });
    refreshButton();
  }

  private async buyItem(
    item: ShopItemSummary,
    button: Phaser.GameObjects.Text,
    refreshButton: () => void
  ): Promise<void> {
    this.audio.playEffect(GAME_SFX.menuClick.key);
    button.disableInteractive().setAlpha(0.45).setText("BUYING...");
    this.statusText.setText("COUNTING DUNKAROOS...");

    try {
      const { balances } = await purchaseShopItem(item.key);
      if (!this.scene.isActive()) return;

      this.registry.set("currentUser", {
        ...this.currentUser(),
        ...balances
      });
      this.refreshBalances();
      this.audio.playEffect(GAME_SFX.coin.key);
      this.statusText.setText(`BOUGHT ${item.name}!`);
    } catch (error) {
      if (!this.scene.isActive()) return;
      this.statusText.setText(
        error instanceof ApiError
          ? error.message.toUpperCase()
          : "PURCHASE FAILED. TRY AGAIN."
      );
    }

    refreshButton();
  }

  private createBackButton(): void {
    const back = this.add
      .text(480, 465, "BACK TO LOBBY", {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: "18px",
        fontStyle: "bold",
        color: "#f4e3bf",
        backgroundColor: "#5b3b28",
        padding: { x: 20, y: 9 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    back.on("pointerdown", () => {
      this.audio.playEffect(GAME_SFX.menuClick.key);
      this.scene.start("LobbyScene");
    });
  }

  private currentUser(): PublicUser {
    return this.registry.get("currentUser") as PublicUser;
  }

  private refreshBalances(): void {
    const user = this.currentUser();
    this.balancesText.setText(
      `${user.chips} CHIPS\n${user.dunkaroos} DUNKAROOS`
    );
  }
}
