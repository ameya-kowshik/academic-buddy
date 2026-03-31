import { useState, useEffect, useRef, useCallback } from 'react';

export interface StopwatchState {
  timeElapsed: number; // seconds
  isRunning: boolean;
  isPaused: boolean;
  startTime: Date | null;
  maxDuration: number; // seconds (3 hours = 10800 seconds)
}

const MAX_DURATION = 3 * 60 * 60; // 3 hours in seconds

export function useStopwatch() {
  const [state, setState] = useState<StopwatchState>({
    timeElapsed: 0,
    isRunning: false,
    isPaused: false,
    startTime: null,
    maxDuration: MAX_DURATION,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedElapsedRef = useRef<number>(0);
  const onMaxTimeReachedRef = useRef<(() => void) | null>(null);
  const onSessionCompleteRef = useRef<((duration: number) => void) | null>(null);

  // Timer logic - using actual time tracking to prevent tab switching issues
  useEffect(() => {
    if (state.isRunning && !state.isPaused) {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }

      intervalRef.current = setInterval(() => {
        setState(prev => {
          // Calculate actual elapsed time to handle tab switching
          const now = Date.now();
          const elapsed = Math.floor((now - (startTimeRef.current || now)) / 1000);
          const newTimeElapsed = pausedElapsedRef.current + elapsed;

          // Check if max time reached
          if (newTimeElapsed >= prev.maxDuration) {
            // Auto-stop at max duration
            if (onMaxTimeReachedRef.current) {
              onMaxTimeReachedRef.current();
            }

            return {
              ...prev,
              timeElapsed: prev.maxDuration,
              isRunning: false,
              isPaused: false,
            };
          }

          return {
            ...prev,
            timeElapsed: newTimeElapsed,
          };
        });
      }, 100); // Check more frequently for smoother updates
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Track elapsed time when pausing
      if (state.isPaused && startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        pausedElapsedRef.current = pausedElapsedRef.current + elapsed;
        startTimeRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isRunning, state.isPaused]);

  // Handle tab visibility changes to maintain timer accuracy
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden - pause the timer temporarily
        if (state.isRunning && !state.isPaused) {
          // Store the current time when tab becomes hidden
          if (startTimeRef.current) {
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            pausedElapsedRef.current += elapsed;
            startTimeRef.current = null;
          }
        }
      } else {
        // Tab is visible again - resume the timer
        if (state.isRunning && !state.isPaused) {
          startTimeRef.current = Date.now();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state.isRunning, state.isPaused]);

  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    
    setState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      startTime: prev.startTime || new Date(),
    }));
  }, []);

  const pause = useCallback(() => {
    setState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: true,
    }));
  }, []);

  const stop = useCallback(() => {
    setState(prev => {
      // Defer the callback to avoid setState-during-render issues
      if (prev.timeElapsed > 0 && onSessionCompleteRef.current) {
        const durationMinutes = Math.max(1, Math.round(prev.timeElapsed / 60));
        const cb = onSessionCompleteRef.current;
        setTimeout(() => cb(durationMinutes), 0);
      }

      startTimeRef.current = null;
      pausedElapsedRef.current = 0;

      return {
        ...prev,
        timeElapsed: 0,
        isRunning: false,
        isPaused: false,
        startTime: null,
      };
    });
  }, []);

  const reset = useCallback(() => {
    startTimeRef.current = null;
    pausedElapsedRef.current = 0;
    
    setState(prev => ({
      ...prev,
      timeElapsed: 0,
      isRunning: false,
      isPaused: false,
      startTime: null,
    }));
  }, []);

  const setOnMaxTimeReached = useCallback((callback: () => void) => {
    onMaxTimeReachedRef.current = callback;
  }, []);

  const setOnSessionComplete = useCallback((callback: (duration: number) => void) => {
    onSessionCompleteRef.current = callback;
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getProgress = useCallback(() => {
    return (state.timeElapsed / state.maxDuration) * 100;
  }, [state.timeElapsed, state.maxDuration]);

  const getTimeRemaining = useCallback(() => {
    return state.maxDuration - state.timeElapsed;
  }, [state.timeElapsed, state.maxDuration]);

  const isNearMaxTime = useCallback(() => {
    const remaining = getTimeRemaining();
    return remaining <= 300; // 5 minutes warning
  }, [getTimeRemaining]);

  const getStatusColor = useCallback(() => {
    if (!state.isRunning && state.timeElapsed === 0) return '#64748b'; // slate - idle
    if (state.isPaused) return '#f59e0b'; // amber - paused
    if (isNearMaxTime()) return '#ef4444'; // red - near max time
    if (state.isRunning) return '#22c55e'; // green - running
    return '#64748b'; // slate - stopped
  }, [state.isRunning, state.isPaused, state.timeElapsed, isNearMaxTime]);

  const getStatusLabel = useCallback(() => {
    if (!state.isRunning && state.timeElapsed === 0) return 'Ready to Start';
    if (state.isPaused) return 'Paused';
    if (isNearMaxTime()) return 'Near Max Time';
    if (state.isRunning) return 'Focus Session Active';
    return 'Session Stopped';
  }, [state.isRunning, state.isPaused, state.timeElapsed, isNearMaxTime]);

  const getStatusDescription = useCallback(() => {
    if (!state.isRunning && state.timeElapsed === 0) return 'Click start when you\'re ready to focus';
    if (state.isPaused) return 'Session paused - click resume to continue';
    if (isNearMaxTime()) return 'Approaching 3-hour limit - consider taking a break';
    if (state.isRunning) return 'Stay focused! You\'re doing great';
    return 'Session completed - great work!';
  }, [state.isRunning, state.isPaused, state.timeElapsed, isNearMaxTime]);

  // Memoize utility flags to prevent unnecessary re-renders
  const canStart = !state.isRunning && !state.isPaused && state.timeElapsed < state.maxDuration;
  const canPause = state.isRunning && !state.isPaused;
  const canResume = state.isPaused;
  const canStop = state.isRunning || state.isPaused || state.timeElapsed > 0;
  const hasTimeElapsed = state.timeElapsed > 0;

  return {
    ...state,
    start,
    pause,
    stop,
    reset,
    setOnMaxTimeReached,
    setOnSessionComplete,
    formatTime,
    getProgress,
    getTimeRemaining,
    isNearMaxTime,
    getStatusColor,
    getStatusLabel,
    getStatusDescription,
    // Utility methods
    canStart,
    canPause,
    canResume,
    canStop,
    hasTimeElapsed,
  };
}