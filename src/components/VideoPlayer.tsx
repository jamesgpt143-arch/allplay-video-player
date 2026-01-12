import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  SkipBack,
  SkipForward,
} from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  drmConfig?: {
    type: 'clearkey' | 'widevine';
    keyId?: string;
    key?: string;
    licenseServer?: string;
  };
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, drmConfig }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shakaLoaded, setShakaLoaded] = useState(false);

  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Load Shaka Player dynamically
  useEffect(() => {
    const loadShaka = async () => {
      try {
        const shaka = await import('shaka-player');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).shaka = shaka.default || shaka;
        setShakaLoaded(true);
      } catch (e) {
        console.error('Failed to load Shaka Player:', e);
        setError('Failed to load video player library');
      }
    };
    loadShaka();
  }, []);

  const initPlayer = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shaka = (window as any).shaka;
    if (!videoRef.current || !url || !shaka) return;

    setIsLoading(true);
    setError(null);

    // Destroy existing player
    if (playerRef.current) {
      await playerRef.current.destroy();
    }

    // Install polyfills
    shaka.polyfill.installAll();

    if (!shaka.Player.isBrowserSupported()) {
      setError('Browser not supported for video playback');
      setIsLoading(false);
      return;
    }

    const player = new shaka.Player();
    await player.attach(videoRef.current);
    playerRef.current = player;

    // Configure DRM if provided
    if (drmConfig) {
      if (drmConfig.type === 'clearkey' && drmConfig.keyId && drmConfig.key) {
        player.configure({
          drm: {
            clearKeys: {
              [drmConfig.keyId]: drmConfig.key,
            },
          },
        });
      } else if (drmConfig.type === 'widevine' && drmConfig.licenseServer) {
        player.configure({
          drm: {
            servers: {
              'com.widevine.alpha': drmConfig.licenseServer,
            },
          },
        });
      }
    }

    // Error handler
    player.addEventListener('error', (event: unknown) => {
      console.error('Shaka Player Error:', event);
      setError('Error loading video. Please check the URL and DRM settings.');
    });

    try {
      await player.load(url);
      setIsLoading(false);
    } catch (e) {
      console.error('Error loading video:', e);
      setError('Failed to load video. Check URL and DRM configuration.');
      setIsLoading(false);
    }
  }, [url, drmConfig]);

  useEffect(() => {
    if (shakaLoaded && url) {
      initPlayer();
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [shakaLoaded, initPlayer, url]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = value;
      videoRef.current.muted = value === 0;
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current && videoRef.current && duration) {
      const rect = progressRef.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pos * duration;
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        await containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    hideControlsTimeout.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const bufferedProgress = duration ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-player-bg rounded-xl overflow-hidden player-glow group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black"
        onClick={togglePlay}
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center p-6">
            <p className="text-destructive text-lg font-medium mb-2">{error}</p>
            <button
              onClick={initPlayer}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Play/Pause Overlay */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          showControls && !isLoading && !error ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <button
          onClick={togglePlay}
          className="w-20 h-20 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30 flex items-center justify-center hover:bg-primary/30 transition-all hover:scale-110"
        >
          {isPlaying ? (
            <Pause className="w-10 h-10 text-primary-foreground" />
          ) : (
            <Play className="w-10 h-10 text-primary-foreground ml-1" />
          )}
        </button>
      </div>

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-12 transition-opacity duration-300 ${
          showControls && !isLoading && !error ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress Bar */}
        <div
          ref={progressRef}
          className="relative h-1.5 bg-muted/30 rounded-full cursor-pointer group/progress mb-4"
          onClick={handleProgressClick}
        >
          {/* Buffered */}
          <div
            className="absolute top-0 left-0 h-full bg-player-buffer rounded-full"
            style={{ width: `${bufferedProgress}%` }}
          />
          {/* Progress */}
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary-foreground rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 8px)` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-2 rounded-full hover:bg-muted/30 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>

            {/* Skip Back */}
            <button
              onClick={() => skip(-10)}
              className="p-2 rounded-full hover:bg-muted/30 transition-colors"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            {/* Skip Forward */}
            <button
              onClick={() => skip(10)}
              className="p-2 rounded-full hover:bg-muted/30 transition-colors"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2 group/volume">
              <button
                onClick={toggleMute}
                className="p-2 rounded-full hover:bg-muted/30 transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/volume:w-20 transition-all duration-300 accent-primary"
              />
            </div>

            {/* Time */}
            <span className="text-sm text-muted-foreground tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Settings */}
            <button className="p-2 rounded-full hover:bg-muted/30 transition-colors">
              <Settings className="w-5 h-5" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full hover:bg-muted/30 transition-colors"
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
