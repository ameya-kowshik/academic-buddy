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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Edit2, Save, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface GeneratedFlashcard {
  title: string;
  question: string;
  answer: string;
  difficulty: number;
}

interface AIFlashcardGeneratorProps {
  documentId: string;
  documentName: string;
  hasExtractedText: boolean;
}

export default function AIFlashcardGenerator({
  documentId,
  documentName,
  hasExtractedText,
}: AIFlashcardGeneratorProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<GeneratedFlashcard[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedFlashcard, setEditedFlashcard] = useState<GeneratedFlashcard | null>(null);

  const handleGenerate = async () => {
    if (!user) {
      setError("You must be logged in to generate flashcards");
      return;
    }

    setGenerating(true);
    setError(null);
    setFlashcards([]);

    try {
      const token = await user.getIdToken();
      
      const response = await fetch("/api/ai/generate-flashcards", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ documentId, count }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate flashcards");
      }

      const data = await response.json();
      setFlashcards(data.flashcards || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setGenerating(false);
    }
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditedFlashcard({ ...flashcards[index] });
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editedFlashcard) {
      const updated = [...flashcards];
      updated[editingIndex] = editedFlashcard;
      setFlashcards(updated);
      setEditingIndex(null);
      setEditedFlashcard(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditedFlashcard(null);
  };

  const handleRemove = (index: number) => {
    setFlashcards(flashcards.filter((_, i) => i !== index));
  };

  const handleSaveAll = async () => {
    if (!user) {
      setError("You must be logged in to save flashcards");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      
      // Save each flashcard
      const promises = flashcards.map((flashcard) =>
        fetch("/api/flashcards", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            ...flashcard,
            sourceMaterialId: documentId,
          }),
        })
      );

      const responses = await Promise.all(promises);
      const failed = responses.filter((r) => !r.ok);

      if (failed.length > 0) {
        throw new Error(`Failed to save ${failed.length} flashcard(s)`);
      }

      // Close dialog and redirect to flashcards page
      setOpen(false);
      router.push("/study/flashcards");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save flashcards");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFlashcards([]);
    setError(null);
    setEditingIndex(null);
    setEditedFlashcard(null);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        disabled={!hasExtractedText}
        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
        size="sm"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Generate Flashcards
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              AI Flashcard Generation
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Generate flashcards from: {documentName}
            </DialogDescription>
          </DialogHeader>

          {flashcards.length === 0 ? (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="count" className="text-slate-200">
                  Number of flashcards (1-50)
                </Label>
                <Input
                  id="count"
                  type="number"
                  min={1}
                  max={50}
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value) || 10)}
                  className="bg-slate-800/40 border-slate-600/50 text-slate-200 mt-2"
                />
              </div>

              {error && (
                <Card className="bg-red-500/10 border-red-500/20">
                  <CardContent className="p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Flashcards
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <p className="text-slate-300 text-sm">
                  Generated {flashcards.length} flashcard(s). Review and edit before saving.
                </p>
              </div>

              {error && (
                <Card className="bg-red-500/10 border-red-500/20">
                  <CardContent className="p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {flashcards.map((flashcard, index) => (
                  <Card
                    key={index}
                    className="bg-slate-800/40 border-slate-600/50"
                  >
                    <CardContent className="p-4">
                      {editingIndex === index && editedFlashcard ? (
                        <div className="space-y-3">
                          <div>
                            <Label className="text-slate-300 text-xs">Title</Label>
                            <Input
                              value={editedFlashcard.title}
                              onChange={(e) =>
                                setEditedFlashcard({
                                  ...editedFlashcard,
                                  title: e.target.value,
                                })
                              }
                              className="bg-slate-900/40 border-slate-600/50 text-slate-200 mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-slate-300 text-xs">Question</Label>
                            <Textarea
                              value={editedFlashcard.question}
                              onChange={(e) =>
                                setEditedFlashcard({
                                  ...editedFlashcard,
                                  question: e.target.value,
                                })
                              }
                              className="bg-slate-900/40 border-slate-600/50 text-slate-200 mt-1"
                              rows={2}
                            />
                          </div>
                          <div>
                            <Label className="text-slate-300 text-xs">Answer</Label>
                            <Textarea
                              value={editedFlashcard.answer}
                              onChange={(e) =>
                                setEditedFlashcard({
                                  ...editedFlashcard,
                                  answer: e.target.value,
                                })
                              }
                              className="bg-slate-900/40 border-slate-600/50 text-slate-200 mt-1"
                              rows={3}
                            />
                          </div>
                          <div>
                            <Label className="text-slate-300 text-xs">Difficulty (1-5)</Label>
                            <Input
                              type="number"
                              min={1}
                              max={5}
                              value={editedFlashcard.difficulty}
                              onChange={(e) =>
                                setEditedFlashcard({
                                  ...editedFlashcard,
                                  difficulty: parseInt(e.target.value) || 1,
                                })
                              }
                              className="bg-slate-900/40 border-slate-600/50 text-slate-200 mt-1"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={handleSaveEdit}
                              size="sm"
                              className="bg-green-600 hover:bg-green-500"
                            >
                              <Save className="w-3 h-3 mr-1" />
                              Save
                            </Button>
                            <Button
                              onClick={handleCancelEdit}
                              size="sm"
                              variant="outline"
                              className="border-slate-600/50 text-slate-300"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-slate-200 font-medium">
                              {flashcard.title}
                            </h4>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Badge
                                variant="outline"
                                className="bg-slate-700/40 border-slate-600/50 text-slate-300 text-xs"
                              >
                                Difficulty: {flashcard.difficulty}
                              </Badge>
                              <Button
                                onClick={() => handleEdit(index)}
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-slate-400 hover:text-cyan-400"
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                onClick={() => handleRemove(index)}
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-slate-400 hover:text-red-400"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-sm">
                            <p className="text-slate-400 mb-1">Q: {flashcard.question}</p>
                            <p className="text-slate-300">A: {flashcard.answer}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            {flashcards.length > 0 && (
              <>
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="border-slate-600/50 text-slate-300"
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveAll}
                  disabled={saving || flashcards.length === 0}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save All ({flashcards.length})
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
