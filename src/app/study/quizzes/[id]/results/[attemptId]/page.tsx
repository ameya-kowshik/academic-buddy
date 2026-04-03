"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, HelpCircle, Trophy, Clock, CheckCircle2, XCircle,
  RotateCcw, ArrowLeft, BookOpen, ChevronDown, ChevronUp, Brain, Sparkles
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface QuestionAttempt {
  id: string;
  selectedAnswer: string;
  isCorrect: boolean;
  quizQuestion: {
    id: string;
    questionText: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    order: number;
  };
}

interface AttemptWithReview {
  id: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number | null;
  completedAt: string;
  quiz: { id: string; title: string; description: string | null; difficulty: number };
  questionAttempts: QuestionAttempt[];
}

export default function QuizResultsPage() {
  const rawParams = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const quizId = typeof rawParams.id === "string" ? rawParams.id : Array.isArray(rawParams.id) ? rawParams.id[0] : null;
  const attemptId = typeof rawParams.attemptId === "string" ? rawParams.attemptId : Array.isArray(rawParams.attemptId) ? rawParams.attemptId[0] : null;

  const [attempt, setAttempt] = useState<AttemptWithReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [weakAreaAnalysis, setWeakAreaAnalysis] = useState<{
    weakTopics: string[];
    recommendations: string[];
  } | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    if (attemptId && user) fetchAttempt();
  }, [attemptId, user]);

  const fetchAttempt = async () => {
    if (!user || !attemptId) return;
    try {
      setLoading(true);
      const token = await user.getIdToken();
      const res = await fetch(`/api/quizzes/attempts/${attemptId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch results");
      setAttempt(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number | null): string => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const toggleQuestion = (id: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAnalyzeWeakAreas = async () => {
    if (!user || !attemptId) return;
    setAnalyzing(true);
    setAnalysisError(null);
    setWeakAreaAnalysis(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/ai/analyze-weak-areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ attemptId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setWeakAreaAnalysis(data.analysis);
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-400" };
    if (score >= 60) return { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400" };
    if (score >= 40) return { bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-400" };
    return { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400" };
  };

  if (loading) return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    </AppLayout>
  );

  if (error || !attempt) return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center">
        <Card className="bg-slate-900/50 border-slate-700/50 max-w-md">
          <CardContent className="p-12 text-center">
            <HelpCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-slate-300 font-medium text-lg mb-2">Results not found</h3>
            <p className="text-slate-500 text-sm mb-6">{error}</p>
            <Button onClick={() => router.push("/study/quizzes")}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white">
              Back to Quizzes
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );

  const scoreColor = getScoreColor(attempt.score);
  const wrongAnswers = attempt.questionAttempts.filter((q) => !q.isCorrect);
  const displayedQuestions = showAll ? attempt.questionAttempts : attempt.questionAttempts.slice(0, 5);

  return (
    <AppLayout>
      <div className="min-h-screen container mx-auto px-6 py-8 max-w-4xl space-y-6">

        {/* Score Summary */}
        <Card className={cn("border-2", scoreColor.bg, scoreColor.border)}>
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center gap-4 mb-6">
              <Trophy className={cn("w-10 h-10", scoreColor.text)} />
              <div className={cn("text-6xl font-bold", scoreColor.text)}>{Math.round(attempt.score)}%</div>
            </div>
            <p className="text-slate-300 text-lg font-medium mb-1">{attempt.quiz.title}</p>
            <div className="flex items-center justify-center gap-8 mt-6">
              <div className="text-center">
                <div className="flex items-center gap-2 text-green-400 mb-1">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-2xl font-bold">{attempt.correctAnswers}</span>
                </div>
                <p className="text-slate-500 text-sm">Correct</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-2 text-red-400 mb-1">
                  <XCircle className="w-5 h-5" />
                  <span className="text-2xl font-bold">{attempt.totalQuestions - attempt.correctAnswers}</span>
                </div>
                <p className="text-slate-500 text-sm">Incorrect</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-2 text-blue-400 mb-1">
                  <Clock className="w-5 h-5" />
                  <span className="text-2xl font-bold">{formatTime(attempt.timeSpent)}</span>
                </div>
                <p className="text-slate-500 text-sm">Time Spent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weak areas prompt if score < 70 */}
        {attempt.score < 70 && (
          <Card className="bg-orange-500/10 border-orange-500/20">
            <CardContent className="p-5 flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-orange-300 font-medium">You scored below 70% on this topic.</p>
                <p className="text-slate-400 text-sm mt-1">
                  Consider reviewing the flashcards for <span className="text-cyan-400">{attempt.quiz.title}</span> to reinforce the concepts you missed.
                </p>
                <Button
                  onClick={() => router.push("/study/flashcards")}
                  size="sm"
                  className="mt-3 bg-orange-600 hover:bg-orange-500 text-white"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Review Flashcards
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Weak Area Analysis for this attempt */}
        {attempt.totalQuestions - attempt.correctAnswers > 0 && (
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-violet-400" />
                  <h3 className="text-slate-200 font-medium">AI Topic Analysis</h3>
                </div>
                {!weakAreaAnalysis && (
                  <Button
                    onClick={handleAnalyzeWeakAreas}
                    disabled={analyzing}
                    size="sm"
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white"
                  >
                    {analyzing ? (
                      <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />Analyzing...</>
                    ) : (
                      <><Sparkles className="w-3.5 h-3.5 mr-2" />Identify Weak Topics</>
                    )}
                  </Button>
                )}
              </div>

              {analysisError && (
                <p className="text-red-400 text-sm">{analysisError}</p>
              )}

              {weakAreaAnalysis && (
                <div className="space-y-4">
                  {weakAreaAnalysis.weakTopics.length > 0 ? (
                    <>
                      <div>
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-2">Topics to review</p>
                        <div className="flex flex-wrap gap-2">
                          {weakAreaAnalysis.weakTopics.map((topic, i) => (
                            <span key={i} className="px-3 py-1 bg-orange-500/15 border border-orange-500/30 text-orange-300 rounded-full text-sm">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-2">Recommendations</p>
                        <ol className="space-y-2">
                          {weakAreaAnalysis.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                              <span className="text-violet-400 font-bold flex-shrink-0">{i + 1}.</span>
                              {rec}
                            </li>
                          ))}
                        </ol>
                      </div>
                    </>
                  ) : (
                    <p className="text-emerald-400 text-sm">No specific weak topics identified — good performance on the questions you got wrong.</p>
                  )}
                  <Button
                    onClick={handleAnalyzeWeakAreas}
                    variant="ghost"
                    size="sm"
                    className="text-slate-500 hover:text-violet-400 text-xs"
                  >
                    Re-analyze
                  </Button>
                </div>
              )}

              {!weakAreaAnalysis && !analyzing && !analysisError && (
                <p className="text-slate-500 text-sm">
                  Click "Identify Weak Topics" to get AI-powered analysis of which specific concepts you need to review based on the questions you got wrong.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Question Review */}
        <Card className="bg-slate-900/50 border-slate-700/50">          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center justify-between">
              <span>Question Review</span>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-green-500/10 border-green-500/20 text-green-400">
                  {attempt.correctAnswers} correct
                </Badge>
                <Badge variant="outline" className="bg-red-500/10 border-red-500/20 text-red-400">
                  {attempt.totalQuestions - attempt.correctAnswers} wrong
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {displayedQuestions.map((qa, index) => {
              const isExpanded = expandedQuestions.has(qa.id);
              return (
                <div key={qa.id} className={cn(
                  "rounded-lg border p-4 transition-all",
                  qa.isCorrect ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"
                )}>
                  <button
                    className="w-full text-left flex items-start justify-between gap-3"
                    onClick={() => toggleQuestion(qa.id)}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      {qa.isCorrect
                        ? <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      }
                      <span className="text-slate-200 text-sm font-medium">
                        Q{qa.quizQuestion.order}. {qa.quizQuestion.questionText}
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-4 ml-8 space-y-3">
                      <div className="space-y-2">
                        {qa.quizQuestion.options.map((opt, i) => {
                          const isCorrect = opt === qa.quizQuestion.correctAnswer;
                          const isSelected = opt === qa.selectedAnswer;
                          return (
                            <div key={i} className={cn(
                              "px-3 py-2 rounded-md text-sm flex items-center gap-2",
                              isCorrect ? "bg-green-500/15 text-green-300 border border-green-500/30" :
                              isSelected && !isCorrect ? "bg-red-500/15 text-red-300 border border-red-500/30" :
                              "text-slate-400"
                            )}>
                              {isCorrect && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
                              {isSelected && !isCorrect && <XCircle className="w-4 h-4 flex-shrink-0" />}
                              {!isCorrect && !isSelected && <span className="w-4" />}
                              {opt}
                              {isCorrect && <span className="ml-auto text-xs text-green-400">Correct answer</span>}
                              {isSelected && !isCorrect && <span className="ml-auto text-xs text-red-400">Your answer</span>}
                            </div>
                          );
                        })}
                      </div>
                      {qa.quizQuestion.explanation && (
                        <div className="bg-slate-800/60 rounded-md p-3 border border-slate-700/50">
                          <p className="text-slate-400 text-xs font-medium mb-1">Explanation</p>
                          <p className="text-slate-300 text-sm">{qa.quizQuestion.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {attempt.questionAttempts.length > 5 && (
              <Button
                variant="ghost"
                onClick={() => setShowAll(!showAll)}
                className="w-full text-slate-400 hover:text-cyan-400"
              >
                {showAll ? "Show less" : `Show all ${attempt.questionAttempts.length} questions`}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          <Button onClick={() => router.push(`/study/quizzes/${quizId}/take`)}
            className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white">
            <RotateCcw className="w-4 h-4 mr-2" />
            Retake Quiz
          </Button>
          <Button onClick={() => router.push("/study/analytics")}
            variant="outline"
            className="flex-1 bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-slate-800/60">
            View Analytics
          </Button>
          <Button onClick={() => router.push("/study/quizzes")}
            variant="outline"
            className="flex-1 bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-slate-800/60">
            <ArrowLeft className="w-4 h-4 mr-2" />
            All Quizzes
          </Button>
        </div>

      </div>
    </AppLayout>
  );
}
