/**
 * Webflow FormData to JSON Adapter
 *
 * This script converts your existing Webflow form submission
 * from FormData format to JSON format expected by the Worker API
 *
 * INSTALLATION:
 * 1. Copy this entire script
 * 2. In Webflow: Project Settings → Custom Code → Footer Code
 * 3. Paste inside <script> tags
 * 4. Update WORKER_URL and HOTEL_ID_MAP
 * 5. Publish your site
 */

(function() {
  'use strict';

  // ============================================================================
  // CONFIGURATION - UPDATE THESE VALUES
  // ============================================================================

  const CONFIG = {
    // Your Worker URL (local for testing, then change to deployed URL)
    WORKER_URL: 'http://localhost:8787',  // Change to https://your-worker.workers.dev for production

    // Map hotel page URLs to hotel IDs in database
    HOTEL_ID_MAP: {
      'hotel-1': 'hotel-1',  // Example: yoursite.com/hotel-1 → hotel-1
      'hotel-2': 'hotel-2',
      'hotel-3': 'hotel-3',
      // Add all your hotels here
    },

    // Default hotel ID if not found in map
    DEFAULT_HOTEL_ID: 'hotel-1',

    // Success redirect URL
    THANK_YOU_URL: '/danke',

    // Enable debug logging
    DEBUG: true
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  function log(...args) {
    if (CONFIG.DEBUG) {
      console.log('[Hotel Booking Adapter]', ...args);
    }
  }

  function getHotelId() {
    // Try to get from URL path
    const urlParts = window.location.pathname.split('/').filter(Boolean);
    const lastSegment = urlParts[urlParts.length - 1];

    if (CONFIG.HOTEL_ID_MAP[lastSegment]) {
      return CONFIG.HOTEL_ID_MAP[lastSegment];
    }

    // Try to get from body data attribute
    const bodyHotelId = document.body.getAttribute('data-hotel-id');
    if (bodyHotelId) {
      return bodyHotelId;
    }

    // Fallback to default
    log('⚠️ Could not determine hotel ID, using default:', CONFIG.DEFAULT_HOTEL_ID);
    return CONFIG.DEFAULT_HOTEL_ID;
  }

  function getCurrentLanguage() {
    const htmlLang = document.documentElement.getAttribute('lang');
    if (htmlLang) return htmlLang.split('-')[0].toLowerCase();
    return 'de';
  }

  function showError(form, message) {
    // Try to find existing error message element
    let errorDiv = form.querySelector('.api-error-message');

    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'api-error-message';
      errorDiv.style.cssText = `
        color: #dc2626;
        background-color: #fee;
        padding: 12px 16px;
        margin: 16px 0;
        border: 1px solid #fca5a5;
        border-radius: 6px;
        font-size: 14px;
      `;
      form.insertBefore(errorDiv, form.firstChild);
    }

    errorDiv.textContent = message;
    errorDiv.style.display = 'block';

    // Auto-hide after 8 seconds
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 8000);
  }

  async function submitToWorker(formData, submitButton, form) {
    const hotelId = getHotelId();
    const apiUrl = `${CONFIG.WORKER_URL}/submit/${hotelId}`;

    log('📍 Hotel ID:', hotelId);
    log('📡 API URL:', apiUrl);

    // Convert FormData to JSON object
    const data = {};
    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }

    // Add language if not present
    if (!data.Sprache) {
      data.Sprache = getCurrentLanguage();
    }

    log('📤 Sending data:', data);

    // Save original button state
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Bitte warten...';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      log('📥 Response:', result);

      if (result.success) {
        // Success!
        log('✓ Booking submitted successfully');
        log('Request ID:', result.requestId);

        // Store request ID for thank you page
        try {
          sessionStorage.setItem('bookingRequestId', result.requestId);
        } catch (e) {
          log('Could not save to sessionStorage:', e);
        }

        // Redirect to thank you page
        window.location.href = CONFIG.THANK_YOU_URL;

      } else {
        // API returned error
        throw new Error(result.message || 'Submission failed');
      }

    } catch (error) {
      log('❌ Error:', error);

      // Show user-friendly error message
      let errorMessage = 'Es gab ein Problem bei der Übermittlung. Bitte versuchen Sie es erneut.';

      if (error.message) {
        if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          errorMessage = 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.';
        } else if (error.message.includes('INVALID_HOTEL')) {
          errorMessage = 'Hotel wurde nicht gefunden. Bitte kontaktieren Sie den Support.';
        } else if (error.message.includes('VALIDATION_ERROR')) {
          errorMessage = 'Bitte überprüfen Sie Ihre Eingaben.';
        }
      }

      showError(form, errorMessage);

      // Re-enable submit button
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  function initializeBookingForm() {
    log('🚀 Initializing booking form adapter');

    // Find the booking form
    // Adjust this selector to match your Webflow form
    const form = document.querySelector('form[data-name="booking-form"]') ||
                 document.querySelector('.booking-form') ||
                 document.querySelector('form');

    if (!form) {
      log('⚠️ Booking form not found');
      return;
    }

    log('✓ Found form:', form);

    // Find submit button
    const submitButton = form.querySelector('[type="submit"]') ||
                        form.querySelector('button[type="submit"]') ||
                        form.querySelector('.submit-button');

    if (!submitButton) {
      log('⚠️ Submit button not found');
      return;
    }

    log('✓ Found submit button:', submitButton);

    // Override form submission
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      log('📝 Form submitted');

      const formData = new FormData(form);
      await submitToWorker(formData, submitButton, form);
    });

    log('✓ Form adapter initialized');
  }

  // ============================================================================
  // THANK YOU PAGE (Optional)
  // ============================================================================

  function initializeThankYouPage() {
    // Only run on thank you page
    if (!window.location.pathname.includes('danke') &&
        !window.location.pathname.includes('thank-you')) {
      return;
    }

    log('📄 Thank you page detected');

    try {
      const requestId = sessionStorage.getItem('bookingRequestId');

      if (requestId) {
        log('✓ Booking Request ID:', requestId);

        // Find element to display request ID (optional)
        const requestIdElement = document.querySelector('[data-request-id]') ||
                                document.getElementById('request-id');

        if (requestIdElement) {
          requestIdElement.textContent = requestId;
          log('✓ Displayed request ID on page');
        }

        // Clear from session storage
        sessionStorage.removeItem('bookingRequestId');
      }
    } catch (e) {
      log('Could not access sessionStorage:', e);
    }
  }

  // ============================================================================
  // AUTO-START
  // ============================================================================

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initializeBookingForm();
      initializeThankYouPage();
    });
  } else {
    initializeBookingForm();
    initializeThankYouPage();
  }

  log('✓ Adapter loaded and ready');

})();
