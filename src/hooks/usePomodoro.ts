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

  // Timer logic
  useEffect(() => {
    if (state.isRunning && !state.isPaused) {
      intervalRef.current = setInterval(() => {
        setState(prev => {
          const newTimeLeft = prev.timeLeft - 1;

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
                onSessionCompleteRef.current(settings.focusDuration);
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
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
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
    setState(prev => ({
      ...prev,
      phase: 'idle',
      timeLeft: settings.focusDuration * 60,
      isRunning: false,
      isPaused: false,
    }));
  }, [settings.focusDuration]);

  const reset = useCallback(() => {
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

      if (wasInFocus) {
        newCycleCount += 1;
        if (newCycleCount % settings.longBreakInterval === 0) {
          newPhase = 'longBreak';
        } else {
          newPhase = 'shortBreak';
        }
      } else {
        newPhase = 'focus';
      }

      return {
        ...prev,
        phase: newPhase,
        timeLeft: getPhaseDuration(newPhase, settings) * 60,
        cycleCount: newCycleCount,
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