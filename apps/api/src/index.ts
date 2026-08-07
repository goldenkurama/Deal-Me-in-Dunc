import "dotenv/config";
import { createApp } from "./app.js";
import { databaseAuthService } from "./services/databaseAuthService.js";
import { databaseGameService } from "./services/databaseGameService.js";
import { databaseShopService } from "./services/shopService.js";

const app = createApp(
  databaseAuthService,
  databaseGameService,
  databaseShopService
);
const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  console.log(`Fox Blackjack API listening on http://localhost:${port}`);
});
