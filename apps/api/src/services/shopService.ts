import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { ShopCategory } from "@fox-blackjack/shared-types";
import { getShopItem } from "../config/shopCatalog.js";
import { pool } from "../database/pool.js";

interface DunkarooRow extends RowDataPacket {
  dunkaroos: number;
}

interface CountRow extends RowDataPacket {
  count: number;
}

export async function purchaseShopItem(
  userId: number,
  itemKey: string
): Promise<{ dunkaroos: number; itemKey: string }> {
  const item = getShopItem(itemKey);
  if (!item) throw new Error("Unknown shop item");

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await assertNoActiveGame(connection, userId);

    const [users] = await connection.execute<DunkarooRow[]>(
      `SELECT dunkaroos FROM users WHERE id = ? FOR UPDATE`,
      [userId]
    );
    const user = users[0];
    if (!user) throw new Error("User not found");

    const [ownedRows] = await connection.execute<CountRow[]>(
      `SELECT COUNT(*) AS count
       FROM user_items
       WHERE user_id = ? AND item_key = ?`,
      [userId, item.key]
    );
    if ((ownedRows[0]?.count ?? 0) > 0) throw new Error("Item already owned");
    if (user.dunkaroos < item.priceDunkaroos) throw new Error("Not enough dunkaroos");

    const nextBalance = user.dunkaroos - item.priceDunkaroos;

    await connection.execute(
      `UPDATE users SET dunkaroos = ? WHERE id = ?`,
      [nextBalance, userId]
    );

    await connection.execute<ResultSetHeader>(
      `INSERT INTO user_items (user_id, item_key) VALUES (?, ?)`,
      [userId, item.key]
    );

    await connection.execute(
      `INSERT INTO currency_transactions
       (user_id, currency, amount, reason, balance_after, reference_type, reference_key)
       VALUES (?, 'dunkaroos', ?, 'shop_purchase', ?, 'shop_item', ?)`,
      [userId, -item.priceDunkaroos, nextBalance, item.key]
    );

    await connection.commit();
    return { dunkaroos: nextBalance, itemKey: item.key };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function equipShopItem(
  userId: number,
  category: ShopCategory,
  itemKey: string | null
): Promise<void> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await assertNoActiveGame(connection, userId);

    if (itemKey !== null) {
      const item = getShopItem(itemKey);
      if (!item) throw new Error("Unknown shop item");
      if (item.category !== category) throw new Error("Item belongs to another category");

      const [ownedRows] = await connection.execute<CountRow[]>(
        `SELECT COUNT(*) AS count
         FROM user_items
         WHERE user_id = ? AND item_key = ?`,
        [userId, itemKey]
      );
      if ((ownedRows[0]?.count ?? 0) === 0) throw new Error("Item is not owned");
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


async function assertNoActiveGame(
  connection: import("mysql2/promise").PoolConnection,
  userId: number
): Promise<void> {
  const [rows] = await connection.execute<CountRow[]>(
    `SELECT COUNT(*) AS count
     FROM game_sessions
     WHERE user_id = ? AND status = 'in_progress'`,
    [userId]
  );

  if ((rows[0]?.count ?? 0) > 0) {
    throw new Error("Shop and equipment are unavailable during an active hand");
  }
}
