#!/bin/bash

# Check Database Status
# Shows the current state of both local and remote databases

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "======================================"
echo "Database Status Check"
echo "======================================"
echo ""

# Check Local Database
echo -e "${BLUE}LOCAL DATABASE${NC}"
echo "────────────────────────────────────"

if [ -d ".wrangler/state/v3/d1" ]; then
  echo -e "${GREEN}✓${NC} Local database exists"
  echo ""

  echo "Tables:"
  wrangler d1 execute hotel-booking-db --local --command "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'd1_%'" 2>/dev/null || echo "Error checking tables"

  echo ""
  echo "Hotel count:"
  pnpm run db:count:local 2>/dev/null || echo "Error counting hotels"

  echo ""
  echo "Sample hotels:"
  wrangler d1 execute hotel-booking-db --local --command "SELECT hotel_id, hotel_name, hotel_code FROM hotels LIMIT 5" 2>/dev/null || echo "Error listing hotels"
else
  echo -e "${YELLOW}⚠${NC} Local database not found"
  echo "Run: pnpm run db:migrate:local"
fi

echo ""
echo ""

# Check Remote Database
echo -e "${BLUE}REMOTE DATABASE (Cloudflare)${NC}"
echo "────────────────────────────────────"

echo "Checking remote database..."
REMOTE_CHECK=$(wrangler d1 execute hotel-booking-db --remote --command "SELECT COUNT(*) FROM sqlite_master" 2>&1)

if [[ $REMOTE_CHECK == *"error"* ]] || [[ $REMOTE_CHECK == *"Error"* ]]; then
  echo -e "${YELLOW}⚠${NC} Remote database not accessible or not set up"
  echo "Run: pnpm run db:migrate:remote"
else
  echo -e "${GREEN}✓${NC} Remote database accessible"
  echo ""

  echo "Tables:"
  wrangler d1 execute hotel-booking-db --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'd1_%'" 2>/dev/null || echo "Error checking tables"

  echo ""
  echo "Hotel count:"
  pnpm run db:count:remote 2>/dev/null || echo "Error counting hotels"

  echo ""
  echo "Sample hotels:"
  wrangler d1 execute hotel-booking-db --remote --command "SELECT hotel_id, hotel_name, hotel_code FROM hotels LIMIT 5" 2>/dev/null || echo "Error listing hotels"
fi

echo ""
echo "======================================"
echo ""
echo "Useful commands:"
echo "  Local:  pnpm run db:list:local"
echo "  Remote: pnpm run db:list:remote"
echo "  Reset:  ./scripts/reset-local.sh"
