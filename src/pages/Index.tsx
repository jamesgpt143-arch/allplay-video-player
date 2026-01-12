import { useState } from 'react';
import { Play, Film } from 'lucide-react';
import VideoPlayer from '@/components/VideoPlayer';
import PlayerControls from '@/components/PlayerControls';

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

  const handlePlay = (url: string, drmConfig?: DrmConfig) => {
    setCurrentUrl(url);
    setCurrentDrmConfig(drmConfig);
    setIsPlayerVisible(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
              <Film className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">StreamPlayer</h1>
              <p className="text-xs text-muted-foreground">MPD • HLS • MP4 • DRM</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Player Section */}
          <div className="lg:col-span-2 space-y-6">
            {isPlayerVisible && currentUrl ? (
              <div className="animate-fade-in">
                <VideoPlayer url={currentUrl} drmConfig={currentDrmConfig} />
                <div className="mt-4 p-4 bg-card rounded-xl border border-border">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5">
                      <Play className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm">Now Playing</h3>
                      <p className="text-xs text-muted-foreground truncate">{currentUrl}</p>
                      {currentDrmConfig && (
                        <span className="inline-block mt-2 px-2 py-1 bg-accent/10 text-accent rounded text-xs font-medium uppercase">
                          {currentDrmConfig.type} Protected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-card rounded-2xl border border-border flex flex-col items-center justify-center animate-fade-in">
                <div className="p-6 rounded-full bg-secondary/50 mb-6 animate-pulse-glow">
                  <Film className="w-16 h-16 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold gradient-text mb-2">Ready to Stream</h2>
                <p className="text-muted-foreground text-center max-w-md px-4">
                  Enter a stream URL to start playing. Supports DASH/MPD with ClearKey & Widevine DRM, HLS, and MP4 formats.
                </p>
              </div>
            )}

            {/* Features */}
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { title: 'DASH/MPD', desc: 'Adaptive streaming', icon: '📡' },
                { title: 'DRM Support', desc: 'ClearKey & Widevine', icon: '🔐' },
                { title: 'HLS & MP4', desc: 'Multiple formats', icon: '🎬' },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="p-4 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors"
                >
                  <span className="text-2xl mb-2 block">{feature.icon}</span>
                  <h3 className="font-semibold text-sm">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Controls Section */}
          <div className="lg:col-span-1">
            <PlayerControls onPlay={handlePlay} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Powered by Shaka Player • Supports DASH, HLS, MP4 with DRM</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
