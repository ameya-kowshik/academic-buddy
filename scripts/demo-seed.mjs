/**
 * Demo seed script — populates rich dummy data for expo presentation.
 * No server needed. Runs directly against the DB via Prisma Client.
 *
 * Usage:
 *   node scripts/demo-seed.mjs <your@email.com>
 *   node scripts/demo-seed.mjs <your@email.com> --reset   ← wipe demo-tagged data, re-seed
 *   node scripts/demo-seed.mjs <your@email.com> --nuke    ← wipe ALL user data, re-seed fresh
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
const RESET = process.argv.includes('--reset') || process.argv.includes('--nuke');
const NUKE  = process.argv.includes('--nuke');
const DEMO_TAG = '[DEMO]';
const DEMO_QUIZ_TITLE = `Neural Networks — Fundamentals ${DEMO_TAG}`;

if (!EMAIL || !EMAIL.includes('@')) {
  console.error('Usage: node scripts/demo-seed.mjs <your@email.com> [--reset|--nuke]');
  process.exit(1);
}

function daysAgo(n, hourOffset = 10) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hourOffset, 0, 0, 0);
  return d;
}

function addMinutes(date, mins) {
  return new Date(date.getTime() + mins * 60 * 1000);
}

/**
 * Derive weak area analysis directly from wrong questions.
 * No AI needed — uses the question text and explanation to extract topics.
 * This mirrors what the AI would produce, ensuring the UI shows analysis
 * immediately without the user needing to click "Analyze".
 */
function deriveWeakAreaAnalysis(wrongQuestions) {
  if (wrongQuestions.length === 0) {
    return { weakTopics: [], weakDifficulties: [], recommendations: ['Perfect score! No weak areas detected.'] };
  }

  // Extract the core concept from each wrong question using its explanation
  const weakTopics = wrongQuestions.map(q => {
    const text = q.questionText.toLowerCase();
    const expl = (q.explanation || '').toLowerCase();

    // Match known technical concepts in order of specificity
    if (text.includes('vanishing gradient') || expl.includes('vanishing gradient')) return 'Vanishing Gradient Problem';
    if (text.includes('backpropagation') || expl.includes('backpropagation')) return 'Backpropagation';
    if (text.includes('activation function') || expl.includes('activation function')) return 'Activation Functions';
    if (text.includes('overfitting') || expl.includes('overfitting')) return 'Overfitting & Regularization';
    if (text.includes('gradient descent') || expl.includes('gradient descent')) return 'Gradient Descent';
    if (text.includes('optimizer') || text.includes('adam') || expl.includes('adam')) return 'Optimizers (Adam, SGD)';
    if (text.includes('sigmoid') || expl.includes('sigmoid')) return 'Sigmoid Activation';
    if (text.includes('relu') || expl.includes('relu')) return 'ReLU Activation';
    if (text.includes('convolutional') || text.includes('cnn') || expl.includes('convolutional')) return 'Convolutional Neural Networks';
    if (text.includes('max pooling') || text.includes('pooling') || expl.includes('pooling')) return 'Pooling Layers';
    if (text.includes('lstm') || expl.includes('lstm')) return 'LSTM Networks';
    if (text.includes('rnn') || expl.includes('rnn') || text.includes('sequential')) return 'Recurrent Neural Networks';
    if (text.includes('attention') || expl.includes('attention')) return 'Attention Mechanism';
    if (text.includes('firewall') || expl.includes('firewall')) return 'Firewall Fundamentals';
    if (text.includes('stateful') || expl.includes('stateful')) return 'Stateful Inspection';
    if (text.includes('application-layer') || text.includes('application layer') || expl.includes('layer 7')) return 'Application-Layer Gateway';
    if (text.includes('tls') || text.includes('https') || expl.includes('tls')) return 'TLS/HTTPS Encryption';
    if (text.includes('dmz') || expl.includes('dmz')) return 'DMZ Architecture';
    if (text.includes('packet filter') || expl.includes('packet')) return 'Packet Filtering';

    // Fallback: extract first meaningful noun phrase from question
    const words = q.questionText.replace(/[^a-zA-Z\s]/g, '').split(/\s+/).filter(w => w.length > 4);
    return words.slice(0, 3).join(' ') || 'General Concepts';
  });

  // Deduplicate
  const uniqueTopics = [...new Set(weakTopics)];

  // Generate targeted recommendations per topic
  const recommendations = uniqueTopics.map(topic => {
    if (topic.includes('Backpropagation') || topic.includes('Gradient')) {
      return `Review ${topic}: focus on how gradients flow through layers and the chain rule derivation.`;
    }
    if (topic.includes('Activation') || topic.includes('Sigmoid') || topic.includes('ReLU')) {
      return `Study ${topic}: compare sigmoid, ReLU, and tanh — understand when to use each and their trade-offs.`;
    }
    if (topic.includes('Overfitting')) {
      return `Review ${topic}: practice identifying overfitting symptoms and applying dropout, L2 regularization.`;
    }
    if (topic.includes('CNN') || topic.includes('Convolutional') || topic.includes('Pooling')) {
      return `Revisit ${topic}: trace how feature maps are produced and reduced through conv + pool layers.`;
    }
    if (topic.includes('LSTM') || topic.includes('RNN') || topic.includes('Recurrent')) {
      return `Study ${topic}: draw the gate diagrams and trace how hidden state flows across time steps.`;
    }
    if (topic.includes('Attention')) {
      return `Review ${topic}: understand query-key-value mechanics and why it outperforms fixed-length encodings.`;
    }
    if (topic.includes('Firewall') || topic.includes('Packet') || topic.includes('Stateful')) {
      return `Revisit ${topic}: compare packet filtering, stateful inspection, and application-layer gateways.`;
    }
    if (topic.includes('TLS') || topic.includes('HTTPS')) {
      return `Review ${topic}: understand the TLS handshake and how certificates establish trust.`;
    }
    if (topic.includes('DMZ')) {
      return `Study ${topic}: draw a network diagram showing DMZ placement between external and internal networks.`;
    }
    return `Review ${topic} in your study materials and attempt related practice questions.`;
  });

  return { weakTopics: uniqueTopics, weakDifficulties: [], recommendations };
}

