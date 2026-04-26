import React, { useState } from 'react';
import ttsService from '../../services/tts.service';
import AIBadge from './AIBadge';

interface TTSButtonProps {
  text: string;
  lang?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button';
  className?: string;
}

/**
 * Text-to-Speech Button Component
 * 
 * Allows users to listen to AI-generated content
 * Features:
 * - Play/Pause/Stop controls
 * - AI badge branding
 * - Voice selection dropdown
 */
export const TTSButton: React.FC<TTSButtonProps> = ({
  text,
  lang = 'en-US',
  size = 'md',
  variant = 'button',
  className = '',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const handlePlay = () => {
    if (isPaused) {
      ttsService.resume();
      setIsPaused(false);
    } else {
      ttsService.speak(text, lang);
      setIsPlaying(true);
      
      // Auto-reset when done
      setTimeout(() => {
        setIsPlaying(false);
        setIsPaused(false);
      }, text.length * 50 + 1000);
    }
  };

  const handlePause = () => {
    ttsService.pause();
    setIsPaused(true);
  };

  const handleStop = () => {
    ttsService.stop();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={isPlaying ? handleStop : handlePlay}
        className={`
          ${sizeClasses[size]}
          rounded-lg
          text-blue-600 hover:text-blue-700
          hover:bg-blue-50 dark:hover:bg-blue-900/20
          transition-colors
          ${className}
        `}
        title={isPlaying ? 'Stop listening' : 'Listen with AI'}
      >
        {isPlaying ? (
          <svg className={`${iconSizes[size]} animate-pulse`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          </svg>
        ) : (
          <svg className={iconSizes[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        )}
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Main TTS Button */}
      <button
        onClick={isPlaying ? handleStop : handlePlay}
        className="
          inline-flex items-center gap-1.5 px-3 py-1.5
          text-xs font-medium rounded-lg
          bg-blue-50 text-blue-700 
          hover:bg-blue-100 
          dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30
          transition-all duration-200
        "
      >
        {isPlaying ? (
          <>
            <svg className="w-3.5 h-3.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Stop</span>
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            <span>Listen</span>
            <AIBadge size="sm" variant="subtle" showIcon={false} text="" className="ml-0.5 !px-1" />
          </>
        )}
      </button>

      {/* Pause button (only when playing) */}
      {isPlaying && (
        <button
          onClick={isPaused ? handlePlay : handlePause}
          className="
            p-1.5 rounded-lg
            text-blue-600 hover:text-blue-700
            hover:bg-blue-50 dark:hover:bg-blue-900/20
            transition-colors
          "
          title={isPaused ? 'Resume' : 'Pause'}
        >
          {isPaused ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
};

export default TTSButton;
