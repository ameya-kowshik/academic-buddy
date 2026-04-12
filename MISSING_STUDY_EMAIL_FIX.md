# Why You Didn't Receive the Study Report Email

## Quick Answer

The most likely reason is: **BREVO_API_KEY is not set or invalid in your `.env` file**

## What You Received
- ✅ 2 Reflection reports (weekly + monthly)
- ✅ 1 Productivity report (weekly)
- ❌ 0 Study reports (weekly) ← MISSING

## Why This Happens

All three agents (Productivity Analyst, Study Companion, Reflection) run when you execute `demo-run-agents.mjs`. They all try to send emails, but the Study Companion email might fail silently if:

1. **Email service not configured** - Missing or invalid `BREVO_API_KEY`
2. **No study data in last 7 days** - No quiz attempts or flashcard sessions (unlikely with demo seed)
3. **Email notifications disabled** - `emailNotificationsEnabled` is false (demo seed enables this)
4. **Email delivery failure** - Brevo API error, invalid sender email, or spam filtering

## How to Diagnose

Run this diagnostic script:

```bash
cd academic-buddy
node scripts/diagnose-study-email.mjs your@email.com
```

This will check:
- ✓ User exists and notifications are enabled
- ✓ Quiz/flashcard data exists in last 7 days
- ✓ Email service is configured (BREVO_API_KEY)
- ✓ Recent agent outputs

## How to Fix

### Fix 1: Configure Email Service (Most Likely)

Check if `BREVO_API_KEY` is set:

```bash
grep BREVO_API_KEY academic-buddy/.env
```

If missing, add it:

```bash
# Add to academic-buddy/.env
BREVO_API_KEY=your_brevo_api_key_here
BREVO_FROM_EMAIL=noreply@yourdomain.com
```

Then re-run agents:

```bash
node scripts/demo-run-agents.mjs your@email.com
```

### Fix 2: Check Server Console

When running `demo-run-agents.mjs`, watch the terminal where `npm run dev` is running. Look for errors like:

```
[EmailService] Failed to send study report: Error: BREVO_API_KEY is not set
```

or

```
[EmailService] Failed to send study report: Error: Invalid API key
```

### Fix 3: Verify Brevo Account

If BREVO_API_KEY is set but emails still don't send:

1. Log into your Brevo account
2. Check API key is valid (Settings → API Keys)
3. Verify sender email is confirmed (Senders → Verify)
4. Check account has sending credits
5. Look at Logs → Transactional Emails for delivery status

### Fix 4: Check Spam Folder

The email might have been delivered but filtered to spam. Check your spam/junk folder for:
- Subject: "Your Weekly Study Report — X quizzes completed"
- From: The email you set in `BREVO_FROM_EMAIL`

## Understanding the Code

The Study Companion agent runs and tries to send email here:

```typescript
// src/lib/agents/StudyCompanionAgent.ts (line 343)
async executeWeeklyTrigger(input) {
  // ... analyze quiz and flashcard data ...
  
  // Send weekly study email (fire-and-forget)
  void this.emailService.sendWeeklyStudyReport(input.userId, content);
  
  return weeklyOutput;
}
```

The email service checks conditions before sending:

```typescript
// src/lib/agents/core/EmailService.ts (line 178)
async sendWeeklyStudyReport(userId, data) {
  const prefs = await this.getUserEmailPrefs(userId);
  
  // Check 1: User exists and notifications enabled
  if (!prefs || !prefs.notificationsEnabled) return;
  
  // Build email HTML...
  
  try {
    // Check 2: Brevo API key is set
    await this.send(prefs.email, prefs.name, subject, html);
  } catch (err) {
    // Fails silently, only logs to console
    console.error('[EmailService] Failed to send study report:', err);
  }
}
```

## Expected Data from Demo Seed

The demo seed creates quiz attempts on these days:
- Quiz 1: Days 13, 11, 8, 5, 2
- Quiz 2: Days 12, 9, 6, 3, 1
- Quiz 3: Days 11, 8, 5, 3, 1

**In last 7 days:** Days 6, 5, 3, 2, 1 = 6-8 quiz attempts ✅

Flashcard sessions on days: 7, 6, 5, 4, 3, 2, 1 = 10 sessions ✅

So there SHOULD be enough data for the email.

## Test Email Service Directly

To verify your email service works:

```bash
node scripts/test-email.mjs your@email.com
```

This sends a test email directly, bypassing the agent system.

## Alternative: Use Resend Instead of Brevo

If Brevo isn't working, you can switch to Resend:

1. Sign up at resend.com
2. Get API key
3. Update `.env`:
   ```bash
   RESEND_API_KEY=re_your_key_here
   EMAIL_FROM=noreply@yourdomain.com
   ```
4. Update `EmailService.ts` to use Resend SDK instead of Brevo

## Still Not Working?

If you've tried everything and still don't receive the email:

1. **Check the diagnostic output** - Run `diagnose-study-email.mjs` and share the output
2. **Check server logs** - Look for any errors when agents run
3. **Verify data exists** - Confirm quiz attempts exist in last 7 days
4. **Test with different email** - Try a different email address
5. **Check Brevo dashboard** - See if emails are being sent but not delivered

## Quick Verification Checklist

Before your demo, verify:

- [ ] `BREVO_API_KEY` is set in `.env`
- [ ] `BREVO_FROM_EMAIL` is set and verified in Brevo
- [ ] Run diagnostic: `node scripts/diagnose-study-email.mjs your@email.com`
- [ ] All checks pass (user found, data exists, email configured)
- [ ] Re-run agents: `node scripts/demo-run-agents.mjs your@email.com`
- [ ] Check server console for errors
- [ ] Check email inbox (and spam folder)
- [ ] Verify in Brevo dashboard that email was sent

---

**TL;DR:** The Study Companion agent runs but the email fails silently. Most likely cause: `BREVO_API_KEY` not set in `.env`. Run the diagnostic script to confirm, then add the API key and re-run agents.