async function resetDemoData(userId) {
  console.log('  Resetting demo data...');
  await prisma.quiz.deleteMany({ where: { userId, title: { contains: DEMO_TAG } } });
  await prisma.sourceMaterial.deleteMany({ where: { userId, fileName: { contains: DEMO_TAG } } });
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  await prisma.pomodoroLog.deleteMany({
    where: { userId, startedAt: { gte: fourteenDaysAgo }, notes: DEMO_TAG },
  });
  await prisma.flashcardSession.deleteMany({
    where: { userId, sessionStartedAt: { gte: fourteenDaysAgo }, grouping: { contains: DEMO_TAG } },
  });
  await prisma.analytics.deleteMany({
    where: { userId, date: { gte: fourteenDaysAgo } },
  });
  await prisma.tag.deleteMany({
    where: { userId, name: { in: ['Neural Networks', 'Deep Learning', 'Network Security'] } },
  });
  console.log('  ✅ Demo data cleared');
}

async function nukeAllData(userId) {
  console.log('  Nuking ALL data for this account...');
  // Delete in dependency order (children before parents)
  await prisma.agentOutput.deleteMany({ where: { userId } });
  await prisma.agentExecution.deleteMany({ where: { userId } });
  await prisma.flashcardSession.deleteMany({ where: { userId } });
  await prisma.flashcard.deleteMany({ where: { userId } });
  await prisma.analytics.deleteMany({ where: { userId } });
  await prisma.pomodoroLog.deleteMany({ where: { userId } });
  await prisma.tag.deleteMany({ where: { userId } });
  // Quiz cascade: attempts + question attempts are deleted via onDelete: Cascade on quiz
  await prisma.quiz.deleteMany({ where: { userId } });
  await prisma.sourceMaterial.deleteMany({ where: { userId } });
  console.log('  ✅ All user data wiped — account is clean');
}

