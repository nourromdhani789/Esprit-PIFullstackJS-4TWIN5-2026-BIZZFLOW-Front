import { useState, useEffect, useCallback } from 'react';

interface PomodoroTimerProps {
  className?: string;
}

export function PomodoroTimer({ className = '' }: PomodoroTimerProps) {
  // Timer settings (in seconds)
  const WORK_TIME = 25 * 60; // 25 minutes
  const BREAK_TIME = 5 * 60; // 5 minutes

  // State
  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isActive, setIsActive] = useState(false);
  const [session, setSession] = useState<'work' | 'break'>('work');
  const [completedSessions, setCompletedSessions] = useState(0);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const getProgress = (): number => {
    const totalTime = session === 'work' ? WORK_TIME : BREAK_TIME;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  // Timer tick
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // Timer completed
      handleTimerComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    setIsActive(false);
    
    if (session === 'work') {
      // Work session completed - switch to break
      setCompletedSessions((prev) => prev + 1);
      setSession('break');
      setTimeLeft(BREAK_TIME);
      
      // Show notification if supported
      if ('Notification' in window && typeof Notification === 'function' && Notification.permission === 'granted') {
        new Notification('Work session complete! 🎉', {
          body: 'Time for a 5-minute break.',
          icon: '/favicon.ico'
        });
      }
    } else {
      // Break completed - switch back to work
      setSession('work');
      setTimeLeft(WORK_TIME);
      
      if ('Notification' in window && typeof Notification === 'function' && Notification.permission === 'granted') {
        new Notification('Break over! 💪', {
          body: 'Ready to focus for another 25 minutes?',
          icon: '/favicon.ico'
        });
      }
    }
  }, [session]);

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && typeof Notification.requestPermission === 'function') {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
    }
  };

  // Control functions
  const startTimer = () => {
    setIsActive(true);
    requestNotificationPermission();
  };

  const pauseTimer = () => {
    setIsActive(false);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(session === 'work' ? WORK_TIME : BREAK_TIME);
  };

  const switchSession = () => {
    setIsActive(false);
    if (session === 'work') {
      setSession('break');
      setTimeLeft(BREAK_TIME);
    } else {
      setSession('work');
      setTimeLeft(WORK_TIME);
    }
  };

  // Get session label and color
  const getSessionStyles = () => {
    if (session === 'work') {
      return {
        label: 'Focus Time',
        bgColor: 'bg-rose-500',
        textColor: 'text-rose-600',
        ringColor: 'ring-rose-500',
        gradient: 'from-rose-500 to-orange-500',
        lightBg: 'bg-rose-50'
      };
    }
    return {
      label: 'Break Time',
      bgColor: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      ringColor: 'ring-emerald-500',
      gradient: 'from-emerald-500 to-teal-500',
      lightBg: 'bg-emerald-50'
    };
  };

  const styles = getSessionStyles();
  const progress = getProgress();

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⏱️</span>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Focus Timer
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Sessions: {completedSessions}
          </span>
        </div>
      </div>

      {/* Timer Display */}
      <div className="flex flex-col items-center mb-6">
        {/* Session Badge */}
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${styles.lightBg} ${styles.textColor}`}>
          <span className={`w-2 h-2 rounded-full mr-2 ${styles.bgColor} ${isActive ? 'animate-pulse' : ''}`} />
          {styles.label}
        </div>

        {/* Circular Progress Timer */}
        <div className="relative w-48 h-48 mb-4">
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Progress circle */}
            <circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 88}`}
              strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
              className={`${styles.textColor} transition-all duration-1000 ease-linear`}
            />
          </svg>
          
          {/* Time display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-5xl font-bold ${styles.textColor} tabular-nums`}>
              {formatTime(timeLeft)}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {session === 'work' ? '25:00' : '05:00'} total
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
          <div
            className={`h-2 rounded-full bg-gradient-to-r ${styles.gradient} transition-all duration-1000 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {!isActive ? (
          <button
            onClick={startTimer}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white bg-gradient-to-r ${styles.gradient} hover:opacity-90 transition-opacity shadow-lg`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            Start
          </button>
        ) : (
          <button
            onClick={pauseTimer}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Pause
          </button>
        )}

        <button
          onClick={resetTimer}
          className="flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset
        </button>

        <button
          onClick={switchSession}
          className="flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          {session === 'work' ? 'Break' : 'Work'}
        </button>
      </div>

      {/* Tips */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <span className="font-medium">💡 Tip:</span>{' '}
          {session === 'work' 
            ? 'Focus on one task. Turn off notifications and avoid distractions.' 
            : 'Take a walk, stretch, or rest your eyes. Don\'t check work emails!'}
        </p>
      </div>
    </div>
  );
}
