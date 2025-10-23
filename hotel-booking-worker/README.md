# Hotel Booking Worker - Cloudflare Workers API

A scalable Cloudflare Workers-based system that collects guest requests from Webflow landing pages and exposes them to ASA's HMS system via AlpineBits protocol (Pull Method).

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono.js (lightweight, fast web framework)
- **Package Manager**: pnpm
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare KV (for caching)
- **Language**: TypeScript
- **Deployment**: Wrangler CLI

## Architecture

```
Webflow Landing Pages (50+ hotels)
           ↓ POST /submit/{hotel-id}
    Cloudflare Worker (Hono API)
           ↓ Store data
      D1 Database (Guest Requests)
           ↑ POST /alpinebits (ASA polls every 5-10 min)
        ASA System
           ↓ Process & Map
    Hotel's HMS System (via ASA partner)
```

## Setup

### 1. Install Dependencies

```bash
cd hotel-booking-worker
pnpm install
```

### 2. Configure Wrangler

Update `wrangler.toml` with your Cloudflare account details:

```toml
# Create D1 database
wrangler d1 create hotel-booking-db

# Create KV namespace
wrangler kv:namespace create CACHE

# Update wrangler.toml with the IDs returned from above commands
```

### 3. Run Database Migrations

```bash
# For local development
pnpm run db:migrate:local

# For production
pnpm run db:migrate
```

### 4. Add Hotels to Database

Update the hotel data in `migrations/0001_initial.sql` with your 50+ hotels:

```sql
INSERT INTO hotels (hotel_code, hotel_name) VALUES
  ('GHA001', 'Grand Hotel Alpen'),
  ('MVR002', 'Mountain View Resort'),
  -- Add your hotels here
```

**Note:** `hotel_code` is used both in URLs (`/submit/{hotel-code}`) and for AlpineBits integration.

### 5. Development

```bash
# Start local development server
pnpm run dev

# Visit http://localhost:8787
```

### 6. Deployment

```bash
# Deploy to Cloudflare Workers
pnpm run deploy
```

## API Endpoints

### 1. Form Submission Endpoint

**Endpoint**: `POST /submit/{hotel-id}`

**Purpose**: Receive and store guest requests from Webflow landing pages

**Request Example**:
```json
{
  "Sprache": "de",
  "period": "2025-10-05 - 2025-10-24",
  "Erwachsene": "3 Erwachsene",
  "Kinder": "3 Kinder",
  "Alter-Kind-1": "10 Jahre",
  "Alter-Kind-2": "3 Jahre",
  "Alter-Kind-3": "12 Jahre",
  "selected-room": "Deluxe Suite",
  "Anrede": "Herr",
  "Vorname": "Kamran",
  "Nachname": "Imtiaz",
  "Telefonnummer": "017669876485",
  "E-Mail-Adresse": "kamran@example.com",
  "Anmerkung": "Late check-in please"
}
```

**Response**:
```json
{
  "success": true,
  "requestId": "GR_1234567890_hotel-1_abc123",
  "message": "Request received successfully"
}
```

### 2. AlpineBits Pull Endpoint

**Endpoint**: `POST /alpinebits`

**Purpose**: ASA polls this endpoint every 5-10 minutes to retrieve pending guest requests

**Request**: AlpineBits OTA_ReadRQ XML with HotelCode

**Response**: AlpineBits OTA_ResRetrieveRS XML with unacknowledged guest requests

**Important**: Requests keep appearing in every poll until ASA acknowledges them!

### 3. Health Check

**Endpoint**: `GET /health`

**Response**:
```json
{
  "status": "ok"
}
```

## Webflow Integration

Update your Webflow form submission script to point to the Worker:

```javascript
// In your Webflow landing page
const response = await fetch('https://your-worker.workers.dev/submit/hotel-1', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(formData)
});

const result = await response.json();
if (result.success) {
  console.log('Request ID:', result.requestId);
}
```

## Data Flow

1. **Guest submits form** on Webflow landing page
2. **Webflow posts** to `/submit/{hotel-id}`
3. **Worker validates** and transforms data
4. **Worker stores** request in D1 with status='pending'
5. **ASA polls** `/alpinebits` every 5-10 minutes
6. **Worker returns** all unacknowledged requests (pending + sent)
7. **Worker marks** pending requests as 'sent'
8. **ASA acknowledges** via OTA_NotifReportRQ
9. **Worker marks** requests as 'acknowledged'
10. **Acknowledged requests** no longer appear in polls

## Data Transformations

The system automatically transforms Webflow form data to AlpineBits format:

| Input (Webflow) | Output (AlpineBits) |
|----------------|---------------------|
| `"2025-10-05 - 2025-10-24"` | `Start="2025-10-05" End="2025-10-24"` |
| `"3 Erwachsene"` | `Adult count=3` |
| `"3 Kinder"` | `Children count=3` |
| `"10 Jahre"` | `Age="10"` |
| `"Herr"` | `Gender="Male"` |
| `"Frau"` | `Gender="Female"` |
| `"017669876485"` | `PhoneNumber="+49017669876485"` |

## Project Structure

```
hotel-booking-worker/
├── src/
│   ├── index.ts              # Main Hono app
│   ├── types/
│   │   └── index.ts          # TypeScript types
│   ├── routes/
│   │   ├── submit.ts         # Form submission handler
│   │   └── alpinebits.ts     # AlpineBits handler
│   ├── services/
│   │   ├── database.ts       # D1 database operations
│   │   └── alpinebits.ts     # XML generation/parsing
│   └── utils/
│       ├── validators.ts     # Input validation
│       └── transformers.ts   # Data transformation
├── migrations/
│   └── 0001_initial.sql      # Database schema
├── package.json
├── wrangler.toml
└── tsconfig.json
```

## Monitoring & Logs

View logs in Cloudflare dashboard or via CLI:

```bash
wrangler tail
```

## Troubleshooting

### Database Issues
```bash
# Check database locally
wrangler d1 execute hotel-booking-db --local --command "SELECT * FROM hotels"
```

### CORS Issues
Update the CORS configuration in `src/index.ts` to allow your Webflow domains.

### Request Not Appearing in AlpineBits
- Check if hotel exists in database
- Verify request status is 'pending' or 'sent'
- Ensure HotelCode matches in ASA request

## License

MIT
