import type { ResultSetHeader, RowDataPacket } from "mysql2";
import {
  DEALER_CODES,
  normalizeDealerAnswer,
  type WeekdayName
} from "../config/dealerCodes.js";
import { GAME_RULES } from "../config/gameRules.js";
import { pool } from "../database/pool.js";
import { getZonedDay } from "../utils/easternDate.js";
import type { DealerAttemptOutcome } from "@fox-blackjack/shared-types";

interface BalanceRow extends RowDataPacket {
  chips: number;
}

export interface DealerPrompt {
  date: string;
  weekday: WeekdayName;
  hint: string;
}

export interface DealerAttemptResult extends DealerPrompt {
  outcome: DealerAttemptOutcome;
  chipsAwarded: number;
  chipBalance: number;
  dialogue: string;
}

export function getDealerPrompt(now: Date = new Date()): DealerPrompt {
  const day = getZonedDay(now, GAME_RULES.timeZone);
  return {
    ...day,
    hint: DEALER_CODES[day.weekday].hint
  };
}

export async function attemptDealerCode(
  userId: number,
  rawAnswer: string,
  now: Date = new Date()
): Promise<DealerAttemptResult> {
  const day = getZonedDay(now, GAME_RULES.timeZone);
  const definition = DEALER_CODES[day.weekday];
  const answer = normalizeDealerAnswer(rawAnswer);

  let outcome: DealerAttemptOutcome = "incorrect";
  let dialogue = definition.incorrectDialogue;
  let chipsAwarded = 0;

  if (definition.acceptedAnswers.map(normalizeDealerAnswer).includes(answer)) {
    outcome = "rewarded";
    dialogue = definition.correctDialogue;
    chipsAwarded = definition.rewardChips;
  } else if (definition.alternateAnswers) {
    const alternateDialogue = Object.entries(definition.alternateAnswers).find(
      ([candidate]) => normalizeDealerAnswer(candidate) === answer
    )?.[1];

    if (alternateDialogue) {
      outcome = "alternate_dialogue";
      dialogue = alternateDialogue;
    }
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute<BalanceRow[]>(
      `SELECT chips FROM users WHERE id = ? FOR UPDATE`,
      [userId]
    );
    const user = rows[0];
    if (!user) throw new Error("User not found");

    await connection.execute<ResultSetHeader>(
      `INSERT INTO daily_dealer_attempts
       (user_id, attempt_date, weekday_name, outcome, chips_awarded)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, day.date, day.weekday, outcome, chipsAwarded]
    );

    let nextBalance = user.chips;

    if (chipsAwarded > 0) {
      nextBalance += chipsAwarded;
      await connection.execute(
        `UPDATE users SET chips = ? WHERE id = ?`,
        [nextBalance, userId]
      );

      await connection.execute(
        `INSERT INTO currency_transactions
         (user_id, currency, amount, reason, balance_after, reference_type, reference_key)
         VALUES (?, 'chips', ?, 'dealer_passcode', ?, 'dealer_passcode', ?)`,
        [userId, chipsAwarded, nextBalance, day.date]
      );
    }

    await connection.commit();

    return {
      ...day,
      hint: definition.hint,
      outcome,
      chipsAwarded,
      chipBalance: nextBalance,
      dialogue
    };
  } catch (error) {
    await connection.rollback();
    if (isDuplicateKey(error)) {
      throw new Error("Dealer code attempt already used for this Eastern date");
    }
    throw error;
  } finally {
    connection.release();
  }
}

function isDuplicateKey(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ER_DUP_ENTRY"
  );
}
