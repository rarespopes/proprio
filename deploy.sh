#!/bin/bash
# Proprio — automated deployment script
#
# Usage with domain + HTTPS:  bash deploy.sh <domain> <email>
# Usage with IP only:         bash deploy.sh <ip>

set -e

TARGET=${1}
EMAIL=${2}
INSTALL_DIR="/opt/proprio"

if [ -z "$TARGET" ]; then
  echo "Usage:"
  echo "  bash deploy.sh <domain> <email>   # with HTTPS"
  echo "  bash deploy.sh <ip>               # IP only, no SSL"
  exit 1
fi

# Detect if TARGET is an IP address using grep
if echo "$TARGET" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$'; then
  MODE="ip"
else
  MODE="domain"
  if [ -z "$EMAIL" ]; then
    echo "Email required when using a domain (for SSL certificate)."
    exit 1
  fi
fi

echo ""
echo "╔══════════════════════════════════════╗"
echo "║     Proprio — Finance Platform       ║"
echo "║     Self-hosted deployment           ║"
echo "╚══════════════════════════════════════╝"
echo ""
if [ "$MODE" = "domain" ]; then
  echo "Mode:    Domain + HTTPS"
  echo "Domain:  $TARGET"
  echo "Email:   $EMAIL"
else
  echo "Mode:    IP only (no SSL)"
  echo "IP:      $TARGET"
fi
echo "Dir:     $INSTALL_DIR"
echo ""
read -p "Proceed? (y/n) " -n 1 -r < /dev/tty; echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then exit 1; fi

# ── 1. System packages ────────────────────────────────────────────────────────
echo "→ Installing system packages..."
apt update -qq && apt install -y \
  python3 python3-pip python3-venv \
  nginx certbot python3-certbot-nginx \
  git curl ufw build-essential sqlite3

# ── 2. Node 20 ────────────────────────────────────────────────────────────────
echo "→ Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
apt install -y nodejs

# ── 3. Firewall ───────────────────────────────────────────────────────────────
echo "→ Configuring firewall..."
ufw allow OpenSSH > /dev/null
ufw allow 'Nginx Full' > /dev/null
ufw --force enable > /dev/null

# ── 4. Clone repo ─────────────────────────────────────────────────────────────
echo "→ Cloning Proprio..."
mkdir -p $INSTALL_DIR
git clone https://github.com/rarespopes/proprio.git $INSTALL_DIR
mkdir -p $INSTALL_DIR/backups

# ── 5. Python venv ────────────────────────────────────────────────────────────
echo "→ Setting up Python environment..."
cd $INSTALL_DIR/backend
python3 -m venv venv
source venv/bin/activate
pip install -q --upgrade pip
pip install -q \
  fastapi "uvicorn[standard]" sqlalchemy alembic \
  "python-jose[cryptography]" "passlib[bcrypt]" \
  python-multipart pydantic-settings "pydantic[email]" \
  "bcrypt==4.0.1"

# ── 6. Generate secret key ────────────────────────────────────────────────────
echo "→ Generating secret key..."
SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
cat > $INSTALL_DIR/backend/.env << ENVEOF
SECRET_KEY=$SECRET
ENVEOF
chmod 600 $INSTALL_DIR/backend/.env

# ── 7. Initialise database ────────────────────────────────────────────────────
echo "→ Initialising database..."
# Database is created automatically by FastAPI on first start
# Just ensure the directory is writable
touch $INSTALL_DIR/backend/db.sqlite3
chmod 600 $INSTALL_DIR/backend/db.sqlite3

# ── 8. Frontend build ─────────────────────────────────────────────────────────
echo "→ Building frontend..."
cd $INSTALL_DIR/frontend
npm install --silent
npm run build --silent

# ── 9. Nginx config ───────────────────────────────────────────────────────────
echo "→ Configuring Nginx..."
cat > /etc/nginx/sites-available/proprio << NGINXEOF
server {
    listen 80;
    server_name $TARGET;

    root $INSTALL_DIR/frontend/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/proprio /etc/nginx/sites-enabled/proprio
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ── 10. SSL (domain mode only) ────────────────────────────────────────────────
if [ "$MODE" = "domain" ]; then
  echo "→ Obtaining SSL certificate..."
  certbot --nginx -d $TARGET \
    --non-interactive --agree-tos \
    -m $EMAIL --redirect
else
  echo "→ Skipping SSL (IP-only mode)"
fi

# ── 11. Systemd service ───────────────────────────────────────────────────────
echo "→ Creating systemd service..."
cat > /etc/systemd/system/proprio.service << SVCEOF
[Unit]
Description=Proprio Finance API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR/backend
Environment="PATH=$INSTALL_DIR/backend/venv/bin"
EnvironmentFile=$INSTALL_DIR/backend/.env
ExecStart=$INSTALL_DIR/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SVCEOF

systemctl daemon-reload
systemctl enable proprio
systemctl start proprio

# Wait for service to be ready
echo "→ Waiting for service to start..."
for i in $(seq 1 15); do
  if curl -sf http://127.0.0.1:8000/api/health > /dev/null 2>&1; then
    echo "  ✓ Service is ready"
    break
  fi
  sleep 1
done

# ── 12. Nightly backup ────────────────────────────────────────────────────────
echo "→ Setting up nightly backups..."
echo "0 2 * * * root sqlite3 $INSTALL_DIR/backend/db.sqlite3 '.backup $INSTALL_DIR/backups/db_\$(date +\%Y\%m\%d).sqlite3'" \
  > /etc/cron.d/proprio-backup

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════╗"
echo "║     Proprio is live!                 ║"
echo "╚══════════════════════════════════════╝"
echo ""
if [ "$MODE" = "domain" ]; then
  echo "  URL:     https://$TARGET"
  echo "  API:     https://$TARGET/api/health"
else
  echo "  URL:     http://$TARGET"
  echo "  API:     http://$TARGET/api/health"
fi
echo ""
echo "  Logs:    journalctl -u proprio -f"
echo "  Restart: systemctl restart proprio"
echo "  Data:    $INSTALL_DIR/backend/db.sqlite3"
echo ""
