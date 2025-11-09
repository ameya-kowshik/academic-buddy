import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { focusApi, ExtendedPomodoroLog, Tag } from '@/lib/focus-utils';

export function useFocusSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ExtendedPomodoroLog[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch sessions and tags when user is available
  useEffect(() => {
    if (user?.uid) {
      fetchData();
    } else {
      setSessions([]);
      setTags([]);
      setLoading(false);
    }
  }, [user?.uid]);

  const fetchData = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError(null);
      
      // Fetch both sessions and tags in parallel
      const [sessionsData, tagsData] = await Promise.all([
        focusApi.getSessions(user.uid),
        focusApi.getTags(user.uid)
      ]);

      setSessions(sessionsData.sessions || []);
      setTags(tagsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      console.error('Error fetching focus data:', err);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (sessionData: {
    duration: number;
    sessionType?: string;
    focusScore?: number;
    notes?: string;
    taskId?: string;
    tagId?: string;
    startedAt?: Date;
    completedAt?: Date;
  }) => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      setError(null);
      const newSession = await focusApi.createSession(user.uid, sessionData);
      setSessions(prev => [newSession, ...prev]);
      return newSession;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create session';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const createTag = async (tagData: { name: string; color: string }) => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      setError(null);
      const newTag = await focusApi.createTag(user.uid, tagData);
      setTags(prev => [...prev, newTag]);
      return newTag;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create tag';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateTag = async (tagId: string, updates: { name?: string; color?: string }) => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      setError(null);
      const updatedTag = await focusApi.updateTag(user.uid, tagId, updates);
      setTags(prev => prev.map(tag => tag.id === tagId ? updatedTag : tag));
      return updatedTag;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update tag';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteTag = async (tagId: string) => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      setError(null);
      await focusApi.deleteTag(user.uid, tagId);
      setTags(prev => prev.filter(tag => tag.id !== tagId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete tag';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const clearError = () => setError(null);

  return {
    sessions,
    tags,
    loading,
    error,
    fetchData,
    createSession,
    createTag,
    updateTag,
    deleteTag,
    clearError
  };
}