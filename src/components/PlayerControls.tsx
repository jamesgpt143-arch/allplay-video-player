import React, { useState } from 'react';
import { Play, Key, Link, Film, Radio, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DrmConfig {
  type: 'clearkey' | 'widevine';
  keyId?: string;
  key?: string;
  licenseServer?: string;
}

interface PlayerControlsProps {
  onPlay: (url: string, drmConfig?: DrmConfig) => void;
}

const PlayerControls: React.FC<PlayerControlsProps> = ({ onPlay }) => {
  const [url, setUrl] = useState('');
  const [streamType, setStreamType] = useState<'mpd' | 'hls' | 'mp4'>('mpd');
  const [drmType, setDrmType] = useState<'none' | 'clearkey' | 'widevine'>('none');
  const [keyId, setKeyId] = useState('');
  const [key, setKey] = useState('');
  const [licenseServer, setLicenseServer] = useState('');

  const handlePlay = () => {
    if (!url) return;

    let drmConfig: DrmConfig | undefined;

    if (drmType === 'clearkey' && keyId && key) {
      drmConfig = { type: 'clearkey', keyId, key };
    } else if (drmType === 'widevine' && licenseServer) {
      drmConfig = { type: 'widevine', licenseServer };
    }

    onPlay(url, drmConfig);
  };

  const sampleStreams = [
    {
      name: 'Big Buck Bunny (MP4)',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      type: 'mp4' as const,
    },
    {
      name: 'Sintel (HLS)',
      url: 'https://bitmovin-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
      type: 'hls' as const,
    },
    {
      name: 'Tears of Steel (DASH)',
      url: 'https://dash.akamaized.net/envivio/EnvisiveDash2/manifest.mpd',
      type: 'mpd' as const,
    },
  ];

  return (
    <div className="bg-card rounded-2xl p-6 border border-border animate-slide-up">
      <div className="space-y-6">
        {/* Stream Type Tabs */}
        <Tabs value={streamType} onValueChange={(v) => setStreamType(v as typeof streamType)}>
          <TabsList className="grid grid-cols-3 bg-secondary">
            <TabsTrigger value="mpd" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Film className="w-4 h-4" />
              MPD/DASH
            </TabsTrigger>
            <TabsTrigger value="hls" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Radio className="w-4 h-4" />
              HLS
            </TabsTrigger>
            <TabsTrigger value="mp4" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Film className="w-4 h-4" />
              MP4
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mpd" className="mt-4">
            <div className="text-sm text-muted-foreground mb-3">
              Enter DASH/MPD stream URL with optional DRM protection
            </div>
          </TabsContent>
          <TabsContent value="hls" className="mt-4">
            <div className="text-sm text-muted-foreground mb-3">
              Enter HLS stream URL (.m3u8)
            </div>
          </TabsContent>
          <TabsContent value="mp4" className="mt-4">
            <div className="text-sm text-muted-foreground mb-3">
              Enter direct MP4 video URL
            </div>
          </TabsContent>
        </Tabs>

        {/* URL Input */}
        <div className="space-y-2">
          <Label htmlFor="url" className="flex items-center gap-2">
            <Link className="w-4 h-4 text-primary" />
            Stream URL
          </Label>
          <Input
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={`Enter ${streamType.toUpperCase()} URL...`}
            className="bg-secondary border-border focus:ring-primary"
          />
        </div>

        {/* DRM Settings (only for MPD) */}
        {streamType === 'mpd' && (
          <div className="space-y-4 p-4 bg-secondary/50 rounded-xl border border-border">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Shield className="w-4 h-4 text-primary" />
              DRM Protection
            </div>

            <Tabs value={drmType} onValueChange={(v) => setDrmType(v as typeof drmType)}>
              <TabsList className="grid grid-cols-3 bg-muted">
                <TabsTrigger value="none" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  None
                </TabsTrigger>
                <TabsTrigger value="clearkey" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  ClearKey
                </TabsTrigger>
                <TabsTrigger value="widevine" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Widevine
                </TabsTrigger>
              </TabsList>

              <TabsContent value="clearkey" className="mt-4 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="keyId" className="text-sm flex items-center gap-2">
                    <Key className="w-3 h-3 text-accent" />
                    Key ID (hex)
                  </Label>
                  <Input
                    id="keyId"
                    value={keyId}
                    onChange={(e) => setKeyId(e.target.value)}
                    placeholder="e.g., eb676abbcb345e96bbcf616630f1a3da"
                    className="bg-muted border-border text-sm font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="key" className="text-sm flex items-center gap-2">
                    <Key className="w-3 h-3 text-accent" />
                    Key (hex)
                  </Label>
                  <Input
                    id="key"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="e.g., 100b6c20940f779a4589152b57d2dacb"
                    className="bg-muted border-border text-sm font-mono"
                  />
                </div>
              </TabsContent>

              <TabsContent value="widevine" className="mt-4 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="license" className="text-sm flex items-center gap-2">
                    <Shield className="w-3 h-3 text-accent" />
                    License Server URL
                  </Label>
                  <Input
                    id="license"
                    value={licenseServer}
                    onChange={(e) => setLicenseServer(e.target.value)}
                    placeholder="https://license.server.com/..."
                    className="bg-muted border-border text-sm"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Play Button */}
        <Button
          onClick={handlePlay}
          disabled={!url}
          className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
        >
          <Play className="w-5 h-5 mr-2" />
          Play Stream
        </Button>

        {/* Sample Streams */}
        <div className="space-y-3">
          <Label className="text-muted-foreground text-sm">Sample Streams</Label>
          <div className="grid gap-2">
            {sampleStreams.map((stream) => (
              <button
                key={stream.name}
                onClick={() => {
                  setUrl(stream.url);
                  setStreamType(stream.type);
                  setDrmType('none');
                }}
                className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors text-left group"
              >
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium">{stream.name}</div>
                  <div className="text-xs text-muted-foreground uppercase">{stream.type}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerControls;
