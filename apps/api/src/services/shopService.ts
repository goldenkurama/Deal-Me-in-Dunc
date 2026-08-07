import { randomUUID } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type {
  ShopCatalogResponse,
  ShopCategory,
  ShopPurchaseResponse
} from "@fox-blackjack/shared-types";
import { getShopItem, SHOP_ITEMS } from "../config/shopCatalog.js";
import { pool } from "../database/pool.js";
import {
  ShopError,
  type ShopService
} from "./shopServiceContract.js";

interface CurrencyRow extends RowDataPacket {
  chips: number;
  dunkaroos: number;
}

interface CountRow extends RowDataPacket {
  count: number;
}

function listItems(): ShopCatalogResponse {
  return {
    items: SHOP_ITEMS.map(({ key, name, description, priceDunkaroos }) => ({
      key,
      name,
      description,
      priceDunkaroos
    }))
  };
}

async function purchaseItem(
  userId: string,
  itemKey: string
): Promise<ShopPurchaseResponse> {
  const item = getShopItem(itemKey);
  if (!item) throw new ShopError(404, "unknown_shop_item", "Unknown shop item");

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [users] = await connection.execute<CurrencyRow[]>(
      "SELECT chips, dunkaroos FROM users WHERE id = ? FOR UPDATE",
      [userId]
    );
    const user = users[0];
    if (!user) throw new ShopError(404, "user_not_found", "User not found");

    if (user.dunkaroos < item.priceDunkaroos) {
      throw new ShopError(
        409,
        "insufficient_dunkaroos",
        "Not enough dunkaroos"
      );
    }

    if (item.kind === "cosmetic") {
      const [ownedRows] = await connection.execute<CountRow[]>(
        `SELECT COUNT(*) AS count
         FROM user_items
         WHERE user_id = ? AND item_key = ?`,
        [userId, item.key]
      );
      if ((ownedRows[0]?.count ?? 0) > 0) {
        throw new ShopError(409, "item_already_owned", "Item already owned");
      }
    }

    const nextChips =
      user.chips + (item.kind === "chip_bundle" ? item.chipsAwarded : 0);
    const nextDunkaroos = user.dunkaroos - item.priceDunkaroos;
    const transactionGroup = randomUUID();

    await connection.execute(
      "UPDATE users SET chips = ?, dunkaroos = ? WHERE id = ?",
      [nextChips, nextDunkaroos, userId]
    );

    if (item.kind === "cosmetic") {
      await connection.execute<ResultSetHeader>(
        "INSERT INTO user_items (user_id, item_key) VALUES (?, ?)",
        [userId, item.key]
      );
    }

    await connection.execute(
      `INSERT INTO currency_transactions
       (user_id, currency, amount, reason, balance_after,
        transaction_group_key, reference_type, reference_key)
       VALUES (?, 'dunkaroos', ?, ?, ?, ?, 'shop_item', ?)`,
      [
        userId,
        -item.priceDunkaroos,
        item.kind === "chip_bundle"
          ? "currency_exchange_out"
          : "shop_purchase",
        nextDunkaroos,
        transactionGroup,
        item.key
      ]
    );

    if (item.kind === "chip_bundle") {
      await connection.execute(
        `INSERT INTO currency_transactions
         (user_id, currency, amount, reason, balance_after,
          transaction_group_key, reference_type, reference_key)
         VALUES (?, 'chips', ?, 'currency_exchange_in', ?, ?, 'shop_item', ?)`,
        [
          userId,
          item.chipsAwarded,
          nextChips,
          transactionGroup,
          item.key
        ]
      );
    }

    await connection.commit();
    return {
      itemKey: item.key,
      balances: { chips: nextChips, dunkaroos: nextDunkaroos }
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function equipShopItem(
  userId: string,
  category: ShopCategory,
  itemKey: string | null
): Promise<void> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    if (itemKey !== null) {
      const item = getShopItem(itemKey);
      if (!item) throw new ShopError(404, "unknown_shop_item", "Unknown shop item");
      if (item.kind !== "cosmetic" || item.category !== category) {
        throw new ShopError(
          400,
          "wrong_shop_category",
          "Item belongs to another category"
        );
      }

      const [ownedRows] = await connection.execute<CountRow[]>(
        `SELECT COUNT(*) AS count
         FROM user_items
         WHERE user_id = ? AND item_key = ?`,
        [userId, itemKey]
      );
      if ((ownedRows[0]?.count ?? 0) === 0) {
        throw new ShopError(409, "item_not_owned", "Item is not owned");
      }
    }

    await connection.execute(
      `INSERT INTO user_equipment (user_id, category, item_key)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE item_key = VALUES(item_key)`,
      [userId, category, itemKey]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export const databaseShopService: ShopService = { listItems, purchaseItem };
