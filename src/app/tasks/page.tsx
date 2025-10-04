"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Task } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Plus, ListTodo, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";
import TaskForm from "@/components/tasks/TaskForm";
import TaskList from "@/components/tasks/TaskList";

export default function TasksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const {
    tasks,
    loading: tasksLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    clearError
  } = useTasks();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  // Don't render if not authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <ListTodo className="h-5 w-5 text-white" />
          </div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleCreateTask = async (taskData: Partial<Task>) => {
    try {
      setActionLoading(true);
      await createTask(taskData);
      setShowCreateForm(false);
    } catch (error) {
      // Error is handled by useTasks hook
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTask = async (taskData: Partial<Task>) => {
    if (!editingTask) return;

    try {
      setActionLoading(true);
      await updateTask(editingTask.id, taskData);
      setEditingTask(null);
    } catch (error) {
      // Error is handled by useTasks hook
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      setActionLoading(true);
      await deleteTask(taskId);
    } catch (error) {
      // Error is handled by useTasks hook
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (taskId: string) => {
    try {
      setActionLoading(true);
      await toggleTaskStatus(taskId);
    } catch (error) {
      // Error is handled by useTasks hook
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-slate-400 hover:text-cyan-400 transition-colors duration-300 group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:-translate-x-1" />
              Back to Dashboard
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <ListTodo className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-100">Task Management</h1>
                <p className="text-sm text-slate-400">Organize and track your study tasks</p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => {
              setShowCreateForm(true);
              setEditingTask(null);
            }}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/25"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="space-y-8">
          {/* Error Display */}
          {error && (
            <Card className="bg-red-500/10 border-red-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <p className="text-red-400">{error}</p>
                  </div>
                  <Button
                    onClick={clearError}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300"
                  >
                    Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Task Form */}
          {(showCreateForm || editingTask) && (
            <TaskForm
              onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
              onCancel={() => {
                setShowCreateForm(false);
                setEditingTask(null);
              }}
              initialData={editingTask || undefined}
              isEditing={!!editingTask}
              loading={actionLoading}
            />
          )}

          {/* Task List */}
          <TaskList
            tasks={tasks}
            onToggleStatus={handleToggleStatus}
            onEdit={(task) => {
              setEditingTask(task);
              setShowCreateForm(false);
            }}
            onDelete={handleDeleteTask}
            loading={tasksLoading || actionLoading}
          />
        </div>
      </main>
    </div>
  );
}