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
import { Sparkles, Loader2, Edit2, Save, X, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface GeneratedQuestion {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  order: number;
}

interface GeneratedQuiz {
  title: string;
  description: string;
  difficulty: number;
  questions: GeneratedQuestion[];
}

interface AIQuizGeneratorProps {
  documentId: string;
  documentName: string;
  hasExtractedText: boolean;
}

export default function AIQuizGenerator({
  documentId,
  documentName,
  hasExtractedText,
}: AIQuizGeneratorProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [questionCount, setQuestionCount] = useState(10);
  const [userPrompt, setUserPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [editedQuestion, setEditedQuestion] = useState<GeneratedQuestion | null>(null);
  const [editingMetadata, setEditingMetadata] = useState(false);

  const handleGenerate = async () => {
    if (!user) {
      setError("You must be logged in to generate quizzes");
      return;
    }

    setGenerating(true);
    setError(null);
    setQuiz(null);

    try {
      const token = await user.getIdToken();
      
      const response = await fetch("/api/ai/generate-quiz", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ documentId, questionCount, userPrompt: userPrompt.trim() || undefined }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate quiz");
      }

      const data = await response.json();
      setQuiz(data.quiz);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setGenerating(false);
    }
  };

  const handleEditQuestion = (index: number) => {
    if (quiz) {
      setEditingQuestionIndex(index);
      setEditedQuestion({ ...quiz.questions[index] });
    }
  };

  const handleSaveQuestion = () => {
    if (editingQuestionIndex !== null && editedQuestion && quiz) {
      const updated = { ...quiz };
      updated.questions[editingQuestionIndex] = editedQuestion;
      setQuiz(updated);
      setEditingQuestionIndex(null);
      setEditedQuestion(null);
    }
  };

  const handleCancelEditQuestion = () => {
    setEditingQuestionIndex(null);
    setEditedQuestion(null);
  };

  const handleRemoveQuestion = (index: number) => {
    if (quiz) {
      const updated = { ...quiz };
      updated.questions = quiz.questions
        .filter((_, i) => i !== index)
        .map((q, i) => ({ ...q, order: i + 1 }));
      setQuiz(updated);
    }
  };

  const handleUpdateOption = (optionIndex: number, value: string) => {
    if (editedQuestion) {
      const newOptions = [...editedQuestion.options];
      newOptions[optionIndex] = value;
      setEditedQuestion({ ...editedQuestion, options: newOptions });
    }
  };

  const handleAddOption = () => {
    if (editedQuestion) {
      setEditedQuestion({
        ...editedQuestion,
        options: [...editedQuestion.options, ""],
      });
    }
  };

  const handleRemoveOption = (optionIndex: number) => {
    if (editedQuestion && editedQuestion.options.length > 2) {
      const newOptions = editedQuestion.options.filter((_, i) => i !== optionIndex);
      setEditedQuestion({ ...editedQuestion, options: newOptions });
    }
  };

  const handleSaveAll = async () => {
    if (!quiz || !user) {
      if (!user) setError("You must be logged in to save quizzes");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      
      // Create the quiz
      const quizResponse = await fetch("/api/quizzes", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: quiz.title,
          description: quiz.description,
          difficulty: quiz.difficulty,
          grouping: quiz.title,
          sourceMaterialId: documentId,
        }),
      });

      if (!quizResponse.ok) {
        throw new Error("Failed to create quiz");
      }

      const createdQuiz = await quizResponse.json();

      // Add questions to the quiz
      const questionPromises = quiz.questions.map((question) =>
        fetch(`/api/quizzes/${createdQuiz.id}/questions`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(question),
        })
      );

      const questionResponses = await Promise.all(questionPromises);
      const failed = questionResponses.filter((r) => !r.ok);

      if (failed.length > 0) {
        throw new Error(`Failed to save ${failed.length} question(s)`);
      }

      // Close dialog and redirect to quizzes page
      setOpen(false);
      router.push("/study/quizzes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save quiz");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setQuiz(null);
    setError(null);
    setUserPrompt("");
    setEditingQuestionIndex(null);
    setEditedQuestion(null);
    setEditingMetadata(false);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        disabled={!hasExtractedText}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white"
        size="sm"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Generate Quiz
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              AI Quiz Generation
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Generate a quiz from: {documentName}
            </DialogDescription>
          </DialogHeader>

          {!quiz ? (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="questionCount" className="text-slate-200">
                  Number of questions (1-50)
                </Label>
                <Input
                  id="questionCount"
                  type="number"
                  min={1}
                  max={50}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value) || 10)}
                  className="bg-slate-800/40 border-slate-600/50 text-slate-200 mt-2"
                />
              </div>

              <div>
                <Label htmlFor="userPrompt" className="text-slate-200">
                  Custom instructions (optional)
                </Label>
                <Textarea
                  id="userPrompt"
                  placeholder="e.g. Focus on definitions and key concepts. Make questions application-based. Avoid trivial facts. Include scenario-based questions."
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  className="bg-slate-800/40 border-slate-600/50 text-slate-200 mt-2 resize-none"
                  rows={3}
                />
                <p className="text-slate-500 text-xs mt-1">
                  Tell the AI how you want the questions structured, what to focus on, or what style to use.
                </p>
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
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Quiz
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {/* Quiz Metadata */}
              <Card className="bg-slate-800/40 border-slate-600/50">
                <CardContent className="p-4">
                  {editingMetadata ? (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-slate-300 text-xs">Title</Label>
                        <Input
                          value={quiz.title}
                          onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                          className="bg-slate-900/40 border-slate-600/50 text-slate-200 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300 text-xs">Description</Label>
                        <Textarea
                          value={quiz.description}
                          onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
                          className="bg-slate-900/40 border-slate-600/50 text-slate-200 mt-1"
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300 text-xs">Difficulty (1-5)</Label>
                        <Input
                          type="number"
                          min={1}
                          max={5}
                          value={quiz.difficulty}
                          onChange={(e) =>
                            setQuiz({ ...quiz, difficulty: parseInt(e.target.value) || 1 })
                          }
                          className="bg-slate-900/40 border-slate-600/50 text-slate-200 mt-1"
                        />
                      </div>
                      <Button
                        onClick={() => setEditingMetadata(false)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-500"
                      >
                        <Save className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-slate-100 font-semibold text-lg">{quiz.title}</h3>
                          <p className="text-slate-400 text-sm mt-1">{quiz.description}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge
                            variant="outline"
                            className="bg-slate-700/40 border-slate-600/50 text-slate-300"
                          >
                            Difficulty: {quiz.difficulty}
                          </Badge>
                          <Button
                            onClick={() => setEditingMetadata(true)}
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-cyan-400"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {error && (
                <Card className="bg-red-500/10 border-red-500/20">
                  <CardContent className="p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                  </CardContent>
                </Card>
              )}

              {/* Questions */}
              <div>
                <p className="text-slate-300 text-sm mb-3">
                  {quiz.questions.length} question(s). Review and edit before saving.
                </p>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {quiz.questions.map((question, index) => (
                    <Card
                      key={index}
                      className="bg-slate-800/40 border-slate-600/50"
                    >
                      <CardContent className="p-4">
                        {editingQuestionIndex === index && editedQuestion ? (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-slate-300 text-xs">Question</Label>
                              <Textarea
                                value={editedQuestion.questionText}
                                onChange={(e) =>
                                  setEditedQuestion({
                                    ...editedQuestion,
                                    questionText: e.target.value,
                                  })
                                }
                                className="bg-slate-900/40 border-slate-600/50 text-slate-200 mt-1"
                                rows={2}
                              />
                            </div>
                            <div>
                              <Label className="text-slate-300 text-xs">Options</Label>
                              <div className="space-y-2 mt-1">
                                {editedQuestion.options.map((option, optIndex) => (
                                  <div key={optIndex} className="flex gap-2">
                                    <Input
                                      value={option}
                                      onChange={(e) => handleUpdateOption(optIndex, e.target.value)}
                                      className="bg-slate-900/40 border-slate-600/50 text-slate-200"
                                      placeholder={`Option ${optIndex + 1}`}
                                    />
                                    {editedQuestion.options.length > 2 && (
                                      <Button
                                        onClick={() => handleRemoveOption(optIndex)}
                                        size="sm"
                                        variant="ghost"
                                        className="text-red-400 hover:text-red-300"
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                ))}
                                <Button
                                  onClick={handleAddOption}
                                  size="sm"
                                  variant="outline"
                                  className="border-slate-600/50 text-slate-300"
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add Option
                                </Button>
                              </div>
                            </div>
                            <div>
                              <Label className="text-slate-300 text-xs">Correct Answer</Label>
                              <Input
                                value={editedQuestion.correctAnswer}
                                onChange={(e) =>
                                  setEditedQuestion({
                                    ...editedQuestion,
                                    correctAnswer: e.target.value,
                                  })
                                }
                                className="bg-slate-900/40 border-slate-600/50 text-slate-200 mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-slate-300 text-xs">Explanation</Label>
                              <Textarea
                                value={editedQuestion.explanation}
                                onChange={(e) =>
                                  setEditedQuestion({
                                    ...editedQuestion,
                                    explanation: e.target.value,
                                  })
                                }
                                className="bg-slate-900/40 border-slate-600/50 text-slate-200 mt-1"
                                rows={2}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={handleSaveQuestion}
                                size="sm"
                                className="bg-green-600 hover:bg-green-500"
                              >
                                <Save className="w-3 h-3 mr-1" />
                                Save
                              </Button>
                              <Button
                                onClick={handleCancelEditQuestion}
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
                                {index + 1}. {question.questionText}
                              </h4>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button
                                  onClick={() => handleEditQuestion(index)}
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-slate-400 hover:text-cyan-400"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button
                                  onClick={() => handleRemoveQuestion(index)}
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-slate-400 hover:text-red-400"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="text-sm space-y-1">
                              {question.options.map((option, optIndex) => (
                                <div key={optIndex} className="text-slate-400">
                                  {String.fromCharCode(65 + optIndex)}. {option}
                                </div>
                              ))}
                            </div>
                            <p className="text-slate-500 text-xs italic mt-1">
                              Answer: {question.correctAnswer}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {quiz && (
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
                  disabled={saving || !quiz || quiz.questions.length === 0}
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
                      Save Quiz
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
