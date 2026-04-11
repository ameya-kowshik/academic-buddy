/**
 * Account reset script — wipes ALL data for a user account, leaving it
 * in a brand-new state (as if they just signed up).
 *
 * The user record itself is preserved so you can log back in immediately.
 *
 * Usage:
 *   node scripts/reset-account.mjs <your@email.com>
 *
 * Run from the academic-buddy directory.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

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

const prisma = new PrismaClient();

const EMAIL = process.argv[2];

if (!EMAIL || !EMAIL.includes('@')) {
  console.error('Usage: node scripts/reset-account.mjs <your@email.com>');
  process.exit(1);
}

async function main() {
  console.log(`\n🧹 Academic Buddy — Account Reset`);
  console.log(`   Email: ${EMAIL}\n`);

  const user = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (!user) {
    console.error(`❌ No user found with email "${EMAIL}".`);
    process.exit(1);
  }

  const userId = user.id;
  console.log(`✅ Found user: ${user.name ?? EMAIL} (${userId})`);
  console.log('   Wiping all data...\n');

  // Delete in dependency order (children before parents)
  const [agentOutputs]    = await Promise.all([prisma.agentOutput.deleteMany({ where: { userId } })]);
  const [agentExecutions] = await Promise.all([prisma.agentExecution.deleteMany({ where: { userId } })]);
  const [flashcardSessions] = await Promise.all([prisma.flashcardSession.deleteMany({ where: { userId } })]);
  const [flashcards]      = await Promise.all([prisma.flashcard.deleteMany({ where: { userId } })]);
  const [analytics]       = await Promise.all([prisma.analytics.deleteMany({ where: { userId } })]);
  const [focusSessions]   = await Promise.all([prisma.pomodoroLog.deleteMany({ where: { userId } })]);
  const [tags]            = await Promise.all([prisma.tag.deleteMany({ where: { userId } })]);
  // Quizzes cascade-delete their questions, attempts, and question attempts
  const [quizzes]         = await Promise.all([prisma.quiz.deleteMany({ where: { userId } })]);
  const [materials]       = await Promise.all([prisma.sourceMaterial.deleteMany({ where: { userId } })]);

  // Reset user profile flags back to defaults
  await prisma.user.update({
    where: { id: userId },
    data: { emailNotificationsEnabled: false },
  });

  console.log(`   agent outputs deleted:     ${agentOutputs.count}`);
  console.log(`   agent executions deleted:  ${agentExecutions.count}`);
  console.log(`   flashcard sessions deleted:${flashcardSessions.count}`);
  console.log(`   flashcards deleted:        ${flashcards.count}`);
  console.log(`   analytics records deleted: ${analytics.count}`);
  console.log(`   focus sessions deleted:    ${focusSessions.count}`);
  console.log(`   tags deleted:              ${tags.count}`);
  console.log(`   quizzes deleted:           ${quizzes.count}`);
  console.log(`   source materials deleted:  ${materials.count}`);

  console.log(`\n✅ Account reset complete — ${EMAIL} is now brand new.`);
  console.log('   Log in and you\'ll see an empty app, just like a fresh signup.\n');
}

main()
  .catch((err) => {
    console.error('\n❌ Reset failed:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
