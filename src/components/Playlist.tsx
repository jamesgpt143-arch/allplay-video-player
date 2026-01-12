import React from 'react';
import { Play, Trash2, GripVertical, ListMusic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface PlaylistItem {
  id: string;
  name: string;
  url: string;
  type: 'mpd' | 'hls' | 'mp4';
  drmConfig?: {
    type: 'clearkey' | 'widevine';
    keyId?: string;
    key?: string;
    licenseServer?: string;
  };
}

interface PlaylistProps {
  items: PlaylistItem[];
  currentIndex: number;
  onPlay: (index: number) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
}

const Playlist: React.FC<PlaylistProps> = ({
  items,
  currentIndex,
  onPlay,
  onRemove,
  onClear,
}) => {
  if (items.length === 0) {
    return (
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <ListMusic className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Playlist</span>
        </div>
        <div className="text-center py-8 text-muted-foreground text-sm">
          No items in playlist. Add streams to build your playlist.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <ListMusic className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Playlist ({items.length})</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-destructive"
        >
          Clear All
        </Button>
      </div>
      <ScrollArea className="h-[300px]">
        <div className="p-2 space-y-1">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors group ${
                index === currentIndex
                  ? 'bg-primary/20 border border-primary/30'
                  : 'hover:bg-secondary/50'
              }`}
              onClick={() => onPlay(index)}
            >
              {/* Hide drag handle on mobile to save space, show on lg */}
              <GripVertical className="hidden lg:block w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {index === currentIndex && (
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
                  )}
                  <span className={`text-sm truncate ${index === currentIndex ? 'font-medium text-primary' : ''}`}>
                    {item.name}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground uppercase">
                  {item.type}
                  {item.drmConfig && ` • ${item.drmConfig.type}`}
                </span>
              </div>

              {/* UPDATED: Buttons are visible by default on mobile/tablet, fade on desktop */}
              <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-primary/20 hover:text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlay(index);
                  }}
                >
                  <Play className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(index);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default Playlist;
