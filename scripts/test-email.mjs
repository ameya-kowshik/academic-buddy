/**
 * Standalone email test script — no DB, no Next.js, no Prisma.
 * Sends one of each email type directly via the Brevo API.
 *
 * Usage:
 *   node scripts/test-email.mjs <recipient@email.com> [productivity|study|reflection]
 *
 * Examples:
 *   node scripts/test-email.mjs you@gmail.com
 *   node scripts/test-email.mjs you@gmail.com study
 *
 * Reads BREVO_API_KEY and BREVO_FROM_EMAIL from .env automatically.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Load .env manually (no dotenv dependency needed)
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');

try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !process.env[key]) process.env[key] = val;
  }
} catch {
  console.error('Could not read .env file — make sure you run this from the academic-buddy directory');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Validate env
// ---------------------------------------------------------------------------
const API_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.BREVO_FROM_EMAIL;

if (!API_KEY || API_KEY === 'your_brevo_api_key') {
  console.error('❌  BREVO_API_KEY is not set in .env');
  process.exit(1);
}
if (!FROM_EMAIL || FROM_EMAIL === 'you@youremail.com') {
  console.error('❌  BREVO_FROM_EMAIL is not set in .env');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const TO_EMAIL = process.argv[2];
const EMAIL_TYPE = process.argv[3] ?? 'all'; // productivity | study | reflection | all

if (!TO_EMAIL || !TO_EMAIL.includes('@')) {
  console.error('Usage: node scripts/test-email.mjs <recipient@email.com> [productivity|study|reflection|all]');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Brevo send helper (raw fetch — no SDK needed for a test script)
// ---------------------------------------------------------------------------
async function sendEmail(subject, html) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      sender: { email: FROM_EMAIL, name: 'Veyra (Test)' },
      to: [{ email: TO_EMAIL, name: 'Test Recipient' }],
      subject,
      htmlContent: html,
    }),
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(`Brevo API error ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

function productivityHtml() {
  return `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="background:#0f172a;color:#e2e8f0;font-family:sans-serif;padding:32px;max-width:600px;margin:0 auto;">
  <h1 style="color:#38bdf8;">Weekly Productivity Report</h1>
  <p style="color:#64748b;">Hi Test User, here's your focus summary.</p>
  <div style="background:#1e293b;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
    <p style="color:#94a3b8;margin:0 0 8px;">Weekly Score</p>
    <p style="font-size:48px;font-weight:bold;color:#10b981;margin:0;">78</p>
    <p style="color:#64748b;margin:4px 0 0;">📈 INCREASING</p>
  </div>
  <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:16px;">
    <h3 style="color:#e2e8f0;margin-top:0;">Week-over-Week</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:6px 0;color:#94a3b8;">Focus Hours</td><td style="text-align:right;color:#10b981;">+15%</td></tr>
      <tr><td style="padding:6px 0;color:#94a3b8;">Sessions</td><td style="text-align:right;color:#10b981;">+2%</td></tr>
      <tr><td style="padding:6px 0;color:#94a3b8;">Avg Focus Score</td><td style="text-align:right;color:#ef4444;">-3%</td></tr>
    </table>
  </div>
  <a href="${APP_URL}/focus/analytics" style="display:inline-block;background:#0ea5e9;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">View Full Report →</a>
  <p style="color:#334155;font-size:12px;margin-top:32px;">Test email — <a href="${APP_URL}/profile" style="color:#475569;">Manage preferences</a></p>
</body></html>`;
}

function studyHtml() {
  return `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="background:#0f172a;color:#e2e8f0;font-family:sans-serif;padding:32px;max-width:600px;margin:0 auto;">
  <h1 style="color:#818cf8;">Weekly Study Report</h1>
  <p style="color:#64748b;">Hi Test User, here's your study activity this week.</p>
  <div style="display:flex;gap:12px;margin:24px 0;">
    <div style="flex:1;background:#1e293b;border-radius:12px;padding:16px;text-align:center;">
      <p style="color:#94a3b8;margin:0 0 4px;font-size:12px;">Quizzes</p>
      <p style="font-size:28px;font-weight:bold;color:#818cf8;margin:0;">5</p>
    </div>
    <div style="flex:1;background:#1e293b;border-radius:12px;padding:16px;text-align:center;">
      <p style="color:#94a3b8;margin:0 0 4px;font-size:12px;">Avg Score</p>
      <p style="font-size:28px;font-weight:bold;color:#10b981;margin:0;">72%</p>
    </div>
    <div style="flex:1;background:#1e293b;border-radius:12px;padding:16px;text-align:center;">
      <p style="color:#94a3b8;margin:0 0 4px;font-size:12px;">Flashcard Min</p>
      <p style="font-size:28px;font-weight:bold;color:#38bdf8;margin:0;">45</p>
    </div>
  </div>
  <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:24px;">
    <h3 style="color:#e2e8f0;margin-top:0;">Topics Needing Attention</h3>
    <ul style="padding-left:20px;margin:0;">
      <li style="color:#fbbf24;">Neural Networks</li>
      <li style="color:#fbbf24;">Backpropagation</li>
    </ul>
  </div>
  <a href="${APP_URL}/study/analytics" style="display:inline-block;background:#818cf8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">View Study Analytics →</a>
  <p style="color:#334155;font-size:12px;margin-top:32px;">Test email — <a href="${APP_URL}/profile" style="color:#475569;">Manage preferences</a></p>
</body></html>`;
}

function reflectionHtml() {
  return `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="background:#0f172a;color:#e2e8f0;font-family:sans-serif;padding:32px;max-width:600px;margin:0 auto;">
  <h1 style="color:#a78bfa;">Weekly Reflection</h1>
  <p style="color:#64748b;">Hi Test User — Apr 1 to Apr 7, 2026</p>
  <div style="display:flex;gap:12px;margin:24px 0;flex-wrap:wrap;">
    <div style="flex:1;min-width:100px;background:#1e293b;border-radius:12px;padding:16px;text-align:center;">
      <p style="color:#94a3b8;margin:0 0 4px;font-size:12px;">Focus Hours</p>
      <p style="font-size:24px;font-weight:bold;color:#38bdf8;margin:0;">12.5</p>
    </div>
    <div style="flex:1;min-width:100px;background:#1e293b;border-radius:12px;padding:16px;text-align:center;">
      <p style="color:#94a3b8;margin:0 0 4px;font-size:12px;">Quizzes</p>
      <p style="font-size:24px;font-weight:bold;color:#818cf8;margin:0;">5</p>
    </div>
    <div style="flex:1;min-width:100px;background:#1e293b;border-radius:12px;padding:16px;text-align:center;">
      <p style="color:#94a3b8;margin:0 0 4px;font-size:12px;">Avg Quiz Score</p>
      <p style="font-size:24px;font-weight:bold;color:#10b981;margin:0;">72%</p>
    </div>
  </div>
  <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:16px;">
    <h3 style="color:#10b981;margin-top:0;">✨ Highlights</h3>
    <ul style="padding-left:20px;margin:0;">
      <li style="margin-bottom:6px;color:#94a3b8;">Logged 12.5 hours of focused work this week.</li>
      <li style="margin-bottom:6px;color:#94a3b8;">Completed 5 quizzes with an average score of 72%.</li>
    </ul>
  </div>
  <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:16px;">
    <h3 style="color:#38bdf8;margin-top:0;">🔍 Patterns</h3>
    <ul style="padding-left:20px;margin:0;">
      <li style="margin-bottom:6px;color:#94a3b8;">Strong positive correlation (r=0.72) between daily focus hours and quiz scores.</li>
    </ul>
  </div>
  <a href="${APP_URL}/profile" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">View Full Reflection →</a>
  <p style="color:#334155;font-size:12px;margin-top:32px;">Test email — <a href="${APP_URL}/profile" style="color:#475569;">Manage preferences</a></p>
</body></html>`;
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
const tests = {
  productivity: { subject: '[TEST] Weekly Productivity Report — Score: 78/100', html: productivityHtml() },
  study:        { subject: '[TEST] Weekly Study Report — 5 quizzes completed',  html: studyHtml() },
  reflection:   { subject: '[TEST] Weekly Reflection — Apr 1 to Apr 7, 2026',   html: reflectionHtml() },
};

const toRun = EMAIL_TYPE === 'all' ? Object.keys(tests) : [EMAIL_TYPE];

if (toRun.some((t) => !tests[t])) {
  console.error(`Unknown type "${EMAIL_TYPE}". Valid: productivity, study, reflection, all`);
  process.exit(1);
}

console.log(`\nSending to: ${TO_EMAIL}`);
console.log(`From:       ${FROM_EMAIL}`);
console.log(`Types:      ${toRun.join(', ')}\n`);

for (const type of toRun) {
  const { subject, html } = tests[type];
  process.stdout.write(`  ${type.padEnd(14)} ... `);
  try {
    const result = await sendEmail(subject, html);
    console.log(`✅  sent (messageId: ${result.messageId ?? 'n/a'})`);
  } catch (err) {
    console.log(`❌  failed`);
    console.error(`     ${err.message}`);
  }
}

console.log('\nDone. Check your inbox (and spam folder).\n');
