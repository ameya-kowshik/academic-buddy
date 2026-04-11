import { BrevoClient } from '@getbrevo/brevo';
import { prisma } from '@/lib/prisma';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const FROM_EMAIL = process.env.BREVO_FROM_EMAIL ?? '';
const FROM_NAME = 'Veyra';

// Lazily initialised so the module can be imported without a key present
let _client: BrevoClient | null = null;
function getClient(): BrevoClient {
  if (!_client) {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) throw new Error('[EmailService] BREVO_API_KEY is not set');
    _client = new BrevoClient({ apiKey });
  }
  return _client;
}

interface UserEmailPrefs {
  email: string;
  name: string;
  notificationsEnabled: boolean;
}

export interface ProductivityReportData {
  weeklyScore: number;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  burnoutWarning: boolean;
  burnoutDetails?: string;
  weekOverWeek: {
    focusHoursChange: number;
    sessionsChange: number;
    avgScoreChange: number;
  };
  insights: Array<{ type: string; severity: string; message: string }>;
}

export interface StudyReportData {
  weekSummary: {
    totalFlashcardSessions: number;
    totalFlashcardCards: number;
    totalFlashcardMinutes: number;
    totalQuizAttempts: number;
    avgQuizScore: number;
  };
  materialPerformance: Array<{
    materialName: string;
    avgScore: number;
    attemptCount: number;
    trend: string;
  }>;
  topicsNeedingAttention: string[];
}

export interface ReflectionData {
  period: { type: 'WEEKLY' | 'MONTHLY'; startDate: string; endDate: string };
  summary: {
    highlights: string[];
    challenges: string[];
    patterns: string[];
    recommendations: string[];
  };
  metrics: {
    totalFocusHours: number;
    quizzesCompleted: number;
    avgQuizScore: number;
    flashcardSessions: number;
  };
}

