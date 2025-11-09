"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Timer, 
  Settings, 
  BarChart3,
  Maximize,
  Minimize,
  AlertCircle
} from "lucide-react";

// Hooks
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";
import { useFocusSessions } from "@/hooks/useFocusSessions";
import { usePomodoro, PomodoroSettings } from "@/hooks/usePomodoro";
import { useStopwatch } from "@/hooks/useStopwatch";

// Components
import CircularTimer from "@/components/focus/CircularTimer";
import TimerControls from "@/components/focus/TimerControls";
import SessionCompleteModal from "@/components/focus/SessionCompleteModal";
import TagSelector from "@/components/focus/TagSelector";
import TagManager from "@/components/focus/TagManager";
import TaskSelector from "@/components/focus/TaskSelector";

// Utils
import { audioManager, notificationManager } from "@/lib/audio";
import { focusUtils } from "@/lib/focus-utils";

type TimerMode = 'pomodoro' | 'stopwatch';

export default function FocusPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // Data hooks
  const { tasks, loading: tasksLoading } = useTasks();
  const {
    tags,
    createSession,
    createTag,
    updateTag,
    deleteTag,
    loading: sessionsLoading,
    error: sessionsError,
    clearError
  } = useFocusSessions();

  // Timer hooks
  const pomodoro = usePomodoro();
  const stopwatch = useStopwatch();

  // UI State
  const [timerMode, setTimerMode] = useState<TimerMode>('pomodoro');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  // Initialize notifications
  useEffect(() => {
    const initNotifications = async () => {
      if (notificationManager.isSupported) {
        const hasPermission = await notificationManager.requestPermission();
        setNotificationsEnabled(hasPermission);
      }
    };
    initNotifications();
  }, []);

  // Setup audio and notification managers
  useEffect(() => {
    audioManager.setEnabled(soundEnabled);
    notificationManager.setEnabled(notificationsEnabled);
  }, [soundEnabled, notificationsEnabled]);

  // Setup Pomodoro event handlers
  useEffect(() => {
    pomodoro.setOnPhaseChange((phase) => {
      if (phase === 'focus') {
        if (soundEnabled) audioManager.playBreakEnd();
        if (notificationsEnabled) notificationManager.notifyBreakEnd();
      } else {
        if (soundEnabled) audioManager.playBreakStart();
        if (notificationsEnabled) {
          const isLongBreak = phase === 'longBreak';
          const duration = isLongBreak ? pomodoro.settings.longBreakDuration : pomodoro.settings.shortBreakDuration;
          notificationManager.notifyBreakStart(duration, isLongBreak);
        }
      }
    });

    pomodoro.setOnSessionComplete((duration) => {
      if (soundEnabled) audioManager.playFocusEnd();
      if (notificationsEnabled) notificationManager.notifyFocusEnd();
      
      // Show session complete modal
      setSessionData({
        duration,
        sessionType: 'POMODORO',
        startTime: new Date(Date.now() - duration * 60 * 1000),
        endTime: new Date()
      });
      setShowSessionModal(true);
    });
  }, [pomodoro, soundEnabled, notificationsEnabled]);

  // Setup Stopwatch event handlers
  useEffect(() => {
    stopwatch.setOnMaxTimeReached(() => {
      if (soundEnabled) audioManager.playWarning();
      if (notificationsEnabled) notificationManager.notifyMaxTimeReached();
    });

    stopwatch.setOnSessionComplete((duration) => {
      if (soundEnabled) audioManager.playCompletion();
      
      // Show session complete modal
      setSessionData({
        duration,
        sessionType: 'STOPWATCH',
        startTime: new Date(Date.now() - duration * 60 * 1000),
        endTime: new Date()
      });
      setShowSessionModal(true);
    });
  }, [stopwatch, soundEnabled, notificationsEnabled]);

  // Fullscreen handling
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Timer control handlers
  const handleStart = () => {
    if (timerMode === 'pomodoro') {
      pomodoro.start();
      if (soundEnabled) audioManager.playFocusStart();
      if (notificationsEnabled) notificationManager.notifyFocusStart(pomodoro.settings.focusDuration);
    } else {
      stopwatch.start();
      if (soundEnabled) audioManager.playFocusStart();
      if (notificationsEnabled) notificationManager.notifyFocusStart(0); // Stopwatch has no set duration
    }
  };

  const handlePause = () => {
    if (timerMode === 'pomodoro') {
      pomodoro.pause();
    } else {
      stopwatch.pause();
    }
  };

  const handleStop = () => {
    if (timerMode === 'pomodoro') {
      pomodoro.stop();
    } else {
      stopwatch.stop();
    }
  };

  const handleReset = () => {
    if (timerMode === 'pomodoro') {
      pomodoro.reset();
    } else {
      stopwatch.reset();
    }
  };

  // Session save handler
  const handleSaveSession = async (data: { focusScore?: number; notes?: string }) => {
    if (!sessionData) return;

    try {
      setActionLoading(true);
      await createSession({
        duration: sessionData.duration,
        sessionType: sessionData.sessionType,
        focusScore: data.focusScore,
        notes: data.notes,
        taskId: selectedTaskId || undefined,
        tagId: selectedTagId || undefined,
        startedAt: sessionData.startTime,
        completedAt: sessionData.endTime
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Get current timer state
  const currentTimer = timerMode === 'pomodoro' ? pomodoro : stopwatch;
  const timeLeft = timerMode === 'pomodoro' ? pomodoro.timeLeft : stopwatch.timeElapsed;
  const totalTime = timerMode === 'pomodoro' 
    ? pomodoro.settings.focusDuration * 60 
    : stopwatch.maxDuration;
  const timerColor = timerMode === 'pomodoro' 
    ? pomodoro.getPhaseColor(pomodoro.phase)
    : stopwatch.getStatusColor();
  const timerLabel = timerMode === 'pomodoro'
    ? pomodoro.getPhaseLabel(pomodoro.phase)
    : stopwatch.getStatusLabel();

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Timer className="w-8 h-8 text-cyan-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 ${isFullscreen ? 'p-8' : ''}`}>
      {/* Header (hidden in fullscreen) */}
      {!isFullscreen && (
        <header className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-40">
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
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <Timer className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-100">Focus Sessions</h1>
                  <p className="text-sm text-slate-400">Pomodoro timer and focus tracking</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Link href="/focus/history">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-cyan-400 hover:border-slate-600 transition-all duration-300"
                >
                  <BarChart3 className="w-4 h-4 mr-1" />
                  History
                </Button>
              </Link>
              
              <Button
                onClick={() => setShowSettings(!showSettings)}
                variant="outline"
                size="sm"
                className="bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-cyan-400 hover:border-slate-600 transition-all duration-300"
              >
                <Settings className="w-4 h-4 mr-1" />
                Settings
              </Button>
              
              <Button
                onClick={toggleFullscreen}
                variant="outline"
                size="sm"
                className="bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-cyan-400 hover:border-slate-600 transition-all duration-300"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`container mx-auto px-6 py-8 max-w-6xl ${isFullscreen ? 'max-w-none h-full flex items-center justify-center' : ''}`}>
        {/* Error Display */}
        {sessionsError && (
          <Card className="bg-red-500/10 border-red-500/20 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-red-400">{sessionsError}</p>
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

        <div className={`${isFullscreen ? 'text-center' : 'grid lg:grid-cols-3 gap-8'}`}>
          {/* Timer Section */}
          <div className={`${isFullscreen ? 'space-y-8' : 'lg:col-span-2 space-y-6'}`}>
            {/* Timer Mode Toggle */}
            {!isFullscreen && (
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center space-x-2">
                    <Button
                      onClick={() => setTimerMode('pomodoro')}
                      variant={timerMode === 'pomodoro' ? 'default' : 'outline'}
                      className={timerMode === 'pomodoro' 
                        ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-lg shadow-red-500/25 transition-all duration-300 transform hover:scale-105'
                        : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-cyan-400 hover:border-slate-600 transition-all duration-300'
                      }
                    >
                      Pomodoro Timer
                    </Button>
                    <Button
                      onClick={() => setTimerMode('stopwatch')}
                      variant={timerMode === 'stopwatch' ? 'default' : 'outline'}
                      className={timerMode === 'stopwatch'
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/25 transition-all duration-300 transform hover:scale-105'
                        : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-cyan-400 hover:border-slate-600 transition-all duration-300'
                      }
                    >
                      Stopwatch
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timer Display */}
            <div className="flex justify-center">
              <CircularTimer
                timeLeft={timeLeft}
                totalTime={totalTime}
                isRunning={currentTimer.isRunning}
                isPaused={currentTimer.isPaused}
                color={timerColor}
                size={isFullscreen ? 400 : 300}
                label={timerLabel}
              />
            </div>

            {/* Timer Controls */}
            <TimerControls
              isRunning={currentTimer.isRunning}
              isPaused={currentTimer.isPaused}
              canStart={timerMode === 'pomodoro' ? pomodoro.phase === 'idle' || pomodoro.isPaused : stopwatch.canStart || stopwatch.canResume}
              canPause={currentTimer.isRunning}
              canResume={currentTimer.isPaused}
              canStop={currentTimer.isRunning || currentTimer.isPaused}
              canReset={!currentTimer.isRunning && !currentTimer.isPaused}
              canSkip={timerMode === 'pomodoro' && pomodoro.phase !== 'idle'}
              onStart={handleStart}
              onPause={handlePause}
              onStop={handleStop}
              onReset={handleReset}
              onSkip={timerMode === 'pomodoro' ? pomodoro.skipPhase : undefined}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(!soundEnabled)}
              notificationsEnabled={notificationsEnabled}
              onToggleNotifications={() => setNotificationsEnabled(!notificationsEnabled)}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
              loading={actionLoading}
            />

            {/* Session Info */}
            {!isFullscreen && timerMode === 'pomodoro' && (
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-cyan-400">{pomodoro.cycleCount}</p>
                      <p className="text-sm text-slate-400">Cycles</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-400">
                        {Math.floor(pomodoro.totalFocusTime / 3600)}h {Math.floor((pomodoro.totalFocusTime % 3600) / 60)}m
                      </p>
                      <p className="text-sm text-slate-400">Focus Time</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-400">{pomodoro.settings.focusDuration}m</p>
                      <p className="text-sm text-slate-400">Focus Duration</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-400">{pomodoro.settings.shortBreakDuration}m</p>
                      <p className="text-sm text-slate-400">Break Duration</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar (hidden in fullscreen) */}
          {!isFullscreen && (
            <div className="space-y-6">
              {/* Task Selector */}
              <TaskSelector
                tasks={tasks}
                selectedTaskId={selectedTaskId}
                onSelectTask={setSelectedTaskId}
                loading={tasksLoading}
              />

              {/* Tag Selector */}
              <TagSelector
                tags={tags}
                selectedTagId={selectedTagId}
                onSelectTag={setSelectedTagId}
                onManageTags={() => setShowTagManager(true)}
                loading={sessionsLoading}
              />
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <SessionCompleteModal
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        onSave={handleSaveSession}
        sessionData={sessionData}
        loading={actionLoading}
      />

      <TagManager
        isOpen={showTagManager}
        onClose={() => setShowTagManager(false)}
        tags={tags}
        onCreateTag={createTag}
        onUpdateTag={updateTag}
        onDeleteTag={deleteTag}
        loading={sessionsLoading}
      />
    </div>
  );
}