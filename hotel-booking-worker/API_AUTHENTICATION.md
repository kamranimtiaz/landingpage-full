# AlpineBits Authentication Guide

## Overview

The AlpineBits endpoint (`/alpinebits`) is now protected with **HTTP Basic Access Authentication** as required by the AlpineBits HotelData specification. This ensures only authorized systems (like ASA) can access guest request data.

## Authentication Requirements

### Required Headers

1. **Authorization** (mandatory): HTTP Basic Auth credentials
   ```
   Authorization: Basic [base64-encoded-credentials]
   ```

2. **X-AlpineBits-ClientProtocolVersion** (mandatory): Protocol version supported by the client
   ```
   X-AlpineBits-ClientProtocolVersion: 2022-10
   ```

3. **X-AlpineBits-ClientID** (optional): Client software version or installation ID
   ```
   X-AlpineBits-ClientID: MyClient/1.0
   ```

4. **Content-Type** (mandatory): Must be `multipart/form-data`

### HTTP Basic Authentication

The authentication credentials (username and password) must be encoded in base64 format. The credentials are the username and password separated by a colon.

**Example**:
- Username: `myuser`
- Password: `mypassword`
- Combined: `myuser:mypassword`
- Base64 encoded: `bXl1c2VyOm15cGFzc3dvcmQ=`
- Header: `Authorization: Basic bXl1c2VyOm15cGFzc3dvcmQ=`

### Request Format

All requests must use `multipart/form-data` encoding with:
- **action** (required): The action type
  - `OTA_Read:GuestRequests` - Poll for guest requests
  - `OTA_NotifReport:GuestRequests` - Acknowledge received requests
- **request** (required for most actions): The XML request body

## Setup Instructions

### 1. Set Authentication Credentials (Production)

```bash
cd hotel-booking-worker

# Set username
wrangler secret put ALPINEBITS_USERNAME

# Set password
wrangler secret put ALPINEBITS_PASSWORD

# Optional: Require Client ID header
wrangler secret put ALPINEBITS_REQUIRE_CLIENT_ID
# Enter: true or false
```

Generate a secure password:
```bash
# Generate a secure random password (on Mac/Linux)
openssl rand -base64 32
```

### 2. Set Credentials (Local Development)

Create a `.dev.vars` file:

```bash
cd hotel-booking-worker
cat > .dev.vars << EOF
ALPINEBITS_USERNAME=testuser
ALPINEBITS_PASSWORD=testpassword
ALPINEBITS_REQUIRE_CLIENT_ID=false
EOF
```

