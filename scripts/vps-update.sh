#!/bin/bash
# ============================================================
# SP Logistix - Script de mise à jour du VPS
# ============================================================
# À utiliser après chaque git push pour mettre à jour le VPS.
#
# Usage (depuis votre VPS):
#   cd /opt/splogistix
#   chmod +x scripts/vps-update.sh
#   ./scripts/vps-update.sh

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log()     { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }

APP_DIR="/opt/splogistix"
cd "${APP_DIR}"

log "Récupération des dernières modifications..."
git pull
success "Code mis à jour"

log "Installation des nouvelles dépendances..."
pnpm install --frozen-lockfile
success "Dépendances à jour"

log "Migration de la base de données..."
yes | pnpm run db:push
success "Base de données migrée"

log "Build du backend..."
pnpm run build
success "Backend compilé"

log "Redémarrage du serveur..."
pm2 restart splogistix-api
success "Serveur redémarré"

echo ""
echo -e "${GREEN}✅ Mise à jour terminée !${NC}"
pm2 status splogistix-api
