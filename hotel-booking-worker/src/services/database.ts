import { Env, GuestRequest, GuestRequestRow, Hotel } from '../types';

/**
 * Get hotel by hotel_code
 */
export async function getHotelByCode(env: Env, hotelCode: string): Promise<Hotel | null> {
  const result = await env.DB.prepare(
    'SELECT * FROM hotels WHERE hotel_code = ?'
  ).bind(hotelCode).first<Hotel>();

  return result || null;
}

/**
 * Store guest request in database
 */
export async function storeGuestRequest(env: Env, request: GuestRequest): Promise<boolean> {
  try {
    await env.DB.prepare(`
      INSERT INTO guest_requests (
        request_id, hotel_code, check_in_date, check_out_date,
        adult_count, children_count, child_ages, selected_room,
        selected_room_code, selected_room_name, selected_offer,
        selected_offer_code, selected_offer_name,
        gender, first_name, last_name, phone_number, email, language,
        comments, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      request.requestId,
      request.hotelCode,
      request.checkInDate,
      request.checkOutDate,
      request.adultCount,
      request.childrenCount,
      JSON.stringify(request.childAges),
      request.selectedRoom || null,
      request.selectedRoomCode || null,
      request.selectedRoomName || null,
      request.selectedOffer || null,
      request.selectedOfferCode || null,
      request.selectedOfferName || null,
      request.gender || null,
      request.firstName,
      request.lastName,
      request.phoneNumber,
      request.email,
      request.language,
      request.comments || null,
      request.status,
      request.createdAt
    ).run();

    // Log the event
    await logEvent(env, request.requestId, 'submitted', 'Guest request submitted');

    return true;
  } catch (error) {
    console.error('Error storing guest request:', error);
    return false;
  }
}

/**
 * Get unacknowledged guest requests for a hotel
 */
export async function getUnacknowledgedRequests(env: Env, hotelCode: string): Promise<GuestRequest[]> {
  const results = await env.DB.prepare(`
    SELECT * FROM guest_requests
    WHERE hotel_code = ? AND status IN ('pending', 'sent')
    ORDER BY created_at DESC
  `).bind(hotelCode).all<GuestRequestRow>();

  return (results.results || []).map(rowToGuestRequest);
}

/**
 * Mark requests as sent
 */
export async function markRequestsAsSent(env: Env, requestIds: string[]): Promise<void> {
  if (requestIds.length === 0) return;

  const placeholders = requestIds.map(() => '?').join(',');
  const now = new Date().toISOString();

  await env.DB.prepare(`
    UPDATE guest_requests
    SET status = 'sent', sent_at = ?
    WHERE request_id IN (${placeholders}) AND status = 'pending'
  `).bind(now, ...requestIds).run();

  // Log events
  for (const requestId of requestIds) {
    await logEvent(env, requestId, 'sent', 'Request sent to ASA');
  }
}

/**
 * Mark requests as acknowledged
 */
export async function markRequestsAsAcknowledged(env: Env, requestIds: string[]): Promise<void> {
  if (requestIds.length === 0) return;

  const placeholders = requestIds.map(() => '?').join(',');
  const now = new Date().toISOString();

  await env.DB.prepare(`
    UPDATE guest_requests
    SET status = 'acknowledged', acknowledged_at = ?
    WHERE request_id IN (${placeholders})
  `).bind(now, ...requestIds).run();

  // Log events
  for (const requestId of requestIds) {
    await logEvent(env, requestId, 'acknowledged', 'Request acknowledged by ASA');
  }
}

/**
 * Log event to request_logs table
 */
async function logEvent(env: Env, requestId: string, eventType: string, details: string): Promise<void> {
  try {
    await env.DB.prepare(`
      INSERT INTO request_logs (request_id, event_type, details)
      VALUES (?, ?, ?)
    `).bind(requestId, eventType, details).run();
  } catch (error) {
    console.error('Error logging event:', error);
  }
}

/**
 * Convert database row to GuestRequest object
 */
function rowToGuestRequest(row: GuestRequestRow): GuestRequest {
  return {
    requestId: row.request_id,
    hotelCode: row.hotel_code,
    checkInDate: row.check_in_date,
    checkOutDate: row.check_out_date,
    adultCount: row.adult_count,
    childrenCount: row.children_count,
    childAges: row.child_ages ? JSON.parse(row.child_ages) : [],
    selectedRoom: row.selected_room || undefined,
    selectedRoomCode: row.selected_room_code || undefined,
    selectedRoomName: row.selected_room_name || undefined,
    selectedOffer: row.selected_offer || undefined,
    selectedOfferCode: row.selected_offer_code || undefined,
    selectedOfferName: row.selected_offer_name || undefined,
    gender: (row.gender as 'Male' | 'Female' | '') || '',
    firstName: row.first_name,
    lastName: row.last_name,
    phoneNumber: row.phone_number,
    email: row.email,
    language: row.language,
    comments: row.comments || undefined,
    status: row.status as 'pending' | 'sent' | 'acknowledged',
    createdAt: row.created_at,
    sentAt: row.sent_at || undefined,
    acknowledgedAt: row.acknowledged_at || undefined
  };
}
