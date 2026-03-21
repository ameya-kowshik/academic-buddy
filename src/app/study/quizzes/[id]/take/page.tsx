"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  HelpCircle,
  FileQuestion,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Play,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  order: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  difficulty: number;
  questions: Question[];
}

export default function TakeQuizPage() {
  const rawParams = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  // Extract id from params (handle both sync and async)
  const quizId = typeof rawParams.id === 'string' ? rawParams.id : Array.isArray(rawParams.id) ? rawParams.id[0] : null;
  
  // Quiz data
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Quiz settings
  const [quizStarted, setQuizStarted] = useState(false);
  const [duration, setDuration] = useState(30); // minutes
  const [questionLimit, setQuestionLimit] = useState<number | null>(null);
  
  // Quiz state
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"one-at-a-time" | "all-at-once">("one-at-a-time");

  useEffect(() => {
    if (quizId && user) {
      fetchQuiz();
    }
  }, [quizId, user]);

  // Timer effect
  useEffect(() => {
    if (!quizStarted || !startTime || timeRemaining === null) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = duration * 60 - elapsed;
      
      if (remaining <= 0) {
        setTimeRemaining(0);
        handleAutoSubmit();
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [quizStarted, startTime, duration]);

  const fetchQuiz = async () => {
    if (!user || !quizId) return;

    try {
      setLoading(true);
      setError(null);

      const token = await user.getIdToken();
      const response = await fetch(`/api/quizzes/${quizId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch quiz");
      }

      const data = await response.json();
      setQuiz(data);
      setQuestionLimit(data.questions.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async () => {
    if (!user || !quiz || !quizId) return;

    try {
      setError(null);
      const token = await user.getIdToken();
      
      console.log('Starting quiz attempt for quiz:', quizId);
      
      // Start attempt
      const response = await fetch(`/api/quizzes/${quizId}/attempts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to start quiz:', errorData);
        throw new Error(errorData.error || "Failed to start quiz");
      }

      const data = await response.json();
      console.log('Quiz attempt response:', data);
      
      // The API returns the attempt directly, not wrapped
      if (!data || !data.id) {
        console.error('Invalid response structure:', data);
        throw new Error("Invalid response from server");
      }
      
      setAttemptId(data.id);
      setStartTime(Date.now());
      setTimeRemaining(duration * 60);
      setQuizStarted(true);
    } catch (err) {
      console.error('Error starting quiz:', err);
      setError(err instanceof Error ? err.message : "Failed to start quiz");
    }
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleAutoSubmit = async () => {
    if (submitting) return;
    setError("Time's up! Submitting your answers...");
    await handleSubmit();
  };

  const handleSubmit = async () => {
    if (!user || !quiz || !attemptId || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const questionsToAnswer = questionLimit 
        ? quiz.questions.slice(0, questionLimit)
        : quiz.questions;

      // Submit all answers
      for (const question of questionsToAnswer) {
        const selectedAnswer = answers[question.id] || "";
        
        await fetch(`/api/quizzes/attempts/${attemptId}/answers`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            questionId: question.id,
            answer: selectedAnswer,
          }),
        });
      }

      // Complete attempt
      const timeSpent = startTime ? Math.floor((Date.now() - startTime) / 1000 / 60) : 0;
      
      await fetch(`/api/quizzes/attempts/${attemptId}/complete`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ timeSpent }),
      });

      // Redirect to results
      router.push(`/study/quizzes/${quiz.id}/results/${attemptId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit quiz");
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      </AppLayout>
    );
  }

  if (error && !quiz) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="bg-slate-900/50 border-slate-700/50 max-w-md">
            <CardContent className="p-12 text-center">
              <HelpCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-slate-300 font-medium text-lg mb-2">Quiz not found</h3>
              <p className="text-slate-500 text-sm">{error}</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (!quiz) return null;

  const questionsToShow = questionLimit 
    ? quiz.questions.slice(0, questionLimit)
    : quiz.questions;
  
  // Safety check for empty questions
  if (!questionsToShow || questionsToShow.length === 0) {
    return (
      <AppLayout>
        <div className="min-h-screen container mx-auto px-6 py-8 max-w-3xl">
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-12 text-center">
              <HelpCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <h3 className="text-slate-300 font-medium text-lg mb-2">No questions available</h3>
              <p className="text-slate-500 text-sm mb-6">
                This quiz doesn't have any questions yet.
              </p>
              <Button
                onClick={() => router.push("/study/quizzes")}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white"
              >
                Back to Quizzes
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }
  
  const currentQuestion = questionsToShow[currentQuestionIndex];
  const totalQuestions = questionsToShow.length;
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / totalQuestions) * 100;
  const difficultyColor = getDifficultyColor(quiz.difficulty);

  // Pre-quiz settings screen
  if (!quizStarted) {
    return (
      <AppLayout>
        <div className="min-h-screen container mx-auto px-6 py-8 max-w-3xl">
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <FileQuestion className="w-6 h-6 text-amber-400" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-slate-100 text-xl mb-2">{quiz.title}</CardTitle>
                  {quiz.description && (
                    <p className="text-slate-400 text-sm">{quiz.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
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
                      {quiz.questions.length} questions available
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="duration" className="text-slate-200">
                    Quiz Duration (minutes)
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    min={1}
                    max={180}
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
                    className="bg-slate-800/40 border-slate-600/50 text-slate-200 mt-2"
                  />
                  <p className="text-slate-500 text-xs mt-1">
                    Set how long you have to complete the quiz
                  </p>
                </div>

                <div>
                  <Label htmlFor="questionLimit" className="text-slate-200">
                    Number of Questions
                  </Label>
                  <Input
                    id="questionLimit"
                    type="number"
                    min={1}
                    max={quiz.questions.length}
                    value={questionLimit || quiz.questions.length}
                    onChange={(e) => setQuestionLimit(parseInt(e.target.value) || quiz.questions.length)}
                    className="bg-slate-800/40 border-slate-600/50 text-slate-200 mt-2"
                  />
                  <p className="text-slate-500 text-xs mt-1">
                    Choose how many questions to answer (max: {quiz.questions.length})
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleStartQuiz}
                  className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Quiz
                </Button>
                <Button
                  onClick={() => router.push("/study/quizzes")}
                  variant="outline"
                  className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-slate-800/60"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Quiz taking screen
  return (
    <AppLayout>
      <div className="min-h-screen container mx-auto px-6 py-8 max-w-6xl">
        <div className="space-y-6">
          {/* Quiz Header */}
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <FileQuestion className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-slate-100 text-xl mb-2 truncate">{quiz.title}</CardTitle>
                    <div className="flex items-center gap-3 flex-wrap">
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
                        {totalQuestions} questions
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Clock className={cn(
                    "w-5 h-5",
                    timeRemaining !== null && timeRemaining < 60 ? "text-red-400" : "text-slate-300"
                  )} />
                  <span className={cn(
                    "text-lg font-mono",
                    timeRemaining !== null && timeRemaining < 60 ? "text-red-400" : "text-slate-300"
                  )}>
                    {timeRemaining !== null ? formatTime(timeRemaining) : "0:00"}
                  </span>
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
              {currentQuestion && (
                <Card className="bg-slate-900/50 border-slate-700/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-slate-200 text-lg">
                        Question {currentQuestionIndex + 1} of {totalQuestions}
                      </CardTitle>
                      {answers[currentQuestion.id] ? (
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
                            disabled={submitting}
                            className={cn(
                              "w-full p-4 rounded-lg border-2 text-left transition-all duration-200",
                              isSelected
                                ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-300"
                                : "bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800/60 hover:border-slate-600/50",
                              submitting && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                                  isSelected ? "border-cyan-500 bg-cyan-500" : "border-slate-600"
                                )}
                              >
                                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                              </div>
                              <span className="text-sm">{option}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between gap-4">
                <Button
                  onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                  disabled={currentQuestionIndex === 0 || submitting}
                  variant="outline"
                  className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-slate-800/60 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                {currentQuestionIndex === totalQuestions - 1 ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-medium"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Quiz"
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                    disabled={submitting}
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
                  <h3 className="text-slate-300 text-sm font-medium mb-3">Question Navigator</h3>
                  <div className="grid grid-cols-10 gap-2">
                    {questionsToShow.map((question, index) => (
                      <button
                        key={question.id}
                        onClick={() => setCurrentQuestionIndex(index)}
                        disabled={submitting}
                        className={cn(
                          "aspect-square rounded-md border-2 text-sm font-medium transition-all duration-200",
                          index === currentQuestionIndex
                            ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                            : answers[question.id]
                            ? "bg-green-500/10 border-green-500/30 text-green-400"
                            : "bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800/60",
                          submitting && "opacity-50 cursor-not-allowed"
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
                {questionsToShow.map((question, index) => (
                  <Card key={question.id} className="bg-slate-900/50 border-slate-700/50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-slate-200 text-lg">Question {index + 1}</CardTitle>
                        {answers[question.id] ? (
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
                              disabled={submitting}
                              className={cn(
                                "w-full p-4 rounded-lg border-2 text-left transition-all duration-200",
                                isSelected
                                  ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-300"
                                  : "bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800/60 hover:border-slate-600/50",
                                submitting && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                                    isSelected ? "border-cyan-500 bg-cyan-500" : "border-slate-600"
                                  )}
                                >
                                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
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
                  disabled={submitting}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-medium"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Quiz"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