// ---------------------------------------------------------------------------
// Quiz definitions — 3 quizzes across different topics
// ---------------------------------------------------------------------------
const QUIZ_DEFS = [
  {
    title: `Neural Networks — Fundamentals ${DEMO_TAG}`,
    description: 'Covers activation functions, backpropagation, and gradient descent.',
    difficulty: 3,
    tags: ['neural-networks', 'demo'],
    materialName: `Neural_Networks_Notes ${DEMO_TAG}.pdf`,
    questions: [
      {
        order: 1,
        questionText: 'What is the primary purpose of an activation function in a neural network?',
        options: ['To initialize weights', 'To introduce non-linearity', 'To normalize inputs', 'To reduce overfitting'],
        correctAnswer: 'To introduce non-linearity',
        explanation: 'Activation functions introduce non-linearity, allowing networks to learn complex patterns.',
      },
      {
        order: 2,
        questionText: 'Which algorithm is used to train neural networks by computing gradients?',
        options: ['Forward propagation', 'Backpropagation', 'Gradient boosting', 'K-means clustering'],
        correctAnswer: 'Backpropagation',
        explanation: 'Backpropagation computes gradients of the loss with respect to weights using the chain rule.',
      },
      {
        order: 3,
        questionText: 'What does the vanishing gradient problem refer to?',
        options: [
          'Gradients becoming too large during training',
          'Gradients becoming very small, slowing learning in early layers',
          'Loss function not converging',
          'Weights being initialized to zero',
        ],
        correctAnswer: 'Gradients becoming very small, slowing learning in early layers',
        explanation: 'In deep networks, gradients can shrink exponentially as they propagate back.',
      },
      {
        order: 4,
        questionText: 'Which activation function outputs values between 0 and 1?',
        options: ['ReLU', 'Tanh', 'Sigmoid', 'Leaky ReLU'],
        correctAnswer: 'Sigmoid',
        explanation: 'The sigmoid function maps any input to a value between 0 and 1.',
      },
      {
        order: 5,
        questionText: 'What is overfitting in the context of neural networks?',
        options: [
          'Model performs well on training data but poorly on unseen data',
          'Model performs poorly on both training and test data',
          'Model has too few parameters',
          'Model converges too quickly',
        ],
        correctAnswer: 'Model performs well on training data but poorly on unseen data',
        explanation: 'Overfitting occurs when a model memorizes training data rather than learning generalizable patterns.',
      },
      {
        order: 6,
        questionText: 'Which optimizer adapts the learning rate for each parameter individually?',
        options: ['SGD', 'Momentum', 'Adam', 'RMSProp'],
        correctAnswer: 'Adam',
        explanation: 'Adam combines momentum and RMSProp to adapt learning rates per parameter.',
      },
    ],
    // attempts: score trajectory over 6 days, correctIndices per attempt
    attempts: [
      { daysBack: 13, score: 50, correctIndices: [0, 3] },
      { daysBack: 11, score: 58, correctIndices: [0, 1, 3] },
      { daysBack: 8,  score: 67, correctIndices: [0, 1, 3, 4] },
      { daysBack: 5,  score: 75, correctIndices: [0, 1, 2, 3, 4] },
      { daysBack: 2,  score: 83, correctIndices: [0, 1, 2, 3, 4, 5] },
    ],
  },
  {
    title: `Deep Learning — CNNs & RNNs ${DEMO_TAG}`,
    description: 'Covers convolutional networks, recurrent networks, and attention mechanisms.',
    difficulty: 4,
    tags: ['deep-learning', 'demo'],
    materialName: `Deep_Learning_Lecture_Notes ${DEMO_TAG}.pdf`,
    questions: [
      {
        order: 1,
        questionText: 'What operation do convolutional layers primarily perform?',
        options: ['Matrix multiplication', 'Feature map convolution', 'Pooling', 'Normalization'],
        correctAnswer: 'Feature map convolution',
        explanation: 'Convolutional layers apply learned filters to produce feature maps.',
      },
      {
        order: 2,
        questionText: 'What is the purpose of max pooling in a CNN?',
        options: ['Increase feature map size', 'Reduce spatial dimensions and retain dominant features', 'Add non-linearity', 'Normalize activations'],
        correctAnswer: 'Reduce spatial dimensions and retain dominant features',
        explanation: 'Max pooling downsamples feature maps by taking the maximum value in each region.',
      },
      {
        order: 3,
        questionText: 'Which architecture is best suited for sequential data like text?',
        options: ['CNN', 'RNN', 'Autoencoder', 'GAN'],
        correctAnswer: 'RNN',
        explanation: 'RNNs maintain hidden state across time steps, making them suitable for sequences.',
      },
      {
        order: 4,
        questionText: 'What problem do LSTMs solve compared to vanilla RNNs?',
        options: ['Overfitting', 'Long-term dependency learning via gating', 'Slow training', 'High memory usage'],
        correctAnswer: 'Long-term dependency learning via gating',
        explanation: 'LSTMs use input, forget, and output gates to control information flow over long sequences.',
      },
      {
        order: 5,
        questionText: 'What is the attention mechanism primarily used for?',
        options: [
          'Reducing model size',
          'Allowing the model to focus on relevant parts of the input',
          'Speeding up convolutions',
          'Regularizing weights',
        ],
        correctAnswer: 'Allowing the model to focus on relevant parts of the input',
        explanation: 'Attention computes a weighted sum of values based on query-key similarity.',
      },
    ],
    attempts: [
      { daysBack: 12, score: 40, correctIndices: [0, 2] },
      { daysBack: 9,  score: 60, correctIndices: [0, 1, 2] },
      { daysBack: 6,  score: 60, correctIndices: [0, 2, 3] },
      { daysBack: 3,  score: 80, correctIndices: [0, 1, 2, 3] },
      { daysBack: 1,  score: 80, correctIndices: [0, 1, 2, 3, 4] },
    ],
  },
  {
    title: `Network Security — Firewalls & Protocols ${DEMO_TAG}`,
    description: 'Covers firewall types, packet filtering, and network security protocols.',
    difficulty: 3,
    tags: ['network-security', 'demo'],
    materialName: `Firewall_Security_Notes ${DEMO_TAG}.pdf`,
    questions: [
      {
        order: 1,
        questionText: 'What is the primary function of a firewall?',
        options: ['Encrypt data', 'Monitor and control network traffic based on rules', 'Assign IP addresses', 'Compress packets'],
        correctAnswer: 'Monitor and control network traffic based on rules',
        explanation: 'Firewalls filter incoming and outgoing traffic based on predefined security rules.',
      },
      {
        order: 2,
        questionText: 'Which type of firewall inspects packets at the application layer?',
        options: ['Packet filter', 'Stateful inspection', 'Application-layer gateway', 'Circuit-level gateway'],
        correctAnswer: 'Application-layer gateway',
        explanation: 'Application-layer gateways (proxy firewalls) inspect traffic at Layer 7.',
      },
      {
        order: 3,
        questionText: 'What does a stateful firewall track?',
        options: ['User credentials', 'Active connection states', 'DNS queries', 'Encryption keys'],
        correctAnswer: 'Active connection states',
        explanation: 'Stateful firewalls maintain a state table of active connections to make smarter filtering decisions.',
      },
      {
        order: 4,
        questionText: 'Which protocol does HTTPS use for encryption?',
        options: ['SSH', 'TLS', 'IPSec', 'SFTP'],
        correctAnswer: 'TLS',
        explanation: 'HTTPS uses TLS (Transport Layer Security) to encrypt HTTP traffic.',
      },
      {
        order: 5,
        questionText: 'What is a DMZ in network security?',
        options: [
          'A type of VPN tunnel',
          'A subnet that exposes external-facing services while protecting the internal network',
          'A firewall rule set',
          'A packet inspection method',
        ],
        correctAnswer: 'A subnet that exposes external-facing services while protecting the internal network',
        explanation: 'A DMZ (demilitarized zone) sits between the public internet and the internal network.',
      },
    ],
    attempts: [
      { daysBack: 11, score: 60, correctIndices: [0, 2, 3] },
      { daysBack: 8,  score: 60, correctIndices: [0, 1, 2] },
      { daysBack: 5,  score: 80, correctIndices: [0, 1, 2, 3] },
      { daysBack: 3,  score: 80, correctIndices: [0, 1, 2, 4] },
      { daysBack: 1,  score: 100, correctIndices: [0, 1, 2, 3, 4] },
    ],
  },
];

