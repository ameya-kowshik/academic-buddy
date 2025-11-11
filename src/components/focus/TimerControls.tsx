"use client";

import { Button } from "@/components/ui/button";
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  SkipForward,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  Maximize,
  Minimize
} from "lucide-react";

interface TimerControlsProps {
  // Timer state
  isRunning: boolean;
  isPaused: boolean;
  canStart: boolean;
  canPause: boolean;
  canResume: boolean;
  canStop: boolean;
  canReset: boolean;
  canSkip?: boolean;
  
  // Actions
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onReset: () => void;
  onSkip?: () => void;
  
  // Settings
  soundEnabled: boolean;
  onToggleSound: () => void;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
  
  // Fullscreen
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  
  // Loading state
  loading?: boolean;
}

export default function TimerControls({
  isRunning,
  isPaused,
  canStart,
  canPause,
  canResume,
  canStop,
  canReset,
  canSkip = false,
  onStart,
  onPause,
  onStop,
  onReset,
  onSkip,
  soundEnabled,
  onToggleSound,
  notificationsEnabled,
  onToggleNotifications,
  isFullscreen = false,
  onToggleFullscreen,
  loading = false
}: TimerControlsProps) {

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Main Controls */}
      <div className="flex items-center space-x-4">
        {/* Start/Resume/Pause Button */}
        {canStart && (
          <Button
            onClick={onStart}
            disabled={loading}
            size="lg"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-medium px-8 py-3 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/25 disabled:opacity-50"
          >
            <Play className="w-5 h-5 mr-2" />
            Start
          </Button>
        )}

        {canResume && (
          <Button
            onClick={onStart}
            disabled={loading}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium px-8 py-3 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50"
          >
            <Play className="w-5 h-5 mr-2" />
            Resume
          </Button>
        )}

        {canPause && (
          <Button
            onClick={onPause}
            disabled={loading}
            size="lg"
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium px-8 py-3 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-amber-500/25 disabled:opacity-50"
          >
            <Pause className="w-5 h-5 mr-2" />
            Pause
          </Button>
        )}

        {/* Stop Button */}
        {canStop && (
          <Button
            onClick={onStop}
            disabled={loading}
            size="lg"
            variant="outline"
            className="bg-slate-900/50 border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 px-6 py-3 transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
          >
            <Square className="w-5 h-5 mr-2" />
            Stop
          </Button>
        )}
      </div>

      {/* Secondary Controls */}
      <div className="flex items-center space-x-3">
        {/* Reset Button */}
        {canReset && (
          <Button
            onClick={onReset}
            disabled={loading}
            size="sm"
            variant="outline"
            className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-500/20 hover:text-cyan-300 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-md hover:shadow-cyan-500/20 disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        )}

        {/* Skip Button (Pomodoro only) */}
        {canSkip && onSkip && (
          <Button
            onClick={onSkip}
            disabled={loading}
            size="sm"
            variant="outline"
            className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-500/20 hover:text-cyan-300 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-md hover:shadow-cyan-500/20 disabled:opacity-50"
          >
            <SkipForward className="w-4 h-4 mr-1" />
            Skip
          </Button>
        )}

        {/* Sound Toggle */}
        <Button
          onClick={onToggleSound}
          disabled={loading}
          size="sm"
          variant="outline"
          className={`bg-slate-800/40 border-slate-600/50 transition-all duration-300 disabled:opacity-50 ${
            soundEnabled 
              ? 'text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/50' 
              : 'text-slate-200 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-500/20 hover:text-cyan-300 hover:border-cyan-400/50'
          }`}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </Button>

        {/* Notifications Toggle */}
        <Button
          onClick={onToggleNotifications}
          disabled={loading}
          size="sm"
          variant="outline"
          className={`bg-slate-800/40 border-slate-600/50 transition-all duration-300 disabled:opacity-50 ${
            notificationsEnabled 
              ? 'text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/50' 
              : 'text-slate-200 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-500/20 hover:text-cyan-300 hover:border-cyan-400/50'
          }`}
        >
          {notificationsEnabled ? (
            <Bell className="w-4 h-4" />
          ) : (
            <BellOff className="w-4 h-4" />
          )}
        </Button>

        {/* Fullscreen Toggle */}
        {onToggleFullscreen && (
          <Button
            onClick={onToggleFullscreen}
            disabled={loading}
            size="sm"
            variant="outline"
            className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-500/20 hover:text-cyan-300 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-md hover:shadow-cyan-500/20 disabled:opacity-50"
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>

      {/* Status Text */}
      <div className="text-center">
        {loading && (
          <p className="text-sm text-slate-400">Processing...</p>
        )}
        
        {!loading && isPaused && (
          <p className="text-sm text-amber-400">Session paused - click Resume to continue</p>
        )}
        
        {!loading && isRunning && !isPaused && (
          <p className="text-sm text-green-400">Session active - stay focused!</p>
        )}
        
        {!loading && !isRunning && !isPaused && canStart && (
          <p className="text-sm text-slate-400">Ready to start your focus session</p>
        )}
      </div>
    </div>
  );
}