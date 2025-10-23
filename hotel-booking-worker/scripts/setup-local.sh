#!/bin/bash

# Setup Local Development Database
# This script creates tables and imports sample hotel data for local development

set -e  # Exit on error

echo "======================================"
echo "Setting Up Local Development Database"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Run migrations
echo "📦 Step 1: Running migrations..."
pnpm run db:migrate:local

echo -e "${GREEN}✓${NC} Migrations applied"
echo ""

# Step 2: Import hotels
echo "🏨 Step 2: Importing hotel data..."
pnpm run db:import:local

echo -e "${GREEN}✓${NC} Hotels imported"
echo ""

# Step 3: Verify setup
echo "🔍 Step 3: Verifying setup..."
echo ""
echo "Tables created:"
wrangler d1 execute hotel-booking-db --local --command "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'd1_%'"

echo ""
echo "Hotel count:"
pnpm run db:count:local

echo ""
echo -e "${GREEN}✓ Local database setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Run: pnpm run dev"
echo "  2. Test: curl http://localhost:8787/health"
echo "  3. View hotels: pnpm run db:list:local"
