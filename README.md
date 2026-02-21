# Proprio — Self-Hosted Personal Finance

A private, beautiful, self-hosted finance tracker. Your data stays on your server.

<img src="https://github.com/user-attachments/assets/dc25e826-be18-492c-a7ef-9a5d00629e0b" width="830" alt="Ledger project screenshot" />

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
| SSL | Let's Encrypt (optional) |
| Process | systemd |

## Requirements

- Ubuntu 22.04 or 24.04 VPS
- Root access
- A domain name pointed at your server IP *(optional — see IP-only mode below)*

## Quick Deploy

**With a domain + HTTPS (recommended):**
```bash
curl -fsSL https://raw.githubusercontent.com/rarespopes/proprio/main/deploy.sh | bash -s -- your.domain.com you@email.com
```

**IP-only mode (no domain, no SSL):**
```bash
curl -fsSL https://raw.githubusercontent.com/rarespopes/proprio/main/deploy.sh | bash -s -- 123.456.789.0
```

Or clone and run manually:
```bash
git clone https://github.com/rarespopes/proprio.git
cd proprio
bash deploy.sh your.domain.com you@email.com   # with domain
bash deploy.sh 123.456.789.0                   # IP only
```

The script handles everything — packages, Python environment, frontend build, Nginx, SSL (if domain provided), systemd service, and nightly backups. Takes about 5 minutes.

> **No domain?** You can also get a free subdomain from [DuckDNS](https://www.duckdns.org) 
> (e.g. `yourname.duckdns.org`) and use it exactly like a paid domain, with full HTTPS.

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
