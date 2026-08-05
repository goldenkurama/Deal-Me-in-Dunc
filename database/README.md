# Database

MySQL 8+ is used for persistent player state.

Apply migrations with:

```bash
npm run db:migrate
```

The migration runner creates and maintains a `schema_migrations` table, then runs files in `database/migrations/` in filename order.

The shop catalog and dealer passcodes are intentionally not database tables. See:

```text
apps/api/src/config/shopCatalog.ts
apps/api/src/config/dealerCodes.ts
```
