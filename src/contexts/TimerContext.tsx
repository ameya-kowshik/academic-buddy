"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { usePomodoro } from "@/hooks/usePomodoro";
import { useStopwatch } from "@/hooks/useStopwatch";

type TimerMode = "pomodoro" | "stopwatch";

interface TimerContextType {
  // Timer state
  timerMode: TimerMode;
  setTimerMode: (mode: TimerMode) => void;
  
  // Pomodoro
  pomodoro: ReturnType<typeof usePomodoro>;
  
  // Stopwatch
  stopwatch: ReturnType<typeof useStopwatch>;
  
  // Current timer
  currentTimer: ReturnType<typeof usePomodoro> | ReturnType<typeof useStopwatch>;
  timeLeft: number;
  totalTime: number;
  timerColor: string;
  timerLabel: string;
  
  // Session data
  selectedTagId: string | null;
  setSelectedTagId: (tagId: string | null) => void;
  
  // Settings
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
}

export const TimerContext = createContext<TimerContextType | undefined>(
  undefined
);

interface TimerProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = "persistentTimerState";

export function TimerProvider({ children }: TimerProviderProps) {
  const [timerMode, setTimerMode] = useState<TimerMode>("pomodoro");
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const hasRestoredRef = useRef(false);
  const restorationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize timers - these instances persist across page navigation
  const pomodoro = usePomodoro();
  const stopwatch = useStopwatch();

  // Save timer state to localStorage whenever it changes
  useEffect(() => {
    const state = {
      timerMode,
      pomodoroState: {
        phase: pomodoro.phase,
        timeLeft: pomodoro.timeLeft,
        isRunning: pomodoro.isRunning,
        isPaused: pomodoro.isPaused,
        cycleCount: pomodoro.cycleCount,
        totalFocusTime: pomodoro.totalFocusTime,
      },
      stopwatchState: {
        timeElapsed: stopwatch.timeElapsed,
        isRunning: stopwatch.isRunning,
        isPaused: stopwatch.isPaused,
      },
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save timer state:", error);
    }
  }, [
    timerMode,
    pomodoro.phase,
    pomodoro.timeLeft,
    pomodoro.isRunning,
    pomodoro.isPaused,
    pomodoro.cycleCount,
    pomodoro.totalFocusTime,
    stopwatch.timeElapsed,
    stopwatch.isRunning,
    stopwatch.isPaused,
  ]);

  // Load and restore state from localStorage on mount
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    try {
      const savedStateStr = localStorage.getItem(STORAGE_KEY);
      if (!savedStateStr) return;

      const savedState = JSON.parse(savedStateStr);
      const timeSinceLastSave = Date.now() - savedState.timestamp;

      // Only restore if saved less than 1 hour ago
      if (timeSinceLastSave > 3600000) return;

      console.log("Loading timer state from localStorage:", savedState);

      // Restore UI state immediately
      setTimerMode(savedState.timerMode);
      setSelectedTagId(savedState.selectedTagId);

      // Defer timer restoration to next tick to avoid render-during-render
      restorationTimeoutRef.current = setTimeout(() => {
        console.log("Restoring timer state");

        // Restore timer state
        if (
          savedState.timerMode === "pomodoro" &&
          savedState.pomodoroState.isRunning
        ) {
          console.log("Starting pomodoro timer");
          pomodoro.start();
        }

        if (
          savedState.timerMode === "stopwatch" &&
          savedState.stopwatchState.isRunning
        ) {
          console.log("Starting stopwatch timer");
          stopwatch.start();
        }
      }, 0);
    } catch (error) {
      console.error("Failed to load timer state:", error);
    }

    // Cleanup timeout on unmount
    return () => {
      if (restorationTimeoutRef.current) {
        clearTimeout(restorationTimeoutRef.current);
      }
    };
  }, [pomodoro, stopwatch]);

  // Get current timer
  const currentTimer = timerMode === "pomodoro" ? pomodoro : stopwatch;
  const timeLeft =
    timerMode === "pomodoro" ? pomodoro.timeLeft : stopwatch.timeElapsed;
  const totalTime =
    timerMode === "pomodoro"
      ? pomodoro.settings.focusDuration * 60
      : stopwatch.maxDuration;
  const timerColor =
    timerMode === "pomodoro"
      ? pomodoro.getPhaseColor(pomodoro.phase)
      : stopwatch.getStatusColor();
  const timerLabel =
    timerMode === "pomodoro"
      ? pomodoro.getPhaseLabel(pomodoro.phase)
      : stopwatch.getStatusLabel();

  const value: TimerContextType = {
    timerMode,
    setTimerMode,
    pomodoro,
    stopwatch,
    currentTimer,
    timeLeft,
    totalTime,
    timerColor,
    timerLabel,
    selectedTagId,
    setSelectedTagId,
    soundEnabled,
    setSoundEnabled,
    notificationsEnabled,
    setNotificationsEnabled,
  };

  return (
    <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return context;
}
