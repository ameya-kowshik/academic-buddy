"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Timer, 
  Settings, 
  Maximize,
  Minimize,
  AlertCircle
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

// Hooks
import { useAuth } from "@/hooks/useAuth";
import { useFocusSessions } from "@/hooks/useFocusSessions";
import { useTimer } from "@/contexts/TimerContext";

// Components
import CircularTimer from "@/components/focus/CircularTimer";
import TimerControls from "@/components/focus/TimerControls";
import SessionCompleteModal from "@/components/focus/SessionCompleteModal";
import TagSelector from "@/components/focus/TagSelector";
import TagManager from "@/components/focus/TagManager";
import FocusCoachNotification, { CoachSuggestions } from "@/components/agents/FocusCoachNotification";

// Utils
import { audioManager, notificationManager } from "@/lib/audio";
import { focusUtils } from "@/lib/focus-utils";

function FocusPageContent() {
  
  // Data hooks
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

  // Use global timer context instead of creating new instances
  const {
    timerMode,
    setTimerMode,
    pomodoro,
    stopwatch,
    selectedTagId,
    setSelectedTagId,
    soundEnabled,
    setSoundEnabled,
    notificationsEnabled,
    setNotificationsEnabled
  } = useTimer();

  // UI State
  const [showSettings, setShowSettings] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [coachSuggestions, setCoachSuggestions] = useState<CoachSuggestions | null>(null);
  const settingsRef = useRef<HTMLDivElement>(null);



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

    // Ensure duration is at least 1 minute (API requires positive integer)
    const duration = Math.max(1, Math.round(sessionData.duration));

    try {
      setActionLoading(true);
      const result = await createSession({
        duration,
        sessionType: sessionData.sessionType,
        focusScore: data.focusScore,
        notes: data.notes,
        tagId: selectedTagId || undefined,
        startedAt: sessionData.startTime,
        completedAt: sessionData.endTime
      });
      if (result?.coachSuggestions) {
        setCoachSuggestions(result.coachSuggestions);
      }
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

  // Memoize button states to prevent flickering
  const buttonStates = useMemo(() => ({
    canStart: timerMode === 'pomodoro' 
      ? pomodoro.phase === 'idle' || pomodoro.isPaused 
      : stopwatch.canStart || stopwatch.canResume,
    canPause: currentTimer.isRunning && !currentTimer.isPaused,
    canResume: currentTimer.isPaused,
    canStop: currentTimer.isRunning || currentTimer.isPaused,
    canReset: !currentTimer.isRunning && !currentTimer.isPaused,
    canSkip: timerMode === 'pomodoro' && pomodoro.phase !== 'idle'
  }), [
    timerMode,
    pomodoro.phase,
    pomodoro.isPaused,
    stopwatch.canStart,
    stopwatch.canResume,
    currentTimer.isRunning,
    currentTimer.isPaused
  ]);



  return (
    <div className={`min-h-screen ${isFullscreen ? 'p-8' : ''}`}>
      {/* Header (only in fullscreen for controls) */}
      {!isFullscreen && (
        <header className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Timer className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-100">Focus Sessions</h1>
                <p className="text-sm text-slate-400">Pomodoro timer and focus tracking</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                onClick={() => {
                  setShowSettings(!showSettings);
                  if (!showSettings) {
                    setTimeout(() => {
                      settingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                  }
                }}
                variant="outline"
                size="sm"
                className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-500/20 hover:text-cyan-300 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-md hover:shadow-cyan-500/20"
              >
                <Settings className="w-4 h-4 mr-1" />
                Settings
              </Button>
              
              <Button
                onClick={toggleFullscreen}
                variant="outline"
                size="sm"
                className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-500/20 hover:text-cyan-300 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-md hover:shadow-cyan-500/20"
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
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300"
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
                        : 'bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-500/20 hover:text-cyan-300 hover:border-cyan-400/50 transition-all duration-300'
                      }
                    >
                      Pomodoro Timer
                    </Button>
                    <Button
                      onClick={() => setTimerMode('stopwatch')}
                      variant={timerMode === 'stopwatch' ? 'default' : 'outline'}
                      className={timerMode === 'stopwatch'
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/25 transition-all duration-300 transform hover:scale-105'
                        : 'bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-500/20 hover:text-cyan-300 hover:border-cyan-400/50 transition-all duration-300'
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
              canStart={buttonStates.canStart}
              canPause={buttonStates.canPause}
              canResume={buttonStates.canResume}
              canStop={buttonStates.canStop}
              canReset={buttonStates.canReset}
              canSkip={buttonStates.canSkip}
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

            {/* Pomodoro Settings Panel */}
            {!isFullscreen && timerMode === 'pomodoro' && showSettings && (
              <Card ref={settingsRef} className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-slate-100 text-base flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Timer Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Focus Duration */}
                  <div>
                    <p className="text-slate-300 text-sm font-medium mb-2">Focus Duration</p>
                    <div className="flex flex-wrap gap-2">
                      {[15, 20, 25, 30, 45, 60].map((mins) => (
                        <Button
                          key={mins}
                          size="sm"
                          variant={pomodoro.settings.focusDuration === mins ? 'default' : 'outline'}
                          onClick={() => pomodoro.updateSettings({ focusDuration: mins })}
                          className={pomodoro.settings.focusDuration === mins
                            ? 'bg-red-600 hover:bg-red-500 text-white'
                            : 'bg-slate-800/40 border-slate-600/50 text-slate-300 hover:bg-slate-800/60'}
                        >
                          {mins}m
                        </Button>
                      ))}
                      <input
                        type="number"
                        min={1}
                        max={120}
                        placeholder="Custom"
                        className="w-20 px-2 py-1 text-sm bg-slate-800/40 border border-slate-600/50 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        onBlur={(e) => {
                          const v = parseInt(e.target.value);
                          if (v >= 1 && v <= 120) pomodoro.updateSettings({ focusDuration: v });
                          e.target.value = '';
                        }}
                      />
                    </div>
                  </div>

                  {/* Short Break */}
                  <div>
                    <p className="text-slate-300 text-sm font-medium mb-2">Short Break</p>
                    <div className="flex flex-wrap gap-2">
                      {[3, 5, 10, 15].map((mins) => (
                        <Button
                          key={mins}
                          size="sm"
                          variant={pomodoro.settings.shortBreakDuration === mins ? 'default' : 'outline'}
                          onClick={() => pomodoro.updateSettings({ shortBreakDuration: mins })}
                          className={pomodoro.settings.shortBreakDuration === mins
                            ? 'bg-green-600 hover:bg-green-500 text-white'
                            : 'bg-slate-800/40 border-slate-600/50 text-slate-300 hover:bg-slate-800/60'}
                        >
                          {mins}m
                        </Button>
                      ))}
                      <input
                        type="number"
                        min={1}
                        max={30}
                        placeholder="Custom"
                        className="w-20 px-2 py-1 text-sm bg-slate-800/40 border border-slate-600/50 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        onBlur={(e) => {
                          const v = parseInt(e.target.value);
                          if (v >= 1 && v <= 30) pomodoro.updateSettings({ shortBreakDuration: v });
                          e.target.value = '';
                        }}
                      />
                    </div>
                  </div>

                  {/* Long Break */}
                  <div>
                    <p className="text-slate-300 text-sm font-medium mb-2">Long Break</p>
                    <div className="flex flex-wrap gap-2">
                      {[10, 15, 20, 30].map((mins) => (
                        <Button
                          key={mins}
                          size="sm"
                          variant={pomodoro.settings.longBreakDuration === mins ? 'default' : 'outline'}
                          onClick={() => pomodoro.updateSettings({ longBreakDuration: mins })}
                          className={pomodoro.settings.longBreakDuration === mins
                            ? 'bg-blue-600 hover:bg-blue-500 text-white'
                            : 'bg-slate-800/40 border-slate-600/50 text-slate-300 hover:bg-slate-800/60'}
                        >
                          {mins}m
                        </Button>
                      ))}
                      <input
                        type="number"
                        min={1}
                        max={60}
                        placeholder="Custom"
                        className="w-20 px-2 py-1 text-sm bg-slate-800/40 border border-slate-600/50 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        onBlur={(e) => {
                          const v = parseInt(e.target.value);
                          if (v >= 1 && v <= 60) pomodoro.updateSettings({ longBreakDuration: v });
                          e.target.value = '';
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar (hidden in fullscreen) */}
          {!isFullscreen && (
            <div className="space-y-6">
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

      <FocusCoachNotification coachSuggestions={coachSuggestions} />
    </div>
  );
}

export default function FocusPage() {
  return (
    <AppLayout>
      <FocusPageContent />
    </AppLayout>
  );
}