// ---------------------------------------------------------------------------
// Focus session schedule — 40 sessions across 14 days, every day covered
// ---------------------------------------------------------------------------
const FOCUS_SESSIONS = [
  // --- Previous week (days 8–14) — moderate load ~14h total ---
  { daysBack: 14, hour: 9,  duration: 50, score: 6 },
  { daysBack: 14, hour: 14, duration: 25, score: 7 },
  { daysBack: 13, hour: 9,  duration: 50, score: 7 },
  { daysBack: 13, hour: 15, duration: 50, score: 6 },
  { daysBack: 12, hour: 10, duration: 25, score: 7 },
  { daysBack: 12, hour: 14, duration: 50, score: 7 },
  { daysBack: 11, hour: 9,  duration: 90, score: 7 },
  { daysBack: 11, hour: 15, duration: 25, score: 6 },
  { daysBack: 10, hour: 10, duration: 50, score: 8 },
  { daysBack: 10, hour: 14, duration: 25, score: 7 },
  { daysBack: 9,  hour: 9,  duration: 50, score: 7 },
  { daysBack: 9,  hour: 15, duration: 50, score: 8 },
  { daysBack: 8,  hour: 10, duration: 90, score: 8 },
  { daysBack: 8,  hour: 16, duration: 25, score: 7 },
  // --- Current week (days 1–7) — heavier load ~22h total, clear upward trend ---
  { daysBack: 7,  hour: 9,  duration: 90, score: 7 },
  { daysBack: 7,  hour: 14, duration: 50, score: 8 },
  { daysBack: 7,  hour: 17, duration: 25, score: 8 },
  { daysBack: 6,  hour: 9,  duration: 90, score: 8 },
  { daysBack: 6,  hour: 13, duration: 50, score: 8 },
  { daysBack: 6,  hour: 17, duration: 25, score: 9 },
  { daysBack: 5,  hour: 9,  duration: 90, score: 8 },
  { daysBack: 5,  hour: 14, duration: 90, score: 9 },
  { daysBack: 4,  hour: 9,  duration: 90, score: 9 },
  { daysBack: 4,  hour: 13, duration: 50, score: 8 },
  { daysBack: 4,  hour: 17, duration: 50, score: 9 },
  { daysBack: 3,  hour: 9,  duration: 90, score: 9 },
  { daysBack: 3,  hour: 14, duration: 90, score: 9 },
  { daysBack: 3,  hour: 18, duration: 25, score: 8 },
  { daysBack: 2,  hour: 9,  duration: 90, score: 9 },
  { daysBack: 2,  hour: 13, duration: 50, score: 9 },
  { daysBack: 2,  hour: 17, duration: 50, score: 10 },
  { daysBack: 1,  hour: 9,  duration: 90, score: 9 },
  { daysBack: 1,  hour: 13, duration: 90, score: 10 },
  { daysBack: 1,  hour: 17, duration: 50, score: 10 },
];

