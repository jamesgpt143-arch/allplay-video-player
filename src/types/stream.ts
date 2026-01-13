export interface StreamItem {
  id: string;
  name: string;
  url: string;
  type: 'mpd' | 'hls' | 'mp4' | 'unknown';
  drmType?: 'clearkey' | 'widevine' | 'none';
  licenseUrl?: string;
  clearKeyId?: string;
  clearKeyValue?: string;
}

export interface M3UItem {
  name: string;
  url: string;
  logo?: string;
  group?: string;
}