export class EmailService {
  private async getUserEmailPrefs(userId: string): Promise<UserEmailPrefs | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, emailNotificationsEnabled: true },
    });
    if (!user) return null;
    return {
      email: user.email,
      name: user.name ?? 'Student',
      notificationsEnabled: user.emailNotificationsEnabled,
    };
  }

  private async send(to: string, toName: string, subject: string, html: string): Promise<void> {
    await getClient().transactionalEmails.sendTransacEmail({
      sender: { email: FROM_EMAIL, name: FROM_NAME },
      to: [{ email: to, name: toName }],
      subject,
      htmlContent: html,
    });
  }

  async sendWeeklyProductivityReport(userId: string, data: ProductivityReportData): Promise<void> {
    const prefs = await this.getUserEmailPrefs(userId);
    if (!prefs || !prefs.notificationsEnabled) return;

    const trendEmoji = data.trend === 'INCREASING' ? '📈' : data.trend === 'DECREASING' ? '📉' : '➡️';
    const scoreColor = data.weeklyScore >= 70 ? '#10b981' : data.weeklyScore >= 40 ? '#f59e0b' : '#ef4444';

    const insightsHtml = data.insights
      .map((i) => `<li style="margin-bottom:6px;color:#94a3b8;">${i.message}</li>`)
      .join('');

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#0f172a;color:#e2e8f0;font-family:sans-serif;padding:32px;max-width:600px;margin:0 auto;">
  <h1 style="color:#38bdf8;margin-bottom:4px;">Weekly Productivity Report</h1>
  <p style="color:#64748b;margin-top:0;">Hi ${prefs.name}, here's your focus summary.</p>

  <div style="background:#1e293b;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
    <p style="color:#94a3b8;margin:0 0 8px;">Weekly Score</p>
    <p style="font-size:48px;font-weight:bold;color:${scoreColor};margin:0;">${data.weeklyScore.toFixed(0)}</p>
    <p style="color:#64748b;margin:4px 0 0;">${trendEmoji} ${data.trend}</p>
  </div>

  ${data.burnoutWarning ? `
  <div style="background:#7f1d1d;border-radius:8px;padding:16px;margin-bottom:16px;">
    <p style="color:#fca5a5;margin:0;font-weight:bold;">⚠️ Burnout Risk Detected</p>
    <p style="color:#fca5a5;margin:8px 0 0;">${data.burnoutDetails ?? ''}</p>
  </div>` : ''}

  <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:16px;">
    <h3 style="color:#e2e8f0;margin-top:0;">Week-over-Week</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:6px 0;color:#94a3b8;">Focus Hours</td>
        <td style="text-align:right;color:${data.weekOverWeek.focusHoursChange >= 0 ? '#10b981' : '#ef4444'};">${data.weekOverWeek.focusHoursChange >= 0 ? '+' : ''}${data.weekOverWeek.focusHoursChange.toFixed(0)}%</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#94a3b8;">Sessions</td>
        <td style="text-align:right;color:${data.weekOverWeek.sessionsChange >= 0 ? '#10b981' : '#ef4444'};">${data.weekOverWeek.sessionsChange >= 0 ? '+' : ''}${data.weekOverWeek.sessionsChange.toFixed(0)}%</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#94a3b8;">Avg Focus Score</td>
        <td style="text-align:right;color:${data.weekOverWeek.avgScoreChange >= 0 ? '#10b981' : '#ef4444'};">${data.weekOverWeek.avgScoreChange >= 0 ? '+' : ''}${data.weekOverWeek.avgScoreChange.toFixed(0)}%</td>
      </tr>
    </table>
  </div>

  ${insightsHtml ? `
  <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:16px;">
    <h3 style="color:#e2e8f0;margin-top:0;">Insights</h3>
    <ul style="padding-left:20px;margin:0;">${insightsHtml}</ul>
  </div>` : ''}

  <a href="${APP_URL}/focus/analytics" style="display:inline-block;background:#0ea5e9;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">View Full Report →</a>

  <p style="color:#334155;font-size:12px;margin-top:32px;">You're receiving this because email notifications are enabled. <a href="${APP_URL}/profile" style="color:#475569;">Manage preferences</a></p>
</body>
</html>`;

    try {
      await this.send(
        prefs.email,
        prefs.name,
        `Your Weekly Productivity Report — Score: ${data.weeklyScore.toFixed(0)}/100`,
        html,
      );
    } catch (err) {
      console.error('[EmailService] Failed to send productivity report:', err);
    }
  }

  async sendWeeklyStudyReport(userId: string, data: StudyReportData): Promise<void> {
    const prefs = await this.getUserEmailPrefs(userId);
    if (!prefs || !prefs.notificationsEnabled) return;

    const topicsHtml = data.topicsNeedingAttention.length > 0
      ? data.topicsNeedingAttention.map((t) => `<li style="color:#fbbf24;">${t}</li>`).join('')
      : '<li style="color:#94a3b8;">No weak areas detected — great work!</li>';

    const materialsHtml = data.materialPerformance
      .slice(0, 5)
      .map((m) => `
        <tr>
          <td style="padding:6px 0;color:#94a3b8;">${m.materialName}</td>
          <td style="text-align:right;color:#e2e8f0;">${m.avgScore.toFixed(0)}%</td>
          <td style="text-align:right;color:#64748b;">${m.attemptCount} attempt${m.attemptCount !== 1 ? 's' : ''}</td>
        </tr>`)
      .join('');

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#0f172a;color:#e2e8f0;font-family:sans-serif;padding:32px;max-width:600px;margin:0 auto;">
  <h1 style="color:#818cf8;margin-bottom:4px;">Weekly Study Report</h1>
  <p style="color:#64748b;margin-top:0;">Hi ${prefs.name}, here's your study activity this week.</p>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td width="33%" style="padding-right:6px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;">
          <tr><td style="padding:16px;text-align:center;">
            <p style="color:#94a3b8;margin:0 0 6px;font-size:12px;">Quizzes</p>
            <p style="font-size:28px;font-weight:bold;color:#818cf8;margin:0;">${data.weekSummary.totalQuizAttempts}</p>
          </td></tr>
        </table>
      </td>
      <td width="33%" style="padding:0 3px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;">
          <tr><td style="padding:16px;text-align:center;">
            <p style="color:#94a3b8;margin:0 0 6px;font-size:12px;">Avg Score</p>
            <p style="font-size:28px;font-weight:bold;color:#10b981;margin:0;">${data.weekSummary.avgQuizScore.toFixed(0)}%</p>
          </td></tr>
        </table>
      </td>
      <td width="33%" style="padding-left:6px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;">
          <tr><td style="padding:16px;text-align:center;">
            <p style="color:#94a3b8;margin:0 0 6px;font-size:12px;">Flashcard Min</p>
            <p style="font-size:28px;font-weight:bold;color:#38bdf8;margin:0;">${data.weekSummary.totalFlashcardMinutes}</p>
          </td></tr>
        </table>
      </td>
    </tr>
  </table>

  ${materialsHtml ? `
  <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:16px;">
    <h3 style="color:#e2e8f0;margin-top:0;">Performance by Material</h3>
    <table style="width:100%;border-collapse:collapse;">${materialsHtml}</table>
  </div>` : ''}

  <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:24px;">
    <h3 style="color:#e2e8f0;margin-top:0;">Topics Needing Attention</h3>
    <ul style="padding-left:20px;margin:0;">${topicsHtml}</ul>
  </div>

  <a href="${APP_URL}/study/analytics" style="display:inline-block;background:#818cf8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">View Study Analytics →</a>

  <p style="color:#334155;font-size:12px;margin-top:32px;">You're receiving this because email notifications are enabled. <a href="${APP_URL}/profile" style="color:#475569;">Manage preferences</a></p>
</body>
</html>`;

    try {
      await this.send(
        prefs.email,
        prefs.name,
        `Your Weekly Study Report — ${data.weekSummary.totalQuizAttempts} quiz${data.weekSummary.totalQuizAttempts !== 1 ? 'zes' : ''} completed`,
        html,
      );
    } catch (err) {
      console.error('[EmailService] Failed to send study report:', err);
    }
  }

  async sendReflectionReport(userId: string, data: ReflectionData, period: 'weekly' | 'monthly'): Promise<void> {
    const prefs = await this.getUserEmailPrefs(userId);
    if (!prefs || !prefs.notificationsEnabled) return;

    const periodLabel = period === 'monthly' ? 'Monthly' : 'Weekly';
    const startDate = new Date(data.period.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endDate = new Date(data.period.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const listHtml = (items: string[], color: string) =>
      items.map((i) => `<li style="margin-bottom:6px;color:${color};">${i}</li>`).join('');

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#0f172a;color:#e2e8f0;font-family:sans-serif;padding:32px;max-width:600px;margin:0 auto;">
  <h1 style="color:#a78bfa;margin-bottom:4px;">${periodLabel} Reflection</h1>
  <p style="color:#64748b;margin-top:0;">Hi ${prefs.name} — ${startDate} to ${endDate}</p>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td width="33%" style="padding-right:6px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;">
          <tr><td style="padding:16px;text-align:center;">
            <p style="color:#94a3b8;margin:0 0 6px;font-size:12px;">Focus Hours</p>
            <p style="font-size:24px;font-weight:bold;color:#38bdf8;margin:0;">${data.metrics.totalFocusHours.toFixed(1)}</p>
          </td></tr>
        </table>
      </td>
      <td width="33%" style="padding:0 3px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;">
          <tr><td style="padding:16px;text-align:center;">
            <p style="color:#94a3b8;margin:0 0 6px;font-size:12px;">Quizzes</p>
            <p style="font-size:24px;font-weight:bold;color:#818cf8;margin:0;">${data.metrics.quizzesCompleted}</p>
          </td></tr>
        </table>
      </td>
      <td width="33%" style="padding-left:6px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;">
          <tr><td style="padding:16px;text-align:center;">
            <p style="color:#94a3b8;margin:0 0 6px;font-size:12px;">Avg Quiz Score</p>
            <p style="font-size:24px;font-weight:bold;color:#10b981;margin:0;">${data.metrics.avgQuizScore.toFixed(0)}%</p>
          </td></tr>
        </table>
      </td>
    </tr>
  </table>

  <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:16px;">
    <h3 style="color:#10b981;margin-top:0;">✨ Highlights</h3>
    <ul style="padding-left:20px;margin:0;">${listHtml(data.summary.highlights, '#94a3b8')}</ul>
  </div>

  <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:16px;">
    <h3 style="color:#f59e0b;margin-top:0;">⚡ Challenges</h3>
    <ul style="padding-left:20px;margin:0;">${listHtml(data.summary.challenges, '#94a3b8')}</ul>
  </div>

  <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:16px;">
    <h3 style="color:#38bdf8;margin-top:0;">🔍 Patterns</h3>
    <ul style="padding-left:20px;margin:0;">${listHtml(data.summary.patterns, '#94a3b8')}</ul>
  </div>

  <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:24px;">
    <h3 style="color:#a78bfa;margin-top:0;">💡 Recommendations</h3>
    <ul style="padding-left:20px;margin:0;">${listHtml(data.summary.recommendations, '#94a3b8')}</ul>
  </div>

  <a href="${APP_URL}/profile" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">View Full Reflection →</a>

  <p style="color:#334155;font-size:12px;margin-top:32px;">You're receiving this because email notifications are enabled. <a href="${APP_URL}/profile" style="color:#475569;">Manage preferences</a></p>
</body>
</html>`;

    try {
      await this.send(
        prefs.email,
        prefs.name,
        `Your ${periodLabel} Reflection — ${startDate} to ${endDate}`,
        html,
      );
    } catch (err) {
      console.error('[EmailService] Failed to send reflection report:', err);
    }
  }
}
