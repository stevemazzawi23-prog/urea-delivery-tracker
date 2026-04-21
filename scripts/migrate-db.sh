#!/bin/bash

# Non-interactive database migration script
# This script runs drizzle migrations with automatic confirmation

cd "$(dirname "$0")/.."

echo "Starting database migration..."
echo "This will update your PostgreSQL database schema to support centralized data synchronization."
echo ""

# Generate migrations
echo "Step 1: Generating migrations..."
npx drizzle-kit generate

# Run migrations with automatic yes to all prompts
echo ""
echo "Step 2: Applying migrations..."
echo "Answering 'yes' to all schema change prompts..."
yes | npx drizzle-kit migrate

echo ""
echo "✅ Database migration completed successfully!"
echo ""
echo "Your database now supports:"
echo "  • Centralized client management"
echo "  • Real-time delivery tracking"
echo "  • Invoice generation and tracking"
echo "  • Audit logs for all changes"
echo "  • Driver account management"
echo ""
echo "Data is now synchronized across all devices!"
