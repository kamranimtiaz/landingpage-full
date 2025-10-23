import { WebflowFormData } from '../types';

/**
 * Parse date range from "YYYY-MM-DD - YYYY-MM-DD" format
 */
export function parseDateRange(period: string): { checkIn: string; checkOut: string } {
  const dates = period.split('-').map(d => d.trim());

  if (dates.length === 6) {
    // Format: YYYY-MM-DD - YYYY-MM-DD (split by - gives 6 parts)
    const checkIn = `${dates[0]}-${dates[1]}-${dates[2]}`;
    const checkOut = `${dates[3]}-${dates[4]}-${dates[5]}`;
    return { checkIn, checkOut };
  }

  throw new Error('Invalid date format');
}

/**
 * Extract all child ages from form data (now already numbers)
 */
export function extractChildAges(data: WebflowFormData): number[] {
  const ages: number[] = [];

  if (data.childAge1) ages.push(data.childAge1);
  if (data.childAge2) ages.push(data.childAge2);
  if (data.childAge3) ages.push(data.childAge3);
  if (data.childAge4) ages.push(data.childAge4);
  if (data.childAge5) ages.push(data.childAge5);

  return ages;
}

/**
 * Format phone number with German country code
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');

  // If it starts with 0, remove it and add +49
  if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }

  // If it doesn't start with country code, add +49
  if (!digits.startsWith('49')) {
    return `+49${digits}`;
  }

  return `+${digits}`;
}

/**
 * Generate unique request ID
 * Format: GR_<timestamp>_<hotel>_<random>
 * OTA standard requires max 32 characters
 *
 * Strategy to stay under 32 chars:
 * - Use shortened timestamp (last 10 digits = ~317 years from 1970)
 * - Truncate hotelId if needed (max 8 chars)
 * - Use 5-char random suffix
 * Total: 3 + 10 + 1 + 8 + 1 + 5 = 28 chars (leaves 4 char buffer)
 */
export function generateRequestId(hotelId: string): string {
  // Use last 10 digits of timestamp (sufficient uniqueness)
  const timestamp = Date.now().toString().slice(-10);

  // Truncate hotel ID to max 8 characters
  const shortHotelId = hotelId.substring(0, 8);

  // 5-character random suffix
  const random = Math.random().toString(36).substring(2, 7);

  const requestId = `GR_${timestamp}_${shortHotelId}_${random}`;

  // Safety check: ensure we're under 32 chars
  if (requestId.length > 32) {
    // Fallback: use even shorter format
    const ultraShort = hotelId.substring(0, 5);
    return `GR_${timestamp}_${ultraShort}_${random}`;
  }

  return requestId;
}

/**
 * Get ISO 8601 timestamp
 */
export function getISO8601Timestamp(): string {
  return new Date().toISOString();
}
