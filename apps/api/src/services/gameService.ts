import type {
  HandSettlementRequest,
  HandSettlementResponse
} from "@fox-blackjack/shared-types";

export interface GameService {
  settleHand(
    userId: string,
    settlement: HandSettlementRequest
  ): Promise<HandSettlementResponse>;
}

export class GameError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "GameError";
  }
}
