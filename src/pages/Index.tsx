import { useState, useCallback, useEffect } from 'react';
import { Film, Youtube } from 'lucide-react'; // Added Youtube icon
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

// 1. Dito natin ilalagay ang Channels mo (Pre-loaded)
const DEFAULT_CHANNELS: PlaylistItem[] = [
  {
    id: 'gma7',
    name: 'GMA 7',
    url: 'https://gsattv.akamaized.net/live/media0/gma7/Fairplay/gma7.m3u8',
    type: 'hls',
    // Wala itong DRM config dahil free stream
  },
  {
    id: 'GTV',
    name: 'GTV',
    url: 'https://converse.nathcreqtives.com/1143/manifest.mpd?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJHYW1heXBvdG90b3kiLCJpYXQiOjE3Njg0NDQ0NTgsImV4cCI6MTc2OTMwODQ1OCwiYWNjb3VudEV4cGlyZWQiOmZhbHNlLCJhY2NvdW50RXhwaXJlc0F0IjoxNzY5MzA4NDU4fQ.9dl-698RxGuhJMNNmVTuCUtU5aN-b8TpLL9aXXfaK_I',
    type: 'mpd',
    // Inayos natin ang DRM config para tumugma sa VideoPlayer props
    drmConfig: {
      type: 'clearkey',
      keyId: '31363232353335323435353337353331',
      key: '35416a68643065697575493337566135'
    }
  },
  {
    id: 'gma-youtube',
    name: 'GMA (Youtube Stream)',
    // Sa URL, ilalagay natin ang embed link
    url: 'https://www.youtube.com/embed/live_stream?channel=UCKL5hAuzgFQsyrsQKgU0Qng&autoplay=1', 
    type: 'youtube' as any, // Cast as any para hindi mag error sa types
  }
];

const Index = () => {
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [currentDrmConfig, setCurrentDrmConfig] = useState<DrmConfig | undefined>();
  // 2. Nagdagdag tayo ng currentType state para malaman kung VideoPlayer or Iframe ang gagamitin
  const [currentType, setCurrentType] = useState<string>(''); 
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  
  // 3. I-load ang DEFAULT_CHANNELS sa start
  const [playlist, setPlaylist] = useState<PlaylistItem[]>(DEFAULT_CHANNELS);
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(-1);

  // Updated handlePlay to accept type
  const handlePlay = (url: string, drmConfig?: DrmConfig, type: string = 'unknown') => {
    setCurrentUrl(url);
    setCurrentDrmConfig(drmConfig);
    setCurrentType(type);
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
      // @ts-ignore - ignore type error for 'youtube'
      setCurrentType(item.type);
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
    // Optional: Reset to default channels instead of empty
    setPlaylist(DEFAULT_CHANNELS); 
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
              <p className="text-[10px] md:text-xs text-muted-foreground">MPD • HLS • MP4 • YT</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Player Section */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-20 space-y-4 md:space-y-6">
              
              {isPlayerVisible && currentUrl ? (
                <div className="animate-fade-in w-full aspect-video bg-black rounded-xl overflow-hidden border border-border shadow-2xl">
                  {/* 4. Conditional Rendering: Iframe for YouTube, VideoPlayer for others */}
                  {currentType === 'youtube' ? (
                    <iframe 
                      src={currentUrl} 
                      className="w-full h-full border-0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    />
                  ) : (
                    <VideoPlayer 
                      url={currentUrl} 
                      drmConfig={currentDrmConfig} 
                      onEnded={handleVideoEnded}
                    />
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-card rounded-2xl border border-border flex flex-col items-center justify-center animate-fade-in p-4 text-center">
                  <div className="p-4 md:p-6 rounded-full bg-secondary/50 mb-4 md:mb-6 animate-pulse-glow">
                    <Film className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold gradient-text mb-2">Select a Channel</h2>
                  <p className="text-sm md:text-base text-muted-foreground max-w-md">
                    Choose a channel from the list on the right to start streaming.
                  </p>
                </div>
              )}

              {/* Features Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                {[
                  { title: 'Live TV', desc: 'GMA & GTV', icon: '📺' },
                  { title: 'DRM Support', desc: 'ClearKey Enabled', icon: '🔐' },
                  { title: 'YouTube', desc: 'Embedded Stream', icon: <Youtube className="w-5 h-5"/> },
                ].map((feature, i) => (
                  <div
                    key={i}
                    className="flex items-center sm:block p-3 md:p-4 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors"
                  >
                    <span className="text-xl sm:text-2xl mr-3 sm:mr-0 sm:mb-2 block text-primary">
                      {typeof feature.icon === 'string' ? feature.icon : feature.icon}
                    </span>
                    <div>
                      <h3 className="font-semibold text-sm">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Controls & Playlist Section */}
          <div className="lg:col-span-1">
            <ScrollArea className="h-[60vh] lg:h-[calc(100vh-8rem)] pr-2">
              <div className="space-y-4 md:space-y-6">
                <PlayerControls 
                  onPlay={(url, drm) => handlePlay(url, drm, 'custom')} 
                  onAddToPlaylist={handleAddToPlaylist} 
                  onM3ULoaded={handleM3ULoaded} 
                />
                <div className="bg-card/50 p-4 rounded-xl border border-border">
                   <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Channel List</h3>
                   <Playlist
                    items={playlist}
                    currentIndex={currentPlaylistIndex}
                    onPlay={handlePlayFromPlaylist}
                    onRemove={handleRemoveFromPlaylist}
                    onClear={handleClearPlaylist}
                  />
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-8 md:mt-16 py-6">
        <div className="container mx-auto px-4 text-center text-xs md:text-sm text-muted-foreground">
          <p>Powered by AllPlay • Supports DASH, HLS & YouTube</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