// ---------------------------------------------------------------------------
// Flashcard sessions — 10 sessions, daily coverage across current week
// ---------------------------------------------------------------------------
const FLASHCARD_SESSIONS = [
  { daysBack: 7,  hour: 12, cardCount: 20, durationSeconds: 720,  grouping: 'neural-networks' },
  { daysBack: 6,  hour: 12, cardCount: 25, durationSeconds: 900,  grouping: 'neural-networks' },
  { daysBack: 6,  hour: 16, cardCount: 15, durationSeconds: 540,  grouping: 'deep-learning' },
  { daysBack: 5,  hour: 12, cardCount: 22, durationSeconds: 780,  grouping: 'deep-learning' },
  { daysBack: 4,  hour: 12, cardCount: 30, durationSeconds: 1080, grouping: 'neural-networks' },
  { daysBack: 4,  hour: 16, cardCount: 18, durationSeconds: 660,  grouping: 'network-security' },
  { daysBack: 3,  hour: 12, cardCount: 25, durationSeconds: 900,  grouping: 'network-security' },
  { daysBack: 2,  hour: 12, cardCount: 28, durationSeconds: 1020, grouping: 'deep-learning' },
  { daysBack: 2,  hour: 16, cardCount: 20, durationSeconds: 720,  grouping: 'neural-networks' },
  { daysBack: 1,  hour: 12, cardCount: 32, durationSeconds: 1140, grouping: 'neural-networks' },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\n🎓 Academic Buddy — Demo Seed`);
  console.log(`   Email: ${EMAIL}\n`);

  const user = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (!user) {
    console.error(`❌ No user found with email "${EMAIL}". Sign up first, then run this script.`);
    process.exit(1);
  }
  const userId = user.id;
  console.log(`✅ Found user: ${user.name ?? EMAIL} (${userId})`);

  if (RESET) await resetDemoData(userId);
  if (NUKE)  await nukeAllData(userId);

  const existing = await prisma.quiz.findFirst({ where: { userId, title: DEMO_QUIZ_TITLE } });
  if (existing) {
    console.log('\n⚠️  Demo data already exists. Run with --reset or --nuke to re-seed.\n');
    process.exit(0);
  }

  // Enable email notifications
  await prisma.user.update({
    where: { id: userId },
    data: { emailNotificationsEnabled: true },
  });
  console.log('✅ Email notifications enabled');

  // --- Demo tags ---
  const TAG_DEFS = [
    { name: 'Neural Networks', color: '#06b6d4' },
    { name: 'Deep Learning',   color: '#8b5cf6' },
    { name: 'Network Security', color: '#10b981' },
  ];
  const createdTags = [];
  for (const t of TAG_DEFS) {
    const tag = await prisma.tag.upsert({
      where: { userId_name: { userId, name: t.name } },
      update: { color: t.color },
      create: { userId, name: t.name, color: t.color },
    });
    createdTags.push(tag);
  }
  console.log(`✅ Seeded ${createdTags.length} demo tags`);

  // --- Focus sessions (with rotating tag assignments for pie chart) ---
  for (let i = 0; i < FOCUS_SESSIONS.length; i++) {
    const s = FOCUS_SESSIONS[i];
    const startedAt = daysAgo(s.daysBack, s.hour);
    // Rotate tags across sessions so all 3 appear in the pie chart
    const tag = createdTags[i % createdTags.length];
    await prisma.pomodoroLog.create({
      data: {
        userId,
        duration: s.duration,
        focusScore: s.score,
        sessionType: 'POMODORO',
        startedAt,
        completedAt: addMinutes(startedAt, s.duration),
        notes: DEMO_TAG,
        tagId: tag.id,
      },
    });
  }
  console.log(`✅ Seeded ${FOCUS_SESSIONS.length} focus sessions`);

  // --- Analytics rollup (daily) ---
  // Group focus sessions by day
  const dailyMap = new Map();
  for (const s of FOCUS_SESSIONS) {
    const d = new Date();
    d.setDate(d.getDate() - s.daysBack);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().split('T')[0];
    if (!dailyMap.has(key)) dailyMap.set(key, { date: d, sessions: 0, minutes: 0, flashcards: 0, quizzes: 0 });
    const entry = dailyMap.get(key);
    entry.sessions += 1;
    entry.minutes += s.duration;
  }

  // Add flashcard session counts per day
  for (const s of FLASHCARD_SESSIONS) {
    const d = new Date();
    d.setDate(d.getDate() - s.daysBack);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().split('T')[0];
    if (!dailyMap.has(key)) dailyMap.set(key, { date: d, sessions: 0, minutes: 0, flashcards: 0, quizzes: 0 });
    dailyMap.get(key).flashcards += s.cardCount;
  }

  // Add quiz attempt counts per day (will be filled after quizzes are seeded)
  // We track this via QUIZ_DEFS attempts daysBack
  for (const def of QUIZ_DEFS) {
    for (const attempt of def.attempts) {
      const d = new Date();
      d.setDate(d.getDate() - attempt.daysBack);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().split('T')[0];
      if (!dailyMap.has(key)) dailyMap.set(key, { date: d, sessions: 0, minutes: 0, flashcards: 0, quizzes: 0 });
      dailyMap.get(key).quizzes += 1;
    }
  }

  for (const [, entry] of dailyMap) {
    await prisma.analytics.upsert({
      where: { userId_date: { userId, date: entry.date } },
      update: {
        pomodoroSessions: entry.sessions,
        focusHours: Math.round((entry.minutes / 60) * 10) / 10,
        flashcardsReviewed: entry.flashcards,
        quizzesCompleted: entry.quizzes,
      },
      create: {
        userId,
        date: entry.date,
        pomodoroSessions: entry.sessions,
        focusHours: Math.round((entry.minutes / 60) * 10) / 10,
        flashcardsReviewed: entry.flashcards,
        quizzesCompleted: entry.quizzes,
      },
    });
  }
  console.log(`✅ Seeded ${dailyMap.size} daily analytics records (with flashcards + quizzes)`);

  // --- Quizzes, questions, attempts ---
  let totalAttempts = 0;
  for (const def of QUIZ_DEFS) {
    // Source material
    const material = await prisma.sourceMaterial.create({
      data: {
        userId,
        fileName: def.materialName,
        fileUrl: `/uploads/documents/demo-${def.tags[0]}.pdf`,
        fileSize: 204800,
        mimeType: 'application/pdf',
        tags: def.tags,
        extractedText: `${def.title} — demo extracted text for analytics.`,
      },
    });

    // Quiz
    const quiz = await prisma.quiz.create({
      data: {
        userId,
        sourceMaterialId: material.id,
        title: def.title,
        description: def.description,
        difficulty: def.difficulty,
        tags: def.tags,
      },
    });

    // Questions
    const createdQuestions = [];
    for (const q of def.questions) {
      const created = await prisma.quizQuestion.create({
        data: {
          quizId: quiz.id,
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          order: q.order,
        },
      });
      createdQuestions.push({ ...created, correctAnswer: q.correctAnswer, options: q.options });
    }

    // Attempts
    for (const cfg of def.attempts) {
      const startedAt = daysAgo(cfg.daysBack, 11);
      const completedAt = addMinutes(startedAt, 15);
      const attempt = await prisma.quizAttempt.create({
        data: {
          quizId: quiz.id,
          score: cfg.score,
          totalQuestions: createdQuestions.length,
          correctAnswers: cfg.correctIndices.length,
          timeSpent: 15 * 60,
          startedAt,
          completedAt,
        },
      });

      for (let i = 0; i < createdQuestions.length; i++) {
        const q = createdQuestions[i];
        const isCorrect = cfg.correctIndices.includes(i);
        const selectedAnswer = isCorrect
          ? q.correctAnswer
          : q.options.find((o) => o !== q.correctAnswer) ?? q.options[0];
        await prisma.quizQuestionAttempt.create({
          data: {
            quizAttemptId: attempt.id,
            quizQuestionId: q.id,
            selectedAnswer,
            isCorrect,
            timeSpent: Math.floor(Math.random() * 60) + 20,
            attemptedAt: addMinutes(startedAt, i * 2),
          },
        });
      }

      // Pre-compute weak area analysis from wrong questions so the UI shows
      // analysis immediately — no "Analyze" button click needed during demo.
      const wrongQuestions = createdQuestions
        .filter((_, i) => !cfg.correctIndices.includes(i))
        .map(q => ({
          questionText: q.questionText,
          selectedAnswer: q.options.find(o => o !== q.correctAnswer) ?? q.options[0],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || '',
        }));
      const weakAreaAnalysis = deriveWeakAreaAnalysis(wrongQuestions);
      await prisma.$executeRaw`UPDATE quiz_attempts SET "weakAreaAnalysis" = ${JSON.stringify(weakAreaAnalysis)}::jsonb WHERE id = ${attempt.id}`;

      totalAttempts++;
    }

    console.log(`✅ Seeded quiz: "${def.title}" (${def.questions.length} questions, ${def.attempts.length} attempts)`);
  }
  console.log(`   Total quiz attempts: ${totalAttempts}`);

  // --- Flashcard sessions ---
  for (const s of FLASHCARD_SESSIONS) {
    const sessionStartedAt = daysAgo(s.daysBack, s.hour);
    await prisma.flashcardSession.create({
      data: {
        userId,
        grouping: `${s.grouping} ${DEMO_TAG}`,
        cardCount: s.cardCount,
        durationSeconds: s.durationSeconds,
        sessionStartedAt,
        sessionCompletedAt: new Date(sessionStartedAt.getTime() + s.durationSeconds * 1000),
      },
    });
  }
  console.log(`✅ Seeded ${FLASHCARD_SESSIONS.length} flashcard sessions`);

  // --- Actual Flashcards (so they show up in the UI) ---
  const FLASHCARD_DEFS = [
    {
      materialName: `Neural_Networks_Notes ${DEMO_TAG}.pdf`,
      cards: [
        { title: 'Activation Functions', question: 'What is the purpose of activation functions?', answer: 'Activation functions introduce non-linearity into neural networks, enabling them to learn complex patterns beyond linear relationships.', difficulty: 2, tags: ['neural-networks'] },
        { title: 'Backpropagation', question: 'How does backpropagation work?', answer: 'Backpropagation computes gradients of the loss function with respect to weights using the chain rule, propagating errors backward through the network.', difficulty: 3, tags: ['neural-networks'] },
        { title: 'Gradient Descent', question: 'What is gradient descent?', answer: 'Gradient descent is an optimization algorithm that iteratively adjusts weights in the direction of steepest descent of the loss function.', difficulty: 2, tags: ['neural-networks'] },
        { title: 'Vanishing Gradient', question: 'What causes the vanishing gradient problem?', answer: 'In deep networks, gradients can become exponentially small as they propagate backward, making early layers learn very slowly.', difficulty: 3, tags: ['neural-networks'] },
        { title: 'Sigmoid Function', question: 'What range does sigmoid output?', answer: 'The sigmoid function outputs values between 0 and 1, making it useful for binary classification and probability estimation.', difficulty: 1, tags: ['neural-networks'] },
        { title: 'ReLU Activation', question: 'Why is ReLU popular?', answer: 'ReLU (Rectified Linear Unit) is computationally efficient, helps mitigate vanishing gradients, and introduces non-linearity while being simple to compute.', difficulty: 2, tags: ['neural-networks'] },
        { title: 'Overfitting', question: 'What is overfitting?', answer: 'Overfitting occurs when a model learns training data too well, including noise, resulting in poor generalization to new data.', difficulty: 2, tags: ['neural-networks'] },
        { title: 'Learning Rate', question: 'What does learning rate control?', answer: 'Learning rate controls the step size in gradient descent. Too high causes instability, too low causes slow convergence.', difficulty: 2, tags: ['neural-networks'] },
        { title: 'Batch Normalization', question: 'What does batch normalization do?', answer: 'Batch normalization normalizes layer inputs, stabilizing training, allowing higher learning rates, and reducing sensitivity to initialization.', difficulty: 3, tags: ['neural-networks'] },
        { title: 'Dropout', question: 'How does dropout prevent overfitting?', answer: 'Dropout randomly deactivates neurons during training, forcing the network to learn robust features and preventing co-adaptation.', difficulty: 2, tags: ['neural-networks'] },
      ],
    },
    {
      materialName: `Deep_Learning_Lecture_Notes ${DEMO_TAG}.pdf`,
      cards: [
        { title: 'Convolutional Layers', question: 'What do convolutional layers do?', answer: 'Convolutional layers apply learned filters to input data, extracting spatial features like edges, textures, and patterns.', difficulty: 2, tags: ['deep-learning'] },
        { title: 'Max Pooling', question: 'What is the purpose of max pooling?', answer: 'Max pooling reduces spatial dimensions by taking the maximum value in each region, providing translation invariance and reducing computation.', difficulty: 2, tags: ['deep-learning'] },
        { title: 'CNN Architecture', question: 'What are typical CNN layers?', answer: 'CNNs typically consist of convolutional layers, pooling layers, activation functions, and fully connected layers at the end.', difficulty: 2, tags: ['deep-learning'] },
        { title: 'RNN Hidden State', question: 'What is RNN hidden state?', answer: 'Hidden state in RNNs carries information across time steps, allowing the network to maintain memory of previous inputs in a sequence.', difficulty: 3, tags: ['deep-learning'] },
        { title: 'LSTM Gates', question: 'What are the three gates in LSTM?', answer: 'LSTMs have input gate (what to add), forget gate (what to remove), and output gate (what to expose) to control information flow.', difficulty: 3, tags: ['deep-learning'] },
        { title: 'Attention Mechanism', question: 'What does attention mechanism do?', answer: 'Attention allows models to focus on relevant parts of input by computing weighted sums based on query-key similarity scores.', difficulty: 3, tags: ['deep-learning'] },
        { title: 'Transfer Learning', question: 'What is transfer learning?', answer: 'Transfer learning uses pre-trained models on new tasks, leveraging learned features to reduce training time and data requirements.', difficulty: 2, tags: ['deep-learning'] },
        { title: 'Encoder-Decoder', question: 'What is encoder-decoder architecture?', answer: 'Encoder-decoder architecture compresses input into a latent representation (encoder) then generates output from it (decoder).', difficulty: 3, tags: ['deep-learning'] },
      ],
    },
    {
      materialName: `Firewall_Security_Notes ${DEMO_TAG}.pdf`,
      cards: [
        { title: 'Firewall Purpose', question: 'What is the main purpose of a firewall?', answer: 'Firewalls monitor and control network traffic based on security rules, acting as a barrier between trusted and untrusted networks.', difficulty: 1, tags: ['network-security'] },
        { title: 'Packet Filtering', question: 'How does packet filtering work?', answer: 'Packet filtering examines packet headers (IP, port, protocol) and allows or blocks traffic based on predefined rules.', difficulty: 2, tags: ['network-security'] },
        { title: 'Stateful Inspection', question: 'What is stateful inspection?', answer: 'Stateful firewalls track active connections and make decisions based on connection state, not just individual packets.', difficulty: 2, tags: ['network-security'] },
        { title: 'Application Layer Gateway', question: 'What layer does ALG operate at?', answer: 'Application Layer Gateways (proxy firewalls) operate at Layer 7, inspecting application-specific traffic like HTTP or FTP.', difficulty: 3, tags: ['network-security'] },
        { title: 'TLS/SSL', question: 'What does TLS provide?', answer: 'TLS (Transport Layer Security) provides encryption, authentication, and integrity for network communications, securing data in transit.', difficulty: 2, tags: ['network-security'] },
        { title: 'DMZ', question: 'What is a DMZ in networking?', answer: 'A DMZ (demilitarized zone) is a subnet that exposes external-facing services while isolating them from the internal network.', difficulty: 2, tags: ['network-security'] },
        { title: 'IDS vs IPS', question: 'What is the difference between IDS and IPS?', answer: 'IDS (Intrusion Detection System) monitors and alerts, while IPS (Intrusion Prevention System) actively blocks detected threats.', difficulty: 2, tags: ['network-security'] },
        { title: 'VPN', question: 'How does a VPN work?', answer: 'VPNs create encrypted tunnels over public networks, allowing secure remote access to private networks.', difficulty: 2, tags: ['network-security'] },
      ],
    },
  ];

  let totalFlashcardsCreated = 0;
  for (const def of FLASHCARD_DEFS) {
    const material = await prisma.sourceMaterial.findFirst({
      where: { userId, fileName: def.materialName },
    });
    
    if (material) {
      for (const card of def.cards) {
        await prisma.flashcard.create({
          data: {
            userId,
            sourceMaterialId: material.id,
            title: card.title,
            question: card.question,
            answer: card.answer,
            difficulty: card.difficulty,
            tags: card.tags,
            grouping: card.tags[0],
          },
        });
        totalFlashcardsCreated++;
      }
      console.log(`✅ Seeded ${def.cards.length} flashcards for ${def.materialName}`);
    }
  }

  const totalCards = FLASHCARD_SESSIONS.reduce((s, f) => s + f.cardCount, 0);
  const totalFocusMin = FOCUS_SESSIONS.reduce((s, f) => s + f.duration, 0);

  console.log('\n🎉 Demo data seeded successfully!');
  console.log(`   Focus: ${FOCUS_SESSIONS.length} sessions, ${(totalFocusMin / 60).toFixed(1)}h total`);
  console.log(`   Quizzes: ${QUIZ_DEFS.length} quizzes, ${totalAttempts} attempts`);
  console.log(`   Flashcards: ${totalFlashcardsCreated} cards created, ${FLASHCARD_SESSIONS.length} sessions, ${totalCards} cards reviewed`);
  console.log('\n   Open the app and check:');
  console.log('   → /focus/analytics — 14 days of focus data, INCREASING trend');
  console.log('   → /study/analytics — 3 quizzes, 15 attempts, 10 flashcard sessions');
  console.log('   → /study/quizzes   — all 3 demo quizzes with attempt history');
  console.log('   → /study/flashcards — 3 documents with flashcards ready to review');
  console.log('   → /study/documents — 3 demo documents uploaded');
  console.log('\n   Then run: node scripts/demo-run-agents.mjs your@email.com\n');
}

main()
  .catch((err) => {
    console.error('\n❌ Seed failed:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
