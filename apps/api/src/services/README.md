# API services

Business logic lives here, separate from Express route handling.

Included skeletons:

- `accountService.ts`: username/password creation and verification
- `dailyLoginService.ts`: additive once-per-Eastern-day login grant
- `dealerCodeService.ts`: one daily passcode attempt and optional chip reward
- `databaseGameService.ts`: transactional, idempotent blackjack settlement
- `shopService.ts`: permanent purchase and one-item-per-category equipment

Authentication and completed-hand settlement are exposed through protected HTTP
routes using the authenticated session cookie. Other economy services remain
unwired until their corresponding UI flows are implemented.
