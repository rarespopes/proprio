# Proprio — Self-Hosted Personal Finance

A private & self-hosted finance tracker. Your data stays on your server.

![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **Income tracking** — log salary, freelance, rental, investments by source
- **Expense tracking** — categorise and tag expenses to commitments
- **Commitments** — fixed monthly costs (rent, bills, subscriptions) with budget tracking
- **Goals** — savings goals with monthly funding targets and progress tracking
- **Dashboard** — total balance, free cash, category breakdown, recent transactions
- **JWT auth** — secure login, 7-day sessions, bcrypt passwords

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Backend | FastAPI (Python) |
| Database | SQLite |
| Auth | JWT + bcrypt |
| Proxy | Nginx |
| SSL | Let's Encrypt |
| Process | systemd |

## Requirements

- Ubuntu 22.04 or 24.04 VPS
- A domain name pointed at your server's IP
- Root access

## Quick Deploy
```bash
curl -fsSL https://raw.githubusercontent.com/rarespopes/proprio/main/deploy.sh | bash -s -- your.domain.com you@email.com
```

Or clone and run manually:
```bash
git clone https://github.com/rarespopes/proprio.git
cd ledger
bash deploy.sh your.domain.com you@email.com
```

The script handles everything — packages, Python environment, frontend build, Nginx, SSL, systemd service, and nightly backups. Takes about 5 minutes.

## Manual Deployment

If you prefer step-by-step control, see the full deployment guide in [DEPLOY.md](DEPLOY.md).

## Updating
```bash
cd /opt/proprio
git pull
cd frontend && npm run build
systemctl restart proprio
```

## Migrating to a New Server

**On the old server — export your data:**
```bash
sqlite3 /opt/proprio/backend/db.sqlite3 ".dump" > backup.sql
```

**On the new server — deploy fresh, then restore:**
```bash
bash deploy.sh your.domain.com you@email.com
sqlite3 /opt/proprio/backend/db.sqlite3 < backup.sql
systemctl restart proprio
```

## Useful Commands
```bash
# View live logs
journalctl -u proprio -f

# Restart backend
systemctl restart proprio

# Manual backup
sqlite3 /opt/proprio/backend/db.sqlite3 ".backup /opt/proprio/backups/manual.sqlite3"
```

## License

MIT — use it, fork it, deploy it for friends.
