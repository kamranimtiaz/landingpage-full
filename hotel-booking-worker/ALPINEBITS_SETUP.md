# AlpineBits Integration Setup Guide for ASA Hotel Software

## ✅ Integration Status

Your AlpineBits endpoint is **WORKING CORRECTLY**. Local tests confirm both handshaking and data retrieval are functioning properly.

## Connection Details

**Endpoint URL:**
```
https://hotel-booking-worker.webflowxmemberstack.workers.dev/alpinebits
```

**Authentication:**
- Method: HTTP Basic Authentication
- Username: `admin`
- Password: `adminpass`
- ⚠️ **These are the PRODUCTION credentials that ASA must use**

**Required Headers:**
- `Authorization: Basic <base64-encoded-credentials>`
- `X-AlpineBits-ClientProtocolVersion`: `2024-10` (or `2022-10`, `2020-10`, `2018-10`)
- `X-AlpineBits-ClientID`: Any string (e.g., `ASA HOTEL 25.11`)
- `Content-Type`: `multipart/form-data`
- `Accept`: `text/xml, application/xml`

## Supported AlpineBits Actions

### ✅ Implemented and Working

1. **OTA_Ping:Handshaking** (Capability Negotiation)
   - Action: `OTA_Ping:Handshaking`
   - Purpose: Protocol version negotiation
   - Supported Versions: 2024-10, 2022-10, 2020-10, 2018-10

2. **OTA_Read:GuestRequests** (Pull Guest Requests)
   - Action: `OTA_Read:GuestRequests` or `action_OTA_Read`
   - Purpose: Retrieve pending booking requests
   - Returns: List of guest reservations in OTA_ResRetrieveRS format

3. **OTA_NotifReport:GuestRequests** (Acknowledge Requests)
   - Action: `OTA_NotifReport:GuestRequests` or `action_OTA_NotifReport`
   - Purpose: Acknowledge received requests
   - Returns: Confirmation in OTA_NotifReportRS format

### Supported Capabilities (Version 2024-10)

```json
{
  "versions": [
    {
      "version": "2024-10",
      "actions": [
        {
          "action": "action_OTA_Read"
        },
        {
          "action": "action_OTA_NotifReport"
        }
      ]
    }
  ]
}
```

## Testing Your Connection

### Using cURL (from this repository):

```bash
cd hotel-booking-worker
chmod +x test-alpinebits.sh
./test-alpinebits.sh
```

### Manual Test:

```bash
curl -X POST https://hotel-booking-worker.webflowxmemberstack.workers.dev/alpinebits \
  -u "admin:adminpass" \
  -H "X-AlpineBits-ClientProtocolVersion: 2024-10" \
  -H "X-AlpineBits-ClientID: Test Client" \
  -H "Accept: text/xml, application/xml" \
  -F "action=OTA_Ping:Handshaking" \
  -F "request=@ping_request.xml;type=text/xml;charset=utf-8"
```

## Common Issues and Solutions

### Issue 1: "ERROR:invalid OTA_PingRQ format or missing EchoData"

**Cause:** The XML request was not properly received or parsed.

**Solutions:**
- ✅ **FIXED**: The multipart form data parsing has been updated to handle File objects
- Ensure the `request` field is sent as a file attachment with `type=text/xml`
- Verify the XML contains a valid `<EchoData>` element with JSON capabilities

### Issue 2: "401 Unauthorized" or "ERROR:invalid or missing username/password"

**Cause:** Wrong credentials or missing Authorization header.

**Solutions:**
- Use credentials: `admin` / `adminpass`
- Ensure Basic Auth header is properly encoded
- Format: `Authorization: Basic <base64(username:password)>`

### Issue 3: "400 Bad Request" - Missing X-AlpineBits-ClientProtocolVersion

**Cause:** Required header is missing.

**Solution:**
- Add header: `X-AlpineBits-ClientProtocolVersion: 2024-10`

### Issue 4: "404 Not Found" on hotel code

**Cause:** Hotel code doesn't exist in database.

**Solution:**
- Use hotel code: `TEMP001` (Template Hotel)
- Or add your hotel to the database using the migration scripts

## Database Schema

### Hotels Table

```sql
CREATE TABLE hotels (
  id INTEGER PRIMARY KEY,
  hotel_code TEXT UNIQUE NOT NULL,
  hotel_name TEXT NOT NULL,
  created_at DATETIME,
  updated_at DATETIME
);
```

**Current Hotels:**
- `TEMP001` - Hotel Template

### Guest Requests Table

```sql
CREATE TABLE guest_requests (
  id INTEGER PRIMARY KEY,
  request_id TEXT UNIQUE NOT NULL,
  hotel_code TEXT NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  adult_count INTEGER NOT NULL,
  children_count INTEGER DEFAULT 0,
  child_ages TEXT,
  selected_room TEXT,
  selected_room_code TEXT,
  selected_room_name TEXT,
  selected_offer TEXT,
  selected_offer_code TEXT,
  selected_offer_name TEXT,
  gender TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  language TEXT DEFAULT 'de',
  comments TEXT,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME,
  acknowledged_at DATETIME
);
```

## AlpineBits Protocol Flow

### 1. Handshaking (First Connection)

```
ASA → POST /alpinebits
  action: OTA_Ping:Handshaking
  request: <OTA_PingRQ with client capabilities>

Server → 200 OK
  <OTA_PingRS with capability intersection>
```

### 2. Polling for Requests (Periodic)

```
ASA → POST /alpinebits
  action: OTA_Read:GuestRequests
  request: <OTA_ReadRQ with HotelCode>

Server → 200 OK
  <OTA_ResRetrieveRS with list of reservations>
```

### 3. Acknowledging Requests

```
ASA → POST /alpinebits
  action: OTA_NotifReport:GuestRequests
  request: <OTA_NotifReportRQ with request IDs>

Server → 200 OK
  <OTA_NotifReportRS with confirmation>
```

## Debugging

### Enable Verbose Logging

The worker currently has debug logging enabled. To view logs:

```bash
npx wrangler tail
```

Or view in Cloudflare Dashboard:
- Workers & Pages → hotel-booking-worker → Logs

### Check Current Requests

You can view pending requests in the D1 database:

```bash
npx wrangler d1 execute hotel-booking-db --remote \
  --command "SELECT * FROM guest_requests WHERE status = 'pending' ORDER BY created_at DESC;"
```

## Contact & Support

If ASA continues to experience issues:

1. **Verify they are using the correct credentials:** `admin` / `adminpass`
2. **Check their logs** for the exact error message
3. **Compare their request** with the working test script in this repository
4. **Run the test script** and share results: `./test-alpinebits.sh`

---

## What's Different Between Working Test and ASA Request?

The test script (`test-alpinebits.sh`) successfully connects using:
- Same endpoint URL
- Same credentials (`admin` / `adminpass`)
- Same multipart form-data format
- Same XML structure

**If ASA is still getting 400 errors, they likely have:**
- Wrong credentials configured
- Missing required headers
- Different XML format (though unlikely)

**Action Required from ASA:**
Double-check their configuration matches the credentials and format shown in this document.
