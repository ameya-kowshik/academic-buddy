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
  TrendingUp,
  Trophy,
  Zap
} from "lucide-react";

import { PomodoroLog } from '@prisma/client';
import { Tag } from '@/lib/focus-utils';

type FocusSession = PomodoroLog;
import { analyticsUtils } from "@/lib/analytics-utils";

interface YearAnalyticsProps {
  sessions: FocusSession[];
  tags: Tag[];
  loading: boolean;
}

export default function YearAnalytics({ sessions, tags, loading }: YearAnalyticsProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Get year dates
  const yearDates = useMemo(() => {
    return analyticsUtils.getYearDates(new Date(selectedYear, 0, 1));
  }, [selectedYear]);

  // Get sessions for selected year
  const yearSessions = useMemo(() => {
    return analyticsUtils.getSessionsInPeriod(sessions, yearDates.start, yearDates.end);
  }, [sessions, yearDates]);

  // Calculate year statistics
  const yearStats = useMemo(() => {
    const totalFocusTime = yearSessions.reduce((sum, session) => sum + session.duration, 0);
    const totalSessions = yearSessions.length;
    
    // Tag distribution for the year
    const tagDistribution = analyticsUtils.calculateTagDistribution(yearSessions, tags);
    
    // Quarterly breakdown
    const quarters = [
      { name: 'Q1', months: [0, 1, 2] },
      { name: 'Q2', months: [3, 4, 5] },
      { name: 'Q3', months: [6, 7, 8] },
      { name: 'Q4', months: [9, 10, 11] }
    ];

    const quarterlyBreakdown = quarters.map(quarter => {
      const quarterSessions = yearSessions.filter(session => {
        const month = new Date(session.startedAt).getMonth();
        return quarter.months.includes(month);
      });
      
      return {
        ...quarter,
        sessions: quarterSessions.length,
        focusTime: quarterSessions.reduce((sum, session) => sum + session.duration, 0),
      };
    });

    // Monthly breakdown
    const monthlyBreakdown = Array.from({ length: 12 }, (_, index) => {
      const monthSessions = yearSessions.filter(session => 
        new Date(session.startedAt).getMonth() === index
      );
      
      return {
        month: index,
        monthName: new Date(selectedYear, index, 1).toLocaleDateString('en-US', { month: 'short' }),
        sessions: monthSessions.length,
        focusTime: monthSessions.reduce((sum, session) => sum + session.duration, 0),
      };
    });

    // Calculate growth metrics
    const firstHalf = yearSessions.filter(session => 
      new Date(session.startedAt).getMonth() < 6
    );
    const secondHalf = yearSessions.filter(session => 
      new Date(session.startedAt).getMonth() >= 6
    );

    const firstHalfTime = firstHalf.reduce((sum, session) => sum + session.duration, 0);
    const secondHalfTime = secondHalf.reduce((sum, session) => sum + session.duration, 0);
    const growthRate = firstHalfTime > 0 ? ((secondHalfTime - firstHalfTime) / firstHalfTime) * 100 : 0;

    return {
      totalFocusTime,
      totalSessions,
      tagDistribution,
      quarterlyBreakdown,
      monthlyBreakdown,
      growthRate,
      firstHalfTime,
      secondHalfTime,
    };
  }, [yearSessions, tags, selectedYear]);

  const navigateYear = (direction: 'prev' | 'next') => {
    setSelectedYear(prev => direction === 'prev' ? prev - 1 : prev + 1);
  };

  // Find peak productivity month
  const peakMonth = yearStats.monthlyBreakdown.reduce((max, month) => 
    month.focusTime > max.focusTime ? month : max, 
    { monthName: 'None', focusTime: 0 }
  );

  // Calculate max monthly focus time for chart scaling
  const maxMonthlyFocusTime = Math.max(...yearStats.monthlyBreakdown.map(month => month.focusTime), 1);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
      {/* Year Navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center">
          <BarChart3 className="w-6 h-6 mr-3 text-pink-400" />
          Yearly Analysis
        </h2>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => navigateYear('prev')}
            variant="outline"
            size="sm"
            className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-cyan-400"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-md text-slate-300 min-w-[120px] text-center">
            {selectedYear}
          </div>
          <Button
            onClick={() => setSelectedYear(new Date().getFullYear())}
            variant="outline"
            size="sm"
            className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-cyan-400"
          >
            This Year
          </Button>
          <Button
            onClick={() => navigateYear('next')}
            variant="outline"
            size="sm"
            className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-cyan-400"
            disabled={selectedYear >= new Date().getFullYear()}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Year Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-900/70 transition-colors duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-pink-400">
                  {Math.round((yearStats.totalFocusTime / 60) * 10) / 10}h
                </p>
                <p className="text-sm text-slate-400">Total Focus Hours</p>
                <p className="text-xs text-slate-500 mt-1">
                  {analyticsUtils.formatDuration(yearStats.totalFocusTime)} total
                </p>
              </div>
              <div className="w-12 h-12 bg-pink-500/10 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-pink-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-900/70 transition-colors duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-rose-400">
                  {yearStats.totalSessions}
                </p>
                <p className="text-sm text-slate-400">Total Sessions</p>
              </div>
              <div className="w-12 h-12 bg-rose-500/10 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-rose-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-900/70 transition-colors duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-violet-400">
                  {yearStats.totalSessions > 0 
                    ? analyticsUtils.formatDuration(Math.round(yearStats.totalFocusTime / yearStats.totalSessions))
                    : "0m"
                  }
                </p>
                <p className="text-sm text-slate-400">Avg Session Length</p>
              </div>
              <div className="w-12 h-12 bg-violet-500/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-900/70 transition-colors duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-3xl font-bold ${yearStats.growthRate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {yearStats.growthRate >= 0 ? '+' : ''}{yearStats.growthRate.toFixed(1)}%
                </p>
                <p className="text-sm text-slate-400">H2 vs H1 Growth</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quarterly Breakdown */}
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Quarterly Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {yearStats.quarterlyBreakdown.map((quarter, index) => (
              <Card key={index} className="bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50 transition-colors duration-200">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-100 mb-2">
                      {quarter.name}
                    </div>
                    <div className="text-2xl font-bold text-cyan-400 mb-1">
                      {analyticsUtils.formatDuration(quarter.focusTime)}
                    </div>
                    <div className="text-sm text-slate-400">
                      {quarter.sessions} sessions
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trend Chart */}
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Monthly Focus Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {yearStats.totalSessions === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No sessions this year</p>
              <p className="text-sm">Start focusing to see your yearly progress</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Chart */}
              <div className="flex items-end justify-center space-x-2 h-64 px-4">
                {yearStats.monthlyBreakdown.map((month, index) => (
                  <div key={index} className="flex flex-col items-center space-y-2 flex-1 max-w-[60px]">
                    {/* Bar */}
                    <div className="relative w-full flex flex-col justify-end h-48">
                      <div 
                        className="w-full bg-gradient-to-t from-pink-600 to-rose-500 rounded-t-md transition-all duration-300 hover:opacity-80 cursor-pointer"
                        style={{ height: `${(month.focusTime / maxMonthlyFocusTime) * 192}px` }}
                        title={`${month.monthName}: ${analyticsUtils.formatDuration(month.focusTime)} (${month.sessions} sessions)`}
                      />
                    </div>
                    
                    {/* Month label */}
                    <div className="text-center">
                      <div className="text-xs font-medium text-slate-300">{month.monthName}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Monthly Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mt-6">
                {yearStats.monthlyBreakdown.map((month, index) => (
                  <Card key={index} className="bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50 transition-colors duration-200">
                    <CardContent className="p-3">
                      <div className="text-center">
                        <div className="text-sm font-medium text-slate-300 mb-1">
                          {month.monthName}
                        </div>
                        <div className="text-lg font-bold text-slate-100">
                          {analyticsUtils.formatDuration(month.focusTime)}
                        </div>
                        <div className="text-xs text-slate-400">
                          {month.sessions} sessions
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

      {/* Yearly Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center">
              <Trophy className="w-5 h-5 mr-2" />
              Year Highlights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/30 rounded-lg">
                <div className="text-sm text-slate-400 mb-1">Peak Productivity Month</div>
                <div className="text-lg font-semibold text-slate-100">
                  {peakMonth.focusTime > 0 
                    ? `${peakMonth.monthName} (${analyticsUtils.formatDuration(peakMonth.focusTime)})`
                    : 'No sessions yet'
                  }
                </div>
              </div>

              <div className="p-4 bg-slate-800/30 rounded-lg">
                <div className="text-sm text-slate-400 mb-1">Most Active Quarter</div>
                <div className="text-lg font-semibold text-slate-100">
                  {(() => {
                    const bestQuarter = yearStats.quarterlyBreakdown.reduce((max, quarter) => 
                      quarter.focusTime > max.focusTime ? quarter : max, 
                      { name: 'None', focusTime: 0 }
                    );
                    return bestQuarter.focusTime > 0 
                      ? `${bestQuarter.name} (${analyticsUtils.formatDuration(bestQuarter.focusTime)})`
                      : 'No sessions yet';
                  })()}
                </div>
              </div>

              <div className="p-4 bg-slate-800/30 rounded-lg">
                <div className="text-sm text-slate-400 mb-1">Daily Average</div>
                <div className="text-lg font-semibold text-slate-100">
                  {yearStats.totalSessions > 0 
                    ? analyticsUtils.formatDuration(Math.round(yearStats.totalFocusTime / 365))
                    : "0m"
                  }
                </div>
              </div>

              <div className="p-4 bg-slate-800/30 rounded-lg">
                <div className="text-sm text-slate-400 mb-1">Consistency Score</div>
                <div className="text-lg font-semibold text-slate-100">
                  {(() => {
                    const activeMonths = yearStats.monthlyBreakdown.filter(month => month.sessions > 0).length;
                    const consistencyScore = Math.round((activeMonths / 12) * 100);
                    return `${consistencyScore}% (${activeMonths}/12 months)`;
                  })()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Optimization Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {yearStats.totalSessions === 0 ? (
                <div className="text-center text-slate-400 py-8">
                  <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No data available</p>
                  <p className="text-sm">Complete some focus sessions to get personalized insights</p>
                </div>
              ) : (
                <>
                  {yearStats.growthRate < 0 && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <div className="text-sm font-medium text-amber-400 mb-1">Growth Opportunity</div>
                      <div className="text-sm text-slate-300">
                        Your focus time decreased in the second half of the year. Consider setting smaller, more achievable goals.
                      </div>
                    </div>
                  )}

                  {(() => {
                    const inactiveMonths = yearStats.monthlyBreakdown.filter(month => month.sessions === 0).length;
                    return inactiveMonths > 6 && (
                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="text-sm font-medium text-blue-400 mb-1">Consistency Tip</div>
                        <div className="text-sm text-slate-300">
                          You had {inactiveMonths} inactive months. Try setting a minimum daily focus goal to maintain consistency.
                        </div>
                      </div>
                    );
                  })()}

                  {yearStats.totalSessions > 0 && yearStats.totalFocusTime / yearStats.totalSessions < 25 && (
                    <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      <div className="text-sm font-medium text-purple-400 mb-1">Session Length</div>
                      <div className="text-sm text-slate-300">
                        Your average session is quite short. Consider using the Pomodoro technique for longer, more effective sessions.
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <div className="text-sm font-medium text-emerald-400 mb-1">Keep Going!</div>
                    <div className="text-sm text-slate-300">
                      You've completed {yearStats.totalSessions} focus sessions this year. Every session counts towards building better focus habits!
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}