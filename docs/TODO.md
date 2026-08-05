# Remaining project decisions and work

The schema and fixed rules are ready, but these pieces are intentionally unfinished:

- Write the seven dealer hints.
- Write correct/incorrect dialogue and Saturday alternate dialogue.
- Add real shop items and prices to `apps/api/src/config/shopCatalog.ts`.
- Replace placeholder dealer, chip, dunkaroo, and card-back art.
- Add music, win sounds, and bust sounds.
- Choose an authenticated session strategy, then wire protected Express routes.
- Implement the transactional game-session service around `game_sessions` and `currency_transactions`.
- Build the menu/inventory/passcode UI.
- Add deployment workflow only after manual droplet deployment works.

Do not expose accepted dealer answers in the browser bundle.
