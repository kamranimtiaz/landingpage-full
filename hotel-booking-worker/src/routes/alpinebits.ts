import { Context } from 'hono';
import { Env } from '../types';
import {
  parseReadRequest,
  parseAcknowledgeRequest,
  parsePingRequest,
  generateAlpineBitsResponse,
  generateAcknowledgeResponse,
  generatePingResponse,
  generateErrorResponse,
  getServerCapabilities,
  calculateCapabilityIntersection
} from '../services/alpinebits';
import {
  getHotelByCode,
  getUnacknowledgedRequests,
  markRequestsAsSent,
  markRequestsAsAcknowledged
} from '../services/database';
import { getISO8601Timestamp } from '../utils/transformers';

/**
 * POST /alpinebits
 * Handle AlpineBits requests from ASA system
 * Expects multipart/form-data with 'action' and optional 'request' parameters
 */
export async function handleAlpineBits(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    const timeStamp = getISO8601Timestamp();

    // Check Content-Type
    const contentType = c.req.header('Content-Type');
    if (!contentType?.includes('multipart/form-data')) {
      return new Response('ERROR:invalid content type, multipart/form-data required', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Parse multipart form data
    const formData = await c.req.formData();
    const action = formData.get('action');
    const requestField = formData.get('request');

    // Validate action parameter
    if (!action || typeof action !== 'string') {
      return new Response('ERROR:missing or invalid action parameter', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    console.log('=== Action Debug ===');
    console.log('action:', action);

    // Extract request content (might be a File or string)
    let request: string | null = null;
    if (requestField) {
      console.log('=== FormData Debug ===');
      console.log('requestField type:', typeof requestField);
      console.log('requestField constructor:', requestField.constructor?.name);

      if (typeof requestField === 'object' && requestField !== null && 'text' in requestField) {
        // If it's a File object, read its content
        request = await (requestField as File).text();
        console.log('Extracted from File, length:', request.length);
        console.log('First 200 chars:', request.substring(0, 200));
        console.log('Last 200 chars:', request.substring(Math.max(0, request.length - 200)));
        console.log('Contains OTA_PingRQ?:', request.includes('OTA_PingRQ'));
        console.log('Contains </OTA_PingRQ>?:', request.includes('</OTA_PingRQ>'));
      } else if (typeof requestField === 'string') {
        // If it's already a string, use it directly
        request = requestField;
        console.log('Using string directly, length:', request.length);
        console.log('First 200 chars:', request.substring(0, 200));
        console.log('Last 200 chars:', request.substring(Math.max(0, request.length - 200)));
        console.log('Contains OTA_PingRQ?:', request.includes('OTA_PingRQ'));
        console.log('Contains </OTA_PingRQ>?:', request.includes('</OTA_PingRQ>'));
      } else {
        console.log('WARNING: Unknown requestField type');
      }
    } else {
      console.log('WARNING: requestField is null/undefined');
    }

    // Handle different action types
    // Support both formats: "OTA_Ping:Handshaking" and "action_OTA_Ping"
    if (action === 'OTA_Ping:Handshaking' || action === 'action_OTA_Ping') {
      // For Ping requests, the 'request' parameter contains the XML
      if (!request || typeof request !== 'string') {
        return new Response('ERROR:missing request parameter for OTA_Ping', {
          status: 400,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      return handlePingRequest(c, request);
    } else if (action === 'OTA_Read:GuestRequests' || action === 'action_OTA_Read') {
      // For Read requests, the 'request' parameter contains the XML
      if (!request || typeof request !== 'string') {
        return new Response('ERROR:missing request parameter for OTA_Read', {
          status: 400,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      return await handleReadRequest(c, request, timeStamp);
    } else if (action === 'OTA_NotifReport:GuestRequests' || action === 'action_OTA_NotifReport') {
      // For Acknowledge requests, the 'request' parameter contains the XML
      if (!request || typeof request !== 'string') {
        return new Response('ERROR:missing request parameter for OTA_NotifReport', {
          status: 400,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      return await handleAcknowledgeRequest(c, request, timeStamp);
    } else {
      return new Response(`ERROR:invalid action '${action}'`, {
        status: 400,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  } catch (error) {
    console.error('Error in handleAlpineBits:', error);
    return new Response(`ERROR:${error instanceof Error ? error.message : 'internal server error'}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/**
 * Handle OTA_ReadRQ request (ASA polling for guest requests)
 */
async function handleReadRequest(
  c: Context<{ Bindings: Env }>,
  xmlBody: string,
  timeStamp: string
): Promise<Response> {
  const parsed = parseReadRequest(xmlBody);

  if (!parsed) {
    const errorXml = generateErrorResponse('Invalid OTA_ReadRQ format', timeStamp);
    return new Response(errorXml, {
      status: 400,
      headers: { 'Content-Type': 'application/xml' }
    });
  }

  // Get hotel by code
  const hotel = await getHotelByCode(c.env, parsed.hotelCode);
  if (!hotel) {
    const errorXml = generateErrorResponse(`Hotel code '${parsed.hotelCode}' not found`, timeStamp);
    return new Response(errorXml, {
      status: 404,
      headers: { 'Content-Type': 'application/xml' }
    });
  }

  // Get all unacknowledged requests (pending or sent)
  const requests = await getUnacknowledgedRequests(c.env, hotel.hotel_code);

  // Mark pending requests as sent (but keep them in response until acknowledged)
  const pendingRequestIds = requests
    .filter(r => r.status === 'pending')
    .map(r => r.requestId);

  if (pendingRequestIds.length > 0) {
    await markRequestsAsSent(c.env, pendingRequestIds);
  }

  // Generate XML response
  const responseXml = generateAlpineBitsResponse(requests, hotel, timeStamp);

  return new Response(responseXml, {
    status: 200,
    headers: { 'Content-Type': 'application/xml' }
  });
}

/**
 * Handle OTA_NotifReportRQ request (ASA acknowledging guest requests)
 */
async function handleAcknowledgeRequest(
  c: Context<{ Bindings: Env }>,
  xmlBody: string,
  timeStamp: string
): Promise<Response> {
  const parsed = parseAcknowledgeRequest(xmlBody);

  if (!parsed || parsed.requestIds.length === 0) {
    const errorXml = generateErrorResponse('Invalid OTA_NotifReportRQ format or no request IDs', timeStamp);
    return new Response(errorXml, {
      status: 400,
      headers: { 'Content-Type': 'application/xml' }
    });
  }

  // Mark requests as acknowledged
  await markRequestsAsAcknowledged(c.env, parsed.requestIds);

  // Generate success response
  const responseXml = generateAcknowledgeResponse(parsed.requestIds, timeStamp);

  return new Response(responseXml, {
    status: 200,
    headers: { 'Content-Type': 'application/xml' }
  });
}

/**
 * Handle OTA_PingRQ request (Capability negotiation handshake)
 */
function handlePingRequest(
  _c: Context<{ Bindings: Env }>,
  xmlBody: string
): Response {
  // Debug: Log the received XML
  console.log('=== OTA_PingRQ Debug ===');
  console.log('XML Body type:', typeof xmlBody);
  console.log('XML Body length:', xmlBody?.length || 0);
  console.log('XML Body preview:', xmlBody?.substring(0, 500));

  const parsed = parsePingRequest(xmlBody);

  if (!parsed) {
    console.log('ERROR: Failed to parse OTA_PingRQ');
    return new Response('ERROR:invalid OTA_PingRQ format or missing EchoData', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  console.log('Successfully parsed OTA_PingRQ');

  // Get server's supported capabilities
  const serverCapabilities = getServerCapabilities();

  // Calculate intersection of client and server capabilities
  const intersection = calculateCapabilityIntersection(
    parsed.capabilities,
    serverCapabilities
  );

  // Generate the OTA_PingRS response
  const responseXml = generatePingResponse(intersection, parsed.echoData);

  return new Response(responseXml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8'
    }
  });
}
