# Hotel Booking Worker - Complete Deployment Guide

This guide will help you deploy the hotel booking worker to a new Cloudflare account with separate credentials for ASA and Admin users.

## 🎯 Overview

### Authentication Architecture
- **ASA Credentials**: Used exclusively for `/alpinebits` endpoint (AlpineBits protocol polling)
- **Admin Credentials**: Used for admin endpoints (`/admin/*`) and future dashboard
- **Public Endpoints**: `/`, `/health`, `/submit/{hotel-code}` (no auth required)

### Components
1. **Cloudflare Worker**: The API service
2. **D1 Database**: SQLite database for storing hotels and guest requests
3. **KV Namespace**: Caching layer (optional, for future use)

---

## 📋 Prerequisites

- Node.js and npm/pnpm installed
- Cloudflare account (free tier works)
- Access to command line

---

## 🚀 Step-by-Step Deployment

### 1. Install Dependencies

```bash
cd /Users/kamran/Desktop/landingpage-full/hotel-booking-worker
npm install
```

### 2. Login to Cloudflare

```bash
npx wrangler login
```

This will open your browser to authenticate.

### 3. Create D1 Database

```bash
npx wrangler d1 create hotel-booking-db
```

**Save the output!** You'll get something like:
```
[[d1_databases]]
binding = "DB"
database_name = "hotel-booking-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # ← Copy this!
```

### 4. Create KV Namespace

```bash
npx wrangler kv:namespace create CACHE
```

**Save the output!** You'll get something like:
```
{ binding = "CACHE", id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }  # ← Copy this!
```

### 5. Update wrangler.toml

Update the IDs in `wrangler.toml`:

```toml
# Line 13: Update database_id
database_id = "YOUR-D1-DATABASE-ID-FROM-STEP-3"

# Line 18: Update KV id
id = "YOUR-KV-ID-FROM-STEP-4"
```

### 6. Set Up ASA Credentials (for AlpineBits)

```bash
# Set ASA username
npx wrangler secret put ALPINEBITS_USERNAME
# When prompted, enter: asa_user (or your preferred username)

# Generate a secure password
openssl rand -base64 32
# Copy the generated password

# Set ASA password
npx wrangler secret put ALPINEBITS_PASSWORD
# Paste the generated password when prompted

# Optional: Require Client ID header
npx wrangler secret put ALPINEBITS_REQUIRE_CLIENT_ID
# Enter: false (or true if you want to require it)
```

**💾 Save these credentials!** You'll give them to ASA later.

### 7. Set Up Admin Credentials (for Dashboard)

```bash
# Set Admin username
npx wrangler secret put ADMIN_USERNAME
# When prompted, enter: admin (or your preferred username)

# Generate a secure password for admin
openssl rand -base64 32
# Copy the generated password

# Set Admin password
npx wrangler secret put ADMIN_PASSWORD
# Paste the generated password when prompted
```

**💾 Save these credentials!** You'll use them to access admin endpoints.

### 8. Run Database Migrations

```bash
# Create the database tables
npm run db:migrate:remote
```

Expected output:
```
🌀 Executing on remote database hotel-booking-db
🚣 Executed 2 migration(s) in X.XX seconds
```

### 9. Import Sample Hotel Data

```bash
# Import hotels into database
npm run db:import:remote
```

### 10. Verify Database Setup

```bash
# List all hotels
npm run db:list:remote

# Count hotels
npm run db:count:remote
```

You should see 4 hotels listed.

### 11. Deploy the Worker

```bash
npm run deploy
```

If prompted for a workers.dev subdomain, enter something unique like:
- `your-company-hotels`
- `hotel-booking-api-xyz`

**💾 Save the deployment URL!** Example: `https://your-subdomain.workers.dev`

---

## ✅ Testing the Deployment

### Test 1: Health Check (No Auth)

```bash
curl https://YOUR-WORKER-URL.workers.dev/health
```

Expected response:
```json
{"status":"ok"}
```

