# Setup Guide

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- Cloudflare account
- Wrangler CLI installed (`npm install -g wrangler`)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd hotel-booking-worker
pnpm install
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Create D1 Database

```bash
wrangler d1 create hotel-booking-db
```

Copy the database ID from the output and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "hotel-booking-db"
database_id = "YOUR_DATABASE_ID_HERE"  # Replace with actual ID
```

### 4. Create KV Namespace

```bash
wrangler kv:namespace create CACHE
```

Copy the KV namespace ID and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "CACHE"
id = "YOUR_KV_ID_HERE"  # Replace with actual ID
```

### 5. Set Up Environment Variables (Optional)

If ASA requires authentication:

```bash
# For production
wrangler secret put ASA_API_KEY

# For local development, create .dev.vars file
echo "ASA_API_KEY=your_api_key_here" > .dev.vars
```

### 6. Understanding Local vs Remote Databases

**IMPORTANT:** There are TWO separate databases:

| Database | Location | Usage | Visible in Dashboard? |
|----------|----------|-------|----------------------|
| **Local** | Your computer (`.wrangler/` folder) | Development & testing | ❌ No |
| **Remote** | Cloudflare servers | Production | ✅ Yes |

**Key Points:**
- Local and remote databases **do NOT sync automatically**
- Commands with `--local` affect only your computer
- Commands with `--remote` affect Cloudflare production database
- Use local for development, remote for production

### 7. Set Up Local Database (Development)

**Quick Setup (Recommended):**
```bash
# One command to set up everything locally
./scripts/setup-local.sh
```

**Manual Setup:**
```bash
# Step 1: Create tables
pnpm run db:migrate:local

# Step 2: Add hotel data (edit examples/hotels-import.sql first!)
pnpm run db:import:local

# Step 3: Verify
pnpm run db:list:local
```

**Important:** The migration already includes 3 sample hotels. Edit `examples/hotels-import.sql` to add your remaining hotels.

### 8. Set Up Remote Database (Production)

⚠️ **WARNING:** This affects your production database on Cloudflare!

**Quick Setup:**
```bash
# Interactive setup with safety prompts
./scripts/setup-remote.sh
```

**Manual Setup:**
```bash
# Step 1: Create tables on Cloudflare
pnpm run db:migrate:remote

# Step 2: Import hotels (edit examples/hotels-import.sql first!)
pnpm run db:import:remote

# Step 3: Verify in Cloudflare Dashboard
# Visit: https://dash.cloudflare.com → Workers & Pages → D1 → hotel-booking-db
```

### 9. Managing Hotel Data

Edit `examples/hotels-import.sql` and add your 50+ hotels:

```sql
INSERT INTO hotels (hotel_id, hotel_name, hotel_code) VALUES
  ('hotel-11', 'Your Hotel Name', 'CODE011'),
  ('hotel-12', 'Another Hotel', 'CODE012'),
  -- Add all your hotels here
```

**Field Meanings:**
- `hotel_id`: Used in the URL `/submit/{hotel-id}` - match your Webflow page slugs
- `hotel_code`: Used by AlpineBits - must match what ASA sends in HotelCode
- `hotel_name`: Display name shown in XML responses

**Avoiding Duplicates:**
- The migration inserts hotel-1, hotel-2, hotel-3 automatically
- Start your import from hotel-11 (or use your own IDs)
- OR use `examples/hotels-upsert.sql` which safely handles duplicates

### 10. Test Locally

```bash
pnpm run dev
```

Visit http://localhost:8787 to see the health check.

### 11. Test Form Submission

```bash
curl -X POST http://localhost:8787/submit/hotel-1 \
  -H "Content-Type: application/json" \
  -d '{
    "Sprache": "de",
    "period": "2025-10-05 - 2025-10-24",
    "Erwachsene": "2 Erwachsene",
    "Kinder": "1 Kind",
    "Alter-Kind-1": "8 Jahre",
    "selected-room": "Deluxe Suite",
    "Anrede": "Herr",
    "Vorname": "Test",
    "Nachname": "User",
    "Telefonnummer": "017612345678",
    "E-Mail-Adresse": "test@example.com",
    "Anmerkung": "Test booking"
  }'
```

### 12. Verify Database

```bash
# Check if request was stored
wrangler d1 execute hotel-booking-db --local --command "SELECT * FROM guest_requests"
```

### 13. Deploy to Production

```bash
pnpm run deploy
```

Your worker will be deployed to: `https://hotel-booking-worker.YOUR_SUBDOMAIN.workers.dev`

### 14. Update Webflow Forms

Update your Webflow landing pages to submit to your deployed Worker URL.

## Webflow Integration

### Update script.js in Webflow

Find your existing form submission code and update the endpoint:

