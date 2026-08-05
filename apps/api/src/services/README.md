# API services

Business logic lives here, separate from Express route handling.

Included skeletons:

- `accountService.ts`: username/password creation and verification
- `dailyLoginService.ts`: additive once-per-Eastern-day login grant
- `dealerCodeService.ts`: one daily passcode attempt and optional chip reward
- `shopService.ts`: permanent purchase and one-item-per-category equipment

Protected HTTP routes are intentionally not wired yet. Choose the session-cookie or token approach first, then call these services using the authenticated user's ID.
