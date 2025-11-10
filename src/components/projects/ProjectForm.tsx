"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Loader2 } from "lucide-react";
import { Project } from "@/hooks/useProjects";

interface ProjectFormProps {
  project?: Project;
  onSubmit: (data: Partial<Project>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const projectColors = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#10b981" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Pink", value: "#ec4899" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Indigo", value: "#6366f1" }
];

const projectIcons = ["📋", "🎯", "💼", "🚀", "📚", "🔬", "🎨", "⚡", "🌟", "🔥"];

export default function ProjectForm({ project, onSubmit, onCancel, loading }: ProjectFormProps) {
  const [formData, setFormData] = useState({
    title: project?.title || "",
    description: project?.description || "",
    status: project?.status || "ACTIVE",
    priority: project?.priority || "MEDIUM",
    color: project?.color || "#3b82f6",
    icon: project?.icon || "📋",
    estimatedHours: project?.estimatedHours?.toString() || "",
    startDate: project?.startDate ? new Date(project.startDate).toISOString().split('T')[0] : "",
    dueDate: project?.dueDate ? new Date(project.dueDate).toISOString().split('T')[0] : ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData: Partial<Project> = {
      title: formData.title,
      description: formData.description || undefined,
      status: formData.status as any,
      priority: formData.priority as any,
      color: formData.color,
      icon: formData.icon,
      estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : undefined,
      startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined
    };

    await onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-slate-900 border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-slate-100">
            {project ? "Edit Project" : "Create New Project"}
          </CardTitle>
          <Button
            onClick={onCancel}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-slate-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Project Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter project title"
                  className="bg-slate-800 border-slate-600 text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Project description (optional)"
                  className="bg-slate-800 border-slate-600 text-slate-100"
                  rows={3}
                />
              </div>
            </div>

            {/* Status and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Status
                </label>
                <Select value={formData.status} onValueChange={(value: "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED") => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="PLANNING">Planning</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="ON_HOLD">On Hold</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Priority
                </label>
                <Select value={formData.priority} onValueChange={(value: "LOW" | "MEDIUM" | "HIGH" | "URGENT") => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Appearance */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Color
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {projectColors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                      className={`w-8 h-8 rounded-lg border-2 transition-all ${
                        formData.color === color.value 
                          ? 'border-white scale-110' 
                          : 'border-slate-600 hover:border-slate-400'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Icon
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {projectIcons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, icon }))}
                      className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center text-lg transition-all ${
                        formData.icon === icon 
                          ? 'border-cyan-400 bg-cyan-400/10' 
                          : 'border-slate-600 hover:border-slate-400'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dates and Estimation */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="bg-slate-800 border-slate-600 text-slate-100"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Due Date
                </label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="bg-slate-800 border-slate-600 text-slate-100"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Estimated Hours
                </label>
                <Input
                  type="number"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: e.target.value }))}
                  placeholder="0"
                  min="0"
                  className="bg-slate-800 border-slate-600 text-slate-100"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
              <Button
                type="button"
                onClick={onCancel}
                variant="outline"
                className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.title.trim()}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {project ? "Update Project" : "Create Project"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}