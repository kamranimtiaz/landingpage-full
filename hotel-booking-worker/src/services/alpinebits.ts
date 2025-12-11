import { GuestRequest, Hotel, AlpineBitsCapabilities } from '../types';

/**
 * Generate AlpineBits OTA_ResRetrieveRS XML response
 */
export function generateAlpineBitsResponse(
  requests: GuestRequest[],
  hotel: Hotel,
  _timeStamp: string
): string {
  const reservations = requests.map(req => generateReservation(req, hotel)).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<OTA_ResRetrieveRS xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                   xmlns="http://www.opentravel.org/OTA/2003/05"
                   xsi:schemaLocation="http://www.opentravel.org/OTA/2003/05 OTA_ResRetrieveRS.xsd"
                   Version="7.000">
  <Success/>
  <ReservationsList>
${reservations}
  </ReservationsList>
</OTA_ResRetrieveRS>`;
}

/**
 * Generate a single reservation element
 * Following AlpineBits 2024-10 specification
 */
function generateReservation(request: GuestRequest, hotel: Hotel): string {
  // Build GuestCounts - total count per type
  const totalGuests = request.adultCount + request.childrenCount;
  const guestCountsXml = [];

  // Add total adults (or all guests if no children)
  if (request.childrenCount === 0) {
    guestCountsXml.push(`\n                        <GuestCount Count="${totalGuests}"/>`);
  } else {
    guestCountsXml.push(`\n                        <GuestCount Count="${request.adultCount}"/>`);
    // Add individual children with ages
    for (const age of request.childAges) {
      guestCountsXml.push(`\n                        <GuestCount Count="1" Age="${age}"/>`);
    }
  }

  // Build Customer attributes - gender defaults to "Unknown" if not specified
  const genderAttr = ` Gender="${request.gender || 'Unknown'}"`;
  const languageAttr = request.language ? ` Language="${request.language}"` : '';

  // Build Customer contact elements
  const telephoneXml = request.phoneNumber
    ? `\n                                    <Telephone PhoneTechType="1" PhoneNumber="${escapeXml(request.phoneNumber)}"/>`
    : '';
  const emailXml = request.email
    ? `\n                                    <Email>${escapeXml(request.email)}</Email>`
    : '';

  // Build PersonName elements
  const givenNameXml = request.firstName
    ? `\n                                        <GivenName>${escapeXml(request.firstName)}</GivenName>`
    : '';
  const surnameXml = request.lastName
    ? `\n                                        <Surname>${escapeXml(request.lastName)}</Surname>`
    : '';

  // Build Address (only country if available)
  const addressXml = `\n                                    <Address>\n                                        <CountryName Code="DE"/>\n                                    </Address>`;

  // Build Comments (customer comment, room selection, and offer details)
  const commentParts: string[] = [];

  // Add room selection info if available
  if (request.selectedRoomName) {
    const roomText = request.selectedRoomCode
      ? `Room Selection: ${escapeXml(request.selectedRoomName)} (${escapeXml(request.selectedRoomCode)})`
      : `Room Selection: ${escapeXml(request.selectedRoomName)}`;
    commentParts.push(`                    <Comment Name="additional info">\n                        <Text>${roomText}</Text>\n                    </Comment>`);
  }

  // Add offer details if available
  if (request.selectedOfferName) {
    const offerText = request.selectedOfferCode
      ? `Offer Selection: ${escapeXml(request.selectedOfferName)} (${escapeXml(request.selectedOfferCode)})`
      : `Offer Selection: ${escapeXml(request.selectedOfferName)}`;
    commentParts.push(`                    <Comment Name="additional info">\n                        <Text>${offerText}</Text>\n                    </Comment>`);
  }

  // Add customer comment if available
  if (request.comments) {
    commentParts.push(`                    <Comment Name="customer message">\n                        <Text>${escapeXml(request.comments)}</Text>\n                    </Comment>`);
  }

  const commentsXml = commentParts.length > 0
    ? `\n                <Comments>\n${commentParts.join('\n')}\n                </Comments>`
    : '';

  // Build RoomType attributes for AlpineBits GuestRequests
  // RoomTypeCode: The actual room code for AlpineBits mapping (e.g., "DBL", "SGL")
  // This is the code used by the hotel's PMS/booking system
  // Note: RoomType and RoomClassificationCode are intentionally omitted as they should
  // only be included when we have actual data. This accommodates various property types
  // (apartments, studios, etc.) that don't fit standard hotel room classifications.
  const roomTypeCodeAttr = request.selectedRoomCode
    ? ` RoomTypeCode="${escapeXml(request.selectedRoomCode)}"`
    : '';

  return `        <HotelReservation CreateDateTime="${request.createdAt}" ResStatus="Requested">
            <UniqueID Type="14" ID="${request.requestId}"/>
            <RoomStays>
                <RoomStay>
                    <RoomTypes>
                        <RoomType${roomTypeCodeAttr}/>
                    </RoomTypes>
                    <GuestCounts>${guestCountsXml.join('')}
                    </GuestCounts>
                    <TimeSpan Start="${request.checkInDate}" End="${request.checkOutDate}"/>
                </RoomStay>
            </RoomStays>
            <ResGuests>
                <ResGuest>
                    <Profiles>
                        <ProfileInfo>
                            <Profile>
                                <Customer${languageAttr}${genderAttr}>
                                    <PersonName>${givenNameXml}${surnameXml}
                                    </PersonName>${telephoneXml}${emailXml}${addressXml}
                                </Customer>
                            </Profile>
                        </ProfileInfo>
                    </Profiles>
                </ResGuest>
            </ResGuests>
            <ResGlobalInfo>${commentsXml}
                <BasicPropertyInfo HotelCode="${hotel.hotel_code}" HotelName="${escapeXml(hotel.hotel_name)}"/>
            </ResGlobalInfo>
        </HotelReservation>`;
}

/**
 * Generate AlpineBits OTA_NotifReportRS XML response
 * Simple success response without warnings
 */
export function generateAcknowledgeResponse(
  timeStamp: string
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<OTA_NotifReportRS xmlns="http://www.opentravel.org/OTA/2003/05"
                   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                   xsi:schemaLocation="http://www.opentravel.org/OTA/2003/05 OTA_NotifReportRS.xsd"
                   TimeStamp="${timeStamp}"
                   Version="7.000">
  <Success/>
</OTA_NotifReportRS>`;
}

