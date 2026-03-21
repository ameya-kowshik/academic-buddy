"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, Loader2, Lightbulb, TrendingDown, BookOpen, FileQuestion } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WeakAreaAnalysis {
  weakTopics: string[];
  weakDifficulties: number[];
  recommendations: string[];
}

interface AIWeakAreaAnalysisProps {
  onViewFlashcards?: (grouping?: string, difficulty?: number) => void;
  onViewQuizzes?: (grouping?: string, difficulty?: number) => void;
}

export default function AIWeakAreaAnalysis({
  onViewFlashcards,
  onViewQuizzes,
}: AIWeakAreaAnalysisProps) {
  const [open, setOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<WeakAreaAnalysis | null>(null);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch("/api/ai/analyze-weak-areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to analyze weak areas");
      }

      const data = await response.json();
      setAnalysis(data.analysis);
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

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        AI Analysis
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              AI Weak Area Analysis
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Get AI-powered insights into your performance and personalized recommendations
            </DialogDescription>
          </DialogHeader>

          {!analysis ? (
            <div className="space-y-4 py-4">
              <Card className="bg-slate-800/40 border-slate-600/50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <Lightbulb className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-slate-300 font-medium mb-2">What to expect</h4>
                      <ul className="space-y-2 text-slate-400 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 mt-1">•</span>
                          <span>
                            AI will analyze your quiz attempt history to identify patterns
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 mt-1">•</span>
                          <span>
                            Discover weak topics and difficulty levels where you need improvement
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 mt-1">•</span>
                          <span>
                            Receive personalized recommendations for focused study
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {error && (
                <Card className="bg-red-500/10 border-red-500/20">
                  <CardContent className="p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze My Performance
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {/* Weak Topics */}
              {analysis.weakTopics.length > 0 && (
                <Card className="bg-slate-800/40 border-slate-600/50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                        <TrendingDown className="w-5 h-5 text-orange-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-slate-200 font-medium mb-2">Weak Topics</h4>
                        <p className="text-slate-400 text-sm mb-3">
                          These topics need more attention based on your quiz performance
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.weakTopics.map((topic, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="bg-orange-500/10 border-orange-500/20 text-orange-300"
                            >
                              {topic}
                            </Badge>
                          ))}
                        </div>
                        {onViewFlashcards && onViewQuizzes && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {analysis.weakTopics.map((topic, index) => (
                              <div key={index} className="flex gap-2">
                                <Button
                                  onClick={() => onViewFlashcards?.(topic)}
                                  size="sm"
                                  variant="outline"
                                  className="bg-slate-900/40 border-slate-600/50 text-slate-200 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-300"
                                >
                                  <BookOpen className="w-3 h-3 mr-1" />
                                  {topic} Flashcards
                                </Button>
                                <Button
                                  onClick={() => onViewQuizzes?.(topic)}
                                  size="sm"
                                  variant="outline"
                                  className="bg-slate-900/40 border-slate-600/50 text-slate-200 hover:bg-purple-500/10 hover:border-purple-500/30 hover:text-purple-300"
                                >
                                  <FileQuestion className="w-3 h-3 mr-1" />
                                  {topic} Quizzes
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Weak Difficulties */}
              {analysis.weakDifficulties.length > 0 && (
                <Card className="bg-slate-800/40 border-slate-600/50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                        <TrendingDown className="w-5 h-5 text-red-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-slate-200 font-medium mb-2">Challenging Difficulty Levels</h4>
                        <p className="text-slate-400 text-sm mb-3">
                          You're struggling with these difficulty levels
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.weakDifficulties.map((difficulty, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="bg-red-500/10 border-red-500/20 text-red-300"
                            >
                              Level {difficulty}: {getDifficultyLabel(difficulty)}
                            </Badge>
                          ))}
                        </div>
                        {onViewFlashcards && onViewQuizzes && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {analysis.weakDifficulties.map((difficulty, index) => (
                              <div key={index} className="flex gap-2">
                                <Button
                                  onClick={() => onViewFlashcards?.(undefined, difficulty)}
                                  size="sm"
                                  variant="outline"
                                  className="bg-slate-900/40 border-slate-600/50 text-slate-200 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-300"
                                >
                                  <BookOpen className="w-3 h-3 mr-1" />
                                  Level {difficulty} Flashcards
                                </Button>
                                <Button
                                  onClick={() => onViewQuizzes?.(undefined, difficulty)}
                                  size="sm"
                                  variant="outline"
                                  className="bg-slate-900/40 border-slate-600/50 text-slate-200 hover:bg-purple-500/10 hover:border-purple-500/30 hover:text-purple-300"
                                >
                                  <FileQuestion className="w-3 h-3 mr-1" />
                                  Level {difficulty} Quizzes
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {analysis.recommendations.length > 0 && (
                <Card className="bg-slate-800/40 border-slate-600/50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
                        <Lightbulb className="w-5 h-5 text-yellow-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-slate-200 font-medium mb-2">AI Recommendations</h4>
                        <p className="text-slate-400 text-sm mb-3">
                          Personalized suggestions to improve your performance
                        </p>
                        <ul className="space-y-2">
                          {analysis.recommendations.map((rec, index) => (
                            <li
                              key={index}
                              className="text-slate-300 text-sm flex items-start gap-2 bg-slate-900/40 rounded-lg p-3 border border-slate-700/50"
                            >
                              <span className="text-cyan-400 mt-1 font-bold">{index + 1}.</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* No weak areas found */}
              {analysis.weakTopics.length === 0 && analysis.weakDifficulties.length === 0 && (
                <Card className="bg-green-500/10 border-green-500/20">
                  <CardContent className="p-6 text-center">
                    <Sparkles className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <h4 className="text-slate-200 font-medium mb-2">Excellent Performance!</h4>
                    <p className="text-slate-400 text-sm">
                      No significant weak areas detected. Keep up the great work!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            {analysis && (
              <Button
                onClick={handleClose}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
