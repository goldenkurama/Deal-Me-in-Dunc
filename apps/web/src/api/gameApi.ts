import type {
  HandSettlementRequest,
  HandSettlementResponse
} from "@fox-blackjack/shared-types";
import { apiRequest } from "./authApi";

export function settleCompletedHand(
  settlement: HandSettlementRequest
): Promise<HandSettlementResponse> {
  return apiRequest<HandSettlementResponse>("/api/game/settle", {
    method: "POST",
    body: JSON.stringify(settlement)
  });
}
