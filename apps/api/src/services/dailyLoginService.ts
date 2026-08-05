import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { GAME_RULES } from "../config/gameRules.js";
import { pool } from "../database/pool.js";
import { getZonedDay } from "../utils/easternDate.js";

interface BalanceRow extends RowDataPacket {
  chips: number;
}

export interface DailyLoginResult {
  granted: boolean;
  chipsAwarded: number;
  chipBalance: number;
  grantDate: string;
}

export async function applyDailyLoginGrant(
  userId: number,
  now: Date = new Date()
): Promise<DailyLoginResult> {
  const { date: grantDate } = getZonedDay(now, GAME_RULES.timeZone);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [insert] = await connection.execute<ResultSetHeader>(
      `INSERT IGNORE INTO daily_login_grants
       (user_id, grant_date, chips_awarded)
       VALUES (?, ?, ?)`,
      [userId, grantDate, GAME_RULES.dailyLoginChips]
    );

    const [rows] = await connection.execute<BalanceRow[]>(
      `SELECT chips FROM users WHERE id = ? FOR UPDATE`,
      [userId]
    );

    const user = rows[0];
    if (!user) throw new Error("User not found");

    if (insert.affectedRows === 0) {
      await connection.execute(
        `UPDATE users SET last_login_at = UTC_TIMESTAMP(6) WHERE id = ?`,
        [userId]
      );
      await connection.commit();
      return {
        granted: false,
        chipsAwarded: 0,
        chipBalance: user.chips,
        grantDate
      };
    }

    const nextBalance = user.chips + GAME_RULES.dailyLoginChips;

    await connection.execute(
      `UPDATE users
       SET chips = ?, last_login_at = UTC_TIMESTAMP(6)
       WHERE id = ?`,
      [nextBalance, userId]
    );

    await connection.execute(
      `INSERT INTO currency_transactions
       (user_id, currency, amount, reason, balance_after, reference_type, reference_key)
       VALUES (?, 'chips', ?, 'daily_login', ?, 'daily_login', ?)`,
      [
        userId,
        GAME_RULES.dailyLoginChips,
        nextBalance,
        grantDate
      ]
    );

    await connection.commit();
    return {
      granted: true,
      chipsAwarded: GAME_RULES.dailyLoginChips,
      chipBalance: nextBalance,
      grantDate
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
