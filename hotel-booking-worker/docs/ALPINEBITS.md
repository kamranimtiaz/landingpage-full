# AlpineBits Integration Guide

## Overview

This document explains how the AlpineBits protocol is implemented in this Worker to communicate with ASA's HMS system.

## AlpineBits Flow

### 1. ASA Polls for Guest Requests (OTA_ReadRQ)

ASA sends an XML request every 5-10 minutes:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<OTA_ReadRQ xmlns="http://www.opentravel.org/OTA/2003/05"
            TimeStamp="2025-01-07T10:30:00Z"
            Version="1.0">
  <ReadRequests>
    <ReadRequest>
      <UniqueID Type="16" ID="GuestRequests"/>
      <SelectionCriteria>
        <Criterion>
          <HotelRef HotelCode="GHA001"/>
        </Criterion>
      </SelectionCriteria>
    </ReadRequest>
  </ReadRequests>
</OTA_ReadRQ>
```

### 2. Worker Responds with Guest Requests (OTA_ResRetrieveRS)

The Worker responds with all unacknowledged requests:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<OTA_ResRetrieveRS xmlns="http://www.opentravel.org/OTA/2003/05"
                   TimeStamp="2025-01-07T10:30:00Z"
                   Version="1.0">
  <Success/>
  <ReservationsList>
    <HotelReservation CreateDateTime="2025-01-07T09:15:00Z" ResStatus="Requested">
      <UniqueID Type="14" ID="GR_1736241300000_hotel-1_abc123"/>
      <RoomStays>
        <RoomStay>
          <RoomTypes>
            <RoomType RoomTypeCode="Deluxe Suite"/>
          </RoomTypes>
          <GuestCounts>
            <GuestCount AgeQualifyingCode="10" Count="3"/>
            <GuestCount AgeQualifyingCode="8" Count="3">
              <Child Age="10"/>
              <Child Age="3"/>
              <Child Age="12"/>
            </GuestCount>
          </GuestCounts>
          <TimeSpan Start="2025-10-05" End="2025-10-24"/>
          <BasicPropertyInfo HotelCode="GHA001" HotelName="Grand Hotel Alpen"/>
        </RoomStay>
      </RoomStays>
      <ResGuests>
        <ResGuest>
          <PersonName>
            <GivenName>Kamran</GivenName>
            <Surname>Imtiaz</Surname>
          </PersonName>
          <Email>kamran@example.com</Email>
          <Telephone PhoneNumber="+49017669876485"/>
          <Gender>Male</Gender>
          <Language>de</Language>
        </ResGuest>
      </ResGuests>
      <ResGlobalInfo>
        <Comments>
          <Comment>
            <Text>Late check-in please</Text>
          </Comment>
        </Comments>
        <BasicPropertyInfo HotelCode="GHA001" HotelName="Grand Hotel Alpen"/>
      </ResGlobalInfo>
    </HotelReservation>
  </ReservationsList>
</OTA_ResRetrieveRS>
```

### 3. ASA Acknowledges Requests (OTA_NotifReportRQ)

After processing, ASA sends acknowledgment:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<OTA_NotifReportRQ xmlns="http://www.opentravel.org/OTA/2003/05"
                   TimeStamp="2025-01-07T10:35:00Z"
                   Version="1.0">
  <NotifDetails>
    <HotelNotifReport>
      <HotelReservations>
        <HotelReservation>
          <UniqueID Type="14" ID="GR_1736241300000_hotel-1_abc123"/>
        </HotelReservation>
      </HotelReservations>
    </HotelNotifReport>
  </NotifDetails>
</OTA_NotifReportRQ>
```

### 4. Worker Confirms Acknowledgment (OTA_NotifReportRS)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<OTA_NotifReportRS xmlns="http://www.opentravel.org/OTA/2003/05"
                   TimeStamp="2025-01-07T10:35:00Z"
                   Version="1.0">
  <Success/>
  <Warnings>
    <Warning Type="3" Code="450">GR_1736241300000_hotel-1_abc123 acknowledged</Warning>
  </Warnings>
</OTA_NotifReportRS>
```

## Data Mapping

### Webflow Form → AlpineBits XML

| Webflow Field | AlpineBits Element | Transformation |
|--------------|-------------------|----------------|
| `period` | `<TimeSpan Start="..." End="..."/>` | Split "2025-10-05 - 2025-10-24" |
| `Erwachsene` | `<GuestCount AgeQualifyingCode="10" Count="3"/>` | Extract number from "3 Erwachsene" |
| `Kinder` | `<GuestCount AgeQualifyingCode="8" Count="3"/>` | Extract number from "3 Kinder" |
| `Alter-Kind-1` | `<Child Age="10"/>` | Extract number from "10 Jahre" |
| `Anrede` | `<Gender>Male/Female</Gender>` | Convert "Herr"→"Male", "Frau"→"Female" |
| `Vorname` | `<GivenName>` | Direct mapping |
| `Nachname` | `<Surname>` | Direct mapping |
| `E-Mail-Adresse` | `<Email>` | Direct mapping |
| `Telefonnummer` | `<Telephone PhoneNumber="+49..."/>` | Add +49 prefix if missing |
| `Sprache` | `<Language>` | Direct mapping (default: "de") |
| `selected-room` | `<RoomType RoomTypeCode="..."/>` | Direct mapping |
| `Anmerkung` | `<Comments><Comment><Text>` | Direct mapping |

### Age Qualifying Codes

- **Code 10**: Adult
- **Code 8**: Child (with age specified)

### ResStatus Values

- **Requested**: Quote request (what we send)
- **Reserved**: Confirmed reservation (not used in our case)
- **Cancelled**: Cancelled reservation (not used in our case)

