# Deployment Guide

## Overview

This guide explains how to deploy the Urea Delivery Tracker application to production.

---

## Quick Start

### Option 1: Automated Deployment (Recommended)

Run the complete deployment script which handles everything:

```bash
bash scripts/deploy.sh
```

This script will:
1. ✅ Check prerequisites (Node.js, pnpm, environment variables)
2. ✅ Backup current state
3. ✅ Install dependencies
4. ✅ Run type checking
5. ✅ Run tests
6. ✅ Run database migrations
7. ✅ Build the application
8. ✅ Start the production server
9. ✅ Generate deployment report

### Option 2: Manual Deployment

If you prefer to deploy step-by-step:

```bash
# 1. Install dependencies
pnpm install

# 2. Run type checking
pnpm run check

# 3. Run tests
pnpm test

# 4. Run database migrations
yes | pnpm run db:push

# 5. Build the application
pnpm build

# 6. Start the production server
pnpm start
```

---

## Prerequisites

Before deploying, ensure you have:

### Required Software
- **Node.js** v18+ (check with `node --version`)
- **pnpm** v9+ (check with `pnpm --version`)
- **PostgreSQL** (for database)

### Required Environment Variables

Create a `.env` file in the project root with:

```bash
# Database connection
DATABASE_URL="postgresql://user:password@localhost:5432/urea_tracker"

# Node environment
NODE_ENV="production"

# Optional: API configuration
API_PORT=3000
```

### Database Setup

1. **Create PostgreSQL database:**
   ```bash
   createdb urea_tracker
   ```

2. **Verify connection:**
   ```bash
   psql postgresql://user:password@localhost:5432/urea_tracker -c "SELECT 1"
   ```

---

## Deployment Steps

### Step 1: Prepare the Server

```bash
# SSH into your server
ssh user@your-server.com

# Navigate to project directory
cd /path/to/urea-delivery-tracker

# Pull latest code
git pull origin main
```

### Step 2: Set Environment Variables

```bash
# Create .env file
cat > .env << EOF
DATABASE_URL="postgresql://user:password@localhost:5432/urea_tracker"
NODE_ENV="production"
API_PORT=3000
EOF

# Verify permissions
chmod 600 .env
```

### Step 3: Run Deployment Script

```bash
# Make script executable
chmod +x scripts/deploy.sh

# Run deployment
bash scripts/deploy.sh
```

### Step 4: Verify Deployment

```bash
# Check if server is running
curl http://localhost:3000/api/trpc/auth.me

# Check server logs
tail -f deployment.log

# View deployment report
cat deployment-report-*.md
```

---

## Production Configuration

### Nginx Reverse Proxy (Optional)

If you want to expose the app on port 80/443:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### PM2 Process Manager (Optional)

For automatic restart on failure:

```bash
# Install PM2
npm install -g pm2

# Create ecosystem config
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'urea-tracker',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 config to restart on reboot
pm2 save
pm2 startup
```

### SSL/TLS Certificate (Optional)

For HTTPS support:

```bash
# Using Let's Encrypt with Certbot
sudo certbot certonly --standalone -d your-domain.com

# Update Nginx config to use SSL
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # ... rest of config
}
```

---

## Monitoring & Maintenance

### Check Server Status

```bash
# View running process
ps aux | grep "node dist/index.js"

# Check port 3000
lsof -i :3000

# Check disk space
df -h

# Check memory usage
free -h
```

### View Logs

```bash
# Real-time logs
tail -f deployment.log

# Last 100 lines
tail -100 deployment.log

# Search for errors
grep "ERROR" deployment.log
```

### Database Maintenance

```bash
# Backup database
pg_dump postgresql://user:password@localhost:5432/urea_tracker > backup.sql

# Restore database
psql postgresql://user:password@localhost:5432/urea_tracker < backup.sql

# Check database size
psql -c "SELECT pg_database.datname, pg_size_pretty(pg_database_size(pg_database.datname)) FROM pg_database ORDER BY pg_database_size(pg_database.datname) DESC;"
```

---

## Troubleshooting

### Issue: "Port 3000 already in use"

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use the deployment script which handles this automatically
```

### Issue: "DATABASE_URL not set"

```bash
# Verify .env file exists
ls -la .env

# Verify DATABASE_URL is set
grep DATABASE_URL .env

# Set it manually if needed
export DATABASE_URL="postgresql://user:password@localhost:5432/urea_tracker"
```

### Issue: "Database connection failed"

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1"

# Check PostgreSQL is running
sudo systemctl status postgresql

# Check database exists
psql -l | grep urea_tracker
```

### Issue: "Build failed"

```bash
# Clean build artifacts
rm -rf dist/

# Reinstall dependencies
pnpm install --force

# Try building again
pnpm build

# Check for TypeScript errors
pnpm run check
```

### Issue: "Server not responding"

```bash
# Check if server is running
curl http://localhost:3000/api/trpc/auth.me

# Check logs for errors
tail -f deployment.log

# Restart server
bash scripts/deploy.sh
```

---

## Rollback Procedure

If deployment fails, you can rollback to the previous state:

```bash
# List available backups
ls -la .backups/

# Restore previous dist
cp -r .backups/dist_<timestamp> dist/

# Restore previous .env
cp .backups/.env_<timestamp> .env

# Restart server
pnpm start
```

---

## Performance Optimization

### Enable Compression

Add to your Nginx config:

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
```

### Database Connection Pooling

The application uses connection pooling by default. Adjust if needed:

```bash
# In .env
DATABASE_POOL_SIZE=20
DATABASE_POOL_IDLE_TIMEOUT=30000
```

### Caching Headers

Configure cache headers in Nginx:

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## Backup Strategy

### Automated Daily Backups

```bash
# Create cron job
crontab -e

# Add this line to backup daily at 2 AM
0 2 * * * pg_dump $DATABASE_URL > /backups/urea_tracker_$(date +\%Y\%m\%d).sql
```

### Backup Verification

```bash
# Test restore from backup
pg_restore /backups/urea_tracker_backup.sql -d test_db
```

---

## Security Checklist

- [ ] `.env` file has correct permissions (600)
- [ ] Database password is strong (20+ characters)
- [ ] SSL/TLS certificate is installed
- [ ] Firewall only allows necessary ports (80, 443, 3000)
- [ ] Regular backups are tested
- [ ] Audit logs are monitored
- [ ] Server updates are applied regularly

---

## Support

For deployment issues:

1. Check the troubleshooting section above
2. Review deployment logs: `tail -f deployment.log`
3. Check server resources: `htop`
4. Review database status: `psql -c "SELECT version();"`

---

**Last Updated:** February 2026
**Version:** 1.0.0
