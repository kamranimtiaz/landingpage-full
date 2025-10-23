# Changelog

## Database Management Improvements - 2025-10-07

### Issues Fixed

1. **UNIQUE constraint error when importing hotels**
   - Problem: hotels-import.sql contained duplicate sample hotels already in migration
   - Fixed: Removed duplicates, starting from hotel-11

2. **Tables not visible in Cloudflare Dashboard**
   - Problem: Users running migrations locally but expecting to see tables in Dashboard
   - Fixed: Added comprehensive documentation explaining local vs remote databases

3. **Confusing database workflow**
   - Problem: No clear guidance on when to use --local vs --remote
   - Fixed: Created helper scripts and improved npm scripts

### New Files

#### Examples
- `examples/hotels-upsert.sql` - Safe hotel import using INSERT OR REPLACE (no duplicate errors)

#### Scripts
- `scripts/setup-local.sh` - One-command local database setup
- `scripts/setup-remote.sh` - One-command remote database setup (with safety prompts)
- `scripts/reset-local.sh` - Reset local database
- `scripts/check-database.sh` - Check status of both local and remote databases

#### Documentation
- `docs/DATABASE.md` - Comprehensive database management guide
  - Local vs remote explanation
  - Complete command reference
  - Troubleshooting guide
  - Best practices

### Updated Files

#### `examples/hotels-import.sql`
- Removed duplicate sample hotels (hotel-1, hotel-2, hotel-3)
- Now starts from hotel-11
- Added clear warnings about duplicates

#### `package.json`
Added helpful database scripts:
- `db:migrate:remote` - Run migrations on production
- `db:import:local` / `db:import:remote` - Import hotels
- `db:upsert:local` / `db:upsert:remote` - Upsert hotels (safe for duplicates)
- `db:list:local` / `db:list:remote` - List all hotels
- `db:count:local` / `db:count:remote` - Count hotels
- `db:reset:local` - Reset local database

#### `SETUP.md`
- Added section "Understanding Local vs Remote Databases"
- Added troubleshooting for UNIQUE constraint errors
- Added troubleshooting for Dashboard visibility
- Reorganized steps with clearer numbering
- Added quick setup options using helper scripts

### Usage

#### Quick Start (Local Development)
```bash
./scripts/setup-local.sh
pnpm run dev
```

#### Quick Start (Production)
```bash
./scripts/setup-remote.sh
pnpm run deploy
```

#### Check Database Status
```bash
./scripts/check-database.sh
```

#### Import Hotels (Safe Method)
```bash
# Edit examples/hotels-upsert.sql first
pnpm run db:upsert:local   # For local
pnpm run db:upsert:remote  # For production
```

### Breaking Changes

None - all changes are backwards compatible.

### Migration Notes

If you previously ran `pnpm run db:migrate:local`, you already have:
- ✅ Tables created locally
- ✅ 3 sample hotels (hotel-1, hotel-2, hotel-3)

To add more hotels:
1. Edit `examples/hotels-import.sql` (start from hotel-11)
2. Run `pnpm run db:import:local`

Or use the upsert method:
1. Edit `examples/hotels-upsert.sql`
2. Run `pnpm run db:upsert:local`

To see tables in Cloudflare Dashboard:
```bash
pnpm run db:migrate:remote
```

### Documentation

- Read [docs/DATABASE.md](docs/DATABASE.md) for complete database guide
- Read [SETUP.md](SETUP.md) for setup instructions
- All helper scripts in `scripts/` have --help output
