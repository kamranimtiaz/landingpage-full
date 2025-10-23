#!/bin/bash

# Test Requests Script
# Automated testing for hotel booking API endpoints

# Configuration
WORKER_URL="${WORKER_URL:-http://localhost:8787}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
print_test() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}TEST: $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
  echo -e "${GREEN}✓ PASS${NC}: $1"
  ((TESTS_PASSED++))
}

print_fail() {
  echo -e "${RED}✗ FAIL${NC}: $1"
  ((TESTS_FAILED++))
}

print_info() {
  echo -e "${YELLOW}ℹ${NC} $1"
}

# Start
echo "======================================"
echo "Hotel Booking API Test Suite"
echo "======================================"
echo "Worker URL: $WORKER_URL"
echo ""

# Test 1: Health Check
print_test "Health Check Endpoint"
RESPONSE=$(curl -s -w "\n%{http_code}" "$WORKER_URL/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response: $BODY"

if [ "$HTTP_CODE" -eq 200 ]; then
  print_success "Health check returned 200"
else
  print_fail "Health check returned $HTTP_CODE (expected 200)"
fi

# Test 2: Valid Form Submission
print_test "Valid Form Submission (hotel-1)"
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

echo "Response: $BODY"

if [ "$HTTP_CODE" -eq 201 ]; then
  REQUEST_ID=$(echo "$BODY" | grep -o '"requestId":"[^"]*"' | cut -d'"' -f4)
  print_success "Valid submission returned 201 Created"
  print_info "Request ID: $REQUEST_ID"
else
  print_fail "Valid submission returned $HTTP_CODE (expected 201)"
fi

# Test 3: Invalid Hotel ID
print_test "Invalid Hotel ID (hotel-999)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WORKER_URL/submit/hotel-999" \
  -H "Content-Type: application/json" \
  -d '{
    "Sprache": "de",
    "period": "2025-10-05 - 2025-10-24",
    "Erwachsene": "2 Erwachsene",
    "Anrede": "Herr",
    "Vorname": "Test",
    "Nachname": "User",
    "Telefonnummer": "017612345678",
    "E-Mail-Adresse": "test@example.com"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response: $BODY"

if [ "$HTTP_CODE" -eq 404 ]; then
  print_success "Invalid hotel ID returned 404"
else
  print_fail "Invalid hotel ID returned $HTTP_CODE (expected 404)"
fi

# Test 4: Missing Required Fields
print_test "Missing Required Fields (no email)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WORKER_URL/submit/hotel-1" \
  -H "Content-Type: application/json" \
  -d '{
    "period": "2025-10-05 - 2025-10-24",
    "Erwachsene": "2 Erwachsene",
    "Anrede": "Herr",
    "Vorname": "Test",
    "Nachname": "User",
    "Telefonnummer": "017612345678"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response: $BODY"

if [ "$HTTP_CODE" -eq 400 ]; then
  print_success "Missing required fields returned 400"
else
  print_fail "Missing required fields returned $HTTP_CODE (expected 400)"
fi

# Test 5: Invalid Date Format
print_test "Invalid Date Format"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WORKER_URL/submit/hotel-1" \
  -H "Content-Type: application/json" \
  -d '{
    "Sprache": "de",
    "period": "2025/10/05 to 2025/10/24",
    "Erwachsene": "2 Erwachsene",
    "Anrede": "Herr",
    "Vorname": "Test",
    "Nachname": "User",
    "Telefonnummer": "017612345678",
    "E-Mail-Adresse": "test@example.com"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response: $BODY"

if [ "$HTTP_CODE" -eq 400 ]; then
  print_success "Invalid date format returned 400"
else
  print_fail "Invalid date format returned $HTTP_CODE (expected 400)"
fi

# Test 6: Form with Children
print_test "Form with Multiple Children"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WORKER_URL/submit/hotel-1" \
  -H "Content-Type: application/json" \
  -d '{
    "Sprache": "de",
    "period": "2025-12-20 - 2025-12-27",
    "Erwachsene": "2 Erwachsene",
    "Kinder": "3 Kinder",
    "Alter-Kind-1": "10 Jahre",
    "Alter-Kind-2": "7 Jahre",
    "Alter-Kind-3": "12 Jahre",
    "selected-room": "Family Room",
    "Anrede": "Frau",
    "Vorname": "Maria",
    "Nachname": "Schmidt",
    "Telefonnummer": "017698765432",
    "E-Mail-Adresse": "maria.schmidt@example.com",
    "Anmerkung": "Family vacation, need crib"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response: $BODY"

if [ "$HTTP_CODE" -eq 201 ]; then
  print_success "Form with children returned 201"
else
  print_fail "Form with children returned $HTTP_CODE (expected 201)"
fi

# Test 7: Different Hotel
print_test "Different Hotel ID (hotel-2)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WORKER_URL/submit/hotel-2" \
  -H "Content-Type: application/json" \
  -d '{
    "Sprache": "en",
    "period": "2025-11-01 - 2025-11-05",
    "Erwachsene": "1 Erwachsener",
    "Anrede": "Herr",
    "Vorname": "John",
    "Nachname": "Doe",
    "Telefonnummer": "017611111111",
    "E-Mail-Adresse": "john.doe@example.com"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response: $BODY"

if [ "$HTTP_CODE" -eq 201 ]; then
  print_success "Different hotel (hotel-2) returned 201"
else
  print_fail "Different hotel returned $HTTP_CODE (expected 201)"
fi

# Test 8: Root Endpoint
print_test "Root Endpoint"
RESPONSE=$(curl -s -w "\n%{http_code}" "$WORKER_URL/")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response: $BODY"

if [ "$HTTP_CODE" -eq 200 ]; then
  print_success "Root endpoint returned 200"
else
  print_fail "Root endpoint returned $HTTP_CODE (expected 200)"
fi

# Test 9: 404 Endpoint
print_test "Non-existent Endpoint"
RESPONSE=$(curl -s -w "\n%{http_code}" "$WORKER_URL/nonexistent")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response: $BODY"

if [ "$HTTP_CODE" -eq 404 ]; then
  print_success "Non-existent endpoint returned 404"
else
  print_fail "Non-existent endpoint returned $HTTP_CODE (expected 404)"
fi

# Summary
echo ""
echo "======================================"
echo "Test Summary"
echo "======================================"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Check database: pnpm run db:list:local"
  echo "2. View requests: pnpm run db:query:local 'SELECT * FROM guest_requests ORDER BY created_at DESC LIMIT 5'"
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  echo ""
  echo "Troubleshooting:"
  echo "1. Is the Worker running? pnpm run dev"
  echo "2. Check Worker logs for errors"
  echo "3. Verify database setup: pnpm run db:migrate:local"
  exit 1
fi
