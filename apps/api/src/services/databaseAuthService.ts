import { createHash, randomBytes } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import type { PublicUser } from "@fox-blackjack/shared-types";
import { pool } from "../database/pool.js";
import { GAME_RULES } from "../config/gameRules.js";
import {
  createUser,
  validatePassword,
  validateUsername,
  verifyCredentials
} from "./accountService.js";
import {
  AuthError,
  type AuthService,
  type AuthenticatedSession
} from "./authService.js";

const SESSION_DURATION_DAYS = 30;

interface SessionUserRow extends RowDataPacket {
  id: number;
  username: string;
  chips: number;
  dunkaroos: number;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function toPublicUser(user: SessionUserRow): PublicUser {
  return {
    id: String(user.id),
    username: user.username,
    chips: user.chips,
    dunkaroos: user.dunkaroos
  };
}

function isDuplicateKey(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ER_DUP_ENTRY"
  );
}

async function createSession(user: PublicUser): Promise<AuthenticatedSession> {
  const token = randomBytes(32).toString("base64url");

  await pool.execute(
    `INSERT INTO user_sessions (user_id, token_hash, expires_at)
     VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(6), INTERVAL ? DAY))`,
    [user.id, hashToken(token), SESSION_DURATION_DAYS]
  );

  return { user, token };
}

export const databaseAuthService: AuthService = {
  async register(username, password) {
    let cleanUsername: string;

    try {
      cleanUsername = validateUsername(username);
      validatePassword(password);
    } catch (error) {
      throw new AuthError(
        400,
        "invalid_credentials",
        error instanceof Error ? error.message : "Invalid account details"
      );
    }

    let userId: number;
    try {
      userId = await createUser(cleanUsername, password);
    } catch (error) {
      if (isDuplicateKey(error)) {
        throw new AuthError(409, "username_taken", "That username is already in use");
      }
      throw error;
    }

    return createSession({
      id: String(userId),
      username: cleanUsername,
      chips: GAME_RULES.startingChips,
      dunkaroos: GAME_RULES.startingDunkaroos
    });
  },

  async login(username, password) {
    const user = await verifyCredentials(username, password);
    if (!user) {
      throw new AuthError(401, "invalid_login", "Incorrect username or password");
    }

    return createSession({
      id: String(user.id),
      username: user.username,
      chips: user.chips,
      dunkaroos: user.dunkaroos
    });
  },

  async authenticate(token) {
    const [rows] = await pool.execute<SessionUserRow[]>(
      `SELECT users.id, users.username, users.chips, users.dunkaroos
       FROM user_sessions
       INNER JOIN users ON users.id = user_sessions.user_id
       WHERE user_sessions.token_hash = ?
         AND user_sessions.expires_at > UTC_TIMESTAMP(6)
       LIMIT 1`,
      [hashToken(token)]
    );

    const user = rows[0];
    return user ? toPublicUser(user) : null;
  },

  async logout(token) {
    await pool.execute(
      "DELETE FROM user_sessions WHERE token_hash = ?",
      [hashToken(token)]
    );
  }
};
