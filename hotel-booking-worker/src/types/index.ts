// Cloudflare Workers bindings
export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  // AlpineBits authentication (HTTP Basic Auth)
  ALPINEBITS_USERNAME?: string;
  ALPINEBITS_PASSWORD?: string;
  ALPINEBITS_REQUIRE_CLIENT_ID?: string;
  // Optional API key for other endpoints
  API_KEY?: string;
  ENVIRONMENT?: string;
}

// Context variables
export interface Variables {
  alpinebits?: {
    clientProtocolVersion: string;
    clientId?: string;
  };
}

// Webflow form submission data (normalized to English)
export interface WebflowFormData {
  language?: string;
  period: string;
  adults: number;
  children: number;
  childAge1?: number;
  childAge2?: number;
  childAge3?: number;
  childAge4?: number;
  childAge5?: number;
  selectedRoom?: string;
  selectedOffer?: string;
  salutation?: 'Male' | 'Female' | '';
  firstName?: string;
  lastName?: string;
  phone?: string;
  email: string;
  comments?: string;
  privacyConsent?: boolean;
}

// Parsed and validated guest request
export interface GuestRequest {
  requestId: string;
  hotelCode: string;
  checkInDate: string;
  checkOutDate: string;
  adultCount: number;
  childrenCount: number;
  childAges: number[];
  selectedRoom?: string;
  selectedRoomCode?: string;
  selectedRoomName?: string;
  gender?: 'Male' | 'Female' | '';
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  language: string;
  comments?: string;
  status: 'pending' | 'sent' | 'acknowledged';
  createdAt: string;
  sentAt?: string;
  acknowledgedAt?: string;
}

// Database row format
export interface GuestRequestRow {
  id: number;
  request_id: string;
  hotel_code: string;
  check_in_date: string;
  check_out_date: string;
  adult_count: number;
  children_count: number;
  child_ages: string | null;
  selected_room: string | null;
  selected_room_code: string | null;
  selected_room_name: string | null;
  gender: string | null;
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  language: string;
  comments: string | null;
  status: string;
  created_at: string;
  sent_at: string | null;
  acknowledged_at: string | null;
}

// Hotel information
export interface Hotel {
  id: number;
  hotel_code: string;
  hotel_name: string;
  created_at: string;
  updated_at: string;
}

// AlpineBits request types
export interface AlpineBitsReadRequest {
  action: 'OTA_Read:GuestRequests';
  hotelCode: string;
}

export interface AlpineBitsAcknowledgeRequest {
  action: 'OTA_NotifReport:GuestRequests';
  requestIds: string[];
}

// AlpineBits OTA_Ping capability negotiation types
export interface AlpineBitsAction {
  action: string;
  supports?: string[];
}

export interface AlpineBitsVersion {
  version: string;
  actions?: AlpineBitsAction[];
}

export interface AlpineBitsCapabilities {
  versions: AlpineBitsVersion[];
}

// API Response types
export interface SubmitResponse {
  success: boolean;
  requestId: string;
  message: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
}
