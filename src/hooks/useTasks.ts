import { useState, useEffect } from 'react';
import { Task } from '@prisma/client';
import { useAuth } from './useAuth';
import { taskApi, taskUtils } from '@/lib/tasks';

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tasks when user is available
  useEffect(() => {
    if (user?.uid) {
      fetchTasks();
    } else {
      setTasks([]);
      setLoading(false);
    }
  }, [user?.uid]);

  const fetchTasks = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError(null);
      const fetchedTasks = await taskApi.getTasks(user.uid);
      const sortedTasks = taskUtils.sortTasks(fetchedTasks);
      setTasks(sortedTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData: Partial<Task>) => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      setError(null);
      const newTask = await taskApi.createTask(user.uid, taskData);
      setTasks(prev => taskUtils.sortTasks([...prev, newTask]));
      return newTask;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create task';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      setError(null);
      const updatedTask = await taskApi.updateTask(user.uid, taskId, updates);
      setTasks(prev => {
        const updated = prev.map(task => 
          task.id === taskId ? updatedTask : task
        );
        return taskUtils.sortTasks(updated);
      });
      return updatedTask;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      setError(null);
      await taskApi.deleteTask(user.uid, taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete task';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const toggleTaskStatus = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    return updateTask(taskId, { status: newStatus });
  };

  const clearError = () => setError(null);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    clearError
  };
}