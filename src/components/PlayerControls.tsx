import React, { useState, useRef } from 'react';
import { Play, Key, Link, Film, Radio, Shield, Plus, Upload, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { parseM3U, M3UItem } from '@/lib/m3u-parser';
import { toast } from 'sonner';

interface DrmConfig {
  type: 'clearkey' | 'widevine';
  keyId?: string;
  key?: string;
  licenseServer?: string;
}

interface PlayerControlsProps {
  onPlay: (url: string, drmConfig?: DrmConfig) => void;
  onAddToPlaylist?: (name: string, url: string, type: 'mpd' | 'hls' | 'mp4', drmConfig?: DrmConfig) => void;
  onM3ULoaded?: (items: M3UItem[]) => void;
}

const PlayerControls: React.FC<PlayerControlsProps> = ({ onPlay, onAddToPlaylist, onM3ULoaded }) => {
  const [url, setUrl] = useState('');
  const [m3uUrl, setM3uUrl] = useState('');
  const [streamType, setStreamType] = useState<'mpd' | 'hls' | 'mp4'>('mpd');
  const [drmType, setDrmType] = useState<'none' | 'clearkey' | 'widevine'>('none');
  const [keyId, setKeyId] = useState('');
  const [key, setKey] = useState('');
  const [licenseServer, setLicenseServer] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getDrmConfig = (): DrmConfig | undefined => {
    if (drmType === 'clearkey' && keyId && key) {
      return { type: 'clearkey', keyId, key };
    } else if (drmType === 'widevine' && licenseServer) {
      return { type: 'widevine', licenseServer };
    }
    return undefined;
  };

  const handlePlay = () => {
    if (!url) return;
    onPlay(url, getDrmConfig());
  };

  const handleAddToPlaylist = () => {
    if (!url || !onAddToPlaylist) return;
    const name = url.split('/').pop()?.split('?')[0] || 'Stream';
    onAddToPlaylist(name, url, streamType, getDrmConfig());
  };

  const handleLoadM3UUrl = async () => {
    if (!m3uUrl.trim()) {
      toast.error('Please enter an M3U URL');
      return;
    }

    try {
      const response = await fetch(m3uUrl);
      if (!response.ok) throw new Error('Failed to fetch M3U');
      
      const content = await response.text();
      const items = parseM3U(content);
      
      if (items.length === 0) {
        toast.error('No valid streams found in M3U');
        return;
      }

      onM3ULoaded?.(items);
      toast.success(`Loaded ${items.length} channels`);
      setM3uUrl('');
    } catch (err) {
      toast.error('Failed to load M3U playlist. Check CORS or URL.');
      console.error(err);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const items = parseM3U(content);
      
      if (items.length === 0) {
        toast.error('No valid streams found in M3U file');
        return;
      }

      onM3ULoaded?.(items);
      toast.success(`Loaded ${items.length} channels from file`);
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-card rounded-2xl p-6 border border-border animate-slide-up">
      <div className="space-y-6">
        {/* Stream Type Tabs */}
        <Tabs value={streamType} onValueChange={(v) => setStreamType(v as typeof streamType)}>
          <TabsList className="grid grid-cols-3 bg-secondary">
            <TabsTrigger value="mpd" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Film className="w-4 h-4" />
              MPD
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

        {/* Play Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handlePlay}
            disabled={!url}
            className="flex-1 h-12 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
          >
            <Play className="w-5 h-5 mr-2" />
            Play
          </Button>
          {onAddToPlaylist && (
            <Button
              onClick={handleAddToPlaylist}
              disabled={!url}
              variant="outline"
              className="h-12 px-4 border-primary/30 hover:bg-primary/10"
            >
              <Plus className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* M3U Playlist Import */}
        <div className="space-y-3 pt-4 border-t border-border">
          <Label className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            M3U Playlist
          </Label>
          
          <div className="flex gap-2">
            <Input
              value={m3uUrl}
              onChange={(e) => setM3uUrl(e.target.value)}
              placeholder="Enter M3U playlist URL..."
              className="flex-1 bg-secondary border-border"
            />
            <Button onClick={handleLoadM3UUrl} variant="secondary">
              <Link className="w-4 h-4" />
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".m3u,.m3u8"
            onChange={handleFileImport}
            className="hidden"
            id="m3u-file-input"
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import M3U File
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PlayerControls;
