# Later droplet deployment

You can build everything locally and keep it in GitHub before purchasing a droplet or domain.

Production layout:

```text
Caddy
├── /api/* → Express API
└── /*      → compiled Phaser client

Express API → MySQL (private Docker network)
```

On an Ubuntu droplet with Docker installed:

```bash
git clone <your-repository-url> /opt/fox-blackjack
cd /opt/fox-blackjack
cp .env.example .env
# Set GAME_DOMAIN and strong database passwords.
docker compose up -d mysql
npm install
npm run db:migrate
docker compose up -d --build
```

MySQL binds only to the droplet's loopback interface and is not exposed publicly. Back up the `mysql_data` volume or use `mysqldump` before production updates.
