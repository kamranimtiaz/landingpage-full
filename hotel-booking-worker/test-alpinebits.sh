#!/bin/bash

# AlpineBits Integration Test Script
# This simulates the exact requests that ASA Hotel software sends

# Configuration
WORKER_URL="https://hotel-booking-worker.webflowxmemberstack.workers.dev"
ENDPOINT="${WORKER_URL}/alpinebits"

# Your credentials (replace with actual values)
USERNAME="admin"
PASSWORD="adminpass"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "╔════════════════════════════════════════════════════════╗"
echo "║     AlpineBits Integration Test (cURL version)         ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Endpoint: ${ENDPOINT}"
echo "Username: ${USERNAME}"
echo ""

# Test 1: OTA_Ping Handshaking
echo "=== Test 1: OTA_Ping Handshaking ==="
echo ""

# Create temporary file with OTA_PingRQ XML
cat > /tmp/ota_ping.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<OTA_PingRQ xmlns='http://www.opentravel.org/OTA/2003/05' Version='3.000' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xsi:schemaLocation='http://www.opentravel.org/OTA/2003/05 OTA_PingRQ.xsd'>
<EchoData>{"versions":[{"version":"2024-10","actions":[{"action":"action_OTA_Read"}]},{"version":"2022-10","actions":[{"action":"action_OTA_Ping"},{"action":"action_OTA_Read"}]}]}</EchoData>
</OTA_PingRQ>
EOF

# Send request
curl -X POST "${ENDPOINT}" \
  -u "${USERNAME}:${PASSWORD}" \
  -H "Accept: text/xml, application/xml" \
  -H "X-AlpineBits-ClientProtocolVersion: 2024-10" \
  -H "X-AlpineBits-ClientID: Test Client" \
  -H "Accept-Language: de, it;q=0.9, en;q=0.8, *;q=0.5" \
  -F "action=OTA_Ping:Handshaking" \
  -F "request=@/tmp/ota_ping.xml;type=text/xml;charset=utf-8" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -v

PING_STATUS=$?

echo ""
echo "---"
echo ""

if [ $PING_STATUS -eq 0 ]; then
  echo -e "${GREEN}✅ OTA_Ping request completed${NC}"
else
  echo -e "${RED}❌ OTA_Ping request failed${NC}"
fi

echo ""
echo "=== Test 2: OTA_Read (Guest Requests) ==="
echo ""

# Create temporary file with OTA_ReadRQ XML
cat > /tmp/ota_read.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<OTA_ReadRQ xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.opentravel.org/OTA/2003/05" xsi:schemaLocation="http://www.opentravel.org/OTA/2003/05 OTA_ReadRQ.xsd" Version="3.14">
  <ReadRequests>
    <HotelReadRequest HotelCode="TEMP001" HotelName="Hotel Test" />
  </ReadRequests>
</OTA_ReadRQ>
EOF

# Send request
curl -X POST "${ENDPOINT}" \
  -u "${USERNAME}:${PASSWORD}" \
  -H "Accept: text/xml, application/xml" \
  -H "X-AlpineBits-ClientProtocolVersion: 2024-10" \
  -H "X-AlpineBits-ClientID: Test Client" \
  -F "action=OTA_Read:GuestRequests" \
  -F "request=@/tmp/ota_read.xml;type=text/xml;charset=utf-8" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -v

READ_STATUS=$?

echo ""
echo "---"
echo ""

if [ $READ_STATUS -eq 0 ]; then
  echo -e "${GREEN}✅ OTA_Read request completed${NC}"
else
  echo -e "${RED}❌ OTA_Read request failed${NC}"
fi

# Cleanup
rm -f /tmp/ota_ping.xml /tmp/ota_read.xml

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║                    Test Complete                       ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Check the responses above to see if handshaking worked correctly."
echo ""
