"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar,
  Clock,
  Target,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  TrendingUp
} from "lucide-react";

import { PomodoroLog } from '@prisma/client';
import { Tag } from '@/lib/focus-utils';

type FocusSession = PomodoroLog;
import { analyticsUtils } from "@/lib/analytics-utils";

interface MonthAnalyticsProps {
  sessions: FocusSession[];
  tags: Tag[];
  loading: boolean;
}

export default function MonthAnalytics({ sessions, tags, loading }: MonthAnalyticsProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Get month dates
  const monthDates = useMemo(() => {
    return analyticsUtils.getMonthDates(selectedDate);
  }, [selectedDate]);

  // Get sessions for selected month
  const monthSessions = useMemo(() => {
    return analyticsUtils.getSessionsInPeriod(sessions, monthDates.start, monthDates.end);
  }, [sessions, monthDates]);

  // Calculate month statistics
  const monthStats = useMemo(() => {
    const totalFocusTime = monthSessions.reduce((sum, session) => sum + session.duration, 0);
    const totalSessions = monthSessions.length;
    
    // Tag distribution for the month
    const tagDistribution = analyticsUtils.calculateTagDistribution(monthSessions, tags);
    
    // Generate calendar heatmap data
    const calendarData = analyticsUtils.generateCalendarData(monthSessions, monthDates.start, monthDates.end);
    
    return {
      totalFocusTime,
      totalSessions,
      tagDistribution,
      calendarData,
    };
  }, [monthSessions, tags, monthDates]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Generate calendar grid for heatmap
  const generateCalendarGrid = () => {
    const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const lastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    
    // Adjust to start from Monday
    const startDay = new Date(firstDay);
    const dayOfWeek = startDay.getDay();
    startDay.setDate(startDay.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const days = [];
    const current = new Date(startDay);

    // Generate 6 weeks (42 days) to ensure full calendar
    for (let i = 0; i < 42; i++) {
      const dateStr = current.toISOString().split('T')[0];
      const dayData = monthStats.calendarData[dateStr] || { sessions: 0, focusTime: 0, intensity: 0 };
      const isCurrentMonth = current.getMonth() === selectedDate.getMonth();
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
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
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center">
          <Calendar className="w-6 h-6 mr-3 text-orange-400" />
          Monthly Analysis
        </h2>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => navigateMonth('prev')}
            variant="outline"
            size="sm"
            className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-cyan-400"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-md text-slate-300 min-w-[200px] text-center">
            {selectedDate.toLocaleDateString('en-US', { 
              month: 'long',
              year: 'numeric'
            })}
          </div>
          <Button
            onClick={() => setSelectedDate(new Date())}
            variant="outline"
            size="sm"
            className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-cyan-400"
          >
            This Month
          </Button>
          <Button
            onClick={() => navigateMonth('next')}
            variant="outline"
            size="sm"
            className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-cyan-400"
            disabled={monthDates.end > new Date()}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Month Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-900/70 transition-colors duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-orange-400">
                  {analyticsUtils.formatDuration(monthStats.totalFocusTime)}
                </p>
                <p className="text-sm text-slate-400">Total Focus Time</p>
              </div>
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-900/70 transition-colors duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-red-400">
                  {monthStats.totalSessions}
                </p>
                <p className="text-sm text-slate-400">Focus Sessions</p>
              </div>
              <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-900/70 transition-colors duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-amber-400">
                  {monthStats.totalSessions > 0 
                    ? analyticsUtils.formatDuration(Math.round(monthStats.totalFocusTime / monthStats.totalSessions))
                    : "0m"
                  }
                </p>
                <p className="text-sm text-slate-400">Avg Session Length</p>
              </div>
              <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-900/70 transition-colors duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-pink-400">
                  {Math.round((monthStats.totalFocusTime / 60) * 10) / 10}h
                </p>
                <p className="text-sm text-slate-400">Focus Hours</p>
              </div>
              <div className="w-12 h-12 bg-pink-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-pink-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Calendar Heatmap */}
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Monthly Productivity Heatmap
          </CardTitle>
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
                  ${day.isToday ? 'ring-2 ring-orange-400' : ''}
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

      {/* Monthly Tag Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Monthly Tag Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthStats.tagDistribution.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No focus sessions</p>
                <p className="text-sm">No data available for this month</p>
              </div>
            ) : (
              <div className="space-y-3">
                {monthStats.tagDistribution.map((tag, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: tag.tagColor }}
                      />
                      <span className="text-slate-300 font-medium">{tag.tagName}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-100 font-medium">
                        {analyticsUtils.formatDuration(tag.focusTime)}
                      </div>
                      <div className="text-xs text-slate-400">
                        {tag.percentage.toFixed(1)}% • {tag.sessions} sessions
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Monthly Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/30 rounded-lg">
                <div className="text-sm text-slate-400 mb-1">Most Productive Day</div>
                <div className="text-lg font-semibold text-slate-100">
                  {(() => {
                    const dayWithMostTime = Object.entries(monthStats.calendarData)
                      .filter(([date]) => new Date(date).getMonth() === selectedDate.getMonth())
                      .reduce((max, [date, data]) => 
                        data.focusTime > max.focusTime ? { date, ...data } : max, 
                        { date: '', focusTime: 0, sessions: 0, intensity: 0 }
                      );
                    return dayWithMostTime.focusTime > 0 
                      ? new Date(dayWithMostTime.date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric' })
                      : 'No sessions yet';
                  })()}
                </div>
              </div>

              <div className="p-4 bg-slate-800/30 rounded-lg">
                <div className="text-sm text-slate-400 mb-1">Active Days</div>
                <div className="text-lg font-semibold text-slate-100">
                  {Object.values(monthStats.calendarData).filter(day => day.sessions > 0).length} days
                </div>
              </div>

              <div className="p-4 bg-slate-800/30 rounded-lg">
                <div className="text-sm text-slate-400 mb-1">Daily Average</div>
                <div className="text-lg font-semibold text-slate-100">
                  {monthStats.totalSessions > 0 
                    ? analyticsUtils.formatDuration(Math.round(monthStats.totalFocusTime / new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate()))
                    : "0m"
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}