import "dotenv/config";
import bcrypt from "bcryptjs";
import type { ResultSetHeader } from "mysql2";
import { pool } from "../database/pool.js";
import { validatePassword, validateUsername } from "../services/accountService.js";

const [, , usernameArg, passwordArg] = process.argv;

if (!usernameArg || !passwordArg) {
  console.error("Usage: npm run db:reset-password -- username new-password");
  process.exitCode = 1;
} else {
  const username = validateUsername(usernameArg);
  validatePassword(passwordArg);
  const passwordHash = await bcrypt.hash(passwordArg, 12);

  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE users SET password_hash = ? WHERE username = ?`,
    [passwordHash, username]
  );

  if (result.affectedRows === 0) {
    console.error("No matching user.");
    process.exitCode = 1;
  } else {
    console.log(`Password reset for ${username}.`);
  }

  await pool.end();
}
