#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# setup.sh - Installation/réinstallation de Mesurage App
# Idempotent : détecte l'existant, n'installe que ce qui manque.
# Usage : ./scripts/setup.sh (depuis la racine du dépôt)
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$ROOT_DIR/backend"

log()  { echo -e "\033[1;34m[setup]\033[0m $1"; }
warn() { echo -e "\033[1;33m[setup][attention]\033[0m $1"; }
fail() { echo -e "\033[1;31m[setup][erreur]\033[0m $1"; exit 1; }

# ------------------------------------------------------------
# 1. Node.js
# ------------------------------------------------------------
if command -v node >/dev/null 2>&1; then
  log "Node.js déjà présent ($(node --version))"
else
  log "Node.js introuvable — installation via nvm..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  export NVM_DIR="$HOME/.config/nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  nvm install --lts
fi

# ------------------------------------------------------------
# 2. PostgreSQL
# ------------------------------------------------------------
if command -v psql >/dev/null 2>&1; then
  log "PostgreSQL déjà présent"
else
  log "PostgreSQL introuvable — installation..."
  sudo apt-get update
  sudo apt-get install -y postgresql postgresql-contrib
fi

if systemctl is-enabled postgresql >/dev/null 2>&1; then
  log "PostgreSQL déjà activé au démarrage"
else
  log "Activation de PostgreSQL au démarrage..."
  sudo systemctl enable postgresql
fi
sudo systemctl start postgresql 2>/dev/null || true

# ------------------------------------------------------------
# 3. Rôle et base de données PostgreSQL
# ------------------------------------------------------------
DB_NAME="mesurage_db"
DB_USER="mesurage_user"
DB_PASS_EXISTING=""

if [ -f "$BACKEND_DIR/.env" ] && grep -q "^DATABASE_URL=" "$BACKEND_DIR/.env"; then
  log ".env existant détecté — les identifiants DB actuels seront conservés"
  DB_PASS_EXISTING=$(grep "^DATABASE_URL=" "$BACKEND_DIR/.env" | sed -E 's/.*:\/\/[^:]+:([^@]+)@.*/\1/')
fi

DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" || true)
if [ "$DB_EXISTS" = "1" ]; then
  log "Rôle PostgreSQL '$DB_USER' déjà existant — inchangé"
  DB_PASS="$DB_PASS_EXISTING"
else
  DB_PASS=$(openssl rand -hex 16)
  log "Création du rôle PostgreSQL '$DB_USER'..."
  sudo -u postgres psql -c "CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASS';"
fi

DB_CREATED=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" || true)
if [ "$DB_CREATED" = "1" ]; then
  log "Base '$DB_NAME' déjà existante — inchangée"
else
  log "Création de la base '$DB_NAME'..."
  sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
fi

# ------------------------------------------------------------
# 4. Fichier .env
# ------------------------------------------------------------
if [ -f "$BACKEND_DIR/.env" ]; then
  log ".env déjà présent — non modifié"
else
  log "Création de .env..."
  JWT_SECRET=$(openssl rand -hex 64)
  cat > "$BACKEND_DIR/.env" <<EOF
DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"
JWT_SECRET="$JWT_SECRET"
PORT=3000
HTTPS_PORT=3443
EOF
  log ".env créé avec un JWT_SECRET généré aléatoirement"
fi

# ------------------------------------------------------------
# 5. Certificats HTTPS auto-signés (poste de scan LAN)
# ------------------------------------------------------------
CERTS_DIR="$BACKEND_DIR/certs"
if [ -f "$CERTS_DIR/key.pem" ] && [ -f "$CERTS_DIR/cert.pem" ]; then
  log "Certificats HTTPS déjà présents"
else
  log "Génération des certificats HTTPS auto-signés..."
  mkdir -p "$CERTS_DIR"
  openssl req -x509 -newkey rsa:2048 -nodes \
    -keyout "$CERTS_DIR/key.pem" -out "$CERTS_DIR/cert.pem" \
    -days 3650 -subj "/CN=mesurage-app-local"
fi

# ------------------------------------------------------------
# 6. Dépendances npm + Prisma
# ------------------------------------------------------------
log "Installation des dépendances npm..."
cd "$BACKEND_DIR"
npm install

log "Application des migrations Prisma..."
npx prisma migrate deploy
npx prisma generate

# ------------------------------------------------------------
# 7. PM2
# ------------------------------------------------------------
if command -v pm2 >/dev/null 2>&1; then
  log "PM2 déjà présent"
else
  log "PM2 introuvable — installation..."
  sudo npm install -g pm2
fi

mkdir -p "$BACKEND_DIR/logs"

if pm2 describe mesurage-app >/dev/null 2>&1; then
  log "Process 'mesurage-app' déjà connu de PM2 — redémarrage..."
  pm2 restart mesurage-app
else
  log "Démarrage de mesurage-app via PM2..."
  pm2 start "$BACKEND_DIR/ecosystem.config.js"
fi
pm2 save

if systemctl is-enabled "pm2-$(whoami)" >/dev/null 2>&1; then
  log "Démarrage PM2 au boot déjà configuré"
else
  log "Configuration du démarrage PM2 au boot..."
  warn "Une commande sudo va s'afficher ci-dessous : copiez-la et exécutez-la manuellement, puis relancez ce script."
  pm2 startup || true
fi

# ------------------------------------------------------------
# Résumé final
# ------------------------------------------------------------
log "Installation terminée."
log "Dashboard : http://localhost:3000"
log "Poste de scan (LAN) : https://<IP-de-cette-machine>:3443"
if [ -n "${JWT_SECRET:-}" ]; then
  warn "Un nouveau JWT_SECRET a été généré — créez un compte via /api/auth/register, puis passez-le admin :"
  warn "  sudo -u postgres psql -d $DB_NAME -c \"UPDATE \\\"User\\\" SET role='admin' WHERE email='votre@email.com';\""
fi