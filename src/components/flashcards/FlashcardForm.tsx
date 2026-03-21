"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, AlertCircle } from "lucide-react";

interface FlashcardFormProps {
  onSubmit: (flashcardData: FlashcardFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<FlashcardFormData>;
  isEditing?: boolean;
  loading?: boolean;
  userId: string;
}

export interface FlashcardFormData {
  title: string;
  question: string;
  answer: string;
  difficulty: number;
  grouping?: string;
  sourceMaterialId?: string;
  tags?: string[];
}

interface Document {
  id: string;
  fileName: string;
}

export default function FlashcardForm({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
  loading = false,
  userId,
}: FlashcardFormProps) {
  const [formData, setFormData] = useState<FlashcardFormData>({
    title: initialData?.title || "",
    question: initialData?.question || "",
    answer: initialData?.answer || "",
    difficulty: initialData?.difficulty || 3,
    grouping: initialData?.grouping || "",
    sourceMaterialId: initialData?.sourceMaterialId || "",
    tags: initialData?.tags || [],
  });

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [error, setError] = useState("");

  // Fetch documents for linking
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!userId) return;

      setLoadingDocuments(true);
      try {
        const response = await fetch("/api/documents");
        if (!response.ok) {
          throw new Error("Failed to fetch documents");
        }
        const data = await response.json();
        setDocuments(data.documents || []);
      } catch (err) {
        console.error("Error fetching documents:", err);
      } finally {
        setLoadingDocuments(false);
      }
    };

    fetchDocuments();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!formData.question.trim()) {
      setError("Question is required");
      return;
    }
    if (!formData.answer.trim()) {
      setError("Answer is required");
      return;
    }
    if (formData.difficulty < 1 || formData.difficulty > 5) {
      setError("Difficulty must be between 1 and 5");
      return;
    }

    try {
      const submitData = {
        ...formData,
        title: formData.title.trim(),
        question: formData.question.trim(),
        answer: formData.answer.trim(),
        grouping: formData.grouping?.trim() || undefined,
        sourceMaterialId: formData.sourceMaterialId || undefined,
      };

      await onSubmit(submitData);

      // Reset form if creating new flashcard
      if (!isEditing) {
        setFormData({
          title: "",
          question: "",
          answer: "",
          difficulty: 3,
          grouping: "",
          sourceMaterialId: "",
          tags: [],
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save flashcard");
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-slate-100 flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          {isEditing ? "Edit Flashcard" : "Create New Flashcard"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-slate-300">
              Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter flashcard title..."
              disabled={loading}
              className="bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
            />
          </div>

          {/* Question */}
          <div className="space-y-2">
            <Label htmlFor="question" className="text-slate-300">
              Question *
            </Label>
            <Textarea
              id="question"
              value={formData.question}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, question: e.target.value }))
              }
              placeholder="Enter the question..."
              disabled={loading}
              rows={3}
              className="bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 resize-none"
            />
          </div>

          {/* Answer */}
          <div className="space-y-2">
            <Label htmlFor="answer" className="text-slate-300">
              Answer *
            </Label>
            <Textarea
              id="answer"
              value={formData.answer}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, answer: e.target.value }))
              }
              placeholder="Enter the answer..."
              disabled={loading}
              rows={3}
              className="bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 resize-none"
            />
          </div>

          {/* Difficulty and Grouping */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="difficulty" className="text-slate-300">
                Difficulty (1-5) *
              </Label>
              <select
                id="difficulty"
                value={formData.difficulty}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    difficulty: parseInt(e.target.value),
                  }))
                }
                disabled={loading}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-md text-white focus:border-cyan-500 focus:ring-cyan-500/20 focus:outline-none"
              >
                <option value={1}>1 - Very Easy</option>
                <option value={2}>2 - Easy</option>
                <option value={3}>3 - Medium</option>
                <option value={4}>4 - Hard</option>
                <option value={5}>5 - Very Hard</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grouping" className="text-slate-300">
                Grouping
              </Label>
              <Input
                id="grouping"
                value={formData.grouping}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, grouping: e.target.value }))
                }
                placeholder="e.g., Chapter 1, Biology"
                disabled={loading}
                className="bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
              />
            </div>
          </div>

          {/* Document Linking */}
          <div className="space-y-2">
            <Label htmlFor="sourceMaterial" className="text-slate-300">
              Link to Document
            </Label>
            <select
              id="sourceMaterial"
              value={formData.sourceMaterialId}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  sourceMaterialId: e.target.value,
                }))
              }
              disabled={loading || loadingDocuments}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-md text-white focus:border-cyan-500 focus:ring-cyan-500/20 focus:outline-none"
            >
              <option value="">No Document</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.fileName}
                </option>
              ))}
            </select>
            {loadingDocuments && (
              <p className="text-slate-500 text-sm">Loading documents...</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={
                loading ||
                !formData.title.trim() ||
                !formData.question.trim() ||
                !formData.answer.trim()
              }
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : isEditing
                ? "Update Flashcard"
                : "Create Flashcard"}
            </Button>
            {onCancel && (
              <Button
                type="button"
                onClick={onCancel}
                disabled={loading}
                variant="outline"
                className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-500/20 hover:text-cyan-300 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-md hover:shadow-cyan-500/20"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
