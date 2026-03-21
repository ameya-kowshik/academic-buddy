"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  RotateCw,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  sourceMaterial?: {
    id: string;
    fileName: string;
  } | null;
}

interface FlashcardReviewProps {
  flashcards: Flashcard[];
  onReview?: (flashcardId: string) => Promise<void>;
  onExit?: () => void;
}

export default function FlashcardReview({
  flashcards,
  onReview,
  onExit,
}: FlashcardReviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const currentCard = flashcards[currentIndex];
  const hasNext = currentIndex < flashcards.length - 1;
  const hasPrevious = currentIndex > 0;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent keyboard navigation when typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case " ": // Space to flip
        case "Enter":
          e.preventDefault();
          setIsFlipped((prev) => !prev);
          break;
        case "ArrowLeft": // Previous card
          e.preventDefault();
          handlePrevious();
          break;
        case "ArrowRight": // Next card
          e.preventDefault();
          handleNext();
          break;
        case "r": // Mark as reviewed
        case "R":
          e.preventDefault();
          if (isFlipped) {
            handleReview();
          }
          break;
        case "Escape": // Exit review mode
          e.preventDefault();
          onExit?.();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentIndex, isFlipped, flashcards.length]);

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleNext = () => {
    if (hasNext) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (hasPrevious) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleReview = async () => {
    if (!onReview || !currentCard) return;

    setReviewing(true);
    try {
      await onReview(currentCard.id);
      // Auto-advance to next card after review
      if (hasNext) {
        setTimeout(() => {
          handleNext();
        }, 300);
      }
    } catch (error) {
      console.error("Error recording review:", error);
    } finally {
      setReviewing(false);
    }
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

  if (!currentCard) {
    return (
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardContent className="p-12 text-center">
          <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-slate-300 font-medium text-lg mb-2">
            No flashcards to review
          </h3>
          <p className="text-slate-500 text-sm mb-6">
            Add some flashcards to start reviewing
          </p>
          {onExit && (
            <Button
              onClick={onExit}
              variant="outline"
              className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-slate-800/60"
            >
              Back to List
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const difficultyColor = getDifficultyColor(currentCard.difficulty);

  return (
    <div className="space-y-6">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-sm px-3 py-1">
            Card {currentIndex + 1} of {flashcards.length}
          </Badge>
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium",
              difficultyColor.bg,
              difficultyColor.border,
              difficultyColor.text
            )}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            {getDifficultyLabel(currentCard.difficulty)}
          </div>
        </div>
        {onExit && (
          <Button
            onClick={onExit}
            variant="outline"
            size="sm"
            className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-slate-800/60"
          >
            Exit Review
          </Button>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-slate-800/50 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-600 to-blue-600 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
        />
      </div>

      {/* Flashcard with flip animation */}
      <div className="perspective-1000">
        <div
          className={cn(
            "relative w-full min-h-[400px] transition-transform duration-500 transform-style-3d cursor-pointer",
            isFlipped && "rotate-y-180"
          )}
          onClick={handleFlip}
        >
          {/* Front of card (Question) */}
          <Card
            className={cn(
              "absolute inset-0 backface-hidden bg-slate-900/50 border-slate-700/50",
              "hover:border-cyan-500/30 transition-colors duration-200"
            )}
          >
            <CardContent className="p-8 flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6">
                <BookOpen className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-slate-200 font-semibold text-xl mb-4 text-center">
                {currentCard.title}
              </h3>
              <p className="text-slate-300 text-lg text-center leading-relaxed max-w-2xl">
                {currentCard.question}
              </p>
              <div className="mt-8 flex items-center gap-2 text-slate-400 text-sm">
                <RotateCw className="w-4 h-4" />
                <span>Click or press Space/Enter to flip</span>
              </div>
            </CardContent>
          </Card>

          {/* Back of card (Answer) */}
          <Card
            className={cn(
              "absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-cyan-700/50",
              "hover:border-cyan-500/50 transition-colors duration-200"
            )}
          >
            <CardContent className="p-8 flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center mb-6">
                <CheckCircle className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-cyan-300 font-semibold text-xl mb-4 text-center">
                Answer
              </h3>
              <p className="text-slate-200 text-lg text-center leading-relaxed max-w-2xl">
                {currentCard.answer}
              </p>
              <div className="mt-8 flex items-center gap-2 text-slate-400 text-sm">
                <RotateCw className="w-4 h-4" />
                <span>Click or press Space/Enter to flip back</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Card metadata */}
      <div className="flex flex-wrap items-center gap-3 justify-center">
        {currentCard.grouping && (
          <Badge
            variant="outline"
            className="bg-slate-800/40 border-slate-600/50 text-slate-300 text-sm"
          >
            {currentCard.grouping}
          </Badge>
        )}
        {currentCard.sourceMaterial && (
          <Badge
            variant="outline"
            className="bg-slate-800/40 border-slate-600/50 text-slate-300 text-sm flex items-center gap-1"
          >
            <FileText className="w-3 h-3" />
            {currentCard.sourceMaterial.fileName}
          </Badge>
        )}
        {currentCard.tags && currentCard.tags.length > 0 && (
          <>
            {currentCard.tags.map((tag, index) => (
              <Badge
                key={index}
                variant="outline"
                className="bg-slate-800/40 border-slate-600/50 text-slate-300 text-sm"
              >
                {tag}
              </Badge>
            ))}
          </>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-4">
        <Button
          onClick={handlePrevious}
          disabled={!hasPrevious}
          variant="outline"
          className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-slate-800/60 disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {isFlipped && onReview && (
          <Button
            onClick={handleReview}
            disabled={reviewing}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-medium transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/25"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {reviewing ? "Recording..." : "Mark as Reviewed (R)"}
          </Button>
        )}

        <Button
          onClick={handleNext}
          disabled={!hasNext}
          variant="outline"
          className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-slate-800/60 disabled:opacity-50"
        >
          Next
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Keyboard shortcuts help */}
      <Card className="bg-slate-900/30 border-slate-700/30">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-slate-800/50 border border-slate-700/50 rounded text-xs">
                Space
              </kbd>
              <span>Flip card</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-slate-800/50 border border-slate-700/50 rounded text-xs">
                ←
              </kbd>
              <span>Previous</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-slate-800/50 border border-slate-700/50 rounded text-xs">
                →
              </kbd>
              <span>Next</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-slate-800/50 border border-slate-700/50 rounded text-xs">
                R
              </kbd>
              <span>Review</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-slate-800/50 border border-slate-700/50 rounded text-xs">
                Esc
              </kbd>
              <span>Exit</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
