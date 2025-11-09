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

interface WeekAnalyticsProps {
  sessions: FocusSession[];
  tags: Tag[];
  loading: boolean;
}

export default function WeekAnalytics({ sessions, tags, loading }: WeekAnalyticsProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Get week dates
  const weekDates = useMemo(() => {
    return analyticsUtils.getWeekDates(selectedDate);
  }, [selectedDate]);

  // Get sessions for selected week
  const weekSessions = useMemo(() => {
    return analyticsUtils.getSessionsInPeriod(sessions, weekDates.start, weekDates.end);
  }, [sessions, weekDates]);

  // Calculate week statistics
  const weekStats = useMemo(() => {
    const totalFocusTime = weekSessions.reduce((sum, session) => sum + session.duration, 0);
    const totalSessions = weekSessions.length;
    
    // Tag distribution for the week
    const tagDistribution = analyticsUtils.calculateTagDistribution(weekSessions, tags);
    
    // Daily breakdown for histogram
    const dailyBreakdown = weekDates.dates.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      const daySessions = weekSessions.filter(session => 
        new Date(session.startedAt).toISOString().split('T')[0] === dateStr
      );
      
      const dayFocusTime = daySessions.reduce((sum, session) => sum + session.duration, 0);
      const dayTagBreakdown = analyticsUtils.calculateTagDistribution(daySessions, tags);
      
      return {
        date,
        dateStr,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        sessions: daySessions.length,
        focusTime: dayFocusTime,
        tagBreakdown: dayTagBreakdown,
      };
    });
    
    return {
      totalFocusTime,
      totalSessions,
      tagDistribution,
      dailyBreakdown,
    };
  }, [weekSessions, tags, weekDates]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setDate(newDate.getDate() + 7);
      }
      return newDate;
    });
  };

  // Create pie chart data for weekly tag distribution
  const createWeeklyPieChart = () => {
    if (weekStats.tagDistribution.length === 0) {
      return null;
    }

    let currentAngle = 0;
    const radius = 80;
    const centerX = 100;
    const centerY = 100;

    return weekStats.tagDistribution.map((tag) => {
      const percentage = tag.percentage;
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      
      // Convert to radians
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      
      // Calculate path
      const x1 = centerX + radius * Math.cos(startRad);
      const y1 = centerY + radius * Math.sin(startRad);
      const x2 = centerX + radius * Math.cos(endRad);
      const y2 = centerY + radius * Math.sin(endRad);
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');

      currentAngle += angle;

      return {
        ...tag,
        pathData,
        percentage: percentage.toFixed(1),
      };
    });
  };

  const weeklyPieChartData = createWeeklyPieChart();

  // Create histogram data
  const maxDailyFocusTime = Math.max(...weekStats.dailyBreakdown.map(day => day.focusTime), 1);
  const histogramHeight = 200;

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
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center">
          <Calendar className="w-6 h-6 mr-3 text-purple-400" />
          Weekly Analysis
        </h2>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => navigateWeek('prev')}
            variant="outline"
            size="sm"
            className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-cyan-400"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-md text-slate-300 min-w-[250px] text-center">
            {weekDates.start.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })} - {weekDates.end.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
          <Button
            onClick={() => setSelectedDate(new Date())}
            variant="outline"
            size="sm"
            className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-cyan-400"
          >
            This Week
          </Button>
          <Button
            onClick={() => navigateWeek('next')}
            variant="outline"
            size="sm"
            className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-cyan-400"
            disabled={weekDates.end > new Date()}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Week Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-900/70 transition-colors duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-purple-400">
                  {analyticsUtils.formatDuration(weekStats.totalFocusTime)}
                </p>
                <p className="text-sm text-slate-400">Total Focus Time</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-900/70 transition-colors duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-indigo-400">
                  {weekStats.totalSessions}
                </p>
                <p className="text-sm text-slate-400">Focus Sessions</p>
              </div>
              <div className="w-12 h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-900/70 transition-colors duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-cyan-400">
                  {weekStats.totalSessions > 0 
                    ? analyticsUtils.formatDuration(Math.round(weekStats.totalFocusTime / weekStats.totalSessions))
                    : "0m"
                  }
                </p>
                <p className="text-sm text-slate-400">Avg Session Length</p>
              </div>
              <div className="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Tag Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Weekly Tag Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weekStats.tagDistribution.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No focus sessions</p>
                <p className="text-sm">No data available for this week</p>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <div className="relative">
                  <svg width="200" height="200" className="transform -rotate-90">
                    {weeklyPieChartData?.map((segment, index) => (
                      <path
                        key={index}
                        d={segment.pathData}
                        fill={segment.tagColor}
                        stroke="#1e293b"
                        strokeWidth="2"
                        className="hover:opacity-80 transition-opacity duration-200"
                      />
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-100">
                        {analyticsUtils.formatDuration(weekStats.totalFocusTime)}
                      </div>
                      <div className="text-xs text-slate-400">Total</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Tag Legend */}
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-slate-100">Tag Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {weekStats.tagDistribution.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                <p>No tags used this week</p>
              </div>
            ) : (
              <div className="space-y-3">
                {weekStats.tagDistribution.map((tag, index) => (
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
      </div>

      {/* Daily Histogram */}
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Daily Focus Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weekStats.totalSessions === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No sessions this week</p>
              <p className="text-sm">Start focusing to see your weekly progress</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Histogram */}
              <div className="flex items-end justify-center space-x-2 h-64 px-4">
                {weekStats.dailyBreakdown.map((day, index) => (
                  <div key={index} className="flex flex-col items-center space-y-2 flex-1 max-w-[80px]">
                    {/* Bar */}
                    <div className="relative w-full flex flex-col justify-end" style={{ height: `${histogramHeight}px` }}>
                      {day.focusTime > 0 ? (
                        <div className="relative w-full">
                          {/* Stacked bars for different tags */}
                          {day.tagBreakdown.length > 0 ? (
                            <div 
                              className="w-full rounded-t-md transition-all duration-300 hover:opacity-80 cursor-pointer"
                              style={{ 
                                height: `${(day.focusTime / maxDailyFocusTime) * histogramHeight}px`,
                                background: day.tagBreakdown.length === 1 
                                  ? day.tagBreakdown[0].tagColor
                                  : `linear-gradient(to top, ${day.tagBreakdown.map((tag, i) => 
                                      `${tag.tagColor} ${i * (100 / day.tagBreakdown.length)}%, ${tag.tagColor} ${(i + 1) * (100 / day.tagBreakdown.length)}%`
                                    ).join(', ')})`
                              }}
                              title={`${day.dayName}: ${analyticsUtils.formatDuration(day.focusTime)} (${day.sessions} sessions)`}
                            />
                          ) : (
                            <div 
                              className="w-full bg-slate-600 rounded-t-md transition-all duration-300 hover:opacity-80 cursor-pointer"
                              style={{ height: `${(day.focusTime / maxDailyFocusTime) * histogramHeight}px` }}
                              title={`${day.dayName}: ${analyticsUtils.formatDuration(day.focusTime)} (${day.sessions} sessions)`}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-1 bg-slate-800 rounded" />
                      )}
                    </div>
                    
                    {/* Day label */}
                    <div className="text-center">
                      <div className="text-xs font-medium text-slate-300">{day.dayName}</div>
                      <div className="text-xs text-slate-500">{day.date.getDate()}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Daily Details */}
              <div className="grid grid-cols-1 md:grid-cols-7 gap-2 mt-6">
                {weekStats.dailyBreakdown.map((day, index) => (
                  <Card key={index} className="bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50 transition-colors duration-200">
                    <CardContent className="p-3">
                      <div className="text-center">
                        <div className="text-sm font-medium text-slate-300 mb-1">
                          {day.dayName}
                        </div>
                        <div className="text-lg font-bold text-slate-100">
                          {analyticsUtils.formatDuration(day.focusTime)}
                        </div>
                        <div className="text-xs text-slate-400">
                          {day.sessions} sessions
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}