# Database Management Guide

Complete guide for managing your D1 databases (local and remote).

## Table of Contents
- [Understanding Local vs Remote](#understanding-local-vs-remote)
- [Quick Start Commands](#quick-start-commands)
- [Database Schema](#database-schema)
- [Migration Management](#migration-management)
- [Hotel Data Management](#hotel-data-management)
- [Querying Data](#querying-data)
- [Troubleshooting](#troubleshooting)

---

## Understanding Local vs Remote

### Two Separate Databases

Your project uses **TWO completely separate databases** that do NOT sync automatically:

```
┌─────────────────────────────────────────────────────────────┐
│                    LOCAL DATABASE                           │
│  Location: .wrangler/state/v3/d1/                          │
│  Used by: pnpm run dev (local development)                 │
│  Visible: Only on your computer                            │
│  Commands: Use --local flag                                │
│  Purpose: Fast development and testing                     │
└─────────────────────────────────────────────────────────────┘
                            ↕ (no automatic sync)
┌─────────────────────────────────────────────────────────────┐
│                   REMOTE DATABASE                           │
│  Location: Cloudflare servers                              │
│  Used by: Deployed worker (production)                     │
│  Visible: Cloudflare Dashboard                             │
│  Commands: Use --remote flag                               │
│  Purpose: Production data                                  │
└─────────────────────────────────────────────────────────────┘
```

### When to Use Each

| Task | Local | Remote |
|------|-------|--------|
| Development & testing | ✅ | ❌ |
| Try new features | ✅ | ❌ |
| Debug issues | ✅ | ❌ |
| Production data | ❌ | ✅ |
| Visible in Cloudflare Dashboard | ❌ | ✅ |
| Used by deployed Worker | ❌ | ✅ |

---

## Quick Start Commands

### Setup Scripts (Easiest)

```bash
# Set up local database (development)
./scripts/setup-local.sh

# Set up remote database (production) - with safety prompts
./scripts/setup-remote.sh

# Reset local database (delete and recreate)
./scripts/reset-local.sh

# Check status of both databases
./scripts/check-database.sh
```

### npm/pnpm Scripts

```bash
# Migrations
pnpm run db:migrate:local         # Create tables locally
pnpm run db:migrate:remote        # Create tables on Cloudflare

# Import hotels
pnpm run db:import:local          # Import to local
pnpm run db:import:remote         # Import to remote

# Upsert hotels (safe for duplicates)
pnpm run db:upsert:local          # Upsert to local
pnpm run db:upsert:remote         # Upsert to remote

# List hotels
pnpm run db:list:local            # Show all hotels locally
pnpm run db:list:remote           # Show all hotels on remote

# Count hotels
pnpm run db:count:local           # Count local hotels
pnpm run db:count:remote          # Count remote hotels

# Reset
pnpm run db:reset:local           # Delete and recreate local
```

### Direct Wrangler Commands

```bash
# Execute SQL on local database
wrangler d1 execute hotel-booking-db --local --command "SELECT * FROM hotels"

# Execute SQL on remote database
wrangler d1 execute hotel-booking-db --remote --command "SELECT * FROM hotels"

# Execute SQL file on local
wrangler d1 execute hotel-booking-db --local --file=./examples/hotels-import.sql

# Execute SQL file on remote
wrangler d1 execute hotel-booking-db --remote --file=./examples/hotels-import.sql
```

---

## Database Schema

### Tables

#### 1. `hotels` - Hotel information

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Auto-increment primary key |
| `hotel_id` | TEXT | Unique slug used in URLs (e.g., 'hotel-1') |
| `hotel_name` | TEXT | Display name (e.g., 'Grand Hotel Alpen') |
| `hotel_code` | TEXT | AlpineBits code for ASA (e.g., 'GHA001') |
| `created_at` | DATETIME | Creation timestamp |
| `updated_at` | DATETIME | Last update timestamp |

**Indexes:**
- `UNIQUE(hotel_id)` - Ensures unique URLs
- `UNIQUE(hotel_code)` - Ensures unique AlpineBits codes
- `idx_hotels_hotel_code` - Fast lookup by code

#### 2. `guest_requests` - Booking requests from Webflow

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Auto-increment primary key |
| `request_id` | TEXT | Unique request ID (e.g., 'GR_1234567890_hotel-1_abc123') |
| `hotel_id` | TEXT | Foreign key to hotels.hotel_id |
| `check_in_date` | TEXT | Check-in date (YYYY-MM-DD) |
| `check_out_date` | TEXT | Check-out date (YYYY-MM-DD) |
| `adult_count` | INTEGER | Number of adults |
| `children_count` | INTEGER | Number of children |
| `child_ages` | TEXT | JSON array of child ages |
| `selected_room` | TEXT | Room type requested |
| `gender` | TEXT | Guest gender ('Male' or 'Female') |
| `first_name` | TEXT | Guest first name |
| `last_name` | TEXT | Guest last name |
| `phone_number` | TEXT | Guest phone number |
| `email` | TEXT | Guest email address |
| `language` | TEXT | Preferred language |
| `comments` | TEXT | Additional comments |
| `status` | TEXT | 'pending', 'sent', or 'acknowledged' |
| `created_at` | DATETIME | When request was submitted |
| `sent_at` | DATETIME | When sent to ASA |
| `acknowledged_at` | DATETIME | When ASA acknowledged |

**Indexes:**
- `UNIQUE(request_id)` - Ensures unique requests
- `idx_guest_requests_hotel_id` - Fast lookup by hotel
- `idx_guest_requests_status` - Fast filtering by status
- `idx_guest_requests_created_at` - Chronological ordering

#### 3. `request_logs` - Audit trail

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Auto-increment primary key |
| `request_id` | TEXT | Related guest request ID |
| `event_type` | TEXT | 'submitted', 'sent', 'acknowledged', 'error' |
| `details` | TEXT | Additional event details |
| `created_at` | DATETIME | Event timestamp |

---

## Migration Management

### Understanding Migrations

Migrations are SQL files in the `migrations/` folder that define your database structure.

**Current Migrations:**
- `0001_initial.sql` - Creates tables, indexes, and 3 sample hotels

### Running Migrations

```bash
# Local (development)
pnpm run db:migrate:local

# Remote (production)
pnpm run db:migrate:remote
```

### Migration Tracking

Wrangler tracks which migrations have run in the `d1_migrations` table:

```bash
# Check migration history
wrangler d1 execute hotel-booking-db --local --command "SELECT * FROM d1_migrations"
```

### Creating New Migrations

```bash
# Create a new migration file
touch migrations/0002_add_booking_source.sql
```

Example migration:
```sql
-- migrations/0002_add_booking_source.sql
ALTER TABLE guest_requests ADD COLUMN booking_source TEXT DEFAULT 'webflow';
```

Then run:
```bash
pnpm run db:migrate:local
```

---

## Hotel Data Management

### Adding Hotels

#### Method 1: Edit Import File (Recommended)

1. Edit `examples/hotels-import.sql`:
```sql
INSERT INTO hotels (hotel_id, hotel_name, hotel_code) VALUES
  ('hotel-11', 'Your Hotel Name', 'CODE011'),
  ('hotel-12', 'Another Hotel', 'CODE012');
```

2. Import:
```bash
pnpm run db:import:local
```

#### Method 2: Use Upsert (Safe for Updates)

1. Edit `examples/hotels-upsert.sql`
2. Run:
```bash
pnpm run db:upsert:local
```

This uses `INSERT OR REPLACE` which:
- Inserts if hotel doesn't exist
- Updates if hotel exists
- Never causes UNIQUE constraint errors

#### Method 3: Direct SQL

```bash
wrangler d1 execute hotel-booking-db --local --command "
  INSERT INTO hotels (hotel_id, hotel_name, hotel_code)
  VALUES ('hotel-99', 'Test Hotel', 'TEST99')
"
```

### Updating Hotels

```bash
wrangler d1 execute hotel-booking-db --local --command "
  UPDATE hotels
  SET hotel_name = 'New Name', hotel_code = 'NEW001'
  WHERE hotel_id = 'hotel-1'
"
```

### Deleting Hotels

```bash
# Delete specific hotel
wrangler d1 execute hotel-booking-db --local --command "
  DELETE FROM hotels WHERE hotel_id = 'hotel-1'
"

# Delete all hotels (careful!)
wrangler d1 execute hotel-booking-db --local --command "
  DELETE FROM hotels
"
```

---

## Querying Data

### Useful Queries

#### Hotels

```bash
# List all hotels
pnpm run db:list:local

# Count hotels
pnpm run db:count:local

# Find hotel by ID
wrangler d1 execute hotel-booking-db --local --command "
  SELECT * FROM hotels WHERE hotel_id = 'hotel-1'
"

# Find hotel by code
wrangler d1 execute hotel-booking-db --local --command "
  SELECT * FROM hotels WHERE hotel_code = 'GHA001'
"

# Search hotels by name
wrangler d1 execute hotel-booking-db --local --command "
  SELECT * FROM hotels WHERE hotel_name LIKE '%Alpen%'
"
```

#### Guest Requests

```bash
# All requests
wrangler d1 execute hotel-booking-db --local --command "
  SELECT * FROM guest_requests ORDER BY created_at DESC
"

# Pending requests
wrangler d1 execute hotel-booking-db --local --command "
  SELECT * FROM guest_requests WHERE status = 'pending'
"

# Requests for specific hotel
wrangler d1 execute hotel-booking-db --local --command "
  SELECT * FROM guest_requests WHERE hotel_id = 'hotel-1'
"

# Count by status
wrangler d1 execute hotel-booking-db --local --command "
  SELECT status, COUNT(*) as count
  FROM guest_requests
  GROUP BY status
"

# Recent requests (last 24 hours)
wrangler d1 execute hotel-booking-db --local --command "
  SELECT * FROM guest_requests
  WHERE created_at > datetime('now', '-1 day')
  ORDER BY created_at DESC
"
```

#### Request Logs

```bash
# Recent logs
wrangler d1 execute hotel-booking-db --local --command "
  SELECT * FROM request_logs
  ORDER BY created_at DESC
  LIMIT 20
"

# Logs for specific request
wrangler d1 execute hotel-booking-db --local --command "
  SELECT * FROM request_logs
  WHERE request_id = 'GR_1234567890_hotel-1_abc123'
  ORDER BY created_at DESC
"
```

#### Analytics Queries

```bash
# Requests per hotel
wrangler d1 execute hotel-booking-db --local --command "
  SELECT h.hotel_name, COUNT(gr.id) as request_count
  FROM hotels h
  LEFT JOIN guest_requests gr ON h.hotel_id = gr.hotel_id
  GROUP BY h.hotel_id
  ORDER BY request_count DESC
"

# Average guests per booking
wrangler d1 execute hotel-booking-db --local --command "
  SELECT
    AVG(adult_count) as avg_adults,
    AVG(children_count) as avg_children
  FROM guest_requests
"
```

---

## Troubleshooting

### Problem: "UNIQUE constraint failed: hotels.hotel_code"

**Cause:** Trying to insert a hotel with a `hotel_id` or `hotel_code` that already exists.

**Solutions:**

1. **Use upsert instead:**
   ```bash
   pnpm run db:upsert:local
   ```

2. **Check existing hotels:**
   ```bash
   pnpm run db:list:local
   ```

3. **Delete conflicting hotel:**
   ```bash
   wrangler d1 execute hotel-booking-db --local --command "
     DELETE FROM hotels WHERE hotel_id = 'hotel-1'
   "
   ```

4. **Reset database:**
   ```bash
   ./scripts/reset-local.sh
   ```

### Problem: Tables not visible in Cloudflare Dashboard

**Cause:** You ran migrations locally (--local) but Dashboard shows remote database.

**Solution:**
```bash
# Run migrations on remote database
pnpm run db:migrate:remote

# Check dashboard: https://dash.cloudflare.com → Workers & Pages → D1
```

### Problem: "no such table: hotels"

**Cause:** Migrations haven't been run yet.

**Solution:**
```bash
# For local
pnpm run db:migrate:local

# For remote
pnpm run db:migrate:remote
```

### Problem: Local and remote databases out of sync

**Solution:** They're SUPPOSED to be separate!

- Use **local** for development
- Use **remote** for production
- Manually sync data if needed:

```bash
# Export from local
wrangler d1 execute hotel-booking-db --local --command "SELECT * FROM hotels" --json > hotels-backup.json

# Then manually import to remote (requires custom script)
```

### Problem: Can't delete .wrangler folder (permission denied)

**Solution:**
```bash
# On macOS/Linux
sudo rm -rf .wrangler/state/v3/d1

# Then recreate
pnpm run db:migrate:local
```

---

## Best Practices

### Development Workflow

1. **Always start with local:**
   ```bash
   pnpm run db:migrate:local
   pnpm run db:import:local
   pnpm run dev
   ```

2. **Test thoroughly locally before deploying to remote**

3. **Use scripts for consistency:**
   ```bash
   ./scripts/setup-local.sh    # Initial setup
   ./scripts/check-database.sh  # Verify state
   ```

4. **Keep migrations in version control**

### Production Deployment

1. **Test locally first:**
   ```bash
   pnpm run dev
   # Test all endpoints
   ```

2. **Run migrations on remote:**
   ```bash
   pnpm run db:migrate:remote
   ```

3. **Import hotel data:**
   ```bash
   pnpm run db:import:remote
   ```

4. **Deploy Worker:**
   ```bash
   pnpm run deploy
   ```

5. **Verify in Dashboard:**
   - Visit https://dash.cloudflare.com
   - Check tables exist
   - Verify hotel data

### Data Safety

- ✅ **Always backup before major changes**
- ✅ **Test destructive operations locally first**
- ✅ **Use transactions for multiple related queries**
- ✅ **Keep separate development and production databases**
- ❌ **Never run untested SQL on production**
- ❌ **Don't DELETE FROM without WHERE clause on production**

---

## Command Reference

### Complete npm Scripts List

```bash
# Development
pnpm run dev                      # Start local dev server
pnpm run deploy                   # Deploy to production

# Migrations
pnpm run db:migrate               # Migrate remote (production)
pnpm run db:migrate:local         # Migrate local
pnpm run db:migrate:remote        # Migrate remote

# Hotel Data
pnpm run db:import:local          # Import hotels to local
pnpm run db:import:remote         # Import hotels to remote
pnpm run db:upsert:local          # Upsert hotels to local
pnpm run db:upsert:remote         # Upsert hotels to remote

# Queries
pnpm run db:list:local            # List all hotels (local)
pnpm run db:list:remote           # List all hotels (remote)
pnpm run db:count:local           # Count hotels (local)
pnpm run db:count:remote          # Count hotels (remote)
pnpm run db:query:local           # Run custom query (local)
pnpm run db:query:remote          # Run custom query (remote)

# Maintenance
pnpm run db:reset:local           # Reset local database
```

### Helper Scripts

```bash
./scripts/setup-local.sh          # Complete local setup
./scripts/setup-remote.sh         # Complete remote setup
./scripts/reset-local.sh          # Reset local database
./scripts/check-database.sh       # Check both databases
```

---

## Additional Resources

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
