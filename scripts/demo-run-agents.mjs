/**
 * Demo agent trigger script — fires all 3 agents for your user and sends emails.
 * Requires the dev server to be running: npm run dev
 *
 * Usage:
 *   node scripts/demo-run-agents.mjs <your@email.com>
 *
 * Run from the academic-buddy directory.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Load .env
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
  console.error('Could not read .env — run from the academic-buddy directory');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Validate
// ---------------------------------------------------------------------------
const EMAIL = process.argv[2];
if (!EMAIL || !EMAIL.includes('@')) {
  console.error('Usage: node scripts/demo-run-agents.mjs <your@email.com>');
  process.exit(1);
}

const CRON_SECRET = process.env.CRON_SECRET;
if (!CRON_SECRET) {
  console.error('❌ CRON_SECRET is not set in .env');
  process.exit(1);
}

const APP_URL = 'http://localhost:3000';

// ---------------------------------------------------------------------------
// Trigger
// ---------------------------------------------------------------------------
async function triggerAgents() {
  console.log(`\n🤖 Academic Buddy — Agent Trigger`);
  console.log(`   Target: ${EMAIL}`);
  console.log(`   Server: ${APP_URL}\n`);

  // Check server is up
  try {
    await fetch(`${APP_URL}/api/health`).catch(() => {
      throw new Error('Server not reachable');
    });
  } catch {
    // Health endpoint may not exist — try the trigger directly
  }

  async function trigger(type) {
    let res;
    try {
      res = await fetch(`${APP_URL}/api/agents/scheduled-trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-cron-secret': CRON_SECRET },
        body: JSON.stringify({ type }),
      });
    } catch {
      console.error('\n❌ Could not reach the server.');
      console.error('   Make sure "npm run dev" is running in another terminal.\n');
      process.exit(1);
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error(`\n❌ ${type} trigger failed (${res.status}):`, JSON.stringify(body));
      if (res.status === 401) console.error('   Check CRON_SECRET in .env.');
      process.exit(1);
    }
    return body;
  }

  console.log('  [1/2] Triggering weekly agents (Productivity Analyst + Study Companion + Reflection)...');
  const weekly = await trigger('weekly');
  console.log(`  ✅ Weekly triggered — ${weekly.userCount ?? '?'} user(s)`);

  // Small gap to avoid dedup window collision
  await new Promise((r) => setTimeout(r, 2000));

  console.log('  [2/2] Triggering monthly agents (Reflection — monthly summary)...');
  const monthly = await trigger('monthly');
  console.log(`  ✅ Monthly triggered — ${monthly.userCount ?? '?'} user(s)`);

  console.log('\n  Agents run asynchronously. Give it ~15 seconds, then check:');
  console.log('  → Your inbox for 4 emails:');
  console.log('     • Weekly Productivity Report');
  console.log('     • Weekly Study Report');
  console.log('     • Weekly Reflection');
  console.log('     • Monthly Reflection');
  console.log('  → Agent dashboards in the app\n');

  await new Promise((r) => setTimeout(r, 3000));
  console.log('  Done. Check your inbox!\n');
}

triggerAgents().catch((err) => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
