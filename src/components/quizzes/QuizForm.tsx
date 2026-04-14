"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, AlertCircle, Trash2, GripVertical, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface QuizFormProps {
  onSubmit: (quizData: QuizFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<QuizFormData>;
  isEditing?: boolean;
  loading?: boolean;
  userId: string;
}

export interface QuizFormData {
  title: string;
  description?: string;
  difficulty: number;
  grouping?: string;
  sourceMaterialId?: string;
  questions: QuestionData[];
}

export interface QuestionData {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  order: number;
}

interface Document {
  id: string;
  fileName: string;
}

export default function QuizForm({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
  loading = false,
  userId,
}: QuizFormProps) {
  const [formData, setFormData] = useState<QuizFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    difficulty: initialData?.difficulty || 3,
    grouping: initialData?.grouping || "",
    sourceMaterialId: initialData?.sourceMaterialId || "",
    questions: initialData?.questions || [],
  });

  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [error, setError] = useState("");

  // Fetch documents for linking
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!userId || !user) return;

      setLoadingDocuments(true);
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/documents", {
          headers: { Authorization: `Bearer ${token}` },
        });
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
  }, [userId, user]);

  const addQuestion = () => {
    const newQuestion: QuestionData = {
      questionText: "",
      options: ["", ""],
      correctAnswer: "",
      explanation: "",
      order: formData.questions.length,
    };
    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
  };

  const removeQuestion = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions
        .filter((_, i) => i !== index)
        .map((q, i) => ({ ...q, order: i })),
    }));
  };

  const updateQuestion = (
    index: number,
    field: keyof QuestionData,
    value: string | string[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      ),
    }));
  };

  const addOption = (questionIndex: number) => {
    const question = formData.questions[questionIndex];
    updateQuestion(questionIndex, "options", [...question.options, ""]);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const question = formData.questions[questionIndex];
    const newOptions = question.options.filter((_, i) => i !== optionIndex);
    updateQuestion(questionIndex, "options", newOptions);
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const question = formData.questions[questionIndex];
    const newOptions = question.options.map((opt, i) =>
      i === optionIndex ? value : opt
    );
    updateQuestion(questionIndex, "options", newOptions);
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === formData.questions.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const newQuestions = [...formData.questions];
    [newQuestions[index], newQuestions[newIndex]] = [
      newQuestions[newIndex],
      newQuestions[index],
    ];

    // Update order
    newQuestions.forEach((q, i) => {
      q.order = i;
    });

    setFormData((prev) => ({ ...prev, questions: newQuestions }));
  };

  const validateForm = (): string | null => {
    if (!formData.title.trim()) {
      return "Title is required";
    }
    if (formData.difficulty < 1 || formData.difficulty > 5) {
      return "Difficulty must be between 1 and 5";
    }
    if (formData.questions.length === 0) {
      return "At least one question is required";
    }

    for (let i = 0; i < formData.questions.length; i++) {
      const q = formData.questions[i];
      if (!q.questionText.trim()) {
        return `Question ${i + 1}: Question text is required`;
      }
      const validOptions = q.options.filter((opt) => opt.trim());
      if (validOptions.length < 2) {
        return `Question ${i + 1}: At least 2 options are required`;
      }
      if (!q.correctAnswer.trim()) {
        return `Question ${i + 1}: Correct answer must be selected`;
      }
      if (!validOptions.includes(q.correctAnswer)) {
        return `Question ${i + 1}: Correct answer must be one of the options`;
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const submitData = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        grouping: formData.grouping?.trim() || undefined,
        sourceMaterialId: formData.sourceMaterialId || undefined,
        questions: formData.questions.map((q) => ({
          ...q,
          questionText: q.questionText.trim(),
          options: q.options.filter((opt) => opt.trim()),
          explanation: q.explanation?.trim() || undefined,
        })),
      };

      await onSubmit(submitData);

      // Reset form if creating new quiz
      if (!isEditing) {
        setFormData({
          title: "",
          description: "",
          difficulty: 3,
          grouping: "",
          sourceMaterialId: "",
          questions: [],
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save quiz");
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-slate-100 flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          {isEditing ? "Edit Quiz" : "Create New Quiz"}
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

          {/* Quiz Metadata */}
          <div className="space-y-4">
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
                placeholder="Enter quiz title..."
                disabled={loading}
                className="bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-300">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Enter quiz description..."
                disabled={loading}
                rows={2}
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
                    setFormData((prev) => ({
                      ...prev,
                      grouping: e.target.value,
                    }))
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
            </div>
          </div>

          {/* Questions Section */}
          <div className="space-y-4 pt-4 border-t border-slate-700/50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-slate-200">Questions</h3>
              <Button
                type="button"
                onClick={addQuestion}
                disabled={loading}
                size="sm"
                className="bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Question
              </Button>
            </div>

            {formData.questions.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-8">
                No questions added yet. Click "Add Question" to get started.
              </p>
            )}

            {formData.questions.map((question, qIndex) => (
              <Card
                key={qIndex}
                className="bg-slate-800/50 border-slate-600/50"
              >
                <CardContent className="pt-6 space-y-4">
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-5 h-5 text-slate-500" />
                      <span className="text-slate-400 font-medium">
                        Question {qIndex + 1}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        onClick={() => moveQuestion(qIndex, "up")}
                        disabled={loading || qIndex === 0}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-slate-400 hover:text-slate-200"
                      >
                        ↑
                      </Button>
                      <Button
                        type="button"
                        onClick={() => moveQuestion(qIndex, "down")}
                        disabled={
                          loading || qIndex === formData.questions.length - 1
                        }
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-slate-400 hover:text-slate-200"
                      >
                        ↓
                      </Button>
                      <Button
                        type="button"
                        onClick={() => removeQuestion(qIndex)}
                        disabled={loading}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="space-y-2">
                    <Label className="text-slate-300">Question Text *</Label>
                    <Textarea
                      value={question.questionText}
                      onChange={(e) =>
                        updateQuestion(qIndex, "questionText", e.target.value)
                      }
                      placeholder="Enter the question..."
                      disabled={loading}
                      rows={2}
                      className="bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 resize-none"
                    />
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300">Options *</Label>
                      <Button
                        type="button"
                        onClick={() => addOption(qIndex)}
                        disabled={loading}
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-cyan-400 hover:text-cyan-300"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Option
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex gap-2">
                          <Input
                            value={option}
                            onChange={(e) =>
                              updateOption(qIndex, oIndex, e.target.value)
                            }
                            placeholder={`Option ${oIndex + 1}`}
                            disabled={loading}
                            className="bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                          />
                          <Button
                            type="button"
                            onClick={() => removeOption(qIndex, oIndex)}
                            disabled={loading || question.options.length <= 2}
                            size="sm"
                            variant="ghost"
                            className="h-10 w-10 p-0 text-red-400 hover:text-red-300 disabled:opacity-30"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Correct Answer */}
                  <div className="space-y-2">
                    <Label htmlFor={`correct-answer-${qIndex}`} className="text-slate-300">Correct Answer *</Label>
                    <select
                      id={`correct-answer-${qIndex}`}
                      value={question.correctAnswer}
                      onChange={(e) =>
                        updateQuestion(qIndex, "correctAnswer", e.target.value)
                      }
                      disabled={loading}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-md text-white focus:border-cyan-500 focus:ring-cyan-500/20 focus:outline-none"
                    >
                      <option value="">Select correct answer...</option>
                      {question.options
                        .filter((opt) => opt.trim())
                        .map((option, oIndex) => (
                          <option key={oIndex} value={option}>
                            {option}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Explanation */}
                  <div className="space-y-2">
                    <Label className="text-slate-300">Explanation</Label>
                    <Textarea
                      value={question.explanation}
                      onChange={(e) =>
                        updateQuestion(qIndex, "explanation", e.target.value)
                      }
                      placeholder="Explain why this is the correct answer..."
                      disabled={loading}
                      rows={2}
                      className="bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading || !formData.title.trim()}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50"
            >
              {loading ? "Saving..." : isEditing ? "Update Quiz" : "Create Quiz"}
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
