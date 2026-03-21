"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Home,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string | null;
}

interface QuizAttempt {
  id: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number | null;
  completedAt: Date;
}

interface QuizResultsProps {
  quiz: {
    id: string;
    title: string;
    questions: QuizQuestion[];
  };
  attempt: QuizAttempt;
  userAnswers: Record<string, string>;
  onRetry?: () => void;
  onViewHistory?: () => void;
  onGoHome?: () => void;
}

export default function QuizResults({
  quiz,
  attempt,
  userAnswers,
  onRetry,
  onViewHistory,
  onGoHome,
}: QuizResultsProps) {
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

  const getScoreMessage = (score: number): string => {
    if (score >= 90) return "Excellent work!";
    if (score >= 70) return "Great job!";
    if (score >= 50) return "Good effort!";
    return "Keep practicing!";
  };

  const scoreColor = getScoreColor(attempt.score);
  const scoreMessage = getScoreMessage(attempt.score);

  return (
    <div className="space-y-6">
      {/* Score Summary Card */}
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            {/* Trophy Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/30 flex items-center justify-center">
                <Trophy className="w-10 h-10 text-yellow-400" />
              </div>
            </div>

            {/* Score */}
            <div>
              <h2 className="text-slate-400 text-sm font-medium mb-2">Your Score</h2>
              <div
                className={cn(
                  "inline-flex items-center gap-3 px-6 py-3 rounded-lg border-2",
                  scoreColor.bg,
                  scoreColor.border
                )}
              >
                <span className={cn("text-5xl font-bold", scoreColor.text)}>
                  {attempt.score}%
                </span>
              </div>
              <p className={cn("text-lg font-medium mt-3", scoreColor.text)}>
                {scoreMessage}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-3 gap-4 pt-4">
              <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-center justify-center gap-2 text-green-400 mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-2xl font-bold">{attempt.correctAnswers}</span>
                </div>
                <p className="text-slate-400 text-sm">Correct</p>
              </div>

              <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-center justify-center gap-2 text-red-400 mb-2">
                  <XCircle className="w-5 h-5" />
                  <span className="text-2xl font-bold">
                    {attempt.totalQuestions - attempt.correctAnswers}
                  </span>
                </div>
                <p className="text-slate-400 text-sm">Incorrect</p>
              </div>

              <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-center justify-center gap-2 text-cyan-400 mb-2">
                  <Clock className="w-5 h-5" />
                  <span className="text-2xl font-bold">
                    {formatTime(attempt.timeSpent)}
                  </span>
                </div>
                <p className="text-slate-400 text-sm">Time Spent</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              {onRetry && (
                <Button
                  onClick={onRetry}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retry Quiz
                </Button>
              )}
              {onViewHistory && (
                <Button
                  onClick={onViewHistory}
                  variant="outline"
                  className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-slate-800/60"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View History
                </Button>
              )}
              {onGoHome && (
                <Button
                  onClick={onGoHome}
                  variant="outline"
                  className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-slate-800/60"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Review */}
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-slate-100">Question Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {quiz.questions.map((question, index) => {
            const userAnswer = userAnswers[question.id];
            const isCorrect = userAnswer === question.correctAnswer;

            return (
              <div
                key={question.id}
                className={cn(
                  "p-6 rounded-lg border-2",
                  isCorrect
                    ? "bg-green-500/5 border-green-500/20"
                    : "bg-red-500/5 border-red-500/20"
                )}
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <Badge
                      variant="outline"
                      className={cn(
                        "flex-shrink-0",
                        isCorrect
                          ? "bg-green-500/10 border-green-500/30 text-green-400"
                          : "bg-red-500/10 border-red-500/30 text-red-400"
                      )}
                    >
                      Question {index + 1}
                    </Badge>
                    <p className="text-slate-200 text-base leading-relaxed">
                      {question.questionText}
                    </p>
                  </div>
                  {isCorrect ? (
                    <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                  )}
                </div>

                {/* Answer Options */}
                <div className="space-y-3 mb-4">
                  {question.options.map((option, optionIndex) => {
                    const isUserAnswer = userAnswer === option;
                    const isCorrectAnswer = question.correctAnswer === option;

                    return (
                      <div
                        key={optionIndex}
                        className={cn(
                          "p-4 rounded-lg border-2",
                          isCorrectAnswer
                            ? "bg-green-500/10 border-green-500/30"
                            : isUserAnswer
                            ? "bg-red-500/10 border-red-500/30"
                            : "bg-slate-800/40 border-slate-700/50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {isCorrectAnswer && (
                            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                          )}
                          {isUserAnswer && !isCorrectAnswer && (
                            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                          )}
                          <span
                            className={cn(
                              "text-sm",
                              isCorrectAnswer
                                ? "text-green-300 font-medium"
                                : isUserAnswer
                                ? "text-red-300"
                                : "text-slate-400"
                            )}
                          >
                            {option}
                          </span>
                          {isCorrectAnswer && (
                            <Badge
                              variant="outline"
                              className="ml-auto bg-green-500/10 border-green-500/30 text-green-400 text-xs"
                            >
                              Correct Answer
                            </Badge>
                          )}
                          {isUserAnswer && !isCorrectAnswer && (
                            <Badge
                              variant="outline"
                              className="ml-auto bg-red-500/10 border-red-500/30 text-red-400 text-xs"
                            >
                              Your Answer
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {question.explanation && (
                  <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
                    <h4 className="text-slate-300 text-sm font-medium mb-2">
                      Explanation
                    </h4>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {question.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
