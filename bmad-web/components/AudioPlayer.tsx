import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

interface AudioPlayerProps {
  src: string;
  duration: number;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  gloveMode?: boolean;
}

interface AudioPlayerRef {
  currentTime: number;
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
}

const AudioPlayer = forwardRef<HTMLAudioElement, AudioPlayerProps>(({
  src,
  duration,
  currentTime,
  onTimeUpdate,
  gloveMode = false
}, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  // Expose audio element to parent via ref
  useImperativeHandle(ref, () => audioRef.current!, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      onTimeUpdate(audio.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    
    const handleProgress = () => {
      if (audio.buffered.length > 0) {
        const progress = audio.buffered.end(audio.buffered.length - 1) / audio.duration;
        setLoadingProgress(progress * 100);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('progress', handleProgress);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('progress', handleProgress);
    };
  }, [onTimeUpdate]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle play/pause
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  // Handle seek (progress bar click)
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const progressBar = progressRef.current;
    if (!audio || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    audio.currentTime = newTime;
  };

  // Skip forward/backward
  const skipTime = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
    audio.currentTime = newTime;
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  // Toggle mute
  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  // Change playback rate
  const changePlaybackRate = (rate: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const buttonSize = gloveMode ? '48px' : '40px';
  const buttonClass = `flex items-center justify-center rounded-lg font-medium transition-colors ${gloveMode ? 'text-lg' : 'text-base'}`;

  return (
    <div className="audio-player bg-white border border-gray-200 rounded-lg p-4">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
      />

      {/* Progress bar with chunky design for gloves */}
      <div className="progress-section mb-4">
        <div 
          ref={progressRef}
          className="progress-bar relative bg-gray-200 rounded-full cursor-pointer"
          style={{ height: gloveMode ? '16px' : '8px' }}
          onClick={handleProgressClick}
        >
          {/* Loading progress */}
          <div 
            className="loading-progress absolute top-0 left-0 h-full bg-gray-300 rounded-full"
            style={{ width: `${loadingProgress}%` }}
          />
          
          {/* Playback progress */}
          <div 
            className="playback-progress absolute top-0 left-0 h-full bg-blue-600 rounded-full"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
          
          {/* Progress handle for easier grabbing with gloves */}
          <div 
            className="progress-handle absolute top-1/2 transform -translate-y-1/2 bg-blue-800 rounded-full shadow-lg"
            style={{ 
              left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
              width: gloveMode ? '20px' : '12px',
              height: gloveMode ? '20px' : '12px',
              marginLeft: gloveMode ? '-10px' : '-6px'
            }}
          />
        </div>
        
        {/* Time display */}
        <div className="time-display flex justify-between mt-2 text-sm text-gray-600">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main controls - LARGE buttons for gloves */}
      <div className="main-controls grid grid-cols-3 gap-3 mb-4">
        {/* Skip backward 15s */}
        <button
          onClick={() => skipTime(-15)}
          className={`${buttonClass} bg-gray-100 hover:bg-gray-200 text-gray-700`}
          style={{ height: buttonSize }}
          title="Skip back 15 seconds"
        >
          ◀◀ 15s
        </button>

        {/* Play/Pause - EXTRA LARGE */}
        <button
          onClick={togglePlayPause}
          className={`${buttonClass} ${
            isPlaying 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
          style={{ height: buttonSize }}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸️ PAUSE' : '▶️ PLAY'}
        </button>

        {/* Skip forward 15s */}
        <button
          onClick={() => skipTime(15)}
          className={`${buttonClass} bg-gray-100 hover:bg-gray-200 text-gray-700`}
          style={{ height: buttonSize }}
          title="Skip forward 15 seconds"
        >
          15s ▶▶
        </button>
      </div>

      {/* Secondary controls */}
      <div className="secondary-controls flex items-center justify-between">
        
        {/* Volume control */}
        <div className="volume-control flex items-center gap-2">
          <button
            onClick={toggleMute}
            className={`${buttonClass} bg-gray-100 hover:bg-gray-200 text-gray-700 px-3`}
            style={{ height: gloveMode ? '40px' : '32px' }}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : volume > 0.5 ? '🔊' : '🔉'}
          </button>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="volume-slider w-20"
            style={{ height: gloveMode ? '16px' : '8px' }}
          />
        </div>

        {/* Playback rate */}
        <div className="playback-rate flex items-center gap-1">
          <span className="text-xs text-gray-600">Speed:</span>
          <select
            value={playbackRate}
            onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
            className="text-xs border rounded px-2 py-1"
            style={{ minHeight: gloveMode ? '32px' : '24px' }}
          >
            <option value={0.75}>0.75x</option>
            <option value={1}>1x</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2x</option>
          </select>
        </div>

        {/* Audio quality indicator */}
        <div className="quality-indicator flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${loadingProgress > 90 ? 'bg-green-500' : loadingProgress > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-600">
            {loadingProgress > 90 ? 'HD' : loadingProgress > 50 ? 'Good' : 'Loading'}
          </span>
        </div>
      </div>

      {/* Mobile responsive adjustments */}
      <style jsx>{`
        @media (max-width: 640px) {
          .main-controls {
            grid-template-columns: 1fr 2fr 1fr;
            gap: 0.5rem;
          }
          
          .secondary-controls {
            flex-direction: column;
            align-items: stretch;
            gap: 0.5rem;
          }
          
          .volume-control {
            justify-content: center;
          }
          
          .playback-rate {
            justify-content: center;
          }
        }
        
        /* Custom slider styling for gloves */
        .volume-slider {
          -webkit-appearance: none;
          background: #e5e7eb;
          border-radius: 5px;
          outline: none;
        }
        
        .volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: ${gloveMode ? '20px' : '16px'};
          height: ${gloveMode ? '20px' : '16px'};
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .volume-slider::-moz-range-thumb {
          width: ${gloveMode ? '20px' : '16px'};
          height: ${gloveMode ? '20px' : '16px'};
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
});

AudioPlayer.displayName = 'AudioPlayer';

export default AudioPlayer;