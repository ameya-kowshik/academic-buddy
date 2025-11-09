import { PomodoroLog } from '@prisma/client';
import { Tag } from '@/lib/focus-utils';

export type FocusSession = PomodoroLog;

export interface AnalyticsData {
  totalSessions: number;
  totalFocusTime: number; // in minutes
  totalHours: number;
  averageSessionLength: number;
  averageFocusScore: number;
  currentStreak: number;
  bestStreak: number;
  todayStats: {
    date: string;
    sessions: number;
    focusTime: number;
  };
  tagDistribution: Array<{
    tagId: string;
    tagName: string;
    tagColor: string;
    sessions: number;
    focusTime: number;
    percentage: number;
  }>;
  dailyData: Array<{
    date: string;
    sessions: number;
    focusTime: number;
    tagBreakdown: Array<{
      tagId: string;
      focusTime: number;
    }>;
  }>;
}

export interface CalendarData {
  [date: string]: {
    sessions: number;
    focusTime: number;
    intensity: number; // 0-1 for heatmap
  };
}

export interface TimelineEntry {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  sessionType: string;
  tagId?: string | null;
  tagName?: string;
  tagColor?: string;
  taskId?: string | null;
  notes?: string | null;
  focusScore?: number | null;
}

export const analyticsUtils = {
  // Calculate comprehensive analytics data
  calculateAnalytics(sessions: FocusSession[], tags: Tag[]): AnalyticsData {
    if (!sessions.length) {
      return {
        totalSessions: 0,
        totalFocusTime: 0,
        totalHours: 0,
        averageSessionLength: 0,
        averageFocusScore: 0,
        currentStreak: 0,
        bestStreak: 0,
        todayStats: {
          date: new Date().toISOString().split('T')[0],
          sessions: 0,
          focusTime: 0,
        },
        tagDistribution: [],
        dailyData: [],
      };
    }

    const totalSessions = sessions.length;
    const totalFocusTime = sessions.reduce((sum, session) => sum + session.duration, 0);
    const totalHours = Math.floor(totalFocusTime / 60);
    const averageSessionLength = totalFocusTime / totalSessions;
    
    const sessionsWithScores = sessions.filter(s => s.focusScore !== null && s.focusScore !== undefined);
    const averageFocusScore = sessionsWithScores.length > 0
      ? sessionsWithScores.reduce((sum, session) => sum + (session.focusScore || 0), 0) / sessionsWithScores.length
      : 0;

    // Calculate streaks
    const { currentStreak, bestStreak } = this.calculateStreaks(sessions);

    // Today's stats
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = sessions.filter(session => 
      new Date(session.startedAt).toISOString().split('T')[0] === today
    );
    const todayStats = {
      date: today,
      sessions: todaySessions.length,
      focusTime: todaySessions.reduce((sum, session) => sum + session.duration, 0),
    };

    // Tag distribution
    const tagDistribution = this.calculateTagDistribution(sessions, tags);

    // Daily data for charts
    const dailyData = this.calculateDailyData(sessions);

    return {
      totalSessions,
      totalFocusTime,
      totalHours,
      averageSessionLength,
      averageFocusScore,
      currentStreak,
      bestStreak,
      todayStats,
      tagDistribution,
      dailyData,
    };
  },

  // Calculate current and best streaks
  calculateStreaks(sessions: FocusSession[]): { currentStreak: number; bestStreak: number } {
    if (!sessions.length) return { currentStreak: 0, bestStreak: 0 };

    // Group sessions by date
    const sessionsByDate = new Map<string, FocusSession[]>();
    sessions.forEach(session => {
      const date = new Date(session.startedAt).toISOString().split('T')[0];
      if (!sessionsByDate.has(date)) {
        sessionsByDate.set(date, []);
      }
      sessionsByDate.get(date)!.push(session);
    });

    // Get sorted unique dates
    const dates = Array.from(sessionsByDate.keys()).sort();
    
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    // Calculate streaks
    const today = new Date().toISOString().split('T')[0];
    let checkingCurrent = true;

    for (let i = dates.length - 1; i >= 0; i--) {
      const date = dates[i];
      const prevDate = i > 0 ? dates[i - 1] : null;
      
      if (checkingCurrent) {
        if (date === today || this.isConsecutiveDay(date, dates[i + 1] || today)) {
          currentStreak++;
          tempStreak++;
        } else {
          checkingCurrent = false;
          tempStreak = 1;
        }
      } else {
        if (prevDate && this.isConsecutiveDay(prevDate, date)) {
          tempStreak++;
        } else {
          bestStreak = Math.max(bestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }

    bestStreak = Math.max(bestStreak, tempStreak, currentStreak);

    return { currentStreak, bestStreak };
  },

  // Check if two dates are consecutive days
  isConsecutiveDay(date1: string, date2: string): boolean {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1;
  },

  // Calculate tag distribution
  calculateTagDistribution(sessions: FocusSession[], tags: Tag[]) {
    const tagStats = new Map<string, { sessions: number; focusTime: number }>();
    
    // Initialize with all tags
    tags.forEach(tag => {
      tagStats.set(tag.id, { sessions: 0, focusTime: 0 });
    });

    // Add "No Tag" category
    tagStats.set('no-tag', { sessions: 0, focusTime: 0 });

    // Calculate stats
    sessions.forEach(session => {
      const tagId = session.tagId || 'no-tag';
      const current = tagStats.get(tagId) || { sessions: 0, focusTime: 0 };
      tagStats.set(tagId, {
        sessions: current.sessions + 1,
        focusTime: current.focusTime + session.duration,
      });
    });

    const totalFocusTime = sessions.reduce((sum, session) => sum + session.duration, 0);

    return Array.from(tagStats.entries())
      .map(([tagId, stats]) => {
        const tag = tags.find(t => t.id === tagId);
        return {
          tagId,
          tagName: tag?.name || 'No Tag',
          tagColor: tag?.color || '#64748b',
          sessions: stats.sessions,
          focusTime: stats.focusTime,
          percentage: totalFocusTime > 0 ? (stats.focusTime / totalFocusTime) * 100 : 0,
        };
      })
      .filter(item => item.sessions > 0)
      .sort((a, b) => b.focusTime - a.focusTime);
  },

  // Calculate daily data for charts
  calculateDailyData(sessions: FocusSession[]) {
    const dailyStats = new Map<string, {
      sessions: number;
      focusTime: number;
      tagBreakdown: Map<string, number>;
    }>();

    sessions.forEach(session => {
      const date = new Date(session.startedAt).toISOString().split('T')[0];
      const tagId = session.tagId || 'no-tag';
      
      if (!dailyStats.has(date)) {
        dailyStats.set(date, {
          sessions: 0,
          focusTime: 0,
          tagBreakdown: new Map(),
        });
      }

      const dayStats = dailyStats.get(date)!;
      dayStats.sessions++;
      dayStats.focusTime += session.duration;
      
      const currentTagTime = dayStats.tagBreakdown.get(tagId) || 0;
      dayStats.tagBreakdown.set(tagId, currentTagTime + session.duration);
    });

    return Array.from(dailyStats.entries())
      .map(([date, stats]) => ({
        date,
        sessions: stats.sessions,
        focusTime: stats.focusTime,
        tagBreakdown: Array.from(stats.tagBreakdown.entries()).map(([tagId, focusTime]) => ({
          tagId,
          focusTime,
        })),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  // Generate calendar data for heatmap
  generateCalendarData(sessions: FocusSession[], startDate: Date, endDate: Date): CalendarData {
    const calendarData: CalendarData = {};
    
    // Initialize all dates in range
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      calendarData[dateStr] = {
        sessions: 0,
        focusTime: 0,
        intensity: 0,
      };
      current.setDate(current.getDate() + 1);
    }

    // Populate with session data
    sessions.forEach(session => {
      const date = new Date(session.startedAt).toISOString().split('T')[0];
      if (calendarData[date]) {
        calendarData[date].sessions++;
        calendarData[date].focusTime += session.duration;
      }
    });

    // Calculate intensity (0-1) based on max focus time
    const maxFocusTime = Math.max(...Object.values(calendarData).map(d => d.focusTime));
    if (maxFocusTime > 0) {
      Object.values(calendarData).forEach(dayData => {
        dayData.intensity = dayData.focusTime / maxFocusTime;
      });
    }

    return calendarData;
  },

  // Generate timeline for a specific day
  generateDayTimeline(sessions: FocusSession[], date: string, tags: Tag[]): TimelineEntry[] {
    const daySessions = sessions.filter(session => 
      new Date(session.startedAt).toISOString().split('T')[0] === date
    );

    return daySessions
      .map(session => {
        const tag = tags.find(t => t.id === session.tagId);
        const startTime = new Date(session.startedAt);
        const endTime = session.completedAt ? new Date(session.completedAt) : new Date(startTime.getTime() + session.duration * 60000);

        return {
          id: session.id,
          startTime,
          endTime,
          duration: session.duration,
          sessionType: session.sessionType,
          tagId: session.tagId,
          tagName: tag?.name,
          tagColor: tag?.color,
          taskId: session.taskId,
          notes: session.notes,
          focusScore: session.focusScore,
        };
      })
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  },

  // Get sessions for a specific time period
  getSessionsInPeriod(sessions: FocusSession[], startDate: Date, endDate: Date): FocusSession[] {
    return sessions.filter(session => {
      const sessionDate = new Date(session.startedAt);
      return sessionDate >= startDate && sessionDate <= endDate;
    });
  },

  // Format duration for display
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  },

  // Format time for display
  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  },

  // Get color intensity for heatmap
  getIntensityColor(intensity: number): string {
    if (intensity === 0) return '#1e293b'; // slate-800
    if (intensity < 0.25) return '#065f46'; // emerald-800
    if (intensity < 0.5) return '#047857'; // emerald-700
    if (intensity < 0.75) return '#059669'; // emerald-600
    return '#10b981'; // emerald-500
  },

  // Get week dates (Monday to Sunday)
  getWeekDates(date: Date): { start: Date; end: Date; dates: Date[] } {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(start);
      weekDate.setDate(start.getDate() + i);
      dates.push(weekDate);
    }

    return { start, end, dates };
  },

  // Get month dates
  getMonthDates(date: Date): { start: Date; end: Date } {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  },

  // Get year dates
  getYearDates(date: Date): { start: Date; end: Date } {
    const start = new Date(date.getFullYear(), 0, 1);
    const end = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
    return { start, end };
  },
};