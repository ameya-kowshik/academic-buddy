"use client";

import { useState } from "react";
import { Task } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircle, 
  Circle, 
  Edit, 
  Trash2, 
  Calendar, 
  Clock,
  AlertCircle
} from "lucide-react";
import { taskUtils } from "@/lib/tasks";

interface TaskItemProps {
  task: Task;
  onToggleStatus: (taskId: string) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => Promise<void>;
  loading?: boolean;
}

export default function TaskItem({ 
  task, 
  onToggleStatus, 
  onEdit, 
  onDelete, 
  loading = false 
}: TaskItemProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleToggleStatus = async () => {
    try {
      setActionLoading("toggle");
      await onToggleStatus(task.id);
    } catch (error) {
      console.error("Failed to toggle task status:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        setActionLoading("delete");
        await onDelete(task.id);
      } catch (error) {
        console.error("Failed to delete task:", error);
      } finally {
        setActionLoading(null);
      }
    }
  };

  const isOverdue = taskUtils.isOverdue(task);
  const priorityColor = taskUtils.getPriorityColor(task.priority);
  const statusColor = taskUtils.getStatusColor(task.status);

  return (
    <Card className={`bg-slate-900/50 border-slate-700/50 transition-all duration-300 hover:bg-slate-800/50 hover:border-slate-600/50 ${
      task.status === "COMPLETED" ? "opacity-75" : ""
    } ${isOverdue ? "border-red-500/30" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Status Toggle */}
          <button
            onClick={handleToggleStatus}
            disabled={loading || actionLoading === "toggle"}
            className="mt-1 text-slate-400 hover:text-cyan-400 transition-colors duration-200 disabled:opacity-50"
          >
            {task.status === "COMPLETED" ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </button>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            {/* Title and Priority */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className={`font-medium text-slate-100 ${
                task.status === "COMPLETED" ? "line-through text-slate-400" : ""
              }`}>
                {task.title}
              </h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Priority Badge */}
                <span className={`px-2 py-1 rounded text-xs font-medium border ${priorityColor}`}>
                  {task.priority}
                </span>
                {/* Overdue Indicator */}
                {isOverdue && (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                {task.description}
              </p>
            )}

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {task.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-slate-800/50 text-slate-300 rounded text-xs border border-slate-700/50"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Meta Information */}
            <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
              {/* Due Date */}
              {task.dueDate && (
                <div className={`flex items-center gap-1 ${
                  isOverdue ? "text-red-400" : ""
                }`}>
                  <Calendar className="w-3 h-3" />
                  <span>{taskUtils.formatDueDate(task.dueDate)}</span>
                </div>
              )}
              
              {/* Created Date */}
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Status */}
              <span className={`px-2 py-1 rounded border ${statusColor}`}>
                {taskUtils.getStatusIcon(task.status)} {task.status.replace("_", " ")}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => onEdit(task)}
                disabled={loading || actionLoading !== null}
                size="sm"
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors duration-200"
              >
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
              
              <Button
                onClick={handleDelete}
                disabled={loading || actionLoading !== null}
                size="sm"
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-red-900/20 hover:text-red-400 hover:border-red-500/30 transition-colors duration-200"
              >
                {actionLoading === "delete" ? (
                  "Deleting..."
                ) : (
                  <>
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}