#!/bin/bash

# Setup Remote/Production Database on Cloudflare
# ⚠️  WARNING: This modifies your PRODUCTION database

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "Setting Up Remote Production Database"
echo "======================================"
echo ""
echo -e "${RED}⚠️  WARNING: This will modify your PRODUCTION database on Cloudflare${NC}"
echo ""

# Safety confirmation
read -p "Are you sure you want to continue? Type 'yes' to proceed: " -r
echo ""

if [[ ! $REPLY == "yes" ]]; then
  echo "Setup cancelled."
  exit 1
fi

echo "Proceeding with remote setup..."
echo ""

# Step 1: Run migrations
echo "📦 Step 1: Running migrations on remote database..."
pnpm run db:migrate:remote

echo -e "${GREEN}✓${NC} Remote migrations applied"
echo ""

# Step 2: Import hotels
echo "🏨 Step 2: Importing hotel data to remote..."
read -p "Import hotels now? (yes/no): " -r
echo ""

if [[ $REPLY == "yes" ]]; then
  pnpm run db:import:remote
  echo -e "${GREEN}✓${NC} Hotels imported to remote"
else
  echo -e "${YELLOW}⚠${NC} Skipped hotel import - you can run 'pnpm run db:import:remote' later"
fi

echo ""

# Step 3: Verify setup
echo "🔍 Step 3: Verifying remote setup..."
echo ""
echo "Tables on remote:"
wrangler d1 execute hotel-booking-db --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'd1_%'"

echo ""
echo "Hotel count on remote:"
pnpm run db:count:remote

echo ""
echo -e "${GREEN}✓ Remote database setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. View in Cloudflare Dashboard: https://dash.cloudflare.com"
echo "  2. Navigate to: Workers & Pages → D1 → hotel-booking-db"
echo "  3. Deploy your worker: pnpm run deploy"
