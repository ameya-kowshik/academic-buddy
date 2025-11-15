# Sentry Troubleshooting Guide

## Changes Made

I've updated your configuration to enable Sentry in development:

1. ✅ Added `SENTRY_ENABLE_DEV=true` to `.env`
2. ✅ Enabled debug mode in `sentry.server.config.ts`
3. ✅ Enabled debug mode in `sentry.client.config.ts`

## Testing Steps

### Step 1: Restart Your Dev Server

**IMPORTANT:** You must restart the server for the changes to take effect.

```bash
# Stop the current server (Ctrl+C or Cmd+C)
# Then start it again:
npm run dev
```

### Step 2: Watch the Console Output

When the server starts, you should see Sentry debug messages like:

```
[Sentry] SDK successfully initialized
[Sentry] DSN: https://98d0b86d70d3a52fc8dda346d1a9253a@o4510367240028160.ingest.us.sentry.io/4510367249793024
```

### Step 3: Trigger a Test Error

In a new terminal window:

```bash
curl http://localhost:3000/api/sentry-test
```

### Step 4: Check Console for Sentry Debug Output

Look for messages like:

```
[Sentry] Sending event to Sentry...
[Sentry] Event sent successfully
```

If you see these messages, Sentry is working!

### Step 5: Check Sentry Dashboard

1. Go to: https://sentry.io/
2. Click on your project
3. Go to **Issues** in the left sidebar
4. Wait 10-30 seconds and refresh the page
5. You should see: **"Test error for Sentry monitoring"**

## Common Issues & Solutions

### Issue 1: No Debug Messages in Console

**Problem:** Server starts but no Sentry debug messages appear

**Solution:**
- Make sure you restarted the server after changing `.env`
- Check that `SENTRY_DSN` is set correctly in `.env`
- Verify the DSN format: `https://[key]@[org].ingest.sentry.io/[project]`

### Issue 2: "Event filtered by beforeSend"

**Problem:** Console shows event was filtered

**Solution:**
- This means `SENTRY_ENABLE_DEV` is not being read
- Double-check the `.env` file has `SENTRY_ENABLE_DEV=true`
- Restart the server

### Issue 3: Network Error

**Problem:** Console shows network error when sending to Sentry

**Solution:**
- Check your internet connection
- Verify the Sentry DSN is correct
- Try accessing the Sentry URL in your browser

### Issue 4: Error Appears in Console but Not in Dashboard

**Problem:** Sentry says "Event sent successfully" but nothing in dashboard

**Solution:**
- Wait 1-2 minutes (sometimes there's a delay)
- Check you're looking at the correct project in Sentry
- Check the environment filter in Sentry (should show "development")
- Verify your Sentry account has the correct permissions

## Alternative Test: Use the Example Error Handler

Try this endpoint which has more detailed error handling:

```bash
curl http://localhost:3000/api/example-error-handling
```

This will trigger multiple types of errors and log detailed information.

## Verify Sentry Configuration

Check that your Sentry DSN is correct:

```bash
# In your terminal, run:
echo $SENTRY_DSN
# or on Windows:
echo %SENTRY_DSN%
```

Should output:
```
https://98d0b86d70d3a52fc8dda346d1a9253a@o4510367240028160.ingest.us.sentry.io/4510367249793024
```

## Manual Test in Code

If the endpoint test doesn't work, try adding this to any API route:

```typescript
import * as Sentry from '@sentry/nextjs';

// Add this line anywhere in your route handler:
Sentry.captureMessage('Manual test from code', 'info');
```

## Disable Debug Mode After Testing

Once Sentry is working, disable debug mode to reduce console noise:

1. In `sentry.server.config.ts`: Change `debug: true` back to `debug: false`
2. In `sentry.client.config.ts`: Change `debug: true` back to `debug: false`
3. Keep `SENTRY_ENABLE_DEV=true` if you want to continue seeing errors in development

## Production Configuration

For production, remove these from `.env`:
- Remove `SENTRY_ENABLE_DEV=true`
- Keep `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN`

Sentry will automatically capture all errors in production.

## Need More Help?

If you're still having issues, check:

1. **Server Console Output** - Look for any Sentry-related errors
2. **Browser Console** - Check for client-side Sentry errors
3. **Network Tab** - Look for requests to `sentry.io` (should see POST requests)
4. **Sentry Project Settings** - Verify the project is active and DSN is correct

## Quick Checklist

- [ ] Added `SENTRY_ENABLE_DEV=true` to `.env`
- [ ] Restarted dev server
- [ ] Saw Sentry initialization messages in console
- [ ] Triggered test error with curl
- [ ] Saw "Event sent successfully" in console
- [ ] Checked Sentry dashboard after 30 seconds
- [ ] Error appeared in Sentry Issues

If all checkboxes are checked, Sentry is working correctly! ✅
