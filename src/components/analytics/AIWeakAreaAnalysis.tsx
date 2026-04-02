"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sparkles,
  Loader2,
  Lightbulb,
  TrendingDown,
  BookOpen,
  FileQuestion,
  AlertCircle,
  CheckCircle2,
  Brain,
  Target,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

interface WeakAreaAnalysis {
  weakTopics: string[];
  weakDifficulties: number[];
  recommendations: string[];
}

interface AIWeakAreaAnalysisProps {
  onViewFlashcards?: (grouping?: string, difficulty?: number) => void;
  onViewQuizzes?: (grouping?: string, difficulty?: number) => void;
}

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Very Easy",
  2: "Easy",
  3: "Medium",
  4: "Hard",
  5: "Very Hard",
};

export default function AIWeakAreaAnalysis({
  onViewFlashcards,
  onViewQuizzes,
}: AIWeakAreaAnalysisProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<WeakAreaAnalysis | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);

  const handleAnalyze = async () => {
    if (!user) {
      setError("You must be signed in to use AI analysis.");
      return;
    }

    setAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const token = await user.getIdToken();

      const response = await fetch("/api/ai/analyze-weak-areas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze weak areas");
      }

      setAnalysis(data.analysis);
      setAttemptCount(data.attemptCount ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setAnalysis(null);
    setError(null);
  };

  const handleReanalyze = () => {
    setAnalysis(null);
    setError(null);
    handleAnalyze();
  };

  const isHealthy =
    analysis &&
    analysis.weakTopics.length === 0 &&
    analysis.weakDifficulties.length === 0;

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/20"
      >
        <Brain className="w-4 h-4 mr-2" />
        AI Analysis
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-100 flex items-center gap-2 text-lg">
              <Brain className="w-5 h-5 text-violet-400" />
              AI Weak Area Analysis
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Veyra reads your full quiz history and reasons about where your knowledge gaps are.
            </DialogDescription>
          </DialogHeader>

          {/* Pre-analysis state */}
          {!analysis && !analyzing && (
            <div className="space-y-4 py-2">
              <Card className="bg-slate-800/40 border-slate-700/50">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-slate-300 font-medium">
                    <Lightbulb className="w-4 h-4 text-yellow-400" />
                    How this works
                  </div>
                  <ul className="space-y-2 text-slate-400 text-sm pl-6">
                    <li className="list-disc">Veyra fetches all your completed quiz attempts</li>
                    <li className="list-disc">LLaMA 3.3 70B reasons over your scores, topics, and difficulty levels</li>
                    <li className="list-disc">You get a breakdown of weak topics, hard difficulty levels, and specific next steps</li>
                  </ul>
                </CardContent>
              </Card>

              {error && (
                <Card className="bg-red-500/10 border-red-500/20">
                  <CardContent className="p-4 flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={handleAnalyze}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze My Performance
              </Button>
            </div>
          )}

          {/* Loading state */}
          {analyzing && (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 bg-violet-500/10 border border-violet-500/20 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
              </div>
              <div>
                <p className="text-slate-200 font-medium">Analyzing your quiz history...</p>
                <p className="text-slate-500 text-sm mt-1">LLaMA 3.3 70B is reasoning over your attempts</p>
              </div>
            </div>
          )}

          {/* Results */}
          {analysis && !analyzing && (
            <div className="space-y-4 py-2">
              {/* Context bar */}
              <div className="flex items-center justify-between bg-slate-800/40 rounded-lg px-4 py-3 border border-slate-700/50">
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Target className="w-4 h-4" />
                  Based on <span className="text-slate-200 font-medium">{attemptCount} quiz attempt{attemptCount !== 1 ? "s" : ""}</span>
                </div>
                <Button
                  onClick={handleReanalyze}
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-violet-400 hover:bg-slate-800/60 h-7 px-2"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  Re-analyze
                </Button>
              </div>

              {/* All good */}
              {isHealthy && (
                <Card className="bg-emerald-500/10 border-emerald-500/20">
                  <CardContent className="p-6 text-center">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                    <h4 className="text-slate-100 font-semibold mb-1">Strong Performance</h4>
                    <p className="text-slate-400 text-sm">
                      No significant weak areas detected across your quiz history. Keep it up.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Weak Topics */}
              {analysis.weakTopics.length > 0 && (
                <Card className="bg-slate-800/40 border-slate-700/50">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                        <TrendingDown className="w-4 h-4 text-orange-400" />
                      </div>
                      <div>
                        <h4 className="text-slate-200 font-medium text-sm">Weak Topics</h4>
                        <p className="text-slate-500 text-xs">Scoring below 70% consistently</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {analysis.weakTopics.map((topic, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="bg-orange-500/10 border-orange-500/20 text-orange-300"
                        >
                          {topic}
                        </Badge>
                      ))}
                    </div>

                    {(onViewFlashcards || onViewQuizzes) && (
                      <div className="space-y-2 pt-1">
                        <p className="text-slate-500 text-xs">Jump to study material:</p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.weakTopics.map((topic, i) => (
                            <React.Fragment key={i}>
                              {onViewFlashcards && (
                                <Button
                                  onClick={() => { onViewFlashcards(topic); handleClose(); }}
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs bg-slate-900/40 border-slate-600/50 text-slate-300 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-300"
                                >
                                  <BookOpen className="w-3 h-3 mr-1" />
                                  {topic} flashcards
                                </Button>
                              )}
                              {onViewQuizzes && (
                                <Button
                                  onClick={() => { onViewQuizzes(topic); handleClose(); }}
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs bg-slate-900/40 border-slate-600/50 text-slate-300 hover:bg-violet-500/10 hover:border-violet-500/30 hover:text-violet-300"
                                >
                                  <FileQuestion className="w-3 h-3 mr-1" />
                                  {topic} quizzes
                                </Button>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Weak Difficulties */}
              {analysis.weakDifficulties.length > 0 && (
                <Card className="bg-slate-800/40 border-slate-700/50">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      </div>
                      <div>
                        <h4 className="text-slate-200 font-medium text-sm">Challenging Difficulty Levels</h4>
                        <p className="text-slate-500 text-xs">These levels are dragging your average down</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {analysis.weakDifficulties.map((d, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="bg-red-500/10 border-red-500/20 text-red-300"
                        >
                          Level {d} — {DIFFICULTY_LABELS[d] ?? "Unknown"}
                        </Badge>
                      ))}
                    </div>

                    {(onViewFlashcards || onViewQuizzes) && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {analysis.weakDifficulties.map((d, i) => (
                          <React.Fragment key={i}>
                            {onViewFlashcards && (
                              <Button
                                onClick={() => { onViewFlashcards(undefined, d); handleClose(); }}
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs bg-slate-900/40 border-slate-600/50 text-slate-300 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-300"
                              >
                                <BookOpen className="w-3 h-3 mr-1" />
                                Level {d} flashcards
                              </Button>
                            )}
                            {onViewQuizzes && (
                              <Button
                                onClick={() => { onViewQuizzes(undefined, d); handleClose(); }}
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs bg-slate-900/40 border-slate-600/50 text-slate-300 hover:bg-violet-500/10 hover:border-violet-500/30 hover:text-violet-300"
                              >
                                <FileQuestion className="w-3 h-3 mr-1" />
                                Level {d} quizzes
                              </Button>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {analysis.recommendations.length > 0 && (
                <Card className="bg-slate-800/40 border-slate-700/50">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                        <Lightbulb className="w-4 h-4 text-violet-400" />
                      </div>
                      <div>
                        <h4 className="text-slate-200 font-medium text-sm">What Veyra Recommends</h4>
                        <p className="text-slate-500 text-xs">Personalized next steps from the AI</p>
                      </div>
                    </div>
                    <ol className="space-y-2">
                      {analysis.recommendations.map((rec, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 bg-slate-900/40 rounded-lg p-3 border border-slate-700/50"
                        >
                          <span className="text-violet-400 font-bold text-sm mt-0.5 flex-shrink-0">
                            {i + 1}.
                          </span>
                          <span className="text-slate-300 text-sm leading-relaxed">{rec}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
