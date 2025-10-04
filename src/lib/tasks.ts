import { Task, Priority, TaskStatus } from '@prisma/client';

// Task utility functions
export const taskUtils = {
  // Get priority color for UI
  getPriorityColor: (priority: Priority) => {
    switch (priority) {
      case 'URGENT':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'HIGH':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'MEDIUM':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'LOW':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  },

  // Get status color for UI
  getStatusColor: (status: TaskStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'IN_PROGRESS':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'CANCELLED':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'PENDING':
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  },

  // Get status icon
  getStatusIcon: (status: TaskStatus) => {
    switch (status) {
      case 'COMPLETED':
        return '✅';
      case 'IN_PROGRESS':
        return '⏳';
      case 'CANCELLED':
        return '❌';
      case 'PENDING':
      default:
        return '📝';
    }
  },

  // Check if task is overdue
  isOverdue: (task: Task) => {
    if (!task.dueDate || task.status === 'COMPLETED') return false;
    return new Date(task.dueDate) < new Date();
  },

  // Format due date for display
  formatDueDate: (dueDate: Date | null) => {
    if (!dueDate) return 'No due date';
    
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays === -1) return 'Due yesterday';
    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
    if (diffDays <= 7) return `Due in ${diffDays} days`;
    
    return date.toLocaleDateString();
  },

  // Sort tasks by priority and due date
  sortTasks: (tasks: Task[]) => {
    const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    const statusOrder = { PENDING: 1, IN_PROGRESS: 2, COMPLETED: 3, CANCELLED: 4 };

    return tasks.sort((a, b) => {
      // First sort by status (pending/in-progress first)
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;

      // Then by priority (higher priority first)
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by due date (earlier due date first)
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;

      // Finally by creation date (newer first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
};

// API helper functions
export const taskApi = {
  // Get all tasks for current user
  getTasks: async (firebaseUid: string) => {
    const response = await fetch('/api/tasks', {
      headers: {
        'x-firebase-uid': firebaseUid
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch tasks');
    }
    
    return response.json();
  },

  // Create new task
  createTask: async (firebaseUid: string, taskData: Partial<Task>) => {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-firebase-uid': firebaseUid
      },
      body: JSON.stringify(taskData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create task');
    }
    
    return response.json();
  },

  // Update task
  updateTask: async (firebaseUid: string, taskId: string, updates: Partial<Task>) => {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-firebase-uid': firebaseUid
      },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update task');
    }
    
    return response.json();
  },

  // Delete task
  deleteTask: async (firebaseUid: string, taskId: string) => {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'DELETE',
      headers: {
        'x-firebase-uid': firebaseUid
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete task');
    }
    
    return response.json();
  }
};