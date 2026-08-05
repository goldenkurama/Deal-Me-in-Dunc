import bcrypt from "bcryptjs";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../database/pool.js";
import { GAME_RULES } from "../config/gameRules.js";

const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;
const PASSWORD_MIN_LENGTH = 8;

interface UserCredentialRow extends RowDataPacket {
  id: number;
  username: string;
  password_hash: string;
  chips: number;
  dunkaroos: number;
}


export interface AuthenticatedUser {
  id: number;
  username: string;
  chips: number;
  dunkaroos: number;
}

export function validateUsername(username: string): string {
  const normalized = username.trim();
  if (!USERNAME_PATTERN.test(normalized)) {
    throw new Error("Username must be 3-20 letters, numbers, or underscores");
  }
  return normalized;
}

export function validatePassword(password: string): void {
  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new Error(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }
}

export async function createUser(username: string, password: string): Promise<number> {
  const cleanUsername = validateUsername(username);
  validatePassword(password);
  const passwordHash = await bcrypt.hash(password, 12);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO users (username, password_hash, chips, dunkaroos)
       VALUES (?, ?, ?, ?)`,
      [
        cleanUsername,
        passwordHash,
        GAME_RULES.startingChips,
        GAME_RULES.startingDunkaroos
      ]
    );

    await connection.execute(
      `INSERT INTO currency_transactions
       (user_id, currency, amount, reason, balance_after, reference_type)
       VALUES (?, 'chips', ?, 'account_start', ?, 'account')`,
      [result.insertId, GAME_RULES.startingChips, GAME_RULES.startingChips]
    );

    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function verifyCredentials(
  username: string,
  password: string
): Promise<AuthenticatedUser | null> {
  const [rows] = await pool.execute<UserCredentialRow[]>(
    `SELECT id, username, password_hash, chips, dunkaroos
     FROM users
     WHERE username = ?
     LIMIT 1`,
    [username.trim()]
  );

  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) return null;

  return {
    id: user.id,
    username: user.username,
    chips: user.chips,
    dunkaroos: user.dunkaroos
  };
}