### Test 2: Admin Stats Endpoint (Admin Auth Required)

```bash
curl https://YOUR-WORKER-URL.workers.dev/admin/stats \
  -u "admin:YOUR-ADMIN-PASSWORD"
```

Expected response:
```json
{
  "success": true,
  "stats": {
    "total": 0,
    "pending": 0,
    "sent": 0,
    "acknowledged": 0
  }
}
```

### Test 3: Admin Hotels Endpoint (Admin Auth Required)

```bash
curl https://YOUR-WORKER-URL.workers.dev/admin/hotels \
  -u "admin:YOUR-ADMIN-PASSWORD"
```

Expected response:
```json
{
  "success": true,
  "count": 4,
  "hotels": [...]
}
```

### Test 4: AlpineBits Ping (ASA Auth Required)

```bash
curl -X POST https://YOUR-WORKER-URL.workers.dev/alpinebits \
  -H "Content-Type: multipart/form-data" \
  -H "Authorization: Basic $(echo -n 'asa_user:YOUR-ASA-PASSWORD' | base64)" \
  -H "X-AlpineBits-ClientProtocolVersion: 2024-10" \
  -F 'action=OTA_Ping:Handshaking' \
  -F 'request=<?xml version="1.0" encoding="UTF-8"?><OTA_PingRQ xmlns="http://www.opentravel.org/OTA/2003/05" Version="1.0"><EchoData>{"versions":[{"version":"2024-10","actions":[{"action":"action_OTA_Read"},{"action":"action_OTA_NotifReport"}]}]}</EchoData></OTA_PingRQ>'
```

Expected: XML response with capability intersection.

---

## 📄 Credentials to Share with ASA

Create a document with the following information for ASA:

```
=================================
AlpineBits Integration Credentials
=================================

Endpoint URL: https://YOUR-WORKER-URL.workers.dev/alpinebits
Protocol: HTTP POST with multipart/form-data
Authentication: HTTP Basic Auth

Credentials:
  Username: asa_user
  Password: [YOUR-ASA-PASSWORD]

Required Headers:
  - Authorization: Basic [base64(username:password)]
  - X-AlpineBits-ClientProtocolVersion: 2024-10
  - Content-Type: multipart/form-data

Supported Actions:
  - OTA_Ping:Handshaking (capability negotiation)
  - OTA_Read:GuestRequests (poll for new guest requests)
  - OTA_NotifReport:GuestRequests (acknowledge received requests)

AlpineBits Version: 2024-10
Specification: AlpineBits HotelData 2024-10

Notes:
  - Requests with status 'pending' will be sent to ASA
  - After sending, status changes to 'sent'
  - ASA must acknowledge requests via OTA_NotifReport
  - After acknowledgment, status changes to 'acknowledged'
```

---

## 🎛️ Admin Endpoints (For Your Dashboard)

All admin endpoints require HTTP Basic Auth with `ADMIN_USERNAME:ADMIN_PASSWORD`.

### GET /admin/stats

Get statistics about guest requests.

```bash
curl https://YOUR-WORKER-URL.workers.dev/admin/stats \
  -u "admin:YOUR-ADMIN-PASSWORD"
```

Response:
```json
{
  "success": true,
  "stats": {
    "total": 10,
    "pending": 3,
    "sent": 5,
    "acknowledged": 2
  }
}
```

### GET /admin/hotels

List all hotels.

```bash
curl https://YOUR-WORKER-URL.workers.dev/admin/hotels \
  -u "admin:YOUR-ADMIN-PASSWORD"
```

Response:
```json
{
  "success": true,
  "count": 4,
  "hotels": [
    {
      "id": 1,
      "hotel_code": "GHA001",
      "hotel_name": "Grand Hotel Alpen",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    },
    ...
  ]
}
```

### GET /admin/requests

List guest requests with optional filters.

