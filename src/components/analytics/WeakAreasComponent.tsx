"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Brain, Sparkles, Loader2, Target, RefreshCw,
  AlertTriangle, ChevronDown, ChevronUp, Clock, CheckCircle2, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

interface QuizAttemptSummary {
  id: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  completedAt: string | null;
  startedAt: string;
  quiz: { id: string; title: string; difficulty: number };
}

interface AttemptAnalysis {
  weakTopics: string[];
  recommendations: string[];
}

interface WeakAreasComponentProps {
  userId: string;
  onViewFlashcards?: (grouping?: string, difficulty?: number) => void;
  onViewQuizzes?: (grouping?: string, difficulty?: number) => void;
  isLoading?: boolean;
}

export default function WeakAreasComponent({ isLoading: externalLoading = false }: WeakAreasComponentProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [attempts, setAttempts] = useState<QuizAttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<Record<string, AttemptAnalysis | null>>({});
  const [analysisErrors, setAnalysisErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) fetchAttempts();
  }, [user]);

  const fetchAttempts = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const quizzesRes = await fetch("/api/quizzes", { headers: { Authorization: `Bearer ${token}` } });
      if (!quizzesRes.ok) throw new Error("Failed to fetch quizzes");
      const { quizzes } = await quizzesRes.json();
      const allAttempts: QuizAttemptSummary[] = [];
      await Promise.all(
        (quizzes || []).map(async (quiz: { id: string; title: string; difficulty: number }) => {
          const attRes = await fetch(`/api/quizzes/${quiz.id}/attempts`, { headers: { Authorization: `Bearer ${token}` } });
          if (!attRes.ok) return;
          const data = await attRes.json();
          (Array.isArray(data) ? data : [])
            .filter((a: QuizAttemptSummary) => a.completedAt !== null)
            .forEach((a: QuizAttemptSummary) => allAttempts.push({ ...a, quiz }));
        })
      );
      allAttempts.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
      setAttempts(allAttempts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load attempts");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (attemptId: string) => {
    if (!user) return;
    setAnalyzingId(attemptId);
    setAnalysisErrors((prev) => ({ ...prev, [attemptId]: "" }));
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/ai/analyze-weak-areas", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ attemptId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setAnalyses((prev) => ({ ...prev, [attemptId]: data.analysis }));
      setExpandedAttempt(attemptId);
    } catch (err) {
      setAnalysisErrors((prev) => ({ ...prev, [attemptId]: err instanceof Error ? err.message : "Analysis failed" }));
    } finally {
      setAnalyzingId(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const scoreBadge = (score: number) => {
    if (score >= 80) return "bg-green-500/10 border-green-500/20 text-green-400";
    if (score >= 60) return "bg-blue-500/10 border-blue-500/20 text-blue-400";
    if (score >= 40) return "bg-yellow-500/10 border-yellow-500/20 text-yellow-400";
    return "bg-red-500/10 border-red-500/20 text-red-400";
  };

  if (loading || externalLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-slate-700/50 rounded-lg" />)}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardContent className="p-10 text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <Button onClick={fetchAttempts} variant="outline" className="bg-slate-800/40 border-slate-600/50 text-slate-200">
            <RefreshCw className="w-4 h-4 mr-2" />Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (attempts.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardContent className="p-10 text-center">
          <Target className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-medium mb-1">No quiz attempts yet</p>
          <p className="text-slate-500 text-sm">Complete some quizzes to see your weak area analysis here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-slate-400 text-sm">{attempts.length} completed attempt{attempts.length !== 1 ? "s" : ""}</p>
        <Button onClick={fetchAttempts} variant="ghost" size="sm" className="text-slate-400 hover:text-cyan-400 h-7 w-7 p-0">
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>
      {attempts.map((attempt) => {
        const isExpanded = expandedAttempt === attempt.id;
        const analysis = analyses[attempt.id];
        const analysisError = analysisErrors[attempt.id];
        const isAnalyzing = analyzingId === attempt.id;
        const wrongCount = attempt.totalQuestions - attempt.correctAnswers;
        return (
          <Card key={attempt.id} className="bg-slate-900/50 border-slate-700/50 hover:border-slate-600/50 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn("px-3 py-1.5 rounded-lg border text-sm font-bold flex-shrink-0", scoreBadge(attempt.score))}>
                    {Math.round(attempt.score)}%
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-200 font-medium text-sm truncate">{attempt.quiz.title}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-400" />{attempt.correctAnswers} correct</span>
                      <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-red-400" />{wrongCount} wrong</span>
                      {attempt.completedAt && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(attempt.completedAt)}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => router.push(`/study/quizzes/${attempt.quiz.id}/results/${attempt.id}`)} className="text-slate-400 hover:text-cyan-400 text-xs h-7 px-2">Results</Button>
                  {wrongCount > 0 && (
                    <Button size="sm" onClick={() => handleAnalyze(attempt.id)} disabled={isAnalyzing} className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white h-7 px-3 text-xs">
                      {isAnalyzing ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Analyzing</> : analysis ? <><RefreshCw className="w-3 h-3 mr-1" />Re-analyze</> : <><Sparkles className="w-3 h-3 mr-1" />Analyze</>}
                    </Button>
                  )}
                  {analysis && (
                    <Button size="sm" variant="ghost" onClick={() => setExpandedAttempt(isExpanded ? null : attempt.id)} className="text-slate-400 hover:text-slate-200 h-7 w-7 p-0">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
              </div>
              {analysisError && <p className="text-red-400 text-xs mt-3">{analysisError}</p>}
              {analysis && isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-3">
                  <div className="flex items-center gap-2"><Brain className="w-4 h-4 text-violet-400" /><span className="text-slate-300 text-sm font-medium">AI Topic Analysis</span></div>
                  {analysis.weakTopics.length > 0 ? (
                    <>
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Topics to review</p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.weakTopics.map((topic, i) => <span key={i} className="px-2.5 py-1 bg-orange-500/15 border border-orange-500/30 text-orange-300 rounded-full text-xs">{topic}</span>)}
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Recommendations</p>
                        <ol className="space-y-1.5">
                          {analysis.recommendations.map((rec, i) => <li key={i} className="flex items-start gap-2 text-xs text-slate-300"><span className="text-violet-400 font-bold flex-shrink-0">{i + 1}.</span>{rec}</li>)}
                        </ol>
                      </div>
                    </>
                  ) : (
                    <p className="text-emerald-400 text-sm">{analysis.recommendations[0] || "No specific weak topics identified."}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
