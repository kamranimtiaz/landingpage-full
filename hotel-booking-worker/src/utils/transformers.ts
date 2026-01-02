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
 * Language to country code mapping
 * Maps language codes to their respective country calling codes
 */
const LANGUAGE_TO_COUNTRY_CODE: { [key: string]: string } = {
  'de': '49',   // Germany
  'it': '39',   // Italy
  'fr': '33',   // France
  'en': '44',   // United Kingdom (default for English)
  'es': '34',   // Spain
  'pt': '351',  // Portugal
  'nl': '31',   // Netherlands
  'pl': '48',   // Poland
  'cs': '420',  // Czech Republic
  'sk': '421',  // Slovakia
  'hu': '36',   // Hungary
  'ro': '40',   // Romania
  'bg': '359',  // Bulgaria
  'hr': '385',  // Croatia
  'sl': '386',  // Slovenia
  'sr': '381',  // Serbia
  'ru': '7',    // Russia
  'uk': '380',  // Ukraine
  'tr': '90',   // Turkey
  'ar': '966',  // Arabic - Saudi Arabia (default)
  'zh': '86',   // Chinese - China (default)
  'ja': '81',   // Japan
  'ko': '82',   // Korea
};

/**
 * Special handling for multi-country languages
 * Switzerland uses multiple languages but one country code
 */
const SWITZERLAND_LANGUAGES = ['de-ch', 'fr-ch', 'it-ch', 'rm-ch'];

/**
 * Format phone number with appropriate country code based on language
 * If language is not recognized, returns the phone number as-is (no country code added)
 */
export function formatPhoneNumber(phone: string, language?: string): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');

  // If empty after cleaning, return original
  if (!digits) {
    return phone;
  }

  // If no language provided, return number as-is without modification
  if (!language) {
    return phone;
  }

  // Normalize language code to lowercase
  const lang = language.toLowerCase().trim();

  // Check if it's a Swiss language variant
  if (SWITZERLAND_LANGUAGES.includes(lang)) {
    // Switzerland country code
    const countryCode = '41';

    // If it starts with 0, remove it
    if (digits.startsWith('0')) {
      digits = digits.substring(1);
    }

    // If it doesn't start with country code, add +41
    if (!digits.startsWith(countryCode)) {
      return `+${countryCode}${digits}`;
    }

    return `+${digits}`;
  }

  // Extract base language code (e.g., 'de' from 'de-DE' or 'de-AT')
  const baseLanguage = lang.split('-')[0];
  const countryCode = LANGUAGE_TO_COUNTRY_CODE[baseLanguage];

  // If language is not recognized, return the number as-is without adding country code
  if (!countryCode) {
    return phone;
  }

  // If it starts with 0, remove it (common in European phone numbers)
  if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }

  // Check if number already has a country code
  // Try to match against all possible country codes
  const hasCountryCode = Object.values(LANGUAGE_TO_COUNTRY_CODE).some(code =>
    digits.startsWith(code)
  );

  if (hasCountryCode) {
    // Already has a country code, just add + if missing
    return `+${digits}`;
  }

  // Add the appropriate country code
  return `+${countryCode}${digits}`;
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

/**
 * Parse room selection value
 * Format from frontend: "CODE|Name" or just "Name"
 * Returns: { code: string | undefined, name: string | undefined, raw: string }
 */
export function parseRoomSelection(selectedRoom?: string): {
  code?: string;
  name?: string;
  raw: string;
} {
  if (!selectedRoom || selectedRoom.trim() === '') {
    return { raw: '' };
  }

  const trimmed = selectedRoom.trim();

  // Check if it contains the separator
  if (trimmed.includes('|')) {
    const parts = trimmed.split('|');
    const code = parts[0]?.trim();
    const name = parts.slice(1).join('|').trim(); // In case name contains |

    return {
      code: code || undefined,
      name: name || undefined,
      raw: trimmed
    };
  }

  // No separator, treat entire value as name
  return {
    name: trimmed,
    raw: trimmed
  };
}

/**
 * Parse offer selection value
 * Format from frontend: "CODE|Name" or just "Name"
 * Returns: { code: string | undefined, name: string | undefined, raw: string }
 */
export function parseOfferSelection(selectedOffer?: string): {
  code?: string;
  name?: string;
  raw: string;
} {
  if (!selectedOffer || selectedOffer.trim() === '') {
    return { raw: '' };
  }

  const trimmed = selectedOffer.trim();

  // Check if it contains the separator
  if (trimmed.includes('|')) {
    const parts = trimmed.split('|');
    const code = parts[0]?.trim();
    const name = parts.slice(1).join('|').trim(); // In case name contains |

    return {
      code: code || undefined,
      name: name || undefined,
      raw: trimmed
    };
  }

  // No separator, treat entire value as name
  return {
    name: trimmed,
    raw: trimmed
  };
}
