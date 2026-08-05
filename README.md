# Fox Blackjack

A personal-project starter for a pixel-art blackjack game with an anthropomorphic fox dealer, sprite animation, music, two in-game currencies, a cosmetic shop, and a MySQL-backed account system.

## What is already represented

- Phaser + TypeScript + Vite web client
- Animated placeholder fox dealer
- Fresh randomized deck for every hand
- Dealer stands on 17
- Hit and stand only; no split, double down, insurance, or surrender
- Wagers from 10 to 100 chips in increments of 10
- Normal wins pay 1:1; natural blackjack pays 3:2
- Blackjack profit is rounded up to a whole chip
- Dunkaroos earned equal positive chip profit
- MySQL schema for users, balances, owned cosmetics, equipment, rewards, attempts, game sessions, and transaction history
- Server-side daily login and dealer-passcode service skeletons
- Server-side shop catalog stored in TypeScript rather than MySQL
- GitHub Actions CI
- Docker Compose and Caddy files for later droplet hosting

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- Docker Desktop or a local MySQL 8 server when you begin API/database work

## Start the visual prototype

```bash
npm install
npm run dev
```

Open the Vite address shown in the terminal, normally `http://localhost:5173`.

The browser prototype uses temporary in-memory balances. It does not write to MySQL yet.

## Start MySQL and apply the schema

```bash
cp .env.example .env
# Edit the passwords in .env first.
docker compose up -d mysql
npm run db:migrate
```

Start the API in another terminal:

```bash
npm run dev:api
```

Health check: `http://localhost:3000/api/health`

The browser uses hash routes so it works behind a simple static Nginx setup:
`/#/login`, `/#/register`, and `/#/game`. Authentication uses an HTTP-only
session cookie backed by hashed session tokens in MySQL.

## Useful commands

```bash
npm run dev                 # Phaser client
npm run dev:api             # Express API
npm run db:migrate          # Apply pending SQL migrations
npm run test                # Unit tests
npm run typecheck           # Type-check every workspace
npm run build               # Production builds
```

Manual password recovery is intentionally admin-only:

```bash
npm run db:reset-password -- username new-password
```

## Repository map

```text
apps/web                  Phaser presentation, animation, audio, and menus
apps/api                  Express API, MySQL services, fixed game content
packages/game-core        Pure blackjack rules and payout calculations
packages/shared-types     Shared API/domain types
database/migrations       Versioned MySQL schema
docs                      Agreed project rules and data-model notes
assets-source             Editable Aseprite/music/SFX source files
deploy                    Later Caddy/droplet configuration
```

## Important content rule

Persistent player state belongs in MySQL. Fixed content belongs in TypeScript.

Examples of fixed content:

- shop item names, prices, categories, and asset keys
- the seven dealer passcodes and accepted variants
- blackjack rules and bet limits
- default cosmetic asset keys

Examples of database state:

- chip and dunkaroo balances
- daily rewards already claimed
- passcode attempt already used
- purchased item keys
- currently equipped item keys
- completed game and currency transaction records

See `docs/GAME_RULES.md` and `docs/DATA_MODEL.md` before adding features.
