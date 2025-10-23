# Webflow Integration Guide

## Overview

This guide shows how to integrate your Webflow landing pages with the Cloudflare Worker API.

## Current Webflow Form Structure

Your existing Webflow form submits data using FormData. We need to modify it to:
1. Extract form data into JSON format
2. Send to the Worker API endpoint
3. Handle the response

## Step 1: Update Your Webflow Script

Add this configuration at the top of your `script.js`:

```javascript
// Cloudflare Worker API Configuration
const WORKER_API_URL = 'https://hotel-booking-worker.YOUR_SUBDOMAIN.workers.dev';

// Hotel ID mapping - update based on your hotel structure
const HOTEL_ID_MAP = {
  'grand-hotel-alpen': 'hotel-1',
  'mountain-view-resort': 'hotel-2',
  'luxury-spa-hotel': 'hotel-3',
  // Add all your 50+ hotels here
};

// Get hotel ID from page URL or data attribute
function getCurrentHotelId() {
  // Option 1: From page URL
  const urlParts = window.location.pathname.split('/');
  const hotelSlug = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
  return HOTEL_ID_MAP[hotelSlug] || 'hotel-1'; // fallback to hotel-1

  // Option 2: From body data attribute
  // return document.body.getAttribute('data-hotel-id') || 'hotel-1';
}
```

## Step 2: Replace Form Submission Handler

Find your current form submission code (around line 2177) and replace it with:

```javascript
// OLD CODE (remove this):
// fetch(myForm.action, {
//   method: myForm.method || "POST",
//   body: new FormData(myForm),
//   headers: { Accept: "application/json" },
// })

// NEW CODE:
async function submitBookingRequest(formData) {
  const hotelId = getCurrentHotelId();
  const apiUrl = `${WORKER_API_URL}/submit/${hotelId}`;

  // Extract form data
  const requestData = {
    Sprache: formData.get('Sprache') || Locale.get(),
    period: formData.get('period'),
    Erwachsene: formData.get('Erwachsene'),
    Kinder: formData.get('Kinder'),
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

  try {
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
      console.log('Booking request submitted successfully:', result.requestId);
      // Store request ID if needed
      sessionStorage.setItem('bookingRequestId', result.requestId);
      // Redirect to thank you page
      window.location.href = thankYouURL;
    } else {
      throw new Error(result.message || 'Submission failed');
    }
  } catch (error) {
    console.error('Error submitting booking request:', error);
    // Show error to user
    alert('Es gab ein Problem bei der Übermittlung. Bitte versuchen Sie es erneut.');
    // Re-enable submit button
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  }
}

// Replace your form submit event listener with:
myForm.addEventListener('submit', async function(e) {
  e.preventDefault();

  // Disable submit button
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Bitte warten...";
  }

  const formData = new FormData(myForm);
  await submitBookingRequest(formData);
});
```

## Step 3: Field Name Mapping

Ensure your Webflow form fields have these exact names:

| Form Field Name | Description | Example Value |
|----------------|-------------|---------------|
| `Sprache` | Language | `"de"` |
| `period` | Date range | `"2025-10-05 - 2025-10-24"` |
| `Erwachsene` | Adults count | `"3 Erwachsene"` |
| `Kinder` | Children count | `"3 Kinder"` |
| `Alter-Kind-1` | Child 1 age | `"10 Jahre"` |
| `Alter-Kind-2` | Child 2 age | `"3 Jahre"` |
| `Alter-Kind-3` | Child 3 age | `"12 Jahre"` |
| `selected-room` | Room type | `"Deluxe Suite"` |
| `Anrede` | Salutation | `"Herr"` or `"Frau"` |
| `Vorname` | First name | `"Kamran"` |
| `Nachname` | Last name | `"Imtiaz"` |
| `Telefonnummer` | Phone | `"017669876485"` |
| `E-Mail-Adresse` | Email | `"kamran@example.com"` |
| `Anmerkung` | Comments | `"Late check-in please"` |

## Step 4: Hotel ID Configuration

### Option A: URL-based Hotel ID

If each hotel has a unique URL path:
- `example.com/hotels/grand-hotel-alpen` → `hotel-1`
- `example.com/hotels/mountain-view-resort` → `hotel-2`

Update `HOTEL_ID_MAP` with all hotel slugs.

### Option B: Data Attribute

Add a data attribute to each hotel page's body tag:

```html
<body data-hotel-id="hotel-1">
```

