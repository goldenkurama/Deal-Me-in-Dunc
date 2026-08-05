import "dotenv/config";
import { createApp } from "./app.js";
import { databaseAuthService } from "./services/databaseAuthService.js";

const app = createApp(databaseAuthService);
const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  console.log(`Fox Blackjack API listening on http://localhost:${port}`);
});
