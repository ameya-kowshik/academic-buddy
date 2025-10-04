"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Plus, X } from "lucide-react";
import { Task, Priority } from "@prisma/client";

interface TaskFormProps {
  onSubmit: (taskData: Partial<Task>) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<Task>;
  isEditing?: boolean;
  loading?: boolean;
}

export default function TaskForm({ 
  onSubmit, 
  onCancel, 
  initialData, 
  isEditing = false, 
  loading = false 
}: TaskFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    priority: initialData?.priority || "MEDIUM" as Priority,
    dueDate: initialData?.dueDate 
      ? new Date(initialData.dueDate).toISOString().slice(0, 16)
      : "",
    tags: initialData?.tags || [],
    isRecurring: initialData?.isRecurring || false,
    recurringPattern: initialData?.recurringPattern || ""
  });

  const [newTag, setNewTag] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim()) {
      setError("Task title is required");
      return;
    }

    try {
      const taskData = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
      };

      await onSubmit(taskData);
      
      // Reset form if creating new task
      if (!isEditing) {
        setFormData({
          title: "",
          description: "",
          priority: "MEDIUM",
          dueDate: "",
          tags: [],
          isRecurring: false,
          recurringPattern: ""
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save task");
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.target === e.currentTarget) {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-slate-100 flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          {isEditing ? "Edit Task" : "Create New Task"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-slate-300">
              Task Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter task title..."
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
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter task description..."
              disabled={loading}
              rows={3}
              className="bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 resize-none"
            />
          </div>

          {/* Priority and Due Date */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-slate-300">
                Priority
              </Label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as Priority }))}
                disabled={loading}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-md text-white focus:border-cyan-500 focus:ring-cyan-500/20 focus:outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-slate-300">
                Due Date
              </Label>
              <div className="relative">
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  disabled={loading}
                  className="bg-slate-900/50 border-slate-700/50 text-white focus:border-cyan-500 focus:ring-cyan-500/20"
                />
                <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="text-slate-300">Tags</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a tag..."
                disabled={loading}
                className="bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
              />
              <Button
                type="button"
                onClick={addTag}
                disabled={loading || !newTag.trim()}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      disabled={loading}
                      className="ml-1 hover:text-cyan-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading || !formData.title.trim()}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50"
            >
              {loading ? "Saving..." : isEditing ? "Update Task" : "Create Task"}
            </Button>
            {onCancel && (
              <Button
                type="button"
                onClick={onCancel}
                disabled={loading}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
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