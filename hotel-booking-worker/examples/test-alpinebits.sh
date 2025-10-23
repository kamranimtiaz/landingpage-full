#!/bin/bash

# AlpineBits Testing Script
# This script helps you test the AlpineBits endpoints locally or in production

# Configuration
WORKER_URL="${WORKER_URL:-http://localhost:8787}"
HOTEL_CODE="${HOTEL_CODE:-GHA001}"

echo "======================================"
echo "AlpineBits API Testing Script"
echo "======================================"
echo "Worker URL: $WORKER_URL"
echo "Hotel Code: $HOTEL_CODE"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_info() {
  echo -e "${YELLOW}ℹ $1${NC}"
}

# Test 1: Submit a test booking request
echo "Test 1: Submitting test booking request..."
echo "--------------------------------------"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WORKER_URL/submit/hotel-1" \
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
    "Anmerkung": "This is a test booking"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 201 ]; then
  print_success "Booking request submitted successfully"
  echo "$BODY" | jq '.'
  REQUEST_ID=$(echo "$BODY" | jq -r '.requestId')
  print_info "Request ID: $REQUEST_ID"
else
  print_error "Failed to submit booking (HTTP $HTTP_CODE)"
  echo "$BODY"
fi

echo ""

# Test 2: Poll for guest requests (OTA_ReadRQ)
echo "Test 2: Polling for guest requests (AlpineBits OTA_ReadRQ)..."
echo "--------------------------------------"

CURRENT_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

OTA_READ_REQUEST="<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<OTA_ReadRQ xmlns=\"http://www.opentravel.org/OTA/2003/05\"
            TimeStamp=\"$CURRENT_TIME\"
            Version=\"1.0\">
  <ReadRequests>
    <ReadRequest>
      <UniqueID Type=\"16\" ID=\"GuestRequests\"/>
      <SelectionCriteria>
        <Criterion>
          <HotelRef HotelCode=\"$HOTEL_CODE\"/>
        </Criterion>
      </SelectionCriteria>
    </ReadRequest>
  </ReadRequests>
</OTA_ReadRQ>"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WORKER_URL/alpinebits" \
  -H "Content-Type: application/xml" \
  -d "$OTA_READ_REQUEST")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  print_success "Successfully retrieved guest requests"
  echo "$BODY" | xmllint --format - 2>/dev/null || echo "$BODY"

  # Extract request IDs for acknowledgment
  REQUEST_IDS=$(echo "$BODY" | grep -oP 'UniqueID Type="14" ID="\K[^"]+' || true)

  if [ -n "$REQUEST_IDS" ]; then
    print_info "Found request IDs:"
    echo "$REQUEST_IDS" | while read -r id; do
      echo "  - $id"
    done
    FIRST_REQUEST_ID=$(echo "$REQUEST_IDS" | head -n1)
  else
    print_info "No pending requests found"
  fi
else
  print_error "Failed to retrieve requests (HTTP $HTTP_CODE)"
  echo "$BODY"
fi

echo ""

# Test 3: Acknowledge requests (OTA_NotifReportRQ)
if [ -n "$FIRST_REQUEST_ID" ]; then
  echo "Test 3: Acknowledging guest request (AlpineBits OTA_NotifReportRQ)..."
  echo "--------------------------------------"

  CURRENT_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  OTA_NOTIF_REQUEST="<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<OTA_NotifReportRQ xmlns=\"http://www.opentravel.org/OTA/2003/05\"
                   TimeStamp=\"$CURRENT_TIME\"
                   Version=\"1.0\">
  <NotifDetails>
    <HotelNotifReport>
      <HotelReservations>
        <HotelReservation>
          <UniqueID Type=\"14\" ID=\"$FIRST_REQUEST_ID\"/>
        </HotelReservation>
      </HotelReservations>
    </HotelNotifReport>
  </NotifDetails>
</OTA_NotifReportRQ>"

  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WORKER_URL/alpinebits" \
    -H "Content-Type: application/xml" \
    -d "$OTA_NOTIF_REQUEST")

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" -eq 200 ]; then
    print_success "Request acknowledged successfully"
    echo "$BODY" | xmllint --format - 2>/dev/null || echo "$BODY"
  else
    print_error "Failed to acknowledge request (HTTP $HTTP_CODE)"
    echo "$BODY"
  fi

  echo ""

  # Test 4: Verify request no longer appears
  echo "Test 4: Verifying request was acknowledged..."
  echo "--------------------------------------"

  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WORKER_URL/alpinebits" \
    -H "Content-Type: application/xml" \
    -d "$OTA_READ_REQUEST")

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" -eq 200 ]; then
    if echo "$BODY" | grep -q "$FIRST_REQUEST_ID"; then
      print_error "Request still appears in response (should be acknowledged)"
    else
      print_success "Request no longer appears (correctly acknowledged)"
    fi
  fi

  echo ""
fi

# Summary
echo "======================================"
echo "Test Summary"
echo "======================================"
print_info "All tests completed"
echo ""
echo "To test with production:"
echo "  WORKER_URL=https://your-worker.workers.dev ./test-alpinebits.sh"
echo ""
echo "To test with different hotel:"
echo "  HOTEL_CODE=MVR002 ./test-alpinebits.sh"
