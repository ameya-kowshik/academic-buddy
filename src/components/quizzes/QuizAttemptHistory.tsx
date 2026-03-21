"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizAttempt {
  id: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number | null;
  startedAt: Date;
  completedAt: Date | null;
}

interface QuizAttemptHistoryProps {
  attempts: QuizAttempt[];
  quizTitle: string;
  isLoading?: boolean;
}

export default function QuizAttemptHistory({
  attempts,
  quizTitle,
  isLoading = false,
}: QuizAttemptHistoryProps) {
  const formatDate = (date: Date): string => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return { bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-400" };
    if (score >= 70) return { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400" };
    if (score >= 50) return { bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-400" };
    return { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400" };
  };

  const getTrendIcon = (currentScore: number, previousScore: number | null) => {
    if (previousScore === null) return null;
    if (currentScore > previousScore) {
      return <TrendingUp className="w-4 h-4 text-green-400" />;
    } else if (currentScore < previousScore) {
      return <TrendingDown className="w-4 h-4 text-red-400" />;
    }
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const calculateStats = () => {
    if (attempts.length === 0) {
      return {
        bestScore: 0,
        averageScore: 0,
        totalAttempts: 0,
        averageTime: 0,
      };
    }

    const bestScore = Math.max(...attempts.map((a) => a.score));
    const averageScore = Math.round(
      attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length
    );
    const totalAttempts = attempts.length;
    const validTimes = attempts.filter((a) => a.timeSpent !== null).map((a) => a.timeSpent!);
    const averageTime = validTimes.length > 0
      ? Math.round(validTimes.reduce((sum, t) => sum + t, 0) / validTimes.length)
      : 0;

    return { bestScore, averageScore, totalAttempts, averageTime };
  };

  const stats = calculateStats();

  if (isLoading) {
    return (
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-slate-700/50 rounded w-1/3"></div>
            <div className="h-20 bg-slate-700/50 rounded"></div>
            <div className="h-20 bg-slate-700/50 rounded"></div>
            <div className="h-20 bg-slate-700/50 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (attempts.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardContent className="p-12 text-center">
          <Clock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-slate-300 font-medium text-lg mb-2">
            No attempts yet
          </h3>
          <p className="text-slate-500 text-sm">
            Take this quiz to see your attempt history
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-slate-100">Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            {/* Best Score */}
            <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-slate-400 text-sm">Best Score</span>
              </div>
              <p className="text-2xl font-bold text-yellow-400">
                {stats.bestScore}%
              </p>
            </div>

            {/* Average Score */}
            <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-cyan-400" />
                <span className="text-slate-400 text-sm">Average Score</span>
              </div>
              <p className="text-2xl font-bold text-cyan-400">
                {stats.averageScore}%
              </p>
            </div>

            {/* Total Attempts */}
            <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                <span className="text-slate-400 text-sm">Total Attempts</span>
              </div>
              <p className="text-2xl font-bold text-purple-400">
                {stats.totalAttempts}
              </p>
            </div>

            {/* Average Time */}
            <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <span className="text-slate-400 text-sm">Avg Time</span>
              </div>
              <p className="text-2xl font-bold text-blue-400">
                {formatTime(stats.averageTime)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attempt History */}
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-slate-100">Attempt History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {attempts.map((attempt, index) => {
              const scoreColor = getScoreColor(attempt.score);
              const previousAttempt = index < attempts.length - 1 ? attempts[index + 1] : null;
              const trendIcon = getTrendIcon(
                attempt.score,
                previousAttempt?.score || null
              );

              return (
                <div
                  key={attempt.id}
                  className="bg-slate-800/40 rounded-lg p-5 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Attempt Info */}
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className="bg-slate-700/40 border-slate-600/50 text-slate-300"
                        >
                          Attempt #{attempts.length - index}
                        </Badge>
                        {index === 0 && (
                          <Badge
                            variant="outline"
                            className="bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                          >
                            Latest
                          </Badge>
                        )}
                        {attempt.score === stats.bestScore && (
                          <Badge
                            variant="outline"
                            className="bg-yellow-500/10 border-yellow-500/30 text-yellow-400 flex items-center gap-1"
                          >
                            <Trophy className="w-3 h-3" />
                            Best
                          </Badge>
                        )}
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(attempt.completedAt || attempt.startedAt)}</span>
                      </div>

                      {/* Stats Row */}
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        {/* Score */}
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Score:</span>
                          <div
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border",
                              scoreColor.bg,
                              scoreColor.border
                            )}
                          >
                            <span className={cn("font-bold", scoreColor.text)}>
                              {attempt.score}%
                            </span>
                            {trendIcon}
                          </div>
                        </div>

                        {/* Correct Answers */}
                        <div className="flex items-center gap-2 text-slate-400">
                          <span>Correct:</span>
                          <span className="text-green-400 font-medium">
                            {attempt.correctAnswers}/{attempt.totalQuestions}
                          </span>
                        </div>

                        {/* Time Spent */}
                        <div className="flex items-center gap-2 text-slate-400">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(attempt.timeSpent)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Performance Trend Chart (Simple Text-based) */}
      {attempts.length > 1 && (
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-slate-100">Score Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {attempts.slice().reverse().map((attempt, index) => {
                const scoreColor = getScoreColor(attempt.score);
                const barWidth = `${attempt.score}%`;

                return (
                  <div key={attempt.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">
                        Attempt #{index + 1}
                      </span>
                      <span className={cn("font-medium", scoreColor.text)}>
                        {attempt.score}%
                      </span>
                    </div>
                    <div className="h-3 bg-slate-800/40 rounded-full overflow-hidden border border-slate-700/50">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          scoreColor.bg.replace("/10", "/30")
                        )}
                        style={{ width: barWidth }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
