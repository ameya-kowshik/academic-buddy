"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  FileQuestion,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  order: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  difficulty: number;
  questions: QuizQuestion[];
}

interface QuizTakingProps {
  quiz: Quiz;
  onSubmit: (answers: Record<string, string>) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

export default function QuizTaking({
  quiz,
  onSubmit,
  onCancel,
  loading = false,
}: QuizTakingProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [viewMode, setViewMode] = useState<"one-at-a-time" | "all-at-once">("one-at-a-time");
  const [error, setError] = useState("");

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / totalQuestions) * 100;

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setError("");

    // Check if all questions are answered
    if (answeredCount < totalQuestions) {
      setError(`Please answer all questions. ${totalQuestions - answeredCount} question(s) remaining.`);
      return;
    }

    try {
      await onSubmit(answers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit quiz");
    }
  };

  const isQuestionAnswered = (questionId: string): boolean => {
    return questionId in answers;
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

  const difficultyColor = getDifficultyColor(quiz.difficulty);

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                <FileQuestion className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-slate-100 text-xl mb-2">
                  {quiz.title}
                </CardTitle>
                {quiz.description && (
                  <p className="text-slate-400 text-sm">{quiz.description}</p>
                )}
                <div className="flex items-center gap-3 mt-3">
                  <div
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium",
                      difficultyColor.bg,
                      difficultyColor.border,
                      difficultyColor.text
                    )}
                  >
                    {getDifficultyLabel(quiz.difficulty)}
                  </div>
                  <Badge variant="outline" className="bg-slate-800/40 border-slate-600/50 text-slate-300">
                    {totalQuestions} {totalQuestions === 1 ? "question" : "questions"}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-5 h-5" />
              <span className="text-lg font-mono">{formatTime(elapsedTime)}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Progress Bar */}
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Progress</span>
              <span className="text-slate-400">
                {answeredCount} / {totalQuestions} answered
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* View Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === "one-at-a-time" ? "default" : "outline"}
          onClick={() => setViewMode("one-at-a-time")}
          size="sm"
          className={cn(
            viewMode === "one-at-a-time"
              ? "bg-cyan-600 hover:bg-cyan-700 text-white"
              : "bg-slate-800/40 border-slate-600/50 text-slate-300 hover:bg-slate-800/60"
          )}
        >
          One at a Time
        </Button>
        <Button
          variant={viewMode === "all-at-once" ? "default" : "outline"}
          onClick={() => setViewMode("all-at-once")}
          size="sm"
          className={cn(
            viewMode === "all-at-once"
              ? "bg-cyan-600 hover:bg-cyan-700 text-white"
              : "bg-slate-800/40 border-slate-600/50 text-slate-300 hover:bg-slate-800/60"
          )}
        >
          All at Once
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Questions Display */}
      {viewMode === "one-at-a-time" ? (
        <>
          {/* Single Question View */}
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-200 text-lg">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </CardTitle>
                {isQuestionAnswered(currentQuestion.id) ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-600" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-slate-300 text-base leading-relaxed">
                {currentQuestion.questionText}
              </p>

              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = answers[currentQuestion.id] === option;
                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                      disabled={loading}
                      className={cn(
                        "w-full p-4 rounded-lg border-2 text-left transition-all duration-200",
                        isSelected
                          ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-300"
                          : "bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800/60 hover:border-slate-600/50",
                        loading && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                            isSelected
                              ? "border-cyan-500 bg-cyan-500"
                              : "border-slate-600"
                          )}
                        >
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <span className="text-sm">{option}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4">
            <Button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0 || loading}
              variant="outline"
              className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-slate-800/60 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentQuestionIndex === totalQuestions - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-medium"
              >
                {loading ? "Submitting..." : "Submit Quiz"}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={loading}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Question Navigator */}
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-6">
              <h3 className="text-slate-300 text-sm font-medium mb-3">
                Question Navigator
              </h3>
              <div className="grid grid-cols-10 gap-2">
                {quiz.questions.map((question, index) => (
                  <button
                    key={question.id}
                    onClick={() => setCurrentQuestionIndex(index)}
                    disabled={loading}
                    className={cn(
                      "aspect-square rounded-md border-2 text-sm font-medium transition-all duration-200",
                      index === currentQuestionIndex
                        ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                        : isQuestionAnswered(question.id)
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : "bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800/60",
                      loading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* All Questions View */}
          <div className="space-y-6">
            {quiz.questions.map((question, index) => (
              <Card key={question.id} className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-slate-200 text-lg">
                      Question {index + 1}
                    </CardTitle>
                    {isQuestionAnswered(question.id) ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-300 text-base leading-relaxed">
                    {question.questionText}
                  </p>

                  <div className="space-y-3">
                    {question.options.map((option, optionIndex) => {
                      const isSelected = answers[question.id] === option;
                      return (
                        <button
                          key={optionIndex}
                          onClick={() => handleAnswerSelect(question.id, option)}
                          disabled={loading}
                          className={cn(
                            "w-full p-4 rounded-lg border-2 text-left transition-all duration-200",
                            isSelected
                              ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-300"
                              : "bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800/60 hover:border-slate-600/50",
                            loading && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                                isSelected
                                  ? "border-cyan-500 bg-cyan-500"
                                  : "border-slate-600"
                              )}
                            >
                              {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </div>
                            <span className="text-sm">{option}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-medium"
            >
              {loading ? "Submitting..." : "Submit Quiz"}
            </Button>
            {onCancel && (
              <Button
                onClick={onCancel}
                disabled={loading}
                variant="outline"
                className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-slate-800/60"
              >
                Cancel
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
