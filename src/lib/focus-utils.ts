import { Task, PomodoroLog } from '@prisma/client';

// Define Tag type until Prisma client is regenerated
export interface Tag {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Use PomodoroLog directly since it already includes sessionType and tagId
export type ExtendedPomodoroLog = PomodoroLog;

// Focus session utility functions
export const focusUtils = {
  // Format duration for display
  formatDuration: (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  },

  // Format time for timer display
  formatTime: (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  // Get session type color
  getSessionTypeColor: (sessionType: string): string => {
    switch (sessionType) {
      case 'POMODORO':
        return '#ef4444'; // red
      case 'STOPWATCH':
        return '#22c55e'; // green
      default:
        return '#64748b'; // slate
    }
  },

  // Get focus score color
  getFocusScoreColor: (score: number): string => {
    if (score >= 8) return '#22c55e'; // green - excellent
    if (score >= 6) return '#eab308'; // yellow - good
    if (score >= 4) return '#f97316'; // orange - fair
    return '#ef4444'; // red - poor
  },

  // Get focus score label
  getFocusScoreLabel: (score: number): string => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Needs Improvement';
  },

  // Calculate session statistics
  calculateStats: (sessions: ExtendedPomodoroLog[]) => {
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((sum, session) => sum + session.duration, 0);
    const completedSessions = sessions.filter(session => session.completedAt).length;
    const averageFocusScore = sessions
      .filter(session => session.focusScore !== null)
      .reduce((sum, session, _, arr) => sum + (session.focusScore || 0) / arr.length, 0);

    const sessionsByType = sessions.reduce((acc, session) => {
      acc[session.sessionType] = (acc[session.sessionType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalSessions,
      totalMinutes,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      completedSessions,
      completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
      averageFocusScore: Math.round(averageFocusScore * 10) / 10,
      sessionsByType,
      averageSessionLength: totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0,
    };
  },

  // Get daily stats for a specific date
  getDailyStats: (sessions: ExtendedPomodoroLog[], date: Date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const dailySessions = sessions.filter(session => {
      const sessionDate = new Date(session.startedAt);
      return sessionDate >= startOfDay && sessionDate <= endOfDay;
    });

    return focusUtils.calculateStats(dailySessions);
  },

  // Get weekly stats
  getWeeklyStats: (sessions: ExtendedPomodoroLog[], weekStart: Date) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weeklySessions = sessions.filter(session => {
      const sessionDate = new Date(session.startedAt);
      return sessionDate >= weekStart && sessionDate <= weekEnd;
    });

    return focusUtils.calculateStats(weeklySessions);
  },

  // Generate motivational quotes for breaks
  getMotivationalQuote: (): { text: string; author: string } => {
    const quotes = [
      { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
      { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
      { text: "Concentrate all your thoughts upon the work at hand.", author: "Alexander Graham Bell" },
      { text: "The successful warrior is the average person with laser-like focus.", author: "Bruce Lee" },
      { text: "Where focus goes, energy flows and results show.", author: "Tony Robbins" },
      { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
      { text: "The art of being wise is knowing what to overlook.", author: "William James" },
      { text: "Productivity is never an accident. It is always the result of commitment to excellence.", author: "Paul J. Meyer" },
      { text: "You can do anything, but not everything.", author: "David Allen" },
      { text: "The key is not to prioritize what's on your schedule, but to schedule your priorities.", author: "Stephen Covey" },
    ];

    return quotes[Math.floor(Math.random() * quotes.length)];
  },

  // Validate hex color
  isValidHexColor: (color: string): boolean => {
    return /^#[0-9A-F]{6}$/i.test(color);
  },

  // Generate random color for new tags
  generateRandomColor: (): string => {
    const colors = [
      '#ef4444', // red
      '#f97316', // orange
      '#eab308', // yellow
      '#22c55e', // green
      '#06b6d4', // cyan
      '#3b82f6', // blue
      '#8b5cf6', // violet
      '#ec4899', // pink
      '#f59e0b', // amber
      '#10b981', // emerald
      '#6366f1', // indigo
      '#84cc16', // lime
    ];

    return colors[Math.floor(Math.random() * colors.length)];
  },

  // Sort sessions by date (newest first)
  sortSessionsByDate: (sessions: ExtendedPomodoroLog[]): ExtendedPomodoroLog[] => {
    return [...sessions].sort((a, b) => 
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  },

  // Group sessions by date
  groupSessionsByDate: (sessions: ExtendedPomodoroLog[]): Record<string, ExtendedPomodoroLog[]> => {
    return sessions.reduce((groups, session) => {
      const date = new Date(session.startedAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(session);
      return groups;
    }, {} as Record<string, ExtendedPomodoroLog[]>);
  },
};

// API helper functions
export const focusApi = {
  // Get all focus sessions
  getSessions: async (firebaseUid: string, params?: {
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
    tagId?: string;
    taskId?: string;
  }) => {
    // Get Firebase ID token for authentication
    const { auth } = await import('@/lib/firebase/firebaseConfig');
    const idToken = await auth.currentUser?.getIdToken();
    
    if (!idToken) {
      throw new Error('Not authenticated');
    }
    
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (params?.tagId) searchParams.set('tagId', params.tagId);
    if (params?.taskId) searchParams.set('taskId', params.taskId);

    const response = await fetch(`/api/focus-sessions?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch focus sessions');
    }
    
    return response.json();
  },

  // Create new focus session
  createSession: async (firebaseUid: string, sessionData: {
    duration: number;
    sessionType?: string;
    focusScore?: number;
    notes?: string;
    taskId?: string;
    tagId?: string;
    projectId?: string;
    startedAt?: Date;
    completedAt?: Date;
  }) => {
    // Get Firebase ID token for authentication
    const { auth } = await import('@/lib/firebase/firebaseConfig');
    const idToken = await auth.currentUser?.getIdToken();
    
    if (!idToken) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch('/api/focus-sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(sessionData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create focus session');
    }
    
    return response.json();
  },

  // Get all tags
  getTags: async (firebaseUid: string) => {
    // Get Firebase ID token for authentication
    const { auth } = await import('@/lib/firebase/firebaseConfig');
    const idToken = await auth.currentUser?.getIdToken();
    
    if (!idToken) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch('/api/tags', {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch tags');
    }
    
    return response.json();
  },

  // Create new tag
  createTag: async (firebaseUid: string, tagData: { name: string; color: string }) => {
    // Get Firebase ID token for authentication
    const { auth } = await import('@/lib/firebase/firebaseConfig');
    const idToken = await auth.currentUser?.getIdToken();
    
    if (!idToken) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch('/api/tags', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(tagData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create tag');
    }
    
    return response.json();
  },

  // Update tag
  updateTag: async (firebaseUid: string, tagId: string, updates: { name?: string; color?: string }) => {
    // Get Firebase ID token for authentication
    const { auth } = await import('@/lib/firebase/firebaseConfig');
    const idToken = await auth.currentUser?.getIdToken();
    
    if (!idToken) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`/api/tags/${tagId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update tag');
    }
    
    return response.json();
  },

  // Delete tag
  deleteTag: async (firebaseUid: string, tagId: string) => {
    // Get Firebase ID token for authentication
    const { auth } = await import('@/lib/firebase/firebaseConfig');
    const idToken = await auth.currentUser?.getIdToken();
    
    if (!idToken) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`/api/tags/${tagId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete tag');
    }
    
    return response.json();
  }
};