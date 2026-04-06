import { useState, useEffect, useRef, useCallback } from 'react';

export type PomodoroPhase = 'focus' | 'shortBreak' | 'longBreak' | 'idle';

export interface PomodoroSettings {
  focusDuration: number; // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number; // minutes
  longBreakInterval: number; // after how many focus sessions
  autoStartBreaks: boolean;
  autoStartSessions: boolean;
}

export interface PomodoroState {
  phase: PomodoroPhase;
  timeLeft: number; // seconds
  isRunning: boolean;
  isPaused: boolean;
  cycleCount: number;
  totalFocusTime: number; // seconds
  settings: PomodoroSettings;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartSessions: false,
};

export function usePomodoro(initialSettings?: Partial<PomodoroSettings>) {
  const [settings, setSettings] = useState<PomodoroSettings>({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  });

  const [state, setState] = useState<PomodoroState>({
    phase: 'idle',
    timeLeft: settings.focusDuration * 60,
    isRunning: false,
    isPaused: false,
    cycleCount: 0,
    totalFocusTime: 0,
    settings,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(0);
  const onPhaseChangeRef = useRef<((phase: PomodoroPhase) => void) | null>(null);
  const onSessionCompleteRef = useRef<((duration: number) => void) | null>(null);

  // Update state when settings change
  useEffect(() => {
    setState(prev => ({
      ...prev,
      settings,
      timeLeft: prev.phase === 'idle' ? settings.focusDuration * 60 : prev.timeLeft,
    }));
  }, [settings]);

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
          const totalDuration = getPhaseDuration(prev.phase, settings) * 60;
          const newTimeLeft = Math.max(0, totalDuration - elapsed - pausedTimeRef.current);

          if (newTimeLeft <= 0) {
            // Phase completed
            const wasInFocus = prev.phase === 'focus';
            let newPhase: PomodoroPhase;
            let newCycleCount = prev.cycleCount;
            let newTotalFocusTime = prev.totalFocusTime;

            if (wasInFocus) {
              // Focus session completed
              newCycleCount += 1;
              newTotalFocusTime += settings.focusDuration * 60;
              
              // Determine next break type
              if (newCycleCount % settings.longBreakInterval === 0) {
                newPhase = 'longBreak';
              } else {
                newPhase = 'shortBreak';
              }

              // Notify session completion
              if (onSessionCompleteRef.current) {
                const cb = onSessionCompleteRef.current;
                setTimeout(() => cb(settings.focusDuration), 0);
              }
            } else {
              // Break completed, back to focus
              newPhase = 'focus';
            }

            // Notify phase change
            if (onPhaseChangeRef.current) {
              onPhaseChangeRef.current(newPhase);
            }

            const newTimeLeft = getPhaseDuration(newPhase, settings) * 60;
            const shouldAutoStart = wasInFocus ? settings.autoStartBreaks : settings.autoStartSessions;

            // Reset timing refs for new phase
            startTimeRef.current = shouldAutoStart ? Date.now() : null;
            pausedTimeRef.current = 0;

            return {
              ...prev,
              phase: newPhase,
              timeLeft: newTimeLeft,
              isRunning: shouldAutoStart,
              cycleCount: newCycleCount,
              totalFocusTime: newTotalFocusTime,
            };
          }

          return {
            ...prev,
            timeLeft: newTimeLeft,
          };
        });
      }, 100); // Check more frequently for smoother updates
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Track paused time when pausing
      if (state.isPaused && startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        pausedTimeRef.current = elapsed;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isRunning, state.isPaused, settings]);



  const getPhaseColor = (phase: PomodoroPhase): string => {
    switch (phase) {
      case 'focus':
        return '#ef4444'; // red
      case 'shortBreak':
        return '#22c55e'; // green
      case 'longBreak':
        return '#3b82f6'; // blue
      default:
        return '#64748b'; // slate
    }
  };

  const getPhaseLabel = (phase: PomodoroPhase): string => {
    switch (phase) {
      case 'focus':
        return 'Focus Time';
      case 'shortBreak':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
      default:
        return 'Ready to Start';
    }
  };

  const getPhaseDescription = (phase: PomodoroPhase): string => {
    switch (phase) {
      case 'focus':
        return 'Time to concentrate and get work done';
      case 'shortBreak':
        return 'Take a quick break and relax';
      case 'longBreak':
        return 'Enjoy a longer break - you\'ve earned it!';
      default:
        return 'Click start when you\'re ready to focus';
    }
  };

  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    pausedTimeRef.current = 0;
    
    setState(prev => {
      if (prev.phase === 'idle') {
        return {
          ...prev,
          phase: 'focus',
          timeLeft: settings.focusDuration * 60,
          isRunning: true,
          isPaused: false,
        };
      }
      return {
        ...prev,
        isRunning: true,
        isPaused: false,
      };
    });
  }, [settings.focusDuration]);

  const pause = useCallback(() => {
    setState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: true,
    }));
  }, []);

  const stop = useCallback(() => {
    startTimeRef.current = null;
    pausedTimeRef.current = 0;
    
    setState(prev => ({
      ...prev,
      phase: 'idle',
      timeLeft: settings.focusDuration * 60,
      isRunning: false,
      isPaused: false,
    }));
  }, [settings.focusDuration]);

  const reset = useCallback(() => {
    startTimeRef.current = null;
    pausedTimeRef.current = 0;
    
    setState(prev => ({
      ...prev,
      phase: 'idle',
      timeLeft: settings.focusDuration * 60,
      isRunning: false,
      isPaused: false,
      cycleCount: 0,
      totalFocusTime: 0,
    }));
  }, [settings.focusDuration]);

  const skipPhase = useCallback(() => {
    setState(prev => {
      if (prev.phase === 'idle') return prev;

      const wasInFocus = prev.phase === 'focus';
      let newPhase: PomodoroPhase;
      let newCycleCount = prev.cycleCount;
      let newTotalFocusTime = prev.totalFocusTime;

      if (wasInFocus) {
        // If skipping a focus phase, count it as completed
        newCycleCount += 1;
        
        // Calculate how much time was actually spent
        const totalDuration = settings.focusDuration * 60;
        const timeSpent = totalDuration - prev.timeLeft;
        const minutesSpent = Math.floor(timeSpent / 60);
        
        // Add to total focus time
        newTotalFocusTime += timeSpent;
        
        // Notify session completion with actual time spent (minimum 1 minute)
        if (onSessionCompleteRef.current && timeSpent > 0) {
          const cb = onSessionCompleteRef.current;
          const mins = Math.max(1, minutesSpent);
          setTimeout(() => cb(mins), 0);
        }
        
        // Determine next break type
        if (newCycleCount % settings.longBreakInterval === 0) {
          newPhase = 'longBreak';
        } else {
          newPhase = 'shortBreak';
        }
      } else {
        // Skipping a break, go back to focus
        newPhase = 'focus';
      }

      // Notify phase change
      if (onPhaseChangeRef.current) {
        onPhaseChangeRef.current(newPhase);
      }

      // Reset timing refs for new phase
      startTimeRef.current = null;
      pausedTimeRef.current = 0;

      return {
        ...prev,
        phase: newPhase,
        timeLeft: getPhaseDuration(newPhase, settings) * 60,
        cycleCount: newCycleCount,
        totalFocusTime: newTotalFocusTime,
        isRunning: false, // Stop the timer when skipping
        isPaused: false,
      };
    });
  }, [settings]);

  const updateSettings = useCallback((newSettings: Partial<PomodoroSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const setOnPhaseChange = useCallback((callback: (phase: PomodoroPhase) => void) => {
    onPhaseChangeRef.current = callback;
  }, []);

  const setOnSessionComplete = useCallback((callback: (duration: number) => void) => {
    onSessionCompleteRef.current = callback;
  }, []);

  return {
    ...state,
    start,
    pause,
    stop,
    reset,
    skipPhase,
    updateSettings,
    setOnPhaseChange,
    setOnSessionComplete,
    getPhaseColor,
    getPhaseLabel,
    getPhaseDescription,
    formatTime: (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    getProgress: () => {
      const totalTime = getPhaseDuration(state.phase, settings) * 60;
      return totalTime > 0 ? ((totalTime - state.timeLeft) / totalTime) * 100 : 0;
    },
  };
}

function getPhaseDuration(phase: PomodoroPhase, settings: PomodoroSettings): number {
  switch (phase) {
    case 'focus':
      return settings.focusDuration;
    case 'shortBreak':
      return settings.shortBreakDuration;
    case 'longBreak':
      return settings.longBreakDuration;
    default:
      return settings.focusDuration;
  }
}