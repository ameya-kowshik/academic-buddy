"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  BookOpen,
  FileQuestion,
  Clock,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface DailyAnalytics {
  date: string;
  flashcardsReviewed: number;
  quizzesCompleted: number;
}

interface StudyAnalytics {
  flashcardsReviewed: number;
  quizzesCompleted: number;
  averageQuizScore: number;
  totalStudyTime: number;
  dailyBreakdown: DailyAnalytics[];
}

interface StudyAnalyticsDashboardProps {
  userId: string;
  isLoading?: boolean;
}

type TimeRange = "7days" | "30days" | "90days";

export default function StudyAnalyticsDashboard({
  userId,
  isLoading: externalLoading = false,
}: StudyAnalyticsDashboardProps) {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<StudyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>("7days");

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, timeRange]);

  const fetchAnalytics = async () => {
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      const endDate = new Date();
      const startDate = new Date();

      switch (timeRange) {
        case "7days":
          startDate.setDate(endDate.getDate() - 7);
          break;
        case "30days":
          startDate.setDate(endDate.getDate() - 30);
          break;
        case "90days":
          startDate.setDate(endDate.getDate() - 90);
          break;
      }

      const token = await user.getIdToken();

      // Fetch analytics and quizzes in parallel
      const [analyticsResponse, quizzesResponse] = await Promise.all([
        fetch(
          `/api/analytics/study?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        fetch("/api/quizzes", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (!analyticsResponse.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data = await analyticsResponse.json();

      // Also count quiz attempts directly from quiz data
      let totalAttempts = 0;
      let totalScore = 0;
      if (quizzesResponse.ok) {
        const quizzesData = await quizzesResponse.json();
        const quizzes = quizzesData.quizzes || [];

        for (const quiz of quizzes) {
          const attemptsRes = await fetch(`/api/quizzes/${quiz.id}/attempts`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (attemptsRes.ok) {
            const attempts = await attemptsRes.json();
            const completed = Array.isArray(attempts)
              ? attempts.filter((a: { completedAt: Date | null }) => a.completedAt !== null)
              : [];
            totalAttempts += completed.length;
            totalScore += completed.reduce(
              (sum: number, a: { score: number }) => sum + a.score,
              0
            );
          }
        }
      }

      // Merge: use analytics table data but supplement with live quiz attempt counts
      const mergedData: StudyAnalytics = {
        ...data,
        quizzesCompleted: Math.max(data.quizzesCompleted, totalAttempts),
        averageQuizScore:
          totalAttempts > 0
            ? Math.round(totalScore / totalAttempts)
            : Math.round(data.averageQuizScore),
      };

      setAnalytics(mergedData);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getMaxValue = (data: DailyAnalytics[]): number => {
    return Math.max(
      ...data.map((d) => Math.max(d.flashcardsReviewed, d.quizzesCompleted)),
      1
    );
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const isLoadingState = loading || externalLoading;

  if (isLoadingState) {
    return (
      <div className="space-y-6">
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-slate-700/50 rounded w-1/3"></div>
              <div className="grid md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 bg-slate-700/50 rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardContent className="p-12 text-center">
          <BarChart3 className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-slate-300 font-medium text-lg mb-2">
            Failed to load analytics
          </h3>
          <p className="text-slate-500 text-sm mb-4">{error}</p>
          <Button
            onClick={fetchAnalytics}
            variant="outline"
            className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-slate-800/60"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return null;
  }

  // Check if user has any activity
  const hasActivity = 
    analytics.flashcardsReviewed > 0 || 
    analytics.quizzesCompleted > 0 || 
    analytics.totalStudyTime > 0 ||
    analytics.averageQuizScore > 0;

  // Empty state for new users
  if (!hasActivity) {
    return (
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardContent className="p-12 text-center">
          <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-slate-300 font-medium text-lg mb-2">
            Start Your Study Journey
          </h3>
          <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
            Your analytics will appear here once you start reviewing flashcards or taking quizzes.
            Upload a document and generate study materials to get started!
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={() => window.location.href = "/study/documents"}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
            <Button
              onClick={() => window.location.href = "/study/flashcards"}
              variant="outline"
              className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-slate-800/60"
            >
              View Flashcards
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxValue = getMaxValue(analytics.dailyBreakdown);

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center gap-2">
        <Button
          variant={timeRange === "7days" ? "default" : "outline"}
          onClick={() => setTimeRange("7days")}
          size="sm"
          className={cn(
            timeRange === "7days"
              ? "bg-cyan-600 hover:bg-cyan-700 text-white"
              : "bg-slate-800/40 border-slate-600/50 text-slate-300 hover:bg-slate-800/60"
          )}
        >
          7 Days
        </Button>
        <Button
          variant={timeRange === "30days" ? "default" : "outline"}
          onClick={() => setTimeRange("30days")}
          size="sm"
          className={cn(
            timeRange === "30days"
              ? "bg-cyan-600 hover:bg-cyan-700 text-white"
              : "bg-slate-800/40 border-slate-600/50 text-slate-300 hover:bg-slate-800/60"
          )}
        >
          30 Days
        </Button>
        <Button
          variant={timeRange === "90days" ? "default" : "outline"}
          onClick={() => setTimeRange("90days")}
          size="sm"
          className={cn(
            timeRange === "90days"
              ? "bg-cyan-600 hover:bg-cyan-700 text-white"
              : "bg-slate-800/40 border-slate-600/50 text-slate-300 hover:bg-slate-800/60"
          )}
        >
          90 Days
        </Button>
      </div>

      {/* Summary Stats */}
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Study Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            {/* Flashcards Reviewed */}
            <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <span className="text-slate-400 text-sm">Flashcards Reviewed</span>
              </div>
              <p className="text-3xl font-bold text-cyan-400">
                {analytics.flashcardsReviewed}
              </p>
            </div>

            {/* Quizzes Completed */}
            <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <FileQuestion className="w-5 h-5 text-purple-400" />
                <span className="text-slate-400 text-sm">Quizzes Completed</span>
              </div>
              <p className="text-3xl font-bold text-purple-400">
                {analytics.quizzesCompleted}
              </p>
            </div>

            {/* Average Quiz Score */}
            <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-slate-400 text-sm">Avg Quiz Score</span>
              </div>
              <p className="text-3xl font-bold text-green-400">
                {Math.round(analytics.averageQuizScore)}%
              </p>
            </div>

            {/* Total Study Time */}
            <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <span className="text-slate-400 text-sm">Total Study Time</span>
              </div>
              <p className="text-3xl font-bold text-blue-400">
                {formatTime(analytics.totalStudyTime)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Breakdown Chart */}
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Daily Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.dailyBreakdown.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-sm">
                No activity recorded in this time period
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Legend */}
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-cyan-500/30 border border-cyan-500/50"></div>
                  <span className="text-slate-400">Flashcards</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-purple-500/30 border border-purple-500/50"></div>
                  <span className="text-slate-400">Quizzes</span>
                </div>
              </div>

              {/* Chart */}
              <div className="space-y-4">
                {analytics.dailyBreakdown.map((day, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400 w-20">
                        {formatDate(day.date)}
                      </span>
                      <div className="flex items-center gap-4 text-xs">
                        <Badge
                          variant="outline"
                          className="bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                        >
                          {day.flashcardsReviewed} flashcards
                        </Badge>
                        <Badge
                          variant="outline"
                          className="bg-purple-500/10 border-purple-500/30 text-purple-400"
                        >
                          {day.quizzesCompleted} quizzes
                        </Badge>
                      </div>
                    </div>

                    {/* Flashcards Bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-xs w-16">Flashcards</span>
                      <div className="flex-1 h-6 bg-slate-800/40 rounded-full overflow-hidden border border-slate-700/50">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500/30 to-cyan-500/50 border-r-2 border-cyan-500/50 transition-all duration-500"
                          style={{
                            width: `${(day.flashcardsReviewed / maxValue) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Quizzes Bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-xs w-16">Quizzes</span>
                      <div className="flex-1 h-6 bg-slate-800/40 rounded-full overflow-hidden border border-slate-700/50">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500/30 to-purple-500/50 border-r-2 border-purple-500/50 transition-all duration-500"
                          style={{
                            width: `${(day.quizzesCompleted / maxValue) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
