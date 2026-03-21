"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BookOpen,
  Trash2,
  Edit,
  Clock,
  BarChart3,
  FileText,
  Filter,
  X,
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

interface Flashcard {
  id: string;
  title: string;
  question: string;
  answer: string;
  grouping: string | null;
  difficulty: number;
  tags: string[];
  reviewCount: number;
  lastReviewed: Date | null;
  createdAt: Date;
  updatedAt: Date;
  sourceMaterialId: string | null;
  sourceMaterial?: {
    id: string;
    fileName: string;
  } | null;
}

interface FlashcardListProps {
  flashcards: Flashcard[];
  onEdit?: (flashcard: Flashcard) => void;
  onDelete?: (flashcardId: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function FlashcardList({
  flashcards,
  onEdit,
  onDelete,
  onRefresh,
  isLoading = false,
}: FlashcardListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [flashcardToDelete, setFlashcardToDelete] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filterGrouping, setFilterGrouping] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<number | "">("");
  const [filterSourceDocument, setFilterSourceDocument] = useState("");

  const formatDate = (date: Date | null): string => {
    if (!date) return "Never";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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

  const handleDeleteClick = (flashcardId: string) => {
    setFlashcardToDelete(flashcardId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!flashcardToDelete || !onDelete) return;

    setDeletingId(flashcardToDelete);
    try {
      await onDelete(flashcardToDelete);
      setDeleteDialogOpen(false);
      setFlashcardToDelete(null);
      onRefresh?.();
    } catch (error) {
      console.error("Error deleting flashcard:", error);
    } finally {
      setDeletingId(null);
    }
  };

  // Get unique values for filters
  const uniqueGroupings = Array.from(
    new Set(flashcards.map((f) => f.grouping).filter(Boolean))
  ) as string[];
  
  const uniqueDocuments = Array.from(
    new Set(
      flashcards
        .filter((f) => f.sourceMaterial)
        .map((f) => JSON.stringify({ id: f.sourceMaterial!.id, name: f.sourceMaterial!.fileName }))
    )
  ).map((str) => JSON.parse(str));

  // Apply filters
  const filteredFlashcards = flashcards.filter((flashcard) => {
    if (filterGrouping && flashcard.grouping !== filterGrouping) return false;
    if (filterDifficulty !== "" && flashcard.difficulty !== filterDifficulty) return false;
    if (filterSourceDocument && flashcard.sourceMaterialId !== filterSourceDocument) return false;
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

  if (flashcards.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardContent className="p-12 text-center">
          <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-slate-300 font-medium text-lg mb-2">
            No flashcards yet
          </h3>
          <p className="text-slate-500 text-sm">
            Create your first flashcard to start studying
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
          Showing {filteredFlashcards.length} of {flashcards.length} flashcard{flashcards.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Flashcard List */}
      <div className="space-y-4">
        {filteredFlashcards.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-12 text-center">
              <Filter className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-slate-300 font-medium text-lg mb-2">
                No flashcards match your filters
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
          filteredFlashcards.map((flashcard) => {
            const difficultyColor = getDifficultyColor(flashcard.difficulty);

            return (
              <Card
                key={flashcard.id}
                className="bg-slate-900/50 border-slate-700/50 hover:border-slate-600/50 transition-all duration-200"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-cyan-400" />
                      </div>
                    </div>

                    {/* Flashcard Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="text-slate-200 font-medium text-lg">
                          {flashcard.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(flashcard)}
                              className="text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(flashcard.id)}
                              disabled={deletingId === flashcard.id}
                              className="text-slate-400 hover:text-red-400 hover:bg-slate-800/60"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Question Preview */}
                      <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                        {flashcard.question}
                      </p>

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
                          {getDifficultyLabel(flashcard.difficulty)}
                        </div>

                        {/* Grouping Badge */}
                        {flashcard.grouping && (
                          <Badge
                            variant="outline"
                            className="bg-slate-800/40 border-slate-600/50 text-slate-300 text-xs"
                          >
                            {flashcard.grouping}
                          </Badge>
                        )}

                        {/* Source Document Badge */}
                        {flashcard.sourceMaterial && (
                          <Badge
                            variant="outline"
                            className="bg-slate-800/40 border-slate-600/50 text-slate-300 text-xs flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            {flashcard.sourceMaterial.fileName}
                          </Badge>
                        )}
                      </div>

                      {/* Review Stats */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <BarChart3 className="w-4 h-4" />
                          <span>
                            Reviewed {flashcard.reviewCount} time{flashcard.reviewCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <span className="text-slate-600">•</span>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>Last reviewed: {formatDate(flashcard.lastReviewed)}</span>
                        </div>
                      </div>

                      {/* Tags */}
                      {flashcard.tags && flashcard.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {flashcard.tags.map((tag, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="bg-slate-800/40 border-slate-600/50 text-slate-300 text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
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
            <AlertDialogTitle className="text-slate-100">
              Delete Flashcard
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete this flashcard? This action cannot
              be undone. Your review history for this flashcard will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-slate-800/60 hover:text-slate-100">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deletingId !== null}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white"
            >
              {deletingId ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
