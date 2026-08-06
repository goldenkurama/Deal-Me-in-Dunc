import type { RowDataPacket } from "mysql2";
import { settleHandOutcome } from "@fox-blackjack/game-core";
import type {
  HandSettlementRequest,
  HandSettlementResponse
} from "@fox-blackjack/shared-types";
import { GAME_RULES } from "../config/gameRules.js";
import { pool } from "../database/pool.js";
import { GameError, type GameService } from "./gameService.js";

interface BalanceRow extends RowDataPacket {
  chips: number;
  dunkaroos: number;
}

interface ExistingSettlementRow extends RowDataPacket {
  id: number;
}

async function settleHand(
  userId: string,
  settlement: HandSettlementRequest
): Promise<HandSettlementResponse> {
  if (settlement.wager < GAME_RULES.minimumBet) {
    throw new GameError(
      400,
      "invalid_wager",
      `The minimum wager is ${GAME_RULES.minimumBet} chips`
    );
  }

  const resolution = settleHandOutcome(settlement.outcome, settlement.wager);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute<BalanceRow[]>(
      "SELECT chips, dunkaroos FROM users WHERE id = ? FOR UPDATE",
      [userId]
    );
    const user = rows[0];
    if (!user) throw new GameError(404, "user_not_found", "User not found");

    const [existingRows] = await connection.execute<ExistingSettlementRow[]>(
      `SELECT id FROM currency_transactions
       WHERE user_id = ? AND transaction_group_key = ?
       LIMIT 1`,
      [userId, settlement.handId]
    );

    if (existingRows.length > 0) {
      await connection.commit();
      return { balances: { chips: user.chips, dunkaroos: user.dunkaroos } };
    }

    if (user.chips < settlement.wager) {
      throw new GameError(
        409,
        "insufficient_chips",
        "Your saved balance is too low for that wager"
      );
    }

    const chipsAfterWager = user.chips - settlement.wager;
    const nextChips = chipsAfterWager + resolution.chipsReturned;
    const nextDunkaroos = user.dunkaroos + resolution.dunkaroosAwarded;

    await connection.execute(
      "UPDATE users SET chips = ?, dunkaroos = ? WHERE id = ?",
      [nextChips, nextDunkaroos, userId]
    );

    await connection.execute(
      `INSERT INTO currency_transactions
       (user_id, currency, amount, reason, balance_after,
        transaction_group_key, reference_type, reference_key)
       VALUES (?, 'chips', ?, 'blackjack_wager', ?, ?, 'blackjack_hand', ?)`,
      [
        userId,
        -settlement.wager,
        chipsAfterWager,
        settlement.handId,
        settlement.outcome
      ]
    );

    if (resolution.chipsReturned > 0) {
      await connection.execute(
        `INSERT INTO currency_transactions
         (user_id, currency, amount, reason, balance_after,
          transaction_group_key, reference_type, reference_key)
         VALUES (?, 'chips', ?, 'blackjack_payout', ?, ?, 'blackjack_hand', ?)`,
        [
          userId,
          resolution.chipsReturned,
          nextChips,
          settlement.handId,
          settlement.outcome
        ]
      );
    }

    if (resolution.dunkaroosAwarded > 0) {
      await connection.execute(
        `INSERT INTO currency_transactions
         (user_id, currency, amount, reason, balance_after,
          transaction_group_key, reference_type, reference_key)
         VALUES (?, 'dunkaroos', ?, 'blackjack_dunkaroos', ?, ?, 'blackjack_hand', ?)`,
        [
          userId,
          resolution.dunkaroosAwarded,
          nextDunkaroos,
          settlement.handId,
          settlement.outcome
        ]
      );
    }

    await connection.commit();
    return { balances: { chips: nextChips, dunkaroos: nextDunkaroos } };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export const databaseGameService: GameService = { settleHand };