/**
 * Parse AlpineBits OTA_ReadRQ XML request
 */
export function parseReadRequest(xml: string): { action: string; hotelCode: string } | null {
  try {
    // Simple XML parsing for HotelCode
    const hotelCodeMatch = xml.match(/HotelCode="([^"]+)"/);
    const actionMatch = xml.match(/OTA_ReadRQ/);

    if (hotelCodeMatch && actionMatch) {
      return {
        action: 'OTA_Read:GuestRequests',
        hotelCode: hotelCodeMatch[1]
      };
    }
    return null;
  } catch (error) {
    console.error('Error parsing read request:', error);
    return null;
  }
}

/**
 * Parse AlpineBits OTA_NotifReportRQ XML request
 */
export function parseAcknowledgeRequest(xml: string): { action: string; requestIds: string[] } | null {
  try {
    const requestIds: string[] = [];
    const uniqueIdRegex = /UniqueID[^>]*ID="([^"]+)"/g;
    let match;

    while ((match = uniqueIdRegex.exec(xml)) !== null) {
      requestIds.push(match[1]);
    }

    if (requestIds.length > 0) {
      return {
        action: 'OTA_NotifReport:GuestRequests',
        requestIds
      };
    }
    return null;
  } catch (error) {
    console.error('Error parsing acknowledge request:', error);
    return null;
  }
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate error response
 */