## Request Lifecycle

### Status Flow

```
pending → sent → acknowledged
```

1. **pending**: Guest just submitted the form
2. **sent**: ASA has retrieved the request (but not yet acknowledged)
3. **acknowledged**: ASA has confirmed receipt and processing

### Important Behavior

**Requests appear in every poll until acknowledged!**

- Status `pending` → Included in response, marked as `sent`
- Status `sent` → Included in response, stays as `sent`
- Status `acknowledged` → NOT included in response

This ensures ASA receives every request even if:
- Network issues occur
- ASA temporarily fails to process
- Polling is interrupted

## XML Elements Reference

### Required Elements

#### HotelReservation
```xml
<HotelReservation CreateDateTime="ISO8601" ResStatus="Requested">
  <UniqueID Type="14" ID="unique-request-id"/>
  <!-- Room and guest details -->
</HotelReservation>
```

#### RoomStay
```xml
<RoomStay>
  <RoomTypes>
    <RoomType RoomTypeCode="optional"/>
  </RoomTypes>
  <GuestCounts>
    <!-- Adult and child counts -->
  </GuestCounts>
  <TimeSpan Start="YYYY-MM-DD" End="YYYY-MM-DD"/>
  <BasicPropertyInfo HotelCode="..." HotelName="..."/>
</RoomStay>
```

#### ResGuest
```xml
<ResGuest>
  <PersonName>
    <GivenName>First</GivenName>
    <Surname>Last</Surname>
  </PersonName>
  <Email>email@example.com</Email>
  <Telephone PhoneNumber="+49..."/> <!-- Optional -->
  <Gender>Male/Female</Gender> <!-- Optional -->
  <Language>de</Language> <!-- Optional -->
</ResGuest>
```

### Optional Elements (We Don't Send)

- `<RatePlanCode>` - Not needed for quote requests
- `<MealPlanCodes>` - Not needed for quote requests
- `<RoomRates>` - Only for confirmed reservations
- `<Total>` - Only for confirmed reservations

## Error Handling

### Error Response Format

```xml
<?xml version="1.0" encoding="UTF-8"?>
<OTA_ResRetrieveRS xmlns="http://www.opentravel.org/OTA/2003/05"
                   TimeStamp="2025-01-07T10:30:00Z"
                   Version="1.0">
  <Errors>
    <Error Type="3" Code="450">Error message here</Error>
  </Errors>
</OTA_ResRetrieveRS>
```

### Error Scenarios

1. **Hotel Code Not Found**
   - HTTP 404
   - Error: "Hotel code 'XXX' not found"

2. **Invalid XML Format**
   - HTTP 400
   - Error: "Invalid OTA_ReadRQ format"

3. **Internal Server Error**
   - HTTP 500
   - Error: "Internal server error"

## Testing AlpineBits Integration

### 1. Submit a Test Request

```bash
curl -X POST http://localhost:8787/submit/hotel-1 \
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
  }'
```

### 2. Poll for Requests (Simulate ASA)

```bash
curl -X POST http://localhost:8787/alpinebits \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<OTA_ReadRQ xmlns="http://www.opentravel.org/OTA/2003/05"
            TimeStamp="2025-01-07T10:30:00Z"
            Version="1.0">
  <ReadRequests>
    <ReadRequest>
      <UniqueID Type="16" ID="GuestRequests"/>
      <SelectionCriteria>
        <Criterion>
          <HotelRef HotelCode="GHA001"/>
        </Criterion>
      </SelectionCriteria>
    </ReadRequest>
  </ReadRequests>
</OTA_ReadRQ>'
```

### 3. Acknowledge Request (Simulate ASA)

```bash
curl -X POST http://localhost:8787/alpinebits \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<OTA_NotifReportRQ xmlns="http://www.opentravel.org/OTA/2003/05"
                   TimeStamp="2025-01-07T10:35:00Z"
                   Version="1.0">
  <NotifDetails>
    <HotelNotifReport>
      <HotelReservations>
        <HotelReservation>
          <UniqueID Type="14" ID="GR_1736241300000_hotel-1_abc123"/>
        </HotelReservation>
      </HotelReservations>
    </HotelNotifReport>
  </NotifDetails>
</OTA_NotifReportRQ>'
```

## ASA Setup Checklist

Provide ASA with:

- [ ] **Endpoint URL**: `https://your-worker.workers.dev/alpinebits`
- [ ] **Polling Frequency**: Every 5-10 minutes recommended
- [ ] **Hotel Codes**: Complete list from database
- [ ] **Authentication**: API key if required (via `ASA_API_KEY` secret)
- [ ] **Expected Request Format**: OTA_ReadRQ with HotelCode
- [ ] **Expected Response Format**: OTA_ResRetrieveRS with HotelReservation list
- [ ] **Acknowledgment Format**: OTA_NotifReportRQ with UniqueID list

## Monitoring

### Check Request Status

```sql
-- Count by status
SELECT status, COUNT(*) as count
FROM guest_requests
GROUP BY status;

-- View unacknowledged requests
SELECT request_id, hotel_id, status, created_at, sent_at
FROM guest_requests
WHERE status IN ('pending', 'sent')
ORDER BY created_at DESC;
```

### View Logs

```sql
SELECT * FROM request_logs
ORDER BY created_at DESC
LIMIT 20;
```

### Common Issues

1. **Requests stuck in 'sent' status**
   - ASA is retrieving but not acknowledging
   - Check ASA logs for processing errors

2. **No requests appearing**
   - Verify HotelCode matches database hotel_code
   - Check request status is not 'acknowledged'

3. **Duplicate requests**
   - Expected behavior until acknowledged
   - ASA should handle duplicates gracefully
