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
  Play,
  Pause
} from "lucide-react";

import { PomodoroLog } from '@prisma/client';
import { Tag } from '@/lib/focus-utils';

type FocusSession = PomodoroLog;
import { analyticsUtils, TimelineEntry } from "@/lib/analytics-utils";

interface DayAnalyticsProps {
  sessions: FocusSession[];
  tags: Tag[];
  loading: boolean;
}

export default function DayAnalytics({ sessions, tags, loading }: DayAnalyticsProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const selectedDateStr = selectedDate.toISOString().split('T')[0];

  // Get sessions for selected day
  const daySessions = useMemo(() => {
    return sessions.filter(session => 
      new Date(session.startedAt).toISOString().split('T')[0] === selectedDateStr
    );
  }, [sessions, selectedDateStr]);

  // Calculate day statistics
  const dayStats = useMemo(() => {
    const totalFocusTime = daySessions.reduce((sum, session) => sum + session.duration, 0);
    const totalSessions = daySessions.length;
    
    // Tag distribution
    const tagDistribution = analyticsUtils.calculateTagDistribution(daySessions, tags);
    
    return {
      totalFocusTime,
      totalSessions,
      tagDistribution,
    };
  }, [daySessions, tags]);

  // Generate timeline
  const timeline = useMemo(() => {
    return analyticsUtils.generateDayTimeline(daySessions, selectedDateStr, tags);
  }, [daySessions, selectedDateStr, tags]);

  const navigateDay = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setDate(newDate.getDate() - 1);
      } else {
        newDate.setDate(newDate.getDate() + 1);
      }
      return newDate;
    });
  };

  // Create pie chart data for visualization
  const createPieChart = () => {
    if (dayStats.tagDistribution.length === 0) {
      return null;
    }

    const total = dayStats.totalFocusTime;
    let currentAngle = 0;
    const radius = 80;
    const centerX = 100;
    const centerY = 100;

    return dayStats.tagDistribution.map((tag, index) => {
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

  const pieChartData = createPieChart();

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
      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center">
          <Calendar className="w-6 h-6 mr-3 text-blue-400" />
          Daily Analysis
        </h2>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => navigateDay('prev')}
            variant="outline"
            size="sm"
            className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-cyan-400"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-md text-slate-300 min-w-[200px] text-center">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          <Button
            onClick={() => setSelectedDate(new Date())}
            variant="outline"
            size="sm"
            className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-cyan-400"
          >
            Today
          </Button>
          <Button
            onClick={() => navigateDay('next')}
            variant="outline"
            size="sm"
            className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-cyan-400"
            disabled={selectedDate.toDateString() === new Date().toDateString()}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Day Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-900/70 transition-colors duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-blue-400">
                  {analyticsUtils.formatDuration(dayStats.totalFocusTime)}
                </p>
                <p className="text-sm text-slate-400">Total Focus Time</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-900/70 transition-colors duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-purple-400">
                  {dayStats.totalSessions}
                </p>
                <p className="text-sm text-slate-400">Focus Sessions</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-900/70 transition-colors duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-emerald-400">
                  {dayStats.totalSessions > 0 
                    ? analyticsUtils.formatDuration(Math.round(dayStats.totalFocusTime / dayStats.totalSessions))
                    : "0m"
                  }
                </p>
                <p className="text-sm text-slate-400">Avg Session Length</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tag Distribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Focus Time by Tag
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dayStats.tagDistribution.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No focus sessions</p>
                <p className="text-sm">No data available for this day</p>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <div className="relative">
                  <svg width="200" height="200" className="transform -rotate-90">
                    {pieChartData?.map((segment, index) => (
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
                        {analyticsUtils.formatDuration(dayStats.totalFocusTime)}
                      </div>
                      <div className="text-xs text-slate-400">Total</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tag Legend */}
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-slate-100">Tag Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {dayStats.tagDistribution.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                <p>No tags used today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dayStats.tagDistribution.map((tag, index) => (
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

      {/* Daily Timeline */}
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Daily Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No sessions recorded</p>
              <p className="text-sm">Start a focus session to see your daily timeline</p>
            </div>
          ) : (
            <div className="space-y-4">
              {timeline.map((entry, index) => (
                <div key={entry.id} className="flex items-center space-x-4 p-4 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors duration-200">
                  {/* Time */}
                  <div className="text-sm text-slate-400 min-w-[100px]">
                    <div>{analyticsUtils.formatTime(entry.startTime)}</div>
                    <div className="text-xs">
                      {analyticsUtils.formatTime(entry.endTime)}
                    </div>
                  </div>

                  {/* Session Icon */}
                  <div className="flex-shrink-0">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${entry.tagColor || '#64748b'}20` }}
                    >
                      {entry.sessionType === 'POMODORO' ? (
                        <Play className="w-5 h-5" style={{ color: entry.tagColor || '#64748b' }} />
                      ) : (
                        <Pause className="w-5 h-5" style={{ color: entry.tagColor || '#64748b' }} />
                      )}
                    </div>
                  </div>

                  {/* Session Details */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-slate-100 font-medium">
                        {entry.sessionType} Session
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-300">
                        {analyticsUtils.formatDuration(entry.duration)}
                      </span>
                      {entry.focusScore && (
                        <>
                          <span className="text-slate-400">•</span>
                          <span className="text-emerald-400">
                            Score: {entry.focusScore}
                          </span>
                        </>
                      )}
                    </div>
                    
                    {entry.tagName && (
                      <div className="flex items-center space-x-2 mb-1">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: entry.tagColor }}
                        />
                        <span className="text-sm text-slate-400">{entry.tagName}</span>
                      </div>
                    )}
                    
                    {entry.notes && (
                      <div className="text-sm text-slate-400 mt-2 p-2 bg-slate-900/30 rounded">
                        {entry.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}