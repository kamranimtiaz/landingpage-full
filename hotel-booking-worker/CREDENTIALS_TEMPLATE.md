# Hotel Booking Worker - Credentials Reference

> **⚠️ IMPORTANT**: Fill this out after deployment and store securely. Do NOT commit this file to git!

## 🏢 Deployment Information

- **Worker URL**: `https://_____________________.workers.dev`
- **Cloudflare Account**: `_____________________________________`
- **Deployed Date**: `_____________________`

---

## 👤 ASA User Credentials (for AlpineBits Integration)

**Purpose**: Used by ASA system to poll for guest requests via AlpineBits protocol

- **Endpoint**: `https://_____________________.workers.dev/alpinebits`
- **Username**: `_____________________`
- **Password**: `_____________________`
- **Protocol**: HTTP Basic Auth
- **AlpineBits Version**: 2024-10

### Required Headers:
```
Authorization: Basic [base64(username:password)]
X-AlpineBits-ClientProtocolVersion: 2024-10
Content-Type: multipart/form-data
```

### Actions Supported:
- `OTA_Ping:Handshaking` - Capability negotiation
- `OTA_Read:GuestRequests` - Poll for new requests
- `OTA_NotifReport:GuestRequests` - Acknowledge requests

---

## 👨‍💼 Admin User Credentials (for Dashboard/Management)

**Purpose**: Used by you to access admin endpoints and future dashboard

- **Endpoints**: `https://_____________________.workers.dev/admin/*`
- **Username**: `_____________________`
- **Password**: `_____________________`
- **Protocol**: HTTP Basic Auth

### Available Admin Endpoints:
- `GET /admin/stats` - View statistics
- `GET /admin/hotels` - List all hotels
- `GET /admin/requests` - List guest requests (with filters)

---

## 🗄️ Database Information

- **D1 Database Name**: `hotel-booking-db`
- **Database ID**: `_____________________`
- **KV Namespace ID**: `_____________________`

---

## 🔐 Security Notes

1. ✅ ASA credentials are separate from Admin credentials
2. ✅ Passwords generated with: `openssl rand -base64 32`
3. ✅ Store this file in password manager, not in code repository
4. ✅ Share credentials via secure channel only (no email/Slack)
5. ✅ Never commit this file to git (it's in .gitignore)

---

## 📝 Sharing ASA Credentials

When ready to onboard ASA, send them:

```
Subject: AlpineBits Integration Credentials

Hi ASA Team,

Here are the credentials for accessing our AlpineBits endpoint:

Endpoint URL: https://_____________________.workers.dev/alpinebits
Username: _____________________
Password: _____________________

Required Headers:
- Authorization: Basic [base64 encoded username:password]
- X-AlpineBits-ClientProtocolVersion: 2024-10
- Content-Type: multipart/form-data

Supported AlpineBits Version: 2024-10
Supported Actions:
- OTA_Ping:Handshaking
- OTA_Read:GuestRequests
- OTA_NotifReport:GuestRequests

Please test with OTA_Ping first to verify the connection.

Best regards
```

---

## 🔄 How to Update Credentials

### Update ASA Password:
```bash
npx wrangler secret put ALPINEBITS_PASSWORD
# Enter new password when prompted
```

### Update Admin Password:
```bash
npx wrangler secret put ADMIN_PASSWORD
# Enter new password when prompted
```

---

## 🆘 Emergency Contact

If credentials are compromised:
1. Immediately update using wrangler secret commands above
2. Notify ASA team of the new credentials
3. Check worker logs for suspicious activity
4. Consider rotating both credentials as a precaution

---

**Last Updated**: `_____________________`
**Updated By**: `_____________________`
