import cors from "cors";
import express, { type Express } from "express";
import type { AuthService } from "./services/authService.js";
import type { GameService } from "./services/gameService.js";
import { createAuthRouter } from "./routes/auth.js";
import { createGameRouter } from "./routes/game.js";
import { configRouter } from "./routes/config.js";
import { healthRouter } from "./routes/health.js";

export function createApp(
  authService: AuthService,
  gameService: GameService
): Express {
  const app = express();
  const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

  app.disable("x-powered-by");
  app.use(cors({ origin: clientOrigin, credentials: true }));
  app.use(express.json({ limit: "32kb" }));
  app.use("/api/health", healthRouter);
  app.use("/api/config", configRouter);
  app.use("/api/auth", createAuthRouter(authService));
  app.use("/api/game", createGameRouter(authService, gameService));

  app.use((_request, response) => {
    response.status(404).json({ error: "not_found", message: "Not found" });
  });

  return app;
}
