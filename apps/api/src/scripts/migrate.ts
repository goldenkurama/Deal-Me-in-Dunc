import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import type { RowDataPacket } from "mysql2";

const repositoryRoot = path.resolve(process.cwd(), "../..");
dotenv.config({ path: path.join(repositoryRoot, ".env") });

const migrationsDirectory = path.join(repositoryRoot, "database/migrations");

const connection = await mysql.createConnection({
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 3306),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  timezone: "Z",
  multipleStatements: true
});

try {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) NOT NULL PRIMARY KEY,
      applied_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  const files = (await fs.readdir(migrationsDirectory))
    .filter((filename) => filename.endsWith(".sql"))
    .sort();

  for (const filename of files) {
    const [rows] = await connection.execute<RowDataPacket[]>(
      "SELECT filename FROM schema_migrations WHERE filename = ?",
      [filename]
    );

    if (rows.length > 0) {
      console.log(`Skipping ${filename}`);
      continue;
    }

    const sql = await fs.readFile(path.join(migrationsDirectory, filename), "utf8");
    console.log(`Applying ${filename}`);

    await connection.beginTransaction();
    try {
      await connection.query(sql);
      await connection.execute(
        "INSERT INTO schema_migrations (filename) VALUES (?)",
        [filename]
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  }

  console.log("Database migrations are current.");
} finally {
  await connection.end();
}