export function generateErrorResponse(errorMessage: string, timeStamp: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<OTA_ResRetrieveRS xmlns="http://www.opentravel.org/OTA/2003/05"
                   TimeStamp="${timeStamp}"
                   Version="7.000">
  <Errors>
    <Error Type="3" Code="450">${escapeXml(errorMessage)}</Error>
  </Errors>
</OTA_ResRetrieveRS>`;
}

/**
 * Parse AlpineBits OTA_PingRQ XML request
 * Extracts the EchoData JSON containing client capabilities
 */
export function parsePingRequest(xml: string): { echoData: string; capabilities: AlpineBitsCapabilities } | null {
  try {
    console.log('=== parsePingRequest Debug ===');
    console.log('XML input length:', xml?.length);
    console.log('XML contains OTA_PingRQ?:', xml?.includes('OTA_PingRQ'));
    console.log('XML contains EchoData?:', xml?.includes('EchoData'));

    // Extract EchoData content (contains JSON)
    const echoDataMatch = xml.match(/<EchoData>([\s\S]*?)<\/EchoData>/);

    console.log('EchoData regex match?:', !!echoDataMatch);

    if (!echoDataMatch) {
      console.log('ERROR: No EchoData match found');
      console.log('First 500 chars of XML:', xml?.substring(0, 500));
      return null;
    }

    // Keep the ORIGINAL EchoData exactly as sent (with HTML entities)
    // AlpineBits spec requires: "the content of the EchoData element must be identical to what the client sent"
    const originalEchoData = echoDataMatch[1].trim();
    console.log('Extracted EchoData length:', originalEchoData.length);
    console.log('EchoData preview (original):', originalEchoData.substring(0, 100));

    // HTML-decode ONLY for JSON parsing (ASA sends it with HTML entities)
    // Replace common HTML entities with their actual characters
    const decodedEchoData = originalEchoData
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&apos;/g, "'");

    console.log('EchoData preview (decoded):', decodedEchoData.substring(0, 100));

    // Parse the decoded JSON
    const capabilities = JSON.parse(decodedEchoData) as AlpineBitsCapabilities;
    console.log('✓ Successfully parsed JSON, versions count:', capabilities.versions?.length);

    // Return the ORIGINAL (not decoded) EchoData for the response
    return {
      echoData: originalEchoData,
      capabilities
    };
  } catch (error) {
    console.error('Error parsing ping request:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Calculate capability intersection between client and server
 * Returns only the capabilities that both client and server support
 */
export function calculateCapabilityIntersection(
  clientCapabilities: AlpineBitsCapabilities,
  serverCapabilities: AlpineBitsCapabilities
): AlpineBitsCapabilities {
  const intersectionVersions = [];

  // For each client version, check if server supports it
  for (const clientVersion of clientCapabilities.versions || []) {
    const serverVersion = serverCapabilities.versions?.find(v => v.version === clientVersion.version);

    if (!serverVersion) {
      // Server doesn't support this version, skip it
      continue;
    }

    // Find common actions for this version
    const commonActions = [];
    for (const clientAction of clientVersion.actions || []) {
      const serverAction = serverVersion.actions?.find(a => a.action === clientAction.action);

      if (!serverAction) {
        // Server doesn't support this action, skip it
        continue;
      }

      // If both have supports arrays, find intersection
      if (clientAction.supports && serverAction.supports) {
        const commonSupports = clientAction.supports.filter(cs =>
          serverAction.supports?.includes(cs)
        );

        if (commonSupports.length > 0) {
          commonActions.push({
            action: clientAction.action,
            supports: commonSupports
          });
        }
      } else {
        // No supports arrays, just include the action
        commonActions.push({
          action: clientAction.action
        });
      }
    }

    // If there are common actions, include this version
    if (commonActions.length > 0) {
      intersectionVersions.push({
        version: clientVersion.version,
        actions: commonActions
      });
    }
  }

  return {
    versions: intersectionVersions
  };
}

/**
 * Get server's supported capabilities
 * This defines what your server supports
 */
export function getServerCapabilities(): AlpineBitsCapabilities {
  return {
    versions: [
      {
        version: "2024-10",
        actions: [
          {
            action: "action_OTA_Read"
          },
          {
            action: "action_OTA_NotifReport"
          }
          // Note: action_OTA_Ping is implicit and should NOT be listed
        ]
      }
    ]
  };
}

/**
 * Generate AlpineBits OTA_PingRS XML response
 * Returns the capability intersection and echoes back client's original data
 */
export function generatePingResponse(
  intersection: AlpineBitsCapabilities,
  echoData: string
): string {
  // Convert intersection to JSON string for the Warning element
  const intersectionJson = JSON.stringify(intersection, null, 2)
    .split('\n')
    .map(line => '      ' + line) // Indent for proper XML formatting
    .join('\n')
    .trim();

  // EchoData must be EXACTLY what the client sent - no modifications!
  // Do NOT add indentation, newlines, or any other characters
  // AlpineBits spec: "the content of the EchoData element must be identical to what the client sent"

  return `<?xml version="1.0" encoding="UTF-8"?>
<OTA_PingRS xmlns="http://www.opentravel.org/OTA/2003/05" Version="1.0">
  <Success/>
  <Warnings>
    <Warning Type="11" Status="ALPINEBITS_HANDSHAKE">
${intersectionJson}
    </Warning>
  </Warnings>
  <EchoData>${echoData}</EchoData>
</OTA_PingRS>`;
}