Then use:
```javascript
function getCurrentHotelId() {
  return document.body.getAttribute('data-hotel-id') || 'hotel-1';
}
```

### Option C: Webflow CMS Collection

If using Webflow CMS for hotels:

```javascript
function getCurrentHotelId() {
  // Get from CMS field embedded in page
  const hotelIdElement = document.querySelector('[data-hotel-id]');
  return hotelIdElement?.getAttribute('data-hotel-id') || 'hotel-1';
}
```

## Step 5: Testing

### Test Locally (before deploying Worker)

1. Comment out the actual fetch call
2. Log the data instead:

```javascript
console.log('Would send to:', apiUrl);
console.log('Data:', requestData);
// return; // Skip actual submission for testing
```

### Test with Deployed Worker

1. Deploy your Worker
2. Update `WORKER_API_URL` with your actual Worker URL
3. Submit a test form
4. Check browser console for logs
5. Verify in D1 database:

```bash
wrangler d1 execute hotel-booking-db --command "SELECT * FROM guest_requests ORDER BY created_at DESC LIMIT 1"
```

## Step 6: Error Handling

Add better error messages for different scenarios:

```javascript
async function submitBookingRequest(formData) {
  // ... existing code ...

  try {
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
      console.log('Booking request submitted:', result.requestId);
      sessionStorage.setItem('bookingRequestId', result.requestId);
      window.location.href = thankYouURL;
    } else {
      // Handle specific error types
      let errorMessage = 'Es gab ein Problem bei der Übermittlung.';

      if (result.error === 'INVALID_HOTEL') {
        errorMessage = 'Hotel wurde nicht gefunden.';
      } else if (result.error === 'VALIDATION_ERROR') {
        errorMessage = `Überprüfen Sie Ihre Eingaben: ${result.message}`;
      }

      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('Submission error:', error);

    // Show user-friendly error
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = error.message;
    errorDiv.style.cssText = 'color: red; padding: 10px; margin: 10px 0; border: 1px solid red; border-radius: 4px;';

    myForm.insertBefore(errorDiv, myForm.firstChild);

    // Remove error after 5 seconds
    setTimeout(() => errorDiv.remove(), 5000);

    // Re-enable submit button
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText || 'Anfrage senden';
    }
  }
}
```

## Step 7: Success Page Enhancement

On your thank you page, you can retrieve the request ID:

```javascript
// On thank-you page
document.addEventListener('DOMContentLoaded', function() {
  const requestId = sessionStorage.getItem('bookingRequestId');

  if (requestId) {
    console.log('Booking request ID:', requestId);

    // Optionally display it to the user
    const requestIdElement = document.getElementById('request-id');
    if (requestIdElement) {
      requestIdElement.textContent = requestId;
    }

    // Clear from session storage
    sessionStorage.removeItem('bookingRequestId');
  }
});
```

## Complete Integration Checklist

- [ ] Update `WORKER_API_URL` with deployed Worker URL
- [ ] Configure `HOTEL_ID_MAP` with all hotel mappings
- [ ] Verify all form field names match expected values
- [ ] Test hotel ID detection (URL/data-attribute/CMS)
- [ ] Add error handling UI
- [ ] Test form submission with real data
- [ ] Verify data appears in D1 database
- [ ] Test error scenarios (invalid hotel, validation errors)
- [ ] Update CORS settings in Worker if needed
- [ ] Configure thank you page to show request ID
- [ ] Test on all hotel landing pages

## Troubleshooting

### Issue: "Hotel not found" error
- Check `getCurrentHotelId()` returns correct ID
- Verify hotel exists in D1 database
- Check `HOTEL_ID_MAP` mapping

### Issue: CORS error
- Update Worker CORS settings in `src/index.ts`
- Add your Webflow domain to allowed origins

### Issue: Validation errors
- Check form field values match expected format
- Verify date format: "YYYY-MM-DD - YYYY-MM-DD"
- Verify adult/children format: "X Erwachsene", "X Kinder"
- Verify child age format: "X Jahre"

### Issue: Form submits but no data in database
- Check Worker logs: `wrangler tail`
- Verify D1 database connection in `wrangler.toml`
- Check database for errors:
  ```bash
  wrangler d1 execute hotel-booking-db --command "SELECT * FROM request_logs ORDER BY created_at DESC LIMIT 10"
  ```

## Next Steps

1. Deploy Worker to production
2. Update all hotel landing pages with integration code
3. Test each hotel's form submission
4. Monitor Worker logs for errors
5. Coordinate with ASA for AlpineBits integration