```javascript
// Replace the fetch URL with your Worker URL
const API_URL = 'https://hotel-booking-worker.YOUR_SUBDOMAIN.workers.dev';

// In your form submit handler
const response = await fetch(`${API_URL}/submit/hotel-1`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    Sprache: languageField.value,
    period: periodField.value,
    Erwachsene: adultsField.value,
    Kinder: childrenField.value,
    // ... rest of your form fields
  })
});

const result = await response.json();
if (result.success) {
  console.log('Booking request submitted:', result.requestId);
  // Show success message to user
} else {
  console.error('Error:', result.message);
  // Show error message to user
}
```

### Map Hotel IDs

For each of your 50+ hotels, ensure:
1. The hotel is in the database
2. The Webflow page submits to `/submit/{hotel-id}` with the correct hotel-id
3. The hotel_code in database matches what ASA will send

## ASA Integration

Provide ASA with:
1. **Endpoint URL**: `https://hotel-booking-worker.YOUR_SUBDOMAIN.workers.dev/alpinebits`
2. **Polling frequency**: Every 5-10 minutes
3. **Hotel Codes**: List of all hotel_code values from your database
4. **Authentication** (if required): API key set via wrangler secret

### ASA Request Flow

1. **ASA sends OTA_ReadRQ** with HotelCode
2. **Worker responds** with all unacknowledged guest requests
3. **ASA processes** the requests
4. **ASA sends OTA_NotifReportRQ** to acknowledge
5. **Worker marks** requests as acknowledged

## Monitoring

### View Logs

```bash
# Real-time logs
wrangler tail

# Filter logs
wrangler tail --format pretty
```

### Check Database

```bash
# List all pending requests
wrangler d1 execute hotel-booking-db --command "SELECT * FROM guest_requests WHERE status='pending'"

# Count requests by status
wrangler d1 execute hotel-booking-db --command "SELECT status, COUNT(*) as count FROM guest_requests GROUP BY status"

# View request logs
wrangler d1 execute hotel-booking-db --command "SELECT * FROM request_logs ORDER BY created_at DESC LIMIT 10"
```

### Cloudflare Dashboard

Monitor your worker at:
https://dash.cloudflare.com -> Workers & Pages -> hotel-booking-worker

## Troubleshooting

### Issue: Tables not visible in Cloudflare Dashboard
**Problem:** You ran migrations locally but can't see tables in the dashboard.

**Cause:** Local database (`.wrangler/`) is separate from remote database (Cloudflare).

**Solution:**
```bash
# Run migrations on remote database
pnpm run db:migrate:remote

# Then check dashboard: https://dash.cloudflare.com → Workers & Pages → D1
```

### Issue: UNIQUE constraint failed: hotels.hotel_code
**Problem:** Error when importing hotels: "UNIQUE constraint failed"

**Cause:** The migration already inserted sample hotels (hotel-1, hotel-2, hotel-3). Import file has duplicates.

**Solutions:**

**Option 1: Use upsert (safest)**
```bash
pnpm run db:upsert:local  # Uses INSERT OR REPLACE
```

**Option 2: Reset and start fresh**
```bash
./scripts/reset-local.sh  # Deletes and recreates local database
```

**Option 3: Edit import file**
- Remove duplicate hotels from `examples/hotels-import.sql`
- Start from hotel-11 or use unique IDs

### Issue: "Hotel not found"
- Verify hotel_id exists in database: `pnpm run db:list:local`
- Check the URL: `/submit/{hotel-id}` matches database hotel_id

### Issue: "Invalid date format"
- Ensure period is in format: "YYYY-MM-DD - YYYY-MM-DD"
- Check for extra spaces or different separators

### Issue: CORS errors from Webflow
- Update CORS settings in `src/index.ts`
- Add your Webflow domain to allowed origins

### Issue: Requests not appearing in AlpineBits
- Verify hotel_code matches what ASA sends
- Check request status is 'pending' or 'sent'
- Run: `wrangler d1 execute hotel-booking-db --command "SELECT * FROM guest_requests WHERE status IN ('pending', 'sent')"`

### Issue: Local vs Remote confusion
**Use this command to check both databases:**
```bash
./scripts/check-database.sh
```

Shows status of both local and remote databases.

## Next Steps

1. ✅ Set up the Worker
2. ✅ Configure database with all hotels
3. ✅ Update Webflow forms to submit to Worker
4. ✅ Test form submissions
5. ✅ Coordinate with ASA for polling setup
6. ✅ Monitor logs and database
7. ✅ Set up alerts (optional - via Cloudflare)

## Support

For issues or questions:
- Check Cloudflare Workers docs: https://developers.cloudflare.com/workers/
- Check Hono.js docs: https://hono.dev/
- Check AlpineBits docs: https://www.alpinebits.org/
