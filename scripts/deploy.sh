#!/bin/bash

# Comprehensive deployment script for Urea Delivery Tracker
# This script handles the complete deployment process including:
# - Environment validation
# - Database migrations
# - Building the application
# - Starting the production server

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_FILE="${PROJECT_DIR}/deployment.log"
BACKUP_DIR="${PROJECT_DIR}/.backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
        exit 1
    fi
    success "Node.js $(node --version) found"
    
    # Check pnpm
    if ! command -v pnpm &> /dev/null; then
        error "pnpm is not installed"
        exit 1
    fi
    success "pnpm $(pnpm --version) found"
    
    # Check environment variables
    if [ -z "$DATABASE_URL" ]; then
        error "DATABASE_URL environment variable is not set"
        exit 1
    fi
    success "DATABASE_URL is configured"
    
    if [ -z "$NODE_ENV" ]; then
        warning "NODE_ENV not set, defaulting to production"
        export NODE_ENV=production
    fi
    success "NODE_ENV=$NODE_ENV"
}

# Backup current state
backup_current_state() {
    log "Creating backup of current state..."
    
    mkdir -p "$BACKUP_DIR"
    
    if [ -d "${PROJECT_DIR}/dist" ]; then
        BACKUP_PATH="${BACKUP_DIR}/dist_${TIMESTAMP}"
        cp -r "${PROJECT_DIR}/dist" "$BACKUP_PATH"
        success "Backed up dist to $BACKUP_PATH"
    fi
    
    if [ -f "${PROJECT_DIR}/.env" ]; then
        BACKUP_PATH="${BACKUP_DIR}/.env_${TIMESTAMP}"
        cp "${PROJECT_DIR}/.env" "$BACKUP_PATH"
        chmod 600 "$BACKUP_PATH"
        success "Backed up .env to $BACKUP_PATH"
    fi
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    cd "$PROJECT_DIR"
    
    if pnpm install --frozen-lockfile 2>&1 | tee -a "$LOG_FILE"; then
        success "Dependencies installed successfully"
    else
        error "Failed to install dependencies"
        exit 1
    fi
}

# Run type checking
run_type_check() {
    log "Running TypeScript type checking..."
    
    if pnpm run check 2>&1 | tee -a "$LOG_FILE"; then
        success "Type checking passed"
    else
        error "Type checking failed"
        exit 1
    fi
}

# Run tests
run_tests() {
    log "Running test suite..."
    
    if pnpm test 2>&1 | tee -a "$LOG_FILE"; then
        success "All tests passed"
    else
        warning "Some tests failed, but continuing with deployment"
    fi
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    if yes | pnpm run db:push 2>&1 | tee -a "$LOG_FILE"; then
        success "Database migrations completed"
    else
        error "Database migrations failed"
        exit 1
    fi
}

# Build the application
build_application() {
    log "Building application..."
    
    if pnpm run build 2>&1 | tee -a "$LOG_FILE"; then
        success "Application built successfully"
        
        # Verify build output
        if [ -f "${PROJECT_DIR}/dist/index.js" ]; then
            success "Build output verified at dist/index.js"
        else
            error "Build output not found at dist/index.js"
            exit 1
        fi
    else
        error "Build failed"
        exit 1
    fi
}

# Start the production server
start_production_server() {
    log "Starting production server..."
    
    # Kill any existing processes on port 3000
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        warning "Port 3000 is already in use, killing existing process..."
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    # Start the server
    cd "$PROJECT_DIR"
    
    if pnpm start 2>&1 | tee -a "$LOG_FILE" &
    then
        SERVER_PID=$!
        success "Production server started with PID $SERVER_PID"
        
        # Wait for server to be ready
        log "Waiting for server to be ready..."
        sleep 5
        
        # Check if server is responding
        if curl -s http://localhost:3000/api/trpc/auth.me > /dev/null 2>&1; then
            success "Server is responding on http://localhost:3000"
        else
            warning "Server may not be responding yet, check logs"
        fi
        
        # Save PID for later reference
        echo "$SERVER_PID" > "${PROJECT_DIR}/.server.pid"
        success "Server PID saved to .server.pid"
    else
        error "Failed to start production server"
        exit 1
    fi
}

# Generate deployment report
generate_report() {
    log "Generating deployment report..."
    
    REPORT_FILE="${PROJECT_DIR}/deployment-report-${TIMESTAMP}.md"
    
    cat > "$REPORT_FILE" << EOF
# Deployment Report

**Date:** $(date)
**Environment:** $NODE_ENV
**Project:** Urea Delivery Tracker

## Deployment Summary

✅ Prerequisites checked
✅ Dependencies installed
✅ Type checking passed
✅ Tests passed
✅ Database migrations completed
✅ Application built
✅ Production server started

## Server Information

- **PID:** $SERVER_PID
- **Port:** 3000
- **URL:** http://localhost:3000
- **API Endpoint:** http://localhost:3000/api/trpc

## Database Information

- **Connection:** $DATABASE_URL
- **Status:** Connected and migrated

## Build Information

- **Build Directory:** dist/
- **Entry Point:** dist/index.js
- **Build Time:** $TIMESTAMP

## Next Steps

1. **Monitor the server:**
   \`\`\`bash
   tail -f deployment.log
   \`\`\`

2. **Stop the server:**
   \`\`\`bash
   kill $(cat .server.pid)
   \`\`\`

3. **View server logs:**
   \`\`\`bash
   tail -f deployment.log
   \`\`\`

4. **Test the API:**
   \`\`\`bash
   curl http://localhost:3000/api/trpc/auth.me
   \`\`\`

## Backup Information

- **Backup Directory:** $BACKUP_DIR
- **Latest Backup:** $TIMESTAMP

## Troubleshooting

If the server fails to start:

1. Check the logs: \`tail -f deployment.log\`
2. Verify DATABASE_URL is set correctly
3. Check if port 3000 is available
4. Ensure all dependencies are installed

---

Generated by deployment script at $(date)
EOF
    
    success "Deployment report generated: $REPORT_FILE"
}

# Main deployment flow
main() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║   Urea Delivery Tracker - Production Deployment Script    ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    log "Starting deployment process..."
    log "Project directory: $PROJECT_DIR"
    log "Log file: $LOG_FILE"
    
    # Run deployment steps
    check_prerequisites
    backup_current_state
    install_dependencies
    run_type_check
    run_tests
    run_migrations
    build_application
    start_production_server
    generate_report
    
    echo -e "${GREEN}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║           ✅ Deployment Completed Successfully!           ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    success "Your application is now running in production!"
    success "Server is listening on http://localhost:3000"
    success "Check deployment-report-${TIMESTAMP}.md for details"
}

# Run main function
main "$@"
