/**
 * Demo agent runner — runs all 4 agents directly via Prisma (no server needed).
 * Pre-computes weak area analysis for all quiz attempts so the "Analyze" button
 * is already populated when the demo starts.
 *
 * Usage (from academic-buddy directory):
 *   node scripts/demo-run-agents.mjs <your@email.com>
 *
 * Sends 4 emails:
 *   1. Weekly Productivity Report
 *   2. Weekly Study Report
 *   3. Weekly Reflection
 *   4. Monthly Reflection
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');

// Load .env
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

const EMAIL = process.argv[2];
if (!EMAIL || !EMAIL.includes('@')) {
  console.error('Usage: node scripts/demo-run-agents.mjs <your@email.com>');
  process.exit(1);
}

// Validate required env vars
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_FROM_EMAIL = process.env.BREVO_FROM_EMAIL;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!BREVO_API_KEY) {
  console.error('❌ BREVO_API_KEY is not set in .env — emails will not be sent');
  process.exit(1);
}
if (!BREVO_FROM_EMAIL) {
  console.error('❌ BREVO_FROM_EMAIL is not set in .env');
  process.exit(1);
}
if (!GROQ_API_KEY) {
  console.warn('⚠️  GROQ_API_KEY not set — weak area AI analysis will be skipped');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function percentChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function linearRegressionSlope(values) {
  const n = values.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i] - yMean);
    den += (i - xMean) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

function pearsonCorrelation(xs, ys) {
  const n = xs.length;
  if (n < 3) return null;
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, xDen = 0, yDen = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - xMean, dy = ys[i] - yMean;
    num += dx * dy; xDen += dx * dx; yDen += dy * dy;
  }
  const den = Math.sqrt(xDen * yDen);
  return den === 0 ? null : num / den;
}

function isoDate(d) { return d.toISOString().split('T')[0]; }

// ---------------------------------------------------------------------------
// Email sender (Brevo)
// ---------------------------------------------------------------------------
async function sendEmail(to, toName, subject, html) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { email: BREVO_FROM_EMAIL, name: 'Veyra' },
      to: [{ email: to, name: toName }],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo API error ${res.status}: ${body}`);
  }
}

// ---------------------------------------------------------------------------
// Groq AI weak area analysis
// ---------------------------------------------------------------------------
async function analyzeWeakAreasWithAI(wrongQuestions) {
  if (!GROQ_API_KEY || wrongQuestions.length === 0) return null;
  try {
    const prompt = `You are an educational performance analyst. A student got the following questions wrong in a quiz. Identify the specific topics or concepts they need to improve on.

Wrong answers:
${wrongQuestions.map((q, i) => `Q${i + 1}: ${q.questionText}\nStudent answered: ${q.selectedAnswer}\nCorrect answer: ${q.correctAnswer}\nExplanation: ${q.explanation || ''}`).join('\n\n')}

Return ONLY a valid JSON object:
{"weakTopics":["topic1","topic2"],"weakDifficulties":[],"recommendations":["Recommendation 1","Recommendation 2"]}`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 1024,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    let clean = text.trim();
    if (clean.startsWith('```json')) clean = clean.slice(7);
    else if (clean.startsWith('```')) clean = clean.slice(3);
    if (clean.endsWith('```')) clean = clean.slice(0, -3);
    return JSON.parse(clean.trim());
  } catch { return null; }
}

// ---------------------------------------------------------------------------
// Email HTML builders
// ---------------------------------------------------------------------------
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function buildProductivityEmail(name, data) {
  const trendEmoji = data.trend === 'INCREASING' ? '📈' : data.trend === 'DECREASING' ? '📉' : '➡️';
  const scoreColor = data.weeklyScore >= 70 ? '#10b981' : data.weeklyScore >= 40 ? '#f59e0b' : '#ef4444';
  const insightsHtml = data.insights.map(i => `<li style="margin-bottom:6px;color:#94a3b8;">${i.message}</li>`).join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="background:#0f172a;color:#e2e8f0;font-family:sans-serif;padding:32px;max-width:600px;margin:0 auto;">
  <h1 style="color:#38bdf8;margin-bottom:4px;">Weekly Productivity Report</h1>
  <p style="color:#64748b;margin-top:0;">Hi ${name}, here's your focus summary.</p>
  <div style="background:#1e293b;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
    <p style="color:#94a3b8;margin:0 0 8px;">Weekly Score</p>
    <p style="font-size:48px;font-weight:bold;color:${scoreColor};margin:0;">${data.weeklyScore.toFixed(0)}</p>
    <p style="color:#64748b;margin:4px 0 0;">${trendEmoji} ${data.trend}</p>
  </div>
  ${data.burnoutWarning ? `<div style="background:#7f1d1d;border-radius:8px;padding:16px;margin-bottom:16px;"><p style="color:#fca5a5;margin:0;font-weight:bold;">⚠️ Burnout Risk Detected</p><p style="color:#fca5a5;margin:8px 0 0;">${data.burnoutDetails ?? ''}</p></div>` : ''}
  <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:16px;">
    <h3 style="color:#e2e8f0;margin-top:0;">Week-over-Week</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:6px 0;color:#94a3b8;">Focus Hours</td><td style="text-align:right;color:${data.weekOverWeek.focusHoursChange >= 0 ? '#10b981' : '#ef4444'};">${data.weekOverWeek.focusHoursChange >= 0 ? '+' : ''}${data.weekOverWeek.focusHoursChange.toFixed(0)}%</td></tr>
      <tr><td style="padding:6px 0;color:#94a3b8;">Sessions</td><td style="text-align:right;color:${data.weekOverWeek.sessionsChange >= 0 ? '#10b981' : '#ef4444'};">${data.weekOverWeek.sessionsChange >= 0 ? '+' : ''}${data.weekOverWeek.sessionsChange.toFixed(0)}%</td></tr>
      <tr><td style="padding:6px 0;color:#94a3b8;">Avg Focus Score</td><td style="text-align:right;color:${data.weekOverWeek.avgScoreChange >= 0 ? '#10b981' : '#ef4444'};">${data.weekOverWeek.avgScoreChange >= 0 ? '+' : ''}${data.weekOverWeek.avgScoreChange.toFixed(0)}%</td></tr>
    </table>
  </div>
  ${insightsHtml ? `<div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:16px;"><h3 style="color:#e2e8f0;margin-top:0;">Insights</h3><ul style="padding-left:20px;margin:0;">${insightsHtml}</ul></div>` : ''}
  <a href="${APP_URL}/focus/analytics" style="display:inline-block;background:#0ea5e9;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">View Focus Analytics →</a>
  <p style="color:#334155;font-size:12px;margin-top:32px;">Email notifications are enabled. <a href="${APP_URL}/profile" style="color:#475569;">Manage preferences</a></p>
</body></html>`;
}

function buildStudyEmail(name, data) {
  const topicsHtml = data.topicsNeedingAttention.length > 0
    ? data.topicsNeedingAttention.map(t => `
      <div style="margin-bottom:12px;padding:12px;background:#7f1d1d;border-radius:8px;">
        <p style="color:#fca5a5;font-weight:bold;margin:0 0 4px;text-transform:capitalize;">${t.topic}</p>
        <p style="color:#fca5a5;font-size:12px;margin:0 0 8px;">${t.incorrectCount} incorrect attempt${t.incorrectCount !== 1 ? 's' : ''} • ${(t.errorRate * 100).toFixed(0)}% error rate</p>
        <p style="color:#fca5a5;font-size:14px;margin:0;">💡 ${t.recommendation}</p>
      </div>`).join('')
    : '<p style="color:#94a3b8;margin:0;">No weak areas detected — great work!</p>';
  const materialsHtml = data.materialPerformance.slice(0, 5).map(m =>
    `<tr><td style="padding:6px 0;color:#94a3b8;">${m.materialName}</td><td style="text-align:right;color:#e2e8f0;">${m.avgScore.toFixed(0)}%</td><td style="text-align:right;color:#64748b;">${m.attemptCount} attempt${m.attemptCount !== 1 ? 's' : ''}</td></tr>`
  ).join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="background:#0f172a;color:#e2e8f0;font-family:sans-serif;padding:32px;max-width:600px;margin:0 auto;">
  <h1 style="color:#818cf8;margin-bottom:4px;">Weekly Study Report</h1>
  <p style="color:#64748b;margin-top:0;">Hi ${name}, here's your study activity this week.</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td width="33%" style="padding-right:6px;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;"><tr><td style="padding:16px;text-align:center;"><p style="color:#94a3b8;margin:0 0 6px;font-size:12px;">Quizzes</p><p style="font-size:28px;font-weight:bold;color:#818cf8;margin:0;">${data.weekSummary.totalQuizAttempts}</p></td></tr></table></td>
      <td width="33%" style="padding:0 3px;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;"><tr><td style="padding:16px;text-align:center;"><p style="color:#94a3b8;margin:0 0 6px;font-size:12px;">Avg Score</p><p style="font-size:28px;font-weight:bold;color:#10b981;margin:0;">${data.weekSummary.avgQuizScore.toFixed(0)}%</p></td></tr></table></td>
      <td width="33%" style="padding-left:6px;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;"><tr><td style="padding:16px;text-align:center;"><p style="color:#94a3b8;margin:0 0 6px;font-size:12px;">Flashcard Sessions</p><p style="font-size:28px;font-weight:bold;color:#38bdf8;margin:0;">${data.weekSummary.totalFlashcardSessions}</p></td></tr></table></td>
    </tr>
  </table>
  ${materialsHtml ? `<div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:16px;"><h3 style="color:#e2e8f0;margin-top:0;">Performance by Material</h3><table style="width:100%;border-collapse:collapse;">${materialsHtml}</table></div>` : ''}
  <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:24px;"><h3 style="color:#e2e8f0;margin-top:0;">Topics Needing Attention</h3>${topicsHtml}</div>
  <a href="${APP_URL}/study/analytics" style="display:inline-block;background:#818cf8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">View Study Analytics →</a>
  <p style="color:#334155;font-size:12px;margin-top:32px;">Email notifications are enabled. <a href="${APP_URL}/profile" style="color:#475569;">Manage preferences</a></p>
</body></html>`;
}

function buildReflectionEmail(name, data, periodLabel) {
  const startDate = new Date(data.period.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endDate = new Date(data.period.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const listHtml = (items, color) => (items || []).map(i => `<li style="margin-bottom:6px;color:${color};">${i}</li>`).join('');
  const m = data.metrics || {};
  const focusHours = (m.totalFocusHours ?? 0).toFixed(1);
  const quizzes = m.quizzesCompleted ?? 0;
  const avgScore = (m.avgQuizScore ?? 0).toFixed(0);
  const flashcardSessions = m.flashcardSessions ?? 0;
  const summary = data.summary || { highlights: [], challenges: [], patterns: [], recommendations: [] };
  const compHtml = data.comparison && (data.comparison.improvements.length > 0 || data.comparison.regressions.length > 0)
    ? `<div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:16px;">
        <h3 style="color:#e2e8f0;margin-top:0;">📊 vs Previous ${periodLabel === 'Monthly' ? 'Month' : 'Week'}</h3>
        ${data.comparison.improvements.length > 0 ? `<p style="color:#10b981;font-size:12px;font-weight:bold;margin:0 0 4px;">Improvements</p><ul style="padding-left:20px;margin:0 0 12px;">${listHtml(data.comparison.improvements, '#10b981')}</ul>` : ''}
        ${data.comparison.regressions.length > 0 ? `<p style="color:#ef4444;font-size:12px;font-weight:bold;margin:0 0 4px;">Regressions</p><ul style="padding-left:20px;margin:0;">${listHtml(data.comparison.regressions, '#ef4444')}</ul>` : ''}
      </div>` : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="background:#0f172a;color:#e2e8f0;font-family:sans-serif;padding:32px;max-width:600px;margin:0 auto;">
  <h1 style="color:#a78bfa;margin-bottom:4px;">${periodLabel} Reflection</h1>
  <p style="color:#64748b;margin-top:0;">Hi ${name} — ${startDate} to ${endDate}</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td width="25%" style="padding-right:4px;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;"><tr><td style="padding:14px;text-align:center;"><p style="color:#94a3b8;margin:0 0 4px;font-size:11px;">Focus Hours</p><p style="font-size:22px;font-weight:bold;color:#38bdf8;margin:0;">${focusHours}</p></td></tr></table></td>
      <td width="25%" style="padding:0 2px;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;"><tr><td style="padding:14px;text-align:center;"><p style="color:#94a3b8;margin:0 0 4px;font-size:11px;">Quizzes</p><p style="font-size:22px;font-weight:bold;color:#818cf8;margin:0;">${quizzes}</p></td></tr></table></td>
      <td width="25%" style="padding:0 2px;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;"><tr><td style="padding:14px;text-align:center;"><p style="color:#94a3b8;margin:0 0 4px;font-size:11px;">Avg Score</p><p style="font-size:22px;font-weight:bold;color:#10b981;margin:0;">${avgScore}%</p></td></tr></table></td>
      <td width="25%" style="padding-left:4px;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;"><tr><td style="padding:14px;text-align:center;"><p style="color:#94a3b8;margin:0 0 4px;font-size:11px;">Flashcard Sessions</p><p style="font-size:22px;font-weight:bold;color:#f59e0b;margin:0;">${flashcardSessions}</p></td></tr></table></td>
    </tr>
  </table>
  <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:16px;"><h3 style="color:#10b981;margin-top:0;">✨ Highlights</h3><ul style="padding-left:20px;margin:0;">${listHtml(summary.highlights, '#94a3b8')}</ul></div>
  <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:16px;"><h3 style="color:#f59e0b;margin-top:0;">⚡ Challenges</h3><ul style="padding-left:20px;margin:0;">${listHtml(summary.challenges, '#94a3b8')}</ul></div>
  <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:16px;"><h3 style="color:#38bdf8;margin-top:0;">🔍 Patterns</h3><ul style="padding-left:20px;margin:0;">${listHtml(summary.patterns, '#94a3b8')}</ul></div>
  <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:16px;"><h3 style="color:#a78bfa;margin-top:0;">💡 Recommendations</h3><ul style="padding-left:20px;margin:0;">${listHtml(summary.recommendations, '#94a3b8')}</ul></div>
  ${compHtml}
  <a href="${APP_URL}/study/analytics" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-right:8px;">Study Analytics →</a>
  <a href="${APP_URL}/focus/analytics" style="display:inline-block;background:#0ea5e9;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Focus Analytics →</a>
  <p style="color:#334155;font-size:12px;margin-top:32px;">Email notifications are enabled. <a href="${APP_URL}/profile" style="color:#475569;">Manage preferences</a></p>
</body></html>`;
}

// ---------------------------------------------------------------------------
// Agent computation functions (mirror the TypeScript agents exactly)
// ---------------------------------------------------------------------------

function computeProductivityData(currentSessions, previousSessions, now) {
  const currentWeekStart = new Date(now);
  currentWeekStart.setDate(now.getDate() - 7);
  currentWeekStart.setHours(0, 0, 0, 0);

  // Daily focus hours
  const daily = new Array(7).fill(0);
  for (const s of currentSessions) {
    const idx = Math.floor((s.startedAt.getTime() - currentWeekStart.getTime()) / (1000 * 60 * 60 * 24));
    if (idx >= 0 && idx < 7) daily[idx] += s.duration / 60;
  }
  const slope = linearRegressionSlope(daily);
  const trend = slope > 0.1 ? 'INCREASING' : slope < -0.1 ? 'DECREASING' : 'STABLE';

  const daysWithSessions = daily.filter(h => h > 0).length;
  const consistency = daysWithSessions / 7;
  const currentTotalHours = currentSessions.reduce((s, x) => s + x.duration, 0) / 60;
  const scoredCurrent = currentSessions.filter(s => s.focusScore !== null);
  const currentAvgScore = scoredCurrent.length > 0 ? scoredCurrent.reduce((s, x) => s + x.focusScore, 0) / scoredCurrent.length : 0;
  const weeklyScore = Math.min(100, Math.max(0, (consistency * 0.4 + (currentTotalHours / 14) * 0.4 + (currentAvgScore / 10) * 0.2) * 100));

  const prevTotalHours = previousSessions.reduce((s, x) => s + x.duration, 0) / 60;
  const scoredPrev = previousSessions.filter(s => s.focusScore !== null);
  const prevAvgScore = scoredPrev.length > 0 ? scoredPrev.reduce((s, x) => s + x.focusScore, 0) / scoredPrev.length : 0;

  const insights = [];
  if (trend === 'INCREASING') insights.push({ type: 'TREND', severity: 'INFO', message: 'Your daily focus hours are trending upward this week. Great momentum!' });
  else if (trend === 'DECREASING') insights.push({ type: 'TREND', severity: 'WARNING', message: 'Your daily focus hours are declining this week. Consider reviewing your schedule.' });
  if (consistency < 0.5) insights.push({ type: 'CONSISTENCY', severity: 'WARNING', message: `You only had focus sessions on ${daysWithSessions} out of 7 days. Try to build a more consistent daily habit.` });
  const focusHoursChange = percentChange(currentTotalHours, prevTotalHours);
  if (focusHoursChange < -20) insights.push({ type: 'WEEK_OVER_WEEK', severity: 'WARNING', message: `Focus hours dropped ${Math.abs(focusHoursChange).toFixed(0)}% compared to last week.` });
  else if (focusHoursChange > 20) insights.push({ type: 'WEEK_OVER_WEEK', severity: 'INFO', message: `Focus hours increased ${focusHoursChange.toFixed(0)}% compared to last week. Keep it up!` });
  if (currentSessions.length === 0) insights.push({ type: 'NO_DATA', severity: 'INFO', message: 'No focus sessions recorded this week.' });

  return {
    weeklyScore: Math.round(weeklyScore * 10) / 10,
    trend,
    burnoutWarning: false,
    weekOverWeek: {
      focusHoursChange: Math.round(percentChange(currentTotalHours, prevTotalHours) * 10) / 10,
      sessionsChange: Math.round(percentChange(currentSessions.length, previousSessions.length) * 10) / 10,
      avgScoreChange: Math.round(percentChange(currentAvgScore, prevAvgScore) * 10) / 10,
    },
    insights,
  };
}

function computeStudyData(flashcardSessions, quizAttempts) {
  const totalFlashcardSessions = flashcardSessions.length;
  const totalFlashcardCards = flashcardSessions.reduce((s, x) => s + x.cardCount, 0);
  const totalFlashcardMinutes = Math.round(flashcardSessions.reduce((s, x) => s + (x.durationSeconds ?? 0), 0) / 60);
  const totalQuizAttempts = quizAttempts.length;
  const avgQuizScore = totalQuizAttempts > 0 ? quizAttempts.reduce((s, a) => s + a.score, 0) / totalQuizAttempts : 0;

  // Material performance
  const materialMap = new Map();
  for (const attempt of quizAttempts) {
    const mat = attempt.quiz?.sourceMaterial;
    if (!mat) continue;
    if (!materialMap.has(mat.id)) materialMap.set(mat.id, { materialName: mat.fileName, scores: [] });
    materialMap.get(mat.id).scores.push(attempt.score);
  }
  const materialPerformance = Array.from(materialMap.entries()).map(([, { materialName, scores }]) => {
    const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
    const trend = scores.length < 2 ? 'STABLE' : scores[0] > scores[scores.length - 1] + 5 ? 'IMPROVING' : scores[0] < scores[scores.length - 1] - 5 ? 'DECLINING' : 'STABLE';
    return { materialName, avgScore: avg, attemptCount: scores.length, trend };
  });

  // Topics needing attention — primary source: pre-seeded weakAreaAnalysis on each attempt.
  // This ensures the email topics exactly match what the UI shows in the Weak Areas section.
  const topicMap = new Map(); // topic -> { incorrectCount, totalAppearances, quizTitles, sourceMaterial, recommendations }

  for (const attempt of quizAttempts) {
    const analysis = attempt.weakAreaAnalysis;
    const wrongCount = attempt.totalQuestions - attempt.correctAnswers;
    if (!analysis || !Array.isArray(analysis.weakTopics) || analysis.weakTopics.length === 0) continue;
    if (wrongCount === 0) continue;

    for (let ti = 0; ti < analysis.weakTopics.length; ti++) {
      const topic = analysis.weakTopics[ti];
      if (!topicMap.has(topic)) {
        topicMap.set(topic, {
          incorrectCount: 0,
          totalAppearances: 0,
          quizTitles: new Set(),
          sourceMaterial: attempt.quiz?.sourceMaterial ?? null,
          recommendation: analysis.recommendations?.[ti] ?? `Review ${topic} in your study materials.`,
        });
      }
      const entry = topicMap.get(topic);
      entry.incorrectCount += wrongCount;
      entry.totalAppearances += attempt.totalQuestions;
      entry.quizTitles.add(attempt.quiz?.title ?? '');
    }
  }

  const topicsNeedingAttention = Array.from(topicMap.entries())
    .map(([topic, data]) => ({
      topic,
      incorrectCount: data.incorrectCount,
      totalAppearances: data.totalAppearances,
      errorRate: data.totalAppearances > 0 ? data.incorrectCount / data.totalAppearances : 0,
      quizTitles: Array.from(data.quizTitles),
      sourceMaterial: data.sourceMaterial,
      recommendation: data.recommendation,
    }))
    .filter(t => t.incorrectCount > 0)
    .sort((a, b) => b.errorRate - a.errorRate || b.incorrectCount - a.incorrectCount)
    .slice(0, 5);

  return {
    weekSummary: { totalFlashcardSessions, totalFlashcardCards, totalFlashcardMinutes, totalQuizAttempts, avgQuizScore: Math.round(avgQuizScore * 10) / 10 },
    materialPerformance,
    topicsNeedingAttention,
  };
}

function computeReflectionData(periodType, periodStart, periodEnd, currentFocusSessions, previousFocusSessions, currentQuizAttempts, previousQuizAttempts, currentFlashcardSessions, previousFlashcardSessions, priorAgentOutputs) {
  // Focus metrics
  const focusMetrics = (sessions) => {
    const dailyHours = {};
    let totalMinutes = 0, scoreSum = 0, scoreCount = 0;
    for (const s of sessions) {
      const day = isoDate(s.startedAt);
      dailyHours[day] = (dailyHours[day] ?? 0) + s.duration / 60;
      totalMinutes += s.duration;
      if (s.focusScore !== null) { scoreSum += s.focusScore; scoreCount++; }
    }
    return { totalSessions: sessions.length, totalFocusHours: totalMinutes / 60, avgFocusScore: scoreCount > 0 ? scoreSum / scoreCount : 0, dailyHours };
  };

  const studyMetrics = (quizAttempts, flashcardSessions) => {
    const dailyQuizScores = {};
    for (const a of quizAttempts) {
      const day = isoDate(a.completedAt ?? new Date());
      if (!dailyQuizScores[day]) dailyQuizScores[day] = [];
      dailyQuizScores[day].push(a.score);
    }
    const avgQuizScore = quizAttempts.length > 0 ? quizAttempts.reduce((s, a) => s + a.score, 0) / quizAttempts.length : 0;
    const totalFlashcardSeconds = flashcardSessions.reduce((s, x) => s + (x.durationSeconds ?? 900), 0);
    return { quizzesCompleted: quizAttempts.length, avgQuizScore, flashcardSessions: flashcardSessions.length, totalFlashcardMinutes: Math.round(totalFlashcardSeconds / 60), dailyQuizScores };
  };

  const cf = focusMetrics(currentFocusSessions);
  const pf = focusMetrics(previousFocusSessions);
  const cs = studyMetrics(currentQuizAttempts, currentFlashcardSessions);
  const ps = studyMetrics(previousQuizAttempts, previousFlashcardSessions);
  const label = periodType === 'MONTHLY' ? 'month' : 'week';

  const highlights = [], challenges = [], patterns = [], recommendations = [];

  if (cf.totalFocusHours > 0) highlights.push(`Logged ${cf.totalFocusHours.toFixed(1)} hours of focused work this ${label}.`);
  if (cs.quizzesCompleted > 0) highlights.push(`Completed ${cs.quizzesCompleted} quiz${cs.quizzesCompleted > 1 ? 'zes' : ''} with an average score of ${cs.avgQuizScore.toFixed(0)}%.`);
  if (cs.flashcardSessions > 0) highlights.push(`Reviewed flashcards in ${cs.flashcardSessions} session${cs.flashcardSessions > 1 ? 's' : ''}.`);

  for (const o of priorAgentOutputs) {
    if (o.agentId === 'productivity-analyst' && o.content?.weeklyScore >= 70) {
      highlights.push(`Productivity score of ${o.content.weeklyScore.toFixed(0)}/100 — strong week.`);
    }
  }

  if (cf.totalFocusHours === 0) challenges.push('No focus sessions recorded this period.');
  else if (cf.totalFocusHours < pf.totalFocusHours * 0.7) challenges.push(`Focus time dropped significantly compared to the previous ${label}.`);
  if (cs.avgQuizScore > 0 && cs.avgQuizScore < 60) challenges.push(`Quiz performance is below 60% — consider revisiting source materials.`);

  for (const o of priorAgentOutputs) {
    if (o.agentId === 'productivity-analyst' && o.content?.burnoutWarning) challenges.push(o.content.burnoutDetails ?? 'Burnout risk detected this period.');
    if (o.agentId === 'study-companion') {
      const topics = o.content?.topicsNeedingAttention;
      if (Array.isArray(topics) && topics.length > 0) {
        const names = topics.slice(0, 3).map(t => typeof t === 'string' ? t : t.topic);
        challenges.push(`Topics needing attention: ${names.join(', ')}.`);
      }
      if (o.content?.weekSummary?.avgQuizScore > 0 && o.content.weekSummary.avgQuizScore < 60) {
        challenges.push(`Average quiz score this week is ${o.content.weekSummary.avgQuizScore.toFixed(0)}% — below the 60% threshold.`);
      }
    }
  }

  // Correlation pattern
  const allDays = new Set([...Object.keys(cf.dailyHours), ...Object.keys(cs.dailyQuizScores)]);
  const focusArr = [], quizArr = [];
  for (const day of allDays) {
    const scores = cs.dailyQuizScores[day];
    if (scores && scores.length > 0) {
      focusArr.push(cf.dailyHours[day] ?? 0);
      quizArr.push(scores.reduce((a, b) => a + b, 0) / scores.length);
    }
  }
  const corr = pearsonCorrelation(focusArr, quizArr);
  if (corr !== null) {
    if (corr > 0.5) patterns.push(`Strong positive correlation (r=${corr.toFixed(2)}) between daily focus hours and quiz scores — more focused study leads to better results.`);
    else if (corr < -0.3) patterns.push(`Negative correlation (r=${corr.toFixed(2)}) between focus hours and quiz scores — high-volume days may be reducing retention quality.`);
    else patterns.push(`No strong correlation between focus hours and quiz scores this period — performance appears consistent regardless of session length.`);
  }
  if (cf.totalSessions > 0 && cs.quizzesCompleted > 0 && cs.quizzesCompleted / cf.totalSessions > 0.5) {
    patterns.push('High quiz-to-session ratio — you are actively testing your knowledge alongside focused study.');
  }

  if (cf.totalFocusHours < 5) recommendations.push('Aim for at least 1 hour of focused work per day to build a consistent habit.');
  if (cs.quizzesCompleted === 0) recommendations.push('Try completing at least one quiz this period to reinforce your learning.');
  if (cs.avgQuizScore > 0 && cs.avgQuizScore < 70) recommendations.push('Review source materials for topics where quiz scores are below 70%.');
  if (cs.flashcardSessions === 0 && cs.quizzesCompleted > 0) recommendations.push('Add flashcard review sessions to complement your quiz practice.');
  for (const o of priorAgentOutputs) {
    if (o.agentId === 'focus-coach') {
      const hp = o.content?.suggestions?.find(s => s.priority === 'HIGH');
      if (hp) recommendations.push(`Focus Coach: ${hp.message}`);
    }
  }

  if (highlights.length === 0) highlights.push('Keep going — every session counts.');
  if (challenges.length === 0) challenges.push('No major challenges identified this period.');
  if (patterns.length === 0) patterns.push('Not enough data yet to identify cross-domain patterns.');
  if (recommendations.length === 0) recommendations.push('Maintain your current pace and keep building consistency.');

  const focusHoursChange = percentChange(cf.totalFocusHours, pf.totalFocusHours);
  const quizScoreChange = percentChange(cs.avgQuizScore, ps.avgQuizScore);
  const sessionsChange = percentChange(cf.totalSessions, pf.totalSessions);
  const improvements = [], regressions = [];
  if (focusHoursChange > 10) improvements.push(`Focus hours up ${focusHoursChange.toFixed(0)}%`);
  else if (focusHoursChange < -10) regressions.push(`Focus hours down ${Math.abs(focusHoursChange).toFixed(0)}%`);
  if (quizScoreChange > 5) improvements.push(`Quiz scores up ${quizScoreChange.toFixed(0)}%`);
  else if (quizScoreChange < -5) regressions.push(`Quiz scores down ${Math.abs(quizScoreChange).toFixed(0)}%`);
  if (sessionsChange > 10) improvements.push(`Session count up ${sessionsChange.toFixed(0)}%`);
  else if (sessionsChange < -10) regressions.push(`Session count down ${Math.abs(sessionsChange).toFixed(0)}%`);

  return {
    period: { type: periodType, startDate: periodStart.toISOString(), endDate: periodEnd.toISOString() },
    summary: { highlights, challenges, patterns, recommendations },
    metrics: {
      totalFocusHours: Math.round(cf.totalFocusHours * 10) / 10,
      totalStudyTimeMinutes: cs.totalFlashcardMinutes,
      quizzesCompleted: cs.quizzesCompleted,
      avgQuizScore: Math.round(cs.avgQuizScore * 10) / 10,
      flashcardSessions: cs.flashcardSessions,
    },
    comparison: { improvements, regressions, percentageChanges: { focusHours: Math.round(focusHoursChange * 10) / 10, quizScore: Math.round(quizScoreChange * 10) / 10, sessions: Math.round(sessionsChange * 10) / 10 } },
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    console.log(`\n🤖 Academic Buddy — Agent Runner (direct mode, no server needed)`);
    console.log(`   Email: ${EMAIL}\n`);

    const user = await prisma.user.findUnique({ where: { email: EMAIL } });
    if (!user) {
      console.error(`❌ No user found with email "${EMAIL}". Sign up first, then run this script.`);
      process.exit(1);
    }
    console.log(`✅ Found user: ${user.name ?? EMAIL} (${user.id})`);

    if (!user.emailNotificationsEnabled) {
      await prisma.user.update({ where: { id: user.id }, data: { emailNotificationsEnabled: true } });
      console.log('✅ Email notifications enabled');
    }

    const userId = user.id;
    const now = new Date();

    // Time windows
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7); weekStart.setHours(0, 0, 0, 0);
    const prevWeekStart = new Date(weekStart); prevWeekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now); monthStart.setDate(now.getDate() - 30); monthStart.setHours(0, 0, 0, 0);
    const prevMonthStart = new Date(monthStart); prevMonthStart.setDate(monthStart.getDate() - 30);

    // -----------------------------------------------------------------------
    // Step 1: Pre-compute weak area analysis for all quiz attempts
    // -----------------------------------------------------------------------
    console.log('\n[1/5] Pre-computing weak area analysis for quiz attempts...');
    const attemptsNeedingAnalysis = await prisma.quizAttempt.findMany({
      where: { quiz: { userId }, completedAt: { not: null }, weakAreaAnalysis: { equals: null } },
      include: {
        questionAttempts: {
          where: { isCorrect: false },
          include: { quizQuestion: { select: { questionText: true, correctAnswer: true, explanation: true } } },
        },
        quiz: { select: { title: true } },
      },
    });

    let analysisCount = 0;
    for (const attempt of attemptsNeedingAnalysis) {
      if (attempt.questionAttempts.length === 0) {
        await prisma.$executeRaw`UPDATE quiz_attempts SET "weakAreaAnalysis" = ${JSON.stringify({ weakTopics: [], weakDifficulties: [], recommendations: ['Perfect score! No weak areas detected.'] })}::jsonb WHERE id = ${attempt.id}`;
        analysisCount++;
        continue;
      }
      const wrongQuestions = attempt.questionAttempts.map(qa => ({
        questionText: qa.quizQuestion.questionText,
        selectedAnswer: qa.selectedAnswer,
        correctAnswer: qa.quizQuestion.correctAnswer,
        explanation: qa.quizQuestion.explanation || '',
      }));
      const analysis = await analyzeWeakAreasWithAI(wrongQuestions);
      if (analysis) {
        await prisma.$executeRaw`UPDATE quiz_attempts SET "weakAreaAnalysis" = ${JSON.stringify(analysis)}::jsonb WHERE id = ${attempt.id}`;
        analysisCount++;
      }
    }
    console.log(`   ✅ Analyzed ${analysisCount}/${attemptsNeedingAnalysis.length} attempts (${attemptsNeedingAnalysis.length - analysisCount} skipped — no GROQ key or already done)`);

    // -----------------------------------------------------------------------
    // Step 2: Fetch all data needed for agents
    // -----------------------------------------------------------------------
    console.log('\n[2/5] Fetching data...');
    const [
      currentWeekFocus, previousWeekFocus,
      currentMonthFocus, previousMonthFocus,
      weeklyQuizAttempts, monthlyQuizAttempts,
      prevWeekQuizAttempts, prevMonthQuizAttempts,
      weeklyFlashcardSessions, monthlyFlashcardSessions,
      prevWeekFlashcardSessions, prevMonthFlashcardSessions,
    ] = await Promise.all([
      prisma.pomodoroLog.findMany({ where: { userId, startedAt: { gte: weekStart, lt: now } }, orderBy: { startedAt: 'asc' }, select: { id: true, duration: true, focusScore: true, sessionType: true, startedAt: true, completedAt: true } }),
      prisma.pomodoroLog.findMany({ where: { userId, startedAt: { gte: prevWeekStart, lt: weekStart } }, orderBy: { startedAt: 'asc' }, select: { id: true, duration: true, focusScore: true, sessionType: true, startedAt: true, completedAt: true } }),
      prisma.pomodoroLog.findMany({ where: { userId, startedAt: { gte: monthStart, lt: now } }, select: { id: true, duration: true, focusScore: true, startedAt: true } }),
      prisma.pomodoroLog.findMany({ where: { userId, startedAt: { gte: prevMonthStart, lt: monthStart } }, select: { id: true, duration: true, focusScore: true, startedAt: true } }),
      prisma.quizAttempt.findMany({
        where: { quiz: { userId }, completedAt: { gte: weekStart, lt: now } },
        include: {
          quiz: {
            include: { sourceMaterial: { select: { id: true, fileName: true } } },
          },
        },
      }),
      prisma.quizAttempt.findMany({ where: { quiz: { userId }, completedAt: { gte: monthStart, lt: now } }, select: { id: true, score: true, completedAt: true } }),
      prisma.quizAttempt.findMany({ where: { quiz: { userId }, completedAt: { gte: prevWeekStart, lt: weekStart } }, select: { id: true, score: true, completedAt: true } }),
      prisma.quizAttempt.findMany({ where: { quiz: { userId }, completedAt: { gte: prevMonthStart, lt: monthStart } }, select: { id: true, score: true, completedAt: true } }),
      prisma.flashcardSession.findMany({ where: { userId, sessionStartedAt: { gte: weekStart, lt: now } }, select: { id: true, cardCount: true, durationSeconds: true, sessionStartedAt: true } }),
      prisma.flashcardSession.findMany({ where: { userId, sessionStartedAt: { gte: monthStart, lt: now } }, select: { id: true, sessionStartedAt: true, durationSeconds: true } }),
      prisma.flashcardSession.findMany({ where: { userId, sessionStartedAt: { gte: prevWeekStart, lt: weekStart } }, select: { id: true, sessionStartedAt: true, durationSeconds: true } }),
      prisma.flashcardSession.findMany({ where: { userId, sessionStartedAt: { gte: prevMonthStart, lt: monthStart } }, select: { id: true, sessionStartedAt: true, durationSeconds: true } }),
    ]);

    console.log(`   Focus sessions (this week): ${currentWeekFocus.length}`);
    console.log(`   Focus sessions (prev week):  ${previousWeekFocus.length}`);
    console.log(`   Quiz attempts (this week):   ${weeklyQuizAttempts.length}`);
    console.log(`   Flashcard sessions (week):   ${weeklyFlashcardSessions.length}`);

    // -----------------------------------------------------------------------
    // Step 3: Compute agent outputs
    // -----------------------------------------------------------------------
    console.log('\n[3/5] Computing agent outputs...');

    const productivityData = computeProductivityData(currentWeekFocus, previousWeekFocus, now);
    console.log(`   ✅ Productivity: score=${productivityData.weeklyScore}, trend=${productivityData.trend}`);

    const studyData = computeStudyData(weeklyFlashcardSessions, weeklyQuizAttempts);
    console.log(`   ✅ Study: ${studyData.weekSummary.totalQuizAttempts} quizzes, avg=${studyData.weekSummary.avgQuizScore.toFixed(0)}%, ${studyData.topicsNeedingAttention.length} weak topics`);

    // Store agent outputs so dashboards show the same data
    const storeOutput = async (agentId, outputType, content) => {
      const exec = await prisma.agentExecution.create({ data: { agentId, userId, eventType: 'WEEKLY_TRIGGER', status: 'COMPLETED', completedAt: now } });
      await prisma.agentOutput.create({ data: { agentId, userId, executionId: exec.id, outputType, content, explainability: { reasoning: 'Demo run', dataSourcesUsed: [], analysisMethod: 'demo', keyFactors: {} }, confidence: 0.85 } });
    };

    await storeOutput('productivity-analyst', 'INSIGHT', productivityData);
    await storeOutput('study-companion', 'INSIGHT', studyData);

    // Fetch stored outputs for reflection agent to use
    const priorOutputs = await prisma.agentOutput.findMany({
      where: { userId, agentId: { in: ['productivity-analyst', 'study-companion', 'focus-coach'] }, createdAt: { gte: weekStart } },
      select: { agentId: true, outputType: true, content: true, createdAt: true },
      orderBy: { createdAt: 'desc' }, take: 20,
    });

    const weeklyReflectionData = computeReflectionData('WEEKLY', weekStart, now, currentWeekFocus, previousWeekFocus, weeklyQuizAttempts, prevWeekQuizAttempts, weeklyFlashcardSessions, prevWeekFlashcardSessions, priorOutputs);
    console.log(`   ✅ Weekly reflection: ${weeklyReflectionData.summary.highlights.length} highlights, ${weeklyReflectionData.summary.challenges.length} challenges`);
    console.log(`      metrics: focusHours=${weeklyReflectionData.metrics.totalFocusHours}, quizzes=${weeklyReflectionData.metrics.quizzesCompleted}, avgScore=${weeklyReflectionData.metrics.avgQuizScore}, flashcards=${weeklyReflectionData.metrics.flashcardSessions}`);

    const monthlyReflectionData = computeReflectionData('MONTHLY', monthStart, now, currentMonthFocus, previousMonthFocus, monthlyQuizAttempts, prevMonthQuizAttempts, monthlyFlashcardSessions, prevMonthFlashcardSessions, priorOutputs);
    console.log(`   ✅ Monthly reflection: ${monthlyReflectionData.summary.highlights.length} highlights, ${monthlyReflectionData.summary.challenges.length} challenges`);
    console.log(`      metrics: focusHours=${monthlyReflectionData.metrics.totalFocusHours}, quizzes=${monthlyReflectionData.metrics.quizzesCompleted}, avgScore=${monthlyReflectionData.metrics.avgQuizScore}, flashcards=${monthlyReflectionData.metrics.flashcardSessions}`);

    await storeOutput('reflection', 'REFLECTION', weeklyReflectionData);

    // -----------------------------------------------------------------------
    // Step 4: Send all 4 emails
    // -----------------------------------------------------------------------
    console.log('\n[4/5] Sending emails...');
    const userName = user.name ?? 'Student';

    try {
      await sendEmail(user.email, userName, `Your Weekly Productivity Report — Score: ${productivityData.weeklyScore.toFixed(0)}/100`, buildProductivityEmail(userName, productivityData));
      console.log('   ✅ Weekly Productivity Report sent');
    } catch (e) { console.error('   ❌ Weekly Productivity Report failed:', e.message); }

    try {
      await sendEmail(user.email, userName, `Your Weekly Study Report — ${studyData.weekSummary.totalQuizAttempts} quiz${studyData.weekSummary.totalQuizAttempts !== 1 ? 'zes' : ''} completed`, buildStudyEmail(userName, studyData));
      console.log('   ✅ Weekly Study Report sent');
    } catch (e) { console.error('   ❌ Weekly Study Report failed:', e.message); }

    try {
      const wStart = new Date(weeklyReflectionData.period.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const wEnd = new Date(weeklyReflectionData.period.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      await sendEmail(user.email, userName, `Your Weekly Reflection — ${wStart} to ${wEnd}`, buildReflectionEmail(userName, weeklyReflectionData, 'Weekly'));
      console.log('   ✅ Weekly Reflection sent');
    } catch (e) { console.error('   ❌ Weekly Reflection failed:', e.message, e.stack); }

    try {
      const mStart = new Date(monthlyReflectionData.period.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const mEnd = new Date(monthlyReflectionData.period.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      await sendEmail(user.email, userName, `Your Monthly Reflection — ${mStart} to ${mEnd}`, buildReflectionEmail(userName, monthlyReflectionData, 'Monthly'));
      console.log('   ✅ Monthly Reflection sent');
    } catch (e) { console.error('   ❌ Monthly Reflection failed:', e.message, e.stack); }

    // -----------------------------------------------------------------------
    // Step 5: Summary
    // -----------------------------------------------------------------------
    console.log('\n[5/5] Done!\n');
    console.log('📬 Check your inbox for 4 emails:');
    console.log('   • Weekly Productivity Report');
    console.log('   • Weekly Study Report');
    console.log('   • Weekly Reflection');
    console.log('   • Monthly Reflection\n');
    console.log('📊 Agent dashboards updated — open the app to verify:');
    console.log(`   → ${APP_URL}/focus/analytics`);
    console.log(`   → ${APP_URL}/study/analytics`);
    console.log(`   → ${APP_URL}/study/quizzes  (weak area analysis pre-computed)\n`);

    if (studyData.topicsNeedingAttention.length > 0) {
      console.log('⚠️  Weak topics identified this week:');
      studyData.topicsNeedingAttention.forEach(t => console.log(`   • ${t.topic} (${(t.errorRate * 100).toFixed(0)}% error rate)`));
      console.log('');
    }

  } finally {
    await prisma.$disconnect();
  }
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