```bash
# Get all requests
curl https://YOUR-WORKER-URL.workers.dev/admin/requests \
  -u "admin:YOUR-ADMIN-PASSWORD"

# Filter by hotel
curl "https://YOUR-WORKER-URL.workers.dev/admin/requests?hotel_code=GHA001" \
  -u "admin:YOUR-ADMIN-PASSWORD"

# Filter by status
curl "https://YOUR-WORKER-URL.workers.dev/admin/requests?status=pending" \
  -u "admin:YOUR-ADMIN-PASSWORD"

# Combined filters
curl "https://YOUR-WORKER-URL.workers.dev/admin/requests?hotel_code=GHA001&status=pending" \
  -u "admin:YOUR-ADMIN-PASSWORD"
```

Response:
```json
{
  "success": true,
  "count": 2,
  "requests": [
    {
      "id": 1,
      "request_id": "REQ-1234567890",
      "hotel_code": "GHA001",
      "check_in_date": "2024-12-20",
      "check_out_date": "2024-12-27",
      "adult_count": 2,
      "children_count": 1,
      "status": "pending",
      ...
    },
    ...
  ]
}
```

---

## 🔄 Database Management Commands

```bash
# Local Development
npm run db:migrate:local      # Run migrations locally
npm run db:import:local        # Import data locally
npm run db:list:local          # List hotels locally
npm run db:reset:local         # Reset local database

# Production (Remote)
npm run db:migrate:remote      # Run migrations on production
npm run db:import:remote       # Import data to production
npm run db:list:remote         # List hotels on production
npm run db:count:remote        # Count hotels on production

# Development Server
npm run dev                    # Start local development server

# Deployment
npm run deploy                 # Deploy to production
```

---

## 🔐 Security Best Practices

1. **Strong Passwords**: Always use `openssl rand -base64 32` to generate passwords
2. **Store Credentials Securely**: Use a password manager
3. **Never Commit Secrets**: `.dev.vars` is in `.gitignore`
4. **Share Credentials Securely**: Use encrypted channels, not email
5. **Separate Credentials**: ASA and Admin have different credentials for isolation
6. **Monitor Logs**: Check worker logs in Cloudflare dashboard

---

## 📊 Monitoring & Logs

### View Logs in Cloudflare Dashboard

1. Go to https://dash.cloudflare.com/
2. Select your account
3. Navigate to **Workers & Pages**
4. Click on **hotel-booking-worker**
5. Click on **Logs** tab

### View Real-Time Logs (CLI)

```bash
npx wrangler tail
```

---

## 🛠️ Troubleshooting

### Issue: "Authentication error" when creating D1 database

**Solution**: Update wrangler and re-authenticate
```bash
npm install --save-dev wrangler@latest
npx wrangler logout
npx wrangler login
```

### Issue: "workers.dev subdomain registration failed"

**Solution**: Try a different subdomain name or register it manually in the Cloudflare dashboard.

### Issue: Admin/ASA authentication not working

**Solution**: Verify secrets are set correctly
```bash
# List all secrets (won't show values)
npx wrangler secret list
```

Re-set the secret if needed:
```bash
npx wrangler secret put ADMIN_PASSWORD
```

### Issue: Database is empty after migration

**Solution**: Run import command
```bash
npm run db:import:remote
npm run db:list:remote
```

---

## 📚 Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [D1 Database Documentation](https://developers.cloudflare.com/d1/)
- [AlpineBits Specification](https://www.alpinebits.org/)
- [Hono Framework Documentation](https://hono.dev/)

---

## 🎉 Summary

You now have:
- ✅ Worker deployed with separate ASA and Admin credentials
- ✅ D1 database with hotels and request tables
- ✅ Admin endpoints for viewing stats, hotels, and requests
- ✅ AlpineBits endpoint ready for ASA integration
- ✅ Secure authentication for both user types

**Next Steps:**
1. Share ASA credentials with ASA team
2. Test a real booking submission from your Webflow form
3. Build admin dashboard using the `/admin/*` endpoints
