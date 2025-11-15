"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { auth } from "@/lib/firebase/firebaseConfig";

// Helper function to get auth headers
async function getAuthHeaders(): Promise<HeadersInit> {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) {
    throw new Error('Not authenticated');
  }
  return {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  };
}

// Types
export interface Project {
  id: string;
  title: string;
  description?: string;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  startDate?: Date;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours: number;
  color: string;
  icon?: string;
  isArchived: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  tasks?: Task[]; // Optional - not always included in API responses
  _count?: {
    tasks: number;
    pomodoroLogs?: number;
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedMinutes?: number;
  actualMinutes: number;
  dueDate?: Date;
  order: number;
  tags: string[];
  projectId?: string;
  parentTaskId?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  subtasks?: Task[];
  project?: Project;
  _count?: {
    pomodoroLogs: number;
    subtasks: number;
  };
}

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects and tasks
  const fetchProjects = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch('/api/projects', { headers });

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data.projects || []);
      setTasks(data.tasks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Create project
  const createProject = async (projectData: Partial<Project>) => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers,
        body: JSON.stringify(projectData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }

      const newProject = await response.json();
      setProjects(prev => [newProject, ...prev]);
      return newProject;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project';
      setError(errorMessage);
      throw err;
    }
  };

  // Update project
  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update project');
      }

      const updatedProject = await response.json();
      setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
      return updatedProject;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update project';
      setError(errorMessage);
      throw err;
    }
  };

  // Delete project
  const deleteProject = async (projectId: string) => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete project');
      }

      setProjects(prev => prev.filter(p => p.id !== projectId));
      setTasks(prev => prev.filter(t => t.projectId !== projectId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete project';
      setError(errorMessage);
      throw err;
    }
  };

  // Create task
  const createTask = async (taskData: Partial<Task>) => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/projects/tasks', {
        method: 'POST',
        headers,
        body: JSON.stringify(taskData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create task');
      }

      const newTask = await response.json();
      setTasks(prev => [newTask, ...prev]);
      
      // Update project task count if task belongs to a project
      if (newTask.projectId) {
        setProjects(prev => prev.map(p => 
          p.id === newTask.projectId 
            ? { ...p, _count: { ...p._count, tasks: (p._count?.tasks || 0) + 1, pomodoroLogs: p._count?.pomodoroLogs || 0 } }
            : p
        ));
      }
      
      return newTask;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create task';
      setError(errorMessage);
      throw err;
    }
  };

  // Update task
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/projects/tasks/${taskId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update task');
      }

      const updatedTask = await response.json();
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      return updatedTask;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task';
      setError(errorMessage);
      throw err;
    }
  };

  // Delete task
  const deleteTask = async (taskId: string) => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      const taskToDelete = tasks.find(t => t.id === taskId);
      const headers = await getAuthHeaders();
      
      const response = await fetch(`/api/projects/tasks/${taskId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete task');
      }

      setTasks(prev => prev.filter(t => t.id !== taskId));
      
      // Update project task count if task belonged to a project
      if (taskToDelete?.projectId) {
        setProjects(prev => prev.map(p => 
          p.id === taskToDelete.projectId 
            ? { ...p, _count: { ...p._count, tasks: Math.max((p._count?.tasks || 1) - 1, 0), pomodoroLogs: p._count?.pomodoroLogs || 0 } }
            : p
        ));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete task';
      setError(errorMessage);
      throw err;
    }
  };

  // Clear error
  const clearError = () => setError(null);

  // Fetch data on mount and user change
  useEffect(() => {
    if (user?.uid) {
      fetchProjects();
    }
  }, [user?.uid]);

  return {
    projects,
    tasks,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    createTask,
    updateTask,
    deleteTask,
    clearError,
    refetch: fetchProjects
  };
}