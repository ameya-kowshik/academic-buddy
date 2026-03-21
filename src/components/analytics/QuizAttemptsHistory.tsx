"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileQuestion, 
  Trophy, 
  Clock, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface QuizAttempt {
  id: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number | null;
  completedAt: Date;
  quiz: {
    id: string;
    title: string;
    difficulty: number;
  };
}

interface QuizAttemptsHistoryProps {
  userId: string;
  limit?: number;
}

export default function QuizAttemptsHistory({ userId, limit = 10 }: QuizAttemptsHistoryProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId && user) {
      fetchAttempts();
    }
  }, [userId, user, limit]);

  const fetchAttempts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const token = await user.getIdToken();

      // Fetch all quizzes to get their attempts
      const quizzesResponse = await fetch("/api/quizzes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!quizzesResponse.ok) {
        throw new Error("Failed to fetch quizzes");
      }

      const quizzesData = await quizzesResponse.json();
      console.log('Quizzes response:', quizzesData);
      
      // The API returns { quizzes: [...] }
      const quizzes = quizzesData.quizzes || [];
      
      if (quizzes.length === 0) {
        setAttempts([]);
        return;
      }
      
      // Fetch attempts for each quiz
      const allAttempts: QuizAttempt[] = [];
      
      for (const quiz of quizzes) {
        const attemptsResponse = await fetch(`/api/quizzes/${quiz.id}/attempts`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (attemptsResponse.ok) {
          const quizAttempts = await attemptsResponse.json();
          console.log(`Attempts for quiz ${quiz.id}:`, quizAttempts);
          
          // Ensure quizAttempts is an array
          const attemptsArray = Array.isArray(quizAttempts) ? quizAttempts : [];
          
          // Filter for completed attempts only
          const completedAttempts = attemptsArray.filter((a: QuizAttempt) => a.completedAt !== null);
          allAttempts.push(...completedAttempts);
        }
      }

      // Sort by completion date (most recent first) and limit
      const sortedAttempts = allAttempts
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
        .slice(0, limit);

      setAttempts(sortedAttempts);
    } catch (err) {
      console.error("Error fetching quiz attempts:", err);
      setError(err instanceof Error ? err.message : "Failed to load quiz attempts");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number | null): string => {
    if (!seconds) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatDate = (date: Date): string => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
  };

  const getDifficultyLabel = (difficulty: number): string => {
    const labels = { 1: "Very Easy", 2: "Easy", 3: "Medium", 4: "Hard", 5: "Very Hard" };
    return labels[difficulty as keyof typeof labels] || "Unknown";
  };

  const getDifficultyColor = (difficulty: number) => {
    const colors = {
      1: { bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-400" },
      2: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400" },
      3: { bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-400" },
      4: { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-400" },
      5: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400" },
    };
    return colors[difficulty as keyof typeof colors] || colors[3];
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-400" };
    if (score >= 60) return { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400" };
    if (score >= 40) return { bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-400" };
    return { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400" };
  };

  const getScoreTrend = (score: number) => {
    if (score >= 80) return { icon: TrendingUp, color: "text-green-400" };
    if (score >= 60) return { icon: Minus, color: "text-blue-400" };
    return { icon: TrendingDown, color: "text-red-400" };
  };

  if (loading) {
    return (
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardContent className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardContent className="p-12 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-slate-300 font-medium text-lg mb-2">Failed to load quiz attempts</h3>
          <p className="text-slate-500 text-sm mb-4">{error}</p>
          <Button
            onClick={fetchAttempts}
            variant="outline"
            className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-slate-800/60"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (attempts.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardContent className="p-12 text-center">
          <FileQuestion className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-slate-300 font-medium text-lg mb-2">No Quiz Attempts Yet</h3>
          <p className="text-slate-500 text-sm mb-6">
            Complete some quizzes to see your attempt history here
          </p>
          <Button
            onClick={() => router.push("/study/quizzes")}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
          >
            <FileQuestion className="w-4 h-4 mr-2" />
            Browse Quizzes
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-slate-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Recent Quiz Attempts
          </CardTitle>
          <Button
            onClick={() => router.push("/study/quizzes")}
            variant="outline"
            size="sm"
            className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-slate-800/60"
          >
            View All Quizzes
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {attempts.map((attempt) => {
            const scoreColor = getScoreColor(attempt.score);
            const difficultyColor = getDifficultyColor(attempt.quiz.difficulty);
            const ScoreTrendIcon = getScoreTrend(attempt.score).icon;
            const scoreTrendColor = getScoreTrend(attempt.score).color;

            return (
              <div
                key={attempt.id}
                className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50 hover:bg-slate-800/60 transition-colors cursor-pointer"
                onClick={() => router.push(`/study/quizzes/${attempt.quiz.id}/results/${attempt.id}`)}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Quiz Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-slate-200 font-medium mb-2 truncate">
                      {attempt.quiz.title}
                    </h4>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium",
                          difficultyColor.bg,
                          difficultyColor.border,
                          difficultyColor.text
                        )}
                      >
                        {getDifficultyLabel(attempt.quiz.difficulty)}
                      </div>
                      <Badge variant="outline" className="bg-slate-700/30 border-slate-600/50 text-slate-300 text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(attempt.completedAt)}
                      </Badge>
                      {attempt.timeSpent && (
                        <Badge variant="outline" className="bg-slate-700/30 border-slate-600/50 text-slate-300 text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTime(attempt.timeSpent)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Score Display */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <ScoreTrendIcon className={cn("w-4 h-4", scoreTrendColor)} />
                        <span className={cn("text-2xl font-bold", scoreColor.text)}>
                          {Math.round(attempt.score)}%
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs">
                        {attempt.correctAnswers}/{attempt.totalQuestions} correct
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
