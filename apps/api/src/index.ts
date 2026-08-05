import "dotenv/config";
import cors from "cors";
import express from "express";
import { configRouter } from "./routes/config.js";
import { healthRouter } from "./routes/health.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);
const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

app.disable("x-powered-by");
app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(express.json({ limit: "32kb" }));
app.use("/api/health", healthRouter);
app.use("/api/config", configRouter);

// Authentication and protected game/shop routes are intentionally left for
// the next layer. Wire them to the service functions only after choosing the
// session-cookie/token strategy.

app.use((_request, response) => {
  response.status(404).json({ error: "Not found" });
});

app.listen(port, () => {
  console.log(`Fox Blackjack API listening on http://localhost:${port}`);
});
