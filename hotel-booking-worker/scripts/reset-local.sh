#!/bin/bash

# Reset Local Database
# Deletes local database and recreates from scratch

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "Reset Local Development Database"
echo "======================================"
echo ""
echo -e "${YELLOW}⚠️  This will DELETE your local database and recreate it${NC}"
echo ""

read -p "Continue? (yes/no): " -r
echo ""

if [[ ! $REPLY == "yes" ]]; then
  echo "Reset cancelled."
  exit 1
fi

echo "🗑️  Deleting local database..."
rm -rf .wrangler/state/v3/d1
echo -e "${GREEN}✓${NC} Local database deleted"
echo ""

echo "📦 Running migrations..."
pnpm run db:migrate:local
echo -e "${GREEN}✓${NC} Tables created"
echo ""

echo "🏨 Importing hotels..."
pnpm run db:import:local
echo -e "${GREEN}✓${NC} Hotels imported"
echo ""

echo "Hotel count:"
pnpm run db:count:local

echo ""
echo -e "${GREEN}✓ Local database reset complete!${NC}"
