/**
 * Webflow Integration Example
 *
 * This script shows how to integrate your Webflow forms with the Cloudflare Worker API
 * Add this code to your Webflow project's custom code section
 */

// ============================================================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================================================

const WORKER_API_URL = 'https://hotel-booking-worker.YOUR_SUBDOMAIN.workers.dev';

// Map your hotel page URLs to hotel IDs in the database
const HOTEL_ID_MAP = {
  'grand-hotel-alpen': 'hotel-1',
  'mountain-view-resort': 'hotel-2',
  'luxury-spa-hotel': 'hotel-3',
  // Add all your 50+ hotels here
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get current hotel ID from page URL
 */
function getCurrentHotelId() {
  // Option 1: From URL path
  const urlParts = window.location.pathname.split('/');
  const hotelSlug = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
  return HOTEL_ID_MAP[hotelSlug] || 'hotel-1';

  // Option 2: From body data attribute
  // return document.body.getAttribute('data-hotel-id') || 'hotel-1';

  // Option 3: From a hidden input in the form
  // const hotelIdInput = document.querySelector('input[name="hotel-id"]');
  // return hotelIdInput ? hotelIdInput.value : 'hotel-1';
}

/**
 * Get current language from page
 */
function getCurrentLanguage() {
  const htmlLang = document.documentElement.getAttribute('lang');
  if (htmlLang) return htmlLang.split('-')[0].toLowerCase();
  return 'de';
}

/**
 * Show error message to user
 */
function showErrorMessage(form, message) {
  // Remove any existing error messages
  const existingError = form.querySelector('.api-error-message');
  if (existingError) existingError.remove();

  // Create error element
  const errorDiv = document.createElement('div');
  errorDiv.className = 'api-error-message';
  errorDiv.textContent = message;
  errorDiv.style.cssText = `
    color: #dc2626;
    background-color: #fee;
    padding: 12px 16px;
    margin: 16px 0;
    border: 1px solid #fca5a5;
    border-radius: 6px;
    font-size: 14px;
  `;

  // Insert at top of form
  form.insertBefore(errorDiv, form.firstChild);

  // Auto-remove after 8 seconds
  setTimeout(() => errorDiv.remove(), 8000);
}

/**
 * Show success message (optional)
 */
function showSuccessMessage(form, message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'api-success-message';
  successDiv.textContent = message;
  successDiv.style.cssText = `
    color: #059669;
    background-color: #d1fae5;
    padding: 12px 16px;
    margin: 16px 0;
    border: 1px solid #6ee7b7;
    border-radius: 6px;
    font-size: 14px;
  `;

  form.insertBefore(successDiv, form.firstChild);
}

// ============================================================================
// MAIN SUBMISSION FUNCTION
// ============================================================================

/**
 * Submit booking request to Cloudflare Worker
 */
async function submitBookingRequest(formData, submitButton, form) {
  const hotelId = getCurrentHotelId();
  const apiUrl = `${WORKER_API_URL}/submit/${hotelId}`;

  // Extract and prepare data
  const requestData = {
    Sprache: formData.get('Sprache') || getCurrentLanguage(),
    period: formData.get('period'),
    Erwachsene: formData.get('Erwachsene'),
    Kinder: formData.get('Kinder') || '0 Kinder',
    'Alter-Kind-1': formData.get('Alter-Kind-1'),
    'Alter-Kind-2': formData.get('Alter-Kind-2'),
    'Alter-Kind-3': formData.get('Alter-Kind-3'),
    'Alter-Kind-4': formData.get('Alter-Kind-4'),
    'Alter-Kind-5': formData.get('Alter-Kind-5'),
    'selected-room': formData.get('selected-room'),
    Anrede: formData.get('Anrede'),
    Vorname: formData.get('Vorname'),
    Nachname: formData.get('Nachname'),
    Telefonnummer: formData.get('Telefonnummer'),
    'E-Mail-Adresse': formData.get('E-Mail-Adresse'),
    Anmerkung: formData.get('Anmerkung')
  };

  // Save original button text
  const originalButtonText = submitButton.textContent;

  try {
    // Update button state
    submitButton.disabled = true;
    submitButton.textContent = 'Bitte warten...';

    // Make API request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    const result = await response.json();

    if (result.success) {
      // Success!
      console.log('✓ Booking request submitted successfully');
      console.log('Request ID:', result.requestId);

      // Store request ID for thank you page
      sessionStorage.setItem('bookingRequestId', result.requestId);

      // Optional: Show success message before redirect
      // showSuccessMessage(form, 'Anfrage erfolgreich gesendet!');

      // Redirect to thank you page
      const thankYouURL = form.getAttribute('data-redirect') || '/thank-you';
      setTimeout(() => {
        window.location.href = thankYouURL;
      }, 500);

    } else {
      // API returned error
      throw new Error(result.message || 'Submission failed');
    }

  } catch (error) {
    console.error('✗ Booking submission error:', error);

    // Show user-friendly error message
    let errorMessage = 'Es gab ein Problem bei der Übermittlung. Bitte versuchen Sie es erneut.';

    if (error.message.includes('INVALID_HOTEL')) {
      errorMessage = 'Hotel wurde nicht gefunden. Bitte kontaktieren Sie den Support.';
    } else if (error.message.includes('VALIDATION_ERROR')) {
      errorMessage = 'Bitte überprüfen Sie Ihre Eingaben.';
    } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
      errorMessage = 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.';
    }

    showErrorMessage(form, errorMessage);

    // Re-enable submit button
    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;
  }
}

// ============================================================================
// FORM INITIALIZATION
// ============================================================================

/**
 * Initialize form submission handler
 */
function initializeBookingForm() {
  // Find your booking form - update selector as needed
  const bookingForm = document.querySelector('[data-booking-form]');
  // Alternative selectors:
  // const bookingForm = document.querySelector('#booking-form');
  // const bookingForm = document.querySelector('.booking-form');

  if (!bookingForm) {
    console.warn('Booking form not found');
    return;
  }

  // Find submit button
  const submitButton = bookingForm.querySelector('[type="submit"]');

  // Override form submission
  bookingForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const formData = new FormData(bookingForm);
    await submitBookingRequest(formData, submitButton, bookingForm);
  });

  console.log('✓ Booking form initialized');
}

// ============================================================================
// THANK YOU PAGE (Optional)
// ============================================================================

/**
 * Display request ID on thank you page
 */
function initializeThankYouPage() {
  // Only run on thank you page
  if (!window.location.pathname.includes('thank-you')) return;

  const requestId = sessionStorage.getItem('bookingRequestId');

  if (requestId) {
    console.log('Booking Request ID:', requestId);

    // Find element to display request ID
    const requestIdElement = document.querySelector('[data-request-id]');
    if (requestIdElement) {
      requestIdElement.textContent = requestId;
    }

    // Clear from session storage
    sessionStorage.removeItem('bookingRequestId');
  }
}

// ============================================================================
// AUTO-INITIALIZE
// ============================================================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeBookingForm();
    initializeThankYouPage();
  });
} else {
  initializeBookingForm();
  initializeThankYouPage();
}
