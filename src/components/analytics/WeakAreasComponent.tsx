"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  TrendingDown,
  Lightbulb,
  BookOpen,
  FileQuestion,
  Target,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import AIWeakAreaAnalysis from "./AIWeakAreaAnalysis";
import { useAuth } from "@/hooks/useAuth";

interface WeakArea {
  type: "difficulty" | "grouping";
  identifier: string | number;
  averageScore: number;
  attemptCount: number;
  recommendations: string[];
}

interface WeakAreasComponentProps {
  userId: string;
  onViewFlashcards?: (grouping?: string, difficulty?: number) => void;
  onViewQuizzes?: (grouping?: string, difficulty?: number) => void;
  isLoading?: boolean;
}

export default function WeakAreasComponent({
  userId,
  onViewFlashcards,
  onViewQuizzes,
  isLoading: externalLoading = false,
}: WeakAreasComponentProps) {
  const { user } = useAuth();
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      fetchWeakAreas();
    }
  }, [user]);

  const fetchWeakAreas = async () => {
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/analytics/weak-areas", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch weak areas");
      }

      const data = await response.json();
      setWeakAreas(data.weakAreas || []);
    } catch (err) {
      console.error("Error fetching weak areas:", err);
      setError(err instanceof Error ? err.message : "Failed to load weak areas");
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyLabel = (difficulty: number): string => {
    const labels = {
      1: "Very Easy",
      2: "Easy",
      3: "Medium",
      4: "Hard",
      5: "Very Hard",
    };
    return labels[difficulty as keyof typeof labels] || "Unknown";
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return { bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-400" };
    if (score >= 50) return { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-400" };
    return { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400" };
  };

  const isLoadingState = loading || externalLoading;

  if (isLoadingState) {
    return (
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-slate-700/50 rounded w-1/3"></div>
            <div className="h-32 bg-slate-700/50 rounded"></div>
            <div className="h-32 bg-slate-700/50 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardContent className="p-12 text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-slate-300 font-medium text-lg mb-2">
            Failed to load weak areas
          </h3>
          <p className="text-slate-500 text-sm mb-4">{error}</p>
          <Button
            onClick={fetchWeakAreas}
            variant="outline"
            className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-slate-800/60"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (weakAreas.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardContent className="p-12 text-center">
          <Target className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-slate-300 font-medium text-lg mb-2">
            No weak areas identified
          </h3>
          <p className="text-slate-500 text-sm">
            Great job! Keep up the good work with your studies.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-slate-100 flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                Areas for Improvement
              </CardTitle>
              <p className="text-slate-400 text-sm">
                Focus on these areas to improve your performance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <AIWeakAreaAnalysis
                onViewFlashcards={onViewFlashcards}
                onViewQuizzes={onViewQuizzes}
              />
              <Button
                onClick={fetchWeakAreas}
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Weak Areas List */}
      <div className="space-y-4">
        {weakAreas.map((area, index) => {
          const scoreColor = getScoreColor(area.averageScore);
          const isDifficulty = area.type === "difficulty";
          const displayName = isDifficulty
            ? getDifficultyLabel(area.identifier as number)
            : area.identifier;

          return (
            <Card
              key={index}
              className="bg-slate-900/50 border-slate-700/50 hover:border-slate-600/50 transition-all duration-200"
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                        <TrendingDown className="w-6 h-6 text-orange-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-slate-200 font-medium text-lg">
                            {displayName}
                          </h3>
                          <Badge
                            variant="outline"
                            className="bg-slate-800/40 border-slate-600/50 text-slate-300 text-xs"
                          >
                            {isDifficulty ? "Difficulty Level" : "Topic"}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm">
                          {area.attemptCount} {area.attemptCount === 1 ? "attempt" : "attempts"}
                        </p>
                      </div>
                    </div>

                    {/* Score Badge */}
                    <div
                      className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-lg border",
                        scoreColor.bg,
                        scoreColor.border
                      )}
                    >
                      <span className={cn("text-2xl font-bold", scoreColor.text)}>
                        {area.averageScore}%
                      </span>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {area.recommendations.length > 0 && (
                    <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
                      <div className="flex items-start gap-2 mb-3">
                        <Lightbulb className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <h4 className="text-slate-300 font-medium">
                          Recommendations
                        </h4>
                      </div>
                      <ul className="space-y-2">
                        {area.recommendations.map((rec, recIndex) => (
                          <li
                            key={recIndex}
                            className="text-slate-400 text-sm flex items-start gap-2"
                          >
                            <span className="text-cyan-400 mt-1">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {onViewFlashcards && (
                      <Button
                        onClick={() =>
                          onViewFlashcards(
                            isDifficulty ? undefined : (area.identifier as string),
                            isDifficulty ? (area.identifier as number) : undefined
                          )
                        }
                        size="sm"
                        variant="outline"
                        className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-300"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Review Flashcards
                      </Button>
                    )}
                    {onViewQuizzes && (
                      <Button
                        onClick={() =>
                          onViewQuizzes(
                            isDifficulty ? undefined : (area.identifier as string),
                            isDifficulty ? (area.identifier as number) : undefined
                          )
                        }
                        size="sm"
                        variant="outline"
                        className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-purple-500/10 hover:border-purple-500/30 hover:text-purple-300"
                      >
                        <FileQuestion className="w-4 h-4 mr-2" />
                        Practice Quizzes
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-slate-300 font-medium mb-2">Study Tips</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>
                    Focus on areas with scores below 70% to improve overall performance
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>
                    Review flashcards regularly to reinforce weak topics
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>
                    Take practice quizzes to test your understanding and track progress
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
