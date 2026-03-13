#!/bin/bash
# ============================================================
# SP Logistix - Script de configuration du VPS
# ============================================================
# Ce script installe et configure tout ce qu'il faut sur votre
# VPS Ubuntu pour héberger le backend SP Logistix.
#
# Usage:
#   chmod +x vps-setup.sh
#   sudo ./vps-setup.sh
#
# Prérequis: Ubuntu 20.04 / 22.04 avec accès root/sudo

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log()     { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warn()    { echo -e "${YELLOW}⚠️  $1${NC}"; }
error()   { echo -e "${RED}❌ $1${NC}"; exit 1; }

# ── 1. Mise à jour du système ────────────────────────────────
log "Mise à jour du système..."
apt-get update -y && apt-get upgrade -y
success "Système mis à jour"

# ── 2. Installation de Node.js 20 ───────────────────────────
log "Installation de Node.js 20..."
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
success "Node.js $(node --version) installé"

# ── 3. Installation de pnpm ──────────────────────────────────
log "Installation de pnpm..."
if ! command -v pnpm &>/dev/null; then
  npm install -g pnpm
fi
success "pnpm $(pnpm --version) installé"

# ── 4. Installation de PM2 (gestionnaire de processus) ───────
log "Installation de PM2..."
if ! command -v pm2 &>/dev/null; then
  npm install -g pm2
fi
success "PM2 installé"

# ── 5. Installation de MySQL ─────────────────────────────────
log "Installation de MySQL..."
if ! command -v mysql &>/dev/null; then
  apt-get install -y mysql-server
  systemctl start mysql
  systemctl enable mysql
fi
success "MySQL installé et démarré"

# ── 6. Création de la base de données et de l'utilisateur ────
log "Configuration de la base de données MySQL..."
DB_NAME="splogistix_db"
DB_USER="splogistix"
DB_PASS=$(openssl rand -base64 24 | tr -d '/+=' | head -c 20)

mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF

success "Base de données '${DB_NAME}' créée"
success "Utilisateur '${DB_USER}' créé"

# ── 7. Clonage du dépôt ──────────────────────────────────────
APP_DIR="/opt/splogistix"
log "Clonage du dépôt dans ${APP_DIR}..."

if [ -d "${APP_DIR}" ]; then
  warn "Le dossier ${APP_DIR} existe déjà. Mise à jour..."
  cd "${APP_DIR}"
  git pull
else
  git clone https://github.com/stevemazzawi23-prog/urea-delivery-tracker.git "${APP_DIR}"
  cd "${APP_DIR}"
fi
success "Code source prêt dans ${APP_DIR}"

# ── 8. Génération du JWT_SECRET ──────────────────────────────
JWT_SECRET=$(openssl rand -base64 48 | tr -d '/+=' | head -c 48)

# ── 9. Création du fichier .env ──────────────────────────────
log "Création du fichier .env..."
PUBLIC_IP=$(curl -s ifconfig.me || echo "VOTRE_IP")

cat > "${APP_DIR}/.env" <<ENVEOF
# SP Logistix - Production Environment
DATABASE_URL=mysql://${DB_USER}:${DB_PASS}@localhost:3306/${DB_NAME}
JWT_SECRET=${JWT_SECRET}
VITE_APP_ID=sp-logistix
PORT=3000
NODE_ENV=production
EXPO_PUBLIC_API_BASE_URL=http://${PUBLIC_IP}:3000
EXPO_PUBLIC_APP_ID=sp-logistix
ENVEOF

chmod 600 "${APP_DIR}/.env"
success "Fichier .env créé"

# ── 10. Installation des dépendances ─────────────────────────
log "Installation des dépendances Node.js..."
cd "${APP_DIR}"
pnpm install --frozen-lockfile
success "Dépendances installées"

# ── 11. Migration de la base de données ──────────────────────
log "Migration de la base de données..."
cd "${APP_DIR}"
yes | pnpm run db:push
success "Base de données migrée"

# ── 12. Build du backend ─────────────────────────────────────
log "Build du backend..."
cd "${APP_DIR}"
pnpm run build
success "Backend compilé"

# ── 13. Configuration PM2 ────────────────────────────────────
log "Configuration de PM2..."
cat > "${APP_DIR}/ecosystem.config.js" <<'PM2EOF'
module.exports = {
  apps: [{
    name: 'splogistix-api',
    script: './dist/index.js',
    cwd: '/opt/splogistix',
    env_file: '/opt/splogistix/.env',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    error_file: '/var/log/splogistix/error.log',
    out_file: '/var/log/splogistix/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }]
};
PM2EOF

mkdir -p /var/log/splogistix

# Démarrer ou redémarrer l'application
pm2 delete splogistix-api 2>/dev/null || true
pm2 start "${APP_DIR}/ecosystem.config.js"
pm2 save
pm2 startup | tail -1 | bash || true
success "PM2 configuré et application démarrée"

# ── 14. Ouverture du port 3000 dans le firewall ──────────────
log "Configuration du firewall..."
if command -v ufw &>/dev/null; then
  ufw allow 3000/tcp
  success "Port 3000 ouvert dans UFW"
else
  warn "UFW non trouvé. Ouvrez manuellement le port 3000 dans votre panel VPS."
fi

# ── 15. Résumé ───────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         ✅ Configuration VPS terminée avec succès !      ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📋 Informations importantes (SAUVEGARDEZ CES INFOS) :${NC}"
echo ""
echo -e "  Base de données : ${YELLOW}${DB_NAME}${NC}"
echo -e "  Utilisateur DB  : ${YELLOW}${DB_USER}${NC}"
echo -e "  Mot de passe DB : ${YELLOW}${DB_PASS}${NC}"
echo -e "  JWT Secret      : ${YELLOW}${JWT_SECRET}${NC}"
echo -e "  IP publique VPS : ${YELLOW}${PUBLIC_IP}${NC}"
echo -e "  URL API         : ${YELLOW}http://${PUBLIC_IP}:3000${NC}"
echo ""
echo -e "${BLUE}📱 Pour l'APK Android, mettez dans votre .env local :${NC}"
echo -e "  ${YELLOW}EXPO_PUBLIC_API_BASE_URL=http://${PUBLIC_IP}:3000${NC}"
echo ""
echo -e "${BLUE}🔧 Commandes utiles :${NC}"
echo -e "  Voir les logs   : ${YELLOW}pm2 logs splogistix-api${NC}"
echo -e "  Redémarrer      : ${YELLOW}pm2 restart splogistix-api${NC}"
echo -e "  Statut          : ${YELLOW}pm2 status${NC}"
echo -e "  Tester l'API    : ${YELLOW}curl http://localhost:3000/api/health${NC}"
echo ""
