"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  FileQuestion,
  Trash2,
  Edit,
  BarChart3,
  FileText,
  Filter,
  X,
  Trophy,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  grouping: string | null;
  difficulty: number;
  createdAt: Date;
  updatedAt: Date;
  sourceMaterialId: string | null;
  sourceMaterial?: {
    id: string;
    fileName: string;
  } | null;
  _count?: {
    questions: number;
    attempts: number;
  };
  attempts?: Array<{
    score: number;
  }>;
}

interface QuizListProps {
  quizzes: Quiz[];
  onEdit?: (quiz: Quiz) => void;
  onDelete?: (quizId: string) => void;
  onTakeQuiz?: (quizId: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function QuizList({
  quizzes,
  onEdit,
  onDelete,
  onTakeQuiz,
  onRefresh,
  isLoading = false,
}: QuizListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filterGrouping, setFilterGrouping] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<number | "">("");
  const [filterSourceDocument, setFilterSourceDocument] = useState("");

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

  const getBestScore = (quiz: Quiz): number | null => {
    if (!quiz.attempts || quiz.attempts.length === 0) return null;
    return Math.max(...quiz.attempts.map((a) => a.score));
  };

  const handleDeleteClick = (quizId: string) => {
    setQuizToDelete(quizId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!quizToDelete || !onDelete) return;

    setDeletingId(quizToDelete);
    try {
      await onDelete(quizToDelete);
      setDeleteDialogOpen(false);
      setQuizToDelete(null);
      onRefresh?.();
    } catch (error) {
      console.error("Error deleting quiz:", error);
    } finally {
      setDeletingId(null);
    }
  };

  // Get unique values for filters
  const uniqueGroupings = Array.from(
    new Set(quizzes.map((q) => q.grouping).filter(Boolean))
  ) as string[];
  
  const uniqueDocuments = Array.from(
    new Set(
      quizzes
        .filter((q) => q.sourceMaterial)
        .map((q) => JSON.stringify({ id: q.sourceMaterial!.id, name: q.sourceMaterial!.fileName }))
    )
  ).map((str) => JSON.parse(str));

  // Apply filters
  const filteredQuizzes = quizzes.filter((quiz) => {
    if (filterGrouping && quiz.grouping !== filterGrouping) return false;
    if (filterDifficulty !== "" && quiz.difficulty !== filterDifficulty) return false;
    if (filterSourceDocument && quiz.sourceMaterialId !== filterSourceDocument) return false;
    return true;
  });

  const hasActiveFilters = filterGrouping || filterDifficulty !== "" || filterSourceDocument;

  const clearFilters = () => {
    setFilterGrouping("");
    setFilterDifficulty("");
    setFilterSourceDocument("");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-slate-900/50 border-slate-700/50" data-testid="loading-card">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-5 bg-slate-700/50 rounded w-3/4"></div>
                <div className="h-4 bg-slate-700/50 rounded w-1/2"></div>
                <div className="h-4 bg-slate-700/50 rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardContent className="p-12 text-center">
          <FileQuestion className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-slate-300 font-medium text-lg mb-2">
            No quizzes yet
          </h3>
          <p className="text-slate-500 text-sm">
            Create your first quiz to start testing your knowledge
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Filter Section */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-slate-800/60 hover:text-slate-100 mb-4"
        >
          <Filter className="w-4 h-4 mr-2" />
          {showFilters ? "Hide Filters" : "Show Filters"}
          {hasActiveFilters && (
            <Badge className="ml-2 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
              {[filterGrouping, filterDifficulty, filterSourceDocument].filter(Boolean).length}
            </Badge>
          )}
        </Button>

        {showFilters && (
          <Card className="bg-slate-900/50 border-slate-700/50 mb-4">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-4">
                {/* Grouping Filter */}
                <div className="space-y-2">
                  <Label htmlFor="filter-grouping" className="text-slate-300">Grouping</Label>
                  <select
                    id="filter-grouping"
                    value={filterGrouping}
                    onChange={(e) => setFilterGrouping(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-md text-white focus:border-cyan-500 focus:ring-cyan-500/20 focus:outline-none"
                  >
                    <option value="">All Groupings</option>
                    {uniqueGroupings.map((grouping) => (
                      <option key={grouping} value={grouping}>
                        {grouping}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Difficulty Filter */}
                <div className="space-y-2">
                  <Label htmlFor="filter-difficulty" className="text-slate-300">Difficulty</Label>
                  <select
                    id="filter-difficulty"
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value ? parseInt(e.target.value) : "")}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-md text-white focus:border-cyan-500 focus:ring-cyan-500/20 focus:outline-none"
                  >
                    <option value="">All Difficulties</option>
                    <option value={1}>1 - Very Easy</option>
                    <option value={2}>2 - Easy</option>
                    <option value={3}>3 - Medium</option>
                    <option value={4}>4 - Hard</option>
                    <option value={5}>5 - Very Hard</option>
                  </select>
                </div>

                {/* Source Document Filter */}
                <div className="space-y-2">
                  <Label htmlFor="filter-source-document" className="text-slate-300">Source Document</Label>
                  <select
                    id="filter-source-document"
                    value={filterSourceDocument}
                    onChange={(e) => setFilterSourceDocument(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-md text-white focus:border-cyan-500 focus:ring-cyan-500/20 focus:outline-none"
                  >
                    <option value="">All Documents</option>
                    {uniqueDocuments.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results Count */}
        <div className="text-slate-400 text-sm mb-4">
          Showing {filteredQuizzes.length} of {quizzes.length} quiz{quizzes.length !== 1 ? "zes" : ""}
        </div>
      </div>

      {/* Quiz List */}
      <div className="space-y-4">
        {filteredQuizzes.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-12 text-center">
              <Filter className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-slate-300 font-medium text-lg mb-2">
                No quizzes match your filters
              </h3>
              <p className="text-slate-500 text-sm mb-4">
                Try adjusting your filter criteria
              </p>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-slate-800/60"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredQuizzes.map((quiz) => {
            const difficultyColor = getDifficultyColor(quiz.difficulty);
            const bestScore = getBestScore(quiz);
            const attemptCount = quiz._count?.attempts || quiz.attempts?.length || 0;
            const questionCount = quiz._count?.questions || 0;

            return (
              <Card
                key={quiz.id}
                className="bg-slate-900/50 border-slate-700/50 hover:border-slate-600/50 transition-all duration-200"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <FileQuestion className="w-6 h-6 text-purple-400" />
                      </div>
                    </div>

                    {/* Quiz Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="text-slate-200 font-medium text-lg">
                            {quiz.title}
                          </h3>
                          {quiz.description && (
                            <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                              {quiz.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {onTakeQuiz && (
                            <Button
                              size="sm"
                              onClick={() => onTakeQuiz(quiz.id)}
                              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
                            >
                              Take Quiz
                            </Button>
                          )}
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(quiz)}
                              className="text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(quiz.id)}
                              disabled={deletingId === quiz.id}
                              className="text-slate-400 hover:text-red-400 hover:bg-slate-800/60"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Metadata Row */}
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        {/* Difficulty Badge */}
                        <div
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium",
                            difficultyColor.bg,
                            difficultyColor.border,
                            difficultyColor.text
                          )}
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          {getDifficultyLabel(quiz.difficulty)}
                        </div>

                        {/* Question Count Badge */}
                        <Badge
                          variant="outline"
                          className="bg-slate-800/40 border-slate-600/50 text-slate-300 text-xs"
                        >
                          {questionCount} {questionCount === 1 ? "question" : "questions"}
                        </Badge>

                        {/* Grouping Badge */}
                        {quiz.grouping && (
                          <Badge
                            variant="outline"
                            className="bg-slate-800/40 border-slate-600/50 text-slate-300 text-xs"
                          >
                            {quiz.grouping}
                          </Badge>
                        )}

                        {/* Source Document Badge */}
                        {quiz.sourceMaterial && (
                          <Badge
                            variant="outline"
                            className="bg-slate-800/40 border-slate-600/50 text-slate-300 text-xs flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            {quiz.sourceMaterial.fileName}
                          </Badge>
                        )}
                      </div>

                      {/* Stats Row */}
                      <div className="flex items-center gap-4 text-sm">
                        {/* Attempt Count */}
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Clock className="w-4 h-4" />
                          <span>
                            {attemptCount} {attemptCount === 1 ? "attempt" : "attempts"}
                          </span>
                        </div>

                        {/* Best Score */}
                        {bestScore !== null && (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Trophy className="w-4 h-4 text-yellow-400" />
                            <span>
                              Best: <span className="text-yellow-400 font-medium">{bestScore}%</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100">Delete Quiz</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete this quiz? This action cannot be undone.
              All questions and attempt history will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deletingId !== null}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletingId ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