**Note**: The `.dev.vars` file should NOT be committed to git (it's already in `.gitignore`).

### 3. Share Credentials with ASA

Securely share the credentials with the ASA system administrator:
- **Never** share credentials via email or insecure channels
- Use: Password manager, encrypted messaging, or secure file transfer

## Error Responses

All errors are returned with `Content-Type: text/plain` and prefixed with `ERROR:`

| Status | Error Message | Cause |
|--------|--------------|-------|
| 401 | `ERROR:invalid or missing username/password` | Missing or invalid Basic Auth credentials |
| 400 | `ERROR:missing X-AlpineBits-ClientProtocolVersion header` | Required header missing |
| 400 | `ERROR:no valid client id provided` | Client ID required but missing |
| 400 | `ERROR:invalid content type, multipart/form-data required` | Wrong Content-Type |
| 400 | `ERROR:missing or invalid action parameter` | Missing action in form data |

## Testing the Endpoint

### 1. Test Authentication (Read Request)

```bash
# Generate base64 credentials
echo -n "testuser:testpassword" | base64
# Output: dGVzdHVzZXI6dGVzdHBhc3N3b3Jk

# Create test XML request
cat > read_request.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<OTA_ReadRQ xmlns="http://www.opentravel.org/OTA/2003/05"
            TimeStamp="2025-10-10T12:00:00Z"
            Version="1.0">
  <HotelCode>Template Hotel</HotelCode>
</OTA_ReadRQ>
EOF

# Make request
curl -X POST http://localhost:8787/alpinebits \
  -H "Authorization: Basic dGVzdHVzZXI6dGVzdHBhc3N3b3Jk" \
  -H "X-AlpineBits-ClientProtocolVersion: 2022-10" \
  -H "X-AlpineBits-ClientID: TestClient/1.0" \
  -F "action=OTA_Read:GuestRequests" \
  -F "request=<read_request.xml"
```

### 2. Test Without Authentication (Should Fail)

```bash
curl -X POST http://localhost:8787/alpinebits \
  -H "X-AlpineBits-ClientProtocolVersion: 2022-10" \
  -F "action=OTA_Read:GuestRequests" \
  -F "request=<read_request.xml"
```

**Expected Response** (401 Unauthorized):
```
ERROR:invalid or missing username/password
```

### 3. Test Missing Protocol Version (Should Fail)

```bash
curl -X POST http://localhost:8787/alpinebits \
  -H "Authorization: Basic dGVzdHVzZXI6dGVzdHBhc3N3b3Jk" \
  -F "action=OTA_Read:GuestRequests" \
  -F "request=<read_request.xml"
```

**Expected Response** (400 Bad Request):
```
ERROR:missing X-AlpineBits-ClientProtocolVersion header
```

### 4. Test Acknowledge Request

```bash
cat > acknowledge_request.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<OTA_NotifReportRQ xmlns="http://www.opentravel.org/OTA/2003/05"
                   TimeStamp="2025-10-10T12:00:00Z"
                   Version="1.0">
  <RequestID>REQ-001</RequestID>
  <RequestID>REQ-002</RequestID>
</OTA_NotifReportRQ>
EOF

curl -X POST http://localhost:8787/alpinebits \
  -H "Authorization: Basic dGVzdHVzZXI6dGVzdHBhc3N3b3Jk" \
  -H "X-AlpineBits-ClientProtocolVersion: 2022-10" \
  -F "action=OTA_NotifReport:GuestRequests" \
  -F "request=<acknowledge_request.xml"
```

## Testing with Postman

1. **Create a new POST request**:
   - URL: `http://localhost:8787/alpinebits`
   - Method: POST

2. **Add Authorization**:
   - Type: Basic Auth
   - Username: `testuser`
   - Password: `testpassword`

3. **Add Headers**:
   - `X-AlpineBits-ClientProtocolVersion`: `2022-10`
   - `X-AlpineBits-ClientID`: `TestClient/1.0` (optional)

4. **Add Body** (form-data):
   - Key: `action`, Value: `OTA_Read:GuestRequests`
   - Key: `request`, Value: (paste XML)

5. **Send the request** and verify response

## Security Best Practices

1. **Use Strong Credentials**: Generate passwords using cryptographically secure random generators
2. **Keep Credentials Secret**: Never commit credentials to git or share them publicly
3. **Rotate Credentials Regularly**: Change username/password periodically
4. **Use HTTPS in Production**: HTTPS is mandatory for AlpineBits (prevents credential interception)
5. **Monitor Usage**: Check Cloudflare logs for suspicious authentication attempts

## Implementation Status

✅ **Compliant with AlpineBits Specification:**
- HTTP Basic Access Authentication with base64 encoding
- X-AlpineBits-ClientProtocolVersion header validation (mandatory)
- X-AlpineBits-ClientID header validation (optional, configurable)
- Error responses in text/plain format with `ERROR:` prefix
- Multipart/form-data request parsing
- Action parameter validation
- HTTPS enforcement (via Cloudflare Workers)

## Endpoints Overview

| Endpoint | Authentication | Purpose |
|----------|---------------|---------|
| `GET /` | None | Health check |
| `GET /health` | None | Health check |
| `POST /submit/:hotelId` | None | Accept guest requests from Webflow forms |
| `POST /alpinebits` | **HTTP Basic Auth + AlpineBits Headers** | AlpineBits endpoint for ASA |

## Troubleshooting

### "ERROR:invalid or missing username/password"

**Solution**: Check that credentials are set correctly:
- Production: `wrangler secret list` (should show ALPINEBITS_USERNAME and ALPINEBITS_PASSWORD)
- Local dev: Check `.dev.vars` file exists with correct values
- Verify base64 encoding is correct

### "ERROR:missing X-AlpineBits-ClientProtocolVersion header"

**Solution**: Ensure the `X-AlpineBits-ClientProtocolVersion` header is included in every request

### Authentication works locally but not in production

**Solution**: Verify secrets are set in Cloudflare:
```bash
wrangler secret list
```

### How to update credentials?

**Solution**:
```bash
wrangler secret put ALPINEBITS_USERNAME
wrangler secret put ALPINEBITS_PASSWORD
```

## Quick Start for ASA Integration

1. **Set credentials in production**:
   ```bash
   wrangler secret put ALPINEBITS_USERNAME
   wrangler secret put ALPINEBITS_PASSWORD
   ```

2. **Share credentials securely** with ASA team

3. **ASA must include in all requests**:
   - `Authorization: Basic [base64(username:password)]`
   - `X-AlpineBits-ClientProtocolVersion: 2022-10`
   - `Content-Type: multipart/form-data`
   - Form fields: `action` and `request`

4. **Test integration** using the curl examples above

5. **Verify HTTPS** is used in production (automatic with Cloudflare Workers)
