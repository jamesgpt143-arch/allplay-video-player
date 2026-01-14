import { useState, useCallback } from 'react';
import { Film } from 'lucide-react';
import VideoPlayer from '@/components/VideoPlayer';
import PlayerControls from '@/components/PlayerControls';
import Playlist, { PlaylistItem } from '@/components/Playlist';
import { M3UItem } from '@/lib/m3u-parser';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DrmConfig {
  type: 'clearkey' | 'widevine';
  keyId?: string;
  key?: string;
  licenseServer?: string;
}

const Index = () => {
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [currentDrmConfig, setCurrentDrmConfig] = useState<DrmConfig | undefined>();
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(-1);

  const handlePlay = (url: string, drmConfig?: DrmConfig) => {
    setCurrentUrl(url);
    setCurrentDrmConfig(drmConfig);
    setIsPlayerVisible(true);
    setCurrentPlaylistIndex(-1);
  };

  const handleAddToPlaylist = (name: string, url: string, type: 'mpd' | 'hls' | 'mp4', drmConfig?: DrmConfig) => {
    const newItem: PlaylistItem = {
      id: Date.now().toString(),
      name,
      url,
      type,
      drmConfig,
    };
    setPlaylist((prev) => [...prev, newItem]);
  };

  const handleM3ULoaded = (items: M3UItem[]) => {
    const newItems: PlaylistItem[] = items.map((item, i) => ({
      id: `${Date.now()}-${i}`,
      name: item.name,
      url: item.url,
      type: item.url.includes('.m3u8') ? 'hls' : item.url.includes('.mpd') ? 'mpd' : 'mp4',
    }));
    setPlaylist((prev) => [...prev, ...newItems]);
  };

  const handlePlayFromPlaylist = useCallback((index: number) => {
    const item = playlist[index];
    if (item) {
      setCurrentUrl(item.url);
      setCurrentDrmConfig(item.drmConfig);
      setIsPlayerVisible(true);
      setCurrentPlaylistIndex(index);
    }
  }, [playlist]);

  const handleRemoveFromPlaylist = (index: number) => {
    setPlaylist((prev) => prev.filter((_, i) => i !== index));
    if (currentPlaylistIndex === index) {
      setCurrentPlaylistIndex(-1);
    } else if (currentPlaylistIndex > index) {
      setCurrentPlaylistIndex((prev) => prev - 1);
    }
  };

  const handleClearPlaylist = () => {
    setPlaylist([]);
    setCurrentPlaylistIndex(-1);
  };

  const handleVideoEnded = useCallback(() => {
    if (currentPlaylistIndex >= 0 && currentPlaylistIndex < playlist.length - 1) {
      handlePlayFromPlaylist(currentPlaylistIndex + 1);
    }
  }, [currentPlaylistIndex, playlist.length, handlePlayFromPlaylist]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
              <Film className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold gradient-text">StreamPlayer</h1>
              <p className="text-[10px] md:text-xs text-muted-foreground">MPD • HLS • MP4 • DRM</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Player Section - Sticky on desktop, fixed aspect ratio */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-20 space-y-4 md:space-y-6">
              {isPlayerVisible && currentUrl ? (
                <div className="animate-fade-in">
                  <VideoPlayer 
                    url={currentUrl} 
                    drmConfig={currentDrmConfig} 
                    onEnded={handleVideoEnded}
                  />
                </div>
              ) : (
                <div className="aspect-video bg-card rounded-2xl border border-border flex flex-col items-center justify-center animate-fade-in p-4 text-center">
                  <div className="p-4 md:p-6 rounded-full bg-secondary/50 mb-4 md:mb-6 animate-pulse-glow">
                    <Film className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold gradient-text mb-2">Ready to Stream</h2>
                  <p className="text-sm md:text-base text-muted-foreground max-w-md">
                    Enter a stream URL to start playing. Supports DASH/MPD with ClearKey & Widevine DRM, HLS, and MP4 formats.
                  </p>
                </div>
              )}

              {/* Features - Mobile friendly grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                {[
                  { title: 'DASH/MPD', desc: 'Adaptive streaming', icon: '📡' },
                  { title: 'DRM Support', desc: 'ClearKey & Widevine', icon: '🔐' },
                  { title: 'HLS & MP4', desc: 'Multiple formats', icon: '🎬' },
                ].map((feature) => (
                  <div
                    key={feature.title}
                    className="flex items-center sm:block p-3 md:p-4 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors"
                  >
                    <span className="text-xl sm:text-2xl mr-3 sm:mr-0 sm:mb-2 block">{feature.icon}</span>
                    <div>
                      <h3 className="font-semibold text-sm">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Controls Section - Separate scroll area */}
          <div className="lg:col-span-1">
            <ScrollArea className="h-[60vh] lg:h-[calc(100vh-8rem)] pr-2">
              <div className="space-y-4 md:space-y-6">
                <PlayerControls onPlay={handlePlay} onAddToPlaylist={handleAddToPlaylist} onM3ULoaded={handleM3ULoaded} />
                <Playlist
                  items={playlist}
                  currentIndex={currentPlaylistIndex}
                  onPlay={handlePlayFromPlaylist}
                  onRemove={handleRemoveFromPlaylist}
                  onClear={handleClearPlaylist}
                />
              </div>
            </ScrollArea>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-8 md:mt-16 py-6">
        <div className="container mx-auto px-4 text-center text-xs md:text-sm text-muted-foreground">
          <p>Powered by Shaka Player • Supports DASH, HLS, MP4 with DRM</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
