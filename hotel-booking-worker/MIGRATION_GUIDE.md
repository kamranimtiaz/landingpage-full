# Migration Guide: Single hotel_code Field

## Overview
This migration consolidates hotel identification to use a single `hotel_code` field instead of separate `hotel_id` and `hotel_code` fields.

## What Changed

### Before
- **Two fields**: `hotel_id` (for URLs) and `hotel_code` (for AlpineBits)
- Form attribute: `data-hotel-id="hotel-grand-austria"`
- URL: `/submit/hotel-grand-austria`
- Database: Separate columns for both fields

### After
- **One field**: `hotel_code` (for both URLs and AlpineBits)
- Form attribute: `data-hotel-code="GHA001"` (or `data-hotel-id` still works)
- URL: `/submit/GHA001`
- Database: Only `hotel_code` column

## Migration Steps

### 1. Run Database Migration

```bash
# Local development
wrangler d1 execute hotel-booking-db --local --file=./migrations/0002_remove_hotel_id.sql

# Production
wrangler d1 execute hotel-booking-db --file=./migrations/0002_remove_hotel_id.sql
```

This migration will:
- Create new tables without `hotel_id`
- Migrate existing data (maps `hotel_id` → `hotel_code`)
- Drop old tables
- Recreate indexes

### 2. Update Webflow Forms

**Old form attribute:**
```html
<form data-hotel-id="hotel-grand-austria">
```

**New form attribute (recommended):**
```html
<form data-hotel-code="GHA001">
```

**Backward compatible (still works):**
```html
<form data-hotel-id="GHA001">
```

The frontend code supports both `data-hotel-code` and `data-hotel-id` for backward compatibility.

### 3. Update Hotel URLs

**Before:**
- Form submits to: `/submit/hotel-grand-austria`

**After:**
- Form submits to: `/submit/GHA001`

The URL now uses the hotel code directly.

### 4. Deploy Updated Code

```bash
# Deploy to Cloudflare Workers
pnpm run deploy
```

## Breaking Changes

### Database Schema
- `hotels.hotel_id` column removed
- `guest_requests.hotel_id` column removed (replaced with `hotel_code`)

### API
- The route `/submit/:hotelId` still exists but now expects a hotel code
- The parameter name `hotelId` is kept for backward compatibility, but it now contains the hotel code

## Rollback Plan

If you need to rollback:

1. Revert code to previous version
2. You'll need to recreate the old schema manually (migration is one-way)
3. Not recommended - instead, update your Webflow forms with hotel codes

## Benefits

1. **Simpler**: One field instead of two
2. **Less confusion**: No need to maintain two separate identifiers
3. **Easier maintenance**: Update hotel code in one place
4. **Cleaner URLs**: `/submit/GHA001` is cleaner than `/submit/hotel-grand-austria`

## FAQ

**Q: Can I still use the old `data-hotel-id` attribute?**
A: Yes! The frontend supports both `data-hotel-code` and `data-hotel-id` for backward compatibility.

**Q: What if I have URL-friendly slugs in my Webflow pages?**
A: You can use URL-friendly codes like `grand-hotel-alpen` instead of `GHA001` if preferred. The `hotel_code` can be any unique string.

**Q: Will existing booking requests still work?**
A: Yes! The migration preserves all existing guest requests by mapping them to the corresponding hotel code.

**Q: Do I need to update the AlpineBits configuration?**
A: No changes needed. The same `hotel_code` is still sent to the ASA system.
