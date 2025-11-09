"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar,
  Clock,
  Target,
  TrendingUp,
  Flame,
  Trophy,
  ChevronLeft,
  ChevronRight,
  BarChart3
} from "lucide-react";

import { PomodoroLog } from '@prisma/client';
import { Tag } from '@/lib/focus-utils';

type FocusSession = PomodoroLog;
import { analyticsUtils } from "@/lib/analytics-utils";

interface OverviewAnalyticsProps {
  sessions: FocusSession[];
  tags: Tag[];
  loading: boolean;
}

export default function OverviewAnalytics({ sessions, tags, loading }: OverviewAnalyticsProps) {
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Calculate analytics data
  const analytics = useMemo(() => {
    return analyticsUtils.calculateAnalytics(sessions, tags);
  }, [sessions, tags]);

  // Generate calendar data for current month
  const calendarData = useMemo(() => {
    const { start, end } = analyticsUtils.getMonthDates(calendarDate);
    return analyticsUtils.generateCalendarData(sessions, start, end);
  }, [sessions, calendarDate]);

  // Generate calendar grid
  const generateCalendarGrid = () => {
    const { start } = analyticsUtils.getMonthDates(calendarDate);
    const firstDay = new Date(start);
    const lastDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0);
    
    // Adjust to start from Monday
    const startDay = new Date(firstDay);
    const dayOfWeek = startDay.getDay();
    startDay.setDate(startDay.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const days = [];
    const current = new Date(startDay);

    // Generate 6 weeks (42 days) to ensure full calendar
    for (let i = 0; i < 42; i++) {
      const dateStr = current.toISOString().split('T')[0];
      const dayData = calendarData[dateStr] || { sessions: 0, focusTime: 0, intensity: 0 };
      const isCurrentMonth = current.getMonth() === calendarDate.getMonth();
      const isToday = dateStr === new Date().toISOString().split('T')[0];

      days.push({
        date: new Date(current),
        dateStr,
        day: current.getDate(),
        isCurrentMonth,
        isToday,
        ...dayData,
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const calendarDays = generateCalendarGrid();

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCalendarDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-slate-900/50 border-slate-700/50">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-8 bg-slate-700 rounded mb-2"></div>
                  <div className="h-4 bg-slate-700 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Today's Stats */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center">
          <Clock className="w-6 h-6 mr-3 text-emerald-400" />
          Today's Focus
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-900/70 transition-colors duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-emerald-400">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long',
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-sm text-slate-400">Today's Date</p>
                </div>
                <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-900/70 transition-colors duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-cyan-400">
                    {analyticsUtils.formatDuration(analytics.todayStats.focusTime)}
                  </p>
                  <p className="text-sm text-slate-400">Focus Time Today</p>
                </div>
                <div className="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-900/70 transition-colors duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-purple-400">
                    {analytics.todayStats.sessions}
                  </p>
                  <p className="text-sm text-slate-400">Sessions Today</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Streaks */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center">
          <Flame className="w-6 h-6 mr-3 text-orange-400" />
          Focus Streaks
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-900/70 transition-colors duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl font-bold text-orange-400">
                    {analytics.currentStreak}
                  </p>
                  <p className="text-sm text-slate-400">Current Streak (days)</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {analytics.currentStreak > 0 ? 'Keep it up!' : 'Start your streak today!'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <Flame className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-900/70 transition-colors duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl font-bold text-yellow-400">
                    {analytics.bestStreak}
                  </p>
                  <p className="text-sm text-slate-400">Best Streak (days)</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {analytics.bestStreak > 0 ? 'Personal record!' : 'No streak yet'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Calendar Heatmap */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center">
          <Calendar className="w-6 h-6 mr-3 text-blue-400" />
          Focus Calendar
        </h2>
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-slate-100">
                {calendarDate.toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => navigateMonth('prev')}
                  variant="outline"
                  size="sm"
                  className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-cyan-400"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setCalendarDate(new Date())}
                  variant="outline"
                  size="sm"
                  className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-cyan-400"
                >
                  Today
                </Button>
                <Button
                  onClick={() => navigateMonth('next')}
                  variant="outline"
                  size="sm"
                  className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-cyan-400"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-slate-400 p-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  className={`
                    relative aspect-square rounded-md border transition-all duration-200 cursor-pointer group
                    ${day.isCurrentMonth 
                      ? 'border-slate-600 hover:border-slate-500' 
                      : 'border-slate-800 opacity-30'
                    }
                    ${day.isToday ? 'ring-2 ring-emerald-400' : ''}
                  `}
                  style={{
                    backgroundColor: day.isCurrentMonth 
                      ? analyticsUtils.getIntensityColor(day.intensity)
                      : '#1e293b'
                  }}
                  title={`${day.date.toLocaleDateString()}: ${day.sessions} sessions, ${analyticsUtils.formatDuration(day.focusTime)}`}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-xs font-medium ${
                      day.isCurrentMonth 
                        ? day.intensity > 0.5 ? 'text-white' : 'text-slate-300'
                        : 'text-slate-600'
                    }`}>
                      {day.day}
                    </span>
                  </div>

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                    <div className="font-medium">{day.date.toLocaleDateString()}</div>
                    <div>{day.sessions} sessions</div>
                    <div>{analyticsUtils.formatDuration(day.focusTime)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
              <div className="text-xs text-slate-400">
                Hover over dates to see details
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400">Less</span>
                <div className="flex space-x-1">
                  {[0, 0.2, 0.4, 0.6, 0.8, 1].map((intensity, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: analyticsUtils.getIntensityColor(intensity) }}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-400">More</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lifetime Stats */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center">
          <TrendingUp className="w-6 h-6 mr-3 text-indigo-400" />
          Lifetime Focus
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-900/70 transition-colors duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-indigo-400">
                    {analytics.totalSessions}
                  </p>
                  <p className="text-sm text-slate-400">Total Sessions</p>
                </div>
                <div className="w-12 h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-indigo-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-900/70 transition-colors duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-green-400">
                    {analytics.totalHours}h
                  </p>
                  <p className="text-sm text-slate-400">Total Focus Time</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {analyticsUtils.formatDuration(analytics.totalFocusTime)} total
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-900/70 transition-colors duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-pink-400">
                    {analytics.averageSessionLength > 0 
                      ? analyticsUtils.formatDuration(Math.round(analytics.averageSessionLength))
                      : "0m"
                    }
                  </p>
                  <p className="text-sm text-slate-400">Avg Session Length</p>
                </div>
                <div className="w-12 h-12 bg-pink-500/10 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-pink-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-900/70 transition-colors duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-amber-400">
                    {analytics.averageFocusScore > 0 
                      ? analytics.averageFocusScore.toFixed(1)
                      : "N/A"
                    }
                  </p>
                  <p className="text-sm text-slate-400">Avg Focus Score</p>
                </div>
                <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}