import { useTTS } from '../../../services/tts.service';

interface AudioPlayerProps {
  text: string;
  lang?: string;
  label?: string;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  text, 
  lang = 'en-US', 
  label = '🔊 Play',
  className = '' 
}) => {
  const { speak, pause, resume, stop, isPlaying, isPaused, setRate, currentRate, supported } = useTTS();

  if (!supported) {
    return (
      <span className="text-xs text-gray-400" title="Text-to-Speech not supported in this browser">
        🔇
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {!isPlaying ? (
        <button
          onClick={() => speak(text, lang)}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-sm transition-colors"
          title="Play audio"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {label}
        </button>
      ) : (
        <>
          <button
            onClick={isPaused ? resume : pause}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md text-sm transition-colors"
          >
            {isPaused ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={stop}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-md text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
            Stop
          </button>
          <select
            value={currentRate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="text-sm border rounded-md px-2 py-1 bg-white dark:bg-gray-700"
            title="Playback speed"
          >
            <option value={0.5}>0.5x</option>
            <option value={0.75}>0.75x</option>
            <option value={1}>1x</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2x</option>
          </select>
        </>
      )}
    </div>
  );
};

export default AudioPlayer;
