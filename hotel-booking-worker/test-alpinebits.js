/**
 * Test script to simulate ASA Hotel software AlpineBits requests
 * Run with: node test-alpinebits.js
 */

const FormData = require('form-data');
const fetch = require('node-fetch');

// Configuration
const WORKER_URL = 'https://hotel-booking-worker.webflowxmemberstack.workers.dev';
const ALPINEBITS_ENDPOINT = `${WORKER_URL}/alpinebits`;

// Your credentials (same as ASA uses)
const USERNAME = 'your-username'; // Replace with actual username
const PASSWORD = 'your-password'; // Replace with actual password

/**
 * Test OTA_Ping handshaking request (exactly as ASA sends it)
 */
async function testOtaPing() {
  console.log('\n=== Testing OTA_Ping:Handshaking ===\n');

  // This is the exact XML that ASA sends
  const otaPingXML = `<?xml version="1.0" encoding="UTF-8"?>
<OTA_PingRQ xmlns='http://www.opentravel.org/OTA/2003/05' Version='3.000' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xsi:schemaLocation='http://www.opentravel.org/OTA/2003/05 OTA_PingRQ.xsd'>
<EchoData>{"versions":[{"version":"2024-10","actions":[{"action":"action_OTA_HotelDescriptiveContentNotif_Inventory","supports":["OTA_HotelDescriptiveContentNotif_Inventory_use_rooms","OTA_HotelDescriptiveContentNotif_Inventory_occupancy_children"]},{"action":"action_OTA_HotelInvCountNotif","supports":["OTA_HotelInvCountNotif_accept_rooms","OTA_HotelInvCountNotif_accept_categories","OTA_HotelInvCountNotif_accept_complete_set","OTA_HotelInvCountNotif_accept_deltas","OTA_HotelInvCountNotif_accept_out_of_market","OTA_HotelInvCountNotif_accept_closing_seasons"]},{"action":"action_OTA_HotelRatePlanNotif_RatePlans","supports":["OTA_HotelRatePlanNotif_accept_RatePlan_BookingRule","OTA_HotelRatePlanNotif_accept_RatePlan_RoomType_BookingRule","OTA_HotelRatePlanNotif_accept_RatePlan_mixed_BookingRule","OTA_HotelRatePlanNotif_accept_ArrivalDOW","OTA_HotelRatePlanNotif_accept_DepartureDOW","OTA_HotelRatePlanNotif_accept_OfferRule_BookingOffset","OTA_HotelRatePlanNotif_accept_OfferRule_DOWLOS","OTA_HotelRatePlanNotif_accept_FreeNightsOffers","OTA_HotelRatePlanNotif_accept_FamilyOffers","OTA_HotelRatePlanNotif_accept_full","OTA_HotelRatePlanNotif_accept_overlay","OTA_HotelRatePlanNotif_accept_RatePlanJoin"]},{"action":"action_OTA_HotelRatePlan_BaseRates","supports":["OTA_HotelRatePlan_BaseRates_deltas"]},{"action":"action_OTA_Read"}]},{"version":"2022-10","actions":[{"action":"action_OTA_Ping"},{"action":"action_OTA_Read"}]}]}</EchoData>
</OTA_PingRQ>`;

  // Create FormData exactly as ASA does
  const formData = new FormData();
  formData.append('action', 'OTA_Ping:Handshaking');

  // Append as file with content-type (this is how ASA sends it)
  formData.append('request', Buffer.from(otaPingXML), {
    filename: 'request.xml',
    contentType: 'text/xml; charset=utf-8'
  });

  // Prepare Basic Auth
  const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

  try {
    const response = await fetch(ALPINEBITS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'text/xml, application/xml',
        'X-AlpineBits-ClientProtocolVersion': '2024-10',
        'X-AlpineBits-ClientID': 'Test Client',
        'Accept-Language': 'de, it;q=0.9, en;q=0.8, *;q=0.5',
        'User-Agent': 'Test/1.0',
        ...formData.getHeaders()
      },
      body: formData
    });

    console.log('Response Status:', response.status, response.statusText);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('\n--- Response Body ---');
    console.log(responseText);
    console.log('--- End Response ---\n');

    if (response.ok) {
      console.log('✅ OTA_Ping SUCCESS');
      return true;
    } else {
      console.log('❌ OTA_Ping FAILED');
      return false;
    }
  } catch (error) {
    console.error('❌ Request Error:', error.message);
    return false;
  }
}

/**
 * Test OTA_Read request (reading guest requests)
 */
async function testOtaRead() {
  console.log('\n=== Testing OTA_Read:GuestRequests ===\n');

  const otaReadXML = `<?xml version="1.0" encoding="UTF-8"?>
<OTA_ReadRQ xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.opentravel.org/OTA/2003/05" xsi:schemaLocation="http://www.opentravel.org/OTA/2003/05 OTA_ReadRQ.xsd" Version="3.14">
  <ReadRequests>
    <HotelReadRequest HotelCode="TEMP001" HotelName="Hotel AlpineBits" />
  </ReadRequests>
</OTA_ReadRQ>`;

  const formData = new FormData();
  formData.append('action', 'OTA_Read:GuestRequests');
  formData.append('request', Buffer.from(otaReadXML), {
    filename: 'request.xml',
    contentType: 'text/xml; charset=utf-8'
  });

  const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

  try {
    const response = await fetch(ALPINEBITS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'text/xml, application/xml',
        'X-AlpineBits-ClientProtocolVersion': '2024-10',
        'X-AlpineBits-ClientID': 'Test Client',
        ...formData.getHeaders()
      },
      body: formData
    });

    console.log('Response Status:', response.status, response.statusText);

    const responseText = await response.text();
    console.log('\n--- Response Body ---');
    console.log(responseText);
    console.log('--- End Response ---\n');

    if (response.ok) {
      console.log('✅ OTA_Read SUCCESS');
      return true;
    } else {
      console.log('❌ OTA_Read FAILED');
      return false;
    }
  } catch (error) {
    console.error('❌ Request Error:', error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     AlpineBits Integration Test Suite                 ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('\nEndpoint:', ALPINEBITS_ENDPOINT);
  console.log('Username:', USERNAME);
  console.log('Password:', PASSWORD.replace(/./g, '*'));

  // Test 1: OTA_Ping Handshaking
  const pingSuccess = await testOtaPing();

  // Test 2: OTA_Read (only if handshake succeeds)
  let readSuccess = false;
  if (pingSuccess) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    readSuccess = await testOtaRead();
  } else {
    console.log('\n⚠️  Skipping OTA_Read test because handshaking failed');
  }

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                    Test Summary                        ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`OTA_Ping (Handshaking): ${pingSuccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`OTA_Read (Guest Requests): ${readSuccess ? '✅ PASS' : '⏭️  SKIPPED'}`);
  console.log('');

  if (pingSuccess && readSuccess) {
    console.log('🎉 All tests passed! Your AlpineBits integration is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above for details.');
  }
}

// Run the tests
runTests().catch(console.error);
