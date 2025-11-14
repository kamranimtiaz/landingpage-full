#!/bin/bash

# Test with EXACT ASA format (no newlines in XML, single quotes in attributes)

ENDPOINT="https://hotel-booking-worker.webflowxmemberstack.workers.dev/alpinebits"
USERNAME="admin"
PASSWORD="adminpass"

echo "Testing with EXACT ASA XML format (no newlines, single quotes)..."
echo ""

# Create XML exactly as ASA sends it (all on one line, single quotes)
cat > /tmp/asa_exact_ping.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?><OTA_PingRQ xmlns='http://www.opentravel.org/OTA/2003/05' Version='3.000' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xsi:schemaLocation='http://www.opentravel.org/OTA/2003/05 OTA_PingRQ.xsd'><EchoData>{"versions":[{"version":"2024-10","actions":[{"action":"action_OTA_Read"}]},{"version":"2022-10","actions":[{"action":"action_OTA_Ping"},{"action":"action_OTA_Read"}]}]}</EchoData></OTA_PingRQ>
EOF

curl -X POST "${ENDPOINT}" \
  -u "${USERNAME}:${PASSWORD}" \
  -H "Accept: text/xml, application/xml" \
  -H "X-AlpineBits-ClientProtocolVersion: 2024-10" \
  -H "X-AlpineBits-ClientID: ASA HOTEL 25.11 @" \
  -H "Accept-Language: de, it;q=0.9, en;q=0.8, *;q=0.5" \
  -H "User-Agent: Jetty/12.1.3" \
  -F "action=OTA_Ping:Handshaking" \
  -F "request=@/tmp/asa_exact_ping.xml;type=text/xml;charset=utf-8" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -v

rm -f /tmp/asa_exact_ping.xml

echo ""
echo "If this returns 200 OK, then ASA's format is fine and they need to:"
echo "1. Check their credentials"
echo "2. Re-test with the latest deployed version"
echo ""
