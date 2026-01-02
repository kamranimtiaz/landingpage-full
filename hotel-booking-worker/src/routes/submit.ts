import { Context } from 'hono';
import { Env, WebflowFormData, GuestRequest, SubmitResponse, ErrorResponse } from '../types';
import { validateFormData } from '../utils/validators';
import {
  parseDateRange,
  extractChildAges,
  formatPhoneNumber,
  generateRequestId,
  getISO8601Timestamp,
  parseRoomSelection,
  parseOfferSelection
} from '../utils/transformers';
import { getHotelByCode, storeGuestRequest } from '../services/database';

/**
 * POST /submit/{hotel-id}
 * Handle form submission from Webflow landing pages
 */
export async function handleSubmit(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    const hotelCode = c.req.param('hotelId');
    const formData: WebflowFormData = await c.req.json();

    console.log('=== WORKER RECEIVED SUBMISSION ===');
    console.log('Hotel Code:', hotelCode);
    console.log('Raw Form Data:', JSON.stringify(formData, null, 2));
    console.log('==================================');

    // Validate hotel exists
    const hotel = await getHotelByCode(c.env, hotelCode);
    if (!hotel) {
      console.log('❌ Hotel not found:', hotelCode);
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'INVALID_HOTEL',
        message: `Hotel with code '${hotelCode}' not found`
      };
      return c.json(errorResponse, 404);
    }
    console.log('✓ Hotel found:', hotel.hotel_name);

    // Validate form data
    const validation = validateFormData(formData);
    if (!validation.valid) {
      console.log('❌ Validation failed:', validation.errors);
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'VALIDATION_ERROR',
        message: validation.errors.join(', ')
      };
      return c.json(errorResponse, 400);
    }
    console.log('✓ Form data validated');

    // Parse and transform data (now much simpler with normalized input)
    const { checkIn, checkOut } = parseDateRange(formData.period);
    const childAges = extractChildAges(formData);
    const phoneNumber = formData.phone ? formatPhoneNumber(formData.phone, formData.language) : '';
    const requestId = generateRequestId(hotelCode);

    // Parse room selection (format: "CODE|Name" or just "Name")
    const roomSelection = parseRoomSelection(formData.selectedRoom);

    // Parse offer selection (format: "CODE|Name" or just "Name")
    const offerSelection = parseOfferSelection(formData.selectedOffer);

    // Create guest request object
    const guestRequest: GuestRequest = {
      requestId,
      hotelCode,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      adultCount: formData.adults,
      childrenCount: formData.children,
      childAges,
      selectedRoom: roomSelection.raw || undefined,
      selectedRoomCode: roomSelection.code,
      selectedRoomName: roomSelection.name,
      selectedOffer: offerSelection.raw || undefined,
      selectedOfferCode: offerSelection.code,
      selectedOfferName: offerSelection.name,
      gender: formData.salutation,
      firstName: formData.firstName?.trim() || '',
      lastName: formData.lastName?.trim() || '',
      phoneNumber,
      email: formData.email.trim(),
      language: formData.language || 'de',
      comments: formData.comments?.trim(),
      origin: formData.origin?.trim(),
      status: 'pending',
      createdAt: getISO8601Timestamp()
    };

    console.log('=== PARSED GUEST REQUEST ===');
    console.log(JSON.stringify(guestRequest, null, 2));
    console.log('============================');

    // Store in database
    const success = await storeGuestRequest(c.env, guestRequest);
    if (!success) {
      console.log('❌ Failed to store in database');
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Failed to store guest request'
      };
      return c.json(errorResponse, 500);
    }
    console.log('✓ Guest request stored successfully');

    // Return success response
    const response: SubmitResponse = {
      success: true,
      requestId,
      message: 'Request received successfully'
    };

    console.log('=== SUCCESS RESPONSE ===');
    console.log('Request ID:', requestId);
    console.log('========================');

    return c.json(response, 201);
  } catch (error) {
    console.error('Error in handleSubmit:', error);
    const errorResponse: ErrorResponse = {
      success: false,
      error: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
    return c.json(errorResponse, 500);
  }
}
