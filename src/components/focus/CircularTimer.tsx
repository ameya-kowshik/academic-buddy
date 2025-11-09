"use client";

import { useEffect, useState } from 'react';

interface CircularTimerProps {
  timeLeft: number; // seconds
  totalTime: number; // seconds
  isRunning: boolean;
  isPaused: boolean;
  color: string;
  size?: number;
  strokeWidth?: number;
  showTime?: boolean;
  label?: string;
}

export default function CircularTimer({
  timeLeft,
  totalTime,
  isRunning,
  isPaused,
  color,
  size = 300,
  strokeWidth = 8,
  showTime = true,
  label
}: CircularTimerProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (totalTime > 0) {
      const newProgress = ((totalTime - timeLeft) / totalTime) * 100;
      setProgress(Math.min(100, Math.max(0, newProgress)));
    }
  }, [timeLeft, totalTime]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusOpacity = () => {
    if (isPaused) return 0.6;
    if (!isRunning) return 0.8;
    return 1;
  };

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90 transition-opacity duration-300"
        style={{ opacity: getStatusOpacity() }}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-slate-700/30"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-in-out"
          style={{
            filter: isRunning && !isPaused ? 'drop-shadow(0 0 8px currentColor)' : 'none'
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {showTime && (
          <div className="space-y-2">
            <div 
              className="text-4xl md:text-5xl font-mono font-bold text-white transition-all duration-300"
              style={{ 
                textShadow: isRunning && !isPaused ? `0 0 20px ${color}` : 'none',
                color: isPaused ? '#94a3b8' : 'white'
              }}
            >
              {formatTime(timeLeft)}
            </div>
            
            {label && (
              <div className="text-sm md:text-base text-slate-400 font-medium">
                {label}
              </div>
            )}
            
            {/* Status indicator */}
            <div className="flex items-center justify-center space-x-2">
              {isPaused && (
                <div className="flex items-center space-x-1 text-amber-400">
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium">PAUSED</span>
                </div>
              )}
              
              {isRunning && !isPaused && (
                <div className="flex items-center space-x-1" style={{ color }}>
                  <div 
                    className="w-2 h-2 rounded-full animate-pulse" 
                    style={{ backgroundColor: color }}
                  ></div>
                  <span className="text-xs font-medium">ACTIVE</span>
                </div>
              )}
              
              {!isRunning && !isPaused && timeLeft > 0 && (
                <div className="flex items-center space-x-1 text-slate-500">
                  <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                  <span className="text-xs font-medium">READY</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pulse animation for active state */}
      {isRunning && !isPaused && (
        <div 
          className="absolute inset-0 rounded-full animate-ping opacity-20"
          style={{ 
            backgroundColor: color,
            animationDuration: '2s'
          }}
        />
      )}
    </div>
  );
}