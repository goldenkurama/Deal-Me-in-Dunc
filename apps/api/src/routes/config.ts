import { Router } from "express";
import { GAME_RULES } from "../config/gameRules.js";
import { SHOP_ITEMS } from "../config/shopCatalog.js";

export const configRouter = Router();

configRouter.get("/", (_request, response) => {
  response.json({
    gameRules: {
      minimumBet: GAME_RULES.minimumBet,
      maximumBet: GAME_RULES.maximumBet,
      betIncrement: GAME_RULES.betIncrement,
      dealerStandValue: GAME_RULES.dealerStandValue
    },
    shopItems: SHOP_ITEMS
  });
});
